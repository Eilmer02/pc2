package Config;

// Imports estándar de Java (sin Bouncy Castle)
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.io.*;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.sql.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.*;

/**
 * Gestor simplificado para certificados digitales
 * Versión sin dependencias de Bouncy Castle para desarrollo
 * 
 * ⚠️ IMPORTANTE: Esta es una implementación temporal para desarrollo.
 * Para uso en producción, instalar Bouncy Castle y usar CertificadoDigitalManager
 * 
 * VERSIÓN CORREGIDA - Optimizada para mejor rendimiento y debugging
 */
public class CertificadoDigitalManagerSimple {
    
    private static final String ALGORITHM_AES = "AES";
    private static final String TRANSFORMATION_AES_GCM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final int AES_KEY_SIZE = 256;
    private static final int SALT_SIZE = 32;

    /**
     * Resultado de la generación de certificado
     */
    public static class ResultadoGeneracionCertificado {
        private final boolean exito;
        private final String mensaje;
        private final Integer certificadoId;
        private final String rutaArchivo;
        
        public ResultadoGeneracionCertificado(boolean exito, String mensaje, Integer certificadoId, String rutaArchivo) {
            this.exito = exito;
            this.mensaje = mensaje;
            this.certificadoId = certificadoId;
            this.rutaArchivo = rutaArchivo;
        }
        
        public boolean isExito() { return exito; }
        public String getMensaje() { return mensaje; }
        public Integer getCertificadoId() { return certificadoId; }
        public String getRutaArchivo() { return rutaArchivo; }
    }

    /**
     * Información del certificado para generación
     */
    public static class InfoCertificado {
        private final String nombreComun;
        private final String organizacion;
        private final String email;
        private final int validezDias;
        
        public InfoCertificado(String nombreComun, String organizacion, String email, int validezDias) {
            this.nombreComun = nombreComun;
            this.organizacion = organizacion;
            this.email = email;
            this.validezDias = validezDias;
        }
        
        // Getters
        public String getNombreComun() { return nombreComun; }
        public String getOrganizacion() { return organizacion; }
        public String getEmail() { return email; }
        public int getValidezDias() { return validezDias; }
    }

    /**
     * Clase para datos cifrados
     */
    public static class ResultadoCifrado {
        public final byte[] datosCifrados;
        public final String algoritmo;
        public final String salt;
        public final String iv;
        
        public ResultadoCifrado(byte[] datosCifrados, String algoritmo, String salt, String iv) {
            this.datosCifrados = datosCifrados;
            this.algoritmo = algoritmo;
            this.salt = salt;
            this.iv = iv;
        }
    }

