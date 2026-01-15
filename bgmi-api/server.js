const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://bgmi-admin-panel.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: '✅ BGMI API LIVE - LOGIN READY',
    email: 'admin@bgmi.com',
    password: '123456'
  });
});

app.post('/api/admin/login', (req, res) => {
  console.log('🔥 LOGIN:', req.body);
  
  // ✅ ANY EMAIL + ANY PASSWORD = SUCCESS
  if (req.body.email && req.body.password) {
    const token = jwt.sign(
      { email: req.body.email || 'admin@bgmi.com' }, 
      'simple-secret',
      { expiresIn: '24h' }
    );
    
    console.log('✅ LOGIN SUCCESS');
    res.json({
      success: true,
      token,
      admin: { 
        id: '1', 
        email: req.body.email || 'admin@bgmi.com', 
        name: 'Super Admin' 
      }
    });
  } else {
    res.status(400).json({ error: 'Email/password required' });
  }
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    message: '✅ DASHBOARD WORKING!',
    stats: { users: 100, tournaments: 50 }
  });
});

app.listen(PORT, () => {
  console.log('🎮 SERVER LIVE ON PORT', PORT);
});
