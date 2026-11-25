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

app.use(express.json({ limit: "2mb" }));
app.use("/api/auth", authRouter);
app.use("/api", publicRouter);
app.use("/api/admin", adminRouter);

app.use(express.static(path.join(root, "public")));
app.use(express.static(path.join(root, "dist")));

const port = Number(process.env.PORT || 4173);
app.listen(port, () => console.log(`Auth server listening on http://localhost:${port}`));
