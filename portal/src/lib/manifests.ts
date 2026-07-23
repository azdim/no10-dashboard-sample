import "server-only";
import fs from "fs";
import path from "path";
import { load as loadYaml } from "js-yaml";
import { getConfigDir } from "./paths";

export type DashboardStatus = "migrated" | "not_migrated";

export type DashboardManifest = {
  id: string;
  title: string;
  description: string;
  path: string;
  required_permission: string;
  datasets: string[];
  status: DashboardStatus;
};

export type DatasetManifest = {
  id: string;
  local_path: string;
  r2_key: string;
};

type DashboardsFile = {
  dashboards: DashboardManifest[];
};

type DatasetsFile = {
  datasets: DatasetManifest[];
};

function readYamlFile<T>(filename: string): T {
  const filePath = path.join(getConfigDir(), filename);
  const raw = fs.readFileSync(filePath, "utf8");
  return loadYaml(raw) as T;
}

/** Load dashboards catalogue from repo-root config/dashboards.yaml (lazy per call). */
export function loadDashboards(): DashboardManifest[] {
  const data = readYamlFile<DashboardsFile>("dashboards.yaml");
  return data.dashboards ?? [];
}

/** Load datasets catalogue from repo-root config/datasets.yaml (lazy per call). */
export function loadDatasets(): DatasetManifest[] {
  const data = readYamlFile<DatasetsFile>("datasets.yaml");
  return data.datasets ?? [];
}

export function getDashboardByPath(pathname: string): DashboardManifest | undefined {
  return loadDashboards().find((d) => d.path === pathname);
}

export function getDashboardById(id: string): DashboardManifest | undefined {
  return loadDashboards().find((d) => d.id === id);
}

export function getDatasetById(id: string): DatasetManifest | undefined {
  return loadDatasets().find((d) => d.id === id);
}

/** Permissions that unlock access to a given dataset id. */
export function permissionsForDataset(datasetId: string): string[] {
  return loadDashboards()
    .filter((d) => d.datasets.includes(datasetId))
    .map((d) => d.required_permission);
}
