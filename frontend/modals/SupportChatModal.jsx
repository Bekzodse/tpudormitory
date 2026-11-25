import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Phone, Send, ShieldCheck, Sparkles, UserCircle, X } from "lucide-react";

const SAMPLE_QUESTIONS = [
  "Assalomu alaykum! Arizam qachon ko‘rib chiqiladi?",
  "Shartnoma tuzish uchun qanday hujjatlar bilan borishim kerak?",
  "Oylik to‘lovni bo‘lib to‘lasam yoki Payme orqali o‘tkazsam bo‘ladimi?",
  "Do‘stim bilan bitta xonaga joylashishim mumkinmi?"
];

export default function SupportChatModal({
  isOpen,
  onClose,
  student,
  chatSession,
  setChatSession
}) {
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [guestInfo, setGuestInfo] = useState({
    studentName: chatSession?.studentName || (student ? `${student.firstName} ${student.lastName}` : ""),
    phone: chatSession?.phone || student?.phone || "",
    course: chatSession?.course || student?.course || "1-kurs"
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setGuestInfo((prev) => ({
      studentName: chatSession?.studentName || (student ? `${student.firstName} ${student.lastName}` : prev.studentName),
      phone: chatSession?.phone || student?.phone || prev.phone,
      course: chatSession?.course || student?.course || prev.course
    }));
  }, [chatSession, student]);

  const fetchChat = async (silent = false) => {
    const params = new URLSearchParams();
    if (chatSession?.threadKey) params.set("threadKey", chatSession.threadKey);
    if (chatSession?.bookingId) params.set("bookingId", String(chatSession.bookingId));
    const ph = chatSession?.phone || student?.phone || guestInfo.phone;
    if (ph) params.set("phone", ph);

    if (!params.toString() && !student) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/support/chat?${params.toString()}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.chat) {
          setChat(data.chat);
          if (!chatSession?.threadKey && data.chat.threadKey) {
            const nextSess = {
              threadKey: data.chat.threadKey,
              bookingId: data.chat.bookingId,
              studentName: data.chat.studentName,
              phone: data.chat.phone,
              course: data.chat.course,
              roomTitle: data.chat.roomTitle
            };
            setChatSession(nextSess);
          }
        }
      }
    } catch {
      // ignore polling error
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchChat(false);
    const timer = setInterval(() => fetchChat(true), 3000);
    return () => clearInterval(timer);
  }, [isOpen, chatSession?.threadKey, chatSession?.bookingId, student?.id]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages?.length, isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (e, customText) => {
    if (e) e.preventDefault();
    const textToSend = (customText ?? messageText).trim();
    if (!textToSend) return;

    const finalName = (guestInfo.studentName || (student ? `${student.firstName} ${student.lastName}` : "")).trim();
    const finalPhone = (guestInfo.phone || student?.phone || "").trim();
    if (!finalName || finalPhone.replace(/\D/g, "").length < 7) {
      setError("Adminga savol yuborish uchun ismingiz va telefon raqamingizni kiriting.");
      return;
    }

    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          threadKey: chat?.threadKey || chatSession?.threadKey,
          bookingId: chat?.bookingId || chatSession?.bookingId,
          studentName: finalName,
          phone: finalPhone,
          course: guestInfo.course,
          roomTitle: chat?.roomTitle || chatSession?.roomTitle || "",
          message: textToSend
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xabar yuborib bo‘lmadi.");
      setChat(data.chat);
      setMessageText("");
      const nextSess = {
        threadKey: data.chat.threadKey,
        bookingId: data.chat.bookingId,
        studentName: data.chat.studentName,
        phone: data.chat.phone,
        course: data.chat.course,
        roomTitle: data.chat.roomTitle
      };
      setChatSession(nextSess);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const hasIdentity =
    Boolean(chat) ||
    Boolean(student) ||
    (Boolean(guestInfo.studentName.trim()) && guestInfo.phone.replace(/\D/g, "").length >= 7);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card support-chat-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="support-chat-header">
          <div className="support-chat-header-left">
            <span className="support-chat-avatar">
              <MessageSquare size={20} />
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3>TPU Yotoqxona Support Chat</h3>
                <span className="support-online-badge">
                  <i className="status-dot" /> Admin onlayn
                </span>
              </div>
              <small>
                {chat?.assignedRoomNumber
                  ? `Siz ${chat.assignedRoomNumber}-xonaga biriktirilgansiz • Ma’muriyat bilan to‘g‘ridan-to‘g‘ri muloqot`
                  : chat?.roomTitle
                  ? `Ariza: ${chat.roomTitle.replace(/^\d+\s*\/\s*/, "")} • Savollaringizga admin javob beradi`
                  : "Ariza holati, shartnoma va xonalar bo‘yicha adminga savol yozing"}
              </small>
            </div>
          </div>
          <button className="modal-close-btn" style={{ position: "static" }} onClick={onClose} aria-label="Yopish">
            <X size={20} />
          </button>
        </header>

        {!student && !chat && (
          <div className="support-guest-bar">
            <label className="input-group">
              <span>Ism va familiyangiz *</span>
              <input
                type="text"
                placeholder="Sardor Aliyev"
                value={guestInfo.studentName}
                onChange={(e) => setGuestInfo((p) => ({ ...p, studentName: e.target.value }))}
              />
            </label>
            <label className="input-group">
              <span>Telefon raqamingiz *</span>
              <input
                type="tel"
                placeholder="+998 90 123 45 67"
                value={guestInfo.phone}
                onChange={(e) => setGuestInfo((p) => ({ ...p, phone: e.target.value }))}
              />
            </label>
          </div>
        )}

        <div className="support-chat-body">
          {loading && !chat ? (
            <div className="admin-dorm-empty">Yuklanmoqda...</div>
          ) : !chat || (chat.messages || []).length === 0 ? (
            <div className="support-welcome-card">
              <Sparkles size={22} color="var(--blue-primary)" />
              <h4>Ma’muriyat bilan to‘g‘ridan-to‘g‘ri chat</h4>
              <p>
                Arizangiz holati, xonaga joylashish, shartnoma yoki to‘lovlar bo‘yicha savolingizni yozing.
                Savolingiz darhol Admin paneldagi <b>&ldquo;Chatlar&rdquo;</b> bo‘limiga tushadi va administrator javob qaytaradi.
              </p>
              <div className="support-sample-questions">
                {SAMPLE_QUESTIONS.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="support-sample-btn"
                    onClick={() => {
                      if (hasIdentity) sendMessage(null, sq);
                      else setMessageText(sq);
                    }}
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="support-messages-list">
              {chat.messages.map((m) => {
                const isStudent = m.senderRole === "student";
                return (
                  <div
                    key={m.id}
                    className={`chat-bubble-row ${isStudent ? "is-admin" : "is-student"}`}
                  >
                    <div className={`chat-bubble ${isStudent ? "is-admin" : "is-student"}`}>
                      <div className="chat-bubble-head">
                        <b>{isStudent ? `${m.senderName} (Siz)` : `🛡️ ${m.senderName}`}</b>
                        <small>{new Date(m.createdAt + "Z").toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</small>
                      </div>
                      <p>{m.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && <div className="auth-error-alert" style={{ margin: "0 18px 10px" }}>{error}</div>}

        <form className="support-chat-footer" onSubmit={(e) => sendMessage(e)}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Adminga savolingizni yozing..."
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !messageText.trim()}>
            <Send size={15} />
            <span>{sending ? "Yuborilmoqda..." : "Yuborish"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
