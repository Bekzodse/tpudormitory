import { Router } from "express";
import {
  db,
  ensureGalleryCategory,
  formatPriceUzs,
  formatRoomInventory,
  getAdminDormRooms,
  getAdminMaintenance,
  getAdminResidents,
  getAdminSupportChats,
  getAnnouncements,
  getAvailableImages,
  getFaqItems,
  getGalleryCategories,
  getGalleryPhotos,
  getHomepageSettings,
  getOrCreateSupportChat,
  getSiteBottomTexts,
  parsePriceDigits,
  saveUploadedImage,
  slugifyCategory
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
    announcements: getAnnouncements(),
    gallery: getGalleryPhotos(),
    galleryCategories: getGalleryCategories(),
    bottomTexts: getSiteBottomTexts(),
    availableImages: getAvailableImages(),
    homepage: getHomepageSettings(),
    faqs: getFaqItems(),
    chats: getAdminSupportChats()
  });
});

router.get("/chats", (_request, response) => {
  return response.json({ chats: getAdminSupportChats() });
});

router.post("/chats/:id/read", (request, response) => {
  const chatId = Number(request.params.id);
  db.prepare("UPDATE support_chats SET unread_admin = 0 WHERE id = ?").run(chatId);
  return response.json({ chats: getAdminSupportChats() });
});

router.post("/chats/:id/reply", (request, response) => {
  const chatId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM support_chats WHERE id = ?").get(chatId);
  if (!existing) return response.status(404).json({ message: "Chat topilmadi." });

  const cleanMsg = String(request.body.message || "").trim();
  if (!cleanMsg) return response.status(400).json({ message: "Javob matnini kiriting." });

  db.prepare(`
    INSERT INTO support_chat_messages (chat_id, sender_role, sender_name, message)
    VALUES (?, 'admin', 'TPU Ma’muriyati', ?)
  `).run(chatId, cleanMsg);

  db.prepare(`
    UPDATE support_chats
    SET last_message = ?, unread_admin = 0, unread_student = unread_student + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cleanMsg, chatId);

  return response.status(201).json({
    chats: getAdminSupportChats(),
    message: `${existing.student_name} ga javob yuborildi!`
  });
});

router.delete("/chats/:id", (request, response) => {
  const chatId = Number(request.params.id);
  db.prepare("DELETE FROM support_chat_messages WHERE chat_id = ?").run(chatId);
  const res = db.prepare("DELETE FROM support_chats WHERE id = ?").run(chatId);
  if (!res.changes) return response.status(404).json({ message: "Chat topilmadi." });
  return response.json({ chats: getAdminSupportChats() });
});

router.put("/homepage", (request, response) => {
  const current = getHomepageSettings();
  const {
    eyebrowBadge,
    eyebrowStatus,
    titlePrefix,
    titleHighlight,
    titleSuffix,
    leadText,
    stats,
    heroPhotos,
    footerAbout,
    footerCopyright,
    galleryTitle,
    gallerySubtitle
  } = request.body;

  const nextBadge = String(eyebrowBadge ?? current.eyebrowBadge).trim() || current.eyebrowBadge;
  const nextStatus = String(eyebrowStatus ?? current.eyebrowStatus).trim() || current.eyebrowStatus;
  const nextPrefix = String(titlePrefix ?? current.titlePrefix).trim();
  const nextHighlight = String(titleHighlight ?? current.titleHighlight).trim();
  const nextSuffix = String(titleSuffix ?? current.titleSuffix).trim();
  const nextLead = String(leadText ?? current.leadText).trim() || current.leadText;
  const nextFooterAbout = String(footerAbout ?? current.footerAbout ?? "").trim() || current.footerAbout;
  const nextFooterCopy = String(footerCopyright ?? current.footerCopyright ?? "").trim() || current.footerCopyright;
  const nextGalleryTitle = String(galleryTitle ?? current.galleryTitle ?? "").trim() || current.galleryTitle;
  const nextGallerySub = String(gallerySubtitle ?? current.gallerySubtitle ?? "").trim() || current.gallerySubtitle;

  const nextStats = Array.isArray(stats) && stats.length > 0
    ? stats.map((st) => ({
        value: String(st.value || "").trim() || "—",
        label: String(st.label || "").trim() || "Ko‘rsatkich"
      }))
    : current.stats;

  const nextPhotos = Array.isArray(heroPhotos) && heroPhotos.length > 0
    ? heroPhotos.map((ph, idx) => ({
        id: ph.id || `hero-${idx + 1}`,
        title: String(ph.title || `Kampus rasmi ${idx + 1}`).trim(),
        tag: String(ph.tag || "Kampus").trim(),
        image: saveUploadedImage(ph.image, `hero-${idx + 1}`) || current.heroPhotos[idx]?.image || "/images/campus-2.jpg"
      }))
    : current.heroPhotos;

  db.prepare(`
    UPDATE homepage_settings
    SET eyebrow_badge = ?, eyebrow_status = ?, title_prefix = ?, title_highlight = ?, title_suffix = ?,
        lead_text = ?, stats_json = ?, hero_photos_json = ?,
        footer_about = ?, footer_copyright = ?, gallery_title = ?, gallery_subtitle = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    nextBadge,
    nextStatus,
    nextPrefix,
    nextHighlight,
    nextSuffix,
    nextLead,
    JSON.stringify(nextStats),
    JSON.stringify(nextPhotos),
    nextFooterAbout,
    nextFooterCopy,
    nextGalleryTitle,
    nextGallerySub
  );

  return response.json({
    homepage: getHomepageSettings(),
    availableImages: getAvailableImages(),
    message: "Bosh sahifa matnlari va rasmlari yangilandi!"
  });
});

