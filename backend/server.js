// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authenticate = require("./middleware/auth");
const tasksRouter = require("./routes/tasks");
const logsRouter = require("./routes/logs");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// connect DB
connectDB(process.env.MONGODB_URI || "mongodb://localhost:27017/task_manager_db").catch(err => {
  console.error("Failed to connect to DB", err);
  process.exit(1);
});

// Public auth routes (signup/signin)
app.use("/api/auth", authRouter);

// Protect API routes with middleware that accepts Basic or JWT
app.use("/api", authenticate);

// API routes
app.use("/api/tasks", tasksRouter);
app.use("/api/logs", logsRouter);

// health
const path = require("path");

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
