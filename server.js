const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const compression = require("compression");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// 🚀 PERFORMANCE MIDDLEWARE FIRST
app.use(compression());          // gzip on
app.use(express.json({ limit: "5mb" }));
app.use(cors({ origin: "*", credentials: true }));

app.get("/", (req, res) => {
  res.send("🔥 API running ultra fast");
});

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
