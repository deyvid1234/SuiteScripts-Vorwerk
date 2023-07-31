/*
- Script name: nso_vorw_massivedeletion_m.js
- Name: NSO VW | Massive Deletion MapReduce
- Description: Deletes selected customs records between seted dates
- Author: Cesar Hernandez
- Language: Javascript
- July/24/2017
*/

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

define(['N/record', 'N/runtime', 'N/search', , 'N/format'],
	function (record, runtime, search, format){

		function getInputData(){

			var recordType = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_md_recordtype'});
			var massiveId = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_md_massiveid'});
			var startDate = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_md_startdate'});
			var endDate = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_md_enddate'});
			log.debug('startDate', startDate);
			log.debug('endDate', endDate);

			if(recordType == 'customrecord_comisiones_gtm'){
				var join = 'custrecord_gtm_det_factura';
				var colName = 'custrecord_gtm_det_comision_gtm_id';
			}else if(recordType == 'customrecord_comisiones_jdg'){
				var join = 'custrecord_jdg_det_factura';
				var colName = 'custrecord_jdg_det_comision_jdg_id';
			}else if(recordType == 'customrecord_comisiones_pre'){
				var join = 'custrecord_pre_det_factura';
				var colName = 'custrecord_pre_det_comision_pre_id';
			}

			var compSearch = search.create({
				type: recordType + '_det',
				columns: [ search.createColumn({ name: colName }) ],
				filters: [ {name: 'trandate', join: join, operator: 'within', values: [startDate, endDate]} ]
			});

			var resultSet = compSearch.run();

			log.debug('resultSet', resultSet);

			var resultsObj = {};
			var recordIds = [];
			resultSet.each(function ( result ){
				try{
					if(!resultsObj[result.id]){
						resultsObj[result.id] = result.id;
						var fathId = result.getValue({name: colName});
						recordIds.push({id: result.id, type: recordType, fathId: fathId});
					}
				}catch(ex){
					log.debug('Error', ex.message);
				}
				return true;
			});
			log.debug('recordIds', JSON.stringify(recordIds));

			record.submitFields({ type: 'customrecord_nso_vorw_massivedeletion', id: massiveId,
				values: { custrecord_md_recordstodelete: recordIds.length }
			});

			return recordIds;

		}

		function map(context){

			var mapValue = JSON.parse(context.value);
			log.debug('mapValue', mapValue);

			var recordType = mapValue.type + '_det';
			var recordId = mapValue.id;
			var fathId = mapValue.fathId;
			var fathType = mapValue.type;

			log.debug('recordType: ' + recordType, 'recordId: ' + recordId);
			var deletedId = record.delete({ type: 'customrecord_comisiones_pre_det', id: parseInt(recordId) });
			log.debug('deletedId', deletedId);

			context.write(fathId, fathType);
			return ;

		}

		function reduce(context){

				var recordId = JSON.parse(context.key);
				log.debug('REDUCE', 'recordId: ' + recordId);

				var recordType = context.values[0];
				log.debug('recordType', recordType);


				//Detaching associated sales orders
				if(recordType == 'customrecord_comisiones_jdg'){
					var name = 'custbody_comision_aplicada_jdg';
					var elegir_comision = 1;
				}else if(recordType == 'customrecord_comisiones_pre'){
					var name = 'custbody_comision_aplicada_pre';
					var elegir_comision = 2;
				}
				else if(recordType == 'customrecord_comisiones_gtm'){
					var deletedId = record.delete({ type: recordType, id: parseInt(recordId) });

					context.write(JSON.stringify(recordId));
				}

				var compSearch = search.create({
					type: 'salesorder',
					filters: [[name, 'anyof', recordId], 'AND', ['mainline', 'is', 'T']]
				}).run().each(function ( result ){
					if(recordType == 'customrecord_comisiones_jdg'){
						record.submitFields({ type: 'salesorder', id: result.id,
				            values: { custbody_comision_aplicada_jdg: null}
				        });
					}else if(recordType == 'customrecord_comisiones_pre'){
						record.submitFields({ type: 'salesorder', id: result.id,
				            values: { custbody_comision_aplicada_pre: null}
				        });
					}
					return true;
				});
				//End of Detach

				//Deleting Report record
				var compSearch = search.create({
					type: 'customrecord_imprimir_comosiones',
					filters: [ ['custrecord_elegir_comision', 'is', elegir_comision], 'AND', ['custrecord_enlace_detalle_id', 'contains', recordId] ]
				}).run().each(function ( result ){
					var impCompId = result.id;
					return false;
				});
				//End of report deletion


				var deletedId = record.delete({ type: recordType, id: parseInt(recordId) });

				if(impCompId){
					log.debug('Imprimir Comisiones PreDelete', deletedCompId);
					var deletedCompId = record.delete({ type: 'customrecord_imprimir_comosiones', id: impCompId });
					log.debug('Imprimir Comisiones deletedId', deletedCompId);
				}

				context.write(JSON.stringify(recordId));
		}

		function summarize(summary){
			log.debug("SUMMARIZE", "SUMMARIZE");
			log.debug('Summary Input', JSON.stringify(summary));

			var type = summary.toString();

			log.audit(type + ' Usage Consumed', summary.usage);
			log.audit(type + ' Number of Queues', summary.concurrency);
			log.audit(type + ' Number of Yields', summary.yields);

			//////////////////////////////////////////////////////////////////
			//InputData
			if (summary.inputSummary.error) {
				log.error('Input Summarize', summary.inputSummary.error);
			}
			//
			//////////////////////////////////////////////////////////////////

			//////////////////////////////////////////////////////////////////
			//Map
			var mapKeys = [ ];
			summary.mapSummary.keys.iterator().each(function (key) {
				mapKeys.push(key);
				return true;
			});
			log.debug('MAP KEYS', JSON.stringify(mapKeys));
			log.debug('TOTAL MAP KEYS', mapKeys.length);
			var massiveId = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_md_massiveid'});
			record.submitFields({ type: 'customrecord_nso_vorw_massivedeletion', id: massiveId,
				values: { custrecord_md_deletedrecords: mapKeys.length, custrecord_md_status: 'TERMINADO' }
			});


			var n_errores = 0;
			summary.mapSummary.errors.iterator().each(function(key, error) {
				log.error('Map Summarize', key + '->' + error);
				++n_errores;
				return true;
			});
			log.debug('Bumber of Errors', n_errores);
			//
			//////////////////////////////////////////////////////////////////


			//////////////////////////////////////////////////////////////////
			//Reduce
			summary.reduceSummary.errors.iterator().each(function(key, error) {
				log.error('Reduce Summarize', key + '->' + error);
				return true;
			});
			//
			//////////////////////////////////////////////////////////////////

			//////////////////////////////////////////////////////////////////
			//Summary
			var finalKeys = [ ];
			summary.output.iterator().each(function (key) {
				finalKeys.push(key);
				return true;
			});
			log.debug('FINAL KEYS', JSON.stringify(finalKeys));
			log.debug('TOTAL KEYS', finalKeys.length);
			//
			//////////////////////////////////////////////////////////////////


		}


    return {
        getInputData: getInputData,
        map: map,
		reduce: reduce,
        summarize: summarize
    }
});
