import React from "react";
import { ArrowRight, CalendarDays, Check, ShieldCheck, X } from "lucide-react";
import { COURSE_OPTIONS } from "../data/dormData";

export default function BookingModal({
  bookingForm,
  setBookingForm,
  bookingSubmitted,
  bookingSubmitting,
  bookingError,
  rooms,
  publicDormRooms,
  closeBookingModal,
  handleBookingSubmit
}) {
  return (
    <div className="modal-backdrop" onClick={closeBookingModal}>
      <div
        className="booking-modal modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={closeBookingModal}
          aria-label="Yopish"
        >
          <X size={20} />
        </button>

        {bookingSubmitted ? (
          <div className="success-state">
            <span className="success-check-bubble">
              <Check size={32} />
            </span>
            <h2>Arizangiz qabul qilindi!</h2>
            <p>
              Rahmat, <strong>{bookingForm.name}</strong>! Sizning <strong>"{bookingForm.room}"</strong> bo‘yicha arizangiz qabul qilindi. Tez orada administratorimiz <strong>{bookingForm.phone}</strong> raqamingizga qo‘ng‘iroq qilib, rasmiylashtirishni yakunlaydi.
            </p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={closeBookingModal}>
                Tushunarli, yopish
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="booking-form">
            <div className="modal-header-badge">
              <span className="section-kicker">
                <CalendarDays size={14} /> Onlayn Bron Qilish
              </span>
              <h2 id="booking-title">Xonani band qilish</h2>
              <p className="modal-desc">
                Ma’lumotlaringizni qoldiring. Administratorimiz 15 daqiqa ichida siz bilan bog‘lanadi.
              </p>
            </div>

            <div className="form-fields-grid">
              <label className="input-group">
                <span>Ism va familiya *</span>
                <input
                  required
                  type="text"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  placeholder="Masalan: Sardor Aliyev"
                />
              </label>

              <label className="input-group">
                <span>Telefon raqami *</span>
                <input
                  required
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                />
              </label>

              <label className="input-group">
                <span>Telegram (ixtiyoriy)</span>
                <input
                  type="text"
                  value={bookingForm.telegram}
                  onChange={(e) => setBookingForm({ ...bookingForm, telegram: e.target.value })}
                  placeholder="@username"
                />
              </label>

              <label className="input-group">
                <span>Kursi *</span>
                <select
                  value={bookingForm.course}
                  onChange={(e) => setBookingForm({ ...bookingForm, course: e.target.value })}
                >
                  {COURSE_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="input-group">
                <span>Yoshingiz</span>
                <input
                  type="number"
                  min={15}
                  max={60}
                  value={bookingForm.age}
                  onChange={(e) => setBookingForm({ ...bookingForm, age: e.target.value })}
                  placeholder="20"
                />
              </label>

              <label className="input-group">
                <span>Ko‘chib o‘tish sanasi</span>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                />
              </label>

              <label className="input-group">
                <span>Xona turini tanlang *</span>
                <select
                  value={bookingForm.room}
                  onChange={(e) => setBookingForm({ ...bookingForm, room: e.target.value, preferredRoomNumber: "" })}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.title}>
                      {r.title} — {r.price}/oy ({r.availableSpots} bo‘sh joy)
                    </option>
                  ))}
                </select>
              </label>

              <label className="input-group">
                <span>Aniq xona raqami (ixtiyoriy)</span>
                <select
                  value={bookingForm.preferredRoomNumber || ""}
                  onChange={(e) => setBookingForm({ ...bookingForm, preferredRoomNumber: e.target.value })}
                >
                  <option value="">Avtomatik bo‘sh xonaga biriktirish</option>
                  {publicDormRooms
                    .filter((dr) => {
                      const matched = rooms.find((r) => r.title === bookingForm.room);
                      return (!matched || dr.roomCategory === matched.category) && dr.status === "active" && dr.available > 0;
                    })
                    .map((dr) => (
                      <option key={dr.id} value={dr.roomNumber}>
                        {dr.roomNumber}-xona • {dr.floor}-qavat ({dr.available} ta bo‘sh joy)
                      </option>
                    ))}
                </select>
              </label>

              <label className="input-group">
                <span>Yashash muddati</span>
                <select
                  value={bookingForm.duration}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration: e.target.value })}
                >
                  <option value="1 semestr">1 semestr (5 oy)</option>
                  <option value="1 o'quv yili">1 o‘quv yili (10 oy) — 10% chegirma</option>
                  <option value="oyma-oy">Oyma-oy to‘lov</option>
                </select>
              </label>

              <label className="input-group full-width">
                <span>Qo‘shimcha istaklar yoki xonadosh ismi (ixtiyoriy)</span>
                <textarea
                  rows={3}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Masalan: 3-qavatdagi xona yoki do‘stim Alisher bilan bitta xonada bo‘lish..."
                />
              </label>
            </div>

            {bookingError && <div className="auth-error-alert" role="alert">{bookingError}</div>}

            <div className="form-submit-row">
              <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={bookingSubmitting}>
                <span>{bookingSubmitting ? "Yuborilmoqda..." : "Arizani yuborish"}</span>
                <ArrowRight size={17} className="btn-arrow" />
              </button>
              <small className="form-privacy-note">
                <ShieldCheck size={14} /> Ma’lumotlaringiz xavfsizligi kafolatlanadi.
              </small>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
