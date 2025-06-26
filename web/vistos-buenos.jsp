<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@page import="java.sql.*, Config.Conexion, java.util.*"%>

    <%@ include file="modules/head.jsp" %>

<body>
    <%@ include file="modules/topbar.jsp" %>
    <%@include file="modules/sidebar.jsp" %>
    
    <main class="main" role="main">
        <div class="vistos-buenos-container">
            <!-- Skip to content link for accessibility -->
            <a href="#main-content" class="visually-hidden-focusable">Saltar al contenido principal</a>
            
            <!-- Header de la página -->
            <header class="page-header" id="main-content">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h1 class="page-title">
                            <i class="bi bi-check-circle me-3" aria-hidden="true"></i>
                            Gestión de Vistos Buenos
                        </h1>
                        <p class="page-subtitle text-muted">
                            Administre las aprobaciones y observaciones de documentos
                        </p>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <button type="button" 
                                class="btn btn-outline-primary"
                                onclick="exportarVistosBuenos()"
                                aria-label="Exportar lista de vistos buenos">
                            <i class="bi bi-download me-1" aria-hidden="true"></i>
                            Exportar
                        </button>
                        <button type="button" 
                                class="btn btn-primary" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modalAsignarVistoBueno"
                                aria-label="Asignar nuevo visto bueno">
                            <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>
                            Asignar Visto Bueno
                        </button>
                    </div>
                </div>
            </header>

            <!-- Estadísticas -->
            <section class="stats-section mb-4" aria-labelledby="stats-title">
                <h2 id="stats-title" class="visually-hidden">Estadísticas de Vistos Buenos</h2>
                <div class="row stats-grid">
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Vistos buenos pendientes">
                            <div class="stats-icon bg-warning" aria-hidden="true">
                                <i class="bi bi-clock-history"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statPendientes" aria-live="polite">0</h3>
                                <p>Pendientes</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Vistos buenos aprobados">
                            <div class="stats-icon bg-success" aria-hidden="true">
                                <i class="bi bi-check-circle"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statAprobados" aria-live="polite">0</h3>
                                <p>Aprobados</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Vistos buenos observados">
                            <div class="stats-icon bg-danger" aria-hidden="true">
                                <i class="bi bi-exclamation-triangle"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statObservados" aria-live="polite">0</h3>
                                <p>Observados</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6">
                        <div class="stats-card" role="img" aria-label="Total de vistos buenos">
                            <div class="stats-icon bg-info" aria-hidden="true">
                                <i class="bi bi-graph-up"></i>
                            </div>
                            <div class="stats-content">
                                <h3 id="statTotal" aria-live="polite">0</h3>
                                <p>Total</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Filtros -->
            <section class="filters-section mb-4" aria-labelledby="filters-title">
                <div class="card card-animated">
                    <div class="card-header">
                        <h2 id="filters-title" class="card-title mb-0 h5">
                            <i class="bi bi-funnel me-2" aria-hidden="true"></i>
                            Filtros de Búsqueda
                        </h2>
                    </div>
                    <div class="card-body">
                        <form class="filters-grid" role="search" aria-label="Filtros de búsqueda">
                            <div>
                                <label for="filtroEstado" class="form-label">Estado</label>
                                <select class="form-select" 
                                        id="filtroEstado" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroEstado-help">
                                    <option value="">Todos los estados</option>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Aprobado">Aprobado</option>
                                    <option value="Observado">Observado</option>
                                </select>
                                <div id="filtroEstado-help" class="visually-hidden">
                                    Filtre por estado de visto bueno
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroFecha" class="form-label">Período</label>
                                <select class="form-select" 
                                        id="filtroFecha" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroFecha-help">
                                    <option value="">Todo el período</option>
                                    <option value="hoy">Hoy</option>
                                    <option value="semana">Esta semana</option>
                                    <option value="mes">Este mes</option>
                                    <option value="trimestre">Este trimestre</option>
                                </select>
                                <div id="filtroFecha-help" class="visually-hidden">
                                    Filtre por período de tiempo
                                </div>
                            </div>
                            
                            <div>
                                <label for="filtroUsuario" class="form-label">Revisor</label>
                                <select class="form-select" 
                                        id="filtroUsuario" 
                                        onchange="aplicarFiltros()"
                                        aria-describedby="filtroUsuario-help">
                                    <option value="">Todos los revisores</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div id="filtroUsuario-help" class="visually-hidden">
                                    Filtre por usuario revisor
                                </div>
                            </div>
                            
                            <div class="filter-search">
                                <label for="filtroBusqueda" class="form-label">Buscar</label>
                                <input type="text" 
                                       class="form-control" 
                                       id="filtroBusqueda" 
                                       placeholder="Código de documento..."
                                       onkeyup="debounce(aplicarFiltros, 300)()"
                                       aria-describedby="filtroBusqueda-help">
                                <div id="filtroBusqueda-help" class="visually-hidden">
                                    Busque por código o título de documento
                                </div>
                            </div>
                        </form>
                        
                        <!-- Limpiar filtros -->
                        <div class="mt-3">
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm"
                                    onclick="limpiarFiltros()"
                                    aria-label="Limpiar todos los filtros">
                                <i class="bi bi-x-circle me-1" aria-hidden="true"></i>
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Lista de Vistos Buenos -->
            <section class="table-section" aria-labelledby="table-title">
                <div class="card card-animated">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h2 id="table-title" class="card-title mb-0 h5">
                            <i class="bi bi-list-ul me-2" aria-hidden="true"></i>
                            Vistos Buenos Asignados
                        </h2>
                        <div class="table-controls">
                            <button type="button" 
                                    class="btn btn-outline-secondary btn-sm"
                                    onclick="toggleViewMode()"
                                    aria-label="Cambiar vista"
                                    id="toggleViewBtn">
                                <i class="bi bi-grid-3x3-gap" aria-hidden="true"></i>
                                Vista Cards
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="tablaVistosBuenosContainer" aria-live="polite" aria-label="Contenido de vistos buenos">
                            <div class="loading-container" role="status" aria-label="Cargando">
                                <div class="loading-spinner" aria-hidden="true"></div>
                                <p>Cargando vistos buenos...</p>
                            </div>
                        </div>
                        
                        <!-- Paginación -->
                        <nav aria-label="Paginación de vistos buenos" class="mt-4">
                            <ul class="pagination justify-content-center" id="paginacionVistosBuenos">
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

    <!-- Modal Procesar Visto Bueno -->
    <div class="modal fade" 
         id="modalProcesarVistoBueno" 
         tabindex="-1" 
         aria-labelledby="modalProcesarVistoBuenoLabel" 
         aria-hidden="true"
         data-bs-backdrop="static">
        <div class="modal-dialog">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalProcesarVistoBuenoLabel">
                        <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
                        Procesar Visto Bueno
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formProcesarVistoBueno" novalidate>
                        <input type="hidden" id="vistoBuenoId">
                        
                        <div class="mb-3">
                            <label class="form-label">Documento</label>
                            <div class="document-info">
                                <div id="documentoInfo" class="p-3 bg-light rounded">
                                    <!-- Se llenará dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="estadoVistoBueno" class="form-label">
                                Estado <span class="text-danger" aria-label="requerido">*</span>
                            </label>
                            <select class="form-select" 
                                    id="estadoVistoBueno" 
                                    required
                                    aria-describedby="estadoVistoBueno-error">
                                <option value="">Seleccione un estado</option>
                                <option value="Aprobado">Aprobar</option>
                                <option value="Observado">Observar</option>
                            </select>
                            <div class="invalid-feedback" id="estadoVistoBueno-error">
                                Por favor seleccione un estado.
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="observacionesVistoBueno" class="form-label">Observaciones</label>
                            <textarea class="form-control" 
                                      id="observacionesVistoBueno" 
                                      rows="4" 
                                      placeholder="Ingrese sus observaciones..."
                                      maxlength="1000"
                                      aria-describedby="observacionesVistoBueno-help observacionesVistoBueno-count"></textarea>
                            <div class="form-text" id="observacionesVistoBueno-help">
                                Las observaciones son obligatorias para documentos observados
                            </div>
                            <div class="form-text" id="observacionesVistoBueno-count">
                                <span id="charCount">0</span>/1000 caracteres
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
                            class="btn btn-success" 
                            onclick="procesarVistoBueno()"
                            id="btnProcesar">
                        <span class="spinner-border spinner-border-sm me-1 d-none" 
                              role="status" 
                              aria-hidden="true"></span>
                        <i class="bi bi-check-lg me-1" aria-hidden="true"></i>
                        Procesar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Asignar Visto Bueno -->
    <div class="modal fade" 
         id="modalAsignarVistoBueno" 
         tabindex="-1" 
         aria-labelledby="modalAsignarVistoBuenoLabel" 
         aria-hidden="true"
         data-bs-backdrop="static">
        <div class="modal-dialog">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalAsignarVistoBuenoLabel">
                        <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>
                        Asignar Visto Bueno
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formAsignarVistoBueno" novalidate>
                        <div class="mb-3">
                            <label for="documentoAsignar" class="form-label">
                                Documento <span class="text-danger" aria-label="requerido">*</span>
                            </label>
                            <select class="form-select" 
                                    id="documentoAsignar" 
                                    required
                                    aria-describedby="documentoAsignar-error">
                                <option value="">Seleccione un documento</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                            <div class="invalid-feedback" id="documentoAsignar-error">
                                Por favor seleccione un documento.
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="usuarioRevisor" class="form-label">
                                Revisor <span class="text-danger" aria-label="requerido">*</span>
                            </label>
                            <select class="form-select" 
                                    id="usuarioRevisor" 
                                    required
                                    aria-describedby="usuarioRevisor-error">
                                <option value="">Seleccione un revisor</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                            <div class="invalid-feedback" id="usuarioRevisor-error">
                                Por favor seleccione un revisor.
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="observacionesAsignacion" class="form-label">Observaciones iniciales</label>
                            <textarea class="form-control" 
                                      id="observacionesAsignacion" 
                                      rows="3" 
                                      placeholder="Instrucciones o comentarios para el revisor..."
                                      maxlength="500"></textarea>
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
                            onclick="asignarVistoBueno()"
                            id="btnAsignar">
                        <span class="spinner-border spinner-border-sm me-1 d-none" 
                              role="status" 
                              aria-hidden="true"></span>
                        <i class="bi bi-check-lg me-1" aria-hidden="true"></i>
                        Asignar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Detalles Visto Bueno -->
    <div class="modal fade" 
         id="modalDetallesVistoBueno" 
         tabindex="-1" 
         aria-labelledby="modalDetallesVistoBuenoLabel" 
         aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h3 class="modal-title h5" id="modalDetallesVistoBuenoLabel">
                        <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
                        Detalles del Visto Bueno
                    </h3>
                    <button type="button" 
                            class="btn-close" 
                            data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body" id="detallesVistoBuenoContent">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>
        </div>
    </div>

    <!-- CSS y JS -->
    <link href="./assets/css/vistos-buenos.css" rel="stylesheet">
    <script src="./assets/js/vistos-buenos.js" defer></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>