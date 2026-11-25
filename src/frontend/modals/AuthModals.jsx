import React, { useEffect, useState } from "react";
import {
  ArrowRight, CalendarDays, Camera, Check, DoorOpen, Eye, EyeOff,
  Megaphone, Trash2, UserCircle, Users, Wrench, X
} from "lucide-react";
import { COURSE_OPTIONS, resizeAvatarFile } from "../data/dormData";
import TpuLogo from "../common/TpuLogo";

export function AvatarUploader({ avatar, onChange, onError }) {
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeAvatarFile(file);
      onChange(dataUrl);
      if (onError) onError("");
    } catch (err) {
      if (onError) onError(err.message);
    }
    e.target.value = "";
  };

  return (
    <div className="avatar-upload-box">
      <div className="avatar-preview-circle">
        {avatar ? <img src={avatar} alt="Profil rasmi" /> : <UserCircle size={34} />}
      </div>
      <div className="avatar-upload-info">
        <strong>Profil rasmi</strong>
        <small>JPG, PNG yoki WEBP formatida rasm yuklang</small>
        <div className="avatar-upload-actions">
          <label className="avatar-file-label">
            <Camera size={14} />
            <span>{avatar ? "Rasmni almashtirish" : "Rasm yuklash"}</span>
            <input type="file" accept="image/*" className="avatar-file-input" onChange={handleFileChange} />
          </label>
          {avatar && (
            <button type="button" className="avatar-remove-btn" onClick={() => onChange(null)}>
              <Trash2 size={13} /> O‘chirish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthModal({ mode, onModeChange, onClose, onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    firstName: "", lastName: "", age: "", course: "1-kurs",
    phone: "", login: "", password: "", confirmPassword: ""
  });

  const registration = mode === "register";
  const update = (key, val) => setValues((old) => ({ ...old, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (registration && values.password !== values.confirmPassword) {
      setMessage("Parol va tasdiqlash paroli bir xil bo‘lishi kerak.");
      return;
    }

    setLoading(true);
    try {
      const payload = registration
        ? {
            firstName: values.firstName,
            lastName: values.lastName,
            age: Number(values.age),
            course: values.course,
            phone: values.phone,
            login: values.login,
            password: values.password
          }
        : { login: values.login, password: values.password };

      const response = await fetch(`/api/auth/${registration ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Amalni bajarib bo‘lmadi.");
      onSuccess(data.student);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Yopish"><X size={20} /></button>

        <div className="auth-header">
          <div className="auth-logo-badge"><TpuLogo size={30} /></div>
          <span className="section-kicker"><Users size={14} /> TPU Talabalar Portali</span>
          <h2>{registration ? "Profil ochish" : "Tizimga kirish"}</h2>
          <p>
            {registration
              ? "Shaxsiy talaba profilingizni ochish uchun ma’lumotlaringizni kiriting. Rasmni profil ochilgandan keyin qo‘yishingiz mumkin."
              : "Shaxsiy profilingizga kirish uchun login va parolingizni kiriting."}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {registration && (
            <>
              <div className="auth-name-row">
                <label className="input-group"><span>Ism *</span><input required value={values.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Ali" /></label>
                <label className="input-group"><span>Familiya *</span><input required value={values.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Valiyev" /></label>
              </div>
              <div className="auth-name-row">
                <label className="input-group"><span>Yoshingiz *</span><input required type="number" min={15} max={60} value={values.age} onChange={(e) => update("age", e.target.value)} placeholder="20" /></label>
                <label className="input-group">
                  <span>Nechinchi kurs *</span>
                  <select required value={values.course} onChange={(e) => update("course", e.target.value)}>
                    {COURSE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <label className="input-group"><span>Telefon raqami *</span><input required type="tel" value={values.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+998 90 123 45 67" /></label>
            </>
          )}

          <label className="input-group">
            <span>Login *</span>
            <input required minLength={4} pattern="[A-Za-z0-9_]{4,}" value={values.login} onChange={(e) => update("login", e.target.value)} placeholder="Masalan: ali2026" />
            {registration && <small className="field-hint">Kamida 4 ta lotin harfi, raqam yoki _ belgisi.</small>}
          </label>

          <div className={registration ? "auth-name-row" : ""}>
            <label className="input-group">
              <span>Parol *</span>
              <div className="password-input-wrap">
                <input required minLength={6} type={showPassword ? "text" : "password"} value={values.password} onChange={(e) => update("password", e.target.value)} placeholder="Kamida 6 ta belgi" />
                <button type="button" className="pwd-toggle-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {registration && (
              <label className="input-group">
                <span>Parolni tasdiqlang *</span>
                <div className="password-input-wrap">
                  <input required minLength={6} type={showConfirm ? "text" : "password"} value={values.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Qayta kiriting" />
                  <button type="button" className="pwd-toggle-btn" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? "Parolni yashirish" : "Parolni ko‘rsatish"}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            )}
          </div>

          {message && <div className="auth-error-alert" role="alert">{message}</div>}

          <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={loading}>
            <span>{loading ? "Yuklanmoqda..." : registration ? "Profil ochish" : "Tizimga kirish"}</span>
            <ArrowRight size={16} className="btn-arrow" />
          </button>
        </form>

        <div className="auth-switch-footer">
          <span>{registration ? "Allaqachon profilingiz bormi?" : "Hali profilingiz yo‘qmi?"}</span>
          <button type="button" className="switch-mode-btn" onClick={() => { setMessage(""); onModeChange(registration ? "login" : "register"); }}>
            {registration ? "Tizimga kirish" : "Profil ochish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileModal({ student, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [values, setValues] = useState({
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    age: student.age || "",
    course: student.course || "1-kurs",
    phone: student.phone || "",
    avatar: student.avatar || null
  });
  const [message, setMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [portal, setPortal] = useState({ myBookings: [], myResidency: null, myMaintenance: [] });
  const [announcements, setAnnouncements] = useState([]);
  const [dormRooms, setDormRooms] = useState([]);
  const [maintForm, setMaintForm] = useState({
    roomNumber: "",
    category: "Santexnika",
    priority: "medium",
    description: ""
  });
  const [maintSubmitting, setMaintSubmitting] = useState(false);

  const loadPortalData = () => {
    fetch("/api/student/portal", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.portal) {
          setPortal(data.portal);
          const defaultRoom =
            data.portal.myResidency?.roomNumber ||
            data.portal.myBookings?.[0]?.assignedRoomNumber ||
            data.dormRooms?.[0]?.roomNumber ||
            "301";
          setMaintForm((prev) => ({ ...prev, roomNumber: prev.roomNumber || defaultRoom }));
        }
        if (Array.isArray(data.announcements)) setAnnouncements(data.announcements);
        if (Array.isArray(data.dormRooms)) setDormRooms(data.dormRooms);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const update = (key, val) => setValues((old) => ({ ...old, [key]: val }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          age: values.age ? Number(values.age) : null,
          course: values.course,
          phone: values.phone,
          avatar: values.avatar
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Saqlashda xatolik yuz berdi.");
      onUpdated(data.student);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitMaintenance = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessMsg("");
    setMaintSubmitting(true);
    try {
      const response = await fetch("/api/student/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(maintForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "So‘rov yuborishda xatolik yuz berdi.");
      if (data.portal) setPortal(data.portal);
      setMaintForm((prev) => ({ ...prev, description: "" }));
      setSuccessMsg(data.message || "Texnik so‘rov yuborildi!");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setMaintSubmitting(false);
    }
  };

  const payLabels = { paid: "To‘langan", pending: "Kutilmoqda", overdue: "Qarzdor" };
  const statusLabels = { pending: "Kutilmoqda", approved: "Qabul qilindi", rejected: "Rad etildi" };
  const maintLabels = { open: "Ochiq", in_progress: "Jarayonda", resolved: "Hal qilindi" };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal modal-card student-cabinet-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Yopish"><X size={20} /></button>

        <div className="auth-header" style={{ marginBottom: 14 }}>
          <span className="section-kicker"><UserCircle size={14} /> Talaba Shaxsiy Kabineti</span>
          <h2>{student.firstName} {student.lastName}</h2>
          <p>@{student.login} • Xona holati, arizalar, texnik xizmat va profil sozlamalari</p>
        </div>

        <div className="profile-summary-strip">
          <div className="profile-summary-chip">
            <small>Xonam</small>
            <b>{portal.myResidency ? `${portal.myResidency.roomNumber}-xona (${portal.myResidency.floor}-qavat)` : "Biriktirilmagan"}</b>
          </div>
          <div className="profile-summary-chip">
            <small>To‘lov holati</small>
            <b>{portal.myResidency ? payLabels[portal.myResidency.paymentStatus] : `${portal.myBookings.length} ta ariza`}</b>
          </div>
          <div className="profile-summary-chip">
            <small>Kursi</small>
            <b>{values.course || "—"}</b>
          </div>
        </div>

        <div className="cabinet-tabs-bar" role="tablist">
          <button
            type="button"
            className={`compare-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => { setActiveTab("overview"); setMessage(""); setSuccessMsg(""); }}
          >
            <DoorOpen size={14} /> Xonam va Arizalar ({portal.myBookings.length})
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
            onClick={() => { setActiveTab("maintenance"); setMessage(""); setSuccessMsg(""); }}
          >
            <Wrench size={14} /> Texnik xizmat & E’lonlar
          </button>
          <button
            type="button"
            className={`compare-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => { setActiveTab("profile"); setMessage(""); setSuccessMsg(""); }}
          >
            <UserCircle size={14} /> Profil tahriri
          </button>
        </div>

        {message && <div className="auth-error-alert" role="alert">{message}</div>}
        {successMsg && <div className="cabinet-success-alert" role="status">{successMsg}</div>}

        {activeTab === "overview" && (
          <div className="cabinet-pane">
            {portal.myResidency ? (
              <div className="cabinet-card is-highlight">
                <div className="cabinet-card-head">
                  <div>
                    <span className="section-kicker"><DoorOpen size={13} /> Mening biriktirilgan xonam</span>
                    <h3>{portal.myResidency.roomNumber}-xona • {portal.myResidency.floor}-qavat</h3>
                    <small>{portal.myResidency.typeTitle} • Oylik: {portal.myResidency.monthlyPrice}</small>
                  </div>
                  <span className={`pay-pill is-${portal.myResidency.paymentStatus}`}>
                    {payLabels[portal.myResidency.paymentStatus]}
                  </span>
                </div>
                {portal.myResidency.roommates?.length > 0 && (
                  <div className="cabinet-roommates">
                    <small>Xonadoshlar ({portal.myResidency.roommates.length} nafar):</small>
                    <div className="cabinet-roommate-chips">
                      {portal.myResidency.roommates.map((rm) => (
                        <span key={rm.id} className="feature-chip">
                          <Users size={12} /> {rm.studentName} {rm.course ? `(${rm.course})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="cabinet-card">
                <strong>Hozircha xonaga biriktirilmagansiz</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>
                  Saytdagi &ldquo;Xonani band qilish&rdquo; tugmasi orqali ariza yuboring — administrator tasdiqlashi bilan xonangiz shu yerda ko‘rinadi.
                </p>
              </div>
            )}

            <div className="cabinet-section-block">
              <h4><CalendarDays size={15} /> Yuborilgan bron arizalarim ({portal.myBookings.length})</h4>
              {portal.myBookings.length === 0 ? (
                <small className="cabinet-muted">Siz hali onlayn bron arizasi yubormagansiz.</small>
              ) : (
                <div className="cabinet-list">
                  {portal.myBookings.map((b) => (
                    <div key={b.id} className="cabinet-list-item">
                      <div className="cabinet-list-top">
                        <strong>{b.roomTitle.replace(/^\d+\s*\/\s*/, "")}</strong>
                        <span className={`admin-status-badge status-${b.status}`}>
                          {statusLabels[b.status] || b.status}
                        </span>
                      </div>
                      <small>
                        Muddati: {b.duration}
                        {b.preferredRoomNumber ? ` • So‘ralgan: ${b.preferredRoomNumber}-xona` : ""}
                        {b.assignedRoomNumber ? ` • Biriktirildi: ${b.assignedRoomNumber}-xona` : ""}
                      </small>
                      {b.adminNote && (
                        <div className="cabinet-admin-note">
                          <b>Ma’muriyat izohi:</b> {b.adminNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="cabinet-pane">
            <form className="cabinet-maint-form" onSubmit={submitMaintenance}>
              <h4><Wrench size={15} /> Xona bo‘yicha texnik yordam chaqirish</h4>
              <div className="auth-name-row">
                <label className="input-group">
                  <span>Xona raqami *</span>
                  <select
                    required
                    value={maintForm.roomNumber}
                    onChange={(e) => setMaintForm((p) => ({ ...p, roomNumber: e.target.value }))}
                  >
                    {dormRooms.map((dr) => (
                      <option key={dr.id} value={dr.roomNumber}>
                        {dr.roomNumber}-xona ({dr.floor}-qavat)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="input-group">
                  <span>Yo‘nalish</span>
                  <select
                    value={maintForm.category}
                    onChange={(e) => setMaintForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="Santexnika">Santexnika</option>
                    <option value="Elektr / Yoritish">Elektr / Yoritish</option>
                    <option value="Iqlim nazorati">Iqlim nazorati</option>
                    <option value="Internet / Wi-Fi">Internet / Wi-Fi</option>
                    <option value="Mebel / Qulf">Mebel / Qulf</option>
                  </select>
                </label>
              </div>
              <label className="input-group">
                <span>Muammo tavsifi *</span>
                <input
                  required
                  placeholder="Masalan: Xonadagi konditsioner pulti yoki Wi-Fi ishlamayapti..."
                  value={maintForm.description}
                  onChange={(e) => setMaintForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={maintSubmitting}>
                <Wrench size={14} /> {maintSubmitting ? "Yuborilmoqda..." : "Texnik xizmatga yuborish"}
              </button>
            </form>

            {portal.myMaintenance.length > 0 && (
              <div className="cabinet-section-block">
                <h4>Texnik murojaatlar holati ({portal.myMaintenance.length})</h4>
                <div className="cabinet-list">
                  {portal.myMaintenance.map((m) => (
                    <div key={m.id} className="cabinet-list-item">
                      <div className="cabinet-list-top">
                        <strong>{m.roomNumber}-xona • {m.category}</strong>
                        <span className="pay-pill is-pending">{maintLabels[m.status] || m.status}</span>
                      </div>
                      <small>{m.description}</small>
                      {m.adminNote && <div className="cabinet-admin-note"><b>Usta / Admin izohi:</b> {m.adminNote}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {announcements.length > 0 && (
              <div className="profile-announcements-box">
                <h4><Megaphone size={14} /> Yotoqxona e’lonlari ({announcements.length})</h4>
                {announcements.map((a) => (
                  <div className="profile-ann-item" key={a.id}>
                    <strong>{a.title} <small style={{ fontWeight: 600, color: "#2563eb" }}>({a.category})</small></strong>
                    <p>{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <form className="auth-form" onSubmit={saveProfile}>
            <AvatarUploader avatar={values.avatar} onChange={(nextAvatar) => update("avatar", nextAvatar)} onError={setMessage} />

            <div className="auth-name-row">
              <label className="input-group"><span>Ism *</span><input required value={values.firstName} onChange={(e) => update("firstName", e.target.value)} /></label>
              <label className="input-group"><span>Familiya *</span><input required value={values.lastName} onChange={(e) => update("lastName", e.target.value)} /></label>
            </div>

            <div className="auth-name-row">
              <label className="input-group"><span>Yoshingiz *</span><input required type="number" min={15} max={60} value={values.age} onChange={(e) => update("age", e.target.value)} /></label>
              <label className="input-group">
                <span>Nechinchi kurs *</span>
                <select required value={values.course} onChange={(e) => update("course", e.target.value)}>
                  {COURSE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>

            <label className="input-group"><span>Telefon raqami *</span><input required type="tel" value={values.phone} onChange={(e) => update("phone", e.target.value)} /></label>

            <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={loading}>
              <span>{loading ? "Saqlanmoqda..." : "O‘zgarishlarni saqlash"}</span>
              <Check size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
