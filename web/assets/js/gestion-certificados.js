
'use strict';

// Namespace global para certificados
window.CertificadosManager = (() => {
    
    // ==================== CONSTANTES Y CONFIGURACIÓN ====================
    const CONFIG = {
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        DEBOUNCE_DELAY: 300,
        ANIMATION_DELAY: 100,
        ENDPOINTS: {
            OBTENER_CERTIFICADOS: 'GestionCertificadosServlet?action=obtenerCertificados',
            GENERAR_CERTIFICADO: 'GestionCertificadosServlet',
            GENERAR_PASSWORD: 'GestionCertificadosServlet?action=generarPasswordSeguro',
            VERIFICAR_ESTADO: 'GestionCertificadosServlet?action=verificarEstado'
        },
        ELEMENTOS: {
            // Contenedores principales
            alertContainer: 'alertContainer',
            loadingCertificados: 'loadingCertificados',
            certificadosContainer: 'certificadosContainer',
            certificadosTableBody: 'certificadosTableBody',
            noCertificadosMessage: 'noCertificadosMessage',
            certificatesCount: 'certificatesCount',
            
            // Filtros
            filtroEstado: 'filtroEstado',
            filtroTipo: 'filtroTipo',
            filtroBusqueda: 'filtroBusqueda',
            incluirRevocados: 'incluirRevocados',
            
            // Contadores
            certificadosActivos: 'certificadosActivos',
            certificadosPorVencer: 'certificadosPorVencer',
            certificadosExpirados: 'certificadosExpirados',
            certificadosRevocados: 'certificadosRevocados',
            
            // Formulario
            formNuevoCertificado: 'formNuevoCertificado',
            nombreComun: 'nombreComun',
            organizacion: 'organizacion',
            emailCertificado: 'emailCertificado',
            passwordCertificado: 'passwordCertificado',
            confirmarPasswordCertificado: 'confirmarPasswordCertificado',
            
            // Modales
            modalNuevoCertificado: 'modalNuevoCertificado',
            modalConfirmarAccion: 'modalConfirmarAccion',
            modalDetallesCertificado: 'modalDetallesCertificado',
            btnGenerarCertificado: 'btnGenerarCertificado'
        }
    };

    // ==================== ESTADO DE LA APLICACIÓN ====================
    const state = {
        certificados: [],
        certificadosFiltrados: [],
        certificadoSeleccionado: null,
        isLoading: false,
        controller: null,
        filtros: {
            estado: '',
            tipo: '',
            busqueda: '',
            incluirRevocados: false
        },
        modales: new Map(),
        tooltips: new Map()
    };

    // ==================== UTILIDADES ====================
    const Utils = {
        /**
         * Obtiene un elemento del DOM de forma segura
         */
        getElement: (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`⚠️ Elemento no encontrado: ${id}`);
            }
            return element;
        },

        /**
         * Debounce para optimizar eventos
         */
        debounce: (func, wait = CONFIG.DEBOUNCE_DELAY) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Throttle para limitar frecuencia de ejecución
         */
        throttle: (func, limit = 1000) => {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Escapa HTML para prevenir XSS
         */
        escapeHtml: (str) => {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * Formatea fechas
         */
        formatDate: (date) => {
            if (!date) return 'N/A';
            try {
                return new Date(date).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            } catch (error) {
                console.error('Error formateando fecha:', error);
                return 'Fecha inválida';
            }
        },

        /**
         * Función de easing para animaciones
         */
        easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),

        /**
         * Genera un ID único
         */
        generateId: () => `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

        /**
         * Valida email
         */
        isValidEmail: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        /**
         * Copia texto al portapapeles
         */
        copyToClipboard: async (text) => {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // Fallback para navegadores antiguos
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const result = document.execCommand('copy');
                    textArea.remove();
                    return result;
                }
            } catch (error) {
                console.error('Error copiando al portapapeles:', error);
                return false;
            }
        }
    };

    // ==================== MANEJO DE ERRORES ====================
    const ErrorHandler = {
        /**
         * Manejo centralizado de errores
         */
        handle: (error, context = 'Operación') => {
            console.error(`❌ Error en ${context}:`, error);
            
            let message = `Error en ${context}`;
            let type = 'error';
            
            if (error.name === 'AbortError') {
                message = 'Operación cancelada por tiempo de espera';
                type = 'warning';
            } else if (error.message?.includes('HTTP')) {
                message = 'Error de conexión con el servidor';
            } else if (error.message?.includes('NetworkError')) {
                message = 'Error de red. Verifique su conexión a internet';
            } else if (error.message) {
                message = error.message;
            }
            
            UI.showAlert(type, message);
        },

        /**
         * Validación de respuesta HTTP
         */
        validateResponse: (response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        },

        /**
         * Validación de contenido JSON
         */
        validateJson: async (response) => {
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Respuesta no es JSON:', text.substring(0, 200));
                throw new Error('Respuesta inválida del servidor');
            }
            return response;
        }
    };

    // ==================== INTERFAZ DE USUARIO ====================
    const UI = {
        /**
         * Muestra alertas mejoradas
         */
        showAlert: (type, message, autoDismiss = true) => {
            const alertContainer = Utils.getElement(CONFIG.ELEMENTOS.alertContainer);
            if (!alertContainer) return;

            const alertId = Utils.generateId();
            const iconMap = {
                success: 'bi-check-circle',
                error: 'bi-x-circle',
                warning: 'bi-exclamation-triangle',
                info: 'bi-info-circle'
            };

            const alert = document.createElement('div');
            alert.id = alertId;
            alert.className = `alert alert-${type} alert-dismissible fade show animate-fade-in`;
            alert.setAttribute('role', 'alert');
            alert.setAttribute('aria-live', 'polite');
            
            alert.innerHTML = `
                <i class="${iconMap[type] || 'bi-info-circle'}" aria-hidden="true"></i>
                <div>
                    <strong>${Utils.escapeHtml(message)}</strong>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar alerta"></button>
            `;

            alertContainer.appendChild(alert);
            alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Auto-dismiss para alerts de éxito
            if (autoDismiss && type === 'success') {
                setTimeout(() => {
                    const alertElement = document.getElementById(alertId);
                    if (alertElement) {
                        const bsAlert = new bootstrap.Alert(alertElement);
                        bsAlert.close();
                    }
                }, 5000);
            }

            return alertId;
        },

        /**
         * Muestra/oculta el indicador de carga
         */
        toggleLoading: (show) => {
            const loadingElement = Utils.getElement(CONFIG.ELEMENTOS.loadingCertificados);
            const containerElement = Utils.getElement(CONFIG.ELEMENTOS.certificadosContainer);
            
            if (!loadingElement || !containerElement) return;

            if (show) {
                loadingElement.style.display = 'flex';
                containerElement.style.display = 'none';
                loadingElement.classList.add('animate-fade-in');
            } else {
                loadingElement.style.display = 'none';
                containerElement.style.display = 'block';
                containerElement.classList.add('animate-fade-in');
            }
        },

        /**
         * Actualiza el contador de certificados
         */
        updateCount: (count) => {
            const countElement = Utils.getElement(CONFIG.ELEMENTOS.certificatesCount);
            if (countElement) {
                const text = count === 1 ? '1 certificado' : `${count} certificados`;
                countElement.textContent = text;
            }
        },

        /**
         * Anima contadores con efecto visual
         */
        animateCounter: (elementId, targetValue, duration = 1000) => {
            const element = Utils.getElement(elementId);
            if (!element) return;

            const startValue = parseInt(element.textContent) || 0;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentValue = Math.floor(
                    startValue + (targetValue - startValue) * Utils.easeOutQuart(progress)
                );
                
                element.textContent = currentValue;
                element.setAttribute('data-count', currentValue);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Efecto de escala al finalizar
                    element.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 200);
                }
            };

            requestAnimationFrame(animate);
        },

        /**
         * Inicializa tooltips de Bootstrap
         */
        initTooltips: () => {
            // Destruir tooltips existentes
            state.tooltips.forEach(tooltip => tooltip.dispose());
            state.tooltips.clear();

            // Inicializar nuevos tooltips
            const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltipElements.forEach(element => {
                const tooltip = new bootstrap.Tooltip(element);
                state.tooltips.set(element, tooltip);
            });
        },

        /**
         * Inicializa modales de Bootstrap
         */
        initModals: () => {
            const modalElements = document.querySelectorAll('.modal');
            modalElements.forEach(modalElement => {
                const modal = new bootstrap.Modal(modalElement);
                state.modales.set(modalElement.id, modal);
            });
        },

        /**
         * Muestra modal por ID
         */
        showModal: (modalId) => {
            const modal = state.modales.get(modalId);
            if (modal) {
                modal.show();
            } else {
                console.warn(`Modal no encontrado: ${modalId}`);
            }
        },

        /**
         * Oculta modal por ID
         */
        hideModal: (modalId) => {
            const modal = state.modales.get(modalId);
            if (modal) {
                modal.hide();
            }
        }
    };

    // ==================== VALIDACIONES ====================
    const Validator = {
        /**
         * Valida la fortaleza de la contraseña
         */
        validatePasswordStrength: (password) => {
            if (!password) return { strength: 'none', score: 0, checks: [] };

            const checks = [
                { test: password.length >= 8, text: 'Al menos 8 caracteres' },
                { test: /[A-Z]/.test(password), text: 'Una letra mayúscula' },
                { test: /[a-z]/.test(password), text: 'Una letra minúscula' },
                { test: /[0-9]/.test(password), text: 'Un número' },
                { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'Un carácter especial' }
            ];

            const score = checks.filter(check => check.test).length;
            let strength = 'weak';
            
            if (score >= 3 && score < 5) {
                strength = 'medium';
            } else if (score >= 5) {
                strength = 'strong';
            }

            return { strength, score, checks };
        },

        /**
         * Valida el formulario de nuevo certificado
         */
        validateCertificateForm: () => {
            const form = Utils.getElement(CONFIG.ELEMENTOS.formNuevoCertificado);
            if (!form) return false;

            const nombreComun = Utils.getElement(CONFIG.ELEMENTOS.nombreComun);
            const email = Utils.getElement(CONFIG.ELEMENTOS.emailCertificado);
            const passwordInput = Utils.getElement(CONFIG.ELEMENTOS.passwordCertificado);
            const confirmPassword = Utils.getElement(CONFIG.ELEMENTOS.confirmarPasswordCertificado);

            let isValid = true;

            // Validar nombre común
            if (!nombreComun?.value.trim()) {
                nombreComun?.classList.add('is-invalid');
                isValid = false;
            } else {
                nombreComun?.classList.remove('is-invalid');
            }

            // Validar email (opcional pero si se proporciona debe ser válido)
            if (email?.value && !Utils.isValidEmail(email.value)) {
                email.classList.add('is-invalid');
                isValid = false;
            } else {
                email?.classList.remove('is-invalid');
            }

            // Validar contraseñas si la opción manual está seleccionada
            const opcionManual = document.getElementById('opcionPasswordManual')?.checked;
            if (opcionManual) {
                const passwordStrength = Validator.validatePasswordStrength(passwordInput?.value);
                
                if (!passwordInput?.value || passwordStrength.score < 3) {
                    passwordInput?.classList.add('is-invalid');
                    isValid = false;
                } else {
                    passwordInput?.classList.remove('is-invalid');
                }

                if (passwordInput?.value !== confirmPassword?.value) {
                    confirmPassword?.classList.add('is-invalid');
                    isValid = false;
                } else {
                    confirmPassword?.classList.remove('is-invalid');
                }
            }

            return isValid;
        }
    };

    // ==================== GESTIÓN DE DATOS ====================
    const DataManager = {
        /**
         * Realiza peticiones HTTP con manejo de errores mejorado
         */
        fetchWithRetry: async (url, options = {}, retries = CONFIG.RETRY_ATTEMPTS) => {
            for (let i = 0; i < retries; i++) {
                try {
                    // Cancelar request anterior si existe
                    if (state.controller) {
                        state.controller.abort();
                    }

                    state.controller = new AbortController();
                    const timeoutId = setTimeout(() => state.controller.abort(), CONFIG.TIMEOUT);

                    const response = await fetch(url, {
                        ...options,
                        signal: state.controller.signal,
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'X-Requested-With': 'XMLHttpRequest',
                            ...options.headers
                        }
                    });

                    clearTimeout(timeoutId);

                    ErrorHandler.validateResponse(response);
                    await ErrorHandler.validateJson(response);

                    return response;

                } catch (error) {
                    console.warn(`Intento ${i + 1} fallido:`, error.message);
                    
                    if (error.name === 'AbortError' || i === retries - 1) {
                        throw error;
                    }
                    
                    // Esperar antes del siguiente intento
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
                }
            }
        },

        /**
         * Carga certificados desde el servidor
         */
        loadCertificates: async () => {
            if (state.isLoading) {
                console.log('⏳ Ya hay una carga en progreso...');
                return;
            }

            console.log('📋 Cargando certificados...');
            UI.toggleLoading(true);
            state.isLoading = true;

            try {
                const incluirRevocados = Utils.getElement(CONFIG.ELEMENTOS.incluirRevocados)?.checked || false;
                const url = `${CONFIG.ENDPOINTS.OBTENER_CERTIFICADOS}&incluirRevocados=${incluirRevocados}&t=${Date.now()}`;

                const response = await DataManager.fetchWithRetry(url);
                const data = await response.json();

                console.log('📊 Datos recibidos:', data);

                if (data?.success) {
                    state.certificados = data.certificados || [];
                    CertificatesRenderer.updateSummary();
                    CertificatesRenderer.renderCertificates();
                    FiltersManager.applyFilters();
                    
                    console.log(`✅ ${state.certificados.length} certificados cargados correctamente`);
                } else {
                    throw new Error(data?.message || 'Error desconocido al cargar certificados');
                }

            } catch (error) {
                ErrorHandler.handle(error, 'cargar certificados');
                state.certificados = [];
                CertificatesRenderer.renderCertificates();
            } finally {
                UI.toggleLoading(false);
                state.isLoading = false;
                state.controller = null;
            }
        },

        /**
         * Genera contraseña segura
         */
        generateSecurePassword: async () => {
            try {
                const response = await DataManager.fetchWithRetry(CONFIG.ENDPOINTS.GENERAR_PASSWORD);
                const data = await response.json();
                
                if (data.success) {
                    return data.password;
                } else {
                    throw new Error(data.message || 'Error generando contraseña');
                }
            } catch (error) {
                console.error('❌ Error generando password:', error);
                throw new Error('Error al generar contraseña automática');
            }
        },

        /**
         * Crea un nuevo certificado
         */
        createCertificate: async (formData) => {
            try {
                const response = await DataManager.fetchWithRetry(CONFIG.ENDPOINTS.GENERAR_CERTIFICADO, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Error generando certificado');
                }

                return data;

            } catch (error) {
                console.error('❌ Error en generación:', error);
                throw new Error('Error al generar certificado: ' + error.message);
            }
        }
    };

    // ==================== RENDERIZADO DE CERTIFICADOS ====================
    const CertificatesRenderer = {
        /**
         * Actualiza el resumen de certificados
         */
        updateSummary: () => {
            const conteos = {
                activos: state.certificados.filter(c => c.estado === 'activo').length,
                porVencer: state.certificados.filter(c => c.estadoVigencia === 'por_expirar').length,
                expirados: state.certificados.filter(c => c.estadoVigencia === 'expirado').length,
                revocados: state.certificados.filter(c => c.estado === 'revocado').length
            };

            // Animar contadores con delay escalonado
            setTimeout(() => UI.animateCounter(CONFIG.ELEMENTOS.certificadosActivos, conteos.activos), 100);
            setTimeout(() => UI.animateCounter(CONFIG.ELEMENTOS.certificadosPorVencer, conteos.porVencer), 200);
            setTimeout(() => UI.animateCounter(CONFIG.ELEMENTOS.certificadosExpirados, conteos.expirados), 300);
            setTimeout(() => UI.animateCounter(CONFIG.ELEMENTOS.certificadosRevocados, conteos.revocados), 400);
        },

        /**
         * Renderiza la lista de certificados
         */
        renderCertificates: () => {
            const tbody = Utils.getElement(CONFIG.ELEMENTOS.certificadosTableBody);
            const noDataMessage = Utils.getElement(CONFIG.ELEMENTOS.noCertificadosMessage);
            
            if (!tbody || !noDataMessage) return;

            const certificadosAMostrar = state.certificadosFiltrados.length > 0 ? 
                state.certificadosFiltrados : state.certificados;

            // Actualizar contador
            UI.updateCount(certificadosAMostrar.length);

            if (certificadosAMostrar.length === 0) {
                tbody.innerHTML = '';
                noDataMessage.style.display = 'block';
                noDataMessage.classList.add('animate-fade-in');
                return;
            }

            noDataMessage.style.display = 'none';
            
            tbody.innerHTML = certificadosAMostrar.map((cert, index) => {
                return CertificatesRenderer.createCertificateRow(cert, index);
            }).join('');

            // Inicializar tooltips para la nueva tabla
            setTimeout(() => UI.initTooltips(), 100);
        },

        /**
         * Crea una fila de certificado
         */
        createCertificateRow: (cert, index) => {
            const estadoBadge = CertificatesRenderer.getStatusBadge(cert.estado, cert.estadoVigencia);
            const tipoBadge = CertificatesRenderer.getTypeBadge(cert.tipo);
            const diasVencer = cert.diasParaVencer || 0;
            const diasVencerDisplay = CertificatesRenderer.getDaysToExpireDisplay(diasVencer);
            const actionButtons = CertificatesRenderer.getActionButtons(cert);

            return `
                <tr${cert.esActivo ? ' class="table-success"' : ''} 
                   data-cert-id="${cert.id}" 
                   style="animation-delay: ${index * CONFIG.ANIMATION_DELAY}ms"
                   class="animate-slide-in">
                    <td>${estadoBadge}</td>
                    <td>
                        <div>
                            <strong>${Utils.escapeHtml(cert.nombre || 'Sin nombre')}</strong>
                            ${cert.esActivo ? '<span class="badge bg-primary ms-2">Activo</span>' : ''}
                        </div>
                        <small class="text-muted">Serie: ${Utils.escapeHtml(cert.numeroSerie || 'N/A')}</small>
                    </td>
                    <td>${tipoBadge}</td>
                    <td><small>${Utils.escapeHtml(cert.emisor || 'N/A')}</small></td>
                    <td>
                        <small>
                            Emitido: ${Utils.formatDate(cert.fechaEmision)}<br>
                            Vence: ${Utils.formatDate(cert.fechaVencimiento)}
                        </small>
                    </td>
                    <td>
                        <span class="${CertificatesRenderer.getDaysToExpireClass(diasVencer)}">
                            ${diasVencerDisplay}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            ${actionButtons}
                        </div>
                    </td>
                </tr>
            `;
        },

        /**
         * Obtiene el badge de estado
         */
        getStatusBadge: (estado, estadoVigencia) => {
            if (estado === 'activo') {
                switch (estadoVigencia) {
                    case 'vigente':
                        return '<span class="badge badge-cert-activo">Activo</span>';
                    case 'por_expirar':
                        return '<span class="badge badge-cert-warning">Por Vencer</span>';
                    case 'expirado':
                        return '<span class="badge badge-cert-danger">Expirado</span>';
                    default:
                        return '<span class="badge badge-cert-activo">Activo</span>';
                }
            }
            return '<span class="badge badge-cert-secondary">Revocado</span>';
        },

        /**
         * Obtiene el badge de tipo
         */
        getTypeBadge: (tipo) => {
            const badges = {
                'interno': '<span class="badge bg-primary">Interno</span>',
                'externo': '<span class="badge bg-info">Externo</span>',
                'reniec': '<span class="badge bg-success">RENIEC</span>'
            };
            return badges[tipo] || '<span class="badge bg-secondary">Desconocido</span>';
        },

        /**
         * Obtiene la clase CSS para días de vencimiento
         */
        getDaysToExpireClass: (days) => {
            if (days <= 0) return 'text-danger fw-bold';
            if (days <= 30) return 'text-warning fw-bold';
            return 'text-success';
        },

        /**
         * Obtiene el texto de días de vencimiento
         */
        getDaysToExpireDisplay: (days) => {
            if (days > 0) return `${days} días`;
            if (days === 0) return 'Hoy';
            return 'Expirado';
        },

        /**
         * Genera botones de acción
         */
        getActionButtons: (cert) => {
            let buttons = `
                <button type="button" class="btn btn-outline-info" 
                        onclick="CertificadosManager.verDetallesCertificado(${cert.id})" 
                        title="Ver detalles" data-bs-toggle="tooltip">
                    <i class="bi bi-eye" aria-hidden="true"></i>
                </button>
            `;

            if (cert.estado === 'activo' && !cert.esActivo) {
                buttons += `
                    <button type="button" class="btn btn-outline-success" 
                            onclick="CertificadosManager.configurarComoActivo(${cert.id})" 
                            title="Configurar como activo" data-bs-toggle="tooltip">
                        <i class="bi bi-check-circle" aria-hidden="true"></i>
                    </button>
                `;
            }

            if (cert.estado === 'activo') {
                buttons += `
                    <button type="button" class="btn btn-outline-danger" 
                            onclick="CertificadosManager.revocarCertificado(${cert.id})" 
                            title="Revocar certificado" data-bs-toggle="tooltip">
                        <i class="bi bi-x-circle" aria-hidden="true"></i>
                    </button>
                `;
            }

            return buttons;
        }
    };

    // ==================== GESTIÓN DE FILTROS ====================
    const FiltersManager = {
        /**
         * Inicializa los filtros
         */
        init: () => {
            const filterElements = [
                { id: CONFIG.ELEMENTOS.filtroEstado, event: 'change' },
                { id: CONFIG.ELEMENTOS.filtroTipo, event: 'change' },
                { id: CONFIG.ELEMENTOS.filtroBusqueda, event: 'input' },
                { id: CONFIG.ELEMENTOS.incluirRevocados, event: 'change' }
            ];

            filterElements.forEach(({ id, event }) => {
                const element = Utils.getElement(id);
                if (element) {
                    const handler = event === 'input' ? 
                        Utils.debounce(FiltersManager.applyFilters, CONFIG.DEBOUNCE_DELAY) :
                        FiltersManager.applyFilters;
                    
                    element.addEventListener(event, handler);
                }
            });
        },

        /**
         * Aplica los filtros
         */
        applyFilters: () => {
            console.log('🔍 Aplicando filtros...');
            
            // Actualizar estado de filtros
            state.filtros = {
                estado: Utils.getElement(CONFIG.ELEMENTOS.filtroEstado)?.value || '',
                tipo: Utils.getElement(CONFIG.ELEMENTOS.filtroTipo)?.value || '',
                busqueda: Utils.getElement(CONFIG.ELEMENTOS.filtroBusqueda)?.value.toLowerCase() || '',
                incluirRevocados: Utils.getElement(CONFIG.ELEMENTOS.incluirRevocados)?.checked || false
            };

            // Filtrar certificados
            state.certificadosFiltrados = state.certificados.filter(cert => {
                // Filtro por estado
                if (state.filtros.estado && cert.estado !== state.filtros.estado) {
                    return false;
                }

                // Filtro por tipo
                if (state.filtros.tipo && cert.tipo !== state.filtros.tipo) {
                    return false;
                }

                // Filtro por búsqueda
                if (state.filtros.busqueda) {
                    const searchTerms = [
                        cert.nombre || '',
                        cert.numeroSerie || '',
                        cert.emisor || ''
                    ].join(' ').toLowerCase();
                    
                    if (!searchTerms.includes(state.filtros.busqueda)) {
                        return false;
                    }
                }

                // Filtro para incluir/excluir revocados
                if (!state.filtros.incluirRevocados && cert.estado === 'revocado') {
                    return false;
                }

                return true;
            });

            CertificatesRenderer.renderCertificates();
        },

        /**
         * Limpia todos los filtros
         */
        clearFilters: () => {
            Utils.getElement(CONFIG.ELEMENTOS.filtroEstado).value = '';
            Utils.getElement(CONFIG.ELEMENTOS.filtroTipo).value = '';
            Utils.getElement(CONFIG.ELEMENTOS.filtroBusqueda).value = '';
            Utils.getElement(CONFIG.ELEMENTOS.incluirRevocados).checked = false;
            
            state.filtros = {
                estado: '',
                tipo: '',
                busqueda: '',
                incluirRevocados: false
            };
            
            state.certificadosFiltrados = [];
            CertificatesRenderer.renderCertificates();
        }
    };

    // ==================== GESTIÓN DE FORMULARIOS ====================
    const FormManager = {
        /**
         * Inicializa el formulario
         */
        init: () => {
            FormManager.setupPasswordValidation();
            FormManager.setupFormValidation();
        },

        /**
         * Configura validación de contraseñas
         */
        setupPasswordValidation: () => {
            const passwordInput = Utils.getElement(CONFIG.ELEMENTOS.passwordCertificado);
            const confirmPasswordInput = Utils.getElement(CONFIG.ELEMENTOS.confirmarPasswordCertificado);

            if (passwordInput) {
                passwordInput.addEventListener('input', FormManager.validatePasswordStrength);
            }

            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', FormManager.validatePasswordMatch);
            }
        },

        /**
         * Configura validación del formulario
         */
        setupFormValidation: () => {
            const form = Utils.getElement(CONFIG.ELEMENTOS.formNuevoCertificado);
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (Validator.validateCertificateForm()) {
                        CertificateManager.generate();
                    }
                });
            }
        },

        /**
         * Valida fortaleza de contraseña en tiempo real
         */
        validatePasswordStrength: function() {
            const password = this.value;
            const strengthDiv = document.getElementById('passwordStrength');
            
            if (!strengthDiv || !password) {
                if (strengthDiv) strengthDiv.innerHTML = '';
                return;
            }
            
            const validation = Validator.validatePasswordStrength(password);
            const colorMap = {
                weak: 'text-danger',
                medium: 'text-warning',
                strong: 'text-success'
            };
            
            const strengthMap = {
                weak: 'Débil',
                medium: 'Media',
                strong: 'Fuerte'
            };
            
            strengthDiv.innerHTML = `
                <span class="${colorMap[validation.strength]}">
                    Fortaleza: ${strengthMap[validation.strength]} (${validation.score}/5 requisitos)
                </span>
            `;
        },

        /**
         * Valida coincidencia de contraseñas
         */
        validatePasswordMatch: function() {
            const password = Utils.getElement(CONFIG.ELEMENTOS.passwordCertificado)?.value;
            const confirm = this.value;
            const matchDiv = document.getElementById('passwordMatch');
            
            if (!matchDiv || !confirm) {
                if (matchDiv) matchDiv.innerHTML = '';
                return;
            }
            
            if (password === confirm) {
                matchDiv.innerHTML = '<span class="text-success">✓ Las contraseñas coinciden</span>';
                this.classList.remove('is-invalid');
            } else {
                matchDiv.innerHTML = '<span class="text-danger">✗ Las contraseñas no coinciden</span>';
                this.classList.add('is-invalid');
            }
        },

        /**
         * Alterna opciones de contraseña
         */
        togglePasswordOptions: () => {
            const opcionManual = document.getElementById('opcionPasswordManual')?.checked;
            const containerManual = document.getElementById('passwordManualContainer');
            const containerGenerada = document.getElementById('passwordGeneradaContainer');
            const passwordInput = Utils.getElement(CONFIG.ELEMENTOS.passwordCertificado);
            const confirmPasswordInput = Utils.getElement(CONFIG.ELEMENTOS.confirmarPasswordCertificado);

            if (containerManual && containerGenerada) {
                if (opcionManual) {
                    containerManual.style.display = 'block';
                    containerGenerada.style.display = 'none';
                    if (passwordInput) passwordInput.required = true;
                    if (confirmPasswordInput) confirmPasswordInput.required = true;
                } else {
                    containerManual.style.display = 'none';
                    containerGenerada.style.display = 'block';
                    if (passwordInput) passwordInput.required = false;
                    if (confirmPasswordInput) confirmPasswordInput.required = false;
                }
            }
        },

        /**
         * Alterna visibilidad de contraseña
         */
        togglePasswordVisibility: (inputId) => {
            const input = Utils.getElement(inputId);
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
        },

        /**
         * Resetea el formulario
         */
        reset: () => {
            const form = Utils.getElement(CONFIG.ELEMENTOS.formNuevoCertificado);
            if (form) {
                form.reset();
                form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
                
                // Limpiar validaciones
                document.getElementById('passwordStrength').innerHTML = '';
                document.getElementById('passwordMatch').innerHTML = '';
                
                // Prellenar email del usuario si está disponible
                const userEmail = window.SGD_USER_DATA?.userEmail || '';
                const emailInput = Utils.getElement(CONFIG.ELEMENTOS.emailCertificado);
                if (userEmail && emailInput) {
                    emailInput.value = userEmail;
                }
                
                FormManager.togglePasswordOptions();
            }
        }
    };

    // ==================== GESTIÓN DE CERTIFICADOS ====================
    const CertificateManager = {
        /**
         * Muestra modal de nuevo certificado
         */
        showNewModal: () => {
            FormManager.reset();
            UI.showModal(CONFIG.ELEMENTOS.modalNuevoCertificado);
            
            // Focus en el primer campo después de abrir el modal
            setTimeout(() => {
                const nombreInput = Utils.getElement(CONFIG.ELEMENTOS.nombreComun);
                if (nombreInput) nombreInput.focus();
            }, 300);
        },

        /**
         * Genera un nuevo certificado
         */
        generate: async () => {
            if (!Validator.validateCertificateForm()) {
                return;
            }

            const btnGenerar = Utils.getElement(CONFIG.ELEMENTOS.btnGenerarCertificado);
            const textOriginal = btnGenerar?.innerHTML;
            
            try {
                // Deshabilitar botón
                if (btnGenerar) {
                    btnGenerar.disabled = true;
                    btnGenerar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generando...';
                }

                const opcionPasswordGenerada = document.getElementById('opcionPasswordGenerada')?.checked;
                let passwordCertificado = Utils.getElement(CONFIG.ELEMENTOS.passwordCertificado)?.value;

                if (opcionPasswordGenerada) {
                    passwordCertificado = await DataManager.generateSecurePassword();
                    if (!passwordCertificado) {
                        throw new Error('Error al generar contraseña automática');
                    }
                    await CertificateManager.processGeneration(passwordCertificado, true);
                } else {
                    const confirmarPassword = Utils.getElement(CONFIG.ELEMENTOS.confirmarPasswordCertificado)?.value;
                    if (passwordCertificado !== confirmarPassword) {
                        throw new Error('Las contraseñas no coinciden');
                    }
                    await CertificateManager.processGeneration(passwordCertificado, false);
                }

            } catch (error) {
                console.error('❌ Error generando certificado:', error);
                UI.showAlert('error', error.message);
            } finally {
                // Restaurar botón
                if (btnGenerar && textOriginal) {
                    btnGenerar.disabled = false;
                    btnGenerar.innerHTML = textOriginal;
                }
            }
        },

        /**
         * Procesa la generación del certificado
         */
        processGeneration: async (passwordCertificado, passwordGenerado) => {
            const formData = new FormData();
            formData.append('action', 'generarCertificado');
            formData.append('passwordCertificado', passwordCertificado);
            formData.append('confirmarPassword', passwordCertificado);
            formData.append('nombreComun', Utils.getElement(CONFIG.ELEMENTOS.nombreComun)?.value || '');
            formData.append('organizacion', Utils.getElement(CONFIG.ELEMENTOS.organizacion)?.value || '');
            formData.append('email', Utils.getElement(CONFIG.ELEMENTOS.emailCertificado)?.value || '');

            try {
                const data = await DataManager.createCertificate(formData);
                
                // Cerrar modal
                UI.hideModal(CONFIG.ELEMENTOS.modalNuevoCertificado);
                
                if (passwordGenerado) {
                    CertificateManager.showGeneratedPassword(passwordCertificado, data.message);
                } else {
                    UI.showAlert('success', data.message);
                }
                
                // Recargar certificados después de un delay
                setTimeout(() => DataManager.loadCertificates(), 1500);

            } catch (error) {
                console.error('❌ Error en generación:', error);
                throw new Error('Error al generar certificado: ' + error.message);
            }
        },

        /**
         * Muestra la contraseña generada
         */
        showGeneratedPassword: (password, message) => {
            const alertId = Utils.generateId();
            const alertHtml = `
                <div class="alert alert-success alert-dismissible fade show animate-fade-in" role="alert" id="${alertId}">
                    <div class="d-flex align-items-start gap-3">
                        <i class="bi bi-check-circle-fill text-success fs-4 mt-1 flex-shrink-0"></i>
                        <div class="flex-grow-1">
                            <h5 class="mb-2">¡Certificado Generado Exitosamente!</h5>
                            <p class="mb-3">${Utils.escapeHtml(message)}</p>
                            
                            <div class="bg-light p-3 rounded mb-3">
                                <label class="form-label fw-bold mb-2">Su contraseña del certificado:</label>
                                <div class="input-group">
                                    <input type="text" class="form-control font-monospace" 
                                           value="${Utils.escapeHtml(password)}" readonly 
                                           id="passwordGeneradaDisplay">
                                    <button class="btn btn-outline-primary" type="button" 
                                            onclick="CertificadosManager.copiarPassword('${password}')">
                                        <i class="bi bi-clipboard"></i> Copiar
                                    </button>
                                </div>
                            </div>
                            
                            <div class="alert alert-warning border-0 mb-0">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                <strong>¡IMPORTANTE!</strong> 
                                Guarde esta contraseña en un lugar seguro. No se volverá a mostrar 
                                y la necesitará para firmar documentos.
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
                </div>
            `;
            
            const alertContainer = Utils.getElement(CONFIG.ELEMENTOS.alertContainer);
            if (alertContainer) {
                alertContainer.innerHTML = alertHtml;
                alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        },

        /**
         * Copia contraseña al portapapeles
         */
        copyPassword: async (password) => {
            const success = await Utils.copyToClipboard(password);
            
            if (success) {
                UI.showAlert('success', 'Contraseña copiada al portapapeles');
            } else {
                UI.showAlert('warning', 'No se pudo copiar automáticamente. Seleccione y copie manualmente.');
            }
        }
    };

    // ==================== INICIALIZACIÓN ====================
    const init = () => {
        console.log('🚀 Inicializando Gestión de Certificados v2.0...');
        
        try {
            // Verificar elementos esenciales
            const essentialElements = [
                CONFIG.ELEMENTOS.alertContainer,
                CONFIG.ELEMENTOS.certificadosContainer,
                CONFIG.ELEMENTOS.certificadosTableBody
            ];

            const missingElements = essentialElements.filter(id => !Utils.getElement(id));
            if (missingElements.length > 0) {
                console.error('❌ Elementos esenciales no encontrados:', missingElements);
                return;
            }

            // Inicializar componentes
            UI.initModals();
            FiltersManager.init();
            FormManager.init();
            
            // Cargar datos iniciales
            DataManager.loadCertificates();
            
            // Configurar cleanup al cerrar la página
            window.addEventListener('beforeunload', () => {
                if (state.controller) {
                    state.controller.abort();
                }
                
                // Limpiar tooltips
                state.tooltips.forEach(tooltip => tooltip.dispose());
                state.tooltips.clear();
            });
            
            console.log('✅ Módulo de certificados inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando certificados:', error);
            UI.showAlert('error', 'Error al inicializar la página de certificados');
        }
    };

    // ==================== FUNCIONES PLACEHOLDER ====================
// ==================== FUNCIONES PLACEHOLDER ====================
const PlaceholderActions = {
    verDetallesCertificado: (certificadoId) => {
        console.log('👁️ Ver detalles del certificado:', certificadoId);
        
        const certificado = state.certificados.find(c => c.id === certificadoId);
        if (!certificado) {
            UI.showAlert('error', 'Certificado no encontrado');
            return;
        }

        const modalBody = document.getElementById('modalDetallesCertificadoBody');
        if (!modalBody) {
            UI.showAlert('error', 'Error en la interfaz. Intente recargar la página.');
            return;
        }

        // Calcular días restantes
        const diasRestantes = certificado.diasParaVencer || 0;
        let estadoVigencia = 'Vigente';
        let estadoClass = 'text-success';
        
        if (diasRestantes <= 0) {
            estadoVigencia = 'Expirado';
            estadoClass = 'text-danger';
        } else if (diasRestantes <= 30) {
            estadoVigencia = `Expira en ${diasRestantes} días`;
            estadoClass = 'text-warning';
        } else {
            estadoVigencia = `Vigente (${diasRestantes} días restantes)`;
        }

        modalBody.innerHTML = `
            <div class="container-fluid">
                <!-- Estado del certificado -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card ${certificado.esActivo ? 'border-success' : 'border-secondary'}">
                            <div class="card-header ${certificado.esActivo ? 'bg-success text-white' : 'bg-secondary text-white'}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">
                                        <i class="bi bi-shield-check me-2"></i>
                                        Estado del Certificado
                                    </h6>
                                    ${certificado.esActivo ? '<span class="badge bg-light text-success">ACTIVO</span>' : ''}
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <strong>Estado:</strong>
                                        <span class="ms-2 badge badge-cert-activo">${certificado.estado}</span>
                                    </div>
                                    <div class="col-md-6">
                                        <strong>Vigencia:</strong>
                                        <span class="ms-2 ${estadoClass}">${estadoVigencia}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Información del titular -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h6 class="border-bottom pb-2 mb-3">
                            <i class="bi bi-person me-2"></i>Información del Titular
                        </h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Nombre Común:</label>
                                <p class="mb-0">${Utils.escapeHtml(certificado.nombre || 'No especificado')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Organización:</label>
                                <p class="mb-0">${Utils.escapeHtml(certificado.organizacion || 'No especificada')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Email:</label>
                                <p class="mb-0">${Utils.escapeHtml(certificado.email || 'No especificado')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Tipo:</label>
                                <p class="mb-0">${CertificatesRenderer.getTypeBadge(certificado.tipo)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Información técnica -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h6 class="border-bottom pb-2 mb-3">
                            <i class="bi bi-gear me-2"></i>Información Técnica
                        </h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Número de Serie:</label>
                                <p class="mb-0 font-monospace">${Utils.escapeHtml(certificado.numeroSerie || 'No disponible')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Emisor:</label>
                                <p class="mb-0">${Utils.escapeHtml(certificado.emisor || 'No especificado')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Algoritmo:</label>
                                <p class="mb-0">${Utils.escapeHtml(certificado.algoritmo || 'RSA-2048')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Uso:</label>
                                <p class="mb-0">${certificado.usoFirma ? 'Firma Digital' : 'No especificado'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fechas importantes -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h6 class="border-bottom pb-2 mb-3">
                            <i class="bi bi-calendar me-2"></i>Fechas Importantes
                        </h6>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Fecha de Emisión:</label>
                                <p class="mb-0">${Utils.formatDate(certificado.fechaEmision)}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Fecha de Vencimiento:</label>
                                <p class="mb-0">${Utils.formatDate(certificado.fechaVencimiento)}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Fecha de Creación:</label>
                                <p class="mb-0">${Utils.formatDate(certificado.fechaCreacion)}</p>
                            </div>
                            ${certificado.fechaRevocacion ? `
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold text-danger">Fecha de Revocación:</label>
                                <p class="mb-0 text-danger">${Utils.formatDate(certificado.fechaRevocacion)}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold text-danger">Motivo de Revocación:</label>
                                <p class="mb-0 text-danger">${Utils.escapeHtml(certificado.motivoRevocacion || 'No especificado')}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Estadísticas de uso -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h6 class="border-bottom pb-2 mb-3">
                            <i class="bi bi-bar-chart me-2"></i>Estadísticas de Uso
                        </h6>
                        <div class="row">
                            <div class="col-md-4 text-center">
                                <div class="card bg-light">
                                    <div class="card-body py-3">
                                        <h4 class="text-primary mb-1">${certificado.documentosFirmados || 0}</h4>
                                        <small class="text-muted">Documentos Firmados</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="card bg-light">
                                    <div class="card-body py-3">
                                        <h4 class="text-info mb-1">${Utils.formatDate(certificado.ultimoUso) || 'Nunca'}</h4>
                                        <small class="text-muted">Último Uso</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="card bg-light">
                                    <div class="card-body py-3">
                                        <h4 class="text-success mb-1">${certificado.diasActivo || 0}</h4>
                                        <small class="text-muted">Días Activo</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acciones rápidas -->
                ${certificado.estado === 'activo' ? `
                <div class="row">
                    <div class="col-12">
                        <h6 class="border-bottom pb-2 mb-3">
                            <i class="bi bi-lightning me-2"></i>Acciones Rápidas
                        </h6>
                        <div class="d-flex gap-2 flex-wrap">
                            ${!certificado.esActivo ? `
                            <button type="button" class="btn btn-outline-success btn-sm" 
                                    onclick="CertificadosManager.accionCertificado('configurar', ${certificado.id})">
                                <i class="bi bi-check-circle me-1"></i>Configurar como Activo
                            </button>
                            ` : ''}
                            <button type="button" class="btn btn-outline-danger btn-sm" 
                                    onclick="CertificadosManager.accionCertificado('revocar', ${certificado.id})">
                                <i class="bi bi-x-circle me-1"></i>Revocar Certificado
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm" 
                                    onclick="CertificadosManager.accionCertificado('descargar', ${certificado.id})">
                                <i class="bi bi-download me-1"></i>Descargar Certificado
                            </button>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        // Almacenar certificado seleccionado


// Agregar event listeners a los botones de acción
state.certificadoSeleccionado = certificado;

// Mostrar modal
UI.showModal('modalDetallesCertificado');
        
        // Mostrar modal
        UI.showModal('modalDetallesCertificado');
    },

    configurarComoActivo: async (certificadoId) => {
        console.log('✅ Configurando certificado como activo:', certificadoId);
        
        const certificado = state.certificados.find(c => c.id === certificadoId);
        if (!certificado) {
            UI.showAlert('error', 'Certificado no encontrado');
            return;
        }

        if (certificado.estado !== 'activo') {
            UI.showAlert('error', 'Solo certificados activos pueden ser configurados como principal');
            return;
        }

        if (certificado.esActivo) {
            UI.showAlert('info', 'Este certificado ya está configurado como activo');
            return;
        }

        if (certificado.estadoVigencia === 'expirado') {
            UI.showAlert('error', 'No se puede activar un certificado expirado');
            return;
        }

        const modalBody = document.getElementById('modalConfirmarAccionBody');
        const btnConfirmar = document.getElementById('btnConfirmarAccion');
        
        if (!modalBody || !btnConfirmar) {
            UI.showAlert('error', 'Error en la interfaz. Intente recargar la página.');
            return;
        }

        modalBody.innerHTML = `
            <div class="text-center">
                <div class="mb-3">
                    <i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i>
                </div>
                
                <h5 class="mb-3">¿Configurar como certificado activo?</h5>
                
                <div class="card border-success mb-3">
                    <div class="card-body py-3">
                        <div class="mb-2">
                            <strong>Certificado:</strong><br>
                            <span class="text-muted">${Utils.escapeHtml(certificado.nombre || 'Sin nombre')}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Serie:</strong><br>
                            <span class="text-muted">${Utils.escapeHtml(certificado.numeroSerie || 'N/A')}</span>
                        </div>
                        <div class="mb-0">
                            <strong>Vigencia:</strong><br>
                            <span class="text-muted">Hasta ${Utils.formatDate(certificado.fechaVencimiento)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-info text-start mb-3">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Nota:</strong> Este certificado se establecerá como el predeterminado 
                    para firmar documentos.
                </div>
                
                <div class="form-check text-start">
                    <input class="form-check-input" type="checkbox" id="confirmarCambio" required>
                    <label class="form-check-label" for="confirmarCambio">
                        Confirmo que deseo establecer este certificado como activo
                    </label>
                </div>
            </div>
        `;

        btnConfirmar.className = 'btn btn-success';
        btnConfirmar.innerHTML = '<i class="bi bi-check-circle me-1"></i>Configurar como Activo';
        
        const newBtnConfirmar = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);
        
        newBtnConfirmar.addEventListener('click', async () => {
            const confirmarCheckbox = document.getElementById('confirmarCambio');
            
            if (!confirmarCheckbox.checked) {
                UI.showAlert('warning', 'Debe confirmar el cambio para continuar');
                return;
            }

            const originalText = newBtnConfirmar.innerHTML;
            
            try {
    newBtnConfirmar.disabled = true;
    newBtnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Configurando...';
    
    // Preparar datos para el servidor
    const formData = new FormData();
    formData.append('action', 'configurarActivo');
    formData.append('certificadoId', certificadoId);

    // Hacer petición real al servidor
    const response = await DataManager.fetchWithRetry(
        CONFIG.ENDPOINTS.GENERAR_CERTIFICADO, 
        {
            method: 'POST',
            body: formData
        }
    );

    const data = await response.json();

    if (data.success) {
        // Cerrar modal
        UI.hideModal('modalConfirmarAccion');
        
        // Mostrar mensaje de éxito
        UI.showAlert('success', `Certificado configurado como activo exitosamente. ${data.message || ''}`);
        
        // Recargar certificados desde el servidor
        setTimeout(() => DataManager.loadCertificates(), 1000);
        
    } else {
        throw new Error(data.message || 'Error al configurar el certificado');
    }

} catch (error) {
    console.error('❌ Error configurando certificado:', error);
    UI.showAlert('error', `Error al configurar certificado: ${error.message}`);
} finally {
    newBtnConfirmar.disabled = false;
    newBtnConfirmar.innerHTML = originalText;
}
        });

        UI.showModal('modalConfirmarAccion');
    },

    revocarCertificado: async (certificadoId) => {
        console.log('❌ Iniciando revocación del certificado:', certificadoId);
        
        const certificado = state.certificados.find(c => c.id === certificadoId);
        if (!certificado) {
            UI.showAlert('error', 'Certificado no encontrado');
            return;
        }

        if (certificado.estado !== 'activo') {
            UI.showAlert('warning', 'Solo se pueden revocar certificados activos');
            return;
        }

        const modalBody = document.getElementById('modalConfirmarAccionBody');
        const btnConfirmar = document.getElementById('btnConfirmarAccion');
        
        if (!modalBody || !btnConfirmar) {
            UI.showAlert('error', 'Error en la interfaz. Intente recargar la página.');
            return;
        }

        modalBody.innerHTML = `
            <div class="text-center">
                <div class="mb-3">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                </div>
                
                <h5 class="mb-3">¿Confirmar revocación de certificado?</h5>
                
                <div class="card border-warning mb-3">
                    <div class="card-body py-3">
                        <div class="mb-2">
                            <strong>Certificado:</strong><br>
                            <span class="text-muted">${Utils.escapeHtml(certificado.nombre || 'Sin nombre')}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Serie:</strong><br>
                            <span class="text-muted">${Utils.escapeHtml(certificado.numeroSerie || 'N/A')}</span>
                        </div>
                        <div class="mb-0">
                            <strong>Emisor:</strong><br>
                            <span class="text-muted">${Utils.escapeHtml(certificado.emisor || 'N/A')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-danger text-start mb-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Advertencia:</strong> Esta acción no se puede deshacer. 
                    El certificado será revocado permanentemente.
                </div>
                
                <div class="text-start">
                    <label for="motivoRevocacion" class="form-label fw-bold">
                        Motivo de revocación (opcional):
                    </label>
                    <select class="form-select mb-3" id="motivoRevocacion">
                        <option value="">Seleccionar motivo...</option>
                        <option value="compromiso_clave">Compromiso de clave privada</option>
                        <option value="cambio_datos">Cambio en los datos del titular</option>
                        <option value="fin_relacion">Fin de relación laboral</option>
                        <option value="solicitud_titular">Solicitud del titular</option>
                        <option value="otro">Otro motivo</option>
                    </select>
                    
                    <div id="otroMotivoContainer" style="display: none;">
                        <label for="otroMotivoTexto" class="form-label fw-bold">
                            Especifique:
                        </label>
                        <textarea class="form-control" id="otroMotivoTexto" rows="2" 
                                 placeholder="Describa el motivo..."></textarea>
                    </div>
                </div>
            </div>
        `;

        const motivoSelect = document.getElementById('motivoRevocacion');
        const otroMotivoContainer = document.getElementById('otroMotivoContainer');
        
        motivoSelect.addEventListener('change', () => {
            if (motivoSelect.value === 'otro') {
                otroMotivoContainer.style.display = 'block';
            } else {
                otroMotivoContainer.style.display = 'none';
            }
        });

        btnConfirmar.className = 'btn btn-danger';
        btnConfirmar.innerHTML = '<i class="bi bi-x-circle me-1"></i>Revocar Certificado';
        
        const newBtnConfirmar = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);
        
        newBtnConfirmar.addEventListener('click', async () => {
            const originalText = newBtnConfirmar.innerHTML;
            
           try {
    newBtnConfirmar.disabled = true;
    newBtnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Revocando...';
    
    // Obtener motivo de revocación
    const motivoSelect = document.getElementById('motivoRevocacion');
    const otroMotivoTexto = document.getElementById('otroMotivoTexto');
    let motivo = motivoSelect.value;
    
    if (motivo === 'otro' && otroMotivoTexto.value.trim()) {
        motivo = otroMotivoTexto.value.trim();
    }

    // Preparar datos para el servidor
    const formData = new FormData();
    formData.append('action', 'revocarCertificado');
    formData.append('certificadoId', certificadoId);
    formData.append('motivo', motivo);
    formData.append('fechaRevocacion', new Date().toISOString());

    // Hacer petición real al servidor
    const response = await DataManager.fetchWithRetry(
        CONFIG.ENDPOINTS.GENERAR_CERTIFICADO, 
        {
            method: 'POST',
            body: formData
        }
    );

    const data = await response.json();

    if (data.success) {
        // Cerrar modal
        UI.hideModal('modalConfirmarAccion');
        
        // Mostrar mensaje de éxito
        UI.showAlert('success', `Certificado revocado exitosamente. ${data.message || ''}`);
        
        // Recargar certificados desde el servidor
        setTimeout(() => DataManager.loadCertificates(), 1000);
        
    } else {
        throw new Error(data.message || 'Error al revocar el certificado');
    }

} catch (error) {
    console.error('❌ Error revocando certificado:', error);
    UI.showAlert('error', `Error al revocar certificado: ${error.message}`);
} finally {
    newBtnConfirmar.disabled = false;
    newBtnConfirmar.innerHTML = originalText;
}
        });

        UI.showModal('modalConfirmarAccion');
    },
    
    descargarCertificado: async (certificadoId) => {
    console.log('📥 Descargando certificado:', certificadoId);
    
    const certificado = state.certificados.find(c => c.id === certificadoId);
    if (!certificado) {
        UI.showAlert('error', 'Certificado no encontrado');
        return;
    }

    const modalBody = document.getElementById('modalConfirmarAccionBody');
    const btnConfirmar = document.getElementById('btnConfirmarAccion');
    
    if (!modalBody || !btnConfirmar) {
        UI.showAlert('error', 'Error en la interfaz. Intente recargar la página.');
        return;
    }

    modalBody.innerHTML = `
        <div class="text-center">
            <div class="mb-3">
                <i class="bi bi-download text-primary" style="font-size: 3rem;"></i>
            </div>
            
            <h5 class="mb-3">Descargar Certificado</h5>
            
            <div class="card border-primary mb-3">
                <div class="card-body py-3">
                    <div class="mb-2">
                        <strong>Certificado:</strong><br>
                        <span class="text-muted">${Utils.escapeHtml(certificado.nombre || 'Sin nombre')}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Serie:</strong><br>
                        <span class="text-muted">${Utils.escapeHtml(certificado.numeroSerie || 'N/A')}</span>
                    </div>
                    <div class="mb-0">
                        <strong>Estado:</strong><br>
                        <span class="text-muted">${certificado.estado}</span>
                    </div>
                </div>
            </div>
            
            <div class="text-start">
                <label for="formatoDescarga" class="form-label fw-bold">
                    Formato de descarga:
                </label>
                <select class="form-select mb-3" id="formatoDescarga">
                    <option value="pfx">PFX - Archivo de intercambio personal (Recomendado)</option>
                    <option value="cer">CER - Certificado público solamente</option>
                    <option value="p12">P12 - Archivo PKCS#12</option>
                    <option value="pem">PEM - Formato base64</option>
                </select>
                
                <div class="alert alert-info text-start mb-3">
                    <i class="bi bi-info-circle me-2"></i>
                    <div>
                        <strong>Información:</strong>
                        <ul class="mb-0 mt-2">
                            <li><strong>PFX/P12:</strong> Incluye clave privada (requiere contraseña)</li>
                            <li><strong>CER:</strong> Solo certificado público (sin clave privada)</li>
                            <li><strong>PEM:</strong> Formato texto compatible con sistemas Unix</li>
                        </ul>
                    </div>
                </div>
                
                <div id="passwordContainer" class="mb-3">
                    <label for="passwordDescarga" class="form-label fw-bold">
                        Contraseña del certificado:
                    </label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="passwordDescarga" 
                               placeholder="Ingrese la contraseña del certificado">
                        <button class="btn btn-outline-secondary" type="button" 
                                onclick="CertificadosManager.togglePasswordVisibility('passwordDescarga')">
                            <i class="bi bi-eye" id="iconPasswordDescarga"></i>
                        </button>
                    </div>
                    <small class="form-text text-muted">
                        Requerida para formatos PFX y P12
                    </small>
                </div>
                
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="incluirCadena" checked>
                    <label class="form-check-label" for="incluirCadena">
                        Incluir cadena de certificación completa
                    </label>
                </div>
            </div>
        </div>
    `;

    // Manejar cambio de formato
    const formatoSelect = document.getElementById('formatoDescarga');
    const passwordContainer = document.getElementById('passwordContainer');
    
    formatoSelect.addEventListener('change', () => {
        const formato = formatoSelect.value;
        if (formato === 'cer' || formato === 'pem') {
            passwordContainer.style.display = 'none';
        } else {
            passwordContainer.style.display = 'block';
        }
    });

    btnConfirmar.className = 'btn btn-primary';
    btnConfirmar.innerHTML = '<i class="bi bi-download me-1"></i>Descargar';
    
    const newBtnConfirmar = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);
    
    newBtnConfirmar.addEventListener('click', async () => {
        const formato = document.getElementById('formatoDescarga').value;
        const password = document.getElementById('passwordDescarga').value;
        const incluirCadena = document.getElementById('incluirCadena').checked;
        
        // Validar contraseña para formatos que la requieren
        if ((formato === 'pfx' || formato === 'p12') && !password.trim()) {
            UI.showAlert('warning', 'La contraseña es requerida para el formato seleccionado');
            return;
        }

        const originalText = newBtnConfirmar.innerHTML;
        
        try {
    newBtnConfirmar.disabled = true;
    newBtnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Descargando...';
    
    // Simular proceso de descarga
    await PlaceholderActions.procesarDescarga(certificado, formato, password, incluirCadena);
    
    UI.hideModal('modalConfirmarAccion');
    UI.showAlert('success', `Certificado descargado exitosamente en formato ${formato.toUpperCase()}`);
    
} catch (error) {
    console.error('❌ Error descargando certificado:', error);
    UI.showAlert('error', `Error al descargar certificado: ${error.message}`);
} finally {
    newBtnConfirmar.disabled = false;
    newBtnConfirmar.innerHTML = originalText;
}
    });

    UI.showModal('modalConfirmarAccion');
},

procesarDescarga: async (certificado, formato, password, incluirCadena) => {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generar contenido simulado del certificado
    const contenidoCertificado = PlaceholderActions.generarContenidoCertificado(certificado, formato, incluirCadena);
    
    // Crear nombre de archivo
    const nombreBase = (certificado.nombre || 'certificado').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `${nombreBase}_${timestamp}.${formato}`;
    
    // Crear y descargar archivo
    const blob = new Blob([contenidoCertificado], { 
        type: PlaceholderActions.getMimeType(formato) 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = nombreArchivo;
    
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
},

generarContenidoCertificado: (certificado, formato, incluirCadena) => {
    const fechaActual = new Date().toISOString();
    
    switch (formato) {
        case 'pfx':
        case 'p12':
            // Simular contenido binario codificado en base64
            return `-----BEGIN PKCS12-----
MIIFpAIBAzCCBWAGCSqGSIb3DQEHAaCCBVEEggVNMIIFSTCCAv8GCSqGSIb3DQEH
BqCCAvAwggLsAgEAMIIC5QYJKoZIhvcNAQcBMBwGCiqGSIb3DQEMAQYwDgQI${btoa(certificado.numeroSerie || 'DEFAULT')}
AgIIAACCArgwggK0AgEBMIICrTCCAqkCAQEwDQYJKoZIhvcNAQEBBQAEggKZMIIC
lQIBADANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA${btoa(certificado.id || '1')}
[... CONTENIDO CERTIFICADO SIMULADO ...]
-----END PKCS12-----`;

        case 'cer':
            return `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/OvFjmd1MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
${btoa(certificado.nombre || 'Certificate')}
Subject: CN=${certificado.nombre || 'Certificate'}, O=${certificado.organizacion || 'Organization'}
Serial: ${certificado.numeroSerie || 'N/A'}
Issuer: ${certificado.emisor || 'Unknown'}
Valid From: ${Utils.formatDate(certificado.fechaEmision)}
Valid To: ${Utils.formatDate(certificado.fechaVencimiento)}
${incluirCadena ? 'Certificate Chain: Included' : 'Certificate Chain: Not included'}
-----END CERTIFICATE-----`;

        case 'pem':
            let contenido = `Certificate Information:
Subject: CN=${certificado.nombre || 'Certificate'}
Serial Number: ${certificado.numeroSerie || 'N/A'}
Issuer: ${certificado.emisor || 'Unknown'}
Valid From: ${Utils.formatDate(certificado.fechaEmision)}
Valid To: ${Utils.formatDate(certificado.fechaVencimiento)}
Status: ${certificado.estado}

-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/OvFjmd1MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
${btoa(certificado.nombre || 'Certificate')}
-----END CERTIFICATE-----`;

            if (incluirCadena) {
                contenido += `

-----BEGIN CERTIFICATE-----
[... CERTIFICADO INTERMEDIO ...]
-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
[... CERTIFICADO RAÍZ ...]
-----END CERTIFICATE-----`;
            }
            
            return contenido;

        default:
            throw new Error('Formato no soportado');
    }
},

getMimeType: (formato) => {
    const mimeTypes = {
        'pfx': 'application/x-pkcs12',
        'p12': 'application/x-pkcs12',
        'cer': 'application/x-x509-ca-cert',
        'pem': 'application/x-pem-file'
    };
    return mimeTypes[formato] || 'application/octet-stream';
}
    
    
};

    // ==================== INICIALIZACIÓN AL CARGAR ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==================== API PÚBLICA ====================
    // ==================== API PÚBLICA ====================
return {
    // Funciones principales
    cargarCertificados: DataManager.loadCertificates,
    mostrarModalNuevoCertificado: CertificateManager.showNewModal,
    generarCertificado: CertificateManager.generate,
    togglePasswordOptions: FormManager.togglePasswordOptions,
    aplicarFiltros: FiltersManager.applyFilters,
    limpiarFiltros: FiltersManager.clearFilters,
    
    // Funciones de utilidad
    togglePasswordVisibility: FormManager.togglePasswordVisibility,
    copiarPassword: CertificateManager.copyPassword,
    cerrarModalDetalles: () => UI.hideModal('modalDetallesCertificado'),
    
    // Función auxiliar para acciones desde modal de detalles
    accionCertificado: (accion, certificadoId) => {
        // Cerrar modal de detalles primero
        UI.hideModal('modalDetallesCertificado');
        
        // Ejecutar acción después de cerrar modal
        setTimeout(() => {
            switch(accion) {
                case 'configurar':
                    PlaceholderActions.configurarComoActivo(certificadoId);
                    break;
                case 'revocar':
                    PlaceholderActions.revocarCertificado(certificadoId);
                    break;
                case 'descargar':
                    PlaceholderActions.descargarCertificado(certificadoId);
                    break;
                default:
                    console.warn('Acción no reconocida:', accion);
            }
        }, 150);
    },
    
    // Funciones placeholder
    verDetallesCertificado: PlaceholderActions.verDetallesCertificado,
    configurarComoActivo: PlaceholderActions.configurarComoActivo,
    revocarCertificado: PlaceholderActions.revocarCertificado,
    descargarCertificado: PlaceholderActions.descargarCertificado,
    
    // Para debugging y desarrollo
    getState: () => ({ ...state }),
    getConfig: () => ({ ...CONFIG }),
    isLoading: () => state.isLoading,
    getCertificados: () => [...state.certificados],
    utils: Utils
};

})();

// ==================== COMPATIBILIDAD CON CÓDIGO EXISTENTE ====================
window.mostrarModalNuevoCertificado = window.CertificadosManager.mostrarModalNuevoCertificado;
window.cargarCertificados = window.CertificadosManager.cargarCertificados;
window.generarCertificado = window.CertificadosManager.generarCertificado;
window.togglePasswordOptions = window.CertificadosManager.togglePasswordOptions;
window.aplicarFiltros = window.CertificadosManager.aplicarFiltros;