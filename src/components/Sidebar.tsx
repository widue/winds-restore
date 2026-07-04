import React from "react";
import { Home, ClipboardList, Wrench, Settings, Zap } from "lucide-react";
import { useAppStore } from "../store/appStore";

type PageId = "home" | "scanning" | "results" | "tools" | "settings";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  hint: string;
  section: "main" | "tools" | "settings";
}

const navItems: NavItem[] = [
  { id: "home", label: "首页", icon: Home, hint: "健康概览 · 快速扫描", section: "main" },
  { id: "results", label: "扫描结果", icon: ClipboardList, hint: "运行库检测详情", section: "main" },
  { id: "tools", label: "工具箱", icon: Wrench, hint: "DLL查询 · 游戏修复", section: "tools" },
  { id: "settings", label: "设置", icon: Settings, hint: "偏好配置 · 关于", section: "settings" },
];

const sectionLabels: Record<string, string> = {
  main: "检测",
  tools: "工具",
  settings: "其他",
};

const Sidebar: React.FC = () => {
  const { page, setPage, scanResults, startScan } = useAppStore();

  const getActualPage = (): PageId => {
    if (page === "scanning") return "results";
    return page as PageId;
  };

  const actualPage = getActualPage();
  const hasResults = scanResults.length > 0;
  const missingCount = scanResults.filter((r) => r.status === "missing").length;

  const handleNavClick = (id: PageId) => {
    if (id === "results" && !hasResults) {
      startScan();
    } else {
      setPage(id);
    }
  };

  const sections = ["main", "tools", "settings"] as const;

  return (
    <aside
      className="w-[232px] flex flex-col shrink-0 border-r"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Logo 区域 */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{
              background: "var(--gradient-wind)",
              boxShadow: "0 2px 8px rgba(14, 165, 233, 0.3)",
            }}
          >
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
              <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
              <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
            </svg>
          </div>
          <div>
            <h1
              className="text-[15px] font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              风与修
            </h1>
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--text-muted)" }}>
              Winds Restore
            </p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section);
          if (items.length === 0) return null;

          return (
            <div key={section}>
              <div
                className="px-3 mb-2 text-[10px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-faint)" }}
              >
                {sectionLabels[section]}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = actualPage === item.id;
                  const showBadge = item.id === "results" && missingCount > 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={item.hint}
                      className="relative w-full flex items-center gap-3 px-3 h-10 rounded-lg transition-all duration-150 group"
                      style={{
                        backgroundColor: isActive ? "var(--brand-wind-10)" : "transparent",
                        color: isActive ? "var(--brand-wind)" : "var(--text-secondary)",
                      }}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                          style={{ backgroundColor: "var(--brand-wind)" }}
                        />
                      )}

                      <Icon
                        size={18}
                        strokeWidth={2}
                        className="shrink-0 transition-transform duration-150 group-hover:scale-105"
                      />
                      <div className="flex-1 text-left">
                        <span className="text-[13px] font-medium block leading-tight">
                          {item.label}
                        </span>
                        <span
                          className="text-[10px] block leading-tight mt-0.5"
                          style={{ color: isActive ? "var(--brand-wind)" : "var(--text-faint)" }}
                        >
                          {item.id === "results" && !hasResults ? "点击开始扫描" : item.hint}
                        </span>
                      </div>

                      {showBadge && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: "var(--status-danger)",
                            color: "white",
                          }}
                        >
                          {missingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* 快速扫描按钮 */}
      <div
        className="px-3 py-3 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <button
          onClick={() => startScan()}
          className="w-full btn-primary !py-2 !text-[12px]"
        >
          <Zap size={14} strokeWidth={2} />
          <span>快速扫描</span>
        </button>
      </div>

      {/* 底部版本信息 */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            v0.1.0
          </span>
          <span className="text-[11px]" style={{ color: "var(--brand-wind)" }}>
            风与修
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
