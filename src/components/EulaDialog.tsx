import React, { useState } from "react";

const EULA_KEY = "winds_eula_accepted";

interface EulaDialogProps {
  onAccept: () => void;
}

const EulaDialog: React.FC<EulaDialogProps> = ({ onAccept }) => {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (!agreed) return;
    localStorage.setItem(EULA_KEY, "true");
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
        <div className="p-6 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>用户协议</h2>
        </div>
        <div className="p-6 overflow-y-auto text-sm space-y-3 flex-1" style={{ color: "var(--text-secondary)" }}>
          <p><strong style={{ color: "var(--text-primary)" }}>Winds Restore</strong> 是免费开源软件（MIT License），用于检测 Windows 运行库安装状态。</p>

          <p><strong style={{ color: "var(--text-primary)" }}>使用条款</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>本软件仅检测运行库安装状态，<strong style={{ color: "var(--text-primary)" }}>不提供/下载任何 DLL 文件</strong>。</li>
            <li>缺失的运行库引导用户从微软等官方渠道下载安装。</li>
            <li>禁止利用本软件规避任何软件的数字版权管理（DRM）保护。</li>
            <li>本软件按"现状"提供，不对因使用本软件造成的任何系统损坏负责。</li>
          </ol>

          <p><strong style={{ color: "var(--text-primary)" }}>隐私声明</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>本软件<strong style={{ color: "var(--text-primary)" }}>不上传</strong>任何用户数据。</li>
            <li>注册表访问<strong style={{ color: "var(--text-primary)" }}>仅读取</strong>安装状态，不做任何修改。</li>
            <li>所有扫描结果仅保存在本地内存中，关闭程序后自动清除。</li>
            <li>文件扫描仅检查文件是否存在，不读取文件内容。</li>
          </ol>

          <p><strong style={{ color: "var(--text-primary)" }}>免责声明</strong></p>
          <p>本软件不提供任何第三方软件的下载、分发或托管。用户通过本软件跳转至第三方网站下载的文件，其安全性由用户自行判断，本软件不对其完整性、安全性或合法性承担责任。</p>
        </div>
        <div className="p-6 border-t space-y-3" style={{ borderColor: "var(--border-default)" }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-primary-500" />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>我已阅读并同意以上条款</span>
          </label>
          <button onClick={handleAccept} disabled={!agreed} className="btn-primary w-full">进入应用</button>
        </div>
      </div>
    </div>
  );
};

export { EULA_KEY };
export default EulaDialog;
