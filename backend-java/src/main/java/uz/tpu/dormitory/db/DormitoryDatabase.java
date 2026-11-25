package uz.tpu.dormitory.db;

import uz.tpu.dormitory.models.DormModels.*;
import uz.tpu.dormitory.utils.AuthService;
import uz.tpu.dormitory.utils.JsonHelper;

import java.io.File;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

public class DormitoryDatabase {

    public final File projectRoot;
    public final List<Account> accounts = new CopyOnWriteArrayList<>();
    public final List<RoomInventory> rooms = new CopyOnWriteArrayList<>();
    public final List<DormRoom> dormRooms = new CopyOnWriteArrayList<>();
    public final List<Resident> residents = new CopyOnWriteArrayList<>();
    public final List<Booking> bookings = new CopyOnWriteArrayList<>();
    public final List<MaintenanceRequest> maintenance = new CopyOnWriteArrayList<>();
    public final List<Announcement> announcements = new CopyOnWriteArrayList<>();
    public final List<ContactMessage> messages = new CopyOnWriteArrayList<>();
    public final List<GalleryCategory> galleryCategories = new CopyOnWriteArrayList<>();
    public final List<GalleryPhoto> gallery = new CopyOnWriteArrayList<>();
    public final List<SiteBottomText> bottomTexts = new CopyOnWriteArrayList<>();
    public final List<FaqItem> faqs = new CopyOnWriteArrayList<>();
    public final List<SupportChat> chats = new CopyOnWriteArrayList<>();
    public HomepageSettings homepage = new HomepageSettings();

    public final AtomicLong accountSeq = new AtomicLong(10);
    public final AtomicLong roomSeq = new AtomicLong(4);
    public final AtomicLong dormRoomSeq = new AtomicLong(20);
    public final AtomicLong residentSeq = new AtomicLong(30);
    public final AtomicLong bookingSeq = new AtomicLong(10);
    public final AtomicLong maintSeq = new AtomicLong(10);
    public final AtomicLong annSeq = new AtomicLong(10);
    public final AtomicLong msgSeq = new AtomicLong(10);
    public final AtomicLong galCatSeq = new AtomicLong(10);
    public final AtomicLong galSeq = new AtomicLong(30);
    public final AtomicLong bottomTextSeq = new AtomicLong(20);
    public final AtomicLong faqSeq = new AtomicLong(20);
    public final AtomicLong chatSeq = new AtomicLong(10);
    public final AtomicLong chatMsgSeq = new AtomicLong(50);

    public DormitoryDatabase(File projectRoot) {
        this.projectRoot = projectRoot;
        seedDefaults();
    }

    public static String nowIso() {
        return Instant.now().toString().replace("T", " ").substring(0, 19);
    }

