const jwt = require("jsonwebtoken");
const env = require("../config/env");

function sign(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin role required." });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: `Invalid or expired token: ${error.message}` });
  }
}

module.exports = { sign, requireAdmin };
