/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/url','N/https','N/record','N/log'],

    function(runtime,url,https,record,log) {
       
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
                var form = scriptContext.
                form;
                form.clientScriptFileId = (runtime.envType != 'PRODUCTION') ? '1585973' : '1585973';
                    form.addButton({
                    id: 'custpage_btn_order_repar',
                    label: 'Imprimir Orden',
                    functionName: 'printOppo(\''+rec.id+'\');'
                });
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
            try {
                validarCampoAplicaDescuento(scriptContext);
            } catch (err) {
                log.error('Error beforeSubmit', err);
                throw err;
            }
        }
    
        /**
         * Carga el registro de configuración de descuento basado en el tipo de garantía
         * @param {string|number} tipoGarantia - ID del tipo de garantía
         * @returns {Object} - Objeto con skuDescuento y manoObra, o null si hay error
         */
        function cargarConfiguracionDescuento(tipoGarantia) {
            try {
                if (!tipoGarantia || tipoGarantia === '') {
                    log.debug('Carga configuración descuento', 'No hay tipo de garantía definido');
                    return null;
                }
    
                // Cargar el registro de configuración usando el tipo de garantía como ID
                var configRecord = record.load({
                    type: 'customrecord_conf_descuento',
                    id: tipoGarantia,
                    isDynamic: false
                });
    
                var skuDescuento = configRecord.getValue({
                    fieldId: 'custrecord_sku_descuento'
                });
    
                var manoObra = configRecord.getValue({
                    fieldId: 'custrecord_mano_obra'
                });
    
                log.debug('Carga configuración descuento', 'Configuración cargada - SKU Descuento: ' + skuDescuento + ', Mano de Obra: ' + manoObra);
    
                return {
                    skuDescuento: skuDescuento,
                    manoObra: manoObra
                };
    
            } catch (err) {
                log.error('Error cargarConfiguracionDescuento', err);
                return null;
            }
        }
    
        /**
         * Valida y establece el campo custcol_aplica_descuento a nivel de línea según el tipo de garantía
         * @param {Object} scriptContext - Contexto del script
         */
        function validarCampoAplicaDescuento(scriptContext) {
            try {
                var rec = scriptContext.newRecord;
                var tipoGarantia = rec.getValue({
                    fieldId: 'custbody_aplicacion_garantia'
                });
    
                // Si no hay tipo de garantía, no hacer nada
                if (!tipoGarantia || tipoGarantia === '') {
                    log.debug('Validación aplica descuento', 'No hay tipo de garantía definido');
                    return;
                }
    
                // Cargar la configuración de descuento
                var config = cargarConfiguracionDescuento(tipoGarantia);
                if (!config) {
                    log.debug('Validación aplica descuento', 'No se pudo cargar la configuración de descuento');
                    return;
                }
    
                var lineCount = rec.getLineCount({
                    sublistId: 'item'
                });
    
                if (lineCount === 0) {
                    log.debug('Validación aplica descuento', 'No hay items en la oportunidad');
                    return;
                }
    
                // Tipo 1: No aplica - Marcar todos los items como false
                if (tipoGarantia === '1') {
                    log.debug('Validación aplica descuento', 'Tipo 1 - Marcando todos los items como false');
                    for (var i = 0; i < lineCount; i++) {
                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aplica_descuento',
                            line: i,
                            value: false
                        });
                    }
                }
                // Tipo 2: Garantía al 100% - Marcar todos los items como true
                else if (tipoGarantia === '2') {
                    log.debug('Validación aplica descuento', 'Tipo 2 - Marcando todos los items como true');
                    for (var i = 0; i < lineCount; i++) {
                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aplica_descuento',
                            line: i,
                            value: true
                        });
                    }
                }
                // Tipo 3: Garantía total excepto mano de obra - Marcar todos como true excepto mano de obra
                else if (tipoGarantia === '3') {
                    log.debug('Validación aplica descuento', 'Tipo 3 - Marcando todos los items como true excepto mano de obra');
                    for (var i = 0; i < lineCount; i++) {
                        var itemId = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        
                        var esManoDeObra = esItemManoDeObra(itemId, config.manoObra);
                        
                        // Si NO es mano de obra, marcar como true, si es mano de obra marcar como false
                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aplica_descuento',
                            line: i,
                            value: !esManoDeObra
                        });
                    }
                }
                // Tipo 4: Garantía parcial - No hacer nada, el usuario seleccionará manualmente
                else if (tipoGarantia === '4') {
                    log.debug('Validación aplica descuento', 'Tipo 4 - El usuario debe seleccionar manualmente');
                    // No se modifica nada, el usuario debe seleccionar manualmente
                    return;
                }
    
                log.debug('Validación aplica descuento', 'Campo custcol_aplica_descuento validado correctamente para tipo: ' + tipoGarantia);
    
            } catch (err) {
                log.error('Error validarCampoAplicaDescuento', err);
                throw err;
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
            try{
                // inicia desarrollo de aplicacion de descuentos en la oportunidad 
                aplicarDescuentosPorGarantia(scriptContext);
                
                if(scriptContext.type == 'create'){
                    sendEmailOrderRepair(scriptContext);
                }
            }catch(err){
                log.error("error after submit",err);
            }
        }
    
        /**
         * Aplica descuentos a los items de la oportunidad según el check custcol_aplica_descuento
         * Agrega el descuento inmediatamente después de cada item que lo tenga marcado
         * @param {Object} scriptContext - Contexto del script
         */
        function aplicarDescuentosPorGarantia(scriptContext) {
            try {
                var rec = scriptContext.newRecord;
    
                // Obtener el tipo de garantía
                var tipoGarantia = rec.getValue({
                    fieldId: 'custbody_aplicacion_garantia'
                });
    
                // Cargar la configuración de descuento
                var config = cargarConfiguracionDescuento(tipoGarantia);
                if (!config || !config.skuDescuento) {
                    log.debug('Aplicación de garantía', 'No se pudo cargar la configuración de descuento o no hay SKU de descuento configurado');
                    return;
                }
    
                var skuDescuento = parseInt(config.skuDescuento);
                log.debug('Aplicación de garantía', 'SKU de descuento configurado: ' + skuDescuento);
    
                // Cargar el record para poder editarlo (isDynamic: true para poder agregar líneas)
                var oppRecord = record.load({
                    type: record.Type.OPPORTUNITY,
                    id: rec.id,
                    isDynamic: true
                });
    
                var lineCount = oppRecord.getLineCount({
                    sublistId: 'item'
                });
    
                if (lineCount === 0) {
                    log.debug('Aplicación de garantía', 'No hay items en la oportunidad');
                    return;
                }
    
                log.debug('Aplicación de garantía', 'Iniciando reorganización de items. Total de líneas: ' + lineCount);
    
                // Arreglo para almacenar los datos de cada item
                var itemsData = [];
                
                // Recorrer todos los items y almacenar sus datos (excluyendo items de descuento existentes)
                for (var i = 0; i < lineCount; i++) {
                    try {
                        var itemId = oppRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        
                        // Excluir el item de descuento (configurado dinámicamente) del almacenamiento
                        if (parseInt(itemId) === skuDescuento) {
                            log.debug('Aplicación de garantía', 'Item de descuento (' + skuDescuento + ') encontrado en línea ' + i + ', será excluido');
                            continue; // Saltar este item
                        }
    
                        // Almacenar todos los datos del item
                        var itemData = {
                            item: itemId,
                            quantity: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                            units: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'units', line: i }),
                            description: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }),
                            pricelevel: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'pricelevel', line: i }),
                            rate: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }),
                            amount: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }),
                            taxcode: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: i }),
                            taxrate1: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }),
                            tax1amt: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }),
                            grossamt: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i }),
                            taxamt: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxamt', line: i }),
                            options: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'options', line: i }),
                            expectedshipdate: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'expectedshipdate', line: i }),
                            custcol_no_deducible: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_no_deducible', line: i }),
                            custcol_clave_producto_servicio: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_clave_producto_servicio', line: i }),
                            custcol_aplica_descuento: oppRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_aplica_descuento', line: i })
                        };
    
                        itemsData.push(itemData);
                        log.debug('Aplicación de garantía', 'Item almacenado - Línea ' + i + ', Item: ' + itemId + ', Aplica descuento: ' + itemData.custcol_aplica_descuento);
    
                    } catch (e) {
                        log.debug('Aplicación de garantía', 'Error al leer línea ' + i + ': ' + e.message);
                    }
                }
                
                // Remover todas las líneas existentes
                log.debug('Aplicación de garantía', 'Removiendo todas las líneas existentes');
                for (var j = lineCount - 1; j >= 0; j--) {
                    try {
                        oppRecord.removeLine({
                            sublistId: 'item',
                            line: j
                            });
                        } catch (e) {
                        log.debug('Aplicación de garantía', 'Error al remover línea ' + j + ': ' + e.message);
                    }
                }
    
                // Agregar cada item con sus datos y su descuento si aplica
                log.debug('Aplicación de garantía', 'Agregando items reorganizados. Total de items: ' + itemsData.length);
                
                for (var k = 0; k < itemsData.length; k++) {
                    var currentItem = itemsData[k];
                    
                    // Agregar el item original
                    oppRecord.selectNewLine({
                        sublistId: 'item'
                    });
    
                    // Establecer los valores del item
                    if (currentItem.item) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: currentItem.item });
                    }
                    if (currentItem.quantity !== null && currentItem.quantity !== undefined && currentItem.quantity !== '') {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: currentItem.quantity });
                    }
                    if (currentItem.units) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'units', value: currentItem.units });
                    }
                    if (currentItem.description) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: currentItem.description });
                    }
                    if (currentItem.pricelevel) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'pricelevel', value: currentItem.pricelevel });
                    }
                    if (currentItem.rate !== null && currentItem.rate !== undefined && currentItem.rate !== '') {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: currentItem.rate });
                    }
                    if (currentItem.amount !== null && currentItem.amount !== undefined && currentItem.amount !== '') {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: currentItem.amount });
                    }
                    if (currentItem.taxcode) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: currentItem.taxcode });
                    }
                    if (currentItem.taxrate1 !== null && currentItem.taxrate1 !== undefined && currentItem.taxrate1 !== '') {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxrate1', value: currentItem.taxrate1 });
                    }
                    if (currentItem.grossamt !== null && currentItem.grossamt !== undefined && currentItem.grossamt !== '') {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt', value: currentItem.grossamt });
                    }
                    if (currentItem.taxamt !== null && currentItem.taxamt !== undefined && currentItem.taxamt !== '') {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxamt', value: currentItem.taxamt });
                    }
                    if (currentItem.options) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'options', value: currentItem.options });
                    }
                    if (currentItem.expectedshipdate) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'expectedshipdate', value: currentItem.expectedshipdate });
                    }
                    if (currentItem.custcol_no_deducible !== null && currentItem.custcol_no_deducible !== undefined) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_no_deducible', value: currentItem.custcol_no_deducible });
                    }
                    if (currentItem.custcol_clave_producto_servicio) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_clave_producto_servicio', value: currentItem.custcol_clave_producto_servicio });
                    }
                    if (currentItem.custcol_aplica_descuento !== null && currentItem.custcol_aplica_descuento !== undefined) {
                        oppRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_aplica_descuento', value: currentItem.custcol_aplica_descuento });
                        }
                        
                        oppRecord.commitLine({
                            sublistId: 'item'
                        });
                        
                    log.debug('Aplicación de garantía', 'Item agregado - Item: ' + currentItem.item + ', Aplica descuento: ' + currentItem.custcol_aplica_descuento);
    
                    // Si el item tiene descuento marcado, agregar el item de descuento inmediatamente después
                    // Solo aplicar descuento si el check está explícitamente marcado (true, 'T', o 1)
                    var aplicaDescuento = currentItem.custcol_aplica_descuento;
                    var debeAplicarDescuento = (aplicaDescuento === true || aplicaDescuento === 'T' || aplicaDescuento === 1 || aplicaDescuento === 'true');
                    
                    if (debeAplicarDescuento) {
                        var itemAmount = parseFloat(currentItem.amount) || 0;
                        
                        if (itemAmount > 0) {
                            // Calcular el monto del descuento (monto del item menos un centavo)
                            var montoDescuento = itemAmount - 0.01;
                            
                            log.debug('Aplicación de garantía', 'Agregando descuento para item ' + currentItem.item + ' - Monto: ' + montoDescuento);
                            
                            // Agregar el item de descuento
                        oppRecord.selectNewLine({
                            sublistId: 'item'
                        });
                        
                        oppRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: skuDescuento
                        });
                        
                        // Establecer cantidad en 1
                        try {
                            oppRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: 1
                            });
                        } catch (e) {
                                log.debug('Aplicación de garantía', 'Error al establecer quantity en descuento: ' + e.message);
                        }
                        
                            // Establecer el rate (precio unitario) como negativo
                        try {
                            oppRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: -montoDescuento
                            });
                        } catch (e) {
                                log.debug('Aplicación de garantía', 'Error al establecer rate en descuento: ' + e.message);
                        }
                        
                        // Establecer el amount como negativo (descuento)
                        try {
                            oppRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: -montoDescuento
                            });
                        } catch (e) {
                                log.debug('Aplicación de garantía', 'Error al establecer amount en descuento: ' + e.message);
                            }
    
                            // Establecer descripción
                            try {
                                oppRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'description',
                                    value: 'DESCUENTO PROMOCIONAL'
                                });
                            } catch (e) {
                                log.debug('Aplicación de garantía', 'Error al establecer description en descuento: ' + e.message);
                            }
    
                            // Establecer el mismo tax code si existe
                            if (currentItem.taxcode) {
                                try {
                                    oppRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'taxcode',
                                        value: currentItem.taxcode
                                    });
                                } catch (e) {
                                    log.debug('Aplicación de garantía', 'Error al establecer taxcode en descuento: ' + e.message);
                                }
                                 // Establecer el monto bruto (grossamt) ajustado para que quede solo 1 centavo de diferencia
                                 if (currentItem.grossamt !== null && currentItem.grossamt !== undefined && currentItem.grossamt !== '') {
                                    try {
                                        var grossamtOriginal = parseFloat(currentItem.grossamt) || 0;
                                        // Calcular grossamt del descuento: -(grossamtOriginal - 0.01) = -grossamtOriginal + 0.01
                                        var grossamtDescuento = -(grossamtOriginal - 0.01);
                                        oppRecord.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'grossamt',
                                            value: grossamtDescuento
                                        });
                                    } catch (e) {
                                        log.debug('Aplicación de garantía', 'Error al establecer grossamt en descuento: ' + e.message);
                                    }
                                }
                                // Establecer el monto de impuesto (tax1amt) como negativo completo del original
                                if (currentItem.tax1amt !== null && currentItem.tax1amt !== undefined && currentItem.tax1amt !== '') {
                                    try {
                                        var tax1amtOriginal = parseFloat(currentItem.tax1amt) || 0;
                                        // Si el tax1amt original es 0, el descuento también debe ser 0
                                        // Si no es 0, el descuento debe ser el negativo completo
                                        var tax1amtDescuento = tax1amtOriginal === 0 ? 0 : -tax1amtOriginal;
                                        oppRecord.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'tax1amt',
                                            value: tax1amtDescuento
                                        });
                                    } catch (e) {
                                        log.debug('Aplicación de garantía', 'Error al establecer tax1amt en descuento: ' + e.message);
                                    }
                                }
                                
                               
                        }
                        
                        oppRecord.commitLine({
                            sublistId: 'item'
                        });
                        
                            log.debug('Aplicación de garantía', 'Descuento agregado para item ' + currentItem.item + ' con monto: ' + (-montoDescuento));
                        } else {
                            log.debug('Aplicación de garantía', 'Item ' + currentItem.item + ' tiene check marcado pero amount <= 0, no se agrega descuento');
                        }
                    } else {
                        log.debug('Aplicación de garantía', 'Item ' + currentItem.item + ' NO tiene check de descuento marcado, no se agrega descuento');
                    }
                }
    
                // Guardar los cambios (deshabilitar sourcing para evitar recálculos automáticos)
                oppRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });
    
                log.debug('Aplicación de garantía', 'Items reorganizados y descuentos aplicados correctamente');
    
            } catch (err) {
                log.error('Error aplicarDescuentosPorGarantia', err);
                throw err;
            }
        }
    
        /**
         * Determina si un item es de "mano de obra"
         * @param {number|string} itemId - ID del item
         * @param {number|string} manoObraId - ID del item de mano de obra desde la configuración
         * @returns {boolean} - true si es item de mano de obra, false en caso contrario
         */
        function esItemManoDeObra(itemId, manoObraId) {
            try {
                if (!manoObraId) {
                    log.debug('esItemManoDeObra', 'No hay ID de mano de obra configurado');
                    return false;
                }
                
                var itemIdNum = parseInt(itemId);
                var manoObraIdNum = parseInt(manoObraId);
                return itemIdNum === manoObraIdNum;
            } catch (err) {
                log.error('Error esItemManoDeObra', err);
                // En caso de error, asumir que NO es mano de obra para aplicar el descuento
                return false;
            }
        }
    
        function sendEmailOrderRepair(scriptContext){
            try{
                var rec = scriptContext.newRecord;
                var id = rec.id;
                var sLet = url.resolveScript({
                    scriptId: 'customscript_order_repair_suitelet',
                    deploymentId: 'customdeploy_order_repair_suitelet',
                    returnExternalUrl: true
                });
                
                var url_send = sLet+"&oppID="+id+'&emailSend=true';
                log.debug('url_send',url_send);
                var headers = {"Content-Type": "application/json"};
                var obj = {
                        oppID:id,
                        emailSend: true
                }
                var response = https.put({
                    headers:headers,
                    url: url_send,
                    body: JSON.stringify(obj)
                });
                log.debug('response',response.body);
            }catch(err){
                log.error('Error sendEmailOrderRepair',err);
            }
            
            
        }
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };
        
    });
    