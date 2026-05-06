import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const rootDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(rootDir, "backend");
const webDir = resolve(rootDir, "frontend");
const viteCli = resolve(webDir, "node_modules/vite/bin/vite.js");

const apiPort = "5000";
const webPort = "3000";
const basePath = "/";

const children = new Set();
let shuttingDown = false;

function prefixStream(label, stream) {
  const rl = createInterface({ input: stream });

  rl.on("line", (line) => {
    process.stdout.write(`[${label}] ${line}\n`);
  });
}

function spawnProcess(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? rootDir,
    env: {
      ...process.env,
      ...options.env,
    },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.add(child);

  if (child.stdout) prefixStream(label, child.stdout);
  if (child.stderr) prefixStream(label, child.stderr);

  child.on("exit", (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    if (code === 0 && !signal) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 1}`;
    console.error(`[${label}] exited unexpectedly with ${reason}`);
    shutdown(code ?? 1);
  });

  child.on("error", (error) => {
    console.error(`[${label}] failed to start`, error);
    shutdown(1);
  });

  return child;
}

function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    child.kill();
  }

  process.exitCode = exitCode;
}

async function runOnce(command, args, options = {}) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: {
        ...process.env,
        ...options.env,
      },
      shell: false,
      stdio: "inherit",
    });

    child.on("error", rejectPromise);
    child.on("exit", (code, signal) => {
      if (code === 0 && !signal) {
        resolvePromise();
        return;
      }

      rejectPromise(
        new Error(
          `${command} ${args.join(" ")} exited with ${signal ? `signal ${signal}` : `code ${code ?? 1}`}`,
        ),
      );
    });
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  await runOnce(process.execPath, [resolve(apiDir, "build.mjs")], {
    cwd: apiDir,
    env: {
      NODE_ENV: "development",
    },
  });

  spawnProcess("api", process.execPath, ["--enable-source-maps", "dist/index.mjs"], {
    cwd: apiDir,
    env: {
      NODE_ENV: "development",
      PORT: apiPort,
    },
  });

  spawnProcess("web", process.execPath, [viteCli, "--config", "vite.config.ts", "--host", "0.0.0.0"], {
    cwd: webDir,
    env: {
      NODE_ENV: "development",
      PORT: webPort,
      BASE_PATH: basePath,
    },
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
}