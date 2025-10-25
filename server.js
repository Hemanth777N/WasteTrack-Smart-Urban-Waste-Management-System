const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const session = require("express-session"); // Added for auth
const bcrypt = require("bcryptjs"); // Added for auth

const app = express();
const PORT = 3000;

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD || "Dedlinux@14052005", // From your original file
  database: "waste_track",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Setup ---
app.use(
  session({
    secret: "your-secret-key-change-this", // Change this to a random string
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// --- Auth Middleware ---
const checkAuth = (req, res, next) => {
  if (!req.session.emp_id) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

const checkManager = (req, res, next) => {
  if (req.session.role !== "Manager") {
    return res.status(403).json({ error: "Not authorized" });
  }
  next();
};

// --- Static Frontend Files ---
app.use(express.static(__dirname));

// --- Page Routes ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "welcome.html"));
});

// --- API Auth Routes ---

// NEW: POST /api/register - Handle new user sign-up
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new employee
    // They get 'Employee' role by default. A manager can change it later.
    const [result] = await pool.query(
      `INSERT INTO Employee (name, email, password, role, status)
       VALUES (?, ?, ?, 'Employee', 'Active')`,
      [name, email, hashedPassword]
    );

    res.json({ message: "Registration successful", emp_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// UPDATED: POST /api/login - Now with secure password checking
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    // Find the user by email
    const [rows] = await pool.query(
      "SELECT emp_id, password, role, dept_id, name FROM Employee WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = rows[0];

    // --- SECURE CHECK ---
    // Compare submitted password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // --- END SECURE CHECK ---

    // Store user info in session
    req.session.emp_id = user.emp_id;
    req.session.role = user.role;
    req.session.dept_id = user.dept_id;
    req.session.name = user.name;

    res.json({
      message: "Login successful",
      role: user.role,
      name: user.name,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/logout
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});

// GET /api/me
app.get("/api/me", checkAuth, (req, res) => {
  res.json({
    emp_id: req.session.emp_id,
    role: req.session.role,
    dept_id: req.session.dept_id,
    name: req.session.name,
  });
});

// --- API Data Routes ---

// GET /api/complaints
app.get("/api/complaints", async (req, res) => {
  try {
    let sql = `SELECT c.*, r.route_name
               FROM Complaints c
               LEFT JOIN Route r ON c.route_id = r.route_id`;
    const params = [];

    if (req.session.emp_id) {
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
app.post("/api/complaints", async (req, res) => {
  const { citizen_name, contact_no, location, description, route_id, dept_id } =
    req.body;

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
       LEFT JOIN Complaints c ON e.emp_id = c.assigned_emp AND c.status IN ('Open', 'In Progress')
       WHERE e.dept_id = ? AND e.role = 'Employee'
       GROUP BY e.emp_id
       ORDER BY task_count ASC
       LIMIT 1`,
      [dept_id]
    );

    if (employees.length === 0) {
      await connection.rollback();
      return res
        .status(500)
        .json({ error: "No available employees in that department" });
    }
    const bestEmployeeId = employees[0].emp_id;

    const [result] = await connection.query(
      `INSERT INTO Complaints (citizen_name, contact_no, location, description, route_id, dept_id, assigned_emp, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'In Progress')`,
      [
        citizen_name,
        contact_no,
        location || 'N/A', // Make location optional
        description,
        route_id || null,
        dept_id,
        bestEmployeeId,
      ]
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
app.put("/api/complaints/:id/status", checkAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  if (status === "Closed" && req.session.role !== "Manager") {
    return res.status(403).json({ error: "Only managers can close tasks" });
  }

  try {
    await pool.query("UPDATE Complaints SET status = ? WHERE complaint_id = ?", [
      status,
      id,
    ]);
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// PUT /api/complaints/:id/assign
app.put("/api/complaints/:id/assign", checkAuth, checkManager, async (req, res) => {
    const { id } = req.params;
    const { emp_id, vehicle_id } = req.body;

    if (!emp_id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    try {
      await pool.query(
        "UPDATE Complaints SET assigned_emp = ?, status = 'In Progress' WHERE complaint_id = ?",
        [emp_id, id]
      );
      
      res.json({ message: "Re-assigned successfully" });
    } catch (err) {
      console.error("Error re-assigning:", err);
      res.status(500).json({ error: "Re-assign failed" });
    }
  }
);

// POST /api/waste
app.post("/api/waste", checkAuth, async (req, res) => {
  const { route_id, waste_type, weight_kg, collection_date } = req.body;
  if (!route_id || !weight_kg)
    return res.status(400).json({ error: "Missing route_id or weight_kg" });
  try {
    const [result] = await pool.query(
      "INSERT INTO Waste_Record (route_id, waste_type, weight_kg, collection_date) VALUES (?, ?, ?, ?)",
      [
        route_id,
        waste_type || null,
        weight_kg,
        collection_date || new Date(), // Use current date if not provided
      ]
    );
    res.json({ message: "Waste recorded", record_id: result.insertId });
  } catch (err) {
    console.error("Error inserting waste record:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// --- Unchanged API Routes ---

app.get("/api/departments", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT dept_id, name, location FROM Department ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
});

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

app.get("/api/employees", checkAuth, async (req, res) => {
  try {
    const { role, dept_id } = req.query;
    let sql = "SELECT emp_id, name, job_title, contact, dept_id FROM Employee";
    const params = [];
    const clauses = [];
    
    const searchDept = dept_id || (req.session.role === 'Manager' ? req.session.dept_id : null);

    if (role) {
      clauses.push("role = ?"); // Use 'role' column
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

app.get("/api/vehicles", checkAuth, async (req, res) => {
  try {
    const { dept_id } = req.query;
    const searchDept = dept_id || (req.session.role === 'Manager' ? req.session.dept_id : null);
    
    let sql = "SELECT vehicle_id, vehicle_no, vehicle_type, status, dept_id FROM Vehicle";
    const params = [];
    if (searchDept) {
      sql += " WHERE dept_id = ?";
      params.push(searchDept);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err)
 {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ error: "Database error" });
  }
});

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

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running. Welcome page: http://localhost:${PORT}/`);
});