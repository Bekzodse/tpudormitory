import React from "react";
import { Layers } from "lucide-react";

export default function DashboardFloorMap({ roomsByFloor, onInspectRoom }) {
  return (
    <section className="admin-panel-card">
      <div className="admin-panel-card-head">
        <h2><Layers size={18} /> Qavatlar va Xonalar Xaritasi (Xonani bosing)</h2>
        <div className="admin-map-legend">
          <span><i className="legend-dot is-free" /> Bo‘sh joy bor</span>
          <span><i className="legend-dot is-full" /> To‘lgan</span>
          <span><i className="legend-dot is-maint" /> Ta’mirlashda</span>
        </div>
      </div>

      <div className="admin-floors-stack">
        {roomsByFloor.map(([floor, list]) => {
          const freeInFloor = list.reduce((s, r) => s + (r.status === "active" ? r.available : 0), 0);
          return (
            <div className="admin-floor-block" key={floor}>
              <div className="admin-floor-label">
                <strong>{floor}-qavat ({list.length} ta xona)</strong>
                <span>{freeInFloor} ta bo‘sh o‘rin</span>
              </div>
              <div className="admin-floor-tiles">
                {list.map((dr) => {
                  const isMaint = dr.status === "maintenance";
                  const isFull = dr.occupied >= dr.capacity;
                  return (
                    <button
                      key={dr.id}
                      type="button"
                      className={`admin-room-tile ${isMaint ? "is-maint" : isFull ? "is-full" : ""}`}
                      onClick={() => onInspectRoom(dr.id)}
                    >
                      <div className="admin-room-tile-top">
                        <strong>{dr.roomNumber}-xona</strong>
                        <small>{isMaint ? "Ta’mir" : `${dr.occupied}/${dr.capacity}`}</small>
                      </div>
                      <div className="admin-bed-dots">
                        {Array.from({ length: dr.capacity }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`bed-dot ${isMaint ? "is-maint" : idx < dr.occupied ? "is-filled" : ""}`}
                          />
                        ))}
                      </div>
                      <div className="admin-room-tile-meta">
                        {isMaint ? "Vaqtincha yopiq" : dr.available > 0 ? `${dr.available} ta bo‘sh o‘rin` : "Barcha o‘rin band"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
