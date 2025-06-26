/* ==================== URGENTES JS - OPTIMIZADO ==================== */
/* Sistema de Gestión Documental - Constructora Vial S.A. */
/* @version 3.0.0 (Optimizada y Modernizada) */

// ==================== VARIABLES GLOBALES ====================
let urgentesData = [];
let urgentesFiltrados = [];
let paginaActualUrgentes = 1;
let elementosPorPaginaUrgentes = 10;
let urgentesSeleccionados = [];
let intervaloUrgentes = null;
let timersActivos = new Map();
let filtroRapidoActual = '';

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    inicializarUrgentes();
});

function inicializarUrgentes() {
    console.log('🚀 Inicializando módulo Urgentes...');
    
    cargarDatosIniciales();
    configurarEventListeners();
    iniciarActualizacionPeriodica();
    configurarFiltrosRapidos();
    iniciarTimersUrgencia();
    
    console.log('✅ Módulo Urgentes inicializado correctamente');
}

// ==================== CARGA DE DATOS ====================
async function cargarDatosIniciales() {
    try {
        mostrarCargando('tablaUrgentesContainer');
        
        // Cargar datos en paralelo
        const [urgentes, documentos, responsables] = await Promise.all([
            cargarDocumentosUrgentes(),
            cargarDocumentosDisponibles(),
            cargarResponsables()
        ]);
        
        urgentesData = urgentes;
        urgentesFiltrados = [...urgentesData];
        
        poblarFiltros(documentos, responsables);
        actualizarEstadisticas();
        generarAlertasCriticas();
        renderizarTablaUrgentes();
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        mostrarError('tablaUrgentesContainer', 'Error al cargar los documentos urgentes');
    }
}

