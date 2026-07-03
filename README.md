# Winds Restore

免费开源的 Windows 运行库 / DLL / 驱动修复工具。

对标 DirectX Repair、360 系统修复等商业工具，用 **Tauri 2.0**（Rust 后端 + React 前端）实现。

---

## 功能

| 能力 | 说明 |
|------|------|
| **运行库扫描** | 检测 VC++、.NET、DirectX、OpenAL、PhysX、WebView2 等 30+ 运行库安装状态 |
| **一键安装** | 从官方源自动下载并静默安装缺失的运行库 |
| **DLL 反查** | 输入 DLL 文件名，反查所属运行库 |
| **错误码查询** | 常见系统错误码含义 + 解决方案 |
| **SFC / DISM 修复** | 系统文件检查器 + 映像修复 |
| **内存完整性检测** | 检测 VBS / Core Isolation 状态 |
| **GPU 驱动检测** | WMI 查询显卡驱动状态 |
| **Shader 缓存管理** | 检测和清理 GPU Shader 缓存 |
| **虚拟内存诊断** | 读取分页文件配置 |
| **Windows 信息** | 版本 / 构建 / 版本号 |
| **AI 诊断报告** | 一键复制 + 打开 AI 网站 |

## 快速开始

```powershell
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 生产构建
npm run tauri build
```

要求：Node.js 18+、Rust 1.75+、Windows 10/11 x64。

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面框架 | Tauri 2.0 |
| 后端语言 | Rust |
| 前端框架 | React 18 + TypeScript |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS 3（深色主题） |
| Windows API | windows-rs 0.58 |
| HTTP | reqwest |
| 构建工具 | Vite 5 |

## 项目结构

```
winds-restore/
├── assets/
│   └── runtime_manifest.json    # 运行库清单（编译时嵌入）
├── src/                         # React 前端
│   ├── api/                     # Tauri invoke 包装 + 事件监听
│   ├── components/              # EulaDialog, InstallPanel, RuntimeCard, Sidebar, StatusBar
│   ├── pages/                   # HomePage, ScanningPage, ResultsPage, ToolsPage, SettingsPage
│   ├── store/                   # Zustand 全局状态
│   ├── types/                   # TypeScript 类型定义
│   └── data/                    # DLL 数据库 + 错误码数据库
├── src-tauri/                   # Rust 后端
│   ├── src/
│   │   ├── main.rs              # 入口
│   │   ├── lib.rs               # Tauri Builder + 模块声明
│   │   ├── commands.rs          # 22 个 Tauri commands
│   │   ├── state.rs             # AppState
│   │   ├── models/              # RuntimeManifest, ScanResult
│   │   └── scanner/             # 注册表 / 文件 / 安装 / 系统诊断
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

## 构建

```powershell
# 安装前端依赖
npm install

# 开发模式（热重载）
npm run tauri dev

# 生产构建
npm run tauri build
```

## 路线图

- **v0.2** — 全盘 DLL 扫描 + 扩展数据包
- **v0.3** — 注册表修复 + SFC/DISM 深度修复
- **v0.4** — 驱动检测 + DirectStorage / Vulkan / OpenCL
- **v0.5** — 离线修复包 + 增量更新
- **v1.0** — 稳定 API + GitHub Release

## 贡献

欢迎 Issue 和 PR。

本项目不收集任何用户数据。
