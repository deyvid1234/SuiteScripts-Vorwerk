/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog','N/http','N/https','N/search','N/currentRecord'],

function(record,dialog,http,https,search,currentRecord) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	var thisRecord = scriptContext.currentRecord;
        thisRecord.getCurrentSublistField({
            sublistId: 'expense',
            fieldId: 'estimatedamount'
        }).isDisabled = true;
        thisRecord.getCurrentSublistField({
            sublistId: 'expense',
            fieldId: 'custcolmonto_enpesos'
        }).isDisabled = true;
        
    	return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	try{
    		var rec = currentRecord.get();
            var customform = rec.getValue({
                fieldId: 'customform'
            });
            var fieldid = scriptContext.fieldId;
            var thisRecord = scriptContext.currentRecord;
            if(customform == '231'){
                console.log('customform',customform)
                
                if(fieldid == 'custcol_cuentacustom'){
                    console.log('modificamos cuenta custom')
                    var cuentaCustom = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol_cuentacustom'
                    });
                    console.log('cuentaCustom',cuentaCustom)  
                    var proceso = 'getCategoria'
                    var url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1506&deploy=1';
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({cuenta:cuentaCustom,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var categoria = response.slice(1, -1)
                    var cuentaCustom = rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'category_display',
                        value: categoria
                    });
                    
                    
                }
                if(fieldid =='custcol7'){
                    var vendor = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol7'
                    });
                    var proceso = 'getCurrency'
                    console.log('vendor',vendor) 

                    var url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1506&deploy=1';
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({vendor:vendor,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var currencyVendor = response.slice(1, -1)
                    var monedaProveedor = rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol_moneda_proveedor',
                        value: currencyVendor
                    });  
                    
                    thisRecord.getCurrentSublistField({
                        sublistId: 'expense',
                        fieldId: 'estimatedamount'
                    }).isDisabled = false;
                    thisRecord.getCurrentSublistField({
                        sublistId: 'expense',
                        fieldId: 'custcolmonto_enpesos'
                    }).isDisabled = false;

                }
                var montoPesos = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcolmonto_enpesos'
                });
                var estimatedAmount = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'estimatedamount'
                });
                if(fieldid =='estimatedamount'&& montoPesos== ''){
                    console.log('entro monto estimate 231')
                    var vendor = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol7'
                    });
                    var proceso = 'getCurrency'
                    console.log('vendor',vendor) 

                    var url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1506&deploy=1';
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({vendor:vendor,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var currencyVendor = response.slice(1, -1)
                    
                    var estimatedAmount = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'estimatedamount'
                    });
                    console.log('estimatedAmount',estimatedAmount)
                    var cambio= 1
                    if(currencyVendor=='2'){
                        cambio = 17
                    } else if(currencyVendor == '4'){
                        cambio = 19
                    }
                    
                    var conversion = estimatedAmount * cambio
                    
                    var montoPesos = rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcolmonto_enpesos',
                        value: conversion
                    });
                    var campoTotal = rec.getValue({
                        fieldId: 'custbody_monto_pesos'
                    });

                    var total = campoTotal + conversion
                    console.log('total',total)
                    var montoTotal = rec.setValue({
                        fieldId: 'custbody_monto_pesos',
                        value: total
                    });
                    
                }
                if(fieldid =='custcolmonto_enpesos' && estimatedAmount== ''){
                    console.log('entro monto 231')
                    var vendor = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol7'
                    });
                    var proceso = 'getCurrency'
                    console.log('vendor',vendor) 

                    var url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1506&deploy=1';
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({vendor:vendor,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var currencyVendor = response.slice(1, -1)
            
                    var montoPesos = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcolmonto_enpesos'
                    });
                    
                    var cambio= 1
                    if(currencyVendor=='2'){
                        cambio = 17
                    } else if(currencyVendor == '4'){
                        cambio = 19
                    }
                    var conversion = montoPesos / cambio
                    
                    var estimatedAmount = rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'estimatedamount',
                        value: conversion
                    });
                    var campoTotal = rec.getValue({
                        fieldId: 'custbody_monto_pesos'
                    });
                    console.log('campoTotal',campoTotal)
                    console.log('montoPesos',montoPesos)
                    var total = campoTotal + montoPesos
                    console.log('total',total)
                    var montoTotal = rec.setValue({
                        fieldId: 'custbody_monto_pesos',
                        value: total
                    });
                    
                }

            }

            

            if(fieldid =='povendor' && customform != '231'){
                var vendor = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'povendor'
                });

                console.log('vendor',vendor) 
                var vendorRec= record.load({
                    type: 'vendor',
                    id: vendor,
                    isDynamic: false,
                });
                var currencyVendor = vendorRec.getValue('currency')
                console.log('currencyVendor',currencyVendor)
                var monedaProveedor = rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_moneda_proveedor',
                    value: currencyVendor
                });  
                
                thisRecord.getCurrentSublistField({
                    sublistId: 'expense',
                    fieldId: 'estimatedamount'
                }).isDisabled = false;
                thisRecord.getCurrentSublistField({
                    sublistId: 'expense',
                    fieldId: 'custcolmonto_enpesos'
                }).isDisabled = false;

            }
            var montoPesos = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcolmonto_enpesos'
                });
            var estimatedAmount = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'estimatedamount'
                });
            if(fieldid =='estimatedamount'&& montoPesos== ''&& customform != '231'){
                console.log('entro monto estimate')
                var vendor = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'povendor'
                });
                
                 console.log('vendor',vendor)
                var vendorRec= record.load({
                    type: 'vendor',
                    id: vendor,
                    isDynamic: false,
                });
                var currencyVendor = vendorRec.getValue('currency')
                
                var estimatedAmount = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'estimatedamount'
                });
                console.log('estimatedAmount',estimatedAmount)
                var cambio= 1
                if(currencyVendor=='2'){
                    cambio = 17
                } else if(currencyVendor == '4'){
                    cambio = 19
                }
                
                var conversion = estimatedAmount * cambio
                
                var montoPesos = rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcolmonto_enpesos',
                    value: conversion
                });
                var campoTotal = rec.getValue({
                    fieldId: 'custbody_monto_pesos'
                });

                var total = campoTotal + conversion
                console.log('total',total)
                var montoTotal = rec.setValue({
                    fieldId: 'custbody_monto_pesos',
                    value: total
                });
                
            }
            if(fieldid =='custcolmonto_enpesos' && estimatedAmount== ''&& customform != '231'){
                console.log('entro monto')
                var vendor = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'povendor'
                });
                if(customform == '231'){
                    vendor = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol7'
                    }); 
                }
                var vendorRec= record.load({
                    type: 'vendor',
                    id: vendor,
                    isDynamic: false,
                });
                var currencyVendor = vendorRec.getValue('currency')
            
                var montoPesos = rec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcolmonto_enpesos'
                });
                
                var cambio= 1
                if(currencyVendor=='2'){
                    cambio = 17
                } else if(currencyVendor == '4'){
                    cambio = 19
                }
                var conversion = montoPesos / cambio
                
                var estimatedAmount = rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'estimatedamount',
                    value: conversion
                });
                var campoTotal = rec.getValue({
                    fieldId: 'custbody_monto_pesos'
                });
                console.log('campoTotal',campoTotal)
                console.log('montoPesos',montoPesos)
                var total = campoTotal + montoPesos
                console.log('total',total)
                var montoTotal = rec.setValue({
                    fieldId: 'custbody_monto_pesos',
                    value: total
                });
                
		  }
    		return true;
    	}catch(err){
    		log.error("error fieldChanged",err);
    	}
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {
        
    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
        
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	try{
    		return true;
    	}catch(err){
    		log.error('errorsaverecord',err);
    	}
    	return true;
    }

   
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
