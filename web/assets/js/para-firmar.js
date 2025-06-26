/**
 * JavaScript para Gestión de Firma Digital de Documentos
 * Sistema de Gestión Documental - Constructora Vial S.A.
 * @version 2.1.2 (Optimizada y Limpiada)
 * @author SGD Team
 */

/* ==================== VARIABLES GLOBALES ==================== */
let documentos = [];
let certificados = [];
let paginaActual = 1;
let tamanioPagina = 10;
let totalPaginas = 0;
let documentoSeleccionado = null;
let certificadoSeleccionado = null;
let isLoading = false;


/* ==================== ESTADÍSTICAS - VERSIÓN ACTUALIZADA ==================== */

/**
 * Carga las estadísticas - versión optimizada
 */
async function cargarEstadisticas() {
    console.log('📊 Cargando estadísticas...');
    
    try {
        mostrarCargandoEstadisticas(true);
        
        const response = await fetch('DocumentosParaFirmarServlet?action=obtenerEstadisticas', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Respuesta de estadísticas del servidor:', data);

        if (data.success && data.estadisticas) {
            estadisticas = data.estadisticas;
            actualizarEstadisticas(estadisticas);
            console.log('✅ Estadísticas cargadas exitosamente');
        } else {
            throw new Error(data.message || 'Error al obtener estadísticas');
        }
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        mostrarAlerta('error', 'Error al cargar estadísticas: ' + error.message);
        mostrarEstadisticasError();
    } finally {
        mostrarCargandoEstadisticas(false);
    }
}

/**
 * Actualiza las estadísticas en la UI
 */
function actualizarEstadisticas(stats) {
    if (!stats) {
        console.warn('⚠️ Estadísticas nulas o indefinidas');
        return;
    }

    const elementos = [
        { id: 'documentosPendientes', valor: stats.pendientes || 0 },
        { id: 'documentosUrgentes', valor: stats.urgentes || 0 },
        { id: 'documentosSemana', valor: stats.semana || 0 },
        { id: 'documentosFirmadosHoy', valor: stats.firmadosHoy || 0 }
    ];

    elementos.forEach((elemento, index) => {
        const el = document.getElementById(elemento.id);
        if (el) {
            setTimeout(() => {
                animarContador(el, parseInt(elemento.valor));
            }, index * 100);
        } else {
            console.warn(`⚠️ Elemento no encontrado: ${elemento.id}`);
        }
    });

    // Log de estadísticas recibidas
    console.log('📊 Estadísticas procesadas:', {
        pendientes: stats.pendientes,
        urgentes: stats.urgentes,
        semana: stats.semana,
        firmadosHoy: stats.firmadosHoy
    });
}

// Cache para optimización
const cache = {
    filtros: new Map(),
    documentos: new Map(),
    timeouts: new Map()
};

/* ==================== INICIALIZACIÓN ==================== */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando módulo Para Firmar v2.1.2');
    inicializarPagina();
    configurarEventos();
    inicializarAnimaciones();
});

/**
 * Inicializa la página y carga los datos necesarios
 */
async function inicializarPagina() {
    mostrarCargando(true);
    
    try {
        await Promise.all([
            verificarCertificados(),
            cargarFiltrosDisponibles(),
            cargarEstadisticas()
        ]);
        
        await cargarDocumentos();
        console.log('✅ Módulo Para Firmar iniciado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando página:', error);
        mostrarAlerta('error', 'Error al cargar la página. Por favor, recargue.');
    } finally {
        mostrarCargando(false);
    }
}
async function recargarCertificadosGestion() {
    console.log('🔄 Recargando certificados (gestión)...');
    
    try {
        const incluirRevocados = document.getElementById('incluirRevocados')?.checked || false;
        
        const response = await fetch(`GestionCertificadosServlet?action=obtenerCertificados&incluirRevocados=${incluirRevocados}`, {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Normalizar certificados para consistencia
            certificados = (data.certificados || []).map(cert => ({
                // Mantener estructura original de BD
                ...cert,
                // Agregar alias para compatibilidad
                id: cert.id_certificado,
                nombre: cert.nombre_certificado,
                numeroSerie: cert.numero_serie,
                nombreTitular: cert.nombre_certificado // Para compatibilidad con código legacy
            }));
            
            console.log('✅ Certificados recargados (gestión):', certificados.length);
            
            // Actualizar UI según contexto
            if (typeof mostrarCertificados === 'function') {
                // Estamos en gestion-certificados.jsp
                mostrarCertificados();
            } else if (typeof cargarCertificadosEnSelect === 'function') {
                // Estamos en para-firmar.jsp
                cargarCertificadosEnSelect();
            }
            
            return data;
        } else {
            throw new Error(data.message || 'Error al cargar certificados');
        }
    } catch (error) {
        console.error('❌ Error en recargarCertificadosGestion:', error);
        
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('error', 'Error al cargar certificados: ' + error.message);
        }
        
        throw error;
    }
}
function debugCertificados() {
    console.log('\n🔍 ==================== DEBUG CERTIFICADOS ====================');
    console.log('📊 Variable certificados:');
    console.log('  - Existe:', typeof certificados !== 'undefined');
    console.log('  - Es array:', Array.isArray(certificados));
    console.log('  - Longitud:', certificados?.length || 'N/A');
    
    if (certificados && Array.isArray(certificados) && certificados.length > 0) {
        console.log('\n📋 Estructura de certificados:');
        
        // Analizar primer certificado
        const primer = certificados[0];
        console.log('  📄 Primer certificado:', primer);
        console.log('  🔑 Propiedades disponibles:', Object.keys(primer));
        
        // Verificar propiedades críticas
        console.log('\n🔍 Verificación de propiedades:');
        console.log('  - id_certificado:', primer.id_certificado);
        console.log('  - id:', primer.id);
        console.log('  - nombre_certificado:', primer.nombre_certificado);
        console.log('  - nombre:', primer.nombre);
        console.log('  - nombreTitular:', primer.nombreTitular);
        console.log('  - estado:', primer.estado);
        console.log('  - activo:', primer.activo);
        
        // Estados únicos
        const estados = [...new Set(certificados.map(c => c.estado))];
        console.log('  📈 Estados únicos:', estados);
        
        // Certificados por estado
        estados.forEach(estado => {
            const count = certificados.filter(c => c.estado === estado).length;
            console.log(`    - ${estado}: ${count} certificados`);
        });
    }
    
    console.log('\n🎯 Elementos DOM:');
    console.log('  - Select certificadoId:', !!document.getElementById('certificadoId'));
    console.log('  - Tabla certificados:', !!document.getElementById('certificadosTableBody'));
    
    console.log('\n🔧 Funciones disponibles:');
    console.log('  - cargarCertificadosEnSelect:', typeof cargarCertificadosEnSelect);
    console.log('  - actualizarInformacionCertificado:', typeof actualizarInformacionCertificado);
    console.log('  - mostrarAlerta:', typeof mostrarAlerta);
    console.log('  - mostrarCertificados:', typeof mostrarCertificados);
    
    console.log('==================== FIN DEBUG ====================\n');
}
function onCertificadoChangeHandler(event) {
    const certificadoId = event.target.value;
    console.log('🔄 Cambio de certificado detectado. ID:', certificadoId);
    
    // Limpiar certificado seleccionado
    certificadoSeleccionado = null;
    
    if (!certificadoId) {
        console.log('🚫 Certificado deseleccionado');
        ocultarInformacionCertificado();
        return;
    }
    
    // Buscar certificado en el array
    const certificadoEncontrado = certificados.find(cert => {
        const certId = cert.id_certificado || cert.id;
        return certId == certificadoId;
    });
    
    if (certificadoEncontrado) {
        // Normalizar certificado seleccionado
        certificadoSeleccionado = {
            ...certificadoEncontrado,
            id: certificadoEncontrado.id_certificado || certificadoEncontrado.id,
            id_certificado: certificadoEncontrado.id_certificado || certificadoEncontrado.id,
            nombre: certificadoEncontrado.nombre_certificado || certificadoEncontrado.nombre,
            numeroSerie: certificadoEncontrado.numero_serie || certificadoEncontrado.numeroSerie,
            nombreTitular: certificadoEncontrado.nombre_certificado || certificadoEncontrado.nombreTitular || certificadoEncontrado.nombre,
            autoridad: certificadoEncontrado.emisor || 'SGD Constructora Vial',
            fechaVencimiento: certificadoEncontrado.fecha_vencimiento || certificadoEncontrado.fechaVencimiento
        };
        
        console.log('✅ Certificado seleccionado normalizado:', certificadoSeleccionado);
        
        // Actualizar información del certificado
        if (typeof actualizarInformacionCertificado === 'function') {
            try {
                actualizarInformacionCertificado();
            } catch (error) {
                console.log('⚠️ Error actualizando información del certificado:', error.message);
            }
        }
    } else {
        console.error('❌ Certificado no encontrado en array. ID buscado:', certificadoId);
        console.log('📋 Certificados disponibles:', certificados.map(c => ({
            id_certificado: c.id_certificado,
            id: c.id,
            nombre: c.nombre_certificado || c.nombre
        })));
        
        mostrarAlerta('error', 'Error al seleccionar certificado. Por favor, recargue la página.');
    }
}
/* ==================== CONFIGURACIÓN DE EVENTOS ==================== */
function configurarEventos() {
    // Búsqueda en tiempo real con debounce
    const filtroBusqueda = document.getElementById('filtroBusqueda');
    if (filtroBusqueda) {
        filtroBusqueda.addEventListener('input', debounce(aplicarFiltros, 300));
    }

    // Validación de contraseña en tiempo real
    const passwordInput = document.getElementById('passwordCertificadoFirma');
    if (passwordInput) {
        passwordInput.addEventListener('input', debounce(function() {
            const password = this.value;
            if (password && certificadoSeleccionado) {
                validarPasswordCertificado(password);
            } else {
                const resultDiv = document.getElementById('passwordValidationResult');
                if (resultDiv) resultDiv.innerHTML = '';
            }
        }, 500));
    }

    // Cambio de certificado
    const certificadoSelect = document.getElementById('certificadoId');
    if (certificadoSelect) {
        certificadoSelect.addEventListener('change', function() {
            const certificadoId = this.value;
            if (certificadoId) {
                certificadoSeleccionado = certificados.find(c => c.id === certificadoId);
                actualizarInformacionCertificado();
            } else {
                ocultarInformacionCertificado();
            }
        });
    }

    // Eventos de modales
    const modalFirmar = document.getElementById('modalFirmarDocumento');
    if (modalFirmar) {
        modalFirmar.addEventListener('hidden.bs.modal', limpiarFormularioFirma);
        modalFirmar.addEventListener('shown.bs.modal', function() {
            setTimeout(() => {
                const certificadoSelect = document.getElementById('certificadoId');
                if (certificadoSelect && certificados.length > 0) {
                    certificadoSelect.focus();
                }
            }, 100);
        });
    }

    // Autoguardado de observaciones
    const observacionesInput = document.getElementById('observacionesFirma');
    if (observacionesInput) {
        observacionesInput.addEventListener('input', debounce(function() {
            localStorage.setItem('sgd_firmaObservaciones', this.value);
        }, 1000));
    }

    // Atajos de teclado globales
    configurarAtajosTeclado();
}
function configurarEventListenerCertificado() {
    const certificadoSelect = document.getElementById('certificadoId');
    
    if (certificadoSelect) {
        // Remover listeners existentes
        certificadoSelect.removeEventListener('change', onCertificadoChangeHandler);
        
        // Agregar nuevo listener
        certificadoSelect.addEventListener('change', onCertificadoChangeHandler);
        
        console.log('✅ Event listener de certificado configurado');
    }
}
/**
 * Configura atajos de teclado
 */
