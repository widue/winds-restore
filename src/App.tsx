import React, { useEffect } from "react";
import { useAppStore } from "./store/appStore";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import InstallPanel from "./components/InstallPanel";
import HomePage from "./pages/HomePage";
import ScanningPage from "./pages/ScanningPage";
import ResultsPage from "./pages/ResultsPage";
import ToolsPage from "./pages/ToolsPage";
import SettingsPage from "./pages/SettingsPage";
import { get_manifest_count } from "./api/tauri";
import { startMemoryUsageMonitor, stopMemoryUsageMonitor } from "./api/events";

const App: React.FC = () => {
  const { page, setMemoryUsage, setScanResults } = useAppStore();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const count = await get_manifest_count();
        if (mounted) {
          const emptyResults = Array.from({ length: count }, (_, i) => ({
            id: `placeholder-${i}`,
            name: `运行库 ${i + 1}`,
            status: "not_found" as const,
            details: "等待扫描...",
            installer_size_mb: 0,
          }));
          setScanResults(emptyResults);
        }
      } catch {
        // 静默失败
      }
    };

    init();

    startMemoryUsageMonitor((usage) => {
      setMemoryUsage(usage);
    }, 2000);

    return () => {
      mounted = false;
      stopMemoryUsageMonitor();
    };
  }, [setScanResults, setMemoryUsage]);

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage />;
      case "scanning":
        return <ScanningPage />;
      case "results":
        return <ResultsPage />;
      case "tools":
        return <ToolsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderPage()}
        </main>
      </div>
      <InstallPanel />
      <StatusBar />
    </div>
  );
};

export default App;
