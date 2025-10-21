// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { signupRules, signinRules, validate } = require("../validators/authValidator");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// POST /api/auth/signup
router.post("/signup", signupRules, validate, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: "User with that email or username already exists" });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({ username, email, passwordHash });
    res.status(201).json({ message: "User created", user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("signup error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/signin
router.post("/signin", signinRules, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const payload = { userId: user._id.toString(), username: user.username, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    console.log(user);
    res.json({ token, user: payload });
  } catch (err) {
    console.error("signin error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
