/* ==================== SEGUIMIENTO JS - MÓDULO OPTIMIZADO ==================== */
/* Sistema de Gestión Documental - Constructora Vial S.A. */
/* @version 2.0.0 - OPTIMIZADO Y CORREGIDO */
/* @description JavaScript optimizado para módulo de seguimiento con mejoras críticas */

'use strict';

/**
 * Módulo principal para gestión de seguimiento de documentos
 * VERSIÓN COMPLETAMENTE OPTIMIZADA
 */
const SeguimientoApp = (function() {
    
    // ==================== CONFIGURACIÓN OPTIMIZADA ====================
    const CONFIG = {
        API_ENDPOINT: './SeguimientoServlet',
        ITEMS_POR_PAGINA: 15,
        DEBOUNCE_DELAY: 300,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
        TOAST_DURATION: 5000,
        AUTO_REFRESH_INTERVAL: 30000, // 30 segundos
        MAX_SEARCH_LENGTH: 100,
        CONNECTION_TIMEOUT: 10000
    };

    // Estados que coinciden exactamente con la BD
    const ESTADOS_SEGUIMIENTO = {
        PENDIENTE: 'Pendiente',
        APROBADO: 'Aprobado', 
        OBSERVADO: 'Observado',
        RECHAZADO: 'Rechazado'
    };

    // Estados de frontend (mapeo)
    const ESTADOS_FRONTEND = {
        EN_REVISION: 'En Revision',
        COMPLETADO: 'Completado'
    };

    const PRIORIDADES = {
        ALTA: 'Alta',
        MEDIA: 'Media', 
        BAJA: 'Baja',
        URGENTE: 'Urgente'
    };

    const ACCIONES = {
        OBTENER_ESTADISTICAS: 'obtenerEstadisticasSeguimiento',
        OBTENER_PROYECTOS: 'obtenerProyectos',
        OBTENER_RESPONSABLES: 'obtenerResponsables',
        OBTENER_TIPOS_DOCUMENTO: 'obtenerTiposDocumento',
        OBTENER_DOCUMENTOS_DISPONIBLES: 'obtenerDocumentosDisponibles',
        OBTENER_SEGUIMIENTOS: 'obtenerSeguimientos',
        OBTENER_DETALLE: 'obtenerDetalleSeguimiento',
        OBTENER_TIMELINE: 'obtenerTimelineSeguimiento',
        AGREGAR_SEGUIMIENTO: 'agregarSeguimiento',
        ACTUALIZAR_ESTADO: 'actualizarEstadoSeguimiento',
        EXPORTAR: 'exportarSeguimiento',
        GENERAR_RESUMEN: 'generarResumenEjecutivo'
    };

    // ==================== ESTADO OPTIMIZADO ====================
    let state = {
        datosSeguimiento: [],
        filtrosActivos: {},
        paginaActual: 1,
        totalPaginas: 0,
        cargando: false,
        vistaActual: 'tabla', // Siempre tabla
        cache: new Map(),
        observadores: new Map(),
        autoRefreshTimer: null,
        ultimaActualizacion: null,
        requestController: null,
        isOnline: navigator.onLine,
        inicializado: false,
        usuarioId: null,
        nombreUsuario: null,
        puedeGestionar: false
    };

    // ==================== UTILIDADES OPTIMIZADAS ====================
    const Utils = {
        /**
         * Debounce optimizado
         */
        debounce(func, delay, immediate = false) {
            let timeoutId;
            return function debounced(...args) {
                const callNow = immediate && !timeoutId;
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    timeoutId = null;
                    if (!immediate) func.apply(this, args);
                }, delay);
                if (callNow) func.apply(this, args);
            };
        },

        /**
         * Sanitización HTML mejorada
         */
        htmlEscape(str) {
            if (!str && str !== 0) return '';
            const div = document.createElement('div');
            div.textContent = String(str);
            return div.innerHTML;
        },

        /**
         * Validación de entrada
         */
        sanitizeInput(input, maxLength = 1000) {
            if (!input) return '';
            return String(input).trim().substring(0, maxLength);
        },

        /**
         * Formateo de fecha optimizado
         */
        formatearFecha(fecha, opciones = {}) {
            if (!fecha) return 'N/A';
            
            try {
                const date = new Date(fecha);
                if (isNaN(date.getTime())) return 'Fecha inválida';
                
                const opcionesPorDefecto = {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    ...opciones
                };
                
                return date.toLocaleDateString('es-PE', opcionesPorDefecto);
            } catch (error) {
                console.error('Error formateando fecha:', error);
                return 'Fecha inválida';
            }
        },

        /**
         * Fecha relativa optimizada
         */
        formatearFechaRelativa(fecha) {
            if (!fecha) return 'N/A';
            try {
                const ahora = new Date();
                const fechaObj = new Date(fecha);
                const diferencia = ahora - fechaObj;
                
                const minutos = Math.floor(diferencia / (1000 * 60));
                const horas = Math.floor(diferencia / (1000 * 60 * 60));
                const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
                
                if (minutos < 1) return 'Ahora';
                if (minutos < 60) return `Hace ${minutos} min`;
                if (horas < 24) return `Hace ${horas}h`;
                if (dias === 0) return 'Hoy';
                if (dias === 1) return 'Ayer';
                if (dias < 7) return `Hace ${dias} días`;
                if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
                if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
                return `Hace ${Math.floor(dias / 365)} años`;
            } catch (error) {
                return this.formatearFecha(fecha);
            }
        },

        /**
         * Calcular progreso basado en estado BD
         */
        calcularProgreso(estado) {
            const progreso = {
                [ESTADOS_SEGUIMIENTO.PENDIENTE]: 25,
                [ESTADOS_SEGUIMIENTO.OBSERVADO]: 50,
                [ESTADOS_SEGUIMIENTO.APROBADO]: 100,
                [ESTADOS_SEGUIMIENTO.RECHAZADO]: 0,
                [ESTADOS_FRONTEND.EN_REVISION]: 25,
                [ESTADOS_FRONTEND.COMPLETADO]: 100
            };
            return Math.max(0, Math.min(100, progreso[estado] || 0));
        },

        /**
         * Verificar si está retrasado
         */
        estaRetrasado(fechaLimite, estado, toleranciaDias = 0) {
            if (!fechaLimite || estado === ESTADOS_SEGUIMIENTO.APROBADO || estado === ESTADOS_FRONTEND.COMPLETADO) 
                return false;
            const ahora = new Date();
            const limite = new Date(fechaLimite);
            const diferenciaDias = Math.floor((ahora - limite) / (1000 * 60 * 60 * 24));
            return diferenciaDias > toleranciaDias;
        },

        /**
         * Clases CSS optimizadas
         */
        getClasePrioridad(prioridad) {
            const clases = {
                [PRIORIDADES.URGENTE]: 'text-danger fw-bold',
                [PRIORIDADES.ALTA]: 'text-danger fw-bold',
                [PRIORIDADES.MEDIA]: 'text-warning fw-semibold',
                [PRIORIDADES.BAJA]: 'text-muted'
            };
            return clases[prioridad] || 'text-muted';
        },

        getClaseEstado(estado) {
            const clases = {
                [ESTADOS_FRONTEND.EN_REVISION]: 'badge bg-primary',
                [ESTADOS_SEGUIMIENTO.PENDIENTE]: 'badge bg-warning',
                [ESTADOS_SEGUIMIENTO.APROBADO]: 'badge bg-success',
                [ESTADOS_FRONTEND.COMPLETADO]: 'badge bg-success',
                [ESTADOS_SEGUIMIENTO.OBSERVADO]: 'badge bg-warning',
                [ESTADOS_SEGUIMIENTO.RECHAZADO]: 'badge bg-danger'
            };
            return clases[estado] || 'badge bg-secondary';
        },

        /**
         * Validación de formulario
         */
        validarFormulario(formulario) {
            if (!formulario) return false;
            
            const elementos = formulario.querySelectorAll('[required]');
            let valido = true;
            let primerError = null;

            elementos.forEach(elemento => {
                const valor = elemento.value?.trim() || '';
                const esValido = valor.length > 0;
                
                elemento.classList.toggle('is-invalid', !esValido);
                elemento.classList.toggle('is-valid', esValido);
                
                if (!esValido && !primerError) {
                    primerError = elemento;
                    valido = false;
                }
            });

            if (primerError) {
                primerError.focus();
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return valido;
        },

        /**
         * Generar ID único
         */
        generarId() {
            return `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },

        /**
         * Animación de contador
         */
        animarContador(elemento, desde, hasta, duracion = 1000) {
            if (!elemento || desde === hasta) {
                if (elemento) elemento.textContent = hasta;
                return;
            }

            const diferencia = hasta - desde;
            const incremento = diferencia / (duracion / 16);
            let actual = desde;

            const animar = () => {
                actual += incremento;
                const siguiente = (incremento > 0 && actual >= hasta) || (incremento < 0 && actual <= hasta);
                
                if (siguiente) {
                    elemento.textContent = hasta;
                } else {
                    elemento.textContent = Math.floor(actual);
                    requestAnimationFrame(animar);
                }
            };

            requestAnimationFrame(animar);
        }
    };

    // ==================== SISTEMA DE CACHE OPTIMIZADO ====================
    const Cache = {
        _storage: new Map(),

        set(clave, valor, duracion = CONFIG.CACHE_DURATION) {
            const expiracion = Date.now() + duracion;
            this._storage.set(clave, { valor, expiracion, created: Date.now() });
            this._cleanup();
        },

        get(clave) {
            const entrada = this._storage.get(clave);
            if (!entrada) return null;
            
            if (Date.now() > entrada.expiracion) {
                this.delete(clave);
                return null;
            }
            
            return entrada.valor;
        },

        delete(clave) {
            this._storage.delete(clave);
        },

        clear() {
            this._storage.clear();
        },

        has(clave) {
            return this.get(clave) !== null;
        },

        _cleanup() {
            if (this._storage.size > 50) {
                const entries = Array.from(this._storage.entries())
                    .sort(([,a], [,b]) => a.created - b.created);
                
                const toDelete = Math.floor(entries.length * 0.2);
                for (let i = 0; i < toDelete; i++) {
                    this.delete(entries[i][0]);
                }
            }
        }
    };

    // ==================== SISTEMA DE NOTIFICACIONES ====================
    const Notificaciones = {
        _container: null,

        init() {
            if (!this._container) {
                this._container = document.getElementById('toastContainer');
                if (!this._container) {
                    this._container = document.createElement('div');
                    this._container.id = 'toastContainer';
                    this._container.className = 'toast-container position-fixed top-0 end-0 p-3';
                    this._container.style.zIndex = '1080';
                    document.body.appendChild(this._container);
                }
            }
        },

        crear(mensaje, tipo = 'info', duracion = CONFIG.TOAST_DURATION) {
            this.init();
            
            const iconos = {
                success: 'bi-check-circle-fill text-success',
                error: 'bi-x-circle-fill text-danger',
                warning: 'bi-exclamation-triangle-fill text-warning',
                info: 'bi-info-circle-fill text-info'
            };

            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi ${iconos[tipo]} me-2"></i>
                    <strong class="me-auto">${this.getTitulo(tipo)}</strong>
                    <small>Ahora</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
                </div>
                <div class="toast-body">${Utils.htmlEscape(mensaje)}</div>
            `;

            this._container.appendChild(toast);

            // Usar Bootstrap si está disponible
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                const bsToast = new bootstrap.Toast(toast, { delay: duracion });
                bsToast.show();

                toast.addEventListener('hidden.bs.toast', () => {
                    toast.remove();
                });
            } else {
                // Fallback sin Bootstrap
                toast.style.display = 'block';
                setTimeout(() => {
                    toast.remove();
                }, duracion);
            }
        },

        getTitulo(tipo) {
            const titulos = {
                success: 'Éxito',
                error: 'Error',
                warning: 'Advertencia',
                info: 'Información'
            };
            return titulos[tipo] || 'Notificación';
        },

        exito(mensaje) { return this.crear(mensaje, 'success'); },
        error(mensaje) { return this.crear(mensaje, 'error', CONFIG.TOAST_DURATION * 2); },
        advertencia(mensaje) { return this.crear(mensaje, 'warning'); },
        info(mensaje) { return this.crear(mensaje, 'info'); }
    };

    // ==================== API CLIENT OPTIMIZADO ====================
    const ApiClient = {
        async request(accion, parametros = {}, opciones = {}) {
            const {
                metodo = 'POST',
                cache = false,
                reintentos = CONFIG.RETRY_ATTEMPTS,
                timeout = CONFIG.CONNECTION_TIMEOUT
            } = opciones;

            const cacheKey = cache ? `${accion}_${JSON.stringify(parametros)}` : null;

            // Verificar cache
            if (cache && Cache.has(cacheKey)) {
                console.log(`📋 Cache hit para ${accion}`);
                return Cache.get(cacheKey);
            }

            // Verificar conexión
            if (!navigator.onLine) {
                throw new Error('Sin conexión a internet');
            }

            const body = new URLSearchParams({
                action: accion,
                timestamp: Date.now(),
                ...parametros
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                for (let intento = 0; intento <= reintentos; intento++) {
                    try {
                        console.log(`🚀 Llamando ${accion} (intento ${intento + 1}/${reintentos + 1})`);
                        
                        const response = await fetch(CONFIG.API_ENDPOINT, {
                            method: metodo,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'X-Requested-With': 'XMLHttpRequest',
                                'Cache-Control': 'no-cache'
                            },
                            body: body.toString(),
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (!response.ok) {
                            if (response.status === 401) {
                                window.location.href = 'login.jsp';
                                return;
                            }
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            const text = await response.text();
                            console.error('Respuesta no JSON:', text);
                            throw new Error('Respuesta no es JSON válido');
                        }

                        const data = await response.json();
                        console.log(`✅ Respuesta ${accion}:`, data);

                        if (!data.success) {
                            throw new Error(data.message || 'Error desconocido del servidor');
                        }

                        // Guardar en cache
                        if (cache && cacheKey) {
                            Cache.set(cacheKey, data, CONFIG.CACHE_DURATION);
                        }

                        return data;

                    } catch (error) {
                        if (error.name === 'AbortError') {
                            throw new Error('Solicitud cancelada');
                        }

                        console.error(`❌ Intento ${intento + 1} fallido para ${accion}:`, error);

                        if (intento === reintentos) {
                            throw error;
                        }

                        const delay = CONFIG.RETRY_DELAY * Math.pow(2, intento);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            } finally {
                clearTimeout(timeoutId);
            }
        }
    };

    // ==================== MANEJO DE UI OPTIMIZADO ====================
    const UI = {
        mostrarCargando(mostrar, contenedor = 'contenedorSeguimiento') {
            const container = document.getElementById(contenedor);
            if (!container) return;

            if (mostrar) {
                container.innerHTML = `
                    <div class="d-flex justify-content-center align-items-center p-5">
                        <div class="spinner-border text-primary me-3" role="status" aria-hidden="true"></div>
                        <span>Cargando seguimiento de documentos...</span>
                    </div>
                `;
            }
        },

        mostrarEstadoVacio(contenedor, mensaje = 'No hay documentos en seguimiento') {
            const container = document.getElementById(contenedor);
            if (!container) return;

            container.innerHTML = `
                <div class="text-center p-5">
                    <div class="mb-4">
                        <i class="bi bi-activity display-1 text-muted"></i>
                    </div>
                    <h5 class="text-muted">Sin seguimientos</h5>
                    <p class="text-muted">${Utils.htmlEscape(mensaje)}</p>
                    ${state.puedeGestionar ? `
                        <button type="button" class="btn btn-primary mt-3" 
                                data-bs-toggle="modal" data-bs-target="#modalAgregarSeguimiento">
                            <i class="bi bi-plus-lg me-1"></i>
                            Agregar Primer Seguimiento
                        </button>
                    ` : ''}
                </div>
            `;
        },

        renderizarSeguimiento(seguimientos) {
            const container = document.getElementById('contenedorSeguimiento');
            if (!container) return;

            if (!seguimientos || seguimientos.length === 0) {
                this.mostrarEstadoVacio('contenedorSeguimiento', 'No se encontraron documentos con los filtros aplicados');
                return;
            }

            // Siempre mostrar como tabla
            container.innerHTML = this.crearTablaSeguimiento(seguimientos);

            // Actualizar contador
            const contador = document.getElementById('contadorDocumentos');
            if (contador) {
                contador.textContent = seguimientos.length;
            }
        },

// Corrección para la función crearTablaSeguimiento dentro del objeto UI en seguimiento.js

crearTablaSeguimiento(seguimientos) {
    return `
        <div class="table-responsive">
            <table class="table table-striped table-hover mb-0">
                <thead class="table-dark">
                    <tr>
                        <th style="min-width: 220px;">Documento</th>
                        <th style="min-width: 150px;">Proyecto</th>
                        <th style="min-width: 200px;">Responsable</th>
                        <th style="min-width: 120px;">Estado</th>
                        <th style="min-width: 100px;">Prioridad</th>
                        <th style="min-width: 100px;">Progreso</th>
                        <th style="min-width: 130px;">Fecha Límite</th>
                        <th style="min-width: 150px;">Última Actualización</th>
                        <th style="min-width: 120px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${seguimientos.map(seg => this.crearFilaSeguimiento(seg)).join('')}
                </tbody>
            </table>
        </div>
    `;
},

// 2. MODIFICACIÓN A LA FUNCIÓN crearFilaSeguimiento
crearFilaSeguimiento(seguimiento) {
    const progreso = Utils.calcularProgreso(seguimiento.estado);
    const esRetrasado = Utils.estaRetrasado(seguimiento.fechaLimite, seguimiento.estado);
    
    return `
        <tr ${esRetrasado ? 'class="table-warning"' : ''} data-seguimiento-id="${seguimiento.id}">
            <td>
                <div class="fw-medium text-primary" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${Utils.htmlEscape(seguimiento.codigoDocumento)}</div>
                <small class="text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${Utils.htmlEscape(seguimiento.tituloDocumento)}</small>
            </td>
            <td>
                <span class="badge bg-light text-dark" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 100%;">${Utils.htmlEscape(seguimiento.proyectoNombre || 'Sin proyecto')}</span>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm me-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 32px; height: 32px; font-size: 14px;">
                        ${Utils.htmlEscape((seguimiento.responsableNombre || 'U').charAt(0).toUpperCase())}
                    </div>
                    <div style="min-width: 0; flex: 1;">
                        <div class="fw-medium" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${Utils.htmlEscape(seguimiento.responsableNombre || 'Sin asignar')}</div>
                        <small class="text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${Utils.htmlEscape(seguimiento.responsableEmail || '')}</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="${Utils.getClaseEstado(seguimiento.estado)}">
                    ${seguimiento.estado}
                </span>
                ${esRetrasado ? '<i class="bi bi-exclamation-triangle text-danger ms-1" title="Retrasado"></i>' : ''}
            </td>
            <td>
                <span class="${Utils.getClasePrioridad(seguimiento.prioridad)}">${seguimiento.prioridad || 'Media'}</span>
            </td>
            <td>
                <div class="progress mb-1" style="height: 6px;">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${progreso}%" aria-valuenow="${progreso}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <small class="text-muted">${progreso}%</small>
            </td>
            <td>
                <div>${Utils.formatearFecha(seguimiento.fechaLimite)}</div>
                <small class="text-muted">${Utils.formatearFechaRelativa(seguimiento.fechaLimite)}</small>
            </td>
            <td>
                <div>${Utils.formatearFecha(seguimiento.ultimaActualizacion)}</div>
                <small class="text-muted">${Utils.formatearFechaRelativa(seguimiento.ultimaActualizacion)}</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    ${this.crearBotonesAccion(seguimiento)}
                </div>
            </td>
        </tr>
    `;
},

        crearBotonesAccion(seguimiento) {
            let botones = '';

            if (seguimiento.estado !== ESTADOS_SEGUIMIENTO.APROBADO && seguimiento.estado !== ESTADOS_FRONTEND.COMPLETADO) {
                botones += `
                    <button type="button" 
                            class="btn btn-outline-primary" 
                            onclick="SeguimientoApp.abrirModalActualizar(${seguimiento.id})" 
                            title="Actualizar estado"
                            aria-label="Actualizar estado de ${seguimiento.codigoDocumento}">
                        <i class="bi bi-arrow-up-circle"></i>
                    </button>
                `;
            }

            botones += `
                <button type="button" 
                        class="btn btn-outline-info" 
                        onclick="SeguimientoApp.verTimeline(${seguimiento.id})" 
                        title="Ver cronología"
                        aria-label="Ver cronología de ${seguimiento.codigoDocumento}">
                    <i class="bi bi-clock-history"></i>
                </button>
            `;

            botones += `
                <button type="button" 
                        class="btn btn-outline-secondary" 
                        onclick="SeguimientoApp.verDetalles(${seguimiento.id})" 
                        title="Ver detalles"
                        aria-label="Ver detalles de ${seguimiento.codigoDocumento}">
                    <i class="bi bi-eye"></i>
                </button>
            `;

            return botones;
        }
    };

    // ==================== FUNCIONES PRINCIPALES ====================

    async function inicializar() {
        try {
            console.log('🚀 Inicializando módulo de Seguimiento v2.0.0...');
            
            if (state.inicializado) {
                console.log('⚠️ Módulo ya inicializado');
                return;
            }

            // Cargar configuración global
            if (window.SEGUIMIENTO_CONFIG) {
                state.usuarioId = window.SEGUIMIENTO_CONFIG.usuarioId;
                state.nombreUsuario = window.SEGUIMIENTO_CONFIG.nombreUsuario;
                state.puedeGestionar = window.SEGUIMIENTO_CONFIG.puedeGestionar;
            }
            
            // Ocultar botón de Vista Kanban
            const toggleBtn = document.getElementById('toggleViewBtn');
            if (toggleBtn) {
                toggleBtn.style.display = 'none';
            }
            
            configurarEventos();
            
            await Promise.allSettled([
                cargarEstadisticas(),
                cargarDatosIniciales(),
                cargarSeguimientos()
            ]);

            configurarAutoRefresh();
            configurarDeteccionConexion();
            
            state.inicializado = true;
            console.log('✅ Módulo de Seguimiento inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando módulo:', error);
            Notificaciones.error('Error al inicializar la aplicación de seguimiento');
        }
    }

    function configurarEventos() {
        // Configurar filtros
        const filtros = ['filtroEstado', 'filtroTipoDocumento', 'filtroProyecto', 'filtroResponsable', 'filtroPrioridad', 'filtroFechaInicio', 'filtroFechaFin'];
        filtros.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.addEventListener('change', Utils.debounce(aplicarFiltros, CONFIG.DEBOUNCE_DELAY));
                console.log(`✅ Filtro ${id} configurado`);
            }
        });

        // Configurar búsqueda
        const busqueda = document.getElementById('filtroBusqueda');
        if (busqueda) {
            busqueda.addEventListener('input', Utils.debounce(aplicarFiltros, CONFIG.DEBOUNCE_DELAY));
            busqueda.addEventListener('input', (e) => {
                if (e.target.value.length > CONFIG.MAX_SEARCH_LENGTH) {
                    e.target.value = e.target.value.substring(0, CONFIG.MAX_SEARCH_LENGTH);
                    Notificaciones.advertencia(`Búsqueda limitada a ${CONFIG.MAX_SEARCH_LENGTH} caracteres`);
                }
            });
        }

        // Configurar botón de actualizar
        const actualizarBtn = document.getElementById('btnActualizarTodos');
        if (actualizarBtn) {
            actualizarBtn.addEventListener('click', () => actualizarTodos());
        }

        // Configurar formularios
        const formAgregar = document.getElementById('formAgregarSeguimiento');
        if (formAgregar) {
            formAgregar.addEventListener('submit', (e) => {
                e.preventDefault();
                agregarSeguimiento();
            });
        }

        const formActualizar = document.getElementById('formActualizarEstado');
        if (formActualizar) {
            formActualizar.addEventListener('submit', (e) => {
                e.preventDefault();
                actualizarEstado();
            });
        }
    }

    function configurarAutoRefresh() {
        if (state.autoRefreshTimer) {
            clearInterval(state.autoRefreshTimer);
        }

        state.autoRefreshTimer = setInterval(async () => {
            try {
                if (document.visibilityState === 'visible' && navigator.onLine) {
                    const modalesAbiertos = document.querySelectorAll('.modal.show');
                    if (modalesAbiertos.length === 0) {
                        await cargarEstadisticas();
                        
                        state.autoRefreshCycle = (state.autoRefreshCycle || 0) + 1;
                        if (state.autoRefreshCycle >= 3) {
                            await cargarSeguimientos();
                            state.autoRefreshCycle = 0;
                        }
                    }
                }
            } catch (error) {
                console.warn('Error en auto-refresh:', error);
            }
        }, CONFIG.AUTO_REFRESH_INTERVAL);
    }

    function configurarDeteccionConexion() {
        window.addEventListener('online', () => {
            state.isOnline = true;
            Notificaciones.exito('Conexión restaurada');
            cargarSeguimientos();
        });

        window.addEventListener('offline', () => {
            state.isOnline = false;
            Notificaciones.advertencia('Sin conexión a internet');
        });
    }

    // ==================== FUNCIONES DE DATOS ====================

    async function cargarEstadisticas() {
        try {
            console.log('📊 Cargando estadísticas...');
            const data = await ApiClient.request(ACCIONES.OBTENER_ESTADISTICAS, {}, { 
                cache: true,
                timeout: 5000
            });
            
            if (data.success) {
                actualizarEstadisticas(data.estadisticas);
                console.log('✅ Estadísticas cargadas');
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            if (!state.autoRefreshTimer) {
                Notificaciones.error('Error al cargar estadísticas');
            }
        }
    }

    function actualizarEstadisticas(stats) {
        const elementos = {
            statEnProceso: stats.enProceso || 0,
            statCompletados: stats.completados || 0,
            statPendientes: stats.pendientes || 0,
            statRetrasados: stats.retrasados || 0
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                const valorActual = parseInt(elemento.textContent) || 0;
                if (valorActual !== valor) {
                    Utils.animarContador(elemento, valorActual, valor);
                }
            }
        });
    }

    async function cargarDatosIniciales() {
        try {
            console.log('📋 Cargando datos iniciales...');
            const requests = [
                ApiClient.request(ACCIONES.OBTENER_PROYECTOS, {}, { cache: true }),
                ApiClient.request(ACCIONES.OBTENER_RESPONSABLES, {}, { cache: true }),
                ApiClient.request(ACCIONES.OBTENER_DOCUMENTOS_DISPONIBLES, {}, { cache: true }),
                ApiClient.request(ACCIONES.OBTENER_TIPOS_DOCUMENTO, {}, { cache: true })
            ];

            const [proyectosResponse, responsablesResponse, documentosResponse, tiposResponse] = await Promise.allSettled(requests);

            if (proyectosResponse.status === 'fulfilled' && proyectosResponse.value.success) {
                llenarSelectProyectos(proyectosResponse.value.proyectos);
            }

            if (responsablesResponse.status === 'fulfilled' && responsablesResponse.value.success) {
                llenarSelectResponsables(responsablesResponse.value.responsables);
            }

            if (documentosResponse.status === 'fulfilled' && documentosResponse.value.success) {
                llenarSelectDocumentos(documentosResponse.value.documentos);
            }

            if (tiposResponse.status === 'fulfilled' && tiposResponse.value.success) {
                llenarSelectTiposDocumento(tiposResponse.value.tipos);
            }

        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            Notificaciones.error('Error al cargar datos iniciales');
        }
    }

    function llenarSelectProyectos(proyectos) {
        const select = document.getElementById('filtroProyecto');
        if (!select) return;

        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        proyectos.forEach(proyecto => {
            const option = new Option(proyecto.nombre, proyecto.id);
            select.add(option);
        });
    }

    function llenarSelectResponsables(responsables) {
        const selects = ['filtroResponsable', 'responsableSeguimiento'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            responsables.forEach(responsable => {
                const option = new Option(
                    `${responsable.nombre} (${responsable.email})`, 
                    responsable.id
                );
                select.add(option);
            });
        });
    }

    function llenarSelectDocumentos(documentos) {
        const select = document.getElementById('documentoSeguimiento');
        if (!select) return;

        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        documentos.forEach(documento => {
            const option = new Option(
                `${documento.codigo} - ${documento.titulo}`, 
                documento.id
            );
            select.add(option);
        });
    }

    function llenarSelectTiposDocumento(tipos) {
        const select = document.getElementById('filtroTipoDocumento');
        if (!select) return;

        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        tipos.forEach(tipo => {
            const option = new Option(tipo.nombre, tipo.nombre);
            select.add(option);
        });
    }

    async function cargarSeguimientos() {
        try {
            state.cargando = true;
            UI.mostrarCargando(true);

            const parametros = {
                page: state.paginaActual,
                size: CONFIG.ITEMS_POR_PAGINA,
                ...state.filtrosActivos
            };

            console.log('📋 Cargando seguimientos con parámetros:', parametros);
            const data = await ApiClient.request(ACCIONES.OBTENER_SEGUIMIENTOS, parametros);
            
            if (data.success) {
                state.datosSeguimiento = data.seguimientos || [];
                state.totalPaginas = data.totalPages || 0;
                state.ultimaActualizacion = Date.now();

                UI.renderizarSeguimiento(state.datosSeguimiento);
                
                actualizarPaginacion(data.totalPages, data.currentPage);
                
                console.log(`✅ Seguimientos cargados: ${data.seguimientos?.length || 0} de ${data.totalRecords || 0} total`);
            } else {
                throw new Error(data.message || 'Error al cargar seguimientos');
            }

        } catch (error) {
            console.error('❌ Error cargando seguimientos:', error);
            Notificaciones.error('Error al cargar seguimientos: ' + error.message);
            UI.mostrarEstadoVacio('contenedorSeguimiento', 'Error al cargar los datos');
        } finally {
            state.cargando = false;
        }
    }

    // ==================== API PÚBLICA ====================

    function aplicarFiltros() {
        console.log('🔍 Aplicando filtros...');
        
        const filtros = {
            estado: document.getElementById('filtroEstado')?.value || '',
            tipoDocumento: document.getElementById('filtroTipoDocumento')?.value || '',
            proyecto: document.getElementById('filtroProyecto')?.value || '',
            responsable: document.getElementById('filtroResponsable')?.value || '',
            prioridad: document.getElementById('filtroPrioridad')?.value || '',
            fechaInicio: document.getElementById('filtroFechaInicio')?.value || '',
            fechaFin: document.getElementById('filtroFechaFin')?.value || '',
            busqueda: Utils.sanitizeInput(document.getElementById('filtroBusqueda')?.value || '', CONFIG.MAX_SEARCH_LENGTH)
        };

        const filtrosLimpios = Object.fromEntries(
            Object.entries(filtros).filter(([key, value]) => value !== '')
        );

        console.log('🔍 Filtros activos:', filtrosLimpios);

        state.filtrosActivos = filtrosLimpios;
        state.paginaActual = 1;

        Cache.clear();
        cargarSeguimientos();
    }

    function limpiarFiltros() {
        console.log('🧹 Limpiando filtros...');
        
        const filtroIds = ['filtroEstado', 'filtroTipoDocumento', 'filtroProyecto', 'filtroResponsable', 'filtroPrioridad', 'filtroFechaInicio', 'filtroFechaFin', 'filtroBusqueda'];
        
        filtroIds.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.value = '';
        });

        state.filtrosActivos = {};
        state.paginaActual = 1;

        Cache.clear();
        cargarSeguimientos();
    }

    async function agregarSeguimiento() {
        const form = document.getElementById('formAgregarSeguimiento');
        
        if (!Utils.validarFormulario(form)) {
            form.classList.add('was-validated');
            return;
        }

        const documentoId = document.getElementById('documentoSeguimiento').value;
        const responsableId = document.getElementById('responsableSeguimiento').value;
        const prioridad = document.getElementById('prioridadSeguimiento').value;
        const fechaLimite = document.getElementById('fechaLimiteSeguimiento').value;
        const observaciones = Utils.sanitizeInput(document.getElementById('observacionesSeguimiento').value);

        try {
            state.cargando = true;

            console.log('➕ Agregando seguimiento:', { documentoId, responsableId, prioridad, fechaLimite });
            
            const data = await ApiClient.request(ACCIONES.AGREGAR_SEGUIMIENTO, {
                documentoId,
                responsableId,
                prioridad,
                fechaLimite,
                observaciones
            });
            
            if (data.success) {
                Notificaciones.exito('Seguimiento agregado correctamente');
                
                // Cerrar modal
                const modalElement = document.getElementById('modalAgregarSeguimiento');
                if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                form.reset();
                form.classList.remove('was-validated');
                
                Cache.clear();
                await Promise.all([
                    cargarSeguimientos(),
                    cargarEstadisticas()
                ]);
            } else {
                Notificaciones.error('Error al agregar seguimiento: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al agregar seguimiento: ' + error.message);
        } finally {
            state.cargando = false;
        }
    }

    async function abrirModalActualizar(seguimientoId) {
        try {
            state.cargando = true;

            console.log('📝 Abriendo modal actualizar para seguimiento:', seguimientoId);
            
            const data = await ApiClient.request(ACCIONES.OBTENER_DETALLE, { id: seguimientoId });
            
            if (data.success) {
                const seg = data.seguimiento;
                
                document.getElementById('seguimientoId').value = seg.id;
                document.getElementById('infoDocumentoActualizar').innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <div class="fw-bold">${Utils.htmlEscape(seg.codigoDocumento)}</div>
                            <div class="text-muted">${Utils.htmlEscape(seg.tituloDocumento)}</div>
                            <small>Proyecto: ${Utils.htmlEscape(seg.proyectoNombre || 'Sin proyecto')}</small>
                            <div class="mt-2">
                                <span class="${Utils.getClaseEstado(seg.estado)}">Estado actual: ${seg.estado}</span>
                                <span class="${Utils.getClasePrioridad(seg.prioridad)} ms-1">Prioridad: ${seg.prioridad}</span>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('nuevoEstado').value = '';
                document.getElementById('comentarioActualizacion').value = '';
                document.getElementById('formActualizarEstado').classList.remove('was-validated');
                
                // Abrir modal
                const modalElement = document.getElementById('modalActualizarEstado');
                if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
            } else {
                Notificaciones.error('Error al cargar detalles: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar detalles: ' + error.message);
        } finally {
            state.cargando = false;
        }
    }

    async function actualizarEstado() {
        const form = document.getElementById('formActualizarEstado');
        
        if (!Utils.validarFormulario(form)) {
            form.classList.add('was-validated');
            return;
        }

        const seguimientoId = document.getElementById('seguimientoId').value;
        const nuevoEstado = document.getElementById('nuevoEstado').value;
        const comentario = Utils.sanitizeInput(document.getElementById('comentarioActualizacion').value);

        try {
            state.cargando = true;

            console.log('🔄 Actualizando estado:', { seguimientoId, nuevoEstado, comentario });
            
            const data = await ApiClient.request(ACCIONES.ACTUALIZAR_ESTADO, {
                id: seguimientoId,
                estado: nuevoEstado,
                comentario: comentario
            });
            
            if (data.success) {
                Notificaciones.exito('Estado actualizado correctamente');
                
                // Cerrar modal
                const modalElement = document.getElementById('modalActualizarEstado');
                if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                Cache.clear();
                await Promise.all([
                    cargarSeguimientos(),
                    cargarEstadisticas()
                ]);
            } else {
                Notificaciones.error('Error al actualizar estado: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al actualizar estado: ' + error.message);
        } finally {
            state.cargando = false;
        }
    }

    async function verTimeline(seguimientoId) {
        try {
            state.cargando = true;

            console.log('📅 Cargando timeline para seguimiento:', seguimientoId);
            
            const data = await ApiClient.request(ACCIONES.OBTENER_TIMELINE, { id: seguimientoId });
            
            if (data.success) {
                const timeline = data.timeline;
                
                document.getElementById('timelineContent').innerHTML = `
                    <div class="timeline">
                        ${timeline.map((evento, index) => `
                            <div class="timeline-item" style="animation-delay: ${index * 0.1}s">
                                <div class="timeline-content">
                                    <div class="timeline-header">
                                        <h6 class="timeline-title">${Utils.htmlEscape(evento.titulo)}</h6>
                                        <span class="timeline-date">${Utils.formatearFecha(evento.fecha)} (${Utils.formatearFechaRelativa(evento.fecha)})</span>
                                    </div>
                                    <div class="timeline-body">
                                        <p class="mb-2">${Utils.htmlEscape(evento.descripcion)}</p>
                                        ${evento.comentario ? `<small class="text-muted">Comentario: ${Utils.htmlEscape(evento.comentario)}</small>` : ''}
                                        <div class="mt-2">
                                            <small class="text-muted">Por: ${Utils.htmlEscape(evento.usuarioNombre)}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Abrir modal
                const modalElement = document.getElementById('modalTimeline');
                if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
            } else {
                Notificaciones.error('Error al cargar timeline: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar timeline: ' + error.message);
        } finally {
            state.cargando = false;
        }
    }

    async function verDetalles(seguimientoId) {
        try {
            console.log('👁️ Cargando detalles para seguimiento:', seguimientoId);
            
            const data = await ApiClient.request(ACCIONES.OBTENER_DETALLE, { id: seguimientoId });
            
            if (data.success) {
                const seg = data.seguimiento;
                const progreso = Utils.calcularProgreso(seg.estado);
                
                const modalId = 'modalDetalles' + Utils.generarId();
                const modalHtml = `
                    <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">
                                        <i class="bi bi-eye me-2"></i>
                                        Detalles de Seguimiento - ${Utils.htmlEscape(seg.codigoDocumento)}
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6>Información del Documento</h6>
                                            <p><strong>Código:</strong> ${Utils.htmlEscape(seg.codigoDocumento)}</p>
                                            <p><strong>Título:</strong> ${Utils.htmlEscape(seg.tituloDocumento)}</p>
                                            <p><strong>Tipo:</strong> ${Utils.htmlEscape(seg.tipoDocumento || 'N/A')}</p>
                                            <p><strong>Proyecto:</strong> ${Utils.htmlEscape(seg.proyectoNombre || 'Sin proyecto')}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6>Estado del Seguimiento</h6>
                                            <p><strong>Estado:</strong> <span class="${Utils.getClaseEstado(seg.estado)}">${seg.estado}</span></p>
                                            <p><strong>Prioridad:</strong> <span class="${Utils.getClasePrioridad(seg.prioridad)}">${seg.prioridad}</span></p>
                                            <p><strong>Progreso:</strong> ${progreso}%</p>
                                            <div class="progress mb-3" style="height: 10px;">
                                                <div class="progress-bar bg-primary" style="width: ${progreso}%"></div>
                                            </div>
                                            <p><strong>Responsable:</strong> ${Utils.htmlEscape(seg.responsableNombre)}</p>
                                            <p><strong>Fecha Límite:</strong> ${Utils.formatearFecha(seg.fechaLimite)}</p>
                                            <p><strong>Última Actualización:</strong> ${Utils.formatearFecha(seg.ultimaActualizacion)}</p>
                                        </div>
                                    </div>
                                    ${seg.observaciones ? `
                                        <div class="mt-3">
                                            <h6>Observaciones</h6>
                                            <div class="p-3 bg-light rounded">
                                                ${Utils.htmlEscape(seg.observaciones).replace(/\n/g, '<br>')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-primary" onclick="SeguimientoApp.verTimeline(${seg.id})">
                                        <i class="bi bi-clock-history me-1"></i>
                                        Ver Cronología
                                    </button>
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHtml);
                
                // Abrir modal
                const modalElement = document.getElementById(modalId);
                if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();

                    modalElement.addEventListener('hidden.bs.modal', () => {
                        modalElement.remove();
                    });
                }
            } else {
                Notificaciones.error('Error al cargar detalles: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar detalles: ' + error.message);
        }
    }

    async function actualizarTodos() {
        try {
            state.cargando = true;
            
            console.log('🔄 Actualizando todos los datos...');
            
            Cache.clear();
            
            await Promise.allSettled([
                cargarEstadisticas(),
                cargarSeguimientos()
            ]);
            
            Notificaciones.exito('Datos actualizados correctamente');
            
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error al actualizar datos: ' + error.message);
        } finally {
            state.cargando = false;
        }
    }

    function exportarSeguimiento() {
        const params = new URLSearchParams({
            action: ACCIONES.EXPORTAR,
            timestamp: Date.now(),
            ...state.filtrosActivos
        });

        const url = `${CONFIG.API_ENDPOINT}?${params.toString()}`;
        
        const exportWindow = window.open(url, '_blank');
        
        if (!exportWindow) {
            Notificaciones.error('Por favor permita ventanas emergentes para la descarga');
        } else {
            Notificaciones.info('Iniciando descarga del reporte...');
        }
    }

    async function generarResumen() {
        try {
            state.cargando = true;

            const data = await ApiClient.request(ACCIONES.GENERAR_RESUMEN, state.filtrosActivos);
            
            if (data.success) {
                if (data.url) {
                    window.open(data.url, '_blank');
                } else if (data.content) {
                    const blob = new Blob([data.content], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `resumen_ejecutivo_${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                
                Notificaciones.exito('Resumen ejecutivo generado correctamente');
            } else {
                Notificaciones.error('Error al generar resumen: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al generar resumen: ' + error.message);
        } finally {
            state.cargando = false;
        }
    }

    function actualizarPaginacion(totalPages, currentPage) {
        const container = document.getElementById('paginacionSeguimiento');
        if (!container || totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let html = '';
        
        if (currentPage > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="SeguimientoApp.cambiarPagina(${currentPage - 1})" aria-label="Página anterior">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `;
        }

        const maxPaginasVisibles = 5;
        let inicio = Math.max(1, currentPage - Math.floor(maxPaginasVisibles / 2));
        let fin = Math.min(totalPages, inicio + maxPaginasVisibles - 1);
        
        if (fin - inicio < maxPaginasVisibles - 1) {
            inicio = Math.max(1, fin - maxPaginasVisibles + 1);
        }

        if (inicio > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="SeguimientoApp.cambiarPagina(1)">1</a></li>`;
            if (inicio > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = inicio; i <= fin; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="SeguimientoApp.cambiarPagina(${i})" aria-label="Página ${i}">${i}</a>
                </li>
            `;
        }

        if (fin < totalPages) {
            if (fin < totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" onclick="SeguimientoApp.cambiarPagina(${totalPages})">${totalPages}</a></li>`;
        }

        if (currentPage < totalPages) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="SeguimientoApp.cambiarPagina(${currentPage + 1})" aria-label="Página siguiente">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            `;
        }

        container.innerHTML = html;
    }

    function cambiarPagina(pagina) {
        if (pagina === state.paginaActual) return;
        
        state.paginaActual = pagina;
        cargarSeguimientos();
        
        document.getElementById('contenedorSeguimiento')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // ==================== CLEANUP ====================
    function cleanup() {
        if (state.autoRefreshTimer) {
            clearInterval(state.autoRefreshTimer);
        }
        
        Cache.clear();
        
        state.inicializado = false;
        console.log('🧹 Módulo SeguimientoApp limpiado');
    }

    // ==================== INICIALIZACIÓN ====================
    function initOnDOMReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inicializar);
        } else {
            setTimeout(inicializar, 100);
        }
    }

    // Llamar inicialización
    initOnDOMReady();
    
    window.addEventListener('beforeunload', cleanup);
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            console.log('📱 Página oculta - optimizando recursos');
        } else {
            console.log('📱 Página visible - reanudando operaciones');
            if (state.ultimaActualizacion && Date.now() - state.ultimaActualizacion > 60000) {
                cargarEstadisticas();
            }
        }
    });

    // ==================== API PÚBLICA ====================
    return {
        // Funciones principales
        aplicarFiltros,
        limpiarFiltros,
        agregarSeguimiento,
        abrirModalActualizar,
        actualizarEstado,
        verTimeline,
        verDetalles,
        actualizarTodos,
        cambiarPagina,
        exportarSeguimiento,
        generarResumen,
        
        // Utilidades y sistemas
        Utils,
        Cache,
        Notificaciones,
        UI,
        ApiClient,
        
        // Estado (solo lectura)
        getState: () => ({ ...state }),
        
        // Control
        inicializar,
        cleanup
    };

})();

// ==================== FUNCIONES GLOBALES ====================
// Exportar funciones principales al scope global para compatibilidad
window.aplicarFiltros = SeguimientoApp.aplicarFiltros;
window.limpiarFiltros = SeguimientoApp.limpiarFiltros;
window.agregarSeguimiento = SeguimientoApp.agregarSeguimiento;
window.abrirModalActualizar = SeguimientoApp.abrirModalActualizar;
window.actualizarEstado = SeguimientoApp.actualizarEstado;
window.verTimeline = SeguimientoApp.verTimeline;
window.verDetalles = SeguimientoApp.verDetalles;
window.actualizarTodos = SeguimientoApp.actualizarTodos;
window.cambiarPagina = SeguimientoApp.cambiarPagina;
window.exportarSeguimiento = SeguimientoApp.exportarSeguimiento;
window.generarResumen = SeguimientoApp.generarResumen;

// ==================== MANEJO DE ERRORES GLOBAL ====================
window.addEventListener('error', (event) => {
    console.error('❌ Error no manejado:', event.error);
    if (SeguimientoApp.Notificaciones?.error) {
        SeguimientoApp.Notificaciones.error('Ha ocurrido un error inesperado');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promesa rechazada no manejada:', event.reason);
    if (SeguimientoApp.Notificaciones?.error) {
        SeguimientoApp.Notificaciones.error('Error de conexión');
    }
    event.preventDefault();
});

// ==================== INFORMACIÓN DE VERSIÓN ====================
console.log(`
🚀 SeguimientoApp v2.0.0 - OPTIMIZADO
📅 Cargado: ${new Date().toLocaleString()}
🌐 Navegador: ${navigator.userAgent.split(' ').pop()}
📱 Dispositivo: ${/Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio'}
🔗 URL: ${window.location.href}
`);