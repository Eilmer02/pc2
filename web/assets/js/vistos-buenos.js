
'use strict';

const VistosBuenosApp = (function() {
    
    // ==================== CONFIGURACIÓN Y CONSTANTES ====================
    const CONFIG = {
        API_ENDPOINT: '/DocumentosParaFirmarServlet',
        ITEMS_POR_PAGINA: 10,
        DEBOUNCE_DELAY: 300,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
        TOAST_DURATION: 5000
    };

    const ESTADOS = {
        PENDIENTE: 'Pendiente',
        APROBADO: 'Aprobado',
        OBSERVADO: 'Observado'
    };

    const ACCIONES = {
        OBTENER_ESTADISTICAS: 'obtenerEstadisticasVistosBuenos',
        OBTENER_USUARIOS: 'obtenerUsuariosRevisores',
        OBTENER_DOCUMENTOS: 'obtenerDocumentosDisponibles',
        OBTENER_VISTOS_BUENOS: 'obtenerVistosBuenos',
        OBTENER_DETALLE: 'obtenerDetalleVistoBueno',
        PROCESAR_VISTO_BUENO: 'procesarVistoBueno',
        ASIGNAR_VISTO_BUENO: 'asignarVistoBueno',
        EXPORTAR: 'exportarVistosBuenos'
    };

    // ==================== ESTADO DE LA APLICACIÓN ====================
    let state = {
        datosVistosBuenos: [],
        filtrosActivos: {},
        paginaActual: 1,
        totalPaginas: 0,
        cargando: false,
        vistaActual: 'tabla', // 'tabla' o 'cards'
        cache: new Map(),
        observadores: new Map()
    };

    // ==================== UTILIDADES ====================
    const Utils = {
        /**
         * Debounce para optimizar llamadas de funciones
         */
        debounce(func, delay) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        },

        /**
         * Throttle para limitar frecuencia de ejecución
         */
        throttle(func, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Escape HTML para prevenir XSS
         */
        htmlEscape(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * Formatear fecha con opciones de localización
         */
        formatearFecha(fecha, opciones = {}) {
            if (!fecha) return 'N/A';
            try {
                const date = new Date(fecha);
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
         * Formatear fecha relativa (hace X tiempo)
         */
        formatearFechaRelativa(fecha) {
            if (!fecha) return 'N/A';
            try {
                const ahora = new Date();
                const fechaObj = new Date(fecha);
                const diferencia = ahora - fechaObj;
                const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
                
                if (dias === 0) return 'Hoy';
                if (dias === 1) return 'Ayer';
                if (dias < 7) return `Hace ${dias} días`;
                if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
                return this.formatearFecha(fecha);
            } catch (error) {
                return this.formatearFecha(fecha);
            }
        },

        /**
         * Validar formulario con mensajes personalizados
         */
        validarFormulario(formulario) {
            const elementos = formulario.querySelectorAll('[required]');
            let valido = true;

            elementos.forEach(elemento => {
                if (!elemento.value.trim()) {
                    elemento.classList.add('is-invalid');
                    valido = false;
                } else {
                    elemento.classList.remove('is-invalid');
                }
            });

            return valido;
        },

        /**
         * Generar ID único
         */
        generarId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    };

    // ==================== SISTEMA DE CACHE ====================
    const Cache = {
        set(clave, valor, duracion = CONFIG.CACHE_DURATION) {
            state.cache.set(clave, {
                valor,
                expiracion: Date.now() + duracion
            });
        },

        get(clave) {
            const entrada = state.cache.get(clave);
            if (!entrada) return null;
            
            if (Date.now() > entrada.expiracion) {
                state.cache.delete(clave);
                return null;
            }
            
            return entrada.valor;
        },

        clear() {
            state.cache.clear();
        },

        has(clave) {
            return this.get(clave) !== null;
        }
    };

    // ==================== SISTEMA DE NOTIFICACIONES ====================
    const Notificaciones = {
        crear(mensaje, tipo = 'info', duracion = CONFIG.TOAST_DURATION) {
            const container = document.getElementById('toastContainer');
            const id = Utils.generarId();
            
            const iconos = {
                success: 'bi-check-circle',
                error: 'bi-x-circle',
                warning: 'bi-exclamation-triangle',
                info: 'bi-info-circle'
            };

            const toast = document.createElement('div');
            toast.className = `toast toast-${tipo} show`;
            toast.id = id;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi ${iconos[tipo]} me-2"></i>
                    <strong class="me-auto">${this.getTitulo(tipo)}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
                </div>
                <div class="toast-body">${Utils.htmlEscape(mensaje)}</div>
            `;

            container.appendChild(toast);

            // Auto-dismiss
            setTimeout(() => {
                if (document.getElementById(id)) {
                    bootstrap.Toast.getInstance(toast)?.hide();
                }
            }, duracion);

            // Remove from DOM after hide
            toast.addEventListener('hidden.bs.toast', () => {
                toast.remove();
            });

            return id;
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

        exito(mensaje) {
            return this.crear(mensaje, 'success');
        },

        error(mensaje) {
            return this.crear(mensaje, 'error');
        },

        advertencia(mensaje) {
            return this.crear(mensaje, 'warning');
        },

        info(mensaje) {
            return this.crear(mensaje, 'info');
        }
    };

    // ==================== API CLIENT ====================
    const ApiClient = {
        /**
         * Realizar petición HTTP con reintentos y cache
         */
        async request(accion, parametros = {}, opciones = {}) {
            const {
                metodo = 'POST',
                cache = false,
                reintentos = CONFIG.RETRY_ATTEMPTS
            } = opciones;

            const cacheKey = cache ? `${accion}_${JSON.stringify(parametros)}` : null;
            
            // Verificar cache
            if (cache && Cache.has(cacheKey)) {
                return Cache.get(cacheKey);
            }

            const body = new URLSearchParams({
                action: accion,
                ...parametros
            });

            for (let intento = 0; intento <= reintentos; intento++) {
                try {
                    const response = await fetch(CONFIG.API_ENDPOINT, {
                        method: metodo,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: body.toString()
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    if (!data.success) {
                        throw new Error(data.message || 'Error desconocido del servidor');
                    }

                    // Guardar en cache si es necesario
                    if (cache && cacheKey) {
                        Cache.set(cacheKey, data);
                    }

                    return data;

                } catch (error) {
                    console.error(`Intento ${intento + 1} fallido:`, error);
                    
                    if (intento === reintentos) {
                        throw error;
                    }
                    
                    // Esperar antes del siguiente intento
                    await new Promise(resolve => 
                        setTimeout(resolve, CONFIG.RETRY_DELAY * Math.pow(2, intento))
                    );
                }
            }
        }
    };

    // ==================== GESTIÓN DE ESTADO ====================
    const StateManager = {
        /**
         * Actualizar estado y notificar observadores
         */
        setState(nuevoEstado) {
            const estadoAnterior = { ...state };
            Object.assign(state, nuevoEstado);
            this.notificarObservadores(estadoAnterior, state);
        },

        /**
         * Obtener estado actual
         */
        getState() {
            return { ...state };
        },

        /**
         * Suscribirse a cambios de estado
         */
        suscribir(clave, callback) {
            if (!state.observadores.has(clave)) {
                state.observadores.set(clave, []);
            }
            state.observadores.get(clave).push(callback);
        },

        /**
         * Desuscribirse de cambios
         */
        desuscribir(clave, callback) {
            const observadores = state.observadores.get(clave);
            if (observadores) {
                const index = observadores.indexOf(callback);
                if (index > -1) {
                    observadores.splice(index, 1);
                }
            }
        },

        /**
         * Notificar a observadores
         */
        notificarObservadores(estadoAnterior, estadoNuevo) {
            state.observadores.forEach((callbacks, clave) => {
                if (estadoAnterior[clave] !== estadoNuevo[clave]) {
                    callbacks.forEach(callback => {
                        try {
                            callback(estadoNuevo[clave], estadoAnterior[clave]);
                        } catch (error) {
                            console.error('Error en observador:', error);
                        }
                    });
                }
            });
        }
    };

    // ==================== MANEJO DE UI ====================
    const UI = {
        /**
         * Mostrar/ocultar indicador de carga
         */
        mostrarCargando(mostrar, contenedor = 'tablaVistosBuenosContainer') {
            const container = document.getElementById(contenedor);
            if (!container) return;

            if (mostrar) {
                container.innerHTML = `
                    <div class="loading-container" role="status" aria-label="Cargando">
                        <div class="loading-spinner" aria-hidden="true"></div>
                        <p>Cargando vistos buenos...</p>
                    </div>
                `;
            }
        },

        /**
         * Mostrar estado vacío
         */
        mostrarEstadoVacio(contenedor, mensaje = 'No hay datos disponibles') {
            const container = document.getElementById(contenedor);
            if (!container) return;

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="bi bi-file-earmark-check"></i>
                    </div>
                    <h5>Sin resultados</h5>
                    <p class="text-muted">${Utils.htmlEscape(mensaje)}</p>
                </div>
            `;
        },

        /**
         * Actualizar contador de caracteres
         */
        actualizarContadorCaracteres(textareaId, contadorId, limite) {
            const textarea = document.getElementById(textareaId);
            const contador = document.getElementById(contadorId);
            
            if (!textarea || !contador) return;

            const longitud = textarea.value.length;
            contador.textContent = longitud;
            
            if (longitud > limite * 0.9) {
                contador.classList.add('text-warning');
            } else {
                contador.classList.remove('text-warning');
            }
            
            if (longitud >= limite) {
                contador.classList.add('text-danger');
                contador.classList.remove('text-warning');
            } else {
                contador.classList.remove('text-danger');
            }
        },

        /**
         * Configurar validación en tiempo real
         */
        configurarValidacionTiempoReal(formulario) {
            const elementos = formulario.querySelectorAll('[required]');
            
            elementos.forEach(elemento => {
                ['blur', 'input'].forEach(evento => {
                    elemento.addEventListener(evento, () => {
                        if (elemento.value.trim()) {
                            elemento.classList.remove('is-invalid');
                            elemento.classList.add('is-valid');
                        } else {
                            elemento.classList.remove('is-valid');
                            if (evento === 'blur') {
                                elemento.classList.add('is-invalid');
                            }
                        }
                    });
                });
            });
        },

        /**
         * Toggle entre vista tabla y cards
         */
        toggleViewMode() {
            const nuevaVista = state.vistaActual === 'tabla' ? 'cards' : 'tabla';
            StateManager.setState({ vistaActual: nuevaVista });
            this.renderizarVistosBuenos(state.datosVistosBuenos);
            this.actualizarBotonVista();
        },

        /**
         * Actualizar botón de vista
         */
        actualizarBotonVista() {
            const btn = document.getElementById('toggleViewBtn');
            if (!btn) return;

            if (state.vistaActual === 'tabla') {
                btn.innerHTML = '<i class="bi bi-grid-3x3-gap" aria-hidden="true"></i> Vista Cards';
            } else {
                btn.innerHTML = '<i class="bi bi-table" aria-hidden="true"></i> Vista Tabla';
            }
        }
    };

    // ==================== FUNCIONES PRINCIPALES ====================

    /**
     * Inicialización del módulo
     */
    async function inicializar() {
        try {
            console.log('🚀 Inicializando módulo de Vistos Buenos v2.0...');
            
            // Configurar eventos
            configurarEventos();
            
            // Configurar observadores de estado
            configurarObservadores();
            
            // Cargar datos iniciales
            await Promise.all([
                cargarEstadisticas(),
                cargarDatosIniciales(),
                cargarVistosBuenos()
            ]);
            
            console.log('✅ Módulo de Vistos Buenos inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando módulo:', error);
            Notificaciones.error('Error al inicializar la aplicación');
        }
    }

    /**
     * Configurar event listeners
     */
    function configurarEventos() {
        // Atajos de teclado
        document.addEventListener('keydown', manejarAtajosTeclado);
        
        // Configurar formularios
        configurarFormularios();
        
        // Configurar filtros con debounce
        const filtros = ['filtroEstado', 'filtroFecha', 'filtroUsuario'];
        filtros.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.addEventListener('change', Utils.debounce(aplicarFiltros, CONFIG.DEBOUNCE_DELAY));
            }
        });

        const busqueda = document.getElementById('filtroBusqueda');
        if (busqueda) {
            busqueda.addEventListener('input', Utils.debounce(aplicarFiltros, CONFIG.DEBOUNCE_DELAY));
        }

        // Configurar botón de vista
        const toggleBtn = document.getElementById('toggleViewBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => UI.toggleViewMode());
        }

        // Configurar contador de caracteres
        const observacionesTextarea = document.getElementById('observacionesVistoBueno');
        if (observacionesTextarea) {
            observacionesTextarea.addEventListener('input', () => {
                UI.actualizarContadorCaracteres('observacionesVistoBueno', 'charCount', 1000);
            });
        }
    }

    /**
     * Configurar observadores de estado
     */
    function configurarObservadores() {
        StateManager.suscribir('cargando', (cargando) => {
            const botones = document.querySelectorAll('.btn[data-loading]');
            botones.forEach(btn => {
                const spinner = btn.querySelector('.spinner-border');
                if (cargando) {
                    btn.disabled = true;
                    if (spinner) spinner.classList.remove('d-none');
                } else {
                    btn.disabled = false;
                    if (spinner) spinner.classList.add('d-none');
                }
            });
        });
    }

    /**
     * Manejar atajos de teclado
     */
    function manejarAtajosTeclado(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'f':
                    event.preventDefault();
                    document.getElementById('filtroBusqueda')?.focus();
                    break;
                case 'r':
                    event.preventDefault();
                    cargarVistosBuenos();
                    break;
                case 'n':
                    event.preventDefault();
                    document.querySelector('[data-bs-target="#modalAsignarVistoBueno"]')?.click();
                    break;
            }
        }
        
        if (event.key === 'Escape') {
            cerrarModalesAbiertos();
        }
    }

    /**
     * Configurar formularios con validación
     */
    function configurarFormularios() {
        const formularios = ['formProcesarVistoBueno', 'formAsignarVistoBueno'];
        
        formularios.forEach(id => {
            const form = document.getElementById(id);
            if (form) {
                UI.configurarValidacionTiempoReal(form);
                
                // Prevenir envío por Enter accidental
                form.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                    }
                });
            }
        });
    }

    /**
     * Cargar estadísticas del dashboard
     */
    async function cargarEstadisticas() {
        try {
            const data = await ApiClient.request(ACCIONES.OBTENER_ESTADISTICAS, {}, { cache: true });
            actualizarEstadisticas(data.estadisticas);
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            Notificaciones.error('Error al cargar estadísticas');
        }
    }

    /**
     * Actualizar estadísticas en el dashboard
     */
    function actualizarEstadisticas(stats) {
        const elementos = {
            statPendientes: stats.pendientes || 0,
            statAprobados: stats.aprobados || 0,
            statObservados: stats.observados || 0,
            statTotal: stats.total || 0
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                // Animación de contador
                animarContador(elemento, parseInt(elemento.textContent) || 0, valor);
            }
        });
    }

    /**
     * Animar contador con efecto
     */
    function animarContador(elemento, desde, hasta, duracion = 1000) {
        const diferencia = hasta - desde;
        const incremento = diferencia / (duracion / 16);
        let actual = desde;

        const animar = () => {
            actual += incremento;
            if ((incremento > 0 && actual >= hasta) || (incremento < 0 && actual <= hasta)) {
                elemento.textContent = hasta;
            } else {
                elemento.textContent = Math.floor(actual);
                requestAnimationFrame(animar);
            }
        };

        animar();
    }

    /**
     * Cargar datos iniciales para filtros
     */
    async function cargarDatosIniciales() {
        try {
            const [usuariosResponse, documentosResponse] = await Promise.all([
                ApiClient.request(ACCIONES.OBTENER_USUARIOS, {}, { cache: true }),
                ApiClient.request(ACCIONES.OBTENER_DOCUMENTOS, {}, { cache: true })
            ]);

            if (usuariosResponse.success) {
                llenarSelectUsuarios(usuariosResponse.usuarios);
            }

            if (documentosResponse.success) {
                llenarSelectDocumentos(documentosResponse.documentos);
            }

        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            Notificaciones.error('Error al cargar datos iniciales');
        }
    }

    /**
     * Llenar select de usuarios
     */
    function llenarSelectUsuarios(usuarios) {
        const selects = ['filtroUsuario', 'usuarioRevisor'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            // Limpiar opciones existentes (excepto la primera)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            usuarios.forEach(usuario => {
                const option = new Option(
                    `${usuario.nombre} (${usuario.email})`, 
                    usuario.id
                );
                select.add(option);
            });
        });
    }

    /**
     * Llenar select de documentos
     */
    function llenarSelectDocumentos(documentos) {
        const select = document.getElementById('documentoAsignar');
        if (!select) return;

        // Limpiar opciones existentes (excepto la primera)
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

    /**
     * Cargar lista de vistos buenos
     */
    async function cargarVistosBuenos() {
        try {
            StateManager.setState({ cargando: true });
            UI.mostrarCargando(true);

            const parametros = {
                page: state.paginaActual,
                size: CONFIG.ITEMS_POR_PAGINA,
                ...state.filtrosActivos
            };

            const data = await ApiClient.request(ACCIONES.OBTENER_VISTOS_BUENOS, parametros);
            
            StateManager.setState({
                datosVistosBuenos: data.vistosBuenos || [],
                totalPaginas: data.totalPages || 0
            });

            UI.renderizarVistosBuenos(state.datosVistosBuenos);
            actualizarPaginacion(data.totalPages, data.currentPage);

        } catch (error) {
            console.error('❌ Error cargando vistos buenos:', error);
            Notificaciones.error('Error al cargar vistos buenos');
            UI.mostrarEstadoVacio('tablaVistosBuenosContainer', 'Error al cargar los datos');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    /**
     * Renderizar vistos buenos según la vista actual
     */
    UI.renderizarVistosBuenos = function(vistosBuenos) {
        const container = document.getElementById('tablaVistosBuenosContainer');
        if (!container) return;

        if (!vistosBuenos || vistosBuenos.length === 0) {
            UI.mostrarEstadoVacio('tablaVistosBuenosContainer', 'No se encontraron vistos buenos con los filtros aplicados');
            return;
        }

        if (state.vistaActual === 'tabla') {
            container.innerHTML = crearTablaVistosBuenos(vistosBuenos);
        } else {
            container.innerHTML = crearVistaCards(vistosBuenos);
        }
    };

    /**
     * Crear tabla de vistos buenos
     */
    function crearTablaVistosBuenos(vistosBuenos) {
        return `
            <div class="table-responsive">
                <table class="table table-vistos-buenos mb-0">
                    <thead>
                        <tr>
                            <th scope="col">Documento</th>
                            <th scope="col">Título</th>
                            <th scope="col">Revisor</th>
                            <th scope="col">Estado</th>
                            <th scope="col">Fecha Asignación</th>
                            <th scope="col">Fecha Revisión</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vistosBuenos.map(vb => crearFilaVistoBueno(vb)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Crear vista de cards
     */
    function crearVistaCards(vistosBuenos) {
        return `
            <div class="cards-view">
                ${vistosBuenos.map(vb => crearCardVistoBueno(vb)).join('')}
            </div>
        `;
    }

    /**
     * Crear fila de tabla para un visto bueno
     */
    function crearFilaVistoBueno(vistoBueno) {
        const estadoClase = {
            [ESTADOS.PENDIENTE]: 'estado-pendiente',
            [ESTADOS.APROBADO]: 'estado-aprobado',
            [ESTADOS.OBSERVADO]: 'estado-observado'
        };

        return `
            <tr>
                <td>
                    <strong>${Utils.htmlEscape(vistoBueno.codigoDocumento)}</strong>
                </td>
                <td>
                    <div class="fw-medium">${Utils.htmlEscape(vistoBueno.tituloDocumento)}</div>
                    <small class="text-muted">${Utils.htmlEscape(vistoBueno.proyectoNombre || 'Sin proyecto')}</small>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm me-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                            ${Utils.htmlEscape(vistoBueno.revisorNombre.charAt(0).toUpperCase())}
                        </div>
                        ${Utils.htmlEscape(vistoBueno.revisorNombre)}
                    </div>
                </td>
                <td>
                    <span class="badge ${estadoClase[vistoBueno.estado] || 'bg-secondary'}">
                        ${vistoBueno.estado}
                    </span>
                </td>
                <td>
                    <div>${Utils.formatearFecha(vistoBueno.fechaAsignacion)}</div>
                    <small class="text-muted">${Utils.formatearFechaRelativa(vistoBueno.fechaAsignacion)}</small>
                </td>
                <td>${vistoBueno.fechaRevision ? Utils.formatearFecha(vistoBueno.fechaRevision) : '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group" aria-label="Acciones de visto bueno">
                        ${crearBotonesAccion(vistoBueno)}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Crear card para un visto bueno
     */
    function crearCardVistoBueno(vistoBueno) {
        const estadoClase = {
            [ESTADOS.PENDIENTE]: 'estado-pendiente',
            [ESTADOS.APROBADO]: 'estado-aprobado',
            [ESTADOS.OBSERVADO]: 'estado-observado'
        };

        return `
            <div class="visto-bueno-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="mb-1">${Utils.htmlEscape(vistoBueno.codigoDocumento)}</h6>
                        <span class="badge ${estadoClase[vistoBueno.estado] || 'bg-secondary'}">
                            ${vistoBueno.estado}
                        </span>
                    </div>
                    <div class="btn-group btn-group-sm">
                        ${crearBotonesAccion(vistoBueno)}
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="fw-medium text-truncate" title="${Utils.htmlEscape(vistoBueno.tituloDocumento)}">
                        ${Utils.htmlEscape(vistoBueno.tituloDocumento)}
                    </div>
                    <small class="text-muted">${Utils.htmlEscape(vistoBueno.proyectoNombre || 'Sin proyecto')}</small>
                </div>
                
                <div class="d-flex align-items-center mb-2">
                    <div class="avatar-sm me-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                        ${Utils.htmlEscape(vistoBueno.revisorNombre.charAt(0).toUpperCase())}
                    </div>
                    <div>
                        <div class="fw-medium">${Utils.htmlEscape(vistoBueno.revisorNombre)}</div>
                        <small class="text-muted">Revisor</small>
                    </div>
                </div>
                
                <div class="row text-center border-top pt-2">
                    <div class="col-6">
                        <small class="text-muted d-block">Asignado</small>
                        <span class="fw-medium">${Utils.formatearFechaRelativa(vistoBueno.fechaAsignacion)}</span>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Revisado</small>
                        <span class="fw-medium">${vistoBueno.fechaRevision ? Utils.formatearFechaRelativa(vistoBueno.fechaRevision) : '-'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Crear botones de acción para un visto bueno
     */
    function crearBotonesAccion(vistoBueno) {
        let botones = '';

        if (vistoBueno.estado === ESTADOS.PENDIENTE) {
            botones += `
                <button type="button" 
                        class="btn btn-outline-success" 
                        onclick="VistosBuenosApp.abrirModalProcesar(${vistoBueno.id})" 
                        title="Procesar visto bueno"
                        aria-label="Procesar visto bueno ${vistoBueno.codigoDocumento}">
                    <i class="bi bi-check-circle"></i>
                </button>
            `;
        }

        botones += `
            <button type="button" 
                    class="btn btn-outline-info" 
                    onclick="VistosBuenosApp.verDetallesVistoBueno(${vistoBueno.id})" 
                    title="Ver detalles"
                    aria-label="Ver detalles de ${vistoBueno.codigoDocumento}">
                <i class="bi bi-eye"></i>
            </button>
        `;

        if (vistoBueno.observaciones) {
            botones += `
                <button type="button" 
                        class="btn btn-outline-warning" 
                        onclick="VistosBuenosApp.verObservaciones(${vistoBueno.id})" 
                        title="Ver observaciones"
                        aria-label="Ver observaciones de ${vistoBueno.codigoDocumento}">
                    <i class="bi bi-chat-text"></i>
                </button>
            `;
        }

        return botones;
    }

    // ==================== FUNCIONES PÚBLICAS ====================

    /**
     * Aplicar filtros de búsqueda
     */
    function aplicarFiltros() {
        const filtros = {
            estado: document.getElementById('filtroEstado')?.value || '',
            fecha: document.getElementById('filtroFecha')?.value || '',
            usuario: document.getElementById('filtroUsuario')?.value || '',
            busqueda: document.getElementById('filtroBusqueda')?.value?.trim() || ''
        };

        // Remover filtros vacíos
        const filtrosLimpios = Object.fromEntries(
            Object.entries(filtros).filter(([key, value]) => value !== '')
        );

        StateManager.setState({ 
            filtrosActivos: filtrosLimpios,
            paginaActual: 1 
        });

        cargarVistosBuenos();
    }

    /**
     * Limpiar todos los filtros
     */
    function limpiarFiltros() {
        ['filtroEstado', 'filtroFecha', 'filtroUsuario', 'filtroBusqueda'].forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.value = '';
        });

        StateManager.setState({ 
            filtrosActivos: {},
            paginaActual: 1 
        });

        cargarVistosBuenos();
    }

    /**
     * Abrir modal para procesar visto bueno
     */
    async function abrirModalProcesar(vistoBuenoId) {
        try {
            StateManager.setState({ cargando: true });

            const data = await ApiClient.request(ACCIONES.OBTENER_DETALLE, { id: vistoBuenoId });
            
            if (data.success) {
                const vb = data.vistoBueno;
                
                // Llenar formulario
                document.getElementById('vistoBuenoId').value = vb.id;
                document.getElementById('documentoInfo').innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <div class="fw-bold">${Utils.htmlEscape(vb.codigoDocumento)}</div>
                            <div class="text-muted">${Utils.htmlEscape(vb.tituloDocumento)}</div>
                            <small>Proyecto: ${Utils.htmlEscape(vb.proyectoNombre || 'Sin proyecto')}</small>
                        </div>
                    </div>
                `;
                
                // Reset formulario
                document.getElementById('estadoVistoBueno').value = '';
                document.getElementById('observacionesVistoBueno').value = vb.observaciones || '';
                
                // Remover clases de validación
                document.getElementById('formProcesarVistoBueno').classList.remove('was-validated');
                
                const modal = new bootstrap.Modal(document.getElementById('modalProcesarVistoBueno'));
                modal.show();
            } else {
                Notificaciones.error('Error al cargar detalles: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar detalles');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    /**
     * Procesar un visto bueno
     */
    async function procesarVistoBueno() {
        const form = document.getElementById('formProcesarVistoBueno');
        
        if (!Utils.validarFormulario(form)) {
            form.classList.add('was-validated');
            return;
        }

        const vistoBuenoId = document.getElementById('vistoBuenoId').value;
        const estado = document.getElementById('estadoVistoBueno').value;
        const observaciones = document.getElementById('observacionesVistoBueno').value;

        // Validar observaciones para documentos observados
        if (estado === ESTADOS.OBSERVADO && !observaciones.trim()) {
            Notificaciones.error('Las observaciones son obligatorias para documentos observados');
            document.getElementById('observacionesVistoBueno').focus();
            return;
        }

        try {
            StateManager.setState({ cargando: true });

            const data = await ApiClient.request(ACCIONES.PROCESAR_VISTO_BUENO, {
                id: vistoBuenoId,
                estado: estado,
                observaciones: observaciones
            });
            
            if (data.success) {
                Notificaciones.exito('Visto bueno procesado correctamente');
                bootstrap.Modal.getInstance(document.getElementById('modalProcesarVistoBueno')).hide();
                
                // Invalidar cache y recargar datos
                Cache.clear();
                await Promise.all([
                    cargarVistosBuenos(),
                    cargarEstadisticas()
                ]);
            } else {
                Notificaciones.error('Error al procesar: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al procesar visto bueno');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    /**
     * Asignar un nuevo visto bueno
     */
    async function asignarVistoBueno() {
        const form = document.getElementById('formAsignarVistoBueno');
        
        if (!Utils.validarFormulario(form)) {
            form.classList.add('was-validated');
            return;
        }

        const documentoId = document.getElementById('documentoAsignar').value;
        const usuarioId = document.getElementById('usuarioRevisor').value;
        const observaciones = document.getElementById('observacionesAsignacion').value;

        try {
            StateManager.setState({ cargando: true });

            const data = await ApiClient.request(ACCIONES.ASIGNAR_VISTO_BUENO, {
                documentoId: documentoId,
                usuarioId: usuarioId,
                observaciones: observaciones
            });
            
            if (data.success) {
                Notificaciones.exito('Visto bueno asignado correctamente');
                bootstrap.Modal.getInstance(document.getElementById('modalAsignarVistoBueno')).hide();
                
                // Reset formulario
                form.reset();
                form.classList.remove('was-validated');
                
                // Invalidar cache y recargar datos
                Cache.clear();
                await Promise.all([
                    cargarVistosBuenos(),
                    cargarEstadisticas()
                ]);
            } else {
                Notificaciones.error('Error al asignar: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al asignar visto bueno');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    /**
     * Ver detalles de un visto bueno
     */
    async function verDetallesVistoBueno(vistoBuenoId) {
        try {
            const data = await ApiClient.request(ACCIONES.OBTENER_DETALLE, { id: vistoBuenoId });
            
            if (data.success) {
                const vb = data.vistoBueno;
                
                document.getElementById('detallesVistoBuenoContent').innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Información del Documento</h6>
                            <p><strong>Código:</strong> ${Utils.htmlEscape(vb.codigoDocumento)}</p>
                            <p><strong>Título:</strong> ${Utils.htmlEscape(vb.tituloDocumento)}</p>
                            <p><strong>Proyecto:</strong> ${Utils.htmlEscape(vb.proyectoNombre || 'Sin proyecto')}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Información de Revisión</h6>
                            <p><strong>Revisor:</strong> ${Utils.htmlEscape(vb.revisorNombre)}</p>
                            <p><strong>Estado:</strong> <span class="badge ${vb.estado === ESTADOS.PENDIENTE ? 'estado-pendiente' : vb.estado === ESTADOS.APROBADO ? 'estado-aprobado' : 'estado-observado'}">${vb.estado}</span></p>
                            <p><strong>Fecha Asignación:</strong> ${Utils.formatearFecha(vb.fechaAsignacion)}</p>
                            ${vb.fechaRevision ? `<p><strong>Fecha Revisión:</strong> ${Utils.formatearFecha(vb.fechaRevision)}</p>` : ''}
                        </div>
                    </div>
                    ${vb.observaciones ? `
                        <div class="mt-3">
                            <h6>Observaciones</h6>
                            <div class="p-3 bg-light rounded">
                                ${Utils.htmlEscape(vb.observaciones).replace(/\n/g, '<br>')}
                            </div>
                        </div>
                    ` : ''}
                `;
                
                const modal = new bootstrap.Modal(document.getElementById('modalDetallesVistoBueno'));
                modal.show();
            } else {
                Notificaciones.error('Error al cargar detalles: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar detalles');
        }
    }

    /**
     * Ver observaciones en modal
     */
    function verObservaciones(vistoBuenoId) {
        const vistoBueno = state.datosVistosBuenos.find(vb => vb.id === vistoBuenoId);
        if (!vistoBueno || !vistoBueno.observaciones) return;

        // Crear modal temporal para observaciones
        const modalId = 'modalObservaciones' + Utils.generarId();
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Observaciones - ${Utils.htmlEscape(vistoBueno.codigoDocumento)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="p-3 bg-light rounded">
                                ${Utils.htmlEscape(vistoBueno.observaciones).replace(/\n/g, '<br>')}
                            </div>
                            <small class="text-muted mt-2 d-block">
                                Fecha: ${Utils.formatearFecha(vistoBueno.fechaRevision || vistoBueno.fechaAsignacion)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();

        // Remover modal del DOM al cerrarse
        document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
            document.getElementById(modalId).remove();
        });
    }

    /**
     * Actualizar paginación
     */
    function actualizarPaginacion(totalPages, currentPage) {
        const container = document.getElementById('paginacionVistosBuenos');
        if (!container) return;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        
        // Botón anterior
        if (currentPage > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="VistosBuenosApp.cambiarPagina(${currentPage - 1})" aria-label="Página anterior">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `;
        }

        // Páginas numeradas con algoritmo mejorado
        const maxPaginasVisibles = 5;
        let inicio = Math.max(1, currentPage - Math.floor(maxPaginasVisibles / 2));
        let fin = Math.min(totalPages, inicio + maxPaginasVisibles - 1);
        
        if (fin - inicio < maxPaginasVisibles - 1) {
            inicio = Math.max(1, fin - maxPaginasVisibles + 1);
        }

        // Primera página si no está visible
        if (inicio > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="VistosBuenosApp.cambiarPagina(1)">1</a></li>`;
            if (inicio > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Páginas numeradas
        for (let i = inicio; i <= fin; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="VistosBuenosApp.cambiarPagina(${i})" aria-label="Página ${i}">${i}</a>
                </li>
            `;
        }

        // Última página si no está visible
        if (fin < totalPages) {
            if (fin < totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" onclick="VistosBuenosApp.cambiarPagina(${totalPages})">${totalPages}</a></li>`;
        }

        // Botón siguiente
        if (currentPage < totalPages) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="VistosBuenosApp.cambiarPagina(${currentPage + 1})" aria-label="Página siguiente">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Cambiar de página
     */
    function cambiarPagina(pagina) {
        StateManager.setState({ paginaActual: pagina });
        cargarVistosBuenos();
        
        // Scroll suave al inicio de la tabla
        document.getElementById('tablaVistosBuenosContainer')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    /**
     * Exportar vistos buenos
     */
    function exportarVistosBuenos() {
        const params = new URLSearchParams({
            action: ACCIONES.EXPORTAR,
            ...state.filtrosActivos
        });

        const url = `${CONFIG.API_ENDPOINT}?${params.toString()}`;
        window.open(url, '_blank');
        
        Notificaciones.info('Iniciando descarga del archivo...');
    }

    /**
     * Cerrar modales abiertos
     */
    function cerrarModalesAbiertos() {
        const modales = document.querySelectorAll('.modal.show');
        modales.forEach(modal => {
            bootstrap.Modal.getInstance(modal)?.hide();
        });
    }

    // ==================== INICIALIZACIÓN ====================
    document.addEventListener('DOMContentLoaded', inicializar);

    // ==================== API PÚBLICA ====================
    return {
        // Funciones principales
        aplicarFiltros,
        limpiarFiltros,
        abrirModalProcesar,
        procesarVistoBueno,
        asignarVistoBueno,
        verDetallesVistoBueno,
        verObservaciones,
        cambiarPagina,
        exportarVistosBuenos,
        
        // Utilidades
        Utils,
        Cache,
        Notificaciones,
        StateManager,
        
        // Estado (solo lectura)
        getState: () => StateManager.getState(),
        
        // Funciones de inicialización
        inicializar,
        cargarVistosBuenos,
        cargarEstadisticas
    };

})();

// ==================== FUNCIONES GLOBALES PARA COMPATIBILIDAD ====================
// Mantener compatibilidad con el HTML existente
window.aplicarFiltros = VistosBuenosApp.aplicarFiltros;
window.limpiarFiltros = VistosBuenosApp.limpiarFiltros;
window.abrirModalProcesar = VistosBuenosApp.abrirModalProcesar;
window.procesarVistoBueno = VistosBuenosApp.procesarVistoBueno;
window.asignarVistoBueno = VistosBuenosApp.asignarVistoBueno;
window.verDetallesVistoBueno = VistosBuenosApp.verDetallesVistoBueno;
window.verObservaciones = VistosBuenosApp.verObservaciones;
window.cambiarPagina = VistosBuenosApp.cambiarPagina;
window.exportarVistosBuenos = VistosBuenosApp.exportarVistosBuenos;
window.toggleViewMode = () => VistosBuenosApp.UI?.toggleViewMode?.();

// Función global para debounce (usada en el HTML)
window.debounce = VistosBuenosApp.Utils.debounce;

// ==================== MANEJO DE ERRORES GLOBAL ====================
window.addEventListener('error', (event) => {
    console.error('Error no manejado:', event.error);
    VistosBuenosApp.Notificaciones?.error?.('Ha ocurrido un error inesperado');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
    VistosBuenosApp.Notificaciones?.error?.('Error de conexión');
    event.preventDefault();
});

console.log('📋 Módulo VistosBuenosApp v2.0 cargado correctamente');