import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import { findFileById, initDb, insertFile, listFiles } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

const uploadsDir = path.resolve("uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    const safeBase = base.slice(0, 50) || "file";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "juma-server" });
});

app.post("/api/files", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No se recibio archivo. Usa el campo 'file'." });
      return;
    }

    const saved = await insertFile(req.file);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
});

app.get("/api/files", async (_req, res, next) => {
  try {
    const files = await listFiles();
    res.json(files);
  } catch (error) {
    next(error);
  }
});

app.get("/api/files/:id/download", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Id invalido." });
      return;
    }

    const file = await findFileById(id);
    if (!file) {
      res.status(404).json({ error: "Archivo no encontrado." });
      return;
    }

    const absolutePath = path.join(uploadsDir, file.storedName);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: "Archivo fisico no encontrado." });
      return;
    }

    res.download(absolutePath, file.originalName);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Archivo demasiado grande. Maximo 10MB." });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ error: "Error interno del servidor." });
});

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
}

start();
