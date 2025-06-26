package Config;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Pattern;

import com.google.gson.Gson;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Servlet para manejar el primer login del usuario y configuración inicial
 * de certificados digitales según los requerimientos del sistema
 */
@WebServlet("/PrimerLoginSetupServlet")
public class PrimerLoginSetupServlet extends HttpServlet {

    private static final String CONTENT_TYPE_JSON = "application/json";
    private static final String CHARSET_UTF8 = "UTF-8";
    private final Gson gson = new Gson();
    private final CertificadoDigitalManager certManager = new CertificadoDigitalManager();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        handleRequest(req, res);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        handleRequest(req, res);
    }

    private void handleRequest(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType(CONTENT_TYPE_JSON);
        res.setCharacterEncoding(CHARSET_UTF8);

        String action = Optional.ofNullable(req.getParameter("action")).orElse("");
        Map<String, Object> resultado;

        try {
            switch (action) {
                case "verificarEstadoUsuario" -> resultado = verificarEstadoUsuario(req);
                case "cambiarPasswordInicial" -> resultado = cambiarPasswordInicial(req);
                case "completarPerfilUsuario" -> resultado = completarPerfilUsuario(req);
                case "obtenerCargosDisponibles" -> resultado = obtenerCargosDisponibles();
                case "obtenerDepartamentos" -> resultado = obtenerDepartamentos();
                case "validarDNI" -> resultado = validarDNI(req);
                case "completarSetupCertificado" -> resultado = completarSetupCertificado(req);
                case "omitirSetupCertificado" -> resultado = omitirSetupCertificado(req);
                case "validarPasswordPolicy" -> resultado = validarPasswordPolicy(req);
                case "generarPasswordSugerido" -> resultado = generarPasswordSugerido();
                case "verificarDisponibilidadEmail" -> resultado = verificarDisponibilidadEmail(req);
                default -> {
                    resultado = new HashMap<>();
                    resultado.put("success", false);
                    resultado.put("message", "Acción no válida");
                }
            }
        } catch (Exception e) {
            resultado = new HashMap<>();
            resultado.put("success", false);
            resultado.put("message", "Error interno del servidor: " + e.getMessage());
            e.printStackTrace();
        }

        try (PrintWriter out = res.getWriter()) {
            out.print(gson.toJson(resultado));
            out.flush();
        }
    }

    /**
     * Verifica el estado del usuario para determinar qué pasos debe completar
     */
    private Map<String, Object> verificarEstadoUsuario(HttpServletRequest req) {
        Map<String, Object> resultado = new HashMap<>();
        
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            resultado.put("success", false);
            resultado.put("message", "Sesión no válida");
            return resultado;
        }
        
        int usuarioId = (Integer) session.getAttribute("usuarioId");
        
        String sql = """
            SELECT u.primer_login_completado, u.requiere_cambio_password, 
                   u.fecha_ultimo_cambio_password, u.certificado_activo_id,
                   u.correo, pu.nombres, pu.apellidos, pu.perfil_completo,
                   pu.dni, pu.telefono, pu.cargo, pu.departamento,
                   COUNT(cd.id_certificado) as total_certificados
            FROM usuarios u
            LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.id_perfiles_usuarios
            LEFT JOIN certificados_digitales cd ON u.id_usuarios = cd.usuario_id AND cd.estado = 'activo'
            WHERE u.id_usuarios = ?
            GROUP BY u.id_usuarios
        """;
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    boolean primerLoginCompletado = rs.getBoolean("primer_login_completado");
                    boolean requiereCambioPassword = rs.getBoolean("requiere_cambio_password");
                    boolean perfilCompleto = rs.getBoolean("perfil_completo");
                    int totalCertificados = rs.getInt("total_certificados");
                    int certificadoActivoId = rs.getInt("certificado_activo_id");
                    
                    resultado.put("success", true);
                    resultado.put("usuarioId", usuarioId);
                    resultado.put("correo", rs.getString("correo"));
                    resultado.put("nombres", rs.getString("nombres"));
                    resultado.put("apellidos", rs.getString("apellidos"));
                    resultado.put("primerLoginCompletado", primerLoginCompletado);
                    resultado.put("requiereCambioPassword", requiereCambioPassword);
                    resultado.put("perfilCompleto", perfilCompleto);
                    resultado.put("totalCertificados", totalCertificados);
                    resultado.put("tieneCertificadoActivo", certificadoActivoId > 0);
                    
                    // Información adicional del perfil si existe
                    if (rs.getString("nombres") != null) {
                        Map<String, Object> perfilInfo = new HashMap<>();
                        perfilInfo.put("dni", rs.getString("dni"));
                        perfilInfo.put("telefono", rs.getString("telefono"));
                        perfilInfo.put("cargo", rs.getString("cargo"));
                        perfilInfo.put("departamento", rs.getString("departamento"));
                        resultado.put("perfilInfo", perfilInfo);
                    }
                    
                    // Determinar próximos pasos
                    Map<String, Object> proximosPasos = new HashMap<>();
                    
                    if (requiereCambioPassword) {
                        proximosPasos.put("cambiarPassword", true);
                        proximosPasos.put("prioridad", 1);
                        proximosPasos.put("descripcion", "Debe cambiar su contraseña inicial");
                    } else if (!perfilCompleto) {
                        proximosPasos.put("completarPerfil", true);
                        proximosPasos.put("prioridad", 2);
                        proximosPasos.put("descripcion", "Debe completar su información personal");
                    } else if (totalCertificados == 0) {
                        proximosPasos.put("configurarCertificado", true);
                        proximosPasos.put("prioridad", 3);
                        proximosPasos.put("descripcion", "Debe configurar su certificado digital para poder firmar documentos");
                    } else if (!primerLoginCompletado) {
                        proximosPasos.put("completarSetup", true);
                        proximosPasos.put("prioridad", 4);
                        proximosPasos.put("descripcion", "Completar configuración inicial");
                    } else {
                        proximosPasos.put("setupCompleto", true);
                        proximosPasos.put("prioridad", 0);
                        proximosPasos.put("descripcion", "Configuración completa");
                    }
                    
                    resultado.put("proximosPasos", proximosPasos);
                    
                } else {
                    resultado.put("success", false);
                    resultado.put("message", "Usuario no encontrado");
                }
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al verificar estado del usuario: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Cambia la contraseña inicial del usuario
     */
    private Map<String, Object> cambiarPasswordInicial(HttpServletRequest req) {
        Map<String, Object> resultado = new HashMap<>();
        
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            resultado.put("success", false);
            resultado.put("message", "Sesión no válida");
            return resultado;
        }
        
        int usuarioId = (Integer) session.getAttribute("usuarioId");
        String passwordActual = req.getParameter("passwordActual");
        String passwordNuevo = req.getParameter("passwordNuevo");
        String confirmarPassword = req.getParameter("confirmarPassword");
        
        // Validaciones
        if (passwordActual == null || passwordActual.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "Contraseña actual requerida");
            return resultado;
        }
        
        if (passwordNuevo == null || passwordNuevo.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "Nueva contraseña requerida");
            return resultado;
        }
        
        if (!passwordNuevo.equals(confirmarPassword)) {
            resultado.put("success", false);
            resultado.put("message", "Las contraseñas no coinciden");
            return resultado;
        }
        
        // Validar política de contraseñas
        Map<String, Object> validacionPassword = validarPoliticaPassword(passwordNuevo);
        if (!(Boolean) validacionPassword.get("valida")) {
            resultado.put("success", false);
            resultado.put("message", validacionPassword.get("mensaje"));
            return resultado;
        }
        
        try (Connection conn = Conexion.getConnection()) {
            // Verificar contraseña actual
            if (!verificarPasswordActual(usuarioId, passwordActual, conn)) {
                resultado.put("success", false);
                resultado.put("message", "Contraseña actual incorrecta");
                return resultado;
            }
            
            // Actualizar contraseña
            String hashNuevo = calcularHashSHA256(passwordNuevo);
            String sql = """
                UPDATE usuarios 
                SET contrasena_hash = ?, 
                    requiere_cambio_password = 0,
                    fecha_ultimo_cambio_password = NOW()
                WHERE id_usuarios = ?
            """;
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, hashNuevo);
                stmt.setInt(2, usuarioId);
                
                int filasAfectadas = stmt.executeUpdate();
                
                if (filasAfectadas > 0) {
                    // Registrar auditoría
                    registrarCambioPassword(usuarioId, req.getRemoteAddr(), conn);
                    
                    resultado.put("success", true);
                    resultado.put("message", "Contraseña cambiada exitosamente");
                } else {
                    resultado.put("success", false);
                    resultado.put("message", "No se pudo cambiar la contraseña");
                }
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al cambiar contraseña: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Completa el setup del certificado digital
     */
    private Map<String, Object> completarSetupCertificado(HttpServletRequest req) {
        Map<String, Object> resultado = new HashMap<>();
        
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            resultado.put("success", false);
            resultado.put("message", "Sesión no válida");
            return resultado;
        }
        
        int usuarioId = (Integer) session.getAttribute("usuarioId");
        String opcionCertificado = req.getParameter("opcionCertificado"); // "generar" o "password_generado"
        String passwordCertificado = req.getParameter("passwordCertificado");
        String nombreComun = req.getParameter("nombreComun");
        String organizacion = req.getParameter("organizacion");
        String email = req.getParameter("email");
        
        // Validaciones
        if (opcionCertificado == null || (!opcionCertificado.equals("generar") && !opcionCertificado.equals("password_generado"))) {
            resultado.put("success", false);
            resultado.put("message", "Opción de certificado inválida");
            return resultado;
        }
        
        if (passwordCertificado == null || passwordCertificado.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "Contraseña del certificado requerida");
            return resultado;
        }
        
        if (passwordCertificado.length() < 8) {
            resultado.put("success", false);
            resultado.put("message", "La contraseña del certificado debe tener al menos 8 caracteres");
            return resultado;
        }
        
        // Validar que la contraseña del certificado sea diferente a la del sistema
        if (validarPasswordIgualSistema(usuarioId, passwordCertificado)) {
            resultado.put("success", false);
            resultado.put("message", "La contraseña del certificado debe ser diferente a la contraseña del sistema");
            return resultado;
        }
        
        try {
            // Obtener información del usuario
            String[] infoUsuario = obtenerInformacionUsuarioCompleta(usuarioId);
            if (infoUsuario == null) {
                resultado.put("success", false);
                resultado.put("message", "No se pudo obtener información del usuario");
                return resultado;
            }
            
            // Configurar información del certificado
            CertificadoDigitalManager.InfoCertificado infoCert = new CertificadoDigitalManager.InfoCertificado(
                nombreComun != null ? nombreComun.trim() : infoUsuario[0],
                organizacion != null ? organizacion.trim() : "Constructora Vial S.A.",
                email != null ? email.trim() : infoUsuario[1],
                1095 // 3 años
            );
            
            // Generar certificado
            String rutaBaseCertificados = obtenerRutaCertificados();
            CertificadoDigitalManager.ResultadoGeneracionCertificado resultadoGen = 
                certManager.generarCertificadoUsuario(usuarioId, passwordCertificado, infoCert, usuarioId, rutaBaseCertificados);
            
            if (resultadoGen.isExito()) {
                // Marcar primer login como completado
                marcarPrimerLoginCompletado(usuarioId);
                
                resultado.put("success", true);
                resultado.put("message", "Certificado digital configurado exitosamente");
                resultado.put("certificadoId", resultadoGen.getCertificadoId());
                
                // IMPORTANTE: Mostrar mensaje sobre la contraseña
                Map<String, Object> advertencia = new HashMap<>();
                advertencia.put("titulo", "¡IMPORTANTE!");
                advertencia.put("mensaje", "Guarde su contraseña del certificado en un lugar seguro. " +
                                         "La necesitará cada vez que firme documentos. " +
                                         "Si la pierde, deberá generar un nuevo certificado.");
                resultado.put("advertencia", advertencia);
                
            } else {
                resultado.put("success", false);
                resultado.put("message", resultadoGen.getMensaje());
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al configurar certificado: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Permite omitir temporalmente el setup del certificado
     */
    private Map<String, Object> omitirSetupCertificado(HttpServletRequest req) {
        Map<String, Object> resultado = new HashMap<>();
        
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            resultado.put("success", false);
            resultado.put("message", "Sesión no válida");
            return resultado;
        }
        
        int usuarioId = (Integer) session.getAttribute("usuarioId");
        
        try {
            // Marcar primer login como completado pero sin certificado
            marcarPrimerLoginCompletado(usuarioId);
            
            resultado.put("success", true);
            resultado.put("message", "Setup omitido. Podrá configurar su certificado más tarde desde el menú de configuración.");
            
            Map<String, Object> advertencia = new HashMap<>();
            advertencia.put("titulo", "Certificado Pendiente");
            advertencia.put("mensaje", "No podrá firmar documentos hasta que configure su certificado digital. " +
                                     "Puede hacerlo desde el menú Configuración > Certificados Digitales.");
            resultado.put("advertencia", advertencia);
            
        } catch (Exception e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al omitir setup: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Valida que una contraseña cumple con la política de seguridad
     */
    private Map<String, Object> validarPasswordPolicy(HttpServletRequest req) {
        String password = req.getParameter("password");
        return validarPoliticaPassword(password);
    }

    /**
     * Genera una contraseña segura sugerida
     */
    private Map<String, Object> generarPasswordSugerido() {
        Map<String, Object> resultado = new HashMap<>();
        
        try {
            String passwordGenerado = generarPasswordSeguro(12);
            resultado.put("success", true);
            resultado.put("password", passwordGenerado);
            resultado.put("mensaje", "Contraseña generada automáticamente. Puede modificarla si desea.");
            
        } catch (Exception e) {
            resultado.put("success", false);
            resultado.put("message", "Error al generar contraseña: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Verifica disponibilidad de email para certificado
     */
    private Map<String, Object> verificarDisponibilidadEmail(HttpServletRequest req) {
        Map<String, Object> resultado = new HashMap<>();
        
        String email = req.getParameter("email");
        if (email == null || email.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "Email requerido");
            return resultado;
        }
        
        // Validar formato de email
        if (!validarFormatoEmail(email)) {
            resultado.put("success", false);
            resultado.put("message", "Formato de email inválido");
            return resultado;
        }
        
        // Por ahora, permitir cualquier email válido
        resultado.put("success", true);
        resultado.put("disponible", true);
        resultado.put("message", "Email disponible");
        
        return resultado;
    }

    // Métodos auxiliares

    private Map<String, Object> validarPoliticaPassword(String password) {
        Map<String, Object> resultado = new HashMap<>();
        
        if (password == null || password.isEmpty()) {
            resultado.put("valida", false);
            resultado.put("mensaje", "Contraseña requerida");
            return resultado;
        }
        
        if (password.length() < 8) {
            resultado.put("valida", false);
            resultado.put("mensaje", "La contraseña debe tener al menos 8 caracteres");
            return resultado;
        }
        
        if (password.length() > 128) {
            resultado.put("valida", false);
            resultado.put("mensaje", "La contraseña no puede tener más de 128 caracteres");
            return resultado;
        }
        
        // Verificar que tenga al menos una mayúscula
        if (!Pattern.compile("[A-Z]").matcher(password).find()) {
            resultado.put("valida", false);
            resultado.put("mensaje", "La contraseña debe contener al menos una letra mayúscula");
            return resultado;
        }
        
        // Verificar que tenga al menos una minúscula
        if (!Pattern.compile("[a-z]").matcher(password).find()) {
            resultado.put("valida", false);
            resultado.put("mensaje", "La contraseña debe contener al menos una letra minúscula");
            return resultado;
        }
        
        // Verificar que tenga al menos un número
        if (!Pattern.compile("[0-9]").matcher(password).find()) {
            resultado.put("valida", false);
            resultado.put("mensaje", "La contraseña debe contener al menos un número");
            return resultado;
        }
        
        // Verificar que tenga al menos un carácter especial
        if (!Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]").matcher(password).find()) {
            resultado.put("valida", false);
            resultado.put("mensaje", "La contraseña debe contener al menos un carácter especial");
            return resultado;
        }
        
        resultado.put("valida", true);
        resultado.put("mensaje", "Contraseña válida");
        return resultado;
    }

    private boolean verificarPasswordActual(int usuarioId, String passwordActual, Connection conn) throws SQLException {
        String sql = "SELECT contrasena_hash FROM usuarios WHERE id_usuarios = ?";
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String hashActual = rs.getString("contrasena_hash");
                    String hashProporcionado = calcularHashSHA256(passwordActual);
                    return hashActual.equals(hashProporcionado);
                }
            }
        }
        
        return false;
    }

    private boolean validarPasswordIgualSistema(int usuarioId, String passwordCertificado) {
        String sql = "SELECT contrasena_hash FROM usuarios WHERE id_usuarios = ?";
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String hashSistema = rs.getString("contrasena_hash");
                    String hashCertificado = calcularHashSHA256(passwordCertificado);
                    return hashSistema.equals(hashCertificado);
                }
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return false;
    }
    private String obtenerRutaCertificados() {
    try {
        // Primero intentar obtener desde configuración del sistema
        String rutaConfigurada = obtenerRutaCertificadosDeConfiguracion();
        if (rutaConfigurada != null && !rutaConfigurada.isEmpty()) {
            File dirConfig = new File(rutaConfigurada);
            if (dirConfig.exists() || dirConfig.mkdirs()) {
                return rutaConfigurada;
            }
        }
        
        // Si no está configurado, usar ruta por defecto
        String rutaBase = getServletContext().getRealPath("/");
        File dirCertificados = new File(rutaBase, "WEB-INF/certificados");
        
        // Crear directorio si no existe
        if (!dirCertificados.exists()) {
            dirCertificados.mkdirs();
        }
        
        return dirCertificados.getAbsolutePath();
        
    } catch (Exception e) {
        e.printStackTrace();
        // Ruta de emergencia
        return System.getProperty("java.io.tmpdir") + File.separator + "sgd_certificados";
    }
}

