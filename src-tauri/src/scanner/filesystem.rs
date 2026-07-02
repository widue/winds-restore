use std::path::Path;

use crate::models::scan_result::RuntimeStatus;

pub fn check_file(path: &str) -> (RuntimeStatus, String) {
    if Path::new(path).exists() {
        (RuntimeStatus::Installed, format!("文件存在: {}", path))
    } else {
        (RuntimeStatus::Missing, format!("文件缺失: {}", path))
    }
}
