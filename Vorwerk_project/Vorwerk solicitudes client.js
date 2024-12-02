/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog','N/http','N/https','N/search','N/currentRecord','N/currency','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js','N/runtime'],

function(record,dialog,http,https,search,currentRecord,currency,Utils,runtime) {
    
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
        var rec = currentRecord.get();
        var customform = rec.getValue({
            fieldId: 'customform'
        });
        var thisRecord = scriptContext.currentRecord;
        if(customform  == '230'){
            var campos = [
                'custbody_metodo_repeticion',
                'custbody_no_repeticiones',
                'custbody_a_partir',
                'custbody_dias',
                'custbody_repetir_cada',
                'custbody_fechas_personalizadas',
                'custbody_fecha_personalizada_2',
                'custbody_fecha_personalizada_3',
                'custbody_fecha_personalizada_4',
                'custbody_fecha_personalizada_5',
                'custbody_fecha_personalizada_6',
                'custbody_fecha_personalizada_7',
                'custbody_fecha_personalizada_8',
                'custbody_fecha_personalizada_9',
                'custbody_fecha_personalizada_10',
                'custbody_fecha_personalizada_11',
                'custbody_fecha_personalizada_12',
                'custbody_url_contrato',
                'custbodyregistro_relacionado',
                'custbody_total_solicitud_recurrente'

             ]
            var deshabilitarCampos = disabled(scriptContext,campos,true)
        }
    	
        
       
        thisRecord.getCurrentSublistField({
            sublistId: 'expense',
            fieldId: 'estimatedamount'
        }).isDisabled = true;
        thisRecord.getCurrentSublistField({
            sublistId: 'item',
            fieldId: 'estimatedamount'
        }).isDisabled = true;
        /*thisRecord.getCurrentSublistField({
            sublistId: 'item',
            fieldId: 'custcol_tc'
        }).isDisabled = false;*/
        thisRecord.getCurrentSublistField({
            sublistId: 'expense',
            fieldId: 'custcol_tc'
        }).isDisabled = true;
        thisRecord.getCurrentSublistField({
            sublistId: 'expense',
            fieldId: 'category'
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
            var formEployeeCentre
            if(runtime.envType  == "SANDBOX"){
                formEployeeCentre = '230'
            }else{
                formEployeeCentre = '230'
            }
            var fieldid = scriptContext.fieldId;
            var sublistName = scriptContext.sublistId;
            var thisRecord = scriptContext.currentRecord;


            // solicitudes por contrato
        try{
            var xContrato = thisRecord.getValue('custbody_solicitud_recurrente_contrato')
            
            if(fieldid == 'custbody_solicitud_recurrente_contrato' &&  xContrato == true){
                thisRecord.getField({
                    fieldId: 'custbody_metodo_repeticion'
                }).isDisabled = false;
                thisRecord.getField({
                    fieldId: 'custbody_metodo_repeticion'
                }).isMandatory = true;
                var options = {
                    title: 'Aviso',
                    message: 'Estás activando una Solicitud para Compras periódicas por el mismo monto que incluye un contrato, ¿Deseas continuar?'
                };

                function success(result) {
                    console.log('Success with value ', result);
                    if(result == false){
                        thisRecord.setValue({
                            fieldId: 'custbody_solicitud_recurrente_contrato',
                            value: false
                        });
                    }

                }

                function failure(reason) {
                    console.log('Failure: ', reason);
                }

                dialog.confirm(options).then(success).catch(failure);
            }
            if(fieldid == 'custbody_solicitud_recurrente_contrato' &&  xContrato == false){
                var campos = [
                    'custbody_metodo_repeticion',
                    'custbody_no_repeticiones',
                    'custbody_a_partir',
                    'custbody_dias',
                    'custbody_repetir_cada',
                    'custbody_fechas_personalizadas',
                    'custbody_fecha_personalizada_2',
                    'custbody_fecha_personalizada_3',
                    'custbody_fecha_personalizada_4',
                    'custbody_fecha_personalizada_5',
                    'custbody_fecha_personalizada_6',
                    'custbody_fecha_personalizada_7',
                    'custbody_fecha_personalizada_8',
                    'custbody_fecha_personalizada_9',
                    'custbody_fecha_personalizada_10',
                    'custbody_fecha_personalizada_11',
                    'custbody_fecha_personalizada_12',
                    'custbody_url_contrato',
                    'custbodyregistro_relacionado',
                    'custbody_total_solicitud_recurrente',
                    'custbody_fecha_aprobacion'

                 ]
                var deshabilitarCampos = disabled(scriptContext,campos,true)
                var noMandatory = mandatory(scriptContext,campos,false)
                var vaciarCampos = emptyField(scriptContext,campos)
                
                
            }
            if(fieldid == 'custbody_metodo_repeticion'){
                var metodo = thisRecord.getValue('custbody_metodo_repeticion')
                console.log('metodo',metodo)
                switch(metodo){
                    case '1'://Periodos recurrentes
                        var camposHabilitarYobligar = [
                            'custbody_no_repeticiones',
                            'custbody_a_partir',
                            'custbody_repetir_cada',
                            'custbody_url_contrato'
                        ]
                         
                        disabled(scriptContext,camposHabilitarYobligar,false)
                        mandatory(scriptContext,camposHabilitarYobligar,true)

                        var camposDeshabilitarNoObligar = [
                            'custbody_fechas_personalizadas',
                            'custbody_fecha_personalizada_2',
                            'custbody_fecha_personalizada_3',
                            'custbody_fecha_personalizada_4',
                            'custbody_fecha_personalizada_5',
                            'custbody_fecha_personalizada_6',
                            'custbody_fecha_personalizada_7',
                            'custbody_fecha_personalizada_8',
                            'custbody_fecha_personalizada_9',
                            'custbody_fecha_personalizada_10',
                            'custbody_fecha_personalizada_11',
                            'custbody_fecha_personalizada_12',
                            'custbody_dias'

                        ]

                        disabled(scriptContext,camposDeshabilitarNoObligar,true)
                        mandatory(scriptContext,camposDeshabilitarNoObligar,false)
                        
                    break;
                    case '2'://fechas personalizadas

                        var camposHabilitar = [
                            'custbody_no_repeticiones',
                            'custbody_fechas_personalizadas',
                            'custbody_fecha_personalizada_2',
                            'custbody_fecha_personalizada_3',
                            'custbody_fecha_personalizada_4',
                            'custbody_fecha_personalizada_5',
                            'custbody_fecha_personalizada_6',
                            'custbody_fecha_personalizada_7',
                            'custbody_fecha_personalizada_8',
                            'custbody_fecha_personalizada_9',
                            'custbody_fecha_personalizada_10',
                            'custbody_fecha_personalizada_11',
                            'custbody_fecha_personalizada_12',
                            'custbody_url_contrato'

                        ]
                        var camposObligar = [
                            'custbody_no_repeticiones',
                            'custbody_fechas_personalizadas',
                            'custbody_url_contrato'

                        ]
                         
                        disabled(scriptContext,camposHabilitar,false)
                        mandatory(scriptContext,camposObligar,true)

                        var camposDeshabilitarNoObligar = [
                            'custbody_a_partir',
                            'custbody_repetir_cada',
                            'custbody_dias'

                        ]

                        disabled(scriptContext,camposDeshabilitarNoObligar,true)
                        mandatory(scriptContext,camposDeshabilitarNoObligar,false)
                        
                        
                    break;
                    case '3'://por numero de edias

                        var camposHabilitarYobligar = [
                            'custbody_no_repeticiones',
                            'custbody_a_partir',
                            'custbody_dias',
                            'custbody_url_contrato'
                        ]
                         
                        disabled(scriptContext,camposHabilitarYobligar,false)
                        mandatory(scriptContext,camposHabilitarYobligar,true)

                        var camposDeshabilitarNoObligar = [
                            'custbody_fechas_personalizadas',
                            'custbody_fecha_personalizada_2',
                            'custbody_fecha_personalizada_3',
                            'custbody_fecha_personalizada_4',
                            'custbody_fecha_personalizada_5',
                            'custbody_fecha_personalizada_6',
                            'custbody_fecha_personalizada_7',
                            'custbody_fecha_personalizada_8',
                            'custbody_fecha_personalizada_9',
                            'custbody_fecha_personalizada_10',
                            'custbody_fecha_personalizada_11',
                            'custbody_fecha_personalizada_12',
                            'custbody_repetir_cada'

                        ]

                        disabled(scriptContext,camposDeshabilitarNoObligar,true)
                        mandatory(scriptContext,camposDeshabilitarNoObligar,false)
                        
                    break;
                        
                }
            }
            

        }catch(e){
            log.error('error fieldChanged solicitus recurrente por contrato',e)
        }


//Solicitudes employee centre
            var url
            if(runtime.envType  == "SANDBOX"){
                url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1412&deploy=1';
            } else{
                url = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1412&deploy=1';
            }
            if(customform == formEployeeCentre){//formulario custom para employee centre
                //console.log('customform',customform)
                
                if(fieldid == 'custcol_cuentacustom'){//cuando se ingresa la cuenta en elcmpo custom se llama al suitelet para obtener la categoria
                    //console.log('modificamos cuenta custom')
                    var cuentaCustom = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol_cuentacustom'
                    });
                    console.log('cuentaCustom',cuentaCustom)  
                    var proceso = 'getCategoria'
                    
                    
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
                        fieldId: 'category',
                        value: categoria
                    });
                    /*var cuentaCustom = rec.setCurrentSublistValue({//seteamos la categoria en su campo
                        sublistId: 'expense',
                        fieldId: 'category_display',
                        value: categoria
                    });*/
                    
                    
                }
                var sublista = 'expense'
                //console.log('sublistName',sublistName)
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

                if(sublista == 'item' && (fieldid =='povendor'||fieldid =='quantity') ){//proceso para llenar el campo monto en pesos en los articulos, sin que se edite el campo de estamatedamount
                    console.log('aqui setear pesos')
                    var vendor = rec.getCurrentSublistValue({//se obtiene el vendor, su moneda y se setea en el campo de moneda del proveedor
                        sublistId: sublista,
                        fieldId: 'povendor'
                    });

                    console.log('vendor',vendor) 
                    var proceso = 'getCurrency'
                    console.log('vendor',vendor) 

                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({vendor:vendor,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var currencyVendor = response.slice(1, -1)
                    console.log('currencyVendor',currencyVendor)
                    var monedaProveedor = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcol_moneda_proveedor',
                        value: currencyVendor
                    });  
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
                    
                    thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'estimatedamount'
                    }).isDisabled = true;
                    thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'custcolmonto_enpesos'
                    }).isDisabled = true;

                    var item = rec.getCurrentSublistValue({//se obtiene el item, su tax scheduled y el impuesto
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    console.log('item',item)
                    var proceso = 'getTaxScheduled'
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({item:item,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var sub = response.slice(1, -1)
                    var idTax = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcol_tc',
                        value: sub
                    });
                }
                var montoPesos = rec.getCurrentSublistValue({//creo que aqui salta el error
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
                    thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'custcol_tc'
                    }).isDisabled = false;
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
                    thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'custcol_tc'
                    }).isDisabled = false;
                    thisRecord.getCurrentSublistField({//se deshabilitan los campos de montos
                        sublistId: 'expense',
                        fieldId: 'estimatedamount'
                    }).isDisabled = true;
                    thisRecord.getCurrentSublistField({
                        sublistId: 'expense',
                        fieldId: 'custcolmonto_enpesos'
                    }).isDisabled = true;
                    
                }
                if(fieldid =='custcol_tc'){
                    var idTax = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcol_tc'
                    });
                    console.log('idTax',idTax)
                    var proceso = 'getRateTax'
                    
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
                        fieldId: 'custcolmonto_enpesos'
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
                    
                    var amount = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcolsub_impuestos',
                        value: finalAmount
                    });
                    thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'custcol_tc'
                    }).isDisabled = false;
                }
                
                if(sublista == 'item' && fieldid =='estimatedrate'){//proceso para llenar el campo monto en pesos en los articulos, sin que se edite el campo de estamatedamount
                    console.log('aqui setear pesos')
                    var articulo = rec.getCurrentSublistValue({//se obtiene el vendor, su moneda y se setea en el campo de moneda del proveedor
                        sublistId: sublista,
                        fieldId: 'item'
                    });
                    var precioNuevo = rec.getCurrentSublistValue({//se obtiene el vendor, su moneda y se setea en el campo de moneda del proveedor
                        sublistId: sublista,
                        fieldId: 'estimatedrate'
                    });
                    var rateField = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'rate',
                        value: precioNuevo
                    });
                    console.log('articulo',articulo) 
                    console.log('precioNuevo',precioNuevo) 
                    var proceso = 'setPriceItem'

                    var headers = {'Content-Type': 'application/json'};
                    /*var response = https.post({
                        url: url,
                        body : JSON.stringify({articulo:articulo,precioNuevo:precioNuevo,proceso:proceso}),
                        headers: headers
                    }).body;*/
                    
                    var monedaProveedor = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcol_moneda_proveedor'
                    });  
                    var estimatedAmount = rec.getCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'estimatedamount'
                    });
                    console.log('estimatedAmount',estimatedAmount)
                    var rate = Utils.currencyConvert(monedaProveedor,'1');
                    console.log('rate',rate)
                    var conversion = estimatedAmount * rate;

                    var montoPesos = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcolmonto_enpesos',
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

                    var item = rec.getCurrentSublistValue({//se obtiene el item, su tax scheduled y el impuesto
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    console.log('item',item)
                    var proceso = 'getTaxScheduled'
                    
                    var headers = {'Content-Type': 'application/json'};
                    var response = https.post({
                        url: url,
                        body : JSON.stringify({item:item,proceso:proceso}),
                        headers: headers
                    }).body;
                    console.log('response',response.slice(1, -1))
                    var sub = response.slice(1, -1)
                    var idTax = rec.setCurrentSublistValue({
                        sublistId: sublista,
                        fieldId: 'custcol_tc',
                        value: sub
                    });
                }

            }


            //form 222
            var sublista = 'expense'
            if(sublistName =='expense'){
                    sublista = 'expense'
            }else if(sublistName =='item'){
                sublista = 'item'
            }
            if(fieldid =='item' && customform != formEployeeCentre){


            }
            if(fieldid =='povendor' && customform != formEployeeCentre){//proceso para el form Solicitur Vorwerk
                
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
            
            if(sublista == 'item' && (fieldid =='povendor' || fieldid == 'quantity') && customform != formEployeeCentre ){//proceso para llenar el campo monto en pesos en los articulos, sin que se edite el campo de estamatedamount
                console.log('aqui setear pesos')
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
                
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                }).isDisabled = true;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                }).isDisabled = true;
                var item = rec.getCurrentSublistValue({//se obtiene el item, su tax scheduled y el impuesto
                    sublistId: 'item',
                    fieldId: 'item'
                });
                console.log('item',item)
                var inventoryitem= record.load({
                    type: 'inventoryitem',
                    id: item,
                    isDynamic: false,
                });
                var taxSchedule = inventoryitem.getValue('taxschedule')
                console.log('taxSchedule',taxSchedule)
                var taxRec= record.load({
                    type: 'taxschedule',
                    id: parseInt(taxSchedule,10),
                    isDynamic: false,
                });
                var sub = taxRec.getSublistValue({//se obtiene el vendor, su moneda y se setea en el campo de moneda del proveedor
                    sublistId: 'nexuses',
                    fieldId: 'purchasetaxcode',
                    line: 0
                });
                console.log('sub',sub)
                var idTax = rec.setCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'custcol_tc',
                    value: sub
                });
            }

            if(fieldid =='estimatedamount'&& customform != formEployeeCentre ){//si se ingresa el monto en la moneda del proveedor se hace la conversion a pesos y se setea al campo de monto en pesos
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
                thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'custcol_tc'
                    }).isDisabled = false;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                }).isDisabled = true;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                }).isDisabled = true;
                
            }

            if(fieldid =='custcolmonto_enpesos' && estimatedAmount== ''&& customform != formEployeeCentre){//si el monto se ingresa en pesos se hace la conversion a la moneda de proveedor
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
                        fieldId: 'custcol_tc'
                    }).isDisabled = false;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'estimatedamount'
                }).isDisabled = true;
                thisRecord.getCurrentSublistField({
                    sublistId: sublista,
                    fieldId: 'custcolmonto_enpesos'
                }).isDisabled = true;
                
		    }



            if(fieldid =='custcol_tc'&& customform != formEployeeCentre){
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
                    fieldId: 'custcolmonto_enpesos'
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
                
                var amount = rec.setCurrentSublistValue({
                    sublistId: sublista,
                    fieldId: 'custcolsub_impuestos',
                    value: finalAmount
                });
                thisRecord.getCurrentSublistField({
                        sublistId: sublista,
                        fieldId: 'custcol_tc'
                    }).isDisabled = false;
            }
            
    		return true;
    	}catch(err){
    		log.error("error fieldChanged",err);
    	}

        
    }
    function mandatory(scriptContext,campos,valor){
        try{
            var thisRecord = scriptContext.currentRecord;
            for (i in campos){
                thisRecord.getField({
                    fieldId: campos[i]
                }).isMandatory = valor;
            }
        }catch(e){
            log.error('error mandatory',e)
        }
    }
    function disabled(scriptContext,campos,valor){
        try{
            var thisRecord = scriptContext.currentRecord;
            for (i in campos){
                thisRecord.getField({
                    fieldId: campos[i]
                }).isDisabled = valor;
            }

        }catch(e){
            log.error('error desabilitar campos',e)
        }
    }
    function emptyField(scriptContext,campos){
        try{
            var thisRecord = scriptContext.currentRecord;
            for (i in campos){
                thisRecord.setValue({
                    fieldId: campos[i],
                    value: ''
                });
            }

        }catch(e){
            log.error('error desabilitar campos',e)
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
        return true;
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
            
            var rec = currentRecord.get();
            var customform = rec.getValue({
                fieldId: 'customform'
            });
            var thisRecord = scriptContext.currentRecord;
            var xContrato = thisRecord.getValue('custbody_solicitud_recurrente_contrato')
            if(customform  == '230' && xContrato == false){
              
                if (confirm('Esta solicitud corresponde a una compra sin Contrato, ¿Desea Continuar?')) {
                    return true;
                } else {
                    return false;
                }
                
            }
            if (customform  == '230'&& xContrato == true){
                var campos = [
                    'custbody_metodo_repeticion',
                    'custbody_no_repeticiones',
                    'custbody_a_partir',
                    'custbody_dias',
                    'custbody_repetir_cada',
                    'custbody_fechas_personalizadas',
                    'custbody_fecha_personalizada_2',
                    'custbody_fecha_personalizada_3',
                    'custbody_fecha_personalizada_4',
                    'custbody_fecha_personalizada_5',
                    'custbody_fecha_personalizada_6',
                    'custbody_fecha_personalizada_7',
                    'custbody_fecha_personalizada_8',
                    'custbody_fecha_personalizada_9',
                    'custbody_fecha_personalizada_10',
                    'custbody_fecha_personalizada_11',
                    'custbody_fecha_personalizada_12',
                    'custbody_url_contrato'

                 ]
                for (i in campos){
                    var objField = thisRecord.getField({
                        fieldId: campos[i]
                    });
                    
                    if(objField.isMandatory){
                        
                        var campoValor = thisRecord.getValue({
                            fieldId: campos[i]
                        });
                        
                        if(!campoValor){
                            dialog.alert({
                                title: 'Campos incompletos',
                                message: 'Por favor ingrese valor en el campo: '+ objField.label
                            });
                            return false;
                        }  
                    }
                } 
            }
            
            return true;
            
    		
    	}catch(err){
    		log.error('errorsaverecord',err);
    	}
    	
    }

   
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
