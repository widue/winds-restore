import React from "react";
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
    <footer className="h-8 bg-dark-panel border-t border-dark-border flex items-center justify-between px-4 text-xs text-dark-text-muted shrink-0">
      <div className="flex items-center gap-4">
        <span>
          支持运行库: {scanResults.length || "加载中..."}
        </span>
        {scanResults.length > 0 && (
          <>
            <span className="text-success-500">✓ 已安装 {installedCount}</span>
            <span className="text-error-500">✗ 缺失 {missingCount}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>内存: {memoryUsage.toFixed(1)} MB</span>
        <span>v0.1.0</span>
      </div>
    </footer>
  );
};

export default StatusBar;
