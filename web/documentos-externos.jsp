<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page trimDirectiveWhitespaces="true" %>
<%@ page import="java.util.*" %>
<%@ page import="java.text.SimpleDateFormat" %>

<%@ include file="modules/head.jsp" %>

<body>
    <!-- Accesibilidad: Skip Link -->
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
    
    <!-- ==================== TOP BAR MODULE ==================== -->
    <%@ include file="modules/topbar.jsp" %>
    
    <!-- ==================== SIDEBAR/HEADER MODULE ==================== -->
    <%@ include file="modules/sidebar.jsp" %>
    
    <!-- ==================== MAIN CONTENT ==================== -->
    <main class="main" id="main-content">
        <div class="documentos-externos-container">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="page-title">
                    <i class="bi bi-cloud-arrow-down me-3"></i>
                    Documentos Externos
                </h1>
                <p class="page-subtitle">
                    Gestión y registro de documentos recibidos de entidades externas
                </p>
                
                <!-- Estadísticas Rápidas -->
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="totalExternos">89</span>
                        <span class="stat-label">Total Externos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="pendientesRevision">15</span>
                        <span class="stat-label">Pendientes Revisión</span>
                    </div>
                    <div class="stat-item success">
                        <span class="stat-number" id="procesados">62</span>
                        <span class="stat-label">Procesados</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="recientesExternos">7</span>
                        <span class="stat-label">Últimos 7 días</span>
                    </div>
                </div>
            </div>

            <!-- Acciones Principales -->
            <div class="actions-bar">
                <div class="actions-left">
                    <button class="btn btn-primary" onclick="registrarDocumentoExterno()">
                        <i class="bi bi-plus-lg me-2"></i>
                        Registrar Documento
                    </button>
                    <button class="btn btn-outline-secondary" onclick="actualizarListaExternos()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Actualizar
                    </button>
                </div>
                <div class="actions-right">
                    <button class="btn btn-outline-info" onclick="importarMasivo()">
                        <i class="bi bi-upload me-2"></i>
                        Importar Masivo
                    </button>
                    <button class="btn btn-outline-success" onclick="exportarRegistros()">
                        <i class="bi bi-download me-2"></i>
                        Exportar Registros
                    </button>
                </div>
            </div>

            <!-- Filtros Avanzados -->
            <div class="card filters-card">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-funnel me-2"></i>
                        Filtros de Búsqueda
                    </h5>
                    <button class="btn btn-sm btn-outline-secondary" onclick="limpiarFiltrosExternos()">
                        <i class="bi bi-x-circle me-1"></i>
                        Limpiar
                    </button>
                </div>
                <div class="card-body">
                    <div class="filters-grid">
                        <div>
                            <label for="filtroEstadoExternos" class="form-label">Estado</label>
                            <select class="form-select" id="filtroEstadoExternos" onchange="aplicarFiltrosExternos()">
                                <option value="">Todos los estados</option>
                                <option value="Registrado">Registrado</option>
                                <option value="En Revisión">En Revisión</option>
                                <option value="Procesado">Procesado</option>
                                <option value="Archivado">Archivado</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroEntidadExternos" class="form-label">Entidad Emisora</label>
                            <select class="form-select" id="filtroEntidadExternos" onchange="aplicarFiltrosExternos()">
                                <option value="">Todas las entidades</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroTipoExternos" class="form-label">Tipo de Documento</label>
                            <select class="form-select" id="filtroTipoExternos" onchange="aplicarFiltrosExternos()">
                                <option value="">Todos los tipos</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroCategoriaExternos" class="form-label">Categoría</label>
                            <select class="form-select" id="filtroCategoriaExternos" onchange="aplicarFiltrosExternos()">
                                <option value="">Todas las categorías</option>
                                <option value="Normativo">Normativo</option>
                                <option value="Técnico">Técnico</option>
                                <option value="Administrativo">Administrativo</option>
                                <option value="Legal">Legal</option>
                                <option value="Financiero">Financiero</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroOrdenExternos" class="form-label">Ordenar por</label>
                            <select class="form-select" id="filtroOrdenExternos" onchange="aplicarFiltrosExternos()">
                                <option value="fecha_recepcion">Fecha Recepción</option>
                                <option value="fecha_emision">Fecha Emisión</option>
                                <option value="entidad">Entidad Emisora</option>
                                <option value="numero">Número Documento</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroFechaExternos" class="form-label">Periodo</label>
                            <select class="form-select" id="filtroFechaExternos" onchange="aplicarFiltrosExternos()">
                                <option value="">Cualquier periodo</option>
                                <option value="hoy">Hoy</option>
                                <option value="semana">Esta Semana</option>
                                <option value="mes">Este Mes</option>
                                <option value="trimestre">Este Trimestre</option>
                            </select>
                        </div>
                        <div class="filter-search">
                            <label for="filtroBusquedaExternos" class="form-label">Buscar</label>
                            <input type="text" class="form-control" id="filtroBusquedaExternos" 
                                   placeholder="Número, asunto, entidad..." onkeyup="aplicarFiltrosExternos()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Documentos -->
            <div class="card card-animated">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Documentos Externos Registrados
                    </h5>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="seleccionarTodosExternos()">
                            <i class="bi bi-check-all me-1"></i>
                            Seleccionar Todos
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="procesarSeleccionados()">
                            <i class="bi bi-gear me-1"></i>
                            Procesar Seleccionados
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="tablaExternosContainer">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>Cargando documentos externos...</p>
                        </div>
                    </div>
                    
                    <!-- Paginación -->
                    <nav aria-label="Paginación externos" class="mt-4">
                        <ul class="pagination justify-content-center" id="paginacionExternos">
                            <!-- Se llenará dinámicamente -->
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Registrar Documento Externo -->
    <div class="modal fade" id="modalRegistrarExterno" tabindex="-1" aria-labelledby="modalRegistrarExternoLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalRegistrarExternoLabel">
                        <i class="bi bi-plus-circle me-2"></i>
                        Registrar Documento Externo
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formRegistrarExterno">
                        <!-- Información Básica -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-info-circle me-2"></i>
                                Información Básica del Documento
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="numeroDocumento" class="form-label">Número de Documento *</label>
                                        <input type="text" class="form-control" id="numeroDocumento" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fechaEmisionDoc" class="form-label">Fecha de Emisión *</label>
                                        <input type="date" class="form-control" id="fechaEmisionDoc" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="asuntoDocumento" class="form-label">Asunto del Documento *</label>
                                <input type="text" class="form-control" id="asuntoDocumento" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="descripcionDocumento" class="form-label">Descripción</label>
                                <textarea class="form-control" id="descripcionDocumento" rows="3" 
                                          placeholder="Descripción detallada del contenido del documento..."></textarea>
                            </div>
                        </div>

                        <!-- Información de la Entidad -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-building me-2"></i>
                                Entidad Emisora
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="entidadEmisora" class="form-label">Entidad *</label>
                                        <select class="form-select" id="entidadEmisora" required onchange="actualizarContactos()">
                                            <option value="">Seleccione una entidad...</option>
                                            <!-- Se llenará dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="contactoEntidad" class="form-label">Contacto</label>
                                        <select class="form-select" id="contactoEntidad">
                                            <option value="">Seleccione un contacto...</option>
                                            <!-- Se llenará dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Clasificación -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-tags me-2"></i>
                                Clasificación
                            </h6>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="tipoDocumentoExt" class="form-label">Tipo de Documento *</label>
                                        <select class="form-select" id="tipoDocumentoExt" required>
                                            <option value="">Seleccione un tipo...</option>
                                            <!-- Se llenará dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="categoriaDocumento" class="form-label">Categoría *</label>
                                        <select class="form-select" id="categoriaDocumento" required>
                                            <option value="">Seleccione una categoría...</option>
                                            <option value="Normativo">Normativo</option>
                                            <option value="Técnico">Técnico</option>
                                            <option value="Administrativo">Administrativo</option>
                                            <option value="Legal">Legal</option>
                                            <option value="Financiero">Financiero</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="prioridadDocumento" class="form-label">Prioridad</label>
                                        <select class="form-select" id="prioridadDocumento">
                                            <option value="Normal">Normal</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Urgente">Urgente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Archivos -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-file-earmark me-2"></i>
                                Archivos del Documento
                            </h6>
                            <div class="border rounded p-3" id="areaArchivosExterno">
                                <div class="text-center">
                                    <i class="bi bi-cloud-upload fs-2 text-muted"></i>
                                    <p class="text-muted">Arrastre archivos aquí o haga clic para seleccionar</p>
                                    <input type="file" class="form-control" id="archivosExterno" multiple 
                                           accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg">
                                </div>
                                <div id="listaArchivosExterno" class="mt-3"></div>
                            </div>
                        </div>

                        <!-- Seguimiento -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-calendar-check me-2"></i>
                                Seguimiento y Plazos
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fechaRecepcionDoc" class="form-label">Fecha de Recepción *</label>
                                        <input type="date" class="form-control" id="fechaRecepcionDoc" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fechaVencimientoDoc" class="form-label">Fecha de Vencimiento</label>
                                        <input type="date" class="form-control" id="fechaVencimientoDoc">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="responsableDoc" class="form-label">Responsable de Seguimiento</label>
                                <select class="form-select" id="responsableDoc">
                                    <option value="">Asignar responsable...</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="observacionesDoc" class="form-label">Observaciones</label>
                                <textarea class="form-control" id="observacionesDoc" rows="3" 
                                          placeholder="Observaciones adicionales sobre el documento..."></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-outline-primary" onclick="guardarBorradorExterno()">
                        <i class="bi bi-floppy me-1"></i>
                        Guardar Borrador
                    </button>
                    <button type="button" class="btn btn-primary" onclick="registrarDocumentoConfirmado()">
                        <i class="bi bi-check-lg me-1"></i>
                        Registrar Documento
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Ver Detalles -->
    <div class="modal fade" id="modalVerDetallesExterno" tabindex="-1" aria-labelledby="modalVerDetallesExternoLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalVerDetallesExternoLabel">
                        <i class="bi bi-info-circle me-2"></i>
                        Detalles del Documento Externo
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="contenidoDetallesExterno">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-outline-primary" onclick="editarDocumentoExterno()">
                        <i class="bi bi-pencil me-1"></i>
                        Editar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="procesarDocumentoExterno()">
                        <i class="bi bi-gear me-1"></i>
                        Procesar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Importar Masivo -->
    <div class="modal fade" id="modalImportarMasivo" tabindex="-1" aria-labelledby="modalImportarMasivoLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalImportarMasivoLabel">
                        <i class="bi bi-upload me-2"></i>
                        Importación Masiva de Documentos
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        Puede importar múltiples documentos utilizando un archivo Excel con la plantilla proporcionada.
                    </div>
                    
                    <div class="mb-4">
                        <h6>Paso 1: Descargar Plantilla</h6>
                        <p class="text-muted">Descargue la plantilla Excel y complete la información de los documentos.</p>
                        <button class="btn btn-outline-primary" onclick="descargarPlantilla()">
                            <i class="bi bi-download me-2"></i>
                            Descargar Plantilla Excel
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <h6>Paso 2: Cargar Archivo</h6>
                        <div class="border rounded p-3" id="areaImportacion">
                            <div class="text-center">
                                <i class="bi bi-file-earmark-excel fs-2 text-success"></i>
                                <p class="text-muted">Seleccione el archivo Excel completado</p>
                                <input type="file" class="form-control" id="archivoImportacion" 
                                       accept=".xlsx,.xls" onchange="validarArchivoImportacion()">
                            </div>
                        </div>
                    </div>
                    
                    <div id="resultadoValidacion" class="mt-3"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnProcesarImportacion" 
                            onclick="procesarImportacion()" disabled>
                        <i class="bi bi-upload me-1"></i>
                        Procesar Importación
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <link href="./assets/css/documentos-externos.css" rel="stylesheet">
    <script src="./assets/js/documentos-externos.js"></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>