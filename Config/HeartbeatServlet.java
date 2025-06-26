/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Config;
// Servlet adicional para heartbeat

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import org.json.JSONObject;

@WebServlet("/HeartbeatServlet")
public class HeartbeatServlet extends HttpServlet {
    
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        JSONObject resultado = new JSONObject();
        
        try {
            // Mantener sesión activa
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.setMaxInactiveInterval(1800); // 30 minutos
                resultado.put("sessionActive", true);
                resultado.put("sessionId", session.getId());
            } else {
                resultado.put("sessionActive", false);
            }
            
            resultado.put("timestamp", System.currentTimeMillis());
            resultado.put("status", "OK");
            
        } catch (Exception e) {
            resultado.put("status", "ERROR");
            resultado.put("error", e.getMessage());
        }
        
        PrintWriter out = response.getWriter();
        out.print(resultado.toString());
        out.flush();
    }
}