    /**
     * Genera un certificado digital simplificado para desarrollo
     * VERSIÓN OPTIMIZADA
     */
    public ResultadoGeneracionCertificado generarCertificadoUsuario(
            int usuarioId, 
            String passwordCertificado, 
            InfoCertificado infoCert,
            int usuarioCreadorId,
            String rutaBaseCertificados) {
        
        long startTime = System.currentTimeMillis();
        System.out.println("🔧 [DESARROLLO] Iniciando generación de certificado para usuario: " + usuarioId);
        
        try {
            // 1. Validaciones iniciales
            if (!validarParametrosGeneracion(passwordCertificado, infoCert)) {
                return new ResultadoGeneracionCertificado(false, "Parámetros de entrada inválidos", null, null);
            }

            // 2. Generar par de claves RSA estándar
            KeyPair keyPair = generarParClaves();
            System.out.println("✅ Par de claves RSA generado (2048 bits)");
            
            // 3. Crear certificado auto-firmado simple
            X509Certificate certificado = crearCertificadoSimple(keyPair, infoCert);
            System.out.println("✅ Certificado X.509 auto-firmado creado");
            
            // 4. Crear KeyStore PKCS12
            byte[] pfxBytes = crearKeyStore(keyPair, certificado, passwordCertificado);
            System.out.println("✅ Archivo .pfx generado (" + pfxBytes.length + " bytes)");
            
            // 5. Cifrar archivo .pfx
            ResultadoCifrado resultadoCifrado = cifrarArchivoPfx(pfxBytes);
            System.out.println("✅ Archivo .pfx cifrado con AES-256-GCM");
            
            // 6. Guardar archivo cifrado
            String rutaCompleta = guardarArchivoCifrado(resultadoCifrado, usuarioId, rutaBaseCertificados);
            System.out.println("✅ Archivo guardado en: " + rutaCompleta);
            
            // 7. Guardar en base de datos - CORRECCIÓN PRINCIPAL
            Integer certificadoId = guardarCertificadoEnBD(
                usuarioId, infoCert, certificado, rutaCompleta, 
                resultadoCifrado, pfxBytes.length, usuarioCreadorId
            );
            
            if (certificadoId != null) {
                long duration = System.currentTimeMillis() - startTime;
                System.out.println("✅ Certificado registrado en BD con ID: " + certificadoId + " (tiempo: " + duration + "ms)");
                return new ResultadoGeneracionCertificado(
                    true, 
                    "Certificado digital generado exitosamen", 
                    certificadoId, 
                    rutaCompleta
                );
            } else {
                // Limpiar archivo si falló la BD
                try { Files.deleteIfExists(Paths.get(rutaCompleta)); } catch (Exception ignored) {}
                throw new Exception("Error al guardar certificado en base de datos");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error generando certificado simplificado: " + e.getMessage());
            e.printStackTrace();
            return new ResultadoGeneracionCertificado(
                false, 
                "Error al generar certificado: " + e.getMessage(), 
                null, 
                null
            );
        }
    }

    /**
     * Validaciones iniciales optimizadas
     */
    private boolean validarParametrosGeneracion(String password, InfoCertificado info) {
        if (password == null || password.trim().length() < 8) {
            System.err.println("❌ Contraseña inválida o muy corta");
            return false;
        }
        if (info == null || info.getNombreComun() == null || info.getNombreComun().trim().isEmpty()) {
            System.err.println("❌ Información del certificado incompleta");
            return false;
        }
        return true;
    }

    /**
     * Genera par de claves optimizado
     */
    private KeyPair generarParClaves() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        return keyPairGenerator.generateKeyPair();
    }

    /**
     * Crea KeyStore optimizado
     */
    private byte[] crearKeyStore(KeyPair keyPair, X509Certificate certificado, String password) throws Exception {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(null, null);
        
        Certificate[] certificateChain = new Certificate[]{certificado};
        keyStore.setKeyEntry("certificado", keyPair.getPrivate(), password.toCharArray(), certificateChain);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        keyStore.store(baos, password.toCharArray());
        return baos.toByteArray();
    }

    /**
     * Guarda archivo cifrado optimizado
     */
    private String guardarArchivoCifrado(ResultadoCifrado cifrado, int usuarioId, String rutaBase) throws Exception {
        String nombreArchivo = String.format("cert_user_%d_%d.pfx.enc", usuarioId, System.currentTimeMillis());
        String rutaCompleta = Paths.get(rutaBase, nombreArchivo).toString();
        
        Files.createDirectories(Paths.get(rutaBase));
        Files.write(Paths.get(rutaCompleta), cifrado.datosCifrados);
        
        return rutaCompleta;
    }

    /**
     * Crea un certificado X.509 auto-firmado básico usando APIs estándar de Java
     * VERSIÓN OPTIMIZADA
     */
    private X509Certificate crearCertificadoSimple(KeyPair keyPair, InfoCertificado info) throws Exception {
        System.out.println("🔧 Creando certificado X.509 auto-firmado...");
        
        try {
            // Intentar usar sun.security.x509 (disponible en Oracle JDK)
            return crearCertificadoConSunSecurity(keyPair, info);
        } catch (Exception e) {
            System.out.println("⚠️ sun.security no disponible, usando certificado mock optimizado");
            // Fallback: crear certificado mock básico
            return createMockCertificate(keyPair, info);
        }
    }
    
