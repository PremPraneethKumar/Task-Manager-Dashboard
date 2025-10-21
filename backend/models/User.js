// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, trim: true, maxlength: 150 },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
