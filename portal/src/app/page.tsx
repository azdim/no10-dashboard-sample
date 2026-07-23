import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Catalogue } from "@/components/Catalogue";
import { SiteHeader } from "@/components/SiteHeader";
import { getUserPermissions } from "@/lib/auth";
import { loadDashboards, type DashboardManifest } from "@/lib/manifests";
import styles from "./page.module.css";

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session.userId);

  let visibleDashboards: DashboardManifest[] = [];
  if (signedIn) {
    const permissions = await getUserPermissions();
    const all = loadDashboards();
    visibleDashboards = all.filter((d) =>
      permissions.includes(d.required_permission),
    );
  }

  return (
    <div className={styles.shell}>
      <SiteHeader />

      <main className={styles.main}>
        <p className={styles.eyebrow}>Internal analytics</p>
        <h1 className={styles.title}>Analytics Platform</h1>
        <p className={styles.lede}>
          Manifest-driven catalogue with Clerk RBAC and lazy dataset loading.
          The legacy Plotly Dash WSGI app under <code>app/</code> is not hosted
          on Vercel — this portal is the strangler shell.
        </p>

        {signedIn ? (
          <section className={styles.section} aria-label="Dashboard catalogue">
            <h2 className={styles.sectionTitle}>Your dashboards</h2>
            <Catalogue dashboards={visibleDashboards} />
          </section>
        ) : (
          <section className={styles.ctaBlock}>
            <p className={styles.ctaText}>
              Sign in to see the dashboards you are entitled to.
            </p>
            <div className={styles.ctaRow}>
              <Link className={styles.cta} href="/sign-in">
                Sign in
              </Link>
              <Link className={styles.ctaSecondary} href="/sign-up">
                Sign up
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
