import React, { useState, useEffect, useCallback, useRef } from "react";
import { get_dll_owner, get_error_code_help, open_in_browser, scan_common_dlls, check_system_files, run_sfc_scannow, sfc_repair_file, run_dism_restorehealth, check_winsxs_integrity, check_virtual_memory, check_shader_cache, clean_shader_cache, get_windows_info } from "../api/tauri";
import type { DllScanResult, SystemFileResult, RepairResult, WinSxSStatus, VirtualMemoryInfo, ShaderCacheInfo, WindowsInfo } from "../types";
import { useAppStore } from "../store/appStore";
import { ALL_DLLS } from "../data/dllDatabase";
import { ERROR_CODES } from "../data/errorCodeDatabase";
import { findRuntimeForDll, findRuntimesForErrorCode } from "../utils/dllRuntimeMapping";
import {
  Wrench,
  Search,
  AlertCircle,
  Zap,
  Gamepad2,
  Puzzle,
  Monitor,
  Tag,
  Copy,
  Check,
  Sparkles,
  Palette,
  HardDrive,
  Shield,
  Cpu,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Info,
  Download,
} from "lucide-react";

type TagType = "scenario" | "error" | "effort";
interface ContextTag { id: string; type: TagType; label: string; }

const TAG_LABELS: Record<TagType, string> = { scenario: "场景", error: "报错", effort: "已尝试" };
const TAG_STYLES: Record<TagType, { bg: string; color: string; border: string }> = {
  scenario: { bg: "var(--brand-wind-10)", color: "var(--brand-wind)", border: "var(--brand-wind-20)" },
  error: { bg: "var(--status-danger-10)", color: "var(--status-danger)", border: "var(--status-danger-20)" },
  effort: { bg: "var(--status-success-10)", color: "var(--status-success)", border: "var(--status-success-20)" },
};

let tagIdCounter = 0;
function nextTagId(): string { return `tag_${Date.now()}_${++tagIdCounter}`; }


type ToolTab = "dll" | "errorcode" | "quickfix" | "game" | "thirdparty" | "system";

function generateTemplate(tags: ContextTag[]): string {
  const scenario = tags.filter(t => t.type === "scenario").map(t => t.label).join("；");
  const errors = tags.filter(t => t.type === "error").map(t => t.label).join("、");
  const efforts = tags.filter(t => t.type === "effort").map(t => t.label).join("；");
  const lines: string[] = [];
  if (scenario) lines.push(`## 场景\n${scenario}`);
  if (errors) lines.push(`## 报错\n${errors}`);
  if (efforts) lines.push(`## 已尝试的修复\n${efforts}`);
  if (lines.length === 0) lines.push("（请添加场景/报错/已尝试词块）");
  lines.push("## 补充说明\n");
  return lines.join("\n\n");
}