function configurarAtajosTeclado() {
    document.addEventListener('keydown', function(event) {
        // Ctrl + F = Enfocar búsqueda
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            const searchInput = document.getElementById('filtroBusqueda');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape = Cerrar modales
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            });
        }
    });
}

/**
 * Inicializa las animaciones de la página
 */
function inicializarAnimaciones() {
    const elementos = document.querySelectorAll('.card-animated, .stats-card');
    elementos.forEach((elemento, index) => {
        elemento.style.animationDelay = `${index * 0.1}s`;
    });
    setTimeout(animarContadores, 500);
}

/* ==================== GESTIÓN DE CERTIFICADOS ==================== */
/**
 * Verifica el estado de los certificados del usuario
 */
async function verificarCertificados() {
    console.log('🔄 Verificando certificados desde servidor...');
    
    try {
        const response = await fetch('DocumentosParaFirmarServlet?action=verificarCertificadosUsuario', {
            cache: 'no-cache',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Normalizar certificados recibidos
            certificados = (data.certificados || []).map(cert => ({
                // Mantener propiedades originales
                ...cert,
                // Agregar propiedades normalizadas
                id: cert.id_certificado || cert.id,
                nombre: cert.nombre_certificado || cert.nombre,
                numeroSerie: cert.numero_serie || cert.numeroSerie
            }));
            
            console.log('✅ Certificados verificados y normalizados:', certificados.length);
            
            // Actualizar UI
            if (typeof actualizarEstadoCertificados === 'function') {
                actualizarEstadoCertificados(data);
            }
            
            // Cargar en select
            cargarCertificadosEnSelect();
            
            return data;
        } else {
            throw new Error(data.message || 'Error al verificar certificados');
        }
    } catch (error) {
        console.error('❌ Error verificando certificados:', error);
        
        // Mostrar error en UI si hay función disponible
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('error', 'Error al verificar certificados: ' + error.message);
        } else {
            alert('Error al cargar certificados: ' + error.message);
        }
        
        throw error;
    }
}

/**
 * Actualiza la visualización del estado de certificados
 */
function actualizarEstadoCertificados(data) {
    const statusCard = document.getElementById('certificateStatusCard');
    const statusContent = document.getElementById('certificateStatusContent');
    
    if (!statusCard || !statusContent) return;
    
    if (!data.tieneCertificados) {
        statusCard.style.display = 'block';
        statusCard.className = 'card mb-4 card-animated alert-warning';
        statusContent.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle me-3" style="font-size: 2rem; color: var(--warning-color);"></i>
                <div>
                    <h6 class="mb-1">No tiene certificados digitales configurados</h6>
                    <p class="mb-0 text-muted">Para firmar documentos necesita configurar al menos un certificado digital válido.</p>
                </div>
            </div>
        `;
    } else if (data.certificadosVencidos > 0) {
        statusCard.style.display = 'block';
        statusCard.className = 'card mb-4 card-animated alert-info';
        statusContent.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-info-circle me-3" style="font-size: 2rem; color: var(--info-color);"></i>
                <div>
                    <h6 class="mb-1">Certificados disponibles: ${data.certificadosActivos}</h6>
                    <p class="mb-0 text-muted">
                        ${data.certificadosVencidos > 0 ? `Tiene ${data.certificadosVencidos} certificado(s) vencido(s). ` : ''}
                        Los certificados activos están funcionando correctamente.
                    </p>
                </div>
            </div>
        `;
    } else {
        statusCard.style.display = 'none';
    }
}

/**
 * Carga los certificados en el select del modal
 */
