// backend/routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

module.exports = router;
