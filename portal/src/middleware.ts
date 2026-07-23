import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Protect dashboards + dataset APIs. Public: home, sign-in, sign-up, static assets.
 * Note: Dash WSGI is NOT hosted here / on Vercel — this portal is the strangler shell only.
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboards(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
