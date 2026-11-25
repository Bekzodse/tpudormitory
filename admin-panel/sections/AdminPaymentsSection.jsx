import React, { useMemo, useState } from "react";
import { Check, Copy, CreditCard, Download } from "lucide-react";
import { downloadPaymentsCsv, formatUzs, PAYMENT_LABELS, SectionTotalsBar } from "../utils/AdminHelpers";

export default function AdminPaymentsSection({
  overview,
  totals,
  busyId,
  runAdminRequest,
  onEditResident,
  showToast
}) {
  const [payFilter, setPayFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResidents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return overview.residents.filter((r) => {
      if (payFilter !== "all" && r.paymentStatus !== payFilter) return false;
      if (floorFilter !== "all" && String(r.floor) !== floorFilter) return false;
      if (!q) return true;
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.roomNumber.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    });
  }, [overview.residents, payFilter, floorFilter, searchQuery]);

  const copyPaymentReminder = async (res) => {
    const text = `Assalomu alaykum, ${res.studentName}! TPU Smart Yotoqxona (${res.roomNumber}-xona) bo‘yicha joriy oy to‘lovi (${res.monthlyPrice}) kutilmoqda. Iltimos, ma’muriyatga yoki hisobga o‘tkazing.`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("To‘lov eslatma matni nusxalandi!");
    } catch {
      showToast("Eslatma matnini nusxalab bo‘lmadi.");
    }
  };

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Jami talabalar hisobi", value: `${overview.residents.length} nafar`, sub: formatUzs(totals.expectedRevenue) },
          { label: "To‘langan", value: `${totals.paidCount} nafar`, tone: "is-green", sub: formatUzs(totals.collectedRevenue) },
          {
            label: "Kutilmoqda",
            value: `${totals.pendingPayCount} nafar`,
            tone: "is-amber",
            sub: formatUzs(totals.expectedRevenue - totals.collectedRevenue - totals.overdueRevenue)
          },
          { label: "Qarzdorlar", value: `${totals.overduePayCount} nafar`, tone: "is-red", sub: formatUzs(totals.overdueRevenue) }
        ]}
      />

      <div className="admin-finance-banner">
        <div className="admin-finance-grid">
          <div className="admin-finance-metric">
            <small>Jami oylik kutilayotgan tushum</small>
            <strong>{formatUzs(totals.expectedRevenue)}</strong>
          </div>
          <div className="admin-finance-metric">
            <small>Yig‘ilgan mablag‘ ({totals.collectionPct}%)</small>
            <strong>{formatUzs(totals.collectedRevenue)}</strong>
          </div>
          <div className="admin-finance-metric">
            <small>Qarzdorlik qoldig‘i</small>
            <strong>{formatUzs(totals.overdueRevenue)}</strong>
          </div>
        </div>
        <div className="admin-progress-bar is-light">
          <span style={{ width: `${totals.collectionPct}%` }} />
        </div>
      </div>

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
              className={`compare-tab-btn ${payFilter === pf.key ? "active" : ""}`}
              onClick={() => setPayFilter(pf.key)}
            >
              {pf.label}
            </button>
          ))}
        </div>

        <div className="admin-search-controls">
          <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
            <option value="all">Barcha qavatlar</option>
            <option value="4">4-qavat</option>
            <option value="3">3-qavat</option>
            <option value="2">2-qavat</option>
          </select>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, xona yoki telefon..."
          />
          {totals.pendingPayCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={busyId === "bulk-pay"}
              onClick={() =>
                runAdminRequest({
                  url: "/api/admin/payments/bulk",
                  body: { fromStatus: "pending", toStatus: "paid" },
                  busyKey: "bulk-pay",
                  successMsg: "Barcha kutilayotgan to‘lovlar 'To‘landi' deb tasdiqlandi!"
                })
              }
            >
              <Check size={14} /> Kutilayotganlarni tasdiqlash
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              downloadPaymentsCsv(filteredResidents);
              showToast("Moliya hisoboti CSV faylga yuklandi!");
            }}
          >
            <Download size={14} /> CSV hisobot
          </button>
        </div>
      </div>

      {filteredResidents.length === 0 ? (
        <div className="admin-empty-box">
          <CreditCard size={28} />
          <strong>Mos to‘lov yozuvlari topilmadi</strong>
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
                    <small>{res.floor}-qavat • {res.monthlyPrice || "Oylik tarif"} • {res.phone}</small>
                  </div>
                </div>
                <span className={`pay-pill is-${res.paymentStatus}`}>{PAYMENT_LABELS[res.paymentStatus]}</span>
              </div>
              <div className="booking-card-actions" onClick={(e) => e.stopPropagation()}>
                {[
                  { key: "paid", label: "To‘landi" },
                  { key: "pending", label: "Kutilmoqda" },
                  { key: "overdue", label: "Qarzdor" }
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    className={`btn btn-sm ${res.paymentStatus === st.key ? "btn-primary" : "btn-outline"}`}
                    disabled={busyId === `pay-${res.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/residents/${res.id}`,
                        method: "PATCH",
                        body: { paymentStatus: st.key },
                        busyKey: `pay-${res.id}`,
                        successMsg: `${res.studentName}: "${st.label}" deb belgilandi.`
                      })
                    }
                  >
                    {st.label}
                  </button>
                ))}
                {res.paymentStatus !== "paid" && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginLeft: "auto" }}
                    onClick={() => copyPaymentReminder(res)}
                  >
                    <Copy size={13} /> Eslatma
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
