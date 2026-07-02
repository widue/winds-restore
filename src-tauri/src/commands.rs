use std::sync::atomic::Ordering;
use serde::Serialize;
use tauri::{Emitter, State};

use crate::models::scan_result::ScanResult;
use crate::scanner;
use crate::scanner::installer;
use crate::state::AppState;

#[tauri::command]
pub async fn run_scan(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<Vec<ScanResult>, String> {
    let manifest = state.manifest.clone();
    let cancel_token = state.scan_cancel_token.clone();

    cancel_token.store(false, Ordering::Relaxed);

    let results = scanner::run_full_scan(
        &manifest,
        &cancel_token,
        |progress, status| {
            let _ = app.emit(
                "scan_progress",
                serde_json::json!({
                    "progress": progress,
                    "status": status,
                }),
            );
        },
    )
    .await;

    Ok(results)
}

#[tauri::command]
pub fn cancel_scan(state: State<'_, AppState>) -> Result<(), String> {
    state.scan_cancel_token.store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
pub fn get_manifest_count(state: State<'_, AppState>) -> usize {
    state.manifest.runtimes.len()
}

#[tauri::command]
pub fn get_dll_owner(state: State<'_, AppState>, dll_name: String) -> String {
    let lookup = scanner::build_dll_lookup(&state.manifest);
    scanner::get_dll_owner(&lookup, &dll_name)
}

#[tauri::command]
pub fn get_error_code_help(error_code: String) -> String {
    scanner::get_error_code_help(&error_code)
}

#[tauri::command]
pub fn open_in_browser(url: String) -> Result<(), String> {
    use windows::core::PCWSTR;
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let url_wide: Vec<u16> = url.encode_utf16().chain(std::iter::once(0)).collect();
    let open_wide: Vec<u16> = "open\0".encode_utf16().collect();

    let result = unsafe {
        ShellExecuteW(
            None,
            PCWSTR::from_raw(open_wide.as_ptr()),
            PCWSTR::from_raw(url_wide.as_ptr()),
            None,
            None,
            SW_SHOWNORMAL,
        )
    };

    if result.0 as isize > 32 {
        Ok(())
    } else {
        Err(format!("无法打开浏览器，错误码: {:?}", result.0))
    }
}

#[tauri::command]
pub fn get_memory_usage_mb() -> f64 {
    use windows::Win32::System::ProcessStatus::K32GetProcessMemoryInfo;
    use windows::Win32::System::Threading::GetCurrentProcess;
    use windows::Win32::System::ProcessStatus::PROCESS_MEMORY_COUNTERS;

    unsafe {
        let mut pmc = std::mem::zeroed::<PROCESS_MEMORY_COUNTERS>();
        let cb = std::mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32;
        let handle = GetCurrentProcess();
        if K32GetProcessMemoryInfo(handle, &mut pmc, cb).as_bool() {
            pmc.WorkingSetSize as f64 / (1024.0 * 1024.0)
        } else {
            0.0
        }
    }
}

#[tauri::command]
pub fn get_system_status() -> serde_json::Value {
    let (mem_status, mem_detail) = scanner::check_memory_integrity();
    let (gpu_status, gpu_detail) = scanner::check_gpu_driver();

    serde_json::json!({
        "memory_integrity": {
            "status": mem_status,
            "detail": mem_detail,
        },
        "gpu_driver": {
            "status": gpu_status,
            "detail": gpu_detail,
        },
    })
}

#[tauri::command]
pub fn enable_directplay() -> Result<String, String> {
    scanner::directx::enable_directplay()
}

#[derive(Clone, Serialize)]
pub struct InstallProgressPayload {
    pub items: Vec<InstallItemProgress>,
    pub overall_percent: f32,
    pub finished: bool,
}

#[derive(Clone, Serialize)]
pub struct InstallItemProgress {
    pub id: String,
    pub name: String,
    pub status: String,
    pub percent: f32,
    pub speed: String,
    pub eta: String,
}

#[tauri::command]
pub async fn start_install(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
    ids: Vec<String>,
) -> Result<(), String> {
    let manifest = state.manifest.clone();
    let runtimes: Vec<_> = manifest
        .runtimes
        .iter()
        .filter(|r| ids.contains(&r.id))
        .cloned()
        .collect();

    if runtimes.is_empty() {
        return Err("没有找到匹配的运行库".into());
    }

    let progress = installer::InstallProgress::new(runtimes.len());
    {
        let mut p = progress.lock().unwrap();
        for item in &runtimes {
            p.add_item(&item.id, &item.name);
        }
    }

    let prog_monitor = progress.clone();
    let app_monitor = app.clone();

    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(200));
            let p = prog_monitor.lock().unwrap();
            let items: Vec<InstallItemProgress> = p
                .items
                .iter()
                .map(|i| InstallItemProgress {
                    id: i.id.clone(),
                    name: i.name.clone(),
                    status: i.status.clone(),
                    percent: i.percent,
                    speed: i.speed.clone(),
                    eta: i.eta.clone(),
                })
                .collect();
            let overall = p.overall;
            let all_done = p.is_all_done();
            drop(p);

            let _ = app_monitor.emit(
                "install_progress",
                InstallProgressPayload {
                    items,
                    overall_percent: overall,
                    finished: all_done,
                },
            );

            if all_done {
                break;
            }
        }
    });

    let prog_worker = progress.clone();
    std::thread::spawn(move || {
        for entry in &runtimes {
            installer::process_item(entry, prog_worker.clone());
        }
    });

    Ok(())
}
