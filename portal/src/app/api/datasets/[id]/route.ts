import { NextResponse } from "next/server";
import {
  getUserPermissions,
  hasAnyPermission,
  requireSignedIn,
} from "@/lib/auth";
import { getDatasetById, permissionsForDataset } from "@/lib/manifests";
import { loadDataset } from "@/lib/data-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/datasets/[id]
 * — Requires Clerk session (middleware + server check)
 * — Resolves id via config/datasets.yaml
 * — Authorises if user has permission for any dashboard listing this dataset
 * — Lazy-loads only the requested dataset (local CSV or R2 GetObject)
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSignedIn();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const dataset = getDatasetById(id);
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  const permissions = await getUserPermissions();
  const allowed = permissionsForDataset(id);
  if (!hasAnyPermission(permissions, allowed)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await loadDataset(id);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dataset";
    console.error(`[datasets/${id}]`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
