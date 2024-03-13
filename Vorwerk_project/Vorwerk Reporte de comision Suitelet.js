/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file'], 
    function(plugin,task, serverWidget, search, runtime,file){
  
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
   function onRequest(context) {
     
    log.debug('metohd',context.request.method); 
    try{
      Utils = plugin.loadImplementation({
            type: 'customscript_vorwer_commission_custplug'
        });
        log.debug('default impl result = ' + Utils.doTheMagic(10, 20));
    }catch(err){
      log.error("error plugin",err);
    }
    
    var form;
    form = createForm();
    
    params = context.request.parameters;
    try{
      if(context.request.method == 'POST'){
          context.response.writePage(form);
          cust_promo = params.custpage_promo;
          cust_type = params.custpage_type_;
          cust_period = params.custpage_date;
          cust_entrega = params.custpage_entrega;
          fileSearch1 = params.custpage_search_aux1;
          fileSearch2 = params.custpage_search_aux2;
          var custpage_date = form.getField({ id:'custpage_date'});
          custpage_date.defaultValue = cust_period;
          var custpage_type_ = form.getField({ id:'custpage_type_'});
          custpage_type_.defaultValue = cust_type;
          var custpage_promo = form.getField({ id:'custpage_promo'});
          custpage_promo.defaultValue = cust_promo;
          var custpage_entrega = form.getField({ id:'custpage_entrega'});
          custpage_entrega.defaultValue = cust_entrega;
          
          
          log.debug('Filtros','Tipo : '+cust_type+' Promocion : '+cust_promo+' Periodo : '+cust_period+' Entrega : '+cust_entrega+' fileSearch1 '+ fileSearch1+' fileSearch2 '+fileSearch2)
        try{
          sublista(form,cust_type,cust_promo,cust_period,cust_entrega,fileSearch1,fileSearch2);
          context.response.writePage(form)
        }catch(e){
          log.error('error al crear form',e);
        }
      
      }if(context.request.method == 'PUT'){
        try{
//          validar primero el estatus del map
//          var searchTaskStatus = task.checkStatus({
//              taskId: 51
//          });
//
//          if (searchTaskStatus.status === task.TaskStatus.FAILED) {
//              // Handle the task failure
//          }
          //recibe la informacion de la tabla para ejecutar el map y enviar los parametros con la informacion
              var body = JSON.parse(context.request.body);
              log.debug('params',body);
              var obj_comission = body.obj;
              var config = body.obj_conf;
              var mapTask = task.create({
                  taskType: task.TaskType.MAP_REDUCE,
                  scriptId: 'customscript_vorwerk_commission_map',
                  params: {
                    custscript_data_commision: JSON.stringify(obj_comission),
                    custscript_config_comission: JSON.stringify(config)
                  }
            }).submit();
          }catch(err){
            log.debug("error task ",err);
          }
      }else{
            context.response.writePage(form);
      }
      }catch(e){
          log.error('error form',e);
      }
         
   

  }
   
   function createForm (){
     try{
       
       var form = serverWidget.createForm({
               title: 'Reporte de Comisiones'
           });
        form.clientScriptFileId = 1163010;
        
        
        
        form.addFieldGroup({
                  id: 'custpage_filters',
                  label: 'Filtros'
         })
       
        form.addField({
             id: 'custpage_date',
             type: serverWidget.FieldType.SELECT,
             label: 'Periodo de comision',
             source: 'customrecord_periods',
             container: 'custpage_filters'
         });
         form.addField({
             id: 'custpage_consecutivo',
             type: serverWidget.FieldType.CURRENCY,
             label: 'Consecutivo',
             container: 'custpage_filters'
         });
         var searchFile1 = form.addField({
             id: 'custpage_search_aux1',
             type: serverWidget.FieldType.TEXT,
             label: 'Busqueda 1',
             container: 'custpage_filters'
         });
         var searchFile2 =form.addField({
             id: 'custpage_search_aux2',
             type: serverWidget.FieldType.TEXT,
             label: 'Busqueda 2',
             container: 'custpage_filters'
         });
         var promo = form.addField({
             id: 'custpage_promo',
             type: serverWidget.FieldType.SELECT,
             label: 'Promocion',
             source: 'customlist_promocion',
             container: 'custpage_filters'
         });
         var select = form.addField({
             id: 'custpage_type_',
             type: serverWidget.FieldType.SELECT,
             label: 'Tipo',
             container: 'custpage_filters'
         });
         select.addSelectOption({
             value : 1,
             text : 'Presentadora'
         });
//         select.addSelectOption({
//             value : 2,
//             text : 'Gana tu TM'
//         });
         select.addSelectOption({
             value : 3,
             text : 'Lideres de Equipo'
         });
         var entrega = form.addField({
             id: 'custpage_entrega',
             type: serverWidget.FieldType.SELECT,
             label: 'Entrega',
             container: 'custpage_filters'
         });
         entrega.addSelectOption({
              value : 1,
              text : 'Todas pagadas'
          });
         entrega.addSelectOption({
            value : 2,
            text : 'Ninguna pagada'
         });
         entrega.addSelectOption({
            value : 3,
            text : 'Validación fecha de entrega'
          });
         form.addSubmitButton({
           label: 'Consultar',
           container: 'custpage_filters'
         });
         form.addFieldGroup({
           id: 'custpage_results',
           label: 'Resultados'
         })
       
         var btnSearch = form.addButton({
              id : 'custpage_searchData',
              label : 'Guardar',
              functionName : 'saveData()'
            });
         
         var btnSearch1 = form.addButton({
             id : 'custpage_create_excel',
             label : 'Crear Excel',
             functionName : 'createExcel()'
           });
         
       return form;
       
     }catch (e){
       log.debug("error create form",e)
     }
    

   }
   function pre_tm_pagada(ids_presentadoras,startDate, endDate){
     var obj_return = {}
     var searchSalesOrder = search.create({
           type: search.Type.SALES_ORDER,
           filters: [
                     {
                         name: 'custbody_presentadora_tm_paga',
                         operator: 'anyof',
                         values: ids_presentadoras
                     },
                     {
                         name: 'custbody_tipo_venta',
                         operator: 'anyof',
                         values: [19]
                     },
                     {
                         name: 'recordtype',
                         operator: 'is',
                         values: 'salesorder'
                     },
                     {
                         name: 'trandate',
                         operator: 'ONORAFTER',
                         values: startDate
                     }
                 ],
           columns: [
               { name: 'internalid' },
               { name: 'custbody_tipo_venta'},
               { name: 'trandate'},
               { name: 'custbody_presentadora_tm_paga'},
           ]
       });
     var pagedResults = searchSalesOrder.runPaged();
       pagedResults.pageRanges.forEach(function (pageRange){
           var currentPage = pagedResults.fetch({index: pageRange.index});
           currentPage.data.forEach(function (result) {
    
           var obj = new Object();
           obj.internalid = result.getValue('internalid')
           obj.custbody_presentadora_tm_paga = result.getValue('custbody_presentadora_tm_paga');
           obj.trandate = result.getValue('trandate').split("/");
           obj.custbody_tipo_venta = result.getValue('custbody_tipo_venta');
           obj_return[obj.custbody_presentadora_tm_paga]=obj
         return true;
           });

       });
       var searchSalesOrder = search.create({
           type: search.Type.SALES_ORDER,
           filters: [
                     {
                         name: 'salesrep',
                         operator: 'anyof',
                         values: ids_presentadoras
                     },
                     {
                         name: 'custbody_tipo_venta',
                         operator: 'anyof',
                         values: [1]
                     },
                     {
                         name: 'recordtype',
                         operator: 'is',
                         values: 'salesorder'
                     },
                     {
                         name: 'trandate',
                         operator: 'ONORAFTER',
                         values: startDate
                     }
                 ],
           columns: [
               { name: 'internalid' },
               { name: 'custbody_tipo_venta'},
               { name: 'trandate'},
               { name: 'salesrep'},
           ]
       });
     var pagedResults = searchSalesOrder.runPaged();
       pagedResults.pageRanges.forEach(function (pageRange){
           var currentPage = pagedResults.fetch({index: pageRange.index});
           currentPage.data.forEach(function (result) {
    
           var obj = new Object();
           obj.internalid = result.getValue('internalid')
           obj.custbody_presentadora_tm_paga = result.getValue('salesrep');
           obj.trandate = result.getValue('trandate').split("/");
           obj.custbody_tipo_venta = result.getValue('custbody_tipo_venta');
           obj_return[obj.custbody_presentadora_tm_paga]=obj
         return true;
           });

       });
       
       return obj_return;
   }
  
   function busquedaPrincipal(fileSearch1){
     try{
       log.debug("entre busqueda principal","start"+fileSearch1);
        var fileObj = file.load({
          id: fileSearch1
      });
      var info = fileObj.getContents();
      var structure = JSON.parse(info);
          log.debug('structure',structure.data);
           return structure;
     }catch(e){
       log.debug("error busqueda",e)
     }
         
   }
   
    function searchporSupervisor(info_data){
     try {
       //extrae todas las presentadoras en una busqueda
       var presentadora_promo = {}
       log.debug('keys searchporSupervisor',Object.keys(info_data));
       var idJDG = Object.keys(info_data);
       var data = {}
       var busqueda = search.create({
             type: 'employee',
             filters: [{ name: 'supervisor', operator: 'anyof', values: idJDG},{name: 'isinactive', operator: 'is', values: false}],
             columns: ['internalid','supervisor','custentity123']
         });
      var pagedResults = busqueda.runPaged();
             pagedResults.pageRanges.forEach(function (pageRange){
                 var currentPage = pagedResults.fetch({index: pageRange.index});
                 currentPage.data.forEach(function (result) {
                     if(result.getValue('supervisor') in data){//valida si existe el supervisor en el objeto
                       data[result.getValue('supervisor')].push(result.getValue('internalid'));
                     }else{//en caso de no existir crea una clave con el id del supervisor y almacena al presentador encontrado
                       data[result.getValue('supervisor')]= [result.getValue('internalid')];
                     }
                     presentadora_promo[result.getValue('internalid')]=result.getValue('custentity123').split(",");
                     //data[result.getValue('internalid')]=result;//almacena las jdg por id [1234]={name:id,type,date...etc}
             
                 });
                   
           });
          
      log.debug('structure sup',presentadora_promo);    
      log.debug('data sup',data);  
  return {data:data, presentadora_promo:presentadora_promo};
     }catch(e){
       log.debug("Error busqueda de por supervisor", e)
     }
     
    
   }
   function stringtodate(date){
        var fdate = date.split('/')
        var fdate = new Date(fdate[2],fdate[1]-1,fdate[0])
        return fdate;
   }
   function stringtodateGuion(date){
        var fdate = date.split('-')
        var fdate = new Date(fdate[2],fdate[1]-1,fdate[0])
        return fdate;
   }
   function ddmmyyyydate(date){
        var fdate = date.split('/')
        var fdate = fdate[2]+'/'+fdate[1]-1+'/'+fdate[0]
        return fdate;
   }
   function ddmmyyyydateGuion(date){
        var fdate = date.split('-')
        var fdate = fdate[2]+'/'+fdate[1]-1+'/'+fdate[0]
        return fdate;
   }
   function searchReclutasTresmasDos(info_data,cust_period){
     
        try{
            var presentadorasActivas = {}
            var ventasPresentadoraHistorico = {}
            var ventasPresentadoraPeriodoCalculado = {}

            var fechasPeriodo = Utils.getObjPeriod(cust_period)
            var fechaPeriodMin = fechasPeriodo['startDate']
            var fechaPeriodMax = fechasPeriodo['endDate']

            
            var historicoVentasPre = search.load({
                id: 'customsearch2108'
            });
            //Añadir filtro para que la fecha sea antes del inicio del periodo
            historicoVentasPre.filters.push(search.createFilter({//Ventas post septiembre 2023
                 name: 'trandate',
                 operator: 'BEFORE',
                 values: fechaPeriodMin//fecha inicio
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
                 values: [fechaPeriodMin, fechaPeriodMax]//fecha de inicio y fecha fin
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
                    

                   var testSO ={}

                    if (presentadorasTotal.hasOwnProperty(idPresentador)){
                        ventasPresentadoraPeriodoCalculado[idPresentador].push([{idpedido:pedido},{data:datosPedido}])
                    }else{
                        ventasPresentadoraPeriodoCalculado[idPresentador] = ([{idpedido:pedido},{data:datosPedido}])
                    }
                                  
                     
                    if(  ventasPresentadoraHistorico.hasOwnProperty(idPresentador) == false && datosPedido.fechaTransaction < datosPedido.fechaFinObjetivo){
                        testSO[pedido] = datosPedido
                      presentadorasActivas[idPresentador] = testSO// ([{idpedido:pedido},{data:datosPedido}])
                      //log.debug('keys 1', Object.keys(presentadorasActivas[idPresentador]))
                    }

                    //log.debug('keys 2', Object.keys(presentadorasActivas))
                   

                    return true; 
                });

            });
            log.debug('ventasPresentadoraPeriodoCalculado',ventasPresentadoraPeriodoCalculado)
            log.debug('presentadorasActivas',presentadorasActivas)
            return presentadorasActivas;
        }catch(e){
            log.debug('error ',e)
        }
     
    
   }
   function searchReclutas(info_data,cust_period){
     try {
        //3+2
       var fechasPeriodo = Utils.getObjPeriod(cust_period)
       var fechaPeriodMin = stringtodate(fechasPeriodo['startDate'])
       var fechaPeriodMax = stringtodate(fechasPeriodo['endDate'])
       //extrae todas las reclutas en una busqueda
       var reclutas_promo = {}
       var reactivacion = {}
       log.debug('keys searchReclutas',Object.keys(info_data));
       var idJDG = Object.keys(info_data);
       var data = {}
       var tres_dos = {}
       var busqueda = search.create({
             type: 'employee',
             filters: [{ name: 'custentity_reclutadora', operator: 'anyof', values: idJDG},{name: 'isinactive', operator: 'is', values: false},{name: 'hiredate', operator: 'AFTER', values: '1/1/2019'}],
             columns: ['internalid','custentity_reclutadora','custentity123','custentity72','hiredate','supervisor',]
         });
      var pagedResults = busqueda.runPaged();
             pagedResults.pageRanges.forEach(function (pageRange){
                 var currentPage = pagedResults.fetch({index: pageRange.index});
                 currentPage.data.forEach(function (result) {
                    var hiredate = stringtodate(result.getValue('hiredate'))
                     if(result.getValue('custentity_reclutadora') in data){//valida si existe la reclutadora en el objeto
                       data[result.getValue('custentity_reclutadora')].push(result.getValue('internalid'));
                       
                     }else{//en caso de no existir crea una clave con el id del recluta y almacena al recluta encontrado
                       data[result.getValue('custentity_reclutadora')]= [result.getValue('internalid')];
                        
                     }
                      reclutas_promo[result.getValue('internalid')]=result.getValue('custentity123').split(",");
                      if(result.getValue('custentity72') != ''){
                        reactivacion[result.getValue('internalid')]=result.getValue('custentity72');
                      }else{
                        reactivacion[result.getValue('internalid')]=false;
                      }

                      //data[result.getValue('internalid')]=result;//almacena las jdg por id [1234]={name:id,type,date...etc}
        
                 });
                   
           });
           log.debug('structure rec',reclutas_promo);    
           log.debug('data rec',data);  
//log.debug('tres_dos',tres_dos); //Devuelve arreglo de Lideres de equipo y sus reclutas con fecha ce contrato del periodo calculado y del mismo equipo  
       return {data:data, reclutas_promo:reclutas_promo,reactivacion:reactivacion,tres_dos:tres_dos };
     }catch(e){
       log.debug("Error busqueda de reclutas", e)
     }
     
    
   }
   //Reclutas 3 + 2 
   function searchReclutas32(info_data,cust_period){
     try {
        //3+2
       var fechasPeriodo = Utils.getObjPeriod(cust_period)
       var fechaPeriodMin = fechasPeriodo['startDate']
       var fechaPeriodMax = fechasPeriodo['endDate']
       //extrae todas las reclutas en una busqueda
       log.debug('fechas filtro',' fechaPeriodMin '+fechaPeriodMin+' fechaPeriodMax '+fechaPeriodMax)
       var reclutas_promo = {}
       var reactivacion = {}
       log.debug('keys searchReclutas',Object.keys(info_data));
       var idJDG = Object.keys(info_data);
       var data = {}
       var tres_dos = {}
       var reclutaporLE = {} //Arreglo de LE con sus reclutas
       // Busqueda de reclutas contratadas en el periodo calculado
       var busqueda = search.create({
             type: 'employee',
             filters: [{ name: 'hiredate', operator: 'within', values: [fechaPeriodMin, fechaPeriodMax]},{name: 'isinactive', operator: 'is', values: false}],//,{name: 'hiredate', operator: 'AFTER', values: '1/1/2021'}
             columns: ['internalid','custentity_reclutadora','custentity123','custentity72','hiredate','supervisor',]
         });
      var pagedResults = busqueda.runPaged();
             pagedResults.pageRanges.forEach(function (pageRange){
                 var currentPage = pagedResults.fetch({index: pageRange.index});
                 currentPage.data.forEach(function (result) {
                    var info = result.getAllValues();
                    var hiredate = stringtodate(result.getValue('hiredate'))
                    //log.debug('fechas 3+2','hiredate '+hiredate+' fechaPeriodMin '+fechaPeriodMin+' fechaPeriodMax '+fechaPeriodMax+' custentity_reclutadora '+result.getValue('custentity_reclutadora')+' supervisor '+result.getValue('supervisor'))
                    
                    var supervisor = result.getValue('supervisor')
                    var reclutadora = result.getValue('custentity_reclutadora')
                    if(reclutadora && supervisor && reclutadora == supervisor){//Valida si lo reclutó el lider de equipo 
                        if(supervisor in tres_dos){
                        tres_dos[supervisor].push(result.getValue('internalid'));
                        }else{
                            tres_dos[supervisor] = [result.getValue('internalid')];
                        }
                        if(supervisor in reclutaporLE){
                        reclutaporLE[supervisor].push(result.getValue('internalid'));
                        }else{
                            reclutaporLE[supervisor] = [result.getValue('internalid')];
                        }
                    }else if(reclutadora && supervisor){// Si el reclutador no es el LE entonces valida si el reclutador pertenece al equipo de la LE
                        var user_valid = search.lookupFields({
                        type: 'employee',
                        id: reclutadora ,
                        columns: 'supervisor'
                        });
                        if(user_valid.supervisor != ''){
                            //log.debug('es diferente de vacio')
                            var supervisor_reclutador = user_valid.supervisor[0].value;
                            //log.debug('Presentadoras 3 + 2 ',' supervisor_reclutador '+supervisor_reclutador+' reclutadora '+reclutadora+' Supervisor'+supervisor)
                            if(supervisor == supervisor_reclutador){
                                //log.debug('1')
                                if(supervisor in tres_dos){
                                tres_dos[supervisor].push(result.getValue('internalid'));
                                }else{
                                    tres_dos[supervisor] = [result.getValue('internalid')];
                                }
                            }
                        }
                    }
                 });
                   
           });
             
           log.debug('tres_dos',tres_dos); //Devuelve arreglo de Lideres de equipo y sus reclutas con fecha de contrato del periodo calculado y del mismo equipo  
       return { tres_dos:tres_dos, reclutaporLE:reclutaporLE  };
     }catch(e){
       log.debug("Error busqueda de reclutas", e)
     }
     
    
   }

   // fin Reclutas 3 + 2 
   //Reclutas Supercomision, 
    function searchReclutas_sc(){// Reclutas despues de febrero que pertenezcan al equipo de la LE sin contemplar qien reclutó 
     try {
        var rec_sc = {}
       var busqueda = search.create({
             type: 'employee',
             filters: [{ name: 'hiredate', operator: 'AFTER', values: '31/01/2022' },{name: 'isinactive', operator: 'is', values: false}],//,{name: 'hiredate', operator: 'AFTER', values: '1/1/2021'}
             columns: ['internalid','custentity_reclutadora','custentity123','custentity72','hiredate','supervisor',]
        });
        var pagedResults = busqueda.runPaged();
         pagedResults.pageRanges.forEach(function (pageRange){
         var currentPage = pagedResults.fetch({index: pageRange.index});
         currentPage.data.forEach(function (result) {
            var info = result.getAllValues();
            
            var supervisor = result.getValue('supervisor')
            var reclutadora = result.getValue('custentity_reclutadora')
            
            if(supervisor in rec_sc){
                rec_sc[supervisor].push(result.getValue('internalid'));
            }else{
                rec_sc[supervisor] = [result.getValue('internalid')];
            }
                    
         });
                   
           });
        return { rec_sc:rec_sc};
     }catch(e){
       log.debug("Error busqueda de reclutas Supercomision", e)
     }
     
    
   }
   function sublista(form,cust_type,cust_promo,cust_period,cust_entrega,fileSearch1,fileSearch2){
    try{
          var object_fill = {};
          var sublist = form.addSublist({
               id: 'sublist',
               type: serverWidget.SublistType.LIST,
               label: 'Resultados'
           });
           //Campos compartidos
          var name = sublist.addField({
              id: 'select_field',
              type: serverWidget.FieldType.CHECKBOX,
              label: 'select'
          });
          name.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var name = sublist.addField({
               id: 'nombre',
               type: serverWidget.FieldType.SELECT,
               source:'employee',
               label: 'Nombre'
           });
           name.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});        
           
           var ingreso = sublist.addField({
               id: 'ingreso',
               type: serverWidget.FieldType.TEXT,
               label: 'Compensaciones de Ingreso'
           });
           ingreso.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
           var deleg = sublist.addField({
               id: 'delegadas',
               type: serverWidget.FieldType.TEXT,
               label: 'Delegadas'
           });
           deleg.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var reclu = sublist.addField({
               id: 'reclutadora',
               type: serverWidget.FieldType.SELECT,
               source:'employee',
               label: 'Reclutadora'
           });
           reclu.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var hiredate = sublist.addField({
               id: 'hiredate',
               type: serverWidget.FieldType.DATE,
               label: 'Fecha de Contratacion'
           });
           hiredate.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
          if(cust_promo == 1 ||cust_promo == 5){
             var fecha_reactivacion = sublist.addField({
                   id: 'fecha_reactivacion',
                   type: serverWidget.FieldType.TEXT,
                   label: 'Fecha de Reactivacion'
               });
             fecha_reactivacion.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           }
           var nombre_unidad = sublist.addField({
               id: 'custentity_nombre_unidad',
               type: serverWidget.FieldType.TEXT,
               label: 'Unidad'
           });
           nombre_unidad.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var odv_jdg = sublist.addField({
               id: 'custentity_odv_jdg',
               type: serverWidget.FieldType.TEXT,
               label: 'Ventas TM ó Ventas CK'
           });
           odv_jdg.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
           var odv_jdg_id = sublist.addField({
               id: 'custentity_odv_jdg_ids',
               type: serverWidget.FieldType.TEXT,
               label: 'ID ODV'
           });
           odv_jdg_id.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var tmpagada = sublist.addField({
               id: 'custentity_tmpagada',
               type: serverWidget.FieldType.TEXT,
               label: 'TM Pagadas'
           });
           tmpagada.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var cookkey = sublist.addField({
               id: 'custentity_cookkey',
               type: serverWidget.FieldType.TEXT,
               label: 'Cook Key'
           });
           cookkey.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var cookkey_ids = sublist.addField({
               id: 'custentity_cookkey_comision',
               type: serverWidget.FieldType.CURRENCY,
               label: 'Comision Cook Key'
           });
           cookkey_ids.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
         if(cust_promo != 1|| cust_promo != 5){
           var venta_propia = sublist.addField({
               id: 'custentity_venta_propia',
               type: serverWidget.FieldType.CURRENCY,
               label: 'Venta Propia'
           });
           venta_propia.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
           
           var tm_ganadas_num = sublist.addField({
               id: 'custentity_tm_ganadas_num',
               type: serverWidget.FieldType.TEXT,
               label: 'TM Ganadas'
           });
           tm_ganadas_num.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var suma_ventas_total = sublist.addField({
               id: 'custentity_suma_ventas_total',
               type: serverWidget.FieldType.TEXT,
               label: 'Acumulado de ventas'
           });
           suma_ventas_total.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var venta_num_entrega = sublist.addField({
               id: 'custentity_num_entrega',
               type: serverWidget.FieldType.TEXT,
               label: 'Número de Entregas'
           });
           venta_num_entrega.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var odv_entrega = sublist.addField({
               id: 'custentity_odv_entrega',
               type: serverWidget.FieldType.TEXT,
               label: 'ODV Entrega'
           });
           odv_entrega.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var venta_entrega = sublist.addField({
               id: 'custentity_entrega',
               type: serverWidget.FieldType.TEXT,
               label: 'Entrega'
           });
           venta_entrega.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
             var bono_productividad = sublist.addField({
                   id: 'custentity_bono_productividad',
                   type: serverWidget.FieldType.CURRENCY,
                   label: 'Bono de Productividad'
               });
               bono_productividad.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               var bono_emerald = sublist.addField({
                   id: 'custentity_bono_emerald',
                   type: serverWidget.FieldType.CURRENCY,
                   label: 'Bono EMERALD'
               });
               bono_emerald.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               //El DD
               //Garantia Num
               var garantia_num = sublist.addField({
                   id: 'custentity_garantia_num',
                   type: serverWidget.FieldType.TEXT,
                   label: 'Garantia Num'
               });
               garantia_num.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               //Garantia Monto
               var garantia_monto = sublist.addField({
                   id: 'custentity_garantia_monto',
                   type: serverWidget.FieldType.CURRENCY,
                   label: 'Garantia Monto'
               });
               garantia_monto.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               //Garantia ids
               var bono_garantia_ids = sublist.addField({
                   id: 'custentity_bono_garantia_ids',
                   type: serverWidget.FieldType.TEXT,
                   label: 'Garantia ids'
               });
               bono_garantia_ids.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           }
           
           var reclut = sublist.addField({
               id: 'custentity_reclutas',
               type: serverWidget.FieldType.TEXT,
               label: 'Reclutas'
           });
           reclut.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var odv_rec = sublist.addField({
               id: 'custentity_odv_rec',
               type: serverWidget.FieldType.TEXT,
               label: 'ODV de las Reclutas'
           });
           odv_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var tmpagada_rec = sublist.addField({
               id: 'custentity_tmpagada_rec',
               type: serverWidget.FieldType.TEXT,
               label: 'TM Pagadas Rec'
           });
           tmpagada_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           var odv_comisionables_rec = sublist.addField({
               id: 'custentity_odv_comisionables_rec',
               type: serverWidget.FieldType.TEXTAREA,
               label: 'ODV comisionables'
           });
           odv_comisionables_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
         
           var bono_rec = sublist.addField({
               id: 'custentity_bono_rec',
               type: serverWidget.FieldType.CURRENCY,
               label: 'Bono Reclutadora'
           });
           bono_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           if(cust_promo == 1 || cust_promo == 5 ){
             var ck = sublist.addField({
                   id: 'custentity_ck',
                   type: serverWidget.FieldType.CURRENCY,
                   label: 'CK'
               });
               ck.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
         }
           
           
         //Campos JDG
         if (cust_type == 3) {
             var total_ventas_p = sublist.addField({
                 id: 'custentity_total_ventas_p',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Ventas TM o CK y TM Pagadas'
             });
             total_ventas_p.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            var bono_talento = sublist.addField({
              id : 'custentity_bono_talento',
              type : serverWidget.FieldType.CURRENCY,
              label : 'Bono Talento'
            });
            bono_talento.updateDisplayType({
              displayType : serverWidget.FieldDisplayType.READONLY
            });
            var supervi = sublist.addField({
              id : 'custentity_presentadoras',
              type : serverWidget.FieldType.TEXTAREA,
              label : 'Presentadoras Equipo'
            });
            supervi.updateDisplayType({
              displayType : serverWidget.FieldDisplayType.READONLY
            });
            var odv_pre = sublist.addField({
              id : 'custentity_odv_pre',
              type : serverWidget.FieldType.TEXT,
              label : 'ODV de las Presentadoras'
            });
            odv_pre.updateDisplayType({
              displayType : serverWidget.FieldDisplayType.READONLY
            });
            var tmpagada_pre = sublist.addField({
              id : 'custentity_tmpagada_pre',
              type : serverWidget.FieldType.TEXT,
              label : 'TM Pagadas equipo'
            });
            tmpagada_pre.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            var odv_comisionables_pre = sublist.addField({
               id: 'custentity_odv_comisionables_pre',
               type: serverWidget.FieldType.TEXTAREA,
               label: 'ODV comisionables'
            });
            odv_comisionables_pre.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                   var porcentaje = sublist.addField({
                       id : 'custentity_porcentaje',
                       type : serverWidget.FieldType.TEXT,
                       label : '%'
                       });
                       porcentaje.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
             var venta_equipo = sublist.addField({
             id : 'custentity_venta_equipo',
             type : serverWidget.FieldType.CURRENCY,
             label : 'Venta Equipo'
             });
             venta_equipo.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

             //3+2 y 5+2 EQUIPO ESPECIAL - DEBEN PERTENECER AL EQUIPO Y APARTE DEBIERON SER RECLUTADAS POR LA LIDER DE EQUIPO 
            var odv_rec_del_periodo = sublist.addField({
              id : 'custentity_odv_rec_del_periodo',
              type : serverWidget.FieldType.TEXTAREA,
              label : 'Reclutas y ODV del periodo mismo equipo'//2134324:56645653
            });
            odv_rec_del_periodo.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

           var odv_rec_de_le_del_periodo = sublist.addField({
              id : 'custentity_odv_rec_de_le_del_periodo',
              type : serverWidget.FieldType.TEXTAREA,
              label : 'Reclutas y ODV Por recluta del LE del periodo'

            });
            odv_rec_de_le_del_periodo.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

            var rec_con_ventas = sublist.addField({
               id: 'custentity_rec_con_ventas',
               type: serverWidget.FieldType.TEXT,
               label: 'Reclutas con ventas'
            });
            rec_con_ventas.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

            var bono_32 = sublist.addField({
            id : 'custentity_bono_tres_dos',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Bono 3 + 2'
            });
            bono_32.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

            var bono_52 = sublist.addField({
            id : 'custentity_bono_cinco_dos',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Bono 5 + 2'
            });
            bono_52.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            // Fin Campos 3+2 y 5+2
            
            // Super Comision 
            var odv_pre_supercomision = sublist.addField({
              id : 'custentity_odv_pre_supercomision',
              type : serverWidget.FieldType.TEXTAREA,
              label : 'ODV Por recluta del mes del Equipo SC'

            });
            odv_pre_supercomision.updateDisplayType({
              displayType : serverWidget.FieldDisplayType.READONLY
            });
           
            var ventas_sc = sublist.addField({
               id: 'custentity_ventas_sc',
               type: serverWidget.FieldType.TEXT,
               label: 'Numero de ventas SC'
            });
            ventas_sc.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            var bono_supercomision = sublist.addField({
            id : 'custentity_bono_sc',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Bono SUPERCOMISIÓN'
            });
            bono_supercomision .updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            //Fin Campos Super Comision
            
          } else if (cust_type == 1) {
          }
           // Campos Compartidos
          
           var total = sublist.addField({
               id: 'custentity_total',
               type: serverWidget.FieldType.CURRENCY,
               label: 'Total'
           });
           total.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

           sublist.addMarkAllButtons();
           
           
           //jdg extrae info de archivo 1
           var information_jdg = busquedaPrincipal(fileSearch1)
           //Busqueda cookey
           var cookFind = getCookey(cust_period);
           //Busqueda Garantia 
           var garantiaSales = getGarantia(cust_period)
           log.debug('garantiaSales',garantiaSales)
           
           var info_data = information_jdg.data;
           var nombramiento =information_jdg.nombramiento;
           var structure_tipo_ingreso = information_jdg.tipo_ingreso; //presentadoras dif a TM 6 pagada
           log.debug('info_data',info_data)
           var structure_info = information_jdg.structure;
           log.debug('structure_info',structure_info)
           var items_promo = Utils.matchEmpCompItems(structure_info);
           log.debug('items_promo',items_promo);
           
           if(cust_type == 1 && cust_promo == 2){
             
             //leer archivo 2
             log.debug('presentadoras dif TM 6 pagadas',Object.keys(structure_tipo_ingreso).length)
             log.debug('Presentadoras TM 6 pagada',Object.keys(structure_info).length)
             if(Object.keys(structure_tipo_ingreso).length >0){
                   var fileObj = file.load({
                    id: fileSearch2
                });
                var info = fileObj.getContents();
                var infoODVPromo_historico_pre = JSON.parse(info);
               
             }
             start = Utils.getObjPeriod(9)
             end = Utils.getObjPeriod(cust_period)
             log.debug('datos enviados','Start: '+start['startDate']+' End: '+end['endDate']+' ids: '+Object.keys(structure_tipo_ingreso))
             var result_odv_pre
             if(Object.keys(structure_tipo_ingreso).length >0){
                result_odv_pre= pre_tm_pagada(Object.keys(structure_tipo_ingreso),start['startDate'],end['endDate'])
             log.debug('pre_tm_pagada',result_odv_pre)
             }else{
                result_odv_pre = false
             }
             
             var fileODVPromo_tm_ganada = Utils.getFileId("search_aux_1"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
             if(fileODVPromo_tm_ganada == false){
                 log.debug("no se encontro el archivo","search_aux_1"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
                 return false;
             }
             try{
                 log.debug("entre fileODVPromo_tm_ganada","start"+fileODVPromo_tm_ganada);
                 var fileObj = file.load({
                     id: fileODVPromo_tm_ganada
                 });
                 var info_file_tm_ganada = fileObj.getContents();
                 var structure_tm_ganada = JSON.parse(info_file_tm_ganada);
                 log.debug('structure_tm_ganada',structure_tm_ganada);
            }catch(e){
                 log.debug("error busqueda",e)
            }
             var infoODVPromo_tm_ganada = structure_tm_ganada;
             log.debug('infoODVPromo_tm_ganada',infoODVPromo_tm_ganada)
             
           }
           var fileinfoODVPromo = Utils.getFileId("search_aux_2"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
           if(fileinfoODVPromo == false){
               log.debug("no se encontro el archivo","search_aux_2"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
               return false;
           }
           try{
                 log.debug("entre fileinfoODVPromo","start"+fileinfoODVPromo);
                 var fileObj = file.load({
                     id: fileinfoODVPromo
                 });
                 var info_infoODVPromo = fileObj.getContents();
                 var structureODVPromo = JSON.parse(info_infoODVPromo);
                 log.debug('structureODVPromo',structureODVPromo);
            }catch(e){
                 log.debug("error busqueda",e)
            }
           
           var infoODVPromo = structureODVPromo;
           log.debug('infoODVPromo',infoODVPromo)
           
           var arrKeys = Object.keys(info_data);
           log.debug('arrKeys',arrKeys)
           log.debug('Total de resultados',arrKeys.length)


           //reclutas
           var information_rec =  searchReclutas(info_data,cust_period)
           var i_rec_data = information_rec.data;
           log.debug('i_rec_data',i_rec_data)
           if(Object.keys(i_rec_data).length > 0){
//             log.debug('entra a if')
               var structure_info_rec = information_rec.reclutas_promo;
//             log.debug('structure_info rec',structure_info_rec)
               var reactivacion = information_rec.reactivacion;
               var items_promo_rec = Utils.matchEmpCompItems(structure_info_rec);
//             log.debug('items_promo rec',items_promo_rec);
               //var reclutas_tres_dos = information_rec.tres_dos;//Trabajar searchReclutas32
               //var reclutas_tres_dos = searchReclutas32(info_data,cust_period)

               var ventasPresentadorareclutas_tres_dos = searchReclutasTresmasDos(info_data,cust_period)
               log.debug('ventasPresentadorareclutas_tres_dos',ventasPresentadorareclutas_tres_dos)
               //var recporLE = reclutas_tres_dos.reclutaporLE
               //reclutas_tres_dos = reclutas_tres_dos.tres_dos;
               var rec_sc = searchReclutas_sc()
               rec_sc = rec_sc.rec_sc
               log.debug('rec_sc',rec_sc)
               //log.debug('recporLE',recporLE)
               //log.debug('reclutas_tres_dos',reclutas_tres_dos)
               var fileinfoODVPromo_rec = Utils.getFileId("search_aux_3"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
               if(fileinfoODVPromo_rec == false){
                   log.debug("no se encontro el archivo","search_aux_3"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
                   return false;
               }
               try{
                     log.debug("entre infoODVPromo_rec","start"+fileinfoODVPromo_rec);
                     var fileObj = file.load({
                         id: fileinfoODVPromo_rec
                     });
                     var info_infoODVPromo_rec = fileObj.getContents();
                     var structureODVPromo_rec = JSON.parse(info_infoODVPromo_rec);
                     log.debug('structureODVPromo_rec',structureODVPromo_rec);
                }catch(e){
                     log.debug("error busqueda",e)
                }
               
               
               var infoODVPromo_rec = structureODVPromo_rec;
//             var infoODVPromo_rec = Utils.searchSO(items_promo_rec,cust_period,false,false,false);
               var fileininfoODVPromo_rec_historico = Utils.getFileId("search_aux_4"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
               if(fileininfoODVPromo_rec_historico == false){
                   log.debug("no se encontro el archivo","search_aux_3"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
                   return false;
               }
               try{
                     log.debug("entre fileininfoODVPromo_rec_historico","start"+fileininfoODVPromo_rec_historico);
                     var fileObj = file.load({
                         id: fileininfoODVPromo_rec_historico
                     });
                     var info_infoODVPromo_rec_historico = fileObj.getContents();
                     var structureinfoODVPromo_rec_historico = JSON.parse(info_infoODVPromo_rec_historico);
                     log.debug('structureODVPromo_rec_historico',structureinfoODVPromo_rec_historico);
                }catch(e){
                     log.debug("error busqueda",e)
                }
               
               log.debug('infoODVPromo rec',infoODVPromo_rec);
               var infoODVPromo_rec_historico = structureinfoODVPromo_rec_historico
               
               
               
               log.debug('infoODVPromo_rec_historico',infoODVPromo_rec_historico)
               
               var arrKeys_rec = Object.keys(structure_info_rec);
               log.debug('arrKeys_rec',arrKeys_rec)
               
               //TM pagadas Recutadoras
               var infoODVPromo_tm_rec = Utils.searchSO(items_promo_rec,cust_period,true,false,false);
               log.debug('infoODVPromo_tm_rec',infoODVPromo_tm_rec);
               var infoODVPromo_tm_rec_historico = Utils.searchSO(items_promo_rec,cust_period,true,true,false);
               log.debug('infoODVPromo_tm_rec_historico',infoODVPromo_tm_rec_historico)
           }
           //presentadoras
           if(cust_type == 3){
             var information_pre =  searchporSupervisor(info_data)
             var i_pre_data = information_pre.data;
             log.debug('i_pre_data',i_pre_data)
             var structure_info_pre = information_pre.presentadora_promo;
             log.debug('structure_info_pre',structure_info_pre)
             
             
             var items_promo_pre = Utils.matchEmpCompItems(structure_info_pre);
             log.debug('items_promo_pre',items_promo_pre);
             var infoODVPromo_pre = Utils.searchSO(items_promo_pre,cust_period,false,false,false);
             log.debug('infoODVPromo_pre',infoODVPromo_pre);
                        
             var arrKeys_pre = Object.keys(structure_info_pre);
             log.debug('arrKeys_pre',arrKeys_pre)
             
             //TM pagadas Presentadora
             var items_promo_tm_pre = Utils.matchEmpCompItems(structure_info_pre);
             log.debug('items_promo_tm_pre',items_promo_tm_pre);
             var infoODVPromo_tm_pre = Utils.searchSO(items_promo_tm_pre,cust_period,true,false,false);
             log.debug('infoODVPromo_tm_pre',infoODVPromo_tm_pre);

             //Busqueda supercomision Historico
            var pre_num_ventas = historico_pre_sc(cust_period)
            log.debug('pre_num_ventas',pre_num_ventas)
            var pre_num_ventas_tm_p = historico_pre_sc_tm_p(cust_period)
            log.debug('pre_num_ventas_tm_p',pre_num_ventas_tm_p)
            var odv_objetivo_2 =  fechaobjetivo2SC(cust_period)
            log.debug('odv_objetivo_2',odv_objetivo_2)
           
           }else if(cust_type ==1){}
           
            //TM Pagadas 
            var items_promo_tm = Utils.matchEmpCompItems(structure_info);
           log.debug('items_promo_tm',items_promo_tm);
           var infoODVPromo_tm = Utils.searchSO(items_promo_tm,cust_period,true,false,false);
           log.debug('infoODVPromo_tm',infoODVPromo_tm);

           
           
           // CK trabaja x TM


          if  (cust_promo == 1 || cust_promo == 5){
            var items_promo_ck = {}
              for(i in arrKeys){
               items_promo_ck[arrKeys[i]]=[55847,57221]
              }
            log.debug('items_promo_ck',items_promo_ck)
              var infoODVPromo_CK = Utils.searchSO(items_promo_ck,cust_period,false,false,false);
              log.debug('infoODVPromo_CK',infoODVPromo_CK);
          }
           // ConfigDetails
           var CompConfigDetails = Utils.getObjCompConfigDetails()
           log.debug('CompConfigDetails',CompConfigDetails)
           
           log.debug('CompConfigDetails',Object.keys(CompConfigDetails));
        var cont_line = -1
         //LLenado de tabla
         var reclutas_fecha_obj_2 = {}
         var conf_rec = {}
         var mySearch = search.load({
            id: 'customsearch1905'
         });
        var pagedResults = mySearch.runPaged();
             pagedResults.pageRanges.forEach(function (pageRange){
                 var currentPage = pagedResults.fetch({index: pageRange.index});
                 currentPage.data.forEach(function (result) {
                    var rec = result.getValue('internalid')
                    reclutas_fecha_obj_2[rec]= [result.getValue('custentity_fin_objetivo_2')];
                    if(result.getValue('custentity_conf_rec') != '' && result.getValue('custentity_conf_rec') != null && result.getValue('custentity_conf_rec')){
                        conf_rec[rec]= [result.getValue('custentity_conf_rec')];
                    }
                    
                 });
                   
           }); 
        //log.debug('conf_rec',conf_rec)
        //log.debug('reclutas_fecha_obj_2',reclutas_fecha_obj_2)
         for(var e = 0; e < arrKeys.length; e++){
           
           try{
              var objInfo = info_data[arrKeys[e]];  //extrae la información por presentador arrKeys[e]= [1234,1112] e= 1  info_data[arrKeys[e]] = {1234:{:name,id,type,data...etc}}
                  //proceso para llenar la informacion de la tabla
          
            if(arrKeys[e] == 3464510){
                log.debug('3464510',objInfo)
            }  
              //Se asigna la configuracion 
            var  numero_para_comisionar = 6
            var conf=0 
              for(var n in structure_info[objInfo.internalid]){
                switch(structure_info[objInfo.internalid][n]){
                case '1':
                  conf = 1
                  break;
                case '5': 
                  conf = 5
                  break;
                case '6': 
                  conf = 6
                  break;
                case '7': 
                  conf = 7
                  break;
                case '8': 
                    conf = 8
                    break;
                case '11': 
                    conf = 11
                    numero_para_comisionar = 4
                    break;
                case '12': 
                    conf = 12
                    numero_para_comisionar = 4
                    break;
                case '13': 
                    conf = 13
                    numero_para_comisionar = 4
                    break;
                }
              }
            //Variables principales
            var venta_propia = 0
            var entrega = 0
            var venta_equipo = 0
            var bono_productividad = 0
            var bono_emerald = 0
            var bono_talento = 0
            var bono_reclutadora = 0
            var odvTMpagada = 0
            var odvTMpagada_rec = 0
            var odvTMpagada_pre = 0
            var total = 0
            var odv_ent=0
            var ids_odv_ent = ['']
            var odv_rec = 0
            var odv_rec_comisionable ={}
            var odv_reclutas_tres_dos = {}

            var presentadorasActivasDelLE = 0
            var ventasTresdosData = new Object();

            var odvPIds =[]
            var odvPNumber = 0;
            var odvTMganada = 0;
            var odv_pre_comisionables= []
            var sum = 0
            var num_ck = 0;
            var comision_ck = 0;
            var comisionGarantia = 0;
            var bono_tres_dos = 0
            var bono_cinco_dos= 0
            var Supercomision = 0
              try{
              //ODV DE LA JEFA DE GRUPO
                if(arrKeys[e] == 3464510){
                    log.debug('infoODVPromo.hasOwnProperty(arrKeys[e])',infoODVPromo.hasOwnProperty(arrKeys[e]))
                    log.debug('parseInt(Object.keys(infoODVPromo[arrKeys[e]]).length) ', infoODVPromo[arrKeys[e]])
                    //log.debug(' Object.keys(infoODVPromo[arrKeys[e]]).join(',')', Object.keys(infoODVPromo[arrKeys[e]]).join(','))
                }
                if(infoODVPromo.hasOwnProperty(arrKeys[e])){
                var odvPNumber = parseInt(Object.keys(infoODVPromo[arrKeys[e]]).length);
                ids=Object.keys(infoODVPromo[arrKeys[e]]).join(',');
                odvPIds.push(ids);
                }
                 //TM Pagadas 
                  if(infoODVPromo_tm.hasOwnProperty(arrKeys[e])){
                    odvTMpagada = parseInt(Object.keys(infoODVPromo_tm[arrKeys[e]]).length);
                    ids=Object.keys(infoODVPromo_tm[arrKeys[e]]).join(',');
                    odvPIds.push(ids)
                  }
                //tm GANADAS
                  if(infoODVPromo_tm_ganada){
                    if(infoODVPromo_tm_ganada.hasOwnProperty(arrKeys[e])){
                          odvTMganada = parseInt(Object.keys(infoODVPromo_tm_ganada[arrKeys[e]]).length);
                       }
                  }
                
                  
                
                  //log.debug('odvPIds',odvPIds[0])
                  var cont_pre=0
                  try{
                   var odv_propias_filtrado = {}
                   var d_comisiona
                   d_base = new Date (2019,10-1,15)
                   //fecha de ontratacion o fecha de reactivacion para validar si comisionan sus ventas 
                   if(objInfo.fecha_reactivacion != ''){
                     reactiva = objInfo.fecha_reactivacion.split('/')
                     d_comisiona = new Date(reactiva[2],reactiva[1]-1,reactiva[0])
                   }else{
                     hiredate = objInfo.hiredate.split('/')
                     d_comisiona = new Date(hiredate[2],hiredate[1]-1,hiredate[0])
                   }
                   if(d_comisiona < d_base){
                     //si la fecha es anterior al rango de busqueda de las tm pagadas se asume que todas sus ventas comisionan
                     //log.debug('la contratacion de: '+arrKeys[e]+' es muy antigua',d_comisiona)
                   }else{
                       if(cust_type == 1 && cust_promo == 2 && result_odv_pre){
                     if(result_odv_pre.hasOwnProperty(arrKeys[e])){
                           comisiona_desde = result_odv_pre[arrKeys[e]]['trandate']
                           //log.debug('fecha',comisiona_desde[2]+comisiona_desde[1]+comisiona_desde[0])
                           f_filtro = new Date(comisiona_desde[2],comisiona_desde[1]-1,comisiona_desde[0])
                           for(i in infoODVPromo[arrKeys[e]]){
                             //log.debug('fecha odv -',infoODVPromo[arrKeys[e]][i][1]['trandate'][2]+infoODVPromo[arrKeys[e]][i][1]['trandate'][1]+infoODVPromo[arrKeys[e]][i][1]['trandate'][0])
                             f_odv = new Date(infoODVPromo[arrKeys[e]][i][1]['trandate'][2],infoODVPromo[arrKeys[e]][i][1]['trandate'][1]-1,infoODVPromo[arrKeys[e]][i][1]['trandate'][0])
                             if (f_odv >= f_filtro && infoODVPromo[arrKeys[e]][i][1]['comission_status'] != 2){ // Filtro para no considerar como comisionable la orden con la que gana su TM 
                               odv_propias_filtrado[infoODVPromo[arrKeys[e]][i][1]['id']] = infoODVPromo[arrKeys[e]][i][1]['trandate']
                             }
                           }
                           //log.debug('numero de odv filtradas',Object.keys(odv_propias_filtrado).length)
                           //log.debug('odv_propias_filtrado',odv_propias_filtrado)
                           odvPNumber=Object.keys(odv_propias_filtrado).length
                           odvPIds=Object.keys(odv_propias_filtrado).join(',')
                         }else if(cust_type == 1 && cust_promo == 2 &&  structure_tipo_ingreso.hasOwnProperty(arrKeys[e])){
                               if(infoODVPromo_historico_pre.hasOwnProperty(arrKeys[e])){
                                 if(Object.keys(infoODVPromo_historico_pre[arrKeys[e]]).length < 7){
                                 cont_pre = Object.keys(infoODVPromo_historico_pre[arrKeys[e]]).length
                                 
                                 //log.debug('se hara resta: '+arrKeys[e]+' campo: '+objInfo.tipo_ingreso+' numero de casos: '+cont_pre,Object.keys(infoODVPromo_historico_pre[arrKeys[e]]).length)
                                 if(cont_pre <=numero_para_comisionar){
                                   cont_pre = numero_para_comisionar - cont_pre
                                 }else{cont_pre = 0}
                                 
                                 }
                               }
                           }
                   }
                   }
                    
                  }catch(e){
                    log.debug('error pre--',e)
                  }
                  
                  
                 
                  if(arrKeys[e] == 3464510){
                      log.debug('3464510','odvPNumber '+odvPNumber+' odvTMpagada  '+odvTMpagada+' cust_promo '+cust_promo+' objInfo.e_virtual '+objInfo.e_virtual+' cont_pre '+cont_pre+' venta total propia '+(odvPNumber+odvTMpagada-cont_pre))
                  }  
                  if(odvPNumber+odvTMpagada > 0 && cust_promo !=1 && cust_promo !=5 && objInfo.e_virtual == false){
                   var total_venta_p =(odvPNumber+odvTMpagada-cont_pre)>0?(odvPNumber+odvTMpagada-cont_pre):0
                      // Venta propia 
                       
                     venta_propia = Math.abs(CompConfigDetails[conf]['esquemaVentasPresentadora'][total_venta_p]['compensacion'])
                     if(objInfo.internalid in cookFind){
                       log.debug('Aqui hay una cookey.internalid********',objInfo.internalid);
                       var num_cook = cookFind[objInfo.internalid].length;
                       //var value_less = Math.abs(CompConfigDetails[conf]['esquemaVentasPresentadora'][num_cook]['compensacion'])
                       //var value_add = Math.abs(CompConfigDetails[2]['esquemaVentasPresentadora'][num_cook]['compensacion'])
                       log.debug('Habemus CK','Presentadora : '+arrKeys[e]+' num_cook : '+num_cook)
                       //log.debug("cantidad de mas para la venta",value_less);
                       //log.debug("cantidad real que se debe sumar",value_add);
                       ck_ids = Object.keys(cookFind[objInfo.internalid])
                       log.debug('ck_ids',ck_ids)
                       comision_ck = num_cook*350
                       num_ck = num_cook
//                       venta_propia = venta_propia-value_less;
//                       venta_propia = venta_propia+value_add;
                    }
                   try{
                     //Comision Garantia 
                        if(objInfo.internalid in garantiaSales){
                            var numGarantias = garantiaSales[objInfo.internalid].length
                            var idsGarantias = garantiaSales[objInfo.internalid]
                            comisionGarantia = Math.abs(CompConfigDetails[9]['esquemaVentasPresentadora'][numGarantias]['compensacion'])
                            log.debug('comisionGarantia',comisionGarantia)
                        }//Fin Comision Garantia 
                   }catch(e){
                       log.debug('Error Garantia',e)
                   }
                   
                     
                     
                      
                      
                      // Entrega
                      entrega = Math.abs(CompConfigDetails[conf]['esquemaVentasPresentadora'][total_venta_p]['entrega'])
                      odv_ent = 0
                      ids_odv_ent = {}
                     
                      //1. Todas pagadas 2. Ninguna 3. Validacion 
                   
                      switch(cust_entrega){
                      case '1':
                          odv_ent = odvPNumber + odvTMpagada
                          
                          if(infoODVPromo.hasOwnProperty(arrKeys[e])){
                              if(Object.keys(ids_odv_ent).length >0){
                                ids_odv_ent.push(Object.keys(infoODVPromo[arrKeys[e]]))  
                              }else{
                                ids_odv_ent = Object.keys(infoODVPromo[arrKeys[e]])
                              }
                          
                          }
                          if(infoODVPromo_tm.hasOwnProperty(arrKeys[e])){
                            if(Object.keys(ids_odv_ent).length >0){
                              ids_odv_ent.push(Object.keys(infoODVPromo_tm[arrKeys[e]]))  
                              }else{
                                ids_odv_ent = Object.keys(infoODVPromo_tm[arrKeys[e]])
                              }
                            
                          }
                        break;
                        case '2':
                          entrega = 0
                        break;
                        case '3':
                           //Recorre las ODV y valida el campo entrega 
                            for (var i in  infoODVPromo[arrKeys[e]])
                            {
                              if ((infoODVPromo[arrKeys[e]][i][1]['entrega']) != ""){
                                odv_ent ++ 
                                ids_odv_ent.push(infoODVPromo[arrKeys[e]][i][1]['id'])
                              }
                            }
                            for (var i in  infoODVPromo_tm[arrKeys[e]])
                            {
                              if ((infoODVPromo_tm[arrKeys[e]][i][1]['entrega']) != ""){
                                  odv_ent ++ 
                                  ids_odv_ent.push(infoODVPromo_tm[arrKeys[e]][i][1]['id'])
                                }
                            }
                            
                          if(objInfo['nombramiento']!=''){
                              entrega = Math.abs(CompConfigDetails[conf]['esquemaVentasPresentadora'][odv_ent]['entrega'])
                              
                          }else{
                            entrega = 0
                          }
                        break;
                      }
                      
                      // Bono productividad
                      bono_productividad = CompConfigDetails['1']['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad']
                      
                      if(!Math.abs(bono_productividad) > 0){
                        bono_productividad = 0 
                      }
                      
                      //Bono emeral
                      //log.debug('Emerald 0',' Config '+conf+' total_venta_p '+total_venta_p)
                      //log.debug('Emerald 1',parseInt(CompConfigDetails[conf]['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad']))
                      //log.debug('Emerald 2',parseInt(CompConfigDetails['1']['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad']))
                      //log.debug('Emerald 3',parseInt(CompConfigDetails[conf]['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad']) - parseInt(CompConfigDetails['1']['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad']))
                      bono_emerald = parseInt(CompConfigDetails[conf]['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad']) - parseInt(CompConfigDetails['1']['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad'])
                      if(!Math.abs(bono_emerald) > 0){
                        bono_emerald = 0 
                      }
                      
                      //Bono Talento - Solo JDG
                      if(cust_type == 3){
                        if(arrKeys[e] in nombramiento){
                          bono_talento =20000 * Object.keys(nombramiento[arrKeys[e]]).length                          
                        }
                      } 
                  }
              }catch(e){
                log.debug('error ODV propias',e)
              }
              //ODV DE LAS RECLUTAS
              
            ODV_rec_pagadas = {}
              if( i_rec_data.hasOwnProperty(arrKeys[e])){
                try{
                    for(i in i_rec_data[arrKeys[e]] ){//Recorremos las reclutas de la JDG
                        var odv_comisionable_rec = 0
                        var cont_hist = 0 
                        var fecha_90_rec = reclutas_fecha_obj_2[i_rec_data[arrKeys[e]][i]][0]
                        var f_split = fecha_90_rec.split('/')
                        f_base = new Date(f_split[2],f_split[1]-1,f_split[0]) 
                        f_mas_2dias = f_base.getTime()+(2*24*60*60*1000) 
                        f_fecha_90_rec = new Date(f_mas_2dias)
                        //Historico ODV Rec
                          if(infoODVPromo_rec_historico.hasOwnProperty(i_rec_data[arrKeys[e]][i])){
                           
                            for (j in infoODVPromo_rec_historico[i_rec_data[arrKeys[e]][i]]){ //Recorremos las ODV para cada recluta
                                  var reac = true
                                  if (reactivacion[i_rec_data[arrKeys[e]][i]] != false){
                                    f1 = infoODVPromo_rec_historico[i_rec_data[arrKeys[e]][i]][j][1]['trandate']
                                    f2 = reactivacion[i_rec_data[arrKeys[e]][i]].split('/')
                                    f_odv =new Date(f1[2],f1[1],f1[0])
                                    f_rec = new Date(f2[2],f2[1],f2[0])
                                    if( f_odv <= f_rec){
                                      reac = false
                                    }
                                    
                                    
                                  }
                                  
                                      if(arrKeys[e] == infoODVPromo_rec_historico[i_rec_data[arrKeys[e]][i]][j][1]['reclutadora'] && reac){//Valida el campo RECRUITER de las ODV de las reclutas
                                        ODV_rec_pagadas[infoODVPromo_rec_historico[i_rec_data[arrKeys[e]][i]][j][1]['id']]=i_rec_data[arrKeys[e]][i]
                                        cont_hist  = cont_hist +1
                                      }  
                                       
                                    } 
                          }
                            
                          
                          
                            
                            try{
                              //Historico ODV Rec TM Pagadas
                                for (j in infoODVPromo_tm_rec_historico[i_rec_data[arrKeys[e]][i]]){ //Recorremos las ODV para cada recluta
                                  var reac = true
                                  if (reactivacion[i_rec_data[arrKeys[e]][i]] != false){
                                    f1 = infoODVPromo_tm_rec_historico[i_rec_data[arrKeys[e]][i]][j][1]['trandate']
                                    f2 = reactivacion[i_rec_data[arrKeys[e]][i]].split('/')
                                    f_odv =new Date(f1[2],f1[1],f1[0])
                                    f_rec = new Date(f2[2],f2[1],f2[0])
                                    if( f_odv <= f_rec){
                                      reac = false
                                    }
                                  }
                                      if(arrKeys[e] == infoODVPromo_tm_rec_historico[i_rec_data[arrKeys[e]][i]][j][1]['reclutadora'] && reac){//Valida el campo RECRUITER de las ODV de las reclutas
                                        ODV_rec_pagadas[infoODVPromo_tm_rec_historico[i_rec_data[arrKeys[e]][i]][j][1]['id']]=i_rec_data[arrKeys[e]][i]
                                        cont_hist = cont_hist +1
                                      }      
                                    }
                                
                                
                                //ODV Rec
                                var cont_odvs = 0
                                var cont_tres_dos = 0
                                if(infoODVPromo_rec.hasOwnProperty(i_rec_data[arrKeys[e]][i])){
                                  for (j in infoODVPromo_rec[i_rec_data[arrKeys[e]][i]]){ //Recorremos las ODV para cada recluta
                                    cont_odvs++
                                    //log.debug('all odv rec',infoODVPromo_rec[i_rec_data[arrKeys[e]][i]][j])
                                        if(arrKeys[e] == infoODVPromo_rec[i_rec_data[arrKeys[e]][i]][j][1]['reclutadora']){//Valida el campo RECRUITER de las ODV de las reclutas
                                            odv_rec_comisionable[infoODVPromo_rec[i_rec_data[arrKeys[e]][i]][j][1]['id']]=cont_odvs+cont_hist
                                            
                                            f_fecha_SO_rec = new Date(infoODVPromo_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate'][2],infoODVPromo_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate'][1]-1,infoODVPromo_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate'][0]) 
                                            //log.debug('0 fechas rec','infoODVPromo_rec '+infoODVPromo_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate']+'  f_fecha_SO_rec  '+f_fecha_SO_rec+' f_fecha_90_rec  '+f_fecha_90_rec)
                                            if(f_fecha_90_rec >= f_fecha_SO_rec){
                                                //log.debug('1 fechas rec','f_fecha_90_rec '+f_fecha_90_rec+' mayor  o igual que f_fecha_SO_rec'+f_fecha_SO_rec)
                                                odv_comisionable_rec  = odv_comisionable_rec +1
                                            }
                                        }      
                                      } 
                                }  
                              //ODV Rec TM Pagadas
                                for (j in infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]]){ //Recorremos las ODV para cada recluta
                                    //log.debug('all odv rec',infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]][j])
                                      if(arrKeys[e] == infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]][j][1]['reclutadora']){//Valida el campo RECRUITER de las ODV de las reclutas
                                        cont_odvs++
                                        odv_rec_comisionable[infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]][j][1]['id']]=cont_odvs+cont_hist
                                        
                                            f_fecha_SO_rec = new Date(infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate'][2],infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate'][1]-1,infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate'][0]) 
                                            //log.debug('0 fechas rec','infoODVPromo_tm_rec '+infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]][j][1]['trandate']+'  f_fecha_SO_rec  '+f_fecha_SO_rec+' f_fecha_90_rec  '+f_fecha_90_rec)
                                            if(f_fecha_90_rec >= f_fecha_SO_rec){
                                                //log.debug('1 fechas rec','f_fecha_90_rec '+f_fecha_90_rec+' mayor  o igual que f_fecha_SO_rec'+f_fecha_SO_rec)
                                                odv_comisionable_rec  = odv_comisionable_rec +1
                                            }
                                      }      
                                    }
                            }catch(e){
                              log.debug('error tm pagadas rec',e)
                            }
                          
//                            
                            /* if(arrKeys[e] == 54846 ){
                               log.debug('infoODVPromo_rec de: '+i_rec_data[arrKeys[e]][i],infoODVPromo_rec[i_rec_data[arrKeys[e]][i]])
                               log.debug('infoODVPromo_tm_rec de: '+i_rec_data[arrKeys[e]][i],infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]])
                               log.debug('infoODVPromo_rec_historico de: '+i_rec_data[arrKeys[e]][i],infoODVPromo_rec_historico[i_rec_data[arrKeys[e]][i]])                           
                               log.debug('infoODVPromo_tm_rec_historico de: '+i_rec_data[arrKeys[e]][i],infoODVPromo_tm_rec_historico[i_rec_data[arrKeys[e]][i]])

                               log.debug('cont_odvs', cont_odvs)
                               log.debug('cont_hist', cont_hist)
                               log.debug('recluta', i_rec_data[arrKeys[e]][i])
                               log.debug('odv_rec_comisionable', odv_rec_comisionable)
                               log.debug('odv_comisionable_rec', odv_comisionable_rec)
                             }
                            */
                          //Bono reclutadora 
                            cont_hist = cont_hist +1
                            var vueltas=0
                            //Decidir configuracion de Reclutamiento
                            var configuracion_rec
                            
                            if(odv_comisionable_rec > 0){
                            for (k = cont_hist; k < (odv_comisionable_rec+cont_hist) && k <= 6; k++ ){//&& arrKeys[e]!= 68746
//                            Acumulado de la compensacion segun su mumero de ventas por recluta
                              //log.debug('Empieza a partir de: ',cont_hist + ' Numero de ODV Comisionables: '+odv_comisionable_rec)
                              //log.debug('ID : Rec:'+i_rec_data[arrKeys[e]][i]+' Comisionables para: '+arrKeys[e],odv_rec_comisionable)
                              if(i_rec_data[arrKeys[e]][i] in conf_rec){
                                log.debug('conf_rec[arrKeys[e]]',conf_rec[arrKeys[e]])
                                configuracion_rec = conf_rec[i_rec_data[arrKeys[e]][i]]
                                }else{
                                configuracion_rec = 1
                                }
                              bono_reclutadora= bono_reclutadora + Math.abs(CompConfigDetails[configuracion_rec]['esquemaVentasReclutamiento'][k]['compensacion'])
                              /*log.debug('k configuracion_rec',configuracion_rec)
                              
                              log.debug('bono_reclutadora',bono_reclutadora)
                              log.debug('k Reclutamiento',k)*/
                              vueltas++
                                }
                            }
//                           Total de ODV de las reclutas 
                           if(infoODVPromo_rec.hasOwnProperty([i_rec_data[arrKeys[e]][i]])){
                                 odv_rec =odv_rec + Object.keys(infoODVPromo_rec[i_rec_data[arrKeys[e]][i]]).length
                           }
                          //Total de ODV TM de las reclutas 
                           if(infoODVPromo_tm_rec.hasOwnProperty([i_rec_data[arrKeys[e]][i]])){
                             odvTMpagada_rec = odvTMpagada_rec + parseInt(Object.keys(infoODVPromo_tm_rec[i_rec_data[arrKeys[e]][i]]).length);
                           }
                    }  
//                    if(arrKeys[e] == 39686 ){
//                      log.debug('ODV_rec_pagadas ',ODV_rec_pagadas)
//                    }
                 //devuelve valor a 0 si bono es '' o es estructura virtual
                    if(objInfo.e_virtual == true || bono_reclutadora <= 0 ){
                      bono_reclutadora = 0;
                    }
                }catch(e){
                  log.debug('ERROR odv de las reclutas',e)
                }
                  
              }
              
                
              // ODV DE LAS PRESENTADORAS
              try{
            
              if(cust_type == 3){
              
                if(arrKeys[e] in i_pre_data){
                var sum = 0
                var odv_pre_comisionables= []
                var odv_pre_comisionables_aux = [] //borrar //trabajar
                var recluta_LE = {}
                var odv_reclutas_sc = {}
                var Supercomision = 0
                var arrODVSC = {}
                  for(i in i_pre_data[arrKeys[e]] ){//Recorremos a las presentadoras del equipo de la LE
                    var pre_aiux = i_pre_data[arrKeys[e]][i] //id Presentadora 
                    
                    if(infoODVPromo_pre[i_pre_data[arrKeys[e]][i]] != null){//Valida si la presentadora tiene ventas en el arreglo infoODVPromo_pre
                      sum =sum + Object.keys(infoODVPromo_pre[i_pre_data[arrKeys[e]][i]]).length  
                      odv_pre_comisionables.push(Object.keys(infoODVPromo_pre[i_pre_data[arrKeys[e]][i]]))
                      // Se llena el arreglo odv_reclutas_tres_dos
                      //if(arrKeys[e] == 905233){
                        //log.debug('reclutas_tres_dos',reclutas_tres_dos)
                      /*if(arrKeys[e] in reclutas_tres_dos){//Valida si existe la lider en el resultado de la busqueda de presentadoras 3 + 2, Arreglo con presentadoras reclutadas en el mismo periodo calculado
                        
                        
                        
                        if(reclutas_tres_dos[arrKeys[e]].indexOf(i_pre_data[arrKeys[e]][i]) >= 0){//Valida si la recluta existe en el arreglo de reclutas del mismo periodo
                        odv_reclutas_tres_dos[i_pre_data[arrKeys[e]][i]] = Object.keys(infoODVPromo_pre[i_pre_data[arrKeys[e]][i]])
                       
                        if(arrKeys[e] in recporLE){
                          if(recporLE[arrKeys[e]].indexOf(i_pre_data[arrKeys[e]][i]) >= 0){
                                recluta_LE[i_pre_data[arrKeys[e]][i]] = Object.keys(infoODVPromo_pre[i_pre_data[arrKeys[e]][i]])
                            }  
                        }
                            
                        }
                      }*/
                      //Nuevo y renovado y fresco 3+2 
                      if( ventasPresentadorareclutas_tres_dos.hasOwnProperty(i_pre_data[arrKeys[e]][i]) ){
                            
                            presentadorasActivasDelLE ++
                            var presentador  = i_pre_data[arrKeys[e]][i]
                            var internalidPedidoPresentador = Object.keys(ventasPresentadorareclutas_tres_dos[presentador])
                            var nopedido = ventasPresentadorareclutas_tres_dos[presentador][Object.keys(ventasPresentadorareclutas_tres_dos[presentador])]['noDocument']
                            ventasTresdosData[internalidPedidoPresentador] = {NoPedido:nopedido, Presentador:presentador}
                            log.debug('ventasTresdosData',ventasTresdosData)
                        }
                      //Supercomision
                      if(arrKeys[e] in rec_sc){//Valida si existe la lider en el resultado de la busqueda de presentadoras SC, Arreglo con presentadoras reclutadas despues de 1/2/2022 sin importar recluta
                        
                        if(rec_sc[arrKeys[e]].indexOf(i_pre_data[arrKeys[e]][i]) >= 0 ){//Valida si la recluta existe en el arreglo de reclutas post febrero
                       
                        
                        
                        odv_reclutas_sc[i_pre_data[arrKeys[e]][i]] = Object.keys(infoODVPromo_pre[i_pre_data[arrKeys[e]][i]])
                            var ovd_pre_object_keys = Object.keys(infoODVPromo_pre[i_pre_data[arrKeys[e]][i]])
                            var cont_odv_pre = 0
                            var scODV = []
                            for(p in ovd_pre_object_keys){

                                if(ovd_pre_object_keys[p] in odv_objetivo_2 || odv_objetivo_2.hasOwnProperty(ovd_pre_object_keys[p]) ){
                                   
                                    cont_odv_pre += 1//Ventas del periodo y dentro de la fecha de objetivo
                                    //log.debug('4 ovd_pre_object_keys[p] Esta orden comision SC del presentador: '+pre_aiux,ovd_pre_object_keys[p])
                                    scODV.push(ovd_pre_object_keys[p])
                                    arrODVSC[pre_aiux] = scODV
                                }

                            }
                            

                            if(i_pre_data[arrKeys[e]][i] in pre_num_ventas || pre_num_ventas.hasOwnProperty(i_pre_data[arrKeys[e]][i]) ){
                                var odp_pre = cont_odv_pre
                                var falta = pre_num_ventas[i_pre_data[arrKeys[e]][i]]['falta']
                                if(odp_pre >= falta ){
                                    Supercomision += falta
                                }else{
                                    Supercomision +=   odp_pre 
                                }
                               
                            }else{
                                
                                Supercomision += cont_odv_pre
                            }
                        
                        }
                      }
                      //}
                      
                      
                    }
                    if(infoODVPromo_tm_pre[i_pre_data[arrKeys[e]][i]] != null){
                      sum =sum + Object.keys(infoODVPromo_tm_pre[i_pre_data[arrKeys[e]][i]]).length  
                      odv_pre_comisionables.push(Object.keys(infoODVPromo_tm_pre[i_pre_data[arrKeys[e]][i]]))
                          odvTMpagada_pre = odvTMpagada_pre + parseInt(Object.keys(infoODVPromo_tm_pre[i_pre_data[arrKeys[e]][i]]).length)
                        // Se llena el arreglo odv_reclutas_tres_dos
                     /* if(arrKeys[e] in reclutas_tres_dos){
                        if(reclutas_tres_dos[arrKeys[e]].indexOf(i_pre_data[arrKeys[e]][i]) > 0 ){
                        odv_reclutas_tres_dos[i_pre_data[arrKeys[e]][i]] += Object.keys(infoODVPromo_tm_pre[i_pre_data[arrKeys[e]][i]])
                        }
                      }*/

                      //Nuevo y renovado y fresco 3+2 
                      if( ventasPresentadorareclutas_tres_dos.hasOwnProperty(i_pre_data[arrKeys[e]][i]) ){
                            presentadorasActivasDelLE ++
                            var presentador  = i_pre_data[arrKeys[e]][i]
                            var internalidPedidoPresentador = Object.keys(ventasPresentadorareclutas_tres_dos[presentador])
                            var nopedido = ventasPresentadorareclutas_tres_dos[presentador][Object.keys(ventasPresentadorareclutas_tres_dos[presentador])]['noDocument']
                            ventasTresdosData[internalidPedidoPresentador] = {NoPedido:nopedido, Presentador:presentador}
                            log.debug('ventasTresdosData',ventasTresdosData)
                        }


                      if(arrKeys[e] in rec_sc){
                        if(rec_sc[arrKeys[e]].indexOf(i_pre_data[arrKeys[e]][i]) > 0 ){
                        odv_reclutas_sc[i_pre_data[arrKeys[e]][i]] += Object.keys(infoODVPromo_tm_pre[i_pre_data[arrKeys[e]][i]])



                        var ovd_pre_object_keys = Object.keys(infoODVPromo_tm_pre[i_pre_data[arrKeys[e]][i]])
                            var cont_odv_pre = 0
                            var scODV_TM = []
                            for(i in ovd_pre_object_keys){
                                if(ovd_pre_object_keys[i] in odv_objetivo_2 || odv_objetivo_2.hasOwnProperty(ovd_pre_object_keys[i]) ){
                                    cont_odv_pre += 1
                                    scODV_TM.push(ovd_pre_object_keys[i])
                                    arrODVSC[pre_aiux] = scODV_TM
                                }
                            }
                        
                         if(i_pre_data[arrKeys[e]][i] in pre_num_ventas_tm_p || pre_num_ventas_tm_p.hasOwnProperty(i_pre_data[arrKeys[e]][i]) ){
                                var odp_pre = cont_odv_pre
                                //log.debug('pre_num_ventas_tm_p[i_pre_data[arrKeys[e]][i]]',pre_num_ventas_tm_p[i_pre_data[arrKeys[e]][i]])
                                var falta = pre_num_ventas_tm_p[i_pre_data[arrKeys[e]][i]]['falta']
                                if(odp_pre > falta ){
                                    Supercomision +=   odp_pre - (odp_pre - falta)
                                    //log.debug('ostia','odp_pre '+odp_pre+' falta '+falta)
                                }else{
                                    Supercomision +=   odp_pre 
                                }
                               
                            }else{
                                Supercomision += cont_odv_pre
                            }
                        }
                      }
                        
                    }

                      
                  }
                  //Venta equipo
                var porcentaje
                var t_venta_propia=odvPNumber+(odvTMpagada>0?odvTMpagada:0)
            for ( i in CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'] ){
              var desde = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['desde']
              var hasta = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['hasta']
              if (t_venta_propia >= desde && t_venta_propia <= hasta){
                porcentaje = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['porcentaje']
                break;
              }
            }
                
                  try{
                      if(t_venta_propia >0 ){
                      num_=Object.keys(CompConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'])
                      inf=CompConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo']
                      for(num_ in inf ){//Recorre la configuracion hasta entrar en el rango de ventas
                        var hasta= CompConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'][num_]['hasta']
                          var desde= CompConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'][num_]['desde']
                        if(sum >= desde && sum <= hasta){
                          venta_equipo = (CompConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'][num_]['compensacion'])*(parseInt(porcentaje)/100)
                          
                           break;
                        }
                      }
                   
                      if(!Math.abs(venta_equipo) > 0 || objInfo.e_virtual == true ){
                        venta_equipo = 0 
                        }
                     }
                      
                  }catch(e){
                      log.debug('error odv pre  ')
                  }
                  

                  
              }
              }
              }catch(e){
                log.debug('Error ODV DE LAS PRESENTADORAS',e)
              } 
              // Fin ODV DE LAS PRESENTADORAS
              
              //3 + 2 
              var v_total = odvPNumber+(odvTMpagada>0?odvTMpagada:0)+(odvTMganada>0?odvTMganada:0)
              /*try{
                var bono_tres_dos = 0
                if(Object.keys(odv_reclutas_tres_dos).length >=2 && v_total > 2 && Object.keys(recluta_LE).length >=1){//Reclutas juntan almenos 2 ventas y el LE tiene al menos 3 ventas 
                    
                    bono_tres_dos = 5000
                }
              }catch(e){
                Log.debug('Error 3 + 2 ',e)
              }
              //5 + 2 
              try{
                var bono_cinco_dos = 0
                
                if(Object.keys(odv_reclutas_tres_dos).length >=2 && v_total > 4 && Object.keys(recluta_LE).length >=1 ){//Tiene 2 o mas reclutas contratadas en el periodo con almenos 1 venta, la LE tiene almenos 5 ventas, Almenos una recluta fue reclutada por la LE
                    //log.debug('recluta_LE',recluta_LE)
                    //log.debug('odv_reclutas_tres_dos',odv_reclutas_tres_dos)
                    //log.debug('odvPNumber',odvPNumber)
                    bono_cinco_dos = 8000
                    bono_tres_dos = 0
                }
              }catch(e){
                Log.debug('Error 5 + 2 ',e)
              }
                */



              //log.debug('Valores antes de nuevo 3+2','bono_cinco_dos '+bono_cinco_dos+' bono_tres_dos '+bono_tres_dos)

              if(presentadorasActivasDelLE >=2 && v_total > 4){
                    bono_cinco_dos = 8000
                    bono_tres_dos = 0
              }else if(presentadorasActivasDelLE >=2 && v_total > 2){
                bono_tres_dos = 5000
                bono_cinco_dos = 0
              }

            //log.debug('Valores post nuevo 3+2','bono_cinco_dos '+bono_cinco_dos+' bono_tres_dos '+bono_tres_dos)
              //Fin 3 + 2
              //Parche 
              /*if(arrKeys[e] == 15355 || arrKeys[e] == 37453 || arrKeys[e] == 2141633 || arrKeys[e] == 2227423 || arrKeys[e] == 2227424 || arrKeys[e] == 2235478 || arrKeys[e] == 2236907 || arrKeys[e] == 2276457 || arrKeys[e] == 2279300 || arrKeys[e] == 2425369 ){
                venta_propia = 0
                entrega = 0
                bono_productividad = 0
              }*/
              //Fin parche 
              //SET -------------
              bono_talento = 0 //Pausado Bono talento
              if(Supercomision < 0){
                Supercomision = 0
              }
              subtotal = (parseInt(venta_propia)+parseInt(entrega)+parseInt(venta_equipo)+parseInt(bono_productividad)+parseInt(bono_emerald)+parseInt(bono_talento)+parseInt(bono_reclutadora)+parseInt(comision_ck)+parseInt(comisionGarantia)+parseInt(bono_tres_dos)+parseInt(bono_cinco_dos)+parseInt(Supercomision*500))
              if(arrKeys[e] == 3749925 || arrKeys[e] == 3864070){
                log.debug('venta_propia',venta_propia
                +' entrega: '+entrega
                +' venta_equipo: '+venta_equipo
                +' bono_productividad: '+bono_productividad
                +' bono_emerald: '+bono_emerald
                +' bono_talento: '+bono_talento
                +' bono_reclutadora: '+bono_reclutadora
                +' comisionGarantia: '+comisionGarantia
                +' bono_tres_dos: '+bono_tres_dos
                +' bono_cinco_dos: '+bono_cinco_dos
                +' Supercomision*500: '+(Supercomision*500)
                + 'subtotal:  '+subtotal
                       )
              }
              
              if(subtotal > 0 || cust_promo ==1 || cust_promo ==5){               //excluye a las presentadoras que no generaron ningun tipo de bono

                cont_line ++
                  if(objInfo.altname != ""){
                      sublist.setSublistValue({
                                 id : 'nombre',
                                 line : cont_line,
                                 value : objInfo.altname
                             });
                    }
//                    if(objInfo.employeetype != ""){
//                          sublist.setSublistValue({
//                                 id : 'type',
//                                 line : e,
//                                 value : objInfo.employeetype
//                             });
//                    }
//                    if(objInfo.internalid != ""){
//                          sublist.setSublistValue({
//                               id : 'employeeid',
//                               line : e,
//                               value : objInfo.internalid
//                           });
//                    }
//                    if(objInfo.custentity_promocion != ""){
//                           sublist.setSublistValue({
//                               id : 'promocion',
//                               line : e,
//                               value : objInfo.custentity_promocion
//                           });
//                    }
              //Sub-Total y Total
                if(objInfo.internalid in cookFind){
                     sublist.setSublistValue({
                         id : 'custentity_cookkey',
                         line : cont_line,
                         value : num_ck
                       });
                     sublist.setSublistValue({
                         id : 'custentity_cookkey_comision',
                         line : cont_line,
                         value : comision_ck
                       });
                }
                //Set Garantia 
                if(objInfo.internalid in garantiaSales){
                 sublist.setSublistValue({
                        id : 'custentity_garantia_num',
                        line : cont_line,
                        value : garantiaSales[objInfo.internalid].length
                      });
                 sublist.setSublistValue({
                        id : 'custentity_garantia_monto',
                        line : cont_line,
                        value : comisionGarantia
                      });
                sublist.setSublistValue({
                    id : 'custentity_bono_garantia_ids',
                    line : cont_line,
                    value : garantiaSales[objInfo.internalid].join(',')
                  });
               }
              if(subtotal > 0){
                sublist.setSublistValue({
                    id : 'custentity_total',
                    line : cont_line,
                    value : subtotal
                  });
              }
                      if(objInfo.custentity123 != ""){  
                      sublist.setSublistValue({
                          id : 'ingreso',
                          line : cont_line,
                          value : objInfo.custentity123
                         });
                      }
                    if(objInfo.custentity_delegada != ""){
                      sublist.setSublistValue({
                             id : 'delegadas',
                             line : cont_line,
                             value : objInfo.custentity_delegada
                      });
                    }
                    if(objInfo.custentity_reclutadora != ""){
                      sublist.setSublistValue({
                           id : 'reclutadora',
                         line : cont_line,
                         value : objInfo.custentity_reclutadora
                     });
                    }
                    if(objInfo.hiredate != ""){
                      sublist.setSublistValue({
                           id : 'hiredate',
                           line : cont_line,
                           value : objInfo.hiredate
                      });
                    }
                    if(objInfo.hiredate != "" && (cust_promo==1 || cust_promo==5) ){
                      if(objInfo.fecha_reactivacion != ''){
                        sublist.setSublistValue({
                                id : 'fecha_reactivacion',
                                line : cont_line,
                                value : objInfo.fecha_reactivacion
                           }); 
                      }
                        
                      }
                    if(objInfo.custentity_nombre_unidad != ""){
                      sublist.setSublistValue({
                         id : 'custentity_nombre_unidad',
                         line : cont_line,
                         value : objInfo.custentity_nombre_unidad
                      });
                    } 
                    
                    if(arrKeys[e] in information_rec.data){
                      sublist.setSublistValue({
                             id : 'custentity_reclutas',
                             line : cont_line,
                             value : i_rec_data[arrKeys[e]].join(',')
                      });
                    }
                    if(objInfo.e_virtual == false){
                    if(odvPNumber > 0){
                      sublist.setSublistValue({
                            id : 'custentity_odv_jdg',
                            line : cont_line,
                            value : odvPNumber
                     });
                    }
                    if(odvPNumber > 0){
                        sublist.setSublistValue({
                              id : 'custentity_total_ventas_p',
                              line : cont_line,
                              value : odvPNumber+(odvTMpagada>0?odvTMpagada:0)
                       });
                      }
                    if(odvPNumber+(odvTMpagada>0?odvTMpagada:0)+(odvTMganada>0?odvTMganada:0) > 0){
                        sublist.setSublistValue({
                              id : 'custentity_suma_ventas_total',
                              line : cont_line,
                              value : odvPNumber+(odvTMpagada>0?odvTMpagada:0)+(odvTMganada>0?odvTMganada:0)
                       });
                      }
                   
                    
                    if(odvTMpagada != ''){
                      sublist.setSublistValue({
                            id : 'custentity_tmpagada',
                            line : cont_line,
                            value : odvTMpagada
                     });
                    }
                    if(odvTMganada >0){
                        sublist.setSublistValue({
                              id : 'custentity_tm_ganadas_num',
                              line : cont_line,
                              value : odvTMganada
                       });
                    }
                    if(venta_propia > 0){
                      sublist.setSublistValue({
                            id : 'custentity_venta_propia',
                            line : cont_line,
                            value : venta_propia
                     });
                    }
                    if(entrega > 0){
                      //Importe entrega
                        sublist.setSublistValue({
                            id : 'custentity_entrega',
                            line : cont_line,
                            value : entrega
                        });
                    }
                    if(odv_ent >0 && (cust_promo !=1 || cust_promo!=5)){
                      //Num Entregas pagadas
                        sublist.setSublistValue({
                            id : 'custentity_num_entrega',
                            line : cont_line,
                            value : odv_ent
                        });
                    }
                    if(ids_odv_ent != '' && (cust_promo !=1 || cust_promo!=5)){
                      if(typeof ids_odv_ent == "object" ){
                        id_vp = ids_odv_ent.join(',')
                      }else{
                        id_vp = ids_odv_ent
                      }
                      //ODV comisionables a entrega
                        sublist.setSublistValue({
                            id : 'custentity_odv_entrega',
                            line : cont_line,
                            value : id_vp
                        });
                            sublist.setSublistValue({
                                  id : 'custentity_odv_jdg_ids',
                                  line : cont_line,
                                  value : id_vp
                              });
                    }else if (cust_promo ==1 || cust_promo ==5){//TxTM No tiene entrega por lo que no aplica la misma regla 
                        try{
                            var ids_txtm = Object.keys(infoODVPromo[arrKeys[e]])
                            if(typeof ids_txtm == "object" ){
                                id_vp = ids_txtm.join(',')
                              }else{
                                id_vp = ids_txtm
                              }
                            sublist.setSublistValue({
                                id : 'custentity_odv_jdg_ids',
                                line : cont_line,
                                value : id_vp
                            });
                        }catch(e){

                        }
                    }
           }
                 if(bono_productividad > 0 && (cust_promo !=1 || cust_promo!=5)){
                  sublist.setSublistValue({
                         id : 'custentity_bono_productividad',
                         line : cont_line,
                         value : bono_productividad
                     });
                 }else{
                  bono_productividad = 0 
                 }
                 if(bono_emerald > 0 && (cust_promo !=1 || cust_promo!=5)){
                   sublist.setSublistValue({
                         id : 'custentity_bono_emerald',
                         line : cont_line,
                         value : bono_emerald
                     }); 
                 }else{
                   bono_emerald =0 
                 }
                 if(bono_talento > 0 && (cust_promo !=1 || cust_promo!=5)){
                   sublist.setSublistValue({
                         id : 'custentity_bono_talento',
                             line : cont_line,
                             value : bono_talento
                      }); 
                 }
                try{
                  // Num ODV de las reclutas          
                    if(odv_rec != ''){
                      sublist.setSublistValue({
                            id : 'custentity_odv_rec',
                            line : cont_line,
                            value : odv_rec
                          });
                    }
                    if(bono_reclutadora > 0){
                      sublist.setSublistValue({
                            id : 'custentity_bono_rec',
                            line : cont_line,
                            value : bono_reclutadora
                          }); 
                    }else{
                     bono_reclutadora = 0
                    }
                    if(odvTMpagada_rec != ''){
                    // TM Pagadas rec
                        sublist.setSublistValue({
                          id : 'custentity_tmpagada_rec',
                          line : cont_line,
                          value : odvTMpagada_rec
                        });
                    }
                    if(Object.keys(odv_rec_comisionable).length > 0 ){
                    //ODV comisionables 
                        sublist.setSublistValue({
                          id : 'custentity_odv_comisionables_rec',
                          line : cont_line,
                          value :JSON.stringify(odv_rec_comisionable)
                        });
                    }
                    if(/*Object.keys(odv_reclutas_tres_dos).length > 0*/ bono_tres_dos>0 || bono_cinco_dos > 0 ){
                    //ODV comisionables 3+2 
                        /*sublist.setSublistValue({//'Reclutas y ODV del periodo mismo equipo'
                          id : 'custentity_odv_rec_del_periodo',
                          line : cont_line,
                          value :JSON.stringify(odv_reclutas_tres_dos)
                        });
                        sublist.setSublistValue({//'Reclutas y ODV Por recluta del LE del periodo'
                          id : 'custentity_odv_rec_de_le_del_periodo',
                          line : cont_line,
                          value :JSON.stringify(recluta_LE)
                        });
                        sublist.setSublistValue({//'Reclutas con ventas'
                          id : 'custentity_rec_con_ventas',
                          line : cont_line,
                          value :Object.keys(odv_reclutas_tres_dos).length
                        });
                        */
                        sublist.setSublistValue({//'Reclutas con ventas'
                          id : 'custentity_rec_con_ventas',
                          line : cont_line,
                          value :JSON.stringify(ventasTresdosData)
                        });
                    
                        sublist.setSublistValue({//'Bono 3 + 2'
                          id : 'custentity_bono_tres_dos',
                          line : cont_line,
                          value :bono_tres_dos
                        });

                        sublist.setSublistValue({//'Bono 5 + 2'
                          id : 'custentity_bono_cinco_dos',
                          line : cont_line,
                          value :bono_cinco_dos
                        });
                    }
                    if(Supercomision > 0){
                        //Supersomision
                        sublist.setSublistValue({//'ODV Por recluta del mes del Equipo SC'
                          id : 'custentity_odv_pre_supercomision',
                          line : cont_line,
                          value :JSON.stringify(arrODVSC)
                        });
                        
                        sublist.setSublistValue({//'Numero de ventas SC'
                          id : 'custentity_ventas_sc',
                          line : cont_line,
                          value :Supercomision
                        });

                        sublist.setSublistValue({//'Bono SUPERCOMISIÓN'
                          id : 'custentity_bono_sc',
                          line : cont_line,
                          value :Supercomision*500
                        });

                    }
                    if(cust_type == 3  && (cust_promo !=1 || cust_promo!=5)){
                      if(  arrKeys[e] in information_pre.data){
                            //ids de las presentadoras
                            sublist.setSublistValue({
                                   id : 'custentity_presentadoras',
                                   line : cont_line,
                                   value : i_pre_data[arrKeys[e]].join(',')
                            });
                          } 
                    }
                   
                }catch(e){
                  log.debug('Error set Rec',e)
                }
                try{
                   if( cust_type == 3){
                         //Num ODV de las Presentadoras
                        if((sum-odvTMpagada_pre) >0){
                          sublist.setSublistValue({
                                    id : 'custentity_odv_pre',
                                    line : cont_line,
                                    value : sum-odvTMpagada_pre
                            });
                        }
                            
                            if(odvTMpagada_pre != ''){
                             //TM Pagadas Presentadoras
                                 sublist.setSublistValue({
                                     id : 'custentity_tmpagada_pre',
                                     line : cont_line,
                                     value : odvTMpagada_pre
                                 });
                             }
                             if(venta_equipo > 0 ){
                              sublist.setSublistValue({
                                     id : 'custentity_venta_equipo',
                                     line : cont_line,
                                     value :venta_equipo 
                              }); 
                             }
                             if(venta_equipo > 0 ){
                                 sublist.setSublistValue({
                                        id : 'custentity_porcentaje',
                                        line : cont_line,
                                        value :porcentaje 
                                 }); 
                                }
                             if(odv_pre_comisionables != ''){
                             //Ids odv
                                 sublist.setSublistValue({
                                       id : 'custentity_odv_comisionables_pre',
                                       line : cont_line,
                                       value : odv_pre_comisionables.join(',')
                                   });
                             }
                           
                        }
                }catch(e){
                  log.debug('Error set Rec 2',e)
                }
              }//Fin validacion monto > 0
             }catch(err){
               log.error("Error create list "+e,err);
               log.error("error info lis",objInfo)
             }
              
           } 
           
           log.debug('creditos 2',runtime.getCurrentScript().getRemainingUsage()); 
       return form;
      
    }catch(e){
      log.debug("error sublista",e)
      log.debug('creditos 2',runtime.getCurrentScript().getRemainingUsage()); 
    }   
   }
   function getCookey(idPeriod){
     try{
       var period = Utils.getObjPeriod(idPeriod);
       log.debug('getCookey period',period);
       var objCKRep = {};
       var mySearch = search.load({
               id: 'customsearch_search_cookey'
           });
       mySearch.filters.push(search.createFilter({
               name: 'trandate',
               operator: 'within',
               values: [period['startDate'],period['endDate']]
           }));
       mySearch.run().each(function(r) {
         var salrep = r.getValue('salesrep')
               if(salrep in objCKRep){
                 objCKRep[salrep].push(r.getValue('internalid'));
               }else{
                 objCKRep[salrep]= [r.getValue('internalid')]; 
               }
           });
//       objCKRep ={}
       return objCKRep;
     }catch(err){
       log.error("error getCooke",err);
     }
   }
   //Garantia
   function getGarantia(idPeriod){
         try{
           var period = Utils.getObjPeriod(idPeriod);
           log.debug('getGarantia period',period);
           var objGarantiaRep = {};
           var mySearch = search.load({
                   id: 'customsearch_vw_garantia'
               });
           mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: [period['startDate'],period['endDate']]
               }));
           var pagedResults = mySearch.runPaged();
           pagedResults.pageRanges.forEach(function (pageRange){
               var currentPage = pagedResults.fetch({index: pageRange.index});
               currentPage.data.forEach(function (r) {
             var salrep = r.getValue('salesrep')
                   if(salrep in objGarantiaRep){
                       objGarantiaRep[salrep].push(r.getValue('internalid'));
                   }else{
                       objGarantiaRep[salrep]= [r.getValue('internalid')]; 
                   }
               });

         });
           return objGarantiaRep;
         }catch(err){
           log.error("error getGarantia",err);
         }
       }

   function historico_pre_sc(idPeriod){//busqueda de presentadoras y sus ventas desde que inicia SC para validar si las ventas del periodo comisionan
         try{
           var period = Utils.getObjPeriod(idPeriod);
           //log.debug('historico_pre_sc period',period);
           var historico_pre_sc = {};
           var mySearch = search.load({
                   id: 'customsearch_odv_pre_sc'
               });
           mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: ['01/06/2023',period['startDate']]
               }));
           var pagedResults = mySearch.runPaged();
           pagedResults.pageRanges.forEach(function (pageRange){
               var currentPage = pagedResults.fetch({index: pageRange.index});
               currentPage.data.forEach(function (r) {
                var values = r.getAllValues();
                //log.debug('values',values)
                num_h = parseInt(values['COUNT(tranid)'][0])
                presentadora = parseInt(values['GROUP(salesrep)'][0]['value'])
                tmR = parseInt(values['GROUP(salesRep.custentity_conf_rec)'][0]['value'])
                var comisionan = 0
                var falta = 0
                if(tmR == 11 || tmR == 12 || tmR == 13){//Si su TM es R o CC12 solo comisiona 4 ventas
                    tmR = true
                    comisionan = 4
                    falta = comisionan - num_h
                }else{
                    tmR = false
                    comisionan = 6
                    falta = comisionan - num_h
                }
                if(falta < 0){
                    falta=0
                }
                historico_pre_sc[presentadora] = {
                    num_h:num_h, //ODV historico
                    presentadora:presentadora,
                    tmR:tmR,
                    comisionan:comisionan,//Numero de ordenes que comisionan a nivel configuracion 
                    falta:falta// Ordenes que comisionan menos ordenes que tiene 
                }
                        return true;    
                
                });

         });
           return historico_pre_sc;
         }catch(err){
           log.error("error historico_pre_sc",err);
         }
       }


       function historico_pre_sc_tm_p(idPeriod){//busqueda de presentadoras y sus ventas desde que inicia SC para validar si las ventas del periodo comisionan
         try{
           var period = Utils.getObjPeriod(idPeriod);
           //log.debug('historico_pre_sc period',period);
           var historico_pre_sc = {};
           var mySearch = search.load({
                   id: 'customsearch1942'
               });
           mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: ['01/06/2023',period['startDate']]
               }));
           var pagedResults = mySearch.runPaged();
           pagedResults.pageRanges.forEach(function (pageRange){
               var currentPage = pagedResults.fetch({index: pageRange.index});
               currentPage.data.forEach(function (r) {
                var values = r.getAllValues();
                //log.debug('values',values)
                num_h = parseInt(values['COUNT(tranid)'][0])
                presentadora = parseInt(values['GROUP(salesrep)'][0]['value'])
                tmR = parseInt(values['GROUP(salesRep.custentity_conf_rec)'][0]['value'])
                var comisionan = 0
                var falta = 0
                if(tmR == 11 || tmR == 12 || tmR == 13){//Si su TM es R o CC12 solo comisiona 4 ventas
                    tmR = true
                    comisionan = 4
                    falta = comisionan - num_h
                }else{
                    tmR = false
                    comisionan = 6
                    falta = comisionan - num_h
                }
                if(falta < 0){
                    falta=0
                }
                historico_pre_sc[presentadora] = {
                    num_h:num_h, //ODV historico
                    presentadora:presentadora,
                    tmR:tmR,
                    comisionan:comisionan,//Numero de ordenes que comisionan a nivel configuracion 
                    falta:falta// Ordenes que comisionan menos ordenes que tiene 
                }
                        return true;    
                   });

         });
           return historico_pre_sc;
         }catch(err){
           log.error("error historico_pre_sc",err);
         }
       }
   