function cargarCertificadosEnSelect() {
    console.log('🔧 [UNIFIED] Cargando certificados en select...');
    
    const select = document.getElementById('certificadoId');
    if (!select) {
        console.error('❌ Elemento select certificadoId no encontrado');
        return;
    }
    
    // Limpiar select
    select.innerHTML = '<option value="">Seleccione un certificado...</option>';
    
    // Verificar variable certificados
    if (typeof certificados === 'undefined' || !Array.isArray(certificados)) {
        console.error('❌ Variable certificados no válida:', typeof certificados);
        mostrarOpcionError(select, 'Error: certificados no cargados');
        return;
    }
    
    console.log('📋 Total certificados:', certificados.length);
    if (certificados.length > 0) {
        console.log('📊 Muestra primer certificado:', certificados[0]);
    }
    
    // CORRECCIÓN PRINCIPAL: Usar estructura correcta de BD
    const certificadosActivos = certificados.filter(cert => {
        // Normalizar datos para manejar ambas estructuras
        const estado = cert.estado || cert.estadoCert || '';
        const activo = cert.activo !== undefined ? cert.activo : true;
        
        console.log('🔍 Verificando certificado:', {
            id: cert.id_certificado || cert.id,
            nombre: cert.nombre_certificado || cert.nombreTitular || cert.nombre,
            estado: estado,
            activo: activo
        });
        
        // Verificar estado activo (minúsculas como viene de BD)
        return estado.toLowerCase() === 'activo' && activo;
    });
    
    console.log('✅ Certificados activos encontrados:', certificadosActivos.length);
    
    if (certificadosActivos.length === 0) {
        console.log('⚠️ No hay certificados activos');
        mostrarOpcionError(select, 'No hay certificados activos disponibles');
        return;
    }
    
    // Cargar certificados en el select
    certificadosActivos.forEach((certificado, index) => {
        const option = document.createElement('option');
        
        // Normalizar propiedades (manejar ambas estructuras)
        const certificadoId = certificado.id_certificado || certificado.id;
        const nombreCert = certificado.nombre_certificado || certificado.nombreTitular || certificado.nombre || 'Certificado';
        const numeroSerie = certificado.numero_serie || certificado.numeroSerie || 'N/A';
        
        option.value = certificadoId;
        
        // Formato mejorado para el texto
        const serieCorta = numeroSerie.length > 8 ? numeroSerie.substring(0, 8) + '...' : numeroSerie;
        option.textContent = `${nombreCert} - ${serieCorta}`;
        
        // Guardar datos normalizados del certificado
        const certificadoNormalizado = {
            id: certificadoId,
            id_certificado: certificadoId,
            nombre: nombreCert,
            nombre_certificado: nombreCert,
            numeroSerie: numeroSerie,
            numero_serie: numeroSerie,
            estado: certificado.estado || 'activo',
            estadoVigencia: certificado.estadoVigencia || certificado.estado_vigencia || 'vigente',
            emisor: certificado.emisor || 'SGD',
            fechaVencimiento: certificado.fechaVencimiento || certificado.fecha_vencimiento,
            esActivo: certificado.esActivo || certificado.es_activo_usuario || false,
            diasParaVencer: certificado.diasParaVencer || certificado.dias_para_vencer || 999
        };
        
        option.dataset.certificado = JSON.stringify(certificadoNormalizado);
        select.appendChild(option);
        
        console.log(`📝 Certificado ${index + 1} agregado:`, {
            id: certificadoId,
            nombre: nombreCert,
            serie: serieCorta
        });
    });
    
    // Auto-seleccionar si solo hay uno
    if (certificadosActivos.length === 1) {
        const cert = certificadosActivos[0];
        const certId = cert.id_certificado || cert.id;
        
        select.value = certId;
        
        // Actualizar variable global si existe
        if (typeof certificadoSeleccionado !== 'undefined') {
            certificadoSeleccionado = cert;
        }
        
        // Llamar función de actualización si existe
        if (typeof actualizarInformacionCertificado === 'function') {
            try {
                actualizarInformacionCertificado();
            } catch (error) {
                console.log('⚠️ Error en actualizarInformacionCertificado:', error.message);
            }
        }
        
        console.log('🎯 Certificado único auto-seleccionado:', cert);
    }
    
    console.log('✅ Carga de certificados completada exitosamente');
}
function mostrarOpcionError(select, mensaje) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = mensaje;
    option.disabled = true;
    option.style.color = '#dc3545';
    select.appendChild(option);
}
/**
 * Actualiza la información del certificado seleccionado
 */
function actualizarInformacionCertificado() {
    const infoDiv = document.getElementById('infoCertificadoSeleccionado');
    const certificadoInfo = document.getElementById('certificadoInfo');
    
    if (!infoDiv || !certificadoInfo || !certificadoSeleccionado) return;

    const fechaVencimiento = new Date(certificadoSeleccionado.fechaVencimiento);
    const diasVencimiento = Math.ceil((fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24));
    
    let badgeClass = 'bg-success';
    let estadoTexto = `${diasVencimiento} días restantes`;
    
    if (diasVencimiento <= 0) {
        badgeClass = 'bg-danger';
        estadoTexto = 'Vencido';
    } else if (diasVencimiento <= 7) {
        badgeClass = 'bg-danger';
    } else if (diasVencimiento <= 30) {
        badgeClass = 'bg-warning';
    }
    
    certificadoInfo.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p class="mb-2"><strong>Titular:</strong> ${htmlEscape(certificadoSeleccionado.nombreTitular)}</p>
                <p class="mb-2"><strong>Emisor:</strong> ${htmlEscape(certificadoSeleccionado.autoridad)}</p>
            </div>
            <div class="col-md-6">
                <p class="mb-2"><strong>Válido hasta:</strong> ${formatearFecha(certificadoSeleccionado.fechaVencimiento)}</p>
                <p class="mb-2"><strong>Estado:</strong> 
                    <span class="badge ${badgeClass}">${estadoTexto}</span>
                </p>
            </div>
        </div>
    `;
    
    infoDiv.style.display = 'block';
    infoDiv.classList.add('animate-on-scroll', 'animated');
}

/**
 * Oculta la información del certificado
 */
function ocultarInformacionCertificado() {
    const infoDiv = document.getElementById('infoCertificadoSeleccionado');
    if (infoDiv) {
        infoDiv.style.display = 'none';
        infoDiv.classList.remove('animate-on-scroll', 'animated');
    }
}

/* ==================== GESTIÓN DE DOCUMENTOS ==================== */
/**
 * Carga los documentos pendientes de firma
 */
async function cargarDocumentos() {
    if (isLoading) {
        console.log('🔄 Carga ya en progreso, ignorando solicitud duplicada');
        return;
    }
    
    isLoading = true;
    mostrarCargandoTabla(true);
    
    try {
        const params = new URLSearchParams({
            action: 'obtenerDocumentos',
            pagina: paginaActual,
            tamanio: tamanioPagina,
            ...filtrosActuales
        });
        
        console.log('🔍 Solicitando documentos:', params.toString());
        
        const response = await fetch(`DocumentosParaFirmarServlet?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Respuesta no es JSON válido');
        }
        
        const data = await response.json();
        console.log('📄 Respuesta del servidor:', data);
        
        if (!data) {
            throw new Error('Respuesta vacía del servidor');
        }
        
        if (data.success === false) {
            throw new Error(data.message || data.error || 'Error desconocido del servidor');
        }
        
        // Procesar datos recibidos
        procesarDatosDocumentos(data);
        console.log(`✅ ${documentos.length} documentos cargados exitosamente`);
        
        // Guardar en cache
        const cacheKey = JSON.stringify(filtrosActuales);
        cache.documentos.set(cacheKey, {
            documentos: documentos,
            timestamp: Date.now(),
            total: data.total
        });
        
    } catch (error) {
        console.error('❌ Error cargando documentos:', error);
        manejarErrorCargaDocumentos(error);
    } finally {
        isLoading = false;
        mostrarCargandoTabla(false);
    }
}

/**
 * Procesa los datos de documentos recibidos del servidor
 */
function procesarDatosDocumentos(data) {
    // Verificar estructura de datos esperada
    if (!Array.isArray(data.documentos)) {
        console.warn('⚠️ Formato de datos inesperado, intentando recuperar');
        if (Array.isArray(data.data)) {
            data.documentos = data.data;
        } else if (Array.isArray(data.results)) {
            data.documentos = data.results;
        } else {
            throw new Error('Formato de respuesta inválido: no se encontraron documentos');
        }
    }

    // Actualizar datos globales
    documentos = data.documentos || [];
    totalPaginas = data.totalPaginas || Math.ceil((data.total || documentos.length) / tamanioPagina);
    
    // Actualizar interfaz
    mostrarDocumentosEnTabla();
    actualizarPaginacion(data.paginacion);
    
    // Actualizar estadísticas si están disponibles
    if (data.estadisticas) {
        actualizarEstadisticas(data.estadisticas);
    }
}

/**
 * Maneja errores al cargar documentos
 */
function manejarErrorCargaDocumentos(error) {
    let mensajeError = 'Error al cargar documentos';
    
    if (error.message.includes('Acción no válida')) {
        mensajeError = 'El servidor no reconoce la solicitud. Verifique la configuración del sistema.';
    } else if (error.message.includes('HTTP: 404')) {
        mensajeError = 'El servicio de documentos no está disponible.';
    } else if (error.message.includes('HTTP: 500')) {
        mensajeError = 'Error interno del servidor. Contacte al administrador.';
    } else if (error.message.includes('network')) {
        mensajeError = 'Error de conexión. Verifique su conexión a internet.';
    } else {
        mensajeError = `Error: ${error.message}`;
    }
    
    mostrarAlerta('error', mensajeError);
    
    // Intentar cargar desde cache
    const cacheKey = JSON.stringify(filtrosActuales);
    const datosCache = cache.documentos.get(cacheKey);
    
    if (datosCache && (Date.now() - datosCache.timestamp) < 300000) {
        console.log('📦 Cargando desde cache debido al error');
        documentos = datosCache.documentos;
        totalPaginas = Math.ceil(datosCache.total / tamanioPagina);
        mostrarDocumentosEnTabla();
        actualizarPaginacion();
        mostrarAlerta('warning', 'Mostrando datos del cache debido a problemas de conexión');
    } else {
        documentos = [];
        totalPaginas = 0;
        mostrarDocumentosVacio();
    }
}

