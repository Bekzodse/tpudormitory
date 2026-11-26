import { Router } from "express";
import {
  db,
  formatRoomInventory,
  formatSupportChat,
  getAnnouncements,
  getAvailableImages,
  getFacilities,
  getFaqItems,
  getGalleryCategories,
  getGalleryPhotos,
  getHomepageSettings,
  getOrCreateSupportChat,
  getPublicDormRooms,
  getSiteBottomTexts,
  getStudentPortalData,
  normalizePhoneKey
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
    galleryCategories: getGalleryCategories(),
    bottomTexts: getSiteBottomTexts(),
    availableImages: getAvailableImages(),
    homepage: getHomepageSettings(),
    faqs: getFaqItems(),
    facilities: getFacilities()
  });
});

router.get("/faqs", (_request, response) => {
  return response.json({ faqs: getFaqItems() });
});

router.get("/homepage", (_request, response) => {
  return response.json({
    homepage: getHomepageSettings(),
    bottomTexts: getSiteBottomTexts()
  });
});

router.get("/gallery", (_request, response) => {
  return response.json({
    gallery: getGalleryPhotos(),
    galleryCategories: getGalleryCategories(),
    bottomTexts: getSiteBottomTexts("gallery"),
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
  if (roomId && Number.isInteger(Number(roomId))) {
    inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(Number(roomId));
  }
  if (!inv && roomTitle) inv = db.prepare("SELECT * FROM room_inventory WHERE title = ?").get(String(roomTitle).trim());
  if (!inv) inv = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC LIMIT 1").get();
  if (!inv) {
    return response.status(400).json({ message: "Hozircha bron qilish uchun mavjud xona turi yo‘q." });
  }

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
  const chatRow = getOrCreateSupportChat({
    bookingId: created.id,
    studentAccountId: session ? session.accountId : null,
    studentName: cleanName,
    phone: cleanPhone,
    course: cleanCourse,
    roomTitle: inv.title,
    assignedRoomNumber: cleanPrefRoom
  });
  const msgCount = db.prepare("SELECT COUNT(*) AS cnt FROM support_chat_messages WHERE chat_id = ?").get(chatRow.id)?.cnt || 0;
  if (msgCount === 0) {
    const welcomeText = `Assalomu alaykum, ${cleanName}! "${inv.title}" bo‘yicha #${created.id}-sonli arizangiz qabul qilindi. Savollaringiz bo‘lsa shu chat orqali yozishingiz mumkin — administratorimiz javob beradi.`;
    db.prepare(`
      INSERT INTO support_chat_messages (chat_id, sender_role, sender_name, message)
      VALUES (?, 'admin', 'TPU Support', ?)
    `).run(chatRow.id, welcomeText);
    if (cleanNotes) {
      db.prepare(`
        INSERT INTO support_chat_messages (chat_id, sender_role, sender_name, message)
        VALUES (?, 'student', ?, ?)
      `).run(chatRow.id, cleanName, cleanNotes);
      db.prepare("UPDATE support_chats SET last_message = ?, unread_admin = unread_admin + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(cleanNotes, chatRow.id);
    } else {
      db.prepare("UPDATE support_chats SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(welcomeText, chatRow.id);
    }
  }
  const updatedChat = db.prepare("SELECT * FROM support_chats WHERE id = ?").get(chatRow.id);
  return response.status(201).json({
    booking: created,
    chat: formatSupportChat(updatedChat, true),
    message: "Arizangiz bazaga saqlandi!"
  });
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

router.get("/support/chat", (request, response) => {
  const session = getSession(request);
  const { threadKey, bookingId, phone } = request.query;

  let chatRow = null;
  if (threadKey) {
    chatRow = db.prepare("SELECT * FROM support_chats WHERE thread_key = ?").get(String(threadKey));
  }
  if (!chatRow && bookingId) {
    chatRow = db.prepare("SELECT * FROM support_chats WHERE booking_id = ?").get(Number(bookingId));
  }
  if (!chatRow && session?.accountId) {
    chatRow = db.prepare("SELECT * FROM support_chats WHERE student_account_id = ?").get(Number(session.accountId));
    if (!chatRow) {
      const acc = db.prepare("SELECT * FROM accounts WHERE id = ?").get(session.accountId);
      if (acc) {
        chatRow = getOrCreateSupportChat({
          studentAccountId: acc.id,
          studentName: `${acc.first_name} ${acc.last_name}`.trim(),
          phone: acc.phone || "",
          course: acc.course || ""
        });
      }
    }
  }
  if (!chatRow && phone) {
    const pKey = normalizePhoneKey(phone);
    if (pKey) chatRow = db.prepare("SELECT * FROM support_chats WHERE thread_key = ?").get(pKey);
  }

  if (!chatRow) {
    return response.json({ chat: null });
  }

  db.prepare("UPDATE support_chats SET unread_student = 0 WHERE id = ?").run(chatRow.id);
  const refreshed = db.prepare("SELECT * FROM support_chats WHERE id = ?").get(chatRow.id);
  return response.json({ chat: formatSupportChat(refreshed, true) });
});

router.post("/support/message", (request, response) => {
  const session = getSession(request);
  const { threadKey, bookingId, studentName, phone, course, roomTitle, message } = request.body;
  const cleanMsg = String(message || "").trim();
  if (!cleanMsg) {
    return response.status(400).json({ message: "Xabar matnini kiriting." });
  }

  let acc = null;
  if (session?.accountId) {
    acc = db.prepare("SELECT * FROM accounts WHERE id = ?").get(session.accountId);
  }

  const finalName = String(studentName || (acc ? `${acc.first_name} ${acc.last_name}` : "") || "Talaba").trim();
  const finalPhone = String(phone || acc?.phone || "").trim();
  const finalCourse = String(course || acc?.course || "").trim();

  const chatRow = getOrCreateSupportChat({
    threadKey,
    bookingId: bookingId ? Number(bookingId) : null,
    studentAccountId: acc ? acc.id : null,
    studentName: finalName,
    phone: finalPhone,
    course: finalCourse,
    roomTitle: String(roomTitle || "").trim()
  });

  db.prepare(`
    INSERT INTO support_chat_messages (chat_id, sender_role, sender_name, message)
    VALUES (?, 'student', ?, ?)
  `).run(chatRow.id, finalName, cleanMsg);

  db.prepare(`
    UPDATE support_chats
    SET last_message = ?, unread_admin = unread_admin + 1, unread_student = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cleanMsg, chatRow.id);

  const updated = db.prepare("SELECT * FROM support_chats WHERE id = ?").get(chatRow.id);
  return response.status(201).json({
    chat: formatSupportChat(updated, true),
    message: "Savolingiz adminga yuborildi!"
  });
});

export default router;
