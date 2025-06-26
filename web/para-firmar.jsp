<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@include file="modules/head.jsp" %>

<body>
    <!-- Header -->
    <%@include file="modules/topbar.jsp" %>

    <!-- Sidebar -->
    <%@include file="modules/sidebar.jsp" %>

    <!-- Contenido Principal -->
    <main class="main">
        <div class="para-firmar-container">
                <div class="page-header d-flex justify-content-between align-items-center mb-4">
                    <h1 class="h2 page-title">
                        <i class="bi bi-pen me-2"></i>
                        Documentos para Firmar
                    </h1>
                    <div class="btn-toolbar">
                        <div class="btn-group me-2">
                            <button type="button" class="btn btn-outline-primary" onclick="cargarDocumentos()">
                                <i class="bi bi-arrow-clockwise me-1"></i>
                                Actualizar
                            </button>
                            <button type="button" class="btn btn-outline-success" onclick="window.location.href='gestion-certificados.jsp'">
                                <i class="bi bi-shield-check me-1"></i>
                                Mis Certificados
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Alertas -->
                <div id="alertContainer"></div>

                <!-- Estado de Certificados -->
                <div id="certificateStatusCard" class="card card-animated mb-4" style="display: none;">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <div id="certificateStatusContent">
                                    <!-- Contenido dinámico -->
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <button type="button" class="btn btn-primary" onclick="window.location.href='gestion-certificados.jsp'">
                                    <i class="bi bi-gear me-1"></i>
                                    Gestionar Certificados
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas Rápidas -->
                <div class="stats-grid">
                    <div class="stats-card bg-primary">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">Total Pendientes</h5>
                                    <h3 id="documentosPendientes" class="counter">0</h3>
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-file-earmark-text"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="stats-card bg-warning">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">Urgentes</h5>
                                    <h3 id="documentosUrgentes" class="counter">0</h3>
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-exclamation-triangle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="stats-card bg-info">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">Esta Semana</h5>
                                    <h3 id="documentosSemana" class="counter">0</h3>
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-calendar-week"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="stats-card bg-success">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">Firmados Hoy</h5>
                                    <h3 id="documentosFirmadosHoy" class="counter">0</h3>
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-check-circle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="card card-animated mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-funnel me-2"></i>
                            Filtros y Búsqueda
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="filters-grid">
                            <div>
                                <label for="filtroPrioridad" class="form-label">Prioridad</label>
                                <select class="form-select" id="filtroPrioridad" onchange="aplicarFiltros()">
                                    <option value="">Todas</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Urgente">Urgente</option>
                                </select>
                            </div>
                            <div>
                                <label for="filtroTipo" class="form-label">Tipo</label>
                                <select class="form-select" id="filtroTipo" onchange="aplicarFiltros()">
                                    <option value="">Todos</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                            </div>
                            <div>
                                <label for="filtroProyecto" class="form-label">Proyecto</label>
                                <select class="form-select" id="filtroProyecto" onchange="aplicarFiltros()">
                                    <option value="">Todos</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                            </div>
                            <div>
                                <label for="filtroOrden" class="form-label">Ordenar por</label>
                                <select class="form-select" id="filtroOrden" onchange="aplicarFiltros()">
                                    <option value="fecha_creacion">Fecha Creación</option>
                                    <option value="prioridad">Prioridad</option>
                                    <option value="titulo">Título</option>
                                    <option value="codigo">Código</option>
                                </select>
                            </div>
                            <div class="filter-search">
                                <label for="filtroBusqueda" class="form-label">Buscar</label>
                                <input type="text" class="form-control" id="filtroBusqueda" 
                                       placeholder="Código, título o descripción..." onkeyup="aplicarFiltros()">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lista de Documentos -->
                <div class="card card-animated">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-list-ul me-2"></i>
                            Documentos Pendientes de Firma
                        </h5>
                    </div>
                    <div class="card-body">
                        <div id="tablaDocumentosContainer">
                            <div class="loading-container">
                                <div class="loading-spinner"></div>
                                <p>Cargando documentos...</p>
                            </div>
                        </div>
                        
                        <!-- Paginación -->
                        <nav aria-label="Paginación documentos" class="mt-4">
                            <ul class="pagination justify-content-center" id="paginacionDocumentos">
                                <!-- Se llenará dinámicamente -->
                            </ul>
                        </nav>
                    </div>
                </div>
        </div>
    </main>

    <!-- Modal Firmar Documento -->
    <div class="modal fade" id="modalFirmarDocumento" tabindex="-1" aria-labelledby="modalFirmarDocumentoLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalFirmarDocumentoLabel">
                        <i class="bi bi-pen me-2"></i>
                        Firmar Documento Digital
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <!-- Información del Documento -->
                    <div class="mb-4">
                        <h6 class="text-primary">
                            <i class="bi bi-file-earmark-text me-2"></i>
                            Información del Documento
                        </h6>
                        <div class="card bg-light">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Código:</strong> <span id="firmaDocumentoCodigo">-</span></p>
                                        <p><strong>Título:</strong> <span id="firmaDocumentoTitulo">-</span></p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Tipo:</strong> <span id="firmaDocumentoTipo">-</span></p>
                                        <p><strong>Prioridad:</strong> <span id="firmaDocumentoPrioridad">-</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Selección de Certificado -->
                    <div class="mb-4">
                        <h6 class="text-primary">
                            <i class="bi bi-shield-check me-2"></i>
                            Certificado Digital
                        </h6>
                        <div class="row">
                            <div class="col-md-12">
                                <label for="certificadoId" class="form-label">Seleccionar Certificado</label>
                                <select class="form-select" id="certificadoId" required>
                                    <option value="">Seleccione un certificado...</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                            </div>
                        </div>
                        <!-- Información del Certificado Seleccionado -->
                        <div id="infoCertificadoSeleccionado" class="mt-3" style="display: none;">
                            <div class="alert alert-info">
                                <div id="certificadoInfo">
                                    <!-- Se llenará dinámicamente -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Contraseña del Certificado -->
                    <div class="mb-4">
                        <label for="passwordCertificadoFirma" class="form-label">
                            <i class="bi bi-key me-2"></i>
                            Contraseña del Certificado
                        </label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="passwordCertificadoFirma" 
                                   placeholder="Ingrese la contraseña de su certificado" required>
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="togglePasswordVisibility('passwordCertificadoFirma')">
                                <i class="bi bi-eye" id="iconPasswordCertificadoFirma"></i>
                            </button>
                        </div>
                        <div id="passwordValidationResult" class="mt-2"></div>
                    </div>

                    <!-- Información de Firma -->
                    <div class="mb-4">
                        <h6 class="text-primary">
                            <i class="bi bi-info-circle me-2"></i>
                            Información de la Firma
                        </h6>
                        <div class="row">
                            <div class="col-md-6">
                                <label for="razonFirma" class="form-label">Razón de la Firma</label>
                                <input type="text" class="form-control" id="razonFirma" 
                                       value="Revisión y aprobación de documento" 
                                       placeholder="Motivo de la firma">
                            </div>
                            <div class="col-md-6">
                                <label for="ubicacionFirma" class="form-label">Ubicación</label>
                                <input type="text" class="form-control" id="ubicacionFirma" 
                                       value="Lima, Perú" placeholder="Ubicación de la firma">
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-12">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="firmaVisible" checked>
                                    <label class="form-check-label" for="firmaVisible">
                                        Mostrar firma visible en el documento
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Observaciones -->
                    <div class="mb-4">
                        <label for="observacionesFirma" class="form-label">Observaciones (Opcional)</label>
                        <textarea class="form-control" id="observacionesFirma" rows="3" 
                                  placeholder="Comentarios adicionales sobre la firma..."></textarea>
                    </div>

                    <!-- Términos y Condiciones -->
                    <div class="alert alert-info">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="aceptarTerminos" required>
                            <label class="form-check-label" for="aceptarTerminos">
                                <small>
                                    Confirmo que tengo autorización para firmar este documento y que la información 
                                    proporcionada es correcta. La firma digital tendrá el mismo valor legal que una firma manuscrita.
                                </small>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" onclick="procederConFirma()">
                        <i class="bi bi-pen me-1"></i>
                        Confirmar Firma
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Ver Documento -->
    <div class="modal fade" id="modalVerDocumento" tabindex="-1" aria-labelledby="modalVerDocumentoLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalVerDocumentoLabel">
                        <i class="bi bi-file-earmark-text me-2"></i>
                        Vista Previa del Documento
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" style="height: 70vh;">
                    <div id="documentPreviewContainer" class="h-100">
                        <!-- Aquí se cargará la vista previa del documento -->
                        <div class="text-center mt-5">
                            <i class="bi bi-file-earmark-text" style="font-size: 4rem; color: #6c757d;"></i>
                            <p class="mt-3 text-muted">Vista previa del documento no disponible</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-primary" onclick="descargarDocumento()">
                        <i class="bi bi-download me-1"></i>
                        Descargar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <link href="./assets/css/para-firmar.css" rel="stylesheet">
    <script src="./assets/js/para-firmar.js"></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>