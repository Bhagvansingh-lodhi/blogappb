// backend/models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true   // 🔥 search fast
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// 🔥 Most important index for blog listing
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