const ContextTagBar: React.FC<{
  tags: ContextTag[]; tagInputValue: string; showTagInput: TagType | null;
  tagInputRef: React.RefObject<HTMLInputElement>;
  onAdd: (type: TagType, label: string) => void; onRemove: (id: string) => void;
  onTagClick: (tag: ContextTag) => void;
  onSetTagInput: (v: string) => void; onSetShowTagInput: (v: TagType | null) => void;
}> = ({ tags, tagInputValue, showTagInput, tagInputRef, onAdd, onRemove, onTagClick, onSetTagInput, onSetShowTagInput }) => {
  const [copied, setCopied] = useState(false);
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(generateTemplate(tags));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mb-4">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => {
            const style = TAG_STYLES[tag.type];
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  borderColor: style.border,
                }}
                onClick={() => onTagClick(tag)}
                title={tag.type === "error" ? "点击填入查询框" : undefined}
              >
                <span className="opacity-70 mr-0.5">{TAG_LABELS[tag.type]}</span>
                {tag.label}
                <button
                  onClick={e => { e.stopPropagation(); onRemove(tag.id); }}
                  className="ml-0.5 hover:opacity-80 leading-none text-sm"
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="flex gap-1.5 flex-wrap items-center">
        {(["scenario", "error", "effort"] as TagType[]).map(type => (
          showTagInput === type ? (
            <div key={type} className="flex gap-1">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInputValue}
                onChange={e => onSetTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") onAdd(type, tagInputValue);
                  if (e.key === "Escape") { onSetShowTagInput(null); onSetTagInput(""); }
                }}
                placeholder={type === "scenario" ? "例: 进 3DMark 报错" : type === "error" ? "例: vcruntime140.dll" : "已尝试的操作..."}
                className="input text-[12px] py-1 w-48"
                id={`tag-input-${type}`}
                name={`tagInput-${type}`}
                autoComplete="off"
              />
              <button onClick={() => onAdd(type, tagInputValue)} className="btn-primary !py-1 !px-2 text-[12px]">添加</button>
              <button onClick={() => { onSetShowTagInput(null); onSetTagInput(""); }} className="btn-ghost !py-1 !px-2 text-[12px]">取消</button>
            </div>
          ) : (
            <button
              key={type}
              onClick={() => { onSetShowTagInput(type); onSetTagInput(""); }}
              className="text-[12px] px-2.5 py-1 rounded-md border transition-all hover:border-[var(--brand-wind-20)] hover:text-[var(--brand-wind)]"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-muted)",
              }}
            >
              + {TAG_LABELS[type]}
            </button>
          )
        ))}
        {tags.length > 0 && (
          <button
            onClick={handleCopyTemplate}
            className="text-[12px] px-2.5 py-1 rounded-md border transition-all hover:bg-[var(--brand-wind-10)]"
            style={{
              borderColor: "var(--brand-wind-20)",
              color: "var(--brand-wind)",
            }}
          >
            {copied ? (
              <><Check size={12} strokeWidth={2} /> 已复制</>
            ) : (
              <><Copy size={12} strokeWidth={2} /> 生成 AI 诊断模板</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

type DllItem = { dll: string; platform: string; guide: string; warning?: string };

const QUICK_REF: [string, string][] = [
  ["MSVCP140.dll", "VC++ 2015-2022 标准库"],
  ["VCRUNTIME140.dll", "VC++ 2015-2022 运行时"],
  ["VCRUNTIME140_1.dll", "VC++ 2015-2022 运行时"],
  ["MSVCR120.dll", "VC++ 2013 运行时"],
  ["MSVCP120.dll", "VC++ 2013 标准库"],
  ["MSVCR110.dll", "VC++ 2012 运行时"],
  ["MSVCP110.dll", "VC++ 2012 标准库"],
  ["MSVCR100.dll", "VC++ 2010 运行时"],
  ["MSVCP100.dll", "VC++ 2010 标准库"],
  ["MFC100U.dll", "VC++ 2010 MFC Unicode"],
  ["MSVCR90.dll", "VC++ 2008 运行时"],
  ["MSVCP90.dll", "VC++ 2008 标准库"],
  ["MSVCR80.dll", "VC++ 2005 运行时"],
  ["MSVCP80.dll", "VC++ 2005 标准库"],
  ["D3DCOMPILER_47.dll", "DirectX 着色器编译器"],
  ["D3DX9_43.dll", "DirectX 9 (最高版)"],
  ["D3DX9_36.dll", "DirectX 9 (老游戏最常见)"],
  ["D3DX10_43.dll", "DirectX 10"],
  ["D3DX11_43.dll", "DirectX 11"],
  ["XINPUT1_3.dll", "XInput 手柄 (最常见)"],
  ["XINPUT1_4.dll", "XInput 手柄 (Win8+)"],
  ["X3DAudio1_7.dll", "X3DAudio 3D 音效"],
  ["XAPOFX1_5.dll", "XAPOFX 音效处理"],
  ["XAudio2_7.dll", "XAudio 2.7 (最常见)"],
  ["MFPlat.DLL", "Media Foundation 平台"],
  ["OPENAL32.dll", "OpenAL 音频"],
  ["ucrtbase.dll", "Universal CRT 基础"],
  ["api-ms-win-crt-runtime-l1-1-0.dll", "UCRT API Set"],
  ["concrt140.dll", "VC++ 并发运行时"],
  ["vcomp140.dll", "VC++ OpenMP 并行库"],
  ["d3dcompiler_43.dll", "DirectX 着色器编译器"],
];

const ERROR_CODE_LIST: [string, string, string][] = [
  ["0xc000007b", "应用程序无法正常启动", "VC++运行库/显卡驱动"],
  ["0xc0000005", "访问违规（内存访问冲突）", "内存损坏/杀毒拦截/驱动冲突"],
  ["0xc0000142", "DLL 初始化失败", "VC++运行库/系统文件"],
  ["126", "找不到指定的模块", "DLL缺失/环境变量错误"],
  ["127", "找不到程序入口点", "DLL版本不匹配"],
  ["0xc0000135", "找不到 .NET Framework", ".NET运行时未安装"],
  ["80070643", "更新/安装失败", "系统文件损坏/Installer损坏"],
  ["0x800f0831", "组件存储损坏（CBS）", "需 DISM /RestoreHealth"],
  ["0x800F0950", ".NET 3.5 启用失败", "组策略限制/WSUS"],
  ["0x800F0954", ".NET 3.5 启用失败（域环境）", "WSUS策略/组策略"],
  ["0x80070002", "系统找不到指定文件", "安装源缺失/模块安装器"],
  ["0x80070005", "访问被拒绝", "注册表权限/UAC限制"],
  ["0x81f40001", "VC++ 安装失败", "版本冲突/系统文件"],
  ["0x80080005", "服务器运行失败", "Windows Installer服务"],
  ["Error 1935", "程序集安装失败", "CBS损坏/杀毒"],
  ["0x887a0005", "DXGI 设备挂起", "显卡驱动崩溃/超频"],
  ["0x887a0022", "DXGI 设备已移除", "显卡驱动重置/过热"],
  ["0xc000001d", "非法指令", "CPU不支持指令集"],
  ["0xc0000094", "整数除法溢出", "CPU稳定性问题"],
  ["0x00000116", "蓝屏：显卡驱动崩溃", "显卡驱动/过热"],
  ["0x00000124", "蓝屏：硬件错误", "CPU/RAM不稳定"],
  ["0x00000050", "蓝屏：页面错误", "内存故障/驱动bug"],
  ["0x000000d1", "蓝屏：驱动访问错误", "驱动兼容问题"],
  ["0x80072efd", "服务器连接失败", "代理/时间/TLS"],
  ["0x800704cf", "无法访问网络位置", "网络中断/防火墙"],
  ["0x80072f8f", "证书吊销检查失败", "网络受限/代理"],
  ["Steam 错误 53", "Steam 初始化失败", "Steam未运行/管理员权限"],
  ["Epic 错误 LS-0006", "Epic 登录失败", "网络代理/DNS"],
  ["Xbox 0x80070490", "Xbox 登录失败", "微软账户/服务离线"],
];

const STEAM_DLLS: DllItem[] = [
  { dll: "steam_api.dll", platform: "Steam (32位)", guide: "请通过 Steam → 库 → 右键游戏 → 属性 → 已安装文件 → 验证游戏文件完整性", warning: "不要单独下载，可能被Steam判定为盗版" },
  { dll: "steam_api64.dll", platform: "Steam (64位)", guide: "请通过 Steam → 库 → 右键游戏 → 属性 → 已安装文件 → 验证游戏文件完整性", warning: "不要单独下载，可能被Steam判定为盗版" },
  { dll: "steamclient.dll", platform: "Steam 客户端", guide: "重新安装 Steam 客户端" },
  { dll: "steamclient64.dll", platform: "Steam 客户端 (64位)", guide: "重新安装 Steam 客户端" },
];

const EPIC_DLLS: DllItem[] = [
  { dll: "EOSSDK-Win64-Shipping.dll", platform: "Epic (64位)", guide: "请通过 Epic Games Launcher → 库 → 右键游戏 → 管理 → 验证" },
  { dll: "EOSSDK-Win32-Shipping.dll", platform: "Epic (32位)", guide: "请通过 Epic Games Launcher → 库 → 右键游戏 → 管理 → 验证" },
];

const ENGINE_DLLS: DllItem[] = [
  { dll: "UnityPlayer.dll", platform: "Unity 引擎", guide: "该 DLL 属于 Unity 游戏，请重新安装游戏" },
  { dll: "UnityPlayer_s.dll", platform: "Unity 引擎 (安全模式)", guide: "该 DLL 属于 Unity 游戏，请重新安装游戏" },
  { dll: "mono-2.0-sgen.dll", platform: "Unity Mono 运行时", guide: "Unity 游戏 Mono 运行时，请重新安装游戏" },
  { dll: "MonoBleedingEdge\\embed_mono.dll", platform: "Unity MonoBleedingEdge", guide: "该 DLL 属于 Unity 游戏，请重新安装游戏" },
  { dll: "il2cpp.dll", platform: "Unity IL2CPP", guide: "该 DLL 属于 Unity 游戏，请重新安装游戏" },
  { dll: "GameAssembly.dll", platform: "Unity IL2CPP (国内手游)", guide: "该 DLL 属于 Unity 游戏，常见于米哈游等游戏，请重新安装游戏" },
  { dll: "bink2w64.dll", platform: "Bink Video (64位)", guide: "RAD Game Tools 视频解码器，属于游戏自带组件。请重新安装游戏" },
  { dll: "bink2w32.dll", platform: "Bink Video (32位)", guide: "RAD Game Tools 视频解码器，属于游戏自带组件。请重新安装游戏" },
  { dll: "binkw64.dll", platform: "Bink Video (64位, 旧版)", guide: "RAD Game Tools 视频解码器，属于游戏自带组件。请重新安装游戏" },
  { dll: "binkw32.dll", platform: "Bink Video (32位, 旧版)", guide: "RAD Game Tools 视频解码器，属于游戏自带组件。请重新安装游戏" },
  { dll: "SDL2.dll", platform: "SDL2 多媒体", guide: "该 DLL 属于特定游戏，请重新安装游戏" },
  { dll: "SDLA.dll", platform: "SDL 音频", guide: "该 DLL 属于特定游戏，请重新安装游戏" },
  { dll: "glew32.dll", platform: "GLEW OpenGL", guide: "OpenGL 扩展库，属于特定游戏，请重新安装游戏" },
  { dll: "glfw3.dll", platform: "GLFW 窗口", guide: "窗口管理库，属于特定游戏，请重新安装游戏" },
  { dll: "nvngx_dlss.dll", platform: "NVIDIA DLSS", guide: "NVIDIA 深度学习超采样，属于特定游戏，请重新安装游戏或更新显卡驱动" },
  { dll: "nvngx.dll", platform: "NVIDIA NGX", guide: "NVIDIA 神经图形库，请更新显卡驱动" },
  { dll: "xapofx1_5.dll", platform: "DirectX XAPOFX", guide: "XAudio 音效处理库，请安装 DirectX End-User Runtime" },
  { dll: "X3DAudio1_7.dll", platform: "DirectX X3DAudio", guide: "DirectX 3D 音频库，请安装 DirectX End-User Runtime" },
];

const OTHER_PLATFORM_DLLS: DllItem[] = [
  { dll: "XGamingRuntime.dll", platform: "Xbox GDK", guide: "通过微软商店 → 库 → 点击游戏 → 修复" },
  { dll: "Galaxy.dll", platform: "GOG Galaxy", guide: "通过 GOG Galaxy → 右键游戏 → 管理 → 验证 / 修复" },
  { dll: "Galaxy64.dll", platform: "GOG Galaxy (64位)", guide: "通过 GOG Galaxy → 右键游戏 → 管理 → 验证 / 修复" },
];

const CRYPTO_DLLS: DllItem[] = [
  { dll: "libssl-1_1.dll", platform: "OpenSSL 1.1", guide: "该文件属于依赖 OpenSSL 的软件（如 Git、Python、证书工具），请重新安装对应软件" },
  { dll: "libcrypto-1_1.dll", platform: "OpenSSL 1.1", guide: "该文件属于依赖 OpenSSL 的软件，请重新安装对应软件" },
  { dll: "libeay32.dll", platform: "OpenSSL 旧版", guide: "旧版 OpenSSL，属于特定软件，请重装" },
  { dll: "ssleay32.dll", platform: "OpenSSL 旧版", guide: "旧版 OpenSSL，属于特定软件，请重装" },
];

const NETLOG_DLLS: DllItem[] = [
  { dll: "libcurl.dll", platform: "libcurl", guide: "该文件属于依赖 cURL 的软件（如 PHP、wget），请重新安装对应软件" },
  { dll: "log4cpp.dll", platform: "Apache log4cpp", guide: "该文件属于依赖 log4cpp 的 C++ 软件，请重新安装对应软件" },
];

const COMPRESS_DLLS: DllItem[] = [
  { dll: "zlib1.dll", platform: "zlib", guide: "该文件属于依赖 zlib 的软件（如游戏、压缩工具），请重新安装对应软件" },
  { dll: "zlib.dll", platform: "zlib", guide: "该文件属于依赖 zlib 的软件，请重新安装对应软件" },
  { dll: "libpng.dll", platform: "libpng", guide: "该文件属于依赖 libpng 的软件，请重新安装对应软件" },
  { dll: "libjpeg.dll", platform: "libjpeg", guide: "该文件属于依赖 libjpeg 的软件，请重新安装对应软件" },
  { dll: "freetype.dll", platform: "FreeType", guide: "字体渲染库，属于特定软件，请重新安装对应软件" },
];

const PYTHON_DLLS: DllItem[] = [
  { dll: "python3.dll", platform: "Python 3", guide: "Python 3 运行时，请从 python.org 重新安装 Python 3" },
  { dll: "python310.dll", platform: "Python 3.10", guide: "Python 3.10 运行时，请重新安装 Python 3.10" },
  { dll: "python311.dll", platform: "Python 3.11", guide: "Python 3.11 运行时，请重新安装 Python 3.11" },
  { dll: "python312.dll", platform: "Python 3.12", guide: "Python 3.12 运行时，请重新安装 Python 3.12" },
];

const QT_DLLS: DllItem[] = [
  { dll: "Qt5Core.dll", platform: "Qt5 核心", guide: "Qt5 框架核心库，属于特定 Qt 应用，请重新安装对应软件" },
  { dll: "Qt5Gui.dll", platform: "Qt5 GUI", guide: "Qt5 框架 GUI 库，属于特定 Qt 应用，请重新安装对应软件" },
  { dll: "Qt5Widgets.dll", platform: "Qt5 Widgets", guide: "Qt5 框架 Widgets 库，属于特定 Qt 应用，请重新安装对应软件" },
];

const ICU_DLLS: DllItem[] = [
  { dll: "icuuc74.dll", platform: "ICU Unicode", guide: "Unicode 国际化库，属于特定软件，请重新安装对应软件" },
  { dll: "icuin74.dll", platform: "ICU I18N", guide: "Unicode 国际化库，属于特定软件，请重新安装对应软件" },
  { dll: "icudt74.dll", platform: "ICU Data", guide: "Unicode 国际化库数据，属于特定软件，请重新安装对应软件" },
];

const AI_SITES: Record<string, string> = {
  DeepSeek: "https://chat.deepseek.com/",
  豆包: "https://www.doubao.com/chat/",
  Kimi: "https://kimi.moonshot.cn/",
  ChatGPT: "https://chatgpt.com/",
};

interface SearchItem { label: string; sublabel: string; }
type SearchIndex = SearchItem[];

let dllSearchIndex: SearchIndex | null = null;
let errorSearchIndex: SearchIndex | null = null;

function getDllSearchIndex(): SearchIndex {
  if (!dllSearchIndex) dllSearchIndex = ALL_DLLS.map(d => ({ label: d.label.toLowerCase(), sublabel: d.sublabel }));
  return dllSearchIndex;
}

function getErrorSearchIndex(): SearchIndex {
  if (!errorSearchIndex) errorSearchIndex = ERROR_CODES.map(e => ({ label: e.code.toLowerCase(), sublabel: e.description }));
  return errorSearchIndex;
}

function searchIndex(index: SearchIndex, query: string, max = 8): SearchItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const matches = index.filter(item => item.label.includes(q));
  matches.sort((a, b) => {
    if (a.label === q) return -1;
    if (b.label === q) return 1;
    if (a.label.startsWith(q)) return -1;
    if (b.label.startsWith(q)) return 1;
    return a.label.indexOf(q) - b.label.indexOf(q);
  });
  return matches.slice(0, max);
}

const SearchDropdown: React.FC<{
  query: string; index: SearchIndex;
  onSelect: (label: string) => void; onClose: () => void;
}> = ({ query, index, onSelect, onClose }) => {
  const [activeIdx, setActiveIdx] = useState(-1);
  const results = searchIndex(index, query);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0 && activeIdx < results.length) {
      e.preventDefault(); onSelect(results[activeIdx].label); onClose();
    }
    else if (e.key === "Escape") { onClose(); }
  }, [results, activeIdx, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => { setActiveIdx(-1); }, [query]);

  if (results.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        ref={listRef}
        className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg shadow-lg max-h-56 overflow-y-auto border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {results.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center justify-between px-3 py-2 text-[12px] cursor-pointer transition-colors"
            style={{
              backgroundColor: i === activeIdx ? "var(--brand-wind-10)" : "transparent",
              color: i === activeIdx ? "var(--text-primary)" : "var(--text-secondary)",
            }}
            onClick={() => { onSelect(item.label); onClose(); }}
            onMouseEnter={() => setActiveIdx(i)}
          >
            <span className="font-mono">{item.label}</span>
            <span className="text-[11px] ml-2 shrink-0" style={{ color: "var(--text-muted)" }}>{item.sublabel}</span>
          </div>
        ))}
      </div>
    </>
  );
};

