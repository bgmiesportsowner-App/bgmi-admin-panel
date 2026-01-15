const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://bgmi-admin-panel.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// 🔥 HARDCODED ADMIN - 100% WORKING
const ADMIN_USERS = [
  {
    id: 'ADMIN001',
    email: 'admin@bgmi.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    name: 'BGMI Super Admin',
    role: 'admin'
  }
];

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: '🚀 BGMI API LIVE', 
    admin: 'admin@bgmi.com / password',  // ✅ FIXED
    login: 'POST /api/admin/login'
  });
});

// 🔥 PERFECT ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
  console.log('🔥 LOGIN ATTEMPT:', req.body.email);
  
  const { email, password } = req.body;
  
  // Find admin
  const admin = ADMIN_USERS.find(u => u.email === email);
  
  console.log('👑 ADMIN FOUND:', !!admin);
  
  if (!admin) {
    console.log('❌ NO ADMIN');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Check password
  const isValid = await bcrypt.compare(password, admin.password_hash);
  console.log('🔐 PASSWORD OK:', isValid);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create token
  const token = jwt.sign(
    { id: admin.id, email: admin.email }, 
    'bgmi-tournament-secure-key-2026',
    { expiresIn: '7d' }
  );
  
  console.log('✅ LOGIN SUCCESS:', email);
  
  res.json({ 
    success: true, 
    token, 
    admin: { id: admin.id, email: admin.email, name: admin.name }
  });
});

// Dummy data for dashboard
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    stats: {
      totalUsers: 125,
      totalJoins: 89,
      totalTournaments: 12
    }
  });
});

app.listen(PORT, () => {
  console.log(`🎮 BGMI API on port ${PORT}`);
  console.log('✅ Login: admin@bgmi.com / password');
});
