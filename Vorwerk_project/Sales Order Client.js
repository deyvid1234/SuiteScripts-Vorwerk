/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/runtime','N/currentRecord','N/ui/dialog'],

function(record,search,https,runtime,currentRecord,dialog) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        
        return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        // La validación de stock se ha movido a validateLine para mejor control
        return true;
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
        // Validar stock cuando se confirma una línea de item
        if (scriptContext.sublistId === 'item') {
            var userObj = runtime.getCurrentUser();
            console.log('userObj', userObj);
            var idUser = userObj.id;
            var userPermisos = search.lookupFields({
                type: 'employee',
                id: idUser,
                columns: ['custentity_editaso_facturada']
            });
            var editaso_facturada = userPermisos.custentity_editaso_facturada;
            console.log('editaso_facturada', editaso_facturada);
            
            var currentRecord = scriptContext.currentRecord;
            var itemId = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });
            var quantityavailable = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantityavailable'
            });
            
            // Cargar información del item usando lookupFields
            var type = '';
            try{
                var inventoryitem = record.load({
                    type: 'inventoryitem',
                    id: itemId,
                    isDynamic: false,
                });
                type = inventoryitem.getValue('baserecordtype');
                console.log('Item cargado como inventoryitem, type:', type);
            }catch(e){
                try{
                    var inventoryitem = record.load({
                        type: 'noninventoryitem',
                        id: itemId,
                        isDynamic: false,
                    });
                    type = inventoryitem.getValue('baserecordtype');
                    console.log('Item cargado como noninventoryitem, type:', type);
                }catch(e2){
                    var inventoryitem = record.load({
                        type: 'serviceitem',
                        id: itemId,
                        isDynamic: false,
                    });
                    type = inventoryitem.getValue('baserecordtype');
                    console.log('Item cargado como serviceitem, type:', type);
                    type = 'serviceitem';
                }
            }
            
            console.log('Item ID obtenido:', itemId);
            console.log('Cantidad disponible:', quantityavailable);
            console.log('Tipo de item:', type);
                        
            if (quantityavailable < 1 && editaso_facturada == true && type != 'noninventoryitem') {
                dialog.alert({
                    title: 'Alerta',
                    message: 'No hay stock disponible para este item'
                });
                return false; // No permite guardar la línea
            }
        }
        
        return true; // Permite guardar la línea
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        try{
            var rec = scriptContext.currentRecord;
            var typeSales= rec.getValue('custbody_tipo_venta');
            // if(typeSales == '1'){
            //  alert('No se puede seleccionar este tipo de venta')
            //  return false;
            // }
            
            if(typeSales == '19' && rec.getValue('custbody_presentadora_tm_paga') == ''){
                alert('Debe de ingresar un valor en : PRESENTADORA TM PAGADA')
                return false;
            }
            
        }catch(err){
            console.debug('errorsaveRecord',err)
        }
        return true;
    }
    
    
    function requestTraking(idSalesOrder,companyname,phone,email_company,address,legalname){
        try{
            var apiKey = "",cont_trak = [], description = [],valid_tm = false, description_txt = "";
            if(runtime.envType  == "SANDBOX"){
                apiKey = "c9df5be32d150aaae2c5f3a2cddacb44" //Apikey Logistica 
            }else{
                apiKey = "c9df5be32d150aaae2c5f3a2cddacb44"
            }
            var thisRecord = currentRecord.get();
            console.log('thisRecord',thisRecord.getValue('custbody_tracking_dimensions'));
            //extrae los registros de guias relacionadas
            var busqueda = search.create({
                type: 'customrecord_guia_envio',
                columns: ['internalid'],
                filters: [
                    ['custrecord_id_sales_order','anyof',thisRecord.id],
                ]
            });
            busqueda.run().each(function(r){
                cont_trak.push(r.getValue('internalid'));
                return true;
            });
            console.log('cont_trak',cont_trak);
            
            var objSO = record.load({
                type: record.Type.SALES_ORDER,
                id: thisRecord.id,
                isDynamic: false,
            });
            console.log('objSO',objSO);
            //ApiKeys para Reparacion 
            var actualizarOPP = false
            var tipo_venta = objSO.getValue('custbody_tipo_venta')
            if( tipo_venta == 4 || tipo_venta == 17 || tipo_venta ==5){ //Garantía, Garantía Presentadora, Reparacion
                actualizarOPP = true
                if(runtime.envType  == "SANDBOX"){
                    apiKey = "5e3d413aa513b0316f42d4c7b34ea54d"
                }else{
                    apiKey = "5e3d413aa513b0316f42d4c7b34ea54d"
                }
            }

            var itemLines = objSO.getLineCount({
                sublistId  : 'item'
            });
            console.log('itemLines',itemLines);
            var description_aux = []
            for(var i=0; i < itemLines; i++){
                var itemId = objSO.getSublistValue({
                    sublistId : 'item',
                    fieldId   : 'item',
                    line      : i
                });
                if(itemId != 1441 && itemId != 859){
                    //valida si es la primer guia creada
                    if(cont_trak.length == 0){
                        if(itemId == 2001 || itemId == 2170 || itemId == 2490 || itemId == 2571){//en caso de ser la primera y tener tm6 toma su decripcion
                            description.push(objSO.getSublistValue({
                                sublistId : 'item',
                                fieldId   : 'description',
                                line      : i
                            }));
                            valid_tm = true;
                            break;
                        }else{//en caso de no encontrar tm6 y ser la primera guia debe tomar todas las descripciones
                            description_aux.push(objSO.getSublistValue({
                                sublistId : 'item',
                                fieldId   : 'description',
                                line      : i
                            }));
                        }
                    }else{//en caso de tener más de una guia toma todas las descripciones de los demás items
                        if(itemId != 2001 && itemId != 2170 && itemId != 2490 && itemId != 2571){
                            description.push(objSO.getSublistValue({
                                sublistId : 'item',
                                fieldId   : 'description',
                                line      : i
                            }));
                        }
                    }
                }
                
            }
            //si encontro tm6 y es la primer guía 
            if(valid_tm && cont_trak.length == 0){
                description_txt = description.join(',');
            }
            //si no encontro tm6 y es primer guia 
            if(!valid_tm && cont_trak.length == 0){
                description_txt = description_aux.join(',');
            }
            //si es una guia extra toma todos los items 
            if(cont_trak.length > 0){
                description_txt = description.join(',');
            }
            
            console.log('description_txt',description_txt);
            var id_dimention = "";
            //valida que el registro tenga una dimension asignada
            if(objSO.getValue('custbody_tracking_dimensions') ==  "" && (thisRecord.getValue('custbody_tracking_dimensions') == "" || thisRecord.getValue('custbody_tracking_dimensions') == null)){
                alert("Es necesrio seleccionar las dimensiones del paquete del campo TRACKING DIMENSIONS");
                return false;
            }else{
                id_dimention= objSO.getValue('custbody_tracking_dimensions')!=""?objSO.getValue('custbody_tracking_dimensions'):thisRecord.getValue('custbody_tracking_dimensions');
            }
            log.debug('id_dimention',id_dimention);
            var txtKilos 
    
            if (id_dimention == 4){
                txtKilos = '12.60 kg'
            }else{
                txtKilos = '1 kg'
            }
            log.debug('txtKilos',txtKilos)
            var objTracking = search.lookupFields({
                type: 'customrecord_vk_traking_information',
                id: id_dimention,
                columns: ['custrecord_alto_cm','custrecord_ancho_cm','custrecord_largo_cm','name','custrecord_contenido']
            });
            console.log('objTracking',objTracking);
            
            
            var objCustomer = record.load({
                type: record.Type.CUSTOMER,
                id: objSO.getValue('entity'),
                isDynamic: false,
            });
            //extrae la información del cliente
            console.log('objCustomer',objCustomer);
            var email_customer = objCustomer.getValue('email');
            var nameCustomer = objCustomer.getValue('altname');
            var addrphone = "";
            var addr1 = "";
            var addr2 = "";
            var zip ="";
            var companyCustomer = objCustomer.getValue('custentity_razon_social');
            
            var totalLines = objCustomer.getLineCount({
                sublistId  : 'addressbook'
            });
            console.log('totalLines',totalLines);
            for(var i=0; i < totalLines; i++){
                var defaultshipping = objCustomer.getSublistValue({
                    sublistId : 'addressbook',
                    fieldId   : 'defaultshipping',
                    line      : i
                });
                
                if(defaultshipping == true){
                    var subRecord = objCustomer.getSublistSubrecord({
                       sublistId : 'addressbook',
                       fieldId   : 'addressbookaddress',
                       line      : i
                    });
                    console.log('subrec',subRecord)
                    
                    addrphone = subRecord.getText({
                        fieldId: 'addrphone'
                    });
                    addr1 = subRecord.getValue({
                        fieldId: 'addr1'
                    });
                    addr2 = subRecord.getValue({
                        fieldId: 'addr2'
                    });
                    zip = subRecord.getValue({
                        fieldId: 'zip'
                    });
                    break;
                }
                
            }
            var random_num = Math.floor(Math.random() * 100);
            //crea el objeto que se envia a ac logistic
            var weight = objTracking.name.split(" ")[0];
            var objRequest = {
                     "api_key": apiKey,
                     "referencia": objSO.getValue('tranid')+'-'+random_num,
                     "id_courier": "fedex_eco",
                     "nombre_remitente": companyname,
                     "telefono_remitente": phone,
                     "correo_remitente": email_company,
                     "direccion_remitente": address,
                     "empresa_remitente": legalname,
                     "nombre_destinatario": nameCustomer,
                     "telefono_destinatario": addrphone,
                     "correo_destinatario": email_customer,
                     "calle_destinatario": addr1,
                     "num_exterior_destinatario": "0",
                     "num_interior_destinatario": "0",
                     "cp_destinatario": zip,
                     "colonia_destinatario": addr2,
                     "empresa_destinatario": companyCustomer,
                     "alto_cm": objTracking.custrecord_alto_cm,
                     "ancho_cm": objTracking.custrecord_ancho_cm,
                     "largo_cm": objTracking.custrecord_largo_cm,
                     "peso_kg": weight,
                     "contenido": objTracking.custrecord_contenido,
                     "valor":objSO.getValue('total'),
                     "seguro": "false"
                } 
            
            log.debug("Datos a enviar",objRequest);
            console.log("Datos a enviar",objRequest);
            log.debug("Datos a enviar stringify",JSON.stringify(objRequest));
            console.log("Datos a enviar stringify",JSON.stringify(objRequest));
            var responseService = https.post({
                url: 'https://www.smartship.mx/api/documentar/',
                body : JSON.stringify(objRequest),
                headers: {
                    "Content-Type": "application/json"
                }
            }).body;
          try{
              log.debug("responseService",responseService);
              console.log("responseService",responseService);
                
              console.log('Respuesta de AC LLogistic',JSON.parse(responseService).mensaje);
              if(JSON.parse(responseService).mensaje == 'Exitoso'){
                console.log("if true",JSON.parse(responseService).mensaje);
              }else{
                console.log("if false",JSON.parse(responseService).mensaje);
              }
              //log.debug("Respuesta de AC LLogistic",JSON.parse(responseService));
            
//                var acLogistic = JSON.parse(responseService);
//              
//                log.debug("acLogistic.mensaje",acLogistic.mensaje);
//            
//                console.log("acLogistic.mensaje",acLogistic.mensaje);
          }catch(e){
              log.debug("error log",e);
              console.log("error log",e);
          }
            
          
            
          
            //si la respuesta es correcta crea un nuevo registro de traking
            if( JSON.parse(responseService).mensaje == 'Exitoso' ){

                var acLogistic = JSON.parse(responseService)
                console.log('acLogistic',acLogistic);
                var obj_traking= record.create({
                    type: 'customrecord_guia_envio',
                    isDynamic: false,
                });
                
                obj_traking.setValue({
                    fieldId: 'custrecord_id_sales_order',
                    value: idSalesOrder
                });
                obj_traking.setValue({
                    fieldId: 'custrecord_no_guia',
                    value: acLogistic.tracking
                });
                obj_traking.setValue({
                    fieldId: 'custrecord_url_resp_aclogistics',
                    value: acLogistic.tracking_link
                });
                obj_traking.setValue({
                    fieldId: 'custrecord_url_pdf_aclogistics',
                    value: acLogistic.guia
                });
                obj_traking.setValue({
                    fieldId: 'custrecord_estatus_envio',
                    value: 1
                });
                obj_traking.setValue({
                    fieldId: 'custrecord_id_envio',
                    value: acLogistic.id_envio
                });
                obj_traking.setValue({
                    fieldId: 'custrecord_vw_description',
                    value: description_txt
                });
                obj_traking.setValue({
                    fieldId: 'custrecord_peso',
                    value: txtKilos
                });
                
                
                
                var id_traking = obj_traking.save();
                console.log('id_traking',id_traking);
                dialog.alert({
                    title: 'Éxito',
                    message: 'Guía generada correctamente'
                });
                try{
                    var location = objSO.getValue('location')
                    if(location == 53){
                        objSO.setValue('ordertype',1)
                    }
                    objSO.setValue('custbody_tracking_dimensions','');
                    objSO.save();
                }catch(err_update){
                    console.log('err_update',err_update);
                }
                try{
                    if(actualizarOPP){
                        var estimate = objSO.getValue('createdfrom')
                        log.debug('estimate createdfrom',estimate)
                        var opp = search.lookupFields({
                            type: 'estimate',
                            id: estimate,
                            columns: [
                                'opportunity', 
                            ]
                        });
                        log.debug('opp a actualizar ',opp['opportunity'][0].value)
                        record.submitFields({
                            type: 'opportunity',
                            id: opp['opportunity'][0].value,
                            values: {
                                'custbody_num_guia_env':acLogistic.tracking,
                                'custbody_url_one_aclogistics':acLogistic.tracking_link
                            }
                        });
                    }
                    
                }catch(err_setOpp){
                    log.error('error err_setOpp',err_setOpp);
                    console.log('error err_setOpp')
                }
                
                window.location.reload();
            }else{
                console.log('Error al generar guia')
                alert("Error al generar guia "+acLogistic.mensaje);
            }
        }catch(err){
            log.error("error request Traking",err)
        }
    }
    function updateTm(internalidso){
        try{
            var numOrder
            var date;
            var firstso = '';
            var odv_ganaTM = 6
            var count = 0;
            var rec = record.load({//Cargar registro 
                type: 'salesorder',
                id: internalidso,
                isDynamic: false
            });
            
            var numOrders = [];
            var internals = [];
            var odv= rec.getValue('salesrep');
            var type_promotion = search.lookupFields({
                type: 'employee',
                id: rec.getValue('salesrep'),
                columns: ['altname','custentity_promocion','custentity123']
            });
             delegate = type_promotion.custentity_promocion;
             var configuracion = type_promotion.custentity123
             for (i = 0; i < configuracion.length ; i++){
                if(configuracion[i].value == 11 || configuracion[i].value == 12){
                    odv_ganaTM = 4
                }
             }
             
             var busqueda = search.create({
                 type: 'salesorder',
                 columns: ['internalid','custbody_tipo_venta'],
                 filters: [
                     ['salesrep','anyof',odv],'and',['mainline','is',true],'and',['custbody_otro_financiamiento','noneof',4]
                 ]
             });
              busqueda.run().each(function(r){
               numOrders.push({
                 internalid: r.getValue('internalid'),
                 typeso: r.getValue('custbody_tipo_venta')
               })
                 return true;
           });
           
              for(var index in numOrders){
                  
                  log.debug('orders',numOrders[index])
                  if(numOrders[index].typeso==2){
                      internals.push({
                          internalodv: numOrders[index].internalid
                      })
                      count++
                  }
                  if(numOrders[index].typeso==35){
                    firstso = numOrders[index].internalid  
                        
                  }
                  
              }
              
              console.log('count',count)
              if(count == odv_ganaTM && firstso != ''){
                  
                  var objRecord = record.load({//Cargar registro 
                      type: 'salesorder',
                      id: firstso,
                      isDynamic: false
                  });
                  
                  date = rec.getValue('trandate');
                  numOrder = rec.getValue('tranid')
                  objRecord.setValue('trandate',date);
                  objRecord.setValue('custbody_tipo_venta','1')
                  objRecord.setValue('custbody_vw_comission_status','2')
                  objRecord.save();
                  
                  var objEmployee = record.load({//Cargar registro 
                      type: 'employee',
                      id: rec.getValue('salesrep'),
                      isDynamic: false
                  });
                 
                  objEmployee.setValue('custentity_promocion','2')
                  objEmployee.setValue('custentity_pedido_tm_ganada',numOrder)
                  objEmployee.save();
                  
                  for(var inter in internals){
                      record.submitFields({
                          type: 'salesorder',
                          id: internals[inter].internalodv,
                          values: {'custbody_vw_comission_status':'2'}
                      });
                     
                  }
                  
                  
              }else if(count < odv_ganaTM){
                  alert('No cuenta con '+odv_ganaTM+' ventas TM')
              }
            
        }
            catch(err){
            log.error('errorupdatetm',err)
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        saveRecord: saveRecord,
        requestTraking:requestTraking,
        updateTm:updateTm
    };
    
});

