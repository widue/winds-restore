import React from "react";
import { useAppStore } from "../store/appStore";

const navItems = [
  { id: "home", label: "首页", icon: "🏠" },
  { id: "results", label: "扫描结果", icon: "📋" },
  { id: "tools", label: "工具箱", icon: "🧰" },
  { id: "settings", label: "设置", icon: "⚙️" },
] as const;

const Sidebar: React.FC = () => {
  const { page, setPage } = useAppStore();

  return (
    <aside className="w-48 bg-dark-panel border-r border-dark-border flex flex-col shrink-0">
      <div className="p-4 border-b border-dark-border">
        <h1 className="text-lg font-bold text-primary-500 text-center">
          Winds Restore
        </h1>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              page === item.id
                ? "bg-primary-600/20 text-primary-400 font-medium"
                : "text-dark-text-secondary hover:bg-dark-card hover:text-dark-text"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-dark-border">
        <div className="text-xs text-dark-text-muted">
          版本 v0.1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
