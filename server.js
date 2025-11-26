// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const connectDB = require("./config/db");


connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
