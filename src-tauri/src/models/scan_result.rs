use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RuntimeStatus {
    Installed,
    Missing,
    NotFound,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub id: String,
    pub name: String,
    pub status: RuntimeStatus,
    pub details: String,
    #[serde(default)]
    pub installer_size_mb: u32,
    #[serde(default)]
    pub category: Option<String>,
}
