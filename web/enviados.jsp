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
        <div class="enviados-container">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="page-title">
                    <i class="bi bi-send-check me-3"></i>
                    Documentos Enviados
                </h1>
                <p class="page-subtitle">
                    Historial completo de documentos emitidos y seguimiento de estados
                </p>
                
                <!-- Estadísticas Rápidas -->
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="totalEnviados">156</span>
                        <span class="stat-label">Total Enviados</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="pendientesRespuesta">23</span>
                        <span class="stat-label">Pendientes Respuesta</span>
                    </div>
                    <div class="stat-item success">
                        <span class="stat-number" id="recepcionados">89</span>
                        <span class="stat-label">Recepcionados</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="enviadosHoy">12</span>
                        <span class="stat-label">Enviados Hoy</span>
                    </div>
                </div>
            </div>

            <!-- Acciones Principales -->
            <div class="actions-bar">
                <div class="actions-left">
                    <button class="btn btn-primary" onclick="nuevoDocumento()">
                        <i class="bi bi-plus-lg me-2"></i>
                        Nuevo Documento
                    </button>
                    <button class="btn btn-outline-secondary" onclick="actualizarListaEnviados()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Actualizar
                    </button>
                </div>
                <div class="actions-right">
                    <button class="btn btn-outline-info" onclick="generarReporte()">
                        <i class="bi bi-file-earmark-pdf me-2"></i>
                        Generar Reporte
                    </button>
                    <button class="btn btn-outline-success" onclick="exportarDatos()">
                        <i class="bi bi-download me-2"></i>
                        Exportar
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
                    <button class="btn btn-sm btn-outline-secondary" onclick="limpiarFiltrosEnviados()">
                        <i class="bi bi-x-circle me-1"></i>
                        Limpiar
                    </button>
                </div>
                <div class="card-body">
                    <div class="filters-grid">
                        <div>
                            <label for="filtroEstadoEnviados" class="form-label">Estado</label>
                            <select class="form-select" id="filtroEstadoEnviados" onchange="aplicarFiltrosEnviados()">
                                <option value="">Todos los estados</option>
                                <option value="Firmado">Firmado</option>
                                <option value="Emitido">Emitido</option>
                                <option value="Recepcionado">Recepcionado</option>
                                <option value="Atendido">Atendido</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroTipoEnviados" class="form-label">Tipo de Documento</label>
                            <select class="form-select" id="filtroTipoEnviados" onchange="aplicarFiltrosEnviados()">
                                <option value="">Todos los tipos</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroProyectoEnviados" class="form-label">Proyecto</label>
                            <select class="form-select" id="filtroProyectoEnviados" onchange="aplicarFiltrosEnviados()">
                                <option value="">Todos los proyectos</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroDestinatarioEnviados" class="form-label">Destinatario</label>
                            <select class="form-select" id="filtroDestinatarioEnviados" onchange="aplicarFiltrosEnviados()">
                                <option value="">Todos los destinatarios</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroOrdenEnviados" class="form-label">Ordenar por</label>
                            <select class="form-select" id="filtroOrdenEnviados" onchange="aplicarFiltrosEnviados()">
                                <option value="fecha_envio">Fecha Envío</option>
                                <option value="fecha_emision">Fecha Emisión</option>
                                <option value="estado">Estado</option>
                                <option value="destinatario">Destinatario</option>
                                <option value="codigo">Código</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroFechaEnviados" class="form-label">Periodo</label>
                            <select class="form-select" id="filtroFechaEnviados" onchange="aplicarFiltrosEnviados()">
                                <option value="">Cualquier periodo</option>
                                <option value="hoy">Hoy</option>
                                <option value="semana">Esta Semana</option>
                                <option value="mes">Este Mes</option>
                                <option value="trimestre">Este Trimestre</option>
                                <option value="año">Este Año</option>
                            </select>
                        </div>
                        <div class="filter-search">
                            <label for="filtroBusquedaEnviados" class="form-label">Buscar</label>
                            <input type="text" class="form-control" id="filtroBusquedaEnviados" 
                                   placeholder="Código, título, destinatario..." onkeyup="aplicarFiltrosEnviados()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Documentos -->
            <div class="card card-animated">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Documentos Enviados
                    </h5>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="seleccionarTodosEnviados()">
                            <i class="bi bi-check-all me-1"></i>
                            Seleccionar Todos
                        </button>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" onclick="cambiarVistaTabla()" id="btnVistaTabla">
                                <i class="bi bi-table"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="cambiarVistaCartas()" id="btnVistaCartas">
                                <i class="bi bi-grid-3x3"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="tablaEnviadosContainer">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>Cargando documentos enviados...</p>
                        </div>
                    </div>
                    
                    <!-- Paginación -->
                    <nav aria-label="Paginación enviados" class="mt-4">
                        <ul class="pagination justify-content-center" id="paginacionEnviados">
                            <!-- Se llenará dinámicamente -->
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Seguimiento Documento -->
    <div class="modal fade" id="modalSeguimientoDocumento" tabindex="-1" aria-labelledby="modalSeguimientoDocumentoLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalSeguimientoDocumentoLabel">
                        <i class="bi bi-eye me-2"></i>
                        Seguimiento de Documento
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="contenidoSeguimiento">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-primary" onclick="actualizarSeguimiento()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Actualizar Estado
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Reenviar Documento -->
    <div class="modal fade" id="modalReenviarDocumento" tabindex="-1" aria-labelledby="modalReenviarDocumentoLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalReenviarDocumentoLabel">
                        <i class="bi bi-send me-2"></i>
                        Reenviar Documento
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-4">
                        <h6 class="text-primary">Información del Documento</h6>
                        <div id="infoDocumentoReenvio" class="card bg-light">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>

                    <form id="formReenviarDocumento">
                        <div class="mb-3">
                            <label for="nuevosDestinatarios" class="form-label">Nuevos Destinatarios</label>
                            <select class="form-select" id="nuevosDestinatarios" multiple required>
                                <!-- Se llenará dinámicamente -->
                            </select>
                            <div class="form-text">Mantenga presionado Ctrl para seleccionar múltiples destinatarios</div>
                        </div>

                        <div class="mb-3">
                            <label for="motivoReenvio" class="form-label">Motivo del Reenvío</label>
                            <textarea class="form-control" id="motivoReenvio" rows="3" 
                                      placeholder="Indique el motivo por el cual reenvía este documento..." required></textarea>
                        </div>

                        <div class="mb-3">
                            <label for="prioridadReenvio" class="form-label">Prioridad</label>
                            <select class="form-select" id="prioridadReenvio">
                                <option value="Normal">Normal</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>

                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="notificarReenvio" checked>
                            <label class="form-check-label" for="notificarReenvio">
                                Notificar a los destinatarios por correo electrónico
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-success" onclick="confirmarReenvio()">
                        <i class="bi bi-send me-1"></i>
                        Reenviar Documento
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Generar Reporte -->
    <div class="modal fade" id="modalGenerarReporte" tabindex="-1" aria-labelledby="modalGenerarReporteLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalGenerarReporteLabel">
                        <i class="bi bi-file-earmark-pdf me-2"></i>
                        Generar Reporte de Documentos Enviados
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formGenerarReporte">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="reporteFechaInicio" class="form-label">Fecha Inicio</label>
                                    <input type="date" class="form-control" id="reporteFechaInicio" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="reporteFechaFin" class="form-label">Fecha Fin</label>
                                    <input type="date" class="form-control" id="reporteFechaFin" required>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="reporteTipo" class="form-label">Tipo de Reporte</label>
                            <select class="form-select" id="reporteTipo" required>
                                <option value="">Seleccione un tipo...</option>
                                <option value="resumen">Resumen Ejecutivo</option>
                                <option value="detallado">Detallado por Documento</option>
                                <option value="estadistico">Estadístico</option>
                                <option value="seguimiento">Seguimiento de Estados</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Filtros Adicionales</label>
                            <div class="row">
                                <div class="col-md-6">
                                    <select class="form-select mb-2" id="reporteProyecto">
                                        <option value="">Todos los proyectos</option>
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <select class="form-select mb-2" id="reporteEstado">
                                        <option value="">Todos los estados</option>
                                        <option value="Firmado">Firmado</option>
                                        <option value="Emitido">Emitido</option>
                                        <option value="Recepcionado">Recepcionado</option>
                                        <option value="Atendido">Atendido</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="reporteFormato" class="form-label">Formato de Salida</label>
                            <select class="form-select" id="reporteFormato" required>
                                <option value="pdf">PDF</option>
                                <option value="excel">Excel</option>
                                <option value="csv">CSV</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="procesarReporte()">
                        <i class="bi bi-file-earmark-pdf me-1"></i>
                        Generar Reporte
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <link href="./assets/css/enviados.css" rel="stylesheet">
    <script src="./assets/js/enviados.js"></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>