import { Router } from "express";
import {
  db,
  formatRoomInventory,
  getAnnouncements,
  getAvailableImages,
  getGalleryPhotos,
  getPublicDormRooms,
  getStudentPortalData
} from "../db/database.js";
import { getSession } from "../utils/auth.js";

const router = Router();

router.get("/rooms", (_request, response) => {
  const rows = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all();
  return response.json({
    rooms: rows.map(formatRoomInventory),
    dormRooms: getPublicDormRooms(),
    announcements: getAnnouncements(),
    gallery: getGalleryPhotos(),
    availableImages: getAvailableImages()
  });
});

router.get("/gallery", (_request, response) => {
  return response.json({
    gallery: getGalleryPhotos(),
    availableImages: getAvailableImages()
  });
});

router.post("/bookings", (request, response) => {
  const {
    roomId,
    roomTitle,
    name,
    phone,
    telegram,
    course,
    age,
    date,
    duration,
    notes,
    preferredRoomNumber
  } = request.body;

  const cleanName = String(name || "").trim();
  const cleanPhone = String(phone || "").trim();
  const cleanTelegram = String(telegram || "").trim();
  const cleanCourse = String(course || "").trim();
  const parsedAge = age ? Number(age) : null;
  const cleanDate = String(date || "").trim();
  const cleanDuration = String(duration || "1 semestr").trim();
  const cleanNotes = String(notes || "").trim();
  const cleanPrefRoom = String(preferredRoomNumber || "").trim();

  if (!cleanName || cleanPhone.replace(/\D/g, "").length < 7) {
    return response.status(400).json({ message: "Ism-familiya va telefon raqamingizni to‘liq kiriting." });
  }

  let inv = null;
  if (roomId) inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(Number(roomId));
  if (!inv && roomTitle) inv = db.prepare("SELECT * FROM room_inventory WHERE title = ?").get(String(roomTitle).trim());
  if (!inv) inv = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC LIMIT 1").get();

  const session = getSession(request);
  const result = db.prepare(`
    INSERT INTO bookings (
      room_id, room_title, room_category, student_name, phone, telegram, course, age,
      move_in_date, duration, notes, preferred_room_number, student_account_id, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    inv.id,
    inv.title,
    inv.category,
    cleanName,
    cleanPhone,
    cleanTelegram || null,
    cleanCourse || null,
    Number.isInteger(parsedAge) ? parsedAge : null,
    cleanDate || null,
    cleanDuration,
    cleanNotes || null,
    cleanPrefRoom || null,
    session ? session.accountId : null
  );

  const created = db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid);
  return response.status(201).json({ booking: created, message: "Arizangiz bazaga saqlandi!" });
});

router.post("/contact", (request, response) => {
  const { firstName, lastName, phone, subject, message } = request.body;
  const cleanFirst = String(firstName || "").trim();
  const cleanLast = String(lastName || "").trim();
  const cleanPhone = String(phone || "").trim();
  const cleanSubject = String(subject || "Umumiy savol").trim();
  const cleanMsg = String(message || "").trim();

  if (!cleanFirst || !cleanLast || !cleanPhone || !cleanMsg) {
    return response.status(400).json({ message: "Barcha majburiy maydonlarni to‘ldiring." });
  }

  const result = db.prepare(`
    INSERT INTO contact_messages (first_name, last_name, phone, subject, message, status)
    VALUES (?, ?, ?, ?, ?, 'new')
  `).run(cleanFirst, cleanLast, cleanPhone, cleanSubject, cleanMsg);

  return response.status(201).json({ id: result.lastInsertRowid, message: "Xabaringiz saqlandi." });
});

router.get("/announcements", (_request, response) => {
  return response.json({ announcements: getAnnouncements() });
});

router.get("/student/portal", (request, response) => {
  const session = getSession(request);
  if (!session) return response.status(401).json({ message: "Avval tizimga kiring." });
  const account = db.prepare("SELECT * FROM accounts WHERE id = ? AND verified = 1").get(session.accountId);
  if (!account) return response.status(401).json({ message: "Profil topilmadi." });

  return response.json({
    portal: getStudentPortalData(account),
    announcements: getAnnouncements(),
    dormRooms: getPublicDormRooms()
  });
});

router.post("/student/maintenance", (request, response) => {
  const session = getSession(request);
  if (!session) return response.status(401).json({ message: "Avval tizimga kiring." });
  const account = db.prepare("SELECT * FROM accounts WHERE id = ? AND verified = 1").get(session.accountId);
  if (!account) return response.status(401).json({ message: "Profil topilmadi." });

  const { roomNumber, category = "Santexnika", description, priority = "medium" } = request.body;
  const cleanRoom = String(roomNumber || "").trim();
  const cleanCat = String(category || "Santexnika").trim();
  const cleanDesc = String(description || "").trim();
  if (!cleanRoom || !cleanDesc) {
    return response.status(400).json({ message: "Xona raqami va muammo tavsifini kiriting." });
  }
  const safePriority = ["low", "medium", "high"].includes(priority) ? priority : "medium";
  const reporterName = `${account.first_name} ${account.last_name}`.trim();

  db.prepare(`
    INSERT INTO maintenance_requests (room_number, category, description, priority, status, reporter_name)
    VALUES (?, ?, ?, ?, 'open', ?)
  `).run(cleanRoom, cleanCat, cleanDesc, safePriority, reporterName);

  return response.status(201).json({
    portal: getStudentPortalData(account),
    message: "Texnik xizmat so‘rovingiz ma’muriyatga yuborildi!"
  });
});

export default router;
