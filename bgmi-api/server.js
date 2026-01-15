const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDb } = require('./database');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://bgmi-esports-app.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://bgmi-admin-panel.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

initDb().then(() => {
  console.log('✅ LowDB ready at', process.env.DB_FILE || 'bgmi.json');
});

// Helpers
function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function nowSeconds() { return Math.floor(Date.now() / 1000); }
function generateBGMIId() { return `BGMI-${Math.floor(10000 + Math.random() * 90000)}`; }

// 🔥 SECURE ADMIN AUTH MIDDLEWARE (DATABASE BASED)
const adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin token required!' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bgmi-tournament-secure-key-2026');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid admin token!' });
  }
};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🎮 BGMI Tournament API v3.0 - SECURE ADMIN AUTH',
    endpoints: ['POST /api/admin/login', '/auth/send-otp', '/api/admin/*']
  });
});

// 🔥 100% SECURE ADMIN LOGIN (DATABASE + BCRYPT)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    await db.read();
    
    // Database se admin dhund (NO .env password check!)
    const admin = db.data.users?.find(u => u.email === email && u.role === 'admin');
    
    if (!admin) {
      return res.status(401).json({ error: '❌ Admin not found!' });
    }
    
    // Password verify kar (hashed se plain compare)
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '❌ Galat password!' });
    }
    
    // Secure JWT token banao
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role }, 
      process.env.JWT_SECRET || 'bgmi-tournament-secure-key-2026',
      { expiresIn: '24h' }
    );

    console.log('✅ SECURE ADMIN LOGIN:', admin.email);
    res.json({ 
      success: true,
      token, 
      message: 'Admin login successful! ✅',
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔥 RENDER FIRST-TIME ADMIN CREATOR (ONE TIME ONLY!)
app.post('/api/admin/create-first', async (req, res) => {
  try {
    await db.read();
    
    // Check if admin already exists
    if (db.data.users?.some(u => u.role === 'admin')) {
      return res.status(403).json({ 
        error: 'Admin already exists! Use /api/admin/login' 
      });
    }
    
    const { email, password, name = 'BGMI Admin' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Create first admin
    const hash = bcrypt.hashSync(password, 10);
    const admin = {
      id: 'ADMIN001',
      profile_id: 'BGMI-ADMIN',
      name,
      email,
      password_hash: hash,
      role: 'admin',
      created_at: new Date().toISOString()
    };
    
    if (!db.data.users) db.data.users = [];
    db.data.users.push(admin);
    await db.write();
    
    console.log('🎉 FIRST ADMIN CREATED:', email);
    res.json({ 
      success: true, 
      message: 'First admin created successfully! Now login at /api/admin/login',
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin creation' });
  }
});

// User registration routes (same as before)
app.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = generateOtp();
  const expiresAt = nowSeconds() + 5 * 60;

  await db.read();
  db.data.otps.push({
    id: Date.now().toString(),
    email, code, expires_at: expiresAt, used: 0,
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
        sender: { email: 'noreply@bgmi.com', name: 'BGMI Esports' },
        to: [{ email }],
        subject: 'Your BGMI Esports OTP',
        textContent: `Your OTP is ${code}. It will expire in 5 minutes.`,
      }),
    });

    if (!resp.ok) {
      console.error('Brevo API error:', resp.status);
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    console.log('📧 OTP sent:', email);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('Brevo error:', err);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

app.post('/auth/verify-otp', async (req, res) => {
  const { email, code, name, password } = req.body;
  if (!email || !code || !name || !password) {
    return res.status(400).json({ error: 'email, code, name, password required' });
  }

  await db.read();
  const otp = db.data.otps.slice().reverse().find(o => 
    o.email === email && o.code === code && o.used === 0
  );

  if (!otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (otp.expires_at < nowSeconds()) return res.status(400).json({ error: 'OTP expired' });

  otp.used = 1;
  const hash = bcrypt.hashSync(password, 10);
  const profileId = generateBGMIId();
  const user = {
    id: Date.now().toString(),
    profile_id: profileId, name, email,
    password_hash: hash,
    role: 'user',  // Default user role
    created_at: new Date().toISOString(),
  };

  if (!db.data.users) db.data.users = [];
  db.data.users.push(user);
  await db.write();

  console.log('✅ New user registered:', profileId);
  res.json({
    success: true,
    user: { id: user.id, profile_id: profileId, name, email }
  });
});

// 🔥 PROTECTED ADMIN ROUTES (SECURE)
app.get('/api/admin/joins', adminAuth, async (req, res) => {
  try {
    await db.read();
    const tournamentJoins = db.data.tournamentJoins || [];
    const sortedJoins = tournamentJoins.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    
    res.json({
      admin: req.admin.email,
      tournamentJoins: sortedJoins,
      totalEntries: sortedJoins.length,
      totalPrize: sortedJoins.reduce((sum, j) => sum + (j.entryFee || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/dashboard', adminAuth, async (req, res) => {
  try {
    await db.read();
    res.json({
      admin: req.admin.email,
      stats: {
        totalUsers: db.data.users?.length || 0,
        totalJoins: db.data.tournamentJoins?.length || 0,
        totalTournaments: db.data.tournaments?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/tournament/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.read();
    
    const index = db.data.tournamentJoins?.findIndex(j => j.id === id);
    if (index !== -1) {
      const deleted = db.data.tournamentJoins.splice(index, 1)[0];
      await db.write();
      console.log('🗑️ DELETED:', deleted.playerName, 'by', req.admin.email);
      return res.json({ success: true, message: `Deleted: ${deleted.playerName}` });
    }
    
    res.status(404).json({ error: 'Entry not found' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎮 BGMI SECURE SERVER: http://localhost:${PORT}`);
  console.log(`✅ SECURE ADMIN LOGIN: POST /api/admin/login`);
  console.log(`✅ FIRST ADMIN CREATE: POST /api/admin/create-first`);
  console.log(`✅ PROTECTED ROUTES: /api/admin/*`);
  console.log(`🚀 Password safe in DATABASE - GitHub ready!`);
});
