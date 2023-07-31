/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],

function(record,search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	try{
    		var id_orders= getOrders();
    		for(var x in id_orders){
    			var id_fulfill = createTransform(id_orders[x],'transferorder','itemfulfillment',true);
    			if(id_fulfill){
    				var id_receipt = createTransform(id_orders[x],'transferorder','itemreceipt');
    			}
    		}
    	}catch(err){
    		log.error("Error execute",err)
    	}
    }
    function createTransform(id,from,totype,values){
    	try{
    		var obj_rec = record.transform({
    			fromType: from,
    			fromId: id,
    			toType: totype
    		});
    		if(values){
    			obj_rec.setValue('shipstatus','C')
    			obj_rec.setValue('custbody_garantia_producto',3)
    			obj_rec.setValue('custbody_wk_process_to_update_massive',true)
    			var numLines = obj_rec.getLineCount({
                    sublistId: 'item'
                });
    			for(var i = 0; i < numLines; i++)    {
    				obj_rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        line: i,
                        value: true
                    });
                }
    		}else{
    			var numLines = obj_rec.getLineCount({
                    sublistId: 'item'
                });
    			for(var i = 0; i < numLines; i++)    {
    				obj_rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        line: i,
                        value: true
                    });
                }
    		}
    		var id_rec= obj_rec.save();
    		log.debug('trasform created '+totype,id_rec);
    		return id_rec;
    	}catch(err){
    		log.error("Error transform "+totype,err)
    		return false;
    	}
    	
    }
    function getOrders(){
    	try{
    		var info_data = [];
    		var busqueda = search.create({
                type: 'transferorder',
                filters: [
                          ['custbody_wk_process_to_update_massive','is',true],
                          'and',
                          ['mainline','is',true],
                          'and',
                          ['status','is','TrnfrOrd:B']
                ],
                columns: [
                          'internalid'
                ]
            });
    		
            busqueda.run().each(function(result){
                info_data.push(result.getValue('internalid'));
                return true;
            });
            log.debug('orders find',info_data);
            return info_data;
    	}catch(err){
    		log.error("Error get orders",err);
    		return [];
    	}
    }
    return {
        execute: execute
    };
    
});
