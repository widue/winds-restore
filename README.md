# Winds Restore

免费开源的 Windows 运行库 / DLL / 驱动修复工具。

对标 DirectX Repair、360 系统修复等商业工具，用 Rust + egui 纯原生实现，单文件 4.6 MB，不安装、不驻留、无广告。

---

## 功能分区

### 当前已实现

| 分区 | 检测内容 | 修复方式 |
|------|----------|----------|
| **VC++ 运行库** | 2005 / 2008 / 2010 / 2012 / 2013 / 2015 / 2017 / 2019 / 2022（x64 + x86） | 从微软 CDN 自动下载静默安装 |
| **DirectX 9.0c** | 注册表 Version 值 ≥ 9 | 下载 directx_Jun2010_redist.exe |
| **DirectX 组件** | d3dcompiler_47.dll、XAudio 2.9 文件存在性 | 在线下载 / 引导重装 |
| **DirectPlay** | DISM 查询 State : Enabled | DISM /Enable-Feature 一键启用 |
| **.NET Framework** | 3.5（DISM 启用）、4.8（Release ≥ 528040）、8.0 Desktop Runtime | DISM / 官方安装包 |
| **OpenAL** | Creative Labs 注册表键 | openal.org / Internet Archive 镜像 |
| **PhysX** | NVIDIA PhysX Version ≥ 9 | 3 地域镜像（US/EU/HK）自动选最快 |
| **WebView2** | EdgeUpdate 客户端注册表 | 微软在线安装包 |
| **系统安全** | 内存完整性（Core Isolation）检测 | 引导跳转 Windows 安全中心 |
| **DLL 识别器** | 输入 DLL 文件名，反查所属运行库 | 基于 manifest 的模糊匹配 |

### 规划中

#### 1. 全盘 DLL 扫描
- 扫描 `System32`、`SysWOW64`、`Program Files` 下已知 DLL 的缺失和版本异常
- 对照「可信 DLL 数据库」识别损坏、版本不匹配、被劫持的文件
- 自动从内置库提取并注册（`regsvr32`）

#### 2. DirectX 专项扫描
- 独立展示 DirectX 加速状态（DirectDraw / Direct3D / AGP）
- 检测显卡驱动版本与 DirectX 功能级别（Feature Level）是否匹配
- DirectX 修复后自动运行 `dxdiag /t` 验证

#### 3. 游戏运行环境扫描
- 聚合 DirectX + VC++ + .NET + OpenAL + PhysX + XAudio 为「游戏兼容性报告」
- 检测 Steam / Epic / Xbox Game Pass 依赖的运行库是否完整
- 检测 EasyAntiCheat / BattlEye 驱动是否正常运行（仅检测，不修改）

#### 4. 注册表修复
- 修复因运行库卸载不干净导致的 COM / ActiveX 注册残留
- 重新注册 System32 下所有 DLL（类似 DirectX Repair 的「注册」功能）
- 清理孤儿注册表项（Uninstall 残留、无效的 App Paths）

#### 5. Windows 组件修复
- SFC / DISM 深度修复（RestoreHealth 和 ScanHealth）
- 检测 Windows Update 组件是否损坏（`trustedinstaller.exe` 相关）
- 修复 Windows Image 损坏导致的安装失败

#### 6. 图形驱动检测
- 检测 NVIDIA / AMD / Intel 显卡驱动版本
- 对比 WHQL 签名日期与最新稳定版
- 引导到官方下载页（不自动安装驱动）

#### 7. 命令行模式
- 静默扫描：`winds-restore.exe --scan --format json`
- 静默修复：`winds-restore.exe --fix --all` 或 `--fix vcpp_2022,dx9`
- 导出报告：`winds-restore.exe --export report.json`

#### 8. 诊断报告系统
- 结构化 JSON 报告（含系统信息、已安装组件、缺失组件、环境变量 PATH）
- 一键复制 Markdown 报告 + 打开 ChatGPT / DeepSeek / Kimi / 豆包
- 用户反馈 -> 本地导出 -> 匿名提交到 GitHub Issues

#### 9. 扩展数据包（类似 DirectX Repair 的增强包）
- 独立的数据包更新机制（不更新 exe 本体）
- DLL 文件数据库：常见 DLL 的官方版本、哈希值、签名信息
- 离线修复包：为无网络环境提供完整数据

---

## 近五年新问题分区

以下为 2020–2025 年间 Windows 游戏和应用生态中出现的新问题，计划在独立分区中处理：

