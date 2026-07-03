export type RuntimeStatus = "installed" | "missing" | "not_found";

export interface ScanResult {
  id: string;
  name: string;
  status: RuntimeStatus;
  details: string;
  installer_size_mb: number;
  category?: string;
}

export interface DllScanResult {
  name: string;
  found: boolean;
  path: string | null;
}

export interface SystemStatus {
  memory_integrity: { status: string; detail: string } | null;
  gpu_driver: { status: string; detail: string } | null;
}

export type AppPage = "home" | "scanning" | "results" | "tools" | "settings";
export type ScanMode = "quick" | "full";
export type SearchEngine = "bing" | "baidu";
export type AiSite = "DeepSeek" | "豆包" | "Kimi" | "ChatGPT";

export interface AppState {
  page: AppPage;
  scanMode: ScanMode;
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


export interface SystemFileResult {
  name: string;
  description: string;
  found: boolean;
  path: string | null;
}

export interface RepairResult {
  success: boolean;
  output: string;
}

export interface WinSxSStatus {
  scan_result: RepairResult;
  api_set_count: number;
  api_set_found: number;
}

export interface VirtualMemoryInfo {
  enabled: boolean;
  is_system_managed: boolean;
  initial_size_mb: number;
  max_size_mb: number;
}

export interface ShaderVendorCache {
  name: string;
  path: string;
  size_mb: number;
}

export interface ShaderCacheInfo {
  total_size_mb: number;
  vendors: ShaderVendorCache[];
}

export interface WindowsInfo {
  version: string;
  build: string;
  edition: string;
  product_name: string;
  display_version: string;
  is_24h2: boolean;
  is_n_kn: boolean;
  media_feature_package_available: boolean;
}

export interface ManifestSummary {
  runtime_count: number;
  dll_count: number;
}

export type InstallPage = "idle" | "installing" | "done";
