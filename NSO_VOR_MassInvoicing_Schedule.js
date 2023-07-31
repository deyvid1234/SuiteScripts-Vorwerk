//========================================================================================
// Script File	: NSO_VOR_MassInvoicing_Schedule.js
// Script Type  : Scheduled
// Description 	: Calculate Massively Depreciation Acounting
// Author		: Cesar Hernandez
// Date			: 04-07-2017
//========================================================================================

var MIN_REMAIN_USAGE = 1000;

function invoiceSalesOrders(){

	nlapiLogExecution("DEBUG", "Procesando...");
	var wcontext 	 = nlapiGetContext();
	//_____________________________________________________________________________________________________________
	//Searching for setup record
	var setUpRecordSearch = nlapiSearchRecord('customrecord_massinvoicing_proc_setup');
	if(!setUpRecordSearch){
		nlapiLogExecution('DEBUG', 'NO Massive Invoicing Set Up Record');
		return;
	}
	var setUpRecord = nlapiLoadRecord('customrecord_massinvoicing_proc_setup', setUpRecordSearch[0].getId());
	var tolerance = parseFloat(setUpRecord.getFieldValue('custrecord_mips_tolerance')) || 0.0;
	//_____________________________________________________________________________________________________________
	var massProcesId = parseInt( wcontext.getSetting('SCRIPT', 'custscript_mipsc_recprocid') ) || 0;
	var user_id 	 = parseInt( wcontext.getSetting('SCRIPT', 'custscript_mipsc_userid') ) || 0;
	var isDaily 	 = wcontext.getSetting('SCRIPT', 'custscript_mipsc_daily') == 'T' ? true : false;
	nlapiLogExecution('DEBUG', 'Parameters', 'massProcesId: ' + massProcesId + 'user_id: ' + user_id + 'isDaily: ' + isDaily);
	//user_id = 60533;//testing invoices
	//massProcesId = 23;//testing invoices

	if(isDaily){
		var user_id  	= setUpRecord.getFieldValue('custrecord_mips_emailauthor');
		var afterNDays  = parseInt(setUpRecord.getFieldValue('custrecord_mips_execute_after')) || 0;
		var todayDateO  = new Date();
		var year        = todayDateO.getFullYear();
		var month       = todayDateO.getMonth();
		var day         = todayDateO.getDate();
		var monthEnd    = new Date(year, month+1, 1);
		monthEnd        = nlapiAddDays(monthEnd, -1);
		var monthEndDay = monthEnd.getDate();

      	nlapiLogExecution('DEBUG', 'Time on Server', JSON.stringify(todayDateO));
		if(!afterNDays || day <= afterNDays){
			nlapiLogExecution('DEBUG', 'Schedule Not Excecuted', 'afterNDays: ' + afterNDays + ' day: ' + day);
			return;
		}

		var endDay    = monthEndDay == day ? monthEndDay : parseInt(day) - parseInt(afterNDays);
		var dateini   = new Date(year, month, 1);
		var dateend   = new Date(year, month, endDay);
		var startDate = nlapiDateToString(dateini);
		var endDate   = nlapiDateToString(dateend);
	}
	//_____________________________________________________________________________________________________________
	//If there is not a Massive Control record Makes one
	var searchresults = [];
	if(!massProcesId && isDaily){
		nlapiLogExecution('DEBUG', 'startDate: ' + startDate, 'endDate: ' + endDate);
		var filters = [
			['mainline', 'is', 'T'], 'AND', ["type", "anyof", "SalesOrd"], 'AND',
			["status", "anyof", "SalesOrd:F"]//, 'AND', ['custbody_intereses_digital_credit', 'is', 'T'],
		];
		filters.push('AND', ["trandate", "within", [startDate, endDate]]);
		var columns = [];
		columns.push(new nlobjSearchColumn('custbody_total_a_pagar'));
		columns.push(new nlobjSearchColumn('trandate'));

		var mySearch        = nlapiCreateSearch('transaction', filters, columns);
		var searchresults_p = mySearch.runSearch();

		for (var k = 0; k < 5; ++k) {
			var temp = searchresults_p.getResults(k * 1000, (k + 1) * 1000);
			if(!temp || !temp.length){ break; }

			searchresults = searchresults.concat(temp);
		}
		nlapiLogExecution('DEBUG', 'Search Ended', searchresults.length);
        var entities      = getSalesOrderCreators(searchresults);
		//return;//Only for Testing

		//Creating massive control record
		var record = nlapiCreateRecord('customrecord_nso_massinvoicing_process', {recordmode: 'dynamic'});
		record.setFieldValue('custrecord_mip_process_status', 1);
		record.setFieldValue('custrecord_mip_triger_schedule', 'T');

		for(var i = 0; i < searchresults.length ; i++){
			var salesOrdId = searchresults[i].getId();
			var ammountDif = parseFloat(searchresults[i].getValue('custbody_total_a_pagar')) || 0.0;
			var ammountDifAbs = Math.abs(ammountDif);
			//nlapiLogExecution("DEBUG", i + ' - salesOrdId: ' + salesOrdId, 'ammountDifAbs: ' + ammountDifAbs);
            var creator;
            var creatorId;
            if(entities[salesOrdId]){
                creatorId = entities[salesOrdId].entityId || '';
            }
			if(ammountDifAbs <= tolerance){
				record.selectNewLineItem('recmachcustrecord_mipd_mass_process');
				record.setCurrentLineItemValue('recmachcustrecord_mipd_mass_process', 'custrecord_mipd_salesorder', salesOrdId);
                if(creatorId){ record.setCurrentLineItemValue('recmachcustrecord_mipd_mass_process', 'custrecord_mipd_seller', creatorId); }
				record.commitLineItem('recmachcustrecord_mipd_mass_process');
			}
		}

		var massProcesId = nlapiSubmitRecord(record, true);
		nlapiLogExecution('DEBUG', 'Dayly process massProcesId', massProcesId);
	}

	//_____________________________________________________________________________________________________________
	var massRecord = nlapiLoadRecord('customrecord_nso_massinvoicing_process', massProcesId);
	massRecord.setFieldValue('custrecord_mip_process_status', 2);//Processing


	//var testingInvoices = [0, 0, 447600, 447601];//testing invoices
	var numErrors = 0;
	var numSuccess = 0;
	var numNoinvoiced = 0;
	var lineCount = massRecord.getLineItemCount('recmachcustrecord_mipd_mass_process');
	for(var i = 1 ; i <= lineCount ; i++){
		try{
			//validate usage remaining
			var usageRemaining = wcontext.getRemainingUsage();
			nlapiLogExecution('DEBUG', 'USAGE REMAINING', usageRemaining);
			if(usageRemaining < MIN_REMAIN_USAGE){
				var objParams = { custscript_mipsc_recprocid: massProcesId,
								  custscript_mipsc_userid: user_id };
				if(isDaily)	 { objParams.custscript_mipsc_daily = 'T'; }
				nlapiLogExecution('DEBUG', 'objParams', objParams);
				var status = nlapiScheduleScript('customscript_massinvoicing_sc', null, objParams);
				if(status == 'QUEUED'){
					nlapiLogExecution('DEBUG','Reencolado','Se termino la metrica del script');
					return;
				}
			}
			//return;//Only for testing
			//End of usage validation

			var processed = massRecord.getLineItemValue('recmachcustrecord_mipd_mass_process', 'custrecord_mipd_processed', i) == 'T' ? true : false;
			if(processed){ continue; }

			var detailId  	 = parseInt(massRecord.getLineItemValue('recmachcustrecord_mipd_mass_process', 'id', i));
			var detailRec 	 = nlapiLoadRecord('customrecord_massinvoicing_proc_detail', detailId);
			var salesOrderId = parseInt(massRecord.getLineItemValue('recmachcustrecord_mipd_mass_process', 'custrecord_mipd_salesorder', i));
			nlapiLogExecution('DEBUG', 'salesOrderId', salesOrderId);
			var salesOrder 	 = nlapiLoadRecord('salesorder', salesOrderId);

			var metodoDePago = salesOrder.getFieldValue('custbody_cfdi_metpago_sat');
			var formaDePago = metodoDePago ? MetPago(metodoDePago) : '';
			var usoCFDI 	= salesOrder.getFieldValue('custbody_uso_cfdi');
			var customerId 	= salesOrder.getFieldValue('entity');
			var customerRFCSO 	= salesOrder.getFieldValue('custbody_rfc');
			nlapiLogExecution('DEBUG', 'customerId', customerId);
			var customerRFC = nlapiLookupField('customer', customerId, 'vatregnumber');

			if(!metodoDePago){
				detailRec.setFieldValue('custrecord_mipd_commets', 'No tiene Metodo de Pago');
				detailRec.setFieldValue('custrecord_mipd_processed', 'T');
				var detailRecId = nlapiSubmitRecord(detailRec);
				nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
				nlapiLogExecution('DEBUG', 'No tiene Metodo de Pago');
				numNoinvoiced++;
				continue;
			}
			if(!formaDePago){
				detailRec.setFieldValue('custrecord_mipd_commets', 'No tiene Forma de Pago');
				detailRec.setFieldValue('custrecord_mipd_processed', 'T');
				var detailRecId = nlapiSubmitRecord(detailRec);
				nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
				nlapiLogExecution('DEBUG', 'No tiene Forma de Pago');
				numNoinvoiced++;
				continue;
			}
			if(!usoCFDI){
				detailRec.setFieldValue('custrecord_mipd_commets', 'No tiene Uso CFDI');
				detailRec.setFieldValue('custrecord_mipd_processed', 'T');
				var detailRecId = nlapiSubmitRecord(detailRec);
				nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
				nlapiLogExecution('DEBUG', 'No tiene Uso CFDI');
				numNoinvoiced++;
				continue;
			}
			if(!customerRFC || !customerRFCSO){
				detailRec.setFieldValue('custrecord_mipd_commets', 'Cliente No tiene RFC');
				detailRec.setFieldValue('custrecord_mipd_processed', 'T');
				var detailRecId = nlapiSubmitRecord(detailRec);
				nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
				nlapiLogExecution('DEBUG', 'Cliente No tiene RFC');
				numNoinvoiced++;
				continue;
			}
			nlapiLogExecution('DEBUG', 'Checkpoint 3');
			var invoice = nlapiTransformRecord('salesorder', salesOrderId, 'invoice');
			nlapiLogExecution('DEBUG', 'invoice', invoice);
			var invoiceId = nlapiSubmitRecord(invoice, false, true);
			//var invoiceId = testingInvoices[i];//testing invoices
			nlapiLogExecution('DEBUG', 'invoiceId', invoiceId);
			var invoice = nlapiLoadRecord('invoice', invoiceId);
			var wtype = invoice.getRecordType();

			detailRec.setFieldValue('custrecord_mipd_invoice', invoiceId);
			//_____________________________________________________________________________________________________________

			//_____________________________________________________________________________________________________________
			//Timbrado
			var scriptDeployment = nlapiLoadRecord('scriptdeployment', 908);//Gral|CFDi|Cliente, applies to Invoice, customdeploy1

			var tranid          = invoice.getFieldValue("tranid");
			var subsidiary      = invoice.getFieldValue("subsidiary");
			var location        = invoice.getFieldValue("location");
			var IdSetupCFDi     = scriptDeployment.getFieldValue('custscript_id_setupcfdi_cli');
			var IdSetupCFDiNum  = scriptDeployment.getFieldValue('custscript_id_setupcfdi_num');
			var setupcfdi       = nlapiLoadRecord(IdSetupCFDi, IdSetupCFDiNum);
			var oneworld        = setupcfdi.getFieldValue('custrecord_cfdi_oneworld');
			var billforlocation = setupcfdi.getFieldValue('custrecord_cfdi_location_testing');
			//var testing         = setupcfdi.getFieldValue('custrecord_cfdi_testing');
			var testing         = setUpRecord.getFieldValue('custrecord_mips_testing');
			var setup           = null;
			var ScriptSuit      = scriptDeployment.getFieldValue('custscript_script_suitelet_cfdi');
			var ScriptSuitDepl  = scriptDeployment.getFieldValue('custscript_script_suitelet_dep');
			var SaveXMLinDisk   = scriptDeployment.getFieldValue('custscript_save_xml');
			var IdXMLBody       = scriptDeployment.getFieldValue('custscript_idxml_field_cli');
			var bodytext        = "";
			var context         = nlapiGetContext().getEnvironment();
			var newline     	= "[new line]";
			if(oneworld == 'T' ) {
				if(billforlocation == 'T') { setup = nlGetSetupRecord(subsidiary, location); }
				else{ setup = nlGetSetupRecord(subsidiary, null); }
			}
			else {
				if(billforlocation == 'T') { setup = nlGetSetupRecord(null, location); }
				else { setup = nlGetSetupRecord(null , null); }
			}

			nlapiLogExecution('DEBUG', 'testing', testing);
			if(context != 'PRODUCTION' || testing == 'T'){
				var sRequestor  = setupcfdi.getFieldValue('custrecord_cfdi_testrequestor');
				var sEntity		= setupcfdi.getFieldValue('custrecord_cfdi_entity_testing');
				var sUser 		= setupcfdi.getFieldValue('custrecord_cfdi_testrequestor');
				var sUserName   = setupcfdi.getFieldValue('custrecord_cfdi_username_testing');
			}
			else{
				var sRequestor  = setup.getFieldValue('custrecord_cfdi_requestor');
				var sEntity		= setup.getFieldValue('custrecord_cfdi_entity');
				var sUser 		= setup.getFieldValue('custrecord_cfdi_user');
				var sUserName   = setup.getFieldValue('custrecord_cfdi_username');
			}

			var IdPath = scriptDeployment.getFieldValue( 'custscript_id_field_path');
			if(IdPath){ var path = setup.getFieldValue(IdPath) + "\\" + tranid + ".xml"; }
			else{ var path = setup.getFieldValue('custrecord_cfdi_path') + "\\" + tranid + ".xml"; }

			var xml = invoice.getFieldValue(IdXMLBody);
			var validaTimbrado  = scriptDeployment.getFieldValue('custscript_valida_timbrado');
			if(!xml){
				try	{
					var url = nlapiResolveURL("SUITELET", 'customscript_cfdi', 'customdeploy_massinvoicing_aux_s', true) +
					 		         "&invoiceid=" + invoiceId + "&idsetup=" + setup.getId() + '&type=invoice';
					//nlapiLogExecution('DEBUG', 'url', url);
					var objResponse = nlapiRequestURL(url);
					bodytext        = (objResponse.getBody());
					detailRec.setFieldValue('custrecord_mipd_xml_sent', bodytext);

				}catch(e) {
					detailRec.setFieldValue('custrecord_mipd_commets', 'Suitelet Call Error');
					detailRec.setFieldValue('custrecord_mipd_processed', 'T');
					var detailRecId = nlapiSubmitRecord(detailRec);
					nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
					nlapiLogExecution('DEBUG', 'Error Calling Suitelet', e.message);
					continue;
				}

				if(SaveXMLinDisk == 'T' && bodytext){ var res = nlCreateTextFileToEInvoice(path, bodytext, newline); }

				if(bodytext){
					if(validaTimbrado == 'T'){
						var valida = nsoSendToWS(5, tranid, '', invoiceId, wtype, sRequestor, sEntity, sUser, sUserName, invoice, scriptDeployment);
					}
					else{ var valida = ''; }

					if (!valida){
						var docXml = nsoSendToWS(0, bodytext, 'XML PDF', invoiceId, wtype, sRequestor, sEntity, sUser, sUserName, invoice, scriptDeployment);

						if (!docXml)	{
							var invoice = nlapiLoadRecord('invoice', invoiceId);
							var xmlFileId = invoice.getFieldValue('custbody_xml_file');
							var pdfFileId = invoice.getFieldValue('custbody_refpdf');

							detailRec.setFieldValue('custrecord_mipd_xml', xmlFileId);
							detailRec.setFieldValue('custrecord_mipd_pdf', pdfFileId);
							detailRec.setFieldValue('custrecord_mipd_commets', 'Timbrado Exitoso');
							detailRec.setFieldValue('custrecord_mipd_processed', 'T');
							var detailRecId = nlapiSubmitRecord(detailRec);
							nlapiLogExecution('DEBUG', 'SUCCESS Detail Submited', detailRecId);

							var invoice = nlapiLoadRecord('invoice', invoiceId);
							invoice.setFieldValue('custbody_cfdi_timbrada', 'T');
							var invoiceId = nlapiSubmitRecord(invoice, false, true);
							nlapiLogExecution('DEBUG', 'invoiceId', invoiceId);
							numSuccess++;
						}
						else{
							docXml_cutted = docXml.substring(0, 295);
							nlapiLogExecution('DEBUG', 'docXml_cutted', docXml_cutted.length);
							detailRec.setFieldValue('custrecord_mipd_commets', docXml_cutted);
							detailRec.setFieldValue('custrecord_mipd_processed', 'T');
							var detailRecId = nlapiSubmitRecord(detailRec);
							nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
							nlapiLogExecution('DEBUG', 'Error Timbrado', docXml);
							numErrors++;
							continue;
						}
					}
					if (valida){
						//Not tested
						valida 	   = valida.split('-');
						var folio  = valida[0];
						var serie  = valida[1];
						var docXml = nsoSendToWS(3, folio, serie, invoiceId, wtype, sRequestor, sEntity, sUser, sUserName, invoice, scriptDeployment);

						if (!docXml){
							detailRec.setFieldValue('custrecord_mipd_processed', 'T');
							nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
						}
					}
				}//end if(bodytext){
			}
			else {
				detailRec.setFieldValue('custrecord_mipd_commets', 'Factura ya Enviada al SAT');
				detailRec.setFieldValue('custrecord_mipd_processed', 'T');
				var detailRecId = nlapiSubmitRecord(detailRec);
				nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
			}
			//_____________________________________________________________________________________________________________
			//End of Timbrado
		}
		catch(ex){
			nlapiLogExecution('DEBUG', 'Global Error', ex.message);

			detailRec.setFieldValue('custrecord_mipd_commets', 'Error al Facturar');
			detailRec.setFieldValue('custrecord_mipd_processed', 'T');
			var detailRecId = nlapiSubmitRecord(detailRec);
			nlapiLogExecution('DEBUG', 'Detail Submited', detailRecId);
			continue;
		}
	}

	nlapiLogExecution('DEBUG', 'NO more Invoices');
	var massRecord = nlapiLoadRecord('customrecord_nso_massinvoicing_process', massProcesId);
	nlapiLogExecution('DEBUG', 'massRecord', massRecord);
	massRecord.setFieldValue('custrecord_mip_process_status', 3);//Finished
	var massProcesId = nlapiSubmitRecord(massRecord);
	nlapiLogExecution('DEBUG', 'massProcesId', massProcesId);
	//_____________________________________________________________________________________________________________
	//Sending Notification mainline
	var recipientsTXT = setUpRecord.getFieldValue('custrecord_mips_notifying_emails') || '';
	var recipients    = recipientsTXT.split(',');
	var massProcesURL = nlapiResolveURL('RECORD', 'customrecord_nso_massinvoicing_process', massProcesId);

	var body 	= 'Buen día.<br><br>'
	body    	+= 'Se ha concluido el proceso de facturación y timbrado masivo automático<br><br>';
	//body 		+= lineCount + ' Ordenes de Venta incluidas en la Solicitud.<br>';
	//body 		+= numSuccess + ' Ordenes Facturadas y timbradas exitosamente.<br>';
	//body 		+= numErrors + ' Ordenes con errores en el timbrado.<br>';
	//body 		+= numNoinvoiced + ' Ordenes No facturadas por falta de datos (RFC, metodo de Pago, forma de Pago o Uso CFDi).<br><br>';
	var url_label         = '<br>Haz click <A HREF="' + massProcesURL +'">aquí</A> para ir al registro que contiene los detalles.';
	body += url_label;
	nlapiSendEmail(user_id, user_id, 'Facturacion y Timbrado Masivo', body, recipients);
	nlapiLogExecution('DEBUG', 'e-mail sent');

}

