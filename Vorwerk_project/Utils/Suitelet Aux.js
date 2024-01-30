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
                    var presentadorasTotal = []
                    var datosPedido= new Object();

                    var pedido= result.getValue('internalid')
                    
                    var fechaTransaction1 = result.getValue('trandate')
                    
                    datosPedido.fechaTransaction = stringtodate(fechaTransaction1)
                    var fechaFinObjetivo1 = result.getValue({name : 'custentity_fin_objetivo_1',join : 'salesrep'})
                   
                    datosPedido.fechaFinObjetivo= stringtodate(fechaFinObjetivo1)
                    datosPedido.noDocument = result.getValue('tranid')
                    
                    var idPresentador = result.getValue({name : 'internalid',join : 'salesrep'})
                    
                    datosPedido.fechaContratacion = result.getValue({name : 'hiredate',join : 'salesrep'})
                    
                    datosPedido.fechaReactivacion = result.getValue({name : 'custentity72',join : 'salesrep'})
                    
                    datosPedido.reclutadoraSO = result.getValue('custbody_vw_recruiter')
                    
                    datosPedido.reclutadoraSR = result.getValue({name : 'custentity_reclutadora',join : 'salesrep'})
                    
                    datosPedido.jdg = result.getValue('custbody_jefa_grupo')
                    

                   

                    if (presentadorasTotal.hasOwnProperty(idPresentador)){
                        ventasPresentadoraPeriodoCalculado[idPresentador].push([{idpedido:pedido},{data:datosPedido}])
                    }else{
                        ventasPresentadoraPeriodoCalculado[idPresentador] = ([{idpedido:pedido},{data:datosPedido}])
                    }
                    
                    //var idPresentador = result.getValue({name: 'salesrep', summary: 'GROUP'})
                    //var cantidad = result.getValue({name: 'internalid', summary: 'COUNT'})
                    //log.debug('datos',cantidad+' '+idPresentador)
                     //log.debug('datosPedido.fechaTransaction', datosPedido.fechaTransaction) 
                     //log.debug('datosPedido.fechaFinObjetivo', datosPedido.fechaFinObjetivo)                 
                     
                    if(  ventasPresentadoraHistorico.hasOwnProperty(idPresentador) == false && datosPedido.fechaTransaction < datosPedido.fechaFinObjetivo){
                      presentadorasActivas[idPresentador] = ([{idpedido:pedido},{data:datosPedido}])
                    }



                    return true; 
                });

            });
            log.debug('ventasPresentadoraPeriodoCalculado',ventasPresentadoraPeriodoCalculado)
            log.debug('presentadorasActivas',JSON.stringify(presentadorasActivas))
          }catch(e){
            log.debug('error ',e)
          }
          
          return presentadorasActivas
      }
function stringtodate(date){
        var fdate = date.split('/')
        var fdate = new Date(fdate[2],fdate[1]-1,fdate[0])
        return fdate;
   }
        return {
            onRequest : onRequest,
            stringtodate : stringtodate     
        };

});