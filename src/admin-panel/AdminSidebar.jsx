import React from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

export default function AdminSidebar({
  adminAccount,
  showAdminCreds,
  setShowAdminCreds,
  onEditAdminAccount,
  navItems,
  section,
  setSection,
  totals
}) {
  return (
    <aside className="admin-sidebar" aria-label="Admin bo‘limlari">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-logo"><ShieldCheck size={22} /></div>
        <div>
          <strong>TPU Yotoqxona ERP</strong>
          <small>{adminAccount?.login || "AdminTPU"} • Boshqaruv tizimi</small>
        </div>
      </div>

      {adminAccount && (
        <div className="admin-cred-box" style={{ gap: 7 }}>
          <div className="admin-cred-row"><span>Admin login:</span><b>{adminAccount.login}</b></div>
          <div className="admin-cred-row">
            <span>Admin parol:</span>
            <div className="admin-cred-val">
              <code>{showAdminCreds ? (adminAccount.password || "—") : "••••••••"}</code>
              <button
                type="button"
                className="admin-cred-icon-btn"
                onClick={() => setShowAdminCreds((v) => !v)}
                aria-label="Admin parolini ko‘rsatish"
              >
                {showAdminCreds ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => onEditAdminAccount(adminAccount)}
          >
            <KeyRound size={13} /> Login / Parolni tahrirlash
          </button>
        </div>
      )}

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${section === item.id ? "active" : ""}`}
              onClick={() => setSection(item.id)}
            >
              <span className="admin-nav-left"><IconComp size={17} /><span>{item.label}</span></span>
              {item.badge !== null && <span className={`admin-nav-badge ${item.tone || ""}`}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="admin-sidebar-meter">
        <div className="admin-sidebar-meter-head"><span>Umumiy bandlik</span><span>{totals.occPct}%</span></div>
        <div className="admin-progress-bar"><span style={{ width: `${totals.occPct}%` }} /></div>
        <small>{totals.occupiedSpots} band • {totals.availableSpots} ta bo‘sh joy mavjud</small>
      </div>
    </aside>
  );
}
