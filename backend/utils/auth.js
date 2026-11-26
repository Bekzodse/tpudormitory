import crypto from "node:crypto";

export const sessionMaxAge = 1000 * 60 * 60 * 24 * 7; // 7 days persistent session
const memorySessions = new Map();
let sessionDb = null;

export function attachSessionDb(dbInstance) {
  sessionDb = dbInstance;
}

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
  const expiresAt = Date.now() + sessionMaxAge;
  if (sessionDb) {
    try {
      sessionDb.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
      sessionDb.prepare(
        "INSERT OR REPLACE INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)"
      ).run(token, Number(accountId), expiresAt);
    } catch (err) {
      console.error("[Session DB Write Error]", err.message || err);
    }
  }
  memorySessions.set(token, { accountId: Number(accountId), expiresAt });
  response.setHeader(
    "Set-Cookie",
    `student_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionMaxAge / 1000)}`
  );
  return token;
}

export function clearSession(request, response) {
  const token = request.headers.cookie?.match(/student_session=([^;]+)/)?.[1];
  if (token) {
    memorySessions.delete(token);
    if (sessionDb) {
      try {
        sessionDb.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      } catch {
        // ignore
      }
    }
  }
  response.setHeader("Set-Cookie", "student_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

export function getSession(request) {
  const token = request.headers.cookie?.match(/student_session=([^;]+)/)?.[1];
  if (!token) return null;

  const now = Date.now();
  let session = memorySessions.get(token);

  if (!session && sessionDb) {
    try {
      const row = sessionDb.prepare("SELECT account_id, expires_at FROM sessions WHERE token = ?").get(token);
      if (row) {
        session = { accountId: Number(row.account_id), expiresAt: Number(row.expires_at) };
        memorySessions.set(token, session);
      }
    } catch (err) {
      console.error("[Session DB Read Error]", err.message || err);
    }
  }

  if (!session || session.expiresAt < now) {
    memorySessions.delete(token);
    if (sessionDb) {
      try {
        sessionDb.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      } catch {
        // ignore
      }
    }
    return null;
  }

  // Sliding refresh when less than 6 days remain
  if (session.expiresAt - now < sessionMaxAge - 1000 * 60 * 60 * 24) {
    const nextExpiry = now + sessionMaxAge;
    session.expiresAt = nextExpiry;
    memorySessions.set(token, session);
    if (sessionDb) {
      try {
        sessionDb.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?").run(nextExpiry, token);
      } catch {
        // ignore
      }
    }
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
