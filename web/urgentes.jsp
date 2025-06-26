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
        <div class="urgentes-container">
            <!-- Page Header -->
            <div class="page-header">
                <h1 class="page-title">
                    <i class="bi bi-exclamation-triangle me-3"></i>
                    Documentos Urgentes
                </h1>
                <p class="page-subtitle">
                    Gestión prioritaria de documentos que requieren atención inmediata
                </p>
                
                <!-- Estadísticas Rápidas -->
                <div class="quick-stats">
                    <div class="stat-item urgent">
                        <span class="stat-number" id="totalUrgentes">3</span>
                        <span class="stat-label">Total Urgentes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="vencenHoy">1</span>
                        <span class="stat-label">Vencen Hoy</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="sinAtender">2</span>
                        <span class="stat-label">Sin Atender</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="tiempoPromedio">4.5</span>
                        <span class="stat-label">Horas Promedio</span>
                    </div>
                </div>
            </div>

            <!-- Alertas Críticas -->
            <div id="alertasCriticas" class="mb-4">
                <!-- Se llenará dinámicamente -->
            </div>

            <!-- Acciones Principales -->
            <div class="actions-bar">
                <div class="actions-left">
                    <button class="btn btn-danger" onclick="marcarUrgente()">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Marcar como Urgente
                    </button>
                    <button class="btn btn-outline-secondary" onclick="actualizarListaUrgentes()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Actualizar
                    </button>
                </div>
                <div class="actions-right">
                    <button class="btn btn-outline-warning" onclick="configurarAlertas()">
                        <i class="bi bi-bell me-2"></i>
                        Configurar Alertas
                    </button>
                    <button class="btn btn-outline-info" onclick="generarReporteUrgencia()">
                        <i class="bi bi-file-earmark-pdf me-2"></i>
                        Reporte de Urgencia
                    </button>
                </div>
            </div>

            <!-- Filtros Rápidos -->
            <div class="quick-filters mb-4">
                <div class="btn-group" role="group">
                    <input type="radio" class="btn-check" name="filtroRapido" id="filtroTodos" value="" checked>
                    <label class="btn btn-outline-danger" for="filtroTodos">Todos</label>
                    
                    <input type="radio" class="btn-check" name="filtroRapido" id="filtroVencenHoy" value="hoy">
                    <label class="btn btn-outline-danger" for="filtroVencenHoy">Vencen Hoy</label>
                    
                    <input type="radio" class="btn-check" name="filtroRapido" id="filtroSinAtender" value="sin_atender">
                    <label class="btn btn-outline-danger" for="filtroSinAtender">Sin Atender</label>
                    
                    <input type="radio" class="btn-check" name="filtroRapido" id="filtroVencidos" value="vencidos">
                    <label class="btn btn-outline-danger" for="filtroVencidos">Vencidos</label>
                </div>
            </div>

            <!-- Filtros Avanzados -->
            <div class="card filters-card">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-funnel me-2"></i>
                        Filtros Avanzados
                    </h5>
                    <button class="btn btn-sm btn-outline-secondary" onclick="limpiarFiltrosUrgentes()">
                        <i class="bi bi-x-circle me-1"></i>
                        Limpiar
                    </button>
                </div>
                <div class="card-body">
                    <div class="filters-grid">
                        <div>
                            <label for="filtroEstadoUrgentes" class="form-label">Estado</label>
                            <select class="form-select" id="filtroEstadoUrgentes" onchange="aplicarFiltrosUrgentes()">
                                <option value="">Todos los estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Resuelto">Resuelto</option>
                                <option value="Escalado">Escalado</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroNivelUrgencia" class="form-label">Nivel de Urgencia</label>
                            <select class="form-select" id="filtroNivelUrgencia" onchange="aplicarFiltrosUrgentes()">
                                <option value="">Todos los niveles</option>
                                <option value="Crítico">Crítico</option>
                                <option value="Alto">Alto</option>
                                <option value="Medio">Medio</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroResponsableUrgentes" class="form-label">Responsable</label>
                            <select class="form-select" id="filtroResponsableUrgentes" onchange="aplicarFiltrosUrgentes()">
                                <option value="">Todos los responsables</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        <div>
                            <label for="filtroTiempoRestante" class="form-label">Tiempo Restante</label>
                            <select class="form-select" id="filtroTiempoRestante" onchange="aplicarFiltrosUrgentes()">
                                <option value="">Cualquier tiempo</option>
                                <option value="vencido">Vencido</option>
                                <option value="menos_1h">Menos de 1 hora</option>
                                <option value="menos_4h">Menos de 4 horas</option>
                                <option value="menos_24h">Menos de 24 horas</option>
                            </select>
                        </div>
                        <div>
                            <label for="filtroOrdenUrgentes" class="form-label">Ordenar por</label>
                            <select class="form-select" id="filtroOrdenUrgentes" onchange="aplicarFiltrosUrgentes()">
                                <option value="tiempo_restante">Tiempo Restante</option>
                                <option value="nivel_urgencia">Nivel de Urgencia</option>
                                <option value="fecha_creacion">Fecha Creación</option>
                                <option value="responsable">Responsable</option>
                            </select>
                        </div>
                        <div class="filter-search">
                            <label for="filtroBusquedaUrgentes" class="form-label">Buscar</label>
                            <input type="text" class="form-control" id="filtroBusquedaUrgentes" 
                                   placeholder="Código, título, responsable..." onkeyup="aplicarFiltrosUrgentes()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Documentos Urgentes -->
            <div class="card card-animated">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Documentos que Requieren Atención Urgente
                    </h5>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="seleccionarTodosUrgentes()">
                            <i class="bi bi-check-all me-1"></i>
                            Seleccionar Todos
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="resolverSeleccionados()">
                            <i class="bi bi-check-circle me-1"></i>
                            Resolver Seleccionados
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="tablaUrgentesContainer">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>Cargando documentos urgentes...</p>
                        </div>
                    </div>
                    
                    <!-- Paginación -->
                    <nav aria-label="Paginación urgentes" class="mt-4">
                        <ul class="pagination justify-content-center" id="paginacionUrgentes">
                            <!-- Se llenará dinámicamente -->
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Marcar como Urgente -->
    <div class="modal fade" id="modalMarcarUrgente" tabindex="-1" aria-labelledby="modalMarcarUrgenteLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalMarcarUrgenteLabel">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Marcar Documento como Urgente
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formMarcarUrgente">
                        <div class="mb-3">
                            <label for="documentoSeleccionar" class="form-label">Documento *</label>
                            <select class="form-select" id="documentoSeleccionar" required>
                                <option value="">Seleccione el documento...</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="nivelUrgencia" class="form-label">Nivel de Urgencia *</label>
                            <select class="form-select" id="nivelUrgencia" required onchange="actualizarTiemposLimite()">
                                <option value="">Seleccione el nivel...</option>
                                <option value="Crítico">Crítico - Requiere atención inmediata</option>
                                <option value="Alto">Alto - Requiere atención en pocas horas</option>
                                <option value="Medio">Medio - Requiere atención en el día</option>
                            </select>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="fechaLimite" class="form-label">Fecha Límite *</label>
                                    <input type="date" class="form-control" id="fechaLimite" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="horaLimite" class="form-label">Hora Límite *</label>
                                    <input type="time" class="form-control" id="horaLimite" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="responsableUrgencia" class="form-label">Responsable *</label>
                            <select class="form-select" id="responsableUrgencia" required>
                                <option value="">Asignar responsable...</option>
                                <!-- Se llenará dinámicamente -->
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="motivoUrgencia" class="form-label">Motivo de la Urgencia *</label>
                            <textarea class="form-control" id="motivoUrgencia" rows="3" 
                                      placeholder="Explique por qué este documento es urgente..." required></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label for="instruccionesEspeciales" class="form-label">Instrucciones Especiales</label>
                            <textarea class="form-control" id="instruccionesEspeciales" rows="2" 
                                      placeholder="Instrucciones específicas para el responsable..."></textarea>
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="notificarInmediato" checked>
                            <label class="form-check-label" for="notificarInmediato">
                                Notificar inmediatamente al responsable
                            </label>
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="escalarAutomatico">
                            <label class="form-check-label" for="escalarAutomatico">
                                Escalar automáticamente si no se atiende en el tiempo límite
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" onclick="confirmarMarcarUrgente()">
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Marcar como Urgente
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Resolver Urgencia -->
    <div class="modal fade" id="modalResolverUrgencia" tabindex="-1" aria-labelledby="modalResolverUrgenciaLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalResolverUrgenciaLabel">
                        <i class="bi bi-check-circle me-2"></i>
                        Resolver Documento Urgente
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-4">
                        <h6 class="text-primary">Información del Documento</h6>
                        <div id="infoDocumentoResolver" class="card bg-light">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>

                    <form id="formResolverUrgencia">
                        <div class="mb-3">
                            <label for="tipoResolucion" class="form-label">Tipo de Resolución *</label>
                            <select class="form-select" id="tipoResolucion" required>
                                <option value="">Seleccione el tipo...</option>
                                <option value="Completado">Completado - Documento procesado exitosamente</option>
                                <option value="Derivado">Derivado - Enviado a otra área</option>
                                <option value="Pendiente_Info">Pendiente de Información - Requiere datos adicionales</option>
                                <option value="No_Procede">No Procede - No requiere acción</option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="descripcionResolucion" class="form-label">Descripción de la Resolución *</label>
                            <textarea class="form-control" id="descripcionResolucion" rows="4" 
                                      placeholder="Describa detalladamente cómo se resolvió la urgencia..." required></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label for="accionesRealizadas" class="form-label">Acciones Realizadas</label>
                            <textarea class="form-control" id="accionesRealizadas" rows="3" 
                                      placeholder="Liste las acciones específicas que se tomaron..."></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label for="tiempoInvertido" class="form-label">Tiempo Invertido (horas)</label>
                            <input type="number" class="form-control" id="tiempoInvertido" step="0.5" min="0" max="100">
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="requiereSeguimiento">
                            <label class="form-check-label" for="requiereSeguimiento">
                                Requiere seguimiento posterior
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-success" onclick="confirmarResolverUrgencia()">
                        <i class="bi bi-check-circle me-1"></i>
                        Confirmar Resolución
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Configurar Alertas -->
    <div class="modal fade" id="modalConfigurarAlertas" tabindex="-1" aria-labelledby="modalConfigurarAlertasLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content modal-animated">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalConfigurarAlertasLabel">
                        <i class="bi bi-bell me-2"></i>
                        Configurar Alertas de Urgencia
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formConfigurarAlertas">
                        <div class="mb-4">
                            <h6 class="text-primary">Notificaciones por Email</h6>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="alertaVencimiento" checked>
                                <label class="form-check-label" for="alertaVencimiento">
                                    Alertar cuando un documento urgente esté próximo a vencer
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="alertaNuevoUrgente" checked>
                                <label class="form-check-label" for="alertaNuevoUrgente">
                                    Alertar cuando se asigne un nuevo documento urgente
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="alertaEscalamiento">
                                <label class="form-check-label" for="alertaEscalamiento">
                                    Alertar cuando se escale un documento urgente
                                </label>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h6 class="text-primary">Tiempos de Alerta</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <label for="tiempoAlertaCritico" class="form-label">Crítico (minutos antes)</label>
                                    <input type="number" class="form-control" id="tiempoAlertaCritico" value="30" min="5" max="120">
                                </div>
                                <div class="col-md-6">
                                    <label for="tiempoAlertaAlto" class="form-label">Alto (horas antes)</label>
                                    <input type="number" class="form-control" id="tiempoAlertaAlto" value="2" min="1" max="24">
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h6 class="text-primary">Escalamiento Automático</h6>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="habilitarEscalamiento">
                                <label class="form-check-label" for="habilitarEscalamiento">
                                    Habilitar escalamiento automático
                                </label>
                            </div>
                            <div class="mt-2">
                                <label for="usuarioEscalamiento" class="form-label">Escalar a:</label>
                                <select class="form-select" id="usuarioEscalamiento">
                                    <option value="">Seleccione usuario...</option>
                                    <!-- Se llenará dinámicamente -->
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="guardarConfiguracionAlertas()">
                        <i class="bi bi-floppy me-1"></i>
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <link href="./assets/css/urgentes.css" rel="stylesheet">
    <script src="./assets/js/urgentes.js"></script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>