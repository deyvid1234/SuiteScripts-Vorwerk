/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/log', 'N/file', 'N/crypto', 'N/encode', './crypto-js-old'], 
    function(log, file, crypto, encode, cryptoJS) {
    
    /**
     * Canonicaliza el XML
     * @param {string} xml 
     * @returns {string}
     */
    function canonicalize(xml) {
        return xml.replace(/\r\n/g, '')
                 .replace(/\n/g, '')
                 .replace(/\r/g, '')
                 .replace(/>\s+</g, '><')
                 .replace(/\s+/g, ' ')
                 .trim();
    }

    /**
     * Firma el SignedInfo usando la llave privada
     * @param {string} signedInfoXml - XML del SignedInfo
     * @param {string} llavePrivada - Llave privada en formato DER Base64
     * @returns {string} Firma en Base64
     */
    function firmarSignedInfo(signedInfoXml, llavePrivada) {
        try {
            // Canonicalizar el SignedInfo
            const signedInfoCanonicalizado = canonicalize(signedInfoXml);
            
            log.debug({
                title: 'SignedInfo canonicalizado',
                details: signedInfoCanonicalizado
            });

            // Crear el hash SHA1 usando cryptoJS
            const hash = cryptoJS.SHA1(signedInfoCanonicalizado);
            
            log.debug({
                title: 'Llave privada recibida',
                details: {
                    tipo: typeof llavePrivada,
                    longitud: llavePrivada ? llavePrivada.length : 0,
                    contenido: llavePrivada ? llavePrivada.substring(0, 100) : 'null'
                }
            });

            // Verificar que la llave tenga el formato correcto (comienza con MII)
            if (!llavePrivada || llavePrivada.substring(0, 3) !== 'MII') {
                throw new Error('La llave privada no tiene el formato DER Base64 esperado');
            }

            // Convertir la llave DER Base64 a WordArray
            const keyWordArray = cryptoJS.enc.Base64.parse(llavePrivada);
            
            log.debug({
                title: 'Llave procesada',
                details: {
                    longitud: keyWordArray.words.length,
                    tipo: 'WordArray'
                }
            });

            // Crear el objeto RSA con la llave privada
            const rsa = new cryptoJS.RSA();
            rsa.importKey(keyWordArray, 'der');

            // Firmar usando RSA-SHA1
            const signature = rsa.sign(hash, 'sha1');
            
            // Convertir la firma a Base64
            const signatureBase64 = cryptoJS.enc.Base64.stringify(signature);

            log.debug({
                title: 'Firma generada',
                details: {
                    hashLength: hash.toString().length,
                    signatureLength: signatureBase64.length,
                    signature: signatureBase64.substring(0, 100) + '...'
                }
            });

            return signatureBase64;
        } catch (e) {
            log.error({
                title: 'Error al firmar SignedInfo',
                details: {
                    error: e,
                    message: e.message,
                    stack: e.stack
                }
            });
            throw e;
        }
    }

    /**
     * Lee y prepara el certificado desde File Cabinet
     * @param {number} fileId - ID del archivo .cer
     * @returns {string} Certificado en Base64
     */
    function obtenerCertificado(fileId) {
        try {
            const certFile = file.load({
                id: fileId
            });
            
            const certContent = certFile.getContents();
            
            log.debug({
                title: 'Certificado cargado',
                details: {
                    nombre: certFile.name,
                    tamaño: certContent.length,
                    primeros100Chars: certContent.substring(0, 100)
                }
            });
            
            return certContent;
        } catch (e) {
            log.error({
                title: 'Error al cargar certificado',
                details: e
            });
            throw e;
        }
    }

    /**
     * Lee y prepara la llave privada desde File Cabinet
     * @param {number} fileId - ID del archivo .key
     * @returns {string} Llave privada en formato PEM
     */
    function obtenerLlavePrivada(fileId) {
        try {
            const keyFile = file.load({
                id: fileId
            });
            
            const keyContent = keyFile.getContents();
            
            log.debug({
                title: 'Llave privada cargada',
                details: {
                    nombre: keyFile.name,
                    tamaño: keyContent.length,
                    primeros50Chars: keyContent.substring(0, 50)
                }
            });
            
            return keyContent;
        } catch (e) {
            log.error({
                title: 'Error al cargar llave privada',
                details: e
            });
            throw e;
        }
    }

    /**
     * Genera timestamps para el mensaje SOAP
     * @returns {Object} Objeto con timestamps created y expires
     */
    function generarTimestamps() {
        try {
            // Crear fecha actual
            const now = new Date();
            
            // Ajustar a zona horaria de México (UTC-6)
            const offsetMexico = -6 * 60; // -6 horas en minutos
            const mexicoTime = new Date(now.getTime() + (offsetMexico * 60000));
            
            // Crear fecha de expiración (5 minutos después)
            const expires = new Date(mexicoTime.getTime() + (5 * 60000));
            
            // Formatear fechas en ISO8601
            const created = mexicoTime.toISOString();
            const expiresStr = expires.toISOString();
            
            log.debug({
                title: 'Timestamps generados',
                details: {
                    created: created,
                    expires: expiresStr,
                    localTime: mexicoTime.toString()
                }
            });
            
            return {
                created: created,
                expires: expiresStr
            };
        } catch (e) {
            log.error({
                title: 'Error al generar timestamps',
                details: e
            });
            throw e;
        }
    }

    /**
     * Genera el XML del timestamp
     * @param {Object} timestamps Objeto con created y expires
     * @returns {string} XML del timestamp
     */
    function generarTimestampXml(timestamps) {
        try {
            // Validar que los timestamps existan
            if (!timestamps || !timestamps.created || !timestamps.expires) {
                throw new Error('Timestamps inválidos');
            }

            // Construir el XML con formato explícito
            const timestampXml = [
                '<u:Timestamp xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" u:Id="_0">',
                '    <u:Created>' + timestamps.created + '</u:Created>',
                '    <u:Expires>' + timestamps.expires + '</u:Expires>',
                '</u:Timestamp>'
            ].join('\n');
            
            // Verificar que el XML se formó correctamente
            log.debug({
                title: 'XML del timestamp generado',
                details: {
                    rawXml: timestampXml,
                    created: timestamps.created,
                    expires: timestamps.expires,
                    xmlLength: timestampXml.length
                }
            });
            
            // Validar que el XML contenga las etiquetas necesarias
            if (timestampXml.indexOf('<u:Created>') === -1 || timestampXml.indexOf('<u:Expires>') === -1) {
                throw new Error('XML del timestamp mal formado');
            }
            
            return timestampXml;
        } catch (e) {
            log.error({
                title: 'Error al generar XML del timestamp',
                details: e
            });
            throw e;
        }
    }

    /**
     * Genera el XML del BinarySecurityToken
     * @param {string} certificado - Certificado en Base64
     * @param {string} uuid - Identificador único
     * @returns {string} XML del BinarySecurityToken
     */
    function generarBinarySecurityTokenXml(certificado, uuid) {
        try {
            const binarySecurityTokenXml = [
                '<o:BinarySecurityToken',
                '    xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"',
                '    xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"',
                '    u:Id="' + uuid + '"',
                '    ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"',
                '    EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">',
                certificado,
                '</o:BinarySecurityToken>'
            ].join('\n');

            log.debug({
                title: 'BinarySecurityToken generado',
                details: {
                    xml: binarySecurityTokenXml,
                    length: binarySecurityTokenXml.length,
                    uuid: uuid
                }
            });

            return binarySecurityTokenXml;
        } catch (e) {
            log.error({
                title: 'Error al generar BinarySecurityToken',
                details: e
            });
            throw e;
        }
    }

    /**
     * Genera un UUID único
     * @returns {string} UUID
     */
    function generateUUID() {
        return 'uuid-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    /**
     * Genera el digest SHA1 del contenido
     * @param {string} content - Contenido a digerir
     * @returns {string} Digest en Base64
     */
    function generateDigest(content) {
        try {
            // Primero canonicalizamos el contenido
            const contentCanonicalizado = content.replace(/\r?\n/g, '')
                                               .replace(/>\s+</g, '><')
                                               .replace(/\s+/g, ' ')
                                               .trim();
            
            log.debug({
                title: 'Contenido a digerir',
                details: {
                    original: content,
                    canonicalizado: contentCanonicalizado
                }
            });

            // Generar el hash SHA1
            const hash = cryptoJS.SHA1(contentCanonicalizado);
            const digestBase64 = cryptoJS.enc.Base64.stringify(hash);
            
            log.debug({
                title: 'Digest SHA1 generado',
                details: {
                    input: contentCanonicalizado.substring(0, 100) + '...',
                    digest: digestBase64
                }
            });
            
            return digestBase64;
        } catch (e) {
            log.error({
                title: 'Error generando digest',
                details: {
                    error: e,
                    stack: e.stack
                }
            });
            throw e;
        }
    }

    /**
     * Genera el XML SignedInfo
     * @param {string} digestValue - Digest del timestamp
     * @param {string} uuid - UUID del BinarySecurityToken
     * @returns {string} XML del SignedInfo
     */
    function generarSignedInfoXml(digestValue, uuid) {
        try {
            const signedInfoXml = [
                '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">',
                '    <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>',
                '    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>',
                '    <Reference URI="#_0">',
                '        <Transforms>',
                '            <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>',
                '        </Transforms>',
                '        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
                '        <DigestValue>' + digestValue + '</DigestValue>',
                '    </Reference>',
                '</SignedInfo>'
            ].join('\n');

            log.debug({
                title: 'SignedInfo generado',
                details: {
                    xml: signedInfoXml,
                    digestValue: digestValue
                }
            });

            return signedInfoXml;
        } catch (e) {
            log.error('Error generando SignedInfo', e);
            throw e;
        }
    }

    /**
     * Genera el XML del elemento Signature completo
     * @param {string} signedInfoXml - XML del SignedInfo
     * @param {string} signatureValue - Firma en Base64
     * @param {string} uuid - UUID del BinarySecurityToken
     * @returns {string} XML del elemento Signature
     */
    function generarSignatureXml(signedInfoXml, signatureValue, uuid) {
        try {
            const signatureXml = [
                '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">',
                signedInfoXml,
                '    <SignatureValue>' + signatureValue + '</SignatureValue>',
                '    <KeyInfo>',
                '        <o:SecurityTokenReference xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">',
                '            <o:Reference URI="#' + uuid + '"',
                '                ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/>',
                '        </o:SecurityTokenReference>',
                '    </KeyInfo>',
                '</Signature>'
            ].join('\n');

            log.debug({
                title: 'Signature XML generado',
                details: {
                    xml: signatureXml,
                    length: signatureXml.length
                }
            });

            return signatureXml;
        } catch (e) {
            log.error({
                title: 'Error generando Signature XML',
                details: e
            });
            throw e;
        }
    }

    function onRequest(context) {
        try {
            // Cargar certificado y llave privada
            const certificado = obtenerCertificado(2949555);
            const llavePrivada = obtenerLlavePrivada(2949554);
            
            // Generar timestamps
            const timestamps = generarTimestamps();
            const timestampXml = generarTimestampXml(timestamps);
            
            // Generar UUID y BinarySecurityToken
            const uuid = generateUUID();
            const binarySecurityTokenXml = generarBinarySecurityTokenXml(certificado, uuid);
            
            // Generar digest del timestamp
            const digestValue = generateDigest(timestampXml);
            
            // Generar SignedInfo
            const signedInfoXml = generarSignedInfoXml(digestValue, uuid);
            
            // Firmar el SignedInfo
            const signature = firmarSignedInfo(signedInfoXml, llavePrivada);
            
            // Generar el elemento Signature completo
            const signatureXml = generarSignatureXml(signedInfoXml, signature, uuid);
            
            log.debug({
                title: 'Elementos generados',
                details: {
                    timestampXml: timestampXml,
                    digestValue: digestValue,
                    signedInfoXml: signedInfoXml,
                    signatureValue: signature,
                    signatureXml: signatureXml,
                    uuid: uuid
                }
            });
            
            context.response.write(JSON.stringify({
                success: true,
                timestamps: timestamps,
                timestampXml: timestampXml,
                binarySecurityTokenXml: binarySecurityTokenXml,
                digestValue: digestValue,
                signedInfoXml: signedInfoXml,
                signatureValue: signature,
                signatureXml: signatureXml,
                uuid: uuid
            }));
            
        } catch (e) {
            log.error('Error en onRequest', e);
            context.response.write(JSON.stringify({
                success: false,
                error: e.message
            }));
        }
    }

    return {
        onRequest: onRequest
    };
});
