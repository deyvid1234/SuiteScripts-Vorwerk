/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/email','N/render','N/file','N/runtime','N/encode', 'N/https','N/format','N/xml'],

function(record, search, email, render, file,runtime, encode, https, format, xml) {

    function onRequest(context){
        try{
            log.debug('context.request.method',context.request.method);
            if (context.request.method == 'GET'){
                XMLSuiteletHandler(context);
            }
        }
        catch(e){
            log.error('There is an error in onRequest',e)
        }
    }

    function XMLSuiteletHandler(context){
        try{
            var params = context.request.parameters,
                recordType = params['recordType'],
                recordId = params['recordId'];
            XMLProcess(recordType,recordId,context)
        }
        catch(e){
            log.debug('There is an error in XMLSuiteletHandler',e);
        }
    }

    function XMLProcess(recordType,recordId,context){
        try{
            //Objeto que contienen los campos a actualizar en el record
            var objUpdate = {};
            //Objeto de configuracion de conexiones y datos de company
            var objConfig = getObjConfig();
            if(objConfig.error){
                throw objConfig.message;
            }
            //Objeto que contiene la equivalencia de los 3 tipos de records
            var objRecordEquivalence = getRecordEquivalence(recordType);
            if(objRecordEquivalence.error){
                throw objRecordEquivalence.message;
            }
            var equivalenceData = objRecordEquivalence['data'];
            //Obtiene los detalles del registro a timbrar
            var objCompensation = loadCompensationRecord(recordType,recordId,equivalenceData,objConfig['data']['conectionSettings']['enabledTestingMode']);
            if(objCompensation.error){
                throw objCompensation.message;
            }
            var compensationData = objCompensation['data'];
            log.debug('objCompensation',objCompensation);
            //Busqueda de sales order pertenecientes al registro principal
//            var objSalesOrder = getCommissionDetail(compensationData['internalid'],equivalenceData['idRecordDetail']);
//            if(objSalesOrder.error){
//                throw objSalesOrder.message;
//            }
//            var arrSalesOrder = objSalesOrder['data'];
//            log.debug('This is arrSalesOrder',arrSalesOrder);
            //Detalles del receptor para ser enviados en el xml
            var objReceptor = getReceptorData(compensationData['employeeId']);
            if(objReceptor.error){
                throw objReceptor.message;
            }
            //Objeto calendario que determina las fechas de timbrado -> validar el inicio de periodo
            var objCalendar = getObjCalendar();
            if(objCalendar.error){
                throw objCalendar.message;
            }

            var subtotalCompensation = compensationData['subtotal'],
                isrCompensation = compensationData['isrTaxTotal'],
                taxRate = (parseFloat(isrCompensation) * 100) / parseFloat(subtotalCompensation),
                totalCompensation = compensationData['total'];
            var totalWithLetter = totalConLetra(totalCompensation);

            var objData = {
                conectionSettings: objConfig['data']['conectionSettings'],
                supplier: objConfig['data']['supplier'],
                receptor: objReceptor['data'],
                concepts: {
                    quantity: '1',
                    unitCode: 'ACT',//actividad
                    prodSerCode: '84111505',//servicios de contabilidad de sueldos y salarios
                    description: 'Pago de nómina',
                    paymentMethod: '99'
                },
                monetaryTotal: {
                    currency: 'MXN',
                    exchangeRate: 1.00,
                    totalWithLetter: totalWithLetter,
                    total: totalCompensation,
                    subtotal: subtotalCompensation,
                    isrTaxTotal: isrCompensation,
                    taxRate: taxRate,
                    withholding: '0.0',
                    discount: '0.0',
                },
                calendar: {
                    initDate: objCalendar['data']['initDate'],
                    finishDate: objCalendar['data']['finishDate'],
                    paymentDate: objCalendar['data']['paymentDate'],
                }
            };
            //Creación del XML sin envío y antes de base64
            var objXMLTemplate = createXML(objData);
            if(objXMLTemplate.error){
                throw objXMLTemplate.message;
            }
            else{
                var xmlString = objXMLTemplate['data'];
                //<!-- Impresión del XML en consola
                var str = 0;
                var nT = (xmlString.length/3500)+1;
                for(var i=0; i < nT; i++){
                    log.debug('This is a part xml'+i, xmlString.substring(str, str+3500));
                    str+=3500;
                }
                //-->
                //Codificación del xml para el envio en base 64
                var base64XML = encode.convert({
                    string: objXMLTemplate['data'],
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64
                });

                objUpdate[equivalenceData['xmlText']] = objXMLTemplate['data'];
                //Proceso de envío a través de post, se genera el xml completo y retorna la respuesta del servicio
                var xmlProcessed = sendProcess(objData,base64XML);
                if(xmlProcessed.error){
                    sendErrorNotification('errorService',{errorDetails: xmlProcessed.message, regName: compensationData['name']});
                    throw xmlProcessed.message;//error producto de la función
                }
                else{
                    var fileName = compensationData['name'];
                    log.debug('fileName',fileName);
                    var folderId = equivalenceData['idFolder'];
                    log.debug('folderId',folderId);
                    var xmlProcessResult = xmlProcessed['data'],
                        bodyResult = xmlProcessResult.body;
                    log.debug('xmlProcessResult, verify me',xmlProcessResult);
                    log.debug('bodyResult, verify me',bodyResult);
                    objUpdate[equivalenceData['responseCode']] = xmlProcessResult['code'];
                    //objUpdate[equivalenceData['responseMessage']] = JSON.stringify(xmlProcessResult);
                    //Si el código fué exitoso -> 200
                    if(xmlProcessResult['code'] == '200'){
                        log.debug('xmlProcessResult[code] == 200, verify me',xmlProcessResult);
                        //validar el nodo reponse/result, si viene en falso puede ser falla de normas/reglas
                        var xmlDocument = xml.Parser.fromString({
                            text : bodyResult
                        });
                        log.debug('5 verify me','ok');
                        var xmlResult = xmlDocument.getElementsByTagName({
                            tagName : 'Result'
                        })[0]['textContent'];
                        log.debug('xmlResult',xmlResult);
                        if(xmlResult == 'true'){
                            log.debug('6','ok');
                            objUpdate[equivalenceData['responseMessage']] = 'Timbrado exitoso';
                            log.debug('7','ok');
                            //xml timbrado
                            var response1 = xmlDocument.getElementsByTagName({
                                tagName : 'ResponseData1'
                            });
                            log.debug('8','ok');
                            //pdf
                            var response3 = xmlDocument.getElementsByTagName({
                                tagName : 'ResponseData3'
                            });
                            log.debug('9','ok');
                            var xmlDecoded = decodeB64(response1[0]['textContent']),
                                pdfDecoded = response3[0]['textContent'];
                                //pdfDecoded = decodeB64(response3[0]['textContent']);
                            log.debug('10','ok');
                            var xmlFile = createFile('XMLDOC',xmlDecoded,'xml_'+fileName,folderId),
                                pdfFile = createFile('PDF',pdfDecoded,'pdf_'+fileName,folderId);
                            log.debug('xmlFile',xmlFile);
                            log.debug('pdfFile',pdfFile);

                            var idXML = equivalenceData['xmlField'],
                                idPDF = equivalenceData['pdfField'];

                            objUpdate[idXML] = xmlFile['data'];
                            objUpdate[idPDF] = pdfFile['data'];
                            objUpdate[equivalenceData['responseDetails']] = '';
                            log.debug('objUpdate',objUpdate);
                            /*record.submitFields({
                                type: recordType,
                                id: recordId,
                                values: objUpdate,
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });*/
//                            updateSalesOrder(arrSalesOrder);
                        }
                        else{
                            log.debug('Result false, verify me','ño');
                            var lastResult = xmlDocument.getElementsByTagName({
                                tagName : 'LastResult'
                            })[0]['textContent'],
                            resultDescription = xmlDocument.getElementsByTagName({
                                tagName : 'Data'
                            })[0]['textContent'];
                            objUpdate[equivalenceData['responseMessage']] = lastResult;
                            objUpdate[equivalenceData['responseDetails']] = resultDescription;
                        }
                        if(context){
                            context.response.write(JSON.stringify(bodyResult));
                        }

                    }//Si el código de respuesta es diferente de 200
                    else{
                        if(context){
                            context.response.write(JSON.stringify(xmlProcessResult));
                        }
                    }
                }
            }
        }
        catch(e){
            log.error('There is an error in XMLProcess',e);
        }
        finally{
            if(Object.keys(objUpdate).length > 0){
                record.submitFields({
                    type: recordType,
                    id: recordId,
                    values: objUpdate,
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });
            }
        }
    }

    function updateSalesOrder(arrSalesOrder){
        try{
            log.debug('This is arrSalesOrder',arrSalesOrder);
            var arrFail = [],
                idTmp = 0;
            for(var i=0; i < arrSalesOrder.length; i++){
                idTmp = arrSalesOrder[i];
                log.debug('This is idTmp',idTmp);
                var thisSubmit = record.submitFields({
                    type: 'salesorder',
                    id: idTmp,
                    //values: {'custbody_vw_comission_status': 3},//timbrado
                    values: {'custbody_vw_is_issued': true},
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });
            }
        }
        catch(e){
            log.error('There is an error in updateSalesOrder',e);
            arrFail.push(idTmp);
        }
        finally{
            if(arrFail.length > 0){
                var objData = {arrFail: arrFail, arrSalesOrder: arrSalesOrder}
                sendErrorNotification('updateSalesOrder',objData);
            }
        }
    }

    function sendErrorNotification(errorType,objData){
        try{
            var subject = '',
                emailBody = '';
            switch(errorType){
                case 'updateSalesOrder':
                    subject = 'Error al actualizar las ordenes de venta',
                    emailBody = 'Listado original: '+objData['arrSalesOrder'].join(', ')+', peculiaridad: '+objData['arrFail'].join(', ');
                break;
                case 'errorService':
                    subject = 'Error al timbrar el registro '+objData['regName'],
                    emailBody = 'Ha ocurrido un error al realizar el timbrado, detalles: '+objData['errorDetails'];
                break;
                default:
                    subject = errorType,
                    emailBody = objData['message'];
            }

            email.send({
                author: -5,
                recipients: 'eomar_ol@hotmail.com',
                subject: subject,
                body: emailBody
            });
        }
        catch(e){
            log.error('There is an error in sendErrorNotification',e);
        }
    }

    function decodeB64(stringVal){
        try{
            log.debug('decodeB64 stringVal',stringVal);
            var thisDecoded = encode.convert({
                string: stringVal,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            });
            return thisDecoded;
        }
        catch(e){
            log.error('There is an error in decodeB64',e);
        }
    }

    function createFile(fileType, fileContent, fileName,idFolder){
        try{
            log.debug('fileType',fileType);
            log.debug('fileContent',fileContent);
            log.debug('fileName',fileName);
            log.debug('idFolder',idFolder);
            var fileCreated = file.create({
                name: fileName,
                fileType: file.Type[fileType],
                contents: fileContent
            });
            fileCreated.folder = idFolder;
            var idFile = fileCreated.save();
            return createObjReturn(idFile,'createFile ok',false);
        }
        catch(e){
            log.error('There is an error in createFile function',e);
            return createObjReturn({},'There is an error in createFile: '+JSON.stringify(e),true);
        }
    }

    function sendProcess(objData, base64XML){
        try{
            /*var xmlToSend =
            '<?xml version="1.0" encoding="utf-8"?>'+
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
                '<soap:Body>'+
                    '<RequestTransaction xmlns="http://www.fact.com.mx/schema/ws">'+
                        '<Requestor>0c320b03-d4f1-47bc-9fb4-77995f9bf33e</Requestor>'+
                        '<Transaction>CONVERT_NATIVE_XML</Transaction>'+
                        '<Country>MX</Country>'+
                        '<Entity>AAA010101AAA</Entity>'+
                        '<User>0c320b03-d4f1-47bc-9fb4-77995f9bf33e</User>'+
                        '<UserName>MX.AAA010101AAA.NTS1006255A9</UserName>'+
                        '<Data1>'+base64XML+'</Data1>'+
                        '<Data2>XML PDF</Data2>'+
                        '<Data3></Data3>'+
                    '</RequestTransaction>'+
                '</soap:Body>'+
            '</soap:Envelope>';*/
            //objData[] -> conectionSettings: objConfig['data']['conectionSettings'],
            /*
            conectionSettings: {
                user: user,
                emisorUser: emisorUser,
                apiKey: apiKey,
                requestor: requestor,*
                urlService: urlService,*
                branchOffice: branchOffice,
                enabledTestingMode: enabledTestingMode
            },
            supplier:{
                companyName: loadedRecord.getValue('custrecord_vw_commercial_name'),
                rfc: rfc,
                fiscalRegime: loadedRecord.getValue('custrecord_vw_fiscal_regime'),
                supCountryCode: loadedRecord.getValue('custrecord_vw_supplier_country_code'),
                expZipCode: loadedRecord.getValue('custrecord_vw_expedition_zip_code'),
                emailsSendTo: loadedRecord.getValue('custrecord_vw_email_list_to_receive')
            }
            */
            var sXml = '';
            //sXml += '<?xml version=\"1.0\" encoding=\"utf-8\"?> ';
            sXml += '<Envelope xmlns=\"http://schemas.xmlsoap.org/soap/envelope/\">\n';
            sXml +=     '<Body>\n';
            sXml +=         '<RequestTransaction xmlns=\"http://www.fact.com.mx/schema/ws\">\n';
            //sXml +=             '<Requestor>0c320b03-d4f1-47bc-9fb4-77995f9bf33e</Requestor>\n';
            sXml +=             '<Requestor>'+objData['conectionSettings']['requestor']+'</Requestor>\n';//2e6875cc-a7d0-40e1-b96a-05d458166416
            sXml +=             '<Transaction>CONVERT_NATIVE_XML</Transaction>\n';
            sXml +=             '<Country>MX</Country>\n';
            //sXml +=             '<Entity>AAA010101AAA</Entity>\n';
            sXml +=             '<Entity>'+objData['supplier']['rfc']+'</Entity>\n';//VME060622GL2
            //sXml +=             '<User>0c320b03-d4f1-47bc-9fb4-77995f9bf33e</User>\n';
            sXml +=             '<User>'+objData['conectionSettings']['apiKey']+'</User>\n';//2e6875cc-a7d0-40e1-b96a-05d458166416
            //sXml +=             '<UserName>MX.AAA010101AAA.NTS1006255A9</UserName>\n';
            sXml +=             '<UserName>'+objData['conectionSettings']['user']+'</UserName>\n';//MX.VME060622GL2.VORWERK_1
            sXml +=             '<Data1>' + base64XML + '</Data1>\n';
            sXml +=             '<Data2>XML PDF</Data2>\n';
            sXml +=             '<Data3></Data3>\n';
            sXml +=         '</RequestTransaction>\n';
            sXml +=     '</Body>\n';
            sXml += '</Envelope>\n';

            var xmlString = sXml;
            var str = 0;
            var nT = (xmlString.length/3500)+1;
            for(var i=0; i < nT; i++){
                log.debug('This is a part xml send'+i, xmlString.substring(str, str+3500));
                str+=3500;
            }

            var isTesting = objData['conectionSettings']['isTestig'];
            // var host = 'www.mysuitetest.com';
            var host = 'https://www.mysuitetest.com/mx.com.fact.wsfront/factwsfront.asmx';
            if (!isTesting) {
                host = 'https://www.mysuitecfdi.com/mx.com.fact.wsfront/factwsfront.asmx';
            }
            // log.debug('host', host);

            var responseProcess = https.post({
                url: objData['conectionSettings']['urlService'],
                headers : {
                    'Host': host,
                    'Content-Type' : 'text/xml; charset=utf-8',
                    'Content-Length': sXml.length,
                    'SOAPAction': 'http://www.fact.com.mx/schema/ws/RequestTransaction'
                },
                body: sXml
            });
            log.debug('responseProcess',responseProcess);
            return createObjReturn(responseProcess,'sendProcess ok',false);
        }
        catch(e){
            log.error('There is an error in sendProcess',e);
            return createObjReturn({},'There is an error in sendProcess: '+JSON.stringify(e),true);
        }
    }

    function loadCompensationRecord(recordType,recordId,recordEquivalence,enabledTestingMode){
        try{
            var loadedRecord = record.load({
                type: recordType,
                id: recordId,
                isDynamic: true,
            });

            var thereIsXML = loadedRecord.getValue(recordEquivalence['xmlField']),
                thereIsPDF = loadedRecord.getValue(recordEquivalence['pdfField']);

            if(!enabledTestingMode && (thereIsXML || thereIsPDF)){
                throw 'El registro de tipo '+recordType+' con id '+recordId+' ya tiene registrado un XML o un PDF como respuesta al proceso de timbrado. Por favor validar!';
            }

            var objReturn = {
                internalid: loadedRecord.id,
                name: loadedRecord.getValue('name'),
                employeeId: loadedRecord.getValue(recordEquivalence['employeeField']),
                subtotal: parseFloat(loadedRecord.getValue(recordEquivalence['subtotalField'])).toFixed(2),
                isrTaxTotal: parseFloat(loadedRecord.getValue(recordEquivalence['isrTaxField'])).toFixed(2),
                total: parseFloat(loadedRecord.getValue(recordEquivalence['totalField'])).toFixed(2)
            };
            return createObjReturn(objReturn,'loadCompensationRecord OK',false)
        }
        catch(e){
            log.error('There is an error in loadCompensationRecord function',e);
            return createObjReturn({},'There is an error in loadCompensationRecord: '+JSON.stringify(e),true);
        }
    }

    function getRecordEquivalence(recordType){
        try{
            var objEquivalence = {
                'customrecord_compensaciones_gtm': {
                    employeeField: 'custrecord_c_gtm_empleado',
                    subtotalField: 'custrecord_c_gtm_subtotal',
                    isrTaxField: 'custrecord_c_gtm_retencion',
                    totalField: 'custrecord_c_gtm_total',
                    idFolder: '1842',
                    xmlField: 'custrecord_c_gtm_xml_sa',
                    pdfField: ' custrecord_c_gtm_pdf',
                    xmlText: 'custrecord_c_gtm_xml_comprobante',
                    responseCode: 'custrecord_c_gtm_codigo_respuesta',
                    responseMessage: 'custrecord_c_gtm_mensaje_respuesta',
                    responseDetails: 'custrecord_c_gtm_response_details',
                    idRecordDetail: 'custrecord_sub_compensaciones_tm'
                },
                'customrecord_compensaciones_jdg': {
                    employeeField: 'custrecord_c_jdg_empleado',
                    subtotalField: 'custrecord_c_jdg_subtotal',
                    isrTaxField: 'custrecord_c_jdg_retencion',
                    totalField: 'custrecord_c_jdg_total',
                    idFolder: '1844',
                    xmlField: 'custrecord_c_jdg_xml_sat',
                    pdfField: 'custrecord_c_jdg_pdg',
                    xmlText: 'custrecord_c_jdg_xml_comprobante',
                    responseCode: 'custrecord_c_jdg_codigo_respuesta',
                    responseMessage: 'custrecord_c_jdg_mensaje_respuesta',
                    responseDetails: 'custrecord_c_jdg_response_details',
                    idRecordDetail: 'custrecord_sub__compensaciones_jdg'

                },
                'customrecord_comisiones_presentadora': {
                    employeeField: 'custrecord_c_pre_empleado',
                    subtotalField: 'custrecord_c_pre_subtotal',
                    isrTaxField: 'custrecord_c_pre_retencion',
                    totalField: 'custrecord_c_pre_total',
                    idFolder: '1843',
                    xmlField: 'custrecord_c_pre_xml_sat',
                    pdfField: 'custrecord_c_pre_pdf',
                    xmlText: 'custrecord_c_pre_xml_comprobante',
                    responseCode: 'custrecord_c_pre_codigo_respuesta',
                    responseMessage: 'custrecord_c_pre_mensaje_respuesta',
                    responseDetails: 'custrecord_c_pre_response_details',
                    idRecordDetail: 'custrecord_sub_compensaciones_pre'
                }
            }
            return createObjReturn(objEquivalence[recordType],'getRecordEquivalence OK',false);
        }
        catch(e){
            log.error('There is an error in getRecordEquivalence',e);
            return createObjReturn({},'There is an error in getRecordEquivalence: '+JSON.stringify(e),true);
        }
    }

    function getReceptorData(idEmployee){
        try{
            var loadedRecord = record.load({
                type: 'employee',
                id: idEmployee,
                isDynamic: true,
            });

            var envType = runtime.envType;
            var rfc = (envType == 'PRODUCTION') ? loadedRecord.getValue('custentity_ce_rfc') : 'XAXX010101000';

            var stateValue = '';
            var objBillingAddress = getObjAddress(loadedRecord);

            if(objBillingAddress.error){
                throw objBillingAddress.message;
            }
            else{
                stateValue = objBillingAddress['data']
            }

            var objReturn = {
                rfc: rfc,
                curp: loadedRecord.getValue('custentity_curp'),
                employeeNumer: loadedRecord.getValue('entitynumber'),
                fullName: loadedRecord.getValue('altname'),
                email: loadedRecord.getValue('email'),
                //pasar a dinamico si se requiere con registro patronal para de 1 a 8 tipo de contrato
                contractType : '99'/*loadedRecord.getText('custentity_c_nom_tipocontrato')*/,//'99', -> customrecord_c_tipo_contrato
                payrollType : loadedRecord.getText('custentity_c_nom_tiponomina'),//pendiente validar registros en netsuite -> o ordinaria, e extraordinaria
                periodicityPayment : loadedRecord.getText('custentity_c_nom_periodicidadpago'),//pendiente validar registros en netsuite -> 05 mensual, 04 quincenal, etc -> customrecordc_pp_periodicidadpago
                regimeType : '11',/*loadedRecord.getText('custentity_c_nom_tiporegimen'),*/ //'11',//asimilados a otros

                cfdiUse: 'CN01',//Concepto -> Por definir
                countryCode: 'MX',//código pais
                stateValue: stateValue,//codigo de estado

                // cambio Cristian T4.0
                exportacion: loadedRecord.getText('custentity_cfdi_exportacion').split(' ')[0] ? loadedRecord.getText('custentity_cfdi_exportacion').split(' ')[0] : '01',
                billzip: loadedRecord.getValue('billzip'),
                regimenFiscal: loadedRecord.getText('custentity_regimenfiscal_ce').split('-')[0],
                billzip: loadedRecord.getValue('billzip')
            };
            return createObjReturn(objReturn, 'getReceptorData OK', false);
        }
        catch(e){
            log.error('There is an error in getReceptorData function',e);
            return createObjReturn({}, 'There is an error in getReceptorData function: '+JSON.stringify(e), true);
        }
    }

    function getObjAddress(loadedRecord){
        try{
            var stateValue = '';
            var totalAddressLines = loadedRecord.getLineCount({
                sublistId: 'addressbook'
            })
            for(var i=0; i < totalAddressLines; i++){
                var defaultbilling = loadedRecord.getSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultbilling',//habilitar en formulario de direcciones
                    line: i
                });

                if(defaultbilling){
                    var lineSub = loadedRecord.selectLine({
                        sublistId: 'addressbook',
                        line: i
                    });

                    var addressbookaddress = loadedRecord.getCurrentSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress'
                    });
                    var state = addressbookaddress.getValue('state'),
                        dropdownstate = addressbookaddress.getValue('dropdownstate');
                    var stateFilter = dropdownstate || state;
                    if(!stateFilter){
                        throw 'Theres no state in employee address';
                    }
                    else{
                        var objState = getStateValue(state);
                         if(objState.error){
                            throw objState.message;
                        }
                        else{
                            stateValue = objState['data']
                        }
                    }
                }
            }
            return createObjReturn(stateValue, 'getObjAddress OK', false);
        }
        catch(e){
            log.error('There is an error in getObjAddress function',e);
            return createObjReturn(stateValue, 'There is an error in getObjAddress function: '+JSON.stringify(e), true);
        }
    }

    function getStateValue(state){//remplazar por custom record con valores adecuados, equivalencia en estados vs valores sat
        try{
            var stateValue = '';
            var searchState = search.create({
                type: 'customlist_nso_nomencla_estado_sat',
                filters: [
                    {
                        name: 'name',
                        operator: 'contains',
                        values: state
                    }
                ],
                columns: [
                    { name: 'internalid' },
                    { name: 'name' }
                ]
            });
            var objReturn = {};
            searchState.run().each(function(r){
                stateValue = r.getValue('name');
                objReturn['internalid'] = r.getValue('internalid');
                objReturn['name'] = r.getValue('name');
                return true;
            });
            if(!stateValue){
                throw 'No results to state';
            }
            else{
                var stateCode = stateValue.split( "-" )[0];
                return createObjReturn(stateCode,'getStateValue ok',false);
            }
        }
        catch(e){
            log.error('There is an error in getStateValue function',e);
            return createObjReturn({},'There is an error in getStateValue function: '+JSON.stringify(e),true);
        }
    }

    function getObjConfig(){
        try{
            var envType = runtime.envType;

            var loadedRecord = record.load({
                type: 'customrecord_vw_connection_serv_settings',
                id: 1,
                isDynamic: true,
            });

            var isDemo = loadedRecord.getValue('custrecord_vw_is_in_demo_mode'),
                enabledTestingMode = (typeof isDemo == 'string') ? isDemo == 'T': (typeof isDemo == 'boolean') ? isDemo : true;

            var isTestig = loadedRecord.getValue('custrecord_nso_testing');

            var user = (envType == 'PRODUCTION' && !enabledTestingMode) ? loadedRecord.getValue('custrecord_vw_user_production') : loadedRecord.getValue('custrecord_vw_user_sandbox'),
                apiKey = (envType == 'PRODUCTION' && !enabledTestingMode) ? loadedRecord.getValue('custrecord_vw_api_key_production') : loadedRecord.getValue('custrecord_vw_api_key_sandbox'),
                requestor = (envType == 'PRODUCTION' && !enabledTestingMode) ? loadedRecord.getValue('custrecord_vw_requestor_production') : loadedRecord.getValue('custrecord_vw_requestor_sandbox'),
                urlService = (envType == 'PRODUCTION' && !enabledTestingMode) ? loadedRecord.getValue('custrecord_vw_url_production_service') : loadedRecord.getValue('custrecord_vw_url_sandbox_service'),
                branchOffice = (envType == 'PRODUCTION' && !enabledTestingMode) ? loadedRecord.getValue('custrecord_vw_branch_office_production') : loadedRecord.getValue('custrecord_vw_branch_office_sandbox'),
                emisorUser = (envType == 'PRODUCTION' && !enabledTestingMode) ? loadedRecord.getValue('custrecord_vw_emisor_user_production') : loadedRecord.getValue('custrecord_vw_emisor_user_sandbox');
            var rfc = (envType == 'PRODUCTION' && !enabledTestingMode) ? loadedRecord.getValue('custrecord_vw_company_rfc') : 'JES900109Q90';

            var objCompanyDetails = {
                companyName: loadedRecord.getValue('custrecord_vw_commercial_name'),
                rfc: rfc,
                fiscalRegime: loadedRecord.getValue('custrecord_vw_fiscal_regime'),
                supCountryCode: loadedRecord.getValue('custrecord_vw_supplier_country_code'),
                expZipCode: loadedRecord.getValue('custrecord_vw_expedition_zip_code'),
                emailsSendTo: loadedRecord.getValue('custrecord_vw_email_list_to_receive')
            };
            var objReturn = {
                supplier: objCompanyDetails,
                conectionSettings: {
                    user: user,
                    emisorUser: emisorUser,
                    apiKey: apiKey,
                    requestor: requestor,
                    urlService: urlService,
                    branchOffice: branchOffice,
                    enabledTestingMode: enabledTestingMode,
                    isTestig: isTestig,
                    envType: envType
                }
            };

            log.debug('conectionSettings', objReturn.conectionSettings);
            return createObjReturn(objReturn,'Object config ok',false);
        }
        catch(e){
            log.error('There is an error in getObjConfig function',e);
            return createObjReturn({},'There is an error in getObjConfig function: '+JSON.stringify(e),true);
        }
    }

    function createXML(objData){
        try{
            var codPaisEmisor = objData['conectionSettings']['isTestig'] ? 'MX' : objData['supplier']['supCountryCode'];
            var RFCEmisor = objData['conectionSettings']['isTestig'] ? 'JES900109Q90' : objData['supplier']['rfc'];
            var razonSocialEmisor = objData['conectionSettings']['isTestig'] ? 'JIMENEZ ESTRADA SALAS A A' : objData['supplier']['companyName'];
            var cdgPaisReceptor = objData['conectionSettings']['isTestig'] ? 'MX' : objData['receptor']['countryCode'];
            var RFCReceptor = objData['conectionSettings']['isTestig'] ? 'FUNK671228PH6' : objData['receptor']['rfc'];
            var nombreReceptor = objData['conectionSettings']['isTestig'] ? 'KARLA FUENTE NOLASCO' : objData['receptor']['fullName'];
            var domicilioFiscalReceptor = objData['conectionSettings']['isTestig'] ? '01030' : objData['receptor']['billzip'];
            var usoCFDI = objData['conectionSettings']['isTestig'] ? 'CN01' : objData['receptor']['cfdiUse'];
            var claveEntFed = objData['conectionSettings']['isTestig'] ? 'MEX' : objData['receptor']['stateValue'];

            var newXML =
            '<?xml version="1.0" encoding="utf-8"?>'+
            //'<fx:FactDocMX'+
            //'xmlns:fx="http://www.fact.com.mx/schema/fx"'+
            //'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_f.xsd">'+
            '<fx:FactDocMX '+
            'xmlns:fx=\"http://www.fact.com.mx/schema/fx\" '+
            'xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" '+
            // 'xsi:schemaLocation=\"http://www.fact.com.mx/schema/fx   http://www.mysuitemex.com/fact/schema/fx_2010_f.xsd\">'+
            'xsi:schemaLocation=\"http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd\">'+
                // '<fx:Version>7</fx:Version>'+
                '<fx:Version>8</fx:Version>'+
                '<fx:Identificacion>'+
                    '<fx:CdgPaisEmisor>'+ codPaisEmisor +'</fx:CdgPaisEmisor>'+
                    '<fx:TipoDeComprobante>RECIBO_DE_NOMINA</fx:TipoDeComprobante>'+
                    '<fx:RFCEmisor>' + RFCEmisor + '</fx:RFCEmisor>'+
                    '<fx:RazonSocialEmisor>' + razonSocialEmisor + '</fx:RazonSocialEmisor>'+
                    '<fx:Usuario>' + objData['conectionSettings']['emisorUser'] + '</fx:Usuario>'+
                    '<fx:Exportacion>' +objData['receptor']['exportacion']+ '</fx:Exportacion>'+
                    '<fx:LugarExpedicion>' + objData['supplier']['expZipCode'] + '</fx:LugarExpedicion>'+
                '</fx:Identificacion>'+

                '<fx:Procesamiento>'+
                    '<fx:Dictionary name="email">'+
                        '<fx:Entry k="to" v="' + objData['supplier']['emailsSendTo'] + objData['receptor']['email'] + '"/>'+
                    '</fx:Dictionary>'+
                '</fx:Procesamiento>'+

                '<fx:Emisor>'+
                    '<fx:RegimenFiscal>'+
                        '<fx:Regimen>' + objData['supplier']['fiscalRegime'] + '</fx:Regimen>'+//pendiente
                    '</fx:RegimenFiscal>'+
                '</fx:Emisor>'+

                '<fx:Receptor>'+
                    '<fx:CdgPaisReceptor>' + cdgPaisReceptor + '</fx:CdgPaisReceptor>'+
                    '<fx:RFCReceptor>' + RFCReceptor + '</fx:RFCReceptor>'+//validar no está en la lista de RFC inscritos no cancelados en el SAT
                    '<fx:NombreReceptor>' + nombreReceptor + '</fx:NombreReceptor>'+
                    '<fx:DomicilioFiscalReceptor>' +domicilioFiscalReceptor+ '</fx:DomicilioFiscalReceptor>'+
                    '<fx:RegimenFiscalReceptor>' +objData['receptor']['regimenFiscal']+ '</fx:RegimenFiscalReceptor>'+
                    '<fx:UsoCFDI>' + usoCFDI + '</fx:UsoCFDI>'+//validar resto de códigos -> P01 por definir
                '</fx:Receptor>'+

                '<fx:Conceptos>'+
                    '<fx:Concepto>'+
                        '<fx:Cantidad>'+objData['concepts']['quantity']+'</fx:Cantidad>'+//valor quemado
                        '<fx:ClaveUnidad>'+objData['concepts']['unitCode']+'</fx:ClaveUnidad>'+//valor quemado
                        '<fx:ClaveProdServ>'+objData['concepts']['prodSerCode']+'</fx:ClaveProdServ>'+//valor quemado
                        '<fx:Descripcion>'+objData['concepts']['description']+'</fx:Descripcion>'+//valor quemado
                        '<fx:ValorUnitario>'+objData['monetaryTotal']['subtotal']+'</fx:ValorUnitario>'+
                        '<fx:Importe>'+objData['monetaryTotal']['subtotal']+'</fx:Importe>'+
                        '<fx:Descuento>'+objData['monetaryTotal']['isrTaxTotal']+'</fx:Descuento>'+
                        '<fx:ObjetoImp>01</fx:ObjetoImp>'+
                        '<fx:ConceptoEx>'+
                            '<fx:Impuestos>'+
                                '<fx:Impuesto>'+
                                    '<fx:Contexto>FEDERAL</fx:Contexto>'+//valor quemado
                                    '<fx:Operacion>RETENCION</fx:Operacion>'+//valor quemado
                                    '<fx:Codigo>ISR</fx:Codigo>'+//valor quemado
                                    '<fx:Base>'+objData['monetaryTotal']['subtotal']+'</fx:Base>'+
                                    '<fx:Tasa>'+objData['monetaryTotal']['taxRate']+'</fx:Tasa>'+//%subtotal
                                    '<fx:Monto>'+objData['monetaryTotal']['isrTaxTotal']+'</fx:Monto>'+
                                '</fx:Impuesto>'+
                            '</fx:Impuestos>'+
                        '</fx:ConceptoEx>'+
                    '</fx:Concepto>'+
                '</fx:Conceptos>'+

                '<fx:Totales>'+
                    '<fx:Moneda>' + objData['monetaryTotal']['currency'] + '</fx:Moneda>'+
                    '<fx:TipoDeCambioVenta>' + objData['monetaryTotal']['exchangeRate'] + '</fx:TipoDeCambioVenta>'+
                    '<fx:SubTotalBruto>' + objData['monetaryTotal']['subtotal'] + '</fx:SubTotalBruto>'+
                    '<fx:SubTotal>' + objData['monetaryTotal']['subtotal'] + '</fx:SubTotal>'+
                    '<fx:Descuento>' + objData['monetaryTotal']['isrTaxTotal'] + '</fx:Descuento>'+
                    '<fx:ResumenDeDescuentosYRecargos>'+
                        '<fx:TotalDescuentos>' + objData['monetaryTotal']['isrTaxTotal'] + '</fx:TotalDescuentos>'+
                        '<fx:TotalRecargos>' + '0.0' + '</fx:TotalRecargos>'+//valor quemado
                    '</fx:ResumenDeDescuentosYRecargos>'+
                    '<fx:Impuestos>'+
                        '<fx:Impuesto>'+
                            '<fx:Contexto>FEDERAL</fx:Contexto>'+
                            '<fx:Operacion>RETENCION</fx:Operacion>'+
                            '<fx:Codigo>ISR</fx:Codigo>'+
                            '<fx:Base>' + objData['monetaryTotal']['subtotal'] + '</fx:Base>'+
                            '<fx:Tasa>' + objData['monetaryTotal']['taxRate'] + '</fx:Tasa>'+
                            '<fx:Monto>' + objData['monetaryTotal']['isrTaxTotal'] + '</fx:Monto>'+
                        '</fx:Impuesto>'+
                    '</fx:Impuestos>'+
                    '<fx:ResumenDeImpuestos>'+
                        '<fx:TotalTrasladosFederales>' + '0.0' + '</fx:TotalTrasladosFederales>'+
                        '<fx:TotalIVATrasladado>' + '0.0' + '</fx:TotalIVATrasladado>'+
                        '<fx:TotalIEPSTrasladado>' + '0.0' + '</fx:TotalIEPSTrasladado>'+
                        '<fx:TotalRetencionesFederales>' + objData['monetaryTotal']['isrTaxTotal'] + '</fx:TotalRetencionesFederales>'+
                        '<fx:TotalISRRetenido>' + objData['monetaryTotal']['isrTaxTotal'] + '</fx:TotalISRRetenido>'+
                        '<fx:TotalIVARetenido>' + '0.0' + '</fx:TotalIVARetenido>'+
                        '<fx:TotalIEPSRetenido>' + '0.0' + '</fx:TotalIEPSRetenido>'+
                        '<fx:TotalTrasladosLocales>' + '0.0' + '</fx:TotalTrasladosLocales>'+
                        '<fx:TotalRetencionesLocales>' + '0.0' + '</fx:TotalRetencionesLocales>'+
                        '<fx:TotalImpuestosTrasladados>' + '0.0' + '</fx:TotalImpuestosTrasladados>'+
                        '<fx:TotalImpuestosRetenidos>' + '0.0' + '</fx:TotalImpuestosRetenidos>'+
                    '</fx:ResumenDeImpuestos>'+
                    '<fx:Total>' + objData['monetaryTotal']['total'] + '</fx:Total>'+
                    '<fx:TotalEnLetra>' + objData['monetaryTotal']['totalWithLetter'] + '</fx:TotalEnLetra>'+
                    // '<fx:FormaDePago>' + objData['concepts']['paymentMethod'] + '</fx:FormaDePago>'+
                '</fx:Totales>'+

                '<fx:Complementos>'+
                    '<fx:Nomina12 Version="1.2" TipoNomina="'+ objData['receptor']['payrollType']+'" FechaPago="'+objData['calendar']['paymentDate']+'" FechaInicialPago="'+objData['calendar']['initDate']+'" FechaFinalPago="'+objData['calendar']['finishDate']+'" NumDiasPagados="'+'28'+'" TotalPercepciones="'+objData['monetaryTotal']['subtotal']+'" TotalDeducciones="'+objData['monetaryTotal']['isrTaxTotal']+'" TotalOtrosPagos="'+'0.0'+'">'+
                        '<fx:Receptor Curp="'+objData['receptor']['curp']+'" TipoContrato="'+objData['receptor']['contractType']+'" Sindicalizado="No" TipoRegimen="'+objData['receptor']['regimeType']+'" NumEmpleado="'+objData['receptor']['employeeNumer']+'" PeriodicidadPago="'+objData['receptor']['periodicityPayment']+'" ClaveEntFed="'+claveEntFed+'">'+'</fx:Receptor>'+
                        '<fx:Percepciones TotalSueldos="'+objData['monetaryTotal']['subtotal']+'" TotalGravado="'+objData['monetaryTotal']['subtotal']+'"  TotalExento="'+'0'+'">'+
                            '<fx:Percepcion TipoPercepcion="'+'046'+'" Clave="'+'Compensacion'+'" Concepto="'+'Ingresos asimilados a salarios'+'" ImporteGravado="'+objData['monetaryTotal']['subtotal']+'" ImporteExento="'+'0'+'"></fx:Percepcion>'+
                        '</fx:Percepciones>'+
                        '<fx:Deducciones TotalOtrasDeducciones="'+'0.0'+'" TotalImpuestosRetenidos="'+objData['monetaryTotal']['isrTaxTotal']+'" >'+
                            '<fx:Deduccion TipoDeduccion="'+'002'+'" Clave="'+'ISR'+'" Concepto="'+'ISR'+'" Importe="'+objData['monetaryTotal']['isrTaxTotal']+'"></fx:Deduccion>'+
                       '</fx:Deducciones>'+
                    '</fx:Nomina12>'+
                '</fx:Complementos>'+

                '<fx:ComprobanteEx>'+
                    '<fx:DatosDeNegocio>'+
                        '<fx:Sucursal>' + objData['conectionSettings']['branchOffice'] + '</fx:Sucursal>'+
                    '</fx:DatosDeNegocio>'+
                    '<fx:TerminosDePago>'+
                        '<fx:MetodoDePago>' + 'PUE' + '</fx:MetodoDePago>'+
                    '</fx:TerminosDePago>'+
                '</fx:ComprobanteEx>'+

            '</fx:FactDocMX>';

            return createObjReturn(newXML,'createXML ok',false);
        }
        catch(e){
            log.error('There is an error in createXML function',e);
            return createObjReturn({},'There is an error in createXML function: '+JSON.stringify(e), false);
        }
    }

    function getObjCalendar(){
        try{
            var currentDate = new Date(),
                currentYear = currentDate.getFullYear(),
                currentMonth = currentDate.getMonth(),
                currentDay = currentDate.getDate();
                if(currentDay > 15){//si es el mismo mes tomamos el mes en curso
                    currentMonth = parseInt(currentMonth);
                }else{//si es de los primeros días del mes vamos por el mes anterior
                    currentMonth = parseInt(currentMonth)-1
                }
            if(currentMonth == -1){
                currentMonth = 0;
            }
            //currentYear = 2020;
            var arrMonths = [ "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre" ];

            var busqueda = search.create({
                type: 'customrecord_nso_calendar_vorwerk',
                filters: [
                    {
                        name: 'custrecord_nso_year',
                        operator: 'is',
                        values: currentYear
                    }
                ],
                columns: [
                    { name: 'internalid' },
                    { name: 'custrecord_nso_' + arrMonths[currentMonth] + '_inicial' },
                    { name: 'custrecord_nso_' + arrMonths[currentMonth] + '_final' },
                    { name: 'custrecord_nso_' + arrMonths[currentMonth] + '_pago' }
                ]
            });
            var objReturn = {};
            busqueda.run().each(function(r){
                log.debug('this is r',r);
                var dInit = format.parse({
                    value: r.getValue('custrecord_nso_' +arrMonths[currentMonth] + '_inicial'),
                    type: format.Type.DATE
                });
                var dFinish = format.parse({
                    value: r.getValue('custrecord_nso_' +arrMonths[currentMonth] + '_final'),
                    type: format.Type.DATE
                });
                var dPayment = format.parse({
                    value: r.getValue('custrecord_nso_' +arrMonths[currentMonth] + '_pago'),
                    type: format.Type.DATE
                });
                objReturn['initDate'] = getFormatedDate(dInit);
                objReturn['finishDate'] = getFormatedDate(dFinish);
                objReturn['paymentDate'] = getFormatedDate(dPayment);
                return true;
            });
            log.debug('objReturn',objReturn);
            return createObjReturn(objReturn,'getObjCalendar ok',false);
        }
        catch(e){
            log.error('There is an error in getObjCalendar function',e);
            return createObjReturn({},'There is an error in getObjCalendar function: '+JSON.string(e),true);
        }
    }

    function getFormatedDate(stringDate){
        var fdate = format.parse({
            value: stringDate,
            type: format.Type.DATE
        });
        var fDate = new Date(fdate);
        var day = fDate.getDate();
        var month = fDate.getMonth()+1;
        var year = fDate.getFullYear();
        month = (month < 10) ? '0'+month : month;
        day = (day < 10) ? '0'+day : day;
        return year+'-'+month+'-'+day;
    }

    function getCommissionDetail(idParent,fieldId){
        try{
            var arrDetails = [];
            var cDetail = search.create({
                type: 'customrecord_vorwerk_detail_comission',
                columns: [
                    { name: 'custrecord_vorwertk_transaction'}
                ],
                filters: [
                    {
                        name: fieldId,
                        operator: 'anyof',
                        values: idParent
                    }
                ]
            });
            cDetail.run().each(function(r){
                //pendiente validar si agregar join con filtro estatus diferente a 3 -> timbrado, para ahorrar proceso
                arrDetails.push(r.getValue('custrecord_vorwertk_transaction'));
                return true;
            });
            if(arrDetails.length == 0){
                throw 'No se han encontrado ordenes de venta asociadas al registro principal -> id registro '+idParent+', tipoRegistro '+fieldId;
            }
            return createObjReturn(arrDetails,'getCommissionDetail OK',false);
        }
        catch(e){
            log.error('There is an error in getCommissionDetail',e);
            return createObjReturn({},'There is an error in getCommissionDetai: '+JSON.stringify(e),true);
        }
    }

    function totalConLetra(n) {

        var o = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
        var u = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
        var d = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
        var c = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

        var n = parseFloat(n).toFixed(2); /*se limita a dos decimales*/
        var p = n.toString().substring(n.toString().indexOf(".") + 1); /*decimales*/
        var m = n.toString().substring(0, n.toString().indexOf(".")); /*número sin decimales*/
        var m = parseFloat(m).toString().split("").reverse();
        var t = "";

        /*Se analiza cada 3 dígitos*/
        for (var i = 0; i < m.length; i += 3) {
            var x = t;
            /*formamos un número de 2 dígitos*/
            var b = m[i + 1] != undefined ? parseFloat(m[i + 1].toString() + m[i].toString()) : parseFloat(m[i].toString());
            /*analizamos el 3 dígito*/
            t = m[i + 2] != undefined ? (c[m[i + 2]] + " ") : "";
            t += b < 10 ? u[b] : (b < 30 ? o[b - 10] : (d[m[i + 1]] + (m[i] == '0' ? "" : (" y " + u[m[i]]))));
            t = t == "ciento cero" ? "cien" : t;
            if (2 < i && i < 6)
            t = t == "uno" ? "mil " : (t.replace("uno", "un") + " mil ");
            if (5 < i && i < 9)
            t = t == "uno" ? "un millón " : (t.replace("uno", "un") + " millones ");
            t += x;
        }
        /*correcciones*/
        t = t.replace("  ", " ");
        t = t.replace(" cero", "");
        t = t.replace(/[a-zA-Z]*(uno|UNO)$/, "un");
        t += " pesos " + p + "/100 M.N.";

        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    //Crea el objeto generico devuelto en cada funcion
    function createObjReturn(data,message,error){//Crea el objeto que devuelve cada funcion
        try{
            var objResponse = {};
            objResponse['message'] = message;
            objResponse['error'] = error;
            objResponse['data'] = data;
            return objResponse;
        }
        catch(e){
            log.error('There is an error in createObjReturn function',e);
            objResponse['message'] = 'Ha ocurrido un error al generar el objeto response, detalles: '+e;
            objResponse['error'] = true;
            objResponse['data'] = {};
            return objResponse;
        }
    }


    return {
        onRequest: onRequest,
        XMLProcess: XMLProcess
    };
});
