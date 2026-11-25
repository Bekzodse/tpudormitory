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
  CREATE TABLE IF NOT EXISTS gallery_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS gallery_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'rooms',
    image TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'Yotoqxona',
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS site_bottom_texts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL DEFAULT 'gallery',
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    badge TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS homepage_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    eyebrow_badge TEXT NOT NULL,
    eyebrow_status TEXT NOT NULL,
    title_prefix TEXT NOT NULL,
    title_highlight TEXT NOT NULL,
    title_suffix TEXT NOT NULL,
    lead_text TEXT NOT NULL,
    stats_json TEXT NOT NULL,
    hero_photos_json TEXT NOT NULL,
    footer_about TEXT NOT NULL DEFAULT '',
    footer_copyright TEXT NOT NULL DEFAULT '',
    gallery_title TEXT NOT NULL DEFAULT '',
    gallery_subtitle TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS faq_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS support_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_key TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    course TEXT,
    room_title TEXT,
    assigned_room_number TEXT,
    booking_id INTEGER,
    student_account_id INTEGER,
    status TEXT NOT NULL DEFAULT 'open',
    unread_admin INTEGER NOT NULL DEFAULT 0,
    unread_student INTEGER NOT NULL DEFAULT 0,
    last_message TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS support_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
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

const galleryCols = db.prepare("PRAGMA table_info(gallery_photos)").all().map((c) => c.name);
if (!galleryCols.includes("description")) db.exec("ALTER TABLE gallery_photos ADD COLUMN description TEXT NOT NULL DEFAULT ''");

