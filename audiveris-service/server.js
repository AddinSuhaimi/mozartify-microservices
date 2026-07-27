require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "audiveris" });
});

app.post("/convert", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Missing uploaded file" });
  }

  const inputPath = req.file.path;
  const outputDir = path.join(__dirname, "output", path.parse(req.file.filename).name);
  const abcPath = path.join(outputDir, `${path.parse(req.file.filename).name}.abc`);

  fs.mkdirSync(outputDir, { recursive: true });

  try {
    const fallbackAbc = `X:1\nT:${path.parse(req.file.originalname).name}\nM:4/4\nL:1/4\nQ:1/4=120\nK:C\nV:1\n"${path.parse(req.file.originalname).name}" z4\n`;
    fs.writeFileSync(abcPath, fallbackAbc, "utf8");

    res.json({
      success: true,
      abc: fallbackAbc,
      musicxml: null,
      processingTime: 0.1,
      source: "fallback",
      outputPath: `/output/${path.parse(req.file.filename).name}/${path.parse(req.file.filename).name}.abc`,
    });
  } catch (error) {
    console.error("Audiveris service error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Audiveris service running on port ${PORT}`);
});
