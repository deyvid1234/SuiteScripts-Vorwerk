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
                    var liberarApartado = thisRecord.getValue('custrecord_liberar_apartado')
                    log.debug('liberarApartado',liberarApartado)

                    if( liberarApartado == true ){
                        var id_Item = thisRecord.getValue('custrecord_item_apartado')
                        var dataItem = search.lookupFields({// Busqueda de Invdentory Item
                        type: 'item',
                        id: id_Item,
                        columns: ['custitem_disponible_eshop','recordtype','custitem_transaccion_apartados']//Stock disponible en el campo para eshop, tipo de registro
                    });

                    log.debug('dataItem',dataItem)
                    var itemType = dataItem['recordtype']
                    var transaccionApartados= dataItem['custitem_transaccion_apartados']

                        if(transaccionApartados[0].value != ""){
                            log.debug('borrar transaccion')
                            record.delete({type: 'salesorder', id: transaccionApartados[0].value});

                            record.submitFields({
                            type: itemType,
                            id: id_Item,
                            values: { custitem_transaccion_apartados: '',custitem_disponible_eshop: 0 }
                            })
                        }
                    }else{ 
                    
                        var id_Item = thisRecord.getValue('custrecord_item_apartado')
                        var dataItem = search.lookupFields({// Busqueda de Invdentory Item
                            type: 'item',
                            id: id_Item,
                            columns: ['custitem_disponible_eshop','recordtype','custitem_transaccion_apartados']//Stock disponible en el campo para eshop, tipo de registro
                        });


                        log.debug('dataItem',dataItem)

                        var disponible_eshop = parseInt(dataItem['custitem_disponible_eshop']) //Stock dedicado a eshop
                            
                            if (!disponible_eshop||disponible_eshop =='' ) {
                                    disponible_eshop = 0
                                }
                        var nuevoApartado = thisRecord.getValue('custrecord_cantidad_apartada')
                        var location = thisRecord.getValue('custrecord_from_location')
                        var transaccionApartados= dataItem['custitem_transaccion_apartados']
                        var name = 3281861
                        var actualizaDisponibleEshop= disponible_eshop + nuevoApartado
                        log.debug('disponible_eshop', disponible_eshop)
                        log.debug('location', location)
                        log.debug('actualizaDisponibleEshop', actualizaDisponibleEshop)
                        log.debug('nuevoApartado', nuevoApartado)
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
                            values: { custitem_transaccion_apartados: id_SO,custitem_disponible_eshop: actualizaDisponibleEshop }
                            })

                            return id_SO;
                        }else{
                            log.debug("cargar")
                            log.debug('transaccionApartados', transaccionApartados[0].value)
                            var idSOaCargar = transaccionApartados[0].value
                            var cargarSO = record.load({
                                type: record.Type.SALES_ORDER,
                                id: idSOaCargar,
                                isDynamic:true,
                            });
                            
                            var itemLines = cargarSO.getLineCount({
                                sublistId  : 'item'
                            });
                            
                            var existeItemLine = false

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

                                

                                if(id_Item == itemId){
                                    
                                    log.debug("actualizar")
                                    existeItemLine = true
                                   
                                    var itemQuantity = cargarSO.getSublistValue({
                                        sublistId : 'item',
                                        fieldId   : 'quantity',
                                        line      : i
                                    });

                                    cargarSO.selectLine({
                                        sublistId: 'item',
                                        line: i
                                    });

                                    var apartadoTotal= itemQuantity+nuevoApartado

                                    cargarSO.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        value: apartadoTotal
                                    });
                                    cargarSO.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        value: 0.01
                                    });
                                    cargarSO.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        value: 53
                                    });
                                    
                                    cargarSO.commitLine({//cierre de linea seleccionada 
                                        sublistId: 'item'
                                    }); 

                                    cargarSO.save({
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    });

                                    record.submitFields({
                                    type: itemType,
                                    id: id_Item,
                                    values: { custitem_disponible_eshop: actualizaDisponibleEshop}
                                })
                                }

                            }

                            //No existe el item en la transaccion, Se crea nueva linea
                            if(existeItemLine == false) {
                                log.debug("crear linea")

                                cargarSO.selectNewLine({
                                    sublistId: 'item',
                                    
                                });
                                cargarSO.setCurrentSublistValue({
                                    sublistId:'item',
                                    fieldId:'item',
                                    value:id_Item,                                
                                    
                                });
                                cargarSO.setCurrentSublistValue({
                                    sublistId:'item',
                                    fieldId:'quantity',
                                    value:nuevoApartado,
                                    
                                });
                                cargarSO.setCurrentSublistValue({
                                    sublistId:'item',
                                    fieldId:'amount',
                                    value:0.01,
                                    
                                });
                                 cargarSO.setCurrentSublistValue({
                                    sublistId:'item',
                                    fieldId:'location',
                                    value:53
                                    
                                });
                                //Añadir Location

                                cargarSO.commitLine({//cierre de linea seleccionada 
                                        sublistId: 'item'
                                }); 

                                cargarSO.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                });

                                //Actualizar Disponible Eshop
                                record.submitFields({
                                    type: itemType,
                                    id: id_Item,
                                    values: { custitem_disponible_eshop: actualizaDisponibleEshop}
                                })
                            }
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
