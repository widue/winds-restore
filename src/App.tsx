import React, { useEffect, useRef, useState, lazy, Suspense, useCallback } from "react";
import { useAppStore } from "./store/appStore";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import InstallPanel from "./components/InstallPanel";
import TitleBar from "./components/TitleBar";
import EulaDialog, { EULA_KEY } from "./components/EulaDialog";
import { get_manifest_count } from "./api/tauri";
import { startMemoryUsageMonitor, stopMemoryUsageMonitor } from "./api/events";

const HomePage = lazy(() => import("./pages/HomePage"));
const ScanningPage = lazy(() => import("./pages/ScanningPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const ToolsPage = lazy(() => import("./pages/ToolsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const PAGE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  home: HomePage,
  scanning: ScanningPage,
  results: ResultsPage,
  tools: ToolsPage,
  settings: SettingsPage,
};

const LOADING_FALLBACK = (
  <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--brand-wind)" }} />
      <span className="text-[12px]">加载中...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [eulaAccepted, setEulaAccepted] = useState(() => localStorage.getItem(EULA_KEY) === "true");
  const page = useAppStore((state) => state.page);
  const theme = useAppStore((state) => state.theme);
  const fontSize = useAppStore((state) => state.fontSize);
  const setMemoryUsage = useAppStore((state) => state.setMemoryUsage);
  const setScanResults = useAppStore((state) => state.setScanResults);
  const setPage = useAppStore((state) => state.setPage);
  const initializedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    }, 5000);

    return () => { mounted = false; stopMemoryUsageMonitor(); };
  }, [setScanResults, setMemoryUsage]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        const keyMap: Record<string, string> = { "1": "home", "2": "scanning", "3": "results", "4": "tools", "5": "settings" };
        const target = keyMap[e.key];
        if (target && PAGE_COMPONENTS[target]) {
          e.preventDefault();
          setPage(target as any);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setPage]);

  const PageComponent = PAGE_COMPONENTS[page] || HomePage;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      (e.target as HTMLElement).click();
    }
  }, []);

  return (
    <div id="app-root" className={`h-full flex flex-col text-size-${fontSize}`} style={{ backgroundColor: "var(--bg-canvas)" }}>
      {!eulaAccepted && <EulaDialog onAccept={() => setEulaAccepted(true)} />}
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main
          ref={scrollContainerRef}
          className="flex-1 flex flex-col overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <Suspense fallback={LOADING_FALLBACK}>
            <PageComponent />
          </Suspense>
        </main>
      </div>
      <InstallPanel />
      <StatusBar />
    </div>
  );
};

export default App;
