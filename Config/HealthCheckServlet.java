package Config;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.*;
import java.sql.*;

import org.json.JSONObject;

@WebServlet("/HealthCheckServlet")
public class HealthCheckServlet extends HttpServlet {
    
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        JSONObject resultado = new JSONObject();
        boolean sistemaOk = true;
        
        try {
            // 1. Verificar conexión a base de datos
            JSONObject dbStatus = verificarBaseDatos();
            resultado.put("database", dbStatus);
            
            if (!dbStatus.getBoolean("connected")) {
                sistemaOk = false;
            }
            
            // 2. Verificar memoria del sistema
            JSONObject memoryStatus = verificarMemoria();
            resultado.put("memory", memoryStatus);
            
            // 3. Verificar sesión
            JSONObject sessionStatus = verificarSesion(request);
            resultado.put("session", sessionStatus);
            
            // 4. Timestamp del diagnóstico
            resultado.put("timestamp", System.currentTimeMillis());
            resultado.put("datetime", new java.util.Date().toString());
            
            // 5. Estado general
            resultado.put("status", sistemaOk ? "OK" : "ERROR");
            resultado.put("success", sistemaOk);
            
            // 6. Información del servidor
            JSONObject serverInfo = new JSONObject();
            serverInfo.put("serverInfo", getServletContext().getServerInfo());
            serverInfo.put("javaVersion", System.getProperty("java.version"));
            serverInfo.put("osName", System.getProperty("os.name"));
            resultado.put("server", serverInfo);
            
        } catch (Exception e) {
            resultado.put("status", "ERROR");
            resultado.put("success", false);
            resultado.put("error", e.getMessage());
            sistemaOk = false;
        }
        
        // Establecer código de respuesta HTTP
        response.setStatus(sistemaOk ? 200 : 503);
        
        PrintWriter out = response.getWriter();
        out.print(resultado.toString());
        out.flush();
    }
    
    private JSONObject verificarBaseDatos() {
        JSONObject dbStatus = new JSONObject();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Intentar obtener conexión
            conn = Conexion.getConnection();
            dbStatus.put("connected", true);
            
            // Verificar que la conexión esté activa
            boolean isValid = conn.isValid(5);
            dbStatus.put("valid", isValid);
            
            // Ejecutar query de prueba
            pstmt = conn.prepareStatement("SELECT COUNT(*) as total FROM usuarios WHERE activo = 1");
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                dbStatus.put("usuariosActivos", rs.getInt("total"));
            }
            
            // Verificar tabla crítica
            pstmt = conn.prepareStatement("SELECT COUNT(*) as total FROM documentos");
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                dbStatus.put("totalDocumentos", rs.getInt("total"));
            }
            
            long endTime = System.currentTimeMillis();
            dbStatus.put("responseTime", endTime - startTime);
            dbStatus.put("status", "OK");
            
        } catch (SQLException e) {
            dbStatus.put("connected", false);
            dbStatus.put("valid", false);
            dbStatus.put("error", e.getMessage());
            dbStatus.put("sqlState", e.getSQLState());
            dbStatus.put("errorCode", e.getErrorCode());
            dbStatus.put("status", "ERROR");
            
            // Log detallado del error
            System.err.println("=== ERROR DE BASE DE DATOS ===");
            System.err.println("Mensaje: " + e.getMessage());
            System.err.println("SQL State: " + e.getSQLState());
            System.err.println("Error Code: " + e.getErrorCode());
            e.printStackTrace();
            
        } finally {
            try {
                if (rs != null) rs.close();
                if (pstmt != null) pstmt.close();
                if (conn != null && !conn.isClosed()) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        
        return dbStatus;
    }
    
    private JSONObject verificarMemoria() {
        JSONObject memoryStatus = new JSONObject();
        
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        memoryStatus.put("maxMemoryMB", maxMemory / (1024 * 1024));
        memoryStatus.put("totalMemoryMB", totalMemory / (1024 * 1024));
        memoryStatus.put("usedMemoryMB", usedMemory / (1024 * 1024));
        memoryStatus.put("freeMemoryMB", freeMemory / (1024 * 1024));
        memoryStatus.put("usagePercentage", (usedMemory * 100) / maxMemory);
        
        boolean memoryOk = (usedMemory * 100 / maxMemory) < 85; // < 85% uso
        memoryStatus.put("status", memoryOk ? "OK" : "WARNING");
        
        return memoryStatus;
    }
    
    private JSONObject verificarSesion(HttpServletRequest request) {
        JSONObject sessionStatus = new JSONObject();
        
        try {
            HttpSession session = request.getSession(false);
            
            if (session != null) {
                sessionStatus.put("exists", true);
                sessionStatus.put("id", session.getId());
                sessionStatus.put("creationTime", session.getCreationTime());
                sessionStatus.put("lastAccessedTime", session.getLastAccessedTime());
                sessionStatus.put("maxInactiveInterval", session.getMaxInactiveInterval());
                
                // Verificar si hay usuario logueado
                Object usuario = session.getAttribute("usuario");
                sessionStatus.put("userLoggedIn", usuario != null);
                
                if (usuario != null) {
                    sessionStatus.put("userInfo", usuario.toString());
                }
                
                sessionStatus.put("status", "OK");
            } else {
                sessionStatus.put("exists", false);
                sessionStatus.put("status", "NO_SESSION");
            }
            
        } catch (Exception e) {
            sessionStatus.put("exists", false);
            sessionStatus.put("error", e.getMessage());
            sessionStatus.put("status", "ERROR");
        }
        
        return sessionStatus;
    }
}

