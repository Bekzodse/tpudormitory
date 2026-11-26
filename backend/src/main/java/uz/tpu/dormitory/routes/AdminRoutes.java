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

    private Long parseId(String raw, HttpExchange exchange) throws IOException {
        try {
            long val = Long.parseLong(raw);
            if (val <= 0) {
                JsonHelper.sendError(exchange, 400, "Noto‘g‘ri ID formati.");
                return null;
            }
            return val;
        } catch (NumberFormatException e) {
            JsonHelper.sendError(exchange, 400, "Noto‘g‘ri ID formati.");
            return null;
        }
    }

    public void handle(HttpExchange exchange, String path, String method) throws IOException {
        Account admin = requireAdmin(exchange);
        if (admin == null) return;

        if ("/api/admin/overview".equals(path) && "GET".equals(method)) {
            handleOverview(exchange);
        } else if ("/api/admin/activity-logs".equals(path) && "GET".equals(method)) {
            JsonHelper.sendJson(exchange, 200, "{\"activityLogs\":" + db.activityLogsToJson() + "}");
        } else if ("/api/admin/activity-logs/contact".equals(path) && "POST".equals(method)) {
            handleLogContact(exchange, admin);
        } else if ("/api/admin/bookings".equals(path) && "POST".equals(method)) {
            handleCreateBooking(exchange, admin);
        } else if (path.startsWith("/api/admin/bookings/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/bookings/".length()), exchange);
            if (id != null) handleUpdateBooking(exchange, admin, id);
        } else if (path.startsWith("/api/admin/bookings/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/bookings/".length()), exchange);
            if (id != null) handleDeleteBooking(exchange, admin, id);
        } else if ("/api/admin/rooms".equals(path) && "POST".equals(method)) {
            handleCreateRoomType(exchange, admin);
        } else if (path.startsWith("/api/admin/rooms/") && "PUT".equals(method)) {
            Long id = parseId(path.substring("/api/admin/rooms/".length()), exchange);
            if (id != null) handleUpdateRoomType(exchange, admin, id);
        } else if (path.startsWith("/api/admin/rooms/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/rooms/".length()), exchange);
            if (id != null) handleDeleteRoomType(exchange, admin, id);
        } else if ("/api/admin/dorm-rooms".equals(path) && "POST".equals(method)) {
            handleCreateDormRoom(exchange, admin);
        } else if (path.startsWith("/api/admin/dorm-rooms/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/dorm-rooms/".length()), exchange);
            if (id != null) handleUpdateDormRoom(exchange, admin, id);
        } else if (path.startsWith("/api/admin/dorm-rooms/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/dorm-rooms/".length()), exchange);
            if (id != null) handleDeleteDormRoom(exchange, admin, id);
        } else if ("/api/admin/residents".equals(path) && "POST".equals(method)) {
            handleCreateResident(exchange, admin);
        } else if (path.startsWith("/api/admin/residents/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/residents/".length()), exchange);
            if (id != null) handleUpdateResident(exchange, admin, id);
        } else if (path.startsWith("/api/admin/residents/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/residents/".length()), exchange);
            if (id != null) handleDeleteResident(exchange, admin, id);
        } else if ("/api/admin/payments/bulk".equals(path) && "POST".equals(method)) {
            handleBulkPayments(exchange, admin);
        } else if ("/api/admin/maintenance".equals(path) && "POST".equals(method)) {
            handleCreateMaintenance(exchange, admin);
        } else if (path.startsWith("/api/admin/maintenance/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/maintenance/".length()), exchange);
            if (id != null) handleUpdateMaintenance(exchange, admin, id);
        } else if (path.startsWith("/api/admin/maintenance/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/maintenance/".length()), exchange);
            if (id != null) handleDeleteMaintenance(exchange, admin, id);
        } else if ("/api/admin/announcements".equals(path) && "POST".equals(method)) {
            handleCreateAnnouncement(exchange, admin);
        } else if (path.startsWith("/api/admin/announcements/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/announcements/".length()), exchange);
            if (id != null) handleUpdateAnnouncement(exchange, admin, id);
        } else if (path.startsWith("/api/admin/announcements/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/announcements/".length()), exchange);
            if (id != null) handleDeleteAnnouncement(exchange, admin, id);
        } else if ("/api/admin/messages".equals(path) && "POST".equals(method)) {
            handleCreateMessage(exchange, admin);
        } else if (path.startsWith("/api/admin/messages/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/messages/".length()), exchange);
            if (id != null) handleUpdateMessage(exchange, admin, id);
        } else if (path.startsWith("/api/admin/messages/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/messages/".length()), exchange);
            if (id != null) handleDeleteMessage(exchange, admin, id);
        } else if ("/api/admin/accounts".equals(path) && "POST".equals(method)) {
            handleCreateAccount(exchange, admin);
        } else if (path.matches("/api/admin/accounts/\\d+/password") && "PATCH".equals(method)) {
            Long id = parseId(path.split("/")[4], exchange);
            if (id != null) handleUpdateAccountPassword(exchange, admin, id);
        } else if (path.startsWith("/api/admin/accounts/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/accounts/".length()), exchange);
            if (id != null) handleUpdateAccount(exchange, admin, id);
        } else if (path.startsWith("/api/admin/accounts/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/accounts/".length()), exchange);
            if (id != null) handleDeleteAccount(exchange, admin, id);
        } else if ("/api/admin/facilities".equals(path) && "POST".equals(method)) {
            handleCreateFacility(exchange, admin);
        } else if (path.startsWith("/api/admin/facilities/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/facilities/".length()), exchange);
            if (id != null) handleUpdateFacility(exchange, admin, id);
        } else if (path.startsWith("/api/admin/facilities/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/facilities/".length()), exchange);
            if (id != null) handleDeleteFacility(exchange, admin, id);
        } else if ("/api/admin/upload-image".equals(path) && "POST".equals(method)) {
            handleUploadImage(exchange, admin);
        } else if ("/api/admin/gallery-categories".equals(path) && "POST".equals(method)) {
            handleCreateGalleryCategory(exchange, admin);
        } else if (path.startsWith("/api/admin/gallery-categories/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/gallery-categories/".length()), exchange);
            if (id != null) handleUpdateGalleryCategory(exchange, admin, id);
        } else if (path.startsWith("/api/admin/gallery-categories/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/gallery-categories/".length()), exchange);
            if (id != null) handleDeleteGalleryCategory(exchange, admin, id);
        } else if ("/api/admin/gallery".equals(path) && "POST".equals(method)) {
            handleCreateGalleryPhoto(exchange, admin);
        } else if (path.startsWith("/api/admin/gallery/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/gallery/".length()), exchange);
            if (id != null) handleUpdateGalleryPhoto(exchange, admin, id);
        } else if (path.startsWith("/api/admin/gallery/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/gallery/".length()), exchange);
            if (id != null) handleDeleteGalleryPhoto(exchange, admin, id);
        } else if ("/api/admin/bottom-texts".equals(path) && "POST".equals(method)) {
            handleCreateBottomText(exchange, admin);
        } else if (path.startsWith("/api/admin/bottom-texts/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/bottom-texts/".length()), exchange);
            if (id != null) handleUpdateBottomText(exchange, admin, id);
        } else if (path.startsWith("/api/admin/bottom-texts/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/bottom-texts/".length()), exchange);
            if (id != null) handleDeleteBottomText(exchange, admin, id);
        } else if ("/api/admin/homepage".equals(path) && "PUT".equals(method)) {
            handleUpdateHomepage(exchange, admin);
        } else if ("/api/admin/faqs".equals(path) && "POST".equals(method)) {
            handleCreateFaq(exchange, admin);
        } else if (path.startsWith("/api/admin/faqs/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/faqs/".length()), exchange);
            if (id != null) handleUpdateFaq(exchange, admin, id);
        } else if (path.startsWith("/api/admin/faqs/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/faqs/".length()), exchange);
            if (id != null) handleDeleteFaq(exchange, admin, id);
        } else if ("/api/admin/chats".equals(path) && "GET".equals(method)) {
            JsonHelper.sendJson(exchange, 200, "{\"chats\":" + chatsToJson() + "}");
        } else if ("/api/admin/chats".equals(path) && "POST".equals(method)) {
            handleCreateChat(exchange, admin);
        } else if (path.matches("/api/admin/chats/\\d+/read") && "POST".equals(method)) {
            Long id = parseId(path.split("/")[4], exchange);
            if (id != null) handleChatRead(exchange, id);
        } else if (path.matches("/api/admin/chats/\\d+/reply") && "POST".equals(method)) {
            Long id = parseId(path.split("/")[4], exchange);
            if (id != null) handleChatReply(exchange, admin, id);
        } else if (path.matches("/api/admin/chats/\\d+/messages/\\d+") && "PATCH".equals(method)) {
            String[] parts = path.split("/");
            Long chatId = parseId(parts[4], exchange);
            Long msgId = chatId != null ? parseId(parts[6], exchange) : null;
            if (chatId != null && msgId != null) handleUpdateChatMessage(exchange, admin, chatId, msgId);
        } else if (path.matches("/api/admin/chats/\\d+/messages/\\d+") && "DELETE".equals(method)) {
            String[] parts = path.split("/");
            Long chatId = parseId(parts[4], exchange);
            Long msgId = chatId != null ? parseId(parts[6], exchange) : null;
            if (chatId != null && msgId != null) handleDeleteChatMessage(exchange, admin, chatId, msgId);
        } else if (path.startsWith("/api/admin/chats/") && "PATCH".equals(method)) {
            Long id = parseId(path.substring("/api/admin/chats/".length()), exchange);
            if (id != null) handleUpdateChat(exchange, admin, id);
        } else if (path.startsWith("/api/admin/chats/") && "DELETE".equals(method)) {
            Long id = parseId(path.substring("/api/admin/chats/".length()), exchange);
            if (id != null) handleDeleteChat(exchange, admin, id);
        } else {
            JsonHelper.sendError(exchange, 404, "Admin endpoint topilmadi.");
        }
    }

    private String chatsToJson() {
        StringBuilder chatsJson = new StringBuilder("[");
        for (int i = 0; i < db.chats.size(); i++) {
            if (i > 0) chatsJson.append(",");
            chatsJson.append(db.supportChatToJson(db.chats.get(i)));
        }
        chatsJson.append("]");
        return chatsJson.toString();
    }

    private void handleOverview(HttpExchange exchange) throws IOException {
        StringBuilder roomsJson = new StringBuilder("[");
        for (int i = 0; i < db.rooms.size(); i++) {
            if (i > 0) roomsJson.append(",");
            roomsJson.append(db.roomInventoryToJson(db.rooms.get(i)));
        }
        roomsJson.append("]");

        JsonHelper.sendJson(exchange, 200, "{"
                + "\"rooms\":" + roomsJson + ","
                + "\"bookings\":" + db.bookingsToJson() + ","
                + "\"students\":" + db.studentsToJson() + ","
                + "\"messages\":" + db.messagesToJson() + ","
                + "\"dormRooms\":" + db.dormRoomsToJson(true) + ","
                + "\"residents\":" + db.residentsToJson() + ","
                + "\"maintenance\":" + db.maintenanceToJson() + ","
                + "\"announcements\":" + db.announcementsToJson() + ","
                + "\"gallery\":" + db.galleryToJson() + ","
                + "\"galleryCategories\":" + db.galleryCategoriesToJson() + ","
                + "\"bottomTexts\":" + db.bottomTextsToJson() + ","
                + "\"homepage\":" + db.homepageToJson() + ","
                + "\"faqs\":" + db.faqsToJson() + ","
                + "\"facilities\":" + db.facilitiesToJson() + ","
                + "\"chats\":" + chatsToJson() + ","
                + "\"activityLogs\":" + db.activityLogsToJson() + ","
                + "\"availableImages\":" + JsonHelper.stringListJson(db.getAvailableImages())
                + "}");
    }

    private void handleLogContact(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String section = JsonHelper.getString(body, "section", "clients");
        String clientName = JsonHelper.getString(body, "clientName", "").trim();
        String clientPhone = JsonHelper.getString(body, "clientPhone", "").trim();
        String channel = JsonHelper.getString(body, "channel", "Aloqa").trim();
        String summary = JsonHelper.getString(body, "summary", "").trim();
        if (summary.isEmpty()) summary = clientName + " bilan " + channel + " orqali bog‘landi";
        db.logActivity(admin, "contact", section, channel, clientName, clientName, clientPhone, summary);
        JsonHelper.sendJson(exchange, 201, "{\"activityLogs\":" + db.activityLogsToJson() + "}");
    }

    private void handleCreateBooking(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String name = JsonHelper.getString(body, "studentName", "").trim();
        String phone = JsonHelper.getString(body, "phone", "").trim();
        if (name.isEmpty() || phone.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Talaba F.I.Sh. va telefon raqamini kiriting.");
            return;
        }
        long roomId = JsonHelper.getLong(body, "roomId", 1L);
        RoomInventory inv = db.rooms.stream().filter(r -> r.id == roomId).findFirst().orElse(db.rooms.get(0));
        Booking b = new Booking();
        b.id = db.bookingSeq.incrementAndGet();
        b.roomId = inv.id;
        b.roomTitle = inv.title;
        b.roomCategory = inv.category;
        b.studentName = name;
        b.phone = phone;
        b.telegram = JsonHelper.getString(body, "telegram", "");
        b.course = JsonHelper.getString(body, "course", "1-kurs");
        b.age = JsonHelper.getInt(body, "age", null);
        b.preferredRoomNumber = JsonHelper.getString(body, "preferredRoomNumber", "");
        b.moveInDate = JsonHelper.getString(body, "moveInDate", "");
        b.duration = JsonHelper.getString(body, "duration", "1 semestr");
        b.notes = JsonHelper.getString(body, "notes", "");
        b.status = JsonHelper.getString(body, "status", "pending");
        b.adminNote = JsonHelper.getString(body, "adminNote", "");
        b.createdAt = DormitoryDatabase.nowIso();
        b.updatedAt = b.createdAt;
        db.bookings.add(0, b);
        db.logActivity(admin, "create", "bookings", "Bron arizasi", "#" + b.id + " • " + name, name, phone, name + " uchun yangi bron arizasi yaratdi");
        JsonHelper.sendJson(exchange, 201, "{\"bookings\":" + db.bookingsToJson() + ",\"message\":\"Ariza qo‘shildi!\"}");
    }

    private void handleUpdateBooking(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (Booking b : db.bookings) {
            if (b.id == id) {
                String prevStatus = b.status;
                b.studentName = JsonHelper.getString(body, "studentName", b.studentName);
                b.phone = JsonHelper.getString(body, "phone", b.phone);
                b.telegram = JsonHelper.getString(body, "telegram", b.telegram);
                b.course = JsonHelper.getString(body, "course", b.course);
                b.moveInDate = JsonHelper.getString(body, "moveInDate", b.moveInDate);
                b.duration = JsonHelper.getString(body, "duration", b.duration);
                b.notes = JsonHelper.getString(body, "notes", b.notes);
                b.adminNote = JsonHelper.getString(body, "adminNote", b.adminNote);
                b.status = JsonHelper.getString(body, "status", b.status);
                b.updatedAt = DormitoryDatabase.nowIso();
                boolean statusChanged = !prevStatus.equals(b.status);
                db.logActivity(admin, statusChanged ? "contact" : "update", "bookings", "Bron arizasi", "#" + b.id + " • " + b.studentName,
                        b.studentName, b.phone, b.studentName + " arizasini yangiladi (" + b.status + ")");
                JsonHelper.sendJson(exchange, 200, "{\"bookings\":" + db.bookingsToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Ariza topilmadi.");
    }

    private void handleDeleteBooking(HttpExchange exchange, Account admin, long id) throws IOException {
        Booking found = db.bookings.stream().filter(b -> b.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Ariza topilmadi.");
            return;
        }
        db.bookings.remove(found);
        db.logActivity(admin, "delete", "bookings", "Bron arizasi", "#" + id + " • " + found.studentName,
                found.studentName, found.phone, found.studentName + " arizasini o‘chirdi");
        JsonHelper.sendJson(exchange, 200, "{\"bookings\":" + db.bookingsToJson() + "}");
    }

    private void handleCreateRoomType(HttpExchange exchange, Account admin) throws IOException {
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
        db.logActivity(admin, "create", "rooms", "Xona turi", title, "", "", "Yangi xona turi yaratdi: " + title);
        JsonHelper.sendJson(exchange, 201, "{\"room\":" + db.roomInventoryToJson(r) + "}");
    }

    private void handleUpdateRoomType(HttpExchange exchange, Account admin, long roomId) throws IOException {
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
                db.logActivity(admin, "update", "rooms", "Xona turi", r.title, "", "", "Xona turini tahrirladi: " + r.title);
                JsonHelper.sendJson(exchange, 200, "{\"room\":" + db.roomInventoryToJson(r) + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Xona turi topilmadi.");
    }

    private void handleDeleteRoomType(HttpExchange exchange, Account admin, long roomId) throws IOException {
        if (db.rooms.size() <= 1) {
            JsonHelper.sendError(exchange, 400, "Kamida bitta xona turi qolishi kerak.");
            return;
        }
        RoomInventory found = db.rooms.stream().filter(r -> r.id == roomId).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Xona turi topilmadi.");
            return;
        }
        db.rooms.remove(found);
        db.logActivity(admin, "delete", "rooms", "Xona turi", found.title, "", "", "Xona turini o‘chirdi: " + found.title);
        JsonHelper.sendJson(exchange, 200, "{\"message\":\"Xona turi o‘chirildi.\"}");
    }

    private void handleCreateDormRoom(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String roomNumber = JsonHelper.getString(body, "roomNumber", "").trim();
        long typeId = JsonHelper.getLong(body, "roomTypeId", 1L);
        int floor = JsonHelper.getInt(body, "floor", 4);
        if (roomNumber.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Xona raqamini kiriting.");
            return;
        }
        RoomInventory inv = db.rooms.stream().filter(r -> r.id == typeId).findFirst().orElse(db.rooms.get(0));
        DormRoom dr = new DormRoom();
        dr.id = db.dormRoomSeq.incrementAndGet();
        dr.roomNumber = roomNumber;
        dr.roomTypeId = inv.id;
        dr.roomCategory = inv.category;
        dr.floor = floor;
        dr.capacity = inv.spotsPerRoom;
        dr.status = "active";
        dr.customPrice = JsonHelper.getString(body, "customPrice", inv.price);
        String img = AuthService.saveUploadedImage(db.projectRoot, JsonHelper.getString(body, "image", inv.image), "room-" + roomNumber);
        dr.image = img != null ? img : "/images/room3.jpeg";
        dr.description = JsonHelper.getString(body, "description", "");
        dr.createdAt = DormitoryDatabase.nowIso();
        db.dormRooms.add(dr);
        db.logActivity(admin, "create", "dormRooms", "Xona raqami", roomNumber + "-xona", "", "", "Yangi xona yaratdi: " + roomNumber + "-xona");
        JsonHelper.sendJson(exchange, 201, "{\"dormRooms\":" + db.dormRoomsToJson(true) + "}");
    }

    private void handleUpdateDormRoom(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (DormRoom dr : db.dormRooms) {
            if (dr.id == id) {
                dr.roomNumber = JsonHelper.getString(body, "roomNumber", dr.roomNumber);
                dr.floor = JsonHelper.getInt(body, "floor", dr.floor);
                dr.status = JsonHelper.getString(body, "status", dr.status);
                dr.customPrice = JsonHelper.getString(body, "customPrice", dr.customPrice);
                dr.description = JsonHelper.getString(body, "description", dr.description);
                String rawImg = JsonHelper.getString(body, "image", null);
                if (rawImg != null && !rawImg.isBlank()) {
                    String saved = AuthService.saveUploadedImage(db.projectRoot, rawImg, "room-" + dr.roomNumber);
                    if (saved != null) dr.image = saved;
                }
                db.logActivity(admin, "update", "dormRooms", "Xona raqami", dr.roomNumber + "-xona", "", "", dr.roomNumber + "-xonani tahrirladi");
                JsonHelper.sendJson(exchange, 200, "{\"dormRooms\":" + db.dormRoomsToJson(true) + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Xona topilmadi.");
    }

    private void handleDeleteDormRoom(HttpExchange exchange, Account admin, long id) throws IOException {
        DormRoom found = db.dormRooms.stream().filter(d -> d.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Xona topilmadi.");
            return;
        }
        boolean hasOcc = db.residents.stream().anyMatch(r -> r.dormRoomId == id);
        if (hasOcc) {
            JsonHelper.sendError(exchange, 409, "Avval xonadagi talabalarni boshqa xonaga ko‘chiring.");
            return;
        }
        db.dormRooms.remove(found);
        db.logActivity(admin, "delete", "dormRooms", "Xona raqami", found.roomNumber + "-xona", "", "", found.roomNumber + "-xonani o‘chirdi");
        JsonHelper.sendJson(exchange, 200, "{\"dormRooms\":" + db.dormRoomsToJson(true) + "}");
    }

    private void handleCreateResident(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        long dormRoomId = JsonHelper.getLong(body, "dormRoomId", 0L);
        String studentName = JsonHelper.getString(body, "studentName", "").trim();
        String phone = JsonHelper.getString(body, "phone", "").trim();
        if (dormRoomId <= 0 || studentName.isEmpty() || phone.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Xona, talaba ismi va telefon raqami majburiy.");
            return;
        }
        Resident r = new Resident();
        r.id = db.residentSeq.incrementAndGet();
        r.dormRoomId = dormRoomId;
        r.studentName = studentName;
        r.phone = phone;
        r.telegram = JsonHelper.getString(body, "telegram", "");
        r.course = JsonHelper.getString(body, "course", "1-kurs");
        r.faculty = JsonHelper.getString(body, "faculty", "");
        r.paymentStatus = JsonHelper.getString(body, "paymentStatus", "pending");
        r.moveInDate = JsonHelper.getString(body, "moveInDate", "");
        r.createdAt = DormitoryDatabase.nowIso();
        db.residents.add(0, r);
        db.logActivity(admin, "create", "residents", "Yashovchi talaba", studentName, studentName, phone, "Yangi talaba joylashtirdi: " + studentName);
        JsonHelper.sendJson(exchange, 201, "{\"residents\":" + db.residentsToJson() + ",\"dormRooms\":" + db.dormRoomsToJson(true) + "}");
    }

    private void handleUpdateResident(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (Resident r : db.residents) {
            if (r.id == id) {
                r.dormRoomId = JsonHelper.getLong(body, "dormRoomId", r.dormRoomId);
                r.studentName = JsonHelper.getString(body, "studentName", r.studentName);
                r.phone = JsonHelper.getString(body, "phone", r.phone);
                r.telegram = JsonHelper.getString(body, "telegram", r.telegram);
                r.course = JsonHelper.getString(body, "course", r.course);
                r.faculty = JsonHelper.getString(body, "faculty", r.faculty);
                r.paymentStatus = JsonHelper.getString(body, "paymentStatus", r.paymentStatus);
                r.moveInDate = JsonHelper.getString(body, "moveInDate", r.moveInDate);
                db.logActivity(admin, "update", "residents", "Yashovchi talaba", r.studentName, r.studentName, r.phone, r.studentName + " ma’lumotlarini tahrirladi");
                JsonHelper.sendJson(exchange, 200, "{\"residents\":" + db.residentsToJson() + ",\"dormRooms\":" + db.dormRoomsToJson(true) + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Yashovchi talaba topilmadi.");
    }

    private void handleDeleteResident(HttpExchange exchange, Account admin, long id) throws IOException {
        Resident found = db.residents.stream().filter(r -> r.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Yashovchi talaba topilmadi.");
            return;
        }
        db.residents.remove(found);
        db.logActivity(admin, "delete", "residents", "Yashovchi talaba", found.studentName, found.studentName, found.phone, found.studentName + " ni ro‘yxatdan o‘chirdi");
        JsonHelper.sendJson(exchange, 200, "{\"residents\":" + db.residentsToJson() + ",\"dormRooms\":" + db.dormRoomsToJson(true) + "}");
    }

    private void handleBulkPayments(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String fromStatus = JsonHelper.getString(body, "fromStatus", "");
        String toStatus = JsonHelper.getString(body, "toStatus", "paid");
        int count = 0;
        for (Resident r : db.residents) {
            if (fromStatus.isEmpty() || fromStatus.equals(r.paymentStatus)) {
                r.paymentStatus = toStatus;
                count++;
            }
        }
        db.logActivity(admin, "update", "payments", "Ommaviy to‘lov", count + " nafar", "", "", count + " nafar talaba to‘lovini yangiladi");
        JsonHelper.sendJson(exchange, 200, "{\"residents\":" + db.residentsToJson() + "}");
    }

    private void handleCreateMaintenance(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String roomNumber = JsonHelper.getString(body, "roomNumber", "").trim();
        String category = JsonHelper.getString(body, "category", "Santexnika").trim();
        String description = JsonHelper.getString(body, "description", "").trim();
        if (roomNumber.isEmpty() || description.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Xona raqami va tavsifni kiriting.");
            return;
        }
        MaintenanceRequest m = new MaintenanceRequest();
        m.id = db.maintSeq.incrementAndGet();
        m.roomNumber = roomNumber;
        m.category = category;
        m.description = description;
        m.priority = JsonHelper.getString(body, "priority", "medium");
        m.status = "open";
        m.reporterName = JsonHelper.getString(body, "reporterName", "");
        m.adminNote = "";
        m.createdAt = DormitoryDatabase.nowIso();
        m.updatedAt = m.createdAt;
        db.maintenance.add(0, m);
        db.logActivity(admin, "create", "maintenance", "Texnik xizmat", roomNumber + "-xona", "", "", roomNumber + "-xona uchun texnik ariza yaratdi");
        JsonHelper.sendJson(exchange, 201, "{\"maintenance\":" + db.maintenanceToJson() + "}");
    }

    private void handleUpdateMaintenance(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (MaintenanceRequest m : db.maintenance) {
            if (m.id == id) {
                m.roomNumber = JsonHelper.getString(body, "roomNumber", m.roomNumber);
                m.category = JsonHelper.getString(body, "category", m.category);
                m.description = JsonHelper.getString(body, "description", m.description);
                m.priority = JsonHelper.getString(body, "priority", m.priority);
                m.status = JsonHelper.getString(body, "status", m.status);
                m.adminNote = JsonHelper.getString(body, "adminNote", m.adminNote);
                m.reporterName = JsonHelper.getString(body, "reporterName", m.reporterName);
                m.updatedAt = DormitoryDatabase.nowIso();
                db.logActivity(admin, "update", "maintenance", "Texnik xizmat", m.roomNumber + "-xona", m.reporterName, "", m.roomNumber + "-xona texnik so‘rovini tahrirladi");
                JsonHelper.sendJson(exchange, 200, "{\"maintenance\":" + db.maintenanceToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "So‘rov topilmadi.");
    }

    private void handleDeleteMaintenance(HttpExchange exchange, Account admin, long id) throws IOException {
        MaintenanceRequest found = db.maintenance.stream().filter(m -> m.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "So‘rov topilmadi.");
            return;
        }
        db.maintenance.remove(found);
        db.logActivity(admin, "delete", "maintenance", "Texnik xizmat", found.roomNumber + "-xona", "", "", found.roomNumber + "-xona texnik so‘rovini o‘chirdi");
        JsonHelper.sendJson(exchange, 200, "{\"maintenance\":" + db.maintenanceToJson() + "}");
    }

    private void handleCreateAnnouncement(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String title = JsonHelper.getString(body, "title", "").trim();
        String content = JsonHelper.getString(body, "content", "").trim();
        if (title.isEmpty() || content.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "E’lon sarlavhasi va matnini kiriting.");
            return;
        }
        Announcement a = new Announcement();
        a.id = db.annSeq.incrementAndGet();
        a.title = title;
        a.category = JsonHelper.getString(body, "category", "Umumiy");
        a.content = content;
        a.audience = JsonHelper.getString(body, "audience", "Barcha talabalar");
        a.pinned = Boolean.TRUE.equals(JsonHelper.getBoolean(body, "pinned", false));
        a.createdAt = DormitoryDatabase.nowIso();
        db.announcements.add(0, a);
        db.logActivity(admin, "create", "announcements", "E’lon", title, "", "", "Yangi e’lon yaratdi: " + title);
        JsonHelper.sendJson(exchange, 201, "{\"announcements\":" + db.announcementsToJson() + "}");
    }

    private void handleUpdateAnnouncement(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (Announcement a : db.announcements) {
            if (a.id == id) {
                a.title = JsonHelper.getString(body, "title", a.title);
                a.category = JsonHelper.getString(body, "category", a.category);
                a.content = JsonHelper.getString(body, "content", a.content);
                a.audience = JsonHelper.getString(body, "audience", a.audience);
                a.pinned = Boolean.TRUE.equals(JsonHelper.getBoolean(body, "pinned", a.pinned));
                db.logActivity(admin, "update", "announcements", "E’lon", a.title, "", "", "E’lonni tahrirladi: " + a.title);
                JsonHelper.sendJson(exchange, 200, "{\"announcements\":" + db.announcementsToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "E’lon topilmadi.");
    }

    private void handleDeleteAnnouncement(HttpExchange exchange, Account admin, long id) throws IOException {
        Announcement found = db.announcements.stream().filter(a -> a.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "E’lon topilmadi.");
            return;
        }
        db.announcements.remove(found);
        db.logActivity(admin, "delete", "announcements", "E’lon", found.title, "", "", "E’lonni o‘chirdi: " + found.title);
        JsonHelper.sendJson(exchange, 200, "{\"announcements\":" + db.announcementsToJson() + "}");
    }

    private void handleCreateMessage(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String first = JsonHelper.getString(body, "firstName", "").trim();
        String last = JsonHelper.getString(body, "lastName", "").trim();
        String phone = JsonHelper.getString(body, "phone", "").trim();
        String message = JsonHelper.getString(body, "message", "").trim();
        if (first.isEmpty() || last.isEmpty() || phone.isEmpty() || message.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Barcha majburiy maydonlarni to‘ldiring.");
            return;
        }
        ContactMessage m = new ContactMessage();
        m.id = db.msgSeq.incrementAndGet();
        m.firstName = first;
        m.lastName = last;
        m.phone = phone;
        m.subject = JsonHelper.getString(body, "subject", "Umumiy savol");
        m.message = message;
        m.status = JsonHelper.getString(body, "status", "new");
        m.adminNote = JsonHelper.getString(body, "adminNote", "");
        m.createdAt = DormitoryDatabase.nowIso();
        db.messages.add(0, m);
        String full = first + " " + last;
        db.logActivity(admin, "create", "messages", "Aloqa murojaati", full, full, phone, full + " murojaatini qo‘shdi");
        JsonHelper.sendJson(exchange, 201, "{\"messages\":" + db.messagesToJson() + "}");
    }

    private void handleUpdateMessage(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (ContactMessage m : db.messages) {
            if (m.id == id) {
                String prev = m.status;
                m.firstName = JsonHelper.getString(body, "firstName", m.firstName);
                m.lastName = JsonHelper.getString(body, "lastName", m.lastName);
                m.phone = JsonHelper.getString(body, "phone", m.phone);
                m.subject = JsonHelper.getString(body, "subject", m.subject);
                m.message = JsonHelper.getString(body, "message", m.message);
                m.status = JsonHelper.getString(body, "status", m.status);
                m.adminNote = JsonHelper.getString(body, "adminNote", m.adminNote);
                String full = m.firstName + " " + m.lastName;
                boolean replied = "replied".equals(m.status) && !"replied".equals(prev);
                db.logActivity(admin, replied ? "contact" : "update", "messages", "Aloqa murojaati", full, full, m.phone,
                        replied ? full + " murojaatiga javob berdi" : full + " murojaatini tahrirladi");
                JsonHelper.sendJson(exchange, 200, "{\"messages\":" + db.messagesToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Xabar topilmadi.");
    }

    private void handleDeleteMessage(HttpExchange exchange, Account admin, long id) throws IOException {
        ContactMessage found = db.messages.stream().filter(m -> m.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Xabar topilmadi.");
            return;
        }
        db.messages.remove(found);
        String full = found.firstName + " " + found.lastName;
        db.logActivity(admin, "delete", "messages", "Aloqa murojaati", full, full, found.phone, full + " xabarini o‘chirdi");
        JsonHelper.sendJson(exchange, 200, "{\"messages\":" + db.messagesToJson() + "}");
    }

    private void handleCreateAccount(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String first = JsonHelper.getString(body, "firstName", "").trim();
        String last = JsonHelper.getString(body, "lastName", "").trim();
        String login = JsonHelper.getString(body, "login", "").trim();
        String password = JsonHelper.getString(body, "password", "");
        String phone = JsonHelper.getString(body, "phone", "").trim();
        String course = JsonHelper.getString(body, "course", "1-kurs").trim();
        Integer age = JsonHelper.getInt(body, "age", 20);
        if (first.isEmpty() || last.isEmpty() || login.isEmpty() || password.length() < 6) {
            JsonHelper.sendError(exchange, 400, "Ism, familiya, login va kamida 6 belgili parol kiriting.");
            return;
        }
        for (Account acc : db.accounts) {
            if (acc.login.equalsIgnoreCase(login)) {
                JsonHelper.sendError(exchange, 409, "Bu login allaqachon band.");
                return;
            }
        }
        Account created = new Account(
                db.accountSeq.incrementAndGet(), first, last, age, course, phone, null, "student", login,
                AuthService.hashPassword(password), AuthService.encryptSecret(password), DormitoryDatabase.nowIso()
        );
        db.accounts.add(created);
        String full = first + " " + last;
        db.logActivity(admin, "create", "students", "Talaba akkaunti", full + " (@" + login + ")", full, phone, "Yangi talaba akkaunti yaratdi: " + full);
        JsonHelper.sendJson(exchange, 201, "{\"message\":\"Akkaunt ochildi!\"}");
    }

    private void handleUpdateAccountPassword(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String pwd = JsonHelper.getString(body, "password", "");
        if (pwd.length() < 6) {
            JsonHelper.sendError(exchange, 400, "Parol kamida 6 ta belgi bo‘lishi kerak.");
            return;
        }
        for (Account a : db.accounts) {
            if (a.id == id) {
                a.passwordHash = AuthService.hashPassword(pwd);
                a.passwordCiphertext = AuthService.encryptSecret(pwd);
                String full = a.firstName + " " + a.lastName;
                db.logActivity(admin, "update", "students", "Parol", full, full, a.phone, a.login + " parolini yangiladi");
                JsonHelper.sendJson(exchange, 200, "{\"message\":\"Parol yangilandi.\"}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Akkaunt topilmadi.");
    }

    private void handleUpdateAccount(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (Account a : db.accounts) {
            if (a.id == id) {
                a.firstName = JsonHelper.getString(body, "firstName", a.firstName).trim();
                a.lastName = JsonHelper.getString(body, "lastName", a.lastName).trim();
                a.course = JsonHelper.getString(body, "course", a.course).trim();
                a.phone = JsonHelper.getString(body, "phone", a.phone).trim();
                a.login = JsonHelper.getString(body, "login", a.login).trim();
                a.age = JsonHelper.getInt(body, "age", a.age);
                String pwd = JsonHelper.getString(body, "password", "");
                if (pwd != null && !pwd.isBlank()) {
                    if (pwd.length() < 6) {
                        JsonHelper.sendError(exchange, 400, "Parol kamida 6 ta belgi bo‘lishi kerak.");
                        return;
                    }
                    a.passwordHash = AuthService.hashPassword(pwd);
                    a.passwordCiphertext = AuthService.encryptSecret(pwd);
                }
                String full = a.firstName + " " + a.lastName;
                db.logActivity(admin, "update", "students", "Talaba akkaunti", full, full, a.phone, full + " profilini tahrirladi");
                JsonHelper.sendJson(exchange, 200, "{\"account\":" + AuthService.publicStudentJson(a) + ",\"message\":\"Profil yangilandi.\"}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Akkaunt topilmadi.");
    }

    private void handleDeleteAccount(HttpExchange exchange, Account admin, long id) throws IOException {
        Account found = db.accounts.stream().filter(a -> a.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Akkaunt topilmadi.");
            return;
        }
        if ("admin".equals(found.role)) {
            JsonHelper.sendError(exchange, 400, "Administrator akkauntini o‘chirib bo‘lmaydi.");
            return;
        }
        db.accounts.remove(found);
        String full = found.firstName + " " + found.lastName;
        db.logActivity(admin, "delete", "students", "Talaba akkaunti", full, full, found.phone, full + " akkauntini o‘chirdi");
        JsonHelper.sendJson(exchange, 200, "{\"message\":\"Akkaunt o‘chirildi.\"}");
    }

    private void handleCreateFacility(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String title = JsonHelper.getString(body, "title", "").trim();
        if (title.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Qulaylik nomini kiriting.");
            return;
        }
        long id = db.facilitySeq.incrementAndGet();
        db.facilities.add(new Facility(
                id,
                JsonHelper.getString(body, "iconName", "Wifi"),
                JsonHelper.getString(body, "category", "amenity"),
                title,
                JsonHelper.getString(body, "sub", ""),
                JsonHelper.getString(body, "badge", "Mavjud"),
                db.facilities.size() + 1,
                DormitoryDatabase.nowIso()
        ));
        db.logActivity(admin, "create", "facilities", "Qulaylik", title, "", "", "Yangi qulaylik yaratdi: " + title);
        JsonHelper.sendJson(exchange, 201, "{\"facilities\":" + db.facilitiesToJson() + "}");
    }

    private void handleUpdateFacility(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (Facility f : db.facilities) {
            if (f.id == id) {
                f.title = JsonHelper.getString(body, "title", f.title).trim();
                f.sub = JsonHelper.getString(body, "sub", f.sub);
                f.category = JsonHelper.getString(body, "category", f.category);
                f.badge = JsonHelper.getString(body, "badge", f.badge);
                f.iconName = JsonHelper.getString(body, "iconName", f.iconName);
                db.logActivity(admin, "update", "facilities", "Qulaylik", f.title, "", "", "Qulaylikni tahrirladi: " + f.title);
                JsonHelper.sendJson(exchange, 200, "{\"facilities\":" + db.facilitiesToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Qulaylik topilmadi.");
    }

    private void handleDeleteFacility(HttpExchange exchange, Account admin, long id) throws IOException {
        Facility found = db.facilities.stream().filter(f -> f.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Qulaylik topilmadi.");
            return;
        }
        db.facilities.remove(found);
        db.logActivity(admin, "delete", "facilities", "Qulaylik", found.title, "", "", "Qulaylikni o‘chirdi: " + found.title);
        JsonHelper.sendJson(exchange, 200, "{\"facilities\":" + db.facilitiesToJson() + "}");
    }

    private void handleCreateGalleryCategory(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String name = JsonHelper.getString(body, "name", "").trim();
        String description = JsonHelper.getString(body, "description", "").trim();
        if (name.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Bo‘lim nomini kiriting.");
            return;
        }
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (slug.isEmpty()) slug = "section-" + System.currentTimeMillis();
        long id = db.galCatSeq.incrementAndGet();
        db.galleryCategories.add(new GalleryCategory(id, slug, name, description, db.galleryCategories.size() + 1, DormitoryDatabase.nowIso()));
        db.logActivity(admin, "create", "gallery", "Galereya bo‘limi", name, "", "", "Galereya bo‘limi yaratdi: " + name);
        JsonHelper.sendJson(exchange, 201, "{\"galleryCategories\":" + db.galleryCategoriesToJson() + "}");
    }

    private void handleUpdateGalleryCategory(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (GalleryCategory c : db.galleryCategories) {
            if (c.id == id) {
                c.name = JsonHelper.getString(body, "name", c.name).trim();
                c.description = JsonHelper.getString(body, "description", c.description).trim();
                db.logActivity(admin, "update", "gallery", "Galereya bo‘limi", c.name, "", "", "Galereya bo‘limini tahrirladi: " + c.name);
                JsonHelper.sendJson(exchange, 200, "{\"galleryCategories\":" + db.galleryCategoriesToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Bo‘lim topilmadi.");
    }

    private void handleDeleteGalleryCategory(HttpExchange exchange, Account admin, long id) throws IOException {
        GalleryCategory found = db.galleryCategories.stream().filter(c -> c.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Bo‘lim topilmadi.");
            return;
        }
        db.galleryCategories.remove(found);
        db.logActivity(admin, "delete", "gallery", "Galereya bo‘limi", found.name, "", "", "Galereya bo‘limini o‘chirdi: " + found.name);
        JsonHelper.sendJson(exchange, 200, "{\"galleryCategories\":" + db.galleryCategoriesToJson() + "}");
    }

    private void handleCreateGalleryPhoto(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String title = JsonHelper.getString(body, "title", "").trim();
        String category = JsonHelper.getString(body, "category", "rooms").trim();
        String tag = JsonHelper.getString(body, "tag", "Yotoqxona").trim();
        String description = JsonHelper.getString(body, "description", "").trim();
        String imageData = JsonHelper.getString(body, "imageData", null);
        String imageUrl = JsonHelper.getString(body, "imageUrl", "/images/room3.jpeg");
        String finalImg = (imageData != null && !imageData.isBlank())
                ? AuthService.saveUploadedImage(db.projectRoot, imageData, "gallery")
                : imageUrl;
        long id = db.galSeq.incrementAndGet();
        db.gallery.add(0, new GalleryPhoto(id, title, category, finalImg != null ? finalImg : "/images/room3.jpeg", tag, description, DormitoryDatabase.nowIso()));
        db.logActivity(admin, "create", "gallery", "Galereya rasmi", title, "", "", "Galereyaga rasm qo‘shdi: " + title);
        JsonHelper.sendJson(exchange, 201, "{\"gallery\":" + db.galleryToJson() + ",\"galleryCategories\":" + db.galleryCategoriesToJson() + "}");
    }

    private void handleUpdateGalleryPhoto(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (GalleryPhoto g : db.gallery) {
            if (g.id == id) {
                g.title = JsonHelper.getString(body, "title", g.title).trim();
                g.category = JsonHelper.getString(body, "category", g.category).trim();
                g.tag = JsonHelper.getString(body, "tag", g.tag).trim();
                g.description = JsonHelper.getString(body, "description", g.description).trim();
                db.logActivity(admin, "update", "gallery", "Galereya rasmi", g.title, "", "", "Galereya rasmini tahrirladi: " + g.title);
                JsonHelper.sendJson(exchange, 200, "{\"gallery\":" + db.galleryToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Rasm topilmadi.");
    }

    private void handleDeleteGalleryPhoto(HttpExchange exchange, Account admin, long id) throws IOException {
        GalleryPhoto found = db.gallery.stream().filter(g -> g.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Rasm topilmadi.");
            return;
        }
        db.gallery.remove(found);
        db.logActivity(admin, "delete", "gallery", "Galereya rasmi", found.title, "", "", "Galereyadan rasmni o‘chirdi: " + found.title);
        JsonHelper.sendJson(exchange, 200, "{\"gallery\":" + db.galleryToJson() + "}");
    }

    private void handleCreateBottomText(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String section = JsonHelper.getString(body, "section", "gallery").trim();
        String title = JsonHelper.getString(body, "title", "").trim();
        String content = JsonHelper.getString(body, "content", "").trim();
        String badge = JsonHelper.getString(body, "badge", "").trim();
        long id = db.bottomTextSeq.incrementAndGet();
        db.bottomTexts.add(new SiteBottomText(id, section, title, content, badge, db.bottomTexts.size() + 1, DormitoryDatabase.nowIso()));
        db.logActivity(admin, "create", "bottomTexts", "Pastki gap", title, "", "", "Yangi pastki matn qo‘shdi: " + title);
        JsonHelper.sendJson(exchange, 201, "{\"bottomTexts\":" + db.bottomTextsToJson() + "}");
    }

    private void handleUpdateBottomText(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (SiteBottomText b : db.bottomTexts) {
            if (b.id == id) {
                b.title = JsonHelper.getString(body, "title", b.title).trim();
                b.content = JsonHelper.getString(body, "content", b.content).trim();
                b.badge = JsonHelper.getString(body, "badge", b.badge).trim();
                db.logActivity(admin, "update", "bottomTexts", "Pastki gap", b.title, "", "", "Pastki matnni tahrirladi: " + b.title);
                JsonHelper.sendJson(exchange, 200, "{\"bottomTexts\":" + db.bottomTextsToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Ma’lumot topilmadi.");
    }

    private void handleDeleteBottomText(HttpExchange exchange, Account admin, long id) throws IOException {
        SiteBottomText found = db.bottomTexts.stream().filter(b -> b.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Ma’lumot topilmadi.");
            return;
        }
        db.bottomTexts.remove(found);
        db.logActivity(admin, "delete", "bottomTexts", "Pastki gap", found.title, "", "", "Pastki matnni o‘chirdi: " + found.title);
        JsonHelper.sendJson(exchange, 200, "{\"bottomTexts\":" + db.bottomTextsToJson() + "}");
    }

    private void handleUpdateHomepage(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        db.homepage.eyebrowBadge = JsonHelper.getString(body, "eyebrowBadge", db.homepage.eyebrowBadge);
        db.homepage.eyebrowStatus = JsonHelper.getString(body, "eyebrowStatus", db.homepage.eyebrowStatus);
        db.homepage.titlePrefix = JsonHelper.getString(body, "titlePrefix", db.homepage.titlePrefix);
        db.homepage.titleHighlight = JsonHelper.getString(body, "titleHighlight", db.homepage.titleHighlight);
        db.homepage.titleSuffix = JsonHelper.getString(body, "titleSuffix", db.homepage.titleSuffix);
        db.homepage.leadText = JsonHelper.getString(body, "leadText", db.homepage.leadText);
        db.homepage.updatedAt = DormitoryDatabase.nowIso();
        db.logActivity(admin, "update", "homepage", "Bosh sahifa", db.homepage.titleHighlight, "", "", "Bosh sahifa matnlarini yangiladi");
        JsonHelper.sendJson(exchange, 200, "{\"homepage\":" + db.homepageToJson() + "}");
    }

    private void handleUploadImage(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String imageData = JsonHelper.getString(body, "imageData", null);
        String prefix = JsonHelper.getString(body, "prefix", "room");
        String url = AuthService.saveUploadedImage(db.projectRoot, imageData, prefix);
        if (url == null) {
            JsonHelper.sendError(exchange, 400, "Rasm formati noto‘g‘ri.");
            return;
        }
        db.logActivity(admin, "create", "gallery", "Rasm yuklash", url, "", "", "Serverga yangi rasm yukladi: " + url);
        JsonHelper.sendJson(exchange, 201, "{\"imageUrl\":" + JsonHelper.quote(url) + "}");
    }

    private void handleCreateFaq(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String q = JsonHelper.getString(body, "q", "").trim();
        String a = JsonHelper.getString(body, "a", "").trim();
        if (q.isEmpty() || a.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Savol va javobni kiriting.");
            return;
        }
        long id = db.faqSeq.incrementAndGet();
        db.faqs.add(new FaqItem(id, q, a, db.faqs.size() + 1, DormitoryDatabase.nowIso()));
        db.logActivity(admin, "create", "faqs", "FAQ", q, "", "", "Yangi FAQ qo‘shdi: " + q);
        JsonHelper.sendJson(exchange, 201, "{\"faqs\":" + db.faqsToJson() + ",\"message\":\"Savol-javob qo‘shildi!\"}");
    }

    private void handleUpdateFaq(HttpExchange exchange, Account admin, long id) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (FaqItem f : db.faqs) {
            if (f.id == id) {
                f.q = JsonHelper.getString(body, "q", f.q).trim();
                f.a = JsonHelper.getString(body, "a", f.a).trim();
                db.logActivity(admin, "update", "faqs", "FAQ", f.q, "", "", "FAQ ni tahrirladi: " + f.q);
                JsonHelper.sendJson(exchange, 200, "{\"faqs\":" + db.faqsToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Savol-javob topilmadi.");
    }

    private void handleDeleteFaq(HttpExchange exchange, Account admin, long id) throws IOException {
        FaqItem found = db.faqs.stream().filter(f -> f.id == id).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Savol-javob topilmadi.");
            return;
        }
        db.faqs.remove(found);
        db.logActivity(admin, "delete", "faqs", "FAQ", found.q, "", "", "FAQ ni o‘chirdi: " + found.q);
        JsonHelper.sendJson(exchange, 200, "{\"faqs\":" + db.faqsToJson() + ",\"message\":\"Savol-javob o‘chirildi.\"}");
    }

    private void handleCreateChat(HttpExchange exchange, Account admin) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String name = JsonHelper.getString(body, "studentName", "").trim();
        String phone = JsonHelper.getString(body, "phone", "").trim();
        if (name.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Klient ismini kiriting.");
            return;
        }
        SupportChat c = new SupportChat();
        c.id = db.chatSeq.incrementAndGet();
        c.threadKey = "admin-" + c.id;
        c.studentName = name;
        c.phone = phone;
        c.course = JsonHelper.getString(body, "course", "");
        c.assignedRoomNumber = JsonHelper.getString(body, "assignedRoomNumber", "");
        c.status = "open";
        c.createdAt = DormitoryDatabase.nowIso();
        c.updatedAt = c.createdAt;
        String initMsg = JsonHelper.getString(body, "initialMessage", "").trim();
        if (!initMsg.isEmpty()) {
            c.messages.add(new ChatMessage(db.chatMsgSeq.incrementAndGet(), c.id, "admin", "TPU Ma’muriyati", initMsg, DormitoryDatabase.nowIso()));
            c.lastMessage = initMsg;
            c.unreadStudent = 1;
        }
        db.chats.add(0, c);
        db.logActivity(admin, initMsg.isEmpty() ? "create" : "contact", "chats", "Support Chat", name, name, phone, name + " bilan yangi chat yaratdi");
        JsonHelper.sendJson(exchange, 201, "{\"chat\":" + db.supportChatToJson(c) + ",\"chats\":" + chatsToJson() + "}");
    }

    private void handleChatRead(HttpExchange exchange, long chatId) throws IOException {
        for (SupportChat c : db.chats) {
            if (c.id == chatId) c.unreadAdmin = 0;
        }
        JsonHelper.sendJson(exchange, 200, "{\"chats\":" + chatsToJson() + "}");
    }

    private void handleUpdateChat(HttpExchange exchange, Account admin, long chatId) throws IOException {
        String body = JsonHelper.readBody(exchange);
        for (SupportChat c : db.chats) {
            if (c.id == chatId) {
                c.studentName = JsonHelper.getString(body, "studentName", c.studentName);
                c.phone = JsonHelper.getString(body, "phone", c.phone);
                c.course = JsonHelper.getString(body, "course", c.course);
                c.assignedRoomNumber = JsonHelper.getString(body, "assignedRoomNumber", c.assignedRoomNumber);
                c.status = JsonHelper.getString(body, "status", c.status);
                c.updatedAt = DormitoryDatabase.nowIso();
                db.logActivity(admin, "update", "chats", "Support Chat", c.studentName, c.studentName, c.phone, c.studentName + " chatini tahrirladi");
                JsonHelper.sendJson(exchange, 200, "{\"chats\":" + chatsToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Chat topilmadi.");
    }

    private void handleDeleteChat(HttpExchange exchange, Account admin, long chatId) throws IOException {
        SupportChat found = db.chats.stream().filter(c -> c.id == chatId).findFirst().orElse(null);
        if (found == null) {
            JsonHelper.sendError(exchange, 404, "Chat topilmadi.");
            return;
        }
        db.chats.remove(found);
        db.logActivity(admin, "delete", "chats", "Support Chat", found.studentName, found.studentName, found.phone, found.studentName + " chatini o‘chirdi");
        JsonHelper.sendJson(exchange, 200, "{\"chats\":" + chatsToJson() + "}");
    }

    private void handleChatReply(HttpExchange exchange, Account admin, long chatId) throws IOException {
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
                db.logActivity(admin, "contact", "chats", "Chat javobi", c.studentName, c.studentName, c.phone, c.studentName + " ga javob yubordi");
                JsonHelper.sendJson(exchange, 201, "{\"chat\":" + db.supportChatToJson(c) + ",\"chats\":" + chatsToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Chat topilmadi.");
    }

    private void handleUpdateChatMessage(HttpExchange exchange, Account admin, long chatId, long msgId) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String nextMsg = JsonHelper.getString(body, "message", "").trim();
        if (nextMsg.isEmpty()) {
            JsonHelper.sendError(exchange, 400, "Xabar matnini kiriting.");
            return;
        }
        for (SupportChat c : db.chats) {
            if (c.id == chatId) {
                for (ChatMessage m : c.messages) {
                    if (m.id == msgId) {
                        m.message = nextMsg;
                        c.lastMessage = c.messages.get(c.messages.size() - 1).message;
                        db.logActivity(admin, "update", "chats", "Chat xabari", c.studentName, c.studentName, c.phone, c.studentName + " suhbat xabarini tahrirladi");
                        JsonHelper.sendJson(exchange, 200, "{\"chats\":" + chatsToJson() + "}");
                        return;
                    }
                }
            }
        }
        JsonHelper.sendError(exchange, 404, "Xabar topilmadi.");
    }

    private void handleDeleteChatMessage(HttpExchange exchange, Account admin, long chatId, long msgId) throws IOException {
        for (SupportChat c : db.chats) {
            if (c.id == chatId) {
                boolean removed = c.messages.removeIf(m -> m.id == msgId);
                if (!removed) break;
                c.lastMessage = c.messages.isEmpty() ? "" : c.messages.get(c.messages.size() - 1).message;
                db.logActivity(admin, "delete", "chats", "Chat xabari", c.studentName, c.studentName, c.phone, c.studentName + " suhbat xabarini o‘chirdi");
                JsonHelper.sendJson(exchange, 200, "{\"chats\":" + chatsToJson() + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 404, "Xabar topilmadi.");
    }
}
