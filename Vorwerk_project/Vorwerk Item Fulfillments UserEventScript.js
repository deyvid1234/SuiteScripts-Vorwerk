/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/config','N/record','N/render','N/email','N/search','N/format','N/file','N/log','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

function(runtime,config,record,render,email,search,format,file,log,Utils) {
   
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
        
       /* try {
            if (scriptContext.type == 'edit') {
              for(var x = 0; x < currentRecord.getLineCount({sublistId: 'item'}); x++){
                    var item = currentRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line:x})
                    if( item == 2001 || item == 2170 || item == 2571){
                        var recordid = rec.getValue('internalid')
                        var createdfrom = rec.getValue('createdfrom')
                        var salesrep = search.lookupFields({
                        type: 'salesorder',
                        id: createdfrom,
                        columns: ['salesrep']
                        });
                        salesrep = salesrep.salesrep[0]['value']
                        var customer = parseInt(rec.getValue('entity'));
                        idUSer = 344096;
                        var date = rec.getValue('trandate')
                        var dateGara = new Date(date);
                        dateGara.setDate(dateGara.getDate()+180);
                        fDate = (dateGara.getDate()+'/'+(dateGara.getMonth()+1)+'/'+dateGara.getFullYear())
                        log.debug('fDate',fDate)
                         var recordid = '' 
                         var url = ''
                         var mySearch = search.create({
                               type:"customrecord_guia_envio",
                               filters: [
                                         {
                                             name: 'custrecord_id_sales_order',
                                             operator: 'is',
                                             values: createdfrom
                                         }
                                     ],
                               columns: [
                                   { name: 'internalid', sort: search.Sort.DESC },
                                   { name: 'custrecord_url_resp_aclogistics'},
                                   { name: 'custrecord_no_guia'},
                               ]
                           });
                        mySearch.run().each(function(r) {
                            internalid = r.getValue('internalid')
                            url = r.getValue('custrecord_url_resp_aclogistics')
                              });
                        log.debug('search','internalid '+internalid+' url '+url)
                        var subrec = rec.getSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail',
                                line: x
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
                        }
                        log.debug('inventorydetail',inventorydetail)
                        log.debug("process",'mail createdfrom:'+createdfrom+' salesrep: '+salesrep+' customer: '+customer);
                        var myMergeResult = render.mergeEmail({
                                templateId: 270,
                                entity: {
                                        type: 'employee',
                                        id: idUSer
                                },
                                recipient: {
                                        type: 'customer',
                                        id: customer
                                },
                                transactionId: recordid
                            });
                        var senderId = idUSer;
                        var recipientEmail = customer
                        var emailSubject = myMergeResult.subject; 
                        var emailBody = myMergeResult.body 
                        log.debug('emailBody',' senderId '+senderId+' recipientEmail '+recipientEmail+' emailSubject '+emailSubject);
                        
                        emailBody = emailBody.replace(/@numero_serie/g,inventorydetail);
                        emailBody = emailBody.replace(/@ubicacion_tm/g,url);
                        emailBody = emailBody.replace(/@fecha_gara/g,fDate);
                        sendemail(senderId,customer,emailSubject,emailBody,recordid,salesrep)
                    }
                }
            }
                
            
        } catch (e) {
            log.debug("error", e)
        }*/
    }
    function sendemail(senderId,recipientEmail,emailSubject,emailBody,recordid,email_bbc){
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
                cc: [email_bbc,'desarrollo.netsuite@termomix.mx'],
                body: emailBody,
                relatedRecords: {
                    transactionId: recordid
                }
            });
        }catch(err){
            log.error("error email send",err)
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
        var rec = scriptContext.newRecord;
        var currentRecord = scriptContext.newRecord;
        log.debug('rec',rec)
        
            if (scriptContext.type == 'create') {
                log.debug('rec dentro del create',rec)
                try{
                    var recordid = rec.getValue('internalid')
                    var createdfrom = rec.getValue('createdfrom')
                    
                    // Obtener salesrep y tipo de venta
                    var salesOrderFields = search.lookupFields({
                        type: 'salesorder',
                        id: createdfrom,
                        columns: ['salesrep', 'custbody_tipo_venta']
                    });
                    
                    var salesrep = salesOrderFields.salesrep[0].value;
                    var tipoVenta = salesOrderFields.custbody_tipo_venta[0].value || '';
            
                    log.debug('Tipo de Venta', tipoVenta);

                    // Solo procesar si el tipo de venta es eshop vorwerk
                    if(tipoVenta === '18') {
                        var recordid = rec.getValue('internalid');
                        var customer = parseInt(rec.getValue('entity'));
                        idUSer = 344096;
                        var url = ''
                        var mySearch = search.create({
                               type:"customrecord_guia_envio",
                               filters: [
                                         {
                                             name: 'custrecord_id_sales_order',
                                             operator: 'is',
                                             values: createdfrom
                                         }
                                     ],
                               columns: [
                                   { name: 'internalid', sort: search.Sort.DESC },
                                   { name: 'custrecord_url_resp_aclogistics'},
                                   { name: 'custrecord_no_guia'},
                               ]
                           });
                        mySearch.run().each(function(r) {
                            internalid = r.getValue('internalid')
                            url = r.getValue('custrecord_url_resp_aclogistics')
                              });
                        log.debug('search','internalid '+internalid+' url '+url)

                        var myMergeResult = render.mergeEmail({
                            templateId: 275,
                            entity: {
                                type: 'employee',
                                id: idUSer
                            },
                            recipient: {
                                type: 'customer',
                                id: customer
                            },
                            transactionId: recordid
                        });

                        var senderId = idUSer;
                        var recipientEmail = customer
                        var emailSubject = myMergeResult.subject; 
                        var emailBody = myMergeResult.body 
                        log.debug('emailBody',' senderId '+senderId+' recipientEmail '+recipientEmail+' emailSubject '+emailSubject);
                        
                        
                        emailBody = emailBody.replace(/@boton/g,'&iquest;D&oacute;nde est&aacute; mi pedido?');
                        emailBody = emailBody.replace(/@url_ac/g,url);
                        sendemail(senderId,customer,emailSubject,emailBody,recordid,salesrep)
                    }


                }catch(e){
                    log.error("error email producto", e)
                }
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
            // Solo procesar en create y edit
            if (scriptContext.type !== 'create' && scriptContext.type !== 'edit') {
                return;
            }

            var rec = scriptContext.newRecord;
            var fulfillmentId = rec.id;
            var createdfrom = rec.getValue('createdfrom');
            var entityValue = rec.getValue('entity');
            var entityName = rec.getText('entity');
            if (!createdfrom) {
                log.debug('afterSubmit', 'No hay orden de venta asociada (createdfrom)');
                return;
            }

            // Convertir entity a número (puede ser objeto o número)
            var entity = typeof entityValue === 'object' ? parseInt(entityValue.value || entityValue.id) : parseInt(entityValue);
            
            if (!entity || isNaN(entity)) {
                log.debug('afterSubmit', 'No se encontró customer válido en el fulfillment');
                return;
            }

            // Determinar items según el ambiente (sandbox o producción)
            var item_tm7_sandbox = 2680;
            var item_tm7_prod = 2763;
            var item_tm7 = runtime.envType == "SANDBOX" ? item_tm7_sandbox : item_tm7_prod;
            
            // Obtener información de la orden de venta
            var salesOrderFields = search.lookupFields({
                type: 'salesorder',
                id: createdfrom,
                columns: ['custbody_pedido_tm7_getm7', 'custbody_odv_tm7_getm7']
            });

            var pedidoTm7Getm7 = salesOrderFields.custbody_pedido_tm7_getm7;
            var ordenGetm7Id = salesOrderFields.custbody_odv_tm7_getm7[0].value;
            

            log.debug('afterSubmit', 'pedidoTm7Getm7: ' + pedidoTm7Getm7 + ', ordenGetm7Id: ' + ordenGetm7Id + ', customer: ' + entity);

            // Verificar si es fulfillment de orden TM7 relacionada con GETM7
            var esFulfillmentTm7Getm7 = false;
            if (pedidoTm7Getm7 && ordenGetm7Id) {
                // Verificar si alguno de los items es TM7
                var itemFound = false;
                var lineCount = rec.getLineCount({sublistId: 'item'});
                
                for (var x = 0; x < lineCount; x++) {
                    var itemId = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: x
                    });
                    
                    // Extraer el valor numérico del itemId (puede ser objeto o número)
                    var itemIdValue = typeof itemId === 'object' ? parseInt(itemId.value || itemId.id) : parseInt(itemId);
                    
                    // Si alguno de los items es TM7, marcar como encontrado
                    if (itemIdValue === item_tm7) {
                        itemFound = true;
                        log.debug('afterSubmit', 'Item TM7 (' + item_tm7 + ') encontrado en la línea ' + x);
                        esFulfillmentTm7Getm7 = true;
                        break;
                    }
                }
            }

            // Si es fulfillment de TM7 con GETM7 relacionada, procesar envío de email y PDF y retornar
            if (esFulfillmentTm7Getm7) {
                log.debug('afterSubmit', 'Fulfillment de orden TM7 con GETM7 relacionada detectado, procesando envío de email y PDF');
                
                try {
                    procesarFulfillmentTm7Getm7(rec, createdfrom, ordenGetm7Id, entity, entityName, fulfillmentId);
                    log.debug('afterSubmit', 'Procesamiento de fulfillment TM7/GETM7 completado exitosamente');
                } catch (e) {
                    log.error('afterSubmit', 'Error al procesar fulfillment TM7/GETM7: ' + e);
                }
                
                // Retornar para evitar ejecutar la lógica original duplicada
                return;
            }

            

        } catch (e) {
            log.error('afterSubmit Error', e);
        }
    }

    // Función para procesar fulfillment de orden TM7 relacionada con GETM7
    function procesarFulfillmentTm7Getm7(rec, createdfrom, ordenGetm7Id, entity, entityName, fulfillmentId) {
        try {
            log.debug('procesarFulfillmentTm7Getm7', 'Iniciando procesamiento para orden GETM7: ' + ordenGetm7Id);
            
            var ordenGetm7IdInt = parseInt(ordenGetm7Id);
            var createdfromId = parseInt(createdfrom); // Orden TM7 (de donde se obtienen los datos)
            
            log.debug('procesarFulfillmentTm7Getm7', 'Generando PDF para orden TM7 ID: ' + createdfromId + ' usando plantilla 288');
            
            // Obtener datos para reemplazar en la plantilla (de la orden TM7)
            // 1. Obtener nombre del cliente (entity como texto, no numérico)
            var nombreCliente = entityName;
            log.debug('procesarFulfillmentTm7Getm7', 'Nombre cliente: ' + nombreCliente);
            // Obtener el nombre completo sin la primera parte numérica (hasta el primer espacio)
            var nombreParts = nombreCliente.split(' ');
            var altname = nombreParts.length > 1 ? nombreParts.slice(1).join(' ') : nombreCliente;
            
            // 2. Obtener número de serie del fulfillment (de la orden TM7)
            var numeroSerie = '';
            var lineCount = rec.getLineCount({sublistId: 'item'});
            var item_tm7 = runtime.envType == "SANDBOX" ? 2680 : 2763;
            
            for (var x = 0; x < lineCount; x++) {
                var itemId = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: x
                });
                var itemIdValue = typeof itemId === 'object' ? parseInt(itemId.value || itemId.id) : parseInt(itemId);
                
                if (itemIdValue === item_tm7) {
                    // Obtener el número de serie de esta línea
                    var subrec = rec.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: x
                    });
                    if (subrec) {
                        var subitems = subrec.getLineCount({
                            sublistId: 'inventoryassignment'
                        });
                        if (subitems > 0) {
                            for (var y = 0; y < subitems; y++) {
                                var serial = subrec.getSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'issueinventorynumber_display',
                                    line: y
                                });
                                if (serial) {
                                    numeroSerie = serial;
                                    break;
                                }
                            }
                        }
                    }
                    if (numeroSerie) break;
                }
            }
            log.debug('procesarFulfillmentTm7Getm7', 'Número de serie: ' + numeroSerie);
            
            // 3. Calcular fecha de vigencia (fecha actual + 5 años)
            var fechaActual = new Date();
            var fechaVigencia = new Date(fechaActual);
            fechaVigencia.setFullYear(fechaVigencia.getFullYear() + 5);
            var vigenciaFormateada = format.format({
                value: fechaVigencia,
                type: format.Type.DATE
            });
            log.debug('procesarFulfillmentTm7Getm7', 'Vigencia: ' + vigenciaFormateada);
            
            // 4. Modelo
            var modelo = 'Thermomix TM7';
            
            // 5. Fecha actual
            var fechaFormateada = format.format({
                value: fechaActual,
                type: format.Type.DATE
            });
            log.debug('procesarFulfillmentTm7Getm7', 'Fecha: ' + fechaFormateada);
            
            // 5a. Obtener día, mes y año de la fecha actual
            var dia = fechaActual.getDate();
            var mesNumero = fechaActual.getMonth(); // Los meses van de 0-11
            var anio = fechaActual.getFullYear();
            
            // Array con los nombres de los meses en español
            var nombresMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                              'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            var mes = nombresMeses[mesNumero];
            
            log.debug('procesarFulfillmentTm7Getm7', 'Día: ' + dia + ', Mes: ' + mes + ', Año: ' + anio);
            
            // 6. Obtener número de pedido/orden de venta (tranid) y fecha de compra (trandate) de la orden TM7
            var salesOrderFields = search.lookupFields({
                type: 'salesorder',
                id: createdfromId,
                columns: ['tranid', 'trandate']
            });
            var noContrato = salesOrderFields.tranid || '';
            log.debug('procesarFulfillmentTm7Getm7', 'Número de contrato: ' + noContrato);
            
            // Obtener el contenido de la plantilla 288 usando render.mergeEmail() (igual que en el script de referencia)
            var idUSer = 344096;
            var templateBody = render.mergeEmail({
                templateId: 288,
                entity: {
                    type: 'employee',
                    id: idUSer
                },
                recipient: {
                    type: 'customer',
                    id: entity
                },
                transactionId: createdfromId
            }).body;
            
            log.debug('procesarFulfillmentTm7Getm7', 'Contenido de plantilla 288 obtenido');
            
            // Reemplazar los placeholders en la plantilla
            templateBody = templateBody.replace(/@nombre/g, nombreCliente);
            templateBody = templateBody.replace(/@serie/g, numeroSerie);
            templateBody = templateBody.replace(/@vigencia/g, vigenciaFormateada);
            templateBody = templateBody.replace(/@modelo/g, modelo);
            templateBody = templateBody.replace(/@fecha/g, fechaFormateada);
            templateBody = templateBody.replace(/@no_contrato/g, noContrato);
            templateBody = templateBody.replace(/@dia/g, dia);
            templateBody = templateBody.replace(/@mes/g, mes);
            templateBody = templateBody.replace(/@anio/g, anio);
            templateBody = templateBody.replace(/@name/g, altname);
            
            log.debug('procesarFulfillmentTm7Getm7', 'Placeholders reemplazados en la plantilla');
            
            // Preparar la URL de la imagen para el header
            var imageUrl = 'https://3367613-sb1.app.netsuite.com/core/media/media.nl?id=2576941&c=3367613_SB1&h=EVQpFOUkyARO0Xup5ue_KhGuik1V9R-xb--eYG7FiF_7YPaV&fcts=20230726124853&whence=';
            // Escapar los caracteres especiales en la URL para XML
            var imageUrlEscaped = imageUrl.replace(/&/g, '&amp;');
            
            // Crear XML para PDF con header que contiene la imagen (excepto en la primera página)
            // En BFO, para excluir el header de la primera página, usamos una condición en el macro
            var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n"
                + "<pdf>"
                + '<head>'
                + '<macrolist>'
                + '<macro id="headerImage">'
                + '<if test="$pagenumber &gt; 1">'
                + '<table style="width: 100%; border: none; margin: 0 auto;"><tr><td style="text-align: center; border: none; padding: 10pt 0;">'
                + '<img src="' + imageUrlEscaped + '" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" align="center" />'
                + '</td></tr></table>'
                + '</if>'
                + '</macro>'
                + '</macrolist>'
                + '</head>'
                + '<body header="headerImage" header-height="80pt" footer-height="20pt" padding="0.5in 0.5in 0in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter">'
                + templateBody
                + '</body>'
                + '</pdf>';
            
            // Convertir XML a PDF (igual que en el script de referencia)
            var file_xml = render.xmlToPdf({
                xmlString: xml
            });
            
            // Obtener el contenido del PDF (igual que en el script de referencia)
            var renderer = render.create();
            renderer.templateContent = file_xml.getContents();
            
            // Crear archivo PDF
            var pdfFileName = 'Warranty_' + createdfromId + '_' + fulfillmentId + '.pdf';
            var pdfFileObj = file.create({
                name: pdfFileName,
                fileType: file.Type.PDF,
                contents: renderer.templateContent,
                folder: 326098
            });
            
            // Guardar el archivo primero
            var pdfFileId = pdfFileObj.save();
            log.debug('procesarFulfillmentTm7Getm7', 'PDF generado con ID: ' + pdfFileId);

            // Cargar el archivo guardado para usarlo como adjunto
            var pdfFileForAttachment = file.load({
                id: pdfFileId
            });

            // Obtener cupón disponible usando la función de Utils
            var cuponData = Utils.obtenerCupon();
            var cuponName = cuponData ? cuponData.name : null;
            var cuponId = cuponData ? cuponData.id : null;
            log.debug('procesarFulfillmentTm7Getm7', 'Cupón obtenido: ' + JSON.stringify(cuponData));
            
            // Solo enviar el email si se encuentra un cupón disponible
            if(cuponData){
                log.debug('procesarFulfillmentTm7Getm7', 'Cupón disponible, preparando email con plantilla 287');
                
                // Obtener fecha de compra de la orden TM7 y formatearla
                var fechaCompraRaw = salesOrderFields.trandate || rec.getValue('trandate');
                var fechaCompra = '';
                if(fechaCompraRaw){
                    var fechaCompraDate = fechaCompraRaw;
                    if(typeof fechaCompraRaw === 'string'){
                        fechaCompraDate = new Date(fechaCompraRaw);
                    }
                    var dia = fechaCompraDate.getDate();
                    var mes = fechaCompraDate.getMonth() + 1; // Los meses empiezan en 0
                    var anio = fechaCompraDate.getFullYear();
                    // Agregar ceros a la izquierda si es necesario
                    dia = (dia < 10) ? '0' + dia : dia;
                    mes = (mes < 10) ? '0' + mes : mes;
                    fechaCompra = dia + '/' + mes + '/' + anio;
                }
                log.debug('procesarFulfillmentTm7Getm7', 'Fecha de compra formateada: ' + fechaCompra);
                
                // Obtener número de pedido (tranid) de la orden TM7
                var pedido = noContrato || '';
                log.debug('procesarFulfillmentTm7Getm7', 'Número de pedido: ' + pedido);

                // Enviar email con plantilla 287 y adjuntar PDF
                var idUSer = 344096;
                var myMergeResult = render.mergeEmail({
                    templateId: 287,
                    entity: {
                        type: 'employee',
                        id: idUSer
                    },
                    recipient: {
                        type: 'customer',
                        id: entity
                    },
                    transactionId: createdfromId
                });

                var emailSubject = myMergeResult.subject;
                var emailBody = myMergeResult.body;

                // Reemplazar los placeholders en la plantilla (igual que en la lógica original)
                emailBody = emailBody.replace(/@cupon/g, cuponName || '');
                emailBody = emailBody.replace(/@fechadecompra/g, fechaCompra);
                emailBody = emailBody.replace(/@pedido/g, pedido);

                log.debug('procesarFulfillmentTm7Getm7', 'Enviando email con plantilla 287');

                var emailObj = {
                    author: idUSer,
                    recipients: entity,
                    subject: emailSubject,
                    body: emailBody,
                    attachments: [pdfFileForAttachment],
                    relatedRecords: {
                        transactionId: fulfillmentId
                    }
                };

                email.send(emailObj);
                log.debug('procesarFulfillmentTm7Getm7', 'Email enviado exitosamente con plantilla 287');
                
                // Actualizar el cupón a estado usado (status = 2) después de enviar el email
                if(cuponId){
                    var actualizado = Utils.actualizarCupon(cuponId);
                    if(actualizado){
                        log.debug('procesarFulfillmentTm7Getm7', 'Cupón actualizado exitosamente a estado usado: ID ' + cuponId);
                    } else {
                        log.debug('procesarFulfillmentTm7Getm7', 'Error al actualizar el cupón: ID ' + cuponId);
                    }
                }
            } else {
                log.debug('procesarFulfillmentTm7Getm7', 'No se encontró cupón disponible, el email no se enviará');
            }

            // Guardar el PDF en el campo custbody_vw_pdf_warranty de la orden GETM7
            var ordenGetm7Rec = record.load({
                type: 'salesorder',
                id: ordenGetm7IdInt,
                isDynamic: false
            });

            ordenGetm7Rec.setValue({
                fieldId: 'custbody_vw_pdf_warranty',
                value: pdfFileId
            });

            // Guardar el ID del fulfillment en el campo custbody_vw_odv_related_warranty
            ordenGetm7Rec.setValue({
                fieldId: 'custbody_vw_odv_related_warranty',
                value: fulfillmentId
            });

            ordenGetm7Rec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            log.debug('procesarFulfillmentTm7Getm7', 'PDF guardado en custbody_vw_pdf_warranty y fulfillment ID (' + fulfillmentId + ') guardado en custbody_vw_odv_related_warranty de la orden GETM7: ' + ordenGetm7IdInt);
            
        } catch (e) {
            log.error('procesarFulfillmentTm7Getm7 Error', e);
            throw e;
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});