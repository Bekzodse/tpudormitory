import { Router } from "express";
import {
  db,
  formatRoomInventory,
  getAdminDormRooms,
  getAdminMaintenance,
  getAdminResidents,
  getAnnouncements
} from "../db/database.js";
import { createRequireAdmin, decryptSecret, encryptSecret, hashPassword, publicStudent } from "../utils/auth.js";

const router = Router();
const requireAdmin = createRequireAdmin(db);

router.use(requireAdmin);

router.get("/overview", (_request, response) => {
  const rooms = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all().map((row) => {
    const counts = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count
      FROM bookings
      WHERE room_id = ?
    `).get(row.id);
    return {
      ...formatRoomInventory(row),
      pendingRequests: counts?.pending_count || 0,
      approvedRequests: counts?.approved_count || 0
    };
  });

  const bookings = db.prepare(`
    SELECT b.*, a.login AS student_login, a.avatar AS student_avatar,
           rr.id AS resident_id, rr.payment_status AS resident_payment_status,
           rr.dorm_room_id AS assigned_dorm_room_id, dr.room_number AS assigned_room_number
    FROM bookings b
    LEFT JOIN accounts a ON a.id = b.student_account_id
    LEFT JOIN room_residents rr ON rr.booking_id = b.id
    LEFT JOIN dorm_rooms dr ON dr.id = rr.dorm_room_id
    ORDER BY
      CASE b.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      b.id DESC
  `).all();

  const residentsList = getAdminResidents();
  const students = db.prepare(`
    SELECT id, first_name, last_name, age, course, phone, role, login, password_ciphertext, avatar, created_at
    FROM accounts
    ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, id DESC
  `).all().map((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.trim().toLowerCase();
    const linkedBooking = bookings.find((b) => b.student_account_id === s.id);
    const linkedResident =
      (linkedBooking?.resident_id && residentsList.find((r) => r.id === linkedBooking.resident_id)) ||
      residentsList.find((r) => r.studentName.trim().toLowerCase() === fullName || (s.phone && r.phone === s.phone));
    return {
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      age: s.age,
      course: s.course,
      phone: s.phone,
      role: s.role || "student",
      login: s.login,
      password: s.password_ciphertext ? decryptSecret(s.password_ciphertext) : null,
      avatar: s.avatar,
      createdAt: s.created_at,
      linkedResidentId: linkedResident?.id || null,
      linkedRoomNumber: linkedResident?.roomNumber || linkedBooking?.assigned_room_number || null,
      linkedPaymentStatus: linkedResident?.paymentStatus || null,
      linkedMonthlyPrice: linkedResident?.monthlyPrice || null,
      linkedBookingId: linkedBooking?.id || null,
      linkedBookingStatus: linkedBooking?.status || null
    };
  });

  const messages = db.prepare("SELECT * FROM contact_messages ORDER BY id DESC").all();

  return response.json({
    rooms,
    bookings,
    students,
    messages,
    dormRooms: getAdminDormRooms(),
    residents: residentsList,
    maintenance: getAdminMaintenance(),
    announcements: getAnnouncements()
  });
});

router.patch("/bookings/:id", (request, response) => {
  const bookingId = Number(request.params.id);
  const { status, adminNote, dormRoomId } = request.body;
  if (!["pending", "approved", "rejected"].includes(status)) {
    return response.status(400).json({ message: "Noto‘g‘ri ariza holati." });
  }

  try {
    const updatedBooking = db.transaction(() => {
      const existing = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
      if (!existing) {
        const err = new Error("Ariza topilmadi.");
        err.status = 404;
        throw err;
      }

      const inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(existing.room_id);
      if (inv) {
        const totalSpots = inv.total_rooms * inv.spots_per_room;
        if (existing.status !== "approved" && status === "approved") {
          if (inv.occupied_spots >= totalSpots) {
            const err = new Error("Ushbu xona turida bo‘sh joy qolmagan.");
            err.status = 409;
            throw err;
          }
          db.prepare("UPDATE room_inventory SET occupied_spots = occupied_spots + 1 WHERE id = ?").run(inv.id);
        } else if (existing.status === "approved" && status !== "approved") {
          db.prepare("UPDATE room_inventory SET occupied_spots = MAX(0, occupied_spots - 1) WHERE id = ?").run(inv.id);
        }
      }

      if (status === "approved") {
        const existingResident = db.prepare("SELECT id FROM room_residents WHERE booking_id = ?").get(bookingId);
        if (!existingResident) {
          let targetRoom = null;
          if (dormRoomId) {
            targetRoom = db.prepare("SELECT * FROM dorm_rooms WHERE id = ?").get(Number(dormRoomId));
          } else if (existing.preferred_room_number) {
            const pref = db.prepare("SELECT * FROM dorm_rooms WHERE room_number = ? AND status = 'active'").get(existing.preferred_room_number);
            if (pref) {
              const occ = db.prepare("SELECT COUNT(*) AS cnt FROM room_residents WHERE dorm_room_id = ?").get(pref.id)?.cnt || 0;
              if (occ < pref.capacity) targetRoom = pref;
            }
          }
          if (!targetRoom) {
            const candidates = db.prepare(`
              SELECT d.*, COUNT(rr.id) AS occ
              FROM dorm_rooms d
              LEFT JOIN room_residents rr ON rr.dorm_room_id = d.id
              WHERE d.room_category = ? AND d.status = 'active'
              GROUP BY d.id
              HAVING occ < d.capacity
              ORDER BY d.room_number ASC
            `).all(existing.room_category);
            targetRoom = candidates[0] || null;
          }
          if (targetRoom) {
            const occCount = db.prepare("SELECT COUNT(*) AS cnt FROM room_residents WHERE dorm_room_id = ?").get(targetRoom.id)?.cnt || 0;
            if (occCount >= targetRoom.capacity) {
              const err = new Error(`${targetRoom.room_number}-xonada bo‘sh joy qolmagan.`);
              err.status = 409;
              throw err;
            }
            db.prepare(`
              INSERT INTO room_residents (dorm_room_id, booking_id, student_name, phone, telegram, course, faculty, payment_status, move_in_date)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            `).run(
              targetRoom.id,
              bookingId,
              existing.student_name,
              existing.phone,
              existing.telegram || "",
              existing.course || "",
              "",
              existing.move_in_date || ""
            );
          }
        }
      } else {
        db.prepare("DELETE FROM room_residents WHERE booking_id = ?").run(bookingId);
      }

      db.prepare(`
        UPDATE bookings
        SET status = ?, admin_note = COALESCE(?, admin_note), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, adminNote !== undefined ? String(adminNote) : null, bookingId);

      return db.prepare(`
        SELECT b.*, a.login AS student_login, a.avatar AS student_avatar,
               rr.id AS resident_id, rr.payment_status AS resident_payment_status,
               rr.dorm_room_id AS assigned_dorm_room_id, dr.room_number AS assigned_room_number
        FROM bookings b
        LEFT JOIN accounts a ON a.id = b.student_account_id
        LEFT JOIN room_residents rr ON rr.booking_id = b.id
        LEFT JOIN dorm_rooms dr ON dr.id = rr.dorm_room_id
        WHERE b.id = ?
      `).get(bookingId);
    })();

    const rooms = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all().map(formatRoomInventory);
    return response.json({
      booking: updatedBooking,
      rooms,
      dormRooms: getAdminDormRooms(),
      residents: getAdminResidents()
    });
  } catch (error) {
    return response.status(error.status || 500).json({ message: error.message || "Xatolik yuz berdi." });
  }
});

