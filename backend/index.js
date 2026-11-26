import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { initDatabase } from "./db/database.js";
import authRouter from "./routes/auth.js";
import publicRouter from "./routes/public.js";
import adminRouter from "./routes/admin.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();

await initDatabase();

app.use(express.json({ limit: "15mb" }));

// Guarantee req.body is always an object so route handlers never throw on empty bodies
app.use((req, _res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    req.body = {};
  }
  next();
});

app.use("/api/auth", authRouter);
app.use("/api", publicRouter);
app.use("/api/admin", adminRouter);

// Return clean JSON 404 for unknown API routes instead of HTML
app.use("/api", (_req, res) => {
  return res.status(404).json({ message: "API endpoint topilmadi." });
});

app.use(express.static(path.join(root, "public")));
app.use(express.static(path.join(root, "dist")));

// SPA fallback in production when dist/index.html exists
const distIndex = path.join(root, "dist", "index.html");
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api") && fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  return next();
});

// Global JSON error handler (malformed JSON, payload too large, SQLite constraints, unexpected errors)
app.use((err, _req, res, _next) => {
  if (!err) return res.status(500).json({ message: "Ichki server xatosi." });
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ message: "Noto‘g‘ri JSON ma’lumot yuborildi." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Yuborilgan fayl yoki rasm hajmi juda katta (maksimum 15 MB)." });
  }
  if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(409).json({ message: "Bunday ma’lumot bazada allaqachon mavjud." });
  }
  if (String(err.code || "").startsWith("SQLITE_CONSTRAINT")) {
    return res.status(400).json({ message: "Ma’lumotlar bazasi cheklovi buzildi. Maydonlarni tekshiring." });
  }
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  console.error("[API Error]", err.message || err);
  return res.status(status).json({ message: err.message || "Serverda kutilmagan xatolik yuz berdi." });
});

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
});

const port = Number(process.env.PORT || 4173);
app.listen(port, () => console.log(`Auth server listening on http://localhost:${port}`));
