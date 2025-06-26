package Config;

import com.lowagie.text.DocumentException;
import com.lowagie.text.pdf.*;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import java.io.*;
import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Manejador de firmas digitales para documentos PDF usando OpenPDF
 * Integrado con el sistema de certificados .pfx cifrados
 */
public class DocumentoDigitalSigner {
    
    private final CertificadoDigitalManager certManager;
    
    static {
        // Registrar BouncyCastle
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }
    
    public DocumentoDigitalSigner() {
        this.certManager = new CertificadoDigitalManager();
    }
    
    /**
     * Resultado de la operación de firma
     */
    public static class ResultadoFirma {
        private final boolean exito;
        private final String mensaje;
        private final byte[] documentoFirmado;
        private final String hashOriginal;
        private final String hashFirmado;
        private final String rutaArchivoFirmado;
        
        public ResultadoFirma(boolean exito, String mensaje, byte[] documentoFirmado, 
                             String hashOriginal, String hashFirmado, String rutaArchivoFirmado) {
            this.exito = exito;
            this.mensaje = mensaje;
            this.documentoFirmado = documentoFirmado;
            this.hashOriginal = hashOriginal;
            this.hashFirmado = hashFirmado;
            this.rutaArchivoFirmado = rutaArchivoFirmado;
        }
        
        // Getters
        public boolean isExito() { return exito; }
        public String getMensaje() { return mensaje; }
        public byte[] getDocumentoFirmado() { return documentoFirmado; }
        public String getHashOriginal() { return hashOriginal; }
        public String getHashFirmado() { return hashFirmado; }
        public String getRutaArchivoFirmado() { return rutaArchivoFirmado; }
    }
    
    /**
     * Información para la firma
     */
    public static class InfoFirma {
        private String razon;
        private String ubicacion;
        private String contacto;
        private String nombreFirmante;
        private boolean visible;
        private float posicionX;
        private float posicionY;
        private float ancho;
        private float alto;
        private int pagina;
        
        public InfoFirma(String nombreFirmante, String razon) {
            this.nombreFirmante = nombreFirmante;
            this.razon = razon;
            this.ubicacion = "Lima, Perú";
            this.contacto = "Sistema de Gestión Documental";
            this.visible = true;
            this.posicionX = 400;
            this.posicionY = 100;
            this.ancho = 150;
            this.alto = 50;
            this.pagina = 1;
        }
        
        // Getters y setters
        public String getRazon() { return razon; }
        public void setRazon(String razon) { this.razon = razon; }
        public String getUbicacion() { return ubicacion; }
        public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
        public String getContacto() { return contacto; }
        public void setContacto(String contacto) { this.contacto = contacto; }
        public String getNombreFirmante() { return nombreFirmante; }
        public void setNombreFirmante(String nombreFirmante) { this.nombreFirmante = nombreFirmante; }
        public boolean isVisible() { return visible; }
        public void setVisible(boolean visible) { this.visible = visible; }
        public float getPosicionX() { return posicionX; }
        public void setPosicionX(float posicionX) { this.posicionX = posicionX; }
        public float getPosicionY() { return posicionY; }
        public void setPosicionY(float posicionY) { this.posicionY = posicionY; }
        public float getAncho() { return ancho; }
        public void setAncho(float ancho) { this.ancho = ancho; }
        public float getAlto() { return alto; }
        public void setAlto(float alto) { this.alto = alto; }
        public int getPagina() { return pagina; }
        public void setPagina(int pagina) { this.pagina = pagina; }
    }
    
