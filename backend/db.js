import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./samui.sqlite");

db.serialize(() => {
  db.run(`
        CREATE TABLE IF NOT EXISTS hotspot (
        id INTEGER PRMARY KEY AUTOINCREMENT,
        name TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        risk_type TEXT,
        level TEXT
        )
    `);

  db.get("SELECT COUNT(*) as count from hotspot", (err, row) => {
    const seeds = [
      ["พรุเฉวง", 9.512, 100.06, "น้ำท่วมขังซ้ำซาก", "High"],
      ["แม่น้ำ (ซอยป่าตาก)", 9.554, 100.002, "ดินสไลด์และน้ำป่า", "High"],
      ["ท่าเรือหน้าทอน", 9.471, 99.941, "คลื่นลมแรง/น้ำทะเลหนุน", "Medium"],
      ["บ่อผุด (ถนนสายหลัก)", 9.56, 100.03, "น้ำท่วมผิวจราจร", "Medium"],
      ["เขาตลิ่งงาม", 9.445, 99.965, "หินและดินสไลด์ไหล่ทาง", "Low"],
    ];
    const stmt = db.prepare("INSERT INTO hotspot (name, lat, lng, risk_type, level) VALUES (?, ?, ?, ?, ?)");
    seeds.forEach((item) => stmt.run(item));
    stmt.finalize();
    console.log("🤑🤑🤑")
  });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const dbRun = (sqlm, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
    });
});

module.exports = { dbAll, dbRun };