router.delete("/bookings/:id", (request, response) => {
  const bookingId = Number(request.params.id);
  const removed = db.transaction(() => {
    const existing = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!existing) return false;
    if (existing.status === "approved") {
      db.prepare("UPDATE room_inventory SET occupied_spots = MAX(0, occupied_spots - 1) WHERE id = ?").run(existing.room_id);
    }
    db.prepare("DELETE FROM room_residents WHERE booking_id = ?").run(bookingId);
    db.prepare("DELETE FROM bookings WHERE id = ?").run(bookingId);
    return true;
  })();

  if (!removed) return response.status(404).json({ message: "Ariza topilmadi." });
  const rooms = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all().map(formatRoomInventory);
  return response.json({ rooms, dormRooms: getAdminDormRooms(), residents: getAdminResidents() });
});

router.put("/rooms/:id", (request, response) => {
  const roomId = Number(request.params.id);
  const { totalRooms, occupiedSpots } = request.body;
  const inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(roomId);
  if (!inv) return response.status(404).json({ message: "Xona turi topilmadi." });

  const nextTotalRooms = Math.max(1, Math.min(500, Math.round(Number(totalRooms ?? inv.total_rooms))));
  const maxSpots = nextTotalRooms * inv.spots_per_room;
  const nextOccupied = Math.max(0, Math.min(maxSpots, Math.round(Number(occupiedSpots ?? inv.occupied_spots))));

  db.prepare("UPDATE room_inventory SET total_rooms = ?, occupied_spots = ? WHERE id = ?").run(
    nextTotalRooms,
    nextOccupied,
    roomId
  );

  return response.json({ room: formatRoomInventory(db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(roomId)) });
});

