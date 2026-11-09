import "./globals.css";

export const metadata = {
  title: "SAMUI.GEO//WATCH — ระบบเฝ้าระวังภัยพิบัติ 3 มิติ เกาะสมุย",
  description: "Spatial Disaster Intelligence Platform for Koh Samui"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