/**
 * Alias para mostrarDocumentosEnTabla (para compatibilidad)
 */
function mostrarDocumentos() {
    mostrarDocumentosEnTabla();
}

/**
 * Muestra los documentos en la tabla
 */
function mostrarDocumentosEnTabla() {
    const container = document.getElementById('tablaDocumentosContainer');
    if (!container) {
        console.warn('⚠️ Contenedor tablaDocumentosContainer no encontrado');
        return;
    }

    if (documentos.length === 0) {
        container.innerHTML = createEmptyState();
        return;
    }

    const tableHTML = createDocumentsTable(documentos);
    container.innerHTML = tableHTML;
    
    // Inicializar tooltips
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = container.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Configurar eventos de la tabla
    configurarEventosTabla();
}

/**
 * Crea el HTML de la tabla de documentos
 */
function createDocumentsTable(docs) {
    const tableHeader = `
        <div class="table-responsive">
            <table class="table table-documents table-hover mb-0">
                <thead class="table-dark">
                    <tr>
                        <th scope="col"><i class="bi bi-file-earmark-text me-1"></i>Código</th>
                        <th scope="col"><i class="bi bi-card-text me-1"></i>Documento</th>
                        <th scope="col"><i class="bi bi-tag me-1"></i>Tipo</th>
                        <th scope="col"><i class="bi bi-person me-1"></i>Emisor</th>
                        <th scope="col"><i class="bi bi-calendar me-1"></i>Fecha</th>
                        <th scope="col"><i class="bi bi-clock me-1"></i>Vencimiento</th>
                        <th scope="col"><i class="bi bi-gear me-1"></i>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const tableBody = docs.map((doc, index) => {
        const diasPendientes = calcularDiasPendientes(doc.fechaVencimiento);
        const diasPendientesClass = diasPendientes <= 1 ? 'text-danger fw-bold' : 
                                   diasPendientes <= 3 ? 'text-warning fw-bold' : 'text-muted';
        
        const prioridadClass = doc.prioridad === 'Urgente' ? 'document-priority-urgent' :
                              doc.prioridad === 'Alta' ? 'document-priority-high' : 'document-priority-normal';
        
        const tieneCertificados = certificados.length > 0;

        return `
            <tr class="document-row ${prioridadClass}" data-doc-id="${doc.id}" data-aos="fade-up" data-aos-delay="${index * 50}">
                <td>
                    <code class="text-primary">${htmlEscape(doc.codigo)}</code>
                    ${obtenerBadgePrioridad(doc.prioridad)}
                </td>
                <td>
                    <div class="fw-bold">${truncarTexto(htmlEscape(doc.titulo), 40)}</div>
                    ${doc.descripcion ? `<small class="text-muted">${truncarTexto(htmlEscape(doc.descripcion), 60)}</small>` : ''}
                    ${doc.dependenciaNombre ? `<br><small class="text-info"><i class="bi bi-building me-1"></i>${htmlEscape(doc.dependenciaNombre)}</small>` : ''}
                </td>
                <td>
                    <span class="badge bg-secondary">${htmlEscape(doc.tipoDocumento)}</span>
                    ${doc.proyectoNombre ? `<br><small class="text-muted">${htmlEscape(doc.proyectoNombre)}</small>` : ''}
                </td>
                <td>
                    <div class="fw-bold">${htmlEscape(doc.usuarioEmisor)}</div>
                    <small class="text-muted">${formatearFecha(doc.fechaCreacion)}</small>
                </td>
                <td>
                    <small class="text-muted">${formatearFecha(doc.fechaCreacion)}</small>
                    ${doc.fechaModificacion ? `<br><small class="text-muted">Mod: ${formatearFecha(doc.fechaModificacion)}</small>` : ''}
                </td>
                <td>
                    <span class="${diasPendientesClass}">
                        <strong>${doc.diasPendientes || diasPendientes}</strong> días
                    </span>
                    ${doc.fechaVencimiento ? `<br><small class="text-muted">Vence: ${formatearFecha(doc.fechaVencimiento)}</small>` : ''}
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-info" 
                                onclick="verDocumento(${doc.id})" 
                                title="Ver documento"
                                data-bs-toggle="tooltip">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn ${tieneCertificados ? 'btn-success' : 'btn-outline-secondary'}" 
                                onclick="mostrarModalFirma(${doc.id})" 
                                title="${tieneCertificados ? 'Firmar documento' : 'No hay certificados disponibles'}"
                                data-bs-toggle="tooltip"
                                ${!tieneCertificados ? 'disabled' : ''}>
                            <i class="bi bi-pen"></i>
                        </button>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-secondary dropdown-toggle" 
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="descargarDocumento(${doc.id})">
                                    <i class="bi bi-download me-2"></i>Descargar
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="verHistorial(${doc.id})">
                                    <i class="bi bi-clock-history me-2"></i>Historial
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="observarDocumento(${doc.id})">
                                    <i class="bi bi-chat-square-text me-2"></i>Observar
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    const tableFooter = `
                </tbody>
            </table>
        </div>
    `;

    return tableHeader + tableBody + tableFooter;
}

/**
 * Configura eventos de la tabla
 */
function configurarEventosTabla() {
    document.querySelectorAll('.document-row').forEach(row => {
        row.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            
            document.querySelectorAll('.document-row.selected').forEach(r => 
                r.classList.remove('selected')
            );
            
            this.classList.add('selected');
            const docId = parseInt(this.dataset.docId);
            documentoSeleccionado = documentos.find(d => d.id === docId);
        });
    });
}

/**
 * Crea el estado vacío
 */
function createEmptyState() {
    return `
        <div class="empty-state text-center py-5">
            <div class="empty-icon mb-3">
                <i class="bi bi-inbox" style="font-size: 4rem; color: var(--bs-secondary);"></i>
            </div>
            <h5 class="text-muted">No hay documentos para firmar</h5>
            <p class="text-muted mb-4">
                No se encontraron documentos pendientes de firma con los criterios de búsqueda actuales.
            </p>
            <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-outline-primary" onclick="limpiarFiltros()">
                    <i class="bi bi-funnel me-1"></i>Limpiar Filtros
                </button>
                <button class="btn btn-primary" onclick="cargarDocumentos()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Actualizar
                </button>
            </div>
        </div>
    `;
}

/**
 * Muestra estado vacío cuando no hay documentos
 */
function mostrarDocumentosVacio() {
    const container = document.getElementById('tablaDocumentosContainer');
    if (container) {
        container.innerHTML = createEmptyState();
    }
}

/**
 * Muestra estado de carga en la tabla
 */
function mostrarCargandoTabla(mostrar) {
    const container = document.getElementById('tablaDocumentosContainer');
    if (!container) return;

    if (mostrar) {
        container.innerHTML = `
            <div class="loading-container text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <h6 class="text-muted">Cargando documentos...</h6>
                <p class="text-muted small">Por favor espere un momento</p>
            </div>
        `;
    }
}
/* ==================== DETALLE DE DOCUMENTO ==================== */

/**
 * Obtiene el detalle de un documento específico
 */
