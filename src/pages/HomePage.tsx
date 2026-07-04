import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAppStore } from "../store/appStore";
import { get_manifest_summary } from "../api/tauri";
import {
  Zap,
  ScanSearch,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Binary,
  Puzzle,
  Shield,
  Sparkles,
  Gamepad2,
  AlertCircle,
  Settings,
  ChevronRight,
} from "lucide-react";

const HomePage: React.FC = () => {
  const { startScan, setScanMode, isScanning, scanResults, scanMode } =
    useAppStore();
  const [summary, setSummary] = useState({ runtime_count: 0, dll_count: 0 });
  const mountedRef = useRef(true);

  useEffect(() => {
    get_manifest_summary().then((s) => {
      if (mountedRef.current) setSummary(s);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const installedCount = useMemo(
    () => scanResults.filter((r) => r.status === "installed").length,
    [scanResults]
  );
  const missingCount = useMemo(
    () => scanResults.filter((r) => r.status === "missing").length,
    [scanResults]
  );
  const notFoundCount = useMemo(
    () => scanResults.filter((r) => r.status === "not_found").length,
    [scanResults]
  );
  const totalCount = scanResults.length || 20;
  const healthScore =
    totalCount > 0 ? Math.round((installedCount / totalCount) * 100) : 100;

  const handleScan = (mode: "quick" | "full") => {
    setScanMode(mode);
    startScan();
  };

  const getScoreColor = () => {
    if (healthScore >= 85) return "var(--status-success)";
    if (healthScore >= 60) return "var(--status-warning)";
    return "var(--status-danger)";
  };

  const quickEntries = [
    {
      icon: Binary,
      label: "DLL 查询",
      desc: "查归属、找来源",
      action: () => useAppStore.getState().setPage("tools"),
      color: "var(--brand-wind)",
    },
    {
      icon: Shield,
      label: "错误码",
      desc: "0xc000007b 等",
      action: () => useAppStore.getState().setPage("tools"),
      color: "var(--accent-ochre)",
    },
    {
      icon: Gamepad2,
      label: "游戏专区",
      desc: "Steam / Epic",
      action: () => useAppStore.getState().setPage("tools"),
      color: "var(--status-success)",
    },
    {
      icon: Puzzle,
      label: "第三方库",
      desc: "OpenSSL / zlib",
      action: () => useAppStore.getState().setPage("tools"),
      color: "var(--brand-wind)",
    },
  ];

  const scenarioCards = [
    {
      icon: AlertCircle,
      title: "缺少 DLL 文件",
      desc: "弹窗提示找不到 xxx.dll？",
      action: () => {
        useAppStore.getState().setPage("tools");
      },
      color: "var(--status-danger)",
      hint: "立即查询",
    },
    {
      icon: Gamepad2,
      title: "游戏闪退",
      desc: "游戏打不开或闪退？",
      action: () => {
        useAppStore.getState().setPage("tools");
      },
      color: "var(--status-success)",
      hint: "游戏专区",
    },
    {
      icon: Zap,
      title: "错误代码",
      desc: "0xc000007b 等看不懂？",
      action: () => {
        useAppStore.getState().setPage("tools");
      },
      color: "var(--accent-ochre)",
      hint: "查错误码",
    },
    {
      icon: Settings,
      title: "系统文件损坏",
      desc: "系统异常、程序无法启动？",
      action: () => {
        useAppStore.getState().setPage("tools");
      },
      color: "var(--brand-wind)",
      hint: "系统修复",
    },
  ];

  const features = [
    "VC++ 2005~2022 全版本检测",
    ".NET Framework / .NET 8 运行库",
    "DirectX 9/11/12 + XInput 系列",
    "DLL 归属查询 + 错误码百科",
    "系统组件完整性检查",
    "显卡驱动 / 内存完整性检测",
  ];

  return (
    <div className="flex-1 overflow-auto p-6 animate-wind-enter">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Hero 区域 */}
        <div
          className="card relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card) 50%, var(--brand-wind-10) 100%)",
          }}
        >
          {/* 装饰性光晕 */}
          <div
            className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-5 pointer-events-none"
            style={{ background: "var(--gradient-wind)", filter: "blur(40px)" }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex-1">
                <div
                  className="flex items-center gap-2 mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--brand-wind-10)",
                      color: "var(--brand-wind)",
                    }}
                  >
                    <Sparkles size={14} strokeWidth={2} />
                  </div>
                  <span className="text-[12px] font-medium">系统健康度评估</span>
                </div>
                <h1
                  className="text-[28px] font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  风与修
                </h1>
                <p
                  className="text-[13px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Windows 运行库检测与修复工具
                </p>
              </div>

              {/* 健康度圆环 */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${getScoreColor()}20 0%, transparent 70%)`,
                  }}
                />
                <svg className="w-24 h-24 -rotate-90 relative z-10">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="var(--border-default)"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={getScoreColor()}
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${healthScore * 2.512} 251.2`}
                    style={{
                      transition: "stroke-dasharray 0.8s ease, stroke 0.3s ease",
                      filter: `drop-shadow(0 0 8px ${getScoreColor()}60)`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <span
                    className="text-[28px] font-bold leading-none tabular-nums"
                    style={{
                      color: getScoreColor(),
                      textShadow: `0 0 20px ${getScoreColor()}40`,
                    }}
                  >
                    {healthScore}
                  </span>
                  <span
                    className="text-[11px] mt-0.5 font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    健康分
                  </span>
                </div>
              </div>
            </div>

            {/* 扫描按钮 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleScan("quick")}
                disabled={isScanning}
                className="btn-primary flex-1 !py-2.5 !text-[14px] animate-wind-pulse"
              >
                <Zap size={16} strokeWidth={2} />
                <span>
                  {isScanning && scanMode === "quick"
                    ? "扫描中..."
                    : "快速扫描"}
                </span>
              </button>
              <button
                onClick={() => handleScan("full")}
                disabled={isScanning}
                className="btn-secondary flex-1 !py-2.5 !text-[14px]"
              >
                <ScanSearch size={16} strokeWidth={2} />
                <span>
                  {isScanning && scanMode === "full"
                    ? "扫描中..."
                    : "全面扫描"}
                </span>
              </button>
            </div>
            <p
              className="text-[11px] text-center mt-2"
              style={{ color: "var(--text-faint)" }}
            >
              纯本地只读检测，不上传任何数据 · 约需 10-30 秒
            </p>
          </div>
        </div>

        {/* 场景引导 - 我遇到了什么问题 */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-[15px] font-semibold flex items-center gap-2.5"
              style={{ color: "var(--text-primary)" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--accent-ochre-10) 0%, rgba(217, 119, 6, 0.06) 100%)",
                  color: "var(--accent-ochre)",
                }}
              >
                <HelpCircle size={16} strokeWidth={2} />
              </div>
              我遇到了什么问题？
            </h3>
            <span
              className="text-[12px]"
              style={{ color: "var(--text-muted)" }}
            >
              点击直达对应工具
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {scenarioCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <button
                  key={idx}
                  onClick={card.action}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-200 group hover:scale-[1.02] relative overflow-hidden"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--brand-wind-20)";
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${card.color}15`,
                      color: card.color,
                      borderRadius: "var(--radius-lg)",

                    }}
                  >
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="text-[14px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {card.title}
                      </span>
                      <ChevronRight
                        size={14}
                        strokeWidth={2}
                        className="opacity-0 group-hover:opacity-100 transition-all -ml-1 group-hover:translate-x-0"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                    <p
                      className="text-[12px] mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {card.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card !p-5 text-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                   background: "linear-gradient(135deg, var(--status-success-10) 0%, rgba(16, 185, 129, 0.06) 100%)",
                   color: "var(--status-success)",
                 }}
               >
                 <CheckCircle2 size={18} strokeWidth={2} />
               </div>
               <div
                 className="text-stat !text-[22px] !leading-none"
                 style={{
                   color: "var(--status-success)",
                   textShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                 }}
               >
                 {installedCount || "--"}
               </div>
               <div
                 className="text-[12px] font-medium"
                 style={{ color: "var(--text-secondary)" }}
               >
                 已安装
               </div>
             </div>
           </div>

           <div className="card !p-5 text-center">
             <div className="flex flex-col items-center gap-2">
               <div
                 className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{
                   background: "linear-gradient(135deg, var(--status-danger-10) 0%, rgba(239, 68, 68, 0.06) 100%)",
                   color: "var(--status-danger)",
                 }}
               >
                 <XCircle size={18} strokeWidth={2} />
               </div>
               <div
                 className="text-stat !text-[22px] !leading-none"
                 style={{
                   color: "var(--status-danger)",
                   textShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
                 }}
               >
                 {missingCount || "--"}
               </div>
               <div
                 className="text-[12px] font-medium"
                 style={{ color: "var(--text-secondary)" }}
               >
                 待修复
               </div>
             </div>
           </div>

           <div className="card !p-5 text-center">
             <div className="flex flex-col items-center gap-2">
               <div
                 className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{
                   background: "linear-gradient(135deg, var(--status-warning-10) 0%, rgba(245, 158, 11, 0.06) 100%)",
                   color: "var(--status-warning)",
                }}
              >
                <HelpCircle size={18} strokeWidth={2} />
              </div>
              <div
                className="text-stat !text-[22px] !leading-none"
                style={{
                  color: "var(--status-warning)",
                  textShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
                }}
              >
                {notFoundCount || "--"}
              </div>
              <div
                className="text-[12px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                未检测
              </div>
            </div>
          </div>
        </div>

        {/* 覆盖统计 */}
        {(summary.runtime_count > 0 || summary.dll_count > 0) && (
          <div className="card">
            <h3
              className="text-[14px] font-medium mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              检测覆盖范围
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div
                  className="text-stat !text-[22px]"
                  style={{ color: "var(--brand-wind)" }}
                >
                  {summary.runtime_count || "--"}
                </div>
                <div
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  运行库组件
                </div>
              </div>
              <div
                className="text-center border-x"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div
                  className="text-stat !text-[22px]"
                  style={{ color: "var(--brand-wind)" }}
                >
                  {summary.dll_count || "--"}
                </div>
                <div
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  DLL 文件
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-stat !text-[22px]"
                  style={{ color: "var(--brand-wind)" }}
                >
                  37+
                </div>
                <div
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  API Sets
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 快捷入口 */}
        <div className="card">
          <h3
            className="text-[14px] font-medium mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            工具箱
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {quickEntries.map((entry, idx) => {
              const Icon = entry.icon;
              return (
                <button
                  key={idx}
                  onClick={entry.action}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--brand-wind-20)";
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${entry.color}15`,
                      color: entry.color,
                    }}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {entry.label}
                  </span>
                  <span
                    className="text-[10px] -mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {entry.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 功能列表 */}
        <div className="card">
          <h3
            className="text-[14px] font-medium mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            能解决的问题
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 py-1.5"
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "var(--brand-wind-10)",
                    color: "var(--brand-wind)",
                  }}
                >
                  <CheckCircle2 size={10} strokeWidth={3} />
                </div>
                <span
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
