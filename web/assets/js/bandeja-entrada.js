/* ==================== BANDEJA ENTRADA JS - OPTIMIZADO ==================== */
/* Sistema de Gestión Documental - Constructora Vial S.A. */
/* @version 3.0.0 (Optimizada y Modernizada) */

// ==================== VARIABLES GLOBALES ====================
let bandejaEntradaData = [];
let bandejaEntradaFiltrados = [];
let paginaActualBandejaEntrada = 1;
let elementosPorPaginaBandejaEntrada = 10;
let bandejaEntradaSeleccionados = [];
let intervaloBandejaEntrada = null;
let documentosExpandidos = new Set();

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    inicializarBandejaEntrada();
});

function inicializarBandejaEntrada() {
    console.log('🚀 Inicializando módulo Bandeja de Entrada...');
    
    cargarDatosIniciales();
    configurarEventListeners();
    iniciarActualizacionPeriodica();
    configurarDragAndDrop();
    
    console.log('✅ Módulo Bandeja de Entrada inicializado correctamente');
}

// ==================== CARGA DE DATOS ====================
async function cargarDatosIniciales() {
    try {
        mostrarCargando('tablaBandejaEntradaContainer');
        
        // Cargar datos en paralelo
        const [documentos, emisores, destinatarios] = await Promise.all([
            cargarDocumentosBandejaEntrada(),
            cargarEmisores(),
            cargarDestinatarios()
        ]);
        
        bandejaEntradaData = documentos;
        bandejaEntradaFiltrados = [...bandejaEntradaData];
        
        poblarFiltros(emisores, destinatarios);
        actualizarEstadisticas();
        renderizarTablaBandejaEntrada();
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        mostrarError('tablaBandejaEntradaContainer', 'Error al cargar los documentos');
    }
}