async function obtenerDetalleDocumento(documentoId) {
    if (!documentoId) {
        console.error('❌ ID de documento requerido');
        return null;
    }

    try {
        console.log(`📄 Obteniendo detalle del documento ${documentoId}...`);
        
        const response = await fetch(`DocumentosParaFirmarServlet?action=obtenerDocumento&documentoId=${documentoId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📄 Detalle del documento recibido:', data);

        if (data.success && data.documento) {
            return data.documento;
        } else {
            throw new Error(data.message || 'Error al obtener detalle del documento');
        }
        
    } catch (error) {
        console.error('❌ Error obteniendo detalle del documento:', error);
        mostrarAlerta('error', 'Error al obtener detalle del documento: ' + error.message);
        return null;
    }
}

/**
 * Muestra el detalle de un documento en un modal
 */
async function mostrarDetalleDocumento(documentoId) {
    const detalle = await obtenerDetalleDocumento(documentoId);
    if (!detalle) return;

    // Llenar modal con información del documento
    const modalLabel = document.getElementById('modalDetalleDocumentoLabel');
    if (modalLabel) {
        modalLabel.innerHTML = `
            <i class="bi bi-file-earmark-text me-2"></i>
            ${htmlEscape(detalle.titulo || detalle.codigo)}
        `;
    }

    const modalBody = document.getElementById('modalDetalleDocumentoBody');
    if (modalBody) {
        modalBody.innerHTML = crearHTMLDetalleDocumento(detalle);
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleDocumento'));
    modal.show();
}

/**
 * Crea el HTML para mostrar el detalle del documento
 */
function crearHTMLDetalleDocumento(doc) {
    return `
        <div class="row">
            <div class="col-md-6">
                <h6>Información General</h6>
                <table class="table table-sm">
                    <tr><th>Código:</th><td>${htmlEscape(doc.codigo)}</td></tr>
                    <tr><th>Título:</th><td>${htmlEscape(doc.titulo)}</td></tr>
                    <tr><th>Estado:</th><td><span class="badge bg-primary">${htmlEscape(doc.estado)}</span></td></tr>
                    <tr><th>Prioridad:</th><td>${obtenerBadgePrioridad(doc.prioridad)}</td></tr>
                    <tr><th>Tipo:</th><td>${htmlEscape(doc.tipoDocumento)}</td></tr>
                    ${doc.proyectoNombre ? `<tr><th>Proyecto:</th><td>${htmlEscape(doc.proyectoNombre)}</td></tr>` : ''}
                    ${doc.dependenciaNombre ? `<tr><th>Dependencia:</th><td>${htmlEscape(doc.dependenciaNombre)}</td></tr>` : ''}
                </table>
            </div>
            <div class="col-md-6">
                <h6>Fechas y Estados</h6>
                <table class="table table-sm">
                    <tr><th>Creación:</th><td>${formatearFecha(doc.fechaCreacion)}</td></tr>
                    ${doc.fechaModificacion ? `<tr><th>Modificación:</th><td>${formatearFecha(doc.fechaModificacion)}</td></tr>` : ''}
                    ${doc.fechaVencimiento ? `<tr><th>Vencimiento:</th><td>${formatearFecha(doc.fechaVencimiento)}</td></tr>` : ''}
                    ${doc.fechaFirma ? `<tr><th>Firma:</th><td>${formatearFecha(doc.fechaFirma)}</td></tr>` : ''}
                    ${doc.diasPendientes !== null ? `<tr><th>Días pendientes:</th><td><strong>${doc.diasPendientes}</strong></td></tr>` : ''}
                </table>
                
                <h6>Usuarios</h6>
                <table class="table table-sm">
                    <tr><th>Emisor:</th><td>${htmlEscape(doc.usuarioEmisor)}</td></tr>
                    ${doc.usuarioFirmante ? `<tr><th>Firmante:</th><td>${htmlEscape(doc.usuarioFirmante)}</td></tr>` : ''}
                </table>
            </div>
        </div>
        
        ${doc.descripcion ? `
            <div class="mt-3">
                <h6>Descripción</h6>
                <p class="text-muted">${htmlEscape(doc.descripcion)}</p>
            </div>
        ` : ''}
        
        ${doc.anexos && doc.anexos.length > 0 ? `
            <div class="mt-3">
                <h6>Anexos (${doc.anexos.length})</h6>
                <div class="list-group">
                    ${doc.anexos.map(anexo => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <i class="bi bi-file-earmark me-2"></i>
                                <strong>${htmlEscape(anexo.nombreArchivo)}</strong>
                                <small class="text-muted d-block">${anexo.tamañoLegible} • ${formatearFecha(anexo.fechaSubida)}</small>
                            </div>
                            <div>
                                ${anexo.firmado ? '<span class="badge bg-success">Firmado</span>' : '<span class="badge bg-warning">Sin firmar</span>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${doc.historial && doc.historial.length > 0 ? `
            <div class="mt-3">
                <h6>Historial de Estados</h6>
                <div class="timeline">
                    ${doc.historial.map(entrada => `
                        <div class="timeline-item">
                            <small class="text-muted">${formatearFecha(entrada.fechaCambio)}</small>
                            <div><strong>${entrada.estadoAnterior}</strong> → <strong>${entrada.estadoNuevo}</strong></div>
                            <small>Por: ${htmlEscape(entrada.usuario)}</small>
                            ${entrada.observaciones ? `<div class="text-muted small">${htmlEscape(entrada.observaciones)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}
/* ==================== FILTROS Y BÚSQUEDA ==================== */
/**
 * Carga los filtros disponibles
 */
/* ==================== FILTROS - VERSIÓN ACTUALIZADA ==================== */

/**
 * Carga los filtros disponibles - versión mejorada
 */
async function cargarFiltrosDisponibles() {
    if (cache.filtros.has('disponibles')) {
        const cachedData = cache.filtros.get('disponibles');
        if (Date.now() - cachedData.timestamp < 300000) { // Cache válido por 5 minutos
            console.log('📦 Cargando filtros desde cache');
            aplicarFiltrosCacheados(cachedData.data);
            return;
        }
    }

    try {
        console.log('🔍 Cargando filtros desde servidor...');
        
        const response = await fetch('DocumentosParaFirmarServlet?action=obtenerFiltros', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔍 Filtros recibidos del servidor:', data);

        if (data.success) {
            // Guardar en cache
            cache.filtros.set('disponibles', {
                data: data,
                timestamp: Date.now()
            });
            
            aplicarFiltrosCacheados(data);
            console.log('✅ Filtros cargados exitosamente');
        } else {
            throw new Error(data.message || 'Error al cargar filtros');
        }
    } catch (error) {
        console.error('❌ Error cargando filtros:', error);
        mostrarAlerta('warning', 'Error al cargar filtros: ' + error.message);
    }
}

/**
 * Aplica los filtros cacheados a los selects
 */
function aplicarFiltrosCacheados(data) {
    if (data.tipos) {
        cargarOpcionesFiltro('filtroTipo', data.tipos);
    }
    if (data.proyectos) {
        cargarOpcionesFiltro('filtroProyecto', data.proyectos);
    }
    if (data.dependencias) {
        cargarOpcionesFiltro('filtroDependencia', data.dependencias);
    }
}

/**
 * Carga opciones en un select de filtro - versión mejorada
 */
function cargarOpcionesFiltro(selectId, opciones) {
    const select = document.getElementById(selectId);
    if (!select || !opciones) {
        console.warn(`⚠️ Select ${selectId} no encontrado o opciones vacías`);
        return;
    }

    // Conservar la primera opción (placeholder)
    const primeraOpcion = select.children[0];
    select.innerHTML = '';
    if (primeraOpcion) {
        select.appendChild(primeraOpcion);
    }

    // Agregar opciones
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.valor || opcion.id;
        option.textContent = opcion.texto || opcion.nombre;
        select.appendChild(option);
    });

    console.log(`🔍 ${opciones.length} opciones cargadas en ${selectId}`);
}

async function cargarFiltrosDisponibles() {
    if (cache.filtros.has('disponibles')) {
        const cachedData = cache.filtros.get('disponibles');
        if (Date.now() - cachedData.timestamp < 300000) {
            cargarOpcionesFiltro('filtroTipo', cachedData.data.tipos);
            cargarOpcionesFiltro('filtroProyecto', cachedData.data.proyectos);
            return;
        }
    }

    try {
        const response = await fetch('DocumentosParaFirmarServlet?action=obtenerFiltros');
        const data = await response.json();

        if (data.success) {
            cache.filtros.set('disponibles', {
                data: data,
                timestamp: Date.now()
            });
            
            cargarOpcionesFiltro('filtroTipo', data.tipos);
            cargarOpcionesFiltro('filtroProyecto', data.proyectos);
        }
    } catch (error) {
        console.error('❌ Error cargando filtros:', error);
    }
}

/**
 * Carga opciones en un select de filtro
 */
function cargarOpcionesFiltro(selectId, opciones) {
    const select = document.getElementById(selectId);
    if (!select || !opciones) return;

    const primeraOpcion = select.children[0];
    select.innerHTML = '';
    select.appendChild(primeraOpcion);

    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.valor;
        option.textContent = opcion.texto;
        select.appendChild(option);
    });
}
// Configuración de filtros
let filtrosActuales = {
    prioridad: '',
    tipo: '',
    proyecto: '',
    busqueda: '',
    orden: 'fecha_creacion',
    direccion: 'DESC'
};
/**
 * Aplica los filtros seleccionados
 */
function aplicarFiltros() {
    const nuevosFiltros = {
        prioridad: document.getElementById('filtroPrioridad')?.value || '',
        tipo: document.getElementById('filtroTipo')?.value || '',
        proyecto: document.getElementById('filtroProyecto')?.value || '',
        busqueda: document.getElementById('filtroBusqueda')?.value || '',
        orden: document.getElementById('filtroOrden')?.value || 'fecha_creacion',
        direccion: 'DESC'
    };
    
    if (JSON.stringify(nuevosFiltros) !== JSON.stringify(filtrosActuales)) {
        filtrosActuales = nuevosFiltros;
        paginaActual = 1;
        cache.documentos.clear();
        cargarDocumentos();
    }
}

/**
 * Limpia todos los filtros
 */
function limpiarFiltros() {
    ['filtroPrioridad', 'filtroTipo', 'filtroProyecto', 'filtroBusqueda'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    const ordenElement = document.getElementById('filtroOrden');
    if (ordenElement) ordenElement.value = 'fecha_creacion';
    
    aplicarFiltros();
}

/* ==================== PAGINACIÓN ==================== */
/**
 * Actualiza la paginación
 */
function actualizarPaginacion(pagination) {
    const container = document.getElementById('paginacionContainer');
    if (!container) return;

    const totalItems = pagination?.total || documentos.length;
    const totalPags = Math.ceil(totalItems / tamanioPagina);
    
    if (totalPags <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<nav aria-label="Navegación de documentos"><ul class="pagination justify-content-center">';
    
    // Botón anterior
    paginationHTML += `
        <li class="page-item ${paginaActual <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})" aria-label="Anterior">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Números de página
    const maxVisible = 5;
    let startPage = Math.max(1, paginaActual - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPags, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
            </li>
        `;
    }
    
    // Botón siguiente
    paginationHTML += `
        <li class="page-item ${paginaActual >= totalPags ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1})" aria-label="Siguiente">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    paginationHTML += '</ul></nav>';
    
    // Información adicional
    const inicio = (paginaActual - 1) * tamanioPagina + 1;
    const fin = Math.min(paginaActual * tamanioPagina, totalItems);
    
    paginationHTML += `
        <div class="text-center text-muted mt-2">
            <small>Mostrando ${inicio}-${fin} de ${totalItems} documentos</small>
        </div>
    `;
    
    container.innerHTML = paginationHTML;
}

/**
 * Cambia la página actual
 */
function cambiarPagina(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas && nuevaPagina !== paginaActual && !isLoading) {
        paginaActual = nuevaPagina;
        cargarDocumentos();
        
        const tabla = document.querySelector('.card-animated');
        if (tabla) {
            tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

async function cargarEstadisticas() {
    console.log('📊 Cargando estadísticas...');
    
    try {
        mostrarCargandoEstadisticas(true);
        
        const response = await fetch('DocumentosParaFirmarServlet?action=obtenerEstadisticas', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Respuesta de estadísticas del servidor:', data);

        if (data.success && data.estadisticas) {
            estadisticas = data.estadisticas;
            actualizarEstadisticas(estadisticas);
            console.log('✅ Estadísticas cargadas exitosamente');
        } else {
            throw new Error(data.message || 'Error al obtener estadísticas');
        }
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        mostrarAlerta('error', 'Error al cargar estadísticas: ' + error.message);
        mostrarEstadisticasError();
    } finally {
        mostrarCargandoEstadisticas(false);
    }
}

/**
 * Actualiza las estadísticas en la UI
 */
function actualizarEstadisticas(stats) {
    if (!stats) {
        console.warn('⚠️ Estadísticas nulas o indefinidas');
        return;
    }

    const elementos = [
        { id: 'documentosPendientes', valor: stats.pendientes || 0 },
        { id: 'documentosUrgentes', valor: stats.urgentes || 0 },
        { id: 'documentosSemana', valor: stats.semana || 0 },
        { id: 'documentosFirmadosHoy', valor: stats.firmadosHoy || 0 }
    ];

    elementos.forEach((elemento, index) => {
        const el = document.getElementById(elemento.id);
        if (el) {
            setTimeout(() => {
                animarContador(el, parseInt(elemento.valor));
            }, index * 100);
        } else {
            console.warn(`⚠️ Elemento no encontrado: ${elemento.id}`);
        }
    });

    // Log de estadísticas recibidas
    console.log('📊 Estadísticas procesadas:', {
        pendientes: stats.pendientes,
        urgentes: stats.urgentes,
        semana: stats.semana,
        firmadosHoy: stats.firmadosHoy
    });
}


/**
 * Anima un contador numérico
 */
function animarContador(elemento, valorFinal) {
    const valorInicial = 0;
    const duracion = 1500;
    const incremento = valorFinal / (duracion / 16);
    let valorActual = valorInicial;

    const timer = setInterval(() => {
        valorActual += incremento;
        
        if (valorActual >= valorFinal) {
            elemento.textContent = valorFinal;
            clearInterval(timer);
        } else {
            elemento.textContent = Math.floor(valorActual);
        }
    }, 16);
}

/**
 * Anima todos los contadores
 */
function animarContadores() {
    const contadores = document.querySelectorAll('.counter');
    contadores.forEach((contador, index) => {
        setTimeout(() => {
            contador.style.opacity = '1';
            contador.style.transform = 'translateY(0) scale(1)';
        }, index * 100);
    });
}

/* ==================== FIRMA DIGITAL ==================== */
/**
 * Muestra el modal para firmar documento
 */
function mostrarModalFirma(documentoId) {
    documentoSeleccionado = documentos.find(d => d.id === documentoId);
    
    if (!documentoSeleccionado) {
        mostrarAlerta('error', 'Documento no encontrado');
        return;
    }

    if (certificados.length === 0) {
        mostrarAlerta('warning', 'No tiene certificados digitales disponibles. Configure un certificado antes de firmar.');
        setTimeout(() => {
            window.location.href = 'gestion-certificados.jsp';
        }, 2000);
        return;
    }

    llenarInformacionDocumento();
    limpiarFormularioFirma();
    
    const observacionesGuardadas = localStorage.getItem('sgd_firmaObservaciones');
    if (observacionesGuardadas) {
        const observacionesElement = document.getElementById('observacionesFirma');
        if (observacionesElement) {
            observacionesElement.value = observacionesGuardadas;
        }
    }

    const modal = new bootstrap.Modal(document.getElementById('modalFirmarDocumento'));
    modal.show();
}

/**
 * Llena la información del documento en el modal
 */
function llenarInformacionDocumento() {
    if (!documentoSeleccionado) return;

    const elementos = {
        'firmaDocumentoCodigo': documentoSeleccionado.codigo,
        'firmaDocumentoTitulo': documentoSeleccionado.titulo,
        'firmaDocumentoTipo': documentoSeleccionado.tipoDocumento
    };

    Object.entries(elementos).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    });

    const prioridadElement = document.getElementById('firmaDocumentoPrioridad');
    if (prioridadElement) {
        prioridadElement.innerHTML = obtenerBadgePrioridad(documentoSeleccionado.prioridad);
    }
}

/**
 * Limpia el formulario de firma
 */
function limpiarFormularioFirma() {
    const elementos = [
        'certificadoId',
        'passwordCertificadoFirma',
        'passwordValidationResult',
        'observacionesFirma'
    ];
    
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (elemento.tagName === 'SELECT') {
                elemento.value = '';
            } else if (elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA') {
                elemento.value = '';
            } else {
                elemento.innerHTML = '';
            }
        }
    });
    
    // Valores por defecto
    const valores = {
        'razonFirma': 'Revisión y aprobación de documento',
        'ubicacionFirma': 'Lima, Perú'
    };

    Object.entries(valores).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.value = valor;
    });

    const firmaVisible = document.getElementById('firmaVisible');
    if (firmaVisible) firmaVisible.checked = true;
    
    const aceptarTerminos = document.getElementById('aceptarTerminos');
    if (aceptarTerminos) aceptarTerminos.checked = false;
    
    ocultarInformacionCertificado();
    certificadoSeleccionado = null;
}

/**
 * Valida la contraseña del certificado
 */
async function validarPasswordCertificado(password) {
    if (!password || !certificadoSeleccionado) return;

    try {
        const formData = new FormData();
        formData.append('action', 'validarPasswordCertificado');
        formData.append('certificadoId', certificadoSeleccionado.id);
        formData.append('password', password);

        const response = await fetch('DocumentosParaFirmarServlet', {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const data = await response.json();
        const resultDiv = document.getElementById('passwordValidationResult');

        if (resultDiv) {
            if (data.success) {
                resultDiv.innerHTML = '<small class="text-success"><i class="bi bi-check-circle me-1"></i>Contraseña válida</small>';
            } else {
                resultDiv.innerHTML = '<small class="text-danger"><i class="bi bi-x-circle me-1"></i>Contraseña incorrecta</small>';
            }
        }
    } catch (error) {
        console.error('❌ Error validando contraseña:', error);
    }
}

/**
 * Procede con la firma del documento
 */
async function procederConFirma() {
    console.log('🖊️ Iniciando proceso de firma...');
    
    // CORRECCIÓN 1: Declarar textoOriginal al inicio para que esté disponible en finally
    let textoOriginal = 'Confirmar Firma';
    let btnFirmar = null;
    
    try {
        // CORRECCIÓN 2: Validar formulario primero
        if (!validarFormularioFirma()) {
            console.log('❌ Validación de formulario falló');
            return;
        }
        
        // CORRECCIÓN 3: Obtener certificado seleccionado de forma segura
        const certificadoSelect = document.getElementById('certificadoId');
        const certificadoId = certificadoSelect?.value;
        
        console.log('🔍 Debug información inicial:', {
            certificadoId: certificadoId,
            certificadoSeleccionado: certificadoSeleccionado,
            documentoSeleccionado: documentoSeleccionado,
            totalCertificados: certificados?.length || 0
        });
        
        if (!certificadoId) {
            console.error('❌ No hay certificado seleccionado');
            mostrarAlerta('warning', 'Debe seleccionar un certificado digital');
            certificadoSelect?.focus();
            return;
        }
        
        // CORRECCIÓN 4: Buscar certificado con logging detallado
        let certificadoParaUsar = certificadoSeleccionado;
        
        if (!certificadoParaUsar || (!certificadoParaUsar.id_certificado && !certificadoParaUsar.id)) {
            console.log('⚠️ certificadoSeleccionado no válido, buscando en array...');
            
            if (!Array.isArray(certificados)) {
                console.error('❌ Array certificados no es válido:', typeof certificados);
                mostrarAlerta('error', 'Error: datos de certificados no válidos. Recargue la página.');
                return;
            }
            
            console.log('🔍 Buscando certificado ID:', certificadoId, 'en array de', certificados.length, 'elementos');
            
            // Buscar con logging detallado
            certificadoParaUsar = certificados.find(cert => {
                const certId = cert.id_certificado || cert.id;
                console.log('  - Comparando:', certId, 'con', certificadoId);
                return certId == certificadoId;
            });
            
            console.log('🔍 Resultado búsqueda:', certificadoParaUsar);
        }
        
        if (!certificadoParaUsar) {
            console.error('❌ Certificado no encontrado. ID buscado:', certificadoId);
            console.log('📋 Certificados disponibles:', certificados.map(c => ({
                id: c.id,
                id_certificado: c.id_certificado,
                nombre: c.nombre_certificado || c.nombre
            })));
            mostrarAlerta('error', 'Certificado no encontrado. Por favor, recargue la página.');
            return;
        }
        
        // CORRECCIÓN 5: Normalizar ID del certificado
        const certificadoIdFinal = certificadoParaUsar.id_certificado || certificadoParaUsar.id;
        
        if (!certificadoIdFinal) {
            console.error('❌ ID del certificado no disponible:', certificadoParaUsar);
            mostrarAlerta('error', 'Error: ID del certificado no válido');
            return;
        }
        
        console.log('✅ Certificado validado. ID final:', certificadoIdFinal);
        
        // Validar documento seleccionado
        if (!documentoSeleccionado || !documentoSeleccionado.id) {
            console.error('❌ Documento no seleccionado:', documentoSeleccionado);
            mostrarAlerta('error', 'No hay documento seleccionado para firmar');
            return;
        }
        
        console.log('✅ Documento validado. ID:', documentoSeleccionado.id);
        
        // Obtener otros datos del formulario
        const password = document.getElementById('passwordCertificadoFirma')?.value;
        const observaciones = document.getElementById('observacionesFirma')?.value || '';
        const razonFirma = document.getElementById('razonFirma')?.value || 'Revisión y aprobación';
        const ubicacionFirma = document.getElementById('ubicacionFirma')?.value || 'Lima, Perú';
        const firmaVisible = document.getElementById('firmaVisible')?.checked || false;
        
        if (!password || password.trim().length === 0) {
            console.error('❌ Contraseña vacía');
            mostrarAlerta('warning', 'Debe ingresar la contraseña del certificado');
            document.getElementById('passwordCertificadoFirma')?.focus();
            return;
        }
        
        // CORRECCIÓN 6: Manejar botón de forma segura
        btnFirmar = document.querySelector('[onclick="procederConFirma()"]') || 
                   document.querySelector('button[type="button"]:contains("Confirmar Firma")') ||
                   document.querySelector('.btn-danger');
        
        if (btnFirmar) {
            textoOriginal = btnFirmar.innerHTML;
            btnFirmar.disabled = true;
            btnFirmar.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Firmando...';
        }
        
        console.log('📋 Datos finales para envío:', {
            documentoId: documentoSeleccionado.id,
            certificadoId: certificadoIdFinal,
            passwordLength: password.length,
            observaciones: observaciones.substring(0, 50) + (observaciones.length > 50 ? '...' : ''),
            razonFirma,
            ubicacionFirma,
            firmaVisible
        });
        
        // Preparar FormData con logging
        const formData = new FormData();
        formData.append('action', 'firmarDocumento');
        formData.append('documentoId', documentoSeleccionado.id);
        formData.append('certificadoId', certificadoIdFinal);
        formData.append('passwordCertificado', password);
        formData.append('observaciones', observaciones);
        formData.append('razonFirma', razonFirma);
        formData.append('ubicacionFirma', ubicacionFirma);
        formData.append('firmaVisible', firmaVisible);
        
        console.log('🚀 Enviando petición de firma...');
        
        // Realizar petición
        const response = await fetch('DocumentosParaFirmarServlet', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log('📡 Respuesta HTTP:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
            // CORRECCIÓN 7: Manejo detallado de errores HTTP
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            
            try {
                const errorText = await response.text();
                console.error('❌ Error response body:', errorText);
                
                // Intentar extraer información útil del error
                if (errorText.includes('Exception')) {
                    const exceptionMatch = errorText.match(/Exception[^:]*:\s*([^\n\r]+)/);
                    if (exceptionMatch) {
                        errorMessage += ` - ${exceptionMatch[1]}`;
                    }
                }
                
                if (response.status === 500) {
                    errorMessage = 'Error interno del servidor. Verifique:\n' +
                                 '• Que el certificado esté configurado correctamente\n' +
                                 '• Que la contraseña sea correcta\n' +
                                 '• Que tenga permisos para firmar este documento';
                }
                
            } catch (e) {
                console.error('❌ Error leyendo respuesta de error:', e);
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('📋 Respuesta del servidor:', data);
        
        if (data.success) {
            console.log('✅ Documento firmado exitosamente');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalFirmarDocumento'));
            if (modal) {
                modal.hide();
            }
            
            // Mostrar éxito
            mostrarAlerta('success', data.message || 'Documento firmado exitosamente');
            
            // Recargar documentos
            setTimeout(() => {
                if (typeof cargarDocumentos === 'function') {
                    cargarDocumentos();
                }
            }, 1000);
            
            // Mostrar detalles adicionales si están disponibles
            if (data.hashFirmado) {
                setTimeout(() => {
                    mostrarAlerta('info', `Firma digital aplicada. Hash: ${data.hashFirmado.substring(0, 16)}...`);
                }, 2000);
            }
            
        } else {
            throw new Error(data.message || 'Error al firmar documento');
        }
        
    } catch (error) {
        console.error('❌ Error completo en procederConFirma:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Mensaje de error más informativo
        let userMessage = 'Error al firmar documento: ' + error.message;
        
        if (error.message.includes('HTTP 500')) {
            userMessage = 'Error del servidor al procesar la firma. Por favor:\n' +
                         '• Verifique que la contraseña del certificado sea correcta\n' +
                         '• Intente nuevamente en unos momentos\n' +
                         '• Si persiste, contacte al administrador';
        }
        
        mostrarAlerta('error', userMessage);
        
    } finally {
        // CORRECCIÓN 8: Restaurar botón de forma segura
        if (btnFirmar) {
            btnFirmar.disabled = false;
            btnFirmar.innerHTML = textoOriginal;
        }
        
        console.log('🔄 Proceso de firma finalizado');
    }
}
function mostrarAlerta(tipo, mensaje) {
    if (typeof window.mostrarAlerta === 'function') {
        window.mostrarAlerta(tipo, mensaje);
    } else if (typeof alert === 'function') {
        alert(mensaje);
    } else {
        console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    }
}

/**
 * Valida el formulario de firma
 */
function validarFormularioFirma() {
    console.log('🔍 Validando formulario de firma...');
    
    // Validar certificado
    const certificadoSelect = document.getElementById('certificadoId');
    const certificadoId = certificadoSelect?.value;
    
    if (!certificadoId) {
        mostrarAlerta('warning', 'Debe seleccionar un certificado digital');
        certificadoSelect?.focus();
        return false;
    }
    
    // Validar contraseña
    const passwordInput = document.getElementById('passwordCertificadoFirma');
    const password = passwordInput?.value;
    
    if (!password || password.trim().length === 0) {
        mostrarAlerta('warning', 'Debe ingresar la contraseña del certificado');
        passwordInput?.focus();
        return false;
    }
    
    if (password.length < 4) {
        mostrarAlerta('warning', 'La contraseña del certificado debe tener al menos 4 caracteres');
        passwordInput?.focus();
        return false;
    }
    
    // Validar términos y condiciones
    const aceptarTerminos = document.getElementById('aceptarTerminos');
    if (!aceptarTerminos?.checked) {
        mostrarAlerta('warning', 'Debe aceptar los términos y condiciones');
        aceptarTerminos?.focus();
        return false;
    }
    
    // Validar documento seleccionado
    if (!documentoSeleccionado) {
        mostrarAlerta('error', 'No hay documento seleccionado para firmar');
        return false;
    }
    
    console.log('✅ Formulario de firma validado correctamente');
    return true;
}

/* ==================== ACCIONES DE DOCUMENTOS ==================== */
/**
 * Ver documento en modal
 */
function verDocumento(documentoId) {
    const documento = documentos.find(d => d.id === documentoId);
    if (!documento) {
        mostrarAlerta('error', 'Documento no encontrado');
        return;
    }

    const modalLabel = document.getElementById('modalVerDocumentoLabel');
    if (modalLabel) {
        modalLabel.innerHTML = `
            <i class="bi bi-file-earmark-text me-2"></i>
            ${htmlEscape(documento.titulo)}
        `;
    }

    const container = document.getElementById('documentPreviewContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center mt-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-muted">Cargando vista previa...</p>
            </div>
        `;

        setTimeout(() => {
            container.innerHTML = `
                <div class="text-center mt-5">
                    <i class="bi bi-file-earmark-text" style="font-size: 4rem; color: var(--bs-secondary);"></i>
                    <h5 class="mt-3 text-muted">Vista previa no disponible</h5>
                    <p class="text-muted">Descargue el documento para verlo completo.</p>
                    <button class="btn btn-primary btn-action" onclick="descargarDocumento(${documentoId})">
                        <i class="bi bi-download me-1"></i>
                        Descargar Documento
                    </button>
                </div>
            `;
        }, 1500);
    }

    const modal = new bootstrap.Modal(document.getElementById('modalVerDocumento'));
    modal.show();
}

/**
 * Descargar documento
 */
function descargarDocumento(documentoId = null) {
    const id = documentoId || documentoSeleccionado?.id;
    if (id) {
        mostrarAlerta('info', 'Iniciando descarga...');
        const url = `DescargarDocumentoServlet?documentoId=${id}`;
        
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

/**
 * Ver historial del documento
 */
function verHistorial(documentoId) {
    mostrarAlerta('info', 'Función de historial próximamente...');
    console.log('Ver historial:', documentoId);
}

/**
 * Hacer observación al documento
 */
function observarDocumento(documentoId) {
    mostrarAlerta('info', 'Función de observaciones próximamente...');
    console.log('Observar documento:', documentoId);
}

/* ==================== UTILIDADES ADICIONALES ==================== */

/**
 * Muestra indicadores de carga en estadísticas
 */
function mostrarCargandoEstadisticas(mostrar) {
    const elementos = [
        'documentosPendientes',
        'documentosUrgentes', 
        'documentosSemana',
        'documentosFirmadosHoy'
    ];

    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (mostrar) {
                elemento.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
            }
        }
    });
}

/**
 * Muestra estadísticas en estado de error
 */
function mostrarEstadisticasError() {
    const elementos = [
        'documentosPendientes',
        'documentosUrgentes', 
        'documentosSemana',
        'documentosFirmadosHoy'
    ];

    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.innerHTML = '<i class="bi bi-exclamation-triangle text-warning" title="Error al cargar"></i>';
        }
    });
}

