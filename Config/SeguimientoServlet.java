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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.google.gson.Gson;

/**
 * Servlet optimizado para gestión de seguimiento de documentos
 * Sistema de Gestión Documental - Constructora Vial S.A.
 * @version 2.0.0 - COMPLETAMENTE OPTIMIZADO
 * @description Manejo completo del seguimiento y flujo de documentos con mejoras de rendimiento
 */
@WebServlet("/SeguimientoServlet")
public class SeguimientoServlet extends HttpServlet {

    private static final String CONTENT_TYPE_JSON = "application/json";
    private static final String CHARSET_UTF8 = "UTF-8";
    private final Gson gson = new Gson();

    // Estados según la estructura real de la BD
    private static final String ESTADO_PENDIENTE = "Pendiente";
    private static final String ESTADO_APROBADO = "Aprobado";
    private static final String ESTADO_OBSERVADO = "Observado";
    private static final String ESTADO_RECHAZADO = "Rechazado";

    // Mapeo de estados frontend a BD
    private static final Map<String, String> MAPEO_ESTADOS_FRONTEND_BD = Map.of(
        "En Revision", ESTADO_PENDIENTE,
        "Completado", ESTADO_APROBADO,
        "Pendiente", ESTADO_PENDIENTE,
        "Aprobado", ESTADO_APROBADO,
        "Observado", ESTADO_OBSERVADO,
        "Rechazado", ESTADO_RECHAZADO
    );

    // Mapeo de estados BD a frontend
    private static final Map<String, String> MAPEO_ESTADOS_BD_FRONTEND = Map.of(
        ESTADO_PENDIENTE, "En Revision",
        ESTADO_APROBADO, "Completado",
        ESTADO_OBSERVADO, "Observado",
        ESTADO_RECHAZADO, "Rechazado"
    );

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
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setDateHeader("Expires", 0);

        String action = Optional.ofNullable(req.getParameter("action")).orElse("");