async function cargarDocumentosBandejaEntrada() {
    try {
        // Simulación de llamada a API - Reemplazar con llamada real
        const response = await fetch('/api/documentos/bandeja-entrada', {
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
        return data.documentos || generarDatosPruebaBandejaEntrada();
        
    } catch (error) {
        console.warn('⚠️ Usando datos de prueba para bandeja de entrada:', error.message);
        return generarDatosPruebaBandejaEntrada();
    }
}

function generarDatosPruebaBandejaEntrada() {
    return [
        {
            id: 1,
            codigo: 'DOC-2025-001',
            titulo: 'Solicitud de Información Técnica - Pavimentación Ruta 101',
            emisor: 'Ministerio de Transportes',
            usuarioEmisor: 'Ana García',
            estado: 'Sin Leer',
            prioridad: 'Urgente',
            fechaRecepcion: '2025-01-22T14:30:00Z',
            fechaEmision: '2025-01-22T09:15:00Z',
            fechaVencimiento: '2025-01-25T17:00:00Z',
            tipo: 'Solicitud de Información',
            proyecto: 'Mejoramiento Ruta 101',
            descripcion: 'Se solicita información técnica detallada sobre el estado actual del pavimento y las especificaciones propuestas para el mejoramiento.',
            tiempoRespuesta: 72, // horas
            anexos: [
                { 
                    nombre: 'especificaciones_requeridas.pdf', 
                    tamano: 2.3, 
                    tipo: 'PDF',
                    fechaSubida: '2025-01-22T09:15:00Z'
                }
            ],
            historial: [
                {
                    fecha: '2025-01-22T14:30:00Z',
                    accion: 'Recibido',
                    usuario: 'Sistema'
                }
            ]
        },
        {
            id: 2,
            codigo: 'DOC-2025-002',
            titulo: 'Observaciones al Estudio de Impacto Ambiental',
            emisor: 'SERNANP',
            usuarioEmisor: 'Carlos Mendoza',
            estado: 'Sin Leer',
            prioridad: 'Alta',
            fechaRecepcion: '2025-01-22T11:45:00Z',
            fechaEmision: '2025-01-22T08:30:00Z',
            fechaVencimiento: '2025-01-28T17:00:00Z',
            tipo: 'Observaciones',
            proyecto: 'Construcción Puente Río Verde',
            descripcion: 'Observaciones técnicas al estudio de impacto ambiental presentado para la construcción del puente sobre el Río Verde.',
            tiempoRespuesta: 144, // horas
            anexos: [
                { 
                    nombre: 'observaciones_detalladas.docx', 
                    tamano: 1.8, 
                    tipo: 'Word',
                    fechaSubida: '2025-01-22T08:30:00Z'
                },
                { 
                    nombre: 'mapa_areas_sensibles.pdf', 
                    tamano: 5.2, 
                    tipo: 'PDF',
                    fechaSubida: '2025-01-22T08:30:00Z'
                }
            ],
            historial: [
                {
                    fecha: '2025-01-22T11:45:00Z',
                    accion: 'Recibido',
                    usuario: 'Sistema'
                }
            ]
        },
        {
            id: 3,
            codigo: 'DOC-2025-003',
            titulo: 'Aprobación Parcial del Presupuesto',
            emisor: 'Dirección de Presupuesto',
            usuarioEmisor: 'María Rodríguez',
            estado: 'Leído',
            prioridad: 'Normal',
            fechaRecepcion: '2025-01-21T16:20:00Z',
            fechaEmision: '2025-01-21T15:00:00Z',
            fechaVencimiento: '2025-01-30T17:00:00Z',
            tipo: 'Aprobación',
            proyecto: 'Terminal de Buses Central',
            descripcion: 'Se comunica la aprobación parcial del presupuesto presentado para la construcción de la terminal de buses.',
            tiempoRespuesta: 192, // horas
            anexos: [],
            historial: [
                {
                    fecha: '2025-01-21T16:20:00Z',
                    accion: 'Recibido',
                    usuario: 'Sistema'
                },
                {
                    fecha: '2025-01-22T08:15:00Z',
                    accion: 'Leído',
                    usuario: 'Juan Pérez'
                }
            ]
        },
        {
            id: 4,
            codigo: 'DOC-2025-004',
            titulo: 'Consulta sobre Especificaciones Técnicas',
            emisor: 'Contratista Principal',
            usuarioEmisor: 'Luis Fernández',
            estado: 'Respondido',
            prioridad: 'Normal',
            fechaRecepcion: '2025-01-20T10:30:00Z',
            fechaEmision: '2025-01-20T09:00:00Z',
            fechaVencimiento: '2025-01-27T17:00:00Z',
            tipo: 'Consulta',
            proyecto: 'Mejoramiento Ruta 101',
            descripcion: 'Consulta sobre especificaciones técnicas específicas para el tipo de asfalto a utilizar en el proyecto.',
            tiempoRespuesta: 120, // horas
            anexos: [
                { 
                    nombre: 'consulta_especificaciones.pdf', 
                    tamano: 1.5, 
                    tipo: 'PDF',
                    fechaSubida: '2025-01-20T09:00:00Z'
                }
            ],
            historial: [
                {
                    fecha: '2025-01-20T10:30:00Z',
                    accion: 'Recibido',
                    usuario: 'Sistema'
                },
                {
                    fecha: '2025-01-20T14:15:00Z',
                    accion: 'Leído',
                    usuario: 'Juan Pérez'
                },
                {
                    fecha: '2025-01-21T09:30:00Z',
                    accion: 'Respondido',
                    usuario: 'Juan Pérez'
                }
            ]
        },
        {
            id: 5,
            codigo: 'DOC-2025-005',
            titulo: 'Notificación de Inicio de Supervisión',
            emisor: 'Empresa Supervisora',
            usuarioEmisor: 'Roberto Silva',
            estado: 'Sin Leer',
            prioridad: 'Alta',
            fechaRecepcion: '2025-01-22T16:00:00Z',
            fechaEmision: '2025-01-22T14:30:00Z',
            fechaVencimiento: '2025-01-24T17:00:00Z',
            tipo: 'Notificación',
            proyecto: 'Terminal de Buses Central',
            descripcion: 'Notificación formal del inicio de actividades de supervisión de obra según cronograma establecido.',
            tiempoRespuesta: 48, // horas
            anexos: [
                { 
                    nombre: 'cronograma_supervision.xlsx', 
                    tamano: 0.8, 
                    tipo: 'Excel',
                    fechaSubida: '2025-01-22T14:30:00Z'
                }
            ],
            historial: [
                {
                    fecha: '2025-01-22T16:00:00Z',
                    accion: 'Recibido',
                    usuario: 'Sistema'
                }
            ]
        }
    ];
}

async function cargarEmisores() {
    try {
        // Simulación de llamada a API
        return [
            'Ministerio de Transportes',
            'SERNANP',
            'Dirección de Presupuesto',
            'Contratista Principal',
            'Empresa Supervisora',
            'OSINERGMIN',
            'Municipalidad Provincial',
            'CENEPRED'
        ];
    } catch (error) {
        console.error('Error cargando emisores:', error);
        return [];
    }
}

async function cargarDestinatarios() {
    try {
        // Simulación de llamada a API
        return [
            'Juan Pérez - Gerente de Proyectos',
            'María González - Ingeniera Ambiental',
            'Carlos Ruiz - Ingeniero Estructural',
            'Ana Martínez - Especialista en Seguridad',
            'Luis Torres - Arquitecto Principal'
        ];
    } catch (error) {
        console.error('Error cargando destinatarios:', error);
        return [];
    }
}

// ==================== RENDERIZADO ====================
function renderizarTablaBandejaEntrada() {
    const container = document.getElementById('tablaBandejaEntradaContainer');
    
    if (bandejaEntradaFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 4rem; color: var(--gray-300);"></i>
                <h5 class="mt-3 text-muted">Bandeja vacía</h5>
                <p class="text-muted">No hay documentos que coincidan con los filtros aplicados.</p>
            </div>
        `;
        return;
    }
    
    const inicio = (paginaActualBandejaEntrada - 1) * elementosPorPaginaBandejaEntrada;
    const fin = inicio + elementosPorPaginaBandejaEntrada;
    const documentosPagina = bandejaEntradaFiltrados.slice(inicio, fin);
    
    const tabla = `
        <div class="table-responsive">
            <table class="table bandeja-entrada-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="selectAllBandejaEntrada" 
                                       onchange="toggleSeleccionTodosBandejaEntrada()">
                            </div>
                        </th>
                        <th style="width: 30px;"></th>
                        <th style="width: 120px;">Código</th>
                        <th>Título</th>
                        <th style="width: 150px;">Emisor</th>
                        <th style="width: 100px;">Estado</th>
                        <th style="width: 100px;">Prioridad</th>
                        <th style="width: 150px;">Recepción</th>
                        <th style="width: 120px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${documentosPagina.map(doc => generarFilaDocumento(doc)).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tabla;
    actualizarPaginacionBandejaEntrada();
}

function generarFilaDocumento(doc) {
    const esExpandido = documentosExpandidos.has(doc.id);
    const tiempoTranscurrido = calcularTiempoTranscurrido(doc.fechaRecepcion);
    const esVencido = new Date() > new Date(doc.fechaVencimiento);
    const esUrgente = doc.prioridad === 'Urgente';
    const esSinLeer = doc.estado === 'Sin Leer';
    
    let clasesFila = ['documento-row'];
    if (esSinLeer) clasesFila.push('sin-leer');
    if (esUrgente) clasesFila.push('urgente');
    if (esVencido) clasesFila.push('vencido');
    
    return `
        <tr class="${clasesFila.join(' ')}" data-id="${doc.id}">
            <td>
                <div class="form-check">
                    <input class="form-check-input bandeja-entrada-checkbox" type="checkbox" 
                           value="${doc.id}" onchange="actualizarSeleccionBandejaEntrada()">
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-link p-0" onclick="toggleExpandirDocumento(${doc.id})" 
                        title="${esExpandido ? 'Contraer' : 'Expandir'} detalles">
                    <i class="bi bi-chevron-${esExpandido ? 'down' : 'right'}"></i>
                </button>
            </td>
            <td>
                <span class="fw-bold text-primary">${htmlEscape(doc.codigo)}</span>
                ${esSinLeer ? '<i class="bi bi-circle-fill text-info ms-1" style="font-size: 0.5rem;" title="Sin leer"></i>' : ''}
            </td>
            <td>
                <div>
                    <span class="fw-medium">${htmlEscape(doc.titulo)}</span>
                    ${doc.proyecto ? `<small class="d-block text-muted">Proyecto: ${htmlEscape(doc.proyecto)}</small>` : ''}
                    <small class="tiempo-transcurrido ${obtenerClaseTiempo(tiempoTranscurrido, esVencido)}">${tiempoTranscurrido}</small>
                </div>
            </td>
            <td>
                <div>
                    <span class="fw-medium">${htmlEscape(doc.emisor)}</span>
                    <small class="d-block text-muted">${htmlEscape(doc.usuarioEmisor)}</small>
                </div>
            </td>
            <td>
                ${generarBadgeEstadoBandejaEntrada(doc.estado)}
            </td>
            <td>
                ${generarBadgePrioridad(doc.prioridad)}
            </td>
            <td>
                <small class="text-muted">${formatearFecha(doc.fechaRecepcion)}</small>
                ${esVencido ? '<div class="text-danger"><small><i class="bi bi-exclamation-triangle"></i> Vencido</small></div>' : ''}
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="verDocumentoCompleto(${doc.id})" 
                            title="Ver documento completo">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="responderDocumento(${doc.id})" 
                            title="Responder documento">
                        <i class="bi bi-reply"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="marcarComoLeidoDocumento(${doc.id})" 
                            title="Marcar como leído">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="archivarDocumento(${doc.id})" 
                            title="Archivar documento">
                        <i class="bi bi-archive"></i>
                    </button>
                </div>
            </td>
        </tr>
        ${esExpandido ? generarFilaExpandida(doc) : ''}
    `;
}

function generarFilaExpandida(doc) {
    return `
        <tr class="documento-expandido" data-parent="${doc.id}">
            <td colspan="9">
                <div class="documento-contenido">
                    <div class="documento-metadata">
                        <div class="metadata-item">
                            <div class="metadata-label">Tipo</div>
                            <div class="metadata-value">${htmlEscape(doc.tipo)}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Fecha Emisión</div>
                            <div class="metadata-value">${formatearFecha(doc.fechaEmision)}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Fecha Vencimiento</div>
                            <div class="metadata-value">${formatearFecha(doc.fechaVencimiento)}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Tiempo Respuesta</div>
                            <div class="metadata-value">${doc.tiempoRespuesta}h</div>
                        </div>
                    </div>
                    
                    ${doc.descripcion ? `
                        <div class="mt-3">
                            <h6 class="text-primary">Descripción</h6>
                            <p class="text-muted mb-3">${htmlEscape(doc.descripcion)}</p>
                        </div>
                    ` : ''}
                    
                    ${doc.anexos && doc.anexos.length > 0 ? `
                        <div class="mt-3">
                            <h6 class="text-primary">Anexos (${doc.anexos.length})</h6>
                            <div class="row">
                                ${doc.anexos.map(anexo => `
                                    <div class="col-md-6 col-lg-4 mb-2">
                                        <div class="anexo-item">
                                            <div class="d-flex align-items-center">
                                                <i class="bi bi-file-earmark me-2 text-info"></i>
                                                <div class="flex-grow-1">
                                                    <strong class="d-block">${htmlEscape(anexo.nombre)}</strong>
                                                    <small class="text-muted">${anexo.tamano} MB • ${anexo.tipo}</small>
                                                </div>
                                                <button class="btn btn-sm btn-outline-primary ms-2" 
                                                        onclick="descargarAnexo(${doc.id}, '${anexo.nombre}')" 
                                                        title="Descargar anexo">
                                                    <i class="bi bi-download"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${doc.historial && doc.historial.length > 0 ? `
                        <div class="mt-3">
                            <h6 class="text-primary">Historial</h6>
                            <div class="timeline-simple">
                                ${doc.historial.map(entrada => `
                                    <div class="timeline-item-simple">
                                        <small class="text-muted">${formatearFecha(entrada.fecha)}</small>
                                        <span class="ms-2">${entrada.accion}</span>
                                        ${entrada.usuario ? `<small class="ms-2 text-muted">por ${htmlEscape(entrada.usuario)}</small>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="mt-4 d-flex gap-2">
                        <button class="btn btn-success btn-sm" onclick="responderDocumento(${doc.id})">
                            <i class="bi bi-reply me-1"></i>
                            Responder
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="verDocumentoCompleto(${doc.id})">
                            <i class="bi bi-eye me-1"></i>
                            Ver Completo
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="descargarDocumento(${doc.id})">
                            <i class="bi bi-download me-1"></i>
                            Descargar
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

function generarBadgeEstadoBandejaEntrada(estado) {
    const badges = {
        'Sin Leer': 'badge-sin-leer',
        'Leído': 'badge-leido',
        'Respondido': 'badge-respondido',
        'Archivado': 'badge-archivado'
    };
    
    return `<span class="badge ${badges[estado] || 'badge-sin-leer'}">${htmlEscape(estado)}</span>`;
}

function generarBadgePrioridad(prioridad) {
    const badges = {
        'Normal': 'badge-normal',
        'Alta': 'badge-alta',
        'Urgente': 'badge-urgente'
    };
    
    return `<span class="badge ${badges[prioridad] || 'badge-normal'}">${htmlEscape(prioridad)}</span>`;
}

// ==================== INTERACCIONES ====================
function toggleExpandirDocumento(id) {
    if (documentosExpandidos.has(id)) {
        documentosExpandidos.delete(id);
    } else {
        documentosExpandidos.add(id);
    }
    renderizarTablaBandejaEntrada();
}

function expandirContraerTodo() {
    if (documentosExpandidos.size > 0) {
        documentosExpandidos.clear();
    } else {
        bandejaEntradaFiltrados.forEach(doc => {
            documentosExpandidos.add(doc.id);
        });
    }
    renderizarTablaBandejaEntrada();
}

// ==================== FILTROS ====================
function poblarFiltros(emisores, destinatarios) {
    // Poblar emisores
    const selectEmisor = document.getElementById('filtroEmisorBandejaEntrada');
    selectEmisor.innerHTML = '<option value="">Todos los emisores</option>';
    emisores.forEach(emisor => {
        selectEmisor.innerHTML += `<option value="${htmlEscape(emisor)}">${htmlEscape(emisor)}</option>`;
    });
    
    // Poblar destinatarios en modal de respuesta
    const selectDestinatarios = document.getElementById('respuestaDestinatarios');
    if (selectDestinatarios) {
        selectDestinatarios.innerHTML = '';
        destinatarios.forEach(destinatario => {
            selectDestinatarios.innerHTML += `<option value="${htmlEscape(destinatario)}">${htmlEscape(destinatario)}</option>`;
        });
    }
}

function aplicarFiltrosBandejaEntrada() {
    const estado = document.getElementById('filtroEstadoBandejaEntrada').value;
    const prioridad = document.getElementById('filtroPrioridadBandejaEntrada').value;
    const emisor = document.getElementById('filtroEmisorBandejaEntrada').value;
    const orden = document.getElementById('filtroOrdenBandejaEntrada').value;
    const busqueda = document.getElementById('filtroBusquedaBandejaEntrada').value.toLowerCase().trim();
    const fecha = document.getElementById('filtroFechaBandejaEntrada').value;
    
    // Aplicar filtros
    bandejaEntradaFiltrados = bandejaEntradaData.filter(doc => {
        const cumpleEstado = !estado || doc.estado === estado;
        const cumplePrioridad = !prioridad || doc.prioridad === prioridad;
        const cumpleEmisor = !emisor || doc.emisor === emisor;
        const cumpleBusqueda = !busqueda || 
            doc.codigo.toLowerCase().includes(busqueda) ||
            doc.titulo.toLowerCase().includes(busqueda) ||
            doc.emisor.toLowerCase().includes(busqueda) ||
            doc.usuarioEmisor.toLowerCase().includes(busqueda);
        const cumpleFecha = !fecha || cumpleFiltroFecha(doc.fechaRecepcion, fecha);
        
        return cumpleEstado && cumplePrioridad && cumpleEmisor && cumpleBusqueda && cumpleFecha;
    });
    
    // Aplicar ordenamiento
    bandejaEntradaFiltrados.sort((a, b) => {
        switch (orden) {
            case 'fecha_recepcion':
                return new Date(b.fechaRecepcion) - new Date(a.fechaRecepcion);
            case 'prioridad':
                const prioridades = { 'Urgente': 3, 'Alta': 2, 'Normal': 1 };
                return (prioridades[b.prioridad] || 1) - (prioridades[a.prioridad] || 1);
            case 'emisor':
                return a.emisor.localeCompare(b.emisor);
            case 'codigo':
                return a.codigo.localeCompare(b.codigo);
            default:
                return new Date(b.fechaRecepcion) - new Date(a.fechaRecepcion);
        }
    });
    
    paginaActualBandejaEntrada = 1;
    renderizarTablaBandejaEntrada();
    actualizarEstadisticas();
}

function cumpleFiltroFecha(fechaDocumento, filtroFecha) {
    const fecha = new Date(fechaDocumento);
    const ahora = new Date();
    
    switch (filtroFecha) {
        case 'hoy':
            return fecha.toDateString() === ahora.toDateString();
        case 'ayer':
            const ayer = new Date(ahora);
            ayer.setDate(ayer.getDate() - 1);
            return fecha.toDateString() === ayer.toDateString();
        case 'semana':
            const inicioSemana = new Date(ahora);
            inicioSemana.setDate(ahora.getDate() - ahora.getDay());
            return fecha >= inicioSemana;
        case 'mes':
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        default:
            return true;
    }
}

function limpiarFiltrosBandejaEntrada() {
    document.getElementById('filtroEstadoBandejaEntrada').value = '';
    document.getElementById('filtroPrioridadBandejaEntrada').value = '';
    document.getElementById('filtroEmisorBandejaEntrada').value = '';
    document.getElementById('filtroOrdenBandejaEntrada').value = 'fecha_recepcion';
    document.getElementById('filtroBusquedaBandejaEntrada').value = '';
    document.getElementById('filtroFechaBandejaEntrada').value = '';
    
    aplicarFiltrosBandejaEntrada();
}

// ==================== ESTADÍSTICAS ====================
function actualizarEstadisticas() {
    const total = bandejaEntradaFiltrados.length;
    const urgentes = bandejaEntradaFiltrados.filter(d => d.prioridad === 'Urgente').length;
    const sinLeer = bandejaEntradaFiltrados.filter(d => d.estado === 'Sin Leer').length;
    const vencidos = bandejaEntradaFiltrados.filter(d => new Date() > new Date(d.fechaVencimiento)).length;
    
    document.getElementById('totalBandejaEntrada').textContent = total;
    document.getElementById('urgentesEntrada').textContent = urgentes;
    document.getElementById('sinLeerEntrada').textContent = sinLeer;
    document.getElementById('vencidosEntrada').textContent = vencidos;
}

// ==================== ACCIONES PRINCIPALES ====================
function responderDocumento(id) {
    const documento = bandejaEntradaData.find(d => d.id === id);
    if (!documento) {
        mostrarNotificacion('Documento no encontrado', 'error');
        return;
    }
    
    // Llenar información del documento original
    document.getElementById('infoDocumentoOriginal').innerHTML = `
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-1"><strong>Código:</strong> ${htmlEscape(documento.codigo)}</p>
                    <p class="mb-1"><strong>Título:</strong> ${htmlEscape(documento.titulo)}</p>
                    <p class="mb-1"><strong>Emisor:</strong> ${htmlEscape(documento.emisor)}</p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Prioridad:</strong> ${generarBadgePrioridad(documento.prioridad)}</p>
                    <p class="mb-1"><strong>Recibido:</strong> ${formatearFecha(documento.fechaRecepcion)}</p>
                    <p class="mb-0"><strong>Vencimiento:</strong> ${formatearFecha(documento.fechaVencimiento)}</p>
                </div>
            </div>
        </div>
    `;
    
    // Pre-llenar título de respuesta
    document.getElementById('respuestaTitulo').value = `RE: ${documento.titulo}`;
    
    // Guardar ID para el envío
    document.getElementById('modalResponderDocumento').dataset.documentoId = id;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalResponderDocumento'));
    modal.show();
}

function verDocumentoCompleto(id) {
    const documento = bandejaEntradaData.find(d => d.id === id);
    if (!documento) {
        mostrarNotificacion('Documento no encontrado', 'error');
        return;
    }
    
    // Marcar como leído automáticamente
    if (documento.estado === 'Sin Leer') {
        marcarComoLeidoDocumento(id, false);
    }
    
    // Cargar visor de documentos
    document.getElementById('documentoCompletoViewer').innerHTML = `
        <div class="text-center mt-5">
            <i class="bi bi-file-earmark-text" style="font-size: 4rem; color: #6c757d;"></i>
            <h5 class="mt-3">${htmlEscape(documento.titulo)}</h5>
            <p class="text-muted">Vista previa del documento no disponible</p>
            <p class="text-muted">Código: ${htmlEscape(documento.codigo)}</p>
        </div>
    `;
    
    // Guardar ID para acciones
    document.getElementById('modalVerDocumentoCompleto').dataset.documentoId = id;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalVerDocumentoCompleto'));
    modal.show();
}

async function marcarComoLeidoDocumento(id, mostrarConfirmacion = true) {
    try {
        if (mostrarConfirmacion) {
            if (!confirm('¿Marcar este documento como leído?')) {
                return;
            }
        }
        
        // Llamada a API
        const response = await fetch(`/api/documentos/bandeja-entrada/${id}/marcar-leido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            // Actualizar datos locales
            const documento = bandejaEntradaData.find(d => d.id === id);
            if (documento) {
                documento.estado = 'Leído';
                documento.historial.push({
                    fecha: new Date().toISOString(),
                    accion: 'Leído',
                    usuario: 'Usuario Actual'
                });
            }
            
            aplicarFiltrosBandejaEntrada();
            if (mostrarConfirmacion) {
                mostrarNotificacion('Documento marcado como leído', 'success');
            }
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error marcando como leído:', error);
        mostrarNotificacion('Error al marcar como leído', 'error');
    }
}

function archivarDocumento(id) {
    if (confirm('¿Está seguro de que desea archivar este documento?')) {
        archivarDocumentoConfirmado(id);
    }
}

async function archivarDocumentoConfirmado(id) {
    try {
        const response = await fetch(`/api/documentos/bandeja-entrada/${id}/archivar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            // Actualizar datos locales
            const documento = bandejaEntradaData.find(d => d.id === id);
            if (documento) {
                documento.estado = 'Archivado';
                documento.historial.push({
                    fecha: new Date().toISOString(),
                    accion: 'Archivado',
                    usuario: 'Usuario Actual'
                });
            }
            
            aplicarFiltrosBandejaEntrada();
            mostrarNotificacion('Documento archivado correctamente', 'success');
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error archivando documento:', error);
        mostrarNotificacion('Error al archivar el documento', 'error');
    }
}

// ==================== SELECCIÓN MASIVA ====================
function seleccionarTodosBandejaEntrada() {
    const checkboxPrincipal = document.getElementById('selectAllBandejaEntrada');
    const checkboxes = document.querySelectorAll('.bandeja-entrada-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = checkboxPrincipal.checked;
    });
    
    actualizarSeleccionBandejaEntrada();
}

function toggleSeleccionTodosBandejaEntrada() {
    seleccionarTodosBandejaEntrada();
}

function actualizarSeleccionBandejaEntrada() {
    const checkboxes = document.querySelectorAll('.bandeja-entrada-checkbox:checked');
    bandejaEntradaSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Actualizar checkbox principal
    const checkboxPrincipal = document.getElementById('selectAllBandejaEntrada');
    const totalCheckboxes = document.querySelectorAll('.bandeja-entrada-checkbox').length;
    
    if (bandejaEntradaSeleccionados.length === 0) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = false;
    } else if (bandejaEntradaSeleccionados.length === totalCheckboxes) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = true;
    } else {
        checkboxPrincipal.indeterminate = true;
    }
}

function marcarComoLeido() {
    if (bandejaEntradaSeleccionados.length === 0) {
        mostrarNotificacion('Por favor seleccione al menos un documento', 'warning');
        return;
    }
    
    document.getElementById('cantidadSeleccionados').textContent = bandejaEntradaSeleccionados.length;
    
    const modal = new bootstrap.Modal(document.getElementById('modalMarcarLeido'));
    modal.show();
}

async function confirmarMarcarLeido() {
    const observaciones = document.getElementById('observacionesLectura').value.trim();
    
    try {
        const promises = bandejaEntradaSeleccionados.map(id => 
            marcarComoLeidoDocumento(id, false)
        );
        
        await Promise.all(promises);
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('modalMarcarLeido')).hide();
        
        bandejaEntradaSeleccionados = [];
        actualizarSeleccionBandejaEntrada();
        mostrarNotificacion(`${promises.length} documento(s) marcado(s) como leído`, 'success');
        
    } catch (error) {
        console.error('Error marcando documentos como leídos:', error);
        mostrarNotificacion('Error al marcar algunos documentos', 'error');
    }
}

function responderSeleccionados() {
    if (bandejaEntradaSeleccionados.length === 0) {
        mostrarNotificacion('Por favor seleccione al menos un documento', 'warning');
        return;
    }
    
    if (bandejaEntradaSeleccionados.length === 1) {
        responderDocumento(bandejaEntradaSeleccionados[0]);
    } else {
        mostrarNotificacion('Solo se puede responder un documento a la vez. Por favor seleccione un solo documento.', 'info');
    }
}

function archivarSeleccionados() {
    if (bandejaEntradaSeleccionados.length === 0) {
        mostrarNotificacion('Por favor seleccione al menos un documento', 'warning');
        return;
    }
    
    if (confirm(`¿Está seguro de que desea archivar ${bandejaEntradaSeleccionados.length} documento(s) seleccionado(s)?`)) {
        archivarDocumentosSeleccionados();
    }
}

async function archivarDocumentosSeleccionados() {
    try {
        const promises = bandejaEntradaSeleccionados.map(id => 
            archivarDocumentoConfirmado(id)
        );
        
        await Promise.all(promises);
        
        bandejaEntradaSeleccionados = [];
        actualizarSeleccionBandejaEntrada();
        mostrarNotificacion(`${promises.length} documento(s) archivado(s) correctamente`, 'success');
        
    } catch (error) {
        console.error('Error archivando documentos:', error);
        mostrarNotificacion('Error al archivar algunos documentos', 'error');
    }
}

// ==================== ENVÍO DE RESPUESTAS ====================
async function enviarRespuesta() {
    const form = document.getElementById('formResponderDocumento');
    const documentoId = parseInt(document.getElementById('modalResponderDocumento').dataset.documentoId);
    
    const datos = {
        titulo: document.getElementById('respuestaTitulo').value.trim(),
        tipo: document.getElementById('respuestaTipo').value,
        contenido: document.getElementById('respuestaContenido').value.trim(),
        prioridad: document.getElementById('respuestaPrioridad').value,
        destinatarios: Array.from(document.getElementById('respuestaDestinatarios').selectedOptions)
            .map(option => option.value),
        documentoOriginalId: documentoId
    };
    
    if (!datos.titulo || !datos.tipo || !datos.contenido) {
        mostrarNotificacion('Por favor complete todos los campos obligatorios', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/documentos/responder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            // Actualizar estado del documento original
            const documento = bandejaEntradaData.find(d => d.id === documentoId);
            if (documento) {
                documento.estado = 'Respondido';
                documento.historial.push({
                    fecha: new Date().toISOString(),
                    accion: 'Respondido',
                    usuario: 'Usuario Actual'
                });
            }
            
            // Cerrar modal y actualizar tabla
            bootstrap.Modal.getInstance(document.getElementById('modalResponderDocumento')).hide();
            aplicarFiltrosBandejaEntrada();
            mostrarNotificacion('Respuesta enviada correctamente', 'success');
            
            // Limpiar formulario
            form.reset();
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error enviando respuesta:', error);
        mostrarNotificacion('Error al enviar la respuesta', 'error');
    }
}

async function guardarBorradorRespuesta() {
    const form = document.getElementById('formResponderDocumento');
    const documentoId = parseInt(document.getElementById('modalResponderDocumento').dataset.documentoId);
    
    const datos = {
        titulo: document.getElementById('respuestaTitulo').value.trim(),
        tipo: document.getElementById('respuestaTipo').value,
        contenido: document.getElementById('respuestaContenido').value.trim(),
        prioridad: document.getElementById('respuestaPrioridad').value,
        destinatarios: Array.from(document.getElementById('respuestaDestinatarios').selectedOptions)
            .map(option => option.value),
        documentoOriginalId: documentoId,
        esBorrador: true
    };
    
    if (!datos.titulo) {
        mostrarNotificacion('El título es obligatorio para guardar como borrador', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/documentos/borradores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            mostrarNotificacion('Respuesta guardada como borrador', 'success');
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
        mostrarNotificacion('Error al guardar el borrador', 'error');
    }
}

// ==================== UTILIDADES ====================
function calcularTiempoTranscurrido(fechaRecepcion) {
    const ahora = new Date();
    const fecha = new Date(fechaRecepcion);
    const diferencia = ahora - fecha;
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
        return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
        return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
        return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
        return 'hace un momento';
    }
}

function obtenerClaseTiempo(tiempoTranscurrido, esVencido) {
    if (esVencido) return 'critico';
    if (tiempoTranscurrido.includes('día') && parseInt(tiempoTranscurrido) > 2) return 'advertencia';
    return '';
}

function configurarDragAndDrop() {
    const areaAnexos = document.getElementById('areaAnexosRespuesta');
    if (!areaAnexos) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        areaAnexos.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        areaAnexos.addEventListener(eventName, () => {
            areaAnexos.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        areaAnexos.addEventListener(eventName, () => {
            areaAnexos.classList.remove('dragover');
        }, false);
    });
    
    areaAnexos.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        handleFiles(files);
    }
    
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            console.log('Archivo adjuntado:', file.name);
            // Aquí implementar la lógica de manejo de archivos
        });
    }
}

function configurarEventListeners() {
    // Event listeners específicos para bandeja de entrada
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            actualizarListaBandejaEntrada();
        }
    });
}

