import React from "react";

const SettingsPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-dark-text">设置</h1>

        <div className="card">
          <h2 className="font-medium text-dark-text mb-4">常规设置</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-dark-text">深色模式</div>
                <div className="text-xs text-dark-text-muted">
                  切换应用主题
                </div>
              </div>
              <button className="btn-ghost text-sm">跟随系统</button>
            </div>
            <div className="border-t border-dark-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-dark-text">启动时自动扫描</div>
                  <div className="text-xs text-dark-text-muted">
                    应用启动后自动运行系统检测
                  </div>
                </div>
                <div className="w-10 h-6 bg-dark-card rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-dark-text-muted rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-medium text-dark-text mb-4">扫描设置</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-dark-text">扫描 VC++ 运行库</div>
                <div className="text-xs text-dark-text-muted">
                  检测所有版本的 Visual C++ Redistributable
                </div>
              </div>
              <div className="w-10 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="border-t border-dark-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-dark-text">扫描 .NET Framework</div>
                  <div className="text-xs text-dark-text-muted">
                    检测 .NET Framework 安装状态
                  </div>
                </div>
                <div className="w-10 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div className="border-t border-dark-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-dark-text">扫描 DirectX 组件</div>
                  <div className="text-xs text-dark-text-muted">
                    检测 DirectPlay 等旧版组件
                  </div>
                </div>
                <div className="w-10 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
