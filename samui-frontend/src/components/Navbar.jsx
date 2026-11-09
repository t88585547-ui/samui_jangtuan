"use client";
import React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Eye,
  RotateCcw,
  Maximize2,
  Minimize2,
  Crosshair,
  Plus,
  ArrowRight,
  Sun,
  Moon
} from "lucide-react";

export default function Navbar({
  appSection,
  setAppSection,
  isLeftOpen,
  setIsLeftOpen,
  isRightOpen,
  setIsRightOpen,
  isCriticalAlert,
  isLight,
  backendStatus,
  viewMode,
  setViewMode,
  showAllLabels,
  setShowAllLabels,
  onResetCamera,
  isPresentationMode,
  onTogglePresentation,
  isPinningMode,
  onTogglePinning,
  onOpenAddModal,
  onToggleTheme,
  subCardBg,
  dividerBorder,
  mutedText
}) {
  return (
    <header
      className={`pointer-events-auto fixed top-0 inset-x-0 z-40 h-14 px-4 lg:px-8 flex items-center justify-between border-b backdrop-blur-2xl transition-colors ${
        isLight
          ? "bg-white/85 border-zinc-200/90"
          : "bg-zinc-950/80 border-zinc-800/80"
      }`}
    >
      <div className="flex items-center gap-3">
        {appSection === "command" && (
          <button
            type="button"
            onClick={() => setIsLeftOpen((v) => !v)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${subCardBg}`}
            title="พับ/เปิด แผงรายการจุดเสี่ยงด้านซ้าย"
          >
            {isLeftOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        )}

        <div
          onClick={() => setAppSection("landing")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold border transition-transform group-hover:scale-105 ${
              isCriticalAlert
                ? "bg-red-600 text-white border-red-500 animate-pulse"
                : isLight
                ? "bg-zinc-950 text-white border-zinc-950"
                : "bg-white text-zinc-950 border-white"
            }`}
          >
            SM
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight">
              SAMUI.GEO//WATCH
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-500 font-semibold">
              v2.6 OS
            </span>
          </div>
        </div>

        <div className={`hidden sm:flex items-center p-0.5 rounded-lg border ml-2 ${subCardBg}`}>
          <button
            type="button"
            onClick={() => setAppSection("landing")}
            className={`px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition cursor-pointer ${
              appSection === "landing"
                ? isLight
                  ? "bg-zinc-950 text-white"
                  : "bg-white text-zinc-950"
                : `${mutedText} hover:text-current`
            }`}
          >
            01 // OVERVIEW
          </button>
          <button
            type="button"
            onClick={() => setAppSection("command")}
            className={`px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              appSection === "command"
                ? "bg-red-600 text-white"
                : `${mutedText} hover:text-current`
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>02 // 3D COMMAND DECK</span>
          </button>
        </div>

        <div
          className={`hidden xl:flex items-center gap-2 pl-3 border-l text-[10px] font-mono ${dividerBorder}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className={mutedText}>NODE:</span>
          <span className="font-semibold">{backendStatus}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {appSection === "command" ? (
          <>
            <div className={`hidden md:flex items-center p-0.5 rounded-lg border ${subCardBg}`}>
              {[
                { id: "topo", label: "TOPO" },
                { id: "wireframe", label: "WIRE" }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setViewMode(m.id)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                    viewMode === m.id
                      ? isLight
                        ? "bg-zinc-950 text-white"
                        : "bg-white text-zinc-950"
                      : `${mutedText} hover:text-current`
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAllLabels((v) => !v)}
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                showAllLabels
                  ? isLight
                    ? "bg-zinc-950 text-white border-zinc-950"
                    : "bg-white text-zinc-950 border-white"
                  : subCardBg
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ชื่อธง</span>
            </button>

            <button
              type="button"
              onClick={onResetCamera}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${subCardBg}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">รีเซ็ตมุมกล้อง</span>
            </button>

            <button
              type="button"
              onClick={onTogglePresentation}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isPresentationMode
                  ? "bg-red-600 text-white border-red-500"
                  : subCardBg
              }`}
              title="โหมดนำเสนอเต็มจอ"
            >
              {isPresentationMode ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onTogglePinning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isPinningMode
                  ? "bg-red-600 text-white border-red-500 animate-pulse"
                  : subCardBg
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden md:inline">
                {isPinningMode ? "ยกเลิกชี้พิกัด" : "คลิกปักธง 3D"}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? "bg-zinc-950 hover:bg-zinc-800 text-white"
                  : "bg-white hover:bg-zinc-200 text-zinc-950"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เพิ่มจุดเสี่ยง</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRightOpen((v) => !v)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${subCardBg}`}
            >
              {isRightOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setAppSection("command")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 transition cursor-pointer"
          >
            <span>LAUNCH 3D COMMAND</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${subCardBg}`}
          title="สลับโทนสี ขาว / ดำ"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
