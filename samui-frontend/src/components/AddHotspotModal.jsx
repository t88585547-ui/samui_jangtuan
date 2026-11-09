"use client";
import React from "react";
import { Flag, X, Crosshair } from "lucide-react";
import { QUICK_TAMBON_PRESETS } from "../constants/samuiGeoData";

export default function AddHotspotModal({
  isOpen,
  onClose,
  newSpotForm,
  setNewSpotForm,
  onSubmit,
  onActivate3DPinning,
  isLight,
  subCardBg,
  dividerBorder,
  mutedText
}) {
  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md border rounded-xl p-5 shadow-2xl ${
          isLight ? "bg-white border-zinc-300 text-zinc-950" : "bg-zinc-950 border-zinc-800 text-zinc-100"
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 mb-3.5 ${dividerBorder}`}>
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500 fill-red-500" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-500 block font-bold">
                SQLITE HOTSPOT REGISTRATION
              </span>
              <h3 className="text-sm font-bold">ปักธงแจ้งเตือนจุดเสี่ยงภัยใหม่บนเกาะสมุย</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg border cursor-pointer ${subCardBg}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[11px] font-medium ${mutedText}`}>เลือกพิกัดด่วนตามโซนตำบล:</span>
            <button
              type="button"
              onClick={onActivate3DPinning}
              className="text-[10px] font-mono text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Crosshair className="w-3 h-3" />
              คลิกเลือกบนเกาะ 3D
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_TAMBON_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  setNewSpotForm({
                    ...newSpotForm,
                    name: preset.label,
                    tambon: preset.tambon,
                    lat: String(preset.lat),
                    lng: String(preset.lng),
                    risk_type: preset.risk_type,
                    level: preset.level
                  })
                }
                className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition cursor-pointer hover:border-red-500 ${subCardBg}`}
              >
                <span className="font-semibold block truncate">{preset.label}</span>
                <span className={`text-[9px] font-mono ${mutedText}`}>
                  {preset.lat}N, {preset.lng}E
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium mb-1">ชื่อจุดเสี่ยง / สถานที่เกิดเหตุ</label>
            <input
              type="text"
              required
              placeholder="เช่น ชุมชนพรุเฉวงซอย 3"
              value={newSpotForm.name}
              onChange={(e) => setNewSpotForm({ ...newSpotForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none ${subCardBg}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-medium mb-1">ละติจูด (Lat)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newSpotForm.lat}
                onChange={(e) => setNewSpotForm({ ...newSpotForm, lat: e.target.value })}
                className={`w-full px-3 py-1.5 rounded-lg border font-mono ${subCardBg}`}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">ลองจิจูด (Lng)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newSpotForm.lng}
                onChange={(e) => setNewSpotForm({ ...newSpotForm, lng: e.target.value })}
                className={`w-full px-3 py-1.5 rounded-lg border font-mono ${subCardBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-medium mb-1">ประเภทภัยธรรมชาติ</label>
              <select
                value={newSpotForm.risk_type}
                onChange={(e) => setNewSpotForm({ ...newSpotForm, risk_type: e.target.value })}
                className={`w-full px-2.5 py-2 rounded-lg border ${subCardBg}`}
              >
                <option value="น้ำท่วมขังรอการระบาย">น้ำท่วมขังรอการระบาย</option>
                <option value="ดินสไลด์และน้ำป่าไหลหลาก">ดินสไลด์และน้ำป่าไหลหลาก</option>
                <option value="คลื่นลมแรงและน้ำทะเลหนุน">คลื่นลมแรงและน้ำทะเลหนุน</option>
                <option value="หินและดินสไลด์ไหล่ทาง">หินและดินสไลด์ไหล่ทาง</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">ระดับความรุนแรง</label>
              <select
                value={newSpotForm.level}
                onChange={(e) => setNewSpotForm({ ...newSpotForm, level: e.target.value })}
                className={`w-full px-2.5 py-2 rounded-lg border ${subCardBg}`}
              >
                <option value="High">HIGH (ธงแดงวิกฤต)</option>
                <option value="Medium">MEDIUM (เฝ้าระวัง)</option>
                <option value="Low">LOW (เฝ้าระวังต่ำ)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg border font-medium cursor-pointer ${subCardBg}`}>
              ยกเลิก
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer">
              บันทึกและปักธงแดง 3D
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
