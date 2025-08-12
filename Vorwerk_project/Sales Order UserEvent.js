/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message','N/error','N/runtime','N/config','N/record','N/render','N/runtime','N/email','N/search','N/format','N/http','N/https', "N/ui/serverWidget",'SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

function(message,error,runtime,config,record,render,runtime,email,search,format,http,https,serverWidget,Utils) {
    var date = new Date();
    var fdate = format.parse({
        value: date,
        type: format.Type.DATE
    });
   
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

            var rec = scriptContext.newRecord;
            var currentRecord = scriptContext.newRecord;
            var form = scriptContext.form;
            var type = scriptContext.type;
            log.debug('type',type)
            if(type == 'edit' || type == 'view'){ //bloqueo de edicion de SO facturados para employees con el check
                var status = rec.getValue('status') 
                log.debug('status',status)
                var userObj = runtime.getCurrentUser();
                var idUser = userObj.id
                var userPermisos = search.lookupFields({
                    type: 'employee',
                    id: idUser,
                    columns: ['custentity_sin_permiso_sofacturada']
                });
                var editaso_facturada = userPermisos.custentity_sin_permiso_sofacturada
                log.debug('editaso_facturada',editaso_facturada)
                if(editaso_facturada == true && (status == 'Billed' || status == 'Facturada') && type == 'view'){
                    var msgAuto = message.create({
                        title: "Permiso de edicion denegado",
                        message: "No se puede editar este pedido pues ya cuenta con una factura.",
                        type: message.Type.WARNING
                    });
                    scriptContext.form.addPageInitMessage({ message: msgAuto });
                    log.debug('editaso_facturada',editaso_facturada)
                    form.removeButton('edit');   
                } else if(editaso_facturada == true && status == 'Billed' && type == 'edit'){
                    throw error.create({
                        name: 'Permiso de edicion denegado',
                        message: 'No se puede editar este pedido pues ya cuenta con una factura.',
                        notifyOff: false
                    });
                }
            }
            if(type == 'view'){//opcion para remover el boton del fulfill
                
                var recordid = rec.getValue('id')  
                log.debug('recordid',recordid)
                var tipoVenta =rec.getValue('custbody_tipo_venta') 
                log.debug('tipoVenta',tipoVenta)

                // Solo procesar si el tipo de venta es eshop vorwerk o ventas tm y no hay contrato digital credit
                if(tipoVenta === '18' || tipoVenta === '2') {
                      // Buscar pagos relacionados con esta orden de venta
                    var pagos = [];
                    var totalPagadoSublist = 0;
                    
                    try {
                        var paymentSearch = search.create({
                            type: 'customerpayment',
                            filters: [
                                ['custbody_mp_orden_venta_relacionada', 'is', recordid],
                                'AND',
                                ['mainline', 'is', true]
                            ],
                            columns: [
                                'internalid',
                                'amount',
                                'memo',
                                'trandate'
                            ]
                        });
                        
                        paymentSearch.run().each(function(result) {
                            var paymentId = result.getValue('internalid');
                            var amount = result.getValue('amount');
                            var memo = result.getValue('memo');
                            var trandate = result.getValue('trandate');
                            
                            pagos.push({
                                id: paymentId,
                                importe: amount,
                                memo: memo,
                                fecha: trandate
                            });
                            
                            totalPagadoSublist += parseFloat(amount) || 0;
                            
                            return true; // continuar con la siguiente línea
                        });
                        
                        log.debug('Pagos encontrados:', pagos);
                        log.debug('Total pagado (búsqueda):', totalPagadoSublist);
                        
                    } catch (e) {
                        log.error('Error al buscar pagos:', e.message);
                    }
                       
                    var total = rec.getValue('total') 
                    log.debug('total',total)
                    var vorwerkContratos = rec.getValue('custbody_vorwerk_contratos') 
                    log.debug('vorwerkContratos',vorwerkContratos)
                    log.debug('totalPagadoSublist',totalPagadoSublist)
                    log.debug('Condición cumplida:', (totalPagadoSublist < total && !vorwerkContratos))
                    
                    
                    if(totalPagadoSublist < total && !vorwerkContratos ){
                        var msgAuto = message.create({
                            title: "Ejecución no permitida",
                            message: "Pedido sin pago, favor de revisar",
                            type: message.Type.WARNING
                        });
                        scriptContext.form.addPageInitMessage({ message: msgAuto });
                        form.removeButton('process');                        
                    } 
                } else {
                    log.debug('Tipo de venta no es 18 ni 2:', tipoVenta)
                }
            } 
        try{
            //log.debug("start","Add Buton");
            const myUser = runtime.getCurrentUser();
            const roleID = myUser.role;

            var type = scriptContext.type;

            if(roleID != 3 && roleID != 1028 && roleID != 1037 && type == 'edit'  ){//Administrador, Customer Service Senior - New, Access Service 2
                var newRec = scriptContext.newRecord;
                var tipo_venta =  newRec.getValue({
                    fieldId: 'custbody_tipo_venta'
                });
                if(tipo_venta == 2){
                    var form = scriptContext.form;
                    form.getField({ id: "salesrep" }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                }
            }

            var rec = scriptContext.newRecord;
            var form = scriptContext.form;
            form.clientScriptModulePath = '/SuiteScripts/Vorwerk_project/Sales Order Client.js';
            var idSalesORder =  rec.getValue({
                fieldId: 'id'
            });
            if(scriptContext.type == 'copy'){
                rec.setValue('custbody_vw_comission_status','')
            }
            
            var configRecObj = config.load({
                type: config.Type.COMPANY_INFORMATION
            });
//          log.debug('configRecObj',configRecObj);
            
            var mainaddress = configRecObj.getSubrecord({
                fieldId: 'mainaddress'
            });
            
            var companyname = configRecObj.getValue('companyname');
            var phone =     mainaddress.getValue('addrphone');
            var email =     configRecObj.getValue('email');
            var address =   mainaddress.getValue('addr1')
                            +' '+mainaddress.getValue('addr2')
                            +' '+mainaddress.getValue('city')
                            +' '+mainaddress.getValue('state')
                            +' '+mainaddress.getValue('zip');
            var legalname = configRecObj.getValue('legalname');
            
            
            //log.debug('custbody_estatus_envio',rec.getValue('custbody_estatus_envio'));
            if(scriptContext.type == 'view'){
                form.addButton({
                    id : 'custpage_bt_request_traking',
                    label : 'Generar guia',
                    functionName : 'requestTraking(\"'+idSalesORder+'\",\"'+companyname+'\",\"'+phone+'\",\"'+email+'\",\"'+address+'\",\"'+legalname+'\")'
                });
            }
            /*if(rec.getValue('custbody_tipo_venta') == 35){
                form.addButton({
                    id : 'custpage_bt_update_sales_order',
                    label : 'Modificar TM ganada',
                    functionName :'updateTm(\"'+idSalesORder+'\")'
                });
            }*/
            
        }catch(err){
            log.error("Error Aftersbumit",err);
        }
        
        return true;
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
        
        return true;
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
        try{
            log.debug("runtime.executionContext",runtime.executionContext);
            var rec = scriptContext.newRecord;
            var salesrep = rec.getValue('salesrep')
            var typeEvent = runtime.executionContext;
            log.debug('typeEvent',typeEvent)
           
            //validar cancelacion
            try{
                cancelacion(scriptContext)
                
            }catch(e){
                log.debug('error actualizacion de commission status',e)
            }
            // actualizacion de commission status 
            try{
                commissionStatus(salesrep)
            }catch(e){
                log.debug('error actualizacion de commission status',e)
            }
            // earning program tm7
            try{
                //itemtype(scriptContext)
                earningProgram(salesrep)
            }catch(e){
                log.debug('error earning program tm7',e)
            }
            
            if(typeEvent != runtime.ContextType.MAP_REDUCE  && typeEvent != runtime.ContextType.CSV_IMPORT ){
                var type = scriptContext.type;
                
                var recordid = rec.id;
                var entity = parseInt(rec.getValue('entity'),10);
                var salesrep = rec.getValue('salesrep')
                log.debug('salesrep',salesrep)
                var fecha = rec.getValue('trandate')
                var tipoventa = rec.getValue('custbody_tipo_venta')
                var idTpl="",idUSer="",email_send="";
                var valid_line = 0;
                if(rec.getValue('custbody_vw_recruiter')== ""){
                    setRecruiter(rec);
                }
                
                
                var orderPagada = rec.getValue('tranid')
                
                var salesorder = record.load({
                    id: recordid,
                    type: 'salesorder',
                    isDynamic: false
                });
                log.debug('type',type);
                if(type == 'create' || type == 'edit'){
                    log.debug('se activo por el evento ')
                    
                    try{
                        
                        if(type == 'edit'){
                            var oldRec = scriptContext.oldRecord;
                            var fechaOld = oldRec.getValue('trandate')
                            var salesrepOld = oldRec.getValue('salesrep')
                            var tipoventaOld = oldRec.getValue('custbody_tipo_venta')
                            
                            if (fechaOld != fecha || salesrepOld != salesrep || tipoventaOld != tipoventa ){
                                if(salesrepOld != salesrep){
                                    log.debug('cambio de sales rep')
                                    setRecruiter(rec);//si hay cambio en el sales rep se actualiza el recruiter
                                }
                               var numOdv = tmGanada(scriptContext);
                            }

                        } else if (type == 'create'){
                            
                            var numOdv = tmGanada(scriptContext);
                        }
                         
                    } catch(e){
                        log.debug('error actualizacion de commission status',e)
                    }
                    
                    var numOdv = tmGanada(scriptContext);
                    //dd
                    try{
                        var numLines = salesorder.getLineCount({
                            sublistId: 'item'
                        });
                        for(var e =0; e<numLines; e++){ 
                             var tmp_id = rec.getSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'item',
                                 line: e
                             })
                             if(tmp_id == 1126 || tmp_id == 1757 || tmp_id == 2001|| tmp_id == 2170|| tmp_id == 2035 || tmp_id == 2571 || tmp_id == 2280 || tmp_id == 2671){
                                 var subrec = rec.getSublistSubrecord({
                                    sublistId: 'item',
                                    fieldId: 'inventorydetail',
                                    line: e
                                });
                                if(subrec){
                                    var inventorydetail
                                    var subitems = subrec.getLineCount({
                                        sublistId  : 'inventoryassignment'
                                    });
                                    if(subitems > 0){
                                        for(var x = 0; x < subitems; x++) {
                                            var serial = subrec.getSublistValue({
                                                sublistId: 'inventoryassignment',
                                                fieldId: 'issueinventorynumber_display',
                                                line: x
                                            });
                                            inventorydetail = serial
                                        }
                                    }
                                    log.debug("inventorydetail",inventorydetail);
                                    var objSearchResult = {};
                                    objSearchResult.id =false;
                                    if(inventorydetail){
                                        var busqueda = search.load({
                                            id: 'customsearch_item_receipt_by_serial'
                                        });
                                        busqueda.filters.push(search.createFilter({
                                            name: 'serialnumber',
                                            operator: 'is',
                                            values: inventorydetail
                                        }));
                                        
                                        busqueda.run().each(function(r){
                                            objSearchResult.id = r.getValue('internalid')
                                            objSearchResult.pedimento = r.getValue('custbody_pi_pedimento')
                                            return true;
                                        });
                                    }
                                     
                                    idItemReceipt = objSearchResult.id
                                    pedimento = objSearchResult.pedimento
                                        if(idItemReceipt){
                                             
                                               var idPedimento = search.lookupFields({
                                                    type: "itemreceipt",
                                                    id: idItemReceipt,
                                                    columns: ['custbody_pi_pedimento_de_importacion']
                                                });
                                                idPedimento = idPedimento.custbody_pi_pedimento_de_importacion[0]['value']
                                                log.debug('Asignacion de Pedimento de Importacion','Item: '+tmp_id+' Inventorydetail: '+inventorydetail+' idItemReceipt: '+idItemReceipt+' Pedimento: '+pedimento+' idPedimento: '+idPedimento)
                                               salesorder.setSublistValue({
                                                    sublistId : 'item',
                                                    fieldId : 'custcol_pedimento_de_importacion',
                                                    line : e,
                                                    value : idPedimento
                                                });
                                               var id = salesorder.save();
                                        }else{
                                            log.debug('Item Receipt no existe')
                                        }
                                }else{
                                    log.debug('Sin Inventory Detail')
                                } 
                             }else{
                                 log.debug('No se asigna Pedimento de importacion')
                             } 
                        }
                    }catch(e){
                        log.debug('Error asignacion pedimento de importacion',e)
                    }
                    
                    
                    
                    var salesRep = search.lookupFields({
                        type: 'customer',
                        id: entity,
                        columns: ['salesrep']
                    });
                    var salesRep = search.lookupFields({
                        type: 'employee',
                        id: salesRep.salesrep[0].value,
                        columns: 'email'
                    });
                    log.debug('salesRep',salesRep)
                    log.debug('salesRep email',salesRep.email)
                    var email_bbc = salesRep.email;
                    
                    log.debug("process","evento "+type+" email send "+salesorder.getValue('custbody_email_send'));
                    var salesorder = record.load({
                        id: recordid,
                        type: 'salesorder',
                        isDynamic: true
                    });
                     var fieldsLookUp = search.lookupFields({
                         type: 'salesorder',
                         id: recordid,
                         columns: 'custbody_email_send'
                     });
                     log.debug('fieldsLookUp',fieldsLookUp);
                    if(salesorder.getValue('custbody_email_send') == false){
                        log.debug("process","evento "+type);
                        
                        var numLines_aux = salesorder.getLineCount({
                            sublistId: 'recmachcustrecord_id_sales_order'
                        });
                        
                        for(var e =0; e<numLines_aux; e++){
                            var url_response = rec.getSublistValue({
                                 sublistId: 'recmachcustrecord_id_sales_order',
                                 fieldId: 'custrecord_url_resp_aclogistics',
                                 line: e
                             })
                        }
                        
                        /*
                         * 
                         * DESCOMENTAR PARA Invetory detal 
                         * 
                         * 
                        var items  = rec.getLineCount({
                            sublistId: 'item'
                        });
                        var serialVal = "";
                        for(var i = 0; i < items; i++) {
                             var tmp_item = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: i
                                });
                             if(tmp_item == 2001 || tmp_item == 2170){
                                 var subrecord = rec.getSublistSubrecord({
                                        sublistId: 'item',
                                        fieldId: 'inventorydetail',
                                        line: i
                                    });
                                 if(subrecord != null){
                                        var subitems = subrecord.getLineCount({
                                                            sublistId: 'inventoryassignment'
                                                        });
                                        for(var x = 0; x < subitems; x++) {
                                            serialVal = subrecord.getSublistValue({
                                                sublistId: 'inventoryassignment',
                                                fieldId: 'issueinventorynumber',
                                                line:x
                                            });
                                        }
                                  }
                             }
                        }*/
                        idTpl = 264;
                        idUSer = 344096;
                        
                        log.debug("process","email");
                        var myMergeResult = render.mergeEmail({
                                templateId: idTpl,
                                entity: {
                                        type: 'employee',
                                        id: idUSer
                                },
                                recipient: {
                                        type: 'customer',
                                        id: entity
                                },
                                transactionId: recordid
                            });
                        var senderId = idUSer;
                        var recipientEmail = entity
                        var emailSubject = myMergeResult.subject; // Get the subject for the email
                        var emailBody = myMergeResult.body // Get the body for the email
                        log.debug('emailBody',emailBody);
                        
                        emailBody = emailBody.replace(/@pedido/g,url_response);
                        
                        log.debug('tipo de venta ',rec.getValue('custbody_tipo_venta') );
                        if(rec.getValue('custbody_tipo_venta') == 2){
                            if(rec.getValue('custbody_manual_sales_order') == false){
                                log.debug("Orden de Venta Normal",rec.getValue('custbody_manual_sales_order'));
                                emailAndApprove(senderId,recipientEmail,emailSubject,emailBody,recordid,email_bbc)
                                
                            }
                        }
                        
                        
                        log.debug("manual ",rec.getValue('custbody_manual_sales_order'));
                        //if(rec.getValue('custbody_tipo_venta') != 2)
                        {
                            if(rec.getValue('custbody_manual_sales_order') == true){
                                
                                var total_payment = 0;
                                var busqueda = search.create({
                                   type: 'customerpayment',
                                   columns: [search.createColumn({
                                                name: 'amount',
                                                summary: search.Summary.SUM
                                              })],
                                   filters: [
                                       ['custbody_mp_orden_venta_relacionada','anyof',recordid]
                                        ,'and'
                                        ,['mainline','is',true]
                                   ]
                                });
                                busqueda.run().each(function(r){
                                    total_payment = r.getValue({
                                                  name: 'amount',
                                                  summary: search.Summary.SUM
                                                });
                                   return true;
                                });
                                var total = parseFloat(rec.getValue('total'));
                                log.debug("Informacion de costos","total de SO: "+total+" Suma de los pagos: "+total_payment);
                                var total_pay = rec.getValue('custbody_total_pagado')
                                log.debug("Informacion de costos edicion manual","total de SO: "+total+" Suma de los pagos total pagado: "+total_pay);
                                if((total-100)<= total_pay){
                                    log.debug("email odv manual","El total -+ 100 esta en el rango");
                                    emailAndApprove(senderId,recipientEmail,emailSubject,emailBody,recordid,email_bbc)
                                }else if((total-100)<= total_payment){
                                    log.debug("email odv manual","El total -+ 100 esta en el rango");
                                    emailAndApprove(senderId,recipientEmail,emailSubject,emailBody,recordid,email_bbc)
                                    
                                }else{
                                    try{
                                        var submitFields = record.submitFields({
                                            type: record.Type.SALES_ORDER,
                                            id: recordid,
                                            values: {'orderstatus':'A'}
                                        });
                                    }catch(e){
                                        log.error("error","send info");
                                        return {error_payment:e};
                                    }
                                }
                            }
                            if( rec.getValue('custbody_vorwerk_contratos') != ""){
                                log.debug('contrato',rec.getValue('custbody_vorwerk_contratos') );
                                emailAndApprove(senderId,recipientEmail,emailSubject,emailBody,recordid,email_bbc)
                            }
                            
                        }
                            
                    }else{
                        log.debug("process","El email ya ha sido enviado no es necesario volver a enviarlo");
                    }
                }
               
                
            }
            //Registra venta (LMS)
            try{
                var type = scriptContext.type;
                var old_salesrep
                log.debug('type',type)
                
                

                
                //Datos SO
                var rec = scriptContext.newRecord;
                var oldrec = scriptContext.oldRecord;
                var recordid = rec.id;

                var customer = parseInt(rec.getValue('entity'),10);
                var fecha_venta = rec.getValue('trandate')
                var numOrden = rec.getValue('tranid')
                var idOrden = rec.getValue('id')
                var importe = rec.getValue('total')
                var salesrep = rec.getValue('salesrep')
                var tipo_venta = rec.getValue('custbody_tipo_venta')

                old_salesrep = salesrep
                log.debug('salesrep Registra venta',salesrep)
                //Datos Customer
                var objcustomer = search.lookupFields({
                type: 'customer',
                id: customer,
                columns: [
                'isperson'
                ,'internalid'
                ,'altname'
                ,'salesrep'
                ,'entityid'
                ,'email'
                ,'mobilephone'
                ,'custentity_id_cliente_referido' // ID CLIENTE REFERIDO
                ,'custentity_presentadora_referido'// PRESENTADORA REFERIDO
                ,'datecreated'
                ,'isinactive'
                ,'custentityidu_presentador' // IDU PRESENTADOR
                ,'custentity_first_so' // PRIMER SO REFERIDO
                ,'custentity_date_first_so' // FECHA PRIMER SO REFERIDO
                ,'custentitysales_rep_first_so' // SALES REP 1 SO REFERIDO
                ]
                });
                log.debug('objcustomer',objcustomer)
                log.debug('objcustomer.custentity_presentadora_referido',objcustomer.custentity_presentadora_referido)
                if( objcustomer.custentity_presentadora_referido && objcustomer.custentity_presentadora_referido != '' && objcustomer.custentity_presentadora_referido != '[]'){ //Es cliente referido sin primer SO, Puede o no tener Recomendador
                    log.debug('PO programa Recomendados')
                    var numLines = salesorder.getLineCount({
                        sublistId: 'item'
                    });
                    var cantidad = numLines //Revisar 
                    
                    //Datos salesrep
                    var objsalesrep = search.lookupFields({
                    type: 'employee',
                    id: salesrep,
                    columns: [
                    'firstname'
                    ,'internalid'
                    ,'altname'
                    ,'entityid'
                    ,'custentity_promocion'
                    ,'email'
                    ]
                    });
                    log.debug('objsalesrep',objsalesrep)
                    
                    //Datos presentadora REFERIDO 
                    var objPresentadora = search.lookupFields({
                    type: 'employee',
                    id: objcustomer.custentity_presentadora_referido[0].value,
                    columns: [
                    'firstname'
                    ,'internalid'
                    ,'altname'
                    ,'entityid'
                    ,'custentity_promocion'
                    ,'email'
                    ]
                    });
                    log.debug('objPresentadora',objPresentadora)
                    log.debug('objPresentadora',objPresentadora)
                    log.debug('type',type)
                    
                    if( (type == 'create' || salesrep != old_salesrep) && tipo_venta == 2){

                        if(runtime.envType != 'PRODUCTION'){ 
                            urlLMS = 'https://api-referidos-thrmx.lms-la.com/api/venta'
                            urlAD = 'https://dev-apiagenda.mxthermomix.com/users/AddSalesExternoNetsuite'
                        }else{//prod
                            urlLMS = 'https://api.recomiendayganathermomix.mx/api/venta'
                            urlAD = 'https://apiagenda.mxthermomix.com/users/AddSalesExternoNetsuite'
                        }
                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth() + 1; //January is 0!
                        var yyyy = today.getFullYear();
                        
                       
                        if(mm <  10){
                            mm = '0'+mm
                        }
                        if(dd < 10 ){
                            dd = '0'+dd
                        }
                        var fdate = yyyy + '-' +mm + '-' + dd;

                        var objRequest = {
                            "IdCliente": customer,
                            "IDClienteRef":objcustomer.custentity_id_cliente_referido[0]?objcustomer.custentity_id_cliente_referido[0].value:'',
                            "FechaVenta": fdate,
                            "SKU": "TM6",
                            "Cantidad": cantidad,
                            "Importe": importe,
                            "salesrep": salesrep,
                            "IDUsalesRep":objsalesrep.entityid,
                            "Order": ""+recordid+""
                        }
                        log.debug('objRequest LMS',objRequest)
                        var responseService = https.post({
                            url: urlLMS,
                            body : JSON.stringify(objRequest),
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjIyMWFmN2U5LTJjMDAtNDYzZC1hYzliLThkZDA2MzhmYzYzMSIsInN1YiI6InRocm14Lm5ldHN1aXRlLmFwaUBsbXMtbGEuY29tIiwiZW1haWwiOiJ0aHJteC5uZXRzdWl0ZS5hcGlAbG1zLWxhLmNvbSIsInVuaXF1ZV9uYW1lIjoidGhybXgubmV0c3VpdGUuYXBpQGxtcy1sYS5jb20iLCJqdGkiOiJkMDdkZmJhNy04MjA1LTRkZjYtODdlMS0xZDE2YmUyYTAwOTMiLCJuYmYiOjE3MzYyMTMwNzAsImV4cCI6MTc2Nzc0OTA3MCwiaWF0IjoxNzM2MjEzMDcwfQ.4lCT7MyZ1OPFQhO6opfc1lEUyz-nyDpmE7_ZNVdwbvIIanlzuWIoD5XzjTnojLFO6EThVieiOiPUl7EhqrhkNg"
                            }
                        }).body;
                        log.debug('responseService LMS',responseService)

                        log.debug('pre actualizacion customer',objcustomer.custentity_first_so[0].value)
                        if(objcustomer.custentity_first_so[0].value == false || objcustomer.custentity_first_so[0].value == ''){
                            //Actualizar Customer
                            var submitFields = record.submitFields({
                                type: 'customer',
                                id: customer,
                                values: {
                                //'custentityidu_presentador':objsalesrep.entityid,
                                'custentity_first_so':recordid,
                                //'custentity_date_first_so':fdate,
                                'custentitysales_rep_first_so':salesrep,
                                }
                            });


                            //Ajuste AD
                            var objRequestAD = {//Agenda digital
                                "NetSuiteID":""+customer+"",//ID Prospecto
                                "PedidoID":""+recordid+"",
                                "noPedido":numOrden,
                                "PedidoStatus":'Activo',
                            }
                            log.debug('objRequestAD',JSON.stringify(objRequestAD))

                            //Agenda Digital
                            var responseService = https.post({
                                url: urlAD,
                                body : JSON.stringify(objRequestAD),
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-api-key": "QxTbKbIDyB7eN0wCHxCZH5SN6gZzd0Nd7yreJAhW"
                                }
                            }).body;
                            log.debug('responseService AD',responseService)

                        }
                        
                    
                    }

                    //Campos para validar si es cancelacion 
                    var op1 = rec.getValue('custbody_otro_financiamiento')
                    //log.debug('op1',op1)
                    var op1old = oldrec.getValue('custbody_otro_financiamiento')
                    //log.debug('op1old',op1old)
                    var op2 = rec.getValue('custbody_tipo_venta')
                    //log.debug('op2',op2)
                    var op2old = oldrec.getValue('custbody_tipo_venta')
                    //log.debug('op2old',op2old)
                    if( type == 'edit' && ( (op1 == 4 && op1!=op1old) || (op2 == 16 && op2 != op2old) )){
                        log.debug('Es cancelacion')
                        
                        var urlLMSCancel
                        var urlADCancel
                        if(runtime.envType != 'PRODUCTION'){ 
                            urlLMSCancel = 'https://api-referidos-thrmx.lms-la.com/api/Venta/cancelar-venta'
                            urlADCancel = 'https://dev-apiagenda.mxthermomix.com/users/AddSalesExternoNetsuite'
                        }else{//prod
                            urlLMSCancel = 'https://api.recomiendayganathermomix.mx/api/Venta/cancelar-venta'
                            urlADCancel = 'https://apiagenda.mxthermomix.com/users/AddSalesExternoNetsuite'
                        }

                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth() + 1; //January is 0!
                        var yyyy = today.getFullYear();
                        
                       
                        if(mm <  10){
                            mm = '0'+mm
                        }
                        if(dd < 10 ){
                            dd = '0'+dd
                        }
                        var fdate = yyyy + '-' +mm + '-' + dd;
                        var objRequest = {
                            "IdCliente": customer,
                            "FechaCancelacion":fdate,
                            "salesrep": salesrep,
                            "IDUsalesRep":objsalesrep.entityid,
                            "Order": ""+recordid+""
                        }
                        log.debug('objRequest LMS',objRequest)
                        log.debug('objRequest.length',JSON.stringify(objRequest).length)
                        var responseService = https.post({
                            url: urlLMSCancel,
                            body : JSON.stringify(objRequest),
                            headers: {
                                "Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjIyMWFmN2U5LTJjMDAtNDYzZC1hYzliLThkZDA2MzhmYzYzMSIsInN1YiI6InRocm14Lm5ldHN1aXRlLmFwaUBsbXMtbGEuY29tIiwiZW1haWwiOiJ0aHJteC5uZXRzdWl0ZS5hcGlAbG1zLWxhLmNvbSIsInVuaXF1ZV9uYW1lIjoidGhybXgubmV0c3VpdGUuYXBpQGxtcy1sYS5jb20iLCJqdGkiOiJkMDdkZmJhNy04MjA1LTRkZjYtODdlMS0xZDE2YmUyYTAwOTMiLCJuYmYiOjE3MzYyMTMwNzAsImV4cCI6MTc2Nzc0OTA3MCwiaWF0IjoxNzM2MjEzMDcwfQ.4lCT7MyZ1OPFQhO6opfc1lEUyz-nyDpmE7_ZNVdwbvIIanlzuWIoD5XzjTnojLFO6EThVieiOiPUl7EhqrhkNg",
                                "Content-Type": "application/json",
                            }
                        }).body;
                        log.debug('responseService',responseService)

                        //Solo si es la primera SO recomendados
                        log.debug('pre actualizacion customer',objcustomer.custentity_first_so[0].value)
                        if(objcustomer.custentity_first_so[0].value == idOrden){

                            //Cancel AD 
                            var objRequestCancelAD = {//Agenda digital
                                "NetSuiteID":""+customer+"",//ID Prospecto
                                "PedidoID":""+idOrden+"",
                                "noPedido":numOrden,
                                "PedidoStatus":'Cancelado',
                            }
                            log.debug('objRequestCancelAD',JSON.stringify(objRequestCancelAD))

                            //Agenda Digital
                            var responseService = https.post({
                                url: urlADCancel,
                                body : JSON.stringify(objRequestCancelAD),
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-api-key": "QxTbKbIDyB7eN0wCHxCZH5SN6gZzd0Nd7yreJAhW"
                                }
                            }).body;
                            log.debug('responseService AD',responseService)


                            //Actualizar Customer
                            var submitFields = record.submitFields({
                                type: 'customer',
                                id: customer,
                                values: {
                                'custentity_first_so':'',
                                'custentity_date_first_so':'',
                                'custentitysales_rep_first_so':'',
                                }
                            });


                        }
                        
                    }

                }
            }catch(e){
                log.debug('Error Registra venta',e)
            }
            //FIN Registra venta (LMS)
           
                try{// Forma de pago 
                var rec = scriptContext.newRecord;
                var formadepago = rec.getValue('custbody_cfdi_formadepago')
                var contrato = rec.getValue('custbody_vorwerk_contratos')
                if(type == 'create' && contrato && contrato != '' && formadepago != 3){
                    var submitFields = record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: recordid,
                        values: {'custbody_cfdi_formadepago':3}
                    });
                }

                }catch(e){
                    log.debug('Error Forma de pago',e)
                }
        }catch(err){
            log.error("error after submit",err);
        }

        try{//Actualizacion Inventario ficticio eshop
            if(type == 'create'){
                var numLines = salesorder.getLineCount({//Toma las lineas de la SO
                    sublistId: 'item'
                });
                log.debug('numLines',numLines)
                for(var e =0; e<numLines; e++){ //Se recorre cada linea
                    log.debug('e',e)
                    var tmp_id = rec.getSublistValue({//ID del item
                        sublistId: 'item',
                        fieldId: 'item',
                        line: e
                    })
                    var locationSO = rec.getValue('location')
                    var custbody_so_eshop = rec.getValue('custbody_so_eshop') //Check del restlet que indica que viene de tienda en linea

                    var dataItem = search.lookupFields({// Busqueda de Invdentory Item
                        type: 'item',
                        id: tmp_id,
                        columns: ['custitem_disponible_eshop','recordtype','custitem_transaccion_apartados']//Stock disponible en el campo para eshop, tipo de registro
                    });

                    log.debug('dataItem',dataItem)
                    var disponible_eshop = parseInt(dataItem['custitem_disponible_eshop'],10) //Stock dedicado a eshop
                    log.debug('disponible_eshop',disponible_eshop)
                    var itemType = dataItem['recordtype']
                    log.debug('itemType',itemType)
                    if(disponible_eshop > 0  && (custbody_so_eshop == true || locationSO == 53) ){//Cambiar Ermita 82 && locationSO == 53
                        //Restar quantity del stock eshop
                        log.debug('entra if')
                        var quantitySalesOrder = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: e
                        })
                        log.debug('quantitySalesOrder',quantitySalesOrder)
                        var stockAfter = disponible_eshop - quantitySalesOrder //Nuevo stock de Eshop, Disponibler eshop menos lo que acabamos de vender
                        log.debug('stockAfter',stockAfter)
                        record.submitFields({
                            type: itemType,
                            id: tmp_id,
                            values: { custitem_disponible_eshop: stockAfter}
                        })
                        //Actualizar SO apartados
                        log.debug("cargar")
                        var transaccionApartado = dataItem.custitem_transaccion_apartados[0]
                        log.debug('transaccionApartados', transaccionApartado)
                        var idSOaCargar = transaccionApartado.value
                        var cargarSO = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idSOaCargar,
                            isDynamic:true,
                        });
                        
                        var itemLines = cargarSO.getLineCount({
                            sublistId  : 'item'
                        });
                        //var items= []

                        for(var i=0; i < itemLines; i++){
                            var itemId = cargarSO.getSublistValue({
                                sublistId : 'item',
                                fieldId   : 'item',
                                line      : i
                            });
                            cargarSO.selectLine({
                                sublistId: 'item',
                                line: i
                            });
                            var setLocation = cargarSO.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                value: 53
                            });
                            
                            cargarSO.commitLine({//cierre de linea seleccionada 
                                sublistId: 'item'
                            }); 

                            if(tmp_id == itemId){
                                log.debug("actualizar")

                               
                                var itemQuantity = cargarSO.getSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'quantity',
                                    line      : i
                                });
                                cargarSO.selectLine({
                                    sublistId: 'item',
                                    line: i
                                });

                                var apartadoTotal= itemQuantity - quantitySalesOrder
                                cargarSO.setCurrentSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'quantity',
                                    value: apartadoTotal
                                    
                                });  
                                cargarSO.setCurrentSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'amount',
                                    value: 0.01
                                    
                                });
                                cargarSO.setCurrentSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'location',
                                    value: 53
                                    
                                });  
                                cargarSO.commitLine({//cierre de linea seleccionada 
                                    sublistId: 'item'
                                }); 
                                    

                                cargarSO.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                });
                            }

                        }
                    }
                }
            }
        }catch(e){
            log.debug('Error en Actualizacion Inventario ficticio eshop - Creacion',e)
        }
        try{
            if(type == 'edit'){
                //Proceso de cancelacion Reserva ficticia
                var op1 = rec.getValue('custbody_otro_financiamiento')
                var op1old = oldrec.getValue('custbody_otro_financiamiento')
                var op2 = rec.getValue('custbody_tipo_venta')
                var op2old = oldrec.getValue('custbody_tipo_venta')

                var so_first_canc = rec.getValue('custbody_so_first_canc')

                if( type == 'edit' && ( (op1 == 4 && op1!=op1old) || (op2 == 16 && op2 != op2old) ) && !so_first_canc){
                    log.debug('so_first_canc', so_first_canc)
                    var numLines = salesorder.getLineCount({//Toma las lineas de la SO
                        sublistId: 'item'
                    });
                    log.debug('numLines',numLines)
                    for(var e =0; e<numLines; e++){ //Se recorre cada linea
                        log.debug('e',e)
                        var tmp_id = rec.getSublistValue({//ID del item
                            sublistId: 'item',
                            fieldId: 'item',
                            line: e
                        })
                        var locationSO = rec.getValue('location')
                        var custbody_so_eshop = rec.getValue('custbody_so_eshop') //Check del restlet que indica que viene de tienda en linea
                        var dataItem = search.lookupFields({// Busqueda de Invdentory Item
                            type: 'item',
                            id: tmp_id,
                            columns: ['custitem_disponible_eshop','recordtype','custitem_transaccion_apartados']//Stock disponible en el campo para eshop, tipo de registro
                        });

                        log.debug('dataItem',dataItem)
                        var disponible_eshop = parseInt(dataItem['custitem_disponible_eshop'],10) //Stock dedicado a eshop
                        log.debug('disponible_eshop',disponible_eshop)
                        var itemType = dataItem['recordtype']
                        log.debug('itemType',itemType)
                        if(disponible_eshop > 0 && (custbody_so_eshop == true || locationSO == 53)) {//Cambiar a Ermita 82  && locationSO == 53 
                            //Restar quantity del stock eshop
                            var quantitySalesOrder = rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: e
                            })
                            log.debug('quantitySalesOrder',quantitySalesOrder)
                            var stockAfter = disponible_eshop + quantitySalesOrder //Nuevo stock de Eshop, Disponibler eshop menos lo que acabamos de vender
                            log.debug('stockAfter',stockAfter)
                            record.submitFields({
                            type: itemType,
                            id: tmp_id,
                            values: { custitem_disponible_eshop: stockAfter}
                            })
                            //Actualizar SO apartados cancelacion
                        log.debug("cargar cancelacion")
                        var transaccionApartado = dataItem.custitem_transaccion_apartados[0]
                        log.debug('transaccionApartados', transaccionApartado)
                        var idSOaCargar = transaccionApartado.value
                        var cargarSO = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idSOaCargar,
                            isDynamic:true,
                        });
                        
                        var itemLines = cargarSO.getLineCount({
                            sublistId  : 'item'
                        });
                        //var items= []

                        for(var i=0; i < itemLines; i++){
                            var itemId = cargarSO.getSublistValue({
                                sublistId : 'item',
                                fieldId   : 'item',
                                line      : i
                            });
                            cargarSO.selectLine({
                                sublistId: 'item',
                                line: i
                            });
                            var setLocation = cargarSO.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                value: 53
                            });
                            
                            cargarSO.commitLine({//cierre de linea seleccionada 
                                sublistId: 'item'
                            }); 

                            if(tmp_id == itemId){
                                log.debug("actualizar")

                               
                                var itemQuantity = cargarSO.getSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'quantity',
                                    line      : i
                                });
                                cargarSO.selectLine({
                                    sublistId: 'item',
                                    line: i
                                });

                                var apartadoTotal= itemQuantity + quantitySalesOrder
                                cargarSO.setCurrentSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'quantity',
                                    value: apartadoTotal
                                    
                                });  
                                cargarSO.setCurrentSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'amount',
                                    value: 0.01
                                    
                                });
                                cargarSO.setCurrentSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'location',
                                    value: 53
                                    
                                });  
                                cargarSO.commitLine({//cierre de linea seleccionada 
                                    sublistId: 'item'
                                }); 
                                    

                                cargarSO.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                });
                            }

                        }

                            var submitFieldsSalesOrder = record.submitFields({
                                type: record.Type.SALES_ORDER,
                                id: recordid,
                                values: {'custbody_so_first_canc':true}
                            });
                        }
                    }
                
                }
            }
        }catch(e){
            log.debug('Error en Actualizacion Inventario ficticio eshop - Cancelacion',e)
        }
            
            
        
        //Actualizar campo RECLUTADORA
        if(type == 'edit'){
            var newRec = scriptContext.newRecord;
            var oldRec = scriptContext.oldRecord;

            var newSalesrep = newRec.getValue('salesrep')
            var oldSalesrep = oldRec.getValue('salesrep')
            var newTipoVenta = newRec.getValue('custbody_tipo_venta')
            
            if(newSalesrep != oldSalesrep && newSalesrep && newTipoVenta == 2){

                reclutadoraNewSalesRep = search.lookupFields({
                    type: 'employee',
                    id: newSalesrep,
                    columns: "custentity_reclutadora"
                })["custentity_reclutadora"][0].value;
               
                record.submitFields({
                    type: newRec.type,
                    id: newRec.id,
                    values: { "custbody_vw_recruiter": reclutadoraNewSalesRep }
                });

            }
        }
        




        return true;
        
        
        
    }
    function itemtype(scriptContext){
        try{
            log.debug('nueva funcion ')
            var type = scriptContext.type;
            var rec = scriptContext.newRecord;
            if(type == 'create' || type == 'edit'){
                var recordid = rec.id;
                var salesorder = record.load({//Cargar registro 
                    type: 'salesorder',
                    id: recordid,
                    isDynamic: false
                });
                var nonInventory = 0
                var inventory = 0
                var numLines = salesorder.getLineCount({//cuenta las lineas de mi sublista 
                    sublistId : 'item'
                });
             
                
                for(var e =0; e<numLines; e++){ 
                    var item_type = salesorder.getSublistValue({
                         sublistId: 'item',
                         fieldId: 'itemtype',
                         line: e
                    })
                    log.debug('item_type',item_type)
                    if(item_type == 'NonInvtPart'){
                        nonInventory++
                    } else{
                        inventory++
                    }
                    if(inventory > 0 && nonInventory <= 0){
                        salesorder.setValue('custbody_inv_type','1')
                    }else if (nonInventory > 0 && inventory <= 0) {
                        salesorder.setValue('custbody_inv_type','2')
                    }else if (nonInventory > 0 && inventory > 0) {
                        salesorder.setValue('custbody_inv_type','3')
                    }
                }
                
                    salesorder.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

            }
                
        }catch(e){
            log.error('error is serial',e)
        }
    }
   
    function cancelacion(scriptContext){
        try{
            log.debug('cancelacion ')
            var rec = scriptContext.newRecord;
            var type = scriptContext.type;
            
            if( type == 'edit'){
                var recordid = rec.id;
                var salesorder = search.lookupFields({
                    type: 'salesorder',
                    id: recordid,
                    columns: ['custbody_tipo_venta']
                });
                var salesOrderRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: recordid,
                    isDynamic: true
                });
                var numLinesRecords = salesOrderRecord.getLineCount({
                    sublistId: 'links'
                });
                log.debug('numLinesRecords',numLinesRecords)
                var tipoVenta = salesorder.custbody_tipo_venta[0].value
                log.debug('tipoVenta',tipoVenta)
                if(tipoVenta == 16 && numLinesRecords == 0){
                    // Cargar el registro completo y actualizarlo
                    var salesOrderRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: recordid,
                        isDynamic: true
                    });
                    
                    // Obtener el número de líneas en la sublista item
                    var numLines = salesOrderRecord.getLineCount({
                        sublistId: 'item'
                    });
                    
                    log.debug('numLines to close', numLines);
                    
                    // Cerrar cada línea individualmente
                    for(var i = 0; i < numLines; i++){
                        salesOrderRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        
                        // Marcar la línea como cerrada
                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            value: true
                        });
                        
                        salesOrderRecord.commitLine({
                            sublistId: 'item'
                        });
                        
                        log.debug('Line ' + i + ' closed');
                    }
                    
                    // Cambiar el status de la orden
                    salesOrderRecord.setValue({
                        fieldId: 'status',
                        value: 'Closed'
                    });
                    
                    salesOrderRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    
                    log.debug('after submitcancelacion')
                }

            }
                
        }catch(e){
            log.error('error cancelacion',e)
        }
    }
    function earningProgram(salesrep){
        try{
            log.debug('[' + salesrep + '] INICIO earningProgram')
            var presentadorFields = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: salesrep,
                columns: [
                    'custentity_checkbox_eptm7',           // es earning program?
                    'custentity_fcha_inicio_eptm7',        // fecha de inicio
                    'custentity_fcha_fin_eptm7',           // fecha limite
                    'custentity_estatus_eptm7',            // status
                    'custentity_so_ganotm7',               // orden con la que gano tm7
                    'custentity_fechatm7_ganada',          // fecha en que gano tm7
                    'custentity_ovs_ep7'                   // arreglo de órdenes de venta procesadas
                ]
            });

            //Determinacion de limite de ventas
            const epTm7 = presentadorFields.custentity_checkbox_eptm7;
            log.debug('[' + salesrep + '] epTm7', epTm7)
            
            // es eptm7?
            if(epTm7){
                var limit = 3
                var newStatus
                // Determinar el límite basado en la diferencia de días entre fechas
                const fecha_inicio = presentadorFields.custentity_fcha_inicio_eptm7;
                const fecha_fin = presentadorFields.custentity_fcha_fin_eptm7;
                
                if (fecha_inicio && fecha_fin) {
                    // Convertir fechas usando el formato de NetSuite
                    var fechaInicio = Utils.stringToDate(fecha_inicio);
                    var fechaFin = Utils.stringToDate(fecha_fin);
                    
                    // Calcular diferencia en días
                    var diferenciaTiempo = fechaFin.getTime() - fechaInicio.getTime();
                    var diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
                    
                    // Logs agrupados para debugging de fechas
                    log.debug('[' + salesrep + '] === CALCULO DE LIMITE ===');
                    log.debug('[' + salesrep + '] fecha_inicio', fecha_inicio);
                    log.debug('[' + salesrep + '] fecha_fin', fecha_fin);
                    log.debug('[' + salesrep + '] fechaInicio (Date)', fechaInicio);
                    log.debug('[' + salesrep + '] fechaFin (Date)', fechaFin);
                    log.debug('[' + salesrep + '] diferenciaDias', diferenciaDias);
                    
                    // Si hay más de 31 días, el límite es 4, sino es 3
                    if (diferenciaDias > 40) {
                        limit = 4;
                        newStatus = 4
                        log.debug('[' + salesrep + '] *** LIMITE ESTABLECIDO EN 4 (más de 31 días) ***');
                    } else {
                        limit = 3;
                        newStatus = 1
                        log.debug('[' + salesrep + '] *** LIMITE ESTABLECIDO EN 3 (31 días o menos) ***');
                    }
                } else {
                    log.debug('[' + salesrep + '] *** LIMITE ESTABLECIDO EN 3 (fechas no disponibles) ***');
                }
                
                const fecha_ganotm7 = presentadorFields.custentity_fechatm7_ganada;
                
                //Manejo de fechas
                var fechaTermino;
                
              
                fechaTermino = presentadorFields.custentity_fcha_fin_eptm7;
                log.debug('[' + salesrep + '] fechaTermino',fechaTermino  )
  
                
                //fechaTermino_format_search = Utils.stringToDate(fechaTermino);
                log.debug('[' + salesrep + '] Datos de presentador',presentadorFields )
                
                    
                var cont = 1
                
                var setfechafin = false
                var soGanadora = ''
                var fechaSO 
                var ordenesProcesadas = [] // Arreglo para almacenar las órdenes procesadas
                
                var soSearch = search.load({
                    id: 'customsearch_so_commission_status_2' //busqueda de so 
                });
                soSearch.filters.push(search.createFilter({
                        name: 'salesrep',
                        operator: 'is',
                        values: salesrep
                }));
                soSearch.filters.push(search.createFilter({
                        name: 'trandate',
                        operator: 'within',//revisar
                        values: [fecha_inicio,fechaTermino]    // fecha en que inicio el presentador en el earning program
                }));
                
                log.debug('[' + salesrep + '] === PROCESANDO ORDENES ===');
                log.debug('[' + salesrep + '] limit configurado', limit);
                    
                soSearch.run().each(function(r){
                    var internalId = r.getValue('internalid')
                    var tipoVenta = r.getValue('custbody_tipo_venta')
                    fechaSO = r.getValue('trandate')
                    
                    // Solo agregar la orden al arreglo si no hemos excedido el límite
                    if (cont <= limit) {
                        ordenesProcesadas.push(internalId);
                       
                    }
                    
                   log.debug('[' + salesrep + '] Procesando orden ' + cont + ' de ' + limit + ' - ID: ' + internalId + ' - Tipo: ' + tipoVenta)
                    switch(cont){
                        case 1:
                        log.debug('[' + salesrep + '] case1 ',fechaSO)
                            newStatus = 2
                            break;
                        case 2:
                        log.debug('[' + salesrep + '] case2 ',fechaSO) 
                            newStatus = 2
                            break;
                        case 3: 
                        log.debug('[' + salesrep + '] case3 ',fechaSO)
                            if(limit == 3){
                                newStatus = 3
                                setfechafin = true 
                                soGanadora = internalId
                                log.debug('[' + salesrep + '] *** TM7 GANADA EN ORDEN 3 ***');
                            }
                            
                            break;
                        case 4: 
                        log.debug('[' + salesrep + '] case4 ',fechaSO)
                            if(limit == 4){
                                newStatus = 3
                                setfechafin = true 
                                soGanadora = internalId
                                log.debug('[' + salesrep + '] *** TM7 GANADA EN ORDEN 4 ***');
                            }
                            break;
                        
                        default: 
                            newStatus = ''
                            log.error('[' + salesrep + '] ERROR switch - contador fuera de rango')
                            break;
                    
                    }
                    log.debug('[' + salesrep + '] newStatus ',newStatus)
                    log.debug('[' + salesrep + '] fechaSO ',fechaSO)
                    log.debug('[' + salesrep + '] soGanadora ',soGanadora)
                    log.debug('[' + salesrep + '] setfechafin ',setfechafin)
                    cont++
                   
                   // Terminar la búsqueda si alcanzamos el límite
                   if(cont > limit){
                     log.debug('[' + salesrep + '] *** LIMITE ALCANZADO - TERMINANDO BUSQUEDA ***');
                     return false;
                   }
                
                   
                    return true
                });  
                
                // Preparar valores para actualizar el empleado
                var valoresActualizacion = {
                    'custentity_ovs_ep7': ordenesProcesadas.join(',') // Convertir arreglo a string separado por comas
                };
                
                if(!setfechafin){
                    fechaSO = fechaTermino
                }
                
                log.debug('[' + salesrep + '] === ACTUALIZANDO EMPLEADO ===');
                log.debug('[' + salesrep + '] newStatus sub',newStatus)
                log.debug('[' + salesrep + '] fechaSO sub',fechaSO)
                log.debug('[' + salesrep + '] soGanadora sub',soGanadora)
                log.debug('[' + salesrep + '] ordenesProcesadas', ordenesProcesadas)
                    
                // Agregar los campos adicionales cuando gana
                valoresActualizacion['custentity_estatus_eptm7'] = newStatus;
                valoresActualizacion['custentity_fechatm7_ganada'] = fechaSO;
                valoresActualizacion['custentity_so_ganotm7'] = soGanadora;
                
                // Actualizar el empleado con todos los valores
                record.submitFields({
                    type: 'employee',
                    id: salesrep,
                    values: valoresActualizacion
                });
                
                log.debug('[' + salesrep + '] *** EMPLEADO ACTUALIZADO EXITOSAMENTE ***');
            } else {
                log.debug('[' + salesrep + '] No es EP TM7 - saltando proceso');
            }
            

        }catch (e){
            log.error('[' + salesrep + '] ERROR funcion earning program',e)
        }

    }
    function commissionStatus(salesrep){
        try{
            
            var presentadorFields = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: salesrep,
                columns: [
                    'custentity123',                           // configuracion
                    'custentity_promocion',                    // promocion
                    'custentity72',                           // reactivacion
                    'custentity_fin_objetivo_2_reactivacion',  // fecha fin objetivo reactivacion
                    'custentity_fin_objetivo_2',               // fecha fin objetivo
                    'hiredate',                                 // fecha contratacion
                    'custentity_tipo_ingreso'             // tipo de ingreso
                ]
            });

            //Determinacion de limite de ventas
            const configuracion = presentadorFields.custentity123;
            var limit = 6
            for (i = 0; i < configuracion.length ; i++){
                if(configuracion[i].value == 15){
                    limit = 3
                }else if(configuracion[i].value == 11 || configuracion[i].value == 12 || configuracion[i].value == 13 || configuracion[i].value == 14){//TM6R o TM4U
                    limit = 4
                }
            }

            const promocion = presentadorFields.custentity_promocion[0].value;
            const reactivacion = presentadorFields.custentity72;
            const tipoIngreso = presentadorFields.custentity_tipo_ingreso[0].value;
            //Manejo de fechas
            var fechaObj2;
            var hiredate;
            if (reactivacion) {
                fechaObj2 = presentadorFields.custentity_fin_objetivo_2_reactivacion;
                hiredate = reactivacion;
            } else {
                fechaObj2 = presentadorFields.custentity_fin_objetivo_2;
                hiredate = presentadorFields.hiredate;
            }
            //hiredate = Utils.dateToString(hiredate);
            fechaObj2 = Utils.stringToDate(fechaObj2);
            log.debug('Datos de presentador',presentadorFields )
            
            //Define fecha en que se convierte en TM propia
            var busqueda = search.load({
                id: 'customsearch_emp_promo_control'
            });
            busqueda.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'is',
                values: salesrep
            }));

            var date_transform_tm_propia = new Date();
            date_transform_tm_propia.setDate(date_transform_tm_propia.getDate() + 3); //Suma un dia para nunca cumplir la validacion en caso de que el EMP aun no sea TM propia
            
            busqueda.run().each(function(r){
                var todo = r.getAllValues();
                aux_date_tm_propia = todo["GROUP(custentityaux_date_tm_propia)"]
                if(aux_date_tm_propia){
                    date_transform_tm_propia = Utils.stringToDate(aux_date_tm_propia)
                }else{
                    date_transform_tm_propia = todo["MAX(systemNotes.date)"]//Fecha en formato 4/10/2024 9:15 AM 
                    date_transform_tm_propia = Utils.stringToDate(date_transform_tm_propia.split(' ')[0])
                }
                return true;
            });
            log.debug('date_transform_tm_propia',date_transform_tm_propia)
            //Fin de validacion de fecha        

            log.debug('Datos por variables','promocion '+promocion+' reactivacion '+reactivacion+' fechaObj2 '+fechaObj2+' hiredate '+hiredate +' limit '+limit +' date_transform_tm_propia '+date_transform_tm_propia +' tipoIngreso '+tipoIngreso)

                
            var cont = 1
               
            var soSearch = search.load({
                id: 'customsearch_so_commission_status' //busqueda de so 
            });
            soSearch.filters.push(search.createFilter({
                    name: 'salesrep',
                    operator: 'is',
                    values: salesrep
            }));
            soSearch.filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorafter',
                    values: hiredate
            }));
                
            soSearch.run().each(function(r){
                var internalId = r.getValue('internalid')
                var tipoVenta = r.getValue('custbody_tipo_venta')
                var fechaSO = r.getValue('trandate')
                fechaSO = Utils.stringToDate(fechaSO)

                if(tipoIngreso == 11 && promocion == 2){
                    log.debug('caso 1')
                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: internalId,
                        values: {'custbody_vw_comission_status':''}
                    });
                }else if( (fechaSO > date_transform_tm_propia || fechaSO > fechaObj2 || cont > limit) && promocion == 2 ){
                    log.debug('caso 2')
                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: internalId,
                        values: {'custbody_vw_comission_status':''}
                    });
                }else {
                    log.debug('caso 3')
                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: internalId,
                        values: {'custbody_vw_comission_status':'2'}
                    });
                }
                cont++
                if (cont >= 7) {
                    return false
                }
                return true
            });  

        }catch (e){
            log.debug('error funcion comision status',e)
        }

    }

    function setRecruiter(objRecord){
        try{
            var idSalesRep = objRecord.getValue('salesrep');
            var objRecruiter = search.lookupFields({
                type: 'employee',
                id: idSalesRep,
                columns: ['custentity_reclutadora']
            });
            log.debug('This is objRecruiter',objRecruiter);
            if(objRecruiter.custentity_reclutadora.length > 0){
                var idRecruiter = objRecruiter['custentity_reclutadora'][0]['value'];
                if(idRecruiter){
                    var objRecruiter = search.lookupFields({
                        type: 'employee',
                        id: idRecruiter,
                        columns: 'isinactive'
                    });
                    if(objRecruiter.isinactive == false){
                        var submitRecruiter = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: objRecord.id,
                            values: {
                                custbody_vw_recruiter: idRecruiter
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields : true
                            }
                        });
                    }
                }
            }
           
            
        }
        catch(e){
            log.error('There is an error in setRecruiter',e);
        }
    }
    
    function emailAndApprove(senderId,recipientEmail,emailSubject,emailBody,recordid,email_bbc){
        try{
            log.debug('senderId',senderId);
            log.debug('recipientEmail',recipientEmail);
            log.debug('emailBody',emailBody);
            log.debug('recordid',recordid);
            log.debug('email_bbc',email_bbc);
            email.send({
                author: senderId,
                recipients: recipientEmail,
                subject: emailSubject,
                bcc: [email_bbc],
                body: emailBody,
                relatedRecords: {
                    transactionId: recordid
                }
            });
        }catch(err){
            log.error("error email send",err)
        }
        
        try{
            var submitFields = record.submitFields({
                type: record.Type.SALES_ORDER,
                id: recordid,
                values: {'orderstatus':'B','custbody_email_send':true}
            });
        }catch(e){
            log.error("error","send info");
            return {error_payment:e};
        }
        
    }
    

    function getColumnsFiltersSOCommission(idSalesRep){
        var soFilters = [
            {
                name: 'salesrep',
                operator: 'anyof',
                values: idSalesRep
            },
            //historico
            //*validar que si hay un filtro de fecha para no traer todo
            /*{
                name: 'trandate',
                operator: 'within',
                values: 'thisMonth'
            },*/
            {
                name: 'mainline',
                operator: 'is',
                values: true
            },
            {
                name: 'custbody_tipo_venta',
                operator: 'anyof',
                values: [1, 2, /*18,*/ 19]//1 - TM Ã³ CK Ganada, 2 - Ventas TM o Ventas CK, 19 - TM Ã³ CK Pagada
                //18 -> E-SHOP VORWERK -> validar si es por tipo o items
            },
            {
                name: 'custbody_vw_comission_status',
                operator: 'anyof',
                values: [2, '@NONE@']//No comisionable
                //Pendiente validar filtro @NONE@
            }
        ],
        soColumns = [
            { name: 'internalid' },
            { name: 'entity' },
            { name: 'email', join: 'customer'},
            { name: 'custbody_tipo_venta'},
            { name: 'trandate', sort: search.Sort.ASC},
            { name: 'custbody_vw_comission_status' },
            { name: 'total' }

        ];

        var objSearchData = {
            'filters': soFilters,
            'columns': soColumns
        };
        return objSearchData;
    }

    function searchSalesOrder(objData){
        try{
            //<!--Borrar si no se requiere
            var currentDate = new Date(),
                fDate = format.format({value:currentDate,type:format.Type.DATE});
            var objFilterCurrentDate = {
                name: 'trandate',
                operator: 'onorafter',
                values: fDate
            };
            //-->
            var arrFilters = (objData.hasOwnProperty('filters')) ? objData['filters'] : objFilterCurrentDate,
                arrColumns = (objData.hasOwnProperty('columns')) ? objData['columns'] : [{ name: 'internalid' }];
            var searchSO = search.create({
                type: 'salesorder',
                filters: arrFilters,
                columns: arrColumns
            });
            return searchSO;
        }
        catch(e){
            log.debug('There is an error in searchSalesOrderBySalesRep',e);
        }
    }

    function searchPromoSalesRep(idSalesRep){
        try{
            var objPromo = search.lookupFields({
                type: 'employee',
                id: idSalesRep,
                columns: ['custentity_promocion','email']
            });
            return setObjReturn(objPromo,'searchPromoSalesRep successful',false);
        }
        catch(e){
            log.debug('There is an error in searchPromoSalesRep',e);
        }
    }

    function setObjReturn(data,message,errorVal){
        return {
            data: data,
            message: message,
            error: errorVal
        }
    }
    
    
    function tmGanada(scriptContext){
        try{
                
                var date;
                var dateReact;
                var firstso = '';
                var numOrder;
                var count = 0;
                var rec = scriptContext.newRecord;
                var numOrders = [];
                var internals = [];
                var odv=  "";
                var odv_ganaTM = 6
                if(rec.getValue('salesrep') == 12000 || rec.getValue('salesrep') == 16581){//Mixivorwerk y compensaciones thermomix
                    return false;
                }
                if(rec.getValue('custbody_tipo_venta') == 19){
                    odv = rec.getValue('custbody_presentadora_tm_paga');
                }else{
                    odv = rec.getValue('salesrep');
                }
                                
                var salesRep = search.lookupFields({//busqueda de presentadora
                    type: 'employee',
                    id: odv,
                    columns: ['custentity72','hiredate','custentity123','altname','custentity_promocion']//obtencion de fechas 
                });
                var configuracion = salesRep.custentity123
                var delegate = salesRep.custentity_promocion[0]['value'];
                for (i = 0; i < configuracion.length ; i++){
                    if(configuracion[i].value == 15){
                        odv_ganaTM = 3
                    }else if(configuracion[i].value == 11 || configuracion[i].value == 12 || configuracion[i].value == 13 || configuracion[i].value == 14 ){//TM6R o TM4U
                        odv_ganaTM = 4
                    }
                }
                
                
                if(salesRep.custentity72 != ''){
                    dateReact = salesRep.custentity72//si la fecha esta vacia toma la fecha de reactivacion
                }else{
                    dateReact = salesRep.hiredate//si no toma la fecha de creacion 
                }
                
                 var busqueda = search.create({
                     type: 'salesorder',
                     columns: ['internalid','custbody_tipo_venta','tranid'],
                     filters: [
                         ['salesrep','anyof',odv]
                         ,'and',
                         ['mainline','is',true],'and',['trandate','onorafter',dateReact],
                         'and',
                         ['custbody_otro_financiamiento','noneof',4]
                     ]
                 });
                  
                var pagedResults = busqueda.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                        numOrders.push({
                         internalid: r.getValue('internalid'),
                         typeso: r.getValue('custbody_tipo_venta'),
                         tranid: r.getValue('tranid'),
                         
                       })   
                    });
                });
                //log.debug('numOrders',numOrders);
                if(numOrders.length >  6 || delegate == 2){
                    return false;
                }
                log.debug('count pre if ',count)
                //Agrupado de ordenes 
                for(var index in numOrders){
                      
                    log.debug('orders',numOrders[index])
                    if(numOrders[index].typeso == 2){
                        internals.push({
                            internalodv: numOrders[index].internalid
                        })
                        count++
                      }
                      if(numOrders[index].typeso == 35 || numOrders[index].typeso == 33){//TM6 Pagada en Espera, Nuevo Presentador Digital Credit
                        firstso = numOrders[index].internalid  
                        var digital_id = numOrders[index].tranid
                      }
                      
                }
                var numOdv = internals.length;//extrallendo numero de valores en el arreglo
                log.debug('numOdv',numOdv) 
                log.debug('info debug','count'+count+' firstso '+firstso+' type '+scriptContext.type );
                  
                log.debug('context',runtime.executionContext);
                //AJUSTE PARA CONSIDERAR PROMOCION TM EN PRESTAMO
                
                if( rec.getValue('custbody_tipo_venta') != 19 && delegate != 5 && delegate != 2){//edit
                    log.debug('cuantos',count)
                    if(count >= odv_ganaTM && firstso != '' ){//Necesita tener First SO porque es la que cambia a TM Ganada
                        log.debug('comission antes de flujo TM ganada')
                        var objEmployee = record.load({//Cargar registro 
                            type: 'employee',
                            id: odv,
                            isDynamic: false
                        });
                        log.debug('seteo tm propia al employee: ',odv)
                        objEmployee.setValue('custentity_promocion','2')
                        objEmployee.setValue('custentity_pedido_tm_ganada',digital_id)
                        objEmployee.save();
                        
                        var salesorder = record.load({//Cargar registro 
                            type: 'salesorder',
                            id: firstso,
                            isDynamic: false
                        });
                      
                        date = rec.getValue('trandate');
                        numOrder = salesorder.getValue('tranid')
                        record.submitFields({//setear tipo de venta tm ganada
                              type: 'salesorder',
                              id: firstso,
                              values: {'custbody_tipo_venta':'1','trandate':date,'custbody_vw_comission_status':'2'}
                        })
                        /*
                        salesorder.setValue('trandate',date);
                        salesorder.setValue('custbody_tipo_venta','1')
                        salesorder.setValue('custbody_vw_comission_status','2')*/
                        var numLines = salesorder.getLineCount({//cuenta las lineas de mi sublista 
                            sublistId : 'item'
                        });
                     

                        //Descuento TM Ganada 
                        var arr_aux =[];
                        var valid_line = 0  
                        
                        var descuentoTm = 0//pagatutm(numOdv,salesrep)*(-1);
                        var setearArticulos = true
                        for(var e =0; e<numLines; e++){ 
                             var tmp_id = salesorder.getSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'item',
                                 line: e
                             })
                             var location = salesorder.getSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'location',
                                 line: e
                             })
                            if(tmp_id != 2170 && tmp_id != 2001 && tmp_id != 2280 && tmp_id != 2490 && tmp_id != 2571 && tmp_id !=2638 && tmp_id != 2671){//2170=TM6 & Varoma 120V UL USA CA MX (24),2001=TM6 & Varoma 120V UL MX US,2280=TM6R,2490= Black,2571=Spark,2638=kit k00190
                                var tmp_amount = salesorder.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    line: e
                                })      
                                arr_aux.push({
                                    id:tmp_id,
                                    mount:tmp_amount,
                                    location:location
                                })
                            }else{
                                valid_line = e;
                                var tmp_amount = salesorder.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    line: e
                                })  
                                log.debug('tmp_amount tm',tmp_amount)
                                log.debug('tmp_id tm',tmp_id)
                                descuentoTm = (tmp_amount-0.01)*(-.84)
                            }
                            
                        }
                        try {
                            for(var i =0; i<numLines-1; i++){
                                var x =0;
                                if(valid_line == 0){
                                       x=1;
                                }
                                var tmp_id = salesorder.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: x
                                })
                                log.debug('tmp_id',tmp_id+'  line  '+i)
                                if(tmp_id != 2170 && tmp_id != 2001 && tmp_id != 2280 && tmp_id != 2490 && tmp_id != 2571 && tmp_id !=2638 && tmp_id !=2671){//2170=TM6 & Varoma 120V UL USA CA MX (24),2001=TM6 & Varoma 120V UL MX US,2280=TM6R,2490= Black,2571=Spark,2638=kit k00190
                                    
                                        salesorder.removeLine({
                                            sublistId: 'item',
                                            line: x
                                        });
                                    
                                    
                                }
                            }
                            salesorder.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });
                        }catch(e){
                            log.error('Error removeLine',e)
                            setearArticulos = false
                            record.submitFields({//setear memo
                                  type: 'salesorder',
                                  id: firstso,
                                  values: {'memo': 'Orden ejecuta flujo de TM, pero uno o más artículos cuenta con cumplimiento del pedido por lo que no se puede asignar el descuento.'}
                            })
                        }
                        if(setearArticulos == true){
                            var salesorder = record.load({//Cargar registro 
                                type: 'salesorder',
                                id: firstso,
                                isDynamic: true
                            });
                            log.debug('descuentoTm',descuentoTm);
                            salesorder.selectNewLine({
                                sublistId : 'item',//seleccion de linea
                            });
                            salesorder.setCurrentSublistValue({//seteo de valor quantity
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: 1
                            });
                            salesorder.setCurrentSublistValue({//seteo de location
                                sublistId: 'item',
                                fieldId: 'location',
                                value: salesorder.getValue('location')
                            });
                            salesorder.setCurrentSublistValue({//seteo de item
                                sublistId: 'item',
                                fieldId: 'item',
                                value: '1876'// descuento original 911 - cambio por 1876
                            });
                            salesorder.setCurrentSublistValue({//seteo de descuento aplicado 
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: descuentoTm
                            });
                            salesorder.setCurrentSublistValue({//seteo de descuento aplicado
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: descuentoTm
                            });
                            salesorder.setCurrentSublistValue({//seteo de descuento aplicado
                                sublistId: 'item',
                                fieldId: 'description',
                                value: 'DESCUENTO PROMOCIONAL'
                            });
                            salesorder.setCurrentSublistValue({//seteo de descuento aplicado
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                value: 202
                            });
                            salesorder.commitLine({//cierre de linea seleccionada 
                                sublistId: 'item'
                            });
                            log.debug('que trae',arr_aux)
                            
                            
                            
                            for(var x in arr_aux){
                                try{
                                    salesorder.selectNewLine({
                                        sublistId : 'item',//seleccion de linea
                                    });
                                    salesorder.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        value: arr_aux[x].id
                                    });
                                    salesorder.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: arr_aux[x].mount
                                    });
                                    salesorder.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        value: arr_aux[x].mount
                                    });
                                    salesorder.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        value: arr_aux[x].location
                                    });
                                    salesorder.commitLine({//cierre de linea seleccionada 
                                        sublistId: 'item'
                                    });
                                
                                }catch(aux){
                                    
                                    log.debug('que pasa',aux)
                                }
                            }
                            
                            
                            salesorder.setValue('custbody_vorwerk_descuento',true) //seteo de checkbox descuento
                            salesorder.setValue('trandate',fdate)
                            var idODV = salesorder.save();
                            log.debug('idODV',idODV);
                        }
                        
                        //Fin Descuento TM Ganada 
                      
                        
                       
                     
                     
                     return numOdv;
                     
                    }else if(count <= odv_ganaTM ){//igual? se borra?
                        for(inter in internals){
                          /*record.submitFields({
                              type: 'salesorder',
                              id: internals[inter].internalodv,
                              values: {'custbody_vw_comission_status':'2'}
                          })*/
                        }
                    }
                    
                }
                
                log.debug('custbody_tipo_venta',rec.getValue('custbody_tipo_venta'))
                                            
        }catch(err){
            log.debug('error flujo tm ganada',err);
        }
    }
    
    
   
    function pagatutm(numOdv,salesrep){
        try{
            var reacondicionamiento = false // AÃ±adir variable a funcion al agregar tmr
            var tm4u = false
            var salesRep = search.lookupFields({
                type: 'employee',
                id: salesrep,
                columns: ['custentity123']
            });
            var configuracion = salesRep.custentity123
             for (i = 0; i < configuracion.length ; i++){
                if(configuracion[i].value == 11){
                    reacondicionamiento = true
                }
                if(configuracion[i].value == 12){
                    tm4u = true
                }
             }
             var descuentoTm = 0;
            var tabla_Tm = {};
            var busqueda = search.create({//extraccion de tabla con descuentos predefinidos 
                type: 'customrecord_vw_tabla_paga_tm',
                columns: ['custrecord_vw_no_ventas','custrecord_vw_descuento','custrecord_vw_precio_equipo','custrecord_vw_precio_a_pagar'],
                filters: [
                    ['isinactive','is',false]
                ]
            });
            if(reacondicionamiento){
                busqueda.filters.push(search.createFilter({
                   name: 'custrecord_es_reacondicionamiento',
                   operator: 'is',
                   values: true
               }));
            }else{
                busqueda.filters.push(search.createFilter({
                   name: 'custrecord_es_reacondicionamiento',
                   operator: 'is',
                   values: false
               }));
            }
            if(tm4u){
                busqueda.filters.push(search.createFilter({
                   name: 'custrecordtm64u',
                   operator: 'is',
                   values: true
               }));
            }else{
                busqueda.filters.push(search.createFilter({
                   name: 'custrecordtm64u',
                   operator: 'is',
                   values: false
               }));
            }
             busqueda.run().each(function(r){//almacenamiento en el object los valores de la tabla 
                 tabla_Tm[r.getValue('custrecord_vw_no_ventas')]={
                     
                     descuento:r.getValue('custrecord_vw_descuento'),
                     precio:r.getValue('custrecord_vw_precio_equipo'),
                     total:r.getValue('custrecord_vw_precio_a_pagar')
                    
               
                 }
                 return true;
             });
             log.debug('numOdv',numOdv);
             log.debug('tabla_Tm',tabla_Tm);
            if(numOdv >=0){
                descuentoTm = tabla_Tm[numOdv].descuento//comparacion de numero de ordenes de la presentadora 
            }
            
            return descuentoTm;
            
            
             
        }catch(err){
            
            log.debug('errortabla_Tm',err)
            return  0;
        }
    }
    
    
    
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
