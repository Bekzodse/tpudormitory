import React, { useMemo, useState } from "react";
import {
  Activity,
  Download,
  Pencil,
  Phone,
  PhoneCall,
  PlusCircle,
  Trash2,
  UserCheck
} from "lucide-react";
import {
  ACTION_TYPE_LABELS,
  downloadActivityLogsCsv,
  SECTION_LABELS,
  SectionTotalsBar
} from "../utils/AdminHelpers";

const ACTION_STYLE = {
  create: { pill: "is-paid", icon: PlusCircle },
  update: { pill: "is-pending", icon: Pencil },
  delete: { pill: "is-overdue", icon: Trash2 },
  contact: { pill: "is-contact", icon: PhoneCall }
};

export default function AdminActivityLogSection({ overview, showToast }) {
  const [actionFilter, setActionFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "clients"

  const logs = overview.activityLogs || [];

  const stats = useMemo(() => {
    const created = logs.filter((l) => l.actionType === "create").length;
    const updated = logs.filter((l) => l.actionType === "update").length;
    const deleted = logs.filter((l) => l.actionType === "delete").length;
    const contacts = logs.filter((l) => l.actionType === "contact");
    const uniqueClients = new Map();
    contacts.forEach((c) => {
      const key = (c.clientPhone || c.clientName || c.targetName || "").trim().toLowerCase();
      if (!key) return;
      if (!uniqueClients.has(key)) {
        uniqueClients.set(key, {
          clientName: c.clientName || c.targetName || "Klient",
          clientPhone: c.clientPhone || "",
          lastContactAt: c.createdAt,
          lastSummary: c.summary,
          lastChannel: c.entityLabel || SECTION_LABELS[c.section] || c.section,
          adminLogin: c.adminLogin,
          count: 1
        });
      } else {
        uniqueClients.get(key).count += 1;
      }
    });
    return {
      total: logs.length,
      created,
      updated,
      deleted,
      contactsCount: contacts.length,
      uniqueClientsList: Array.from(uniqueClients.values())
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((l) => {
      if (actionFilter !== "all" && l.actionType !== actionFilter) return false;
      if (sectionFilter !== "all" && l.section !== sectionFilter) return false;
      if (!q) return true;
      return (
        (l.summary || "").toLowerCase().includes(q) ||
        (l.clientName || "").toLowerCase().includes(q) ||
        (l.clientPhone || "").toLowerCase().includes(q) ||
        (l.targetName || "").toLowerCase().includes(q) ||
        (l.adminLogin || "").toLowerCase().includes(q) ||
        (SECTION_LABELS[l.section] || l.section || "").toLowerCase().includes(q)
      );
    });
  }, [logs, actionFilter, sectionFilter, searchQuery]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stats.uniqueClientsList;
    return stats.uniqueClientsList.filter(
      (c) =>
        (c.clientName || "").toLowerCase().includes(q) ||
        (c.clientPhone || "").toLowerCase().includes(q) ||
        (c.lastSummary || "").toLowerCase().includes(q)
    );
  }, [stats.uniqueClientsList, searchQuery]);

  const availableSections = useMemo(() => {
    const set = new Set(logs.map((l) => l.section).filter(Boolean));
    return Array.from(set);
  }, [logs]);

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Jami qayd etilgan ishlar", value: `${stats.total} ta`, tone: "is-blue", sub: "Ishboshqaruvchi nazorati" },
          { label: "Yaratilgan ob’ektlar", value: `${stats.created} ta`, tone: "is-green", sub: "Yangi xona, talaba, e’lon..." },
          { label: "Tahrir / O‘chirish", value: `${stats.updated} / ${stats.deleted}`, tone: "is-amber", sub: `${stats.updated} tahrir • ${stats.deleted} o‘chirish` },
          { label: "Bog‘lanilgan klientlar", value: `${stats.uniqueClientsList.length} nafar`, tone: "is-red", sub: `Jami ${stats.contactsCount} ta aloqa` }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          <button
            type="button"
            className={`compare-tab-btn ${viewMode === "timeline" ? "active" : ""}`}
            onClick={() => setViewMode("timeline")}
          >
            <Activity size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Barcha ishlar jurnali ({logs.length})
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${viewMode === "clients" ? "active" : ""}`}
            onClick={() => setViewMode("clients")}
          >
            <UserCheck size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Bog‘lanilgan klientlar ({stats.uniqueClientsList.length})
          </button>
        </div>

        <div className="admin-search-controls">
          {viewMode === "timeline" && (
            <>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                <option value="all">Barcha harakatlar</option>
                <option value="create">Yaratildi ({stats.created})</option>
                <option value="update">Tahrirlandi ({stats.updated})</option>
                <option value="delete">O‘chirildi ({stats.deleted})</option>
                <option value="contact">Klient bilan bog‘landi ({stats.contactsCount})</option>
              </select>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                <option value="all">Barcha bo‘limlar</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {SECTION_LABELS[sec] || sec}
                  </option>
                ))}
              </select>
            </>
          )}
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Klient ismi, telefon, bo‘lim yoki amal..."
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              downloadActivityLogsCsv(filteredLogs);
              if (showToast) showToast("Admin ishlar jurnali CSV faylga yuklandi!");
            }}
          >
            <Download size={14} /> CSV yuklash
          </button>
        </div>
      </div>

      {viewMode === "clients" ? (
        filteredClients.length === 0 ? (
          <div className="admin-empty-box">
            <PhoneCall size={28} />
            <strong>Hali klientlar bilan bog‘lanish qayd etilmagan</strong>
            <small style={{ color: "var(--color-muted)" }}>
              Admin chatda javob bersa, arizani tasdiqlasa, telefon/Telegram bossa yoki to‘lov eslatmasi yuborsa shu yerda chiqadi.
            </small>
          </div>
        ) : (
          <div className="admin-residents-grid">
            {filteredClients.map((c, idx) => (
              <article className="admin-resident-card" key={`${c.clientPhone || c.clientName}-${idx}`}>
                <div className="booking-card-top">
                  <div className="booking-student-id">
                    <span className="profile-initials">{c.clientName.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <h3>{c.clientName}</h3>
                      <small>
                        Oxirgi aloqa: {new Date(c.lastContactAt + "Z").toLocaleString("uz-UZ")} • Admin: {c.adminLogin}
                      </small>
                    </div>
                  </div>
                  <span className="pay-pill is-paid">{c.count} marta aloqa</span>
                </div>
                <p className="admin-msg-body" style={{ margin: "6px 0" }}>{c.lastSummary}</p>
                <div className="admin-student-meta">
                  <span className="admin-room-num-badge">{c.lastChannel}</span>
                  {c.clientPhone && (
                    <a href={`tel:${c.clientPhone.replace(/\s+/g, "")}`} className="booking-contact-link">
                      <Phone size={13} /> {c.clientPhone}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )
      ) : filteredLogs.length === 0 ? (
        <div className="admin-empty-box">
          <Activity size={28} />
          <strong>Hozircha mos yozuvlar topilmadi</strong>
          <small style={{ color: "var(--color-muted)" }}>
            Admin panelda bajarilgan har bir yaratish, tahrirlash, o‘chirish va klient bilan bog‘lanish avtomatik yozib boriladi.
          </small>
        </div>
      ) : (
        <div className="admin-bookings-list">
          {filteredLogs.map((log) => {
            const cfg = ACTION_STYLE[log.actionType] || ACTION_STYLE.update;
            const ActionIcon = cfg.icon;
            return (
              <article className={`admin-booking-card admin-log-card action-${log.actionType}`} key={log.id}>
                <div className="booking-card-top" style={{ marginBottom: 6 }}>
                  <div className="booking-student-id">
                    <span className={`admin-log-icon-badge action-${log.actionType}`}>
                      <ActionIcon size={16} />
                    </span>
                    <div>
                      <h3 style={{ fontSize: 15 }}>{log.summary}</h3>
                      <small>
                        #{log.id} • {new Date(log.createdAt + "Z").toLocaleString("uz-UZ")} • Admin: <b>{log.adminName}</b> ({log.adminLogin})
                      </small>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="admin-room-num-badge">
                      {SECTION_LABELS[log.section] || log.section}
                    </span>
                    <span className={`pay-pill ${cfg.pill}`}>
                      {ACTION_TYPE_LABELS[log.actionType] || log.actionType}
                    </span>
                  </div>
                </div>

                {(log.targetName || log.clientName || log.clientPhone) && (
                  <div className="admin-student-meta" style={{ marginTop: 4 }}>
                    {log.entityLabel && <span>Tur: <b>{log.entityLabel}</b></span>}
                    {log.targetName && <span>Ob’ekt: <b>{log.targetName}</b></span>}
                    {log.clientName && <span>Klient: <b>{log.clientName}</b></span>}
                    {log.clientPhone && (
                      <a href={`tel:${log.clientPhone.replace(/\s+/g, "")}`} className="booking-contact-link">
                        <Phone size={12} /> {log.clientPhone}
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
