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
            	
            var results = [];
        var resultsHistorico = [];
        var historicoVentasPre = search.load({
            id: 'customsearch2108'
        });
        historicoVentasPre.filters.push(search.createFilter({
                                  name: 'trandate',
                                  operator: 'before',
                                  values: '1/1/24'
                              }));
        //Añadir filtro para que la fecha sea antes del inicio del periodo

        var pagedResults = historicoVentasPre.runPaged();
        pagedResults.pageRanges.forEach(function (pageRange){
        var currentPage = pagedResults.fetch({index: pageRange.index});
            currentPage.data.forEach(function (result) {
                 results.push(result.getAllValues())
                 //log.debug('result', result)
                 log.debug('results', results)
                 var idPresentador = result.getValue('Presentadora')
                 var cantidad = result.getValue('Pedido')

                  resultsHistorico.push ({
                  id: idPresentador,
                  cantidad: cantidad
               })
                 
                return true; 
            });

            });
        log.debug('resultsHistorico', resultsHistorico)
             }

             return {
                 onRequest : onRequest
                 
             };

         });