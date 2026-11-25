import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { encryptSecret, hashPassword } from "../utils/auth.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const dataDir = path.join(root, "backend", "data");
export const dbFilePath = path.join(dataDir, "auth.sqlite");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbFilePath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS authorized_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id TEXT UNIQUE,
    passport_hash TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER,
    course TEXT,
    phone TEXT,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    login TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    password_ciphertext TEXT,
    registration_method TEXT NOT NULL DEFAULT 'universityId',
    university_id TEXT UNIQUE,
    passport_ciphertext TEXT UNIQUE,
    verified INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES authorized_students(university_id)
  );
  CREATE TABLE IF NOT EXISTS room_inventory (
    id INTEGER PRIMARY KEY,
    category TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    price TEXT NOT NULL,
    total_rooms INTEGER NOT NULL,
    spots_per_room INTEGER NOT NULL,
    occupied_spots INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    room_title TEXT NOT NULL,
    room_category TEXT NOT NULL,
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    telegram TEXT,
    course TEXT,
    age INTEGER,
    move_in_date TEXT,
    duration TEXT NOT NULL,
    notes TEXT,
    student_account_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS dorm_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT NOT NULL UNIQUE,
    room_type_id INTEGER NOT NULL,
    room_category TEXT NOT NULL,
    floor INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS room_residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dorm_room_id INTEGER NOT NULL,
    booking_id INTEGER,
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    telegram TEXT,
    course TEXT,
    faculty TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
    move_in_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS dorm_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Umumiy',
    content TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'Barcha talabalar',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS gallery_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'rooms',
    image TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'Yotoqxona',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const accountCols = db.prepare("PRAGMA table_info(accounts)").all().map((c) => c.name);
if (!accountCols.includes("age")) db.exec("ALTER TABLE accounts ADD COLUMN age INTEGER");
if (!accountCols.includes("course")) db.exec("ALTER TABLE accounts ADD COLUMN course TEXT");
if (!accountCols.includes("phone")) db.exec("ALTER TABLE accounts ADD COLUMN phone TEXT");
if (!accountCols.includes("avatar")) db.exec("ALTER TABLE accounts ADD COLUMN avatar TEXT");
if (!accountCols.includes("role")) db.exec("ALTER TABLE accounts ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
if (!accountCols.includes("password_ciphertext")) db.exec("ALTER TABLE accounts ADD COLUMN password_ciphertext TEXT");

const invCols = db.prepare("PRAGMA table_info(room_inventory)").all().map((c) => c.name);
if (!invCols.includes("price_num")) db.exec("ALTER TABLE room_inventory ADD COLUMN price_num INTEGER");
if (!invCols.includes("people")) db.exec("ALTER TABLE room_inventory ADD COLUMN people TEXT");
if (!invCols.includes("tag")) db.exec("ALTER TABLE room_inventory ADD COLUMN tag TEXT");
if (!invCols.includes("badge_type")) db.exec("ALTER TABLE room_inventory ADD COLUMN badge_type TEXT");
if (!invCols.includes("floor")) db.exec("ALTER TABLE room_inventory ADD COLUMN floor TEXT");
if (!invCols.includes("size")) db.exec("ALTER TABLE room_inventory ADD COLUMN size TEXT");
if (!invCols.includes("bathroom")) db.exec("ALTER TABLE room_inventory ADD COLUMN bathroom TEXT");
if (!invCols.includes("image")) db.exec("ALTER TABLE room_inventory ADD COLUMN image TEXT");
if (!invCols.includes("gallery_json")) db.exec("ALTER TABLE room_inventory ADD COLUMN gallery_json TEXT");
if (!invCols.includes("description")) db.exec("ALTER TABLE room_inventory ADD COLUMN description TEXT");
if (!invCols.includes("amenities_json")) db.exec("ALTER TABLE room_inventory ADD COLUMN amenities_json TEXT");
if (!invCols.includes("features_json")) db.exec("ALTER TABLE room_inventory ADD COLUMN features_json TEXT");

const dormRoomCols = db.prepare("PRAGMA table_info(dorm_rooms)").all().map((c) => c.name);
if (!dormRoomCols.includes("custom_price")) db.exec("ALTER TABLE dorm_rooms ADD COLUMN custom_price TEXT");
if (!dormRoomCols.includes("image")) db.exec("ALTER TABLE dorm_rooms ADD COLUMN image TEXT");
if (!dormRoomCols.includes("description")) db.exec("ALTER TABLE dorm_rooms ADD COLUMN description TEXT");

const bookingCols = db.prepare("PRAGMA table_info(bookings)").all().map((c) => c.name);
if (!bookingCols.includes("preferred_room_number")) db.exec("ALTER TABLE bookings ADD COLUMN preferred_room_number TEXT");

const msgCols = db.prepare("PRAGMA table_info(contact_messages)").all().map((c) => c.name);
if (!msgCols.includes("status")) db.exec("ALTER TABLE contact_messages ADD COLUMN status TEXT NOT NULL DEFAULT 'new'");
if (!msgCols.includes("admin_note")) db.exec("ALTER TABLE contact_messages ADD COLUMN admin_note TEXT");

const maintCols = db.prepare("PRAGMA table_info(maintenance_requests)").all().map((c) => c.name);
if (!maintCols.includes("reporter_name")) db.exec("ALTER TABLE maintenance_requests ADD COLUMN reporter_name TEXT");
if (!maintCols.includes("admin_note")) db.exec("ALTER TABLE maintenance_requests ADD COLUMN admin_note TEXT");

function seedDefaults() {
  const seedRoom = db.prepare(`
    INSERT OR IGNORE INTO room_inventory (id, category, title, price, total_rooms, spots_per_room, occupied_spots)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  seedRoom.run(1, "two", "01 / 2 Kishilik Yotoqxona", "1 100 000 so‘m", 12, 2, 20);
  seedRoom.run(2, "four", "02 / 4 Kishilik Yotoqxona", "900 000 so‘m", 15, 4, 52);
  seedRoom.run(3, "six", "03 / 6 Kishilik Yotoqxona", "800 000 so‘m", 10, 6, 48);

  const defaultRoomMeta = [
    {
      id: 1,
      priceNum: 1100000,
      people: "2 o‘rin",
      tag: "Tavsiya etiladi",
      badgeType: "recommended",
      floor: "4-qavat",
      size: "24 m²",
      bathroom: "Xona ichida shaxsiy sanuzel",
      image: "/images/room3.jpeg",
      gallery: ["/images/room3.jpeg", "/images/hero-dorm-room.jpeg", "/images/room2.jpeg"],
      description: "Ikkita alohida bir kishilik to‘shak, tabiiy yog‘och tortmalar, 2 ta o‘qish stoli, markaziy isitish, konditsioner va xona ichidagi shaxsiy sanuzel.",
      amenities: [
        "2 ta alohida ortopedik to‘shak",
        "2 ta keng o‘qish stoli va kreslo",
        "Xona ichida shaxsiy sanuzel",
        "Karavot tagidagi keng tortmalar",
        "Markaziy isitish va konditsioner",
        "Yumshoq gilam va zamonaviy interyer"
      ],
      features: ["Shaxsiy sanuzel", "2 ta o‘qish stoli", "Konditsioner", "Wi-Fi 500 Mbps"]
    },
    {
      id: 2,
      priceNum: 900000,
      people: "4 o‘rin",
      tag: "Eng ommabop",
      badgeType: "popular",
      floor: "3-qavat",
      size: "30 m²",
      bathroom: "Umumiy zamonaviy dushxonalar",
      image: "/images/room-4.jpg",
      gallery: ["/images/room-4.jpg", "/images/room3.jpeg", "/images/room-6.jpg"],
      description: "4 kishilik yorug‘ va shinam yotoqxona: 2 ta mustahkam ikki qavatli karavot, o‘qish stoli, ko‘k gilam, karavot osti tortmalari va keng deraza.",
      amenities: [
        "2 ta ikki qavatli mustahkam karavot (4 o‘rin)",
        "O‘qish stoli va devor javoni",
        "Karavot ostidagi saqlash tortmalari",
        "Markaziy isitish va keng deraza",
        "500 Mbit/s optik tolali Wi-Fi",
        "Kunlik umumiy tozalash xizmati"
      ],
      features: ["Wi-Fi 500 Mbps", "O‘qish stoli", "Saqlash tortmalari", "Kunlik tozalash"]
    },
    {
      id: 3,
      priceNum: 800000,
      people: "6 o‘rin",
      tag: "Hamyonbop",
      badgeType: "budget",
      floor: "2-qavat",
      size: "36 m²",
      bathroom: "Umumiy har qavatda (Alohida bloklar)",
      image: "/images/room-6.jpg",
      gallery: ["/images/room-6.jpg", "/images/room-4.jpg", "/images/room3.jpeg"],
      description: "6 talaba uchun mo‘ljallangan keng va zamonaviy xona: 6 ta alohida bir qavatli karavot, shaxsiy yon tumbalar, LED shift yoritgichi va yumshoq gilam.",
      amenities: [
        "6 ta alohida bir qavatli karavot",
        "Har bir karavot yonida shaxsiy tumba",
        "Zamonaviy LED shift yoritgichi",
        "Rolikli parda va yumshoq gilam",
        "500 Mbit/s optik tolali Wi-Fi",
        "Bepul kir yuvish va oshxona"
      ],
      features: ["6 ta alohida karavot", "Yon tumbalar", "LED yoritish", "Wi-Fi 500 Mbps"]
    }
  ];

  const updateMetaStmt = db.prepare(`
    UPDATE room_inventory
    SET price_num = COALESCE(price_num, ?),
        people = COALESCE(people, ?),
        tag = COALESCE(tag, ?),
        badge_type = COALESCE(badge_type, ?),
        floor = COALESCE(floor, ?),
        size = COALESCE(size, ?),
        bathroom = COALESCE(bathroom, ?),
        image = COALESCE(image, ?),
        gallery_json = COALESCE(gallery_json, ?),
        description = COALESCE(description, ?),
        amenities_json = COALESCE(amenities_json, ?),
        features_json = COALESCE(features_json, ?)
    WHERE id = ?
  `);
  for (const m of defaultRoomMeta) {
    updateMetaStmt.run(
      m.priceNum,
      m.people,
      m.tag,
      m.badgeType,
      m.floor,
      m.size,
      m.bathroom,
      m.image,
      JSON.stringify(m.gallery),
      m.description,
      JSON.stringify(m.amenities),
      JSON.stringify(m.features),
      m.id
    );
  }

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM gallery_photos").get()?.cnt || 0) === 0) {
    const insGallery = db.prepare(`
      INSERT INTO gallery_photos (title, category, image, tag)
      VALUES (?, ?, ?, ?)
    `);
    const defaultGallery = [
      ["Yotoqxona Asosiy Binosi", "rooms", "/images/campus-2.jpg", "Bino"],
      ["4 Kishilik Yotoqxona", "rooms", "/images/room-4.jpg", "4 o‘rin"],
      ["6 Kishilik Yotoqxona", "rooms", "/images/room-6.jpg", "6 o‘rin"],
      ["2 Kishilik Yotoqxona", "rooms", "/images/room3.jpeg", "2 o‘rin"],
      ["Keng Talabalar Kutubxonasi", "study", "/images/l1.jpeg", "Mutolaa zali"],
      ["Sokin O‘quv va Kovorking Hududi", "study", "/images/l2.jpeg", "O‘qish zali"],
      ["Guruh Ishlari va Kitobxonlik Zali", "study", "/images/l3.jpeg", "Kovorking"],
      ["Har Bir Qavatdagi Oshxona", "dining", "/images/k1.jpeg", "Pishirish maydoni"],
      ["Umumiy Ovqatlanish Maydoni", "dining", "/images/k2.jpeg", "Oshxona"],
      ["Maishiy Texnika va Jihozlar", "dining", "/images/k3.jpeg", "Jihozlar"],
      ["Ochiq Basketbol Maydonchasi", "sports", "/images/b1.jpeg", "Sport"],
      ["Talabalar Sport Majmuasi", "sports", "/images/b2.webp", "Jismoniy tarbiya"],
      ["Street Workout Maydoni", "sports", "/images/b3.jpeg", "Mashg‘ulot"],
      ["TPU Bosh O‘quv Korpus Fasad", "campus", "/images/d1.jpg", "Universitet binosi"],
      ["Yotoqxona Kirish Maydoni va Hovli", "campus", "/images/d2.jpeg", "Yotoqxona hovlisi"],
      ["Kampus Xiyoboni va Yashil Hudud", "campus", "/images/d3.jpg", "Yashil hudud"],
      ["Yotoqxona Zamonaviy Korpus Binosi", "campus", "/images/d4.jpg", "Turar joy binosi"],
      ["Kechki Yoritilgan Kampus", "campus", "/images/d6.jpeg", "Kechki manzara"],
      ["Talabalar Shaharchasi Umumiy Ko‘rinishi", "campus", "/images/dormitory-building.png", "Bosh me’moriy majmua"],
      ["Universitet Kampusi Panorama", "campus", "/images/university-campus.png", "Kampus"]
    ];
    for (const g of defaultGallery) insGallery.run(...g);
  }

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM dorm_announcements").get()?.cnt || 0) === 0) {
    const insAnn = db.prepare(`
      INSERT INTO dorm_announcements (title, category, content, audience, pinned)
      VALUES (?, ?, ?, ?, ?)
    `);
    insAnn.run(
      "Oylik to‘lov va shartnoma muddatlari eslatmasi",
      "Moliya",
      "Hurmatli talabalar, joriy oy uchun yotoqxona to‘lovini har oyning 10-sanasiga qadar amalga oshirishingizni so‘raymiz.",
      "Barcha qavatlar",
      1
    );
    insAnn.run(
      "4-qavat va 3-qavatda tezkor Wi-Fi routerlari yangilandi",
      "Texnik yangilik",
      "Talabalar murojaatlariga asosan 500 Mbit/s tarmoq qamrovi kengaytirildi. Muammo kuzatilsa texnik xizmatga murojaat qiling.",
      "3 va 4-qavatlar",
      0
    );
  }

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM dorm_rooms").get()?.cnt || 0) === 0) {
    db.transaction(() => {
      const insertDormRoom = db.prepare(`
        INSERT INTO dorm_rooms (room_number, room_type_id, room_category, floor, capacity, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const initialRooms = [
        ["401", 1, "two", 4, 2, "active"],
        ["402", 1, "two", 4, 2, "active"],
        ["403", 1, "two", 4, 2, "active"],
        ["404", 1, "two", 4, 2, "maintenance"],
        ["301", 2, "four", 3, 4, "active"],
        ["302", 2, "four", 3, 4, "active"],
        ["303", 2, "four", 3, 4, "active"],
        ["304", 2, "four", 3, 4, "active"],
        ["201", 3, "six", 2, 6, "active"],
        ["202", 3, "six", 2, 6, "active"],
        ["203", 3, "six", 2, 6, "active"]
      ];
      const roomIds = {};
      for (const r of initialRooms) {
        roomIds[r[0]] = insertDormRoom.run(...r).lastInsertRowid;
      }

      const insertResident = db.prepare(`
        INSERT INTO room_residents (dorm_room_id, booking_id, student_name, phone, telegram, course, faculty, payment_status, move_in_date)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
      `);
      const initialResidents = [
        ["401", "Jasur Karimov", "+998 90 412-11-05", "@jasur_tpu", "3-kurs", "Dasturiy injiniring", "paid", "2026-09-02"],
        ["401", "Azizbek Tursunov", "+998 91 530-44-21", "@aziz_dev", "3-kurs", "Sun’iy intellekt", "paid", "2026-09-02"],
        ["402", "Sardorbek Alimov", "+998 93 771-19-82", "@sardor_ai", "4-kurs", "Kiberxavfsizlik", "pending", "2026-09-05"],
        ["301", "Dilshod Xolmatov", "+998 94 218-63-10", "@dilshod_x", "2-kurs", "Dasturiy injiniring", "paid", "2026-09-01"],
        ["301", "Bekzod Ergashev", "+998 99 305-22-48", "@bekzod_tpu", "2-kurs", "Biznes boshqaruvi", "paid", "2026-09-01"],
        ["301", "Otabek Rahimov", "+998 97 640-87-14", "@otabek_r", "2-kurs", "Iqtisodiyot", "overdue", "2026-09-03"],
        ["302", "Shohrux Nazarov", "+998 90 882-31-90", "@shohrux_n", "1-kurs", "Kiberxavfsizlik", "paid", "2026-09-04"],
        ["302", "Javohir Qodirov", "+998 91 119-40-55", "@javohir_q", "1-kurs", "Dasturiy injiniring", "pending", "2026-09-04"],
        ["201", "Umidjon Sultonov", "+998 95 404-12-77", "@umid_s", "1-kurs", "Moliya va audit", "paid", "2026-09-01"],
        ["201", "Dostonbek Mirzayev", "+998 93 905-66-31", "@doston_m", "1-kurs", "Sun’iy intellekt", "paid", "2026-09-02"],
        ["201", "Asadbek Yo‘ldoshev", "+998 90 231-75-09", "@asad_y", "2-kurs", "Biznes boshqaruvi", "overdue", "2026-09-03"],
        ["202", "Kamronbek Ismoilov", "+998 99 512-08-64", "@kamron_i", "2-kurs", "Dasturiy injiniring", "paid", "2026-09-06"]
      ];
      for (const [roomNum, ...rest] of initialResidents) {
        insertResident.run(roomIds[roomNum], ...rest);
      }

      const insertMaint = db.prepare(`
        INSERT INTO maintenance_requests (room_number, category, description, priority, status)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertMaint.run("404", "Iqlim nazorati", "Konditsioner filtrini tozalash va sovutish tekshiruvi", "high", "in_progress");
      insertMaint.run("302", "Santexnika", "Yuvinish xonasi kranida tomchilash kuzatilmoqda", "medium", "open");
      insertMaint.run("201", "Internet / Wi-Fi", "201-xona yaqinidagi router signalini qayta sozlash", "low", "resolved");
    })();
  }
}

export async function initDatabase() {
  seedDefaults();
  const existingAdmin = db.prepare("SELECT * FROM accounts WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
  if (!existingAdmin) {
    const adminHash = await hashPassword("TPU20206");
    const adminCipher = encryptSecret("TPU20206");
    db.prepare(`
      INSERT INTO accounts (first_name, last_name, age, course, phone, role, login, password_hash, password_ciphertext, registration_method, verified)
      VALUES ('TPU', 'Administrator', NULL, 'Ma’muriyat', '+998 77 129 29 29', 'admin', 'AdminTPU', ?, ?, 'universityId', 1)
    `).run(adminHash, adminCipher);
  } else if (!existingAdmin.password_ciphertext && existingAdmin.login.toLowerCase() === "admintpu") {
    db.prepare("UPDATE accounts SET password_ciphertext = ?, verified = 1 WHERE id = ?").run(
      encryptSecret("TPU20206"),
      existingAdmin.id
    );
  }
}

function parseJsonArray(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function parsePriceDigits(priceText) {
  const digits = String(priceText || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatPriceUzs(num) {
  const n = Math.round(Number(num) || 0);
  return `${n.toLocaleString("ru-RU").replace(/,/g, " ")} so‘m`;
}

export function saveUploadedImage(imageInput, prefix = "room") {
  if (!imageInput || typeof imageInput !== "string") return null;
  const trimmed = imageInput.trim();
  if (!trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  const rawExt = match[1].toLowerCase().replace("jpeg", "jpg").replace("svg+xml", "svg");
  const ext = ["jpg", "png", "webp", "gif", "svg"].includes(rawExt) ? rawExt : "jpg";
  const buffer = Buffer.from(match[2], "base64");
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const pubUploadDir = path.join(root, "public", "images", "uploads");
  fs.mkdirSync(pubUploadDir, { recursive: true });
  fs.writeFileSync(path.join(pubUploadDir, fileName), buffer);

  const distDir = path.join(root, "dist", "images", "uploads");
  if (fs.existsSync(path.join(root, "dist"))) {
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, fileName), buffer);
  }

  return `/images/uploads/${fileName}`;
}

export function getAvailableImages() {
  const imagesDir = path.join(root, "public", "images");
  const out = [];
  if (fs.existsSync(imagesDir)) {
    for (const entry of fs.readdirSync(imagesDir, { withFileTypes: true })) {
      if (entry.isFile() && /\.(jpe?g|png|webp|svg)$/i.test(entry.name)) {
        out.push(`/images/${entry.name}`);
      }
    }
    const uploadsDir = path.join(imagesDir, "uploads");
    if (fs.existsSync(uploadsDir)) {
      for (const entry of fs.readdirSync(uploadsDir, { withFileTypes: true })) {
        if (entry.isFile() && /\.(jpe?g|png|webp|svg)$/i.test(entry.name)) {
          out.unshift(`/images/uploads/${entry.name}`);
        }
      }
    }
  }
  return out;
}

export function getGalleryPhotos() {
  return db.prepare("SELECT * FROM gallery_photos ORDER BY id DESC").all().map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    image: g.image,
    tag: g.tag,
    createdAt: g.created_at
  }));
}

export function formatRoomInventory(row) {
  const totalSpots = row.total_rooms * row.spots_per_room;
  const availableSpots = Math.max(0, totalSpots - row.occupied_spots);
  const priceNum = row.price_num || parsePriceDigits(row.price) || 900000;
  const mainImage = row.image || "/images/room3.jpeg";
  const gallery = parseJsonArray(row.gallery_json, [mainImage]);
  if (gallery.length === 0 || gallery[0] !== mainImage) {
    const withoutMain = gallery.filter((g) => g !== mainImage);
    gallery.splice(0, gallery.length, mainImage, ...withoutMain);
  }
  const features = parseJsonArray(row.features_json, ["Wi-Fi 500 Mbps", "O‘qish stoli", "Kunlik tozalash"]);
  const amenities = parseJsonArray(row.amenities_json, [
    `${row.spots_per_room} o‘rinli qulay karavot va matras`,
    "500 Mbit/s optik tolali Wi-Fi",
    "Markaziy isitish va yoritish",
    "Kunlik tozalash xizmati"
  ]);
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    people: row.people || `${row.spots_per_room} o‘rin`,
    capacityNumber: row.spots_per_room,
    price: row.price,
    priceNum,
    tag: row.tag || "Zamonaviy",
    badgeType: row.badge_type || "popular",
    floor: row.floor || "3-qavat",
    size: row.size || `${18 + row.spots_per_room * 3} m²`,
    bathroom: row.bathroom || "Umumiy zamonaviy sanuzel",
    image: mainImage,
    gallery,
    description: row.description || `${row.spots_per_room} nafar talaba uchun barcha qulayliklarga ega zamonaviy va shinam xona.`,
    amenities,
    features,
    totalRooms: row.total_rooms,
    spotsPerRoom: row.spots_per_room,
    totalSpots,
    occupiedSpots: row.occupied_spots,
    availableSpots
  };
}

export function getAdminDormRooms() {
  const dormRooms = db.prepare(`
    SELECT d.*, i.title AS type_title, i.price AS monthly_price, i.image AS type_image, i.description AS type_description
    FROM dorm_rooms d
    LEFT JOIN room_inventory i ON i.id = d.room_type_id
    ORDER BY d.floor DESC, d.room_number ASC
  `).all();
  const residents = db.prepare("SELECT * FROM room_residents ORDER BY id ASC").all();
  const byRoom = new Map();
  for (const res of residents) {
    if (!byRoom.has(res.dorm_room_id)) byRoom.set(res.dorm_room_id, []);
    byRoom.get(res.dorm_room_id).push({
      id: res.id,
      dormRoomId: res.dorm_room_id,
      bookingId: res.booking_id,
      studentName: res.student_name,
      phone: res.phone,
      telegram: res.telegram,
      course: res.course,
      faculty: res.faculty,
      paymentStatus: res.payment_status,
      moveInDate: res.move_in_date,
      createdAt: res.created_at
    });
  }
  return dormRooms.map((r) => {
    const occupants = byRoom.get(r.id) || [];
    const effectivePrice = r.custom_price || r.monthly_price || "900 000 so‘m";
    return {
      id: r.id,
      roomNumber: r.room_number,
      roomTypeId: r.room_type_id,
      roomCategory: r.room_category,
      typeTitle: r.type_title || `${r.capacity} kishilik`,
      monthlyPrice: effectivePrice,
      customPrice: r.custom_price || "",
      image: r.image || r.type_image || "/images/room3.jpeg",
      description: r.description || r.type_description || "",
      floor: r.floor,
      capacity: r.capacity,
      occupied: occupants.length,
      available: Math.max(0, r.capacity - occupants.length),
      status: r.status,
      residents: occupants
    };
  });
}

export function getAdminResidents() {
  return db.prepare(`
    SELECT rr.*, d.room_number, d.floor, d.room_category, d.capacity, d.custom_price, d.image AS room_image,
           i.title AS type_title, i.price AS monthly_price, i.image AS type_image
    FROM room_residents rr
    JOIN dorm_rooms d ON d.id = rr.dorm_room_id
    LEFT JOIN room_inventory i ON i.id = d.room_type_id
    ORDER BY rr.id DESC
  `).all().map((row) => ({
    id: row.id,
    dormRoomId: row.dorm_room_id,
    roomNumber: row.room_number,
    floor: row.floor,
    roomCategory: row.room_category,
    capacity: row.capacity,
    typeTitle: row.type_title || "",
    monthlyPrice: row.custom_price || row.monthly_price || "",
    roomImage: row.room_image || row.type_image || "/images/room3.jpeg",
    bookingId: row.booking_id,
    studentName: row.student_name,
    phone: row.phone,
    telegram: row.telegram,
    course: row.course,
    faculty: row.faculty,
    paymentStatus: row.payment_status,
    moveInDate: row.move_in_date,
    createdAt: row.created_at
  }));
}

export function getAdminMaintenance() {
  return db.prepare(`
    SELECT * FROM maintenance_requests
    ORDER BY
      CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
      id DESC
  `).all().map((m) => ({
    id: m.id,
    roomNumber: m.room_number,
    category: m.category,
    description: m.description,
    priority: m.priority,
    status: m.status,
    reporterName: m.reporter_name || "",
    adminNote: m.admin_note || "",
    createdAt: m.created_at,
    updatedAt: m.updated_at
  }));
}

export function getAnnouncements() {
  return db.prepare(`
    SELECT * FROM dorm_announcements
    ORDER BY pinned DESC, id DESC
  `).all().map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    content: a.content,
    audience: a.audience,
    pinned: Boolean(a.pinned),
    createdAt: a.created_at
  }));
}

export function getPublicDormRooms() {
  return getAdminDormRooms().map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    roomTypeId: r.roomTypeId,
    roomCategory: r.roomCategory,
    typeTitle: r.typeTitle,
    monthlyPrice: r.monthlyPrice,
    customPrice: r.customPrice,
    image: r.image,
    description: r.description,
    floor: r.floor,
    capacity: r.capacity,
    occupied: r.occupied,
    available: r.available,
    status: r.status
  }));
}

export function getStudentPortalData(account) {
  if (!account) return null;
  const fullName = `${account.first_name} ${account.last_name}`.trim().toLowerCase();
  const cleanPhone = String(account.phone || "").trim();

  const allBookings = db.prepare(`
    SELECT b.*, dr.room_number AS assigned_room_number, rr.payment_status AS resident_payment_status
    FROM bookings b
    LEFT JOIN room_residents rr ON rr.booking_id = b.id
    LEFT JOIN dorm_rooms dr ON dr.id = rr.dorm_room_id
    ORDER BY b.id DESC
  `).all();

  const myBookings = allBookings
    .filter(
      (b) =>
        b.student_account_id === account.id ||
        b.student_name.trim().toLowerCase() === fullName ||
        (cleanPhone && b.phone.trim() === cleanPhone)
    )
    .map((b) => ({
      id: b.id,
      roomId: b.room_id,
      roomTitle: b.room_title,
      roomCategory: b.room_category,
      preferredRoomNumber: b.preferred_room_number || "",
      assignedRoomNumber: b.assigned_room_number || "",
      moveInDate: b.move_in_date || "",
      duration: b.duration,
      notes: b.notes || "",
      status: b.status,
      adminNote: b.admin_note || "",
      createdAt: b.created_at
    }));

  const allResidents = getAdminResidents();
  const matchedResident = allResidents.find(
    (r) =>
      myBookings.some((b) => b.id === r.bookingId) ||
      r.studentName.trim().toLowerCase() === fullName ||
      (cleanPhone && r.phone.trim() === cleanPhone)
  );

  let myResidency = null;
  if (matchedResident) {
    const roommates = allResidents
      .filter((r) => r.dormRoomId === matchedResident.dormRoomId && r.id !== matchedResident.id)
      .map((r) => ({
        id: r.id,
        studentName: r.studentName,
        course: r.course || "",
        faculty: r.faculty || ""
      }));
    myResidency = {
      id: matchedResident.id,
      dormRoomId: matchedResident.dormRoomId,
      roomNumber: matchedResident.roomNumber,
      floor: matchedResident.floor,
      capacity: matchedResident.capacity,
      typeTitle: matchedResident.typeTitle,
      monthlyPrice: matchedResident.monthlyPrice,
      paymentStatus: matchedResident.paymentStatus,
      moveInDate: matchedResident.moveInDate,
      faculty: matchedResident.faculty,
      roommates
    };
  }

  const allMaint = getAdminMaintenance();
  const myMaintenance = allMaint.filter(
    (m) =>
      (myResidency && m.roomNumber === myResidency.roomNumber) ||
      (m.reporterName && m.reporterName.trim().toLowerCase() === fullName)
  );

  return {
    myBookings,
    myResidency,
    myMaintenance
  };
}