    /**
     * Firma un documento PDF usando un certificado .pfx cifrado
     */
    public ResultadoFirma firmarDocumentoPDF(
            int documentoId,
            int certificadoId,
            int usuarioId,
            String passwordCertificado,
            InfoFirma infoFirma,
            String rutaDocumentos) {
        
        try {
            // 1. Validar certificado
            if (!certManager.validarCertificado(certificadoId, usuarioId)) {
                return new ResultadoFirma(false, "Certificado no válido para el usuario", null, null, null, null);
            }
            
            // 2. Obtener archivo .pfx descifrado
            String rutaPfxCifrado = certManager.obtenerRutaPfxCifrado(certificadoId);
            if (rutaPfxCifrado == null) {
                return new ResultadoFirma(false, "No se pudo obtener el archivo de certificado", null, null, null, null);
            }
            
            byte[] pfxBytes = certManager.descifrarArchivoPfx(rutaPfxCifrado);
            
            // 3. Cargar certificado y clave privada desde .pfx
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(pfxBytes), passwordCertificado.toCharArray());
            
            String alias = keyStore.aliases().nextElement();
            PrivateKey clavePrivada = (PrivateKey) keyStore.getKey(alias, passwordCertificado.toCharArray());
            Certificate[] certificados = keyStore.getCertificateChain(alias);
            
            if (clavePrivada == null || certificados == null || certificados.length == 0) {
                return new ResultadoFirma(false, "Error al cargar certificado: contraseña incorrecta o certificado corrupto", null, null, null, null);
            }
            
            // 4. Obtener documento PDF original
            byte[] pdfOriginal = obtenerDocumentoPDF(documentoId);
            if (pdfOriginal == null) {
                return new ResultadoFirma(false, "No se pudo obtener el documento PDF", null, null, null, null);
            }
            
            // 5. Calcular hash del documento original
            String hashOriginal = calcularHashSHA256(pdfOriginal);
            
            // 6. Firmar el documento usando OpenPDF
            byte[] pdfFirmado = firmarPDFOpenPDF(pdfOriginal, clavePrivada, certificados, infoFirma);
            
            // 7. Calcular hash del documento firmado
            String hashFirmado = calcularHashSHA256(pdfFirmado);
            
            // 8. Guardar documento firmado
            String rutaDocumentoFirmado = guardarDocumentoFirmado(documentoId, pdfFirmado, rutaDocumentos);
            
            // 9. Registrar auditoría
            registrarAuditoriaFirma(documentoId, certificadoId, usuarioId, hashOriginal, hashFirmado);
            
            return new ResultadoFirma(
                true, 
                "Documento firmado exitosamente", 
                pdfFirmado, 
                hashOriginal, 
                hashFirmado, 
                rutaDocumentoFirmado
            );
            
        } catch (Exception e) {
            e.printStackTrace();
            return new ResultadoFirma(false, "Error al firmar documento: " + e.getMessage(), null, null, null, null);
        }
    }
    
    /**
     * Firma un anexo PDF
     */
    public ResultadoFirma firmarAnexoPDF(
            int anexoId,
            int certificadoId,
            int usuarioId,
            String passwordCertificado,
            InfoFirma infoFirma,
            String rutaDocumentos) {
        
        try {
            // Similar al método anterior pero para anexos
            if (!certManager.validarCertificado(certificadoId, usuarioId)) {
                return new ResultadoFirma(false, "Certificado no válido para el usuario", null, null, null, null);
            }
            
            String rutaPfxCifrado = certManager.obtenerRutaPfxCifrado(certificadoId);
            if (rutaPfxCifrado == null) {
                return new ResultadoFirma(false, "No se pudo obtener el archivo de certificado", null, null, null, null);
            }
            
            byte[] pfxBytes = certManager.descifrarArchivoPfx(rutaPfxCifrado);
            
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(pfxBytes), passwordCertificado.toCharArray());
            
            String alias = keyStore.aliases().nextElement();
            PrivateKey clavePrivada = (PrivateKey) keyStore.getKey(alias, passwordCertificado.toCharArray());
            Certificate[] certificados = keyStore.getCertificateChain(alias);
            
            if (clavePrivada == null || certificados == null || certificados.length == 0) {
                return new ResultadoFirma(false, "Error al cargar certificado: contraseña incorrecta o certificado corrupto", null, null, null, null);
            }
            
            byte[] pdfOriginal = obtenerAnexoPDF(anexoId);
            if (pdfOriginal == null) {
                return new ResultadoFirma(false, "No se pudo obtener el anexo PDF", null, null, null, null);
            }
            
            String hashOriginal = calcularHashSHA256(pdfOriginal);
            byte[] pdfFirmado = firmarPDFOpenPDF(pdfOriginal, clavePrivada, certificados, infoFirma);
            String hashFirmado = calcularHashSHA256(pdfFirmado);
            
            // Actualizar anexo en BD con el PDF firmado
            actualizarAnexoFirmado(anexoId, pdfFirmado);
            
            registrarAuditoriaFirmaAnexo(anexoId, certificadoId, usuarioId, hashOriginal, hashFirmado);
            
            return new ResultadoFirma(
                true, 
                "Anexo firmado exitosamente", 
                pdfFirmado, 
                hashOriginal, 
                hashFirmado, 
                null
            );
            
        } catch (Exception e) {
            e.printStackTrace();
            return new ResultadoFirma(false, "Error al firmar anexo: " + e.getMessage(), null, null, null, null);
        }
    }
    
    /**
     * Realiza la firma digital del PDF usando OpenPDF (método correcto para v1.4.2)
     */
    private byte[] firmarPDFOpenPDF(byte[] pdfOriginal, PrivateKey clavePrivada, Certificate[] certificados, InfoFirma infoFirma) 
            throws DocumentException, IOException, GeneralSecurityException {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfReader reader = new PdfReader(pdfOriginal);
        
        // Crear PdfStamper para firma
        PdfStamper stamper = PdfStamper.createSignature(reader, baos, '\0');
        
        // Obtener apariencia de la firma
        PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
        
        // Configurar información de la firma
        appearance.setReason(infoFirma.getRazon());
        appearance.setLocation(infoFirma.getUbicacion());
        appearance.setContact(infoFirma.getContacto());
        
        // Configurar apariencia visual si es visible
        if (infoFirma.isVisible()) {
            appearance.setVisibleSignature(
                new com.lowagie.text.Rectangle(
                    infoFirma.getPosicionX(), 
                    infoFirma.getPosicionY(),
                    infoFirma.getPosicionX() + infoFirma.getAncho(),
                    infoFirma.getPosicionY() + infoFirma.getAlto()
                ),
                infoFirma.getPagina(),
                "Signature1"  // Nombre fijo para facilitar verificación posterior
            );
            
            // Configurar texto de la firma
            String textoFirma = String.format(
                "Firmado digitalmente por:\n%s\nFecha: %s\nMotivo: %s",
                infoFirma.getNombreFirmante(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")),
                infoFirma.getRazon()
            );
            appearance.setLayer2Text(textoFirma);
        }
        
        // MÉTODO CORRECTO PARA OPENPDF v1.4.2:
        // Usar setCrypto con los parámetros correctos
        try {
            appearance.setCrypto(clavePrivada, certificados, null, PdfSignatureAppearance.WINCER_SIGNED);
        } catch (Exception e) {
            // Si falla con WINCER_SIGNED, intentar con SELF_SIGNED
            appearance.setCrypto(clavePrivada, certificados, null, PdfSignatureAppearance.SELF_SIGNED);
        }
        
        // Cerrar el stamper - esto aplica la firma
        stamper.close();
        reader.close();
        
        return baos.toByteArray();
    }
    
    /**
     * Verifica la firma digital de un PDF (VERSIÓN ULTRA-COMPATIBLE)
     * Compatible con versiones muy antiguas de OpenPDF/iText
     */
    public boolean verificarFirmaPDF(byte[] pdfFirmado) {
        try {
            PdfReader reader = new PdfReader(pdfFirmado);
            AcroFields acroFields = reader.getAcroFields();
            
            // SOLUCIÓN ULTRA-BÁSICA: Intentar verificar nombres de firma conocidos
            String[] posiblesNombres = {
                "Signature1", "Signature2", "Signature3", "Signature4", "Signature5",
                "sig1", "sig2", "sig3", "sig4", "sig5",
                "signature", "Sig", "Sign", "firma", "Firma"
            };
            
            boolean firmaEncontrada = false;
            
            for (String nombreFirma : posiblesNombres) {
                try {
                    // Verificar si existe el campo y es de tipo firma
                    PdfPKCS7 pkcs7 = acroFields.verifySignature(nombreFirma);
                    
                    if (pkcs7 != null) {
                        if (pkcs7.verify()) {
                            System.out.println("✓ Firma válida encontrada: " + nombreFirma);
                            X509Certificate cert = pkcs7.getSigningCertificate();
                            System.out.println("  Firmante: " + cert.getSubjectDN());
                            firmaEncontrada = true;
                        } else {
                            System.out.println("✗ Firma inválida: " + nombreFirma);
                        }
                    }
                } catch (Exception e) {
                    // Es normal que falle si el campo no existe
                    // No hacer nada, continuar con el siguiente
                }
            }
            
            reader.close();
            return firmaEncontrada;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Método simplificado para solo verificar si hay firmas (sin validar)
     */
    public boolean tieneAlgunaFirma(byte[] pdfFirmado) {
        try {
            PdfReader reader = new PdfReader(pdfFirmado);
            AcroFields acroFields = reader.getAcroFields();
            
            String[] posiblesNombres = {
                "Signature1", "Signature2", "Signature3", 
                "sig1", "sig2", "signature"
            };
            
            for (String nombreFirma : posiblesNombres) {
                try {
                    PdfPKCS7 pkcs7 = acroFields.verifySignature(nombreFirma);
                    if (pkcs7 != null) {
                        reader.close();
                        return true; // Encontró al menos una firma
                    }
                } catch (Exception e) {
                    // Continuar
                }
            }
            
            reader.close();
            return false;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    // Métodos auxiliares (sin cambios)
    
    private byte[] obtenerDocumentoPDF(int documentoId) {
        // Obtener el PDF del documento desde anexos_documento o ruta_word_editable convertida
        String sql = """
            SELECT ad.contenido, ad.ruta_archivo, d.ruta_word_editable
            FROM documentos d
            LEFT JOIN anexos_documento ad ON d.id_documentos = ad.documentos_id AND ad.tipo_archivo = 'pdf'
            WHERE d.id_documentos = ?
            ORDER BY ad.version DESC
            LIMIT 1
        """;
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, documentoId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    byte[] contenido = rs.getBytes("contenido");
                    if (contenido != null && contenido.length > 0) {
                        return contenido;
                    }
                    
                    String rutaArchivo = rs.getString("ruta_archivo");
                    if (rutaArchivo != null && !rutaArchivo.isEmpty()) {
                        return Files.readAllBytes(Paths.get(rutaArchivo));
                    }
                    
                    // Si no hay PDF, podríamos convertir el Word a PDF aquí
                    String rutaWord = rs.getString("ruta_word_editable");
                    if (rutaWord != null && !rutaWord.isEmpty()) {
                        // TODO: Implementar conversión Word a PDF
                        throw new RuntimeException("Conversión Word a PDF no implementada");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    private byte[] obtenerAnexoPDF(int anexoId) {
        String sql = "SELECT contenido, ruta_archivo FROM anexos_documento WHERE id_anexos_documento = ? AND tipo_archivo = 'pdf'";
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, anexoId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    byte[] contenido = rs.getBytes("contenido");
                    if (contenido != null && contenido.length > 0) {
                        return contenido;
                    }
                    
                    String rutaArchivo = rs.getString("ruta_archivo");
                    if (rutaArchivo != null && !rutaArchivo.isEmpty()) {
                        return Files.readAllBytes(Paths.get(rutaArchivo));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    private String calcularHashSHA256(byte[] datos) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(datos);
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
            
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
    }
    
    private String guardarDocumentoFirmado(int documentoId, byte[] pdfFirmado, String rutaDocumentos) throws IOException {
        String nombreArchivo = String.format("doc_%d_firmado_%d.pdf", documentoId, System.currentTimeMillis());
        String rutaCompleta = Paths.get(rutaDocumentos, nombreArchivo).toString();
        
        Files.createDirectories(Paths.get(rutaDocumentos));
        Files.write(Paths.get(rutaCompleta), pdfFirmado);
        
        // Actualizar documento en BD con la ruta del archivo firmado
        String sql = "UPDATE documentos SET hash_contenido = ? WHERE id_documentos = ?";
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, calcularHashSHA256(pdfFirmado));
            stmt.setInt(2, documentoId);
            stmt.executeUpdate();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return rutaCompleta;
    }
    
    private void actualizarAnexoFirmado(int anexoId, byte[] pdfFirmado) {
        String sql = "UPDATE anexos_documento SET contenido = ?, firmado = 1, fecha_firma = NOW() WHERE id_anexos_documento = ?";
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setBytes(1, pdfFirmado);
            stmt.setInt(2, anexoId);
            stmt.executeUpdate();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    
    private void registrarAuditoriaFirma(int documentoId, int certificadoId, int usuarioId, String hashOriginal, String hashFirmado) {
        try (Connection conn = Conexion.getConnection();
             CallableStatement stmt = conn.prepareCall("{CALL PA_RegistrarAuditoriaFirma(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            stmt.setInt(1, documentoId);
            stmt.setNull(2, Types.INTEGER); // anexo_id
            stmt.setInt(3, certificadoId);
            stmt.setInt(4, usuarioId);
            stmt.setString(5, "SHA256withRSA");
            stmt.setString(6, hashOriginal);
            stmt.setString(7, hashFirmado);
            stmt.setString(8, "0.0.0.0"); // IP será actualizada desde el servlet
            stmt.setString(9, "Sistema"); // Navegador será actualizado desde el servlet
            stmt.setString(10, "{\"metodo\":\"PDF_OPENPDF\",\"algoritmo\":\"SHA256withRSA\"}");
            
            stmt.execute();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    
    private void registrarAuditoriaFirmaAnexo(int anexoId, int certificadoId, int usuarioId, String hashOriginal, String hashFirmado) {
        try (Connection conn = Conexion.getConnection();
             CallableStatement stmt = conn.prepareCall("{CALL PA_RegistrarAuditoriaFirma(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            stmt.setNull(1, Types.INTEGER); // documento_id
            stmt.setInt(2, anexoId);
            stmt.setInt(3, certificadoId);
            stmt.setInt(4, usuarioId);
            stmt.setString(5, "SHA256withRSA");
            stmt.setString(6, hashOriginal);
            stmt.setString(7, hashFirmado);
            stmt.setString(8, "0.0.0.0");
            stmt.setString(9, "Sistema");
            stmt.setString(10, "{\"metodo\":\"PDF_ANEXO_OPENPDF\",\"algoritmo\":\"SHA256withRSA\"}");
            
            stmt.execute();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}