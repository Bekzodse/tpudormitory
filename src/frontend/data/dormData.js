import {
  Armchair, BookOpen, CarFront, Dumbbell, ShieldCheck, Utensils, WashingMachine, Wifi
} from "lucide-react";

export const initialRooms = [
  {
    id: 1,
    title: "01 / 2 Kishilik Yotoqxona",
    category: "two",
    people: "2 o‘rin",
    capacityNumber: 2,
    price: "1 100 000 so‘m",
    priceNum: 1100000,
    tag: "Tavsiya etiladi",
    badgeType: "recommended",
    availableSpots: 4,
    floor: "4-qavat",
    size: "24 m²",
    bathroom: "Xona ichida shaxsiy sanuzel",
    image: "/images/room3.jpeg",
    gallery: ["/images/room3.jpeg", "/images/hero-dorm-room.jpeg", "/images/room2.jpeg"],
    description: "Ikkita alohida bir kishilik to‘shak, tabiiy yog‘och tortmalar, 2 ta o‘qish stoli, markaziy isitish, konditsioner va xona ichidagi shaxsiy sanuzel.",
    amenities: [
      "2 ta alohida ortopedik to‘shak",
      "2 ta keng o‘qish stoli va kreslo",
      "Xona ichida shaxsiy sanuzel",
      "Karavot tagidagi keng tortmalar",
      "Markaziy isitish va konditsioner",
      "Yumshoq gilam va zamonaviy interyer"
    ],
    features: ["Shaxsiy sanuzel", "2 ta o‘qish stoli", "Konditsioner", "Wi-Fi 500 Mbps"]
  },
  {
    id: 2,
    title: "02 / 4 Kishilik Yotoqxona",
    category: "four",
    people: "4 o‘rin",
    capacityNumber: 4,
    price: "900 000 so‘m",
    priceNum: 900000,
    tag: "Eng ommabop",
    badgeType: "popular",
    availableSpots: 8,
    floor: "3-qavat",
    size: "30 m²",
    bathroom: "Umumiy zamonaviy dushxonalar",
    image: "/images/room-4.jpg",
    gallery: ["/images/room-4.jpg", "/images/room3.jpeg", "/images/room-6.jpg"],
    description: "4 kishilik yorug‘ va shinam yotoqxona: 2 ta mustahkam ikki qavatli karavot, o‘qish stoli, ko‘k gilam, karavot osti tortmalari va keng deraza.",
    amenities: [
      "2 ta ikki qavatli mustahkam karavot (4 o‘rin)",
      "O‘qish stoli va devor javoni",
      "Karavot ostidagi saqlash tortmalari",
      "Markaziy isitish va keng deraza",
      "500 Mbit/s optik tolali Wi-Fi",
      "Kunlik umumiy tozalash xizmati"
    ],
    features: ["Wi-Fi 500 Mbps", "O‘qish stoli", "Saqlash tortmalari", "Kunlik tozalash"]
  },
  {
    id: 3,
    title: "03 / 6 Kishilik Yotoqxona",
    category: "six",
    people: "6 o‘rin",
    capacityNumber: 6,
    price: "800 000 so‘m",
    priceNum: 800000,
    tag: "Hamyonbop",
    badgeType: "budget",
    availableSpots: 12,
    floor: "2-qavat",
    size: "36 m²",
    bathroom: "Umumiy har qavatda (Alohida bloklar)",
    image: "/images/room-6.jpg",
    gallery: ["/images/room-6.jpg", "/images/room-4.jpg", "/images/room3.jpeg"],
    description: "6 talaba uchun mo‘ljallangan keng va zamonaviy xona: 6 ta alohida bir qavatli karavot, shaxsiy yon tumbalar, LED shift yoritgichi va yumshoq gilam.",
    amenities: [
      "6 ta alohida bir qavatli karavot",
      "Har bir karavot yonida shaxsiy tumba",
      "Zamonaviy LED shift yoritgichi",
      "Rolikli parda va yumshoq gilam",
      "500 Mbit/s optik tolali Wi-Fi",
      "Bepul kir yuvish va oshxona"
    ],
    features: ["6 ta alohida karavot", "Yon tumbalar", "LED yoritish", "Wi-Fi 500 Mbps"]
  }
];

