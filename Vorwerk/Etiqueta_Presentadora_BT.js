function Etiqueta_Presentadora_BT(type, form, request)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'view')
		{
			var titleForm		= 'Etiqueta de Presentadora';
			var Base64			= new MainBase64();
			var currentURL		= request.getURL();
			var index 			= currentURL.indexOf("/app");
			var host  			= currentURL.substring(0, index);		
			nlapiLogExecution('ERROR', 'host', host);
			var data			= '';
		    	data	  	   += host			+ String.fromCharCode(10);
		    	data	    	= Base64.encode(data);
		    var datos			= new Object();
		    	datos.empleado	= recordId;
		    	datos.type		= recordType;
		    	datos.titleForm	= titleForm;
		    	datos.host		= host;
		    	datos			= JSON.stringify(datos);
				datos   		= Base64.encode(datos);
	    	var url 			= nlapiResolveURL("SUITELET", "customscript_etiquetas_presentadora_form", "customdeploy_etiquetas_presentadora_form", false);
				//url 	   	   += "&data=" 	+ data; 
				url			   += "&data=" + datos;
			form.addButton("custpage_imp_poliza", titleForm, "window.open('"+url+"')");		
		}
	}
	catch(e)
	{
    	Generic_HE_Catch_SS(e,recordType,recordId);
  	}
}
function Polizas_AfterSubmit(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type != 'delete')
		{
			var record						= nlapiLoadRecord(recordType, recordId);
			var _ce_tipo_de_poliza			= returnNumber(record.getFieldValue('custbody_ce_tipo_de_poliza'));
			var filters_tran_tipo_poliza	= new Array();
				filters_tran_tipo_poliza.push(new nlobjSearchFilter('custrecord_tran_tipo_poliza_record_type', null, 'is', recordType));
			var columns_tran_tipo_poliza	= new Array();
				columns_tran_tipo_poliza.push(new nlobjSearchColumn('name'));
				columns_tran_tipo_poliza.push(new nlobjSearchColumn('custrecord_tran_tipo_poliza_tipo_poliza'));
			var results_tran_tipo_poliza	= returnBlank(nlapiSearchRecord('customrecord_tran_tipo_poliza', null, filters_tran_tipo_poliza, columns_tran_tipo_poliza));
			if(results_tran_tipo_poliza != '')
			{
				var _tran_tipo_poliza_tipo_poliza 	= returnBlank(results_tran_tipo_poliza[0].getValue('custrecord_tran_tipo_poliza_tipo_poliza'));
				record.setFieldValue('custbody_transaccion_tipo_de_poliza',_tran_tipo_poliza_tipo_poliza);
			}
			var moneda_sat					= new String();
			var _ce_plz_xml_transaccion		= new String();
			var filters						= new Array();
			var columns						= new Array();
				columns.push(new nlobjSearchColumn('custrecord_cuenta_numero','account'));
				columns.push(new nlobjSearchColumn('type'));
				columns.push(new nlobjSearchColumn('exchangerate'));
				columns.push(new nlobjSearchColumn('currency'));
			var searchresults 				= getImpactGLedger(recordType,recordId,filters,columns);
			for(var i=0;i<searchresults.length;i++)
			{			
				var num_cta				= nlapiEscapeXML(searchresults[i].getValue('custrecord_cuenta_numero','account'));
				var memo 				= returnBlank(searchresults[i].getValue('memo'));
				var debitamount 	 	= returnNumber(searchresults[i].getValue('debitamount'));
				var creditamount 	 	= returnNumber(searchresults[i].getValue('creditamount'));
				var moneda 	 			= returnNumber(searchresults[i].getValue('currency'));
				var moneda_text			= nlapiEscapeXML(searchresults[i].getText('currency'));
				var tipo_cambio			= returnNumber(searchresults[i].getValue('exchangerate'));
				var concepto			= '';
				if(memo != '')
				{
					concepto = memo; 
				}
				else
				{
					concepto += returnBlank(searchresults[i].getText('type'));
					concepto += ' ';
					concepto += returnBlank(searchresults[i].getValue('tranid'));
					concepto += ' | ';
					concepto += searchresults[i].getId();
				}
				if(moneda_sat == '')
				{
					var filters						= new Array();
						filters.push(new nlobjSearchFilter('custrecord_ce_catalogo_monedas_mon_ntst', null, 'is',moneda));
					var _catalogo_monedas_asignadas = returnBlank(nlapiSearchRecord('customrecord_ce_catalogo_monedas', 'customsearch_catalogo_monedas_asignadas', filters, null));
					if(_catalogo_monedas_asignadas != '')
					{
						moneda_sat	= nlapiEscapeXML(_catalogo_monedas_asignadas[0].getValue('name'));
					}
					else
					{
						moneda_sat	= moneda_text;
					}
				}
				concepto					= concepto.substring(0, 300);
				debitamount 			   /= returnNumber(tipo_cambio);
				debitamount					= debitamount.toFixed(2);
				creditamount 			   /= returnNumber(tipo_cambio);
				creditamount	 			= creditamount.toFixed(2);
				tipo_cambio		 			= tipo_cambio.toFixed(2);
				_ce_plz_xml_transaccion	   += "<PLZ:Transaccion NumCta='" + num_cta + "' Concepto='" +  concepto + "' Debe='" + debitamount + "' Haber='" + creditamount + "' Moneda='" + moneda_sat + "' TipCamb='" + tipo_cambio + "'>";
				switch(_ce_tipo_de_poliza)
				{
					case 1:
					{
						var _ce_numero			= returnBlank(record.getFieldValue('custbody_ce_numero'));
						var _ce_banco			= returnBlank(record.getFieldText('custbody_ce_banco'));
							_ce_banco			= stringToArray(_ce_banco, 32);
							_ce_banco			= _ce_banco[0];
						var _ce_cuenta_origen	= returnBlank(record.getFieldValue('custbody_ce_cuenta_origen'));
						var _ce_fecha			= returnBlank(record.getFieldValue('custbody_ce_fecha'));
							_ce_fecha			= stringDateTimeSF(_ce_fecha,1);
						var _ce_monto			= returnNumber(record.getFieldValue('custbody_ce_monto'));
						var _ce_beneficiario	= returnBlank(record.getFieldValue('custbody_ce_beneficiario'));
							_ce_beneficiario	= _ce_beneficiario.substring(0, 300);
						var _ce_rfc				= returnBlank(record.getFieldValue('custbody_ce_rfc'));
						_ce_plz_xml_transaccion += "<PLZ:Cheque Num='" + _ce_numero + "' Banco='" +  _ce_banco + "' CtaOri='" + _ce_cuenta_origen + "' Fecha='" +  _ce_fecha + "' Monto='" +  _ce_monto + "' Benef='" +  _ce_beneficiario +"' RFC='" +  _ce_rfc + "' />";
					};break;
					case 2:
					{
						var _ce_cuenta_origen 	= returnBlank(record.getFieldValue('custbody_ce_cuenta_origen'));
						var _ce_banco_origen 	= returnBlank(record.getFieldText('custbody_ce_banco_origen'));
							_ce_banco_origen	= stringToArray(_ce_banco_origen, 32);
							_ce_banco_origen	= _ce_banco_origen[0];
						var _ce_monto 			= returnNumber(record.getFieldValue('custbody_ce_monto'));
						var _ce_cuenta_destino 	= returnBlank(record.getFieldValue('custbody_ce_cuenta_destino'));
						var _ce_banco_destino 	= returnBlank(record.getFieldText('custbody_ce_banco_destino'));
							_ce_banco_destino	= stringToArray(_ce_banco_destino, 32);
							_ce_banco_destino	= _ce_banco_destino[0];
						var _ce_fecha 			= returnBlank(record.getFieldValue('custbody_ce_fecha'));
							_ce_fecha			= stringDateTimeSF(_ce_fecha,1);
						var _ce_beneficiario 	= returnBlank(record.getFieldValue('custbody_ce_beneficiario'));
							_ce_beneficiario	= _ce_beneficiario.substring(0, 300);
						var _ce_rfc			 	= returnBlank(record.getFieldValue('custbody_ce_rfc'));
						_ce_plz_xml_transaccion += "<PLZ:Transferencia CtaOri='" + _ce_cuenta_origen + "' BancoOri='" +  _ce_banco_origen + "' Monto='" + _ce_monto + "' CtaDest='" +  _ce_cuenta_destino + "' BancoDest='" +  _ce_banco_destino + "' Fecha='" +  _ce_fecha + "' Benef='" +  _ce_beneficiario + "' RFC='" +  _ce_rfc +"' />";
					};break;
					case 3:
					{
						var _ce_uuid_cfdi	= returnBlank(record.getFieldValue('custbody_ce_uuid_cfdi'));
						var _ce_monto		= returnNumber(record.getFieldValue('custbody_ce_monto'));
						var _ce_rfc			= returnBlank(record.getFieldValue('custbody_ce_rfc'));
						if(_ce_uuid_cfdi != '' && _ce_monto != '' && _ce_rfc != '')
						{
							_ce_plz_xml_transaccion += "<PLZ:Comprobantes UUID_CFDI='" + _ce_uuid_cfdi + "' Monto='" +  _ce_monto + "' RFC='" + _ce_rfc + "' />";
						}
					};break;
				}
				_ce_plz_xml_transaccion	 += "</PLZ:Transaccion>";
			}
			record.setFieldValue('custbody_ce_plz_xml_transaccion',_ce_plz_xml_transaccion);
			nlapiSubmitRecord(record, true, true);
		}
	}
	catch(e)
	{
    	Generic_HE_Catch_SS(e,recordType,recordId);
  	}
}