import React, { useEffect, useState } from "react";
import { Camera, CreditCard, DoorOpen, Pencil, Plus, Trash2, Users, Wrench, X } from "lucide-react";
import { PAYMENT_LABELS, readRoomImageFile, STATUS_LABELS } from "../utils/AdminHelpers";

function RoomImagePicker({ value, onChange, availableImages = [], onError }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readRoomImageFile(file);
      onChange(dataUrl);
    } catch (err) {
      if (onError) onError(err.message);
    }
    e.target.value = "";
  };

  const sampleList = availableImages.length > 0
    ? availableImages.slice(0, 12)
    : ["/images/room3.jpeg", "/images/room-4.jpg", "/images/room-6.jpg", "/images/hero-dorm-room.jpeg", "/images/room1.jpeg", "/images/room2.jpeg"];

  return (
    <div className="admin-image-picker-box is-full">
      <div className="admin-image-picker-top">
        <div className="admin-image-picker-preview">
          <img src={value || "/images/room3.jpeg"} alt="Tanlangan xona rasmi" />
        </div>
        <div className="admin-image-picker-controls">
          <strong>Xona rasmi (Yuklash yoki tanlash)</strong>
          <small>Kompyuteringizdan yangi rasm yuklang yoki quyidagi tayyor rasmlardan birini bosing.</small>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
              <Camera size={14} />
              <span>Kompyuterdan rasm yuklash</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            </label>
            <input
              type="text"
              placeholder="Yoki rasm URL manzili (/images/room3.jpeg)..."
              value={value?.startsWith("data:") ? "" : (value || "")}
              onChange={(e) => onChange(e.target.value)}
              style={{ flex: 1, minWidth: 180, padding: "6px 10px", borderRadius: 10, border: "1.5px solid #d5e5fc", fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      <div className="admin-image-picker-thumbs">
        {sampleList.map((imgUrl) => (
          <button
            key={imgUrl}
            type="button"
            className={`admin-picker-thumb ${value === imgUrl ? "active" : ""}`}
            onClick={() => onChange(imgUrl)}
            title={imgUrl}
          >
            <img src={imgUrl} alt="Galereya namunasi" />
          </button>
        ))}
      </div>
    </div>
  );
}

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
  roomTypeModal,
  setRoomTypeModal,
  roomTypeForm,
  setRoomTypeForm,
  residentModal,
  setResidentModal,
  resForm,
  setResForm,
  handleResidentSubmit,
  bookingModal,
  setBookingModal,
  bookingForm,
  setBookingForm,
  maintModalOpen,
  setMaintModalOpen,
  maintForm,
  setMaintForm,
  annModalOpen,
  setAnnModalOpen,
  annForm,
  setAnnForm,
  messageModal,
  setMessageModal,
  messageForm,
  setMessageForm,
  accountModal,
  setAccountModal,
  accountForm,
  setAccountForm,
  showToast
}) {
  const [inspectEdit, setInspectEdit] = useState({
    roomNumber: "",
    floor: "4",
    roomTypeId: "1",
    customPrice: "",
    image: "",
    description: ""
  });

  useEffect(() => {
    if (inspectedRoom) {
      setInspectEdit({
        roomNumber: inspectedRoom.roomNumber || "",
        floor: String(inspectedRoom.floor || 4),
        roomTypeId: String(inspectedRoom.roomTypeId || 1),
        customPrice: inspectedRoom.customPrice || inspectedRoom.monthlyPrice || "",
        image: inspectedRoom.image || "/images/room3.jpeg",
        description: inspectedRoom.description || ""
      });
    }
  }, [inspectedRoom]);

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
            <h2 style={{ margin: "6px 0 4px", color: "var(--blue-navy)" }}>{inspectedRoom.roomNumber}-xona tafsilotlari, rasmi va narxi</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-muted)" }}>
              Oylik tarif: <b>{inspectedRoom.monthlyPrice}</b> • Band o‘rinlar: {inspectedRoom.occupied} / {inspectedRoom.capacity}
            </p>

            <form
              className="admin-modal-form"
              style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #e2ecfc" }}
              onSubmit={async (e) => {
                e.preventDefault();
                await runAdminRequest({
                  url: `/api/admin/dorm-rooms/${inspectedRoom.id}`,
                  method: "PATCH",
                  body: {
                    roomNumber: inspectEdit.roomNumber,
                    floor: Number(inspectEdit.floor),
                    roomTypeId: Number(inspectEdit.roomTypeId),
                    customPrice: inspectEdit.customPrice,
                    image: inspectEdit.image,
                    description: inspectEdit.description
                  },
                  busyKey: `dorm-save-${inspectedRoom.id}`,
                  successMsg: `${inspectEdit.roomNumber}-xona narxi va rasmi yangilandi!`
                });
              }}
            >
              <RoomImagePicker
                value={inspectEdit.image}
                onChange={(img) => setInspectEdit((p) => ({ ...p, image: img }))}
                availableImages={overview.availableImages}
                onError={showToast}
              />
              <label className="input-group">
                <span>Xona raqami *</span>
                <input
                  required
                  value={inspectEdit.roomNumber}
                  onChange={(e) => setInspectEdit((p) => ({ ...p, roomNumber: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Qavat *</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={inspectEdit.floor}
                  onChange={(e) => setInspectEdit((p) => ({ ...p, floor: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Xona turi / Sig‘imi</span>
                <select
                  value={inspectEdit.roomTypeId}
                  onChange={(e) => setInspectEdit((p) => ({ ...p, roomTypeId: e.target.value }))}
                >
                  {overview.rooms.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.title} ({rt.spotsPerRoom} o‘rin — {rt.price})
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-group">
                <span>Xona oylik narxi (so‘m) *</span>
                <input
                  required
                  placeholder="Masalan: 1 100 000 so‘m"
                  value={inspectEdit.customPrice}
                  onChange={(e) => setInspectEdit((p) => ({ ...p, customPrice: e.target.value }))}
                />
              </label>
              <label className="input-group is-full">
                <span>Xona tavsifi</span>
                <input
                  placeholder="Xona jihozlari va qulayliklari haqida qisqacha..."
                  value={inspectEdit.description}
                  onChange={(e) => setInspectEdit((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn-primary btn-sm is-full" disabled={busyId === `dorm-save-${inspectedRoom.id}`}>
                Xona rasmi va narxini saqlash
              </button>
            </form>

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
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>Yangi xona raqami, narxi va rasmini qo‘shish</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)" }}>Yotoqxona xaritasiga yangi xona raqami, oylik narxi va rasmini kiriting.</p>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await runAdminRequest({
                  url: "/api/admin/dorm-rooms",
                  body: {
                    roomNumber: newRoomForm.roomNumber,
                    roomTypeId: Number(newRoomForm.roomTypeId),
                    floor: Number(newRoomForm.floor),
                    customPrice: newRoomForm.customPrice,
                    image: newRoomForm.image,
                    description: newRoomForm.description
                  },
                  busyKey: "new-dorm-room",
                  successMsg: `${newRoomForm.roomNumber}-xona rasmi va narxi bilan qo‘shildi!`
                });
                if (ok) {
                  setNewRoomForm((p) => ({ ...p, roomNumber: "", customPrice: "", description: "" }));
                  setRoomModalOpen(false);
                }
              }}
            >
              <RoomImagePicker
                value={newRoomForm.image || "/images/room3.jpeg"}
                onChange={(img) => setNewRoomForm((p) => ({ ...p, image: img }))}
                availableImages={overview.availableImages}
                onError={showToast}
              />
              <label className="input-group">
                <span>Xona raqami *</span>
                <input required placeholder="Masalan: 405" value={newRoomForm.roomNumber} onChange={(e) => setNewRoomForm((p) => ({ ...p, roomNumber: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Qavat *</span>
                <input type="number" min={1} max={20} required value={newRoomForm.floor} onChange={(e) => setNewRoomForm((p) => ({ ...p, floor: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Xona turi va sig‘imi *</span>
                <select
                  value={newRoomForm.roomTypeId}
                  onChange={(e) => {
                    const rt = overview.rooms.find((r) => String(r.id) === e.target.value);
                    setNewRoomForm((p) => ({
                      ...p,
                      roomTypeId: e.target.value,
                      customPrice: rt ? rt.price : p.customPrice,
                      image: rt?.image || p.image
                    }));
                  }}
                >
                  {overview.rooms.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.title} ({rt.spotsPerRoom} kishilik — {rt.price})
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-group">
                <span>Oylik narxi (so‘m) *</span>
                <input
                  required
                  placeholder="Masalan: 1 100 000 so‘m"
                  value={newRoomForm.customPrice ?? "1 100 000 so‘m"}
                  onChange={(e) => setNewRoomForm((p) => ({ ...p, customPrice: e.target.value }))}
                />
              </label>
              <label className="input-group is-full">
                <span>Xona tavsifi (ixtiyoriy)</span>
                <input
                  placeholder="Masalan: Balkonli, yangi mebel va konditsioner bilan jihozlangan..."
                  value={newRoomForm.description || ""}
                  onChange={(e) => setNewRoomForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "new-dorm-room"}>Xonani saqlash</button>
            </form>
          </div>
        </div>
      )}

      {roomTypeModal && (
        <div className="modal-backdrop" onClick={() => setRoomTypeModal(null)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setRoomTypeModal(null)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>
              {roomTypeModal.mode === "edit" ? `${roomTypeForm.title} — Rasm va narxni tahrirlash` : "Yangi xona turi, narx va rasm yaratish"}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)" }}>
              Yaratilgan xona turi saytning &ldquo;Xonalar&rdquo;, &ldquo;Taqqoslash&rdquo; va &ldquo;Bron qilish&rdquo; bo‘limlarida rasmi va narxi bilan chiqadi.
            </p>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const isEdit = roomTypeModal.mode === "edit";
                const ok = await runAdminRequest({
                  url: isEdit ? `/api/admin/rooms/${roomTypeForm.id}` : "/api/admin/rooms",
                  method: isEdit ? "PUT" : "POST",
                  body: {
                    title: roomTypeForm.title,
                    price: roomTypeForm.price,
                    spotsPerRoom: Number(roomTypeForm.spotsPerRoom),
                    totalRooms: Number(roomTypeForm.totalRooms),
                    occupiedSpots: Number(roomTypeForm.occupiedSpots || 0),
                    floor: roomTypeForm.floor,
                    size: roomTypeForm.size,
                    bathroom: roomTypeForm.bathroom,
                    tag: roomTypeForm.tag,
                    badgeType: roomTypeForm.badgeType,
                    image: roomTypeForm.image,
                    description: roomTypeForm.description,
                    features: roomTypeForm.features,
                    initialRoomNumber: roomTypeForm.initialRoomNumber
                  },
                  busyKey: "save-room-type",
                  successMsg: isEdit ? "Xona turi, narxi va rasmi yangilandi!" : "Yangi xona turi saytga qo‘shildi!"
                });
                if (ok) setRoomTypeModal(null);
              }}
            >
              <RoomImagePicker
                value={roomTypeForm.image}
                onChange={(img) => setRoomTypeForm((p) => ({ ...p, image: img }))}
                availableImages={overview.availableImages}
                onError={showToast}
              />
              <label className="input-group">
                <span>Xona turi nomi *</span>
                <input
                  required
                  placeholder="Masalan: 04 / 1 Kishilik VIP Xona"
                  value={roomTypeForm.title}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, title: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Oylik narxi (so‘m) *</span>
                <input
                  required
                  placeholder="Masalan: 1 400 000 so‘m"
                  value={roomTypeForm.price}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, price: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Xona sig‘imi (necha kishilik) *</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  required
                  value={roomTypeForm.spotsPerRoom}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, spotsPerRoom: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Jami xonalar soni *</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={roomTypeForm.totalRooms}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, totalRooms: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Qavati</span>
                <input
                  placeholder="4-qavat"
                  value={roomTypeForm.floor}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, floor: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Maydoni (m²)</span>
                <input
                  placeholder="24 m²"
                  value={roomTypeForm.size}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, size: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Sanuzel turi</span>
                <input
                  placeholder="Xona ichida shaxsiy sanuzel"
                  value={roomTypeForm.bathroom}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, bathroom: e.target.value }))}
                />
              </label>
              <label className="input-group">
                <span>Teg / Yorliq</span>
                <input
                  placeholder="Tavsiya etiladi / VIP"
                  value={roomTypeForm.tag}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, tag: e.target.value }))}
                />
              </label>
              {roomTypeModal.mode !== "edit" && (
                <label className="input-group is-full">
                  <span>Boshlang‘ich xona raqami (ixtiyoriy, xaritaga ham qo‘shish uchun)</span>
                  <input
                    placeholder="Masalan: 405"
                    value={roomTypeForm.initialRoomNumber || ""}
                    onChange={(e) => setRoomTypeForm((p) => ({ ...p, initialRoomNumber: e.target.value }))}
                  />
                </label>
              )}
              <label className="input-group is-full">
                <span>Qulayliklar (vergul bilan ajrating)</span>
                <input
                  placeholder="Shaxsiy sanuzel, Konditsioner, O‘qish stoli, Wi-Fi 500 Mbps"
                  value={roomTypeForm.features}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, features: e.target.value }))}
                />
              </label>
              <label className="input-group is-full">
                <span>To‘liq tavsif *</span>
                <textarea
                  rows={3}
                  required
                  value={roomTypeForm.description}
                  onChange={(e) => setRoomTypeForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "save-room-type"}>
                {roomTypeModal.mode === "edit" ? "O‘zgarishlarni saqlash" : "Xona turini yaratish"}
              </button>
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

      {bookingModal && (
        <div className="modal-backdrop" onClick={() => setBookingModal(null)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setBookingModal(null)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>
              {bookingModal.mode === "edit" ? `#${bookingForm.id} — Bron arizasini tahrirlash` : "Yangi bron arizasi yaratish"}
            </h2>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const isEdit = bookingModal.mode === "edit";
                const ok = await runAdminRequest({
                  url: isEdit ? `/api/admin/bookings/${bookingForm.id}` : "/api/admin/bookings",
                  method: isEdit ? "PATCH" : "POST",
                  body: {
                    ...bookingForm,
                    roomId: Number(bookingForm.roomId),
                    age: bookingForm.age ? Number(bookingForm.age) : null
                  },
                  busyKey: isEdit ? `edit-booking-${bookingForm.id}` : "new-booking",
                  successMsg: isEdit ? "Ariza ma’lumotlari yangilandi!" : "Yangi bron arizasi yaratildi!"
                });
                if (ok) setBookingModal(null);
              }}
            >
              <label className="input-group">
                <span>Talaba F.I.Sh. *</span>
                <input required value={bookingForm.studentName} onChange={(e) => setBookingForm((p) => ({ ...p, studentName: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Telefon raqam *</span>
                <input required value={bookingForm.phone} onChange={(e) => setBookingForm((p) => ({ ...p, phone: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Telegram</span>
                <input placeholder="@username" value={bookingForm.telegram} onChange={(e) => setBookingForm((p) => ({ ...p, telegram: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Kursi</span>
                <select value={bookingForm.course} onChange={(e) => setBookingForm((p) => ({ ...p, course: e.target.value }))}>
                  <option value="1-kurs">1-kurs</option>
                  <option value="2-kurs">2-kurs</option>
                  <option value="3-kurs">3-kurs</option>
                  <option value="4-kurs">4-kurs</option>
                  <option value="Magistratura 1-kurs">Magistratura 1-kurs</option>
                  <option value="Magistratura 2-kurs">Magistratura 2-kurs</option>
                </select>
              </label>
              <label className="input-group">
                <span>Yoshi</span>
                <input type="number" min={15} max={60} value={bookingForm.age} onChange={(e) => setBookingForm((p) => ({ ...p, age: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Xona turi *</span>
                <select value={bookingForm.roomId} onChange={(e) => setBookingForm((p) => ({ ...p, roomId: e.target.value }))}>
                  {overview.rooms.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.title} ({rt.price})</option>
                  ))}
                </select>
              </label>
              <label className="input-group">
                <span>So‘ralgan xona raqami</span>
                <input placeholder="Masalan: 401" value={bookingForm.preferredRoomNumber} onChange={(e) => setBookingForm((p) => ({ ...p, preferredRoomNumber: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Ko‘chib o‘tish sanasi</span>
                <input type="date" value={bookingForm.moveInDate} onChange={(e) => setBookingForm((p) => ({ ...p, moveInDate: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Muddati</span>
                <select value={bookingForm.duration} onChange={(e) => setBookingForm((p) => ({ ...p, duration: e.target.value }))}>
                  <option value="1 oy">1 oy</option>
                  <option value="1 semestr">1 semestr</option>
                  <option value="1 o‘quv yili">1 o‘quv yili</option>
                </select>
              </label>
              <label className="input-group">
                <span>Holati</span>
                <select value={bookingForm.status} onChange={(e) => setBookingForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="pending">Kutilmoqda</option>
                  <option value="approved">Qabul qilindi</option>
                  <option value="rejected">Rad etildi</option>
                </select>
              </label>
              <label className="input-group is-full">
                <span>Talaba izohi</span>
                <textarea rows={2} value={bookingForm.notes} onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>
              <label className="input-group is-full">
                <span>Admin izohi</span>
                <input value={bookingForm.adminNote} onChange={(e) => setBookingForm((p) => ({ ...p, adminNote: e.target.value }))} />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "new-booking" || busyId === `edit-booking-${bookingForm.id}`}>
                {bookingModal.mode === "edit" ? "O‘zgarishlarni saqlash" : "Arizani yaratish"}
              </button>
            </form>
          </div>
        </div>
      )}

      {maintModalOpen && (
        <div className="modal-backdrop" onClick={() => setMaintModalOpen(false)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setMaintModalOpen(false)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>
              {maintForm.id ? `Texnik so‘rovni tahrirlash (#${maintForm.id})` : "Yangi texnik xizmat so‘rovi"}
            </h2>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const isEdit = Boolean(maintForm.id);
                const ok = await runAdminRequest({
                  url: isEdit ? `/api/admin/maintenance/${maintForm.id}` : "/api/admin/maintenance",
                  method: isEdit ? "PATCH" : "POST",
                  body: maintForm,
                  busyKey: isEdit ? `edit-maint-${maintForm.id}` : "new-maint",
                  successMsg: isEdit ? "Texnik so‘rov yangilandi!" : "Texnik so‘rov yaratildi!"
                });
                if (ok) {
                  setMaintForm((p) => ({ ...p, id: null, description: "", adminNote: "", reporterName: "" }));
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
              <label className="input-group">
                <span>Muhimlik darajasi</span>
                <select value={maintForm.priority} onChange={(e) => setMaintForm((p) => ({ ...p, priority: e.target.value }))}>
                  <option value="high">Shoshilinch</option>
                  <option value="medium">O‘rtacha</option>
                  <option value="low">Past</option>
                </select>
              </label>
              {maintForm.id && (
                <label className="input-group">
                  <span>Holati</span>
                  <select value={maintForm.status || "open"} onChange={(e) => setMaintForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="open">Ochiq</option>
                    <option value="in_progress">Jarayonda</option>
                    <option value="resolved">Hal qilindi</option>
                  </select>
                </label>
              )}
              <label className="input-group is-full">
                <span>Murojaat qilgan talaba (ixtiyoriy)</span>
                <input placeholder="Masalan: Jasur Karimov" value={maintForm.reporterName || ""} onChange={(e) => setMaintForm((p) => ({ ...p, reporterName: e.target.value }))} />
              </label>
              <label className="input-group is-full">
                <span>Muammo tavsifi *</span>
                <textarea rows={3} required value={maintForm.description} onChange={(e) => setMaintForm((p) => ({ ...p, description: e.target.value }))} />
              </label>
              {maintForm.id && (
                <label className="input-group is-full">
                  <span>Admin / usta izohi</span>
                  <input value={maintForm.adminNote || ""} onChange={(e) => setMaintForm((p) => ({ ...p, adminNote: e.target.value }))} />
                </label>
              )}
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "new-maint" || busyId === `edit-maint-${maintForm.id}`}>
                {maintForm.id ? "Saqlash" : "Yaratish"}
              </button>
            </form>
          </div>
        </div>
      )}

      {messageModal && (
        <div className="modal-backdrop" onClick={() => setMessageModal(null)}>
          <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setMessageModal(null)} aria-label="Yopish"><X size={20} /></button>
            <h2 style={{ margin: "0 0 6px", color: "var(--blue-navy)" }}>
              {messageModal.mode === "edit" ? `Murojaatni tahrirlash (#${messageForm.id})` : "Yangi aloqa murojaatini qayd etish"}
            </h2>
            <form
              className="admin-modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const isEdit = messageModal.mode === "edit";
                const ok = await runAdminRequest({
                  url: isEdit ? `/api/admin/messages/${messageForm.id}` : "/api/admin/messages",
                  method: isEdit ? "PATCH" : "POST",
                  body: messageForm,
                  busyKey: isEdit ? `edit-msg-${messageForm.id}` : "new-msg",
                  successMsg: isEdit ? "Murojaat yangilandi!" : "Yangi murojaat qo‘shildi!"
                });
                if (ok) setMessageModal(null);
              }}
            >
              <label className="input-group">
                <span>Ism *</span>
                <input required value={messageForm.firstName} onChange={(e) => setMessageForm((p) => ({ ...p, firstName: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Familiya *</span>
                <input required value={messageForm.lastName} onChange={(e) => setMessageForm((p) => ({ ...p, lastName: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Telefon *</span>
                <input required value={messageForm.phone} onChange={(e) => setMessageForm((p) => ({ ...p, phone: e.target.value }))} />
              </label>
              <label className="input-group">
                <span>Holati</span>
                <select value={messageForm.status} onChange={(e) => setMessageForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="new">Yangi</option>
                  <option value="read">Ko‘rib chiqildi</option>
                  <option value="replied">Javob berildi</option>
                </select>
              </label>
              <label className="input-group is-full">
                <span>Mavzu *</span>
                <input required value={messageForm.subject} onChange={(e) => setMessageForm((p) => ({ ...p, subject: e.target.value }))} />
              </label>
              <label className="input-group is-full">
                <span>Xabar matni *</span>
                <textarea rows={3} required value={messageForm.message} onChange={(e) => setMessageForm((p) => ({ ...p, message: e.target.value }))} />
              </label>
              <label className="input-group is-full">
                <span>Admin izohi</span>
                <input value={messageForm.adminNote} onChange={(e) => setMessageForm((p) => ({ ...p, adminNote: e.target.value }))} />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === "new-msg" || busyId === `edit-msg-${messageForm.id}`}>
                {messageModal.mode === "edit" ? "Saqlash" : "Qo‘shish"}
              </button>
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
                <span>{accountModal.isNew ? "Parol * (kamida 6 ta belgi)" : "Yangi parol (o‘zgartirish uchun kiriting, kamida 6 ta belgi)"}</span>
                <input
                  type="text"
                  required={Boolean(accountModal.isNew)}
                  placeholder={accountModal.isNew ? "Kamida 6 ta belgi..." : "O‘zgartirmasangiz bo‘sh qoldiring..."}
                  value={accountForm.password}
                  onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn-primary is-full" disabled={busyId === `edit-acc-${accountModal.id}` || busyId === "new-acc"}>
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
