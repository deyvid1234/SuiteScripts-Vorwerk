/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/file', 'N/http','N/format','N/encode','N/email','N/runtime'],

function(record,search,https,file,http,format,encode,email,runtime) {
   
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
      try{
        var registrosCatch = search.create({
          type: 'customrecord_catch_recomendaciones',
          columns:[
                    'custrecord_response_reintento',
                    'custrecord_procesado',
                    'custrecord_url',
                    'custrecord_json_enviado',
                    'custrecord_headers',
                    'custrecord_type_pet',
                    'custrecord_tokens',
                    'custrecord_response',
                    'internalid',
                  ],
                filters: [
                    {
                        name: 'custrecord_procesado',
                        operator: 'is',
                        values : false
                    }
                  ]

          })
          var info = []
          var pagedResults = registrosCatch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r){
                  info.push(r.getAllValues());
                });
                  return true;
                })
                
        log.debug('info',info)
        return info

      }catch(err){
        log.error('getInputData',err)
      }

    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
      try{
       
        var registrosCatch = JSON.parse(context.value)
        


        if(registrosCatch.custrecord_procesado == false){

            //Variables
            var url = registrosCatch.custrecord_url
            var json = registrosCatch.custrecord_json_enviado
            var headersField = registrosCatch.custrecord_headers
            var type = registrosCatch.custrecord_type_pet
            var catchid = registrosCatch.internalid[0].value
            var responseService
            var requestSuccess = true

            log.debug('type',type)
            log.debug('url',url)
            log.debug('json',json)
            log.debug('headersField',headersField)

            try{
              if(type == 'https'){
                responseService = https.post({
                  url: url,
                  body : JSON.parse(json),
                  headers: headersField
                }).body;

              }else if(type == 'http'){

                responseService = http.post({
                  url: url,
                  body : JSON.parse(json),
                  headers: headersField
                }).body;

              }else{
                log.debug('type indefinido')
              }
              

              log.debug('responseService',responseService)
              responseService = JSON.parse(responseService)
              requestSuccess = responseService.success

            }catch(e){
              log.error('Error en send Request ',e)
              responseService = 'Error al enviar request: '+e 
              requestSuccess = false
            }

            log.debug('requestSuccess',requestSuccess)
            log.debug('catchid',catchid)

            record.submitFields({
                id: catchid,
                type: 'customrecord_catch_recomendaciones',
                values: { 
                  "custrecord_procesado": true,
                  "custrecord_response_reintento": responseService,
                  'custrecord_request_success':requestSuccess,
                }
            })
        }
        

      }catch(err){
        log.error('map',err)
      }

    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
      log.debug('context Reduce',context)

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
      log.debug('summary summarize',summary)
    }
   

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
