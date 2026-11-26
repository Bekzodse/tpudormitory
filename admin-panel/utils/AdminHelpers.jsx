import React from "react";

export const STATUS_LABELS = {
  pending: "Kutilmoqda",
  approved: "Qabul qilindi",
  rejected: "Rad etildi"
};

export const PAYMENT_LABELS = {
  paid: "To‘langan",
  pending: "Kutilmoqda",
  overdue: "Qarzdor"
};

export const MAINT_LABELS = {
  open: "Ochiq",
  in_progress: "Jarayonda",
  resolved: "Hal qilindi"
};

export const PRIO_LABELS = {
  high: "Shoshilinch",
  medium: "O‘rtacha",
  low: "Past"
};

export const MESSAGE_STATUS_LABELS = {
  new: "Yangi",
  read: "Ko‘rib chiqildi",
  replied: "Javob berildi"
};

export const ACTION_TYPE_LABELS = {
  create: "Yaratildi",
  update: "Tahrirlandi",
  delete: "O‘chirildi",
  contact: "Klient bilan bog‘landi"
};

export const SECTION_LABELS = {
  bookings: "Bron so‘rovlari",
  chats: "Support Chatlar",
  rooms: "Xona turlari",
  dormRooms: "Xona raqamlari",
  residents: "Yashovchi talabalar",
  students: "Talaba akkauntlari",
  payments: "To‘lovlar va moliya",
  maintenance: "Texnik xizmat",
  announcements: "E’lonlar",
  messages: "Aloqa xabarlari",
  gallery: "Fotogalereya",
  facilities: "Qulayliklar",
  homepage: "Bosh sahifa",
  faqs: "Savol-Javob (FAQ)",
  bottomTexts: "Pastki gaplar",
  clients: "Klientlar bilan aloqa",
  database: "Ma’lumotlar bazasi"
};

export function downloadActivityLogsCsv(logs) {
  const headers = [
    "ID", "Vaqt", "Admin", "Harakat turi", "Bo‘lim", "Ob’ekt", "Klient", "Telefon", "Tavsif"
  ];
  const escapeCell = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
  const rows = (logs || []).map((l) =>
    [
      l.id,
      l.createdAt,
      `${l.adminName} (${l.adminLogin})`,
      ACTION_TYPE_LABELS[l.actionType] || l.actionType,
      SECTION_LABELS[l.section] || l.section,
      l.targetName || l.entityLabel || "",
      l.clientName || "",
      l.clientPhone || "",
      l.summary || ""
    ].map(escapeCell).join(",")
  );
  const csv = "\uFEFF" + [headers.map(escapeCell).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tpu-admin-ishlar-jurnali-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseUzsAmount(priceText) {
  const digits = String(priceText || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatUzs(amount) {
  return `${Math.round(amount).toLocaleString("ru-RU").replace(/,/g, " ")} so‘m`;
}

export function readRoomImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Faqat rasm faylini tanlang (JPG, PNG, WEBP)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Rasmni o‘qib bo‘lmadi."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasmni qayta ishlab bo‘lmadi."));
      img.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function downloadResidentsCsv(residents) {
  const headers = [
    "F.I.Sh.", "Xona", "Qavat", "Kurs", "Fakultet", "Telefon",
    "Telegram", "To‘lov holati", "Oylik narx", "Ko‘chib o‘tgan sana"
  ];
  const escapeCell = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
  const rows = residents.map((r) =>
    [
      r.studentName,
      `${r.roomNumber}-xona`,
      `${r.floor}-qavat`,
      r.course,
      r.faculty,
      r.phone,
      r.telegram,
      PAYMENT_LABELS[r.paymentStatus] || r.paymentStatus,
      r.monthlyPrice,
      r.moveInDate
    ].map(escapeCell).join(",")
  );
  const csv = "\uFEFF" + [headers.map(escapeCell).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tpu-yotoqxona-talabalar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPaymentsCsv(residents) {
  const headers = [
    "F.I.Sh.", "Xona", "Qavat", "Oylik tarif", "To‘lov holati", "Telefon", "Kurs", "Fakultet"
  ];
  const escapeCell = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
  const rows = residents.map((r) =>
    [
      r.studentName,
      `${r.roomNumber}-xona`,
      `${r.floor}-qavat`,
      r.monthlyPrice,
      PAYMENT_LABELS[r.paymentStatus] || r.paymentStatus,
      r.phone,
      r.course,
      r.faculty
    ].map(escapeCell).join(",")
  );
  const csv = "\uFEFF" + [headers.map(escapeCell).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tpu-yotoqxona-moliya-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBookingsCsv(bookings) {
  const headers = [
    "ID", "Talaba F.I.Sh.", "Telefon", "Telegram", "Kurs", "Xona turi",
    "So‘ralgan xona", "Biriktirilgan xona", "Muddati", "Holati", "Yuborilgan vaqt"
  ];
  const escapeCell = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
  const rows = bookings.map((b) =>
    [
      b.id,
      b.student_name,
      b.phone,
      b.telegram || "",
      b.course || "",
      b.room_title,
      b.preferred_room_number ? `${b.preferred_room_number}-xona` : "",
      b.assigned_room_number ? `${b.assigned_room_number}-xona` : "",
      b.duration,
      STATUS_LABELS[b.status] || b.status,
      b.created_at
    ].map(escapeCell).join(",")
  );
  const csv = "\uFEFF" + [headers.map(escapeCell).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tpu-yotoqxona-arizalar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SectionTotalsBar({ items }) {
  return (
    <div className="admin-section-totals">
      {items.map((item) => (
        <div key={item.label} className={`admin-total-tile ${item.tone || ""}`}>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
          {item.sub && <span>{item.sub}</span>}
        </div>
      ))}
    </div>
  );
}
