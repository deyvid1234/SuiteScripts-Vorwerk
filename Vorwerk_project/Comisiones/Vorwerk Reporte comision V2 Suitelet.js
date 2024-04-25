/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','N/query','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'], 
    function(plugin,task, serverWidget, search, runtime,file,query,Utils){
  
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        try{

            log.debug('metohd',context.request.method); 
            var form = createForm();
            var compConfigDetails = Utils.getObjCompConfigDetails();
            
            

            var esquemaVentasJefaGrupo= compConfigDetails[1]['esquemaVentasJefaGrupo']['propias']
            log.debug('esquemaVentasJefaGrupo', esquemaVentasJefaGrupo)
            params = context.request.parameters;
            
                if(context.request.method == 'POST'){

                    context.response.writePage(form);
                    //Obtiene los datos ingresados de los campos
                    cust_promo = params.custpage_promo;
                    cust_type = params.custpage_type_;
                    cust_period = params.custpage_date;
                    cust_entrega = params.custpage_entrega;
                    

                    //Asignacion de valores
                    var custpage_date = form.getField({ id:'custpage_date'});
                    custpage_date.defaultValue = cust_period;
                    var custpage_type_ = form.getField({ id:'custpage_type_'});
                    custpage_type_.defaultValue = cust_type;
                    var custpage_promo = form.getField({ id:'custpage_promo'});
                    custpage_promo.defaultValue = cust_promo;
                    var custpage_entrega = form.getField({ id:'custpage_entrega'});
                    custpage_entrega.defaultValue = cust_entrega;
                      

                    log.debug('Filtros','Tipo : '+cust_type+' Promocion : '+cust_promo+' Periodo : '+cust_period+' Entrega : '+cust_entrega)
                    try{
                        sublista(form,cust_type,cust_promo,cust_period,cust_entrega,compConfigDetails);
                        
                        context.response.writePage(form)
                    }catch(e){
                        log.error('error al crear form',e);
                    }
              
                }
                if(context.request.method == 'PUT'){ //
                    try{
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
                title: 'Reporte de Comisiones V2'
            });

            //Grupo para campos
            form.addFieldGroup({
                id: 'custpage_filters',
                label: 'Filtros'
            })
           
            //Campos filtro
            form.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.SELECT,
                label: 'Periodo de Comision',
                source: 'customrecord_periods',
                container: 'custpage_filters'
            });

            form.addField({
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

            //Terminan los campos filtro

            //Botones
            form.addSubmitButton({
               label: 'Consultar',
               container: 'custpage_filters'
            });
            
            form.addButton({
                id : 'custpage_searchData',
                label : 'Guardar',
                functionName : 'saveData()'
            });
            form.addButton({
                id : 'custpage_create_excel',
                label : 'Crear Excel',
                functionName : 'createExcel()'
            });
             
            return form;
           
        }catch (e){
           log.debug("error create form",e)
        }
    }// Fin createForm

   
    function sublista(form,cust_type,cust_promo,cust_period,cust_entrega,compConfigDetails){
        try{

            const fechaPeriodoCalculado = search.lookupFields({ type: 'customrecord_periods', id: cust_period, columns: ['custrecord_inicio','custrecord_final']});
            const inicioPeriodo = fechaPeriodoCalculado.custrecord_inicio // dd/mm/yyyy
            const finPeriodo = fechaPeriodoCalculado.custrecord_final // dd/mm/yyyy

            //Creacion de sublista y sus campos
            var sublist = addFieldsTabla(form,cust_type,cust_promo,cust_period,cust_entrega)

            //Busqueda de ordenes de venta 3 periodos antes a hoy
            const salesOrdersData = searchSalesOrders(cust_period,inicioPeriodo,finPeriodo)
            const historicoSO = salesOrdersData.historicoSO
            const thisPeriodSO = salesOrdersData.thisPeriodSO
            const dHistorico=salesOrdersData.dHistorico

            log.debug('historicoSO',historicoSO)
            log.debug('thisPeriodSO',thisPeriodSO)//sales reo
            log.debug('dHistorico',dHistorico)
            /*
            Extraer datos:
            thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
            ejemplos:
            var entityX= thisPeriodSO['39360'][2]['5369424']['tranid']
            var dateX= thisPeriodSO['39360'][2]['5369424']['trandate']
            log.debug('entityX', entityX)
            log.debug('dateX', dateX)*/
            
            //Busqueda datos Presentadores
            const listasPresentadora = searchDataPresentadoras()
            const allPresentadoras = listasPresentadora.allPresentadorData
            log.debug('allPresentadoras', allPresentadoras)
            const listaGrupos= listasPresentadora.empGrupos
            log.debug('listaGrupos', listaGrupos)
            const listaReclutas= listasPresentadora.empReclutas
            log.debug('listaReclutas', listaReclutas)
            const listaEquipoRecluta=listasPresentadora.equipoYRecluta
            log.debug('listaEquipoRecluta', listaEquipoRecluta)
             
            /*var datos0008=allPresentadoras['12000']
            log.debug('datos0008',datos0008)
            var datos008=allPresentadoras['12000']['employeetype']
            log.debug('datos008',datos008)*/
            /*Extraer miembros de X reclutadora o jdg
            var reclutasdeX=lista['id reclutadora o jdg']
            var reclutasdeX=listaReclutas['23170']
            log.debug('reclutasdeX', reclutasdeX)
            Ejemplo para obtener las ordenes de venta de este periodo de cada recluta en el arreglo de la reclutadora x
            var reclutasdeX=listaReclutas['23170']
            log.debug('reclutasdeX', reclutasdeX)
            reclutasdeX.forEach(function(recluta,index) {
                log.debug('recluta', recluta);
                var ventasPorRecluta = thisPeriodSO[recluta];
                log.debug('ventasPorRecluta', ventasPorRecluta);
            });
            */
            //log.debug('Object.keys(allPresentadoras)',Object.keys(thisPeriodSO))

            var tipoReporteGloobal 
            /*
            1 = LE
            2 = Presentador
            3= Trabaja x TM 
            */
            if(cust_type == 3 && cust_promo == 2 ){//LE y tm Propia 
                log.debug('Generar Reporte LE')
                tipoReporteGloobal = 1
            } else if(cust_type== 1 && cust_promo == 2){//Presentador y tm propia 
                log.debug('Generar Reporte Presentador')
                tipoReporteGloobal = 2
                
            }else if(cust_type== 1 && cust_promo == 1){// Presentador y Trabaja x TM
                log.debug('Generar Reporte Trabaja x TM')
                tipoReporteGloobal = 3
                
            }
            var cont_line = -1

            for(i in thisPeriodSO){

                if(allPresentadoras.hasOwnProperty(i)){
                    //Datos EMP
                    var empType=allPresentadoras[i].employeetype
                    var empPromo=allPresentadoras[i].promocion
                    var dataEmp = allPresentadoras[i]
                    const empConfiguracion = allPresentadoras[i].emp_conf


                    var montoComisionCK= false
                    var fVentasPropias = false
                    var montoEntrega = false
                    var montoProductividad = false
                    var montoEmerald = false
                    var montoGarantia = false
                    var montoReclutamiento = false
                    var montoTalento = false
                    var montoVentaEquipo = false
                    var montoTresDos = false
                    var montoCincoDos = false
                    var montoSupercomision = false
                    

                    var testFBonos
                    
                    switch(tipoReporteGloobal){
                        case 1: //Reporte LE
                            if(empType == 3 && empPromo == 2){
                                //Calcular reporte para la persona
                                
                                var reclutas=listaReclutas[i]
                                var integrantesEquipo=listaGrupos[i]   
                                var reclutasEquipo=listaEquipoRecluta[i]
                                var ventasEmp =thisPeriodSO[i] 
                                log.debug('ventasEmp',ventasEmp)
                                fVentasPropias = bonoVentaPropia(i,dataEmp,ventasEmp,compConfigDetails)
                                log.debug('fVentasPropias',fVentasPropias)
                                montoSupercomision = bonoSupercomision(integrantesEquipo,historicoSO,thisPeriodSO)
                                log.debug('montoSupercomision',montoSupercomision)
                                montoReclutamiento = bonoReclutamiento(i,reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails)
                                log.debug('montoReclutamiento',montoReclutamiento)
                                montoEntrega = bonoEntrega(dataEmp,ventasEmp,cust_entrega)
                                log.debug('montoEntrega',montoEntrega)
                                montoTresDos = bonotresdos(dataEmp,reclutasEquipo,thisPeriodSO,ventasEmp,historicoSO,allPresentadoras,dHistorico,integrantesEquipo)
                                log.debug('montoTresDos',montoTresDos)
                                montoCincoDos = bonoCincoDos(dataEmp,reclutasEquipo,thisPeriodSO,ventasEmp,historicoSO,allPresentadoras,dHistorico,integrantesEquipo)
                                /*

                                


                                montoComisionCK = bonoComCK()
                                montoVentasPropias = bonoVentaPropia(i) 
                                
                                montoProductividad = bonoProductividad()
                                montoEmerald = bonoEmerald()
                                montoGarantia = bonoGarantia()
                                
                                montoTalento = bonoTalento()
                                montoVentaEquipo = bonoVentaEquipo()
                                
                                
                                
                                */
                                cont_line++
                                fillTable(sublist,dataEmp,fVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,montoSupercomision,montoReclutamiento,montoEntrega,montoTresDos,montoCincoDos)
                                
                            }

                        break;
                        case 2: //Reporte Presentadora
                            if(empType == 1 && empPromo == 2){
                                //Calcular reporte para la persona
                               
                                /*
                                montoComisionCK = bonoComCK()
                                montoVentasPropias = bonoVentaPropia()
                                montoEntrega = bonoEntrega()
                                montoProductividad = bonoProductividad()
                                montoEmerald = bonoEmerald()
                                montoGarantia = bonoGarantia()
                                montoReclutamiento = bonoReclutamiento()
                                */
                            }
                        
                        break;
                        case 3: //Reporte Trabaja x TM
                            if(empType == 1 && empPromo == 1){
                                //Calcular reporte para la persona
                                testFBonos = testBonos('Reporte Trabaja TM'+i)
                                log.debug('testFBonos',testFBonos)
                                /*
                                montoComisionCK = bonoComCK()
                                montoReclutamiento = bonoReclutamiento()
                                */
                            }
                        break;
                    }
                }
                
            }
              
            
           return form;
          
        }catch(e){
          log.debug("error sublista",e)
          log.debug('creditos 2',runtime.getCurrentScript().getRemainingUsage()); 
        }   
    }//Fin sublista
    function fillTable(sublist,dataEmp,ventasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,montoSupercomision,montoReclutamiento,montoEntrega,montoTresDos,montoCincoDos){
        var linea = cont_line
        sublist.setSublistValue({
              id : 'nombre',
              line : linea,
              value : linea
          });
       if(dataEmp){
          
          var v=dataEmp.internalid        
          sublist.setSublistValue({
              id : 'nombre',
              line : linea,
              value : v!=''?v:''
          });

          var v=dataEmp.emp_conf         
          sublist.setSublistValue({
              id : 'ingreso',
              line : linea,
              value : v!=''?v:''
          });
          var v=dataEmp.delegada
          sublist.setSublistValue({
              id : 'delegadas',
              line : linea,
              value : v!=''?v:''
          });
          
          var v=dataEmp.reclutadoraID
          sublist.setSublistValue({
              id : 'reclutadora',
              line : cont_line,
              value : v!=''?v:''
          });
          var v=dataEmp.hiredate//fecha de contratacion
          sublist.setSublistValue({
              id : 'hiredate',
              line : linea,
              value : v!=''?v:''
          });
          var v=dataEmp.unidad
          sublist.setSublistValue({
              id : 'custentity_nombre_unidad',
              line : cont_line,
              value : v!=''?v:''
          });
          //Reclutas
          if(reclutas){
            v = reclutas
            sublist.setSublistValue({
                id : 'custentity_reclutas',
                line : linea,
                value : v!=''?v:''
            });
          }
            
          v = integrantesEquipo
          sublist.setSublistValue({
              id : 'custentity_presentadoras',
              line : linea,
              value : v!=''?v:''
          });

            
        }
        if(ventasPropias){  
            var v
            //Venta Propia
            v = ventasPropias.monto
            sublist.setSublistValue({
                id : 'custentity_venta_propia',
                line : linea,
                value : v>0?v:0
            });
            //Ventas TM o Ventas CK
            v = ventasPropias.data.length
            sublist.setSublistValue({
                id : 'custentity_odv_jdg',
                line : linea,
                value : v!=0?v:0
            });
            //ID ODV
            v = JSON.stringify(ventasPropias.data)
            sublist.setSublistValue({
                id : 'custentity_odv_jdg_ids',
                line : linea,
                value : v!=''?v:''
            });

        }
        if(montoEntrega){
            //Poner todos los campos que involucran 
            var v
            //ntrega monto
            v = montoEntrega.monto
            sublist.setSublistValue({
                id : 'custentity_entrega',
                line : linea,
                value : v>0?v:0
            });
            //entrega numero
            v = montoEntrega.data.length
            sublist.setSublistValue({
                id : 'custentity_num_entrega',
                line : linea,
                value : v!=0?v:0
            });
            //entrega odv
            v = JSON.stringify(montoEntrega.data)
            sublist.setSublistValue({
                id : 'custentity_odv_entrega',
                line : linea,
                value : v!=''?v:''
            });

        }

        if(montoSupercomision){
          //ODV Por recluta del mes del Equipo SC
          v = JSON.stringify(montoSupercomision.data)
          //log.debug('vdata',v)
          sublist.setSublistValue({
              id : 'custentity_odv_pre_supercomision',
              line : linea,
              value : v!=''?v:''
          });
          //Numero de ventas SC
          v = montoSupercomision.ventasNo
          sublist.setSublistValue({
              id : 'custentity_ventas_sc',
              line : linea,
              value : v!=0?v:0
          });
          //Bono supercomision
          v = montoSupercomision.monto
          sublist.setSublistValue({
              id : 'custentity_bono_sc',
              line : linea,
              value : v!=0?v:0
          });
        }
        
        if(montoReclutamiento){
          //log.debug('bonoReclutamiento filltable')
          v = montoReclutamiento.monto
          //log.debug('vbono reclutamiento',v)
          sublist.setSublistValue({
              id : 'custentity_bono_rec',
              line : linea,
              value : v!=0?v:0
          });
          /*v = 
          log.debug('vString',v)
          sublist.setSublistValue({
              id : 'custentity_odv_rec',
              line : linea,
              value : v!=''?v:''
          });
          */
        }
        if(montoTresDos){
          
          log.debug('32 filltable',montoTresDos )
          v = JSON.stringify(montoTresDos.data)
          log.debug('vdata',v)
          //Reclutas con ventas
          sublist.setSublistValue({
              id : 'custentity_rec_con_ventas',
              line : linea,
              value : v!=""?v:""
          });
          //equipo 
          v = JSON.stringify(montoTresDos.equipo)
          log.debug('vdata',v)
          sublist.setSublistValue({
              id : 'custentity_odv_rec_del_periodo',
              line : linea,
              value : v!=""?v:""
          });
          //Bono 3+2
          v = montoTresDos.monto
          sublist.setSublistValue({
              id : 'custentity_bono_tres_dos',
              line : linea,
              value : v!=0?v:0
          });
        }
        if(montoCincoDos){
          
          log.debug('52 filltable',montoCincoDos )
          v = JSON.stringify(montoCincoDos.data)
          log.debug('vdata52',v)
          //Reclutas con ventas
          sublist.setSublistValue({
              id : 'custentity_rec_con_ventas',
              line : linea,
              value : v!=""?v:""
          });
          //equipo 
          v = JSON.stringify(montoCincoDos.equipo)
          log.debug('vdata',v)
          sublist.setSublistValue({
              id : 'custentity_odv_rec_del_periodo',
              line : linea,
              value : v!=""?v:""
          });
          //Bono 5+2
          v = montoCincoDos.monto
          sublist.setSublistValue({
              id : 'custentity_bono_cinco_dos',
              line : linea,
              value : v!=0?v:0
          });
        }
        return fillTable;

    }
    function bonoCincoDos(dataEmp,reclutasEquipo,thisPeriodSO,ventasEmp,historicoSO,allPresentadoras,dHistorico,integrantesEquipo){
        var lider= dataEmp.internalid
        log.debug('reclutasEquipo',reclutasEquipo)
        log.debug('ventasEmp',ventasEmp)
        
        var ventasPre52={}
        var ventasEq52={}
        var arregloData={}
        var salesOrders={}
        var preActivas=''
        var equipoActivas=''
        var monto=0
        if (reclutasEquipo){//si esta lider tiene reclutas obtenemos su fecha de contratacion o de reactivacion
           reclutasEquipo.forEach(function(i,index) {
            //log.debug('i',i)
                var hiredate=allPresentadoras[i]['hiredate']
                var reactivacion=allPresentadoras[i]['fechaReactivacion']
                var valiDate
                if(reactivacion){
                    valiDate=Utils.stringToDate(reactivacion)
                }else{
                    valiDate=Utils.stringToDate(hiredate)
                }
                //log.debug('valiDate',valiDate)
                if(valiDate>dHistorico){//si esa fecha es mayor que la fecha del historico validamos si tiene ventas en el historico
                    if(historicoSO.hasOwnProperty(i)){//si hay ventas en el historico queda descartado
                        //log.debug('ventas historico de '+i,historicoSO[i] )
                    }else{//si no, validamos si tienen ventas en este periodo
                        var ventas = thisPeriodSO[i]
                
                        if(ventas){//si hay ventas en este periodo armamos el arreglo con dichas ventas
                            if(ventasPre52.hasOwnProperty(i)){
                                ventasPre52[i].push(ventas)
                            }else{
                                ventasPre52[i]=(ventas)
                            }
                        }
                    }
                }
            })
           if (integrantesEquipo){// obtenemos su fecha de contratacion o de reactivacion de las integrantes del equipo
               integrantesEquipo.forEach(function(i,index) {
                //log.debug('i',i)
                    var hiredate=allPresentadoras[i]['hiredate']
                    var reactivacion=allPresentadoras[i]['fechaReactivacion']
                    var valiDateEq
                    if(reactivacion){
                        valiDateEq=Utils.stringToDate(reactivacion)
                    }else{
                        valiDateEq=Utils.stringToDate(hiredate)
                    }
                    //log.debug('valiDateEq',valiDateEq)
                    if(valiDateEq>dHistorico){//si esa fecha es mayor que la fecha del historico validamos si tiene ventas en el historico
                        if(historicoSO.hasOwnProperty(i)){//si hay ventas en el historico queda descartado
                            //log.debug('ventas historico de '+i,historicoSO[i] )
                        }else{//si no, validamos si tienen ventas en este periodo
                            var ventasEq = thisPeriodSO[i]
                    
                            if(ventasEq){//si hay ventas en este periodo armamos el arreglo con dichas ventas
                                if(ventasEq52.hasOwnProperty(i)){
                                    ventasEq52[i].push(ventasEq)
                                }else{
                                    ventasEq52[i]=(ventasEq)
                                }
                            }
                        }
                    }
                })
           }
           for(j in ventasPre52 ){
                //log.debug('ventasPre52[j]',ventasPre52[j])
                for(x in ventasPre52[j]){
                    var orden=Object.keys(ventasPre52[j][x])
                    //log.debug('orden',orden)
                }
                
                if(arregloData.hasOwnProperty(j)){
                    arregloData[j].push(orden)
                }else{
                    arregloData[j]=orden
                }
                
           }
           
           log.debug('ventasEq52',ventasEq52)
           preActivas= Object.keys(ventasPre52)//presentadoras que son recluta y equipo activas
           equipoActivas=Object.keys(ventasEq52)// presentadoras que son equipo activas
           
           if(ventasEmp.length>4 &&equipoActivas >= 2 && preActivas.length >0){
            monto = 8000
           }
        } 
            //monto: Monto  
            //data: Arreglo de las presentadoras activas*/
            //log.debug('arregloData',arregloData)
        return {monto:monto, data:arregloData,equipo:equipoActivas}
      

    }
    function bonotresdos(dataEmp,reclutasEquipo,thisPeriodSO,ventasEmp,historicoSO,allPresentadoras,dHistorico,integrantesEquipo){
        var lider= dataEmp.internalid
        log.debug('reclutasEquipo',reclutasEquipo)
        log.debug('ventasEmp',ventasEmp)
        
        var ventasPre32={}
        var ventasEq32={}
        var arregloData={}
        var salesOrders={}
        var preActivas=''
        var equipoActivas=''
        var monto=0
        if (reclutasEquipo){//si esta lider tiene reclutas obtenemos su fecha de contratacion o de reactivacion
           reclutasEquipo.forEach(function(i,index) {
            //log.debug('i',i)
                var hiredate=allPresentadoras[i]['hiredate']
                var reactivacion=allPresentadoras[i]['fechaReactivacion']
                var valiDate
                if(reactivacion){
                    valiDate=Utils.stringToDate(reactivacion)
                }else{
                    valiDate=Utils.stringToDate(hiredate)
                }
                //log.debug('valiDate',valiDate)
                if(valiDate>dHistorico){//si esa fecha es mayor que la fecha del historico validamos si tiene ventas en el historico
                    if(historicoSO.hasOwnProperty(i)){//si hay ventas en el historico queda descartado
                        //log.debug('ventas historico de '+i,historicoSO[i] )
                    }else{//si no, validamos si tienen ventas en este periodo
                        var ventas = thisPeriodSO[i]
                
                        if(ventas){//si hay ventas en este periodo armamos el arreglo con dichas ventas
                            if(ventasPre32.hasOwnProperty(i)){
                                ventasPre32[i].push(ventas)
                            }else{
                                ventasPre32[i]=(ventas)
                            }
                        }
                    }
                }
            })
           if (integrantesEquipo){// obtenemos su fecha de contratacion o de reactivacion de las integrantes del equipo
               integrantesEquipo.forEach(function(i,index) {
                //log.debug('i',i)
                    var hiredate=allPresentadoras[i]['hiredate']
                    var reactivacion=allPresentadoras[i]['fechaReactivacion']
                    var valiDateEq
                    if(reactivacion){
                        valiDateEq=Utils.stringToDate(reactivacion)
                    }else{
                        valiDateEq=Utils.stringToDate(hiredate)
                    }
                    //log.debug('valiDateEq',valiDateEq)
                    if(valiDateEq>dHistorico){//si esa fecha es mayor que la fecha del historico validamos si tiene ventas en el historico
                        if(historicoSO.hasOwnProperty(i)){//si hay ventas en el historico queda descartado
                            //log.debug('ventas historico de '+i,historicoSO[i] )
                        }else{//si no, validamos si tienen ventas en este periodo
                            var ventasEq = thisPeriodSO[i]
                    
                            if(ventasEq){//si hay ventas en este periodo armamos el arreglo con dichas ventas
                                if(ventasEq32.hasOwnProperty(i)){
                                    ventasEq32[i].push(ventasEq)
                                }else{
                                    ventasEq32[i]=(ventasEq)
                                }
                            }
                        }
                    }
                })
           }
           for(j in ventasPre32 ){
                //log.debug('ventasPre32[j]',ventasPre32[j])
                for(x in ventasPre32[j]){
                    var orden=Object.keys(ventasPre32[j][x])
                    //log.debug('orden',orden)
                }
                
                if(arregloData.hasOwnProperty(j)){
                    arregloData[j].push(orden)
                }else{
                    arregloData[j]=orden
                }
                
           }
           
           log.debug('ventasEq32',ventasEq32)
           preActivas= Object.keys(ventasPre32)//presentadoras que son recluta y equipo activas
           equipoActivas=Object.keys(ventasEq32)//presentadoras que son equipo activas
           
           if(ventasEmp.length> 2 && ventasEmp.length<5 && equipoActivas.length >= 2 && preActivas.length > 0){
            monto = 5000
           }
        } 
            //monto: Monto  
            //data: Arreglo de las presentadoras activas*/
            //log.debug('arregloData',arregloData)
        return {monto:monto, data:arregloData,equipo:equipoActivas}
      

    }
   function bonoSupercomision(integrantesEquipo,historicoSO,thisPeriodSO){

        var ventasNo =0
        var montoSC=0
        var ventasPeriodo=[]
        var ordenesSupercomisionTotal=[]
        integrantesEquipo.forEach(function(i,index) {
          var ventasHistorico
          if(historicoSO[i]){
            ventasHistorico = historicoSO[i].length
          }else{
            ventasHistorico =0
          }
            var ordenesSCintegrante=[]
            if(thisPeriodSO.hasOwnProperty(i) && ventasHistorico < 6){
                var ordenesFaltantes = 6-ventasHistorico 
                
                if(thisPeriodSO[i].length <= ordenesFaltantes){
                    ordenesSCintegrante = thisPeriodSO[i]
                                       
                }else{
                    
                    cont = 0 
                    
                    for(j in thisPeriodSO[i]){
                        cont ++
                        ordenesSCintegrante.push(thisPeriodSO[i][j]) 
                           
                        if(cont >= ordenesFaltantes){
                            break
                        }
                    }
                }
                ordenesSupercomisionTotal.push(ordenesSCintegrante)
            }

        });
            for(x in ordenesSupercomisionTotal){
              for(y in ordenesSupercomisionTotal[x])
              //log.debug('ordenesSupercomisionTotal',ordenesSupercomisionTotal[x][y])
              var keys = Object.keys(ordenesSupercomisionTotal[x][y])
              ventasPeriodo.push(keys)
            }
          montoSC= ordenesSupercomisionTotal.length*500
          ventasNo= ventasPeriodo.length
        
        if(montoSC == 0 && ventasNo== 0 ) {
          ventasPeriodo=''
        }          
        
        return  {monto:montoSC, data:ventasPeriodo, ventasNo:ventasNo};

    }
    /*function bonoCincoDos(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }
    function bonotresdos(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }
    function bonoVentaEquipo(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }
    function bonoTalento(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }*/

    function bonoReclutamiento(empId,reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails){
        //log.debug('reclutas lista '+ empId,reclutas)
        var totalVentas= 0
        var bono_reclutadora =0
        if(reclutas){
          reclutas.forEach(function(i,index) {
            //log.debug('recluta', i)    
            var ventasReclutaTP = thisPeriodSO[i];
            var ventasReclutaH = historicoSO[i];
            
            if(ventasReclutaTP ){
                if(ventasReclutaH){
                    var ventasReclutaTP= ventasReclutaTP.length
                    totalVentas= ventasReclutaTP+ventasReclutaH.length 
                }else{
                    totalVentas= ventasReclutaTP
                }
              
              //log.debug('ventasPorReclutahistorico'+i, ventasReclutaH)
              //log.debug('ventasPorReclutathisperiodlength'+i, ventasReclutaTP);
              //log.debug('totalVentas'+i, totalVentas);

              var configuracionRec = dataEmp.conf_reclutamiento
            
              if(configuracionRec){
                //log.debug('configuracionRec'+i, configuracionRec);
              }else{
                configuracionRec=1
              }
  //          bono_reclutadora= bono_reclutadora + Math.abs(CompConfigDetails[configuracion_rec]['esquemaVentasReclutamiento'][k]['compensacion'])
              if(totalVentas <=6 && configuracionRec != 11&& configuracionRec != 12&&configuracionRec!=13){ 
                bono_reclutadora=bono_reclutadora + Math.abs(compConfigDetails[configuracionRec]['esquemaVentasReclutamiento'][totalVentas]['compensacion'])
              }
              if(totalVentas <=4 && configuracionRec == 11 && configuracionRec == 12 && configuracionRec==13){
                bono_reclutadora=bono_reclutadora + Math.abs(compConfigDetails[configuracionRec]['esquemaVentasReclutamiento'][totalVentas]['compensacion'])
                
              }
            }
            

          });
        } else{
          log.debug('esta presentadora no tiene reclutas: '+empId)

        }
        return  {monto:bono_reclutadora, data:totalVentas};

    }
    /*function bonoGarantia(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }
    function bonoEmerald(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }
    function bonoProductividad(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }*/
    function bonoEntrega(dataEmp,empSOThisPeriod,cust_entrega){
        log.debug('cust_entrega',cust_entrega)
        var dataEnt = []
        var montoEntrega=0
        if(cust_entrega==1){
            log.debug('Pagar entrega')
            var ventaEntrega = empSOThisPeriod
            for (i in ventaEntrega){
            var ventasKeys= Object.keys(ventaEntrega[i])
            //thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
            var comisionables = ventaEntrega[i][ventasKeys]['custbody_vw_comission_status']
                if(comisionables != 2){
                    dataEnt.push(ventasKeys)
                }
                
            }
            var ventasNo = dataEnt.length
                    
             parseInt(ventasNo)*500
                                    
        }else if (cust_entrega == 2){
            log.debug('No pagar entrega')
        }
      
            //monto: Monto a partir del numero de ventas 
            //data: Arreglo de Internal id de Sales Order del EMP

        return {monto:montoEntrega, data:dataEnt}
      

    }
    function bonoVentaPropia(empId,empData,empSOThisPeriod,compConfigDetails){
      
      var ventas = empSOThisPeriod
      //log.debug('ventas',ventas)
      var data = []
      for (i in ventas){
        var ventasData= Object.keys(ventas[i])
        //thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
        var comisionables = ventas[i][ventasData]['custbody_vw_comission_status']
        //log.debug('comisionables',comisionables)
        if(comisionables != 2){
          data.push(ventasData)
        }
        
      }
      var ventasNo = data.length
      //compConfigDetails[tipo de cofiguracion][etiqueta del esquema][No de ventas][etiqueta de la compensacion monto]
      var montoVentasPre= compConfigDetails[1]['esquemaVentasPresentadora'][ventasNo]['compensacion']
      //log.debug('montoVentasPre', montoVentasPre)
            //monto: Monto de cal cof a partir del numero de ventas 
            //data: Arreglo de Internal id de Sales Order del EMP

        return {monto:montoVentasPre, data:data}
      

    }
   /* function bonoComCK(tipoReporte){

        return 'Se están calculando los bonos del '+tipoReporte;

    }*/
    function searchDataPresentadoras(){ 
        try{
           

            const employeeSearchFilters = [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custentity_estructura_virtual', 'is', 'F'],
                'AND',
                ['salesrep', 'is', 'T'],
                'AND',
                ['employeetype', 'anyof', '3', '1', '8', '5', '9'],
            ];

            const empSearchentityid = search.createColumn({ name: 'entityid'});
            const empSearchfirstname = search.createColumn({ name: 'firstname'});
            const empSearchsupervisor = search.createColumn({ name: 'supervisor'});
            const empSearchcustentity_promocion = search.createColumn({ name: 'custentity_promocion'});
            const empSearchemployeetype = search.createColumn({ name: 'employeetype'});
            const empSearchcustentity_reclutadora = search.createColumn({ name: 'custentity_reclutadora'});
            const empSearchhiredate = search.createColumn({ name: 'hiredate'});
            const empSearchcustentity_fin_objetivo_1 = search.createColumn({ name: 'custentity_fin_objetivo_1'});
            const empSearchcustentity_fin_objetivo_2 = search.createColumn({ name: 'custentity_fin_objetivo_2'});
            const empSearchcustentity72 = search.createColumn({ name: 'custentity72'});
            const empSearchcustentity_fin_objetivo_1_reactivacion = search.createColumn({ name: 'custentity_fin_objetivo_1_reactivacion'});
            const empSearchcustentity_fin_objetivo_2_reactivacion = search.createColumn({ name: 'custentity_fin_objetivo_2_reactivacion'});
            const empSearchcustentity123 = search.createColumn({ name: 'custentity123'});
            const empSearchcustentity_conf_rec = search.createColumn({ name: 'custentity_conf_rec'});
            const empSearchissalesrep = search.createColumn({ name: 'issalesrep'});
            const empSearchinternalid = search.createColumn({ name: 'internalid'});
            const empSearchdelegada = search.createColumn({ name: 'custentity_delegada'});
            const empSearchunidad = search.createColumn({ name: 'custentity_nombre_unidad'});
            const employeeSearchReclutadoraInternalId = search.createColumn({ name: 'internalid', join: 'custentity_reclutadora' });

            const mySearch = search.create({
                type: 'employee',
                filters: employeeSearchFilters,
                columns: [
                    empSearchentityid,
                    empSearchfirstname,
                    empSearchsupervisor,
                    empSearchcustentity_promocion,
                    empSearchemployeetype,
                    empSearchcustentity_reclutadora,
                    empSearchhiredate,
                    empSearchcustentity_fin_objetivo_1,
                    empSearchcustentity_fin_objetivo_2,
                    empSearchcustentity72,
                    empSearchcustentity_fin_objetivo_1_reactivacion,
                    empSearchcustentity_fin_objetivo_2_reactivacion,
                    empSearchcustentity123,
                    empSearchcustentity_conf_rec,
                    empSearchissalesrep,
                    empSearchinternalid,
                    empSearchdelegada,
                    empSearchunidad,
                    employeeSearchReclutadoraInternalId,
                ],
            });

            var allPresentadorData = {} //Todos los datos de todos los presentadores activos arreglo[presentadora] = {obj1:20/01/2024, conf: CC01...}
            var empGrupos = {} //Arreglo de lideres de equipo y sus integrantes arreglo[liderGrupo] = [integrante1,integrante2...]
            var empReclutas = {}//Arreglo de presentadores y sus reclutados arreglo[Reclutadora] = [reclutada1,reclutada2...]

            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                   
                    var objEMP = new Object();
                    objEMP.entityid = r.getValue('entityid')
                    objEMP.firstname = r.getValue('firstname')
                    objEMP.supervisor = r.getValue('supervisor')
                    objEMP.promocion = r.getValue('custentity_promocion')
                    objEMP.employeetype = r.getValue('employeetype')
                    objEMP.emp_reclutadora = r.getValue('custentity_reclutadora')
                    objEMP.hiredate = r.getValue('hiredate')
                    objEMP.objetivo_1 = r.getValue('custentity_fin_objetivo_1')
                    objEMP.objetivo_2 = r.getValue('custentity_fin_objetivo_2')
                    objEMP.fechaReactivacion = r.getValue('custentity72')
                    objEMP.obj_1_reactivacion = r.getValue('custentity_fin_objetivo_1_reactivacion')
                    objEMP.obj_2_reactivacion = r.getValue('custentity_fin_objetivo_2_reactivacion')
                    objEMP.emp_conf = r.getValue('custentity123')
                    objEMP.conf_reclutamiento = r.getValue('custentity_conf_rec')
                    objEMP.issalesrep = r.getValue('issalesrep')
                    objEMP.internalid = r.getValue('internalid')
                    objEMP.delegada = r.getText('custentity_delegada')
                    objEMP.unidad = r.getValue('custentity_nombre_unidad')
                    objEMP.reclutadoraID = r.getValue({ name: 'internalid', join: 'custentity_reclutadora' })
                    
                    allPresentadorData[objEMP.internalid] = objEMP

                    if(empGrupos.hasOwnProperty(objEMP.supervisor)){
                        empGrupos[objEMP.supervisor].push(objEMP.internalid)
                    }else{
                        empGrupos[objEMP.supervisor] = [objEMP.internalid]  
                    }

                    if(empReclutas.hasOwnProperty(objEMP.emp_reclutadora)){
                        empReclutas[objEMP.emp_reclutadora].push(objEMP.internalid)
                    }else{
                        empReclutas[objEMP.emp_reclutadora] = [objEMP.internalid]  
                    }

                });
                      
            });
            //log.debug('empReclutas',empReclutas)
            //log.debug('empGrupos',empGrupos)
            //log.debug('allPresentadorData',allPresentadorData)

            var equipoYRecluta = {}



            for(i in empReclutas){//Se recorren los presentadores 
               
               if(empGrupos.hasOwnProperty(i)){
                 //log.debug('empReclutas[i]',empReclutas[i])
                 //log.debug('i',i)
                 //log.debug('empGrupos[i]',empGrupos[i])
                    //Existe el presentador en la lista de grupos
                    for(j in empReclutas[i]){//Se recorren los reclutas del presentador
                        
                        if(empGrupos[i].indexOf(empReclutas[i][j]) !== -1){                          
                            //llenar el arreglo equipoYRecluta
                            
                            if(equipoYRecluta.hasOwnProperty(i)){
                                equipoYRecluta[i].push(empReclutas[i][j])
                            }else{
                                equipoYRecluta[i] = [empReclutas[i][j]]  
                            }

                        }
                    }
               }
            }
            //log.debug('equipoYRecluta',equipoYRecluta)

            
            return {allPresentadorData:allPresentadorData,empGrupos:empGrupos,empReclutas:empReclutas,equipoYRecluta:equipoYRecluta}
        }catch(e){
            log.error('Error en searchDataPresentadoras',e)
        }
    }
    function searchSalesOrders(cust_period,inicioPeriodo,finPeriodo){
        try{
            const inicioPeriodoDate =  Utils.stringToDate(inicioPeriodo)
            const finPeriodoDate = Utils.stringToDate(finPeriodo)
            var dHistorico = Utils.restarMeses(inicioPeriodo, 3); //Fecha 3 meses antes del periodo calculado

           const salesOrderSearchFilters = [
                ['type', 'anyof', 'SalesOrd'],
                'AND',
                ['item', 'noneof', '920'],
                'AND',
                ['account', 'anyof', '124'],
                'AND',
                ['custbody_tipo_venta', 'anyof', '2', '19', '1'],
                'AND',
                ['trandate', 'after', Utils.dateToString(dHistorico)],
                'AND',
                ['mainline', 'is', 'T'],
                'AND',
                ['salesrep.custentity_estructura_virtual', 'is', 'F'],
            ];

            const salesOrderSearchColTranDate = search.createColumn({ name: 'trandate'});
            const salesOrderSearchColTranId = search.createColumn({ name: 'tranid' });
            const salesOrderSearchColEntity = search.createColumn({ name: 'entity' });
            const salesOrderSearchColPresentadora = search.createColumn({ name: 'salesrep' });
            const salesOrderSearchColTipoDeVenta = search.createColumn({ name: 'custbody_tipo_venta' });
            const salesOrderSearchColComissionStatus = search.createColumn({ name: 'custbody_vw_comission_status' });
            const salesOrderSearchColOTROFINANCIAMIENTO = search.createColumn({ name: 'custbody_otro_financiamiento' });
            const salesOrderSearchColReclutadoraOV = search.createColumn({ name: 'custbody_vw_recruiter' });
            const salesOrderSearchColinternalid= search.createColumn({ name: 'internalid' });
           

            const mySearch = search.create({
                type: 'salesorder',
                filters: salesOrderSearchFilters,
                columns: [
                    salesOrderSearchColTranDate,
                    salesOrderSearchColTranId,
                    salesOrderSearchColEntity,
                    salesOrderSearchColPresentadora,
                    salesOrderSearchColTipoDeVenta,
                    salesOrderSearchColComissionStatus,
                    salesOrderSearchColOTROFINANCIAMIENTO,
                    salesOrderSearchColReclutadoraOV,
                    salesOrderSearchColinternalid,
                   
                ],
            });

            var historicoSO = {}
            var thisPeriodSO = {}

            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                    var dateSO = Utils.stringToDate(r.getValue('trandate'))
                   
                    var objSO = new Object();
                    objSO.internalid = r.getValue('internalid')
                    objSO.trandate = r.getValue('trandate')
                    objSO.tranid = r.getValue('tranid')
                    objSO.entity = r.getValue('entity')
                    objSO.salesrep = r.getValue('salesrep')
                    objSO.custbody_tipo_venta = r.getValue('custbody_tipo_venta')
                    objSO.custbody_vw_comission_status = r.getValue('custbody_vw_comission_status')
                    objSO.custbody_otro_financiamiento = r.getValue('custbody_otro_financiamiento')
                    objSO.custbody_vw_recruiter = r.getValue('custbody_vw_recruiter')
                   
                    ///log.debug('objSO',objSO)

                    var idSO = {}
                    idSO[objSO.internalid] = objSO 
                    if(dateSO >= inicioPeriodoDate && dateSO <= finPeriodoDate){
                        //log.debug('esta fecha es del periodo calculado',dateSO)
                        if(thisPeriodSO.hasOwnProperty(objSO.salesrep)){
                            thisPeriodSO[objSO.salesrep].push(idSO)
                        }else{
                            thisPeriodSO[objSO.salesrep] = [idSO]  
                        }

                    }else if(dateSO < inicioPeriodoDate){
                        //log.debug('Esta fecha es Historicio',dateSO)
                        if(historicoSO.hasOwnProperty(objSO.salesrep)){
                            historicoSO[objSO.salesrep].push(idSO)
                        }else{
                            historicoSO[objSO.salesrep] = [idSO]  
                        }

                    }
                });
                      
            });
            /*log.debug('pre query')
            var myTransactionQuery = query.create({
                type: query.Type.TRANSACTION
            });

            
            myTransactionQuery.condition = myTransactionQuery.createCondition({
                fieldId: 'type',
                operator: query.Operator.IS,
                values: "SalesOrd",
            });
            myTransactionQuery.condition = myTransactionQuery.createCondition({
                fieldId: 'custbody_tipo_venta',
                operator: query.Operator.ANY_OF,
                values: ['2', '19', '1']
            });
            myTransactionQuery.condition = myTransactionQuery.createCondition({
                fieldId: 'trandate',
                operator: query.Operator.AFTER,
                values: Utils.dateToString(dHistorico)
            });
            

            myTransactionQuery.columns = [
                myTransactionQuery.createColumn({ fieldId: "id" }),
                myTransactionQuery.createColumn({ fieldId: "custbody_vw_recruiter" }),
            ];


            var  mySQLCustomerQuery = myTransactionQuery.toSuiteQL();


            var results = mySQLCustomerQuery.run();
           
            log.debug('results',results) ;


            var pagedResults = mySQLCustomerQuery.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                    log.debug('test query',r)
                    log.debug('test query value',r.value)
                });
                      
            });*/

            
            return {historicoSO:historicoSO,thisPeriodSO:thisPeriodSO,dHistorico:dHistorico}
        }catch(e){
            log.error('Error en searchSalesOrders',e)
        }
    }
    
    function addFieldsTabla(form,cust_type,cust_promo,cust_period,cust_entrega){
        try{

            var sublist = form.addSublist({
                id: 'sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Resultados'
            });
               
            //Campos compartidos
            sublist.addField({
                id: 'select_field',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'select'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            
            sublist.addField({
                id: 'nombre',
                type: serverWidget.FieldType.SELECT,
                source:'employee',
                label: 'Nombre'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});        
               
            sublist.addField({
                id: 'ingreso',
                type: serverWidget.FieldType.TEXT,
                label: 'Compensaciones de Ingreso'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               
            sublist.addField({
                id: 'delegadas',
                type: serverWidget.FieldType.TEXT,
                label: 'Delegadas'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            sublist.addField({
                id: 'reclutadora',
                type: serverWidget.FieldType.SELECT,
                source:'employee',
                label: 'Reclutadora'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            sublist.addField({
                id: 'hiredate',
                type: serverWidget.FieldType.DATE,
                label: 'Fecha de Contratacion'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            //Terminan campos compartidos
              

            //Campos Trabaja x TM
            if(cust_promo == 1){//Trabaja X TM
                sublist.addField({
                   id: 'fecha_reactivacion',
                   type: serverWidget.FieldType.TEXT,
                   label: 'Fecha de Reactivacion'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            }

            //Campos Compartidos
            sublist.addField({
                id: 'custentity_nombre_unidad',
                type: serverWidget.FieldType.TEXT,
                label: 'Unidad'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            sublist.addField({
                id: 'custentity_odv_jdg',
                type: serverWidget.FieldType.TEXT,
                label: 'Ventas TM ó Ventas CK'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               
            sublist.addField({
                id: 'custentity_odv_jdg_ids',
                type: serverWidget.FieldType.TEXT,
                label: 'ID ODV'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            sublist.addField({
                id: 'custentity_tmpagada',
                type: serverWidget.FieldType.TEXT,
                label: 'TM Pagadas'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            sublist.addField({
                id: 'custentity_cookkey',
                type: serverWidget.FieldType.TEXT,
                label: 'Cook Key'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            sublist.addField({
                id: 'custentity_cookkey_comision',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Comision Cook Key'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            //Fin Campos Compartidos
            
            //Campos Tm Propia
            if(cust_promo != 1){
                sublist.addField({
                    id: 'custentity_venta_propia',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Venta Propia'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                   
                sublist.addField({
                    id: 'custentity_tm_ganadas_num',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TM Ganadas'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

                sublist.addField({
                    id: 'custentity_suma_ventas_total',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Acumulado de ventas'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                   
                sublist.addField({
                    id: 'custentity_num_entrega',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Número de Entregas'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                   
                sublist.addField({
                    id: 'custentity_odv_entrega',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ODV Entrega'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                   
                sublist.addField({
                    id: 'custentity_entrega',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Entrega'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                     
                sublist.addField({
                    id: 'custentity_bono_productividad',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Bono de Productividad'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                       
                sublist.addField({
                    id: 'custentity_bono_emerald',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Bono EMERALD'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                
                sublist.addField({
                    id: 'custentity_garantia_num',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Garantia Num'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                
                sublist.addField({
                    id: 'custentity_garantia_monto',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Garantia Monto'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                
                sublist.addField({
                    id: 'custentity_bono_garantia_ids',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Garantia ids'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            }//Fin Campos Tm Propia
               
            //Campos compartidos
            sublist.addField({
                id: 'custentity_reclutas',
                type: serverWidget.FieldType.TEXT,
                label: 'Reclutas'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               
            sublist.addField({
                id: 'custentity_odv_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'ODV de las Reclutas'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               
            sublist.addField({
                id: 'custentity_tmpagada_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'TM Pagadas Rec'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            
            sublist.addField({
                id: 'custentity_odv_comisionables_rec',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'ODV comisionables'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
             
            sublist.addField({
                id: 'custentity_bono_rec',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Bono Reclutadora'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            //Fin campos compartidos
            
            //Campos Trabaja x TM
            if(cust_promo == 1){
                sublist.addField({
                    id: 'custentity_ck',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'CK'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            }
               
               
            //Campos JDG - Lideres de equipo
            if (cust_type == 3) {
                sublist.addField({
                    id: 'custentity_total_ventas_p',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Ventas TM o CK y TM Pagadas'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                    
                sublist.addField({
                    id : 'custentity_bono_talento',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono Talento'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                    
                sublist.addField({
                    id : 'custentity_presentadoras',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Presentadoras Equipo'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                    
                sublist.addField({
                    id : 'custentity_odv_pre',
                    type : serverWidget.FieldType.TEXT,
                    label : 'ODV de las Presentadoras'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                    
                sublist.addField({
                    id : 'custentity_tmpagada_pre',
                    type : serverWidget.FieldType.TEXT,
                    label : 'TM Pagadas equipo'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                    
                sublist.addField({
                    id: 'custentity_odv_comisionables_pre',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ODV comisionables'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                           
                sublist.addField({
                    id : 'custentity_porcentaje',
                    type : serverWidget.FieldType.TEXT,
                    label : '%'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                     
                sublist.addField({
                    id : 'custentity_venta_equipo',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Venta Equipo'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

                //3+2 y 5+2 EQUIPO ESPECIAL - DEBEN PERTENECER AL EQUIPO Y APARTE DEBIERON SER RECLUTADAS POR LA LIDER DE EQUIPO 
                sublist.addField({
                    id : 'custentity_odv_rec_del_periodo',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Reclutas y ODV del periodo mismo equipo'//2134324:56645653
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

                sublist.addField({
                    id : 'custentity_odv_rec_de_le_del_periodo',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Reclutas y ODV Por recluta del LE del periodo'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

                sublist.addField({
                    id: 'custentity_rec_con_ventas',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Reclutas con ventas'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

                sublist.addField({
                    id : 'custentity_bono_tres_dos',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono 3 + 2'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

                sublist.addField({
                    id : 'custentity_bono_cinco_dos',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono 5 + 2'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                // Fin Campos 3+2 y 5+2
                    
                // Super Comision 
                sublist.addField({
                    id : 'custentity_odv_pre_supercomision',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'ODV Por recluta del mes del Equipo SC'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                   
                sublist.addField({
                    id: 'custentity_ventas_sc',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Numero de ventas SC'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                    
                sublist.addField({
                    id : 'custentity_bono_sc',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono SUPERCOMISIÓN'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                //Fin Campos Super Comision
                    
            }// Fin Campos JDG - Lideres de equipo

            // Campos Compartidos
              
            var total = sublist.addField({
                id: 'custentity_total',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total'
            });
            total.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            sublist.addMarkAllButtons();

            return sublist;
        }catch(e){
            log.error('Error en addFieldsTabla',e)
        }
    }//Fin addFieldsTabla
    return {
        onRequest: onRequest
    };
    
});