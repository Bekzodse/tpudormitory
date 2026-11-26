package uz.tpu.dormitory.models;

import java.util.ArrayList;
import java.util.List;

public class DormModels {

    public static class Account {
        public long id;
        public String firstName;
        public String lastName;
        public Integer age;
        public String course;
        public String phone;
        public String avatar;
        public String role;
        public String login;
        public String passwordHash;
        public String passwordCiphertext;
        public String createdAt;

        public Account(long id, String firstName, String lastName, Integer age, String course,
                       String phone, String avatar, String role, String login,
                       String passwordHash, String passwordCiphertext, String createdAt) {
            this.id = id;
            this.firstName = firstName;
            this.lastName = lastName;
            this.age = age;
            this.course = course;
            this.phone = phone;
            this.avatar = avatar;
            this.role = role;
            this.login = login;
            this.passwordHash = passwordHash;
            this.passwordCiphertext = passwordCiphertext;
            this.createdAt = createdAt;
        }
    }

    public static class RoomInventory {
        public long id;
        public String category;
        public String title;
        public String price;
        public long priceNum;
        public int totalRooms;
        public int spotsPerRoom;
        public int occupiedSpots;
        public String people;
        public String tag;
        public String badgeType;
        public String floor;
        public String size;
        public String bathroom;
        public String image;
        public List<String> gallery = new ArrayList<>();
        public String description;
        public List<String> amenities = new ArrayList<>();
        public List<String> features = new ArrayList<>();

        public int totalSpots() {
            return totalRooms * spotsPerRoom;
        }

        public int availableSpots() {
            return Math.max(0, totalSpots() - occupiedSpots);
        }
    }

    public static class DormRoom {
        public long id;
        public String roomNumber;
        public long roomTypeId;
        public String roomCategory;
        public int floor;
        public int capacity;
        public String status;
        public String customPrice;
        public String image;
        public String description;
        public String createdAt;
    }

    public static class Resident {
        public long id;
        public long dormRoomId;
        public Long bookingId;
        public String studentName;
        public String phone;
        public String telegram;
        public String course;
        public String faculty;
        public String paymentStatus;
        public String moveInDate;
        public String createdAt;
    }

    public static class Booking {
        public long id;
        public long roomId;
        public String roomTitle;
        public String roomCategory;
        public String studentName;
        public String phone;
        public String telegram;
        public String course;
        public Integer age;
        public String moveInDate;
        public String duration;
        public String notes;
        public String preferredRoomNumber;
        public Long studentAccountId;
        public String status;
        public String adminNote;
        public String createdAt;
        public String updatedAt;
    }

    public static class MaintenanceRequest {
        public long id;
        public String roomNumber;
        public String category;
        public String description;
        public String priority;
        public String status;
        public String reporterName;
        public String adminNote;
        public String createdAt;
        public String updatedAt;
    }

    public static class Announcement {
        public long id;
        public String title;
        public String category;
        public String content;
        public String audience;
        public boolean pinned;
        public String createdAt;
    }

    public static class ContactMessage {
        public long id;
        public String firstName;
        public String lastName;
        public String phone;
        public String subject;
        public String message;
        public String status;
        public String adminNote;
        public String createdAt;
    }

    public static class GalleryCategory {
        public long id;
        public String slug;
        public String name;
        public String description;
        public int sortOrder;
        public String createdAt;

        public GalleryCategory(long id, String slug, String name, String description, int sortOrder, String createdAt) {
            this.id = id;
            this.slug = slug;
            this.name = name;
            this.description = description;
            this.sortOrder = sortOrder;
            this.createdAt = createdAt;
        }
    }

    public static class GalleryPhoto {
        public long id;
        public String title;
        public String category;
        public String image;
        public String tag;
        public String description;
        public String createdAt;

        public GalleryPhoto(long id, String title, String category, String image, String tag, String description, String createdAt) {
            this.id = id;
            this.title = title;
            this.category = category;
            this.image = image;
            this.tag = tag;
            this.description = description != null ? description : "";
            this.createdAt = createdAt;
        }

        public GalleryPhoto(long id, String title, String category, String image, String tag, String createdAt) {
            this(id, title, category, image, tag, "", createdAt);
        }
    }

