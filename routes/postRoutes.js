const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const Post = require("../models/post");
const protect = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");
const cache = require("../cache");

const router = express.Router();

/* MULTER */
const upload = multer({ storage: multer.memoryStorage() });

/* CLOUDINARY */
const uploadToCloudinary = buffer =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "blog-images" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

/* CREATE POST */
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description || !req.file)
      return res.status(400).json({ message: "All fields required" });

    const result = await uploadToCloudinary(req.file.buffer);

    const optimized = result.secure_url.replace(
      "/upload/",
      "/upload/w_900,h_520,c_fill,q_auto,f_auto/"
    );

    const post = await Post.create({ title, description, imageUrl: optimized });

    cache.flushAll(); // 🔥 auto refresh

    res.status(201).json(post);
  } catch {
    res.status(500).json({ message: "Post creation failed" });
  }
});

/* GET POSTS ULTRA FAST */
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const key = `posts_${page}`;

  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const posts = await Post.find()
    .select("title imageUrl createdAt")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Post.countDocuments();

  const response = { posts, totalPages: Math.ceil(total / limit) };

  cache.set(key, response);
  res.json(response);
});

/* GET SINGLE POST */
router.get("/:id", async (req, res) => {
<<<<<<< HEAD
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
=======
  const key = `post_${req.params.id}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const post = await Post.findById(req.params.id).lean();
  if (!post) return res.status(404).json({ message: "Post not found" });

  const blocks = post.description.split("\n").map(b => b.trim()).filter(Boolean);
  let lead = "", sections = [], current = null;

  blocks.forEach(line => {
    if (line === "---") {
      if (current) sections.push(current);
      current = null;
    } else if (!lead) lead = line;
    else if (!current) current = { heading: line, paragraphs: [] };
    else current.paragraphs.push(line);
  });
  if (current) sections.push(current);

  const response = {
    _id: post._id,
    title: post.title,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    lead,
    sections
  };

  cache.set(key, response);
  res.json(response);
>>>>>>> a0bcccd (perf: optimize frontend & lighthouse fixes)
});

/* DELETE POST */
router.delete("/:id", protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });

  const publicId = post.imageUrl.split("/").pop().split(".")[0];
  await cloudinary.uploader.destroy(`blog-images/${publicId}`);
  await post.deleteOne();

  cache.flushAll();
  res.json({ message: "Deleted" });
});

module.exports = router;
