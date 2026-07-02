import { invoke } from "@tauri-apps/api/core";
import type { ScanResult } from "../types";

export async function run_scan(): Promise<ScanResult[]> {
  return invoke<ScanResult[]>("run_scan");
}

export async function cancel_scan(): Promise<void> {
  return invoke<void>("cancel_scan");
}

export async function get_manifest_count(): Promise<number> {
  return invoke<number>("get_manifest_count");
}

export async function get_dll_owner(dll_name: string): Promise<string> {
  return invoke<string>("get_dll_owner", { dllName: dll_name });
}

export async function get_error_code_help(error_code: string): Promise<string> {
  return invoke<string>("get_error_code_help", { errorCode: error_code });
}

export async function open_in_browser(url: string): Promise<void> {
  return invoke<void>("open_in_browser", { url });
}

export async function get_memory_usage_mb(): Promise<number> {
  return invoke<number>("get_memory_usage_mb");
}

export async function get_system_status(): Promise<{
  memory_integrity: { status: string; detail: string } | null;
  gpu_driver: { status: string; detail: string } | null;
}> {
  return invoke("get_system_status");
}

export async function start_install(ids: string[]): Promise<void> {
  return invoke<void>("start_install", { ids });
}
