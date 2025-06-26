/* ==================== ENVIADOS JS - OPTIMIZADO ==================== */
/* Sistema de Gestión Documental - Constructora Vial S.A. */
/* @version 3.0.0 (Optimizada y Modernizada) */

// ==================== VARIABLES GLOBALES ====================
let enviadosData = [];
let enviadosFiltrados = [];
let paginaActualEnviados = 1;
let elementosPorPaginaEnviados = 10;
let enviadosSeleccionados = [];
let intervaloEnviados = null;
let vistaActual = 'tabla'; // 'tabla' o 'cartas'

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    inicializarEnviados();
});

function inicializarEnviados() {
    console.log('🚀 Inicializando módulo Enviados...');
    
    cargarDatosIniciales();
    configurarEventListeners();
    iniciarActualizacionPeriodica();
    configurarVistaToggle();
    
    console.log('✅ Módulo Enviados inicializado correctamente');
}

// ==================== CARGA DE DATOS ====================
async function cargarDatosIniciales() {
    try {
        mostrarCargando('tablaEnviadosContainer');
        
        // Cargar datos en paralelo
        const [documentos, tipos, proyectos, destinatarios] = await Promise.all([
            cargarDocumentosEnviados(),
            cargarTiposDocumento(),
            cargarProyectos(),
            cargarDestinatarios()
        ]);
        
        enviadosData = documentos;
        enviadosFiltrados = [...enviadosData];
        
        poblarFiltros(tipos, proyectos, destinatarios);
        actualizarEstadisticas();
        renderizarDocumentosEnviados();
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        mostrarError('tablaEnviadosContainer', 'Error al cargar los documentos enviados');
    }
}

