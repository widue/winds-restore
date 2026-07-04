import React, { useMemo, useState, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAppStore } from "../store/appStore";
import RuntimeCard from "../components/RuntimeCard";
import { open_in_browser } from "../api/tauri";
import {
  ClipboardList,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Monitor,
  Shield,
  Search,
  Sparkles,
  Copy,
  Check,
  Zap,
  Wrench,
  Wand2,
} from "lucide-react";

type FilterType = "all" | "missing" | "installed";

const AI_SITES: Record<string, string> = {
  DeepSeek: "https://chat.deepseek.com/",
  豆包: "https://www.doubao.com/chat/",
  Kimi: "https://kimi.moonshot.cn/",
  ChatGPT: "https://chatgpt.com/",
};

function buildDiagnosticReport(
  scanResults: Array<{ id: string; name: string; status: string; details: string }>,
  systemStatus: { memory_integrity: { status: string; detail: string } | null; gpu_driver: { status: string; detail: string } | null }
): string {
  const lines: string[] = [];
  lines.push("=== Winds Restore 系统诊断报告 ===");
  lines.push("");

  if (systemStatus.gpu_driver) {
    lines.push(`显卡驱动: ${systemStatus.gpu_driver.detail}`);
    lines.push("");
  }
  if (systemStatus.memory_integrity) {
    lines.push(`内存完整性: ${systemStatus.memory_integrity.detail}`);
    lines.push("");
  }

  lines.push("【运行库扫描结果】");
  for (const r of scanResults) {
    const icon = r.status === "installed" ? "[OK]" : r.status === "missing" ? "[MISSING]" : "[UNKNOWN]";
    lines.push(`  ${icon} ${r.name}`);
  }
  lines.push("");
  lines.push("请在分析完成后给出分步解决方案，不要推荐第三方付费修复软件。");
  return lines.join("\n");
}

