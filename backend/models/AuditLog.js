// models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date() },
  action: { type: String, enum: ["CREATE", "UPDATE", "DELETE"], required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: false },
  updatedContent: { type: Object, default: {} },
  performedBy: { type: String, default: "system" } // username or 'admin'
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
