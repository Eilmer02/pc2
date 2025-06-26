<!DOCTYPE html>
<html lang="es">
<head>
  <!-- ==================== HEAD MODULE ==================== -->
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>SGD - Sistema de Gestión Documental</title>
  <meta content="Sistema integral para la gestión documental de constructora vial" name="description">
  <meta content="gestión documental, constructora, documentos, firma digital" name="keywords">

  <!-- ==================== FAVICON ==================== -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%234f46e5' d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z'/></svg>" type="image/svg+xml">

  <!-- ==================== EXTERNAL CSS RESOURCES ==================== -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.0/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">

  <!-- ==================== CUSTOM CSS ==================== -->
  <link href="./assets/css/styles.css" rel="stylesheet">

  <!-- ==================== EXTERNAL JS RESOURCES (DEFER) ==================== -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/typed.js/2.0.12/typed.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js" defer></script>

  <!-- ==================== CUSTOM JS ==================== -->
  <script src="./assets/js/scripts.js" defer></script>

  <!-- ==================== NAVIGATION ACTIVE STATE SCRIPT ==================== -->
  <script>
    // Marcar enlace activo basado en la página actual
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.jsp';
        const currentLink = document.querySelector(`.submenu a[href="${currentPage}"]`);
        
        if (currentLink) {
          // Remover todas las clases activas
          document.querySelectorAll('.submenu a').forEach(link => {
            link.classList.remove('active');
          });
          
          // Activar el enlace actual
          currentLink.classList.add('active');
          
          // Abrir el acordeón correspondiente
          const accordionItem = currentLink.closest('.accordion-item');
          if (accordionItem && typeof toggleAccordion === 'function') {
            setTimeout(() => {
              toggleAccordion(accordionItem.id, true);
            }, 300);
          }
        }
      }, 200);
    });
    
    console.log('? SGD - Sistema de Gestión Documental v2.1.0');
  </script>
</head>