//____________________________________________________________________________________________________________________________________-
//____________________________________________________________________________________________________________________________________-
//Auxiliary Functions
//A

function getSalesOrderCreators(search, startDate, endDate){
    var salesOrders = (search || []).map(function (current) {
        return current.getId();
    });
    var filters = [
        new nlobjSearchFilter('type', 'systemNotes', 'is', 'T'),
        new nlobjSearchFilter('mainline', null, 'is', 'T'),
        new nlobjSearchFilter('type', null, 'anyof', 'SalesOrd'),
        new nlobjSearchFilter('status', null, 'anyof', 'SalesOrd:F')];
    var columns = [];
    columns.push(new nlobjSearchColumn('name', 'systemNotes'));
    var salesEntities = (nlapiSearchRecord('transaction', null, filters, columns) || []).reduce(function (newDict, current) {
        newDict[current.getId()] = {};
        newDict[current.getId()]['entityId'] = current.getValue('name', 'systemNotes');
        newDict[current.getId()]['name'] = current.getText('name', 'systemNotes');
        return newDict;
    }, {});
    nlapiLogExecution('debug','ENTITIES',JSON.stringify(salesEntities));
    return salesEntities;
}

function nlGetSetupRecord(subsidiary, location){
	var retval     = null;
	var index      = 0;
	var filters    = new Array();
	var scriptDeployment = nlapiLoadRecord('scriptdeployment', 908);//Gral|CFDi|Cliente, applies to Invoice, customdeploy1
	var registro   = scriptDeployment.getFieldValue( 'custscript_id_setup_invoice');
	var subidrec   = scriptDeployment.getFieldValue( 'custscript_id_subsidiary_regsetup');
	var locidrec   = scriptDeployment.getFieldValue( 'custscript_id_location_regsetup');
	if(subsidiary) {
		if (subidrec){
			filters[index]  = new nlobjSearchFilter(subidrec, null, "anyof", subsidiary);
			index += 1;
		}
		else{
			filters[index]  = new nlobjSearchFilter("custrecord_cfdi_subsidiary", null, "anyof", subsidiary);
			index += 1;
		}
	}

	if(location) {
		if(locidrec){
			filters[index]  = new nlobjSearchFilter(locidrec, null, "anyof", location);
			index += 1;
		}
		else{
			filters[index]  = new nlobjSearchFilter("custrecord_cfdi_location", null, "anyof", location);
			index += 1;
		}
	}
	if(registro){
		var results = nlapiSearchRecord(registro, null, filters, null);
		if(results != null && results.length > 0){
			retval = nlapiLoadRecord(results[0].getRecordType(), results[0].getId()) ;
		}
		else{
			nlapiLogExecution('DEBUG', 'ERROR at nlGetSetupRecord', "No se encontro el registro de configuracion de la factura electronica.")
		}
	}
	return retval;
}