async function cargarDocumentosUrgentes() {
    try {
        const response = await fetch('/api/documentos/urgentes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.urgentes || generarDatosPruebaUrgentes();
        
    } catch (error) {
        console.warn('⚠️ Usando datos de prueba para urgentes:', error.message);
        return generarDatosPruebaUrgentes();
    }
}

function generarDatosPruebaUrgentes() {
    const ahora = new Date();
    const en2Horas = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
    const en6Horas = new Date(ahora.getTime() + 6 * 60 * 60 * 1000);
    const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    
    return [
        {
            id: 1,
            documentoCodigo: 'DOC-2025-001',
            documentoTitulo: 'Informe Técnico de Pavimentación - Ruta 101',
            nivelUrgencia: 'Crítico',
            estado: 'Pendiente',
            responsable: 'Juan Pérez',
            cargoResponsable: 'Gerente de Proyectos',
            fechaCreacion: new Date(ahora.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            fechaLimite: en2Horas.toISOString(),
            motivoUrgencia: 'Cliente requiere informe urgente para toma de decisiones de inversión',
            instrucciones: 'Priorizar sección de costos y cronograma',
            notificarInmediato: true,
            escalarAutomatico: true,
            tiempoInvertido: 1.5,
            ultimaActividad: new Date(ahora.getTime() - 30 * 60 * 1000).toISOString(),
            progreso: 60
        },
        {
            id: 2,
            documentoCodigo: 'DOC-2025-002',
            documentoTitulo: 'Estudio de Impacto Ambiental - Puente Río Verde',
            nivelUrgencia: 'Alto',
            estado: 'En Proceso',
            responsable: 'María González',
            cargoResponsable: 'Ingeniera Ambiental',
            fechaCreacion: new Date(ahora.getTime() - 4 * 60 * 60 * 1000).toISOString(),
            fechaLimite: en6Horas.toISOString(),
            motivoUrgencia: 'Autoridad ambiental requiere respuesta antes del vencimiento del plazo legal',
            instrucciones: 'Coordinar con el equipo de biología para completar evaluación de fauna',
            notificarInmediato: true,
            escalarAutomatico: false,
            tiempoInvertido: 3.0,
            ultimaActividad: new Date(ahora.getTime() - 15 * 60 * 1000).toISOString(),
            progreso: 80
        },
        {
            id: 3,
            documentoCodigo: 'DOC-2025-003',
            documentoTitulo: 'Memoria de Cálculo Estructural - Terminal Buses',
            nivelUrgencia: 'Medio',
            estado: 'Escalado',
            responsable: 'Carlos Ruiz',
            cargoResponsable: 'Ingeniero Estructural',
            fechaCreacion: ayer.toISOString(),
            fechaLimite: ayer.toISOString(),
            motivoUrgencia: 'Revisión urgente requerida por supervisor de obra',
            instrucciones: 'Verificar cálculos sísmicos y cargas de viento',
            notificarInmediato: true,
            escalarAutomatico: true,
            tiempoInvertido: 0,
            ultimaActividad: ayer.toISOString(),
            progreso: 0,
            escaladoA: 'Ana Martínez',
            fechaEscalamiento: new Date(ahora.getTime() - 2 * 60 * 60 * 1000).toISOString()
        }
    ];
}

async function cargarDocumentosDisponibles() {
    try {
        return [
            { codigo: 'DOC-2025-004', titulo: 'Plan de Seguridad - Obra Vial' },
            { codigo: 'DOC-2025-005', titulo: 'Especificaciones Técnicas Generales' },
            { codigo: 'DOC-2025-006', titulo: 'Presupuesto Detallado Terminal' },
            { codigo: 'DOC-2025-007', titulo: 'Cronograma de Actividades' },
            { codigo: 'DOC-2025-008', titulo: 'Evaluación de Proveedores' }
        ];
    } catch (error) {
        console.error('Error cargando documentos disponibles:', error);
        return [];
    }
}

async function cargarResponsables() {
    try {
        return [
            { nombre: 'Juan Pérez', cargo: 'Gerente de Proyectos' },
            { nombre: 'María González', cargo: 'Ingeniera Ambiental' },
            { nombre: 'Carlos Ruiz', cargo: 'Ingeniero Estructural' },
            { nombre: 'Ana Martínez', cargo: 'Especialista en Seguridad' },
            { nombre: 'Luis Torres', cargo: 'Arquitecto Principal' },
            { nombre: 'Patricia Vega', cargo: 'Coordinadora Legal' }
        ];
    } catch (error) {
        console.error('Error cargando responsables:', error);
        return [];
    }
}

// ==================== RENDERIZADO ====================
function renderizarTablaUrgentes() {
    const container = document.getElementById('tablaUrgentesContainer');
    
    if (urgentesFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-triangle" style="font-size: 4rem; color: var(--gray-300);"></i>
                <h5 class="mt-3 text-muted">No hay documentos urgentes</h5>
                <p class="text-muted">No hay documentos urgentes que coincidan con los filtros aplicados.</p>
                <button class="btn btn-danger" onclick="marcarUrgente()">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Marcar Documento como Urgente
                </button>
            </div>
        `;
        return;
    }
    
    const inicio = (paginaActualUrgentes - 1) * elementosPorPaginaUrgentes;
    const fin = inicio + elementosPorPaginaUrgentes;
    const urgentesPagina = urgentesFiltrados.slice(inicio, fin);
    
    const tabla = `
        <div class="table-responsive">
            <table class="table urgentes-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="selectAllUrgentes" 
                                       onchange="toggleSeleccionTodosUrgentes()">
                            </div>
                        </th>
                        <th style="width: 120px;">Documento</th>
                        <th>Título</th>
                        <th style="width: 100px;">Urgencia</th>
                        <th style="width: 100px;">Estado</th>
                        <th style="width: 150px;">Responsable</th>
                        <th style="width: 120px;">Tiempo Restante</th>
                        <th style="width: 100px;">Progreso</th>
                        <th style="width: 120px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${urgentesPagina.map(urgente => generarFilaUrgente(urgente)).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tabla;
    actualizarPaginacionUrgentes();
    
    // Iniciar timers para documentos visibles
    urgentesPagina.forEach(urgente => {
        if (urgente.estado !== 'Resuelto') {
            iniciarTimerDocumento(urgente.id, urgente.fechaLimite);
        }
    });
}

function generarFilaUrgente(urgente) {
    const tiempoRestante = calcularTiempoRestante(urgente.fechaLimite);
    const esVencido = tiempoRestante.vencido;
    const esCritico = urgente.nivelUrgencia === 'Crítico';
    const esEscalado = urgente.estado === 'Escalado';
    
    let clasesFila = [];
    if (esCritico) clasesFila.push('critico');
    if (esVencido) clasesFila.push('vencido');
    if (urgente.estado === 'Resuelto') clasesFila.push('resuelto');
    if (esEscalado) clasesFila.push('documento-escalado');
    
    return `
        <tr class="${clasesFila.join(' ')}" data-id="${urgente.id}">
            <td>
                <div class="form-check">
                    <input class="form-check-input urgentes-checkbox" type="checkbox" 
                           value="${urgente.id}" onchange="actualizarSeleccionUrgentes()">
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="icono-urgencia ${urgente.nivelUrgencia.toLowerCase()}">
                        <i class="bi bi-exclamation"></i>
                    </div>
                    <span class="fw-bold text-danger">${htmlEscape(urgente.documentoCodigo)}</span>
                </div>
            </td>
            <td>
                <div>
                    <span class="fw-medium">${htmlEscape(urgente.documentoTitulo)}</span>
                    ${urgente.motivoUrgencia ? `<small class="d-block text-muted">${htmlEscape(urgente.motivoUrgencia.substring(0, 50))}${urgente.motivoUrgencia.length > 50 ? '...' : ''}</small>` : ''}
                    ${esEscalado ? `<small class="d-block text-danger"><i class="bi bi-arrow-up-right"></i> Escalado a: ${htmlEscape(urgente.escaladoA)}</small>` : ''}
                </div>
            </td>
            <td>
                ${generarBadgeNivelUrgencia(urgente.nivelUrgencia)}
            </td>
            <td>
                ${generarBadgeEstadoUrgencia(urgente.estado)}
            </td>
            <td>
                <div>
                    <span class="fw-medium">${htmlEscape(urgente.responsable)}</span>
                    <small class="d-block text-muted">${htmlEscape(urgente.cargoResponsable)}</small>
                </div>
            </td>
            <td>
                <div id="timer-${urgente.id}" class="tiempo-restante ${obtenerClaseTiempo(tiempoRestante)}">
                    ${generarTextoTiempoRestante(tiempoRestante)}
                </div>
                <small class="text-muted d-block">Límite: ${formatearFechaHora(urgente.fechaLimite)}</small>
            </td>
            <td>
                <div class="urgencia-progreso">
                    <div class="urgencia-progreso-barra ${urgente.nivelUrgencia.toLowerCase()}" 
                         style="width: ${urgente.progreso}%"></div>
                </div>
                <small class="text-muted">${urgente.progreso}%</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="verDetallesUrgencia(${urgente.id})" 
                            title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="resolverUrgencia(${urgente.id})" 
                            title="Resolver urgencia" ${urgente.estado === 'Resuelto' ? 'disabled' : ''}>
                        <i class="bi bi-check-circle"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="escalarUrgencia(${urgente.id})" 
                            title="Escalar urgencia" ${urgente.estado === 'Escalado' || urgente.estado === 'Resuelto' ? 'disabled' : ''}>
                        <i class="bi bi-arrow-up-right"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function generarBadgeEstadoUrgencia(estado) {
    const badges = {
        'Pendiente': 'badge-pendiente',
        'En Proceso': 'badge-en-proceso',
        'Resuelto': 'badge-resuelto',
        'Escalado': 'badge-escalado'
    };
    
    return `<span class="badge ${badges[estado] || 'badge-pendiente'}">${htmlEscape(estado)}</span>`;
}

function generarBadgeNivelUrgencia(nivel) {
    const badges = {
        'Crítico': 'badge-critico',
        'Alto': 'badge-alto',
        'Medio': 'badge-medio'
    };
    
    return `<span class="badge ${badges[nivel] || 'badge-medio'}">${htmlEscape(nivel)}</span>`;
}

// ==================== TIMERS Y TIEMPO REAL ====================
function iniciarTimersUrgencia() {
    setInterval(() => {
        actualizarTodosLosTimers();
        verificarVencimientos();
    }, 60000); // Actualizar cada minuto
}

function iniciarTimerDocumento(id, fechaLimite) {
    const elemento = document.getElementById(`timer-${id}`);
    if (!elemento) return;
    
    // Limpiar timer anterior si existe
    if (timersActivos.has(id)) {
        clearInterval(timersActivos.get(id));
    }
    
    const timer = setInterval(() => {
        const tiempoRestante = calcularTiempoRestante(fechaLimite);
        elemento.textContent = generarTextoTiempoRestante(tiempoRestante);
        elemento.className = `tiempo-restante ${obtenerClaseTiempo(tiempoRestante)}`;
        
        if (tiempoRestante.vencido) {
            clearInterval(timer);
            timersActivos.delete(id);
        }
    }, 1000);
    
    timersActivos.set(id, timer);
}

function actualizarTodosLosTimers() {
    urgentesData.forEach(urgente => {
        if (urgente.estado !== 'Resuelto') {
            const elemento = document.getElementById(`timer-${urgente.id}`);
            if (elemento) {
                const tiempoRestante = calcularTiempoRestante(urgente.fechaLimite);
                elemento.textContent = generarTextoTiempoRestante(tiempoRestante);
                elemento.className = `tiempo-restante ${obtenerClaseTiempo(tiempoRestante)}`;
            }
        }
    });
}

function calcularTiempoRestante(fechaLimite) {
    const ahora = new Date();
    const limite = new Date(fechaLimite);
    const diferencia = limite - ahora;
    
    if (diferencia <= 0) {
        return { vencido: true, texto: 'VENCIDO' };
    }
    
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
        vencido: false,
        horas: horas,
        minutos: minutos,
        texto: horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`
    };
}

function generarTextoTiempoRestante(tiempoRestante) {
    if (tiempoRestante.vencido) {
        return 'VENCIDO';
    }
    return tiempoRestante.texto;
}

function obtenerClaseTiempo(tiempoRestante) {
    if (tiempoRestante.vencido) return 'vencido';
    
    const totalMinutos = (tiempoRestante.horas || 0) * 60 + (tiempoRestante.minutos || 0);
    
    if (totalMinutos <= 60) return 'critico';
    if (totalMinutos <= 240) return 'advertencia';
    return 'normal';
}

function verificarVencimientos() {
    const recienVencidos = urgentesData.filter(urgente => {
        if (urgente.estado === 'Resuelto') return false;
        
        const tiempoRestante = calcularTiempoRestante(urgente.fechaLimite);
        return tiempoRestante.vencido && urgente.estado !== 'Escalado';
    });
    
    recienVencidos.forEach(urgente => {
        if (urgente.escalarAutomatico) {
            escalarUrgenciaAutomatico(urgente.id);
        }
        mostrarNotificacionUrgente(`Documento ${urgente.documentoCodigo} ha vencido`, 'danger');
    });
}

// ==================== MARCAR COMO URGENTE ====================
function marcarUrgente() {
    // Cargar documentos disponibles
    cargarDocumentosDisponibles().then(documentos => {
        const select = document.getElementById('documentoSeleccionar');
        select.innerHTML = '<option value="">Seleccione el documento...</option>';
        documentos.forEach(doc => {
            select.innerHTML += `<option value="${htmlEscape(doc.codigo)}">${htmlEscape(doc.codigo)} - ${htmlEscape(doc.titulo)}</option>`;
        });
    });
    
    // Cargar responsables
    cargarResponsables().then(responsables => {
        const selectResp = document.getElementById('responsableUrgencia');
        selectResp.innerHTML = '<option value="">Asignar responsable...</option>';
        responsables.forEach(resp => {
            selectResp.innerHTML += `<option value="${htmlEscape(resp.nombre)}">${htmlEscape(resp.nombre)} - ${htmlEscape(resp.cargo)}</option>`;
        });
    });
    
    // Configurar fechas por defecto
    const ahora = new Date();
    const enUnaHora = new Date(ahora.getTime() + 60 * 60 * 1000);
    
    document.getElementById('fechaLimite').value = enUnaHora.toISOString().split('T')[0];
    document.getElementById('horaLimite').value = enUnaHora.toTimeString().substring(0, 5);
    
    const modal = new bootstrap.Modal(document.getElementById('modalMarcarUrgente'));
    modal.show();
}

function actualizarTiemposLimite() {
    const nivel = document.getElementById('nivelUrgencia').value;
    const ahora = new Date();
    let fechaLimite, horaLimite;
    
    switch (nivel) {
        case 'Crítico':
            // 2 horas
            fechaLimite = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
            break;
        case 'Alto':
            // 6 horas
            fechaLimite = new Date(ahora.getTime() + 6 * 60 * 60 * 1000);
            break;
        case 'Medio':
            // 24 horas
            fechaLimite = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
            break;
        default:
            return;
    }
    
    document.getElementById('fechaLimite').value = fechaLimite.toISOString().split('T')[0];
    document.getElementById('horaLimite').value = fechaLimite.toTimeString().substring(0, 5);
}

async function confirmarMarcarUrgente() {
    const form = document.getElementById('formMarcarUrgente');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const datos = {
        documentoCodigo: document.getElementById('documentoSeleccionar').value,
        nivelUrgencia: document.getElementById('nivelUrgencia').value,
        fechaLimite: `${document.getElementById('fechaLimite').value}T${document.getElementById('horaLimite').value}:00Z`,
        responsable: document.getElementById('responsableUrgencia').value,
        motivoUrgencia: document.getElementById('motivoUrgencia').value.trim(),
        instrucciones: document.getElementById('instruccionesEspeciales').value.trim(),
        notificarInmediato: document.getElementById('notificarInmediato').checked,
        escalarAutomatico: document.getElementById('escalarAutomatico').checked
    };
    
    try {
        const response = await fetch('/api/documentos/urgentes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalMarcarUrgente')).hide();
            mostrarNotificacion('Documento marcado como urgente correctamente', 'success');
            actualizarListaUrgentes();
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error marcando como urgente:', error);
        mostrarNotificacion('Error al marcar el documento como urgente', 'error');
    }
}

// ==================== RESOLVER URGENCIA ====================
function resolverUrgencia(id) {
    const urgente = urgentesData.find(u => u.id === id);
    if (!urgente) {
        mostrarNotificacion('Documento urgente no encontrado', 'error');
        return;
    }
    
    // Llenar información del documento
    document.getElementById('infoDocumentoResolver').innerHTML = `
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-1"><strong>Código:</strong> ${htmlEscape(urgente.documentoCodigo)}</p>
                    <p class="mb-1"><strong>Título:</strong> ${htmlEscape(urgente.documentoTitulo)}</p>
                    <p class="mb-1"><strong>Nivel:</strong> ${generarBadgeNivelUrgencia(urgente.nivelUrgencia)}</p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Responsable:</strong> ${htmlEscape(urgente.responsable)}</p>
                    <p class="mb-1"><strong>Estado:</strong> ${generarBadgeEstadoUrgencia(urgente.estado)}</p>
                    <p class="mb-0"><strong>Tiempo invertido:</strong> ${urgente.tiempoInvertido}h</p>
                </div>
            </div>
        </div>
    `;
    
    // Configurar tiempo invertido por defecto
    document.getElementById('tiempoInvertido').value = urgente.tiempoInvertido || 0;
    
    // Guardar ID para el procesamiento
    document.getElementById('modalResolverUrgencia').dataset.urgenteId = id;
    
    const modal = new bootstrap.Modal(document.getElementById('modalResolverUrgencia'));
    modal.show();
}

async function confirmarResolverUrgencia() {
    const modal = document.getElementById('modalResolverUrgencia');
    const id = parseInt(modal.dataset.urgenteId);
    const form = document.getElementById('formResolverUrgencia');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const datos = {
        tipoResolucion: document.getElementById('tipoResolucion').value,
        descripcionResolucion: document.getElementById('descripcionResolucion').value.trim(),
        accionesRealizadas: document.getElementById('accionesRealizadas').value.trim(),
        tiempoInvertido: parseFloat(document.getElementById('tiempoInvertido').value) || 0,
        requiereSeguimiento: document.getElementById('requiereSeguimiento').checked
    };
    
    try {
        const response = await fetch(`/api/documentos/urgentes/${id}/resolver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            // Actualizar datos locales
            const urgente = urgentesData.find(u => u.id === id);
            if (urgente) {
                urgente.estado = 'Resuelto';
                urgente.tiempoInvertido = datos.tiempoInvertido;
                urgente.fechaResolucion = new Date().toISOString();
                urgente.descripcionResolucion = datos.descripcionResolucion;
            }
            
            // Detener timer
            if (timersActivos.has(id)) {
                clearInterval(timersActivos.get(id));
                timersActivos.delete(id);
            }
            
            bootstrap.Modal.getInstance(modal).hide();
            aplicarFiltrosUrgentes();
            mostrarNotificacion('Urgencia resuelta correctamente', 'success');
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error resolviendo urgencia:', error);
        mostrarNotificacion('Error al resolver la urgencia', 'error');
    }
}

// ==================== ESCALAMIENTO ====================
async function escalarUrgencia(id) {
    const urgente = urgentesData.find(u => u.id === id);
    if (!urgente) {
        mostrarNotificacion('Documento urgente no encontrado', 'error');
        return;
    }
    
    const motivoEscalamiento = prompt('Ingrese el motivo del escalamiento:', 'No se pudo resolver en el tiempo establecido');
    if (!motivoEscalamiento) return;
    
    try {
        const response = await fetch(`/api/documentos/urgentes/${id}/escalar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ motivo: motivoEscalamiento })
        });
        
        if (response.ok) {
            urgente.estado = 'Escalado';
            urgente.fechaEscalamiento = new Date().toISOString();
            urgente.motivoEscalamiento = motivoEscalamiento;
            
            aplicarFiltrosUrgentes();
            mostrarNotificacion('Urgencia escalada correctamente', 'warning');
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error escalando urgencia:', error);
        mostrarNotificacion('Error al escalar la urgencia', 'error');
    }
}

