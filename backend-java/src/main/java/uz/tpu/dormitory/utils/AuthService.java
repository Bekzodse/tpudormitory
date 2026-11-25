package uz.tpu.dormitory.utils;

import com.sun.net.httpserver.HttpExchange;
import uz.tpu.dormitory.models.DormModels.Account;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {

    public static final long SESSION_MAX_AGE_MS = 1000L * 60 * 60 * 8;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final HexFormat HEX = HexFormat.of();
    private static final Map<String, SessionEntry> SESSIONS = new ConcurrentHashMap<>();
    private static final byte[] SECRET_KEY;

    static {
        try {
            String rawKey = System.getenv().getOrDefault("AUTH_ENCRYPTION_KEY", "development-only-change-me");
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            SECRET_KEY = sha256.digest(rawKey.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize encryption key", e);
        }
    }

    public record SessionEntry(long accountId, long expiresAt) {}

    public static String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            RANDOM.nextBytes(salt);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 512);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = skf.generateSecret(spec).getEncoded();
            return HEX.formatHex(salt) + ":" + HEX.formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Password hashing failed", e);
        }
    }

    public static boolean verifyPassword(String password, String stored, String decryptedFallback) {
        if (decryptedFallback != null && decryptedFallback.equals(password)) {
            return true;
        }
        if (stored == null || !stored.contains(":")) return false;
        try {
            String[] parts = stored.split(":");
            byte[] salt = HEX.parseHex(parts[0]);
            byte[] expected = HEX.parseHex(parts[1]);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 512);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] actual = skf.generateSecret(spec).getEncoded();
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception e) {
            return false;
        }
    }

    public static String encryptSecret(String text) {
        try {
            byte[] iv = new byte[12];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec keySpec = new SecretKeySpec(SECRET_KEY, "AES");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(128, iv));
            byte[] cipherWithTag = cipher.doFinal(text.getBytes(StandardCharsets.UTF_8));
            int tagPos = cipherWithTag.length - 16;
            byte[] encrypted = new byte[tagPos];
            byte[] tag = new byte[16];
            System.arraycopy(cipherWithTag, 0, encrypted, 0, tagPos);
            System.arraycopy(cipherWithTag, tagPos, tag, 0, 16);
            return HEX.formatHex(iv) + ":" + HEX.formatHex(tag) + ":" + HEX.formatHex(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public static String decryptSecret(String payload) {
        if (payload == null || !payload.contains(":")) return null;
        try {
            String[] parts = payload.split(":");
            if (parts.length != 3) return null;
            byte[] iv = HEX.parseHex(parts[0]);
            byte[] tag = HEX.parseHex(parts[1]);
            byte[] data = HEX.parseHex(parts[2]);
            byte[] combined = new byte[data.length + tag.length];
            System.arraycopy(data, 0, combined, 0, data.length);
            System.arraycopy(tag, 0, combined, data.length, tag.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec keySpec = new SecretKeySpec(SECRET_KEY, "AES");
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(combined), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    public static String createSession(HttpExchange exchange, long accountId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        SESSIONS.put(token, new SessionEntry(accountId, System.currentTimeMillis() + SESSION_MAX_AGE_MS));
        String cookie = String.format("student_session=%s; HttpOnly; SameSite=Lax; Path=/; Max-Age=%d",
                token, SESSION_MAX_AGE_MS / 1000);
        exchange.getResponseHeaders().add("Set-Cookie", cookie);
        return token;
    }

    public static void clearSession(HttpExchange exchange) {
        String token = extractCookie(exchange, "student_session");
        if (token != null) SESSIONS.remove(token);
        exchange.getResponseHeaders().add("Set-Cookie",
                "student_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    }

    public static SessionEntry getSession(HttpExchange exchange) {
        String token = extractCookie(exchange, "student_session");
        if (token == null) return null;
        SessionEntry entry = SESSIONS.get(token);
        if (entry == null || entry.expiresAt() < System.currentTimeMillis()) {
            SESSIONS.remove(token);
            return null;
        }
        return entry;
    }

    private static String extractCookie(HttpExchange exchange, String cookieName) {
        String header = exchange.getRequestHeaders().getFirst("Cookie");
        if (header == null) return null;
        for (String part : header.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(cookieName + "=")) {
                return trimmed.substring((cookieName + "=").length());
            }
        }
        return null;
    }

    public static String saveUploadedImage(File projectRoot, String imageInput, String prefix) {
        if (imageInput == null || imageInput.isBlank()) return null;
        String trimmed = imageInput.trim();
        if (!trimmed.startsWith("data:image/")) {
            return trimmed;
        }
        try {
            int commaIdx = trimmed.indexOf(',');
            if (commaIdx < 0) return null;
            String header = trimmed.substring(0, commaIdx);
            String base64Data = trimmed.substring(commaIdx + 1);
            String ext = "jpg";
            if (header.contains("image/png")) ext = "png";
            else if (header.contains("image/webp")) ext = "webp";
            else if (header.contains("image/svg")) ext = "svg";

            byte[] buffer = Base64.getDecoder().decode(base64Data);
            String fileName = prefix + "-" + System.currentTimeMillis() + "." + ext;

            File pubUploads = new File(projectRoot, "public/images/uploads");
            pubUploads.mkdirs();
            try (FileOutputStream fos = new FileOutputStream(new File(pubUploads, fileName))) {
                fos.write(buffer);
            }

            File distDir = new File(projectRoot, "dist");
            if (distDir.exists()) {
                File distUploads = new File(distDir, "images/uploads");
                distUploads.mkdirs();
                try (FileOutputStream fos = new FileOutputStream(new File(distUploads, fileName))) {
                    fos.write(buffer);
                }
            }
            return "/images/uploads/" + fileName;
        } catch (Exception e) {
            return null;
        }
    }

    public static String publicStudentJson(Account acc) {
        return "{"
                + "\"id\":" + acc.id + ","
                + "\"firstName\":" + JsonHelper.quote(acc.firstName) + ","
                + "\"lastName\":" + JsonHelper.quote(acc.lastName) + ","
                + "\"age\":" + (acc.age != null ? acc.age : "null") + ","
                + "\"course\":" + JsonHelper.quote(acc.course != null ? acc.course : "") + ","
                + "\"phone\":" + JsonHelper.quote(acc.phone != null ? acc.phone : "") + ","
                + "\"login\":" + JsonHelper.quote(acc.login) + ","
                + "\"role\":" + JsonHelper.quote(acc.role != null ? acc.role : "student") + ","
                + "\"avatar\":" + (acc.avatar != null ? JsonHelper.quote(acc.avatar) : "null")
                + "}";
    }
}