        // Verificar sesión
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            enviarError(res, "Sesión no válida", 401);
            return;
        }

        int usuarioId = (Integer) session.getAttribute("usuarioId");

        try (PrintWriter out = res.getWriter()) {
            Map<String, Object> resultado;

            switch (action) {
                case "obtenerEstadisticasSeguimiento":
                    resultado = obtenerEstadisticas(usuarioId);
                    break;
                case "obtenerProyectos":
                    resultado = obtenerProyectos(usuarioId);
                    break;
                case "obtenerResponsables":
                    resultado = obtenerResponsables(usuarioId);
                    break;
                case "obtenerTiposDocumento":
                    resultado = obtenerTiposDocumento();
                    break;
                case "obtenerDocumentosDisponibles":
                    resultado = obtenerDocumentosDisponibles(usuarioId);
                    break;
                case "obtenerSeguimientos":
                    resultado = obtenerSeguimientos(req, usuarioId);
                    break;
                case "obtenerDetalleSeguimiento":
                    resultado = obtenerDetalleSeguimiento(req, usuarioId);
                    break;
                case "obtenerTimelineSeguimiento":
                    resultado = obtenerTimelineSeguimiento(req, usuarioId);
                    break;
                case "agregarSeguimiento":
                    resultado = agregarSeguimiento(req, usuarioId);
                    break;
                case "actualizarEstadoSeguimiento":
                    resultado = actualizarEstadoSeguimiento(req, usuarioId);
                    break;
                case "exportarSeguimiento":
                    exportarSeguimiento(req, res, usuarioId);
                    return;
                case "generarResumenEjecutivo":
                    resultado = generarResumenEjecutivo(req, usuarioId);
                    break;
                default:
                    resultado = Map.of(
                        "success", false,
                        "message", "Acción no reconocida: " + action
                    );
            }

            out.write(gson.toJson(resultado));

        } catch (Exception e) {
            System.err.println("❌ Error en SeguimientoServlet: " + e.getMessage());
            e.printStackTrace();
            enviarError(res, "Error interno del servidor: " + e.getMessage(), 500);
        }
    }

    // ==================== MÉTODOS PRINCIPALES OPTIMIZADOS ====================

    /**
     * Obtener estadísticas optimizadas del dashboard de seguimiento
     */
    private Map<String, Object> obtenerEstadisticas(int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        try (Connection conn = Conexion.getConnection()) {
            // Verificar si hay seguimientos
            String checkSql = "SELECT COUNT(*) as total FROM seguimiento_flujo";
            int totalSeguimientos = 0;

            try (PreparedStatement checkPs = conn.prepareStatement(checkSql);
                 ResultSet rs = checkPs.executeQuery()) {
                if (rs.next()) {
                    totalSeguimientos = rs.getInt("total");
                }
            }

            if (totalSeguimientos == 0) {
                // Si no hay seguimientos, devolver estadísticas en cero
                Map<String, Object> estadisticas = new HashMap<>();
                estadisticas.put("enProceso", 0);
                estadisticas.put("completados", 0);
                estadisticas.put("pendientes", 0);
                estadisticas.put("retrasados", 0);

                resultado.put("success", true);
                resultado.put("estadisticas", estadisticas);

                System.out.println("📊 Estadísticas: tabla seguimiento_flujo vacía");
                return resultado;
            }

            // Consulta optimizada para estadísticas
            String sql = """
                SELECT 
                    COUNT(CASE WHEN sf.estado IN (?, ?) THEN 1 END) as enProceso,
                    COUNT(CASE WHEN sf.estado = ? THEN 1 END) as completados,
                    COUNT(CASE WHEN sf.estado = ? THEN 1 END) as pendientes,
                    COUNT(CASE 
                        WHEN sf.estado NOT IN (?, ?) 
                        AND d.fecha_vencimiento IS NOT NULL 
                        AND d.fecha_vencimiento < CURDATE() 
                        THEN 1 
                    END) as retrasados,
                    COUNT(*) as total
                FROM seguimiento_flujo sf
                INNER JOIN documentos d ON sf.documento_id = d.id_documentos
                WHERE d.activo = 1
            """;

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, ESTADO_PENDIENTE);
                ps.setString(2, ESTADO_OBSERVADO);
                ps.setString(3, ESTADO_APROBADO);
                ps.setString(4, ESTADO_PENDIENTE);
                ps.setString(5, ESTADO_APROBADO);
                ps.setString(6, ESTADO_RECHAZADO);

                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        Map<String, Object> estadisticas = new HashMap<>();
                        estadisticas.put("enProceso", rs.getInt("enProceso"));
                        estadisticas.put("completados", rs.getInt("completados"));
                        estadisticas.put("pendientes", rs.getInt("pendientes"));
                        estadisticas.put("retrasados", rs.getInt("retrasados"));
                        estadisticas.put("total", rs.getInt("total"));

                        resultado.put("success", true);
                        resultado.put("estadisticas", estadisticas);

                        System.out.println("📊 Estadísticas calculadas correctamente");
                    }
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener estadísticas: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Obtener lista optimizada de proyectos
     */
    private Map<String, Object> obtenerProyectos(int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> proyectos = new ArrayList<>();

        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT p.id_proyectos as id, p.nombre, p.codigo, p.cliente, p.descripcion,
                       p.fecha_inicio, p.fecha_fin, p.estado as estado_proyecto,
                       COUNT(d.id_documentos) as total_documentos
                FROM proyectos p
                LEFT JOIN documentos d ON p.id_proyectos = d.proyecto_id AND d.activo = 1
                WHERE p.activo = 1
                GROUP BY p.id_proyectos, p.nombre, p.codigo, p.cliente, p.descripcion,
                         p.fecha_inicio, p.fecha_fin, p.estado
                ORDER BY p.nombre
                LIMIT 200
            """;

            try (PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    Map<String, Object> proyecto = new HashMap<>();
                    proyecto.put("id", rs.getInt("id"));
                    proyecto.put("nombre", rs.getString("nombre"));
                    proyecto.put("codigo", rs.getString("codigo"));
                    proyecto.put("cliente", rs.getString("cliente"));
                    proyecto.put("descripcion", rs.getString("descripcion"));
                    proyecto.put("fechaInicio", rs.getDate("fecha_inicio"));
                    proyecto.put("fechaFinEstimada", rs.getDate("fecha_fin"));
                    proyecto.put("estadoProyecto", rs.getString("estado_proyecto"));
                    proyecto.put("totalDocumentos", rs.getInt("total_documentos"));
                    proyectos.add(proyecto);
                }
            }

            resultado.put("success", true);
            resultado.put("proyectos", proyectos);
            System.out.println("📋 " + proyectos.size() + " proyectos obtenidos");

        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener proyectos: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Obtener lista optimizada de responsables
     */
    private Map<String, Object> obtenerResponsables(int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> responsables = new ArrayList<>();

        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT u.id_usuarios as id, u.correo, 
                       COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo) as nombre,
                       pu.cargo, pu.telefono, d.nombre as dependencia_nombre,
                       CASE 
                           WHEN pu.nombres IS NOT NULL THEN 1
                           ELSE 0
                       END as perfil_completo
                FROM usuarios u
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                LEFT JOIN dependencias d ON pu.dependencia_id = d.id_dependencias
                WHERE u.activo = 1
                ORDER BY perfil_completo DESC, 
                         COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo)
                LIMIT 100
            """;

            try (PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    Map<String, Object> responsable = new HashMap<>();
                    responsable.put("id", rs.getInt("id"));
                    responsable.put("nombre", rs.getString("nombre"));
                    responsable.put("email", rs.getString("correo"));
                    responsable.put("cargo", rs.getString("cargo"));
                    responsable.put("telefono", rs.getString("telefono"));
                    responsable.put("dependencia", rs.getString("dependencia_nombre"));
                    responsable.put("perfilCompleto", rs.getBoolean("perfil_completo"));
                    responsables.add(responsable);
                }
            }

            resultado.put("success", true);
            resultado.put("responsables", responsables);
            System.out.println("👥 " + responsables.size() + " responsables obtenidos");

        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener responsables: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Obtener tipos de documento optimizado
     */
    private Map<String, Object> obtenerTiposDocumento() {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> tipos = new ArrayList<>();

        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT id_tipos_documento as id, nombre, descripcion, categoria,
                       COUNT(d.id_documentos) as total_documentos
                FROM tipos_documento td
                LEFT JOIN documentos d ON td.id_tipos_documento = d.tipo_documento_id AND d.activo = 1
                WHERE td.activo = 1
                GROUP BY id_tipos_documento, nombre, descripcion, categoria
                ORDER BY total_documentos DESC, nombre
                LIMIT 50
            """;

            try (PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    Map<String, Object> tipo = new HashMap<>();
                    tipo.put("id", rs.getInt("id"));
                    tipo.put("nombre", rs.getString("nombre"));
                    tipo.put("descripcion", rs.getString("descripcion"));
                    tipo.put("categoria", rs.getString("categoria"));
                    tipo.put("totalDocumentos", rs.getInt("total_documentos"));
                    tipos.add(tipo);
                }
            }

            resultado.put("success", true);
            resultado.put("tipos", tipos);
            System.out.println("📄 " + tipos.size() + " tipos de documento obtenidos");

        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener tipos de documento: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Obtener documentos disponibles optimizado para seguimiento
     */
    private Map<String, Object> obtenerDocumentosDisponibles(int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> documentos = new ArrayList<>();

        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT d.id_documentos as id, d.codigo, d.titulo, d.numero_documento,
                       td.nombre as tipo, p.nombre as proyecto, d.estado, 
                       COALESCE(d.prioridad, 'Media') as prioridad,
                       d.fecha_creacion, d.fecha_vencimiento,
                       CASE 
                           WHEN sf.id_seguimiento_flujo IS NOT NULL THEN 1
                           ELSE 0
                       END as en_seguimiento
                FROM documentos d
                INNER JOIN tipos_documento td ON d.tipo_documento_id = td.id_tipos_documento
                LEFT JOIN proyectos p ON d.proyecto_id = p.id_proyectos
                LEFT JOIN seguimiento_flujo sf ON d.id_documentos = sf.documento_id 
                    AND sf.estado NOT IN (?, ?)
                WHERE d.activo = 1
                    AND d.estado NOT IN ('Firmado', 'Archivado', 'Eliminado')
                ORDER BY en_seguimiento ASC, d.fecha_creacion DESC
                LIMIT 300
            """;

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, ESTADO_APROBADO);
                ps.setString(2, ESTADO_RECHAZADO);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> documento = new HashMap<>();
                        documento.put("id", rs.getInt("id"));
                        documento.put("codigo", rs.getString("codigo"));
                        documento.put("titulo", rs.getString("titulo"));
                        documento.put("numeroDocumento", rs.getString("numero_documento"));
                        documento.put("tipo", rs.getString("tipo"));
                        documento.put("proyecto", rs.getString("proyecto"));
                        documento.put("estado", rs.getString("estado"));
                        documento.put("prioridad", rs.getString("prioridad"));
                        documento.put("fechaCreacion", rs.getTimestamp("fecha_creacion"));
                        documento.put("fechaVencimiento", rs.getDate("fecha_vencimiento"));
                        documento.put("enSeguimiento", rs.getBoolean("en_seguimiento"));
                        documentos.add(documento);
                    }
                }
            }

            resultado.put("success", true);
            resultado.put("documentos", documentos);
            System.out.println("📄 " + documentos.size() + " documentos disponibles para seguimiento");

        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener documentos: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Obtener lista optimizada y paginada de seguimientos
     */
    private Map<String, Object> obtenerSeguimientos(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> seguimientos = new ArrayList<>();

        // Parámetros de paginación
        int page = Integer.parseInt(Optional.ofNullable(req.getParameter("page")).orElse("1"));
        int size = Integer.parseInt(Optional.ofNullable(req.getParameter("size")).orElse("15"));
        int offset = (page - 1) * size;

        // Filtros
        String estado = req.getParameter("estado");
        String tipoDocumento = req.getParameter("tipoDocumento");
        String proyecto = req.getParameter("proyecto");
        String responsable = req.getParameter("responsable");
        String prioridad = req.getParameter("prioridad");
        String fechaInicio = req.getParameter("fechaInicio");
        String fechaFin = req.getParameter("fechaFin");
        String busqueda = req.getParameter("busqueda");

        try (Connection conn = Conexion.getConnection()) {
            StringBuilder sqlBuilder = new StringBuilder("""
                SELECT sf.id_seguimiento_flujo as id, 
                       d.codigo as codigoDocumento,
                       d.titulo as tituloDocumento,
                       d.numero_documento,
                       td.nombre as tipoDocumento,
                       p.nombre as proyectoNombre,
                       p.codigo as proyectoCodigo,
                       sf.estado,
                       COALESCE(d.prioridad, 'Media') as prioridad,
                       sf.fecha_inicio,
                       sf.fecha_fin,
                       d.fecha_vencimiento as fechaLimite,
                       sf.observaciones,
                       GREATEST(sf.fecha_inicio, COALESCE(sf.fecha_fin, sf.fecha_inicio)) as ultimaActualizacion,
                       COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo) as responsableNombre,
                       u.correo as responsableEmail,
                       CASE 
                           WHEN d.fecha_vencimiento IS NOT NULL AND d.fecha_vencimiento < CURDATE() 
                           AND sf.estado NOT IN (?, ?) 
                           THEN 1 ELSE 0 
                       END as retrasado
                FROM seguimiento_flujo sf
                INNER JOIN documentos d ON sf.documento_id = d.id_documentos
                INNER JOIN tipos_documento td ON d.tipo_documento_id = td.id_tipos_documento
                LEFT JOIN proyectos p ON d.proyecto_id = p.id_proyectos
                LEFT JOIN usuarios u ON sf.usuario_id = u.id_usuarios
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                WHERE d.activo = 1
            """);

            List<Object> params = new ArrayList<>();
            params.add(ESTADO_APROBADO);
            params.add(ESTADO_RECHAZADO);

            // Aplicar filtros
            if (estado != null && !estado.trim().isEmpty()) {
                String estadoBD = MAPEO_ESTADOS_FRONTEND_BD.getOrDefault(estado, estado);
                sqlBuilder.append(" AND sf.estado = ?");
                params.add(estadoBD);
            }

            if (tipoDocumento != null && !tipoDocumento.trim().isEmpty()) {
                sqlBuilder.append(" AND td.nombre = ?");
                params.add(tipoDocumento);
            }

            if (proyecto != null && !proyecto.trim().isEmpty()) {
                sqlBuilder.append(" AND p.id_proyectos = ?");
                params.add(Integer.parseInt(proyecto));
            }

            if (responsable != null && !responsable.trim().isEmpty()) {
                sqlBuilder.append(" AND sf.usuario_id = ?");
                params.add(Integer.parseInt(responsable));
            }

            if (prioridad != null && !prioridad.trim().isEmpty()) {
                sqlBuilder.append(" AND d.prioridad = ?");
                params.add(prioridad);
            }

            if (fechaInicio != null && !fechaInicio.trim().isEmpty()) {
                sqlBuilder.append(" AND DATE(sf.fecha_inicio) >= ?");
                params.add(fechaInicio);
            }

            if (fechaFin != null && !fechaFin.trim().isEmpty()) {
                sqlBuilder.append(" AND DATE(sf.fecha_inicio) <= ?");
                params.add(fechaFin);
            }

            if (busqueda != null && !busqueda.trim().isEmpty()) {
                sqlBuilder.append(" AND (d.codigo LIKE ? OR d.titulo LIKE ? OR d.numero_documento LIKE ?)");
                String searchPattern = "%" + busqueda.trim() + "%";
                params.add(searchPattern);
                params.add(searchPattern);
                params.add(searchPattern);
            }

            // Contar total
            String countSql = "SELECT COUNT(*) as total FROM (" + 
                sqlBuilder.toString().replaceFirst("SELECT sf\\.id_seguimiento_flujo.?FROM", "SELECT 1 FROM") + 
                ") as subquery";

            int total = 0;
            try (PreparedStatement countPs = conn.prepareStatement(countSql)) {
                for (int i = 0; i < params.size(); i++) {
                    countPs.setObject(i + 1, params.get(i));
                }
                try (ResultSet rs = countPs.executeQuery()) {
                    if (rs.next()) {
                        total = rs.getInt("total");
                    }
                }
            }

            if (total == 0) {
                resultado.put("success", true);
                resultado.put("seguimientos", seguimientos);
                resultado.put("totalPages", 0);
                resultado.put("currentPage", page);
                resultado.put("totalRecords", 0);

                System.out.println("📋 No hay seguimientos que coincidan con los filtros");
                return resultado;
            }

            // Obtener datos paginados
            sqlBuilder.append(" ORDER BY sf.fecha_inicio DESC, d.prioridad = 'Urgente' DESC, d.prioridad = 'Alta' DESC");
            sqlBuilder.append(" LIMIT ? OFFSET ?");
            params.add(size);
            params.add(offset);

            try (PreparedStatement ps = conn.prepareStatement(sqlBuilder.toString())) {
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(i + 1, params.get(i));
                }

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> seguimiento = new HashMap<>();
                        seguimiento.put("id", rs.getInt("id"));
                        seguimiento.put("codigoDocumento", rs.getString("codigoDocumento"));
                        seguimiento.put("tituloDocumento", rs.getString("tituloDocumento"));
                        seguimiento.put("numeroDocumento", rs.getString("numero_documento"));
                        seguimiento.put("tipoDocumento", rs.getString("tipoDocumento"));
                        seguimiento.put("proyectoNombre", rs.getString("proyectoNombre"));
                        seguimiento.put("proyectoCodigo", rs.getString("proyectoCodigo"));

                        // Mapear estado BD a frontend
                        String estadoBD = rs.getString("estado");
                        String estadoFrontend = MAPEO_ESTADOS_BD_FRONTEND.getOrDefault(estadoBD, estadoBD);
                        seguimiento.put("estado", estadoFrontend);

                        seguimiento.put("prioridad", rs.getString("prioridad"));
                        seguimiento.put("fechaInicio", rs.getTimestamp("fecha_inicio"));
                        seguimiento.put("fechaFin", rs.getTimestamp("fecha_fin"));
                        seguimiento.put("fechaLimite", rs.getDate("fechaLimite"));
                        seguimiento.put("observaciones", rs.getString("observaciones"));
                        seguimiento.put("ultimaActualizacion", rs.getTimestamp("ultimaActualizacion"));
                        seguimiento.put("responsableNombre", rs.getString("responsableNombre"));
                        seguimiento.put("responsableEmail", rs.getString("responsableEmail"));
                        seguimiento.put("retrasado", rs.getBoolean("retrasado"));
                        seguimientos.add(seguimiento);
                    }
                }
            }

            int totalPages = (int) Math.ceil((double) total / size);

            resultado.put("success", true);
            resultado.put("seguimientos", seguimientos);
            resultado.put("totalPages", totalPages);
            resultado.put("currentPage", page);
            resultado.put("totalRecords", total);

            System.out.println("📋 Seguimientos obtenidos: " + seguimientos.size() + " de " + total + " total");

        } catch (SQLException | NumberFormatException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener seguimientos: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Obtener detalle optimizado de un seguimiento específico
     */
    private Map<String, Object> obtenerDetalleSeguimiento(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "ID de seguimiento requerido");
            return resultado;
        }

        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT sf.id_seguimiento_flujo as id,
                       d.codigo as codigoDocumento,
                       d.titulo as tituloDocumento,
                       d.numero_documento,
                       td.nombre as tipoDocumento,
                       p.nombre as proyectoNombre,
                       sf.estado,
                       COALESCE(d.prioridad, 'Media') as prioridad,
                       sf.fecha_inicio,
                       sf.fecha_fin,
                       d.fecha_vencimiento as fechaLimite,
                       sf.observaciones,
                       GREATEST(sf.fecha_inicio, COALESCE(sf.fecha_fin, sf.fecha_inicio)) as ultimaActualizacion,
                       COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo) as responsableNombre,
                       u.correo as responsableEmail,
                       CASE 
                           WHEN d.fecha_vencimiento IS NOT NULL AND d.fecha_vencimiento < CURDATE() 
                           AND sf.estado NOT IN (?, ?) 
                           THEN 1 ELSE 0 
                       END as retrasado,
                       -- Información adicional del documento
                       d.descripcion_documento,
                       d.confidencial,
                       d.version,
                       d.fecha_creacion as fechaCreacionDocumento
                FROM seguimiento_flujo sf
                INNER JOIN documentos d ON sf.documento_id = d.id_documentos
                INNER JOIN tipos_documento td ON d.tipo_documento_id = td.id_tipos_documento
                LEFT JOIN proyectos p ON d.proyecto_id = p.id_proyectos
                LEFT JOIN usuarios u ON sf.usuario_id = u.id_usuarios
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                WHERE sf.id_seguimiento_flujo = ?
                    AND d.activo = 1
            """;

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, ESTADO_APROBADO);
                ps.setString(2, ESTADO_RECHAZADO);
                ps.setInt(3, Integer.parseInt(idParam));

                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        Map<String, Object> seguimiento = new HashMap<>();
                        seguimiento.put("id", rs.getInt("id"));
                        seguimiento.put("codigoDocumento", rs.getString("codigoDocumento"));
                        seguimiento.put("tituloDocumento", rs.getString("tituloDocumento"));
                        seguimiento.put("numeroDocumento", rs.getString("numero_documento"));
                        seguimiento.put("tipoDocumento", rs.getString("tipoDocumento"));
                        seguimiento.put("proyectoNombre", rs.getString("proyectoNombre"));

                        // Mapear estado BD a frontend
                        String estadoBD = rs.getString("estado");
                        String estadoFrontend = MAPEO_ESTADOS_BD_FRONTEND.getOrDefault(estadoBD, estadoBD);
                        seguimiento.put("estado", estadoFrontend);

                        seguimiento.put("prioridad", rs.getString("prioridad"));
                        seguimiento.put("fechaInicio", rs.getTimestamp("fecha_inicio"));
                        seguimiento.put("fechaFin", rs.getTimestamp("fecha_fin"));
                        seguimiento.put("fechaLimite", rs.getDate("fechaLimite"));
                        seguimiento.put("observaciones", rs.getString("observaciones"));
                        seguimiento.put("ultimaActualizacion", rs.getTimestamp("ultimaActualizacion"));
                        seguimiento.put("responsableNombre", rs.getString("responsableNombre"));
                        seguimiento.put("responsableEmail", rs.getString("responsableEmail"));
                        seguimiento.put("retrasado", rs.getBoolean("retrasado"));

                        // Información adicional
                        seguimiento.put("descripcionDocumento", rs.getString("descripcion_documento"));
                        seguimiento.put("confidencial", rs.getBoolean("confidencial"));
                        seguimiento.put("version", rs.getString("version"));
                        seguimiento.put("fechaCreacionDocumento", rs.getTimestamp("fechaCreacionDocumento"));

                        resultado.put("success", true);
                        resultado.put("seguimiento", seguimiento);
                    } else {
                        resultado.put("success", false);
                        resultado.put("message", "Seguimiento no encontrado");
                    }
                }
            }

        } catch (SQLException | NumberFormatException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener detalle: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Obtener timeline optimizado de un seguimiento
     */
    private Map<String, Object> obtenerTimelineSeguimiento(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> timeline = new ArrayList<>();

        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            resultado.put("success", false);
            resultado.put("message", "ID de seguimiento requerido");
            return resultado;
        }

        try (Connection conn = Conexion.getConnection()) {
            // Obtener documento_id del seguimiento
            String getDocSql = "SELECT documento_id FROM seguimiento_flujo WHERE id_seguimiento_flujo = ?";
            int documentoId = -1;

            try (PreparedStatement getDocPs = conn.prepareStatement(getDocSql)) {
                getDocPs.setInt(1, Integer.parseInt(idParam));
                try (ResultSet rs = getDocPs.executeQuery()) {
                    if (rs.next()) {
                        documentoId = rs.getInt("documento_id");
                    } else {
                        resultado.put("success", false);
                        resultado.put("message", "Seguimiento no encontrado");
                        return resultado;
                    }
                }
            }

            // Obtener timeline del seguimiento y comentarios
            String timelineSql = """
                SELECT 
                    'seguimiento_creado' as tipo_evento,
                    'Seguimiento iniciado' as titulo,
                    sf.fecha_inicio as fecha,
                    CONCAT('Estado inicial: ', sf.estado) as descripcion,
                    sf.observaciones as comentario,
                    COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo, 'Sistema') as usuarioNombre,
                    sf.estado as estado_nuevo,
                    '' as estado_anterior
                FROM seguimiento_flujo sf
                LEFT JOIN usuarios u ON sf.usuario_id = u.id_usuarios
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                WHERE sf.documento_id = ?

                UNION ALL

                SELECT 
                    'comentario' as tipo_evento,
                    'Comentario agregado' as titulo,
                    c.fecha_comentario as fecha,
                    c.comentario as descripcion,
                    c.comentario as comentario,
                    COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo, 'Usuario') as usuarioNombre,
                    '' as estado_nuevo,
                    '' as estado_anterior
                FROM comentarios_documento c
                LEFT JOIN usuarios u ON c.usuario_id = u.id_usuarios
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                WHERE c.documento_id = ? AND c.privado = 0

                UNION ALL

                SELECT 
                    'documento_actualizado' as tipo_evento,
                    'Documento actualizado' as titulo,
                    d.fecha_ultima_modificacion as fecha,
                    CONCAT('Versión actualizada: ', COALESCE(d.version, '1.0')) as descripcion,
                    '' as comentario,
                    COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo, 'Sistema') as usuarioNombre,
                    d.estado as estado_nuevo,
                    '' as estado_anterior
                FROM documentos d
                LEFT JOIN usuarios u ON d.usuario_emisor_id = u.id_usuarios
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                WHERE d.id_documentos = ? AND d.fecha_ultima_modificacion IS NOT NULL

                ORDER BY fecha DESC
                LIMIT 50
            """;

            try (PreparedStatement ps = conn.prepareStatement(timelineSql)) {
                ps.setInt(1, documentoId);
                ps.setInt(2, documentoId);
                ps.setInt(3, documentoId);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> evento = new HashMap<>();
                        evento.put("titulo", rs.getString("titulo"));
                        evento.put("descripcion", rs.getString("descripcion"));
                        evento.put("comentario", rs.getString("comentario"));
                        evento.put("fecha", rs.getTimestamp("fecha"));
                        evento.put("usuarioNombre", rs.getString("usuarioNombre"));
                        evento.put("tipoEvento", rs.getString("tipo_evento"));
                        evento.put("estadoAnterior", rs.getString("estado_anterior"));
                        evento.put("estadoNuevo", rs.getString("estado_nuevo"));
                        timeline.add(evento);
                    }
                }
            }

            resultado.put("success", true);
            resultado.put("timeline", timeline);
            System.out.println("📅 Timeline obtenido: " + timeline.size() + " eventos");

        } catch (SQLException | NumberFormatException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al obtener timeline: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Agregar nuevo seguimiento optimizado
     */
    private Map<String, Object> agregarSeguimiento(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        String documentoId = req.getParameter("documentoId");
        String responsableId = req.getParameter("responsableId");
        String prioridad = req.getParameter("prioridad");
        String fechaLimite = req.getParameter("fechaLimite");
        String observaciones = req.getParameter("observaciones");

        // Validaciones
        if (documentoId == null || responsableId == null) {
            resultado.put("success", false);
            resultado.put("message", "Documento y responsable son requeridos");
            return resultado;
        }

        try (Connection conn = Conexion.getConnection()) {
            conn.setAutoCommit(false);

            try {
                // Verificar que el documento existe y está disponible
                String checkSql = """
                    SELECT d.id_documentos, d.estado, d.titulo,
                           CASE WHEN sf.id_seguimiento_flujo IS NOT NULL THEN 1 ELSE 0 END as en_seguimiento
                    FROM documentos d
                    LEFT JOIN seguimiento_flujo sf ON d.id_documentos = sf.documento_id 
                        AND sf.estado NOT IN (?, ?)
                    WHERE d.id_documentos = ? AND d.activo = 1
                """;

                boolean documentoValido = false;
                boolean yaEnSeguimiento = false;

                try (PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
                    checkPs.setString(1, ESTADO_APROBADO);
                    checkPs.setString(2, ESTADO_RECHAZADO);
                    checkPs.setInt(3, Integer.parseInt(documentoId));

                    try (ResultSet rs = checkPs.executeQuery()) {
                        if (rs.next()) {
                            documentoValido = true;
                            yaEnSeguimiento = rs.getBoolean("en_seguimiento");
                        }
                    }
                }

                if (!documentoValido) {
                    resultado.put("success", false);
                    resultado.put("message", "Documento no encontrado o no disponible");
                    conn.rollback();
                    return resultado;
                }

                if (yaEnSeguimiento) {
                    resultado.put("success", false);
                    resultado.put("message", "Ya existe un seguimiento activo para este documento");
                    conn.rollback();
                    return resultado;
                }

                // Obtener una etapa por defecto
                int etapaId = obtenerEtapaPorDefecto(conn);

                // Insertar seguimiento
                String insertSql = """
                    INSERT INTO seguimiento_flujo 
                    (documento_id, etapa_id, usuario_id, estado, fecha_inicio, observaciones) 
                    VALUES (?, ?, ?, ?, NOW(), ?)
                """;

                int seguimientoId = -1;
                try (PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, Integer.parseInt(documentoId));
                    ps.setInt(2, etapaId);
                    ps.setInt(3, Integer.parseInt(responsableId));
                    ps.setString(4, ESTADO_PENDIENTE);
                    ps.setString(5, observaciones);

                    int affectedRows = ps.executeUpdate();
                    if (affectedRows > 0) {
                        try (ResultSet keys = ps.getGeneratedKeys()) {
                            if (keys.next()) {
                                seguimientoId = keys.getInt(1);
                            }
                        }
                    }
                }

                // Actualizar prioridad del documento si se especificó
                if (prioridad != null && !prioridad.trim().isEmpty()) {
                    String updateDocSql = "UPDATE documentos SET prioridad = ? WHERE id_documentos = ?";
                    try (PreparedStatement updatePs = conn.prepareStatement(updateDocSql)) {
                        updatePs.setString(1, prioridad);
                        updatePs.setInt(2, Integer.parseInt(documentoId));
                        updatePs.executeUpdate();
                    }
                }

                // Actualizar fecha límite si se especificó
                if (fechaLimite != null && !fechaLimite.trim().isEmpty()) {
                    String updateFechaSql = "UPDATE documentos SET fecha_vencimiento = ? WHERE id_documentos = ?";
                    try (PreparedStatement updatePs = conn.prepareStatement(updateFechaSql)) {
                        updatePs.setDate(1, java.sql.Date.valueOf(fechaLimite));
                        updatePs.setInt(2, Integer.parseInt(documentoId));
                        updatePs.executeUpdate();
                    }
                }

                conn.commit();

                resultado.put("success", true);
                resultado.put("seguimientoId", seguimientoId);
                resultado.put("message", "Seguimiento creado correctamente");

                System.out.println("✅ Seguimiento creado: ID " + seguimientoId + " para documento " + documentoId);

            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (SQLException | NumberFormatException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al crear seguimiento: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Actualizar estado optimizado de un seguimiento
     */
    private Map<String, Object> actualizarEstadoSeguimiento(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        String seguimientoId = req.getParameter("id");
        String nuevoEstado = req.getParameter("estado");
        String comentario = req.getParameter("comentario");

        // Validaciones
        if (seguimientoId == null || nuevoEstado == null) {
            resultado.put("success", false);
            resultado.put("message", "ID de seguimiento y estado son requeridos");
            return resultado;
        }

        // Mapear estado frontend a BD
        String estadoBD = MAPEO_ESTADOS_FRONTEND_BD.getOrDefault(nuevoEstado, nuevoEstado);

        try (Connection conn = Conexion.getConnection()) {
            conn.setAutoCommit(false);

            try {
                // Verificar existencia y obtener estado actual
                String checkSql = """
                    SELECT sf.estado, sf.documento_id
                    FROM seguimiento_flujo sf
                    INNER JOIN documentos d ON sf.documento_id = d.id_documentos
                    WHERE sf.id_seguimiento_flujo = ? AND d.activo = 1
                """;

                String estadoAnterior = null;
                int documentoId = -1;

                try (PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
                    checkPs.setInt(1, Integer.parseInt(seguimientoId));

                    try (ResultSet rs = checkPs.executeQuery()) {
                        if (rs.next()) {
                            estadoAnterior = rs.getString("estado");
                            documentoId = rs.getInt("documento_id");
                        } else {
                            resultado.put("success", false);
                            resultado.put("message", "Seguimiento no encontrado");
                            conn.rollback();
                            return resultado;
                        }
                    }
                }

                // Actualizar seguimiento
                String updateSql = """
                    UPDATE seguimiento_flujo 
                    SET estado = ?, 
                        fecha_fin = CASE WHEN ? IN (?, ?) THEN NOW() ELSE fecha_fin END,
                        observaciones = CASE 
                            WHEN ? IS NOT NULL AND ? != '' THEN
                                CONCAT(COALESCE(observaciones, ''), 
                                       CASE WHEN observaciones IS NOT NULL AND observaciones != '' 
                                            THEN '\n--- Actualización ---\n' ELSE '' END, 
                                       ?)
                            ELSE observaciones
                        END
                    WHERE id_seguimiento_flujo = ?
                """;

                try (PreparedStatement updatePs = conn.prepareStatement(updateSql)) {
                    updatePs.setString(1, estadoBD);
                    updatePs.setString(2, estadoBD);
                    updatePs.setString(3, ESTADO_APROBADO);
                    updatePs.setString(4, ESTADO_RECHAZADO);
                    updatePs.setString(5, comentario);
                    updatePs.setString(6, comentario);
                    updatePs.setString(7, comentario);
                    updatePs.setInt(8, Integer.parseInt(seguimientoId));

                    int rowsUpdated = updatePs.executeUpdate();
                    if (rowsUpdated == 0) {
                        resultado.put("success", false);
                        resultado.put("message", "No se pudo actualizar el seguimiento");
                        conn.rollback();
                        return resultado;
                    }
                }

                // Actualizar estado del documento si es necesario
                if (ESTADO_APROBADO.equals(estadoBD)) {
                    String updateDocSql = "UPDATE documentos SET estado = 'Firmado' WHERE id_documentos = ?";
                    try (PreparedStatement updateDocPs = conn.prepareStatement(updateDocSql)) {
                        updateDocPs.setInt(1, documentoId);
                        updateDocPs.executeUpdate();
                    }
                }

                // Registrar en comentarios si hay comentario
                if (comentario != null && !comentario.trim().isEmpty()) {
                    String insertComentarioSql = """
                        INSERT INTO comentarios_documento 
                        (documento_id, usuario_id, comentario, fecha_comentario, privado)
                        VALUES (?, ?, ?, NOW(), 0)
                    """;

                    try (PreparedStatement comentarioPs = conn.prepareStatement(insertComentarioSql)) {
                        comentarioPs.setInt(1, documentoId);
                        comentarioPs.setInt(2, usuarioId);
                        comentarioPs.setString(3, "Actualización de seguimiento: " + comentario);
                        comentarioPs.executeUpdate();
                    }
                }

                conn.commit();

                resultado.put("success", true);
                resultado.put("message", "Estado actualizado correctamente");
                resultado.put("estadoAnterior", estadoAnterior);
                resultado.put("estadoNuevo", estadoBD);

                System.out.println("✅ Estado actualizado en seguimiento " + seguimientoId + ": " + estadoAnterior + " → " + estadoBD);

            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (SQLException | NumberFormatException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al actualizar estado: " + e.getMessage());
        }

        return resultado;
    }

    /**
     * Exportar reporte optimizado de seguimiento
     */
    private void exportarSeguimiento(HttpServletRequest req, HttpServletResponse res, int usuarioId) 
            throws IOException {

        res.setContentType("application/vnd.ms-excel; charset=UTF-8");
        res.setCharacterEncoding("UTF-8");
        res.setHeader("Content-Disposition", "attachment; filename=seguimientodocumentos" + 
                     LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm")) + ".xls");

        try (PrintWriter out = res.getWriter()) {
            // Header Excel con codificación UTF-8
            out.println("Codigo\tTitulo\tProyecto\tResponsable\tEstado\tPrioridad\tFecha Inicio\tFecha Limite\tObservaciones\tÚltima Actualización");

            // Crear request wrapper para obtener todos los datos
            Map<String, String> parametros = new HashMap<>();
            parametros.put("page", "1");
            parametros.put("size", "10000");

            // Copiar filtros del request original
            String[] filtros = {"estado", "tipoDocumento", "proyecto", "responsable", "prioridad", "fechaInicio", "fechaFin", "busqueda"};
            for (String filtro : filtros) {
                String valor = req.getParameter(filtro);
                if (valor != null && !valor.trim().isEmpty()) {
                    parametros.put(filtro, valor);
                }
            }

            HttpServletRequestWrapper reqWrapper = new HttpServletRequestWrapper(req, parametros);
            Map<String, Object> seguimientos = obtenerSeguimientos(reqWrapper, usuarioId);

            if ((Boolean) seguimientos.get("success")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> lista = (List<Map<String, Object>>) seguimientos.get("seguimientos");

                for (Map<String, Object> seg : lista) {
                    out.printf("%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s%n",
                        escapeCsv(seg.get("codigoDocumento")),
                        escapeCsv(seg.get("tituloDocumento")),
                        escapeCsv(seg.get("proyectoNombre")),
                        escapeCsv(seg.get("responsableNombre")),
                        escapeCsv(seg.get("estado")),
                        escapeCsv(seg.get("prioridad")),
                        seg.get("fechaInicio"),
                        seg.get("fechaLimite"),
                        escapeCsv(seg.get("observaciones")),
                        seg.get("ultimaActualizacion")
                    );
                }
            }

            System.out.println("📊 Reporte de seguimiento exportado para usuario " + usuarioId);

        } catch (Exception e) {
            e.printStackTrace();
            res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Generar resumen ejecutivo optimizado
     */
    private Map<String, Object> generarResumenEjecutivo(HttpServletRequest req, int usuarioId) {
        Map<String, Object> resultado = new HashMap<>();

        try (Connection conn = Conexion.getConnection()) {
            Map<String, Object> resumen = new HashMap<>();

            // Estadísticas generales
            Map<String, Object> estadisticas = obtenerEstadisticas(usuarioId);
            if ((Boolean) estadisticas.get("success")) {
                resumen.put("estadisticas", estadisticas.get("estadisticas"));
            }

            // Top documentos con más retraso
            String retrasadosSql = """
                SELECT d.codigo, d.titulo, p.nombre as proyecto,
                       DATEDIFF(CURDATE(), d.fecha_vencimiento) as dias_retraso,
                       sf.estado, sf.fecha_inicio,
                       COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo) as responsable,
                       d.prioridad
                FROM seguimiento_flujo sf
                INNER JOIN documentos d ON sf.documento_id = d.id_documentos
                LEFT JOIN proyectos p ON d.proyecto_id = p.id_proyectos
                LEFT JOIN usuarios u ON sf.usuario_id = u.id_usuarios
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                WHERE d.fecha_vencimiento < CURDATE() 
                    AND sf.estado NOT IN (?, ?)
                    AND d.activo = 1
                ORDER BY dias_retraso DESC, d.prioridad = 'Urgente' DESC, d.prioridad = 'Alta' DESC
                LIMIT 15
            """;

            List<Map<String, Object>> documentosRetrasados = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(retrasadosSql)) {
                ps.setString(1, ESTADO_APROBADO);
                ps.setString(2, ESTADO_RECHAZADO);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> doc = new HashMap<>();
                        doc.put("codigo", rs.getString("codigo"));
                        doc.put("titulo", rs.getString("titulo"));
                        doc.put("proyecto", rs.getString("proyecto"));
                        doc.put("diasRetraso", rs.getInt("dias_retraso"));

                        // Mapear estado BD a frontend
                        String estadoBD = rs.getString("estado");
                        String estadoFrontend = MAPEO_ESTADOS_BD_FRONTEND.getOrDefault(estadoBD, estadoBD);
                        doc.put("estado", estadoFrontend);

                        doc.put("responsable", rs.getString("responsable"));
                        doc.put("fechaInicio", rs.getTimestamp("fecha_inicio"));
                        doc.put("prioridad", rs.getString("prioridad"));
                        documentosRetrasados.add(doc);
                    }
                }
            }

            // Estadísticas por proyecto
            String proyectosSql = """
                SELECT p.nombre as proyecto,
                       COUNT(sf.id_seguimiento_flujo) as total_seguimientos,
                       COUNT(CASE WHEN sf.estado = ? THEN 1 END) as pendientes,
                       COUNT(CASE WHEN sf.estado = ? THEN 1 END) as completados,
                       COUNT(CASE WHEN d.fecha_vencimiento < CURDATE() AND sf.estado NOT IN (?, ?) THEN 1 END) as retrasados,
                       AVG(CASE WHEN sf.estado = ? THEN DATEDIFF(sf.fecha_fin, sf.fecha_inicio) END) as promedio_dias_completados
                FROM proyectos p
                INNER JOIN documentos d ON p.id_proyectos = d.proyecto_id
                INNER JOIN seguimiento_flujo sf ON d.id_documentos = sf.documento_id
                WHERE p.activo = 1 AND d.activo = 1
                GROUP BY p.id_proyectos, p.nombre
                HAVING total_seguimientos > 0
                ORDER BY total_seguimientos DESC, retrasados DESC
                LIMIT 10
            """;

            List<Map<String, Object>> estadisticasProyectos = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(proyectosSql)) {
                ps.setString(1, ESTADO_PENDIENTE);
                ps.setString(2, ESTADO_APROBADO);
                ps.setString(3, ESTADO_APROBADO);
                ps.setString(4, ESTADO_RECHAZADO);
                ps.setString(5, ESTADO_APROBADO);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> proyecto = new HashMap<>();
                        proyecto.put("proyecto", rs.getString("proyecto"));
                        proyecto.put("totalSeguimientos", rs.getInt("total_seguimientos"));
                        proyecto.put("pendientes", rs.getInt("pendientes"));
                        proyecto.put("completados", rs.getInt("completados"));
                        proyecto.put("retrasados", rs.getInt("retrasados"));
                        proyecto.put("promedioDiasCompletados", rs.getDouble("promedio_dias_completados"));

                        // Calcular eficiencia
                        double total = rs.getInt("total_seguimientos");
                        double completados = rs.getInt("completados");
                        double eficiencia = total > 0 ? (completados / total) * 100 : 0;
                        proyecto.put("eficiencia", Math.round(eficiencia * 100.0) / 100.0);

                        estadisticasProyectos.add(proyecto);
                    }
                }
            }

            // Estadísticas por responsable
            String responsablesSql = """
                SELECT COALESCE(CONCAT(pu.nombres, ' ', pu.apellidos), u.correo) as responsable,
                       COUNT(sf.id_seguimiento_flujo) as total_asignados,
                       COUNT(CASE WHEN sf.estado = ? THEN 1 END) as completados,
                       COUNT(CASE WHEN d.fecha_vencimiento < CURDATE() AND sf.estado NOT IN (?, ?) THEN 1 END) as retrasados
                FROM seguimiento_flujo sf
                INNER JOIN documentos d ON sf.documento_id = d.id_documentos
                LEFT JOIN usuarios u ON sf.usuario_id = u.id_usuarios
                LEFT JOIN perfiles_usuarios pu ON u.id_usuarios = pu.usuario_id
                WHERE d.activo = 1
                GROUP BY sf.usuario_id, responsable
                HAVING total_asignados > 0
                ORDER BY total_asignados DESC
                LIMIT 10
            """;

            List<Map<String, Object>> estadisticasResponsables = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(responsablesSql)) {
                ps.setString(1, ESTADO_APROBADO);
                ps.setString(2, ESTADO_APROBADO);
                ps.setString(3, ESTADO_RECHAZADO);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> resp = new HashMap<>();
                        resp.put("responsable", rs.getString("responsable"));
                        resp.put("totalAsignados", rs.getInt("total_asignados"));
                        resp.put("completados", rs.getInt("completados"));
                        resp.put("retrasados", rs.getInt("retrasados"));

                        // Calcular eficiencia
                        double total = rs.getInt("total_asignados");
                        double completados = rs.getInt("completados");
                        double eficiencia = total > 0 ? (completados / total) * 100 : 0;
                        resp.put("eficiencia", Math.round(eficiencia * 100.0) / 100.0);

                        estadisticasResponsables.add(resp);
                    }
                }
            }

            resumen.put("documentosRetrasados", documentosRetrasados);
            resumen.put("estadisticasProyectos", estadisticasProyectos);
            resumen.put("estadisticasResponsables", estadisticasResponsables);
            resumen.put("fechaGeneracion", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            resumen.put("generadoPor", usuarioId);

            resultado.put("success", true);
            resultado.put("resumen", resumen);

            System.out.println("📋 Resumen ejecutivo generado para usuario " + usuarioId);

        } catch (SQLException e) {
            e.printStackTrace();
            resultado.put("success", false);
            resultado.put("message", "Error al generar resumen: " + e.getMessage());
        }

        return resultado;
    }

    // ==================== MÉTODOS AUXILIARES OPTIMIZADOS ====================

    private int obtenerEtapaPorDefecto(Connection conn) throws SQLException {
        // Intentar obtener una etapa existente
        String sql = "SELECT id_etapas_flujo FROM etapas_flujo WHERE activo = 1 ORDER BY orden ASC LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt("id_etapas_flujo");
            }
        }

        // Si no hay etapas, crear una por defecto
        try {
            // Verificar si existe un flujo por defecto
            String getFlujoSql = "SELECT id_flujos_aprobacion FROM flujos_aprobacion WHERE nombre = 'Flujo por Defecto' LIMIT 1";
            int flujoId = 1;

            try (PreparedStatement ps = conn.prepareStatement(getFlujoSql);
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    flujoId = rs.getInt("id_flujos_aprobacion");
                } else {
                    // Crear flujo por defecto
                    String insertFlujoSql = """
                        INSERT INTO flujos_aprobacion (tipo_documento_id, nombre, descripcion, activo) 
                        VALUES (1, 'Flujo por Defecto', 'Flujo de aprobación por defecto', 1)
                    """;

                    try (PreparedStatement insertPs = conn.prepareStatement(insertFlujoSql, Statement.RETURN_GENERATED_KEYS)) {
                        insertPs.executeUpdate();
                        try (ResultSet keys = insertPs.getGeneratedKeys()) {
                            if (keys.next()) {
                                flujoId = keys.getInt(1);
                            }
                        }
                    }
                }
            }

            // Crear etapa por defecto
            String insertEtapaSql = """
                INSERT INTO etapas_flujo (flujo_id, nombre, orden, obligatorio, activo) 
                VALUES (?, 'Revisión General', 1, 1, 1)
            """;

            try (PreparedStatement etapaPs = conn.prepareStatement(insertEtapaSql, Statement.RETURN_GENERATED_KEYS)) {
                etapaPs.setInt(1, flujoId);
                etapaPs.executeUpdate();
                try (ResultSet etapaKeys = etapaPs.getGeneratedKeys()) {
                    if (etapaKeys.next()) {
                        return etapaKeys.getInt(1);
                    }
                }
            }

        } catch (SQLException e) {
            System.err.println("⚠️ Error creando etapa por defecto: " + e.getMessage());
        }

        return 1; // Fallback
    }

    private void enviarError(HttpServletResponse res, String mensaje, int codigo) throws IOException {
        res.setStatus(codigo);
        res.setContentType(CONTENT_TYPE_JSON);
        res.setCharacterEncoding(CHARSET_UTF8);

        Map<String, Object> error = Map.of(
            "success", false,
            "message", mensaje,
            "error", true,
            "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );

        try (PrintWriter out = res.getWriter()) {
            out.write(gson.toJson(error));
        }
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String str = value.toString();
        if (str.contains("\t") || str.contains("\n") || str.contains("\r")) {
            return str.replace("\t", " ").replace("\n", " ").replace("\r", " ");
        }
        return str;
    }

    // HttpServletRequestWrapper optimizado
    private static class HttpServletRequestWrapper implements HttpServletRequest {
        private final HttpServletRequest request;
        private final Map<String, String> customParams;

        public HttpServletRequestWrapper(HttpServletRequest request, Map<String, String> customParams) {
            this.request = request;
            this.customParams = customParams != null ? customParams : new HashMap<>();
        }

        @Override
        public String getParameter(String name) {
            return customParams.getOrDefault(name, request.getParameter(name));
        }

        // Delegación simplificada de métodos esenciales
        @Override public String getAuthType() { return request.getAuthType(); }
        @Override public jakarta.servlet.http.Cookie[] getCookies() { return request.getCookies(); }
        @Override public long getDateHeader(String name) { return request.getDateHeader(name); }
        @Override public String getHeader(String name) { return request.getHeader(name); }
        @Override public java.util.Enumeration<String> getHeaders(String name) { return request.getHeaders(name); }
        @Override public java.util.Enumeration<String> getHeaderNames() { return request.getHeaderNames(); }
        @Override public int getIntHeader(String name) { return request.getIntHeader(name); }
        @Override public String getMethod() { return request.getMethod(); }
        @Override public String getPathInfo() { return request.getPathInfo(); }
        @Override public String getPathTranslated() { return request.getPathTranslated(); }
        @Override public String getContextPath() { return request.getContextPath(); }
        @Override public String getQueryString() { return request.getQueryString(); }
        @Override public String getRemoteUser() { return request.getRemoteUser(); }
        @Override public boolean isUserInRole(String role) { return request.isUserInRole(role); }
        @Override public java.security.Principal getUserPrincipal() { return request.getUserPrincipal(); }
        @Override public String getRequestedSessionId() { return request.getRequestedSessionId(); }
        @Override public String getRequestURI() { return request.getRequestURI(); }
        @Override public StringBuffer getRequestURL() { return request.getRequestURL(); }
        @Override public String getServletPath() { return request.getServletPath(); }
        @Override public jakarta.servlet.http.HttpSession getSession(boolean create) { return request.getSession(create); }
        @Override public jakarta.servlet.http.HttpSession getSession() { return request.getSession(); }
        @Override public String changeSessionId() { return request.changeSessionId(); }
        @Override public boolean isRequestedSessionIdValid() { return request.isRequestedSessionIdValid(); }
        @Override public boolean isRequestedSessionIdFromCookie() { return request.isRequestedSessionIdFromCookie(); }
        @Override public boolean isRequestedSessionIdFromURL() { return request.isRequestedSessionIdFromURL(); }
        @Override public boolean authenticate(HttpServletResponse response) throws IOException, ServletException { return request.authenticate(response); }
        @Override public void login(String username, String password) throws ServletException { request.login(username, password); }
        @Override public void logout() throws ServletException { request.logout(); }
        @Override public java.util.Collection<jakarta.servlet.http.Part> getParts() throws IOException, ServletException { return request.getParts(); }
        @Override public jakarta.servlet.http.Part getPart(String name) throws IOException, ServletException { return request.getPart(name); }
        @Override public <T extends jakarta.servlet.http.HttpUpgradeHandler> T upgrade(Class<T> httpUpgradeHandlerClass) throws IOException, ServletException { return request.upgrade(httpUpgradeHandlerClass); }
        @Override public Object getAttribute(String name) { return request.getAttribute(name); }
        @Override public java.util.Enumeration<String> getAttributeNames() { return request.getAttributeNames(); }
        @Override public String getCharacterEncoding() { return request.getCharacterEncoding(); }
        @Override public void setCharacterEncoding(String env) throws java.io.UnsupportedEncodingException { request.setCharacterEncoding(env); }
        @Override public int getContentLength() { return request.getContentLength(); }
        @Override public long getContentLengthLong() { return request.getContentLengthLong(); }
        @Override public String getContentType() { return request.getContentType(); }
        @Override public jakarta.servlet.ServletInputStream getInputStream() throws IOException { return request.getInputStream(); }
        @Override public java.util.Enumeration<String> getParameterNames() { return request.getParameterNames(); }
        @Override public String[] getParameterValues(String name) { return request.getParameterValues(name); }
        @Override public java.util.Map<String, String[]> getParameterMap() { return request.getParameterMap(); }
        @Override public String getProtocol() { return request.getProtocol(); }
        @Override public String getScheme() { return request.getScheme(); }
        @Override public String getServerName() { return request.getServerName(); }
        @Override public int getServerPort() { return request.getServerPort(); }
        @Override public java.io.BufferedReader getReader() throws IOException { return request.getReader(); }
        @Override public String getRemoteAddr() { return request.getRemoteAddr(); }
        @Override public String getRemoteHost() { return request.getRemoteHost(); }
        @Override public void setAttribute(String name, Object o) { request.setAttribute(name, o); }
        @Override public void removeAttribute(String name) { request.removeAttribute(name); }
        @Override public java.util.Locale getLocale() { return request.getLocale(); }
        @Override public java.util.Enumeration<java.util.Locale> getLocales() { return request.getLocales(); }
        @Override public boolean isSecure() { return request.isSecure(); }
        @Override public jakarta.servlet.RequestDispatcher getRequestDispatcher(String path) { return request.getRequestDispatcher(path); }
        @Override public int getRemotePort() { return request.getRemotePort(); }
        @Override public String getLocalName() { return request.getLocalName(); }
        @Override public String getLocalAddr() { return request.getLocalAddr(); }
        @Override public int getLocalPort() { return request.getLocalPort(); }
        @Override public jakarta.servlet.ServletContext getServletContext() { return request.getServletContext(); }
        @Override public jakarta.servlet.AsyncContext startAsync() throws IllegalStateException { return request.startAsync(); }
        @Override public jakarta.servlet.AsyncContext startAsync(jakarta.servlet.ServletRequest servletRequest, jakarta.servlet.ServletResponse servletResponse) throws IllegalStateException { return request.startAsync(servletRequest, servletResponse); }
        @Override public boolean isAsyncStarted() { return request.isAsyncStarted(); }
        @Override public boolean isAsyncSupported() { return request.isAsyncSupported(); }
        @Override public jakarta.servlet.AsyncContext getAsyncContext() { return request.getAsyncContext(); }
        @Override public jakarta.servlet.DispatcherType getDispatcherType() { return request.getDispatcherType(); }
        @Override public String getRequestId() { return request.getRequestId(); }
        @Override public String getProtocolRequestId() { return request.getProtocolRequestId(); }
        @Override public jakarta.servlet.ServletConnection getServletConnection() { return request.getServletConnection(); }
    }
}

