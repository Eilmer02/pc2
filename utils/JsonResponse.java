package utils;

/**
 * Clase de utilidad para respuestas JSON estandarizadas
 * Sistema de Gestión Documental - Constructora Vial S.A.
 * @version 3.0.0
 */
public class JsonResponse {
    private boolean exito;
    private String mensaje;
    private Object datos;
    
    /**
     * Constructor para respuesta simple (éxito y mensaje)
     * @param exito Indica si la operación fue exitosa
     * @param mensaje Mensaje descriptivo
     */
    public JsonResponse(boolean exito, String mensaje) {
        this.exito = exito;
        this.mensaje = mensaje;
        this.datos = null;
    }
    
    /**
     * Constructor para respuesta completa (éxito, mensaje y datos)
     * @param exito Indica si la operación fue exitosa
     * @param mensaje Mensaje descriptivo
     * @param datos Datos adicionales a incluir en la respuesta
     */
    public JsonResponse(boolean exito, String mensaje, Object datos) {
        this.exito = exito;
        this.mensaje = mensaje;
        this.datos = datos;
    }
    
    /**
     * @return Si la operación fue exitosa
     */
    public boolean isExito() {
        return exito;
    }
    
    /**
     * @param exito Define si la operación fue exitosa
     */
    public void setExito(boolean exito) {
        this.exito = exito;
    }
    
    /**
     * @return Mensaje descriptivo
     */
    public String getMensaje() {
        return mensaje;
    }
    
    /**
     * @param mensaje Define el mensaje descriptivo
     */
    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
    
    /**
     * @return Datos adicionales de la respuesta
     */
    public Object getDatos() {
        return datos;
    }
    
    /**
     * @param datos Define los datos adicionales de la respuesta
     */
    public void setDatos(Object datos) {
        this.datos = datos;
    }
}