package uz.tpu.dormitory.routes;

import com.sun.net.httpserver.HttpExchange;
import uz.tpu.dormitory.db.DormitoryDatabase;
import uz.tpu.dormitory.models.DormModels.Account;
import uz.tpu.dormitory.utils.AuthService;
import uz.tpu.dormitory.utils.AuthService.SessionEntry;
import uz.tpu.dormitory.utils.JsonHelper;

import java.io.IOException;

public class AuthRoutes {

    private final DormitoryDatabase db;

    public AuthRoutes(DormitoryDatabase db) {
        this.db = db;
    }

    public void handle(HttpExchange exchange, String path, String method) throws IOException {
        if ("/api/auth/register".equals(path) && "POST".equals(method)) {
            handleRegister(exchange);
        } else if ("/api/auth/login".equals(path) && "POST".equals(method)) {
            handleLogin(exchange);
        } else if ("/api/auth/me".equals(path) && "GET".equals(method)) {
            handleMe(exchange);
        } else if ("/api/auth/profile".equals(path) && "PUT".equals(method)) {
            handleProfileUpdate(exchange);
        } else if ("/api/auth/logout".equals(path) && "POST".equals(method)) {
            AuthService.clearSession(exchange);
            exchange.sendResponseHeaders(204, -1);
        } else {
            JsonHelper.sendError(exchange, 404, "Auth endpoint topilmadi.");
        }
    }

    private void handleRegister(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String firstName = JsonHelper.getString(body, "firstName", "").trim();
        String lastName = JsonHelper.getString(body, "lastName", "").trim();
        String course = JsonHelper.getString(body, "course", "1-kurs").trim();
        String phone = JsonHelper.getString(body, "phone", "").trim();
        String login = JsonHelper.getString(body, "login", "").trim();
        String password = JsonHelper.getString(body, "password", "");
        Integer age = JsonHelper.getInt(body, "age", 20);
        String avatar = JsonHelper.getString(body, "avatar", null);

        if (firstName.isEmpty() || lastName.isEmpty() || login.length() < 4 || password.length() < 6) {
            JsonHelper.sendError(exchange, 400, "Ism, familiya, login (kamida 4 belgi) va parol (kamida 6 belgi) kiriting.");
            return;
        }
        for (Account acc : db.accounts) {
            if (acc.login.equalsIgnoreCase(login)) {
                JsonHelper.sendError(exchange, 409, "Bu login allaqachon band.");
                return;
            }
        }

        Account created = new Account(
                db.accountSeq.incrementAndGet(),
                firstName, lastName, age, course, phone, avatar, "student", login,
                AuthService.hashPassword(password),
                AuthService.encryptSecret(password),
                DormitoryDatabase.nowIso()
        );
        db.accounts.add(created);
        AuthService.createSession(exchange, created.id);
        JsonHelper.sendJson(exchange, 201, "{\"student\":" + AuthService.publicStudentJson(created) + "}");
    }

    private void handleLogin(HttpExchange exchange) throws IOException {
        String body = JsonHelper.readBody(exchange);
        String login = JsonHelper.getString(body, "login", "").trim();
        String password = JsonHelper.getString(body, "password", "");

        for (Account acc : db.accounts) {
            String plain = AuthService.decryptSecret(acc.passwordCiphertext);
            if (acc.login.equalsIgnoreCase(login) && AuthService.verifyPassword(password, acc.passwordHash, plain)) {
                AuthService.createSession(exchange, acc.id);
                JsonHelper.sendJson(exchange, 200, "{\"student\":" + AuthService.publicStudentJson(acc) + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 401, "Login yoki parol noto‘g‘ri.");
    }

    private void handleMe(HttpExchange exchange) throws IOException {
        SessionEntry sess = AuthService.getSession(exchange);
        if (sess == null) {
            JsonHelper.sendError(exchange, 401, "Sessiya topilmadi.");
            return;
        }
        for (Account acc : db.accounts) {
            if (acc.id == sess.accountId()) {
                JsonHelper.sendJson(exchange, 200, "{\"student\":" + AuthService.publicStudentJson(acc) + "}");
                return;
            }
        }
        JsonHelper.sendError(exchange, 401, "Akkaunt topilmadi.");
    }

    private void handleProfileUpdate(HttpExchange exchange) throws IOException {
        SessionEntry sess = AuthService.getSession(exchange);
        if (sess == null) {
            JsonHelper.sendError(exchange, 401, "Avval tizimga kiring.");
            return;
        }
        Account target = null;
        for (Account acc : db.accounts) {
            if (acc.id == sess.accountId()) {
                target = acc;
                break;
            }
        }
        if (target == null) {
            JsonHelper.sendError(exchange, 401, "Profil topilmadi.");
            return;
        }
        String body = JsonHelper.readBody(exchange);
        target.firstName = JsonHelper.getString(body, "firstName", target.firstName).trim();
        target.lastName = JsonHelper.getString(body, "lastName", target.lastName).trim();
        target.course = JsonHelper.getString(body, "course", target.course).trim();
        target.phone = JsonHelper.getString(body, "phone", target.phone).trim();
        target.age = JsonHelper.getInt(body, "age", target.age);
        String nextAvatar = JsonHelper.getString(body, "avatar", target.avatar);
        target.avatar = nextAvatar;

        JsonHelper.sendJson(exchange, 200, "{\"student\":" + AuthService.publicStudentJson(target) + "}");
    }
}
