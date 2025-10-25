const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/views/:viewname", async (req, res) => {
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

module.exports = router;
