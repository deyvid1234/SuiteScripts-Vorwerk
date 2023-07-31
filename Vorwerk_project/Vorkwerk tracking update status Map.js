/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/runtime','N/format'],

function(record,search,https,runtime,format) {
   
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
        var info = searchTraking();
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

            //cambio de load por submit
            /*
             var obj_traking= record.load({
                   type: 'customrecord_guia_envio',
                   id: info.id,
                   isDynamic: false,
               });
             obj_traking.setValue({
                   fieldId: 'custrecord_estatus_envio',
                   value: config[acLogistic.status]
               });
             var id_traking = obj_traking.save();
             log.debug("record","id "+id_traking+" new status "+config[acLogistic.status]+' traking enviado '+info.status);
             */
             log.debug('info','info.id '+info.id+'  config[acLogistic.status]  '+config[acLogistic.status])
            var id_traking = record.submitFields({
                type: 'customrecord_guia_envio',
                id: info.id,
                values: {
                    'custrecord_estatus_envio':config[acLogistic.status]
                }
            });
            log.debug("record","id "+id_traking+" new status "+config[acLogistic.status]+' traking enviado '+info.status);
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
    
    function searchTraking(){
        
        var info = [];
        try{
            var busqueda = search.create({
                type: 'customrecord_guia_envio',
                columns:[
                            'internalid',
                            'custrecord_id_envio',
                            { name: 'salesrep' , join: 'custrecord_id_sales_order' },
                            'custrecord_url_resp_aclogistics'
                        ],
                filters: [
                    {
                        name: 'custrecord_estatus_envio',
                        operator: 'anyof',
                        values : [1,2,3,4,5]
                    }
                ]
            });
            var pagedResults = busqueda.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                if(r.getValue('custrecord_id_envio') != ""){
                      s= r.getValue('custrecord_id_envio')
                  }else{
                      s= r.getValue('custrecord_url_resp_aclogistics').split('=')
                      s=s[1]
                  }
                  info.push({
                      status: s,
                      id: r.getValue('internalid'),
                      emp: r.getValue({ name: 'salesrep' , join: 'custrecord_id_sales_order' })
                  });
                });
            });
            
         
            log.debug("# Registros encontrados",info.length);
            return info;
        }catch(err){
            log.error("error search",err)
        }

    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
