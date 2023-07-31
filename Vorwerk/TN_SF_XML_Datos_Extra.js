function TN_SF_JSON_Datos_Extra(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type != 'delete')
		{
			var filters									= new Array();
				filters.push(new nlobjSearchFilter('internalid',null,'is',recordId));
			var customsearch_fe_sf_json_datos_extra			= returnBlank(nlapiSearchRecord(recordType, 'customsearch_gtm_tn_sf_json_datos_extra', filters, null));
			if(customsearch_fe_sf_json_datos_extra != '')
			{
				var _fe_sf_codigo_respuesta		= returnNumber(customsearch_fe_sf_json_datos_extra[0].getValue('custbody_fe_sf_codigo_respuesta'));
				var _fe_sf_mensaje_respuesta	= returnBlank(customsearch_fe_sf_json_datos_extra[0].getValue('custbody_fe_sf_mensaje_respuesta'));
				if(_fe_sf_codigo_respuesta != 200)
				{		
					switch(recordType)
					{
						case 'invoice':
						{
							field_terms		= 'terms';
						};break;
						case 'creditmemo':
						{
							field_terms		= 'custbody_terminos';
						};break;
						default:
						{
							field_terms		= '';
						};break;
					}
					var companyInfo			= nlapiLoadConfiguration('companyinformation');
					var emisorTelFax		= returnBlank(companyInfo.getFieldValue('fax'));
						emisorTelFax	   += ' / ';
						emisorTelFax	   += returnBlank(companyInfo.getFieldValue('phone'));
					var pedido				= returnBlank(customsearch_fe_sf_json_datos_extra[0].getText('createdfrom'));
					var presentadora		= returnBlank(customsearch_fe_sf_json_datos_extra[0].getText('salesrep'));
					var terminos			= returnBlank(customsearch_fe_sf_json_datos_extra[0].getText(field_terms));
					var montoIVA16			= 0;
					var Comprobante			= returnBlank(customsearch_fe_sf_json_datos_extra[0].getValue('custbody_fe_sf_json_comprobante'));
					if(pedido != '')
					{
						pedido = stringToArray(pedido, 35);
						pedido = pedido[1];
					}
					if(Comprobante != '')
					{
						Comprobante			= JSON.parse(Comprobante);
						var Traslados 		= returnBlank(Comprobante.Impuestos.Traslados);
						for(var i=0;i<Traslados.length;i++)
						{
							var Traslado 	= Traslados[i];
							var impuesto	= returnBlank(Traslado.impuesto);
							var tasa		= returnNumber(Traslado.tasa);
							var importe		= returnNumber(Traslado.importe);
							if(impuesto == 'IVA' && tasa == 16)
							{
								montoIVA16 = importe;
								break;
							}
						}
					}
					montoIVA16						= currencyFormat(montoIVA16, 2);
					var DatosExtas					= new Array();
						DatosExtas.push({Clave:'pedido',Valor:pedido});
						DatosExtas.push({Clave:'emisorTelFax',Valor:emisorTelFax});
						DatosExtas.push({Clave:'presentadora',Valor:presentadora});
						DatosExtas.push({Clave:'terminos',Valor:terminos});
						DatosExtas.push({Clave:'montoIVA16',Valor:montoIVA16});
						DatosExtas.push({Clave:'leyendaIVA16',Valor:'IVA 16%'});
	        		var _fe_sf_json_datos_extra 	= JSON.stringify(DatosExtas);
	        		var fields						= new Array();
	        			fields.push('custbody_fe_sf_json_datos_extra');
	        		var values 						= new Array();
	        			values.push(_fe_sf_json_datos_extra);
	        		nlapiSubmitField(recordType, recordId, fields, values);
				}
				else
				{
					nlapiLogExecution('ERROR', _fe_sf_codigo_respuesta, _fe_sf_mensaje_respuesta);
				}
			}
			else
			{
        		var fields						= new Array();
	    			fields.push('custbody_fe_sf_json_datos_extra');
	    		var values 						= new Array();
	    			values.push('');
	    		nlapiSubmitField(recordType, recordId, fields, values);
				nlapiLogExecution('ERROR', 'customsearch_fe_sf_json_datos_extra', customsearch_fe_sf_json_datos_extra);
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
			fields.push('custbody_fe_sf_json_comprobante');
			fields.push('custbody_fe_sf_json_datos_extra');
		var values 	= new Array();
			values.push('');
			values.push('');
		nlapiSubmitField(recordType, recordId, fields, values);
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}