const scanCache = new Map<string, Map<string, DllScanResult>>();
const SCAN_CACHE_MAX = 20;

async function runScanAll(items: DllItem[]): Promise<Map<string, DllScanResult>> {
  const key = items.map(i => i.dll.toLowerCase()).sort().join("|");
  const cached = scanCache.get(key);
  if (cached) return cached;
  if (scanCache.size >= SCAN_CACHE_MAX) {
    const firstKey = scanCache.keys().next();
    if (firstKey.value) scanCache.delete(firstKey.value);
  }
  const names = items.map(i => i.dll);
  const results = await scan_common_dlls(names);
  const map = new Map<string, DllScanResult>();
  results.forEach(r => map.set(r.name.toLowerCase(), r));
  scanCache.set(key, map);
  return map;
}

const QuickFixCard: React.FC<{
  title: string; desc: string;
  actions: { label: string; url?: string; cmd?: string }[];
}> = ({ title, desc, actions }) => {
  const [copyMsg, setCopyMsg] = useState("");
  const handleCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopyMsg("已复制命令，请以管理员身份运行 PowerShell 并粘贴执行");
      setTimeout(() => setCopyMsg(""), 3000);
    });
  };
  return (
    <div className="card">
      <h3 className="text-[14px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-[12px] mb-3" style={{ color: "var(--text-secondary)" }}>{desc}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => { if (a.url) open_in_browser(a.url); if (a.cmd) handleCmd(a.cmd); }}
            className="btn-secondary !py-1.5 !px-3 text-[12px]"
          >
            {a.cmd ? <Copy size={12} strokeWidth={2} /> : <ExternalLink size={12} strokeWidth={2} />}
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      {copyMsg && <p className="text-[11px] mt-2" style={{ color: "var(--status-success)" }}>✓ {copyMsg}</p>}
    </div>
  );
};

