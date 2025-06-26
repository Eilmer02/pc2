
const statisticsUpdateInterval = window.statisticsUpdateInterval || null;
let userSessionData = window.SGD_USER_DATA || {};

/* ==================== INITIALIZATION ==================== */
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar funciones críticas primero
  initializeEventListeners();
  checkSystemStatus();
  
  // Cargar funciones no críticas después
  setTimeout(() => {
    initializeAOS();
    initializeTyped();
    initializeDashboard();
    enhanceScrollEffects();
    initDarkModeSupport();
    enhanceAccessibility();
    
    // Expandir el primer acordeón por defecto
    toggleAccordion('accordionDocumentos', true);
    
    // Mostrar notificación en la barra lateral después de unos segundos
    setTimeout(() => {
      showSidebarToast("Sistema SGD operativo - " + (userSessionData.nombreCompleto || 'Usuario'), 5000);
    }, 3000);
  }, 100);
});

/* ==================== DASHBOARD FUNCTIONS - NUEVAS ==================== */
function initializeDashboard() {
  // Solo inicializar dashboard en index.jsp
  if (window.location.pathname.endsWith('index.jsp') || window.location.pathname.endsWith('/')) {
    cargarEstadisticasDashboard();
    configurarAtajosTeclado();
    iniciarActualizacionPeriodica();
    
    console.log('🚀 SGD Dashboard - Sistema de Gestión Documental');
    console.log('👤 Usuario:', userSessionData.nombreCompleto || 'No identificado');
    console.log('📋 Cargo:', userSessionData.cargo || 'Sin cargo');
    console.log('📊 Dashboard inicializado correctamente');
  }
}

/**
 * Carga estadísticas del dashboard desde el servidor
 */
