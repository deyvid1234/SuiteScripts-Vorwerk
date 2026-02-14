/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log'],
    function(record, search, runtime, log) {

        // Variable global para mantener el contador de tranid consecutivos
        var tranidCounter = 4252; // Empezamos en 3918 para que el primer sea 3919
        var foundStartingRecord = false;

        /**
         * Obtiene los datos de entrada para el proceso Map/Reduce
         * @return {Object} búsqueda guardada o array de objetos
         */
        function getInputData() {
            try {
                // Cargar la búsqueda guardada customsearch2429
                var customSearch = search.load({
                    id: 'customsearch2429'
                });

                log.audit({
                    title: 'Búsqueda cargada',
                    details: 'Cargando customsearch2429'
                });

                return customSearch;
            } catch (e) {
                log.error({
                    title: 'Error en getInputData',
                    details: e.toString()
                });
            }
        }

        /**
         * Procesa cada registro de la búsqueda
         * @param {Object} context
         */
        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);
                var currentid = searchResult.values['MAX(internalid)'];
                               

                log.audit({
                    title: 'Procesando registro',
                    details: 'Record ID: ' + currentid
                });
                
               
                var currenttranid = searchResult.values['GROUP(tranid)'];
                
                log.debug({
                    title: 'id desde búsqueda',
                    details: 'id desde GROUP: ' + currentid
                });

                // Cargar el credit memo usando el internalId
                var creditMemoRecord = record.load({
                    type: record.Type.CREDIT_MEMO,
                    id: currentid,
                    isDynamic: false
                });
                var tranidRec = creditMemoRecord.getValue({
                    fieldId: 'tranid'
                });
               

                log.audit({
                    title: 'Credit Memo cargado',
                    details: 'Credit Memo ID: ' + currentid + ' cargado exitosamente'
                });

                // Generar nuevo tranid consecutivo (TL4342, TL4343, etc.)
                tranidCounter++;
                var newTranid = 'TL' + tranidCounter;
                //var newTranid = tranidRec + '-B';
                log.audit({
                    title: 'Nuevo tranid generado',
                    details: 'Tranid original: "' + currenttranid + '" -> Nuevo tranid: "' + newTranid + '" (contador: ' + tranidCounter + ')'
                });

                // Actualizar el campo tranid con el nuevo valor
                creditMemoRecord.setValue({
                    fieldId: 'tranid',
                    value: newTranid
                });

                log.audit({
                    title: 'Tranid actualizado',
                    details: 'Tranid actualizado de "' + currenttranid + '" a "' + newTranid + '"'
                });

                // Guardar el credit memo
                var savedCreditMemoId = creditMemoRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.audit({
                    title: 'Credit Memo guardado',
                    details: 'Credit Memo ID: ' + savedCreditMemoId + ' guardado exitosamente con tranid: ' + newTranid
                });

                

            } catch (e) {
                log.error({
                    title: 'Error en map',
                    details: 'Error procesando registro: ' + context.value + ' | Error: ' + e.toString()
                });
            }
        }

        /**
         * Consolida los resultados
         * @param {Object} context
         */
        function reduce(context) {
            return true;
        }

        /**
         * Resume final del proceso
         * @param {Object} summary
         */
        function summarize(summary) {
            return true;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });
