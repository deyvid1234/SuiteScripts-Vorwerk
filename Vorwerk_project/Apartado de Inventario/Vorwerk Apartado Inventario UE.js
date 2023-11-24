/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/http','N/https','N/encode','N/runtime','N/ui/serverWidget'],

function(record,search,http,https,encode,runtime,serverWidget) {
   
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
            
           
        }catch(err){
            log.error('errorbeforeload',err);
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
            var thisRecord = scriptContext.newRecord;
            var oldrecord = scriptContext.oldRecord;

            
                if( scriptContext.type == 'create' ){ 
                    var id_Item = thisRecord.getValue('custrecord_item_apartado')
                    var dataItem = search.lookupFields({// Busqueda de Invdentory Item
                        type: 'item',
                        id: id_Item,
                        columns: ['custitem_disponible_eshop','recordtype','custitem_transaccion_apartados']//Stock disponible en el campo para eshop, tipo de registro
                    });

                    log.debug('dataItem',dataItem)
                    var disponible_eshop = parseInt(dataItem['custitem_disponible_eshop']) //Stock dedicado a eshop
                    var nuevoApartado = thisRecord.getValue('custrecord_cantidad_apartada')
                    var location = thisRecord.getValue('custrecord_from_location')
                    var transaccionApartados= dataItem['custitem_transaccion_apartados']
                    var name = 3281861
                    log.debug('transaccionApartados', transaccionApartados.value)
                    log.debug('transaccionApartados', transaccionApartados.text)
                    log.debug('location', location)
                    var itemType = dataItem['recordtype']//Tipo de registro del inventory item
                    
                    if(transaccionApartados[0].value == ""){//Si no hay SO la crea
                       
                        var obj_SO= record.create({
                            type: 'salesorder',
                            isDynamic: false,
                        });
                        obj_SO.setValue({
                            fieldId: 'customform',
                            value: 68
                        });
                        obj_SO.setValue({
                            fieldId: 'entity',
                            value: name
                        });
                                               
                        obj_SO.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'location',
                            line : 0,
                            value : location
                        });
                        obj_SO.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : 0,
                            value : id_Item
                        });
                        obj_SO.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'quantity',
                            line : 0,
                            value : nuevoApartado
                        });
                        obj_SO.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'amount',
                            line : 0,
                            value : 0.01
                        });
                        
                        var id_SO = obj_SO.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        log.debug('id_SO', id_SO)
                        

                        record.submitFields({
                        type: itemType,
                        id: id_Item,
                        values: { custitem_transaccion_apartados: id_SO,custitem_disponible_eshop: nuevoApartado }
                        })

                        return id_SO;
                    }else{
                         log.debug("cargar")
                         log.debug('transaccionApartados', transaccionApartados[0].value)
                        var idSOaCargar = transaccionApartados[0].value
                        var cargarSO = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idSOaCargar,
                            isDynamic:false,
                        });
                        
                        var itemLines = cargarSO.getLineCount({
                            sublistId  : 'item'
                        });
                        //var items= []
                        var qItemline, lineItem, existeItemLine = false

                        for(var i=0; i < itemLines; i++){
                            var itemId = cargarSO.getSublistValue({
                                sublistId : 'item',
                                fieldId   : 'item',
                                line      : i
                            });

                            if(id_Item == itemId){
                                log.debug("actualizar")
                                existeItemLine = true
                               
                                var itemQuantity = cargarSO.getSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'quantity',
                                    line      : i
                                });

                                var apartadoTotal= itemQuantity+nuevoApartado
                                cargarSO.setSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'quantity',
                                    value: apartadoTotal,
                                    line      : i
                                    });  
                                cargarSO.setSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'amount',
                                    value: 0.01,
                                    line      : i
                                });  
                                    

                                cargarSO.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                            }

                        }

                        //No existe el item en la transaccion, Se crea nueva linea
                        if(existeItemLine == false) {
                            log.debug("crear linea")
                            cargarSO.insertLine({
                                sublistId: 'item',
                                line: itemLines
                            });
                            cargarSO.setSublistValue({
                                sublistId:'item',
                                fieldId:'item',
                                value:id_Item,
                                line: i
                            });
                            cargarSO.setSublistValue({
                                sublistId:'item',
                                fieldId:'quantity',
                                value:nuevoApartado,
                                line: i
                            });
                            cargarSO.setSublistValue({
                                sublistId:'item',
                                fieldId:'amount',
                                value:0.01,
                                line: i
                            });

                            cargarSO.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });

                            //Actualizar Disponible Eshop
                            record.submitFields({
                                type: itemType,
                                id: id_Item,
                                values: { custitem_disponible_eshop: nuevoApartado+ disponible_eshop}
                            })
                        }
                    }
                }
            return true
            
    
        }catch(e){
            log.debug('Error en afterSubmit',e)
        }
    }
    
    
    
    
    
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
