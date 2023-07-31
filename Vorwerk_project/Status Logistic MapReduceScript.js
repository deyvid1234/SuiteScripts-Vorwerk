/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/config','N/runtime','N/format','N/translation'],

function(record,search,https,config,runtime,format,translation) {
   
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
    	var info = searchODV();
    	return info;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	log.debug('context',context);
    	var info = JSON.parse(context.value);
    	var apiKey = ""
    	if(runtime.envType == "SANDBOX"){
    		apiKey = "c9df5be32d150aaae2c5f3a2cddacb44"
    	}else{
    		apiKey = "c9df5be32d150aaae2c5f3a2cddacb44"
    	}
    	var config = {
    			"Entregado":6,
    			"En ruta de entrega":4,
    			"En transito":3,
    			"Recolectado":2,
    			"Guia Generada":1,
    			"Incidencia":5
    	}
    	try{
            if(info.emp == "16581" && runtime.envType != "SANDBOX"){
                  var objRequest = {
                     "api_key": "c9df5be32d150aaae2c5f3a2cddacb44",  
                     "id_envio": info.status   
                  }; 
            }else{
                 var objRequest = {
                     "api_key": apiKey,  
                     "id_envio": info.status   
                  }; 
            }
           
            log.debug("objrequest", objRequest)
       	  	 
            var responseService = https.post({
     			    url: 'https://www.smartship.mx/api/tracking/',
     				body : JSON.stringify(objRequest),
     				headers: {
             			"Content-Type": "application/json"
             		}
       	  }).body;
       	  var acLogistic = JSON.parse(responseService);
       	  log.debug('Respuesta de acLogistic '+info.id,acLogistic);
       	  if(config[acLogistic.status]){
       		 var obj_sales_order= record.load({
                   type: 'salesorder',
                   id: info.id,
                   isDynamic: false,
               });
       		 obj_sales_order.setValue({
                   fieldId: 'custbody_estatus_envio',
                   value: config[acLogistic.status]
               });
       		 var id_sales_order = obj_sales_order.save();
       		 log.debug("record","id "+id_sales_order+" new status "+config[acLogistic.status]+' traking enviado '+info.status);
       	  }
       	  
  	  }catch(error){
  		  log.error("error search status",error)
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

    }
    function searchODV(){
    	
    	var info = [];
        try{
      	  
      	  var date_f =  format.parse({
					 value: new Date('05/01/2020'),
					 type: format.Type.DATE
				 });
      	  var date_set =  format.format({
					 value: date_f,
					 type: format.Type.DATE
				 });
      	  log.debug('fecha de inicio de busqueda',date_set);
            var busqueda = search.create({
                type: 'salesorder',
                columns:[
                            'internalid',
                            'custbody_id_envio_ac',
                            'salesrep',
                            'custbody_url_one_aclogistics'
                        ],
                filters: [
                    {
                        name: 'custbody_estatus_envio',
                        operator: 'anyof',
                        values : [1,2,3,4,5]
                    },
                    {
                        name: 'custbody46',
                        operator: 'isnotempty',
                        values : null
                    },
                    {
                        name: 'mainline',
                        operator: 'is',
                        values: true
                    },
                    {
                        name: 'datecreated',
                        operator: 'after',
                        values: date_set
                    }
                ]
            });
            var pagedResults = busqueda.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                if(r.getValue('custbody_id_envio_ac') != ""){
                      s= r.getValue('custbody_id_envio_ac')

                  }else{
                      s= r.getValue('custbody_url_one_aclogistics').split('=')
                      s=s[1]
                  }
                  info.push({
                  	  status: s,
	                  id: r.getValue('internalid'),
	                  emp: r.getValue('salesrep')
                  });
                });
            });
            
         
            log.debug("# ODV encontradas",info.length);
            return info;
        }catch(err){
        	log.error("error search",err)
        }

    }
    return {
        getInputData: getInputData,
        map: map,
//        reduce: reduce,
//        summarize: summarize
    };
    
});
