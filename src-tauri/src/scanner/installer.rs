use std::collections::VecDeque;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use anyhow::{Context, Result};

use crate::models::manifest::RuntimeEntry;

#[derive(Clone)]
pub struct ItemProgress {
    pub id: String,
    pub name: String,
    pub status: String,
    pub percent: f32,
    pub speed: String,
    pub eta: String,
}

pub struct InstallProgress {
    pub items: Vec<ItemProgress>,
    pub overall: f32,
    pub finished: bool,
}

impl InstallProgress {
    pub fn new(item_count: usize) -> Arc<Mutex<Self>> {
        Arc::new(Mutex::new(Self {
            items: Vec::with_capacity(item_count),
            overall: 0.0,
            finished: false,
        }))
    }

    pub fn add_item(&mut self, id: &str, name: &str) {
        self.items.push(ItemProgress {
            id: id.to_string(),
            name: name.to_string(),
            status: "等待中".into(),
            percent: 0.0,
            speed: String::new(),
            eta: String::new(),
        });
    }

    pub fn update(&mut self, id: &str, percent: f32, status: &str, speed: &str, eta: &str) {
        if let Some(item) = self.items.iter_mut().find(|i| i.id == id) {
            item.percent = percent;
            item.status = status.to_string();
            item.speed = speed.to_string();
            item.eta = eta.to_string();
        }
        let total: f32 = self.items.iter().map(|i| i.percent).sum();
        let count = self.items.len().max(1) as f32;
        self.overall = total / count;
    }

    pub fn is_all_done(&self) -> bool {
        self.items.iter().all(|i| i.status == "已完成" || i.status.starts_with("失败"))
    }
}

struct ProgressWriter {
    progress: Arc<Mutex<InstallProgress>>,
    item_id: String,
    total_bytes: u64,
    downloaded: u64,
    start: Instant,
    last_update: Instant,
    last_downloaded: u64,
}

impl ProgressWriter {
    fn new(progress: Arc<Mutex<InstallProgress>>, item_id: &str, total_bytes: u64) -> Self {
        Self {
            progress,
            item_id: item_id.to_string(),
            total_bytes,
            downloaded: 0,
            start: Instant::now(),
            last_update: Instant::now(),
            last_downloaded: 0,
        }
    }

    fn write(&mut self, chunk: &[u8]) {
        self.downloaded += chunk.len() as u64;
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_update).as_secs_f64();
        if elapsed >= 0.15 {
            self.flush_progress();
            self.last_update = now;
            self.last_downloaded = self.downloaded;
        }
    }

    fn done(&mut self) {
        self.downloaded = self.total_bytes;
        self.flush_progress();
    }

    fn flush_progress(&self) {
        let elapsed = self.start.elapsed().as_secs_f64().max(0.01);
        let speed_bps = self.downloaded as f64 / elapsed;
        let percent = if self.total_bytes > 0 {
            (self.downloaded as f32 / self.total_bytes as f32 * 100.0).min(99.9)
        } else {
            0.0
        };
        let speed = Self::format_speed(speed_bps);
        let remaining = if speed_bps > 0.0 && self.total_bytes > self.downloaded {
            ((self.total_bytes - self.downloaded) as f64 / speed_bps) as u64
        } else {
            0
        };
        let eta = if remaining > 0 {
            format!("剩余 {}", Self::format_duration(remaining))
        } else {
            String::new()
        };
        let status = if percent > 0.0 { "下载中" } else { "连接中" };

        if let Ok(mut p) = self.progress.lock() {
            p.update(&self.item_id, percent, status, &speed, &eta);
        }
    }

    fn format_speed(bps: f64) -> String {
        if bps >= 1_000_000.0 {
            format!("{:.1} MB/s", bps / 1_000_000.0)
        } else if bps >= 1_000.0 {
            format!("{:.0} KB/s", bps / 1_000.0)
        } else {
            format!("{:.0} B/s", bps)
        }
    }

    fn format_duration(secs: u64) -> String {
        if secs >= 3600 {
            format!("{}时{}分", secs / 3600, (secs % 3600) / 60)
        } else if secs >= 60 {
            format!("{}分{}秒", secs / 60, secs % 60)
        } else {
            format!("{}秒", secs.max(1))
        }
    }
}

