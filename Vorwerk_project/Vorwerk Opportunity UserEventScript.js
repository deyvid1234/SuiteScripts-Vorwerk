/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/url','N/https','N/record','N/search'],

function(runtime,url,https,record,search) {
   
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
    		var record = scriptContext.newRecord;
    		var form = scriptContext.
    		form;
    		form.clientScriptFileId = (runtime.envType != 'PRODUCTION') ? '1585973' : '1585973';
       	 	form.addButton({
                id: 'custpage_btn_order_repar',
                label: 'Imprimir Orden',
                functionName: 'printOppo(\''+record.id+'\');'
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
            var rec = scriptContext.newRecord;
            var type = scriptContext.type;
            var idRec = rec.getValue('id')
            var transaccion = rec.getValue('custbody_transaccion_invtransfer')
            var userObj = runtime.getCurrentUser();
            var userId = parseInt(userObj.id);
            var articuloReparado = rec.getValue('custbody_repar')
            var entregado = rec.getValue('custbody_entrega') 
            var location
                log.debug('articuloReparado', articuloReparado)
                log.debug('userId', userId)
                if(userId == 923581 && type == 'edit' && articuloReparado == true && transaccion =='' && entregado== false ) {
                    log.debug('usuario deyvid')
                    var toLocation = rec.getValue('location')
                    var client = rec.getValue('entity')
                    var obj_IT = record.create({
                        type: 'inventorytransfer',
                        isDynamic: true
                    }); 
                   
                    obj_IT.setValue({
                        fieldId : 'customform',
                        value : 210
                    });
                    
                    obj_IT.setValue({
                       fieldId : 'location',
                       value : toLocation
                    }); 
                    if(client == 2521418){
                        location = 88
                    }else {
                        location = 87
                    }
                    log.debug('location',location)
                    obj_IT.setValue({
                       fieldId : 'transferlocation',
                       value : location
                    });
                    obj_IT.setValue({
                        fieldId : 'custbody_causa_ajuste',
                        value : 1
                    });
                    /*obj_IT.setValue({
                        fieldId : 'custbody_ce_cuenta_ent_ori',
                        value : 'Inventory'
                    });
                    obj_IT.setValue({
                        fieldId : 'custbody_ce_cuenta_ent_des',
                        value : 'Refacciones Ordenes de Servicio'
                    });*/

                    var lines = rec.getLineCount({
                            sublistId: 'item'
                        });
                    
                    for(var i =0; i<lines; i++){ 
                                                
                        var item_id = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        var dataItem = search.lookupFields({// Busqueda de Invdentory Item
                            type: 'item',
                            id: item_id,
                            columns: ['displayname','itemid','recordtype']
                        });  
                        log.debug('dataItem',dataItem) 
                        var itemType = dataItem['recordtype']
                        log.debug('itemType', itemType)
                        log.debug('item_id',item_id) 
                        if(itemType == 'serializedinventoryitem' || itemType == 'inventoryitem'){
                          
                        var item_quantity = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }); 
                        //log.debug('dataItem',dataItem)
                        var descripcionItem = dataItem['displayname']
                        var skuItem = dataItem['itemid']
                        //log.debug('descripcionItem', descripcionItem)
                        //log.debug('skuItem', skuItem)
                        
                       obj_IT.selectNewLine({
                            sublistId: 'inventory',
                            
                        });

                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'item',
                            line : i,
                            value : item_id
                        });

                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'description',
                            line : i,
                            value : skuItem
                        });
                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'item_display',
                            line : i,
                            value : skuItem
                        });
                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'adjustqtyby',
                            line : i,
                            value : item_quantity
                        });
                        
                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'inventorydetailreq',
                            line : i,
                            value : false
                        });
                        obj_IT.commitLine({//cierre de linea seleccionada 
                                sublistId: 'inventory'
                            });   
                        }                
                    }   
                                        
                    var id_IT = obj_IT.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    })
                        
                    log.debug('id_IT', id_IT)
                    record.submitFields({
                        type: 'opportunity',
                        id: idRec,
                        values: { custbody_transaccion_invtransfer: id_IT}
                    })
                }
                //Regresar inventario
                    var newRec = scriptContext.newRecord;
                    var oldRec = scriptContext.oldRecord;
                    var oldODV = oldRec.getValue('custbody_odv_creada')
                    var newODV = newRec.getValue('custbody_odv_creada')
                    var ovdCreada = rec.getValue('custbody_odv_creada')
                    log.debug()
                   if(userId == 923581 && type == 'edit' && articuloReparado == true && transaccion != '' && newODV != oldODV && newODV == true) {
                    log.debug('entregado')
                    var toLocation = rec.getValue('location')
                    var client = rec.getValue('entity')
                    var location

                    var obj_IT = record.create({
                        type: 'inventorytransfer',
                        isDynamic: true
                    }); 
                   
                    obj_IT.setValue({
                        fieldId : 'customform',
                        value : 210
                    });
                    if(client == 2521418){
                        location = 88
                    }else {
                        location = 87
                    }
                    obj_IT.setValue({
                       fieldId : 'location',
                       value : location
                    }); 
                    
                    log.debug('location',location)
                    obj_IT.setValue({
                       fieldId : 'transferlocation',
                       value : toLocation
                    });
                    obj_IT.setValue({
                        fieldId : 'custbody_causa_ajuste',
                        value : 1
                    });

                    var lines = rec.getLineCount({
                            sublistId: 'item'
                        });
                    
                    for(var i =0; i<lines; i++){ 
                                                
                        var item_id = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        var dataItem = search.lookupFields({// Busqueda de Invdentory Item
                            type: 'item',
                            id: item_id,
                            columns: ['displayname','itemid','recordtype']
                        });  
                        log.debug('dataItem',dataItem) 
                        var itemType = dataItem['recordtype']
                        log.debug('itemType', itemType)
                        log.debug('item_id',item_id) 
                        if(itemType == 'serializedinventoryitem' || itemType == 'inventoryitem'){
                          
                        var item_quantity = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }); 
                        //log.debug('dataItem',dataItem)
                        var descripcionItem = dataItem['displayname']
                        var skuItem = dataItem['itemid']
                        //log.debug('descripcionItem', descripcionItem)
                        //log.debug('skuItem', skuItem)
                        
                       obj_IT.selectNewLine({
                            sublistId: 'inventory',
                            
                        });

                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'item',
                            line : i,
                            value : item_id
                        });

                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'description',
                            line : i,
                            value : skuItem
                        });
                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'item_display',
                            line : i,
                            value : skuItem
                        });
                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'adjustqtyby',
                            line : i,
                            value : item_quantity
                        });
                        
                        obj_IT.setCurrentSublistValue({
                            sublistId : 'inventory',
                            fieldId : 'inventorydetailreq',
                            line : i,
                            value : false
                        });
                        obj_IT.commitLine({//cierre de linea seleccionada 
                                sublistId: 'inventory'
                            });   
                        }                
                    }   
                                        
                    var id_IT2 = obj_IT.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    })
                        
                    log.debug('id_IT2', id_IT2)
                    record.submitFields({
                        type: 'opportunity',
                        id: idRec,
                        values: { custbody_transaccion_invtransfer: id_IT2}
                    })
                    
                   }

    		if(scriptContext.type == 'create'){
    			sendEmailOrderRepair(scriptContext);
    		}
    	}catch(err){
    		log.error("error after submit",err);
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
