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
		                columns: ['custitem_disponible_eshop','recordtype']//Stock disponible en el campo para eshop, tipo de registro
		            });

	    			log.debug('dataItem',dataItem)
	    			var disponible_eshop = parseInt(dataItem['custitem_disponible_eshop']) //Stock dedicado a eshop
	    			var nuevoApartado = thisRecord.getValue('custrecord_cantidad_apartada')
		            var itemType = dataItem['recordtype']//Tipo de registro del inventory item
		            if(disponible_eshop >= 0) {
		            	log.debug('stocks','disponible_eshop '+disponible_eshop+' nuevoApartado '+nuevoApartado)
		            	record.submitFields({
		                type: itemType,
		                id: id_Item,
		                values: { custitem_disponible_eshop: nuevoApartado+ disponible_eshop}
		            	})

		            }
	    			else {
                        record.submitFields({
                        type: itemType,
                        id: id_Item,
                        values: { custitem_disponible_eshop: nuevoApartado}
                        })
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