router.post("/dorm-rooms", (request, response) => {
  const { roomNumber, roomTypeId, floor, status = "active" } = request.body;
  const cleanNumber = String(roomNumber || "").trim();
  const inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(Number(roomTypeId));
  const cleanFloor = Number(floor);
  if (!cleanNumber || !inv || !Number.isInteger(cleanFloor) || cleanFloor < 1 || cleanFloor > 20) {
    return response.status(400).json({ message: "Xona raqami, qavati va turini to‘g‘ri kiriting." });
  }
  if (db.prepare("SELECT id FROM dorm_rooms WHERE room_number = ?").get(cleanNumber)) {
    return response.status(409).json({ message: `${cleanNumber}-xona allaqachon mavjud.` });
  }

  db.prepare(`
    INSERT INTO dorm_rooms (room_number, room_type_id, room_category, floor, capacity, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cleanNumber, inv.id, inv.category, cleanFloor, inv.spots_per_room, status === "maintenance" ? "maintenance" : "active");

  return response.status(201).json({ dormRooms: getAdminDormRooms() });
});

router.patch("/dorm-rooms/:id", (request, response) => {
  const dormRoomId = Number(request.params.id);
  const { status, roomNumber, floor, roomTypeId } = request.body;
  const existing = db.prepare("SELECT * FROM dorm_rooms WHERE id = ?").get(dormRoomId);
  if (!existing) return response.status(404).json({ message: "Xona topilmadi." });

  const nextStatus = status !== undefined ? status : existing.status;
  if (!["active", "maintenance"].includes(nextStatus)) {
    return response.status(400).json({ message: "Noto‘g‘ri xona holati." });
  }

  const nextNumber = roomNumber !== undefined ? String(roomNumber).trim() : existing.room_number;
  const nextFloor = floor !== undefined ? Number(floor) : existing.floor;
  if (!nextNumber || !Number.isInteger(nextFloor) || nextFloor < 1 || nextFloor > 20) {
    return response.status(400).json({ message: "Xona raqami va qavati to‘g‘ri bo‘lishi kerak." });
  }
  if (db.prepare("SELECT id FROM dorm_rooms WHERE room_number = ? AND id != ?").get(nextNumber, dormRoomId)) {
    return response.status(409).json({ message: `${nextNumber}-xona allaqachon mavjud.` });
  }

  let nextTypeId = existing.room_type_id;
  let nextCategory = existing.room_category;
  let nextCapacity = existing.capacity;
  if (roomTypeId !== undefined && Number(roomTypeId) !== existing.room_type_id) {
    const inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(Number(roomTypeId));
    if (!inv) return response.status(404).json({ message: "Xona turi topilmadi." });
    const occCount = db.prepare("SELECT COUNT(*) AS cnt FROM room_residents WHERE dorm_room_id = ?").get(dormRoomId)?.cnt || 0;
    if (occCount > inv.spots_per_room) {
      return response.status(409).json({ message: `Xonada ${occCount} nafar talaba bor, kichikroq sig‘imga o‘tkazib bo‘lmaydi.` });
    }
    nextTypeId = inv.id;
    nextCategory = inv.category;
    nextCapacity = inv.spots_per_room;
  }

  db.prepare(`
    UPDATE dorm_rooms
    SET status = ?, room_number = ?, floor = ?, room_type_id = ?, room_category = ?, capacity = ?
    WHERE id = ?
  `).run(nextStatus, nextNumber, nextFloor, nextTypeId, nextCategory, nextCapacity, dormRoomId);

  return response.json({ dormRooms: getAdminDormRooms() });
});

router.delete("/dorm-rooms/:id", (request, response) => {
  const dormRoomId = Number(request.params.id);
  const occCount = db.prepare("SELECT COUNT(*) AS cnt FROM room_residents WHERE dorm_room_id = ?").get(dormRoomId)?.cnt || 0;
  if (occCount > 0) {
    return response.status(409).json({ message: "Avval ushbu xonadagi talabalarni boshqa xonaga ko‘chiring." });
  }
  const res = db.prepare("DELETE FROM dorm_rooms WHERE id = ?").run(dormRoomId);
  if (!res.changes) return response.status(404).json({ message: "Xona topilmadi." });
  return response.json({ dormRooms: getAdminDormRooms() });
});

router.post("/residents", (request, response) => {
  const { dormRoomId, studentName, phone, telegram = "", course = "", faculty = "", paymentStatus = "pending", moveInDate = "" } = request.body;
  const room = db.prepare("SELECT * FROM dorm_rooms WHERE id = ?").get(Number(dormRoomId));
  const cleanName = String(studentName || "").trim();
  const cleanPhone = String(phone || "").trim();
  if (!room || !cleanName || !cleanPhone) {
    return response.status(400).json({ message: "Xona, talaba ismi va telefon raqami majburiy." });
  }
  const occCount = db.prepare("SELECT COUNT(*) AS cnt FROM room_residents WHERE dorm_room_id = ?").get(room.id)?.cnt || 0;
  if (occCount >= room.capacity) return response.status(409).json({ message: `${room.room_number}-xona to‘lgan.` });
  const safePay = ["paid", "pending", "overdue"].includes(paymentStatus) ? paymentStatus : "pending";

  db.prepare(`
    INSERT INTO room_residents (dorm_room_id, booking_id, student_name, phone, telegram, course, faculty, payment_status, move_in_date)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
  `).run(room.id, cleanName, cleanPhone, String(telegram).trim(), String(course).trim(), String(faculty).trim(), safePay, String(moveInDate).trim());

  return response.status(201).json({ dormRooms: getAdminDormRooms(), residents: getAdminResidents() });
});

router.patch("/residents/:id", (request, response) => {
  const residentId = Number(request.params.id);
  const { dormRoomId, paymentStatus, studentName, phone, telegram, course, faculty, moveInDate } = request.body;
  const existing = db.prepare("SELECT * FROM room_residents WHERE id = ?").get(residentId);
  if (!existing) return response.status(404).json({ message: "Yashovchi talaba topilmadi." });

  let nextRoomId = existing.dorm_room_id;
  if (dormRoomId !== undefined && Number(dormRoomId) !== existing.dorm_room_id) {
    const targetRoom = db.prepare("SELECT * FROM dorm_rooms WHERE id = ?").get(Number(dormRoomId));
    if (!targetRoom) return response.status(404).json({ message: "Maqsadli xona topilmadi." });
    const occCount = db.prepare("SELECT COUNT(*) AS cnt FROM room_residents WHERE dorm_room_id = ?").get(targetRoom.id)?.cnt || 0;
    if (occCount >= targetRoom.capacity) return response.status(409).json({ message: `${targetRoom.room_number}-xona to‘lgan.` });
    nextRoomId = targetRoom.id;
  }

  const nextPayment = paymentStatus !== undefined
    ? (["paid", "pending", "overdue"].includes(paymentStatus) ? paymentStatus : existing.payment_status)
    : existing.payment_status;
  const nextName = studentName !== undefined ? String(studentName).trim() : existing.student_name;
  const nextPhone = phone !== undefined ? String(phone).trim() : existing.phone;
  if (!nextName || !nextPhone) {
    return response.status(400).json({ message: "Talaba ismi va telefon raqami bo‘sh bo‘lmasligi kerak." });
  }

  db.prepare(`
    UPDATE room_residents
    SET dorm_room_id = ?, payment_status = ?, student_name = ?, phone = ?, telegram = ?, course = ?, faculty = ?, move_in_date = ?
    WHERE id = ?
  `).run(
    nextRoomId,
    nextPayment,
    nextName,
    nextPhone,
    telegram !== undefined ? String(telegram).trim() : existing.telegram,
    course !== undefined ? String(course).trim() : existing.course,
    faculty !== undefined ? String(faculty).trim() : existing.faculty,
    moveInDate !== undefined ? String(moveInDate).trim() : existing.move_in_date,
    residentId
  );

  return response.json({ dormRooms: getAdminDormRooms(), residents: getAdminResidents() });
});

router.delete("/residents/:id", (request, response) => {
  const res = db.prepare("DELETE FROM room_residents WHERE id = ?").run(Number(request.params.id));
  if (!res.changes) return response.status(404).json({ message: "Yashovchi talaba topilmadi." });
  return response.json({ dormRooms: getAdminDormRooms(), residents: getAdminResidents() });
});

router.post("/maintenance", (request, response) => {
  const { roomNumber, category, description, priority = "medium" } = request.body;
  const cleanRoom = String(roomNumber || "").trim();
  const cleanCat = String(category || "").trim();
  const cleanDesc = String(description || "").trim();
  if (!cleanRoom || !cleanCat || !cleanDesc) {
    return response.status(400).json({ message: "Xona raqami, yo‘nalish va tavsifni kiriting." });
  }
  const safePriority = ["low", "medium", "high"].includes(priority) ? priority : "medium";
  db.prepare(`
    INSERT INTO maintenance_requests (room_number, category, description, priority, status)
    VALUES (?, ?, ?, ?, 'open')
  `).run(cleanRoom, cleanCat, cleanDesc, safePriority);
  return response.status(201).json({ maintenance: getAdminMaintenance() });
});

router.patch("/maintenance/:id", (request, response) => {
  const maintId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM maintenance_requests WHERE id = ?").get(maintId);
  if (!existing) return response.status(404).json({ message: "So‘rov topilmadi." });

  const { status, priority, category, description, adminNote } = request.body;
  const nextStatus = status !== undefined ? status : existing.status;
  if (!["open", "in_progress", "resolved"].includes(nextStatus)) {
    return response.status(400).json({ message: "Noto‘g‘ri texnik holat." });
  }
  const nextPriority = priority !== undefined && ["low", "medium", "high"].includes(priority) ? priority : existing.priority;
  const nextCat = category !== undefined ? String(category).trim() || existing.category : existing.category;
  const nextDesc = description !== undefined ? String(description).trim() || existing.description : existing.description;
  const nextNote = adminNote !== undefined ? String(adminNote).trim() : (existing.admin_note || "");

  db.prepare(`
    UPDATE maintenance_requests
    SET status = ?, priority = ?, category = ?, description = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nextStatus, nextPriority, nextCat, nextDesc, nextNote, maintId);

  return response.json({ maintenance: getAdminMaintenance() });
});

