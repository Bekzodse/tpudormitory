import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Check,
  FolderPlus,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  MessageSquarePlus,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";
import { readRoomImageFile, SectionTotalsBar } from "../utils/AdminHelpers";

export default function AdminSiteContentSection({
  overview,
  busyId,
  runAdminRequest,
  showToast,
  initialTab = "gallery"
}) {
  const [subTab, setSubTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setSubTab(initialTab);
  }, [initialTab]);

  const categories = useMemo(
    () =>
      Array.isArray(overview.galleryCategories) && overview.galleryCategories.length > 0
        ? overview.galleryCategories
        : [
            { id: 1, slug: "rooms", name: "Xonalar", description: "Yotoqxona xonalari", photoCount: 4 },
            { id: 2, slug: "study", name: "Kutubxona", description: "Kutubxona va kovorking", photoCount: 3 },
            { id: 3, slug: "dining", name: "Oshxona", description: "Oshxona va ovqatlanish", photoCount: 3 },
            { id: 4, slug: "sports", name: "Sport", description: "Sport maydonchalari", photoCount: 3 },
            { id: 5, slug: "campus", name: "Kampus", description: "Kampus va bino", photoCount: 7 }
          ],
    [overview.galleryCategories]
  );

  // 1. Gallery Category creation & editing state
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingCatId, setEditingCatId] = useState(null);
  const [catEdits, setCatEdits] = useState({});

  // 2. Gallery Photo addition & editing state
  const [galleryFilterCat, setGalleryFilterCat] = useState("all");
  const [photoForm, setPhotoForm] = useState({
    title: "",
    category: "rooms",
    newCategoryName: "",
    tag: "Yotoqxona",
    description: "",
    imageData: "",
    imageUrl: "/images/room3.jpeg"
  });
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [photoEdits, setPhotoEdits] = useState({});

  // 3. Bottom Texts ("Pastdagi gaplar") state
  const [bottomTextForm, setBottomTextForm] = useState({
    section: "gallery",
    title: "",
    content: "",
    badge: "Ma’lumot"
  });
  const [editingBottomId, setEditingBottomId] = useState(null);
  const [bottomEdits, setBottomEdits] = useState({});

  // 4. Homepage & Footer settings state
  const [homeDraft, setHomeDraft] = useState({
    eyebrowBadge: "TPU SMART ACCOMMODATION",
    eyebrowStatus: "Qabul davom etmoqda",
    titlePrefix: "Talabalar uchun yangi avlod",
    titleHighlight: "aqlli va qulay",
    titleSuffix: "yotoqxonasi",
    leadText: "",
    galleryTitle: "Kampus va Yotoqxona Fotogalereyasi",
    gallerySubtitle: "Xonalar, oshxonalar, kutubxona va talabalar shaharchasining haqiqiy suratlari hamda har bir bo‘lim bo‘yicha batafsil ma’lumotlar.",
    footerAbout: "Tashkent Perfect University talabalar turar joyi — xavfsiz, qulay va zamonaviy talabalik hayoti uchun barcha qulayliklar bilan ta’minlangan aqlli majmua.",
    footerCopyright: "© 2026 Tashkent Perfect University. Barcha huquqlar himoyalangan.",
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

  // 5. FAQ state
  const [newFaq, setNewFaq] = useState({ q: "", a: "" });
  const [faqEdits, setFaqEdits] = useState({});
  const [editingFaqId, setEditingFaqId] = useState(null);

  useEffect(() => {
    if (overview.homepage) {
      setHomeDraft((prev) => ({
        eyebrowBadge: overview.homepage.eyebrowBadge || "TPU SMART ACCOMMODATION",
        eyebrowStatus: overview.homepage.eyebrowStatus || "Qabul davom etmoqda",
        titlePrefix: overview.homepage.titlePrefix || "",
        titleHighlight: overview.homepage.titleHighlight || "",
        titleSuffix: overview.homepage.titleSuffix || "",
        leadText: overview.homepage.leadText || "",
        galleryTitle: overview.homepage.galleryTitle || prev.galleryTitle,
        gallerySubtitle: overview.homepage.gallerySubtitle || prev.gallerySubtitle,
        footerAbout: overview.homepage.footerAbout || prev.footerAbout,
        footerCopyright: overview.homepage.footerCopyright || prev.footerCopyright,
        stats:
          Array.isArray(overview.homepage.stats) && overview.homepage.stats.length > 0
            ? overview.homepage.stats
            : prev.stats,
        heroPhotos:
          Array.isArray(overview.homepage.heroPhotos) && overview.homepage.heroPhotos.length > 0
            ? overview.homepage.heroPhotos
            : prev.heroPhotos
      }));
    }
  }, [overview.homepage]);

  const filteredGalleryPhotos = useMemo(() => {
    const list = overview.gallery || [];
    if (galleryFilterCat === "all") return list;
    return list.filter((item) => item.category === galleryFilterCat);
  }, [overview.gallery, galleryFilterCat]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    const res = await runAdminRequest({
      url: "/api/admin/gallery-categories",
      body: newCategory,
      busyKey: "add-gal-cat",
      successMsg: `"${newCategory.name}" bo‘limi yaratildi va bazaga saqlandi!`
    });
    if (res) {
      setNewCategory({ name: "", description: "" });
    }
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readRoomImageFile(file);
      setPhotoForm((prev) => ({ ...prev, imageData: dataUrl }));
      if (showToast) showToast("Rasm fayli tanlandi!");
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    e.target.value = "";
  };

  const handleEditPhotoFileChange = async (photoId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readRoomImageFile(file);
      setPhotoEdits((prev) => ({
        ...prev,
        [photoId]: { ...(prev[photoId] || {}), imageData: dataUrl, imageUrl: dataUrl }
      }));
      if (showToast) showToast("Yangi rasm tanlandi — Saqlash tugmasini bosing!");
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    e.target.value = "";
  };

  const handleAddGalleryPhoto = async (e) => {
    e.preventDefault();
    if (!photoForm.title.trim()) return;
    const res = await runAdminRequest({
      url: "/api/admin/gallery",
      body: {
        title: photoForm.title,
        category: photoForm.category === "__new__" ? "rooms" : photoForm.category,
        newCategoryName: photoForm.category === "__new__" ? photoForm.newCategoryName : "",
        tag: photoForm.tag,
        description: photoForm.description,
        imageData: photoForm.imageData || undefined,
        imageUrl: photoForm.imageData ? undefined : photoForm.imageUrl
      },
      busyKey: "add-gallery-photo",
      successMsg: "Rasm va pastki gap fotogalereyaga qo‘shildi!"
    });
    if (res) {
      setPhotoForm((prev) => ({
        ...prev,
        title: "",
        newCategoryName: "",
        description: "",
        imageData: ""
      }));
    }
  };

  const handleAddBottomText = async (e) => {
    e.preventDefault();
    if (!bottomTextForm.title.trim()) return;
    const ok = await runAdminRequest({
      url: "/api/admin/bottom-texts",
      body: bottomTextForm,
      busyKey: "add-bottom-text",
      successMsg: "Pastki gap bazaga saqlandi va saytga qo‘shildi!"
    });
    if (ok) {
      setBottomTextForm((prev) => ({ ...prev, title: "", content: "" }));
    }
  };

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
      successMsg: "Bosh sahifa, galereya sarlavhasi va pastki footer gaplari saqlandi!"
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

  const sampleImages = (overview.availableImages || []).slice(0, 12);
  const bottomTextsList = overview.bottomTexts || [];
  const galleryBottomTexts = bottomTextsList.filter((b) => b.section === "gallery");
  const homepageBottomTexts = bottomTextsList.filter((b) => b.section === "homepage");

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Fotogalereya bo‘limlari", value: `${categories.length} ta`, tone: "is-blue", sub: "Dinamik kategoriyalar" },
          { label: "Galereya rasmlari", value: `${(overview.gallery || []).length} ta`, tone: "is-green", sub: "Har birida pastki gap bilan" },
          { label: "Pastdagi gaplar", value: `${bottomTextsList.length} ta`, tone: "is-amber", sub: "Galereya va Bosh sahifa" },
          { label: "Savol-Javoblar (FAQ)", value: `${(overview.faqs || []).length} ta`, sub: "Sayt #faq bo‘limida" }
        ]}
      />

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills">
          <button
            type="button"
            className={`compare-tab-btn ${subTab === "gallery" ? "active" : ""}`}
            onClick={() => setSubTab("gallery")}
          >
            <ImageIcon size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Fotogalereya, Bo‘limlar va Rasmlar ({(overview.gallery || []).length})
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${subTab === "bottomTexts" ? "active" : ""}`}
            onClick={() => setSubTab("bottomTexts")}
          >
            <MessageSquarePlus size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Pastdagi Gaplar ({bottomTextsList.length})
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${subTab === "homepage" ? "active" : ""}`}
            onClick={() => setSubTab("homepage")}
          >
            <Globe size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Bosh sahifa, Hero rasmlar va Footer
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${subTab === "faqs" ? "active" : ""}`}
            onClick={() => setSubTab("faqs")}
          >
            <HelpCircle size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Savol-Javoblar (FAQ) ({(overview.faqs || []).length})
          </button>
        </div>
      </div>

      {subTab === "gallery" && (
        <div className="admin-site-content-stack">
          {/* 1. CREATE & MANAGE GALLERY CATEGORIES (BO'LIMLAR) */}
          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <div>
                <h2><FolderPlus size={18} /> Fotogalereya Bo‘limlari (Yangi bo‘lim yaratish va boshqarish)</h2>
                <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                  Fotogalereyada yangi bo‘lim (masalan: «Dam olish zali», «Tadbirlar», «1-qavat») yarating va uning pastki tavsif gapini kiriting.
                </small>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="admin-inline-room-form" style={{ marginBottom: 16 }}>
              <label className="input-group">
                <span>Yangi bo‘lim nomi *</span>
                <input
                  required
                  placeholder="Masalan: Dam olish hududi"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label className="input-group" style={{ gridColumn: "span 2" }}>
                <span>Bo‘lim pastidagi izoh / gap (ixtiyoriy)</span>
                <input
                  placeholder="Masalan: Talabalar darsdan bo‘sh vaqtida dam olishi va suhbatlashishi uchun shinam hudud."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <div className="admin-inline-room-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={busyId === "add-gal-cat"}>
                  <Plus size={14} /> {busyId === "add-gal-cat" ? "Yaratilmoqda..." : "Yangi bo‘lim yaratish"}
                </button>
              </div>
            </form>

            <div className="admin-gallery-categories-grid">
              {categories.map((cat) => {
                const isEditingCat = editingCatId === cat.id;
                const catDraft = catEdits[cat.id] || { name: cat.name, description: cat.description || "" };
                return (
                  <div className="admin-gallery-cat-card" key={cat.id || cat.slug}>
                    <div className="admin-gallery-cat-head">
                      <div>
                        <strong>{cat.name}</strong>
                        <span className="admin-room-num-badge" style={{ marginLeft: 8 }}>{cat.photoCount || 0} ta rasm</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (isEditingCat) {
                              setEditingCatId(null);
                            } else {
                              setCatEdits((p) => ({ ...p, [cat.id]: { name: cat.name, description: cat.description || "" } }));
                              setEditingCatId(cat.id);
                            }
                          }}
                        >
                          <Pencil size={12} /> {isEditingCat ? "Yopish" : "Tahrirlash"}
                        </button>
                        {categories.length > 1 && (
                          <button
                            type="button"
                            className="avatar-remove-btn"
                            disabled={busyId === `del-cat-${cat.id}`}
                            onClick={() =>
                              runAdminRequest({
                                url: `/api/admin/gallery-categories/${cat.id}`,
                                method: "DELETE",
                                busyKey: `del-cat-${cat.id}`,
                                successMsg: `"${cat.name}" bo‘limi o‘chirildi.`
                              })
                            }
                            title="Bo‘limni o‘chirish"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditingCat ? (
                      <div className="admin-room-edit-stack" style={{ marginTop: 10 }}>
                        <label className="input-group">
                          <span>Bo‘lim nomi *</span>
                          <input
                            value={catDraft.name}
                            onChange={(e) =>
                              setCatEdits((p) => ({ ...p, [cat.id]: { ...catDraft, name: e.target.value } }))
                            }
                          />
                        </label>
                        <label className="input-group">
                          <span>Bo‘lim pastidagi gap / izoh</span>
                          <input
                            value={catDraft.description}
                            onChange={(e) =>
                              setCatEdits((p) => ({ ...p, [cat.id]: { ...catDraft, description: e.target.value } }))
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busyId === `save-cat-${cat.id}`}
                          onClick={async () => {
                            const ok = await runAdminRequest({
                              url: `/api/admin/gallery-categories/${cat.id}`,
                              method: "PATCH",
                              body: catDraft,
                              busyKey: `save-cat-${cat.id}`,
                              successMsg: "Bo‘lim yangilandi!"
                            });
                            if (ok) setEditingCatId(null);
                          }}
                        >
                          <Check size={13} /> Saqlash
                        </button>
                      </div>
                    ) : (
                      <p className="admin-gallery-cat-desc">
                        {cat.description || "Ushbu bo‘lim uchun izoh kiritilmagan."}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. ADD PHOTO + BOTTOM TEXT TO ANY GALLERY CATEGORY */}
          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <div>
                <h2><Plus size={18} /> Fotogalereya Bo‘limiga Rasm va Pastki Gap Qo‘shish</h2>
                <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                  Kerakli bo‘limni tanlang (yoki yangi bo‘lim yarating), rasmni yuklang hamda rasm pastida chiqadigan gap va sarlavhani kiriting.
                </small>
              </div>
            </div>

            <form onSubmit={handleAddGalleryPhoto} className="admin-modal-form" style={{ marginTop: 6 }}>
              <label className="input-group">
                <span>Qaysi bo‘limga qo‘shilsin? *</span>
                <select
                  value={photoForm.category}
                  onChange={(e) => setPhotoForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.photoCount || 0} ta rasm)
                    </option>
                  ))}
                  <option value="__new__">+ Yangi bo‘lim yaratib qo‘shish...</option>
                </select>
              </label>

              {photoForm.category === "__new__" && (
                <label className="input-group">
                  <span>Yangi bo‘lim nomi *</span>
                  <input
                    required
                    placeholder="Masalan: Tadbirlar va bayramlar"
                    value={photoForm.newCategoryName}
                    onChange={(e) => setPhotoForm((p) => ({ ...p, newCategoryName: e.target.value }))}
                  />
                </label>
              )}

              <label className="input-group">
                <span>Rasm sarlavhasi *</span>
                <input
                  required
                  placeholder="Masalan: 3-qavat yangi 4 kishilik xona"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm((p) => ({ ...p, title: e.target.value }))}
                />
              </label>

              <label className="input-group">
                <span>Rasm ustidagi yorliq (Tag)</span>
                <input
                  placeholder="Masalan: 4 o‘rin / Mutolaa zali"
                  value={photoForm.tag}
                  onChange={(e) => setPhotoForm((p) => ({ ...p, tag: e.target.value }))}
                />
              </label>

              <label className="input-group is-full">
                <span>Rasm pastidagi gap / batafsil izoh (Saytda rasm ostida ko‘rinadi) *</span>
                <textarea
                  rows={2}
                  placeholder="Masalan: Har bir talaba uchun shaxsiy o‘qish stoli, ortopedik matras, kiyim javoni va yuqori tezlikdagi Wi-Fi mavjud."
                  value={photoForm.description}
                  onChange={(e) => setPhotoForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>

              <div className="input-group is-full">
                <span>Rasm yuklash yoki tayyor rasmlardan tanlash *</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 4 }}>
                  <img
                    src={photoForm.imageData || photoForm.imageUrl || "/images/room3.jpeg"}
                    alt="Tanlangan rasm"
                    style={{ width: 92, height: 64, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border-subtle)" }}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                    <Camera size={14} />
                    <span>{photoForm.imageData ? "Kompyuterdan rasm yuklandi ✓" : "Kompyuterdan rasm yuklash"}</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoFileChange} />
                  </label>
                  <div className="admin-image-picker-thumbs" style={{ flex: 1 }}>
                    {sampleImages.map((imgUrl) => (
                      <button
                        key={imgUrl}
                        type="button"
                        className={`admin-picker-thumb ${!photoForm.imageData && photoForm.imageUrl === imgUrl ? "active" : ""}`}
                        onClick={() => setPhotoForm((p) => ({ ...p, imageData: "", imageUrl: imgUrl }))}
                        title={imgUrl}
                      >
                        <img src={imgUrl} alt="Namuna" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="is-full" style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={busyId === "add-gallery-photo"}>
                  <Plus size={15} /> {busyId === "add-gallery-photo" ? "Bazaga saqlanmoqda..." : "Fotogalereyaga rasm va gapni qo‘shish"}
                </button>
              </div>
            </form>
          </section>

          {/* 3. EXISTING GALLERY PHOTOS LIST & INLINE EDITOR */}
          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <div>
                <h2><ImageIcon size={18} /> Fotogalereyadagi Barcha Rasmlar va Pastki Gaplar ({filteredGalleryPhotos.length})</h2>
                <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                  Istalgan rasmning bo‘limini, sarlavhasini, rasm faylini yoki pastidagi gapini tahrirlang.
                </small>
              </div>
            </div>

            <div className="admin-filter-pills" style={{ marginBottom: 14 }}>
              <button
                type="button"
                className={`compare-tab-btn ${galleryFilterCat === "all" ? "active" : ""}`}
                onClick={() => setGalleryFilterCat("all")}
              >
                Barchasi ({(overview.gallery || []).length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  className={`compare-tab-btn ${galleryFilterCat === c.slug ? "active" : ""}`}
                  onClick={() => setGalleryFilterCat(c.slug)}
                >
                  {c.name} ({c.photoCount || 0})
                </button>
              ))}
            </div>

            <div className="admin-room-types-grid">
              {filteredGalleryPhotos.map((g) => {
                const isEditing = editingPhotoId === g.id;
                const draft = photoEdits[g.id] || {
                  title: g.title || "",
                  category: g.category || "rooms",
                  tag: g.tag || "",
                  description: g.description || "",
                  imageUrl: g.image || "/images/room3.jpeg",
                  imageData: ""
                };
                return (
                  <article className="admin-room-type-card" key={g.id}>
                    <div className="admin-room-type-media" style={{ height: 165 }}>
                      <img src={draft.imageUrl || g.image} alt={g.title} loading="lazy" />
                      <div className="admin-room-type-media-overlay">
                        <span className="admin-room-type-pill">{g.categoryName || g.category} • {g.tag}</span>
                        {isEditing && (
                          <label className="admin-img-upload-pill">
                            <Camera size={13} />
                            <span>Rasmni almashtirish</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleEditPhotoFileChange(g.id, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="admin-room-edit-stack">
                      {isEditing ? (
                        <>
                          <label className="input-group">
                            <span>Bo‘lim (Kategoriya)</span>
                            <select
                              value={draft.category}
                              onChange={(e) =>
                                setPhotoEdits((p) => ({ ...p, [g.id]: { ...draft, category: e.target.value } }))
                              }
                            >
                              {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>{c.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="input-group">
                            <span>Rasm sarlavhasi</span>
                            <input
                              value={draft.title}
                              onChange={(e) =>
                                setPhotoEdits((p) => ({ ...p, [g.id]: { ...draft, title: e.target.value } }))
                              }
                            />
                          </label>
                          <label className="input-group">
                            <span>Yorliq (Tag)</span>
                            <input
                              value={draft.tag}
                              onChange={(e) =>
                                setPhotoEdits((p) => ({ ...p, [g.id]: { ...draft, tag: e.target.value } }))
                              }
                            />
                          </label>
                          <label className="input-group">
                            <span>Rasm pastidagi gap / izoh</span>
                            <textarea
                              rows={2}
                              value={draft.description}
                              onChange={(e) =>
                                setPhotoEdits((p) => ({ ...p, [g.id]: { ...draft, description: e.target.value } }))
                              }
                            />
                          </label>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1 }}
                              disabled={busyId === `save-gal-${g.id}`}
                              onClick={async () => {
                                const ok = await runAdminRequest({
                                  url: `/api/admin/gallery/${g.id}`,
                                  method: "PATCH",
                                  body: draft,
                                  busyKey: `save-gal-${g.id}`,
                                  successMsg: "Rasm va pastki gap yangilandi!"
                                });
                                if (ok) setEditingPhotoId(null);
                              }}
                            >
                              <Check size={13} /> Saqlash
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingPhotoId(null)}
                            >
                              Bekor
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <strong style={{ fontSize: 14, color: "var(--blue-navy)" }}>{g.title}</strong>
                          <p style={{ fontSize: 12.5, color: "var(--color-muted)", margin: "4px 0 10px", lineHeight: 1.45 }}>
                            {g.description || "Pastki izoh kiritilmagan — Tahrirlash tugmasini bosib gap qo‘shing."}
                          </p>
                          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1 }}
                              onClick={() => {
                                setPhotoEdits((p) => ({
                                  ...p,
                                  [g.id]: {
                                    title: g.title || "",
                                    category: g.category || "rooms",
                                    tag: g.tag || "",
                                    description: g.description || "",
                                    imageUrl: g.image || "/images/room3.jpeg",
                                    imageData: ""
                                  }
                                }));
                                setEditingPhotoId(g.id);
                              }}
                            >
                              <Pencil size={13} /> Gap va rasmni tahrirlash
                            </button>
                            <button
                              type="button"
                              className="avatar-remove-btn"
                              disabled={busyId === `del-gal-${g.id}`}
                              onClick={() =>
                                runAdminRequest({
                                  url: `/api/admin/gallery/${g.id}`,
                                  method: "DELETE",
                                  busyKey: `del-gal-${g.id}`,
                                  successMsg: "Rasm galereyadan o‘chirildi."
                                })
                              }
                              title="O‘chirish"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {subTab === "bottomTexts" && (
        <div className="admin-site-content-stack">
          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <div>
                <h2><MessageSquarePlus size={18} /> Fotogalereya va Bosh Sahifa Pastidagi Gaplarni Qo‘shish</h2>
                <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                  Fotogalereya sahifasi pastida chiqadigan izoh bloklarini yoki Bosh sahifa pastidagi harakatlanuvchi afzallik gaplarini qo‘shing. Barchasi ma’lumotlar bazasida saqlanadi.
                </small>
              </div>
            </div>

            <form onSubmit={handleAddBottomText} className="admin-modal-form" style={{ marginTop: 6 }}>
              <label className="input-group">
                <span>Qaysi bo‘lim pastiga qo‘shilsin? *</span>
                <select
                  value={bottomTextForm.section}
                  onChange={(e) => setBottomTextForm((p) => ({ ...p, section: e.target.value }))}
                >
                  <option value="gallery">Fotogalereya sahifasi pastidagi gaplar va ma’lumotlar</option>
                  <option value="homepage">Bosh sahifa pastidagi aylanuvchi gaplar (Afzalliklar satri)</option>
                </select>
              </label>

              <label className="input-group">
                <span>Yorliq (Badge)</span>
                <input
                  placeholder="Masalan: Original foto / Komfort / 24/7"
                  value={bottomTextForm.badge}
                  onChange={(e) => setBottomTextForm((p) => ({ ...p, badge: e.target.value }))}
                />
              </label>

              <label className="input-group is-full">
                <span>Asosiy sarlavha yoki gap matni *</span>
                <input
                  required
                  placeholder="Masalan: Barcha xonalar 100% yangi mebel va texnika bilan ta’minlangan"
                  value={bottomTextForm.title}
                  onChange={(e) => setBottomTextForm((p) => ({ ...p, title: e.target.value }))}
                />
              </label>

              <label className="input-group is-full">
                <span>Pastki batafsil gap / izoh matni</span>
                <textarea
                  rows={2}
                  placeholder="Masalan: Talabalar o‘zlari bilan faqat shaxsiy buyumlarini olib kelishlari kifoya — yotoq anjomlari va jihozlar tayyor."
                  value={bottomTextForm.content}
                  onChange={(e) => setBottomTextForm((p) => ({ ...p, content: e.target.value }))}
                />
              </label>

              <div className="is-full" style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={busyId === "add-bottom-text"}>
                  <Plus size={15} /> {busyId === "add-bottom-text" ? "Saqlanmoqda..." : "Pastki gapni bazaga qo‘shish"}
                </button>
              </div>
            </form>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <h2>Fotogalereya Pastidagi Gaplar ({galleryBottomTexts.length})</h2>
            </div>
            <div className="admin-bookings-list">
              {galleryBottomTexts.map((item) => {
                const isEditing = editingBottomId === item.id;
                const draft = bottomEdits[item.id] || {
                  title: item.title,
                  content: item.content || "",
                  badge: item.badge || ""
                };
                return (
                  <article className="admin-booking-card" key={item.id}>
                    <div className="booking-card-top">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {item.badge && <span className="admin-room-num-badge">{item.badge}</span>}
                        <h3>{item.title}</h3>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (isEditing) setEditingBottomId(null);
                            else {
                              setBottomEdits((p) => ({
                                ...p,
                                [item.id]: { title: item.title, content: item.content || "", badge: item.badge || "" }
                              }));
                              setEditingBottomId(item.id);
                            }
                          }}
                        >
                          <Pencil size={13} /> {isEditing ? "Bekor" : "Tahrirlash"}
                        </button>
                        <button
                          type="button"
                          className="avatar-remove-btn"
                          disabled={busyId === `del-bt-${item.id}`}
                          onClick={() =>
                            runAdminRequest({
                              url: `/api/admin/bottom-texts/${item.id}`,
                              method: "DELETE",
                              busyKey: `del-bt-${item.id}`,
                              successMsg: "Pastki gap o‘chirildi."
                            })
                          }
                        >
                          <Trash2 size={13} /> O‘chirish
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="admin-modal-form" style={{ marginTop: 10 }}>
                        <label className="input-group">
                          <span>Sarlavha / Gap *</span>
                          <input
                            value={draft.title}
                            onChange={(e) =>
                              setBottomEdits((p) => ({ ...p, [item.id]: { ...draft, title: e.target.value } }))
                            }
                          />
                        </label>
                        <label className="input-group">
                          <span>Yorliq (Badge)</span>
                          <input
                            value={draft.badge}
                            onChange={(e) =>
                              setBottomEdits((p) => ({ ...p, [item.id]: { ...draft, badge: e.target.value } }))
                            }
                          />
                        </label>
                        <label className="input-group is-full">
                          <span>Batafsil matn</span>
                          <textarea
                            rows={2}
                            value={draft.content}
                            onChange={(e) =>
                              setBottomEdits((p) => ({ ...p, [item.id]: { ...draft, content: e.target.value } }))
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busyId === `save-bt-${item.id}`}
                          onClick={async () => {
                            const ok = await runAdminRequest({
                              url: `/api/admin/bottom-texts/${item.id}`,
                              method: "PATCH",
                              body: draft,
                              busyKey: `save-bt-${item.id}`,
                              successMsg: "Pastki gap yangilandi!"
                            });
                            if (ok) setEditingBottomId(null);
                          }}
                        >
                          <Check size={14} /> Saqlash
                        </button>
                      </div>
                    ) : (
                      <p className="admin-msg-body" style={{ marginTop: 6 }}>{item.content}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <h2>Bosh Sahifa Pastidagi Harakatlanuvchi Gaplar ({homepageBottomTexts.length})</h2>
            </div>
            <div className="admin-gallery-categories-grid">
              {homepageBottomTexts.map((item) => (
                <div className="admin-gallery-cat-card" key={item.id}>
                  <div className="admin-gallery-cat-head">
                    <strong>{item.title}</strong>
                    <button
                      type="button"
                      className="avatar-remove-btn"
                      disabled={busyId === `del-bt-${item.id}`}
                      onClick={() =>
                        runAdminRequest({
                          url: `/api/admin/bottom-texts/${item.id}`,
                          method: "DELETE",
                          busyKey: `del-bt-${item.id}`,
                          successMsg: "Bosh sahifa pastki gapi o‘chirildi."
                        })
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {item.content && <p className="admin-gallery-cat-desc">{item.content}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {subTab === "homepage" && (
        <form onSubmit={handleSaveHomepage} className="admin-site-content-stack">
          <section className="admin-panel-card">
            <div className="admin-panel-card-head">
              <div>
                <h2><Globe size={18} /> Bosh Sahifa, Fotogalereya Sarlavhasi va Pastki Footer Gaplari</h2>
                <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                  Saytga kirganda chiqadigan asosiy shior, sarlavha, Fotogalereya sahifasi matnlari va sayt eng pastidagi (Footer) gaplarni tahrirlang.
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

              <label className="input-group">
                <span>Fotogalereya sahifasi sarlavhasi</span>
                <input
                  value={homeDraft.galleryTitle}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, galleryTitle: e.target.value }))}
                />
              </label>

              <label className="input-group">
                <span>Sayt eng pastidagi mualliflik gapi (Footer Copyright)</span>
                <input
                  value={homeDraft.footerCopyright}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, footerCopyright: e.target.value }))}
                />
              </label>

              <label className="input-group is-full">
                <span>Fotogalereya sahifasi izoh gapi (Subtitle)</span>
                <input
                  value={homeDraft.gallerySubtitle}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, gallerySubtitle: e.target.value }))}
                />
              </label>

              <label className="input-group is-full">
                <span>Sayt pastidagi (Footer) yotoqxona haqida umumiy gap</span>
                <textarea
                  rows={2}
                  value={homeDraft.footerAbout}
                  onChange={(e) => setHomeDraft((p) => ({ ...p, footerAbout: e.target.value }))}
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
      )}

      {subTab === "faqs" && (
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
