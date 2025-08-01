/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @description Script programado que busca empleados que cumplen años hoy
 */
define(['N/search', 'N/format', 'N/runtime', 'N/email', 'N/record'],

function(search, format, runtime, email, record) {
    
    /**
     * Defines the Scheduled script trigger point.
     *
     * @param {Object} context
     * @param {string} context.type - The context in which the script is executed
     * @since 2015.2
     */
    function execute(context) {
        try {
            log.debug('execute', 'Iniciando búsqueda de empleados que cumplen años hoy');
            
            // Obtener la fecha actual usando N/format para mayor confiabilidad
            var today = new Date();
            var todayFormatted = format.format({
                value: today,
                type: format.Type.DATE
            });
            
            log.debug('Fecha actual completa', 'Fecha: ' + today + ', Formateada: ' + todayFormatted);
            
            var currentMonth = today.getMonth() + 1; // getMonth() retorna 0-11
            var currentDay = today.getDate();
            
            log.debug('Fecha actual', 'Mes: ' + currentMonth + ', Día: ' + currentDay);
            
            // Crear búsqueda de empleados con fecha de nacimiento
            var employeeSearch = search.create({
                type: search.Type.EMPLOYEE,
                filters: [
                    ['custentity_cumpleanios_dev', 'isnotempty', '']
                ],
                columns: [
                    search.createColumn({
                        name: 'internalid',
                        label: 'ID Interno'
                    }),
                    search.createColumn({
                        name: 'firstname',
                        label: 'Nombre'
                    }),
                    search.createColumn({
                        name: 'lastname',
                        label: 'Apellido'
                    }),
                    search.createColumn({
                        name: 'email',
                        label: 'Email'
                    }),
                    search.createColumn({
                        name: 'custentity_cumpleanios_dev',
                        label: 'Fecha de Nacimiento'
                    }),
                    search.createColumn({
                        name: 'hiredate',
                        label: 'Fecha de Contratacion'
                    })
                ]
            });
            
            log.debug('Búsqueda creada', 'Obteniendo todos los empleados con fecha de nacimiento');
            
            // Ejecutar la búsqueda y procesar cada empleado
            var searchResult = employeeSearch.run();
            var employeeCount = 0;
            var anniversaryCount = 0;
            var totalProcessed = 0;
            
            searchResult.each(function(result) {
                totalProcessed++;
                var employeeId = result.getValue('internalid');
                var firstName = result.getValue('firstname') || '';
                var lastName = result.getValue('lastname') || '';
                var employeeName = (firstName + ' ' + lastName).trim() || 'Empleado ID: ' + employeeId;
                var employeeEmail = result.getValue('email');
                var birthDate = result.getValue('custentity_cumpleanios_dev');
                var hiredate = result.getValue('hiredate');
                log.debug('hiredate', hiredate);
                log.debug('birthDate', birthDate);
                
                // Verificar si el empleado cumple años hoy
                if (birthDate) {
                    // Usar N/format para parsear correctamente la fecha en formato DD/MM/YYYY
                    var birthDateObj = format.parse({
                        value: birthDate,
                        type: format.Type.DATE
                    });
                    
                    log.debug('Fecha de nacimiento obj', 'Fecha: ' + birthDateObj);
                    var birthMonth = birthDateObj.getMonth() + 1; // getMonth() retorna 0-11
                    var birthDay = birthDateObj.getDate();
                    log.debug('Fecha de nacimiento', 'Mes: ' + birthMonth + ', Día: ' + birthDay);
                    
                    log.debug('Comparación', 'Empleado: ' + birthMonth + '/' + birthDay + ' vs Hoy: ' + currentMonth + '/' + currentDay);
                    
                    if (birthMonth === currentMonth && birthDay === currentDay) {
                        employeeCount++;
                        log.debug('Empleado que cumple años hoy', {
                            id: employeeId,
                            name: employeeName,
                            email: employeeEmail,
                            birthDate: birthDate,
                            birthMonth: birthMonth,
                            birthDay: birthDay
                        });
                        
                        // Enviar email de cumpleaños
                        sendBirthdayEmail(employeeId, employeeName, employeeEmail);
                    }
                }
                
                // Verificar si el empleado cumple años de contratación hoy
                if (hiredate) {
                    // Usar N/format para parsear correctamente la fecha de contratación
                    var hiredateObj = format.parse({
                        value: hiredate,
                        type: format.Type.DATE
                    });
                    
                    log.debug('Fecha de contratación obj', 'Fecha: ' + hiredateObj);
                    var hireMonth = hiredateObj.getMonth() + 1; // getMonth() retorna 0-11
                    var hireDay = hiredateObj.getDate();
                    log.debug('Fecha de contratación', 'Mes: ' + hireMonth + ', Día: ' + hireDay);
                    
                    log.debug('Comparación aniversario', 'Empleado: ' + hireMonth + '/' + hireDay + ' vs Hoy: ' + currentMonth + '/' + currentDay);
                    
                    if (hireMonth === currentMonth && hireDay === currentDay) {
                        anniversaryCount++;
                        log.debug('Empleado que cumple años de contratación hoy', {
                            id: employeeId,
                            name: employeeName,
                            email: employeeEmail,
                            hiredate: hiredate,
                            hireMonth: hireMonth,
                            hireDay: hireDay
                        });
                        
                        // Enviar email de aniversario
                        sendAnniversaryEmail(employeeId, employeeName, employeeEmail, hiredate);
                    }
                }
                
                return true;
            });
            
            log.debug('Procesamiento completado', 'Total procesados: ' + totalProcessed + ', Empleados que cumplen años hoy: ' + employeeCount + ', Empleados con aniversario hoy: ' + anniversaryCount);
            
        } catch (error) {
            log.error('Error en script programado de cumpleaños', error);
        }
    }

    /**
     * Envía un email de feliz cumpleaños al empleado
     * @param {number} employeeId - ID del empleado
     * @param {string} employeeName - Nombre del empleado
     * @param {string} employeeEmail - Email del empleado
     */
    function sendBirthdayEmail(employeeId, employeeName, employeeEmail) {
        try {
            if (!employeeEmail) {
                log.warning('Email no disponible', {
                    employeeId: employeeId,
                    employeeName: employeeName
                });
                return;
            }

            // Cargar el template de email desde NetSuite
            var emailTemplate = record.load({
                type: record.Type.EMAIL_TEMPLATE,
                id: 276
            });
            
            // Obtener el asunto y cuerpo del template
            var emailSubject = emailTemplate.getValue('subject');
            var emailBody = emailTemplate.getValue('content');
            emailBody = emailBody.replace(/@name/g,employeeName) 
            
            
            // Enviar el email
            var emailId = email.send({
                author: '344096', // Remitente: usuario actual del sistema
                recipients: employeeEmail,
                subject: emailSubject,
                body: emailBody,
                isHtml: true
            });
            
            log.debug('Email de cumpleaños enviado exitosamente', {
                employeeId: employeeId,
                employeeName: employeeName,
                employeeEmail: employeeEmail,
                emailId: emailId
            });
            
        } catch (error) {
            log.error('Error enviando email de cumpleaños', {
                employeeId: employeeId,
                employeeName: employeeName,
                employeeEmail: employeeEmail,
                error: error
            });
        }
    }

    /**
     * Envía un email de feliz aniversario al empleado
     * @param {number} employeeId - ID del empleado
     * @param {string} employeeName - Nombre del empleado
     * @param {string} employeeEmail - Email del empleado
     */
    function sendAnniversaryEmail(employeeId, employeeName, employeeEmail, hiredate) {
        try {
            if (!employeeEmail) {
                log.warning('Email no disponible para aniversario', {
                    employeeId: employeeId,
                    employeeName: employeeName
                });
                return;
            }

            // Cargar el template de email desde NetSuite
            var emailTemplate = record.load({
                type: record.Type.EMAIL_TEMPLATE,
                id: 277
            });
            
            // Obtener el asunto y cuerpo del template
            var emailSubject = emailTemplate.getValue('subject');
            var emailBody = emailTemplate.getValue('content');
            
            // Calcular años de aniversario
            var today = new Date();
            
            if (hiredate) {
                // Parsear la fecha de contratación que ya viene como string
                var hiredateObj = format.parse({
                    value: hiredate,
                    type: format.Type.DATE
                });
                
                var yearsOfService = calculateYearsOfService(hiredateObj, today);
                log.debug('Años de servicio calculados', {
                    employeeId: employeeId,
                    employeeName: employeeName,
                    hiredate: hiredate,
                    yearsOfService: yearsOfService
                });
                
                // Reemplazar placeholders en el template
                emailBody = emailBody.replace(/@name/g, employeeName);
                emailBody = emailBody.replace(/@aniosMeses/g, yearsOfService + ' años');
            } 
            
            // Enviar el email
            var emailId = email.send({
                author: '344096', // Remitente: usuario actual del sistema
                recipients: employeeEmail,
                subject: emailSubject,
                body: emailBody,
                isHtml: true
            });
            
            log.debug('Email de aniversario enviado exitosamente', {
                employeeId: employeeId,
                employeeName: employeeName,
                employeeEmail: employeeEmail,
                emailId: emailId,
                yearsOfService: yearsOfService
            });
            
        } catch (error) {
            log.error('Error enviando email de aniversario', {
                employeeId: employeeId,
                employeeName: employeeName,
                employeeEmail: employeeEmail,
                error: error
            });
        }
    }

    /**
     * Calcula los años de servicio entre dos fechas
     * @param {Date} hireDate - Fecha de contratación
     * @param {Date} currentDate - Fecha actual
     * @return {number} - Años de servicio
     */
    function calculateYearsOfService(hireDate, currentDate) {
        try {
            var years = currentDate.getFullYear() - hireDate.getFullYear();
            var monthDiff = currentDate.getMonth() - hireDate.getMonth();
            
            // Si el mes actual es menor que el mes de contratación, o si es el mismo mes pero el día es menor
            if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < hireDate.getDate())) {
                years--;
            }
            
            return Math.max(0, years); // Retorna al menos 0 años
        } catch (error) {
            log.error('Error calculando años de servicio', {
                hireDate: hireDate,
                currentDate: currentDate,
                error: error
            });
            return 0;
        }
    }

    return {
        execute: execute
    };
    
}); 