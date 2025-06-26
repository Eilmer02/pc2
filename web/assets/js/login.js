/**
 * JavaScript para Login - SGD Sistema de Gestión Documental
 * Constructora Vial S.A.
 */

/* ==================== INITIALIZATION ==================== */
document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
    setupEventListeners();
    loadSavedCredentials();
    
    // Auto-focus en el primer campo
    const correoField = document.getElementById('correo');
    if (correoField) {
        correoField.focus();
    }
    
    console.log('🔐 Login SGD - Sistema de Gestión Documental');
    console.log('🏢 Constructora Vial S.A.');
});

/* ==================== LOGIN FUNCTIONS ==================== */

/**
 * Inicializa la página de login
 */
function initializeLogin() {
    // Verificar si ya está logueado (doble verificación)
    checkExistingSession();
    
    // Configurar validaciones en tiempo real
    setupRealTimeValidation();
    
    // Precargar recursos si es necesario
    preloadResources();
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const recordarmeCheckbox = document.getElementById('recordarme');
    const correoField = document.getElementById('correo');
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', submitLogin);
    }
    
    // Remember me functionality
    if (recordarmeCheckbox && correoField) {
        recordarmeCheckbox.addEventListener('change', function() {
            if (this.checked && correoField.value.trim()) {
                localStorage.setItem('sgd_remember_email', correoField.value.trim());
            } else {
                localStorage.removeItem('sgd_remember_email');
            }
        });
        
        // Actualizar localStorage cuando cambie el email
        correoField.addEventListener('blur', function() {
            if (recordarmeCheckbox.checked && this.value.trim()) {
                localStorage.setItem('sgd_remember_email', this.value.trim());
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            submitLogin(e);
        }
    });
}

/**
 * Función principal de login - MEJORADA
 */
function submitLogin(event) {
    event.preventDefault();
    
    // Validaciones previas
    if (!validateLoginForm()) {
        return false;
    }
    
    clearMessages();
    setLoadingState(true);

    const form = document.getElementById("loginForm");
    const formData = new FormData(form);

    const params = new URLSearchParams();
    params.append("action", "login");
    params.append("correo", formData.get("correo"));
    params.append("contrasena", formData.get("contrasena"));

    console.log('🔄 Iniciando proceso de autenticación...');

    fetch('/Proyecto_PC2/ValidarLoginServlet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: params.toString()
    })
    .then(response => {
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('📋 Response data:', data);
        setLoadingState(false);

        if (data.success) {
            showMessage(data.message, 'success');
            
            // Guardar email si "recordarme" está marcado
            saveCredentialsIfNeeded();
            
            // Mostrar mensaje de bienvenida personalizado
            const welcomeMessage = data.redirectUrl && data.redirectUrl.includes('primer-login-setup.jsp') 
                ? 'Configurando primer acceso...' 
                : '¡Bienvenido al sistema!';
            
            showMessage(welcomeMessage, 'success');
            
            // Redireccionar después de un breve delay
            setTimeout(() => {
                window.location.href = data.redirectUrl || 'index.jsp';
            }, 1500);
            
        } else {
            showMessage(data.message, 'danger');
            
            // Enfocar el campo de contraseña para reintento
            setTimeout(() => {
                const contrasenaField = document.getElementById('contrasena');
                if (contrasenaField) {
                    contrasenaField.focus();
                    contrasenaField.select();
                }
            }, 500);
        }
    })
    .catch(error => {
        setLoadingState(false);
        console.error('❌ Error:', error);
        
        const errorMessage = error.message.includes('Failed to fetch') 
            ? 'No se puede conectar con el servidor. Verifique su conexión a internet.'
            : 'Error de conexión. Por favor, intente nuevamente.';
            
        showMessage(errorMessage, 'danger');
    });

    return false;
}

/**
 * Valida el formulario de login
 */
function validateLoginForm() {
    const correo = document.getElementById('correo').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    
    if (!correo) {
        showMessage('Por favor, ingrese su correo electrónico.', 'warning');
        document.getElementById('correo').focus();
        return false;
    }
    
    if (!isValidEmail(correo)) {
        showMessage('Por favor, ingrese un correo electrónico válido.', 'warning');
        document.getElementById('correo').focus();
        return false;
    }
    
    if (!contrasena) {
        showMessage('Por favor, ingrese su contraseña.', 'warning');
        document.getElementById('contrasena').focus();
        return false;
    }
    
    if (contrasena.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres.', 'warning');
        document.getElementById('contrasena').focus();
        return false;
    }
    
    return true;
}

/**
 * Valida formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Configurar validaciones en tiempo real
 */
function setupRealTimeValidation() {
    const correoField = document.getElementById('correo');
    const contrasenaField = document.getElementById('contrasena');
    
    if (correoField) {
        correoField.addEventListener('blur', function() {
            if (this.value.trim() && !isValidEmail(this.value.trim())) {
                this.style.borderColor = 'var(--danger-color)';
            } else {
                this.style.borderColor = '';
            }
        });
        
        correoField.addEventListener('input', function() {
            this.style.borderColor = '';
        });
    }
    
    if (contrasenaField) {
        contrasenaField.addEventListener('input', function() {
            this.style.borderColor = '';
        });
    }
}