router.delete("/maintenance/:id", (request, response) => {
  const res = db.prepare("DELETE FROM maintenance_requests WHERE id = ?").run(Number(request.params.id));
  if (!res.changes) return response.status(404).json({ message: "So‘rov topilmadi." });
  return response.json({ maintenance: getAdminMaintenance() });
});

router.post("/announcements", (request, response) => {
  const { title, category = "Umumiy", content, audience = "Barcha talabalar", pinned = false } = request.body;
  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  if (!cleanTitle || !cleanContent) {
    return response.status(400).json({ message: "E’lon sarlavhasi va matnini kiriting." });
  }
  db.prepare(`
    INSERT INTO dorm_announcements (title, category, content, audience, pinned)
    VALUES (?, ?, ?, ?, ?)
  `).run(cleanTitle, String(category).trim() || "Umumiy", cleanContent, String(audience).trim() || "Barcha talabalar", pinned ? 1 : 0);
  return response.status(201).json({ announcements: getAnnouncements() });
});

router.patch("/announcements/:id", (request, response) => {
  const annId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM dorm_announcements WHERE id = ?").get(annId);
  if (!existing) return response.status(404).json({ message: "E’lon topilmadi." });

  const { title, category, content, audience, pinned } = request.body;
  const nextTitle = title !== undefined ? String(title).trim() : existing.title;
  const nextCat = category !== undefined ? String(category).trim() : existing.category;
  const nextContent = content !== undefined ? String(content).trim() : existing.content;
  const nextAud = audience !== undefined ? String(audience).trim() : existing.audience;
  const nextPinned = pinned !== undefined ? (pinned ? 1 : 0) : existing.pinned;

  if (!nextTitle || !nextContent) {
    return response.status(400).json({ message: "E’lon sarlavhasi va matnini kiriting." });
  }

  db.prepare(`
    UPDATE dorm_announcements
    SET title = ?, category = ?, content = ?, audience = ?, pinned = ?
    WHERE id = ?
  `).run(nextTitle, nextCat || "Umumiy", nextContent, nextAud || "Barcha talabalar", nextPinned, annId);
  return response.json({ announcements: getAnnouncements() });
});

