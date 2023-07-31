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
    	var recordType = runtime.getCurrentScript().getParameter({name:'custscript_tipo'});
		var periodo = runtime.getCurrentScript().getParameter({name:'custscript_periodo'});
		log.debug('parametros', 'recordType: ' + recordType + ' | periodo: ' + periodo);

		var fieldNamePeriod = '';
		var fieldNameFlag = '';
		if(recordType == 'customrecord_comisiones_gtm'){
			fieldNamePeriod = 'custrecord_gtm_fecha_comision';
			fieldNameFlag = 'custrecord12.custrecord_conf_principal';
		} else if(recordType == 'customrecord_comisiones_jdg'){
			fieldNamePeriod = 'custrecord_jdg_fecha_comision';
			fieldNameFlag = 'custrecord9.custrecord_conf_principal';
		} else if(recordType == 'customrecord_comisiones_pre'){
			fieldNamePeriod = 'custrecord_pre_fecha_comision';
			fieldNameFlag = 'custrecord10.custrecord_conf_principal';
		} else if(recordType == 'customrecord_comisiones_rec'){
			fieldNamePeriod = 'custrecord_rec_fecha_comision';
			fieldNameFlag = 'custrecord11.custrecord_conf_principal';
		} else {
			return [];
		}

		var recordIds = [];
		search.create({
	        type: recordType,
	        filters:[[fieldNamePeriod, 'is', periodo ], 'and', [fieldNameFlag, 'is', 'T']]
	    }).run().each(function ( result ){
	        recordIds.push(result.id);
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
    	var recordType = runtime.getCurrentScript().getParameter({name:'custscript_tipo'});
		log.debug('parametros', 'recordType: ' + recordType);
		
		var compensacionId = JSON.parse(context.value);
		log.debug('MAP', 'compensacionId: ' + compensacionId);
		
		var objAcumulador = record.load({type: recordType, id: compensacionId});
		
		//-- Campos para manejo de bonos
		var emplFieldName = null;
    	var compsFieldName = null;
    	var fechaFieldName = null;
    	var bonoFieldsName = null;
		
		if(recordType == 'customrecord_comisiones_gtm'){	
			
			emplFieldName = 'custrecord_gtm_empleado';
			fechaFieldName = 'custrecord_gtm_fecha_comision';
			compsFieldName = 'custrecord12';
	    	bonoFieldsName = ['custrecord_gtm_bono_manual','custrecord58','custrecord59','custrecord60','custrecord61', 'custrecord85', 'custrecord86', 'custrecord87', 'custrecord88', 'custrecord89'];
			
	    	
			//- Busca el total de comisiones generadas											
			var filters =[['custrecord_gtm_empleado', 'is', objAcumulador.getValue('custrecord_gtm_empleado')], 'and',
						  ['custrecord_gtm_fecha_comision', 'is', objAcumulador.getValue('custrecord_gtm_fecha_comision')], 'and',
						  ['custrecord12.custrecordpuntosflag', 'is', false], 'and',
						  ['internalid', 'noneof', compensacionId]];
			 
			var columns = [{name: 'custrecord_gtm_no_ventas_totales', summary: 'sum'},
							{name: 'custrecord_gtm_no_ventas_periodo', summary: 'sum'},
							{name: 'custrecord_gtm_total_comisiones', summary: 'sum'},
							{name: 'custrecord_gtm_bono_manual', summary: 'sum'},
							{name: 'custrecord_gtm_puesta_marcha', summary: 'sum'}];
			
			search.create({
				type: 'customrecord_comisiones_gtm', 
				filters: filters,
				columns: columns
			}).run().each(function(r){
				objAcumulador.setValue('custrecord_gtm_no_ventas_totales', r.getValue(columns[0]));
				objAcumulador.setValue('custrecord_gtm_no_ventas_periodo', r.getValue(columns[1]));
				objAcumulador.setValue('custrecord_gtm_total_comisiones', r.getValue(columns[2]));
				objAcumulador.setValue('custrecord_gtm_bono_manual', r.getValue(columns[3]));
				objAcumulador.setValue('custrecord_gtm_puesta_marcha', r.getValue(columns[4]));
				log.debug('values', 'ventas totales: ' + r.getValue(columns[0]) + ' | ventas periodo: ' + r.getValue(columns[1]) + 
						' | total comisiones: ' + r.getValue(columns[2]) + ' | bono manual: ' + r.getValue(columns[3]) );
			});
		} else if(recordType == 'customrecord_comisiones_jdg'){
			
			emplFieldName = 'custrecord_jdg_empleado';
        	compsFieldName = 'custrecord9';
        	fechaFieldName = 'custrecord_jdg_fecha_comision';
        	bonoFieldsName = ['custrecord_jdg_bono_manual','custrecord62','custrecord63','custrecord64','custrecord65', 'custrecord100', 'custrecord101', 'custrecord102', 'custrecord103', 'custrecord104'];
        	
        	
			//- Busca el total de comisiones generadas												
			var filters =[['custrecord_jdg_empleado', 'is', objAcumulador.getValue('custrecord_jdg_empleado')],  'and',
				  ['custrecord_jdg_fecha_comision', 'is', objAcumulador.getValue('custrecord_jdg_fecha_comision')], 'and',
				  ['custrecord9.custrecordpuntosflag', 'is', false], 'and',
				  ['internalid', 'noneof', compensacionId]]
		
			var columns = [{name: 'custrecord_jdg_bono_manual', summary: 'sum'},
						   {name: 'custrecord_jdg_no_ventas_equipo', summary: 'sum'},
						   {name: 'custrecord_jdg_total_comisiones_equipo', summary: 'sum'},
						   {name: 'custrecord_jdg_no_ventas_propio', summary: 'sum'},
						   {name: 'custrecord_jdg_compensacion_propio', summary: 'sum'},
						   {name: 'custrecord_jdg_entrega_propio', summary: 'sum'},
						   {name: 'custrecord_jdg_total_comisiones_propio', summary: 'sum'},
						   {name: 'custrecord_jdg_x_maquina_propio', summary: 'sum'},
						   {name: 'custrecord_jdg_no_ventas_esp_periodo', summary: 'sum'},
						   {name: 'custrecord_jdg_no_ventas_esp_acumulado', summary: 'sum'},
						   {name: 'custrecord_jdg_compensacion_especial', summary: 'sum'},
						   {name: 'custrecord_jdg_bono_propio', summary: 'sum'},
						   {name: 'custrecord_jdg_nro_entregas_propios', summary: 'sum'},
						   {name: 'custrecord_jdg_pagado_a', summary: 'sum'},
						   {name: 'custrecord_jdg_pagado_b', summary: 'sum'}];
			
			search.create({
				type: 'customrecord_comisiones_jdg', 
				filters: filters, 
				columns: columns										
			}).run().each(function(r){
				objAcumulador.setValue('custrecord_jdg_bono_manual', r.getValue(columns[0]));
				objAcumulador.setValue('custrecord_jdg_no_ventas_equipo', r.getValue(columns[1]));
				objAcumulador.setValue('custrecord_jdg_total_comisiones_equipo', r.getValue(columns[2]));
				objAcumulador.setValue('custrecord_jdg_no_ventas_propio', r.getValue(columns[3]));
				objAcumulador.setValue('custrecord_jdg_compensacion_propio', r.getValue(columns[4]));
				objAcumulador.setValue('custrecord_jdg_entrega_propio', r.getValue(columns[5]));
				objAcumulador.setValue('custrecord_jdg_total_comisiones_propio', r.getValue(columns[6]));
				objAcumulador.setValue('custrecord_jdg_x_maquina_propio', r.getValue(columns[7]));
				objAcumulador.setValue('custrecord_jdg_no_ventas_esp_periodo', r.getValue(columns[8]));
				objAcumulador.setValue('custrecord_jdg_no_ventas_esp_acumulado', r.getValue(columns[9]));
				objAcumulador.setValue('custrecord_jdg_compensacion_especial', r.getValue(columns[10]));
				objAcumulador.setValue('custrecord_jdg_bono_propio', r.getValue(columns[11]));
				objAcumulador.setValue('custrecord_jdg_nro_entregas_propios', r.getValue(columns[12]));
				objAcumulador.setValue('custrecord_jdg_pagado_a', r.getValue(columns[13]));
				objAcumulador.setValue('custrecord_jdg_pagado_b', r.getValue(columns[14]));
			});
			
			
		} else if(recordType == 'customrecord_comisiones_pre'){		
			
			emplFieldName = 'custrecord_pre_empleado';
			fechaFieldName = 'custrecord_pre_fecha_comision';
			compsFieldName = 'custrecord10';
	    	bonoFieldsName = ['custrecord_pre_bono_manual','custrecord49','custrecord50','custrecord51','custrecord52', 'custrecord110', 'custrecord111', 'custrecord112', 'custrecord113', 'custrecord114'];
			
	    	
			//- Busca el total de comisiones generadas													
			var filters =[['custrecord_pre_empleado', 'is', objAcumulador.getValue('custrecord_pre_empleado')], 'and', 
				  ['custrecord_pre_fecha_comision', 'is', objAcumulador.getValue('custrecord_pre_fecha_comision')], 'and', 
				  ['custrecord10.custrecordpuntosflag', 'is', false], 'and',
				  ['internalid', 'noneof', compensacionId]]
		
			var columns = [{name: 'custrecord_pre_total_comisiones', summary: 'sum'},
						   {name: 'custrecord_pre_bono_manual', summary: 'sum'},
						   {name: 'custrecord_pre_no_ventas', summary: 'sum'},
						   {name: 'custrecord_pre_compensacion', summary: 'sum'},
						   {name: 'custrecord_pre_entrega', summary: 'sum'},
						   {name: 'custrecord_pre_x_maquina', summary: 'sum'},
						   {name: 'custrecord_pre_no_ventas_esp_periodo', summary: 'sum'},
						   {name: 'custrecord_pre_no_ventas_esp_acumulado', summary: 'sum'},
						   {name: 'custrecord_pre_compensacion_especial', summary: 'sum'},
						   {name: 'custrecord_pre_h_bono', summary: 'sum'},
						   {name: 'custrecord_pre_pago_a', summary: 'sum'},
						   {name: 'custrecord_pre_pago_b', summary: 'sum'}];
			
			search.create({
				type: 'customrecord_comisiones_pre', 
				filters: filters, 
				columns: columns
			}).run().each(function(r){
				objAcumulador.setValue('custrecord_pre_total_comisiones', r.getValue(columns[0]));
				objAcumulador.setValue('custrecord_pre_bono_manual', r.getValue(columns[1]));
				objAcumulador.setValue('custrecord_pre_no_ventas', r.getValue(columns[2]));
				objAcumulador.setValue('custrecord_pre_compensacion', r.getValue(columns[3]));
				objAcumulador.setValue('custrecord_pre_entrega', r.getValue(columns[4]));
				objAcumulador.setValue('custrecord_pre_x_maquina', r.getValue(columns[5]));
				objAcumulador.setValue('custrecord_pre_no_ventas_esp_periodo', r.getValue(columns[6]));
				objAcumulador.setValue('custrecord_pre_no_ventas_esp_acumulado', r.getValue(columns[7]));
				objAcumulador.setValue('custrecord_pre_compensacion_especial', r.getValue(columns[8]));
				objAcumulador.setValue('custrecord_pre_h_bono', r.getValue(columns[9]));
				objAcumulador.setValue('custrecord_pre_pago_a', r.getValue(columns[10]));
				objAcumulador.setValue('custrecord_pre_pago_b', r.getValue(columns[11]));
			});
			
			
		} else if(recordType == 'customrecord_comisiones_rec'){	
			
			emplFieldName = 'custrecord_rec_empleado';
			fechaFieldName = 'custrecord_rec_fecha_comision';
			compsFieldName = 'custrecord11';
			bonoFieldsName = ['custrecord_rec_bono_manual','custrecord76','custrecord77','custrecord78','custrecord79', 'custrecord120', 'custrecord121', 'custrecord122', 'custrecord123', 'custrecord124'];
			
			
			//- Busca el total de comisiones generadas			
			var filters =[['custrecord_rec_empleado', 'is', objAcumulador.getValue('custrecord_rec_empleado')],  'and',
				  ['custrecord_rec_fecha_comision', 'is', objAcumulador.getValue('custrecord_rec_fecha_comision')], 'and',
				  ['custrecord11.custrecordpuntosflag', 'is', false], 'and',
				  ['internalid', 'noneof', compensacionId]]
		
			var columns = [{name: 'custrecord_rec_no_ventas_totales', summary: 'sum'},
						   {name: 'custrecord_rec_no_ventas_periodo', summary: 'sum'},
						   {name: 'custrecord_rec_desde_periodo', summary: 'sum'},
						   {name: 'custrecord_rec_total_comisiones', summary: 'sum'},
						   {name: 'custrecord_rec_bono_manual', summary: 'sum'}];
			
			search.create({
				type: 'customrecord_comisiones_rec', 
				filters: filters, 
				columns: columns
			}).run().each(function(r){
				objAcumulador.setValue('custrecord_rec_no_ventas_totales', r.getValue(columns[0]));
				objAcumulador.setValue('custrecord_rec_no_ventas_periodo', r.getValue(columns[1]));
				objAcumulador.setValue('custrecord_rec_desde_periodo', r.getValue(columns[2]));
				objAcumulador.setValue('custrecord_rec_total_comisiones', r.getValue(columns[3]));
				objAcumulador.setValue('custrecord_rec_bono_manual', r.getValue(columns[4]));
				log.debug('values', 'ventas totales: ' + r.getValue(columns[0]) + ' | ventas periodo: ' + r.getValue(columns[1]) + 
						' | total comisiones: ' + r.getValue(columns[2]) + ' | bono manual: ' + r.getValue(columns[3]) );
			});		
		}
		
		//--- Manejo de bonos
		var c = {
			name: 'formulacurrency', 
			summary: 'SUM', 
			formula: 'NVL({' + bonoFieldsName[0] + '},0) + ' +
					 'NVL({' + bonoFieldsName[1] + '},0) + ' +
					 'NVL({' + bonoFieldsName[2] + '},0) + ' +
					 'NVL({' + bonoFieldsName[3] + '},0) + ' +
					 'NVL({' + bonoFieldsName[4] + '},0) + ' +
					 'NVL({' + bonoFieldsName[5] + '},0) + ' +
					 'NVL({' + bonoFieldsName[6] + '},0) + ' +
					 'NVL({' + bonoFieldsName[7] + '},0) + ' +
					 'NVL({' + bonoFieldsName[8] + '},0) + ' +
					 'NVL({' + bonoFieldsName[9] + '},0)'
    	};

    	var filters = [search.createFilter({name: fechaFieldName, operator: 'is', values: objAcumulador.getValue(fechaFieldName)}), 
			    		search.createFilter({name: 'custrecord_conf_principal', join: compsFieldName, operator: 'is', values: 'F'}), 
			    		search.createFilter({name: emplFieldName, operator: 'is', values: objAcumulador.getValue(emplFieldName)})];
    	
    	search.create({
	    	type: recordType,
	    	columns: c,
	    	filters: filters
    	}).run().each(function(r){
	    	var totalBonos = r.getValue(c);
	    	log.debug('totalBonos', 'total de bonos: ' + totalBonos + ' | id campo: ' + bonoFieldsName[0]);	    	
	    	objAcumulador.setValue(bonoFieldsName[0], totalBonos);
    	});
    	
		//-------------------------------------------
    	
		objAcumulador.save();
		log.debug('map', 'fin');
		context.write(compensacionId);
		return ;
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

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
		
		var n_errores = 0;
		summary.mapSummary.errors.iterator().each(function(key, error) {
			log.error('Map Summarize', key + '->' + error);
			++n_errores;
			return true;
		});
		log.debug('Bumber of Errors', n_errores);
		
		//Summary
		var finalKeys = [ ];
		summary.output.iterator().each(function (key) {
			finalKeys.push(key);
			return true;
		});
		log.debug('KEYS', JSON.stringify(finalKeys));
		log.debug('TOTAL KEYS', finalKeys.length);
    }

    return {
        getInputData: getInputData,
        map: map,
//        reduce: reduce,
        summarize: summarize
    };
    
});
