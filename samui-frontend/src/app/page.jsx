"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Check } from "lucide-react";
import { SAMUI_COASTLINE, INITIAL_HOTSPOTS } from "../constants/samuiGeoData";
import {
  latLngToXZ,
  enrichHotspotMetadata,
  calculateDynamicSpotRisk,
  computeWeatherRisk
} from "../utils/riskEngine";
import Navbar from "../components/Navbar";
import LandingView from "../components/LandingView";
import Samui3DViewport from "../components/Samui3DViewport";
import CommandPanels from "../components/CommandPanels";
import AddHotspotModal from "../components/AddHotspotModal";

export default function SamuiGeoRiskWatchPage() {
  const polyXZ = useMemo(
    () => SAMUI_COASTLINE.map(([lat, lng]) => latLngToXZ(lat, lng)),
    []
  );

  const [hotspots, setHotspots] = useState(() =>
    INITIAL_HOTSPOTS.map((s, i) => enrichHotspotMetadata(s, i, polyXZ))
  );
  const [weather, setWeather] = useState({
    location: "เกาะสมุย จ.สุราษฎร์ธานี",
    temperature_c: 24.9,
    rain_mm: 0.0,
    wind_speed_kmh: 16.9,
    risk_status: "ปกติ"
  });

  const [appSection, setAppSection] = useState("landing");
  const [themeMode, setThemeMode] = useState("dark");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [hoveredSpotId, setHoveredSpotId] = useState(null);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("topo");
  const [showFloodPlane, setShowFloodPlane] = useState(true);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);

  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const [simRain, setSimRain] = useState(null);
  const [isAutoPlayingStorm, setIsAutoPlayingStorm] = useState(false);

  const [isPinningMode, setIsPinningMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSpotForm, setNewSpotForm] = useState({
    name: "",
    tambon: "ต.บ่อผุด",
    lat: "9.5285",
    lng: "100.0615",
    risk_type: "น้ำท่วมขังรอการระบาย",
    level: "High",
    elevation_m: 8,
    description: ""
  });

  const [cameraResetCount, setCameraResetCount] = useState(0);
  const [backendStatus, setBackendStatus] = useState("CONNECTING...");
  const [activeApiBase, setActiveApiBase] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function connectBackend() {
      const candidateBases = ["http://localhost:3000/api", "http://localhost:5000/api"];
      for (const base of candidateBases) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1800);
          const [spotsRes, weatherRes] = await Promise.all([
            fetch(`${base}/hotspots`, { signal: controller.signal }),
            fetch(`${base}/weather`, { signal: controller.signal })
          ]);
          clearTimeout(timer);

          if (spotsRes.ok && weatherRes.ok) {
            const spotsData = await spotsRes.json();
            const weatherData = await weatherRes.json();
            if (!isMounted) return;
            const rawList = Array.isArray(spotsData) ? spotsData : spotsData.data || INITIAL_HOTSPOTS;
            setHotspots(rawList.map((s, idx) => enrichHotspotMetadata(s, idx, polyXZ)));
            setWeather(weatherData.data || weatherData);
            setActiveApiBase(base);
            setBackendStatus(`SQLITE LIVE (${base.replace("http://", "")})`);
            return;
          }
        } catch (_) {}
      }
      if (isMounted) setBackendStatus("LOCAL SIMULATION READY");
    }
    connectBackend();
    return () => {
      isMounted = false;
    };
  }, [polyXZ]);

  const handleSimulateRain = useCallback(
    async (val) => {
      const numVal = Number(val);
      setSimRain(numVal);
      if (activeApiBase) {
        try {
          const res = await fetch(`${activeApiBase}/weather?simRain=${numVal}`);
          if (res.ok) {
            const data = await res.json();
            setWeather(data.data || data);
            return;
          }
        } catch (_) {}
      }
      setWeather((prev) => computeWeatherRisk(prev.temperature_c, numVal, prev.wind_speed_kmh));
    },
    [activeApiBase]
  );

  useEffect(() => {
    if (!isAutoPlayingStorm) return;
    const interval = setInterval(() => {
      setSimRain((prev) => {
        const current = prev !== null ? prev : 0;
        const next = current >= 85 ? 0 : current + 2;
        setWeather((w) => computeWeatherRisk(w.temperature_c, next, w.wind_speed_kmh));
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [isAutoPlayingStorm]);

  const handleResetLiveWeather = async () => {
    setIsAutoPlayingStorm(false);
    setSimRain(null);
    if (activeApiBase) {
      try {
        const res = await fetch(`${activeApiBase}/weather`);
        if (res.ok) {
          const data = await res.json();
          setWeather(data.data || data);
          showToast("สลับกลับสู่ข้อมูลสภาพอากาศจริงจาก Backend");
          return;
        }
      } catch (_) {}
    }
    setWeather((prev) => computeWeatherRisk(prev.temperature_c, 0.0, prev.wind_speed_kmh));
    showToast("รีเซ็ตค่าสภาพอากาศกลับสู่สภาวะปกติ");
  };

  const handleMapPinClick = useCallback(
    ({ lat, lng, elevation_m }) => {
      setIsPinningMode(false);
      setNewSpotForm((prev) => ({
        ...prev,
        lat: String(lat),
        lng: String(lng),
        elevation_m,
        risk_type: elevation_m > 30 ? "ดินสไลด์และน้ำป่าไหลหลาก" : "น้ำท่วมขังรอการระบาย",
        level: "High"
      }));
      setIsAddModalOpen(true);
      showToast(`ดึงพิกัดจากโมเดล 3D สำเร็จ (${lat}N, ${lng}E)`);
    },
    [showToast]
  );

  const handleAddHotspotSubmit = async (e) => {
    e.preventDefault();
    const nextIdx = hotspots.length + 1;
    const apiPayload = {
      name: newSpotForm.name.trim() || "จุดเฝ้าระวังใหม่",
      lat: parseFloat(newSpotForm.lat) || 9.512,
      lng: parseFloat(newSpotForm.lng) || 100.013,
      risk_type: newSpotForm.risk_type,
      level: newSpotForm.level
    };

    if (activeApiBase) {
      try {
        const res = await fetch(`${activeApiBase}/hotspots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload)
        });
        if (res.ok) {
          const created = await res.json();
          const enriched = enrichHotspotMetadata(
            { ...apiPayload, id: created.id || Date.now(), tambon: newSpotForm.tambon },
            nextIdx - 1,
            polyXZ
          );
          setHotspots((prev) => [...prev, enriched]);
          setSelectedSpot(enriched);
          setIsAddModalOpen(false);
          showToast("บันทึกพิกัดลงฐานข้อมูล SQLite และปักธงแดง 3D สำเร็จ");
          return;
        }
      } catch (_) {}
    }

    const localEnriched = enrichHotspotMetadata(
      { ...apiPayload, id: Date.now(), tambon: newSpotForm.tambon },
      nextIdx - 1,
      polyXZ
    );
    setHotspots((prev) => [...prev, localEnriched]);
    setSelectedSpot(localEnriched);
    setIsAddModalOpen(false);
    showToast("ปักธงแดงจุดเสี่ยงใหม่บนโมเดลเกาะสมุยเรียบร้อย");
  };

  const currentRain = simRain !== null ? simRain : Number(weather.rain_mm || 0);
  const currentWind = Number(weather.wind_speed_kmh || 16.9);
  const isCriticalAlert = currentRain >= 30;
  const isWarningAlert = currentRain >= 5 && currentRain < 30;
  const isLight = themeMode === "light";

  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      const dyn = calculateDynamicSpotRisk(h, currentRain, currentWind);
      const matchLevel = filterLevel === "ALL" || h.level === filterLevel || dyn.dynamicLevel === filterLevel;
      const matchSearch =
        !searchQuery.trim() ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.risk_type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [hotspots, filterLevel, searchQuery, currentRain, currentWind]);

  const selectedSpotRisk = useMemo(() => {
    if (!selectedSpot) return null;
    return calculateDynamicSpotRisk(selectedSpot, currentRain, currentWind);
  }, [selectedSpot, currentRain, currentWind]);

  const panelBg = isLight
    ? "bg-white/95 border-zinc-200 text-zinc-950 shadow-lg"
    : "bg-zinc-950/90 border-zinc-800 text-zinc-100 shadow-2xl";
  const subCardBg = isLight ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900/80 border-zinc-800";
  const dividerBorder = isLight ? "border-zinc-200" : "border-zinc-800";
  const mutedText = isLight ? "text-zinc-500" : "text-zinc-400";

  return (
    <div className={`relative w-screen h-screen overflow-hidden font-sans select-none ${isLight ? "bg-zinc-100 text-zinc-950" : "bg-[#09090b] text-zinc-100"}`}>
      <div className="fixed inset-0 z-0">
        <Samui3DViewport
          hotspots={filteredHotspots}
          selectedSpot={selectedSpot}
          hoveredSpotId={hoveredSpotId}
          onSelectSpot={(spot) => {
            setSelectedSpot(spot);
            setAppSection("command");
          }}
          onHoverSpot={setHoveredSpotId}
          rainMm={currentRain}
          windKmh={currentWind}
          viewMode={viewMode}
          showFloodPlane={showFloodPlane}
          showAllLabels={showAllLabels}
          showLandmarks={showLandmarks}
          isPinningMode={isPinningMode}
          onMapPinClick={handleMapPinClick}
          cameraResetTrigger={cameraResetCount}
          themeMode={themeMode}
          polyXZ={polyXZ}
          isLandingMode={appSection === "landing"}
        />
      </div>

      <Navbar
        appSection={appSection}
        setAppSection={setAppSection}
        isLeftOpen={isLeftOpen}
        setIsLeftOpen={setIsLeftOpen}
        isRightOpen={isRightOpen}
        setIsRightOpen={setIsRightOpen}
        isCriticalAlert={isCriticalAlert}
        isLight={isLight}
        backendStatus={backendStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showAllLabels={showAllLabels}
        setShowAllLabels={setShowAllLabels}
        onResetCamera={() => {
          setSelectedSpot(null);
          setCameraResetCount((c) => c + 1);
        }}
        isPresentationMode={isPresentationMode}
        onTogglePresentation={() => {
          setIsPresentationMode((prev) => {
            const next = !prev;
            setIsLeftOpen(!next);
            setIsRightOpen(!next);
            return next;
          });
        }}
        isPinningMode={isPinningMode}
        onTogglePinning={() => setIsPinningMode((v) => !v)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onToggleTheme={() => setThemeMode((t) => (t === "dark" ? "light" : "dark"))}
        subCardBg={subCardBg}
        dividerBorder={dividerBorder}
        mutedText={mutedText}
      />

      {appSection === "landing" && (
        <LandingView
          weather={weather}
          currentRain={currentRain}
          currentWind={currentWind}
          hotspots={hotspots}
          backendStatus={backendStatus}
          isLight={isLight}
          panelBg={panelBg}
          subCardBg={subCardBg}
          mutedText={mutedText}
          onEnterCommand={() => setAppSection("command")}
          onStartAutoStorm={() => {
            setAppSection("command");
            setIsAutoPlayingStorm(true);
          }}
          onSimulateRain={handleSimulateRain}
          onSelectSpotAndFocus={(spot) => {
            setSelectedSpot(spot);
            setAppSection("command");
          }}
          onHoverSpot={setHoveredSpotId}
          onOpenAddModal={() => {
            setAppSection("command");
            setIsAddModalOpen(true);
          }}
        />
      )}

      {appSection === "command" && (
        <CommandPanels
          isLeftOpen={isLeftOpen}
          isRightOpen={isRightOpen}
          filteredHotspots={filteredHotspots}
          selectedSpot={selectedSpot}
          setSelectedSpot={setSelectedSpot}
          setHoveredSpotId={setHoveredSpotId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterLevel={filterLevel}
          setFilterLevel={setFilterLevel}
          weather={weather}
          currentRain={currentRain}
          currentWind={currentWind}
          simRain={simRain}
          isCriticalAlert={isCriticalAlert}
          isWarningAlert={isWarningAlert}
          isAutoPlayingStorm={isAutoPlayingStorm}
          setIsAutoPlayingStorm={setIsAutoPlayingStorm}
          onSimulateRain={handleSimulateRain}
          onResetLiveWeather={handleResetLiveWeather}
          showFloodPlane={showFloodPlane}
          setShowFloodPlane={setShowFloodPlane}
          showLandmarks={showLandmarks}
          setShowLandmarks={setShowLandmarks}
          selectedSpotRisk={selectedSpotRisk}
          onCloseSelectedSpot={() => {
            setSelectedSpot(null);
            setCameraResetCount((c) => c + 1);
          }}
          isLight={isLight}
          panelBg={panelBg}
          subCardBg={subCardBg}
          dividerBorder={dividerBorder}
          mutedText={mutedText}
        />
      )}

      <AddHotspotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        newSpotForm={newSpotForm}
        setNewSpotForm={setNewSpotForm}
        onSubmit={handleAddHotspotSubmit}
        onActivate3DPinning={() => {
          setIsAddModalOpen(false);
          setIsPinningMode(true);
        }}
        isLight={isLight}
        subCardBg={subCardBg}
        dividerBorder={dividerBorder}
        mutedText={mutedText}
      />

      {toastMessage && (
        <div className={`pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-2xl text-xs font-medium ${isLight ? "bg-zinc-950 text-white border-zinc-800" : "bg-white text-zinc-950 border-zinc-200"}`}>
          <Check className="w-4 h-4 text-red-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
