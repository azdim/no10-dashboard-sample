import type { NextConfig } from "next";
import path from "path";

/**
 * Portal is the Vercel strangler shell only.
 * Do not deploy the legacy Dash WSGI app (`../app`) to Vercel.
 *
 * With Vercel Root Directory = `portal`, parent `config/` + `data/` exist in the
 * git clone at build time but are omitted from serverless traces unless we set
 * outputFileTracingRoot + Includes.
 */
const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    // Manifests required at runtime for catalogue + RBAC + dataset API
    "/*": ["../config/**/*"],
    // Tiny sample CSVs — only needed if DATA_SOURCE=local on Vercel (smoke test).
    // Prefer DATA_SOURCE=r2 in production.
    "/api/datasets/**/*": ["../data/**/*"],
    "/dashboards/**/*": ["../data/**/*"],
  },
  serverExternalPackages: ["js-yaml", "csv-parse"],
};

export default nextConfig;
