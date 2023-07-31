/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/runtime', 'N/search'],
/**
 * @param {task} task
 */
function(task, runtime, search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(context) {
    	var periodo = runtime.getCurrentScript().getParameter("custscript_ss_periodo");
    	
    	var fechaInicio = null;
    	var fechaFinal = null;
    	search.create({
            type: 'customrecord_periods',
            filters: ['internalid', 'is', periodo], 
            columns: ['custrecord_inicio', 'custrecord_final']
        }).run().each(function ( result ){
            fechaInicio = result.getValue('custrecord_inicio');
            fechaFinal = result.getValue('custrecord_final');
            return true;
        });
    	
    	
    	var contents = 'SalesOrderID\n';
        var searchRes = search.create({
	        type: 'salesorder',
	        filters: [['mainline', 'is', true], 'AND', ['trandate', 'within', [fechaInicio, fechaFinal]]]
	    })/*.run().each(function ( result ){
	    	contents += result.id + '\n';
	        return true;
	    })*/;
        
        
        var pagedMov = searchRes.runPaged();
		pagedMov.pageRanges.forEach(function(pageRange){
    		var page = pagedMov.fetch({index: pageRange.index});
    		page.data.forEach(function(result){
    			contents += result.id + '\n';
    		});
		});
		
        task.create({ 
       	 taskType: task.TaskType.CSV_IMPORT,
       	 mappingId: 'custimport_actualizar_compensaciones',
         name: 'Actualización de Compensaciones del periodo: ' + periodo,
       	 importFile: contents,
        }).submit();
    }

    return {
        execute: execute
    };
    
});
