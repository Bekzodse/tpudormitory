package uz.tpu.dormitory.routes;

import com.sun.net.httpserver.HttpExchange;
import uz.tpu.dormitory.db.DormitoryDatabase;
import uz.tpu.dormitory.models.DormModels.*;
import uz.tpu.dormitory.utils.AuthService;
import uz.tpu.dormitory.utils.AuthService.SessionEntry;
import uz.tpu.dormitory.utils.JsonHelper;

import java.io.IOException;

public class AdminRoutes {

    private final DormitoryDatabase db;

    public AdminRoutes(DormitoryDatabase db) {
        this.db = db;
    }

    private Account requireAdmin(HttpExchange exchange) throws IOException {
        SessionEntry sess = AuthService.getSession(exchange);
        if (sess == null) {
            JsonHelper.sendError(exchange, 401, "Avval tizimga kiring.");
            return null;
        }
        for (Account acc : db.accounts) {
            if (acc.id == sess.accountId() && "admin".equals(acc.role)) {
                return acc;
            }
        }
        JsonHelper.sendError(exchange, 403, "Faqat administrator uchun ruxsat berilgan.");
        return null;
    }

    public void handle(HttpExchange exchange, String path, String method) throws IOException {
        if (requireAdmin(exchange) == null) return;

        if ("/api/admin/overview".equals(path) && "GET".equals(method)) {
            handleOverview(exchange);
        } else if ("/api/admin/rooms".equals(path) && "POST".equals(method)) {
            handleCreateRoomType(exchange);
        } else if (path.startsWith("/api/admin/rooms/") && "PUT".equals(method)) {
            long id = Long.parseLong(path.substring("/api/admin/rooms/".length()));
            handleUpdateRoomType(exchange, id);
        } else if ("/api/admin/dorm-rooms".equals(path) && "POST".equals(method)) {
            handleCreateDormRoom(exchange);
        } else if ("/api/admin/upload-image".equals(path) && "POST".equals(method)) {
            handleUploadImage(exchange);
        } else if ("/api/admin/faqs".equals(path) && "POST".equals(method)) {
            handleCreateFaq(exchange);
        } else if (path.startsWith("/api/admin/faqs/") && "DELETE".equals(method)) {
            long id = Long.parseLong(path.substring("/api/admin/faqs/".length()));
            db.faqs.removeIf(f -> f.id == id);
            JsonHelper.sendJson(exchange, 200, "{\"message\":\"Savol-javob o‘chirildi.\"}");
        } else if (path.matches("/api/admin/chats/\\d+/reply") && "POST".equals(method)) {
            String[] parts = path.split("/");
            long chatId = Long.parseLong(parts[4]);
            handleChatReply(exchange, chatId);
        } else {
            JsonHelper.sendJson(exchange, 200, "{\"status\":\"ok\"}");
        }
    }

    private void handleOverview(HttpExchange exchange) throws IOException {
        StringBuilder roomsJson = new StringBuilder("[");
        for (int i = 0; i < db.rooms.size(); i++) {
            if (i > 0) roomsJson.append(",");
            roomsJson.append(db.roomInventoryToJson(db.rooms.get(i)));
        }
        roomsJson.append("]");

        StringBuilder chatsJson = new StringBuilder("[");
        for (int i = 0; i < db.chats.size(); i++) {
            if (i > 0) chatsJson.append(",");
            chatsJson.append(db.supportChatToJson(db.chats.get(i)));
        }
        chatsJson.append("]");

        JsonHelper.sendJson(exchange, 200, "{"
                + "\"rooms\":" + roomsJson + ","
                + "\"chats\":" + chatsJson + ","
                + "\"availableImages\":" + JsonHelper.stringListJson(db.getAvailableImages())
                + "}");
    }

    private void handleCreateRoomType(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String title = JsonHelper.getString(body, "title", "").trim();
        String priceRaw = JsonHelper.getString(body, "price", "1 000 000 so‘m").trim();
        long priceNum = JsonHelper.parsePriceDigits(priceRaw);
        if (title.isEmpty() || priceNum <= 0) {
            JsonHelper.sendError(exchange, 400, "Xona turi nomi va narxini kiriting.");
            return;
        }
        RoomInventory r = new RoomInventory();
        r.id = db.roomSeq.incrementAndGet();
        r.category = "type_" + r.id;
        r.title = title;
        r.priceNum = priceNum;
        r.price = priceRaw.contains("so") ? priceRaw : JsonHelper.formatPriceUzs(priceNum);
        r.spotsPerRoom = JsonHelper.getInt(body, "spotsPerRoom", 2);
        r.totalRooms = JsonHelper.getInt(body, "totalRooms", 10);
        r.occupiedSpots = JsonHelper.getInt(body, "occupiedSpots", 0);
        r.people = r.spotsPerRoom + " o‘rin";
        r.floor = JsonHelper.getString(body, "floor", "4-qavat");
        r.size = JsonHelper.getString(body, "size", "26 m²");
        r.bathroom = JsonHelper.getString(body, "bathroom", "Shaxsiy sanuzel");
        r.tag = JsonHelper.getString(body, "tag", "Yangi");
        r.badgeType = JsonHelper.getString(body, "badgeType", "recommended");
        String img = AuthService.saveUploadedImage(db.projectRoot, JsonHelper.getString(body, "image", "/images/room3.jpeg"), "roomtype");
        r.image = img != null ? img : "/images/room3.jpeg";
        r.gallery.add(r.image);
        r.description = JsonHelper.getString(body, "description", "");
        db.rooms.add(r);
        JsonHelper.sendJson(exchange, 201, "{\"room\":" + db.roomInventoryToJson(r) + "}");
    }

