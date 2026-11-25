import React, { useMemo, useState } from "react";
import {
  Bed, BookOpen, Building2, Check, CheckCircle2, Filter,
  ShieldCheck, Sparkles, Users, Wallet, WashingMachine, Wifi
} from "lucide-react";

export default function ComparisonPage({ rooms, openBooking, openDetails }) {
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.priceNum - b.priceNum),
    [rooms]
  );

  const specsByCategory = {
    six: {
      highlight: "Eng arzon • 6 alohida karavot",
      people: { type: "tier-mid", label: "6 kishilik" },
      size: { type: "tier-best", label: "36 m² (Eng keng)" },
      bathroom: { type: "tier-shared", label: "Umumiy (qavatda)" },
      desk: { type: "tier-shared", label: "Umumiy o‘quv zali" },
      ac: { type: "tier-shared", label: "Ventilyatsiya + isitish" },
      storage: { type: "tier-mid", label: "Yon tumba + shkaf" },
      wifi: { type: "same", label: "Bepul" },
      utilities: { type: "same", label: "100% ichida" }
    },
    four: {
      highlight: "Qulay narx • Xona ichida stol",
      people: { type: "tier-mid", label: "4 kishilik" },
      size: { type: "tier-mid", label: "30 m² (3-qavat)" },
      bathroom: { type: "tier-shared", label: "Umumiy (qavatda)" },
      desk: { type: "tier-mid", label: "Xona ichida stol" },
      ac: { type: "tier-shared", label: "Markaziy isitish" },
      storage: { type: "tier-mid", label: "Karavot osti tortmalari" },
      wifi: { type: "same", label: "Bepul" },
      utilities: { type: "same", label: "100% ichida" }
    },
    two: {
      highlight: "Shaxsiy sanuzel • Konditsioner",
      people: { type: "tier-best", label: "2 kishilik (Sokin)" },
      size: { type: "tier-shared", label: "24 m² (4-qavat)" },
      bathroom: { type: "tier-best", label: "Xona ichida shaxsiy" },
      desk: { type: "tier-best", label: "2 ta shaxsiy stol" },
      ac: { type: "tier-best", label: "Konditsioner + isitish" },
      storage: { type: "tier-best", label: "Keng shkaf + tortmalar" },
      wifi: { type: "same", label: "Bepul" },
      utilities: { type: "same", label: "100% ichida" }
    }
  };

  const rows = [
    { key: "people", label: "O‘rinlar soni", icon: Users, get: (r) => specsByCategory[r.category].people },
    { key: "size", label: "Xona maydoni", icon: Building2, get: (r) => specsByCategory[r.category].size },
    { key: "bathroom", label: "Sanuzel va dush", icon: Sparkles, get: (r) => specsByCategory[r.category].bathroom },
    { key: "desk", label: "O‘qish stoli", icon: BookOpen, get: (r) => specsByCategory[r.category].desk },
    { key: "ac", label: "Iqlim nazorati", icon: ShieldCheck, get: (r) => specsByCategory[r.category].ac },
    { key: "storage", label: "Shkaf va saqlash", icon: Bed, get: (r) => specsByCategory[r.category].storage },
    { key: "wifi", label: "Wi-Fi (500 Mbit/s)", icon: Wifi, get: (r) => specsByCategory[r.category].wifi },
    { key: "utilities", label: "Kommunal va kir yuvish", icon: WashingMachine, get: (r) => specsByCategory[r.category].utilities }
  ];

  const isRowDifferent = (row) =>
    new Set(sortedRooms.map((r) => row.get(r).label)).size > 1;

  const diffRows = rows.filter(isRowDifferent);
  const sameRows = rows.filter((row) => !isRowDifferent(row));

  const keyDifferences = [
    {
      room: sortedRooms.find((r) => r.category === "six") || sortedRooms[0],
      highlight: "Eng tejamkor variant",
      points: [
        "6 ta alohida bir qavatli karavot",
        "Eng katta xona maydoni (36 m²)",
        "Umumiy qavat sanuzeli va o‘quv zali"
      ]
    },
    {
      room: sortedRooms.find((r) => r.category === "four") || sortedRooms[1],
      highlight: "Narx va qulaylik balansi",
      points: [
        "2 ta ikki qavatli karavot (4 o‘rin)",
        "Xona ichida o‘qish stoli va javon",
        "Karavot ostida keng saqlash tortmalari"
      ]
    },
    {
      room: sortedRooms.find((r) => r.category === "two") || sortedRooms[2],
      highlight: "Maksimal shaxsiy qulaylik",
      points: [
        "Xona ichida shaxsiy sanuzel va dush",
        "2 ta shaxsiy o‘qish stoli va konditsioner",
        "Faqat 2 kishilik sokin muhit"
      ]
    }
  ];

  return (
    <div className="page-view-wrap section-wrap">
      <div className="section-header-centered">
        <span className="section-kicker">
          <Filter size={14} /> Taqqoslash
        </span>
        <h1 className="section-title">Xonalarni oson solishtiring</h1>
        <p className="section-subtitle">
          Arzondan qulayigacha — barcha xonalar narxi va sharoiti bitta ko‘rinishda.
        </p>
      </div>

      <div className="compare-shell">
        <div className="compare-simple-bar">
          <span className="compare-bar-hint">
            Narx bo‘yicha: <strong>800 000 → 1 100 000 so‘m</strong> • {diffRows.length} ta asosiy farq
          </span>
          <div className="compare-filter-tabs" role="group" aria-label="Ko‘rinish filtri">
            <button
              type="button"
              className={`compare-tab-btn ${!onlyDifferences ? "active" : ""}`}
              onClick={() => setOnlyDifferences(false)}
            >
              Barchasi ({rows.length})
            </button>
            <button
              type="button"
              className={`compare-tab-btn ${onlyDifferences ? "active" : ""}`}
              onClick={() => setOnlyDifferences(true)}
            >
              Faqat farqlar ({diffRows.length})
            </button>
          </div>
        </div>

        <div className="compare-scroll-shell">
          <div className="compare-board">
            <div className="compare-cards-grid">
              <div className="compare-corner-card">
                <span className="corner-kicker">
                  <Wallet size={14} /> Taqqoslash
                </span>
                <h3>O‘zingizga mos xonani tanlang</h3>
                <p>
                  Har bir xona narxiga 500 Mbit/s Wi-Fi, kunlik tozalash va bepul kir yuvish kiradi.
                </p>
                <div className="corner-stats">
                  <span>{sortedRooms.length} ta xona turi</span>
                  <span>•</span>
                  <span>24/7 Face ID</span>
                </div>
              </div>

              {sortedRooms.map((r) => {
                const isFeatured = r.badgeType === "recommended";
                return (
                  <article
                    key={r.id}
                    className={`compare-room-card ${isFeatured ? "is-featured" : ""}`}
                  >
                    <button
                      type="button"
                      className="compare-card-media"
                      onClick={() => openDetails && openDetails(r)}
                      title="Xona haqida batafsil"
                    >
                      <img src={r.image} alt={r.title} />
                      <span className={`compare-card-tag tag-${r.badgeType}`}>{r.tag}</span>
                      <span className="compare-card-cap">
                        <Users size={12} /> {r.people}
                      </span>
                    </button>

                    <div className="compare-card-body">
                      <h4>{r.title.replace(/^\d+\s*\/\s*/, "")}</h4>
                      <div className="compare-card-price-row">
                        <strong className="compare-card-price">{r.price}</strong>
                        <span>/ oy</span>
                      </div>
                      <div className="compare-card-spots">
                        <span className="spot-dot" /> {r.availableSpots} ta bo‘sh joy
                      </div>
                      <div className="compare-card-highlight">
                        <Sparkles size={12} />
                        <span>{specsByCategory[r.category].highlight}</span>
                      </div>
                      <div className="compare-card-actions">
                        <button
                          className="btn btn-primary btn-sm comp-book-btn"
                          onClick={() => openBooking(r)}
                        >
                          Band qilish
                        </button>
                        {openDetails && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm comp-detail-btn"
                            onClick={() => openDetails(r)}
                          >
                            Batafsil
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="compare-matrix-card">
              <div className="compare-group-banner is-diff">
                <Sparkles size={13} />
                <span>Xonalar orasidagi asosiy farqlar ({diffRows.length})</span>
              </div>

              {diffRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div className="compare-matrix-row is-diff-row" key={row.key}>
                    <div className="compare-matrix-label">
                      <span className="matrix-label-icon">
                        <Icon size={15} />
                      </span>
                      <span className="matrix-label-text">{row.label}</span>
                    </div>

                    {sortedRooms.map((r) => {
                      const val = row.get(r);
                      const isFeatured = r.badgeType === "recommended";
                      return (
                        <div
                          key={r.id}
                          className={`compare-matrix-cell ${isFeatured ? "is-featured" : ""}`}
                        >
                          <span className={`comp-tier-pill ${val.type}`}>
                            {val.type === "tier-best" && <Check size={13} />}
                            <span>{val.label}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {!onlyDifferences && sameRows.length > 0 && (
                <>
                  <div className="compare-group-banner is-same">
                    <CheckCircle2 size={13} />
                    <span>Barcha xonalarda bir xil sharoitlar ({sameRows.length})</span>
                  </div>

                  {sameRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <div className="compare-matrix-row is-same-row" key={row.key}>
                        <div className="compare-matrix-label">
                          <span className="matrix-label-icon is-muted">
                            <Icon size={15} />
                          </span>
                          <span className="matrix-label-text">{row.label}</span>
                        </div>

                        {sortedRooms.map((r) => {
                          const val = row.get(r);
                          const isFeatured = r.badgeType === "recommended";
                          return (
                            <div
                              key={r.id}
                              className={`compare-matrix-cell ${isFeatured ? "is-featured" : ""}`}
                            >
                              <span className="comp-cell-same">
                                <Check size={14} className="check-green" />
                                <span>{val.label}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        <section className="compare-diffs-section" aria-label="Asosiy farqlar">
          <div className="compare-diffs-head">
            <span className="section-kicker">
              <Sparkles size={13} /> Asosiy Farqlar
            </span>
            <h2>Xonalar nimasi bilan farq qiladi?</h2>
          </div>

          <div className="compare-diffs-grid">
            {keyDifferences.map(({ room, highlight, points }) => {
              const isFeatured = room.badgeType === "recommended";
              return (
                <article
                  key={room.id}
                  className={`compare-diff-card ${isFeatured ? "is-featured" : ""}`}
                >
                  <div className="diff-card-top">
                    <span className={`compare-card-tag tag-${room.badgeType}`}>{room.tag}</span>
                    <strong className="diff-card-price">{room.price}</strong>
                  </div>
                  <h3>{room.title.replace(/^\d+\s*\/\s*/, "")}</h3>
                  <p className="diff-card-subtitle">{highlight}</p>
                  <ul className="diff-points-list">
                    {points.map((pt) => (
                      <li key={pt}>
                        <Check size={14} className="check-green" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
