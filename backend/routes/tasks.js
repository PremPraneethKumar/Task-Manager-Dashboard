// routes/tasks.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const AuditLog = require("../models/AuditLog");
const { taskValidationRules, validate } = require("../validators/taskValidator");
const mongoose = require("mongoose");

// GET /api/tasks?search=&page=1&limit=5
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ tasks, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("GET /api/tasks error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single task
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const task = await Task.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ error: "Not found" });
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/tasks
router.post("/", taskValidationRules, validate, async (req, res) => {
  try {
    const { title, description } = req.body;
    const createdBy = req.auth?.user || null;
    const createdById = req.auth?.userId || null;
    const t = await Task.create({ title, description, createdBy: createdById });

    await AuditLog.create({
      action: "CREATE",
      taskId: t._id,
      updatedContent: { title: t.title, description: t.description, createdAt: t.createdAt },
      performedBy: createdBy
    });

    res.status(201).json({ task: t });
  } catch (err) {
    console.error("POST /api/tasks error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/tasks/:id
router.put("/:id", taskValidationRules, validate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const existing = await Task.findById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updates = {};
    if (req.body.title !== undefined && req.body.title !== existing.title) updates.title = req.body.title;
    if (req.body.description !== undefined && req.body.description !== existing.description) updates.description = req.body.description;

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ task: existing, message: "No fields changed" });
    }

    Object.assign(existing, updates);
    await existing.save();

    await AuditLog.create({
      action: "UPDATE",
      taskId: existing._id,
      updatedContent: updates,
      performedBy: req.auth?.user || "unknown"
    });

    res.json({ task: existing });
  } catch (err) {
    console.error("PUT /api/tasks/:id error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const existing = await Task.findById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    await Task.deleteOne({ _id: id });

    await AuditLog.create({
      action: "DELETE",
      taskId: id,
      updatedContent: {},
      performedBy: req.auth?.user || "unknown"
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
