const express = require("express");
const multer = require("multer");
const path = require("path");
const Tesseract = require("tesseract.js");
const Screenshot = require("../models/Screenshot");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const extName = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
});

function detectCategory(text) {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("error") ||
    lowerText.includes("npm") ||
    lowerText.includes("undefined") ||
    lowerText.includes("exception") ||
    lowerText.includes("localhost") ||
    lowerText.includes("failed")
  ) {
    return "Code Error";
  }

  if (
    lowerText.includes("payment") ||
    lowerText.includes("paid") ||
    lowerText.includes("upi") ||
    lowerText.includes("transaction") ||
    lowerText.includes("amount") ||
    lowerText.includes("bank")
  ) {
    return "Payment";
  }

  if (
    lowerText.includes("exam") ||
    lowerText.includes("marks") ||
    lowerText.includes("assignment") ||
    lowerText.includes("syllabus") ||
    lowerText.includes("attendance") ||
    lowerText.includes("college")
  ) {
    return "College";
  }

  if (
    lowerText.includes("password") ||
    lowerText.includes("otp") ||
    lowerText.includes("login") ||
    lowerText.includes("token") ||
    lowerText.includes("api key") ||
    lowerText.includes("secret")
  ) {
    return "Sensitive";
  }

  if (
    lowerText.includes("definition") ||
    lowerText.includes("chapter") ||
    lowerText.includes("unit") ||
    lowerText.includes("important") ||
    lowerText.includes("topic")
  ) {
    return "Notes";
  }

  return "Other";
}

function detectSensitive(text) {
  const lowerText = text.toLowerCase();

  const sensitiveWords = [
    "password",
    "otp",
    "token",
    "api key",
    "secret",
    "private key",
    "login",
  ];

  return sensitiveWords.some((word) => lowerText.includes(word));
}

function generateTags(text, category) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 10);

  return [category, ...words];
}

router.get("/", (req, res) => {
  res.send("Screenshot routes working");
});

router.post("/upload", upload.single("screenshot"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded",
      });
    }

    const imagePath = req.file.path;
    const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;

    const ocrResult = await Tesseract.recognize(imagePath, "eng");
    const extractedText = ocrResult.data.text;

    const category = detectCategory(extractedText);
    const isSensitive = detectSensitive(extractedText);
    const tags = generateTags(extractedText, category);

    const savedScreenshot = await Screenshot.create({
      imageUrl: imageUrl,
      fileName: req.file.filename,
      extractedText: extractedText,
      category: category,
      tags: tags,
      isSensitive: isSensitive,
    });

    res.status(201).json({
      message: "Image uploaded, text extracted, and saved successfully",
      data: savedScreenshot,
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload/OCR save failed",
      error: error.message,
    });
  }
});


router.get("/all", async (req, res) => {
  try {
    const screenshots = await Screenshot.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Screenshots fetched successfully",
      count: screenshots.length,
      data: screenshots,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch screenshots",
      error: error.message,
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const results = await Screenshot.find({
      $or: [
        { extractedText: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Search completed successfully",
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      message: "Search failed",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedScreenshot = await Screenshot.findByIdAndDelete(req.params.id);

    if (!deletedScreenshot) {
      return res.status(404).json({
        message: "Screenshot not found",
      });
    }

    res.status(200).json({
      message: "Screenshot deleted successfully",
      data: deletedScreenshot,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete screenshot",
      error: error.message,
    });
  }
});

module.exports = router;