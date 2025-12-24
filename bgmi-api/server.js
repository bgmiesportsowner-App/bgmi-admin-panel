// bgmi-api/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./database');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// DB init
initDb().then(() => console.log('LowDB ready at', process.env.DB_FILE || 'bgmi.json'));

// Helpers
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

// Health
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BGMI API running' });
});

// Send OTP
app.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = generateOtp();
  const expiresAt = nowSeconds() + 5 * 60;

  await db.read();
  db.data.otps.push({
    id: Date.now().toString(),
    email,
    code,
    expires_at: expiresAt,
    used: 0
  });
  await db.write();

  console.log('OTP generated for', email, code);

  res.json({
    success: true,
    message: 'OTP generated',
    dev_otp: code
  });
});

// Verify OTP + Register
app.post('/auth/verify-otp', async (req, res) => {
  const { email, code, name, password } = req.body;

  if (!email || !code || !name || !password) {
    return res
      .status(400)
      .json({ error: 'email, code, name, password required' });
  }

  await db.read();
  const otp = db.data.otps
    .slice()
    .reverse()
    .find((o) => o.email === email && o.code === code && o.used === 0);

  if (!otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (otp.expires_at < nowSeconds())
    return res.status(400).json({ error: 'OTP expired' });

  otp.used = 1;

  const hash = bcrypt.hashSync(password, 10);
  const profileId = 'BGMI-' + Math.floor(100000 + Math.random() * 900000);
  const createdAt = new Date().toISOString();

  const user = {
    id: Date.now().toString(),
    profile_id: profileId,
    name,
    email,
    password_hash: hash,
    password_plain: password,
    created_at: createdAt
  };

  db.data.users.push(user);
  await db.write();

  res.json({
    success: true,
    user: {
      id: user.id,
      profile_id: profileId,
      name,
      email,
      created_at: createdAt
    }
  });
});

// Admin: list users
app.get('/admin/users', async (req, res) => {
  await db.read();
  const list = db.data.users
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  res.json(list);
});

// Admin: delete user
app.delete('/admin/users/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const before = db.data.users.length;
  db.data.users = db.data.users.filter((u) => u.id !== id);
  if (db.data.users.length === before) {
    return res.status(404).json({ error: 'User not found' });
  }
  await db.write();
  res.json({ success: true });
});

// Admin: login
app.post('/auth/admin-login', (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false, error: 'Invalid creds' });
});

// Static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`BGMI API running on port ${PORT}`);
});
