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

// --- UPDATED ASSIGN ENDPOINT ---
router.put("/complaints/:id/assign", checkAuth, checkManager, async (req, res) => {
  const { id } = req.params;
  const { emp_id, vehicle_id } = req.body; // <-- UPDATED
  
  if (!emp_id || !vehicle_id) { // <-- UPDATED
    return res.status(400).json({ error: "Employee ID and Vehicle ID are required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Update the complaint itself (assign emp, set status)
    await connection.query(
      "UPDATE Complaints SET assigned_emp = ?, status = 'In Progress' WHERE complaint_id = ?",
      [emp_id, id]
    );

    // 2. Get the route_id from the complaint
    const [complaintRows] = await connection.query("SELECT route_id FROM Complaints WHERE complaint_id = ?", [id]);
    const route_id = complaintRows.length ? complaintRows[0].route_id : null;

    // 3. Log this assignment in the Assigned_To table (as per plan)
    await connection.query(
      "INSERT INTO Assigned_To (emp_id, vehicle_id, route_id, assign_date) VALUES (?, ?, ?, ?)",
      [emp_id, vehicle_id, route_id, new Date()]
    );

    await connection.commit();
    res.json({ message: "Re-assigned and logged successfully" });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error re-assigning:", err);
    res.status(500).json({ error: "Re-assign failed" });
  } finally {
    if (connection) connection.release();
  }
});
// --- END UPDATED ENDPOINT ---

module.exports = router;