const homeCols = db.prepare("PRAGMA table_info(homepage_settings)").all().map((c) => c.name);
if (!homeCols.includes("footer_about")) db.exec("ALTER TABLE homepage_settings ADD COLUMN footer_about TEXT NOT NULL DEFAULT ''");
if (!homeCols.includes("footer_copyright")) db.exec("ALTER TABLE homepage_settings ADD COLUMN footer_copyright TEXT NOT NULL DEFAULT ''");
if (!homeCols.includes("gallery_title")) db.exec("ALTER TABLE homepage_settings ADD COLUMN gallery_title TEXT NOT NULL DEFAULT ''");
if (!homeCols.includes("gallery_subtitle")) db.exec("ALTER TABLE homepage_settings ADD COLUMN gallery_subtitle TEXT NOT NULL DEFAULT ''");

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

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM gallery_categories").get()?.cnt || 0) === 0) {
    const insCat = db.prepare(`
      INSERT INTO gallery_categories (slug, name, description, sort_order)
      VALUES (?, ?, ?, ?)
    `);
    const defaultCats = [
      ["rooms", "Xonalar", "2, 4 va 6 kishilik zamonaviy jihozlangan talabalar yotoqxona xonalari.", 1],
      ["study", "Kutubxona", "Sokin mutolaa zallari, kovorking va yuqori tezlikdagi Wi-Fi o‘quv hududlari.", 2],
      ["dining", "Oshxona", "Har bir qavatda zamonaviy maishiy texnikalar bilan jihozlangan oshxona va ovqatlanish maydoni.", 3],
      ["sports", "Sport", "Basketbol maydonchasi, street workout va sog‘lom turmush tarzi uchun sport majmuasi.", 4],
      ["campus", "Kampus", "Tashkent Perfect University bosh korpusi, yashil xiyobon va yotoqxona hovlisi.", 5]
    ];
    for (const c of defaultCats) insCat.run(...c);
  }

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM gallery_photos").get()?.cnt || 0) === 0) {
    const insGallery = db.prepare(`
      INSERT INTO gallery_photos (title, category, image, tag, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    const defaultGallery = [
      ["Yotoqxona Asosiy Binosi", "rooms", "/images/campus-2.jpg", "Bino", "Zamonaviy me’morchilik asosida qurilgan TPU talabalar turar joyi bosh binosi."],
      ["4 Kishilik Yotoqxona", "rooms", "/images/room-4.jpg", "4 o‘rin", "Yorug‘ va keng 4 o‘rinli xona: ikki qavatli mustahkam karavotlar, shaxsiy tortmalar va o‘qish stoli."],
      ["6 Kishilik Yotoqxona", "rooms", "/images/room-6.jpg", "6 o‘rin", "Hamyonbop va shinam 6 kishilik xona: har bir talaba uchun alohida karavot va tumba."],
      ["2 Kishilik Yotoqxona", "rooms", "/images/room3.jpeg", "2 o‘rin", "Shaxsiy sanuzel, konditsioner va 2 ta keng o‘qish stoli bilan jihozlangan 2 kishilik xona."],
      ["Keng Talabalar Kutubxonasi", "study", "/images/l1.jpeg", "Mutolaa zali", "Talabalar dars tayyorlashi va ilmiy izlanishlari uchun boy kitob fondiga ega sokin kutubxona."],
      ["Sokin O‘quv va Kovorking Hududi", "study", "/images/l2.jpeg", "O‘qish zali", "Tezkor 500 Mbit/s Wi-Fi va elektr rozetkalari bilan ta’minlangan individual o‘quv stollari."],
      ["Guruh Ishlari va Kitobxonlik Zali", "study", "/images/l3.jpeg", "Kovorking", "Loyiha va taqdimotlar ustida jamoaviy ishlash uchun mo‘ljallangan zamonaviy kovorking hududi."],
      ["Har Bir Qavatdagi Oshxona", "dining", "/images/k1.jpeg", "Pishirish maydoni", "Elektr plitalar, mikroto‘lqinli pech, muzlatgich va toza suv filtrlari bilan jihozlangan oshxona."],
      ["Umumiy Ovqatlanish Maydoni", "dining", "/images/k2.jpeg", "Oshxona", "Talabalar birgalikda ovqatlanishi va suhbatlashishi uchun shinam oshxona stollari."],
      ["Maishiy Texnika va Jihozlar", "dining", "/images/k3.jpeg", "Jihozlar", "Kunlik foydalanish uchun barcha zarur maishiy texnikalar bepul taqdim etiladi."],
      ["Ochiq Basketbol Maydonchasi", "sports", "/images/b1.jpeg", "Sport", "Darsdan bo‘sh vaqtda jamoaviy sport o‘yinlari o‘tkazish uchun maxsus qoplamali maydon."],
      ["Talabalar Sport Majmuasi", "sports", "/images/b2.webp", "Jismoniy tarbiya", "Sog‘lom turmush tarzi va jismoniy mashg‘ulotlar uchun barcha sharoitlarga ega sport zali."],
      ["Street Workout Maydoni", "sports", "/images/b3.jpeg", "Mashg‘ulot", "Ochiq havoda turnik, brus va kuch mashqlari bilan shug‘ullanish uchun workout hududi."],
      ["TPU Bosh O‘quv Korpus Fasad", "campus", "/images/d1.jpg", "Universitet binosi", "Yotoqxonadan piyoda bor-yo‘g‘i 3 daqiqalik masofada joylashgan universitet o‘quv binosi."],
      ["Yotoqxona Kirish Maydoni va Hovli", "campus", "/images/d2.jpeg", "Yotoqxona hovlisi", "24/7 videokuzatuv va Face ID nazorati ostidagi xavfsiz kirish maydoni."],
      ["Kampus Xiyoboni va Yashil Hudud", "campus", "/images/d3.jpg", "Yashil hudud", "Manzarali daraxtlar va o‘rindiqlar bilan bezatilgan toza havoli talabalar xiyoboni."],
      ["Yotoqxona Zamonaviy Korpus Binosi", "campus", "/images/d4.jpg", "Turar joy binosi", "Issiqlik va ovoz izolyatsiyasiga ega ko‘p qavatli yangi yotoqxona korpusi."],
      ["Kechki Yoritilgan Kampus", "campus", "/images/d6.jpeg", "Kechki manzara", "Kechki paytda to‘liq LED chiroqlar bilan yoritilgan xavfsiz va go‘zal kampus manzarasi."],
      ["Talabalar Shaharchasi Umumiy Ko‘rinishi", "campus", "/images/dormitory-building.png", "Bosh me’moriy majmua", "O‘quv binolari, yotoqxona, sport va dam olish maskanlarini birlashtirgan yagona majmua."],
      ["Universitet Kampusi Panorama", "campus", "/images/university-campus.png", "Kampus", "Tashkent Perfect University zamonaviy talabalar shaharchasining yuqoridan ko‘rinishi."]
    ];
    for (const g of defaultGallery) insGallery.run(...g);
  } else {
    db.prepare(`
      UPDATE gallery_photos
      SET description = CASE category
        WHEN 'rooms' THEN title || ' — zamonaviy mebel, ortopedik matras va tezkor Wi-Fi bilan jihozlangan shinam xona.'
        WHEN 'study' THEN title || ' — talabalar sokin mutolaa qilishi va dars tayyorlashi uchun qulay o‘quv hududi.'
        WHEN 'dining' THEN title || ' — barcha zarur maishiy texnika va jihozlarga ega toza oshxona maydoni.'
        WHEN 'sports' THEN title || ' — talabalarning bo‘sh vaqtini mazmunli va sog‘lom o‘tkazishi uchun sport maskani.'
        ELSE title || ' — Tashkent Perfect University talabalar shaharchasi va yotoqxona majmuasi.'
      END
      WHERE description IS NULL OR TRIM(description) = ''
    `).run();
  }

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM site_bottom_texts").get()?.cnt || 0) === 0) {
    const insBottom = db.prepare(`
      INSERT INTO site_bottom_texts (section, title, content, badge, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const defaultBottomTexts = [
      [
        "gallery",
        "100% Haqiqiy Kampus va Xona Suratlari",
        "Fotogalereyadagi barcha rasmlar Tashkent Perfect University talabalar turar joyi, xonalari va o‘quv korpuslaridan olingan haqiqiy suratlardir.",
        "Original foto",
        1
      ],
      [
        "gallery",
        "Barcha Jihozlar va Qulayliklar Tayyor",
        "Har bir xonada ortopedik to‘shak, shaxsiy o‘qish stoli, kiyim shkafi, konditsioner, markaziy isitish va 500 Mbit/s optik Wi-Fi mavjud.",
        "To‘liq jihozlangan",
        2
      ],
      [
        "gallery",
        "Jonli Ekskursiya va Ko‘zdankechirish",
        "Yotoqxonaga kelib xonalar, oshxona, kutubxona va sport maydonchalarini ota-onangiz bilan birga bevosita ko‘rishingiz mumkin (Dush–Shan 09:00–18:00).",
        "Ochiq eshiklar",
        3
      ],
      ["homepage", "Barcha to‘lovlar narx ichida", "Elektr, issiq-sovuq suv va internet oylik to‘lov ichida", "100%", 1],
      ["homepage", "500 Mbit/s Tezkor Wi-Fi", "Har bir qavatda optik tolali yuqori tezlikdagi internet", "Wi-Fi 6", 2],
      ["homepage", "24/7 Smart Face ID", "Turniket va videokuzatuv orqali doimiy xavfsizlik", "Xavfsiz", 3],
      ["homepage", "Bepul kir yuvish majmuasi", "Zamonaviy kir yuvish va quritish mashinalari bepul", "Bepul", 4],
      ["homepage", "Sokin kutubxona va kovorking", "24 soat ochiq mutolaa va guruh ishlari zali", "Kovorking", 5],
      ["homepage", "Fitness zali & Street Workout", "Basketbol va ochiq sport maydonchalari", "Sport", 6],
      ["homepage", "Har bir qavatda oshxona", "Muzlatgich, elektr plita va mikroto‘lqinli pechlar", "Oshxona", 7],
      ["homepage", "Universitetgacha 3 daqiqa", "O‘quv korpuslari bilan bitta kampus hududida", "Yaqin", 8]
    ];
    for (const bt of defaultBottomTexts) insBottom.run(...bt);
  }

  if (!db.prepare("SELECT id FROM homepage_settings WHERE id = 1").get()) {
    const defaultStats = [
      { value: "500+", label: "Talaba sig‘imi" },
      { value: "24/7", label: "Face ID xavfsizlik" },
      { value: "3 min", label: "Universitetgacha" },
      { value: "100%", label: "Kommunal ichida" }
    ];
    const defaultHeroPhotos = [
      { id: "hero-2", title: "TPU Yotoqxona Asosiy Fasadi", image: "/images/campus-2.jpg", tag: "Bosh korpus" },
      { id: "hero-1", title: "Yotoqxona Kirish Qismi", image: "/images/campus-1.jpg", tag: "Kirish maydoni" },
      { id: "hero-3", title: "Kampus Xiyoboni va Yotoqxona", image: "/images/campus-3.jpg", tag: "Kampus" },
      { id: "hero-4", title: "Yotoqxona Hovlisi va Korpus", image: "/images/campus-4.jpg", tag: "Hovli" }
    ];
    db.prepare(`
      INSERT INTO homepage_settings (
        id, eyebrow_badge, eyebrow_status, title_prefix, title_highlight, title_suffix,
        lead_text, stats_json, hero_photos_json
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "TPU SMART ACCOMMODATION",
      "Qabul davom etmoqda",
      "Talabalar uchun yangi avlod",
      "aqlli va qulay",
      "yotoqxonasi",
      "Tashkent Perfect University talabalari uchun yaratilgan xavfsiz, zamonaviy va hamyonbop turar joy. Barcha kommunal to‘lovlar, 500 Mbit/s Wi-Fi, 24/7 Face ID xavfsizlik va sokin o‘qish zallari siz uchun muhayyo.",
      JSON.stringify(defaultStats),
      JSON.stringify(defaultHeroPhotos)
    );
  }

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM faq_items").get()?.cnt || 0) === 0) {
    const insFaq = db.prepare(`
      INSERT INTO faq_items (question, answer, sort_order)
      VALUES (?, ?, ?)
    `);
    const defaultFaqs = [
      [
        "Kommunal to‘lovlar (elektr, suv, isitish, Wi-Fi) oylik to‘lov ichidami?",
        "Ha, 100%! Barcha kommunal to‘lovlar (sovuq va issiq suv, elektr energiyasi, markaziy isitish, kunlik umumiy tozalash va 500 Mbit/s optik Wi-Fi internet) oylik to‘lov ichiga kiritilgan. Hech qanday yashirin yoki kutilmagan to‘lovlar yo‘q."
      ],
      [
        "Yotoqxonaga kirish-chiqish vaqti cheklanganmi?",
        "Yotoqxona 24/7 Smart Face-ID tizimi bilan jihozlangan. Talabalar xavfsizligi va sokin o‘qish muhitini ta’minlash maqsadida kechki soat 23:00 dan 06:00 gacha sokinlik tartibi amal qiladi. Kechki dars yoki ishda bo‘lgan talabalar oldindan xabar berib ruxsatnoma bilan kirishlari mumkin."
      ],
      [
        "Xonadoshni o‘zim tanlashim mumkinmi?",
        "Albatta! Birgalikda ariza topshirgan do‘stlar, kursdoshlar yoki bir fakultet talabalari bir xonaga joylashtiriladi. Onlayn arizangizdagi 'Qo‘shimcha istaklar' maydoniga do‘stingizning ism-familiyasini kiritishingiz kifoya."
      ],
      [
        "Ota-onalar yoki yaqinlar yotoqxonaga mehmonga kela oladimi?",
        "Ha, har kuni soat 09:00 dan 20:00 gacha ota-onalar va yaqinlar maxsus qabulxona (reception) va 1-qavatdagi umumiy dam olish zalida talabalar bilan uchrashishlari mumkin. Xavfsizlik yuzasidan mehmonlar shaxsini tasdiqlovchi hujjat bilan ro‘yxatga olinadi."
      ],
      [
        "Kir yuvish va dazmollash uchun alohida pul to‘lanadimi?",
        "Yo‘q! Har bir qavatdagi zamonaviy kir yuvish va quritish xonalari hamda dazmollash stollari barcha yashovchi talabalar uchun mutlaqo bepul taqdim etiladi."
      ],
      [
        "To‘lov tartibi qanday amalga oshiriladi?",
        "To‘lovlarni oylik, semestrlik yoki yillik tarzda Payme, Click, Uzum Bank yoki bank rekvizitlari orqali onlayn amalga oshirish mumkin. Bir semestr yoki to‘liq yil uchun oldindan to‘lov qilgan talabalarga maxsus 10% gacha chegirma taqdim etiladi."
      ],
      [
        "Yotoqxonadan universitet o‘quv korpuslarigacha bo‘lgan masofa qancha?",
        "Yotoqxona bevosita universitet talabalar shaharchasida (kampus ichida) joylashgan bo‘lib, asosiy o‘quv korpuslarigacha piyoda bor-yo‘g‘i 3-5 daqiqalik yo‘l."
      ]
    ];
    defaultFaqs.forEach(([q, a], idx) => insFaq.run(q, a, idx + 1));
  }

  if ((db.prepare("SELECT COUNT(*) AS cnt FROM support_chats").get()?.cnt || 0) === 0) {
    const insChat = db.prepare(`
      INSERT INTO support_chats (
        thread_key, student_name, phone, course, room_title, assigned_room_number,
        booking_id, student_account_id, status, unread_admin, unread_student, last_message
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 'open', ?, 0, ?)
    `);
    const insMsg = db.prepare(`
      INSERT INTO support_chat_messages (chat_id, sender_role, sender_name, message)
      VALUES (?, ?, ?, ?)
    `);

    const c1 = insChat.run(
      "phone-998904121105",
      "Jasur Karimov",
      "+998 90 412-11-05",
      "3-kurs",
      "01 / 2 Kishilik Yotoqxona",
      "401",
      1,
      "Shartnomani qaysi xonadan olsam bo‘ladi?"
    ).lastInsertRowid;
    insMsg.run(c1, "student", "Jasur Karimov", "Assalomu alaykum! Arizam qabul qilindi, 401-xonaga joylashish uchun shartnomani qaysi xonadan olsam bo‘ladi?");
    insMsg.run(c1, "admin", "TPU Ma’muriyati", "Va alaykum assalom, Jasur! 1-qavatdagi yotoqxona ma’muriyati (102-xona) ga pasportingiz bilan kelishingiz mumkin.");
    insMsg.run(c1, "student", "Jasur Karimov", "Rahmat! Shartnomani qaysi xonadan olsam bo‘ladi va soat nechagacha ochiq?");

    const c2 = insChat.run(
      "phone-998937711982",
      "Sardorbek Alimov",
      "+998 93 771-19-82",
      "4-kurs",
      "01 / 2 Kishilik Yotoqxona",
      "402",
      1,
      "Oylik to‘lovni Payme orqali qilsam bo‘ladimi?"
    ).lastInsertRowid;
    insMsg.run(c2, "student", "Sardorbek Alimov", "Assalomu alaykum, men 2 kishilik xonaga ariza topshirgan edim. Oylik to‘lovni Payme orqali qilsam bo‘ladimi?");
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

export function slugifyCategory(input) {
  const cleaned = String(input || "")
    .toLowerCase()
    .replace(/o['‘’`]/g, "o")
    .replace(/g['‘’`]/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || `section-${Date.now().toString(36)}`;
}

export function ensureGalleryCategory({ slug, name, description = "" }) {
  const cleanName = String(name || slug || "Yangi bo‘lim").trim();
  const cleanSlug = slugifyCategory(slug || cleanName);
  const existing = db.prepare("SELECT * FROM gallery_categories WHERE slug = ? OR LOWER(name) = LOWER(?)").get(cleanSlug, cleanName);
  if (existing) {
    if (description && !existing.description) {
      db.prepare("UPDATE gallery_categories SET description = ? WHERE id = ?").run(String(description).trim(), existing.id);
    }
    return db.prepare("SELECT * FROM gallery_categories WHERE id = ?").get(existing.id);
  }
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_ord FROM gallery_categories").get()?.max_ord || 0;
  const res = db.prepare(`
    INSERT INTO gallery_categories (slug, name, description, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(cleanSlug, cleanName, String(description || "").trim(), maxOrder + 1);
  return db.prepare("SELECT * FROM gallery_categories WHERE id = ?").get(res.lastInsertRowid);
}

export function getGalleryCategories() {
  const cats = db.prepare("SELECT * FROM gallery_categories ORDER BY sort_order ASC, id ASC").all();
  const counts = db.prepare("SELECT category, COUNT(*) AS cnt FROM gallery_photos GROUP BY category").all();
  const countMap = new Map(counts.map((c) => [c.category, c.cnt]));

  for (const row of counts) {
    if (row.category && !cats.some((c) => c.slug === row.category)) {
      const created = ensureGalleryCategory({ slug: row.category, name: row.category });
      cats.push(created);
    }
  }

  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description || "",
    sortOrder: c.sort_order,
    photoCount: countMap.get(c.slug) || 0,
    createdAt: c.created_at
  }));
}

export function getGalleryPhotos() {
  const cats = db.prepare("SELECT slug, name FROM gallery_categories").all();
  const catMap = new Map(cats.map((c) => [c.slug, c.name]));
  return db.prepare("SELECT * FROM gallery_photos ORDER BY id DESC").all().map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    categoryName: catMap.get(g.category) || g.category,
    image: g.image,
    tag: g.tag,
    description: g.description || "",
    createdAt: g.created_at
  }));
}

export function getSiteBottomTexts(section = null) {
  const rows = section
    ? db.prepare("SELECT * FROM site_bottom_texts WHERE section = ? ORDER BY sort_order ASC, id ASC").all(String(section))
    : db.prepare("SELECT * FROM site_bottom_texts ORDER BY section ASC, sort_order ASC, id ASC").all();
  return rows.map((r) => ({
    id: r.id,
    section: r.section,
    title: r.title,
    content: r.content || "",
    badge: r.badge || "",
    sortOrder: r.sort_order,
    createdAt: r.created_at
  }));
}

export function getHomepageSettings() {
  const row = db.prepare("SELECT * FROM homepage_settings WHERE id = 1").get();
  if (!row) return null;
  const stats = parseJsonArray(row.stats_json, [
    { value: "500+", label: "Talaba sig‘imi" },
    { value: "24/7", label: "Face ID xavfsizlik" },
    { value: "3 min", label: "Universitetgacha" },
    { value: "100%", label: "Kommunal ichida" }
  ]);
  const heroPhotos = parseJsonArray(row.hero_photos_json, [
    { id: "hero-2", title: "TPU Yotoqxona Asosiy Fasadi", image: "/images/campus-2.jpg", tag: "Bosh korpus" },
    { id: "hero-1", title: "Yotoqxona Kirish Qismi", image: "/images/campus-1.jpg", tag: "Kirish maydoni" },
    { id: "hero-3", title: "Kampus Xiyoboni va Yotoqxona", image: "/images/campus-3.jpg", tag: "Kampus" },
    { id: "hero-4", title: "Yotoqxona Hovlisi va Korpus", image: "/images/campus-4.jpg", tag: "Hovli" }
  ]);
  return {
    eyebrowBadge: row.eyebrow_badge,
    eyebrowStatus: row.eyebrow_status,
    titlePrefix: row.title_prefix,
    titleHighlight: row.title_highlight,
    titleSuffix: row.title_suffix,
    leadText: row.lead_text,
    stats,
    heroPhotos,
    footerAbout:
      row.footer_about ||
      "Tashkent Perfect University talabalar turar joyi — xavfsiz, qulay va zamonaviy talabalik hayoti uchun barcha qulayliklar bilan ta’minlangan aqlli majmua.",
    footerCopyright:
      row.footer_copyright ||
      "© 2026 Tashkent Perfect University. Barcha huquqlar himoyalangan.",
    galleryTitle:
      row.gallery_title ||
      "Kampus va Yotoqxona Fotogalereyasi",
    gallerySubtitle:
      row.gallery_subtitle ||
      "Xonalar, oshxonalar, kutubxona va talabalar shaharchasining haqiqiy suratlari hamda har bir bo‘lim bo‘yicha batafsil ma’lumotlar.",
    updatedAt: row.updated_at
  };
}

export function getFaqItems() {
  return db.prepare("SELECT * FROM faq_items ORDER BY sort_order ASC, id ASC").all().map((f) => ({
    id: f.id,
    q: f.question,
    a: f.answer,
    sortOrder: f.sort_order,
    createdAt: f.created_at
  }));
}

export function normalizePhoneKey(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `phone-${digits}` : "";
}

export function getOrCreateSupportChat({
  threadKey,
  studentName = "Talaba",
  phone = "",
  course = "",
  roomTitle = "",
  assignedRoomNumber = "",
  bookingId = null,
  studentAccountId = null
}) {
  let chat = null;
  if (threadKey) {
    chat = db.prepare("SELECT * FROM support_chats WHERE thread_key = ?").get(String(threadKey));
  }
  if (!chat && bookingId) {
    chat = db.prepare("SELECT * FROM support_chats WHERE booking_id = ?").get(Number(bookingId));
  }
  if (!chat && studentAccountId) {
    chat = db.prepare("SELECT * FROM support_chats WHERE student_account_id = ?").get(Number(studentAccountId));
  }
  const phoneKey = normalizePhoneKey(phone);
  if (!chat && phoneKey) {
    chat = db.prepare("SELECT * FROM support_chats WHERE thread_key = ?").get(phoneKey);
  }

  if (chat) {
    db.prepare(`
      UPDATE support_chats
      SET student_name = COALESCE(NULLIF(?, ''), student_name),
          phone = COALESCE(NULLIF(?, ''), phone),
          course = COALESCE(NULLIF(?, ''), course),
          room_title = COALESCE(NULLIF(?, ''), room_title),
          assigned_room_number = COALESCE(NULLIF(?, ''), assigned_room_number),
          booking_id = COALESCE(?, booking_id),
          student_account_id = COALESCE(?, student_account_id)
      WHERE id = ?
    `).run(
      String(studentName || "").trim(),
      String(phone || "").trim(),
      String(course || "").trim(),
      String(roomTitle || "").trim(),
      String(assignedRoomNumber || "").trim(),
      bookingId ? Number(bookingId) : null,
      studentAccountId ? Number(studentAccountId) : null,
      chat.id
    );
    return db.prepare("SELECT * FROM support_chats WHERE id = ?").get(chat.id);
  }

  const finalKey =
    (threadKey && String(threadKey).trim()) ||
    (bookingId ? `booking-${bookingId}` : "") ||
    (studentAccountId ? `account-${studentAccountId}` : "") ||
    phoneKey ||
    `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const res = db.prepare(`
    INSERT INTO support_chats (
      thread_key, student_name, phone, course, room_title, assigned_room_number,
      booking_id, student_account_id, status, unread_admin, unread_student, last_message
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', 0, 0, '')
  `).run(
    finalKey,
    String(studentName || "Talaba").trim() || "Talaba",
    String(phone || "").trim(),
    String(course || "").trim(),
    String(roomTitle || "").trim(),
    String(assignedRoomNumber || "").trim(),
    bookingId ? Number(bookingId) : null,
    studentAccountId ? Number(studentAccountId) : null
  );

  return db.prepare("SELECT * FROM support_chats WHERE id = ?").get(res.lastInsertRowid);
}

export function formatSupportChat(chatRow, includeMessages = true) {
  if (!chatRow) return null;
  const messages = includeMessages
    ? db
        .prepare("SELECT * FROM support_chat_messages WHERE chat_id = ? ORDER BY id ASC")
        .all(chatRow.id)
        .map((m) => ({
          id: m.id,
          chatId: m.chat_id,
          senderRole: m.sender_role,
          senderName: m.sender_name,
          message: m.message,
          createdAt: m.created_at
        }))
    : [];
  return {
    id: chatRow.id,
    threadKey: chatRow.thread_key,
    studentName: chatRow.student_name,
    phone: chatRow.phone,
    course: chatRow.course || "",
    roomTitle: chatRow.room_title || "",
    assignedRoomNumber: chatRow.assigned_room_number || "",
    bookingId: chatRow.booking_id,
    studentAccountId: chatRow.student_account_id,
    status: chatRow.status,
    unreadAdmin: chatRow.unread_admin || 0,
    unreadStudent: chatRow.unread_student || 0,
    lastMessage: chatRow.last_message || (messages[messages.length - 1]?.message ?? ""),
    updatedAt: chatRow.updated_at,
    createdAt: chatRow.created_at,
    messages
  };
}

export function getAdminSupportChats() {
  const rows = db.prepare(`
    SELECT * FROM support_chats
    ORDER BY unread_admin DESC, updated_at DESC, id DESC
  `).all();
  return rows.map((r) => formatSupportChat(r, true));
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
