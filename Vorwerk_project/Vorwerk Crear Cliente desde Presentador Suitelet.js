/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description Crea un cliente desde el registro de Employee (presentador). Ejecuta en servidor para poder leer/escribir addressbook.
 * Parámetros: employeeid (requerido), returnurl (opcional, URL para volver al empleado)
 */
define(['N/record', 'N/search', 'N/log', 'N/url'],

    function(record, search, log, url) {

        function onRequest(context) {
            var request = context.request;
            var response = context.response;
            var employeeId = request.parameters.employeeid;
            var returnUrl = request.parameters.returnurl || '';
            var formatJson = request.parameters.format === 'json';

            if (!employeeId) {
                if (formatJson) { response.write(JSON.stringify({ success: false, message: 'Falta el parámetro employeeid.' })); return; }
                writeResult(response, false, 'Falta el parámetro employeeid.', returnUrl);
                return;
            }

            try {
                var employeeRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: employeeId,
                    isDynamic: false
                });

                var clienteRelacionado = employeeRecord.getValue('custentity_cliente_relacionado');
                if (clienteRelacionado && clienteRelacionado !== '' && clienteRelacionado !== null) {
                    if (formatJson) { response.write(JSON.stringify({ success: false, message: 'Este presentador ya tiene un cliente relacionado. No se puede crear otro.' })); return; }
                    writeResult(response, false, 'Este presentador ya tiene un cliente relacionado. No se puede crear otro.', returnUrl);
                    return;
                }

                var entityId = employeeRecord.getValue('entityid');
                if (!entityId || String(entityId).trim() === '') {
                    if (formatJson) { response.write(JSON.stringify({ success: false, message: 'El empleado no tiene IDU (entityid) asignado.' })); return; }
                    writeResult(response, false, 'El empleado no tiene IDU (entityid) asignado.', returnUrl);
                    return;
                }

                var altName = employeeRecord.getValue('altname');
                var firstName = employeeRecord.getValue('firstname');
                var lastName = employeeRecord.getValue('lastname');
                // En el presentador el RFC está en custentity_ce_rfc
                var rfc = employeeRecord.getValue('custentity_ce_rfc') || '';
                var nombreCliente = (altName && altName !== '') ? altName : ((firstName || '') + ' ' + (lastName || '')).trim();
                if (!nombreCliente) {
                    if (formatJson) { response.write(JSON.stringify({ success: false, message: 'El empleado no tiene nombre asignado.' })); return; }
                    writeResult(response, false, 'El empleado no tiene nombre asignado.', returnUrl);
                    return;
                }

                var email = employeeRecord.getValue('email') || '';
                var phone = employeeRecord.getValue('phone') || '';
                var mobilephone = employeeRecord.getValue('mobilephone') || '';
                var attention = '', addr1 = '', addr2 = '', addr3 = '', city = '', state = '', zip = '', country = '', addrphone = '';

                try {
                    var addrLineCount = employeeRecord.getLineCount({ sublistId: 'addressbook' });
                    log.debug('Suitelet Crear Cliente - addressbook lines', addrLineCount);
                    if (addrLineCount > 0) {
                        var defaultShipIndex = 0;
                        for (var i = 0; i < addrLineCount; i++) {
                            var isDefaultShip = employeeRecord.getSublistValue({
                                sublistId: 'addressbook',
                                fieldId: 'defaultshipping',
                                line: i
                            });
                            if (isDefaultShip) {
                                defaultShipIndex = i;
                                break;
                            }
                        }
                        var addrSubrec = employeeRecord.getSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress',
                            line: defaultShipIndex
                        });
                        attention = addrSubrec.getValue({ fieldId: 'attention' }) || '';
                        addr1 = addrSubrec.getValue({ fieldId: 'addr1' }) || '';
                        addr2 = addrSubrec.getValue({ fieldId: 'addr2' }) || '';
                        addr3 = addrSubrec.getValue({ fieldId: 'addr3' }) || '';
                        city = addrSubrec.getValue({ fieldId: 'city' }) || '';
                        state = addrSubrec.getValue({ fieldId: 'state' }) || '';
                        zip = addrSubrec.getValue({ fieldId: 'zip' }) || '';
                        country = addrSubrec.getValue({ fieldId: 'country' }) || '';
                        try {
                            addrphone = addrSubrec.getValue({ fieldId: 'addrphone' }) || addrSubrec.getText({ fieldId: 'addrphone' }) || '';
                        } catch (e) { addrphone = ''; }
                        log.debug('Suitelet Crear Cliente - Dirección y teléfono del presentador', { addr1: addr1, city: city, state: state, zip: zip, country: country, addrphone: addrphone, defaultShipIndex: defaultShipIndex });
                    }
                } catch (addrReadErr) {
                    log.debug('Suitelet Crear Cliente - Error leyendo addressbook employee', addrReadErr);
                }

                // Presentador: el número puede estar en phone (nivel registro), mobilephone o en la dirección (addrphone). Cliente: siempre en mobilephone.
                var telefonoCliente = (phone !== '') ? phone : ((mobilephone !== '') ? mobilephone : addrphone);
                log.debug('Suitelet Crear Cliente - Teléfono', { phone: phone, mobilephone: mobilephone, addrphone: addrphone, telefonoCliente: telefonoCliente });

                var clienteEntityId = 'IDU-' + entityId;

                var newCustomer = record.create({
                    type: record.Type.CUSTOMER,
                    isDynamic: true
                });

                newCustomer.setValue({ fieldId: 'companyname', value: nombreCliente });
                newCustomer.setValue({ fieldId: 'altname', value: nombreCliente });
                if (firstName && firstName !== '') newCustomer.setValue({ fieldId: 'firstname', value: firstName });
                if (lastName && lastName !== '') newCustomer.setValue({ fieldId: 'lastname', value: lastName });
                newCustomer.setValue({ fieldId: 'salesrep', value: employeeId });
                newCustomer.setValue({ fieldId: 'custentity_creado_desde_presentador', value: true });
                if (email !== '') newCustomer.setValue({ fieldId: 'email', value: email });
                if (telefonoCliente !== '') {
                    newCustomer.setValue({ fieldId: 'mobilephone', value: telefonoCliente });
                    log.debug('Suitelet Crear Cliente - mobilephone asignado al cliente', telefonoCliente);
                }
                // Campos adicionales: razón social (altname presentador), régimen fiscal 11, destinatario CFDI (email presentador)
                if (altName && altName !== '') newCustomer.setValue({ fieldId: 'custentity_razon_social', value: altName });
                newCustomer.setValue({ fieldId: 'custentity_regimenfiscal_ce', value: 11 });
                if (email !== '') newCustomer.setValue({ fieldId: 'custentity_fe_sf_se_destinatario', value: email });
                // RFC: se copia del presentador al cliente (mismo internal id del campo en ambos registros)
                if (rfc !== '') newCustomer.setValue({ fieldId: 'custentity_rfc', value: rfc });

                var tieneDireccion = (attention !== '') || (addr1 !== '') || (addr2 !== '') || (addr3 !== '') || (city !== '') || (zip !== '');
                if (tieneDireccion) {
                    try {
                        var labelDir = (addr1 && String(addr1).trim() !== '') ? String(addr1).trim() : 'Principal';
                        if (labelDir.length > 50) labelDir = labelDir.substring(0, 50);
                        newCustomer.selectNewLine({ sublistId: 'addressbook' });
                        newCustomer.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'label', value: labelDir });
                        newCustomer.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
                        newCustomer.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
                        var addressSubrec = newCustomer.getCurrentSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress'
                        });
                        if (addressSubrec) {
                            if (country !== '') addressSubrec.setValue({ fieldId: 'country', value: country });
                            if (attention !== '') addressSubrec.setValue({ fieldId: 'attention', value: attention });
                            if (addr1 !== '') addressSubrec.setValue({ fieldId: 'addr1', value: addr1 });
                            if (addr2 !== '') addressSubrec.setValue({ fieldId: 'addr2', value: addr2 });
                            if (addr3 !== '') addressSubrec.setValue({ fieldId: 'addr3', value: addr3 });
                            if (city !== '') addressSubrec.setValue({ fieldId: 'city', value: city });
                            if (state !== '') addressSubrec.setValue({ fieldId: 'state', value: state });
                            if (zip !== '') addressSubrec.setValue({ fieldId: 'zip', value: zip });
                            log.debug('Suitelet Crear Cliente - Dirección escrita en customer addressbook');
                        }
                        newCustomer.commitLine({ sublistId: 'addressbook' });
                    } catch (addrErr) {
                        log.error('Suitelet Crear Cliente - Error escribiendo addressbook customer', addrErr);
                    }
                }

                var customerId = newCustomer.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                try {
                    var custRec = record.load({ type: record.Type.CUSTOMER, id: customerId, isDynamic: true });
                    custRec.setValue({ fieldId: 'entityid', value: clienteEntityId });
                    custRec.save({ enableSourcing: false, ignoreMandatoryFields: false });
                } catch (e) {
                    log.debug('Suitelet Crear Cliente - Error actualizando entityid', e);
                }

                try {
                    var empRec = record.load({ type: record.Type.EMPLOYEE, id: employeeId, isDynamic: true });
                    empRec.setValue({ fieldId: 'custentity_cliente_relacionado', value: customerId });
                    empRec.save({ enableSourcing: false, ignoreMandatoryFields: false });
                } catch (e) {
                    log.error('Suitelet Crear Cliente - Error actualizando employee', e);
                }

                var msgHtml = 'Cliente creado correctamente.<br/>ID Cliente: ' + customerId + '<br/>IDU: ' + clienteEntityId + '<br/>Nombre: ' + nombreCliente;
                if (tieneDireccion) {
                    msgHtml += '<br/><br/>Se copió la dirección del presentador al cliente.';
                }
                var msgPlain = 'Cliente creado correctamente.\n\nID del Cliente: ' + customerId + '\nIDU: ' + clienteEntityId + '\nNombre: ' + nombreCliente + (tieneDireccion ? '\n\nSe copió la dirección del presentador al cliente.' : '');
                if (formatJson) {
                    response.write(JSON.stringify({ success: true, message: msgPlain, customerId: customerId, clienteEntityId: clienteEntityId, nombreCliente: nombreCliente }));
                    return;
                }
                writeResult(response, true, msgHtml, returnUrl);

            } catch (err) {
                log.error('Suitelet Crear Cliente - Error', err);
                var errMsg = 'Error al crear el cliente: ' + (err.message || err.toString());
                if (formatJson) { response.write(JSON.stringify({ success: false, message: errMsg })); return; }
                writeResult(response, false, errMsg, returnUrl);
            }
        }

        function writeResult(response, ok, message, returnUrl) {
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><title>Crear Cliente desde Presentador</title></head><body style="font-family: sans-serif; padding: 20px;">';
            html += '<p style="color: ' + (ok ? 'green' : 'red') + ';">' + message + '</p>';
            if (returnUrl && returnUrl !== '') {
                html += '<p><a href="' + returnUrl + '">Volver al registro del empleado</a></p>';
            }
            html += '</body></html>';
            response.write(html);
        }

        return {
            onRequest: onRequest
        };
    });
