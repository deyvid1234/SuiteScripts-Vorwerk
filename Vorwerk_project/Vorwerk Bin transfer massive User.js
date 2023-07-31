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
    		var type = scriptContext.type;
    		var rec = scriptContext.newRecord;
    		var item = rec.getValue('custrecord_vk_item_bin_tranfer');
    		var location = rec.getValue('custrecord_vk_bin_location');
    		var units = rec.getValue('custrecord_vk_units_vorwerk_transfer');
    		var from_bin = rec.getValue('custrecord_vk_from_bins');
    		var to_bin = rec.getValue('custrecord_vk_to_bins');
    		var serial = rec.getValue('custrecord_vk_serial_bin');
    		if(type == 'create' || type == 'edit'){
    			var obj = record.create({
                    type: record.Type.BIN_TRANSFER,
                    isDynamic: true
                });
                obj.setValue({fieldId: 'location', value: location}); // '2' --> Internal ID of the location you want to set
                obj.setValue({fieldId: 'memo', value: 'Advanced Bin'});// 'Advanced Bin' --> Text (Optional)

                obj.selectNewLine({sublistId: 'inventory'});// --> Sublist
                obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'item', value: item}); // '4' --> internal ID of the item you want to set
                obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'quantity', value: units});// '1' --> Value of Quantity you want to set (integer)

                var x = obj.getCurrentSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail'});// --> Subrecord
            	
                x.selectNewLine({sublistId: 'inventoryassignment'});// --> Sublist of Subrecord
                if(serial != ""){
            		x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: serial});
                }
                x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'binnumber', value: from_bin});// '7' --> internal ID of the bin you want to set to "From Bins"
                x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'tobinnumber', value: to_bin});// '9' --> internal ID of the bin you want to set to "To Bins"
                x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', value: units}); // '1' --> Value of Quantity you want set
                
                // NOTE: Make sure the quantity in var x and var obj is the same

                x.commitLine({sublistId: 'inventoryassignment'}); // submit the values set in Sublist of the Subrecord
                

                obj.commitLine({sublistId: 'inventory'});//submit values set in Sublist
                var recID = obj.save();// submit Created Record for Bin Transfer
                log.debug('recID',recID);
                
    		}
    		
          

    	}catch(err){
    		log.error("error after submit",err);
    	}
    	return true;
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