    private void handleUpdateRoomType(HttpExchange exchange, long roomId) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (RoomInventory r : db.rooms) {
            if (r.id == roomId) {
                r.title = JsonHelper.getString(body, "title", r.title).trim();
                String priceRaw = JsonHelper.getString(body, "price", r.price).trim();
                long pNum = JsonHelper.parsePriceDigits(priceRaw);
                if (pNum > 0) {
                    r.priceNum = pNum;
                    r.price = priceRaw.contains("so") ? priceRaw : JsonHelper.formatPriceUzs(pNum);
                }
                r.totalRooms = JsonHelper.getInt(body, "totalRooms", r.totalRooms);
                r.occupiedSpots = JsonHelper.getInt(body, "occupiedSpots", r.occupiedSpots);
                String rawImg = JsonHelper.getString(body, "image", null);
                if (rawImg != null && !rawImg.isBlank()) {
                    String saved = AuthService.saveUploadedImage(db.projectRoot, rawImg, "roomtype");
                    if (saved != null) r.image = saved;
                }
                JsonHelper.sendJson(exchange, 200, "{\"room\":" + db.roomInventoryToJson(r) + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Xona turi topilmadi.");
    }

    private void handleCreateDormRoom(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String roomNumber = JsonHelper.getString(body, "roomNumber", "").trim();
        long typeId = JsonHelper.getLong(body, "roomTypeId", 1L);
        int floor = JsonHelper.getInt(body, "floor", 4);
        if (roomNumber.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Xona raqamini kiriting.");
            return;
        }
        DormRoom dr = new DormRoom();
        dr.id = db.dormRoomSeq.incrementAndGet();
        dr.roomNumber = roomNumber;
        dr.roomTypeId = typeId;
        dr.roomCategory = "two";
        dr.floor = floor;
        dr.capacity = 2;
        dr.status = "active";
        dr.customPrice = JsonHelper.getString(body, "customPrice", "1 100 000 so‘m");
        String img = AuthService.saveUploadedImage(db.projectRoot, JsonHelper.getString(body, "image", "/images/room3.jpeg"), "room-" + roomNumber);
        dr.image = img != null ? img : "/images/room3.jpeg";
        dr.description = JsonHelper.getString(body, "description", "");
        dr.createdAt = DormitoryDatabase.nowIso();
        db.dormRooms.add(dr);
        JsonHelper.sendJson(exchange, 201, "{\"roomNumber\":" + JsonHelper.quote(dr.roomNumber) + "}");
    }

    private void handleUploadImage(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String imageData = JsonHelper.getString(body, "imageData", null);
        String prefix = JsonHelper.getString(body, "prefix", "room");
        String url = AuthService.saveUploadedImage(db.projectRoot, imageData, prefix);
        if (url == null) {
            JsonHelper.sendError(exchange, 400, "Rasm formati noto‘g‘ri.");
            return;
        }
        JsonHelper.sendJson(exchange, 201, "{\"imageUrl\":" + JsonHelper.quote(url) + "}");
    }

    private void handleCreateFaq(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String q = JsonHelper.getString(body, "q", "").trim();
        String a = JsonHelper.getString(body, "a", "").trim();
        if (q.isEmpty() || a.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Savol va javobni kiriting.");
            return;
        }
        long id = db.faqSeq.incrementAndGet();
        db.faqs.add(new FaqItem(id, q, a, db.faqs.size() + 1, DormitoryDatabase.nowIso()));
        JsonHelper.sendJson(exchange, 201, "{\"id\":" + id + ",\"message\":\"Savol-javob qo‘shildi!\"}");
    }

    private void handleChatReply(HttpExchange exchange, long chatId) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String msg = JsonHelper.getString(body, "message", "").trim();
        if (msg.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Javob matnini kiriting.");
            return;
        }
        for (SupportChat c : db.chats) {
            if (c.id == chatId) {
                c.messages.add(new ChatMessage(db.chatMsgSeq.incrementAndGet(), c.id, "admin", "TPU Ma’muriyati", msg, DormitoryDatabase.nowIso()));
                c.lastMessage = msg;
                c.unreadAdmin = 0;
                c.unreadStudent += 1;
                c.updatedAt = DormitoryDatabase.nowIso();
                JsonHelper.sendJson(exchange, 201, "{\"chat\":" + db.supportChatToJson(c) + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Chat topilmadi.");
    }
}
