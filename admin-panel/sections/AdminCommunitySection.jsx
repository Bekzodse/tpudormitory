import React, { useMemo, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Megaphone, Pencil, Phone, Pin, Plus, Trash2 } from "lucide-react";
import { MESSAGE_STATUS_LABELS, PAYMENT_LABELS, SectionTotalsBar, STATUS_LABELS } from "../utils/AdminHelpers";

export default function AdminCommunitySection({
  overview,
  busyId,
  runAdminRequest,
  onEditAccount,
  onNewAccount,
  onEditAnnouncement,
  showToast
}) {
  const [portalSubTab, setPortalSubTab] = useState("accounts");
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [accountSearch, setAccountSearch] = useState("");
  const [msgFilter, setMsgFilter] = useState("all");
  const [msgNotes, setMsgNotes] = useState({});

  const filteredStudents = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return overview.students;
    return overview.students.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.login.toLowerCase().includes(q) ||
        (s.phone || "").toLowerCase().includes(q) ||
        (s.linkedRoomNumber || "").toLowerCase().includes(q)
    );
  }, [overview.students, accountSearch]);

  const filteredMessages = useMemo(() => {
    if (msgFilter === "all") return overview.messages;
    return overview.messages.filter((m) => (m.status || "new") === msgFilter);
  }, [overview.messages, msgFilter]);

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Jami e’lonlar", value: `${overview.announcements.length} ta`, sub: `${overview.announcements.filter((a) => a.pinned).length} ta muhim` },
          { label: "Portal akkauntlari", value: `${overview.students.length} ta`, tone: "is-blue", sub: `${overview.students.filter((s) => s.linkedRoomNumber).length} tasi xonada` },
          { label: "Aloqa xabarlari", value: `${overview.messages.length} ta`, tone: "is-amber", sub: `${overview.messages.filter((m) => (m.status || "new") === "new").length} ta yangi` }
        ]}
      />

      <section className="admin-panel-card">
        <div className="admin-panel-card-head">
          <h2><Megaphone size={18} /> Talabalar uchun rasmiy e’lonlar ({overview.announcements.length})</h2>
        </div>
        <div className="admin-bookings-list">
          {overview.announcements.map((a) => (
            <article className={`admin-announcement-card ${a.pinned ? "is-pinned" : ""}`} key={a.id}>
              <div className="booking-card-top" style={{ marginBottom: 0 }}>
                <div>
                  <h3>{a.title}</h3>
                  <small>{a.category} • {a.audience} • {new Date(a.createdAt + "Z").toLocaleString("uz-UZ")}</small>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {onEditAnnouncement && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEditAnnouncement(a)}
                    >
                      <Pencil size={13} /> Tahrirlash
                    </button>
                  )}
                  <button
                    type="button"
                    className={`btn btn-sm ${a.pinned ? "btn-primary" : "btn-outline"}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/announcements/${a.id}`,
                        method: "PATCH",
                        body: { pinned: !a.pinned },
                        busyKey: `pin-ann-${a.id}`,
                        successMsg: a.pinned ? "Mahkamlash olib tashlandi." : "Muhim e’lon sifatida mahkamlandi!"
                      })
                    }
                  >
                    <Pin size={13} /> {a.pinned ? "Muhim" : "Mahkamlash"}
                  </button>
                  <button
                    type="button"
                    className="avatar-remove-btn"
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/announcements/${a.id}`,
                        method: "DELETE",
                        busyKey: `del-ann-${a.id}`,
                        successMsg: "E’lon o‘chirildi."
                      })
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="admin-msg-body">{a.content}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          <button
            type="button"
            className={`compare-tab-btn ${portalSubTab === "accounts" ? "active" : ""}`}
            onClick={() => setPortalSubTab("accounts")}
          >
            Portal akkauntlari ({overview.students.length})
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${portalSubTab === "messages" ? "active" : ""}`}
            onClick={() => setPortalSubTab("messages")}
          >
            Aloqa xabarlari ({overview.messages.length})
          </button>
        </div>

        <div className="admin-search-controls">
          {portalSubTab === "accounts" ? (
            <>
              <input
                type="search"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Ism, login, xona yoki telefon..."
              />
              {onNewAccount && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onNewAccount}>
                  <Plus size={14} /> Yangi akkaunt
                </button>
              )}
            </>
          ) : (
            <select value={msgFilter} onChange={(e) => setMsgFilter(e.target.value)}>
              <option value="all">Barcha xabarlar ({overview.messages.length})</option>
              <option value="new">Yangi ({overview.messages.filter((m) => (m.status || "new") === "new").length})</option>
              <option value="read">Ko‘rib chiqilgan</option>
              <option value="replied">Javob berilgan</option>
            </select>
          )}
        </div>
      </div>

      {portalSubTab === "accounts" ? (
        <div className="admin-students-grid">
          {filteredStudents.map((st) => {
            const isShown = Boolean(revealedPasswords[st.id]);
            return (
              <article
                className="admin-student-card admin-clickable-card"
                key={st.id}
                onClick={() => onEditAccount(st)}
              >
                <div className="booking-card-top" style={{ marginBottom: 0 }}>
                  <div className="booking-student-id">
                    <span className="profile-initials">
                      {st.avatar ? <img src={st.avatar} alt={st.firstName} /> : `${st.firstName[0]}${st.lastName[0]}`.toUpperCase()}
                    </span>
                    <div>
                      <h3>{st.firstName} {st.lastName}</h3>
                      <small>{st.role === "admin" ? "Administrator" : "Talaba"} • #{st.id}</small>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {st.role === "admin" ? (
                      <span className="pay-pill is-paid">Admin</span>
                    ) : st.linkedPaymentStatus ? (
                      <span className={`pay-pill is-${st.linkedPaymentStatus}`}>
                        {st.linkedRoomNumber ? `${st.linkedRoomNumber}-xona • ` : ""}
                        {PAYMENT_LABELS[st.linkedPaymentStatus]}
                      </span>
                    ) : (
                      <span className="pay-pill is-pending">
                        {st.linkedBookingStatus ? STATUS_LABELS[st.linkedBookingStatus] : "Akkaunt"}
                      </span>
                    )}
                    {st.role !== "admin" && (
                      <button
                        type="button"
                        className="avatar-remove-btn"
                        title="Akkauntni o‘chirish"
                        onClick={(e) => {
                          e.stopPropagation();
                          runAdminRequest({
                            url: `/api/admin/accounts/${st.id}`,
                            method: "DELETE",
                            busyKey: `del-acc-${st.id}`,
                            successMsg: `${st.login} akkaunti o‘chirildi.`
                          });
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
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
                      <small className="admin-cred-muted">Eski hash (parolni qayta o‘rnating)</small>
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
                      onClick={(e) => e.stopPropagation()}
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
                      showToast("Yangi parol kamida 6 ta belgi bo‘lishi kerak.");
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
      ) : (
        <div className="admin-bookings-list">
          {filteredMessages.map((m) => {
            const msgSt = m.status || "new";
            return (
              <article className="admin-booking-card" key={m.id}>
                <div className="booking-card-top">
                  <div>
                    <h3>{m.first_name} {m.last_name}</h3>
                    <small>{m.subject} • {new Date(m.created_at + "Z").toLocaleString("uz-UZ")}</small>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`pay-pill ${msgSt === "replied" ? "is-paid" : msgSt === "read" ? "is-pending" : "is-overdue"}`}>
                      {MESSAGE_STATUS_LABELS[msgSt] || msgSt}
                    </span>
                    <a href={`tel:${m.phone.replace(/\s+/g, "")}`} className="booking-contact-link">
                      <Phone size={13} /> {m.phone}
                    </a>
                  </div>
                </div>
                <p className="admin-msg-body">{m.message}</p>

                <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                  <input
                    type="text"
                    className="admin-booking-note-input"
                    style={{ marginTop: 0, flex: 1 }}
                    placeholder="Ichki eslatma yoki berilgan javob qisqachasi..."
                    value={msgNotes[m.id] ?? m.admin_note ?? ""}
                    onChange={(e) => setMsgNotes((p) => ({ ...p, [m.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busyId === `msg-note-${m.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/messages/${m.id}`,
                        method: "PATCH",
                        body: { status: msgSt, adminNote: msgNotes[m.id] ?? m.admin_note ?? "" },
                        busyKey: `msg-note-${m.id}`,
                        successMsg: "Xabar izohi saqlandi!"
                      })
                    }
                  >
                    Izohni saqlash
                  </button>
                </div>

                <div className="booking-card-actions" style={{ marginTop: 12 }}>
                  {[
                    { key: "new", label: "Yangi" },
                    { key: "read", label: "Ko‘rib chiqildi" },
                    { key: "replied", label: "Javob berildi" }
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      className={`btn btn-sm ${msgSt === st.key ? "btn-primary" : "btn-outline"}`}
                      disabled={busyId === `msg-${m.id}`}
                      onClick={() =>
                        runAdminRequest({
                          url: `/api/admin/messages/${m.id}`,
                          method: "PATCH",
                          body: { status: st.key, adminNote: msgNotes[m.id] ?? m.admin_note ?? "" },
                          busyKey: `msg-${m.id}`,
                          successMsg: `Xabar holati "${st.label}" deb belgilandi.`
                        })
                      }
                    >
                      {st.key === "replied" && <Check size={13} />} {st.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="avatar-remove-btn booking-delete-btn"
                    disabled={busyId === `del-msg-${m.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/messages/${m.id}`,
                        method: "DELETE",
                        busyKey: `del-msg-${m.id}`,
                        successMsg: "Xabar o‘chirildi."
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
