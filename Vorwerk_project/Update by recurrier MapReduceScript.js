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
    	return transaction();
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		log.debug("start map",context);
    		//extrae la informacion del context
    		var obj = JSON.parse(context.value);
    		var idEm = obj.recurrier;
    		log.debug('obj',obj);
    		
    		
    		var user_reset= false;
    		var user_valid = search.lookupFields({
                type: 'employee',
                id: idEm ,
                columns: 'isinactive'
            });
    		log.debug('user active ',user_valid);
    		
    		//activa el employee en caso de estar inactivo
			if(user_valid.isinactive){
				user_reset= true;
				record.submitFields({
	                type: 'employee',
	                id: idEm,
	                values: {'isinactive': false}
	            });
				log.debug("active usuario",true);
    		}
			
			
    		record.submitFields({
                type: 'salesorder',
                id: obj.internalid,
                values: {'custbody_vw_recruiter': idEm}
            });
    		
//    		//invoca al proceso reduce desdepues de termiar de editar las odv
//    		context.write({
//                key: idEm,
//                value: user_reset
//            });
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
//    	try{
//    		log.debug("start reduce",true);
//        	log.debug('context reduce',context);
//        	
//        	//extrae la informacion del context
//        	var idEm = context.key;
//        	var values = context.values;
//        	var active= values[0]
//    		log.debug("end odv modif",idEm);
//        	log.debug('user was inactive',active);
//        	//si el usuario fue activado para procesar se revierte la activacion
//    		if(active == 'true'){
//    			record.submitFields({
//                    type: 'employee',
//                    id: idEm,
//                    values: {'isinactive': true}
//                });
//    			log.debug("inactive usuario",true);
//    		}
//    	}catch(err){
//    		log.error("error reduce",err);
//    	}
//    	
//		context.write({
//            key: idEm
//        });
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	log.debug("start summarize",true);
    	var inputSummary = summary.inputSummary;
        var mapSummary = summary.mapSummary;
        var reduceSummary = summary.reduceSummary;
        
        log.debug('inputSummary',inputSummary);
        log.debug('mapSummary',mapSummary);
        log.debug('reduceSummary',reduceSummary);
    }
    function transaction(){
    	var employees = employee();
    	var info ={};
    	var busqueda = search.create({
                    type: 'salesorder',
                    columns:[
                                'internalid',
                                'trandate',
                                'status',
                                'item',
                                'salesrep'
                            ],
                    filters: [
                        {
                        	name: 'custbody_vw_recruiter',
                            operator: 'anyof',
                            values: '@NONE@'
                        },
                    ]
                });
                var pagedResults = busqueda.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                    	var recurrier= "";
                    	if(r.getValue('salesrep') in employees){
                    		recurrier= employees[r.getValue('salesrep')].recurrier
                    		info[r.getValue('internalid')]={
        	    					internalid	: r.getValue({
        	    		                 name: 'internalid'
        	    	       		  	}),
        	    	       		  	item	: r.getValue({
        	    		                 name: 'item'
        	    	       		  	}),
        		    	       		status : r.getValue({
                                         name: 'status'
                                    }),
        							trandate : r.getValue({
        				                 name: 'trandate'
        			       		  	}),
        			       		    salesrep : r.getValue({
        				                 name: 'salesrep'
        			       		  	}),
        			       		  	recurrier: recurrier
        	    				};
                    	}
    						
                    });
                });

             return info;
    }
    function employee(){
    	var info ={};
    	var busqueda = search.create({
                    type: 'employee',
                    columns:[
                                'internalid',
                                'altname',
                                'custentity_reclutadora'
                            ],
                    filters: [
						{
						    name: 'custentity_reclutadora',
						    operator: 'noneof',
						    values: '@NONE@'
						}
                    ]
                });
                var pagedResults = busqueda.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
    					info[r.getValue('internalid')]={
	    					internalid	: r.getValue({
	    		                 name: 'internalid'
	    	       		  	}),
	    	       		  	name		: r.getValue({
	    		                 name: 'altname'
	    	       		  	}),
	    	       		    recurrier	: r.getValue({
	    		                 name: 'custentity_reclutadora'
	    	       		  	})
	    				};	
                    });
                });

             return info;
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
