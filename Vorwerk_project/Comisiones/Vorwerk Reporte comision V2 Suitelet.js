/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'], 
    function(plugin,task, serverWidget, search, runtime,file,Utils){
  
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
            Utils.getLog('este es un argumento desde reporte de comisiones V2')
            var form = createForm();
        
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
                        sublista(form,cust_type,cust_promo,cust_period,cust_entrega);
                        
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

   
    function sublista(form,cust_type,cust_promo,cust_period,cust_entrega){
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

            log.debug('historicoSO',historicoSO)
            log.debug('thisPeriodSO',thisPeriodSO)
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
            //Extraer miembros de X reclutadora o jdg
            var reclutasdeX=listaReclutas['23170']
            log.debug('reclutasdeX', reclutasdeX)
            
            
           return form;
          
        }catch(e){
          log.debug("error sublista",e)
          log.debug('creditos 2',runtime.getCurrentScript().getRemainingUsage()); 
        }   
    }//Fin sublista
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
            log.debug('empReclutas',empReclutas)
            log.debug('empGrupos',empGrupos)
            log.debug('allPresentadorData',allPresentadorData)

            var equipoYRecluta = {}



            for(i in empReclutas){//Se recorren los presentadores 
               
               if(empGrupos.hasOwnProperty(i)){
                 log.debug('empReclutas[i]',empReclutas[i])
                 log.debug('i',i)
                 log.debug('empGrupos[i]',empGrupos[i])
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
            log.debug('equipoYRecluta',equipoYRecluta)

            
            return {allPresentadorData:allPresentadorData,empGrupos:empGrupos,empReclutas:empReclutas,equipoYRecluta:equipoYRecluta}
        }catch(e){
            log.error('Error en searchDataPresentadoras',e)
        }
    }
    function searchSalesOrders(cust_period,inicioPeriodo,finPeriodo){
        try{
            const inicioPeriodoDate =  stringToDate(inicioPeriodo)
            const finPeriodoDate = stringToDate(finPeriodo)
            var dHistorico = restarMeses(inicioPeriodo, 3); //Fecha 3 meses antes del periodo calculado

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
                /*'AND',
                ['internalid', 'anyof', ['5100520','5397195','5424977']],*/
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
                    salesOrderSearchColinternalid
                ],
            });

            var historicoSO = {}
            var thisPeriodSO = {}

            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                    var dateSO = stringToDate(r.getValue('trandate'))
                   
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

            
            return {historicoSO:historicoSO,thisPeriodSO:thisPeriodSO}
        }catch(e){
            log.error('Error en searchSalesOrders',e)
        }
    }
    function dateToString(fecha){//Se espera "2023-09-30T07:00:00.000Z"
        // Verificar si la entrada es un objeto Date
        if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
            console.error('La fecha proporcionada no es válida.');
            return null; 
        }

        // Obtener los componentes de la fecha
        const dia = fecha.getDate().toString();
        const mes = (fecha.getMonth() + 1).toString(); // Se suma 1 porque los meses van de 0 a 11
        const ano = fecha.getFullYear();

        // Construir la cadena en formato dd/mm/yyyy
        const fechaFormateada = dia+'/'+mes+'/'+ano;

        return fechaFormateada;
    }
    function stringToDate(fechaString) {
        // Verificar si la cadena de fecha es nula o indefinida
        fechaString = fechaString.toString();
        if (!fechaString) {
            log.error('La cadena de fecha proporcionada es nula o indefinida.');
            return null; 
        }

        // Detectar el formato de la cadena de fecha
        var partesFecha;
        if (fechaString.indexOf('/') || fechaString.indexOf('-')) {
            partesFecha = fechaString.split(/\/|-/); // Utilizar una expresión regular para admitir ambos separadores
        } else {
            console.error('Formato de fecha no compatible. Use dd/mm/yyyy o yyyy/mm/dd.');
            return null;
        }
        // Verificar si el formato es yyyy/mm/dd o dd/mm/yyyy
        var ano, mes, dia;
        if (partesFecha[0].length === 4) {
            ano = partesFecha[0];
            mes = partesFecha[1];
            dia = partesFecha[2];
        } else {
            ano = partesFecha[2];
            mes = partesFecha[1];
            dia = partesFecha[0];
        }

        // Convertir a formato de fecha yyyy/mm/dd
        var fecha = new Date(ano+'/'+mes+'/'+dia);

        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            log.error('La fecha proporcionada no es válida.');
            return null;
        }

        // Clonar la fecha para evitar modificar la fecha original
        const nuevaFecha = new Date(fecha);


        return nuevaFecha;
    }
    function restarMeses(fechaString, cantidadMeses) {
        
        const nuevaFecha = stringToDate(fechaString)
        
        // Restar la cantidad de meses
        nuevaFecha.setMonth(nuevaFecha.getMonth() - cantidadMeses);

        return nuevaFecha;
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