import React from "react";
import { useAppStore } from "../store/appStore";

const InstallPanel: React.FC = () => {
  const { installProgress, installOverall, installFinished, installPage, resetInstall } = useAppStore();

  if (installPage === "idle") return null;

  const activeItems = installProgress.filter(
    (i) => i.status !== "已完成" && !i.status.startsWith("失败")
  );

  return (
    <div className="fixed bottom-10 left-48 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-dark-panel border border-dark-border rounded-lg shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-dark-text">
              {installFinished ? "安装完成" : "正在安装运行库..."}
            </h3>
            {installFinished && (
              <button onClick={resetInstall} className="btn-ghost text-xs h-7 px-2">
                关闭
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-auto">
            {installProgress.map((item) => {
              const isError = item.status.startsWith("失败");
              const isDone = item.status === "已完成";
              const isActive = !isDone && !isError;

              return (
                <div key={item.id} className="flex items-center gap-3 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isDone
                        ? "bg-success-500"
                        : isError
                        ? "bg-error-500"
                        : "bg-primary-500 animate-pulse"
                    }`}
                  />
                  <span className="text-dark-text-secondary truncate flex-1">
                    {item.name}
                  </span>
                  {isActive && (
                    <>
                      <div className="w-24 h-1.5 bg-dark-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${Math.max(2, item.percent)}%` }}
                        />
                      </div>
                      <span className="text-dark-text-muted w-12 text-right">
                        {Math.round(item.percent)}%
                      </span>
                      {item.speed && (
                        <span className="text-dark-text-muted w-20 text-right">
                          {item.speed}
                        </span>
                      )}
                    </>
                  )}
                  {isError && (
                    <span className="text-error-500 w-24 text-right truncate">
                      {item.status}
                    </span>
                  )}
                  {isDone && (
                    <span className="text-success-500">已完成</span>
                  )}
                </div>
              );
            })}
          </div>

          {activeItems.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-dark-text-muted mb-1">
                <span>总进度</span>
                <span>{Math.round(installOverall)}%</span>
              </div>
              <div className="h-1.5 bg-dark-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${installOverall}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPanel;
