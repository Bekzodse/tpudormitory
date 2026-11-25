import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, X } from "lucide-react";
import AdminPanelView from "./admin-panel/AdminPanelView";
import Header from "./frontend/components/Header";
import Footer from "./frontend/components/Footer";
import HomePage from "./frontend/pages/HomePage";
import RoomsPage from "./frontend/pages/RoomsPage";
import FacilitiesPage from "./frontend/pages/FacilitiesPage";
import GalleryPage from "./frontend/pages/GalleryPage";
import ComparisonPage from "./frontend/pages/ComparisonPage";
import FaqPage from "./frontend/pages/FaqPage";
import ContactPage from "./frontend/pages/ContactPage";
import BookingModal from "./frontend/modals/BookingModal";
import { LightboxModal, RoomDetailsModal } from "./frontend/modals/DormModals";
import { AuthModal, ProfileModal } from "./frontend/modals/AuthModals";
import {
  facilitiesList,
  faqs,
  galleryItems,
  heroCampusPhotos,
  initialRooms
} from "./frontend/data/dormData";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rooms, setRooms] = useState(initialRooms);
  const [activeView, setActiveView] = useState(() => {
    const hash = window.location.hash;
    return ["#rooms", "#facilities", "#gallery", "#compare", "#faq", "#contact", "#admin"].includes(hash)
      ? hash.slice(1)
      : "home";
  });

  const [roomFilter, setRoomFilter] = useState("all");
  const [facilityCategory, setFacilityCategory] = useState("all");
  const [galleryFilter, setGalleryFilter] = useState("all");
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [faqOpenIndex, setFaqOpenIndex] = useState(0);

  // Quick Hero Search State
  const [heroSearchType, setHeroSearchType] = useState("all");
  const [heroSearchBudget, setHeroSearchBudget] = useState("all");

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    course: "1-kurs",
    age: "",
    room: "01 / 2 Kishilik Yotoqxona",
    preferredRoomNumber: "",
    date: "",
    duration: "1 semestr",
    notes: ""
  });
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [publicDormRooms, setPublicDormRooms] = useState([]);
  const [publicAnnouncements, setPublicAnnouncements] = useState([]);
  const [publicGallery, setPublicGallery] = useState(galleryItems);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    subject: "Yotoqxona bo‘yicha savol",
    message: ""
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Auth & Student State
  const [authMode, setAuthMode] = useState(null);
  const [student, setStudent] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const syncRoomsFromInventory = (invRooms) => {
    if (!Array.isArray(invRooms) || invRooms.length === 0) return;
    setRooms(
      invRooms.map((item) => {
        const fallback = initialRooms.find((r) => r.id === item.id || r.category === item.category) || initialRooms[0];
        return {
          ...fallback,
          ...item,
          image: item.image || fallback.image,
          gallery: Array.isArray(item.gallery) && item.gallery.length > 0 ? item.gallery : [item.image || fallback.image],
          features: Array.isArray(item.features) && item.features.length > 0 ? item.features : fallback.features,
          amenities: Array.isArray(item.amenities) && item.amenities.length > 0 ? item.amenities : fallback.amenities
        };
      })
    );
  };

  const loadPublicBackendData = () => {
    fetch("/api/rooms")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rooms) syncRoomsFromInventory(data.rooms);
        if (Array.isArray(data?.dormRooms)) setPublicDormRooms(data.dormRooms);
        if (Array.isArray(data?.announcements)) setPublicAnnouncements(data.announcements);
        if (Array.isArray(data?.gallery) && data.gallery.length > 0) setPublicGallery(data.gallery);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadPublicBackendData();

    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.student) {
          setStudent(data.student);
          if (window.location.hash === "#admin" && data.student.role !== "admin") {
            setActiveView("home");
          }
        } else if (window.location.hash === "#admin") {
          setActiveView("home");
        }
      })
      .catch(() => {});

    const handlePopState = () => {
      const hash = window.location.hash;
      setActiveView(
        ["#rooms", "#facilities", "#gallery", "#compare", "#faq", "#contact", "#admin"].includes(hash)
          ? hash.slice(1)
          : "home"
      );
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openBookingModal = (room = null, preferredRoomNumber = "") => {
    setSelectedRoomForBooking(room || { title: bookingForm.room });
    setBookingError("");
    setBookingForm((prev) => ({
      ...prev,
      room: room ? room.title : prev.room,
      preferredRoomNumber: preferredRoomNumber || "",
      name: prev.name || (student && student.role !== "admin" ? `${student.firstName} ${student.lastName}` : ""),
      phone: prev.phone || (student && student.role !== "admin" ? student.phone || "" : ""),
      course: student && student.role !== "admin" && student.course ? student.course : prev.course,
      age: prev.age || (student && student.role !== "admin" && student.age ? String(student.age) : "")
    }));
    setBookingSubmitted(false);
  };

  const closeBookingModal = () => setSelectedRoomForBooking(null);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSubmitting(true);
    try {
      const matchedRoom = rooms.find((r) => r.title === bookingForm.room);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roomId: matchedRoom?.id,
          roomTitle: bookingForm.room,
          preferredRoomNumber: bookingForm.preferredRoomNumber || undefined,
          name: bookingForm.name,
          phone: bookingForm.phone,
          telegram: bookingForm.telegram,
          course: bookingForm.course,
          age: bookingForm.age ? Number(bookingForm.age) : null,
          date: bookingForm.date,
          duration: bookingForm.duration,
          notes: bookingForm.notes
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Ariza yuborishda xatolik yuz berdi.");
      setBookingSubmitted(true);
      loadPublicBackendData();
      showToast("Arizangiz bazaga muvaffaqiyatli saqlandi!");
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Xabar yuborishda xatolik yuz berdi.");
      }
      setContactSubmitted(true);
      showToast("Xabaringiz yuborildi. Tez orada bog‘lanamiz!");
    } catch (err) {
      showToast(err.message);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setStudent(null);
    setProfileOpen(false);
    setProfileModalOpen(false);
    if (activeView === "admin") {
      setActiveView("home");
      window.history.pushState(null, "", "#home");
    }
    showToast("Tizimdan muvaffaqiyatli chiqildi.");
  };

  const navigateTo = (href) => {
    setMenuOpen(false);
    const targetView = href === "#home" ? "home" : href.replace("#", "");

    if (activeView === "home" && href.startsWith("#") && href !== "#home") {
      const element = document.querySelector(href);
      if (element) {
        if (window.location.hash !== href) {
          window.history.pushState(null, "", href);
        }
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    if (["rooms", "facilities", "gallery", "compare", "faq", "contact", "admin"].includes(targetView)) {
      if (targetView === "admin" && student?.role !== "admin") {
        setAuthMode("login");
        return;
      }
      setActiveView(targetView);
      if (window.location.hash !== href) {
        window.history.pushState(null, "", href);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setActiveView("home");
    if (window.location.hash !== href) {
      window.history.pushState(null, "", href);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredFacilities = useMemo(() => {
    if (facilityCategory === "all") return facilitiesList;
    return facilitiesList.filter((f) => f.category === facilityCategory);
  }, [facilityCategory]);

  const filteredGallery = useMemo(() => {
    if (galleryFilter === "all") return publicGallery;
    return publicGallery.filter((item) => item.category === galleryFilter);
  }, [publicGallery, galleryFilter]);

  const navItems = [
    { label: "Bosh sahifa", href: "#home", view: "home" },
    { label: "Xonalar", href: "#rooms", view: "rooms" },
    { label: "Qulayliklar", href: "#facilities", view: "facilities" },
    { label: "Fotogalereya", href: "#gallery", view: "gallery" },
    { label: "Taqqoslash", href: "#compare", view: "compare" },
    { label: "Savol-Javob", href: "#faq", view: "faq" },
    { label: "Aloqa", href: "#contact", view: "contact" }
  ];

  return (
    <div className={`site-shell ${activeView === "home" ? "is-home" : ""}`}>
      <div className="bg-glow-orb bg-glow-orb-1" aria-hidden="true" />
      <div className="bg-glow-orb bg-glow-orb-2" aria-hidden="true" />
      <div className="bg-grid-overlay" aria-hidden="true" />

      {toastMessage && (
        <div className="site-toast animate-slide-in" role="status">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} aria-label="Yopish">
            <X size={14} />
          </button>
        </div>
      )}

      <Header
        navItems={navItems}
        activeView={activeView}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navigateTo={navigateTo}
        student={student}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        setProfileModalOpen={setProfileModalOpen}
        setAuthMode={setAuthMode}
        openBookingModal={openBookingModal}
        logout={logout}
      />

      <main>
        {activeView === "admin" && student?.role === "admin" ? (
          <AdminPanelView
            onRoomsSync={(inv) => {
              syncRoomsFromInventory(inv);
              loadPublicBackendData();
            }}
            showToast={showToast}
            onAdminSync={setStudent}
          />
        ) : activeView === "rooms" ? (
          <RoomsPage
            rooms={rooms}
            dormRooms={publicDormRooms}
            announcements={publicAnnouncements}
            roomFilter={roomFilter}
            setRoomFilter={setRoomFilter}
            openBooking={openBookingModal}
            openDetails={setDetailRoom}
          />
        ) : activeView === "facilities" ? (
          <FacilitiesPage
            facilities={filteredFacilities}
            category={facilityCategory}
            setCategory={setFacilityCategory}
            openBooking={openBookingModal}
          />
        ) : activeView === "gallery" ? (
          <GalleryPage
            items={filteredGallery}
            totalCount={publicGallery.length}
            category={galleryFilter}
            setCategory={setGalleryFilter}
            openLightbox={setLightboxImage}
          />
        ) : activeView === "compare" ? (
          <ComparisonPage
            rooms={rooms}
            openBooking={openBookingModal}
            openDetails={setDetailRoom}
          />
        ) : activeView === "faq" ? (
          <FaqPage
            faqs={faqs}
            faqOpenIndex={faqOpenIndex}
            setFaqOpenIndex={setFaqOpenIndex}
            openBooking={openBookingModal}
          />
        ) : activeView === "contact" ? (
          <ContactPage
            contactForm={contactForm}
            setContactForm={setContactForm}
            contactSubmitted={contactSubmitted}
            setContactSubmitted={setContactSubmitted}
            handleSubmit={handleContactSubmit}
          />
        ) : (
          <HomePage
            rooms={rooms}
            openBookingModal={openBookingModal}
            navigateTo={navigateTo}
            heroSearchType={heroSearchType}
            setHeroSearchType={setHeroSearchType}
            heroSearchBudget={heroSearchBudget}
            setHeroSearchBudget={setHeroSearchBudget}
            setRoomFilter={setRoomFilter}
            setLightboxImage={setLightboxImage}
          />
        )}
      </main>

      {activeView !== "home" && (
        <Footer
          rooms={rooms}
          navigateTo={navigateTo}
          setRoomFilter={setRoomFilter}
          openBookingModal={openBookingModal}
          showToast={showToast}
        />
      )}

      <div className="floating-action-buttons">
        <button
          className="fab-book btn btn-primary btn-glow"
          onClick={() => openBookingModal()}
          aria-label="Xonani onlayn band qilish"
          title="Xonani band qilish"
        >
          <CalendarDays size={18} />
          <span className="fab-label">Band qilish</span>
        </button>
      </div>

      {detailRoom && (
        <RoomDetailsModal
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onOpenBooking={openBookingModal}
        />
      )}

      {lightboxImage && (
        <LightboxModal
          item={lightboxImage}
          items={String(lightboxImage.id).startsWith("hero-") ? heroCampusPhotos : filteredGallery}
          onClose={() => setLightboxImage(null)}
          onSelect={setLightboxImage}
        />
      )}

      {selectedRoomForBooking && (
        <BookingModal
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          bookingSubmitted={bookingSubmitted}
          bookingSubmitting={bookingSubmitting}
          bookingError={bookingError}
          rooms={rooms}
          publicDormRooms={publicDormRooms}
          closeBookingModal={closeBookingModal}
          handleBookingSubmit={handleBookingSubmit}
        />
      )}

      {authMode && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthMode(null)}
          onSuccess={(account) => {
            setStudent(account);
            setAuthMode(null);
            if (account.role === "admin") {
              setActiveView("admin");
              window.history.pushState(null, "", "#admin");
              window.scrollTo({ top: 0, behavior: "smooth" });
              showToast("Admin panelga xush kelibsiz!");
            } else {
              showToast(
                authMode === "register"
                  ? `Profilingiz ochildi, ${account.firstName}! Profilingizdan rasm qo‘yishingiz mumkin.`
                  : `Xush kelibsiz, ${account.firstName}!`
              );
            }
          }}
        />
      )}

      {student && profileModalOpen && (
        <ProfileModal
          student={student}
          onClose={() => setProfileModalOpen(false)}
          onUpdated={(updated) => {
            setStudent(updated);
            setProfileModalOpen(false);
            showToast("Profilingiz muvaffaqiyatli yangilandi!");
          }}
        />
      )}
    </div>
  );
}