// Exportar funciones globalmente
window.obtenerDetalleDocumento = obtenerDetalleDocumento;
window.mostrarDetalleDocumento = mostrarDetalleDocumento;

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
}

/**
 * Escape HTML para prevenir XSS
 */
function htmlEscape(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Muestra una alerta optimizada
 */
function mostrarAlerta(tipo, mensaje, duracion = 5000) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        // Crear notificación personalizada si no existe contenedor
        crearNotificacionPersonalizada(tipo, mensaje, duracion);
        return;
    }

    const alertId = 'alert_' + Date.now();
    const iconos = {
        success: 'bi-check-circle',
        error: 'bi-x-circle',
        warning: 'bi-exclamation-triangle',
        info: 'bi-info-circle'
    };

    const alertHtml = `
        <div id="${alertId}" class="alert alert-${tipo === 'error' ? 'danger' : tipo} alert-dismissible fade show" role="alert">
            <i class="bi ${iconos[tipo]} me-2"></i>
            ${htmlEscape(mensaje)}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    if (duracion > 0) {
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = bootstrap.Alert.getInstance(alert);
                if (bsAlert) {
                    bsAlert.close();
                } else {
                    alert.remove();
                }
            }
        }, duracion);
    }
}

/**
 * Crea una notificación personalizada
 */
function crearNotificacionPersonalizada(tipo, mensaje, duracion) {
    const notificacionesExistentes = document.querySelectorAll('.sgd-notification');
    notificacionesExistentes.forEach(n => n.remove());
    
    const tiposConfig = {
        'success': { clase: 'alert-success', icono: 'bi-check-circle' },
        'error': { clase: 'alert-danger', icono: 'bi-exclamation-triangle' },
        'warning': { clase: 'alert-warning', icono: 'bi-exclamation-triangle' },
        'info': { clase: 'alert-info', icono: 'bi-info-circle' }
    };
    
    const config = tiposConfig[tipo] || tiposConfig.info;
    
    const notificacion = document.createElement('div');
    notificacion.className = `alert ${config.clase} alert-dismissible fade show sgd-notification`;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    notificacion.innerHTML = `
        <i class="bi ${config.icono} me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, duracion);
}

