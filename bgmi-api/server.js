const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./database');
const path = require('path');

// Brevo HTTP API ke liye fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 CORS FIXED - SAB FRONTENDS ALLOWED
app.use(cors({
  origin: [
    'https://bgmi-esports-app.onrender.com',     // ✅ MAIN FRONTEND
    'http://localhost:3000',                     // ✅ LOCAL DEV
    'http://localhost:3001',                     // ✅ LOCAL DEV 2
    'https://bgmi-admin-panel.onrender.com'      // ✅ ADMIN PANEL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// ✅ BGMI ID Generator
function generateBGMIId() {
  return `BGMI-${Math.floor(10000 + Math.random() * 90000)}`;
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

    console.log('OTP sent:', email, code, data.messageId);
    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('Brevo error:', err);
    return res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// ✅ Verify OTP + Register - AUTO BGMI ID
app.post('/auth/verify-otp', async (req, res) => {
  const { email, code, name, password } = req.body;
  if (!email || !code || !name || !password) {
    return res.status(400).json({ error: 'email, code, name, password required' });
  }

  await db.read();
  const otp = db.data.otps
    .slice()
    .reverse()
    .find((o) => o.email === email && o.code === code && o.used === 0);

  if (!otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (otp.expires_at < nowSeconds()) return res.status(400).json({ error: 'OTP expired' });

  otp.used = 1;

  const hash = bcrypt.hashSync(password, 10);
  const profileId = generateBGMIId();  // ✅ AUTO BGMI-21573
  const createdAt = new Date().toISOString();

  const user = {
    id: Date.now().toString(),
    profile_id: profileId,  // ✅ Save BGMI ID
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
      profile_id: profileId,  // ✅ Return to frontend
      name,
      email,
      created_at: createdAt,
    },
  });
});

// 🔥 TOURNAMENT ROUTES BHI ADD (admin panel ke liye)
app.get('/api/admin/joins', async (req, res) => {
  try {
    await db.read();
    const tournamentJoins = db.data.tournamentJoins || [];
    const sortedJoins = tournamentJoins.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    
    res.json({
      tournamentJoins: sortedJoins,
      totalEntries: sortedJoins.length,
      totalPrize: sortedJoins.reduce((sum, j) => sum + (j.entryFee || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ tournamentJoins: [], totalEntries: 0 });
  }
});

app.delete('/api/admin/tournament/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.read();
    
    const index = db.data.tournamentJoins?.findIndex(j => j.id === id);
    if (index !== -1) {
      const deleted = db.data.tournamentJoins.splice(index, 1)[0];
      await db.write();
      console.log('🗑️ DELETED:', deleted.playerName);
      return res.json({ success: true, message: `Deleted: ${deleted.playerName}` });
    }
    
    res.status(404).json({ error: 'Entry not found' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎮 BGMI MAIN SERVER: http://localhost:${PORT}`);
  console.log(`✅ REGISTER + OTP + ADMIN APIs LIVE`);
  console.log(`✅ CORS: https://bgmi-esports-app.onrender.com ✅`);
});