function nlCreateTextFileToEInvoice(path, text, newline){
	var retval = false;

	try{
		var objFSO = new NSObjFSO();
		var folder = objFSO.getParentFolderName(path);
		var file   = objFSO.getFileName(path);

		if(objFSO.folderExists(folder)){
			if(file != ''){
				nlCreateTextFile(path, text, newline);
				retval = true;
			}
			else{
				nlapiLogExecution('DEBUG', 'Error at folderExists', 'Nombre de archivo no especificado!');
			}
		}
		else{
			nlapiLogExecution('DEBUG', 'Error at folderExists Else', 'La ruta especificada no existe!');
		}
	}
	catch(err){
		nlapiLogExecution('DEBUG', 'Error at nlCreateTextFileToEInvoice', err.description);
	}

	return retval;
}

//=================================================================================================================================
// Script File	 : Gral_NSOSendXMLtoWS.js
// Script Type   : library
// Author		 : Ivan Gonzalez - Netsoft
// Date			 : 29-04-2015
// Base			 : McGeever
//=================================================================================================================================

function nsoSendToWS(sAccion, sData1, sData2, wId, wtype, sRequestor, sEntity, sUser, sUserName, wrecord, scriptDeployment)
{
	var retval       = true;
	var sTransaction = '';
	var sData3       = "";
	var IdXMLBody    = scriptDeployment.getFieldValue('custscript_idxml_field_cli');
	var IdPDFBody    = scriptDeployment.getFieldValue('custscript_idpdf_field_cli');
	if (IdPDFBody == null || IdPDFBody == ''){IdPDFBody = 'custbody_cfdi_pdf'}
	if (IdXMLBody == null || IdXMLBody == ''){IdXMLBody = 'custbody_cfdixml'}
	switch (sAccion){
		case 0:
			sTransaction = 'CONVERT_NATIVE_XML';
			break;
		case 1:
			sTransaction = 'CANCEL_XML';
			break;
		case 2:
			sTransaction = 'GET_MONTHLY_REPORT';
			break;
		case 3:
			sTransaction = 'GET_DOCUMENT';
			break;
		/*case 4:
			sTransaction = 'VALIDATE_DOCUMENT';
			break;*/
		case 5:
			sTransaction = 'LOOKUP_ISSUED_INTERNAL_ID';
			break;
		case 6:
			sTransaction = 'RETRIEVE_DOCUMENT';
			break;
		case 4:
			sTransaction = 'VALIDATE_CERT';
			break;
		case 8:
			sTransaction = 'VALIDATE_DOCUMENT_EX';
			break;


	}

	if(sTransaction == 'GET_DOCUMENT' || sTransaction == 'RETRIEVE_DOCUMENT')	{
    	sData3 = 'XML PDF';
	}

	if (sData1){
		sData1 = sData1.replace(/\&/g,'&amp;');
		sData1 = sData1.replace(/</g,'&lt;');
		sData1 = sData1.replace(/>/g,'&gt;');
	}

	var sXml = '';
	sXml += '<?xml version=\"1.0\" encoding=\"utf-8\"?> ';
	sXml += '<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> ';
	sXml += '<soap:Body> ';
	sXml += '<RequestTransaction xmlns=\"http://www.fact.com.mx/schema/ws\"> ';
	sXml += '<Requestor>' + sRequestor + '</Requestor> ';
	sXml += '<Transaction>' + sTransaction + '</Transaction> ';
	sXml += '<Country>MX</Country> ';
	sXml += '<Entity>' + sEntity + '</Entity> ';
	sXml += '<User>' + sUser + '</User> ';
	sXml += '<UserName>' + sUserName + '</UserName> ';
	sXml += '<Data1>' + sData1 + '</Data1> ';
	sXml += '<Data2>' + sData2 + '</Data2> ';
	sXml += '<Data3>' + sData3 + '</Data3> ';
	sXml += '</RequestTransaction> ';
	sXml += '</soap:Body> ';
	sXml += '</soap:Envelope> ';


	var headers = new Array();
	headers['Content-Type']   = 'text/xml; charset=utf-8';
	headers['Content-Length'] = '"' + sXml.length + '"';
	headers['SOAPAction']     = 'http://www.fact.com.mx/schema/ws/RequestTransaction';


	try{
		if (sEntity == 'AAA010101AAA'){
			var sURL = 'https://www.mysuitetest.com/mx.com.fact.wsfront/factwsfront.asmx';
		}
		else{
			var sURL = 'https://www.mysuitecfdi.com/mx.com.fact.wsfront/factwsfront.asmx';
		}
		if (sEntity == 'AAA010101AAA'){
			//sXml = utf8_encode(sXml)
			//var valueBody =  consume_api(sData1, sURL, sRequestor, sTransaction, sEntity, sUser, sUserName, sData2, sData3);
			var sResponse = nlapiRequestURL( sURL, sXml, headers);
			var valueBody  = sResponse.getBody();
		}
		else{
			var sResponse = nlapiRequestURL( sURL, sXml, headers);
			var valueBody  = sResponse.getBody();
		}
		//----> Obtiene el cuerpo del response

		var xmlResult = null;
	}
	catch (ex)
	{
		nlapiLogExecution('ERROR', ex instanceof nlobjError ? ex.getCode() : "CUSTOM_ERROR_CODE",
				ex instanceof nlobjError ? ex.getDetails() : 'JavaScript Error: ' + (ex.message != null ? ex.message : ex));
	}
	//----> Valida que el resultado no de mensaje de Error
	if (sAccion != 3){
		retval = nsoValidaResponse(valueBody);
	}
	if(retval == true){
		if (sAccion == 5 ){
			var oXml = '';
			var nodeValue = '';
			oXml = nlapiStringToXML(valueBody);
			var retval    = nlapiSelectValue(oXml,"//*[name()='ResponseData1']");
			if (retval > 0){
				var values = new Array();
				nodeValue = nlapiSelectValue(oXml,"//*[name()='ResponseData2']");
				if(nodeValue != null && nodeValue != ""){
					var valXMl = decode64(nodeValue);
					valXMl = valXMl.replace(/\n/g, "");
					valXMl = nlapiStringToXML(valXMl);
					var uuid = nlapiSelectValue(valXMl,"//*[name()='uuid']");
					var batch  = nlapiSelectValue(valXMl,"//*[name()='batch']");
					var serial = nlapiSelectValue(valXMl,"//*[name()='serial']");
					if ( batch != null && batch != '' && serial != null && batch != ''){
						xmlResult = batch+'-'+serial;
					}
				}
			}
		}
		if(sAccion == 0 || sAccion == 3 || sAccion == 6)
		{
			var oXml      = '';
			var nodeValue = '';
			oXml          = nlapiStringToXML(valueBody);
			var values    = new Array();
			nodeValue     = nlapiSelectValue(oXml,"//*[name()='ResponseData1']");
			var wrecord   = nlapiLoadRecord(wtype, wId);
			if(nodeValue != null && nodeValue != ""){
				values[0] = decode64(nodeValue);
				values[0] = values[0].replace(/Ã¡/g, "á");
				values[0] = values[0].replace(/Ã©/g, "é");
				values[0] = values[0].replace(/Ã­/g, "í");
				values[0] = values[0].replace(/Ã³/g, "ó");
				values[0] = values[0].replace(/Ãº/g, "ú");

				values[0] = values[0].replace(/Ã/g, "Á");
				values[0] = values[0].replace(/ Á/g, "É");
				values[0] = values[0].replace(/Á/g, "Í");
				values[0] = values[0].replace(/Á/g, "Ó");
				values[0] = values[0].replace(/Á/g, "Ú");

				values[0] = values[0].replace(/Á±/g, "ñ");
				values[0] = values[0].replace(/Á/g, "Ñ");

				values[0] = values[0].replace(/ÁÂ¤/g, "ä");
				values[0] = values[0].replace(/ÁÂ«/g, "ë");
				values[0] = values[0].replace(/ÁÂ¯/g, "ï");
				values[0] = values[0].replace(/ÁÂ¶/g, "ö");
				values[0] = values[0].replace(/ÁÂ¼/g, "ü");

				//values[0] = values[0].replace(/Á/g, "Ä");
				//values[0] = values[0].replace(/É/g, "Ë");
				//values[0] = values[0].replace(/Á/g, "Ï");
				//values[0] = values[0].replace(/Ó/g, "Ö");
				//values[0] = values[0].replace(/Ú/g, "Ü");

				values[0] = values[0].replace(/Â©/g, "©");
				values[0] = values[0].replace(/Â®/g, "®");
				values[0] = values[0].replace(/Â/g, "™");
				values[0] = values[0].replace(/ÁÂ/g, "Ø");
				values[0] = values[0].replace(/Âª/g, "ª");
				values[0] = values[0].replace(//g, "%");
				values[0] = values[0].replace(/ÁÂ/g, "Ç");
				try{

					if (values[0] != null && values[0] != ''){

						wrecord.setFieldValue(IdXMLBody, values[0] );
						//nlapiSubmitField(wtype, wId, IdXMLBody,  values[0] );

						var wxml =  nlapiStringToXML(values[0]);
						if (wxml != null && wxml != ''){
							var Comprobante = nlapiSelectNodes(wxml, "//*" );
							var TimbreFiscalDigital = nlapiSelectNodes(wxml,"//*[name()='tfd:TimbreFiscalDigital']" );
							var Folio = Comprobante[0].getAttribute('folio')||'';
                            if (Folio == ''){Folio = Comprobante[0].getAttribute('Folio')||'';}
							var UUID = TimbreFiscalDigital[0].getAttribute('UUID');
							nlapiLogExecution('DEBUG', 'Folio:  ', Folio);
							nlapiLogExecution('DEBUG', 'UUID:  ', UUID);
							if(Folio != null && Folio != ''){
								wrecord.setFieldValue("custbody_foliosat", Folio );
								//nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), "custbody_foliosat", Folio);
							}
							if (UUID != null && UUID != '')
							{
								wrecord.setFieldValue("custbody_uuid", UUID);
								//nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), "custbody_uuid", UUID);
							}
						}
					}
				}
				catch(ex){
					nlapiLogExecution('ERROR', ex instanceof nlobjError ? ex.getCode() : "CUSTOM_ERROR_CODE",
				ex instanceof nlobjError ? ex.getDetails() : 'JavaScript Error: ' + (ex.message != null ? ex.message : ex));
				}
			}//end if(nodeValue != null && nodeValue != ""){

			values[1] = nlapiSelectValue(oXml,"//*[name()='ResponseData3']");

			if (values[1] != null && values[1] != ''){
				try{
				wrecord.setFieldValue(IdPDFBody, values[1] );
				//nlapiSubmitField(wtype, wId, IdPDFBody, values[1] );
				}
				catch(ex){
					nlapiLogExecution('ERROR', ex instanceof nlobjError ? ex.getCode() : "CUSTOM_ERROR_CODE",
				ex instanceof nlobjError ? ex.getDetails() : 'JavaScript Error: ' + (ex.message != null ? ex.message : ex));
				}
			}
			nlapiSubmitRecord(wrecord, true, true);
		}//end if(sAccion == 0 || sAccion == 3)

		return xmlResult;
	}
	else{
		xmlResult = nsoValidaResponseError(valueBody);
		return xmlResult;
	}
}

function nsoValidaResponseError(valueBody)
{
	var retval = '';
	var oXml = nlapiStringToXML(valueBody);
	retval	 = nlapiSelectValue(oXml,"//*[name()='Data']");
	return retval;
}


function nsoValidaResponse(valueBody)
{
	var retval  = true;
	var sMsgbox = '';
	var oXml    = nlapiStringToXML(valueBody);
	var sResult  = nlapiSelectValue(oXml,"//*[name()='Result']");
	var sDescrip = nlapiSelectValue(oXml,"//*[name()='Description']");
	var Data	 = nlapiSelectValue(oXml,"//*[name()='Data']");

	if( sResult == 'false' ){
		sMsgbox += 'Descripcion: ' + Data + '\n';
		nlapiLogExecution('DEBUG', 'Node Result False','Se ha generado el siguiente mensaje: \n' + sMsgbox);
		retval = false;
	}
	return retval;
}


function consume_api(Data1, sURL, sRequestor, sTransaction, sEntity, sUser, sUserName, Data2, Data3){

	var xmlhttp = new XMLHttpRequest();;

	/*if (window.XMLHttpRequest){
		xmlhttp = new XMLHttpRequest();
	} else {
		xmlHttp = new ActiveXObject('MSXML2.XMLHTTP.3.0');
	}*/

	if( Data2 == '' || Data2 == null ){
		Data2 = 'XML PDF';
	}
	Data1 = utf8_encode(Data1);

	var sXml = '';
	sXml += '<?xml version=\"1.0\" encoding=\"utf-8\"?> ';
	sXml += '<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> ';
	sXml += '<soap:Body> ';
	sXml += '<RequestTransaction xmlns=\"http://www.fact.com.mx/schema/ws\"> ';
	sXml += '<Requestor>' + sRequestor + '</Requestor> ';
	sXml += '<Transaction>' + sTransaction + '</Transaction> ';
	sXml += '<Country>MX</Country> ';
	sXml += '<Entity>' + sEntity + '</Entity> ';
	sXml += '<User>' + sUser + '</User> ';
	sXml += '<UserName>' + sUserName + '</UserName> ';
	sXml += '<Data1>' + Data1 + '</Data1> ';
	sXml += '<Data2>' + Data2 + '</Data2> ';
	sXml += '<Data3>' + Data3+ '</Data3> ';
	sXml += '</RequestTransaction> ';
	sXml += '</soap:Body> ';
	sXml += '</soap:Envelope> ';

	xmlhttp.open("POST", sURL ,false);

	xmlhttp.setRequestHeader("Content-Type", "text/xml");
	xmlhttp.send(sXml);
	var res = xmlhttp.responseText;
	return res;
}



//--------------------------------------------------------------------------------------------------------------------
//Function
//Description: convert base64 Encoding/Decoding
//--------------------------------------------------------------------------------------------------------------------

var keyStr = "ABCDEFGHIJKLMNOP" +
               "QRSTUVWXYZabcdef" +
               "ghijklmnopqrstuv" +
               "wxyz0123456789+/" +
               "=";

  function encode64(input) {
     input = escape(input);
     var output = "";
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;

     do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
           enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
           enc4 = 64;
        }

        output = output +
           keyStr.charAt(enc1) +
           keyStr.charAt(enc2) +
           keyStr.charAt(enc3) +
           keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
     } while (i < input.length);

     return output;
  }

  function decode64(input) {
     var output = "";
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;

     // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
     var base64test = /[^A-Za-z0-9\+\/\=]/g;
     if (base64test.exec(input)) {
        alert("There were invalid base64 characters in the input text.\n" +
              "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
              "Expect errors in decoding.");
     }
     input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

     do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
           output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
           output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

     } while (i < input.length);

     return unescape(output);
  }


