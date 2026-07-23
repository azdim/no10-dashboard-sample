import Link from "next/link";
import styles from "./Forbidden.module.css";

type Props = {
  title?: string;
  message?: string;
};

export function Forbidden({
  title = "403 — Forbidden",
  message = "You do not have permission to view this dashboard.",
}: Props) {
  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      <Link className={styles.link} href="/">
        ← Back to catalogue
      </Link>
    </main>
  );
}
