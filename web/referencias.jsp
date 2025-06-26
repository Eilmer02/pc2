<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@page import="java.sql.*, Config.Conexion, java.util.*"%>

    <%@ include file="modules/head.jsp" %>

<body>
    <%@ include file="modules/topbar.jsp" %>
    <%@include file="modules/sidebar.jsp" %>
    
    <main class="main" role="main">
        <div class="referencias-container">
            <!-- Skip to content link for accessibility -->
            <a href="#main-content" class="visually-hidden-focusable">Saltar al contenido principal</a>
            
            <!-- Header de la página -->
            <header class="page-header" id="main-content">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h1 class="page-title">
                            <i class="bi bi-link-45deg me-3" aria-hidden="true"></i>
                            Referencias de Documentos
                        </h1>
                        <p class="page-subtitle text-muted">
                            Gestione las relaciones y vínculos entre documentos del sistema
                        </p>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <button type="button" 
                                class="btn btn-outline-primary"
                                onclick="exportarReferencias()"
                                aria-label="Exportar reporte de referencias">
                            <i class="bi bi-download me-1" aria-hidden="true"></i>
                            Exportar Reporte
                        </button>
                        <button type="button" 
                                class="btn btn-outline-info"
                                onclick="verGrafoReferencias()"
                                aria-label="Ver grafo de referencias">
                            <i class="bi bi-diagram-3 me-1" aria-hidden="true"></i>
                            Ver Grafo
                        </button>
                        <button type="button" 
                                class="btn btn-primary" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modalAgregarReferencia"
                                aria-label="Agregar nueva referencia">
                            <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            Nueva Referencia
                        </button>
                    </div>
                </div>
            </header>

            <!-- Estadísticas de Referencias -->
            <section class="stats-section mb-4" aria-labelledby="stats-title">
                <h2 id="stats-title" class="visually-hidden">Estadísticas de Referencias</h2>
                <div class="row stats-grid">
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Total de referencias">
                            <div class="stats-icon bg-primary" aria-hidden="true">
                                <i class="bi bi-link-45deg"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statTotalReferencias" aria-live="polite">0</h3>
                                <p>Total Referencias</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Responde a">
                            <div class="stats-icon bg-success" aria-hidden="true">
                                <i class="bi bi-reply"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statRespondeA" aria-live="polite">0</h3>
                                <p>Responde a</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Relacionado con">
                            <div class="stats-icon bg-warning" aria-hidden="true">
                                <i class="bi bi-arrow-left-right"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statRelacionado" aria-live="polite">0</h3>
                                <p>Relacionado con</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Corrige documentos">
                            <div class="stats-icon bg-danger" aria-hidden="true">
                                <i class="bi bi-exclamation-triangle"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statCorrige" aria-live="polite">0</h3>
                                <p>Corrige a</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Corrige documentos">
                            <div class="stats-icon bg-dun" aria-hidden="true">
                                <i class="bi bi-paperclip"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statDeriva" aria-live="polite">0</h3>
                                <p>Deriva de</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Filtros Avanzados -->
            <section class="filters-section mb-4" aria-labelledby="filters-title">
                <div class="card card-animated">
                    <div class="card-header">
                        <h2 id="filters-title" class="card-title mb-0 h5">
                            <i class="bi bi-funnel me-2" aria-hidden="true"></i>
                            Filtros Avanzados de Referencias
                        </h2>
                    </div>
                    <div class="card-body">
                        <form class="filters-grid" role="search" aria-label="Filtros de referencias">
                            <div>
                                <label for="filtroTipoReferencia" class="form-label">Tipo de Referencia</label>
                                <select class="form-select" 
                                        id="filtroTipoReferencia" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroTipoReferencia-help">
                                    <option value="">Todos los tipos</option>
                                    <option value="Responde a">Responde a</option>
                                    <option value="Relacionado con">Relacionado con</option>
                                    <option value="Corrige a">Corrige a</option>
                                    <option value="Deriva de">Deriva de</option>
                                </select>
                                <div id="filtroTipoReferencia-help" class="visually-hidden">
                                    Filtre por tipo de referencia
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroDocumentoOrigen" class="form-label">Documento Origen</label>
                                <select class="form-select" 
                                        id="filtroDocumentoOrigen" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroDocumentoOrigen-help">
                                    <option value="">Todos los documentos</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div id="filtroDocumentoOrigen-help" class="visually-hidden">
                                    Filtre por documento origen
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroDocumentoReferenciado" class="form-label">Documento Referenciado</label>
                                <select class="form-select" 
                                        id="filtroDocumentoReferenciado" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroDocumentoReferenciado-help">
                                    <option value="">Todos los documentos</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div id="filtroDocumentoReferenciado-help" class="visually-hidden">
                                    Filtre por documento referenciado
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroProyecto" class="form-label">Proyecto</label>
                                <select class="form-select" 
                                        id="filtroProyecto" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroProyecto-help">
                                    <option value="">Todos los proyectos</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div id="filtroProyecto-help" class="visually-hidden">
                                    Filtre por proyecto
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroFechaInicio" class="form-label">Fecha Inicio</label>
                                <input type="date" 
                                       class="form-control" 
                                       id="filtroFechaInicio" 
                                       onchange="aplicarFiltros()"
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
                                       onchange="aplicarFiltros()"
                                       aria-describedby="filtroFechaFin-help">
                                <div id="filtroFechaFin-help" class="visually-hidden">
                                    Filtre hasta fecha de fin
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroTipoDocumento" class="form-label">Tipo de Documento</label>
                                <select class="form-select" 
                                        id="filtroTipoDocumento" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroTipoDocumento-help">
                                    <option value="">Todos los tipos</option>
                                    <option value="Contrato">Contrato</option>
                                    <option value="Informe">Informe</option>
                                    <option value="Planos">Planos</option>
                                    <option value="Presupuesto">Presupuesto</option>
                                    <option value="Certificado">Certificado</option>
                                </select>
                                <div id="filtroTipoDocumento-help" class="visually-hidden">
                                    Filtre por tipo de documento
                                </div>
                            </div>
                            
                            <div class="filter-search">
                                <label for="filtroBusqueda" class="form-label">Buscar</label>
                                <input type="text" 
                                       class="form-control" 
                                       id="filtroBusqueda" 
                                       placeholder="Código, título o descripción..."
                                       onkeyup="debounce(aplicarFiltros, 300)()"
                                       aria-describedby="filtroBusqueda-help">
                                <div id="filtroBusqueda-help" class="visually-hidden">
                                    Busque por código, título o descripción
                                </div>
                            </div>
                        </form>
                        
                        <!-- Controles de filtros -->
                        <div class="mt-3 d-flex gap-2 flex-wrap">
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm"
                                    onclick="limpiarFiltros()"
                                    aria-label="Limpiar todos los filtros">
                                <i class="bi bi-x-circle me-1" aria-hidden="true"></i>
                                Limpiar Filtros
                            </button>
                            <button type="button" 
                                    class="btn btn-outline-info btn-sm"
                                    onclick="guardarFiltrosFavoritos()"
                                    aria-label="Guardar filtros como favoritos">
                                <i class="bi bi-star me-1" aria-hidden="true"></i>
                                Guardar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Vista de Referencias -->
            <section class="table-section" aria-labelledby="table-title">
                <div class="card card-animated">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h2 id="table-title" class="card-title mb-0 h5">
                            <i class="bi bi-list-check me-2" aria-hidden="true"></i>
                            Referencias de Documentos
                        </h2>
                        <div class="table-controls d-flex gap-2">
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm"
                                    onclick="actualizarTodas()"
                                    aria-label="Actualizar todas las referencias"
                                    id="btnActualizarTodas">
                                <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
                                <span class="d-none d-md-inline">Actualizar</span>
                            </button>
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm"
                                    onclick="toggleViewMode()"
                                    aria-label="Cambiar vista"
                                    id="toggleViewBtn">
                                <i class="bi bi-diagram-3" aria-hidden="true"></i>
                                <span class="d-none d-md-inline">Vista Red</span>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="contenedorReferencias" aria-live="polite" aria-label="Contenido de referencias">
                            <div class="loading-container" role="status" aria-label="Cargando">
                                <div class="loading-spinner" aria-hidden="true"></div>
                                <p>Cargando referencias de documentos...</p>
                            </div>
                        </div>
                        
                        <!-- Paginación -->
                        <nav aria-label="Paginación de referencias" class="mt-4">
                            <ul class="pagination justify-content-center" id="paginacionReferencias">
                                <!-- Se llenará dinámicamente -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </section>
        </div>

        <!-- Toast Container -->
        <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer">
            <!-- Toasts se insertan aquí dinámicamente -->
        </div>
    </main>

    <!-- Modal Agregar Referencia -->
    <div class="modal fade" 
         id="modalAgregarReferencia" 
         tabindex="-1" 
         aria-labelledby="modalAgregarReferenciaLabel" 
         aria-hidden="true"
         data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalAgregarReferenciaLabel">
                        <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
                        Agregar Nueva Referencia
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formAgregarReferencia" novalidate>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="documentoOrigen" class="form-label">
                                        Documento Origen <span class="text-danger" aria-label="requerido">*</span>
                                    </label>
                                    <select class="form-select" 
                                            id="documentoOrigen" 
                                            required
                                            aria-describedby="documentoOrigen-error">
                                        <option value="">Seleccione documento origen</option>
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                    <div class="invalid-feedback" id="documentoOrigen-error">
                                        Por favor seleccione un documento origen.
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="documentoReferenciado" class="form-label">
                                        Documento Referenciado <span class="text-danger" aria-label="requerido">*</span>
                                    </label>
                                    <select class="form-select" 
                                            id="documentoReferenciado" 
                                            required
                                            aria-describedby="documentoReferenciado-error">
                                        <option value="">Seleccione documento referenciado</option>
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                    <div class="invalid-feedback" id="documentoReferenciado-error">
                                        Por favor seleccione un documento referenciado.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="tipoReferencia" class="form-label">
                                        Tipo de Referencia <span class="text-danger" aria-label="requerido">*</span>
                                    </label>
                                    <select class="form-select" 
                                            id="tipoReferencia" 
                                            required
                                            aria-describedby="tipoReferencia-error">
                                        <option value="">Seleccione tipo de referencia</option>
                                        <option value="Responde a">Responde a</option>
                                        <option value="Relacionado con">Relacionado con</option>
                                        <option value="Corrige a">Corrige a</option>
                                        <option value="Deriva de">Deriva de</option>
                                    </select>
                                    <div class="invalid-feedback" id="tipoReferencia-error">
                                        Por favor seleccione un tipo de referencia.
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="fechaReferencia" class="form-label">Fecha de Referencia</label>
                                    <input type="date" 
                                           class="form-control" 
                                           id="fechaReferencia">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="observacionesReferencia" class="form-label">Observaciones</label>
                            <textarea class="form-control" 
                                      id="observacionesReferencia" 
                                      rows="3" 
                                      placeholder="Describa la relación entre los documentos..."
                                      maxlength="500"></textarea>
                        </div>

                        <!-- Información de documentos seleccionados -->
                        <div class="row" id="infoDocumentosSeleccionados" style="display: none;">
                            <div class="col-md-6">
                                <div class="card border-primary">
                                    <div class="card-header bg-primary text-white">
                                        <h6 class="mb-0">Documento Origen</h6>
                                    </div>
                                    <div class="card-body" id="infoDocumentoOrigen">
                                        <!-- Se llenará dinámicamente -->
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-success">
                                    <div class="card-header bg-success text-white">
                                        <h6 class="mb-0">Documento Referenciado</h6>
                                    </div>
                                    <div class="card-body" id="infoDocumentoReferenciado">
                                        <!-- Se llenará dinámicamente -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" 
                            class="btn btn-secondary" 
                            data-bs-dismiss="modal">
                        Cancelar
                    </button>
                    <button type="button" 
                            class="btn btn-primary" 
                            onclick="agregarReferencia()"
                            id="btnAgregarReferencia">
                        <span class="spinner-border spinner-border-sm me-1 d-none" 
                              role="status" 
                              aria-hidden="true"></span>
                        <i class="bi bi-check-lg me-1" aria-hidden="true"></i>
                        Crear Referencia
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Editar Referencia -->
    <div class="modal fade" 
         id="modalEditarReferencia" 
         tabindex="-1" 
         aria-labelledby="modalEditarReferenciaLabel" 
         aria-hidden="true"
         data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalEditarReferenciaLabel">
                        <i class="bi bi-pencil-square me-2" aria-hidden="true"></i>
                        Editar Referencia
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formEditarReferencia" novalidate>
                        <input type="hidden" id="referenciaId">
                        
                        <div class="mb-3">
                            <label class="form-label">Documentos Relacionados</label>
                            <div class="documents-info">
                                <div id="infoReferenciaEditar" class="p-3 bg-light rounded">
                                    <!-- Se llenará dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="nuevoTipoReferencia" class="form-label">
                                        Tipo de Referencia <span class="text-danger" aria-label="requerido">*</span>
                                    </label>
                                    <select class="form-select" 
                                            id="nuevoTipoReferencia" 
                                            required
                                            aria-describedby="nuevoTipoReferencia-error">
                                        <option value="">Seleccione tipo de referencia</option>
                                        <option value="Responde a">Responde a</option>
                                        <option value="Relacionado con">Relacionado con</option>
                                        <option value="Corrige a">Corrige a</option>
                                        <option value="Deriva de">Deriva de</option>
                                    </select>
                                    <div class="invalid-feedback" id="nuevoTipoReferencia-error">
                                        Por favor seleccione un tipo de referencia.
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="nuevaFechaReferencia" class="form-label">Fecha de Referencia</label>
                                    <input type="date" 
                                           class="form-control" 
                                           id="nuevaFechaReferencia">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="nuevasObservaciones" class="form-label">Observaciones</label>
                            <textarea class="form-control" 
                                      id="nuevasObservaciones" 
                                      rows="4" 
                                      placeholder="Actualice la descripción de la relación..."
                                      maxlength="1000"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" 
                            class="btn btn-secondary" 
                            data-bs-dismiss="modal">
                        Cancelar
                    </button>
                    <button type="button" 
                            class="btn btn-success" 
                            onclick="actualizarReferencia()"
                            id="btnActualizarReferencia">
                        <span class="spinner-border spinner-border-sm me-1 d-none" 
                              role="status" 
                              aria-hidden="true"></span>
                        <i class="bi bi-check-lg me-1" aria-hidden="true"></i>
                        Actualizar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Ver Detalles -->
    <div class="modal fade" 
         id="modalDetalleReferencia" 
         tabindex="-1" 
         aria-labelledby="modalDetalleReferenciaLabel" 
         aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalDetalleReferenciaLabel">
                        <i class="bi bi-eye me-2" aria-hidden="true"></i>
                        Detalles de la Referencia
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body" id="detalleReferenciaContent">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Grafo de Referencias -->
    <div class="modal fade" 
         id="modalGrafoReferencias" 
         tabindex="-1" 
         aria-labelledby="modalGrafoReferenciasLabel" 
         aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalGrafoReferenciasLabel">
                        <i class="bi bi-diagram-3 me-2" aria-hidden="true"></i>
                        Red de Referencias de Documentos
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body p-0">
                    <div id="grafoReferenciaContent" style="height: 80vh;">
                        <!-- Canvas para el grafo se insertará aquí -->
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-secondary" onclick="resetZoomGrafo()">
                            <i class="bi bi-arrows-fullscreen"></i> Reset Zoom
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="exportarGrafo()">
                            <i class="bi bi-download"></i> Exportar
                        </button>
                    </div>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>
  
    <!-- CSS y JS -->
    <link href="./assets/css/referencias.css" rel="stylesheet">
    <script src="./assets/js/referencias.js" defer></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>