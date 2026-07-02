import React, { useMemo, useState, useCallback } from "react";
import { useAppStore } from "../store/appStore";
import RuntimeCard from "../components/RuntimeCard";
import { open_in_browser } from "../api/tauri";

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

  const missingCount = scanResults.filter((r) => r.status === "missing").length;
  const installedCount = scanResults.filter((r) => r.status === "installed").length;

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
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-dark-text mb-2">暂无扫描结果</h2>
          <p className="text-dark-text-secondary mb-4">点击首页的"开始扫描"按钮开始检测</p>
          <button onClick={resetScan} className="btn-primary">返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-dark-text">扫描结果</h1>
          <button onClick={resetScan} className="btn-secondary text-sm">重新扫描</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-2xl font-bold text-dark-text">{scanResults.length}</div>
            <div className="text-xs text-dark-text-muted mt-1">总数</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-error-500">{missingCount}</div>
            <div className="text-xs text-dark-text-muted mt-1">待修复</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-success-500">{installedCount}</div>
            <div className="text-xs text-dark-text-muted mt-1">已正常</div>
          </div>
        </div>

        {(systemStatus.gpu_driver || systemStatus.memory_integrity) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {systemStatus.gpu_driver && (
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <span className={systemStatus.gpu_driver.status === "installed" ? "text-success-500" : "text-error-500"}>
                    {systemStatus.gpu_driver.status === "installed" ? "✓" : "✗"}
                  </span>
                  <span className="text-sm font-medium text-dark-text">显卡驱动</span>
                </div>
                <p className="text-xs text-dark-text-secondary">{systemStatus.gpu_driver.detail}</p>
              </div>
            )}
            {systemStatus.memory_integrity && (
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <span className={
                    systemStatus.memory_integrity.status === "installed"
                      ? "text-success-500"
                      : systemStatus.memory_integrity.detail.includes("已关闭")
                        ? "text-success-500"
                        : "text-warning-500"
                  }>
                    {systemStatus.memory_integrity.status === "installed" ? "✓" : "⚠"}
                  </span>
                  <span className="text-sm font-medium text-dark-text">内存完整性</span>
                </div>
                <p className="text-xs text-dark-text-secondary">{systemStatus.memory_integrity.detail}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex gap-1 bg-dark-card rounded-lg p-1">
            {([{ key: "all" as FilterType, label: "全部" }, { key: "missing" as FilterType, label: "待修复" }, { key: "installed" as FilterType, label: "已安装" }]).map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  filter === item.key
                    ? "bg-primary-600 text-white"
                    : "text-dark-text-secondary hover:text-dark-text"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input text-sm h-9 w-auto"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === "all" ? "全部分类" : cat}</option>
              ))}
            </select>
          )}

          <select
            value={searchEngine}
            onChange={(e) => setSearchEngine(e.target.value as "bing" | "baidu")}
            className="input text-sm h-9 w-auto ml-auto"
          >
            <option value="bing">Bing 搜索</option>
            <option value="baidu">百度搜索</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredResults.map((result, index) => (
            <div key={result.id} style={{ animationDelay: `${index * 20}ms` }}>
              <RuntimeCard
                id={result.id}
                name={result.name}
                status={result.status}
                details={result.details}
                installerSizeMb={result.installer_size_mb}
                onSearch={result.status === "missing" ? () => handleSearch(result.name) : undefined}
                onInstall={result.status === "missing" ? () => handleInstall(result.id) : undefined}
              />
            </div>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12 text-dark-text-muted">没有符合条件的结果</div>
        )}

        <div className="card mt-6">
          <h3 className="font-medium text-dark-text mb-3">AI 助手</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-dark-text-secondary">选择 AI：</span>
            <select
              value={aiSite}
              onChange={(e) => setAiSite(e.target.value as typeof aiSite)}
              className="input text-sm h-8 w-auto"
            >
              {Object.keys(AI_SITES).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAiReport}
            className="btn-primary text-sm w-full"
          >
            复制诊断报告并打开 {aiSite}
          </button>
          {copied && (
            <p className="text-xs text-success-500 mt-2">✓ 诊断报告已复制到剪贴板，请粘贴到 AI 输入框</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
