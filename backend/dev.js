import { spawn } from "node:child_process";

const api = spawn("node", ["--watch", "backend/index.js"], { stdio: "inherit", shell: true });
const vite5173 = spawn("npx", ["vite", "--port", "5173"], { stdio: "inherit", shell: true });
const vite5174 = spawn("npx", ["vite", "--port", "5174"], { stdio: "inherit", shell: true });

const shutdown = (signal) => {
  api.kill(signal);
  vite5173.kill(signal);
  vite5174.kill(signal);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
