"use client";

import { useEffect, useState } from "react";
import styles from "./CustomerDataPanel.module.css";

type DatasetResponse = {
  id: string;
  source: string;
  rowCount: number;
  records: Record<string, string>[];
  error?: string;
};

export function CustomerDataPanel() {
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/datasets/customer_data");
        const json = (await res.json()) as DatasetResponse;
        if (!res.ok) {
          throw new Error(json.error || `Request failed (${res.status})`);
        }
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className={styles.status}>Loading customer_data…</p>;
  }

  if (error) {
    return <p className={styles.error}>Error: {error}</p>;
  }

  if (!data) {
    return null;
  }

  const columns =
    data.records.length > 0 ? Object.keys(data.records[0]) : [];

  return (
    <div className={styles.panel}>
      <div className={styles.meta}>
        <p>
          <strong>{data.rowCount}</strong> rows · source{" "}
          <code>{data.source}</code> · dataset <code>{data.id}</code>
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.records.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
