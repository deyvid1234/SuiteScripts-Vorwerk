function TN_SF_BT_FORM_ST(request,response)
{
	var Base64				= new MainBase64();
	var titleForm			= 'Timbrado de Nomina';
	var recordType			= '';
	var recordId			= '';
	try
	{
		var data			 	= returnBlank(request.getParameter('data'));
			//nlapiLogExecution('ERROR', 'data', data);
			data				= Base64.decode(data);
			data				= JSON.parse(data);
		var recordBaseInfo		= returnBlank(data.recordBaseInfo);
		var correo				= returnBlank(data.correo);
		var usuario				= returnBlank(data.usuario);
		var mainRecordType		= returnBlank(data.mainRecordType);
		var mainRecordId		= returnBlank(data.mainRecordId);
		nlapiLogExecution('DEBUG', 'recordBaseInfo', recordBaseInfo);
		if(recordBaseInfo != '')
		{
			var params_sd									= new Array();
				params_sd['custscript_record_base_info']	= recordBaseInfo;
				params_sd['custscript_correo']				= correo;
				params_sd['custscript_usuario']				= usuario;
				params_sd['custscript_main_record_type']	= mainRecordType;
				params_sd['custscript_main_record_id']		= mainRecordId;
			var status										= nlapiScheduleScript('customscript_tn_sf_bt_form_sd', 'customdeploy_tn_sf_bt_form_sd', params_sd);
			var exito										= '';
			var tituloExito									= '';
			var mensajeExito								= '';
			var tituloFallo									= '';
			var mensajeFallo								= '';
			switch(status)
			{
				case 'QUEUED':
				{
					exito		     = 'T';
					tituloExito		+= "<b>El proceso ha sido programado correctamente.</b>";
					mensajeExito	+= "<br>Cuando el proceso termine será enviada una notificación a la dirección de correo electrónico: " + correo;
					mensajeExito	+= "<br><br>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso";
					mensajeExito	+= "<br><br>Puede continuar navegando en <b>NetSuite</b>";
				};break;
				case 'INQUEUE':
				{
					exito		     = 'T';
					tituloExito		+= "<b>El proceso ya se encuentra en cola y en espera de ejecutarse.</b>";
		    		mensajeExito	+= "<br>Por favor espere a que termine e intente nuevamente";
					mensajeExito	+= "<br><br>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso";
					mensajeExito	+= "<br><br>Puede continuar navegando en <b>NetSuite</b>";
				};break;
				case 'INPROGRESS':
				{
					exito		     = 'T';
					tituloExito		+= "<b>Actualmente el proceso se encuentra ejecutandose, por favor espere un poco más.</b>";
					mensajeExito	+= "<br>Cuando el proceso termine será enviada una notificación a la dirección de correo electrónico: " + correo;
					mensajeExito	+= "<br><br>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso";
					mensajeExito	+= "<br><br>Puede continuar navegando en <b>NetSuite</b>";
				};break;
				case 'SCHEDULED':
				{
					exito		     = 'T';
					tituloExito		+= "<b>El proceso ha sido programado correctamente y pronto será puesta en cola.</b>";
		    		mensajeExito	+= "<br>Cuando el proceso termine será enviada una notificación a la dirección de correo electrónico: " + correo;
					mensajeExito	+= "<br><br>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso";
					mensajeExito	+= "<br><br>Puede continuar navegando en <b>NetSuite</b>";
				};break;
				default:
				{
					exito		     = 'F';
					tituloFallo		+= "<b>Status no identificado (" + status + ") consulte a Soporte T&eacute;cnico y mueste este mensaje.</b>";
					mensajeFallo	+= "<br>El proceso <b>NO</b> ha sido programado";
					mensajeFallo	+= "<br><br>Puede continuar navegando en <b>NetSuite</b>";
				};break;
			}
			var data				= new Object();
	    		data.titleForm		= titleForm;
	    		data.exito		    = exito;
		    	data.tituloExito	= tituloExito;
		    	data.mensajeExito	= mensajeExito;
		    	data.tituloFallo 	= tituloFallo;
		    	data.mensajeFallo	= mensajeFallo;
				data				= JSON.stringify(data);
				data   		 		= Base64.encode(data);
	        var params				= new Array();
	        	params['data']		= data;
	    	nlapiSetRedirectURL('SUITELET','customscript_tn_sf_form_st', 'customdeploy_tn_sf_form_st', false, params);
			nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
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
