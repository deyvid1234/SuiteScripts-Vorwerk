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
            var form = scriptContext.form;
            var formulario = rec.getValue('customform')
            log.debug('formulario',formulario)//formulario 222 es solicitus vorwerk, 231 custom requisition  
            if(formulario == '231'){
               var listLineCount = rec.getLineCount({
                 sublistId: "expense"
                });

                for (var i = 0; i < listLineCount; i++) {
                    
                    var vendorCustom = rec.getSublistValue({
                        sublistId: "expense",
                        fieldId: "custcol7",//vendor
                        line: i
                    });
                    
                    
                    log.debug('vendorCustom',vendorCustom)
                    
                    var vendor = rec.setSublistValue({
                        sublistId: "expense",
                        fieldId: "povendor",
                        line: i,
                        value : vendorCustom                                                                                                                                                                 
                    });
                }   
            
                
            }
            var listLineCountExpense = rec.getLineCount({
                sublistId: "expense"
            });
            var listLineCountItem = rec.getLineCount({
                sublistId: "item"
            });
            log.debug('listLineCountExpense',listLineCountExpense)
            log.debug('listLineCountItem',listLineCountItem)
            var totalGastos = 0
            var totalItem = 0 
            if(listLineCountExpense){
                
                for (var i = 0; i < listLineCountExpense; i++) {
                    
                    var montoPesos = rec.getSublistValue({
                        sublistId: "expense",
                        fieldId: "custcolsub_impuestos",//vendor
                        line: i
                    });
                    
                    totalGastos = totalGastos+montoPesos
                    log.debug('total',total)
                    
                    
                }   
                
            }
            if(listLineCountItem){
                 
                for (var i = 0; i < listLineCountItem; i++) {
                    
                    var montoPesos = rec.getSublistValue({
                        sublistId: "item",
                        fieldId: "custcolsub_impuestos",//vendor 
                        line: i
                    });
                    
                    totalItem = totalItem+montoPesos
                    log.debug('total',totalItem)
                    
                    
                }   
                
            }
            
            var total = totalGastos + totalItem   
            var montoTotal = rec.setValue({
                fieldId: "custbody_monto_pesos",
                value : total                                                                                                                                                                 
            });

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
       /* var rec = scriptContext.newRecord;
        var recordid = rec.id;
        var formulario = rec.getValue('customform')
        log.debug('formulario',formulario)//formulario 222 es solicitus vorwerk, 231 custom requisition  
        if(formulario == '231'){
            var solicitud = record.load({
                id: recordid,
                type: 'purchaserequisition',
                isDynamic: false
            });

            var numLines = solicitud.getLineCount({
                sublistId: 'expense'
            });
            for(var i =0; i<numLines; i++){ 

                var cuentaEC = solicitud.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_cuentacustom',
                    line: i
                })
                log.debug('cuentaEC',cuentaEC)
                var eliminarCategoria = solicitud.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcoleliminar_categoria',
                    line: i
                })
                log.debug('eliminarCategoria',eliminarCategoria)
                if(eliminarCategoria == true){
                    var categoria = solicitud.setSublistValue({//seteamos la categoria en su campo
                        sublistId: 'expense',
                        fieldId: 'category',
                        line: i,
                        value: ''
                    });
                }
                
                var account = solicitud.setSublistValue({//seteamos la categoria en su campo
                    sublistId: 'expense',
                    fieldId: 'account',
                    line: i,
                    value: cuentaEC
                });

            }
            solicitud.save();

        }*/
        
    }

  
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
