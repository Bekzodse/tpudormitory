import React, { useEffect, useMemo, useState } from "react";
import { Check, DoorOpen, MessageSquare, Pencil, Phone, Plus, Send, Trash2, X } from "lucide-react";
import { SectionTotalsBar } from "../utils/AdminHelpers";

const QUICK_REPLIES = [
  "Tabriklaymiz! Arizangiz qabul qilindi. Shartnoma rasmiylashtirish uchun pasportingiz bilan 1-qavat ma’muriyatga keling.",
  "Yotoqxona to‘lovini Payme, Click yoki bank rekvizitlari orqali amalga oshirishingiz mumkin.",
  "Xonangiz tayyor holatda, belgilangan sanada ko‘chib kelishingiz mumkin.",
  "Savolingiz bo‘yicha ma’muriyat xodimi tez orada siz bilan telefon orqali bog‘lanadi."
];

export default function AdminChatsSection({
  overview,
  busyId,
  runAdminRequest,
  selectedChatId,
  setSelectedChatId,
  onLogContact
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [replyText, setReplyText] = useState("");

  // Create new chat form state
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatForm, setNewChatForm] = useState({
    studentName: "",
    phone: "+998 ",
    course: "1-kurs",
    assignedRoomNumber: "",
    initialMessage: ""
  });

  // Edit active chat info state
  const [editingChatInfo, setEditingChatInfo] = useState(false);
  const [chatInfoDraft, setChatInfoDraft] = useState({
    studentName: "",
    phone: "",
    course: "",
    assignedRoomNumber: "",
    status: "open"
  });

  // Edit individual message state
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingMsgText, setEditingMsgText] = useState("");

  const chats = overview.chats || [];

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chats.filter((c) => {
      if (filterMode === "unread" && !c.unreadAdmin) return false;
      if (!q) return true;
      return (
        c.studentName.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.roomTitle || "").toLowerCase().includes(q) ||
        (c.assignedRoomNumber || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q)
      );
    });
  }, [chats, searchQuery, filterMode]);

  const activeChat = useMemo(() => {
    if (selectedChatId) {
      const found = chats.find((c) => c.id === selectedChatId);
      if (found) return found;
    }
    return filteredChats[0] || chats[0] || null;
  }, [chats, filteredChats, selectedChatId]);

  useEffect(() => {
    if (activeChat && activeChat.unreadAdmin > 0) {
      runAdminRequest({
        url: `/api/admin/chats/${activeChat.id}/read`,
        method: "POST",
        busyKey: `read-chat-${activeChat.id}`
      });
    }
    setEditingChatInfo(false);
    setEditingMsgId(null);
  }, [activeChat?.id]);

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatForm.studentName.trim()) return;
    const res = await runAdminRequest({
      url: "/api/admin/chats",
      method: "POST",
      body: newChatForm,
      busyKey: "create-chat",
      successMsg: `${newChatForm.studentName} bilan yangi chat yaratildi!`
    });
    if (res) {
      if (res.chat?.id) setSelectedChatId(res.chat.id);
      setNewChatForm({ studentName: "", phone: "+998 ", course: "1-kurs", assignedRoomNumber: "", initialMessage: "" });
      setShowNewChatForm(false);
    }
  };

  const handleSaveChatInfo = async (e) => {
    e.preventDefault();
    if (!activeChat) return;
    const ok = await runAdminRequest({
      url: `/api/admin/chats/${activeChat.id}`,
      method: "PATCH",
      body: chatInfoDraft,
      busyKey: `edit-chat-${activeChat.id}`,
      successMsg: "Chat ma’lumotlari yangilandi!"
    });
    if (ok) setEditingChatInfo(false);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeChat || !replyText.trim()) return;
    const text = replyText.trim();
    setReplyText("");
    await runAdminRequest({
      url: `/api/admin/chats/${activeChat.id}/reply`,
      method: "POST",
      body: { message: text },
      busyKey: `reply-chat-${activeChat.id}`,
      successMsg: `${activeChat.studentName} ga javob yuborildi!`
    });
  };

  const unreadTotal = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "Jami suhbatlar (Chatlar)", value: `${chats.length} ta`, tone: "is-blue", sub: "Talabalar va arizachilar" },
          { label: "Yangi o‘qilmagan savollar", value: `${unreadTotal} ta`, tone: unreadTotal ? "is-red" : "is-green", sub: "Javob kutayotganlar" },
          {
            label: "Xonaga biriktirilganlar",
            value: `${chats.filter((c) => c.assignedRoomNumber).length} ta`,
            tone: "is-green",
            sub: "Tasdiqlangan talabalar"
          }
        ]}
      />

      {showNewChatForm && (
        <section className="admin-panel-card" style={{ marginBottom: 16 }}>
          <div className="admin-panel-card-head">
            <h2><Plus size={18} /> Yangi klient / talaba bilan chat boshlash</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNewChatForm(false)}>
              <X size={14} /> Yopish
            </button>
          </div>
          <form className="admin-modal-form" onSubmit={handleCreateChat}>
            <label className="input-group">
              <span>Klient / Talaba F.I.Sh. *</span>
              <input
                required
                placeholder="Masalan: Jasur Karimov"
                value={newChatForm.studentName}
                onChange={(e) => setNewChatForm((p) => ({ ...p, studentName: e.target.value }))}
              />
            </label>
            <label className="input-group">
              <span>Telefon raqami</span>
              <input
                placeholder="+998 90 123-45-67"
                value={newChatForm.phone}
                onChange={(e) => setNewChatForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </label>
            <label className="input-group">
              <span>Kursi</span>
              <input
                placeholder="1-kurs"
                value={newChatForm.course}
                onChange={(e) => setNewChatForm((p) => ({ ...p, course: e.target.value }))}
              />
            </label>
            <label className="input-group">
              <span>Xona raqami (ixtiyoriy)</span>
              <input
                placeholder="401"
                value={newChatForm.assignedRoomNumber}
                onChange={(e) => setNewChatForm((p) => ({ ...p, assignedRoomNumber: e.target.value }))}
              />
            </label>
            <label className="input-group is-full">
              <span>Birinchi xabar (ixtiyoriy)</span>
              <input
                placeholder="Assalomu alaykum! Siz bilan yotoqxona bo‘yicha bog‘lanyapmiz..."
                value={newChatForm.initialMessage}
                onChange={(e) => setNewChatForm((p) => ({ ...p, initialMessage: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm is-full" disabled={busyId === "create-chat"}>
              <Plus size={14} /> Chatni yaratish
            </button>
          </form>
        </section>
      )}

      <div className="admin-chat-messenger">
        <aside className="admin-chat-sidebar">
          <div className="admin-chat-sidebar-head">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
              onClick={() => setShowNewChatForm((v) => !v)}
            >
              <Plus size={14} /> Yangi chat yaratish
            </button>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Talaba ismi, telefon yoki xona..."
            />
            <div className="admin-chat-filter-row">
              <button
                type="button"
                className={`compare-tab-btn ${filterMode === "all" ? "active" : ""}`}
                onClick={() => setFilterMode("all")}
              >
                Barchasi ({chats.length})
              </button>
              <button
                type="button"
                className={`compare-tab-btn ${filterMode === "unread" ? "active" : ""}`}
                onClick={() => setFilterMode("unread")}
              >
                Yangi ({unreadTotal})
              </button>
            </div>
          </div>

          <div className="admin-chat-threads-list">
            {filteredChats.length === 0 ? (
              <div className="admin-dorm-empty" style={{ margin: 12 }}>
                Hozircha suhbatlar topilmadi
              </div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = activeChat?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`admin-chat-thread-item ${isSelected ? "active" : ""} ${c.unreadAdmin ? "has-unread" : ""}`}
                    onClick={() => setSelectedChatId(c.id)}
                  >
                    <span className="profile-initials">
                      {c.studentName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="admin-chat-thread-copy">
                      <div className="admin-chat-thread-top">
                        <strong>{c.studentName}</strong>
                        {c.unreadAdmin > 0 && (
                          <span className="admin-chat-unread-pill">{c.unreadAdmin}</span>
                        )}
                      </div>
                      <small className="admin-chat-thread-meta">
                        {c.assignedRoomNumber ? `${c.assignedRoomNumber}-xona` : c.roomTitle ? c.roomTitle.replace(/^\d+\s*\/\s*/, "") : "Talaba"}
                        {c.course ? ` • ${c.course}` : ""}
                      </small>
                      <p className="admin-chat-thread-preview">
                        {c.lastMessage || "Suhbat boshlangan"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="admin-chat-conversation">
          {!activeChat ? (
            <div className="admin-empty-box" style={{ margin: "auto" }}>
              <MessageSquare size={32} />
              <strong>Chap ro‘yxatdan foydalanuvchini tanlang</strong>
            </div>
          ) : (
            <>
              <header className="admin-chat-conv-header">
                <div className="booking-student-id">
                  <span className="profile-initials">
                    {activeChat.studentName.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h3>{activeChat.studentName}</h3>
                    <small>
                      {[
                        activeChat.course,
                        activeChat.roomTitle ? activeChat.roomTitle.replace(/^\d+\s*\/\s*/, "") : "",
                        activeChat.assignedRoomNumber ? `${activeChat.assignedRoomNumber}-xona` : ""
                      ]
                        .filter(Boolean)
                        .join(" • ") || "Ariza yuborgan foydalanuvchi"}
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {activeChat.assignedRoomNumber && (
                    <span className="pay-pill is-paid">
                      <DoorOpen size={12} /> {activeChat.assignedRoomNumber}-xona
                    </span>
                  )}
                  {activeChat.phone && (
                    <a
                      href={`tel:${activeChat.phone.replace(/\s+/g, "")}`}
                      className="booking-contact-link"
                      onClick={() =>
                        onLogContact &&
                        onLogContact({
                          section: "chats",
                          clientName: activeChat.studentName,
                          clientPhone: activeChat.phone,
                          channel: "Telefon qo‘ng‘irog‘i",
                          summary: `Support chat orqali ${activeChat.studentName} ga qo‘ng‘iroq qildi`
                        })
                      }
                    >
                      <Phone size={13} /> {activeChat.phone}
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="Chat klient ma’lumotlarini tahrirlash"
                    onClick={() => {
                      if (editingChatInfo) {
                        setEditingChatInfo(false);
                      } else {
                        setChatInfoDraft({
                          studentName: activeChat.studentName || "",
                          phone: activeChat.phone || "",
                          course: activeChat.course || "",
                          assignedRoomNumber: activeChat.assignedRoomNumber || "",
                          status: activeChat.status || "open"
                        });
                        setEditingChatInfo(true);
                      }
                    }}
                  >
                    <Pencil size={12} /> Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="avatar-remove-btn"
                    title="Suhbatni o‘chirish"
                    disabled={busyId === `del-chat-${activeChat.id}`}
                    onClick={() =>
                      runAdminRequest({
                        url: `/api/admin/chats/${activeChat.id}`,
                        method: "DELETE",
                        busyKey: `del-chat-${activeChat.id}`,
                        successMsg: "Suhbat o‘chirildi."
                      })
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </header>

              {editingChatInfo && (
                <form
                  className="admin-modal-form"
                  style={{ padding: "12px 16px", background: "#f7faff", borderBottom: "1px solid #e2ecfc", margin: 0 }}
                  onSubmit={handleSaveChatInfo}
                >
                  <label className="input-group">
                    <span>Ism-familiya</span>
                    <input
                      required
                      value={chatInfoDraft.studentName}
                      onChange={(e) => setChatInfoDraft((p) => ({ ...p, studentName: e.target.value }))}
                    />
                  </label>
                  <label className="input-group">
                    <span>Telefon</span>
                    <input
                      value={chatInfoDraft.phone}
                      onChange={(e) => setChatInfoDraft((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </label>
                  <label className="input-group">
                    <span>Kurs</span>
                    <input
                      value={chatInfoDraft.course}
                      onChange={(e) => setChatInfoDraft((p) => ({ ...p, course: e.target.value }))}
                    />
                  </label>
                  <label className="input-group">
                    <span>Biriktirilgan xona</span>
                    <input
                      value={chatInfoDraft.assignedRoomNumber}
                      onChange={(e) => setChatInfoDraft((p) => ({ ...p, assignedRoomNumber: e.target.value }))}
                    />
                  </label>
                  <div className="is-full" style={{ display: "flex", gap: 8 }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busyId === `edit-chat-${activeChat.id}`}>
                      <Check size={13} /> Saqlash
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingChatInfo(false)}>
                      Bekor
                    </button>
                  </div>
                </form>
              )}

              <div className="admin-chat-messages-box">
                {(activeChat.messages || []).length === 0 ? (
                  <div className="admin-dorm-empty">Hali xabarlar yo‘q. Birinchi bo‘lib yozishingiz mumkin.</div>
                ) : (
                  activeChat.messages.map((m) => {
                    const isAdmin = m.senderRole === "admin";
                    const isEditingThis = editingMsgId === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`chat-bubble-row ${isAdmin ? "is-admin" : "is-student"}`}
                      >
                        <div className={`chat-bubble ${isAdmin ? "is-admin" : "is-student"}`}>
                          <div className="chat-bubble-head">
                            <b>{m.senderName}</b>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <small>{new Date(m.createdAt + "Z").toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</small>
                              <button
                                type="button"
                                className="chat-msg-action-btn"
                                title="Xabarni tahrirlash"
                                onClick={() => {
                                  setEditingMsgId(m.id);
                                  setEditingMsgText(m.message);
                                }}
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                type="button"
                                className="chat-msg-action-btn"
                                title="Xabarni o‘chirish"
                                onClick={() =>
                                  runAdminRequest({
                                    url: `/api/admin/chats/${activeChat.id}/messages/${m.id}`,
                                    method: "DELETE",
                                    busyKey: `del-cmsg-${m.id}`,
                                    successMsg: "Xabar o‘chirildi."
                                  })
                                }
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          {isEditingThis ? (
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <input
                                type="text"
                                value={editingMsgText}
                                onChange={(e) => setEditingMsgText(e.target.value)}
                                style={{ flex: 1, padding: "4px 8px", borderRadius: 8, border: "1px solid #cbd5e1", color: "#0f172a" }}
                              />
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={async () => {
                                  const ok = await runAdminRequest({
                                    url: `/api/admin/chats/${activeChat.id}/messages/${m.id}`,
                                    method: "PATCH",
                                    body: { message: editingMsgText },
                                    busyKey: `edit-cmsg-${m.id}`,
                                    successMsg: "Xabar yangilandi!"
                                  });
                                  if (ok) setEditingMsgId(null);
                                }}
                              >
                                <Check size={12} />
                              </button>
                              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingMsgId(null)}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <p>{m.message}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="admin-chat-quick-strip">
                {QUICK_REPLIES.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="admin-quick-reply-chip"
                    onClick={() => setReplyText(qr)}
                  >
                    {qr.slice(0, 48)}...
                  </button>
                ))}
              </div>

              <form className="admin-chat-reply-form" onSubmit={handleSendReply}>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`${activeChat.studentName} savoliga javob yozing...`}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={busyId === `reply-chat-${activeChat.id}` || !replyText.trim()}
                >
                  <Send size={14} /> Javob yuborish
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
