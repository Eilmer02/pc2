<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@page import="java.sql.*, Config.Conexion, java.util.*"%>
<%@ page trimDirectiveWhitespaces="true" %>

<%
    // Verificar permisos específicos para seguimiento
    boolean puedeGestionarSeguimiento = true;

%>

<%@ include file="modules/head.jsp" %>

<body>
    <!-- Skip Links para accesibilidad -->
    <a href="#main-content" class="visually-hidden-focusable">Saltar al contenido principal</a>
    
    <%@ include file="modules/topbar.jsp" %>
    <%@ include file="modules/sidebar.jsp" %>
    
    <main class="main" role="main">
        <div class="seguimiento-container">
            <!-- Header optimizado de la página -->
            <header class="page-header" id="main-content">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h1 class="page-title">
                            <i class="bi bi-activity me-3" aria-hidden="true"></i>
                            Seguimiento de Documentos
                        </h1>
                        <p class="page-subtitle text-muted">
                            Monitoree el estado y progreso de documentos en tiempo real
                        </p>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <button type="button" 
                                class="btn btn-outline-primary hover-lift"
                                onclick="SeguimientoApp.exportarSeguimiento()"
                                aria-label="Exportar reporte de seguimiento"
                                title="Exportar reporte de seguimiento">
                            <i class="bi bi-download me-1" aria-hidden="true"></i>
                            <span class="d-none d-sm-inline">Exportar Reporte</span>
                        </button>
                        <button type="button" 
                                class="btn btn-outline-info hover-lift"
                                onclick="SeguimientoApp.generarResumen()"
                                aria-label="Generar resumen ejecutivo"
                                title="Generar resumen ejecutivo">
                            <i class="bi bi-file-text me-1" aria-hidden="true"></i>
                            <span class="d-none d-sm-inline">Resumen Ejecutivo</span>
                        </button>
                        <% if (puedeGestionarSeguimiento) { %>
                        <button type="button" 
                                class="btn btn-primary hover-lift" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modalAgregarSeguimiento"
                                aria-label="Agregar nuevo seguimiento"
                                title="Agregar nuevo seguimiento">
                            <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            <span class="d-none d-sm-inline">Nuevo Seguimiento</span>
                        </button>
                        <% } %>
                    </div>
                </div>
            </header>

            <!-- Estadísticas de Seguimiento optimizadas -->
            <section class="stats-section mb-4" aria-labelledby="stats-title">
                <h2 id="stats-title" class="visually-hidden">Estadísticas de Seguimiento</h2>
                <div class="stats-grid">
                    <div class="stats-card hover-lift" role="img" aria-label="Documentos en proceso">
                        <div class="stats-icon bg-primary" aria-hidden="true">
                            <i class="bi bi-arrow-clockwise"></i>
                        </div>
                        <div class="stats-content">
                            <h3 id="statEnProceso" aria-live="polite">0</h3>
                            <p>En Proceso</p>
                        </div>
                    </div>
                    <div class="stats-card hover-lift" role="img" aria-label="Documentos completados">
                        <div class="stats-icon bg-success" aria-hidden="true">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="stats-content">
                            <h3 id="statCompletados" aria-live="polite">0</h3>
                            <p>Completados</p>
                        </div>
                    </div>
                    <div class="stats-card hover-lift" role="img" aria-label="Documentos pendientes">
                        <div class="stats-icon bg-warning" aria-hidden="true">
                            <i class="bi bi-clock-history"></i>
                        </div>
                        <div class="stats-content">
                            <h3 id="statPendientes" aria-live="polite">0</h3>
                            <p>Pendientes</p>
                        </div>
                    </div>
                    <div class="stats-card hover-lift" role="img" aria-label="Documentos con retraso">
                        <div class="stats-icon bg-danger" aria-hidden="true">
                            <i class="bi bi-exclamation-triangle"></i>
                        </div>
                        <div class="stats-content">
                            <h3 id="statRetrasados" aria-live="polite">0</h3>
                            <p>Con Retraso</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Filtros Avanzados optimizados -->
            <section class="filters-section mb-4" aria-labelledby="filters-title">
                <div class="card card-animated">
                    <div class="card-header">
                        <h2 id="filters-title" class="card-title mb-0 h5">
                            <i class="bi bi-funnel me-2" aria-hidden="true"></i>
                            Filtros de Seguimiento
                        </h2>
                    </div>
                    <div class="card-body">
                        <form class="filters-grid" role="search" aria-label="Filtros de seguimiento">
                            <div>
                                <label for="filtroEstado" class="form-label">Estado del Documento</label>
                                <select class="form-select" 
                                        id="filtroEstado" 
                                        onchange="SeguimientoApp.aplicarFiltros()"
                                        aria-describedby="filtroEstado-help">
                                    <option value="">Todos los estados</option>
                                    <option value="En Revision">En Revisión</option>
                                    <option value="Aprobado">Aprobado</option>
                                    <option value="Observado">Observado</option>
                                    <option value="Completado">Completado</option>
                                    <option value="Rechazado">Rechazado</option>
                                    <option value="Pendiente">Pendiente</option>
                                </select>
                                <div id="filtroEstado-help" class="visually-hidden">
                                    Filtre por estado del documento
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroTipoDocumento" class="form-label">Tipo de Documento</label>
                                <select class="form-select" 
                                        id="filtroTipoDocumento" 
                                        onchange="SeguimientoApp.aplicarFiltros()"
                                        aria-describedby="filtroTipoDocumento-help">
                                    <option value="">Todos los tipos</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div id="filtroTipoDocumento-help" class="visually-hidden">
                                    Filtre por tipo de documento
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroProyecto" class="form-label">Proyecto</label>
                                <select class="form-select" 
                                        id="filtroProyecto" 
                                        onchange="SeguimientoApp.aplicarFiltros()"
                                        aria-describedby="filtroProyecto-help">
                                    <option value="">Todos los proyectos</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div id="filtroProyecto-help" class="visually-hidden">
                                    Filtre por proyecto
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroResponsable" class="form-label">Responsable</label>
                                <select class="form-select" 
                                        id="filtroResponsable" 
                                        onchange="SeguimientoApp.aplicarFiltros()"
                                        aria-describedby="filtroResponsable-help">
                                    <option value="">Todos los responsables</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div id="filtroResponsable-help" class="visually-hidden">
                                    Filtre por responsable
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroFechaInicio" class="form-label">Fecha Inicio</label>
                                <input type="date" 
                                       class="form-control" 
                                       id="filtroFechaInicio" 
                                       onchange="SeguimientoApp.aplicarFiltros()"
                                       aria-describedby="filtroFechaInicio-help">
                                <div id="filtroFechaInicio-help" class="visually-hidden">
                                    Filtre desde fecha de inicio
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroFechaFin" class="form-label">Fecha Fin</label>
                                <input type="date" 
                                       class="form-control" 
                                       id="filtroFechaFin" 
                                       onchange="SeguimientoApp.aplicarFiltros()"
                                       aria-describedby="filtroFechaFin-help">
                                <div id="filtroFechaFin-help" class="visually-hidden">
                                    Filtre hasta fecha de fin
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroPrioridad" class="form-label">Prioridad</label>
                                <select class="form-select" 
                                        id="filtroPrioridad" 
                                        onchange="SeguimientoApp.aplicarFiltros()"
                                        aria-describedby="filtroPrioridad-help">
                                    <option value="">Todas las prioridades</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Media">Media</option>
                                    <option value="Baja">Baja</option>
                                    <option value="Urgente">Urgente</option>
                                </select>
                                <div id="filtroPrioridad-help" class="visually-hidden">
                                    Filtre por nivel de prioridad
                                </div>
                            </div>
                            
                            <div class="filter-search">
                                <label for="filtroBusqueda" class="form-label">Buscar</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-search" aria-hidden="true"></i>
                                    </span>
                                    <input type="text" 
                                           class="form-control" 
                                           id="filtroBusqueda" 
                                           placeholder="Código, título o descripción..."
                                           aria-describedby="filtroBusqueda-help"
                                           maxlength="100">
                                </div>
                                <div id="filtroBusqueda-help" class="visually-hidden">
                                    Busque por código, título o descripción
                                </div>
                            </div>
                        </form>
                        
                        <!-- Controles de filtros -->
                        <div class="mt-3 d-flex gap-2 flex-wrap">
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm hover-lift"
                                    onclick="SeguimientoApp.limpiarFiltros()"
                                    aria-label="Limpiar todos los filtros"
                                    title="Limpiar todos los filtros">
                                <i class="bi bi-x-circle me-1" aria-hidden="true"></i>
                                Limpiar Filtros
                            </button>
                            <div class="ms-auto">
                                <small class="text-muted" id="filtrosAplicados"></small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Vista de Seguimiento optimizada -->
            <section class="table-section" aria-labelledby="table-title">
                <div class="card card-animated">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h2 id="table-title" class="card-title mb-0 h5">
                            <i class="bi bi-list-check me-2" aria-hidden="true"></i>
                            Documentos en Seguimiento
                            <small class="badge bg-secondary ms-2" id="contadorDocumentos">0</small>
                        </h2>
                        <div class="table-controls d-flex gap-2">
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm hover-lift"
                                    onclick="SeguimientoApp.actualizarTodos()"
                                    aria-label="Actualizar todos los estados"
                                    id="btnActualizarTodos"
                                    title="Actualizar todos los estados">
                                <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
                                <span class="d-none d-md-inline">Actualizar</span>
                            </button>
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm hover-lift"
                                    onclick="SeguimientoApp.UI.toggleViewMode()"
                                    aria-label="Cambiar vista"
                                    id="toggleViewBtn"
                                    title="Cambiar entre vista tabla y kanban">
                                <i class="bi bi-kanban" aria-hidden="true"></i>
                                <span class="d-none d-md-inline">Vista Kanban</span>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Indicador de estado de conexión -->
                        <div id="estadoConexion" class="alert alert-warning d-none" role="alert">
                            <i class="bi bi-wifi-off me-2"></i>
                            Sin conexión a internet. Los datos pueden no estar actualizados.
                        </div>
                        
                        <div id="contenedorSeguimiento" aria-live="polite" aria-label="Contenido de seguimiento">
                            <div class="loading-container" role="status" aria-label="Cargando">
                                <div class="loading-spinner" aria-hidden="true"></div>
                                <p>Cargando seguimiento de documentos...</p>
                            </div>
                        </div>
                        
                        <!-- Paginación optimizada -->
                        <nav aria-label="Paginación de seguimiento" class="mt-4">
                            <ul class="pagination justify-content-center" id="paginacionSeguimiento">
                                <!-- Se llenará dinámicamente -->
                            </ul>
                        </nav>
                        
                        <!-- Información adicional -->
                        <div class="mt-3 d-flex justify-content-between align-items-center text-muted">
                            <small id="infoResultados"></small>
                            <small id="ultimaActualizacion"></small>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Toast Container -->
        <div class="toast-container position-fixed top-0 end-0 p-3" 
             id="toastContainer" 
             aria-live="polite" 
             aria-atomic="true">
        </div>
    </main>

    <!-- Modal Agregar Seguimiento -->
    <div class="modal fade" 
         id="modalAgregarSeguimiento" 
         tabindex="-1" 
         aria-labelledby="modalAgregarSeguimientoLabel" 
         aria-hidden="true"
         data-bs-backdrop="static"
         data-bs-keyboard="false">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalAgregarSeguimientoLabel">
                        <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
                        Agregar Documento a Seguimiento
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formAgregarSeguimiento" novalidate autocomplete="off">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="documentoSeguimiento" class="form-label">
                                        Documento <span class="text-danger" aria-label="requerido">*</span>
                                    </label>
                                    <select class="form-select" 
                                            id="documentoSeguimiento" 
                                            required
                                            aria-describedby="documentoSeguimiento-error documentoSeguimiento-help">
                                        <option value="">Seleccione un documento</option>
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                    <div class="invalid-feedback" id="documentoSeguimiento-error">
                                        Por favor seleccione un documento.
                                    </div>
                                    <div id="documentoSeguimiento-help" class="form-text">
                                        Solo se muestran documentos disponibles para seguimiento.
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="responsableSeguimiento" class="form-label">
                                        Responsable <span class="text-danger" aria-label="requerido">*</span>
                                    </label>
                                    <select class="form-select" 
                                            id="responsableSeguimiento" 
                                            required
                                            aria-describedby="responsableSeguimiento-error responsableSeguimiento-help">
                                        <option value="">Seleccione un responsable</option>
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                    <div class="invalid-feedback" id="responsableSeguimiento-error">
                                        Por favor seleccione un responsable.
                                    </div>
                                    <div id="responsableSeguimiento-help" class="form-text">
                                        Usuario que se encargará del seguimiento del documento.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="prioridadSeguimiento" class="form-label">Prioridad</label>
                                    <select class="form-select" 
                                            id="prioridadSeguimiento"
                                            aria-describedby="prioridadSeguimiento-help">
                                        <option value="Media" selected>Media</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Baja">Baja</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                    <div id="prioridadSeguimiento-help" class="form-text">
                                        Establece la prioridad del seguimiento.
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="fechaLimiteSeguimiento" class="form-label">Fecha Límite</label>
                                    <input type="date" 
                                           class="form-control" 
                                           id="fechaLimiteSeguimiento"
                                           min="<%= new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date()) %>"
                                           aria-describedby="fechaLimiteSeguimiento-help">
                                    <div id="fechaLimiteSeguimiento-help" class="form-text">
                                        Fecha límite para completar el seguimiento (opcional).
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="observacionesSeguimiento" class="form-label">Observaciones Iniciales</label>
                            <textarea class="form-control" 
                                      id="observacionesSeguimiento" 
                                      rows="3" 
                                      placeholder="Instrucciones o comentarios para el seguimiento..."
                                      maxlength="500"
                                      aria-describedby="observacionesSeguimiento-help"></textarea>
                            <div id="observacionesSeguimiento-help" class="form-text">
                                Máximo 500 caracteres. <span id="contadorCaracteres">0/500</span>
                            </div>
                        </div>

                        <!-- Vista previa del documento seleccionado -->
                        <div id="previsualizacionDocumento" class="d-none">
                            <hr>
                            <h6 class="text-primary">
                                <i class="bi bi-eye me-2"></i>
                                Vista previa del documento
                            </h6>
                            <div id="infoDocumentoSeleccionado" class="p-3 bg-light rounded">
                                <!-- Se llenará dinámicamente -->
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" 
                            class="btn btn-secondary" 
                            data-bs-dismiss="modal">
                        <i class="bi bi-x-lg me-1"></i>
                        Cancelar
                    </button>
                    <button type="button" 
                            class="btn btn-primary" 
                            onclick="SeguimientoApp.agregarSeguimiento()"
                            id="btnAgregarSeguimiento"
                            data-loading>
                        <span class="spinner-border spinner-border-sm me-1 d-none" 
                              role="status" 
                              aria-hidden="true"></span>
                        <i class="bi bi-check-lg me-1" aria-hidden="true"></i>
                        Crear Seguimiento
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Actualizar Estado -->
    <div class="modal fade" 
         id="modalActualizarEstado" 
         tabindex="-1" 
         aria-labelledby="modalActualizarEstadoLabel" 
         aria-hidden="true"
         data-bs-backdrop="static"
         data-bs-keyboard="false">
        <div class="modal-dialog">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalActualizarEstadoLabel">
                        <i class="bi bi-arrow-up-circle me-2" aria-hidden="true"></i>
                        Actualizar Estado de Seguimiento
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formActualizarEstado" novalidate autocomplete="off">
                        <input type="hidden" id="seguimientoId">
                        
                        <div class="mb-3">
                            <label class="form-label">Información del Documento</label>
                            <div class="document-info">
                                <div id="infoDocumentoActualizar" class="p-3 bg-light rounded">
                                    <!-- Se llenará dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="nuevoEstado" class="form-label">
                                Nuevo Estado <span class="text-danger" aria-label="requerido">*</span>
                            </label>
                            <select class="form-select" 
                                    id="nuevoEstado" 
                                    required
                                    aria-describedby="nuevoEstado-error nuevoEstado-help">
                                <option value="">Seleccione un estado</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Revision">En Revisión</option>
                                <option value="Observado">Observado</option>
                                <option value="Aprobado">Aprobado</option>
                                <option value="Completado">Completado</option>
                                <option value="Rechazado">Rechazado</option>
                            </select>
                            <div class="invalid-feedback" id="nuevoEstado-error">
                                Por favor seleccione un estado.
                            </div>
                            <div id="nuevoEstado-help" class="form-text">
                                El estado será registrado en el historial del documento.
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="comentarioActualizacion" class="form-label">
                                Comentario sobre la actualización
                            </label>
                            <textarea class="form-control" 
                                      id="comentarioActualizacion" 
                                      rows="4" 
                                      placeholder="Agregue un comentario sobre la actualización..."
                                      maxlength="1000"
                                      aria-describedby="comentarioActualizacion-help"></textarea>
                            <div id="comentarioActualizacion-help" class="form-text">
                                Opcional. Máximo 1000 caracteres. <span id="contadorComentario">0/1000</span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" 
                            class="btn btn-secondary" 
                            data-bs-dismiss="modal">
                        <i class="bi bi-x-lg me-1"></i>
                        Cancelar
                    </button>
                    <button type="button" 
                            class="btn btn-success" 
                            onclick="SeguimientoApp.actualizarEstado()"
                            id="btnActualizarEstado"
                            data-loading>
                        <span class="spinner-border spinner-border-sm me-1 d-none" 
                              role="status" 
                              aria-hidden="true"></span>
                        <i class="bi bi-check-lg me-1" aria-hidden="true"></i>
                        Actualizar Estado
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Timeline -->
    <div class="modal fade" 
         id="modalTimeline" 
         tabindex="-1" 
         aria-labelledby="modalTimelineLabel" 
         aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalTimelineLabel">
                        <i class="bi bi-clock-history me-2" aria-hidden="true"></i>
                        Cronología del Documento
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body" id="timelineContent">
                    <!-- Se llenará dinámicamente -->
                </div>
                <div class="modal-footer">
                    <button type="button" 
                            class="btn btn-secondary" 
                            data-bs-dismiss="modal">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts optimizados -->
    <link href="./assets/css/seguimiento.css" rel="stylesheet">
    <script src="./assets/js/seguimiento.js" defer></script>
    
    <!-- Variables globales para el módulo -->
    <script>
        window.SEGUIMIENTO_CONFIG = {
            usuarioId: <%= usuarioId %>,
            nombreUsuario: '<%= nombreCompleto != null ? nombreCompleto : "" %>',
            puedeGestionar: <%= puedeGestionarSeguimiento %>
        };
    </script>

    <%@ include file="modules/footer.jsp" %>
</body>
</html>