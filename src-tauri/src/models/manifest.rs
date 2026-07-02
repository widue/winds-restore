use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct RuntimeManifest {
    pub runtimes: Vec<RuntimeEntry>,
    #[serde(default)]
    pub common_dlls: Vec<CommonDll>,
    #[serde(default)]
    pub error_codes: Vec<ErrorCodeEntry>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RuntimeEntry {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub category: String,
    pub version_check: VersionCheck,
    pub download_url: String,
    #[serde(default)]
    pub mirrors: Vec<String>,
    pub install_args: String,
    pub installer_size_mb: u32,
    #[serde(default)]
    pub dlls: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VersionCheck {
    #[serde(default = "default_method")]
    pub method: String,
    #[serde(default)]
    pub key: String,
    #[serde(default)]
    pub value_name: String,
    #[serde(default)]
    pub min_value: u32,
    #[serde(default)]
    pub path: String,
    #[serde(default)]
    pub arch: String,
}

fn default_method() -> String {
    "registry".to_string()
}

#[derive(Debug, Clone, Deserialize)]
pub struct CommonDll {
    pub name: String,
    #[serde(default)]
    pub system_path: String,
    #[serde(default)]
    pub description: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ErrorCodeEntry {
    pub code: String,
    pub description: String,
    pub solution: String,
}

impl RuntimeManifest {
    pub fn get_category(&self, runtime: &RuntimeEntry) -> String {
        if !runtime.category.is_empty() {
            runtime.category.clone()
        } else if runtime.id.starts_with("vcpp") {
            "VC++ 运行库".to_string()
        } else if runtime.id.starts_with("dotnet") {
            ".NET Framework".to_string()
        } else if runtime.id.starts_with("directx") || runtime.id.starts_with("dx") {
            "DirectX".to_string()
        } else if runtime.id.starts_with("openal") {
            "音频组件".to_string()
        } else if runtime.id.starts_with("physx") {
            "物理引擎".to_string()
        } else if runtime.id.starts_with("webview") {
            "WebView".to_string()
        } else {
            "其他组件".to_string()
        }
    }
}
