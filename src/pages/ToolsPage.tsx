import React, { useState, useEffect, useCallback } from "react";
import { get_dll_owner, get_error_code_help, open_in_browser, scan_common_dlls } from "../api/tauri";
import type { DllScanResult } from "../types";

type ToolTab = "dll" | "errorcode" | "quickfix" | "game" | "thirdparty";

const QuickFixCard: React.FC<{
  title: string;
  desc: string;
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
      <h3 className="font-medium text-dark-text mb-2">{title}</h3>
      <p className="text-sm text-dark-text-secondary mb-3">{desc}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => {
              if (a.url) open_in_browser(a.url);
              if (a.cmd) handleCmd(a.cmd);
            }}
            className="btn-secondary text-xs"
          >
            {a.label}
          </button>
        ))}
      </div>
      {copyMsg && <p className="text-xs text-success-500 mt-2">{copyMsg}</p>}
    </div>
  );
};

const DllCheckSection: React.FC<{
  title: string;
  items: { dll: string; platform: string; guide: string; warning?: string }[];
}> = ({ title, items }) => {
  const [results, setResults] = useState<Record<string, DllScanResult>>({});
  const [loading, setLoading] = useState(false);

  const doScan = useCallback(async () => {
    setLoading(true);
    const names = items.map((i) => i.dll);
    try {
      const res = await scan_common_dlls(names);
      const map: Record<string, DllScanResult> = {};
      res.forEach((r) => { map[r.name.toLowerCase()] = r; });
      setResults(map);
    } catch { /* ignore */ }
    setLoading(false);
  }, [items]);

  useEffect(() => { doScan(); }, [doScan]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-dark-text">{title}</h3>
        <button onClick={doScan} disabled={loading} className="btn-secondary text-xs h-7">{loading ? "扫描中..." : "重新检测"}</button>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const r = results[item.dll.toLowerCase()];
          return (
            <div key={item.dll} className="flex items-start gap-3 p-2 bg-dark-card rounded">
              <span className={`text-lg ${r?.found ? "text-success-500" : "text-error-500"}`}>
                {loading ? "⋯" : r?.found ? "✓" : "✗"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-dark-text font-mono">{item.dll}</code>
                  <span className="text-xs text-dark-text-muted bg-dark-bg px-1.5 py-0.5 rounded">{item.platform}</span>
                </div>
                {r?.found && r.path && <p className="text-xs text-dark-text-muted mt-0.5 truncate">{r.path}</p>}
                {!r?.found && !loading && (
                  <div className="mt-1">
                    <p className="text-xs text-dark-text-secondary">{item.guide}</p>
                    {item.warning && (
                      <p className="text-xs text-warning-500 mt-0.5">⚠ {item.warning}</p>
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

const ToolsPage: React.FC = () => {
  const [tab, setTab] = useState<ToolTab>("dll");
  const [dllQuery, setDllQuery] = useState("");
  const [dllResult, setDllResult] = useState("");
  const [dllLoading, setDllLoading] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [errorCodeResult, setErrorCodeResult] = useState("");
  const [errorLoading, setErrorLoading] = useState(false);

  const handleDllQuery = async () => {
    if (!dllQuery.trim()) return;
    setDllLoading(true);
    setDllResult("");
    try {
      setDllResult(await get_dll_owner(dllQuery.trim()));
    } catch (err) {
      setDllResult(`查询失败: ${err}`);
    } finally {
      setDllLoading(false);
    }
  };

  const handleErrorCodeQuery = async () => {
    if (!errorCode.trim()) return;
    setErrorLoading(true);
    setErrorCodeResult("");
    try {
      setErrorCodeResult(await get_error_code_help(errorCode.trim()));
    } catch (err) {
      setErrorCodeResult(`查询失败: ${err}`);
    } finally {
      setErrorLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-dark-text">工具箱</h1>

        <div className="flex gap-1 bg-dark-card rounded-lg p-1 flex-wrap">
          {[
            { key: "dll" as ToolTab, label: "DLL 查询" },
            { key: "errorcode" as ToolTab, label: "错误码查询" },
            { key: "quickfix" as ToolTab, label: "快捷修复" },
            { key: "game" as ToolTab, label: "游戏专区" },
            { key: "thirdparty" as ToolTab, label: "第三方库" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${tab === t.key ? "bg-primary-600 text-white" : "text-dark-text-secondary hover:text-dark-text"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "dll" && (
          <>
            <div className="card">
              <h2 className="font-medium text-dark-text mb-3 flex items-center gap-2"><span>🔍</span> DLL 归属查询</h2>
              <p className="text-sm text-dark-text-muted mb-4">输入 DLL 文件名，查询它属于哪个运行库或组件</p>
              <div className="flex gap-2">
                <input type="text" value={dllQuery} onChange={(e) => setDllQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleDllQuery()} placeholder="例如：vcruntime140.dll 或 mfc100u.dll" className="input flex-1" />
                <button onClick={handleDllQuery} disabled={dllLoading} className="btn-primary">{dllLoading ? "查询中..." : "查询"}</button>
              </div>
              {dllResult && <div className="mt-4 p-3 bg-dark-card rounded-lg text-sm text-dark-text-secondary whitespace-pre-wrap">{dllResult}</div>}
            </div>
            <div className="card">
              <h3 className="font-medium text-dark-text mb-3">📖 常见缺失 DLL 速查表</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {[
                  ["MSVCP140.dll", "VC++ 2015-2022"],
                  ["VCRUNTIME140_1.dll", "VC++ 2015-2022"],
                  ["MFC100U.dll", "VC++ 2010"],
                  ["D3DCOMPILER_47.dll", "DirectX 着色器"],
                  ["XINPUT1_3.dll", "DirectX (老游戏)"],
                  ["MFPlat.DLL", "Windows Media"],
                  ["D3DX9_43.dll", "DirectX 9"],
                  ["OPENAL32.dll", "OpenAL 音频"],
                ].map(([dll, owner]) => (
                  <div key={dll} className="flex justify-between p-2 bg-dark-card rounded">
                    <span className="text-dark-text font-mono text-xs">{dll}</span>
                    <span className="text-dark-text-muted text-xs">{owner}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "errorcode" && (
          <>
            <div className="card">
              <h2 className="font-medium text-dark-text mb-3 flex items-center gap-2"><span>❌</span> 错误码查询</h2>
              <p className="text-sm text-dark-text-muted mb-4">
                输入 Windows 错误码，获取中文说明和修复步骤<br />
                支持格式：<code className="text-primary-400">0xc000007b</code>、<code className="text-primary-400">126</code>、<code className="text-primary-400">80070643</code>
              </p>
              <div className="flex gap-2">
                <input type="text" value={errorCode} onChange={(e) => setErrorCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleErrorCodeQuery()} placeholder="例如：0xc000007b" className="input flex-1" />
                <button onClick={handleErrorCodeQuery} disabled={errorLoading} className="btn-primary">{errorLoading ? "查询中..." : "查询"}</button>
              </div>
              {errorCodeResult && <div className="mt-4 p-3 bg-dark-card rounded-lg text-sm text-dark-text-secondary whitespace-pre-wrap">{errorCodeResult}</div>}
            </div>
            <div className="card">
              <h3 className="font-medium text-dark-text mb-3">📋 已收录错误码</h3>
              <div className="space-y-1 text-sm">
                {[
                  ["0xc000007b", "应用程序无法正常启动", "运行库/显卡驱动"],
                  ["0xc0000005", "访问违规", "内存/兼容性"],
                  ["0xc0000142", "DLL 初始化失败", "VC++/系统文件"],
                  ["80070643", "更新安装失败", "系统文件损坏"],
                  ["0x800f0831", "组件存储损坏", "CBS 存储"],
                  ["0x80190001", "更新网络错误", "代理/DNS"],
                  ["0x80070002", "文件未找到", ".NET 3.5/源文件"],
                  ["0x800F0950", ".NET 3.5 启用失败", "组策略"],
                  ["0x800F0954", ".NET 3.5 启用失败", "组策略/WSUS"],
                  ["80070642", "用户取消安装", "权限/超时"],
                  ["0x81f40001", "VC++ 安装失败", "版本冲突"],
                  ["0x80080005", "服务器运行失败", "Windows Installer"],
                  ["Error 1935", "程序集安装失败", "CBS/杀毒"],
                  ["0x0017", "初始化失败", "更新兼容性"],
                  ["126", "找不到模块", "DLL缺失"],
                ].map(([code, desc, category]) => (
                  <div key={code} className="flex gap-3 p-2 bg-dark-card rounded">
                    <code className="text-primary-400 text-xs w-28 shrink-0">{code}</code>
                    <span className="text-dark-text text-xs w-32 shrink-0">{desc}</span>
                    <span className="text-dark-text-muted text-xs">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "quickfix" && (
          <>
            <QuickFixCard title="0xc000007b 一键修复" desc="该错误最常见于游戏和设计软件启动时，通常是 VC++ 运行库 x86/x64 混装问题" actions={[
              { label: "📋 复制修复命令", cmd: "DISM /Online /Cleanup-Image /RestoreHealth\nsfc /scannow" },
              { label: "🌐 搜索 0xc000007b 教程", url: "https://www.bing.com/search?q=0xc000007b+修复" },
            ]} />
            <QuickFixCard title="Windows Update 修复" desc="解决更新失败、更新卡住等问题" actions={[
              { label: "📋 复制 WU 重置脚本", cmd: "net stop wuauserv\nnet stop cryptSvc\nnet stop bits\nnet stop msiserver\nren C:\\Windows\\SoftwareDistribution SoftwareDistribution.old\nren C:\\Windows\\System32\\catroot2 catroot2.old\nnet start wuauserv\nnet start cryptSvc\nnet start bits\nnet start msiserver" },
              { label: "🌐 Windows 更新疑难解答", url: "ms-settings:troubleshoot" },
            ]} />
            <QuickFixCard title=".NET Framework 3.5 离线安装" desc="解决 0x800F0950 / 0x800F0954 等错误" actions={[
              { label: "📋 复制离线安装命令", cmd: "DISM /Online /Enable-Feature /FeatureName:NetFx3 /All /Source:D:\\sources\\sxs /LimitAccess" },
            ]} />
            <QuickFixCard title="系统文件完整性检查" desc="修复系统组件损坏、DLL 注册错误" actions={[
              { label: "📋 复制 DISM + SFC", cmd: "DISM /Online /Cleanup-Image /RestoreHealth\nsfc /scannow" },
            ]} />
          </>
        )}

        {tab === "game" && (
          <>
            <div className="card">
              <h2 className="font-medium text-dark-text mb-2 flex items-center gap-2"><span>🎮</span> 游戏平台组件检测</h2>
              <p className="text-sm text-dark-text-muted mb-1">检测游戏平台/DRM 的私有 DLL 是否存在。这些文件不属于 Windows 系统，属于对应游戏平台。</p>
              <p className="text-xs text-warning-500 mb-4">⚠ 本工具仅做识别，不提供下载/分发。缺失时请通过游戏平台验证完整性。</p>
            </div>
            <DllCheckSection
              title="Steamworks SDK"
              items={[
                { dll: "steam_api.dll", platform: "Steam (32位)", guide: "请通过 Steam → 库 → 右键游戏 → 属性 → 已安装文件 → 验证游戏文件完整性", warning: "不要单独下载，可能被Steam判定为盗版" },
                { dll: "steam_api64.dll", platform: "Steam (64位)", guide: "请通过 Steam → 库 → 右键游戏 → 属性 → 已安装文件 → 验证游戏文件完整性", warning: "不要单独下载，可能被Steam判定为盗版" },
                { dll: "steamclient.dll", platform: "Steam 客户端", guide: "重新安装 Steam 客户端" },
              ]}
            />
            <DllCheckSection
              title="Epic Online Services"
              items={[
                { dll: "EOSSDK-Win64-Shipping.dll", platform: "Epic (64位)", guide: "请通过 Epic Games Launcher → 库 → 右键游戏 → 管理 → 验证" },
                { dll: "EOSSDK-Win32-Shipping.dll", platform: "Epic (32位)", guide: "请通过 Epic Games Launcher → 库 → 右键游戏 → 管理 → 验证" },
              ]}
            />
            <DllCheckSection
              title="其他游戏平台"
              items={[
                { dll: "XGamingRuntime.dll", platform: "Xbox GDK", guide: "通过微软商店 → 库 → 点击游戏 → 修复" },
                { dll: "Galaxy.dll", platform: "GOG Galaxy", guide: "通过 GOG Galaxy → 右键游戏 → 管理 → 验证 / 修复" },
                { dll: "UnityPlayer.dll", platform: "Unity 引擎", guide: "该 DLL 属于 Unity 游戏，请重新安装游戏" },
                { dll: "EMP.dll", platform: "第三方破解", guide: "该文件与游戏破解补丁相关，请重新安装游戏", warning: "⚠ 法律提醒：使用未授权破解软件可能违反著作权法" },
              ]}
            />
          </>
        )}

        {tab === "thirdparty" && (
          <>
            <div className="card">
              <h2 className="font-medium text-dark-text mb-2 flex items-center gap-2"><span>📦</span> 开源/第三方依赖库检测</h2>
              <p className="text-sm text-dark-text-muted mb-1">检测常见开源依赖库是否存在。这些文件属于特定软件自带，不属于 Windows 系统。</p>
              <p className="text-xs text-warning-500 mb-4">⚠ 本工具仅做识别。缺失时请重新安装依赖它们的软件，不要单独下载 DLL。</p>
            </div>
            <DllCheckSection
              title="加密/通信库"
              items={[
                { dll: "libssl-1_1.dll", platform: "OpenSSL 1.1", guide: "该文件属于依赖 OpenSSL 的软件（如 Git、Python、证书工具），请重新安装对应软件" },
                { dll: "libcrypto-1_1.dll", platform: "OpenSSL 1.1", guide: "该文件属于依赖 OpenSSL 的软件，请重新安装对应软件" },
                { dll: "libeay32.dll", platform: "OpenSSL 旧版", guide: "旧版 OpenSSL，属于特定软件，请重装" },
                { dll: "ssleay32.dll", platform: "OpenSSL 旧版", guide: "旧版 OpenSSL，属于特定软件，请重装" },
              ]}
            />
            <DllCheckSection
              title="网络/日志库"
              items={[
                { dll: "libcurl.dll", platform: "libcurl", guide: "该文件属于依赖 cURL 的软件（如 PHP、wget），请重新安装对应软件" },
                { dll: "log4cpp.dll", platform: "Apache log4cpp", guide: "该文件属于依赖 log4cpp 的 C++ 软件，请重新安装对应软件" },
              ]}
            />
            <DllCheckSection
              title="压缩/其他库"
              items={[
                { dll: "zlib1.dll", platform: "zlib", guide: "该文件属于依赖 zlib 的软件（如游戏、压缩工具），请重新安装对应软件" },
                { dll: "zlib.dll", platform: "zlib", guide: "该文件属于依赖 zlib 的软件，请重新安装对应软件" },
                { dll: "libpng.dll", platform: "libpng", guide: "该文件属于依赖 libpng 的软件，请重新安装对应软件" },
                { dll: "libjpeg.dll", platform: "libjpeg", guide: "该文件属于依赖 libjpeg 的软件，请重新安装对应软件" },
              ]}
            />
          </>
        )}

        <div className="card">
          <h2 className="font-medium text-dark-text mb-3 flex items-center gap-2"><span>💡</span> 使用提示</h2>
          <ul className="text-sm text-dark-text-secondary space-y-2 list-disc list-inside">
            <li>DLL 查询支持模糊匹配，输入完整或部分文件名</li>
            <li>错误码支持十六进制（0x 开头）和纯数字格式</li>
            <li>游戏平台和第三方库 <strong className="text-error-500">仅做识别</strong>，不提供下载。缺失时应重装对应软件</li>
            <li><strong className="text-warning-500">不要从网上下载单个 .dll 文件</strong>，这是恶意软件的常见传播方式</li>
            <li>快捷修复的命令需要以管理员身份运行</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
