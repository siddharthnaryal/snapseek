const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const screenshotRoutes = require("./routes/screenshotRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/screenshots", screenshotRoutes);

app.get("/", (req, res) => {
  res.send("SnapSeek backend is running");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err.message);
  });