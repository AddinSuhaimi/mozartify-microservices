require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");
const AdmZip = require("adm-zip");
const { XMLParser } = require("fast-xml-parser");

const app = express();
const PORT = process.env.PORT || 8080;
const execFileAsync = promisify(execFile);

const AUDIVERIS_COMMAND = process.env.AUDIVERIS_COMMAND || "audiveris";
const AUDIVERIS_TIMEOUT_MS = Number(process.env.AUDIVERIS_TIMEOUT_MS || 180000);
const MAX_DIAGNOSTIC_LENGTH = 4000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
};

const mapKeyFromFifths = (fifthsValue) => {
  const keys = {
    "-7": "Cb",
    "-6": "Gb",
    "-5": "Db",
    "-4": "Ab",
    "-3": "Eb",
    "-2": "Bb",
    "-1": "F",
    "0": "C",
    "1": "G",
    "2": "D",
    "3": "A",
    "4": "E",
    "5": "B",
    "6": "F#",
    "7": "C#",
  };

  return keys[String(fifthsValue)] || "C";
};

const formatAbcLength = (numerator, denominator) => {
  if (numerator <= 0 || denominator <= 0) {
    return "";
  }

  const factor = gcd(numerator, denominator);
  const n = numerator / factor;
  const d = denominator / factor;

  if (n === d) return "";
  if (d === 1) return String(n);
  if (n === 1 && d === 2) return "/";
  if (n === 1) return `/${d}`;

  return `${n}/${d}`;
};

const renderPitchToAbc = (step, octaveValue, alterValue) => {
  const octave = Number(octaveValue);
  if (!step || Number.isNaN(octave)) {
    return null;
  }

  let accidental = "";
  const alter = Number(alterValue || 0);
  if (alter === 2) accidental = "^^";
  else if (alter === 1) accidental = "^";
  else if (alter === -1) accidental = "_";
  else if (alter === -2) accidental = "__";

  let note = step.toUpperCase();
  if (octave >= 5) {
    note = step.toLowerCase();
    if (octave > 5) {
      note += "'".repeat(octave - 5);
    }
  } else if (octave < 4) {
    note += ",".repeat(4 - octave);
  }

  return `${accidental}${note}`;
};

const buildAbcFromMusicXml = (xmlText, title) => {
  const doc = xmlParser.parse(xmlText);
  const score = doc["score-partwise"] || doc["score-timewise"];

  if (!score) {
    throw new Error("Unable to parse MusicXML score root");
  }

  const parts = toArray(score.part);
  if (parts.length === 0) {
    throw new Error("No parts found in MusicXML");
  }

  const firstPart = parts[0];
  const measures = toArray(firstPart.measure);

  let divisions = 1;
  let meter = "4/4";
  let key = "C";
  const measureTokens = [];
  let collectedNotes = 0;

  for (const measure of measures) {
    const attrs = measure.attributes || {};
    if (attrs.divisions !== undefined) {
      divisions = Number(attrs.divisions) || divisions;
    }

    if (attrs.time) {
      const beats = attrs.time.beats;
      const beatType = attrs.time["beat-type"];
      if (beats && beatType) {
        meter = `${beats}/${beatType}`;
      }
    }

    if (attrs.key && attrs.key.fifths !== undefined) {
      key = mapKeyFromFifths(attrs.key.fifths);
    }

    const notes = toArray(measure.note);
    const noteTokens = [];

    for (const note of notes) {
      const duration = Number(note.duration || 0);
      const length = formatAbcLength(duration * 2, divisions);

      if (note.rest !== undefined) {
        noteTokens.push(`z${length}`);
        continue;
      }

      const pitch = note.pitch;
      if (!pitch || !pitch.step || pitch.octave === undefined) {
        continue;
      }

      const abcPitch = renderPitchToAbc(pitch.step, pitch.octave, pitch.alter);
      if (!abcPitch) {
        continue;
      }

      noteTokens.push(`${abcPitch}${length}`);
      collectedNotes += 1;
    }

    if (noteTokens.length > 0) {
      measureTokens.push(`${noteTokens.join(" ")} |`);
    }
  }

  if (collectedNotes === 0) {
    throw new Error("MusicXML contained no pitched notes");
  }

  const safeTitle = title || "Imported Score";
  const body = measureTokens.join("\n");

  return `X:1\nT:${safeTitle}\nM:${meter}\nL:1/8\nK:${key}\n${body}\n`;
};

