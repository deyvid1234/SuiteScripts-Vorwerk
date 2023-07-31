/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],

function(record, runtime, search) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	log.debug('---', '----------------------------------------------');
    	log.debug('getInputData', 'inicio');
    	var tipo = runtime.getCurrentScript().getParameter({name:'custscript_tipo_comp'});
		var periodo = runtime.getCurrentScript().getParameter({name:'custscript_periodo_comp'});
		log.debug('parametros', 'tipo: ' + tipo + ' | periodo: ' + periodo );

		var columnName = '';
		var recordName = '';
		var fieldNamePeriod = '';
		
		if(tipo == '1'){
			recordName = 'customrecord_comisiones_jdg';
			columnName = 'custrecord_jdg_det_comision_jdg_id';
			fieldNamePeriod = 'custrecord_jdg_fecha_comision';
		} else if(tipo == '2'){
			recordName = 'customrecord_comisiones_pre';
			columnName = 'custrecord_pre_det_comision_pre_id';
			fieldNamePeriod = 'custrecord_pre_fecha_comision';
		} else if(tipo == '3'){
			recordName = 'customrecord_comisiones_gtm';
			columnName = 'custrecord_gtm_det_comision_gtm_id';
			fieldNamePeriod = 'custrecord_gtm_fecha_comision';
		} else if(tipo == '4'){
			recordName = 'customrecord_comisiones_rec';
			columnName = 'custrecord_rec_det_comision_rec_id';
			fieldNamePeriod = 'custrecord_rec_fecha_comision';
		} 
		
		log.debug('parametros', 'recordName: ' + recordName + ' | columnName: ' + columnName + ' | fieldNamePeriod: ' + fieldNamePeriod);
		
		var recordIds = [];
		search.create({
	        type: recordName + '_det',
	        filters:[columnName + '.' +fieldNamePeriod, 'is', periodo ],
	        columns: columnName
	    }).run().each(function ( r ){
	        recordIds.push({id: r.id, recordType: recordName + '_det', parent: r.getValue(columnName), parentType: recordName, columnParentName: columnName, columnPeriod: fieldNamePeriod});
	        return true;
	    });
		
		log.debug('recordIds', recordIds);
		log.debug('getInputData', 'fin');
		return recordIds;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	log.debug('map', '----------------------------------');
    	log.debug('map context',context);
    	var value = JSON.parse(context.value);
    	var tipo = runtime.getCurrentScript().getParameter({name:'custscript_tipo_comp'});
    	var eliminarTodo = runtime.getCurrentScript().getParameter({name:'custscript_eliminar_todo'});  
    	var tipo = runtime.getCurrentScript().getParameter({name:'custscript_tipo_comp'});
    	
		record.delete({ type: value.recordType, id:  parseInt(value.id) });
		
		if(eliminarTodo){
			var eliminar = true;
			search.create({
		        type: value.recordType,
		        filters:[value.columnParentName, 'is', value.parent ]
		    }).run().each(function ( r ){
		    	eliminar = false;
		    });
			log.debug('MAP', 'Eliminar: ' + eliminar+ ' | parentType: ' + value.parentType +  ' | parent: ' + value.parent);
			
			if(eliminar){
				desvilcularOV(tipo, value.parent);	
				record.delete({ type: value.parentType, id:  parseInt(value.parent) });
			}
		}
		

		log.debug('map', 'fin');
		context.write(value.id);
		return ;
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	log.debug('reduce', '----------------------------------');
    	log.debug('reduce context',context);
    	var eliminarTodo = runtime.getCurrentScript().getParameter({name:'custscript_eliminar_todo'});  
    	var periodo = runtime.getCurrentScript().getParameter({name:'custscript_periodo_comp'});
    	var tipo = runtime.getCurrentScript().getParameter({name:'custscript_tipo_comp'});
    	var value = JSON.parse(context.value);
    	
    	if(eliminarTodo){
	    	search.create({
		        type: value.parentType,
		        filters: [value.columnPeriod, 'is', periodo ]
		    }).run().each(function ( r ){
		    	log.debug('MAP', 'eliminarTodo: ' + eliminarTodo + ' | parentType: ' + value.parentType + ' | id: ' + r.id + ' | periodo: ' + periodo);
		    	desvilcularOV(tipo, r.id);	
		    	record.delete({ type: value.parentType, id:  parseInt(r.id) });
		    	return true;
		    });
    	}
    	log.debug('reduce', 'fin');
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	log.debug("SUMMARIZE", "--------");
		log.debug('Summary Input', summary);
		//Summary
		var finalKeys = [ ];
		summary.output.iterator().each(function (key) {
			finalKeys.push(key);
			return true;
		});
		
		var eliminarTodo = runtime.getCurrentScript().getParameter({name:'custscript_eliminar_todo'});  
		if(eliminarTodo && finalKeys.length == 0){
			
			var tipo = runtime.getCurrentScript().getParameter({name:'custscript_tipo_comp'});
			var periodo = runtime.getCurrentScript().getParameter({name:'custscript_periodo_comp'});
			
			if(finalKeys.length == 0){
				var columnName = '';
				var recordName = '';
				var fieldNamePeriod = '';
				
				if(tipo == '1'){
					recordName = 'customrecord_comisiones_jdg';
					columnName = 'custrecord_jdg_det_comision_jdg_id';
					fieldNamePeriod = 'custrecord_jdg_fecha_comision';
				} else if(tipo == '2'){
					recordName = 'customrecord_comisiones_pre';
					columnName = 'custrecord_pre_det_comision_pre_id';
					fieldNamePeriod = 'custrecord_pre_fecha_comision';
				} else if(tipo == '3'){
					recordName = 'customrecord_comisiones_gtm';
					columnName = 'custrecord_gtm_det_comision_gtm_id';
					fieldNamePeriod = 'custrecord_gtm_fecha_comision';
				} else if(tipo == '4'){
					recordName = 'customrecord_comisiones_rec';
					columnName = 'custrecord_rec_det_comision_rec_id';
					fieldNamePeriod = 'custrecord_rec_fecha_comision';
				} 
			}
			
	    	search.create({
		        type:recordName,
		        filters: [fieldNamePeriod, 'is', periodo ]
		    }).run().each(function ( r ){
		    	log.debug('MAP', 'eliminarTodo: ' + eliminarTodo + ' | recordName: ' + recordName + ' | id: ' + r.id + ' | periodo: ' + periodo);
		    	desvilcularOV(tipo, r.id);		    	
		    	record.delete({ type: recordName, id:  parseInt(r.id) });
		    	return true;
		    });
    	}
		
		var n_errores = 0;
		summary.mapSummary.errors.iterator().each(function(key, error) {
			log.error('Map Summarize', key + '->' + error);
			++n_errores;
			return true;
		});
		log.debug('Bumber of Errors', n_errores);
		
		
		log.debug('KEYS', JSON.stringify(finalKeys));
		log.debug('TOTAL KEYS', finalKeys.length);
    }
    
    function desvilcularOV(tipo, id){
    	if(tipo == '1'){
			search.create({
				type: 'salesorder',
				filters: [[['custbody_comision_aplicada_jdg', 'anyof', id], 'or', 
						   ['custbody_comision_aplicada_jdg', 'anyof', id], 'or', 
						   ['custbody_comision_aplicada_jdg_super', 'anyof', id]], 'AND', 
						  ['mainline', 'is', 'T']]
			}).run().each(function ( result ){
	    		record.submitFields({ type: 'salesorder', id: result.id,
		            values: { custbody_comision_aplicada_jdg: null, custbody_comp_jdg_entrega: null, custbody_comision_aplicada_jdg_super: null}
		        });
	    		return true;
			});
		} else if(tipo == '2'){
			search.create({
				type: 'salesorder',
				filters: [['custbody_comision_aplicada_pre', 'anyof', id], 'AND',  ['mainline', 'is', 'T']]
			}).run().each(function ( result ){
				record.submitFields({ type: 'salesorder', id: result.id,
		            values: { custbody_comision_aplicada_pre: null, custbody80: null}
		        });
				return true;
			});
		} else if(tipo == '3'){
			search.create({
				type: 'salesorder',
				filters: [['custbody_comision_aplicada_gtm', 'anyof', id], 'AND',  ['mainline', 'is', 'T']]
			}).run().each(function ( result ){
				record.submitFields({ type: 'salesorder', id: result.id,
		            values: { custbody_comision_aplicada_gtm: null}
		        });
				return true;
			});
		} else if(tipo == '4'){
			search.create({
				type: 'salesorder',
				filters: [['custbody_comision_aplicada_rec', 'anyof', id], 'AND',  ['mainline', 'is', 'T']]
			}).run().each(function ( result ){
				record.submitFields({ type: 'salesorder', id: result.id,
		            values: { custbody_comision_aplicada_rec: null}
		        });
				return true;
			});
		}
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
