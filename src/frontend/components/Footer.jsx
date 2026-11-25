import React from "react";
import { CalendarDays, Clock, Instagram, MapPin, Phone, Send } from "lucide-react";
import TpuLogo from "../common/TpuLogo";

export default function Footer({ rooms = [], navigateTo, setRoomFilter, openBookingModal, showToast }) {
  return (
    <footer className="footer" id="contact-footer">
      <div className="footer-top section-wrap">
        <div className="footer-col footer-col-brand">
          <div className="brand footer-brand">
            <div className="brand-logo-badge">
              <TpuLogo size={26} />
            </div>
            <div className="brand-copy">
              <span className="brand-title">TPU <small>Smart Dormitory</small></span>
              <span className="brand-org">Tashkent Perfect University</span>
            </div>
          </div>
          <p className="footer-about-text">
            Tashkent Perfect University talabalar turar joyi — xavfsiz, qulay va zamonaviy talabalik hayoti uchun barcha qulayliklar bilan ta’minlangan aqlli majmua.
          </p>
          <div className="footer-social-links">
            <a href="https://t.me" target="_blank" rel="noreferrer" aria-label="Telegram kanali">
              <Send size={18} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram sahifasi">
              <Instagram size={18} />
            </a>
            <a href="tel:+998771292929" aria-label="Telefon">
              <Phone size={18} />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Tezkor havolalar</h4>
          <ul className="footer-links">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); navigateTo("#home"); }}>Bosh sahifa</a></li>
            <li><a href="#rooms" onClick={(e) => { e.preventDefault(); navigateTo("#rooms"); }}>Xonalar va Narxlar</a></li>
            <li><a href="#facilities" onClick={(e) => { e.preventDefault(); navigateTo("#facilities"); }}>Qulayliklar</a></li>
            <li><a href="#gallery" onClick={(e) => { e.preventDefault(); navigateTo("#gallery"); }}>Fotogalereya</a></li>
            <li><a href="#compare" onClick={(e) => { e.preventDefault(); navigateTo("#compare"); }}>Taqqoslash jadvali</a></li>
            <li><a href="#faq" onClick={(e) => { e.preventDefault(); navigateTo("#faq"); }}>Savol-Javoblar</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Xona turlari</h4>
          <ul className="footer-links">
            {rooms.map((r) => (
              <li key={r.id}>
                <a
                  href="#rooms"
                  onClick={(e) => {
                    e.preventDefault();
                    setRoomFilter(r.category);
                    navigateTo("#rooms");
                  }}
                >
                  {r.title.replace(/^\d+\s*\/\s*/, "")} ({r.price})
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col footer-col-contact">
          <h4 className="footer-col-title">Bog‘lanish</h4>
          <div className="footer-contact-item">
            <MapPin size={18} />
            <a href="https://yandex.uz/maps/-/CXc6ENYJ" target="_blank" rel="noreferrer">
              Tashkent Perfect University (Yandex Xarita)
            </a>
          </div>
          <div className="footer-contact-item">
            <Phone size={18} />
            <a href="tel:+998771292929">+998 77 129 29 29</a>
          </div>
          <div className="footer-contact-item">
            <Clock size={18} />
            <span>Dush - Shan: 09:00 - 18:00 (24/7 qabul)</span>
          </div>
          <button
            className="btn btn-primary btn-sm footer-book-btn"
            onClick={() => openBookingModal()}
          >
            <CalendarDays size={14} /> Xonani band qilish
          </button>
        </div>
      </div>

      <div className="footer-bottom section-wrap">
        <p>© 2026 Tashkent Perfect University. Barcha huquqlar himoyalangan.</p>
        <div className="footer-legal-links">
          <a href="#privacy" onClick={(e) => { e.preventDefault(); showToast("Maxfiylik siyosati tasdiqlangan"); }}>Maxfiylik siyosati</a>
          <span>•</span>
          <a href="#terms" onClick={(e) => { e.preventDefault(); showToast("Foydalanish shartlari tasdiqlangan"); }}>Foydalanish shartlari</a>
          <span>•</span>
          <a href="#rules" onClick={(e) => { e.preventDefault(); showToast("Yotoqxona ichki tartib qoidalari"); }}>Yotoqxona qoidalari</a>
        </div>
      </div>
    </footer>
  );
}
