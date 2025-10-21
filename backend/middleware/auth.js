// middleware/auth.js
const basicAuth = require("basic-auth");
const jwt = require("jsonwebtoken");

const BASIC_USER = process.env.BASIC_AUTH_USER || "admin";
const BASIC_PASS = process.env.BASIC_AUTH_PASS || "password123";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

function unauthorized(res) {
  res.set("WWW-Authenticate", 'Basic realm="TaskManager"');
  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * Accept either:
 * - Bearer <JWT>
 * OR
 * - Basic Auth (admin:password123)
 *
 * Attaches req.auth = { method, user, userId? }
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  // Try Bearer token first
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.auth = { method: "jwt", user: payload.username, userId: payload.userId };
      return next();
    } catch (err) {
      return unauthorized(res);
    }
  }

  // Fallback to Basic Auth
  const credentials = basicAuth(req);
  if (!credentials) return unauthorized(res);
  if (credentials.name === BASIC_USER && credentials.pass === BASIC_PASS) {
    req.auth = { method: "basic", user: credentials.name };
    return next();
  }

  return unauthorized(res);
}

module.exports = authenticate;
