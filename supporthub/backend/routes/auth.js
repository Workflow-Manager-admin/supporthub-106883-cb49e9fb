const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// PUBLIC_INTERFACE
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  // For demo, allow both agent and user, requires: name, email, password, role
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: "Fill all fields" });
    if (!['user', 'agent'].includes(role)) return res.status(400).json({ error: "Invalid role" });
    if (await User.findOne({ email })) return res.status(400).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash, role });
    await user.save();

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = user.name;

    return res.json({ user: { name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

// PUBLIC_INTERFACE
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const valid = await user.validatePassword(password);
    if (!valid) return res.status(400).json({ error: "Invalid email or password" });

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = user.name;
    return res.json({
      user: { name: user.name, role: user.role, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// PUBLIC_INTERFACE
// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.json({ status: 'logged out' });
});

// PUBLIC_INTERFACE
// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ error: "Invalid session user" });
  res.json({
    user: { name: user.name, role: user.role, email: user.email }
  });
});

module.exports = router;
