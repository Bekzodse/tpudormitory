import React, { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Trash2, Wrench } from "lucide-react";
import { MAINT_LABELS, PRIO_LABELS, SectionTotalsBar } from "../utils/AdminHelpers";

export default function AdminMaintenanceSection({ overview, busyId, runAdminRequest, onEditMaintenance }) {
  const [maintFilter, setMaintFilter] = useState("all");
  const [prioFilter, setPrioFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [maintNotes, setMaintNotes] = useState({});

  const filteredMaintenance = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return overview.maintenance.filter((m) => {
      if (maintFilter !== "all" && m.status !== maintFilter) return false;
      if (prioFilter !== "all" && m.priority !== prioFilter) return false;
      if (!q) return true;
      return (
        m.roomNumber.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.reporterName || "").toLowerCase().includes(q)
      );
    });
  }, [overview.maintenance, maintFilter, prioFilter, searchQuery]);

  return (
    <>
      <SectionTotalsBar
        items={[
          {
            label: "Jami texnik arizalar",
            value: `${overview.maintenance.length} ta`,
            sub: `${overview.maintenance.filter((m) => m.priority === "high" && m.status !== "resolved").length} ta shoshilinch`
          },
          { label: "Ochiq", value: `${overview.maintenance.filter((m) => m.status === "open").length} ta`, tone: "is-red", sub: "Usta kutmoqda" },
          { label: "Jarayonda", value: `${overview.maintenance.filter((m) => m.status === "in_progress").length} ta`, tone: "is-amber", sub: "Ta’mirlanmoqda" },
          { label: "Hal qilindi", value: `${overview.maintenance.filter((m) => m.status === "resolved").length} ta`, tone: "is-green", sub: "Yakunlangan" }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          {[
            { key: "all", label: `Barchasi (${overview.maintenance.length})` },
            { key: "open", label: `Ochiq (${overview.maintenance.filter((m) => m.status === "open").length})` },
            { key: "in_progress", label: `Jarayonda (${overview.maintenance.filter((m) => m.status === "in_progress").length})` },
            { key: "resolved", label: `Hal qilindi (${overview.maintenance.filter((m) => m.status === "resolved").length})` }
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              className={`compare-tab-btn ${maintFilter === st.key ? "active" : ""}`}
              onClick={() => setMaintFilter(st.key)}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="admin-search-controls">
          <select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)}>
            <option value="all">Barcha muhimliklar</option>
            <option value="high">Shoshilinch</option>
            <option value="medium">O‘rtacha</option>
            <option value="low">Past</option>
          </select>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Xona raqami, yo‘nalish yoki tavsif..."
          />
        </div>
      </div>

      {filteredMaintenance.length === 0 ? (
        <div className="admin-empty-box">
          <Wrench size={28} />
          <strong>Mos texnik so‘rovlar topilmadi</strong>
        </div>
      ) : (
        <div className="admin-bookings-list">
          {filteredMaintenance.map((m) => (
            <article className="admin-booking-card" key={m.id}>
              <div className="booking-card-top">
                <div className="booking-student-id">
                  <span className="admin-room-num-badge">{m.roomNumber}</span>
                  <div>
                    <h3>{m.category}</h3>
                    <small>
                      {new Date(m.createdAt + "Z").toLocaleString("uz-UZ")}
                      {m.reporterName ? ` • Yubordi: ${m.reporterName}` : " • Ma’muriyat qayd etgan"}
                    </small>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`admin-maint-priority prio-${m.priority}`}>
                    <AlertTriangle size={11} /> {PRIO_LABELS[m.priority]}
                  </span>
                  <span
                    className={`admin-status-badge status-${
                      m.status === "resolved" ? "approved" : m.status === "in_progress" ? "pending" : "rejected"
                    }`}
                  >
                    {MAINT_LABELS[m.status]}
                  </span>
                </div>
              </div>
              <p className="admin-msg-body">{m.description}</p>

              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                <input
                  type="text"
                  className="admin-booking-note-input"
                  style={{ marginTop: 0, flex: 1 }}
                  placeholder="Usta yoki admin izohi (talaba kabinetida ko‘rinadi)..."
                  value={maintNotes[m.id] ?? m.adminNote ?? ""}
                  onChange={(e) => setMaintNotes((p) => ({ ...p, [m.id]: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busyId === `maint-note-${m.id}`}
                  onClick={() =>
                    runAdminRequest({
                      url: `/api/admin/maintenance/${m.id}`,
                      method: "PATCH",
                      body: { status: m.status, adminNote: maintNotes[m.id] ?? m.adminNote ?? "" },
                      busyKey: `maint-note-${m.id}`,
                      successMsg: "Texnik izoh saqlandi!"
                    })
                  }
                >
                  Izohni saqlash
                </button>
              </div>

              <div className="booking-card-actions" style={{ marginTop: 12 }}>
                {[
                  { key: "open", label: "Ochiq" },
                  { key: "in_progress", label: "Jarayonda" },
                  { key: "resolved", label: "Hal qilindi" }
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    className={`btn btn-sm ${m.status === st.key ? "btn-primary" : "btn-outline"}`}
                    disabled={busyId === `maint-${m.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/maintenance/${m.id}`,
                        method: "PATCH",
                        body: { status: st.key, adminNote: maintNotes[m.id] ?? m.adminNote ?? "" },
                        busyKey: `maint-${m.id}`,
                        successMsg: `Holat "${st.label}" ga yangilandi.`
                      })
                    }
                  >
                    {st.label}
                  </button>
                ))}
                {onEditMaintenance && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditMaintenance(m)}
                  >
                    <Pencil size={13} /> Tahrirlash
                  </button>
                )}
                <button
                  type="button"
                  className="avatar-remove-btn booking-delete-btn"
                  disabled={busyId === `del-maint-${m.id}`}
                  onClick={() =>
                    runAdminRequest({
                      url: `/api/admin/maintenance/${m.id}`,
                      method: "DELETE",
                      busyKey: `del-maint-${m.id}`,
                      successMsg: "Texnik so‘rov o‘chirildi."
                    })
                  }
                >
                  <Trash2 size={13} /> O‘chirish
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
