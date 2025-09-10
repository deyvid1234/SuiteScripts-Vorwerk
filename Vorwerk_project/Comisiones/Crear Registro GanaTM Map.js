/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record', 'N/log'], function(search, record, log) {
    
    /**
     * Función getInputData - Carga la búsqueda personalizada
     */
    function getInputData(context) {
        try {
            log.audit('getInputData', 'Iniciando carga de búsqueda customsearch_nuevos_registros_ganatm');
            
            // Cargar la búsqueda personalizada
            var customSearch = search.load({
                id: 'customsearch_nuevos_registros_ganatm'
            });
            
            log.audit('getInputData', 'Búsqueda cargada exitosamente');
            return customSearch;
            
        } catch (e) {
            log.error('getInputData Error', 'Error al cargar la búsqueda: ' + e.message);
            throw e;
        }
    }
    
    /**
     * Función map - Procesa cada resultado de la búsqueda
     */
    function map(context) {
        try {
            var searchResult = JSON.parse(context.value);
            log.audit('map', 'Procesando registro con ID: ' + searchResult.id);
            
            // Extraer los valores de los campos de la búsqueda
            var internalId = searchResult.id;
            var checkboxEptm7 = searchResult.values.custentity_checkbox_eptm7;
            var fechaInicioEptm7 = searchResult.values.custentity_fcha_inicio_eptm7;
            var fechaFinEptm7 = searchResult.values.custentity_fcha_fin_eptm7;
            var estatusEptm7 = searchResult.values.custentity_estatus_eptm7;
            var soGanotm7 = searchResult.values.custentity_so_ganotm7;
            var fechaTm7Ganada = searchResult.values.custentity_fechatm7_ganada;
            var ovsEp7 = searchResult.values.custentity_ovs_ep7;
            
            // Crear el nuevo registro de tipo customrecord_gana_tm
            var newRecord = record.create({
                type: 'customrecord_gana_tm'
            });
            
            // Mapear los campos según la especificación
            // name = internalid
            newRecord.setValue({
                fieldId: 'custrecord_presentador_id',
                value: internalId
            });
            
            // custrecord_start_date = custentity_fcha_inicio_eptm7
            if (fechaInicioEptm7) {
                newRecord.setValue({
                    fieldId: 'custrecord_start_date',
                    value: fechaInicioEptm7
                });
            }
            
            // custrecord_end_date = custentity_fcha_fin_eptm7
            if (fechaFinEptm7) {
                newRecord.setValue({
                    fieldId: 'custrecord_end_date',
                    value: fechaFinEptm7
                });
            }
            
            // custrecord_status_program = custentity_estatus_eptm7
            if (estatusEptm7) {
                newRecord.setValue({
                    fieldId: 'custrecord_status_program',
                    value: estatusEptm7
                });
            }
            
            // custrecord_id_so_gaadora = custentity_so_ganotm7
            if (soGanotm7) {
                newRecord.setValue({
                    fieldId: 'custrecord_id_so_gaadora',
                    value: soGanotm7
                });
            }
            
            // custrecord_fecha_tm_ganadora = custentity_fechatm7_ganada
            if (fechaTm7Ganada) {
                newRecord.setValue({
                    fieldId: 'custrecord_fecha_tm_ganadora',
                    value: fechaTm7Ganada
                });
            }
            
            // custrecord_list_ids_odv = custentity_ovs_ep7
            if (ovsEp7) {
                newRecord.setValue({
                    fieldId: 'custrecord_list_ids_odv',
                    value: ovsEp7
                });
            }
            
            // custrecord_presentador_id = custentity_checkbox_eptm7
            if (checkboxEptm7) {
                newRecord.setValue({
                    fieldId: 'name',
                    value: 'Earning Progran TM7 '
                });
            }
            
            // Guardar el registro
            var recordId = newRecord.save();
            
            log.audit('map', 'Registro creado exitosamente con ID: ' + recordId + ' para internalId: ' + internalId);
            
            // Retornar información del registro creado
            context.write({
                key: internalId,
                value: {
                    originalId: internalId,
                    newRecordId: recordId,
                    status: 'success'
                }
            });
            
        } catch (e) {
            log.error('map Error', 'Error al procesar registro: ' + e.message);
            
            // Retornar información del error
            context.write({
                key: searchResult.id || 'unknown',
                value: {
                    originalId: searchResult.id || 'unknown',
                    error: e.message,
                    status: 'error'
                }
            });
        }
    }
    
    /**
     * Función reduce - Agrupa los resultados (opcional, puede estar vacía)
     */
    function reduce(context) {
        // Esta función puede estar vacía si no necesitas agrupar resultados
        log.audit('reduce', 'Procesando grupo de resultados');
    }
    
    /**
     * Función summarize - Resumen final del proceso
     */
    function summarize(context) {
        try {
            log.audit('summarize', 'Iniciando resumen del proceso MapReduce');
            
            var totalProcessed = 0;
            var totalSuccess = 0;
            var totalErrors = 0;
            var errors = [];
            
            // Procesar resultados exitosos
            context.output.iterator().each(function(key, value) {
                totalProcessed++;
                var result = JSON.parse(value);
                
                if (result.status === 'success') {
                    totalSuccess++;
                } else if (result.status === 'error') {
                    totalErrors++;
                    errors.push({
                        originalId: result.originalId,
                        error: result.error
                    });
                }
                
                return true;
            });
            
            // Procesar errores de mapeo
            context.mapSummary.errors.iterator().each(function(key, error) {
                totalErrors++;
                errors.push({
                    key: key,
                    error: error
                });
                return true;
            });
            
            // Log del resumen
            log.audit('summarize', '=== RESUMEN DEL PROCESO ===');
            log.audit('summarize', 'Total de registros procesados: ' + totalProcessed);
            log.audit('summarize', 'Registros creados exitosamente: ' + totalSuccess);
            log.audit('summarize', 'Errores encontrados: ' + totalErrors);
            
            if (errors.length > 0) {
                log.error('summarize', 'Errores detallados: ' + JSON.stringify(errors));
            }
            
            log.audit('summarize', 'Proceso MapReduce completado');
            
        } catch (e) {
            log.error('summarize Error', 'Error en el resumen: ' + e.message);
        }
    }
    
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
