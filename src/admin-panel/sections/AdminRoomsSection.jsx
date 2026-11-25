import React, { useMemo, useState } from "react";
import { DoorOpen, Plus, SlidersHorizontal } from "lucide-react";
import { PAYMENT_LABELS, SectionTotalsBar } from "../utils/AdminHelpers";

export default function AdminRoomsSection({
  overview,
  totals,
  roomEdits,
  setRoomEdits,
  busyId,
  runAdminRequest,
  onInspectRoom,
  onAddResident,
  onEditResident
}) {
  const [dormFloorFilter, setDormFloorFilter] = useState("all");
  const [dormAvailabilityFilter, setDormAvailabilityFilter] = useState("all");
  const [dormSearch, setDormSearch] = useState("");
  const [showInventoryDrawer, setShowInventoryDrawer] = useState(false);

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
        r.residents.some((res) => res.studentName.toLowerCase().includes(q))
      );
    });
  }, [overview.dormRooms, dormFloorFilter, dormAvailabilityFilter, dormSearch]);

  return (
    <>
      <SectionTotalsBar
        items={[
          {
            label: "Raqamlangan xonalar",
            value: `${overview.dormRooms.length} ta`,
            sub: `${overview.dormRooms.filter((r) => r.status === "maintenance").length} tasi ta’mirlashda`
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
            <option value="4">4-qavat (2 kishilik)</option>
            <option value="3">3-qavat (4 kishilik)</option>
            <option value="2">2-qavat (6 kishilik)</option>
          </select>
          <input
            type="search"
            value={dormSearch}
            onChange={(e) => setDormSearch(e.target.value)}
            placeholder="Xona raqami yoki talaba..."
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowInventoryDrawer((v) => !v)}
          >
            <SlidersHorizontal size={14} /> {showInventoryDrawer ? "Fondni yopish" : "2/4/6 fond sozlash"}
          </button>
        </div>
      </div>

      {showInventoryDrawer && (
        <div className="admin-room-cards-grid">
          {overview.rooms.map((r) => {
            const draft = roomEdits[r.id] || { totalRooms: r.totalRooms, occupiedSpots: r.occupiedSpots };
            const fillPct = r.totalSpots ? Math.min(100, Math.round((r.occupiedSpots / r.totalSpots) * 100)) : 0;
            return (
              <article className="admin-room-card" key={r.id}>
                <div className="admin-room-card-top">
                  <div>
                    <span className="admin-room-type-pill">{r.spotsPerRoom} kishilik</span>
                    <h3>{r.title.replace(/^\d+\s*\/\s*/, "")}</h3>
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
                <div className="admin-room-edit-row">
                  <label>
                    <span>Xonalar:</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={draft.totalRooms}
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
                      value={draft.occupiedSpots}
                      onChange={(e) =>
                        setRoomEdits((prev) => ({ ...prev, [r.id]: { ...draft, occupiedSpots: e.target.value } }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busyId === `room-${r.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/rooms/${r.id}`,
                        method: "PUT",
                        body: { totalRooms: Number(draft.totalRooms), occupiedSpots: Number(draft.occupiedSpots) },
                        busyKey: `room-${r.id}`,
                        successMsg: "Xona fondi saqlandi!"
                      })
                    }
                  >
                    Saqlash
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="admin-dorm-grid">
        {filteredDormRooms.map((dr) => {
          const isMaint = dr.status === "maintenance";
          const isFull = dr.occupied >= dr.capacity;
          return (
            <article className={`admin-dorm-card ${isMaint ? "is-maintenance" : ""}`} key={dr.id}>
              <div className="admin-dorm-head">
                <div>
                  <span className="admin-room-num-badge">
                    <DoorOpen size={14} /> {dr.roomNumber}-xona
                  </span>
                  <small className="admin-dorm-submeta">
                    {dr.floor}-qavat • {dr.capacity} kishilik • {dr.monthlyPrice}
                  </small>
                </div>
                <span className={`admin-occ-badge ${isMaint ? "is-maint" : isFull ? "is-full" : ""}`}>
                  {isMaint ? "Ta’mirlashda" : `${dr.occupied} / ${dr.capacity}`}
                </span>
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
                  Boshqarish
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
