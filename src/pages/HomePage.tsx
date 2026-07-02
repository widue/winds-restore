import React from "react";
import { useAppStore } from "../store/appStore";

const HomePage: React.FC = () => {
  const { startScan, isScanning, scanResults } = useAppStore();

  const installedCount = scanResults.filter(
    (r) => r.status === "installed"
  ).length;
  const missingCount = scanResults.filter(
    (r) => r.status === "missing"
  ).length;
  const totalCount = scanResults.length || 20;
  const healthScore = totalCount > 0
    ? Math.round((installedCount / totalCount) * 100)
    : 100;

  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-dark-text mb-2">
            Winds Restore
          </h1>
          <p className="text-dark-text-secondary">
            Windows 运行库检测与修复工具
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-500">
              {scanResults.length || "--"}
            </div>
            <div className="text-xs text-dark-text-muted mt-1">
              运行库总数
            </div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-500">
              {installedCount || "--"}
            </div>
            <div className="text-xs text-dark-text-muted mt-1">
              已安装
            </div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-error-500">
              {missingCount || "--"}
            </div>
            <div className="text-xs text-dark-text-muted mt-1">
              待修复
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-dark-text-secondary">系统健康度</span>
            <span className={`text-sm font-bold ${
              healthScore >= 80 ? "text-success-500" :
              healthScore >= 50 ? "text-warning-500" : "text-error-500"
            }`}>
              {healthScore} 分
            </span>
          </div>
          <div className="h-2 bg-dark-card rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                healthScore >= 80 ? "bg-success-500" :
                healthScore >= 50 ? "bg-warning-500" : "bg-error-500"
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={startScan}
            disabled={isScanning}
            className="btn-primary text-lg px-8 py-3 h-12"
          >
            {isScanning ? "扫描中..." : "开始扫描"}
          </button>
        </div>

        <div className="card">
          <h3 className="font-medium text-dark-text mb-3">功能介绍</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              <span className="text-dark-text-secondary">VC++ 运行库检测</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              <span className="text-dark-text-secondary">.NET Framework 检测</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              <span className="text-dark-text-secondary">DLL 文件查询</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              <span className="text-dark-text-secondary">错误码查询</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
