pub mod registry;
pub mod directx;
pub mod filesystem;
pub mod installer;

use crate::models::manifest::{RuntimeEntry, RuntimeManifest};
use crate::models::scan_result::{RuntimeStatus, ScanResult};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct DllScanResult {
    pub name: String,
    pub found: bool,
    pub path: Option<String>,
}

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
    for dll_entry in &manifest.common_dlls {
        let key = dll_entry.name.to_lowercase();
        lookup.entry(key).or_insert_with(|| dll_entry.description.clone());
    }
    lookup
}

pub fn get_dll_owner(lookup: &HashMap<String, String>, dll_name: &str) -> String {
    let key = dll_name.trim().to_lowercase();

    // 第三方非微软 DLL 识别
    let third_party: HashMap<&str, &str> = [
        ("log4cpp.dll", "第三方 C++ 日志库（属于特定软件，请重装该软件）"),
        ("libssl-1_1.dll", "OpenSSL 加密库（属于特定软件，请重装该软件）"),
        ("libcurl.dll", "libcurl 网络库（属于特定软件，请重装该软件）"),
        ("steam_api64.dll", "Steam 游戏平台 DRM 组件（请重装或验证游戏完整性）"),
        ("emp.dll", "EMPRESS 游戏破解补丁（请重装对应游戏）"),
    ].iter().cloned().collect();

    if let Some(&desc) = third_party.get(key.as_str()) {
        return format!("⚠️ {}\n\n注意：这是第三方软件自带的文件，不是微软系统组件。\n不要从网上下载单个 .dll 文件，应重新安装完整软件。", desc);
    }

    match lookup.get(&key) {
        Some(name) => format!("✓ {} 属于：{}\n建议安装该运行库以修复此问题。", dll_name, name),
        None => {
            let matches: Vec<&str> = lookup.iter()
                .filter(|(k, _)| k.contains(&key) || key.contains(k.as_str()))
                .map(|(_, v)| v.as_str())
                .collect();

            if matches.is_empty() {
                format!("未收录此 DLL 的信息。\n建议：\n1. 使用搜索引擎搜索 \"{} 缺失\"\n2. 返回首页点「开始扫描」检测系统\n3. 如果该文件属于某款软件，请重新安装该软件", dll_name)
            } else {
                format!("→ 可能的归属：{}", matches.join("、"))
            }
        }
    }
}

