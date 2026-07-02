import React, { useEffect, useState, useRef } from "react";
import { useAppStore } from "../store/appStore";
import { get_manifest_summary } from "../api/tauri";

const HomePage: React.FC = () => {
  const { startScan, setScanMode, isScanning, scanResults, scanMode } = useAppStore();
  const [summary, setSummary] = useState({ runtime_count: 0, dll_count: 0 });
  const mountedRef = useRef(true);

  useEffect(() => {
    get_manifest_summary().then(s => { if (mountedRef.current) setSummary(s); });
    return () => { mountedRef.current = false; };
  }, []);

  const installedCount = scanResults.filter((r) => r.status === "installed").length;
  const missingCount = scanResults.filter((r) => r.status === "missing").length;
  const totalCount = scanResults.length || 20;
  const healthScore = totalCount > 0 ? Math.round((installedCount / totalCount) * 100) : 100;

  const handleScan = (mode: "quick" | "full") => {
    setScanMode(mode);
    startScan();
  };

  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-dark-text mb-2">Winds Restore</h1>
          <p className="text-dark-text-secondary">Windows 运行库检测与修复工具</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-500">{scanResults.length || "--"}</div>
            <div className="text-xs text-dark-text-muted mt-1">运行库总数</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-500">{installedCount || "--"}</div>
            <div className="text-xs text-dark-text-muted mt-1">已安装</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-error-500">{missingCount || "--"}</div>
            <div className="text-xs text-dark-text-muted mt-1">待修复</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-dark-text-secondary">系统健康度</span>
            <span className={`text-sm font-bold ${healthScore >= 80 ? "text-success-500" : healthScore >= 50 ? "text-warning-500" : "text-error-500"}`}>
              {healthScore} 分
            </span>
          </div>
          <div className="h-2 bg-dark-card rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${healthScore >= 80 ? "bg-success-500" : healthScore >= 50 ? "bg-warning-500" : "bg-error-500"}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* 覆盖统计 */}
        {(summary.runtime_count > 0 || summary.dll_count > 0) && (
          <div className="card text-center">
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <span className="text-primary-500 font-bold text-lg">{summary.runtime_count}</span>
                <span className="text-dark-text-muted ml-1">可检测运行库</span>
              </div>
              <div className="w-px bg-dark-border" />
              <div>
                <span className="text-primary-500 font-bold text-lg">{summary.dll_count}</span>
                <span className="text-dark-text-muted ml-1">收录 DLL</span>
              </div>
              <div className="w-px bg-dark-border" />
              <div>
                <span className="text-primary-500 font-bold text-lg">37+</span>
                <span className="text-dark-text-muted ml-1">API Sets</span>
              </div>
            </div>
            <p className="text-xs text-dark-text-muted mt-2">数据来自本地清单，检测纯只读，不联网不下载</p>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-4">
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleScan("quick")}
              disabled={isScanning}
              className="btn-primary text-lg px-6 py-3 h-12"
            >
              {isScanning && scanMode === "quick" ? "扫描中..." : "⚡ 快速扫描"}
            </button>
            <span className="text-xs text-dark-text-muted mt-1 whitespace-nowrap">软件打不开？报 0xc000007b？点我排查</span>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleScan("full")}
              disabled={isScanning}
              className="btn-secondary text-lg px-6 py-3 h-12"
            >
              {isScanning && scanMode === "full" ? "扫描中..." : "🔍 全面扫描"}
            </button>
            <span className="text-xs text-dark-text-muted mt-1 whitespace-nowrap">游戏闪退？报错 DLL 缺失？深度检测 + 显卡诊断</span>
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium text-dark-text mb-3">能解决的常见问题</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-primary-500 shrink-0">✓</span>
              <div><span className="text-dark-text-secondary">VC++ 运行库检测</span><p className="text-xs text-dark-text-muted">0xc000007b / "无法启动程序，因为计算机中丢失 MSVCP140.dll"</p></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 shrink-0">✓</span>
              <div><span className="text-dark-text-secondary">.NET Framework 检测</span><p className="text-xs text-dark-text-muted">错误码 0x800F0950 / ".NET Framework 初始化错误"</p></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 shrink-0">✓</span>
              <div><span className="text-dark-text-secondary">DirectX / 游戏组件</span><p className="text-xs text-dark-text-muted">d3dx9_43.dll 缺失 / xinput1_3.dll 找不到 / 游戏闪退</p></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 shrink-0">✓</span>
              <div><span className="text-dark-text-secondary">DLL 归属查询 + 错误码百科</span><p className="text-xs text-dark-text-muted">看到报错代码不慌，输入一查秒懂原因</p></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 shrink-0">✓</span>
              <div><span className="text-dark-text-secondary">系统组件检查 + 修复</span><p className="text-xs text-dark-text-muted">SFC / DISM / WinSxS 完整性 / 虚拟内存 / 着色器缓存</p></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 shrink-0">✓</span>
              <div><span className="text-dark-text-secondary">显卡驱动 / 内存完整性检测</span><p className="text-xs text-dark-text-muted">仅 Microsoft Basic Display Adapter？内存完整性开启导致闪退？</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
