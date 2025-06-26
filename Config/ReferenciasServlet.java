package Config;

import Config.Conexion;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.CallableStatement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

/**
 * Servlet para gestión de Referencias Documentales
 * Sistema de Gestión Documental - Constructora Vial S.A.
 * @version 1.0.1 - CORREGIDO
 */
@WebServlet("/ReferenciasServlet")
public class ReferenciasServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final Gson gson = new GsonBuilder()
        .setDateFormat("yyyy-MM-dd HH:mm:ss")
        .create();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doPost(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setDateHeader("Expires", 0);

        PrintWriter out = response.getWriter();
        HttpSession session = request.getSession(false);
        
        String action = request.getParameter("action");
        
        try {
            // Verificar autenticación
            if (session == null) {
                sendErrorResponse(out, "Sesión no válida", 401);
                return;
            }
            
            Integer usuarioId = (Integer) session.getAttribute("usuarioId");
            if (usuarioId == null) {
                sendErrorResponse(out, "Usuario no autenticado", 401);
                return;
            }

            switch (action) {
                case "obtenerEstadisticasReferencias":
                    obtenerEstadisticasReferencias(request, response, out, usuarioId);
                    break;
                case "obtenerProyectos":
                    obtenerProyectos(request, response, out, usuarioId);
                    break;
                case "obtenerDocumentos":
                    obtenerDocumentos(request, response, out, usuarioId);
                    break;
                case "obtenerReferencias":
                    obtenerReferencias(request, response, out, usuarioId);
                    break;
                case "obtenerDetalleReferencia":
                    obtenerDetalleReferencia(request, response, out, usuarioId);
                    break;
                case "obtenerGrafoReferencias":
                    obtenerGrafoReferencias(request, response, out, usuarioId);
                    break;
                case "agregarReferencia":
                    agregarReferencia(request, response, out, usuarioId);
                    break;
                case "actualizarReferencia":
                    actualizarReferencia(request, response, out, usuarioId);
                    break;
                case "eliminarReferencia":
                    eliminarReferencia(request, response, out, usuarioId);
                    break;
                case "exportarReferencias":
                    exportarReferencias(request, response, out, usuarioId);
                    break;
                case "validarReferencia":
                    validarReferencia(request, response, out, usuarioId);
                    break;
                default:
                    sendErrorResponse(out, "Acción no válida: " + action, 400);
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendErrorResponse(out, "Error interno del servidor: " + e.getMessage(), 500);
        } finally {
            if (out != null) {
                out.close();
            }
        }
    }

    /**
     * Obtener estadísticas de referencias
     */
    private void obtenerEstadisticasReferencias(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT 
                    COUNT(*) as total_referencias,
                    SUM(CASE WHEN tipo_referencia = 'Responde a' THEN 1 ELSE 0 END) as responde_a,
                    SUM(CASE WHEN tipo_referencia = 'Relacionado con' THEN 1 ELSE 0 END) as relacionado_con,
                    SUM(CASE WHEN tipo_referencia = 'Corrige a' THEN 1 ELSE 0 END) as corrige_a,
                    SUM(CASE WHEN tipo_referencia = 'Deriva de' THEN 1 ELSE 0 END) as deriva_de
                FROM referencias_documentales rd
                INNER JOIN documentos d1 ON rd.documento_origen_id = d1.id_documentos
                INNER JOIN documentos d2 ON rd.documento_referenciado_id = d2.id_documentos
                WHERE rd.activo = 1 AND d1.estado != 'Anulado' AND d2.estado != 'Anulado'
            """;
            
            try (PreparedStatement stmt = conn.prepareStatement(sql);
                 ResultSet rs = stmt.executeQuery()) {
                
                Map<String, Object> estadisticas = new HashMap<>();
                
                if (rs.next()) {
                    estadisticas.put("totalReferencias", rs.getInt("total_referencias"));
                    estadisticas.put("respondeA", rs.getInt("responde_a"));
                    estadisticas.put("relacionadoCon", rs.getInt("relacionado_con"));
                    estadisticas.put("corrigeA", rs.getInt("corrige_a"));
                    estadisticas.put("derivaDe", rs.getInt("deriva_de"));
                } else {
                    estadisticas.put("totalReferencias", 0);
                    estadisticas.put("respondeA", 0);
                    estadisticas.put("relacionadoCon", 0);
                    estadisticas.put("corrigeA", 0);
                    estadisticas.put("derivaDe", 0);
                }
                
                Map<String, Object> response_data = new HashMap<>();
                response_data.put("success", true);
                response_data.put("estadisticas", estadisticas);
                
                out.print(gson.toJson(response_data));
            }
        }
    }

    /**
     * Obtener lista de proyectos
     */
    private void obtenerProyectos(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT id_proyectos, nombre, descripcion, estado
                FROM proyectos 
                WHERE estado = 'Activo'
                ORDER BY nombre
            """;
            
            try (PreparedStatement stmt = conn.prepareStatement(sql);
                 ResultSet rs = stmt.executeQuery()) {
                
                List<Map<String, Object>> proyectos = new ArrayList<>();
                
                while (rs.next()) {
                    Map<String, Object> proyecto = new HashMap<>();
                    proyecto.put("id", rs.getInt("id_proyectos"));
                    proyecto.put("nombre", rs.getString("nombre"));
                    proyecto.put("descripcion", rs.getString("descripcion"));
                    proyecto.put("estado", rs.getString("estado"));
                    proyectos.add(proyecto);
                }
                
                Map<String, Object> response_data = new HashMap<>();
                response_data.put("success", true);
                response_data.put("proyectos", proyectos);
                
                out.print(gson.toJson(response_data));
            }
        }
    }

    /**
     * Obtener lista de documentos disponibles
     */
    private void obtenerDocumentos(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        try (Connection conn = Conexion.getConnection()) {
            // Query más amplia para obtener documentos
            String sql = """
                SELECT 
                    d.id_documentos,
                    d.codigo,
                    d.titulo,
                    d.estado,
                    COALESCE(td.nombre, 'Sin tipo') as tipo_documento,
                    COALESCE(p.nombre, 'Sin proyecto') as proyecto_nombre
                FROM documentos d
                LEFT JOIN tipos_documento td ON d.tipo_documento_id = td.id_tipos_documento
                LEFT JOIN proyectos p ON d.proyecto_id = p.id_proyectos
                WHERE d.estado NOT IN ('Anulado', 'Eliminado')
                  AND d.codigo IS NOT NULL 
                  AND d.titulo IS NOT NULL
                ORDER BY d.fecha_creacion DESC
                LIMIT 1000
            """;
            
            try (PreparedStatement stmt = conn.prepareStatement(sql);
                 ResultSet rs = stmt.executeQuery()) {
                
                List<Map<String, Object>> documentos = new ArrayList<>();
                
                while (rs.next()) {
                    Map<String, Object> documento = new HashMap<>();
                    documento.put("id", rs.getInt("id_documentos"));
                    documento.put("codigo", rs.getString("codigo"));
                    documento.put("titulo", rs.getString("titulo"));
                    documento.put("estado", rs.getString("estado"));
                    documento.put("tipo", rs.getString("tipo_documento"));
                    documento.put("proyecto", rs.getString("proyecto_nombre"));
                    documentos.add(documento);
                }
                
                System.out.println("DEBUG: Documentos encontrados: " + documentos.size());
                
                Map<String, Object> response_data = new HashMap<>();
                response_data.put("success", true);
                response_data.put("documentos", documentos);
                response_data.put("total", documentos.size());
                
                out.print(gson.toJson(response_data));
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendErrorResponse(out, "Error al obtener documentos: " + e.getMessage(), 500);
        }
    }

    /**
     * Obtener referencias con filtros y paginación - CORREGIDO
     */
    private void obtenerReferencias(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        try (Connection conn = Conexion.getConnection()) {
            // Parámetros de paginación
            int page = getIntParameter(request, "page", 1);
            int size = getIntParameter(request, "size", 15);
            int offset = (page - 1) * size;
            
            // Filtros
            String tipoReferencia = request.getParameter("tipoReferencia");
            String documentoOrigen = request.getParameter("documentoOrigen");
            String documentoReferenciado = request.getParameter("documentoReferenciado");
            String proyecto = request.getParameter("proyecto");
            String tipoDocumento = request.getParameter("tipoDocumento");
            String fechaInicio = request.getParameter("fechaInicio");
            String fechaFin = request.getParameter("fechaFin");
            String busqueda = request.getParameter("busqueda");
            
            // Construir WHERE dinámico
            StringBuilder whereClause = new StringBuilder(" AND rd.activo = 1 ");
            List<Object> parameters = new ArrayList<>();
            
            if (tipoReferencia != null && !tipoReferencia.trim().isEmpty()) {
                whereClause.append(" AND rd.tipo_referencia = ? ");
                parameters.add(tipoReferencia);
            }
            
            if (documentoOrigen != null && !documentoOrigen.trim().isEmpty()) {
                whereClause.append(" AND rd.documento_origen_id = ? ");
                parameters.add(Integer.parseInt(documentoOrigen));
            }
            
            if (documentoReferenciado != null && !documentoReferenciado.trim().isEmpty()) {
                whereClause.append(" AND rd.documento_referenciado_id = ? ");
                parameters.add(Integer.parseInt(documentoReferenciado));
            }
            
            if (proyecto != null && !proyecto.trim().isEmpty()) {
                whereClause.append(" AND (d1.proyecto_id = ? OR d2.proyecto_id = ?) ");
                parameters.add(Integer.parseInt(proyecto));
                parameters.add(Integer.parseInt(proyecto));
            }
            
            if (tipoDocumento != null && !tipoDocumento.trim().isEmpty()) {
                whereClause.append(" AND (td1.nombre = ? OR td2.nombre = ?) ");
                parameters.add(tipoDocumento);
                parameters.add(tipoDocumento);
            }
            
            if (fechaInicio != null && !fechaInicio.trim().isEmpty()) {
                whereClause.append(" AND DATE(rd.fecha_creacion) >= ? ");
                parameters.add(fechaInicio);
            }
            
            if (fechaFin != null && !fechaFin.trim().isEmpty()) {
                whereClause.append(" AND DATE(rd.fecha_creacion) <= ? ");
                parameters.add(fechaFin);
            }
            
            if (busqueda != null && !busqueda.trim().isEmpty()) {
                whereClause.append(" AND (d1.codigo LIKE ? OR d1.titulo LIKE ? OR d2.codigo LIKE ? OR d2.titulo LIKE ?) ");
                String searchPattern = "%" + busqueda + "%";
                parameters.add(searchPattern);
                parameters.add(searchPattern);
                parameters.add(searchPattern);
                parameters.add(searchPattern);
            }
            
            // Query principal - CORREGIDO
            String sql = """
                SELECT 
                    rd.id_referencias_documentales AS id,
                    rd.tipo_referencia,
                    rd.fecha_referencia,
                    rd.observaciones,
                    rd.fecha_creacion,
                    rd.fecha_actualizacion,
                    rd.activo,
                    
                    d1.id_documentos AS documento_origen_id,
                    d1.codigo AS documento_origen_codigo,
                    d1.titulo AS documento_origen_titulo,
                    d1.estado AS documento_origen_estado,
                    td1.nombre AS documento_origen_tipo,
                    
                    d2.id_documentos AS documento_referenciado_id,
                    d2.codigo AS documento_referenciado_codigo,
                    d2.titulo AS documento_referenciado_titulo,
                    d2.estado AS documento_referenciado_estado,
                    td2.nombre AS documento_referenciado_tipo,
                    
                    p1.nombre AS proyecto_origen,
                    p2.nombre AS proyecto_referenciado,
                    
                    CONCAT_WS(' ', pe_creador.nombres, pe_creador.apellidos) AS referencia_creada_por,
                    
                    dep1.nombre AS dependencia_origen,
                    dep2.nombre AS dependencia_referenciada
                    
                FROM referencias_documentales rd
                INNER JOIN documentos d1 ON rd.documento_origen_id = d1.id_documentos
                INNER JOIN documentos d2 ON rd.documento_referenciado_id = d2.id_documentos
                
                LEFT JOIN tipos_documento td1 ON d1.tipo_documento_id = td1.id_tipos_documento
                LEFT JOIN tipos_documento td2 ON d2.tipo_documento_id = td2.id_tipos_documento
                
                LEFT JOIN proyectos p1 ON d1.proyecto_id = p1.id_proyectos
                LEFT JOIN proyectos p2 ON d2.proyecto_id = p2.id_proyectos
                
                LEFT JOIN usuarios u_creador ON rd.creado_por_usuario_id = u_creador.id_usuarios
                LEFT JOIN perfiles_usuarios pe_creador ON pe_creador.usuario_id = u_creador.id_usuarios
                
                LEFT JOIN dependencias dep1 ON d1.dependencia_emisora_id = dep1.id_dependencias
                LEFT JOIN dependencias dep2 ON d2.dependencia_emisora_id = dep2.id_dependencias
                
                WHERE 1 = 1
            """ + whereClause.toString() + 
                " ORDER BY rd.fecha_creacion DESC " +
                " LIMIT ? OFFSET ?";
            
            parameters.add(size);
            parameters.add(offset);
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                // Establecer parámetros
                for (int i = 0; i < parameters.size(); i++) {
                    stmt.setObject(i + 1, parameters.get(i));
                }
                
                try (ResultSet rs = stmt.executeQuery()) {
                    List<Map<String, Object>> referencias = new ArrayList<>();
                    
                    while (rs.next()) {
                        Map<String, Object> referencia = new HashMap<>();
                        
                        referencia.put("id", rs.getInt("id"));
                        referencia.put("tipoReferencia", rs.getString("tipo_referencia"));
                        referencia.put("documentoOrigenId", rs.getInt("documento_origen_id"));
                        referencia.put("documentoOrigenCodigo", rs.getString("documento_origen_codigo"));
                        referencia.put("documentoOrigenTitulo", rs.getString("documento_origen_titulo"));
                        referencia.put("documentoOrigenTipo", rs.getString("documento_origen_tipo"));
                        referencia.put("documentoReferenciadoId", rs.getInt("documento_referenciado_id"));
                        referencia.put("documentoReferenciadoCodigo", rs.getString("documento_referenciado_codigo"));
                        referencia.put("documentoReferenciadoTitulo", rs.getString("documento_referenciado_titulo"));
                        referencia.put("documentoReferenciadoTipo", rs.getString("documento_referenciado_tipo"));
                        referencia.put("proyectoOrigen", rs.getString("proyecto_origen"));
                        referencia.put("proyectoReferenciado", rs.getString("proyecto_referenciado"));
                        referencia.put("proyectoNombre", rs.getString("proyecto_origen")); // Para compatibilidad
                        referencia.put("creadoPor", rs.getString("referencia_creada_por"));
                        referencia.put("fechaCreacion", rs.getTimestamp("fecha_creacion"));
                        referencia.put("fechaReferencia", rs.getDate("fecha_referencia"));
                        referencia.put("observaciones", rs.getString("observaciones"));
                        referencia.put("ultimaActualizacion", rs.getTimestamp("fecha_actualizacion"));
                        
                        referencias.add(referencia);
                    }
                    
                    // Contar total de registros
                    String countSql = """
                        SELECT COUNT(*) as total
                        FROM referencias_documentales rd
                        INNER JOIN documentos d1 ON rd.documento_origen_id = d1.id_documentos
                        INNER JOIN documentos d2 ON rd.documento_referenciado_id = d2.id_documentos
                        LEFT JOIN tipos_documento td1 ON d1.tipo_documento_id = td1.id_tipos_documento
                        LEFT JOIN tipos_documento td2 ON d2.tipo_documento_id = td2.id_tipos_documento
                        WHERE 1=1
                    """ + whereClause.toString();
                    
                    try (PreparedStatement countStmt = conn.prepareStatement(countSql)) {
                        // Establecer parámetros (sin LIMIT y OFFSET)
                        for (int i = 0; i < parameters.size() - 2; i++) {
                            countStmt.setObject(i + 1, parameters.get(i));
                        }
                        
                        try (ResultSet countRs = countStmt.executeQuery()) {
                            int total = 0;
                            if (countRs.next()) {
                                total = countRs.getInt("total");
                            }
                            
                            int totalPages = (int) Math.ceil((double) total / size);
                            
                            Map<String, Object> response_data = new HashMap<>();
                            response_data.put("success", true);
                            response_data.put("referencias", referencias);
                            response_data.put("currentPage", page);
                            response_data.put("totalPages", totalPages);
                            response_data.put("totalItems", total);
                            response_data.put("itemsPerPage", size);
                            
                            out.print(gson.toJson(response_data));
                        }
                    }
                }
            }
        }
    }

    /**
     * Obtener detalle de una referencia específica - CORREGIDO
     */
    private void obtenerDetalleReferencia(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        String id = request.getParameter("id");
        if (id == null || id.trim().isEmpty()) {
            sendErrorResponse(out, "ID de referencia requerido", 400);
            return;
        }
        
        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT 
                    rd.id_referencias_documentales as id,
                    rd.tipo_referencia,
                    rd.fecha_referencia,
                    rd.observaciones,
                    rd.fecha_creacion,
                    d1.id_documentos as documento_origen_id,
                    d1.codigo as documento_origen_codigo,
                    d1.titulo as documento_origen_titulo,
                    td1.nombre as documento_origen_tipo,
                    d2.id_documentos as documento_referenciado_id,
                    d2.codigo as documento_referenciado_codigo,
                    d2.titulo as documento_referenciado_titulo,
                    td2.nombre as documento_referenciado_tipo,
                    p1.nombre as proyecto_origen,
                    CONCAT_WS(' ', pe_creador.nombres, pe_creador.apellidos) AS creado_por
                FROM referencias_documentales rd
                INNER JOIN documentos d1 ON rd.documento_origen_id = d1.id_documentos
                INNER JOIN documentos d2 ON rd.documento_referenciado_id = d2.id_documentos
                LEFT JOIN tipos_documento td1 ON d1.tipo_documento_id = td1.id_tipos_documento
                LEFT JOIN tipos_documento td2 ON d2.tipo_documento_id = td2.id_tipos_documento
                LEFT JOIN proyectos p1 ON d1.proyecto_id = p1.id_proyectos
                LEFT JOIN usuarios u_creador ON rd.creado_por_usuario_id = u_creador.id_usuarios
                LEFT JOIN perfiles_usuarios pe_creador ON pe_creador.usuario_id = u_creador.id_usuarios
                WHERE rd.id_referencias_documentales = ? AND rd.activo = 1
            """;
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, Integer.parseInt(id));
                
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        Map<String, Object> referencia = new HashMap<>();
                        referencia.put("id", rs.getInt("id"));
                        referencia.put("tipoReferencia", rs.getString("tipo_referencia"));
                        referencia.put("documentoOrigenId", rs.getInt("documento_origen_id"));
                        referencia.put("documentoOrigenCodigo", rs.getString("documento_origen_codigo"));
                        referencia.put("documentoOrigenTitulo", rs.getString("documento_origen_titulo"));
                        referencia.put("documentoOrigenTipo", rs.getString("documento_origen_tipo"));
                        referencia.put("documentoReferenciadoId", rs.getInt("documento_referenciado_id"));
                        referencia.put("documentoReferenciadoCodigo", rs.getString("documento_referenciado_codigo"));
                        referencia.put("documentoReferenciadoTitulo", rs.getString("documento_referenciado_titulo"));
                        referencia.put("documentoReferenciadoTipo", rs.getString("documento_referenciado_tipo"));
                        referencia.put("proyectoNombre", rs.getString("proyecto_origen"));
                        referencia.put("creadoPor", rs.getString("creado_por"));
                        referencia.put("fechaCreacion", rs.getTimestamp("fecha_creacion"));
                        referencia.put("fechaReferencia", rs.getDate("fecha_referencia"));
                        referencia.put("observaciones", rs.getString("observaciones"));
                        
                        Map<String, Object> response_data = new HashMap<>();
                        response_data.put("success", true);
                        response_data.put("referencia", referencia);
                        
                        out.print(gson.toJson(response_data));
                    } else {
                        sendErrorResponse(out, "Referencia no encontrada", 404);
                    }
                }
            }
        }
    }

    /**
     * Obtener datos para grafo de referencias
     */
    private void obtenerGrafoReferencias(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        try (Connection conn = Conexion.getConnection()) {
            // Obtener nodos (documentos únicos)
            String sqlNodos = """
                SELECT DISTINCT
                    d.id_documentos as id,
                    d.codigo,
                    d.titulo,
                    d.estado,
                    td.nombre as tipo,
                    p.nombre as proyecto
                FROM documentos d
                LEFT JOIN tipos_documento td ON d.tipo_documento_id = td.id_tipos_documento
                LEFT JOIN proyectos p ON d.proyecto_id = p.id_proyectos
                WHERE d.id_documentos IN (
                    SELECT documento_origen_id FROM referencias_documentales WHERE activo = 1
                    UNION
                    SELECT documento_referenciado_id FROM referencias_documentales WHERE activo = 1
                )
                AND d.estado != 'Anulado'
            """;
            
            List<Map<String, Object>> nodos = new ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(sqlNodos);
                 ResultSet rs = stmt.executeQuery()) {
                
                while (rs.next()) {
                    Map<String, Object> nodo = new HashMap<>();
                    nodo.put("id", rs.getInt("id"));
                    nodo.put("codigo", rs.getString("codigo"));
                    nodo.put("titulo", rs.getString("titulo"));
                    nodo.put("estado", rs.getString("estado"));
                    nodo.put("tipo", rs.getString("tipo"));
                    nodo.put("proyecto", rs.getString("proyecto"));
                    nodos.add(nodo);
                }
            }
            
            // Obtener enlaces (referencias)
            String sqlEnlaces = """
                SELECT 
                    rd.id_referencias_documentales as id,
                    rd.documento_origen_id as source,
                    rd.documento_referenciado_id as target,
                    rd.tipo_referencia as tipo,
                    rd.observaciones
                FROM referencias_documentales rd
                INNER JOIN documentos d1 ON rd.documento_origen_id = d1.id_documentos
                INNER JOIN documentos d2 ON rd.documento_referenciado_id = d2.id_documentos
                WHERE rd.activo = 1 AND d1.estado != 'Anulado' AND d2.estado != 'Anulado'
                ORDER BY rd.id_referencias_documentales
            """;
            
            List<Map<String, Object>> enlaces = new ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(sqlEnlaces);
                 ResultSet rs = stmt.executeQuery()) {
                
                while (rs.next()) {
                    Map<String, Object> enlace = new HashMap<>();
                    enlace.put("id", rs.getInt("id"));
                    enlace.put("source", rs.getInt("source"));
                    enlace.put("target", rs.getInt("target"));
                    enlace.put("tipo", rs.getString("tipo"));
                    enlace.put("observaciones", rs.getString("observaciones"));
                    enlaces.add(enlace);
                }
            }
            
            Map<String, Object> grafoData = new HashMap<>();
            grafoData.put("nodos", nodos);
            grafoData.put("enlaces", enlaces);
            
            Map<String, Object> response_data = new HashMap<>();
            response_data.put("success", true);
            response_data.put("grafo", grafoData);
            
            out.print(gson.toJson(response_data));
        }
    }

    /**
     * Agregar nueva referencia usando procedimiento almacenado
     */
    private void agregarReferencia(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        String documentoOrigenId = request.getParameter("documentoOrigenId");
        String documentoReferenciadoId = request.getParameter("documentoReferenciadoId");
        String tipoReferencia = request.getParameter("tipoReferencia");
        String fechaReferencia = request.getParameter("fechaReferencia");
        String observaciones = request.getParameter("observaciones");
        
        // Validaciones básicas
        if (documentoOrigenId == null || documentoOrigenId.trim().isEmpty() ||
            documentoReferenciadoId == null || documentoReferenciadoId.trim().isEmpty() ||
            tipoReferencia == null || tipoReferencia.trim().isEmpty()) {
            sendErrorResponse(out, "Faltan parámetros requeridos", 400);
            return;
        }
        
        if (documentoOrigenId.equals(documentoReferenciadoId)) {
            sendErrorResponse(out, "Un documento no puede referenciar a sí mismo", 400);
            return;
        }
        
        try (Connection conn = Conexion.getConnection()) {
            CallableStatement stmt = conn.prepareCall("{CALL CrearReferencia(?, ?, ?, ?, ?, ?, ?, ?, ?)}");
            
            stmt.setInt(1, Integer.parseInt(documentoOrigenId));
            stmt.setInt(2, Integer.parseInt(documentoReferenciadoId));
            stmt.setString(3, tipoReferencia);
            
            // Fecha de referencia
            if (fechaReferencia != null && !fechaReferencia.trim().isEmpty()) {
                stmt.setDate(4, java.sql.Date.valueOf(fechaReferencia));
            } else {
                stmt.setDate(4, new java.sql.Date(System.currentTimeMillis()));
            }
            
            // Observaciones
            if (observaciones != null && !observaciones.trim().isEmpty()) {
                stmt.setString(5, observaciones);
            } else {
                stmt.setString(5, null);
            }
            
            stmt.setInt(6, usuarioId);
            
            // Parámetros de salida
            stmt.registerOutParameter(7, Types.BOOLEAN); // p_exito
            stmt.registerOutParameter(8, Types.VARCHAR); // p_mensaje
            stmt.registerOutParameter(9, Types.INTEGER); // p_referencia_id
            
            stmt.execute();
            
            boolean exito = stmt.getBoolean(7);
            String mensaje = stmt.getString(8);
            int referenciaId = stmt.getInt(9);
            
            if (exito) {
                Map<String, Object> response_data = new HashMap<>();
                response_data.put("success", true);
                response_data.put("message", mensaje);
                response_data.put("referenciaId", referenciaId);
                
                out.print(gson.toJson(response_data));
            } else {
                sendErrorResponse(out, mensaje, 400);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            sendErrorResponse(out, "Error al crear referencia: " + e.getMessage(), 500);
        }
    }

    /**
     * Actualizar referencia existente
     */
    private void actualizarReferencia(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        String id = request.getParameter("id");
        String tipoReferencia = request.getParameter("tipoReferencia");
        String fechaReferencia = request.getParameter("fechaReferencia");
        String observaciones = request.getParameter("observaciones");
        
        if (id == null || id.trim().isEmpty() || 
            tipoReferencia == null || tipoReferencia.trim().isEmpty()) {
            sendErrorResponse(out, "Faltan parámetros requeridos", 400);
            return;
        }
        
        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                UPDATE referencias_documentales 
                SET tipo_referencia = ?, 
                    fecha_referencia = ?,
                    observaciones = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_referencias_documentales = ? AND activo = 1
            """;
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, tipoReferencia);
                
                if (fechaReferencia != null && !fechaReferencia.trim().isEmpty()) {
                    stmt.setDate(2, java.sql.Date.valueOf(fechaReferencia));
                } else {
                    stmt.setDate(2, null);
                }
                
                stmt.setString(3, observaciones);
                stmt.setInt(4, Integer.parseInt(id));
                
                int affectedRows = stmt.executeUpdate();
                
                if (affectedRows == 0) {
                    sendErrorResponse(out, "Referencia no encontrada", 404);
                    return;
                }
                
                Map<String, Object> response_data = new HashMap<>();
                response_data.put("success", true);
                response_data.put("message", "Referencia actualizada correctamente");
                
                out.print(gson.toJson(response_data));
            }
        }
    }

    /**
     * Eliminar referencia (marcar como inactiva)
     */
    private void eliminarReferencia(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        String id = request.getParameter("id");
        
        if (id == null || id.trim().isEmpty()) {
            sendErrorResponse(out, "ID de referencia requerido", 400);
            return;
        }
        
        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                UPDATE referencias_documentales 
                SET activo = 0, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_referencias_documentales = ? AND activo = 1
            """;
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, Integer.parseInt(id));
                
                int affectedRows = stmt.executeUpdate();
                
                if (affectedRows == 0) {
                    sendErrorResponse(out, "Referencia no encontrada", 404);
                    return;
                }
                
                Map<String, Object> response_data = new HashMap<>();
                response_data.put("success", true);
                response_data.put("message", "Referencia eliminada correctamente");
                
                out.print(gson.toJson(response_data));
            }
        }
    }

    /**
     * Exportar referencias a CSV
     */
    private void exportarReferencias(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        try (Connection conn = Conexion.getConnection()) {
            String sql = """
                SELECT 
                    rd.id_referencias_documentales as id,
                    rd.tipo_referencia,
                    rd.fecha_referencia,
                    rd.observaciones,
                    rd.fecha_creacion,
                    d1.codigo as documento_origen_codigo,
                    d1.titulo as documento_origen_titulo,
                    td1.nombre as documento_origen_tipo,
                    d2.codigo as documento_referenciado_codigo,
                    d2.titulo as documento_referenciado_titulo,
                    td2.nombre as documento_referenciado_tipo,
                    p1.nombre as proyecto_origen,
                    CONCAT_WS(' ', pe_creador.nombres, pe_creador.apellidos) AS creado_por
                FROM referencias_documentales rd
                INNER JOIN documentos d1 ON rd.documento_origen_id = d1.id_documentos
                INNER JOIN documentos d2 ON rd.documento_referenciado_id = d2.id_documentos
                LEFT JOIN tipos_documento td1 ON d1.tipo_documento_id = td1.id_tipos_documento
                LEFT JOIN tipos_documento td2 ON d2.tipo_documento_id = td2.id_tipos_documento
                LEFT JOIN proyectos p1 ON d1.proyecto_id = p1.id_proyectos
                LEFT JOIN usuarios u_creador ON rd.creado_por_usuario_id = u_creador.id_usuarios
                LEFT JOIN perfiles_usuarios pe_creador ON pe_creador.usuario_id = u_creador.id_usuarios
                WHERE rd.activo = 1 AND d1.estado != 'Anulado' AND d2.estado != 'Anulado'
                ORDER BY rd.fecha_creacion DESC
            """;
            
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("ID,Tipo Referencia,Documento Origen,Título Origen,Tipo Origen,Documento Referenciado,Título Referenciado,Tipo Referenciado,Proyecto,Fecha Referencia,Observaciones,Creado Por,Fecha Creación\n");
            
            try (PreparedStatement stmt = conn.prepareStatement(sql);
                 ResultSet rs = stmt.executeQuery()) {
                
                while (rs.next()) {
                    csvContent.append(rs.getInt("id")).append(",")
                              .append(escapeCSV(rs.getString("tipo_referencia"))).append(",")
                              .append(escapeCSV(rs.getString("documento_origen_codigo"))).append(",")
                              .append(escapeCSV(rs.getString("documento_origen_titulo"))).append(",")
                              .append(escapeCSV(rs.getString("documento_origen_tipo"))).append(",")
                              .append(escapeCSV(rs.getString("documento_referenciado_codigo"))).append(",")
                              .append(escapeCSV(rs.getString("documento_referenciado_titulo"))).append(",")
                              .append(escapeCSV(rs.getString("documento_referenciado_tipo"))).append(",")
                              .append(escapeCSV(rs.getString("proyecto_origen"))).append(",")
                              .append(rs.getDate("fecha_referencia")).append(",")
                              .append(escapeCSV(rs.getString("observaciones"))).append(",")
                              .append(escapeCSV(rs.getString("creado_por"))).append(",")
                              .append(rs.getTimestamp("fecha_creacion")).append("\n");
                }
            }
            
            Map<String, Object> response_data = new HashMap<>();
            response_data.put("success", true);
            response_data.put("csvContent", csvContent.toString());
            response_data.put("filename", "referencias_documentales_" + System.currentTimeMillis() + ".csv");
            
            out.print(gson.toJson(response_data));
        }
    }

    /**
     * Validar referencia (verificar ciclos, etc.)
     */
    private void validarReferencia(HttpServletRequest request, HttpServletResponse response, 
            PrintWriter out, Integer usuarioId) throws SQLException {
        
        String documentoOrigenId = request.getParameter("documentoOrigenId");
        String documentoReferenciadoId = request.getParameter("documentoReferenciadoId");
        
        if (documentoOrigenId == null || documentoReferenciadoId == null) {
            sendErrorResponse(out, "Parámetros requeridos faltantes", 400);
            return;
        }
        
        try (Connection conn = Conexion.getConnection()) {
            // Verificar referencia circular usando la función de la BD
            String sql = "SELECT ValidarReferenciaCircular(?, ?) as es_circular";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, Integer.parseInt(documentoOrigenId));
                stmt.setInt(2, Integer.parseInt(documentoReferenciadoId));
                
                try (ResultSet rs = stmt.executeQuery()) {
                    boolean esCircular = false;
                    if (rs.next()) {
                        esCircular = rs.getBoolean("es_circular");
                    }
                    
                    Map<String, Object> response_data = new HashMap<>();
                    response_data.put("success", true);
                    response_data.put("valida", !esCircular);
                    response_data.put("mensaje", esCircular ? 
                        "Esta referencia crearía una referencia circular" : 
                        "Referencia válida");
                    
                    out.print(gson.toJson(response_data));
                }
            }
        }
    }

    /**
     * Utilidades
     */
    private void sendErrorResponse(PrintWriter out, String message, int statusCode) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        error.put("statusCode", statusCode);
        out.print(gson.toJson(error));
    }
    
    private int getIntParameter(HttpServletRequest request, String paramName, int defaultValue) {
        String paramValue = request.getParameter(paramName);
        if (paramValue != null && !paramValue.trim().isEmpty()) {
            try {
                return Integer.parseInt(paramValue);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }
    
    private String escapeCSV(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}