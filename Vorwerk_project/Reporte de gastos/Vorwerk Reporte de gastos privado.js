/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/email', 'N/url', 'N/log'],
    function(serverWidget, record, search, email, url, log) {
        
        function onRequest(context) {
            log.debug('Iniciando Suitelet', {
                metodo: context.request.method,
                parametros: context.request.parameters,
                body: context.request.body,
                headers: context.request.headers
            });
            
            // Verificar si es una solicitud para generar código
            log.debug('Verificando action', {
                action: context.request.parameters.action,
                bodyAction: context.request.body ? JSON.parse(context.request.body).action : null
            });

            if (context.request.parameters.action === 'generateCode' || 
                (context.request.body && JSON.parse(context.request.body).action === 'generateCode')) {
                log.debug('Procesando solicitud de generación de código', {
                    action: context.request.parameters.action,
                    email: context.request.parameters.email,
                    body: context.request.body
                });
                handleGenerateCode(context);
                return;
            }

            if (context.request.method === 'GET') {
                // ... resto del código existente ...
            }
        }

        function handleGenerateCode(context) {
            try {
                var employeeEmail;
                // Obtener el email según el método
                if (context.request.method === 'POST') {
                    log.debug('Procesando POST', {
                        body: context.request.body,
                        contentType: context.request.headers['content-type']
                    });
                    
                    var body = JSON.parse(context.request.body);
                    log.debug('Body parseado', body);
                    
                    employeeEmail = body.email;
                    log.debug('Email extraído del body', employeeEmail);
                } else {
                    log.debug('Procesando GET', {
                        parameters: context.request.parameters
                    });
                    employeeEmail = context.request.parameters.email;
                }
                
                log.debug('Email obtenido', employeeEmail);
                
                // Buscar el empleado
                var employeeSearch = search.create({
                    type: search.Type.EMPLOYEE,
                    filters: [
                        ['email', 'is', employeeEmail],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });

                log.debug('Buscando empleado con email', employeeEmail);
                var employeeResult = employeeSearch.run().getRange({start: 0, end: 1})[0];
                log.debug('Resultado de búsqueda de empleado', employeeResult);
                
                if (!employeeResult) {
                    log.error('Empleado no encontrado', employeeEmail);
                    throw new Error('Empleado no encontrado o inactivo');
                }

                // Generar código aleatorio
                var code = Math.random().toString(36).substring(2, 8).toUpperCase();
                log.debug('Código generado', code);
                
                // Actualizar el empleado con el nuevo código usando submitFields
                var employeeId = record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: employeeResult.id,
                    values: {
                        'custentity_expense_validation_code': code,
                        'custentity_expense_code_date': new Date()
                    }
                });
                log.debug('Empleado actualizado', employeeId);

                // Enviar email con el código
                var emailOptions = {
                    author: 14803,
                    recipients: employeeEmail,
                    subject: 'Código de Validación - Reporte de Gastos',
                    body: 'Su código de validación es: ' + code + '\n\nEste código expirará al final del día.'
                };
                log.debug('Enviando email con opciones', emailOptions);
                
                var emailSent = email.send(emailOptions);
                log.debug('Email enviado', emailSent);

                context.response.write(JSON.stringify({
                    success: true,
                    message: 'Código generado y enviado exitosamente'
                }));

            } catch (e) {
                log.error('Error en handleGenerateCode', {
                    error: e.message,
                    stack: e.stack,
                    context: {
                        method: context.request.method,
                        body: context.request.body,
                        parameters: context.request.parameters
                    }
                });
                context.response.write(JSON.stringify({
                    success: false,
                    message: e.message
                }));
            }
        }

        return {
            onRequest: onRequest
        };
    });