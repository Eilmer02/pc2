/* ==================== DELEGADOS JS - OPTIMIZADO ==================== */
/* Sistema de Gestión Documental - Constructora Vial S.A. */
/* @version 3.0.0 (Optimizada y Modernizada) */

// ==================== VARIABLES GLOBALES ====================
let delegadosData = [];
let delegadosFiltrados = [];
let paginaActualDelegados = 1;
let elementosPorPaginaDelegados = 10;
let delegadosSeleccionados = [];
let intervaloDelegados = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    inicializarDelegados();
});

function inicializarDelegados() {
    console.log('🚀 Inicializando módulo Delegados...');
    
    cargarDatosIniciales();
    configurarEventListeners();
    iniciarActualizacionPeriodica();
    configurarFechasPorDefecto();
    
    console.log('✅ Módulo Delegados inicializado correctamente');
}

// ==================== CARGA DE DATOS ====================
async function cargarDatosIniciales() {
    try {
        mostrarCargando('tablaDelegadosContainer');
        
        // Cargar datos en paralelo
        const [delegaciones, usuarios, proyectos] = await Promise.all([
            cargarDelegaciones(),
            cargarUsuarios(),
            cargarProyectos()
        ]);
        
        delegadosData = delegaciones;
        delegadosFiltrados = [...delegadosData];
        
        poblarFiltros(usuarios, proyectos);
        actualizarEstadisticas();
        renderizarTablaDelegados();
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        mostrarError('tablaDelegadosContainer', 'Error al cargar las delegaciones');
    }
}

