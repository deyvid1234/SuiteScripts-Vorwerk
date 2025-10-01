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
            log.debug('context', context);
            
            // Parsear el JSON del value
            var searchResult = JSON.parse(context.value);
            var employeeId = searchResult.values["GROUP(internalid)"].value;
            var customRecordId = searchResult.values["MIN(internalid.CUSTRECORD_PRESENTADOR_ID)"];
            
            log.debug('Datos extraidos', {
                employeeId: employeeId,
                customRecordId: customRecordId
            });
            
            if (!employeeId) {
                log.error('map - Employee ID faltante', 'Employee ID: ' + employeeId);
                return;
            }
            
            // Cargar el registro del empleado
            var employeeRecord = record.load({
                type: record.Type.EMPLOYEE,
                id: employeeId
            });
            
            log.debug('Employee cargado', 'Employee ID: ' + employeeId);
            
            var customRecord;
            var isNewRecord = false;
            
            // Verificar si existe un registro custom o si debe crearse uno nuevo
            if (!customRecordId || customRecordId === '' || customRecordId === null) {
                // Crear nuevo registro custom GUTM
                customRecord = record.create({
                    type: 'customrecord_gana_tm'
                });
                isNewRecord = true;
                log.debug('Creando nuevo Custom Record', 'Employee ID: ' + employeeId);
            } else {
                // Cargar el registro custom GUTM existente
                customRecord = record.load({
                    type: 'customrecord_gana_tm',
                    id: customRecordId
                });
                log.debug('Custom Record cargado', 'Custom Record ID: ' + customRecordId);
            }
            
            // Mapear campos del employee al registro custom
            var fieldsToUpdate = {};
            
            // Mapeo de campos
            var fieldMapping = {
                'custrecord_start_date':'custentity_fcha_inicio_eptm7',
                'custrecord_end_date':'custentity_fcha_fin_eptm7',
                'custrecord_status_program':'custentity_estatus_eptm7',
                'custrecord_id_so_gaadora':'custentity_so_ganotm7',
                'custrecord_fecha_tm_ganadora':'custentity_fechatm7_ganada',
                'custrecord_list_ids_odv':'custentity_ovs_ep7',
                'custrecord_numero_ventas':'custentity_num_ventas_gutm'
            };
            
            // Actualizar campos del registro custom con valores del employee
            for (var customField in fieldMapping) {
                var employeeField = fieldMapping[customField];
                var employeeValue = employeeRecord.getValue(employeeField);
                
                if (employeeValue !== null && employeeValue !== undefined && employeeValue !== '') {
                    customRecord.setValue({
                        fieldId: customField,
                        value: employeeValue
                    });
                    fieldsToUpdate[customField] = employeeValue;
                    log.debug('Campo actualizado', employeeField + ' -> ' + customField + ': ' + employeeValue);
                }
            }
            
            // Asegurar que el presentador esté correctamente asignado
            customRecord.setValue({
                fieldId: 'custrecord_presentador_id',
                value: employeeId
            });
            fieldsToUpdate['custrecord_presentador_id'] = employeeId;
            
            // Guardar el registro custom
            var savedRecordId = customRecord.save();
            
            log.audit(isNewRecord ? 'Registro creado exitosamente' : 'Registro actualizado exitosamente', {
                customRecordId: savedRecordId,
                employeeId: employeeId,
                isNewRecord: isNewRecord,
                fieldsUpdated: fieldsToUpdate
            });
            
        } catch (error) {
            log.error('map - Error general', {
                error: error.message,
                employeeId: employeeId || 'N/A',
                customRecordId: customRecordId || 'N/A'
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
        
    }
    
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
