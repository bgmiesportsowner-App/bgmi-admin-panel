// bgmi-api/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const db = require('./database'); // ./database.js
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------- Helpers ----------
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

// ---------- Health check ----------
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BGMI API running' });
});

// ---------- Send OTP ----------
app.post('/auth/send-otp', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const code = generateOtp();
  const expiresAt = nowSeconds() + 5 * 60; // 5 minutes

  const insertSql =
    'INSERT INTO otps (email, code, expires_at, used) VALUES (?, ?, ?, 0)';

  db.run(insertSql, [email, code, expiresAt], function (err) {
    if (err) {
      console.error('OTP insert error:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }

    // TODO: production me email bhejna; abhi dev ke liye console + response
    console.log('OTP generated for', email, code);

    res.json({
      success: true,
      message: 'OTP generated',
      dev_otp: code, // production me hata dena
    });
  });
});

// ---------- Verify OTP + Register ----------
app.post('/auth/verify-otp', (req, res) => {
  const { email, code, name, password } = req.body;

  if (!email || !code || !name || !password) {
    return res
      .status(400)
      .json({ error: 'email, code, name, password required' });
  }

  const sql =
    'SELECT * FROM otps WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1';

  db.get(sql, [email, code], (err, row) => {
    if (err) {
      console.error('OTP lookup error:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }

    if (!row) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (row.expires_at < nowSeconds()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    // mark used
    db.run('UPDATE otps SET used = 1 WHERE id = ?', [row.id]);

    // create user
    const hash = bcrypt.hashSync(password, 10);
    const profileId = 'BGMI-' + Math.floor(100000 + Math.random() * 900000);

    const insertUserSql = `
      INSERT INTO users (profile_id, name, email, password_hash, password_plain, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const createdAt = new Date().toISOString();

    db.run(
      insertUserSql,
      [profileId, name, email, hash, password, createdAt],
      function (userErr) {
        if (userErr) {
          console.error('User insert error:', userErr.message);
          return res.status(500).json({ error: 'User create failed' });
        }

        res.json({
          success: true,
          user: {
            id: this.lastID,
            profile_id: profileId,
            name,
            email,
            created_at: createdAt,
          },
        });
      }
    );
  });
});

// ---------- Admin: list users ----------
app.get('/admin/users', (req, res) => {
  const sql =
    'SELECT id, profile_id, name, email, created_at FROM users ORDER BY id DESC';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Users fetch error:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(rows);
  });
});

// ---------- Admin: delete user ----------
app.delete('/admin/users/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('User delete error:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  });
});

// ---------- Admin: login ----------
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

// ---------- Static (optional) ----------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`BGMI API running on port ${PORT}`);
});
