/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(context) {
    	

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(context) {
    	var currentRecord = context.newRecord;
    	//-- Por defecto para  JDG
//    	var emplFieldName = 'custrecord_jdg_empleado';
//    	var compsFieldName = 'custrecord9';
//    	var fechaFieldName = 'custrecord_jdg_fecha_comision';
//    	var bonoFieldsName = ['custrecord_jdg_bono_manual','custrecord62','custrecord63','custrecord64','custrecord65', 'custrecord100', 'custrecord101', 'custrecord102', 'custrecord103', 'custrecord104'];
    	
    	var emplFieldName = null;
    	var compsFieldName = null;
    	var fechaFieldName = null;
    	var bonoFieldsName = null;
    	log.debug('currentRecord.type', currentRecord.type);
    	switch(currentRecord.type){
	    	case 'customrecord_comisiones_jdg': //JDG
	    		emplFieldName = 'custrecord_jdg_empleado';
	        	compsFieldName = 'custrecord9';
	        	fechaFieldName = 'custrecord_jdg_fecha_comision';
	        	bonoFieldsName = ['custrecord_jdg_bono_manual','custrecord62','custrecord63','custrecord64','custrecord65', 'custrecord100', 'custrecord101', 'custrecord102', 'custrecord103', 'custrecord104'];
	        	break;
    		case 'customrecord_comisiones_pre': //Presetadora
    	    	emplFieldName = 'custrecord_pre_empleado';
    			fechaFieldName = 'custrecord_pre_fecha_comision';
    			compsFieldName = 'custrecord10';
    	    	bonoFieldsName = ['custrecord_pre_bono_manual','custrecord49','custrecord50','custrecord51','custrecord52', 'custrecord110', 'custrecord111', 'custrecord112', 'custrecord113', 'custrecord114'];
    			break;
    		case 'customrecord_comisiones_rec': //Reclutadora
    	    	emplFieldName = 'custrecord_rec_empleado';
    			fechaFieldName = 'custrecord_rec_fecha_comision';
    			compsFieldName = 'custrecord11';
    			bonoFieldsName = ['custrecord_rec_bono_manual','custrecord76','custrecord77','custrecord78','custrecord79', 'custrecord120', 'custrecord121', 'custrecord122', 'custrecord123', 'custrecord124'];
    			break;
    		case 'customrecord_comisiones_gtm': 
    	    	emplFieldName = 'custrecord_gtm_empleado';
    			fechaFieldName = 'custrecord_gtm_fecha_comision';
    			compsFieldName = 'custrecord12';
    	    	bonoFieldsName = ['custrecord_gtm_bono_manual','custrecord58','custrecord59','custrecord60','custrecord61', 'custrecord85', 'custrecord86', 'custrecord87', 'custrecord88', 'custrecord89'];
    			break;
    	}
    	var idConfiguracionComp = currentRecord.getValue(compsFieldName);
    	log.debug('idConfiguracionComp', idConfiguracionComp);
    	var fieldLookUp = idConfiguracionComp? search.lookupFields({type: "customrecord_conf_de_compensaciones", id: idConfiguracionComp, columns: 'custrecord_conf_principal'}):null;
    	log.debug('fieldLookUp', fieldLookUp);
    	if(fieldLookUp && !fieldLookUp.custrecord_conf_principal){
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

	    	var filters = [search.createFilter({name: fechaFieldName, operator: 'is', values: currentRecord.getValue(fechaFieldName)}), 
				    		search.createFilter({name: 'custrecord_conf_principal', join: compsFieldName, operator: 'is', values: 'F'}), 
				    		search.createFilter({name: emplFieldName, operator: 'is', values: currentRecord.getValue(emplFieldName)})];
	    	log.debug('columns', c);	
	    	log.debug('Valores de campos: ','emplFieldName: ' + emplFieldName + ' | fechaFieldName: ' + fechaFieldName + ' | compsFieldName: ' + compsFieldName + ' | bonoFieldsName: ' + bonoFieldsName );
	    	log.debug('filters', filters);
	    	
	    	search.create({
		    	type: currentRecord.type,
		    	columns: c,
		    	filters: filters
	    	}).run().each(function(r){
		    	var totalBonos = r.getValue(c);
		    	log.debug('totalBonos', totalBonos);	
		    	var fieldToUpdate = {};
		    	fieldToUpdate[bonoFieldsName[0]] = totalBonos;
		    	
		    	var filters = [search.createFilter({name: fechaFieldName, operator: 'is', values: currentRecord.getValue(fechaFieldName)}), 
		    		search.createFilter({name: 'custrecord_conf_principal', join: compsFieldName, operator: 'is', values: 'T'}), 
		    		search.createFilter({name: emplFieldName, operator: 'is', values: currentRecord.getValue(emplFieldName)})];
		    	
		    	search.create({
			    	type: currentRecord.type,
			    	filters: filters
		    	}).run().each(function(registroAcumulado){
		    		log.debug('updating...', currentRecord.type + '(' + registroAcumulado.id + ') ' + bonoFieldsName[0] + ' = ' + totalBonos);	
		    		record.submitFields({
		    			type: currentRecord.type,
		    			id: registroAcumulado.id,
		    			values: fieldToUpdate,
		    			options: {
			    			enableSourcing: false,
			    			ignoreMandatoryFields : true
		    			}
		    		});
		    	});
	    	});
    	}
    	
    }

    return {
//        beforeLoad: beforeLoad,
//        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
