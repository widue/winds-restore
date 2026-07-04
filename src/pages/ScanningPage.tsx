import React from "react";
import { useAppStore } from "../store/appStore";
import { ScanSearch, XCircle, Loader2 } from "lucide-react";

const ScanningPage: React.FC = () => {
  const { scanProgress, scanStatus, cancelScan, isScanning } = useAppStore();

  return (
    <div className="flex-1 overflow-auto p-6 flex items-center justify-center animate-wind-enter">
      <div className="max-w-md w-full">
        <div className="card text-center relative overflow-hidden">
          {/* 装饰光晕 */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-5 pointer-events-none"
            style={{
              background: "var(--gradient-wind)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative">
            {/* 扫描动画图标 */}
            <div className="w-20 h-20 mx-auto mb-5 relative">
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  backgroundColor: "var(--brand-wind-10)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-14 h-14">
                  <div
                    className="absolute inset-0 border-4 rounded-full"
                    style={{ borderColor: "var(--border-default)" }}
                  />
                  <div
                    className="absolute inset-0 border-4 border-transparent rounded-full animate-spin"
                    style={{
                      borderTopColor: "var(--brand-wind)",
                      animationDuration: "1s",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanSearch
                      size={22}
                      strokeWidth={2}
                      style={{ color: "var(--brand-wind)" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <h2
              className="text-[18px] font-semibold mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              正在扫描系统...
            </h2>
            <p
              className="text-[13px] mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              {scanStatus || "正在检测运行库和系统组件"}
            </p>

            {/* 进度条 */}
            <div className="mb-5">
              <div className="flex justify-between text-[11px] mb-2">
                <span style={{ color: "var(--text-muted)" }}>扫描进度</span>
                <span
                  className="tabular-nums font-medium"
                  style={{ color: "var(--brand-wind)" }}
                >
                  {Math.round(scanProgress)}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden relative"
                style={{ backgroundColor: "var(--bg-input)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{
                    width: `${scanProgress}%`,
                    background: "var(--gradient-wind)",
                  }}
                >
                  <div
                    className="absolute inset-0 animate-shimmer"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 扫描提示 */}
            <div
              className="flex items-center justify-center gap-2 text-[11px] mb-5"
              style={{ color: "var(--text-faint)" }}
            >
              <Loader2 size={12} className="animate-spin" />
              <span>纯本地只读检测，不上传任何数据</span>
            </div>

            {/* 取消按钮 */}
            {isScanning && (
              <button
                onClick={cancelScan}
                className="btn-ghost text-[13px]"
              >
                <XCircle size={14} strokeWidth={2} />
                <span>取消扫描</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanningPage;