function cargarEstadisticasDashboard() {
  if (!userSessionData.usuarioId) {
    console.warn('No hay datos de usuario disponibles');
    return;
  }

  fetch(`DashboardServlet?action=obtenerEstadisticas&usuarioId=${userSessionData.usuarioId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Actualizar valores dinámicamente con animación
        actualizarEstadistica('documentosPendientes', data.documentosPendientes);
        actualizarEstadistica('documentosFirmados', data.documentosFirmados);
        actualizarEstadistica('vistosButenos', data.vistosButenos);
        actualizarEstadistica('documentosMes', data.documentosMes);
        
        // Actualizar tiempo de última actualización
        const timeElement = document.getElementById('ultimaActualizacion');
        if (timeElement) {
          timeElement.textContent = 'ahora mismo';
        }
        
        console.log('📊 Estadísticas actualizadas:', data);
      } else {
        console.warn('Error del servidor:', data.message);
      }
    })
    .catch(error => {
      console.log('ℹ️ Usando datos estáticos (modo desarrollo):', error.message);
      // En desarrollo, mantener valores estáticos
    });
}

/**
 * Actualiza una estadística con animación
 */
function actualizarEstadistica(elementId, nuevoValor) {
  const elemento = document.getElementById(elementId);
  if (!elemento || nuevoValor === undefined) return;
  
  const valorActual = parseInt(elemento.textContent) || 0;
  const valorObjetivo = parseInt(nuevoValor) || 0;
  
  if (valorActual === valorObjetivo) return;
  
  // Animación de conteo
  const duracion = 1000; // 1 segundo
  const pasos = 30;
  const incremento = (valorObjetivo - valorActual) / pasos;
  let valorTemporal = valorActual;
  let paso = 0;
  
  const interval = setInterval(() => {
    paso++;
    valorTemporal += incremento;
    
    if (paso === pasos) {
      elemento.textContent = valorObjetivo;
      clearInterval(interval);
    } else {
      elemento.textContent = Math.round(valorTemporal);
    }
  }, duracion / pasos);
}

/**
 * Configura atajos de teclado
 */
function configurarAtajosTeclado() {
  document.addEventListener('keydown', function(e) {
    // Solo si no estamos en un input o textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    
    if (e.ctrlKey) {
      switch(e.key) {
        case 'n':
          e.preventDefault();
          nuevoDocumento();
          break;
        case 'f':
          e.preventDefault();
          buscarDocumentos();
          break;
        case 'r':
          e.preventDefault();
          location.reload();
          break;
        case 'd':
          e.preventDefault();
          navigateTo('para-firmar');
          break;
      }
    }
    
    // Atajos sin Ctrl
    switch(e.key) {
      case 'F1':
        e.preventDefault();
        mostrarAyuda();
        break;
      case 'Escape':
        cerrarModalesAbiertos();
        break;
    }
  });
}

/**
 * Inicia actualización periódica de estadísticas
 */
function iniciarActualizacionPeriodica() {
  // Limpiar interval anterior si existe
  if (statisticsUpdateInterval) {
    clearInterval(statisticsUpdateInterval);
  }
  
  // Actualizar cada 5 minutos
  statisticsUpdateInterval = setInterval(() => {
    cargarEstadisticasDashboard();
  }, 300000);
}

/* ==================== NAVIGATION FUNCTIONS - ACTUALIZADAS ==================== */
function navigateTo(page) {
  if (page.includes('.jsp')) {
    window.location.href = page;
  } else {
    window.location.href = page + '.jsp';
  }
}

function emitirDocumento() {
  mostrarNotificacion('Abriendo editor de documentos...', 'info');
  setTimeout(() => {
    window.location.href = 'emitir-documento.jsp';
  }, 500);
}

function atenderDocumento() {
  mostrarNotificacion('Cargando módulo de atención...', 'info');
  setTimeout(() => {
    window.location.href = 'atender-documento.jsp';
  }, 500);
}

function firmarDocumento() {
  mostrarNotificacion('Verificando certificados digitales...', 'info');
  setTimeout(() => {
    window.location.href = 'para-firmar.jsp';
  }, 800);
}

function seguimientoDocumento() {
  mostrarNotificacion('Cargando trazabilidad...', 'info');
  setTimeout(() => {
    window.location.href = 'seguimiento.jsp';
  }, 500);
}

function anexarArchivos() {
  mostrarNotificacion('Preparando gestor de archivos...', 'info');
  setTimeout(() => {
    window.location.href = 'anexar-archivos.jsp';
  }, 500);
}

function referencias() {
  mostrarNotificacion('Cargando referencias...', 'info');
  setTimeout(() => {
    window.location.href = 'referencias.jsp';
  }, 500);
}

function retrotraer() {
  mostrarNotificacion('Cargando módulo de corrección...', 'info');
  setTimeout(() => {
    window.location.href = 'retrotraer-documentos.jsp';
  }, 500);
}

function reportes() {
  mostrarNotificacion('Generando reportes...', 'info');
  setTimeout(() => {
    window.location.href = 'admin-reportes.jsp';
  }, 500);
}

function nuevoDocumento() {
  emitirDocumento();
}

function buscarDocumentos() {
  mostrarNotificacion('Activando búsqueda avanzada...', 'info');
  setTimeout(() => {
    window.location.href = 'buscar-documentos.jsp';
  }, 500);
}

function showMonthlyReport() {
  mostrarNotificacion('Generando reporte mensual...', 'info');
  setTimeout(() => {
    window.open('reporte-mensual.jsp', '_blank');
  }, 800);
}

/* ==================== EXISTING FUNCTIONS - MANTENIDAS ==================== */

// Función mejorada para mostrar notificaciones en barra lateral
function showSidebarToast(message, duration = 3000) {
  const toast = document.getElementById('sidebarToast');
  const messageEl = document.getElementById('toastMessage');
  
  if (toast && messageEl) {
    messageEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
}

// Initialize AOS Animation with improved settings
function initializeAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 500,
      easing: 'ease-out-cubic',
      once: true,
      mirror: false,
      offset: 50,
      delay: 100,
      disable: window.innerWidth < 768
    });
    
    setTimeout(() => {
      AOS.refresh();
    }, 200);
  }
}

function initializeTyped() {
  const el = document.querySelector('.typed');
  if (!el || typeof Typed === 'undefined') {
    return;
  }

  new Typed(el, {
    strings: [
      "GESTIÓN DOCUMENTAL DIGITAL",
      "FIRMA DIGITAL CERTIFICADA", 
      "TRAZABILIDAD COMPLETA",
      "FLUJOS DE TRABAJO AUTOMATIZADOS",
      "GESTIÓN DE PROYECTOS VIALES",
      "ANEXOS Y PLANOS DIGITALES"
    ],
    typeSpeed: 60,
    backSpeed: 40,
    backDelay: 2000,
    startDelay: 800,
    loop: true,
    showCursor: true,
    cursorChar: '|',
    smartBackspace: true
  });
}

function checkSystemStatus() {
  console.log('🔍 Verificando estado del sistema...');
  // Simulación de verificación del sistema
  setTimeout(() => {
    console.log('✅ Sistema operativo');
  }, 1000);
}

/* ==================== ACCORDION FUNCTIONS - MEJORADO ANTI-PARPADEO ==================== */
function toggleAccordion(id, forceOpen = false) {
  const accordionItem = document.getElementById(id);
  if (!accordionItem) return;
  
  const accordionButton = accordionItem.querySelector('.accordion-button');
  const accordionBody = accordionItem.querySelector('.accordion-body');
  
  if (!accordionButton || !accordionBody) return;
  
  const isExpanded = accordionButton.getAttribute('aria-expanded') === 'true';
  
  // Si forceOpen es true, solo abrir si está cerrado
  if (forceOpen && isExpanded) {
    return;
  }
  
  // Toggle aria-expanded attribute
  accordionButton.setAttribute('aria-expanded', (!isExpanded).toString());
  
  // Toggle active class for styling
  if (!isExpanded) {
    accordionItem.classList.add('active');
    // Establecer altura máxima más generosa para evitar cortes
    const submenu = accordionBody.querySelector('.submenu');
    if (submenu) {
      const submenuItems = submenu.querySelectorAll('li').length;
      const itemHeight = 44; // Altura ajustada por ítem
      const extraSpace = 20; // Espacio extra para evitar cortes
      accordionBody.style.maxHeight = `${(submenuItems * itemHeight) + extraSpace}px`;
    }
  } else {
    accordionItem.classList.remove('active');
    accordionBody.style.maxHeight = '0';
  }
  
  // Cerrar otros acordeones si estamos abriendo uno
  if (!isExpanded) {
    const allAccordions = document.querySelectorAll('.accordion-item');
    allAccordions.forEach(item => {
      if (item.id !== id) {
        const button = item.querySelector('.accordion-button');
        const body = item.querySelector('.accordion-body');
        if (button && body) {
          button.setAttribute('aria-expanded', 'false');
          item.classList.remove('active');
          body.style.maxHeight = '0';
        }
      }
    });
  }
}

/* ==================== EVENT LISTENERS - SIN INTERFERIR CON NAVEGACIÓN ==================== */
function initializeEventListeners() {
  // Gestión de barra lateral con prevención de parpadeo
  const sidebar = document.querySelector('.header');
  if (sidebar) {
    let sidebarTimer;
    let isTransitioning = false;
    
    sidebar.addEventListener('mouseenter', function() {
      clearTimeout(sidebarTimer);
      if (!isTransitioning) {
        isTransitioning = true;
        document.body.classList.add('sidebar-expanded');
        
        // Retraso para garantizar que la transición sea suave
        setTimeout(() => {
          // Reajustar alturas de los acordeones expandidos
          document.querySelectorAll('.accordion-item.active').forEach(item => {
            const body = item.querySelector('.accordion-body');
            const submenu = body.querySelector('.submenu');
            if (submenu) {
              const submenuItems = submenu.querySelectorAll('li').length;
              const itemHeight = 44;
              const extraSpace = 20;
              body.style.maxHeight = `${(submenuItems * itemHeight) + extraSpace}px`;
            }
          });
          isTransitioning = false;
        }, 150);
      }
    });
    
    sidebar.addEventListener('mouseleave', function() {
      if (!isTransitioning) {
        sidebarTimer = setTimeout(() => {
          document.body.classList.remove('sidebar-expanded');
        }, 200); // Delay más largo para evitar parpadeo
      }
    });
  }

  // Inicializar acordeones
  document.querySelectorAll('.accordion-button').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
  });

  // Click outside to close dropdowns - MEJORADO
  document.addEventListener('click', function(e) {
    // Close profile dropdown
    const profileDropdown = document.getElementById('profileDropdown');
    const userProfile = document.querySelector('.user-profile');
    
    if (profileDropdown && userProfile && !userProfile.contains(e.target) && profileDropdown.classList.contains('show')) {
      profileDropdown.classList.remove('show');
    }

    // Close mobile menu
    const header = document.querySelector('.header');
    const toggle = document.querySelector('.header-toggle');
    
    if (window.innerWidth <= 1024 && 
        header && toggle &&
        !header.contains(e.target) && 
        !toggle.contains(e.target) && 
        header.classList.contains('show')) {
      header.classList.remove('show');
    }
  });
}

/* ==================== UTILITY FUNCTIONS ==================== */
function mostrarNotificacion(mensaje, tipo = 'info') {
  console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  
  // Si existe la función showToast, usarla
  if (typeof showToast === 'function') {
    showToast(mensaje, tipo);
  } else {
    // Crear notificación simple
    showSidebarToast(mensaje, 3000);
  }
}

function mostrarAyuda() {
  const ayuda = `
SGD - Sistema de Gestión Documental
Atajos de Teclado:
• Ctrl+N: Nuevo Documento
• Ctrl+F: Buscar Documentos  
• Ctrl+D: Documentos Para Firmar
• Ctrl+R: Actualizar Página
• F1: Esta Ayuda
• Esc: Cerrar Modales
  `;
  alert(ayuda);
}

function cerrarModalesAbiertos() {
  // Cerrar modales de Bootstrap si están abiertos
  const modales = document.querySelectorAll('.modal.show');
  modales.forEach(modal => {
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    }
  });
  
  // Cerrar dropdowns
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileDropdown && profileDropdown.classList.contains('show')) {
    profileDropdown.classList.remove('show');
  }
}

function enhanceScrollEffects() {
  // Efectos de scroll mejorados si es necesario
}

function initDarkModeSupport() {
  // Soporte para modo oscuro futuro
}

function enhanceAccessibility() {
  // Mejoras de accesibilidad
}

/* ==================== MENU TOGGLE ==================== */
function toggleMenu() {
  const header = document.querySelector('.header');
  if (header) {
    header.classList.toggle('show');
  }
}

/* ==================== PROFILE DROPDOWN ==================== */
function toggleProfileDropdown() {
  const dropdown = document.getElementById('profileDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

/* ==================== CONTEXT SELECTOR ==================== */
function showContextSelector() {
  mostrarNotificacion('Cargando selector de proyectos...', 'info');
  // TODO: Implementar selector de contexto
}

/* ==================== PROFILE FUNCTIONS ==================== */
function openProfile() {
  window.location.href = 'perfil-usuario.jsp';
}

function openSettings() {
  window.location.href = 'configuracion-usuario.jsp';
}

function openPreferences() {
  window.location.href = 'preferencias-usuario.jsp';
}

function openNotifications() {
  window.location.href = 'notificaciones.jsp';
}

function openHelp() {
  window.location.href = 'ayuda.jsp';
}

function openDocumentation() {
  window.open('documentacion.jsp', '_blank');
}

function showAbout() {
  alert('SGD - Sistema de Gestión Documental v2.1.0\n\nConstructora Vial S.A.\n© 2025 Todos los derechos reservados');
}

function logout() {
  if (confirm('¿Está seguro que desea cerrar sesión?')) {
    mostrarNotificacion('Cerrando sesión...', 'info');
    setTimeout(() => {
      window.location.href = 'LogoutServlet';
    }, 1000);
  }
}

/* ==================== CLEANUP ==================== */
window.addEventListener('beforeunload', function() {
  // Limpiar intervals al salir
  if (statisticsUpdateInterval) {
    clearInterval(statisticsUpdateInterval);
  }
});

console.log('📋 scripts.js cargado - SGD Sistema de Gestión Documental v2.1.0');