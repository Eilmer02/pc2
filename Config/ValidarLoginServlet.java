package Config;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/ValidarLoginServlet")
public class ValidarLoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String jsonResponse = ""; // Declarar aquí, inicializar después

        try {
            String action = request.getParameter("action");
            System.out.println("👉 Parámetro action recibido: [" + action + "]");

            if (action != null && action.trim().equalsIgnoreCase("login")) {

                String correo = request.getParameter("correo");
                String contrasena = request.getParameter("contrasena");
                String ipOrigen = getClientIpAddress(request);
                String userAgent = request.getHeader("User-Agent");

                System.out.println("🔍 Intento de login con: " + correo);

                Map<String, Object> loginResult = validarUsuario(correo, contrasena, ipOrigen, userAgent);

                if (loginResult == null || loginResult.get("exito") == null) {
                    jsonResponse = createJsonResponse(false, "Respuesta inválida desde el procedimiento.", null, null);
                } else if ((Boolean) loginResult.get("exito")) {
                    HttpSession session = request.getSession(true);
                    int usuarioId = (Integer) loginResult.get("usuarioId");

                    Map<String, Object> sesionResult = crearSesion(usuarioId, ipOrigen, userAgent);

                    if (sesionResult != null) {
                        session.setAttribute("usuarioId", usuarioId);
                        session.setAttribute("sesionId", sesionResult.get("sesionId"));
                        session.setAttribute("correo", correo);
                        session.setAttribute("nombreCompleto", loginResult.get("nombreCompleto"));
                        session.setAttribute("cargo", loginResult.get("cargo"));

                        Map<String, String> datosUsuario = obtenerDatosUsuario(usuarioId);
                        session.setAttribute("roles", datosUsuario.get("roles"));
                        session.setAttribute("dependencias", datosUsuario.get("dependencias"));

                        // ✅ NUEVA FUNCIONALIDAD: Verificar si necesita completar primer login setup
                        Map<String, Object> estadoSetup = verificarEstadoPrimerLogin(usuarioId);
                        
                        if ((Boolean) estadoSetup.get("necesitaSetup")) {
                            // Usuario necesita completar primer login setup
                            jsonResponse = createJsonResponse(true, "Login exitoso. Redirigiendo al setup inicial...", 
                                                            "primer-login-setup.jsp", estadoSetup.get("motivoSetup"));
                        } else {
                            // Usuario puede ir directamente al sistema
                            jsonResponse = createJsonResponse(true, "¡Bienvenido al Sistema de Gestión Documental!", 
                                                            "index.jsp", null);
                        }
                    } else {
                        jsonResponse = createJsonResponse(false, "Error al crear la sesión en la base de datos.", null, null);
                    }
                } else {
                    jsonResponse = createJsonResponse(false, (String) loginResult.get("mensaje"), null, null);
                }

            } else {
                System.out.println("❌ Acción no reconocida o nula");
                jsonResponse = createJsonResponse(false, "Acción no reconocida.", null, null);
            }

        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse = createJsonResponse(false, "Error interno del servidor: " + e.getMessage(), null, null);
        }

        // 🔐 Imprimir la respuesta JSON SOLO UNA VEZ
        try (PrintWriter out = response.getWriter()) {
            System.out.println("✅ JSON enviado: " + jsonResponse);
            out.print(jsonResponse);
        }
    }

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * ✅ NUEVO MÉTODO: Crear respuesta JSON con soporte para redirección
     */
    private String createJsonResponse(boolean success, String message, String redirectUrl, Object additionalData) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"success\": ").append(success).append(",");
        json.append("\"message\": \"").append(escapeJsonString(message)).append("\"");
        
        if (redirectUrl != null) {
            json.append(",\"redirect\": \"").append(escapeJsonString(redirectUrl)).append("\"");
        }
        
        if (additionalData != null) {
            json.append(",\"setupInfo\": \"").append(escapeJsonString(additionalData.toString())).append("\"");
        }
        
        json.append("}");
        return json.toString();
    }

    /**
     * ✅ NUEVO MÉTODO: Verificar si el usuario necesita completar el primer login setup
     */
    private Map<String, Object> verificarEstadoPrimerLogin(int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("necesitaSetup", false);
        resultado.put("motivoSetup", "");

        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT 
                    primer_login_completado,
                    requiere_cambio_password,
                    (SELECT COUNT(*) FROM perfiles_usuarios WHERE usuario_id = ?) as perfil_completo,
                    (SELECT COUNT(*) FROM certificados_digitales WHERE usuario_id = ? AND activo = 1) as tiene_certificados
                FROM usuarios 
                WHERE id_usuarios = ?
            """;
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, usuarioId);
            stmt.setInt(2, usuarioId);
            stmt.setInt(3, usuarioId);
            
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                boolean primerLoginCompletado = rs.getBoolean("primer_login_completado");
                boolean requiereCambioPassword = rs.getBoolean("requiere_cambio_password");
                int perfilCompleto = rs.getInt("perfil_completo");
                int tieneCertificados = rs.getInt("tiene_certificados");
                
                // Determinar si necesita setup
                if (requiereCambioPassword) {
                    resultado.put("necesitaSetup", true);
                    resultado.put("motivoSetup", "Debe cambiar su contraseña inicial");
                } else if (perfilCompleto == 0) {
                    resultado.put("necesitaSetup", true);
                    resultado.put("motivoSetup", "Debe completar su información personal");
                } else if (tieneCertificados == 0) {
                    resultado.put("necesitaSetup", true);
                    resultado.put("motivoSetup", "Debe configurar su certificado digital");
                } else if (!primerLoginCompletado) {
                    resultado.put("necesitaSetup", true);
                    resultado.put("motivoSetup", "Debe completar la configuración inicial");
                }
                
                System.out.println("🔍 Estado primer login - Usuario: " + usuarioId + 
                                 ", Necesita setup: " + resultado.get("necesitaSetup") +
                                 ", Motivo: " + resultado.get("motivoSetup"));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("❌ Error al verificar estado primer login: " + e.getMessage());
        }
        
        return resultado;
    }

    private String escapeJsonString(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\r", "\\r")
                   .replace("\n", "\\n")
                   .replace("\t", "\\t");
    }

    private Map<String, Object> validarUsuario(String correo, String contrasena, String ipOrigen, String userAgent) {
        Map<String, Object> result = new HashMap<>();
        try (Connection conn = Conexion.getConnection()) {
            System.out.println("✅ Conexión obtenida para validarUsuario");
            CallableStatement stmt = conn.prepareCall("{CALL PA_ValidarUsuario(?, ?, ?, ?, ?, ?, ?, ?, ?)}");

            stmt.setString(1, correo);
            stmt.setString(2, contrasena); // Se hashea en el procedimiento almacenado
            stmt.setString(3, ipOrigen);
            stmt.setString(4, userAgent);

            stmt.registerOutParameter(5, Types.INTEGER); // p_usuario_id
            stmt.registerOutParameter(6, Types.BOOLEAN); // p_exito
            stmt.registerOutParameter(7, Types.VARCHAR); // p_mensaje
            stmt.registerOutParameter(8, Types.VARCHAR); // p_nombre_completo
            stmt.registerOutParameter(9, Types.VARCHAR); // p_cargo

            stmt.execute();

            result.put("usuarioId", stmt.getInt(5));
            result.put("exito", stmt.getBoolean(6));
            result.put("mensaje", stmt.getString(7));
            result.put("nombreCompleto", stmt.getString(8));
            result.put("cargo", stmt.getString(9));

        } catch (Exception e) {
            e.printStackTrace();
            result.put("exito", false);
            result.put("mensaje", "Error al validar credenciales.");
        }
        return result;
    }

    private Map<String, Object> crearSesion(int usuarioId, String ipOrigen, String userAgent) {
        Map<String, Object> result = new HashMap<>();
        try (Connection conn = Conexion.getConnection()) {
            CallableStatement stmt = conn.prepareCall("{CALL PA_CrearSesion(?, ?, ?, ?, ?)}");

            stmt.setInt(1, usuarioId);
            stmt.setString(2, ipOrigen);
            stmt.setString(3, userAgent);

            stmt.registerOutParameter(4, Types.INTEGER); // p_sesion_id
            stmt.registerOutParameter(5, Types.TIMESTAMP); // p_fecha_expiracion

            stmt.execute();

            result.put("sesionId", stmt.getInt(4));
            result.put("fechaExpiracion", stmt.getTimestamp(5));

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
        return result;
    }

    private Map<String, String> obtenerDatosUsuario(int usuarioId) {
        Map<String, String> result = new HashMap<>();
        try (Connection conn = Conexion.getConnection()) {
            CallableStatement stmt = conn.prepareCall("{CALL PA_ObtenerDatosUsuario(?, ?, ?, ?, ?, ?)}");

            stmt.setInt(1, usuarioId);
            stmt.registerOutParameter(2, Types.VARCHAR); // p_correo
            stmt.registerOutParameter(3, Types.VARCHAR); // p_nombre_completo
            stmt.registerOutParameter(4, Types.VARCHAR); // p_cargo
            stmt.registerOutParameter(5, Types.VARCHAR); // p_roles
            stmt.registerOutParameter(6, Types.VARCHAR); // p_dependencias

            stmt.execute();

            result.put("correo", stmt.getString(2));
            result.put("nombreCompleto", stmt.getString(3));
            result.put("cargo", stmt.getString(4));
            result.put("roles", stmt.getString(5));
            result.put("dependencias", stmt.getString(6));

        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        return (xForwardedForHeader != null) ? xForwardedForHeader.split(",")[0] : request.getRemoteAddr();
    }
}