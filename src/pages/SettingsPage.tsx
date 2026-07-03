import React from "react";

const SettingsPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-dark-text">设置</h1>

        <div className="card">
          <h2 className="font-medium text-dark-text mb-4">关于</h2>
          <div className="space-y-2 text-sm text-dark-text-secondary">
            <div className="flex justify-between">
              <span>版本</span>
              <span className="text-dark-text">v0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>技术栈</span>
              <span className="text-dark-text">Tauri + React + TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span>许可证</span>
              <span className="text-dark-text">MIT License</span>
            </div>
            <div className="flex justify-between">
              <span>语言</span>
              <span className="text-dark-text">中文 (简体)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
