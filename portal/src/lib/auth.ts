import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Clerk RBAC contract (see docs/clerk-rbac.md):
 *   user.publicMetadata.permissions: string[]
 *
 * Example:
 *   { "permissions": ["customer_analytics", "sales_dashboard"] }
 */
export async function getUserPermissions(): Promise<string[]> {
  const user = await currentUser();
  if (!user) {
    return [];
  }

  const raw = user.publicMetadata?.permissions;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((p): p is string => typeof p === "string");
}

export async function requireSignedIn(): Promise<{ userId: string }> {
  const session = await auth();
  if (!session.userId) {
    // Middleware should already redirect; this is a hard server-side guard.
    throw new Error("Unauthenticated");
  }
  return { userId: session.userId };
}

export function hasPermission(
  permissions: string[],
  required: string,
): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(
  permissions: string[],
  required: string[],
): boolean {
  return required.some((p) => permissions.includes(p));
}
