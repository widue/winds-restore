import React from "react";
import { CheckCircle2, XCircle, HelpCircle, Download, Search } from "lucide-react";
import type { RuntimeStatus } from "../types";

interface RuntimeCardProps {
  id: string;
  name: string;
  status: RuntimeStatus;
  details: string;
  installerSizeMb?: number;
  category?: string;
  onSearch?: () => void;
  onInstall?: () => void;
}

const statusConfig: Record<
  RuntimeStatus,
  {
    icon: React.ElementType;
    iconClass: string;
    badgeClass: string;
    label: string;
    borderClass: string;
  }
> = {
  installed: {
    icon: CheckCircle2,
    iconClass: "icon-wrap-success",
    badgeClass: "badge-success",
    label: "已安装",
    borderClass: "",
  },
  missing: {
    icon: XCircle,
    iconClass: "icon-wrap-danger",
    badgeClass: "badge-error",
    label: "待修复",
    borderClass: "!border-[var(--status-danger-20)]",
  },
  not_found: {
    icon: HelpCircle,
    iconClass: "icon-wrap-warning",
    badgeClass: "badge-warning",
    label: "未检测到",
    borderClass: "",
  },
};

const RuntimeCard: React.FC<RuntimeCardProps> = ({
  name,
  status,
  details,
  installerSizeMb,
  category,
  onSearch,
  onInstall,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isMissing = status === "missing";

  return (
    <div
      className={`card card-hover animate-slide-up ${config.borderClass}`}
      style={{ animationDuration: "200ms" }}
    >
      <div className="flex items-start gap-4">
        {/* 图标容器 */}
        <div className={`icon-wrap ${config.iconClass}`}>
          <Icon size={20} strokeWidth={2} />
        </div>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className={`text-[14px] font-medium truncate ${
                  isMissing ? "" : ""
                }`}
                style={{ color: isMissing ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {name}
              </h3>
              {category && (
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-faint)" }}
                >
                  {category}
                </p>
              )}
            </div>
            <span className={`badge ${config.badgeClass} shrink-0`}>
              {config.label}
            </span>
          </div>

          <p
            className="text-[12px] mt-2 line-clamp-2"
            style={{ color: "var(--text-muted)" }}
          >
            {details}
          </p>

          {/* 操作按钮 */}
          {isMissing && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onInstall}
                className="btn-primary !py-1.5 !px-3 text-[12px]"
                title={installerSizeMb ? `安装包约 ${installerSizeMb} MB` : undefined}
              >
                <Download size={14} strokeWidth={2} />
                <span>修复</span>
              </button>
              {onSearch && (
                <button
                  onClick={onSearch}
                  className="btn-ghost !py-1.5 !px-3 text-[12px]"
                >
                  <Search size={14} strokeWidth={2} />
                  <span>搜索</span>
                </button>
              )}
              {installerSizeMb && (
                <span
                  className="text-[11px] ml-auto"
                  style={{ color: "var(--text-faint)" }}
                >
                  约 {installerSizeMb} MB
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RuntimeCard);
