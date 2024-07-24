/**
user
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/url','N/https','N/record'],

function(runtime,url,https,record) {
   
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
            var rec = scriptContext.newRecord;
            var form = scriptContext.form;
            
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
        try{
            var rec = scriptContext.newRecord;
            
            var supAprob = rec.setValue({
                fieldId: 'supervisorapproval',
                value : true
            })
           
        }catch(err){
            log.error("error beforeSubmit",err);
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
    function afterSubmit(scriptContext) {
        var rec = scriptContext.newRecord;
        var recordid = rec.id;
        log.debug('recordid',recordid)
        var poRec = record.load({
            id: recordid,
            type: 'purchaseorder',
            isDynamic: false
        });
        var supAprob = poRec.setValue({
            fieldId: 'supervisorapproval',
            value : true
        })
        var numLines = poRec.getLineCount({
            sublistId: 'expense'
        });
        log.debug('numLines',numLines)
        if(numLines > 0){
            for(var e =0; e<numLines; e++){ 
                var sol_id = poRec.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'linkedorder',
                    line: e
                })
                log.debug('sol_id',sol_id)

                var cuentaPo = poRec.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'account',
                    line: e
                })
                log.debug('cuentaPo',cuentaPo)

                var montoPo = poRec.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'amount',
                    line: e
                })
                log.debug('montoPo',montoPo)

                
                var solRec = record.load({
                    id: sol_id,
                    type: 'purchaserequisition',
                    isDynamic: false
                });
                var numLinesSol = solRec.getLineCount({
                    sublistId: 'expense'
                });
                log.debug('numLinesSol',numLinesSol)
                for(var i =0; i<numLinesSol; i++){ 

                    var solMonto = solRec.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'estimatedamount',
                        line: i
                    })
                    log.debug('solMonto',solMonto)

                    var solCuenta = solRec.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account',
                        line: i
                    })
                    log.debug('solCuenta',solCuenta)
                    if(montoPo == solMonto && cuentaPo == solCuenta){
                        var solTax = solRec.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_tc',
                            line: i
                        })
                        log.debug('solTax',solTax)
                        var montoPo = poRec.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'taxcode',
                            line: e,
                            value : solTax
                        })
                        poRec.save();
                        break;
                    }
                }
                
            }
        }
        
    }

  
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