//===============================================================================================
//it is a private function for internal use in utf8Encode function

/* UTF8 encoding/decoding functions
 * Copyright (c) 2006 by Ali Farhadi.
 * released under the terms of the Gnu Public License.
 * see the GPL for details.
 *
 * Email: ali[at]farhadi[dot]ir
 * Website: http://farhadi.ir/
 */

//an alias of String.fromCharCode
function chr(code)
{
	return String.fromCharCode(code);
}

//returns utf8 encoded charachter of a unicode value.
//code must be a number indicating the Unicode value.
//returned value is a string between 1 and 4 charachters.
function code2utf(code)
{
	if (code < 128) return chr(code);
	if (code < 2048) return chr(192+(code>>6)) + chr(128+(code&63));
	if (code < 65536) return chr(224+(code>>12)) + chr(128+((code>>6)&63)) + chr(128+(code&63));
	if (code < 2097152) return chr(240+(code>>18)) + chr(128+((code>>12)&63)) + chr(128+((code>>6)&63)) + chr(128+(code&63));
}

//it is a private function for internal use in utf8Encode function
function _utf8Encode(str)
{
	var utf8str = new Array();
	for (var i=0; i<str.length; i++) {
		utf8str[i] = code2utf(str.charCodeAt(i));
	}
	return utf8str.join('');
}

