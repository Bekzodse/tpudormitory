import React from "react";
import {
  ArrowRight, CalendarDays, Camera, ChevronDown, LogOut,
  Menu, ShieldCheck, UserCircle, Users, X
} from "lucide-react";
import TpuLogo from "../common/TpuLogo";

export default function Header({
  navItems,
  activeView,
  menuOpen,
  setMenuOpen,
  navigateTo,
  student,
  profileOpen,
  setProfileOpen,
  setProfileModalOpen,
  setAuthMode,
  openBookingModal,
  logout
}) {
  return (
    <header className="header">
      <button
        className="brand brand-button"
        onClick={() => navigateTo("#home")}
        aria-label="TPU Smart Dormitory Bosh sahifasi"
      >
        <div className="brand-logo-badge">
          <TpuLogo size={26} />
        </div>
        <div className="brand-copy">
          <span className="brand-title">
            TPU <small className="brand-sub">Smart Dormitory</small>
          </span>
          <span className="brand-org">Tashkent Perfect University</span>
        </div>
      </button>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={menuOpen ? "nav nav-open" : "nav"}>
        {navItems.map((item) => (
          <a
            key={item.label}
            className={`nav-link ${activeView === item.view ? "active" : ""}`}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(item.href);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        {student ? (
          <div className="profile-area">
            <button
              className="profile-trigger btn-secondary"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
            >
              <span className="profile-initials">
                {student.avatar ? (
                  <img src={student.avatar} alt={`${student.firstName} ${student.lastName}`} />
                ) : (
                  `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
                )}
              </span>
              <span className="profile-name">
                {student.firstName} {student.lastName}
              </span>
              <ChevronDown size={14} />
            </button>
            {profileOpen && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <b>{student.firstName} {student.lastName}</b>
                  <span>@{student.login}</span>
                  {student.role === "admin" ? (
                    <small className="profile-menu-meta">Administrator • To‘liq ruxsat</small>
                  ) : (
                    (student.course || student.age) && (
                      <small className="profile-menu-meta">
                        {[student.course, student.age ? `${student.age} yosh` : ""].filter(Boolean).join(" • ")}
                      </small>
                    )
                  )}
                </div>
                {student.role === "admin" ? (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigateTo("#admin");
                    }}
                  >
                    <ShieldCheck size={15} /> Admin panel
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setProfileModalOpen(true);
                      }}
                    >
                      <UserCircle size={15} /> Mening profilim
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setProfileModalOpen(true);
                      }}
                    >
                      <Camera size={15} /> Rasm qo‘yish / tahrirlash
                    </button>
                  </>
                )}
                <button className="logout-btn" onClick={logout}>
                  <LogOut size={15} /> Tizimdan chiqish
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn btn-secondary login-nav-btn"
            onClick={() => setAuthMode("register")}
          >
            <Users size={16} />
            <span>Profil ochish</span>
          </button>
        )}

        {student?.role === "admin" && (
          <button
            className={`btn btn-sm ${activeView === "admin" ? "btn-primary" : "btn-outline"}`}
            onClick={() => navigateTo("#admin")}
          >
            <ShieldCheck size={15} />
            <span>Admin panel</span>
          </button>
        )}

        <button
          className="btn btn-primary header-book-btn"
          onClick={() => openBookingModal()}
        >
          <CalendarDays size={16} />
          <span>Xonani band qilish</span>
          <ArrowRight size={14} className="btn-arrow" />
        </button>
      </div>
    </header>
  );
}
