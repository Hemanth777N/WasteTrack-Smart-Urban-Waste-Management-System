const express = require("express");
const pool = require("../db");
const { checkAuth } = require("../middleware/auth");
const router = express.Router();

// GET /api/departments
router.get("/departments", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT dept_id, name, location FROM Department ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/routes (all) and GET /api/routes/:dept_id
router.get("/routes", async (req, res) => {
  try {
    const deptId = req.query.dept_id;
    if (deptId) {
      const [rows] = await pool.query(
        `SELECT DISTINCT r.* FROM Route r
         JOIN Serves s ON r.route_id = s.route_id
         JOIN Vehicle v ON s.vehicle_id = v.vehicle_id
         WHERE v.dept_id = ? ORDER BY r.route_name`,
        [deptId]
      );
      return res.json(rows);
    }
    const [rows] = await pool.query("SELECT * FROM Route ORDER BY route_name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching routes:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/routes/:dept_id", async (req, res) => {
  try {
    const deptId = req.params.dept_id;
    const [rows] = await pool.query(
      `SELECT DISTINCT r.* FROM Route r
       JOIN Serves s ON r.route_id = s.route_id
       JOIN Vehicle v ON s.vehicle_id = v.vehicle_id
       WHERE v.dept_id = ? ORDER BY r.route_name`,
      [deptId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching routes by dept_id:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/employees
router.get("/employees", checkAuth, async (req, res) => {
  try {
    const { role, dept_id } = req.query;
    let sql = "SELECT emp_id, name, job_title, contact, dept_id, role FROM Employee";
    const params = [];
    const clauses = [];
    const searchDept = dept_id || (req.session.role === "Manager" ? req.session.dept_id : null);
    if (role) {
      clauses.push("role = ?");
      params.push(role);
    }
    if (searchDept) {
      clauses.push("dept_id = ?");
      params.push(searchDept);
    }
    if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/vehicles
router.get("/vehicles", checkAuth, async (req, res) => {
  try {
    const { dept_id } = req.query;
    const searchDept = dept_id || (req.session.role === "Manager" ? req.session.dept_id : null);
    let sql = "SELECT vehicle_id, vehicle_no, vehicle_type, status, dept_id FROM Vehicle";
    const params = [];
    if (searchDept) {
      sql += " WHERE dept_id = ?";
      params.push(searchDept);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
