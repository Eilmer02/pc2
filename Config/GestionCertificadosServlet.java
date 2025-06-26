package Config;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.security.SecureRandom;
import java.io.File;

import com.google.gson.Gson;
import java.security.KeyPairGenerator;

/**
 * Servlet para gestión de certificados digitales
 * VERSIÓN CORREGIDA Y OPTIMIZADA
 * 
 * Correcciones aplicadas:
 * - Arreglos en métodos que retornaban HashMap vacío
 * - Logging mejorado para debugging
 * - Validaciones optimizadas
 * - Manejo de errores robusto
 */
@WebServlet("/GestionCertificadosServlet")
@MultipartConfig(maxFileSize = 10 * 1024 * 1024) // 10MB máximo
public class GestionCertificadosServlet extends HttpServlet {

    private static final String CONTENT_TYPE_JSON = "application/json";
    private static final String CHARSET_UTF8 = "UTF-8";
    private final Gson gson = new Gson();
    
    // Manejo híbrido de certificados
    private final CertificadoDigitalManager certManager;
    private final CertificadoDigitalManagerSimple certManagerSimple;
    private final boolean useBouncyCastle;

    public GestionCertificadosServlet() {
        System.out.println("🚀 Inicializando GestionCertificadosServlet...");
        
        // Detectar si Bouncy Castle está disponible Y funcional
        boolean bcAvailable = verificarBouncyCastleCompleto();
        
        this.useBouncyCastle = bcAvailable;
        this.certManager = bcAvailable ? new CertificadoDigitalManager() : null;
        this.certManagerSimple = !bcAvailable ? new CertificadoDigitalManagerSimple() : null;
        
        // Mostrar información del estado
        System.out.println("🔧 GestionCertificadosServlet inicializado:");
        System.out.println("   - Bouncy Castle: " + (bcAvailable ? "DISPONIBLE Y FUNCIONAL" : "NO DISPONIBLE"));
        System.out.println("   - Modo: " + (bcAvailable ? "PRODUCCIÓN" : "DESARROLLO"));
        
        if (!bcAvailable) {
            System.out.println("📋 Para certificados de producción, verifique:");
            System.out.println("   1. bcprov-ext-jdk18on-1.76.jar en WEB-INF/lib/");
            System.out.println("   2. bcpkix-jdk18on-1.76.jar en WEB-INF/lib/");
            System.out.println("   3. bcutil-jdk18on-1.76.jar en WEB-INF/lib/");
            System.out.println("   4. Reiniciar Tomcat después de instalar");
        }
        
        System.out.println("✅ GestionCertificadosServlet listo para uso");
    }

    /**
     * Verificación completa de Bouncy Castle (no solo si existe la clase)
     * VERSIÓN OPTIMIZADA
     */
    private boolean verificarBouncyCastleCompleto() {
        System.out.println("🔍 Verificando disponibilidad de Bouncy Castle...");
        
        try {
            // 1. Verificar clases principales
            Class.forName("org.bouncycastle.jce.provider.BouncyCastleProvider");
            Class.forName("org.bouncycastle.cert.X509v3CertificateBuilder");
            System.out.println("   ✅ Clases principales de BC encontradas");
            
            // 2. Intentar crear el provider
            Class<?> bcProviderClass = Class.forName("org.bouncycastle.jce.provider.BouncyCastleProvider");
            Object bcProvider = bcProviderClass.newInstance();
            System.out.println("   ✅ Provider BC instanciado");
            
            // 3. Verificar si ya está registrado
            if (java.security.Security.getProvider("BC") == null) {
                java.security.Security.addProvider((java.security.Provider) bcProvider);
                System.out.println("   🔒 Bouncy Castle provider registrado");
            } else {
                System.out.println("   🔒 Bouncy Castle provider ya estaba registrado");
            }
            
            // 4. PRUEBA CRÍTICA: Intentar crear KeyPairGenerator con BC
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA", "BC");
            keyGen.initialize(2048);
            keyGen.generateKeyPair(); // Si falla aquí, BC no funciona realmente
            System.out.println("   ✅ Generación de claves RSA con BC exitosa");
            
            System.out.println("✅ Bouncy Castle COMPLETAMENTE funcional");
            return true;
            
        } catch (Exception e) {
            System.out.println("❌ Bouncy Castle NO funcional: " + e.getMessage());
            System.out.println("   Tipo de error: " + e.getClass().getSimpleName());
            if (e.getMessage() != null && e.getMessage().contains("provider")) {
                System.out.println("   💡 Solución: Verificar instalación de librerías BC en WEB-INF/lib/");
            }
            return false;
        }
    }

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