//Validacion fecha objetivo 2 SC
     function fechaobjetivo2SC(idPeriod){
         try{
           var period = Utils.getObjPeriod(idPeriod);
           //log.debug('fechaobjetivo2SC period',period);
           var objGarantiaRep = {};
           var mySearch = search.load({
                   id: 'customsearch1943'
               });
           mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: [period['startDate'],period['endDate']]
               }));
           var pagedResults = mySearch.runPaged();
           pagedResults.pageRanges.forEach(function (pageRange){
               var currentPage = pagedResults.fetch({index: pageRange.index});
               currentPage.data.forEach(function (r) {
                var values = r.getAllValues();
                //log.debug('values',values)

             var salesrep = r.getValue('salesrep')
             //log.debug('---salesrep---',salesrep)
             var internalid = r.getValue('internalid')
             var trandate = stringtodate(r.getValue('trandate'))
             var obj2
             if(values['salesRep.custentity_fin_objetivo_2_reactivacion'] == ''){
                 obj2 = stringtodate(values['salesRep.custentity_fin_objetivo_2'] )
             }else{
                obj2 = stringtodate(values['salesRep.custentity_fin_objetivo_2_reactivacion'] )
            }
            //log.debug('values','Date  '+trandate+'  obj2  '+obj2)
                   if(obj2 >= trandate){
                       objGarantiaRep[internalid]= [r.getValue('trandate')];
                   }
                   return true;
               });
            return true;
         });
           return objGarantiaRep;
         }catch(err){
           log.error("error fechaobjetivo2SC",err);
         }
       }

    return {
        onRequest: onRequest
    };
    
});