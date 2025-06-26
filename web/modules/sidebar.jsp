<!-- ==================== SIDEBAR/HEADER MODULE ==================== -->
<header class="header">
  <button class="header-toggle" onclick="toggleMenu()">
    <i class="bi bi-list"></i>
  </button>

  <div class="header-logo">
    <h3><i class="bi bi-file-earmark-text"></i> <span>SGD</span></h3>
  </div>

  <nav class="navmenu">
    <!-- DOCUMENTOS -->
    <div class="nav-section">
      <div class="accordion-item" id="accordionDocumentos">
        <button class="accordion-button" type="button" onclick="toggleAccordion('accordionDocumentos')">
          <i class="bi bi-file-earmark-text"></i>
          <span>Documentos</span>
        </button>
        <div class="accordion-body">
          <ul class="submenu">
            <li><a href="index.jsp" onclick="window.location.href='index.jsp'; return false;" class="active">
              <span>Panel Principal</span>
            </a></li>
            <li><a href="para-firmar.jsp" onclick="window.location.href='para-firmar.jsp'; return false;">
              <span>Para Firmar</span>
              <span class="badge-count">12</span>
            </a></li>
            <li><a href="borradores.jsp" onclick="window.location.href='borradores.jsp'; return false;">
              <span>Borradores</span>
              <span class="badge-count">5</span>
            </a></li>
            <li><a href="bandeja-entrada.jsp" onclick="window.location.href='bandeja-entrada.jsp'; return false;">
              <span>Bandeja de Entrada</span>
              <span class="badge-count">23</span>
            </a></li>
            <li><a href="enviados.jsp" onclick="window.location.href='enviados.jsp'; return false;">
              <span>Enviados</span>
            </a></li>
            <li><a href="documentos-externos.jsp" onclick="window.location.href='documentos-externos.jsp'; return false;">
              <span>Documentos Externos</span>
            </a></li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- GESTIÓN -->
    <div class="nav-section">
      <div class="accordion-item" id="accordionGestion">
        <button class="accordion-button" type="button" onclick="toggleAccordion('accordionGestion')">
          <i class="bi bi-gear"></i>
          <span>Gestión</span>
        </button>
        <div class="accordion-body">
          <ul class="submenu">
            <li><a href="delegados.jsp" onclick="window.location.href='delegados.jsp'; return false;">
              <span>Delegados</span>
              <span class="badge-count">8</span>
            </a></li>
            <li><a href="urgentes.jsp" onclick="window.location.href='urgentes.jsp'; return false;">
              <span>Urgentes</span>
              <span class="badge-count">3</span>
            </a></li>
            <li><a href="vistos-buenos.jsp" onclick="window.location.href='vistos-buenos.jsp'; return false;">
              <span>Vistos Buenos</span>
              <span class="badge-count">7</span>
            </a></li>
            <li><a href="seguimiento.jsp" onclick="window.location.href='seguimiento.jsp'; return false;">
              <span>Seguimiento</span>
            </a></li>
            <li><a href="referencias.jsp" onclick="window.location.href='referencias.jsp'; return false;">
              <span>Referencias</span>
            </a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ADMINISTRACIÓN -->
    <div class="nav-section">
      <div class="accordion-item" id="accordionAdmin">
        <button class="accordion-button" type="button" onclick="toggleAccordion('accordionAdmin')">
          <i class="bi bi-shield-lock"></i>
          <span>Administración</span>
        </button>
        <div class="accordion-body">
          <ul class="submenu">
            <li><a href="admin-usuarios.jsp" onclick="window.location.href='admin-usuarios.jsp'; return false;">
              <span>Gestión de Usuarios</span>
            </a></li>
            <li><a href="admin-roles.jsp" onclick="window.location.href='admin-roles.jsp'; return false;">
              <span>Roles y Permisos</span>
            </a></li>
            <li><a href="admin-proyectos.jsp" onclick="window.location.href='admin-proyectos.jsp'; return false;">
              <span>Proyectos</span>
            </a></li>
            <li><a href="admin-plantillas.jsp" onclick="window.location.href='admin-plantillas.jsp'; return false;">
              <span>Plantillas</span>
            </a></li>
            <li><a href="admin-flujos.jsp" onclick="window.location.href='admin-flujos.jsp'; return false;">
              <span>Flujos de Trabajo</span>
            </a></li>
            <li><a href="admin-auditoria.jsp" onclick="window.location.href='admin-auditoria.jsp'; return false;">
              <span>Auditoría</span>
            </a></li>
            <li><a href="admin-reportes.jsp" onclick="window.location.href='admin-reportes.jsp'; return false;">
              <span>Reportes</span>
            </a></li>
            <li><a href="admin-configuracion.jsp" onclick="window.location.href='admin-configuracion.jsp'; return false;">
              <span>Configuración</span>
            </a></li>
          </ul>
        </div>
      </div>
    </div>
  </nav>

  <div class="sidebar-toast" id="sidebarToast">
    <i class="bi bi-info-circle"></i>
    <span id="toastMessage">Documento procesado en Urgentes</span>
  </div>
</header>