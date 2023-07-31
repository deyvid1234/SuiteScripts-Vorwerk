/*
- Script name: nso_vorw_salesorder_massupdate_m.js
- Name: NSO VW | SalesOrder MassUpdate MapReduce
- Description: Deletes selected customs records between seted dates
- Author: Cesar Hernandez
- Language: Javascript
- July/26/2017
*/

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

define(['N/record', 'N/runtime', 'N/search', 'N/format'],
	function (record, runtime, search, format){

		function getInputData(){

			var recordType = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_mu_recordtype'});
			var massiveId = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_mu_massiveid'});
			var startDate = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_mu_startdate'});
			var endDate = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_mu_enddate'});
			log.debug('startDate', startDate);
			log.debug('endDate', endDate);

			if(recordType == 'customrecord_comisiones_gtm'){
				return [];
			}else if(recordType == 'customrecord_comisiones_jdg'){
				var jerarquia = 3;
			}else if(recordType == 'customrecord_comisiones_pre'){
				var jerarquia = 1;
			}

			var recordIds = [];
			var searchRes = search.create({
		        type: 'salesorder',
		        filters: [ ['custbody_jerarquia', 'anyof', jerarquia],
							'AND', ['trandate', 'within', [startDate, endDate]],
							'AND', ['mainline', 'is', 'T'] ]
		    }).run().each(function ( result ){
		        recordIds.push(result.id);
		        return true;
		    });

			log.debug('recordIds', recordIds);

			record.submitFields({ type: 'customrecord_nso_vorw_so_massupdate', id: massiveId,
				values: { custrecord_mu_recordstoupdate: recordIds.length }
			});

			return recordIds;
		}

		function map(context){

			var salesId = JSON.parse(context.value);
			log.debug('MAP', 'salesId: ' + salesId);

			var salesOrder = record.load({type: 'salesorder', id: salesId});

			var employee = salesOrder.getValue({fieldId: 'salesrep'});
			salesOrder.save();

			log.debug('MAP END: ' + salesId, 'Sales Rep: ' + employee);
			context.write(salesId);
			return ;

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
			var massiveId = runtime.getCurrentScript().getParameter({name:'custscript_nso_vorw_mu_massiveid'});
			record.submitFields({ type: 'customrecord_nso_vorw_so_massupdate', id: massiveId,
				values: { custrecord_mu_udates: mapKeys.length, custrecord_mu_status: 'TERMINADO' }
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
        summarize: summarize
    }
});