async function cargarDocumentosEnviados() {
    try {
        // Simulación de llamada a API - Reemplazar con llamada real
        const response = await fetch('/api/documentos/enviados', {
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
        return data.documentos || generarDatosPruebaEnviados();
        
    } catch (error) {
        console.warn('⚠️ Usando datos de prueba para enviados:', error.message);
        return generarDatosPruebaEnviados();
    }
}

function generarDatosPruebaEnviados() {
    return [
        {
            id: 1,
            codigo: 'DOC-2025-001',
            titulo: 'Informe Técnico de Pavimentación - Ruta 101',
            tipo: 'Informe Técnico',
            proyecto: 'Mejoramiento Ruta 101',
            estado: 'Recepcionado',
            prioridad: 'Alta',
            fechaEmision: '2025-01-20T10:30:00Z',
            fechaEnvio: '2025-01-20T14:45:00Z',
            fechaRecepcion: '2025-01-21T08:15:00Z',
            destinatario: 'Ministerio de Transportes',
            usuarioDestinatario: 'Ana García',
            descripcion: 'Informe técnico detallado sobre el estado del pavimento y recomendaciones para el mejoramiento de la Ruta 101.',
            progreso: 75,
            anexos: [
                { nombre: 'planos_pavimento.pdf', tamano: 2.5, tipo: 'PDF' },
                { nombre: 'especificaciones_tecnicas.docx', tamano: 1.2, tipo: 'Word' }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-20T10:30:00Z',
                    estado: 'Firmado',
                    descripcion: 'Documento firmado digitalmente',
                    usuario: 'Juan Pérez'
                },
                {
                    fecha: '2025-01-20T14:45:00Z',
                    estado: 'Emitido',
                    descripcion: 'Documento enviado al destinatario',
                    usuario: 'Sistema'
                },
                {
                    fecha: '2025-01-21T08:15:00Z',
                    estado: 'Recepcionado',
                    descripcion: 'Documento recibido por el destinatario',
                    usuario: 'Ana García'
                }
            ]
        },
        {
            id: 2,
            codigo: 'DOC-2025-002',
            titulo: 'Estudio de Impacto Ambiental - Puente Río Verde',
            tipo: 'Estudio Ambiental',
            proyecto: 'Construcción Puente Río Verde',
            estado: 'Emitido',
            prioridad: 'Urgente',
            fechaEmision: '2025-01-21T09:15:00Z',
            fechaEnvio: '2025-01-21T11:30:00Z',
            fechaRecepcion: null,
            destinatario: 'SERNANP',
            usuarioDestinatario: 'Carlos Mendoza',
            descripcion: 'Estudio completo de impacto ambiental para la construcción del nuevo puente sobre el Río Verde.',
            progreso: 50,
            anexos: [
                { nombre: 'estudio_fauna.pdf', tamano: 5.8, tipo: 'PDF' },
                { nombre: 'mapas_ambientales.dwg', tamano: 12.3, tipo: 'AutoCAD' }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-21T09:15:00Z',
                    estado: 'Firmado',
                    descripcion: 'Documento firmado digitalmente',
                    usuario: 'María González'
                },
                {
                    fecha: '2025-01-21T11:30:00Z',
                    estado: 'Emitido',
                    descripcion: 'Documento enviado al destinatario',
                    usuario: 'Sistema'
                }
            ]
        },
        {
            id: 3,
            codigo: 'DOC-2025-003',
            titulo: 'Memoria de Cálculo Estructural - Terminal Buses',
            tipo: 'Memoria de Cálculo',
            proyecto: 'Terminal de Buses Central',
            estado: 'Atendido',
            prioridad: 'Normal',
            fechaEmision: '2025-01-18T14:00:00Z',
            fechaEnvio: '2025-01-18T16:30:00Z',
            fechaRecepcion: '2025-01-19T09:45:00Z',
            fechaAtencion: '2025-01-20T15:20:00Z',
            destinatario: 'Dirección de Presupuesto',
            usuarioDestinatario: 'María Rodríguez',
            descripcion: 'Memoria de cálculo estructural completa para la nueva terminal de buses central.',
            progreso: 100,
            anexos: [
                { nombre: 'calculos_estructura.xlsx', tamano: 3.2, tipo: 'Excel' }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-18T14:00:00Z',
                    estado: 'Firmado',
                    descripcion: 'Documento firmado digitalmente',
                    usuario: 'Carlos Ruiz'
                },
                {
                    fecha: '2025-01-18T16:30:00Z',
                    estado: 'Emitido',
                    descripcion: 'Documento enviado al destinatario',
                    usuario: 'Sistema'
                },
                {
                    fecha: '2025-01-19T09:45:00Z',
                    estado: 'Recepcionado',
                    descripcion: 'Documento recibido por el destinatario',
                    usuario: 'María Rodríguez'
                },
                {
                    fecha: '2025-01-20T15:20:00Z',
                    estado: 'Atendido',
                    descripcion: 'Documento revisado y aprobado',
                    usuario: 'María Rodríguez'
                }
            ]
        },
        {
            id: 4,
            codigo: 'DOC-2025-004',
            titulo: 'Plan de Seguridad y Salud Ocupacional',
            tipo: 'Plan de Seguridad',
            proyecto: 'Mejoramiento Ruta 101',
            estado: 'Firmado',
            prioridad: 'Alta',
            fechaEmision: '2025-01-22T08:45:00Z',
            fechaEnvio: null,
            fechaRecepcion: null,
            destinatario: 'Pendiente de envío',
            usuarioDestinatario: null,
            descripcion: 'Plan integral de seguridad y salud ocupacional para las obras de mejoramiento.',
            progreso: 25,
            anexos: [
                { nombre: 'procedimientos_seguridad.pdf', tamano: 3.7, tipo: 'PDF' }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-22T08:45:00Z',
                    estado: 'Firmado',
                    descripcion: 'Documento firmado digitalmente',
                    usuario: 'Ana Martínez'
                }
            ]
        },
        {
            id: 5,
            codigo: 'DOC-2025-005',
            titulo: 'Especificaciones Técnicas Generales',
            tipo: 'Especificaciones',
            proyecto: 'Terminal de Buses Central',
            estado: 'Recepcionado',
            prioridad: 'Normal',
            fechaEmision: '2025-01-19T11:20:00Z',
            fechaEnvio: '2025-01-19T15:10:00Z',
            fechaRecepcion: '2025-01-20T10:30:00Z',
            destinatario: 'Contratista Principal',
            usuarioDestinatario: 'Luis Fernández',
            descripcion: 'Especificaciones técnicas detalladas para la construcción de la terminal.',
            progreso: 75,
            anexos: [
                { nombre: 'especif_arquitectura.docx', tamano: 2.1, tipo: 'Word' },
                { nombre: 'especif_estructura.docx', tamano: 1.8, tipo: 'Word' }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-19T11:20:00Z',
                    estado: 'Firmado',
                    descripcion: 'Documento firmado digitalmente',
                    usuario: 'Luis Torres'
                },
                {
                    fecha: '2025-01-19T15:10:00Z',
                    estado: 'Emitido',
                    descripcion: 'Documento enviado al destinatario',
                    usuario: 'Sistema'
                },
                {
                    fecha: '2025-01-20T10:30:00Z',
                    estado: 'Recepcionado',
                    descripcion: 'Documento recibido por el destinatario',
                    usuario: 'Luis Fernández'
                }
            ]
        }
    ];
}