router.post("/faqs", (request, response) => {
  const { q, a } = request.body;
  const cleanQ = String(q || "").trim();
  const cleanA = String(a || "").trim();
  if (!cleanQ || !cleanA) {
    return response.status(400).json({ message: "Savol va javob matnini to‘liq kiriting." });
  }
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_ord FROM faq_items").get()?.max_ord || 0;
  db.prepare("INSERT INTO faq_items (question, answer, sort_order) VALUES (?, ?, ?)").run(cleanQ, cleanA, maxOrder + 1);
  return response.status(201).json({
    faqs: getFaqItems(),
    message: "Yangi savol-javob qo‘shildi!"
  });
});

router.patch("/faqs/:id", (request, response) => {
  const faqId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM faq_items WHERE id = ?").get(faqId);
  if (!existing) return response.status(404).json({ message: "Savol-javob topilmadi." });

  const cleanQ = request.body.q !== undefined ? String(request.body.q).trim() : existing.question;
  const cleanA = request.body.a !== undefined ? String(request.body.a).trim() : existing.answer;
  if (!cleanQ || !cleanA) {
    return response.status(400).json({ message: "Savol va javob bo‘sh bo‘lmasligi kerak." });
  }
  db.prepare("UPDATE faq_items SET question = ?, answer = ? WHERE id = ?").run(cleanQ, cleanA, faqId);
  return response.json({
    faqs: getFaqItems(),
    message: "Savol-javob yangilandi!"
  });
});

router.delete("/faqs/:id", (request, response) => {
  const res = db.prepare("DELETE FROM faq_items WHERE id = ?").run(Number(request.params.id));
  if (!res.changes) return response.status(404).json({ message: "Savol-javob topilmadi." });
  return response.json({
    faqs: getFaqItems(),
    message: "Savol-javob o‘chirildi."
  });
});

router.post("/upload-image", (request, response) => {
  const { imageData, prefix = "room", addToGallery = false, title = "Yangi rasm", category = "rooms", tag = "Yotoqxona" } = request.body;
  if (!imageData) return response.status(400).json({ message: "Rasm ma’lumotlari yuborilmadi." });
  const imageUrl = saveUploadedImage(imageData, prefix);
  if (!imageUrl) return response.status(400).json({ message: "Rasm formati noto‘g‘ri." });

  if (addToGallery) {
    db.prepare(`
      INSERT INTO gallery_photos (title, category, image, tag)
      VALUES (?, ?, ?, ?)
    `).run(String(title).trim() || "Yotoqxona surati", String(category).trim() || "rooms", imageUrl, String(tag).trim() || "Yotoqxona");
  }

  return response.status(201).json({
    imageUrl,
    availableImages: getAvailableImages(),
    gallery: getGalleryPhotos(),
    message: "Rasm serverga muvaffaqiyatli saqlandi!"
  });
});