//Encodes a unicode string to UTF8 format.
function utf8Encode(str)
{
	var utf8str = new Array();
	var pos,j = 0;
	var tmpStr = '';

	while ((pos = str.search(/[^\x00-\x7F]/)) != -1) {
		tmpStr = str.match(/([^\x00-\x7F]+[\x00-\x7F]{0,10})+/)[0];
		utf8str[j++] = str.substr(0, pos);
		utf8str[j++] = _utf8Encode(tmpStr);
		str = str.substr(pos + tmpStr.length);
	}

	utf8str[j++] = str;
	return utf8str.join('');
}

//it is a private function for internal use in utf8Decode function
function _utf8Decode(utf8str)
{
	var str = new Array();
	var code,code2,code3,code4,j = 0;
	for (var i=0; i<utf8str.length; ) {
		code = utf8str.charCodeAt(i++);
		if (code > 127) code2 = utf8str.charCodeAt(i++);
		if (code > 223) code3 = utf8str.charCodeAt(i++);
		if (code > 239) code4 = utf8str.charCodeAt(i++);

		if (code < 128) str[j++]= chr(code);
		else if (code < 224) str[j++] = chr(((code-192)<<6) + (code2-128));
		else if (code < 240) str[j++] = chr(((code-224)<<12) + ((code2-128)<<6) + (code3-128));
		else str[j++] = chr(((code-240)<<18) + ((code2-128)<<12) + ((code3-128)<<6) + (code4-128));
	}
	return str.join('');
}

