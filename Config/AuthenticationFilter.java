package Config;

import Config.Conexion;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Types;


@WebFilter(urlPatterns = {"*.jsp", "/ValidarLoginServlet", "/LogoutServlet"})
public class AuthenticationFilter implements Filter {
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Inicialización del filtro
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String requestURI = httpRequest.getRequestURI();
        String contextPath = httpRequest.getContextPath();
        
        // Páginas que NO requieren autenticación
        if (requestURI.equals(contextPath + "/login.jsp") || 
            requestURI.equals(contextPath + "/ValidarLoginServlet") ||
            requestURI.contains("/assets/") ||
            requestURI.contains("/css/") ||
            requestURI.contains("/js/") ||
            requestURI.contains("/images/")) {
            
            chain.doFilter(request, response);
            return;
        }
        
        // Verificar sesión
        HttpSession session = httpRequest.getSession(false);
        boolean isLoggedIn = false;
        
        if (session != null) {
            Integer usuarioId = (Integer) session.getAttribute("usuarioId");
            Integer sesionId = (Integer) session.getAttribute("sesionId");
            
            if (usuarioId != null && sesionId != null) {
                // Validar sesión en base de datos
                isLoggedIn = validarSesionBD(sesionId, usuarioId);
                
                if (!isLoggedIn) {
                    // Sesión inválida, limpiar
                    session.invalidate();
                }
            }
        }
        
        if (isLoggedIn) {
            // Usuario autenticado, continuar
            chain.doFilter(request, response);
        } else {
            // No autenticado, redirigir al login
            httpResponse.sendRedirect(contextPath + "/login.jsp");
        }
    }
    
    private boolean validarSesionBD(int sesionId, int usuarioId) {
        try (Connection conn = Conexion.getConnection()) {
            CallableStatement stmt = conn.prepareCall("{CALL PA_ValidarSesion(?, ?, ?, ?)}");
            
            stmt.setInt(1, sesionId);
            stmt.setInt(2, usuarioId);
            stmt.registerOutParameter(3, Types.BOOLEAN); // p_valida
            stmt.registerOutParameter(4, Types.VARCHAR); // p_mensaje
            
            stmt.execute();
            
            return stmt.getBoolean(3);
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    @Override
    public void destroy() {
        // Limpieza del filtro
    }
}