    /**
     * Crea certificado usando sun.security.x509 (Oracle JDK)
     * VERSIÓN OPTIMIZADA
     */
    private X509Certificate crearCertificadoConSunSecurity(KeyPair keyPair, InfoCertificado info) throws Exception {
        // Usar reflection para acceder a sun.security.x509
        Class<?> x509CertInfoClass = Class.forName("sun.security.x509.X509CertInfo");
        Class<?> x509CertImplClass = Class.forName("sun.security.x509.X509CertImpl");
        Class<?> certificateValidityClass = Class.forName("sun.security.x509.CertificateValidity");
        Class<?> x500NameClass = Class.forName("sun.security.x509.X500Name");
        Class<?> certificateSerialNumberClass = Class.forName("sun.security.x509.CertificateSerialNumber");
        Class<?> certificateSubjectNameClass = Class.forName("sun.security.x509.CertificateSubjectName");
        Class<?> certificateIssuerNameClass = Class.forName("sun.security.x509.CertificateIssuerName");
        Class<?> certificateX509KeyClass = Class.forName("sun.security.x509.CertificateX509Key");
        Class<?> x509KeyClass = Class.forName("sun.security.x509.X509Key");
        
        Object certInfo = x509CertInfoClass.newInstance();
        
        // Configurar fechas de validez
        Date validFrom = new Date();
        Date validTo = new Date(validFrom.getTime() + (info.getValidezDias() * 24L * 60L * 60L * 1000L));
        Object validity = certificateValidityClass.getConstructor(Date.class, Date.class)
                .newInstance(validFrom, validTo);
        
        // Configurar número de serie único
        BigInteger serialNumber = BigInteger.valueOf(System.currentTimeMillis());
        Object certSerial = certificateSerialNumberClass.getConstructor(BigInteger.class)
                .newInstance(serialNumber);
        
        // Configurar DN (Distinguished Name) optimizado
        String dn = String.format("CN=%s, O=%s, C=PE", 
            info.getNombreComun().trim(), 
            info.getOrganizacion().trim());
        Object issuer = x500NameClass.getConstructor(String.class).newInstance(dn);
        Object subject = x500NameClass.getConstructor(String.class).newInstance(dn);
        
        // Configurar clave pública
        Object pubKeyObj = x509KeyClass.getMethod("parse", Key.class)
                .invoke(null, keyPair.getPublic());
        Object certKey = certificateX509KeyClass.getConstructor(x509KeyClass)
                .newInstance(pubKeyObj);
        
        // Configurar CertInfo
        certInfo.getClass().getMethod("set", String.class, Object.class)
                .invoke(certInfo, "validity", validity);
        certInfo.getClass().getMethod("set", String.class, Object.class)
                .invoke(certInfo, "serialNumber", certSerial);
        certInfo.getClass().getMethod("set", String.class, Object.class)
                .invoke(certInfo, "subject", certificateSubjectNameClass.getConstructor(x500NameClass).newInstance(subject));
        certInfo.getClass().getMethod("set", String.class, Object.class)
                .invoke(certInfo, "issuer", certificateIssuerNameClass.getConstructor(x500NameClass).newInstance(issuer));
        certInfo.getClass().getMethod("set", String.class, Object.class)
                .invoke(certInfo, "key", certKey);
        
        // Crear y firmar certificado
        Object cert = x509CertImplClass.getConstructor(x509CertInfoClass).newInstance(certInfo);
        cert.getClass().getMethod("sign", PrivateKey.class, String.class)
                .invoke(cert, keyPair.getPrivate(), "SHA256withRSA");
        
        System.out.println("✅ Certificado creado con sun.security.x509");
        return (X509Certificate) cert;
    }
    
    /**
     * Crea un certificado mock para cuando sun.security no está disponible
     * VERSIÓN OPTIMIZADA
     */
    private X509Certificate createMockCertificate(KeyPair keyPair, InfoCertificado info) {
        System.out.println("⚠️ Creando certificado mock optimizado ");
        return new MockX509Certificate(keyPair.getPublic(), info);
    }

    /**
     * Cifra un archivo .pfx usando AES-256-GCM
     * VERSIÓN OPTIMIZADA
     */
    private ResultadoCifrado cifrarArchivoPfx(byte[] pfxBytes) throws Exception {
        System.out.println("🔒 Cifrando archivo .pfx con AES-256-GCM (" + pfxBytes.length + " bytes)...");
        
        // Generar clave AES-256
        KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM_AES);
        keyGenerator.init(AES_KEY_SIZE);
        SecretKey secretKey = keyGenerator.generateKey();
        
        // Generar IV y salt seguros
        SecureRandom secureRandom = new SecureRandom();
        byte[] iv = new byte[GCM_IV_LENGTH];
        byte[] salt = new byte[SALT_SIZE];
        secureRandom.nextBytes(iv);
        secureRandom.nextBytes(salt);
        
