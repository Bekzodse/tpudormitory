import React from "react";
import {
  ArrowRight, Bed, BookOpen, Building2, CalendarDays, CheckCircle2,
  Dumbbell, MapPin, Search, ShieldCheck, Sparkles, Utensils,
  Wallet, WashingMachine, Wifi
} from "lucide-react";
import { heroCampusPhotos } from "../data/dormData";

export default function HomePage({
  rooms = [],
  openBookingModal,
  navigateTo,
  heroSearchType,
  setHeroSearchType,
  heroSearchBudget,
  setHeroSearchBudget,
  setRoomFilter,
  setLightboxImage
}) {
  return (
    <>
      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="eyebrow-badge">
              <Sparkles size={14} /> TPU SMART ACCOMMODATION
            </span>
            <span className="eyebrow-status">
              <span className="status-dot" /> Qabul davom etmoqda
            </span>
          </div>

          <h1 className="hero-title">
            Talabalar uchun yangi avlod <span className="text-gradient-blue">aqlli va qulay</span> yotoqxonasi
          </h1>

          <p className="hero-lead">
            Tashkent Perfect University talabalari uchun yaratilgan xavfsiz, zamonaviy va hamyonbop turar joy.
            Barcha kommunal to‘lovlar, 500 Mbit/s Wi-Fi, 24/7 Face ID xavfsizlik va sokin o‘qish zallari siz uchun muhayyo.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg btn-glow"
              onClick={() => openBookingModal()}
            >
              <CalendarDays size={18} />
              <span>Xonani band qilish</span>
              <ArrowRight size={17} className="btn-arrow" />
            </button>

            <a
              className="btn btn-outline btn-lg"
              href="#rooms"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("#rooms");
              }}
            >
              <Bed size={18} />
              <span>Xonalarni ko‘rish</span>
            </a>

            <a
              className="btn btn-secondary btn-lg"
              href="#gallery"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("#gallery");
              }}
            >
              <Building2 size={18} />
              <span>Kampus galereyasi</span>
            </a>
          </div>

          <div className="hero-search-card">
            <div className="search-field">
              <label>
                <Bed size={14} /> Xona turi
              </label>
              <select
                value={heroSearchType}
                onChange={(e) => setHeroSearchType(e.target.value)}
              >
                <option value="all">Barcha xonalar ({rooms.length} tur)</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.category}>
                    {r.title.replace(/^\d+\s*\/\s*/, "")} ({r.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="search-field">
              <label>
                <Wallet size={14} /> Byudjet / Oylik
              </label>
              <select
                value={heroSearchBudget}
                onChange={(e) => setHeroSearchBudget(e.target.value)}
              >
                <option value="all">Barcha narxlar</option>
                {[...rooms]
                  .sort((a, b) => (a.priceNum || 0) - (b.priceNum || 0))
                  .map((r) => (
                    <option key={r.id} value={r.category}>
                      {r.price} / oy
                    </option>
                  ))}
              </select>
            </div>

            <button
              className="btn btn-primary search-submit-btn"
              onClick={() => {
                if (heroSearchType !== "all") {
                  setRoomFilter(heroSearchType);
                } else if (heroSearchBudget !== "all") {
                  setRoomFilter(heroSearchBudget);
                } else {
                  setRoomFilter("all");
                }
                navigateTo("#rooms");
              }}
            >
              <Search size={16} />
              <span>Qidirish</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <strong>500+</strong>
              <small>Talaba sig‘imi</small>
            </div>
            <div className="hero-stat-item">
              <strong>24/7</strong>
              <small>Face ID xavfsizlik</small>
            </div>
            <div className="hero-stat-item">
              <strong>3 min</strong>
              <small>Universitetgacha</small>
            </div>
            <div className="hero-stat-item">
              <strong>100%</strong>
              <small>Kommunal ichida</small>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-collage-frame">
            <div className="hero-collage-row-top">
              {heroCampusPhotos.slice(0, 2).map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className="hero-collage-item"
                  onClick={() => setLightboxImage(photo)}
                  aria-label={`${photo.title} rasmini kattalashtirish`}
                >
                  <img src={photo.image} alt={photo.title} />
                </button>
              ))}
            </div>

            <div className="hero-collage-row-bottom">
              {heroCampusPhotos.slice(2, 4).map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className="hero-collage-item"
                  onClick={() => setLightboxImage(photo)}
                  aria-label={`${photo.title} rasmini kattalashtirish`}
                >
                  <img src={photo.image} alt={photo.title} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="marquee-section" aria-label="Afzalliklar satri">
        <div className="marquee-track">
          <div className="marquee-content">
            <span className="marquee-item"><CheckCircle2 size={16} /> Barcha to‘lovlar narx ichida</span>
            <span className="marquee-item"><Wifi size={16} /> 500 Mbit/s Tezkor Wi-Fi</span>
            <span className="marquee-item"><ShieldCheck size={16} /> 24/7 Smart Face ID</span>
            <span className="marquee-item"><WashingMachine size={16} /> Bepul kir yuvish majmuasi</span>
            <span className="marquee-item"><BookOpen size={16} /> Sokin kutubxona va kovorking</span>
            <span className="marquee-item"><Dumbbell size={16} /> Fitness zali & Street Workout</span>
            <span className="marquee-item"><Utensils size={16} /> Har bir qavatda oshxona</span>
            <span className="marquee-item"><MapPin size={16} /> Universitetgacha 3 daqiqa</span>
          </div>
          <div className="marquee-content" aria-hidden="true">
            <span className="marquee-item"><CheckCircle2 size={16} /> Barcha to‘lovlar narx ichida</span>
            <span className="marquee-item"><Wifi size={16} /> 500 Mbit/s Tezkor Wi-Fi</span>
            <span className="marquee-item"><ShieldCheck size={16} /> 24/7 Smart Face ID</span>
            <span className="marquee-item"><WashingMachine size={16} /> Bepul kir yuvish majmuasi</span>
            <span className="marquee-item"><BookOpen size={16} /> Sokin kutubxona va kovorking</span>
            <span className="marquee-item"><Dumbbell size={16} /> Fitness zali & Street Workout</span>
            <span className="marquee-item"><Utensils size={16} /> Har bir qavatda oshxona</span>
            <span className="marquee-item"><MapPin size={16} /> Universitetgacha 3 daqiqa</span>
          </div>
        </div>
      </section>
    </>
  );
}
