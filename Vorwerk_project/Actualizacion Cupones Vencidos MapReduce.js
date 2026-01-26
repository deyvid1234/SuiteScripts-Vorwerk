/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/search', 'N/runtime', 'N/format'],

function(email, record, search, runtime, format) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     * Busca cupones con fecha de vigencia igual a ayer
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        try {
            // Calcular la fecha de ayer
            var today = new Date();
            var yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            // Formatear la fecha de ayer para la búsqueda
            var fDateYesterday = format.format({
                value: yesterday,
                type: format.Type.DATE
            });
            
            log.debug('Buscando cupones con fecha de vigencia', fDateYesterday);
            
            // Buscar cupones con fecha de vigencia igual a ayer
            var cuponSearch = search.create({
                type: 'customrecord_cupones',
                columns: ['internalid', 'name', 'custrecord_fecha_vigencia'],
                filters: [
                    ['custrecord_fecha_vigencia', 'on', fDateYesterday]
                ]
            });
            
            // Convertir los resultados del search en un array de objetos
            var cuponesArray = [];
            cuponSearch.run().each(function(result) {
                cuponesArray.push({
                    id: result.id,
                    name: result.getValue('name'),
                    fechaVigencia: result.getValue('custrecord_fecha_vigencia')
                });
                return true;
            });
            
            log.debug('Cupones encontrados para actualizar', cuponesArray.length);
            
            return cuponesArray;
        } catch (e) {
            log.error('Error en getInputData', e);
            return [];
        }
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     * Actualiza cada cupón a status 3 (vencido)
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        try {
            var cuponData = JSON.parse(context.value);
            var cuponId = cuponData.id;
            
            log.debug('Actualizando cupón', 'ID: ' + cuponId + ', Name: ' + cuponData.name);
            
            // Actualizar el estado del cupón a 3 (vencido)
            record.submitFields({
                type: 'customrecord_cupones',
                id: cuponId,
                values: {
                    'custrecord_status_cupon': 3
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            
            log.debug('Cupón actualizado exitosamente', 'ID: ' + cuponId);
            
        } catch (e) {
            log.error('Error en map al actualizar cupón', e);
        }
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        // No se requiere lógica en reduce para este script
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     * Busca cupones disponibles (status = 1) y envía alerta si son <= 15
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        try {
            log.debug('Iniciando summarize', 'Procesando resultados');
            
            var inputSummary = summary.inputSummary;
            var mapSummary = summary.mapSummary;
            
            log.debug('Cupones procesados', 'Total procesados en esta ejecución');
            
            // Buscar cupones con status = 1 (disponibles)
            var today = new Date();
            var fDateToday = format.format({
                value: today,
                type: format.Type.DATE
            });
            
            var cuponesDisponiblesSearch = search.create({
                type: 'customrecord_cupones',
                columns: ['internalid'],
                filters: [
                    ['custrecord_status_cupon', 'anyof', 1]
                ]
            });
            
            var cantidadCupones = 0;
            cuponesDisponiblesSearch.run().each(function(result) {
                cantidadCupones++;
                return true;
            });
            
            log.debug('Cupones disponibles', 'Cantidad: ' + cantidadCupones);
            
            // Si hay 15 o menos cupones disponibles, enviar alerta
            if (cantidadCupones <= 20) {
                
                var emailBody = 'Se le informa que actualmente quedan ' + cantidadCupones + ' cupones disponibles (status = 1).\n\n';
                emailBody += 'Es necesario crear más cupones pronto para evitar quedarse sin inventario.\n\n';
                emailBody += 'Por favor, tome las acciones necesarias.\n\n';
                emailBody += 'Este es un mensaje automático del sistema.';
                
                email.send({
                    author: 344096,
                    recipients: 'griselrdz@gmail.com',
                    subject: 'Alerta: Cupones Disponibles Bajo Mínimo',
                    body: emailBody
                });
                
                log.debug('Email de alerta enviado', 'Cantidad de cupones: ' + cantidadCupones);
            } else {
                log.debug('No se envía alerta', 'Cupones disponibles: ' + cantidadCupones + ' (mayor a 15)');
            }
            
        } catch (e) {
            log.error('Error en summarize', e);
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});

