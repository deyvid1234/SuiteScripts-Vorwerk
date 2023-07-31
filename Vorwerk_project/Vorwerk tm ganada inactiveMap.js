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
            id: 'customsearch_vk_tipo_venta' //odv presentadora
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
	    	var idPre = registeInfo.values.salesrep.value;
	    	var date_limit = registeInfo.values.trandate;
	    	
	    	
	    	var searchData = search.create({
	            type: 'salesorder',
	            columns: ['internalid',
	                      {name:'trandate',sort: search.Sort.DESC},
	                      'salesrep',
	                      'custbody_vw_comission_status',
	                      'custbody_tipo_venta'
	                      ],
	            filters: [
	                ['salesrep', 'anyof', idPre],'and',
	                ['trandate','within','1/1/2019',date_limit],'and',
	                ['mainline','is',true],'and',
	                ['custbody_tipo_venta','anyof',[1,2]]
	            ]
	        });
	        var obj = {};
	        searchData.run().each(function(r){
	        	if(r.getValue('salesrep') in obj){
	        		obj[r.getValue('salesrep')].push({
		        							id:r.getValue('internalid'),
		        							date:r.getValue('trandate'),
		        							status:r.getValue('custbody_vw_comission_status'),
		        							type:r.getText('custbody_tipo_venta')
	        							})
	        		
	        	}else{
	        		obj[r.getValue('salesrep')] = [{
	        								id:r.getValue('internalid'),
	        								date:r.getValue('trandate'),
	        								status:r.getValue('custbody_vw_comission_status'),
	        								type:r.getText('custbody_tipo_venta')
        								}]
	        	}
	            return true;
	        });
	        
 	        var cont= 0; 
 	        for(var x in obj[idPre]){
 	    	   if(obj[idPre][x].status == 2){
 	    		   cont++;
 	    	   }
 	        }
 	        if(cont < 6){
				
				log.debug("nuemro de odvs inactivadas no alcanzado pre"+idPre+' odvs: '+obj[idPre].length,obj[idPre]);
 	    	    var dif = 6-cont;
 	    	    var cont_tm = 0;
 	    	   log.debug('obj  y '+'faltantes: '+dif,registeInfo);
 	    	    for(var x in obj[idPre]){
 	    	    	if(obj[idPre][x].type == "Ventas TM ó Ventas CK"){
 	    	    		if(obj[idPre][x].status != 2){
 	    	    			cont_tm++;
 	    	    			var submitFields = record.submitFields({
 				                type: record.Type.SALES_ORDER,
 				                id: obj[idPre][x].id,
 				                values: {'custbody_vw_comission_status':'2'}
 				            });
 	    	    			if(cont_tm == dif){
 	    	    				log.debug("actualice las faltantes",cont_tm);
 	    	    				break;
 	    	    			}
 	    	    		}
 	    	    		
 	    	    	}
 	    	    }
 	        }
	       

	        
    	}catch(err){
    		log.debug("error map",err);
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
    	log.debug('summarize',summary);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
