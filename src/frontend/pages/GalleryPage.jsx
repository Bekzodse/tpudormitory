import React, { useMemo } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { galleryItems } from "../data/dormData";

const DEFAULT_CATEGORIES = [
  { slug: "rooms", name: "Xonalar", description: "2, 4 va 6 kishilik zamonaviy jihozlangan talabalar yotoqxona xonalari." },
  { slug: "study", name: "Kutubxona", description: "Sokin mutolaa zallari, kovorking va yuqori tezlikdagi Wi-Fi o‘quv hududlari." },
  { slug: "dining", name: "Oshxona", description: "Har bir qavatda zamonaviy maishiy texnikalar bilan jihozlangan oshxona va ovqatlanish maydoni." },
  { slug: "sports", name: "Sport", description: "Basketbol maydonchasi, street workout va sog‘lom turmush tarzi uchun sport majmuasi." },
  { slug: "campus", name: "Kampus", description: "Tashkent Perfect University bosh korpusi, yashil xiyobon va yotoqxona hovlisi." }
];

export default function GalleryPage({
  items,
  allItems = [],
  categories = [],
  bottomTexts = [],
  homepage,
  totalCount,
  category,
  setCategory,
  openLightbox
}) {
  const effectiveCategories = useMemo(() => {
    const base = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const sourcePhotos = Array.isArray(allItems) && allItems.length > 0 ? allItems : items;
    return base.map((cat) => ({
      ...cat,
      count:
        typeof cat.photoCount === "number"
          ? cat.photoCount
          : sourcePhotos.filter((p) => p.category === cat.slug).length
    }));
  }, [categories, allItems, items]);

  const activeCategoryObj = useMemo(
    () => effectiveCategories.find((c) => c.slug === category) || null,
    [effectiveCategories, category]
  );

  const pageTitle = homepage?.galleryTitle || "Kampus va Yotoqxona Fotogalereyasi";
  const pageSubtitle =
    homepage?.gallerySubtitle ||
    "Xonalar, oshxonalar, kutubxona va talabalar shaharchasining haqiqiy suratlari.";

  return (
    <div className="page-view-wrap section-wrap">
      <div className="section-header-centered">
        <span className="section-kicker">
          <Sparkles size={14} /> Barcha Fotolar va Bo‘limlar
        </span>
        <h1 className="section-title">{pageTitle}</h1>
        <p className="section-subtitle">{pageSubtitle}</p>

        <div className="filter-pill-group">
          <button
            className={`btn-filter ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            Barchasi ({totalCount ?? galleryItems.length})
          </button>
          {effectiveCategories.map((cat) => (
            <button
              key={cat.slug}
              className={`btn-filter ${category === cat.slug ? "active" : ""}`}
              onClick={() => setCategory(cat.slug)}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {activeCategoryObj && activeCategoryObj.description && (
          <div className="gallery-category-banner">
            <strong>{activeCategoryObj.name}:</strong>{" "}
            <span>{activeCategoryObj.description}</span>
          </div>
        )}
      </div>

      <div className="gallery-grid full-gallery-grid">
        {items.map((item) => {
          const catName =
            item.categoryName ||
            effectiveCategories.find((c) => c.slug === item.category)?.name ||
            item.category;
          return (
            <article
              key={item.id}
              className="gallery-item-card has-bottom-caption"
              onClick={() => openLightbox(item)}
              role="button"
              tabIndex={0}
              aria-label={`${item.title} fotosuratini ko‘rish`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openLightbox(item);
              }}
            >
              <div className="gallery-item-media">
                <img src={item.image} alt={item.title} loading="lazy" />
                <div className="gallery-item-overlay">
                  <span className="gallery-tag">{item.tag}</span>
                  <h4>{item.title}</h4>
                  <span className="gallery-zoom-cue">
                    <Sparkles size={14} /> Kattalashtirish
                  </span>
                </div>
              </div>
              <div className="gallery-card-bottom-caption">
                <div className="gallery-card-caption-top">
                  <span className="gallery-caption-cat">{catName}</span>
                  {item.tag && <span className="gallery-caption-tag">{item.tag}</span>}
                </div>
                <h4>{item.title}</h4>
                {item.description && <p>{item.description}</p>}
              </div>
            </article>
          );
        })}
      </div>

      {Array.isArray(bottomTexts) && bottomTexts.length > 0 && (
        <section className="gallery-bottom-texts-section" aria-label="Fotogalereya haqida qo‘shimcha ma’lumotlar">
          <div className="gallery-bottom-texts-grid">
            {bottomTexts.map((bt) => (
              <article className="gallery-bottom-text-card" key={bt.id}>
                <div className="gallery-bottom-text-head">
                  <CheckCircle2 size={18} className="check-green" />
                  {bt.badge && <span className="gallery-caption-cat">{bt.badge}</span>}
                </div>
                <h3>{bt.title}</h3>
                {bt.content && <p>{bt.content}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