async function escalarUrgenciaAutomatico(id) {
    try {
        const response = await fetch(`/api/documentos/urgentes/${id}/escalar-automatico`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            const urgente = urgentesData.find(u => u.id === id);
            if (urgente) {
                urgente.estado = 'Escalado';
                urgente.fechaEscalamiento = new Date().toISOString();
                urgente.motivoEscalamiento = 'Escalamiento automático por vencimiento';
            }
            
            aplicarFiltrosUrgentes();
            mostrarNotificacionUrgente(`Documento ${urgente.documentoCodigo} escalado automáticamente`, 'warning');
        }
        
    } catch (error) {
        console.error('Error en escalamiento automático:', error);
    }
}

// ==================== ALERTAS Y NOTIFICACIONES ====================
function generarAlertasCriticas() {
    const container = document.getElementById('alertasCriticas');
    const ahora = new Date();
    
    const criticos = urgentesData.filter(u => {
        const tiempoRestante = calcularTiempoRestante(u.fechaLimite);
        return u.estado !== 'Resuelto' && (tiempoRestante.vencido || 
            ((tiempoRestante.horas || 0) * 60 + (tiempoRestante.minutos || 0)) <= 60);
    });
    
    const escalados = urgentesData.filter(u => u.estado === 'Escalado');
    
    let alertasHtml = '';
    
    if (criticos.length > 0) {
        alertasHtml += `
            <div class="alerta-critica">
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                    <div>
                        <h6 class="mb-1">⚠️ Documentos Críticos</h6>
                        <p class="mb-0">${criticos.length} documento(s) vencen en menos de 1 hora o ya han vencido</p>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-auto" onclick="filtrarCriticos()">Ver</button>
                </div>
            </div>
        `;
    }
    
    if (escalados.length > 0) {
        alertasHtml += `
            <div class="alerta-escalamiento">
                <div class="d-flex align-items-center">
                    <i class="bi bi-arrow-up-right-circle-fill fs-4 me-3"></i>
                    <div>
                        <h6 class="mb-1">🔥 Documentos Escalados</h6>
                        <p class="mb-0">${escalados.length} documento(s) han sido escalados y requieren atención inmediata</p>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-auto" onclick="filtrarEscalados()">Ver</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = alertasHtml;
}

function mostrarNotificacionUrgente(mensaje, tipo = 'danger') {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-urgente';
    notificacion.innerHTML = `
        <div class="notificacion-header">
            <i class="bi bi-exclamation-triangle-fill notificacion-icono"></i>
            <span class="notificacion-titulo">Alerta Urgente</span>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <p class="mb-0">${mensaje}</p>
    `;
    
    document.body.appendChild(notificacion);
    
    // Auto-remover después de 10 segundos
    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.remove();
        }
    }, 10000);
}

// ==================== FILTROS Y BÚSQUEDA ====================
function configurarFiltrosRapidos() {
    document.querySelectorAll('input[name="filtroRapido"]').forEach(radio => {
        radio.addEventListener('change', function() {
            filtroRapidoActual = this.value;
            aplicarFiltrosUrgentes();
        });
    });
}

function filtrarCriticos() {
    document.getElementById('filtroVencenHoy').checked = true;
    filtroRapidoActual = 'hoy';
    aplicarFiltrosUrgentes();
}

function filtrarEscalados() {
    document.getElementById('filtroEstadoUrgentes').value = 'Escalado';
    aplicarFiltrosUrgentes();
}

function poblarFiltros(documentos, responsables) {
    // Poblar responsables en filtros
    const selectResponsable = document.getElementById('filtroResponsableUrgentes');
    selectResponsable.innerHTML = '<option value="">Todos los responsables</option>';
    responsables.forEach(resp => {
        selectResponsable.innerHTML += `<option value="${htmlEscape(resp.nombre)}">${htmlEscape(resp.nombre)}</option>`;
    });
}

function aplicarFiltrosUrgentes() {
    const estado = document.getElementById('filtroEstadoUrgentes').value;
    const nivel = document.getElementById('filtroNivelUrgencia').value;
    const responsable = document.getElementById('filtroResponsableUrgentes').value;
    const tiempoRestante = document.getElementById('filtroTiempoRestante').value;
    const orden = document.getElementById('filtroOrdenUrgentes').value;
    const busqueda = document.getElementById('filtroBusquedaUrgentes').value.toLowerCase().trim();
    
    // Aplicar filtros
    urgentesFiltrados = urgentesData.filter(urgente => {
        const cumpleEstado = !estado || urgente.estado === estado;
        const cumpleNivel = !nivel || urgente.nivelUrgencia === nivel;
        const cumpleResponsable = !responsable || urgente.responsable === responsable;
        const cumpleBusqueda = !busqueda || 
            urgente.documentoCodigo.toLowerCase().includes(busqueda) ||
            urgente.documentoTitulo.toLowerCase().includes(busqueda) ||
            urgente.responsable.toLowerCase().includes(busqueda) ||
            urgente.motivoUrgencia.toLowerCase().includes(busqueda);
        
        // Filtro de tiempo restante
        let cumpleTiempo = true;
        if (tiempoRestante) {
            const tiempo = calcularTiempoRestante(urgente.fechaLimite);
            const totalMinutos = tiempo.vencido ? -1 : ((tiempo.horas || 0) * 60 + (tiempo.minutos || 0));
            
            switch (tiempoRestante) {
                case 'vencido':
                    cumpleTiempo = tiempo.vencido;
                    break;
                case 'menos_1h':
                    cumpleTiempo = !tiempo.vencido && totalMinutos <= 60;
                    break;
                case 'menos_4h':
                    cumpleTiempo = !tiempo.vencido && totalMinutos <= 240;
                    break;
                case 'menos_24h':
                    cumpleTiempo = !tiempo.vencido && totalMinutos <= 1440;
                    break;
            }
        }
        
        // Filtro rápido
        let cumpleFiltroRapido = true;
        if (filtroRapidoActual) {
            const tiempo = calcularTiempoRestante(urgente.fechaLimite);
            const esHoy = new Date(urgente.fechaLimite).toDateString() === new Date().toDateString();
            
            switch (filtroRapidoActual) {
                case 'hoy':
                    cumpleFiltroRapido = esHoy || tiempo.vencido;
                    break;
                case 'sin_atender':
                    cumpleFiltroRapido = urgente.estado === 'Pendiente';
                    break;
                case 'vencidos':
                    cumpleFiltroRapido = tiempo.vencido;
                    break;
            }
        }
        
        return cumpleEstado && cumpleNivel && cumpleResponsable && cumpleBusqueda && cumpleTiempo && cumpleFiltroRapido;
    });
    
    // Aplicar ordenamiento
    urgentesFiltrados.sort((a, b) => {
        switch (orden) {
            case 'tiempo_restante':
                const tiempoA = calcularTiempoRestante(a.fechaLimite);
                const tiempoB = calcularTiempoRestante(b.fechaLimite);
                if (tiempoA.vencido && !tiempoB.vencido) return -1;
                if (!tiempoA.vencido && tiempoB.vencido) return 1;
                return new Date(a.fechaLimite) - new Date(b.fechaLimite);
            case 'nivel_urgencia':
                const niveles = { 'Crítico': 3, 'Alto': 2, 'Medio': 1 };
                return (niveles[b.nivelUrgencia] || 1) - (niveles[a.nivelUrgencia] || 1);
            case 'fecha_creacion':
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            case 'responsable':
                return a.responsable.localeCompare(b.responsable);
            default:
                return new Date(a.fechaLimite) - new Date(b.fechaLimite);
        }
    });
    
    paginaActualUrgentes = 1;
    renderizarTablaUrgentes();
    actualizarEstadisticas();
    generarAlertasCriticas();
}

function limpiarFiltrosUrgentes() {
    document.getElementById('filtroEstadoUrgentes').value = '';
    document.getElementById('filtroNivelUrgencia').value = '';
    document.getElementById('filtroResponsableUrgentes').value = '';
    document.getElementById('filtroTiempoRestante').value = '';
    document.getElementById('filtroOrdenUrgentes').value = 'tiempo_restante';
    document.getElementById('filtroBusquedaUrgentes').value = '';
    
    // Limpiar filtros rápidos
    document.getElementById('filtroTodos').checked = true;
    filtroRapidoActual = '';
    
    aplicarFiltrosUrgentes();
}

// ==================== ESTADÍSTICAS ====================
function actualizarEstadisticas() {
    const total = urgentesFiltrados.length;
    const vencenHoy = urgentesFiltrados.filter(u => {
        const esHoy = new Date(u.fechaLimite).toDateString() === new Date().toDateString();
        const tiempoRestante = calcularTiempoRestante(u.fechaLimite);
        return esHoy || tiempoRestante.vencido;
    }).length;
    const sinAtender = urgentesFiltrados.filter(u => u.estado === 'Pendiente').length;
    const tiempoPromedio = calcularTiempoPromedio();
    
    document.getElementById('totalUrgentes').textContent = total;
    document.getElementById('vencenHoy').textContent = vencenHoy;
    document.getElementById('sinAtender').textContent = sinAtender;
    document.getElementById('tiempoPromedio').textContent = tiempoPromedio.toFixed(1);
}

function calcularTiempoPromedio() {
    const resueltos = urgentesData.filter(u => u.estado === 'Resuelto' && u.tiempoInvertido > 0);
    if (resueltos.length === 0) return 0;
    
    const totalTiempo = resueltos.reduce((suma, u) => suma + u.tiempoInvertido, 0);
    return totalTiempo / resueltos.length;
}

// ==================== SELECCIÓN MASIVA ====================
function toggleSeleccionTodosUrgentes() {
    const checkboxPrincipal = document.getElementById('selectAllUrgentes');
    const checkboxes = document.querySelectorAll('.urgentes-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = checkboxPrincipal.checked;
    });
    
    actualizarSeleccionUrgentes();
}

function actualizarSeleccionUrgentes() {
    const checkboxes = document.querySelectorAll('.urgentes-checkbox:checked');
    urgentesSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Actualizar checkbox principal
    const checkboxPrincipal = document.getElementById('selectAllUrgentes');
    const totalCheckboxes = document.querySelectorAll('.urgentes-checkbox').length;
    
    if (urgentesSeleccionados.length === 0) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = false;
    } else if (urgentesSeleccionados.length === totalCheckboxes) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = true;
    } else {
        checkboxPrincipal.indeterminate = true;
    }
    
    // Mostrar/ocultar acciones masivas
    const accionesMasivas = document.getElementById('accionesMasivas');
    if (accionesMasivas) {
        accionesMasivas.style.display = urgentesSeleccionados.length > 0 ? 'block' : 'none';
    }
}

function accionMasivaUrgentes(accion) {
    if (urgentesSeleccionados.length === 0) {
        mostrarNotificacion('Seleccione al menos un documento urgente', 'warning');
        return;
    }
    
    switch (accion) {
        case 'resolver':
            resolverUrgenciasMasivo();
            break;
        case 'escalar':
            escalarUrgenciasMasivo();
            break;
        case 'exportar':
            exportarUrgentesSeleccionados();
            break;
        case 'notificar':
            notificarResponsablesMasivo();
            break;
    }
}

async function resolverUrgenciasMasivo() {
    if (!confirm(`¿Está seguro de resolver ${urgentesSeleccionados.length} urgencia(s) seleccionada(s)?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/documentos/urgentes/resolver-masivo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ ids: urgentesSeleccionados })
        });
        
        if (response.ok) {
            urgentesSeleccionados.forEach(id => {
                const urgente = urgentesData.find(u => u.id === id);
                if (urgente) {
                    urgente.estado = 'Resuelto';
                    urgente.fechaResolucion = new Date().toISOString();
                }
            });
            
            urgentesSeleccionados = [];
            aplicarFiltrosUrgentes();
            mostrarNotificacion('Urgencias resueltas correctamente', 'success');
        }
    } catch (error) {
        console.error('Error resolviendo urgencias masivo:', error);
        mostrarNotificacion('Error al resolver las urgencias', 'error');
    }
}

