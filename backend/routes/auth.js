import { Router } from "express";
import { db } from "../db/database.js";
import {
  clearSession,
  createSession,
  encryptSecret,
  getSession,
  hashPassword,
  publicStudent,
  validateAvatar,
  verifyPassword
} from "../utils/auth.js";

const router = Router();
const loginPattern = /^[A-Za-z0-9_]{4,}$/;

router.post("/register", async (request, response) => {
  const { firstName, lastName, age, course, phone, login, password, avatar } = request.body;
  const cleanLogin = String(login || "").trim();
  const cleanFirstName = String(firstName || "").trim();
  const cleanLastName = String(lastName || "").trim();
  const cleanCourse = String(course || "").trim();
  const cleanPhone = String(phone || "").trim();
  const parsedAge = Number(age);

  if (!cleanFirstName || !cleanLastName) {
    return response.status(400).json({ message: "Ism va familiyangizni kiriting." });
  }
  if (!Number.isInteger(parsedAge) || parsedAge < 15 || parsedAge > 60) {
    return response.status(400).json({ message: "Yoshingizni 15 dan 60 gacha to‘g‘ri kiriting." });
  }
  if (!cleanCourse) {
    return response.status(400).json({ message: "Nechinchi kurs ekanligingizni tanlang." });
  }
  if (cleanPhone.replace(/\D/g, "").length < 7) {
    return response.status(400).json({ message: "Telefon raqamingizni to‘liq kiriting." });
  }
  if (!loginPattern.test(cleanLogin)) {
    return response.status(400).json({ message: "Login kamida 4 ta harf, raqam yoki _ belgisidan iborat bo‘lishi kerak." });
  }
  if (String(password || "").length < 6) {
    return response.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo‘lishi kerak." });
  }

  const avatarCheck = validateAvatar(avatar);
  if (avatarCheck?.error) return response.status(400).json({ message: avatarCheck.error });

  const existingLogin = db.prepare("SELECT id FROM accounts WHERE login = ? COLLATE NOCASE").get(cleanLogin);
  if (existingLogin) return response.status(409).json({ message: "Bu login allaqachon band. Boshqa login tanlang." });

  try {
    const passwordHash = await hashPassword(password);
    const passwordCipher = encryptSecret(password);
    const result = db.prepare(`
      INSERT INTO accounts (first_name, last_name, age, course, phone, avatar, login, password_hash, password_ciphertext, registration_method, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'universityId', 1)
    `).run(
      cleanFirstName,
      cleanLastName,
      parsedAge,
      cleanCourse,
      cleanPhone,
      avatarCheck ? avatarCheck.value : null,
      cleanLogin,
      passwordHash,
      passwordCipher
    );
    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(result.lastInsertRowid);
    createSession(response, account.id);
    return response.status(201).json({
      student: publicStudent(account),
      message: "Tabriklaymiz! Profilingiz muvaffaqiyatli ochildi."
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "Bu login allaqachon mavjud." });
    return response.status(500).json({ message: "Profil ochishda server xatosi yuz berdi." });
  }
});

router.put("/profile", (request, response) => {
  const session = getSession(request);
  if (!session) return response.status(401).json({ message: "Avval tizimga kiring." });

  const account = db.prepare("SELECT * FROM accounts WHERE id = ? AND verified = 1").get(session.accountId);
  if (!account) return response.status(401).json({ message: "Profil topilmadi." });

  const { firstName, lastName, age, course, phone, avatar } = request.body;
  const cleanFirstName = String(firstName ?? account.first_name).trim();
  const cleanLastName = String(lastName ?? account.last_name).trim();
  const cleanCourse = String(course ?? account.course ?? "").trim();
  const cleanPhone = String(phone ?? account.phone ?? "").trim();
  const parsedAge = age !== undefined && age !== null && age !== "" ? Number(age) : account.age;

  if (!cleanFirstName || !cleanLastName) {
    return response.status(400).json({ message: "Ism va familiya bo‘sh bo‘lmasligi kerak." });
  }
  if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 15 || parsedAge > 60)) {
    return response.status(400).json({ message: "Yoshingizni 15 dan 60 gacha to‘g‘ri kiriting." });
  }
  if (cleanPhone && cleanPhone.replace(/\D/g, "").length < 7) {
    return response.status(400).json({ message: "Telefon raqamingizni to‘liq kiriting." });
  }

  let nextAvatar = account.avatar;
  if (avatar === null) {
    nextAvatar = null;
  } else if (avatar !== undefined) {
    const avatarCheck = validateAvatar(avatar);
    if (avatarCheck?.error) return response.status(400).json({ message: avatarCheck.error });
    nextAvatar = avatarCheck.value;
  }

  db.prepare(`
    UPDATE accounts
    SET first_name = ?, last_name = ?, age = ?, course = ?, phone = ?, avatar = ?
    WHERE id = ?
  `).run(cleanFirstName, cleanLastName, parsedAge, cleanCourse, cleanPhone, nextAvatar, account.id);

  const updated = db.prepare("SELECT * FROM accounts WHERE id = ?").get(account.id);
  return response.json({ student: publicStudent(updated), message: "Profil ma’lumotlari yangilandi." });
});

router.post("/login", async (request, response) => {
  const { login, password } = request.body;
  const account = db.prepare("SELECT * FROM accounts WHERE login = ? COLLATE NOCASE AND verified = 1").get(String(login || "").trim());
  if (!account || !(await verifyPassword(String(password || ""), account.password_hash))) {
    return response.status(401).json({ message: "Login yoki parol noto‘g‘ri." });
  }
  createSession(response, account.id);
  return response.json({ student: publicStudent(account) });
});

router.get("/me", (request, response) => {
  const session = getSession(request);
  if (!session) return response.status(401).json({ message: "Sessiya topilmadi." });
  const account = db.prepare("SELECT * FROM accounts WHERE id = ? AND verified = 1").get(session.accountId);
  if (!account) return response.status(401).json({ message: "Akkaunt tasdiqlanmagan." });
  return response.json({ student: publicStudent(account) });
});

router.post("/logout", (request, response) => {
  clearSession(request, response);
  return response.status(204).end();
});

export default router;
