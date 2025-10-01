/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/log', 'N/record'],
function(search, log, record) {
    
    /**
     * Función que obtiene los datos de entrada para el script Map Reduce
     * Carga la búsqueda personalizada customsearch2417
     * 
     * @returns {Array|Object} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        try {
            log.audit('getInputData', 'Iniciando carga de búsqueda customsearch2417');
            
            // Cargar la búsqueda personalizada customsearch2417
            var busqueda = search.load({
                id: 'customsearch2417'
            });
            
            log.audit('getInputData', 'Búsqueda customsearch2417 cargada exitosamente');
            
            return busqueda;
            
        } catch (error) {
            log.error('getInputData - Error', 'Error al cargar la búsqueda customsearch2417: ' + error.message);
            throw error;
        }
    }
    
    /**
     * Función Map que procesa cada registro customrecord_gana_tm
     * Actualiza el employee correspondiente con los datos del registro custom
     * 
     * @param {MapSummary} context
     * @since 2015.1
     */
    function map(context) {
        var customRecordId, employeeId, presentadorId, presentadorInactivo;
        
        try {
            log.debug('context', context);
            
            // Parsear el JSON del value
            var searchResult = JSON.parse(context.value);
            customRecordId = searchResult.id;
            presentadorId = searchResult.values.custrecord_presentador_id;
            presentadorInactivo = searchResult.values.custrecord_presentador_inactivo;
            
            // Extraer solo el valor si viene como objeto
            if (presentadorId && typeof presentadorId === 'object' && presentadorId.value) {
                presentadorId = presentadorId.value;
            }
            if (presentadorInactivo && typeof presentadorInactivo === 'object' && presentadorInactivo.value) {
                presentadorInactivo = presentadorInactivo.value;
            }
            
            // Determinar qué ID de empleado usar
            employeeId = presentadorId;
            if (!presentadorId || presentadorId === '' || presentadorId === null) {
                employeeId = presentadorInactivo;
            }
            
            log.debug('Datos extraidos', {
                customRecordId: customRecordId,
                presentadorIdOriginal: searchResult.values.custrecord_presentador_id,
                presentadorInactivoOriginal: searchResult.values.custrecord_presentador_inactivo,
                presentadorIdExtracted: presentadorId,
                presentadorInactivoExtracted: presentadorInactivo,
                employeeIdFinal: employeeId
            });
            
            if (!employeeId || employeeId === '' || employeeId === null) {
                log.error('map - Employee ID faltante', {
                    customRecordId: customRecordId,
                    presentadorIdOriginal: searchResult.values.custrecord_presentador_id,
                    presentadorInactivoOriginal: searchResult.values.custrecord_presentador_inactivo,
                    presentadorIdExtracted: presentadorId,
                    presentadorInactivoExtracted: presentadorInactivo,
                    employeeIdFinal: employeeId
                });
                return;
            }
            
            // Cargar el registro custom GUTM
            var customRecord = record.load({
                type: 'customrecord_gana_tm',
                id: customRecordId
            });
            
            log.debug('Custom Record cargado', 'Custom Record ID: ' + customRecordId);
            
            log.debug('Iniciando actualización de Employee', 'Employee ID: ' + employeeId);
            
            // Mapear campos del custom record al employee
            var fieldsToUpdate = {};
            
            // Mapeo de campos (Custom Record → Employee)
            var fieldMapping = {
                'custrecord_start_date': 'custentity_fcha_inicio_eptm7',
                'custrecord_end_date': 'custentity_fcha_fin_eptm7',
                'custrecord_status_program': 'custentity_estatus_eptm7',
                'custrecord_id_so_gaadora': 'custentity_so_ganotm7',
                'custrecord_fecha_tm_ganadora': 'custentity_fechatm7_ganada',
                'custrecord_list_ids_odv': 'custentity_ovs_ep7',
                'custrecord_numero_ventas': 'custentity_num_ventas_gutm'
            };
            
            // Preparar campos para submitFields (solo los que tienen valores)
            for (var customField in fieldMapping) {
                var employeeField = fieldMapping[customField];
                var customValue = customRecord.getValue(customField);
                
                // Extraer solo el valor si viene como objeto (para campos de lista)
                if (customValue && typeof customValue === 'object' && customValue.value !== undefined) {
                    customValue = customValue.value;
                }
                
                if (customValue !== null && customValue !== undefined && customValue !== '') {
                    fieldsToUpdate[employeeField] = customValue;
                    log.debug('Campo preparado para actualizar', customField + ' -> ' + employeeField + ': ' + customValue);
                } else {
                    log.debug('Campo saltado (valor vacío)', customField + ' -> ' + employeeField + ': ' + customValue);
                }
            }
            
            // Usar submitFields para evitar User Events y Workflows
            if (Object.keys(fieldsToUpdate).length > 0) {
                var updatedEmployeeId = record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: employeeId,
                    values: fieldsToUpdate
                });
            } else {
                log.debug('No hay campos para actualizar', 'Employee ID: ' + employeeId);
                return;
            }
            
            log.audit('Employee actualizado exitosamente', {
                employeeId: updatedEmployeeId,
                customRecordId: customRecordId,
                fieldsUpdated: fieldsToUpdate
            });
            
        } catch (error) {
            log.error('map - Error general', {
                error: error,
                customRecordId: customRecordId || 'N/A',
                employeeId: employeeId || 'N/A'
            });
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