// ==================== PAGINACIÓN ====================
function actualizarPaginacionUrgentes() {
    const totalPaginas = Math.ceil(urgentesFiltrados.length / elementosPorPaginaUrgentes);
    const paginacion = document.getElementById('paginacionUrgentes');
    
    if (!paginacion || totalPaginas <= 1) return;
    
    let html = '<nav><ul class="pagination justify-content-center">';
    
    // Botón anterior
    html += `<li class="page-item ${paginaActualUrgentes === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="cambiarPaginaUrgentes(${paginaActualUrgentes - 1})">
                    <i class="bi bi-chevron-left"></i>
                </button>
             </li>`;
    
    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualUrgentes - 2 && i <= paginaActualUrgentes + 2)) {
            html += `<li class="page-item ${i === paginaActualUrgentes ? 'active' : ''}">
                        <button class="page-link" onclick="cambiarPaginaUrgentes(${i})">${i}</button>
                     </li>`;
        } else if (i === paginaActualUrgentes - 3 || i === paginaActualUrgentes + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Botón siguiente
    html += `<li class="page-item ${paginaActualUrgentes === totalPaginas ? 'disabled' : ''}">
                <button class="page-link" onclick="cambiarPaginaUrgentes(${paginaActualUrgentes + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>
             </li>`;
    
    html += '</ul></nav>';
    paginacion.innerHTML = html;
}

