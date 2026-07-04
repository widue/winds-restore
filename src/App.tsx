import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "./store/appStore";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import InstallPanel from "./components/InstallPanel";
import TitleBar from "./components/TitleBar";
import EulaDialog, { EULA_KEY } from "./components/EulaDialog";
import HomePage from "./pages/HomePage";
import ScanningPage from "./pages/ScanningPage";
import ResultsPage from "./pages/ResultsPage";
import ToolsPage from "./pages/ToolsPage";
import SettingsPage from "./pages/SettingsPage";
import { get_manifest_count } from "./api/tauri";
import { startMemoryUsageMonitor, stopMemoryUsageMonitor } from "./api/events";

const App: React.FC = () => {
  const [eulaAccepted, setEulaAccepted] = useState(() => localStorage.getItem(EULA_KEY) === "true");
  const page = useAppStore((state) => state.page);
  const theme = useAppStore((state) => state.theme);
  const fontSize = useAppStore((state) => state.fontSize);
  const setMemoryUsage = useAppStore((state) => state.setMemoryUsage);
  const setScanResults = useAppStore((state) => state.setScanResults);
  const initializedRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true;

    const init = async () => {
      try {
        const count = await get_manifest_count();
        if (mounted && count > 0) {
          const emptyResults = Array.from({ length: count }, (_, i) => ({
            id: `placeholder-${i}`,
            name: `运行库 ${i + 1}`,
            status: "not_found" as const,
            details: "等待扫描...",
            installer_size_mb: 0,
          }));
          setScanResults(emptyResults);
        }
      } catch { /* silent */ }
    };

    init();

    startMemoryUsageMonitor((usage) => {
      if (mounted) setMemoryUsage(usage);
    }, 2000);

    return () => { mounted = false; stopMemoryUsageMonitor(); };
  }, [setScanResults, setMemoryUsage]);

  const renderPage = React.useMemo(() => {
    const PageComponent = (() => {
      switch (page) {
        case "home": return HomePage;
        case "scanning": return ScanningPage;
        case "results": return ResultsPage;
        case "tools": return ToolsPage;
        case "settings": return SettingsPage;
        default: return HomePage;
      }
    })();

    return (
      <div key={page} className="flex-1 flex flex-col overflow-hidden animate-wind-enter">
        <PageComponent />
      </div>
    );
  }, [page]);

  return (
    <div className={`h-full flex flex-col text-size-${fontSize}`} style={{ backgroundColor: "var(--bg-canvas)" }}>
      {!eulaAccepted && <EulaDialog onAccept={() => setEulaAccepted(true)} />}
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">{renderPage}</main>
      </div>
      <InstallPanel />
      <StatusBar />
    </div>
  );
};

export default App;