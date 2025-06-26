/* ==================== DOCUMENTOS EXTERNOS JS - OPTIMIZADO ==================== */
/* Sistema de Gestión Documental - Constructora Vial S.A. */
/* @version 3.0.0 (Optimizada y Modernizada) */

// ==================== VARIABLES GLOBALES ====================
let externosData = [];
let externosFiltrados = [];
let paginaActualExternos = 1;
let elementosPorPaginaExternos = 10;
let externosSeleccionados = [];
let intervaloExternos = null;
let archivosSeleccionados = [];
let documentoActualEdicion = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    inicializarDocumentosExternos();
});

function inicializarDocumentosExternos() {
    console.log('🚀 Inicializando módulo Documentos Externos...');
    
    cargarDatosIniciales();
    configurarEventListeners();
    iniciarActualizacionPeriodica();
    configurarDragAndDrop();
    configurarFechasPorDefecto();
    
    console.log('✅ Módulo Documentos Externos inicializado correctamente');
}

// ==================== CARGA DE DATOS ====================
async function cargarDatosIniciales() {
    try {
        mostrarCargando('tablaExternosContainer');
        
        // Cargar datos en paralelo
        const [documentos, entidades, tipos, responsables] = await Promise.all([
            cargarDocumentosExternos(),
            cargarEntidades(),
            cargarTiposDocumento(),
            cargarResponsables()
        ]);
        
        externosData = documentos;
        externosFiltrados = [...externosData];
        
        poblarFiltros(entidades, tipos, responsables);
        actualizarEstadisticas();
        renderizarTablaExternos();
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        mostrarError('tablaExternosContainer', 'Error al cargar los documentos externos');
    }
}

