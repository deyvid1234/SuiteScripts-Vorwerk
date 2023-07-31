/**
 * @NApiVersion     2.0
 * @NScriptType     Suitelet
 * @ScriptName      VOR | FS | Customer Interface
 * @NModuleScope    Public
 * @Company         Netsoft
 * @Author          Oscar Ortega
 * @Description     Suitelet in charge of generating a user interface related to electronic invoicing and the generation of a "NAME" record for the stamp before the SAT.
 * @Date            01/12/2021
 * ScriptFile:      NSO_vor_fs_customerInterface.js
 * Dependencies:    'N/runtime', 'N/email', 'N/config'
 * idScript:        customscript_vor_fs_customerinterface
 * idDeploy:        customdeploy_vor_fs_customerinterface
 * Modified:		Miguel Rodríguez - 28/02/2022
 */

define(['N/runtime', 'N/search', 'N/ui/serverWidget', 'N/file', 'N/ui/message', 'N/error', 'N/record', 'N/redirect', 'N/url', 'N/https', 'N/encode', 'N/config', 'N/xml', 'N/format'], 
function( runtime, search, ui, file, message, error, record, redirect, url, https, encode, config, xml, format ) {

    var handler    = {};

    /*---Obtención de datos de la ejecución en tiempo real---*/
    const CLIENT   = runtime.getCurrentUser();
    const LANGUAGE = "es"

    /*---Mensajes y texto para la Interfaz---*/

    const STATES   = [{"value":"AGS","text":"Aguascalientes"},{"value":"BCN","text":"Baja California Norte"},{"value":"BCS","text":"Baja California Sur"},{"value":"CAM","text":"Campeche"},{"value":"CHIS","text":"Chiapas"},{"value":"CHIH","text":"Chihuahua"},{"value":"COAH","text":"Coahuila"},{"value":"COL","text":"Colima"},{"value":"DF","text":"Distrito Federal (obsoleto)"},{"value":"DGO","text":"Durango"},{"value":"GTO","text":"Guanajuato"},{"value":"GRO","text":"Guerrero"},{"value":"HGO","text":"Hidalgo"},{"value":"JAL","text":"Jalisco"},{"value":"CDMX","text":"CDMX"},{"value":"MICH","text":"Michoacán"},{"value":"MOR","text":"Morelos"},{"value":"MX","text":"México"},{"value":"NAY","text":"Nayarit"},{"value":"NL","text":"Nuevo León"},{"value":"OAX","text":"Oaxaca"},{"value":"PUE","text":"Puebla"},{"value":"QRO","text":"Querétaro"},{"value":"QROO","text":"Quintana Roo"},{"value":"SLP","text":"San Luis Potosí"},{"value":"SIN","text":"Sinaloa"},{"value":"SON","text":"Sonora"},{"value":"TAB","text":"Tabasco"},{"value":"TAMPS","text":"Tamaulipas"},{"value":"TLAX","text":"Tlaxcala"},{"value":"VER","text":"Veracruz"},{"value":"YUC","text":"Yucatán"},{"value":"ZAC","text":"Zacatecas"}];
    const HELPS    = {
        RFC: {
            es: 'AGREGAR SU RFC.',
            en: 'ADD YOUR RFC.'
        },
        RSP: {
            es: 'AGREGAR SU RAZÓN SOCIAL. DEJE ESTE CAMPO EN BLANCO PARA TOMAR LA RÁZON SOCIAL REGISTRADA EN EL SISTEMA.',
            en: 'ADD YOUR SOCIAL REASON. LEFT THIS FIELD BLANK TO USE THE SOCIAL REASON REGISTERED.'
        },
        RS: {
            es: 'RAZÓN SOCIAL REGISTRADA EN EL SISTEMA.',
            en: 'SOCIAL REASON REGISTERED.'
        },
        DIRECCION: {
            es: 'AGREGAR SU DIRECCION.',
            en: 'ADD YOUR ADDRESS.'
        },
        ESTADO: {
            es: 'AGREGAR SU ESTADO.',
            en: 'ADD YOUR STATE.'
        },
        MUNICIPIO: {
            es: 'AGREGAR SU MUNICIPIO.',
            en: 'ADD YOUR TOWN.'
        },
        COLONIA: {
            es: 'AGREGAR SU COLONIA.',
            en: 'ADD YOUR SUBURB.'
        },
        CP: {
            es: 'AGREGAR SU CÓDIGO POSTAL.',
            en: 'ADD YOUR ZIP CODE.'
        },
        EMAIL: {
            es: 'AGREGAR SU CORREO ELECTRÓNICO.',
            en: 'ADD YOUR EMAIL.'
        },
        TICKET: {
            es: 'AGREGAR SU RECIBO DE COBRO.',
            en: 'ADD YOUR TICKET NUMBER.'
        },
        MONTO: {
            es: 'AGREGAR EL MONTO DE LA FACTURA.',
            en: 'ADD THE INVOICE AMOUNT.'
        },
        CFDI: {
            es: 'SELECCIONA EL USO DEL CFDI.',
            en: 'SELECT AN OPTION.'
        },
        FORMAPAGO: {
            es: 'SELECCIONA LA FORMA DE PAGO.',
            en: 'SELECT AN OPTION.'
        }
    
    };
    const LABELS   = {
        RFC: {
            es: 'RFC',
            en: 'RFC'
        },
        RSP: {
            es: 'RAZÓN SOCIAL (PERSONALIZADO)',
            en: 'CUSTOMER NAME (CUSTOM)'
        },
        RS: {
            es: 'RAZÓN SOCIAL',
            en: 'CUSTOMER NAME'
        },
        DIRECCION: {
            es: 'CALLE Y NÚMERO',
            en: 'STREET'
        },
        ESTADO: {
            es: 'ESTADO.',
            en: 'STATE'
        },
        MUNICIPIO: {
            es: 'MUNICIPIO.',
            en: 'TOWN'
        },
        COLONIA: {
            es: 'COLONIA.',
            en: 'SUBURB'
        },
        CP: {
            es: 'CÓDIGO POSTAL.',
            en: 'ZIP CODE'
        },
        EMAIL: {
            es: 'CORREO ELECTRÓNICO',
            en: 'EMAIL'
        },
        TICKET: {
            es: 'RECIBO DE COBRO',
            en: 'TICKET NUMBER'
        },
        MONTO: {
            es: 'MONTO DE LA FACTURA',
            en: 'AMOUNT'
        },
        CFDI: {
            es: 'USO DEL CFDI',
            en: 'CFDI USE'
        },
        FORMAPAGO: {
            es: 'FORMA DE PAGO',
            en: 'PAYMENT FORM'
        },
        SALESORDER: {
            es: 'Número de Orden de Venta',
            en: 'Sales Order Number'
        },
        SEARCH : {
            es: 'Buscar',
            en: 'Search'
        },
        SEARCHINVOICE : {
            es: 'Busqueda de Factura',
            en: 'Invoice Search'
        },
        TABLE_TITLE : {
            es: "Facturas",
            en: "Invoices"
        },
        BACK : {
            es: "Regresar",
            en: "Back"
        },
        DATA_CLIENT : {
            es: "Datos del cliente",
            en: "Customer Data"
        },
        INVOICE_DATA : {
            es: "Datos para facturar",
            en: "Data to bill"
        },
        CFDI_SECTION : {
            es: "Datos CFDI",
            en: "CFDI Data"
        },
        INVOICE: {
            es: "Número de Factura",
            en: "Invoice Number"
        },
        UUID: {
            es: "Folio Fiscal UUID",
            en: "UUID Number"
        },
        FOLIO: {
            es: "Folio SAT",
            en: "SAT Folio"
        },
        PDF: {
            es: "Referencia PDF",
            en: "PDF Reference"
        },
        XML: {
            es: "Archivo XML",
            en: "XML File"
        },
        MENSAJE: {
            es: "Mensaje",
            en: "Message"

        },
        METODOPAGO: {
            es: 'MÉTODO DE PAGO',
            en: 'PAYMENT METHOD'
        },
        AVISO : {
            es: 'Aviso',
            en: 'Advice'
        }
    };
    const MESSAGES = {
        INFORMATION : {
            en: "Enter the sales order numbers, without letters.",
            es: "Ingresa los números de su orden de venta, sin letras."
        },
        INFORMATION_TITLE : {
            en : "INFORMATION",
            es : "INFORMACIÓN"
        },
        NO_SALESORDER : {
            en: "There is not a sales order with this number.",
            es: "No se encuentra orden de venta asociada a ese número."
        },
        NO_INVOICE : {
            en: "There is not an invoice for this sales order or  your client number.",
            es: "No se encuentra una factura asociada a esta orden de venta o a su número de cliente."
        },
        ALREADY_CFDI : {
            en: "This invoice already has an CFDI of the SAT.",
            es: "Esta factura ya posee un CFDI ante el SAT."
        },
        INVOICE_FOUND : {
            en: "Invoices found.",
            es: "Facturas encontrada."
        },
        CFDI_CANCELED : {
            en: "This UUID was cancelled.",
            es: "Este folio fiscal UUID fue cancelado."
        },
        CFDI_SUCCESSFULLY : {
            en: "The CFDI was generated successfully.",
            es: "El timbrado de la factura fue exitoso."
        },
        TITLE : {
            en: "NSO | Electroning Invoicing",
            es: "NSO | Facturación Electrónica"
        },
        SET_ERROR : {
            en: "Error with the main fields",
            es: "Error con los campos principales"
        }
    }
    const SUBLIST  = {
        RADIO : {
            en: "Generate CFDI",
            es: "Timbrar"
        },
        TRANID : {
            en: "Invoice number",
            es: "Número de factura"
        },
        TRANID_SO : {
            en: "Sales Order",
            es: "Orden de venta"
        },
        TRANDATE : {
            en: "Invoice date",
            es: "Fecha de facura"
        },
        LOCATION : {
            en: "Location",
            es: "Ubicación"
        },
        CURRENCY : {
            en: "Currency",
            es: "Moneda"
        },
        TOTAL : {
            en: "Total",
            es: "Total"
        },
        CUSTOMER : {
            en: "Customer",
            es: "Cliente"
        }
    }

    /*---Función Principal---*/
    handler.onRequest = function( context ) {

        var interfaz         = null;
        var operation        = context.request.parameters.operation     || '';
        var idSalesOrder     = context.request.parameters.idSalesOrder  || '';

        try {

            /*---Llamada HTTP-GET---*/
            if( context.request.method === 'GET' ) { 

                if( operation == 'SEARCH' ) {

                    var wmxSalesOrder = "WMX"+idSalesOrder;
                    var nsSalesOrder  = "NS"+idSalesOrder;

                    var salesorderSearchObj = search.create({
                                                type   : search.Type.SALES_ORDER,
                                                filters:
                                                    [
                                                        [["numbertext", "is", wmxSalesOrder], 
                                                        "OR",
                                                        ["numbertext", "is", nsSalesOrder]],
                                                        "AND",
                                                        ["mainline", "is", "T"]
                                                    ]
                                            }).run().getRange({ start: 0, end: 1000 });

                    if( salesorderSearchObj.length == 0 ) {

                        interfaz = crearFormularioError( interfaz, MESSAGES.NO_SALESORDER[LANGUAGE] )
                        interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                        context.response.writePage( interfaz );

                    } else {

                        log.debug("salesorderSearchObj", salesorderSearchObj)

                        var filterCreated = ["createdfrom", "anyof"]

                        for( var i = 0; i < salesorderSearchObj.length; i++ ) {
                            
                                filterCreated.push(salesorderSearchObj[i].id)
                        }

                        log.debug("filterCreated", filterCreated)

                        var invoiceSearchObj = search.create({
                                                type   : search.Type.INVOICE,
                                                filters:
                                                    [
                                                        ["entity", "is", CLIENT.id], 
                                                        "AND", 
                                                        filterCreated, 
                                                        "AND", 
                                                        ["mainline", "is", "T"]
                                                    ],
                                                columns: 
                                                    [
                                                        { name : "tranid"      },
                                                        { name : "trandate"    },
                                                        { name : "entity"      },
                                                        { name : "currency"    },
                                                        { name : "total"       },
                                                        { name : "location"    },
                                                        { name : "createdfrom" }  
                                                    ]
                                            }).run().getRange({ start: 0, end: 1000 });

                                            log.debug("invoiceSearchObj", invoiceSearchObj)

                        if( invoiceSearchObj.length == 0 ) {

                            interfaz = crearFormularioError( interfaz, MESSAGES.NO_INVOICE[LANGUAGE] )
                            interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                            context.response.writePage( interfaz );

                        } else {

                            var invoiceFields   = search.lookupFields({ 
                                                    type    : search.Type.INVOICE, 
                                                    id      : invoiceSearchObj[0].id, 
                                                    columns : ['location', 'custbody_cfdi_timbrada', 'custbody_cancelcfdi'] 
                                                });

                            if( invoiceFields.custbody_cfdi_timbrada == true && invoiceFields.custbody_cancelcfdi == false ) {

                                interfaz = crearFormularioURL( interfaz, invoiceSearchObj[0].id, idSalesOrder );
                                interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                                context.response.writePage( interfaz );
            
                            } else if( invoiceFields.custbody_cfdi_timbrada == true && invoiceFields.custbody_cancelcfdi == true ) {
            
                                interfaz = crearFormularioURLCancelado( interfaz, invoiceSearchObj[0].id, idSalesOrder );
                                interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                                context.response.writePage( interfaz );
            
                            } else {

                                interfaz = crearFormulario( interfaz, MESSAGES.INVOICE_FOUND[LANGUAGE], idSalesOrder, invoiceSearchObj)
                                interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                                context.response.writePage( interfaz );

                            } 
                        }
                    }

                } else if( operation == 'READY' ) {

                    var idInvoice = context.request.parameters.invoice

                    try {

                        var idCustomer = search.lookupFields({
                            type: search.Type.INVOICE,
                            id: idInvoice,
                            columns: ['entity']
                        });
                        
                    } catch (ev) {

                        interfaz = crearFormularioBusqueda( interfaz );
                        interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';

                        context.response.writePage( interfaz );
                        
                    }

                    log.debug("idCustomer", idCustomer)

                    if( idCustomer.entity[0].value == CLIENT.id ) {

                        interfaz = crearFormularioTimbrado( interfaz, MESSAGES.ALREADY_CFDI[LANGUAGE], idInvoice );
                        interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                        context.response.writePage( interfaz );

                    } else {

                        interfaz = crearFormularioBusqueda( interfaz );
                        interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';

                        context.response.writePage( interfaz );
                    }

                } else if( operation == 'READYCAN' ) {

                    var idCustomer = search.lookupFields({
                        type: search.Type.INVOICE,
                        id: idInvoice,
                        columns: ['entity']
                    });

                    if( idCustomer.entity[0].value == CLIENT.id ) {

                        interfaz = crearFormularioTimbradoCancelado( interfaz, MESSAGES.CFDI_CANCELED[LANGUAGE], idInvoice );
                        interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                        context.response.writePage( interfaz );

                    } else {
                        interfaz = crearFormularioBusqueda( interfaz );
                        interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                        context.response.writePage( interfaz );
                    }                     

                } else {

                    interfaz = crearFormularioBusqueda( interfaz );
                    interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';

                    context.response.writePage( interfaz );
                }
            }

            /*---Llamada HTTP-POST---*/
            if( context.request.method === 'POST' ) {
               var invoiceNumber = getInvoiceNumber( context );

               var invoiceFields = search.lookupFields({ 
                                        type    : search.Type.INVOICE, 
                                        id      : invoiceNumber, 
                                        columns : ['location', 'custbody_cfdi_timbrada', 'custbody_cancelcfdi'] 
                                });

                if( invoiceFields.custbody_cfdi_timbrada == true && invoiceFields.custbody_cancelcfdi == false ) {

                    interfaz = crearFormularioTimbrado( interfaz, MESSAGES.ALREADY_CFDI[LANGUAGE], invoiceNumber );
                    interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                    context.response.writePage( interfaz );

                } else if( invoiceFields.custbody_cfdi_timbrada == true && invoiceFields.custbody_cancelcfdi == true ) {

                    interfaz = crearFormularioTimbradoCancelado( interfaz, MESSAGES.CFDI_CANCELED[LANGUAGE], invoiceNumber );
                    interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                    context.response.writePage( interfaz );

                } else {

                    var interface = context.request;   
                    log.debug("interface", interface)
                    log.debug("interface", interface.parameters.custpage_rfc_cliente)
                    
                    var isValid = record.submitFields({
                        type   : record.Type.INVOICE,
                        id     : invoiceNumber,
                        values : {
                            custbody_rfc : interface.parameters.custpage_rfc_cliente,
                            billaddr1    : interface.parameters.custpage_direccion,
                            billstate    : interface.parameters.custpage_estado,
                            billcity     : interface.parameters.custpage_municipio,
                            billaddr2    : interface.parameters.custpage_colonia,
                            billzip      : interface.parameters.custpage_codigo_postal,
                            custbody_uso_cfdi         : interface.parameters.custpage_uso_cfdi,
                            custbody_cfdi_metpago_sat : interface.parameters.custpage_metodo_pago, 
                            custbody_cfdi_formadepago : interface.parameters.custpage_forma_pago,
                            custbody_nso_vw_razon_social_portal : interface.parameters.custpage_razon_social_pers,
                        },
                        options: {
                            enableSourcing          : false,
                            ignoreMandatoryFields   : true
                        }
                    });  

                    if( isValid < 0 ) {

                        interfaz = crearFormularioError( interfaz, MESSAGES.SET_ERROR[LANGUAGE] )
                        interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                        context.response.writePage( interfaz );


                    }

                    var dataCFDI = generateCFDI( invoiceNumber );

                    interfaz = crearFormularioCFDIGenerado( interfaz, dataCFDI, invoiceNumber );
                    interfaz.clientScriptModulePath = './NSO_vor_cs_screenScript.js';
                    context.response.writePage( interfaz );
                }
            }

        } catch (e) {
            log.error( 'NSO_ERROR_SUITELET', JSON.stringify(e) );
            context.response.write({ output: JSON.stringify(e.message) });
        }
    };

    /*---Funciones extra---*/

    /*---Función para mostrar el URL indicado por cliente por si ya se encuentra timbrado---*/

    /*---Función para mostrar formulario con un CFDI recien timbrado---*/
    function crearFormularioCFDIGenerado ( interfaz, dataCFDI, invoiceNumber ) {

        log.debug("dataCFDI", dataCFDI);

        var dataInvoice   = getDataCFDI( invoiceNumber );

        interfaz         = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });

        var fieldgroup   = interfaz.addFieldGroup({ id : 'group_data_invoice', label : LABELS.SEARCHINVOICE[LANGUAGE] });
        var fieldgroup2  = interfaz.addFieldGroup({ id : 'group_data_cfdi',    label : LABELS.CFDI_SECTION[LANGUAGE]  });

        var fieldInvoice    = interfaz.addField({ 
                                id        : 'custpage_sales_order', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.INVOICE[LANGUAGE], 
                                container : 'group_data_invoice' 
                            });

        var fieldMessage    = interfaz.addField({ 
                                id        : 'custpage_message', 
                                type      : ui.FieldType.TEXTAREA, 
                                label     : LABELS.MENSAJE[LANGUAGE], 
                                container : 'group_data_invoice' 
                            }); 

        fieldMessage.defaultValue = dataCFDI.message;
        fieldInvoice.defaultValue = dataInvoice.getValue({ name: "tranid" });

        fieldMessage.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });
        fieldInvoice.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });

        if( dataCFDI.flag ){

            var fieldUUID   = interfaz.addField({ 
                                id        : 'custpage_uuid', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.UUID[LANGUAGE], 
                                container : 'group_data_cfdi' 
                            }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
            
            var fieldFolio  = interfaz.addField({ 
                                id        : 'custpage_foliosat', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.FOLIO[LANGUAGE], 
                                container : 'group_data_cfdi' 
                            }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

            var fieldPDF    = interfaz.addField({ 
                                id        : 'custpage_refpdf', 
                                type      : ui.FieldType.URL, 
                                label     : LABELS.PDF[LANGUAGE], 
                                container : 'group_data_cfdi'
                            }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

            var fieldXML    = interfaz.addField({ 
                                id        : 'custpage_xml_file', 
                                type      : ui.FieldType.URL, 
                                label     : LABELS.XML[LANGUAGE], 
                                container : 'group_data_cfdi'
                            }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });


            fieldUUID.defaultValue  = dataCFDI.uuid;
            fieldFolio.defaultValue = dataCFDI.foliosat;

            var filePDF = file.load({ id:  dataCFDI.pdf });
            fieldPDF.defaultValue = filePDF.url+'&_xd=T';
            fieldPDF.linkText     = 'Descargar PDF';

            var fileXML = file.load({ id: dataCFDI.xml });
            fieldXML.defaultValue = fileXML.url+'&_xd=T';
            fieldXML.linkText     = 'Descargar XML';


        }         

        var backButton      = interfaz.addButton({ 
            id           : 'custpage_back',  
            label        : LABELS.BACK[LANGUAGE],    
            functionName : 'backToMain' 
        });

        return interfaz;
    }

    function getSetUpRecord(subsidiary, location){
        var filters = [];

        if( runtime.isFeatureInEffect({feature: 'subsidiaries'})  ){
            if(subsidiary && location){
                filters = [ ['custrecord_cfdi_subsidiary', 'anyof', subsidiary], "AND", 
                            ['custrecord_cfdi_location', 'anyof', location] 
                        ];

            }else if (subsidiary && !location){
                filters = [ ['custrecord_cfdi_subsidiary', 'anyof', subsidiary] ];

            }else if (!subsidiary && location){
                filters = [ ['custrecord_cfdi_location', 'anyof', location] ];

            }else{
                return null;
            }
        } else {
            if (location){
                filters = [ ['custrecord_cfdi_location', 'anyof', location] ];
            }else{
                return null;
            }
        }
        
        var result = search.create({ type: 'customrecord_cfdisetup', filters: filters }).run().getRange({ start: 0, end: 1 })[0];

        return result ? result.id : null;
    }

    /*---Función para timbrar la factura seleccionada---*/
    function generateCFDI( invoiceNumber ) {

        var dataCFDI = {}

        var invoiceData = getDataInvoice( invoiceNumber );

        var setupRecordId = getSetUpRecord( 1, invoiceData.getValue({ name: 'location' }) );

        log.debug("setupRecordId", setupRecordId)

        var setupcfdi     = record.load({ type: 'customrecord_cfdisetup',  id: setupRecordId  }); // 19
        var setupcfdiTest = record.load({ type: 'customrecord_setup_cfdi', id: 1              }); //tEST
        var testing       = setupcfdiTest.getValue({ fieldId: 'custrecord_cfdi_testing'       });
        
        var urlCFDI = url.resolveScript({ scriptId: 'customscript_cfdi', deploymentId: 'customdeploy_cfdi', returnExternalUrl: true,
            params: { invoiceid: invoiceNumber, idsetup: setupRecordId, type: 'invoice' }
        });

        var cfdiSuiteletResponse = https.post({ url: urlCFDI });

        if( cfdiSuiteletResponse.code == 200 ){
            var nodo_location = cfdiSuiteletResponse.body.indexOf( '</fx:FactDocMX>' );
            var customer_xml  = nodo_location != -1 ? cfdiSuiteletResponse.body.slice(0, nodo_location + 15) : cfdiSuiteletResponse.body;
        }

        var xmlB64 = encode.convert({ string: customer_xml, inputEncoding: encode.Encoding.UTF_8, outputEncoding: encode.Encoding.BASE_64 });

        var headers = { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://www.fact.com.mx/schema/ws/RequestTransaction','User-Agent-x': 'SuiteScript-Call' };

        if ( testing ) {

            log.debug("TEST CFDI", testing)

            var urltimbrado = 'https://www.mysuitetest.com/mx.com.fact.wsfront/factwsfront.asmx';

            var requestor   = setupcfdiTest.getValue({ fieldId: 'custrecord_cfdi_testrequestor'    });
            var entity      = setupcfdiTest.getValue({ fieldId: 'custrecord_cfdi_entity_testing'   });
            var user        = setupcfdiTest.getValue({ fieldId: 'custrecord_cfdi_user_testing'     });
            var userName    = setupcfdiTest.getValue({ fieldId: 'custrecord_cfdi_username_testing' });
        }

        else {
            var urltimbrado = 'https://www.mysuitecfdi.com/mx.com.fact.wsfront/factwsfront.asmx';

            var requestor   = setupcfdi.getValue({  fieldId: 'custrecord_cfdi_requestor'           });
            var entity      = setupcfdi.getValue({  fieldId: 'custrecord_cfdi_entity'              });
            var user        = setupcfdi.getValue({  fieldId: 'custrecord_cfdi_user'                });
            var userName    = setupcfdi.getValue({  fieldId: 'custrecord_cfdi_username'            });
        }

        var noAddendum  = setupcfdiTest.getValue({ fieldId: 'custrecord_cfdi_xml_sin_addenda' });
        var data2 	    = noAddendum ? 'COMPROBANTE PDF' : 'XML PDF';

        var sXml = '';
            sXml += '<?xml version=\"1.0\" encoding=\"utf-8\"?> ';
            sXml += '<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> ';
            sXml += '<soap:Body> ';
            sXml += '<RequestTransaction xmlns=\"http://www.fact.com.mx/schema/ws\"> ';
            sXml += '<Requestor>' + requestor + '</Requestor> ';
            sXml += '<Transaction>' + 'CONVERT_NATIVE_XML' + '</Transaction> ';
            sXml += '<Country>MX</Country> ';
            sXml += '<Entity>' + entity + '</Entity> ';
            sXml += '<User>' + user + '</User> ';
            sXml += '<UserName>' + userName + '</UserName> ';
            sXml += '<Data1>' + xmlB64 + '</Data1> ';
            sXml += '<Data2>' + data2 + '</Data2> ';
            sXml += '<Data3>' + '' + '</Data3> ';
            sXml += '</RequestTransaction> ';
            sXml += '</soap:Body> ';
            sXml += '</soap:Envelope> ';

        try {
            
            log.debug('body', sXml);
            var objResponse = https.post({ url: urltimbrado, body: sXml, headers: headers });
            log.debug('objResponse', JSON.stringify(objResponse));

            responseCode = parseInt( objResponse.code );
            log.debug('responseCode', responseCode);

            srtResponse = objResponse.body;
            log.debug('srtResponse', srtResponse);

            var xml_response = xml.Parser.fromString({ text : srtResponse });
            log.debug('xml_response', xml_response);

            var Result = xml_response.getElementsByTagName({ tagName: 'Result' })[0].textContent;
            log.debug('Result', Result );

            if( Result == 'true' ){
                
                var xml_receivedB64  = xml_response.getElementsByTagName({ tagName: 'ResponseData1' })[0].textContent;
                var pdf_receivedB64  = xml_response.getElementsByTagName({ tagName: 'ResponseData3' })[0].textContent;

                var _fe_xml_sat_name = xml_response.getElementsByTagName({ tagName: 'SuggestedFileName2' })[0].textContent;
                log.debug('_fe_xml_sat_name', _fe_xml_sat_name );

                var xml_received = encode.convert({ string: xml_receivedB64, inputEncoding: encode.Encoding.BASE_64, outputEncoding: encode.Encoding.UTF_8 });

                var destinationFolder   = search.create({
                                            type   : 'folder',
                                            filters: [ ['name', 'is', 'Facturas'] ],
                                            columns: ['internalid']
                                        }).run().getRange({ start: 0, end: 1 })[0].id;

                var xml_file            = file.create({
                                            name: 'timbrado_Pagos_' + _fe_xml_sat_name + '.xml',
                                            fileType: file.Type.XMLDOC, folder: destinationFolder,
                                            contents: xml_received, encoding: file.Encoding.UTF8,
                                            isOnline: true
                                        }).save();

                log.debug('xml_file', xml_file);

                var pdf_file            = file.create({
                                            name: 'timbrado_Pagos_' + _fe_xml_sat_name + '.pdf',
                                            fileType: file.Type.PDF, folder: destinationFolder,
                                            contents: pdf_receivedB64, isOnline: true
                                        }).save();

                log.debug('pdf_file', pdf_file);

                var uuid  = extractUUID     ( xml_received );
                var folio = extractSATFolio ( xml_received );

                var isValid = record.submitFields({
                    type   : record.Type.INVOICE,
                    id     : invoiceNumber,
                    values : {
                        custbody_uuid           : uuid,
                        custbody_foliosat       : folio,
                        custbody_refpdf         : pdf_file,
                        custbody_xml_file       : xml_file,
                        custbody_cfdi_timbrada  : true,
                        custbody_cfdi_pdf       : pdf_receivedB64,
                        custbody_cfdixml        : xml_received
                    },
                    options: {
                        enableSourcing          : false,
                        ignoreMandatoryFields   : true
                    }
                });    

                if( noAddendum ) {
                    var noAddendumPL = plugin.loadImplementation({ type: 'customscript_cfdi_mail_noaddendum_plt' });
                    noAddendumPL.sendCustomMail(setupcfdiTest, [xml_file, pdf_file], null, null, paymentData.customerId, _fe_xml_sat_name);
                }
                
                dataCFDI.flag     = true;
                dataCFDI.uuid     = uuid;
                dataCFDI.foliosat = folio;
                dataCFDI.pdf      = pdf_file;
                dataCFDI.xml      = xml_file;
                dataCFDI.message  = MESSAGES.CFDI_SUCCESSFULLY[LANGUAGE];

            } else {

                var LastResult = xml_response.getElementsByTagName({tagName: 'LastResult'})[0].textContent;
                log.debug('LastResult', LastResult);

                var Code = xml_response.getElementsByTagName({tagName: 'Code'})[0].textContent;
                log.debug('Code', Code);

                var Description = xml_response.getElementsByTagName({tagName: 'Description'})[0].textContent;
                log.debug('Description', Description);

                var Hint = xml_response.getElementsByTagName({tagName: 'Hint'})[0].textContent;
                log.debug('Hint', Hint);

                var Data = xml_response.getElementsByTagName({tagName: 'Data'})[0].textContent;
                log.debug('Data', Data);

                var comment = LastResult + ' - ' + Data;
                log.debug('comment', comment);

                dataCFDI.flag     = false;
                dataCFDI.uuid     = null;
                dataCFDI.foliosat = null;
                dataCFDI.pdf      = null;
                dataCFDI.xml      = null;
                dataCFDI.message  = comment;

            }

            return dataCFDI;
            
        } catch( ex ){

            log.debug( 'Error en Obtencion de datos de Respuesta', ex.stack );
            comment = 'RES_ERROR - Hubo un error en obtención de datos de respuesta:\n' + ex.message;
            
        }

    }

    /*---Función para mostrar formulario con un CFDI cancelado---*/
    function crearFormularioTimbradoCancelado ( interfaz, message, invoiceNumber ) {

        var dataCFDI     = getDataCFDI( invoiceNumber );

        interfaz         = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });

        var fieldgroup   = interfaz.addFieldGroup({ id : 'group_data_invoice', label : LABELS.SEARCHINVOICE[LANGUAGE] });
        var fieldgroup2  = interfaz.addFieldGroup({ id : 'group_data_cfdi',    label : LABELS.CFDI_SECTION[LANGUAGE]  });

        var fieldInvoice    = interfaz.addField({ 
                                id        : 'custpage_sales_order', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.INVOICE[LANGUAGE], 
                                container : 'group_data_invoice' 
                            });

        var fieldMessage    = interfaz.addField({ 
                                id        : 'custpage_message', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.MENSAJE[LANGUAGE], 
                                container : 'group_data_invoice' 
                            }); 

        fieldMessage.defaultValue = message;
        fieldInvoice.defaultValue = dataCFDI.getValue({ name: "tranid" });

        fieldMessage.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });
        fieldInvoice.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });

        var fieldUUID   = interfaz.addField({ 
                            id        : 'custpage_uuid', 
                            type      : ui.FieldType.TEXT, 
                            label     : LABELS.UUID[LANGUAGE], 
                            container : 'group_data_cfdi' 
                        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
                        
        var fieldFolio  = interfaz.addField({ 
                            id        : 'custpage_foliosat', 
                            type      : ui.FieldType.TEXT, 
                            label     : LABELS.FOLIO[LANGUAGE], 
                            container : 'group_data_cfdi' 
                        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });


        fieldUUID.defaultValue  = dataCFDI.getValue({ name: 'custbody_uuid'     });
        fieldFolio.defaultValue = dataCFDI.getValue({ name: 'custbody_foliosat' });


        var backButton      = interfaz.addButton({ 
            id           : 'custpage_back',  
            label        : LABELS.BACK[LANGUAGE],    
            functionName : 'backToMain' 
        });

        return interfaz;
    }

    /*---Función para obtener los datos de la factura como el tranid y location---*/
    function getDataInvoice( invoiceNumber ) {
        
        var invoiceSearchObj = search.create({
                                    type   : search.Type.INVOICE,
                                    filters:
                                        [
                                            ["internalid", "is", invoiceNumber], 
                                            "AND", 
                                            ["mainline", "is", "T"]
                                        ],
                                    columns: 
                                        [
                                            { name : "tranid"    },
                                            { name : "location"  }

                                        ]
                                }).run().getRange({ start: 0, end: 1 })[0];

        log.debug("invoiceSearchObj", invoiceSearchObj)

        return invoiceSearchObj;

    }

    /*---Función para obtener datos CFDI de una factura---*/
    function getDataCFDI( invoiceNumber ) {
        
        var invoiceSearchObj = search.create({
                                    type   : search.Type.INVOICE,
                                    filters:
                                        [
                                            ["internalid", "is", invoiceNumber], 
                                            "AND", 
                                            ["mainline", "is", "T"]
                                        ],
                                    columns: 
                                        [
                                            { name : "tranid"             },
                                            { name : "custbody_uuid"      },
                                            { name : "custbody_foliosat"  },
                                            { name : "custbody_refpdf"    },
                                            { name : "custbody_xml_file"  },
                                            { name : 'custbody_cancelcfdi' }

                                        ]
                                }).run().getRange({ start: 0, end: 1 })[0];

        log.debug("invoiceSearchObj", invoiceSearchObj)

        return invoiceSearchObj;

    }

    function extractUUID(xmlContent){
		var xmlObj = xml.Parser.fromString({text: xmlContent});
		var uuid   = xmlObj.getElementsByTagName({tagName: 'tfd:TimbreFiscalDigital'})[0].getAttribute({ name: 'UUID' });

		return uuid;
    }

    function extractSATFolio(xmlContent){
		var xmlObj = xml.Parser.fromString({text: xmlContent});
		var folio   = xmlObj.getElementsByTagName({tagName: 'cfdi:Comprobante'})[0].getAttribute({ name: 'Folio' });

		return folio;        
    }

    /*---Funciones para mostrar formulario con una factura ya timbrada---*/
    function crearFormularioTimbrado ( interfaz, message, invoiceNumber ) {

        var dataCFDI     = getDataCFDI( invoiceNumber );

        interfaz         = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });

        var fieldgroup   = interfaz.addFieldGroup({ id : 'group_data_invoice', label : LABELS.SEARCHINVOICE[LANGUAGE] });
        var fieldgroup2  = interfaz.addFieldGroup({ id : 'group_data_cfdi',    label : LABELS.CFDI_SECTION[LANGUAGE]  });

        var fieldInvoice    = interfaz.addField({ 
                                id        : 'custpage_sales_order', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.INVOICE[LANGUAGE], 
                                container : 'group_data_invoice' 
                            });

        var fieldMessage    = interfaz.addField({ 
                                id        : 'custpage_message', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.MENSAJE[LANGUAGE], 
                                container : 'group_data_invoice' 
                            }); 

        fieldMessage.defaultValue = message;
        fieldInvoice.defaultValue = dataCFDI.getValue({ name: "tranid" });

        fieldMessage.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });
        fieldInvoice.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });

        var fieldUUID   = interfaz.addField({ 
                            id        : 'custpage_uuid', 
                            type      : ui.FieldType.TEXT, 
                            label     : LABELS.UUID[LANGUAGE], 
                            container : 'group_data_cfdi' 
                        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
                        
        var fieldFolio  = interfaz.addField({ 
                            id        : 'custpage_foliosat', 
                            type      : ui.FieldType.TEXT, 
                            label     : LABELS.FOLIO[LANGUAGE], 
                            container : 'group_data_cfdi' 
                        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        var fieldPDF    = interfaz.addField({ 
                            id        : 'custpage_refpdf', 
                            type      : ui.FieldType.URL, 
                            label     : LABELS.PDF[LANGUAGE], 
                            container : 'group_data_cfdi'
                        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        var fieldXML    = interfaz.addField({ 
                            id        : 'custpage_xml_file', 
                            type      : ui.FieldType.URL, 
                            label     : LABELS.XML[LANGUAGE], 
                            container : 'group_data_cfdi'
                        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        fieldUUID.defaultValue  = dataCFDI.getValue({ name: 'custbody_uuid'     });
        fieldFolio.defaultValue = dataCFDI.getValue({ name: 'custbody_foliosat' });

        if( dataCFDI.getValue({ name: 'custbody_refpdf' }) ) {
            
            var filePDF = file.load({ id: dataCFDI.getValue({ name: 'custbody_refpdf' }) });
            fieldPDF.defaultValue = filePDF.url+'&_xd=T';
            fieldPDF.linkText     = 'Descargar PDF';

        }
        
        if( dataCFDI.getValue({ name: 'custbody_xml_file' }) ) {

            var fileXML = file.load({ id: dataCFDI.getValue({ name: 'custbody_xml_file' }) });
            fieldXML.defaultValue = fileXML.url+'&_xd=T';
            fieldXML.linkText     = 'Descargar XML';
        }

        var backButton      = interfaz.addButton({ 
            id           : 'custpage_back',  
            label        : LABELS.BACK[LANGUAGE],    
            functionName : 'backToMain' 
        });

        return interfaz;
    }

    /*---Función para obtener que factura selecciono el ususario---*/
    function getInvoiceNumber ( context ) {

        var invoiceNumber;

        var interface = context.request;
        var lineCount = interface.getLineCount({ group: 'custpage_movements' });

        for( var i = 0; i < lineCount; i++ ) {

            var isSelected = interface.getSublistValue({ group: 'custpage_movements', name: 'custpage_radio', line: i });

            if( isSelected == 'T' ) {
                invoiceNumber = interface.getSublistValue({ group: 'custpage_movements', name: 'custpage_fact', line: i });

                return invoiceNumber;
            }
        }

    } 

    function crearFormularioBusqueda( interfaz ) {

        interfaz        = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });
        
        var fieldgroup2 = interfaz.addFieldGroup({
                            id      : 'group_data_facturacion', 
                            label   : LABELS.SEARCHINVOICE[LANGUAGE] 
                        });

        var fieldSaleOrder  = interfaz.addField({ 
                                id        : 'custpage_sales_order', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.SALESORDER[LANGUAGE], 
                                container : 'group_data_facturacion' 
                            });

        var searchButton    = interfaz.addButton({ 
                                id: 'custpage_search',  
                                label: LABELS.SEARCH[LANGUAGE],    
                                functionName: 'getSalesOrderNumber' 
                            });
                            
     
        interfaz.addPageInitMessage({ type: message.Type.INFORMATION, message: MESSAGES.INFORMATION[LANGUAGE] });

        return interfaz;

    }

    function crearFormularioError( interfaz, message ) {

        interfaz        = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });
        
        var fieldgroup2 = interfaz.addFieldGroup({
                            id      : 'group_data_facturacion', 
                            label   : LABELS.SEARCHINVOICE[LANGUAGE] 
                        });

        var fieldSaleOrder  = interfaz.addField({ 
                                id        : 'custpage_sales_order', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.SALESORDER[LANGUAGE], 
                                container : 'group_data_facturacion' 
                            });

        var fieldMessage    = interfaz.addField({ 
                                id        : 'custpage_message', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.MENSAJE[LANGUAGE], 
                                container : 'group_data_facturacion' 
                            });   

        var searchButton    = interfaz.addButton({ 
                                id           : 'custpage_search',  
                                label        : LABELS.SEARCH[LANGUAGE],    
                                functionName : 'getSalesOrderNumber' 
                            });

        fieldMessage.defaultValue = message;
        fieldMessage.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });

        return interfaz;

    }

    function crearFormularioURL( interfaz, invoiceId, idSalesOrder ) {

        interfaz        = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });
        
        var fieldgroup2 = interfaz.addFieldGroup({
                            id      : 'group_data_facturacion', 
                            label   : LABELS.SEARCHINVOICE[LANGUAGE] 
                        });
        var fieldgroup3 = interfaz.addFieldGroup({
                            id      : 'group_data_facturacion2',
                            label   : ' '
                        });

        var fieldSaleOrder  = interfaz.addField({ 
                                id        : 'custpage_sales_order', 
                                type      : ui.FieldType.TEXT, 
                                label     : LABELS.SALESORDER[LANGUAGE], 
                                container : 'group_data_facturacion' 
                            })

        fieldSaleOrder.defaultValue = idSalesOrder;

        var searchButton    = interfaz.addButton({ 
                                id           : 'custpage_search',  
                                label        : LABELS.SEARCH[LANGUAGE],    
                                functionName : 'getSalesOrderNumber' 
                            });    

        var textURL         = interfaz.addField({ 
                                id        : 'custpage_url', 
                                type      : ui.FieldType.INLINEHTML, 
                                label     : LABELS.AVISO[LANGUAGE],
                                container : 'group_data_facturacion2' 
                            });

        textURL.defaultValue = "<p style='font-size: 13px'>Este pedido ya fue facturado y timbrado, presiona <a href='/app/site/hosting/scriptlet.nl?script=1242&deploy=1&compid=3367613&operation=READY&invoice="+invoiceId+"' style='color: blue'>aquí</a> para ver tu Factura Electronica</p>";
        
        interfaz.addPageInitMessage({ type: message.Type.INFORMATION, message: MESSAGES.INFORMATION[LANGUAGE] });        

        return interfaz;

    }

    function crearFormularioURLCancelado( interfaz, invoiceId, idSalesOrder ) {

        interfaz        = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });
        
        var fieldgroup2 = interfaz.addFieldGroup({
                            id      : 'group_data_facturacion', 
                            label   : LABELS.SEARCHINVOICE[LANGUAGE] 
                        });

        var fieldSaleOrder  = interfaz.addField({ 
                            id        : 'custpage_sales_order', 
                            type      : ui.FieldType.TEXT, 
                            label     : LABELS.SALESORDER[LANGUAGE], 
                            container : 'group_data_facturacion' 
                        });

        fieldSaleOrder.defaultValue = idSalesOrder;

        var searchButton    = interfaz.addButton({ 
                                id           : 'custpage_search',  
                                label        : LABELS.SEARCH[LANGUAGE],    
                                functionName : 'getSalesOrderNumber' 
                            });

        var textURL         = interfaz.addField({ 
                                id        : 'custpage_url', 
                                type      : ui.FieldType.INLINEHTML, 
                                label     : LABELS.AVISO[LANGUAGE],
                                container : 'group_data_facturacion2' 
                            });

        textURL.defaultValue = "<p style='font-size: 13px'>Este pedido ya fue facturado pero su timbre fue CANCELADO ante el SAT, presiona <a href='/app/site/hosting/scriptlet.nl?script=1242&deploy=1&compid=3367613&operation=READY&invoice="+invoiceId+"' style='color: blue'>aquí</a> para ver con más detalle.</p>";

    
        interfaz.addPageInitMessage({ type: message.Type.INFORMATION, message: MESSAGES.INFORMATION[LANGUAGE] });

        

        return interfaz;

    }

    function crearFormulario( interfaz, message, idSalesOrder, invoiceSearchObj ) {

        var customerData = extraerData();

        interfaz         = ui.createForm({ title: MESSAGES.TITLE[LANGUAGE], hideNavBar: false });

        var fieldgroup3  = interfaz.addFieldGroup({ id : 'group_data_salesOrder',  label : LABELS.SEARCHINVOICE[LANGUAGE] });
        var fieldgroup   = interfaz.addFieldGroup({ id : 'group_data_cliente',     label : LABELS.DATA_CLIENT[LANGUAGE]   });
        var fieldgroup2  = interfaz.addFieldGroup({ id : 'group_data_facturacion', label : LABELS.INVOICE_DATA[LANGUAGE]  });
        

        var fieldSaleOrder  = interfaz.addField({ 
            id        : 'custpage_sales_order', 
            type      : ui.FieldType.TEXT, 
            label     : LABELS.SALESORDER[LANGUAGE], 
            container : 'group_data_salesOrder' 
        });

        var fieldMessage    = interfaz.addField({ 
            id        : 'custpage_message', 
            type      : ui.FieldType.TEXT, 
            label     : LABELS.MENSAJE[LANGUAGE], 
            container : 'group_data_salesOrder' 
        });  

        fieldMessage.defaultValue   = message;
        fieldSaleOrder.defaultValue = idSalesOrder;
        fieldMessage.updateDisplayType  ({   displayType : ui.FieldDisplayType.INLINE });
        fieldSaleOrder.updateDisplayType({   displayType : ui.FieldDisplayType.INLINE });

        /*---Datos para facturar---*/
        //var fieldTicket    = interfaz.addField({ id : 'custpage_num_ticket',    type : ui.FieldType.TEXT,       label : LABELS.TICKET[LANGUAGE],    container : 'group_data_facturacion'                                        });
        var fieldCFDI      = interfaz.addField({ id : 'custpage_uso_cfdi',      type : ui.FieldType.SELECT,     label : LABELS.CFDI[LANGUAGE],      container : 'group_data_facturacion', source : 'customlist_cfdi_uso',       });
        var fieldFormaPago = interfaz.addField({ id : 'custpage_forma_pago',    type : ui.FieldType.SELECT,     label : LABELS.FORMAPAGO[LANGUAGE], container : 'group_data_facturacion', source : 'customlist_cfdi_formapago'  });
        var fieldMetodoPago = interfaz.addField({ id : 'custpage_metodo_pago',    type : ui.FieldType.SELECT,     label : LABELS.METODOPAGO[LANGUAGE], container : 'group_data_facturacion', source : 'paymentmethod'  });


        /*---Datos del cliente---*/
        var fieldRFC             = interfaz.addField({ id : 'custpage_rfc_cliente',       type : ui.FieldType.TEXT,   label : 'RFC',                      container : 'group_data_cliente' });
        var fieldRazonSocialPers = interfaz.addField({ id : 'custpage_razon_social_pers', type : ui.FieldType.TEXT,   label : LABELS.RSP[LANGUAGE],       container : 'group_data_cliente' }).updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });
        var fieldRazonSocial     = interfaz.addField({ id : 'custpage_razon_social',      type : ui.FieldType.TEXT,   label : LABELS.RS[LANGUAGE],        container : 'group_data_cliente' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
        var fieldDireccion       = interfaz.addField({ id : 'custpage_direccion',         type : ui.FieldType.TEXT,   label : LABELS.DIRECCION[LANGUAGE], container : 'group_data_cliente' });
        var fieldEstado          = interfaz.addField({ id : 'custpage_estado',            type : ui.FieldType.SELECT, label : LABELS.ESTADO[LANGUAGE],    container : 'group_data_cliente', source: STATES });
        
        for( var i = 0; i < STATES.length; i++ ){

            fieldEstado.addSelectOption({ value : STATES[i].value, text : STATES[i].text });
        }

        var fieldMunicipio  = interfaz.addField({ id : 'custpage_municipio',     type : ui.FieldType.TEXT,  label : LABELS.MUNICIPIO[LANGUAGE], container : 'group_data_cliente' });
        var fieldColonia    = interfaz.addField({ id : 'custpage_colonia',       type : ui.FieldType.TEXT,  label : LABELS.COLONIA[LANGUAGE],   container : 'group_data_cliente' });
        var fieldCP         = interfaz.addField({ id : 'custpage_codigo_postal', type : ui.FieldType.TEXT,  label : LABELS.CP[LANGUAGE],        container : 'group_data_cliente' });
        var fieldEmail      = interfaz.addField({ id : 'custpage_email',         type : ui.FieldType.EMAIL, label : LABELS.EMAIL[LANGUAGE],     container : 'group_data_cliente' });

        /*---Sublista de facturas---*/
        var sublist         = interfaz.addSublist({
                                    id:     'custpage_movements',
                                    type:   ui.SublistType.LIST,
                                    label:  LABELS.TABLE_TITLE[LANGUAGE]
                            });

        sublist.addField({
            id: 'custpage_radio',
            type: ui.FieldType.RADIO,
            label: SUBLIST.RADIO[LANGUAGE],
        }).isMandatory         = true;;

        sublist.addField({
            id: 'custpage_so',
            type: ui.FieldType.SELECT,
            label: SUBLIST.TRANID_SO[LANGUAGE],
            source : 'salesorder'
        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        sublist.addField({
            id: 'custpage_fact',
            type: ui.FieldType.SELECT,
            label: SUBLIST.TRANID[LANGUAGE],
            source : 'invoice'
        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        sublist.addField({
            id: 'custpage_customer',
            type: ui.FieldType.SELECT,
            label: SUBLIST.CUSTOMER[LANGUAGE],
            source : 'customer'
        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        sublist.addField({
            id: 'custpage_trandate',
            type: ui.FieldType.TEXT,
            label: SUBLIST.TRANDATE[LANGUAGE]
        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        sublist.addField({
            id: 'custpage_location',
            type: ui.FieldType.SELECT,
            label: SUBLIST.LOCATION[LANGUAGE],
            source : 'location'
        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        sublist.addField({
            id: 'custpage_currency',
            type: ui.FieldType.SELECT,
            label: SUBLIST.CURRENCY[LANGUAGE],
            source : 'currency'
        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        sublist.addField({
            id: 'custpage_total',
            type: ui.FieldType.TEXT,
            label: SUBLIST.TOTAL[LANGUAGE],
        }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });


        fieldRFC.isMandatory         = true;
        fieldRazonSocial.isMandatory = true;
        fieldCP.isMandatory          = true;
        fieldCFDI.isMandatory        = true;
        fieldFormaPago.isMandatory   = true;
        fieldMetodoPago.isMandatory   = true;
        fieldDireccion.isMandatory   = true;
        fieldEstado.isMandatory      = true;
        fieldMunicipio.isMandatory   = true;
        fieldColonia.isMandatory     = true;
        fieldEmail.isMandatory       = true;


        fieldFormaPago.setHelpText({   help : HELPS.FORMAPAGO[LANGUAGE] });
        fieldCFDI.setHelpText({        help : HELPS.CFDI[LANGUAGE]      });


        fieldRFC.setHelpText({             help : HELPS.RFC[LANGUAGE]       });
        fieldRazonSocialPers.setHelpText({ help : HELPS.RSP[LANGUAGE]       });
        fieldRazonSocial.setHelpText({     help : HELPS.RS[LANGUAGE]        });
        fieldDireccion.setHelpText({       help : HELPS.DIRECCION[LANGUAGE] });
        fieldEstado.setHelpText({          help : HELPS.ESTADO[LANGUAGE]    });
        fieldMunicipio.setHelpText({       help : HELPS.MUNICIPIO[LANGUAGE] });
        fieldColonia.setHelpText({         help : HELPS.COLONIA[LANGUAGE]   });
        fieldCP.setHelpText({              help : HELPS.CP[LANGUAGE]        });
        fieldEmail.setHelpText({           help : HELPS.EMAIL[LANGUAGE]     });

        fieldFormaPago.defaultValue   = '';
        fieldMetodoPago.defaultValue   = '';
        fieldCFDI.defaultValue        = '';

        log.debug("custoemrData", customerData)

        fieldRFC.defaultValue         = customerData.RFC;
        fieldRazonSocial.defaultValue = customerData.Name;
        fieldDireccion.defaultValue   = customerData.Street;
        fieldEstado.defaultValue      = customerData.State;
        fieldMunicipio.defaultValue   = customerData.Town;
        fieldColonia.defaultValue     = customerData.Surburb;
        fieldCP.defaultValue          = customerData.Zip;
        fieldEmail.defaultValue       = customerData.Email;

        for( var i = 0; i < invoiceSearchObj.length; i++ ){

            //sublist.setSublistValue({ id: 'custpage_tranid',   line: i, value: invoiceSearchObj[i].getValue({ name: "tranid"   }) }) || "-";
            sublist.setSublistValue({ id: 'custpage_fact',     line: i, value: invoiceSearchObj[i].id                             }) || "-";

            sublist.setSublistValue({ id: 'custpage_so',       line: i, value: invoiceSearchObj[i].getValue({ name: "createdfrom" }) }) || "-";
            sublist.setSublistValue({ id: 'custpage_customer', line: i, value: invoiceSearchObj[i].getValue({ name: "entity"      }) }) || "-";
            sublist.setSublistValue({ id: 'custpage_trandate', line: i, value: invoiceSearchObj[i].getValue({ name: "trandate"    }) }) || "-";
            sublist.setSublistValue({ id: 'custpage_currency', line: i, value: invoiceSearchObj[i].getValue({ name: "currency"    }) }) || "-";
            sublist.setSublistValue({ id: 'custpage_location', line: i, value: invoiceSearchObj[i].getValue({ name: "location"    }) }) || "-";

            var total = invoiceSearchObj[i].getValue({ name: "total"    });

            sublist.setSublistValue({ id: 'custpage_total',    line: i, value: format.format({ value:total, type: format.Type.CURRENCY }) }) || "-";

        }

        interfaz.addSubmitButton({ label : 'Enviar' });

        var backButton      = interfaz.addButton({ 
                                id           : 'custpage_back',  
                                label        : LABELS.BACK[LANGUAGE],    
                                functionName : 'backToMain' 
                            });

        return interfaz;
    }

    function extraerData() {

        var idCliente      = CLIENT.id;

        var customerRecord = record.load({
                                type      : record.Type.CUSTOMER,
                                id        : idCliente,
                                isDynamic : true,
                            }); 

        var customerData = {
            idCliente : idCliente,
            RFC       : customerRecord.getValue({ fieldId: 'vatregnumber'            }) || "-",
            Name      : customerRecord.getValue({ fieldId: 'custentity_razon_social' }) || "-",
            Email     : customerRecord.getValue({ fieldId: 'email'                   }) || "-",
            Street    : customerRecord.getValue({ fieldId: 'billaddr1'               }) || "-",
            Surburb   : customerRecord.getValue({ fieldId: 'billaddr2'               }) || "-",
            State     : customerRecord.getValue({ fieldId: 'billstate'               }) || "-",
            Town      : customerRecord.getValue({ fieldId: 'billcity'                }) || "-",
            Zip       : customerRecord.getValue({ fieldId: 'billzip'                 }) || "-",

        };

        return customerData;
    }

    return handler;
});