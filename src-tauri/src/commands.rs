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
pub fn check_dll_path(path: String) -> bool {
    std::path::Path::new(&path).exists()
}

#[tauri::command]
pub fn scan_common_dlls(dll_names: Vec<String>) -> Vec<scanner::DllScanResult> {
    scanner::scan_common_dll_list(&dll_names)
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

const SYSTEM_CHECK_DLLS: &[(&str, &str)] = &[
    ("ole32.dll", "COM 组件"),
    ("oleaut32.dll", "OLE 自动化"),
    ("comctl32.dll", "通用控件库"),
    ("shell32.dll", "Windows Shell"),
    ("shlwapi.dll", "Shell 轻量 API"),
    ("rpcrt4.dll", "远程过程调用"),
    ("advapi32.dll", "高级 API 服务"),
    ("gdi32.dll", "GDI 图形设备接口"),
    ("user32.dll", "用户界面 API"),
    ("kernel32.dll", "Windows 核心 API"),
    ("ntdll.dll", "NT 层 API"),
    ("ws2_32.dll", "Winsock 网络"),
    ("crypt32.dll", "加密 API"),
    ("winhttp.dll", "WinHTTP 网络"),
    ("wininet.dll", "WinINet 网络"),
    ("urlmon.dll", "URL 监控"),
    ("winmm.dll", "Windows 多媒体"),
    ("msxml6.dll", "MSXML 6.0"),
    ("setupapi.dll", "安装 API"),
    ("wintrust.dll", "证书验证"),
    ("secur32.dll", "安全 API"),
    ("version.dll", "版本信息"),
    ("uxtheme.dll", "主题引擎"),
    ("dwmapi.dll", "桌面窗口管理器"),
    ("propsys.dll", "属性系统"),
    ("mshtml.dll", "IE HTML 渲染引擎"),
    ("wmvcore.dll", "Windows Media 核心"),
    ("strmdll.dll", "ASF 流媒体"),
    ("msdmo.dll", "DirectShow 媒体对象"),
    ("netapi32.dll", "网络 API"),
    ("iphlpapi.dll", "IP 助手 API"),
    ("dnsapi.dll", "DNS 客户端 API"),
    ("wkssvc.dll", "工作站服务"),
    ("certca.dll", "证书 CA"),
    ("xmllite.dll", "XML 轻量解析器"),
    ("newdev.dll", "设备安装"),
    ("powrprof.dll", "电源管理"),
    ("cfgmgr32.dll", "配置管理器"),
    ("clusapi.dll", "集群 API"),
    ("wtsapi32.dll", "远程桌面 API"),
    ("psapi.dll", "进程状态 API"),
    ("dbghelp.dll", "调试帮助"),
    ("imagehlp.dll", "映像帮助"),
    ("bcrypt.dll", "加密基元"),
    ("ncrypt.dll", "加密保护"),
    ("srvcli.dll", "服务器客户端"),
    ("netutils.dll", "网络工具"),
    ("vssapi.dll", "卷影复制"),
    ("msi.dll", "Windows Installer"),
    ("mpr.dll", "多提供程序路由"),
    ("samlib.dll", "SAM 库"),
    ("wmi.dll", "WMI"),
    ("qmgr.dll", "后台智能传输"),
];

#[derive(Clone, Serialize)]
pub struct SystemFileResult {
    pub name: String,
    pub description: String,
    pub found: bool,
    pub path: Option<String>,
}

#[tauri::command]
pub fn check_system_files() -> Vec<SystemFileResult> {
    let dirs = [
        "C:\\Windows\\System32",
        "C:\\Windows\\SysWOW64",
    ];
    SYSTEM_CHECK_DLLS.iter().map(|(name, desc)| {
        let mut found = false;
        let mut found_path = None;
        for dir in &dirs {
            let full = format!("{}\\{}", dir, name);
            if std::path::Path::new(&full).exists() {
                found = true;
                found_path = Some(full);
                break;
            }
        }
        SystemFileResult {
            name: name.to_string(),
            description: desc.to_string(),
            found,
            path: found_path,
        }
    }).collect()
}

#[derive(Clone, Serialize)]
pub struct RepairResult {
    pub success: bool,
    pub output: String,
}

#[tauri::command]
pub fn run_sfc_scannow() -> Result<RepairResult, String> {
    let output = std::process::Command::new("sfc.exe")
        .args(["/scannow"])
        .output()
        .map_err(|e| format!("启动 SFC 失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);

    let success = output.status.success() || combined.contains("Windows Resource Protection found corrupt files and successfully repaired them")
        || combined.contains("Windows Resource Protection did not find any integrity violations");

    Ok(RepairResult { success, output: combined.trim().to_string() })
}

#[tauri::command]
pub fn run_dism_restorehealth() -> Result<RepairResult, String> {
    let output = std::process::Command::new("dism.exe")
        .args(["/online", "/Cleanup-Image", "/RestoreHealth"])
        .output()
        .map_err(|e| format!("启动 DISM 失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);

    let success = output.status.success() || combined.contains("The restoration operation completed successfully")
        || combined.contains("No component store corruption detected");

    Ok(RepairResult { success, output: combined.trim().to_string() })
}
