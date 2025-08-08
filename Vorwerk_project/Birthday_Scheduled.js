/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @description Script programado que asigna el valr de cumpleaños a partir del curp o rfc
 */
define(['N/search', 'N/format', 'N/runtime', 'N/record'],

    function(search, format, runtime, record) {
        
        /**
         * Defines the Scheduled script trigger point.
         *
         * @param {Object} context
         * @param {string} context.type - The context in which the script is executed
         * @since 2015.2
         */
        function execute(context) {
            try {
                log.debug('execute');
                
                // Obtener la fecha actual
                var today = new Date();
                var currentMonth = today.getMonth() + 1; // getMonth() retorna 0-11
                var currentDay = today.getDate();
                
                log.debug('Fecha actual', 'Mes: ' + currentMonth + ', Dia: ' + currentDay);
                
                // Cargar la busqueda guardada
                var employeeSearch = search.load({
                    id: 'customsearch_curp_rfc'
                });
                
                log.debug('Busqueda cargada', 'customsearch_curp_rfc');
                
                // Ejecutar la busqueda y procesar cada empleado
                var searchResult = employeeSearch.run();
                
                searchResult.each(function(result) {
                    var employeeId = result.getValue('internalid');
                    var firstName = result.getValue('firstname') || '';
                    var lastName = result.getValue('lastname') || '';
                    var employeeName = (firstName + ' ' + lastName).trim() || 'Empleado ID: ' + employeeId;
                    var employeeEmail = result.getValue('email');
                    var curp = result.getValue('custentity_curp');
                    var rfc = result.getValue('custentity_rfc');
                    var hiredate = result.getValue('hiredate');
                    
                    // Extraer fecha de cumpleanos del CURP o RFC
                    var birthdayDateString = extractBirthdayFromCurpOrRfc(curp, rfc);
                    
                    log.debug('Empleado encontrado', {
                        id: employeeId,
                        name: employeeName,
                        firstName: firstName,
                        lastName: lastName,
                        email: employeeEmail,
                        curp: curp,
                        rfc: rfc,
                        hiredate: hiredate,
                        birthdayDateString: birthdayDateString
                    });
                    
                    // Actualizar el campo custentity_cumpleanios_dev con la fecha calculada
                    if (birthdayDateString) {
                        updateEmployeeBirthdayField(employeeId, birthdayDateString, employeeName, hiredate);
                    }
                    
                    return true;
                });
                
                log.debug('Procesamiento completado', 'Todos los empleados procesados');
                
            } catch (error) {
                log.error('Error en script programado de cumpleanos', error);
            }
        }
    
        /**
         * Extrae la fecha de cumpleanos del CURP o RFC
         * @param {string} curp - CURP del empleado
         * @param {string} rfc - RFC del empleado
         * @return {string|null} - Fecha de cumpleanos en formato DD/MM/YYYY o null si no se puede extraer
         */
        function extractBirthdayFromCurpOrRfc(curp, rfc) {
            try {
                var dateString = '';
                
                // Intentar extraer del CURP primero (posiciones 4-9: AAMMDD)
                if (curp && curp.length >= 10) {
                    var curpYear = curp.substring(4, 6);
                    var curpMonth = curp.substring(6, 8);
                    var curpDay = curp.substring(8, 10);
                    
                    // Validar que sean numeros
                    if (!isNaN(curpYear) && !isNaN(curpMonth) && !isNaN(curpDay)) {
                        // Determinar el siglo (si es menor a 50, es 20xx, si es mayor o igual a 50, es 19xx)
                        var fullYear = parseInt(curpYear) < 50 ? '20' + curpYear : '19' + curpYear;
                        // Formato D/M/YYYY (sin ceros a la izquierda)
                        dateString = parseInt(curpDay, 10) + '/' + parseInt(curpMonth, 10) + '/' + fullYear;
                        
                        log.debug('Fecha extraida del CURP', {
                            curp: curp,
                            curpYear: curpYear,
                            curpMonth: curpMonth,
                            curpDay: curpDay,
                            fullYear: fullYear,
                            dateString: dateString
                        });
                    } else {
                        log.debug('CURP contiene caracteres no numericos en posiciones de fecha', {
                            curp: curp,
                            curpYear: curpYear,
                            curpMonth: curpMonth,
                            curpDay: curpDay
                        });
                    }
                }
                
                // Si no se pudo extraer del CURP, intentar con RFC (posiciones 4-9: AAMMDD)
                if (!dateString && rfc && rfc.length >= 10) {
                    var rfcYear = rfc.substring(4, 6);
                    var rfcMonth = rfc.substring(6, 8);
                    var rfcDay = rfc.substring(8, 10);
                    
                    // Validar que sean numeros
                    if (!isNaN(rfcYear) && !isNaN(rfcMonth) && !isNaN(rfcDay)) {
                        // Determinar el siglo (si es menor a 50, es 20xx, si es mayor o igual a 50, es 19xx)
                        var fullYear = parseInt(rfcYear) < 50 ? '20' + rfcYear : '19' + rfcYear;
                        // Formato D/M/YYYY (sin ceros a la izquierda)
                        dateString = parseInt(rfcDay, 10) + '/' + parseInt(rfcMonth, 10) + '/' + fullYear;
                        
                        log.debug('Fecha extraida del RFC', {
                            rfc: rfc,
                            rfcYear: rfcYear,
                            rfcMonth: rfcMonth,
                            rfcDay: rfcDay,
                            fullYear: fullYear,
                            dateString: dateString
                        });
                    } else {
                        log.debug('RFC contiene caracteres no numericos en posiciones de fecha', {
                            rfc: rfc,
                            rfcYear: rfcYear,
                            rfcMonth: rfcMonth,
                            rfcDay: rfcDay
                        });
                    }
                }
                
                // Validar que se obtuvo una fecha
                if (dateString) {
                    // Validar que el mes esté entre 1-12 y el día entre 1-31
                    var parts = dateString.split('/');
                    var day = parseInt(parts[0], 10);
                    var month = parseInt(parts[1], 10);
                    var year = parseInt(parts[2], 10);
                    
                    log.debug('Validando fecha extraida', {
                        dateString: dateString,
                        parts: parts,
                        day: day,
                        month: month,
                        year: year,
                        isDayValid: !isNaN(day),
                        isMonthValid: !isNaN(month),
                        isYearValid: !isNaN(year)
                    });
                    
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
                        month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                        log.debug('Fecha de cumpleanos valida extraida', {
                            dateString: dateString,
                            day: day,
                            month: month,
                            year: year
                        });
                        return dateString;
                    } else {
                        log.debug('Fecha extraida con mes/dia invalido', {
                            dateString: dateString,
                            day: day,
                            month: month,
                            year: year,
                            isDayValid: !isNaN(day),
                            isMonthValid: !isNaN(month),
                            isYearValid: !isNaN(year)
                        });
                        // Reset dateString para que no se considere como extraida exitosamente
                        dateString = '';
                    }
                }
                
                // Solo mostrar este log si no se pudo extraer ninguna fecha
                if (!dateString) {
                    log.debug('No se pudo extraer fecha de cumpleanos', {
                        curp: curp,
                        rfc: rfc
                    });
                }
                
                return null;
                
            } catch (error) {
                log.error('Error extrayendo fecha de cumpleanos', {
                    curp: curp,
                    rfc: rfc,
                    error: error
                });
                return null;
            }
        }
    
        /**
         * Actualiza el campo custentity_cumpleanios_dev del empleado
         * @param {number} employeeId - ID del empleado
         * @param {string} birthdayDateString - Fecha de cumpleanos en formato D/M/YYYY
         * @param {string} employeeName - Nombre del empleado
         * @param {string} hiredate - Fecha de contratación del empleado
         */
        function updateEmployeeBirthdayField(employeeId, birthdayDateString, employeeName, hiredate) {
            try {
                log.debug('Actualizando campo de cumpleanos', {
                    employeeId: employeeId,
                    employeeName: employeeName,
                    birthdayDateString: birthdayDateString,
                    hiredate: hiredate
                });
                
                // Convertir el string de fecha a objeto Date usando N/format
                var birthdayDate = format.parse({
                    value: birthdayDateString,
                    type: format.Type.DATE
                });
                
                log.debug('Fecha convertida', {
                    originalString: birthdayDateString,
                    convertedDate: birthdayDate
                });
                
                // Extraer el mes de la fecha de cumpleaños
                var birthMonth = birthdayDate.getMonth() + 1; // getMonth() retorna 0-11, sumamos 1 para obtener 1-12
                
                log.debug('Mes de cumpleaños extraído', {
                    birthMonth: birthMonth,
                    employeeName: employeeName
                });
                
                // Preparar los valores a actualizar
                var updateValues = {
                    'custentity_cumpleanios_dev': birthdayDate,
                    'custentity_mes_cumpleanios': parseInt(birthMonth)
                };
                
                // Si hay fecha de contratación, extraer el mes y agregarlo a los valores
                if (hiredate) {
                    var hireDateObj = format.parse({
                        value: hiredate,
                        type: format.Type.DATE
                    });
                    
                    var hireMonth = hireDateObj.getMonth() + 1; // getMonth() retorna 0-11, sumamos 1 para obtener 1-12
                    
                    log.debug('Mes de contratación extraído', {
                        hiredate: hiredate,
                        hireDateObj: hireDateObj,
                        hireMonth: hireMonth,
                        employeeName: employeeName
                    });
                    
                    updateValues['custentitymes_hiredate'] = parseInt(hireMonth);
                }
                
                // Actualizar los campos usando submitFields
                var recordId = record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: employeeId,
                    values: updateValues
                });
                
                log.debug('Campos de cumpleanos y contratación actualizados exitosamente', {
                    employeeId: employeeId,
                    employeeName: employeeName,
                    newBirthdayValue: birthdayDate,
                    newMonthValue: birthMonth,
                    newHireMonthValue: hiredate ? updateValues['custentitymes_hiredate'] : 'No disponible',
                    recordId: recordId
                });
                
            } catch (error) {
                log.error('Error actualizando campos de cumpleanos y contratación', {
                    employeeId: employeeId,
                    employeeName: employeeName,
                    birthdayDateString: birthdayDateString,
                    hiredate: hiredate,
                    error: error
                });
            }
        }
    
        return {
            execute: execute
        };
        
    }); 