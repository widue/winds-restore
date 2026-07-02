import { create } from "zustand";
import type {
  AppState,
  ScanResult,
  SystemStatus,
  AppPage,
  SearchEngine,
  AiSite,
  ScanProgressPayload,
  InstallItemProgress,
} from "../types";
import { run_scan, cancel_scan, start_install, get_system_status } from "../api/tauri";
import { registerScanProgressListener, unregisterScanProgressListener, registerInstallProgressListener, unregisterInstallProgressListener } from "../api/events";

interface AppStore extends AppState {
  setPage: (page: AppPage) => void;
  startScan: () => Promise<void>;
  cancelScan: () => Promise<void>;
  updateScanProgress: (payload: ScanProgressPayload) => void;
  setScanResults: (results: ScanResult[]) => void;
  setSystemStatus: (status: SystemStatus) => void;
  setMemoryUsage: (usage: number) => void;
  resetScan: () => void;
  startInstall: (ids: string[]) => Promise<void>;
  updateInstallProgress: (items: InstallItemProgress[], overall: number, finished: boolean) => void;
  resetInstall: () => void;
  setSearchEngine: (engine: SearchEngine) => void;
  setAiSite: (site: AiSite) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  page: "home",
  scanResults: [],
  scanProgress: 0,
  scanStatus: "准备就绪",
  isScanning: false,
  systemStatus: { memory_integrity: null, gpu_driver: null },
  theme: "dark",
  memoryUsage: 0,
  installProgress: [],
  installOverall: 0,
  installFinished: false,
  installPage: "idle",
  searchEngine: "bing",
  aiSite: "DeepSeek",

  setPage: (page) => set({ page }),

  startScan: async () => {
    if (get().isScanning) return;

    set({
      isScanning: true,
      scanProgress: 0,
      scanStatus: "开始扫描...",
      page: "scanning",
      scanResults: [],
    });

    try {
      await registerScanProgressListener((progress, status) => {
        get().updateScanProgress({ progress, status });
      });

      const [results, status] = await Promise.all([
        run_scan(),
        get_system_status().catch(() => ({ memory_integrity: null, gpu_driver: null })),
      ]);
      set({
        scanResults: results,
        systemStatus: status,
        scanProgress: 100,
        scanStatus: "扫描完成",
        page: "results",
      });
    } catch (error) {
      set({
        scanStatus: `扫描失败: ${error}`,
        isScanning: false,
      });
    } finally {
      set({ isScanning: false });
      unregisterScanProgressListener();
    }
  },

  cancelScan: async () => {
    try {
      await cancel_scan();
      set({
        isScanning: false,
        scanStatus: "已取消",
      });
    } catch {
      set({ isScanning: false });
    }
  },

  updateScanProgress: (payload) => {
    set({
      scanProgress: payload.progress,
      scanStatus: payload.status,
    });
  },

  setScanResults: (results) => set({ scanResults: results }),
  setSystemStatus: (status) => set({ systemStatus: status }),
  setMemoryUsage: (usage) => set({ memoryUsage: usage }),
  setSearchEngine: (engine) => set({ searchEngine: engine }),
  setAiSite: (site) => set({ aiSite: site }),

  resetScan: () =>
    set({
      scanResults: [],
      scanProgress: 0,
      scanStatus: "准备就绪",
      isScanning: false,
      page: "home",
    }),

  startInstall: async (ids) => {
    set({
      installProgress: ids.map((id) => ({ id, name: "", status: "等待中", percent: 0, speed: "", eta: "" })),
      installOverall: 0,
      installFinished: false,
      installPage: "installing",
    });

    try {
      await registerInstallProgressListener((items, overall, finished) => {
        get().updateInstallProgress(items, overall, finished);
      });

      await start_install(ids);
    } catch (error) {
      set({
        installPage: "idle",
      });
    } finally {
      unregisterInstallProgressListener();
    }
  },

  updateInstallProgress: (items, overall, finished) => {
    set({
      installProgress: items,
      installOverall: overall,
      installFinished: finished,
      installPage: finished ? "done" : "installing",
    });
  },

  resetInstall: () =>
    set({
      installProgress: [],
      installOverall: 0,
      installFinished: false,
      installPage: "idle",
    }),
}));
