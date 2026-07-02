import React from "react";
import { useAppStore } from "../store/appStore";

const ScanningPage: React.FC = () => {
  const { scanProgress, scanStatus, cancelScan, isScanning } = useAppStore();

  return (
    <div className="flex-1 overflow-auto p-6 flex items-center justify-center animate-fade-in">
      <div className="max-w-md w-full">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-dark-card rounded-full" />
            <div
              className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"
              style={{ animationDuration: "1s" }}
            />
          </div>

          <h2 className="text-xl font-bold text-dark-text mb-2">
            正在扫描系统...
          </h2>
          <p className="text-sm text-dark-text-secondary mb-6">
            {scanStatus}
          </p>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-dark-text-muted mb-2">
              <span>扫描进度</span>
              <span>{Math.round(scanProgress)}%</span>
            </div>
            <div className="h-2 bg-dark-card rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>

          {isScanning && (
            <button
              onClick={cancelScan}
              className="btn-secondary text-sm mt-4"
            >
              取消扫描
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanningPage;
