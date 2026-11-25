package uz.tpu.dormitory.routes;

import com.sun.net.httpserver.HttpExchange;
import uz.tpu.dormitory.db.DormitoryDatabase;
import uz.tpu.dormitory.models.DormModels.*;
import uz.tpu.dormitory.utils.AuthService;
import uz.tpu.dormitory.utils.AuthService.SessionEntry;
import uz.tpu.dormitory.utils.JsonHelper;

import java.io.IOException;
import java.util.Map;

public class PublicRoutes {

    private final DormitoryDatabase db;

    public PublicRoutes(DormitoryDatabase db) {
        this.db = db;
    }

    public void handle(HttpExchange exchange, String path, String method) throws IOException {
        if ("/api/rooms".equals(path) && "GET".equals(method)) {
            handleGetRooms(exchange);
        } else if ("/api/bookings".equals(path) && "POST".equals(method)) {
            handleCreateBooking(exchange);
        } else if ("/api/contact".equals(path) && "POST".equals(method)) {
            handleCreateContact(exchange);
        } else if ("/api/support/chat".equals(path) && "GET".equals(method)) {
            handleGetSupportChat(exchange);
        } else if ("/api/support/message".equals(path) && "POST".equals(method)) {
            handleSendSupportMessage(exchange);
        } else {
            JsonHelper.sendError(exchange, 404, "Public endpoint topilmadi.");
        }
    }

    private void handleGetRooms(HttpExchange exchange) throws IOException {
        StringBuilder roomsJson = new StringBuilder("[");
        for (int i = 0; i < db.rooms.size(); i++) {
            if (i > 0) roomsJson.append(",");
            roomsJson.append(db.roomInventoryToJson(db.rooms.get(i)));
        }
        roomsJson.append("]");

        StringBuilder faqsJson = new StringBuilder("[");
        for (int i = 0; i < db.faqs.size(); i++) {
            if (i > 0) faqsJson.append(",");
            FaqItem f = db.faqs.get(i);
            faqsJson.append("{\"id\":").append(f.id)
                    .append(",\"q\":").append(JsonHelper.quote(f.q))
                    .append(",\"a\":").append(JsonHelper.quote(f.a)).append("}");
        }
        faqsJson.append("]");

        JsonHelper.sendJson(exchange, 200, "{"
                + "\"rooms\":" + roomsJson + ","
                + "\"gallery\":" + db.galleryToJson() + ","
                + "\"galleryCategories\":" + db.galleryCategoriesToJson() + ","
                + "\"bottomTexts\":" + db.bottomTextsToJson() + ","
                + "\"faqs\":" + faqsJson + ","
                + "\"availableImages\":" + JsonHelper.stringListJson(db.getAvailableImages())
                + "}");
    }

    private void handleCreateBooking(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String name = JsonHelper.getString(body, "name", "").trim();
        String phone = JsonHelper.getString(body, "phone", "").trim();
        if (name.isEmpty() || phone.replaceAll("\\D+", "").length() < 7) {
            JsonHelper.sendError(exchange, 400, "Ism-familiya va telefon raqamingizni to‘liq kiriting.");
            return;
        }

        Booking b = new Booking();
        b.id = db.bookingSeq.incrementAndGet();
        b.roomId = JsonHelper.getLong(body, "roomId", 1L);
        b.roomTitle = JsonHelper.getString(body, "roomTitle", "01 / 2 Kishilik Yotoqxona");
        b.roomCategory = "two";
        b.studentName = name;
        b.phone = phone;
        b.telegram = JsonHelper.getString(body, "telegram", "");
        b.course = JsonHelper.getString(body, "course", "1-kurs");
        b.age = JsonHelper.getInt(body, "age", 20);
        b.moveInDate = JsonHelper.getString(body, "date", "");
        b.duration = JsonHelper.getString(body, "duration", "1 semestr");
        b.notes = JsonHelper.getString(body, "notes", "");
        b.preferredRoomNumber = JsonHelper.getString(body, "preferredRoomNumber", "");
        SessionEntry sess = AuthService.getSession(exchange);
        b.studentAccountId = sess != null ? sess.accountId() : null;
        b.status = "pending";
        b.createdAt = DormitoryDatabase.nowIso();
        b.updatedAt = b.createdAt;
        db.bookings.add(b);

        SupportChat chat = findOrCreateChat("booking-" + b.id, name, phone, b.course, b.roomTitle, b.id, b.studentAccountId);
        if (chat.messages.isEmpty()) {
            String welcome = "Assalomu alaykum, " + name + "! Arizangiz qabul qilindi. Savollaringizni shu chatda yozishingiz mumkin.";
            chat.messages.add(new ChatMessage(db.chatMsgSeq.incrementAndGet(), chat.id, "admin", "TPU Support", welcome, DormitoryDatabase.nowIso()));
            chat.lastMessage = welcome;
        }

        JsonHelper.sendJson(exchange, 201, "{"
                + "\"booking\":{\"id\":" + b.id + ",\"status\":\"pending\"},"
                + "\"chat\":" + db.supportChatToJson(chat) + ","
                + "\"message\":\"Arizangiz bazaga saqlandi!\""
                + "}");
    }

