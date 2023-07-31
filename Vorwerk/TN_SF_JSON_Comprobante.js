function TN_SF_xml_Comprobante(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	var Base64		= new MainBase64();
	var prefijo		= '';
	var search		= '';
	var serie		= '';
	var join 		= '';
	try
	{
		if(type != 'delete')
		{
			switch(recordType)
			{
				case 'customrecord_comisiones_gtm':
				{
					join	= 'custrecord_gtm_empleado';
					serie 	= 'GTM';
					prefijo = 'gtm';
					search	= 'customsearch_gtm_tn_sf_xml_comprobante';
				};break;
				
			}
			var filters									= new Array();
				filters.push(new nlobjSearchFilter('internalid',null,'is',recordId));
			var customsearch_tn_sf_xml_comprobante		= returnBlank(nlapiSearchRecord(recordType, search, filters, null));
			if(customsearch_tn_sf_xml_comprobante != '')
			{
				var _tn_sf_codigo_respuesta		= returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custbody_' + prefijo +  'tn_sf_codigo_respuesta'));
				var _tn_sf_mensaje_respuesta	= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custbody_' + prefijo +  'tn_sf_mensaje_respuesta'));
				if(_tn_sf_codigo_respuesta != 200)
				{		
					var NumCtaPago											= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_numcta',join));
	                var NumCtaPagoLongitud									= NumCtaPago.length;
	                var indiceInicial										= NumCtaPagoLongitud - 4 ;
	                var indiceFinal											= NumCtaPagoLongitud;
	                var ultimosDigitos										= NumCtaPago.slice(indiceInicial,indiceFinal);
					var tipoComprobante 									= 'egreso';
					var billstate											= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('billstate'));
						billstate											= getEstadosInfo('NombreCorto',billstate);
						billstate											= Base64.decode(billstate);
						billstate											= JSON.parse(billstate);
						billstate											= billstate.estadoName;
					var companyInfo 										= nlapiLoadConfiguration('companyinformation');
					var companyInfoName 									= returnBlank(companyInfo.getFieldValue('legalname'));
					var companyInfoAddress1									= returnBlank(companyInfo.getFieldValue('address1'));
					var companyInfoAddress2									= returnBlank(companyInfo.getFieldValue('address2'));
					var companyInfoCity										= returnBlank(companyInfo.getFieldValue('city'));
					var companyInfoState									= returnBlank(companyInfo.getFieldValue('state'));
						companyInfoState									= getEstadosInfo('NombreCorto',companyInfoState);
						companyInfoState									= Base64.decode(companyInfoState);
						companyInfoState									= JSON.parse(companyInfoState);
						companyInfoState									= companyInfoState.estadoName;
					var companyInfoCountry									= returnBlank(companyInfo.getFieldText('country'));
					var companyInfoZip										= returnBlank(companyInfo.getFieldValue('zip'));
					var companyInfoRFC										= returnBlank(companyInfo.getFieldValue('employerid'));
					var companyInfoFax										= returnBlank(companyInfo.getFieldValue('fax'));
					var companyInfoPhone									= returnBlank(companyInfo.getFieldValue('phone'));
					//var companyInfoRFC										= 'AAD990814BP7';
	        		var Comprobante 										= new Object();
	        			Comprobante.version 								= '3.2';
	        			Comprobante.serie 									= serie;
		        		Comprobante.folio 									= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('name'));
		        		Comprobante.tipoDeComprobante 						= tipoComprobante;
		        		Comprobante.LugarExpedicion 						= companyInfoCity + ', ' + companyInfoState + ', ' + companyInfoCountry + ', ' + companyInfoZip +  ', ' + companyInfoFax + ' / ' + companyInfoPhone;
		        		Comprobante.NumCtaPago								= ultimosDigitos;
		        		Comprobante.metodoDePago 							= 'Transferencia Electrónica';
		        		Comprobante.TipoCambio 								= 1.0;
		        		Comprobante.Moneda 									= 'MXN';
		        		Comprobante.fecha 									= stringDateTimeSF(nlapiDateToString(new Date()));
		        		Comprobante.formaDePago 							= 'Una Sola Exhibición';
		        		Comprobante.sello 									= '';
		        		Comprobante.noCertificado 							= '';
		        		Comprobante.certificado 							= '';
		        		Comprobante.subTotal 								= 0;
		        		Comprobante.descuento								= 0;
		        		Comprobante.total 									= 0;
		        		Comprobante.Emisor 									= new Object();
		        		Comprobante.Emisor.rfc								= companyInfoRFC;
		        		Comprobante.Emisor.nombre 							= companyInfoName;
		        		Comprobante.Emisor.DomicilioFiscal 					= new Object();
		        		Comprobante.Emisor.DomicilioFiscal.calle 			= companyInfoAddress1;
		        		Comprobante.Emisor.DomicilioFiscal.colonia 			= companyInfoAddress2;
		        		Comprobante.Emisor.DomicilioFiscal.municipio 		= companyInfoCity;
		        		Comprobante.Emisor.DomicilioFiscal.estado 			= companyInfoState;
		        		Comprobante.Emisor.DomicilioFiscal.pais 			= companyInfoCountry;
		        		Comprobante.Emisor.DomicilioFiscal.codigoPostal		= companyInfoZip;
		        		Comprobante.Emisor.ExpedidoEn 						= new Object();
		        		Comprobante.Emisor.ExpedidoEn.calle 				= companyInfoAddress1;
		        		Comprobante.Emisor.ExpedidoEn.colonia 				= companyInfoAddress2;
		        		Comprobante.Emisor.ExpedidoEn.municipio 			= companyInfoCity;
		        		Comprobante.Emisor.ExpedidoEn.estado 				= companyInfoState;
		        		Comprobante.Emisor.ExpedidoEn.pais 					= companyInfoCountry;
		        		Comprobante.Emisor.ExpedidoEn.codigoPostal			= companyInfoZip;
		        		Comprobante.Emisor.RegimenFiscal 					= new Array();
		        		Comprobante.Emisor.RegimenFiscal.push({Regimen:'Régimen General de Ley Personas Morales'});
		        		Comprobante.Receptor 								= new Object();
		        		Comprobante.Receptor.rfc 							= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_ce_rfc',join));
		        		Comprobante.Receptor.nombre							= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('altname',join));
		        		Comprobante.Conceptos 								= new Array();
			        		var Concepto 									= new Object();
				        		Concepto.cantidad 							= 1;
				        		Concepto.unidad 							= 'SC';
				        		Concepto.noIdentificacion					= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('entitynumber',join));
				        		Concepto.descripcion 						= 'PAGO DE COMPENSACIONES';
				        		Concepto.valorUnitario 						= 0;
				        		Concepto.importe 							= 0;
		        		Comprobante.Conceptos.push(Concepto);
		        		Comprobante.Impuestos 								= new Object();
		        		Comprobante.Impuestos.Retenciones					= new Array();
			        		var Retencion	 								= new Object();
			        			Retencion.impuesto 							= 'ISR';
			        			Retencion.importe 							= 0;
	        			Comprobante.Impuestos.Retenciones.push(Retencion);
	        			Comprobante.Complemento										= new Object();
	        			Comprobante.Complemento.Nomina								= new Object();
	        			Comprobante.Complemento.Nomina.Version						= 1.1;
	        			Comprobante.Complemento.Nomina.NumEmpleado					= 1.1;
	        			Comprobante.Complemento.Nomina.CURP							= 1.1;
	        			Comprobante.Complemento.Nomina.NumSeguridadSocial			= 1.1;
	        			Comprobante.Complemento.Nomina.FechaPago					= 1.1;
	        			Comprobante.Complemento.Nomina.FechaInicialPago				= 1.1;
	        			Comprobante.Complemento.Nomina.FechaFinalPago				= 1.1;
	        			Comprobante.Complemento.Nomina.NumDiasPagados				= 1.1;
	        			Comprobante.Complemento.Nomina.FechaInicioRelLaboral		= 1.1;
	        			Comprobante.Complemento.Nomina.PeriocidadPago				= 1.1;
	        			Comprobante.Complemento.Nomina.Percepciones					= new Object();
	        			Comprobante.Complemento.Nomina.Percepciones.TotalGravado	= 0;
	        			Comprobante.Complemento.Nomina.Percepciones.TotalExento		= 0;
	        			Comprobante.Complemento.Nomina.Percepciones					= new Object();
	        			Percepcion													= new Array();
	        			Comprobante.Complemento.Nomina.Deducciones					= new Object();
	        			Comprobante.Complemento.Nomina.Deducciones.TotalGravado		= 0;
	        			Comprobante.Complemento.Nomina.Deducciones.TotalExento		= 0;
	        			Deduccion											= new Array();
	        			
	        		var _tn_sf_xml_comprobante 						= JSON.stringify(Comprobante);
	        		var fields											= new Array();
	        			fields.push('custrecord_' + prefijo + '_xml_comprobante');
	        		var values 											= new Array();
	        			values.push(_tn_sf_xml_comprobante);
	        		nlapiSubmitField(recordType, recordId, fields, values);
				}
				else
				{
					nlapiLogExecution('ERROR', _tn_sf_codigo_respuesta, _tn_sf_mensaje_respuesta);
				}
			}
			else
			{
        		var fields						= new Array();
	    			fields.push('custrecord_' + prefijo + '_xml_comprobante');
	    		var values 						= new Array();
	    			values.push('');
	    		nlapiSubmitField(recordType, recordId, fields, values);
				nlapiLogExecution('ERROR', 'customsearch_tn_sf_xml_comprobante', customsearch_tn_sf_xml_comprobante);
			}
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
	  	if( e instanceof nlobjError )
	  	{
	  		var ecode 		 = returnBlank(e.getCode());
			var edetails 	 = returnBlank(e.getDetails());
			var eid 		 = returnBlank(e.getId());
			var einternalid	 = returnBlank(e.getInternalId());
			var estacktrace	 = returnBlank(e.getStackTrace());
			if(estacktrace != '')
			{
				estacktrace	 = estacktrace.join();
			}
			var euserevent 	 = returnBlank(e.getUserEvent());
			nlapiLogExecution( 'ERROR', 'ecode',ecode);
			nlapiLogExecution( 'ERROR', 'edetails',edetails);
			nlapiLogExecution( 'ERROR', 'eid',eid);
			nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
			nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
			nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
		}
	    else
	    {
	    	var errorString	 = e.toString();
	    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);   
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
        }
		var fields	= new Array();
			fields.push('custrecord_' + prefijo + '_xml_comprobante');
			fields.push('custrecord_' + prefijo + '_xml_datos_extra');
		var values 	= new Array();
			values.push('');
			values.push('');
		nlapiSubmitField(recordType, recordId, fields, values);
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}