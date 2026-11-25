import React, { useEffect, useMemo, useState } from "react";
import { DoorOpen, MessageSquare, Phone, Send, Trash2, UserCircle } from "lucide-react";
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
  setSelectedChatId
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [replyText, setReplyText] = useState("");

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
  }, [activeChat?.id]);

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

      <div className="admin-chat-messenger">
        <aside className="admin-chat-sidebar">
          <div className="admin-chat-sidebar-head">
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
                    <a href={`tel:${activeChat.phone.replace(/\s+/g, "")}`} className="booking-contact-link">
                      <Phone size={13} /> {activeChat.phone}
                    </a>
                  )}
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

              <div className="admin-chat-messages-box">
                {(activeChat.messages || []).length === 0 ? (
                  <div className="admin-dorm-empty">Hali xabarlar yo‘q. Birinchi bo‘lib yozishingiz mumkin.</div>
                ) : (
                  activeChat.messages.map((m) => {
                    const isAdmin = m.senderRole === "admin";
                    return (
                      <div
                        key={m.id}
                        className={`chat-bubble-row ${isAdmin ? "is-admin" : "is-student"}`}
                      >
                        <div className={`chat-bubble ${isAdmin ? "is-admin" : "is-student"}`}>
                          <div className="chat-bubble-head">
                            <b>{m.senderName}</b>
                            <small>{new Date(m.createdAt + "Z").toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</small>
                          </div>
                          <p>{m.message}</p>
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
