/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/redirect', 'N/task'],

function(redirect, task) {
   
	
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
    	var r = context.newRecord;

        var idTaskMassiveProcess = task.create({ 
        	taskType: task.TaskType.MAP_REDUCE ,
    		scriptId: 'customscript_manejo_elimincompensaciones',
    		deploymentId: 'customdeploy_manejo_elimincompensaciones',
    		params: {
    			custscript_tipo_comp: r.getValue('custrecord_tipo'),
        		custscript_periodo_comp: r.getValue('custrecord_periodo'),
        		custscript_eliminar_todo: r.getValue('custrecord_eliminar_todo')
    		}
        }).submit();
        
        log.debug('idTaskMassiveProcess', idTaskMassiveProcess);
        redirect.toTaskLink({id: 'LIST_MAPREDUCESCRIPTSTATUS'});
    }

    return {
//        beforeLoad: beforeLoad,
//        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
