// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // We don't have a user model for admin, just a flag
    req.admin = { email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = protect;
