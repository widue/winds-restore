use crate::models::manifest::RuntimeManifest;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub manifest: Arc<RuntimeManifest>,
    pub scan_cancel_token: Arc<AtomicBool>,
}