router.delete("/announcements/:id", (request, response) => {
  const res = db.prepare("DELETE FROM dorm_announcements WHERE id = ?").run(Number(request.params.id));
  if (!res.changes) return response.status(404).json({ message: "E’lon topilmadi." });
  return response.json({ announcements: getAnnouncements() });
});

router.patch("/messages/:id", (request, response) => {
  const msgId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM contact_messages WHERE id = ?").get(msgId);
  if (!existing) return response.status(404).json({ message: "Xabar topilmadi." });

  const { status, adminNote } = request.body;
  const nextStatus = status && ["new", "read", "replied"].includes(status) ? status : (existing.status || "new");
  const nextNote = adminNote !== undefined ? String(adminNote).trim() : (existing.admin_note || "");

  db.prepare("UPDATE contact_messages SET status = ?, admin_note = ? WHERE id = ?").run(nextStatus, nextNote, msgId);
  const messages = db.prepare("SELECT * FROM contact_messages ORDER BY id DESC").all();
  return response.json({ messages });
});

router.delete("/messages/:id", (request, response) => {
  const res = db.prepare("DELETE FROM contact_messages WHERE id = ?").run(Number(request.params.id));
  if (!res.changes) return response.status(404).json({ message: "Xabar topilmadi." });
  const messages = db.prepare("SELECT * FROM contact_messages ORDER BY id DESC").all();
  return response.json({ messages });
});

