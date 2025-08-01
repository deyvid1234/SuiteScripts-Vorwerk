/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email','N/record', 'N/file','N/search', 'N/https', 'N/runtime','N/format','./Vorwerk Suitelet Payroll XML.js'],

function(email,record, file, search, https, runtime,format,payroll) {
	
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
    	var scriptObj = runtime.getCurrentScript();
        var comissionInfo = scriptObj.getParameter({name: 'custscript_vw_register_info'});//informacion de la tabla
        log.debug('This is comissionInfo',comissionInfo)
        return JSON.parse(comissionInfo);
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		log.debug('context map',context);
        	var registeInfo = JSON.parse(context.value);
        	log.debug('registeInfo',registeInfo);
            var periodoComision=registeInfo.periodText
            var fechatimbradomasivo=registeInfo.fechatimbradomasivo
            log.debug('fechatimbradomasivo',fechatimbradomasivo)
        	var type_rec= parseInt(registeInfo.level);
        	switch(type_rec){
    	        case 1://presentadora
    	            type_to_add = "customrecord_comisiones_presentadora";
    	        break;
    	        case 2:
    	            type_to_add = "customrecord_compensaciones_gtm";
    	        break;
    	        case 3://JDG
    	            type_to_add = "customrecord_compensaciones_jdg";
    	        break;
    	    }
            log.debug('This is type_to_add',type_to_add);

            payroll.XMLProcess(type_to_add,registeInfo.idReg,periodoComision,fechatimbradomasivo)
        	/*var objRecord = record.load({
                type: type_to_add,
                id: registeInfo.idReg,
                isDynamic: false,
            });
        	var idEmp = objRecord.getValue(config_fields.emleado[type_rec]);
        	
        	var email_emp = EmailLib.getEmployee(idEmp)
        	var objReport = EmailLib.getpdf(idEmp,registeInfo.comision_id,objRecord.id,email_emp)
        	
        	EmailLib.sendEmail(email_emp,objReport);*/
    	}catch(err){
    		log.error("Error map",err);
    	}
    	
    	
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
    	log.debug('context summary',summary);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
