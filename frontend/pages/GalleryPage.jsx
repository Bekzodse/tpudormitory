import React from "react";
import { Sparkles } from "lucide-react";
import { galleryItems } from "../data/dormData";

export default function GalleryPage({ items, totalCount, category, setCategory, openLightbox }) {
  return (
    <div className="page-view-wrap section-wrap">
      <div className="section-header-centered">
        <span className="section-kicker">
          <Sparkles size={14} /> Barcha Fotolar
        </span>
        <h1 className="section-title">Kampus va Yotoqxona Fotogalereyasi</h1>
        <p className="section-subtitle">
          Xonalar, oshxonalar, kutubxona va talabalar shaharchasining haqiqiy suratlari.
        </p>

        <div className="filter-pill-group">
          <button
            className={`btn-filter ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            Barchasi ({totalCount ?? galleryItems.length})
          </button>
          <button
            className={`btn-filter ${category === "rooms" ? "active" : ""}`}
            onClick={() => setCategory("rooms")}
          >
            Xonalar
          </button>
          <button
            className={`btn-filter ${category === "study" ? "active" : ""}`}
            onClick={() => setCategory("study")}
          >
            Kutubxona
          </button>
          <button
            className={`btn-filter ${category === "dining" ? "active" : ""}`}
            onClick={() => setCategory("dining")}
          >
            Oshxona
          </button>
          <button
            className={`btn-filter ${category === "sports" ? "active" : ""}`}
            onClick={() => setCategory("sports")}
          >
            Sport
          </button>
          <button
            className={`btn-filter ${category === "campus" ? "active" : ""}`}
            onClick={() => setCategory("campus")}
          >
            Kampus
          </button>
        </div>
      </div>

      <div className="gallery-grid full-gallery-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className="gallery-item-card"
            onClick={() => openLightbox(item)}
            role="button"
            tabIndex={0}
            aria-label={`${item.title} fotosuratini ko‘rish`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openLightbox(item);
            }}
          >
            <img src={item.image} alt={item.title} loading="lazy" />
            <div className="gallery-item-overlay">
              <span className="gallery-tag">{item.tag}</span>
              <h4>{item.title}</h4>
              <span className="gallery-zoom-cue">
                <Sparkles size={14} /> Kattalashtirish
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
