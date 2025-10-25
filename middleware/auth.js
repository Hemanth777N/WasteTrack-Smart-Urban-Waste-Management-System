// auth.js - Middleware for authentication and authorization

// --- Check Authentication ---
const checkAuth = (req, res, next) => {
  if (!req.session || !req.session.emp_id) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// --- Check Manager Role ---
const checkManager = (req, res, next) => {
  if (!req.session || req.session.role !== "Manager") {
    return res.status(403).json({ error: "Not authorized" });
  }
  next();
};

// --- Export Middleware ---
module.exports = { checkAuth, checkManager };