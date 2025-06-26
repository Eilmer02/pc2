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
        <div class="delegados-container">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="page-title">
                    <i class="bi bi-people me-3"></i>
                    Gestión de Delegados
                </h1>
                <p class="page-subtitle">
                    Administración de delegaciones de autoridad y permisos temporales
                </p>
                
                <!-- Estadísticas Rápidas -->
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="totalDelegaciones">8</span>
                        <span class="stat-label">Delegaciones Activas</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="proximas-vencer">3</span>
                        <span class="stat-label">Próximas a Vencer</span>
                    </div>
                    <div class="stat-item success">
                        <span class="stat-number" id="documentosDelegados">24</span>
                        <span class="stat-label">Docs. Delegados</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="nuevasSemana">2</span>
                        <span class="stat-label">Nuevas Esta Semana</span>
                    </div>
                </div>
            </div>

            <!-- Acciones Principales -->
            <div class="actions-bar">
                <div class="actions-left">
                    <button class="btn btn-primary" onclick="nuevaDelegacion()">
                        <i class="bi bi-plus-lg me-2"></i>
                        Nueva Delegación
                    </button>
                    <button class="btn btn-outline-secondary" onclick="actualizarListaDelegados()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Actualizar
                    </button>
                </div>
                <div class="actions-right">
                    <button class="btn btn-outline-warning" onclick="revisarVencimientos()">
                        <i class="bi bi-clock me-2"></i>
                        Revisar Vencimientos
                    </button>
                    <button class="btn btn-outline-info" onclick="generarReporteDelegaciones()">
                        <i class="bi bi-file-earmark-pdf me-2"></i>
                        Generar Reporte
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
                    <button class="btn btn-sm btn-outline-secondary" onclick="limpiarFiltrosDelegados()">
                        <i class="bi bi-x-circle me-1"></i>
                        Limpiar
                    </button>
                </div>
                <div class="card-body">
                    <div class="filters-grid">
                        <div>
                            <label for="filtroEstadoDelegados" class="form-label">Estado</label>
                            <select class="form-select" id="filtroEstadoDelegados" onchange="aplicarFiltrosDelegados()">
                                <option value="">Todos los estados</option>
                                <option value="Activa">Activa</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Expirada">Expirada</option>
                                <option value="Revocada">Revocada</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroDeleganteUsuario" class="form-label">Usuario Delegante</label>
                            <select class="form-select" id="filtroDeleganteUsuario" onchange="aplicarFiltrosDelegados()">
                                <option value="">Todos los usuarios</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroDelegadoUsuario" class="form-label">Usuario Delegado</label>
                            <select class="form-select" id="filtroDelegadoUsuario" onchange="aplicarFiltrosDelegados()">
                                <option value="">Todos los usuarios</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroTipoDelegacion" class="form-label">Tipo de Delegación</label>
                            <select class="form-select" id="filtroTipoDelegacion" onchange="aplicarFiltrosDelegados()">
                                <option value="">Todos los tipos</option>
                                <option value="Firma">Firma de Documentos</option>
                                <option value="Aprobación">Aprobación de Proyectos</option>
                                <option value="Revisión">Revisión Técnica</option>
                                <option value="Administración">Administración</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroOrdenDelegados" class="form-label">Ordenar por</label>
                            <select class="form-select" id="filtroOrdenDelegados" onchange="aplicarFiltrosDelegados()">
                                <option value="fecha_creacion">Fecha Creación</option>
                                <option value="fecha_vencimiento">Fecha Vencimiento</option>
                                <option value="delegante">Usuario Delegante</option>
                                <option value="delegado">Usuario Delegado</option>
                            </select>
                        </div>
                        <div class="filter-search">
                            <label for="filtroBusquedaDelegados" class="form-label">Buscar</label>
                            <input type="text" class="form-control" id="filtroBusquedaDelegados" 
                                   placeholder="Usuario, descripción..." onkeyup="aplicarFiltrosDelegados()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Delegaciones -->
            <div class="card card-animated">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Delegaciones Registradas
                    </h5>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="seleccionarTodosDelegados()">
                            <i class="bi bi-check-all me-1"></i>
                            Seleccionar Todos
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="revocarSeleccionados()">
                            <i class="bi bi-x-circle me-1"></i>
                            Revocar Seleccionados
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="tablaDelegadosContainer">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>Cargando delegaciones...</p>
                        </div>
                    </div>
                    
                    <!-- Paginación -->
                    <nav aria-label="Paginación delegados" class="mt-4">
                        <ul class="pagination justify-content-center" id="paginacionDelegados">
                            <!-- Se llenará dinámicamente -->
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Nueva Delegación -->
    <div class="modal fade" id="modalNuevaDelegacion" tabindex="-1" aria-labelledby="modalNuevaDelegacionLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalNuevaDelegacionLabel">
                        <i class="bi bi-plus-circle me-2"></i>
                        Crear Nueva Delegación
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formNuevaDelegacion">
                        <!-- Información Básica -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-info-circle me-2"></i>
                                Información Básica
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="usuarioDelegante" class="form-label">Usuario Delegante *</label>
                                        <select class="form-select" id="usuarioDelegante" required>
                                            <option value="">Seleccione el usuario que delega...</option>
                                            <!-- Se llenará dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="usuarioDelegado" class="form-label">Usuario Delegado *</label>
                                        <select class="form-select" id="usuarioDelegado" required>
                                            <option value="">Seleccione el usuario delegado...</option>
                                            <!-- Se llenará dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="tipoDelegacion" class="form-label">Tipo de Delegación *</label>
                                <select class="form-select" id="tipoDelegacion" required onchange="actualizarPermisos()">
                                    <option value="">Seleccione el tipo de delegación...</option>
                                    <option value="Firma">Firma de Documentos</option>
                                    <option value="Aprobación">Aprobación de Proyectos</option>
                                    <option value="Revisión">Revisión Técnica</option>
                                    <option value="Administración">Administración</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="descripcionDelegacion" class="form-label">Descripción</label>
                                <textarea class="form-control" id="descripcionDelegacion" rows="3" 
                                          placeholder="Describa el motivo y alcance de la delegación..."></textarea>
                            </div>
                        </div>

                        <!-- Vigencia -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-calendar-check me-2"></i>
                                Vigencia de la Delegación
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fechaInicioDelegacion" class="form-label">Fecha de Inicio *</label>
                                        <input type="date" class="form-control" id="fechaInicioDelegacion" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fechaFinDelegacion" class="form-label">Fecha de Fin *</label>
                                        <input type="date" class="form-control" id="fechaFinDelegacion" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="notificarVencimiento" checked>
                                <label class="form-check-label" for="notificarVencimiento">
                                    Notificar 3 días antes del vencimiento
                                </label>
                            </div>
                        </div>

                        <!-- Permisos y Alcance -->
                        <div class="mb-4">
                            <h6 class="text-primary border-bottom pb-2">
                                <i class="bi bi-shield-check me-2"></i>
                                Permisos y Alcance
                            </h6>
                            
                            <div id="permisosContainer">
                                <!-- Se llenará dinámicamente según el tipo -->
                            </div>
                            
                            <div class="mb-3">
                                <label for="proyectosIncluidos" class="form-label">Proyectos Incluidos</label>
                                <select class="form-select" id="proyectosIncluidos" multiple>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                                <div class="form-text">Deje vacío para incluir todos los proyectos</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="limitesAdicionales" class="form-label">Límites Adicionales</label>
                                <textarea class="form-control" id="limitesAdicionales" rows="3" 
                                          placeholder="Especifique límites adicionales o restricciones..."></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-outline-primary" onclick="previsualizarDelegacion()">
                        <i class="bi bi-eye me-1"></i>
                        Previsualizar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="crearDelegacion()">
                        <i class="bi bi-check-lg me-1"></i>
                        Crear Delegación
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <link href="./assets/css/delegados.css" rel="stylesheet">
    <script src="./assets/js/delegados.js"></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>