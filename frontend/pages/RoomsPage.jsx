import React, { useMemo } from "react";
import { ArrowRight, Bed, Check, Users } from "lucide-react";

export default function RoomsPage({
  rooms,
  dormRooms = [],
  announcements = [],
  roomFilter,
  setRoomFilter,
  openBooking,
  openDetails
}) {
  const filtered = useMemo(() => {
    if (roomFilter === "all") return rooms;
    return rooms.filter((r) => r.category === roomFilter);
  }, [rooms, roomFilter]);

  const pinnedAnnouncements = useMemo(
    () => announcements.filter((a) => a.pinned).slice(0, 2),
    [announcements]
  );

  return (
    <div className="page-view-wrap section-wrap">
      <div className="section-header-centered">
        <span className="section-kicker">
          <Bed size={14} /> Talabalar Turar Joyi
        </span>
        <h1 className="section-title">O‘zingizga mos xonani tanlang</h1>
        <p className="section-subtitle">
          Universitetda o‘qish va hordiq chiqarish uchun qulay, xavfsiz va to‘liq jihozlangan barcha toifadagi xonalar.
        </p>

        {pinnedAnnouncements.length > 0 && (
          <div className="public-ann-banner-list">
            {pinnedAnnouncements.map((ann) => (
              <div key={ann.id} className="public-ann-banner">
                <span className="public-ann-badge">{ann.category}</span>
                <strong>{ann.title}:</strong>
                <span>{ann.content}</span>
              </div>
            ))}
          </div>
        )}

        <div className="filter-pill-group">
          <button
            className={`btn-filter ${roomFilter === "all" ? "active" : ""}`}
            onClick={() => setRoomFilter("all")}
          >
            Barchasi ({rooms.length})
          </button>
          <button
            className={`btn-filter ${roomFilter === "two" ? "active" : ""}`}
            onClick={() => setRoomFilter("two")}
          >
            2 kishilik (1 100 000 so‘m)
          </button>
          <button
            className={`btn-filter ${roomFilter === "four" ? "active" : ""}`}
            onClick={() => setRoomFilter("four")}
          >
            4 kishilik (900 000 so‘m)
          </button>
          <button
            className={`btn-filter ${roomFilter === "six" ? "active" : ""}`}
            onClick={() => setRoomFilter("six")}
          >
            6 kishilik (800 000 so‘m)
          </button>
        </div>
      </div>

      <div className={`room-cards-grid ${filtered.length === 1 ? "is-single" : ""}`}>
        {filtered.map((room) => {
          const categoryDormRooms = dormRooms.filter((dr) => dr.roomCategory === room.category);
          return (
            <article
              className={`modern-room-card ${filtered.length === 1 ? "is-single" : ""}`}
              key={room.id}
            >
              <div className="room-card-media">
                <img src={room.image} alt={room.title} />
                <div className="room-card-badges">
                  <span className={`room-status-badge badge-${room.badgeType}`}>{room.tag}</span>
                  <span className="room-capacity-badge">
                    <Users size={13} /> {room.people}
                  </span>
                </div>
                <div className="room-quick-meta">
                  <span>{room.floor}</span>
                  <span>•</span>
                  <span>{room.size}</span>
                </div>
              </div>

              <div className="room-card-content">
                <div className="room-card-header">
                  <h3 className="room-title">{room.title}</h3>
                  <div className="room-price-box">
                    <strong className="price-amount">{room.price}</strong>
                    <span className="price-period">/ oy</span>
                  </div>
                </div>

                <p className="room-brief">{room.description}</p>

                <div className="room-features-chips">
                  {room.features.map((feat) => (
                    <span key={feat} className="feature-chip">
                      <Check size={12} /> {feat}
                    </span>
                  ))}
                </div>

                {categoryDormRooms.length > 0 && (
                  <div className="public-dorm-rooms-strip">
                    <small>Mavjud xona raqamlari (band qilish uchun bosing):</small>
                    <div className="public-dorm-room-chips">
                      {categoryDormRooms.map((dr) => {
                        const isFree = dr.status === "active" && dr.available > 0;
                        return (
                          <button
                            key={dr.id}
                            type="button"
                            disabled={!isFree}
                            className={`public-room-num-chip ${isFree ? "is-free" : dr.status === "maintenance" ? "is-maint" : "is-full"}`}
                            onClick={() => isFree && openBooking(room, dr.roomNumber)}
                            title={isFree ? `${dr.roomNumber}-xonani tanlab ariza yuborish` : `${dr.roomNumber}-xona band`}
                          >
                            <b>{dr.roomNumber}-xona</b>
                            <span>
                              {dr.status === "maintenance"
                                ? "Ta’mir"
                                : isFree
                                ? `${dr.available} bo‘sh`
                                : "To‘lgan"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="room-card-footer">
                  <div className="room-spots-indicator">
                    <span className="spot-dot" />
                    <span>{room.availableSpots} ta bo‘sh joy</span>
                  </div>
                  <div className="room-btn-group">
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetails(room)}>
                      Batafsil
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => openBooking(room)}>
                      Band qilish <ArrowRight size={14} className="btn-arrow" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