router.post("/payments/bulk", (request, response) => {
  const { fromStatus, toStatus } = request.body;
  if (!["paid", "pending", "overdue"].includes(toStatus)) {
    return response.status(400).json({ message: "Noto‘g‘ri to‘lov holati." });
  }
  if (fromStatus && ["paid", "pending", "overdue"].includes(fromStatus)) {
    db.prepare("UPDATE room_residents SET payment_status = ? WHERE payment_status = ?").run(toStatus, fromStatus);
  } else {
    db.prepare("UPDATE room_residents SET payment_status = ?").run(toStatus);
  }
  return response.json({ residents: getAdminResidents(), dormRooms: getAdminDormRooms() });
});

router.post("/accounts", async (request, response) => {
  const { firstName, lastName, age, course = "1-kurs", phone = "", login, password } = request.body;
  const cleanFirst = String(firstName || "").trim();
  const cleanLast = String(lastName || "").trim();
  const cleanLogin = String(login || "").trim();
  const cleanPhone = String(phone || "").trim();
  const cleanCourse = String(course || "1-kurs").trim();
  const parsedAge = age ? Number(age) : 20;
  const pwd = String(password || "");

  if (!cleanFirst || !cleanLast || !cleanLogin || pwd.length < 6) {
    return response.status(400).json({ message: "Ism, familiya, login va kamida 6 belgili parolni kiriting." });
  }
  if (db.prepare("SELECT id FROM accounts WHERE login = ? COLLATE NOCASE").get(cleanLogin)) {
    return response.status(409).json({ message: "Bu login allaqachon band." });
  }

  const hash = await hashPassword(pwd);
  const cipher = encryptSecret(pwd);
  db.prepare(`
    INSERT INTO accounts (first_name, last_name, age, course, phone, role, login, password_hash, password_ciphertext, registration_method, verified)
    VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, 'universityId', 1)
  `).run(cleanFirst, cleanLast, parsedAge, cleanCourse, cleanPhone, cleanLogin, hash, cipher);

  return response.status(201).json({ message: `${cleanFirst} ${cleanLast} akkaunti ochildi!` });
});

