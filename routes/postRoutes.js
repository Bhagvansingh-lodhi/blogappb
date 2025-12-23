// backend/routes/postRoutes.js
const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const Post = require("../models/post");
const protect = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

/* ================= MULTER ================= */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ================= CLOUDINARY UPLOAD ================= */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "blog-images",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/* ================= CREATE POST ================= */
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description || !req.file) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    // 🔥 Save optimized Cloudinary URL (NO runtime processing)
    const optimizedImage = result.secure_url.replace(
      "/upload/",
      "/upload/w_800,h_500,c_fill,q_auto,f_auto/"
    );

    const post = await Post.create({
      title,
      description,
      imageUrl: optimizedImage,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Post creation failed" });
  }
});

/* ================= GET POSTS (FAST) ================= */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .select("title imageUrl createdAt") // 🔥 light payload
      .sort({ createdAt: -1 })
      .lean(); // 🔥 faster response

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE POST ================= */
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Optional: Cloudinary image cleanup
    const publicId = post.imageUrl
      .split("/")
      .pop()
      .split(".")[0];

    await cloudinary.uploader.destroy(`blog-images/${publicId}`);
    await post.deleteOne();

    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
