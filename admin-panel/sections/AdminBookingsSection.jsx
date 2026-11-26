import React, { useMemo, useState } from "react";
import { CalendarDays, Check, DoorOpen, Download, MessageSquare, Pencil, Phone, Plus, Send, Trash2, X } from "lucide-react";
import { downloadBookingsCsv, PAYMENT_LABELS, SectionTotalsBar, STATUS_LABELS } from "../utils/AdminHelpers";

export default function AdminBookingsSection({
  overview,
  totals,
  busyId,
  runAdminRequest,
  onOpenUserFromBooking,
  onOpenChatFromBooking,
  onNewBooking,
  onEditBooking,
  onLogContact
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomCategoryFilter, setRoomCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingRoomChoices, setBookingRoomChoices] = useState({});
  const [bookingNotes, setBookingNotes] = useState({});

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return overview.bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (roomCategoryFilter !== "all" && b.room_category !== roomCategoryFilter) return false;
      if (!q) return true;
      return (
        b.student_name.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        (b.telegram || "").toLowerCase().includes(q)
      );
    });
  }, [overview.bookings, statusFilter, roomCategoryFilter, searchQuery]);

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Jami kelgan so‘rovlar", value: `${overview.bookings.length} ta`, sub: `Filtrlangan: ${filteredBookings.length} ta` },
          { label: "Kutilmoqda", value: `${totals.pendingBookings} ta`, tone: "is-amber", sub: "Ko‘rib chiqilishi kerak" },
          { label: "Qabul qilindi", value: `${overview.bookings.filter((b) => b.status === "approved").length} ta`, tone: "is-green", sub: "Joy ajratilgan" },
          { label: "Rad etildi", value: `${overview.bookings.filter((b) => b.status === "rejected").length} ta`, tone: "is-red", sub: "Arxivlangan" }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          {[
            { key: "all", label: `Barchasi (${overview.bookings.length})` },
            { key: "pending", label: `Kutilmoqda (${overview.bookings.filter((b) => b.status === "pending").length})` },
            { key: "approved", label: `Qabul qilindi (${overview.bookings.filter((b) => b.status === "approved").length})` },
            { key: "rejected", label: `Rad etildi (${overview.bookings.filter((b) => b.status === "rejected").length})` }
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              className={`compare-tab-btn ${statusFilter === st.key ? "active" : ""}`}
              onClick={() => setStatusFilter(st.key)}
            >
              {st.label}
            </button>
          ))}
        </div>
        <div className="admin-search-controls">
          <select value={roomCategoryFilter} onChange={(e) => setRoomCategoryFilter(e.target.value)}>
            <option value="all">Barcha xonalar</option>
            <option value="two">2 kishilik</option>
            <option value="four">4 kishilik</option>
            <option value="six">6 kishilik</option>
          </select>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, telefon yoki Telegram..."
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => downloadBookingsCsv(filteredBookings)}
          >
            <Download size={14} /> CSV yuklash
          </button>
          {onNewBooking && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onNewBooking}>
              <Plus size={14} /> Yangi ariza
            </button>
          )}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="admin-empty-box">
          <CalendarDays size={28} />
          <strong>Mos arizalar topilmadi</strong>
        </div>
      ) : (
        <div className="admin-bookings-list">
          {filteredBookings.map((b) => {
            const candidateRooms = overview.dormRooms.filter(
              (dr) => dr.roomCategory === b.room_category && dr.status === "active" && dr.available > 0
            );
            return (
              <article className={`admin-booking-card status-${b.status}`} key={b.id}>
                <div className="booking-card-top">
                  <div
                    className="booking-student-id admin-clickable-card"
                    title="Talabaning to‘liq holati va tahrirlashni ochish"
                    onClick={() => onOpenUserFromBooking(b)}
                  >
                    <span className="profile-initials">
                      {b.student_avatar ? (
                        <img src={b.student_avatar} alt={b.student_name} />
                      ) : (
                        b.student_name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div>
                      <h3>{b.student_name}</h3>
                      <small>
                        #{b.id} • {new Date(b.created_at + "Z").toLocaleString("uz-UZ")}
                        {b.preferred_room_number ? ` • So‘ralgan: ${b.preferred_room_number}-xona` : ""}
                        {b.assigned_room_number ? ` • ${b.assigned_room_number}-xonaga joylashtirilgan` : ""}
                      </small>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {b.preferred_room_number && !b.assigned_room_number && (
                      <span className="pay-pill is-pending">
                        <DoorOpen size={12} /> So‘ralgan: {b.preferred_room_number}-xona
                      </span>
                    )}
                    {b.resident_payment_status && (
                      <span className={`pay-pill is-${b.resident_payment_status}`}>
                        To‘lov: {PAYMENT_LABELS[b.resident_payment_status]}
                      </span>
                    )}
                    <span className={`admin-status-badge status-${b.status}`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                </div>

                <div className="booking-details-grid">
                  <div className="booking-detail-item">
                    <small>Telefon raqam</small>
                    <a
                      href={`tel:${b.phone.replace(/\s+/g, "")}`}
                      className="booking-contact-link"
                      onClick={() =>
                        onLogContact &&
                        onLogContact({
                          section: "bookings",
                          clientName: b.student_name,
                          clientPhone: b.phone,
                          channel: "Telefon qo‘ng‘irog‘i",
                          summary: `Bron arizasi (#${b.id}) bo‘yicha ${b.student_name} ga qo‘ng‘iroq qildi`
                        })
                      }
                    >
                      <Phone size={13} /> {b.phone}
                    </a>
                  </div>
                  <div className="booking-detail-item">
                    <small>Telegram</small>
                    {b.telegram ? (
                      <a
                        href={`https://t.me/${b.telegram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="booking-contact-link"
                        onClick={() =>
                          onLogContact &&
                          onLogContact({
                            section: "bookings",
                            clientName: b.student_name,
                            clientPhone: b.phone,
                            channel: "Telegram",
                            summary: `${b.student_name} (${b.telegram}) bilan Telegram orqali bog‘landi`
                          })
                        }
                      >
                        <Send size={13} /> {b.telegram.startsWith("@") ? b.telegram : `@${b.telegram}`}
                      </a>
                    ) : (
                      <span>Ko‘rsatilmagan</span>
                    )}
                  </div>
                  <div className="booking-detail-item">
                    <small>Kursi va yoshi</small>
                    <b>{[b.course, b.age ? `${b.age} yosh` : ""].filter(Boolean).join(" • ") || "—"}</b>
                  </div>
                  <div className="booking-detail-item">
                    <small>Tanlangan xona turi</small>
                    <b>{b.room_title.replace(/^\d+\s*\/\s*/, "")}</b>
                  </div>
                  <div className="booking-detail-item">
                    <small>Ko‘chib o‘tish sanasi</small>
                    <b>{b.move_in_date || "Belgilanmagan"}</b>
                  </div>
                  <div className="booking-detail-item">
                    <small>Muddati</small>
                    <b>{b.duration}</b>
                  </div>
                </div>

                {b.notes && (
                  <div className="booking-notes-box">
                    <small>Talaba izohi:</small>
                    <p>{b.notes}</p>
                  </div>
                )}

                {b.admin_note && (
                  <div className="booking-notes-box" style={{ background: "#f0f7ff", borderColor: "#bfdbfe" }}>
                    <small style={{ color: "#1d4ed8" }}>Admin izohi:</small>
                    <p style={{ color: "#1e3a8a" }}>{b.admin_note}</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                  <input
                    type="text"
                    className="admin-booking-note-input"
                    style={{ marginTop: 0, flex: 1 }}
                    placeholder="Admin izohi (ixtiyoriy, masalan: '2-sentabrda shartnoma imzolashga kelsin')..."
                    value={bookingNotes[b.id] ?? b.admin_note ?? ""}
                    onChange={(e) => setBookingNotes((p) => ({ ...p, [b.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busyId === `note-${b.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/bookings/${b.id}`,
                        method: "PATCH",
                        body: { status: b.status, adminNote: bookingNotes[b.id] ?? b.admin_note ?? "" },
                        busyKey: `note-${b.id}`,
                        successMsg: "Admin izohi saqlandi!"
                      })
                    }
                  >
                    Izohni saqlash
                  </button>
                </div>

                <div className="booking-card-actions" style={{ marginTop: 12 }}>
                  {b.status !== "approved" && (
                    <>
                      {candidateRooms.length > 0 && (
                        <label className="admin-booking-room-assign">
                          <span>Xona:</span>
                          <select
                            value={bookingRoomChoices[b.id] || ""}
                            onChange={(e) => setBookingRoomChoices((p) => ({ ...p, [b.id]: e.target.value }))}
                          >
                            <option value="">Avtomatik ({candidateRooms[0].roomNumber})</option>
                            {candidateRooms.map((cr) => (
                              <option key={cr.id} value={cr.id}>
                                {cr.roomNumber}-xona ({cr.available} bo‘sh)
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === `booking-${b.id}`}
                        onClick={() =>
                          runAdminRequest({
                            url: `/api/admin/bookings/${b.id}`,
                            method: "PATCH",
                            body: {
                              status: "approved",
                              adminNote: bookingNotes[b.id] ?? b.admin_note ?? "",
                              dormRoomId: bookingRoomChoices[b.id] ? Number(bookingRoomChoices[b.id]) : undefined
                            },
                            busyKey: `booking-${b.id}`,
                            successMsg: "Ariza qabul qilindi va xonaga biriktirildi!"
                          })
                        }
                      >
                        <Check size={14} /> Qabul qilish
                      </button>
                    </>
                  )}
                  {b.status !== "rejected" && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={busyId === `booking-${b.id}`}
                      onClick={() =>
                        runAdminRequest({
                          url: `/api/admin/bookings/${b.id}`,
                          method: "PATCH",
                          body: { status: "rejected", adminNote: bookingNotes[b.id] ?? b.admin_note ?? "" },
                          busyKey: `booking-${b.id}`,
                          successMsg: "Ariza rad etildi."
                        })
                      }
                    >
                      <X size={14} /> Rad etish
                    </button>
                  )}
                  {b.status !== "pending" && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={busyId === `booking-${b.id}`}
                      onClick={() =>
                        runAdminRequest({
                          url: `/api/admin/bookings/${b.id}`,
                          method: "PATCH",
                          body: { status: "pending", adminNote: bookingNotes[b.id] ?? b.admin_note ?? "" },
                          busyKey: `booking-${b.id}`,
                          successMsg: "Ariza kutilmoqdaga qaytarildi."
                        })
                      }
                    >
                      Kutilmoqdaga qaytarish
                    </button>
                  )}
                  {onEditBooking && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onEditBooking(b)}
                    >
                      <Pencil size={13} /> Tahrirlash
                    </button>
                  )}
                  {onOpenChatFromBooking && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenChatFromBooking(b)}
                    >
                      <MessageSquare size={14} /> Talaba bilan chat
                    </button>
                  )}
                  <button
                    type="button"
                    className="avatar-remove-btn booking-delete-btn"
                    disabled={busyId === `delete-${b.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/bookings/${b.id}`,
                        method: "DELETE",
                        busyKey: `delete-${b.id}`,
                        successMsg: "Ariza o‘chirildi."
                      })
                    }
                  >
                    <Trash2 size={13} /> O‘chirish
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