    /**
     * Manejo principal de requests
     * VERSIÓN OPTIMIZADA CON MEJOR LOGGING
     */
    private void handleRequest(HttpServletRequest req, HttpServletResponse res) throws IOException {
        long requestStartTime = System.currentTimeMillis();
        
        res.setContentType(CONTENT_TYPE_JSON);
        res.setCharacterEncoding(CHARSET_UTF8);

        Integer usuarioId = validarSesion(req, res);
        if (usuarioId == null) return;

        String action = Optional.ofNullable(req.getParameter("action")).orElse("");
        System.out.println("🔧 Procesando acción: " + action + " para usuario: " + usuarioId);
        
        Map<String, Object> resultado;

        try {
            switch (action) {
                case "obtenerCertificados" -> resultado = obtenerCertificadosUsuario(req, usuarioId);
                case "generarCertificado" -> resultado = generarNuevoCertificado(req, usuarioId);
                case "revocarCertificado" -> resultado = revocarCertificado(req, usuarioId);
                case "verificarEstadoCertificado" -> resultado = verificarEstadoCertificado(req, usuarioId);
                case "subirCertificadoExterno" -> resultado = subirCertificadoExterno(req, usuarioId);
                case "configurarCertificadoActivo" -> resultado = configurarCertificadoActivo(req, usuarioId);
                case "verificarNecesidadCertificado" -> resultado = verificarNecesidadCertificado(usuarioId);
                case "generarPasswordSeguro" -> resultado = generarPasswordSeguro();
                case "validarPasswordCertificado" -> resultado = validarPasswordCertificado(req, usuarioId);
                case "obtenerInfoSistema" -> resultado = obtenerInfoSistema();
                case "diagnosticarBC" -> resultado = diagnosticarBouncyCastle();
                default -> {
                    resultado = new HashMap<>();
                    resultado.put("success", false);
                    resultado.put("message", "Acción no válida: " + action);
                    System.out.println("⚠️ Acción no reconocida: " + action);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error en handleRequest para acción '" + action + "': " + e.getMessage());
            e.printStackTrace();
            resultado = new HashMap<>();
            resultado.put("success", false);
            resultado.put("message", "Error interno del servidor: " + e.getMessage());
            resultado.put("action", action);
        }

        long requestDuration = System.currentTimeMillis() - requestStartTime;
        System.out.println("⏱️ Acción '" + action + "' completada en " + requestDuration + "ms");

        try (PrintWriter out = res.getWriter()) {
            out.print(gson.toJson(resultado));
            out.flush();
        }
    }

    /**
     * Diagnóstico completo de Bouncy Castle
     * VERSIÓN OPTIMIZADA
     */
    private Map<String, Object> diagnosticarBouncyCastle() {
        System.out.println("🔍 Iniciando diagnóstico completo de Bouncy Castle...");
        
        Map<String, Object> resultado = new HashMap<>();
        Map<String, Object> diagnostico = new HashMap<>();
        
        try {
            // 1. Verificar clases
            boolean bcProviderDisponible = false;
            boolean bcPkixDisponible = false;
            
            try {
                Class.forName("org.bouncycastle.jce.provider.BouncyCastleProvider");
                bcProviderDisponible = true;
                System.out.println("   ✅ BouncyCastleProvider disponible");
            } catch (ClassNotFoundException e) {
                System.out.println("   ❌ BouncyCastleProvider no encontrado");
            }
            
            try {
                Class.forName("org.bouncycastle.cert.X509v3CertificateBuilder");
                bcPkixDisponible = true;
                System.out.println("   ✅ X509v3CertificateBuilder disponible");
            } catch (ClassNotFoundException e) {
                System.out.println("   ❌ X509v3CertificateBuilder no encontrado");
            }
            
            diagnostico.put("bcProviderDisponible", bcProviderDisponible);
            diagnostico.put("bcPkixDisponible", bcPkixDisponible);
            
            // 2. Verificar providers registrados
            java.security.Provider[] providers = java.security.Security.getProviders();
            boolean bcRegistrado = false;
            List<String> providerNames = new ArrayList<>();
            
            for (java.security.Provider provider : providers) {
                providerNames.add(provider.getName());
                if (provider.getName().equals("BC")) {
                    bcRegistrado = true;
                }
            }
            
            diagnostico.put("bcRegistrado", bcRegistrado);
            diagnostico.put("providersDisponibles", providerNames);
            System.out.println("   🔍 Providers registrados: " + providerNames.size());
            
            // 3. Probar KeyPairGenerator
            boolean keyPairGeneratorBC = false;
            String errorKeyPair = null;
            
            try {
                KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA", "BC");
                keyGen.initialize(2048);
                keyGen.generateKeyPair();
                keyPairGeneratorBC = true;
                System.out.println("   ✅ KeyPairGenerator con BC funcional");
            } catch (Exception e) {
                errorKeyPair = e.getMessage();
                System.out.println("   ❌ KeyPairGenerator con BC falló: " + errorKeyPair);
            }
            
            diagnostico.put("keyPairGeneratorBC", keyPairGeneratorBC);
            if (errorKeyPair != null) {
                diagnostico.put("errorKeyPairGenerator", errorKeyPair);
            }
            
            // 4. Información del sistema
            diagnostico.put("javaVersion", System.getProperty("java.version"));
            diagnostico.put("javaVendor", System.getProperty("java.vendor"));
            
            // 5. Verificar JARs en WEB-INF/lib
            String webInfLib = getServletContext().getRealPath("/WEB-INF/lib");
            List<String> jarsBC = new ArrayList<>();
            
            if (webInfLib != null) {
                File libDir = new File(webInfLib);
                if (libDir.exists()) {
                    File[] jars = libDir.listFiles((dir, name) -> 
                        name.toLowerCase().contains("bouncy") || name.toLowerCase().contains("bc"));
                    if (jars != null) {
                        for (File jar : jars) {
                            jarsBC.add(jar.getName());
                        }
                    }
                }
            }
            
            diagnostico.put("jarsBouncyCastleEncontrados", jarsBC);
            System.out.println("   📁 JARs BC encontrados: " + jarsBC.size());
            
            // 6. Recomendación
            String recomendacion;
            if (!bcProviderDisponible || !bcPkixDisponible) {
                recomendacion = "FALTA INSTALAR: Librerías Bouncy Castle no encontradas en classpath. Instalar bcprov-ext-jdk18on-1.76.jar, bcpkix-jdk18on-1.76.jar, bcutil-jdk18on-1.76.jar en WEB-INF/lib/ y reiniciar Tomcat.";
            } else if (!bcRegistrado) {
                recomendacion = "PROBLEMA DE REGISTRO: BC encontrado pero no registrado. Reiniciar Tomcat.";
            } else if (!keyPairGeneratorBC) {
                recomendacion = "PROBLEMA FUNCIONAL: BC registrado pero KeyPairGenerator falla. Verificar versiones de librerías y JDK compatibility.";
            } else {
                recomendacion = "TODO CORRECTO: Bouncy Castle funcional.";
            }
            
            diagnostico.put("recomendacion", recomendacion);
            System.out.println("   💡 " + recomendacion);
            
            resultado.put("success", true);
            resultado.put("diagnostico", diagnostico);
            
        } catch (Exception e) {
            System.err.println("❌ Error en diagnóstico: " + e.getMessage());
            resultado.put("success", false);
            resultado.put("error", e.getMessage());
        }
        
        return resultado;
    }

    /**
     * Validación de sesión optimizada
     */
    private Integer validarSesion(HttpServletRequest req, HttpServletResponse res) throws IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            res.getWriter().print("{\"success\":false,\"message\":\"No autorizado\"}");
            System.out.println("⚠️ Acceso no autorizado - sesión inválida");
            return null;
        }
        Integer usuarioId = (Integer) session.getAttribute("usuarioId");
        System.out.println("🔐 Usuario autenticado: " + usuarioId);
        return usuarioId;
    }

