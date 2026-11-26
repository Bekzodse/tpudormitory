import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, CalendarDays, CreditCard, Database, DoorOpen, Download,
  Globe, Image as ImageIcon, LayoutDashboard, Megaphone, MessageSquare, Plus, Users, Wrench
} from "lucide-react";
import DashboardView from "../dashboard/DashboardView";
import AdminSidebar from "./AdminSidebar";
import { downloadResidentsCsv, parseUzsAmount } from "./utils/AdminHelpers";
import AdminBookingsSection from "./sections/AdminBookingsSection";
import AdminRoomsSection from "./sections/AdminRoomsSection";
import AdminResidentsSection from "./sections/AdminResidentsSection";
import AdminPaymentsSection from "./sections/AdminPaymentsSection";
import AdminMaintenanceSection from "./sections/AdminMaintenanceSection";
import AdminCommunitySection from "./sections/AdminCommunitySection";
import AdminSiteContentSection from "./sections/AdminSiteContentSection";
import AdminChatsSection from "./sections/AdminChatsSection";
import AdminActivityLogSection from "./sections/AdminActivityLogSection";
import AdminDatabaseSection from "./sections/AdminDatabaseSection";
import AdminModals from "./modals/AdminModals";

export default function AdminPanelView({ onRoomsSync, showToast, onAdminSync, onSessionExpired }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState("dashboard");
  const [busyId, setBusyId] = useState(null);
  const [showAdminCreds, setShowAdminCreds] = useState(false);

  const [overview, setOverview] = useState({
    rooms: [], bookings: [], students: [], messages: [],
    dormRooms: [], residents: [], maintenance: [], announcements: [],
    gallery: [], galleryCategories: [], bottomTexts: [],
    availableImages: [], homepage: null, faqs: [], facilities: [], chats: [],
    activityLogs: []
  });
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [roomEdits, setRoomEdits] = useState({});

  // Resident filtering
  const [residentSearch, setResidentSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  // Modal states
  const [inspectedRoomId, setInspectedRoomId] = useState(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomTypeModal, setRoomTypeModal] = useState(null);
  const [residentModal, setResidentModal] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [accountModal, setAccountModal] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    id: null, roomId: "1", studentName: "", phone: "", telegram: "", course: "1-kurs",
    age: "", preferredRoomNumber: "", moveInDate: "", duration: "1 semestr",
    notes: "", status: "pending", adminNote: ""
  });
  const [messageForm, setMessageForm] = useState({
    id: null, firstName: "", lastName: "", phone: "+998 ", subject: "Yotoqxona bo‘yicha savol",
    message: "", status: "new", adminNote: ""
  });

  const [newRoomForm, setNewRoomForm] = useState({
    roomNumber: "", roomTypeId: "1", floor: "4", customPrice: "1 100 000 so‘m", image: "/images/room3.jpeg", description: ""
  });
  const [roomTypeForm, setRoomTypeForm] = useState({
    id: null,
    title: "",
    price: "1 200 000 so‘m",
    spotsPerRoom: "2",
    totalRooms: "10",
    occupiedSpots: "0",
    floor: "4-qavat",
    size: "26 m²",
    bathroom: "Xona ichida shaxsiy sanuzel",
    tag: "Yangi",
    badgeType: "recommended",
    image: "/images/room3.jpeg",
    description: "",
    features: "Shaxsiy sanuzel, Konditsioner, O‘qish stoli, Wi-Fi 500 Mbps",
    initialRoomNumber: ""
  });
  const [resForm, setResForm] = useState({
    dormRoomId: "", studentName: "", phone: "", telegram: "",
    course: "1-kurs", faculty: "", paymentStatus: "pending", moveInDate: "2026-09-01"
  });
  const [maintForm, setMaintForm] = useState({
    roomNumber: "301", category: "Santexnika", priority: "medium", description: ""
  });
  const [annForm, setAnnForm] = useState({
    title: "", category: "Umumiy", audience: "Barcha qavatlar", content: "", pinned: false
  });
  const [accountForm, setAccountForm] = useState({
    firstName: "", lastName: "", age: "", course: "1-kurs", phone: "", login: "", password: ""
  });

  const loadOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/overview", { credentials: "include" });
      if (response.status === 401) {
        if (onSessionExpired) onSessionExpired();
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Admin ma’lumotlarini yuklab bo‘lmadi.");
      setOverview({
        rooms: data.rooms || [], bookings: data.bookings || [], students: data.students || [],
        messages: data.messages || [], dormRooms: data.dormRooms || [], residents: data.residents || [],
        maintenance: data.maintenance || [], announcements: data.announcements || [],
        gallery: data.gallery || [], galleryCategories: data.galleryCategories || [],
        bottomTexts: data.bottomTexts || [], availableImages: data.availableImages || [],
        homepage: data.homepage || null, faqs: data.faqs || [], facilities: data.facilities || [],
        chats: data.chats || [], activityLogs: data.activityLogs || []
      });
      const edits = {};
      (data.rooms || []).forEach((r) => {
        edits[r.id] = { title: r.title, price: r.price, totalRooms: r.totalRooms, occupiedSpots: r.occupiedSpots };
      });
      setRoomEdits(edits);
      onRoomsSync(data.rooms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const runAdminRequest = async ({ url, method = "POST", body, busyKey, successMsg }) => {
    setBusyId(busyKey);
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined
      });
      if (response.status === 401) {
        if (onSessionExpired) onSessionExpired();
        return null;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Amalni bajarib bo‘lmadi.");
      if (successMsg) showToast(successMsg);
      await loadOverview();
      return data;
    } catch (err) {
      showToast(err.message);
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const logClientContact = async ({ section: sec = "clients", clientName = "", clientPhone = "", channel = "Telefon", summary = "" }) => {
    try {
      const response = await fetch("/api/admin/activity-logs/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ section: sec, clientName, clientPhone, channel, summary })
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.activityLogs)) {
          setOverview((prev) => ({ ...prev, activityLogs: data.activityLogs }));
        }
      }
    } catch {
      // ignore non-critical logging errors
    }
  };

  const adminAccount = useMemo(
    () => overview.students.find((s) => s.role === "admin") || null,
    [overview.students]
  );

  const totals = useMemo(() => {
    const totalRooms = overview.rooms.reduce((s, r) => s + r.totalRooms, 0);
    const totalSpots = overview.rooms.reduce((s, r) => s + r.totalSpots, 0);
    const occupiedSpots = overview.rooms.reduce((s, r) => s + r.occupiedSpots, 0);
    const availableSpots = overview.rooms.reduce((s, r) => s + r.availableSpots, 0);
    const occPct = totalSpots ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

    let expectedRevenue = 0;
    let collectedRevenue = 0;
    let overdueRevenue = 0;
    overview.residents.forEach((res) => {
      const fee = parseUzsAmount(res.monthlyPrice);
      expectedRevenue += fee;
      if (res.paymentStatus === "paid") collectedRevenue += fee;
      if (res.paymentStatus === "overdue") overdueRevenue += fee;
    });

    return {
      totalRooms, totalSpots, occupiedSpots, availableSpots, occPct,
      pendingBookings: overview.bookings.filter((b) => b.status === "pending").length,
      paidCount: overview.residents.filter((r) => r.paymentStatus === "paid").length,
      pendingPayCount: overview.residents.filter((r) => r.paymentStatus === "pending").length,
      overduePayCount: overview.residents.filter((r) => r.paymentStatus === "overdue").length,
      openMaintCount: overview.maintenance.filter((m) => m.status !== "resolved").length,
      expectedRevenue, collectedRevenue, overdueRevenue,
      collectionPct: expectedRevenue ? Math.round((collectedRevenue / expectedRevenue) * 100) : 0
    };
  }, [overview]);

  const roomsByFloor = useMemo(() => {
    const map = new Map();
    overview.dormRooms.forEach((dr) => {
      if (!map.has(dr.floor)) map.set(dr.floor, []);
      map.get(dr.floor).push(dr);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [overview.dormRooms]);

  const inspectedRoom = useMemo(
    () => overview.dormRooms.find((r) => r.id === inspectedRoomId) || null,
    [overview.dormRooms, inspectedRoomId]
  );

  const filteredResidents = useMemo(() => {
    const q = residentSearch.trim().toLowerCase();
    return overview.residents.filter((res) => {
      if (paymentFilter !== "all" && res.paymentStatus !== paymentFilter) return false;
      if (courseFilter !== "all" && res.course !== courseFilter) return false;
      if (!q) return true;
      return (
        res.studentName.toLowerCase().includes(q) ||
        res.roomNumber.toLowerCase().includes(q) ||
        res.phone.toLowerCase().includes(q) ||
        (res.faculty || "").toLowerCase().includes(q)
      );
    });
  }, [overview.residents, residentSearch, paymentFilter, courseFilter]);

  const openAddResidentModal = (preselectRoomId = "") => {
    setResForm({
      dormRoomId: preselectRoomId ? String(preselectRoomId) : "",
      studentName: "", phone: "", telegram: "", course: "1-kurs",
      faculty: "", paymentStatus: "pending", moveInDate: new Date().toISOString().slice(0, 10)
    });
    setResidentModal({ mode: "add", data: null });
  };

  const openEditResidentModal = (res) => {
    setResForm({
      dormRoomId: String(res.dormRoomId), studentName: res.studentName || "",
      phone: res.phone || "", telegram: res.telegram || "", course: res.course || "1-kurs",
      faculty: res.faculty || "", paymentStatus: res.paymentStatus || "pending", moveInDate: res.moveInDate || ""
    });
    setResidentModal({ mode: "edit", data: res });
  };

  const openEditAccountModal = (acc) => {
    setAccountForm({
      firstName: acc.firstName || "", lastName: acc.lastName || "",
      age: acc.age || "", course: acc.course || "1-kurs",
      phone: acc.phone || "", login: acc.login || "", password: ""
    });
    setAccountModal(acc);
  };

  const openNewAccountModal = () => {
    setAccountForm({
      firstName: "", lastName: "", age: "20", course: "1-kurs",
      phone: "+998 ", login: "", password: ""
    });
    setAccountModal({ isNew: true });
  };

  const openNewRoomTypeModal = () => {
    setRoomTypeForm({
      id: null,
      title: "",
      price: "1 200 000 so‘m",
      spotsPerRoom: "2",
      totalRooms: "10",
      occupiedSpots: "0",
      floor: "4-qavat",
      size: "26 m²",
      bathroom: "Xona ichida shaxsiy sanuzel",
      tag: "Tavsiya etiladi",
      badgeType: "recommended",
      image: "/images/room3.jpeg",
      description: "Zamonaviy mebel, shaxsiy sanuzel, konditsioner va yuqori tezlikdagi Wi-Fi bilan jihozlangan yangi xona.",
      features: "Shaxsiy sanuzel, Konditsioner, O‘qish stoli, Wi-Fi 500 Mbps",
      initialRoomNumber: ""
    });
    setRoomTypeModal({ mode: "add" });
  };

  const openEditRoomTypeModal = (rt) => {
    setRoomTypeForm({
      id: rt.id,
      title: rt.title || "",
      price: rt.price || "",
      spotsPerRoom: String(rt.spotsPerRoom || 2),
      totalRooms: String(rt.totalRooms || 10),
      occupiedSpots: String(rt.occupiedSpots || 0),
      floor: rt.floor || "4-qavat",
      size: rt.size || "24 m²",
      bathroom: rt.bathroom || "Shaxsiy sanuzel",
      tag: rt.tag || "Tavsiya etiladi",
      badgeType: rt.badgeType || "recommended",
      image: rt.image || "/images/room3.jpeg",
      description: rt.description || "",
      features: Array.isArray(rt.features) ? rt.features.join(", ") : "",
      initialRoomNumber: ""
    });
    setRoomTypeModal({ mode: "edit" });
  };

  const openEditAnnouncementModal = (ann) => {
    setAnnForm({
      id: ann.id,
      title: ann.title || "",
      category: ann.category || "Umumiy",
      audience: ann.audience || "Barcha qavatlar",
      content: ann.content || "",
      pinned: Boolean(ann.pinned)
    });
    setAnnModalOpen(true);
  };

  const openNewBookingModal = () => {
    setBookingForm({
      id: null,
      roomId: String(overview.rooms[0]?.id || "1"),
      studentName: "",
      phone: "+998 ",
      telegram: "",
      course: "1-kurs",
      age: "",
      preferredRoomNumber: "",
      moveInDate: new Date().toISOString().slice(0, 10),
      duration: "1 semestr",
      notes: "",
      status: "pending",
      adminNote: ""
    });
    setBookingModal({ mode: "add" });
  };

  const openEditBookingModal = (b) => {
    setBookingForm({
      id: b.id,
      roomId: String(b.room_id || overview.rooms[0]?.id || "1"),
      studentName: b.student_name || "",
      phone: b.phone || "",
      telegram: b.telegram || "",
      course: b.course || "1-kurs",
      age: b.age ? String(b.age) : "",
      preferredRoomNumber: b.preferred_room_number || "",
      moveInDate: b.move_in_date || "",
      duration: b.duration || "1 semestr",
      notes: b.notes || "",
      status: b.status || "pending",
      adminNote: b.admin_note || ""
    });
    setBookingModal({ mode: "edit", data: b });
  };

  const openNewMaintModal = () => {
    setMaintForm({
      id: null,
      roomNumber: overview.dormRooms[0]?.roomNumber || "301",
      category: "Santexnika",
      priority: "medium",
      status: "open",
      description: "",
      adminNote: "",
      reporterName: ""
    });
    setMaintModalOpen(true);
  };

  const openEditMaintModal = (m) => {
    setMaintForm({
      id: m.id,
      roomNumber: m.roomNumber || "301",
      category: m.category || "Santexnika",
      priority: m.priority || "medium",
      status: m.status || "open",
      description: m.description || "",
      adminNote: m.adminNote || "",
      reporterName: m.reporterName || ""
    });
    setMaintModalOpen(true);
  };

  const openNewMessageModal = () => {
    setMessageForm({
      id: null,
      firstName: "",
      lastName: "",
      phone: "+998 ",
      subject: "Yotoqxona bo‘yicha savol",
      message: "",
      status: "new",
      adminNote: ""
    });
    setMessageModal({ mode: "add" });
  };

  const openEditMessageModal = (m) => {
    setMessageForm({
      id: m.id,
      firstName: m.first_name || "",
      lastName: m.last_name || "",
      phone: m.phone || "",
      subject: m.subject || "Umumiy savol",
      message: m.message || "",
      status: m.status || "new",
      adminNote: m.admin_note || ""
    });
    setMessageModal({ mode: "edit", data: m });
  };

  const openUserFromBooking = (b) => {
    const matchedRes =
      (b.resident_id && overview.residents.find((r) => r.id === b.resident_id)) ||
      overview.residents.find((r) => r.studentName.toLowerCase() === b.student_name.toLowerCase());
    if (matchedRes) return openEditResidentModal(matchedRes);

    const matchedAcc =
      (b.student_account_id && overview.students.find((s) => s.id === b.student_account_id)) ||
      overview.students.find((s) => `${s.firstName} ${s.lastName}`.toLowerCase() === b.student_name.toLowerCase());
    if (matchedAcc) return openEditAccountModal(matchedAcc);

    showToast("Bu foydalanuvchi hali xonaga joylashtirilmagan — avval Qabul qilish tugmasini bosing.");
  };

  const openChatFromBooking = (b) => {
    const cleanPhone = (b.phone || "").replace(/\D/g, "");
    const existingChat = (overview.chats || []).find(
      (c) =>
        c.bookingId === b.id ||
        (b.student_account_id && c.studentAccountId === b.student_account_id) ||
        (cleanPhone && (c.phone || "").replace(/\D/g, "") === cleanPhone) ||
        c.studentName.toLowerCase() === b.student_name.toLowerCase()
    );
    if (existingChat) {
      setSelectedChatId(existingChat.id);
    }
    setSection("chats");
  };

  const handleResidentSubmit = async (e) => {
    e.preventDefault();
    const isEdit = residentModal?.mode === "edit";
    const ok = await runAdminRequest({
      url: isEdit ? `/api/admin/residents/${residentModal.data.id}` : "/api/admin/residents",
      method: isEdit ? "PATCH" : "POST",
      body: { ...resForm, dormRoomId: Number(resForm.dormRoomId) },
      busyKey: "save-resident",
      successMsg: isEdit ? "Talaba ma’lumotlari yangilandi!" : "Talaba xonaga joylashtirildi!"
    });
    if (ok) setResidentModal(null);
  };

  const unreadChatsCount = useMemo(
    () => (overview.chats || []).reduce((s, c) => s + (c.unreadAdmin || 0), 0),
    [overview.chats]
  );

  const navItems = [
    { id: "dashboard", label: "Umumiy holat", icon: LayoutDashboard, badge: null },
    { id: "activity", label: "Ishlar jurnali (Nazorat)", icon: Activity, badge: (overview.activityLogs || []).length || null },
    { id: "bookings", label: "Yangi so‘rovlar", icon: CalendarDays, badge: totals.pendingBookings || null, tone: totals.pendingBookings ? "is-warn" : "" },
    { id: "chats", label: "Chatlar (Support)", icon: MessageSquare, badge: unreadChatsCount || (overview.chats || []).length || null, tone: unreadChatsCount ? "is-alert" : "" },
    { id: "dormRooms", label: "Xonalar va joylar", icon: DoorOpen, badge: overview.dormRooms.length },
    { id: "residents", label: "Talabalar va Akkauntlar", icon: Users, badge: overview.residents.length },
    { id: "payments", label: "To‘lovlar va moliya", icon: CreditCard, badge: totals.overduePayCount || null, tone: totals.overduePayCount ? "is-alert" : "" },
    { id: "maintenance", label: "Texnik xizmat", icon: Wrench, badge: totals.openMaintCount || null, tone: totals.openMaintCount ? "is-warn" : "" },
    { id: "announcements", label: "E’lonlar va Xabarlar", icon: Megaphone, badge: overview.announcements.length + overview.messages.length },
    { id: "galleryManager", label: "Fotogalereya & Bo‘limlar", icon: ImageIcon, badge: (overview.gallery || []).length || null },
    { id: "siteContent", label: "Sayt, Qulayliklar & FAQ", icon: Globe, badge: (overview.faqs || []).length + (overview.facilities || []).length || null },
    { id: "database", label: "Ma’lumotlar bazasi (DB)", icon: Database, badge: null }
  ];

  const sectionMeta = {
    dashboard: { title: "Boshqaruv Paneli — Umumiy Ko‘rinish", subtitle: "Qavatlar bo‘yicha xona bandligi, kutilayotgan arizalar, texnik holat va admin faoliyatini nazorat qiling." },
    activity: { title: "Ishboshqaruvchi Nazorati — Admin Ishlar Jurnali", subtitle: "Admin nima yaratdi, nima tahrirladi, nima o‘chirdi va qaysi klientlar bilan bog‘langanini to‘liq ko‘ring." },
    bookings: { title: "Kelib Tushgan Bron So‘rovlari", subtitle: "Yangi ariza yarating, mavjudlarini tahrirlang, o‘chiring yoki tasdiqlab bo‘sh xonaga joylashtiring." },
    chats: { title: "Foydalanuvchilar bilan Support Chatlar", subtitle: "Yangi chat boshlang, talabalar savollariga javob bering, xabarlarni tahrirlang yoki o‘chiring." },
    dormRooms: { title: "Xona Raqamlari va Umumiy Fond", subtitle: "Xona turlari va raqamlangan xonalarni (201, 301, 401...) yarating, tahrirlang va o‘chiring." },
    residents: { title: "Talabalar Reestri va Portal Akkauntlari", subtitle: "Yashovchi talabalar va talaba portal akkauntlarini yarating, tahrirlang, o‘chiring hamda CSV yuklang." },
    payments: { title: "Oylik To‘lovlar va Moliya Nazorati", subtitle: "To‘lovlarni yarating, tahrirlang, o‘chiring, tasdiqlang va qarzdorlarga eslatma yuboring." },
    maintenance: { title: "Texnik Xizmat va Ta’mirlash", subtitle: "Texnik arizalarni yarating, tahrirlang, holatini yangilang va o‘chiring." },
    announcements: { title: "E’lonlar, Portal Akkauntlari va Aloqa Xabarlari", subtitle: "E’lonlar, talaba akkauntlari va aloqa murojaatlarini to‘liq yarating, tahrirlang va o‘chiring." },
    galleryManager: { title: "Fotogalereya Bo‘limlari, Rasmlari va Pastki Gaplar", subtitle: "Fotogalereyada bo‘limlar, rasmlar va rasm ostidagi gaplarni yarating, tahrirlang va o‘chiring." },
    siteContent: { title: "Bosh Sahifa, Qulayliklar, Pastki Gaplar va FAQ", subtitle: "Bosh sahifa matnlari, Hero rasmlar, Qulayliklar (Facilities), pastki gaplar va FAQ bo‘limini to‘liq boshqaring." },
    database: { title: "Ma’lumotlar Bazasi (SQLite) Boshqaruvi", subtitle: "Barcha jadvallarni ko‘ring, qatorlarni qo‘shing, tahrirlang, o‘chiring va baza butunligini tekshiring." }
  };

  return (
    <div className="section-wrap admin-erp-wrap">
      <div className="admin-erp-shell">
        <AdminSidebar
          adminAccount={adminAccount}
          showAdminCreds={showAdminCreds}
          setShowAdminCreds={setShowAdminCreds}
          onEditAdminAccount={openEditAccountModal}
          navItems={navItems}
          section={section}
          setSection={setSection}
          totals={totals}
        />

        <main className="admin-workspace">
          <div className="admin-workspace-head">
            <div>
              <h1>{sectionMeta[section].title}</h1>
              <p>{sectionMeta[section].subtitle}</p>
            </div>
            <div className="admin-workspace-actions">
              {(section === "dashboard" || section === "dormRooms") && (
                <>
                  <button type="button" className="btn btn-outline btn-sm" onClick={openNewRoomTypeModal}><Plus size={14} /> Yangi xona turi & narx</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRoomModalOpen(true)}><Plus size={14} /> Yangi xona raqami</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddResidentModal()}><Plus size={14} /> Talaba joylashtirish</button>
                </>
              )}
              {section === "bookings" && (
                <button type="button" className="btn btn-primary btn-sm" onClick={openNewBookingModal}>
                  <Plus size={14} /> Yangi ariza qo‘shish
                </button>
              )}
              {section === "residents" && (
                <>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { downloadResidentsCsv(filteredResidents); showToast("Talabalar ro‘yxati CSV faylga yuklandi!"); }}>
                    <Download size={14} /> Excel / CSV yuklash
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={openNewAccountModal}><Plus size={14} /> Talaba akkaunti</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddResidentModal()}><Plus size={14} /> Xonaga joylashtirish</button>
                </>
              )}
              {section === "payments" && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddResidentModal()}>
                  <Plus size={14} /> Yangi talaba / to‘lov
                </button>
              )}
              {section === "maintenance" && (
                <button type="button" className="btn btn-primary btn-sm" onClick={openNewMaintModal}><Plus size={14} /> Texnik ariza qo‘shish</button>
              )}
              {section === "announcements" && (
                <>
                  <button type="button" className="btn btn-outline btn-sm" onClick={openNewMessageModal}>
                    <Plus size={14} /> Yangi murojaat
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={openNewAccountModal}>
                    <Plus size={14} /> Yangi talaba akkaunti
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setAnnForm({ title: "", category: "Umumiy", audience: "Barcha qavatlar", content: "", pinned: false });
                      setAnnModalOpen(true);
                    }}
                  >
                    <Plus size={14} /> Yangi e’lon joylash
                  </button>
                </>
              )}
              <button type="button" className="btn btn-outline btn-sm" onClick={loadOverview} disabled={loading}>
                {loading ? "Yangilanmoqda..." : "Yangilash"}
              </button>
            </div>
          </div>

          {error && <div className="auth-error-alert" role="alert">{error}</div>}

          {section === "dashboard" && <DashboardView overview={overview} totals={totals} roomsByFloor={roomsByFloor} onInspectRoom={setInspectedRoomId} onNavigate={setSection} busyId={busyId} runAdminRequest={runAdminRequest} />}
          {section === "activity" && <AdminActivityLogSection overview={overview} showToast={showToast} />}
          {section === "bookings" && <AdminBookingsSection overview={overview} totals={totals} busyId={busyId} runAdminRequest={runAdminRequest} onOpenUserFromBooking={openUserFromBooking} onOpenChatFromBooking={openChatFromBooking} onNewBooking={openNewBookingModal} onEditBooking={openEditBookingModal} onLogContact={logClientContact} />}
          {section === "chats" && <AdminChatsSection overview={overview} busyId={busyId} runAdminRequest={runAdminRequest} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} onLogContact={logClientContact} />}
          {section === "dormRooms" && (
            <AdminRoomsSection
              overview={overview}
              totals={totals}
              roomEdits={roomEdits}
              setRoomEdits={setRoomEdits}
              busyId={busyId}
              runAdminRequest={runAdminRequest}
              onInspectRoom={setInspectedRoomId}
              onAddResident={openAddResidentModal}
              onEditResident={openEditResidentModal}
              onOpenNewRoomType={openNewRoomTypeModal}
              onOpenEditRoomType={openEditRoomTypeModal}
              onOpenNewDormRoom={() => setRoomModalOpen(true)}
              showToast={showToast}
            />
          )}
          {section === "residents" && <AdminResidentsSection overview={overview} totals={totals} filteredResidents={filteredResidents} residentSearch={residentSearch} setResidentSearch={setResidentSearch} paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter} courseFilter={courseFilter} setCourseFilter={setCourseFilter} busyId={busyId} runAdminRequest={runAdminRequest} onEditResident={openEditResidentModal} onEditAccount={openEditAccountModal} onNewAccount={openNewAccountModal} onLogContact={logClientContact} showToast={showToast} />}
          {section === "payments" && <AdminPaymentsSection overview={overview} totals={totals} busyId={busyId} runAdminRequest={runAdminRequest} onEditResident={openEditResidentModal} onLogContact={logClientContact} showToast={showToast} />}
          {section === "maintenance" && <AdminMaintenanceSection overview={overview} busyId={busyId} runAdminRequest={runAdminRequest} onEditMaintenance={openEditMaintModal} />}
          {section === "announcements" && <AdminCommunitySection overview={overview} busyId={busyId} runAdminRequest={runAdminRequest} onEditAccount={openEditAccountModal} onNewAccount={openNewAccountModal} onEditAnnouncement={openEditAnnouncementModal} onNewMessage={openNewMessageModal} onEditMessage={openEditMessageModal} onLogContact={logClientContact} showToast={showToast} />}
          {section === "galleryManager" && <AdminSiteContentSection overview={overview} busyId={busyId} runAdminRequest={runAdminRequest} showToast={showToast} initialTab="gallery" />}
          {section === "siteContent" && <AdminSiteContentSection overview={overview} busyId={busyId} runAdminRequest={runAdminRequest} showToast={showToast} initialTab="homepage" />}
          {section === "database" && <AdminDatabaseSection showToast={showToast} onSessionExpired={onSessionExpired} onOverviewRefresh={loadOverview} />}
        </main>
      </div>

      <AdminModals
        overview={overview} busyId={busyId} runAdminRequest={runAdminRequest} onAdminSync={onAdminSync}
        inspectedRoom={inspectedRoom} setInspectedRoomId={setInspectedRoomId}
        openAddResidentModal={openAddResidentModal} openEditResidentModal={openEditResidentModal}
        roomModalOpen={roomModalOpen} setRoomModalOpen={setRoomModalOpen} newRoomForm={newRoomForm} setNewRoomForm={setNewRoomForm}
        roomTypeModal={roomTypeModal} setRoomTypeModal={setRoomTypeModal} roomTypeForm={roomTypeForm} setRoomTypeForm={setRoomTypeForm}
        residentModal={residentModal} setResidentModal={setResidentModal} resForm={resForm} setResForm={setResForm} handleResidentSubmit={handleResidentSubmit}
        bookingModal={bookingModal} setBookingModal={setBookingModal} bookingForm={bookingForm} setBookingForm={setBookingForm}
        maintModalOpen={maintModalOpen} setMaintModalOpen={setMaintModalOpen} maintForm={maintForm} setMaintForm={setMaintForm}
        annModalOpen={annModalOpen} setAnnModalOpen={setAnnModalOpen} annForm={annForm} setAnnForm={setAnnForm}
        messageModal={messageModal} setMessageModal={setMessageModal} messageForm={messageForm} setMessageForm={setMessageForm}
        accountModal={accountModal} setAccountModal={setAccountModal} accountForm={accountForm} setAccountForm={setAccountForm}
        showToast={showToast}
      />
    </div>
  );
}
