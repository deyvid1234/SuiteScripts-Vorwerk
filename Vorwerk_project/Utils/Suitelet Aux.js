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
            	
	        var results = [];
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

	                var allvalues = result.getAllValues()

	                 //log.debug('result', result)
	                 log.debug('results', results)

	                 log.debug('1',allvalues['GROUP(salesrep)'])
	                 log.debug('2',result.getValue({name: 'salesrep', summary: 'GROUP'}))

	                 var idPresentador = allvalues['GROUP(salesrep)']
	                 var cantidad = result.getValue('Pedido')


	                  resultsHistorico.push ({
	                  id: idPresentador,
	                  cantidad: cantidad
	               })
	                 
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