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

fn get_hive_and_subkey(key_path: &str) -> Option<(HKEY, &str)> {
    if let Some(rest) = key_path.strip_prefix("SOFTWARE\\") {
        Some((HKEY_LOCAL_MACHINE, rest))
    } else if let Some(rest) = key_path.strip_prefix("SYSTEM\\") {
        Some((HKEY_LOCAL_MACHINE, rest))
    } else if let Some(rest) = key_path.strip_prefix("HKEY_LOCAL_MACHINE\\") {
        Some((HKEY_LOCAL_MACHINE, rest))
    } else if let Some(rest) = key_path.strip_prefix("HKEY_CURRENT_USER\\") {
        Some((HKEY_CURRENT_USER, rest))
    } else {
        None
    }
}

fn to_wide_null(s: &str) -> Vec<u16> {
    OsString::from(s)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

fn open_key(key_path: &str, arch: RegArch) -> Option<HKEY> {
    let (hive, sub_key) = get_hive_and_subkey(key_path)?;

    let wide_key = to_wide_null(sub_key);
    let sam_desired = match arch {
        RegArch::X64 => KEY_READ | KEY_WOW64_64KEY,
        RegArch::X86 => KEY_READ | KEY_WOW64_32KEY,
    };

    let mut hkey = HKEY::default();
    let status = unsafe {
        RegOpenKeyExW(
            hive,
            windows::core::PCWSTR::from_raw(wide_key.as_ptr()),
            0,
            sam_desired,
            &mut hkey,
        )
    };

    if status == WIN32_ERROR(0) {
        Some(hkey)
    } else {
        None
    }
}

fn read_registry_u32(key_path: &str, value_name: &str, arch: RegArch) -> Option<u32> {
    let hkey = open_key(key_path, arch)?;
    let wide_value = to_wide_null(value_name);

    let mut data: u32 = 0;
    let mut size = std::mem::size_of::<u32>() as u32;

    let status = unsafe {
        RegQueryValueExW(
            hkey,
            windows::core::PCWSTR::from_raw(wide_value.as_ptr()),
            None,
            None,
            Some(&mut data as *mut _ as *mut _),
            Some(&mut size),
        )
    };

    unsafe {
        let _ = RegCloseKey(hkey);
    }

    if status == WIN32_ERROR(0) {
        Some(data)
    } else {
        None
    }
}

pub fn check_registry_raw(key_path: &str, value_name: &str) -> (RuntimeStatus, Option<u32>) {
    match read_registry_u32(key_path, value_name, RegArch::X64) {
        Some(val) => (RuntimeStatus::Installed, Some(val)),
        None => (RuntimeStatus::Missing, None),
    }
}

pub fn check_registry_value_raw(key_path: &str, value_name: &str) -> (RuntimeStatus, String) {
    match read_registry_string(key_path, value_name, RegArch::X64) {
        Some(val) => (RuntimeStatus::Installed, val),
        None => (RuntimeStatus::Missing, String::new()),
    }
}

fn read_registry_string(key_path: &str, value_name: &str, arch: RegArch) -> Option<String> {
    let hkey = open_key(key_path, arch)?;
    let wide_value = to_wide_null(value_name);

    let mut data = [0u16; 4096];
    let mut size = (data.len() * 2) as u32;

    let status = unsafe {
        RegQueryValueExW(
            hkey,
            windows::core::PCWSTR::from_raw(wide_value.as_ptr()),
            None,
            None,
            Some(&mut data as *mut _ as *mut _),
            Some(&mut size),
        )
    };

    unsafe {
        let _ = RegCloseKey(hkey);
    }

    if status == WIN32_ERROR(0) {
        let len = (size as usize) / 2;
        let s = String::from_utf16_lossy(&data[..len.min(data.len())]);
        Some(s.trim_end_matches('\0').to_string())
    } else {
        None
    }
}

pub fn check_installed(check: &VersionCheck) -> (RuntimeStatus, String) {
    let full_key = format!("SOFTWARE\\{}", check.key.trim_start_matches("SOFTWARE\\"));

    let arches = if check.arch == "x86" {
        [RegArch::X86, RegArch::X64]
    } else {
        [RegArch::X64, RegArch::X86]
    };

    for &arch in &arches {
        if let Some(value) = read_registry_u32(&full_key, &check.value_name, arch) {
            if value >= check.min_value {
                return (RuntimeStatus::Installed, format!("已安装 (版本值: {})", value));
            }
            return (RuntimeStatus::Missing, format!("版本过低: 当前 {}，需要 ≥ {}", value, check.min_value));
        }
    }

    (RuntimeStatus::Missing, "未注册，需要安装".into())
}