async function cargarDocumentosExternos() {
    try {
        // Simulación de llamada a API - Reemplazar con llamada real
        const response = await fetch('/api/documentos/externos', {
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
        return data.documentos || generarDatosPruebaExternos();
        
    } catch (error) {
        console.warn('⚠️ Usando datos de prueba para documentos externos:', error.message);
        return generarDatosPruebaExternos();
    }
}

function generarDatosPruebaExternos() {
    return [
        {
            id: 1,
            numero: 'MTPE-2025-0145',
            asunto: 'Nuevas normativas de seguridad vial para obras públicas',
            entidadEmisora: 'Ministerio de Transportes',
            contacto: 'Ana García - Directora Técnica',
            estado: 'Registrado',
            categoria: 'Normativo',
            tipo: 'Directiva',
            prioridad: 'Alta',
            fechaEmision: '2025-01-20T00:00:00Z',
            fechaRecepcion: '2025-01-22T09:30:00Z',
            fechaVencimiento: '2025-02-20T23:59:59Z',
            responsable: 'Juan Pérez',
            descripcion: 'Actualización de normativas de seguridad vial que deben implementarse en todas las obras públicas de construcción vial.',
            observaciones: 'Documento de alta prioridad que requiere implementación inmediata',
            archivos: [
                {
                    nombre: 'directiva_seguridad_vial_2025.pdf',
                    tamano: 2.5,
                    tipo: 'PDF',
                    fechaSubida: '2025-01-22T09:30:00Z'
                },
                {
                    nombre: 'anexo_especificaciones_tecnicas.docx',
                    tamano: 1.8,
                    tipo: 'Word',
                    fechaSubida: '2025-01-22T09:30:00Z'
                }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-22T09:30:00Z',
                    accion: 'Documento registrado',
                    usuario: 'Sistema',
                    descripcion: 'Documento registrado automáticamente en el sistema'
                }
            ]
        },
        {
            id: 2,
            numero: 'SERNANP-2025-0078',
            asunto: 'Evaluación de impacto ambiental - Puente Río Verde',
            entidadEmisora: 'SERNANP',
            contacto: 'Carlos Mendoza - Especialista Ambiental',
            estado: 'En Revisión',
            categoria: 'Técnico',
            tipo: 'Evaluación',
            prioridad: 'Urgente',
            fechaEmision: '2025-01-19T00:00:00Z',
            fechaRecepcion: '2025-01-21T14:15:00Z',
            fechaVencimiento: '2025-01-25T23:59:59Z',
            responsable: 'María González',
            descripcion: 'Evaluación oficial del estudio de impacto ambiental presentado para la construcción del puente sobre el Río Verde.',
            observaciones: 'Requiere respuesta urgente. Proyecto en espera de aprobación.',
            archivos: [
                {
                    nombre: 'evaluacion_impacto_ambiental.pdf',
                    tamano: 8.2,
                    tipo: 'PDF',
                    fechaSubida: '2025-01-21T14:15:00Z'
                },
                {
                    nombre: 'observaciones_tecnicas.xlsx',
                    tamano: 1.2,
                    tipo: 'Excel',
                    fechaSubida: '2025-01-21T14:15:00Z'
                }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-21T14:15:00Z',
                    accion: 'Documento registrado',
                    usuario: 'Sistema',
                    descripcion: 'Documento registrado automáticamente'
                },
                {
                    fecha: '2025-01-21T16:30:00Z',
                    accion: 'Asignado para revisión',
                    usuario: 'Juan Pérez',
                    descripcion: 'Documento asignado a María González para revisión técnica'
                }
            ]
        },
        {
            id: 3,
            numero: 'MUN-PROV-2025-0234',
            asunto: 'Solicitud de coordenadas para obra vial Ruta 101',
            entidadEmisora: 'Municipalidad Provincial',
            contacto: 'Roberto Silva - Gerente de Obras',
            estado: 'Procesado',
            categoria: 'Administrativo',
            tipo: 'Solicitud',
            prioridad: 'Normal',
            fechaEmision: '2025-01-15T00:00:00Z',
            fechaRecepcion: '2025-01-16T10:45:00Z',
            fechaVencimiento: '2025-01-30T23:59:59Z',
            responsable: 'Carlos Ruiz',
            descripcion: 'Solicitud formal de coordenadas técnicas y especificaciones para la obra de mejoramiento de la Ruta 101.',
            observaciones: 'Documento procesado y respondido satisfactoriamente',
            archivos: [
                {
                    nombre: 'solicitud_coordenadas.pdf',
                    tamano: 1.5,
                    tipo: 'PDF',
                    fechaSubida: '2025-01-16T10:45:00Z'
                }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-16T10:45:00Z',
                    accion: 'Documento registrado',
                    usuario: 'Sistema'
                },
                {
                    fecha: '2025-01-17T09:20:00Z',
                    accion: 'En revisión',
                    usuario: 'Carlos Ruiz'
                },
                {
                    fecha: '2025-01-18T15:30:00Z',
                    accion: 'Procesado',
                    usuario: 'Carlos Ruiz',
                    descripcion: 'Información proporcionada y respuesta enviada'
                }
            ]
        },
        {
            id: 4,
            numero: 'OSINERGMIN-2025-0089',
            asunto: 'Inspección de cumplimiento normativo - Terminal Buses',
            entidadEmisora: 'OSINERGMIN',
            contacto: 'Patricia López - Inspectora Senior',
            estado: 'Registrado',
            categoria: 'Legal',
            tipo: 'Inspección',
            prioridad: 'Alta',
            fechaEmision: '2025-01-21T00:00:00Z',
            fechaRecepcion: '2025-01-22T11:20:00Z',
            fechaVencimiento: '2025-02-05T23:59:59Z',
            responsable: 'Ana Martínez',
            descripcion: 'Notificación de inspección programada para verificar cumplimiento de normativas en el proyecto Terminal de Buses Central.',
            observaciones: 'Programar reunión de coordinación',
            archivos: [
                {
                    nombre: 'notificacion_inspeccion.pdf',
                    tamano: 1.8,
                    tipo: 'PDF',
                    fechaSubida: '2025-01-22T11:20:00Z'
                },
                {
                    nombre: 'lista_verificacion.xlsx',
                    tamano: 0.9,
                    tipo: 'Excel',
                    fechaSubida: '2025-01-22T11:20:00Z'
                }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-22T11:20:00Z',
                    accion: 'Documento registrado',
                    usuario: 'Sistema'
                }
            ]
        },
        {
            id: 5,
            numero: 'CENEPRED-2025-0056',
            asunto: 'Evaluación de riesgo sísmico - Infraestructura vial',
            entidadEmisora: 'CENEPRED',
            contacto: 'Miguel Torres - Especialista en Riesgos',
            estado: 'Archivado',
            categoria: 'Técnico',
            tipo: 'Evaluación',
            prioridad: 'Normal',
            fechaEmision: '2025-01-10T00:00:00Z',
            fechaRecepcion: '2025-01-12T08:30:00Z',
            fechaVencimiento: '2025-01-26T23:59:59Z',
            responsable: 'Luis Torres',
            descripcion: 'Evaluación técnica de riesgo sísmico para infraestructura vial en zona de alta actividad sísmica.',
            observaciones: 'Documento archivado después de implementar recomendaciones',
            archivos: [
                {
                    nombre: 'evaluacion_riesgo_sismico.pdf',
                    tamano: 5.4,
                    tipo: 'PDF',
                    fechaSubida: '2025-01-12T08:30:00Z'
                }
            ],
            seguimiento: [
                {
                    fecha: '2025-01-12T08:30:00Z',
                    accion: 'Documento registrado',
                    usuario: 'Sistema'
                },
                {
                    fecha: '2025-01-13T14:20:00Z',
                    accion: 'En revisión',
                    usuario: 'Luis Torres'
                },
                {
                    fecha: '2025-01-15T16:45:00Z',
                    accion: 'Procesado',
                    usuario: 'Luis Torres'
                },
                {
                    fecha: '2025-01-20T10:15:00Z',
                    accion: 'Archivado',
                    usuario: 'Luis Torres',
                    descripcion: 'Recomendaciones implementadas satisfactoriamente'
                }
            ]
        }
    ];
}

async function cargarEntidades() {
    try {
        return [
            'Ministerio de Transportes',
            'SERNANP',
            'Municipalidad Provincial',
            'OSINERGMIN',
            'CENEPRED',
            'Dirección de Presupuesto',
            'Contraloría General',
            'INDECOPI',
            'SUNASS',
            'Ministerio del Ambiente'
        ];
    } catch (error) {
        console.error('Error cargando entidades:', error);
        return [];
    }
}

async function cargarTiposDocumento() {
    try {
        return [
            'Directiva',
            'Evaluación',
            'Solicitud',
            'Inspección',
            'Resolución',
            'Oficio',
            'Informe',
            'Notificación',
            'Requerimiento',
            'Consulta'
        ];
    } catch (error) {
        console.error('Error cargando tipos de documento:', error);
        return [];
    }
}

async function cargarResponsables() {
    try {
        return [
            'Juan Pérez - Gerente de Proyectos',
            'María González - Ingeniera Ambiental',
            'Carlos Ruiz - Ingeniero Estructural',
            'Ana Martínez - Especialista en Seguridad',
            'Luis Torres - Arquitecto Principal',
            'Patricia Vega - Coordinadora Legal',
            'Roberto Miranda - Supervisor Técnico'
        ];
    } catch (error) {
        console.error('Error cargando responsables:', error);
        return [];
    }
}

