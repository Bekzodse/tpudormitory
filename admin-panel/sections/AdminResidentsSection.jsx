import React, { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Pencil, Phone, Plus, Trash2, Users } from "lucide-react";
import { formatUzs, PAYMENT_LABELS, SectionTotalsBar, STATUS_LABELS } from "../utils/AdminHelpers";

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
  onEditResident,
  onEditAccount,
  onNewAccount,
  onLogContact,
  showToast
}) {
  const [studentTab, setStudentTab] = useState("residents"); // "residents" | "accounts"
  const [accountSearch, setAccountSearch] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [passwordDrafts, setPasswordDrafts] = useState({});

  const studentAccounts = useMemo(
    () => (overview.students || []).filter((s) => s.role !== "admin"),
    [overview.students]
  );

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return studentAccounts;
    return studentAccounts.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.login || "").toLowerCase().includes(q) ||
        (s.phone || "").toLowerCase().includes(q) ||
        (s.linkedRoomNumber || "").toLowerCase().includes(q)
    );
  }, [studentAccounts, accountSearch]);

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Yashovchi talabalar", value: `${overview.residents.length} nafar`, sub: `Ko‘rinayotgan: ${filteredResidents.length} nafar` },
          { label: "Portal talaba akkauntlari", value: `${studentAccounts.length} ta`, tone: "is-blue", sub: "Create / Edit / Delete" },
          { label: "To‘lov qilganlar", value: `${totals.paidCount} nafar`, tone: "is-green", sub: formatUzs(totals.collectedRevenue) },
          { label: "Qarzdorlar", value: `${totals.overduePayCount} nafar`, tone: "is-red", sub: formatUzs(totals.overdueRevenue) }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          <button
            type="button"
            className={`compare-tab-btn ${studentTab === "residents" ? "active" : ""}`}
            onClick={() => setStudentTab("residents")}
          >
            Yashovchi talabalar ({overview.residents.length})
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${studentTab === "accounts" ? "active" : ""}`}
            onClick={() => setStudentTab("accounts")}
          >
            Talaba portal akkauntlari ({studentAccounts.length})
          </button>
        </div>

        <div className="admin-search-controls">
          {studentTab === "residents" ? (
            <>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="all">Barcha to‘lovlar</option>
                <option value="paid">To‘langan ({totals.paidCount})</option>
                <option value="pending">Kutilmoqda ({totals.pendingPayCount})</option>
                <option value="overdue">Qarzdor ({totals.overduePayCount})</option>
              </select>
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
            </>
          ) : (
            <>
              <input
                type="search"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Ism, login, telefon yoki xona..."
              />
              {onNewAccount && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onNewAccount}>
                  <Plus size={14} /> Yangi talaba akkaunti
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {studentTab === "residents" ? (
        filteredResidents.length === 0 ? (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onLogContact) {
                        onLogContact({
                          section: "residents",
                          clientName: res.studentName,
                          clientPhone: res.phone,
                          channel: "Telefon qo‘ng‘irog‘i",
                          summary: `Yashovchi talaba ${res.studentName} (${res.roomNumber}-xona) bilan telefon orqali bog‘landi`
                        });
                      }
                    }}
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
                    title="Yashovchini o‘chirish"
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
        )
      ) : filteredAccounts.length === 0 ? (
        <div className="admin-empty-box">
          <Users size={28} />
          <strong>Talaba portal akkauntlari topilmadi</strong>
        </div>
      ) : (
        <div className="admin-students-grid">
          {filteredAccounts.map((st) => {
            const isShown = Boolean(revealedPasswords[st.id]);
            return (
              <article
                className="admin-student-card admin-clickable-card"
                key={st.id}
                onClick={() => onEditAccount && onEditAccount(st)}
              >
                <div className="booking-card-top" style={{ marginBottom: 0 }}>
                  <div className="booking-student-id">
                    <span className="profile-initials">
                      {st.avatar ? <img src={st.avatar} alt={st.firstName} /> : `${st.firstName[0]}${st.lastName[0]}`.toUpperCase()}
                    </span>
                    <div>
                      <h3>{st.firstName} {st.lastName}</h3>
                      <small>Talaba akkaunti • #{st.id}</small>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {st.linkedPaymentStatus ? (
                      <span className={`pay-pill is-${st.linkedPaymentStatus}`}>
                        {st.linkedRoomNumber ? `${st.linkedRoomNumber}-xona • ` : ""}
                        {PAYMENT_LABELS[st.linkedPaymentStatus]}
                      </span>
                    ) : (
                      <span className="pay-pill is-pending">
                        {st.linkedBookingStatus ? STATUS_LABELS[st.linkedBookingStatus] : "Akkaunt"}
                      </span>
                    )}
                    {onEditAccount && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAccount(st);
                        }}
                      >
                        <Pencil size={12} /> Tahrirlash
                      </button>
                    )}
                    <button
                      type="button"
                      className="avatar-remove-btn"
                      title="Talaba akkauntini o‘chirish"
                      disabled={busyId === `del-acc-${st.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        runAdminRequest({
                          url: `/api/admin/accounts/${st.id}`,
                          method: "DELETE",
                          busyKey: `del-acc-${st.id}`,
                          successMsg: `${st.firstName} ${st.lastName} (${st.login}) akkaunti o‘chirildi.`
                        });
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="admin-cred-box" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-cred-row">
                    <span>Login:</span>
                    <b>{st.login}</b>
                  </div>
                  <div className="admin-cred-row">
                    <span>Parol:</span>
                    {st.password ? (
                      <div className="admin-cred-val">
                        <code>{isShown ? st.password : "••••••••"}</code>
                        <button
                          type="button"
                          className="admin-cred-icon-btn"
                          onClick={() => setRevealedPasswords((p) => ({ ...p, [st.id]: !isShown }))}
                          aria-label="Parolni ko‘rsatish"
                        >
                          {isShown ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    ) : (
                      <small className="admin-cred-muted">Yangi parol o‘rnating</small>
                    )}
                  </div>
                </div>

                <div className="admin-student-meta">
                  <span>{st.course || "Kurs yo‘q"}</span>
                  <span>{st.age ? `${st.age} yosh` : "Yosh yo‘q"}</span>
                  {st.phone && (
                    <a
                      href={`tel:${st.phone.replace(/\s+/g, "")}`}
                      className="booking-contact-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onLogContact) {
                          onLogContact({
                            section: "students",
                            clientName: `${st.firstName} ${st.lastName}`,
                            clientPhone: st.phone,
                            channel: "Telefon qo‘ng‘irog‘i",
                            summary: `Talaba ${st.firstName} ${st.lastName} (@${st.login}) ga qo‘ng‘iroq qildi`
                          });
                        }
                      }}
                    >
                      <Phone size={13} /> {st.phone}
                    </a>
                  )}
                </div>

                <form
                  className="admin-pass-reset-row"
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const draft = (passwordDrafts[st.id] || "").trim();
                    if (draft.length < 6) {
                      if (showToast) showToast("Yangi parol kamida 6 ta belgi bo‘lishi kerak.");
                      return;
                    }
                    const ok = await runAdminRequest({
                      url: `/api/admin/accounts/${st.id}/password`,
                      method: "PATCH",
                      body: { password: draft },
                      busyKey: `pwd-${st.id}`,
                      successMsg: `${st.login} uchun yangi parol saqlandi!`
                    });
                    if (ok) {
                      setPasswordDrafts((p) => ({ ...p, [st.id]: "" }));
                      setRevealedPasswords((p) => ({ ...p, [st.id]: true }));
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Yangi parol o‘rnatish..."
                    value={passwordDrafts[st.id] || ""}
                    onChange={(e) => setPasswordDrafts((p) => ({ ...p, [st.id]: e.target.value }))}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" disabled={busyId === `pwd-${st.id}`}>
                    <KeyRound size={12} /> Saqlash
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
