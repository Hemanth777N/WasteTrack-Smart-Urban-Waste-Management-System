const express = require("express");
const pool = require("../db");
const { checkAuth, checkManager } = require("../middleware/auth");
const router = express.Router();

// GET /api/complaints
router.get("/complaints", async (req, res) => {
  try {
    let sql = `SELECT c.*, r.route_name
               FROM Complaints c
               LEFT JOIN Route r ON c.route_id = r.route_id`;
    const params = [];

    if (req.session && req.session.emp_id) {
      if (req.session.role === "Manager") {
        sql += " WHERE c.dept_id = ?";
        params.push(req.session.dept_id);
      } else if (req.session.role === "Employee") {
        sql += " WHERE c.assigned_emp = ?";
        params.push(req.session.emp_id);
      }
    }

    sql += " ORDER BY c.complaint_id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/complaints
router.post("/complaints", async (req, res) => {
  const { citizen_name, contact_no, location, description, route_id, dept_id } = req.body;
  if (!citizen_name || !contact_no || !description || !dept_id) {
    return res.status(400).json({ error: "Name, contact, description, and department are required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [employees] = await connection.query(
      `SELECT e.emp_id, COUNT(c.complaint_id) AS task_count
       FROM Employee e
       LEFT JOIN Complaints c ON e.emp_id = c.assigned_emp AND c.status IN ('Open','In Progress')
       WHERE e.dept_id = ? AND e.role = 'Employee'
       GROUP BY e.emp_id
       ORDER BY task_count ASC
       LIMIT 1`,
      [dept_id]
    );

    if (employees.length === 0) {
      await connection.rollback();
      return res.status(500).json({ error: "No available employees in that department" });
    }
    const bestEmployeeId = employees[0].emp_id;

    const [result] = await connection.query(
      `INSERT INTO Complaints (citizen_name, contact_no, location, description, route_id, dept_id, assigned_emp, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'In Progress')`,
      [ citizen_name, contact_no, location || 'N/A', description, route_id || null, dept_id, bestEmployeeId ]
    );

    await connection.commit();
    res.json({ message: "Inserted", complaint_id: result.insertId });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error inserting complaint:", err);
    res.status(500).json({ error: "Insert failed" });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/complaints/:id/status
router.put("/complaints/:id/status", checkAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });
  if (status === "Closed" && req.session.role !== "Manager") return res.status(403).json({ error: "Only managers can close tasks" });
  try {
    await pool.query("UPDATE Complaints SET status = ? WHERE complaint_id = ?", [status, id]);
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// PUT /api/complaints/:id/assign
router.put("/complaints/:id/assign", checkAuth, checkManager, async (req, res) => {
  const { id } = req.params;
  const { emp_id } = req.body;
  if (!emp_id) return res.status(400).json({ error: "Employee ID is required" });
  try {
    await pool.query("UPDATE Complaints SET assigned_emp = ?, status = 'In Progress' WHERE complaint_id = ?", [emp_id, id]);
    res.json({ message: "Re-assigned successfully" });
  } catch (err) {
    console.error("Error re-assigning:", err);
    res.status(500).json({ error: "Re-assign failed" });
  }
});

module.exports = router;
