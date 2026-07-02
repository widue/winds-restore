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
pub async fn check_system_files() -> Vec<SystemFileResult> {
    tauri::async_runtime::spawn_blocking(move || {
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
    }).await.unwrap_or_else(|_| vec![])
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
pub fn sfc_repair_file(file_path: String) -> Result<RepairResult, String> {
    let output = std::process::Command::new("sfc.exe")
        .args(["/scanfile", &file_path])
        .output()
        .map_err(|e| format!("启动 SFC /scanfile 失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);

    let success = output.status.success()
        || combined.contains("successfully repaired")
        || combined.contains("did not find any integrity violations");

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

// ─── WinSxS / API Sets 完整性检查 ───

#[derive(Clone, Serialize)]
pub struct WinSxSStatus {
    pub scan_result: RepairResult,
    pub api_set_count: usize,
    pub api_set_found: usize,
}

#[tauri::command]
pub fn check_winsxs_integrity() -> Result<WinSxSStatus, String> {
    let output = std::process::Command::new("dism.exe")
        .args(["/online", "/Cleanup-Image", "/ScanHealth"])
        .output()
        .map_err(|e| format!("启动 DISM ScanHealth 失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = format!("{}{}", stdout, stderr);

    let success = output.status.success()
        || combined.contains("No component store corruption detected")
        || combined.contains("The component store is repairable");

    let apiset_names = [
        "api-ms-win-crt-runtime-l1-1-0.dll",
        "api-ms-win-crt-stdio-l1-1-0.dll",
        "api-ms-win-crt-math-l1-1-0.dll",
        "api-ms-win-crt-string-l1-1-0.dll",
        "api-ms-win-crt-heap-l1-1-0.dll",
        "api-ms-win-crt-convert-l1-1-0.dll",
        "api-ms-win-crt-locale-l1-1-0.dll",
        "api-ms-win-crt-filesystem-l1-1-0.dll",
        "api-ms-win-crt-time-l1-1-0.dll",
        "api-ms-win-crt-environment-l1-1-0.dll",
        "api-ms-win-crt-utility-l1-1-0.dll",
        "api-ms-win-crt-multibyte-l1-1-0.dll",
        "api-ms-win-core-file-l1-2-0.dll",
        "api-ms-win-core-processthreads-l1-1-1.dll",
        "api-ms-win-core-synch-l1-2-0.dll",
        "api-ms-win-core-memory-l1-1-0.dll",
        "api-ms-win-core-libraryloader-l1-1-0.dll",
        "api-ms-win-core-handle-l1-1-0.dll",
        "api-ms-win-core-errorhandling-l1-1-0.dll",
        "api-ms-win-core-debug-l1-1-0.dll",
        "api-ms-win-core-datetime-l1-1-0.dll",
        "api-ms-win-core-profile-l1-1-0.dll",
        "api-ms-win-core-sysinfo-l1-1-0.dll",
        "api-ms-win-core-util-l1-1-0.dll",
        "api-ms-win-core-string-l1-1-0.dll",
        "api-ms-win-core-interlocked-l1-1-0.dll",
        "api-ms-win-core-localization-l1-2-0.dll",
        "api-ms-win-core-console-l1-1-0.dll",
        "api-ms-win-core-processenvironment-l1-1-0.dll",
        "api-ms-win-core-namedpipe-l1-1-0.dll",
        "api-ms-win-core-io-l1-1-0.dll",
        "api-ms-win-core-threadpool-l1-2-0.dll",
        "api-ms-win-core-heap-l1-1-0.dll",
        "api-ms-win-core-rtlsupport-l1-1-0.dll",
        "api-ms-win-core-delayload-l1-1-0.dll",
        "api-ms-win-eventing-classicprovider-l1-1-0.dll",
        "ext-ms-win-*",
    ];

    let dirs = ["C:\\Windows\\System32", "C:\\Windows\\SysWOW64"];
    let mut found = 0usize;
    for name in &apiset_names {
        if name.contains('*') { found += 1; continue; }
        for dir in &dirs {
            let p = format!("{}\\{}", dir, name);
            if std::path::Path::new(&p).exists() {
                found += 1;
                break;
            }
        }
    }

    Ok(WinSxSStatus {
        scan_result: RepairResult { success, output: combined.trim().to_string() },
        api_set_count: apiset_names.len(),
        api_set_found: found,
    })
}

// ─── 虚拟内存诊断 ───

#[derive(Clone, Serialize)]
pub struct VirtualMemoryInfo {
    pub enabled: bool,
    pub is_system_managed: bool,
    pub initial_size_mb: u64,
    pub max_size_mb: u64,
}

#[tauri::command]
pub fn check_virtual_memory() -> VirtualMemoryInfo {
    let mut info = VirtualMemoryInfo {
        enabled: true,
        is_system_managed: true,
        initial_size_mb: 0,
        max_size_mb: 0,
    };

    if let (crate::models::scan_result::RuntimeStatus::Installed, value) = crate::scanner::registry::check_registry_value_raw(
        "SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management",
        "PagingFiles"
    ) {
            let val = value.trim();
            if val.is_empty() || val == "? ? 0" || val == "0 0" {
                info.enabled = false;
                info.is_system_managed = false;
            } else if val.starts_with("?") || val.contains("system managed") {
                info.is_system_managed = true;
            } else {
                info.is_system_managed = false;
                let parts: Vec<&str> = val.split_whitespace().collect();
                if parts.len() >= 2 {
                    info.initial_size_mb = parts[parts.len() - 2].parse().unwrap_or(0);
                    info.max_size_mb = parts[parts.len() - 1].parse().unwrap_or(0);
                }
        }
    }

    info
}

// ─── 着色器缓存检测/清理 ───

#[derive(Clone, Serialize)]
pub struct ShaderCacheInfo {
    pub total_size_mb: u64,
    pub vendors: Vec<ShaderVendorCache>,
}

#[derive(Clone, Serialize)]
pub struct ShaderVendorCache {
    pub name: String,
    pub path: String,
    pub size_mb: u64,
}

fn resolve_env(path: &str) -> String {
    let mut s = path.to_string();
    if let Ok(val) = std::env::var("PROGRAMDATA") {
        s = s.replace("%PROGRAMDATA%", &val);
    }
    if let Ok(val) = std::env::var("LOCALAPPDATA") {
        s = s.replace("%LOCALAPPDATA%", &val);
    }
    if let Ok(val) = std::env::var("USERPROFILE") {
        s = s.replace("%USERPROFILE%", &val);
    }
    s
}

fn dir_size(path: &str) -> u64 {
    let p = std::path::Path::new(path);
    if !p.exists() { return 0; }
    fn walk(dir: &std::path::Path) -> u64 {
        let mut total = 0u64;
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    total += walk(&path);
                } else if let Ok(meta) = entry.metadata() {
                    total += meta.len();
                }
            }
        }
        total
    }
    walk(p)
}

#[tauri::command]
pub fn check_shader_cache() -> ShaderCacheInfo {
    let cache_dirs = [
        ("NVIDIA DXCache", "%LOCALAPPDATA%\\NVIDIA\\DXCache"),
        ("NVIDIA GLCache", "%LOCALAPPDATA%\\NVIDIA\\GLCache"),
        ("NVIDIA NV_Cache", "%PROGRAMDATA%\\NVIDIA Corporation\\NV_Cache"),
        ("AMD GLCache", "%LOCALAPPDATA%\\AMD\\GLCache"),
        ("AMD DXCache", "%LOCALAPPDATA%\\AMD\\DxcCache"),
        ("Intel ShaderCache", "%LOCALAPPDATA%\\Intel\\ShaderCache"),
        ("Intel GfxCache", "%PROGRAMDATA%\\Intel\\GfxCache"),
    ];

    let mut vendors = Vec::new();
    let mut total = 0u64;

    for (name, dir) in &cache_dirs {
        let resolved = resolve_env(dir);
        let size = dir_size(&resolved);
        if size > 0 {
            let size_mb = size / (1024 * 1024);
            total += size_mb;
            vendors.push(ShaderVendorCache {
                name: name.to_string(),
                path: resolved,
                size_mb,
            });
        }
    }

    ShaderCacheInfo { total_size_mb: total, vendors }
}

#[tauri::command]
pub fn clean_shader_cache() -> Result<ShaderCacheInfo, String> {
    let cache_dirs = [
        ("NVIDIA DXCache", "%LOCALAPPDATA%\\NVIDIA\\DXCache"),
        ("NVIDIA GLCache", "%LOCALAPPDATA%\\NVIDIA\\GLCache"),
        ("NVIDIA NV_Cache", "%PROGRAMDATA%\\NVIDIA Corporation\\NV_Cache"),
        ("AMD GLCache", "%LOCALAPPDATA%\\AMD\\GLCache"),
        ("AMD DXCache", "%LOCALAPPDATA%\\AMD\\DxcCache"),
        ("Intel ShaderCache", "%LOCALAPPDATA%\\Intel\\ShaderCache"),
        ("Intel GfxCache", "%PROGRAMDATA%\\Intel\\GfxCache"),
    ];

    let mut vendors = Vec::new();
    let mut total_cleaned = 0u64;

    for (name, dir) in &cache_dirs {
        let resolved = resolve_env(dir);
        let path = std::path::Path::new(&resolved);
        if path.exists() {
            let size_before = dir_size(&resolved);
            if size_before > 0 {
                if let Ok(entries) = std::fs::read_dir(path) {
                    for entry in entries.flatten() {
                        let p = entry.path();
                        if p.is_dir() {
                            let _ = std::fs::remove_dir_all(&p);
                        } else {
                            let _ = std::fs::remove_file(&p);
                        }
                    }
                }
                let cleaned_mb = size_before / (1024 * 1024);
                total_cleaned += cleaned_mb;
                vendors.push(ShaderVendorCache {
                    name: name.to_string(),
                    path: resolved,
                    size_mb: cleaned_mb,
                });
            }
        }
    }

    Ok(ShaderCacheInfo { total_size_mb: total_cleaned, vendors })
}

// ─── Windows 版本信息 ───

#[derive(Clone, Serialize)]
pub struct WindowsInfo {
    pub version: String,
    pub build: String,
    pub edition: String,
    pub product_name: String,
    pub display_version: String,
    pub is_24h2: bool,
    pub is_n_kn: bool,
    pub media_feature_package_available: bool,
}

#[tauri::command]
pub fn get_windows_info() -> WindowsInfo {
    let mut product_name = String::new();
    let mut build = String::new();
    let mut display_version = String::new();
    let mut edition = String::new();
    let mut version = "10.0".to_string();

    // 全部从注册表读取（比 wmic 快 10-100 倍）
    if let (crate::models::scan_result::RuntimeStatus::Installed, pn) = crate::scanner::registry::check_registry_value_raw(
        "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
        "ProductName"
    ) {
        product_name = pn.trim().to_string();
    }
    if let (crate::models::scan_result::RuntimeStatus::Installed, b) = crate::scanner::registry::check_registry_value_raw(
        "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
        "CurrentBuild"
    ) {
        build = b.trim().to_string();
    }
    if let (crate::models::scan_result::RuntimeStatus::Installed, dv) = crate::scanner::registry::check_registry_value_raw(
        "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
        "DisplayVersion"
    ) {
        display_version = dv.trim().to_string();
    }
    if let (crate::models::scan_result::RuntimeStatus::Installed, ed) = crate::scanner::registry::check_registry_value_raw(
        "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
        "EditionID"
    ) {
        edition = ed.trim().to_string();
    }
    // Major/Minor 版本号从 DWORD 读取（CurrentVersion 字符串不正确）
    if let (crate::models::scan_result::RuntimeStatus::Installed, Some(major)) = crate::scanner::registry::check_registry_raw(
        "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
        "CurrentMajorVersionNumber"
    ) {
        if let (crate::models::scan_result::RuntimeStatus::Installed, Some(minor)) = crate::scanner::registry::check_registry_raw(
            "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
            "CurrentMinorVersionNumber"
        ) {
            version = format!("{}.{}", major, minor);
        }
    }

    let build_num: u64 = build.parse().unwrap_or(0);
    let is_24h2 = build_num >= 26100;
    let is_n_kn = edition.contains('N') || edition.contains("KN");

    WindowsInfo {
        version,
        build: if build.is_empty() { "0".into() } else { build },
        edition: if edition.is_empty() { "Unknown".into() } else { edition },
        product_name,
        display_version,
        is_24h2,
        is_n_kn,
        media_feature_package_available: !is_n_kn,
    }
}

// ─── 清单统计（前端计数器用） ───

#[derive(Clone, Serialize)]
pub struct ManifestSummary {
    pub runtime_count: usize,
    pub dll_count: usize,
}

#[tauri::command]
pub fn get_manifest_summary(state: State<'_, AppState>) -> ManifestSummary {
    let runtime_count = state.manifest.runtimes.len();
    let mut dll_set = std::collections::HashSet::new();
    for rt in &state.manifest.runtimes {
        for dll in &rt.dlls {
            dll_set.insert(dll.to_lowercase());
        }
    }
    for cd in &state.manifest.common_dlls {
        dll_set.insert(cd.name.to_lowercase());
    }
    ManifestSummary {
        runtime_count,
        dll_count: dll_set.len(),
    }
}