const ShaderCacheSection: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<ShaderCacheInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<ShaderCacheInfo | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    check_shader_cache().then(info => {
      if (mountedRef.current) { setCacheInfo(info); setLoading(false); }
    });
    return () => { mountedRef.current = false; };
  }, []);

  const handleClean = async () => {
    setCleaning(true); setCleanResult(null);
    try {
      const result = await clean_shader_cache();
      if (mountedRef.current) { setCleanResult(result); setCacheInfo({ total_size_mb: 0, vendors: [] }); }
    } catch {
      if (mountedRef.current) setCleanResult(null);
    } finally { if (mountedRef.current) setCleaning(false); }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <div className="icon-wrap-sm" style={{ backgroundColor: "var(--accent-ochre-10)", color: "var(--accent-ochre)" }}>
            <Palette size={16} strokeWidth={2} />
          </div>
          GPU 着色器缓存
        </h3>
        {!loading && (
          <button
            onClick={handleClean}
            disabled={cleaning || (cacheInfo?.total_size_mb ?? 0) === 0}
            className="btn-secondary !py-1 !px-2.5 text-[12px]"
          >
            {cleaning ? <><Loader2 size={12} className="animate-spin" /> 清理中...</> : <>🗑 一键清空</>}
          </button>
        )}
      </div>
      <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
        着色器缓存堆积过多或损坏会导致新游戏闪退（黑神话、使命召唤等）。清空后游戏会重新编译着色器，首次进入稍慢但不会再闪退。
      </p>
      {loading ? (
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>检测中...</p>
      ) : !cacheInfo || cacheInfo.vendors.length === 0 ? (
        <p className="text-[12px]" style={{ color: "var(--status-success)" }}>✓ 未检测到着色器缓存</p>
      ) : (
        <div className="space-y-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {cacheInfo.vendors.map(v => (
            <div key={v.name} className="flex justify-between">
              <span>{v.name}</span>
              <span className="tabular-nums">{v.size_mb} MB</span>
            </div>
          ))}
          <div
            className="flex justify-between font-medium pt-1 border-t"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
          >
            <span>总计</span>
            <span className="tabular-nums">{cacheInfo.total_size_mb} MB</span>
          </div>
        </div>
      )}
      {cleanResult && cleanResult.vendors.length > 0 && (
        <p className="text-[12px] mt-2" style={{ color: "var(--status-success)" }}>
          ✓ 已清空 {cleanResult.total_size_mb} MB 着色器缓存
        </p>
      )}
    </div>
  );
};