router.post("/gallery-categories", (request, response) => {
  const { name, slug, description = "" } = request.body;
  const cleanName = String(name || "").trim();
  if (!cleanName) {
    return response.status(400).json({ message: "Bo‘lim nomini kiriting." });
  }
  const cleanSlug = slugifyCategory(slug || cleanName);
  const existing = db.prepare("SELECT * FROM gallery_categories WHERE slug = ? OR LOWER(name) = LOWER(?)").get(cleanSlug, cleanName);
  if (existing) {
    return response.status(409).json({ message: "Bunday nomli fotogalereya bo‘limi allaqachon mavjud." });
  }
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_ord FROM gallery_categories").get()?.max_ord || 0;
  db.prepare(`
    INSERT INTO gallery_categories (slug, name, description, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(cleanSlug, cleanName, String(description || "").trim(), maxOrder + 1);

  return response.status(201).json({
    galleryCategories: getGalleryCategories(),
    gallery: getGalleryPhotos(),
    message: `"${cleanName}" bo‘limi fotogalereyaga qo‘shildi!`
  });
});

router.patch("/gallery-categories/:id", (request, response) => {
  const catId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM gallery_categories WHERE id = ?").get(catId);
  if (!existing) return response.status(404).json({ message: "Bo‘lim topilmadi." });

  const cleanName = request.body.name !== undefined ? String(request.body.name).trim() : existing.name;
  const cleanDesc = request.body.description !== undefined ? String(request.body.description).trim() : existing.description;
  if (!cleanName) {
    return response.status(400).json({ message: "Bo‘lim nomi bo‘sh bo‘lmasligi kerak." });
  }
  db.prepare("UPDATE gallery_categories SET name = ?, description = ? WHERE id = ?").run(cleanName, cleanDesc, catId);
  return response.json({
    galleryCategories: getGalleryCategories(),
    gallery: getGalleryPhotos(),
    message: "Bo‘lim ma’lumotlari yangilandi!"
  });
});

router.delete("/gallery-categories/:id", (request, response) => {
  const catId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM gallery_categories WHERE id = ?").get(catId);
  if (!existing) return response.status(404).json({ message: "Bo‘lim topilmadi." });

  db.prepare("UPDATE gallery_photos SET category = 'campus' WHERE category = ?").run(existing.slug);
  db.prepare("DELETE FROM gallery_categories WHERE id = ?").run(catId);

  return response.json({
    galleryCategories: getGalleryCategories(),
    gallery: getGalleryPhotos(),
    message: `"${existing.name}" bo‘limi o‘chirildi.`
  });
});

router.post("/gallery", (request, response) => {
  const {
    title,
    category = "rooms",
    newCategoryName = "",
    newCategoryDescription = "",
    tag = "Yotoqxona",
    description = "",
    imageData,
    imageUrl
  } = request.body;
  const cleanTitle = String(title || "").trim();
  const savedImg = imageData ? saveUploadedImage(imageData, "gallery") : String(imageUrl || "").trim();
  if (!cleanTitle || !savedImg) {
    return response.status(400).json({ message: "Rasm nomi va faylini kiriting." });
  }

  let targetCategorySlug = String(category || "rooms").trim() || "rooms";
  if (String(newCategoryName || "").trim()) {
    const createdCat = ensureGalleryCategory({
      name: String(newCategoryName).trim(),
      description: String(newCategoryDescription || "").trim()
    });
    targetCategorySlug = createdCat.slug;
  } else {
    ensureGalleryCategory({ slug: targetCategorySlug, name: targetCategorySlug });
  }

  const cleanTag = String(tag || "").trim() || "Yotoqxona";
  const cleanDesc = String(description || "").trim();

  db.prepare(`
    INSERT INTO gallery_photos (title, category, image, tag, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(cleanTitle, targetCategorySlug, savedImg, cleanTag, cleanDesc);

  return response.status(201).json({
    gallery: getGalleryPhotos(),
    galleryCategories: getGalleryCategories(),
    availableImages: getAvailableImages(),
    message: "Rasm va pastki izoh fotogalereyaga qo‘shildi!"
  });
});

router.patch("/gallery/:id", (request, response) => {
  const photoId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM gallery_photos WHERE id = ?").get(photoId);
  if (!existing) return response.status(404).json({ message: "Rasm topilmadi." });

  const {
    title,
    category,
    newCategoryName = "",
    tag,
    description,
    imageData,
    imageUrl
  } = request.body;

  let nextCategory = category !== undefined ? String(category).trim() || existing.category : existing.category;
  if (String(newCategoryName || "").trim()) {
    const createdCat = ensureGalleryCategory({ name: String(newCategoryName).trim() });
    nextCategory = createdCat.slug;
  }

  const nextTitle = title !== undefined ? String(title).trim() || existing.title : existing.title;
  const nextTag = tag !== undefined ? String(tag).trim() || existing.tag : existing.tag;
  const nextDesc = description !== undefined ? String(description).trim() : (existing.description || "");
  const nextImg = imageData
    ? (saveUploadedImage(imageData, "gallery") || existing.image)
    : (imageUrl !== undefined && String(imageUrl).trim() ? String(imageUrl).trim() : existing.image);

  db.prepare(`
    UPDATE gallery_photos
    SET title = ?, category = ?, image = ?, tag = ?, description = ?
    WHERE id = ?
  `).run(nextTitle, nextCategory, nextImg, nextTag, nextDesc, photoId);

  return response.json({
    gallery: getGalleryPhotos(),
    galleryCategories: getGalleryCategories(),
    availableImages: getAvailableImages(),
    message: "Fotogalereya rasmi va pastki gapi yangilandi!"
  });
});

router.delete("/gallery/:id", (request, response) => {
  const res = db.prepare("DELETE FROM gallery_photos WHERE id = ?").run(Number(request.params.id));
  if (!res.changes) return response.status(404).json({ message: "Rasm topilmadi." });
  return response.json({
    gallery: getGalleryPhotos(),
    galleryCategories: getGalleryCategories()
  });
});

router.post("/bottom-texts", (request, response) => {
  const { section = "gallery", title, content = "", badge = "" } = request.body;
  const cleanTitle = String(title || "").trim();
  const cleanContent = String(content || "").trim();
  const cleanSection = ["gallery", "homepage"].includes(section) ? section : "gallery";
  if (!cleanTitle) {
    return response.status(400).json({ message: "Gap yoki sarlavha matnini kiriting." });
  }
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_ord FROM site_bottom_texts WHERE section = ?").get(cleanSection)?.max_ord || 0;
  db.prepare(`
    INSERT INTO site_bottom_texts (section, title, content, badge, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(cleanSection, cleanTitle, cleanContent, String(badge || "").trim(), maxOrder + 1);

  return response.status(201).json({
    bottomTexts: getSiteBottomTexts(),
    message: "Yangi pastki gap bazaga saqlandi va saytga qo‘shildi!"
  });
});

router.patch("/bottom-texts/:id", (request, response) => {
  const itemId = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM site_bottom_texts WHERE id = ?").get(itemId);
  if (!existing) return response.status(404).json({ message: "Ma’lumot topilmadi." });

  const cleanTitle = request.body.title !== undefined ? String(request.body.title).trim() : existing.title;
  const cleanContent = request.body.content !== undefined ? String(request.body.content).trim() : existing.content;
  const cleanBadge = request.body.badge !== undefined ? String(request.body.badge).trim() : existing.badge;
  if (!cleanTitle) {
    return response.status(400).json({ message: "Gap matni bo‘sh bo‘lmasligi kerak." });
  }
  db.prepare("UPDATE site_bottom_texts SET title = ?, content = ?, badge = ? WHERE id = ?").run(
    cleanTitle,
    cleanContent,
    cleanBadge,
    itemId
  );
  return response.json({
    bottomTexts: getSiteBottomTexts(),
    message: "Pastki gap yangilandi!"
  });
});

router.delete("/bottom-texts/:id", (request, response) => {
  const res = db.prepare("DELETE FROM site_bottom_texts WHERE id = ?").run(Number(request.params.id));
  if (!res.changes) return response.status(404).json({ message: "Ma’lumot topilmadi." });
  return response.json({
    bottomTexts: getSiteBottomTexts(),
    message: "Pastki gap o‘chirildi."
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

    const chatRow = getOrCreateSupportChat({
      bookingId: updatedBooking.id,
      studentAccountId: updatedBooking.student_account_id,
      studentName: updatedBooking.student_name,
      phone: updatedBooking.phone,
      course: updatedBooking.course || "",
      roomTitle: updatedBooking.room_title,
      assignedRoomNumber: updatedBooking.assigned_room_number || ""
    });
    if (status === "approved") {
      const autoReply = `Tabriklaymiz, ${updatedBooking.student_name}! Sizning "${updatedBooking.room_title}" bo‘yicha arizangiz tasdiqlandi${updatedBooking.assigned_room_number ? ` va ${updatedBooking.assigned_room_number}-xonaga biriktirildi` : ""}.${adminNote ? ` Ma’muriyat izohi: ${adminNote}` : ""} Savollaringiz bo‘lsa shu chatda yozishingiz mumkin.`;
      db.prepare(`
        INSERT INTO support_chat_messages (chat_id, sender_role, sender_name, message)
        VALUES (?, 'admin', 'TPU Ma’muriyati', ?)
      `).run(chatRow.id, autoReply);
      db.prepare(`
        UPDATE support_chats
        SET last_message = ?, assigned_room_number = ?, unread_student = unread_student + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(autoReply, updatedBooking.assigned_room_number || "", chatRow.id);
    }

    const rooms = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all().map(formatRoomInventory);
    return response.json({
      booking: updatedBooking,
      rooms,
      dormRooms: getAdminDormRooms(),
      residents: getAdminResidents(),
      chats: getAdminSupportChats()
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

router.post("/rooms", (request, response) => {
  const {
    title,
    price,
    spotsPerRoom = 2,
    totalRooms = 10,
    occupiedSpots = 0,
    floor = "4-qavat",
    size = "28 m²",
    bathroom = "Xona ichida shaxsiy sanuzel",
    tag = "Yangi tur",
    badgeType = "recommended",
    image,
    gallery,
    description,
    features,
    amenities,
    initialRoomNumber
  } = request.body;

  const cleanTitle = String(title || "").trim();
  const rawPrice = String(price || "").trim();
  const priceNum = parsePriceDigits(rawPrice);
  if (!cleanTitle || !priceNum) {
    return response.status(400).json({ message: "Xona turi nomi va oylik narxini kiriting." });
  }

  const formattedPrice = rawPrice.includes("so") ? rawPrice : formatPriceUzs(priceNum);
  const cleanSpots = Math.max(1, Math.min(12, Math.round(Number(spotsPerRoom) || 2)));
  const cleanTotalRooms = Math.max(1, Math.min(500, Math.round(Number(totalRooms) || 10)));
  const maxSpots = cleanTotalRooms * cleanSpots;
  const cleanOccupied = Math.max(0, Math.min(maxSpots, Math.round(Number(occupiedSpots) || 0)));
  const savedImage = saveUploadedImage(image, "roomtype") || "/images/room3.jpeg";

  const galleryArr = Array.isArray(gallery) && gallery.length > 0
    ? gallery.map((img) => saveUploadedImage(img, "roomtype") || img).filter(Boolean)
    : [savedImage];
  if (!galleryArr.includes(savedImage)) galleryArr.unshift(savedImage);

  const featuresArr = Array.isArray(features)
    ? features
    : String(features || "Wi-Fi 500 Mbps, O‘qish stoli, Konditsioner, Kunlik tozalash")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const amenitiesArr = Array.isArray(amenities)
    ? amenities
    : String(amenities || `${cleanSpots} ta ortopedik karavot, 500 Mbit/s Wi-Fi, Markaziy isitish, Kunlik tozalash`)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const categorySlug = `type_${Date.now().toString(36)}`;
  const cleanDesc = String(description || "").trim() || `${cleanSpots} kishilik barcha qulayliklarga ega zamonaviy talabalar xonasi.`;

  const res = db.prepare(`
    INSERT INTO room_inventory (
      category, title, price, price_num, total_rooms, spots_per_room, occupied_spots,
      people, tag, badge_type, floor, size, bathroom, image, gallery_json, description, amenities_json, features_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    categorySlug,
    cleanTitle,
    formattedPrice,
    priceNum,
    cleanTotalRooms,
    cleanSpots,
    cleanOccupied,
    `${cleanSpots} o‘rin`,
    String(tag || "Yangi").trim(),
    ["recommended", "popular", "budget", "exclusive"].includes(badgeType) ? badgeType : "recommended",
    String(floor || "4-qavat").trim(),
    String(size || "26 m²").trim(),
    String(bathroom || "Shaxsiy sanuzel").trim(),
    savedImage,
    JSON.stringify(galleryArr),
    cleanDesc,
    JSON.stringify(amenitiesArr),
    JSON.stringify(featuresArr)
  );

  const newTypeId = res.lastInsertRowid;
  if (initialRoomNumber && String(initialRoomNumber).trim()) {
    const cleanNum = String(initialRoomNumber).trim();
    const parsedFloor = parseInt(String(floor).replace(/\D/g, ""), 10) || 4;
    if (!db.prepare("SELECT id FROM dorm_rooms WHERE room_number = ?").get(cleanNum)) {
      db.prepare(`
        INSERT INTO dorm_rooms (room_number, room_type_id, room_category, floor, capacity, status, custom_price, image, description)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `).run(cleanNum, newTypeId, categorySlug, parsedFloor, cleanSpots, formattedPrice, savedImage, cleanDesc);
    }
  }

  db.prepare(`
    INSERT INTO gallery_photos (title, category, image, tag)
    VALUES (?, 'rooms', ?, ?)
  `).run(cleanTitle, savedImage, `${cleanSpots} o‘rin`);

  const rooms = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all().map(formatRoomInventory);
  return response.status(201).json({
    rooms,
    dormRooms: getAdminDormRooms(),
    gallery: getGalleryPhotos(),
    availableImages: getAvailableImages(),
    message: "Yangi xona turi, narxi va rasmi qo‘shildi!"
  });
});

router.put("/rooms/:id", (request, response) => {
  const roomId = Number(request.params.id);
  const {
    totalRooms,
    occupiedSpots,
    title,
    price,
    spotsPerRoom,
    floor,
    size,
    bathroom,
    tag,
    badgeType,
    image,
    gallery,
    description,
    features,
    amenities
  } = request.body;
  const inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(roomId);
  if (!inv) return response.status(404).json({ message: "Xona turi topilmadi." });

  const nextSpotsPerRoom = spotsPerRoom !== undefined
    ? Math.max(1, Math.min(12, Math.round(Number(spotsPerRoom) || inv.spots_per_room)))
    : inv.spots_per_room;
  const nextTotalRooms = Math.max(1, Math.min(500, Math.round(Number(totalRooms ?? inv.total_rooms))));
  const maxSpots = nextTotalRooms * nextSpotsPerRoom;
  const nextOccupied = Math.max(0, Math.min(maxSpots, Math.round(Number(occupiedSpots ?? inv.occupied_spots))));

  const nextTitle = title !== undefined && String(title).trim() ? String(title).trim() : inv.title;
  let nextPrice = inv.price;
  let nextPriceNum = inv.price_num || parsePriceDigits(inv.price);
  if (price !== undefined && String(price).trim()) {
    const rawP = String(price).trim();
    const digits = parsePriceDigits(rawP);
    if (digits > 0) {
      nextPriceNum = digits;
      nextPrice = rawP.includes("so") ? rawP : formatPriceUzs(digits);
    }
  }

  const nextImage = image !== undefined && String(image).trim()
    ? (saveUploadedImage(image, "roomtype") || inv.image)
    : inv.image;

  let nextGalleryJson = inv.gallery_json;
  if (gallery !== undefined) {
    const arr = Array.isArray(gallery)
      ? gallery.map((g) => saveUploadedImage(g, "roomtype") || g).filter(Boolean)
      : [nextImage];
    if (!arr.includes(nextImage)) arr.unshift(nextImage);
    nextGalleryJson = JSON.stringify(arr);
  } else if (image !== undefined && nextImage) {
    const existingGal = (() => {
      try { return JSON.parse(inv.gallery_json || "[]"); } catch { return []; }
    })();
    const updatedGal = [nextImage, ...existingGal.filter((g) => g !== nextImage)];
    nextGalleryJson = JSON.stringify(updatedGal);
  }

  let nextFeaturesJson = inv.features_json;
  if (features !== undefined) {
    const fArr = Array.isArray(features)
      ? features
      : String(features).split(",").map((s) => s.trim()).filter(Boolean);
    if (fArr.length > 0) nextFeaturesJson = JSON.stringify(fArr);
  }

  let nextAmenitiesJson = inv.amenities_json;
  if (amenities !== undefined) {
    const aArr = Array.isArray(amenities)
      ? amenities
      : String(amenities).split(",").map((s) => s.trim()).filter(Boolean);
    if (aArr.length > 0) nextAmenitiesJson = JSON.stringify(aArr);
  }

  const nextFloor = floor !== undefined ? String(floor).trim() || inv.floor : inv.floor;
  const nextSize = size !== undefined ? String(size).trim() || inv.size : inv.size;
  const nextBathroom = bathroom !== undefined ? String(bathroom).trim() || inv.bathroom : inv.bathroom;
  const nextTag = tag !== undefined ? String(tag).trim() || inv.tag : inv.tag;
  const nextBadgeType = badgeType !== undefined && ["recommended", "popular", "budget", "exclusive"].includes(badgeType)
    ? badgeType
    : inv.badge_type;
  const nextDesc = description !== undefined ? String(description).trim() || inv.description : inv.description;

  db.prepare(`
    UPDATE room_inventory
    SET total_rooms = ?, occupied_spots = ?, spots_per_room = ?, people = ?,
        title = ?, price = ?, price_num = ?, floor = ?, size = ?, bathroom = ?,
        tag = ?, badge_type = ?, image = ?, gallery_json = ?, description = ?,
        features_json = ?, amenities_json = ?
    WHERE id = ?
  `).run(
    nextTotalRooms,
    nextOccupied,
    nextSpotsPerRoom,
    `${nextSpotsPerRoom} o‘rin`,
    nextTitle,
    nextPrice,
    nextPriceNum,
    nextFloor,
    nextSize,
    nextBathroom,
    nextTag,
    nextBadgeType,
    nextImage,
    nextGalleryJson,
    nextDesc,
    nextFeaturesJson,
    nextAmenitiesJson,
    roomId
  );

  const rooms = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all().map(formatRoomInventory);
  return response.json({
    room: formatRoomInventory(db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(roomId)),
    rooms,
    dormRooms: getAdminDormRooms(),
    availableImages: getAvailableImages()
  });
});

router.delete("/rooms/:id", (request, response) => {
  const roomId = Number(request.params.id);
  const inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(roomId);
  if (!inv) return response.status(404).json({ message: "Xona turi topilmadi." });

  const linkedRooms = db.prepare("SELECT id FROM dorm_rooms WHERE room_type_id = ?").all(roomId);
  for (const lr of linkedRooms) {
    const occ = db.prepare("SELECT COUNT(*) AS cnt FROM room_residents WHERE dorm_room_id = ?").get(lr.id)?.cnt || 0;
    if (occ > 0) {
      return response.status(409).json({ message: "Ushbu xona turiga mansub xonalarda yashovchi talabalar bor." });
    }
  }
  db.prepare("DELETE FROM dorm_rooms WHERE room_type_id = ?").run(roomId);
  db.prepare("DELETE FROM room_inventory WHERE id = ?").run(roomId);
  const rooms = db.prepare("SELECT * FROM room_inventory ORDER BY id ASC").all().map(formatRoomInventory);
  return response.json({ rooms, dormRooms: getAdminDormRooms() });
});

router.post("/dorm-rooms", (request, response) => {
  const { roomNumber, roomTypeId, floor, status = "active", customPrice, image, description } = request.body;
  const cleanNumber = String(roomNumber || "").trim();
  const inv = db.prepare("SELECT * FROM room_inventory WHERE id = ?").get(Number(roomTypeId));
  const cleanFloor = Number(floor);
  if (!cleanNumber || !inv || !Number.isInteger(cleanFloor) || cleanFloor < 1 || cleanFloor > 20) {
    return response.status(400).json({ message: "Xona raqami, qavati va turini to‘g‘ri kiriting." });
  }
  if (db.prepare("SELECT id FROM dorm_rooms WHERE room_number = ?").get(cleanNumber)) {
    return response.status(409).json({ message: `${cleanNumber}-xona allaqachon mavjud.` });
  }

  let formattedCustomPrice = null;
  if (customPrice && String(customPrice).trim()) {
    const rawCp = String(customPrice).trim();
    const digits = parsePriceDigits(rawCp);
    formattedCustomPrice = digits > 0 ? (rawCp.includes("so") ? rawCp : formatPriceUzs(digits)) : rawCp;
  }

  const savedImage = image ? saveUploadedImage(image, `room-${cleanNumber}`) : (inv.image || "/images/room3.jpeg");
  const cleanDesc = description !== undefined ? String(description).trim() : (inv.description || "");

  db.prepare(`
    INSERT INTO dorm_rooms (room_number, room_type_id, room_category, floor, capacity, status, custom_price, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cleanNumber,
    inv.id,
    inv.category,
    cleanFloor,
    inv.spots_per_room,
    status === "maintenance" ? "maintenance" : "active",
    formattedCustomPrice,
    savedImage,
    cleanDesc
  );

  return response.status(201).json({
    dormRooms: getAdminDormRooms(),
    availableImages: getAvailableImages()
  });
});

router.patch("/dorm-rooms/:id", (request, response) => {
  const dormRoomId = Number(request.params.id);
  const { status, roomNumber, floor, roomTypeId, customPrice, image, description } = request.body;
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

  let nextCustomPrice = existing.custom_price;
  if (customPrice !== undefined) {
    const rawCp = String(customPrice || "").trim();
    if (!rawCp) {
      nextCustomPrice = null;
    } else {
      const digits = parsePriceDigits(rawCp);
      nextCustomPrice = digits > 0 ? (rawCp.includes("so") ? rawCp : formatPriceUzs(digits)) : rawCp;
    }
  }

  const nextImage = image !== undefined
    ? (image ? saveUploadedImage(image, `room-${nextNumber}`) : null)
    : existing.image;
  const nextDesc = description !== undefined ? String(description).trim() : existing.description;

  db.prepare(`
    UPDATE dorm_rooms
    SET status = ?, room_number = ?, floor = ?, room_type_id = ?, room_category = ?, capacity = ?,
        custom_price = ?, image = ?, description = ?
    WHERE id = ?
  `).run(
    nextStatus,
    nextNumber,
    nextFloor,
    nextTypeId,
    nextCategory,
    nextCapacity,
    nextCustomPrice,
    nextImage,
    nextDesc,
    dormRoomId
  );

  return response.json({
    dormRooms: getAdminDormRooms(),
    availableImages: getAvailableImages()
  });
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
