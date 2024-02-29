/**Inactivar sales order
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/format','N/runtime'],

function(search,record,format,runtime) {
   
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
    	var scriptObj = runtime.getCurrentScript();
        var paramsInfo = scriptObj.getParameter({name: 'custscript_transaccion'});
        log.debug('paramsInfoget', paramsInfo)
        var ids = paramsInfo.split(",");
        log.debug('ids',ids)
        
          return ids;  
    
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
            
            var idRec= context.value
            log.debug('idRec', idRec)
            var saved= false
             var rec= record.load({
                type: 'salesorder',
                id: idRec,
                isDynamic: true,
            });
            var count = rec.getLineCount('item');

            for (var i = 0; i < count; i++) {
                   rec.selectLine({ sublistId: 'item', line: i });
                   rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed', value: true });
                   rec.commitLine('item')
                   saved = true
            }

            rec.save();
            context.write(idRec, saved);      
    	}catch(err){
    		log.error("err map",err);
            context.write(idRec, saved);
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

        var scriptObj = runtime.getCurrentScript();
            var transactionId = scriptObj.getParameter({ name: 'custscript_transaccion' });

            log.debug({
                title: 'summarize/transactionId',
                details: transactionId
            });

            var failedItems = ''
            var savedItems = 0 
            var totalItemsProcessed = 0
            
            summary.output.iterator().each(function (key, saved) {
                log.debug('key', key)
                log.debug('saved', saved)
                if (saved == 'true') {
                    savedItems++;
                } else {
                    
                    failedItems += key + '\n';
                    
                }
               
                totalItemsProcessed++

                return true;
            });

            if (failedItems) {
                failedItems = 'Transacciones no cerradas: \n' + failedItems

            }

            failedItems += "\n\nTransaccion ID: " + transactionId + "\nUsage: " + summary.usage +
                "\nConcurrency: " + summary.concurrency +
                "\nNumber of yields: " + summary.yields + "\nTotal Items Processed: " + totalItemsProcessed +
                "\nTotal Saved Items:" + savedItems;
                 
            if (totalItemsProcessed) {
                log.debug({
                    title: 'summarize/totalItemsProcessed',
                    details: totalItemsProcessed
                });
            } 
            if(failedItems) {
                log.debug({
                    title: 'summarize/failedItems',
                    details: failedItems
                });
            }
    }
   

    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
    };
    
});
