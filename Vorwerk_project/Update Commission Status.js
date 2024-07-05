/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/format'],

function(search,record,format) {
   
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
    	var presentadorasSearch = search.load({
            id: 'customsearchemp_search_commissionstatus' //employees
        });
    	
    	return presentadorasSearch;
    	
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		var registeInfo = JSON.parse(context.value);
        	//log.debug('registeInfo',registeInfo)
        	var idPre = registeInfo.id;
            var configuracion = registeInfo.values.custentity123
            var limit = 6
            log.debug('configuracion',configuracion)
            for (i = 0; i < configuracion.length ; i++){
                    //log.debug('configuracion[i].value',configuracion[i])
                    if(configuracion[i] == 11 || configuracion[i] == 12 || configuracion[i] == 13 || configuracion[i] == 14){//TM6R o TM4U
                        limit = 4
                    }
                 }
            log.debug('limit',limit)
            var presentadorasSearch = search.load({
                id: 'customsearchso_search_commisionstatus' //employees
            });
            presentadorasSearch.filters.push(search.createFilter({
                   name: 'salesrep',
                   operator: 'is',
                   values: idPre
            }));
            
            var cont = 0
            
            presentadorasSearch.run().each(function(r){
                var internalId = r.getValue('internalid')
                var tipoVenta = r.getValue('custbody_tipo_venta')
                
                log.debug('tipoVenta',tipoVenta)
                if(tipoVenta == '2' && cont < limit){
                    log.debug('internalId',internalId)
                    log.debug('set com status no comisionable')
                    var submitFields = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: internalId,
                            values: {'custbody_vw_comission_status':'2'}
                        });
                    cont ++
        
                }else if (cont >= limit){
                    log.debug('break')
                    
                }
                return true
                
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
