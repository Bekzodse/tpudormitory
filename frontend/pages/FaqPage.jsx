import React from "react";
import { CalendarDays, ChevronDown, ChevronUp, HelpCircle, Phone } from "lucide-react";

export default function FaqPage({ faqs, faqOpenIndex, setFaqOpenIndex, openBooking }) {
  return (
    <div className="page-view-wrap section-wrap">
      <div className="section-header-centered">
        <span className="section-kicker">
          <HelpCircle size={14} /> Ma’lumotlar Markazi
        </span>
        <h1 className="section-title">Ko‘p Beriladigan Savollar</h1>
        <p className="section-subtitle">
          Yotoqxonaga joylashish, shartlar, to‘lovlar va tartib-qoidalar haqida batafsil javoblar.
        </p>
      </div>

      <div className="faq-accordion max-w-850">
        {faqs.map((faq, index) => {
          const isOpen = faqOpenIndex === index;
          return (
            <div key={index} className={`faq-item ${isOpen ? "faq-open" : ""}`}>
              <button
                className="faq-question-btn"
                onClick={() => setFaqOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
              >
                <span className="faq-question-text">{faq.q}</span>
                <span className="faq-icon-arrow">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
              {isOpen && (
                <div className="faq-answer-pane">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="page-bottom-cta">
        <h3>Savolingizga javob topa olmadingizmi?</h3>
        <p>Qo‘llab-quvvatlash xizmatimiz 24/7 sizga yordam berishga tayyor.</p>
        <div className="faq-footer-btns">
          <a href="tel:+998771292929" className="btn btn-secondary">
            <Phone size={16} /> +998 77 129 29 29
          </a>
          <button className="btn btn-primary" onClick={() => openBooking()}>
            <CalendarDays size={16} /> Xonani band qilish
          </button>
        </div>
      </div>
    </div>
  );
}
