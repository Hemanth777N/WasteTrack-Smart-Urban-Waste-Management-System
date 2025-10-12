const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const app = express();
const PORT = 3000;

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Dedlinux@14052005", // <-- MySQL root password
  database: "waste_track",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(express.json());

// Serve the frontend
app.use(express.static(__dirname));

// Get all complaints
app.get("/api/complaints", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Complaints ORDER BY complaint_id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching complaints:", err); // Add this line
    res.status(500).json({ error: "Database error" });
  }
});

// Insert a new complaint
app.post("/api/complaints", async (req, res) => {
  const { citizen_name, contact_no, location, description } = req.body;
  if (!citizen_name || !contact_no || !location || !description) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    await pool.query(
      "INSERT INTO Complaints (citizen_name, contact_no, location, description) VALUES (?, ?, ?, ?)",
      [citizen_name, contact_no, location, description]
    );
    res.json({ message: "Inserted" });
  } catch (err) {
    console.error("Error inserting complaint:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/complaint.html`);
});
