const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/filter/complaints?status=Open&date=2025-10-24
router.get('/complaints', async (req, res) => {
  // Added 'date'
  const { dept_id, route_id, status, date } = req.query;
  
  let sql = `
    SELECT 
      c.complaint_id, c.citizen_name, c.contact_no, c.status, c.location, c.description, c.complaint_date,
      d.name AS department_name, 
      r.route_name, 
      e.name AS assigned_employee,
      c.assigned_emp 
    FROM complaints c
    LEFT JOIN department d ON c.dept_id = d.dept_id
    LEFT JOIN route r ON c.route_id = r.route_id
    LEFT JOIN employee e ON c.assigned_emp = e.emp_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (dept_id) { 
    sql += ' AND c.dept_id = ?'; 
    params.push(dept_id); 
  }
  if (route_id) { 
    sql += ' AND c.route_id = ?'; 
    params.push(route_id); 
  }
  if (status) { 
    sql += ' AND c.status = ?'; 
    params.push(status); 
  }
  // --- NEW DATE FILTER ---
  if (date) {
    // This query finds all complaints from the start of the selected day
    sql += ' AND DATE(c.complaint_date) = ?';
    params.push(date);
  }
  
  sql += ' ORDER BY c.complaint_id DESC LIMIT 500';
  
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Filter query error:", err);
    res.status(500).json({ error: 'filter query error' });
  }
});

module.exports = router;