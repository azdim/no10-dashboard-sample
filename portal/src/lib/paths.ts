import "server-only";
import fs from "fs";
import path from "path";

/**
 * Resolve the monorepo root that holds `config/` and `data/`.
 * - Local / Vercel Root Directory=`portal`: cwd is `portal/` → parent is repo root
 * - Some serverless layouts: cwd is tracing root and `config/` is a sibling of `portal/`
 * - Optional override: REPO_ROOT (absolute path)
 */
export function getRepoRoot(): string {
  const fromEnv = process.env.REPO_ROOT;
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  const cwd = /*turbopackIgnore: true*/ process.cwd();
  const candidates = [
    path.join(cwd, ".."), // portal → repo root
    cwd, // already at repo / tracing root
  ];

  for (const root of candidates) {
    if (fs.existsSync(path.join(root, "config", "dashboards.yaml"))) {
      return root;
    }
  }

  // Fallback for local portal/ development
  return path.join(cwd, "..");
}

export function getConfigDir(): string {
  return path.join(getRepoRoot(), "config");
}

export function getDataRoot(): string {
  const fromEnv = process.env.DATA_ROOT;
  if (fromEnv) {
    return path.isAbsolute(fromEnv)
      ? fromEnv
      : path.resolve(/*turbopackIgnore: true*/ process.cwd(), fromEnv);
  }
  return path.join(getRepoRoot(), "data");
}
