/* ==================== REFERENCIAS JS - MÓDULO COMPLETO ==================== */
/* Sistema de Gestión Documental - Constructora Vial S.A. */
/* @version 1.0.2 - COMPLETO CON TODAS LAS FUNCIONALIDADES */

'use strict';

/**
 * Módulo principal para gestión de referencias de documentos
 * Implementa el patrón Module con namespace
 */
const ReferenciasApp = (function() {
    
    // ==================== CONFIGURACIÓN Y CONSTANTES ====================
    const CONFIG = {
        API_ENDPOINT: '/Proyecto_PC2/ReferenciasServlet',
        ITEMS_POR_PAGINA: 15,
        DEBOUNCE_DELAY: 300,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
        TOAST_DURATION: 5000,
        AUTO_REFRESH_INTERVAL: 30000, // 30 segundos
        GRAFO_ANIMATION_DURATION: 300
    };

    const TIPOS_REFERENCIA = {
        RESPONDE_A: 'Responde a',
        RELACIONADO_CON: 'Relacionado con',
        CORRIGE_A: 'Corrige a',
        DERIVA_DE: 'Deriva de'
    };

    const ACCIONES = {
        OBTENER_ESTADISTICAS: 'obtenerEstadisticasReferencias',
        OBTENER_PROYECTOS: 'obtenerProyectos',
        OBTENER_DOCUMENTOS: 'obtenerDocumentos',
        OBTENER_REFERENCIAS: 'obtenerReferencias',
        OBTENER_DETALLE: 'obtenerDetalleReferencia',
        OBTENER_GRAFO: 'obtenerGrafoReferencias',
        AGREGAR_REFERENCIA: 'agregarReferencia',
        ACTUALIZAR_REFERENCIA: 'actualizarReferencia',
        ELIMINAR_REFERENCIA: 'eliminarReferencia',
        EXPORTAR: 'exportarReferencias',
        VALIDAR_REFERENCIA: 'validarReferencia'
    };

    // ==================== ESTADO DE LA APLICACIÓN ====================
    let state = {
        datosReferencias: [],
        filtrosActivos: {},
        paginaActual: 1,
        totalPaginas: 0,
        cargando: false,
        vistaActual: 'tabla', // 'tabla' o 'grafo'
        cache: new Map(),
        observadores: new Map(),
        autoRefreshTimer: null,
        grafoData: {
            nodos: [],
            enlaces: []
        },
        documentos: [],
        proyectos: [],
        grafoInstance: null
    };

    // ==================== UTILIDADES ====================
    const Utils = {
        debounce(func, delay) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        },

        htmlEscape(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

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

        formatearFechaRelativa(fecha) {
            if (!fecha) return 'N/A';
            try {
                const ahora = new Date();
                const fechaObj = new Date(fecha);
                const diferencia = ahora - fechaObj;
                const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
                const horas = Math.floor(diferencia / (1000 * 60 * 60));
                const minutos = Math.floor(diferencia / (1000 * 60));
                
                if (minutos < 60) return `Hace ${minutos} min`;
                if (horas < 24) return `Hace ${horas}h`;
                if (dias === 0) return 'Hoy';
                if (dias === 1) return 'Ayer';
                if (dias < 7) return `Hace ${dias} días`;
                if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
                return this.formatearFecha(fecha);
            } catch (error) {
                return this.formatearFecha(fecha);
            }
        },

        getClaseTipoReferencia(tipo) {
            const clases = {
                [TIPOS_REFERENCIA.RESPONDE_A]: 'badge bg-info',
                [TIPOS_REFERENCIA.RELACIONADO_CON]: 'badge bg-success',
                [TIPOS_REFERENCIA.CORRIGE_A]: 'badge bg-warning',
                [TIPOS_REFERENCIA.DERIVA_DE]: 'badge bg-primary'
            };
            return clases[tipo] || 'badge bg-secondary';
        },

        getIconoTipoReferencia(tipo) {
            const iconos = {
                [TIPOS_REFERENCIA.RESPONDE_A]: 'bi-reply',
                [TIPOS_REFERENCIA.RELACIONADO_CON]: 'bi-arrow-left-right',
                [TIPOS_REFERENCIA.CORRIGE_A]: 'bi-exclamation-triangle',
                [TIPOS_REFERENCIA.DERIVA_DE]: 'bi-arrow-down-right'
            };
            return iconos[tipo] || 'bi-link-45deg';
        },

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

        generarId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        animarContador(elemento, desde, hasta, duracion = 1000) {
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
        },

        // Nueva función para descargar CSV
        descargarCSV(contenido, nombreArchivo) {
            const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', nombreArchivo);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
            let container = document.getElementById('toastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'toast-container position-fixed top-0 end-0 p-3';
                container.style.zIndex = '1050';
                document.body.appendChild(container);
            }
            
            const id = Utils.generarId();
            
            const iconos = {
                success: 'bi-check-circle',
                error: 'bi-x-circle',
                warning: 'bi-exclamation-triangle',
                info: 'bi-info-circle'
            };

            const toast = document.createElement('div');
            toast.className = `toast`;
            toast.id = id;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi ${iconos[tipo]} me-2 text-${tipo === 'error' ? 'danger' : tipo}"></i>
                    <strong class="me-auto">${this.getTitulo(tipo)}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
                </div>
                <div class="toast-body">${Utils.htmlEscape(mensaje)}</div>
            `;

            container.appendChild(toast);

            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();

            setTimeout(() => {
                if (document.getElementById(id)) {
                    bsToast.hide();
                }
            }, duracion);

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
        async request(accion, parametros = {}, opciones = {}) {
            const {
                metodo = 'POST',
                cache = false,
                reintentos = CONFIG.RETRY_ATTEMPTS
            } = opciones;

            const cacheKey = cache ? `${accion}_${JSON.stringify(parametros)}` : null;
            
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

                    if (cache && cacheKey) {
                        Cache.set(cacheKey, data);
                    }

                    return data;

                } catch (error) {
                    console.error(`Intento ${intento + 1} fallido:`, error);
                    
                    if (intento === reintentos) {
                        throw error;
                    }
                    
                    await new Promise(resolve => 
                        setTimeout(resolve, CONFIG.RETRY_DELAY * Math.pow(2, intento))
                    );
                }
            }
        }
    };

    // ==================== GESTIÓN DE ESTADO ====================
    const StateManager = {
        setState(nuevoEstado) {
            const estadoAnterior = { ...state };
            Object.assign(state, nuevoEstado);
            this.notificarObservadores(estadoAnterior, state);
        },

        getState() {
            return { ...state };
        },

        suscribir(clave, callback) {
            if (!state.observadores.has(clave)) {
                state.observadores.set(clave, []);
            }
            state.observadores.get(clave).push(callback);
        },

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
        mostrarCargando(mostrar, contenedor = 'contenedorReferencias') {
            const container = document.getElementById(contenedor);
            if (!container) return;

            if (mostrar) {
                container.innerHTML = `
                    <div class="d-flex justify-content-center align-items-center p-5">
                        <div class="spinner-border text-primary me-3" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <span>Cargando referencias de documentos...</span>
                    </div>
                `;
            }
        },

        mostrarEstadoVacio(contenedor, mensaje = 'No hay referencias de documentos') {
            const container = document.getElementById(contenedor);
            if (!container) return;

            container.innerHTML = `
                <div class="text-center p-5">
                    <div class="mb-4">
                        <i class="bi bi-link-45deg display-1 text-muted"></i>
                    </div>
                    <h5 class="text-muted">Sin referencias</h5>
                    <p class="text-muted">${Utils.htmlEscape(mensaje)}</p>
                    <button type="button" class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#modalAgregarReferencia">
                        <i class="bi bi-plus-lg me-1"></i>
                        Crear Primera Referencia
                    </button>
                </div>
            `;
        },

        renderizarReferencias(referencias) {
            const container = document.getElementById('contenedorReferencias');
            if (!container) return;

            if (!referencias || referencias.length === 0) {
                this.mostrarEstadoVacio('contenedorReferencias', 'No se encontraron referencias con los filtros aplicados');
                return;
            }

            if (state.vistaActual === 'tabla') {
                container.innerHTML = this.crearTablaReferencias(referencias);
            } else {
                this.renderizarVistaGrafo(container);
            }
        },

        crearTablaReferencias(referencias) {
            return `
                <div class="table-responsive">
                    <table class="table table-striped table-hover mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th scope="col">Documento Origen</th>
                                <th scope="col">Tipo de Referencia</th>
                                <th scope="col">Documento Referenciado</th>
                                <th scope="col">Proyecto</th>
                                <th scope="col">Fecha Creación</th>
                                <th scope="col">Creado por</th>
                                <th scope="col">Observaciones</th>
                                <th scope="col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${referencias.map(ref => this.crearFilaReferencia(ref)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        crearFilaReferencia(referencia) {
            return `
                <tr>
                    <td>
                        <div class="fw-medium text-primary">${Utils.htmlEscape(referencia.documentoOrigenCodigo || 'N/A')}</div>
                        <small class="text-muted">${Utils.htmlEscape(referencia.documentoOrigenTitulo || 'Sin título')}</small>
                    </td>
                    <td>
                        <span class="${Utils.getClaseTipoReferencia(referencia.tipoReferencia)}">
                            <i class="bi ${Utils.getIconoTipoReferencia(referencia.tipoReferencia)} me-1"></i>
                            ${referencia.tipoReferencia || 'N/A'}
                        </span>
                    </td>
                    <td>
                        <div class="fw-medium text-success">${Utils.htmlEscape(referencia.documentoReferenciadoCodigo || 'N/A')}</div>
                        <small class="text-muted">${Utils.htmlEscape(referencia.documentoReferenciadoTitulo || 'Sin título')}</small>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark">${Utils.htmlEscape(referencia.proyectoNombre || referencia.proyectoOrigen || 'Sin proyecto')}</span>
                    </td>
                    <td>
                        <div>${Utils.formatearFecha(referencia.fechaCreacion)}</div>
                        <small class="text-muted">${Utils.formatearFechaRelativa(referencia.fechaCreacion)}</small>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-sm me-2 bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 14px;">
                                ${Utils.htmlEscape((referencia.creadoPor || 'Sistema').charAt(0).toUpperCase())}
                            </div>
                            <div>
                                <div class="fw-medium">${Utils.htmlEscape(referencia.creadoPor || 'Sistema')}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${referencia.observaciones ? 
                            `<span class="text-truncate d-inline-block" style="max-width: 150px;" title="${Utils.htmlEscape(referencia.observaciones)}">${Utils.htmlEscape(referencia.observaciones)}</span>` : 
                            '<span class="text-muted">Sin observaciones</span>'
                        }
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            ${this.crearBotonesAccion(referencia)}
                        </div>
                    </td>
                </tr>
            `;
        },

        crearBotonesAccion(referencia) {
            return `
                <button type="button" 
                        class="btn btn-outline-info btn-sm" 
                        onclick="ReferenciasApp.verDetalles(${referencia.id})" 
                        title="Ver detalles">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" 
                        class="btn btn-outline-primary btn-sm" 
                        onclick="ReferenciasApp.abrirModalEditar(${referencia.id})" 
                        title="Editar referencia">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button type="button" 
                        class="btn btn-outline-danger btn-sm" 
                        onclick="ReferenciasApp.confirmarEliminar(${referencia.id})" 
                        title="Eliminar referencia">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        },

        // Nueva función para vista de grafo
        renderizarVistaGrafo(container) {
            container.innerHTML = `
                <div id="grafo-container" class="border rounded p-3" style="height: 600px;">
                    <div class="d-flex justify-content-center align-items-center h-100">
                        <div class="text-center">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Cargando grafo...</span>
                            </div>
                            <p>Generando vista de red de referencias...</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Cargar datos del grafo
            this.cargarYRenderizarGrafo();
        },

        async cargarYRenderizarGrafo() {
            try {
                const data = await ApiClient.request(ACCIONES.OBTENER_GRAFO);
                this.renderizarGrafoD3(data.grafo);
            } catch (error) {
                console.error('Error cargando grafo:', error);
                document.getElementById('grafo-container').innerHTML = `
                    <div class="text-center p-4">
                        <i class="bi bi-exclamation-triangle display-4 text-warning"></i>
                        <h5 class="mt-3">Error al cargar el grafo</h5>
                        <p class="text-muted">No se pudo generar la vista de red</p>
                        <button class="btn btn-primary" onclick="ReferenciasApp.toggleViewMode()">
                            Volver a vista tabla
                        </button>
                    </div>
                `;
            }
        },

        // Renderizar grafo con D3.js
        renderizarGrafoD3(grafoData) {
            const container = document.getElementById('grafo-container');
            container.innerHTML = '';

            if (!grafoData.nodos || grafoData.nodos.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="bi bi-diagram-3 display-4 text-muted"></i>
                        <h5 class="mt-3">Sin datos para mostrar</h5>
                        <p class="text-muted">No hay referencias para visualizar</p>
                    </div>
                `;
                return;
            }

            // Implementación simple sin D3 (fallback)
            this.renderizarGrafoSimple(container, grafoData);
        },

        // Implementación simple del grafo sin dependencias externas
        renderizarGrafoSimple(container, grafoData) {
            const width = container.clientWidth;
            const height = 500;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);
            svg.style.border = '1px solid #dee2e6';
            svg.style.borderRadius = '0.375rem';

            // Posicionar nodos en círculo
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 3;

            grafoData.nodos.forEach((nodo, i) => {
                const angle = (2 * Math.PI * i) / grafoData.nodos.length;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                // Crear círculo para nodo
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', 20);
                circle.setAttribute('fill', '#007bff');
                circle.setAttribute('stroke', '#0056b3');
                circle.setAttribute('stroke-width', '2');
                circle.style.cursor = 'pointer';

                // Tooltip
                circle.innerHTML = `<title>${nodo.codigo}: ${nodo.titulo}</title>`;

                svg.appendChild(circle);

                // Etiqueta del nodo
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y + 35);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.setAttribute('fill', '#333');
                text.textContent = nodo.codigo;

                svg.appendChild(text);

                nodo.x = x;
                nodo.y = y;
            });

            // Dibujar enlaces
            grafoData.enlaces.forEach(enlace => {
                const nodoOrigen = grafoData.nodos.find(n => n.id === enlace.source);
                const nodoDestino = grafoData.nodos.find(n => n.id === enlace.target);

                if (nodoOrigen && nodoDestino) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', nodoOrigen.x);
                    line.setAttribute('y1', nodoOrigen.y);
                    line.setAttribute('x2', nodoDestino.x);
                    line.setAttribute('y2', nodoDestino.y);
                    line.setAttribute('stroke', this.getColorTipoReferencia(enlace.tipo));
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('stroke-dasharray', '5,5');

                    // Tooltip para enlace
                    line.innerHTML = `<title>${enlace.tipo}</title>`;

                    svg.insertBefore(line, svg.firstChild);
                }
            });

            container.appendChild(svg);

            // Agregar leyenda
            const leyenda = document.createElement('div');
            leyenda.className = 'mt-3';
            leyenda.innerHTML = `
                <h6>Leyenda:</h6>
                <div class="d-flex flex-wrap gap-3">
                    ${Object.values(TIPOS_REFERENCIA).map(tipo => `
                        <div class="d-flex align-items-center">
                            <div style="width: 20px; height: 3px; background: ${this.getColorTipoReferencia(tipo)}; margin-right: 8px;"></div>
                            <span class="small">${tipo}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(leyenda);
        },

        getColorTipoReferencia(tipo) {
            const colores = {
                [TIPOS_REFERENCIA.RESPONDE_A]: '#17a2b8',
                [TIPOS_REFERENCIA.RELACIONADO_CON]: '#28a745',
                [TIPOS_REFERENCIA.CORRIGE_A]: '#ffc107',
                [TIPOS_REFERENCIA.DERIVA_DE]: '#007bff'
            };
            return colores[tipo] || '#6c757d';
        }
    };

    // ==================== FUNCIONES PRINCIPALES ====================

    async function inicializar() {
        try {
            console.log('🚀 Inicializando módulo de Referencias v1.0.2...');
            console.log('📍 URL API:', CONFIG.API_ENDPOINT);
            
            configurarEventos();
            configurarObservadores();
            
            // Cargar datos en secuencia para mejor debugging
            console.log('1️⃣ Cargando estadísticas...');
            await cargarEstadisticas();
            
            console.log('2️⃣ Cargando datos iniciales...');
            await cargarDatosIniciales();
            
            console.log('3️⃣ Cargando referencias...');
            await cargarReferencias();

            // Configurar eventos de modales
            configurarEventosModales();
            
            // Agregar botón de debug en desarrollo
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                agregarBotonDebug();
            }

            console.log('✅ Módulo de Referencias inicializado correctamente');
            Notificaciones.exito('Sistema de Referencias cargado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando módulo:', error);
            Notificaciones.error('Error al inicializar la aplicación de referencias: ' + error.message);
        }
    }

    // Nueva función para debugging
    function agregarBotonDebug() {
        const debugBtn = document.createElement('button');
        debugBtn.className = 'btn btn-outline-secondary btn-sm';
        debugBtn.innerHTML = '<i class="bi bi-bug"></i> Debug';
        debugBtn.style.position = 'fixed';
        debugBtn.style.bottom = '20px';
        debugBtn.style.right = '20px';
        debugBtn.style.zIndex = '9999';
        
        debugBtn.onclick = function() {
            console.log('🐛 Estado actual:', StateManager.getState());
            console.log('📦 Cache:', state.cache);
            console.log('🔗 Documentos cargados:', state.documentos?.length || 0);
            console.log('📊 Proyectos cargados:', state.proyectos?.length || 0);
            
            // Forzar recarga de datos
            cargarDatosIniciales();
        };
        
        document.body.appendChild(debugBtn);
    }

    function configurarEventos() {
        const filtros = ['filtroTipoReferencia', 'filtroDocumentoOrigen', 'filtroDocumentoReferenciado', 'filtroProyecto'];
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
    }

    // Nueva función para configurar eventos de modales
    function configurarEventosModales() {
        // Evento cuando se abre el modal de agregar
        const modalAgregar = document.getElementById('modalAgregarReferencia');
        if (modalAgregar) {
            modalAgregar.addEventListener('show.bs.modal', async function () {
                console.log('📂 Abriendo modal de agregar referencia...');
                
                // Verificar si hay documentos cargados
                if (state.documentos.length === 0) {
                    console.log('🔄 No hay documentos cargados, recargando...');
                    UI.mostrarCargando(true, 'documentoOrigen');
                    await cargarDatosIniciales();
                }
                
                console.log(`📊 Documentos disponibles: ${state.documentos.length}`);
                console.log(`📋 Proyectos disponibles: ${state.proyectos.length}`);
            });
            
            modalAgregar.addEventListener('shown.bs.modal', function () {
                // Establecer fecha de hoy por defecto
                const fechaInput = document.getElementById('fechaReferencia');
                if (fechaInput && !fechaInput.value) {
                    fechaInput.value = new Date().toISOString().split('T')[0];
                }
                
                // Enfocar el primer campo
                const primerCampo = document.getElementById('documentoOrigen');
                if (primerCampo) {
                    primerCampo.focus();
                }
            });
        }

        // Eventos para mostrar información de documentos seleccionados
        const docOrigenSelect = document.getElementById('documentoOrigen');
        const docReferenciadoSelect = document.getElementById('documentoReferenciado');
        
        if (docOrigenSelect) {
            docOrigenSelect.addEventListener('change', mostrarInfoDocumento);
        }
        
        if (docReferenciadoSelect) {
            docReferenciadoSelect.addEventListener('change', mostrarInfoDocumento);
        }
    }

    // Nueva función para mostrar información de documentos seleccionados
    function mostrarInfoDocumento() {
        const origenSelect = document.getElementById('documentoOrigen');
        const referenciadoSelect = document.getElementById('documentoReferenciado');
        const infoContainer = document.getElementById('infoDocumentosSeleccionados');
        
        if (!origenSelect || !referenciadoSelect || !infoContainer) return;

        const origenId = origenSelect.value;
        const referenciadoId = referenciadoSelect.value;

        if (origenId && referenciadoId) {
            const docOrigen = state.documentos.find(d => d.id == origenId);
            const docReferenciado = state.documentos.find(d => d.id == referenciadoId);

            if (docOrigen && docReferenciado) {
                document.getElementById('infoDocumentoOrigen').innerHTML = `
                    <p><strong>Código:</strong> ${docOrigen.codigo}</p>
                    <p><strong>Título:</strong> ${docOrigen.titulo}</p>
                    <p><strong>Tipo:</strong> ${docOrigen.tipo || 'N/A'}</p>
                    <p><strong>Proyecto:</strong> ${docOrigen.proyecto || 'N/A'}</p>
                `;

                document.getElementById('infoDocumentoReferenciado').innerHTML = `
                    <p><strong>Código:</strong> ${docReferenciado.codigo}</p>
                    <p><strong>Título:</strong> ${docReferenciado.titulo}</p>
                    <p><strong>Tipo:</strong> ${docReferenciado.tipo || 'N/A'}</p>
                    <p><strong>Proyecto:</strong> ${docReferenciado.proyecto || 'N/A'}</p>
                `;

                infoContainer.style.display = 'block';

                // Validar referencia circular
                validarReferenciaCircular(origenId, referenciadoId);
            }
        } else {
            infoContainer.style.display = 'none';
        }
    }

    // Nueva función para validar referencias circulares
    async function validarReferenciaCircular(origenId, referenciadoId) {
        try {
            const data = await ApiClient.request(ACCIONES.VALIDAR_REFERENCIA, {
                documentoOrigenId: origenId,
                documentoReferenciadoId: referenciadoId
            });

            const btnAgregar = document.getElementById('btnAgregarReferencia');
            if (!data.valida) {
                Notificaciones.advertencia(data.mensaje);
                if (btnAgregar) {
                    btnAgregar.disabled = true;
                }
            } else {
                if (btnAgregar) {
                    btnAgregar.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error validando referencia:', error);
        }
    }

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

    async function cargarEstadisticas() {
        try {
            const data = await ApiClient.request(ACCIONES.OBTENER_ESTADISTICAS, {}, { cache: true });
            actualizarEstadisticas(data.estadisticas);
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            Notificaciones.error('Error al cargar estadísticas');
        }
    }

    function actualizarEstadisticas(stats) {
        console.log('Estadísticas recibidas:', stats);
        
        const elementos = {
            statTotalReferencias: stats.totalReferencias || 0,
            statRespondeA: stats.respondeA || 0,
            statRelacionado: stats.relacionadoCon || 0,
            statCorrige: stats.corrigeA || 0,
            statDeriva: stats.derivaDe || 0
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                Utils.animarContador(elemento, parseInt(elemento.textContent) || 0, valor);
            }
        });
    }

    async function cargarDatosIniciales() {
        try {
            console.log('🔄 Cargando datos iniciales...');
            
            const [proyectosResponse, documentosResponse] = await Promise.all([
                ApiClient.request(ACCIONES.OBTENER_PROYECTOS, {}, { cache: false }),
                ApiClient.request(ACCIONES.OBTENER_DOCUMENTOS, {}, { cache: false })
            ]);

            console.log('📊 Respuesta proyectos:', proyectosResponse);
            console.log('📄 Respuesta documentos:', documentosResponse);

            if (proyectosResponse.success && proyectosResponse.proyectos) {
                console.log(`✅ ${proyectosResponse.proyectos.length} proyectos cargados`);
                StateManager.setState({ proyectos: proyectosResponse.proyectos });
                llenarSelectProyectos(proyectosResponse.proyectos);
            } else {
                console.warn('⚠️ No se pudieron cargar los proyectos');
            }

            if (documentosResponse.success && documentosResponse.documentos) {
                console.log(`✅ ${documentosResponse.documentos.length} documentos cargados`);
                StateManager.setState({ documentos: documentosResponse.documentos });
                llenarSelectDocumentos(documentosResponse.documentos);
            } else {
                console.warn('⚠️ No se pudieron cargar los documentos');
                Notificaciones.advertencia('No se encontraron documentos disponibles');
            }

        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            Notificaciones.error('Error al cargar datos iniciales: ' + error.message);
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

    function llenarSelectDocumentos(documentos) {
        console.log('🔄 Llenando selects de documentos con:', documentos);
        
        if (!documentos || documentos.length === 0) {
            console.warn('⚠️ No hay documentos para cargar');
            return;
        }

        const selects = ['filtroDocumentoOrigen', 'filtroDocumentoReferenciado', 'documentoOrigen', 'documentoReferenciado'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) {
                console.warn(`⚠️ Select ${selectId} no encontrado`);
                return;
            }

            // Guardar la primera opción (placeholder)
            const firstOption = select.firstElementChild;
            
            // Limpiar todas las opciones excepto la primera
            select.innerHTML = '';
            if (firstOption) {
                select.appendChild(firstOption);
            }

            let optionsAdded = 0;
            documentos.forEach(documento => {
                try {
                    const option = document.createElement('option');
                    option.value = documento.id;
                    option.textContent = `${documento.codigo} - ${documento.titulo}`;
                    option.setAttribute('data-tipo', documento.tipo || 'Sin tipo');
                    option.setAttribute('data-proyecto', documento.proyecto || 'Sin proyecto');
                    option.setAttribute('data-estado', documento.estado || 'Sin estado');
                    
                    select.appendChild(option);
                    optionsAdded++;
                } catch (error) {
                    console.error('Error agregando opción para documento:', documento, error);
                }
            });
            
            console.log(`✅ ${optionsAdded} opciones agregadas al select ${selectId}`);
        });
        
        console.log('✅ Todos los selects de documentos actualizados');
    }

    async function cargarReferencias() {
        try {
            StateManager.setState({ cargando: true });
            UI.mostrarCargando(true);

            const parametros = {
                page: state.paginaActual,
                size: CONFIG.ITEMS_POR_PAGINA,
                ...state.filtrosActivos
            };

            const data = await ApiClient.request(ACCIONES.OBTENER_REFERENCIAS, parametros);
            
            console.log('Datos de referencias recibidos:', data);
            
            StateManager.setState({
                datosReferencias: data.referencias || [],
                totalPaginas: data.totalPages || 0
            });

            UI.renderizarReferencias(state.datosReferencias);
            
            actualizarPaginacion(data.totalPages, data.currentPage);

        } catch (error) {
            console.error('❌ Error cargando referencias:', error);
            Notificaciones.error('Error al cargar referencias');
            UI.mostrarEstadoVacio('contenedorReferencias', 'Error al cargar los datos');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    // ==================== FUNCIONES PÚBLICAS ADICIONALES ====================
    
    /**
     * Función para recargar manualmente los documentos (útil para debugging)
     */
    async function recargarDocumentos() {
        try {
            console.log('🔄 Recargando documentos manualmente...');
            StateManager.setState({ cargando: true });
            
            Cache.clear(); // Limpiar cache
            
            const documentosResponse = await ApiClient.request(ACCIONES.OBTENER_DOCUMENTOS, {}, { cache: false });
            
            if (documentosResponse.success && documentosResponse.documentos) {
                console.log(`✅ ${documentosResponse.documentos.length} documentos recargados`);
                StateManager.setState({ documentos: documentosResponse.documentos });
                llenarSelectDocumentos(documentosResponse.documentos);
                Notificaciones.exito(`${documentosResponse.documentos.length} documentos cargados correctamente`);
            } else {
                console.warn('⚠️ No se pudieron recargar los documentos');
                Notificaciones.advertencia('No se encontraron documentos disponibles');
            }
        } catch (error) {
            console.error('❌ Error recargando documentos:', error);
            Notificaciones.error('Error al recargar documentos: ' + error.message);
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    /**
     * Función para recargar manualmente los proyectos
     */
    async function recargarProyectos() {
        try {
            console.log('🔄 Recargando proyectos manualmente...');
            StateManager.setState({ cargando: true });
            
            Cache.clear(); // Limpiar cache
            
            const proyectosResponse = await ApiClient.request(ACCIONES.OBTENER_PROYECTOS, {}, { cache: false });
            
            if (proyectosResponse.success && proyectosResponse.proyectos) {
                console.log(`✅ ${proyectosResponse.proyectos.length} proyectos recargados`);
                StateManager.setState({ proyectos: proyectosResponse.proyectos });
                llenarSelectProyectos(proyectosResponse.proyectos);
                Notificaciones.exito(`${proyectosResponse.proyectos.length} proyectos cargados correctamente`);
            } else {
                console.warn('⚠️ No se pudieron recargar los proyectos');
                Notificaciones.advertencia('No se encontraron proyectos disponibles');
            }
        } catch (error) {
            console.error('❌ Error recargando proyectos:', error);
            Notificaciones.error('Error al recargar proyectos: ' + error.message);
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    function aplicarFiltros() {
        const filtros = {
            tipoReferencia: document.getElementById('filtroTipoReferencia')?.value || '',
            documentoOrigen: document.getElementById('filtroDocumentoOrigen')?.value || '',
            documentoReferenciado: document.getElementById('filtroDocumentoReferenciado')?.value || '',
            proyecto: document.getElementById('filtroProyecto')?.value || '',
            busqueda: document.getElementById('filtroBusqueda')?.value?.trim() || ''
        };

        const filtrosLimpios = Object.fromEntries(
            Object.entries(filtros).filter(([key, value]) => value !== '')
        );

        StateManager.setState({ 
            filtrosActivos: filtrosLimpios,
            paginaActual: 1 
        });

        cargarReferencias();
    }

    function limpiarFiltros() {
        const filtroIds = ['filtroTipoReferencia', 'filtroDocumentoOrigen', 'filtroDocumentoReferenciado', 'filtroProyecto', 'filtroBusqueda'];
        
        filtroIds.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.value = '';
        });

        StateManager.setState({ 
            filtrosActivos: {},
            paginaActual: 1 
        });

        cargarReferencias();
    }

    async function agregarReferencia() {
        const form = document.getElementById('formAgregarReferencia');
        
        if (!Utils.validarFormulario(form)) {
            form.classList.add('was-validated');
            return;
        }

        const origenId = document.getElementById('documentoOrigen').value;
        const referenciadoId = document.getElementById('documentoReferenciado').value;
        const tipoReferencia = document.getElementById('tipoReferencia').value;
        const fechaReferencia = document.getElementById('fechaReferencia').value;
        const observaciones = document.getElementById('observacionesReferencia').value;

        if (origenId === referenciadoId) {
            Notificaciones.error('Un documento no puede referenciar a sí mismo');
            return;
        }

        try {
            StateManager.setState({ cargando: true });

            const data = await ApiClient.request(ACCIONES.AGREGAR_REFERENCIA, {
                documentoOrigenId: origenId,
                documentoReferenciadoId: referenciadoId,
                tipoReferencia,
                fechaReferencia,
                observaciones
            });
            
            if (data.success) {
                Notificaciones.exito('Referencia creada correctamente');
                
                const modal = document.getElementById('modalAgregarReferencia');
                if (modal) {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) bsModal.hide();
                }
                
                form.reset();
                form.classList.remove('was-validated');
                document.getElementById('infoDocumentosSeleccionados').style.display = 'none';
                
                Cache.clear();
                await Promise.all([
                    cargarReferencias(),
                    cargarEstadisticas()
                ]);
            } else {
                Notificaciones.error('Error al crear referencia: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al crear referencia');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    async function verDetalles(referenciaId) {
        try {
            const data = await ApiClient.request(ACCIONES.OBTENER_DETALLE, { id: referenciaId });
            
            if (data.success) {
                mostrarModalDetalles(data.referencia);
            } else {
                Notificaciones.error('Error al cargar detalles: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar detalles');
        }
    }

    function mostrarModalDetalles(ref) {
        const modalId = 'modalDetallesReferencia' + Utils.generarId();
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-eye me-2"></i>
                                Detalles de Referencia
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card border-primary">
                                        <div class="card-header bg-primary text-white">
                                            <h6 class="mb-0">Documento Origen</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Código:</strong> ${Utils.htmlEscape(ref.documentoOrigenCodigo)}</p>
                                            <p><strong>Título:</strong> ${Utils.htmlEscape(ref.documentoOrigenTitulo)}</p>
                                            <p><strong>Tipo:</strong> ${Utils.htmlEscape(ref.documentoOrigenTipo || 'N/A')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border-success">
                                        <div class="card-header bg-success text-white">
                                            <h6 class="mb-0">Documento Referenciado</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Código:</strong> ${Utils.htmlEscape(ref.documentoReferenciadoCodigo)}</p>
                                            <p><strong>Título:</strong> ${Utils.htmlEscape(ref.documentoReferenciadoTitulo)}</p>
                                            <p><strong>Tipo:</strong> ${Utils.htmlEscape(ref.documentoReferenciadoTipo || 'N/A')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="mb-0">Información de la Referencia</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <p><strong>Tipo de Referencia:</strong></p>
                                                    <span class="${Utils.getClaseTipoReferencia(ref.tipoReferencia)} fs-6">
                                                        <i class="bi ${Utils.getIconoTipoReferencia(ref.tipoReferencia)} me-1"></i>
                                                        ${ref.tipoReferencia}
                                                    </span>
                                                </div>
                                                <div class="col-md-6">
                                                    <p><strong>Fecha de Referencia:</strong> ${Utils.formatearFecha(ref.fechaReferencia)}</p>
                                                    <p><strong>Creado por:</strong> ${Utils.htmlEscape(ref.creadoPor)}</p>
                                                    <p><strong>Fecha de Creación:</strong> ${Utils.formatearFecha(ref.fechaCreacion)}</p>
                                                </div>
                                            </div>
                                            ${ref.observaciones ? `
                                                <div class="mt-3">
                                                    <p><strong>Observaciones:</strong></p>
                                                    <div class="p-3 bg-light rounded">
                                                        ${Utils.htmlEscape(ref.observaciones).replace(/\n/g, '<br>')}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="ReferenciasApp.abrirModalEditar(${ref.id})">
                                <i class="bi bi-pencil-square me-1"></i>
                                Editar Referencia
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();

        document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
            document.getElementById(modalId).remove();
        });
    }

    // Nueva implementación completa de editar referencia
    async function abrirModalEditar(referenciaId) {
        try {
            const data = await ApiClient.request(ACCIONES.OBTENER_DETALLE, { id: referenciaId });
            
            if (data.success) {
                const ref = data.referencia;
                
                // Llenar el modal de editar
                document.getElementById('referenciaId').value = ref.id;
                document.getElementById('nuevoTipoReferencia').value = ref.tipoReferencia;
                document.getElementById('nuevaFechaReferencia').value = ref.fechaReferencia ? ref.fechaReferencia.split('T')[0] : '';
                document.getElementById('nuevasObservaciones').value = ref.observaciones || '';
                
                // Mostrar información de los documentos
                document.getElementById('infoReferenciaEditar').innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-primary">Documento Origen</h6>
                            <p><strong>${ref.documentoOrigenCodigo}</strong></p>
                            <p class="small text-muted">${ref.documentoOrigenTitulo}</p>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-success">Documento Referenciado</h6>
                            <p><strong>${ref.documentoReferenciadoCodigo}</strong></p>
                            <p class="small text-muted">${ref.documentoReferenciadoTitulo}</p>
                        </div>
                    </div>
                `;
                
                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('modalEditarReferencia'));
                modal.show();
            } else {
                Notificaciones.error('Error al cargar datos de la referencia: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar datos de la referencia');
        }
    }

    // Nueva función para actualizar referencia
    async function actualizarReferencia() {
        const form = document.getElementById('formEditarReferencia');
        
        if (!Utils.validarFormulario(form)) {
            form.classList.add('was-validated');
            return;
        }

        const id = document.getElementById('referenciaId').value;
        const tipoReferencia = document.getElementById('nuevoTipoReferencia').value;
        const fechaReferencia = document.getElementById('nuevaFechaReferencia').value;
        const observaciones = document.getElementById('nuevasObservaciones').value;

        try {
            StateManager.setState({ cargando: true });

            const data = await ApiClient.request(ACCIONES.ACTUALIZAR_REFERENCIA, {
                id,
                tipoReferencia,
                fechaReferencia,
                observaciones
            });
            
            if (data.success) {
                Notificaciones.exito('Referencia actualizada correctamente');
                
                const modal = document.getElementById('modalEditarReferencia');
                if (modal) {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) bsModal.hide();
                }
                
                Cache.clear();
                await Promise.all([
                    cargarReferencias(),
                    cargarEstadisticas()
                ]);
            } else {
                Notificaciones.error('Error al actualizar referencia: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al actualizar referencia');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    function confirmarEliminar(referenciaId) {
        const referencia = state.datosReferencias.find(r => r.id === referenciaId);
        if (!referencia) return;

        const mensaje = `¿Está seguro de eliminar la referencia "${referencia.tipoReferencia}" entre:\n\n` +
                       `${referencia.documentoOrigenCodigo} → ${referencia.documentoReferenciadoCodigo}?\n\n` +
                       `Esta acción no se puede deshacer.`;

        if (confirm(mensaje)) {
            eliminarReferencia(referenciaId);
        }
    }

    async function eliminarReferencia(referenciaId) {
        try {
            StateManager.setState({ cargando: true });

            const data = await ApiClient.request(ACCIONES.ELIMINAR_REFERENCIA, { id: referenciaId });
            
            if (data.success) {
                Notificaciones.exito('Referencia eliminada correctamente');
                
                Cache.clear();
                await Promise.all([
                    cargarReferencias(),
                    cargarEstadisticas()
                ]);
            } else {
                Notificaciones.error('Error al eliminar referencia: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al eliminar referencia');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    // Nueva función para exportar referencias
    async function exportarReferencias() {
        try {
            StateManager.setState({ cargando: true });
            
            const data = await ApiClient.request(ACCIONES.EXPORTAR);
            
            if (data.success && data.csvContent) {
                Utils.descargarCSV(data.csvContent, data.filename || 'referencias_documentales.csv');
                Notificaciones.exito('Reporte exportado correctamente');
            } else {
                Notificaciones.error('Error al generar el reporte de exportación');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al exportar referencias');
        } finally {
            StateManager.setState({ cargando: false });
        }
    }

    // Nueva función para ver grafo en modal
    async function verGrafoReferencias() {
        try {
            const data = await ApiClient.request(ACCIONES.OBTENER_GRAFO);
            
            if (data.success) {
                mostrarModalGrafo(data.grafo);
            } else {
                Notificaciones.error('Error al cargar datos del grafo');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Notificaciones.error('Error de conexión al cargar grafo');
        }
    }

    function mostrarModalGrafo(grafoData) {
        const modal = document.getElementById('modalGrafoReferencias');
        const container = document.getElementById('grafoReferenciaContent');
        
        if (!modal || !container) {
            Notificaciones.error('Modal de grafo no encontrado');
            return;
        }
        
        // Limpiar contenido anterior
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Generando grafo...</span>
                </div>
            </div>
        `;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Renderizar grafo después de que el modal se muestre
        setTimeout(() => {
            UI.renderizarGrafoD3(grafoData);
        }, 300);
    }

    // Nueva función para cambiar vista
    function toggleViewMode() {
        const nuevoModo = state.vistaActual === 'tabla' ? 'grafo' : 'tabla';
        StateManager.setState({ vistaActual: nuevoModo });
        
        const btn = document.getElementById('toggleViewBtn');
        if (btn) {
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            
            if (nuevoModo === 'grafo') {
                icon.className = 'bi bi-table';
                if (text) text.textContent = 'Vista Tabla';
            } else {
                icon.className = 'bi bi-diagram-3';
                if (text) text.textContent = 'Vista Red';
            }
        }
        
        UI.renderizarReferencias(state.datosReferencias);
    }

    function actualizarPaginacion(totalPages, currentPage) {
        const container = document.getElementById('paginacionReferencias');
        if (!container) return;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<nav><ul class="pagination justify-content-center">';
        
        if (currentPage > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="ReferenciasApp.cambiarPagina(${currentPage - 1})">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `;
        }

        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="ReferenciasApp.cambiarPagina(${i})">${i}</a>
                </li>
            `;
        }

        if (currentPage < totalPages) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="ReferenciasApp.cambiarPagina(${currentPage + 1})">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            `;
        }

        html += '</ul></nav>';
        container.innerHTML = html;
    }

    function cambiarPagina(pagina) {
        StateManager.setState({ paginaActual: pagina });
        cargarReferencias();
        
        document.getElementById('contenedorReferencias')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // Nueva función para actualizar todas las referencias
    async function actualizarTodas() {
        try {
            Cache.clear();
            await Promise.all([
                cargarReferencias(),
                cargarEstadisticas()
            ]);
            Notificaciones.exito('Datos actualizados correctamente');
        } catch (error) {
            console.error('❌ Error en actualizarTodas:', error);
            Notificaciones.error('Error al actualizar datos');
        }
    }

    // ==================== INICIALIZACIÓN ====================
    document.addEventListener('DOMContentLoaded', inicializar);

    // ==================== API PÚBLICA ====================
    return {
        // Funciones principales
        aplicarFiltros,
        limpiarFiltros,
        agregarReferencia,
        actualizarReferencia,
        abrirModalEditar,
        confirmarEliminar,
        eliminarReferencia,
        verDetalles,
        cambiarPagina,
        actualizarTodas,
        exportarReferencias,
        verGrafoReferencias,
        toggleViewMode,
        
        // Funciones de recarga manual
        recargarDocumentos,
        recargarProyectos,
        
        // Utilidades
        Utils,
        Cache,
        Notificaciones,
        StateManager,
        UI,
        
        // Estado (solo lectura)
        getState: () => StateManager.getState(),
        
        // Funciones de inicialización
        inicializar,
        cargarReferencias,
        cargarEstadisticas,
        cargarDatosIniciales
    };

})();

// ==================== FUNCIONES GLOBALES PARA COMPATIBILIDAD ====================
window.aplicarFiltros = ReferenciasApp.aplicarFiltros;
window.limpiarFiltros = ReferenciasApp.limpiarFiltros;
window.agregarReferencia = ReferenciasApp.agregarReferencia;
window.actualizarReferencia = ReferenciasApp.actualizarReferencia;
window.abrirModalEditar = ReferenciasApp.abrirModalEditar;
window.confirmarEliminar = ReferenciasApp.confirmarEliminar;
window.verDetalles = ReferenciasApp.verDetalles;
window.cambiarPagina = ReferenciasApp.cambiarPagina;
window.actualizarTodas = ReferenciasApp.actualizarTodas;
window.exportarReferencias = ReferenciasApp.exportarReferencias;
window.verGrafoReferencias = ReferenciasApp.verGrafoReferencias;
window.toggleViewMode = ReferenciasApp.toggleViewMode;

// Funciones de debug/recarga manual
window.recargarDocumentos = ReferenciasApp.recargarDocumentos;
window.recargarProyectos = ReferenciasApp.recargarProyectos;
window.debugReferencias = () => {
    console.log('🐛 DEBUG - Estado completo:', ReferenciasApp.getState());
    console.log('📄 Documentos:', ReferenciasApp.getState().documentos);
    console.log('📊 Proyectos:', ReferenciasApp.getState().proyectos);
    console.log('🔗 Referencias:', ReferenciasApp.getState().datosReferencias);
    
    // Verificar selects en el DOM
    const selects = ['documentoOrigen', 'documentoReferenciado', 'filtroDocumentoOrigen', 'filtroDocumentoReferenciado'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        console.log(`📝 Select ${id}:`, select ? `${select.options.length} opciones` : 'No encontrado');
    });
};

console.log('🔗 Módulo ReferenciasApp v1.0.2 - COMPLETO cargado correctamente');
console.log('💡 Funciones de debug disponibles:');
console.log('   - debugReferencias(): Ver estado completo');
console.log('   - recargarDocumentos(): Recargar lista de documentos');
console.log('   - recargarProyectos(): Recargar lista de proyectos');