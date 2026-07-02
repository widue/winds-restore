export type RuntimeStatus = "installed" | "missing" | "not_found";

export interface ScanResult {
  id: string;
  name: string;
  status: RuntimeStatus;
  details: string;
  installer_size_mb: number;
  category?: string;
}

export interface SystemStatus {
  memory_integrity: { status: string; detail: string } | null;
  gpu_driver: { status: string; detail: string } | null;
}

export type AppPage = "home" | "scanning" | "results" | "tools" | "settings";
export type SearchEngine = "bing" | "baidu";
export type AiSite = "DeepSeek" | "豆包" | "Kimi" | "ChatGPT";

export interface AppState {
  page: AppPage;
  scanResults: ScanResult[];
  scanProgress: number;
  scanStatus: string;
  isScanning: boolean;
  systemStatus: SystemStatus;
  theme: "dark" | "light";
  memoryUsage: number;
  installProgress: InstallItemProgress[];
  installOverall: number;
  installFinished: boolean;
  installPage: InstallPage;
  searchEngine: SearchEngine;
  aiSite: AiSite;
}

export interface ScanProgressPayload {
  progress: number;
  status: string;
  current?: string;
}

export interface InstallItemProgress {
  id: string;
  name: string;
  status: string;
  percent: number;
  speed: string;
  eta: string;
}

export interface InstallProgressPayload {
  items: InstallItemProgress[];
  overall_percent: number;
  finished: boolean;
}

export type InstallPage = "idle" | "installing" | "done";
