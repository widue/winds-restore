import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Settings,
  Info,
  Shield,
  FileText,
  Monitor,
  Code,
  Scale,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Palette,
  Bell,
  Database,
  Lock,
  Sun,
  Moon,
  Type,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppStore } from "../store/appStore";

const SettingsPage: React.FC = () => {
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const fontSize = useAppStore(s => s.fontSize);
  const setFontSize = useAppStore(s => s.setFontSize);
  const notifications = useAppStore(s => s.notifications);
  const toggleNotification = useAppStore(s => s.toggleNotification);
  const setNotifications = useAppStore(s => s.setNotifications);

  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [showLegalDetail, setShowLegalDetail] = useState<string | null>(null);
  const legalItems = [
    { icon: FileText, label: "用户协议", desc: "使用条款与约束", color: "var(--brand-wind)" },
    { icon: Shield, label: "隐私政策", desc: "数据收集与保护", color: "var(--accent-ochre)" },
    { icon: AlertTriangle, label: "免责声明", desc: "责任范围说明", color: "var(--status-warning)" },
  ];

  const aboutItems = [
    { label: "版本", value: "v0.1.0", icon: Code, color: "var(--brand-wind)" },
    { label: "技术栈", value: "Tauri + React + TS", icon: Code, color: "var(--brand-wind)" },
    { label: "许可证", value: "MIT License", icon: Scale, color: "var(--accent-ochre)" },
    { label: "语言", value: "中文 (简体)", icon: Globe, color: "var(--status-success)" },
  ];

  const fontSizeLabel = { small: "小", medium: "中", large: "大" } as const;

  const settingItems = [
    { icon: Palette, label: "外观主题", desc: "深色 / 浅色模式", value: theme === "dark" ? "深色" : "浅色", color: "var(--brand-wind)", action: "theme" },
    { icon: Type, label: "字体大小", desc: "界面文字缩放", value: fontSizeLabel[fontSize], color: "var(--brand-wind)", action: "fontsize" },
    { icon: Bell, label: "通知提醒", desc: "扫描完成提示", value: "已开启", color: "var(--status-success)", action: "notification" },
    { icon: Database, label: "扫描缓存", desc: "本地缓存管理", value: "2.3 MB", color: "var(--accent-ochre)", action: "cache" },
    { icon: Lock, label: "隐私保护", desc: "数据安全设置", value: "已启用", color: "var(--status-success)", action: "privacy" },
  ];

  const handleSettingClick = (action: string) => {
    if (action === "theme") {
      toggleTheme();
    } else if (action === "fontsize") {
      const next = fontSize === "small" ? "medium" as const : fontSize === "medium" ? "large" as const : "small" as const;
      setFontSize(next);
    } else if (action === "notification") {
      setShowNotificationDetail(v => !v);
    }
  };

  const legalContents: Record<string, string> = {
    "用户协议": `风与修 用户协议

最后更新日期：2025年

欢迎使用风与修（Winds Restore）软件。本协议是您与本软件之间关于使用本软件服务所订立的协议。

第一条 服务内容
1.1 本软件提供Windows系统运行库检测、修复、安装等功能。
1.2 本软件仅提供技术工具，不构成任何形式的技术建议或保证。
1.3 本软件保留随时修改、中断或终止服务的权利。

第二条 使用规则
2.1 您应合法、合规地使用本软件，不得从事任何违法违规活动。
2.2 您不得对本软件进行反向工程、反编译、反汇编或其他形式的修改。
2.3 您不得利用本软件从事任何可能损害计算机系统安全的行为。

第三条 知识产权
3.1 本软件的所有权利、所有权和利益均归本软件所有。
3.2 本软件受著作权法、专利法及其他知识产权法律法规保护。

第四条 免责声明
4.1 本软件按"现状"和"可用"状态提供，不提供任何明示或暗示的保证。
4.2 本软件不对因使用或无法使用本软件而造成的任何直接或间接损失承担责任。
4.3 本软件不对第三方运行库安装包的安全性、完整性、可用性做任何保证。

第五条 协议修改
5.1 本软件有权随时修改本协议条款。
5.2 修改后的协议将在软件内公布，继续使用即视为接受修改后的协议。

第六条 其他
6.1 本协议的订立、执行、解释及争议解决均适用中华人民共和国法律。
6.2 如本协议中的任何条款无论因何种原因完全或部分无效或不具有执行力，本协议的其余条款仍然有效。`,

    "隐私政策": `风与修 隐私政策

最后更新日期：2025年

我们高度重视您的隐私保护。本隐私政策旨在说明我们如何收集、使用、存储和保护您的信息。

第一条 信息收集
1.1 本软件为纯本地工具，不会主动上传您的任何个人信息至云端。
1.2 本软件仅在您的本地设备上进行系统检测，所有检测数据均存储在本地。
1.3 本软件不收集、不存储、不上传您的个人身份信息。

第二条 信息使用
2.1 所有检测数据仅用于在您的设备上提供运行库检测和修复服务。
2.2 我们不会将您的任何信息出售、出租或分享给第三方。
2.3 我们不会将您的信息用于任何商业营销目的。

第三条 信息存储
3.1 扫描结果和设置偏好仅存储在您的本地设备上。
3.2 您可以随时清除软件数据和缓存。
3.3 卸载软件将删除所有本地存储的数据。

第四条 第三方服务
4.1 本软件可能包含指向第三方网站的链接，我们不对这些网站的隐私政策负责。
4.2 运行库安装包由微软等官方渠道提供，其使用受相应条款约束。

第五条 数据安全
5.1 我们采用行业标准的安全措施保护您的本地数据。
5.2 所有操作均在本地执行，不存在网络传输泄露风险。

第六条 政策更新
6.1 我们可能会不时更新本隐私政策。
6.2 更新后的政策将在软件内公布，继续使用即视为接受更新后的政策。`,

    "免责声明": `风与修 免责声明

1. 软件性质
风与修（Winds Restore）是一款免费的系统工具软件，旨在帮助用户检测和修复Windows运行库问题。本软件按"现状"提供，不对任何功能做保证。

2. 使用风险
您理解并同意，使用本软件的风险由您自行承担。在适用法律允许的最大范围内，我们不对因使用或无法使用本软件而造成的任何直接或间接损失承担责任。

3. 运行库安装
3.1 本软件提供的运行库安装功能仅作为便利工具，安装包来源于官方渠道。
3.2 我们不对运行库安装的成功率、兼容性做任何保证。
3.3 安装运行库前请确保您了解相应的许可协议。

4. 系统影响
4.1 本软件尽力避免对系统造成不良影响，但不对系统稳定性做任何保证。
4.2 建议在进行重要操作前备份您的重要数据。

5. 第三方内容
5.1 本软件可能包含第三方网站链接和资源，我们不对这些内容的准确性、合法性负责。
5.2 第三方服务的使用受其各自条款和政策约束。

6. 责任限制
在法律允许的最大范围内，我们的总赔偿责任不超过您为使用本软件而支付的费用（如有）。

7. 免责范围
本软件不适用于需要高可靠性的场景，包括但不限于医疗设备、航空航天、核设施等关键领域。`,
  };

  const handleLegalClick = (label: string) => {
    setShowLegalDetail(showLegalDetail === label ? null : label);
  };

  return (
    <div className="flex-1 overflow-auto p-6 animate-wind-enter">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "var(--brand-wind-10)",
              color: "var(--brand-wind)",
            }}
          >
            <Settings size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>设置</h1>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>偏好配置与应用信息</p>
          </div>
        </div>

        {/* 通用设置 */}
        <div className="card">
          <h2 className="text-[14px] font-medium mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <div className="icon-wrap-sm">
              <Palette size={16} strokeWidth={2} />
            </div>
            通用设置
          </h2>
          <div className="space-y-1">
            {settingItems.map((item, idx) => {
              const Icon = item.icon;
              const isTheme = item.action === "theme";
              const isFontSize = item.action === "fontsize";
              const isNotification = item.action === "notification";
              const iconColorClass = 
                item.color === "var(--brand-wind)" ? "" :
                item.color === "var(--accent-ochre)" ? "icon-wrap-ochre" :
                item.color === "var(--status-warning)" ? "icon-wrap-warning" : "";
              return (
                <div key={idx}>
                  <button
                    onClick={() => handleSettingClick(item.action || "")}
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-[var(--bg-hover)] group"
                    style={{ backgroundColor: idx % 2 === 0 ? "var(--bg-input)" : "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`icon-wrap-sm ${iconColorClass}`}
                        style={
                          iconColorClass
                            ? undefined
                            : { backgroundColor: `${item.color}15`, color: item.color }
                        }
                      >
                        <Icon size={16} strokeWidth={2} />
                      </div>
                      <div className="text-left">
                        <div className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.label}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTheme ? (
                        <div
                          className="w-12 h-7 rounded-full flex items-center px-1 transition-all"
                          style={{
                            backgroundColor: "var(--bg-active)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: "var(--brand-wind)",
                              color: "white",
                              transform: theme === "light" ? "translateX(20px)" : "translateX(0)",
                              boxShadow: "var(--shadow-wind)",
                            }}
                          >
                            {theme === "dark" ? <Moon size={11} strokeWidth={2} /> : <Sun size={11} strokeWidth={2} />}
                          </div>
                        </div>
                      ) : isFontSize ? (
                        <div className="flex items-center gap-1.5">
                          {(["small", "medium", "large"] as const).map((s) => (
                            <button
                              key={s}
                              id={`font-size-${s}`}
                              name="fontSize"
                              onClick={() => setFontSize(s)}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all"
                              style={{
                                backgroundColor: fontSize === s ? "var(--brand-wind)" : "var(--bg-input)",
                                color: fontSize === s ? "white" : "var(--text-secondary)",
                              }}
                            >
                              {fontSizeLabel[s]}
                            </button>
                          ))}
                        </div>
                      ) : isNotification ? (
                        showNotificationDetail ? (
                          <ChevronUp size={16} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
                        ) : (
                          <ChevronDown size={16} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
                        )
                      ) : (
                        <>
                          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{item.value}</span>
                          <span
                            className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "var(--text-muted)" }}
                          >
                            →
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                  {isNotification && (
                    <AnimatePresence initial={false}>
                      {showNotificationDetail && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                    <div
                      className="mt-2 ml-11 space-y-3 p-4 rounded-xl"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div className="space-y-3">
                        {[
                          { key: "scanComplete" as const, label: "扫描完成提醒", desc: "扫描结束时通知" },
                          { key: "installComplete" as const, label: "安装完成提醒", desc: "所有运行库安装完成时通知" },
                          { key: "errorOccurred" as const, label: "错误提醒", desc: "出现错误时通知" },
                          { key: "soundEnabled" as const, label: "提示音", desc: "通知时播放提示音" },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <div className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                                {item.label}
                              </div>
                              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                {item.desc}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleNotification(item.key)}
                              className="w-11 h-6 rounded-full flex items-center px-0.5 transition-all"
                              style={{
                                backgroundColor: notifications[item.key]
                                  ? "var(--status-success)"
                                  : "var(--bg-active)",
                                border: "1px solid var(--border-subtle)",
                              }}
                            >
                              <div
                                className="w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                                style={{
                                  transform: notifications[item.key]
                                    ? "translateX(18px)"
                                    : "translateX(0)",
                                }}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        <div className="text-[12px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                          通知频率
                        </div>
                        <div className="flex gap-2">
                          {(["always", "important", "never"] as const).map((freq) => (
                            <button
                              key={freq}
                              onClick={() => setNotifications({ frequency: freq })}
                              className="flex-1 py-2 rounded-lg text-[11px] font-medium transition-all"
                              style={{
                                backgroundColor:
                                  notifications.frequency === freq
                                    ? "var(--brand-wind-10)"
                                    : "var(--bg-input)",
                                color:
                                  notifications.frequency === freq
                                    ? "var(--brand-wind)"
                                    : "var(--text-secondary)",
                                border: `1px solid ${
                                  notifications.frequency === freq
                                    ? "var(--brand-wind-20)"
                                    : "var(--border-subtle)"
                                }`,
                              }}
                            >
                              {freq === "always" ? "全部通知" : freq === "important" ? "仅重要" : "不通知"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 法律信息 */}
        <div className="card">
          <h2 className="text-[14px] font-medium mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <div className="icon-wrap-sm icon-wrap-success">
              <Shield size={16} strokeWidth={2} />
            </div>
            法律信息
          </h2>
          <div className="space-y-1">
            {legalItems.map((item, idx) => {
              const Icon = item.icon;
              const isOpen = showLegalDetail === item.label;
              const iconColorClass = 
                item.color === "var(--brand-wind)" ? "" :
                item.color === "var(--accent-ochre)" ? "icon-wrap-ochre" :
                item.color === "var(--status-warning)" ? "icon-wrap-warning" : "";
              return (
                <div key={idx}>
                  <button
                    onClick={() => handleLegalClick(item.label)}
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-[var(--bg-hover)] group"
                    style={{ backgroundColor: idx % 2 === 0 ? "var(--bg-input)" : "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`icon-wrap-sm ${iconColorClass}`}
                        style={
                          iconColorClass
                            ? undefined
                            : { backgroundColor: `${item.color}15`, color: item.color }
                        }
                      >
                        <Icon size={16} strokeWidth={2} />
                      </div>
                      <div className="text-left">
                        <div className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.label}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={16} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
                    ) : (
                      <span
                        className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }}
                      >
                        查看 →
                      </span>
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div
                          className="mt-2 ml-11 p-4 rounded-xl max-h-80 overflow-y-auto"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <pre
                            className="text-[11px] whitespace-pre-wrap leading-relaxed"
                            style={{ color: "var(--text-secondary)", fontFamily: "inherit" }}
                          >
                            {legalContents[item.label]}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* 关于应用 */}
        <div className="card">
          <h2 className="text-[14px] font-medium mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <div className="icon-wrap-sm icon-wrap-ochre">
              <Info size={16} strokeWidth={2} />
            </div>
            关于应用
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {aboutItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} strokeWidth={2} style={{ color: item.color }} />
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  </div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 系统检测说明 */}
        <div
          className="card relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--bg-card) 0%, var(--status-success-10) 100%)",
          }}
        >
          <div
            className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-5 pointer-events-none"
            style={{ backgroundColor: "var(--status-success)", filter: "blur(32px)" }}
          />
          <div className="relative flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "var(--status-success-10)",
                color: "var(--status-success)",
                border: "1px solid var(--status-success-20)",
              }}
            >
              <Monitor size={22} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                纯本地检测
              </h3>
              <p className="text-[12px] mb-3" style={{ color: "var(--text-secondary)" }}>
                所有检测均在本地执行，不会上传任何数据到云端。我们尊重您的隐私。
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <CheckCircle2 size={12} strokeWidth={2} style={{ color: "var(--status-success)" }} />
                  <span>只读检测</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <CheckCircle2 size={12} strokeWidth={2} style={{ color: "var(--status-success)" }} />
                  <span>不修改系统</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <CheckCircle2 size={12} strokeWidth={2} style={{ color: "var(--status-success)" }} />
                  <span>无数据上传</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