    private void seedDefaults() {
        // 1. Admin Account
        accounts.add(new Account(
                1L, "TPU", "Administrator", null, "Ma’muriyat", "+998 77 129 29 29",
                null, "admin", "AdminTPU",
                AuthService.hashPassword("TPU20206"),
                AuthService.encryptSecret("TPU20206"),
                nowIso()
        ));

        // 2. Room Inventory (2, 4, 6 person rooms with full image & price metadata)
        RoomInventory r1 = new RoomInventory();
        r1.id = 1L;
        r1.category = "two";
        r1.title = "01 / 2 Kishilik Yotoqxona";
        r1.price = "1 100 000 so‘m";
        r1.priceNum = 1100000L;
        r1.totalRooms = 12;
        r1.spotsPerRoom = 2;
        r1.occupiedSpots = 20;
        r1.people = "2 o‘rin";
        r1.tag = "Tavsiya etiladi";
        r1.badgeType = "recommended";
        r1.floor = "4-qavat";
        r1.size = "24 m²";
        r1.bathroom = "Xona ichida shaxsiy sanuzel";
        r1.image = "/images/room3.jpeg";
        r1.gallery = new ArrayList<>(List.of("/images/room3.jpeg", "/images/hero-dorm-room.jpeg", "/images/room2.jpeg"));
        r1.description = "Ikkita alohida bir kishilik to‘shak, tabiiy yog‘och tortmalar, 2 ta o‘qish stoli, markaziy isitish, konditsioner va xona ichidagi shaxsiy sanuzel.";
        r1.amenities = new ArrayList<>(List.of("2 ta alohida ortopedik to‘shak", "2 ta keng o‘qish stoli va kreslo", "Xona ichida shaxsiy sanuzel", "Markaziy isitish va konditsioner"));
        r1.features = new ArrayList<>(List.of("Shaxsiy sanuzel", "2 ta o‘qish stoli", "Konditsioner", "Wi-Fi 500 Mbps"));
        rooms.add(r1);

        RoomInventory r2 = new RoomInventory();
        r2.id = 2L;
        r2.category = "four";
        r2.title = "02 / 4 Kishilik Yotoqxona";
        r2.price = "900 000 so‘m";
        r2.priceNum = 900000L;
        r2.totalRooms = 15;
        r2.spotsPerRoom = 4;
        r2.occupiedSpots = 52;
        r2.people = "4 o‘rin";
        r2.tag = "Eng ommabop";
        r2.badgeType = "popular";
        r2.floor = "3-qavat";
        r2.size = "30 m²";
        r2.bathroom = "Umumiy zamonaviy dushxonalar";
        r2.image = "/images/room-4.jpg";
        r2.gallery = new ArrayList<>(List.of("/images/room-4.jpg", "/images/room3.jpeg", "/images/room-6.jpg"));
        r2.description = "4 kishilik yorug‘ va shinam yotoqxona: 2 ta mustahkam ikki qavatli karavot, o‘qish stoli, ko‘k gilam, karavot osti tortmalari va keng deraza.";
        r2.amenities = new ArrayList<>(List.of("2 ta ikki qavatli mustahkam karavot (4 o‘rin)", "O‘qish stoli va devor javoni", "500 Mbit/s optik tolali Wi-Fi", "Kunlik umumiy tozalash xizmati"));
        r2.features = new ArrayList<>(List.of("Wi-Fi 500 Mbps", "O‘qish stoli", "Saqlash tortmalari", "Kunlik tozalash"));
        rooms.add(r2);

        RoomInventory r3 = new RoomInventory();
        r3.id = 3L;
        r3.category = "six";
        r3.title = "03 / 6 Kishilik Yotoqxona";
        r3.price = "800 000 so‘m";
        r3.priceNum = 800000L;
        r3.totalRooms = 10;
        r3.spotsPerRoom = 6;
        r3.occupiedSpots = 48;
        r3.people = "6 o‘rin";
        r3.tag = "Hamyonbop";
        r3.badgeType = "budget";
        r3.floor = "2-qavat";
        r3.size = "36 m²";
        r3.bathroom = "Umumiy har qavatda (Alohida bloklar)";
        r3.image = "/images/room-6.jpg";
        r3.gallery = new ArrayList<>(List.of("/images/room-6.jpg", "/images/room-4.jpg", "/images/room3.jpeg"));
        r3.description = "6 talaba uchun mo‘ljallangan keng va zamonaviy xona: 6 ta alohida bir qavatli karavot, shaxsiy yon tumbalar, LED shift yoritgichi va yumshoq gilam.";
        r3.amenities = new ArrayList<>(List.of("6 ta alohida bir qavatli karavot", "Har bir karavot yonida shaxsiy tumba", "500 Mbit/s optik tolali Wi-Fi", "Bepul kir yuvish va oshxona"));
        r3.features = new ArrayList<>(List.of("6 ta alohida karavot", "Yon tumbalar", "LED yoritish", "Wi-Fi 500 Mbps"));
        rooms.add(r3);

        // 3. Numbered Dorm Rooms
        Object[][] initialDormRooms = {
                {1L, "401", 1L, "two", 4, 2, "active", "1 100 000 so‘m", "/images/room3.jpeg"},
                {2L, "402", 1L, "two", 4, 2, "active", "1 100 000 so‘m", "/images/room3.jpeg"},
                {3L, "403", 1L, "two", 4, 2, "active", "1 100 000 so‘m", "/images/room3.jpeg"},
                {4L, "404", 1L, "two", 4, 2, "maintenance", "1 100 000 so‘m", "/images/room3.jpeg"},
                {5L, "301", 2L, "four", 3, 4, "active", "900 000 so‘m", "/images/room-4.jpg"},
                {6L, "302", 2L, "four", 3, 4, "active", "900 000 so‘m", "/images/room-4.jpg"},
                {7L, "303", 2L, "four", 3, 4, "active", "900 000 so‘m", "/images/room-4.jpg"},
                {8L, "304", 2L, "four", 3, 4, "active", "900 000 so‘m", "/images/room-4.jpg"},
                {9L, "201", 3L, "six", 2, 6, "active", "800 000 so‘m", "/images/room-6.jpg"},
                {10L, "202", 3L, "six", 2, 6, "active", "800 000 so‘m", "/images/room-6.jpg"},
                {11L, "203", 3L, "six", 2, 6, "active", "800 000 so‘m", "/images/room-6.jpg"}
        };
        for (Object[] row : initialDormRooms) {
            DormRoom dr = new DormRoom();
            dr.id = (Long) row[0];
            dr.roomNumber = (String) row[1];
            dr.roomTypeId = (Long) row[2];
            dr.roomCategory = (String) row[3];
            dr.floor = (Integer) row[4];
            dr.capacity = (Integer) row[5];
            dr.status = (String) row[6];
            dr.customPrice = (String) row[7];
            dr.image = (String) row[8];
            dr.description = "";
            dr.createdAt = nowIso();
            dormRooms.add(dr);
        }

        // 4. Residents
        Object[][] initialResidents = {
                {1L, 1L, "Jasur Karimov", "+998 90 412-11-05", "@jasur_tpu", "3-kurs", "Dasturiy injiniring", "paid", "2026-09-02"},
                {2L, 1L, "Azizbek Tursunov", "+998 91 530-44-21", "@aziz_dev", "3-kurs", "Sun’iy intellekt", "paid", "2026-09-02"},
                {3L, 2L, "Sardorbek Alimov", "+998 93 771-19-82", "@sardor_ai", "4-kurs", "Kiberxavfsizlik", "pending", "2026-09-05"},
                {4L, 5L, "Dilshod Xolmatov", "+998 94 218-63-10", "@dilshod_x", "2-kurs", "Dasturiy injiniring", "paid", "2026-09-01"},
                {5L, 5L, "Bekzod Ergashev", "+998 99 305-22-48", "@bekzod_tpu", "2-kurs", "Biznes boshqaruvi", "paid", "2026-09-01"},
                {6L, 5L, "Otabek Rahimov", "+998 97 640-87-14", "@otabek_r", "2-kurs", "Iqtisodiyot", "overdue", "2026-09-03"},
                {7L, 6L, "Shohrux Nazarov", "+998 90 882-31-90", "@shohrux_n", "1-kurs", "Kiberxavfsizlik", "paid", "2026-09-04"},
                {8L, 6L, "Javohir Qodirov", "+998 91 119-40-55", "@javohir_q", "1-kurs", "Dasturiy injiniring", "pending", "2026-09-04"},
                {9L, 9L, "Umidjon Sultonov", "+998 95 404-12-77", "@umid_s", "1-kurs", "Moliya va audit", "paid", "2026-09-01"},
                {10L, 9L, "Dostonbek Mirzayev", "+998 93 905-66-31", "@doston_m", "1-kurs", "Sun’iy intellekt", "paid", "2026-09-02"},
                {11L, 9L, "Asadbek Yo‘ldoshev", "+998 90 231-75-09", "@asad_y", "2-kurs", "Biznes boshqaruvi", "overdue", "2026-09-03"},
                {12L, 10L, "Kamronbek Ismoilov", "+998 99 512-08-64", "@kamron_i", "2-kurs", "Dasturiy injiniring", "paid", "2026-09-06"}
        };
        for (Object[] row : initialResidents) {
            Resident res = new Resident();
            res.id = (Long) row[0];
            res.dormRoomId = (Long) row[1];
            res.studentName = (String) row[2];
            res.phone = (String) row[3];
            res.telegram = (String) row[4];
            res.course = (String) row[5];
            res.faculty = (String) row[6];
            res.paymentStatus = (String) row[7];
            res.moveInDate = (String) row[8];
            res.createdAt = nowIso();
            residents.add(res);
        }

        // 5. Maintenance Requests
        addMaint(1L, "404", "Iqlim nazorati", "Konditsioner filtrini tozalash va sovutish tekshiruvi", "high", "in_progress");
        addMaint(2L, "302", "Santexnika", "Yuvinish xonasi kranida tomchilash kuzatilmoqda", "medium", "open");
        addMaint(3L, "201", "Internet / Wi-Fi", "201-xona yaqinidagi router signalini qayta sozlash", "low", "resolved");

        // 6. Announcements
        addAnnouncement(1L, "Oylik to‘lov va shartnoma muddatlari eslatmasi", "Moliya",
                "Hurmatli talabalar, joriy oy uchun yotoqxona to‘lovini har oyning 10-sanasiga qadar amalga oshirishingizni so‘raymiz.",
                "Barcha qavatlar", true);
        addAnnouncement(2L, "4-qavat va 3-qavatda tezkor Wi-Fi routerlari yangilandi", "Texnik yangilik",
                "Talabalar murojaatlariga asosan 500 Mbit/s tarmoq qamrovi kengaytirildi.",
                "3 va 4-qavatlar", false);

        // 7. Gallery Categories & Photos
        galleryCategories.add(new GalleryCategory(1L, "rooms", "Xonalar", "2, 4 va 6 kishilik zamonaviy jihozlangan talabalar yotoqxona xonalari.", 1, nowIso()));
        galleryCategories.add(new GalleryCategory(2L, "study", "Kutubxona", "Sokin mutolaa zallari, kovorking va yuqori tezlikdagi Wi-Fi o‘quv hududlari.", 2, nowIso()));
        galleryCategories.add(new GalleryCategory(3L, "dining", "Oshxona", "Har bir qavatda zamonaviy maishiy texnikalar bilan jihozlangan oshxona va ovqatlanish maydoni.", 3, nowIso()));
        galleryCategories.add(new GalleryCategory(4L, "sports", "Sport", "Basketbol maydonchasi, street workout va sog‘lom turmush tarzi uchun sport majmuasi.", 4, nowIso()));
        galleryCategories.add(new GalleryCategory(5L, "campus", "Kampus", "Tashkent Perfect University bosh korpusi, yashil xiyobon va yotoqxona hovlisi.", 5, nowIso()));

        String[][] galData = {
                {"Yotoqxona Asosiy Binosi", "rooms", "/images/campus-2.jpg", "Bino"},
                {"4 Kishilik Yotoqxona", "rooms", "/images/room-4.jpg", "4 o‘rin"},
                {"6 Kishilik Yotoqxona", "rooms", "/images/room-6.jpg", "6 o‘rin"},
                {"2 Kishilik Yotoqxona", "rooms", "/images/room3.jpeg", "2 o‘rin"},
                {"Keng Talabalar Kutubxonasi", "study", "/images/l1.jpeg", "Mutolaa zali"},
                {"Sokin O‘quv va Kovorking Hududi", "study", "/images/l2.jpeg", "O‘qish zali"},
                {"Guruh Ishlari va Kitobxonlik Zali", "study", "/images/l3.jpeg", "Kovorking"},
                {"Har Bir Qavatdagi Oshxona", "dining", "/images/k1.jpeg", "Pishirish maydoni"},
                {"Umumiy Ovqatlanish Maydoni", "dining", "/images/k2.jpeg", "Oshxona"},
                {"Maishiy Texnika va Jihozlar", "dining", "/images/k3.jpeg", "Jihozlar"},
                {"Ochiq Basketbol Maydonchasi", "sports", "/images/b1.jpeg", "Sport"},
                {"Talabalar Sport Majmuasi", "sports", "/images/b2.webp", "Jismoniy tarbiya"},
                {"Street Workout Maydoni", "sports", "/images/b3.jpeg", "Mashg‘ulot"},
                {"TPU Bosh O‘quv Korpus Fasad", "campus", "/images/d1.jpg", "Universitet binosi"},
                {"Yotoqxona Kirish Maydoni va Hovli", "campus", "/images/d2.jpeg", "Yotoqxona hovlisi"},
                {"Kampus Xiyoboni va Yashil Hudud", "campus", "/images/d3.jpg", "Yashil hudud"},
                {"Yotoqxona Zamonaviy Korpus Binosi", "campus", "/images/d4.jpg", "Turar joy binosi"},
                {"Kechki Yoritilgan Kampus", "campus", "/images/d6.jpeg", "Kechki manzara"},
                {"Talabalar Shaharchasi Umumiy Ko‘rinishi", "campus", "/images/dormitory-building.png", "Bosh me’moriy majmua"},
                {"Universitet Kampusi Panorama", "campus", "/images/university-campus.png", "Kampus"}
        };
        long gid = 1;
        for (String[] g : galData) {
            gallery.add(new GalleryPhoto(gid++, g[0], g[1], g[2], g[3], g[0] + " — Tashkent Perfect University talabalar turar joyi majmuasi.", nowIso()));
        }

        bottomTexts.add(new SiteBottomText(1L, "gallery", "100% Haqiqiy Kampus va Xona Suratlari",
                "Fotogalereyadagi barcha rasmlar Tashkent Perfect University talabalar turar joyi, xonalari va o‘quv korpuslaridan olingan haqiqiy suratlardir.",
                "Original foto", 1, nowIso()));
        bottomTexts.add(new SiteBottomText(2L, "gallery", "Barcha Jihozlar va Qulayliklar Tayyor",
                "Har bir xonada ortopedik to‘shak, shaxsiy o‘qish stoli, kiyim shkafi, konditsioner, markaziy isitish va 500 Mbit/s optik Wi-Fi mavjud.",
                "To‘liq jihozlangan", 2, nowIso()));
        bottomTexts.add(new SiteBottomText(3L, "homepage", "Barcha to‘lovlar narx ichida",
                "Elektr, issiq-sovuq suv va internet oylik to‘lov ichida", "100%", 1, nowIso()));

        // 8. Homepage Settings
        homepage.eyebrowBadge = "TPU SMART ACCOMMODATION";
        homepage.eyebrowStatus = "Qabul davom etmoqda";
        homepage.titlePrefix = "Talabalar uchun yangi avlod";
        homepage.titleHighlight = "aqlli va qulay";
        homepage.titleSuffix = "yotoqxonasi";
        homepage.leadText = "Tashkent Perfect University talabalari uchun yaratilgan xavfsiz, zamonaviy va hamyonbop turar joy. Barcha kommunal to‘lovlar, 500 Mbit/s Wi-Fi, 24/7 Face ID xavfsizlik va sokin o‘qish zallari siz uchun muhayyo.";
        homepage.stats = new ArrayList<>(List.of(
                new StatItem("500+", "Talaba sig‘imi"),
                new StatItem("24/7", "Face ID xavfsizlik"),
                new StatItem("3 min", "Universitetgacha"),
                new StatItem("100%", "Kommunal ichida")
        ));
        homepage.heroPhotos = new ArrayList<>(List.of(
                new HeroPhoto("hero-2", "TPU Yotoqxona Asosiy Fasadi", "/images/campus-2.jpg", "Bosh korpus"),
                new HeroPhoto("hero-1", "Yotoqxona Kirish Qismi", "/images/campus-1.jpg", "Kirish maydoni"),
                new HeroPhoto("hero-3", "Kampus Xiyoboni va Yotoqxona", "/images/campus-3.jpg", "Kampus"),
                new HeroPhoto("hero-4", "Yotoqxona Hovlisi va Korpus", "/images/campus-4.jpg", "Hovli")
        ));
        homepage.updatedAt = nowIso();

        // 9. FAQs
        String[][] faqData = {
                {"Kommunal to‘lovlar (elektr, suv, isitish, Wi-Fi) oylik to‘lov ichidami?", "Ha, 100%! Barcha kommunal to‘lovlar oylik to‘lov ichiga kiritilgan."},
                {"Yotoqxonaga kirish-chiqish vaqti cheklanganmi?", "Yotoqxona 24/7 Smart Face-ID tizimi bilan jihozlangan, kechki 23:00 dan 06:00 gacha sokinlik tartibi amal qiladi."},
                {"Xonadoshni o‘zim tanlashim mumkinmi?", "Albatta! Birgalikda ariza topshirgan do‘stlar va kursdoshlar bir xonaga joylashtiriladi."},
                {"Kir yuvish va dazmollash uchun alohida pul to‘lanadimi?", "Yo‘q! Har bir qavatdagi kir yuvish va quritish xonalari talabalar uchun mutlaqo bepul."},
                {"To‘lov tartibi qanday amalga oshiriladi?", "To‘lovlarni Payme, Click, Uzum Bank yoki bank rekvizitlari orqali amalga oshirish mumkin."}
        };
        int fOrder = 1;
        for (String[] f : faqData) {
            faqs.add(new FaqItem(fOrder, f[0], f[1], fOrder, nowIso()));
            fOrder++;
        }

        // 10. Support Chats
        SupportChat c1 = new SupportChat();
        c1.id = 1L;
        c1.threadKey = "phone-998904121105";
        c1.studentName = "Jasur Karimov";
        c1.phone = "+998 90 412-11-05";
        c1.course = "3-kurs";
        c1.roomTitle = "01 / 2 Kishilik Yotoqxona";
        c1.assignedRoomNumber = "401";
        c1.status = "open";
        c1.unreadAdmin = 1;
        c1.unreadStudent = 0;
        c1.lastMessage = "Rahmat! Shartnomani qaysi xonadan olsam bo‘ladi?";
        c1.createdAt = nowIso();
        c1.updatedAt = nowIso();
        c1.messages.add(new ChatMessage(1L, 1L, "student", "Jasur Karimov", "Assalomu alaykum! Arizam qabul qilindi, shartnomani qayerdan olsam bo‘ladi?", nowIso()));
        c1.messages.add(new ChatMessage(2L, 1L, "admin", "TPU Ma’muriyati", "Va alaykum assalom! 1-qavat 102-xona ma’muriyatga pasportingiz bilan keling.", nowIso()));
        c1.messages.add(new ChatMessage(3L, 1L, "student", "Jasur Karimov", "Rahmat! Shartnomani qaysi xonadan olsam bo‘ladi?", nowIso()));
        chats.add(c1);
    }

