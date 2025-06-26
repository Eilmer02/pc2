<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Configuración Inicial - SGD</title>
    <meta content="Configuración inicial de usuario y certificados digitales" name="description">

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%234f46e5' d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z'/></svg>" type="image/svg+xml">

    <!-- CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.0/font/bootstrap-icons.min.css" rel="stylesheet">
    
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .setup-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .setup-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 600px;
            width: 100%;
        }
        
        .setup-header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            border-radius: 15px 15px 0 0;
            text-align: center;
        }
        
        .setup-body {
            padding: 40px;
        }
        
        .step-indicator {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
        }
        
        .step {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #e9ecef;
            color: #6c757d;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin: 0 10px;
            position: relative;
        }
        
        .step.active {
            background: #4f46e5;
            color: white;
        }
        
        .step.completed {
            background: #28a745;
            color: white;
        }
        
        .step::after {
            content: '';
            position: absolute;
            right: -25px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 2px;
            background: #e9ecef;
        }
        
        .step:last-child::after {
            display: none;
        }
        
        .step.completed::after {
            background: #28a745;
        }
        
        .password-strength {
            height: 5px;
            border-radius: 3px;
            margin-top: 5px;
            transition: all 0.3s ease;
        }
        
        .password-strength.weak {
            background: #dc3545;
            width: 33%;
        }
        
        .password-strength.medium {
            background: #ffc107;
            width: 66%;
        }
        
        .password-strength.strong {
            background: #28a745;
            width: 100%;
        }
        
        .certificate-option {
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .certificate-option:hover {
            border-color: #4f46e5;
            background: #f8f9ff;
        }
        
        .certificate-option.selected {
            border-color: #4f46e5;
            background: #f8f9ff;
        }
        
        .generated-password-display {
            background: #f8f9fa;
            border: 2px dashed #4f46e5;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        
        .btn-setup {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border: none;
            border-radius: 10px;
            padding: 12px 30px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .btn-setup:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
        }
    </style>
</head>

<body>
    <div class="setup-container">
        <div class="setup-card">
            <div class="setup-header">
                <h1 class="h3 mb-2">
                    <i class="bi bi-gear-fill me-2"></i>
                    Configuración Inicial
                </h1>
                <p class="mb-0">Configure su cuenta para comenzar a usar el sistema</p>
            </div>
            
            <div class="setup-body">
                <!-- Indicador de pasos -->
                <div class="step-indicator">
                    <div class="step" id="step1">1</div>
                    <div class="step" id="step2">2</div>
                    <div class="step" id="step3">3</div>
                    <div class="step" id="step4">4</div>
                </div>

                <!-- Alertas -->
                <div id="alertContainer"></div>

                <!-- Paso 1: Cambio de contraseña -->
                <div id="stepChangePassword" class="step-content">
                    <div class="text-center mb-4">
                        <i class="bi bi-key-fill text-primary" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">Cambiar Contraseña Inicial</h4>
                        <p class="text-muted">Por seguridad, debe cambiar su contraseña inicial antes de continuar</p>
                    </div>

                    <form id="formChangePassword">
                        <div class="mb-3">
                            <label for="currentPassword" class="form-label">Contraseña Actual *</label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="currentPassword" required>
                                <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('currentPassword')">
                                    <i class="bi bi-eye" id="iconCurrentPassword"></i>
                                </button>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="newPassword" class="form-label">Nueva Contraseña *</label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="newPassword" required minlength="8">
                                <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('newPassword')">
                                    <i class="bi bi-eye" id="iconNewPassword"></i>
                                </button>
                            </div>
                            <div class="password-strength" id="passwordStrength"></div>
                            <div class="form-text" id="passwordHelp"></div>
                        </div>

                        <div class="mb-4">
                            <label for="confirmPassword" class="form-label">Confirmar Nueva Contraseña *</label>
                            <input type="password" class="form-control" id="confirmPassword" required minlength="8">
                            <div class="form-text" id="passwordMatch"></div>
                        </div>

                        <div class="d-grid">
                            <button type="button" class="btn btn-primary btn-setup" onclick="cambiarPassword()">
                                <i class="bi bi-check-circle me-2"></i>
                                Cambiar Contraseña
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Paso 2: Completar Perfil Personal -->
                <div id="stepCompleteProfile" class="step-content" style="display: none;">
                    <div class="text-center mb-4">
                        <i class="bi bi-person-fill text-info" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">Completar Perfil Personal</h4>
                        <p class="text-muted">Complete su información personal para generar su certificado digital</p>
                    </div>

                    <form id="formCompleteProfile">
                        <!-- Información Personal Básica -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0">Información Personal</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="nombres" class="form-label">Nombres *</label>
                                        <input type="text" class="form-control" id="nombres" required 
                                               placeholder="Ej: Juan Carlos">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="apellidos" class="form-label">Apellidos *</label>
                                        <input type="text" class="form-control" id="apellidos" required 
                                               placeholder="Ej: Pérez García">
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label for="dni" class="form-label">DNI *</label>
                                        <input type="text" class="form-control" id="dni" required 
                                               pattern="[0-9]{8}" maxlength="8" placeholder="12345678">
                                        <div class="form-text" id="dniValidation"></div>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="telefono" class="form-label">Teléfono *</label>
                                        <input type="tel" class="form-control" id="telefono" required 
                                               placeholder="+51-999-888-777">
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="fechaNacimiento" class="form-label">Fecha de Nacimiento</label>
                                        <input type="date" class="form-control" id="fechaNacimiento">
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="genero" class="form-label">Género</label>
                                        <select class="form-select" id="genero">
                                            <option value="">Seleccionar...</option>
                                            <option value="masculino">Masculino</option>
                                            <option value="femenino">Femenino</option>
                                            <option value="otro">Otro</option>
                                            <option value="prefiero_no_decir">Prefiero no decir</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="estadoCivil" class="form-label">Estado Civil</label>
                                        <select class="form-select" id="estadoCivil">
                                            <option value="">Seleccionar...</option>
                                            <option value="soltero">Soltero(a)</option>
                                            <option value="casado">Casado(a)</option>
                                            <option value="divorciado">Divorciado(a)</option>
                                            <option value="viudo">Viudo(a)</option>
                                            <option value="union_libre">Unión Libre</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="direccion" class="form-label">Dirección</label>
                                    <textarea class="form-control" id="direccion" rows="2" 
                                              placeholder="Dirección completa"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Información Laboral -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0">Información Laboral</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="cargo" class="form-label">Cargo *</label>
                                        <select class="form-select" id="cargo" required>
                                            <option value="">Seleccione su cargo...</option>
                                            <!-- Se llena dinámicamente -->
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="departamento" class="form-label">Departamento</label>
                                        <select class="form-select" id="departamento">
                                            <option value="">Seleccione departamento...</option>
                                            <!-- Se llena dinámicamente -->
                                        </select>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="nivelEducacion" class="form-label">Nivel de Educación</label>
                                        <select class="form-select" id="nivelEducacion">
                                            <option value="">Seleccionar...</option>
                                            <option value="secundaria">Secundaria</option>
                                            <option value="tecnico">Técnico</option>
                                            <option value="universitario">Universitario</option>
                                            <option value="postgrado">Postgrado</option>
                                            <option value="maestria">Maestría</option>
                                            <option value="doctorado">Doctorado</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="profesion" class="form-label">Profesión/Especialidad</label>
                                        <input type="text" class="form-control" id="profesion" 
                                               placeholder="Ej: Ingeniero Civil">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Contacto de Emergencia -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0">Contacto de Emergencia</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="contactoEmergencia" class="form-label">Nombre del Contacto</label>
                                        <input type="text" class="form-control" id="contactoEmergencia" 
                                               placeholder="Nombre completo">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="telefonoEmergencia" class="form-label">Teléfono de Emergencia</label>
                                        <input type="tel" class="form-control" id="telefonoEmergencia" 
                                               placeholder="+51-999-888-777">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="d-grid">
                            <button type="button" class="btn btn-primary btn-setup" onclick="completarPerfil()">
                                <i class="bi bi-check-circle me-2"></i>
                                Guardar Perfil
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Paso 3: Configuración de certificado -->
                <div id="stepCertificateSetup" class="step-content" style="display: none;">
                    <div class="text-center mb-4">
                        <i class="bi bi-shield-check text-success" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">Configurar Certificado Digital</h4>
                        <p class="text-muted">Configure su certificado digital para poder firmar documentos</p>
                    </div>

                    <form id="formCertificateSetup">
                        <!-- Información del certificado -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="commonName" class="form-label">Nombre Completo *</label>
                                <input type="text" class="form-control" id="commonName" required 
                                       placeholder="Juan Pérez García">
                            </div>
                            <div class="col-md-6">
                                <label for="organization" class="form-label">Organización</label>
                                <input type="text" class="form-control" id="organization" 
                                       value="Constructora Vial S.A." readonly>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label for="emailCert" class="form-label">Email</label>
                            <input type="email" class="form-control" id="emailCert" 
                                   placeholder="correo@constructoravial.com">
                        </div>

                        <!-- Opciones de contraseña del certificado -->
                        <div class="mb-4">
                            <label class="form-label">Configuración de Contraseña del Certificado</label>
                            <p class="form-text mb-3">
                                <i class="bi bi-info-circle me-1"></i>
                                La contraseña del certificado debe ser diferente a su contraseña del sistema
                            </p>

                            <div class="certificate-option" onclick="selectCertificateOption('manual')">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="certificateOption" 
                                           id="optionManual" value="manual">
                                    <label class="form-check-label" for="optionManual">
                                        <strong>Crear mi propia contraseña</strong>
                                        <br>
                                        <small class="text-muted">Elija una contraseña que pueda recordar fácilmente</small>
                                    </label>
                                </div>
                            </div>

                            <div class="certificate-option" onclick="selectCertificateOption('generated')">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="certificateOption" 
                                           id="optionGenerated" value="generated">
                                    <label class="form-check-label" for="optionGenerated">
                                        <strong>Generar contraseña automáticamente</strong>
                                        <br>
                                        <small class="text-muted">El sistema creará una contraseña segura para usted</small>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Contraseña manual -->
                        <div id="manualPasswordContainer" style="display: none;">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="certPassword" class="form-label">Contraseña del Certificado *</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="certPassword" minlength="8">
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('certPassword')">
                                            <i class="bi bi-eye" id="iconCertPassword"></i>
                                        </button>
                                    </div>
                                    <div class="form-text" id="certPasswordHelp"></div>
                                </div>
                                <div class="col-md-6">
                                    <label for="confirmCertPassword" class="form-label">Confirmar Contraseña *</label>
                                    <input type="password" class="form-control" id="confirmCertPassword" minlength="8">
                                    <div class="form-text" id="certPasswordMatch"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Contraseña generada -->
                        <div id="generatedPasswordContainer" style="display: none;">
                            <div class="alert alert-info">
                                <i class="bi bi-lightbulb me-2"></i>
                                <strong>¡Perfecto!</strong> Generaremos una contraseña segura automáticamente.
                                Esta contraseña se mostrará <strong>una sola vez</strong> después de crear el certificado.
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-6">
                                <div class="d-grid">
                                    <button type="button" class="btn btn-outline-secondary" onclick="omitirSetupCertificado()">
                                        <i class="bi bi-skip-forward me-2"></i>
                                        Omitir por Ahora
                                    </button>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="d-grid">
                                    <button type="button" class="btn btn-success btn-setup" onclick="configurarCertificado()">
                                        <i class="bi bi-shield-plus me-2"></i>
                                        Crear Certificado
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Paso 4: Completado -->
                <div id="stepCompleted" class="step-content" style="display: none;">
                    <div class="text-center">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                        <h4 class="mt-3">¡Configuración Completada!</h4>
                        <p class="text-muted mb-4">Su cuenta está lista para usar el Sistema de Gestión Documental</p>

                        <!-- Resumen de configuración -->
                        <div class="card mb-4">
                            <div class="card-body text-start">
                                <h6 class="card-title">Resumen de Configuración:</h6>
                                <ul class="list-unstyled mb-0">
                                    <li><i class="bi bi-check-circle-fill text-success me-2"></i>Contraseña actualizada</li>
                                    <li id="certificateStatusSummary">
                                        <i class="bi bi-hourglass-split text-warning me-2"></i>Certificado pendiente
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- Contraseña generada display -->
                        <div id="generatedPasswordDisplay" style="display: none;">
                            <div class="generated-password-display">
                                <h6><i class="bi bi-key-fill me-2"></i>Su Contraseña del Certificado</h6>
                                <div class="input-group mt-3">
                                    <input type="text" class="form-control font-monospace fs-5 text-center" 
                                           id="generatedPasswordText" readonly>
                                    <button class="btn btn-outline-primary" type="button" onclick="copyGeneratedPassword()">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                                <div class="alert alert-danger mt-3 mb-0">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    <strong>¡IMPORTANTE!</strong> Guarde esta contraseña en un lugar seguro. 
                                    No se volverá a mostrar y la necesitará para firmar documentos.
                                </div>
                            </div>
                        </div>

                        <div class="d-grid mt-4">
                            <button type="button" class="btn btn-primary btn-setup btn-lg" onclick="irAlSistema()">
                                <i class="bi bi-house me-2"></i>
                                Ir al Sistema
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // Variables globales
        let currentStep = 1;
        let userState = {};
        let generatedPassword = '';

        // Inicializar página
        document.addEventListener('DOMContentLoaded', function() {
            verificarEstadoUsuario();
        });

        // Verificar estado del usuario para determinar qué pasos necesita completar
        function verificarEstadoUsuario() {
            fetch('PrimerLoginSetupServlet?action=verificarEstadoUsuario')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        userState = data;
                        
                        // Prellenar información conocida
                        if (data.nombres && data.apellidos) {
                            document.getElementById('commonName').value = data.nombres + ' ' + data.apellidos;
                        }
                        if (data.correo) {
                            document.getElementById('emailCert').value = data.correo;
                        }

                        // Determinar paso inicial basado en el estado
                        if (data.requiereCambioPassword) {
                            mostrarPaso(1);
                        } else if (!data.perfilCompleto) {
                            mostrarPaso(2);
                            marcarPasoCompleto(1);
                        } else if (data.totalCertificados === 0 && !data.primerLoginCompletado) {
                            mostrarPaso(3);
                            marcarPasoCompleto(1);
                            marcarPasoCompleto(2);
                        } else {
                            // Setup ya completado, redirigir
                            window.location.href = 'index.jsp';
                        }
                    } else {
                        mostrarAlerta('error', data.message || 'Error al verificar estado del usuario');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarAlerta('error', 'Error de conexión al verificar estado del usuario');
                });
        }

        // Mostrar paso específico
        function mostrarPaso(paso) {
            // Ocultar todos los pasos
            document.querySelectorAll('.step-content').forEach(content => {
                content.style.display = 'none';
            });

            // Mostrar paso actual
            const stepMap = {
                1: 'stepChangePassword',
                2: 'stepCompleteProfile',
                3: 'stepCertificateSetup', 
                4: 'stepCompleted'
            };

            document.getElementById(stepMap[paso]).style.display = 'block';
            
            // Actualizar indicadores
            actualizarIndicadorPasos(paso);
            currentStep = paso;
        }

        // Actualizar indicadores de pasos
        function actualizarIndicadorPasos(pasoActual) {
            for (let i = 1; i <= 4; i++) {
                const stepElement = document.getElementById('step' + i);
                stepElement.classList.remove('active', 'completed');
                
                if (i < pasoActual) {
                    stepElement.classList.add('completed');
                    stepElement.innerHTML = '<i class="bi bi-check"></i>';
                } else if (i === pasoActual) {
                    stepElement.classList.add('active');
                    stepElement.innerHTML = i;
                } else {
                    stepElement.innerHTML = i;
                }
            }
        }

        // Marcar paso como completado
        function marcarPasoCompleto(paso) {
            const stepElement = document.getElementById('step' + paso);
            stepElement.classList.remove('active');
            stepElement.classList.add('completed');
            stepElement.innerHTML = '<i class="bi bi-check"></i>';
        }

        // Cambiar contraseña
        function cambiarPassword() {
            const form = document.getElementById('formChangePassword');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                mostrarAlerta('error', 'Las contraseñas no coinciden');
                return;
            }

            const formData = new FormData();
            formData.append('action', 'cambiarPasswordInicial');
            formData.append('passwordActual', currentPassword);
            formData.append('passwordNuevo', newPassword);
            formData.append('confirmarPassword', confirmPassword);

            fetch('PrimerLoginSetupServlet', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        mostrarAlerta('success', 'Contraseña cambiada exitosamente');
                        marcarPasoCompleto(1);
                        setTimeout(() => {
                            mostrarPaso(2);
                            cargarDatosParaPerfil();
                        }, 1500);
                    } else {
                        mostrarAlerta('error', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarAlerta('error', 'Error al cambiar contraseña');
                });
        }

        // Seleccionar opción de certificado
        function selectCertificateOption(option) {
            // Remover selección anterior
            document.querySelectorAll('.certificate-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Marcar nueva selección
            const selectedOption = document.querySelector(`input[value="${option}"]`);
            selectedOption.checked = true;
            selectedOption.closest('.certificate-option').classList.add('selected');

            // Mostrar/ocultar contenedores apropiados
            const manualContainer = document.getElementById('manualPasswordContainer');
            const generatedContainer = document.getElementById('generatedPasswordContainer');

            if (option === 'manual') {
                manualContainer.style.display = 'block';
                generatedContainer.style.display = 'none';
                document.getElementById('certPassword').required = true;
                document.getElementById('confirmCertPassword').required = true;
            } else {
                manualContainer.style.display = 'none';
                generatedContainer.style.display = 'block';
                document.getElementById('certPassword').required = false;
                document.getElementById('confirmCertPassword').required = false;
            }
        }

        // Configurar certificado
        function configurarCertificado() {
            const selectedOption = document.querySelector('input[name="certificateOption"]:checked');
            if (!selectedOption) {
                mostrarAlerta('error', 'Debe seleccionar una opción para la contraseña del certificado');
                return;
            }

            let passwordCertificado = '';
            if (selectedOption.value === 'manual') {
                const form = document.getElementById('formCertificateSetup');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                passwordCertificado = document.getElementById('certPassword').value;
                const confirmPassword = document.getElementById('confirmCertPassword').value;

                if (passwordCertificado !== confirmPassword) {
                    mostrarAlerta('error', 'Las contraseñas del certificado no coinciden');
                    return;
                }
            }

            const formData = new FormData();
            formData.append('action', 'completarSetupCertificado');
            formData.append('opcionCertificado', selectedOption.value === 'manual' ? 'generar' : 'password_generado');
            
            if (selectedOption.value === 'manual') {
                formData.append('passwordCertificado', passwordCertificado);
            } else {
                // Generar password automático
                formData.append('passwordCertificado', generateSecurePassword());
            }
            
            formData.append('nombreComun', document.getElementById('commonName').value);
            formData.append('organizacion', document.getElementById('organization').value);
            formData.append('email', document.getElementById('emailCert').value);

            fetch('PrimerLoginSetupServlet', {
                method: 'POST', 
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        marcarPasoCompleto(2);
                        
                        // Si se generó contraseña automáticamente, mostrarla
                        if (selectedOption.value === 'generated') {
                            generatedPassword = formData.get('passwordCertificado');
                            document.getElementById('generatedPasswordText').value = generatedPassword;
                            document.getElementById('generatedPasswordDisplay').style.display = 'block';
                        }

                        // Actualizar resumen
                        document.getElementById('certificateStatusSummary').innerHTML = 
                            '<i class="bi bi-check-circle-fill text-success me-2"></i>Certificado configurado';

                        if (data.advertencia) {
                            mostrarAlerta('warning', data.advertencia.mensaje);
                        }

                        setTimeout(() => {
                            mostrarPaso(4);
                        }, 2000);
                    } else {
                        mostrarAlerta('error', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarAlerta('error', 'Error al configurar certificado');
                });
        }

        // Omitir setup de certificado
        function omitirSetupCertificado() {
            fetch('PrimerLoginSetupServlet?action=omitirSetupCertificado', {
                method: 'POST'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        marcarPasoCompleto(2);
                        
                        if (data.advertencia) {
                            mostrarAlerta('warning', data.advertencia.mensaje);
                        }

                        setTimeout(() => {
                            mostrarPaso(4);
                        }, 2000);
                    } else {
                        mostrarAlerta('error', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarAlerta('error', 'Error al omitir configuración');
                });
        }

        // Ir al sistema principal
        function irAlSistema() {
            window.location.href = 'index.jsp';
        }

        // Copiar contraseña generada
        function copyGeneratedPassword() {
            const passwordInput = document.getElementById('generatedPasswordText');
            passwordInput.select();
            navigator.clipboard.writeText(passwordInput.value).then(() => {
                mostrarAlerta('success', 'Contraseña copiada al portapapeles');
            });
        }

        // Alternar visibilidad de contraseña
        function togglePasswordVisibility(inputId) {
            const input = document.getElementById(inputId);
            const icon = document.getElementById('icon' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'bi bi-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'bi bi-eye';
            }
        }

        // Generar contraseña segura
        function generateSecurePassword() {
            const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
            let password = "";
            
            // Asegurar al menos un carácter de cada tipo
            password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
            password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
            password += "0123456789"[Math.floor(Math.random() * 10)];
            password += "!@#$%&*"[Math.floor(Math.random() * 7)];
            
            // Completar hasta 12 caracteres
            for (let i = 4; i < 12; i++) {
                password += charset[Math.floor(Math.random() * charset.length)];
            }
            
            // Mezclar caracteres
            return password.split('').sort(() => Math.random() - 0.5).join('');
        }

        // Validación de fortaleza de contraseña en tiempo real
        document.getElementById('newPassword').addEventListener('input', function() {
            validatePasswordStrength(this.value, 'passwordStrength', 'passwordHelp');
        });

        document.getElementById('certPassword').addEventListener('input', function() {
            validatePasswordStrength(this.value, null, 'certPasswordHelp');
        });

        // Validación de coincidencia de contraseñas
        document.getElementById('confirmPassword').addEventListener('input', function() {
            validatePasswordMatch('newPassword', 'confirmPassword', 'passwordMatch');
        });

        document.getElementById('confirmCertPassword').addEventListener('input', function() {
            validatePasswordMatch('certPassword', 'confirmCertPassword', 'certPasswordMatch');
        });

        function validatePasswordStrength(password, strengthElementId, helpElementId) {
            const helpElement = document.getElementById(helpElementId);
            if (strengthElementId) {
                const strengthElement = document.getElementById(strengthElementId);
                strengthElement.className = 'password-strength';
            }
            
            if (password.length === 0) {
                helpElement.innerHTML = '';
                return;
            }
            
            const checks = [
                { test: password.length >= 8, text: 'Al menos 8 caracteres' },
                { test: /[A-Z]/.test(password), text: 'Una letra mayúscula' },
                { test: /[a-z]/.test(password), text: 'Una letra minúscula' },
                { test: /[0-9]/.test(password), text: 'Un número' },
                { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'Un carácter especial' }
            ];
            
            const passed = checks.filter(check => check.test).length;
            const failed = checks.filter(check => !check.test);
            
            let strengthClass = passed < 3 ? 'weak' : passed < 5 ? 'medium' : 'strong';
            let strengthText = passed < 3 ? 'Débil' : passed < 5 ? 'Medio' : 'Fuerte';
            let textClass = passed < 3 ? 'text-danger' : passed < 5 ? 'text-warning' : 'text-success';
            
            if (strengthElementId) {
                const strengthElement = document.getElementById(strengthElementId);
                strengthElement.classList.add(strengthClass);
            }
            
            if (failed.length > 0) {
                helpElement.innerHTML = `<span class="${textClass}">Fortaleza: ${strengthText}</span><br>` +
                                      'Falta: ' + failed.map(f => f.text).join(', ');
            } else {
                helpElement.innerHTML = `<span class="text-success">✓ Contraseña segura</span>`;
            }
        }

        function validatePasswordMatch(password1Id, password2Id, matchElementId) {
            const password1 = document.getElementById(password1Id).value;
            const password2 = document.getElementById(password2Id).value;
            const matchElement = document.getElementById(matchElementId);
            
            if (password2.length === 0) {
                matchElement.innerHTML = '';
                return;
            }
            
            if (password1 === password2) {
                matchElement.innerHTML = '<span class="text-success">✓ Las contraseñas coinciden</span>';
            } else {
                matchElement.innerHTML = '<span class="text-danger">✗ Las contraseñas no coinciden</span>';
            }
        }

        // Cargar datos necesarios para el perfil
        function cargarDatosParaPerfil() {
            // Cargar cargos disponibles
            fetch('PrimerLoginSetupServlet?action=obtenerCargosDisponibles')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        llenarSelectCargos(data.cargos);
                    }
                })
                .catch(error => console.error('Error al cargar cargos:', error));

            // Cargar departamentos
            fetch('PrimerLoginSetupServlet?action=obtenerDepartamentos')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        llenarSelectDepartamentos(data.departamentos);
                    }
                })
                .catch(error => console.error('Error al cargar departamentos:', error));

            // Si hay información previa del perfil, llenar campos
            if (userState.perfilInfo) {
                llenarCamposPerfil(userState.perfilInfo);
            }
        }

        // Llenar select de cargos agrupados por departamento
        function llenarSelectCargos(cargos) {
            const select = document.getElementById('cargo');
            select.innerHTML = '<option value="">Seleccione su cargo...</option>';

            // Agrupar cargos por departamento
            const cargosPorDepto = {};
            cargos.forEach(cargo => {
                if (!cargosPorDepto[cargo.departamento]) {
                    cargosPorDepto[cargo.departamento] = [];
                }
                cargosPorDepto[cargo.departamento].push(cargo);
            });

            // Crear optgroups
            Object.keys(cargosPorDepto).sort().forEach(depto => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = depto;
                
                cargosPorDepto[depto].forEach(cargo => {
                    const option = document.createElement('option');
                    option.value = cargo.nombre;
                    option.textContent = cargo.nombre;
                    option.title = cargo.descripcion;
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });
        }

        // Llenar select de departamentos
        function llenarSelectDepartamentos(departamentos) {
            const select = document.getElementById('departamento');
            select.innerHTML = '<option value="">Seleccione departamento...</option>';

            departamentos.forEach(depto => {
                const option = document.createElement('option');
                option.value = depto.nombre;
                option.textContent = depto.nombre;
                option.title = depto.descripcion;
                select.appendChild(option);
            });
        }

        // Llenar campos del perfil con información existente
        function llenarCamposPerfil(perfilInfo) {
            if (perfilInfo.dni) document.getElementById('dni').value = perfilInfo.dni;
            if (perfilInfo.telefono) document.getElementById('telefono').value = perfilInfo.telefono;
            if (perfilInfo.cargo) document.getElementById('cargo').value = perfilInfo.cargo;
            if (perfilInfo.departamento) document.getElementById('departamento').value = perfilInfo.departamento;
        }

        // Completar perfil del usuario
        function completarPerfil() {
            const form = document.getElementById('formCompleteProfile');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Validar DNI antes de enviar
            const dni = document.getElementById('dni').value;
            if (!validarFormatoDNI(dni)) {
                mostrarAlerta('error', 'El DNI debe tener exactamente 8 dígitos');
                return;
            }

            const formData = new FormData();
            formData.append('action', 'completarPerfilUsuario');
            formData.append('nombres', document.getElementById('nombres').value);
            formData.append('apellidos', document.getElementById('apellidos').value);
            formData.append('dni', dni);
            formData.append('telefono', document.getElementById('telefono').value);
            formData.append('cargo', document.getElementById('cargo').value);
            formData.append('departamento', document.getElementById('departamento').value);
            formData.append('fechaNacimiento', document.getElementById('fechaNacimiento').value);
            formData.append('direccion', document.getElementById('direccion').value);
            formData.append('genero', document.getElementById('genero').value);
            formData.append('estadoCivil', document.getElementById('estadoCivil').value);
            formData.append('nivelEducacion', document.getElementById('nivelEducacion').value);
            formData.append('profesion', document.getElementById('profesion').value);
            formData.append('telefonoEmergencia', document.getElementById('telefonoEmergencia').value);
            formData.append('contactoEmergencia', document.getElementById('contactoEmergencia').value);

            fetch('PrimerLoginSetupServlet', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        mostrarAlerta('success', 'Perfil completado exitosamente');
                        marcarPasoCompleto(2);
                        setTimeout(() => {
                            mostrarPaso(3);
                        }, 1500);
                    } else {
                        mostrarAlerta('error', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarAlerta('error', 'Error al completar perfil');
                });
        }

        // Validar formato de DNI en tiempo real
        document.getElementById('dni').addEventListener('input', function() {
            const dni = this.value;
            const validationDiv = document.getElementById('dniValidation');
            
            if (dni.length === 0) {
                validationDiv.innerHTML = '';
                return;
            }
            
            if (!validarFormatoDNI(dni)) {
                validationDiv.innerHTML = '<span class="text-danger">DNI debe tener 8 dígitos</span>';
                return;
            }
            
            // Validar disponibilidad
            fetch(`PrimerLoginSetupServlet?action=validarDNI&dni=${dni}`)
                .then(response => response.json())
                .then(data => {
                    if (data.valid) {
                        validationDiv.innerHTML = '<span class="text-success">✓ DNI válido</span>';
                    } else {
                        validationDiv.innerHTML = `<span class="text-danger">✗ ${data.message}</span>`;
                    }
                })
                .catch(error => {
                    validationDiv.innerHTML = '<span class="text-warning">Error al validar DNI</span>';
                });
        });

        // Función auxiliar para validar DNI
        function validarFormatoDNI(dni) {
            return /^\d{8}$/.test(dni);
        }
            const alertContainer = document.getElementById('alertContainer');
            const alertClass = tipo === 'success' ? 'alert-success' : 
                              tipo === 'error' ? 'alert-danger' : 
                              tipo === 'warning' ? 'alert-warning' : 'alert-info';
            
            const iconClass = tipo === 'success' ? 'bi-check-circle' : 
                             tipo === 'error' ? 'bi-x-circle' : 
                             tipo === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';

            alertContainer.innerHTML = `
                <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                    <i class="${iconClass} me-2"></i>${mensaje}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            
            // Auto-hide success messages
            if (tipo === 'success') {
                setTimeout(() => {
                    const alert = alertContainer.querySelector('.alert');
                    if (alert) {
                        const bsAlert = new bootstrap.Alert(alert);
                        bsAlert.close();
                    }
                }, 3000);
            }
        }
    </script>
</body>
</html>