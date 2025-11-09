const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require('fs').promises; // <-- Import fs promises
const pool = require('./db'); // <-- Import the pool

// Import routes
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const dataRoutes = require("./routes/data");
const wasteRoutes = require("./routes/waste");
const viewRoutes = require("./routes/views");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
  })
);

// Serve static frontend files
app.use(express.static(__dirname));

// Page route
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "welcome.html"))
);

// Mount API routes under /api
app.use("/api", authRoutes);
app.use("/api", complaintRoutes);
app.use("/api", dataRoutes);
app.use("/api", wasteRoutes);
app.use("/api", viewRoutes);

// Fallback for API
app.use("/api", (req, res) =>
  res.status(404).json({ error: "API endpoint not found" })
);

// --- NEW: Database Initialization Function ---
async function initializeDatabase() {
  try {
    console.log('Attempting to initialize database...');
    // Make sure your SQL file is named 'database_setup.sql' and in the root directory
    const sqlFilePath = path.join(__dirname, 'database_setup.sql');
    const sqlScript = await fs.readFile(sqlFilePath, 'utf-8');

    // Execute the entire script
    // Note: This relies on 'multipleStatements: true' in db.js
    await pool.query(sqlScript);

    console.log('Database setup script executed successfully.');
  } catch (error) {
    console.error('-----------------------------------------');
    console.error('⛔️ ERROR EXECUTING DATABASE SETUP SCRIPT:');
    console.error(error);
    console.error('-----------------------------------------');
    // Decide if you want the server to stop if DB setup fails
    // process.exit(1);
  }
}

// --- Start the server ---
async function startServer() {
  // Initialize DB first
  await initializeDatabase();

  // Then start listening
  app.listen(PORT, () => {
    console.log(`Server running. Welcome page: http://localhost:${PORT}/`);
  });
}

// Run the start function
startServer();