//Decodes a UTF8 formated string
function utf8Decode(utf8str)
{
	var str = new Array();
	var pos = 0;
	var tmpStr = '';
	var j=0;
	while ((pos = utf8str.search(/[^\x00-\x7F]/)) != -1) {
		tmpStr = utf8str.match(/([^\x00-\x7F]+[\x00-\x7F]{0,10})+/)[0];
		str[j++]= utf8str.substr(0, pos) + _utf8Decode(tmpStr);
		utf8str = utf8str.substr(pos + tmpStr.length);
	}

	str[j++] = utf8str;
	return str.join('');
}

function isNull(value) {
    return (value == null) ? '' : value;
}


function MetPago(idMetdPago){
	var retval = '';
	if(idMetdPago){
		var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_cfdi_payment_met_nat', null, 'anyof', idMetdPago));

		var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_cfdi_payment_met_sat'));

		var searchresult  = nlapiSearchRecord('customrecord_cfdi_metododepago', null, filters, columns);
		nlapiLogExecution('DEBUG','searchresult: ' + searchresult);
		for(var i = 0 ; searchresult != null && i < searchresult.length; i++){
			var idMet          = searchresult[i].getText('custrecord_cfdi_payment_met_sat');
			if(idMet != null && idMet != ''){
				var arrayMP = new Array();
				arrayMP = idMet.split('-');
				if(arrayMP.length > 1){
					retval = arrayMP[0];
				}
			}
		}
	}
	return retval;
}