    private void addMaint(long id, String room, String cat, String desc, String prio, String st) {
        MaintenanceRequest m = new MaintenanceRequest();
        m.id = id;
        m.roomNumber = room;
        m.category = cat;
        m.description = desc;
        m.priority = prio;
        m.status = st;
        m.reporterName = "";
        m.adminNote = "";
        m.createdAt = nowIso();
        m.updatedAt = nowIso();
        maintenance.add(m);
    }

    private void addAnnouncement(long id, String title, String cat, String content, String aud, boolean pinned) {
        Announcement a = new Announcement();
        a.id = id;
        a.title = title;
        a.category = cat;
        a.content = content;
        a.audience = aud;
        a.pinned = pinned;
        a.createdAt = nowIso();
        announcements.add(a);
    }

    public List<String> getAvailableImages() {
        List<String> out = new ArrayList<>();
        File imagesDir = new File(projectRoot, "public/images");
        if (imagesDir.exists()) {
            File uploadsDir = new File(imagesDir, "uploads");
            if (uploadsDir.exists()) {
                File[] upFiles = uploadsDir.listFiles();
                if (upFiles != null) {
                    for (File f : upFiles) {
                        if (f.isFile() && f.getName().matches("(?i).*\\.(jpe?g|png|webp|svg)$")) {
                            out.add("/images/uploads/" + f.getName());
                        }
                    }
                }
            }
            File[] files = imagesDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.isFile() && f.getName().matches("(?i).*\\.(jpe?g|png|webp|svg)$")) {
                        out.add("/images/" + f.getName());
                    }
                }
            }
        }
        return out;
    }

    public String roomInventoryToJson(RoomInventory r) {
        return "{"
                + "\"id\":" + r.id + ","
                + "\"category\":" + JsonHelper.quote(r.category) + ","
                + "\"title\":" + JsonHelper.quote(r.title) + ","
                + "\"people\":" + JsonHelper.quote(r.people) + ","
                + "\"capacityNumber\":" + r.spotsPerRoom + ","
                + "\"price\":" + JsonHelper.quote(r.price) + ","
                + "\"priceNum\":" + r.priceNum + ","
                + "\"tag\":" + JsonHelper.quote(r.tag) + ","
                + "\"badgeType\":" + JsonHelper.quote(r.badgeType) + ","
                + "\"floor\":" + JsonHelper.quote(r.floor) + ","
                + "\"size\":" + JsonHelper.quote(r.size) + ","
                + "\"bathroom\":" + JsonHelper.quote(r.bathroom) + ","
                + "\"image\":" + JsonHelper.quote(r.image) + ","
                + "\"gallery\":" + JsonHelper.stringListJson(r.gallery) + ","
                + "\"description\":" + JsonHelper.quote(r.description) + ","
                + "\"amenities\":" + JsonHelper.stringListJson(r.amenities) + ","
                + "\"features\":" + JsonHelper.stringListJson(r.features) + ","
                + "\"totalRooms\":" + r.totalRooms + ","
                + "\"spotsPerRoom\":" + r.spotsPerRoom + ","
                + "\"totalSpots\":" + r.totalSpots() + ","
                + "\"occupiedSpots\":" + r.occupiedSpots + ","
                + "\"availableSpots\":" + r.availableSpots()
                + "}";
    }

    public String supportChatToJson(SupportChat c) {
        StringBuilder msgs = new StringBuilder("[");
        for (int i = 0; i < c.messages.size(); i++) {
            if (i > 0) msgs.append(",");
            ChatMessage m = c.messages.get(i);
            msgs.append("{")
                    .append("\"id\":").append(m.id).append(",")
                    .append("\"chatId\":").append(m.chatId).append(",")
                    .append("\"senderRole\":").append(JsonHelper.quote(m.senderRole)).append(",")
                    .append("\"senderName\":").append(JsonHelper.quote(m.senderName)).append(",")
                    .append("\"message\":").append(JsonHelper.quote(m.message)).append(",")
                    .append("\"createdAt\":").append(JsonHelper.quote(m.createdAt))
                    .append("}");
        }
        msgs.append("]");
        return "{"
                + "\"id\":" + c.id + ","
                + "\"threadKey\":" + JsonHelper.quote(c.threadKey) + ","
                + "\"studentName\":" + JsonHelper.quote(c.studentName) + ","
                + "\"phone\":" + JsonHelper.quote(c.phone) + ","
                + "\"course\":" + JsonHelper.quote(c.course) + ","
                + "\"roomTitle\":" + JsonHelper.quote(c.roomTitle) + ","
                + "\"assignedRoomNumber\":" + JsonHelper.quote(c.assignedRoomNumber) + ","
                + "\"bookingId\":" + (c.bookingId != null ? c.bookingId : "null") + ","
                + "\"studentAccountId\":" + (c.studentAccountId != null ? c.studentAccountId : "null") + ","
                + "\"status\":" + JsonHelper.quote(c.status) + ","
                + "\"unreadAdmin\":" + c.unreadAdmin + ","
                + "\"unreadStudent\":" + c.unreadStudent + ","
                + "\"lastMessage\":" + JsonHelper.quote(c.lastMessage) + ","
                + "\"updatedAt\":" + JsonHelper.quote(c.updatedAt) + ","
                + "\"createdAt\":" + JsonHelper.quote(c.createdAt) + ","
                + "\"messages\":" + msgs
                + "}";
    }

    public String galleryToJson() {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < gallery.size(); i++) {
            if (i > 0) sb.append(",");
            GalleryPhoto g = gallery.get(i);
            sb.append("{")
                    .append("\"id\":").append(g.id).append(",")
                    .append("\"title\":").append(JsonHelper.quote(g.title)).append(",")
                    .append("\"category\":").append(JsonHelper.quote(g.category)).append(",")
                    .append("\"image\":").append(JsonHelper.quote(g.image)).append(",")
                    .append("\"tag\":").append(JsonHelper.quote(g.tag)).append(",")
                    .append("\"description\":").append(JsonHelper.quote(g.description)).append(",")
                    .append("\"createdAt\":").append(JsonHelper.quote(g.createdAt))
                    .append("}");
        }
        sb.append("]");
        return sb.toString();
    }

    public String galleryCategoriesToJson() {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < galleryCategories.size(); i++) {
            if (i > 0) sb.append(",");
            GalleryCategory c = galleryCategories.get(i);
            long count = gallery.stream().filter(g -> c.slug.equals(g.category)).count();
            sb.append("{")
                    .append("\"id\":").append(c.id).append(",")
                    .append("\"slug\":").append(JsonHelper.quote(c.slug)).append(",")
                    .append("\"name\":").append(JsonHelper.quote(c.name)).append(",")
                    .append("\"description\":").append(JsonHelper.quote(c.description)).append(",")
                    .append("\"photoCount\":").append(count)
                    .append("}");
        }
        sb.append("]");
        return sb.toString();
    }

    public String bottomTextsToJson() {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < bottomTexts.size(); i++) {
            if (i > 0) sb.append(",");
            SiteBottomText b = bottomTexts.get(i);
            sb.append("{")
                    .append("\"id\":").append(b.id).append(",")
                    .append("\"section\":").append(JsonHelper.quote(b.section)).append(",")
                    .append("\"title\":").append(JsonHelper.quote(b.title)).append(",")
                    .append("\"content\":").append(JsonHelper.quote(b.content)).append(",")
                    .append("\"badge\":").append(JsonHelper.quote(b.badge))
                    .append("}");
        }
        sb.append("]");
        return sb.toString();
    }
}
