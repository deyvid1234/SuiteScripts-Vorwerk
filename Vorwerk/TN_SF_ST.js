//===================================================================================================================================================================
// Script File	: TN_SF_ST.js
// Script Type  : User Event
// Description 	: url_b
// Author		: Unknown
// Date			: 29-12-2017
// Functions	:
//===================================================================================================================================================================

function TN_SF_ST(request,response)
{

	var Base64				= new MainBase64();
	var titleForm			= 'Timbrado de Nomina';
	var recordType			= returnBlank(request.getParameter('recordType'));
	var recordId			= returnBlank(request.getParameter('recordId'));
	var join				= '';
	var prefijo	 			= '';
	var search				= '';
	var folderID			= '';

	try
	{
		switch(recordType)
		{
			case 'customrecord_comisiones_gtm':
			{
				join			= 'custrecord_gtm_empleado';
				serie 			= 'GTM';
				prefijo	 		= 'gtm';
				search			= 'customsearch_gtm_tn_sf_st';
				folderID		= 1842;
			};break;
			case 'customrecord_comisiones_pre':
			{
				join			= 'custrecord_gtm_empleado';
				serie 			= 'PRE';
				prefijo	 		= 'pre';
				search			= 'customsearch_pre_tn_sf_st';
				folderID		= 1843;
			};break;
			case 'customrecord_comisiones_jdg':
			{
				join			= 'custrecord_jdg_empleado';
				serie 			= 'JDG';
				prefijo	 		= 'jdg';
				search			= 'customsearch_jdg_tn_sf_st';
				folderID		= 1844;
			};break;
		}

		var filters			= [];
        nlapiLogExecution('DEBUG', 'ID', recordId);
       nlapiLogExecution('DEBUG', 'type del ID del record cargado', typeof recordId);
      //new nlobjSearchFilter( 'custrecord_nso_year', null, 'is', year )
 		filters.push(new nlobjSearchFilter('internalid',null,'is',recordId));
		nlapiLogExecution('DEBUG', 'Busqueda', recordId + ' / ' + recordType);
        nlapiLogExecution('DEBUG', 'Record Type', recordType);
        nlapiLogExecution('DEBUG', 'Search', search);
      	nlapiLogExecution('DEBUG', 'filters', JSON.stringify(filters));
      
		var searchResults	= returnBlank(nlapiSearchRecord(recordType, search, filters, null));
		nlapiLogExecution('ERROR', 'searchResults', JSON.stringify(searchResults));
		if(searchResults != '')
		{
			nlapiLogExecution('DEBUG', 'Record Id', searchResults[0].getId());
			//if(searchResults[0].getId() != 9797){ return; }
			nlapiLogExecution('DEBUG', 'compensacion', recordId + ' / ' + recordType);
			var presentadora						= returnBlank(searchResults[0].getValue('altname',join));
    		var email								= returnBlank(searchResults[0].getValue('email',join));
            nlapiLogExecution('DEBUG', 'VALOR DE email', searchResults[0].getValue('email',join));
			var fecha								= returnBlank(searchResults[0].getValue('formuladate'));
			var numero								= returnBlank(searchResults[0].getValue('name'));
			var comprobante							= returnBlank(searchResults[0].getValue('custrecord_' + prefijo + '_xml_comprobante'));

			nlapiLogExecution("ERROR", 'Comprobante '+ searchResults[0].getId() +':: ', comprobante);

			var filtersFile							= new Array();
				filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'TN_SF_SE.json'));
			var columnsFile							= new Array();
				columnsFile.push(new nlobjSearchColumn('folder'));
			var searchFile							= returnBlank(nlapiSearchRecord('file', null, filtersFile, columnsFile));
			var FE_SF_SE_ID							= searchFile[0].getId();
			var dataFile							= nlapiLoadFile(FE_SF_SE_ID);
				dataFile							= returnBlank(dataFile.getValue());
			var esBase64Coded						= isBase64Coded(dataFile);
			if(esBase64Coded == true)
			{
				dataFile							= Base64.decode(dataFile);
			}
			var FE_SF_SE							= JSON.parse(dataFile);
			var usuario								= '';
			var password							= '';
			var url									= '';
			var value_user_pruebas					= Base64.decode(returnBlank(FE_SF_SE.custpage_user_pruebas));
			var value_password_pruebas				= Base64.decode(returnBlank(FE_SF_SE.custpage_password_pruebas));
			var value_url_timbrado_pruebas			= Base64.decode(returnBlank(FE_SF_SE.custpage_url_timbrado_pruebas));
			var value_user_produccion				= Base64.decode(returnBlank(FE_SF_SE.custpage_user_produccion));
			var value_password_produccion			= Base64.decode(returnBlank(FE_SF_SE.custpage_password_produccion));
			var value_url_timbrado_produccion		= Base64.decode(returnBlank(FE_SF_SE.custpage_url_timbrado_produccion));
			var value_ambiente_seleccion			= Base64.decode(returnBlank(FE_SF_SE.custpage_ambiente_seleccion));
			var token          ="";
			//Line added to test bug fix
			value_ambiente_seleccion = 'A';//Line added to test bug fix
			//nlapiLogExecution('DEBUG', 'Ambiente', value_ambiente_seleccion);
			//Line added to test bug fix
			if(value_ambiente_seleccion == 'A')
			{
				usuario 	= value_user_pruebas;
				password	= value_password_pruebas;
				url			= value_url_timbrado_pruebas;
				token
				= 'T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbXB3YVZxTHdOdHAwVXY2NTdJb1hkREtXTzE3dk9pMmdMdkFDR2xFWFVPUXpTUm9mTG1ySXdZbFNja3FRa0RlYURqbzdzdlI2UUx1WGJiKzViUWY2dnZGbFloUDJ6RjhFTGF4M1BySnJ4cHF0YjUvbmRyWWpjTkVLN3ppd3RxL0dJPQ.T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbFlVcU92YUJTZWlHU3pER1kySnlXRTF4alNUS0ZWcUlVS0NhelhqaXdnWTRncklVSWVvZlFZMWNyUjVxYUFxMWFxcStUL1IzdGpHRTJqdS9Zakw2UGRiMTFPRlV3a2kyOWI5WUZHWk85ODJtU0M2UlJEUkFTVXhYTDNKZVdhOXIySE1tUVlFdm1jN3kvRStBQlpLRi9NeWJrd0R3clhpYWJrVUMwV0Mwd3FhUXdpUFF5NW5PN3J5cklMb0FETHlxVFRtRW16UW5ZVjAwUjdCa2g0Yk1iTExCeXJkVDRhMGMxOUZ1YWlIUWRRVC8yalFTNUczZXdvWlF0cSt2UW0waFZKY2gyaW5jeElydXN3clNPUDNvU1J2dm9weHBTSlZYNU9aaGsvalpQMUxzUzM1NzFTN0NWSXRORWNjQUt2ZlkvMkI4THhub1VRK3V1WUtVdmJEZjZzdjJ6UHQ4d2cvVmZYZXZtalJaZDdlTWhHSkdCakEyWE1YeXVMb3dCVmY1dXNPMnZidnVEd0Yrei9JekFLa2dXSm1zMkRXazFuYjNyY240QjdkeVNKN1J1TjJpbURLL3Fwb2d1RjhYMHZxTXc9.-GcBKS6zKU6fDgVMuJP1d5U39j5NHKBxt_OQxHYw4Zs';
			}
			if(value_ambiente_seleccion == 'B')
			{
				usuario 	= value_user_produccion;
				password	= value_password_produccion;
				url			= value_url_timbrado_produccion;
				 token = "T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbXB3YVZxTHdOdHAwVXY2NTdJb1hkREtXTzE3dk9pMmdMdkFDR2xFWFVPUTQyWFhnTUxGYjdKdG8xQTZWVjFrUDNiOTVrRkhiOGk3RHladHdMaEM0cS8rcklzaUhJOGozWjN0K2h6R3gwQzF0c0g5aGNBYUt6N2srR3VoMUw3amtvPQ.T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbFlVcU92YUJTZWlHU3pER1kySnlXRTF4alNUS0ZWcUlVS0NhelhqaXdnWTRncklVSWVvZlFZMWNyUjVxYUFxMWFxcStUL1IzdGpHRTJqdS9Zakw2UGRPSk5iclZBMCt5U1FiSUdyZDlJWWNoYTIyUkRmd255Z2hxM0UvQWpCRjBoNXpQUUxlbkptNmE2c3dXUVRONlA3K0FjUUs1czJRY1FqR0g0NnJycDB2TmY2SFVUWDByR0xOVmVlZUhHbUdFTmlHTVJLNE5lVW03bnlxRFZTWHVEU3BvVWp6aDNyRVo2Y2hwdGxzQ1QwRkM2bXFIajFjZ1lVS2xLZlVJK1lzR1B2Zkt2Wmt6ckI4YmwyemVkTE9iVlBBelpkWlhDUk5NQW5aOVNrODV6VWtKTVlGemQwQjdaUTFiOVV4K2RheTlLZFJJNUQrNlVuUldTQ1RoRHFEZERQcm9jdmpkSlgzNk1ZYWJjZXo2bnJFeU5ES01BZXpQTXR6QVZUK2kvWThaR3NOa290ZER4dDhONjNzaHVYUDJleVZDbFl5eE5mZ082cldQVjhNN2Q3QzhmWjlwalhqeFRCZ0pWTXRYRklGYXlmM0t5L1NOTjJOMnJ3cjA0Y0g4T3A.iLYXnqKTakqJdAbDxlJYthJenBBDiokPONiGcZ-GoEc";
			}

			var responseCode = 0;

			var xmlB64 = nlapiEncrypt(comprobante, 'base64');
			nlapiLogExecution('ERROR', 'xmlB64', xmlB64);


			//_________________________________________________________________________________________________
			var columnsSetUp = [];
			columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_testing'));
          	columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_testrequestor'));
          	columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_username_testing'));
          	columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_entity_testing'));
			var configrecordTest = nlapiSearchRecord('customrecord_setup_cfdi', null, null, columnsSetUp)[0];

			var columnsSetUp = [];
			columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_requestor'));
			columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_username'));
			columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_user'));
			columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_entity'));
			columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_usuario'));
			columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdiparam_testing'));
			var configrecord = nlapiSearchRecord('customrecord_cfdisetup', null, null, columnsSetUp)[0];

			var Testing = configrecordTest.getValue('custrecord_cfdi_testing');
			//__________________________________________________________________________________________________
			
			if (Testing == 'T'){
				var sURL = 'https://www.mysuitetest.com/mx.com.fact.wsfront/factwsfront.asmx';
				var headers = { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://www.fact.com.mx/schema/ws/RequestTransaction','User-Agent-x': 'SuiteScript-Call' };
				var requestor = configrecordTest.getValue('custrecord_cfdi_testrequestor');
				var entity = configrecordTest.getValue('custrecord_cfdi_entity_testing');
				var user = configrecordTest.getValue('custrecord_cfdi_testrequestor');
				var userName = configrecordTest.getValue('custrecord_cfdi_username_testing');
			}else{
				var sURL = 'https://www.mysuitecfdi.com/mx.com.fact.wsfront/factwsfront.asmx';
				var requestor = configrecord.getValue('custrecord_cfdi_requestor');
				var entity = configrecord.getValue('custrecord_cfdi_entity');
				var user = configrecord.getValue('custrecord_cfdi_user');
				var userName = configrecord.getValue('custrecord_cfdi_username');
			}

			var sXml = '';
			//sXml += '<?xml version=\"1.0\" encoding=\"utf-8\"?> ';
			sXml += '<Envelope xmlns=\"http://schemas.xmlsoap.org/soap/envelope/\">\n';
			sXml += 	'<Body>\n';
			sXml += 		'<RequestTransaction xmlns=\"http://www.fact.com.mx/schema/ws\">\n';
			sXml += 			'<Requestor>' + requestor + '</Requestor>\n';
			sXml += 			'<Transaction>CONVERT_NATIVE_XML</Transaction>\n';
			sXml += 			'<Country>MX</Country>\n';
			sXml += 			'<Entity>' + entity + '</Entity>\n';
			sXml += 			'<User>' + user + '</User>\n';
			sXml += 			'<UserName>' + userName + '</UserName>\n';
			sXml += 			'<Data1>' + xmlB64 + '</Data1>\n';
			sXml += 			'<Data2>XML PDF</Data2>\n';
			sXml += 			'<Data3></Data3>\n';
			sXml += 		'</RequestTransaction>\n';
			sXml += 	'</Body>\n';
			sXml += '</Envelope>\n';
			nlapiLogExecution('ERROR', 'sXml', sXml);

			try{
				var objResponse = nlapiRequestURL(sURL, sXml, headers);
				responseCode = parseInt(objResponse.code);
				srtResponse = objResponse.body;
				nlapiLogExecution('DEBUG', 'srtResponse', srtResponse);
				var response = nlapiStringToXML(srtResponse);
				nlapiLogExecution('DEBUG', 'response', response);


				var Result = nlapiSelectValues(response, '//nlapi:Result')[0];	//true success; false failure
				var Code = nlapiSelectValues(response, '//nlapi:Code')[0];		//1 success
				nlapiLogExecution('DEBUG', 'Result & Code', 'Result: ' + Result + ' / Code: ' + Code );
				responseCode = Result == 'true' && Code == '1' ? 200 : 500;
				var xml_receivedB64 = JSON.stringify( nlapiSelectValues(response, '//nlapi:ResponseData1')[0] );
				nlapiLogExecution('DEBUG', 'xml_receivedB64', xml_receivedB64 );
				var pdf_receivedB64 = nlapiSelectValues(response, '//nlapi:ResponseData3')[0];
				nlapiLogExecution('DEBUG', 'pdf_receivedB64', pdf_receivedB64 );
				var _fe_xml_sat_name = JSON.stringify( nlapiSelectValues(response, '//nlapi:SuggestedFileName2')[0] );
				nlapiLogExecution('DEBUG', '_fe_xml_sat_name', _fe_xml_sat_name );
				var value_FileName = _fe_xml_sat_name;

			}catch(ex){
				nlapiLogExecution('ERROR', 'Fallo en Timbrado', ex.message);
				responseCode = 500;
				var responseError = ex.message;
			}

			var requestXML = sXml;

			switch(responseCode)
			{
				case 200:
				{
				    var _fe_xml_ntst		= requestXML;
				    var _fe_xml_ntst_name	= cfdiNOMBRE(('s' + '_' + recordType + '_' + recordId + ''),''); ;

					var _fe_xml_ntst_file	= nlapiCreateFile(_fe_xml_ntst_name, 'XMLDOC', _fe_xml_ntst);
				    	_fe_xml_ntst_file.setEncoding('UTF-8');
				    	_fe_xml_ntst_file.setFolder(folderID);
			    	var _fe_xml_ntst_id		= nlapiSubmitFile(_fe_xml_ntst_file);
						nlapiLogExecution('ERROR', 'Exito FIle XML Netsuite', _fe_xml_ntst_id);


//				    var _fe_xml_sat			= Base64.decode(value_ContentB64[0]);
				    var _fe_xml_sat			= Base64.decode(xml_receivedB64);
						nlapiLogExecution('DEBUG', '_fe_xml_sat', _fe_xml_sat);
//						var _fe_xml_sat_name	= returnBlank(value_FileName[0]);
				    var _fe_xml_sat_name	= 'xml_' + _fe_xml_sat_name;
				    var _fe_xml_sat_file	= nlapiCreateFile(_fe_xml_sat_name, 'XMLDOC', _fe_xml_sat);
				    	_fe_xml_sat_file.setEncoding('UTF-8');
				    	_fe_xml_sat_file.setFolder(folderID);
			    	var _fe_xml_sat_file_id = nlapiSubmitFile(_fe_xml_sat_file);
						nlapiLogExecution('ERROR', 'Exito FIle XML', _fe_xml_sat_file_id);

//				    var _fe_pdf				= returnBlank(value_ContentB64[1]);
						var _fe_pdf_file_id;
						try{
							var _fe_pdf				= pdf_receivedB64;
							var _fe_pdf_name		= 'pdf_' + returnBlank(value_FileName);
							var _fe_pdf_file		= nlapiCreateFile(_fe_pdf_name, 'PDF', _fe_pdf);
							_fe_pdf_file.setFolder(folderID);
							_fe_pdf_file_id		= nlapiSubmitFile(_fe_pdf_file);
							nlapiLogExecution('ERROR', 'Exito FIle PDF', _fe_xml_sat_file_id);
						}catch(ex){
							nlapiLogExecution('ERROR', 'Fallo creacion de archivo PDF', ex.message);
						}

				    var fields				= new Array();
				    	fields[0]			= 'custrecord_' + prefijo + '_xml_netsuite';
				    	fields[1]			= 'custrecord_' + prefijo + '_xml_sat';
				    	fields[2]			= 'custrecord_' + prefijo + '_pdf';
				    	fields[3]			= 'custrecord_' + prefijo + '_codigo_respuesta';
				    	fields[4]			= 'custrecord_' + prefijo + '_mensaje_respuesta';
				    var values				= new Array();
				    	values[0]			= _fe_xml_ntst_id;
				    	values[1]			= _fe_xml_sat_file_id;
				    	values[2]			= _fe_pdf_file_id || null;
				    	values[3]			= responseCode;
				    	values[4]			= 'Timbrado exitoso.';

				    nlapiSubmitField(recordType, recordId, fields, values);
					var filtersFile				= new Array();
						filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'TN_SF_SE.json'));
					var columnsFile				= new Array();
						columnsFile.push(new nlobjSearchColumn('folder'));
					var searchFile				= returnBlank(nlapiSearchRecord('file', null, filtersFile, columnsFile));
					var FE_SF_SE_ID				= searchFile[0].getId();
					var dataFile				= nlapiLoadFile(FE_SF_SE_ID);
						dataFile				= returnBlank(dataFile.getValue());
					var esBase64Coded			= isBase64Coded(dataFile);
					if(esBase64Coded == true)
					{
						dataFile				= Base64.decode(dataFile);
					}
					var FE_SF_SE				= JSON.parse(dataFile);
					var _ce_timbrado_activar	= Base64.decode(returnBlank(FE_SF_SE.custpage_ce_timbrado_activar));
					if(_ce_timbrado_activar == 'T')
					{
						var compaynyInfo 			= nlapiLoadConfiguration('companyinformation');
						var companyname 			= returnBlank(compaynyInfo.getFieldValue('companyname'));
						var legalname	 			= returnBlank(compaynyInfo.getFieldValue('legalname'));
						var _ce_timbrado_author		= Base64.decode(returnBlank(FE_SF_SE.custpage_ce_timbrado_author));
						var _ce_timbrado_cc			= Base64.decode(returnBlank(FE_SF_SE.custpage_ce_timbrado_cc));
						var _ce_timbrado_bcc		= Base64.decode(returnBlank(FE_SF_SE.custpage_ce_timbrado_bcc));
						var _ce_timbrado_asunto		= Base64.decode(returnBlank(FE_SF_SE.custpage_ce_timbrado_asunto));
						var _ce_timbrado_mensaje	= Base64.decode(returnBlank(FE_SF_SE.custpage_ce_timbrado_mensaje));
						var CC						= new Array();
						var BCC						= new Array();
						_fe_sf_se_cc				= stringToArray(_fe_sf_se_cc, 59);
						_fe_sf_se_bcc				= stringToArray(_fe_sf_se_bcc, 59);
						_ce_timbrado_cc				= stringToArray(_ce_timbrado_cc, 59);
						_ce_timbrado_bcc			= stringToArray(_ce_timbrado_bcc, 59);
				    	CC 							= CC.concat(_fe_sf_se_cc,_ce_timbrado_cc);
				    	BCC 						= BCC.concat(_fe_sf_se_bcc,_ce_timbrado_bcc);
				    	CC 							= deleteElements(CC,'');
				    	BCC 						= deleteElements(BCC,'');
				    	CC 							= deleteDuplicateElements(CC);
				    	BCC 						= deleteDuplicateElements(BCC);
				    	CC 							= deleteNullOrUndefinedElements(CC);
				    	BCC 						= deleteNullOrUndefinedElements(BCC);
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.split('[presentadora]');
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.join(presentadora);
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.split('[numero]');
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.join(numero);
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.split('[fecha]');
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.join(fecha);
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.split('[companyname]');
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.join(companyname);
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.split('[legalname]');
			    		_ce_timbrado_asunto			= _ce_timbrado_asunto.join(legalname);
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.split('[presentadora]');
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.join(presentadora);
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.split('[numero]');
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.join(numero);
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.split('[fecha]');
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.join(fecha);
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.split('[companyname]');
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.join(companyname);
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.split('[legalname]');
			    		_ce_timbrado_mensaje		= _ce_timbrado_mensaje.join(legalname);
						var records		 			= new Array();
							records['recordtype'] 	= recordType;
							records['record'] 		= recordId;
						var attachments				= new Array();
							attachments.push(_fe_pdf_file);
							attachments.push(_fe_xml_sat_file);
						if(_ce_timbrado_author != '' && email != '' && _ce_timbrado_asunto != '' && _ce_timbrado_mensaje != '')
						{
							if(CC.length == 0)
							{
								CC = null;
							}
							if(BCC.length == 0)
							{
								BCC = null;
							}
                            nlapiLogExecution('DEBUG', 'VALOR DE CC', CC);
                            nlapiLogExecution('DEBUG', 'VALOR DE email', email);
                            nlapiLogExecution('DEBUG', 'VALOR DE BCC', BCC);
							nlapiSendEmail(_ce_timbrado_author, email, _ce_timbrado_asunto, _ce_timbrado_mensaje, CC, BCC, records,attachments);
						}
					}
			    	nlapiSetRedirectURL('RECORD', recordType, recordId, false, null);
				};break;
				case 500:
				{
					//var faultcode			= nlapiSelectValue(responseXMLObj, '//faultcode');
					//var faultstring			= nlapiSelectValue(responseXMLObj, '//faultstring');
					var descriptionRes 		= JSON.stringify( nlapiSelectValues(response, '//nlapi:Description')[0] );
					var hintRes 	   		= JSON.stringify( nlapiSelectValues(response, '//nlapi:Hint')[0] );
					var faultstring 	   	= JSON.stringify( nlapiSelectValues(response, '//nlapi:Data')[0] );

					var _fe_xml_ntst		= requestXML;
				    var _fe_xml_ntst_name	= cfdiNOMBRE(('s' + '_' + recordType + '_' + recordId + ''),''); ;

					var _fe_xml_ntst_file	= nlapiCreateFile(_fe_xml_ntst_name, 'XMLDOC', _fe_xml_ntst);
				    	_fe_xml_ntst_file.setEncoding('UTF-8');
				    	_fe_xml_ntst_file.setFolder(folderID);
			    	var _fe_xml_ntst_id		= nlapiSubmitFile(_fe_xml_ntst_file);
						nlapiLogExecution('ERROR', 'Exito FIle XML Netsuite', _fe_xml_ntst_id);

				    var fields				= new Array();
				    	fields[0]			= 'custrecord_' + prefijo + '_xml_netsuite';
				    	fields[1]			= 'custrecord_' + prefijo + '_xml_sat';
				    	fields[2]			= 'custrecord_' + prefijo + '_pdf';
				    	fields[3]			= 'custrecord_' + prefijo + '_codigo_respuesta';
				    	fields[4]			= 'custrecord_' + prefijo + '_mensaje_respuesta';
				    var values				= new Array();
				    	values[0]			= _fe_xml_ntst_id;
				    	values[1]			= '';
				    	values[2]			= '';
				    	values[3]			= Code;//faultcode;
				    	values[4]			= faultstring + '. Descripcion: ' + descriptionRes + ' / Sugerencia: ' + hintRes;
				    	nlapiLogExecution("ERROR", 'Error en consumo de Timbrado:', values[4]);
				    nlapiSubmitField(recordType, recordId, fields, values);
			    	nlapiSetRedirectURL('RECORD', recordType, recordId, false, null);
			    	nlapiLogExecution('ERROR', "500 redireccionado", recordType + ' - ' + recordId);
				};break;
				default:
				{

				};break;
			}
		}
		else
		{

			var message = 'No se pudo crear el archivo XML para enviar al SAT. Revisar datos de Empleado y de compensacion'
			nlapiSubmitField(recordType, recordId, 'custrecord_' + prefijo + '_mensaje_respuesta', message);
	    	nlapiSetRedirectURL('RECORD', recordType, recordId, false, null);
	    	nlapiLogExecution('ERROR', "empty redireccionado", "empty redireccionado");
		}
	}
	catch(e)
	{
		var companyConfig		= nlapiLoadConfiguration('companyinformation');
		var companyname			= returnBlank(companyConfig.getFieldValue('companyname'));
		var context				= nlapiGetContext();
	  	var company				= returnBlank(context.getCompany());
	  	var deploymentId		= returnBlank(context.getDeploymentId());
	  	var environment			= returnBlank(context.getEnvironment());
	  	var executionContext	= returnBlank(context.getExecutionContext());
	  	var logLevel			= returnBlank(context.getLogLevel());
	  	var name				= returnBlank(context.getName());
	  	var role				= returnBlank(context.getRole());
	  	var roleCenter			= returnBlank(context.getRoleCenter());
	  	var roleId				= returnBlank(context.getRoleId());
	  	var scriptId			= returnBlank(context.getScriptId());
	  	var user				= returnBlank(context.getUser());
    	var tituloFallo			= new String();
    	var mensajeFallo		= new String();
    	var data				= new Object();
    	var identacion			= '<td>&nbsp;</td><td>&nbsp;</td><td>ᐅ</td>';
	  	var author				= -5;
	  	var recipient			= 'carlos.alvarez@imr.com.mx';
	  	var subject				= '';
	  	var body 				= '';
  			body 			   += '<table>';
  				body 			   += '<tr><td><b>' + 'Company ID' 			+ '</b></td><td>&nbsp;</td><td>' + company 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Company' 			+ '</b></td><td>&nbsp;</td><td>' + companyname		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record Type' 		+ '</b></td><td>&nbsp;</td><td>' + recordType 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record ID' 			+ '</b></td><td>&nbsp;</td><td>' + recordId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Script ID' 			+ '</b></td><td>&nbsp;</td><td>' + scriptId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Deployment ID' 		+ '</b></td><td>&nbsp;</td><td>' + deploymentId 	+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Log Level' 			+ '</b></td><td>&nbsp;</td><td>' + logLevel 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Environment' 		+ '</b></td><td>&nbsp;</td><td>' + environment 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Execution Context' 	+ '</b></td><td>&nbsp;</td><td>' + executionContext + '</td></tr>';
  				body 			   += '<tr><td><b>' + 'User' 				+ '</b></td><td>&nbsp;</td><td>' + user 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Name' 				+ '</b></td><td>&nbsp;</td><td>' + name 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role' 				+ '</b></td><td>&nbsp;</td><td>' + role 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role Center' 		+ '</b></td><td>&nbsp;</td><td>' + roleCenter		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role ID' 			+ '</b></td><td>&nbsp;</td><td>' + roleId 			+ '</td></tr>';
  			body 			   += '</table>';
	  		body 			   += '<br>';
	  		body 			   += '<br>';
        if ( e instanceof nlobjError )
        {
        	var ecode 		 = returnBlank(e.getCode());
        	var edetails 	 = returnBlank(e.getDetails());
        	var eid 		 = returnBlank(e.getId());
        	var einternalid	 = returnBlank(e.getInternalId());
        	var estacktrace	 = returnBlank(e.getStackTrace());
        		estacktrace	 = estacktrace.join();
        	var euserevent 	 = returnBlank(e.getUserEvent());
        	tituloFallo		+= "<b>Ha ocurrido un error, debido a las siguientes razones:</b>";
        	mensajeFallo 	+= "<p>&nbsp;</p>";
	        	mensajeFallo 	+= '<table class=\"text\">';
	    		mensajeFallo	+= "<tr>" + identacion + "<td>" + '<b>Error Code: </b>' 		+ "</td><td>" + ecode		+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error Details: </b>' 		+ "</td><td>" + edetails	+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error ID: </b>'			+ "</td><td>" + eid			+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error Internal ID: </b>'	+ "</td><td>" + einternalid	+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error Stacktrace: </b>'	+ "</td><td>" + estacktrace	+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error User Event: </b>' 	+ "</td><td>" + euserevent 	+"</td></tr>";
        	mensajeFallo 	+= '</table>';
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
            nlapiLogExecution( 'ERROR', 'Error Code',ecode);
            nlapiLogExecution( 'ERROR', 'Error Detail',edetails);
            nlapiLogExecution( 'ERROR', 'Error ID',eid);
            nlapiLogExecution( 'ERROR', 'Error Internal ID',einternalid);
            nlapiLogExecution( 'ERROR', 'Error Stacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'Error User Event',euserevent);
        }
        else
        {
        	var errorString	 	= e.toString();
        	tituloFallo			= '<b>Ha ocurrido un error, debido a la siguiente raz&oacute;n:</b>';
        	mensajeFallo 		+= "<p>&nbsp;</p>";
        	mensajeFallo 		+= '<table class=\"text\">';
        		mensajeFallo 		+= "<tr>" + identacion + "<td>" + '<b>Unexpected Error: </b>' + "</td><td>" + errorString +"</td></tr>";
        	mensajeFallo 		+= '</table>';
        	body		 		+= "<p>&nbsp;</p>";
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
            nlapiLogExecution( 'ERROR', 'Unexpected Error',errorString );
        }
		mensajeFallo += "<br>Consulte a Soporte T&eacute;cnico y mueste este mensaje.";
		mensajeFallo += "<br><br>Puede continuar navegando en <b>NetSuite</b>";
		data.titleForm 						= titleForm;
		data.exito		 					= 'F';
		data.tituloFallo					= tituloFallo;
		data.mensajeFallo 					= mensajeFallo;
		data								= JSON.stringify(data);
		data   		 						= Base64.encode(data);
        var params_handler_error			= new Array();
	    	params_handler_error['data']	= data;
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
    	nlapiSetRedirectURL('SUITELET','customscript_tn_sf_he', 'customdeploy_tn_sf_he', false, params_handler_error);
		nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
  	}
}