async function cargarTiposDocumento() {
    try {
        return [
            'Informe Técnico',
            'Estudio Ambiental',
            'Memoria de Cálculo',
            'Plan de Seguridad',
            'Especificaciones',
            'Presupuesto',
            'Cronograma',
            'Planos'
        ];
    } catch (error) {
        console.error('Error cargando tipos de documento:', error);
        return [];
    }
}

async function cargarProyectos() {
    try {
        return [
            'Mejoramiento Ruta 101',
            'Construcción Puente Río Verde',
            'Terminal de Buses Central',
            'Ampliación Aeropuerto',
            'Túnel Cordillera Norte'
        ];
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        return [];
    }
}

async function cargarDestinatarios() {
    try {
        return [
            'Ministerio de Transportes',
            'SERNANP',
            'Dirección de Presupuesto',
            'Contratista Principal',
            'Empresa Supervisora',
            'OSINERGMIN',
            'Municipalidad Provincial'
        ];
    } catch (error) {
        console.error('Error cargando destinatarios:', error);
        return [];
    }
}

// ==================== RENDERIZADO ====================
function renderizarDocumentosEnviados() {
    if (vistaActual === 'tabla') {
        renderizarTablaEnviados();
    } else {
        renderizarCartasEnviados();
    }
}

function renderizarTablaEnviados() {
    const container = document.getElementById('tablaEnviadosContainer');
    
    if (enviadosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-send-check" style="font-size: 4rem; color: var(--gray-300);"></i>
                <h5 class="mt-3 text-muted">No hay documentos enviados</h5>
                <p class="text-muted">No hay documentos que coincidan con los filtros aplicados.</p>
                <button class="btn btn-primary" onclick="nuevoDocumento()">
                    <i class="bi bi-plus-lg me-2"></i>
                    Crear Nuevo Documento
                </button>
            </div>
        `;
        return;
    }
    
    const inicio = (paginaActualEnviados - 1) * elementosPorPaginaEnviados;
    const fin = inicio + elementosPorPaginaEnviados;
    const documentosPagina = enviadosFiltrados.slice(inicio, fin);
    
    const tabla = `
        <div class="table-responsive">
            <table class="table enviados-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="selectAllEnviados" 
                                       onchange="toggleSeleccionTodosEnviados()">
                            </div>
                        </th>
                        <th style="width: 120px;">Código</th>
                        <th>Título</th>
                        <th style="width: 150px;">Destinatario</th>
                        <th style="width: 100px;">Estado</th>
                        <th style="width: 100px;">Progreso</th>
                        <th style="width: 150px;">Fecha Envío</th>
                        <th style="width: 120px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${documentosPagina.map(doc => `
                        <tr data-id="${doc.id}">
                            <td>
                                <div class="form-check">
                                    <input class="form-check-input enviados-checkbox" type="checkbox" 
                                           value="${doc.id}" onchange="actualizarSeleccionEnviados()">
                                </div>
                            </td>
                            <td>
                                <span class="fw-bold text-success">${htmlEscape(doc.codigo)}</span>
                            </td>
                            <td>
                                <div>
                                    <span class="fw-medium">${htmlEscape(doc.titulo)}</span>
                                    ${doc.proyecto ? `<small class="d-block text-muted">Proyecto: ${htmlEscape(doc.proyecto)}</small>` : ''}
                                    <small class="tiempo-envio ${obtenerClaseTiempoEnvio(doc.fechaEnvio)}">${calcularTiempoEnvio(doc.fechaEnvio)}</small>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <span class="fw-medium">${htmlEscape(doc.destinatario)}</span>
                                    ${doc.usuarioDestinatario ? `<small class="d-block text-muted">${htmlEscape(doc.usuarioDestinatario)}</small>` : ''}
                                </div>
                            </td>
                            <td>
                                ${generarBadgeEstadoEnviados(doc.estado)}
                            </td>
                            <td>
                                <div class="progreso-seguimiento">
                                    <div class="progreso-barra" style="width: ${doc.progreso}%"></div>
                                </div>
                                <small class="progreso-texto">${doc.progreso}%</small>
                            </td>
                            <td>
                                <small class="text-muted">${formatearFecha(doc.fechaEnvio)}</small>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="verSeguimiento(${doc.id})" 
                                            title="Ver seguimiento">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-info" onclick="reenviarDocumento(${doc.id})" 
                                            title="Reenviar documento">
                                        <i class="bi bi-send"></i>
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="descargarDocumento(${doc.id})" 
                                            title="Descargar documento">
                                        <i class="bi bi-download"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tabla;
    actualizarPaginacionEnviados();
}

function renderizarCartasEnviados() {
    const container = document.getElementById('tablaEnviadosContainer');
    
    if (enviadosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-send-check" style="font-size: 4rem; color: var(--gray-300);"></i>
                <h5 class="mt-3 text-muted">No hay documentos enviados</h5>
                <p class="text-muted">No hay documentos que coincidan con los filtros aplicados.</p>
                <button class="btn btn-primary" onclick="nuevoDocumento()">
                    <i class="bi bi-plus-lg me-2"></i>
                    Crear Nuevo Documento
                </button>
            </div>
        `;
        return;
    }
    
    const inicio = (paginaActualEnviados - 1) * elementosPorPaginaEnviados;
    const fin = inicio + elementosPorPaginaEnviados;
    const documentosPagina = enviadosFiltrados.slice(inicio, fin);
    
    const cartas = `
        <div class="vista-cartas">
            ${documentosPagina.map(doc => `
                <div class="documento-carta" data-id="${doc.id}">
                    <div class="carta-header">
                        <div class="carta-codigo">${htmlEscape(doc.codigo)}</div>
                        ${generarBadgeEstadoEnviados(doc.estado)}
                    </div>
                    
                    <h6 class="carta-titulo">${htmlEscape(doc.titulo)}</h6>
                    
                    <div class="carta-metadata">
                        <div class="carta-metadata-item">
                            <div class="carta-metadata-label">Destinatario</div>
                            <div class="carta-metadata-value">${htmlEscape(doc.destinatario)}</div>
                        </div>
                        <div class="carta-metadata-item">
                            <div class="carta-metadata-label">Proyecto</div>
                            <div class="carta-metadata-value">${htmlEscape(doc.proyecto || 'Sin proyecto')}</div>
                        </div>
                        <div class="carta-metadata-item">
                            <div class="carta-metadata-label">Fecha Envío</div>
                            <div class="carta-metadata-value">${formatearFecha(doc.fechaEnvio)}</div>
                        </div>
                        <div class="carta-metadata-item">
                            <div class="carta-metadata-label">Progreso</div>
                            <div class="carta-metadata-value">${doc.progreso}%</div>
                        </div>
                    </div>
                    
                    <div class="progreso-seguimiento mb-3">
                        <div class="progreso-barra" style="width: ${doc.progreso}%"></div>
                    </div>
                    
                    ${doc.anexos && doc.anexos.length > 0 ? `
                        <div class="mb-3">
                            <small class="text-muted">
                                <i class="bi bi-paperclip me-1"></i>
                                ${doc.anexos.length} anexo(s)
                            </small>
                        </div>
                    ` : ''}
                    
                    <div class="carta-footer">
                        <small class="tiempo-envio ${obtenerClaseTiempoEnvio(doc.fechaEnvio)}">
                            ${calcularTiempoEnvio(doc.fechaEnvio)}
                        </small>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm" onclick="verSeguimiento(${doc.id})" 
                                    title="Ver seguimiento">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="reenviarDocumento(${doc.id})" 
                                    title="Reenviar">
                                <i class="bi bi-send"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="descargarDocumento(${doc.id})" 
                                    title="Descargar">
                                <i class="bi bi-download"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = cartas;
    actualizarPaginacionEnviados();
}

function generarBadgeEstadoEnviados(estado) {
    const badges = {
        'Firmado': 'badge-firmado',
        'Emitido': 'badge-emitido',
        'Recepcionado': 'badge-recepcionado',
        'Atendido': 'badge-atendido'
    };
    
    return `<span class="badge ${badges[estado] || 'badge-firmado'}">${htmlEscape(estado)}</span>`;
}

// ==================== FILTROS ====================
function poblarFiltros(tipos, proyectos, destinatarios) {
    // Poblar tipos
    const selectTipo = document.getElementById('filtroTipoEnviados');
    selectTipo.innerHTML = '<option value="">Todos los tipos</option>';
    tipos.forEach(tipo => {
        selectTipo.innerHTML += `<option value="${htmlEscape(tipo)}">${htmlEscape(tipo)}</option>`;
    });
    
    // Poblar proyectos
    const selectProyecto = document.getElementById('filtroProyectoEnviados');
    selectProyecto.innerHTML = '<option value="">Todos los proyectos</option>';
    proyectos.forEach(proyecto => {
        selectProyecto.innerHTML += `<option value="${htmlEscape(proyecto)}">${htmlEscape(proyecto)}</option>`;
    });
    
    // Poblar destinatarios
    const selectDestinatario = document.getElementById('filtroDestinatarioEnviados');
    selectDestinatario.innerHTML = '<option value="">Todos los destinatarios</option>';
    destinatarios.forEach(destinatario => {
        selectDestinatario.innerHTML += `<option value="${htmlEscape(destinatario)}">${htmlEscape(destinatario)}</option>`;
    });
    
    // Poblar destinatarios en modal de reenvío
    const selectNuevosDestinatarios = document.getElementById('nuevosDestinatarios');
    if (selectNuevosDestinatarios) {
        selectNuevosDestinatarios.innerHTML = '';
        destinatarios.forEach(destinatario => {
            selectNuevosDestinatarios.innerHTML += `<option value="${htmlEscape(destinatario)}">${htmlEscape(destinatario)}</option>`;
        });
    }
    
    // Poblar proyectos en modal de reporte
    const selectReporteProyecto = document.getElementById('reporteProyecto');
    if (selectReporteProyecto) {
        selectReporteProyecto.innerHTML = '<option value="">Todos los proyectos</option>';
        proyectos.forEach(proyecto => {
            selectReporteProyecto.innerHTML += `<option value="${htmlEscape(proyecto)}">${htmlEscape(proyecto)}</option>`;
        });
    }
}

function aplicarFiltrosEnviados() {
    const estado = document.getElementById('filtroEstadoEnviados').value;
    const tipo = document.getElementById('filtroTipoEnviados').value;
    const proyecto = document.getElementById('filtroProyectoEnviados').value;
    const destinatario = document.getElementById('filtroDestinatarioEnviados').value;
    const orden = document.getElementById('filtroOrdenEnviados').value;
    const busqueda = document.getElementById('filtroBusquedaEnviados').value.toLowerCase().trim();
    const fecha = document.getElementById('filtroFechaEnviados').value;
    
    // Aplicar filtros
    enviadosFiltrados = enviadosData.filter(doc => {
        const cumpleEstado = !estado || doc.estado === estado;
        const cumpleTipo = !tipo || doc.tipo === tipo;
        const cumpleProyecto = !proyecto || doc.proyecto === proyecto;
        const cumpleDestinatario = !destinatario || doc.destinatario === destinatario;
        const cumpleBusqueda = !busqueda || 
            doc.codigo.toLowerCase().includes(busqueda) ||
            doc.titulo.toLowerCase().includes(busqueda) ||
            doc.destinatario.toLowerCase().includes(busqueda) ||
            (doc.usuarioDestinatario && doc.usuarioDestinatario.toLowerCase().includes(busqueda));
        const cumpleFecha = !fecha || cumpleFiltroFecha(doc.fechaEnvio, fecha);
        
        return cumpleEstado && cumpleTipo && cumpleProyecto && cumpleDestinatario && cumpleBusqueda && cumpleFecha;
    });
    
    // Aplicar ordenamiento
    enviadosFiltrados.sort((a, b) => {
        switch (orden) {
            case 'fecha_envio':
                return new Date(b.fechaEnvio || 0) - new Date(a.fechaEnvio || 0);
            case 'fecha_emision':
                return new Date(b.fechaEmision) - new Date(a.fechaEmision);
            case 'estado':
                return a.estado.localeCompare(b.estado);
            case 'destinatario':
                return a.destinatario.localeCompare(b.destinatario);
            case 'codigo':
                return a.codigo.localeCompare(b.codigo);
            default:
                return new Date(b.fechaEnvio || 0) - new Date(a.fechaEnvio || 0);
        }
    });
    
    paginaActualEnviados = 1;
    renderizarDocumentosEnviados();
    actualizarEstadisticas();
}

function cumpleFiltroFecha(fechaDocumento, filtroFecha) {
    if (!fechaDocumento) return false;
    
    const fecha = new Date(fechaDocumento);
    const ahora = new Date();
    
    switch (filtroFecha) {
        case 'hoy':
            return fecha.toDateString() === ahora.toDateString();
        case 'semana':
            const inicioSemana = new Date(ahora);
            inicioSemana.setDate(ahora.getDate() - ahora.getDay());
            return fecha >= inicioSemana;
        case 'mes':
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        case 'trimestre':
            const trimestreActual = Math.floor(ahora.getMonth() / 3);
            const trimestreDocumento = Math.floor(fecha.getMonth() / 3);
            return trimestreDocumento === trimestreActual && fecha.getFullYear() === ahora.getFullYear();
        case 'año':
            return fecha.getFullYear() === ahora.getFullYear();
        default:
            return true;
    }
}

function limpiarFiltrosEnviados() {
    document.getElementById('filtroEstadoEnviados').value = '';
    document.getElementById('filtroTipoEnviados').value = '';
    document.getElementById('filtroProyectoEnviados').value = '';
    document.getElementById('filtroDestinatarioEnviados').value = '';
    document.getElementById('filtroOrdenEnviados').value = 'fecha_envio';
    document.getElementById('filtroBusquedaEnviados').value = '';
    document.getElementById('filtroFechaEnviados').value = '';
    
    aplicarFiltrosEnviados();
}

// ==================== ESTADÍSTICAS ====================
function actualizarEstadisticas() {
    const total = enviadosFiltrados.length;
    const pendientesRespuesta = enviadosFiltrados.filter(d => d.estado === 'Emitido').length;
    const recepcionados = enviadosFiltrados.filter(d => d.estado === 'Recepcionado' || d.estado === 'Atendido').length;
    const enviadosHoy = enviadosFiltrados.filter(d => 
        d.fechaEnvio && esMismaFecha(new Date(d.fechaEnvio), new Date())
    ).length;
    
    document.getElementById('totalEnviados').textContent = total;
    document.getElementById('pendientesRespuesta').textContent = pendientesRespuesta;
    document.getElementById('recepcionados').textContent = recepcionados;
    document.getElementById('enviadosHoy').textContent = enviadosHoy;
}

// ==================== ACCIONES PRINCIPALES ====================
function verSeguimiento(id) {
    const documento = enviadosData.find(d => d.id === id);
    if (!documento) {
        mostrarNotificacion('Documento no encontrado', 'error');
        return;
    }
    
    // Generar contenido del seguimiento
    const contenidoSeguimiento = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6 class="text-primary">Información del Documento</h6>
                <table class="table table-sm">
                    <tr><th>Código:</th><td>${htmlEscape(documento.codigo)}</td></tr>
                    <tr><th>Título:</th><td>${htmlEscape(documento.titulo)}</td></tr>
                    <tr><th>Destinatario:</th><td>${htmlEscape(documento.destinatario)}</td></tr>
                    <tr><th>Estado Actual:</th><td>${generarBadgeEstadoEnviados(documento.estado)}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary">Progreso General</h6>
                <div class="progreso-seguimiento mb-2">
                    <div class="progreso-barra" style="width: ${documento.progreso}%"></div>
                </div>
                <div class="progreso-texto">${documento.progreso}% completado</div>
                
                ${documento.fechaRecepcion ? `
                    <div class="mt-3">
                        <small class="text-success">
                            <i class="bi bi-check-circle me-1"></i>
                            Recepcionado el ${formatearFecha(documento.fechaRecepcion)}
                        </small>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="timeline-seguimiento">
            <h6 class="text-primary mb-3">Historial de Estados</h6>
            ${documento.seguimiento.map(item => `
                <div class="timeline-item ${item.estado === documento.estado ? 'completado' : 'completado'}">
                    <div class="timeline-fecha">${formatearFecha(item.fecha)}</div>
                    <div class="timeline-titulo">${item.estado}</div>
                    <div class="timeline-descripcion">${htmlEscape(item.descripcion)}</div>
                    ${item.usuario ? `<small class="text-muted">Por: ${htmlEscape(item.usuario)}</small>` : ''}
                </div>
            `).join('')}
        </div>
        
        ${documento.anexos && documento.anexos.length > 0 ? `
            <div class="mt-4">
                <h6 class="text-primary">Anexos del Documento</h6>
                <div class="row">
                    ${documento.anexos.map(anexo => `
                        <div class="col-md-6 col-lg-4 mb-2">
                            <div class="anexo-item">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-file-earmark me-2 text-success"></i>
                                    <div class="flex-grow-1">
                                        <strong class="d-block">${htmlEscape(anexo.nombre)}</strong>
                                        <small class="text-muted">${anexo.tamano} MB • ${anexo.tipo}</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-primary ms-2" 
                                            onclick="descargarAnexo(${documento.id}, '${anexo.nombre}')" 
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
    `;
    
    document.getElementById('contenidoSeguimiento').innerHTML = contenidoSeguimiento;
    document.getElementById('modalSeguimientoDocumento').dataset.documentoId = id;
    
    const modal = new bootstrap.Modal(document.getElementById('modalSeguimientoDocumento'));
    modal.show();
}

function reenviarDocumento(id) {
    const documento = enviadosData.find(d => d.id === id);
    if (!documento) {
        mostrarNotificacion('Documento no encontrado', 'error');
        return;
    }
    
    // Llenar información del documento
    document.getElementById('infoDocumentoReenvio').innerHTML = `
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-1"><strong>Código:</strong> ${htmlEscape(documento.codigo)}</p>
                    <p class="mb-1"><strong>Título:</strong> ${htmlEscape(documento.titulo)}</p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Estado:</strong> ${generarBadgeEstadoEnviados(documento.estado)}</p>
                    <p class="mb-0"><strong>Destinatario Actual:</strong> ${htmlEscape(documento.destinatario)}</p>
                </div>
            </div>
        </div>
    `;
    
    // Guardar ID para el reenvío
    document.getElementById('modalReenviarDocumento').dataset.documentoId = id;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalReenviarDocumento'));
    modal.show();
}

async function confirmarReenvio() {
    const modal = document.getElementById('modalReenviarDocumento');
    const id = parseInt(modal.dataset.documentoId);
    
    const datos = {
        destinatarios: Array.from(document.getElementById('nuevosDestinatarios').selectedOptions)
            .map(option => option.value),
        motivo: document.getElementById('motivoReenvio').value.trim(),
        prioridad: document.getElementById('prioridadReenvio').value,
        notificar: document.getElementById('notificarReenvio').checked
    };
    
    if (datos.destinatarios.length === 0) {
        mostrarNotificacion('Por favor seleccione al menos un destinatario', 'warning');
        return;
    }
    
    if (!datos.motivo) {
        mostrarNotificacion('El motivo del reenvío es obligatorio', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/documentos/enviados/${id}/reenviar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            // Cerrar modal
            bootstrap.Modal.getInstance(modal).hide();
            
            // Limpiar formulario
            document.getElementById('formReenviarDocumento').reset();
            
            mostrarNotificacion('Documento reenviado correctamente', 'success');
            
            // Actualizar datos
            actualizarListaEnviados();
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error reenviando documento:', error);
        mostrarNotificacion('Error al reenviar el documento', 'error');
    }
}

function descargarDocumento(id) {
    mostrarNotificacion(`Descargando documento con ID: ${id}`, 'info');
    // Implementar descarga de documento
}

function descargarAnexo(documentoId, nombreAnexo) {
    mostrarNotificacion(`Descargando anexo: ${nombreAnexo}`, 'info');
    // Implementar descarga de anexo
}

// ==================== SELECCIÓN MASIVA ====================
function seleccionarTodosEnviados() {
    const checkboxPrincipal = document.getElementById('selectAllEnviados');
    const checkboxes = document.querySelectorAll('.enviados-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = checkboxPrincipal.checked;
    });
    
    actualizarSeleccionEnviados();
}

function toggleSeleccionTodosEnviados() {
    seleccionarTodosEnviados();
}

function actualizarSeleccionEnviados() {
    const checkboxes = document.querySelectorAll('.enviados-checkbox:checked');
    enviadosSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Actualizar checkbox principal
    const checkboxPrincipal = document.getElementById('selectAllEnviados');
    const totalCheckboxes = document.querySelectorAll('.enviados-checkbox').length;
    
    if (enviadosSeleccionados.length === 0) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = false;
    } else if (enviadosSeleccionados.length === totalCheckboxes) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = true;
    } else {
        checkboxPrincipal.indeterminate = true;
    }
}

// ==================== VISTAS ====================
function configurarVistaToggle() {
    // Configurar botones de vista
    const btnTabla = document.getElementById('btnVistaTabla');
    const btnCartas = document.getElementById('btnVistaCartas');
    
    if (btnTabla && btnCartas) {
        btnTabla.classList.add('active');
        btnCartas.classList.remove('active');
    }
}

function cambiarVistaTabla() {
    vistaActual = 'tabla';
    
    const btnTabla = document.getElementById('btnVistaTabla');
    const btnCartas = document.getElementById('btnVistaCartas');
    
    btnTabla.classList.add('active');
    btnCartas.classList.remove('active');
    
    renderizarDocumentosEnviados();
}

function cambiarVistaCartas() {
    vistaActual = 'cartas';
    
    const btnTabla = document.getElementById('btnVistaTabla');
    const btnCartas = document.getElementById('btnVistaCartas');
    
    btnTabla.classList.remove('active');
    btnCartas.classList.add('active');
    
    renderizarDocumentosEnviados();
}

// ==================== REPORTES ====================
function generarReporte() {
    // Configurar fechas por defecto
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    document.getElementById('reporteFechaInicio').value = inicioMes.toISOString().split('T')[0];
    document.getElementById('reporteFechaFin').value = hoy.toISOString().split('T')[0];
    
    const modal = new bootstrap.Modal(document.getElementById('modalGenerarReporte'));
    modal.show();
}

async function procesarReporte() {
    const datos = {
        fechaInicio: document.getElementById('reporteFechaInicio').value,
        fechaFin: document.getElementById('reporteFechaFin').value,
        tipo: document.getElementById('reporteTipo').value,
        proyecto: document.getElementById('reporteProyecto').value,
        estado: document.getElementById('reporteEstado').value,
        formato: document.getElementById('reporteFormato').value
    };
    
    if (!datos.fechaInicio || !datos.fechaFin || !datos.tipo || !datos.formato) {
        mostrarNotificacion('Por favor complete todos los campos obligatorios', 'warning');
        return;
    }
    
    try {
        mostrarNotificacion('Generando reporte...', 'info');
        
        const response = await fetch('/api/reportes/enviados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            // Simular descarga de reporte
            mostrarNotificacion('Reporte generado correctamente', 'success');
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalGenerarReporte')).hide();
            
            // Limpiar formulario
            document.getElementById('formGenerarReporte').reset();
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        mostrarNotificacion('Error al generar el reporte', 'error');
    }
}

function exportarDatos() {
    mostrarNotificacion('Preparando exportación de datos...', 'info');
    // Implementar exportación de datos
}

// ==================== UTILIDADES ====================
function calcularTiempoEnvio(fechaEnvio) {
    if (!fechaEnvio) return 'No enviado';
    
    const ahora = new Date();
    const fecha = new Date(fechaEnvio);
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

function obtenerClaseTiempoEnvio(fechaEnvio) {
    if (!fechaEnvio) return '';
    
    const ahora = new Date();
    const fecha = new Date(fechaEnvio);
    const diferencia = ahora - fecha;
    const horas = Math.floor(diferencia / 3600000);
    
    if (horas <= 24) return 'reciente';
    if (horas <= 168) return ''; // 1 semana
    return 'antiguo';
}

function esMismaFecha(fecha1, fecha2) {
    return fecha1.toDateString() === fecha2.toDateString();
}

function actualizarSeguimiento() {
    const modal = document.getElementById('modalSeguimientoDocumento');
    const id = parseInt(modal.dataset.documentoId);
    
    // Recargar datos del documento específico
    mostrarNotificacion('Actualizando estado del documento...', 'info');
    
    // Simular actualización
    setTimeout(() => {
        mostrarNotificacion('Estado actualizado', 'success');
        verSeguimiento(id); // Recargar el modal
    }, 1000);
}

function nuevoDocumento() {
    mostrarNotificacion('Abriendo editor de documentos...', 'info');
    setTimeout(() => {
        window.location.href = 'emitir-documento.jsp';
    }, 500);
}

function configurarEventListeners() {
    // Event listeners específicos para enviados
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            actualizarListaEnviados();
        }
    });
}

function actualizarListaEnviados() {
    cargarDatosIniciales();
}

function iniciarActualizacionPeriodica() {
    // Actualizar cada 5 minutos
    if (intervaloEnviados) {
        clearInterval(intervaloEnviados);
    }
    
    intervaloEnviados = setInterval(() => {
        cargarDatosIniciales();
    }, 300000);
}

// ==================== PAGINACIÓN ====================
function actualizarPaginacionEnviados() {
    const totalPaginas = Math.ceil(enviadosFiltrados.length / elementosPorPaginaEnviados);
    const paginacion = document.getElementById('paginacionEnviados');
    
    if (totalPaginas <= 1) {
        paginacion.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botón anterior
    html += `
        <li class="page-item ${paginaActualEnviados === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaEnviados(${paginaActualEnviados - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualEnviados - 2 && i <= paginaActualEnviados + 2)) {
            html += `
                <li class="page-item ${i === paginaActualEnviados ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPaginaEnviados(${i})">${i}</a>
                </li>
            `;
        } else if (i === paginaActualEnviados - 3 || i === paginaActualEnviados + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Botón siguiente
    html += `
        <li class="page-item ${paginaActualEnviados === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaEnviados(${paginaActualEnviados + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacion.innerHTML = html;
}

function cambiarPaginaEnviados(pagina) {
    const totalPaginas = Math.ceil(enviadosFiltrados.length / elementosPorPaginaEnviados);
    
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaActualEnviados = pagina;
        renderizarDocumentosEnviados();
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function mostrarCargando(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Cargando documentos enviados...</p>
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
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    
    // Crear toast notification si existe el sistema
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensaje, tipo);
    }
}

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', function() {
    if (intervaloEnviados) {
        clearInterval(intervaloEnviados);
    }
});