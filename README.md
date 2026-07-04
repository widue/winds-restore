# Winds Restore · 风与修

![MIT License](https://img.shields.io/badge/license-MIT-green)
![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-purple)
![Rust](https://img.shields.io/badge/Rust-1.75+-orange)
![Windows](https://img.shields.io/badge/Windows-10%2F11-blue)
![GitHub Release](https://img.shields.io/github/v/release/widue/winds-restore)

免费开源的 Windows 运行库 / DLL / 驱动修复工具。

对标 DirectX Repair、360 系统修复等商业工具，用 **Tauri 2.0**（Rust 后端 + React 前端）实现。所有扫描、检测全离线本地执行，不上传任何用户数据。

## 功能

| 能力 | 说明 |
|------|------|
| **运行库扫描** | 检测 VC++ 2005~2022、.NET 3.5/4.8/8.0、DirectX 9.0c、OpenAL、PhysX、WebView2 等 30+ 运行库 |
| **一键安装** | 从微软 / NVIDIA 官方源自动下载并静默安装缺失的运行库 |
| **DLL 反查** | 输入 DLL 文件名反查所属运行库，支持模糊匹配，内置 300+ DLL 数据库 |
| **错误码查询** | 常见 Windows 系统错误码含义 + 解决方案，覆盖 70+ 常见错误 |
| **SFC / DISM 修复** | 一键运行 `sfc /scannow`、`DISM /RestoreHealth`、单文件 SFC 修复 |
| **系统文件检查** | 检测 53 个关键系统 DLL 状态 |
| **WinSxS / API Sets** | 检测 API Set DLL 转发链完整性 |
| **内存完整性** | 检测 VBS / Core Isolation 状态 |
| **GPU 驱动** | WMI 查询显卡驱动状态 |
| **Shader 缓存** | 检测和清理 GPU Shader 缓存 |
| **虚拟内存** | 读取分页文件配置 |
| **Windows 信息** | 版本 / 构建 / 版本号 / 版本 / 24H2 / N/KN |
| **AI 诊断报告** | 上下文词块系统 + 一键复制并打开 ChatGPT / DeepSeek / Kimi / 豆包 |
| **扫描缓存** | 三次检测机制（注册表 → 文件系统 → 安装 API），精准判断运行库状态 |
| **游戏专区** | Steam / Epic / Unity / 着色器缓存专项检测 |

## 快速开始

```powershell
npm install
npm run tauri dev      # 开发模式（热重载）
npm run tauri build    # 生产构建
```

要求：Node.js 18+、Rust 1.75+、Windows 10/11 x64。

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面框架 | Tauri 2.0 |
| 后端 | Rust（windows-rs 0.58、reqwest 0.12） |
| 前端 | React 18 + TypeScript |
| 状态管理 | Zustand 4 |
| 动画 | Framer Motion 12 |
| 虚拟列表 | @tanstack/react-virtual 3 |
| 图标 | Lucide React |
| 样式 | Tailwind CSS 3（深色/浅色双主题） |
| 构建 | Vite 5（代码分割 + 懒加载） |

## 项目结构

```
winds-restore/
├── assets/runtime_manifest.json    # 运行库清单（编译时嵌入）
├── src/                            # React 前端
│   ├── api/                        # Tauri invoke 包装 + 事件监听
│   ├── components/                 # 公共组件（TitleBar, Sidebar, StatusBar 等）
│   ├── pages/                      # 页面组件（按懒加载拆分）
│   ├── store/                      # Zustand 全局状态
│   ├── types/                      # TypeScript 类型定义
│   └── data/                       # DLL 数据库 + 错误码数据库（按需加载）
├── src-tauri/                      # Rust 后端
│   └── src/
│       ├── main.rs                 # 入口
│       ├── lib.rs                  # Tauri Builder
│       ├── state.rs                # AppState
│       ├── models/                 # RuntimeManifest, ScanResult
│       ├── scanner/                # 注册表 / 文件 / 安装 / 系统诊断
│       └── commands.rs             # 全部 Tauri 命令处理
├── package.json
└── vite.config.ts
```

## 性能设计

- **前端**: 页面级 React.lazy 懒加载、@tanstack/react-virtual 虚拟列表、framer-motion 精简动画、luicide-react 按需 tree-shaking
- **后端**: Rust 原生编译、多线程扫描、异步事件推送
- **构建**: Vite 5 多入口代码分割（vendor / tauri / pages）、CSS 最小化 + 压缩
- **运行时**: 内存使用实时监控（2s 间隔轮询）、Zustand 按需订阅避免不必要渲染

## 下载

从 [GitHub Releases](https://github.com/widue/winds-restore/releases) 下载最新版本。

## 路线图

- **v0.2** — 全盘 DLL 扫描 + 扩展数据包
- **v0.3** — 注册表修复 + SFC/DISM 深度修复
- **v0.4** — 驱动检测 + DirectStorage / Vulkan / OpenCL
- **v0.5** — 离线修复包 + 增量更新
- **v1.0** — 稳定 API + GitHub Release

## 许可证

[MIT](LICENSE) © 2026 widue

本项目不收集任何用户数据。所有扫描在本地执行，不联网上传。