fn fastest_mirror(urls: &[String]) -> Option<String> {
    if urls.is_empty() {
        return None;
    }
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .ok()?;

    let mut results: Vec<(String, Duration)> = urls
        .iter()
        .filter_map(|url| {
            let start = Instant::now();
            match client.head(url).send() {
                Ok(resp) if resp.status().is_success() => {
                    Some((url.clone(), start.elapsed()))
                }
                _ => None,
            }
        })
        .collect();

    if results.is_empty() {
        return None;
    }
    results.sort_by_key(|a| a.1);
    Some(results[0].0.clone())
}

fn download_with_stream(
    url: &str,
    dest: &Path,
    writer: &mut ProgressWriter,
    existing: u64,
) -> Result<u64> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(300))
        .build()
        .context("创建 HTTP 客户端失败")?;

    let mut req = client.get(url);
    if existing > 0 {
        req = req.header("Range", format!("bytes={}-", existing));
    }

    let resp = req.send().context(format!("连接失败: {}", url))?;

    let can_resume = existing > 0 && resp.status() == reqwest::StatusCode::PARTIAL_CONTENT;
    let actual_existing = if can_resume { existing } else { 0 };

    let total = actual_existing + resp.content_length().unwrap_or(0);
    writer.total_bytes = total;
    writer.downloaded = actual_existing;

    let mut file = if can_resume {
        std::fs::OpenOptions::new()
            .append(true)
            .open(dest)
            .context("打开文件续传失败")?
    } else {
        std::fs::OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(dest)
            .context("创建临时文件失败")?
    };

    let mut buf = [0u8; 65536];
    let mut stream = resp.take(1024 * 1024 * 1024);

    loop {
        let n = stream.read(&mut buf).context("读取下载流失败")?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n]).context("写入文件失败")?;
        writer.write(&buf[..n]);
    }

    writer.done();
    Ok(total)
}

fn run_installer(exe_path: &Path, args: &str) -> Result<String> {
    let exe = exe_path.to_string_lossy().replace('\'', "''");
    let install_args = args.replace('\'', "''");
    let ps_script = format!(
        "Start-Process -Wait -Verb RunAs -FilePath '{}' -ArgumentList '{}'",
        exe, install_args
    );

    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &ps_script])
        .output()
        .context("启动 PowerShell 进程失败")?;

    if output.status.success() {
        Ok("安装成功".into())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(anyhow::anyhow!("安装失败: {}", stderr.trim()))
    }
}

fn run_dism(args: &str) -> Result<String> {
    let output = std::process::Command::new("dism.exe")
        .args(args.split_whitespace())
        .output()
        .context("启动 DISM 失败")?;

    if output.status.success() {
        Ok("操作成功，请重启电脑生效".into())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(anyhow::anyhow!("DISM 失败: {}", stderr.trim()))
    }
}