export const facilitiesList = [
  { id: "wifi", icon: Wifi, category: "study", title: "Yuqori tezlikdagi Wi-Fi", sub: "Yotoqxona bo‘ylab 500 Mbit/s tezlikdagi uzluksiz optik tolali internet.", badge: "500 Mbit/s" },
  { id: "security", icon: ShieldCheck, category: "security", title: "24/7 Smart Xavfsizlik", sub: "Smart Face-ID kirish nazorati, 120+ videokuzatuv kameralari va professional qo‘riqlash.", badge: "Face ID" },
  { id: "kitchen", icon: Utensils, category: "dining", title: "Zamonaviy oshxonalar", sub: "Har bir qavatda induksion plitalar, mikroto‘lqinli pechlar va keng muzlatgichlar.", badge: "Har qavatda" },
  { id: "laundry", icon: WashingMachine, category: "amenity", title: "Kir yuvish majmuasi", sub: "Avtomatik kir yuvish va quritish mashinalari hamda dazmollash zonalari bepul.", badge: "Bepul" },
  { id: "gym", icon: Dumbbell, category: "sports", title: "Sport & Fitness zali", sub: "Kardio va kuch mashg‘ulotlari trenajyorlari hamda ochiq street-workout maydonchasi.", badge: "24/7 ochiq" },
  { id: "library", icon: BookOpen, category: "study", title: "Kutubxona & Kovorking", sub: "Tinch mutolaa zali, guruh loyihalari uchun kovorking maydoni va kitoblar fondi.", badge: "Sokin zona" },
  { id: "lounge", icon: Armchair, category: "amenity", title: "Talabalar dam olish zali", sub: "Katta ekran, qulay yumshoq divanlar, stol o‘yinlari va dam olish muhiti.", badge: "Chill lounge" },
  { id: "parking", icon: CarFront, category: "amenity", title: "Xavfsiz avtoturargoh", sub: "Velosiped, skuter va avtomobillar uchun 24/7 videokuzatuv ostidagi qulay turargoh.", badge: "Kuzatuv ostida" }
];

export const galleryItems = [
  { id: 1, title: "Yotoqxona Asosiy Binosi", category: "rooms", image: "/images/campus-2.jpg", tag: "Bino" },
  { id: 2, title: "4 Kishilik Yotoqxona", category: "rooms", image: "/images/room-4.jpg", tag: "4 o‘rin" },
  { id: 3, title: "6 Kishilik Yotoqxona", category: "rooms", image: "/images/room-6.jpg", tag: "6 o‘rin" },
  { id: 4, title: "2 Kishilik Yotoqxona", category: "rooms", image: "/images/room3.jpeg", tag: "2 o‘rin" },
  { id: 5, title: "Keng Talabalar Kutubxonasi", category: "study", image: "/images/l1.jpeg", tag: "Mutolaa zali" },
  { id: 6, title: "Sokin O‘quv va Kovorking Hududi", category: "study", image: "/images/l2.jpeg", tag: "O‘qish zali" },
  { id: 7, title: "Guruh Ishlari va Kitobxonlik Zali", category: "study", image: "/images/l3.jpeg", tag: "Kovorking" },
  { id: 8, title: "Har Bir Qavatdagi Oshxona", category: "dining", image: "/images/k1.jpeg", tag: "Pishirish maydoni" },
  { id: 9, title: "Umumiy Ovqatlanish Maydoni", category: "dining", image: "/images/k2.jpeg", tag: "Oshxona" },
  { id: 10, title: "Maishiy Texnika va Jihozlar", category: "dining", image: "/images/k3.jpeg", tag: "Jihozlar" },
  { id: 11, title: "Ochiq Basketbol Maydonchasi", category: "sports", image: "/images/b1.jpeg", tag: "Sport" },
  { id: 12, title: "Talabalar Sport Majmuasi", category: "sports", image: "/images/b2.webp", tag: "Jismoniy tarbiya" },
  { id: 13, title: "Street Workout Maydoni", category: "sports", image: "/images/b3.jpeg", tag: "Mashg‘ulot" },
  { id: 14, title: "TPU Bosh O‘quv Korpus Fasad", category: "campus", image: "/images/d1.jpg", tag: "Universitet binosi" },
  { id: 15, title: "Yotoqxona Kirish Maydoni va Hovli", category: "campus", image: "/images/d2.jpeg", tag: "Yotoqxona hovlisi" },
  { id: 16, title: "Kampus Xiyoboni va Yashil Hudud", category: "campus", image: "/images/d3.jpg", tag: "Yashil hudud" },
  { id: 17, title: "Yotoqxona Zamonaviy Korpus Binosi", category: "campus", image: "/images/d4.jpg", tag: "Turar joy binosi" },
  { id: 18, title: "Kechki Yoritilgan Kampus", category: "campus", image: "/images/d6.jpeg", tag: "Kechki manzara" },
  { id: 19, title: "Talabalar Shaharchasi Umumiy Ko‘rinishi", category: "campus", image: "/images/dormitory-building.png", tag: "Bosh me’moriy majmua" },
  { id: 20, title: "Universitet Kampusi Panorama", category: "campus", image: "/images/university-campus.png", tag: "Kampus" }
];

