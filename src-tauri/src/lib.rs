#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod commands;
pub mod models;
pub mod scanner;
pub mod state;

use state::AppState;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let manifest = load_manifest();
            app.manage(AppState {
                manifest: Arc::new(manifest),
                scan_cancel_token: Arc::new(std::sync::atomic::AtomicBool::new(false)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::run_scan,
            commands::cancel_scan,
            commands::get_manifest_count,
            commands::get_dll_owner,
            commands::get_error_code_help,
            commands::open_in_browser,
            commands::get_memory_usage_mb,
            commands::get_system_status,
            commands::start_install,
            commands::scan_common_dlls,
            commands::check_system_files,
            commands::run_sfc_scannow,
            commands::sfc_repair_file,
            commands::run_dism_restorehealth,
            commands::check_winsxs_integrity,
            commands::check_virtual_memory,
            commands::check_shader_cache,
            commands::clean_shader_cache,
            commands::get_windows_info,
            commands::get_manifest_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn load_manifest() -> models::manifest::RuntimeManifest {
    let manifest_data = include_str!("../../assets/runtime_manifest.json");
    serde_json::from_str(manifest_data).expect("Failed to parse manifest")
}
