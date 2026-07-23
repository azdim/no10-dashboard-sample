import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { requireDashboardAccess } from "@/lib/require-dashboard";
import styles from "../dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function SalesDashboardPage() {
  const dashboard = await requireDashboardAccess("/dashboards/sales-dashboard");

  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main>
        <p className={styles.crumb}>
          <Link href="/">Catalogue</Link> / Sales Dashboard
        </p>
        <h1 className={styles.title}>{dashboard.title}</h1>
        <div className={styles.stub}>
          <p className={styles.stubTitle}>Not migrated yet</p>
          <p className={styles.stubBody}>
            Permission checks work; chart port from the legacy Dash module is
            out of scope for Parts A–B.
          </p>
        </div>
      </main>
    </div>
  );
}
