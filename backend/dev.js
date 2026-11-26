import { spawn } from "node:child_process";

const useShell = process.platform === "win32";
const npxCmd = useShell ? "npx.cmd" : "npx";

const api = spawn(process.execPath, ["--watch", "backend/index.js"], { stdio: "inherit", shell: false });
const vite5173 = spawn(npxCmd, ["vite", "--port", "5173"], { stdio: "inherit", shell: useShell });
const vite5174 = spawn(npxCmd, ["vite", "--port", "5174"], { stdio: "inherit", shell: useShell });

const shutdown = (signal) => {
  api.kill(signal);
  vite5173.kill(signal);
  vite5174.kill(signal);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