/* ==================== UI FUNCTIONS ==================== */

/**
 * Función para mostrar mensajes - MEJORADA
 */
function showMessage(message, type = 'danger') {
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.warn('Container de mensajes no encontrado');
        return;
    }
    
    // Iconos para cada tipo de mensaje
    const icons = {
        success: 'check-circle',
        danger: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const icon = icons[type] || 'exclamation-circle';
    
    // Limpiar mensajes anteriores
    container.innerHTML = '';
    
    // Crear nuevo mensaje
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    
    alertDiv.innerHTML = `
        <i class="bi bi-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    container.appendChild(alertDiv);
    
    // Auto-dismiss después de 5 segundos para mensajes de éxito
    if (type === 'success') {
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 150);
            }
        }, 5000);
    }
    
    // Log del mensaje
    console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Función para limpiar mensajes
 */
function clearMessages() {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Función para cambiar estado del botón
 */
function setLoadingState(loading) {
    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    const btnLoading = document.getElementById('loginBtnLoading');
    
    if (!btn || !btnText || !btnLoading) {
        console.warn('Elementos del botón no encontrados');
        return;
    }
    
    if (loading) {
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        btnLoading.style.alignItems = 'center';
        btnLoading.style.justifyContent = 'center';
        
        // Cambiar cursor
        btn.style.cursor = 'not-allowed';
        
    } else {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        
        // Restaurar cursor
        btn.style.cursor = 'pointer';
    }
}

/* ==================== CREDENTIAL MANAGEMENT ==================== */

/**
 * Cargar credenciales guardadas
 */
function loadSavedCredentials() {
    const savedEmail = localStorage.getItem('sgd_remember_email');
    
    if (savedEmail) {
        const correoField = document.getElementById('correo');
        const recordarmeCheckbox = document.getElementById('recordarme');
        const contrasenaField = document.getElementById('contrasena');
        
        if (correoField && recordarmeCheckbox) {
            correoField.value = savedEmail;
            recordarmeCheckbox.checked = true;
            
            // Enfocar contraseña si el email ya está lleno
            if (contrasenaField) {
                contrasenaField.focus();
            }
        }
    }
}

/**
 * Guardar credenciales si está marcado "recordarme"
 */
function saveCredentialsIfNeeded() {
    const recordarmeCheckbox = document.getElementById('recordarme');
    const correoField = document.getElementById('correo');
    
    if (recordarmeCheckbox && recordarmeCheckbox.checked && correoField) {
        localStorage.setItem('sgd_remember_email', correoField.value.trim());
    } else if (!recordarmeCheckbox || !recordarmeCheckbox.checked) {
        localStorage.removeItem('sgd_remember_email');
    }
}

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Función para recuperar contraseña
 */
function showForgotPassword() {
    showMessage(
        'Para restablecer su contraseña, contacte al administrador del sistema en: soporte@constructoravial.com', 
        'info'
    );
}

/**
 * Verificar sesión existente
 */
function checkExistingSession() {
    // Esta función podría hacer una verificación adicional de sesión
    // si es necesario, pero por ahora el JSP ya maneja esto
    console.log('🔍 Verificando sesión existente...');
}

/**
 * Precargar recursos
 */
function preloadResources() {
    // Precargar imágenes o recursos que se usarán después del login
    const imagesToPreload = [
        // Agregar URLs de imágenes que se usan en el dashboard
    ];
    
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

/**
 * Manejar errores de conexión
 */
function handleConnectionError(error) {
    let message = 'Error de conexión. Verifique su internet e intente nuevamente.';
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        message = 'No se puede conectar con el servidor. Verifique su conexión.';
    } else if (error.message.includes('timeout')) {
        message = 'La conexión ha tardado demasiado. Intente nuevamente.';
    }
    
    showMessage(message, 'danger');
}

/**
 * Debug mode para desarrollo
 */
function enableDebugMode() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Modo debug activado');
        window.SGD_DEBUG = true;
        
        // Agregar información útil para debug
        window.SGD_LOGIN_DEBUG = {
            clearLocalStorage: () => localStorage.clear(),
            showAllLocalStorage: () => console.table(localStorage),
            testConnection: () => fetch('/Proyecto_PC2/ValidarLoginServlet?action=ping')
        };
    }
}

/* ==================== INITIALIZATION COMPLETE ==================== */
// Activar debug mode si es necesario
enableDebugMode();

// Log de inicialización
console.log('✅ login.js cargado - SGD Login v2.1.0');

/* ==================== EXPORT FOR GLOBAL ACCESS ==================== */
// Hacer funciones disponibles globalmente para uso en JSP
window.SGD_LOGIN = {
    submitLogin,
    showMessage,
    clearMessages,
    setLoadingState,
    showForgotPassword,
    validateLoginForm
};