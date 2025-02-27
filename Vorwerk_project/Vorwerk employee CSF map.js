/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/format','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

function(search,record,format,Utils) {
   
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
    	var employeeSearch = search.load({
            id: 'customsearch_entrego_csf' 
        });
    	
    	return employeeSearch;
    	
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
            var todo = JSON.parse(context.value)
            log.debug('todo',todo)
            var internalid = todo.values["GROUP(internalid)"].value;
            log.debug('internalid',internalid)
            var fechaEntrega = todo.values["MAX(date.systemNotes)"].split(' ')
    		log.debug('fechaEntrega',fechaEntrega)
            var submitFields = record.submitFields({
                                type: 'employee',
                                id: internalid,
                                values: {'custentity_fecha_entrega_csf':fechaEntrega[0]}
                            });
        	
	       
    	}catch(err){
    		log.error("err map",err);
    	}
        
    }
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	log.debug("reduce",context);
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	log.debug("summary",summary);
    }

    return {
        getInputData: getInputData,
        map: map,
//        reduce: reduce,
        summarize: summarize
    };
    
});
