import React, { useState } from "react";
import { get_dll_owner, get_error_code_help } from "../api/tauri";

const ToolsPage: React.FC = () => {
  const [dllQuery, setDllQuery] = useState("");
  const [dllResult, setDllResult] = useState("");
  const [dllLoading, setDllLoading] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [errorCodeResult, setErrorCodeResult] = useState("");
  const [errorLoading, setErrorLoading] = useState(false);

  const handleDllQuery = async () => {
    if (!dllQuery.trim()) return;
    setDllLoading(true);
    setDllResult("");
    try {
      const result = await get_dll_owner(dllQuery.trim());
      setDllResult(result);
    } catch (err) {
      setDllResult(`查询失败: ${err}`);
    } finally {
      setDllLoading(false);
    }
  };

  const handleErrorCodeQuery = async () => {
    if (!errorCode.trim()) return;
    setErrorLoading(true);
    setErrorCodeResult("");
    try {
      const result = await get_error_code_help(errorCode.trim());
      setErrorCodeResult(result);
    } catch (err) {
      setErrorCodeResult(`查询失败: ${err}`);
    } finally {
      setErrorLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-dark-text">工具箱</h1>

        <div className="card">
          <h2 className="font-medium text-dark-text mb-3 flex items-center gap-2">
            <span>🔍</span> DLL 文件查询
          </h2>
          <p className="text-sm text-dark-text-muted mb-4">
            输入 DLL 文件名，查询它属于哪个运行库组件
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={dllQuery}
              onChange={(e) => setDllQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDllQuery()}
              placeholder="例如：vcruntime140.dll"
              className="input flex-1"
            />
            <button
              onClick={handleDllQuery}
              disabled={dllLoading}
              className="btn-primary"
            >
              {dllLoading ? "查询中..." : "查询"}
            </button>
          </div>
          {dllResult && (
            <div className="mt-4 p-3 bg-dark-card rounded-lg text-sm text-dark-text-secondary whitespace-pre-wrap">
              {dllResult}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-medium text-dark-text mb-3 flex items-center gap-2">
            <span>❌</span> 错误码查询
          </h2>
          <p className="text-sm text-dark-text-muted mb-4">
            输入 Windows 错误码，获取对应的错误说明和解决方案
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={errorCode}
              onChange={(e) => setErrorCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleErrorCodeQuery()}
              placeholder="例如：0xc000007b 或 126"
              className="input flex-1"
            />
            <button
              onClick={handleErrorCodeQuery}
              disabled={errorLoading}
              className="btn-primary"
            >
              {errorLoading ? "查询中..." : "查询"}
            </button>
          </div>
          {errorCodeResult && (
            <div className="mt-4 p-3 bg-dark-card rounded-lg text-sm text-dark-text-secondary whitespace-pre-wrap">
              {errorCodeResult}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-medium text-dark-text mb-3 flex items-center gap-2">
            <span>💡</span> 使用提示
          </h2>
          <ul className="text-sm text-dark-text-secondary space-y-2 list-disc list-inside">
            <li>DLL 查询支持模糊匹配，可输入完整或部分文件名</li>
            <li>错误码支持十六进制（0x 开头）和十进制格式</li>
            <li>如果查询结果不准确，建议提供完整的错误信息</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
