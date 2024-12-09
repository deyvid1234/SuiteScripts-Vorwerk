/**
user
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/url','N/https','N/record'],

function(runtime,url,https,record) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
        try{
            var rec = scriptContext.newRecord;
            var form = scriptContext.form;
            var userObj = runtime.getCurrentUser();
            var userId = parseInt(userObj.id);
            var type = scriptContext.type;
            if(type == 'view' && userId == 923581){
                log.debug('usuario',userId)
                /*var recordid = rec.id;
            var checkRecurrente = rec.getValue('custbody_solicitud_recurrente_contrato')
            var type = scriptContext.type;
                if (checkRecurrente == true){
                if(runtime.envType  == "SANDBOX"){
                    url = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1412&deploy=1&compid=3367613_SB1&ns-at=AAEJ7tMQ2_GXpW7Lfp-egrDWKNpkJiX1YgDH7322yGC9SC99dow';
                } else{
                    url = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1412&deploy=1&compid=3367613&ns-at=AAEJ7tMQL3h0Z1Wc5d97UJGb5JrkbAKuurQML7_zRjmB-LoPu-c';
                }
                var fechaAprobacion = rec.getValue('custbody_fecha_aprobacion')
                var transaccionInactiva = rec.getValue('custbody_inactiva')
                log.debug('fechaAprobacion',fechaAprobacion)
                log.debug('transaccionInactiva',transaccionInactiva)
                if (fechaAprobacion && transaccionInactiva == false){
                    var metodo = rec.getValue('custbody_metodo_repeticion')
                    var solicitante = rec.getValue('entity')
                    var aPartir

                    switch(metodo){
                    case '1':
                        
                        var arregloFechas = []
                        var noRepeticiones = rec.getValue('custbody_no_repeticiones')
                            noRepeticiones = parseInt(noRepeticiones)
                        var cadaNoDias = rec.getValue('custbody_dias')
                            cadaNoDias = parseInt(cadaNoDias)    
                        var aPartir = rec.getValue('custbody_a_partir')
                        var fecha = rec.getValue('custbody_a_partir')
                        var periodo = rec.getValue('custbody_repetir_cada')
                        
                         
                    
                        if(periodo == 2){//mes
                            arregloFechas.push(aPartir)
                            for (var i = 1; i < noRepeticiones; i++) {
                                
                                fecha.setMonth(fecha.getMonth() + 1);
                                var fechaPeriodo = new Date(fecha);
                                arregloFechas.push(fechaPeriodo);
                            }
                            log.debug('arregloFechas',arregloFechas)
                            for (i in arregloFechas){
        
                                if(arregloFechas[i] <= fechaAprobacion){
                                    log.debug('hacer copia y transform')
                                    var proceso = 'copyTransform'
                        
                                    var headers = {'Content-Type': 'application/json'};
                                    var response = https.post({
                                        url: url,
                                        body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                        headers: headers
                                    }).body;
                                    log.debug('response',response)
                                    
                                }else{
                                    log.debug('n hay que ejecutar hoy')
                                }
                            }

                        } else if(periodo == 1){//semana
                            arregloFechas.push(aPartir)
                            for (var i = 1; i < noRepeticiones; i++) {
                                
                                fecha.setDate(fecha.getDate() + 7);
                                var fechaPeriodo = new Date(fecha);
                                arregloFechas.push(fechaPeriodo);
                            }
                            log.debug('arregloFechas',arregloFechas)
                            for (i in arregloFechas){
                              
                                if(arregloFechas[i] <= fechaAprobacion){
                                    log.debug('hacer copia y transformsem')

                                    var proceso = 'copyTransform'
                        
                                    var headers = {'Content-Type': 'application/json'};
                                    var response = https.post({
                                        url: url,
                                        body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                        headers: headers
                                    }).body;
                                    log.debug('response',response)
                                    
                                }else{
                                    log.debug('n hay que ejecutar hoysem')
                                }
                            } 
                        }                     
                        
                    break;
                    case '2':
                        var arregloFechas = []
                        var camposFecha =  [
                            'custbody_fechas_personalizadas',
                            'custbody_fecha_personalizada_2',
                            'custbody_fecha_personalizada_3',
                            'custbody_fecha_personalizada_4',
                            'custbody_fecha_personalizada_5',
                            'custbody_fecha_personalizada_6',
                            'custbody_fecha_personalizada_7',
                            'custbody_fecha_personalizada_8',
                            'custbody_fecha_personalizada_9',
                            'custbody_fecha_personalizada_10',
                            'custbody_fecha_personalizada_11',
                            'custbody_fecha_personalizada_12'
                        ]
                        for (i in camposFecha){
                            var fecha = rec.getValue(camposFecha[i])

                            if(fecha){
                                arregloFechas.push(fecha)
                            }
                            
                        }
                        log.debug('arregloFechas',arregloFechas)
                       
                        for (i in arregloFechas){
                               
                                if(arregloFechas[i] <= fechaAprobacion){
                                    log.debug('hacer copia y transform')

                                    var proceso = 'copyTransform'
                        
                                    var headers = {'Content-Type': 'application/json'};
                                    var response = https.post({
                                        url: url,
                                        body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                        headers: headers
                                    }).body;
                                    log.debug('response',response)
                                    
                                }else{
                                    log.debug('no ejecutar')
                                }                        
                        }
                    break;
                    case '3':
                        var arregloFechas = []
                        var noRepeticiones = rec.getValue('custbody_no_repeticiones')
                            noRepeticiones = parseInt(noRepeticiones)
                        var cadaNoDias = rec.getValue('custbody_dias')
                            cadaNoDias = parseInt(cadaNoDias)    
                        var aPartir = rec.getValue('custbody_a_partir')
                        var fecha = rec.getValue('custbody_a_partir')
                        arregloFechas.push(aPartir)
                        
                        for (var i = 1; i < noRepeticiones; i++) {
                            
                            fecha.setDate(fecha.getDate() + cadaNoDias);
                            var fechaPeriodo = new Date(fecha);
                            arregloFechas.push(fechaPeriodo);
                            
                        }
                        log.debug('arregloFechas dias',arregloFechas)
                        for (i in arregloFechas){

                            var fechaFormato = arregloFechas[i]
                            if(arregloFechas[i] <= fechaAprobacion){
                                log.debug('hacer copia y transform')

                                var proceso = 'copyTransform'
                        
                                var headers = {'Content-Type': 'application/json'};
                                var response = https.post({
                                    url: url,
                                    body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                    headers: headers
                                }).body;
                                log.debug('response',response)
                                
                            }else{
                                log.debug('n hay que ejecutar hoy dias')
                            }
                        
                        }
                        
                    break;

                    } 

                }
                
                
            }*/
            }
            
        }catch(err){
            log.error('Errro beforeLoad',err);
        }
        
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
        try{
            var rec = scriptContext.newRecord;
            var form = scriptContext.form;
            var formulario = rec.getValue('customform')
            var formEployeeCentre

            
            if(runtime.envType  == "SANDBOX"){
                formEployeeCentre = '230'
            }else{
                formEployeeCentre = '230'
            }
            log.debug('formulario',formulario)//formulario 222 es solicitus vorwerk, 231 custom requisition  
            if(formulario == formEployeeCentre){
               var listLineCount = rec.getLineCount({
                 sublistId: "expense"
                });

                for (var i = 0; i < listLineCount; i++) {
                    
                    var vendorCustom = rec.getSublistValue({
                        sublistId: "expense",
                        fieldId: "custcol7",//vendor
                        line: i
                    });
                    
                    
                    log.debug('vendorCustom',vendorCustom)
                    
                    var vendor = rec.setSublistValue({
                        sublistId: "expense",
                        fieldId: "povendor",
                        line: i,
                        value : vendorCustom                                                                                                                                                                 
                    });
                }   
            
                
            }
            var listLineCountExpense = rec.getLineCount({
                sublistId: "expense"
            });
            var listLineCountItem = rec.getLineCount({
                sublistId: "item"
            });
            log.debug('listLineCountExpense',listLineCountExpense)
            log.debug('listLineCountItem',listLineCountItem)
            var totalGastos = 0
            var totalItem = 0 
            if(listLineCountExpense){
                
                for (var i = 0; i < listLineCountExpense; i++) {
                    
                    var montoPesos = rec.getSublistValue({
                        sublistId: "expense",
                        fieldId: "custcolsub_impuestos",//vendor
                        line: i
                    });
                    
                    totalGastos = totalGastos+montoPesos
                    log.debug('totalgastos',totalGastos)
                    
                    
                }   
                
            }
            if(listLineCountItem){
                 
                for (var i = 0; i < listLineCountItem; i++) {
                    
                    var montoPesos = rec.getSublistValue({
                        sublistId: "item",
                        fieldId: "custcolsub_impuestos",//vendor 
                        line: i
                    });
                    
                    totalItem = totalItem+montoPesos
                    log.debug('totalitem',totalItem)
                    
                    
                }   
                
            }
            
            var total = totalGastos + totalItem   
            var montoTotal = rec.setValue({
                fieldId: "custbody_monto_pesos",
                value : total                                                                                                                                                                 
            });

            var checkRecurrente = rec.getValue('custbody_solicitud_recurrente_contrato')
          
            if(checkRecurrente == true){
                                           
                var totalIndividual = rec.getValue('custbody_monto_pesos')
                var repeticiones = rec.getValue('custbody_no_repeticiones')
                var total = totalIndividual*repeticiones 
                rec.setValue({
                    fieldId: "custbody_total_solicitud_recurrente",
                    value : total                                                                                                                                                                 
                });
            }else{
                
            }

        }catch(err){
            log.error("error beforeSubmit",err);
        }

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        try {
            var rec = scriptContext.newRecord;
            var recordid = rec.id;
            var checkRecurrente = rec.getValue('custbody_solicitud_recurrente_contrato')
            var type = scriptContext.type;
            
            
            if (type == 'edit' && checkRecurrente == true){
                if(runtime.envType  == "SANDBOX"){
                    url = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1412&deploy=1&compid=3367613_SB1&ns-at=AAEJ7tMQ2_GXpW7Lfp-egrDWKNpkJiX1YgDH7322yGC9SC99dow';
                } else{
                    url = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1412&deploy=1&compid=3367613&ns-at=AAEJ7tMQL3h0Z1Wc5d97UJGb5JrkbAKuurQML7_zRjmB-LoPu-c';
                }
                var fechaAprobacion = rec.getValue('custbody_fecha_aprobacion')
                var transaccionInactiva = rec.getValue('custbody_inactiva')
                log.debug('fechaAprobacion',fechaAprobacion)
                log.debug('transaccionInactiva',transaccionInactiva)
                if (fechaAprobacion && transaccionInactiva == false){
                    var metodo = rec.getValue('custbody_metodo_repeticion')
                    var solicitante = rec.getValue('entity')
                    var aPartir

                    switch(metodo){
                    case '1':
                        
                        var arregloFechas = []
                        var noRepeticiones = rec.getValue('custbody_no_repeticiones')
                            noRepeticiones = parseInt(noRepeticiones)
                        var cadaNoDias = rec.getValue('custbody_dias')
                            cadaNoDias = parseInt(cadaNoDias)    
                        var aPartir = rec.getValue('custbody_a_partir')
                        var fecha = rec.getValue('custbody_a_partir')
                        var periodo = rec.getValue('custbody_repetir_cada')
                        
                         
                    
                        if(periodo == 2){//mes
                            arregloFechas.push(aPartir)
                            for (var i = 1; i < noRepeticiones; i++) {
                                
                                fecha.setMonth(fecha.getMonth() + 1);
                                var fechaPeriodo = new Date(fecha);
                                arregloFechas.push(fechaPeriodo);
                            }
                            log.debug('arregloFechas',arregloFechas)
                            for (i in arregloFechas){
        
                                if(arregloFechas[i] <= fechaAprobacion){
                                    log.debug('hacer copia y transform')
                                    var proceso = 'copyTransform'
                        
                                    var headers = {'Content-Type': 'application/json'};
                                    var response = https.post({
                                        url: url,
                                        body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                        headers: headers
                                    }).body;
                                    log.debug('response',response)
                                    
                                }else{
                                    log.debug('n hay que ejecutar hoy')
                                }
                            }

                        } else if(periodo == 1){//semana
                            arregloFechas.push(aPartir)
                            for (var i = 1; i < noRepeticiones; i++) {
                                
                                fecha.setDate(fecha.getDate() + 7);
                                var fechaPeriodo = new Date(fecha);
                                arregloFechas.push(fechaPeriodo);
                            }
                            log.debug('arregloFechas',arregloFechas)
                            for (i in arregloFechas){
                              
                                if(arregloFechas[i] <= fechaAprobacion){
                                    log.debug('hacer copia y transformsem')

                                    var proceso = 'copyTransform'
                        
                                    var headers = {'Content-Type': 'application/json'};
                                    var response = https.post({
                                        url: url,
                                        body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                        headers: headers
                                    }).body;
                                    log.debug('response',response)
                                    
                                }else{
                                    log.debug('n hay que ejecutar hoysem')
                                }
                            } 
                        }                     
                        
                    break;
                    case '2':
                        var arregloFechas = []
                        var camposFecha =  [
                            'custbody_fechas_personalizadas',
                            'custbody_fecha_personalizada_2',
                            'custbody_fecha_personalizada_3',
                            'custbody_fecha_personalizada_4',
                            'custbody_fecha_personalizada_5',
                            'custbody_fecha_personalizada_6',
                            'custbody_fecha_personalizada_7',
                            'custbody_fecha_personalizada_8',
                            'custbody_fecha_personalizada_9',
                            'custbody_fecha_personalizada_10',
                            'custbody_fecha_personalizada_11',
                            'custbody_fecha_personalizada_12'
                        ]
                        for (i in camposFecha){
                            var fecha = rec.getValue(camposFecha[i])

                            if(fecha){
                                arregloFechas.push(fecha)
                            }
                            
                        }
                        log.debug('arregloFechas',arregloFechas)
                       
                        for (i in arregloFechas){
                               
                                if(arregloFechas[i] <= fechaAprobacion){
                                    log.debug('hacer copia y transform')

                                    var proceso = 'copyTransform'
                        
                                    var headers = {'Content-Type': 'application/json'};
                                    var response = https.post({
                                        url: url,
                                        body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                        headers: headers
                                    }).body;
                                    log.debug('response',response)
                                    
                                }else{
                                    log.debug('no ejecutar')
                                }                        
                        }
                    break;
                    case '3':
                        var arregloFechas = []
                        var noRepeticiones = rec.getValue('custbody_no_repeticiones')
                            noRepeticiones = parseInt(noRepeticiones)
                        var cadaNoDias = rec.getValue('custbody_dias')
                            cadaNoDias = parseInt(cadaNoDias)    
                        var aPartir = rec.getValue('custbody_a_partir')
                        var fecha = rec.getValue('custbody_a_partir')
                        arregloFechas.push(aPartir)
                        
                        for (var i = 1; i < noRepeticiones; i++) {
                            
                            fecha.setDate(fecha.getDate() + cadaNoDias);
                            var fechaPeriodo = new Date(fecha);
                            arregloFechas.push(fechaPeriodo);
                            
                        }
                        log.debug('arregloFechas dias',arregloFechas)
                        for (i in arregloFechas){

                            var fechaFormato = arregloFechas[i]
                            if(arregloFechas[i] <= fechaAprobacion){
                                log.debug('hacer copia y transform')

                                var proceso = 'copyTransform'
                        
                                var headers = {'Content-Type': 'application/json'};
                                var response = https.post({
                                    url: url,
                                    body : JSON.stringify({solicitante:solicitante,recordid:recordid,proceso:proceso}),
                                    headers: headers
                                }).body;
                                log.debug('response',response)
                                
                            }else{
                                log.debug('n hay que ejecutar hoy dias')
                            }
                        
                        }
                        
                    break;

                    } 

                }
                
                
            }
            if(type == 'create' && checkRecurrente == true){
                var solicitud = record.load({
                    id: recordid,
                    type: 'purchaserequisition',
                    isDynamic: false
                });
                           
                var listLineCountExpense = solicitud.getLineCount({
                    sublistId: "expense"
                });
                var listLineCountItem = solicitud.getLineCount({
                    sublistId: "item"
                });
                if(listLineCountExpense){
                
                    for (var i = 0; i < listLineCountExpense; i++) {
                        
                        var montoMonedaProveedor = solicitud.getSublistValue({
                            sublistId: "expense",
                            fieldId: "estimatedamount",//vendor
                            line: i
                        });
                        log.debug('montoMonedaProveedor',montoMonedaProveedor)
                        var amount = solicitud.setSublistValue({
                            sublistId: "expense",
                            fieldId: "amount",//vendor
                            line: i,
                            value : montoMonedaProveedor

                        });
                    }     
                }
                solicitud.save();
                
            }

        }catch (e){
            log.error('error afterSubmit',e)
        }
        
        
    }
    
  
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
