import React from "react";
import { ArrowRight, Check, Clock, MapPin, Phone, Send, ShieldCheck } from "lucide-react";

export default function ContactPage({
  contactForm,
  setContactForm,
  contactSubmitted,
  setContactSubmitted,
  handleSubmit
}) {
  return (
    <div className="page-view-wrap section-wrap">
      <div className="section-header-centered">
        <span className="section-kicker">
          <Send size={14} /> Aloqa va Manzil
        </span>
        <h1 className="section-title">Biz bilan bog‘laning</h1>
        <p className="section-subtitle">
          Savollaringiz, murojaatlaringiz yoki takliflaringiz bo‘lsa, bizga yozing. Tez orada javob qaytaramiz.
        </p>
      </div>

      <div className="contact-layout-grid">
        <div className="contact-form-card">
          {contactSubmitted ? (
            <div className="contact-success-state">
              <span className="success-check-bubble">
                <Check size={30} />
              </span>
              <h3>Xabaringiz muvaffaqiyatli yuborildi!</h3>
              <p>Rahmat, administratorimiz tez orada siz bilan bog‘lanadi.</p>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setContactSubmitted(false);
                  setContactForm({ firstName: "", lastName: "", phone: "", subject: "Yotoqxona bo‘yicha savol", message: "" });
                }}
              >
                Yana xabar yuborish
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-real-form">
              <div className="contact-form-head">
                <div>
                  <h2>Xabar yoki ariza yuborish</h2>
                  <p>Administratorimiz 15 daqiqa ichida siz bilan bog‘lanadi.</p>
                </div>
                <span className="contact-fast-badge">
                  <Clock size={13} /> Tezkor javob
                </span>
              </div>

              <div className="contact-fields-row">
                <label className="input-group">
                  <span>Ismingiz *</span>
                  <input
                    required
                    type="text"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    placeholder="Ali"
                  />
                </label>
                <label className="input-group">
                  <span>Familiyangiz *</span>
                  <input
                    required
                    type="text"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    placeholder="Valiyev"
                  />
                </label>
              </div>

              <div className="contact-fields-row">
                <label className="input-group">
                  <span>Telefon raqamingiz *</span>
                  <input
                    required
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                  />
                </label>

                <label className="input-group">
                  <span>Murojaat mavzusi</span>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  >
                    <option value="Yotoqxona bo‘yicha savol">Yotoqxona bo‘yicha umumiy savol</option>
                    <option value="Bron qilish va to‘lov">Bron qilish va to‘lov tartibi</option>
                    <option value="Universitetga qabul va turar joy">Qabul va talabalik yotoqxonasi</option>
                    <option value="Taklif yoki shikoyat">Taklif yoki mulohaza</option>
                  </select>
                </label>
              </div>

              <label className="input-group contact-message-group">
                <span>Xabaringiz *</span>
                <textarea
                  required
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Savolingiz yoki murojaatingizni batafsil yozing..."
                />
              </label>

              <div className="contact-form-footer">
                <button type="submit" className="btn btn-primary btn-lg contact-send-btn">
                  <Send size={16} />
                  <span>Xabar yuborish</span>
                </button>
                <small className="contact-privacy-note">
                  <ShieldCheck size={14} /> Ma’lumotlaringiz maxfiy saqlanadi va faqat aloqa uchun ishlatiladi.
                </small>
              </div>
            </form>
          )}
        </div>

        <div className="contact-sidebar-card">
          <div className="contact-map-card">
            <div className="contact-map-preview">
              <iframe
                src="https://yandex.uz/map-widget/v1/org/perfect_university/216103046791/?z=16"
                title="Tashkent Perfect University — Yandex Xarita"
                className="contact-map-iframe"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="contact-map-footer">
              <div className="map-footer-meta">
                <b>Tashkent Perfect University</b>
                <small>Chorsu / G‘afur G‘ulom metro yaqinida</small>
              </div>
              <a
                href="https://yandex.uz/maps/-/CXc6ENYJ"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm map-footer-btn"
              >
                Yo‘nalish <ArrowRight size={13} />
              </a>
            </div>
          </div>

          <div className="contact-info-list">
            <a
              href="https://yandex.uz/maps/-/CXc6ENYJ"
              target="_blank"
              rel="noreferrer"
              className="contact-info-block is-link"
            >
              <span className="contact-info-icon-box">
                <MapPin size={18} />
              </span>
              <div>
                <b>Manzilimiz</b>
                <p>Tashkent Perfect University (Chorsu / G‘afur G‘ulom metro yaqinida)</p>
                <small>Yandex Xaritada yo‘nalish olish uchun bosing</small>
              </div>
            </a>

            <a href="tel:+998771292929" className="contact-info-block is-link">
              <span className="contact-info-icon-box">
                <Phone size={18} />
              </span>
              <div>
                <b>Telefon</b>
                <p>+998 77 129 29 29</p>
                <small>24/7 qabul bo‘limi</small>
              </div>
            </a>

            <div className="contact-info-block">
              <span className="contact-info-icon-box">
                <Clock size={18} />
              </span>
              <div>
                <b>Ish vaqti</b>
                <p>Dushanba – Shanba: 09:00 – 18:00</p>
                <small>Navbatchilik va yotoqxona xizmati — 24/7</small>
              </div>
            </div>

            <a href="https://t.me" target="_blank" rel="noreferrer" className="contact-info-block is-link">
              <span className="contact-info-icon-box">
                <Send size={18} />
              </span>
              <div>
                <b>Telegram bot & kanal</b>
                <p>@tpu_dormitory_bot</p>
                <small>Tezkor onlayn konsultatsiya</small>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
