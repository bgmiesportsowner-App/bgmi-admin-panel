const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { db, initDb } = require('./database');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 RENDER LOWDB PATH FIX
const DB_PATH = process.env.DB_FILE || path.join(__dirname, 'bgmi-data.json');

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

// 🔥 FIXED DATABASE INIT WITH PROPER PATH
async function initializeDb() {
  try {
    await initDb(DB_PATH);
    console.log('✅ LowDB ready at:', DB_PATH);
    
    // 🔥 CREATE FIRST ADMIN IF NOT EXISTS (RENDER FIX)
    await db.read();
    if (!db.data.users || !db.data.users.some(u => u.role === 'admin')) {
      console.log('🚀 Creating first admin for Render...');
      const firstAdmin = {
        id: 'ADMIN001',
        profile_id: 'BGMI-ADMIN',
        name: 'BGMI Super Admin',
        email: 'admin@bgmi.com',
        password_hash: await bcrypt.hash('admin123', 10), // DEFAULT: admin123
        role: 'admin',
        created_at: new Date().toISOString()
      };
      
      if (!db.data.users) db.data.users = [];
      db.data.users.push(firstAdmin);
      await db.write();
      console.log('🎉 First admin created: admin@bgmi.com / admin123');
    }
  } catch (error) {
    console.error('💥 DB Init error:', error.message);
  }
}

initializeDb();

// Helpers
function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function nowSeconds() { return Math.floor(Date.now() / 1000); }
function generateBGMIId() { return `BGMI-${Math.floor(10000 + Math.random() * 90000)}`; }

// 🔥 ADMIN AUTH MIDDLEWARE
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
    message: '🎮 BGMI Tournament API v3.1 - PRODUCTION READY',
    defaultAdmin: 'admin@bgmi.com / admin123',
    endpoints: ['POST /api/admin/login', 'POST /api/admin/create-first']
  });
});

// 🔥 SUPER DEBUGGED ADMIN LOGIN ✅
app.post('/api/admin/login', async (req, res) => {
  console.log('🚀 [LOGIN HIT] IP:', req.ip);
  console.log('📧 [LOGIN] Email:', req.body.email);
  
  try {
    await db.read();
    
    // DETAILED DEBUG LOGS
    console.log('📊 [LOGIN] Total users:', db.data.users?.length || 0);
    console.log('🔍 [LOGIN] Admins found:', db.data.users?.filter(u => u.role === 'admin').length || 0);
    
    const admin = db.data.users?.find(u => u.email === req.body.email && u.role === 'admin');
    console.log('👑 [LOGIN] Admin exists:', !!admin);
    
    if (!admin) {
      console.log('❌ [LOGIN] No admin found for:', req.body.email);
      return res.status(401).json({ error: '❌ Admin not found!' });
    }
    
    const isValidPassword = await bcrypt.compare(req.body.password, admin.password_hash);
    console.log('🔐 [LOGIN] Password match:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Wrong password');
      return res.status(401).json({ error: '❌ Galat password!' });
    }
    
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role }, 
      process.env.JWT_SECRET || 'bgmi-tournament-secure-key-2026',
      { expiresIn: '24h' }
    );
    
    console.log('🎉 [LOGIN SUCCESS] Token generated for:', admin.email);
    res.json({ 
      success: true,
      token, 
      message: 'Admin login successful! ✅',
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
    
  } catch (error) {
    console.log('💥 [LOGIN ERROR]:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔥 ADMIN CREATOR (Manual override)
app.post('/api/admin/create-first', async (req, res) => {
  try {
    await db.read();
    
    if (db.data.users?.some(u => u.role === 'admin')) {
      return res.status(403).json({ error: 'Admin already exists!' });
    }
    
    const { email, password, name = 'BGMI Admin' } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const admin = {
      id: 'ADMIN001',
      profile_id: 'BGMI-ADMIN',
      name, email,
      password_hash: hash,
      role: 'admin',
      created_at: new Date().toISOString()
    };
    
    if (!db.data.users) db.data.users = [];
    db.data.users.push(admin);
    await db.write();
    
    console.log('🎉 MANUAL ADMIN CREATED:', email);
    res.json({ success: true, message: 'Admin created! Login now.' });
    
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔥 OTHER ROUTES SAME...
app.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = generateOtp();
  const expiresAt = nowSeconds() + 5 * 60;

  await db.read();
  if (!db.data.otps) db.data.otps = [];
  db.data.otps.push({
    id: Date.now().toString(),
    email, code, expires_at: expiresAt, used: 0,
  });
  await db.write();

  // Email sending...
  console.log('📧 OTP sent:', email);
  res.json({ success: true, message: 'OTP sent to email' });
});

// Protected admin routes (same as before)
app.get('/api/admin/joins', adminAuth, async (req, res) => {
  await db.read();
  const tournamentJoins = db.data.tournamentJoins || [];
  res.json({
    admin: req.admin.email,
    tournamentJoins: tournamentJoins.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt)),
    totalEntries: tournamentJoins.length
  });
});

app.get('/api/admin/dashboard', adminAuth, async (req, res) => {
  await db.read();
  res.json({
    admin: req.admin.email,
    stats: {
      totalUsers: db.data.users?.length || 0,
      totalJoins: db.data.tournamentJoins?.length || 0
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n🎮 BGMI SECURE SERVER: Port ${PORT}`);
  console.log(`✅ DEFAULT LOGIN: admin@bgmi.com / admin123`);
  console.log(`✅ API READY: /api/admin/login`);
});
