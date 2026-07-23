import "server-only";
import { forbidden, notFound } from "next/navigation";
import { getUserPermissions, hasPermission } from "@/lib/auth";
import { getDashboardByPath, type DashboardManifest } from "@/lib/manifests";

/**
 * Server-side RBAC gate for dashboard routes.
 * Missing catalogue entry → 404; missing permission → 403 (not CSS-only).
 */
export async function requireDashboardAccess(
  pathname: string,
): Promise<DashboardManifest> {
  const dashboard = getDashboardByPath(pathname);
  if (!dashboard) {
    notFound();
  }

  const permissions = await getUserPermissions();
  if (!hasPermission(permissions, dashboard.required_permission)) {
    forbidden();
  }

  return dashboard;
}
