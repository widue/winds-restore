use windows::Win32::System::Registry::*;
use windows::Win32::Foundation::WIN32_ERROR;
use std::ffi::OsString;
use std::os::windows::ffi::OsStrExt;

use crate::models::manifest::VersionCheck;
use crate::models::scan_result::RuntimeStatus;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegArch {
    X64,
    X86,
}

fn read_registry_u32(key_path: &str, value_name: &str, arch: RegArch) -> Option<u32> {
    let (hive_str, sub_key) = if let Some(rest) = key_path.strip_prefix("SOFTWARE\\") {
        ("SOFTWARE", rest)
    } else if let Some(rest) = key_path.strip_prefix("SYSTEM\\") {
        ("SYSTEM", rest)
    } else if let Some(rest) = key_path.strip_prefix("HKEY_LOCAL_MACHINE\\") {
        ("HKLM", rest)
    } else if let Some(rest) = key_path.strip_prefix("HKEY_CURRENT_USER\\") {
        ("HKCU", rest)
    } else {
        (key_path, "")
    };

    let hive = match hive_str {
        "SOFTWARE" | "SYSTEM" | "HKLM" => HKEY_LOCAL_MACHINE,
        "HKCU" => HKEY_CURRENT_USER,
        _ => return None,
    };

    let wide_key: Vec<u16> = OsString::from(sub_key)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let wide_value: Vec<u16> = OsString::from(value_name)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let sam_desired = match arch {
        RegArch::X64 => KEY_READ | KEY_WOW64_64KEY,
        RegArch::X86 => KEY_READ | KEY_WOW64_32KEY,
    };

    unsafe {
        let mut hkey = HKEY::default();
        let status = RegOpenKeyExW(
            hive,
            windows::core::PCWSTR::from_raw(wide_key.as_ptr()),
            0,
            sam_desired,
            &mut hkey,
        );

        if status != WIN32_ERROR(0) {
            return None;
        }

        let mut data: u32 = 0;
        let mut size = std::mem::size_of::<u32>() as u32;
        let status = RegQueryValueExW(
            hkey,
            windows::core::PCWSTR::from_raw(wide_value.as_ptr()),
            None,
            None,
            Some(&mut data as *mut _ as *mut _),
            Some(&mut size),
        );

        let _ = RegCloseKey(hkey);

        if status == WIN32_ERROR(0) {
            Some(data)
        } else {
            None
        }
    }
}

pub fn check_registry_raw(key_path: &str, value_name: &str) -> (RuntimeStatus, Option<u32>) {
    match read_registry_u32(key_path, value_name, RegArch::X64) {
        Some(val) => (RuntimeStatus::Installed, Some(val)),
        None => (RuntimeStatus::Missing, None),
    }
}

pub fn check_installed(check: &VersionCheck) -> (RuntimeStatus, String) {
    let full_key = format!("SOFTWARE\\{}", check.key.trim_start_matches("SOFTWARE\\"));

    let target_arch = match check.arch.as_str() {
        "x86" => RegArch::X86,
        _ => RegArch::X64,
    };

    let result = read_registry_u32(&full_key, &check.value_name, target_arch);

    match result {
        Some(value) if value >= check.min_value => {
            (RuntimeStatus::Installed, format!("已安装 (版本值: {})", value))
        }
        Some(value) => {
            (RuntimeStatus::Missing, format!("版本过低: 当前 {}，需要 ≥ {}", value, check.min_value))
        }
        None => {
            (RuntimeStatus::Missing, "未注册，需要安装".into())
        }
    }
}
