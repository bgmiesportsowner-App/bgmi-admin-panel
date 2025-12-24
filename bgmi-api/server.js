// bgmi-api/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

// -------------------- Mail setup (Gmail + App Password) --------------------
const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Helper: random 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: create next Profile ID like BGMI-0001
function generateProfileId(callback) {
  db.get(
    "SELECT profile_id FROM users ORDER BY id DESC LIMIT 1",
    [],
    (err, row) => {
      if (err) return callback(err);

      if (!row || !row.profile_id) {
        return callback(null, "BGMI-0001");
      }

      const parts = row.profile_id.split("-");
      const num = parseInt(parts[1] || "0", 10) + 1;
      const next = `BGMI-${String(num).padStart(4, "0")}`;
      callback(null, next);
    }
  );
}

// -------------------- Routes --------------------

// Test route
app.get("/", (req, res) => {
  res.json({ ok: true, message: "BGMI API running" });
});

// 1) Send OTP to email
app.post("/auth/send-otp", (req, res) => {
  const { email } = req.body;
  console.log("SEND-OTP called for:", email);

  if (!email) {
    return res.status(400).json({ ok: false, message: "Email is required" });
  }

  // Pehle check karo email users table me hai ya nahi
  db.get(
    "SELECT id FROM users WHERE email = ?",
    [email],
    (err, existing) => {
      console.log("Existing row:", existing);

      if (err) {
        console.error("Error checking email before OTP:", err);
        return res
          .status(500)
          .json({ ok: false, message: "Database error" });
      }

      if (existing) {
        // Yahin OTP send hi nahi hoga
        return res
          .status(400)
          .json({ ok: false, message: "Email already registered" });
      }

      // Agar email new hai tabhi OTP bhejo
      const code = generateOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      db.serialize(() => {
        db.run("UPDATE otps SET used = 1 WHERE email = ?", [email]);

        db.run(
          "INSERT INTO otps (email, code, expires_at, used) VALUES (?, ?, ?, 0)",
          [email, code, expiresAt],
          (insertErr) => {
            if (insertErr) {
              console.error("Error saving OTP:", insertErr);
              return res
                .status(500)
                .json({ ok: false, message: "Failed to generate OTP" });
            }

            mailer.sendMail(
              {
                from: `"BGMI Esports" <${process.env.MAIL_USER}>`,
                to: email,
                subject: "Your BGMI Esports OTP Code",
                text: `Your verification code is ${code}. It will expire in 5 minutes.`,
              },
              (mailErr) => {
                if (mailErr) {
                  console.error("Error sending OTP email:", mailErr);
                  return res
                    .status(500)
                    .json({ ok: false, message: "Failed to send OTP email" });
                }

                return res.json({
                  ok: true,
                  message: "OTP sent to email",
                });
              }
            );
          }
        );
      });
    }
  );
});

// 2) Verify OTP + create user
app.post("/auth/verify-otp", (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!name || !email || !password || !otp) {
    return res
      .status(400)
      .json({ ok: false, message: "Name, email, password, OTP required" });
  }

  // Check OTP
  db.get(
    "SELECT * FROM otps WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1",
    [email, otp],
    (err, row) => {
      if (err) {
        console.error("Error reading OTP:", err);
        return res
          .status(500)
          .json({ ok: false, message: "Failed to verify OTP" });
      }

      if (!row) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid OTP or already used" });
      }

      if (Date.now() > row.expires_at) {
        return res
          .status(400)
          .json({ ok: false, message: "OTP expired, please request new one" });
      }

      // Mark OTP used
      db.run("UPDATE otps SET used = 1 WHERE id = ?", [row.id]);

      // Safety: email already registered to nahi
      db.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        (userErr, existing) => {
          if (userErr) {
            console.error("Error checking user:", userErr);
            return res
              .status(500)
              .json({ ok: false, message: "Database error" });
          }

          if (existing) {
            return res
              .status(400)
              .json({ ok: false, message: "Email already registered" });
          }

          // Generate profile ID then insert user
          generateProfileId((pidErr, profileId) => {
            if (pidErr) {
              console.error("Error generating profile ID:", pidErr);
              return res
                .status(500)
                .json({ ok: false, message: "Failed to create user" });
            }

            const passwordHash = bcrypt.hashSync(password, 10);
            const createdAt = new Date().toISOString();

            db.run(
              "INSERT INTO users (profile_id, name, email, password_hash, password_plain, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              [profileId, name, email, passwordHash, password, createdAt],
              function (insertErr) {
                if (insertErr) {
                  console.error("Error inserting user:", insertErr);
                  return res
                    .status(500)
                    .json({ ok: false, message: "Failed to create user" });
                }

                const user = {
                  id: this.lastID,
                  profile_id: profileId,
                  name,
                  email,
                  created_at: createdAt,
                };

                return res.json({
                  ok: true,
                  message: "User created successfully",
                  user,
                });
              }
            );
          });
        }
      );
    }
  );
});

// 3) Login (email + password)
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Email and password required" });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error("Error reading user:", err);
      return res.status(500).json({ ok: false, message: "Database error" });
    }

    if (!user) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid email or password" });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid email or password" });
    }

    const safeUser = {
      id: user.id,
      profile_id: user.profile_id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };

    return res.json({
      ok: true,
      message: "Login successful",
      user: safeUser,
    });
  });
});

// 4) Admin: get all users (with plain password)
app.get("/admin/users", (req, res) => {
  db.all(
    "SELECT id, profile_id, name, email, password_plain, created_at FROM users ORDER BY id ASC",
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res
          .status(500)
          .json({ ok: false, message: "Failed to fetch users" });
      }

      return res.json({ ok: true, users: rows });
    }
  );
});

// 5) Admin: delete one user by id (PERMANENT)
app.delete("/admin/users/:id", (req, res) => {
  const userId = req.params.id;

  db.run(
    "DELETE FROM users WHERE id = ?",
    [userId],
    function (err) {
      if (err) {
        console.error("Error deleting user:", err);
        return res
          .status(500)
          .json({ ok: false, message: "Failed to delete user" });
      }

      if (this.changes === 0) {
        return res
          .status(404)
          .json({ ok: false, message: "User not found" });
      }

      return res.json({
        ok: true,
        message: "User deleted successfully",
      });
    }
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BGMI API running on http://localhost:${PORT}`);
});