router.delete("/accounts/:id", (request, response) => {
  const accountId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
  if (!existing) return response.status(404).json({ message: "Akkaunt topilmadi." });
  if (existing.role === "admin") {
    return response.status(400).json({ message: "Administrator akkauntini o‘chirib bo‘lmaydi." });
  }
  db.prepare("UPDATE bookings SET student_account_id = NULL WHERE student_account_id = ?").run(accountId);
  db.prepare("DELETE FROM accounts WHERE id = ?").run(accountId);
  return response.json({ message: "Akkaunt o‘chirildi." });
});

router.patch("/accounts/:id/password", async (request, response) => {
  const accountId = Number(request.params.id);
  const nextPassword = String(request.body.password || "");
  if (nextPassword.length < 6) {
    return response.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo‘lishi kerak." });
  }
  const existing = db.prepare("SELECT id, login FROM accounts WHERE id = ?").get(accountId);
  if (!existing) return response.status(404).json({ message: "Akkaunt topilmadi." });

  db.prepare("UPDATE accounts SET password_hash = ?, password_ciphertext = ? WHERE id = ?").run(
    await hashPassword(nextPassword),
    encryptSecret(nextPassword),
    accountId
  );
  return response.json({ message: `${existing.login} paroli yangilandi.` });
});

router.patch("/accounts/:id", async (request, response) => {
  const accountId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
  if (!existing) return response.status(404).json({ message: "Akkaunt topilmadi." });

  const { firstName, lastName, age, course, phone, login, password } = request.body;
  const cleanFirst = String(firstName ?? existing.first_name).trim();
  const cleanLast = String(lastName ?? existing.last_name).trim();
  const cleanCourse = String(course ?? existing.course ?? "").trim();
  const cleanPhone = String(phone ?? existing.phone ?? "").trim();
  const cleanLogin = String(login ?? existing.login).trim();
  const parsedAge = age !== undefined && age !== null && age !== "" ? Number(age) : existing.age;

  if (!cleanFirst || !cleanLast || !cleanLogin) {
    return response.status(400).json({ message: "Ism, familiya va login majburiy." });
  }
  if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 15 || parsedAge > 60)) {
    return response.status(400).json({ message: "Yosh 15 dan 60 gacha bo‘lishi kerak." });
  }
  if (db.prepare("SELECT id FROM accounts WHERE login = ? COLLATE NOCASE AND id != ?").get(cleanLogin, accountId)) {
    return response.status(409).json({ message: "Bu login boshqa foydalanuvchida band." });
  }

  let nextHash = existing.password_hash;
  let nextCipher = existing.password_ciphertext;
  if (password !== undefined && String(password).trim() !== "") {
    const pwd = String(password);
    if (pwd.length < 6) return response.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo‘lishi kerak." });
    nextHash = await hashPassword(pwd);
    nextCipher = encryptSecret(pwd);
  }

  db.prepare(`
    UPDATE accounts
    SET first_name = ?, last_name = ?, age = ?, course = ?, phone = ?, login = ?, password_hash = ?, password_ciphertext = ?
    WHERE id = ?
  `).run(cleanFirst, cleanLast, parsedAge, cleanCourse, cleanPhone, cleanLogin, nextHash, nextCipher, accountId);

  const updatedAcc = db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
  return response.json({ account: publicStudent(updatedAcc), message: `${cleanFirst} ${cleanLast} profili yangilandi.` });
});