        // Configurar cifrado GCM
        Cipher cipher = Cipher.getInstance(TRANSFORMATION_AES_GCM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
        
        // Cifrar datos
        byte[] datosCifrados = cipher.doFinal(pfxBytes);
        
        // Ensamblar archivo final optimizado
        ByteArrayOutputStream baos = new ByteArrayOutputStream(salt.length + secretKey.getEncoded().length + iv.length + datosCifrados.length);
        baos.write(salt);                           // 32 bytes
        baos.write(secretKey.getEncoded());         // 32 bytes (AES-256)
        baos.write(iv);                             // 12 bytes
        baos.write(datosCifrados);                  // datos + GCM tag
        
        System.out.println("✅ Cifrado completado (" + baos.size() + " bytes totales)");
        
        return new ResultadoCifrado(
            baos.toByteArray(),
            TRANSFORMATION_AES_GCM,
            Base64.getEncoder().encodeToString(salt),
            Base64.getEncoder().encodeToString(iv)
        );
    }

    /**
     * Guarda el certificado en la base de datos
     * VERSIÓN CORREGIDA - 18 PARÁMETROS
     */
    private Integer guardarCertificadoEnBD(int usuarioId, InfoCertificado info, X509Certificate certificado,
                                          String rutaArchivo, ResultadoCifrado cifrado, long tamanioBytesOriginales,
                                          int usuarioCreadorId) {
        System.out.println("💾 Guardando certificado en base de datos...");
        
        try (Connection conn = Conexion.getConnection();
             // CORRECCIÓN PRINCIPAL: 18 parámetros (15 IN + 3 OUT)
             CallableStatement stmt = conn.prepareCall("{CALL PA_CrearCertificadoDigital(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // Parámetros IN (15 total)
            stmt.setInt(1, usuarioId);                                                    // p_usuario_id
            stmt.setString(2, info.getNombreComun() + " - " + info.getOrganizacion() + " "); // p_nombre_certificado
            stmt.setString(3, "interno");                                                 // p_tipo_certificado
            stmt.setString(4, certificado.getSerialNumber().toString());                  // p_numero_serie
            stmt.setString(5, "SGD Constructora Vial - Auto-firmado");      // p_emisor
            stmt.setDate(6, new java.sql.Date(certificado.getNotBefore().getTime()));    // p_fecha_emision
            stmt.setDate(7, new java.sql.Date(certificado.getNotAfter().getTime()));     // p_fecha_vencimiento
            stmt.setString(8, rutaArchivo);                                               // p_ruta_pfx_cifrado
            stmt.setString(9, cifrado.algoritmo);                                         // p_algoritmo_cifrado
            stmt.setString(10, cifrado.salt);                                             // p_salt_cifrado
            stmt.setString(11, cifrado.iv);                                               // p_iv_cifrado
            stmt.setString(12, Base64.getEncoder().encodeToString(certificado.getPublicKey().getEncoded())); // p_clave_publica
            stmt.setLong(13, tamanioBytesOriginales);                                     // p_tamanio_archivo_bytes
            stmt.setInt(14, usuarioCreadorId);                                            // p_usuario_creador_id
            stmt.setString(15, " "); // p_observaciones
            
            // Parámetros OUT (3 total) - CORRECCIÓN PRINCIPAL
            stmt.registerOutParameter(16, Types.INTEGER);    // p_certificado_id
            stmt.registerOutParameter(17, Types.BOOLEAN);    // p_success
            stmt.registerOutParameter(18, Types.VARCHAR);    // p_message
            
            stmt.execute();
            
            boolean success = stmt.getBoolean(17);
            if (success) {
                Integer certId = stmt.getInt(16);
                System.out.println("✅ Certificado guardado en BD con ID: " + certId);
                return certId;
            } else {
                String errorMessage = stmt.getString(18);
                System.err.println("❌ Error al guardar certificado: " + errorMessage);
                return null;
            }
            
        } catch (SQLException e) {
            System.err.println("❌ Error SQL guardando certificado: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Verifica si un usuario necesita certificado
     * VERSIÓN OPTIMIZADA
     */
    public boolean usuarioNecesitaCertificado(int usuarioId) {
        String sql = "SELECT COUNT(*) as total FROM certificados_digitales WHERE usuario_id = ? AND estado = 'activo'";
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, usuarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    boolean necesita = rs.getInt("total") == 0;
                    System.out.println("🔍 Usuario " + usuarioId + " necesita certificado: " + necesita);
                    return necesita;
                }
            }
        } catch (SQLException e) {
            System.err.println("❌ Error verificando necesidad de certificado: " + e.getMessage());
        }
        return true; // Por defecto, asumir que necesita certificado
    }

    /**
     * Clase mock para certificado X.509 OPTIMIZADA
     */
    private static class MockX509Certificate extends X509Certificate {
        private final PublicKey publicKey;
        private final Date notBefore;
        private final Date notAfter;
        private final String subject;
        private final String issuer;
        private final BigInteger serialNumber;
        private final byte[] encoded;
        
        public MockX509Certificate(PublicKey publicKey, InfoCertificado info) {
            this.publicKey = publicKey;
            this.notBefore = new Date();
            this.notAfter = new Date(System.currentTimeMillis() + (info.getValidezDias() * 24L * 60L * 60L * 1000L));
            this.subject = String.format("CN=%s, O=%s, C=PE", info.getNombreComun(), info.getOrganizacion());
            this.issuer = this.subject; // Auto-firmado
            this.serialNumber = BigInteger.valueOf(System.currentTimeMillis());
            this.encoded = ("MOCK-CERTIFICATE-" + serialNumber.toString()).getBytes();
        }
        
        @Override public byte[] getEncoded() { return encoded.clone(); }
        @Override public void verify(PublicKey key) {}
        @Override public void verify(PublicKey key, String sigProvider) {}
        @Override public String toString() { 
            return String.format("Mock Certificate [Subject: %s, Serial: %s, Valid: %s to %s]", 
                subject, serialNumber, notBefore, notAfter); 
        }
        @Override public PublicKey getPublicKey() { return publicKey; }
        @Override public boolean hasUnsupportedCriticalExtension() { return false; }
        @Override public Set<String> getCriticalExtensionOIDs() { return Collections.emptySet(); }
        @Override public Set<String> getNonCriticalExtensionOIDs() { return Collections.emptySet(); }
        @Override public byte[] getExtensionValue(String oid) { return null; }
        @Override public void checkValidity() throws java.security.cert.CertificateExpiredException, java.security.cert.CertificateNotYetValidException {
            Date now = new Date();
            if (now.before(notBefore)) {
                throw new java.security.cert.CertificateNotYetValidException("Certificate not yet valid");
            }
            if (now.after(notAfter)) {
                throw new java.security.cert.CertificateExpiredException("Certificate expired");
            }
        }
        @Override public void checkValidity(Date date) throws java.security.cert.CertificateExpiredException, java.security.cert.CertificateNotYetValidException {
            if (date.before(notBefore)) {
                throw new java.security.cert.CertificateNotYetValidException("Certificate not yet valid");
            }
            if (date.after(notAfter)) {
                throw new java.security.cert.CertificateExpiredException("Certificate expired");
            }
        }
        @Override public int getVersion() { return 3; }
        @Override public BigInteger getSerialNumber() { return serialNumber; }
        @Override public java.security.Principal getIssuerDN() { return () -> issuer; }
        @Override public java.security.Principal getSubjectDN() { return () -> subject; }
        @Override public Date getNotBefore() { return new Date(notBefore.getTime()); }
        @Override public Date getNotAfter() { return new Date(notAfter.getTime()); }
        @Override public byte[] getTBSCertificate() { return new byte[0]; }
        @Override public byte[] getSignature() { return new byte[0]; }
        @Override public String getSigAlgName() { return "SHA256withRSA"; }
        @Override public String getSigAlgOID() { return "1.2.840.113549.1.1.11"; }
        @Override public byte[] getSigAlgParams() { return null; }
        @Override public boolean[] getIssuerUniqueID() { return null; }
        @Override public boolean[] getSubjectUniqueID() { return null; }
        @Override public boolean[] getKeyUsage() { 
            // Configurar usos básicos para certificado de firma
            boolean[] keyUsage = new boolean[9];
            keyUsage[0] = true; // digitalSignature
            keyUsage[1] = true; // nonRepudiation
            keyUsage[2] = true; // keyEncipherment
            return keyUsage;
        }
        @Override public int getBasicConstraints() { return -1; }
    }
}