async function cargarDelegaciones() {
    try {
        const response = await fetch('/api/delegaciones', {
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
        return data.delegaciones || generarDatosPruebaDelegados();
        
    } catch (error) {
        console.warn('⚠️ Usando datos de prueba para delegados:', error.message);
        return generarDatosPruebaDelegados();
    }
}

function generarDatosPruebaDelegados() {
    return [
        {
            id: 1,
            usuarioDelegante: 'Juan Pérez',
            usuarioDelegado: 'María González',
            cargoDelgante: 'Gerente de Proyectos',
            cargoDelegado: 'Ingeniera Senior',
            tipo: 'Firma',
            descripcion: 'Delegación temporal de firma durante período vacacional',
            estado: 'Activa',
            fechaInicio: '2025-01-20T00:00:00Z',
            fechaFin: '2025-02-05T23:59:59Z',
            fechaCreacion: '2025-01-18T10:30:00Z',
            proyectosIncluidos: ['Mejoramiento Ruta 101', 'Terminal de Buses Central'],
            permisos: ['Firmar documentos técnicos', 'Aprobar especificaciones'],
            limites: 'Máximo 5 documentos por día',
            notificarVencimiento: true,
            documentosFirmados: 12,
            ultimaActividad: '2025-01-22T14:30:00Z'
        },
        {
            id: 2,
            usuarioDelegante: 'Carlos Ruiz',
            usuarioDelegado: 'Luis Torres',
            cargoDelgante: 'Ingeniero Estructural',
            cargoDelegado: 'Arquitecto Principal',
            tipo: 'Revisión',
            descripcion: 'Delegación para revisión de planos estructurales',
            estado: 'Activa',
            fechaInicio: '2025-01-15T00:00:00Z',
            fechaFin: '2025-01-30T23:59:59Z',
            fechaCreacion: '2025-01-12T09:15:00Z',
            proyectosIncluidos: ['Construcción Puente Río Verde'],
            permisos: ['Revisar planos estructurales', 'Validar cálculos'],
            limites: 'Solo documentos del proyecto específico',
            notificarVencimiento: true,
            documentosFirmados: 8,
            ultimaActividad: '2025-01-21T16:45:00Z'
        },
        {
            id: 3,
            usuarioDelegante: 'Ana Martínez',
            usuarioDelegado: 'Patricia Vega',
            cargoDelgante: 'Especialista en Seguridad',
            cargoDelegado: 'Coordinadora Legal',
            tipo: 'Aprobación',
            descripcion: 'Delegación para aprobación de protocolos de seguridad',
            estado: 'Activa',
            fechaInicio: '2025-01-22T00:00:00Z',
            fechaFin: '2025-01-25T23:59:59Z',
            fechaCreacion: '2025-01-20T11:20:00Z',
            proyectosIncluidos: [],
            permisos: ['Aprobar protocolos de seguridad', 'Validar procedimientos'],
            limites: 'Urgente - Solo 3 días',
            notificarVencimiento: true,
            documentosFirmados: 3,
            ultimaActividad: '2025-01-22T09:30:00Z'
        },
        {
            id: 4,
            usuarioDelegante: 'Luis Torres',
            usuarioDelegado: 'Roberto Miranda',
            cargoDelgante: 'Arquitecto Principal',
            cargoDelegado: 'Supervisor Técnico',
            tipo: 'Administración',
            descripcion: 'Delegación administrativa para gestión de contratos',
            estado: 'Pendiente',
            fechaInicio: '2025-01-25T00:00:00Z',
            fechaFin: '2025-02-10T23:59:59Z',
            fechaCreacion: '2025-01-22T15:45:00Z',
            proyectosIncluidos: ['Ampliación Aeropuerto'],
            permisos: ['Gestionar contratos', 'Aprobar pagos menores'],
            limites: 'Hasta $50,000 USD',
            notificarVencimiento: true,
            documentosFirmados: 0,
            ultimaActividad: null
        },
        {
            id: 5,
            usuarioDelegante: 'María González',
            usuarioDelegado: 'Carlos Ruiz',
            cargoDelgante: 'Ingeniera Senior',
            cargoDelegado: 'Ingeniero Estructural',
            tipo: 'Firma',
            descripcion: 'Delegación recíproca para firma de informes técnicos',
            estado: 'Expirada',
            fechaInicio: '2025-01-05T00:00:00Z',
            fechaFin: '2025-01-20T23:59:59Z',
            fechaCreacion: '2025-01-03T08:30:00Z',
            proyectosIncluidos: ['Túnel Cordillera Norte'],
            permisos: ['Firmar informes técnicos', 'Validar estudios'],
            limites: 'Solo informes de geología',
            notificarVencimiento: true,
            documentosFirmados: 15,
            ultimaActividad: '2025-01-19T17:20:00Z'
        }
    ];
}

async function cargarUsuarios() {
    try {
        return [
            { id: 1, nombre: 'Juan Pérez', cargo: 'Gerente de Proyectos' },
            { id: 2, nombre: 'María González', cargo: 'Ingeniera Senior' },
            { id: 3, nombre: 'Carlos Ruiz', cargo: 'Ingeniero Estructural' },
            { id: 4, nombre: 'Ana Martínez', cargo: 'Especialista en Seguridad' },
            { id: 5, nombre: 'Luis Torres', cargo: 'Arquitecto Principal' },
            { id: 6, nombre: 'Patricia Vega', cargo: 'Coordinadora Legal' },
            { id: 7, nombre: 'Roberto Miranda', cargo: 'Supervisor Técnico' }
        ];
    } catch (error) {
        console.error('Error cargando usuarios:', error);
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

// ==================== RENDERIZADO ====================
function renderizarTablaDelegados() {
    const container = document.getElementById('tablaDelegadosContainer');
    
    if (delegadosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-people" style="font-size: 4rem; color: var(--gray-300);"></i>
                <h5 class="mt-3 text-muted">No hay delegaciones</h5>
                <p class="text-muted">No hay delegaciones que coincidan con los filtros aplicados.</p>
                <button class="btn btn-primary" onclick="nuevaDelegacion()">
                    <i class="bi bi-plus-lg me-2"></i>
                    Crear Nueva Delegación
                </button>
            </div>
        `;
        return;
    }
    
    const inicio = (paginaActualDelegados - 1) * elementosPorPaginaDelegados;
    const fin = inicio + elementosPorPaginaDelegados;
    const delegacionesPagina = delegadosFiltrados.slice(inicio, fin);
    
    const tabla = `
        <div class="table-responsive">
            <table class="table delegados-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="selectAllDelegados" 
                                       onchange="toggleSeleccionTodosDelegados()">
                            </div>
                        </th>
                        <th style="width: 150px;">Delegante</th>
                        <th style="width: 150px;">Delegado</th>
                        <th style="width: 120px;">Tipo</th>
                        <th style="width: 100px;">Estado</th>
                        <th style="width: 150px;">Vigencia</th>
                        <th style="width: 100px;">Documentos</th>
                        <th style="width: 120px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${delegacionesPagina.map(delegacion => generarFilaDelegacion(delegacion)).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tabla;
    actualizarPaginacionDelegados();
}

function generarFilaDelegacion(delegacion) {
    const diasRestantes = calcularDiasRestantes(delegacion.fechaFin);
    const proximaVencer = diasRestantes <= 3 && diasRestantes > 0;
    const expirada = delegacion.estado === 'Expirada' || diasRestantes < 0;
    
    let clasesFila = [];
    if (delegacion.estado === 'Activa') clasesFila.push('activa');
    if (proximaVencer) clasesFila.push('proxima-vencer');
    if (expirada) clasesFila.push('expirada');
    
    return `
        <tr class="${clasesFila.join(' ')}" data-id="${delegacion.id}">
            <td>
                <div class="form-check">
                    <input class="form-check-input delegados-checkbox" type="checkbox" 
                           value="${delegacion.id}" onchange="actualizarSeleccionDelegados()">
                </div>
            </td>
            <td>
                <div class="usuario-info">
                    <div class="usuario-avatar">${obtenerIniciales(delegacion.usuarioDelegante)}</div>
                    <div>
                        <div class="usuario-nombre">${htmlEscape(delegacion.usuarioDelegante)}</div>
                        <div class="usuario-rol">${htmlEscape(delegacion.cargoDelgante)}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="usuario-info">
                    <div class="usuario-avatar">${obtenerIniciales(delegacion.usuarioDelegado)}</div>
                    <div>
                        <div class="usuario-nombre">${htmlEscape(delegacion.usuarioDelegado)}</div>
                        <div class="usuario-rol">${htmlEscape(delegacion.cargoDelegado)}</div>
                    </div>
                </div>
            </td>
            <td>
                ${generarBadgeTipoDelegacion(delegacion.tipo)}
            </td>
            <td>
                ${generarBadgeEstadoDelegacion(delegacion.estado)}
            </td>
            <td>
                <div>
                    <small class="text-muted">${formatearFecha(delegacion.fechaFin)}</small>
                    <div class="tiempo-restante ${obtenerClaseTiempo(diasRestantes)}">
                        ${generarTextoTiempoRestante(diasRestantes)}
                    </div>
                </div>
            </td>
            <td>
                <div class="text-center">
                    <span class="fw-bold">${delegacion.documentosFirmados}</span>
                    <small class="d-block text-muted">firmados</small>
                </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="verDetallesDelegacion(${delegacion.id})" 
                            title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="extenderDelegacion(${delegacion.id})" 
                            title="Extender delegación">
                        <i class="bi bi-clock"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="revocarDelegacion(${delegacion.id})" 
                            title="Revocar delegación">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function generarBadgeEstadoDelegacion(estado) {
    const badges = {
        'Activa': 'badge-activa',
        'Pendiente': 'badge-pendiente',
        'Expirada': 'badge-expirada',
        'Revocada': 'badge-revocada'
    };
    
    return `<span class="badge ${badges[estado] || 'badge-pendiente'}">${htmlEscape(estado)}</span>`;
}

function generarBadgeTipoDelegacion(tipo) {
    const badges = {
        'Firma': 'badge-firma',
        'Aprobación': 'badge-aprobacion',
        'Revisión': 'badge-revision',
        'Administración': 'badge-administracion'
    };
    
    return `<span class="badge ${badges[tipo] || 'badge-firma'}">${htmlEscape(tipo)}</span>`;
}

// ==================== NUEVA DELEGACIÓN ====================
function nuevaDelegacion() {
    // Limpiar formulario
    document.getElementById('formNuevaDelegacion').reset();
    
    // Configurar fechas por defecto
    configurarFechasPorDefecto();
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaDelegacion'));
    modal.show();
}

function configurarFechasPorDefecto() {
    const hoy = new Date();
    const enUnaSemana = new Date();
    enUnaSemana.setDate(hoy.getDate() + 7);
    
    const fechaInicio = document.getElementById('fechaInicioDelegacion');
    const fechaFin = document.getElementById('fechaFinDelegacion');
    
    if (fechaInicio && !fechaInicio.value) {
        fechaInicio.value = hoy.toISOString().split('T')[0];
    }
    
    if (fechaFin && !fechaFin.value) {
        fechaFin.value = enUnaSemana.toISOString().split('T')[0];
    }
}

function actualizarPermisos() {
    const tipo = document.getElementById('tipoDelegacion').value;
    const container = document.getElementById('permisosContainer');
    
    const permisosPorTipo = {
        'Firma': [
            { id: 'firmar_documentos', label: 'Firmar documentos técnicos', desc: 'Permite firmar digitalmente documentos técnicos' },
            { id: 'firmar_informes', label: 'Firmar informes', desc: 'Permite firmar informes y reportes' },
            { id: 'firmar_especificaciones', label: 'Firmar especificaciones', desc: 'Permite firmar especificaciones técnicas' }
        ],
        'Aprobación': [
            { id: 'aprobar_proyectos', label: 'Aprobar proyectos', desc: 'Permite aprobar nuevos proyectos' },
            { id: 'aprobar_presupuestos', label: 'Aprobar presupuestos', desc: 'Permite aprobar presupuestos de proyecto' },
            { id: 'aprobar_cambios', label: 'Aprobar cambios', desc: 'Permite aprobar cambios en proyectos existentes' }
        ],
        'Revisión': [
            { id: 'revisar_planos', label: 'Revisar planos', desc: 'Permite revisar y validar planos técnicos' },
            { id: 'revisar_calculos', label: 'Revisar cálculos', desc: 'Permite revisar cálculos estructurales' },
            { id: 'revisar_especificaciones', label: 'Revisar especificaciones', desc: 'Permite revisar especificaciones técnicas' }
        ],
        'Administración': [
            { id: 'gestionar_contratos', label: 'Gestionar contratos', desc: 'Permite gestionar contratos y proveedores' },
            { id: 'aprobar_pagos', label: 'Aprobar pagos', desc: 'Permite aprobar pagos y facturaciones' },
            { id: 'administrar_usuarios', label: 'Administrar usuarios', desc: 'Permite administrar usuarios del sistema' }
        ]
    };
    
    if (!tipo || !permisosPorTipo[tipo]) {
        container.innerHTML = '<p class="text-muted">Seleccione un tipo de delegación para ver los permisos disponibles.</p>';
        return;
    }
    
    const permisos = permisosPorTipo[tipo];
    const html = `
        <div class="permisos-container">
            <h6 class="mb-3">Permisos Disponibles</h6>
            ${permisos.map(permiso => `
                <div class="permiso-item">
                    <input class="form-check-input permiso-checkbox" type="checkbox" 
                           id="${permiso.id}" value="${permiso.id}" checked>
                    <label class="permiso-label" for="${permiso.id}">
                        ${permiso.label}
                        <span class="permiso-descripcion">${permiso.desc}</span>
                    </label>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

async function crearDelegacion() {
    const form = document.getElementById('formNuevaDelegacion');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Recopilar permisos seleccionados
    const permisosSeleccionados = Array.from(document.querySelectorAll('.permiso-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    const datos = {
        usuarioDelegante: document.getElementById('usuarioDelegante').value,
        usuarioDelegado: document.getElementById('usuarioDelegado').value,
        tipo: document.getElementById('tipoDelegacion').value,
        descripcion: document.getElementById('descripcionDelegacion').value.trim(),
        fechaInicio: document.getElementById('fechaInicioDelegacion').value,
        fechaFin: document.getElementById('fechaFinDelegacion').value,
        proyectosIncluidos: Array.from(document.getElementById('proyectosIncluidos').selectedOptions)
            .map(option => option.value),
        permisos: permisosSeleccionados,
        limites: document.getElementById('limitesAdicionales').value.trim(),
        notificarVencimiento: document.getElementById('notificarVencimiento').checked
    };
    
    try {
        const response = await fetch('/api/delegaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalNuevaDelegacion')).hide();
            
            mostrarNotificacion('Delegación creada correctamente', 'success');
            
            // Actualizar lista
            actualizarListaDelegados();
            
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error creando delegación:', error);
        mostrarNotificacion('Error al crear la delegación', 'error');
    }
}

// ==================== ACCIONES ====================
function verDetallesDelegacion(id) {
    const delegacion = delegadosData.find(d => d.id === id);
    if (!delegacion) {
        mostrarNotificacion('Delegación no encontrada', 'error');
        return;
    }
    
    // Implementar vista de detalles
    mostrarNotificacion('Función de detalles en desarrollo', 'info');
}

async function extenderDelegacion(id) {
    const delegacion = delegadosData.find(d => d.id === id);
    if (!delegacion) {
        mostrarNotificacion('Delegación no encontrada', 'error');
        return;
    }
    
    const nuevaFecha = prompt('Ingrese la nueva fecha de vencimiento (YYYY-MM-DD):', 
        new Date(delegacion.fechaFin).toISOString().split('T')[0]);
    
    if (!nuevaFecha) return;
    
    try {
        const response = await fetch(`/api/delegaciones/${id}/extender`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ fechaFin: nuevaFecha })
        });
        
        if (response.ok) {
            delegacion.fechaFin = nuevaFecha + 'T23:59:59Z';
            aplicarFiltrosDelegados();
            mostrarNotificacion('Delegación extendida correctamente', 'success');
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error extendiendo delegación:', error);
        mostrarNotificacion('Error al extender la delegación', 'error');
    }
}

async function revocarDelegacion(id) {
    const delegacion = delegadosData.find(d => d.id === id);
    if (!delegacion) {
        mostrarNotificacion('Delegación no encontrada', 'error');
        return;
    }
    
    if (confirm(`¿Está seguro de que desea revocar la delegación de ${delegacion.usuarioDelegante} a ${delegacion.usuarioDelegado}?`)) {
        try {
            const response = await fetch(`/api/delegaciones/${id}/revocar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                delegacion.estado = 'Revocada';
                aplicarFiltrosDelegados();
                mostrarNotificacion('Delegación revocada correctamente', 'success');
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
            
        } catch (error) {
            console.error('Error revocando delegación:', error);
            mostrarNotificacion('Error al revocar la delegación', 'error');
        }
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function calcularDiasRestantes(fechaFin) {
    const ahora = new Date();
    const fin = new Date(fechaFin);
    const diferencia = fin - ahora;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

function generarTextoTiempoRestante(dias) {
    if (dias < 0) return 'Expirada';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    if (dias <= 7) return `${dias} días restantes`;
    return `${Math.ceil(dias / 7)} semanas restantes`;
}

function obtenerClaseTiempo(dias) {
    if (dias < 0) return 'critico';
    if (dias <= 3) return 'advertencia';
    return 'normal';
}

function obtenerIniciales(nombre) {
    return nombre.split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

function poblarFiltros(usuarios, proyectos) {
    // Poblar usuarios delegantes
    const selectDelegante = document.getElementById('filtroDeleganteUsuario');
    selectDelegante.innerHTML = '<option value="">Todos los usuarios</option>';
    usuarios.forEach(usuario => {
        selectDelegante.innerHTML += `<option value="${htmlEscape(usuario.nombre)}">${htmlEscape(usuario.nombre)}</option>`;
    });
    
    // Poblar usuarios delegados
    const selectDelegado = document.getElementById('filtroDelegadoUsuario');
    selectDelegado.innerHTML = '<option value="">Todos los usuarios</option>';
    usuarios.forEach(usuario => {
        selectDelegado.innerHTML += `<option value="${htmlEscape(usuario.nombre)}">${htmlEscape(usuario.nombre)}</option>`;
    });
    
    // Poblar usuarios en modal
    const selectModalDelegante = document.getElementById('usuarioDelegante');
    const selectModalDelegado = document.getElementById('usuarioDelegado');
    
    if (selectModalDelegante) {
        selectModalDelegante.innerHTML = '<option value="">Seleccione el usuario que delega...</option>';
        usuarios.forEach(usuario => {
            selectModalDelegante.innerHTML += `<option value="${htmlEscape(usuario.nombre)}">${htmlEscape(usuario.nombre)} - ${htmlEscape(usuario.cargo)}</option>`;
        });
    }
    
    if (selectModalDelegado) {
        selectModalDelegado.innerHTML = '<option value="">Seleccione el usuario delegado...</option>';
        usuarios.forEach(usuario => {
            selectModalDelegado.innerHTML += `<option value="${htmlEscape(usuario.nombre)}">${htmlEscape(usuario.nombre)} - ${htmlEscape(usuario.cargo)}</option>`;
        });
    }
    
    // Poblar proyectos en modal
    const selectProyectos = document.getElementById('proyectosIncluidos');
    if (selectProyectos) {
        selectProyectos.innerHTML = '';
        proyectos.forEach(proyecto => {
            selectProyectos.innerHTML += `<option value="${htmlEscape(proyecto)}">${htmlEscape(proyecto)}</option>`;
        });
    }
}

function aplicarFiltrosDelegados() {
    const estado = document.getElementById('filtroEstadoDelegados').value;
    const delegante = document.getElementById('filtroDeleganteUsuario').value;
    const delegado = document.getElementById('filtroDelegadoUsuario').value;
    const tipo = document.getElementById('filtroTipoDelegacion').value;
    const orden = document.getElementById('filtroOrdenDelegados').value;
    const busqueda = document.getElementById('filtroBusquedaDelegados').value.toLowerCase().trim();
    
    // Aplicar filtros
    delegadosFiltrados = delegadosData.filter(delegacion => {
        const cumpleEstado = !estado || delegacion.estado === estado;
        const cumpleDelegante = !delegante || delegacion.usuarioDelegante === delegante;
        const cumpleDelegado = !delegado || delegacion.usuarioDelegado === delegado;
        const cumpleTipo = !tipo || delegacion.tipo === tipo;
        const cumpleBusqueda = !busqueda || 
            delegacion.usuarioDelegante.toLowerCase().includes(busqueda) ||
            delegacion.usuarioDelegado.toLowerCase().includes(busqueda) ||
            delegacion.descripcion.toLowerCase().includes(busqueda);
        
        return cumpleEstado && cumpleDelegante && cumpleDelegado && cumpleTipo && cumpleBusqueda;
    });
    
    // Aplicar ordenamiento
    delegadosFiltrados.sort((a, b) => {
        switch (orden) {
            case 'fecha_creacion':
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            case 'fecha_vencimiento':
                return new Date(a.fechaFin) - new Date(b.fechaFin);
            case 'delegante':
                return a.usuarioDelegante.localeCompare(b.usuarioDelegante);
            case 'delegado':
                return a.usuarioDelegado.localeCompare(b.usuarioDelegado);
            default:
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
        }
    });
    
    paginaActualDelegados = 1;
    renderizarTablaDelegados();
    actualizarEstadisticas();
}

function limpiarFiltrosDelegados() {
    document.getElementById('filtroEstadoDelegados').value = '';
    document.getElementById('filtroDeleganteUsuario').value = '';
    document.getElementById('filtroDelegadoUsuario').value = '';
    document.getElementById('filtroTipoDelegacion').value = '';
    document.getElementById('filtroOrdenDelegados').value = 'fecha_creacion';
    document.getElementById('filtroBusquedaDelegados').value = '';
    
    aplicarFiltrosDelegados();
}

function actualizarEstadisticas() {
    const total = delegadosFiltrados.filter(d => d.estado === 'Activa').length;
    const proximasVencer = delegadosFiltrados.filter(d => {
        const dias = calcularDiasRestantes(d.fechaFin);
        return dias <= 3 && dias > 0 && d.estado === 'Activa';
    }).length;
    const documentosDelegados = delegadosFiltrados.reduce((suma, d) => suma + d.documentosFirmados, 0);
    const nuevasSemana = delegadosFiltrados.filter(d => 
        esDentroDeSemana(new Date(d.fechaCreacion))
    ).length;
    
    document.getElementById('totalDelegaciones').textContent = total;
    document.getElementById('proximas-vencer').textContent = proximasVencer;
    document.getElementById('documentosDelegados').textContent = documentosDelegados;
    document.getElementById('nuevasSemana').textContent = nuevasSemana;
}

function seleccionarTodosDelegados() {
    const checkboxPrincipal = document.getElementById('selectAllDelegados');
    const checkboxes = document.querySelectorAll('.delegados-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = checkboxPrincipal.checked;
    });
    
    actualizarSeleccionDelegados();
}

function toggleSeleccionTodosDelegados() {
    seleccionarTodosDelegados();
}

function actualizarSeleccionDelegados() {
    const checkboxes = document.querySelectorAll('.delegados-checkbox:checked');
    delegadosSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const checkboxPrincipal = document.getElementById('selectAllDelegados');
    const totalCheckboxes = document.querySelectorAll('.delegados-checkbox').length;
    
    if (delegadosSeleccionados.length === 0) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = false;
    } else if (delegadosSeleccionados.length === totalCheckboxes) {
        checkboxPrincipal.indeterminate = false;
        checkboxPrincipal.checked = true;
    } else {
        checkboxPrincipal.indeterminate = true;
    }
}

function revocarSeleccionados() {
    if (delegadosSeleccionados.length === 0) {
        mostrarNotificacion('Por favor seleccione al menos una delegación', 'warning');
        return;
    }
    
    if (confirm(`¿Está seguro de que desea revocar ${delegadosSeleccionados.length} delegación(es) seleccionada(s)?`)) {
        revocarDelegacionesSeleccionadas();
    }
}

async function revocarDelegacionesSeleccionadas() {
    try {
        const promises = delegadosSeleccionados.map(id => revocarDelegacion(id));
        await Promise.all(promises);
        
        delegadosSeleccionados = [];
        actualizarSeleccionDelegados();
        
    } catch (error) {
        console.error('Error revocando delegaciones:', error);
        mostrarNotificacion('Error al revocar algunas delegaciones', 'error');
    }
}

function revisarVencimientos() {
    const proximasVencer = delegadosData.filter(d => {
        const dias = calcularDiasRestantes(d.fechaFin);
        return dias <= 7 && dias > 0 && d.estado === 'Activa';
    });
    
    if (proximasVencer.length === 0) {
        mostrarNotificacion('No hay delegaciones próximas a vencer', 'info');
        return;
    }
    
    const mensaje = `Se encontraron ${proximasVencer.length} delegación(es) próximas a vencer:

${proximasVencer.map(d => `• ${d.usuarioDelegante} → ${d.usuarioDelegado} (${calcularDiasRestantes(d.fechaFin)} días)`).join('\n')}`;
    
    alert(mensaje);
}

function generarReporteDelegaciones() {
    mostrarNotificacion('Generando reporte de delegaciones...', 'info');
    // Implementar generación de reporte
}

function configurarEventListeners() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            actualizarListaDelegados();
        }
    });
}

function actualizarListaDelegados() {
    cargarDatosIniciales();
}

function iniciarActualizacionPeriodica() {
    if (intervaloDelegados) {
        clearInterval(intervaloDelegados);
    }
    
    intervaloDelegados = setInterval(() => {
        cargarDatosIniciales();
    }, 300000); // 5 minutos
}

// ==================== PAGINACIÓN ====================
function actualizarPaginacionDelegados() {
    const totalPaginas = Math.ceil(delegadosFiltrados.length / elementosPorPaginaDelegados);
    const paginacion = document.getElementById('paginacionDelegados');
    
    if (totalPaginas <= 1) {
        paginacion.innerHTML = '';
        return;
    }
    
    let html = '';
    
    html += `
        <li class="page-item ${paginaActualDelegados === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaDelegados(${paginaActualDelegados - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualDelegados - 2 && i <= paginaActualDelegados + 2)) {
            html += `
                <li class="page-item ${i === paginaActualDelegados ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPaginaDelegados(${i})">${i}</a>
                </li>
            `;
        } else if (i === paginaActualDelegados - 3 || i === paginaActualDelegados + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    html += `
        <li class="page-item ${paginaActualDelegados === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaDelegados(${paginaActualDelegados + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacion.innerHTML = html;
}

function cambiarPaginaDelegados(pagina) {
    const totalPaginas = Math.ceil(delegadosFiltrados.length / elementosPorPaginaDelegados);
    
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaActualDelegados = pagina;
        renderizarTablaDelegados();
    }
}

// ==================== UTILIDADES COMPARTIDAS ====================
function mostrarCargando(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Cargando delegaciones...</p>
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
        day: 'numeric'
    });
}

function esDentroDeSemana(fecha) {
    const ahora = new Date();
    const inicioSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()));
    return fecha >= inicioSemana;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensaje, tipo);
    }
}

window.addEventListener('beforeunload', function() {
    if (intervaloDelegados) {
        clearInterval(intervaloDelegados);
    }
});