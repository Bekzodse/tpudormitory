import React from "react";
import { Pencil, Phone, Trash2, Users } from "lucide-react";
import { formatUzs, PAYMENT_LABELS, SectionTotalsBar } from "../utils/AdminHelpers";

export default function AdminResidentsSection({
  overview,
  totals,
  filteredResidents,
  residentSearch,
  setResidentSearch,
  paymentFilter,
  setPaymentFilter,
  courseFilter,
  setCourseFilter,
  busyId,
  runAdminRequest,
  onEditResident
}) {
  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Jami yashovchilar", value: `${overview.residents.length} nafar`, sub: `Ko‘rinayotgan: ${filteredResidents.length} nafar` },
          { label: "To‘lov qilganlar", value: `${totals.paidCount} nafar`, tone: "is-green", sub: formatUzs(totals.collectedRevenue) },
          { label: "To‘lov kutilmoqda", value: `${totals.pendingPayCount} nafar`, tone: "is-amber", sub: "Oy yakunigacha" },
          { label: "Qarzdorlar", value: `${totals.overduePayCount} nafar`, tone: "is-red", sub: formatUzs(totals.overdueRevenue) }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          {[
            { key: "all", label: `Barchasi (${overview.residents.length})` },
            { key: "paid", label: `To‘langan (${totals.paidCount})` },
            { key: "pending", label: `Kutilmoqda (${totals.pendingPayCount})` },
            { key: "overdue", label: `Qarzdor (${totals.overduePayCount})` }
          ].map((pf) => (
            <button
              key={pf.key}
              type="button"
              className={`compare-tab-btn ${paymentFilter === pf.key ? "active" : ""}`}
              onClick={() => setPaymentFilter(pf.key)}
            >
              {pf.label}
            </button>
          ))}
        </div>
        <div className="admin-search-controls">
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">Barcha kurslar</option>
            <option value="1-kurs">1-kurs</option>
            <option value="2-kurs">2-kurs</option>
            <option value="3-kurs">3-kurs</option>
            <option value="4-kurs">4-kurs</option>
          </select>
          <input
            type="search"
            value={residentSearch}
            onChange={(e) => setResidentSearch(e.target.value)}
            placeholder="Ism, xona yoki fakultet..."
          />
        </div>
      </div>

      {filteredResidents.length === 0 ? (
        <div className="admin-empty-box">
          <Users size={28} />
          <strong>Mos yashovchi talabalar topilmadi</strong>
        </div>
      ) : (
        <div className="admin-residents-grid">
          {filteredResidents.map((res) => (
            <article
              className="admin-resident-card admin-clickable-card"
              key={res.id}
              onClick={() => onEditResident(res)}
            >
              <div className="booking-card-top">
                <div className="booking-student-id">
                  <span className="admin-room-num-badge">{res.roomNumber}</span>
                  <div>
                    <h3>{res.studentName}</h3>
                    <small>
                      {res.floor}-qavat • {[res.course, res.faculty].filter(Boolean).join(" • ") || "Yo‘nalish ko‘rsatilmagan"}
                    </small>
                  </div>
                </div>
                <span className={`pay-pill is-${res.paymentStatus}`}>{PAYMENT_LABELS[res.paymentStatus]}</span>
              </div>

              <div className="admin-student-meta">
                <a
                  href={`tel:${res.phone.replace(/\s+/g, "")}`}
                  className="booking-contact-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone size={13} /> {res.phone}
                </a>
                {res.telegram && <span>{res.telegram}</span>}
                {res.monthlyPrice && <span>{res.monthlyPrice}/oy</span>}
                {res.moveInDate && <span>Kirgan: {res.moveInDate}</span>}
              </div>

              <div className="admin-resident-controls" onClick={(e) => e.stopPropagation()}>
                <select
                  aria-label="Xonani o‘zgartirish"
                  value={res.dormRoomId}
                  disabled={busyId === `move-res-${res.id}`}
                  onChange={(e) =>
                    runAdminRequest({
                      url: `/api/admin/residents/${res.id}`,
                      method: "PATCH",
                      body: { dormRoomId: Number(e.target.value) },
                      busyKey: `move-res-${res.id}`,
                      successMsg: `${res.studentName} ko‘chirildi!`
                    })
                  }
                >
                  {overview.dormRooms.map((dr) => (
                    <option key={dr.id} value={dr.id} disabled={dr.id !== res.dormRoomId && dr.available === 0}>
                      {dr.roomNumber}-xona ({dr.occupied}/{dr.capacity})
                    </option>
                  ))}
                </select>

                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEditResident(res)}>
                  <Pencil size={13} /> Tahrirlash
                </button>

                <button
                  type="button"
                  className="avatar-remove-btn"
                  disabled={busyId === `del-res-${res.id}`}
                  onClick={() =>
                    runAdminRequest({
                      url: `/api/admin/residents/${res.id}`,
                      method: "DELETE",
                      busyKey: `del-res-${res.id}`,
                      successMsg: `${res.studentName} ro‘yxatdan chiqarildi.`
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
