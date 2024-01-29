 /**
  * @NApiVersion 2.x
  * @NScriptType Suitelet
  * @NModuleScope SameAccount
  * @author Carl, Zeng
  * @description This's a sample SuiteLet script(SuiteScript 2.0) to export data
  *              to Excel file and directly download it in browser
  */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file'], 
    function(plugin,task, serverWidget, search, runtime,file){

             /**
              * Definition of the Suitelet script trigger point.
              *
              * @param {Object}
              *            context
              * @param {ServerRequest}
              *            context.request - Encapsulation of the incoming
              *            request
              * @param {ServerResponse}
              *            context.response - Encapsulation of the Suitelet
              *            response
              * @Since 2015.2
              */
             function onRequest(context) {
            	
                let results = [];
	       		var mapResults = true
	          	var mySearch = search.load({
	                id: 'customsearch2107'
	            });
	            mySearch.run().each(function(result) {
			        results.push(result.getAllValues());
			        return true;
			    });
			    log.debug('results',results)

             }

             return {
                 onRequest : onRequest
                 
             };

         });