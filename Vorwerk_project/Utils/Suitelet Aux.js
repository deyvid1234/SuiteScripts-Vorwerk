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
          try{
            var presentadorasActivas = {}
            var ventasPresentadoraHistorico = {}
            var ventasPresentadoraPeriodoCalculado = {}

            var historicoVentasPre = search.load({
                id: 'customsearch2108'
            });
            //Añadir filtro para que la fecha sea antes del inicio del periodo
            historicoVentasPre.filters.push(search.createFilter({//Ventas post septiembre 2023
                 name: 'trandate',
                 operator: 'before',
                 values: '1/1/24'//fecha inicio
              }));
            

            var pagedResults = historicoVentasPre.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (result) {

                    var idPresentador = result.getValue({name: 'salesrep', summary: 'GROUP'})
                    var cantidad = result.getValue({name: 'internalid', summary: 'COUNT'})


                    ventasPresentadoraHistorico[idPresentador] = cantidad
                     
                    return true; 
                });

            });

            log.debug('ventasPresentadoraHistorico', ventasPresentadoraHistorico)


            var periodoCalculadoVentasPre = search.load({ //Ventas post septiembre 2023
                id: 'customsearch2109'
            });
            //Añadir filtro para que la fecha sea antes del inicio del periodo
            periodoCalculadoVentasPre.filters.push(search.createFilter({
                 name: 'trandate',
                 operator: 'within', 
                 values: ['1/1/24', '31/1/24']//fecha de inicio y fecha fin
              }));
            

            var pagedResults = periodoCalculadoVentasPre.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (result) {

                    //Datos
                    var all = result.getAllValues();
                    log.debug('all',all)
                    var fechaTransaction = result.getValue('trandate')
                    log.debug('fechaTransaction', fechaTransaction)
                    var fechaFinObjetivo = result.getValue({name : 'custentity_fin_objetivo_1',join : 'salesrep'})
                    log.debug('fechaFinObjetivo', fechaFinObjetivo)
                    var noDocument = result.getValue('tranid')
                    log.debug('noDocument', noDocument)
                    var idPresentador = result.getValue({name : 'internalid',join : 'salesrep'})
                    log.debug('salesRepId', idPresentador)
                    var fechaContratacion = result.getValue({name : 'hiredate',join : 'salesrep'})
                    log.debug('fechaContratacion', fechaContratacion)
                    var fechaReactivacion = result.getValue({name : 'custentity72',join : 'salesrep'})
                    log.debug('fechaReactivacion', fechaReactivacion)
                    var reclutadoraSO = result.getValue('custbody_vw_recruiter')
                    log.debug('reclutadoraSO', reclutadoraSO)
                    var reclutadoraSR = result.getValue({name : 'custentity_reclutadora',join : 'salesrep'})
                    log.debug('reclutadoraSR', reclutadoraSR)
                    var jdg = result.getValue('custbody_jefa_grupo')
                    log.debug('jdg', jdg)

                    //var idPresentador = result.getValue({name: 'salesrep', summary: 'GROUP'})
                    //var cantidad = result.getValue({name: 'internalid', summary: 'COUNT'})
                    //log.debug('datos',cantidad+' '+idPresentador)

                    ventasPresentadoraPeriodoCalculado[idPresentador] = noDocument
                     
                    if(  ventasPresentadoraHistorico.hasOwnProperty(idPresentador) == false && fechaTransaction<fechaFinObjetivo){
                      presentadorasActivas[idPresentador] = noDocument
                    }



                    return true; 
                });

            });
            log.debug('ventasPresentadoraPeriodoCalculado',ventasPresentadoraPeriodoCalculado)
            log.debug('presentadorasActivas',presentadorasActivas)
          }catch(e){
            log.debug('error ',e)
          }
          
          return presentadorasActivas
      }

        return {
            onRequest : onRequest
                 
        };

});