import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CustomerDataPanel } from "@/components/CustomerDataPanel";
import { requireDashboardAccess } from "@/lib/require-dashboard";
import styles from "../dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function CustomerAnalyticsPage() {
  const dashboard = await requireDashboardAccess(
    "/dashboards/customer-analytics",
  );

  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main>
        <p className={styles.crumb}>
          <Link href="/">Catalogue</Link> / Customer Analytics
        </p>
        <h1 className={styles.title}>{dashboard.title}</h1>
        <p className={styles.lede}>
          Lazy-loads only the <code>customer_data</code> dataset via{" "}
          <code>GET /api/datasets/customer_data</code>.
        </p>
        <CustomerDataPanel />
      </main>
    </div>
  );
}