pub fn process_item(entry: &RuntimeEntry, progress: Arc<Mutex<InstallProgress>>) {
    // Internal operations (DISM, etc.) that don't need download
    if entry.download_url.starts_with("internal:") {
        match entry.download_url.as_str() {
            "internal:dism" => {
                {
                    let mut p = progress.lock().unwrap();
                    p.update(&entry.id, 100.0, "执行中...", "", "");
                }
                match run_dism(&entry.install_args) {
                    Ok(msg) => {
                        let mut p = progress.lock().unwrap();
                        p.update(&entry.id, 100.0, &msg, "", "");
                    }
                    Err(e) => {
                        let mut p = progress.lock().unwrap();
                        p.update(&entry.id, 100.0, &format!("失败: {}", e), "", "");
                    }
                }
            }
            "internal:dx-legacy" => {
                let mut p = progress.lock().unwrap();
                p.update(&entry.id, 100.0, "需手动安装 DirectX SDK (XAudio 2.7)", "", "");
            }
            _ => {
                let mut p = progress.lock().unwrap();
                p.update(&entry.id, 100.0, "未知内部操作", "", "");
            }
        }
        return;
    }

    let temp_dir = std::env::temp_dir();
    let part_path = temp_dir.join(format!("winds_{}.part", entry.id));
    let exe_path = temp_dir.join(format!("winds_{}.exe", entry.id));

    let mut urls = vec![entry.download_url.clone()];
    urls.extend(entry.mirrors.clone());

    let chosen = if urls.len() > 1 {
        {
            let mut p = progress.lock().unwrap();
            p.update(&entry.id, 0.0, "测速中...", "", "");
        }
        fastest_mirror(&urls).unwrap_or_else(|| entry.download_url.clone())
    } else {
        entry.download_url.clone()
    };

    let existing = if part_path.exists() {
        std::fs::metadata(&part_path).map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };

    let mut writer = ProgressWriter::new(
        Arc::clone(&progress),
        &entry.id,
        0,
    );

    let download_result = download_with_stream(&chosen, &part_path, &mut writer, existing);

    match download_result {
        Ok(_size) => {
            if part_path.exists() {
                let _ = std::fs::rename(&part_path, &exe_path);
            }
            {
                let mut p = progress.lock().unwrap();
                p.update(&entry.id, 100.0, "安装中...", "", "");
            }

            match run_installer(&exe_path, &entry.install_args) {
                Ok(_) => {
                    let mut p = progress.lock().unwrap();
                    p.update(&entry.id, 100.0, "已完成", "", "");
                }
                Err(e) => {
                    let mut p = progress.lock().unwrap();
                    p.update(&entry.id, 100.0, &format!("安装失败: {}", e), "", "");
                }
            }

            let _ = std::fs::remove_file(&exe_path);
        }
        Err(_) => {
            let mut mirror_success = false;

            for mirror_url in &entry.mirrors {
                if mirror_url == &chosen {
                    continue;
                }
                let mut mw = ProgressWriter::new(Arc::clone(&progress), &entry.id, 0);
                if download_with_stream(mirror_url, &part_path, &mut mw, 0).is_ok() {
                    if part_path.exists() {
                        let _ = std::fs::rename(&part_path, &exe_path);
                    }
                    {
                        let mut p = progress.lock().unwrap();
                        p.update(&entry.id, 100.0, "安装中...", "", "");
                    }
                    if run_installer(&exe_path, &entry.install_args).is_ok() {
                        let mut p = progress.lock().unwrap();
                        p.update(&entry.id, 100.0, "已完成", "", "");
                    } else {
                        let mut p = progress.lock().unwrap();
                        p.update(&entry.id, 100.0, "镜像安装失败", "", "");
                    }
                    mirror_success = true;
                    break;
                }
            }

            if !mirror_success {
                let mut p = progress.lock().unwrap();
                p.update(&entry.id, 0.0, &format!("下载失败: {} 个镜像均不可用", entry.mirrors.len() + 1), "", "");
            }

            let _ = std::fs::remove_file(&part_path);
            let _ = std::fs::remove_file(&exe_path);
        }
    }
}

pub struct DownloadManager {
    pub progress: Arc<Mutex<InstallProgress>>,
}

impl DownloadManager {
    pub fn start(items: Vec<RuntimeEntry>, concurrency: usize) -> Self {
        let progress = InstallProgress::new(items.len());
        {
            let mut p = progress.lock().unwrap();
            for item in &items {
                p.add_item(&item.id, &item.name);
            }
        }

        let queue: Arc<Mutex<VecDeque<RuntimeEntry>>> =
            Arc::new(Mutex::new(items.into_iter().collect()));

        let thread_count = concurrency.max(1);
        for _ in 0..thread_count {
            let q = Arc::clone(&queue);
            let prog = Arc::clone(&progress);
            std::thread::spawn(move || loop {
                let item = {
                    let mut q = q.lock().unwrap();
                    q.pop_front()
                };
                match item {
                    Some(entry) => process_item(&entry, Arc::clone(&prog)),
                    None => break,
                }
            });
        }

        Self { progress }
    }
}
