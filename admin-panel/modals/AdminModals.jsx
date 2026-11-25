import React from "react";
import { CreditCard, DoorOpen, Pencil, Plus, Trash2, Users, Wrench, X } from "lucide-react";
import { PAYMENT_LABELS, STATUS_LABELS } from "../utils/AdminHelpers";

export default function AdminModals({
  overview,
  busyId,
  runAdminRequest,
  onAdminSync,
  inspectedRoom,
  setInspectedRoomId,
  openAddResidentModal,
  openEditResidentModal,
  roomModalOpen,
  setRoomModalOpen,
  newRoomForm,
  setNewRoomForm,
  residentModal,
  setResidentModal,
  resForm,
  setResForm,
  handleResidentSubmit,
  maintModalOpen,
  setMaintModalOpen,
  maintForm,
  setMaintForm,
  annModalOpen,
  setAnnModalOpen,
  annForm,
  setAnnForm,
  accountModal,
  setAccountModal,
  accountForm,
  setAccountForm
}) {
  return (
    <>
      {inspectedRoom && (
        <div className="modal-backdrop" onClick={() => setInspectedRoomId(null)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setInspectedRoomId(null)} aria-label="Yopish">
              <X size={20} />
            </button>
            <span className="section-kicker">
              <DoorOpen size={14} /> {inspectedRoom.floor}-qavat • {inspectedRoom.capacity} kishilik xona
            </span>
            <h2 style={{ margin: "6px 0 4px", color: "var(--blue-navy)" }}>{inspectedRoom.roomNumber}-xona tafsilotlari</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-muted)" }}>
              Oylik tarif: {inspectedRoom.monthlyPrice} • Band o‘rinlar: {inspectedRoom.occupied} / {inspectedRoom.capacity}
            </p>

            <div className="admin-bed-slots-grid">
              {Array.from({ length: inspectedRoom.capacity }).map((_, idx) => {
                const occ = inspectedRoom.residents[idx];
                if (!occ) {
                  return (
                    <div className="admin-bed-slot is-empty" key={idx}>
                      <div>
                        <strong style={{ fontSize: 13, color: "var(--color-muted)" }}>{idx + 1}-o‘rin (Bo‘sh)</strong>
                        <small style={{ display: "block", fontSize: 11.5, color: "var(--color-muted)" }}>Talaba joylashtirish mumkin</small>
                      </div>
                      {inspectedRoom.status === "active" && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setInspectedRoomId(null);
                            openAddResidentModal(inspectedRoom.id);
                          }}
                        >
                          <Plus size={13} /> Joylashtirish
                        </button>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="admin-bed-slot" key={occ.id}>
                    <div>
                      <strong style={{ fontSize: 13.5, color: "var(--blue-navy)" }}>{occ.studentName}</strong>
                      <small style={{ display: "block", fontSize: 11.5, color: "var(--color-muted)" }}>
                        {[occ.course, occ.faculty, occ.phone].filter(Boolean).join(" • ")}
                      </small>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className={`pay-pill is-${occ.paymentStatus}`}>{PAYMENT_LABELS[occ.paymentStatus]}</span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setInspectedRoomId(null);
                          openEditResidentModal(occ);
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="booking-card-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  runAdminRequest({
                    url: `/api/admin/dorm-rooms/${inspectedRoom.id}`,
                    method: "PATCH",
                    body: { status: inspectedRoom.status === "maintenance" ? "active" : "maintenance" },
                    busyKey: `dorm-st-${inspectedRoom.id}`,
                    successMsg: `${inspectedRoom.roomNumber}-xona holati yangilandi.`
                  })
                }
              >
                <Wrench size={14} /> {inspectedRoom.status === "maintenance" ? "Xonani faollashtirish" : "Ta’mirga yopish"}
              </button>
              {inspectedRoom.residents.length === 0 && (
                <button
                  type="button"
                  className="avatar-remove-btn booking-delete-btn"
                  onClick={async () => {
                    const ok = await runAdminRequest({
                      url: `/api/admin/dorm-rooms/${inspectedRoom.id}`,
                      method: "DELETE",
                      busyKey: `dorm-del-${inspectedRoom.id}`,
                      successMsg: `${inspectedRoom.roomNumber}-xona o‘chirildi.`
                    });
                    if (ok) setInspectedRoomId(null);
                  }}
                >
                  <Trash2 size={13} /> Xonani o‘chirish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {roomModalOpen && (
        <div className="modal-backdrop" onClick={() => setRoomModalOpen(false)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setRoomModalOpen(false)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>Yangi xona raqami qo‘shish</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)" }}>Yotoqxona xaritasiga yangi xona raqamini kiriting.</p>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await runAdminRequest({
                  url: "/api/admin/dorm-rooms",
                  body: { roomNumber: newRoomForm.roomNumber, roomTypeId: Number(newRoomForm.roomTypeId), floor: Number(newRoomForm.floor) },
                  busyKey: "new-dorm-room",
                  successMsg: `${newRoomForm.roomNumber}-xona qo‘shildi!`
                });
                if (ok) {
                  setNewRoomForm((p) => ({ ...p, roomNumber: "" }));
                  setRoomModalOpen(false);
                }
              }}
            >
              <label className="input-group">
                <span>Xona raqami *</span>
                <input required placeholder="Masalan: 405" value={newRoomForm.roomNumber} onChange={(e) => setNewRoomForm((p) => ({ ...p, roomNumber: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Qavat *</span>
                <input type="number" min={1} max={20} required value={newRoomForm.floor} onChange={(e) => setNewRoomForm((p) => ({ ...p, floor: e.target.value }))} />
              </label>
              <label className="input-group is-full">
                <span>Xona sig‘imi *</span>
                <select value={newRoomForm.roomTypeId} onChange={(e) => setNewRoomForm((p) => ({ ...p, roomTypeId: e.target.value }))}>
                  <option value="1">2 kishilik (1 100 000 so‘m)</option>
                  <option value="2">4 kishilik (900 000 so‘m)</option>
                  <option value="3">6 kishilik (800 000 so‘m)</option>
                </select>
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "new-dorm-room"}>Saqlash</button>
            </form>
          </div>
        </div>
      )}

      {residentModal && (
        <div className="modal-backdrop" onClick={() => setResidentModal(null)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setResidentModal(null)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>
              {residentModal.mode === "edit" ? `${residentModal.data.studentName} — Talaba holati va tahrirlash` : "Talabani xonaga joylashtirish"}
            </h2>
            {residentModal.mode === "edit" && (
              <div className="admin-user-summary-banner">
                <div>
                  <small>To‘lov holati</small>
                  <b style={{ color: residentModal.data.paymentStatus === "paid" ? "#059669" : residentModal.data.paymentStatus === "overdue" ? "#dc2626" : "#b45309" }}>
                    {PAYMENT_LABELS[residentModal.data.paymentStatus]}
                  </b>
                </div>
                <div>
                  <small>Xonasi va narxi</small>
                  <b>{residentModal.data.roomNumber}-xona ({residentModal.data.floor}-qavat) • {residentModal.data.monthlyPrice || "—"}</b>
                </div>
                <div>
                  <small>Ko‘chib kelgan sana</small>
                  <b>{residentModal.data.moveInDate || "Ko‘rsatilmagan"}</b>
                </div>
              </div>
            )}
            <form className="admin-modal-form" onSubmit={handleResidentSubmit}>
              <label className="input-group">
                <span>F.I.Sh. *</span>
                <input required value={resForm.studentName} onChange={(e) => setResForm((p) => ({ ...p, studentName: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Telefon raqam *</span>
                <input required value={resForm.phone} onChange={(e) => setResForm((p) => ({ ...p, phone: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Xona raqami *</span>
                <select required value={resForm.dormRoomId} onChange={(e) => setResForm((p) => ({ ...p, dormRoomId: e.target.value }))}>
                  <option value="">Tanlang...</option>
                  {overview.dormRooms
                    .filter((dr) => dr.status === "active" && (dr.available > 0 || String(dr.id) === resForm.dormRoomId))
                    .map((dr) => (
                      <option key={dr.id} value={dr.id}>
                        {dr.roomNumber}-xona • {dr.floor}-qavat ({dr.occupied}/{dr.capacity})
                      </option>
                    ))}
                </select>
              </label>
              <label className="input-group">
                <span>Kursi</span>
                <select value={resForm.course} onChange={(e) => setResForm((p) => ({ ...p, course: e.target.value }))}>
                  <option value="1-kurs">1-kurs</option>
                  <option value="2-kurs">2-kurs</option>
                  <option value="3-kurs">3-kurs</option>
                  <option value="4-kurs">4-kurs</option>
                </select>
              </label>
              <label className="input-group">
                <span>Fakultet</span>
                <input placeholder="Dasturiy injiniring" value={resForm.faculty} onChange={(e) => setResForm((p) => ({ ...p, faculty: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Telegram</span>
                <input placeholder="@username" value={resForm.telegram} onChange={(e) => setResForm((p) => ({ ...p, telegram: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>To‘lov holati</span>
                <select value={resForm.paymentStatus} onChange={(e) => setResForm((p) => ({ ...p, paymentStatus: e.target.value }))}>
                  <option value="paid">To‘langan</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="overdue">Qarzdor</option>
                </select>
              </label>
              <label className="input-group">
                <span>Kirgan sana</span>
                <input type="date" value={resForm.moveInDate} onChange={(e) => setResForm((p) => ({ ...p, moveInDate: e.target.value }))} />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "save-resident"}>Saqlash</button>
            </form>
          </div>
        </div>
      )}

      {maintModalOpen && (
        <div className="modal-backdrop" onClick={() => setMaintModalOpen(false)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setMaintModalOpen(false)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>Yangi texnik xizmat so‘rovi</h2>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await runAdminRequest({
                  url: "/api/admin/maintenance",
                  body: maintForm,
                  busyKey: "new-maint",
                  successMsg: "Texnik so‘rov yaratildi!"
                });
                if (ok) {
                  setMaintForm((p) => ({ ...p, description: "" }));
                  setMaintModalOpen(false);
                }
              }}
            >
              <label className="input-group">
                <span>Xona raqami *</span>
                <select value={maintForm.roomNumber} onChange={(e) => setMaintForm((p) => ({ ...p, roomNumber: e.target.value }))}>
                  {overview.dormRooms.map((dr) => (
                    <option key={dr.id} value={dr.roomNumber}>{dr.roomNumber}-xona ({dr.floor}-qavat)</option>
                  ))}
                </select>
              </label>
              <label className="input-group">
                <span>Yo‘nalish</span>
                <select value={maintForm.category} onChange={(e) => setMaintForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="Santexnika">Santexnika</option>
                  <option value="Elektr / Yoritish">Elektr / Yoritish</option>
                  <option value="Iqlim nazorati">Iqlim nazorati</option>
                  <option value="Internet / Wi-Fi">Internet / Wi-Fi</option>
                  <option value="Mebel / Qulf">Mebel / Qulf</option>
                </select>
              </label>
              <label className="input-group is-full">
                <span>Muhimlik darajasi</span>
                <select value={maintForm.priority} onChange={(e) => setMaintForm((p) => ({ ...p, priority: e.target.value }))}>
                  <option value="high">Shoshilinch</option>
                  <option value="medium">O‘rtacha</option>
                  <option value="low">Past</option>
                </select>
              </label>
              <label className="input-group is-full">
                <span>Muammo tavsifi *</span>
                <textarea rows={3} required value={maintForm.description} onChange={(e) => setMaintForm((p) => ({ ...p, description: e.target.value }))} />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "new-maint"}>Yaratish</button>
            </form>
          </div>
        </div>
      )}

      {annModalOpen && (
        <div className="modal-backdrop" onClick={() => setAnnModalOpen(false)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setAnnModalOpen(false)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>
              {annForm.id ? "E’lonni tahrirlash" : "Talabalar uchun yangi e’lon joylash"}
            </h2>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const isEdit = Boolean(annForm.id);
                const ok = await runAdminRequest({
                  url: isEdit ? `/api/admin/announcements/${annForm.id}` : "/api/admin/announcements",
                  method: isEdit ? "PATCH" : "POST",
                  body: annForm,
                  busyKey: "new-ann",
                  successMsg: isEdit ? "E’lon yangilandi!" : "E’lon chop etildi!"
                });
                if (ok) {
                  setAnnForm({ title: "", category: "Umumiy", audience: "Barcha qavatlar", content: "", pinned: false });
                  setAnnModalOpen(false);
                }
              }}
            >
              <label className="input-group is-full">
                <span>E’lon sarlavhasi *</span>
                <input required placeholder="Masalan: Shanba kuni umumiy tozalik tadbiri" value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Kategoriya</span>
                <select value={annForm.category} onChange={(e) => setAnnForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="Umumiy">Umumiy</option>
                  <option value="Moliya">Moliya</option>
                  <option value="Texnik yangilik">Texnik yangilik</option>
                  <option value="Tartib-intizom">Tartib-intizom</option>
                </select>
              </label>
              <label className="input-group">
                <span>Auditoriya</span>
                <input value={annForm.audience} onChange={(e) => setAnnForm((p) => ({ ...p, audience: e.target.value }))} />
              </label>
              <label className="input-group is-full">
                <span>Matn *</span>
                <textarea rows={3} required value={annForm.content} onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }} className="is-full">
                <input type="checkbox" checked={annForm.pinned} onChange={(e) => setAnnForm((p) => ({ ...p, pinned: e.target.checked }))} />
                Yuqoriga mahkamlash (muhim e’lon)
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "new-ann"}>
                {annForm.id ? "Saqlash" : "Chop etish"}
              </button>
            </form>
          </div>
        </div>
      )}

      {accountModal && (
        <div className="modal-backdrop" onClick={() => setAccountModal(null)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setAccountModal(null)} aria-label="Yopish"><X size={20} /></button>
            <span className="section-kicker">
              <Users size={14} /> {accountModal.isNew ? "Yangi talaba akkaunti" : `${accountModal.role === "admin" ? "Administrator" : "Portal foydalanuvchisi"} • #${accountModal.id}`}
            </span>
            <h2 style={{ margin: "6px 0 4px", color: "var(--blue-navy)" }}>
              {accountModal.isNew ? "Yangi portal akkaunti yaratish" : `${accountModal.firstName} ${accountModal.lastName}`}
            </h2>

            {!accountModal.isNew && (
              <div className="admin-user-summary-banner">
                <div>
                  <small>Yotoqxona holati</small>
                  <b>{accountModal.linkedRoomNumber ? `${accountModal.linkedRoomNumber}-xona` : accountModal.linkedBookingStatus ? STATUS_LABELS[accountModal.linkedBookingStatus] : "Biriktirilmagan"}</b>
                </div>
                <div>
                  <small>To‘lov holati</small>
                  <b style={{ color: accountModal.linkedPaymentStatus === "paid" ? "#059669" : accountModal.linkedPaymentStatus === "overdue" ? "#dc2626" : "#b45309" }}>
                    {accountModal.linkedPaymentStatus ? PAYMENT_LABELS[accountModal.linkedPaymentStatus] : "Yashovchi emas"}
                  </b>
                </div>
                <div>
                  <small>Login / Parol</small>
                  <b>{accountModal.login} • {accountModal.password || "Eski hash"}</b>
                </div>
              </div>
            )}

            {!accountModal.isNew && accountModal.linkedResidentId && (
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const res = overview.residents.find((r) => r.id === accountModal.linkedResidentId);
                    setAccountModal(null);
                    if (res) openEditResidentModal(res);
                  }}
                >
                  <CreditCard size={13} /> To‘lov va xona ma’lumotini tahrirlash →
                </button>
              </div>
            )}

            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = Boolean(accountModal.isNew);
                const res = await runAdminRequest({
                  url: isNew ? "/api/admin/accounts" : `/api/admin/accounts/${accountModal.id}`,
                  method: isNew ? "POST" : "PATCH",
                  body: {
                    firstName: accountForm.firstName,
                    lastName: accountForm.lastName,
                    age: accountForm.age ? Number(accountForm.age) : null,
                    course: accountForm.course,
                    phone: accountForm.phone,
                    login: accountForm.login,
                    password: accountForm.password
                  },
                  busyKey: isNew ? "new-acc" : `edit-acc-${accountModal.id}`,
                  successMsg: isNew
                    ? `${accountForm.firstName} ${accountForm.lastName} akkaunti yaratildi!`
                    : `${accountForm.firstName} ${accountForm.lastName} profili saqlandi!`
                });
                if (res) {
                  if (!isNew && accountModal.role === "admin" && res.account && onAdminSync) onAdminSync(res.account);
                  setAccountModal(null);
                }
              }}
            >
              <label className="input-group">
                <span>Ism *</span>
                <input required value={accountForm.firstName} onChange={(e) => setAccountForm((p) => ({ ...p, firstName: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Familiya *</span>
                <input required value={accountForm.lastName} onChange={(e) => setAccountForm((p) => ({ ...p, lastName: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Yosh</span>
                <input type="number" min={15} max={60} value={accountForm.age} onChange={(e) => setAccountForm((p) => ({ ...p, age: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Kurs</span>
                <select value={accountForm.course} onChange={(e) => setAccountForm((p) => ({ ...p, course: e.target.value }))}>
                  <option value="1-kurs">1-kurs</option>
                  <option value="2-kurs">2-kurs</option>
                  <option value="3-kurs">3-kurs</option>
                  <option value="4-kurs">4-kurs</option>
                  <option value="Ma’muriyat">Ma’muriyat</option>
                </select>
              </label>
              <label className="input-group">
                <span>Telefon</span>
                <input value={accountForm.phone} onChange={(e) => setAccountForm((p) => ({ ...p, phone: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Login *</span>
                <input required value={accountForm.login} onChange={(e) => setAccountForm((p) => ({ ...p, login: e.target.value }))} />
              </label>
              <label className="input-group is-full">
                <span>Yangi parol (o‘zgartirish uchun kiriting, kamida 6 ta belgi)</span>
                <input type="text" placeholder="O‘zgartirmasangiz bo‘sh qoldiring..." value={accountForm.password} onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))} />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === `edit-acc-${accountModal.id}`}>Saqlash</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
