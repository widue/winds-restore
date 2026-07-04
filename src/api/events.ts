import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { get_memory_usage_mb } from "./tauri";

let scanProgressUnlisten: UnlistenFn | null = null;

export async function registerScanProgressListener(
  callback: (progress: number, status: string) => void
): Promise<void> {
  if (scanProgressUnlisten) {
    scanProgressUnlisten();
  }

  scanProgressUnlisten = await listen("scan_progress", (event) => {
    const payload = event.payload as { progress: number; status: string };
    callback(payload.progress, payload.status);
  });
}

export function unregisterScanProgressListener(): void {
  if (scanProgressUnlisten) {
    scanProgressUnlisten();
    scanProgressUnlisten = null;
  }
}

let memoryUsageTimer: number | null = null;

export function startMemoryUsageMonitor(
  callback: (usage: number) => void,
  intervalMs = 5000
): void {
  stopMemoryUsageMonitor();
  memoryUsageTimer = window.setInterval(async () => {
    try {
      const usage = await get_memory_usage_mb();
      callback(usage);
    } catch {
      // 静默失败
    }
  }, intervalMs);
}

export function stopMemoryUsageMonitor(): void {
  if (memoryUsageTimer) {
    clearInterval(memoryUsageTimer);
    memoryUsageTimer = null;
  }
}

let installProgressUnlisten: UnlistenFn | null = null;

export async function registerInstallProgressListener(
  callback: (items: Array<{ id: string; name: string; status: string; percent: number; speed: string; eta: string }>, overall: number, finished: boolean) => void
): Promise<void> {
  if (installProgressUnlisten) {
    installProgressUnlisten();
  }

  installProgressUnlisten = await listen("install_progress", (event) => {
    const payload = event.payload as {
      items: Array<{ id: string; name: string; status: string; percent: number; speed: string; eta: string }>;
      overall_percent: number;
      finished: boolean;
    };
    callback(payload.items, payload.overall_percent, payload.finished);
  });
}

export function unregisterInstallProgressListener(): void {
  if (installProgressUnlisten) {
    installProgressUnlisten();
    installProgressUnlisten = null;
  }
}
