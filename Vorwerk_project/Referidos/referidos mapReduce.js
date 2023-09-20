/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/https','N/runtime'],

function(search,https,runtime) {
   
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
                  ],
                filters: [
                    {
                        name: 'custrecord_procesado',
                        operator: 'is',
                        values : false
                    }
                  ]

          })
          var info = {}
          var pagedResults = busqueda.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r){
                  info.push({
                    
                    procesado: r.getValue('custrecord_procesado'),
                    responseReintento: r.getValue('custrecord_response_reintento')
                  });
                });



        return info;
      })
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
        //var registrosCatch = JSON.parse(context.value)
        //log.debug('obj_detail',obj_detail)
        //registrosCatch.estructura=[]

        if(registrosCatch.procesado == false){
            


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
