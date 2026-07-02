pub mod registry;
pub mod directx;
pub mod filesystem;
pub mod installer;

use crate::models::manifest::{RuntimeEntry, RuntimeManifest};
use crate::models::scan_result::{RuntimeStatus, ScanResult};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};

pub async fn run_full_scan(
    manifest: &RuntimeManifest,
    cancel_token: &AtomicBool,
    progress_cb: impl Fn(f32, String),
) -> Vec<ScanResult> {
    let total = manifest.runtimes.len() as f32;
    let mut results = Vec::with_capacity(manifest.runtimes.len());

    for (idx, runtime) in manifest.runtimes.iter().enumerate() {
        if cancel_token.load(Ordering::Relaxed) {
            break;
        }

        let progress = ((idx as f32) / total) * 100.0;
        progress_cb(progress, format!("正在检测: {}", runtime.name));

        let result = scan_runtime(runtime);
        results.push(result);
    }

    if !cancel_token.load(Ordering::Relaxed) {
        progress_cb(100.0, "扫描完成".to_string());
    }

    results
}

fn scan_runtime(entry: &RuntimeEntry) -> ScanResult {
    let (status, details) = match entry.version_check.method.as_str() {
        "registry" => registry::check_installed(&entry.version_check),
        "file" => filesystem::check_file(&entry.version_check.path),
        "dism" => check_dism_feature(&entry.version_check.path),
        _ => (RuntimeStatus::NotFound, "未知检查方法".into()),
    };

    ScanResult {
        id: entry.id.clone(),
        name: entry.name.clone(),
        status,
        details,
        installer_size_mb: entry.installer_size_mb,
        category: None,
    }
}

fn check_dism_feature(feature_name: &str) -> (RuntimeStatus, String) {
    let output = std::process::Command::new("dism.exe")
        .args(["/online", "/Get-FeatureInfo", &format!("/FeatureName:{}", feature_name)])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if stdout.contains("State : Enabled") {
                (RuntimeStatus::Installed, "已启用".into())
            } else {
                (RuntimeStatus::Missing, "未启用，需要安装".into())
            }
        }
        Err(e) => (RuntimeStatus::NotFound, format!("检查失败: {}", e)),
    }
}

pub fn check_gpu_driver() -> (RuntimeStatus, String) {
    let output = std::process::Command::new("wmic")
        .args(["path", "Win32_VideoController", "get", "Name", "/format:csv"])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let gpu_names: Vec<String> = stdout
                .lines()
                .skip(1)
                .filter(|l| l.contains(','))
                .filter_map(|l| l.split_once(',').map(|x| x.1))
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();

            if gpu_names.is_empty() {
                return (RuntimeStatus::NotFound, "未检测到任何显示适配器".into());
            }

            let all_basic = gpu_names.iter().all(|n| n.contains("Microsoft Basic"));
            if all_basic {
                (RuntimeStatus::Missing,
                    "⚠️ 显卡驱动未安装（仅有 Microsoft Basic Display Adapter），请安装 NVIDIA/AMD/Intel 官方驱动".into())
            } else {
                (RuntimeStatus::Installed,
                    format!("✅ 检测到显卡驱动: {}", gpu_names.join(" / ")))
            }
        }
        Err(e) => (RuntimeStatus::NotFound, format!("检测失败: {}", e)),
    }
}

pub fn check_memory_integrity() -> (RuntimeStatus, String) {
    let key = "SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity";
    let (status, _) = registry::check_registry_raw(key, "Enabled");

    if status == RuntimeStatus::Installed {
        (RuntimeStatus::Missing, "⚠️ 已开启，可能导致部分旧游戏闪退（DLL 被系统拦截）".into())
    } else {
        (RuntimeStatus::Installed, "✅ 已关闭，不影响旧游戏".into())
    }
}

pub fn build_dll_lookup(manifest: &RuntimeManifest) -> HashMap<String, String> {
    let mut lookup: HashMap<String, String> = HashMap::new();
    for entry in &manifest.runtimes {
        for dll in &entry.dlls {
            let key = dll.to_lowercase();
            lookup.entry(key).or_insert_with(|| entry.name.clone());
        }
    }
    lookup
}

pub fn get_dll_owner(lookup: &HashMap<String, String>, dll_name: &str) -> String {
    let key = dll_name.trim().to_lowercase();

    match lookup.get(&key) {
        Some(name) => format!("✓ 这是 {} 的一部分，建议安装该运行库", name),
        None => {
            let matches: Vec<&str> = lookup.iter()
                .filter(|(k, _)| k.contains(&key) || key.contains(k.as_str()))
                .map(|(_, v)| v.as_str())
                .collect();

            if matches.is_empty() {
                format!("未收录此 DLL，建议使用搜索引擎查找 \"{} 缺失\"", dll_name)
            } else {
                format!("→ 可能的所属运行库：{}", matches.join("、"))
            }
        }
    }
}

pub fn get_error_code_help(code: &str) -> String {
    match code.trim().to_lowercase().as_str() {
        "0xc000007b" | "c000007b" => {
            "0xc000007b 常见原因：\n\
             1. 显卡驱动未安装 — 设备管理器里只有 Microsoft Basic Display Adapter\n\
             2. VC++ 运行库缺失或混装（x86/x64 不匹配）\n\
             3. DirectX 组件缺失（d3dx9_43.dll、d3dcompiler_47.dll 等）\n\
             4. .NET Framework 版本不匹配\n\
             \n\
             建议：先返回首页点「开始扫描」，查看显卡驱动和运行库状态".into()
        }
        "0xc0000005" | "c0000005" => {
            "访问违规（Access Violation）。常见原因：\n\
             1. 内存损坏或不足\n\
             2. 软件兼容性（尝试管理员运行）\n\
             3. 显卡驱动问题\n\
             4. 杀毒软件拦截".into()
        }
        "0xc0000142" | "c0000142" => {
            "DLL 初始化失败。常见原因：\n\
             1. Visual C++ 运行库损坏\n\
             2. 某个依赖的 DLL 无法加载\n\
             3. 系统文件保护（SFC）可尝试修复".into()
        }
        "0x000007b" => {
            "可能是 0xc000007b 的简写。参考上方 0xc000007b 诊断。".into()
        }
        "" => String::new(),
        _ => "未收录此错误码的信息。建议搜索或使用「开始扫描」检测系统。".to_string(),
    }
}