const ResultsPage: React.FC = () => {
  const {
    scanResults, resetScan, installPage, startInstall,
    systemStatus, searchEngine, aiSite, setSearchEngine, setAiSite,
  } = useAppStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    scanResults.forEach((r) => { if (r.category) cats.add(r.category); });
    return ["all", ...Array.from(cats)];
  }, [scanResults]);

  const filteredResults = useMemo(() => {
    return scanResults.filter((r) => {
      const matchesFilter = filter === "all" ? true : filter === "missing" ? r.status === "missing" : r.status === "installed";
      const matchesCategory = categoryFilter === "all" ? true : r.category === categoryFilter;
      return matchesFilter && matchesCategory;
    });
  }, [scanResults, filter, categoryFilter]);

  const missingCount = useMemo(
    () => scanResults.filter((r) => r.status === "missing").length,
    [scanResults]
  );
  const installedCount = useMemo(
    () => scanResults.filter((r) => r.status === "installed").length,
    [scanResults]
  );
  const notFoundCount = useMemo(
    () => scanResults.filter((r) => r.status === "not_found").length,
    [scanResults]
  );

  const searchUrl = useCallback((name: string) => {
    const q = encodeURIComponent(`${name} 官方下载`);
    return searchEngine === "bing"
      ? `https://www.bing.com/search?q=${q}`
      : `https://www.baidu.com/s?wd=${q}`;
  }, [searchEngine]);

  const handleSearch = async (name: string) => {
    try {
      await open_in_browser(searchUrl(name));
    } catch { /* ignore */ }
  };

  const handleInstall = (id: string) => {
    if (installPage === "installing") return;
    startInstall([id]);
  };

  const handleOneClickFix = () => {
    if (installPage === "installing") return;
    const missingIds = scanResults
      .filter((r) => r.status === "missing")
      .map((r) => r.id);
    if (missingIds.length === 0) return;
    startInstall(missingIds);
  };

  const scrollParentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredResults.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 150,
    overscan: 8,
  });

  const handleAiReport = async () => {
    const report = buildDiagnosticReport(scanResults, systemStatus);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch { /* ignore */ }
    const url = AI_SITES[aiSite];
    if (url) {
      try { await open_in_browser(url); } catch { /* ignore */ }
    }
  };

  if (scanResults.length === 0) {
    return (
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center animate-wind-enter">
        <div className="max-w-md w-full">
          <div className="card text-center relative overflow-hidden">
            {/* 装饰光晕 */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-5 pointer-events-none"
              style={{
                background: "var(--gradient-wind)",
                filter: "blur(40px)",
              }}
            />

            <div className="relative">
              <div
                className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "var(--brand-wind-10)",
                  color: "var(--brand-wind)",
                }}
              >
                <ClipboardList size={36} strokeWidth={1.5} />
              </div>
              <h2
                className="text-[18px] font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                还没有扫描结果
              </h2>
              <p
                className="text-[13px] mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                运行扫描来检测系统中的运行库和组件状态
              </p>

              <div className="space-y-2 mb-6">
                <button onClick={resetScan} className="btn-primary w-full !py-2.5">
                  <Zap size={16} strokeWidth={2} />
                  <span>开始快速扫描</span>
                </button>
                <button
                  onClick={() => useAppStore.getState().setPage("tools")}
                  className="btn-secondary w-full !py-2.5"
                >
                  <Wrench size={16} strokeWidth={2} />
                  <span>前往工具箱</span>
                </button>
              </div>

              <div
                className="text-[11px] space-y-1 text-left p-3 rounded-lg"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-muted)",
                }}
              >
                <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  💡 扫描能检测什么？
                </p>
                <p>• VC++ 2005~2022 全版本运行库</p>
                <p>• .NET Framework / .NET 运行时</p>
                <p>• DirectX 系列组件</p>
                <p>• 系统 DLL 文件完整性</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 animate-wind-enter">
      <div className="max-w-4xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                 background: "linear-gradient(135deg, var(--brand-wind-10) 0%, rgba(14, 165, 233, 0.06) 100%)",
                 color: "var(--brand-wind)",
               }}
             >
               <ClipboardList size={20} strokeWidth={2} />
            </div>
            <div>
              <h1
                className="text-[20px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                扫描结果
              </h1>
              <p
                className="text-[12px]"
                style={{ color: "var(--text-muted)" }}
              >
                共 {scanResults.length} 项检测结果
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {missingCount > 0 && (
              <button
                onClick={handleOneClickFix}
                disabled={installPage === "installing"}
                className="btn-primary !py-2 !text-[13px] animate-wind-pulse"
              >
                <Wand2 size={15} strokeWidth={2} />
                <span>一键修复 ({missingCount})</span>
              </button>
            )}
            <button onClick={resetScan} className="btn-secondary !py-2 !text-[13px]">
              <RotateCcw size={14} strokeWidth={2} />
              <span>重新扫描</span>
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card !p-4">
            <div className="flex items-center gap-3">
              <div className="icon-wrap-sm icon-wrap-success">
                <CheckCircle2 size={16} strokeWidth={2} />
              </div>
              <div>
                <div
                  className="text-stat !text-[20px]"
                  style={{ color: "var(--status-success)" }}
                >
                  {installedCount || "--"}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  已正常
                </div>
              </div>
            </div>
          </div>

          <div className="card !p-4">
            <div className="flex items-center gap-3">
              <div className="icon-wrap-sm icon-wrap-danger">
                <XCircle size={16} strokeWidth={2} />
              </div>
              <div>
                <div
                  className="text-stat !text-[20px]"
                  style={{ color: "var(--status-danger)" }}
                >
                  {missingCount || "--"}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  待修复
                </div>
              </div>
            </div>
          </div>

          <div className="card !p-4">
            <div className="flex items-center gap-3">
              <div className="icon-wrap-sm icon-wrap-warning">
                <Search size={16} strokeWidth={2} />
              </div>
              <div>
                <div
                  className="text-stat !text-[20px]"
                  style={{ color: "var(--status-warning)" }}
                >
                  {notFoundCount || "--"}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  未检测
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 系统状态卡片 */}
        {(systemStatus.gpu_driver || systemStatus.memory_integrity) && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {systemStatus.gpu_driver && (
              <div className="card !p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="icon-wrap-sm"
                    style={{
                      backgroundColor: systemStatus.gpu_driver.status === "installed"
                        ? "var(--status-success-10)"
                        : "var(--status-danger-10)",
                      color: systemStatus.gpu_driver.status === "installed"
                        ? "var(--status-success)"
                        : "var(--status-danger)",
                    }}
                  >
                    <Monitor size={16} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      显卡驱动
                    </div>
                    <p
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {systemStatus.gpu_driver.detail}
                    </p>
                  </div>
                  <span
                    className={`badge ${systemStatus.gpu_driver.status === "installed" ? "badge-success" : "badge-error"}`}
                  >
                    {systemStatus.gpu_driver.status === "installed" ? "正常" : "异常"}
                  </span>
                </div>
              </div>
            )}
            {systemStatus.memory_integrity && (
              <div className="card !p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="icon-wrap-sm"
                    style={{
                      backgroundColor:
                        systemStatus.memory_integrity.status === "installed" ||
                        systemStatus.memory_integrity.detail.includes("已关闭")
                          ? "var(--status-success-10)"
                          : "var(--status-warning-10)",
                      color:
                        systemStatus.memory_integrity.status === "installed" ||
                        systemStatus.memory_integrity.detail.includes("已关闭")
                          ? "var(--status-success)"
                          : "var(--status-warning)",
                    }}
                  >
                    <Shield size={16} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      内存完整性
                    </div>
                    <p
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {systemStatus.memory_integrity.detail}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      systemStatus.memory_integrity.status === "installed" ||
                      systemStatus.memory_integrity.detail.includes("已关闭")
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                  >
                    {systemStatus.memory_integrity.status === "installed" ||
                    systemStatus.memory_integrity.detail.includes("已关闭")
                      ? "正常"
                      : "注意"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 筛选栏 */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <div
            className="flex gap-1 p-1 rounded-xl shrink-0"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            {([
              { key: "all" as FilterType, label: "全部" },
              { key: "missing" as FilterType, label: "待修复" },
              { key: "installed" as FilterType, label: "已安装" },
            ]).map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className="px-3 py-1.5 text-[12px] font-medium transition-all"
                style={{
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: filter === item.key ? "var(--brand-wind)" : "transparent",
                  color: filter === item.key ? "white" : "var(--text-secondary)",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-[12px] h-8 w-auto shrink-0"
              style={{
                padding: "0 12px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "全部分类" : cat}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <select
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value as "bing" | "baidu")}
              className="text-[12px] h-8"
              style={{
                padding: "0 12px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                cursor: "pointer",
                minWidth: "100px",
              }}
            >
              <option value="bing">Bing 搜索</option>
              <option value="baidu">百度搜索</option>
            </select>
          </div>
        </div>

        {/* 结果列表 */}
        <div ref={scrollParentRef} className="scroll-container" style={{ minHeight: 300 }}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const result = filteredResults[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  className="list-item"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <RuntimeCard
                    id={result.id}
                    name={result.name}
                    status={result.status}
                    details={result.details}
                    installerSizeMb={result.installer_size_mb}
                    category={result.category}
                    onSearch={result.status === "missing" ? () => handleSearch(result.name) : undefined}
                    onInstall={result.status === "missing" ? () => handleInstall(result.id) : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {filteredResults.length === 0 && (
          <div
            className="text-center py-12 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            没有符合条件的结果
          </div>
        )}

        {/* AI 助手卡片 */}
        <div className="card mt-6 relative overflow-hidden">
          {/* 装饰 */}
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-5 pointer-events-none"
            style={{
              background: "var(--gradient-wind)",
              filter: "blur(40px)",
            }}
          />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="icon-wrap-sm icon-wrap-ochre">
                <Sparkles size={16} strokeWidth={2} />
              </div>
              <h3
                className="text-[14px] font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                AI 助手
              </h3>
            </div>
            <p
              className="text-[12px] mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              将诊断报告复制到 AI 对话框，获取个性化修复方案
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[12px]"
                style={{ color: "var(--text-muted)" }}
              >
                选择 AI：
              </span>
              <select
                value={aiSite}
                onChange={(e) => setAiSite(e.target.value as typeof aiSite)}
                className="text-[12px] flex-1"
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                {Object.keys(AI_SITES).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAiReport}
              className="btn-primary w-full !py-2.5"
            >
              {copied ? (
                <>
                  <Check size={16} strokeWidth={2} />
                  <span>已复制诊断报告</span>
                </>
              ) : (
                <>
                  <Copy size={16} strokeWidth={2} />
                  <span>复制诊断报告并打开 {aiSite}</span>
                </>
              )}
            </button>
            {copied && (
              <p
                className="text-[11px] mt-2 text-center"
                style={{ color: "var(--status-success)" }}
              >
                ✓ 诊断报告已复制到剪贴板，请粘贴到 AI 输入框
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