function cambiarPaginaUrgentes(nuevaPagina) {
    const totalPaginas = Math.ceil(urgentesFiltrados.length / elementosPorPaginaUrgentes);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActualUrgentes = nuevaPagina;
    renderizarTablaUrgentes();
}

// ==================== CONFIGURACIÓN DE EVENTOS ====================
function configurarEventListeners() {
    // Filtros de búsqueda en tiempo real
    const filtroBusqueda = document.getElementById('filtroBusquedaUrgentes');
    if (filtroBusqueda) {
        filtroBusqueda.addEventListener('input', debounce(aplicarFiltrosUrgentes, 300));
    }
    
    // Cambios en filtros
    document.querySelectorAll('#filtroEstadoUrgentes, #filtroNivelUrgencia, #filtroResponsableUrgentes, #filtroTiempoRestante, #filtroOrdenUrgentes').forEach(select => {
        select.addEventListener('change', aplicarFiltrosUrgentes);
    });
    
    // Cambio de nivel de urgencia en formulario
    const nivelUrgencia = document.getElementById('nivelUrgencia');
    if (nivelUrgencia) {
        nivelUrgencia.addEventListener('change', actualizarTiemposLimite);
    }
    
    // Teclas de acceso rápido
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'u':
                    e.preventDefault();
                    marcarUrgente();
                    break;
                case 'r':
                    e.preventDefault();
                    actualizarListaUrgentes();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('filtroBusquedaUrgentes').focus();
                    break;
            }
        }
    });
}

