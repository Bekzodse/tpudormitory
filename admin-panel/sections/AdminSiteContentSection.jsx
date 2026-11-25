import React, { useEffect, useState } from "react";
import { Camera, Check, Globe, HelpCircle, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { readRoomImageFile, SectionTotalsBar } from "../utils/AdminHelpers";

export default function AdminSiteContentSection({
  overview,
  busyId,
  runAdminRequest,
  showToast
}) {
  const [subTab, setSubTab] = useState("homepage");

  const [homeDraft, setHomeDraft] = useState({
    eyebrowBadge: "TPU SMART ACCOMMODATION",
    eyebrowStatus: "Qabul davom etmoqda",
    titlePrefix: "Talabalar uchun yangi avlod",
    titleHighlight: "aqlli va qulay",
    titleSuffix: "yotoqxonasi",
    leadText: "",
    stats: [
      { value: "500+", label: "Talaba sig‘imi" },
      { value: "24/7", label: "Face ID xavfsizlik" },
      { value: "3 min", label: "Universitetgacha" },
      { value: "100%", label: "Kommunal ichida" }
    ],
    heroPhotos: [
      { id: "hero-2", title: "TPU Yotoqxona Asosiy Fasadi", image: "/images/campus-2.jpg", tag: "Bosh korpus" },
      { id: "hero-1", title: "Yotoqxona Kirish Qismi", image: "/images/campus-1.jpg", tag: "Kirish maydoni" },
      { id: "hero-3", title: "Kampus Xiyoboni va Yotoqxona", image: "/images/campus-3.jpg", tag: "Kampus" },
      { id: "hero-4", title: "Yotoqxona Hovlisi va Korpus", image: "/images/campus-4.jpg", tag: "Hovli" }
    ]
  });

  const [newFaq, setNewFaq] = useState({ q: "", a: "" });
  const [faqEdits, setFaqEdits] = useState({});
  const [editingFaqId, setEditingFaqId] = useState(null);

  useEffect(() => {
    if (overview.homepage) {
      setHomeDraft({
        eyebrowBadge: overview.homepage.eyebrowBadge || "TPU SMART ACCOMMODATION",
        eyebrowStatus: overview.homepage.eyebrowStatus || "Qabul davom etmoqda",
        titlePrefix: overview.homepage.titlePrefix || "",
        titleHighlight: overview.homepage.titleHighlight || "",
        titleSuffix: overview.homepage.titleSuffix || "",
        leadText: overview.homepage.leadText || "",
        stats: Array.isArray(overview.homepage.stats) && overview.homepage.stats.length > 0
          ? overview.homepage.stats
          : homeDraft.stats,
        heroPhotos: Array.isArray(overview.homepage.heroPhotos) && overview.homepage.heroPhotos.length > 0
          ? overview.homepage.heroPhotos
          : homeDraft.heroPhotos
      });
    }
  }, [overview.homepage]);

  const updateHeroPhoto = (idx, field, val) => {
    setHomeDraft((prev) => {
      const next = [...prev.heroPhotos];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, heroPhotos: next };
    });
  };

  const handleHeroFileUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readRoomImageFile(file);
      updateHeroPhoto(idx, "image", dataUrl);
      if (showToast) showToast(`${idx + 1}-rasm yuklandi — saqlash tugmasini bosing!`);
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    e.target.value = "";
  };

  const updateStat = (idx, field, val) => {
    setHomeDraft((prev) => {
      const next = [...prev.stats];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, stats: next };
    });
  };

  const handleSaveHomepage = async (e) => {
    e.preventDefault();
    await runAdminRequest({
      url: "/api/admin/homepage",
      method: "PUT",
      body: homeDraft,
      busyKey: "save-homepage",
      successMsg: "Bosh sahifa matnlari va rasmlari muvaffaqiyatli saqlandi!"
    });
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!newFaq.q.trim() || !newFaq.a.trim()) return;
    const ok = await runAdminRequest({
      url: "/api/admin/faqs",
      body: { q: newFaq.q, a: newFaq.a },
      busyKey: "add-faq",
      successMsg: "Yangi savol va javob saytga qo‘shildi!"
    });
    if (ok) setNewFaq({ q: "", a: "" });
  };

  const sampleImages = (overview.availableImages || []).slice(0, 10);

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Bosh sahifa rasmlari", value: `${homeDraft.heroPhotos.length} ta`, tone: "is-blue", sub: "Hero 4-foto kollaj" },
          { label: "Statistika bloklari", value: `${homeDraft.stats.length} ta`, tone: "is-green", sub: "Bosh sahifa raqamlari" },
          { label: "Savol-Javoblar (FAQ)", value: `${(overview.faqs || []).length} ta`, tone: "is-amber", sub: "Sayt #faq bo‘limida" }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          <button
            type="button"
            className={`compare-tab-btn ${subTab === "homepage" ? "active" : ""}`}
            onClick={() => setSubTab("homepage")}
          >
            <Globe size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Bosh sahifa matnlari va rasmlari
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${subTab === "faqs" ? "active" : ""}`}
            onClick={() => setSubTab("faqs")}
          >
            <HelpCircle size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Savol-Javoblar (FAQ) boshqaruvi ({(overview.faqs || []).length})
          </button>
        </div>
      </div>

      {subTab === "homepage" ? (
        <form onSubmit={handleSaveHomepage} className="admin-site-content-stack">
          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <div>
                <h2><Globe size={18} /> Bosh Sahifa Sarlavhasi va Matnlari</h2>
                <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                  Saytga kirganda chiqadigan asosiy shior, sarlavha, tavsif va 4 ta ko‘rsatkichni tahrirlang.
                </small>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busyId === "save-homepage"}>
                <Check size={14} /> {busyId === "save-homepage" ? "Saqlanmoqda..." : "Barcha o‘zgarishlarni saqlash"}
              </button>
            </div>

            <div className="admin-modal-form" style={{ marginTop: 8 }}>
              <label className="input-group">
                <span>Yuqori ko‘k yorliq (Badge)</span>
                <input
                  value={homeDraft.eyebrowBadge}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, eyebrowBadge: e.target.value }))}
                  placeholder="TPU SMART ACCOMMODATION"
                />
              </label>
              <label className="input-group">
                <span>Qabul holati yozuvi</span>
                <input
                  value={homeDraft.eyebrowStatus}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, eyebrowStatus: e.target.value }))}
                  placeholder="Qabul davom etmoqda"
                />
              </label>

              <label className="input-group">
                <span>Asosiy sarlavha boshlanishi</span>
                <input
                  value={homeDraft.titlePrefix}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, titlePrefix: e.target.value }))}
                  placeholder="Talabalar uchun yangi avlod"
                />
              </label>
              <label className="input-group">
                <span>Sarlavhadagi ko‘k ajratilgan so‘z</span>
                <input
                  value={homeDraft.titleHighlight}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, titleHighlight: e.target.value }))}
                  placeholder="aqlli va qulay"
                />
              </label>
              <label className="input-group is-full">
                <span>Sarlavha yakuni</span>
                <input
                  value={homeDraft.titleSuffix}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, titleSuffix: e.target.value }))}
                  placeholder="yotoqxonasi"
                />
              </label>

              <label className="input-group is-full">
                <span>Bosh sahifa asosiy tavsif matni (Lead)</span>
                <textarea
                  rows={3}
                  value={homeDraft.leadText}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, leadText: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ marginTop: 18 }}>
              <strong style={{ display: "block", fontSize: 13.5, color: "var(--blue-navy)", marginBottom: 10 }}>
                Bosh sahifadagi 4 ta raqamli ko‘rsatkich (Stats):
              </strong>
              <div className="admin-stats-edit-grid">
                {homeDraft.stats.map((st, idx) => (
                  <div className="admin-stat-edit-box" key={idx}>
                    <label className="input-group">
                      <span>{idx + 1}-ko‘rsatkich raqami</span>
                      <input
                        value={st.value}
                        onChange={(e) => updateStat(idx, "value", e.target.value)}
                        placeholder="500+"
                      />
                    </label>
                    <label className="input-group">
                      <span>Izohi</span>
                      <input
                        value={st.label}
                        onChange={(e) => updateStat(idx, "label", e.target.value)}
                        placeholder="Talaba sig‘imi"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <div>
                <h2><ImageIcon size={18} /> Bosh Sahifadagi 4 ta Asosiy Rasm (Hero Kollaj)</h2>
                <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                  Har bir rasm o‘rniga kompyuterdan yangi rasm yuklang yoki tayyor rasmlardan tanlang.
                </small>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busyId === "save-homepage"}>
                <Check size={14} /> Rasmlar va matnlarni saqlash
              </button>
            </div>

            <div className="admin-hero-photos-grid">
              {homeDraft.heroPhotos.map((photo, idx) => (
                <article className="admin-hero-photo-card" key={photo.id || idx}>
                  <div className="admin-room-type-media" style={{ height: 170 }}>
                    <img src={photo.image || "/images/campus-2.jpg"} alt={photo.title} />
                    <div className="admin-room-type-media-overlay">
                      <span className="admin-room-type-pill">{idx + 1}-rasm • {photo.tag}</span>
                      <label className="admin-img-upload-pill">
                        <Camera size={13} />
                        <span>Rasm yuklash</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleHeroFileUpload(idx, e)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-room-edit-stack">
                    <label className="input-group">
                      <span>Rasm nomi</span>
                      <input
                        value={photo.title}
                        onChange={(e) => updateHeroPhoto(idx, "title", e.target.value)}
                      />
                    </label>
                    <label className="input-group">
                      <span>Yorliq (Tag)</span>
                      <input
                        value={photo.tag}
                        onChange={(e) => updateHeroPhoto(idx, "tag", e.target.value)}
                      />
                    </label>
                    <div className="admin-image-picker-thumbs">
                      {sampleImages.map((imgUrl) => (
                        <button
                          key={imgUrl}
                          type="button"
                          className={`admin-picker-thumb ${photo.image === imgUrl ? "active" : ""}`}
                          onClick={() => updateHeroPhoto(idx, "image", imgUrl)}
                          title={imgUrl}
                        >
                          <img src={imgUrl} alt="Namuna" />
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </form>
      ) : (
        <>
          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <h2><Plus size={18} /> Yangi Savol va Javob Qo‘shish</h2>
            </div>
            <form onSubmit={handleAddFaq} className="admin-modal-form" style={{ marginTop: 4 }}>
              <label className="input-group is-full">
                <span>Savol matni *</span>
                <input
                  required
                  placeholder="Masalan: Yotoqxonada kir yuvish va oshxona bepulmi?"
                  value={newFaq.q}
                  onChange={(e) => setNewFaq((p) => ({ ...p, q: e.target.value }))}
                />
              </label>
              <label className="input-group is-full">
                <span>Javob matni *</span>
                <textarea
                  rows={3}
                  required
                  placeholder="Savolga batafsil va tushunarli javob yozing..."
                  value={newFaq.a}
                  onChange={(e) => setNewFaq((p) => ({ ...p, a: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busyId === "add-faq"}>
                <Plus size={14} /> {busyId === "add-faq" ? "Qo‘shilmoqda..." : "Savol-javobni qo‘shish"}
              </button>
            </form>
          </section>

          <div className="admin-bookings-list">
            {(overview.faqs || []).map((faq, idx) => {
              const isEditing = editingFaqId === faq.id;
              const draft = faqEdits[faq.id] || { q: faq.q, a: faq.a };
              return (
                <article className="admin-booking-card" key={faq.id}>
                  <div className="booking-card-top">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="admin-room-num-badge">#{idx + 1}</span>
                      <h3>{faq.q}</h3>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (isEditing) {
                            setEditingFaqId(null);
                          } else {
                            setFaqEdits((p) => ({ ...p, [faq.id]: { q: faq.q, a: faq.a } }));
                            setEditingFaqId(faq.id);
                          }
                        }}
                      >
                        <Pencil size={13} /> {isEditing ? "Bekor qilish" : "Tahrirlash"}
                      </button>
                      <button
                        type="button"
                        className="avatar-remove-btn"
                        disabled={busyId === `del-faq-${faq.id}`}
                        onClick={() =>
                          runAdminRequest({
                            url: `/api/admin/faqs/${faq.id}`,
                            method: "DELETE",
                            busyKey: `del-faq-${faq.id}`,
                            successMsg: "Savol-javob o‘chirildi."
                          })
                        }
                      >
                        <Trash2 size={13} /> O‘chirish
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="admin-modal-form" style={{ marginTop: 10 }}>
                      <label className="input-group is-full">
                        <span>Savol *</span>
                        <input
                          value={draft.q}
                          onChange={(e) =>
                            setFaqEdits((p) => ({ ...p, [faq.id]: { ...draft, q: e.target.value } }))
                          }
                        />
                      </label>
                      <label className="input-group is-full">
                        <span>Javob *</span>
                        <textarea
                          rows={3}
                          value={draft.a}
                          onChange={(e) =>
                            setFaqEdits((p) => ({ ...p, [faq.id]: { ...draft, a: e.target.value } }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === `save-faq-${faq.id}`}
                        onClick={async () => {
                          const ok = await runAdminRequest({
                            url: `/api/admin/faqs/${faq.id}`,
                            method: "PATCH",
                            body: draft,
                            busyKey: `save-faq-${faq.id}`,
                            successMsg: "Savol-javob yangilandi!"
                          });
                          if (ok) setEditingFaqId(null);
                        }}
                      >
                        <Check size={14} /> Saqlash
                      </button>
                    </div>
                  ) : (
                    <p className="admin-msg-body" style={{ marginTop: 6 }}>{faq.a}</p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
