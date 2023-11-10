/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/https','N/format','N/url','N/email'],

function(record, search,https,format,url,email) {
   
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
    	//extrae informacion de las odv
        var busquedaDuplicados = search.load({
            id: 'customsearch2082' 
        });
    	return busquedaDuplicados;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		var info = JSON.parse(context.value);
            log.debug('info',info)

            log.debug('info.recordType',info.recordType)
            log.debug('email',info.values.email)
            log.debug('email',info.id)
            log.debug('tranid',info.values.tranid.transaction)
            log.debug('tranid',info.values.custentity_presentadora_referido)
            //1. Extraerr correctamente los datos 
            //2. Hacer un if - Si tiene tranid o tiene presentadora referido - imprimir 'mantener'
            // sino imprimir 'inactivar'

    	}catch(err){
    		log.error("err set",err);
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
    	log.debug("start summarize",true);
    	
    }
    
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
