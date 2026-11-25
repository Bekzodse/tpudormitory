import React, { useMemo, useState } from "react";
import { Camera, DoorOpen, Image as ImageIcon, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { PAYMENT_LABELS, readRoomImageFile, SectionTotalsBar } from "../utils/AdminHelpers";

export default function AdminRoomsSection({
  overview,
  totals,
  roomEdits,
  setRoomEdits,
  busyId,
  runAdminRequest,
  onInspectRoom,
  onAddResident,
  onEditResident,
  onOpenNewRoomType,
  onOpenEditRoomType,
  onOpenNewDormRoom,
  showToast
}) {
  const [dormFloorFilter, setDormFloorFilter] = useState("all");
  const [dormAvailabilityFilter, setDormAvailabilityFilter] = useState("all");
  const [dormSearch, setDormSearch] = useState("");
  const [showInventoryDrawer, setShowInventoryDrawer] = useState(true);
  const [showGalleryDrawer, setShowGalleryDrawer] = useState(false);
  const [inlineRoomForm, setInlineRoomForm] = useState({
    roomNumber: "",
    floor: "4",
    roomTypeId: "1",
    customPrice: "1 100 000 so‘m",
    image: "/images/room3.jpeg",
    description: ""
  });
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    category: "rooms",
    tag: "Yotoqxona",
    imageData: "",
    imageUrl: "/images/room3.jpeg"
  });

  const filteredDormRooms = useMemo(() => {
    const q = dormSearch.trim().toLowerCase();
    return overview.dormRooms.filter((r) => {
      if (dormFloorFilter !== "all" && String(r.floor) !== dormFloorFilter) return false;
      if (dormAvailabilityFilter === "free" && (r.available === 0 || r.status === "maintenance")) return false;
      if (dormAvailabilityFilter === "full" && r.available > 0) return false;
      if (dormAvailabilityFilter === "maintenance" && r.status !== "maintenance") return false;
      if (!q) return true;
      return (
        r.roomNumber.toLowerCase().includes(q) ||
        (r.monthlyPrice || "").toLowerCase().includes(q) ||
        r.residents.some((res) => res.studentName.toLowerCase().includes(q))
      );
    });
  }, [overview.dormRooms, dormFloorFilter, dormAvailabilityFilter, dormSearch]);

  const handleQuickTypeImageUpload = async (roomType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readRoomImageFile(file);
      await runAdminRequest({
        url: `/api/admin/rooms/${roomType.id}`,
        method: "PUT",
        body: { image: dataUrl },
        busyKey: `room-img-${roomType.id}`,
        successMsg: `${roomType.title} rasmi yangilandi!`
      });
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    e.target.value = "";
  };

  const handleGalleryFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readRoomImageFile(file);
      setGalleryForm((prev) => ({ ...prev, imageData: dataUrl }));
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    e.target.value = "";
  };

  const handleAddGalleryPhoto = async (e) => {
    e.preventDefault();
    const ok = await runAdminRequest({
      url: "/api/admin/gallery",
      body: galleryForm,
      busyKey: "add-gallery",
      successMsg: "Yangi rasm fotogalereyaga qo‘shildi!"
    });
    if (ok) {
      setGalleryForm({ title: "", category: "rooms", tag: "Yotoqxona", imageData: "", imageUrl: "/images/room3.jpeg" });
    }
  };

  return (
    <>
      <SectionTotalsBar
        items={[
          {
            label: "Xona turlari va tariflar",
            value: `${overview.rooms.length} tur`,
            sub: `Raqamlangan: ${overview.dormRooms.length} ta xona`
          },
          {
            label: "Xonalar umumiy sig‘imi",
            value: `${overview.dormRooms.reduce((s, r) => s + r.capacity, 0)} o‘rin`,
            sub: `Umumiy fond: ${totals.totalSpots} o‘rin`
          },
          {
            label: "Band o‘rinlar",
            value: `${overview.dormRooms.reduce((s, r) => s + r.occupied, 0)} ta`,
            tone: "is-blue",
            sub: "Hozir yashayotganlar"
          },
          {
            label: "Bo‘sh o‘rinlar",
            value: `${overview.dormRooms.reduce((s, r) => s + (r.status === "active" ? r.available : 0), 0)} ta`,
            tone: "is-green",
            sub: "Yangi joylashtirish uchun"
          }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          {[
            { key: "all", label: `Barchasi (${overview.dormRooms.length})` },
            { key: "free", label: "Bo‘sh joyi bor" },
            { key: "full", label: "To‘lgan" },
            { key: "maintenance", label: "Ta’mirlashda" }
          ].map((av) => (
            <button
              key={av.key}
              type="button"
              className={`compare-tab-btn ${dormAvailabilityFilter === av.key ? "active" : ""}`}
              onClick={() => setDormAvailabilityFilter(av.key)}
            >
              {av.label}
            </button>
          ))}
        </div>
        <div className="admin-search-controls">
          <select value={dormFloorFilter} onChange={(e) => setDormFloorFilter(e.target.value)}>
            <option value="all">Barcha qavatlar</option>
            <option value="4">4-qavat</option>
            <option value="3">3-qavat</option>
            <option value="2">2-qavat</option>
            <option value="1">1-qavat</option>
          </select>
          <input
            type="search"
            value={dormSearch}
            onChange={(e) => setDormSearch(e.target.value)}
            placeholder="Xona raqami, narx yoki talaba..."
          />
          <button
            type="button"
            className={`btn btn-sm ${showInventoryDrawer ? "btn-primary" : "btn-outline"}`}
            onClick={() => setShowInventoryDrawer((v) => !v)}
          >
            <SlidersHorizontal size={14} /> Narxlar va xona turlari ({overview.rooms.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${showGalleryDrawer ? "btn-primary" : "btn-outline"}`}
            onClick={() => setShowGalleryDrawer((v) => !v)}
          >
            <ImageIcon size={14} /> Rasmlar galereyasi ({(overview.gallery || []).length})
          </button>
        </div>
      </div>

      {/* Direct Inline Room Entry Form */}
      <section className="admin-panel-card">
        <div className="admin-panel-card-head" style={{ marginBottom: 10 }}>
          <div>
            <h2><DoorOpen size={18} /> Yangi Xona Kiritish va Qo‘shish (Tezkor Panel)</h2>
            <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
              Xona raqami, qavati, turi, oylik narxi va rasmini shu yerdan to‘g‘ridan-to‘g‘ri kiriting.
            </small>
          </div>
        </div>
        <form
          className="admin-inline-room-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await runAdminRequest({
              url: "/api/admin/dorm-rooms",
              body: {
                roomNumber: inlineRoomForm.roomNumber,
                floor: Number(inlineRoomForm.floor),
                roomTypeId: Number(inlineRoomForm.roomTypeId),
                customPrice: inlineRoomForm.customPrice,
                image: inlineRoomForm.image,
                description: inlineRoomForm.description
              },
              busyKey: "inline-add-room",
              successMsg: `${inlineRoomForm.roomNumber}-xona bazaga va saytga muvaffaqiyatli kiritildi!`
            });
            if (ok) {
              setInlineRoomForm((p) => ({ ...p, roomNumber: "", description: "" }));
            }
          }}
        >
          <label className="input-group">
            <span>Xona raqami *</span>
            <input
              required
              placeholder="Masalan: 405"
              value={inlineRoomForm.roomNumber}
              onChange={(e) => setInlineRoomForm((p) => ({ ...p, roomNumber: e.target.value }))}
            />
          </label>
          <label className="input-group">
            <span>Qavat *</span>
            <input
              type="number"
              min={1}
              max={20}
              required
              value={inlineRoomForm.floor}
              onChange={(e) => setInlineRoomForm((p) => ({ ...p, floor: e.target.value }))}
            />
          </label>
          <label className="input-group">
            <span>Xona turi va sig‘imi *</span>
            <select
              value={inlineRoomForm.roomTypeId}
              onChange={(e) => {
                const rt = overview.rooms.find((r) => String(r.id) === e.target.value);
                setInlineRoomForm((p) => ({
                  ...p,
                  roomTypeId: e.target.value,
                  customPrice: rt ? rt.price : p.customPrice,
                  image: rt?.image || p.image
                }));
              }}
            >
              {overview.rooms.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.title.replace(/^\d+\s*\/\s*/, "")} ({rt.spotsPerRoom} o‘rin)
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Oylik narxi (so‘m) *</span>
            <input
              required
              placeholder="1 100 000 so‘m"
              value={inlineRoomForm.customPrice}
              onChange={(e) => setInlineRoomForm((p) => ({ ...p, customPrice: e.target.value }))}
            />
          </label>
          <label className="input-group">
            <span>Xona rasmi</span>
            <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", height: 38 }}>
              <Camera size={14} />
              <span>{inlineRoomForm.image?.startsWith("data:") ? "Rasm yuklandi ✓" : "Rasm tanlash"}</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await readRoomImageFile(file);
                    setInlineRoomForm((p) => ({ ...p, image: dataUrl }));
                  } catch (err) {
                    if (showToast) showToast(err.message);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ height: 38, width: "100%" }}
              disabled={busyId === "inline-add-room"}
            >
              <Plus size={15} /> {busyId === "inline-add-room" ? "Kiritilmoqda..." : "Xonani kiritish"}
            </button>
          </div>
        </form>
      </section>

      {showInventoryDrawer && (
        <section className="admin-panel-card">
          <div className="admin-panel-card-head">
            <div>
              <h2><SlidersHorizontal size={18} /> Xona Turlari, Narxlar va Rasmlar Boshqaruvi</h2>
              <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                Har bir xona turining narxini, nomini, rasmini va xonalar sonini o‘zgartiring yoki yangi xona turi yarating.
              </small>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {onOpenNewRoomType && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onOpenNewRoomType}>
                  <Plus size={14} /> Yangi xona turi, narx va rasm qo‘shish
                </button>
              )}
              {onOpenNewDormRoom && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenNewDormRoom}>
                  <Plus size={14} /> Xona raqami qo‘shish
                </button>
              )}
            </div>
          </div>

          <div className="admin-room-cards-grid">
            {overview.rooms.map((r) => {
              const draft = roomEdits[r.id] || {
                title: r.title,
                price: r.price,
                totalRooms: r.totalRooms,
                occupiedSpots: r.occupiedSpots
              };
              const fillPct = r.totalSpots ? Math.min(100, Math.round((r.occupiedSpots / r.totalSpots) * 100)) : 0;
              return (
                <article className="admin-room-card" key={r.id}>
                  <div className="admin-room-type-media">
                    <img src={r.image || "/images/room3.jpeg"} alt={r.title} />
                    <div className="admin-room-type-media-overlay">
                      <span className="admin-room-type-pill">{r.spotsPerRoom} kishilik • {r.floor || "3-qavat"}</span>
                      <label className="admin-img-upload-pill">
                        <Camera size={13} />
                        <span>{busyId === `room-img-${r.id}` ? "Yuklanmoqda..." : "Rasm yuklash"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleQuickTypeImageUpload(r, e)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-room-card-top">
                    <div>
                      <h3>{r.title.replace(/^\d+\s*\/\s*/, "")}</h3>
                      <small style={{ color: "var(--color-muted)", fontSize: 12 }}>{r.size} • {r.bathroom}</small>
                    </div>
                    <strong className="admin-room-price">{r.price}</strong>
                  </div>

                  <div className="admin-progress-wrap">
                    <div className="admin-progress-bar">
                      <span style={{ width: `${fillPct}%` }} />
                    </div>
                    <div className="admin-progress-meta">
                      <span>{r.occupiedSpots} / {r.totalSpots} band ({fillPct}%)</span>
                      <span>{r.availableSpots} bo‘sh</span>
                    </div>
                  </div>

                  <div className="admin-room-edit-stack">
                    <div className="admin-room-edit-row">
                      <label style={{ flex: 1 }}>
                        <span>Xona nomi:</span>
                        <input
                          type="text"
                          value={draft.title ?? r.title}
                          onChange={(e) =>
                            setRoomEdits((prev) => ({ ...prev, [r.id]: { ...draft, title: e.target.value } }))
                          }
                        />
                      </label>
                      <label style={{ flex: 1 }}>
                        <span>Oylik narx (so‘m):</span>
                        <input
                          type="text"
                          value={draft.price ?? r.price}
                          placeholder="1 100 000 so‘m"
                          onChange={(e) =>
                            setRoomEdits((prev) => ({ ...prev, [r.id]: { ...draft, price: e.target.value } }))
                          }
                        />
                      </label>
                    </div>

                    <div className="admin-room-edit-row">
                      <label>
                        <span>Xonalar:</span>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={draft.totalRooms ?? r.totalRooms}
                          onChange={(e) =>
                            setRoomEdits((prev) => ({ ...prev, [r.id]: { ...draft, totalRooms: e.target.value } }))
                          }
                        />
                      </label>
                      <label>
                        <span>Band joy:</span>
                        <input
                          type="number"
                          min={0}
                          max={Number(draft.totalRooms || 1) * r.spotsPerRoom}
                          value={draft.occupiedSpots ?? r.occupiedSpots}
                          onChange={(e) =>
                            setRoomEdits((prev) => ({ ...prev, [r.id]: { ...draft, occupiedSpots: e.target.value } }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === `room-${r.id}`}
                        onClick={() =>
                          runAdminRequest({
                            url: `/api/admin/rooms/${r.id}`,
                            method: "PUT",
                            body: {
                              title: draft.title ?? r.title,
                              price: draft.price ?? r.price,
                              totalRooms: Number(draft.totalRooms ?? r.totalRooms),
                              occupiedSpots: Number(draft.occupiedSpots ?? r.occupiedSpots)
                            },
                            busyKey: `room-${r.id}`,
                            successMsg: `${r.title} narxi va fondi saqlandi!`
                          })
                        }
                      >
                        Saqlash
                      </button>
                      {onOpenEditRoomType && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenEditRoomType(r)}
                          title="Rasm, narx, tavsif va qulayliklarni batafsil tahrirlash"
                        >
                          <Pencil size={13} /> Batafsil
                        </button>
                      )}
                      {r.id > 3 && (
                        <button
                          type="button"
                          className="avatar-remove-btn"
                          onClick={() =>
                            runAdminRequest({
                              url: `/api/admin/rooms/${r.id}`,
                              method: "DELETE",
                              busyKey: `del-roomtype-${r.id}`,
                              successMsg: "Xona turi o‘chirildi."
                            })
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {showGalleryDrawer && (
        <section className="admin-panel-card">
          <div className="admin-panel-card-head">
            <h2><ImageIcon size={18} /> Sayt Fotogalereyasi va Xona Rasmlari ({(overview.gallery || []).length})</h2>
          </div>

          <form className="admin-gallery-upload-bar" onSubmit={handleAddGalleryPhoto}>
            <input
              required
              type="text"
              placeholder="Rasm sarlavhasi (masalan: Yangi 2 kishilik VIP xona)..."
              value={galleryForm.title}
              onChange={(e) => setGalleryForm((p) => ({ ...p, title: e.target.value }))}
            />
            <select
              value={galleryForm.category}
              onChange={(e) => setGalleryForm((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="rooms">Xonalar</option>
              <option value="study">Kutubxona</option>
              <option value="dining">Oshxona</option>
              <option value="sports">Sport</option>
              <option value="campus">Kampus</option>
            </select>
            <input
              type="text"
              placeholder="Teg (masalan: 2 o‘rin)"
              value={galleryForm.tag}
              onChange={(e) => setGalleryForm((p) => ({ ...p, tag: e.target.value }))}
            />
            <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
              <Camera size={14} />
              <span>{galleryForm.imageData ? "Rasm tanlandi ✓" : "Kompyuterdan rasm yuklash"}</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleGalleryFileChange} />
            </label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busyId === "add-gallery"}>
              <Plus size={14} /> Galereyaga qo‘shish
            </button>
          </form>

          <div className="admin-gallery-mini-grid">
            {(overview.gallery || []).map((g) => (
              <div className="admin-gallery-mini-card" key={g.id}>
                <img src={g.image} alt={g.title} loading="lazy" />
                <div className="admin-gallery-mini-body">
                  <strong>{g.title}</strong>
                  <small>{g.tag} • {g.category}</small>
                </div>
                <button
                  type="button"
                  className="avatar-remove-btn"
                  title="Rasmni o‘chirish"
                  onClick={() =>
                    runAdminRequest({
                      url: `/api/admin/gallery/${g.id}`,
                      method: "DELETE",
                      busyKey: `del-gal-${g.id}`,
                      successMsg: "Rasm galereyadan o‘chirildi."
                    })
                  }
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="admin-dorm-grid">
        {filteredDormRooms.map((dr) => {
          const isMaint = dr.status === "maintenance";
          const isFull = dr.occupied >= dr.capacity;
          return (
            <article className={`admin-dorm-card ${isMaint ? "is-maintenance" : ""}`} key={dr.id}>
              <div className="admin-dorm-card-thumb" onClick={() => onInspectRoom(dr.id)}>
                <img src={dr.image || "/images/room3.jpeg"} alt={`${dr.roomNumber}-xona`} loading="lazy" />
                <span className="admin-room-num-badge">
                  <DoorOpen size={14} /> {dr.roomNumber}-xona
                </span>
                <span className={`admin-occ-badge ${isMaint ? "is-maint" : isFull ? "is-full" : ""}`}>
                  {isMaint ? "Ta’mirlashda" : `${dr.occupied} / ${dr.capacity}`}
                </span>
              </div>

              <div className="admin-dorm-head">
                <div>
                  <strong style={{ fontSize: 13.5, color: "var(--blue-navy)" }}>{dr.typeTitle}</strong>
                  <small className="admin-dorm-submeta">
                    {dr.floor}-qavat • {dr.capacity} kishilik • <b style={{ color: "var(--blue-primary)" }}>{dr.monthlyPrice}</b>
                  </small>
                </div>
              </div>

              <div className="admin-bed-dots">
                {Array.from({ length: dr.capacity }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`bed-dot ${isMaint ? "is-maint" : idx < dr.occupied ? "is-filled" : ""}`}
                  />
                ))}
              </div>

              <div className="admin-occupants-list">
                {dr.residents.length === 0 ? (
                  <div className="admin-dorm-empty">Bo‘sh xona ({dr.capacity} ta joy mavjud)</div>
                ) : (
                  dr.residents.map((res) => (
                    <div
                      className="admin-occupant-chip admin-clickable-card"
                      key={res.id}
                      title="Talaba holatini ko‘rish va tahrirlash"
                      onClick={() => onEditResident(res)}
                    >
                      <div className="admin-occupant-info">
                        <strong>{res.studentName}</strong>
                        <small>{[res.course, res.faculty].filter(Boolean).join(" • ") || res.phone}</small>
                      </div>
                      <span className={`pay-pill is-${res.paymentStatus}`}>
                        {PAYMENT_LABELS[res.paymentStatus]}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-dorm-footer">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onInspectRoom(dr.id)}>
                  Boshqarish / Rasm & Narx
                </button>
                {!isMaint && dr.available > 0 && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAddResident(dr.id)}>
                    <Plus size={13} /> Joylashtirish
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
