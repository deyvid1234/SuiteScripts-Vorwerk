/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/task', "./lib", "N/record", "N/search"],
/**
 * @param {task} task
 */
function(task, lib, record, search) {
   
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
    function afterSubmit(context) {    	
    	try{
    		var newRecord = context.newRecord;
    		newRecord = record.load({type: 'salesorder', id: newRecord.id});
    		var idcomm = newRecord.getValue('custbody79');
    		log.debug('UE Dispara validaciones : afterSubmit','idcomm: ' + idcomm + ' | id:' + newRecord.id);
    		
    		if(idcomm){
    			var sistemaEmailTask = task.create({
            		taskType: task.TaskType.SCHEDULED_SCRIPT,
            		scriptId: 'customscript_apply_email_rules',
            		deploymentId: 'customdeploy_apply_email_rules',
            		params: {custscript_salesorder: newRecord.id}
            	});
            	var scheduledScriptTaskId = sistemaEmailTask.submit();
            	log.debug('scheduledScriptTaskId',scheduledScriptTaskId);
            	
            	
            	//- Dispara regla de primera venta de cliente
            	var cliente = newRecord.getValue('entity');
        		var columns = {name: 'internalid', summary: 'count'};
        		search.create({
        			type: 'salesorder',  
        			filters: [['mainline','is',true], 'and', ['entity','is',cliente]],
        			columns: columns
        	    }).run().each(function(r){
        	    	var count = r.getValue(columns);
        	    	
        	    	if(count == 1){
        	    		var fechaBaseObj = newRecord.getValue('trandate');
        	    		var serial = newRecord.getSublistValue({sublistId: 'item', fieldId: 'serialnumbers', line: 0})[0];
        	    		var regla = record.load({type: 'customrecord_se_reglas_email', id: 1});
        	    		var valorEnvio = regla.getValue('custrecord_re_valor_envio');
            			var baseEnvio = regla.getValue('custrecord_re_base_envio');

            			if(baseEnvio == 1){//Dias
            				fechaBaseObj = new Date(fechaBaseObj.getTime() + (1000*60*60*24*valorEnvio));
            			} else if(baseEnvio == 2){//Mes
            				lib.addMonths(fechaBaseObj, valorEnvio)
            			}
            			
            			
        	    		var emailLogId = lib.createEmailLog(null, cliente, 1, regla.getValue('custrecord_re_template'), newRecord.id, fechaBaseObj, serial);
        		    	log.debug('fechaCocina emailLogId',emailLogId);
        		    	
        		    	lib.sendEmail(baseEnvio, valorEnvio);
        	    	}
        	    });
    		}
        	
    	} catch(e){
    		log.debug('error',e);
    	}
    	
    }

    return {
//        beforeLoad: beforeLoad,
//        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
