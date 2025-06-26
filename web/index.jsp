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
    <!-- Company Hero Section -->
    <section class="company-hero">
      <div class="company-content">
        <div class="company-logo-container float-animation" data-aos="zoom-in">
          <i class="bi bi-building"></i>
        </div>
        <h1 data-aos="fade-up">CONSTRUCTORA VIAL S.A.</h1>
        <div class="typed-container" data-aos="fade-up" data-aos-delay="200">
          <span class="typed"></span>
        </div>
        <p class="company-description" data-aos="fade-up" data-aos-delay="400">
          Sistema integral para la gestión documental digital de proyectos de construcción vial con firma digital certificada y trazabilidad completa.
        </p>
      </div>
    </section>

    <!-- Dashboard Stats -->
    <div class="stats-container">
      <div class="stat-card fade-in-up" onclick="navigateTo('para-firmar')" data-aos="fade-up">
        <div class="stat-content">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="bi bi-file-earmark-text"></i>
            </div>
            <span class="stat-change positive">
              <i class="bi bi-arrow-up"></i>
              +12%
            </span>
          </div>
          <div class="stat-main">
            <div class="stat-value" id="documentosPendientes">58</div>
            <div class="stat-label">Documentos Pendientes</div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend">
              <i class="bi bi-clock"></i>
              Última actualización: <span id="ultimaActualizacion">hace 5 min</span>
            </span>
            <a href="para-firmar.jsp" class="stat-action">
              Ver todos <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
      
      <div class="stat-card fade-in-up" onclick="navigateTo('enviados')" data-aos="fade-up">
        <div class="stat-content">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="bi bi-check2-all"></i>
            </div>
            <span class="stat-change positive">
              <i class="bi bi-arrow-up"></i>
              +8%
            </span>
          </div>
          <div class="stat-main">
            <div class="stat-value" id="documentosFirmados">124</div>
            <div class="stat-label">Documentos Firmados Hoy</div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend">
              <i class="bi bi-graph-up"></i>
              Tendencia positiva
            </span>
            <a href="enviados.jsp" class="stat-action">
              Ver reporte <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
      
      <div class="stat-card fade-in-up" onclick="navigateTo('vistos-buenos')" data-aos="fade-up">
        <div class="stat-content">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="bi bi-clock-history"></i>
            </div>
            <span class="stat-change negative">
              <i class="bi bi-arrow-down"></i>
              -3%
            </span>
          </div>
          <div class="stat-main">
            <div class="stat-value" id="vistosButenos">15</div>
            <div class="stat-label">En Proceso de VB°</div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend">
              <i class="bi bi-exclamation-circle"></i>
              Requiere atención
            </span>
            <a href="vistos-buenos.jsp" class="stat-action">
              Gestionar <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
      
      <div class="stat-card fade-in-up" onclick="showMonthlyReport()" data-aos="fade-up">
        <div class="stat-content">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="bi bi-bar-chart"></i>
            </div>
            <span class="stat-change positive">
              <i class="bi bi-arrow-up"></i>
              +15%
            </span>
          </div>
          <div class="stat-main">
            <div class="stat-value" id="documentosMes">237</div>
            <div class="stat-label">Documentos Este Mes</div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend">
              <i class="bi bi-calendar-check"></i>
              Meta cumplida
            </span>
            <a href="#" class="stat-action" onclick="showMonthlyReport()">
              Ver detalles <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones Principales -->
    <section id="acciones">
      <div class="section-header" data-aos="fade-up">
        <h2>Gestión de Documentos</h2>
        <p>Acciones principales para la gestión documental digital de proyectos viales</p>
      </div>

      <div class="cards-grid">
        <div class="card-item card-primary" onclick="emitirDocumento()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-send"></i>
          </div>
          <h3 class="card-title">EMITIR DOCUMENTO</h3>
          <p class="card-description">Crear y enviar documentos oficiales con firma digital certificada</p>
        </div>

        <div class="card-item card-info" onclick="atenderDocumento()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-reply"></i>
          </div>
          <h3 class="card-title">ATENDER Y DERIVAR</h3>
          <p class="card-description">Responder comunicaciones y crear documentos vinculados</p>
        </div>

        <div class="card-item card-success" onclick="firmarDocumento()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-pen"></i>
          </div>
          <h3 class="card-title">FIRMAR DOCUMENTOS</h3>
          <p class="card-description">Firmar digitalmente con certificados PKI validados</p>
        </div>

        <div class="card-item card-warning" onclick="seguimientoDocumento()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-eye"></i>
          </div>
          <h3 class="card-title">SEGUIMIENTO</h3>
          <p class="card-description">Monitorear el estado y trazabilidad de documentos</p>
        </div>
      </div>
    </section>

    <!-- Herramientas y Utilidades -->
    <section id="herramientas" style="margin-top: 4rem;">
      <div class="section-header" data-aos="fade-up">
        <h2>Herramientas y Utilidades</h2>
        <p>Funcionalidades adicionales para optimizar la gestión documental</p>
      </div>

      <div class="cards-grid">
        <div class="card-item card-info" onclick="anexarArchivos()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-paperclip"></i>
          </div>
          <h3 class="card-title">ANEXAR ARCHIVOS</h3>
          <p class="card-description">Adjuntar planos, fotos y documentos técnicos</p>
        </div>

        <div class="card-item card-success" onclick="referencias()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-link-45deg"></i>
          </div>
          <h3 class="card-title">REFERENCIAS</h3>
          <p class="card-description">Vincular documentos relacionados para trazabilidad</p>
        </div>

        <div class="card-item card-warning" onclick="retrotraer()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-arrow-counterclockwise"></i>
          </div>
          <h3 class="card-title">RETROTRAER</h3>
          <p class="card-description">Corregir documentos emitidos manteniendo integridad</p>
        </div>

        <div class="card-item card-secondary" onclick="reportes()" data-aos="fade-up">
          <div class="card-icon">
            <i class="bi bi-graph-up"></i>
          </div>
          <h3 class="card-title">REPORTES</h3>
          <p class="card-description">Estadísticas y análisis detallados de gestión</p>
        </div>
      </div>
    </section>
     <section>
   
  </main>
  
    <%@ include file="modules/footer.jsp" %>
  <!-- ==================== QUICK ACTIONS ==================== -->
  <div class="quick-actions">
    <button class="quick-action-btn" onclick="nuevoDocumento()" title="Nuevo Documento (Ctrl+N)">
      <i class="bi bi-plus-lg"></i>
    </button>
  </div>

  <!-- ==================== DATOS PARA JAVASCRIPT ==================== -->
  <script>
    // Datos del usuario para JavaScript
    window.SGD_USER_DATA = {
      usuarioId: <%= usuarioId %>,
      nombreCompleto: '<%= nombreCompleto %>',
      cargo: '<%= cargo %>',
      correo: '<%= correo %>'
    };
  </script>
</body>
</html>