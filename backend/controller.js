import axios from "axios";
import { dbAll, dbRun } from "./db.js";

exports.getHotspots = async (req, res) => {
  try {
    const spots = await dbAll("SELECT * FROM hotspot");
    res.json(spots);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWeather = async (req, res) => {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=9.5120&longitude=100.0136&current=temperature_2m,rain,wind_speed_10m";
    const { data } = await axios.get(url);

    const rain =
      req.query.simRain !== undefined
        ? Number(req.query.simRain)
        : data.current.rain;
    const wind = data.current.wind_speed_10m;

    let status = "ปกติ";
    let color = "#38bdf8";

    if (rain >= 30 || wind >= 50) {
      status = "อันตราย (เสี่ยงน้ำท่วมฉับพลัน/ดินสไลด์)";
      color = "#ef4444";
    } else if (rain >= 5) {
      status = "เฝ้าระวัง (มีฝนตกสะสมในพื้นที่)";
      color = "#f97316";
    }

    res.json({
      location: "เกาะสมุย จ.สุราษฎร์ธานี",
      temperature_c: data.current.temperature_2m,
      rain_mm: rain,
      wind_speed_kmh: wind,
      risk_status: status,
      hologram_color: color,
    });
  } catch (error) {
    res.status(500).json({ error: "ดึงข้อมูลสภาพอากาศไม่สำเร็จ" });
  }
};
