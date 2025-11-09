const express = require("express");
const pool = require("../db");
const router = express.Router();

// Your existing allowed views list, with the new view added
const ALLOWED_VIEWS = new Set([
  'v_pending_complaints',
  'v_vehicle_usage',
  'v_department_summary',
  'v_waste_collection_stats',
  'v_employee_performance',
  'v_employee_tasks' // <-- ADDED
]);

// Your existing /api/views/:name endpoint
router.get("/views/:viewname", async (req, res) => {
  const view = req.params.viewname;
  if (!ALLOWED_VIEWS.has(view)) {
    return res.status(400).json({ error: "View not allowed" });
  }
  try {
    const [rows] = await pool.query(`SELECT * FROM ${view} LIMIT 1000`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching view:", err);
    res.status(500).json({ error: "View error" });
  }
});

// --- NEW ENDPOINT FOR CHARTS ---
router.get('/stats/overview', async (req, res) => {
  try {
    const [[pendingCount]] = await pool.query("SELECT COUNT(*) AS cnt FROM complaints WHERE status IN ('Open','In Progress', 'Pending')");
    const [[resolvedCount]] = await pool.query("SELECT COUNT(*) AS cnt FROM complaints WHERE status IN ('Resolved','Closed')");
    const [vehicleUsage] = await pool.query("SELECT vehicle_no, total_assignments FROM v_vehicle_usage ORDER BY total_assignments DESC LIMIT 10");
    
    res.json({
      pending: pendingCount.cnt,
      resolved: resolvedCount.cnt,
      vehicleUsage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats fetch error' });
  }
});
// --- END NEW ENDPOINT ---

module.exports = router;