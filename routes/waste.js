const express = require("express");
const pool = require("../db");
const { checkAuth } = require("../middleware/auth");
const router = express.Router();

router.post("/waste", checkAuth, async (req, res) => {
  const { route_id, waste_type, weight_kg, collection_date } = req.body;
  if (!route_id || !weight_kg) return res.status(400).json({ error: "Missing route_id or weight_kg" });
  try {
    const [result] = await pool.query(
      "INSERT INTO Waste_Record (route_id, waste_type, weight_kg, collection_date) VALUES (?, ?, ?, ?)",
      [ route_id, waste_type || null, weight_kg, collection_date || new Date() ]
    );
    res.json({ message: "Waste recorded", record_id: result.insertId });
  } catch (err) {
    console.error("Error inserting waste record:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

module.exports = router;
