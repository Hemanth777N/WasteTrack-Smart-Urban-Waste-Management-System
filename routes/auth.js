const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const router = express.Router();

// POST /api/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const [result] = await pool.query(
      `INSERT INTO Employee (name, email, password, role, status)
       VALUES (?, ?, ?, 'Employee', 'Active')`,
      [name, email, hashedPassword]
    );
    res.json({ message: "Registration successful", emp_id: result.insertId });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already exists" });
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  try {
    const [rows] = await pool.query("SELECT emp_id, password, role, dept_id, name FROM Employee WHERE email = ?", [email]);
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    req.session.emp_id = user.emp_id;
    req.session.role = user.role;
    req.session.dept_id = user.dept_id;
    req.session.name = user.name;

    res.json({ message: "Login successful", role: user.role, name: user.name });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});

// GET /api/me
router.get("/me", (req, res) => {
  if (!req.session || !req.session.emp_id) return res.status(401).json({ error: "Not authenticated" });
  res.json({ emp_id: req.session.emp_id, role: req.session.role, dept_id: req.session.dept_id, name: req.session.name });
});

module.exports = router;
