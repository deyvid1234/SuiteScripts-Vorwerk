function TN_SF_BT_FORM_SD(request,response)
{
	var recordType	= '';
	var recordId	= '';
	var Base64		= new MainBase64();
	try
	{
		var context			= nlapiGetContext();
		var recordBaseInfo 	= returnBlank(context.getSetting('SCRIPT', 'custscript_record_base_info'));
		var correo		 	= returnBlank(context.getSetting('SCRIPT', 'custscript_correo'));
		var usuario		 	= returnBlank(context.getSetting('SCRIPT', 'custscript_usuario'));
		var mainRecordType 	= returnBlank(context.getSetting('SCRIPT', 'custscript_main_record_type'));
		var mainRecordId 	= returnBlank(context.getSetting('SCRIPT', 'custscript_main_record_id'));
		if(recordBaseInfo != '')
		{
			recordBaseInfo	   	= Base64.decode(recordBaseInfo);
			recordBaseInfo		= JSON.parse(recordBaseInfo);
			var recordBaseType 	= recordBaseInfo.recordBaseType;
			var urlSUITELET		= nlapiResolveURL("SUITELET", "customscript_tn_sf_bt_form_sd_st", "customdeploy_tn_sf_bt_form_sd_st", true);
			var url_fe_sf		= nlapiResolveURL("SUITELET", "customscript_tn_sf_st", "customdeploy_tn_sf_st", true);
			var recordBaseData	= recordBaseInfo.recordBaseData;
			var lines			= recordBaseData.length;
			var porcentajeIte	= (1 * 99)/lines;
			var url = nlapiResolveURL("SUITELET", "customscript_tn_sf_bt_form_sd_st", "customdeploy_tn_sf_bt_form_sd_st", true);
			url = url.replace('forms', 'system');
			url = url.slice(0, url.indexOf('/app'));
			for(var i=0;i<lines;i++)
			{
				var data		= recordBaseData[i];
				var RecordType 	= recordBaseType;
				var RecordId 	= data.recordId;
                nlapiLogExecution('DEBUG','ID RECORD DE jefa de grupo rumbo al suitelet de timbrado',RecordId);
		    		data	   	= JSON.stringify(data);
		    		data	   	= Base64.encode(data);
				var	url_a 		= urlSUITELET;
					url_a 	   += "&data=" 			+ data;
					url_a 	   += "&recordType=" 	+ RecordType;
				var	url_b 	  	= url_fe_sf;
					url_b 	   += "&recordType=" 	+ RecordType;
					url_b 	   += "&recordId=" 		+ RecordId;
				try
				{
					nlapiRequestURL(url_a,null, null, null);
					nlapiRequestURL(url_b,null, null, null);
				}
				catch(error)
				{
					nlapiLogExecution('ERROR','url_a',url_a);
					nlapiLogExecution('ERROR','url_b',url_b);
				}
				context.setPercentComplete((porcentajeIte * (i+1)));
			}
			var urlRECORD			= nlapiResolveURL("RECORD", mainRecordType, mainRecordId, 'VIEW');
			//var	url 				= 'https://system.netsuite.com' + urlRECORD;
			url 				= url + urlRECORD;
			var body				= '';
				body			   += '<html>';
					body			   += '<head>';
						body		       += '<body>';
							body		       += '<font face="tahoma" size="2">Em <b>Timbrado de Nomina</b> ha terminado, haga click <a href='+ url + '>aquí</a> para ver los resultados.</font>';
							body			   += '<br><br>';
							body			   += '<font face="tahoma" size="2">Nota: requiere acceso a <b>NetSuite</b>.</font>';
						body			   += '</body>';
					body			   += '</head>';
				body			   += '</html>';
			var subject					= 'Timbrado de Nomina: Terminada';
			var records		 			= new Array();
				records['recordtype'] 	= mainRecordType;
				records['record'] 		= mainRecordId;
			nlapiSendEmail(usuario, correo, subject, body, null, null, records, null);
			context.setPercentComplete(100);
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
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}