const DllCheckSection: React.FC<{ title: string; items: DllItem[] }> = ({ title, items }) => {
  const [results, setResults] = useState<Map<string, DllScanResult>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    runScanAll(items).then(map => {
      if (mounted) { setResults(map); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map(item => {
          const r = results.get(item.dll.toLowerCase());
          return (
            <div
              key={item.dll}
              className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ backgroundColor: "var(--bg-input)" }}
            >
              <span
                className="text-base shrink-0 mt-0.5"
                style={{
                  color: loading
                    ? "var(--text-muted)"
                    : r?.found
                      ? "var(--status-success)"
                      : "var(--status-danger)",
                }}
              >
                {loading ? "..." : r?.found ? "✓" : "✗"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code
                    className="text-[12px] font-mono"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.dll}
                  </code>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.platform}
                  </span>
                </div>
                {r?.found && r.path && (
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                    {r.path}
                  </p>
                )}
                {!r?.found && !loading && (
                  <div className="mt-1">
                    <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{item.guide}</p>
                    {item.warning && (
                      <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "var(--status-warning)" }}>
                        <AlertTriangle size={11} strokeWidth={2} />
                        {item.warning}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RepairResultBox: React.FC<{ title: string; result: RepairResult }> = ({ title, result }) => (
  <div
    className="mt-3 p-3 rounded-lg text-[12px] border"
    style={{
      backgroundColor: result.success ? "var(--status-success-10)" : "var(--status-danger-10)",
      borderColor: result.success ? "var(--status-success-20)" : "var(--status-danger-20)",
    }}
  >
    <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>{title}</p>
    <p
      className={`font-medium text-[12px] mb-1`}
      style={{ color: result.success ? "var(--status-success)" : "var(--status-danger)" }}
    >
      {result.success ? "✓ 完成" : "✗ 可能有问题"}
    </p>
    <pre
      className="text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto"
      style={{ color: "var(--text-secondary)" }}
    >
      {result.output || "(无输出)"}
    </pre>
  </div>
);

const SystemRepairSection: React.FC = () => {
  const [sysFiles, setSysFiles] = useState<SystemFileResult[]>([]);
  const [filter, setFilter] = useState<"all" | "found" | "missing">("all");
  const [loading, setLoading] = useState(true);
  const [sfcResult, setSfcResult] = useState<RepairResult | null>(null);
  const [dismResult, setDismResult] = useState<RepairResult | null>(null);
  const [sfcRunning, setSfcRunning] = useState(false);
  const [dismRunning, setDismRunning] = useState(false);
  const [winsxsStatus, setWinsxsStatus] = useState<WinSxSStatus | null>(null);
  const [winsxsRunning, setWinsxsRunning] = useState(false);
  const [vmInfo, setVmInfo] = useState<VirtualMemoryInfo | null>(null);
  const [winInfo, setWinInfo] = useState<WindowsInfo | null>(null);
  const [repairingFile, setRepairingFile] = useState<string | null>(null);
  const [fileRepairResult, setFileRepairResult] = useState<{ name: string; result: RepairResult } | null>(null);
  const mountedRef = useRef(true);

  const handleFileRepair = async (file: SystemFileResult) => {
    const path = file.path || `C:\\Windows\\System32\\${file.name}`;
    setRepairingFile(file.name); setFileRepairResult(null);
    try {
      const result = await sfc_repair_file(path);
      if (mountedRef.current) { setFileRepairResult({ name: file.name, result }); setRepairingFile(null); }
    } catch (err: unknown) {
      if (mountedRef.current) { setFileRepairResult({ name: file.name, result: { success: false, output: String(err) } }); setRepairingFile(null); }
    }
  };

  useEffect(() => {
    setLoading(true);
    check_system_files().then(files => {
      if (mountedRef.current) {
        setSysFiles(files);
        setLoading(false);
      }
    });
    check_virtual_memory().then(info => { if (mountedRef.current) setVmInfo(info); });
    get_windows_info().then(info => { if (mountedRef.current) setWinInfo(info); });
    return () => { mountedRef.current = false; };
  }, []);

  const handleSfc = async () => {
    setSfcRunning(true); setSfcResult(null);
    try { const result = await run_sfc_scannow(); if (mountedRef.current) setSfcResult(result); }
    catch (err: unknown) { if (mountedRef.current) setSfcResult({ success: false, output: String(err) }); }
    finally { if (mountedRef.current) setSfcRunning(false); }
  };

  const handleDism = async () => {
    setDismRunning(true); setDismResult(null);
    try { const result = await run_dism_restorehealth(); if (mountedRef.current) setDismResult(result); }
    catch (err: unknown) { if (mountedRef.current) setDismResult({ success: false, output: String(err) }); }
    finally { if (mountedRef.current) setDismRunning(false); }
  };

  const handleWinsxs = async () => {
    setWinsxsRunning(true); setWinsxsStatus(null);
    try { const result = await check_winsxs_integrity(); if (mountedRef.current) setWinsxsStatus(result); }
    catch (err: unknown) { if (mountedRef.current) setWinsxsStatus({ scan_result: { success: false, output: String(err) }, api_set_count: 0, api_set_found: 0 }); }
    finally { if (mountedRef.current) setWinsxsRunning(false); }
  };

  const filtered = sysFiles.filter(f =>
    filter === "all" ? true : filter === "found" ? f.found : !f.found
  );
  const missingCount = sysFiles.filter(f => !f.found).length;

  return (
    <div className="space-y-6">
      {winInfo && (
        <div className="card">
          <h2 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <div className="icon-wrap-sm"><Monitor size={16} strokeWidth={2} /></div>
            系统版本
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
            <span>{winInfo.product_name || `Windows ${winInfo.version}`} {winInfo.display_version && `(${winInfo.display_version})`} — 版本 {winInfo.version} (build {winInfo.build})</span>
            <span>{winInfo.edition}</span>
            {winInfo.is_24h2 && <span style={{ color: "var(--status-warning)" }}>⚠ 24H2 — 部分老游戏需启用 DirectPlay + 兼容模式</span>}
            {winInfo.is_n_kn && <span style={{ color: "var(--status-danger)" }}>⚠ N/KN 版本 — 缺少 Media Feature Pack，请安装</span>}
          </div>
        </div>
      )}

      {vmInfo && (
        <div className="card">
          <h2 className="text-[14px] font-medium mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <div className="icon-wrap-sm" style={{ backgroundColor: "var(--brand-wind-10)", color: "var(--brand-wind)" }}>
              <HardDrive size={16} strokeWidth={2} />
            </div>
            虚拟内存诊断
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md ml-auto`}
              style={{
                backgroundColor: vmInfo.enabled ? "var(--status-success-10)" : "var(--status-danger-10)",
                color: vmInfo.enabled ? "var(--status-success)" : "var(--status-danger)",
              }}
            >
              {vmInfo.enabled ? "正常" : "异常"}
            </span>
          </h2>
          <p className="text-[11px] mb-2" style={{ color: "var(--status-warning)" }}>
            ⚠ 游戏闪退、报 "out of memory"、"虚拟内存不足"？来这里检查
          </p>
          {vmInfo.enabled ? (
            <div className="text-[12px] space-y-1" style={{ color: "var(--text-secondary)" }}>
              {vmInfo.is_system_managed ? <p>✓ 系统托管（由 Windows 自动管理大小）</p> : (
                <p>初始 {vmInfo.initial_size_mb} MB / 最大 {vmInfo.max_size_mb} MB</p>
              )}
              <p style={{ color: "var(--text-muted)" }}>虚拟内存不足会导致游戏/软件闪退、提示内存不足</p>
            </div>
          ) : (
            <div>
              <p className="text-[12px] mb-2" style={{ color: "var(--status-danger)" }}>
                ✗ 虚拟内存已被禁用！这会导致大型软件/游戏运行不稳定甚至闪退。
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                建议：设置 → 系统 → 关于 → 高级系统设置 → 性能 → 高级 → 虚拟内存 → 勾选"自动管理"
              </p>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <div className="icon-wrap-sm" style={{ backgroundColor: "var(--status-success-10)", color: "var(--status-success)" }}>
            <Shield size={16} strokeWidth={2} />
          </div>
          系统修复工具
        </h2>
        <p className="text-[12px] mb-2" style={{ color: "var(--text-muted)" }}>
          一键运行 Windows 系统文件检查工具。损坏的系统文件将从本地 WinSxS 缓存恢复。
        </p>
        <p className="text-[11px] mb-4" style={{ color: "var(--status-warning)" }}>
          ⚠ 遇到 "DLL 初始化失败 0xc0000142"、"0x800f0831 组件存储损坏"、"Windows Update 安装失败" 时先跑 DISM，再 SFC
        </p>
        <div className="flex flex-wrap gap-3 mb-3">
          <button onClick={handleSfc} disabled={sfcRunning} className="btn-primary !py-2 text-[12px]">
            {sfcRunning ? <><Loader2 size={12} className="animate-spin" /> SFC 运行中...</> : <>🔍 运行 SFC /Scannow</>}
          </button>
          <button onClick={handleDism} disabled={dismRunning} className="btn-primary !py-2 text-[12px]">
            {dismRunning ? <><Loader2 size={12} className="animate-spin" /> DISM 运行中...</> : <>💊 运行 DISM RestoreHealth</>}
          </button>
        </div>
        <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span>✓ SFC：扫描并修复受保护的系统文件</span>
          <span>✓ DISM：修复系统组件存储（CBS）</span>
        </div>
        {sfcResult && <RepairResultBox title="SFC /Scannow 结果" result={sfcResult} />}
        {dismResult && <RepairResultBox title="DISM RestoreHealth 结果" result={dismResult} />}
      </div>

      <div className="card">
        <h2 className="text-[14px] font-medium mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <div className="icon-wrap-sm" style={{ backgroundColor: "var(--brand-wind-10)", color: "var(--brand-wind)" }}>
            <Tag size={16} strokeWidth={2} />
          </div>
          API Sets / WinSxS 完整性
        </h2>
        <p className="text-[12px] mb-2" style={{ color: "var(--text-muted)" }}>
          API Sets 是 Windows 8+ 的虚拟 DLL 转发机制，损坏时程序虽能找到 api-ms-win-*.dll 但仍无法运行。DISM ScanHealth 比单纯文件存在检查更准确。
        </p>
        <p className="text-[11px] mb-3" style={{ color: "var(--status-warning)" }}>
          ⚠ 报了 "api-ms-win-crt-runtime-l1-1-0.dll 缺失"？文件明明存在但还报错？这是 API Sets 转发链断裂，点下面检测
        </p>
        <button onClick={handleWinsxs} disabled={winsxsRunning} className="btn-primary !py-1.5 text-[12px]">
          {winsxsRunning ? <><Loader2 size={12} className="animate-spin" /> 检测中...</> : <>🔍 检测 WinSxS 完整性</>}
        </button>
        {winsxsStatus && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-4 text-[12px]" style={{ color: "var(--text-secondary)" }}>
              <span>API Sets 文件: {winsxsStatus.api_set_found}/{winsxsStatus.api_set_count}</span>
              <span style={{ color: winsxsStatus.scan_result.success ? "var(--status-success)" : "var(--status-danger)" }}>
                WinSxS: {winsxsStatus.scan_result.success ? "健康" : "可能有损坏"}
              </span>
            </div>
            {!winsxsStatus.scan_result.success && (
              <p className="text-[11px]" style={{ color: "var(--status-warning)" }}>
                ⚠ WinSxS 检测到异常，建议运行 DISM RestoreHealth 修复
              </p>
            )}
            <pre className="text-[11px] whitespace-pre-wrap max-h-20 overflow-y-auto" style={{ color: "var(--text-muted)" }}>
              {winsxsStatus.scan_result.output}
            </pre>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[14px] font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <div className="icon-wrap-sm" style={{ backgroundColor: "var(--accent-ochre-10)", color: "var(--accent-ochre)" }}>
                <Cpu size={16} strokeWidth={2} />
              </div>
              系统 DLL 状态检查
            </h2>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
              共 {sysFiles.length} 个系统组件，其中 <span style={{ color: "var(--status-danger)" }}>{missingCount} 个未找到</span>（只检查文件是否存在，<strong style={{ color: "var(--status-success)" }}>不修改任何文件</strong>）
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--status-warning)" }}>
              ⚠ 报 "ole32.dll 无法注册"、"comctl32.dll 版本不符"、系统弹"找不到 xxx 入口点" — 这些文件缺失说明系统已损坏，建议跑 DISM + SFC
            </p>
          </div>
          <div
            className="flex gap-1 p-0.5 rounded-lg"
            style={{ backgroundColor: "var(--bg-input)" }}
          >
            {(["all", "missing", "found"] as const).map(k => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: filter === k ? "var(--brand-wind)" : "transparent",
                  color: filter === k ? "white" : "var(--text-secondary)",
                }}
              >
                {{ all: "全部", missing: "缺失", found: "存在" }[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 overflow-y-auto space-y-0.5">
          {loading ? (
            <p className="text-[12px] p-4 text-center" style={{ color: "var(--text-muted)" }}>扫描中...</p>
          ) : filtered.length === 0 ? (
            <p className="text-[12px] p-4 text-center" style={{ color: "var(--text-muted)" }}>没有匹配的条目</p>
          ) : (
            filtered.map(f => (
              <div
                key={f.name}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
              >
                <span
                  className="shrink-0 text-[12px]"
                  style={{ color: f.found ? "var(--status-success)" : "var(--status-danger)" }}
                >
                  {f.found ? "✓" : "✗"}
                </span>
                <code className="text-[11px] font-mono w-36 shrink-0" style={{ color: "var(--text-primary)" }}>{f.name}</code>
                <span className="text-[11px] flex-1 truncate" style={{ color: "var(--text-muted)" }}>{f.description}</span>
                {!f.found && (
                  <button
                    onClick={() => handleFileRepair(f)}
                    disabled={repairingFile === f.name}
                    className="text-[11px] px-2 py-0.5 rounded-md transition-colors shrink-0"
                    style={{
                      backgroundColor: "var(--status-danger-10)",
                      color: "var(--status-danger)",
                    }}
                  >
                    {repairingFile === f.name ? "修复中..." : "修复"}
                  </button>
                )}
              </div>
            ))
          )}
          {fileRepairResult && (
            <div
              className="mt-2 p-2 rounded-lg text-[11px]"
              style={{
                backgroundColor: fileRepairResult.result.success ? "var(--status-success-10)" : "var(--status-danger-10)",
                color: fileRepairResult.result.success ? "var(--status-success)" : "var(--status-danger)",
              }}
            >
              {fileRepairResult.result.success ? `✓ ${fileRepairResult.name} 修复成功` : `✗ ${fileRepairResult.name} 修复失败`}
              <pre className="text-[10px] mt-1 max-h-16 overflow-y-auto" style={{ color: "var(--text-muted)" }}>
                {fileRepairResult.result.output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToolsPage: React.FC = () => {
  const [tab, setTab] = useState<ToolTab>("dll");
  const [dllQuery, setDllQuery] = useState("");
  const [dllResult, setDllResult] = useState("");
  const [dllLoading, setDllLoading] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [errorCodeResult, setErrorCodeResult] = useState("");
  const [errorLoading, setErrorLoading] = useState(false);

  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [tagInputValue, setTagInputValue] = useState("");
  const [showTagInput, setShowTagInput] = useState<TagType | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const dllInputRef = useRef<HTMLInputElement>(null);
  const [dllShowDropdown, setDllShowDropdown] = useState(false);
  const [errorShowDropdown, setErrorShowDropdown] = useState(false);

  const doDllQuery = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setDllLoading(true); setDllResult("");
    try { setDllResult(await get_dll_owner(q.trim())); }
    catch (err) { setDllResult(`查询失败: ${err}`); }
    finally { setDllLoading(false); }
  }, []);

  const doErrorCodeQuery = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setErrorLoading(true); setErrorCodeResult("");
    try { setErrorCodeResult(await get_error_code_help(q.trim())); }
    catch (err) { setErrorCodeResult(`查询失败: ${err}`); }
    finally { setErrorLoading(false); }
  }, []);

  const addTag = useCallback((type: TagType, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setContextTags(prev => [...prev, { id: nextTagId(), type, label: trimmed }]);
    setTagInputValue("");
    setShowTagInput(null);
  }, []);

  const removeTag = useCallback((id: string) => {
    setContextTags(prev => prev.filter(t => t.id !== id));
  }, []);

  const fillFromTag = useCallback((tag: ContextTag) => {
    if (tag.type === "error") {
      setDllQuery(tag.label);
      setErrorCode(tag.label);
      if (tab === "dll") doDllQuery(tag.label);
      if (tab === "errorcode") doErrorCodeQuery(tag.label);
    }
  }, [tab, doDllQuery, doErrorCodeQuery]);

  const scanResults = useAppStore(s => s.scanResults);
  const systemStatus = useAppStore(s => s.systemStatus);
  const aiSite = useAppStore(s => s.aiSite);
  const installPage = useAppStore(s => s.installPage);
  const installProgress = useAppStore(s => s.installProgress);
  const startInstall = useAppStore(s => s.startInstall);
  const [diagnoseCopied, setDiagnoseCopied] = useState(false);

  const handleOneClickDiagnose = useCallback(async () => {
    const tags = contextTags;
    const scenario = tags.filter(t => t.type === "scenario").map(t => t.label).join("；");
    const errors = tags.filter(t => t.type === "error").map(t => t.label).join("、");
    const efforts = tags.filter(t => t.type === "effort").map(t => t.label).join("；");

    const lines: string[] = ["=== Winds Restore 诊断报告 ===", ""];
    if (scenario) lines.push(`## 场景\n${scenario}`, "");
    if (errors) lines.push(`## 报错\n${errors}`, "");
    if (efforts) lines.push(`## 已尝试的修复\n${efforts}`, "");

    if (systemStatus.gpu_driver) lines.push(`显卡驱动: ${systemStatus.gpu_driver.detail}`, "");
    if (systemStatus.memory_integrity) lines.push(`内存完整性: ${systemStatus.memory_integrity.detail}`, "");

    const missing = scanResults.filter(r => r.status === "missing");
    if (missing.length > 0) {
      lines.push("## 缺失的运行库", "");
      missing.forEach(r => lines.push(`- ${r.name}: ${r.details}`));
      lines.push("");
    }

    if (tags.length === 0 && missing.length === 0) {
      lines.push("（暂无数据，请先添加词块或运行扫描）");
    }
    lines.push("请在分析完成后给出分步解决方案，不要推荐第三方付费修复软件。");

    const report = lines.join("\n");
    try {
      await navigator.clipboard.writeText(report);
      setDiagnoseCopied(true);
      setTimeout(() => setDiagnoseCopied(false), 2000);
    } catch { /* */ }
    open_in_browser(AI_SITES[aiSite] || AI_SITES.DeepSeek);
  }, [contextTags, scanResults, systemStatus, aiSite]);

  useEffect(() => {
    if (!scanResults || scanResults.length === 0) return;
    setContextTags(prev => {
      const hasEffort = prev.some(t => t.type === "effort");
      if (hasEffort) return prev;
      const missing = scanResults.filter(r => r.status !== "installed").map(r => r.name);
      if (missing.length === 0) return [...prev, { id: nextTagId(), type: "effort" as TagType, label: "已扫描 — 所有运行库完整" }];
      return [...prev, { id: nextTagId(), type: "effort" as TagType, label: `已扫描 — ${missing.length} 个运行库缺失` }];
    });
  }, [scanResults]);

  useEffect(() => {
    if (installPage !== "done") return;
    const installedNames = installProgress
      .filter(item => item.status === "安装成功" || item.status === "已完成")
      .map(item => item.name)
      .filter(Boolean);
    if (installedNames.length === 0) return;
    setContextTags(prev => {
      const existingEfforts = new Set(prev.filter(t => t.type === "effort").map(t => t.label));
      const newTags = installedNames
        .filter(name => !existingEfforts.has(`已安装 — ${name}`))
        .map(name => ({ id: nextTagId(), type: "effort" as TagType, label: `已安装 — ${name}` }));
      if (newTags.length === 0) return prev;
      return [...prev, ...newTags];
    });
  }, [installPage, installProgress]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagInput]);

  const handleDllQuery = useCallback(async () => {
    if (!dllQuery.trim()) return;
    setDllShowDropdown(false);
    const q = dllQuery.trim();
    addTag("error", q);
    await doDllQuery(q);
  }, [dllQuery, doDllQuery, addTag]);

  const handleErrorCodeQuery = useCallback(async () => {
    if (!errorCode.trim()) return;
    setErrorShowDropdown(false);
    const q = errorCode.trim();
    addTag("error", q);
    await doErrorCodeQuery(q);
  }, [errorCode, doErrorCodeQuery, addTag]);

  const tabItems = [
    { key: "dll" as ToolTab, label: "DLL 查询", desc: "报 xxx.dll 找不到？查归属", icon: Search },
    { key: "errorcode" as ToolTab, label: "错误码查询", desc: "0xc000007b 看不懂？查含义", icon: AlertCircle },
    { key: "quickfix" as ToolTab, label: "快捷修复", desc: "一键复制修复命令", icon: Zap },
    { key: "game" as ToolTab, label: "游戏专区", desc: "游戏闪退？查平台/着色器", icon: Gamepad2 },
    { key: "thirdparty" as ToolTab, label: "第三方库", desc: "查开源/第三方 DLL", icon: Puzzle },
    { key: "system" as ToolTab, label: "系统文件", desc: "SFC / DISM / WinSxS", icon: Cpu },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 animate-wind-enter">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "var(--accent-ochre-10)",
              color: "var(--accent-ochre)",
            }}
          >
            <Wrench size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>工具箱</h1>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              选择你遇到的问题，快速找到解决方案
            </p>
          </div>
        </div>

        {/* Tab 导航 */}
        <div
          className="grid grid-cols-3 gap-2"
        >
          {tabItems.map(({ key, label, desc, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="p-3 rounded-xl text-[12px] font-medium transition-all text-left"
              style={{
                backgroundColor: tab === key ? "var(--bg-card)" : "var(--bg-surface)",
                color: tab === key ? "var(--text-primary)" : "var(--text-secondary)",
                border: `1px solid ${tab === key ? "var(--brand-wind-20)" : "var(--border-subtle)"}`,
                boxShadow: tab === key ? "var(--shadow-sm)" : "none",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: tab === key ? "var(--brand-wind-10)" : "var(--bg-input)",
                    color: tab === key ? "var(--brand-wind)" : "var(--text-muted)",
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                </div>
                <span>{label}</span>
              </div>
              <div
                className="text-[10px] font-normal leading-snug"
                style={{ color: tab === key ? "var(--text-muted)" : "var(--text-faint)" }}
              >
                {desc}
              </div>
            </button>
          ))}
        </div>

        {/* DLL 查询 */}
        {tab === "dll" && (
          <>
            <div className="card">
              <h2 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <div className="icon-wrap-sm"><Search size={16} strokeWidth={2} /></div>
                DLL 归属查询
              </h2>
              <p className="text-[12px] mb-2" style={{ color: "var(--text-secondary)" }}>
                输入 DLL 文件名，查询它属于哪个运行库或组件
              </p>
              <p className="text-[11px] mb-4" style={{ color: "var(--status-warning)" }}>
                ⚠ 常见的报错如 "计算机中丢失 MSVCP140.dll"、"找不到 VCRUNTIME140_1.dll"，通常安装对应 VC++ 运行库即可解决
              </p>

              <ContextTagBar
                tags={contextTags} tagInputValue={tagInputValue} showTagInput={showTagInput}
                tagInputRef={tagInputRef as React.RefObject<HTMLInputElement>}
                onAdd={addTag} onRemove={removeTag} onTagClick={fillFromTag}
                onSetTagInput={setTagInputValue} onSetShowTagInput={setShowTagInput}
              />

              <div className="flex gap-2 relative">
                <input
                  ref={dllInputRef}
                  type="text"
                  value={dllQuery}
                  onChange={e => { setDllQuery(e.target.value); setDllShowDropdown(true); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setDllShowDropdown(false); handleDllQuery(); }
                    if (e.key === "Escape") setDllShowDropdown(false);
                  }}
                  onFocus={() => setDllShowDropdown(true)}
                  placeholder="例如：vcruntime140.dll 或 mfc100u.dll"
                  className="input flex-1"
                  id="dll-query-input"
                  name="dllQuery"
                  autoComplete="off"
                />
                <button onClick={handleDllQuery} disabled={dllLoading} className="btn-primary">
                  {dllLoading ? <><Loader2 size={14} className="animate-spin" /> 查询中...</> : <>查询</>}
                </button>
                {dllShowDropdown && (
                  <SearchDropdown
                    query={dllQuery} index={getDllSearchIndex()}
                    onSelect={v => { setDllQuery(v); setDllShowDropdown(false); doDllQuery(v); }}
                    onClose={() => setDllShowDropdown(false)}
                  />
                )}
              </div>
              {dllResult && (
                <div
                  className="mt-4 p-4 rounded-2xl text-[12px] whitespace-pre-wrap"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {dllResult}
                </div>
              )}
              {dllResult && dllQuery && (
                <div className="mt-4">
                  {(() => {
                    const mapping = findRuntimeForDll(dllQuery);
                    const isInstalled = mapping
                      ? scanResults.some(r => r.id === mapping.runtimeId && r.status === "installed")
                      : false;

                    if (!mapping) return null;

                    return (
                      <div
                        className="p-4 rounded-2xl"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--brand-wind-20)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: "var(--brand-wind-10)",
                              color: "var(--brand-wind)",
                            }}
                          >
                            <Zap size={14} strokeWidth={2} />
                          </div>
                          <span
                            className="text-[13px] font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            关联运行库
                          </span>
                          {isInstalled && (
                            <span className="badge badge-success ml-auto">已安装</span>
                          )}
                        </div>
                        <p
                          className="text-[12px] mb-3"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          该 DLL 属于 <span style={{ color: "var(--brand-wind)", fontWeight: 500 }}>{mapping.runtimeName}</span>
                          ，安装运行库即可修复
                        </p>
                        {!isInstalled && (
                          <button
                            onClick={() => {
                              if (installPage === "installing") return;
                              startInstall([mapping.runtimeId]);
                            }}
                            disabled={installPage === "installing"}
                            className="btn-primary !py-2 !text-[12px] w-full"
                          >
                            <Download size={14} strokeWidth={2} />
                            <span>一键安装 {mapping.runtimeName}</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              {dllResult && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`DLL 查询: ${dllQuery}\n\n${dllResult}`);
                      open_in_browser(AI_SITES[useAppStore.getState().aiSite] || AI_SITES.DeepSeek);
                    }}
                    className="btn-secondary !py-2 text-[12px]"
                  >
                    <Sparkles size={14} strokeWidth={2} />
                    <span>AI 分析此 DLL</span>
                  </button>
                </div>
              )}
            </div>
            <div className="card">
              <h3 className="text-[14px] font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                📖 常见缺失 DLL 速查表
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                {QUICK_REF.map(([dll, owner]) => (
                  <div
                    key={dll}
                    className="flex justify-between p-2.5 rounded-lg"
                    style={{ backgroundColor: "var(--bg-input)" }}
                  >
                    <span className="font-mono text-[11px]" style={{ color: "var(--text-primary)" }}>{dll}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{owner}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 错误码查询 */}
        {tab === "errorcode" && (
          <>
            <div className="card">
              <h2 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <div className="icon-wrap-sm icon-wrap-danger"><XCircle size={16} strokeWidth={2} /></div>
                错误码查询
              </h2>
              <p className="text-[12px] mb-2" style={{ color: "var(--text-secondary)" }}>
                输入 Windows 错误码，获取中文说明和修复步骤<br />
                支持格式：<code style={{ color: "var(--brand-wind)" }}>0xc000007b</code>、<code style={{ color: "var(--brand-wind)" }}>126</code>、<code style={{ color: "var(--brand-wind)" }}>80070643</code>
              </p>
              <p className="text-[11px] mb-4" style={{ color: "var(--status-warning)" }}>
                ⚠ 游戏打不开最常见 0xc000007b（应用程序无法正常启动），往往不是游戏问题，是 VC++ 或 DirectX 缺失
              </p>

              <ContextTagBar
                tags={contextTags} tagInputValue={tagInputValue} showTagInput={showTagInput}
                tagInputRef={tagInputRef as React.RefObject<HTMLInputElement>}
                onAdd={addTag} onRemove={removeTag} onTagClick={fillFromTag}
                onSetTagInput={setTagInputValue} onSetShowTagInput={setShowTagInput}
              />

              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={errorCode}
                  onChange={e => { setErrorCode(e.target.value); setErrorShowDropdown(true); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setErrorShowDropdown(false); handleErrorCodeQuery(); }
                    if (e.key === "Escape") setErrorShowDropdown(false);
                  }}
                  onFocus={() => setErrorShowDropdown(true)}
                  placeholder="例如：0xc000007b"
                  className="input flex-1"
                  id="error-code-input"
                  name="errorCode"
                  autoComplete="off"
                />
                <button onClick={handleErrorCodeQuery} disabled={errorLoading} className="btn-primary">
                  {errorLoading ? <><Loader2 size={14} className="animate-spin" /> 查询中...</> : <>查询</>}
                </button>
                {errorShowDropdown && (
                  <SearchDropdown
                    query={errorCode} index={getErrorSearchIndex()}
                    onSelect={v => { setErrorCode(v); setErrorShowDropdown(false); doErrorCodeQuery(v); }}
                    onClose={() => setErrorShowDropdown(false)}
                  />
                )}
              </div>
              {errorCodeResult && (
                <div
                  className="mt-4 p-4 rounded-2xl text-[12px] whitespace-pre-wrap"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {errorCodeResult}
                </div>
              )}
              {errorCodeResult && errorCode && (
                <div className="mt-4">
                  {(() => {
                    const mapping = findRuntimesForErrorCode(errorCode);
                    if (!mapping) return null;

                    return (
                      <div
                        className="p-4 rounded-2xl"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--brand-wind-20)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: "var(--brand-wind-10)",
                              color: "var(--brand-wind)",
                            }}
                          >
                            <Zap size={14} strokeWidth={2} />
                          </div>
                          <span
                            className="text-[13px] font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            关联运行库
                          </span>
                        </div>
                        <p
                          className="text-[12px] mb-3"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {mapping.description}
                        </p>
                        <div className="space-y-2">
                          {mapping.runtimeIds.map((id, idx) => {
                            const name = mapping.runtimeNames[idx];
                            const isInstalled = scanResults.some(r => r.id === id && r.status === "installed");
                            return (
                              <div key={id} className="flex items-center gap-2">
                                <span
                                  className="text-[12px] flex-1"
                                  style={{ color: isInstalled ? "var(--text-muted)" : "var(--text-primary)" }}
                                >
                                  {name}
                                </span>
                                {isInstalled ? (
                                  <span className="badge badge-success">已安装</span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (installPage === "installing") return;
                                      startInstall([id]);
                                    }}
                                    disabled={installPage === "installing"}
                                    className="btn-primary !py-1.5 !px-3 !text-[11px]"
                                  >
                                    <Download size={12} strokeWidth={2} />
                                    <span>安装</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {errorCodeResult && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`错误码查询: ${errorCode}\n\n${errorCodeResult}`);
                      open_in_browser(AI_SITES[aiSite] || AI_SITES.DeepSeek);
                    }}
                    className="btn-secondary !py-2 text-[12px]"
                  >
                    <Sparkles size={14} strokeWidth={2} />
                    <span>AI 分析此错误码</span>
                  </button>
                </div>
              )}
            </div>
            <div className="card">
              <h3 className="text-[14px] font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                📋 已收录错误码
              </h3>
              <div className="space-y-1 text-[12px]">
                {ERROR_CODE_LIST.map(([code, desc, category]) => (
                  <div
                    key={code}
                    className="flex gap-3 p-2.5 rounded-lg"
                    style={{ backgroundColor: "var(--bg-input)" }}
                  >
                    <code className="text-[11px] w-28 shrink-0 font-mono" style={{ color: "var(--brand-wind)" }}>{code}</code>
                    <span className="text-[12px] w-32 shrink-0" style={{ color: "var(--text-primary)" }}>{desc}</span>
                    <span className="text-[11px] flex-1" style={{ color: "var(--text-muted)" }}>{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 快捷修复 */}
        {tab === "quickfix" && (
          <>
            <div className="card">
              <h2 className="text-[14px] font-medium mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <div className="icon-wrap-sm" style={{ backgroundColor: "var(--status-success-10)", color: "var(--status-success)" }}>
                  <Zap size={16} strokeWidth={2} />
                </div>
                快捷修复
              </h2>
              <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                以下命令需要以管理员身份运行。点击「复制」→ 右键 PowerShell → 粘贴执行。
              </p>
              <p className="text-[11px] mb-1" style={{ color: "var(--status-warning)" }}>
                ⚠ 如果你看到 "找不到 api-ms-win-crt-*.dll"、"0x800F0950"、"系统文件损坏" 等报错，下面有对应的修复命令
              </p>
            </div>
            <QuickFixCard
              title="0xc000007b 一键修复"
              desc="该错误最常见于游戏和设计软件启动时，通常是 VC++ 运行库 x86/x64 混装问题"
              actions={[
                { label: "复制修复命令", cmd: "DISM /Online /Cleanup-Image /RestoreHealth\nsfc /scannow" },
                { label: "搜索 0xc000007b 教程", url: "https://www.bing.com/search?q=0xc000007b+修复" },
              ]}
            />
            <QuickFixCard
              title="Windows Update 修复"
              desc="解决更新失败、更新卡住等问题"
              actions={[
                { label: "复制 WU 重置脚本", cmd: "net stop wuauserv\nnet stop cryptSvc\nnet stop bits\nnet stop msiserver\nren C:\\Windows\\SoftwareDistribution SoftwareDistribution.old\nren C:\\Windows\\System32\\catroot2 catroot2.old\nnet start wuauserv\nnet start cryptSvc\nnet start bits\nnet start msiserver" },
                { label: "Windows 更新疑难解答", url: "ms-settings:troubleshoot" },
              ]}
            />
            <QuickFixCard
              title=".NET Framework 3.5 离线安装"
              desc="解决 0x800F0950 / 0x800F0954 等错误"
              actions={[
                { label: "复制离线安装命令", cmd: "DISM /Online /Enable-Feature /FeatureName:NetFx3 /All /Source:D:\\sources\\sxs /LimitAccess" },
              ]}
            />
            <QuickFixCard
              title="系统文件完整性检查"
              desc="修复系统组件损坏、DLL 注册错误"
              actions={[
                { label: "复制 DISM + SFC", cmd: "DISM /Online /Cleanup-Image /RestoreHealth\nsfc /scannow" },
              ]}
            />
          </>
        )}

        {/* 游戏专区 */}
        {tab === "game" && (
          <>
            <div className="card">
              <h2 className="text-[14px] font-medium mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <div className="icon-wrap-sm" style={{ backgroundColor: "var(--status-success-10)", color: "var(--status-success)" }}>
                  <Gamepad2 size={16} strokeWidth={2} />
                </div>
                游戏组件检测
              </h2>
              <p className="text-[12px] mb-1" style={{ color: "var(--text-secondary)" }}>
                检测游戏平台的私有 DLL + 常见闪退原因（着色器缓存、虚拟内存）。这些文件不属于 Windows 系统，属于对应游戏平台或引擎。
              </p>
              <p className="text-[11px] mb-4" style={{ color: "var(--status-warning)" }}>
                ⚠ 常见报错：steam_api64.dll 缺失（Steam 验证）、UnityPlayer.dll 缺失（重装游戏）、着色器缓存过多导致新游戏闪退
              </p>
            </div>

            <ShaderCacheSection />

            <DllCheckSection title="Steamworks SDK" items={STEAM_DLLS} />
            <DllCheckSection title="Epic Online Services" items={EPIC_DLLS} />
            <DllCheckSection title="游戏引擎运行时" items={ENGINE_DLLS} />
            <DllCheckSection title="其他游戏平台" items={OTHER_PLATFORM_DLLS} />
          </>
        )}

        {/* 第三方库 */}
        {tab === "thirdparty" && (
          <>
            <div className="card">
              <h2 className="text-[14px] font-medium mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <div className="icon-wrap-sm" style={{ backgroundColor: "var(--brand-wind-10)", color: "var(--brand-wind)" }}>
                  <Puzzle size={16} strokeWidth={2} />
                </div>
                开源/第三方依赖库检测
              </h2>
              <p className="text-[12px] mb-1" style={{ color: "var(--text-secondary)" }}>
                检测常见开源依赖库是否存在。这些文件属于特定软件自带，不属于 Windows 系统。
              </p>
              <p className="text-[11px] mb-4" style={{ color: "var(--status-warning)" }}>
                ⚠ 常见报错：libeay32.dll 缺失（OpenSSL 旧版 → 重装 Git/证书工具）、zlib1.dll 缺失（压缩库 → 重装对应软件）
              </p>
            </div>
            <DllCheckSection title="加密/通信库" items={CRYPTO_DLLS} />
            <DllCheckSection title="网络/日志库" items={NETLOG_DLLS} />
            <DllCheckSection title="压缩/图片库" items={COMPRESS_DLLS} />
            <DllCheckSection title="Python 运行时" items={PYTHON_DLLS} />
            <DllCheckSection title="Qt 框架" items={QT_DLLS} />
            <DllCheckSection title="ICU / Unicode 库" items={ICU_DLLS} />
          </>
        )}

        {/* 系统文件 */}
        {tab === "system" && <SystemRepairSection />}

        {/* AI 诊断 */}
        <div
          className="card relative overflow-hidden border"
          style={{ borderColor: "var(--brand-wind-20)" }}
        >
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-5 pointer-events-none"
            style={{ background: "var(--gradient-wind)", filter: "blur(40px)" }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-[14px] font-medium mb-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Sparkles size={16} strokeWidth={2} style={{ color: "var(--accent-ochre)" }} />
                一键 AI 诊断
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                自动收集词块 + 扫描结果 + 系统状态，生成完整诊断报告并发送给 AI 助手
              </p>
            </div>
            <button onClick={handleOneClickDiagnose} className="btn-primary shrink-0 !py-2">
              {diagnoseCopied ? <><Check size={14} strokeWidth={2} /> 已复制</> : <><Copy size={14} strokeWidth={2} /> 生成报告并打开 AI</>}
            </button>
          </div>
        </div>

        {/* 使用提示 */}
        <div className="card">
          <h2 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Info size={16} strokeWidth={2} style={{ color: "var(--brand-wind)" }} />
            使用提示
          </h2>
          <ul className="text-[12px] space-y-2 list-disc list-inside" style={{ color: "var(--text-secondary)" }}>
            <li>DLL 查询支持模糊匹配，输入完整或部分文件名</li>
            <li>错误码支持十六进制（0x 开头）和纯数字格式</li>
            <li>游戏平台和第三方库 <strong style={{ color: "var(--status-danger)" }}>仅做识别</strong>，不提供下载。缺失时应重装对应软件</li>
            <li><strong style={{ color: "var(--status-warning)" }}>不要从网上下载单个 .dll 文件</strong>，这是恶意软件的常见传播方式</li>
            <li>快捷修复的命令需要以管理员身份运行</li>
            <li>注册表扫描仅读取安装状态，<strong style={{ color: "var(--status-success)" }}>不会修改任何注册表值</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
