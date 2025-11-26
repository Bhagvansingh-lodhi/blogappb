// backend/routes/postRoutes.js
const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const Post = require("../models/post");
const protect = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Multer config – store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload buffer to Cloudinary using a Promise + upload_stream
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "blog-images" },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    // Send buffer into the stream
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// CREATE POST (admin only)
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    const post = await Post.create({
      title,
      description,
      imageUrl: result.secure_url,
    });

    return res.status(201).json(post);
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({ message: "Image upload failed" });
  }
});


// GET ALL POSTS (public)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE POST (admin only)
router.delete("/:id", protect, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
