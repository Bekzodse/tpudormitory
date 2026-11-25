import crypto from "node:crypto";

export const sessionMaxAge = 1000 * 60 * 60 * 8;
const sessions = new Map();

const secretKey = crypto
  .createHash("sha256")
  .update(process.env.AUTH_ENCRYPTION_KEY || "development-only-change-me")
  .digest();

export function hashValue(value) {
  return crypto.createHash("sha256").update(String(value).trim().toUpperCase()).digest("hex");
}

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(`${salt.toString("hex")}:${derivedKey.toString("hex")}`);
    });
  });
}

export function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const [saltHex, hashHex] = String(stored || "").split(":");
    if (!saltHex || !hashHex) return resolve(false);
    crypto.scrypt(password, Buffer.from(saltHex, "hex"), 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(crypto.timingSafeEqual(Buffer.from(hashHex, "hex"), derivedKey));
    });
  });
}

export function encryptSecret(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload) {
  if (!payload || typeof payload !== "string") return null;
  try {
    const [ivHex, tagHex, dataHex] = payload.split(":");
    if (!ivHex || !tagHex || !dataHex) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function publicStudent(account) {
  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    age: account.age || null,
    course: account.course || "",
    phone: account.phone || "",
    login: account.login,
    role: account.role || "student",
    avatar: account.avatar || null
  };
}

export function validateAvatar(avatar) {
  if (!avatar) return null;
  const clean = String(avatar);
  if (!clean.startsWith("data:image/") || clean.length > 1_500_000) {
    return { error: "Rasm formati noto‘g‘ri yoki hajmi 1 MB dan katta." };
  }
  return { value: clean };
}

export function createSession(response, accountId) {
  const token = crypto.randomBytes(32).toString("base64url");
  sessions.set(token, { accountId, expiresAt: Date.now() + sessionMaxAge });
  response.setHeader(
    "Set-Cookie",
    `student_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionMaxAge / 1000}`
  );
  return token;
}

export function clearSession(request, response) {
  const token = request.headers.cookie?.match(/student_session=([^;]+)/)?.[1];
  if (token) sessions.delete(token);
  response.setHeader("Set-Cookie", "student_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

export function getSession(request) {
  const token = request.headers.cookie?.match(/student_session=([^;]+)/)?.[1];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function createRequireAdmin(db) {
  return (request, response, next) => {
    const session = getSession(request);
    if (!session) return response.status(401).json({ message: "Avval tizimga kiring." });
    const account = db.prepare("SELECT * FROM accounts WHERE id = ? AND verified = 1").get(session.accountId);
    if (!account || account.role !== "admin") {
      return response.status(403).json({ message: "Faqat administrator uchun ruxsat berilgan." });
    }
    request.adminAccount = account;
    return next();
  };
}