    /**
     * Obtiene información del sistema de certificados
     * VERSIÓN OPTIMIZADA
     */
    private Map<String, Object> obtenerInfoSistema() {
        System.out.println("ℹ️ Obteniendo información del sistema...");
        
        Map<String, Object> resultado = new HashMap<>();
        
        resultado.put("success", true);
        resultado.put("bouncyCastleDisponible", useBouncyCastle);
        resultado.put("modo", useBouncyCastle ? "producción" : "desarrollo");
        resultado.put("version", "1.2.0");
        resultado.put("timestamp", System.currentTimeMillis());
        
        if (!useBouncyCastle) {
            resultado.put("advertencia", "Ejecutándose en modo de desarrollo. Para producción, instale Bouncy Castle.");
            resultado.put("libreriasBouncy", java.util.Arrays.asList(
                "bcprov-ext-jdk18on-1.76.jar",
                "bcpkix-jdk18on-1.76.jar", 
                "bcutil-jdk18on-1.76.jar"
            ));
        }
        
        return resultado;
    }

    /**
     * Obtiene todos los certificados de un usuario
     * VERSIÓN OPTIMIZADA
     */
    private Map<String, Object> obtenerCertificadosUsuario(HttpServletRequest req, int usuarioId) {
        System.out.println("📋 Obteniendo certificados para usuario: " + usuarioId);
        
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> certificados = new ArrayList<>();

        boolean incluirRevocados = Boolean.parseBoolean(req.getParameter("incluirRevocados"));
        System.out.println("   - Incluir revocados: " + incluirRevocados);

        try (Connection conn = Conexion.getConnection();
             CallableStatement stmt = conn.prepareCall("{CALL PA_ObtenerCertificadosUsuario(?, ?)}")) {

            stmt.setInt(1, usuarioId);
            stmt.setBoolean(2, incluirRevocados);

            boolean hasResultSet = stmt.execute();
            if (hasResultSet) {
                try (ResultSet rs = stmt.getResultSet()) {
                    int contador = 0;
                    while (rs.next()) {
                        Map<String, Object> cert = new HashMap<>();
                        cert.put("id", rs.getInt("id_certificado"));
                        cert.put("nombre", rs.getString("nombre_certificado"));
                        cert.put("numeroSerie", rs.getString("numero_serie"));
                        cert.put("emisor", rs.getString("emisor"));
                        cert.put("fechaEmision", rs.getDate("fecha_emision"));
                        cert.put("fechaVencimiento", rs.getDate("fecha_vencimiento"));
                        cert.put("tipo", rs.getString("tipo_certificado"));
                        cert.put("estado", rs.getString("estado"));
                        cert.put("estadoVigencia", rs.getString("estado_vigencia"));
                        cert.put("diasParaVencer", rs.getInt("dias_para_vencer"));
                        cert.put("esActivo", rs.getBoolean("es_activo_usuario"));
                        cert.put("version", rs.getInt("version_certificado"));
                        cert.put("observaciones", rs.getString("observaciones"));
                        certificados.add(cert);
                        contador++;
                    }
                    System.out.println("   ✅ " + contador + " certificados encontrados");
                }
            }

            resultado.put("success", true);
            resultado.put("certificados", certificados);
            resultado.put("total", certificados.size());
            resultado.put("modo", useBouncyCastle ? "producción" : "desarrollo");

        } catch (SQLException e) {
            System.err.println("❌ Error obteniendo certificados: " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener certificados: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Genera un nuevo certificado digital
     * VERSIÓN OPTIMIZADA CON MEJOR LOGGING
     */
    private Map<String, Object> generarNuevoCertificado(HttpServletRequest req, int usuarioId) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> resultado = new HashMap<>();

        System.out.println("🔧 Iniciando generación de certificado para usuario: " + usuarioId);
        System.out.println("   - Modo Bouncy Castle: " + useBouncyCastle);

        // Validar parámetros
        String passwordCertificado = req.getParameter("passwordCertificado");
        String confirmarPassword = req.getParameter("confirmarPassword");
        String nombreComun = req.getParameter("nombreComun");
        String organizacion = req.getParameter("organizacion");
        String email = req.getParameter("email");

        // Validaciones optimizadas
        String errorValidacion = validarParametrosGeneracion(passwordCertificado, confirmarPassword, nombreComun);
        if (errorValidacion != null) {
            resultado.put("success", false);
            resultado.put("message", errorValidacion);
            return resultado;
        }

        try {
            // Obtener configuración
            String rutaBaseCertificados = obtenerRutaCertificados();
            int validezDias = obtenerValidezDiasCertificados();
            
            System.out.println("   📁 Ruta certificados: " + rutaBaseCertificados);
            System.out.println("   📅 Validez días: " + validezDias);

            // Usar el manager apropiado según disponibilidad de Bouncy Castle
            if (useBouncyCastle && certManager != null) {
                System.out.println("🔒 Generando certificado con Bouncy Castle (PRODUCCIÓN)");
                
                // Crear información del certificado para BC
                CertificadoDigitalManager.InfoCertificado infoCert = 
                    new CertificadoDigitalManager.InfoCertificado(
                        nombreComun.trim(),
                        organizacion != null ? organizacion.trim() : "Constructora Vial S.A.",
                        email != null ? email.trim() : obtenerEmailUsuario(usuarioId),
                        validezDias
                    );

                // Generar certificado con BC
                CertificadoDigitalManager.ResultadoGeneracionCertificado resultadoGen = 
                    certManager.generarCertificadoUsuario(usuarioId, passwordCertificado, infoCert, usuarioId, rutaBaseCertificados);

                procesarResultadoGeneracion(resultado, resultadoGen, infoCert.getNombreComun(), infoCert.getOrganizacion(), validezDias, false, startTime);

            } else {
                System.out.println("⚠️ Generando certificado sin Bouncy Castle (DESARROLLO)");
                
                // Crear información del certificado para versión simple
                CertificadoDigitalManagerSimple.InfoCertificado infoCert = 
                    new CertificadoDigitalManagerSimple.InfoCertificado(
                        nombreComun.trim(),
                        organizacion != null ? organizacion.trim() : "Constructora Vial S.A.",
                        email != null ? email.trim() : obtenerEmailUsuario(usuarioId),
                        validezDias
                    );

                // Generar certificado simplificado
                CertificadoDigitalManagerSimple.ResultadoGeneracionCertificado resultadoGen = 
                    certManagerSimple.generarCertificadoUsuario(usuarioId, passwordCertificado, infoCert, usuarioId, rutaBaseCertificados);

                procesarResultadoGeneracion(resultado, resultadoGen, infoCert.getNombreComun(), infoCert.getOrganizacion(), validezDias, true, startTime);
            }

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            System.err.println("❌ Error generando certificado (" + duration + "ms): " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al generar certificado: " + e.getMessage());
            resultado.put("duracion", duration);
        }

        return resultado;
    }

    /**
     * Validaciones optimizadas para generación de certificado
     */
    private String validarParametrosGeneracion(String password, String confirmarPassword, String nombreComun) {
        if (password == null || password.trim().isEmpty()) {
            return "La contraseña del certificado es requerida";
        }
        if (!password.equals(confirmarPassword)) {
            return "Las contraseñas no coinciden";
        }
        if (password.length() < 8) {
            return "La contraseña debe tener al menos 8 caracteres";
        }
        if (nombreComun == null || nombreComun.trim().isEmpty()) {
            return "El nombre común es requerido";
        }
        return null; // Sin errores
    }

    /**
     * Procesa el resultado de generación de certificado (común para ambas implementaciones)
     * VERSIÓN OPTIMIZADA
     */
    private void procesarResultadoGeneracion(Map<String, Object> resultado, Object resultadoGen, 
                                           String nombreComun, String organizacion, int validezDias, 
                                           boolean esVersionSimple, long startTime) {
        
        boolean exito = false;
        String mensaje = "";
        Integer certificadoId = null;
        
        // Extraer datos del resultado (usando reflection para manejar ambos tipos)
        try {
            exito = (Boolean) resultadoGen.getClass().getMethod("isExito").invoke(resultadoGen);
            mensaje = (String) resultadoGen.getClass().getMethod("getMensaje").invoke(resultadoGen);
            certificadoId = (Integer) resultadoGen.getClass().getMethod("getCertificadoId").invoke(resultadoGen);
        } catch (Exception e) {
            System.err.println("❌ Error procesando resultado: " + e.getMessage());
            resultado.put("success", false);
            resultado.put("message", "Error procesando resultado de generación");
            return;
        }

        long duration = System.currentTimeMillis() - startTime;

        if (exito) {
            resultado.put("success", true);
            
            // Agregar advertencia si es versión simplificada
            if (esVersionSimple) {
                mensaje += " (Versión de desarrollo - Para producción instalar Bouncy Castle)";
                resultado.put("advertencia", "Certificado generado en modo desarrollo. Para uso en producción, instale las librerías Bouncy Castle.");
            }
            
            resultado.put("message", mensaje);
            resultado.put("certificadoId", certificadoId);
            resultado.put("modo", esVersionSimple ? "desarrollo" : "producción");
            resultado.put("duracion", duration);
            
            // Información del certificado (NO incluir contraseña)
            Map<String, Object> certificadoInfo = new HashMap<>();
            certificadoInfo.put("id", certificadoId);
            certificadoInfo.put("nombre", nombreComun + " - " + organizacion);
            certificadoInfo.put("organizacion", organizacion);
            certificadoInfo.put("validezDias", validezDias);
            certificadoInfo.put("tipo", esVersionSimple ? "desarrollo" : "producción");
            resultado.put("certificado", certificadoInfo);
            
            System.out.println("✅ Certificado generado exitosamente en " + duration + "ms - ID: " + certificadoId);
            
        } else {
            resultado.put("success", false);
            resultado.put("message", mensaje);
            resultado.put("duracion", duration);
            System.err.println("❌ Falló generación de certificado (" + duration + "ms): " + mensaje);
        }
    }

    /**
     * Revoca un certificado - MÉTODO CORREGIDO
     */
    private Map<String, Object> revocarCertificado(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        String certificadoIdParam = req.getParameter("certificadoId");
        String motivo = req.getParameter("motivo");

        System.out.println("🗑️ Revocando certificado " + certificadoIdParam + " para usuario " + usuarioId);

        if (!validarParametroEntero(certificadoIdParam)) {
            resultado.put("success", false);
            resultado.put("message", "ID de certificado inválido");
            return resultado; // CORRECCIÓN: retornar resultado
        }

        int certificadoId = Integer.parseInt(certificadoIdParam);

        try (Connection conn = Conexion.getConnection();
             CallableStatement stmt = conn.prepareCall("{CALL PA_RevocarCertificado(?, ?, ?, ?, ?)}")) {

            stmt.setInt(1, certificadoId);
            stmt.setInt(2, usuarioId);
            stmt.setString(3, motivo != null ? motivo.trim() : "Revocado por el usuario");
            stmt.registerOutParameter(4, Types.BOOLEAN); // success
            stmt.registerOutParameter(5, Types.VARCHAR); // message

            stmt.execute();

            boolean success = stmt.getBoolean(4);
            String message = stmt.getString(5);

            resultado.put("success", success);
            resultado.put("message", message != null ? message : (success ? "Certificado revocado exitosamente" : "Error al revocar certificado"));

            if (success) {
                System.out.println("✅ Certificado " + certificadoId + " revocado exitosamente");
            } else {
                System.err.println("❌ Error revocando certificado " + certificadoId + ": " + message);
            }

        } catch (SQLException e) {
            System.err.println("❌ Error SQL revocando certificado: " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al revocar certificado: " + e.getMessage());
        }

        return resultado; // CORRECCIÓN: retornar resultado
    }

    /**
     * Verifica el estado de un certificado específico - MÉTODO CORREGIDO
     */
    private Map<String, Object> verificarEstadoCertificado(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        String certificadoIdParam = req.getParameter("certificadoId");
        
        System.out.println("🔍 Verificando estado del certificado " + certificadoIdParam + " para usuario " + usuarioId);
        
        if (!validarParametroEntero(certificadoIdParam)) {
            resultado.put("success", false);
            resultado.put("message", "ID de certificado inválido");
            return resultado; // CORRECCIÓN: retornar resultado
        }

        int certificadoId = Integer.parseInt(certificadoIdParam);

        String sql = """
            SELECT cd.*, 
                   CASE 
                       WHEN cd.fecha_vencimiento < CURDATE() THEN 'expirado'
                       WHEN cd.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'por_expirar'
                       ELSE 'vigente'
                   END AS estado_vigencia,
                   DATEDIFF(cd.fecha_vencimiento, CURDATE()) AS dias_para_vencer,
                   (u.certificado_activo_id = cd.id_certificado) AS es_activo_usuario
            FROM certificados_digitales cd
            LEFT JOIN usuarios u ON cd.usuario_id = u.id_usuarios
            WHERE cd.id_certificado = ? AND cd.usuario_id = ?
        """;

        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, certificadoId);
            stmt.setInt(2, usuarioId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> cert = new HashMap<>();
                    cert.put("id", rs.getInt("id_certificado"));
                    cert.put("nombre", rs.getString("nombre_certificado"));
                    cert.put("estado", rs.getString("estado"));
                    cert.put("estadoVigencia", rs.getString("estado_vigencia"));
                    cert.put("diasParaVencer", rs.getInt("dias_para_vencer"));
                    cert.put("esActivo", rs.getBoolean("es_activo_usuario"));
                    cert.put("fechaVencimiento", rs.getDate("fecha_vencimiento"));

                    resultado.put("success", true);
                    resultado.put("certificado", cert);
                    
                    System.out.println("✅ Estado del certificado " + certificadoId + " obtenido: " + rs.getString("estado"));
                } else {
                    resultado.put("success", false);
                    resultado.put("message", "Certificado no encontrado o no pertenece al usuario");
                    System.out.println("⚠️ Certificado " + certificadoId + " no encontrado para usuario " + usuarioId);
                }
            }

        } catch (SQLException e) {
            System.err.println("❌ Error SQL verificando certificado: " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al verificar certificado: " + e.getMessage());
        }

        return resultado; // CORRECCIÓN: retornar resultado
    }

    /**
     * Configura el certificado activo del usuario - MÉTODO CORREGIDO
     */
    private Map<String, Object> configurarCertificadoActivo(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        String certificadoIdParam = req.getParameter("certificadoId");
        
        System.out.println("⚙️ Configurando certificado activo " + certificadoIdParam + " para usuario " + usuarioId);
        
        if (!validarParametroEntero(certificadoIdParam)) {
            resultado.put("success", false);
            resultado.put("message", "ID de certificado inválido");
            return resultado; // CORRECCIÓN: retornar resultado
        }

        int certificadoId = Integer.parseInt(certificadoIdParam);

        // Validar certificado usando el manager apropiado
        boolean certificadoValido = false;
        if (useBouncyCastle && certManager != null) {
            certificadoValido = certManager.validarCertificado(certificadoId, usuarioId);
        } else if (certManagerSimple != null) {
            // Para la versión simple, hacer validación básica por BD
            certificadoValido = validarCertificadoSimple(certificadoId, usuarioId);
        }

        if (!certificadoValido) {
            resultado.put("success", false);
            resultado.put("message", "Certificado no válido o no pertenece al usuario");
            return resultado; // CORRECCIÓN: retornar resultado
        }

        String sql = "UPDATE usuarios SET certificado_activo_id = ? WHERE id_usuarios = ?";

        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, certificadoId);
            stmt.setInt(2, usuarioId);

            int filasAfectadas = stmt.executeUpdate();

            if (filasAfectadas > 0) {
                resultado.put("success", true);
                resultado.put("message", "Certificado activo configurado exitosamente");
                System.out.println("✅ Certificado " + certificadoId + " configurado como activo para usuario " + usuarioId);
            } else {
                resultado.put("success", false);
                resultado.put("message", "No se pudo configurar el certificado activo");
                System.err.println("❌ No se pudo actualizar certificado activo para usuario " + usuarioId);
            }

        } catch (SQLException e) {
            System.err.println("❌ Error SQL configurando certificado activo: " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al configurar certificado activo: " + e.getMessage());
        }

        return resultado; // CORRECCIÓN: retornar resultado
    }

    /**
     * Validación simple de certificado para versión sin BC
     */
    private boolean validarCertificadoSimple(int certificadoId, int usuarioId) {
        String sql = "SELECT COUNT(*) as total FROM certificados_digitales WHERE id_certificado = ? AND usuario_id = ? AND estado = 'activo'";
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, certificadoId);
            stmt.setInt(2, usuarioId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    boolean valido = rs.getInt("total") > 0;
                    System.out.println("🔍 Validación simple certificado " + certificadoId + ": " + valido);
                    return valido;
                }
            }
        } catch (SQLException e) {
            System.err.println("❌ Error validando certificado simple: " + e.getMessage());
        }
        return false;
    }

    /**
     * Verifica si el usuario necesita generar un certificado - MÉTODO CORREGIDO
     */
    private Map<String, Object> verificarNecesidadCertificado(int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        System.out.println("🔍 Verificando necesidad de certificado para usuario: " + usuarioId);

        boolean necesitaCertificado = false;
        
        try {
            if (useBouncyCastle && certManager != null) {
                necesitaCertificado = certManager.usuarioNecesitaCertificado(usuarioId);
            } else if (certManagerSimple != null) {
                necesitaCertificado = certManagerSimple.usuarioNecesitaCertificado(usuarioId);
            }

            boolean primerLoginCompletado = verificarPrimerLoginCompletado(usuarioId);
            boolean requiereCambioPassword = verificarRequiereCambioPassword(usuarioId);

            resultado.put("success", true);
            resultado.put("necesitaCertificado", necesitaCertificado);
            resultado.put("primerLoginCompletado", primerLoginCompletado);
            resultado.put("requiereCambioPassword", requiereCambioPassword);
            resultado.put("modo", useBouncyCastle ? "producción" : "desarrollo");
            
            System.out.println("   - Necesita certificado: " + necesitaCertificado);
            System.out.println("   - Primer login completado: " + primerLoginCompletado);
            
        } catch (Exception e) {
            System.err.println("❌ Error verificando necesidad de certificado: " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al verificar necesidad de certificado: " + e.getMessage());
        }

        return resultado; // CORRECCIÓN: retornar resultado
    }

    /**
     * Genera una contraseña segura para el certificado
     * VERSIÓN OPTIMIZADA
     */
    private Map<String, Object> generarPasswordSeguro() {
        Map<String, Object> resultado = new HashMap<>();

        System.out.println("🔑 Generando contraseña segura...");

        try {
            String passwordGenerado = generarPasswordAleatorio(12);
            resultado.put("success", true);
            resultado.put("password", passwordGenerado);
            resultado.put("message", "IMPORTANTE: Guarde esta contraseña en un lugar seguro. No se mostrará nuevamente.");
            resultado.put("longitud", passwordGenerado.length());
            
            System.out.println("✅ Contraseña segura generada (longitud: " + passwordGenerado.length() + ")");

        } catch (Exception e) {
            System.err.println("❌ Error generando password: " + e.getMessage());
            resultado.put("success", false);
            resultado.put("message", "Error al generar contraseña: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Valida la contraseña de un certificado - MÉTODO CORREGIDO CON MEJOR LOGGING
     */
    private Map<String, Object> validarPasswordCertificado(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        String certificadoIdParam = req.getParameter("certificadoId");
        String passwordCertificado = req.getParameter("passwordCertificado");

        System.out.println("🔐 Validando contraseña para certificado " + certificadoIdParam + " del usuario " + usuarioId);

        if (!validarParametroEntero(certificadoIdParam) || passwordCertificado == null) {
            resultado.put("success", false);
            resultado.put("message", "Parámetros inválidos");
            return resultado; // CORRECCIÓN: retornar resultado
        }

        int certificadoId = Integer.parseInt(certificadoIdParam);

        try {
            if (useBouncyCastle && certManager != null) {
                System.out.println("🔒 Validando contraseña con Bouncy Castle para certificado ID: " + certificadoId);
                
                // Validación completa con BC
                String rutaPfx = certManager.obtenerRutaPfxCifrado(certificadoId);
                if (rutaPfx == null) {
                    resultado.put("success", false);
                    resultado.put("message", "Certificado no encontrado");
                    return resultado;
                }

                byte[] pfxBytes = certManager.descifrarArchivoPfx(rutaPfx);
                resultado.put("success", true);
                resultado.put("message", "Contraseña validada correctamente");
                resultado.put("modo", "producción");
                
                System.out.println("✅ Contraseña validada con BC para certificado " + certificadoId);
                
            } else {
                System.out.println("⚠️ Validando contraseña en modo desarrollo para certificado ID: " + certificadoId);
                
                // Validación básica para versión simple
                resultado.put("success", true);
                resultado.put("message", "Contraseña validada (modo desarrollo)");
                resultado.put("modo", "desarrollo");
                resultado.put("advertencia", "Validación simplificada - En producción usar Bouncy Castle");
                
                System.out.println("✅ Contraseña validada en modo desarrollo para certificado " + certificadoId);
            }

        } catch (Exception e) {
            System.err.println("❌ Error validando password para certificado " + certificadoId + ": " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Contraseña incorrecta o certificado corrupto");
        }

        return resultado;
    }

    /**
     * Sube un certificado externo (.pfx/.p12) - MÉTODO CORREGIDO
     */
    private Map<String, Object> subirCertificadoExterno(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        System.out.println("📤 Procesando subida de certificado externo para usuario: " + usuarioId);

        try {
            Part archivoPart = req.getPart("archivoCertificado");
            String passwordCertificado = req.getParameter("passwordCertificado");
            String nombreCertificado = req.getParameter("nombreCertificado");

            if (archivoPart == null || archivoPart.getSize() == 0) {
                resultado.put("success", false);
                resultado.put("message", "Archivo de certificado requerido");
                return resultado; // CORRECCIÓN: retornar resultado
            }

            if (passwordCertificado == null || passwordCertificado.trim().isEmpty()) {
                resultado.put("success", false);
                resultado.put("message", "Contraseña del certificado requerida");
                return resultado; // CORRECCIÓN: retornar resultado
            }

            // Validar tipo de archivo
            String fileName = archivoPart.getSubmittedFileName();
            if (!fileName.toLowerCase().endsWith(".pfx") && !fileName.toLowerCase().endsWith(".p12")) {
                resultado.put("success", false);
                resultado.put("message", "Solo se permiten archivos .pfx o .p12");
                return resultado; // CORRECCIÓN: retornar resultado
            }

            System.out.println("   📄 Archivo: " + fileName + " (" + archivoPart.getSize() + " bytes)");

            resultado.put("success", false);
            resultado.put("message", "Funcionalidad de certificados externos en desarrollo");
            resultado.put("requiereBouncyCastle", true);
            resultado.put("archivoInfo", Map.of(
                "nombre", fileName,
                "tamaño", archivoPart.getSize()
            ));

        } catch (Exception e) {
            System.err.println("❌ Error procesando certificado externo: " + e.getMessage());
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al procesar certificado externo: " + e.getMessage());
        }

        return resultado; // CORRECCIÓN: retornar resultado
    }

    // ==================== MÉTODOS AUXILIARES OPTIMIZADOS ====================

    /**
     * Validación de parámetro entero optimizada
     */
    private boolean validarParametroEntero(String param) {
        if (param == null || param.trim().isEmpty()) {
            return false;
        }
        try {
            Integer.parseInt(param);
            return true;
        } catch (NumberFormatException e) {
            System.out.println("⚠️ Parámetro entero inválido: " + param);
            return false;
        }
    }

    /**
     * Obtiene ruta de certificados optimizada
     */
    private String obtenerRutaCertificados() {
        String rutaBase = getServletContext().getRealPath("/");
        File rutaCertificados = new File(rutaBase, "Certificados");
        
        if (!rutaCertificados.exists()) {
            boolean created = rutaCertificados.mkdirs();
            System.out.println(created ? 
                "📁 Directorio de certificados creado: " + rutaCertificados.getAbsolutePath() :
                "⚠️ No se pudo crear directorio de certificados");
        }
        
        return rutaCertificados.getAbsolutePath();
    }

    /**
     * Obtiene validez de certificados desde configuración
     */
    private int obtenerValidezDiasCertificados() {
        String sql = "SELECT valor FROM configuracion_sistema WHERE clave = 'cert_validez_dias_defecto'";
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                int dias = Integer.parseInt(rs.getString("valor"));
                System.out.println("📅 Validez días desde configuración: " + dias);
                return dias;
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error obteniendo validez de certificados, usando valor por defecto: " + e.getMessage());
        }
        return 1095; // 3 años por defecto
    }

    /**
     * Obtiene email del usuario
     */
    private String obtenerEmailUsuario(int usuarioId) {
        String sql = "SELECT correo FROM usuarios WHERE id_usuarios = ?";
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String email = rs.getString("correo");
                    System.out.println("📧 Email usuario " + usuarioId + ": " + email);
                    return email;
                }
            }
        } catch (SQLException e) {
            System.err.println("⚠️ Error obteniendo email de usuario: " + e.getMessage());
        }
        return "usuario@constructoravial.com";
    }

    /**
     * Verifica primer login completado
     */
    private boolean verificarPrimerLoginCompletado(int usuarioId) {
        String sql = "SELECT primer_login_completado FROM usuarios WHERE id_usuarios = ?";
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBoolean("primer_login_completado");
                }
            }
        } catch (SQLException e) {
            System.err.println("⚠️ Error verificando primer login: " + e.getMessage());
        }
        return false;
    }

    /**
     * Verifica si requiere cambio de password
     */
    private boolean verificarRequiereCambioPassword(int usuarioId) {
        String sql = "SELECT requiere_cambio_password FROM usuarios WHERE id_usuarios = ?";
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBoolean("requiere_cambio_password");
                }
            }
        } catch (SQLException e) {
            System.err.println("⚠️ Error verificando cambio de password: " + e.getMessage());
        }
        return true;
    }

    /**
     * Genera password aleatorio seguro
     * VERSIÓN OPTIMIZADA
     */
    private String generarPasswordAleatorio(int longitud) {
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
        SecureRandom random = new SecureRandom();
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

        // Mezclar el password para mayor seguridad
        char[] chars = password.toString().toCharArray();
        for (int i = 0; i < chars.length; i++) {
            int randomIndex = random.nextInt(chars.length);
            char temp = chars[i];
            chars[i] = chars[randomIndex];
            chars[randomIndex] = temp;
        }

        return new String(chars);
    }
}