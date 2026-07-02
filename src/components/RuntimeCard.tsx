import React from "react";
import type { RuntimeStatus } from "../types";

interface RuntimeCardProps {
  id: string;
  name: string;
  status: RuntimeStatus;
  details: string;
  installerSizeMb?: number;
  onSearch?: () => void;
  onInstall?: () => void;
}

const statusConfig: Record<RuntimeStatus, { icon: string; color: string; bg: string; label: string }> = {
  installed: {
    icon: "✓",
    color: "text-success-500",
    bg: "bg-success-500/10 border-success-500/30",
    label: "已安装",
  },
  missing: {
    icon: "✗",
    color: "text-error-500",
    bg: "bg-error-500/10 border-error-500/30",
    label: "未安装",
  },
  not_found: {
    icon: "?",
    color: "text-warning-500",
    bg: "bg-warning-500/10 border-warning-500/30",
    label: "未检测到",
  },
};

const RuntimeCard: React.FC<RuntimeCardProps> = ({
  name,
  status,
  details,
  installerSizeMb,
  onSearch,
  onInstall,
}) => {
  const config = statusConfig[status];
  const isMissing = status === "missing";

  return (
    <div
      className={`card card-hover border ${config.bg} animate-fade-in`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`text-lg ${config.color} shrink-0 mt-0.5`}>
            {config.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className={`font-medium text-sm ${
                isMissing ? "text-dark-text" : "text-dark-text-secondary"
              } truncate`}
            >
              {name}
            </h3>
            <p className="text-xs text-dark-text-muted mt-1 line-clamp-2">
              {details}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`badge ${isMissing ? "badge-error" : "badge-success"}`}>
            {config.label}
          </span>
          {isMissing && (
            <>
              <button
                onClick={onInstall}
                className="btn-primary text-xs h-7 px-2 !py-0"
                title={installerSizeMb ? `约 ${installerSizeMb} MB` : undefined}
              >
                安装
              </button>
              {onSearch && (
                <button
                  onClick={onSearch}
                  className="btn-ghost text-xs h-7 px-2 !py-0"
                >
                  搜索
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuntimeCard;
