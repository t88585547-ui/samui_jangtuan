import {
  SAMUI_CENTER,
  COORD_SCALE,
  SAMUI_PEAKS,
  INITIAL_HOTSPOTS
} from "../constants/samuiGeoData";

export function latLngToXZ(lat, lng) {
  const x = (lng - SAMUI_CENTER.lng) * COORD_SCALE;
  const z = -(lat - SAMUI_CENTER.lat) * COORD_SCALE;
  return [x, z];
}

export function xzToLatLng(x, z) {
  const lng = x / COORD_SCALE + SAMUI_CENTER.lng;
  const lat = -(z / COORD_SCALE) + SAMUI_CENTER.lat;
  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4))
  };
}

export function isPointInIsland(x, z, polyXZ) {
  let inside = false;
  for (let i = 0, j = polyXZ.length - 1; i < polyXZ.length; j = i++) {
    const xi = polyXZ[i][0], zi = polyXZ[i][1];
    const xj = polyXZ[j][0], zj = polyXZ[j][1];
    const intersect =
      zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-10) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function distanceToCoast(x, z, polyXZ) {
  let minD = Infinity;
  for (let i = 0; i < polyXZ.length - 1; i++) {
    const [x1, z1] = polyXZ[i];
    const [x2, z2] = polyXZ[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (lenSq || 1)));
    const d = Math.hypot(x - (x1 + t * dx), z - (z1 + t * dz));
    if (d < minD) minD = d;
  }
  return minD;
}

export function getSamuiTerrainHeight(lat, lng, polyXZ) {
  const [x, z] = latLngToXZ(lat, lng);
  if (!isPointInIsland(x, z, polyXZ)) return 0.06;

  const coastDist = distanceToCoast(x, z, polyXZ);
  const coastalShelf = Math.pow(Math.min(1, coastDist / 1.1), 1.5);

  let rawHeight = 0;
  for (const peak of SAMUI_PEAKS) {
    const dLat = (lat - peak.lat) / peak.rx;
    const dLng = (lng - peak.lng) / peak.rz;
    const distSq = dLat * dLat + dLng * dLng;
    rawHeight += peak.height * Math.exp(-distSq * 0.68);
  }

  const ridgeDetail =
    Math.sin(lat * 220) * Math.cos(lng * 220) * 0.055 +
    Math.sin(lat * 440 + lng * 390) * 0.025;

  const total = Math.max(0, (rawHeight + ridgeDetail) * coastalShelf);
  return 0.14 + total;
}

export function enrichHotspotMetadata(spot, index, polyXZ) {
  const preset = INITIAL_HOTSPOTS.find(
    (p) => p.id === spot.id || p.name === spot.name
  );
  const lat = Number(spot.lat) || 9.512;
  const lng = Number(spot.lng) || 100.013;
  const terrainY = getSamuiTerrainHeight(lat, lng, polyXZ);
  const computedElev = Math.max(2, Math.round(((terrainY - 0.14) / 1.38) * 420));
  const isLandslide = (spot.risk_type || "").includes("ดิน") || computedElev > 35;

  return {
    ...preset,
    ...spot,
    id: spot.id || index + 1,
    code: spot.code || `SM-0${index + 1}`,
    lat,
    lng,
    tambon:
      spot.tambon ||
      preset?.tambon ||
      (lat > 9.54 ? "ต.แม่น้ำ / ต.บ่อผุด" : lat < 9.46 ? "ต.ตลิ่งงาม / ต.มะเร็ต" : "อ.เกาะสมุย"),
    elevation_m: spot.elevation_m ?? preset?.elevation_m ?? computedElev,
    slope_deg: spot.slope_deg ?? preset?.slope_deg ?? (isLandslide ? 29.5 : 2.8),
    safe_zone:
      spot.safe_zone ||
      preset?.safe_zone ||
      "ศูนย์ป้องกันและบรรเทาสาธารณภัย เทศบาลนครเกาะสมุย",
    description:
      spot.description ||
      preset?.description ||
      `จุดเฝ้าระวัง${spot.risk_type} พิกัด ${lat.toFixed(4)}N, ${lng.toFixed(4)}E`
  };
}

export function calculateDynamicSpotRisk(spot, rainMm, windKmh) {
  const baseScore = spot.level === "High" ? 44 : spot.level === "Medium" ? 26 : 14;
  const rain = Number(rainMm || 0);
  const wind = Number(windKmh || 0);
  const isLandslide = (spot.risk_type || "").includes("ดิน") || spot.slope_deg > 18;
  const isCoastal = (spot.risk_type || "").includes("คลื่น") || (spot.risk_type || "").includes("ทะเล");

  let rainImpact = rain * 0.85;
  if (isLandslide) {
    rainImpact = rain * (0.75 + (spot.slope_deg || 20) / 65);
  } else if (spot.elevation_m <= 8) {
    rainImpact = rain * 1.05;
  }

  const windImpact = isCoastal ? Math.max(0, (wind - 12) * 0.7) : Math.max(0, (wind - 15) * 0.25);
  const score = Math.min(99, Math.max(8, Math.round(baseScore + rainImpact + windImpact)));
  const dynamicLevel = score >= 70 ? "High" : score >= 42 ? "Medium" : "Low";

  const estFloodCm =
    spot.elevation_m <= 15
      ? Math.max(0, Math.round(rain * (16 - spot.elevation_m) * 0.085))
      : 0;
  const soilSaturationPct = Math.min(
    99,
    Math.round(32 + rain * 0.78 + (spot.slope_deg || 10) * 0.45)
  );

  return {
    score,
    dynamicLevel,
    isCritical: score >= 70,
    estFloodCm,
    soilSaturationPct,
    metricLabel: isLandslide ? "ความอิ่มตัวดิน" : "ระดับน้ำท่วมคาดการณ์",
    metricValue: isLandslide ? `${soilSaturationPct}%` : `${estFloodCm} ซม.`
  };
}

export function computeWeatherRisk(temp, rainVal, windVal) {
  const rain = Number(rainVal || 0);
  const wind = Number(windVal || 0);
  let risk_status = "ปกติ";

  if (rain >= 30 || wind >= 50) {
    risk_status = "อันตราย (เสี่ยงน้ำท่วมฉับพลัน/ดินสไลด์)";
  } else if (rain >= 5 || wind >= 35) {
    risk_status = "เฝ้าระวัง (มีฝนตกสะสมในพื้นที่)";
  }

  return {
    location: "เกาะสมุย จ.สุราษฎร์ธานี",
    temperature_c: Number(temp).toFixed(1),
    rain_mm: Number(rain.toFixed(1)),
    wind_speed_kmh: Number(wind).toFixed(1),
    risk_status
  };
}