router.get("/database", (_request, response) => {
  const tableMeta = db.prepare(`
    SELECT name, sql FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name ASC
  `).all();

  const relationNotes = {
    bookings: "room_id → room_inventory.id • student_account_id → accounts.id",
    dorm_rooms: "room_type_id → room_inventory.id",
    room_residents: "dorm_room_id → dorm_rooms.id • booking_id → bookings.id",
    maintenance_requests: "room_number → dorm_rooms.room_number",
    accounts: "university_id → authorized_students.university_id • bookings.student_account_id"
  };

  const tables = tableMeta.map(({ name, sql }) => {
    const columns = db.prepare(`PRAGMA table_info("${name}")`).all();
    const hasId = columns.some((c) => c.name === "id");
    const countRow = db.prepare(`SELECT COUNT(*) AS cnt FROM "${name}"`).get();
    const rawRows = db.prepare(`SELECT * FROM "${name}" ${hasId ? "ORDER BY id DESC" : ""} LIMIT 100`).all();

    const rows = rawRows.map((row) => {
      const clean = {};
      for (const [key, val] of Object.entries(row)) {
        if (key === "password_ciphertext") clean[key] = val ? decryptSecret(val) : null;
        else if (key === "password_hash") clean[key] = val ? `${String(val).slice(0, 22)}... (scrypt)` : null;
        else if (key === "passport_ciphertext" || key === "passport_hash") clean[key] = val ? "[Shifrlangan / Hash]" : null;
        else if (key === "avatar" && typeof val === "string" && val.startsWith("data:")) clean[key] = `[Rasm (${Math.round(val.length / 1024)} KB)]`;
        else clean[key] = val;
      }
      return clean;
    });

    return {
      name,
      sql,
      relation: relationNotes[name] || "Mustaqil jadval",
      rowCount: countRow?.cnt || 0,
      columns: columns.map((c) => ({ name: c.name, type: c.type, pk: Boolean(c.pk), notnull: Boolean(c.notnull) })),
      rows
    };
  });

  return response.json({ dbPath: "backend/data/auth.sqlite", tables });
});

export default router;
