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
            form.clientScriptFileId = (runtime.envType != 'PRODUCTION') ? '2461652' : '2461652';
            var created= record.getValue('ordertype')
            if(created == 'PurchOrd'){
                form.addButton({
                    id: 'custpage_btn_item_receipt',
                    label: 'Imprimir Recibo',
                    functionName: 'printReceipt(\''+record.id+'\');'
                });
            }
            
            
        log.debug('created',created)
        
        
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
        var record = scriptContext.newRecord;


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
            
        }catch(err){
            log.error("error after submit",err);
        }
    }

  
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
