import React from "react";
import { useAppStore } from "../store/appStore";
import { Download, CheckCircle2, X } from "lucide-react";

const InstallPanel: React.FC = () => {
  const { installProgress, installOverall, installFinished, installPage, resetInstall } = useAppStore();

  if (installPage === "idle") return null;

  const activeItems = installProgress.filter(
    (i) => i.status !== "已完成" && !i.status.startsWith("失败")
  );

  return (
    <div className="fixed bottom-10 left-48 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div
          className="rounded-xl shadow-lg p-4 border"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`icon-wrap-sm ${installFinished ? "icon-wrap-success" : ""}`}
                style={
                  installFinished
                    ? undefined
                    : {
                        backgroundColor: "var(--brand-wind-10)",
                        color: "var(--brand-wind)",
                      }
                }
              >
                {installFinished ? (
                  <CheckCircle2 size={16} strokeWidth={2} />
                ) : (
                  <Download size={16} strokeWidth={2} />
                )}
              </div>
              <h3
                className="text-[14px] font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {installFinished ? "安装完成" : "正在安装运行库..."}
              </h3>
            </div>
            {installFinished && (
              <button
                onClick={resetInstall}
                className="text-[12px] px-2 py-1 rounded-md transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-auto">
            {installProgress.map((item) => {
              const isError = item.status.startsWith("失败");
              const isDone = item.status === "已完成";
              const isActive = !isDone && !isError;

              return (
                <div key={item.id} className="flex items-center gap-3 text-[12px]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: isDone
                        ? "var(--status-success)"
                        : isError
                        ? "var(--status-danger)"
                        : "var(--brand-wind)",
                      animation: isActive ? "pulse 2s infinite" : "none",
                    }}
                  />
                  <span
                    className="truncate flex-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <>
                      <div
                        className="w-24 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--bg-input)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(2, item.percent)}%`,
                            background: "var(--gradient-wind)",
                          }}
                        />
                      </div>
                      <span
                        className="w-12 text-right tabular-nums"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {Math.round(item.percent)}%
                      </span>
                      {item.speed && (
                        <span
                          className="w-20 text-right"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.speed}
                        </span>
                      )}
                    </>
                  )}
                  {isError && (
                    <span
                      className="w-24 text-right truncate"
                      style={{ color: "var(--status-danger)" }}
                    >
                      {item.status}
                    </span>
                  )}
                  {isDone && (
                    <span style={{ color: "var(--status-success)" }}>
                      已完成
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {activeItems.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span style={{ color: "var(--text-muted)" }}>总进度</span>
                <span
                  className="tabular-nums font-medium"
                  style={{ color: "var(--brand-wind)" }}
                >
                  {Math.round(installOverall)}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--bg-input)" }}
              >
                <div
                  className="h-full rounded-full transition-all relative overflow-hidden"
                  style={{
                    width: `${installOverall}%`,
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
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPanel;