pub fn get_error_code_help(code: &str) -> String {
    let c = code.trim().to_lowercase();
    let c = c.strip_prefix("0x").unwrap_or(&c);
    let c = c.strip_prefix("0x").unwrap_or(c);

    match c {
        "c000007b" | "000007b" => {
            "0xc000007b 应用程序无法正常启动\n\
             ─────────────────────────────\n\
             【含义】应用程序初始失败，通常是运行库/驱动问题\n\
             【常见原因】\n\
             1. 显卡驱动未安装 — 仅有 Microsoft Basic Display Adapter\n\
             2. VC++ 运行库缺失或 x86/x64 混装不匹配\n\
             3. DirectX 组件缺失（d3dx9_43.dll, d3dcompiler_47.dll 等）\n\
             4. .NET Framework 版本不匹配\n\
             【推荐修复】\n\
             1. 首页「开始扫描」检测显卡驱动和运行库状态\n\
             2. 安装 VC++ 2005-2022 全系列（x86 + x64）\n\
             3. 安装 DirectX End-User Runtime".into()
        }
        "c0000005" => {
            "0xc0000005 访问违规\n\
             ────────────────\n\
             【含义】程序试图访问不允许的内存地址\n\
             【常见原因】\n\
             1. 物理内存损坏或不足\n\
             2. 软件兼容性（尝试以管理员身份运行 / 兼容模式）\n\
             3. 显卡驱动过旧或损坏\n\
             4. 杀毒软件误拦截\n\
             5. 游戏/软件文件损坏（验证完整性）".into()
        }
        "c0000142" => {
            "0xc0000142 DLL 初始化失败\n\
             ─────────────────────\n\
             【含义】某个依赖的 DLL 在加载时初始化失败\n\
             【常见原因】\n\
             1. Visual C++ 运行库损坏 → 重装 VC++ 全系列\n\
             2. 第三方 DLL 冲突 → 检查近期安装的软件\n\
             3. 系统文件损坏 → 以管理员运行 sfc /scannow".into()
        }
        "80070643" => {
            "80070643 Windows Update 安装失败\n\
             ──────────────────────────────\n\
             【含义】Windows 更新安装过程中发生错误\n\
             【常见原因】\n\
             1. .NET Framework 组件损坏\n\
             2. 系统文件损坏\n\
             3. 磁盘空间不足\n\
             【推荐修复】\n\
             1. 以管理员运行：DISM /Online /Cleanup-Image /RestoreHealth\n\
             2. 然后运行：sfc /scannow\n\
             3. 重启后重试更新".into()
        }
        "800f0831" => {
            "0x800f0831 Windows 更新失败（组件存储损坏）\n\
             ─────────────────────────────────────────\n\
             【含义】CBS 组件存储损坏，无法安装更新\n\
             【常见原因】\n\
             1. Windows 组件存储（CBS）损坏\n\
             2. 之前更新未完全安装\n\
             【推荐修复】\n\
             1. 管理员运行：DISM /Online /Cleanup-Image /RestoreHealth\n\
             2. 重启后重试：sfc /scannow\n\
             3. 下载独立更新包手动安装".into()
        }
        "80190001" => {
            "0x80190001 Windows Update 网络错误\n\
             ────────────────────────────────\n\
             【含义】更新服务器连接失败\n\
             【常见原因】\n\
             1. 网络连接不稳定\n\
             2. 防火墙/代理拦截了更新服务器\n\
             3. DNS 解析问题\n\
             4. 系统时间不正确\n\
             【推荐修复】\n\
             1. 检查网络连接和代理设置\n\
             2. 重置 Winsock：netsh winsock reset\n\
             3. 确保系统时间正确".into()
        }
        "800f0984" => {
            "0x800f0984 Windows 更新失败\n\
             ──────────────────────────\n\
             【含义】更新所需的组件无法安装\n\
             【常见原因】\n\
             1. 系统组件存储空间不足\n\
             2. 更新文件下载不完整\n\
             【推荐修复】\n\
             1. 清理磁盘（设置 → 系统 → 存储 → 临时文件）\n\
             2. 运行 DISM + SFC 修复\n\
             3. 使用 Windows Update 疑难解答".into()
        }
        "80070002" => {
            "0x80070002 系统找不到指定的文件\n\
             ───────────────────────────────\n\
             【含义】安装程序找不到所需的文件\n\
             【常见场景】.NET Framework 3.5 启用失败时常见\n\
             【推荐修复】\n\
             1. 如果安装 .NET 3.5：指定备用源路径\n\
                dism /online /enable-feature /featurename:NetFx3 /source:D:\\sxs /All /LimitAccess\n\
             2. 检查安装源文件是否完整\n\
             3. 运行 SFC 修复系统文件".into()
        }
        "800f0950" => {
            "0x800F0950 .NET Framework 3.5 启用失败\n\
             ─────────────────────────────────────\n\
             【含义】Windows 功能启用失败，组策略阻止从 Windows Update 下载\n\
             【推荐修复】\n\
             1. 组策略 → 计算机配置 → 管理模板 → 系统 →\n\
                「指定可选组件安装和组件修复的设置」→ 设为「已启用」→「直接指向 Windows Update」\n\
             2. 或使用 DISM 指定离线 SXS 源安装\n\
             3. 检查是否被 WSUS/内部更新服务器限制".into()
        }
        "800f0954" => {
            "0x800F0954 .NET Framework 3.5 启用失败\n\
             ─────────────────────────────────────\n\
             【含义】与 0x800F0950 类似，组策略限制从 Windows Update 获取功能文件\n\
             【推荐修复】\n\
             1. 参考 0x800F0950 的组策略修改方法\n\
             2. 使用 Windows 安装光盘/SXS 源离线安装\n\
             3. 管理员 PowerShell：\n\
                dism /online /enable-feature /featurename:NetFx3 /All /Source:D:\\sources\\sxs /LimitAccess".into()
        }
        "80070642" => {
            "0x80070642 用户取消了安装\n\
             ──────────────────────\n\
             【含义】安装过程中用户点击了取消按钮\n\
             【可能原因】\n\
             1. 安装时间过长，用户主动取消\n\
             2. 安装程序无响应，用户强制关闭\n\
             3. 系统权限不足（尝试以管理员身份运行安装程序）".into()
        }
        "81f40001" => {
            "0x81f40001 VC++ 运行库安装失败\n\
             ────────────────────────────\n\
             【含义】Visual C++ Redistributable 安装失败\n\
             【常见原因】\n\
             1. 系统已安装更高版本，安装程序拒绝降级\n\
             2. 之前的 VC++ 安装损坏未清理干净\n\
             3. 权限不足\n\
             【推荐修复】\n\
             1. 使用「控制面板 → 卸载程序」先卸载旧版 VC++\n\
             2. 使用微软官方清理工具 MsiZap / ClearCompCache\n\
             3. 以管理员身份重新安装".into()
        }
        "80080005" => {
            "0x80080005 服务器运行失败\n\
             ───────────────────────\n\
             【含义】安装程序无法启动必要的后台服务\n\
             【常见原因】\n\
             1. Windows Installer 服务未运行\n\
             2. 系统权限不足\n\
             3. 杀毒软件拦截\n\
             【推荐修复】\n\
             1. 管理员运行：net start msiserver\n\
             2. 重启 Windows Installer 服务\n\
             3. 临时关闭杀毒软件后重试".into()
        }
        "8007001f" => {
            "0x8007001F 设备连接失败\n\
             ──────────────────────\n\
             【含义】安装过程 SAFE_OS 阶段复制操作失败\n\
             【常见场景】Windows 10/11 系统安装/升级时出现\n\
             【推荐修复】\n\
             1. 断开所有外设（USB 设备、外接硬盘等）\n\
             2. 释放磁盘空间（至少保留 20GB 可用）\n\
             3. 运行：DISM /Online /Cleanup-Image /RestoreHealth\n\
             4. 使用 Windows 安装媒体修复安装".into()
        }
        "0017" | "17" => {
            "0x0017 初始化应用程序失败\n\
             ──────────────────────────\n\
             【含义】应用程序初始化时发生错误，通常为系统更新后的兼容性问题\n\
             【推荐修复】\n\
             1. 使用系统还原点回退到更新前状态\n\
             2. 卸载最近安装的 Windows 更新\n\
             3. 以兼容模式运行程序".into()
        }
        "1935" => {
            "Error 1935 程序集安装失败\n\
             ─────────────────────────\n\
             【含义】Windows 模块安装程序无法安装 Microsoft.VC80.ATL 等程序集\n\
             【常见原因】\n\
             1. .NET Framework 或 VC++ 运行库损坏\n\
             2. 系统组件存储（CBS）损坏\n\
             3. 杀毒软件干扰\n\
             【推荐修复】\n\
             1. 运行 DISM + SFC 修复\n\
             2. 重装 VC++ 2005-2022 全系列\n\
             3. 临时关闭杀毒软件".into()
        }
        "126" => {
            "错误 126 找不到指定的模块\n\
             ──────────────────────────\n\
             【含义】程序依赖的 DLL 文件缺失或无法加载\n\
             【常见场景】启动器加载 DirectX 组件失败时常见（如 d3dcompiler_43.dll）\n\
             【推荐修复】\n\
             1. 首页「开始扫描」检测缺失的运行库\n\
             2. 安装 DirectX End-User Runtime\n\
             3. 安装 VC++ 全系列运行库".into()
        }
        "-2146498298" => {
            "-2146498298 (0x800F0952)\n\
             ──────────────────────\n\
             【含义】.NET Framework 3.5 启用失败，策略限制\n\
             【推荐修复】参考 0x800F0950 的方法\n\
             1. 修改组策略允许从 Windows Update 下载\n\
             2. 使用离线 SXS 源安装".into()
        }
        "" => String::new(),
        _ => "未收录此错误码的信息。\n\
              ─────────────────\n\
              建议：\n\
              1. 返回首页点「开始扫描」检测系统运行库状态\n\
              2. 使用搜索引擎搜索该错误码\n\
              3. 在微软官方文档中查找：https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes".to_string(),
    }
}

