<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page trimDirectiveWhitespaces="true" %>
<%
    // Si ya está logueado, redirigir al index
    HttpSession userSession = request.getSession(false);
    if (userSession != null && userSession.getAttribute("usuarioId") != null) {
        response.sendRedirect("index.jsp");
        return;
    }
%>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>SGD - Iniciar Sesión</title>
    <meta content="Sistema de Gestión Documental - Constructora Vial" name="description">
    <meta content="login, SGD, gestión documental, constructora vial" name="keywords">
    
    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%234f46e5' d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z'/></svg>" type="image/svg+xml">
    
    <!-- External CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.0/font/bootstrap-icons.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link href="./assets/css/login.css" rel="stylesheet">
</head>

<body>
    <div class="login-container">
        <!-- Panel Izquierdo -->
        <div class="login-left">
            <div class="login-logo">
                <i class="bi bi-file-earmark-text"></i>
            </div>
            <h2 style="margin-bottom: 1rem; position: relative; z-index: 1;">SGD</h2>
            <h4 style="margin-bottom: 1.5rem; opacity: 0.9; position: relative; z-index: 1;">Sistema de Gestión Documental</h4>
            <p style="opacity: 0.8; position: relative; z-index: 1;">Constructora Vial S.A.</p>
            <p style="font-size: 0.9rem; opacity: 0.7; position: relative; z-index: 1;">
                Gestión integral de documentos con firma digital certificada y trazabilidad completa para proyectos de construcción vial.
            </p>
        </div>

        <!-- Panel Derecho -->
        <div class="login-right">
            <h3 class="login-title">Iniciar Sesión</h3>
            <p class="login-subtitle">Acceda a su cuenta del Sistema de Gestión Documental</p>
            
            <!-- Container para mensajes -->
            <div id="messageContainer"></div>
            
            <form id="loginForm" method="post" novalidate>
                <div class="form-group">
                    <label for="correo" class="form-label">Correo Electrónico</label>
                    <input 
                        type="email" 
                        class="form-control" 
                        id="correo" 
                        name="correo" 
                        placeholder="usuario@constructoravial.com"
                        autocomplete="username"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label for="contrasena" class="form-label">Contraseña</label>
                    <input 
                        type="password" 
                        class="form-control" 
                        id="contrasena" 
                        name="contrasena" 
                        placeholder="Ingrese su contraseña"
                        autocomplete="current-password"
                        required
                    >
                </div>
                
                <div class="form-check">
                    <input 
                        type="checkbox" 
                        class="form-check-input" 
                        id="recordarme" 
                        name="recordarme"
                    >
                    <label class="form-check-label" for="recordarme">
                        Recordar mi correo electrónico
                    </label>
                </div>
                
                <button type="submit" class="btn btn-login" id="loginBtn">
                    <span id="loginBtnText">
                        <i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión
                    </span>
                    <span id="loginBtnLoading" style="display: none;">
                        <div class="loading-spinner"></div>Iniciando sesión...
                    </span>
                </button>
            </form>
            
            <div class="forgot-password">
                <a href="#" onclick="showForgotPassword(); return false;">¿Olvidó su contraseña?</a>
            </div>
        </div>
    </div>

    
    <!-- Custom Scripts -->
    <script src="./assets/js/login.js"></script>
</body>
</html>