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
        <div class="bandeja-entrada-container">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="page-title">
                    <i class="bi bi-inbox me-3"></i>
                    Bandeja de Entrada
                </h1>
                <p class="page-subtitle">
                    Documentos recibidos pendientes de atención y respuesta
                </p>
                
                <!-- Estadísticas Rápidas -->
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="totalBandejaEntrada">23</span>
                        <span class="stat-label">Total Recibidos</span>
                    </div>
                    <div class="stat-item urgent">
                        <span class="stat-number" id="urgentesEntrada">4</span>
                        <span class="stat-label">Urgentes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="sinLeerEntrada">8</span>
                        <span class="stat-label">Sin Leer</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="vencidosEntrada">2</span>
                        <span class="stat-label">Vencidos</span>
                    </div>
                </div>
            </div>

            <!-- Acciones Principales -->
            <div class="actions-bar">
                <div class="actions-left">
                    <button class="btn btn-primary" onclick="marcarComoLeido()">
                        <i class="bi bi-eye me-2"></i>
                        Marcar como Leído
                    </button>
                    <button class="btn btn-outline-secondary" onclick="actualizarListaBandejaEntrada()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Actualizar
                    </button>
                </div>
                <div class="actions-right">
                    <button class="btn btn-outline-success" onclick="responderSeleccionados()">
                        <i class="bi bi-reply me-2"></i>
                        Responder Seleccionados
                    </button>
                    <button class="btn btn-outline-info" onclick="archivarSeleccionados()">
                        <i class="bi bi-archive me-2"></i>
                        Archivar
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
                    <button class="btn btn-sm btn-outline-secondary" onclick="limpiarFiltrosBandejaEntrada()">
                        <i class="bi bi-x-circle me-1"></i>
                        Limpiar
                    </button>
                </div>
                <div class="card-body">
                    <div class="filters-grid">
                        <div>
                            <label for="filtroEstadoBandejaEntrada" class="form-label">Estado</label>
                            <select class="form-select" id="filtroEstadoBandejaEntrada" onchange="aplicarFiltrosBandejaEntrada()">
                                <option value="">Todos los estados</option>
                                <option value="Sin Leer">Sin Leer</option>
                                <option value="Leído">Leído</option>
                                <option value="Respondido">Respondido</option>
                                <option value="Archivado">Archivado</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroPrioridadBandejaEntrada" class="form-label">Prioridad</label>
                            <select class="form-select" id="filtroPrioridadBandejaEntrada" onchange="aplicarFiltrosBandejaEntrada()">
                                <option value="">Todas las prioridades</option>
                                <option value="Normal">Normal</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroEmisorBandejaEntrada" class="form-label">Emisor</label>
                            <select class="form-select" id="filtroEmisorBandejaEntrada" onchange="aplicarFiltrosBandejaEntrada()">
                                <option value="">Todos los emisores</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroOrdenBandejaEntrada" class="form-label">Ordenar por</label>
                            <select class="form-select" id="filtroOrdenBandejaEntrada" onchange="aplicarFiltrosBandejaEntrada()">
                                <option value="fecha_recepcion">Fecha Recepción</option>
                                <option value="prioridad">Prioridad</option>
                                <option value="emisor">Emisor</option>
                                <option value="codigo">Código</option>
                            </select>
                        </div>
                        <div class="filter-search">
                            <label for="filtroBusquedaBandejaEntrada" class="form-label">Buscar</label>
                            <input type="text" class="form-control" id="filtroBusquedaBandejaEntrada" 
                                   placeholder="Código, título, emisor..." onkeyup="aplicarFiltrosBandejaEntrada()">
                        </div>
                        <div>
                            <label for="filtroFechaBandejaEntrada" class="form-label">Fecha Recepción</label>
                            <select class="form-select" id="filtroFechaBandejaEntrada" onchange="aplicarFiltrosBandejaEntrada()">
                                <option value="">Cualquier fecha</option>
                                <option value="hoy">Hoy</option>
                                <option value="ayer">Ayer</option>
                                <option value="semana">Esta Semana</option>
                                <option value="mes">Este Mes</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Documentos -->
            <div class="card card-animated">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Documentos Recibidos
                    </h5>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="seleccionarTodosBandejaEntrada()">
                            <i class="bi bi-check-all me-1"></i>
                            Seleccionar Todos
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="expandirContraerTodo()">
                            <i class="bi bi-arrows-expand me-1"></i>
                            Expandir/Contraer
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="tablaBandejaEntradaContainer">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>Cargando documentos...</p>
                        </div>
                    </div>
                    
                    <!-- Paginación -->
                    <nav aria-label="Paginación bandeja entrada" class="mt-4">
                        <ul class="pagination justify-content-center" id="paginacionBandejaEntrada">
                            <!-- Se llenará dinámicamente -->
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Responder Documento -->
    <div class="modal fade" id="modalResponderDocumento" tabindex="-1" aria-labelledby="modalResponderDocumentoLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalResponderDocumentoLabel">
                        <i class="bi bi-reply me-2"></i>
                        Responder Documento
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <!-- Información del Documento Original -->
                    <div class="mb-4">
                        <h6 class="text-primary">
                            <i class="bi bi-file-earmark-text me-2"></i>
                            Documento Original
                        </h6>
                        <div id="infoDocumentoOriginal" class="card bg-light">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>

                    <!-- Formulario de Respuesta -->
                    <form id="formResponderDocumento">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="respuestaTitulo" class="form-label">Título de la Respuesta</label>
                                    <input type="text" class="form-control" id="respuestaTitulo" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="respuestaTipo" class="form-label">Tipo de Respuesta</label>
                                    <select class="form-select" id="respuestaTipo" required>
                                        <option value="">Seleccione un tipo...</option>
                                        <option value="Respuesta">Respuesta</option>
                                        <option value="Observaciones">Observaciones</option>
                                        <option value="Solicitud Información">Solicitud de Información</option>
                                        <option value="Conformidad">Conformidad</option>
                                        <option value="No Conformidad">No Conformidad</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="respuestaContenido" class="form-label">Contenido de la Respuesta</label>
                            <textarea class="form-control" id="respuestaContenido" rows="6" 
                                      placeholder="Redacte su respuesta..." required></textarea>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="respuestaPrioridad" class="form-label">Prioridad</label>
                                    <select class="form-select" id="respuestaPrioridad">
                                        <option value="Normal">Normal</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="respuestaDestinatarios" class="form-label">Destinatarios Adicionales</label>
                                    <select class="form-select" id="respuestaDestinatarios" multiple>
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                    <div class="form-text">Mantenga presionado Ctrl para seleccionar múltiples</div>
                                </div>
                            </div>
                        </div>

                        <!-- Área para anexos -->
                        <div class="mb-3">
                            <label class="form-label">Anexos</label>
                            <div class="border rounded p-3" id="areaAnexosRespuesta">
                                <div class="text-center">
                                    <i class="bi bi-cloud-upload fs-2 text-muted"></i>
                                    <p class="text-muted">Arrastre archivos aquí o haga clic para seleccionar</p>
                                    <input type="file" class="form-control" id="anexosRespuesta" multiple 
                                           accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg">
                                </div>
                                <div id="listaAnexosRespuesta" class="mt-3"></div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-outline-primary" onclick="guardarBorradorRespuesta()">
                        <i class="bi bi-floppy me-1"></i>
                        Guardar Borrador
                    </button>
                    <button type="button" class="btn btn-success" onclick="enviarRespuesta()">
                        <i class="bi bi-send me-1"></i>
                        Enviar Respuesta
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Marcar Como Leído Masivo -->
    <div class="modal fade" id="modalMarcarLeido" tabindex="-1" aria-labelledby="modalMarcarLeidoLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalMarcarLeidoLabel">
                        <i class="bi bi-eye me-2"></i>
                        Marcar como Leído
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        ¿Está seguro de que desea marcar como leídos <span id="cantidadSeleccionados">0</span> documento(s)?
                    </div>
                    
                    <div class="mb-3">
                        <label for="observacionesLectura" class="form-label">Observaciones (Opcional)</label>
                        <textarea class="form-control" id="observacionesLectura" rows="3" 
                                  placeholder="Comentarios sobre la lectura..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="confirmarMarcarLeido()">
                        <i class="bi bi-check me-1"></i>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Ver Documento Completo -->
    <div class="modal fade" id="modalVerDocumentoCompleto" tabindex="-1" aria-labelledby="modalVerDocumentoCompletoLabel" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalVerDocumentoCompletoLabel">
                        <i class="bi bi-file-earmark-text me-2"></i>
                        Vista Completa del Documento
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div id="documentoCompletoViewer" class="h-100">
                        <!-- Aquí se cargará el visor de documentos -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-primary" onclick="descargarDocumentoCompleto()">
                        <i class="bi bi-download me-1"></i>
                        Descargar
                    </button>
                    <button type="button" class="btn btn-success" onclick="responderDesdeVisor()">
                        <i class="bi bi-reply me-1"></i>
                        Responder
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <link href="./assets/css/bandeja-entrada.css" rel="stylesheet">
    <script src="./assets/js/bandeja-entrada.js"></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>