"use client";
import React from "react";
import {
  Flag,
  Search,
  Activity,
  Thermometer,
  CloudRain,
  Wind,
  AlertTriangle,
  Sliders,
  Play,
  Pause,
  X,
  Navigation
} from "lucide-react";
import { calculateDynamicSpotRisk } from "../utils/riskEngine";

export default function CommandPanels({
  isLeftOpen,
  isRightOpen,
  filteredHotspots,
  selectedSpot,
  setSelectedSpot,
  setHoveredSpotId,
  searchQuery,
  setSearchQuery,
  filterLevel,
  setFilterLevel,
  weather,
  currentRain,
  currentWind,
  simRain,
  isCriticalAlert,
  isWarningAlert,
  isAutoPlayingStorm,
  setIsAutoPlayingStorm,
  onSimulateRain,
  onResetLiveWeather,
  showFloodPlane,
  setShowFloodPlane,
  showLandmarks,
  setShowLandmarks,
  selectedSpotRisk,
  onCloseSelectedSpot,
  isLight,
  panelBg,
  subCardBg,
  dividerBorder,
  mutedText
}) {
  return (
    <>
      {isLeftOpen && (
        <aside className={`pointer-events-auto absolute top-[68px] left-4 z-20 w-[320px] max-h-[calc(100vh-84px)] flex flex-col backdrop-blur-xl border rounded-xl overflow-hidden ${panelBg}`}>
          <div className={`p-3.5 border-b space-y-2.5 ${dividerBorder}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  จุดเสี่ยงภัยธรรมชาติ ({filteredHotspots.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-red-500 font-semibold">LIVE SCORE</span>
            </div>

            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${mutedText}`} />
              <input
                type="text"
                placeholder="ค้นหาชื่อจุดเสี่ยง หรือตำบล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none ${subCardBg}`}
              />
            </div>

            <div className={`grid grid-cols-4 gap-1 p-1 rounded-lg border text-[10px] font-mono ${subCardBg}`}>
              {[
                { id: "ALL", label: "ALL" },
                { id: "High", label: "HIGH" },
                { id: "Medium", label: "MED" },
                { id: "Low", label: "LOW" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterLevel(tab.id)}
                  className={`py-1 rounded font-semibold transition cursor-pointer ${
                    filterLevel === tab.id
                      ? isLight
                        ? "bg-zinc-950 text-white"
                        : "bg-white text-zinc-950"
                      : `${mutedText} hover:text-current`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto divide-y ${isLight ? "divide-zinc-200" : "divide-zinc-800/70"}`}>
            {filteredHotspots.map((spot) => {
              const isSelected = selectedSpot?.id === spot.id;
              const risk = calculateDynamicSpotRisk(spot, currentRain, currentWind);

              return (
                <button
                  key={spot.id}
                  type="button"
                  onMouseEnter={() => setHoveredSpotId(spot.id)}
                  onMouseLeave={() => setHoveredSpotId(null)}
                  onClick={() => setSelectedSpot(spot)}
                  className={`w-full text-left p-3 transition flex flex-col gap-2 cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-zinc-950 text-white"
                        : "bg-white text-zinc-950"
                      : isLight
                      ? "hover:bg-zinc-100"
                      : "hover:bg-zinc-900/90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <span className="text-[10px] font-mono opacity-60">{spot.code}</span>
                        <p className="text-xs font-bold truncate">{spot.name}</p>
                      </div>
                      <p className={`text-[11px] mt-0.5 truncate ${isSelected ? "opacity-80" : mutedText}`}>
                        {spot.risk_type} • {spot.tambon}
                      </p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${risk.isCritical ? "bg-red-600 text-white border-red-500" : dividerBorder}`}>
                      {risk.score}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {isRightOpen && (
        <section className={`pointer-events-auto absolute top-[68px] right-4 z-20 w-[336px] max-h-[calc(100vh-84px)] overflow-y-auto backdrop-blur-xl border rounded-xl p-4 space-y-3.5 ${panelBg}`}>
          <div className={`flex items-start justify-between gap-2 border-b pb-3 ${dividerBorder}`}>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider opacity-70">
                <Activity className="w-3 h-3 text-red-500" />
                <span>{simRain !== null ? "SIMULATION OVERRIDE" : "LIVE WEATHER TELEMETRY"}</span>
              </div>
              <h2 className="text-sm font-bold mt-0.5">{weather.location}</h2>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${isCriticalAlert ? "bg-red-600 text-white border-red-500 animate-pulse" : subCardBg}`}>
              {isCriticalAlert ? "CRITICAL" : isWarningAlert ? "WARNING" : "NOMINAL"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`border rounded-lg p-2.5 ${subCardBg}`}>
              <div className={`flex items-center gap-1 text-[10px] font-mono ${mutedText}`}>
                <Thermometer className="w-3 h-3" />
                <span>TEMP</span>
              </div>
              <p className="text-base font-mono font-bold mt-1">{weather.temperature_c}°C</p>
            </div>
            <div className={`border rounded-lg p-2.5 ${isCriticalAlert ? "bg-red-500/10 border-red-500/60 text-red-500" : subCardBg}`}>
              <div className="flex items-center gap-1 text-[10px] font-mono opacity-80">
                <CloudRain className="w-3 h-3" />
                <span>RAIN</span>
              </div>
              <p className="text-base font-mono font-bold mt-1">{currentRain} mm</p>
            </div>
            <div className={`border rounded-lg p-2.5 ${subCardBg}`}>
              <div className={`flex items-center gap-1 text-[10px] font-mono ${mutedText}`}>
                <Wind className="w-3 h-3" />
                <span>WIND</span>
              </div>
              <p className="text-base font-mono font-bold mt-1">{weather.wind_speed_kmh}</p>
            </div>
          </div>

          <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${isCriticalAlert ? "bg-red-600 text-white border-red-500" : subCardBg}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block uppercase font-mono text-[10px]">ISLAND RISK ASSESSMENT</span>
              <span>{weather.risk_status}</span>
            </div>
          </div>

          <div className={`pt-3 border-t space-y-2.5 ${dividerBorder}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Sliders className="w-3.5 h-3.5" />
                <span>จำลองปริมาณน้ำฝนสะสม</span>
              </div>
              <span className="text-xs font-mono font-bold text-red-500">{currentRain} MM/HR</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoPlayingStorm((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition shrink-0 cursor-pointer ${
                  isAutoPlayingStorm ? "bg-red-600 text-white border-red-500" : subCardBg
                }`}
              >
                {isAutoPlayingStorm ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isAutoPlayingStorm ? "PAUSE" : "AUTO STORM"}</span>
              </button>

              <input
                type="range"
                min="0"
                max="90"
                value={currentRain}
                onChange={(e) => {
                  setIsAutoPlayingStorm(false);
                  onSimulateRain(e.target.value);
                }}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { val: 0, label: "0mm (ปกติ)" },
                { val: 22, label: "22mm (เฝ้าระวัง)" },
                { val: 65, label: "65mm (วิกฤต)" }
              ].map((b) => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => {
                    setIsAutoPlayingStorm(false);
                    onSimulateRain(b.val);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-semibold border transition cursor-pointer ${
                    b.val === 65 ? "bg-red-600 text-white border-red-500" : subCardBg
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {simRain !== null && (
              <button
                type="button"
                onClick={onResetLiveWeather}
                className="w-full py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer bg-white text-zinc-950"
              >
                รีเซ็ตกลับสู่สภาพอากาศจริง
              </button>
            )}
          </div>
        </section>
      )}

      {selectedSpot && selectedSpotRisk && (
        <div className={`pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[600px] backdrop-blur-xl border rounded-xl p-4 ${panelBg}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 font-bold">{selectedSpot.code}</span>
                  <span className="font-semibold text-red-500">RISK INDEX: {selectedSpotRisk.score}%</span>
                </div>
                <h3 className="text-sm font-bold truncate mt-0.5">
                  {selectedSpot.name} ({selectedSpot.tambon})
                </h3>
              </div>
            </div>
            <button type="button" onClick={onCloseSelectedSpot} className={`p-1.5 rounded-lg border cursor-pointer ${subCardBg}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-zinc-800/40 text-xs">
            <div className={`p-2.5 rounded-lg border ${subCardBg}`}>
              <span className={`text-[9px] font-mono block uppercase ${mutedText}`}>{selectedSpotRisk.metricLabel}</span>
              <span className="font-mono font-bold text-sm mt-0.5 block text-red-500">{selectedSpotRisk.metricValue}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-red-500/40 bg-red-500/10">
              <div className="flex items-center gap-1 text-[9px] font-mono text-red-500 font-bold uppercase">
                <Navigation className="w-2.5 h-2.5" />
                <span>SAFE ZONE / จุดอพยพ</span>
              </div>
              <span className="text-[11px] font-semibold mt-0.5 block">{selectedSpot.safe_zone}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