// ==================== ACTUALIZACIÓN PERIÓDICA ====================
function iniciarActualizacionPeriodica() {
    // Actualizar cada 5 minutos
    intervaloUrgentes = setInterval(() => {
        actualizarListaUrgentes();
    }, 5 * 60 * 1000);
}

async function actualizarListaUrgentes() {
    try {
        const urgentesActualizados = await cargarDocumentosUrgentes();
        urgentesData = urgentesActualizados;
        aplicarFiltrosUrgentes();
        console.log('✅ Lista de urgentes actualizada');
    } catch (error) {
        console.error('❌ Error actualizando urgentes:', error);
    }
}

// ==================== VER DETALLES ====================
function verDetallesUrgencia(id) {
    const urgente = urgentesData.find(u => u.id === id);
    if (!urgente) {
        mostrarNotificacion('Documento urgente no encontrado', 'error');
        return;
    }
    
    const tiempoRestante = calcularTiempoRestante(urgente.fechaLimite);
    
    document.getElementById('detalleDocumentoCodigo').textContent = urgente.documentoCodigo;
    document.getElementById('detalleDocumentoTitulo').textContent = urgente.documentoTitulo;
    document.getElementById('detalleNivelUrgencia').innerHTML = generarBadgeNivelUrgencia(urgente.nivelUrgencia);
    document.getElementById('detalleEstado').innerHTML = generarBadgeEstadoUrgencia(urgente.estado);
    document.getElementById('detalleResponsable').textContent = `${urgente.responsable} (${urgente.cargoResponsable})`;
    document.getElementById('detalleFechaCreacion').textContent = formatearFechaHora(urgente.fechaCreacion);
    document.getElementById('detalleFechaLimite').textContent = formatearFechaHora(urgente.fechaLimite);
    document.getElementById('detalleTiempoRestante').innerHTML = `<span class="${obtenerClaseTiempo(tiempoRestante)}">${generarTextoTiempoRestante(tiempoRestante)}</span>`;
    document.getElementById('detalleMotivoUrgencia').textContent = urgente.motivoUrgencia || 'No especificado';
    document.getElementById('detalleInstrucciones').textContent = urgente.instrucciones || 'No especificadas';
    document.getElementById('detalleProgreso').textContent = `${urgente.progreso}%`;
    document.getElementById('detalleTiempoInvertido').textContent = `${urgente.tiempoInvertido}h`;
    document.getElementById('detalleUltimaActividad').textContent = formatearFechaHora(urgente.ultimaActividad);
    
    // Información adicional según el estado
    const infoAdicional = document.getElementById('detalleInfoAdicional');
    if (urgente.estado === 'Escalado') {
        infoAdicional.innerHTML = `
            <div class="alert alert-warning">
                <h6><i class="bi bi-arrow-up-right"></i> Información de Escalamiento</h6>
                <p class="mb-1"><strong>Escalado a:</strong> ${urgente.escaladoA || 'No especificado'}</p>
                <p class="mb-1"><strong>Fecha de escalamiento:</strong> ${formatearFechaHora(urgente.fechaEscalamiento)}</p>
                <p class="mb-0"><strong>Motivo:</strong> ${urgente.motivoEscalamiento || 'No especificado'}</p>
            </div>
        `;
    } else if (urgente.estado === 'Resuelto') {
        infoAdicional.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="bi bi-check-circle"></i> Información de Resolución</h6>
                <p class="mb-1"><strong>Fecha de resolución:</strong> ${formatearFechaHora(urgente.fechaResolucion)}</p>
                <p class="mb-0"><strong>Descripción:</strong> ${urgente.descripcionResolucion || 'No especificada'}</p>
            </div>
        `;
    } else {
        infoAdicional.innerHTML = '';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetallesUrgencia'));
    modal.show();
}

// ==================== FUNCIONES AUXILIARES ====================
function htmlEscape(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatearFechaHora(fechaStr) {
    if (!fechaStr) return 'No disponible';
    
    const fecha = new Date(fechaStr);
    const opciones = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    return fecha.toLocaleDateString('es-ES', opciones);
}

function mostrarCargando(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando documentos urgentes...</p>
            </div>
        `;
    }
}

