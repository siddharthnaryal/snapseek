const mongoose = require("mongoose");

const screenshotSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    extractedText: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "Other",
    },

    tags: {
      type: [String],
      default: [],
    },

    isSensitive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Screenshot", screenshotSchema);