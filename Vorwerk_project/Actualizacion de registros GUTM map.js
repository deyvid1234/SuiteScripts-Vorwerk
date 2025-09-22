/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/log', 'N/record'],
function(search, log, record) {
    
    /**
     * Función que obtiene los datos de entrada para el script Map Reduce
     * Carga la búsqueda personalizada customsearch2411
     * 
     * @returns {Array|Object} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        try {
            log.audit('getInputData', 'Iniciando carga de búsqueda customsearch2411');
            
            // Cargar la búsqueda personalizada customsearch2411
            var busqueda = search.load({
                id: 'customsearch2411'
            });
            
            log.audit('getInputData', 'Búsqueda customsearch2411 cargada exitosamente');
            
            return busqueda;
            
        } catch (error) {
            log.error('getInputData - Error', 'Error al cargar la búsqueda customsearch2411: ' + error.message);
            throw error;
        }
    }
    
    /**
     * Función Map que procesa cada resultado de la búsqueda
     * Carga employee y obtiene registro GUTM correspondiente
     * 
     * @param {MapSummary} context
     * @since 2015.1
     */
    function map(context) {
        try {
            log.debug('context', context)
            // Obtener el resultado del contexto
            var searchResult = JSON.parse(context.value);
            var values = searchResult.values;
            
            // Extraer valores importantes de la búsqueda
            // Función auxiliar para extraer valor real de objetos NetSuite
            function extractValue(fieldValue) {
                if (!fieldValue) return null;
                if (typeof fieldValue === 'string' || typeof fieldValue === 'number') return fieldValue;
                if (typeof fieldValue === 'object') {
                    // Si es un objeto, intentar extraer el valor
                    if (fieldValue.value !== undefined) return fieldValue.value;
                    if (fieldValue.id !== undefined) return fieldValue.id;
                    if (Array.isArray(fieldValue) && fieldValue.length > 0) return fieldValue[0];
                }
                return fieldValue;
            }
            
            var entityIdRaw = values['GROUP(internalid)'];
            var gutmRecordIdRaw = values['MIN(internalid.CUSTRECORD_PRESENTADOR_ID)'];
            
            var entityId = extractValue(entityIdRaw);
            var gutmRecordId = extractValue(gutmRecordIdRaw);
            
            // Log para debug de valores extraídos
            log.debug('map - Valores raw', 'EntityId raw: ' + JSON.stringify(entityIdRaw) + ', GUTM raw: ' + JSON.stringify(gutmRecordIdRaw));
            log.debug('map - Valores extraídos', 'EntityId: ' + entityId + ', GUTM ID: ' + gutmRecordId);
            
            if (!entityId || !gutmRecordId) {
                log.error('map - Datos faltantes', 'EntityId: ' + entityId + ', GUTM RecordId: ' + gutmRecordId);
                return;
            }
            
            log.audit('map - Procesando', 'EntityId: ' + entityId + ', GUTM ID: ' + gutmRecordId);
            
            // Variables para almacenar datos importantes
            var employeeData = null;
            var gutmData = null;
            
            // 1. Cargar el employee correspondiente al entityId
            try {
                // Validar que entityId es un número válido
                var numericEntityId = parseInt(entityId, 10);
                if (isNaN(numericEntityId) || numericEntityId <= 0) {
                    throw new Error('EntityId no es un número válido: ' + entityId);
                }
                
                log.debug('map - Cargando employee', 'ID validado: ' + numericEntityId);
                
                var employeeRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: numericEntityId
                });
                
                // Extraer datos importantes del employee
                employeeData = {
                    id: entityId,
                    name: employeeRecord.getValue('entityid') || '',
                    firstName: employeeRecord.getValue('firstname') || '',
                    lastName: employeeRecord.getValue('lastname') || '',
                    email: employeeRecord.getValue('email') || '',
                    custentity_fcha_inicio_eptm7: employeeRecord.getValue('custentity_fcha_inicio_eptm7') || '',
                    custentity_fcha_fin_eptm7: employeeRecord.getValue('custentity_fcha_fin_eptm7') || '',
                    custentity_estatus_eptm7: employeeRecord.getValue('custentity_estatus_eptm7') || '',
                    custentity_so_ganotm7: employeeRecord.getValue('custentity_so_ganotm7') || '',
                    custentity_fechatm7_ganada: employeeRecord.getValue('custentity_fechatm7_ganada') || '',
                    custentity_ovs_ep7: employeeRecord.getValue('custentity_ovs_ep7') || ''
                };
                
                log.audit('map - Employee cargado', 'ID: ' + entityId + ', Nombre: ' + employeeData.name);
                
            } catch (employeeError) {
                log.error('map - Error cargando employee', 
                         'ID: ' + entityId + 
                         ', Tipo ID: ' + typeof entityId + 
                         ', Error: ' + (employeeError.message || employeeError) + 
                         ', Stack: ' + (employeeError.stack || 'No stack'));
            }
            
            // 2. Cargar el registro GUTM usando el CUSTRECORD_PRESENTADOR_ID
            try {
                // Validar que gutmRecordId es un número válido
                var numericGutmId = parseInt(gutmRecordId, 10);
                if (isNaN(numericGutmId) || numericGutmId <= 0) {
                    throw new Error('GUTM RecordId no es un número válido: ' + gutmRecordId);
                }
                
                log.debug('map - Cargando GUTM', 'ID validado: ' + numericGutmId);
                
                var gutmRecord = record.load({
                    type: 'customrecord_gana_tm', // Ajustar el tipo de registro según corresponda
                    id: numericGutmId
                });
                
                // Obtener valores actuales del registro GUTM (antes de actualizar)
                gutmData = {
                    id: gutmRecordId,
                    presentadorId: gutmRecord.getValue('custrecord_presentador_id') || '',
                    startDate_before: gutmRecord.getValue('custrecord_start_date') || '',
                    endDate_before: gutmRecord.getValue('custrecord_end_date') || '',
                    statusProgram_before: gutmRecord.getValue('custrecord_status_program') || '',
                    idSoGanadora_before: gutmRecord.getValue('custrecord_id_so_gaadora') || '',
                    fechaTmGanadora_before: gutmRecord.getValue('custrecord_fecha_tm_ganadora') || '',
                    listIdsOdv_before: gutmRecord.getValue('custrecord_list_ids_odv') || ''
                };
                
                log.audit('map - GUTM cargado', 'ID: ' + gutmRecordId + ', Presentador: ' + gutmData.presentadorId);
                
                // 3. Actualizar registro GUTM con datos del employee (solo si tenemos employeeData)
                if (employeeData) {
                    log.audit('map - Iniciando actualización GUTM', 'ID: ' + gutmRecordId);
                    
                    // Mapeo de campos de employee a GUTM
                    var updateValues = {};
                    var hasChanges = false;
                    
                    // custentity_fcha_inicio_eptm7 -> custrecord_start_date
                    if (employeeData.custentity_fcha_inicio_eptm7) {
                        updateValues['custrecord_start_date'] = employeeData.custentity_fcha_inicio_eptm7;
                        hasChanges = true;
                    }
                    
                    // custentity_fcha_fin_eptm7 -> custrecord_end_date
                    if (employeeData.custentity_fcha_fin_eptm7) {
                        updateValues['custrecord_end_date'] = employeeData.custentity_fcha_fin_eptm7;
                        hasChanges = true;
                    }
                    
                    // custentity_estatus_eptm7 -> custrecord_status_program
                    if (employeeData.custentity_estatus_eptm7) {
                        updateValues['custrecord_status_program'] = employeeData.custentity_estatus_eptm7;
                        hasChanges = true;
                    }
                    
                    // custentity_so_ganotm7 -> custrecord_id_so_gaadora
                    if (employeeData.custentity_so_ganotm7) {
                        updateValues['custrecord_id_so_gaadora'] = employeeData.custentity_so_ganotm7;
                        hasChanges = true;
                    }
                    
                    // custentity_fechatm7_ganada -> custrecord_fecha_tm_ganadora
                    if (employeeData.custentity_fechatm7_ganada) {
                        updateValues['custrecord_fecha_tm_ganadora'] = employeeData.custentity_fechatm7_ganada;
                        hasChanges = true;
                    }
                    
                    // custentity_ovs_ep7 -> custrecord_list_ids_odv
                    if (employeeData.custentity_ovs_ep7) {
                        updateValues['custrecord_list_ids_odv'] = employeeData.custentity_ovs_ep7;
                        hasChanges = true;
                    }
                    
                    // Solo actualizar si hay cambios
                    if (hasChanges) {
                        // Aplicar las actualizaciones al registro
                       /* for (var field in updateValues) {
                            if (updateValues.hasOwnProperty(field)) {
                                gutmRecord.setValue({
                                    fieldId: field,
                                    value: updateValues[field]
                                });
                            }
                        }
                        
                        // Guardar el registro actualizado
                        var savedRecordId = gutmRecord.save();*/
                        
                        log.audit('map - GUTM SIMULACIÓN (sin guardar)', 
                                 'ID: ' + gutmRecordId + ', Campos que se actualizarían: ' + JSON.stringify(updateValues, null, 2));
                        
                        // Guardar valores después de la actualización
                        gutmData.startDate_after = updateValues['custrecord_start_date'] || gutmData.startDate_before;
                        gutmData.endDate_after = updateValues['custrecord_end_date'] || gutmData.endDate_before;
                        gutmData.statusProgram_after = updateValues['custrecord_status_program'] || gutmData.statusProgram_before;
                        gutmData.idSoGanadora_after = updateValues['custrecord_id_so_gaadora'] || gutmData.idSoGanadora_before;
                        gutmData.fechaTmGanadora_after = updateValues['custrecord_fecha_tm_ganadora'] || gutmData.fechaTmGanadora_before;
                        gutmData.listIdsOdv_after = updateValues['custrecord_list_ids_odv'] || gutmData.listIdsOdv_before;
                        
                    } else {
                        log.audit('map - Sin cambios en GUTM', 'ID: ' + gutmRecordId + ' - No hay datos del employee para actualizar');
                    }
                }
                
            } catch (gutmError) {
                log.error('map - Error cargando/actualizando GUTM', 
                         'ID: ' + gutmRecordId + 
                         ', Tipo ID: ' + typeof gutmRecordId + 
                         ', Error: ' + (gutmError.message || gutmError) + 
                         ', Stack: ' + (gutmError.stack || 'No stack'));
            }
            
            // 4. Almacenar los valores en una estructura organizada
            var resultData = {
                searchResultId: searchResult.id,
                entityId: entityId,
                gutmRecordId: gutmRecordId,
                employeeData: employeeData,
                gutmData: gutmData,
                timestamp: new Date()
            };
            
            // Log final con los datos organizados y resultado de la actualización
            log.audit('map - RESULTADO FINAL', JSON.stringify(resultData, null, 2));
            
        } catch (error) {
            log.error('map - Error general', 'Error: ' + error.message);
        }
    }
    
    /**
     * Función Reduce (opcional)
     * 
     * @param {ReduceSummary} context
     * @since 2015.1
     */
    function reduce(context) {
        // No se requiere procesamiento en reduce para este caso
        log.debug('reduce', 'Función reduce ejecutada para key: ' + context.key);
    }
    
    /**
     * Función Summarize que se ejecuta al final del proceso
     * 
     * @param {Summary} summary
     * @since 2015.1
     */
    function summarize(summary) {
        try {
            log.audit('summarize - Inicio', 'Procesamiento completado');
            log.audit('summarize - Input Stage', 'Duración: ' + summary.inputSummary.seconds + ' segundos, Error: ' + (summary.inputSummary.error || 'Ninguno'));
            log.audit('summarize - Map Stage', 'Duración: ' + summary.mapSummary.seconds + ' segundos, Error: ' + (summary.mapSummary.error || 'Ninguno'));
            log.audit('summarize - Reduce Stage', 'Duración: ' + summary.reduceSummary.seconds + ' segundos, Error: ' + (summary.reduceSummary.error || 'Ninguno'));
            
            // Log de errores si los hay
            if (summary.inputSummary.error) {
                log.error('summarize - Error Input', summary.inputSummary.error);
            }
            
            summary.mapSummary.errors.iterator().each(function(key, error) {
                log.error('summarize - Error Map', 'Key: ' + key + ', Error: ' + error);
                return true;
            });
            
            summary.reduceSummary.errors.iterator().each(function(key, error) {
                log.error('summarize - Error Reduce', 'Key: ' + key + ', Error: ' + error);
                return true;
            });
            
            log.audit('summarize - Fin', 'Script Map Reduce completado exitosamente');
            
        } catch (error) {
            log.error('summarize - Error', 'Error en función summarize: ' + error.message);
        }
    }
    
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
