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
        function onRequest(context) {
            	
	        
	        var resultsHistorico = [];

	        var presentadorasActivas 
	        var ventasPresentadoraHistorico
	        var ventasPresentadoraPeriodoCalculado

	        var historicoVentasPre = search.load({
	            id: 'customsearch2108'
	        });
	        //Añadir filtro para que la fecha sea antes del inicio del periodo
	        historicoVentasPre.filters.push(search.createFilter({
	             name: 'trandate',
	             operator: 'before',
	             values: '1/1/24'
          	}));
	        

	        var pagedResults = historicoVentasPre.runPaged();
	        pagedResults.pageRanges.forEach(function (pageRange){
	        var currentPage = pagedResults.fetch({index: pageRange.index});
	            currentPage.data.forEach(function (result) {

	                 var idPresentador = result.getValue({name: 'salesrep', summary: 'GROUP'})
	                 var cantidad = result.getValue({name: 'internalid', summary: 'COUNT'})


	                  resultsHistorico.push (idPresentador,cantidad)
	                 
	                return true; 
	            });

	            });
	        log.debug('resultsHistorico', resultsHistorico)
	        return presentadorasActivas
	             }

             return {
                 onRequest : onRequest
                 
        };

});