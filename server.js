const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const app = express();
const PORT = 3000;

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD || "Dedlinux@14052005", // <-- set MYSQL_PASSWORD env or replace here
  database: "waste_track",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Get all complaints (joined with route name)
app.get("/api/complaints", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, r.route_name
       FROM Complaints c
       LEFT JOIN Route r ON c.route_id = r.route_id
       ORDER BY c.complaint_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Insert a new complaint (accepts optional route_id)
app.post("/api/complaints", async (req, res) => {
  const { citizen_name, contact_no, location, description, route_id } = req.body;
  if (!citizen_name || !contact_no || !location || !description) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO Complaints (citizen_name, contact_no, location, description, route_id) VALUES (?, ?, ?, ?, ?)",
      [citizen_name, contact_no, location, description, route_id || null]
    );
    res.json({ message: "Inserted", complaint_id: result.insertId });
  } catch (err) {
    console.error("Error inserting complaint:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// Get departments
app.get("/api/departments", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT dept_id, name, location FROM Department ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- Replace the old optional-param route with two safe handlers ---

// GET /api/routes
// - If query param dept_id is provided, return routes served by vehicles in that department
// - Otherwise return all routes
app.get("/api/routes", async (req, res) => {
  try {
    const deptId = req.query.dept_id;
    if (deptId) {
      const [rows] = await pool.query(
        `SELECT DISTINCT r.*
         FROM Route r
         JOIN Serves s ON r.route_id = s.route_id
         JOIN Vehicle v ON s.vehicle_id = v.vehicle_id
         WHERE v.dept_id = ?
         ORDER BY r.route_name`,
        [deptId]
      );
      return res.json(rows);
    } else {
      const [rows] = await pool.query("SELECT * FROM Route ORDER BY route_name");
      return res.json(rows);
    }
  } catch (err) {
    console.error("Error fetching routes:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/routes/:dept_id
// - Keeps compatibility for clients requesting dept_id as a path parameter
app.get("/api/routes/:dept_id", async (req, res) => {
  try {
    const deptId = req.params.dept_id;
    const [rows] = await pool.query(
      `SELECT DISTINCT r.*
       FROM Route r
       JOIN Serves s ON r.route_id = s.route_id
       JOIN Vehicle v ON s.vehicle_id = v.vehicle_id
       WHERE v.dept_id = ?
       ORDER BY r.route_name`,
      [deptId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching routes by dept_id:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get employees (optional query param role or dept_id)
app.get("/api/employees", async (req, res) => {
  try {
    const { role, dept_id } = req.query;
    let sql = "SELECT emp_id, name, job_title, contact, dept_id FROM Employee";
    const params = [];
    const clauses = [];
    if (role) {
      clauses.push("job_title = ?");
      params.push(role);
    }
    if (dept_id) {
      clauses.push("dept_id = ?");
      params.push(dept_id);
    }
    if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get vehicles (optional dept_id)
app.get("/api/vehicles", async (req, res) => {
  try {
    const { dept_id } = req.query;
    let sql = "SELECT vehicle_id, vehicle_no, vehicle_type, status, dept_id FROM Vehicle";
    const params = [];
    if (dept_id) {
      sql += " WHERE dept_id = ?";
      params.push(dept_id);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Create an assignment and update complaint assigned_emp + status
app.post("/api/assign", async (req, res) => {
  const { emp_id, vehicle_id, route_id, complaint_id } = req.body;
  if (!emp_id || !vehicle_id) return res.status(400).json({ error: "Missing emp_id or vehicle_id" });
  try {
    // Insert into Assigned_To
    const [insertRes] = await pool.query(
      "INSERT INTO Assigned_To (emp_id, vehicle_id, route_id, departure_from) VALUES (?, ?, ?, ?)",
      [emp_id, vehicle_id, route_id || null, null]
    );
    // Optionally update complaint assigned_emp and status
    if (complaint_id) {
      await pool.query("UPDATE Complaints SET assigned_emp = ?, status = ? WHERE complaint_id = ?", [emp_id, "In Progress", complaint_id]);
    }
    res.json({ message: "Assigned", assign_id: insertRes.insertId });
  } catch (err) {
    console.error("Error creating assignment:", err);
    res.status(500).json({ error: "Assign failed" });
  }
});

// Add waste record
app.post("/api/waste", async (req, res) => {
  const { route_id, waste_type, weight_kg, collection_date } = req.body;
  if (!route_id || !weight_kg) return res.status(400).json({ error: "Missing route_id or weight_kg" });
  try {
    const [result] = await pool.query(
      "INSERT INTO Waste_Record (route_id, waste_type, weight_kg, collection_date) VALUES (?, ?, ?, ?)",
      [route_id, waste_type || null, weight_kg, collection_date || null]
    );
    res.json({ message: "Waste recorded", record_id: result.insertId });
  } catch (err) {
    console.error("Error inserting waste record:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// Return data from allowed SQL views (whitelist)
app.get("/api/views/:viewname", async (req, res) => {
  const allowed = ["v_pending_complaints", "v_vehicle_usage", "v_department_summary", "v_waste_collection_stats", "v_employee_performance"];
  const view = req.params.viewname;
  if (!allowed.includes(view)) return res.status(400).json({ error: "View not allowed" });
  try {
    const [rows] = await pool.query(`SELECT * FROM ${view} LIMIT 1000`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching view:", err);
    res.status(500).json({ error: "View error" });
  }
});

// fallback for unknown API routes
// OLD (caused PathError with certain path-to-regexp versions):
// app.use("/api/*", (req, res) => res.status(404).json({ error: "Not found" }));

// Use base '/api' in app.use to match all API paths without using '*' token
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/complaint.html`);
});
