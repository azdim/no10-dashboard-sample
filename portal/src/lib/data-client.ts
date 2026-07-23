import "server-only";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getDataRoot } from "./paths";
import { getDatasetById } from "./manifests";

export type DatasetPayload = {
  id: string;
  source: "local" | "r2";
  rowCount: number;
  records: Record<string, string>[];
};

const DEFAULT_PREVIEW_CAP = 500;

function getDataSource(): "local" | "r2" {
  const value = (process.env.DATA_SOURCE ?? "local").toLowerCase();
  return value === "r2" ? "r2" : "local";
}

function parseCsv(csvText: string): Record<string, string>[] {
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
}

async function readLocalCsv(localPath: string): Promise<string> {
  const fullPath = path.join(getDataRoot(), localPath);
  return fs.readFile(fullPath, "utf8");
}

function createR2Client(): S3Client {
  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  if (
    !endpoint ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET
  ) {
    throw new Error(
      "R2 is not configured. Set R2_ENDPOINT (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.",
    );
  }

  return new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function streamToString(
  body: AsyncIterable<Uint8Array> | ReadableStream | Blob | string | undefined,
): Promise<string> {
  if (!body) {
    return "";
  }
  if (typeof body === "string") {
    return body;
  }
  // Node.js SDK typically returns a readable stream with transformToString
  const maybe = body as { transformToString?: () => Promise<string> };
  if (typeof maybe.transformToString === "function") {
    return maybe.transformToString();
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readR2Csv(r2Key: string): Promise<string> {
  const client = createR2Client();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: r2Key,
    }),
  );
  return streamToString(result.Body as AsyncIterable<Uint8Array>);
}

/**
 * Lazy-load a single dataset by id. Never loads other datasets at startup.
 */
export async function loadDataset(
  id: string,
  options?: { previewCap?: number },
): Promise<DatasetPayload> {
  const manifest = getDatasetById(id);
  if (!manifest) {
    const err = new Error(`Unknown dataset: ${id}`);
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  const source = getDataSource();
  const csvText =
    source === "r2"
      ? await readR2Csv(manifest.r2_key)
      : await readLocalCsv(manifest.local_path);

  const allRecords = parseCsv(csvText);
  const cap = options?.previewCap ?? DEFAULT_PREVIEW_CAP;

  return {
    id,
    source,
    rowCount: allRecords.length,
    records: allRecords.slice(0, cap),
  };
}
