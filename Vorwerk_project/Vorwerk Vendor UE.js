/**
user
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
            var record = scriptContext.newRecord;
            var oldRecord = scriptContext.oldRecord;
            var statusOld = oldRecord.custentity_status_prov
            var statusNew = record.custentity_status_prov
            if(statusOld != statusNew){
                var listaEmail = {}
                var aprobadorSearch = search.create({
                    type: search.Type.EMPLOYEE,
                    filters: [
                        ['custentity_aprobador_proveedores', 'is', true]
                    ],
                    columns: ['email']
                });
                var pagedResults = mySearch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                       var email = r.getValue('email')
                       listaEmail.push(email)
                    });
                          
                });
                log.debug('listaEmail',listaEmail)
            }
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
