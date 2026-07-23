import Link from "next/link";
import type { DashboardManifest } from "@/lib/manifests";
import styles from "./Catalogue.module.css";

type Props = {
  dashboards: DashboardManifest[];
};

export function Catalogue({ dashboards }: Props) {
  if (dashboards.length === 0) {
    return (
      <p className={styles.empty}>
        No dashboards are available for your account. Ask an admin to grant
        permissions in Clerk public metadata.
      </p>
    );
  }

  return (
    <ul className={styles.grid}>
      {dashboards.map((dashboard) => (
        <li key={dashboard.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{dashboard.title}</h2>
            {dashboard.status === "not_migrated" ? (
              <span className={styles.badge}>Coming soon</span>
            ) : (
              <span className={styles.badgeLive}>Live</span>
            )}
          </div>
          <p className={styles.cardDesc}>{dashboard.description}</p>
          <Link className={styles.cardLink} href={dashboard.path}>
            Open dashboard →
          </Link>
        </li>
      ))}
    </ul>
  );
}