export const faqs = [
  {
    q: "Kommunal to‘lovlar (elektr, suv, isitish, Wi-Fi) oylik to‘lov ichidami?",
    a: "Ha, 100%! Barcha kommunal to‘lovlar (sovuq va issiq suv, elektr energiyasi, markaziy isitish, kunlik umumiy tozalash va 500 Mbit/s optik Wi-Fi internet) oylik to‘lov ichiga kiritilgan. Hech qanday yashirin yoki kutilmagan to‘lovlar yo‘q."
  },
  {
    q: "Yotoqxonaga kirish-chiqish vaqti cheklanganmi?",
    a: "Yotoqxona 24/7 Smart Face-ID tizimi bilan jihozlangan. Talabalar xavfsizligi va sokin o‘qish muhitini ta’minlash maqsadida kechki soat 23:00 dan 06:00 gacha sokinlik tartibi amal qiladi. Kechki dars yoki ishda bo‘lgan talabalar oldindan xabar berib ruxsatnoma bilan kirishlari mumkin."
  },
  {
    q: "Xonadoshni o‘zim tanlashim mumkinmi?",
    a: "Albatta! Birgalikda ariza topshirgan do‘stlar, kursdoshlar yoki bir fakultet talabalari bir xonaga joylashtiriladi. Onlayn arizangizdagi 'Qo‘shimcha istaklar' maydoniga do‘stingizning ism-familiyasini kiritishingiz kifoya."
  },
  {
    q: "Ota-onalar yoki yaqinlar yotoqxonaga mehmonga kela oladimi?",
    a: "Ha, har kuni soat 09:00 dan 20:00 gacha ota-onalar va yaqinlar maxsus qabulxona (reception) va 1-qavatdagi umumiy dam olish zalida talabalar bilan uchrashishlari mumkin. Xavfsizlik yuzasidan mehmonlar shaxsini tasdiqlovchi hujjat bilan ro‘yxatga olinadi."
  },
  {
    q: "Kir yuvish va dazmollash uchun alohida pul to‘lanadimi?",
    a: "Yo‘q! Har bir qavatdagi zamonaviy kir yuvish va quritish xonalari hamda dazmollash stollari barcha yashovchi talabalar uchun mutlaqo bepul taqdim etiladi."
  },
  {
    q: "To‘lov tartibi qanday amalga oshiriladi?",
    a: "To‘lovlarni oylik, semestrlik yoki yillik tarzda Payme, Click, Uzum Bank yoki bank rekvizitlari orqali onlayn amalga oshirish mumkin. Bir semestr yoki to‘liq yil uchun oldindan to‘lov qilgan talabalarga maxsus 10% gacha chegirma taqdim etiladi."
  },
  {
    q: "Yotoqxonadan universitet o‘quv korpuslarigacha bo‘lgan masofa qancha?",
    a: "Yotoqxona bevosita universitet talabalar shaharchasida (kampus ichida) joylashgan bo‘lib, asosiy o‘quv korpuslarigacha piyoda bor-yo‘g‘i 3-5 daqiqalik yo‘l."
  }
];

export const heroCampusPhotos = [
  { id: "hero-2", title: "TPU Yotoqxona Asosiy Fasadi", image: "/images/campus-2.jpg", tag: "Bosh korpus" },
  { id: "hero-1", title: "Yotoqxona Kirish Qismi", image: "/images/campus-1.jpg", tag: "Kirish maydoni" },
  { id: "hero-3", title: "Kampus Xiyoboni va Yotoqxona", image: "/images/campus-3.jpg", tag: "Kampus" },
  { id: "hero-4", title: "Yotoqxona Hovlisi va Korpus", image: "/images/campus-4.jpg", tag: "Hovli" }
];

export const COURSE_OPTIONS = [
  "1-kurs",
  "2-kurs",
  "3-kurs",
  "4-kurs",
  "Magistratura 1-kurs",
  "Magistratura 2-kurs"
];

export function resizeAvatarFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Faqat rasm faylini tanlang (JPG, PNG, WEBP)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Rasmni o‘qib bo‘lmadi."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasmni qayta ishlab bo‘lmadi."));
      img.onload = () => {
        const maxSide = 320;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