/**
 * Obtiene la ruta de certificados desde la configuración del sistema
 */
private String obtenerRutaCertificadosDeConfiguracion() {
    String sql = "SELECT valor FROM configuracion_sistema WHERE clave = 'ruta_certificados' AND activo = 1";
    
    try (Connection conn = Conexion.getConnection();
         PreparedStatement stmt = conn.prepareStatement(sql);
         ResultSet rs = stmt.executeQuery()) {
        
        if (rs.next()) {
            return rs.getString("valor");
        }
        
    } catch (SQLException e) {
        e.printStackTrace();
    }
    
    return null;
}
    private String[] obtenerInformacionUsuarioCompleta(int usuarioId) {
        String sql = """
            SELECT COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo) as nombre_completo,
                   u.correo, pu.cargo, pu.departamento, pu.profesion
            FROM usuarios u
            LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.id_perfiles_usuarios
            WHERE u.id_usuarios = ?
        """;
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return new String[]{
                        rs.getString("nombre_completo"),  // 0: nombre completo
                        rs.getString("correo"),           // 1: email
                        rs.getString("cargo"),            // 2: cargo
                        rs.getString("departamento"),     // 3: departamento
                        rs.getString("profesion")         // 4: profesión
                    };
                }
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return null;
    }

    private void marcarPrimerLoginCompletado(int usuarioId) throws SQLException {
        String sql = "UPDATE usuarios SET primer_login_completado = 1 WHERE id_usuarios = ?";
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, usuarioId);
            stmt.executeUpdate();
        }
    }

    private void registrarCambioPassword(int usuarioId, String ip, Connection conn) throws SQLException {
        String sql = """
            INSERT INTO logs_auditoria (usuario_id, accion, tabla_afectada, registro_id, ip_origen, fecha_accion)
            VALUES (?, 'CAMBIO_PASSWORD', 'usuarios', ?, ?, NOW())
        """;
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, usuarioId);
            stmt.setInt(2, usuarioId);
            stmt.setString(3, ip);
            stmt.executeUpdate();
        }
    }

    private String calcularHashSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            StringBuilder hexString = new StringBuilder();
            
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 no disponible", e);
        }
    }

    private String generarPasswordSeguro(int longitud) {
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
        java.security.SecureRandom random = new java.security.SecureRandom();
        StringBuilder password = new StringBuilder();

        // Asegurar al menos un carácter de cada tipo
        password.append(caracteres.charAt(random.nextInt(26))); // Mayúscula
        password.append(caracteres.charAt(26 + random.nextInt(26))); // Minúscula
        password.append(caracteres.charAt(52 + random.nextInt(10))); // Número
        password.append(caracteres.charAt(62 + random.nextInt(7))); // Símbolo

        // Completar con caracteres aleatorios
        for (int i = 4; i < longitud; i++) {
            password.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }

        // Mezclar el password
        char[] chars = password.toString().toCharArray();
        for (int i = 0; i < chars.length; i++) {
            int randomIndex = random.nextInt(chars.length);
            char temp = chars[i];
            chars[i] = chars[randomIndex];
            chars[randomIndex] = temp;
        }

        return new String(chars);
    }

    private boolean validarFormatoEmail(String email) {
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        Pattern pattern = Pattern.compile(emailRegex);
        return pattern.matcher(email).matches();
    }

    /**
     * Completa el perfil del usuario con información personal
     */
    private Map<String, Object> completarPerfilUsuario(HttpServletRequest req) {
        Map<String, Object> resultado = new HashMap<>();
        
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            resultado.put("success", false);
            resultado.put("message", "Sesión no válida");
            return resultado;
        }
        
        int usuarioId = (Integer) session.getAttribute("usuarioId");
        
        // Obtener parámetros del formulario
        String nombres = req.getParameter("nombres");
        String apellidos = req.getParameter("apellidos");
        String dni = req.getParameter("dni");
        String telefono = req.getParameter("telefono");
        String cargo = req.getParameter("cargo");
        String departamento = req.getParameter("departamento");
        String fechaNacimiento = req.getParameter("fechaNacimiento");
        String direccion = req.getParameter("direccion");
        String genero = req.getParameter("genero");
        String estadoCivil = req.getParameter("estadoCivil");
        String nivelEducacion = req.getParameter("nivelEducacion");
        String profesion = req.getParameter("profesion");
        String telefonoEmergencia = req.getParameter("telefonoEmergencia");
        String contactoEmergencia = req.getParameter("contactoEmergencia");
        
        // Validaciones obligatorias
        if (nombres == null || nombres.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "Los nombres son obligatorios");
            return resultado;
        }
        
        if (apellidos == null || apellidos.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "Los apellidos son obligatorios");
            return resultado;
        }
        
        if (dni == null || dni.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "El DNI es obligatorio");
            return resultado;
        }
        
        // Validar formato DNI peruano
        if (!validarFormatoDNI(dni)) {
            resultado.put("success", false);
            resultado.put("message", "Formato de DNI inválido. Debe tener 8 dígitos");
            return resultado;
        }
        
        if (telefono == null || telefono.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "El teléfono es obligatorio");
            return resultado;
        }
        
        if (cargo == null || cargo.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "El cargo es obligatorio");
            return resultado;
        }
        
        try (Connection conn = Conexion.getConnection()) {
            // Verificar si ya existe un perfil
            boolean perfilExiste = verificarPerfilExiste(usuarioId, conn);
            
            if (perfilExiste) {
                // Actualizar perfil existente
                String sqlUpdate = """
                    UPDATE perfiles_usuarios SET 
                        nombres = ?, apellidos = ?, dni = ?, telefono = ?, 
                        cargo = ?, departamento = ?, fecha_nacimiento = ?, 
                        direccion = ?, genero = ?, estado_civil = ?, 
                        nivel_educacion = ?, profesion = ?, 
                        telefono_emergencia = ?, contacto_emergencia = ?,
                        perfil_completo = 1, fecha_actualizacion_perfil = NOW()
                    WHERE id_perfiles_usuarios = ?
                """;
                
                try (PreparedStatement stmt = conn.prepareStatement(sqlUpdate)) {
                    stmt.setString(1, nombres.trim());
                    stmt.setString(2, apellidos.trim());
                    stmt.setString(3, dni.trim());
                    stmt.setString(4, telefono.trim());
                    stmt.setString(5, cargo.trim());
                    stmt.setString(6, departamento != null ? departamento.trim() : null);
                    stmt.setDate(7, fechaNacimiento != null && !fechaNacimiento.isEmpty() ? 
                                    java.sql.Date.valueOf(fechaNacimiento) : null);
                    stmt.setString(8, direccion != null ? direccion.trim() : null);
                    stmt.setString(9, genero);
                    stmt.setString(10, estadoCivil);
                    stmt.setString(11, nivelEducacion);
                    stmt.setString(12, profesion != null ? profesion.trim() : null);
                    stmt.setString(13, telefonoEmergencia != null ? telefonoEmergencia.trim() : null);
                    stmt.setString(14, contactoEmergencia != null ? contactoEmergencia.trim() : null);
                    stmt.setInt(15, usuarioId);
                    
                    int filasAfectadas = stmt.executeUpdate();
                    
                    if (filasAfectadas > 0) {
                        // Actualizar sesión con nuevo nombre
                        session.setAttribute("userName", nombres + " " + apellidos);
                        
                        resultado.put("success", true);
                        resultado.put("message", "Perfil actualizado exitosamente");
                    } else {
                        resultado.put("success", false);
                        resultado.put("message", "No se pudo actualizar el perfil");
                    }
                }
            } else {
                // Crear nuevo perfil
                String sqlInsert = """
                    INSERT INTO perfiles_usuarios (
                        id_perfiles_usuarios, nombres, apellidos, dni, telefono, 
                        cargo, departamento, fecha_nacimiento, direccion, genero, 
                        estado_civil, nivel_educacion, profesion, telefono_emergencia, 
                        contacto_emergencia, perfil_completo, activo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
                """;
                
                try (PreparedStatement stmt = conn.prepareStatement(sqlInsert)) {
                    stmt.setInt(1, usuarioId);
                    stmt.setString(2, nombres.trim());
                    stmt.setString(3, apellidos.trim());
                    stmt.setString(4, dni.trim());
                    stmt.setString(5, telefono.trim());
                    stmt.setString(6, cargo.trim());
                    stmt.setString(7, departamento != null ? departamento.trim() : null);
                    stmt.setDate(8, fechaNacimiento != null && !fechaNacimiento.isEmpty() ? 
                                    java.sql.Date.valueOf(fechaNacimiento) : null);
                    stmt.setString(9, direccion != null ? direccion.trim() : null);
                    stmt.setString(10, genero);
                    stmt.setString(11, estadoCivil);
                    stmt.setString(12, nivelEducacion);
                    stmt.setString(13, profesion != null ? profesion.trim() : null);
                    stmt.setString(14, telefonoEmergencia != null ? telefonoEmergencia.trim() : null);
                    stmt.setString(15, contactoEmergencia != null ? contactoEmergencia.trim() : null);
                    
                    int filasAfectadas = stmt.executeUpdate();
                    
                    if (filasAfectadas > 0) {
                        // Actualizar sesión con nuevo nombre
                        session.setAttribute("userName", nombres + " " + apellidos);
                        
                        resultado.put("success", true);
                        resultado.put("message", "Perfil creado exitosamente");
                    } else {
                        resultado.put("success", false);
                        resultado.put("message", "No se pudo crear el perfil");
                    }
                }
            }
            
            // Registrar auditoría
            registrarActualizacionPerfil(usuarioId, req.getRemoteAddr(), conn);
            
        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al procesar perfil: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Obtiene los cargos disponibles para el usuario
     */
    private Map<String, Object> obtenerCargosDisponibles() {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> cargos = new ArrayList<>();
        
        String sql = """
            SELECT DISTINCT c.nombre_cargo, c.departamento, c.descripcion, c.nivel_jerarquico
            FROM cargos_empresa c
            WHERE c.activo = 1
            ORDER BY c.departamento, c.nivel_jerarquico DESC, c.nombre_cargo
        """;
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> cargo = new HashMap<>();
                cargo.put("nombre", rs.getString("nombre_cargo"));
                cargo.put("departamento", rs.getString("departamento"));
                cargo.put("descripcion", rs.getString("descripcion"));
                cargo.put("nivelJerarquico", rs.getInt("nivel_jerarquico"));
                cargos.add(cargo);
            }
            
            resultado.put("success", true);
            resultado.put("cargos", cargos);
            
        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener cargos: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Obtiene los departamentos disponibles
     */
    private Map<String, Object> obtenerDepartamentos() {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> departamentos = new ArrayList<>();
        
        String sql = """
            SELECT nombre_departamento, descripcion
            FROM departamentos_empresa
            WHERE activo = 1
            ORDER BY orden_visualizacion, nombre_departamento
        """;
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> depto = new HashMap<>();
                depto.put("nombre", rs.getString("nombre_departamento"));
                depto.put("descripcion", rs.getString("descripcion"));
                departamentos.add(depto);
            }
            
            resultado.put("success", true);
            resultado.put("departamentos", departamentos);
            
        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener departamentos: " + e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Valida formato de DNI peruano
     */
    private Map<String, Object> validarDNI(HttpServletRequest req) {
        Map<String, Object> resultado = new HashMap<>();
        String dni = req.getParameter("dni");
        
        if (dni == null || dni.trim().isEmpty()) {
            resultado.put("valid", false);
            resultado.put("message", "DNI requerido");
            return resultado;
        }
        
        if (!validarFormatoDNI(dni)) {
            resultado.put("valid", false);
            resultado.put("message", "DNI debe tener exactamente 8 dígitos");
            return resultado;
        }
        
        // Verificar que no esté en uso por otro usuario
        try (Connection conn = Conexion.getConnection()) {
            String sql = "SELECT id_perfiles_usuarios FROM perfiles_usuarios WHERE dni = ? AND activo = 1";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, dni.trim());
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        resultado.put("valid", false);
                        resultado.put("message", "Este DNI ya está registrado por otro usuario");
                    } else {
                        resultado.put("valid", true);
                        resultado.put("message", "DNI disponible");
                    }
                }
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("valid", false);
            resultado.put("message", "Error al validar DNI");
        }
        
        return resultado;
    }

    // Métodos auxiliares para perfiles

    private boolean validarFormatoDNI(String dni) {
        return dni != null && dni.trim().matches("\\d{8}");
    }

    private boolean verificarPerfilExiste(int usuarioId, Connection conn) throws SQLException {
        String sql = "SELECT COUNT(*) FROM perfiles_usuarios WHERE id_perfiles_usuarios = ?";
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        }
        
        return false;
    }

    private void registrarActualizacionPerfil(int usuarioId, String ipOrigen, Connection conn) throws SQLException {
        String sql = """
            INSERT INTO logs_auditoria (usuario_id, accion, tabla_afectada, registro_id, ip_origen, fecha_accion, observaciones)
            VALUES (?, 'UPDATE_PERFIL', 'perfiles_usuarios', ?, ?, NOW(), 'Actualización de perfil de usuario')
        """;
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, usuarioId);
            stmt.setInt(2, usuarioId);
            stmt.setString(3, ipOrigen);
            stmt.executeUpdate();
        }
    }
}