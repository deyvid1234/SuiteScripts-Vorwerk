/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/format','N/currency','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

    function(search,record,format,currency,Utils) {
    
        /**
         * Recuperación: fechas en las que sí crear copia + PO (mismo formato que Utils.dateToString: d/m/yyyy).
         * Dejar [] para el comportamiento normal: solo el día de ejecución del MR (fecha == hoy).
         */
        var FECHAS_RECUPERACION_CREAR = [];
    
        function normalizarFechaDMY(s) {
            if (s == null || s === '') {
                return '';
            }
            s = String(s).trim();
            var p = s.split('/');
            if (p.length !== 3) {
                return s;
            }
            return parseInt(p[0], 10) + '/' + parseInt(p[1], 10) + '/' + parseInt(p[2], 10);
        }
    
        function debeEjecutarEnFecha(fechaFormato, todayStr) {
            var fNorm = normalizarFechaDMY(fechaFormato);
            if (FECHAS_RECUPERACION_CREAR && FECHAS_RECUPERACION_CREAR.length > 0) {
                for (var i = 0; i < FECHAS_RECUPERACION_CREAR.length; i++) {
                    if (normalizarFechaDMY(FECHAS_RECUPERACION_CREAR[i]) === fNorm) {
                        return true;
                    }
                }
                return false;
            }
            return fNorm === normalizarFechaDMY(todayStr);
        }
    
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
                var today = new Date
              log.debug('today fecha',today)
                today = Utils.dateToString(today)
                log.debug('today string',today) 
                //today = '5/8/2025'
                if(aprovalStatus == '2'){
                    var metodoRepeticion = registeInfo.values.custbody_metodo_repeticion.value
                    
                    switch(metodoRepeticion){
                    case '1':
                        
                        var arregloFechas = []
                        var periodo = registeInfo.values.custbody_repetir_cada.value
                        var noRepeticiones = registeInfo.values.custbody_no_repeticiones
                            noRepeticiones = parseInt(noRepeticiones)
                        var fechaFin 
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
                            for (i in arregloFechas){
        
                                var fechaFormato = arregloFechas[i]
                                if(debeEjecutarEnFecha(fechaFormato, today)){
                                    log.debug('hacer copia y transform')
    
                                   var idCopy = makeCopy(solicitante,idRequisitionPrincipal,campaña)
                                    log.debug('idCopy periodos mes',idCopy)
    
                                    var idPO = transformPO(solicitante,idCopy,estimatedtotal)
                                    log.debug('idPO periodos mes',idPO)
                                    
                                }else{
                                    log.debug('n hay que ejecutar hoy')
                                }
                            
                            }
    
                        } else if(periodo == 1){//semana
                            arregloFechas.push(aPartir)
                            for (var i = 1; i < noRepeticiones; i++) {
                                
                                datetoWork.setDate(datetoWork.getDate() + 7);
                                var fechaPeriodo = new Date(datetoWork);
                                arregloFechas.push(Utils.dateToString(fechaPeriodo));
                            }
                            log.debug('arregloFechas',arregloFechas)
                            for (i in arregloFechas){
                            
                                var fechaFormato = arregloFechas[i]
                                if(debeEjecutarEnFecha(fechaFormato, today)){
                                    log.debug('hacer copia y transformsem')
    
                                   var idCopy = makeCopy(solicitante,idRequisitionPrincipal,campaña)
                                    log.debug('idCopy periodos semana',idCopy)
    
                                    var idPO = transformPO(solicitante,idCopy,estimatedtotal)
                                    log.debug('idPO periodos semana',idPO)
                                    
                                }else{
                                    log.debug('n hay que ejecutar hoysem')
                                }
                            
    
                            }
                            
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
                        
                        for (i in arregloFechas){
                            if(arregloFechas[i] != ''){
                                var fechaFormato = arregloFechas[i]
                               
                                if(debeEjecutarEnFecha(fechaFormato, today)){
                                    log.debug('hacer copia y transform')
    
                                    var idCopy = makeCopy(solicitante,idRequisitionPrincipal,campaña)
                                    log.debug('idCopy',idCopy)
    
                                    var idPO = transformPO(solicitante,idCopy,estimatedtotal)
                                    log.debug('idPO',idPO)
                                    
                                    
                                }else{
                                    log.debug('n hay que ejecutar hoy')
                                }
                            }
                            
                        }
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
                        for (i in arregloFechas){
    
                            var fechaFormato = arregloFechas[i]
                            if(debeEjecutarEnFecha(fechaFormato, today)){
                                log.debug('hacer copia y transform')
    
                                var idCopy = makeCopy(solicitante,idRequisitionPrincipal,campaña)
                                log.debug('idCopy periodos dias',idCopy)
    
                                var idPO = transformPO(solicitante,idCopy,estimatedtotal)
                                log.debug('idPO periodos dias',idPO)
                                
                            }else{
                                log.debug('n hay que ejecutar hoy dias')
                            }
                        
                        }
                        
                    break;
    
                    }
                    
                        
                        //record.copy solicitud, borar check nacer aprobada
                        //odv transform a purchase order, campo con el custom record
                        //guardar en el registro custom fechas, solicitus plantilla, sublista 
                    
                }   
                
               
            }catch(err){
                log.error("err map",err);
            }
    
            function obtenerVendorIdDeRequisicion(rec) {
                var sublists = ['expense', 'item'];
                for (var s = 0; s < sublists.length; s++) {
                    var n = rec.getLineCount({ sublistId: sublists[s] });
                    for (var line = 0; line < n; line++) {
                        var vid = rec.getSublistValue({
                            sublistId: sublists[s],
                            fieldId: 'vendor',
                            line: line
                        });
                        if (vid) {
                            return vid;
                        }
                    }
                }
                return null;
            }
    
            function obtenerMonedaProveedor(vendorId) {
                var vendorRec = record.load({
                    type: record.Type.VENDOR,
                    id: vendorId,
                    isDynamic: false
                });
                var monedaId = vendorRec.getValue({ fieldId: 'currency' });
                var sym = null;
                if (monedaId) {
                    var datos = search.lookupFields({
                        type: search.Type.CURRENCY,
                        id: monedaId,
                        columns: ['symbol']
                    });
                    sym = datos.symbol;
                    if (sym && sym[0]) {
                        sym = sym[0].value;
                    }
                }
                return { monedaId: monedaId, sym: sym };
            }
    
            function asignarTipoCambioSiFalta(poRec) {
                var tc = poRec.getValue({ fieldId: 'exchangerate' });
                if (tc != null && tc !== '' && Number(tc) !== 0) {
                    return;
                }
                var cur = poRec.getValue({ fieldId: 'currency' });
                if (!cur) {
                    return;
                }
                var datos = search.lookupFields({
                    type: search.Type.CURRENCY,
                    id: cur,
                    columns: ['symbol']
                });
                var sym = datos.symbol;
                if (sym && sym[0]) {
                    sym = sym[0].value;
                }
                if (sym === 'MXN') {
                    poRec.setValue({ fieldId: 'exchangerate', value: 1 });
                } else if (sym) {
                    poRec.setValue({
                        fieldId: 'exchangerate',
                        value: currency.exchangeRate({ source: sym, target: 'MXN' })
                    });
                }
            }
    
            function transformPO(solicitante,idCopy,estimatedtotal){
                try{
                    var req = record.load({
                        type: 'purchaserequisition',
                        id: idCopy,
                        isDynamic: false
                    });
                    var vendorId = obtenerVendorIdDeRequisicion(req);
    
                    var transformToSO = record.transform({
                        fromType: 'purchaserequisition',
                        fromId: idCopy,
                        toType: 'purchaseorder',
                        isDynamic: true,
                    });
    
                    if (!vendorId) {
                        vendorId = transformToSO.getValue({ fieldId: 'entity' });
                    }
                    if (!vendorId && transformToSO.getLineCount({ sublistId: 'expense' }) > 0) {
                        vendorId = transformToSO.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'vendor',
                            line: 0
                        });
                    }
    
                    var monedaVendor = null;
                    var symVendor = null;
                    if (vendorId) {
                        transformToSO.setValue({ fieldId: 'entity', value: vendorId });
                        var datosMoneda = obtenerMonedaProveedor(vendorId);
                        monedaVendor = datosMoneda.monedaId;
                        symVendor = datosMoneda.sym;
                        if (monedaVendor) {
                            transformToSO.setValue({ fieldId: 'currency', value: monedaVendor });
                        }
                    }
    
                    if (symVendor === 'MXN') {
                        transformToSO.setValue({ fieldId: 'exchangerate', value: 1 });
                    } else if (symVendor) {
                        transformToSO.setValue({
                            fieldId: 'exchangerate',
                            value: currency.exchangeRate({ source: symVendor, target: 'MXN' })
                        });
                    }
    
                    transformToSO.setValue({
                        fieldId: 'employee',
                        value: solicitante
                    });
    
                    asignarTipoCambioSiFalta(transformToSO);
    
                    log.debug('transformPO pre-save', {
                        vendorId: vendorId,
                        monedaVendor: monedaVendor,
                        symVendor: symVendor,
                        entity: transformToSO.getValue({ fieldId: 'entity' }),
                        currency: transformToSO.getValue({ fieldId: 'currency' }),
                        exchangerate: transformToSO.getValue({ fieldId: 'exchangerate' })
                    });
    
                    var idPO = transformToSO.save();
                    return idPO;
                }catch(e){
                    log.error('error al transformar la requisicion a po',e);
                }
            }
            function makeCopy(solicitante,idRequisition,campaña){
                try{
                    var idCampaña 
                    if(campaña && String(campaña) !== '4'){
                        idCampaña = campaña
                    }else{
                        idCampaña = 88
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
        }
    
    
        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            log.debug("summary",summary);
        }
    
        return {
            getInputData: getInputData,
            map: map,
    //        reduce: reduce,
            summarize: summarize
        };
        
    });
    