/**
 * Muestra/oculta el estado de carga general
 */
function mostrarCargando(mostrar) {
    const loader = document.getElementById('documentosLoader');
    const contenido = document.getElementById('documentosContenido');
    
    if (loader && contenido) {
        if (mostrar) {
            loader.style.display = 'block';
            contenido.style.opacity = '0.5';
        } else {
            loader.style.display = 'none';
            contenido.style.opacity = '1';
        }
    }
}

/**
 * Alterna la visibilidad de contraseña
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById('icon' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
    
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    }
}

/**
 * Obtiene el badge correspondiente a la prioridad
 */
function obtenerBadgePrioridad(prioridad) {
    const badges = {
        'Normal': '<span class="badge bg-secondary ms-2">Normal</span>',
        'Alta': '<span class="badge bg-warning ms-2">Alta</span>',
        'Urgente': '<span class="badge bg-danger ms-2">Urgente</span>'
    };
    return badges[prioridad] || '<span class="badge bg-secondary ms-2">Normal</span>';
}

/**
 * Formatea una fecha para mostrar
 */
function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

/**
 * Trunca texto a una longitud específica
 */
function truncarTexto(texto, longitud) {
    if (!texto) return '';
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
}

/**
 * Calcula los días pendientes hasta una fecha
 */
function calcularDiasPendientes(fechaVencimiento) {
    if (!fechaVencimiento) return 0;
    
    try {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diferencia = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
        return Math.max(0, diferencia);
    } catch (error) {
        return 0;
    }
}

/* ==================== CLEANUP Y EVENTOS GLOBALES ==================== */
// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown')) {
        const dropdowns = document.querySelectorAll('.dropdown-menu.show');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Cleanup al cerrar la página
window.addEventListener('beforeunload', function() {
    cache.timeouts.forEach(timeout => clearTimeout(timeout));
    cache.timeouts.clear();
});

/* ==================== EXPORTACIÓN DE FUNCIONES ==================== */
const globalFunctions = {
    cargarDocumentos,
    verificarCertificados,
    aplicarFiltros,
    cambiarPagina,
    mostrarModalFirma,
    procederConFirma,
    verDocumento,
    descargarDocumento,
    verHistorial,
    observarDocumento,
    togglePasswordVisibility,
    limpiarFiltros,
    mostrarDocumentos // Alias para compatibilidad
};

// Asignar al objeto window
Object.assign(window, globalFunctions);

console.log('✅ para-firmar.js v2.1.2 cargado correctamente');
console.log('📝 Funciones exportadas:', Object.keys(globalFunctions));