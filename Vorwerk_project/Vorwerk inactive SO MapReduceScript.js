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
            id: 'customsearch_vk_presentadora_tm_pagada' //odv presentadora
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
        	log.debug('registeInfo',registeInfo)
        	var idPre = registeInfo.values.custbody_presentadora_tm_paga.value;
        	var date_limit = registeInfo.values.trandate;
        	if(idPre != 12000 && idPre != 16581){
        		var fdate_close = format.parse({
	                value: date_limit,
	                type: format.Type.DATE
	            }); 
        		var d = new Date(fdate_close);
        		d.setDate(d.getDate()-1); 
        		var fdate_end = format.format({
	                value: d,
	                type: format.Type.DATE
	            }); 
        		log.debug('fdate_ends',fdate_end)
        		 var searchData = search.create({
     	            type: 'salesorder',
     	            columns: ['internalid','trandate','salesrep'],
     	            filters: [
     	                ['salesrep', 'anyof', idPre],'and',
     	                ['trandate','within','1/1/2019',fdate_end],'and',
     	                ['custbody_vw_comission_status','noneof',2],'and',
     	                ['mainline','is',true]
     	            ]
     	        });
     	        var obj = {};
     	        searchData.run().each(function(r){
     	        	if(r.getValue('salesrep') in obj){
     	        		obj[r.getValue('salesrep')].push({id:r.getValue('internalid'),date:r.getValue('trandate')})
     	        		
     	        	}else{
     	        		obj[r.getValue('salesrep')] = [{id:r.getValue('internalid'),date:r.getValue('trandate')}]
     	        	}
     	            return true;
     	        });
     	        
     	        for(var x in obj[idPre]){
     	        	try{
     	        		var submitFields = record.submitFields({
			                type: record.Type.SALES_ORDER,
			                id: obj[idPre][x].id,
			                values: {'custbody_vw_comission_status':'2'}
			            });
     	        	}catch(error){
     	        		log.error('error for',error)
     	        	}
     	        	
     	        }
     	        log.debug('obj',obj);
        	}
	       
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
