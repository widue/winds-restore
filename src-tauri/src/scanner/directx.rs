use crate::models::scan_result::{RuntimeStatus, ScanResult};

pub fn check_directplay() -> ScanResult {
    let installed = check_directplay_installed();

    ScanResult {
        id: "directplay".to_string(),
        name: "DirectPlay (旧游戏兼容)".to_string(),
        status: if installed {
            RuntimeStatus::Installed
        } else {
            RuntimeStatus::Missing
        },
        details: if installed {
            "DirectPlay 组件已启用".to_string()
        } else {
            "部分老游戏可能需要启用此组件".to_string()
        },
        installer_size_mb: 0,
        category: Some("DirectX".to_string()),
    }
}

fn check_directplay_installed() -> bool {
    let output = std::process::Command::new("dism.exe")
        .args(["/online", "/Get-FeatureInfo", "/FeatureName:DirectPlay"])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            stdout.contains("State : Enabled")
        }
        Err(_) => false,
    }
}

pub fn enable_directplay() -> Result<String, String> {
    let output = std::process::Command::new("dism.exe")
        .args(["/Online", "/Enable-Feature", "/FeatureName:DirectPlay", "/All", "/Quiet", "/NoRestart"])
        .output()
        .map_err(|e| format!("DISM 启动失败: {}", e))?;

    if output.status.success() {
        Ok("操作成功，请重启电脑生效".into())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("DISM 失败: {}", stderr))
    }
}
