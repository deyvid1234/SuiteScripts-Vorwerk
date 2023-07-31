/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','./Vorwerk Utils.js','./Vorwerk Dictionary Script.js'],

function(record,search,Utils,Dictionary) {
   
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
    		log.debug("start afeter submit","start");
    		
    		var rec = scriptContext.newRecord;
    		var rec_type = rec.type;
    		var subtotal = rec.getValue('custrecord_c_gtm_subtotal');
    		var total = 0; 
    		var retencion = 0;
    		var sumBonos = Utils.getBonos(2,rec);//el numero indica el tipo de promocion del presentador
    		log.debug('sumBonos',sumBonos);
    		log.debug('subtotal',subtotal);
    		if(subtotal != ""){
    			subtotal= subtotal+sumBonos;
    			var rec_related = rec.getValue('custrecord_sub_registro_compensaciones_g');
    			var tmp_period = search.lookupFields({
                    type: 'customrecord_registro_compensaciones',
                    id: rec_related,
                    columns: 'custrecord_periodo_comision'
                });
    			
    			var period = tmp_period.custrecord_periodo_comision[0].value;
    			var listISR = Utils.getISRData(period);//se extrae la lista de isr 
    			var isr = listISR.isrList;
    			for(var x in isr){
    				if(subtotal > parseFloat(isr[x].inferiorLimit)  && subtotal <= parseFloat(isr[x].topLimit)){//se valida que el subtotal se mayor al limite inferior y menor que el limite superior
    					
    					var ret_aux = subtotal -parseFloat(isr[x].inferiorLimit)//subtotal menos limite inferior
    					log.debug('ret_aux',ret_aux);
    					var porcentaje = parseFloat(isr[x].percentOverIL)/100;//se obtiene el porcentaje de cuota
    					log.debug('porcentaje',porcentaje);
    					var base = ret_aux*porcentaje //se extrae la base de isr
    					log.debug('base',base);
    					retencion = base+parseFloat(isr[x].quota);//se obtiene la retencion
    					
    					log.debug('retencion',retencion);
    					break;
    				}
    			}
    			total = subtotal-retencion;
    			try{
    				var rec_jdg = record.load({
    	                type: rec_type,
    	                id: rec.id,
    	                isDynamic: true
    	            });
    				rec_jdg.setValue('custrecord_c_gtm_retencion',retencion);
    				rec_jdg.setValue('custrecord_c_gtm_total',total);
    				rec_jdg.setValue('custrecord_c_gtm_subtotal',subtotal);
    				rec_jdg.save({enableSourcing: false, ignoreMandatoryFields: true });
    			}catch(err_set){
    				log.error("error set retencion",err_set);
    			}
    			
    			
    			log.debug('listISR',listISR);
    			
    		}
    		
    	}catch(err){
    		log.error('Error afterSubmit',err);
    	}
    }
    
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
