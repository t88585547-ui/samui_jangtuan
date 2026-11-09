"use client";
import React from "react";
import {
  Flag,
  ArrowRight,
  Play,
  Radio,
  ChevronRight,
  Layers,
  Cpu,
  Database
} from "lucide-react";
import { calculateDynamicSpotRisk } from "../utils/riskEngine";

export default function LandingView({
  weather,
  currentRain,
  currentWind,
  hotspots,
  backendStatus,
  isLight,
  panelBg,
  subCardBg,
  mutedText,
  onEnterCommand,
  onStartAutoStorm,
  onSimulateRain,
  onSelectSpotAndFocus,
  onHoverSpot,
  onOpenAddModal
}) {
  return (
    <div className="pointer-events-auto relative z-20 w-full h-full overflow-y-auto pt-14 scroll-smooth">
      <div
        className={`pointer-events-none fixed inset-0 top-14 z-0 ${
          isLight
            ? "bg-gradient-to-r from-zinc-100/95 via-zinc-100/60 to-transparent"
            : "bg-gradient-to-r from-[#09090b]/95 via-[#09090b]/65 to-transparent"
        }`}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-16 space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[72vh]">
          <div className="lg:col-span-7 space-y-6">
            <div
              className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-[11px] font-mono backdrop-blur-xl ${
                isLight
                  ? "bg-white/90 border-zinc-300 text-zinc-800"
                  : "bg-zinc-900/90 border-zinc-800 text-zinc-300"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="font-bold text-red-500">LIVE DIGITAL TWIN</span>
              <span className="opacity-30">|</span>
              <span>KOH SAMUI 9.5120°N 100.0136°E</span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-red-500 font-semibold">
                SPATIAL DISASTER INTELLIGENCE PLATFORM
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.06]">
                ระบบเฝ้าระวังภัยพิบัติ
                <span className="block mt-1 font-mono font-light opacity-75 text-2xl sm:text-4xl">
                  ภูมิสารสนเทศ 3 มิติ เกาะสมุย
                </span>
              </h1>
            </div>

            <p className={`text-sm sm:text-base max-w-xl leading-relaxed ${mutedText}`}>
              ผสานแบบจำลองความสูงภูมิประเทศ <strong>3D Topographic LiDAR</strong> ของเกาะสมุย
              เข้ากับข้อมูลอุตุนิยมวิทยาเรียลไทม์จาก <strong>Open-Meteo API</strong> และฐานข้อมูลจุดเสี่ยง{" "}
              <strong>SQLite</strong> เพื่อประเมินความเสี่ยงน้ำท่วมฉับพลันและดินสไลด์รายตำบลอย่างแม่นยำ
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onEnterCommand}
                className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-2xl shadow-red-600/30 transition-all cursor-pointer"
              >
                <Flag className="w-4 h-4 fill-current" />
                <span>เข้าสู่ศูนย์บัญชาการ 3 มิติ (Command Center)</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onStartAutoStorm}
                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border text-sm font-mono font-semibold backdrop-blur-xl transition cursor-pointer ${
                  isLight
                    ? "bg-white/90 hover:bg-zinc-200 border-zinc-300 text-zinc-950"
                    : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>จำลองพายุเข้าเกาะสมุย (Auto-Storm)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
              <div className={`p-3.5 rounded-xl border backdrop-blur-xl ${panelBg}`}>
                <span className={`text-[10px] font-mono uppercase block ${mutedText}`}>
                  อุณหภูมิเกาะสมุย
                </span>
                <span className="text-xl font-mono font-bold mt-1 block tabular-nums">
                  {weather.temperature_c}°C
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border backdrop-blur-xl ${panelBg}`}>
                <span className={`text-[10px] font-mono uppercase block ${mutedText}`}>
                  ปริมาณน้ำฝนสะสม
                </span>
                <span className="text-xl font-mono font-bold mt-1 block tabular-nums text-red-500">
                  {currentRain} mm
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border backdrop-blur-xl ${panelBg}`}>
                <span className={`text-[10px] font-mono uppercase block ${mutedText}`}>
                  ความเร็วลมมรสุม
                </span>
                <span className="text-xl font-mono font-bold mt-1 block tabular-nums">
                  {weather.wind_speed_kmh} km/h
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border backdrop-blur-xl ${panelBg}`}>
                <span className={`text-[10px] font-mono uppercase block ${mutedText}`}>
                  ธงแดงเฝ้าระวัง
                </span>
                <span className="text-xl font-mono font-bold mt-1 block tabular-nums text-red-500">
                  {hotspots.length} จุด
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-end justify-end">
            <div className={`w-full max-w-sm p-5 rounded-2xl border backdrop-blur-2xl space-y-4 ${panelBg}`}>
              <div className="flex items-center justify-between border-b pb-3 border-current/10">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    3D LIVE SIMULATION DECK
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-500 font-bold">
                  INTERACTIVE
                </span>
              </div>

              <p className={`text-xs leading-relaxed ${mutedText}`}>
                ทดลองเปลี่ยนระดับพายุฝนด้านล่างเพื่อดูการตอบสนองของโมเดล 3D เกาะสมุยพื้นหลังแบบเรียลไทม์
              </p>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { rain: 0, label: "0mm ปกติ" },
                  { rain: 25, label: "25mm เฝ้าระวัง" },
                  { rain: 65, label: "65mm พายุวิกฤต" }
                ].map((preset) => {
                  const active = currentRain === preset.rain;
                  return (
                    <button
                      key={preset.rain}
                      type="button"
                      onClick={() => onSimulateRain(preset.rain)}
                      className={`py-2 px-2 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                        active
                          ? "bg-red-600 text-white border-red-500"
                          : `${subCardBg} hover:border-red-500/60`
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1">
                <span className={`text-[10px] font-mono uppercase block ${mutedText}`}>
                  คลิกเพื่อบินกล้อง 3D ไปยังจุดเสี่ยงสำคัญ:
                </span>
                {hotspots.slice(0, 3).map((spot) => {
                  const risk = calculateDynamicSpotRisk(spot, currentRain, currentWind);
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onMouseEnter={() => onHoverSpot(spot.id)}
                      onMouseLeave={() => onHoverSpot(null)}
                      onClick={() => onSelectSpotAndFocus(spot)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer hover:border-red-500 ${subCardBg}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Flag className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-bold block truncate">
                            {spot.name}
                          </span>
                          <span className={`text-[10px] font-mono ${mutedText}`}>
                            {spot.risk_type} • ELEV {spot.elevation_m}M
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-red-500">
                          {risk.score}%
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-4 border-current/10">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold">
                SYSTEM ARCHITECTURE // BENTO OVERVIEW
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                สถาปัตยกรรมเทคโนโลยีเฝ้าระวังภัยระดับ Production
              </h2>
            </div>
            <span className={`text-xs font-mono ${mutedText}`}>
              NEXT.JS 3D GLSL + EXPRESS.JS + SQLITE + OPEN-METEO
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className={`md:col-span-7 p-6 rounded-2xl border backdrop-blur-2xl flex flex-col justify-between space-y-6 ${panelBg}`}>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-red-500/15 text-red-500">
                  <Layers className="w-3.5 h-3.5" />
                  CUSTOM GLSL TOPOGRAPHIC ENGINE
                </span>
                <h3 className="text-xl font-bold">
                  แบบจำลองภูมิประเทศเกาะสมุย 3 มิติ (LiDAR Contour Mesh)
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${mutedText}`}>
                  สร้างโครงข่ายภูมิประเทศจากพิกัดแนวชายฝั่งจริง 48 จุดรอบเกาะสมุย ครอบคลุมยอดเขาป้อม
                  (635 เมตรเหนือระดับน้ำทะเล) เทือกเขาแม่น้ำ และโครงข่ายถนนทวีราษฎร์ภักดี (สาย 4169)
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-current/10 font-mono text-xs">
                <div>
                  <span className={`text-[10px] block ${mutedText}`}>MAX ELEVATION</span>
                  <span className="font-bold text-sm">635.0 METERS</span>
                </div>
                <div>
                  <span className={`text-[10px] block ${mutedText}`}>RING ROAD</span>
                  <span className="font-bold text-sm">HWY 4169 (50.2 KM)</span>
                </div>
                <div>
                  <span className={`text-[10px] block ${mutedText}`}>RAYCASTER PIN</span>
                  <span className="font-bold text-sm text-red-500">3D CLICK-TO-PIN</span>
                </div>
              </div>
            </div>

            <div className={`md:col-span-5 p-6 rounded-2xl border backdrop-blur-2xl flex flex-col justify-between space-y-6 ${panelBg}`}>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-current/20">
                  <Cpu className="w-3.5 h-3.5 text-red-500" />
                  DYNAMIC RISK MATRIX
                </span>
                <h3 className="text-xl font-bold">
                  สมการประเมินดัชนีความเสี่ยงรายจุด (0–100%)
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${mutedText}`}>
                  คำนวณโอกาสเกิดน้ำท่วมฉับพลันในพื้นที่ลุ่มต่ำและโอกาสเกิดดินสไลด์บนพื้นที่ลาดชันแบบเรียลไทม์
                </p>
              </div>
              <div className={`p-3.5 rounded-xl border font-mono text-[11px] space-y-1.5 ${subCardBg}`}>
                <div className="flex justify-between">
                  <span className={mutedText}>BACKEND STATUS:</span>
                  <span className="font-bold text-red-500">{backendStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>DATABASE:</span>
                  <span className="font-bold">SQLite + Express REST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
