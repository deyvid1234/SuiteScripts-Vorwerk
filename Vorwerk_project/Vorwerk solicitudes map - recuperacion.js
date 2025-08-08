/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/format','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

function(search,record,format,Utils) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        var solicitudesSearch = search.load({
            id: 'customsearch_solicitudes_recurrentes' 
        });
        
        return solicitudesSearch;
        
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        try{
            var registeInfo = JSON.parse(context.value);
            log.debug('registeInfo',registeInfo)
            var aprovalStatus = registeInfo.values.approvalstatus.value
            log.debug('aprovalStatus',aprovalStatus)
            var idRequisitionPrincipal =  registeInfo.id
            log.debug('idRequisitionPrincipal',idRequisitionPrincipal)
            var estimatedtotal =  registeInfo.values.estimatedtotal
            var solicitante = registeInfo.values.entity.value
            var campaña = registeInfo.values.custbody_camp.value
            log.debug('campaña',campaña)
            
            // Fechas de recuperación: del 21 de julio al 6 de agosto
            var fechaInicioRecuperacion = new Date(2025, 6, 21); // 21 de julio (mes 6 = julio)
            var fechaFinRecuperacion = new Date(2025, 7, 6);     // 6 de agosto (mes 7 = agosto)
            
            log.debug('fechaInicioRecuperacion', Utils.dateToString(fechaInicioRecuperacion))
            log.debug('fechaFinRecuperacion', Utils.dateToString(fechaFinRecuperacion))
            
            if(aprovalStatus == '2'){
                var metodoRepeticion = registeInfo.values.custbody_metodo_repeticion.value
                
                // Excluir la solicitud con ID 6541860
                if(idRequisitionPrincipal == 6541860) {
                    log.debug('Excluyendo solicitud 6541860 del procesamiento de fechas perdidas');
                } else {
                    switch(metodoRepeticion){
                    case '1':
                        
                        var arregloFechas = []
                        var periodo = registeInfo.values.custbody_repetir_cada.value
                        var noRepeticiones = registeInfo.values.custbody_no_repeticiones
                            noRepeticiones = parseInt(noRepeticiones)
                        var aPartir = registeInfo.values.custbody_a_partir
                        var ano = aPartir.split('/')[2]
                        var mes = aPartir.split('/')[1]
                            mes = parseInt(mes)-1
                        var dia = aPartir.split('/')[0]
                        var datetoWork = new Date(ano,mes,dia) 
                    
                        if(periodo == 2){//mes
                            arregloFechas.push(aPartir)
                            for (var i = 1; i < noRepeticiones; i++) {
                                
                                datetoWork.setMonth(datetoWork.getMonth() + 1);
                                var fechaPeriodo = new Date(datetoWork);
                                arregloFechas.push(Utils.dateToString(fechaPeriodo));
                            }
                            log.debug('arregloFechas',arregloFechas)
                            
                            // Procesar fechas perdidas (solo validación)
                            procesarFechasPerdidas(arregloFechas, fechaInicioRecuperacion, fechaFinRecuperacion, solicitante, idRequisitionPrincipal, estimatedtotal, 'mes')

                        } else if(periodo == 1){//semana
                            arregloFechas.push(aPartir)
                            for (var i = 1; i < noRepeticiones; i++) {
                                
                                datetoWork.setDate(datetoWork.getDate() + 7);
                                var fechaPeriodo = new Date(datetoWork);
                                arregloFechas.push(Utils.dateToString(fechaPeriodo));
                            }
                            log.debug('arregloFechas',arregloFechas)
                            
                            // Procesar fechas perdidas (solo validación)
                            procesarFechasPerdidas(arregloFechas, fechaInicioRecuperacion, fechaFinRecuperacion, solicitante, idRequisitionPrincipal, estimatedtotal, 'semana')
                            
                        }                     
                        
                    break;
                    case '2':
                        var arregloFechas = []
                        
                        var fecha1 = registeInfo.values.custbody_fechas_personalizadas
                        arregloFechas.push(fecha1)
                        var fecha2 = registeInfo.values.custbody_fecha_personalizada_2
                        arregloFechas.push(fecha2)
                        var fecha3 = registeInfo.values.custbody_fecha_personalizada_3
                        arregloFechas.push(fecha3)
                        var fecha4 = registeInfo.values.custbody_fecha_personalizada_4
                        arregloFechas.push(fecha4)
                        var fecha5 = registeInfo.values.custbody_fecha_personalizada_5
                        arregloFechas.push(fecha5)
                        var fecha6 = registeInfo.values.custbody_fecha_personalizada_6
                        arregloFechas.push(fecha6)
                        var fecha7 = registeInfo.values.custbody_fecha_personalizada_7
                        arregloFechas.push(fecha7)
                        var fecha8 = registeInfo.values.custbody_fecha_personalizada_8
                        arregloFechas.push(fecha8)
                        var fecha9 = registeInfo.values.custbody_fecha_personalizada_9
                        arregloFechas.push(fecha9)
                        var fecha10 = registeInfo.values.custbody_fecha_personalizada_10
                        arregloFechas.push(fecha10)
                        var fecha11 = registeInfo.values.custbody_fecha_personalizada_11
                        arregloFechas.push(fecha11)
                        var fecha12 = registeInfo.values.custbody_fecha_personalizada_12
                        arregloFechas.push(fecha12)

                        log.debug('arregloFechas',arregloFechas)
                        
                        // Procesar fechas perdidas (solo validación)
                        procesarFechasPerdidas(arregloFechas, fechaInicioRecuperacion, fechaFinRecuperacion, solicitante, idRequisitionPrincipal, estimatedtotal, 'personalizadas')
                        
                    break;
                    case '3':
                        var arregloFechas = []
                        var noRepeticiones = registeInfo.values.custbody_no_repeticiones
                            noRepeticiones = parseInt(noRepeticiones)
                        var cadaNoDias = registeInfo.values.custbody_dias
                            cadaNoDias = parseInt(cadaNoDias)
                        var aPartir = registeInfo.values.custbody_a_partir
                        var ano = aPartir.split('/')[2]
                        var mes = aPartir.split('/')[1]
                            mes = parseInt(mes)-1
                        var dia = aPartir.split('/')[0]
                        var datetoWork = new Date(ano,mes,dia)
                        arregloFechas.push(aPartir)

                        for (var i = 1; i < noRepeticiones; i++) {
                            
                            datetoWork.setDate(datetoWork.getDate() + cadaNoDias);
                            var fechaPeriodo = new Date(datetoWork);
                            arregloFechas.push(Utils.dateToString(fechaPeriodo));
                        }
                        log.debug('arregloFechas dias',arregloFechas)
                        
                        // Procesar fechas perdidas (solo validación)
                        procesarFechasPerdidas(arregloFechas, fechaInicioRecuperacion, fechaFinRecuperacion, solicitante, idRequisitionPrincipal, estimatedtotal, 'dias')
                        
                    break;

                    }
                }
                
            }   
            
           
        }catch(err){
            log.error("err map",err);
        }
        
        /**
         * Procesa las fechas perdidas en el período de recuperación (solo validación)
         */
        function procesarFechasPerdidas(arregloFechas, fechaInicio, fechaFin, solicitante, idRequisitionPrincipal, estimatedtotal, tipoRepeticion) {
            try {
                var fechasPerdidas = [];
                
                for (var i in arregloFechas) {
                    if(arregloFechas[i] != '' && arregloFechas[i] != null) {
                        var fechaFormato = arregloFechas[i];
                        
                        // Convertir la fecha del string a objeto Date para comparación
                        var fechaArray = fechaFormato.split('/');
                        var dia = parseInt(fechaArray[0]);
                        var mes = parseInt(fechaArray[1]) - 1; // Mes en JS es 0-based
                        var ano = parseInt(fechaArray[2]);
                        var fechaComparar = new Date(ano, mes, dia);
                        
                        // Verificar si la fecha está en el período de recuperación
                        if (fechaComparar >= fechaInicio && fechaComparar <= fechaFin) {
                            log.debug('Fecha perdida encontrada: ' + fechaFormato + ' (tipo: ' + tipoRepeticion + ')');
                            
                            // CREAR LA COPIA Y LA PO
                            try {
                                var idCopy = makeCopy(solicitante, idRequisitionPrincipal,campaña);
                                log.debug('Copia creada para fecha perdida ' + fechaFormato + ' - ID: ' + idCopy);

                                var idPO = transformPO(solicitante, idCopy, estimatedtotal);
                                log.debug('PO creada para fecha perdida ' + fechaFormato + ' - ID: ' + idPO);
                                
                                // Crear objeto con la información de la fecha perdida (incluyendo los IDs creados)
                                var fechaPerdidaInfo = {
                                    idRequisitionPrincipal: idRequisitionPrincipal,
                                    solicitante: solicitante,
                                    fechaPerdida: fechaFormato,
                                    tipoRepeticion: tipoRepeticion,
                                    estimatedtotal: estimatedtotal,
                                    idCopiaCreada: idCopy,
                                    idPOCreada: idPO
                                };
                                
                            } catch(creationError) {
                                log.error('Error al crear copia/PO para fecha ' + fechaFormato, creationError);
                                
                                // Crear objeto con la información de la fecha perdida (sin IDs por error)
                                var fechaPerdidaInfo = {
                                    idRequisitionPrincipal: idRequisitionPrincipal,
                                    solicitante: solicitante,
                                    fechaPerdida: fechaFormato,
                                    tipoRepeticion: tipoRepeticion,
                                    estimatedtotal: estimatedtotal,
                                    error: creationError.message
                                };
                            }
                            
                            // Escribir al contexto para que llegue al reduce
                            context.write({
                                key: 'fechas_perdidas',
                                value: JSON.stringify(fechaPerdidaInfo)
                            });
                            
                            fechasPerdidas.push(fechaFormato);
                        }
                    }
                }
                
                log.debug('Fechas perdidas procesadas para requisición ' + idRequisitionPrincipal + ' (' + tipoRepeticion + ')', fechasPerdidas);
                
            } catch(e) {
                log.error('error al procesar fechas perdidas', e);
            }
        }
        
        function transformPO(solicitante,idCopy,estimatedtotal){
            try{
                var transformToSO = record.transform({
                    fromType: 'purchaserequisition',
                    fromId: idCopy,
                    toType: 'purchaseorder',
                    isDynamic: true,
                });
                transformToSO.setValue({
                    fieldId: 'employee',
                    value: solicitante
                });
                /*transformToSO.setValue({
                    fieldId: 'total',
                    value: parseInt(estimatedtotal)
                });*/
                var idPO = transformToSO.save()
                return idPO;
            }catch(e){
                log.error('error al transformar la requisicion a po',e)
            }
        } 
        function makeCopy(solicitante,idRequisition,campaña){
            try{
                var idCampaña 
                if(campaña){
                    idCampaña = campaña
                }else{
                    idCampaña = 4
                }
                log.debug('idCampaña',idCampaña)
                log.debug('entrando funcion makecopy',solicitante )
                log.debug('req id',idRequisition )
                var requisitionCopy = record.copy({
                    type: 'purchaserequisition',
                    id: idRequisition,
                    isDynamic: true,
                    
                });
                log.debug('requisitionCopy',requisitionCopy)
                requisitionCopy.setValue({
                    fieldId: 'custbody_createdfrom_plantilla',
                    value: true
                });
                requisitionCopy.setValue({
                    fieldId: 'entity',
                    value: solicitante
                });
                requisitionCopy.setValue({
                    fieldId: 'approvalstatus',
                    value: 2
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_camp',
                    value: idCampaña
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_dias',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_a_partir',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_repetir_cada',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_solicitud_recurrente_contrato',
                    value: false
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_metodo_repeticion',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_no_repeticiones',
                    value: ''  
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fechas_personalizadas',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_2',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_3',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_4',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_5',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_6',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_7',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_8',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_9',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_10',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_11',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_12',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_total_solicitud_recurrente',
                    value: ''
                });
                log.debug('requisitionCopy fin ',requisitionCopy)
                var id_copy = requisitionCopy.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                  });
                
                log.debug('id_copy',id_copy)
                return id_copy;

            }catch(e){
                log.error('error al hacer la copia de la requisicion',e)
            }
        }
        

        
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        log.debug("reduce",context);
        
        // Recolectar todas las fechas perdidas del map
        var fechasPerdidas = [];
        
        for (var i = 0; i < context.values.length; i++) {
            try {
                var fechaPerdidaInfo = JSON.parse(context.values[i]);
                fechasPerdidas.push(fechaPerdidaInfo);
            } catch(e) {
                log.error('Error al parsear fecha perdida en reduce:', e);
            }
        }
        
        // Escribir el resultado al contexto para el summarize
        context.write({
            key: 'resumen_fechas_perdidas',
            value: JSON.stringify(fechasPerdidas)
        });
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.debug("=== RESUMEN DE FECHAS PERDIDAS ===");
        
        // Recopilar todas las fechas perdidas del contexto
        var fechasPerdidasGlobal = [];
        
        // Procesar los resultados del map
        if (summary.mapSummary && summary.mapSummary.errors) {
            log.debug("Errores en map:", summary.mapSummary.errors);
        }
        
        // Procesar los resultados del reduce
        if (summary.reduceSummary && summary.reduceSummary.errors) {
            log.debug("Errores en reduce:", summary.reduceSummary.errors);
        }
        
        // Obtener las fechas perdidas del reduce
        if (summary.reduceSummary && summary.reduceSummary.output) {
            for (var i = 0; i < summary.reduceSummary.output.length; i++) {
                var output = summary.reduceSummary.output[i];
                if (output.key === 'resumen_fechas_perdidas') {
                    try {
                        var fechasPerdidas = JSON.parse(output.value);
                        fechasPerdidasGlobal = fechasPerdidas;
                    } catch(e) {
                        log.error('Error al parsear resumen de fechas perdidas:', e);
                    }
                }
            }
        }
        
        log.debug("Total de fechas perdidas procesadas", fechasPerdidasGlobal.length);
        
        if (fechasPerdidasGlobal.length > 0) {
            log.debug("Detalle completo de fechas perdidas procesadas:", JSON.stringify(fechasPerdidasGlobal, null, 2));
            
            // Contadores de creación exitosa
            var copiasCreadas = 0;
            var posCreadas = 0;
            var errores = 0;
            
            // Agrupar por tipo de repetición
            var resumenPorTipo = {};
            for (var i = 0; i < fechasPerdidasGlobal.length; i++) {
                var item = fechasPerdidasGlobal[i];
                
                // Contar creaciones exitosas
                if (item.idCopiaCreada) copiasCreadas++;
                if (item.idPOCreada) posCreadas++;
                if (item.error) errores++;
                
                // Agrupar por tipo
                if (!resumenPorTipo[item.tipoRepeticion]) {
                    resumenPorTipo[item.tipoRepeticion] = 0;
                }
                resumenPorTipo[item.tipoRepeticion]++;
            }
            
            log.debug("=== RESUMEN DE CREACIÓN ===");
            log.debug("Copias de solicitudes creadas:", copiasCreadas);
            log.debug("Órdenes de compra creadas:", posCreadas);
            log.debug("Errores durante la creación:", errores);
            log.debug("Resumen por tipo de repetición:", resumenPorTipo);
            
            // Mostrar IDs únicos de solicitudes
            var idsUnicos = [];
            for (var j = 0; j < fechasPerdidasGlobal.length; j++) {
                if (idsUnicos.indexOf(fechasPerdidasGlobal[j].idRequisitionPrincipal) === -1) {
                    idsUnicos.push(fechasPerdidasGlobal[j].idRequisitionPrincipal);
                }
            }
            log.debug("IDs únicos de solicitudes recurrentes procesadas:", idsUnicos);
            
            // Mostrar IDs de copias y PO's creadas
            var idsCopias = [];
            var idsPOs = [];
            for (var k = 0; k < fechasPerdidasGlobal.length; k++) {
                var item = fechasPerdidasGlobal[k];
                if (item.idCopiaCreada) idsCopias.push(item.idCopiaCreada);
                if (item.idPOCreada) idsPOs.push(item.idPOCreada);
            }
            log.debug("IDs de copias de solicitudes creadas:", idsCopias);
            log.debug("IDs de órdenes de compra creadas:", idsPOs);
            
        } else {
            log.debug("No se encontraron fechas perdidas en el período especificado");
        }
        
        log.debug("summary",summary);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
}); 