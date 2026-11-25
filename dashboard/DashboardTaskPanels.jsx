import React from "react";
import { CalendarDays, Check, Megaphone, Wrench } from "lucide-react";
import { formatUzs, PRIO_LABELS } from "../admin-panel/utils/AdminHelpers";

export default function DashboardTaskPanels({
  overview,
  totals,
  onNavigate,
  busyId,
  runAdminRequest
}) {
  const pendingList = overview.bookings.filter((b) => b.status === "pending");
  const openMaint = overview.maintenance.filter((m) => m.status !== "resolved");
  const unreadMessages = overview.messages.filter((m) => (m.status || "new") === "new");

  return (
    <div className="admin-dash-split">
      <section className="admin-panel-card">
        <div className="admin-panel-card-head">
          <h2><CalendarDays size={18} /> Kutilayotgan arizalar</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onNavigate("bookings")}>
            Barchasi →
          </button>
        </div>
        {pendingList.length === 0 ? (
          <div className="admin-dorm-empty">Hozircha yangi ko‘rilmagan bron so‘rovlari yo‘q</div>
        ) : (
          <div className="admin-mini-list">
            {pendingList.slice(0, 4).map((b) => (
              <div className="admin-mini-row" key={b.id}>
                <div>
                  <strong>{b.student_name}</strong>
                  <small>
                    {b.room_title.replace(/^\d+\s*\/\s*/, "")} • {b.phone}
                    {b.preferred_room_number ? ` • So‘ralgan: ${b.preferred_room_number}-xona` : ""}
                  </small>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {runAdminRequest && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busyId === `dash-book-${b.id}`}
                      onClick={() =>
                        runAdminRequest({
                          url: `/api/admin/bookings/${b.id}`,
                          method: "PATCH",
                          body: { status: "approved" },
                          busyKey: `dash-book-${b.id}`,
                          successMsg: `${b.student_name} arizasi qabul qilindi!`
                        })
                      }
                    >
                      <Check size={13} /> Qabul
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate("bookings")}>
                    Ko‘rish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel-card">
        <div className="admin-panel-card-head">
          <h2><Wrench size={18} /> Faol texnik ishlar va Qarzdorlik</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onNavigate("maintenance")}>
            Boshqarish →
          </button>
        </div>
        <div className="admin-mini-list">
          {openMaint.slice(0, 3).map((m) => (
            <div className="admin-mini-row" key={m.id}>
              <div>
                <strong>{m.roomNumber}-xona • {m.category}</strong>
                <small>{m.description}</small>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span className={`admin-maint-priority prio-${m.priority}`}>{PRIO_LABELS[m.priority]}</span>
                {runAdminRequest && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busyId === `dash-maint-${m.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/maintenance/${m.id}`,
                        method: "PATCH",
                        body: { status: "resolved" },
                        busyKey: `dash-maint-${m.id}`,
                        successMsg: `${m.roomNumber}-xona texnik ishi hal qilindi!`
                      })
                    }
                  >
                    <Check size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {totals.overduePayCount > 0 && (
            <div className="admin-mini-row">
              <div>
                <strong>To‘lov muddati o‘tgan talabalar</strong>
                <small>{totals.overduePayCount} nafar talabada {formatUzs(totals.overdueRevenue)} qarzdorlik</small>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate("payments")}>
                To‘lovlar
              </button>
            </div>
          )}
          {unreadMessages.length > 0 && (
            <div className="admin-mini-row">
              <div>
                <strong><Megaphone size={13} style={{ verticalAlign: "middle" }} /> Yangi aloqa xabarlari</strong>
                <small>Sayt aloqa formasidan {unreadMessages.length} ta yangi murojaat kelgan</small>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate("announcements")}>
                Xabarlar
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
