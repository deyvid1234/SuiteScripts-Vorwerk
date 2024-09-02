define(['N/https'], function(https) {

    function sendSoapRequest() {
        var soapRequest = `
            <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
                        xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility1.0.xsd">
                <s:Header>
                    <o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis200401-wss-wssecurity-secext-1.0.xsd">
                        <u:Timestamp u:Id="_0">
                            <u:Created>2018-05-09T21:21:42.953Z</u:Created>
                            <u:Expires>2018-05-09T21:26:42.953Z</u:Expires>
                        </u:Timestamp>
                        <o:BinarySecurityToken u:Id="uuid-572bbc7a-287d-4233-bdcb-75f92418becd-1"
                            ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile1.0#X509v3" 
                            EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wsssoap-message-security1.0#Base64Binary">
                            MIIGiDCCBHCgAwIBAgIUMzAwMDEwMDAwMDAzMDAwMjkwODEwDQYJKoZIhvcNAQELBQAwggFm...
                        </o:BinarySecurityToken>
                        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
                            <SignedInfo>
                                <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
                                <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
                                <Reference URI="#_0">
                                    <Transforms>
                                        <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
                                    </Transforms>
                                    <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
                                    <DigestValue>Ij+Epaya2U5D/sSncI6BHkkTRWo=</DigestValue>
                                </Reference>
                            </SignedInfo>
                            <SignatureValue>EIY2h4gE3G8+K2kkoFxVwHqeTbdlA4fCHok4lOA+0hUloAkBipza4gUt5...
                            </SignatureValue>
                            <KeyInfo>
                                <o:SecurityTokenReference>
                                    <o:Reference ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"
                                                URI="#uuid-572bbc7a-287d-4233-bdcb-75f92418becd-1" />
                                </o:SecurityTokenReference>
                            </KeyInfo>
                        </Signature>
                    </o:Security>
                    <To s:mustUnderstand="1"
                        xmlns="http://schemas.microsoft.com/ws/2005/05/addressing/none">
                        https://desktop3fi24u7:444/Autenticacion/Autenticacion.svc
                    </To>
                    <Action s:mustUnderstand="1"
                        xmlns="http://schemas.microsoft.com/ws/2005/05/addressing/none">
                        http://DescargaMasivaTerceros.gob.mx/IAutenticacion/Autentica
                    </Action>
                </s:Header>
                <s:Body>
                    <Autentica xmlns="http://DescargaMasivaTerceros.gob.mx" />
                </s:Body>
            </s:Envelope>
        `;

        var url = 'https://desktop3fi24u7:444/Autenticacion/Autenticacion.svc';

        var headers = {
            'Content-Type': 'text/xml',
            'SOAPAction': 'http://DescargaMasivaTerceros.gob.mx/IAutenticacion/Autentica'
        };

        var response = https.post({
            url: url,
            body: soapRequest,
            headers: headers
        });

        log.debug({
            title: 'SOAP Response',
            details: response.body
        });
    }

    return {
        execute: sendSoapRequest
    };
});
