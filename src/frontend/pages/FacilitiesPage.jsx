import React from "react";
import {
  Armchair, BookOpen, Building2, CalendarDays, CarFront, Check,
  Dumbbell, ShieldCheck, Utensils, WashingMachine, Wifi
} from "lucide-react";

const FACILITY_ICONS = {
  Wifi,
  ShieldCheck,
  Utensils,
  WashingMachine,
  Dumbbell,
  BookOpen,
  Armchair,
  CarFront,
  Building2
};

export default function FacilitiesPage({ facilities, totalCount, category, setCategory, openBooking }) {
  return (
    <div className="page-view-wrap section-wrap">
      <div className="section-header-centered">
        <span className="section-kicker">
          <Building2 size={14} /> Qulayliklar va Imkoniyatlar
        </span>
        <h1 className="section-title">Talabalar hayoti uchun to‘liq sharoitlar</h1>
        <p className="section-subtitle">
          TPU talabalari uchun yaratilgan har bir qulaylik bilan batafsil tanishing.
        </p>

        <div className="filter-pill-group">
          <button
            className={`btn-filter ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            Barchasi ({totalCount ?? facilities.length})
          </button>
          <button
            className={`btn-filter ${category === "study" ? "active" : ""}`}
            onClick={() => setCategory("study")}
          >
            📚 O‘qish va Karyera
          </button>
          <button
            className={`btn-filter ${category === "dining" ? "active" : ""}`}
            onClick={() => setCategory("dining")}
          >
            🍳 Oshxona
          </button>
          <button
            className={`btn-filter ${category === "sports" ? "active" : ""}`}
            onClick={() => setCategory("sports")}
          >
            🏋️‍♂️ Sport
          </button>
          <button
            className={`btn-filter ${category === "security" ? "active" : ""}`}
            onClick={() => setCategory("security")}
          >
            🛡️ Xavfsizlik
          </button>
        </div>
      </div>

      <div className="facility-grid">
        {facilities.map((fac) => {
          const Icon = fac.icon || FACILITY_ICONS[fac.iconName] || Building2;
          return (
            <article className="facility-card" key={fac.id}>
              <div className="facility-card-top">
                <span className="facility-icon-wrap">
                  <Icon size={26} strokeWidth={2} />
                </span>
                <span className="facility-badge">{fac.badge}</span>
              </div>
              <h3 className="facility-card-title">{fac.title}</h3>
              <p className="facility-card-desc">{fac.sub}</p>
              <div className="facility-card-footer">
                <span className="facility-feature-check">
                  <Check size={14} /> Barcha talabalarga ochiq
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="page-bottom-cta">
        <h3>Barcha qulayliklardan bahramand bo‘lishni istaysizmi?</h3>
        <p>Hoziroq o‘zingizga mos xonani tanlang va bir necha daqiqada arizangizni topshiring.</p>
        <button className="btn btn-primary btn-lg" onClick={() => openBooking()}>
          <CalendarDays size={18} /> Xonani band qilish
        </button>
      </div>
    </div>
  );
}