function mostrarError(containerId, mensaje) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="bi bi-exclamation-triangle fs-1"></i>
                <h5 class="mt-2">Error</h5>
                <p class="mb-0">${mensaje}</p>
                <button class="btn btn-outline-danger mt-2" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    Reintentar
                </button>
            </div>
        `;
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const alertas = {
        'success': { clase: 'alert-success', icono: 'bi-check-circle' },
        'error': { clase: 'alert-danger', icono: 'bi-exclamation-triangle' },
        'warning': { clase: 'alert-warning', icono: 'bi-exclamation-triangle' },
        'info': { clase: 'alert-info', icono: 'bi-info-circle' }
    };
    
    const config = alertas[tipo] || alertas['info'];
    
    const notificacion = document.createElement('div');
    notificacion.className = `alert ${config.clase} alert-dismissible fade show position-fixed`;
    notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notificacion.innerHTML = `
        <i class="bi ${config.icono} me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notificacion);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.remove();
        }
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== EXPORTACIÓN ====================
function exportarUrgentesSeleccionados() {
    if (urgentesSeleccionados.length === 0) {
        mostrarNotificacion('Seleccione al menos un documento urgente para exportar', 'warning');
        return;
    }
    
    const urgentesExportar = urgentesData.filter(u => urgentesSeleccionados.includes(u.id));
    const csv = generarCSVUrgentes(urgentesExportar);
    descargarArchivo(csv, 'urgentes-seleccionados.csv', 'text/csv');
}