function actualizarListaBandejaEntrada() {
    cargarDatosIniciales();
}

function iniciarActualizacionPeriodica() {
    // Actualizar cada 2 minutos (más frecuente que otros módulos)
    if (intervaloBandejaEntrada) {
        clearInterval(intervaloBandejaEntrada);
    }
    
    intervaloBandejaEntrada = setInterval(() => {
        cargarDatosIniciales();
    }, 120000);
}

// ==================== PAGINACIÓN ====================
function actualizarPaginacionBandejaEntrada() {
    const totalPaginas = Math.ceil(bandejaEntradaFiltrados.length / elementosPorPaginaBandejaEntrada);
    const paginacion = document.getElementById('paginacionBandejaEntrada');
    
    if (totalPaginas <= 1) {
        paginacion.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botón anterior
    html += `
        <li class="page-item ${paginaActualBandejaEntrada === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaBandejaEntrada(${paginaActualBandejaEntrada - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualBandejaEntrada - 2 && i <= paginaActualBandejaEntrada + 2)) {
            html += `
                <li class="page-item ${i === paginaActualBandejaEntrada ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPaginaBandejaEntrada(${i})">${i}</a>
                </li>
            `;
        } else if (i === paginaActualBandejaEntrada - 3 || i === paginaActualBandejaEntrada + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Botón siguiente
    html += `
        <li class="page-item ${paginaActualBandejaEntrada === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaBandejaEntrada(${paginaActualBandejaEntrada + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacion.innerHTML = html;
}

function cambiarPaginaBandejaEntrada(pagina) {
    const totalPaginas = Math.ceil(bandejaEntradaFiltrados.length / elementosPorPaginaBandejaEntrada);
    
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaActualBandejaEntrada = pagina;
        renderizarTablaBandejaEntrada();
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function mostrarCargando(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Cargando documentos...</p>
            </div>
        `;
    }
}

function mostrarError(containerId, mensaje) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-triangle text-danger" style="font-size: 4rem;"></i>
                <h5 class="mt-3 text-danger">Error</h5>
                <p class="text-muted">${mensaje}</p>
                <button class="btn btn-primary" onclick="cargarDatosIniciales()">
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    Reintentar
                </button>
            </div>
        `;
    }
}

function htmlEscape(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Implementar sistema de notificaciones
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`;
    // Crear toast notification si existe el sistema
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensaje, tipo);
    }
}

function descargarAnexo(documentoId, nombreAnexo) {
    mostrarNotificación(`Descargando anexo: ${nombreAnexo}`, 'info');
    // Implementar descarga de anexo
}

function descargarDocumento(id) {
    mostrarNotificación(`Descargando documento con ID: ${id}`, 'info');
    // Implementar descarga de documento
}

function descargarDocumentoCompleto() {
    const modal = document.getElementById('modalVerDocumentoCompleto');
    const id = modal.dataset.documentoId;
    descargarDocumento(id);
}

function responderDesdeVisor() {
    const modal = document.getElementById('modalVerDocumentoCompleto');
    const id = parseInt(modal.dataset.documentoId);
    
    // Cerrar modal del visor
    bootstrap.Modal.getInstance(modal).hide();
    
    // Abrir modal de respuesta
    setTimeout(() => {
        responderDocumento(id);
    }, 300);
}

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', function() {
    if (intervaloBandejaEntrada) {
        clearInterval(intervaloBandejaEntrada);
    }
});