    public static class SiteBottomText {
        public long id;
        public String section;
        public String title;
        public String content;
        public String badge;
        public int sortOrder;
        public String createdAt;

        public SiteBottomText(long id, String section, String title, String content, String badge, int sortOrder, String createdAt) {
            this.id = id;
            this.section = section;
            this.title = title;
            this.content = content;
            this.badge = badge;
            this.sortOrder = sortOrder;
            this.createdAt = createdAt;
        }
    }

    public static class StatItem {
        public String value;
        public String label;

        public StatItem(String value, String label) {
            this.value = value;
            this.label = label;
        }
    }

    public static class HeroPhoto {
        public String id;
        public String title;
        public String image;
        public String tag;

        public HeroPhoto(String id, String title, String image, String tag) {
            this.id = id;
            this.title = title;
            this.image = image;
            this.tag = tag;
        }
    }

    public static class HomepageSettings {
        public String eyebrowBadge;
        public String eyebrowStatus;
        public String titlePrefix;
        public String titleHighlight;
        public String titleSuffix;
        public String leadText;
        public List<StatItem> stats = new ArrayList<>();
        public List<HeroPhoto> heroPhotos = new ArrayList<>();
        public String updatedAt;
    }

    public static class FaqItem {
        public long id;
        public String q;
        public String a;
        public int sortOrder;
        public String createdAt;

        public FaqItem(long id, String q, String a, int sortOrder, String createdAt) {
            this.id = id;
            this.q = q;
            this.a = a;
            this.sortOrder = sortOrder;
            this.createdAt = createdAt;
        }
    }

    public static class ChatMessage {
        public long id;
        public long chatId;
        public String senderRole;
        public String senderName;
        public String message;
        public String createdAt;

        public ChatMessage(long id, long chatId, String senderRole, String senderName, String message, String createdAt) {
            this.id = id;
            this.chatId = chatId;
            this.senderRole = senderRole;
            this.senderName = senderName;
            this.message = message;
            this.createdAt = createdAt;
        }
    }

    public static class SupportChat {
        public long id;
        public String threadKey;
        public String studentName;
        public String phone;
        public String course;
        public String roomTitle;
        public String assignedRoomNumber;
        public Long bookingId;
        public Long studentAccountId;
        public String status;
        public int unreadAdmin;
        public int unreadStudent;
        public String lastMessage;
        public String updatedAt;
        public String createdAt;
        public List<ChatMessage> messages = new ArrayList<>();
    }

    public static class Facility {
        public long id;
        public String iconName;
        public String category;
        public String title;
        public String sub;
        public String badge;
        public int sortOrder;
        public String createdAt;

        public Facility(long id, String iconName, String category, String title, String sub, String badge, int sortOrder, String createdAt) {
            this.id = id;
            this.iconName = iconName != null ? iconName : "Wifi";
            this.category = category != null ? category : "amenity";
            this.title = title;
            this.sub = sub != null ? sub : "";
            this.badge = badge != null ? badge : "";
            this.sortOrder = sortOrder;
            this.createdAt = createdAt;
        }
    }

    public static class AdminActivityLog {
        public long id;
        public Long adminId;
        public String adminLogin;
        public String adminName;
        public String actionType;
        public String section;
        public String entityLabel;
        public String targetName;
        public String clientName;
        public String clientPhone;
        public String summary;
        public String createdAt;

        public AdminActivityLog(long id, Long adminId, String adminLogin, String adminName,
                                String actionType, String section, String entityLabel,
                                String targetName, String clientName, String clientPhone,
                                String summary, String createdAt) {
            this.id = id;
            this.adminId = adminId;
            this.adminLogin = adminLogin != null ? adminLogin : "AdminTPU";
            this.adminName = adminName != null ? adminName : "TPU Administrator";
            this.actionType = actionType != null ? actionType : "update";
            this.section = section != null ? section : "general";
            this.entityLabel = entityLabel != null ? entityLabel : "";
            this.targetName = targetName != null ? targetName : "";
            this.clientName = clientName != null ? clientName : "";
            this.clientPhone = clientPhone != null ? clientPhone : "";
            this.summary = summary != null ? summary : "";
            this.createdAt = createdAt;
        }
    }
}