    private void handleCreateContact(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        ContactMessage m = new ContactMessage();
        m.id = db.msgSeq.incrementAndGet();
        m.firstName = JsonHelper.getString(body, "firstName", "").trim();
        m.lastName = JsonHelper.getString(body, "lastName", "").trim();
        m.phone = JsonHelper.getString(body, "phone", "").trim();
        m.subject = JsonHelper.getString(body, "subject", "Umumiy savol").trim();
        m.message = JsonHelper.getString(body, "message", "").trim();
        m.status = "new";
        m.createdAt = DormitoryDatabase.nowIso();
        db.messages.add(m);
        JsonHelper.sendJson(exchange, 201, "{\"id\":" + m.id + ",\"message\":\"Xabaringiz saqlandi.\"}");
    }

    private void handleGetSupportChat(HttpExchange exchange) throws IOException {
        Map<String, String> q = JsonHelper.parseQuery(exchange.getRequestURI().getRawQuery());
        String threadKey = q.get("threadKey");
        String phone = q.get("phone");
        SupportChat found = null;
        for (SupportChat c : db.chats) {
            if ((threadKey != null && threadKey.equals(c.threadKey))
                    || (phone != null && !phone.isBlank() && c.phone.equals(phone))) {
                found = c;
                break;
            }
        }
        if (found == null) {
            JsonHelper.sendJson(exchange, 200, "{\"chat\":null}");
            return;
        }
        found.unreadStudent = 0;
        JsonHelper.sendJson(exchange, 200, "{\"chat\":" + db.supportChatToJson(found) + "}");
    }

    private void handleSendSupportMessage(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String msg = JsonHelper.getString(body, "message", "").trim();
        if (msg.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Xabar matnini kiriting.");
            return;
        }
        String threadKey = JsonHelper.getString(body, "threadKey", null);
        String studentName = JsonHelper.getString(body, "studentName", "Talaba");
        String phone = JsonHelper.getString(body, "phone", "");
        String course = JsonHelper.getString(body, "course", "1-kurs");
        String roomTitle = JsonHelper.getString(body, "roomTitle", "");
        Long bookingId = JsonHelper.getLong(body, "bookingId", null);
        SessionEntry sess = AuthService.getSession(exchange);

        SupportChat chat = findOrCreateChat(threadKey, studentName, phone, course, roomTitle, bookingId, sess != null ? sess.accountId() : null);
        chat.messages.add(new ChatMessage(db.chatMsgSeq.incrementAndGet(), chat.id, "student", studentName, msg, DormitoryDatabase.nowIso()));
        chat.lastMessage = msg;
        chat.unreadAdmin += 1;
        chat.updatedAt = DormitoryDatabase.nowIso();

        JsonHelper.sendJson(exchange, 201, "{\"chat\":" + db.supportChatToJson(chat) + ",\"message\":\"Savolingiz adminga yuborildi!\"}");
    }

    private SupportChat findOrCreateChat(String threadKey, String name, String phone, String course, String roomTitle, Long bookingId, Long accountId) {
        for (SupportChat c : db.chats) {
            if ((threadKey != null && threadKey.equals(c.threadKey))
                    || (bookingId != null && bookingId.equals(c.bookingId))
                    || (!phone.isBlank() && phone.equals(c.phone))) {
                return c;
            }
        }
        SupportChat created = new SupportChat();
        created.id = db.chatSeq.incrementAndGet();
        created.threadKey = threadKey != null && !threadKey.isBlank() ? threadKey : "chat-" + created.id;
        created.studentName = name;
        created.phone = phone;
        created.course = course;
        created.roomTitle = roomTitle;
        created.assignedRoomNumber = "";
        created.bookingId = bookingId;
        created.studentAccountId = accountId;
        created.status = "open";
        created.createdAt = DormitoryDatabase.nowIso();
        created.updatedAt = created.createdAt;
        db.chats.add(created);
        return created;
    }
}
