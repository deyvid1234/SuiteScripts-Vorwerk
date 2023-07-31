/**
 * @NApiVersion     2.0
 * @NScriptType     ClientScript
 * @ScriptName      VOR | CS | Screen Script
 * @NModuleScope    Public
 * @Company         Netsoft
 * @Author          Oscar Ortega
 * @Description     Script that put all the functions into the Suitelet.
 * @Date            01/12/2021
 * ScriptFile:      NSO_vor_cs_screenScript.js
 * Dependencies:    'N/runtime', 'N/email', 'N/config'
 * idScript:        customscript_vor_cs_screenscript
 * idDeploy:        customdeploy_vor_cs_screenscript
 */

define(['N/runtime', 'N/currentRecord', 'N/ui/message', 'N/search', 'N/url', 'N/https', 'N/format', 'N/ui/dialog'], 
function(runtime, currentRecord, message, search, url, https, format, dialog) {

    const regExpRFC = new RegExp("^[A-Z,Ñ,&]{3,4}[0-9]{2}[0-1][0-9][0-3][0-9][A-Z,0-9]?[A-Z,0-9]?[0-9,A-Z]?$");
    const regExpCP  = new RegExp("^[0-9]{5}$");
    const LANGUAGE  = "es"

    const ERRORES = {
        TIMBRADO: {
                name: {
                    es: 'NSO_ERROR_TIMBRADO',
                    en: 'NSO_ERROR_BILLING'
                },
                message: {
                    es: 'EL TICKET QUE ENVIASTE YA SE ENCUENTRA TIMBRADO ANTE EL SAT.',
                    en: 'THE TICKET YOU SENT IS ALREADY REGISTERED BEFORE THE SAT.'
                }
            },
            FACTURA: {
                name: {
                    es: 'NSO_ERROR_FACTURA',
                    en: 'NSO_ERROR_INVOICE'
                },
                message: {
                    es: 'EL TICKET QUE ENVIASTE NO SE ENCUENTRA EN LA BASE DE DATOS O EL MONTO ES INCORRECTO, VALIDALO.',
                    en: 'THE TICKET YOU SENT IS NOT FOUND IN THE DATABASE OR THE AMOUNT IS INCORRECT, VALIDATE IT.'
                }
            },
            FECHA: {
                name: {
                    es: 'NSO_ERROR_FECHA',
                    en: 'NSO_ERROR_DATE'
                },
                message: {
                    es: 'LA FECHA DE TU FACTURA SE ENCUENTRA FUERA DEL PERIODO ACTUAL, VALIDALO.',
                    en: 'THE DATE OF YOUR INVOICE IS FOUND OUT OF THE CURRENT PERIOD, VALIDATE IT.'
                }
            },
            ENPROCESO: {
                name: {
                    es: 'SOLICITUD_EN_PROCESO',
                    en: 'APPLICATION_IN_PROCESS'
                },
                message: {
                    es: 'SOLICITUD EN PROCESO, ESPERA POR FAVOR.',
                    en: 'APPLICATION IN PROCESS, PLEASE WAIT.'
                }
            },
            RFC: {
                name: {
                    es: 'NSO_ERROR_RFC \n',
                    en: 'NSO_ERROR_RFC \n'
                },
                message: {
                    es: 'RFC INVÁLIDO.',
                    en: 'INVALID RFC.'
                }
            },
            CP: {
                name: {
                    es: 'NSO_ERROR_CÓDIGO_POSTAL \n',
                    en: 'NSO_ERROR_ZIP_CODE \n'
                },
                message: {
                    es: 'CÓDIGO POSTAL INVÁLIDO.',
                    en: 'INVALID ZIP CODE.'
                }
            },
            MONTO: {
                name: {
                    es: 'NSO_ERROR_MONTO_TICKET \n',
                    en: 'NSO_ERROR_AMOUNT_TICKET \n'
                },
                message: {
                    es: 'EL MONTO DEL TICKET NO PUEDE SER MENOR A 0.',
                    en: 'THE TICKET AMOUNT CANNOT BE LESS THAN 0.'
                }
            }
    };

    const MESSAGES = {
        VALIDATION_SALESORDER : {
            en: "Type a sales order number.",
            es: "Ingrese un número de orden de venta."
        },
        INFORMATION : {
            en: "Enter the sales order numbers, without letters.",
            es: "Ingresa los números de su orden de venta, sin letras."
        },
        INFORMATION_TITLE : {
            en : "INFORMATION",
            es : "INFORMACIÓN"
        },
        WARNING_TITLE : {
            en: "WARNING",
            es: "AVISO"
        },
        CONFIRMATION_TITLE : {
            en: "CONFIRMATION",
            es: "CONFIRMACIÓN"
        },
        CONFIRMATION: {
            en: "Check that your data is correct, once generated your tax receipts there are no changes or cancellations. Do you want to continue?",
           es: "Revisa que tus datos sean correctos, una vez generados tus comprobantes fiscales ya no hay cambios ni cancelaciones. ¿Desea continuar?"
        }
    };

    function saveRecord ( context ) { 

        if ( confirm(MESSAGES.CONFIRMATION[LANGUAGE]) ) {
            return true;
        } else {
            return false;
        }
    }

    function getSalesOrderNumber( context ) {

        var params  = {};

        var interface    = currentRecord.get();
        var salesOrderID = interface.getValue({ fieldId:'custpage_sales_order' });

        if( salesOrderID ) {

            params.operation    = 'SEARCH';
            params.idSalesOrder = salesOrderID;

            var urlSuitelet = url.resolveScript({
                                scriptId          : 'customscript_vor_fs_customerinterface',
                                deploymentId      : 'customdeploy_vor_fs_customerinterface',
                                returnExternalUrl : false,
                                params            : params
                            });

            window.ischanged = false;
            window.location  = urlSuitelet;

        } else {
            
            var validationMessage   = message.create({ 
                                        title   : MESSAGES.WARNING_TITLE[LANGUAGE],
                                        message : MESSAGES.VALIDATION_SALESORDER[LANGUAGE], 
                                        type    : message.Type.WARNING 
                                    });

            validationMessage.show({ duration: 3000 });
        }
    } 
    
    function backToMain( context ) {

        var params  = {};

        var urlSuitelet = url.resolveScript({
            scriptId          : 'customscript_vor_fs_customerinterface',
            deploymentId      : 'customdeploy_vor_fs_customerinterface',
            returnExternalUrl : false,
            params            : params
        });

        window.ischanged = false;
        window.location  = urlSuitelet;

    }

    function pageInit( context ) {
        debugger;
    }

    function fieldChanged( context ) {
        
        var interface        = currentRecord.get();
        var sublistFieldName = context.fieldId;

        if ( sublistFieldName == 'custpage_rfc_cliente' ) {

            var rfc = interface.getValue({ fieldId: 'custpage_rfc_cliente' });

            if ( !validaRFC(rfc.toUpperCase()) ) {//RFC INVALIDO
              alert( ERRORES.RFC.message[LANGUAGE] );
              return false;
            }

            interface.setValue({ fieldId: 'custpage_rfc_cliente', value: rfc.toUpperCase(), ignoreFieldChange: true });

        }else if ( sublistFieldName == 'custpage_codigo_postal' ) {
            var codigoPostal = interface.getValue({ fieldId: 'custpage_codigo_postal' });
            if ( !validaCP(codigoPostal) ) {//Esta mal el RFC
              alert( ERRORES.CP.message[LANGUAGE] );
              return false;
            }
        }
    }

    function validaRFC( rfc ) {
        if ( rfc.length != 12 && rfc.length != 13 ) {
            return false;
        }
        return regExpRFC.test( rfc );
    }

    function validaCP( codigoPostal ) {
        return regExpCP.test( codigoPostal );
    }

    return {
        pageInit            : pageInit,
        getSalesOrderNumber : getSalesOrderNumber,
        backToMain          : backToMain,
        fieldChanged        : fieldChanged,
        saveRecord          : saveRecord
    }
});


