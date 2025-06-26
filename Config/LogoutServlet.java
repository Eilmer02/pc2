package Config;

import Config.Conexion;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.Connection;


@WebServlet("/LogoutServlet")
public class LogoutServlet extends HttpServlet {
    
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        HttpSession session = request.getSession(false);
        
        if (session != null) {
            Integer usuarioId = (Integer) session.getAttribute("usuarioId");
            Integer sesionId = (Integer) session.getAttribute("sesionId");
            String ipOrigen = getClientIpAddress(request);
            
            if (usuarioId != null && sesionId != null) {
                cerrarSesion(sesionId, usuarioId, ipOrigen);
            }
            
            session.invalidate();
        }
        
        response.sendRedirect("login.jsp");
    }
    
    private void cerrarSesion(int sesionId, int usuarioId, String ipOrigen) {
        try (Connection conn = Conexion.getConnection()) {
            CallableStatement stmt = conn.prepareCall("{CALL PA_CerrarSesion(?, ?, ?)}");
            
            stmt.setInt(1, sesionId);
            stmt.setInt(2, usuarioId);
            stmt.setString(3, ipOrigen);
            
            stmt.execute();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null) {
            return request.getRemoteAddr();
        } else {
            return xForwardedForHeader.split(",")[0];
        }
    }
}