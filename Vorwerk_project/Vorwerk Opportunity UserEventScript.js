/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/url','N/https'],

function(runtime,url,https) {
   
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
    		form.clientScriptFileId = (runtime.envType != 'PRODUCTION') ? '1510041' : '1585973';
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
