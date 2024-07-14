/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog','N/http','N/https','N/search','N/currentRecord','N/currency','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

function(record,dialog,http,https,search,currentRecord,currency,Utils) {
    
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
            sublistId: 'item',
            fieldId: 'estimatedamount'
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
            var sublistName = scriptContext.sublistId;
            var thisRecord = scriptContext.currentRecord;
            if(customform == '231'){//formulario custom para employee centre
                console.log('customform',customform)
                
                if(fieldid == 'custcol_cuentacustom'){//cuando se ingresa la cuenta en elcmpo custom se llama al suitelet para obtener la categoria
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
                    var cuentaCustom = rec.setCurrentSublistValue({//seteamos la categoria en su campo
                        sublistId: 'expense',
                        fieldId: 'category_display',
                        value: categoria
                    });
                    
                    
                }
                var sublista = ''
                console.log('sublistName',sublistName)
                var campoVendor = ''
                if(sublistName =='expense'){
                        sublista = 'expense'
                        campoVendor = 'custcol7'
                }else if(sublistName =='item'){
                    sublista = 'item'
                    campoVendor = 'povendor'
                }
                console.log('sublista',sublista)

                if(fieldid ==campoVendor){//cuando se agrega el vendor llamamos al suitelet para obtener la moneda del proveedor
                    var vendor = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: campoVendor
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
                    var monedaProveedor = rec.setCurrentSublistValue({//seteamos el dato de la moneda en el campo custom
                        sublistId: sublista,
                        fieldId: 'custcol_moneda_proveedor',
                        value: currencyVendor
                    });  
                    
                    thisRecord.getCurrentSublistField({//habilitamos los campos de Monto en moneda del proveedor y monto en pesos para poder ingresr los montos
                        sublistId: sublista,
                        fieldId: 'estimatedamount'
                    }).isDisabled = false;
                    thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'custcolmonto_enpesos'
                    }).isDisabled = false;

                }
                var montoPesos = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                });
                var estimatedAmount = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                });
                if(fieldid =='estimatedamount'&& montoPesos== ''){//Si se ingresa el monto en la moneda del proveedor se hara la conversion a pesos
                    console.log('entro monto estimate 231')
                    var vendor = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: campoVendor
                    });
                    var proceso = 'getCurrency'
                    console.log('vendor',vendor) 

                    var url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1506&deploy=1';
                    
                    var headers = {'Content-Type': 'application/json'};//llamada al suitelet para obtener la moneda del proveedor
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({vendor:vendor,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var currencyVendor = response.slice(1, -1)
                    
                    var estimatedAmount = rec.getCurrentSublistValue({//se obtiene el monto
                        sublistId: sublista,
                        fieldId: 'estimatedamount'
                    });
                    console.log('estimatedAmount',estimatedAmount)
                    var rate = Utils.currencyConvert(currencyVendor,'1');//se obtiene el rate desde el utils
                    
                    var conversion = estimatedAmount * rate
                    
                    var montoPesos = rec.setCurrentSublistValue({//seteamos el monto en pesos e su respectivo campo
                        sublistId: sublista,
                        fieldId: 'custcolmonto_enpesos',
                        value: conversion
                    });
                    
                    thisRecord.getCurrentSublistField({//se vuelven a deshabilirat los campos de montos
                        sublistId: 'expense',
                        fieldId: 'estimatedamount'
                    }).isDisabled = true;
                    thisRecord.getCurrentSublistField({
                        sublistId: 'expense',
                        fieldId: 'custcolmonto_enpesos'
                    }).isDisabled = true;
                    
                }
                if(fieldid =='custcolmonto_enpesos' && estimatedAmount== ''){//si se ingresa el monto en pesos hace la conversion a la moneda del proveedor
                    console.log('entro monto 231')
                    var vendor = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: campoVendor
                    });
                    var proceso = 'getCurrency'
                    console.log('vendor',vendor) 

                    var url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1506&deploy=1';//llamada al suitelet para obtener la moneda del proveedor
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({vendor:vendor,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var currencyVendor = response.slice(1, -1)
            
                    var montoPesos = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcolmonto_enpesos'
                    });
                    
                    var rate = Utils.currencyConvert('1',currencyVendor);//se obtiene el rate desde el utils
                    var conversion = montoPesos * rate
                    
                    var estimatedAmount = rec.setCurrentSublistValue({//seteamos el monto en la moneda del proveedor
                        sublistId: sublista,
                        fieldId: 'estimatedamount',
                        value: conversion
                    });
                    
                    thisRecord.getCurrentSublistField({//se deshabilitan los campos de montos
                        sublistId: 'expense',
                        fieldId: 'estimatedamount'
                    }).isDisabled = true;
                    thisRecord.getCurrentSublistField({
                        sublistId: 'expense',
                        fieldId: 'custcolmonto_enpesos'
                    }).isDisabled = true;
                    
                }
                if(fieldid =='custcol_tc'&& sublista == 'expense'){
                    var idTax = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcol_tc'
                    });
                    console.log('idTax',idTax)
                    var proceso = 'getRateTax'
                    
                    var url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1506&deploy=1';//llamada al suitelet para obtener la el rate con el tax code
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({idTax:idTax,proceso:proceso}),
                        headers: headers
                    }).body;

                    console.log('response',response)

                    var rateTax = response
                    console.log('rateTax',rateTax)

                    var montoPesos = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'estimatedamount'
                    });
                    var finalAmount
                    var impuesto
                    if (rateTax < 0) {
                        console.log('negativo')
                        impuesto = (Math.abs(rateTax) / 100) * montoPesos;
                        finalAmount = montoPesos - impuesto;
                    } else {
                        console.log('positivo')
                        impuesto = (rateTax / 100) * montoPesos;
                        finalAmount = montoPesos + impuesto;
                    }
                    
                    console.log('finalAmount',finalAmount)
                    amount
                    var amount = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'estimatedamount',
                        value: finalAmount
                    });
                }

            }


            //form 222
            var sublista = ''
            if(sublistName =='expense'){
                    sublista = 'expense'
            }else if(sublistName =='item'){
                sublista = 'item'
            }
            
            if(fieldid =='povendor' && customform != '231'){//proceso para el form Solicitur Vorwerk
                
                var vendor = rec.getCurrentSublistValue({//se obtiene el vendor, su moneda y se setea en el campo de moneda del proveedor
                    sublistId: sublista,
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
                    sublistId: sublista,
                    fieldId: 'custcol_moneda_proveedor',
                    value: currencyVendor
                });  
                
                thisRecord.getCurrentSublistField({//habilitamos los campos de montos
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                }).isDisabled = false;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                }).isDisabled = false;

            }
           
            var montoPesos = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                });
            var estimatedAmount = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                });
            

            if(fieldid =='estimatedamount'&& customform != '231' ){//si se ingresa el monto en la moneda del proveedor se hace la conversion a pesos y se setea al campo de monto en pesos
                console.log('entro monto estimate',sublista)
                var vendor = rec.getCurrentSublistValue({
                    sublistId: sublista,
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
                var monedaSalida = 'MXN'
                var estimatedAmount = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                });
                console.log('estimatedAmount',estimatedAmount)
                var rate = Utils.currencyConvert(currencyVendor,'1');
                console.log('rate',rate)
                var conversion = estimatedAmount * rate;

                var montoPesos = rec.setCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos',
                    value: conversion
                });
                if(sublista == 'item'){
                    var amount = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'amount',
                        value: conversion
                    });
                    var rate = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'rate',
                        value: conversion
                    });
                }
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                }).isDisabled = true;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                }).isDisabled = true;
                
            }
            if(fieldid =='custcolmonto_enpesos' && estimatedAmount== ''&& customform != '231'){//si el monto se ingresa en pesos se hace la conversion a la moneda de proveedor
                console.log('entro monto')
                var vendor = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'povendor'
                });
                
                var vendorRec= record.load({
                    type: 'vendor',
                    id: vendor,
                    isDynamic: false,
                });
                var currencyVendor = vendorRec.getValue('currency')
            
                var montoPesos = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                });
                
                var rate = Utils.currencyConvert('1',currencyVendor);
                console.log('rate 4',rate)
                var conversion = montoPesos * rate;
                
                
                var estimatedAmount = rec.setCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'estimatedamount',
                    value: conversion
                });
               
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                }).isDisabled = true;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                }).isDisabled = true;
                
		    }

            if(fieldid =='custcol_tc'&& sublista == 'expense'){
                var idTax = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'custcol_tc'
                });
                console.log('idTax',idTax)
                var taxRec= record.load({
                    type: 'salestaxitem',
                    id: idTax,
                    isDynamic: false,
                });
                var rateTax = taxRec.getValue('rate')
                console.log('rateTax',rateTax)

                var montoPesos = rec.getCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                });
                var finalAmount
                var impuesto
                if (rateTax < 0) {
                    console.log('negativo')
                    impuesto = (Math.abs(rateTax) / 100) * montoPesos;
                    finalAmount = montoPesos - impuesto;
                } else {
                    console.log('positivo')
                    impuesto = (rateTax / 100) * montoPesos;
                    finalAmount = montoPesos + impuesto;
                }
                
                console.log('finalAmount',finalAmount)
                amount
                var amount = rec.setCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'estimatedamount',
                    value: finalAmount
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