| 问题 | 涉及场景 | 检测方案 |
|------|----------|----------|
| **内存完整性（VBS）拦截旧驱动** | Win11 24H2 + 老游戏（Denuvo / SafeDisc / SecuROM） | 检测 `HypervisorEnforcedCodeIntegrity = 1` |
| **WebView2 运行时缺失** | 基于 Electron / WebView2 的新应用（微信 4.0、很多游戏启动器） | 注册表 + 文件存在性 |
| **VC++ 2022 Redist 未安装** | 2023 年后新游戏（UE5 引擎） | 注册表 Bld 值 |
| **.NET 8 / 9 桌面运行时缺失** | 新 .NET 应用、部分 Unity 游戏 | 注册表 Install 值 |
| **微软 DirectStorage** | Win11 + NVMe SSD 优化游戏（如《暗黑破坏神 IV》） | 文件 + 功能版本 |
| **OpenCL / Vulkan 运行时** | 部分模拟器（Yuzu / RPCS3）和 AI 推理本地应用 | LoadLibrary 检测 |
| **Visual C++ ARM64 / ARM64EC** | Surface Pro 9+ / Mac 虚拟机上的 Windows | 架构感知的运行时检测 |
| **Win11 24H2 打印机/驱动兼容性修复** | HP / Canon 驱动签名问题 | 注册表 + 事件日志分析 |
| **Microsoft Edge WebView2（固定版）** | 部分国内软件依赖特定版本 WebView2 | 注册表 pv 版本比对 |
| **EasyAntiCheat / BattlEye 驱动掉签** | 反作弊驱动被 VBS 或 Secure Boot 状态影响 | 服务状态 + 驱动签名验证 |
| **KB5027141 / KB5034441 等更新导致的需求变更** | Windows Update 引出的新运行时依赖 | 主动查询已安装的 KB 补丁列表 |

---

## 架构概览

```
winds-restore/
├── assets/
│   └── runtime_manifest.json    # 可检测的运行库清单（JSON，启动时嵌入 exe）
├── src/
│   ├── main.rs                  # eframe 窗口入口
│   ├── models/
│   │   ├── runtime.rs           # RuntimeManifest / RuntimeEntry / VersionCheck
│   │   └── scan_result.rs       # ScanResult / DllResult
│   ├── scanner/
│   │   ├── mod.rs               # scan_runtime() 调度器 + check_memory_integrity()
│   │   ├── registry.rs          # 注册表读取（windows-rs 调用 RegOpenKeyExW / RegQueryValueExW）
│   │   └── filesystem.rs        # 文件存在性检查
│   ├── installer/
│   │   ├── mod.rs               # DownloadManager 线程池（默认 3 并发）
│   │   ├── download.rs          # 流式下载 64KB 块 + 续传 Range + 最快镜像选择
│   │   ├── progress.rs          # 共享进度状态 + 150ms 限速更新
│   │   └── process.rs           # 静默安装（PowerShell Start-Process -Verb RunAs 提权）
│   └── ui/
│       ├── app.rs               # egui 界面：首页 / 扫描 / 结果 / 安装
│       └── mod.rs
```

### 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 语言 | Rust 1.96 | 原生性能、无 GC、安全的内存模型 |
| GUI | egui 0.30 / eframe | 纯 Rust、无 Web 打包、5MB 单文件输出 |
| HTTP | reqwest (blocking) | 同步语义 + 线程池、免 tokio 依赖 |
| Windows API | windows-rs 0.58 | 注册表读取、DLL 加载、Shell 操作 |
| 序列化 | serde_json | 编译时嵌入 manifest、运行时零开销 |

### 对比同类工具

| | Winds Restore | DirectX Repair | 360 系统修复 | 火绒 |
|--|--------------|----------------|--------------|------|
| 体积 | 4.6 MB | ~70 MB (增强版) | 捆绑安装 | 捆绑安装 |
| 开源 | 是 | 否 | 否 | 否 |
| 广告 | 无 | 无 | 有 | 无 |
| 运行库下载 | 在线流式下载 | 内置离线包 | 在线下载 | 不提供 |
| UAC 提权 | PowerShell RunAs | ShellExecute | 服务方式 | 服务方式 |
| DLL 反查 | 基于 manifest | 内置数据库 | 云端查询 | 仅病毒分析 |
| AI 集成 | 一键复制+打开 AI | 无 | 无 | 无 |
| 多镜像 | 最快自动选择 | 单源 | CDN | 无 |

---

## 构建

```powershell
# Debug
cargo build

# Release (~4.6 MB stripped)
cargo build --release

# Release 输出位置
target\release\winds-restore.exe
```

要求：Rust 1.75+，Windows 10/11 x64。无需安装 Visual Studio Build Tools（windows-rs 自带预编译 .lib）。

---

## 路线图

1. **v0.2** — GUI 复杂化：分 tab 扫描（DirectX / VC++ / .NET / 游戏环境）、命令行模式
2. **v0.3** — 全盘 DLL 扫描数据库 + 扩展数据包机制
3. **v0.4** — 注册表修复 + SFC/DISM 深度修复
4. **v0.5** — 驱动检测 + DirectStorage / Vulkan / OpenCL
5. **v0.6** — 离线修复包 + 增量更新
6. **v1.0** — 稳定 API + GitHub Release + 中文社区推广

---

## 贡献

欢迎 Issue 和 PR。优先需要的贡献：

- **新运行库数据**：补充 `runtime_manifest.json` 中的检测键值、下载 URL、镜像
- **DLL 指纹库**：常见 DLL 的 SHA256 + 官方版本号
- **镜像源**：为国内用户提供下载镜像（清华、中科大、阿里云等）
- **翻译**：英文、日文 UI 支持

本项目不收集任何用户数据。反馈信息仅保存在用户本地 `%TEMP%` 目录，由用户自行选择是否提交。