// ==================== RENDERIZADO ====================
function renderizarTablaExternos() {
    const container = document.getElementById('tablaExternosContainer');
    
    if (externosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cloud-arrow-down" style="font-size: 4rem; color: var(--gray-300);"></i>
                <h5 class="mt-3 text-muted">No hay documentos externos</h5>
                <p class="text-muted">No hay documentos que coincidan con los filtros aplicados.</p>
                <button class="btn btn-primary" onclick="registrarDocumentoExterno()">
                    <i class="bi bi-plus-lg me-2"></i>
                    Registrar Documento Externo
                </button>
            </div>
        `;
        return;
    }
    
    const inicio = (paginaActualExternos - 1) * elementosPorPaginaExternos;
    const fin = inicio + elementosPorPaginaExternos;
    const documentosPagina = externosFiltrados.slice(inicio, fin);
    
    const tabla = `
        <div class="table-responsive">
            <table class="table externos-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="selectAllExternos" 
                                       onchange="toggleSeleccionTodosExternos()">
                            </div>
                        </th>
                        <th style="width: 120px;">Número</th>
                        <th>Asunto</th>
                        <th style="width: 150px;">Entidad Emisora</th>
                        <th style="width: 100px;">Estado</th>
                        <th style="width: 100px;">Categoría</th>
                        <th style="width: 150px;">Fecha Recepción</th>
                        <th style="width: 120px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${documentosPagina.map(doc => generarFilaDocumentoExterno(doc)).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tabla;
    actualizarPaginacionExternos();
}

function generarFilaDocumentoExterno(doc) {
    const esVencido = new Date() > new Date(doc.fechaVencimiento);
    const esUrgente = doc.prioridad === 'Urgente';
    
    let clasesFila = [];
    if (esUrgente) clasesFila.push('urgente');
    if (esVencido && doc.estado !== 'Procesado' && doc.estado !== 'Archivado') clasesFila.push('vencido');
    
    return `
        <tr class="${clasesFila.join(' ')}" data-id="${doc.id}">
            <td>
                <div class="form-check">
                    <input class="form-check-input externos-checkbox" type="checkbox" 
                           value="${doc.id}" onchange="actualizarSeleccionExternos()">
                </div>
            </td>
            <td>
                <span class="fw-bold text-violet">${htmlEscape(doc.numero)}</span>
                ${esUrgente ? '<i class="bi bi-exclamation-triangle text-danger ms-1" title="Urgente"></i>' : ''}
            </td>
            <td>
                <div>
                    <span class="fw-medium">${htmlEscape(doc.asunto)}</span>
                    ${doc.descripcion ? `<small class="d-block text-muted">${htmlEscape(doc.descripcion.substring(0, 60))}${doc.descripcion.length > 60 ? '...' : ''}</small>` : ''}
                    ${esVencido && doc.estado !== 'Procesado' && doc.estado !== 'Archivado' ? 
                        '<small class="d-block text-danger"><i class="bi bi-clock"></i> Vencido</small>' : ''}
                </div>
            </td>
            <td>
                <div>
                    <span class="fw-medium">${htmlEscape(doc.entidadEmisora)}</span>
                    ${doc.contacto ? `<small class="d-block text-muted">${htmlEscape(doc.contacto.split(' - ')[0])}</small>` : ''}
                </div>
            </td>
            <td>
                ${generarBadgeEstadoExternos(doc.estado)}
            </td>
            <td>
                ${generarBadgeCategoria(doc.categoria)}
            </td>
            <td>
                <small class="text-muted">${formatearFecha(doc.fechaRecepcion)}</small>
                ${doc.responsable ? `<small class="d-block text-muted">Resp: ${htmlEscape(doc.responsable.split(' - ')[0])}</small>` : ''}
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="verDetallesExterno(${doc.id})" 
                            title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="procesarDocumentoExterno(${doc.id})" 
                            title="Procesar documento">
                        <i class="bi bi-gear"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="descargarArchivosExterno(${doc.id})" 
                            title="Descargar archivos">
                        <i class="bi bi-download"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function generarBadgeEstadoExternos(estado) {
    const badges = {
        'Registrado': 'badge-registrado',
        'En Revisión': 'badge-revision',
        'Procesado': 'badge-procesado',
        'Archivado': 'badge-archivado'
    };
    
    return `<span class="badge ${badges[estado] || 'badge-registrado'}">${htmlEscape(estado)}</span>`;
}

function generarBadgeCategoria(categoria) {
    const badges = {
        'Normativo': 'badge-normativo',
        'Técnico': 'badge-tecnico',
        'Administrativo': 'badge-administrativo',
        'Legal': 'badge-legal',
        'Financiero': 'badge-financiero'
    };
    
    return `<span class="badge ${badges[categoria] || 'badge-administrativo'}">${htmlEscape(categoria)}</span>`;
}

// ==================== FILTROS ====================
function poblarFiltros(entidades, tipos, responsables) {
    // Poblar entidades
    const selectEntidad = document.getElementById('filtroEntidadExternos');
    selectEntidad.innerHTML = '<option value="">Todas las entidades</option>';
    entidades.forEach(entidad => {
        selectEntidad.innerHTML += `<option value="${htmlEscape(entidad)}">${htmlEscape(entidad)}</option>`;
    });
    
    // Poblar tipos
    const selectTipo = document.getElementById('filtroTipoExternos');
    selectTipo.innerHTML = '<option value="">Todos los tipos</option>';
    tipos.forEach(tipo => {
        selectTipo.innerHTML += `<option value="${htmlEscape(tipo)}">${htmlEscape(tipo)}</option>`;
    });
    
    // Poblar entidades en modal de registro
    const selectEntidadModal = document.getElementById('entidadEmisora');
    if (selectEntidadModal) {
        selectEntidadModal.innerHTML = '<option value="">Seleccione una entidad...</option>';
        entidades.forEach(entidad => {
            selectEntidadModal.innerHTML += `<option value="${htmlEscape(entidad)}">${htmlEscape(entidad)}</option>`;
        });
    }
    
    // Poblar tipos en modal de registro
    const selectTipoModal = document.getElementById('tipoDocumentoExt');
    if (selectTipoModal) {
        selectTipoModal.innerHTML = '<option value="">Seleccione un tipo...</option>';
        tipos.forEach(tipo => {
            selectTipoModal.innerHTML += `<option value="${htmlEscape(tipo)}">${htmlEscape(tipo)}</option>`;
        });
    }
    
    // Poblar responsables en modal de registro
    const selectResponsable = document.getElementById('responsableDoc');
    if (selectResponsable) {
        selectResponsable.innerHTML = '<option value="">Asignar responsable...</option>';
        responsables.forEach(responsable => {
            selectResponsable.innerHTML += `<option value="${htmlEscape(responsable)}">${htmlEscape(responsable)}</option>`;
        });
    }
}

function aplicarFiltrosExternos() {
    const estado = document.getElementById('filtroEstadoExternos').value;
    const entidad = document.getElementById('filtroEntidadExternos').value;
    const tipo = document.getElementById('filtroTipoExternos').value;
    const categoria = document.getElementById('filtroCategoriaExternos').value;
    const orden = document.getElementById('filtroOrdenExternos').value;
    const busqueda = document.getElementById('filtroBusquedaExternos').value.toLowerCase().trim();
    const fecha = document.getElementById('filtroFechaExternos').value;
    
    // Aplicar filtros
    externosFiltrados = externosData.filter(doc => {
        const cumpleEstado = !estado || doc.estado === estado;
        const cumpleEntidad = !entidad || doc.entidadEmisora === entidad;
        const cumpleTipo = !tipo || doc.tipo === tipo;
        const cumpleCategoria = !categoria || doc.categoria === categoria;
        const cumpleBusqueda = !busqueda || 
            doc.numero.toLowerCase().includes(busqueda) ||
            doc.asunto.toLowerCase().includes(busqueda) ||
            doc.entidadEmisora.toLowerCase().includes(busqueda) ||
            (doc.descripcion && doc.descripcion.toLowerCase().includes(busqueda));
        const cumpleFecha = !fecha || cumpleFiltroFecha(doc.fechaRecepcion, fecha);
        
        return cumpleEstado && cumpleEntidad && cumpleTipo && cumpleCategoria && cumpleBusqueda && cumpleFecha;
    });
    
    // Aplicar ordenamiento
    externosFiltrados.sort((a, b) => {
        switch (orden) {
            case 'fecha_recepcion':
                return new Date(b.fechaRecepcion) - new Date(a.fechaRecepcion);
            case 'fecha_emision':
                return new Date(b.fechaEmision) - new Date(a.fechaEmision);
            case 'entidad':
                return a.entidadEmisora.localeCompare(b.entidadEmisora);
            case 'numero':
                return a.numero.localeCompare(b.numero);
            default:
                return new Date(b.fechaRecepcion) - new Date(a.fechaRecepcion);
        }
    });
    
    paginaActualExternos = 1;
    renderizarTablaExternos();
    actualizarEstadisticas();
}

function cumpleFiltroFecha(fechaDocumento, filtroFecha) {
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
        default:
            return true;
    }
}

function limpiarFiltrosExternos() {
    document.getElementById('filtroEstadoExternos').value = '';
    document.getElementById('filtroEntidadExternos').value = '';
    document.getElementById('filtroTipoExternos').value = '';
    document.getElementById('filtroCategoriaExternos').value = '';
    document.getElementById('filtroOrdenExternos').value = 'fecha_recepcion';
    document.getElementById('filtroBusquedaExternos').value = '';
    document.getElementById('filtroFechaExternos').value = '';
    
    aplicarFiltrosExternos();
}

// ==================== ESTADÍSTICAS ====================
function actualizarEstadisticas() {
    const total = externosFiltrados.length;
    const pendientesRevision = externosFiltrados.filter(d => d.estado === 'Registrado' || d.estado === 'En Revisión').length;
    const procesados = externosFiltrados.filter(d => d.estado === 'Procesado' || d.estado === 'Archivado').length;
    const recientes = externosFiltrados.filter(d => 
        esDentroDePeriodo(new Date(d.fechaRecepcion), 7)
    ).length;
    
    document.getElementById('totalExternos').textContent = total;
    document.getElementById('pendientesRevision').textContent = pendientesRevision;
    document.getElementById('procesados').textContent = procesados;
    document.getElementById('recientesExternos').textContent = recientes;
}

// ==================== REGISTRO DE DOCUMENTOS ====================
function registrarDocumentoExterno() {
    // Limpiar formulario
    document.getElementById('formRegistrarExterno').reset();
    
    // Configurar fechas por defecto
    configurarFechasPorDefecto();
    
    // Limpiar archivos seleccionados
    archivosSeleccionados = [];
    document.getElementById('listaArchivosExterno').innerHTML = '';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalRegistrarExterno'));
    modal.show();
}

function configurarFechasPorDefecto() {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Fecha de recepción por defecto es hoy
    const fechaRecepcion = document.getElementById('fechaRecepcionDoc');
    if (fechaRecepcion && !fechaRecepcion.value) {
        fechaRecepcion.value = hoy;
    }
    
    // Fecha de emisión por defecto es ayer
    const fechaEmision = document.getElementById('fechaEmisionDoc');
    if (fechaEmision && !fechaEmision.value) {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        fechaEmision.value = ayer.toISOString().split('T')[0];
    }
}

async function registrarDocumentoConfirmado() {
    const form = document.getElementById('formRegistrarExterno');
    
    // Validar campos obligatorios
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const datos = {
        numero: document.getElementById('numeroDocumento').value.trim(),
        asunto: document.getElementById('asuntoDocumento').value.trim(),
        descripcion: document.getElementById('descripcionDocumento').value.trim(),
        entidadEmisora: document.getElementById('entidadEmisora').value,
        contacto: document.getElementById('contactoEntidad').value,
        tipo: document.getElementById('tipoDocumentoExt').value,
        categoria: document.getElementById('categoriaDocumento').value,
        prioridad: document.getElementById('prioridadDocumento').value,
        fechaEmision: document.getElementById('fechaEmisionDoc').value,
        fechaRecepcion: document.getElementById('fechaRecepcionDoc').value,
        fechaVencimiento: document.getElementById('fechaVencimientoDoc').value,
        responsable: document.getElementById('responsableDoc').value,
        observaciones: document.getElementById('observacionesDoc').value.trim(),
        archivos: archivosSeleccionados
    };
    
    try {
        const response = await fetch('/api/documentos/externos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const resultado = await response.json();
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalRegistrarExterno')).hide();
            
            // Mostrar notificación
            mostrarNotificacion('Documento externo registrado correctamente', 'success');
            
            // Actualizar lista
            actualizarListaExternos();
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error registrando documento:', error);
        mostrarNotificacion('Error al registrar el documento externo', 'error');
    }
}

async function guardarBorradorExterno() {
    const datos = {
        numero: document.getElementById('numeroDocumento').value.trim(),
        asunto: document.getElementById('asuntoDocumento').value.trim(),
        descripcion: document.getElementById('descripcionDocumento').value.trim(),
        entidadEmisora: document.getElementById('entidadEmisora').value,
        contacto: document.getElementById('contactoEntidad').value,
        tipo: document.getElementById('tipoDocumentoExt').value,
        categoria: document.getElementById('categoriaDocumento').value,
        prioridad: document.getElementById('prioridadDocumento').value,
        fechaEmision: document.getElementById('fechaEmisionDoc').value,
        fechaRecepcion: document.getElementById('fechaRecepcionDoc').value,
        fechaVencimiento: document.getElementById('fechaVencimientoDoc').value,
        responsable: document.getElementById('responsableDoc').value,
        observaciones: document.getElementById('observacionesDoc').value.trim(),
        archivos: archivosSeleccionados,
        esBorrador: true
    };
    
    if (!datos.numero && !datos.asunto) {
        mostrarNotificacion('Debe ingresar al menos el número o asunto del documento', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/documentos/externos/borrador', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            mostrarNotificacion('Borrador guardado correctamente', 'success');
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
        mostrarNotificacion('Error al guardar el borrador', 'error');
    }
}

// ==================== GESTIÓN DE ARCHIVOS ====================
function configurarDragAndDrop() {
    const areaArchivos = document.getElementById('areaArchivosExterno');
    if (!areaArchivos) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        areaArchivos.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        areaArchivos.addEventListener(eventName, () => {
            areaArchivos.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        areaArchivos.addEventListener(eventName, () => {
            areaArchivos.classList.remove('dragover');
        }, false);
    });
    
    areaArchivos.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        handleFiles(files);
    }
    
    // Event listener para input file
    const inputArchivos = document.getElementById('archivosExterno');
    if (inputArchivos) {
        inputArchivos.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }
    
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            agregarArchivo(file);
        });
    }
}

function agregarArchivo(file) {
    // Validar tipo de archivo
    const tiposPermitidos = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];
    
    if (!tiposPermitidos.includes(file.type)) {
        mostrarNotificacion(`Tipo de archivo no permitido: ${file.name}`, 'warning');
        return;
    }
    
    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        mostrarNotificacion(`Archivo demasiado grande: ${file.name}. Máximo 10MB`, 'warning');
        return;
    }
    
    // Crear objeto archivo
    const archivoObj = {
        id: Date.now() + Math.random(),
        file: file,
        nombre: file.name,
        tamano: file.size,
        tipo: obtenerTipoArchivo(file.type),
        fechaSubida: new Date().toISOString()
    };
    
    archivosSeleccionados.push(archivoObj);
    renderizarListaArchivos();
}

function obtenerTipoArchivo(mimeType) {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'Word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
    if (mimeType.includes('image')) return 'Imagen';
    return 'Archivo';
}

function renderizarListaArchivos() {
    const container = document.getElementById('listaArchivosExterno');
    
    if (archivosSeleccionados.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const html = archivosSeleccionados.map(archivo => `
        <div class="archivo-item" data-id="${archivo.id}">
            <div class="archivo-info">
                <div class="archivo-icono ${archivo.tipo.toLowerCase()}">
                    <i class="bi bi-file-earmark-${obtenerIconoArchivo(archivo.tipo)}"></i>
                </div>
                <div>
                    <div class="archivo-nombre">${htmlEscape(archivo.nombre)}</div>
                    <div class="archivo-tamanio">${formatearTamanoArchivo(archivo.tamano)}</div>
                </div>
            </div>
            <div class="archivo-acciones">
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarArchivo('${archivo.id}')" 
                        title="Eliminar archivo">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function obtenerIconoArchivo(tipo) {
    const iconos = {
        'PDF': 'pdf',
        'Word': 'word',
        'Excel': 'excel',
        'Imagen': 'image'
    };
    return iconos[tipo] || 'text';
}

function eliminarArchivo(id) {
    archivosSeleccionados = archivosSeleccionados.filter(archivo => archivo.id !== id);
    renderizarListaArchivos();
}

function formatearTamanoArchivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== ACCIONES SOBRE DOCUMENTOS ====================
function verDetallesExterno(id) {
    const documento = externosData.find(d => d.id === id);
    if (!documento) {
        mostrarNotificacion('Documento no encontrado', 'error');
        return;
    }
    
    // Generar contenido de detalles
    const contenidoDetalles = `
        <div class="detalle-documento">
            <div class="detalle-seccion">
                <h6>Información Básica</h6>
                <table class="detalle-tabla">
                    <tr><th>Número:</th><td>${htmlEscape(documento.numero)}</td></tr>
                    <tr><th>Asunto:</th><td>${htmlEscape(documento.asunto)}</td></tr>
                    <tr><th>Tipo:</th><td>${htmlEscape(documento.tipo)}</td></tr>
                    <tr><th>Categoría:</th><td>${generarBadgeCategoria(documento.categoria)}</td></tr>
                    <tr><th>Estado:</th><td>${generarBadgeEstadoExternos(documento.estado)}</td></tr>
                    <tr><th>Prioridad:</th><td><span class="badge badge-${documento.prioridad.toLowerCase()}">${htmlEscape(documento.prioridad)}</span></td></tr>
                </table>
            </div>
            
            <div class="detalle-seccion">
                <h6>Entidad y Fechas</h6>
                <table class="detalle-tabla">
                    <tr><th>Entidad Emisora:</th><td>${htmlEscape(documento.entidadEmisora)}</td></tr>
                    <tr><th>Contacto:</th><td>${htmlEscape(documento.contacto || 'No especificado')}</td></tr>
                    <tr><th>Fecha Emisión:</th><td>${formatearFecha(documento.fechaEmision)}</td></tr>
                    <tr><th>Fecha Recepción:</th><td>${formatearFecha(documento.fechaRecepcion)}</td></tr>
                    <tr><th>Fecha Vencimiento:</th><td>${documento.fechaVencimiento ? formatearFecha(documento.fechaVencimiento) : 'Sin vencimiento'}</td></tr>
                    <tr><th>Responsable:</th><td>${htmlEscape(documento.responsable || 'Sin asignar')}</td></tr>
                </table>
            </div>
        </div>
        
        ${documento.descripcion ? `
            <div class="mt-4">
                <h6 class="text-violet">Descripción</h6>
                <p class="text-muted">${htmlEscape(documento.descripcion)}</p>
            </div>
        ` : ''}
        
        ${documento.observaciones ? `
            <div class="mt-3">
                <h6 class="text-violet">Observaciones</h6>
                <p class="text-muted">${htmlEscape(documento.observaciones)}</p>
            </div>
        ` : ''}
        
        ${documento.archivos && documento.archivos.length > 0 ? `
            <div class="mt-4">
                <h6 class="text-violet">Archivos Adjuntos (${documento.archivos.length})</h6>
                <div class="row">
                    ${documento.archivos.map(archivo => `
                        <div class="col-md-6 col-lg-4 mb-3">
                            <div class="archivo-item">
                                <div class="archivo-info">
                                    <div class="archivo-icono ${archivo.tipo.toLowerCase()}">
                                        <i class="bi bi-file-earmark-${obtenerIconoArchivo(archivo.tipo)}"></i>
                                    </div>
                                    <div>
                                        <div class="archivo-nombre">${htmlEscape(archivo.nombre)}</div>
                                        <div class="archivo-tamanio">${archivo.tamano} MB • ${archivo.tipo}</div>
                                    </div>
                                </div>
                                <div class="archivo-acciones">
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="descargarArchivoExterno(${documento.id}, '${archivo.nombre}')" 
                                            title="Descargar archivo">
                                        <i class="bi bi-download"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${documento.seguimiento && documento.seguimiento.length > 0 ? `
            <div class="mt-4">
                <h6 class="text-violet">Historial de Seguimiento</h6>
                <div class="timeline-externa">
                    ${documento.seguimiento.map(entrada => `
                        <div class="timeline-item-externa">
                            <div class="timeline-fecha-externa">${formatearFecha(entrada.fecha)}</div>
                            <div class="timeline-titulo-externa">${entrada.accion}</div>
                            ${entrada.descripcion ? `<div class="timeline-descripcion-externa">${htmlEscape(entrada.descripcion)}</div>` : ''}
                            ${entrada.usuario ? `<small class="text-muted">Por: ${htmlEscape(entrada.usuario)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('contenidoDetallesExterno').innerHTML = contenidoDetalles;
    document.getElementById('modalVerDetallesExterno').dataset.documentoId = id;
    
    const modal = new bootstrap.Modal(document.getElementById('modalVerDetallesExterno'));
    modal.show();
}

async function procesarDocumentoExterno(id) {
    if (!id) {
        const modal = document.getElementById('modalVerDetallesExterno');
        id = parseInt(modal.dataset.documentoId);
    }
    
    const documento = externosData.find(d => d.id === id);
    if (!documento) {
        mostrarNotificacion('Documento no encontrado', 'error');
        return;
    }
    
    if (documento.estado === 'Procesado' || documento.estado === 'Archivado') {
        mostrarNotificacion('El documento ya ha sido procesado', 'info');
        return;
    }
    
    if (confirm(`¿Está seguro de que desea marcar como procesado el documento "${documento.numero}"?`)) {
        try {
            const response = await fetch(`/api/documentos/externos/${id}/procesar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                // Actualizar datos locales
                documento.estado = 'Procesado';
                documento.seguimiento.push({
                    fecha: new Date().toISOString(),
                    accion: 'Procesado',
                    usuario: 'Usuario Actual',
                    descripcion: 'Documento marcado como procesado'
                });
                
                aplicarFiltrosExternos();
                mostrarNotificacion('Documento procesado correctamente', 'success');
                
                // Cerrar modal si está abierto
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalVerDetallesExterno'));
                if (modal) {
                    modal.hide();
                }
                
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
            
        } catch (error) {
            console.error('Error procesando documento:', error);
            mostrarNotificacion('Error al procesar el documento', 'error');
        }
    }
}

function editarDocumentoExterno() {
    const modal = document.getElementById('modalVerDetallesExterno');
    const id = parseInt(modal.dataset.documentoId);
    
    const documento = externosData.find(d => d.id === id);
    if (!documento) {
        mostrarNotificacion('Documento no encontrado', 'error');
        return;
    }
    
    // Cerrar modal de detalles
    bootstrap.Modal.getInstance(modal).hide();
    
    // Llenar formulario con datos del documento
    setTimeout(() => {
        documentoActualEdicion = id;
        
        document.getElementById('numeroDocumento').value = documento.numero || '';
        document.getElementById('asuntoDocumento').value = documento.asunto || '';
        document.getElementById('descripcionDocumento').value = documento.descripcion || '';
        document.getElementById('entidadEmisora').value = documento.entidadEmisora || '';
        document.getElementById('contactoEntidad').value = documento.contacto || '';
        document.getElementById('tipoDocumentoExt').value = documento.tipo || '';
        document.getElementById('categoriaDocumento').value = documento.categoria || '';
        document.getElementById('prioridadDocumento').value = documento.prioridad || 'Normal';
        document.getElementById('fechaEmisionDoc').value = documento.fechaEmision ? documento.fechaEmision.split('T')[0] : '';
        document.getElementById('fechaRecepcionDoc').value = documento.fechaRecepcion ? documento.fechaRecepcion.split('T')[0] : '';
        document.getElementById('fechaVencimientoDoc').value = documento.fechaVencimiento ? documento.fechaVencimiento.split('T')[0] : '';
        document.getElementById('responsableDoc').value = documento.responsable || '';
        document.getElementById('observacionesDoc').value = documento.observaciones || '';
        
        // Cambiar título del modal
        document.getElementById('modalRegistrarExternoLabel').innerHTML = `
            <i class="bi bi-pencil me-2"></i>
            Editar Documento Externo
        `;
        
        // Mostrar modal de registro
        const modalRegistro = new bootstrap.Modal(document.getElementById('modalRegistrarExterno'));
        modalRegistro.show();
    }, 300);
}

function descargarArchivosExterno(id) {
    mostrarNotificacion(`Descargando archivos del documento ID: ${id}`, 'info');
    // Implementar descarga de archivos
}

function descargarArchivoExterno(documentoId, nombreArchivo) {
    mostrarNotificacion(`Descargando archivo: ${nombreArchivo}`, 'info');
    // Implementar descarga de archivo específico
}

// ==================== SELECCIÓN MASIVA ====================
function seleccionarTodosExternos() {
    const checkboxPrincipal = document.getElementById('selectAllExternos');
    const checkboxes = document.querySelectorAll('.externos-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = checkboxPrincipal.checked;
    });
    
    actualizarSeleccionExternos();
}

function toggleSeleccionTodosExternos() {
    seleccionarTodosExternos();
}

function actualizarSeleccionExternos() {
    const checkboxes = document.querySelectorAll('.externos-checkbox:checked');
    externosSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Actualizar checkbox principal
    const checkboxPrincipal = document.getElementById('selectAllExternos');
    const totalCheckboxes = document.querySelectorAll('.externos-checkbox').length;
    
    if (externosSeleccionados.length === 0) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = false;
    } else if (externosSeleccionados.length === totalCheckboxes) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = true;
    } else {
        checkboxPrincipal.indeterminate = true;
    }
}

function procesarSeleccionados() {
    if (externosSeleccionados.length === 0) {
        mostrarNotificacion('Por favor seleccione al menos un documento', 'warning');
        return;
    }
    
    if (confirm(`¿Está seguro de que desea procesar ${externosSeleccionados.length} documento(s) seleccionado(s)?`)) {
        procesarDocumentosSeleccionados();
    }
}

async function procesarDocumentosSeleccionados() {
    try {
        const promises = externosSeleccionados.map(id => 
            procesarDocumentoExterno(id)
        );
        
        await Promise.all(promises);
        
        externosSeleccionados = [];
        actualizarSeleccionExternos();
        mostrarNotificacion(`${promises.length} documento(s) procesado(s) correctamente`, 'success');
        
    } catch (error) {
        console.error('Error procesando documentos:', error);
        mostrarNotificacion('Error al procesar algunos documentos', 'error');
    }
}

// ==================== IMPORTACIÓN MASIVA ====================
function importarMasivo() {
    const modal = new bootstrap.Modal(document.getElementById('modalImportarMasivo'));
    modal.show();
}

function descargarPlantilla() {
    mostrarNotificacion('Descargando plantilla Excel...', 'info');
    // Implementar descarga de plantilla
}

function validarArchivoImportacion() {
    const archivo = document.getElementById('archivoImportacion').files[0];
    const resultadoDiv = document.getElementById('resultadoValidacion');
    const btnProcesar = document.getElementById('btnProcesarImportacion');
    
    if (!archivo) {
        resultadoDiv.innerHTML = '';
        btnProcesar.disabled = true;
        return;
    }
    
    // Validar tipo de archivo
    if (!archivo.name.match(/\.(xlsx|xls)$/)) {
        resultadoDiv.innerHTML = `
            <div class="validacion-error">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Formato de archivo no válido. Debe ser un archivo Excel (.xlsx o .xls)
            </div>
        `;
        btnProcesar.disabled = true;
        return;
    }
    
    // Simular validación del contenido
    setTimeout(() => {
        resultadoDiv.innerHTML = `
            <div class="validacion-exitosa">
                <i class="bi bi-check-circle me-2"></i>
                Archivo validado correctamente. Se encontraron 15 documentos para importar.
            </div>
        `;
        btnProcesar.disabled = false;
    }, 1000);
}

async function procesarImportacion() {
    const archivo = document.getElementById('archivoImportacion').files[0];
    
    if (!archivo) {
        mostrarNotificacion('Por favor seleccione un archivo', 'warning');
        return;
    }
    
    try {
        mostrarNotificacion('Procesando importación...', 'info');
        
        // Simular procesamiento
        setTimeout(() => {
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalImportarMasivo')).hide();
            
            mostrarNotificacion('Importación completada: 15 documentos importados correctamente', 'success');
            
            // Actualizar lista
            actualizarListaExternos();
        }, 3000);
        
    } catch (error) {
        console.error('Error en importación:', error);
        mostrarNotificacion('Error durante la importación', 'error');
    }
}

function exportarRegistros() {
    mostrarNotificacion('Preparando exportación de registros...', 'info');
    // Implementar exportación
}

// ==================== CONTACTOS DINÁMICOS ====================
function actualizarContactos() {
    const entidadSeleccionada = document.getElementById('entidadEmisora').value;
    const selectContacto = document.getElementById('contactoEntidad');
    
    // Limpiar contactos
    selectContacto.innerHTML = '<option value="">Seleccione un contacto...</option>';
    
    // Contactos por entidad (simulado)
    const contactosPorEntidad = {
        'Ministerio de Transportes': [
            'Ana García - Directora Técnica',
            'Carlos López - Especialista Vial'
        ],
        'SERNANP': [
            'Carlos Mendoza - Especialista Ambiental',
            'María Santos - Coordinadora Regional'
        ],
        'Municipalidad Provincial': [
            'Roberto Silva - Gerente de Obras',
            'Elena Vargas - Supervisora'
        ],
        'OSINERGMIN': [
            'Patricia López - Inspectora Senior',
            'Miguel Torres - Analista'
        ],
        'CENEPRED': [
            'Miguel Torres - Especialista en Riesgos',
            'Laura Mendez - Coordinadora'
        ]
    };
    
    const contactos = contactosPorEntidad[entidadSeleccionada] || [];
    contactos.forEach(contacto => {
        selectContacto.innerHTML += `<option value="${htmlEscape(contacto)}">${htmlEscape(contacto)}</option>`;
    });
}

// ==================== UTILIDADES ====================
function esDentroDePeriodo(fecha, dias) {
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const diasTranscurridos = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    return diasTranscurridos <= dias;
}

function configurarEventListeners() {
    // Event listeners específicos para documentos externos
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            actualizarListaExternos();
        }
    });
}

function actualizarListaExternos() {
    cargarDatosIniciales();
}

function iniciarActualizacionPeriodica() {
    // Actualizar cada 10 minutos
    if (intervaloExternos) {
        clearInterval(intervaloExternos);
    }
    
    intervaloExternos = setInterval(() => {
        cargarDatosIniciales();
    }, 600000);
}

// ==================== PAGINACIÓN ====================
function actualizarPaginacionExternos() {
    const totalPaginas = Math.ceil(externosFiltrados.length / elementosPorPaginaExternos);
    const paginacion = document.getElementById('paginacionExternos');
    
    if (totalPaginas <= 1) {
        paginacion.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botón anterior
    html += `
        <li class="page-item ${paginaActualExternos === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaExternos(${paginaActualExternos - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualExternos - 2 && i <= paginaActualExternos + 2)) {
            html += `
                <li class="page-item ${i === paginaActualExternos ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPaginaExternos(${i})">${i}</a>
                </li>
            `;
        } else if (i === paginaActualExternos - 3 || i === paginaActualExternos + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Botón siguiente
    html += `
        <li class="page-item ${paginaActualExternos === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaExternos(${paginaActualExternos + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacion.innerHTML = html;
}

function cambiarPaginaExternos(pagina) {
    const totalPaginas = Math.ceil(externosFiltrados.length / elementosPorPaginaExternos);
    
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaActualExternos = pagina;
        renderizarTablaExternos();
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function mostrarCargando(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Cargando documentos externos...</p>
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
    if (intervaloExternos) {
        clearInterval(intervaloExternos);
    }
});