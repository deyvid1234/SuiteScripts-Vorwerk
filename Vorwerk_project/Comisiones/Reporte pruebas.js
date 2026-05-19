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
                var cust_empleado = params.custpage_empleado || '';
                

                //Asignacion de valores
                var custpage_date = form.getField({ id:'custpage_date'});
                custpage_date.defaultValue = cust_period;
                var custpage_type_ = form.getField({ id:'custpage_type_'});
                custpage_type_.defaultValue = cust_type;
                var custpage_promo = form.getField({ id:'custpage_promo'});
                custpage_promo.defaultValue = cust_promo;
                var custpage_entrega = form.getField({ id:'custpage_entrega'});
                custpage_entrega.defaultValue = cust_entrega;
                var custpage_empleado = form.getField({ id:'custpage_empleado'});
                custpage_empleado.defaultValue = cust_empleado;
                  

                log.audit('Filtros','Tipo : '+cust_type+' Promocion : '+cust_promo+' Periodo : '+cust_period+' Entrega : '+cust_entrega+' Empleado : '+cust_empleado)
                try{
                    sublista(form,cust_type,cust_promo,cust_period,cust_entrega,compConfigDetails,startTime,cust_empleado);
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
                        scriptId: 'customscript_commission_map_dos',
                        params: {
                            custscript_data_com: JSON.stringify(obj_comission),
                            custscript_config_com: JSON.stringify(config)
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
    
    /**
     * Función que busca registros GUTM con status program igual a 7
     * 
     * @returns {Array} Array de registros GUTM filtrados
     * @since 2015.1
     */
    function busquedaGUTM() {
        try {
            log.audit('busquedaGUTM', 'Iniciando búsqueda de registros customrecord_gana_tm con status 7');
            
            // Crear la búsqueda de registros GUTM
            var busquedaGUTM = search.create({
                type: 'customrecord_gana_tm',
                filters: [
                    ['custrecord_status_program', 'anyof', '7']
                ],
                columns: [
                    'custrecord_presentador_id',
                    'custrecord_start_date',
                    'custrecord_end_date',
                    'custrecord_status_program',
                    'custrecord_id_so_gaadora',
                    'custrecord_fecha_tm_ganadora',
                    'custrecord_list_ids_odv',
                    'internalid',
                    'custrecord_nombre_programa'
                ]
            });
            
            // Ejecutar la búsqueda y obtener todos los resultados
            var resultados = {};
            var contador = 0;
            busquedaGUTM.run().each(function(resultado) {
                var presentadorId = resultado.getValue('custrecord_presentador_id') || '';
                var registro = {
                    custrecord_start_date: resultado.getValue('custrecord_start_date') || '',
                    custrecord_end_date: resultado.getValue('custrecord_end_date') || '',
                    custrecord_status_program: resultado.getValue('custrecord_status_program') || '',
                    custrecord_id_so_gaadora: resultado.getValue('custrecord_id_so_gaadora') || '',
                    custrecord_fecha_tm_ganadora: resultado.getValue('custrecord_fecha_tm_ganadora') || '',
                    custrecord_list_ids_odv: resultado.getValue('custrecord_list_ids_odv') || '',
                    internalid: resultado.getValue('internalid') || '',
                    custrecord_nombre_programa: resultado.getValue('custrecord_nombre_programa') || ''
                };
                
                // Usar el presentador ID como clave principal
                resultados[presentadorId] = registro;
                contador++;
                return true; // Continuar con el siguiente resultado
            });
            
            log.audit('busquedaGUTM', 'Búsqueda completada. Registros encontrados: ' + contador);
            return resultados;
            
        } catch (error) {
            log.error('busquedaGUTM - Error', 'Error al realizar la búsqueda: ' + error.message);
            return {};
        }
    }
   
    function createForm(){
        try{
           
            var form = serverWidget.createForm({
                title: 'Reporte de Pruebas'
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

            form.addField({
                id: 'custpage_empleado',
                type: serverWidget.FieldType.SELECT,
                label: 'Empleado (opcional)',
                source: 'employee',
                container: 'custpage_filters'
            });

            //Terminan los campos filtro
            //Campos Aux
            /*form.addField({
                id: 'custpage_sublis_fields',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Sublist Fields Array',
                container: 'custpage_filters'
            });
            */
            //Fin campos Aux
            //Botones
            form.addSubmitButton({
               label: 'Consultar',
               container: 'custpage_filters'
            });
            
            /*	form.addButton({
                id : 'custpage_searchData',
                label : 'Guardar',
                functionName : 'saveData()'
            });*/
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

   
    function sublista(form,cust_type,cust_promo,cust_period,cust_entrega,compConfigDetails,startTime,filtroEmpleadoId){
        try{
            var filtroEmpActivo =
                filtroEmpleadoId != null &&
                String(filtroEmpleadoId).replace(/^\s+|\s+$/g, '') !== '';

            const fechaPeriodoCalculado = search.lookupFields({ type: 'customrecord_periods', id: cust_period, columns: ['custrecord_inicio','custrecord_final','name']});
            const namePeriodo= fechaPeriodoCalculado.name //mm/yyyy
            const inicioPeriodo = fechaPeriodoCalculado.custrecord_inicio // dd/mm/yyyy
            const finPeriodo = fechaPeriodoCalculado.custrecord_final // dd/mm/yyyy
            
            log.debug('inicioPeriodo',inicioPeriodo)
            log.debug('finPeriodo',finPeriodo)
            //Creacion de sublista y sus campos
            var sublist = addFieldsTabla(form,cust_type,cust_promo,cust_period,cust_entrega)
            const listasPresentadora = searchDataPresentadoras(fechaPeriodoCalculado,cust_period)
            const presentadorasTMSB = listasPresentadora.presentadorasTMSB
            //Busqueda de ordenes de venta 3 periodos antes a hoy
            startTime = new Date();
            const salesOrdersData = searchSalesOrders(cust_period,inicioPeriodo,finPeriodo,presentadorasTMSB)
            const tmsbSO= salesOrdersData.objTMSB
            const tmGanada =salesOrdersData.objTmGanada
            const tmPagada =salesOrdersData.objTmPagada
            const historicoSO = salesOrdersData.historicoSO
            const thisPeriodSO = salesOrdersData.thisPeriodSO
            const dHistorico=salesOrdersData.dHistorico
            const garantiaSO = salesOrdersData.objGarantiaRep
            const ckSO = salesOrdersData.objCK
            //log.debug('historicoSO',historicoSO)
            //log.debug('thisPeriodSO',thisPeriodSO)//sales reo
            //log.debug('garantiaSO',garantiaSO)
            //log.debug('ckSO',ckSO)
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

            

            const allPresentadoras = listasPresentadora.allPresentadorData
            //log.debug('allPresentadoras', allPresentadoras)
            const listaGrupos= listasPresentadora.empGrupos
            //log.debug('listaGrupos', listaGrupos)
            const listaReclutas= listasPresentadora.empReclutas
            //log.debug('listaReclutas', listaReclutas)
            const listaEquipoRecluta=listasPresentadora.equipoYRecluta
            //log.debug('listaEquipoRecluta', listaEquipoRecluta)
            const listaNombramientos=listasPresentadora.nombramiento
            const listaNombramientosJTL=listasPresentadora.nombramientoJTL
                        
            var todosPeriodos = Utils.obtenerTodosPeriodos();
            //log.debug('listaNombramientos',listaNombramientos)
            newCheckTime = new Date();
            timeDiff = newCheckTime - startTime; //in ms
            timeDiff /= 1000;
            log.debug("Checkpoint searchDataPresentadoras: ", timeDiff + ' seconds');
            
            // Llamada a la función busquedaGUTM
            var registrosGUTM = busquedaGUTM();
            log.audit('busquedaGUTM - Resultados', 'Se encontraron ' + Object.keys(registrosGUTM).length + ' registros con status 7');
            log.debug('busquedaGUTM - Presentadores con programas activos', Object.keys(registrosGUTM));
            
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
                if (filtroEmpActivo && String(i) !== String(filtroEmpleadoId)) {
                    continue;
                }
                //Datos EMP
                var empType=allPresentadoras[i].employeetype
                var empPromo=allPresentadoras[i].promocion
                
                var dataEmp = allPresentadoras[i]
                var empConfiguracion = allPresentadoras[i].emp_conf
                var empID = allPresentadoras[i].internalid
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
                //var objSupercomision = false
                var objVentasEquipoNLE= false
                var objGarantia = false
                var objXmasdosNLE= false
                var objJoya = false 
                var objCook = false
                var objNuevoRecluta = false
                var objActividad = false
                var objProductividadTMSB = false
                var objBonoNombramientoJTL = false
                var objBonoJTL2mas1 = false
                var objBonoJTLMaestria = false
                var objBonoPoolTalent = false
                var objBonoLEMaestria = false
                var objBonoLENombramientoJTL = false
                //var objRecTresxDos = false
                var urlDetalle = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1358&deploy=2'+'&periodoI='+inicioPeriodo+'&periodoF='+finPeriodo+'&promo='+empPromo+'&tipo='+empType+'&pre='+empID
                switch(tipoReporteGloobal){
                    case 1: //Reporte LE
                        if(empType == 3 && empPromo == 2 /*&& allPresentadoras[i].internalid == '11512'*/){
                           
                            //Calcular reporte para la persona
                            var reclutas = listaReclutas[i]
                            var integrantesEquipo = listaGrupos[i]   
                            var reclutasEquipo = listaEquipoRecluta[i]
                            var ventasEmp = thisPeriodSO[i] 
                            var conf = Utils.getConf(empConfiguracion);
                            log.debug('ventasEmp',ventasEmp)
                            var programasActivos = programas(dataEmp.internalid,compConfigDetails,todosPeriodos,dataEmp,registrosGUTM);
                            log.debug('programasActivos',programasActivos)
                            var detalleProgramas = programasActivos.detalleProgramas
                            log.debug('detalleProgramas',detalleProgramas)
                            
                            
                            // Capturar datos de programas antes de sobreescribir
                            var programasData = programasActivos;
                            
                            objVentasPropias = bonoVentaPropia(dataEmp,ventasEmp,compConfigDetails)
                            log.debug('objVentasPropias'+empID,objVentasPropias)
                            var programasActivos = objVentasPropias.programas
                            //objSupercomision = bonoSupercomision(integrantesEquipo,historicoSO,thisPeriodSO,allPresentadoras,dHistorico)
                            //log.debug('objSupercomision',objSupercomision)
                            
                            objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                            //log.debug('objReclutamiento',objReclutamiento)
                            
                            objEntrega = bonoEntrega(dataEmp,ventasEmp,cust_entrega)
                            //log.debug('objEntrega',objEntrega)
                            
                            objXmasDos = bonoXmasDos(
                                dataEmp,
                                reclutasEquipo,
                                thisPeriodSO,
                                ventasEmp,
                                historicoSO,
                                allPresentadoras,
                                dHistorico,
                                integrantesEquipo,
                                reclutas,
                                listaReclutas,
                                false,
                                inicioPeriodo,
                                finPeriodo
                            )
                            //log.debug('objXmasDos',objXmasDos)
                            objProductividad = bonoProductividad(dataEmp,ventasEmp,compConfigDetails)
                             //log.debug('objProductividad',objProductividad)
                            
                            objVentaEquipo = bonoVentaEquipo(ventasEmp,compConfigDetails,conf,integrantesEquipo,thisPeriodSO,listaNombramientos,dataEmp,listaGrupos,allPresentadoras)
                            //log.debug('objVentaEquipo',objVentaEquipo)
                            /*objVentasEquipoNLE=ventaEquipoNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,compConfigDetails)
                            log.debug('objVentasEquipoNLE',objVentasEquipoNLE)*/
                            objGarantia = bonoGarantia(dataEmp,garantiaSO,compConfigDetails)
                            //log.debug('objGarantia',objGarantia)
                            objXmasdosNLE=bonoXmasdosNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,listaEquipoRecluta,historicoSO,dHistorico,namePeriodo,cust_period,listaReclutas)
                            objJoya = bonoJoya(conf,ventasEmp,compConfigDetails)
                            objCook = bonoCk(dataEmp,ckSO)
                            objNuevoRecluta = bonoNuevoRecluta(empID,dataEmp,reclutas,thisPeriodSO,historicoSO,allPresentadoras,dHistorico,integrantesEquipo)
                            //log.debug('objNuevoRecluta',objNuevoRecluta)
                            objBonoPoolTalent = bonoPoolTalentLE(
                                dataEmp,
                                allPresentadoras,
                                listaGrupos,
                                historicoSO,
                                thisPeriodSO,
                                inicioPeriodo,
                                finPeriodo,
                                ventasEmp
                            )
                            objBonoLEMaestria = bonoLEMaestriaTresMasDos(
                                dataEmp,
                                reclutasEquipo,
                                integrantesEquipo,
                                reclutas,
                                listaReclutas,
                                allPresentadoras,
                                historicoSO,
                                thisPeriodSO,
                                todosPeriodos,
                                cust_period,
                                inicioPeriodo,
                                finPeriodo,
                                ventasEmp
                            )
                            objBonoLENombramientoJTL = bonoLENombramientoJTL(
                                dataEmp,
                                listaNombramientosJTL,
                                allPresentadoras,
                                historicoSO,
                                thisPeriodSO,
                                listaReclutas,
                                todosPeriodos,
                                inicioPeriodo,
                                finPeriodo,
                                ventasEmp
                            )
                            // BONO INACTIVADO (UI + cálculo): Bono Actividad
                            // objActividad = bonoActividad(empID,dataEmp,integrantesEquipo,thisPeriodSO,historicoSO,allPresentadoras,dHistorico,inicioPeriodo,finPeriodo)
                            // log.debug('objActividad',objActividad)
                            //objRecTresxDos = bonoExtendido(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                            //log.debug('objRecTresxDos',objRecTresxDos)
                            var amounTrue = validateAmount(sublist,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objReclutamiento,objEntrega,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,objXmasDos,objXmasdosNLE,objJoya,objCook,objNuevoRecluta,objActividad,objProductividadTMSB,programasData,objBonoNombramientoJTL,false,false,objBonoPoolTalent,objBonoLEMaestria,objBonoLENombramientoJTL)
        
                            if(amounTrue){
                                fillTable(sublist,urlDetalle,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objReclutamiento,objEntrega,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,objXmasDos,objXmasdosNLE,objJoya,objCook,objNuevoRecluta,objActividad,objProductividadTMSB,programasActivos,false,programasData,objBonoNombramientoJTL,false,false,objBonoPoolTalent,objBonoLEMaestria,objBonoLENombramientoJTL,tipoReporteGloobal,historicoSO,thisPeriodSO,inicioPeriodo,finPeriodo)
                                cont_line++
                            }
                        }

                    break;
                    case 2: //Reporte Presentadora
                        if(empType == 1 && empPromo == 2 /*&& allPresentadoras[i].internalid == '21613'*/){
                            
                            //Calcular reporte para la persona
                            var reclutas=listaReclutas[i]
                            var integrantesEquipo=listaGrupos[i]   
                            var reclutasEquipo=listaEquipoRecluta[i]
                            
                            
                            var ventasEmp =thisPeriodSO[i] 
                            var conf = Utils.getConf(empConfiguracion);
                            
                            var programasActivos = programas(dataEmp.internalid,compConfigDetails,todosPeriodos,dataEmp,registrosGUTM);
                            log.debug('programasActivos',programasActivos)
                            var detalleProgramas = programasActivos.detalleProgramas
                            log.debug('detalleProgramas',detalleProgramas)
                            
                            
                            // Capturar datos de programas antes de sobreescribir
                            var programasData = programasActivos;
                           
                            //log.debug('ventasEmp',ventasEmp)
                                //objRecTresxDos = bonoExtendido(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                                //log.debug('objRecTresxDos',objRecTresxDos)
                                objProductividadTMSB = bonoProductividadTMSB(empID,dataEmp,tmsbSO,compConfigDetails,finPeriodo,inicioPeriodo,todosPeriodos,tmGanada,tmPagada)
                                //log.debug('objProductividadTMSB',objProductividadTMSB)
                                objVentasPropias = bonoVentaPropia(dataEmp,ventasEmp,compConfigDetails)
                                log.debug('objVentasPropias case 2',objVentasPropias)
                                var programasActivos = objVentasPropias.programas
                                
                                objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                                //log.debug('objReclutamiento',objReclutamiento)
                                objEntrega = bonoEntrega(dataEmp,ventasEmp,cust_entrega)
                                //log.debug('objEntrega',objEntrega)
                                
                                objProductividad = bonoProductividad(dataEmp,ventasEmp,compConfigDetails)
                                //log.debug('objProductividad',objProductividad)
                                objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                                //log.debug('objReclutamiento',objReclutamiento)
                                objGarantia = bonoGarantia(dataEmp,garantiaSO,compConfigDetails)
                                
                                objJoya = bonoJoya(conf,ventasEmp,compConfigDetails)
                                objCook = bonoCk(dataEmp,ckSO)
                                
                                objBonoNombramientoJTL = bonoNombramientoJTL(dataEmp,historicoSO,thisPeriodSO,listaReclutas,allPresentadoras,todosPeriodos,inicioPeriodo,finPeriodo)
                                objBonoJTL2mas1 = bonoJTLPrograma2mas1Estandar(dataEmp,historicoSO,thisPeriodSO,reclutas,listaReclutas,allPresentadoras,inicioPeriodo,finPeriodo)
                                objBonoJTLMaestria = bonoJTLMaestria(dataEmp,historicoSO,thisPeriodSO,reclutas,listaReclutas,allPresentadoras,todosPeriodos,cust_period)
                            
                            /*
                            montoComisionCK = bonoComCK()
                            
                            */

                            var amounTrue = validateAmount(sublist,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objReclutamiento,objEntrega,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,false,objXmasdosNLE,objJoya,objCook,objNuevoRecluta,objActividad,objProductividadTMSB,programasData,objBonoNombramientoJTL,objBonoJTL2mas1,objBonoJTLMaestria,false,false,false)
        
                            if(amounTrue){
                                fillTable(sublist,urlDetalle,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objReclutamiento,objEntrega,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,false,objXmasdosNLE,objJoya,objCook,objNuevoRecluta,objActividad,objProductividadTMSB,programasActivos,true,programasData,objBonoNombramientoJTL,objBonoJTL2mas1,objBonoJTLMaestria,false,false,false,tipoReporteGloobal,historicoSO,thisPeriodSO,inicioPeriodo,finPeriodo)
                                cont_line++
                            }
                        }

                    
                    break;
                    case 3: //Reporte Trabaja x TM
                        if(empType == 1 && (empPromo == 1 || empPromo == 5)){
                            //Calcular reporte para la persona
                            var reclutas=listaReclutas[i]
                            //objRecTresxDos = bonoExtendido(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                            //log.debug('objRecTresxDos',objRecTresxDos)
                            objReclutamiento = bonoReclutamiento(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico)
                        
                            objCook = bonoCk(dataEmp,ckSO)
                            
                            var amounTrue = validateAmount(sublist,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objReclutamiento,objEntrega,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,false,objXmasdosNLE,objJoya,objCook,objNuevoRecluta,objActividad,objProductividadTMSB,null,false,false,false,false,false,false)
        
                            if(amounTrue){
                                fillTable(sublist,urlDetalle,dataEmp,objVentasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,objReclutamiento,objEntrega,objProductividad,objVentaEquipo,objVentasEquipoNLE,objGarantia,false,objXmasdosNLE,objJoya,objCook,objNuevoRecluta,objActividad,objProductividadTMSB,null,false,null,false,false,false,false,false,false,tipoReporteGloobal,historicoSO,thisPeriodSO,inicioPeriodo,finPeriodo)
                                cont_line++
                            }
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

    function validateAmount(sublist,dataEmp,ventasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,reclutamiento,entrega,productividad,ventaEquipo,ventasEquipoNLE,garantia,xMasdos,xMasdosNLE,joya,cookKey,nuevoRecluta,actividad,productividadTMSB,programasData,bonoNombramientoJTL,bonoJTL2mas1,bonoJTLMaestria,bonoPoolTalent,bonoLEMaestria,bonoLENombramientoJTL){
        var subtotal=0
        var v
        if(ventasPropias){  
            v = ventasPropias.monto>0?ventasPropias.monto:0
            subtotal+=parseInt(v,10)
        }
        if(entrega){
            v = entrega.monto>0?entrega.monto:0
            subtotal+=parseInt(v,10)
        }

        /*if(supercomision){
          v = supercomision.monto>0?supercomision.monto:0
          subtotal+=parseInt(v,10)
        }*/
        
        if(reclutamiento){      
          v = reclutamiento.monto>0?reclutamiento.monto:0
          subtotal+=parseInt(v,10)
        }
        /* Bono 3+2 directo líder (bonoXmasDos): solo monto32 en pantalla/total */
        if(xMasdos){
          v = xMasdos.monto32>0?xMasdos.monto32:0
          subtotal+=parseInt(v,10)
        }
        
        if(productividad){
          v = productividad.monto>0?productividad.monto:0
          subtotal+=parseInt(v,10)
          
        }
        if(ventaEquipo){
          v = ventaEquipo.monto>0?ventaEquipo.monto:0
          subtotal+=parseInt(v,10)
        }
        if(ventasEquipoNLE){
          v = ventasEquipoNLE.monto>0?ventasEquipoNLE.monto:0
          subtotal+=parseInt(v,10)
        }

        if(garantia){
          v = garantia.monto>0?garantia.monto:0
          subtotal+=parseInt(v,10)
        }
        if(joya){
            v = joya.monto>0?joya.monto:0
            subtotal+=parseInt(v,10)
        }
        if(cookKey){
        
            v = cookKey.monto>0?cookKey.monto:0
            subtotal+=parseInt(v,10)
        }
        // BONO INACTIVADO (UI + cálculo): NLE 3+2 y 5+2
        // if(xMasdosNLE){
        //   v = xMasdosNLE.monto52>0?xMasdosNLE.monto52:0
        //   subtotal+=parseInt(v)
        //   
        //   v = xMasdosNLE.monto32>0?xMasdosNLE.monto32:0
        //   subtotal+=parseInt(v,10)
        // }
        if(nuevoRecluta){
            v = nuevoRecluta.monto>0?nuevoRecluta.monto:0
            subtotal+=parseInt(v,10)  
        }
        // BONO INACTIVADO (UI + cálculo): Bono Actividad
        // if(actividad){
        //     v = actividad.monto>0?actividad.monto:0
        //     subtotal+=parseInt(v,10)
        // }
      //log.debug('productividadTMSB validate',productividadTMSB)
        if(productividadTMSB){
            v = productividadTMSB.montoVP>0?productividadTMSB.montoVP:0
            subtotal+=parseInt(v,10)
            
        }
        if(productividadTMSB){
            v = productividadTMSB.monto>0?productividadTMSB.monto:0
            subtotal+=parseInt(v,10)
        }

        // Validar montos de programas extraordinarios
        if(programasData){
            if(programasData.monto && programasData.monto > 0){
                v = programasData.monto
                subtotal+=parseInt(v,10)
            }
            if(programasData.montoVP && programasData.montoVP > 0){
                v = programasData.montoVP
                subtotal+=parseInt(v,10)
            }
        }

        if(bonoNombramientoJTL){
            v = bonoNombramientoJTL.monto>0?bonoNombramientoJTL.monto:0
            subtotal+=parseInt(v,10)
        }
        if(bonoJTL2mas1){
            v = bonoJTL2mas1.monto>0?bonoJTL2mas1.monto:0
            subtotal+=parseInt(v,10)
        }
        if(bonoJTLMaestria){
            v = bonoJTLMaestria.monto>0?bonoJTLMaestria.monto:0
            subtotal+=parseInt(v,10)
        }
        if(bonoPoolTalent){
            v = bonoPoolTalent.monto>0?bonoPoolTalent.monto:0
            subtotal+=parseInt(v,10)
        }
        if(bonoLEMaestria){
            v = bonoLEMaestria.monto>0?bonoLEMaestria.monto:0
            subtotal+=parseInt(v,10)
        }
        if(bonoLENombramientoJTL){
            v = bonoLENombramientoJTL.monto>0?bonoLENombramientoJTL.monto:0
            subtotal+=parseInt(v,10)
        }

        if( subtotal > 0 || (ventasPropias && ventasPropias.data && ventasPropias.data.length > 0) ){
            v = true
        }else{
            v = false
        }
        return v;

    }
    function fillTable(sublist,urlDetalle,dataEmp,ventasPropias,cont_line,reclutas,integrantesEquipo,reclutasEquipo,reclutamiento,entrega,productividad,ventaEquipo,ventasEquipoNLE,garantia,xMasdos,xMasdosNLE,joya,cookKey,nuevoRecluta,actividad,productividadTMSB,programasActivos,esPruebaFalse,programasData,bonoNombramientoJTL,bonoJTL2mas1,bonoJTLMaestria,bonoPoolTalent,bonoLEMaestria,bonoLENombramientoJTL,tipoReporteGloobal,historicoSO,thisPeriodSO,inicioPeriodo,finPeriodo){
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
              
            var v=dataEmp.emp_reclutadora
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
            
                        
            sublist.setSublistValue({
                id : 'custpage_ver_detalle',
                line : cont_line,
                value : urlDetalle
            });   
              //Reclutas
            if(reclutas){
                v = JSON.stringify(reclutas) 
                sublist.setSublistValue({
                    id : 'custentity_reclutas',
                    line : linea,
                    value : v!=''?v:''
                });
            }
            if(integrantesEquipo){
                v = JSON.stringify(integrantesEquipo)
                sublist.setSublistValue({
                    id : 'custentity_presentadoras',
                    line : linea,
                    value : v!=''?v:''
                });
            }   
        }
        //Venta Propia
        if(ventasPropias && ventasPropias.data != ''){  
            //log.debug('ventasPropias',ventasPropias)
            var v
            v = ventasPropias.monto>0?ventasPropias.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_venta_propia',
                line : linea,
                value : v
            });
            //Numero de Ventas TM o Ventas CK
            v = ventasPropias.data && ventasPropias.data.length ? ventasPropias.data.length : 0
            sublist.setSublistValue({
                id : 'custentity_odv_jdg',
                line : linea,
                value : v!=0?v:0
            });
            //ID ODV
            if(ventasPropias.data && ventasPropias.data.length > 0){
                v = JSON.stringify(ventasPropias.data)
            }else{
                v = ''
            }
            sublist.setSublistValue({
                id : 'custentity_odv_jdg_ids',
                line : linea,
                value : v!=''?v:''
            });

        }
        //Entrega
        if(entrega){
            var v
            //Entrega monto
            v = entrega.monto>0?entrega.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_entrega',
                line : linea,
                value : v
            });
        }
        //supercomision bono apagado
        /*if(supercomision){
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
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_sc',
                line : linea,
                value : v
            });
        }*/
        //reclutamiento
        if(reclutamiento){         
            v = reclutamiento.monto>0?reclutamiento.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_rec',
                line : linea,
                value : v
            });
            v = JSON.stringify(reclutamiento.data)
            sublist.setSublistValue({
                id : 'custentity_odv_rec',
                line : linea,
                value : v!=''?v:''
            });
          
        }
        /*if(objRecTresxDos){         
            v = objRecTresxDos.monto>0?objRecTresxDos.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_rec4a_venta',
                line : linea,
                value : v
            });
            v = JSON.stringify(objRecTresxDos.data)
            sublist.setSublistValue({
                id : 'custentity_odv_rec4a_venta',
                line : linea,
                value : v!=''?v:''
            });
          
        }*/
        // Bono 3+2 directo de la líder (bonoXmasDos) — columna «Bono 3 + 2 (líder)»; distinto de BONO 3+2 NLE
        if (tipoReporteGloobal === 1) {
            if (xMasdos) {
                v = JSON.stringify(xMasdos.data)
                sublist.setSublistValue({
                    id : 'custentity_rec_con_ventas',
                    line : linea,
                    value : v !== '' ? v : ''
                });
                v = JSON.stringify(xMasdos.equipo)
                sublist.setSublistValue({
                    id : 'custentity_odv_rec_del_periodo',
                    line : linea,
                    value : v !== '' ? v : ''
                });
                v = xMasdos.monto32 > 0 ? xMasdos.monto32 : 0
                subtotal += parseInt(v, 10)
                sublist.setSublistValue({
                    id : 'custentity_bono_tres_dos',
                    line : linea,
                    value : v
                });
                // Detalle unificado periodo reporte → custrecord_detalle_tres_dos (misma idea que maestría, un solo mes)
                var viaTresDos =
                    xMasdos.resumen && xMasdos.resumen.via ? String(xMasdos.resumen.via) : '';
                var ventasJtlPeriodo = [];
                if (dataEmp && inicioPeriodo && finPeriodo && historicoSO && thisPeriodSO) {
                    ventasJtlPeriodo = listarOdvsVentasPersonalesJTL(
                        dataEmp,
                        dataEmp.internalid,
                        historicoSO,
                        thisPeriodSO,
                        inicioPeriodo,
                        finPeriodo
                    );
                }
                var detTresDosComp = {
                    motivo: viaTresDos,
                    ordenes: {
                        ventasPersonalesJtl: ventasJtlPeriodo,
                        pedidosActivacionReclutasDirectas: xMasdos.data || [],
                        pedidosActivacionEquipo: xMasdos.equipo || []
                    }
                };
                sublist.setSublistValue({
                    id: 'custentity_detalle_bono_tres_dos',
                    line: linea,
                    value: JSON.stringify(detTresDosComp)
                });
            } else {
                sublist.setSublistValue({
                    id : 'custentity_rec_con_ventas',
                    line : linea,
                    value : ' '
                });
                sublist.setSublistValue({
                    id : 'custentity_odv_rec_del_periodo',
                    line : linea,
                    value : ' '
                });
                sublist.setSublistValue({
                    id : 'custentity_bono_tres_dos',
                    line : linea,
                    value : 0
                });
                sublist.setSublistValue({
                    id: 'custentity_detalle_bono_tres_dos',
                    line: linea,
                    value: ' '
                });
            }
        }
        //productividad
        if(productividad){
            v = productividad.monto>0?productividad.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_productividad',
                line : linea,
                value : v
            });
          
        }

        //venta equipo
        if(ventaEquipo){
         
            v = ventaEquipo.porcentaje
            sublist.setSublistValue({
                id : 'custentity_porcentaje',
                line : linea,
                value : v!=''?v:''
            });
          
            v = ventaEquipo.monto>0?ventaEquipo.monto:0
            subtotal+=parseInt(v,10)
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
            v = ventaEquipo.noVentas>0?ventaEquipo.noVentas:0
            sublist.setSublistValue({
                id : 'custentity_odv_pre',
                line : linea,
                value : v
            });
            if(ventaEquipo.infoNle){
                v = ventaEquipo.infoNle!=''?ventaEquipo.infoNle:''
                sublist.setSublistValue({
                    id : 'custentity_lider_nle',
                    line : linea,
                    value : JSON.stringify(v)
                });
            }
            
        }
        //NLE
        /*if(ventasEquipoNLE){
          
            v = ventasEquipoNLE.monto>0?ventasEquipoNLE.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_nle_monto',
                line : linea,
                value : v
            });
          
        }*/
        //garantia
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
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_garantia_monto',
                line : linea,
                value : v
            });  
        }
        if(joya){
            v = joya.monto>0?joya.monto:0
            subtotal+=parseInt(v,10)
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
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_cookkey_comision',
                line : linea,
                 value : v
            });
        }
        // BONO INACTIVADO (UI): X+2 NLE / Bono 3+2 NLE / Bono 5+2 NLE
        // if(xMasdosNLE){
        //   
        //     v = xMasdosNLE.data
        //     sublist.setSublistValue({
        //         id : 'custentity_xmasdos_nle',
        //         line : linea,
        //         value : v!=''?v:''
        //     });
        //   
        //     v = xMasdosNLE.monto52>0?xMasdosNLE.monto52:0
        //     subtotal+=parseInt(v,10)
        //     sublist.setSublistValue({
        //         id : 'custentity_cincomasdos_nle_monto',
        //         line : linea,
        //         value : v
        //     });
        //     v = xMasdosNLE.monto32>0?xMasdosNLE.monto32:0
        //     subtotal+=parseInt(v,10)
        //     sublist.setSublistValue({
        //         id : 'custentity_tresmasdos_nle_monto',
        //         line : linea,
        //         value : v
        //     });
        //   
        // }
        if(nuevoRecluta){
        
            v = JSON.stringify(nuevoRecluta.data)
            sublist.setSublistValue({
                id : 'custentity_nuevo_recluta_activos',
                line : linea,
                value : v!=''?v:''
            });
            v = nuevoRecluta.noActivos
            sublist.setSublistValue({
                id : 'custentity_no_activos_rec',
                line : linea,
                value : v!=''?v:''
            });
            v = nuevoRecluta.monto>0?nuevoRecluta.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_monto_nuevo_recluta',
                line : linea,
                 value : v
            });
        }
        // BONO INACTIVADO (UI): Bono Actividad
        // if(actividad){
        // 
        //     v = JSON.stringify(actividad.data)
        //     sublist.setSublistValue({
        //         id : 'custentity_integrantes_activos',
        //         line : linea,
        //         value : v!=''?v:''
        //     });
        //     v = actividad.noActivos
        //     sublist.setSublistValue({
        //         id : 'custentity_no_activos',
        //         line : linea,
        //         value : v!=''?v:''
        //     });
        //     v = actividad.monto>0?actividad.monto:0
        //     subtotal+=parseInt(v,10)
        //     sublist.setSublistValue({
        //         id : 'custentity_monto_actividad',
        //         line : linea,
        //          value : v
        //     });
        // }
        
        if(productividadTMSB){
            v = JSON.stringify(productividadTMSB.data)
            sublist.setSublistValue({
                id : 'custentity_data_productividad_tmsb',
                line : linea,
                value : v!=''?v:''
            });
            v = productividadTMSB.monto>0?productividadTMSB.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_monto_productividad_tmsb',
                line : linea,
                 value : v
            });
            
            v = parseInt(productividadTMSB.montoVP)>0?parseInt(productividadTMSB.montoVP):0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_monto_ventapropia_tmsb',
                line : linea,
                 value : v
            });
        }

        // Llenar campos de programas extraordinarios
        if(programasData && programasData.montoVP > 0){
            // Campo ordenes_extaordinarias - detalle de las órdenes
            var ordenesExtraordinarias = '';
            var ordenesArray = [];
            
            // Agregar información de programasData.data
            if(programasData.data && typeof programasData.data === 'object'){
                for (var periodo in programasData.data) {
                    var ventasPeriodo = programasData.data[periodo];
                    for (var i = 0; i < ventasPeriodo.length; i++) {
                        ordenesArray.push(ventasPeriodo[i].internalid + ' (' + periodo + ')');
                    }
                }
            }
            
            // Agregar información de programasData.detalleProgramas
            if(programasData.detalleProgramas && Array.isArray(programasData.detalleProgramas)){
                for (var i = 0; i < programasData.detalleProgramas.length; i++) {
                    var detalle = programasData.detalleProgramas[i];
                    if(detalle && typeof detalle === 'object'){
                        // Agregar cada propiedad del detalle con su nombre real
                        if(detalle.id) ordenesArray.push('id: ' + detalle.id);
                        if(detalle.nombre) ordenesArray.push('nombre: ' + detalle.nombre);
                        if(detalle.fechaInicio) ordenesArray.push('fechaInicio: ' + detalle.fechaInicio);
                        if(detalle.fechaFin) ordenesArray.push('fechaFin: ' + detalle.fechaFin);
                        if(detalle.estado) ordenesArray.push('estado: ' + detalle.estado);
                    }
                }
            }
            
            ordenesExtraordinarias = 'ordenes: ' + ordenesArray.join(', '); 
            
            sublist.setSublistValue({
                id : 'ordenes_extaordinarias',
                line : linea,
                value : ordenesExtraordinarias
            });
            
            // Campo custpage_monto_ventapropia_extra - montoVP
            var montoVPExtra = 0;
            if(programasData.montoVP && programasData.montoVP > 0){
                montoVPExtra = programasData.montoVP;
                subtotal += parseInt(montoVPExtra, 10);
            }
            
            sublist.setSublistValue({
                id : 'custpage_monto_ventapropia_extra',
                line : linea,
                value : montoVPExtra
            });
            
            // Campo custpage_monto_prod_extra - monto (productividad)
            var montoProdExtra = 0;
            if(programasData.monto && programasData.monto > 0){
                montoProdExtra = programasData.monto;
                subtotal += parseInt(montoProdExtra, 10);
            }
            
            sublist.setSublistValue({
                id : 'custpage_monto_prod_extra',
                line : linea,
                value : montoProdExtra
            });
        } else {
            // Llenar campos vacíos si no hay datos de programas
            sublist.setSublistValue({
                id : 'ordenes_extaordinarias',
                line : linea,
                value : 'Sin programas extraordinarios'
            });
            
            sublist.setSublistValue({
                id : 'custpage_monto_ventapropia_extra',
                line : linea,
                value : 0
            });
            
            sublist.setSublistValue({
                id : 'custpage_monto_prod_extra',
                line : linea,
                value : 0
            });
        }

        if(bonoNombramientoJTL){
            v = bonoNombramientoJTL.monto>0?bonoNombramientoJTL.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_nombramiento_jtl',
                line : linea,
                value : v
            });
            var detJtl = bonoNombramientoJTL.data ? JSON.stringify(bonoNombramientoJTL.data) : ' '
            sublist.setSublistValue({
                id : 'custentity_bono_nombramiento_jtl_det',
                line : linea,
                value : detJtl ? detJtl : ' '
            });
        } else {
            sublist.setSublistValue({
                id : 'custentity_bono_nombramiento_jtl',
                line : linea,
                value : 0
            });
            sublist.setSublistValue({
                id : 'custentity_bono_nombramiento_jtl_det',
                line : linea,
                value : ' '
            });
        }

        if(bonoJTL2mas1){
            v = bonoJTL2mas1.monto>0?bonoJTL2mas1.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_2mas1',
                line : linea,
                value : v
            });
            var det2 = bonoJTL2mas1.data ? JSON.stringify(bonoJTL2mas1.data) : ' '
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_2mas1_det',
                line : linea,
                value : det2 ? det2 : ' '
            });
        } else {
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_2mas1',
                line : linea,
                value : 0
            });
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_2mas1_det',
                line : linea,
                value : ' '
            });
        }

        if(bonoJTLMaestria){
            v = bonoJTLMaestria.monto>0?bonoJTLMaestria.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_maestria',
                line : linea,
                value : v
            });
            var detM = bonoJTLMaestria.data ? JSON.stringify(bonoJTLMaestria.data) : ' '
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_maestria_det',
                line : linea,
                value : detM ? detM : ' '
            });
        } else {
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_maestria',
                line : linea,
                value : 0
            });
            sublist.setSublistValue({
                id : 'custentity_bono_jtl_maestria_det',
                line : linea,
                value : ' '
            });
        }

        if(bonoPoolTalent){
            v = bonoPoolTalent.monto>0?bonoPoolTalent.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_pool_talent',
                line : linea,
                value : v
            });
            var detPool = bonoPoolTalent.data ? JSON.stringify(bonoPoolTalent.data) : ' '
            sublist.setSublistValue({
                id : 'custentity_bono_pool_talent_det',
                line : linea,
                value : detPool ? detPool : ' '
            });
        } else {
            sublist.setSublistValue({
                id : 'custentity_bono_pool_talent',
                line : linea,
                value : 0
            });
            sublist.setSublistValue({
                id : 'custentity_bono_pool_talent_det',
                line : linea,
                value : ' '
            });
        }

        if(bonoLEMaestria){
            v = bonoLEMaestria.monto>0?bonoLEMaestria.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_le_maestria',
                line : linea,
                value : v
            });
            var detLeM = bonoLEMaestria.data ? JSON.stringify(bonoLEMaestria.data) : ' '
            sublist.setSublistValue({
                id : 'custentity_bono_le_maestria_det',
                line : linea,
                value : detLeM ? detLeM : ' '
            });
        } else {
            sublist.setSublistValue({
                id : 'custentity_bono_le_maestria',
                line : linea,
                value : 0
            });
            sublist.setSublistValue({
                id : 'custentity_bono_le_maestria_det',
                line : linea,
                value : ' '
            });
        }

        if(bonoLENombramientoJTL){
            v = bonoLENombramientoJTL.monto>0?bonoLENombramientoJTL.monto:0
            subtotal+=parseInt(v,10)
            sublist.setSublistValue({
                id : 'custentity_bono_le_nombramiento_jtl',
                line : linea,
                value : v
            });
            var detLeNom = bonoLENombramientoJTL.data ? JSON.stringify(bonoLENombramientoJTL.data) : ' '
            sublist.setSublistValue({
                id : 'custentity_bono_le_nombramiento_jtl_det',
                line : linea,
                value : detLeNom ? detLeNom : ' '
            });
        } else {
            sublist.setSublistValue({
                id : 'custentity_bono_le_nombramiento_jtl',
                line : linea,
                value : 0
            });
            sublist.setSublistValue({
                id : 'custentity_bono_le_nombramiento_jtl_det',
                line : linea,
                value : ' '
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
     /**
     * Función que verifica si un empleado tiene algún programa activo usando el caché de presentadores
     * @param {number} empleadoId - ID del empleado para verificar programas
     * @param {Object} compConfigDetails - Configuración de la compañía
     * @param {Object} todosPeriodos - Todos los períodos disponibles
     * @param {Object} presentadoresConProgramas - Caché de todos los presentadores con programas
     * @returns {Object} - Información sobre los programas activos del empleado
     */
     function programas(empleadoId,compConfigDetails,todosPeriodos,dataEmp,registrosGUTM) {
        try {
            if(registrosGUTM.hasOwnProperty(empleadoId)){
                log.debug('registrosGUTM', registrosGUTM[empleadoId])
                var statusProgram = registrosGUTM[empleadoId].custrecord_status_program
                var nombrePrograma = registrosGUTM[empleadoId].custrecord_nombre_programa
                var fechaInicioPrograma = registrosGUTM[empleadoId].custrecord_start_date
                var fechaFinPrograma = registrosGUTM[empleadoId].custrecord_end_date
                var listIdsOdv = registrosGUTM[empleadoId].custrecord_list_ids_odv
                var internalidPrograma = registrosGUTM[empleadoId].internalid
                var programasActivos = [];
                var ventasPorPeriodo = {}
                
                var montoTotalProductividad = 0;
                var montoVentasPre = 0;
                var todosListIdsOdv = []; // Variable para recopilar todos los IDs de todos los programas
                
                    
                log.debug('listIdsOdv', listIdsOdv) 
                log.debug('statusProgram', statusProgram)
                log.debug('nombrePrograma', nombrePrograma)
                log.debug('fechaInicioPrograma', fechaInicioPrograma)
                log.debug('fechaFinPrograma', fechaFinPrograma)
                
                log.debug('internalidPrograma', internalidPrograma)
                var data = [];
                var numeroVentasPorPeriodo = {}         
                var cantidadIds = 0;
                var montoVentaPropiaPrograma = 0;
                    
                if (listIdsOdv && listIdsOdv.trim() !== '') {
                    var idsArray = listIdsOdv.split(',');
                    cantidadIds = idsArray.length;
                    
                    montoVentaPropiaPrograma = cantidadIds * 2500;
                    // Sumar al total de montoVP
                    montoVentasPre += montoVentaPropiaPrograma;
                                                                
                }
    
                var programa = {
                    id: internalidPrograma,
                    nombre: nombrePrograma,
                    fechaInicio: fechaInicioPrograma,
                    fechaFin: fechaFinPrograma,
                    estado: statusProgram
                };
                
                programasActivos.push(programa);
                    
                // Agregar IDs al array global
                if (listIdsOdv && listIdsOdv.trim() !== '') {
                    var idsDeEstePrograma = listIdsOdv.split(',');
                    for (var j = 0; j < idsDeEstePrograma.length; j++) {
                        var idLimpio = idsDeEstePrograma[j].trim();
                        if (todosListIdsOdv.indexOf(idLimpio) === -1) { // Evitar duplicados
                            todosListIdsOdv.push(idLimpio);
                        }
                    }
                }
                
                var idsArray = listIdsOdv.split(',');
                for (var i = 0; i < idsArray.length; i++){
                    var currentId = idsArray[i].trim(); // Eliminar espacios en blanco
                    var objSO = search.lookupFields({
                        type: 'salesorder',
                        id: currentId,
                        columns: ['trandate']
                    });
                    
                    var fechaSO = objSO.trandate                    
                    var periodoSO = Utils.encontrarPeriodo(fechaSO, todosPeriodos);                    
                    
                    data.push(currentId)

                    if (!ventasPorPeriodo[periodoSO]) {
                        ventasPorPeriodo[periodoSO] = [];
                        numeroVentasPorPeriodo[periodoSO] = 0;
                    }
                    
                    ventasPorPeriodo[periodoSO].push({
                        internalid: currentId,
                        fecha: fechaSO,
                        periodo: periodoSO,
                    });
                    numeroVentasPorPeriodo[periodoSO]++;
                    
                }
                
            
                    
                var totalVentasPorPeriodo = {};
                for (var periodo in ventasPorPeriodo) {
                    totalVentasPorPeriodo[periodo] = ventasPorPeriodo[periodo].length;
                }
                for (e in numeroVentasPorPeriodo){
                    var ventasEnPeriodo = numeroVentasPorPeriodo[e]; 
                    
                    var montoProductividadxPeriodo= compConfigDetails[1]['esquemaVentasPresentadora'][ventasEnPeriodo]['bonoProductividad']
                    
                    montoProductividadxPeriodo = parseInt(montoProductividadxPeriodo);
                    if(montoProductividadxPeriodo > 0){
                        montoTotalProductividad += parseInt(montoProductividadxPeriodo);
                    }
                }
                
                var resultado = {
                    
                    detalleProgramas: programasActivos,
                    monto: montoTotalProductividad, 
                    data: ventasPorPeriodo,
                    montoVP: montoVentasPre,
                    listIdsOdv: todosListIdsOdv.join(',') // Convertir array a string separado por comas
               };
               
               return resultado;
    

            }else{
                return false
            }
            /*var isinactivePrograma = dataEmp.isinactivePrograma
            var programasActivos = [];
            var tieneProgramasActivos = false;
            var ventasPorPeriodo = {}
            
            var montoTotalProductividad = 0;
            var montoVentasPre = 0;
            var todosListIdsOdv = []; // Variable para recopilar todos los IDs de todos los programas
            if( isinactivePrograma == false){
                var statusProgram = dataEmp.estatusDelPrograma
                var internalidPrograma = dataEmp.internalidPrograma
                var nombrePrograma = dataEmp.nombreDelPrograma
                var fechaInicioPrograma = dataEmp.fechaInicioDelPrograma
                var fechaFinPrograma = dataEmp.fechaFinDelPrograma
                var listIdsOdv = dataEmp.listIdsOdvDelPrograma
                log.debug('listIdsOdv', listIdsOdv) 
                log.debug('statusProgram', statusProgram)
                log.debug('internalidPrograma', internalidPrograma)
                log.debug('nombrePrograma', nombrePrograma)
                log.debug('fechaInicioPrograma', fechaInicioPrograma)
                log.debug('fechaFinPrograma', fechaFinPrograma)
                log.debug('isinactivePrograma', isinactivePrograma)
                var data = [];
                var numeroVentasPorPeriodo = {}         
                var cantidadIds = 0;
                var montoVentaPropiaPrograma = 0;
                    
                if (listIdsOdv && listIdsOdv.trim() !== '') {
                    var idsArray = listIdsOdv.split(',');
                    cantidadIds = idsArray.length;
                    
                    // Solo calcular montos si el estatus es 7, de lo contrario usar 0
                    if (statusProgram == 7) {
                        tieneProgramasActivos = true;
                        montoVentaPropiaPrograma = cantidadIds * 2500;
                        // Sumar al total de montoVP
                        montoVentasPre += montoVentaPropiaPrograma;
                        
                    } else {
                        montoVentaPropiaPrograma = 0;
                        
                    }
                    
                }

                var programa = {
                    id: internalidPrograma,
                    nombre: nombrePrograma,
                    fechaInicio: fechaInicioPrograma,
                    fechaFin: fechaFinPrograma,
                    estado: statusProgram
                };
                
                programasActivos.push(programa);
                
                // Agregar IDs al array global
                if (listIdsOdv && listIdsOdv.trim() !== '') {
                    var idsDeEstePrograma = listIdsOdv.split(',');
                    for (var j = 0; j < idsDeEstePrograma.length; j++) {
                        var idLimpio = idsDeEstePrograma[j].trim();
                        if (todosListIdsOdv.indexOf(idLimpio) === -1) { // Evitar duplicados
                            todosListIdsOdv.push(idLimpio);
                        }
                    }
                }
                

                // Solo calcular monto de productividad si el estatus es 7
                if (statusProgram == 7) {
                    var idsArray = listIdsOdv.split(',');
                    for (var i = 0; i < idsArray.length; i++){
                        var currentId = idsArray[i].trim(); // Eliminar espacios en blanco
                        var objSO = search.lookupFields({
                            type: 'salesorder',
                            id: currentId,
                            columns: ['trandate']
                        });
                        
                        var fechaSO = objSO.trandate                    
                        var periodoSO = Utils.encontrarPeriodo(fechaSO, todosPeriodos);                    
                        
                        data.push(currentId)

                        if (!ventasPorPeriodo[periodoSO]) {
                            ventasPorPeriodo[periodoSO] = [];
                            numeroVentasPorPeriodo[periodoSO] = 0;
                        }
                        
                        ventasPorPeriodo[periodoSO].push({
                            internalid: currentId,
                            fecha: fechaSO,
                            periodo: periodoSO,
                        });
                        numeroVentasPorPeriodo[periodoSO]++;
                        
                    }
                    
                
                        
                    var totalVentasPorPeriodo = {};
                    for (var periodo in ventasPorPeriodo) {
                        totalVentasPorPeriodo[periodo] = ventasPorPeriodo[periodo].length;
                    }
                    for (e in numeroVentasPorPeriodo){
                        var ventasEnPeriodo = numeroVentasPorPeriodo[e]; 
                        
                        var montoProductividadxPeriodo= compConfigDetails[1]['esquemaVentasPresentadora'][ventasEnPeriodo]['bonoProductividad']
                        
                        montoProductividadxPeriodo = parseInt(montoProductividadxPeriodo);
                        if(montoProductividadxPeriodo > 0){
                            montoTotalProductividad += parseInt(montoProductividadxPeriodo);
                        }
                    }
                }
                
            }

            // Si no hay programas activos, retornar estructura vacía
            if (!tieneProgramasActivos) {
                return {
                    tieneProgramasActivos: tieneProgramasActivos,
                    detalleProgramas: programasActivos,
                    monto: 0, 
                    data: ventasPorPeriodo,
                    montoVP: 0,
                    listIdsOdv: todosListIdsOdv.join(',') // Convertir array a string separado por comas
               };
            }
            
            var resultado = {
                tieneProgramasActivos: tieneProgramasActivos,
                detalleProgramas: programasActivos,
                monto: montoTotalProductividad, 
                data: ventasPorPeriodo,
                montoVP: montoVentasPre,
                listIdsOdv: todosListIdsOdv.join(',') // Convertir array a string separado por comas
           };
           
           return resultado;*/

        } catch (error) {
            log.error('Error en función programas', {
                empleadoId: empleadoId,
                error: error.toString()
            });
            
            return {
                
                detalleProgramas: [],
                monto: 0, // Monto de productividad
                data: {},
                montoVP: 0, // Monto de venta propia
                listIdsOdv: '', // Valor vacío en caso de error
                programas: [], // Mantener por compatibilidad
                error: error.toString()
            };
        }
    }
    function bonoProductividadTMSB(empID,dataEmp,historicoSO,compConfigDetails,finPeriodo,inicioPeriodo,todosPeriodos,tmGanada,tmPagada){//validar tipo de reingreso en el llamado, pasar a la funcion
        try{
               
            var reingreso = dataEmp.tipoReingreso
            var empTipoIngreso
            var finObjetivo2
            if(reingreso == ''){
                empTipoIngreso = dataEmp.tipoIngreso
                finObjetivo2 = dataEmp.objetivo_2
            } else{
                empTipoIngreso = reingreso
                
                if(dataEmp.obj_2_reactivacion == ''){
                    finObjetivo2 = finObjetivo2 = dataEmp.objetivo_2
                }else{
                    finObjetivo2 = dataEmp.obj_2_reactivacion
                }
            }
            var tmsbCampo = dataEmp.statusTMSB
            //log.debug('empID',empID)
            //log.debug('finObjetivo2 antes',finObjetivo2)
            finObjetivo2 = Utils.stringToDate(finObjetivo2)
            //log.debug('finObjetivo2',finObjetivo2)
            var inicioPeriodofecha = Utils.stringToDate(inicioPeriodo)
            //log.debug('inicioPeriodofecha',inicioPeriodofecha)
            var finPeriodofecha = Utils.stringToDate(finPeriodo)
            //log.debug('finPeriodofecha',finPeriodofecha)
            //log.debug('tmGanada',tmGanada)
            //log.debug('tmPagada',tmPagada)
            //log.debug('empID',empID)
            
            if(empTipoIngreso == 14  && finObjetivo2 <= finPeriodofecha && finObjetivo2 >= inicioPeriodofecha && !tmGanada.hasOwnProperty(empID) && !tmPagada.hasOwnProperty(empID)){
                var ventas = historicoSO[empID]
                //log.debug('ventas',ventas)
                var data = []
                var ventasPorPeriodo = {}
                var numeroVentasPorPeriodo = {};
                var montoTotalProductividad = 0; 
                var detallesPorPeriodo = []; 
                var ventasPorPeriodoVP = {}
                for (i in ventas){
                    var ventasData= Object.keys(ventas[i])
                    var internalid = ventas[i][ventasData]['internalid']
                    var fechaSO = ventas[i][ventasData]['trandate']
                    var comStatus = ventas[i][ventasData]['comStatus']
                    var tipoVenta = ventas[i][ventasData]['tipoVenta']
                    var otroFin = ventas[i][ventasData]['otroFin']
                    //log.debug('comStatus',comStatus)
                    if (comStatus == 2 && !esVentaCancelacionValor(tipoVenta, otroFin)){
                        var periodoSO = Utils.encontrarPeriodo(fechaSO, todosPeriodos);                    

                        //log.debug('periodoSO',periodoSO)
                        
                        data.push(internalid)

                        if (!ventasPorPeriodo[periodoSO]) {
                            ventasPorPeriodo[periodoSO] = [];
                            numeroVentasPorPeriodo[periodoSO] = 0;
                        }
                        
                        ventasPorPeriodo[periodoSO].push({
                            internalid: internalid,
                            fecha: fechaSO,
                            periodo: periodoSO,
                        });
                        numeroVentasPorPeriodo[periodoSO]++;
                    }
                    
                    
                }
                //log.debug('data',data)
                var ventasNo = data.length
                var montoVentasPre= compConfigDetails[1]['esquemaVentasPresentadora'][ventasNo]['compensacion']
                var totalVentasPorPeriodo = {};
                for (var periodo in ventasPorPeriodo) {
                    totalVentasPorPeriodo[periodo] = ventasPorPeriodo[periodo].length;
                }
                //log.debug('Total de ventas por período ', totalVentasPorPeriodo);

                for (e in numeroVentasPorPeriodo){
                    var ventasEnPeriodo = numeroVentasPorPeriodo[e]; 
                    //log.debug('Ventas en período '+ e, ventasEnPeriodo);
                    var montoProductividadxPeriodo= compConfigDetails[1]['esquemaVentasPresentadora'][ventasEnPeriodo]['bonoProductividad']
                    montoProductividadxPeriodo = parseInt(montoProductividadxPeriodo);
                    //log.debug('montoProductividadxPeriodo',montoProductividadxPeriodo)
                    if(montoProductividadxPeriodo > 0){
                        montoTotalProductividad += parseInt(montoProductividadxPeriodo);
                    }
                }
               /* log.debug('Monto total productividad', montoTotalProductividad);
                log.debug(' data ventasPorPeriodo', ventasPorPeriodo);
                log.debug(' montoVentasPre', montoVentasPre);*/
                return {
                    monto: montoTotalProductividad, 
                    data: ventasPorPeriodo,
                    montoVP: montoVentasPre
                };

            }
            return false
                

        }catch(e){
            log.error('Error bono productividad tmsb', e)
            return false
        }
    }
    function bonoExtendido(reclutas,historicoSO,thisPeriodSO,dataEmp,compConfigDetails,allPresentadoras,dHistorico){
        try{
            
            if(reclutas){
                var bono_reclutadora = 0
                var ordenes = {}
                var salesReclutas = {}

                reclutas.forEach(function(i,index) {//Se recorren las reclutas del Presentador
                    var ventasReclutaTP = thisPeriodSO[i];
                    var ventasReclutaH = historicoSO[i];
                    //log.debug('ventasReclutaH'+ i,ventasReclutaH)
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
                    var cont = 0
                    if(ventasReclutaH) {  
                        cont = ventasReclutaH.length 
                    } 
                    
                    if(ventasReclutaTP && confRec == 15 && dcontratacion > dHistorico && cont < 4){//dHistorico es una fecha tresmeses atras
                        
                        fechaObjetivo = Utils.stringToDate(fechaObjetivo)
                        var fechaLimite30Dias = new Date(fechaObjetivo);
                        fechaLimite30Dias.setDate(fechaLimite30Dias.getDate() + 30);
                        var noComisiona = 3
                        
                        log.debug('ventasReclutaTP',ventasReclutaTP)
                        var montoInd = 0                          
                        var salesReclutaTP = []
                        var faltantesRec = 0
                        var ventasCumplidas = false
                        var bonoExtraAsignado = false
                        
                        
                        // Procesar ventas del período actual
                        for(j in ventasReclutaTP) {
                            key = Object.keys(ventasReclutaTP[j])
                            var tipoVenta = ventasReclutaTP[j][key]['custbody_tipo_venta']
                            var fechaSO = ventasReclutaTP[j][key]['trandate']
                            fechaSO = Utils.stringToDate(fechaSO)
                            var id = ventasReclutaTP[j][key]['internalid']
                            var docNum = ventasReclutaTP[j][key]['tranid']

                            if(fechaSO <= fechaLimite30Dias && tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasReclutaTP[j][key]['custbody_otro_financiamiento'])){
                                cont ++
                                if(cont == 4){
                                    //log.debug('armar arreglo y sumar bono')
                                    montoInd += 5000; // Bono extra por cuarta venta
                                    var pedidoExtra = { 
                                        idSO: id, 
                                        docNum: docNum, 
                                        noVenta: '4a Venta',
                                        tipo: 'bono_extra',
                                        monto: 5000
                                    }
                                    salesReclutaTP.push(pedidoExtra)
                                    salesReclutas[i] = salesReclutaTP
                                    break
                                }else if(cont > 4){
                                    //log.debug('ya se debio haber pagado')
                                    break
                                }else if(cont < 4){
                                    //log.debug('continuar con la siguiente orden')
                                }
                            }
                            
                        }
                        
                        bono_reclutadora += montoInd;
                        
                    }
                    
                });
                if(bono_reclutadora > 0){
                    return {monto:bono_reclutadora, data:salesReclutas}; 
                }else{
                    return  false;
                }
                
     
            } 
            return false
        }catch(e){
            log.error('error reclutamiento3x2',e)
            return false
        }     
    }
    function bonoNuevoRecluta(empID,dataEmp,reclutas,thisPeriodSO,historicoSO,allPresentadoras,dHistorico,integrantesEquipo){
        try{
            //log.debug('thisPeriodSO[empID]',thisPeriodSO[empID])
            if( thisPeriodSO[empID]){
                var bono_nuevoRecluta = 0
                var salesReclutas = {}
                var noReclutasActivos = 0
                integrantesEquipo.forEach(function(i,index) {//Se recorren las reclutas del Presentador
                    //log.debug('recluta',i)
                    var ventasReclutaTP = thisPeriodSO[i];
                    //log.debug('ventasReclutaTP',ventasReclutaTP)
                    var reclutador = allPresentadoras[i]['emp_reclutadora']
                    //log.debug('reclutador',reclutador)
                    if( ventasReclutaTP ){//si el reclutador es parte del equipo o es el lider y tiene su primer venta en el periodo calculado
                        
                        /*log.debug('empID',empID)
                        log.debug('integrantesEquipo reclutador',integrantesEquipo)*/
                        var ventasReclutaH = historicoSO[i];
                        //log.debug('ventasReclutaH',ventasReclutaH)
                        var hiredate = allPresentadoras[i]['hiredate']
                        var fechaObjetivo = allPresentadoras[i]['objetivo_1']
                        var reactivacion = allPresentadoras[i]['fechaReactivacion']
                        var dcontratacion
                        if(reactivacion == ''){
                            dcontratacion = Utils.stringToDate(hiredate)
                        }else{
                            dcontratacion = Utils.stringToDate(reactivacion)
                            fechaObjetivo = allPresentadoras[i]['obj_1_reactivacion']
                        }
                        fechaObjetivo = Utils.stringToDate(fechaObjetivo)
                        
                        //fechaObjetivo.setDate(fechaObjetivo.getDate() + 2);//mas dos dias de gracia
                        
                        if(dcontratacion > dHistorico && ventasReclutaTP && !ventasReclutaH){//Si su contratacion/Reactivacion es anterios a 3 meses se asume que ya se pagó el bono, al igual si hay ventas en el historico
                            
                            var salesReclutaTP =[]
                            var cont = 0
                            
                            for(j in ventasReclutaTP){//Se recorren las Ordenes de cada recluta del Presentador
                                key = Object.keys(ventasReclutaTP[j])
                                var tipoVenta = ventasReclutaTP[j][key]['custbody_tipo_venta']
                                var fechaSO = ventasReclutaTP[j][key]['trandate']
                                var id = ventasReclutaTP[j][key]['internalid']
                                var docNum = ventasReclutaTP[j][key]['tranid']
                                
                                fechaSO = Utils.stringToDate(fechaSO)
                                if( fechaSO <= fechaObjetivo && tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasReclutaTP[j][key]['custbody_otro_financiamiento'])){//dentro del primer mes natural que es el objetivo 1
                                    //log.debug('esta si ',id)
                                    cont ++ 
                                    noReclutasActivos ++
                                    var pedido = { idSO:id,docNum:docNum, noVenta:cont} 
                                    
                                    salesReclutaTP.push(pedido)
                                    salesReclutas[i] = salesReclutaTP
                                    
                                    
                                    if(cont >= 1){
                                        break
                                    }
                                }
                            }
                        }
                    }
                     
                });
                //log.debug('noReclutasActivos',noReclutasActivos)
                var monto 
                if(noReclutasActivos >= 1 && noReclutasActivos <= 5){
                    monto = 600
                } else if(noReclutasActivos >= 6){
                    monto = 1200
                }
                bono_nuevoRecluta = noReclutasActivos * monto
                /*log.debug('bono_nuevoRecluta',bono_nuevoRecluta)
                log.debug('salesReclutas',salesReclutas)*/
                if(bono_nuevoRecluta > 0){
                    return  {monto:bono_nuevoRecluta, noActivos:noReclutasActivos, data:salesReclutas};
                }else{
                    return  false;
                }
                
            } 
            
        }catch(e){
            log.error('error bono Nuevo recluta',e)
        }

    }

    /**
     * BONO POOL TALENT (Líder de Equipo): $2,500 por cada **integrante del equipo** de la líder
     * (presentadoras cuyo supervisor es la líder: `listaGrupos[lider]`) que alcanza su 5.ª venta
     * contable para Pool Talent dentro de 3 meses naturales desde alta efectiva (reactivación o hiredate).
     * La 5.ª venta debe caer en el periodo del reporte para pagar en ese mes.
     * La líder debe tener al menos una venta personal contable JTL en el periodo (ventasEmp).
     */
    function bonoPoolTalentLE(dataEmp, allPresentadoras, listaGrupos, historicoSO, thisPeriodSO, inicioPeriodo, finPeriodo, ventasEmp) {
        try {
            var liderId = dataEmp.internalid;
            var equipo = listaGrupos[liderId] || listaGrupos[String(liderId)];
            if (!equipo || !equipo.length) {
                return false;
            }
            var dIniP = Utils.stringToDate(inicioPeriodo);
            var dFinP = Utils.stringToDate(finPeriodo);
            if (!dIniP || !dFinP) {
                return false;
            }
            dFinP.setHours(23, 59, 59, 999);

            var fechaRow = function (row) {
                var rawTd = row.trandate;
                return rawTd instanceof Date && !isNaN(rawTd.getTime())
                    ? new Date(rawTd.getTime())
                    : Utils.stringToDate(rawTd);
            };

            var liderTieneVentaContableEnPeriodo = false;
            if (ventasEmp) {
                var vi;
                for (vi in ventasEmp) {
                    if (!ventasEmp.hasOwnProperty(vi)) {
                        continue;
                    }
                    var idSOL = ventasEmp[vi];
                    var keysL = Object.keys(idSOL);
                    if (keysL.length === 0) {
                        continue;
                    }
                    var rowL = idSOL[keysL[0]];
                    var dtL = fechaRow(rowL);
                    if (dtL && dtL >= dIniP && dtL <= dFinP && esVentaPersonalContableJTL(dataEmp, rowL)) {
                        liderTieneVentaContableEnPeriodo = true;
                        break;
                    }
                }
            }
            if (!liderTieneVentaContableEnPeriodo) {
                return false;
            }

            var recolectarFilas = function (empId) {
                var rows = [];
                var walk = function (arr) {
                    if (!arr) {
                        return;
                    }
                    var ix;
                    for (ix = 0; ix < arr.length; ix++) {
                        var idSO = arr[ix];
                        var keys = Object.keys(idSO);
                        if (keys.length === 0) {
                            continue;
                        }
                        rows.push(idSO[keys[0]]);
                    }
                };
                walk(historicoSO[empId] || historicoSO[String(empId)]);
                walk(thisPeriodSO[empId] || thisPeriodSO[String(empId)]);
                return rows;
            };

            /** Fin inclusive del tercer mes natural desde el día de alta (alta + 3 meses calendario − 1 día). */
            var limiteTresMesesNaturales = function (dAlta) {
                var fin = new Date(dAlta.getFullYear(), dAlta.getMonth(), dAlta.getDate());
                fin.setMonth(fin.getMonth() + 3);
                fin.setDate(fin.getDate() - 1);
                fin.setHours(23, 59, 59, 999);
                return fin;
            };

            var detalle = [];
            var montoTotal = 0;
            var idxEq;
            for (idxEq = 0; idxEq < equipo.length; idxEq++) {
                var rid = equipo[idxEq];
                var rec = allPresentadoras[rid] || allPresentadoras[String(rid)];
                if (!rec) {
                    continue;
                }
                // Solo miembros del equipo (no evaluar a la propia líder como “integrante”)
                if (String(rid) === String(liderId)) {
                    continue;
                }
                var reactivacion = rec.fechaReactivacion;
                var dAlta = null;
                if (reactivacion !== '' && reactivacion != null) {
                    dAlta = Utils.stringToDate(reactivacion);
                } else if (rec.hiredate !== '' && rec.hiredate != null) {
                    dAlta = Utils.stringToDate(rec.hiredate);
                }
                if (!dAlta) {
                    log.audit({
                        title: '[Bono Pool Talent LE] Integrante ' + String(rid) + ' sin fecha de alta',
                        details: JSON.stringify({
                            liderId: String(liderId),
                            empleadoId: String(rid),
                            motivo: 'Sin hiredate ni reactivación; no se evalúa Pool Talent'
                        })
                    });
                    continue;
                }
                dAlta.setHours(0, 0, 0, 0);
                var winEnd = limiteTresMesesNaturales(dAlta);

                var filas = recolectarFilas(rid);
                filas.sort(function (a, b) {
                    var fa = fechaRow(a);
                    var fb = fechaRow(b);
                    if (!fa || !fb) {
                        return 0;
                    }
                    var c = fa.getTime() - fb.getTime();
                    if (c !== 0) {
                        return c;
                    }
                    return String(a.internalid).localeCompare(String(b.internalid));
                });

                var diagnosticoFilasRaw = [];
                var di;
                for (di = 0; di < filas.length; di++) {
                    var rowDi = filas[di];
                    var dtDi = fechaRow(rowDi);
                    var mexc = motivosExclusionVentaPoolTalent(rec, rowDi);
                    var pasaCont = mexc.length === 0;
                    var enVentana = !!(dtDi && dtDi >= dAlta && dtDi <= winEnd);
                    var extras = pasaCont ? [] : mexc.slice();
                    if (!dtDi) {
                        extras.push('sinFechaTrandate');
                    } else if (!enVentana) {
                        extras.push('fechaFueraVentana3MesesDesdeAlta');
                    }
                    diagnosticoFilasRaw.push({
                        internalid: String(rowDi.internalid),
                        trandate: rowDi.trandate != null ? String(rowDi.trandate) : '',
                        tranid: rowDi.tranid ? String(rowDi.tranid) : '',
                        custbody_tipo_venta: rowDi.custbody_tipo_venta,
                        custbody_vw_comission_status: rowDi.custbody_vw_comission_status,
                        pasaVentaPoolTalent: pasaCont,
                        fechaDentroVentana3Meses: enVentana,
                        cuentaEnStackPoolTalent: pasaCont && enVentana,
                        motivosExclusion: extras.length ? extras.join(', ') : pasaCont && enVentana ? 'ok' : ''
                    });
                }

                var seen = {};
                var ventasContablesEnVentana = [];
                var tipoAlta =
                    reactivacion !== '' && reactivacion != null ? 'reactivacion' : 'hiredate';
                var q;
                for (q = 0; q < filas.length; q++) {
                    var row = filas[q];
                    if (!esVentaCuentaParaPoolTalent(rec, row)) {
                        continue;
                    }
                    var idStr = row.internalid.toString();
                    if (seen[idStr]) {
                        continue;
                    }
                    var dt = fechaRow(row);
                    if (!dt || dt < dAlta || dt > winEnd) {
                        continue;
                    }
                    seen[idStr] = true;
                    var ord = ventasContablesEnVentana.length + 1;
                    ventasContablesEnVentana.push({
                        orden: ord,
                        fechaVenta: row.trandate ? String(row.trandate) : dt ? String(dt) : '',
                        internalid: String(row.internalid),
                        tranid: row.tranid ? String(row.tranid) : '',
                        _row: row,
                        _dt: dt
                    });
                }
                var primerasCincoVentasLog = [];
                var pc;
                for (pc = 0; pc < ventasContablesEnVentana.length && pc < 5; pc++) {
                    var ev = ventasContablesEnVentana[pc];
                    primerasCincoVentasLog.push({
                        orden: ev.orden,
                        fechaVenta: ev.fechaVenta,
                        internalid: ev.internalid,
                        tranid: ev.tranid
                    });
                }
                var quinta =
                    ventasContablesEnVentana.length >= 5 ? ventasContablesEnVentana[4]._row : null;
                var fQuinta =
                    ventasContablesEnVentana.length >= 5 ? ventasContablesEnVentana[4]._dt : null;
                var todasVentasParaLog = [];
                var tv;
                for (tv = 0; tv < ventasContablesEnVentana.length; tv++) {
                    var vx = ventasContablesEnVentana[tv];
                    todasVentasParaLog.push({
                        orden: vx.orden,
                        fecha: vx.fechaVenta,
                        internalidOdv: vx.internalid,
                        tranid: vx.tranid
                    });
                }
                var fechaAltaOrigenStr =
                    reactivacion !== '' && reactivacion != null ? String(reactivacion) : String(rec.hiredate || '');
                var fechasSoloPrimeras5 = [];
                var pi;
                for (pi = 0; pi < primerasCincoVentasLog.length; pi++) {
                    fechasSoloPrimeras5.push(primerasCincoVentasLog[pi].fechaVenta || '');
                }
                log.audit({
                    title:
                        '[Pool Talent] Líder ' +
                        String(liderId) +
                        ' | Integrante equipo ' +
                        String(rid) +
                        (rec.entityid ? ' ' + String(rec.entityid) : '') +
                        ' — alta y ventas en ventana (todas)',
                    details: JSON.stringify({
                        liderId: String(liderId),
                        // Se mantiene la clave legacy `reclutaId` para compatibilidad con consumidores existentes del JSON
                        reclutaId: String(rid),
                        tipoPersona: 'integranteEquipo',
                        nombrePresentadora: rec.entityid || '',
                        fechaAlta: {
                            efectivaUsadaEnRegla: String(dAlta),
                            valorEnCampoOrigen: fechaAltaOrigenStr,
                            origen: tipoAlta === 'reactivacion' ? 'reactivación' : 'hiredate',
                            limite3MesesNaturales: String(winEnd)
                        },
                        totalOdvsRecolectadasHistoricoMasPeriodo: filas.length,
                        diagnosticoCadaOdvCargada: diagnosticoFilasRaw,
                        todasLasVentasPersonalesContablesJTLenVentana: todasVentasParaLog,
                        totalVentasContablesEnVentana: todasVentasParaLog.length,
                        primeras5VentasPersonalesContablesJTL: {
                            fechasEnOrden: fechasSoloPrimeras5,
                            detallePorVenta: primerasCincoVentasLog
                        },
                        resumenElegibilidad: {
                            ventasContablesEnVentana: ventasContablesEnVentana.length,
                            tieneQuintaVentaEnVentana: !!(quinta && fQuinta),
                            quintaVentaDentroPeriodoReporte:
                                quinta && fQuinta ? fQuinta >= dIniP && fQuinta <= dFinP : false,
                            periodoReporte: { inicio: String(dIniP), fin: String(dFinP) }
                        }
                    })
                });
                if (!quinta || !fQuinta) {
                    continue;
                }
                if (fQuinta >= dIniP && fQuinta <= dFinP) {
                    montoTotal += 2500;
                    detalle.push({
                        reclutaId: String(rid),
                        tipoPersona: 'integranteEquipo',
                        quintaVentaInternalid: String(quinta.internalid),
                        tranid: quinta.tranid || '',
                        fechaQuintaVenta: quinta.trandate ? String(quinta.trandate) : String(fQuinta)
                    });
                }
            }

            if (montoTotal > 0) {
                return { monto: montoTotal, data: detalle };
            }
            return false;
        } catch (e) {
            log.error('error bono Pool Talent LE', e);
            return false;
        }
    }

    function bonoActividad(empID,dataEmp,integrantesEquipo,thisPeriodSO,historicoSO,allPresentadoras,dHistorico,inicioPeriodo,finPeriodo){
        try{
            if( thisPeriodSO[empID]){
                if(integrantesEquipo){

                    var bono_actividad = 0
                    var salesIntegrante = {}
                    var noIntegrantesActivos = 1 
                    integrantesEquipo.forEach(function(i,index) {//Se recorren los integrantes del equipo
                        //log.debug('recluta',i)
                        var ventasIntegranteTP = thisPeriodSO[i];
                        //log.debug('ventasIntegranteTP',ventasIntegranteTP)
                        var ventasIntegranteH = historicoSO[i];
                       // log.debug('ventasIntegranteH signo ',!ventasIntegranteH) 
                        //Debe tener ventas en el periodo calculado
                        var hiredate = allPresentadoras[i]['hiredate']
                        var fechaObjetivo = allPresentadoras[i]['objetivo_1'] //objetivo menor al fin del periodo
                        var reactivacion = allPresentadoras[i]['fechaReactivacion']
                        var dcontratacion
                        if(reactivacion == ''){
                            dcontratacion = Utils.stringToDate(hiredate)
                        }else{
                            dcontratacion = Utils.stringToDate(reactivacion)
                        }
                        fechaObjetivo = Utils.stringToDate(fechaObjetivo)    
                        var fechafinPeriodo = finPeriodo
                        fechafinPeriodo = Utils.stringToDate(fechafinPeriodo) 
                        var fechainicioPeriodo = inicioPeriodo
                        fechainicioPeriodo = Utils.stringToDate(fechainicioPeriodo) 

                        //si tienen por lo menos una venta en el historico se asume que ya se pago el bono de Nuevo recluta

                        
                        if((ventasIntegranteTP && ventasIntegranteH) || (ventasIntegranteTP && fechaObjetivo < fechainicioPeriodo) ){   
                            noIntegrantesActivos ++
                            //log.debug('noIntegrantesActivos primer if',noIntegrantesActivos)
                            var salesIntegranteTP =[]
                            
                            for(j in ventasIntegranteTP){//Se recorren las Ordenes de cada recluta del Presentador
                                key = Object.keys(ventasIntegranteTP[j])
                                var tipoVenta = ventasIntegranteTP[j][key]['custbody_tipo_venta']
                                var fechaSO = ventasIntegranteTP[j][key]['trandate']
                                var id = ventasIntegranteTP[j][key]['internalid']
                                var docNum = ventasIntegranteTP[j][key]['tranid']
                                fechaSO = Utils.stringToDate(fechaSO)
                                if(tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasIntegranteTP[j][key]['custbody_otro_financiamiento'])){
                                    var pedido = { idSO:id,docNum:docNum} 
                                    salesIntegranteTP.push(pedido)
                                }
                                salesIntegrante[i] = salesIntegranteTP
                            }
                        }else if(ventasIntegranteTP){
                           
                            //log.debug('noIntegrantesActivos dentro',noIntegrantesActivos)
                            var salesIntegranteTP =[]
                            
                            for(j in ventasIntegranteTP){//Se recorren las Ordenes de cada recluta del Presentador
                                key = Object.keys(ventasIntegranteTP[j])
                                var tipoVenta = ventasIntegranteTP[j][key]['custbody_tipo_venta']
                                var fechaSO = ventasIntegranteTP[j][key]['trandate']
                                var id = ventasIntegranteTP[j][key]['internalid']
                                var docNum = ventasIntegranteTP[j][key]['tranid']
                                fechaSO = Utils.stringToDate(fechaSO)
                                var todasVentasDespuesObjetivo = true
                               if(fechaSO <= fechaObjetivo) {// Verifica si alguna venta es antes de la fecha objetivo
                                    todasVentasDespuesObjetivo = false
                                    break
                                }
                                
                                // Solo agrega ventas que no sean TM Ganada
                                if(tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasIntegranteTP[j][key]['custbody_otro_financiamiento'])){
                                    var pedido = { idSO:id,docNum:docNum} 
                                    salesIntegranteTP.push(pedido)
                                }
                            }
                            
                            // Incrementa el contador solo si todas las ventas son después del objetivo
                            if(todasVentasDespuesObjetivo && salesIntegranteTP.length > 0) {
                                noIntegrantesActivos ++
                                salesIntegrante[i] = salesIntegranteTP
                            }
                        }
                    });
                    //log.debug('noIntegrantesActivos',noIntegrantesActivos)
                    var monto 
                    if(noIntegrantesActivos > 2 && noIntegrantesActivos < 5){
                        monto = 2000
                    } else if(noIntegrantesActivos > 4 && noIntegrantesActivos < 8){
                        monto = 5000
                    }else if(noIntegrantesActivos > 7 ){
                        monto = 12000
                    }
                    bono_actividad = monto
                    //log.debug('bono_actividad',bono_actividad)
                    //log.debug('salesIntegrante',salesIntegrante)
                    if(bono_actividad > 0){
                        return  {monto:bono_actividad, noActivos:noIntegrantesActivos, data:salesIntegrante};
                    }else{
                        return  false;
                    }
                    
                }
            }
            
            
        }catch(e){
            log.error('error bono Actividad',e)
        }

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
            if(conf){
                var ventasP = ventasEmp
                //log.debug('ventas',ventasP)
                var data = []
                for (i in ventasP){
                    var ventasData= Object.keys(ventasP[i])
                    var comisionables = ventasP[i][ventasData]['custbody_vw_comission_status']
                    var tipoVenta = ventasP[i][ventasData]['custbody_tipo_venta']
                    //log.debug('comisionables',comisionables)
                    if( tipoVenta != 'TM Ganada' && comisionables != 'No Comisionable' && !esVentaCancelacionValor(tipoVenta, ventasP[i][ventasData]['custbody_otro_financiamiento'])){
                        data.push(ventasData)
                    }
                    
                }
                var t_venta_propia = data.length
                //log.debug('t_venta_propia',t_venta_propia)
                //log.debug('conf',conf)
                var bono_emerald = parseInt(compConfigDetails[conf]['esquemaVentasPresentadora'][t_venta_propia]['bonoProductividad'],10) - parseInt(compConfigDetails['1']['esquemaVentasPresentadora'][t_venta_propia]['bonoProductividad'],10)
                //log.debug('bono_emerald',bono_emerald)
                return {monto:bono_emerald}
            }else{
                return false
            }
            
        }catch(e){
            log.error('error bono joya',e)
        }

    }
    function bonoXmasdosNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,listaEquipoRecluta,historicoSO,dHistorico,namePeriodo,cust_period,listaReclutas){
        try{
            var liderM=dataEmp.internalid//lider madre
            var montoTotal52= 0
            var montoTotal32= 0
            if(listaNombramientos.hasOwnProperty(liderM)){//Se valida si la lider tiene lideres hijos
                var liderHijo = {}
                //log.debug('liderM',liderM)
                //log.debug('listaNombramientos de la lider ', listaNombramientos[liderM])
                for(i in listaNombramientos[liderM]){//por cada lider hijo se obtiene su configuracion, equipo y ventas y se llama al bono Venta equipo para calcular el monto
                    var periodoPagoNLE= allPresentadoras[listaNombramientos[liderM][i]].periodoPagoNLE
                    
                    if(periodoPagoNLE == cust_period || !periodoPagoNLE){//valida que el campo de pago x+2 en el emloyee este vacio o que el periodo sea el mismo que el que se estacalculando
                        //log.debug('campo vacio')

                        var dataEmpH=allPresentadoras[listaNombramientos[liderM][i]]
                        var idHijo = dataEmpH.internalid
                        var empConf=allPresentadoras[listaNombramientos[liderM][i]].emp_conf
                           // log.debug('lista empConf', empConf)
                        var configH=Utils.getConf(empConf);
                            //log.debug('lista configH', configH)
                        var equipoH=listaGrupos[listaNombramientos[liderM][i]]
                           // log.debug('lista equipoH', equipoH)
                        var reclutasH=listaReclutas[listaNombramientos[liderM][i]]
                        var reclutaEquipoH=listaEquipoRecluta[listaNombramientos[liderM][i]]
                        var ventasH= thisPeriodSO[listaNombramientos[liderM][i]]
                            //log.debug('lista ventasH', ventasH)
                        var xMasdosH=bonoXmasDos(
                            dataEmpH,
                            reclutaEquipoH,
                            thisPeriodSO,
                            ventasH,
                            historicoSO,
                            allPresentadoras,
                            dHistorico,
                            equipoH,
                            reclutasH,
                            listaReclutas,
                            true
                        )
                          
                        var montoNLE32=xMasdosH.monto32
                        var montoNLE52=xMasdosH.monto52
                        
                        if(montoNLE32 > 0 || montoNLE52 > 0){
                            /*log.debug('montoNLE32',montoNLE32)
                            log.debug('montoNLE52',montoNLE52)
                            log.debug('cuando se guarde el registro de actualizara el registro de ', idHijo)*/
                            
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
    function ventaEquipoNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,compConfigDetails){
        try{
            var liderM=dataEmp.internalid//lider madre
            var montoTotal= 0
            var nle = {}
            //log.debug('liderM',liderM)
            //log.debug('listaNombramientos',listaNombramientos)
            var numeroVentasEquipo=0
            if(listaNombramientos.hasOwnProperty(liderM)){//Se valida si la lider tiene lideres hijos
                var liderHijo = {}
                //log.debug('listaNombramientos de la lider ', listaNombramientos[liderM])
                for(i in listaNombramientos[liderM]){//por cada lider hijo se obtiene sus ventas pripias, equipo y ventas  del equipo
                    
                    var equipoH=listaGrupos[listaNombramientos[liderM][i]]
                    //log.debug('lista equipoH', equipoH)
                    var ventasH= thisPeriodSO[listaNombramientos[liderM][i]]
                    //log.debug('lista ventasH', ventasH)
                    var ventaPropia= []
                    for (y in ventasH){

                        var key = Object.keys(ventasH[y])
                        var salesrep = ventasH[y][key].salesrep
                        //log.debug('salesrep',salesrep)
                        var idso = ventasH[y][key].internalid
                        //log.debug('idso',idso)
                        var tipoVenta=ventasH[y][key]['custbody_tipo_venta'] 
                        if(tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasH[y][key]['custbody_otro_financiamiento'])){
                            ventaPropia.push(idso)
                        }
                        
                        
                    }
                    
                    var infoVentasEquipo ={}
                    var venta_equipo = 0
                    for(n in equipoH){//Recorrido de integrantes del equipo
                        var ventas=[]
                        var ventasint= thisPeriodSO[equipoH[n]]
                        //Recorrido de las ventas de cada integrante de equipo
                        for(x in ventasint){
                            var key = Object.keys(ventasint[x])
                            var tipoVenta=ventasint[x][key]['custbody_tipo_venta'] 
                            //log.debug('key',key)
                            //log.debug('tipoVenta',tipoVenta)
                            if(tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasint[x][key]['custbody_otro_financiamiento'])){
                                ventas.push(key[0])
                            }
                        }
                        //log.debug('ventasint',ventasint)
                        //log.debug('ventas',ventas)
                        if(ventas!=''){
                            //log.debug('ventas length',ventas.length)
                            infoVentasEquipo[equipoH[n]] = ventas
                            numeroVentasEquipo += ventas.length
                                                     
                        }
                    }
                    if(ventaPropia != ''){
                        numeroVentasEquipo = numeroVentasEquipo+ventaPropia.length//se suman las ventas del equipo con las ventas propias
                    }
                    
                   // log.debug('numeroVentasEquipo 2',numeroVentasEquipo)
                    //log.debug('infoVentasEquipo',infoVentasEquipo)
                    nle[listaNombramientos[liderM][i]] = { dataEquipo:infoVentasEquipo, ventaPropia:ventaPropia }
                }
                
                
                return {noVentas:numeroVentasEquipo, dataNle:nle }
            }else{
                return false
            }
                 
        }catch(e){
            log.error('VentaEquipoNLE ', e)
            return false
        }
        

    }
    function bonoVentaEquipo(ventasEmp,compConfigDetails,conf,integrantesEquipo,thisPeriodSO,listaNombramientos,dataEmp,listaGrupos,allPresentadoras){
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
                if( tipoVenta != 'TM Ganada' && comisionables != 'No Comisionable' && !esVentaCancelacionValor(tipoVenta, ventasP[i][ventasData]['custbody_otro_financiamiento'])){
                    data.push(ventasData)
                }
                
            }
            var t_venta_propia = data.length
            var porcentaje
            var numeroVentasEquipo=0
            var infoVentasEquipo ={}
            var venta_equipo = 0
            //log.debug('t_venta_propia',t_venta_propia)
            //log.debug('conf',conf)
            for(n in integrantesEquipo){//Recorrido de integrantes del equipo
                var ventas=[]
                var ventasint= thisPeriodSO[integrantesEquipo[n]]
                //Recorrido de las ventas de cada integrante de equipo
                for(x in ventasint){
                    var key = Object.keys(ventasint[x])
                    var tipoVenta=ventasint[x][key]['custbody_tipo_venta'] 
                    //log.debug('key',key)
                    //log.debug('tipoVenta',tipoVenta)
                    if(tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasint[x][key]['custbody_otro_financiamiento'])){
                        ventas.push(key[0])
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
            var nle = ventaEquipoNLE(listaNombramientos,dataEmp,thisPeriodSO,listaGrupos,allPresentadoras,compConfigDetails)
           //log.debug('nle',nle)
            if(nle != false){
                numeroVentasEquipo = numeroVentasEquipo + nle.noVentas
            }
            
            //log.debug('numeroVentasEquipo',numeroVentasEquipo)
            for ( i in compConfigDetails[1]['esquemaVentasJefaGrupo']['propias'] ){//SE OBTIENE EL PORCENTAJE
                var desde = compConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['desde']
                var hasta = compConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['hasta']
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
                        venta_equipo = (compConfigDetails[conf]['esquemaVentasJefaGrupo']['grupo'][num_]['compensacion'])*(parseInt(porcentaje,10)/100)
                        //log.debug('venta_equipo',venta_equipo)
                        break;
                    }
                }
            }
                              
        }catch(e){
            log.error('bonoVentaEquipo ', e)
        }
        return {monto:venta_equipo, porcentaje:porcentaje, infoVentasEquipo:infoVentasEquipo, noVentas:numeroVentasEquipo, infoNle:nle.dataNle}

    }
    function bonoProductividad(dataEmp,ventasEmp,compConfigDetails){
        try{
            
            var ventasNo = 0
            var ventas = ventasEmp
           // log.debug('ventas',ventas)
            var data = []
            var epTm7 = dataEmp.epTm7
            var ordenesAExcluir = dataEmp.custentity_ordenes_a_excluir
            //log.debug('epTm7',epTm7)
            var epTm7_inicio = dataEmp.epTm7_inicio
            var fechatm7_ganada = dataEmp.fechatm7_ganada
            var soid_Ganadora = dataEmp.so_ganotm7
            var fecha_termino
            if(fechatm7_ganada == ''){
                fecha_termino = dataEmp.epTm7_fin
            }  else{
                fecha_termino = fechatm7_ganada
            }
            var tm 
            if(epTm7 == true && epTm7_inicio) {
                epTm7_inicio = Utils.stringToDate(epTm7_inicio)
                //log.debug('epTm7_inicio',epTm7_inicio)
                fecha_termino = Utils.stringToDate(fecha_termino)
                //log.debug('fecha_termino',fecha_termino)
                for (i in ventas){
                    var ventasData= Object.keys(ventas[i])
                    //thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
                    var comisionables = ventas[i][ventasData]['custbody_vw_comission_status']
                    var tipoVenta = ventas[i][ventasData]['custbody_tipo_venta']
                    var fechaSO = ventas[i][ventasData]['trandate']
                    var id = ventas[i][ventasData]['internalid']
                    var tm
                    fechaSO = Utils.stringToDate(fechaSO)
                    //log.debug('fechaSO',fechaSO)
                    //log.debug('comisionables',comisionables)

                    if(comisionables != 'No Comisionable' && tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventas[i][ventasData]['custbody_otro_financiamiento'])){
                                               
                                            
                        // Validar si el ID existe en ordenesEP7 o en ordenesAExcluir
                        var ordenesEP7 = dataEmp.ovs_ep7;
                        var idExisteEnEP7 = false;
                        var idExisteEnExcluir = false;
                        
                        // Verificar en ordenesEP7
                        if (ordenesEP7 && typeof ordenesEP7 === 'string' && ordenesEP7.trim() !== '') {
                            var ordenesArrayEP7 = ordenesEP7.split(',');
                            idExisteEnEP7 = ordenesArrayEP7.indexOf(id.toString()) !== -1;
                        }
                        
                        // Verificar en ordenesAExcluir
                        if (ordenesAExcluir && typeof ordenesAExcluir === 'string' && ordenesAExcluir.trim() !== '') {
                            var ordenesArrayExcluir = ordenesAExcluir.split(',');
                            idExisteEnExcluir = ordenesArrayExcluir.indexOf(id.toString()) !== -1;
                        }
                        
                        log.debug('idExisteEnEP7 p', idExisteEnEP7 + ' para ID: ' + id);
                        log.debug('idExisteEnExcluir p', idExisteEnExcluir + ' para ID: ' + id);
                        log.debug('ordenesEP7 p', ordenesEP7);
                        log.debug('ordenesAExcluir p', ordenesAExcluir);

                        if (idExisteEnExcluir) {
                            // Orden completamente excluida - no se agrega al array data
                            log.debug('orden completamente excluida - está en ordenesAExcluir p', id);
                        } else if (idExisteEnEP7) {
                            log.debug('no comisiona esta venta 2 - ID existe en EP7 p',id)
                            tm = 'EP_tm7'
                            var pedido = { idSO:id,programa:tm} 
                            data.push(pedido)
                        } else {
                            tm = 'Regular'
                            var pedido = { idSO:id,programa:tm} 
                            data.push(pedido)
                            ventasNo ++
                        }
                    }

                }
            } else{
                for (i in ventas){
                    var ventasData= Object.keys(ventas[i])
                    //thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
                    var comisionables = ventas[i][ventasData]['custbody_vw_comission_status']
                    var tipoVenta = ventas[i][ventasData]['custbody_tipo_venta']
                    var id = ventas[i][ventasData]['internalid']
                    //log.debug('comisionables',comisionables)
                    if(comisionables != 'No Comisionable' && tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventas[i][ventasData]['custbody_otro_financiamiento'])){
                                                
                        // Validar si el ID existe en ordenesEP7 o en ordenesAExcluir
                        var ordenesEP7 = dataEmp.ovs_ep7;
                        var idExisteEnEP7 = false;
                        var idExisteEnExcluir = false;
                        
                        // Verificar en ordenesEP7
                        if (ordenesEP7 && typeof ordenesEP7 === 'string' && ordenesEP7.trim() !== '') {
                            var ordenesArrayEP7 = ordenesEP7.split(',');
                            idExisteEnEP7 = ordenesArrayEP7.indexOf(id.toString()) !== -1;
                        }
                        
                        // Verificar en ordenesAExcluir
                        if (ordenesAExcluir && typeof ordenesAExcluir === 'string' && ordenesAExcluir.trim() !== '') {
                            var ordenesArrayExcluir = ordenesAExcluir.split(',');
                            idExisteEnExcluir = ordenesArrayExcluir.indexOf(id.toString()) !== -1;
                        }
                        
                        log.debug('idExisteEnEP7', idExisteEnEP7 + ' para ID: ' + id);
                        log.debug('idExisteEnExcluir', idExisteEnExcluir + ' para ID: ' + id);
                        log.debug('ordenesEP7', ordenesEP7);
                        log.debug('ordenesAExcluir', ordenesAExcluir);

                        if (idExisteEnExcluir) {
                            // Orden completamente excluida - no se agrega al array data
                            log.debug('orden completamente excluida - está en ordenesAExcluir', id);
                        } else if (idExisteEnEP7) {
                            log.debug('no comisiona esta venta 2 - ID existe en EP7',id)
                            tm = 'EP_tm7'
                            var pedido = { idSO:id,programa:tm} 
                            data.push(pedido)
                        } else {
                            tm = 'Regular'
                            var pedido = { idSO:id,programa:tm} 
                            data.push(pedido)
                            ventasNo ++
                        }
                    }

                } 
            }
                
                
                //compConfigDetails[tipo de cofiguracion][etiqueta del esquema][No de ventas][etiqueta de la compensacion monto]
                var montoProductividad= compConfigDetails[1]['esquemaVentasPresentadora'][ventasNo]['bonoProductividad']
    
            
            //log.debug('montoProductividad', montoProductividad)
            return {monto:montoProductividad, data:data} 
        }catch(e){
            log.error('Error bono productividad', e)
            return false
        }
      
    }
    
    function bonoXmasDos(
        dataEmp,
        reclutasEquipo,
        thisPeriodSO,
        ventasEmp,
        historicoSO,
        allPresentadoras,
        dHistorico,
        integrantesEquipo,
        reclutas,
        listaReclutas,
        permitirCincoMasDos,
        inicioPeriodo,
        finPeriodo
    ){
        try{
            if (permitirCincoMasDos === undefined || permitirCincoMasDos === null) {
                permitirCincoMasDos = true;
            }
/*El bono considera a las lideres con 3 o mas ventas propias y que tengan dos presentadoras activas(que son reclutas y parte del equipo
y que han echo su primera venta dentro de sus primeron 30 dias despues de su contratacion) o bien una presentadora activa y una miembro 
del equipo aunque esta ultima no haya sido reclutada por la lider*/
/*Ajuste el 31 de julio para considerar solo las reclutas sean o no parte del equipo, se considera una recluta del lider de equipo y 
una rcluta de algun miembro del equipo*/
            var lider= dataEmp.internalid
            var salesOrders={}
            var salesOrdersEq={}
            var preActivas=''
            var equipoActivas=''
            var monto32 = 0
            var monto52 = 0
            var data1=[]
            var data2=[]
            var bonoLogrado = false//creado para validar si ya se logro el bono con solo reclutas del lider no recorrer las reclutas del equipo
            var dIniP = inicioPeriodo ? jtlNormalizarFechaPeriodo(inicioPeriodo) : null;
            var dFinP = finPeriodo ? jtlNormalizarFechaPeriodo(finPeriodo) : null;
            var usarReglaAltaYVentaEnMismoPeriodo = !!(dIniP && dFinP);
            // Ventas propias válidas para X+2: excluir TM Ganada y cancelación (por tipo=16 u otro_fin=4)
            var ventasEmpValidas = 0;
            var diagLider = {
                liderId: String(lider),
                ventasEmpTotal: ventasEmp ? Object.keys(ventasEmp).length : 0,
                ventasEmpValidas: 0,
                excluidas: { tmGanada: 0, cancelacion: 0, otras: 0 },
                muestra: [],
                periodo: usarReglaAltaYVentaEnMismoPeriodo ? { inicio: String(dIniP), fin: String(dFinP) } : null,
                reglaReclutaActiva:
                    usarReglaAltaYVentaEnMismoPeriodo
                        ? 'alta dentro del periodo comercial y venta dentro del mismo periodo; además venta >= alta y <= alta+30 (y <= objetivo_1)'
                        : 'legado: valiDate > dHistorico, sin histórico, venta <= objetivo_1 (y no TM Ganada/cancelación)'
            };
            if (ventasEmp) {
                for (var ve in ventasEmp) {
                    if (!ventasEmp.hasOwnProperty(ve)) {
                        continue;
                    }
                    var idSOV = ventasEmp[ve];
                    var keysV = Object.keys(idSOV);
                    if (keysV.length === 0) {
                        continue;
                    }
                    var rowV = idSOV[keysV[0]];
                    var tv = rowV.custbody_tipo_venta;
                    var of = rowV.custbody_otro_financiamiento;
                    var esTm =
                        tv === 'TM Ganada' || (esTipoVentaTmGanadaValor(tv) && !esTipoVentaTmPagadaValor(tv));
                    var esCan = esVentaCancelacionValor(tv, of);
                    if (diagLider.muestra.length < 15) {
                        diagLider.muestra.push({
                            internalid: String(rowV.internalid),
                            trandate: rowV.trandate,
                            tipoVenta: tv,
                            otroFin: of,
                            esTmGanada: !!esTm,
                            esCancelacion: !!esCan
                        });
                    }
                    if (esTm || esCan) {
                        if (esTm) {
                            diagLider.excluidas.tmGanada++;
                        } else if (esCan) {
                            diagLider.excluidas.cancelacion++;
                        } else {
                            diagLider.excluidas.otras++;
                        }
                        continue;
                    }
                    ventasEmpValidas++;
                }
            }
            diagLider.ventasEmpValidas = ventasEmpValidas;
            // (Logs detallados siguen existiendo, pero el resumen es el principal para depuración rápida)
            // try { log.audit({ title: '[Bono 3+2 líder] diagnóstico ventas propias', details: JSON.stringify(diagLider) }); } catch (ignoreDiagLider) {}
            if (reclutas){//si esta lider tiene reclutas obtenemos su fecha de contratacion o de reactivacion
                var diagReclutasDirectas = [];
                reclutas.forEach(function(i,index) {
                
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
                    var limite30 = null;
                    if (valiDate && !isNaN(valiDate.getTime())) {
                        limite30 = new Date(valiDate.getTime());
                        limite30.setDate(limite30.getDate() + 30);
                    }
                    var dObj = fechaObjetivo ? jtlNormalizarFechaPeriodo(fechaObjetivo) : null;
                    var diagRec = {
                        reclutaId: String(i),
                        alta: reactivacion ? reactivacion : hiredate,
                        fechaObjetivo: fechaObjetivo,
                        pasaAltaVsHistorico: valiDate ? (valiDate > dHistorico) : null,
                        descartadaPorHistorico: false,
                        ventasPeriodoTotal: 0,
                        ventasQueCuentan: 0,
                        primeraQueCuenta: null,
                        regla: usarReglaAltaYVentaEnMismoPeriodo ? 'altaEnPeriodo && ventaEnPeriodo && venta>=alta && venta<=alta+30 && venta<=objetivo' : 'legado'
                    };
                    
                    var altaValida = false;
                    if (usarReglaAltaYVentaEnMismoPeriodo) {
                        altaValida = !!(valiDate && valiDate >= dIniP && valiDate <= dFinP);
                    } else {
                        altaValida = !!(valiDate && valiDate > dHistorico);
                    }

                    if(altaValida){//si esa fecha es mayor que la fecha del historico / o cae en el periodo (nueva regla)
                        if(historicoSO.hasOwnProperty(i)){//si hay ventas en el historico queda descartado
                            diagRec.descartadaPorHistorico = true;
                        }else{//si no, validamos si tienen ventas en este periodo
                            var ventas = thisPeriodSO[i]//Ventas del integrante del equipo
                            //log.debug('ventas',ventas)
                            for(n in ventas){
                                diagRec.ventasPeriodoTotal++;
                                var key = Object.keys(ventas[n])
                                //log.debug('key venta n de la recluta '+i,key)
                                var fechaSO =ventas[n][key]['trandate']
                                var recSO=ventas[n][key]['salesrep']
                                var docNum =ventas[n][key]['tranid']
                                var tipoVenta = ventas[n][key]['custbody_tipo_venta']
                                var otroFin = ventas[n][key]['custbody_otro_financiamiento']
                                var dtSO = jtlNormalizarFechaPeriodo(fechaSO);
                                var okVenta = true;
                                if (!dtSO || !valiDate) {
                                    okVenta = false;
                                }
                                // Regla nueva: venta dentro del mismo periodo comercial y dentro de alta..alta+30
                                if (usarReglaAltaYVentaEnMismoPeriodo) {
                                    if (!(dtSO >= dIniP && dtSO <= dFinP)) {
                                        okVenta = false;
                                    }
                                    if (!(dtSO >= valiDate)) {
                                        okVenta = false;
                                    }
                                    if (limite30 && !(dtSO <= limite30)) {
                                        okVenta = false;
                                    }
                                } else {
                                    // Legado: solo valida <= objetivo
                                }
                                // Siempre: debe cumplir objetivo_1 si existe
                                if (dObj && !(dtSO <= dObj)) {
                                    okVenta = false;
                                }
                                if (
                                    (tipoVenta === 'TM Ganada' ||
                                        (esTipoVentaTmGanadaValor(tipoVenta) && !esTipoVentaTmPagadaValor(tipoVenta))) ||
                                    esVentaCancelacionValor(tipoVenta, otroFin)
                                ) {
                                    okVenta = false;
                                }
                                if(okVenta){
                                    //log.debug('SO dentro de la fecha objetivo',key) 
                                    var pedido = { idSO:key[0],docNum:docNum,salesRep:recSO}
                                        data1.push(pedido)
                                    diagRec.ventasQueCuentan++;
                                    if (!diagRec.primeraQueCuenta) {
                                        diagRec.primeraQueCuenta = { internalid: String(key[0]), docNum: docNum, trandate: fechaSO, tipoVenta: tipoVenta };
                                    }
                                    if(salesOrders.hasOwnProperty(recSO)){

                                        salesOrders[recSO].push(key)
                                    }else{
                                        salesOrders[recSO]=(key)
                                    }
                                }
                            }   
                        }
                    }
                    if (diagReclutasDirectas.length < 25) {
                        diagReclutasDirectas.push(diagRec);
                    }
                })
                // try { log.audit({ title: '[Bono 3+2 líder] diagnóstico reclutas directas (activación)', details: JSON.stringify({ liderId: String(lider), muestra: diagReclutasDirectas }) }); } catch (ignoreDiagRec) {}
                //log.debug('salesOrders',salesOrders)
                preActivas= Object.keys(salesOrders)// recluta activas
                
                //log.debug('preActivas',preActivas)
                if(ventasEmp){//considera 2 solo reclutas
                    // 3+2: 3 o más ventas personales y 2 reclutas activas. Si permitirCincoMasDos está activo y hay 5+ ventas, aplica 5+2.
                    if(permitirCincoMasDos && ventasEmpValidas>4 && preActivas.length >= 2){
                        bonoLogrado = true
                        monto32 = 0
                        monto52 = 8000
                    } else if(ventasEmpValidas> 2 && preActivas.length >= 2){
                        bonoLogrado = true
                        monto32 = 5000
                        monto52 = 0
                    }
                }
               
            }
            if (integrantesEquipo){
                var diagReclutasEquipo = [];
                // Siempre recorremos reclutas del equipo para llenar detalle (data2/equipoActivas),
                // aunque el bono ya se haya logrado con reclutas directas. El monto NO se modifica si bonoLogrado ya es true.
                   integrantesEquipo.forEach(function(i,index) {//recorremos cada integrante del equipo y obtenemos sus reclutas
                        var reclutasXintegranteEquipo = listaReclutas[i] 
                        for (y in reclutasXintegranteEquipo){//de cada recluta obtenemos su fecha de contratacion o reactivacion, fin objetivo 1 y reclutador
                            //log.debug('reclutasXintegranteEquipo y', reclutasXintegranteEquipo[y]) 
                            var hiredate=allPresentadoras[reclutasXintegranteEquipo[y]]['hiredate']
                            var reactivacion=allPresentadoras[reclutasXintegranteEquipo[y]]['fechaReactivacion']
                            var fechaObjetivo = allPresentadoras[reclutasXintegranteEquipo[y]]['objetivo_1']
                            var reclutador = allPresentadoras[reclutasXintegranteEquipo[y]]['emp_reclutadora']
                            var valiDateEq
                            if(reactivacion){
                                valiDateEq=Utils.stringToDate(reactivacion)
                            }else{
                                valiDateEq=Utils.stringToDate(hiredate)
                            }
                            var limite30Eq = null;
                            if (valiDateEq && !isNaN(valiDateEq.getTime())) {
                                limite30Eq = new Date(valiDateEq.getTime());
                                limite30Eq.setDate(limite30Eq.getDate() + 30);
                            }
                            var dObjEq = fechaObjetivo ? jtlNormalizarFechaPeriodo(fechaObjetivo) : null;
                            var diagRecEq = {
                                integranteEquipoId: String(i),
                                reclutaId: String(reclutasXintegranteEquipo[y]),
                                reclutadorId: String(reclutador),
                                alta: reactivacion ? reactivacion : hiredate,
                                fechaObjetivo: fechaObjetivo,
                                pasaAltaVsHistorico: valiDateEq ? (valiDateEq > dHistorico) : null,
                                descartadaPorHistorico: false,
                                ventasPeriodoTotal: 0,
                                ventasQueCuentan: 0,
                                primeraQueCuenta: null,
                                regla: usarReglaAltaYVentaEnMismoPeriodo ? 'altaEnPeriodo && ventaEnPeriodo && venta>=alta && venta<=alta+30 && venta<=objetivo' : 'legado'
                            };
                            
                            var altaValidaEq = false;
                            if (usarReglaAltaYVentaEnMismoPeriodo) {
                                altaValidaEq = !!(valiDateEq && valiDateEq >= dIniP && valiDateEq <= dFinP);
                            } else {
                                altaValidaEq = !!(valiDateEq && valiDateEq > dHistorico);
                            }

                            if(altaValidaEq){//si esa fecha es mayor que la fecha del historico / o cae en el periodo (nueva regla)
                                if(historicoSO.hasOwnProperty(reclutasXintegranteEquipo[y])){//si hay ventas en el historico queda descartado
                                    //log.debug('ventas historico de '+i,historicoSO[i] )
                                    diagRecEq.descartadaPorHistorico = true;
                                }else{//si no, validamos si tienen ventas en este periodo
                                    var ventasEq = thisPeriodSO[reclutasXintegranteEquipo[y]]
                                    
                                    for(n in ventasEq){
                                        diagRecEq.ventasPeriodoTotal++;
                                        var key = Object.keys(ventasEq[n])
                                        //log.debug('key eq de l recluta '+i,key)
                                        var fechaSO =ventasEq[n][key]['trandate']
                                        var recSO=ventasEq[n][key]['salesrep']
                                        var docNum =ventasEq[n][key]['tranid']
                                        var tipoVenta = ventasEq[n][key]['custbody_tipo_venta']
                                        var otroFin = ventasEq[n][key]['custbody_otro_financiamiento']
                                        //log.debug('fechaObjetivo eq',Utils.stringToDate(fechaObjetivo))
                                        //log.debug('fechaSO eq',Utils.stringToDate(fechaSO))
                                        var dtSO = jtlNormalizarFechaPeriodo(fechaSO);
                                        var okVentaEq = true;
                                        if (!dtSO || !valiDateEq) {
                                            okVentaEq = false;
                                        }
                                        if (usarReglaAltaYVentaEnMismoPeriodo) {
                                            if (!(dtSO >= dIniP && dtSO <= dFinP)) {
                                                okVentaEq = false;
                                            }
                                            if (!(dtSO >= valiDateEq)) {
                                                okVentaEq = false;
                                            }
                                            if (limite30Eq && !(dtSO <= limite30Eq)) {
                                                okVentaEq = false;
                                            }
                                        } else {
                                            // Legado: solo valida <= objetivo
                                        }
                                        if (dObjEq && !(dtSO <= dObjEq)) {
                                            okVentaEq = false;
                                        }
                                        if (
                                            (tipoVenta === 'TM Ganada' ||
                                                (esTipoVentaTmGanadaValor(tipoVenta) && !esTipoVentaTmPagadaValor(tipoVenta))) ||
                                            esVentaCancelacionValor(tipoVenta, otroFin)
                                        ) {
                                            okVentaEq = false;
                                        }
                                        if(okVentaEq){
                                            //log.debug('SO dentro de la fecha objetivo eq',key) 
                                            var pedido = { idSO:key[0],docNum:docNum,salesRep:recSO,rec:reclutador}
                                            data2.push(pedido)
                                            diagRecEq.ventasQueCuentan++;
                                            if (!diagRecEq.primeraQueCuenta) {
                                                diagRecEq.primeraQueCuenta = { internalid: String(key[0]), docNum: docNum, trandate: fechaSO, tipoVenta: tipoVenta };
                                            }
                                            if(salesOrdersEq.hasOwnProperty(recSO)){
                                                salesOrdersEq[recSO].push(key)
                                            }else{
                                                salesOrdersEq[recSO]=(key)
                                            }
                                        }
                                    }     
                                }
                            } 
                            if (diagReclutasEquipo.length < 25) {
                                diagReclutasEquipo.push(diagRecEq);
                            }
                        }
                        
                    })
                    // try { log.audit({ title: '[Bono 3+2 líder] diagnóstico reclutas de equipo (activación)', details: JSON.stringify({ liderId: String(lider), muestra: diagReclutasEquipo }) }); } catch (ignoreDiagEq) {}
                    //log.debug('salesOrdersEq',salesOrdersEq)
                    equipoActivas=Object.keys(salesOrdersEq)//reclutas de algun miembro del equipo activas
                    // Solo si aún NO se logró el bono con reclutas directas, evaluamos esta vía alternativa para asignar monto.
                    if(!bonoLogrado && ventasEmp){//considera 1 recluta del lider y una recluta de algun miembro del equipo
                        if(permitirCincoMasDos && ventasEmpValidas>4 && preActivas.length >= 1 && equipoActivas.length >= 1){
                            bonoLogrado = true
                            monto32 = 0
                            monto52 = 8000
                        } else if(ventasEmpValidas> 2 && preActivas.length >= 1 && equipoActivas.length >= 1){
                            bonoLogrado = true
                            monto32 = 5000
                            monto52 = 0
                        }
                    }
                }   
               
            // Resumen reutilizable: por qué gana o no gana 3+2 / 5+2
            var via = '';
            var razonNo = '';
            if (monto52 > 0) {
                via = (preActivas.length >= 2) ? '5+2 con 2 reclutas directas' : '5+2 con 1 directa + 1 equipo';
            } else if (monto32 > 0) {
                via = (preActivas.length >= 2) ? '3+2 con 2 reclutas directas' : '3+2 con 1 directa + 1 equipo';
            } else {
                if (ventasEmpValidas <= 2) {
                    razonNo = 'NO_GANA: faltan ventas personales (requiere >=3)';
                } else if (!(preActivas.length >= 2 || (preActivas.length >= 1 && equipoActivas.length >= 1))) {
                    razonNo =
                        'NO_GANA: faltan reclutas activas (requiere 2 directas o 1 directa + 1 equipo) ' +
                        '| directasActivas=' +
                        preActivas.length +
                        ' equipoActivas=' +
                        equipoActivas.length;
                } else {
                    razonNo = 'NO_GANA: criterios no alcanzan monto (revisar permitirCincoMasDos/ventasEmpValidas)';
                }
            }

            try {
                log.audit({
                    title: '[Bono 3+2 líder] resumen',
                    details: JSON.stringify({
                        liderId: String(lider),
                        periodo: usarReglaAltaYVentaEnMismoPeriodo ? { inicio: String(dIniP), fin: String(dFinP) } : null,
                        ventasPersonalesValidas: ventasEmpValidas,
                        reclutasDirectasActivas: preActivas,
                        reclutasEquipoActivas: equipoActivas,
                        monto32: monto32,
                        monto52: monto52,
                        via: via,
                        razonNoGana: razonNo
                    })
                });
            } catch (ignoreResumen) {}

            return {
                monto52: monto52,
                monto32: monto32,
                data: data1,
                equipo: data2,
                resumen: {
                    ventasPersonalesValidas: ventasEmpValidas,
                    reclutasDirectasActivas: preActivas,
                    reclutasEquipoActivas: equipoActivas,
                    monto32: monto32,
                    monto52: monto52,
                    via: via,
                    razonNoGana: razonNo
                }
            } 
        }catch(e){
            log.debug('error X+2',e)
        }    
        
    }
   /*function bonoSupercomision(integrantesEquipo,historicoSO,thisPeriodSO,allPresentadoras,dHistorico){
        try{
            var ventasNo = 0
            var montoSC = 0
            var ventasPeriodo =[]
            var data = []
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
                    var dObjetivo2 
                
                    var dcontratacion
                    if(reactivacion == ''){
                        dcontratacion = Utils.stringToDate(hiredate)
                        
                        dObjetivo2 = Utils.stringToDate(allPresentadoras[i]['objetivo_2'])
                        dObjetivo2.setDate(dObjetivo2.getDate() + 2);
                    }else{
                      
                        dcontratacion = Utils.stringToDate(reactivacion)
                        
                        dObjetivo2 = Utils.stringToDate(allPresentadoras[i]['obj_2_reactivacion'])
                        dObjetivo2.setDate(dObjetivo2.getDate() + 2);
                    }
                   
                    if(dcontratacion > dHistorico){
                        //log.debug('entra if dhist')
                        var ventasHistorico
                        if(historicoSO[i]){
                            //log.debug('entra if ventas hist',historicoSO[i])
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
                                
                        
                                if(tipoVenta  != 'TM Ganada' && Utils.stringToDate(dateSO)<=dObjetivo2){
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
                        var salesrep = ordenesSupercomisionTotal[x][y][keys]['salesrep']
                        var docNum = ordenesSupercomisionTotal[x][y][keys]['tranid']
                        var pedido= {id:keys[0],docNum:docNum,SalesRep:salesrep }
                        //log.debug('keys',keys)
                        ventasPeriodo.push(keys[0])
                        data.push(pedido)
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
            //log.debug('data',data)
            //log.debug('ventasPeriodo',ventasPeriodo)
            //log.debug('ventasNo',ventasNo)
            return  {monto:montoSC, data:data, ventasNo:ventasNo};  
        }catch(e){
            log.debug('error Supercomision', e)
            return false
        }
         
    }*/
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
                        
                        
                        if(dcontratacion >= dHistorico && ventasReclutaTP){//Si su contratacion/Reactivacion es anterios a 3 meses se asume que ya se pagó su reclutamiento
                            
                            var salesReclutaTP =[]
                            var noComisiona = 6
                            if(confRec == 15){
                                var noComisiona = 3
                            }else if(confRec == 11 || confRec == 12 || confRec == 13 || confRec == 14){
                                var noComisiona = 4
                            }
                            //log.debug('confRec',confRec)
                            //log.debug('noComisiona',noComisiona)
                            //log.debug('ventasReclutaH',ventasReclutaH)
                            var cont = 0
                            var faltantesRec = 0
                            if( ventasReclutaH ){  
                                cont = ventasReclutaH.length 
                                faltantesRec = noComisiona - ventasReclutaH.length 
                            }else{
                                faltantesRec = noComisiona
                            }
                            //log.debug('faltantesRec',faltantesRec)
                            //log.debug('cont',cont)
                            if(faltantesRec > 0){ 
                                for(j in ventasReclutaTP){//Se recorren las Ordenes de cada recluta del Presentador
                                    key = Object.keys(ventasReclutaTP[j])
                                    var tipoVenta = ventasReclutaTP[j][key]['custbody_tipo_venta']
                                    var fechaSO = ventasReclutaTP[j][key]['trandate']
                                    var id = ventasReclutaTP[j][key]['internalid']
                                    var docNum = ventasReclutaTP[j][key]['tranid']
                                    
                                    fechaSO = Utils.stringToDate(fechaSO)
                                    if(tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventasReclutaTP[j][key]['custbody_otro_financiamiento']) && fechaSO <= fechaObjetivo){
                                        //log.debug('tiene que entraraqui')
                                        cont ++ 
                                        var pedido = { idSO:id,docNum:docNum, noVenta:cont} 
                                        montoInd = montoInd + Math.abs(compConfigDetails[confRec]['esquemaVentasReclutamiento'][cont]['compensacion'])
                                        
                                        if( Math.abs(compConfigDetails[confRec]['esquemaVentasReclutamiento'][cont]['compensacion']) > 0 ){
                                            salesReclutaTP.push(pedido)
                                            salesReclutas[i] = salesReclutaTP
                                        }
                                        
                                        if(cont >= noComisiona){
                                            break
                                        }
                                    }
                                    
                                }
                                
                                bono_reclutadora += montoInd
                            }

                        }
                        
                        
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
                montoEntrega=parseInt(ventasNo,10)*500
                return {monto:montoEntrega, data:dataEnt}                        
            }else if (cust_entrega == 2){
                return false
            }
        }catch(e){
            log.debug('error entrega',e)
        }

    }
    function bonoVentaPropia(dataEmp,empSOThisPeriod,compConfigDetails,listIdsOdv){
        try{
            if(empSOThisPeriod){
                var ventasNo = 0
                var ventas = empSOThisPeriod
                log.debug('ventas',ventas)
                var data = []
                var ordenesAExcluir = dataEmp.custentity_ordenes_a_excluir
                log.debug('ordenesAExcluir antes de todo el codigo',ordenesAExcluir)
                var epTm7 = dataEmp.epTm7
                log.debug('epTm7',epTm7)

                
                var epTm7_inicio = dataEmp.epTm7_inicio
                var fechatm7_ganada = dataEmp.fechatm7_ganada
                var soid_Ganadora = dataEmp.so_ganotm7
               
                var fecha_termino
                if(fechatm7_ganada == ''){
                    fecha_termino = dataEmp.epTm7_fin
                }  else{
                    fecha_termino = fechatm7_ganada
                }
                var tm 
                if(epTm7  && epTm7_inicio) {
                    // Lógica original de EP7 - mantener intacta
                    epTm7_inicio = Utils.stringToDate(epTm7_inicio)
                    log.debug('epTm7_inicio',epTm7_inicio)
                    fecha_termino = Utils.stringToDate(fecha_termino)
                    log.debug('fecha_termino',fecha_termino)
                    for (i in ventas){
                        var ventasData= Object.keys(ventas[i])
                        //thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
                        var comisionables = ventas[i][ventasData]['custbody_vw_comission_status']
                        var tipoVenta = ventas[i][ventasData]['custbody_tipo_venta']
                        var fechaSO = ventas[i][ventasData]['trandate']
                        var id = ventas[i][ventasData]['internalid']
                        var tm
                        fechaSO = Utils.stringToDate(fechaSO)
                        log.debug('fechaSO',fechaSO)
                        //log.debug('comisionables',comisionables)
                        if(comisionables != 'No Comisionable' && tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventas[i][ventasData]['custbody_otro_financiamiento'])){
                                                        
                            // Validar si el ID existe en ordenesEP7 o en ordenesAExcluir
                            var ordenesEP7 = dataEmp.ovs_ep7;
                            var idExisteEnEP7 = false;
                            var idExisteEnExcluir = false;
                            
                            // Verificar en ordenesEP7
                            if (ordenesEP7 && typeof ordenesEP7 === 'string' && ordenesEP7.trim() !== '') {
                                var ordenesArrayEP7 = ordenesEP7.split(',');
                                idExisteEnEP7 = ordenesArrayEP7.indexOf(id.toString()) !== -1;
                            }
                            
                            // Verificar en ordenesAExcluir
                            if (ordenesAExcluir && typeof ordenesAExcluir === 'string' && ordenesAExcluir.trim() !== '') {
                                var ordenesArrayExcluir = ordenesAExcluir.split(',');
                                idExisteEnExcluir = ordenesArrayExcluir.indexOf(id.toString()) !== -1;
                            }
                            
                            log.debug('idExisteEnEP7', idExisteEnEP7 + ' para ID: ' + id);
                            log.debug('idExisteEnExcluir', idExisteEnExcluir + ' para ID: ' + id);
                            log.debug('ordenesEP7', ordenesEP7);
                            log.debug('ordenesAExcluir', ordenesAExcluir);
    
                            if (idExisteEnExcluir) {
                                // Orden completamente excluida - no se agrega al array data
                                log.debug('orden completamente excluida - está en ordenesAExcluir', id);
                            } else if (idExisteEnEP7) {
                                log.debug('no comisiona esta venta 2 - ID existe en EP7',id)
                                tm = 'EP_tm7'
                                var pedido = { idSO:id,programa:tm} 
                                data.push(pedido)
                            } else {
                                tm = 'Regular'
                                var pedido = { idSO:id,programa:tm} 
                                data.push(pedido)
                                ventasNo ++
                            }
                        }
                        
                    }
                } else{
                    for (i in ventas){
                        var ventasData= Object.keys(ventas[i])
                        //thisPeriodSO['id presentador'][indice]['id pedido']['etiqueta']
                        var comisionables = ventas[i][ventasData]['custbody_vw_comission_status']
                        var tipoVenta = ventas[i][ventasData]['custbody_tipo_venta']
                        var id = ventas[i][ventasData]['internalid']
                        //log.debug('comisionables',comisionables)
                        if(comisionables != 'No Comisionable' && tipoVenta != 'TM Ganada' && !esVentaCancelacionValor(tipoVenta, ventas[i][ventasData]['custbody_otro_financiamiento'])){
                                                        
                            // Validar si el ID existe en ordenesEP7 o en ordenesAExcluir
                            var ordenesEP7 = dataEmp.ovs_ep7;
                            var idExisteEnEP7 = false;
                            var idExisteEnExcluir = false;
                            
                            // Verificar en ordenesEP7
                            if (ordenesEP7 && typeof ordenesEP7 === 'string' && ordenesEP7.trim() !== '') {
                                var ordenesArrayEP7 = ordenesEP7.split(',');
                                idExisteEnEP7 = ordenesArrayEP7.indexOf(id.toString()) !== -1;
                            }
                            
                            // Verificar en ordenesAExcluir
                            if (ordenesAExcluir && typeof ordenesAExcluir === 'string' && ordenesAExcluir.trim() !== '') {
                                var ordenesArrayExcluir = ordenesAExcluir.split(',');
                                idExisteEnExcluir = ordenesArrayExcluir.indexOf(id.toString()) !== -1;
                            }
                            
                            log.debug('idExisteEnEP7', idExisteEnEP7 + ' para ID: ' + id);
                            log.debug('idExisteEnExcluir', idExisteEnExcluir + ' para ID: ' + id);
                            log.debug('ordenesEP7', ordenesEP7);
                            log.debug('ordenesAExcluir', ordenesAExcluir);
    
                            if (idExisteEnExcluir) {
                                // Orden completamente excluida - no se agrega al array data
                                log.debug('orden completamente excluida - está en ordenesAExcluir', id);
                            } else if (idExisteEnEP7) {
                                log.debug('no comisiona esta venta 2 - ID existe en EP7',id)
                                tm = 'EP_tm7'
                                var pedido = { idSO:id,programa:tm} 
                                data.push(pedido)
                            } else {
                                tm = 'Regular'
                                var pedido = { idSO:id,programa:tm} 
                                data.push(pedido)
                                ventasNo ++
                            }
                        }

                    } 
                }
                
                
                //compConfigDetails[tipo de cofiguracion][etiqueta del esquema][No de ventas][etiqueta de la compensacion monto]
                var montoVentasPre= compConfigDetails[1]['esquemaVentasPresentadora'][ventasNo]['compensacion']
    /*
    log.debug('montoVentasPre', montoVentasPre)
    data: Arreglo de Internal id de Sales Order del EMP
    */

                return {
                    monto: montoVentasPre, 
                    data: data,
                    
                }
            }
            return false
        }catch(e){
            log.debug('error venta propia',e)
            return false
        }
    }

    /** Logs del flujo bono JTL (sin filtro por empleado: el reporte ya se acota al caso a validar). */
    function jtlLogBono(empId, paso, detalle) {
        var msg = detalle;
        try {
            if (detalle !== null && typeof detalle === 'object') {
                msg = JSON.stringify(detalle);
            }
        } catch (ignore) {
            msg = String(detalle);
        }
        log.audit({
            title: '[Bono JTL] ' + paso,
            details: msg || ''
        });
    }

    /** Monitoreo bono programa 2+1 ($1,500). */
    function jtlLog2mas1(empId, paso, detalle) {
        var msg = detalle;
        try {
            if (detalle !== null && typeof detalle === 'object') {
                msg = JSON.stringify(detalle);
            }
        } catch (ignore) {
            msg = String(detalle);
        }
        log.audit({
            title: '[Bono JTL 2+1] ' + paso,
            details: (empId != null ? 'empleado: ' + empId + ' | ' : '') + (msg || '')
        });
    }

    /** Monitoreo bono maestría 3×2+1 ($4,500). */
    function jtlLogMaestria(empId, paso, detalle) {
        var msg = detalle;
        try {
            if (detalle !== null && typeof detalle === 'object') {
                msg = JSON.stringify(detalle);
            }
        } catch (ignore) {
            msg = String(detalle);
        }
        log.audit({
            title: '[Bono JTL Maestría] ' + paso,
            details: (empId != null ? 'empleado: ' + empId + ' | ' : '') + (msg || '')
        });
    }

    /** Monitoreo Maestría LE 3×(3+2) ($15,000): logs estilo “resumen”. */
    function leLogMaestria(liderId, paso, detalle) {
        var msg = detalle;
        try {
            if (detalle !== null && typeof detalle === 'object') {
                msg = JSON.stringify(detalle);
            }
        } catch (ignore) {
            msg = String(detalle);
        }
        log.audit({
            title: '[Bono Maestría LE] ' + paso,
            details: (liderId != null ? 'lider: ' + liderId + ' | ' : '') + (msg || '')
        });
    }

    /**
     * Tipo de venta TM Ganada: texto o ID de lista.
     * Nota operativa (Vorwerk): en las búsquedas TMSB de este script, `custbody_tipo_venta = 19` se usa para **TM Pagada**
     * (ver filtros de `searchSalesOrders`), mientras que `1` aparece junto con `2` para ventas TM / TM Ganada según el filtro.
     * Por eso **no** se debe tratar `19` como TM Ganada en exclusiones generales.
     */
    function esTipoVentaTmGanadaValor(tipoVenta) {
        if (tipoVenta === 'TM Ganada') {
            return true;
        }
        var t = tipoVenta != null ? String(tipoVenta).trim() : '';
        // IDs observados en filtros TMSB del script: TM Ganada incluye `1` (no confundir con `19` = TM Pagada)
        return t === '1';
    }

    /** TM Pagada: texto o ID de lista (19 en filtros TMSB de este script). */
    function esTipoVentaTmPagadaValor(tipoVenta) {
        if (tipoVenta === 'TM Pagada') {
            return true;
        }
        var t = tipoVenta != null ? String(tipoVenta).trim().toLowerCase() : '';
        if (t === '19') {
            return true;
        }
        if (t.indexOf('tm') >= 0 && t.indexOf('pagad') >= 0) {
            return true;
        }
        return false;
    }

    /**
     * Venta cancelación: por tipo de venta (ID 16) o por otro financiamiento (ID 4).
     * Cualquiera de los dos marca cancelada y NO debe contar para ningún bono.
     */
    function esVentaCancelacionValor(tipoVenta, otroFinanciamiento) {
        // Nota: en búsquedas/workbooks algunos campos pueden venir como ID ('16'/'4') o como texto ('CANCELADO', 'Cancelación', etc.).
        // Se normaliza a minúsculas y se detectan ambas variantes.
        var t = tipoVenta != null ? String(tipoVenta).trim().toLowerCase() : '';
        var o = otroFinanciamiento != null ? String(otroFinanciamiento).trim().toLowerCase() : '';

        if (t === '16' || o === '4') {
            return true;
        }

        // Variantes por texto (SuiteQL/workbook puede traer nombre en vez de ID)
        if (t.indexOf('cancel') >= 0 || o.indexOf('cancel') >= 0) {
            return true;
        }

        return false;
    }

    /** Estado de comisión "No Comisionable" (texto; si en cuenta usan ID de lista, ampliar aquí). */
    function esEstadoNoComisionableValor(comisionables) {
        return comisionables === 'No Comisionable';
    }

    /** Motivos por los que una ODV no es venta personal contable JTL (para logs Pool Talent / auditoría). */
    function motivosExclusionVentaContableJTL(dataEmp, row) {
        var m = [];
        var comisionables = row.custbody_vw_comission_status;
        var tipoVenta = row.custbody_tipo_venta;
        var otroFin = row.custbody_otro_financiamiento;
        var id = row.internalid;
        if (esEstadoNoComisionableValor(comisionables)) {
            m.push('noComisionable');
        }
        if (esTipoVentaTmGanadaValor(tipoVenta)) {
            m.push('tmGanada');
        }
        if (esVentaCancelacionValor(tipoVenta, otroFin)) {
            m.push('cancelacion');
        }
        var ordenesAExcluir = dataEmp.custentity_ordenes_a_excluir;
        if (ordenesAExcluir && typeof ordenesAExcluir === 'string' && ordenesAExcluir.trim() !== '') {
            var arrEx = ordenesAExcluir.split(',');
            var ex;
            for (ex = 0; ex < arrEx.length; ex++) {
                if (arrEx[ex].trim() === id.toString()) {
                    m.push('enCustentity_ordenes_a_excluir');
                    break;
                }
            }
        }
        var ordenesEP7 = dataEmp.ovs_ep7;
        if (ordenesEP7 && typeof ordenesEP7 === 'string' && ordenesEP7.trim() !== '') {
            var arrEP = ordenesEP7.split(',');
            var j;
            for (j = 0; j < arrEP.length; j++) {
                if (arrEP[j].trim() === id.toString()) {
                    m.push('enOvs_ep7');
                    break;
                }
            }
        }
        return m;
    }

    /**
     * Motivos por los que una ODV NO cuenta para Pool Talent.
     * Reglas solicitadas: contar aunque sea "No Comisionable"; descartar TM Ganada.
     * Importante: **TM Pagada cuenta** (incluye `custbody_tipo_venta = 19` / texto "TM Pagada").
     * Se mantienen exclusiones por EP7 / ordenes_a_excluir para respetar marcajes manuales del empleado.
     */
    function motivosExclusionVentaPoolTalent(dataEmp, row) {
        var m = [];
        var tipoVenta = row.custbody_tipo_venta;
        var otroFin = row.custbody_otro_financiamiento;
        var id = row.internalid;
        if (esTipoVentaTmGanadaValor(tipoVenta) && !esTipoVentaTmPagadaValor(tipoVenta)) {
            m.push('tmGanada');
        }
        if (esVentaCancelacionValor(tipoVenta, otroFin)) {
            m.push('cancelacion');
        }
        var ordenesAExcluir = dataEmp.custentity_ordenes_a_excluir;
        if (ordenesAExcluir && typeof ordenesAExcluir === 'string' && ordenesAExcluir.trim() !== '') {
            var arrEx = ordenesAExcluir.split(',');
            var ex;
            for (ex = 0; ex < arrEx.length; ex++) {
                if (arrEx[ex].trim() === id.toString()) {
                    m.push('enCustentity_ordenes_a_excluir');
                    break;
                }
            }
        }
        var ordenesEP7 = dataEmp.ovs_ep7;
        if (ordenesEP7 && typeof ordenesEP7 === 'string' && ordenesEP7.trim() !== '') {
            var arrEP = ordenesEP7.split(',');
            var j;
            for (j = 0; j < arrEP.length; j++) {
                if (arrEP[j].trim() === id.toString()) {
                    m.push('enOvs_ep7');
                    break;
                }
            }
        }
        return m;
    }

    function esVentaCuentaParaPoolTalent(dataEmp, row) {
        return motivosExclusionVentaPoolTalent(dataEmp, row).length === 0;
    }

    /**
     * Reglas para ACTIVACIÓN de recluta en bono 2+1:
     * - NO se bloquea por "No Comisionable" (la comisión la cobra la reclutadora, no la recluta)
     * - SÍ se descarta TM Ganada, Cancelación y exclusiones manuales (EP7 / ordenes_a_excluir)
     */
    function motivosExclusionVentaActivacion2mas1(dataEmp, row) {
        // Misma lógica que Pool Talent: cuenta No Comisionable, descarta TM Ganada/Cancelación y respeta exclusiones manuales.
        return motivosExclusionVentaPoolTalent(dataEmp, row);
    }

    function esVentaCuentaParaActivacion2mas1(dataEmp, row) {
        return motivosExclusionVentaActivacion2mas1(dataEmp, row).length === 0;
    }

    /**
     * Venta personal contable para reglas JTL (alineado a bonoVentaPropia: excluye No Comisionable, TM Ganada, EP7 y ordenes_a_excluir).
     */
    function esVentaPersonalContableJTL(dataEmp, row) {
        return motivosExclusionVentaContableJTL(dataEmp, row).length === 0;
    }

    function iterarVentasEmpleadoEnVentana(empId, historicoSO, thisPeriodSO, windowStart, windowEnd, callback) {
        var walk = function (arr) {
            if (!arr) {
                return;
            }
            var i;
            for (i = 0; i < arr.length; i++) {
                var idSO = arr[i];
                var keys = Object.keys(idSO);
                if (keys.length === 0) {
                    continue;
                }
                var row = idSO[keys[0]];
                var rawTd = row.trandate;
                var dt =
                    rawTd instanceof Date && !isNaN(rawTd.getTime())
                        ? new Date(rawTd.getTime())
                        : Utils.stringToDate(rawTd);
                if (!dt || dt < windowStart || dt > windowEnd) {
                    continue;
                }
                callback(row);
            }
        };
        walk(historicoSO[empId] || historicoSO[String(empId)]);
        walk(thisPeriodSO[empId] || thisPeriodSO[String(empId)]);
    }

    function contarVentasPersonalesVentanaJTL(dataEmp, empId, historicoSO, thisPeriodSO, windowStart, windowEnd) {
        var seen = {};
        var count = 0;
        iterarVentasEmpleadoEnVentana(empId, historicoSO, thisPeriodSO, windowStart, windowEnd, function (row) {
            if (!esVentaPersonalContableJTL(dataEmp, row)) {
                return;
            }
            var idStr = row.internalid.toString();
            if (seen[idStr]) {
                return;
            }
            seen[idStr] = true;
            count++;
        });
        return count;
    }

    /** Conteo de ventas para bono de nombramiento JTL: cuenta aunque sea No Comisionable; descarta TM Ganada (y EP7/ordenes a excluir). */
    function contarVentasPersonalesVentanaNombramientoJTL(dataEmp, empId, historicoSO, thisPeriodSO, windowStart, windowEnd) {
        var seen = {};
        var count = 0;
        iterarVentasEmpleadoEnVentana(empId, historicoSO, thisPeriodSO, windowStart, windowEnd, function (row) {
            if (!esVentaCuentaParaPoolTalent(dataEmp, row)) {
                return;
            }
            var idStr = row.internalid.toString();
            if (seen[idStr]) {
                return;
            }
            seen[idStr] = true;
            count++;
        });
        return count;
    }

    function reclutaActivoEnPrimeros90Dias(recruitData, historicoSO, thisPeriodSO) {
        if (!recruitData || !recruitData.hiredate) {
            return false;
        }
        var hire = Utils.stringToDate(recruitData.hiredate);
        var limite = new Date(hire.getTime());
        limite.setDate(limite.getDate() + 90);
        var activo = false;
        iterarVentasEmpleadoEnVentana(recruitData.internalid, historicoSO, thisPeriodSO, hire, limite, function (row) {
            var dt = Utils.stringToDate(row.trandate);
            if (dt >= hire && dt <= limite && esVentaPersonalContableJTL(recruitData, row)) {
                activo = true;
            }
        });
        return activo;
    }

    /** Activación recluta para bono de nombramiento JTL: basta una venta (aunque sea No Comisionable); descarta TM Ganada (y EP7/ordenes a excluir). */
    function reclutaActivoEnPrimeros90DiasNombramientoJTL(recruitData, historicoSO, thisPeriodSO) {
        if (!recruitData || !recruitData.hiredate) {
            return false;
        }
        var hire = Utils.stringToDate(recruitData.hiredate);
        var limite = new Date(hire.getTime());
        limite.setDate(limite.getDate() + 90);
        var activo = false;
        iterarVentasEmpleadoEnVentana(recruitData.internalid, historicoSO, thisPeriodSO, hire, limite, function (row) {
            var dt = Utils.stringToDate(row.trandate);
            if (dt >= hire && dt <= limite && esVentaCuentaParaPoolTalent(recruitData, row)) {
                activo = true;
            }
        });
        return activo;
    }

    function obtenerVentanaTresMesesComercialesPrevios(fechaNombramiento, todosPeriodos, empIdLog) {
        var sorted = [];
        var pid;
        for (pid in todosPeriodos) {
            if (todosPeriodos.hasOwnProperty(pid)) {
                sorted.push({
                    id: pid,
                    inicio: todosPeriodos[pid].inicio,
                    fin: todosPeriodos[pid].fin
                });
            }
        }
        sorted.sort(function (a, b) {
            return a.inicio - b.inicio;
        });
        var idx = -1;
        var i;
        for (i = 0; i < sorted.length; i++) {
            if (fechaNombramiento >= sorted[i].inicio && fechaNombramiento <= sorted[i].fin) {
                idx = i;
                break;
            }
        }
        // Ventana de 3 meses previos al nombramiento:
        // - INICIO: 3 meses naturales hacia atrás desde la fecha del nombramiento (misma fecha día/mes; hora 00:00)
        // - FIN: fecha del nombramiento (hora 23:59:59)
        // Nota: aunque el calendario comercial de Vorwerk puede no iniciar en el día 1 del mes, para esta regla se toma "3 meses atrás" por fecha.
        if (idx < 0) {
            jtlLogBono(empIdLog, 'ventana 3 meses: no aplicable', {
                indicePeriodoNombramiento: idx,
                periodosOrdenados: sorted.length,
                motivo:
                    idx < 0
                        ? 'fecha nombramiento fuera de cualquier periodo comercial'
                        : 'fecha inválida'
            });
            return null;
        }
        var finHastaNom = new Date(fechaNombramiento.getTime());
        finHastaNom.setHours(23, 59, 59, 999);
        var inicioTresMesesNaturales = new Date(fechaNombramiento.getTime());
        inicioTresMesesNaturales.setMonth(inicioTresMesesNaturales.getMonth() - 3);
        inicioTresMesesNaturales.setHours(0, 0, 0, 0);
        var vent = {
            inicio: inicioTresMesesNaturales,
            fin: finHastaNom,
            periodosIds: [sorted[Math.max(0, idx - 2)].id, sorted[Math.max(0, idx - 1)].id, sorted[idx].id]
        };
        jtlLogBono(empIdLog, 'ventana 3 meses: ok', {
            periodoNombramientoIdx: idx,
            periodosUsados: vent.periodosIds,
            inicio: String(vent.inicio),
            fin: String(vent.fin),
            nota: 'Ventana usa 3 meses naturales hacia atrás desde la fecha de nombramiento e incluye ventas del mismo periodo hasta el nombramiento'
        });
        return vent;
    }

    /** Lista de internalids de ODV contadas como venta personal JTL en la ventana (solo para log). */
    function listarOdvsVentasPersonalesJTL(dataEmp, empId, historicoSO, thisPeriodSO, windowStart, windowEnd) {
        var ids = [];
        iterarVentasEmpleadoEnVentana(empId, historicoSO, thisPeriodSO, windowStart, windowEnd, function (row) {
            if (!esVentaPersonalContableJTL(dataEmp, row)) {
                return;
            }
            ids.push(String(row.internalid));
        });
        return ids;
    }

    /** Lista de ODVs contadas para bono nombramiento JTL (cuenta No Comisionable; descarta TM Ganada). */
    function listarOdvsVentasPersonalesNombramientoJTL(dataEmp, empId, historicoSO, thisPeriodSO, windowStart, windowEnd) {
        var ids = [];
        iterarVentasEmpleadoEnVentana(empId, historicoSO, thisPeriodSO, windowStart, windowEnd, function (row) {
            if (!esVentaCuentaParaPoolTalent(dataEmp, row)) {
                return;
            }
            ids.push(String(row.internalid));
        });
        return ids;
    }

    /** Normaliza a Date fechas de periodo (objeto Date o string). */
    function jtlNormalizarFechaPeriodo(d) {
        if (!d) {
            return null;
        }
        if (d instanceof Date) {
            return d;
        }
        // En este script llegan strings con formatos mixtos (dd/mm/yyyy desde UI y otros formatos desde búsquedas).
        // Utils.stringToDate puede interpretar dd/mm como mm/dd, provocando ventanas invertidas (inicio > fin).
        var s = String(d).trim();
        var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            var a = parseInt(m[1], 10);
            var b = parseInt(m[2], 10);
            var y = parseInt(m[3], 10);
            var dd;
            var mm;
            if (a > 12) {
                dd = a;
                mm = b;
            } else if (b > 12) {
                dd = b;
                mm = a;
            } else {
                // Ambiguo (p.ej. 02/03/2026). Mantener el parser existente para no romper otros casos.
                return Utils.stringToDate(s);
            }
            // Mes 0-based
            return new Date(y, mm - 1, dd);
        }
        return Utils.stringToDate(s);
    }

    /**
     * Indica si custentity_periodo_pago_jtl tiene valor: el bono Calificación JTL ya se liquidó y no debe pagarse de nuevo.
     */
    function jtlPeriodoPagoCalificacionRegistrado(val) {
        if (val === null || val === undefined) {
            return false;
        }
        if (val === false) {
            return false;
        }
        if (val === true) {
            return true;
        }
        if (Array.isArray(val)) {
            return val.length > 0;
        }
        var s = String(val).trim();
        if (s === '' || s === 'F' || s.toLowerCase() === 'false') {
            return false;
        }
        return true;
    }

    /** Lista de periodos comerciales ordenados por fecha de inicio (misma lógica que ventana JTL). */
    function periodosComercialesOrdenados(todosPeriodos) {
        var sorted = [];
        var pid;
        for (pid in todosPeriodos) {
            if (todosPeriodos.hasOwnProperty(pid)) {
                sorted.push({
                    id: pid,
                    inicio: todosPeriodos[pid].inicio,
                    fin: todosPeriodos[pid].fin
                });
            }
        }
        sorted.sort(function (a, b) {
            return a.inicio - b.inicio;
        });
        return sorted;
    }

    function indicePeriodoComercialPorId(sorted, custPeriodId) {
        var i;
        for (i = 0; i < sorted.length; i++) {
            if (String(sorted[i].id) === String(custPeriodId)) {
                return i;
            }
        }
        return -1;
    }

    /** Periodo comercial (internal id) que contiene una fecha; usa límites del calendario Vorwerk ordenado. */
    function maestriaPeriodoIdQueContieneFecha(sorted, fecha) {
        if (!sorted || !sorted.length || !fecha) {
            return null;
        }
        var d = fecha instanceof Date && !isNaN(fecha.getTime()) ? new Date(fecha.getTime()) : jtlNormalizarFechaPeriodo(fecha);
        if (!d) {
            return null;
        }
        var i;
        for (i = 0; i < sorted.length; i++) {
            var pi = sorted[i];
            var ini = pi.inicio instanceof Date && !isNaN(pi.inicio.getTime()) ? new Date(pi.inicio.getTime()) : jtlNormalizarFechaPeriodo(pi.inicio);
            var fin = pi.fin instanceof Date && !isNaN(pi.fin.getTime()) ? new Date(pi.fin.getTime()) : jtlNormalizarFechaPeriodo(pi.fin);
            if (!ini || !fin) {
                continue;
            }
            fin.setHours(23, 59, 59, 999);
            if (d >= ini && d <= fin) {
                return String(pi.id);
            }
        }
        return null;
    }

    /**
     * Promoción Maestría JTL (2+1) únicamente: ventana de 13 periodos comerciales desde el periodo de la fecha de calificación;
     * en el periodo donde cae la fecha de calificación no se paga Maestría (primer mes).
     * No aplica a Maestría LE (3+2). Fecha de calificación: custentity_fcha_inic_le_jr; si vacía, custentity_fecha_nombramiento.
     * @returns {{ ok: boolean, motivo?: string, codigo?: string, detalle?: Object }}
     */
    function maestriaValidarVentanaPromocion13Meses(dataEmp, sorted, cust_period, p0) {
        var MESES_PROMO = 13;
        var dQual = jtlNormalizarFechaPeriodo(dataEmp && dataEmp.fechaInicioLeJr);
        if (!dQual && dataEmp && dataEmp.fechaNombramiento) {
            dQual = jtlNormalizarFechaPeriodo(dataEmp.fechaNombramiento);
        }
        if (!dQual) {
            return {
                ok: false,
                codigo: 'SIN_FECHA_CALIFICACION',
                motivo: 'Maestría: sin fecha de calificación (custentity_fcha_inic_le_jr / respaldo custentity_fecha_nombramiento)'
            };
        }
        var idPeriodoCalif = maestriaPeriodoIdQueContieneFecha(sorted, dQual);
        if (!idPeriodoCalif) {
            return {
                ok: false,
                codigo: 'CALIFICACION_FUERA_CALENDARIO',
                motivo: 'Maestría: fecha de calificación fuera del calendario de periodos comerciales',
                detalle: { fechaCalificacion: String(dQual) }
            };
        }
        var idxCalif = indicePeriodoComercialPorId(sorted, idPeriodoCalif);
        var idx = indicePeriodoComercialPorId(sorted, cust_period);
        if (idx < 0 || idxCalif < 0) {
            return {
                ok: false,
                codigo: 'INDICE_PERIODO',
                motivo: 'Maestría: periodo del reporte o de calificación no encontrado en el calendario comercial',
                detalle: { periodoReporte: String(cust_period || ''), periodoCalificacion: String(idPeriodoCalif) }
            };
        }
        if (String(p0.id) === String(idPeriodoCalif)) {
            return {
                ok: false,
                codigo: 'PRIMER_MES_CALIFICACION',
                motivo: 'Maestría: no aplica en el periodo comercial de la fecha de calificación (primer mes sin pago)',
                detalle: { periodoCalificacion: String(idPeriodoCalif), periodoReporte: String(p0.id) }
            };
        }
        if (idx < idxCalif) {
            return {
                ok: false,
                codigo: 'PERIODO_ANTES_CALIFICACION',
                motivo: 'Maestría: periodo del reporte es anterior al periodo de calificación',
                detalle: { idxReporte: idx, idxCalificacion: idxCalif }
            };
        }
        if (idx - idxCalif > MESES_PROMO - 1) {
            return {
                ok: false,
                codigo: 'FUERA_VENTANA_13_MESES',
                motivo: 'Maestría: fuera de la ventana de 13 periodos comerciales desde la calificación',
                detalle: {
                    periodoCalificacion: String(idPeriodoCalif),
                    periodoReporte: String(p0.id),
                    offsetPeriodos: idx - idxCalif,
                    maxOffsetPermitido: MESES_PROMO - 1
                }
            };
        }
        return { ok: true, detalle: { periodoCalificacion: String(idPeriodoCalif), offsetPeriodos: idx - idxCalif } };
    }

    var DIAS_NATURALES_PRIMERA_VENTA_TRAS_ALTA_2MAS1 = 30;

    /**
     * Programa 2+1 en un periodo comercial: ≥2 ventas personales del JTL (reglas JTL) y ≥1 recluta activo
     * (reclutadora = JTL, primera venta contable JTL en el periodo y dentro de 30 días naturales desde alta efectiva: reactivación o hiredate).
     * Criterio de “primera venta en el periodo”: mismo criterio estructural que bonoNuevoRecluta (ventas en periodo y !historicoSO[recluta]);
     * la elegible para 2+1 además debe ser contable JTL y caer en alta..alta+30 días naturales.
     * @param {Array} reclutasArray Lista del presentador (misma que sublista Reclutas); si vacía se usa listaReclutasMap por id JTL.
     * @param {Object} [opcionesLog] Si viene con logMaestria:true, escribe auditoría por periodo (uso maestría).
     */
    function evaluarPrograma2mas1EnPeriodo(dataEmp, jtlId, reclutasArray, listaReclutasMap, allPresentadoras, historicoSO, thisPeriodSO, periodIni, periodFin, opcionesLog) {
        var dIni = jtlNormalizarFechaPeriodo(periodIni);
        var dFin = jtlNormalizarFechaPeriodo(periodFin);
        if (!dIni || !dFin) {
            if (opcionesLog && opcionesLog.logMaestria) {
                jtlLogMaestria(jtlId, 'evaluación periodo: fechas inválidas', {
                    periodoId: opcionesLog.periodoId,
                    etiqueta: opcionesLog.etiqueta
                });
            }
            return { ok: false, ventas: 0, reclutasActivosIds: [] };
        }
        var ventas = contarVentasPersonalesVentanaJTL(dataEmp, jtlId, historicoSO, thisPeriodSO, dIni, dFin);
        var keyRec = String(jtlId);
        var lista = reclutasArray;
        var origenLista = 'parametro_reclutas';
        if (!lista || !lista.length) {
            lista = listaReclutasMap[keyRec] || listaReclutasMap[jtlId] || [];
            origenLista = 'listaReclutasMap';
        }
        var etiquetaPeriodoLog = opcionesLog && opcionesLog.etiqueta ? opcionesLog.etiqueta : 'periodo del reporte';
        var periodoIdLog = opcionesLog && opcionesLog.periodoId != null ? opcionesLog.periodoId : '';
        jtlLog2mas1(jtlId, 'reclutas: inicio barrido lista 2+1', {
            periodoEtiqueta: etiquetaPeriodoLog,
            periodoId: periodoIdLog,
            ventana: { inicio: String(dIni), fin: String(dFin) },
            totalEnLista: lista.length,
            idsReclutas: lista,
            origenLista: origenLista
        });
        var reclutasOk = [];
        var r;
        for (r = 0; r < lista.length; r++) {
            var rid = lista[r];
            var diag = {
                reclutaId: String(rid),
                activo: false,
                codigo: '',
                decision: 'excluido',
                periodoEtiqueta: etiquetaPeriodoLog,
                periodoId: periodoIdLog
            };
            var rec = allPresentadoras[rid] || allPresentadoras[String(rid)];
            if (!rec) {
                diag.codigo = 'SIN_DATOS_EN_MAPA';
                diag.motivo = 'No hay registro del empleado en allPresentadoras';
            } else {
                diag.entityid = rec.entityid || '';
                if (String(rec.emp_reclutadora) !== String(jtlId)) {
                    diag.codigo = 'RECLUTADORA_DISTINTA';
                    diag.motivo = 'custentity_reclutadora no coincide con el JTL del reporte';
                    diag.detalle = { emp_reclutadora: String(rec.emp_reclutadora), jtlEsperado: String(jtlId) };
                } else {
                    var hiredateR = rec.hiredate;
                    var reactivacionR = rec.fechaReactivacion;
                    var dAltaR;
                    var tipoAltaR;
                    if (reactivacionR !== '' && reactivacionR != null) {
                        dAltaR = Utils.stringToDate(reactivacionR);
                        tipoAltaR = 'reactivacion';
                    } else if (hiredateR !== '' && hiredateR != null) {
                        dAltaR = Utils.stringToDate(hiredateR);
                        tipoAltaR = 'hiredate';
                    } else {
                        diag.codigo = 'SIN_FECHA_ALTA';
                        diag.motivo = 'Sin hiredate ni fecha de reactivación';
                        dAltaR = null;
                    }
                    if (dAltaR) {
                        var limite30R = new Date(dAltaR.getTime());
                        limite30R.setDate(limite30R.getDate() + DIAS_NATURALES_PRIMERA_VENTA_TRAS_ALTA_2MAS1);
                        diag.detalle = {
                            tipoAlta: tipoAltaR,
                            dAlta: String(dAltaR),
                            limite30d: String(limite30R),
                            periodoIni: String(dIni),
                            periodoFin: String(dFin)
                        };
                        if (limite30R < dIni) {
                            diag.codigo = 'PLAZO_PRIMERA_VENTA_YA_CERRO';
                            diag.motivo =
                                'Alta + 30 días naturales termina antes del inicio del periodo; no aplica primera venta en este mes';
                        } else if (dAltaR > dFin) {
                            diag.codigo = 'ALTA_DESPUES_DEL_PERIODO';
                            diag.motivo = 'Fecha efectiva de alta posterior al fin del periodo';
                        } else {
                            var ventasReclutaH = historicoSO[rid] || historicoSO[String(rid)];
                            var ventasReclutaTP = thisPeriodSO[rid] || thisPeriodSO[String(rid)];
                            diag.detalle.historicoPrePeriodoCargado = !!ventasReclutaH;
                            diag.detalle.ventasEnPeriodoCargadas = !!ventasReclutaTP;
                            if (ventasReclutaH) {
                                diag.codigo = 'HISTORICO_PREPERIODO_COMO_BONO_NUEVO_RECLUTA';
                                diag.motivo =
                                    'Hay ODVs del recluta antes del inicio del periodo en historicoSO (misma regla que Bono Nuevo Recluta: !ventasReclutaH). ' +
                                    'La primera venta countable del periodo no cuenta como activación 2+1 si ya hubo ventas cargadas en histórico.';
                            } else if (!ventasReclutaTP) {
                                diag.codigo = 'SIN_ODVS_EN_PERIODO';
                                diag.motivo = 'Sin ventas del recluta en el periodo calculado (thisPeriodSO)';
                            } else {
                                var primeraPeriodo = null;
                                var diagnosticoCadaOdv = [];
                                var idxO;
                                for (idxO = 0; idxO < ventasReclutaTP.length; idxO++) {
                                    var idSO = ventasReclutaTP[idxO];
                                    var keysO = Object.keys(idSO);
                                    if (keysO.length === 0) {
                                        continue;
                                    }
                                    var rowO = idSO[keysO[0]];
                                    var rawOd = rowO.trandate;
                                    var dtO =
                                        rawOd instanceof Date && !isNaN(rawOd.getTime())
                                            ? new Date(rawOd.getTime())
                                            : jtlNormalizarFechaPeriodo(rawOd);
                                    var motivos = motivosExclusionVentaActivacion2mas1(rec, rowO);
                                    var okContable = motivos.length === 0;
                                    var okVentanaAlta = !!dtO && dtO >= dAltaR && dtO <= limite30R;
                                    var okVentanaPeriodo = !!dtO && dtO >= dIni && dtO <= dFin;
                                    if (diagnosticoCadaOdv.length < 15) {
                                        diagnosticoCadaOdv.push({
                                            internalid: String(rowO.internalid),
                                            trandateRaw: rawOd,
                                            trandateNorm: dtO ? String(dtO) : '(fecha inválida)',
                                            tipoVenta: rowO.custbody_tipo_venta,
                                            comStatus: rowO.custbody_vw_comission_status,
                                            otroFin: rowO.custbody_otro_financiamiento,
                                            okVentaCuentaActivacion2mas1: okContable,
                                            motivosExclusion: motivos,
                                            okVentanaAlta30: okVentanaAlta,
                                            okVentanaPeriodo: okVentanaPeriodo
                                        });
                                    }
                                    if (!okContable) {
                                        continue;
                                    }
                                    if (
                                        !dtO ||
                                        !(dtO >= dAltaR && dtO <= limite30R) ||
                                        !(dtO >= dIni && dtO <= dFin)
                                    ) {
                                        continue;
                                    }
                                    if (!primeraPeriodo || dtO < primeraPeriodo) {
                                        primeraPeriodo = dtO;
                                    }
                                }
                                if (!primeraPeriodo) {
                                    diag.codigo = 'SIN_VENTA_ACTIVACION_2MAS1_EN_VENTANA';
                                    diag.motivo =
                                        'En el periodo no hay ODV válida para activación 2+1 del recluta entre el alta y alta+30 días naturales (o fuera de la ventana del periodo)';
                                    diag.detalle.diagnosticoCadaOdvPeriodo = diagnosticoCadaOdv;
                                } else {
                                    diag.detalle.primeraVentaContable = String(primeraPeriodo);
                                    diag.activo = true;
                                    diag.decision = 'incluido';
                                    diag.codigo = 'CUMPLE_RECLUTA_ACTIVO';
                                    diag.motivo =
                                        'Sin histórico pre-periodo (como Bono Nuevo Recluta), con venta contable JTL en el periodo dentro de 30 días naturales desde el alta';
                                }
                            }
                        }
                    }
                }
            }
            jtlLog2mas1(jtlId, 'recluta 2+1: decisión', diag);
            if (diag.activo) {
                reclutasOk.push(rid);
            }
        }
        jtlLog2mas1(jtlId, 'reclutas: resumen activos 2+1', {
            periodoEtiqueta: etiquetaPeriodoLog,
            periodoId: periodoIdLog,
            incluidos: reclutasOk,
            cantidadActivos: reclutasOk.length
        });
        var ok = ventas >= 2 && reclutasOk.length >= 1;
        var resultado = { ok: ok, ventas: ventas, reclutasActivosIds: reclutasOk };
        if (opcionesLog && opcionesLog.logMaestria) {
            jtlLogMaestria(jtlId, 'evaluación periodo 2+1', {
                periodoId: opcionesLog.periodoId,
                etiqueta: opcionesLog.etiqueta,
                ventana: { inicio: String(dIni), fin: String(dFin) },
                ventasJTL: ventas,
                minVentasJTL: 2,
                reclutasActivosEnMes: reclutasOk,
                criterioRecluta:
                    'reclutadora=JTL, sin historicoSO pre-periodo (igual Bono Nuevo Recluta), 1ª contable JTL en thisPeriodSO en ventana alta..alta+30 y dentro del periodo',
                minReclutasActivos: 1,
                cumple: ok
            });
        }
        return resultado;
    }

    /** Bono mensual $1,500: solo tipo nombramiento JTL (3); periodo del reporte. */
    function bonoJTLPrograma2mas1Estandar(dataEmp, historicoSO, thisPeriodSO, reclutasArray, listaReclutas, allPresentadoras, inicioPeriodo, finPeriodo) {
        try {
            var jtlId = dataEmp.internalid;
            if (String(dataEmp.tipoNombramento) !== '3') {
                return false;
            }
            jtlLog2mas1(jtlId, 'inicio evaluación', {
                tipoNombramento: dataEmp.tipoNombramento,
                periodoReporte: { inicio: inicioPeriodo, fin: finPeriodo }
            });
            var dIni = jtlNormalizarFechaPeriodo(inicioPeriodo);
            var dFin = jtlNormalizarFechaPeriodo(finPeriodo);
            if (!dIni || !dFin) {
                jtlLog2mas1(jtlId, 'rechazo: fechas de periodo inválidas', { inicioPeriodo: inicioPeriodo, finPeriodo: finPeriodo });
                return false;
            }
            var odvsJtl = listarOdvsVentasPersonalesJTL(dataEmp, jtlId, historicoSO, thisPeriodSO, dIni, dFin);
            var ev = evaluarPrograma2mas1EnPeriodo(dataEmp, jtlId, reclutasArray, listaReclutas, allPresentadoras, historicoSO, thisPeriodSO, dIni, dFin);
            jtlLog2mas1(jtlId, 'resultado programa 2+1 en periodo del reporte', {
                ventasPersonalesJTL: ev.ventas,
                minVentasRequeridas: 2,
                reclutasActivosIds: ev.reclutasActivosIds,
                minReclutasActivosRequeridos: 1,
                criterioRecluta:
                    'reclutadora=JTL, sin historicoSO pre-periodo (Bono Nuevo Recluta), 1ª contable en periodo en alta..alta+30 días',
                diasMaxTrasAlta: DIAS_NATURALES_PRIMERA_VENTA_TRAS_ALTA_2MAS1,
                odvsVentasJTL_muestra: odvsJtl.slice(0, 40),
                totalOdvsListadas: odvsJtl.length,
                cumple: ev.ok
            });
            if (!ev.ok) {
                jtlLog2mas1(jtlId, 'sin bono: no cumple 2+1', {
                    motivo:
                        ev.ventas < 2
                            ? 'menos de 2 ventas personales JTL'
                            : ev.reclutasActivosIds.length < 1
                              ? 'sin recluta activo (misma lógica que Bono Nuevo Recluta: sin ODVs en historicoSO + 1ª contable JTL en periodo en alta..alta+30 días)'
                              : 'otro'
                });
                return false;
            }
            jtlLog2mas1(jtlId, 'aprobado bono $1500', { monto: 1500 });
            return { monto: 1500, data: ev };
        } catch (e) {
            log.error('error bonoJTLPrograma2mas1Estandar', e);
            jtlLog2mas1(dataEmp && dataEmp.internalid, 'error excepción', String(e));
            return false;
        }
    }

    /** Bono $4,500: JTL cumple 2+1 en 3 periodos comerciales Vorwerk consecutivos (incluye el periodo del reporte como último mes). */
    function bonoJTLMaestria(dataEmp, historicoSO, thisPeriodSO, reclutasArray, listaReclutas, allPresentadoras, todosPeriodos, cust_period) {
        try {
            var jtlId = dataEmp.internalid;
            if (String(dataEmp.tipoNombramento) !== '3') {
                return false;
            }
            jtlLogMaestria(jtlId, 'inicio evaluación', {
                tipoNombramento: dataEmp.tipoNombramento,
                cust_periodSeleccionado: cust_period,
                inicioMaestriaPeriodo: dataEmp && dataEmp.inicioMaestria ? String(dataEmp.inicioMaestria) : ''
            });
            var sorted = periodosComercialesOrdenados(todosPeriodos);
            var idx = indicePeriodoComercialPorId(sorted, cust_period);
            jtlLogMaestria(jtlId, 'índice periodo en calendario comercial', {
                indice: idx,
                totalPeriodosOrdenados: sorted.length,
                cust_period: cust_period
            });
            if (idx < 2) {
                jtlLogMaestria(jtlId, 'sin bono: no hay 3 periodos consecutivos previos al actual', {
                    indice: idx,
                    requiereIndiceMinimo: 2
                });
                return false;
            }
            var p2 = sorted[idx - 2];
            var p1 = sorted[idx - 1];
            var p0 = sorted[idx];
            jtlLogMaestria(jtlId, 'cadena de 3 periodos consecutivos', {
                mesAnteant: { id: p2.id, inicio: String(p2.inicio), fin: String(p2.fin) },
                mesAnterior: { id: p1.id, inicio: String(p1.inicio), fin: String(p1.fin) },
                mesReporte: { id: p0.id, inicio: String(p0.inicio), fin: String(p0.fin) }
            });

            var ventPromoJtl = maestriaValidarVentanaPromocion13Meses(dataEmp, sorted, cust_period, p0);
            if (!ventPromoJtl.ok) {
                jtlLogMaestria(jtlId, 'sin bono: ventana promoción Maestría (13 meses / primer mes)', {
                    codigo: ventPromoJtl.codigo,
                    motivo: ventPromoJtl.motivo,
                    detalle: ventPromoJtl.detalle || {}
                });
                return false;
            }

            // Filtro: custentity_inicio_maestria almacena el PERIODO (ID) de inicio del bono maestría.
            // Debe haber al menos 3 periodos consecutivos disponibles: inicioMaestria <= periodoMes1(p2).
            // Equivalente: indicePeriodoActual - indiceInicio >= 2.
            var inicioMaestriaPid = dataEmp && dataEmp.inicioMaestria ? String(dataEmp.inicioMaestria) : '';
            if (inicioMaestriaPid) {
                var idxInicio = indicePeriodoComercialPorId(sorted, inicioMaestriaPid);
                if (idxInicio >= 0 && (idx - idxInicio) < 2) {
                    jtlLogMaestria(jtlId, 'sin bono: inicio maestría con <3 periodos disponibles', {
                        inicioMaestriaPeriodo: String(inicioMaestriaPid),
                        periodoReporteId: String(cust_period || ''),
                        periodosEvaluados: { mes1: String(p2.id), mes2: String(p1.id), mes3: String(p0.id) }
                    });
                    return false;
                }
            }

            var logOpt2 = { logMaestria: true, periodoId: p2.id, etiqueta: 'mes 1 (más antiguo)' };
            var logOpt1 = { logMaestria: true, periodoId: p1.id, etiqueta: 'mes 2' };
            var logOpt0 = { logMaestria: true, periodoId: p0.id, etiqueta: 'mes 3 (periodo reporte)' };
            var e2 = evaluarPrograma2mas1EnPeriodo(dataEmp, jtlId, reclutasArray, listaReclutas, allPresentadoras, historicoSO, thisPeriodSO, p2.inicio, p2.fin, logOpt2);
            var e1 = evaluarPrograma2mas1EnPeriodo(dataEmp, jtlId, reclutasArray, listaReclutas, allPresentadoras, historicoSO, thisPeriodSO, p1.inicio, p1.fin, logOpt1);
            var e0 = evaluarPrograma2mas1EnPeriodo(dataEmp, jtlId, reclutasArray, listaReclutas, allPresentadoras, historicoSO, thisPeriodSO, p0.inicio, p0.fin, logOpt0);
            if (!e0.ok || !e1.ok || !e2.ok) {
                jtlLogMaestria(jtlId, 'sin bono: no cumple 2+1 en los 3 meses', {
                    mes1_cumple: e2.ok,
                    mes2_cumple: e1.ok,
                    mes3_cumple: e0.ok,
                    resumenMes1: { ventas: e2.ventas, reclutas: e2.reclutasActivosIds },
                    resumenMes2: { ventas: e1.ventas, reclutas: e1.reclutasActivosIds },
                    resumenMes3: { ventas: e0.ventas, reclutas: e0.reclutasActivosIds }
                });
                return false;
            }
            jtlLogMaestria(jtlId, 'aprobado bono $4500', {
                monto: 4500,
                periodosIds: [p2.id, p1.id, p0.id]
            });
            var copiaMesMaestriaJtl = function (ev, pIni, pFin) {
                var o = {};
                var k;
                for (k in ev) {
                    if (Object.prototype.hasOwnProperty.call(ev, k)) {
                        o[k] = ev[k];
                    }
                }
                o.ordenesVentasPersonalesJTL = listarOdvsVentasPersonalesJTL(
                    dataEmp,
                    jtlId,
                    historicoSO,
                    thisPeriodSO,
                    pIni,
                    pFin
                );
                return o;
            };
            return {
                monto: 4500,
                data: {
                    periodosIds: [p2.id, p1.id, p0.id],
                    // Misma forma que Maestría LE (solo cambia el contenido: aquí es 2+1)
                    mes1_antiguo: copiaMesMaestriaJtl(e2, p2.inicio, p2.fin),
                    mes2: copiaMesMaestriaJtl(e1, p1.inicio, p1.fin),
                    mes3_reporte: copiaMesMaestriaJtl(e0, p0.inicio, p0.fin)
                }
            };
        } catch (e) {
            log.error('error bonoJTLMaestria', e);
            jtlLogMaestria(dataEmp && dataEmp.internalid, 'error excepción', String(e));
            return false;
        }
    }

    /** IDs de empleados cuyas ODVs usa bonoXmasDos (líder, reclutas, integrantes y reclutas de integrantes). */
    function leMaestriaEmpIdsParaXmasDos(liderId, reclutas, integrantesEquipo, listaReclutas) {
        var s = {};
        s[String(liderId)] = true;
        if (reclutas) {
            reclutas.forEach(function (rid) {
                s[String(rid)] = true;
            });
        }
        if (integrantesEquipo) {
            integrantesEquipo.forEach(function (mid) {
                s[String(mid)] = true;
                var lr = listaReclutas[mid] || listaReclutas[String(mid)];
                if (lr) {
                    var y;
                    for (y = 0; y < lr.length; y++) {
                        s[String(lr[y])] = true;
                    }
                }
            });
        }
        return Object.keys(s);
    }

    /** Parte ODVs en “antes de la ventana” vs “dentro de la ventana” [ventIni, ventFin] para simular bonoXmasDos en ese mes comercial. */
    function leMaestriaArmarSOsVentana(historicoSO, thisPeriodSO, empIds, ventIni, ventFin) {
        var vi = jtlNormalizarFechaPeriodo(ventIni);
        var vf = jtlNormalizarFechaPeriodo(ventFin);
        if (!vi || !vf) {
            return { hist: {}, tp: {} };
        }
        vf.setHours(23, 59, 59, 999);
        var hist = {};
        var tp = {};
        var ei;
        for (ei = 0; ei < empIds.length; ei++) {
            var eid = empIds[ei];
            var merged = [];
            var walk = function (arr) {
                if (!arr) {
                    return;
                }
                var ix;
                for (ix = 0; ix < arr.length; ix++) {
                    var idSO = arr[ix];
                    var keys = Object.keys(idSO);
                    if (keys.length === 0) {
                        continue;
                    }
                    var copy = {};
                    copy[keys[0]] = idSO[keys[0]];
                    merged.push(copy);
                }
            };
            walk(historicoSO[eid] || historicoSO[String(eid)]);
            walk(thisPeriodSO[eid] || thisPeriodSO[String(eid)]);
            var hArr = [];
            var pArr = [];
            var mi;
            for (mi = 0; mi < merged.length; mi++) {
                var ord = merged[mi];
                var kl = Object.keys(ord);
                if (kl.length === 0) {
                    continue;
                }
                var row = ord[kl[0]];
                var rawTd = row.trandate;
                var dt =
                    rawTd instanceof Date && !isNaN(rawTd.getTime())
                        ? new Date(rawTd.getTime())
                        : Utils.stringToDate(rawTd);
                if (!dt) {
                    continue;
                }
                var cpy = {};
                cpy[kl[0]] = row;
                if (dt < vi) {
                    hArr.push(cpy);
                } else if (dt <= vf) {
                    pArr.push(cpy);
                }
            }
            if (hArr.length) {
                hist[eid] = hArr;
            }
            if (pArr.length) {
                tp[eid] = pArr;
            }
        }
        return { hist: hist, tp: tp };
    }

    /** Indica si en la ventana comercial el líder calificaría por monto 3+2 (monto32 > 0) con las mismas reglas que bonoXmasDos LE (sin 5+2). */
    function leMaestriaCumpleTresMasDosEnVentana(
        dataEmp,
        reclutasEquipo,
        integrantesEquipo,
        reclutas,
        listaReclutas,
        allPresentadoras,
        historicoSO,
        thisPeriodSO,
        ventIni,
        ventFin
    ) {
        var liderId = dataEmp.internalid;
        var empIds = leMaestriaEmpIdsParaXmasDos(liderId, reclutas, integrantesEquipo, listaReclutas);
        var maps = leMaestriaArmarSOsVentana(historicoSO, thisPeriodSO, empIds, ventIni, ventFin);
        var ventasLider = maps.tp[liderId] || maps.tp[String(liderId)];
        var viNorm = jtlNormalizarFechaPeriodo(ventIni);
        if (!viNorm) {
            return false;
        }
        var dHistoricoVentana = Utils.restarMeses(Utils.dateToString(viNorm), 3);
        var res = bonoXmasDos(
            dataEmp,
            reclutasEquipo,
            maps.tp,
            ventasLider,
            maps.hist,
            allPresentadoras,
            dHistoricoVentana,
            integrantesEquipo,
            reclutas,
            listaReclutas,
            false,
            ventIni,
            ventFin
        );
        if (!res) {
            return false;
        }
        return res.monto32 > 0;
    }

    /** Evaluación detallada de 3+2 en una ventana (para logs de Maestría LE). */
    function leMaestriaEvaluarTresMasDosEnVentana(
        dataEmp,
        reclutasEquipo,
        integrantesEquipo,
        reclutas,
        listaReclutas,
        allPresentadoras,
        historicoSO,
        thisPeriodSO,
        ventIni,
        ventFin
    ) {
        var liderId = dataEmp.internalid;
        var empIds = leMaestriaEmpIdsParaXmasDos(liderId, reclutas, integrantesEquipo, listaReclutas);
        var maps = leMaestriaArmarSOsVentana(historicoSO, thisPeriodSO, empIds, ventIni, ventFin);
        var ventasLider = maps.tp[liderId] || maps.tp[String(liderId)];
        var viNorm = jtlNormalizarFechaPeriodo(ventIni);
        if (!viNorm) {
            return { ok: false, motivo: 'NO_GANA: ventana inválida (sin fecha inicio)', resumen: null, ordenes: null };
        }
        var dHistoricoVentana = Utils.restarMeses(Utils.dateToString(viNorm), 3);
        var res = bonoXmasDos(
            dataEmp,
            reclutasEquipo,
            maps.tp,
            ventasLider,
            maps.hist,
            allPresentadoras,
            dHistoricoVentana,
            integrantesEquipo,
            reclutas,
            listaReclutas,
            false,
            ventIni,
            ventFin
        );
        if (!res || !res.resumen) {
            return { ok: false, motivo: 'NO_GANA: sin resultado 3+2 en ventana', resumen: null, ordenes: null };
        }
        /** ODVs consideradas en la ventana: propias JTL + pedidos que activan reclutas (misma lógica que bono 3+2). */
        var ordenesMes = {
            ventasPersonalesJtl: listarOdvsVentasPersonalesJTL(dataEmp, liderId, historicoSO, thisPeriodSO, ventIni, ventFin),
            pedidosActivacionReclutasDirectas: res.data || [],
            pedidosActivacionEquipo: res.equipo || []
        };
        if (res.resumen.monto32 > 0) {
            return { ok: true, motivo: res.resumen.via || 'GANA: 3+2', resumen: res.resumen, ordenes: ordenesMes };
        }
        return { ok: false, motivo: res.resumen.razonNoGana || 'NO_GANA', resumen: res.resumen, ordenes: ordenesMes };
    }

    function leMaestriaLiderActivaVentasEmp(dataEmp, ventasEmp, dIniP, dFinP) {
        if (!ventasEmp) {
            return false;
        }
        var fechaRow = function (row) {
            var rawTd = row.trandate;
            return rawTd instanceof Date && !isNaN(rawTd.getTime())
                ? new Date(rawTd.getTime())
                : Utils.stringToDate(rawTd);
        };
        var vi;
        for (vi in ventasEmp) {
            if (!ventasEmp.hasOwnProperty(vi)) {
                continue;
            }
            var idSOL = ventasEmp[vi];
            var keysL = Object.keys(idSOL);
            if (keysL.length === 0) {
                continue;
            }
            var rowL = idSOL[keysL[0]];
            var dtL = fechaRow(rowL);
            if (dtL && dtL >= dIniP && dtL <= dFinP && esVentaPersonalContableJTL(dataEmp, rowL)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Maestría Líder de Equipo: $15,000 si en 3 periodos comerciales Vorwerk consecutivos (incluye el del reporte como tercer mes)
     * la líder hubiera calificado por bono 3+2 (monto32) en cada uno. Requiere al menos una venta personal contable JTL en el periodo del reporte.
     */
    function bonoLEMaestriaTresMasDos(
        dataEmp,
        reclutasEquipo,
        integrantesEquipo,
        reclutas,
        listaReclutas,
        allPresentadoras,
        historicoSO,
        thisPeriodSO,
        todosPeriodos,
        cust_period,
        inicioPeriodo,
        finPeriodo,
        ventasEmp
    ) {
        try {
            var liderId = dataEmp && dataEmp.internalid ? String(dataEmp.internalid) : '';
            var resumen = {
                liderId: liderId,
                periodoReporte: { inicio: String(inicioPeriodo || ''), fin: String(finPeriodo || ''), id: String(cust_period || '') },
                inicioMaestriaPeriodo: dataEmp && dataEmp.inicioMaestria ? String(dataEmp.inicioMaestria) : '',
                motivo: '',
                detalle: {}
            };

            var dIniP = Utils.stringToDate(inicioPeriodo);
            var dFinP = Utils.stringToDate(finPeriodo);
            if (!dIniP || !dFinP) {
                resumen.motivo = 'NO_GANA: fechas de periodo reporte inválidas';
                leLogMaestria(liderId, 'resumen', resumen);
                return false;
            }
            dFinP.setHours(23, 59, 59, 999);
            if (!leMaestriaLiderActivaVentasEmp(dataEmp, ventasEmp, dIniP, dFinP)) {
                resumen.motivo = 'NO_GANA: líder no activa en periodo (requiere ≥1 venta personal contable JTL)';
                resumen.detalle = { liderActiva: false };
                leLogMaestria(liderId, 'resumen', resumen);
                return false;
            }
            var sorted = periodosComercialesOrdenados(todosPeriodos);
            var idx = indicePeriodoComercialPorId(sorted, cust_period);
            if (idx < 2) {
                resumen.motivo = 'NO_GANA: no hay 3 periodos consecutivos';
                resumen.detalle = { totalPeriodos: sorted ? sorted.length : 0, periodoReporteId: String(cust_period || '') };
                leLogMaestria(liderId, 'resumen', resumen);
                return false;
            }
            var p2 = sorted[idx - 2];
            var p1 = sorted[idx - 1];
            var p0 = sorted[idx];

            // Filtro: custentity_inicio_maestria almacena el PERIODO (ID) de inicio del bono maestría.
            // Debe haber al menos 3 periodos consecutivos disponibles: inicioMaestria <= periodoMes1(p2).
            // Equivalente: indicePeriodoActual - indiceInicio >= 2.
            var inicioMaestriaPid = dataEmp && dataEmp.inicioMaestria ? String(dataEmp.inicioMaestria) : '';
            if (inicioMaestriaPid) {
                var idxInicio = indicePeriodoComercialPorId(sorted, inicioMaestriaPid);
                if (idxInicio >= 0 && (idx - idxInicio) < 2) {
                    resumen.motivo = 'NO_GANA: inicio maestría con <3 periodos disponibles';
                    resumen.detalle = {
                        inicioMaestriaPeriodo: String(inicioMaestriaPid),
                        periodosEvaluados: { mes1: String(p2.id), mes2: String(p1.id), mes3: String(p0.id) }
                    };
                    leLogMaestria(liderId, 'resumen', resumen);
                    return false;
                }
            }
            var ev2 = leMaestriaEvaluarTresMasDosEnVentana(
                dataEmp,
                reclutasEquipo,
                integrantesEquipo,
                reclutas,
                listaReclutas,
                allPresentadoras,
                historicoSO,
                thisPeriodSO,
                p2.inicio,
                p2.fin
            );
            var ev1 = leMaestriaEvaluarTresMasDosEnVentana(
                dataEmp,
                reclutasEquipo,
                integrantesEquipo,
                reclutas,
                listaReclutas,
                allPresentadoras,
                historicoSO,
                thisPeriodSO,
                p1.inicio,
                p1.fin
            );
            var ev0 = leMaestriaEvaluarTresMasDosEnVentana(
                dataEmp,
                reclutasEquipo,
                integrantesEquipo,
                reclutas,
                listaReclutas,
                allPresentadoras,
                historicoSO,
                thisPeriodSO,
                p0.inicio,
                p0.fin
            );
            resumen.detalle = {
                liderActiva: true,
                periodos: {
                    mes1: { id: String(p2.id), inicio: String(p2.inicio), fin: String(p2.fin), motivo: ev2 ? String(ev2.motivo || '') : '' },
                    mes2: { id: String(p1.id), inicio: String(p1.inicio), fin: String(p1.fin), motivo: ev1 ? String(ev1.motivo || '') : '' },
                    mes3: { id: String(p0.id), inicio: String(p0.inicio), fin: String(p0.fin), motivo: ev0 ? String(ev0.motivo || '') : '' }
                }
            };
            var ok2 = !!(ev2 && ev2.ok);
            var ok1 = !!(ev1 && ev1.ok);
            var ok0 = !!(ev0 && ev0.ok);
            if (ok2 && ok1 && ok0) {
                resumen.motivo = 'GANA: cumple 3+2 en 3 periodos consecutivos';
                leLogMaestria(liderId, 'resumen', resumen);
                return {
                    monto: 15000,
                    data: {
                        periodosIds: [p2.id, p1.id, p0.id],
                        mes1_antiguo: {
                            id: p2.id,
                            cumple: ok2,
                            motivo: ev2 ? String(ev2.motivo || '') : '',
                            ordenes: ev2 && ev2.ordenes ? ev2.ordenes : null
                        },
                        mes2: {
                            id: p1.id,
                            cumple: ok1,
                            motivo: ev1 ? String(ev1.motivo || '') : '',
                            ordenes: ev1 && ev1.ordenes ? ev1.ordenes : null
                        },
                        mes3_reporte: {
                            id: p0.id,
                            cumple: ok0,
                            motivo: ev0 ? String(ev0.motivo || '') : '',
                            ordenes: ev0 && ev0.ordenes ? ev0.ordenes : null
                        }
                    }
                };
            }
            resumen.motivo = 'NO_GANA: no cumple 3+2 en uno o más meses';
            leLogMaestria(liderId, 'resumen', resumen);
            return false;
        } catch (e) {
            log.error('error bonoLEMaestriaTresMasDos', e);
            return false;
        }
    }

    /**
     * Bono Calificación JTL ($4,000), antes “nombramiento JTL”.
     * Requisitos en los 3 meses comerciales previos al periodo de la calificación: ≥6 ventas personales del candidato;
     * alta del candidato con más de 90 días a la fecha de inicio LE JR; ≥2 nuevas presentadoras reclutadas por él con alta en esa ventana
     * y al menos una venta personal contable en sus primeros 90 días naturales desde hiredate.
     * Solo aplica si custentity_nombramiento_le = 3, **custentity_fcha_inic_le_jr** cae en el periodo del reporte, y **custentity_periodo_pago_jtl** está vacío (pago único).
     */
    function bonoNombramientoJTL(dataEmp, historicoSO, thisPeriodSO, listaReclutas, allPresentadoras, todosPeriodos, inicioPeriodo, finPeriodo) {
        try {
            var empId = dataEmp.internalid;
            var JTL_NOMBRAMIENTO_ID = '3';

            jtlLogBono(empId, 'inicio evaluación', {
                internalid: empId,
                tipoNombramento: dataEmp.tipoNombramento,
                fechaInicioLeJr: dataEmp.fechaInicioLeJr,
                periodoPagoJtl: dataEmp.periodoPagoJtl,
                hiredate: dataEmp.hiredate,
                periodoReporte: { inicio: inicioPeriodo, fin: finPeriodo }
            });

            if (String(dataEmp.tipoNombramento) !== JTL_NOMBRAMIENTO_ID) {
                jtlLogBono(empId, 'rechazo: tipo nombramiento', { esperado: JTL_NOMBRAMIENTO_ID, actual: dataEmp.tipoNombramento });
                return false;
            }
            if (jtlPeriodoPagoCalificacionRegistrado(dataEmp.periodoPagoJtl)) {
                jtlLogBono(empId, 'rechazo: Calificación JTL ya pagada (custentity_periodo_pago_jtl)', {
                    custentity_periodo_pago_jtl: dataEmp.periodoPagoJtl
                });
                return false;
            }
            if (!dataEmp.fechaInicioLeJr) {
                jtlLogBono(empId, 'rechazo: sin fecha inicio LE JR (custentity_fcha_inic_le_jr)', {});
                return false;
            }
            var fechaNom = jtlNormalizarFechaPeriodo(dataEmp.fechaInicioLeJr);
            if (!fechaNom) {
                jtlLogBono(empId, 'rechazo: fecha inicio LE JR inválida', { raw: dataEmp.fechaInicioLeJr });
                return false;
            }
            var iniRep = Utils.stringToDate(inicioPeriodo);
            var finRep = Utils.stringToDate(finPeriodo);
            if (fechaNom < iniRep || fechaNom > finRep) {
                jtlLogBono(empId, 'rechazo: fecha inicio LE JR fuera del periodo del reporte', {
                    fechaInicioLeJr: String(fechaNom),
                    inicioReporte: String(iniRep),
                    finReporte: String(finRep)
                });
                return false;
            }
            if (!dataEmp.hiredate) {
                jtlLogBono(empId, 'aviso: sin hiredate (criterio opcional antigüedad no evaluable)', {});
            }
            var hireJtl = Utils.stringToDate(dataEmp.hiredate);
            var limite90Jtl = new Date(hireJtl.getTime());
            limite90Jtl.setDate(limite90Jtl.getDate() + 90);
            var okAntiguedad90 = false;
            if (hireJtl && !isNaN(hireJtl.getTime())) {
                okAntiguedad90 = fechaNom > limite90Jtl;
            }

            var ventana = obtenerVentanaTresMesesComercialesPrevios(fechaNom, todosPeriodos, empId);
            var ventasPers = 0;
            var odvsContadas = [];
            if (ventana) {
                ventasPers = contarVentasPersonalesVentanaNombramientoJTL(dataEmp, empId, historicoSO, thisPeriodSO, ventana.inicio, ventana.fin);
                odvsContadas = listarOdvsVentasPersonalesNombramientoJTL(dataEmp, empId, historicoSO, thisPeriodSO, ventana.inicio, ventana.fin);
            }
            var okVentas6 = ventasPers >= 6;

            var keyRec = String(empId);
            // Para el “2 nuevos presentadores” se usa custentity_nombramiento (nombramientoPor) como criterio indispensable.
            // No dependemos de mapas globales: se arma la lista desde allPresentadoras.
            var lista = [];
            var kk;
            for (kk in allPresentadoras) {
                if (!allPresentadoras.hasOwnProperty(kk)) {
                    continue;
                }
                var eNom = allPresentadoras[kk];
                if (!eNom) {
                    continue;
                }
                if (eNom.nombramientoPor && String(eNom.nombramientoPor) === keyRec) {
                    lista.push(String(eNom.internalid || kk));
                }
            }

            var reclutasOk = [];
            var r;
            if (ventana && lista && lista.length) {
                for (r = 0; r < lista.length; r++) {
                    var rid = lista[r];
                    var rec = allPresentadoras[rid] || allPresentadoras[String(rid)];
                    if (!rec || !rec.hiredate) {
                        continue;
                    }
                    var hireRec = Utils.stringToDate(rec.hiredate);
                    if (hireRec < ventana.inicio || hireRec > ventana.fin) {
                        continue;
                    }
                    var activo90 = reclutaActivoEnPrimeros90DiasNombramientoJTL(rec, historicoSO, thisPeriodSO);
                    if (activo90) {
                        reclutasOk.push(rid);
                    }
                }
            }
            var okReclutas2 = reclutasOk.length >= 2;

            jtlLogBono(empId, 'indicadores opcionales (no bloquean pago)', {
                opcional_antiguedad90dias: {
                    ok: okAntiguedad90,
                    hiredate: hireJtl ? String(hireJtl) : '',
                    limite90d: hireJtl ? String(limite90Jtl) : '',
                    fechaInicioLeJr: String(fechaNom)
                },
                opcional_6ventasPrevias: {
                    ok: okVentas6,
                    conteo: ventasPers,
                    minimo: 6,
                    odvsContadas_muestra: odvsContadas.slice(0, 30),
                    totalOdvsListadas: odvsContadas.length
                },
                opcional_2nombradasActivas90dias: {
                    ok: okReclutas2,
                    calificados: reclutasOk.length,
                    minimo: 2,
                    idsCalificados: reclutasOk
                }
            });

            jtlLogBono(empId, 'aprobado: Calificación JTL $4000 (opcionales pueden fallar)', { monto: 4000 });
            return {
                monto: 4000,
                data: {
                    obligatorios: {
                        tipoNombramentoEsJTL: true,
                        fechaInicioLeJrEnPeriodoReporte: true,
                        periodoPagoJtlVacio: true
                    },
                    opcionales: {
                        antiguedadMayor90Dias: okAntiguedad90,
                        ventasPersonalesMin6EnVentana: okVentas6,
                        nombradasActivasMin2En90Dias: okReclutas2
                    },
                    ventanaComercial: {
                        inicio: ventana ? ventana.inicio.toString() : '',
                        fin: ventana ? ventana.fin.toString() : '',
                        periodoIds: ventana ? ventana.periodosIds : []
                    },
                    ventasPersonalesEnVentana: ventasPers,
                    odvsVentasPersonalesContadas: odvsContadas,
                    nombradasCandidatas: lista,
                    nombradasCalificadas: reclutasOk
                }
            };
        } catch (e) {
            log.error('error bonoNombramientoJTL', e);
            return false;
        }
    }

    /**
     * Bono LE Calificación JTL: $5,000 por cada miembro del equipo que califique como JTL en el periodo del reporte
     * y cumpla los requisitos del bonoNombramientoJTL en su ventana previa (6 ventas + 2 reclutas activas + >90 días desde alta).
     * La líder debe estar activa en el periodo del reporte (≥1 venta personal contable JTL). El candidato no debe tener custentity_periodo_pago_jtl poblado (pago único).
     * **Solo aquí:** la fecha de inicio JTL del candidato para filtro de periodo y para reutilizar bonoNombramientoJTL es **custentity_fecha_comisionable_jtl**; si está vacía se usa custentity_fcha_inic_le_jr como respaldo.
     */
    function bonoLENombramientoJTL(liderDataEmp, nombramientosJTLPorLider, allPresentadoras, historicoSO, thisPeriodSO, listaReclutas, todosPeriodos, inicioPeriodo, finPeriodo, ventasEmpLider) {
        try {
            var liderId = liderDataEmp && liderDataEmp.internalid;
            if (!liderId) {
                return false;
            }
            var dIniP = Utils.stringToDate(inicioPeriodo);
            var dFinP = Utils.stringToDate(finPeriodo);
            if (!dIniP || !dFinP) {
                return false;
            }
            dFinP.setHours(23, 59, 59, 999);
            var liderActiva = leMaestriaLiderActivaVentasEmp(liderDataEmp, ventasEmpLider, dIniP, dFinP);
            var arrNom = (nombramientosJTLPorLider && (nombramientosJTLPorLider[liderId] || nombramientosJTLPorLider[String(liderId)])) || [];
            var candIds = [];
            var x;
            for (x = 0; x < arrNom.length; x++) {
                candIds.push(String(arrNom[x]));
            }

            log.audit({
                title: '[Bono LE Calificación JTL] Inicio evaluación',
                details: JSON.stringify({
                    liderId: String(liderId),
                    liderNombre: (liderDataEmp && liderDataEmp.entityid) ? String(liderDataEmp.entityid) : '',
                    periodoReporte: { inicio: String(dIniP), fin: String(dFinP) },
                    liderActiva_enPeriodo: !!liderActiva,
                    liderExisteEnMapaNombramientosJTL: !!(nombramientosJTLPorLider && (nombramientosJTLPorLider[liderId] || nombramientosJTLPorLider[String(liderId)])),
                    candidatosEnMapaNombramientosJTL: candIds.length,
                    candidatoIds: candIds
                })
            });
            if (!liderActiva) {
                return false;
            }
            if (!candIds.length) {
                return false;
            }
            var montoTotal = 0;
            var detalle = [];
            var idx;
            for (idx = 0; idx < candIds.length; idx++) {
                var candId = candIds[idx];
                var cand = allPresentadoras[candId] || allPresentadoras[String(candId)];
                if (!cand) {
                    log.audit({
                        title: '[Bono LE Calificación JTL] Candidato sin datos',
                        details: JSON.stringify({
                            liderId: String(liderId),
                            candidatoId: String(candId),
                            motivo: 'No existe en allPresentadoras'
                        })
                    });
                    continue;
                }
                // Bono LE: fecha inicio JTL del candidato = custentity_fecha_comisionable_jtl (respaldo custentity_fcha_inic_le_jr).
                var fechaIniJtlCandidatoLE = cand.fechaComisionableJtl || cand.fechaInicioLeJr;
                var dNom = fechaIniJtlCandidatoLE ? jtlNormalizarFechaPeriodo(fechaIniJtlCandidatoLE) : null;
                if (!dNom || dNom < dIniP || dNom > dFinP) {
                    log.audit({
                        title:
                            '[Bono LE Calificación JTL] Líder ' +
                            String(liderId) +
                            ' | Candidato ' +
                            String(candId) +
                            (cand.entityid ? ' ' + String(cand.entityid) : '') +
                            ' — fuera de periodo reporte',
                        details: JSON.stringify({
                            liderId: String(liderId),
                            candidatoId: String(candId),
                            candidatoNombre: cand.entityid || '',
                            candidatoFechaComisionableJtl: cand.fechaComisionableJtl ? String(cand.fechaComisionableJtl) : '',
                            candidatoFechaInicioLeJr: cand.fechaInicioLeJr ? String(cand.fechaInicioLeJr) : '',
                            fechaUsadaLE: fechaIniJtlCandidatoLE ? String(fechaIniJtlCandidatoLE) : '',
                            periodoReporte: { inicio: String(dIniP), fin: String(dFinP) }
                        })
                    });
                    continue;
                }
                // Reutiliza bonoNombramientoJTL con la misma fecha ancla que el LE (comisionable → fechaInicioLeJr en copia).
                var candEvalNom = cand;
                if (cand.fechaComisionableJtl) {
                    candEvalNom = {};
                    var kCop;
                    for (kCop in cand) {
                        if (Object.prototype.hasOwnProperty.call(cand, kCop)) {
                            candEvalNom[kCop] = cand[kCop];
                        }
                    }
                    candEvalNom.fechaInicioLeJr = cand.fechaComisionableJtl;
                }
                var ev = bonoNombramientoJTL(candEvalNom, historicoSO, thisPeriodSO, listaReclutas, allPresentadoras, todosPeriodos, inicioPeriodo, finPeriodo);
                log.audit({
                    title:
                        '[Bono LE Calificación JTL] Líder ' +
                        String(liderId) +
                        ' | Candidato ' +
                        String(candId) +
                        (cand.entityid ? ' ' + String(cand.entityid) : '') +
                        ' — evaluación nombramiento',
                    details: JSON.stringify({
                        liderId: String(liderId),
                        candidatoId: String(candId),
                        candidatoNombre: cand.entityid || '',
                        candidatoHiredate: cand.hiredate ? String(cand.hiredate) : '',
                        candidatoTipoNombramiento: cand.tipoNombramento != null ? String(cand.tipoNombramento) : '',
                        candidatoFechaComisionableJtl: cand.fechaComisionableJtl ? String(cand.fechaComisionableJtl) : '',
                        candidatoFechaInicioLeJr: cand.fechaInicioLeJr ? String(cand.fechaInicioLeJr) : '',
                        cumpleBonoNombramientoJTL: !!ev,
                        detalleSiCumple: ev ? ev.data || {} : null,
                        nota: ev ? 'Acreedor a $5,000 para la líder (Calificación JTL)' : 'No cumple; ver logs [Bono JTL] del candidato para motivo exacto'
                    })
                });
                if (!ev) {
                    continue;
                }
                montoTotal += 5000;
                detalle.push({
                    candidatoId: String(candId),
                    candidatoNombre: cand.entityid || '',
                    fechaComisionableJtl: cand.fechaComisionableJtl ? String(cand.fechaComisionableJtl) : '',
                    fechaInicioLeJr: cand.fechaInicioLeJr ? String(cand.fechaInicioLeJr) : '',
                    evidenciaCandidato: ev.data || {}
                });
            }
            if (montoTotal > 0) {
                log.audit({
                    title: '[Bono LE Calificación JTL] Resultado',
                    details: JSON.stringify({
                        liderId: String(liderId),
                        montoTotal: montoTotal,
                        candidatosCalificados: detalle.length,
                        detalleCandidatos: detalle
                    })
                });
                return { monto: montoTotal, data: detalle };
            }
            log.audit({
                title: '[Bono LE Calificación JTL] Resultado',
                details: JSON.stringify({
                    liderId: String(liderId),
                    montoTotal: 0,
                    candidatosCalificados: 0
                })
            });
            return false;
        } catch (e) {
            log.error('error bonoLENombramientoJTL', e);
            return false;
        }
    }

    function searchDataPresentadoras(fechaPeriodoCalculado,cust_period){ 
        try{
           
            //Periodo actual
            var namePeriodo_sdp= fechaPeriodoCalculado.name //mm/yyyy
            var finPeriodo_sdp = fechaPeriodoCalculado.custrecord_final // dd/mm/yyyy
            finPeriodo_sdp = Utils.stringToDate(finPeriodo_sdp)
            //Periodo 3 meses antes
            const fechaTresPeriodosAntes = search.lookupFields({ type: 'customrecord_periods', id: cust_period-2, columns: ['custrecord_inicio','custrecord_final','name']});
            const nameTresPeriodosAntes= fechaTresPeriodosAntes.name //mm/yyyy
            var inicioTresPeriodosAntes = fechaTresPeriodosAntes.custrecord_inicio // dd/mm/yyyy
            inicioTresPeriodosAntes = Utils.stringToDate(inicioTresPeriodosAntes)
            

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
            //const employeeSearchReclutadoraInternalId = search.createColumn({ name: 'internalid', join: 'custentity_reclutadora' });
            const empSearchtiponombramiento = search.createColumn({ name: 'custentity_nombramiento_le'});
            const empSearchnombradopor = search.createColumn({ name: 'custentity_nombramiento'});
            const empSearchfechanombramiento = search.createColumn({ name: 'custentity_fecha_nombramiento'});
            const empSearchFchaInicLeJr = search.createColumn({ name: 'custentity_fcha_inic_le_jr'});
            const empSearchFechaComisionableJtl = search.createColumn({ name: 'custentity_fecha_comisionable_jtl'});
            const empSearchInicioMaestria = search.createColumn({ name: 'custentity_inicio_maestria' });
            const empSearchPeriodoPagoJtl = search.createColumn({ name: 'custentity_periodo_pago_jtl'});
            const empSearchPeriodoPagoNLE = search.createColumn({ name: 'custentityperiodo_nle_pago'});
            const empSearchTipoIngreso = search.createColumn({ name: 'custentity_tipo_ingreso'});
            const empSearchTipoReingreso = search.createColumn({ name: 'custentity_vorwerk_reentry'});
            const empSearchStatusTMSB = search.createColumn({ name: 'custentity_estatus_tm_sinbarreras'});
            const empSearchEptm7 = search.createColumn({ name: 'custentity_checkbox_eptm7'});
            const empSearchEptm7_inicio = search.createColumn({ name: 'custentity_fcha_inicio_eptm7'});
            const empSearchEptm7_fin = search.createColumn({ name: 'custentity_fcha_fin_eptm7'});
            const empSearchfecha_tm7_ganada = search.createColumn({ name: 'custentity_fechatm7_ganada'});
            const empSearch_so_ganotm7 = search.createColumn({ name: 'custentity_so_ganotm7'});
            const empSearch_ovs_ep7 = search.createColumn({ name: 'custentity_ovs_ep7'});
            const empSearch_ordenes_a_excluir = search.createColumn({ name: 'custentity_ordenes_a_excluir'});
            
            
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
                    //employeeSearchReclutadoraInternalId,
                    empSearchtiponombramiento,
                    empSearchnombradopor,
                    empSearchfechanombramiento,
                    empSearchFchaInicLeJr,
                    empSearchFechaComisionableJtl,
                    empSearchInicioMaestria,
                    empSearchPeriodoPagoJtl,
                    empSearchPeriodoPagoNLE,
                    empSearchTipoIngreso,
                    empSearchTipoReingreso,
                    empSearchStatusTMSB,
                    empSearchEptm7,
                    empSearchEptm7_inicio,
                    empSearchEptm7_fin,
                    empSearchfecha_tm7_ganada,
                    empSearch_so_ganotm7,
                    empSearch_ovs_ep7,
                    empSearch_ordenes_a_excluir
                ],
            });
            
            var allPresentadorData = {} //Todos los datos de todos los presentadores activos arreglo[presentadora] = {obj1:20/01/2024, conf: CC01...}
            var empGrupos = {} //Arreglo de lideres de equipo y sus integrantes arreglo[liderGrupo] = [integrante1,integrante2...]
            var empReclutas = {}//Arreglo de presentadores y sus reclutados arreglo[Reclutadora] = [reclutada1,reclutada2...]
            var nombradsPor={}//arreglo de presentadoras (tipo nombramiento 4)
            var nombradsPorJTL={} // arreglo de nuevos JTL nombrados por líder (tipo nombramiento 3)
            var presentadorasTMSB = []//arreglo de presentadoras tipo de ingreso tm sin barreras
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
                    //objEMP.reclutadoraID = r.getValue({ name: 'internalid', join: 'custentity_reclutadora' })
                    objEMP.tipoNombramento = r.getValue('custentity_nombramiento_le')
                    objEMP.nombramientoPor = r.getValue('custentity_nombramiento')
                    objEMP.fechaNombramiento = r.getValue('custentity_fecha_nombramiento')
                    /** Fecha efectiva de inicio nombramiento JTL (reemplaza a custentity_fecha_nombramiento para reglas JTL). */
                    objEMP.fechaInicioLeJr = r.getValue('custentity_fcha_inic_le_jr')
                    /** Fecha inicio JTL comisionable (solo Bono LE Calificación JTL para la líder). */
                    objEMP.fechaComisionableJtl = r.getValue('custentity_fecha_comisionable_jtl')
                    /** Fecha de inicio elegibilidad Maestría (para exigir 3 meses consecutivos disponibles). */
                    objEMP.inicioMaestria = r.getValue('custentity_inicio_maestria')
                    objEMP.periodoPagoJtl = r.getValue('custentity_periodo_pago_jtl')
                    objEMP.periodoPagoNLE = r.getValue('custentityperiodo_nle_pago')
                    objEMP.tipoIngreso = r.getValue('custentity_tipo_ingreso')
                    objEMP.tipoReingreso = r.getValue('custentity_vorwerk_reentry')
                    objEMP.statusTMSB = r.getValue('custentity_estatus_tm_sinbarreras')
                    objEMP.epTm7 = r.getValue('custentity_checkbox_eptm7')
                    objEMP.epTm7_inicio = r.getValue('custentity_fcha_inicio_eptm7')
                    objEMP.epTm7_fin = r.getValue('custentity_fcha_fin_eptm7')
                    objEMP.fechatm7_ganada = r.getValue('custentity_fechatm7_ganada')
                    objEMP.so_ganotm7 = r.getValue('custentity_so_ganotm7')
                    objEMP.ovs_ep7 = r.getValue('custentity_ovs_ep7')
                    objEMP.custentity_ordenes_a_excluir = r.getValue('custentity_ordenes_a_excluir')
                    

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

                    if(objEMP.nombramientoPor != '' && objEMP.tipoNombramento == 4){
                        try {
                            // Convertir fecha de nombramiento a objeto Date
                            var fechaNombramientoArr = objEMP.fechaNombramiento;
                            //log.debug('fechaNombramientoArr 1',fechaNombramientoArr)

                            fechaNombramientoArr = Utils.stringToDate(fechaNombramientoArr)
                            /*log.debug('fechaNombramientoArr',fechaNombramientoArr)
                            log.debug('inicioTresPeriodosAntes',inicioTresPeriodosAntes)
                            log.debug('finPeriodo_sdp',finPeriodo_sdp)*/
                            if(fechaNombramientoArr >= inicioTresPeriodosAntes && fechaNombramientoArr <= finPeriodo_sdp) {
                                if(nombradsPor.hasOwnProperty(objEMP.nombramientoPor)){
                                    nombradsPor[objEMP.nombramientoPor].push(objEMP.internalid);
                                } else {
                                    nombradsPor[objEMP.nombramientoPor] = [objEMP.internalid];
                                }
                            }
                            
                        } catch(e) {
                            log.error('Error validando fecha de nombramiento', e);
                        }
                    }
                    if (objEMP.nombramientoPor != '' && objEMP.tipoNombramento == 3 && !jtlPeriodoPagoCalificacionRegistrado(objEMP.periodoPagoJtl)) {
                        try {
                            var fechaNombramientoJtl = jtlNormalizarFechaPeriodo(objEMP.fechaInicioLeJr);
                            if (fechaNombramientoJtl && fechaNombramientoJtl >= inicioTresPeriodosAntes && fechaNombramientoJtl <= finPeriodo_sdp) {
                                if (nombradsPorJTL.hasOwnProperty(objEMP.nombramientoPor)) {
                                    nombradsPorJTL[objEMP.nombramientoPor].push(objEMP.internalid);
                                } else {
                                    nombradsPorJTL[objEMP.nombramientoPor] = [objEMP.internalid];
                                }
                            }
                        } catch (e) {
                            log.error('Error validando fecha inicio LE JR JTL (tipo 3)', e);
                        }
                    }
                    if(objEMP.tipoIngreso == 14 || objEMP.tipoReingreso == 14){
                
                        presentadorasTMSB.push(objEMP.internalid)
                    }

                });
                      
            });

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
            
            return {allPresentadorData:allPresentadorData,empGrupos:empGrupos,empReclutas:empReclutas,equipoYRecluta:equipoYRecluta,nombramiento:nombradsPor,nombramientoJTL:nombradsPorJTL,presentadorasTMSB:presentadorasTMSB}
        }catch(e){
            log.error('Error en searchDataPresentadoras',e)
        }
    }
    function searchSalesOrders(cust_period,inicioPeriodo,finPeriodo,presentadorasTMSB){
        try{
            const inicioPeriodoDate =  Utils.stringToDate(inicioPeriodo)
            const finPeriodoDate = Utils.stringToDate(finPeriodo)
            var finMenosCinco = Utils.restarMeses(finPeriodo, 5);
            var dHistorico = Utils.restarMeses(inicioPeriodo, 3); //Fecha 3 meses antes del periodo calculado
            log.debug('dHistorico',dHistorico)
            

            try{
                var objTMSB = {};
                var objTmGanada = {}
                var objTmPagada = {}
                const salesOrderFilters = [
                    ['item', 'anyof', '2671','1126','1757','2001','2170','2490','2571','2035','2638','2280'],
                    'AND',
                    ['salesrep.custentity_estructura_virtual', 'is', 'F'],
                    'AND',
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['formulatext: {salesrep}', 'isnotempty', ''],
                    'AND',
                    [
                        [
                            ['salesrep', 'anyof', presentadorasTMSB],
                            'AND',
                            ['custbody_tipo_venta', 'anyof', '2','1'],
                        ],
                        'OR',
                        [
                            ['custbody_presentadora_tm_paga', 'anyof', presentadorasTMSB],
                            'AND',
                            ['custbody_tipo_venta', 'is','19'],
                        ],
                    ]
                    //O TIPO DE VENTA ES 19 Y EL CAMPO PRESENTADORA TM PAGADA ES EL ARREGLO
                ];

                const salesOrderColSalesRep = search.createColumn({ name: 'salesrep' });
                const salesOrderColTranId = search.createColumn({ name: 'tranid' });
                const salesOrderColInternalId = search.createColumn({ name: 'internalid' });
                const salesOrderColTranDate = search.createColumn({ name: 'trandate' });
                const salesOrderColEntity = search.createColumn({ name: 'entity' });
                const salesOrderColTipoVenta = search.createColumn({ name: 'custbody_tipo_venta' });
                const salesOrderColOtroFin = search.createColumn({ name: 'custbody_otro_financiamiento' });
                const salesOrderColComStatus = search.createColumn({ name: 'custbody_vw_comission_status' });
                const salesOrderColTmPagada = search.createColumn({ name: 'custbody_presentadora_tm_paga' });
                const searchSalesTMSB = search.create({
                    type: 'salesorder',
                    filters: salesOrderFilters,
                    columns: [
                        salesOrderColSalesRep,
                        salesOrderColTranId,
                        salesOrderColInternalId,
                        salesOrderColTranDate,
                        salesOrderColEntity,
                        salesOrderColTipoVenta,
                        salesOrderColOtroFin,
                        salesOrderColComStatus,
                        salesOrderColTmPagada
                        
                       
                    ],
                });
                searchSalesTMSB.filters.push(search.createFilter({
                       name: 'trandate',
                       operator: 'within',
                       values: [Utils.dateToString(finMenosCinco),Utils.dateToString(finPeriodoDate)]
                }));
                var pagedResults = searchSalesTMSB.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                        var objSOTMSB = new Object();
                        objSOTMSB.salrep = r.getValue('salesrep')
                        objSOTMSB.tranid = r.getValue('tranid')
                        objSOTMSB.internalid = r.getValue('internalid')
                        objSOTMSB.trandate = r.getValue('trandate')
                        objSOTMSB.entity = r.getValue('entity')
                        objSOTMSB.tipoVenta = r.getValue('custbody_tipo_venta')
                        objSOTMSB.otroFin = r.getValue('custbody_otro_financiamiento')
                        objSOTMSB.comStatus = r.getValue('custbody_vw_comission_status')
                        objSOTMSB.tmPagada = r.getValue('custbody_presentadora_tm_paga')
                        var idSO = {}
                        idSO[objSOTMSB.internalid] = objSOTMSB 
                        
                        // Inicializar arrays si no existen
                        if (!(objSOTMSB.salrep in objTMSB)) {
                            objTMSB[objSOTMSB.salrep] = [];
                        }
                        objTMSB[objSOTMSB.salrep].push(idSO);

                        if (objSOTMSB.tipoVenta == 1 ) {
                            // Inicializar arrays si no existen
                            if (!(objSOTMSB.salrep in objTmGanada)) {
                                objTmGanada[objSOTMSB.salrep] = [];
                            }
                            objTmGanada[objSOTMSB.salrep].push(idSO);
                        } 
                        if( objSOTMSB.tipoVenta == 19){
                            if (!(objSOTMSB.tmPagada in objTmPagada)) {
                                objTmPagada[objSOTMSB.tmPagada] = [];
                            }
                            objTmPagada[objSOTMSB.tmPagada].push(idSO);
                        }
                   });

                });
            }catch(e){
                log.error('error busqueda ventas tmsb',e)
            }


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

            var controlRepeat = {}
            var diagOtroFin = { total: 0, valores: {} };
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
                   
                    // Diagnóstico: ¿custbody_otro_financiamiento viene como ID o texto en custworkbook3?
                    try {
                        diagOtroFin.total++;
                        var raw = r.custbody_otro_financiamiento;
                        var keyDiag = raw == null ? '(null)' : String(raw);
                        if (!diagOtroFin.valores[keyDiag]) {
                            diagOtroFin.valores[keyDiag] = { count: 0, typeof: typeof raw };
                        }
                        diagOtroFin.valores[keyDiag].count++;
                    } catch (ignoreDiag) {}
                    
                    
                    var idSO = {}
                    idSO[objSO.internalid] = objSO 
                    if(dateSO >= inicioPeriodoDate && dateSO <= finPeriodoDate){
                        //log.debug('esta fecha es del periodo calculado',dateSO)
                        if(thisPeriodSO.hasOwnProperty(objSO.salesrep) && controlRepeat[objSO.salesrep].indexOf(objSO.internalid) < 0){
                            thisPeriodSO[objSO.salesrep].push(idSO)
                            controlRepeat[objSO.salesrep].push(objSO.internalid)
                        }else if(!thisPeriodSO.hasOwnProperty(objSO.salesrep)){
                            thisPeriodSO[objSO.salesrep] = [idSO]
                            controlRepeat[objSO.salesrep] = [objSO.internalid]
                        }
                        /*if(objSO.salesrep == '39360'||objSO.salesrep == '12590'){
                            log.debug('ventas propias test1',objSO.internalid)
                            if(objSO.salesrep == '39360'||objSO.salesrep == '12590'){
                               log.debug('r',r) 
                            }
                            log.debug('ventas propias test3',idSO)
                            log.debug('controlRepeat',controlRepeat)
                            log.debug('controlRepeat 2',controlRepeat[objSO.salesrep])
                            log.debug('controlRepeat 3',controlRepeat[objSO.salesrep].indexOf(objSO.internalid))
                            log.debug('thisPeriodSO[objSO.salesrep]',thisPeriodSO[objSO.salesrep])
                            
                        }*/
                    }else if(dateSO < inicioPeriodoDate && objSO.custbody_tipo_venta != 'TM Ganada' && !esVentaCancelacionValor(objSO.custbody_tipo_venta, objSO.custbody_otro_financiamiento)){
                        //log.debug('Esta fecha es Historicio',dateSO)
                        if(historicoSO.hasOwnProperty(objSO.salesrep)){
                            historicoSO[objSO.salesrep].push(idSO)
                        }else{
                            historicoSO[objSO.salesrep] = [idSO]  
                        }
                    }
                });
                      
            });
            try {
                var keys = Object.keys(diagOtroFin.valores);
                keys.sort(function (a, b) {
                    return (diagOtroFin.valores[b].count || 0) - (diagOtroFin.valores[a].count || 0);
                });
                var top = [];
                var i;
                for (i = 0; i < keys.length && i < 25; i++) {
                    var k = keys[i];
                    top.push({ valor: k, count: diagOtroFin.valores[k].count, typeof: diagOtroFin.valores[k].typeof });
                }
                log.audit({
                    title: '[Diag custworkbook3] custbody_otro_financiamiento',
                    details: JSON.stringify({ totalFilas: diagOtroFin.total, distintos: keys.length, topValores: top })
                });
            } catch (ignoreDiag2) {}
            
            return {historicoSO:historicoSO,thisPeriodSO:thisPeriodSO,dHistorico:dHistorico,objGarantiaRep:objGarantiaRep,objCK:objCK,objTMSB:objTMSB,objTmGanada:objTmGanada,objTmPagada:objTmPagada}
        }catch(e){
            log.error('Error en searchSalesOrders',e)
        }
    }
    
    function addFieldsTabla(form,cust_type,cust_promo,cust_period,cust_entrega){
        try{
            var arrayFields = []
            var thidField
            var sublist = form.addSublist({
                id: 'sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Resultados'
            });
               
            //Campos compartidos
            thidField = sublist.addField({
                id: 'select_field',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'select'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            thidField = sublist.addField({
                id : 'custpage_ver_detalle',
                type : serverWidget.FieldType.URL,
                label : 'Ver Detalle'
            });
            thidField.linkText = 'Ver Detalle';

            thidField = sublist.addField({
                id: 'nombre',
                type: serverWidget.FieldType.SELECT,
                source:'employee',
                label: 'Nombre'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});        
            arrayFields.push({idfield : thidField.id, namefield : thidField.label, type:'Text'})

            thidField = sublist.addField({
                id: 'ingreso',
                type: serverWidget.FieldType.TEXT,
                label: 'Compensaciones de Ingreso'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            thidField = sublist.addField({
                id: 'delegadas',
                type: serverWidget.FieldType.TEXT,
                label: 'Delegadas'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label, type:'Text'})
             
            thidField = sublist.addField({
                id: 'reclutadora',
                type: serverWidget.FieldType.SELECT,
                source:'employee',
                label: 'Reclutadora'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label, type:'Text'})
            
            thidField = sublist.addField({
                id: 'hiredate',
                type: serverWidget.FieldType.DATE,
                label: 'Fecha de Contratacion'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
            thidField = sublist.addField({
                id: 'ordenes_extaordinarias',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'GUT Info'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
            thidField = sublist.addField({
                id: 'custpage_monto_ventapropia_extra',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Monto GUT Venta propia'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            thidField = sublist.addField({
                id: 'custpage_monto_prod_extra',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Monto GUT Productividad'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            //Terminan campos compartidos
              

            //Campos Trabaja x TM
            if(cust_promo == 1){//Trabaja X TM
                thidField = sublist.addField({
                   id: 'fecha_reactivacion',
                   type: serverWidget.FieldType.TEXT,
                   label: 'Fecha de Reactivacion'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            }

            //Campos Compartidos
            thidField = sublist.addField({
                id: 'custentity_nombre_unidad',
                type: serverWidget.FieldType.TEXT,
                label: 'Unidad'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
            thidField = sublist.addField({
                id: 'custentity_odv_jdg',
                type: serverWidget.FieldType.TEXT,
                label: 'Ventas TM ó Ventas CK'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
               
            thidField = sublist.addField({
                id: 'custentity_odv_jdg_ids',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'ID ODV PROPIAS'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
            thidField = sublist.addField({
                id: 'custentity_cookkey',
                type: serverWidget.FieldType.TEXT,
                label: 'Cook Key'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
            thidField = sublist.addField({
                id: 'custentity_cookkey_comision',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Comision Cook Key'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            thidField = sublist.addField({
                id: 'custentity_bono_nombramiento_jtl',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Bono Calificación JTL'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            thidField = sublist.addField({
                id: 'custentity_bono_nombramiento_jtl_det',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Detalle Bono Calificación JTL'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            thidField = sublist.addField({
                id: 'custentity_bono_jtl_2mas1',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Bono JTL programa 2+1'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            thidField = sublist.addField({
                id: 'custentity_bono_jtl_2mas1_det',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Detalle Bono JTL 2+1'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            thidField = sublist.addField({
                id: 'custentity_bono_jtl_maestria',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Bono JTL Maestría'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            thidField = sublist.addField({
                id: 'custentity_bono_jtl_maestria_det',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Detalle Bono JTL Maestría'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            //Fin Campos Compartidos
            
            //Campos Tm Propia
            if(cust_promo != 1){
                thidField = sublist.addField({
                    id: 'custentity_venta_propia',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Venta Propia'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
               
                thidField = sublist.addField({
                    id: 'custentity_entrega',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Entrega'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                 
                thidField = sublist.addField({
                    id: 'custentity_bono_productividad',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Bono de Productividad'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                   
                thidField = sublist.addField({
                    id: 'custentity_bono_emerald',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Bono JOYA'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
                thidField = sublist.addField({
                    id: 'custentity_garantia_num',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Garantia Num'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
                thidField = sublist.addField({
                    id: 'custentity_garantia_monto',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Garantia Monto'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
                thidField = sublist.addField({
                    id: 'custentity_monto_ventapropia_tmsb',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Bono Venta Propia TMSB'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id: 'custentity_monto_productividad_tmsb',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Bono Productividad TMSB'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id: 'custentity_data_productividad_tmsb',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ODV TM SIN BARRERAS'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id: 'custentity_bono_garantia_ids',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Garantia ids'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            }//Fin Campos Tm Propia
               
            //Campos compartidos
            thidField = sublist.addField({
                id: 'custentity_reclutas',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Reclutas'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
              
            thidField = sublist.addField({
                id: 'custentity_odv_rec',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'ODV Reclutas Comisionables'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
             
            thidField = sublist.addField({
                id: 'custentity_bono_rec',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Bono Reclutadora'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
           /* thidField = sublist.addField({
                id: 'custentity_bono_rec4a_venta',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Bono Reclutamiento Especial 4a Venta'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            thidField = sublist.addField({
                id: 'custentity_odv_rec4a_venta',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'ODV Reclutamiento Especial 4a Venta'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})*/
            //Fin campos compartidos
            
            //Campos Trabaja x TM
            if(cust_promo == 1){
                thidField = sublist.addField({
                    id: 'custentity_ck',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'CK'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            }
               
               
            //Campos JDG - Lideres de equipo
            if (cust_type == 3) {
                
                thidField = sublist.addField({
                    id : 'custentity_presentadoras',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Presentadoras Equipo'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})

                thidField = sublist.addField({
                    id : 'custentity_odv_pre',
                    type : serverWidget.FieldType.TEXT,
                    label : 'Numero de ventas Equipo'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                
                thidField = sublist.addField({
                    id: 'custentity_odv_equipo',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ODV Equipo'
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                       
                thidField = sublist.addField({
                    id : 'custentity_porcentaje',
                    type : serverWidget.FieldType.TEXT,
                    label : '%'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                 
                thidField = sublist.addField({
                    id : 'custentity_venta_equipo',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Venta Equipo'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
            
                thidField = sublist.addField({
                    id : 'custentity_lider_nle',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'NLE'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                //Bono Nuevo Recluta
                thidField = sublist.addField({
                    id : 'custentity_monto_nuevo_recluta',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono Nuevo Recluta'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id : 'custentity_no_activos_rec',
                    type : serverWidget.FieldType.TEXT,
                    label : 'Numero de Reclutas Activos'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                thidField = sublist.addField({
                    id : 'custentity_nuevo_recluta_activos',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Reclutas Activos'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                // BONO INACTIVADO (UI): Bono Actividad
                // thidField = sublist.addField({
                //     id : 'custentity_monto_actividad',
                //     type : serverWidget.FieldType.CURRENCY,
                //     label : 'Bono Actividad'
                // }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                // arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                // thidField = sublist.addField({
                //     id : 'custentity_no_activos',
                //     type : serverWidget.FieldType.TEXT,
                //     label : 'Numero de Integrantes Activos'
                // }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                // arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                // thidField = sublist.addField({
                //     id : 'custentity_integrantes_activos',
                //     type : serverWidget.FieldType.TEXTAREA,
                //     label : 'Integrantes Activos'
                // }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                // arrayFields.push({idfield : thidField.id, namefield : thidField.label}) 
                thidField = sublist.addField({
                    id : 'custentity_bono_pool_talent',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono Pool Talent'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id : 'custentity_bono_pool_talent_det',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Detalle Bono Pool Talent'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id : 'custentity_bono_le_maestria',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono Maestría LE (3× 3+2 consecutivos)'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id : 'custentity_bono_le_maestria_det',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Detalle Bono Maestría LE'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id : 'custentity_bono_le_nombramiento_jtl',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono LE Calificación JTL'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                thidField = sublist.addField({
                    id : 'custentity_bono_le_nombramiento_jtl_det',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'Detalle Bono LE Calificación JTL'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                /*thidField = sublist.addField({
                    id : 'custentity_nle_monto',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono NLE'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})*/
            
                // BONO INACTIVADO (UI): X+2 NLE / BONO 3+2 NLE / BONO 5+2 NLE
                // thidField = sublist.addField({
                //     id : 'custentity_xmasdos_nle',
                //     type : serverWidget.FieldType.TEXT,
                //     label : 'X + 2 NLE'
                // }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                // arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                //  
                // thidField = sublist.addField({
                //     id : 'custentity_tresmasdos_nle_monto',
                //     type : serverWidget.FieldType.CURRENCY,
                //     label : 'BONO 3 + 2 NLE'
                // }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                // arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                // 
                // thidField = sublist.addField({
                //     id : 'custentity_cincomasdos_nle_monto',
                //     type : serverWidget.FieldType.CURRENCY,
                //     label : 'BONO 5 + 2 NLE'
                // }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                // arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                // 3+2 directo de la líder (bonoXmasDos → fillTable tipoReporteGloobal === 1). Distinto de «BONO 3+2 NLE» (bonoXmasdosNLE).
                thidField = sublist.addField({
                    id : 'custentity_odv_rec_del_periodo',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'ODV / equipo (detalle 3+2 líder)'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})

                thidField = sublist.addField({
                    id: 'custentity_rec_con_ventas',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Reclutas con ventas (3+2 líder)'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})

                thidField = sublist.addField({
                    id : 'custentity_bono_tres_dos',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono 3 + 2 (líder)'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})

                thidField = sublist.addField({
                    id: 'custentity_detalle_bono_tres_dos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Detalle compensación 3+2 líder (JSON)'
                }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
                arrayFields.push({ idfield: thidField.id, namefield: thidField.label });

                /*thidField = sublist.addField({
                    id : 'custentity_bono_cinco_dos',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono 5 + 2 (líder)'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})*/
                // Fin Campos 3+2 líder (5+2 directo líder sigue sin columna: fillTable no vuelca monto52)
                    
                // Super Comision 
                /*thidField = sublist.addField({
                    id : 'custentity_odv_pre_supercomision',
                    type : serverWidget.FieldType.TEXTAREA,
                    label : 'ODV Por recluta del mes del Equipo SC'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
               
                thidField = sublist.addField({
                    id: 'custentity_ventas_sc',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Numero de ventas SC'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})
                
                thidField = sublist.addField({
                    id : 'custentity_bono_sc',
                    type : serverWidget.FieldType.CURRENCY,
                    label : 'Bono SUPERCOMISIÓN'
                }).updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
                arrayFields.push({idfield : thidField.id, namefield : thidField.label})*/
                //Fin Campos Super Comision
                    
            }// Fin Campos JDG - Lideres de equipo

            // Campos Compartidos
              
            thidField = sublist.addField({
                id: 'custentity_total',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            arrayFields.push({idfield : thidField.id, namefield : thidField.label})

            /*var custpage_sublis_fields = form.getField({ id:'custpage_sublis_fields'});
                custpage_sublis_fields.defaultValue =JSON.stringify(arrayFields) ;*/

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