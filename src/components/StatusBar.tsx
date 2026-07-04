import React from "react";
import { Cpu, CheckCircle2, XCircle, Database } from "lucide-react";
import { useAppStore } from "../store/appStore";

const StatusBar: React.FC = () => {
  const { memoryUsage, scanResults } = useAppStore();

  const installedCount = scanResults.filter(
    (r) => r.status === "installed"
  ).length;
  const missingCount = scanResults.filter(
    (r) => r.status === "missing"
  ).length;

  return (
    <footer
      className="h-8 flex items-center justify-between px-4 text-[11px] shrink-0 border-t"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-muted)",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Database size={12} strokeWidth={2} />
          <span>
            {scanResults.length > 0 ? `${scanResults.length} 个运行库` : "加载中..."}
          </span>
        </div>
        {scanResults.length > 0 && (
          <>
            <div
              className="flex items-center gap-1"
              style={{ color: "var(--status-success)" }}
            >
              <CheckCircle2 size={12} strokeWidth={2} />
              <span>已安装 {installedCount}</span>
            </div>
            <div
              className="flex items-center gap-1"
              style={{ color: "var(--status-danger)" }}
            >
              <XCircle size={12} strokeWidth={2} />
              <span>待修复 {missingCount}</span>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 tabular-nums">
          <Cpu size={12} strokeWidth={2} />
          <span>{memoryUsage.toFixed(1)} MB</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
