<%@page contentType="text/html" pageEncoding="UTF-8" buffer="32kb" autoFlush="true"%>
<%@page import="java.util.*, java.sql.*" %>
<%@include file="modules/head.jsp" %>
<%-- Verificar sesión válida antes de procesar --%>
<%
    if (session == null || session.getAttribute("usuarioId") == null) {
        response.sendRedirect("login.jsp");
        return;
    }
    
    // Configurar headers de respuesta
    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setDateHeader("Expires", 0);
    
    // Asegurar encoding
    request.setCharacterEncoding("UTF-8");
    response.setCharacterEncoding("UTF-8");
%>

<!-- CSS específico de certificados -->
<link href="assets/css/gestion-certificados.css" rel="stylesheet">

<body>
    <!-- Accesibilidad: Skip Link -->
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
    
    <%@include file="modules/topbar.jsp" %>
    <%@include file="modules/sidebar.jsp" %>

    <!-- Contenido Principal -->
    <main class="main" id="main-content" role="main">
        <div class="page-container">
            <!-- Header de la página -->
            <header class="page-header">
                <div class="page-title-section">
                    <h1 class="page-title">
                        <i class="bi bi-shield-check" aria-hidden="true"></i>
                        Certificados Digitales
                    </h1>
                    <p class="page-subtitle">Gestiona tus certificados digitales de forma segura y eficiente</p>
                </div>
                <div class="page-actions">
                    <button type="button" class="btn btn-success btn-lg" 
                            onclick="CertificadosManager.mostrarModalNuevoCertificado()"
                            data-bs-toggle="tooltip" title="Crear nuevo certificado digital">
                        <i class="bi bi-plus-circle" aria-hidden="true"></i>
                        <span>Nuevo Certificado</span>
                    </button>
                    <button type="button" class="btn btn-outline-primary" 
                            onclick="CertificadosManager.cargarCertificados()"
                            data-bs-toggle="tooltip" title="Actualizar lista de certificados">
                        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
                        <span>Actualizar</span>
                    </button>
                </div>
            </header>

            <!-- Alertas -->
            <div id="alertContainer" role="alert" aria-live="polite"></div>

            <!-- Resumen de Certificados -->
            <section class="stats-section" aria-labelledby="stats-title">
                <h2 id="stats-title" class="visually-hidden">Resumen de certificados</h2>
                <div class="stats-grid">
                    <div class="stat-card stat-card-success">
                        <div class="stat-content">
                            <div class="stat-info">
                                <h3 class="stat-label">Activos</h3>
                                <div class="stat-value" id="certificadosActivos" data-count="0">0</div>
                            </div>
                            <div class="stat-icon">
                                <i class="bi bi-shield-check" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-warning">
                        <div class="stat-content">
                            <div class="stat-info">
                                <h3 class="stat-label">Por Vencer</h3>
                                <div class="stat-value" id="certificadosPorVencer" data-count="0">0</div>
                            </div>
                            <div class="stat-icon">
                                <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-danger">
                        <div class="stat-content">
                            <div class="stat-info">
                                <h3 class="stat-label">Expirados</h3>
                                <div class="stat-value" id="certificadosExpirados" data-count="0">0</div>
                            </div>
                            <div class="stat-icon">
                                <i class="bi bi-x-circle" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-secondary">
                        <div class="stat-content">
                            <div class="stat-info">
                                <h3 class="stat-label">Revocados</h3>
                                <div class="stat-value" id="certificadosRevocados" data-count="0">0</div>
                            </div>
                            <div class="stat-icon">
                                <i class="bi bi-shield-x" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Filtros -->
            <section class="filters-section">
                <div class="filters-card">
                    <div class="filters-header">
                        <h2 class="filters-title">
                            <i class="bi bi-funnel" aria-hidden="true"></i>
                            Filtros
                        </h2>
                        <button type="button" class="btn btn-link btn-sm" onclick="CertificadosManager.limpiarFiltros()">
                            <i class="bi bi-x-circle" aria-hidden="true"></i>
                            Limpiar
                        </button>
                    </div>
                    <div class="filters-body">
                        <div class="filters-grid">
                            <div class="filter-group">
                                <label for="filtroEstado" class="filter-label">Estado</label>
                                <select class="filter-select" id="filtroEstado" 
                                        onchange="CertificadosManager.aplicarFiltros()"
                                        aria-describedby="filtroEstado-help">
                                    <option value="">Todos los estados</option>
                                    <option value="activo">Activos</option>
                                    <option value="expirado">Expirados</option>
                                    <option value="revocado">Revocados</option>
                                </select>
                                <small id="filtroEstado-help" class="filter-help">Filtrar por estado del certificado</small>
                            </div>

                            <div class="filter-group">
                                <label for="filtroTipo" class="filter-label">Tipo</label>
                                <select class="filter-select" id="filtroTipo" 
                                        onchange="CertificadosManager.aplicarFiltros()"
                                        aria-describedby="filtroTipo-help">
                                    <option value="">Todos los tipos</option>
                                    <option value="interno">Interno</option>
                                    <option value="externo">Externo</option>
                                    <option value="reniec">RENIEC</option>
                                </select>
                                <small id="filtroTipo-help" class="filter-help">Filtrar por tipo de certificado</small>
                            </div>

                            <div class="filter-group filter-group-search">
                                <label for="filtroBusqueda" class="filter-label">Buscar</label>
                                <div class="search-input-container">
                                    <input type="text" class="filter-input" id="filtroBusqueda" 
                                           placeholder="Buscar certificados..." 
                                           onkeyup="CertificadosManager.aplicarFiltros()"
                                           aria-describedby="filtroBusqueda-help">
                                    <i class="bi bi-search search-icon" aria-hidden="true"></i>
                                </div>
                                <small id="filtroBusqueda-help" class="filter-help">Buscar por nombre del certificado</small>
                            </div>

                            <div class="filter-group filter-group-checkbox">
                                <div class="filter-checkbox">
                                    <input class="filter-check-input" type="checkbox" id="incluirRevocados" 
                                           onchange="CertificadosManager.aplicarFiltros()">
                                    <label class="filter-check-label" for="incluirRevocados">
                                        Incluir revocados
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Lista de Certificados -->
            <section class="certificates-section">
                <div class="certificates-card">
                    <div class="certificates-header">
                        <h2 class="certificates-title">
                            <i class="bi bi-list-ul" aria-hidden="true"></i>
                            Mis Certificados Digitales
                        </h2>
                        <div class="certificates-actions">
                            <span id="certificatesCount" class="certificates-count">0 certificados</span>
                        </div>
                    </div>

                    <!-- Estado de carga -->
                    <div id="loadingCertificados" class="loading-state">
                        <div class="loading-spinner" role="status" aria-label="Cargando certificados">
                            <div class="spinner"></div>
                        </div>
                        <p class="loading-text">Cargando certificados...</p>
                    </div>

                    <!-- Contenedor de certificados -->
                    <div id="certificadosContainer" class="certificates-container" style="display: none;">
                        <div class="table-container">
                            <table class="certificates-table" role="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Estado</th>
                                        <th scope="col">Certificado</th>
                                        <th scope="col">Tipo</th>
                                        <th scope="col">Emisor</th>
                                        <th scope="col">Vigencia</th>
                                        <th scope="col">Días para Vencer</th>
                                        <th scope="col">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="certificadosTableBody">
                                    <!-- Contenido dinámico -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Mensaje cuando no hay certificados -->
                        <div id="noCertificadosMessage" class="empty-state" style="display: none;">
                            <div class="empty-state-icon">
                                <i class="bi bi-shield-x" aria-hidden="true"></i>
                            </div>
                            <h3 class="empty-state-title">No hay certificados</h3>
                            <p class="empty-state-text">
                                No se encontraron certificados con los filtros aplicados.
                            </p>
                            <button type="button" class="btn btn-primary btn-lg" 
                                    onclick="CertificadosManager.mostrarModalNuevoCertificado()">
                                <i class="bi bi-plus-circle" aria-hidden="true"></i>
                                Crear Primer Certificado
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- Modal Nuevo Certificado -->
    <div class="modal fade" id="modalNuevoCertificado" tabindex="-1" 
         aria-labelledby="modalNuevoCertificadoLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title" id="modalNuevoCertificadoLabel">
                        <i class="bi bi-shield-plus" aria-hidden="true"></i>
                        Nuevo Certificado Digital
                    </h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                
                <div class="modal-body">
                    <form id="formNuevoCertificado" novalidate>
                        <div class="form-section">
                            <h3 class="form-section-title">Información del Certificado</h3>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="nombreComun" class="form-label required">
                                        Nombre Común
                                    </label>
                                    <input type="text" class="form-control" id="nombreComun" required 
                                           placeholder="Ej: Juan Pérez García"
                                           aria-describedby="nombreComun-help">
                                    <small id="nombreComun-help" class="form-text">
                                        Nombre completo del titular del certificado
                                    </small>
                                    <div class="invalid-feedback">
                                        Por favor ingrese el nombre común
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="organizacion" class="form-label">Organización</label>
                                    <input type="text" class="form-control" id="organizacion" 
                                           value="Constructora Vial S.A." 
                                           placeholder="Nombre de la organización">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="emailCertificado" class="form-label">Email</label>
                                <input type="email" class="form-control" id="emailCertificado" 
                                       placeholder="correo@constructoravial.com"
                                       aria-describedby="emailCertificado-help">
                                <small id="emailCertificado-help" class="form-text">
                                    Email asociado al certificado
                                </small>
                                <div class="invalid-feedback">
                                    Por favor ingrese un email válido
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3 class="form-section-title">Configuración de Contraseña</h3>
                            
                            <div class="password-options">
                                <div class="password-option">
                                    <input class="form-check-input" type="radio" name="opcionPassword" 
                                           id="opcionPasswordManual" value="manual" checked 
                                           onchange="CertificadosManager.togglePasswordOptions()">
                                    <label class="form-check-label" for="opcionPasswordManual">
                                        <strong>Crear mi propia contraseña</strong>
                                        <small>Tendrás control total sobre la contraseña</small>
                                    </label>
                                </div>
                                
                                <div class="password-option">
                                    <input class="form-check-input" type="radio" name="opcionPassword" 
                                           id="opcionPasswordGenerada" value="generada" 
                                           onchange="CertificadosManager.togglePasswordOptions()">
                                    <label class="form-check-label" for="opcionPasswordGenerada">
                                        <strong>Generar contraseña automáticamente</strong>
                                        <small>Sistema generará una contraseña segura</small>
                                    </label>
                                </div>
                            </div>

                            <div id="passwordManualContainer" class="password-container">
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="passwordCertificado" class="form-label required">
                                            Contraseña del Certificado
                                        </label>
                                        <div class="password-input-container">
                                            <input type="password" class="form-control" id="passwordCertificado" 
                                                   required minlength="8" placeholder="Mínimo 8 caracteres"
                                                   aria-describedby="passwordStrength">
                                            <button class="password-toggle" type="button" 
                                                    onclick="CertificadosManager.togglePasswordVisibility('passwordCertificado')"
                                                    aria-label="Mostrar/Ocultar contraseña">
                                                <i class="bi bi-eye" id="iconPasswordCertificado" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                        <div id="passwordStrength" class="password-strength"></div>
                                        <div class="invalid-feedback">
                                            La contraseña debe tener al menos 8 caracteres
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label for="confirmarPasswordCertificado" class="form-label required">
                                            Confirmar Contraseña
                                        </label>
                                        <input type="password" class="form-control" id="confirmarPasswordCertificado" 
                                               required minlength="8" placeholder="Repetir contraseña"
                                               aria-describedby="passwordMatch">
                                        <div id="passwordMatch" class="password-match"></div>
                                        <div class="invalid-feedback">
                                            Las contraseñas deben coincidir
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div id="passwordGeneradaContainer" class="password-container" style="display: none;">
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle" aria-hidden="true"></i>
                                    <div>
                                        <strong>Contraseña automática</strong>
                                        <p>Se generará una contraseña segura automáticamente. 
                                        Esta contraseña se mostrará una sola vez y debe guardarla en un lugar seguro.</p>
                                    </div>
                                </div>
                            </div>

                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                                <div>
                                    <strong>Importante:</strong> 
                                    <p>La contraseña del certificado debe ser diferente a su contraseña del sistema 
                                    y será necesaria cada vez que firme documentos.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" id="btnGenerarCertificado" 
                            onclick="CertificadosManager.generarCertificado()">
                        <i class="bi bi-shield-plus" aria-hidden="true"></i>
                        Generar Certificado
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Confirmar Acción -->
    <div class="modal fade" id="modalConfirmarAccion" tabindex="-1" 
         aria-labelledby="modalConfirmarAccionLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title" id="modalConfirmarAccionLabel">Confirmar Acción</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body" id="modalConfirmarAccionBody">
                    <!-- Contenido dinámico -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-danger" id="btnConfirmarAccion">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Detalles Certificado -->
    <div class="modal fade" id="modalDetallesCertificado" tabindex="-1" 
         aria-labelledby="modalDetallesCertificadoLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title" id="modalDetallesCertificadoLabel">
                        <i class="bi bi-info-circle" aria-hidden="true"></i>
                        Detalles del Certificado
                    </h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" 
                            aria-label="Cerrar modal"></button>
                </div>
                <div class="modal-body" id="modalDetallesCertificadoBody">
                    <!-- Contenido dinámico -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="assets/js/gestion-certificados.js"></script>
    
    <!-- Variables de sesión para JavaScript -->
    <script>
        window.SGD_USER_DATA = {
            userEmail: '<%= session.getAttribute("userEmail") != null ? session.getAttribute("userEmail") : "" %>',
            usuarioId: '<%= session.getAttribute("usuarioId") != null ? session.getAttribute("usuarioId") : "" %>',
            nombreCompleto: '<%= session.getAttribute("nombreCompleto") != null ? session.getAttribute("nombreCompleto") : "" %>'
        };
    </script>

    <%@include file="modules/footer.jsp" %>
</body>
</html>