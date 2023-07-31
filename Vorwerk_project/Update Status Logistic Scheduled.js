/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/config','N/runtime','N/format','N/translation'],

function(record,search,https,config,runtime,format,translation) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var apiKey = ""
    	if(runtime.envType == "SANDBOX"){
    		apiKey = "c9df5be32d150aaae2c5f3a2cddacb44"
    	}else{
    		apiKey = "c9df5be32d150aaae2c5f3a2cddacb44"
    	}
    	searchODV(apiKey)
    }
    
    
    function searchODV(apiKey){
    	var config = {
    			"Entregado":6,
    			"En ruta de entrega":4,
    			"En transito":3,
    			"Recolectado":2,
    			"Guia Generada":1,
    			"Incidencia":5
    	}
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
              if(info.length > 0){
            	  for(var x = 0; x< info.length; x++){
                	  try{
	                      if(info[x].emp == "16581" && runtime.envType != "SANDBOX"){
		                        var objRequest = {
		                           "api_key": "3aff2320dc3763edf1a4ccc5fcd4a13c4d47ec7c",  
		                           "id_envio": info[x].status   
		                        }; 
	                      }else{
		                       var objRequest = {
		                           "api_key": apiKey,  
		                           "id_envio": info[x].status   
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
    	             	  log.debug('Respuesta de acLogistic '+info[x].id,acLogistic);
    	             	  if(config[acLogistic.status]){
    	             		 var obj_sales_order= record.load({
    	                         type: 'salesorder',
    	                         id: info[x].id,
    	                         isDynamic: false,
    	                     });
    	             		 obj_sales_order.setValue({
    	                         fieldId: 'custbody_estatus_envio',
    	                         value: config[acLogistic.status]
    	                     });
    	             		 var id_sales_order = obj_sales_order.save();
    	             		 log.debug("record","id "+id_sales_order+" new status "+config[acLogistic.status]+' traking enviado '+info[x].status);
    	             	  }
    	             	  
                	  }catch(error){
                		  log.error("error search status",error)
                	  }
                	
                  }
              }
          }
          catch(error){
              log.debug('error',error);
          }
          return info;

    }
    return {
        execute: execute
    };
    
});
