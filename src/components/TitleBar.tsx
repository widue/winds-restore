import React, { useCallback } from "react";
import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const win = () => {
  try { return getCurrentWindow(); } catch { return null; }
};

const TitleBar: React.FC = () => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    win()?.startDragging();
  }, []);

  return (
    <div data-tauri-drag-region onMouseDown={handleMouseDown} className="h-9 flex items-center shrink-0 select-none" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="flex-1 flex items-center justify-center h-full">
        <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
          风与修 · Winds Restore
        </span>
      </div>
      <div className="flex items-center h-full">
        <button
          onClick={() => win()?.minimize()}
          className="flex items-center justify-center w-12 h-full transition-colors duration-100"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <Minus size={13} strokeWidth={2} />
        </button>
        <button
          onClick={() => win()?.toggleMaximize()}
          className="flex items-center justify-center w-12 h-full transition-colors duration-100"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <Square size={11} strokeWidth={2} />
        </button>
        <button
          onClick={() => win()?.close()}
          className="flex items-center justify-center w-12 h-full transition-colors duration-100"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e81123";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
