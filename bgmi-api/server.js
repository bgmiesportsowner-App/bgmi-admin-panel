const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./database');
const path = require('path');

// Brevo HTTP API ke liye fetch (CommonJS compatible)
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

initDb().then(() => {
  console.log('LowDB ready at', process.env.DB_FILE || 'bgmi.json');
});

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

// Send OTP (Brevo HTTP API)
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
    used: 0,
  });
  await db.write();

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: process.env.MAIL_USER, name: 'BGMI Esports' },
        to: [{ email }],
        subject: 'Your BGMI Esports OTP',
        textContent: `Your OTP is ${code}. It will expire in 5 minutes.`,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('Brevo API error:', resp.status, data);
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    console.log('OTP email sent via Brevo API', email, code, data.messageId);
    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('Brevo API request error:', err);
    return res.status(500).json({ error: 'Failed to send OTP email' });
  }
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
    created_at: createdAt,
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
      created_at: createdAt,
    },
  });
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  await db.read();
  const user = db.data.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || user.password_plain !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      profile_id: user.profile_id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    },
  });
});

// Admin users list
app.get('/admin/users', async (req, res) => {
  await db.read();
  const list = db.data.users
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  res.json(list);
});

// Admin delete user
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

// Admin login
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