/// Search for common DLLs by checking System32 + SysWOW64 + game directories + PATH
pub fn scan_common_dll_list(dll_names: &[String]) -> Vec<DllScanResult> {
    let mut results = Vec::new();
    let search_dirs = vec![
        "C:\\Windows\\System32".to_string(),
        "C:\\Windows\\SysWOW64".to_string(),
        "C:\\Windows\\System32\\downlevel".to_string(),
        "C:\\Windows\\SysWOW64\\downlevel".to_string(),
        "C:\\Windows\\System32\\DriverStore".to_string(),
        "C:\\Program Files (x86)\\Steam".to_string(),
        "C:\\Program Files\\Steam".to_string(),
        "C:\\Program Files (x86)\\Steam\\steamapps\\common".to_string(),
        "C:\\Program Files\\Steam\\steamapps\\common".to_string(),
        "C:\\Program Files (x86)\\Epic Games".to_string(),
        "C:\\Program Files\\Epic Games".to_string(),
        "C:\\Program Files\\dotnet".to_string(),
        "C:\\Program Files (x86)\\dotnet".to_string(),
        "C:\\Program Files\\dotnet\\shared".to_string(),
        "C:\\Program Files (x86)\\dotnet\\shared".to_string(),
        "C:\\Program Files\\NVIDIA Corporation".to_string(),
        "C:\\Program Files (x86)\\NVIDIA Corporation".to_string(),
        "C:\\Program Files\\NVIDIA Corporation\\PhysX".to_string(),
        "C:\\Program Files (x86)\\NVIDIA Corporation\\PhysX".to_string(),
    ];

    for name in dll_names {
        let mut found = false;
        let mut found_path = None;

        for dir in &search_dirs {
            let full = format!("{}\\{}", dir, name);
            if std::path::Path::new(&full).exists() {
                found = true;
                found_path = Some(full);
                break;
            }
        }

        if !found {
            // Also search PATH
            if let Ok(paths) = std::env::var("PATH") {
                for dir in paths.split(';') {
                    let full = format!("{}\\{}", dir, name);
                    if std::path::Path::new(&full).exists() {
                        found = true;
                        found_path = Some(full);
                        break;
                    }
                }
            }
        }

        results.push(DllScanResult {
            name: name.clone(),
            found,
            path: found_path,
        });
    }

    results
}