const runAudiverisExport = async (inputPath, outputDir) => {
  const args = ["-batch", "-export", "-output", outputDir, inputPath];
  return execFileAsync(AUDIVERIS_COMMAND, args, {
    timeout: AUDIVERIS_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });
};

const normalizeDiagnosticText = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  if (text.length <= MAX_DIAGNOSTIC_LENGTH) return text;
  return `${text.slice(0, MAX_DIAGNOSTIC_LENGTH)}... [truncated]`;
};

const buildProcessDiagnostics = (error) => {
  if (!error) return null;

  return {
    code: error.code || null,
    signal: error.signal || null,
    cmd: error.cmd || null,
    stdout: normalizeDiagnosticText(error.stdout),
    stderr: normalizeDiagnosticText(error.stderr),
  };
};

const walkFiles = (dir) => {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }

    results.push(fullPath);
  }

  return results;
};

const findMusicXmlArtifact = (outputDir) => {
  const files = walkFiles(outputDir);
  const prioritized = [".mxl", ".musicxml", ".xml"];

  for (const ext of prioritized) {
    const match = files.find((filePath) => path.extname(filePath).toLowerCase() === ext);
    if (match) {
      return match;
    }
  }

  return null;
};

const extractMusicXmlText = (artifactPath) => {
  const ext = path.extname(artifactPath).toLowerCase();
  if (ext === ".mxl") {
    const zip = new AdmZip(artifactPath);
    const entries = zip.getEntries();
    const xmlEntry = entries.find((entry) => {
      const name = entry.entryName.toLowerCase();
      return !entry.isDirectory && !name.startsWith("meta-inf/") && (name.endsWith(".xml") || name.endsWith(".musicxml"));
    });

    if (!xmlEntry) {
      throw new Error("No MusicXML content found inside MXL archive");
    }

    return zip.readAsText(xmlEntry, "utf8");
  }

  return fs.readFileSync(artifactPath, "utf8");
};

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

  const baseName = path.parse(req.file.filename).name;
  const scoreTitle = path.parse(req.file.originalname).name;
  const inputPath = req.file.path;
  const outputDir = path.join(__dirname, "output", path.parse(req.file.filename).name);
  const abcPath = path.join(outputDir, `${baseName}.abc`);

  fs.mkdirSync(outputDir, { recursive: true });

  const started = Date.now();

  try {
    const exportResult = await runAudiverisExport(inputPath, outputDir);

    const artifactPath = findMusicXmlArtifact(outputDir);
    if (!artifactPath) {
      const artifactError = new Error("Audiveris export completed but no MusicXML artifact was produced");
      artifactError.code = "NO_MUSICXML_ARTIFACT";
      artifactError.stdout = exportResult?.stdout || "";
      artifactError.stderr = exportResult?.stderr || "";
      throw artifactError;
    }

    const musicXmlText = extractMusicXmlText(artifactPath);
    const abc = buildAbcFromMusicXml(musicXmlText, scoreTitle);
    fs.writeFileSync(abcPath, abc, "utf8");

    const processingTime = Number(((Date.now() - started) / 1000).toFixed(2));
    const relativeArtifactPath = artifactPath.replace(`${__dirname}${path.sep}`, "");

    res.json({
      success: true,
      abc,
      processingTime,
      source: "audiveris",
      outputPath: `/output/${baseName}/${baseName}.abc`,
      musicXmlArtifact: relativeArtifactPath.split(path.sep).join("/"),
    });
  } catch (error) {
    const diagnostics = buildProcessDiagnostics(error);
    const isNoArtifact = error.code === "NO_MUSICXML_ARTIFACT";
    const userMessage = isNoArtifact
      ? "OCR completed, but no readable music score was detected in this upload."
      : "OCR conversion failed while processing this upload.";

    console.error("Audiveris service error:", {
      message: error.message,
      diagnostics,
    });

    res.status(422).json({
      success: false,
      error: error.message,
      userMessage,
      code: error.code || "AUDIVERIS_CONVERSION_FAILED",
      diagnostics,
      hint: "Use a clear, high-contrast score image (300-600 DPI), crop to staves, and ensure the page is upright.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Audiveris service running on port ${PORT}`);
});
