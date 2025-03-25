/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https', 'N/file', 'N/encode','N/crypto/random','./crypto-js-old.js', 'N/crypto/certificate','./xml-crypto-bundle.js','N/xml'], function (https, file, encode, random, cryptold, certificate, xmlcryptob,xml) {
    function onRequest(context) {

        // Obtener los archivos de certificado y clave privada desde el File Cabinet
        var certificadoFile = file.load(2949555); // ID del archivo de certificado .CER
        var privateKeyFile = file.load(2949554); // ID del archivo de clave privada .KEY



        // Leer el contenido del certificado y clave privada en formato Base64
        var certificadoBase64 = certificadoFile.getContents();  // Ya está en base64
        log.debug('certificadoBase64',certificadoBase64)
        var privateKeyContents = privateKeyFile.getContents();  // Ya está en base64
        log.debug('privateKeyContents',privateKeyContents)
        var keyEncoded = encode.convert({
            string: privateKeyContents,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8
        });

        // Variables de tiempo para el Timestamp
        var createdTimestamp = new Date().toISOString();
        var expiresTimestamp = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Expires en 5 minutos

        // UUIDs para BinarySecurityToken y el ActivityId
        var uuidToken = random.generateUUID()+'-1';
        var activityId = 'c5478a6f-8f27-43f4-bc97-bea17612517c';

        // DigestValue y SignatureValue placeholder (esto debe ser calculado usando las firmas)
        var timestampXML = `
            <u:Timestamp xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" u:Id="_0">
                <u:Created>${createdTimestamp}</u:Created>
                <u:Expires>${expiresTimestamp}</u:Expires>
            </u:Timestamp>
        `;



        var xx = cryptold.SHA1(timestampXML);
        var hex   = cryptold.enc.Base64.stringify(xx);

        // Hash en binario directamente
        log.debug('SHA1 en binario', hex);










        var digestValue = calculateDigestSHA1(timestampXML)
        log.debug('digestValue',digestValue)


        //Signature
        var signedInfoXML = '<signedinfo xmlns="http://www.w3.org/2000/09/xmldsig#"><canonicalizationmethod algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></canonicalizationmethod><signaturemethod algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></signaturemethod><reference uri=""><transforms><transform algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></transform></transforms><digestmethod algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></digestmethod><digestvalue>${hex}</digestvalue></reference></signedinfo>';

        /*var signatureResult = certificate.signXml({
            xmlString: signedInfoXML,
            certId: privateKeyContents,
            algorithm: certificate.HashAlg.SHA256, // Asegúrate de que esto sea correcto
            rootTag: 'signedinfo'  // Tag raíz que deseas firmar
            // insertionTag: 'signature' // Opcional, si deseas especificar un tag de inserción
        });

        
        log.debug('signatureBase64:', signatureBase64);
*/
        
        var hmac = cryptold.HmacSHA1(signedInfoXML, privateKeyContents);
        log.debug('hmac',hmac)
        var signatureBase64   = cryptold.enc.Base64.stringify(hmac);
        // Hash en binario directamente
        log.debug('signatureBase64', signatureBase64);

        // Formato XML con firma digital
        var soapRequest = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><s:Header><ActivityId CorrelationId="${activityId}"xmlns="http://schemas.microsoft.com/2004/09/ServiceModel/Diagnostics">00000000-0000-0000-0000-000000000000</ActivityId><o:Security s:mustUnderstand="1"xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><u:Timestamp u:Id="_0"><u:Created>${createdTimestamp}</u:Created><u:Expires>${expiresTimestamp}</u:Expires></u:Timestamp><o:BinarySecurityToken u:Id="${uuidToken}"ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${certificadoBase64}</o:BinarySecurityToken><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI="#_0"><Transforms><Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>${hex}</DigestValue></Reference></SignedInfo><SignatureValue>${signatureBase64}</SignatureValue><KeyInfo><o:SecurityTokenReference><o:Reference ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"URI="#${uuidToken}"/></o:SecurityTokenReference></KeyInfo></Signature></o:Security></s:Header><s:Body><Autentica xmlns="http://DescargaMasivaTerceros.gob.mx"/></s:Body></s:Envelope>';
        log.debug('soapRequest',soapRequest)


        var xmlDocument = xml.Parser.fromString({
            text: soapRequest
        });

        soapRequest = xml.Parser.toString({
            document : xmlDocument
        });
        log.debug('soapRequest2',soapRequest)
        // Hacer la solicitud HTTPS POST
        var response = https.post({
            url: 'https://cfdidescargamasivasolicitud.clouda.sat.gob.mx/Autenticacion/Autenticacion.svc',
            body: soapRequest,
            headers: {
                'Content-Type': 'text/xml',
                'SOAPAction': 'http://DescargaMasivaTerceros.gob.mx/Autentica'
            }
        });
        log.debug('response',response)
        // Responder con los datos del request
        context.response.write({
            output: response.body
        });
    }
    
    function calculateDigestSHA1(str) {
        // Función para rotar bits a la izquierda
        function rotateLeft(n, s) {
            return (n << s) | (n >>> (32 - s));
        }

        // Función para convertir un valor a hexadecimal
        function cvtHex(val) {
            let str = '';
            for (let i = 7; i >= 0; i--) {
                const v = (val >>> (i * 4)) & 0x0f;
                str += v.toString(16);
            }
            return str;
        }

        // Inicializar variables
        let H0 = 0x67452301;
        let H1 = 0xEFCDAB89;
        let H2 = 0x98BADCFE;
        let H3 = 0x10325476;
        let H4 = 0xC3D2E1F0;

        // Preprocesar el texto
        str = unescape(encodeURIComponent(str)); // Convertir a UTF-8
        const strLen = str.length;

        // Convertir el texto a un array de palabras
        const wordArray = [];
        for (let i = 0; i < strLen - 3; i += 4) {
            const j = (str.charCodeAt(i) << 24) |
                      (str.charCodeAt(i + 1) << 16) |
                      (str.charCodeAt(i + 2) << 8) |
                      str.charCodeAt(i + 3);
            wordArray.push(j);
        }

        // Manejar el padding
        switch (strLen % 4) {
            case 0:
                wordArray.push(0x080000000);
                break;
            case 1:
                wordArray.push((str.charCodeAt(strLen - 1) << 24) | 0x0800000);
                break;
            case 2:
                wordArray.push((str.charCodeAt(strLen - 2) << 24) |
                               (str.charCodeAt(strLen - 1) << 16) | 0x08000);
                break;
            case 3:
                wordArray.push((str.charCodeAt(strLen - 3) << 24) |
                               (str.charCodeAt(strLen - 2) << 16) |
                               (str.charCodeAt(strLen - 1) << 8) | 0x80);
                break;
        }

        // Padding con ceros
        while ((wordArray.length % 16) !== 14) {
            wordArray.push(0);
        }

        // Agregar el tamaño original del mensaje
        wordArray.push(strLen >>> 29);
        wordArray.push((strLen << 3) & 0x0ffffffff);

        // Proceso de hash
        for (let blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
            const W = new Array(80);
            for (let i = 0; i < 16; i++) {
                W[i] = wordArray[blockstart + i];
            }
            for (let i = 16; i <= 79; i++) {
                W[i] = rotateLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
            }

            let A = H0;
            let B = H1;
            let C = H2;
            let D = H3;
            let E = H4;

            for (let i = 0; i <= 19; i++) {
                const temp = (rotateLeft(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotateLeft(B, 30);
                B = A;
                A = temp;
            }

            for (let i = 20; i <= 39; i++) {
                const temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotateLeft(B, 30);
                B = A;
                A = temp;
            }

            for (let i = 40; i <= 59; i++) {
                const temp = (rotateLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotateLeft(B, 30);
                B = A;
                A = temp;
            }

            for (let i = 60; i <= 79; i++) {
                const temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotateLeft(B, 30);
                B = A;
                A = temp;
            }

            // Sumar los resultados a los valores anteriores
            H0 = (H0 + A) & 0x0ffffffff;
            H1 = (H1 + B) & 0x0ffffffff;
            H2 = (H2 + C) & 0x0ffffffff;
            H3 = (H3 + D) & 0x0ffffffff;
            H4 = (H4 + E) & 0x0ffffffff;
        }

        // Construir el hash en formato hexadecimal
        let sha1HashHex = cvtHex(H0) + cvtHex(H1) + cvtHex(H2) + cvtHex(H3) + cvtHex(H4);

        // Convertir el hash hexadecimal a un Array de bytes
        const bytes = [];
        for (let i = 0; i < sha1HashHex.length; i += 2) {
            bytes.push(parseInt(sha1HashHex.substr(i, 2), 16));
        }

        // Convertir el Array de bytes a Base64
        let base64Hash = encode.convert({
            string: String.fromCharCode.apply(null, bytes),
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });

        return base64Hash;
    }

    return {
        onRequest: onRequest
    };
});
