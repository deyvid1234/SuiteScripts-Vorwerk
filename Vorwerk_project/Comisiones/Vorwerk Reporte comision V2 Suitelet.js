/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','N/query','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js','N/record'], 
    function(plugin,task, serverWidget, search, runtime,file,query,Utils,record){
  
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
            var form = createForm();
            var compConfigDetails = Utils.getObjCompConfigDetails();
            
            const params = context.request.parameters;
            
            if(context.request.method == 'POST'){
                var startTime = new Date();
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
                  

                log.audit('Filtros','Tipo : '+cust_type+' Promocion : '+cust_promo+' Periodo : '+cust_period+' Entrega : '+cust_entrega)
                try{
                    sublista(form,cust_type,cust_promo,cust_period,cust_entrega,compConfigDetails,startTime);
                    newCheckTime = new Date();
                    timeDiff = newCheckTime - startTime; //in ms
                    timeDiff /= 1000;
                    log.debug("Checkpoint Fin reporte: ", timeDiff + ' seconds');
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
   
    function createForm(){
        try{
           
            var form = serverWidget.createForm({
                title: 'Reporte de Comisiones V2'
            });
            form.clientScriptFileId = 2834284;//1163010;
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

   
    function sublista(form,cust_type,cust_promo,cust_period,cust_entrega,compConfigDetails,startTime){
        try{

            const fechaPeriodoCalculado = search.lookupFields({ type: 'customrecord_periods', id: cust_period, columns: ['custrecord_inicio','custrecord_final','name']});
            const namePeriodo= fechaPeriodoCalculado.name //mm/yyyy
            const inicioPeriodo = fechaPeriodoCalculado.custrecord_inicio // dd/mm/yyyy
            const finPeriodo = fechaPeriodoCalculado.custrecord_final // dd/mm/yyyy

            //Creacion de sublista y sus campos
            var sublist = addFieldsTabla(form,cust_type,cust_promo,cust_period,cust_entrega)

            //Busqueda de ordenes de venta 3 periodos antes a hoy
            startTime = new Date();
            const salesOrdersData = searchSalesOrders(cust_period,inicioPeriodo,finPeriodo)
            const historicoSO = salesOrdersData.historicoSO
            const thisPeriodSO = salesOrdersData.thisPeriodSO
            const dHistorico=salesOrdersData.dHistorico
            const garantiaSO = salesOrdersData.objGarantiaRep
            const ckSO = salesOrdersData.objCK
            log.debug('historicoSO',historicoSO)
            log.debug('thisPeriodSO',thisPeriodSO)//sales reo
            log.debug('garantiaSO',garantiaSO)
            log.debug('ckSO',ckSO)
            newCheckTime = new Date();
            timeDiff = newCheckTime - startTime; //in ms
            timeDiff /= 1000;
            log.debug("Checkpoint searchSalesOrders: ", timeDiff + ' seconds');
            /*
            Extraer datos:
            thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
            ejemplos:
            var entityX= thisPeriodSO['39360'][2]['5369424']['tranid']
            var dateX= thisPeriodSO['39360'][2]['5369424']['trandate']
            log.debug('entityX', entityX)
            log.debug('dateX', dateX)*/
            
            //Busqueda datos Presentadores
            startTime = new Date();

            const listasPresentadora = searchDataPresentadoras(namePeriodo)
            const allPresentadoras = listasPresentadora.allPresentadorData
            //log.debug('allPresentadoras', allPresentadoras)
            const listaGrupos= listasPresentadora.empGrupos
            //log.debug('listaGrupos', listaGrupos)
            const listaReclutas= listasPresentadora.empReclutas
            //log.debug('listaReclutas', listaReclutas)
            const listaEquipoRecluta=listasPresentadora.equipoYRecluta
            //log.debug('listaEquipoRecluta', listaEquipoRecluta)
            const listaNombramientos=listasPresentadora.nombramiento
            newCheckTime = new Date();
            timeDiff = newCheckTime - startTime; //in ms
            timeDiff /= 1000;
            log.debug("Checkpoint searchDataPresentadoras: ", timeDiff + ' seconds');
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
                log.audit('Generar Reporte LE')
                tipoReporteGloobal = 1
            } else if(cust_type== 1 && cust_promo == 2){//Presentador y tm propia 
                log.audit('Generar Reporte Presentador')
                tipoReporteGloobal = 2
            }else if(cust_type== 1 && cust_promo == 1){// Presentador y Trabaja x TM
                log.audit('Generar Reporte Trabaja x TM')
                tipoReporteGloobal = 3  
            }

            var cont_line = 0
            startTime = new Date();
            for(i in allPresentadoras){
                //Datos EMP
                var empType=allPresentadoras[i].employeetype
                var empPromo=allPresentadoras[i].promocion
                var dataEmp = allPresentadoras[i]
                var empConfiguracion = allPresentadoras[i].emp_conf
                
                //fix Revisar bonos faltantes - los validados a 0 borrarlos 
                var montoComisionCK= false 
                var objVentasPropias = false
                var objEntrega = false
                var objProductividad = false
                var montoEmerald = false
                var montoGarantia = false
                var objReclutamiento = false
                var montoTalento = false
                var objVentaEquipo = false
                var objXmasDos = false
                var objSupercomision = false
                var objVentasEquipoNLE= false
                var objGarantia = false
                var objXmasdosNLE= false
                var objJoya = false 
                var objCook = false
                switch(tipoReporteGloobal){
                    case 1: //Reporte LE
                        if(empType == 3 && empPromo == 2 /*&& allPresentadoras[i].internalid == '2504501'*/){
                            //Calcular reporte para la persona
                            var reclutas = listaReclutas[i]
                            var integrantesEquipo = listaGrupos[i]   
                            var reclutasEquipo = listaEquipoRecluta[i]
                            var ventasEmp = thisPeriodSO[i] 
                            var conf = Utils.getConf(empConfiguracion);
                            //log.debug('ventasEmp',ventasEmp)
                            
                            objVentasPropias = bonoVentaPropia(dataEmp,ventasEmp,compConfigDetails)
                            //log.debug('objVentasPropias',objVentasPropias)
                            
                            objSupercomision = bonoSupercomision(integrantesEquipo,historicoSO,thisPeriodSO,allPresentadoras,dHistorico)
                            //log.debug('objSupercomision',objSupercomision)
                            
                            objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                            //log.debug('objReclutamiento',objReclutamiento)
                            
                            objEntrega = bonoEntrega(dataEmp,ventasEmp,cust_entrega)
                            //log.debug('objEntrega',objEntrega)
                            
                            objXmasDos = bonoXmasDos(dataEmp,reclutasEquipo,thisPeriodSO,ventasEmp,historicoSO,allPresentadoras,dHistorico,integrantesEquipo)
                            
                            objProductividad = bonoProductividad(dataEmp,ventasEmp,compConfigDetails)
                             //log.debug('objProductividad',objProductividad)
                            
                            objVentaEquipo = bonoVentaEquipo(ventasEmp,compConfigDetails,conf,integrantesEquipo,thisPeriodSO)
                            //log.debug('objVentaEquipo',objVentaEquipo)
                            objVentasEquipoNLE=bonoVentaEquipoNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,compConfigDetails)
                            //log.debug('objVentasEquipoNLE',objVentasEquipoNLE)
                            objGarantia = bonoGarantia(dataEmp,garantiaSO,compConfigDetails)
                            //log.debug('objGarantia',objGarantia)
                            objXmasdosNLE=bonoXmasdosNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,listaEquipoRecluta,historicoSO,dHistorico,namePeriodo,cust_period)
                            fillTable(sublist,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objSupercomision,objReclutamiento,objEntrega,objXmasDos,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,objJoya,objCook,objXmasdosNLE)
                            cont_line++
                            
                        }

                    break;
                    case 2: //Reporte Presentadora
                        if(empType == 1 && empPromo == 2){
                            //Calcular reporte para la persona
                            var reclutas=listaReclutas[i]
                            var integrantesEquipo=listaGrupos[i]   
                            var reclutasEquipo=listaEquipoRecluta[i]
                            var ventasEmp =thisPeriodSO[i] 
                            var conf = Utils.getConf(empConfiguracion);
                            log.debug('ventasEmp',ventasEmp)
                            objVentasPropias = bonoVentaPropia(dataEmp,ventasEmp,compConfigDetails)
                            log.debug('objVentasPropias',objVentasPropias)
                            
                            objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                            log.debug('objReclutamiento',objReclutamiento)
                            objEntrega = bonoEntrega(dataEmp,ventasEmp,cust_entrega)
                            log.debug('objEntrega',objEntrega)
                            
                            objProductividad = bonoProductividad(dataEmp,ventasEmp,compConfigDetails)
                            log.debug('objProductividad',objProductividad)
                            objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                            log.debug('objReclutamiento',objReclutamiento)
                            objGarantia = bonoGarantia(dataEmp,garantiaSO,compConfigDetails)
                            log.debug('objGarantia',objGarantia)
                            objJoya = bonoJoya(conf,ventasEmp,compConfigDetails)
                            objCook = bonoCk(dataEmp,ckSO)
                            /*
                            montoComisionCK = bonoComCK()
                            
                            */
                            fillTable(sublist,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objSupercomision,objReclutamiento,objEntrega,objXmasDos,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,objJoya,objCook,objXmasdosNLE)
                            cont_line++
                        }

                    
                    break;
                    case 3: //Reporte Trabaja x TM
                        if(empType == 1 && empPromo == 1){
                            //Calcular reporte para la persona
                            objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                            log.debug('objReclutamiento',objReclutamiento)
                            objCook = bonoCk(dataEmp,ckSO)
                            
                            fillTable(sublist,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objSupercomision,objReclutamiento,objEntrega,objXmasDos,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,objJoya,objCook,objXmasdosNLE)
                            cont_line++
                        }
                    break;
                }
                    
                
                
            }

            newCheckTime = new Date();
            timeDiff = newCheckTime - startTime; //in ms
            timeDiff /= 1000;
            log.debug("Checkpoint Calculo bonos y llenado: ", timeDiff + ' seconds');              
            log.debug('creditos 2',runtime.getCurrentScript().getRemainingUsage()); 
           return form;
          
        }catch(e){
          log.debug("error sublista",e)
          log.debug('creditos 2',runtime.getCurrentScript().getRemainingUsage()); 
        }   
    }//Fin sublista
    function fillTable(sublist,dataEmp,ventasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,supercomision,reclutamiento,entrega,objXmasDos,productividad,ventaEquipo,ventasEquipoNLE,garantia,joya,cookKey,xMasdosNLE){
        var linea = cont_line
        var subtotal=0
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
          if(integrantesEquipo){
            v = integrantesEquipo
          sublist.setSublistValue({
              id : 'custentity_presentadoras',
              line : linea,
              value : v!=''?v:''
          });
          }  
          

            
        }
        if(ventasPropias){  
            var v
            //Venta Propia
            v = ventasPropias.monto>0?ventasPropias.monto:0
            subtotal+=parseInt(v)
            sublist.setSublistValue({
                id : 'custentity_venta_propia',
                line : linea,
                value : v
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
        if(entrega){
            var v
            
            //ntrega monto
            v = entrega.monto>0?entrega.monto:0
            subtotal+=parseInt(v)
            sublist.setSublistValue({
                id : 'custentity_entrega',
                line : linea,
                value : v
            });
            //entrega numero
            v = entrega.data.length
            sublist.setSublistValue({
                id : 'custentity_num_entrega',
                line : linea,
                value : v!=0?v:0
            });
            //entrega odv
            v = JSON.stringify(entrega.data)
            sublist.setSublistValue({
                id : 'custentity_odv_entrega',
                line : linea,
                value : v!=''?v:''
            });

        }

        if(supercomision){
           
          //ODV Por recluta del mes del Equipo SC
          v = JSON.stringify(supercomision.data)
          sublist.setSublistValue({
              id : 'custentity_odv_pre_supercomision',
              line : linea,
              value : v!=''?v:''
          });
          //Numero de ventas SC
          v = supercomision.ventasNo
          sublist.setSublistValue({
              id : 'custentity_ventas_sc',
              line : linea,
              value : v!=0?v:0
          });
          //Bono supercomision
          v = supercomision.monto>0?supercomision.monto:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_bono_sc',
              line : linea,
              value : v
          });
        }
        
        if(reclutamiento){
          //log.debug('bonoReclutamiento filltable')          
          v = reclutamiento.monto>0?reclutamiento.monto:0
          subtotal+=parseInt(v)
          //log.debug('vbono reclutamiento',v)
          sublist.setSublistValue({
              id : 'custentity_bono_rec',
              line : linea,
              value : v
          });
          v = JSON.stringify(reclutamiento.data)
          //log.debug('vStringRec',v)
          sublist.setSublistValue({
              id : 'custentity_odv_rec',
              line : linea,
              value : v!=''?v:''
          });
          
        }
        if(objXmasDos){
          
          //log.debug('32 filltable',tresDos )
          v = JSON.stringify(objXmasDos.data)
          //log.debug('vdata',v)
          //Reclutas con ventas
          sublist.setSublistValue({
              id : 'custentity_rec_con_ventas',
              line : linea,
              value : v!=""?v:""
          });
          //equipo 
          v = JSON.stringify(objXmasDos.equipo)
          //log.debug('vdata',v)
          sublist.setSublistValue({
              id : 'custentity_odv_rec_del_periodo',
              line : linea,
              value : v!=""?v:""
          });
          //Bono 3+2
          v = objXmasDos.monto32>0?objXmasDos.monto32:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_bono_tres_dos',
              line : linea,
              value : v
          });
          //Bono 5+2
          v = objXmasDos.monto52>0?objXmasDos.monto52:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_bono_cinco_dos',
              line : linea,
              value : v
          });
        }
        
        if(productividad){
          //log.debug('bonoReclutamiento filltable')
          v = productividad.monto>0?productividad.monto:0
          subtotal+=parseInt(v)
          //log.debug('vmontoProductividad',v)
          sublist.setSublistValue({
              id : 'custentity_bono_productividad',
              line : linea,
              value : v
          });
          
        }
        if(ventaEquipo){
         
          v = ventaEquipo.porcentaje
          sublist.setSublistValue({
              id : 'custentity_porcentaje',
              line : linea,
              value : v!=''?v:''
          });
          
          v = ventaEquipo.monto>0?ventaEquipo.monto:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_venta_equipo',
              line : linea,
              value : v
          });
          
          v = ventaEquipo.infoVentasEquipo!=''?ventaEquipo.infoVentasEquipo:''
          sublist.setSublistValue({
              id : 'custentity_odv_equipo',
              line : linea,
              value : JSON.stringify(v)
          });
        }
        if(ventasEquipoNLE){
          
          v = ventasEquipoNLE.data
          sublist.setSublistValue({
              id : 'custentity_lider_nle',
              line : linea,
              value : v!=''?v:''
          });
          
          v = ventasEquipoNLE.monto>0?ventasEquipoNLE.monto:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_nle_monto',
              line : linea,
              value : v
          });
          
        }

        if(garantia){
         
          v = garantia.data.length
          sublist.setSublistValue({
              id : 'custentity_garantia_num',
              line : linea,
              value : v!=''?v:''
          });
          v = garantia.data
          sublist.setSublistValue({
              id : 'custentity_bono_garantia_ids',
              line : linea,
              value : v!=''?v:''
          });
          v = garantia.monto>0?garantia.monto:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_garantia_monto',
              line : linea,
              value : v
          });
          
        }
        if(joya){
            v = joya.monto>0?joya.monto:0
            subtotal+=parseInt(v)
            sublist.setSublistValue({
              id : 'custentity_bono_emerald',
              line : linea,
              value : v
            });
        }
        if(cookKey){
        
            v = cookKey.data
            sublist.setSublistValue({
                id : 'custentity_cookkey',
                line : linea,
                value : v!=''?v:''
            });
            v = cookKey.monto>0?cookKey.monto:0
            subtotal+=parseInt(v)
            sublist.setSublistValue({
              id : 'custentity_cookkey_comision',
              line : linea,
              value : v
            });
        }
        if(xMasdosNLE){
          
          v = xMasdosNLE.data
          sublist.setSublistValue({
              id : 'custentity_xmasdos_nle',
              line : linea,
              value : v!=''?v:''
          });
          
          v = xMasdosNLE.monto52>0?xMasdosNLE.monto52:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_cincomasdos_nle_monto',
              line : linea,
              value : v
          });
          v = xMasdosNLE.monto32>0?xMasdosNLE.monto32:0
          subtotal+=parseInt(v)
          sublist.setSublistValue({
              id : 'custentity_tresmasdos_nle_monto',
              line : linea,
              value : v
          });
          
        }


        var v = subtotal>0?subtotal:0
       // log.debug('subtotal v',v)
        sublist.setSublistValue({
            id : 'custentity_total',
            line : linea,
            value : v
        });
        //log.debug('subtotal',subtotal)
          
        
        return fillTable;
          
        

    }
    function bonoCk(dataEmp,ckSO){
        try{
            if(ckSO.hasOwnProperty(dataEmp.internalid)){
                var numCK = ckSO[dataEmp.internalid].length
                var idsCK = ckSO[dataEmp.internalid]
                var comision_ck = numCK*350 

                return {monto:comision_ck,data:idsCK, numCK:numCK}
            }
           return false 
            
        }catch(e){
            log.error('error bono ck',e)
        }

    }

    
    function bonoJoya(conf,ventasEmp,compConfigDetails){
        try{
            var ventasP = ventasEmp
            //log.debug('ventas',ventasP)
            var data = []
            for (i in ventasP){
                var ventasData= Object.keys(ventasP[i])
                var comisionables = ventasP[i][ventasData]['custbody_vw_comission_status']
                var tipoVenta = ventasP[i][ventasData]['custbody_tipo_venta']
                //log.debug('comisionables',comisionables)
                if( tipoVenta != 'TM Ganada'&& comisionables != 'No Comisionable'){
                    data.push(ventasData)
                }
                
            }
            var t_venta_propia = data.length

            var bono_emerald = parseInt(compConfigDetails[conf]['esquemaVentasPresentadora'][t_venta_propia]['bonoProductividad']) - parseInt(compConfigDetails['1']['esquemaVentasPresentadora'][t_venta_propia]['bonoProductividad'])
            //log.debug('bono_emerald',bono_emerald)
            return {monto:bono_emerald}
            
        }catch(e){
            log.error('error bono joya',e)
        }

    }
    function bonoXmasdosNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,listaEquipoRecluta,historicoSO,dHistorico,namePeriodo,cust_period){
        try{
            var liderM=dataEmp.internalid//lider madre
            var montoTotal52= 0
            var montoTotal32= 0
            if(listaNombramientos.hasOwnProperty(liderM)){//Se valida si la lider tiene lideres hijos
                var liderHijo = {}
                //log.debug('liderM',liderM)
                //log.debug('listaNombramientos de la lider ', listaNombramientos[liderM])
                for(i in listaNombramientos[liderM]){//por cada lider hijo se obtiene su configuracion, equipo y ventas y se llama al bono Venta equpi para calcular el monto
                    var periodoPagoNLE= allPresentadoras[listaNombramientos[liderM][i]].periodoPagoNLE
                    
                    if(periodoPagoNLE == cust_period || !periodoPagoNLE){
                        //log.debug('campo vacio')

                        var dataEmpH=allPresentadoras[listaNombramientos[liderM][i]]
                        var idHijo = dataEmpH.internalid
                        var empConf=allPresentadoras[listaNombramientos[liderM][i]].emp_conf
                           // log.debug('lista empConf', empConf)
                        var configH=Utils.getConf(empConf);
                            //log.debug('lista configH', configH)
                        var equipoH=listaGrupos[listaNombramientos[liderM][i]]
                           // log.debug('lista equipoH', equipoH)
                        var reclutaEquipoH=listaEquipoRecluta[listaNombramientos[liderM][i]]
                        var ventasH= thisPeriodSO[listaNombramientos[liderM][i]]
                            //log.debug('lista ventasH', ventasH)
                        

                        var xMasdosH=bonoXmasDos(dataEmpH,reclutaEquipoH,thisPeriodSO,ventasH,historicoSO,allPresentadoras,dHistorico,equipoH)
                          
                        var montoNLE32=xMasdosH.monto32
                        var montoNLE52=xMasdosH.monto52
                        
                        if(montoNLE32 > 0 || montoNLE52 > 0){
                        //log.debug('montoNLE32',montoNLE32)
                        //log.debug('montoNLE52',montoNLE52)
                            log.debug('actualizacion de registro de ', idHijo)
                            var submitFields = record.submitFields({
                                            type: 'employee',
                                            id: idHijo,
                                            values: {'custentityperiodo_nle_pago':cust_period}
                                        });
                        }
                        montoTotal52 += montoNLE52//se suman los montos de cada lider hijo para obtener el monto total a pagar a la lider madre
                        montoTotal32 += montoNLE32
                    }
                    //log.debug('montoTotal52',montoTotal52)
                   // log.debug('montoTotal32',montoTotal32)
                }
                liderHijo= listaNombramientos[liderM]
                return {monto32:montoTotal32,monto52:montoTotal52,data:liderHijo}
            }
            return false
        }catch(e){
            log.error('error bono X+2 NLE',e)
        }

    }
    function bonoGarantia(dataEmp,garantiaSO,compConfigDetails){
        try{
            if(garantiaSO.hasOwnProperty(dataEmp.internalid)){
                var numGarantias = garantiaSO[dataEmp.internalid].length
                var idsGarantias = garantiaSO[dataEmp.internalid]
                comisionGarantia = compConfigDetails[9]['esquemaVentasPresentadora'][numGarantias]['compensacion'] 

                return {monto:comisionGarantia,data:idsGarantias}
            }
            return false
        }catch(e){
            log.error('error bono garantia',e)
        }

    }
    function bonoVentaEquipoNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,compConfigDetails){
        try{
            var liderM=dataEmp.internalid//lider madre
            var montoTotal= 0
            
            if(listaNombramientos.hasOwnProperty(liderM)){//Se valida si la lider tiene lideres hijos
                var liderHijo = {}
                //log.debug('liderM',liderM)
                //log.debug('listaNombramientos de la lider ', listaNombramientos[liderM])
                for(i in listaNombramientos[liderM]){//por cada lider hijo se obtiene su configuracion, equipo y ventas y se llama al bono Venta equpi para calcular el monto
                    var empConf=allPresentadoras[listaNombramientos[liderM][i]].emp_conf
                       // log.debug('lista empConf', empConf)
                    var configH=Utils.getConf(empConf);
                        //log.debug('lista configH', configH)
                    var equipoH=listaGrupos[listaNombramientos[liderM][i]]
                       // log.debug('lista equipoH', equipoH)
                    var ventasH= thisPeriodSO[listaNombramientos[liderM][i]]
                        //log.debug('lista ventasH', ventasH)
                    
                    var ventaEquipoH=bonoVentaEquipo(ventasH,compConfigDetails,configH,equipoH,thisPeriodSO)
                       // log.debug('ventaEquipoH',ventaEquipoH)
                    var montoNLE=ventaEquipoH.monto
                    montoTotal += montoNLE//se suman los montos de cada lider hijo para obtener el monto total a pagar a la lider madre
                    
                }
                liderHijo= listaNombramientos[liderM]
                return {monto:montoTotal, data:liderHijo}
            }else{
                return false
            }
            //log.debug('lista montoTotal', montoTotal)
                          
        }catch(e){
            log.error('bonoVentaEquipoNLE ', e)
            return false
        }
        

    }
    function bonoVentaEquipo(ventasEmp,compConfigDetails,conf,integrantesEquipo,thisPeriodSO){
        try{
            var ventasP = ventasEmp
            //log.debug('ventas',ventas)
            //Ventas propias 
            var data = []
            for (i in ventasP){
                var ventasData= Object.keys(ventasP[i])
                var comisionables = ventasP[i][ventasData]['custbody_vw_comission_status']
                var tipoVenta = ventasP[i][ventasData]['custbody_tipo_venta']
                //log.debug('comisionables',comisionables)
                if( tipoVenta != 'TM Ganada'){
                    data.push(ventasData)
                }
                
            }
            var t_venta_propia = data.length


            var porcentaje

            //Recorrido de integrantes del equipo
            var numeroVentasEquipo=0
            var infoVentasEquipo ={}
            var venta_equipo = 0
            //log.debug('t_venta_propia',t_venta_propia)
            //log.debug('conf',conf)
            for(n in integrantesEquipo){
                var ventas=[]
                var ventasint= thisPeriodSO[integrantesEquipo[n]]
                //Recorrido de las ventas de cada integrante de equipo
                for(x in ventasint){
                    var key = Object.keys(ventasint[x])
                    var tipoVenta=ventasint[x][key]['custbody_tipo_venta'] 
                    //log.debug('key',key)
                    //log.debug('tipoVenta',tipoVenta)
                    if(tipoVenta!='TM Ganada'){
                        ventas.push(key)
                    }
                }
                    
                //log.debug('ventasint',ventasint)
                //log.debug('ventas',ventas)
                if(ventas!=''){
                    //log.debug('ventas length',ventas.length)
                    infoVentasEquipo[integrantesEquipo[n]] = ventas
                    numeroVentasEquipo += ventas.length
                }
            }
            //log.debug('numeroVentasEquipo',numeroVentasEquipo)

            for ( i in compConfigDetails[1]['esquemaVentasJefaGrupo']['propias'] ){
                var desde = compConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['desde']
                var hasta = compConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['hasta']
                //log.debug('desde',desde)
                //log.debug('hasta',hasta)
                if (t_venta_propia >= desde && t_venta_propia <= hasta){
                    porcentaje = compConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['porcentaje']
                   //log.debug('porcentaje',porcentaje)
                     break;
                }
            }
            if(t_venta_propia >0 ){
                num_=Object.keys(compConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'])
                inf=compConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo']
                for(num_ in inf ){//Recorre la configuracion hasta entrar en el rango de ventas
                    var hasta= compConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'][num_]['hasta']
                    var desde= compConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'][num_]['desde']
                    if(numeroVentasEquipo >= desde && numeroVentasEquipo <= hasta){
                        venta_equipo = (compConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'][num_]['compensacion'])*(parseInt(porcentaje)/100)
                        //log.debug('venta_equipo',venta_equipo)
                        break;
                    }
                }
            }
                              
        }catch(e){
            log.error('bonoVentaEquipo ', e)
        }
        return {monto:venta_equipo, porcentaje:porcentaje, infoVentasEquipo:infoVentasEquipo}

    }
    function bonoProductividad(dataEmp,ventasEmp,compConfigDetails){
        try{
            var config=dataEmp.emp_conf
            var ventas = ventasEmp
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
              
            // bono_productividad = CompConfigDetails['1']['esquemaVentasPresentadora'][total_venta_p]['bonoProductividad']
            var montoProductividad= compConfigDetails[1]['esquemaVentasPresentadora'][ventasNo]['bonoProductividad']
            //log.debug('montoProductividad', montoProductividad)
            //monto: Monto de cal cof a partir del numero de ventas 
            //data: Arreglo de Internal id de Sales Order del EMP
            return {monto:montoProductividad, data:data} 
        }catch(e){
            log.error('Error bono productividad', e)
            return false
        }
      
    }
    
    function bonoXmasDos(dataEmp,reclutasEquipo,thisPeriodSO,ventasEmp,historicoSO,allPresentadoras,dHistorico,integrantesEquipo){
        try{
/*El bono considera a las lideres con 3 o mas ventas propias y que tengan dos presentadoras activas(que son reclutas y parte del equipo
y que han echo su primera venta dentro de sus primeron 30 dias despues de su contratacion) o bien una presentadora activa y una miembro 
del equipo aunque esta ultima ano haya sido reclutada por la lider*/
            var lider= dataEmp.internalid
            var salesOrders={}
            var salesOrdersEq={}
            var preActivas=''
            var equipoActivas=''
            var monto32 = 0
            var monto52 = 0
            if (reclutasEquipo){//si esta lider tiene reclutas obtenemos su fecha de contratacion o de reactivacion
                reclutasEquipo.forEach(function(i,index) {
                
                    var hiredate=allPresentadoras[i]['hiredate']
                    var reactivacion=allPresentadoras[i]['fechaReactivacion']
                    var fechaObjetivo = allPresentadoras[i]['objetivo_1']
                    var valiDate
                    if(reactivacion){
                        valiDate=Utils.stringToDate(reactivacion)
                        fechaObjetivo=allPresentadoras[i]['obj_1_reactivacion']
                    }else{
                        valiDate=Utils.stringToDate(hiredate)
                    }
                    if(valiDate>dHistorico){//si esa fecha es mayor que la fecha del historico validamos si tiene ventas en el historico
                        if(historicoSO.hasOwnProperty(i)){//si hay ventas en el historico queda descartado
            
                        }else{//si no, validamos si tienen ventas en este periodo
                            var ventas = thisPeriodSO[i]//Ventas del integrante del equipo
                            //log.debug('ventas',ventas)
                            for(n in ventas){
                                var key = Object.keys(ventas[n])
                                //log.debug('key venta n de la recluta '+i,key)
                                var fechaSO =ventas[n][key]['trandate']
                                var recSO=ventas[n][key]['salesrep']
                                //log.debug('fechaObjetivo',Utils.stringToDate(fechaObjetivo))
                                //log.debug('fechaSO',Utils.stringToDate(fechaSO))
                                if(Utils.stringToDate(fechaSO) <= Utils.stringToDate(fechaObjetivo)){
                                  //log.debug('SO dentro de la fecha objetivo',key) 
                                  if(salesOrders.hasOwnProperty(recSO)){
                                    salesOrders[recSO].push(key)
                                    }else{
                                        salesOrders[recSO]=(key)
                                    }
                                }
                            }  
                        }
                    }
                })
                if (integrantesEquipo){// obtenemos su fecha de contratacion o de reactivacion de las integrantes del equipo
                   integrantesEquipo.forEach(function(i,index) {
                        var hiredate=allPresentadoras[i]['hiredate']
                        var reactivacion=allPresentadoras[i]['fechaReactivacion']
                        var fechaObjetivo = allPresentadoras[i]['objetivo_1']
                        var valiDateEq
                        if(reactivacion){
                            valiDateEq=Utils.stringToDate(reactivacion)
                        }else{
                            valiDateEq=Utils.stringToDate(hiredate)
                        }
                        if(valiDateEq>dHistorico){//si esa fecha es mayor que la fecha del historico validamos si tiene ventas en el historico
                            if(historicoSO.hasOwnProperty(i)){//si hay ventas en el historico queda descartado
                                //log.debug('ventas historico de '+i,historicoSO[i] )
                            }else{//si no, validamos si tienen ventas en este periodo
                                var ventasEq = thisPeriodSO[i]
                                for(n in ventasEq){
                                    var key = Object.keys(ventasEq[n])
                                    //log.debug('key eq de l recluta '+i,key)
                                    var fechaSO =ventasEq[n][key]['trandate']
                                    var recSO=ventasEq[n][key]['salesrep']
                                    //log.debug('fechaObjetivo eq',Utils.stringToDate(fechaObjetivo))
                                    //log.debug('fechaSO eq',Utils.stringToDate(fechaSO))
                                    if(Utils.stringToDate(fechaSO) <= Utils.stringToDate(fechaObjetivo)){
                                      //log.debug('SO dentro de la fecha objetivo eq',key) 
                                      if(salesOrdersEq.hasOwnProperty(recSO)){
                                        salesOrdersEq[recSO].push(key)
                                        }else{
                                            salesOrdersEq[recSO]=(key)
                                        } 
                                    }
                                }  
                            }
                        }
                    })
               }
               
               preActivas= Object.keys(salesOrders)//presentadoras que son recluta y equipo activas
               equipoActivas=Object.keys(salesOrdersEq)//presentadoras que son equipo activas
               /*log.debug('preActivas',preActivas)
               log.debug('ventasEmp',ventasEmp)
               log.debug('equipoActivas',equipoActivas)*/
               if(ventasEmp){
                if(ventasEmp.length> 2 && ventasEmp.length<5 && equipoActivas.length >= 2 && preActivas.length > 0){
                    monto32 = 5000
                    monto52 = 0
                }
                if(ventasEmp.length>4 && equipoActivas.length >= 2 && preActivas.length > 0){
                    monto32 = 0
                    monto52 = 8000
                }
               }
               
            }   
            return {monto52:monto52,monto32:monto32, data:preActivas,equipo:equipoActivas} 
        }catch(e){
            log.debug('error X+2',e)
        }    
        
    }
   function bonoSupercomision(integrantesEquipo,historicoSO,thisPeriodSO,allPresentadoras,dHistorico){
        try{
            var ventasNo = 0
            var montoSC = 0
            var ventasPeriodo =[]
            var ordenesSupercomisionTotal=[]
            if(integrantesEquipo){
                integrantesEquipo.forEach(function(i,index) {
                    //log.debug('integrante',i)
                    var hiredate = allPresentadoras[i]['hiredate']
                    var reactivacion = allPresentadoras[i]['fechaReactivacion']
                    var conf = allPresentadoras[i]['conf_reclutamiento']
                    if(conf !=''){
                        var confRec = conf
                    }else{
                        var confRec = 1 
                    }
                    if(confRec == 11 || confRec == 12 || confRec == 13 || confRec == 14){
                        var noComisiona = 4
                    }else{
                        var noComisiona = 6
                    }
                    var dObjetivo2 = allPresentadoras[i]['objetivo_2']
                    //log.debug('confRec',confRec)
                    var dcontratacion
                    if(reactivacion == ''){
                        dcontratacion = Utils.stringToDate(hiredate)
                    }else{
                        dcontratacion = Utils.stringToDate(reactivacion)
                        dObjetivo2=allPresentadoras[i]['obj_2_reactivacion']
                    }
                    if(dcontratacion > dHistorico){
                        var ventasHistorico
                        if(historicoSO[i]){
                            ventasHistorico = historicoSO[i].length
                        }else{
                            ventasHistorico = 0
                        }
                        //log.debug('ventasHistorico',ventasHistorico)
                        var ordenesSCintegrante=[]
                        if(thisPeriodSO[i] && ventasHistorico < noComisiona){
                            var ordenesFaltantes= noComisiona-ventasHistorico
                            
                            //log.debug('ordenesFaltantes',ordenesFaltantes)
                            var ordenesPeriodo=[]
                            for(x in thisPeriodSO[i]){
                                var key = Object.keys(thisPeriodSO[i][x])
                                var tipoVenta=thisPeriodSO[i][x][key]['custbody_tipo_venta'] 
                                var dateSO=thisPeriodSO[i][x][key]['trandate']
                                if(tipoVenta != 1 && Utils.stringToDate(dateSO)<Utils.stringToDate(dObjetivo2)){
                                    ordenesPeriodo.push(thisPeriodSO[i][x])
                                }
                            }
                            // log.debug('ordenesPeriodo',ordenesPeriodo)
                            if(ordenesPeriodo.length <= ordenesFaltantes  ){
                                ordenesSCintegrante = ordenesPeriodo                 
                            }else{
                                var cont = 0 
                                for(j in ordenesPeriodo){
                                    cont ++
                                    ordenesSCintegrante.push(ordenesPeriodo[j]) 
                                    if(cont >= ordenesFaltantes){
                                        break
                                    }
                                }
                            }
                            // log.debug('ordenesSCintegrante',ordenesSCintegrante)
                            ordenesSupercomisionTotal.push(ordenesSCintegrante)
                        } 
                    }
            });
            //log.debug('ordenesSupercomisionTotal',ordenesSupercomisionTotal)
            for(x in ordenesSupercomisionTotal){
                for(y in ordenesSupercomisionTotal[x]){
                    var keys = Object.keys(ordenesSupercomisionTotal[x][y])
                    //log.debug('keys',keys)
                    ventasPeriodo.push(keys)
                }
                //log.debug('ordenesSupercomisionTotal',ordenesSupercomisionTotal[x][y])
            }
                //log.debug('ventasPeriodo',ventasPeriodo)
                ventasNo= ventasPeriodo.length
                montoSC= ventasNo*500        
                if(montoSC == 0 && ventasNo== 0 ) {
                    ventasPeriodo=''
                }                  
            }
            //log.debug('montoSC',montoSC)
            //log.debug('ventasPeriodo',ventasPeriodo)
            //log.debug('ventasNo',ventasNo)
            return  {monto:montoSC, data:ventasPeriodo, ventasNo:ventasNo};  
        }catch(e){
            log.debug('error Supercomision', e)
            return false
        }
         
    }


    function bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico){
        try{
            if(reclutas){
                var bono_reclutadora = 0
                var ordenes = {}
                var salesReclutas = {}

                reclutas.forEach(function(i,index) {//Se recorren las reclutas del Presentador
                    //log.debug('recluta',i)
                    var ventasReclutaTP = thisPeriodSO[i];
                    //log.debug('ventasReclutaTP',ventasReclutaTP)
                    var montoInd = 0  
                    if(ventasReclutaTP){//Debe tener Ventas en el periodo calculado
                        
                        var ventasReclutaH = historicoSO[i];
                        var confRec = allPresentadoras[i]['conf_reclutamiento']?allPresentadoras[i]['conf_reclutamiento']:1
                        var hiredate = allPresentadoras[i]['hiredate']
                        var fechaObjetivo = allPresentadoras[i]['objetivo_2']
                        var reactivacion = allPresentadoras[i]['fechaReactivacion']
                        var dcontratacion
                        if(reactivacion == ''){
                            dcontratacion = Utils.stringToDate(hiredate)
                        }else{
                            dcontratacion = Utils.stringToDate(reactivacion)
                            fechaObjetivo = allPresentadoras[i]['obj_2_reactivacion']
                        }
                        fechaObjetivo = Utils.stringToDate(fechaObjetivo)
                        if(dcontratacion > dHistorico && ventasReclutaTP){//Si su contratacion/Reactivacion es anterios a 3 meses se asume que ya se pagó su reclutamiento
                            
                            var salesReclutaTP =[]

                            if(confRec == 11 || confRec == 12 || confRec == 13 || confRec == 14){
                                var noComisiona = 4
                            }else{
                                var noComisiona = 6
                            }

                            var cont = 0
                            var faltantesRec = 0
                            if( ventasReclutaH ){  
                                cont = ventasReclutaH.length 
                                faltantesRec = noComisiona - ventasReclutaH.length 
                            }else{
                                faltantesRec = noComisiona
                            }
                            if(faltantesRec > 0){ 
                                for(j in ventasReclutaTP){//Se recorren las Ordenes de cada recluta del Presentador
                                    key = Object.keys(ventasReclutaTP[j])
                                    var tipoVenta = ventasReclutaTP[j][key]['custbody_tipo_venta']
                                    var fechaSO = ventasReclutaTP[j][key]['trandate']
                                    fechaSO = Utils.stringToDate(fechaSO)
                                    if(tipoVenta == 'Ventas TM'&& fechaSO <= fechaObjetivo){
                                        cont ++  
                                        montoInd = montoInd + Math.abs(compConfigDetails[confRec]['esquemaVentasReclutamiento'][cont]['compensacion'])
                                        salesReclutaTP.push(ventasReclutaTP[j][key]['internalid'])
                                        if(cont >= noComisiona){
                                            break
                                        }
                                    }
                                    
                                }
                            }
                             
                        }
                        salesReclutas[i] = salesReclutaTP
                        bono_reclutadora += montoInd
                    }
                });
                return  {monto:bono_reclutadora, data:salesReclutas}; 
            } 
            
        }catch(e){
            log.error('error reclutamiento',e)
            return false
        }     
    }
  
    function bonoEntrega(dataEmp,empSOThisPeriod,cust_entrega){
    try{
        //log.debug('cust_entrega',cust_entrega)
        var dataEnt = []
        var montoEntrega=0
        if(cust_entrega==1){
            //log.debug('Pagar entrega')
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
            
            //monto: Monto a partir del numero de ventas 
            //data: Arreglo de Internal id de Sales Order del EMP
            montoEntrega=parseInt(ventasNo)*500
            return {monto:montoEntrega, data:dataEnt}                        
        }else if (cust_entrega == 2){
            return false
        }
    }catch(e){
        log.debug('error entrega',e)
    }

    }
    function bonoVentaPropia(dataEmp,empSOThisPeriod,compConfigDetails){
        try{
            if(empSOThisPeriod){
                var ventas = empSOThisPeriod
                //log.debug('ventas',ventas)
                var data = []
                for (i in ventas){
                    var ventasData= Object.keys(ventas[i])
                    //thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
                    var comisionables = ventas[i][ventasData]['custbody_vw_comission_status']
                    var tipoVenta = ventas[i][ventasData]['custbody_tipo_venta']
                    //log.debug('comisionables',comisionables)
                    if(comisionables != 2 && tipoVenta != 1){
                      data.push(ventasData)
                    }

                }
                var ventasNo = data.length
                //compConfigDetails[tipo de cofiguracion][etiqueta del esquema][No de ventas][etiqueta de la compensacion monto]
                var montoVentasPre= compConfigDetails[1]['esquemaVentasPresentadora'][ventasNo]['compensacion']
    /*
    log.debug('montoVentasPre', montoVentasPre)
    monto: Monto de cal cof a partir del numero de ventas 
    data: Arreglo de Internal id de Sales Order del EMP
    */

                return {monto:montoVentasPre, data:data}
            }
            return false
        }catch(e){
            log.debug('error venta propia',e)
            return false
        }
    }

    function searchDataPresentadoras(namePeriodo){ 
        try{
           
            const employeeSearchFilters = [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custentity_estructura_virtual', 'is', 'F'],
                'AND',
                ['salesrep', 'is', 'T'],
                'AND',
                ['employeetype', 'anyof', '3', '1', '8', '5', '9'],//tipos 3 Lider de equipo, 1 presentadora, 8 area manager, 5 gerente de ventas, 9 sales director
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
            //const empSearchtiponombramiento = search.createColumn({ name: 'custentity_nombramiento_le'});
            const empSearchnombradopor = search.createColumn({ name: 'custentity_nombramiento'});
            const empSearchfechanombramiento = search.createColumn({ name: 'custentity_fecha_nombramiento'});
            const empSearchPeriodoPagoNLE = search.createColumn({ name: 'custentityperiodo_nle_pago'});

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
                    //empSearchtiponombramiento,
                    empSearchnombradopor,
                    empSearchfechanombramiento,
                    empSearchPeriodoPagoNLE,


                ],
            });
            

            var allPresentadorData = {} //Todos los datos de todos los presentadores activos arreglo[presentadora] = {obj1:20/01/2024, conf: CC01...}
            var empGrupos = {} //Arreglo de lideres de equipo y sus integrantes arreglo[liderGrupo] = [integrante1,integrante2...]
            var empReclutas = {}//Arreglo de presentadores y sus reclutados arreglo[Reclutadora] = [reclutada1,reclutada2...]
            var nombradsPor={}//arreglo de presentadoras
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
                    //objEMP.tipoNombramento = r.getValue('custentity_nombramiento_le')
                    objEMP.nombramientoPor = r.getValue('custentity_nombramiento')
                    objEMP.fechaNombramiento = r.getValue('custentity_fecha_nombramiento')
                    objEMP.periodoPagoNLE = r.getValue('custentityperiodo_nle_pago')

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

                    if(objEMP.nombramientoPor != ''){
                        var periodo=namePeriodo.split('/')
                        var mesPeriodo = parseInt(periodo[0])
                        var yearPeriodo=parseInt(periodo[1])

                        var mesMinimo=mesPeriodo-3    
                        var fechaNombramiento=objEMP.fechaNombramiento.split('/')
                        var mesNombramiento=parseInt(fechaNombramiento[1])
                        var yearNom=parseInt(fechaNombramiento[2])

                        if(mesNombramiento>mesMinimo&&mesNombramiento <= mesPeriodo&&yearNom ==yearPeriodo){

                            if(nombradsPor.hasOwnProperty(objEMP.nombramientoPor)){
                            nombradsPor[objEMP.nombramientoPor].push(objEMP.internalid)
                            }else{
                                nombradsPor[objEMP.nombramientoPor] = [objEMP.internalid]
                            }
                          
                        }
                    }

                });
                      
            });
            //log.debug('nombradsPor',nombradsPor)
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

            
            return {allPresentadorData:allPresentadorData,empGrupos:empGrupos,empReclutas:empReclutas,equipoYRecluta:equipoYRecluta,nombramiento:nombradsPor}
        }catch(e){
            log.error('Error en searchDataPresentadoras',e)
        }
    }
    function searchSalesOrders(cust_period,inicioPeriodo,finPeriodo){
        try{
            const inicioPeriodoDate =  Utils.stringToDate(inicioPeriodo)
            const finPeriodoDate = Utils.stringToDate(finPeriodo)
            var dHistorico = Utils.restarMeses(inicioPeriodo, 3); //Fecha 3 meses antes del periodo calculado
            log.debug('dHistorico',inicioPeriodoDate)
            
            try{
                var objGarantiaRep = {};
                var objCK = {};
                const salesOrderSearchFilters = [
                    ['item', 'anyof', '2402','1749'],
                    'AND',
                    ['salesrep.isinactive', 'is', 'F'],
                    'AND',
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['formulatext: {salesrep}', 'isnotempty', ''],
                    'AND',
                    ['salesrep.custentity_estructura_virtual', 'is', 'F'],
                    'AND',
                    ['custbody_tipo_venta', 'anyof', '2'],
                ];

                const salesOrderSearchColSalesRep = search.createColumn({ name: 'salesrep' });
                const salesOrderSearchColTranId = search.createColumn({ name: 'tranid' });
                const salesOrderSearchColInternalId = search.createColumn({ name: 'internalid' });
                const salesOrderSearchColTranDate = search.createColumn({ name: 'trandate' });
                const salesOrderSearchColItem = search.createColumn({ name: 'item' });

                const searchSalesGar = search.create({
                    type: 'salesorder',
                    filters: salesOrderSearchFilters,
                    columns: [
                        salesOrderSearchColSalesRep,
                        salesOrderSearchColTranId,
                        salesOrderSearchColInternalId,
                        salesOrderSearchColTranDate,
                        salesOrderSearchColItem,
                       
                    ],
                });
                searchSalesGar.filters.push(search.createFilter({
                       name: 'trandate',
                       operator: 'within',
                       values: [Utils.dateToString(inicioPeriodoDate),Utils.dateToString(finPeriodoDate)]
                }));
                var pagedResults = searchSalesGar.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                   var currentPage = pagedResults.fetch({index: pageRange.index});
                   currentPage.data.forEach(function (r) {
                        var salrep = r.getValue('salesrep')
                        var item = r.getValue('item')

                        if(item == '2402'){
                            if(salrep in objGarantiaRep){
                            objGarantiaRep[salrep].push(r.getValue('internalid'));
                            }else{
                               objGarantiaRep[salrep]= [r.getValue('internalid')]; 
                            }
                        }
                        if(item == '1749'){
                            if(salrep in objCK){
                            objCK[salrep].push(r.getValue('internalid'));
                            }else{
                               objCK[salrep]= [r.getValue('internalid')]; 
                            }
                        }
                   });

                });
            }catch(e){
                log.error('error busqueda garantia',e)
            }
            
            var historicoSO = {}
            var thisPeriodSO = {}

            var myLoadedQuery = query.load({ id: 'custworkbook3'}); 

            var mySuiteQLQuery = myLoadedQuery.toSuiteQL();

            var pagedResults = query.runSuiteQLPaged({
                query: mySuiteQLQuery.query,
                params: mySuiteQLQuery.params,
                pageSize: 1000
            });

            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.asMappedResults().forEach(function (r) {
                    var dateSO = Utils.stringToDate(r.trandate)
                   
                    var objSO = new Object();
                    objSO.internalid = r.id
                    objSO.trandate = r.trandate
                    objSO.tranid = r.tranid
                    objSO.entity = r.entity
                    objSO.salesrep = r.id_1
                    objSO.custbody_tipo_venta = r.custbody_tipo_venta
                    objSO.custbody_vw_comission_status = r.custbody_vw_comission_status
                    objSO.custbody_otro_financiamiento = r.custbody_otro_financiamiento
                    objSO.custbody_vw_recruiter = r.custbody_vw_recruiter
                   
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

            /*
            var results = myResultSet.asMappedResults();

            log.debug('results Search SO',results)
            log.debug('Total SO',Object.keys(results).length)
            
            var historicoSO = {}
            var thisPeriodSO = {}
           

            

            var myLoadedQuery = query.load({ id: 'custworkbook3'}); 
            log.debug('myLoadedQuery',myLoadedQuery)
            var mySuiteQLQuery = myLoadedQuery.toSuiteQL();
            log.debug('mySuiteQLQuery',mySuiteQLQuery)

            log.debug('mySuiteQLQuery.query',mySuiteQLQuery.query)
            var objPagedData = query.runSuiteQLPaged({
                query: mySuiteQLQuery.query,
                params: mySuiteQLQuery.params,
                pageSize: 1000
            });

            var arrResults = [];
            objPagedData.pageRanges.forEach(function(pageRange) {
                //fetch
                var objPage = objPagedData.fetch({
                    index: pageRange.index
                }).data;
                // Map results to columns
                arrResults.push.apply(arrResults, objPage.asMappedResults());
            });
            log.debug('arrResults',arrResults)
            
            log.debug('Total arrResults',Object.keys(arrResults).length)
            */
            
            return {historicoSO:historicoSO,thisPeriodSO:thisPeriodSO,dHistorico:dHistorico,objGarantiaRep:objGarantiaRep,objCK:objCK}
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
                    label: 'Bono JOYA'
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
                type: serverWidget.FieldType.TEXTAREA,
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
                    id: 'custentity_odv_equipo',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ODV Equipo'
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

                sublist.addField({
                    id : 'custentity_lider_nle',
                    type : serverWidget.FieldType.TEXT,
                    label : 'NLE'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                     
                sublist.addField({
                    id : 'custentity_nle_monto',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono NLE'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

                sublist.addField({
                    id : 'custentity_xmasdos_nle',
                    type : serverWidget.FieldType.TEXT,
                    label : 'X + 2 NLE'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                     
                sublist.addField({
                    id : 'custentity_tresmasdos_nle_monto',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'BONO 3 + 2 NLE'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

                sublist.addField({
                    id : 'custentity_cincomasdos_nle_monto',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'BONO 5 + 2 NLE'
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