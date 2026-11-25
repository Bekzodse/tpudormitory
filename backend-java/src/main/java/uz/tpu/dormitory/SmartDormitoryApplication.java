package uz.tpu.dormitory;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import uz.tpu.dormitory.db.DormitoryDatabase;
import uz.tpu.dormitory.routes.AdminRoutes;
import uz.tpu.dormitory.routes.AuthRoutes;
import uz.tpu.dormitory.routes.PublicRoutes;
import uz.tpu.dormitory.utils.JsonHelper;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.util.concurrent.Executors;

public class SmartDormitoryApplication {

    public static void main(String[] args) throws IOException {
        File projectRoot = new File(System.getProperty("user.dir"));
        if (projectRoot.getName().equals("backend") || projectRoot.getName().equals("backend-java")) {
            projectRoot = projectRoot.getParentFile();
        }

        DormitoryDatabase db = new DormitoryDatabase(projectRoot);
        AuthRoutes authRoutes = new AuthRoutes(db);
        PublicRoutes publicRoutes = new PublicRoutes(db);
        AdminRoutes adminRoutes = new AdminRoutes(db);

        int port = Integer.parseInt(System.getenv().getOrDefault("JAVA_PORT", "4173"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        File finalRoot = projectRoot;

        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();

            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Cookie");
            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                if (path.startsWith("/api/auth/")) {
                    authRoutes.handle(exchange, path, method);
                } else if (path.startsWith("/api/admin/")) {
                    adminRoutes.handle(exchange, path, method);
                } else if (path.startsWith("/api/")) {
                    publicRoutes.handle(exchange, path, method);
                } else {
                    serveStaticFile(exchange, finalRoot, path);
                }
            } catch (Exception e) {
                JsonHelper.sendError(exchange, 500, "Server xatosi: " + e.getMessage());
            }
        });

        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.start();
        System.out.println("TPU Smart Dormitory Java 21 Backend listening on http://localhost:" + port);
    }

    private static void serveStaticFile(HttpExchange exchange, File root, String reqPath) throws IOException {
        String cleanPath = "/".equals(reqPath) ? "/index.html" : reqPath;
        File candidate = new File(new File(root, "public"), cleanPath);
        if (!candidate.exists() || candidate.isDirectory()) {
            candidate = new File(new File(root, "dist"), cleanPath);
        }
        if (!candidate.exists() || candidate.isDirectory()) {
            candidate = new File(new File(root, "dist"), "index.html");
        }
        if (!candidate.exists()) {
            exchange.sendResponseHeaders(404, -1);
            return;
        }
        String mime = Files.probeContentType(candidate.toPath());
        if (mime == null) {
            if (candidate.getName().endsWith(".js")) mime = "application/javascript";
            else if (candidate.getName().endsWith(".css")) mime = "text/css";
            else if (candidate.getName().endsWith(".svg")) mime = "image/svg+xml";
            else mime = "application/octet-stream";
        }
        byte[] bytes = Files.readAllBytes(candidate.toPath());
        exchange.getResponseHeaders().set("Content-Type", mime);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
