/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

function(record) {
   
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
    		var transaction = rec.getValue('custrecord_vk_item_receipt_id');
    		var bin = rec.getValue('custrecord_vk_bin_associated');
    		var id_sublist = rec.getValue('custrecord_vk_internalid_item_sl');
    		var valid_proces= rec.getValue('custrecord_vk_processed');
    		//valida que el registro no se haya procesado 
    		if(!valid_proces){
    			log.debug('id_sublist',id_sublist);
        		var objRecord = record.load({
                    type    :   'itemreceipt',
                    id      :   transaction,
                    isDynamic: false
                });
        		
        		var items = objRecord.getLineCount({
                    sublistId  : 'item'
                });
        		for (var i = 0; i < items; i++) {
            		
            		var subrecord = objRecord.getSublistSubrecord({
                        sublistId : 'item',
                        fieldId   : 'inventorydetail',
                        line      : i
                    });
            		//identifica si el item receipt tiene subrecords
            		if(subrecord != null) {
            			//si el registro es encontrado procede a modificarlo
            			if(subrecord.getValue('id') == id_sublist){
            				log.debug("lo encontre",id_sublist);
            				try{
            					//setea el bin correspondiente
            					subrecord.setSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'binnumber',
                                    line: 0,
                                    value:bin ,
                                })
                                var id_r=  objRecord.save();
            					//marca el registro como procesado
            					var rid = record.submitFields({
            		                    type: rec.type,
            		                    id: rec.id,
            		                    values: {'custrecord_vk_processed':true}
        		                });
            					log.debug('id_r',id_r);
            				}catch(err_setbin){
            					log.error("Error set bin",err_setbin)
            					//en caso de error marca asigna el error encontrado
            					var rid = record.submitFields({
    	    		                    type: rec.type,
    	    		                    id: rec.id,
    	    		                    values: {'custrecord_vk_message_error':err_setbin.message}
    			                });
            				}
            				break;
            			}
            		}
            		
        		}
    		}else{
    			return true;
    		}
    	}catch(err){
    		log.error("Error after submit",err);
    	}
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
