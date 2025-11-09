// routes/employees.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Make sure you have 'bcryptjs' installed
const pool = require('../db');
const { checkAuth } = require("../middleware/auth"); // Optional: for security
const SALT_ROUNDS = 10;

// Register (from new auth form)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, join_date, email, password, dept_id, role, emp_code } = req.body;
    
    if (!name || !email || !password || !role || !dept_id) {
        return res.status(400).json({ error: 'Name, email, password, role, and department are required' });
    }

    // check existing
    const [[exists]] = await pool.query('SELECT emp_id FROM employee WHERE email = ?', [email]);
    if (exists) return res.status(400).json({ error: 'Email already used' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const [result] = await pool.query(
      `INSERT INTO employee (name, contact, join_date, email, password, dept_id, role, emp_code, status) VALUES (?,?,?,?,?,?,?,?, 'Active')`,
      [name, phone||null, join_date||null, email, hash, dept_id, role, emp_code||null]
    );
    
    const empId = result.insertId;
    const [[employee]] = await pool.query('SELECT emp_id, name, email, role, dept_id FROM employee WHERE emp_id = ?', [empId]);
    res.json(employee);
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'registration failed' });
  }
});

// Login (replaces old /api/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    
    const [rows] = await pool.query('SELECT * FROM employee WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // --- SESSION LOGIC (from your old routes/auth.js) ---
    req.session.emp_id = user.emp_id;
    req.session.role = user.role;
    req.session.dept_id = user.dept_id;
    req.session.name = user.name;
    // --- END SESSION LOGIC ---

    // don't return password hash
    const safe = {
      emp_id: user.emp_id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept_id: user.dept_id
    };
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'login failed' });
  }
});

// List employees for Head dashboard
router.get('/', checkAuth, async (req, res) => {
  // Simple security check
  if (req.session.role !== 'Head') {
      return res.status(403).json({ error: 'Not authorized' });
  }
  
  try {
    const { q, dept_id } = req.query;
    let sql = `SELECT e.emp_id, e.name, e.email, e.role, e.dept_id, d.name AS department_name 
               FROM employee e 
               LEFT JOIN department d ON e.dept_id = d.dept_id 
               WHERE 1=1 `;
    const params = [];
    if (q) {
      sql += ' AND (e.name LIKE ? OR e.email LIKE ? OR e.emp_code LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (dept_id) {
      sql += ' AND e.dept_id = ?';
      params.push(dept_id);
    }
    sql += ' ORDER BY e.emp_id DESC LIMIT 1000';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to list employees' });
  }
});

// Update role (for Head)
router.put('/:id/role', checkAuth, async (req, res) => {
  // Simple security check
  if (req.session.role !== 'Head') {
      return res.status(403).json({ error: 'Not authorized' });
  }

  try {
    const empId = req.params.id;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'role required' });
    
    const allowed = ['Employee','Manager','Admin','Head'];
    if (!allowed.includes(role)) return res.status(400).json({ error: 'invalid role' });

    await pool.query('UPDATE employee SET role = ? WHERE emp_id = ?', [role, empId]);
    const [[employee]] = await pool.query('SELECT emp_id, name, email, role, dept_id FROM employee WHERE emp_id = ?', [empId]);
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update failed' });
  }
});

// Delete employee (for Head)
router.delete('/:id', checkAuth, async (req, res) => {
  // Simple security check
  if (req.session.role !== 'Head') {
      return res.status(403).json({ error: 'Not authorized' });
  }
  
  try {
    const empId = req.params.id;
    await pool.query('DELETE FROM employee WHERE emp_id = ?', [empId]);
    res.json({ ok: true, message: 'Employee deleted' });
  } catch (err) {
    console.error(err);
    // Check for foreign key constraint error
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'Cannot delete employee. They are referenced by complaints or other records.' });
    }
    res.status(500).json({ error: 'delete failed' });
  }
});

// --- ADDED THIS BACK ---
// GET /me (for checking login status on page load)
router.get("/me", checkAuth, (req, res) => {
  // checkAuth middleware already verified session
  res.json({
    emp_id: req.session.emp_id,
    role: req.session.role,
    dept_id: req.session.dept_id,
    name: req.session.name
  });
});

// --- ADDED THIS BACK ---
// POST /logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.json({ message: "Logout successful" });
  });
});


module.exports = router;