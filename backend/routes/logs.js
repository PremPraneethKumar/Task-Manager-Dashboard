// routes/logs.js
const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");

// ✅ GET /api/logs?page=1&limit=5
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const totalLogs = await AuditLog.countDocuments({});
    const totalPages = Math.ceil(totalLogs / limit);
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      logs,
      meta: {
        totalLogs,
        totalPages,
        page,
        limit
      }
    });
  } catch (err) {
    console.error("GET /api/logs error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
