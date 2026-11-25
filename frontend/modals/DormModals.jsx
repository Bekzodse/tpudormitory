import React, { useState } from "react";
import { Bed, CalendarDays, Check, ChevronRight, X } from "lucide-react";

export function RoomDetailsModal({ room, onClose, onOpenBooking }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const prevImage = () => setActiveImgIndex((i) => (i - 1 + room.gallery.length) % room.gallery.length);
  const nextImage = () => setActiveImgIndex((i) => (i + 1) % room.gallery.length);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="room-detail-modal modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Yopish">
          <X size={20} />
        </button>

        <div className="room-detail-gallery">
          <img
            src={room.gallery[activeImgIndex]}
            alt={`${room.title} - ko‘rinish ${activeImgIndex + 1}`}
            className="gallery-active-image"
          />

          <div className="gallery-top-indicators">
            <span className="gallery-badge">{room.tag}</span>
            <span className="gallery-counter">{activeImgIndex + 1} / {room.gallery.length}</span>
          </div>

          {room.gallery.length > 1 && (
            <>
              <button className="gallery-nav-btn prev" onClick={prevImage} aria-label="Oldingi rasm">
                <ChevronRight size={20} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button className="gallery-nav-btn next" onClick={nextImage} aria-label="Keyingi rasm">
                <ChevronRight size={20} />
              </button>

              <div className="gallery-thumbs-row">
                {room.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumb-btn ${idx === activeImgIndex ? "active" : ""}`}
                    onClick={() => setActiveImgIndex(idx)}
                  >
                    <img src={img} alt={`Kichik rasm ${idx + 1}`} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="room-detail-body">
          <div className="room-detail-header">
            <span className="section-kicker"><Bed size={14} /> {room.floor} • {room.size}</span>
            <h2 id="room-detail-title">{room.title}</h2>
            <div className="room-detail-price-tag">
              <strong>{room.price}</strong>
              <span>/ oyiga</span>
              <small className="all-inclusive-tag">Barcha kommunal to‘lovlar ichida</small>
            </div>
          </div>

          <p className="room-detail-desc">{room.description}</p>

          <div className="room-amenities-section">
            <h4>Xonada mavjud qulayliklar:</h4>
            <div className="amenities-check-grid">
              {room.amenities.map((item) => (
                <div key={item} className="amenity-item">
                  <Check size={16} className="check-green" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="room-specs-list">
            <div className="spec-row"><span className="spec-label">Sig‘im:</span><span className="spec-value">{room.people}</span></div>
            <div className="spec-row"><span className="spec-label">Sanuzel:</span><span className="spec-value">{room.bathroom}</span></div>
            <div className="spec-row"><span className="spec-label">Mavjud joylar:</span><span className="spec-value text-green">{room.availableSpots} ta bo‘sh joy</span></div>
          </div>

          <div className="room-detail-actions-row">
            <button
              className="btn btn-primary btn-lg btn-glow full-width"
              onClick={() => {
                onClose();
                onOpenBooking(room);
              }}
            >
              <CalendarDays size={18} /> Bu xonani band qilish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LightboxModal({ item, items, onClose, onSelect }) {
  const currentIndex = items.findIndex((i) => i.id === item.id);

  const prev = (e) => {
    e.stopPropagation();
    onSelect(items[(currentIndex - 1 + items.length) % items.length]);
  };

  const next = (e) => {
    e.stopPropagation();
    onSelect(items[(currentIndex + 1) % items.length]);
  };

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close-btn" onClick={onClose} aria-label="Yopish"><X size={24} /></button>
        <button className="lightbox-arrow prev" onClick={prev} aria-label="Oldingi rasm">
          <ChevronRight size={28} style={{ transform: "rotate(180deg)" }} />
        </button>
        <img src={item.image} alt={item.title} className="lightbox-image" />
        <button className="lightbox-arrow next" onClick={next} aria-label="Keyingi rasm">
          <ChevronRight size={28} />
        </button>
        <div className="lightbox-caption">
          <span className="caption-tag">{item.tag}</span>
          <h3>{item.title}</h3>
          <span className="caption-counter">{currentIndex + 1} / {items.length}</span>
        </div>
      </div>
    </div>
  );
}
