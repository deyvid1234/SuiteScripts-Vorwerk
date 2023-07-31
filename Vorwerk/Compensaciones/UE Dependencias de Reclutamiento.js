/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record'],

function(search, record) {
   
	
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {
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
    function beforeSubmit(context) {
    	log.debug('beforeSubmit', 'Antes de borrar eliminar dependencias. ' + context.newRecord.type);
    	desvilcularOV(context.newRecord.type, context.newRecord.id);
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
    function afterSubmit(context) {
    	
    }
    
    function desvilcularOV(tipo, id){
    	log.debug('desvilcularOV', 'tipo: ' + tipo + ' id: ' + id);
    	
    	var detalleRecordType = '';
    	var salesOrderLinkFieldNameFilter = '';
    	var salesOrderFieldForUpdate = {};
    	var detalleLinkMaster = '';

    	if(tipo == 'customrecord_comisiones_gtm'){			
			detalleRecordType = 'customrecord_comisiones_gtm_det';	
			salesOrderLinkFieldNameFilter = ['custbody_comision_aplicada_gtm', 'anyof', id];
			salesOrderFieldForUpdate['custbody_comision_aplicada_gtm'] = null;
			detalleLinkMaster = 'custrecord_gtm_det_comision_gtm_id';
		} else if(tipo == 'customrecord_comisiones_rec'){
			detalleRecordType = 'customrecord_comisiones_rec_det';
			salesOrderLinkFieldNameFilter = ['custbody_comision_aplicada_rec', 'anyof', id];
			salesOrderFieldForUpdate['custbody_comision_aplicada_rec'] = null;
			detalleLinkMaster = 'custrecord_rec_det_comision_rec_id';
		} else if(tipo == 'customrecord_comisiones_jdg'){
			detalleRecordType = 'customrecord_comisiones_jdg_det';		
			salesOrderLinkFieldNameFilter = [['custbody_comision_aplicada_jdg', 'anyof', id], 'or', 
												['custbody_comision_aplicada_jdg_super', 'anyof', id], 'or', 
												['custbody_comision_aplicada_jdg_split', 'anyof', id]];
			salesOrderFieldForUpdate['custbody_comision_aplicada_jdg'] = null;
			salesOrderFieldForUpdate['custbody_comision_aplicada_jdg_super'] = null;
			salesOrderFieldForUpdate['custbody_comision_aplicada_jdg_split'] = null;
			detalleLinkMaster = 'custrecord_jdg_det_comision_jdg_id';
		}
    	
    	//- borrar detalles de la compensaci�n
		search.create({
			type: detalleRecordType,
			filters: [detalleLinkMaster, 'anyof', id],
		}).run().each(function ( result ){
			log.debug('Borrando registro de detalles:', 'customrecord_comisiones_rec_det: ' + result.id);
			record.delete({type: detalleRecordType, id: result.id});
			return true;
		});
		
		//- Borrar vilculos de sales order
		search.create({
			type: 'salesorder',
			filters: [salesOrderLinkFieldNameFilter, 'AND',  ['mainline', 'is', 'T']]
		}).run().each(function ( result ){
			log.debug('submitFields', 'salesorder: ' + result.id);
			record.submitFields({type: 'salesorder', id: result.id, values: salesOrderFieldForUpdate});
			return true;
		});
    }

    return {
//        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
//        afterSubmit: afterSubmit
    };
    
});