function exportarTodosUrgentes() {
    const csv = generarCSVUrgentes(urgentesFiltrados);
    descargarArchivo(csv, 'todos-urgentes.csv', 'text/csv');
}

function generarCSVUrgentes(datos) {
    const headers = [
        'Código', 'Título', 'Nivel Urgencia', 'Estado', 'Responsable', 
        'Fecha Creación', 'Fecha Límite', 'Motivo', 'Progreso (%)', 'Tiempo Invertido (h)'
    ];
    
    const filas = datos.map(u => [
        u.documentoCodigo,
        u.documentoTitulo,
        u.nivelUrgencia,
        u.estado,
        u.responsable,
        formatearFechaHora(u.fechaCreacion),
        formatearFechaHora(u.fechaLimite),
        u.motivoUrgencia || '',
        u.progreso,
        u.tiempoInvertido
    ]);
    
    return [headers, ...filas].map(fila => 
        fila.map(campo => `"${String(campo).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

function descargarArchivo(contenido, nombreArchivo, tipoMime) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.URL.revokeObjectURL(url);
}

// ==================== NOTIFICACIONES MASIVAS ====================
async function notificarResponsablesMasivo() {
    if (urgentesSeleccionados.length === 0) {
        mostrarNotificacion('Seleccione al menos un documento urgente', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/documentos/urgentes/notificar-masivo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ ids: urgentesSeleccionados })
        });
        
        if (response.ok) {
            mostrarNotificacion('Notificaciones enviadas correctamente', 'success');
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('Error enviando notificaciones:', error);
        mostrarNotificacion('Error al enviar las notificaciones', 'error');
    }
}

// ==================== LIMPIAR RECURSOS ====================
window.addEventListener('beforeunload', function() {
    // Limpiar intervalos activos
    if (intervaloUrgentes) {
        clearInterval(intervaloUrgentes);
    }
    
    // Limpiar timers activos
    timersActivos.forEach(timer => clearInterval(timer));
    timersActivos.clear();
});

console.log('📋 Módulo Urgentes cargado completamente - v3.0.0');