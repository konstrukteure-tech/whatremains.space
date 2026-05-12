import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

const upload = multer({ dest: UPLOAD_DIR });

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "what-remains-backend" });
});

app.post("/api/archive", (req, res) => {
  const archive = req.body;

  if (!archive || !archive.archiveCode) {
    return res.status(400).json({ error: "archiveCode fehlt" });
  }

  archive.id = archive.id || crypto.randomUUID();
  archive.createdAt = archive.createdAt || new Date().toISOString();
  archive.updatedAt = new Date().toISOString();

  const filePath = path.join(DATA_DIR, `${archive.archiveCode}.json`);
  fs.writeFileSync(filePath, JSON.stringify(archive, null, 2), "utf8");

  res.json({ ok: true, archive });
});

app.get("/api/archive/:code", (req, res) => {
  const code = req.params.code;
  const filePath = path.join(DATA_DIR, `${code}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archiv nicht gefunden" });
  }

  const archive = JSON.parse(fs.readFileSync(filePath, "utf8"));
  res.json({ ok: true, archive });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Keine Datei empfangen" });
  }

  res.json({
    ok: true,
    file: {
      id: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    }
  });
});

app.listen(PORT, () => {
  console.log(`What Remains Backend läuft auf http://localhost:${PORT}`);
});
