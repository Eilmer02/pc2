<%@page import="java.text.SimpleDateFormat"%>
<%@page import="java.util.Date"%>
<%@page import="java.util.Locale"%>
<%
    // Verificar sesión activa
    HttpSession userSession = request.getSession(false);
    if (userSession == null || userSession.getAttribute("usuarioId") == null) {
        response.sendRedirect("login.jsp");
        return;
    }

    // Obtener datos del usuario logueado
    String nombreCompleto = (String) userSession.getAttribute("nombreCompleto");
    String cargo = (String) userSession.getAttribute("cargo");
    String correo = (String) userSession.getAttribute("correo");
    String roles = (String) userSession.getAttribute("roles");
    Integer usuarioId = (Integer) userSession.getAttribute("usuarioId");
    
    if (nombreCompleto == null) nombreCompleto = "Usuario";
    if (cargo == null) cargo = "Sin cargo";
    
    // Formatear fecha actual
    SimpleDateFormat sdf = new SimpleDateFormat("EEEE, dd 'de' MMMM 'de' yyyy", new Locale("es", "ES"));
    String fechaActual = sdf.format(new Date());
%>

<!-- ==================== TOP BAR MODULE ==================== -->
<div class="top-bar">
  <!-- Status Indicator -->
  <div class="status-indicator">
    <div class="status-check active">
      <i class="bi bi-check"></i>
    </div>
    <span>Sistema Operativo - <strong>Proyecto Carretera Norte</strong></span>
  </div>
  
  <!-- User Info Section -->
  <div class="user-info">
    <div class="context-selector" onclick="showContextSelector()">
      <i class="bi bi-building"></i>
      <span>Cambiar Proyecto/Área</span>
      <i class="bi bi-chevron-down"></i>
    </div>
    
    <!-- User Profile with Dropdown -->
    <div class="user-profile" onclick="toggleProfileDropdown()">
      <span><%= nombreCompleto %></span>
      <i class="bi bi-person-circle"></i>
      
      <!-- Profile Dropdown Menu -->
      <div class="profile-dropdown" id="profileDropdown">
        <div class="profile-header">
          <div class="profile-avatar">
            <i class="bi bi-person-fill"></i>
          </div>
          <div class="profile-info">
            <div class="profile-name"><%= nombreCompleto %></div>
            <div class="profile-role"><%= cargo %></div>
          </div>
        </div>
        
        <div class="profile-menu">
          <a href="#" class="profile-menu-item" onclick="openProfile()">
            <i class="bi bi-person"></i>
            Mi Perfil
          </a>
          <a href="#" class="profile-menu-item" onclick="openSettings()">
            <i class="bi bi-gear"></i>
            Configuración
          </a>
          <a href="#" class="profile-menu-item" onclick="openPreferences()">
            <i class="bi bi-sliders"></i>
            Preferencias
          </a>
          <a href="#" class="profile-menu-item" onclick="openNotifications()">
            <i class="bi bi-bell"></i>
            Notificaciones
          </a>
          
          <div class="profile-menu-separator"></div>
          
          <a href="#" class="profile-menu-item" onclick="openHelp()">
            <i class="bi bi-question-circle"></i>
            Ayuda y Soporte
          </a>
          <a href="#" class="profile-menu-item" onclick="openDocumentation()">
            <i class="bi bi-book"></i>
            Documentación
          </a>
          <a href="#" class="profile-menu-item" onclick="showAbout()">
            <i class="bi bi-info-circle"></i>
            Acerca de SGD
          </a>
          
          <div class="profile-menu-separator"></div>
          
          <a href="#" class="profile-menu-item danger" onclick="logout()">
            <i class="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </a>
        </div>
      </div>
    </div>
  </div>
</div>