const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const Post = require("../models/post");
const protect = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

/* ================= MULTER CONFIG ================= */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ================= CLOUDINARY UPLOAD ================= */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "blog-images" },
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

    // Optimized Cloudinary image
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

/* ================= GET POSTS (FAST & SAFE) ================= */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .select("title description imageUrl createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET SINGLE POST ================= */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ message: "Post not found" });

    const blocks = post.description
      .split("\n")
      .map(b => b.trim())
      .filter(Boolean);

    let lead = "";
    const sections = [];
    let current = null;

    blocks.forEach(line => {
      if (line === "---") {
        if (current) sections.push(current);
        current = null;
        return;
      }

      if (!lead) {
        lead = line;
        return;
      }

      if (!current) {
        current = { heading: line, paragraphs: [] };
        return;
      }

      current.paragraphs.push(line);
    });

    if (current) sections.push(current);

    res.json({
      _id: post._id,
      title: post.title,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      lead,
      sections
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE POST (SAFE) ================= */
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Safe Cloudinary delete
    if (post.imageUrl) {
      const publicId = post.imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`blog-images/${publicId}`);
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
