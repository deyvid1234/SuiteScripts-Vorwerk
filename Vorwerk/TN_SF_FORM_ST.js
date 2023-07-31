function TN_SF_FORM_ST(request, response)
{
	var Base64		= new MainBase64();
	var titleForm	= 'Timbrado de Nomina';
	try
	{
		if(request.getMethod() == "GET")
		{
			var data 	= returnBlank(request.getParameter('data'));
			if(data != '')
			{
				data	   					= Base64.decode(data);
				data						= JSON.parse(data);
				var titleFormST				= returnBlank(data.titleForm);
				var exito					= returnFalse(data.exito);
				var tituloExito 			= returnBlank(data.tituloExito);
				var mensajeExito 			= returnBlank(data.mensajeExito);
				var tituloFallo 			= returnBlank(data.tituloFallo);
				var mensajeFallo 			= returnBlank(data.mensajeFallo);
				var ShowAlertBox			= GetShowAlertBoxMessage(exito,tituloExito,mensajeExito,tituloFallo,mensajeFallo);
				var form 					= nlapiCreateForm(titleFormST);   
				var field_html 				= form.addField('custpage_html', 'inlinehtml', 'Confirmation');
					field_html.setLayoutType('outsideabove','startrow');
				var values 					= new Object();
					values.custpage_html 	= ShowAlertBox;
				form.setFieldValues(values);
				form.addSubmitButton('Estado');
				response.writePage(form);
			}
		}
		else
		{
			var today						= new Date();
				today						= nlapiDateToString(today);
			var filtersScript				= new Array();
				filtersScript.push(new nlobjSearchFilter('scriptid',null, 'is', 'customscript_tn_sf_bt_form_sd'));
			var searchScript				= nlapiSearchRecord('script', null, filtersScript,null);
			var scripttype					= searchScript[0].getId();
		    var parameters					= new Array();
		    	parameters['sortcol']		= 'dcreated';
		    	parameters['sortdir']		= 'DESC';
		    	parameters['csv']			= 'HTML';
		    	parameters['OfficeXML']		= 'F';
		    	parameters['pdf']			= '';
		    	parameters['datemodi']		= 'WITHIN';
		    	parameters['daterange']		= 'TODAY';
		    	parameters['datefrom']		= 'today';
		    	parameters['dateto']		= 'today';
		    	parameters['date']			= 'TODAY';
		    	parameters['scripttype']	= scripttype;
			nlapiSetRedirectURL('TASKLINK', 'LIST_SCRIPTSTATUS', null, null, parameters);
		}
	}
	catch(e)
    {
    	var tituloFallo		= new String();
    	var mensajeFallo	= new String();
    	var data			= new Object();
    	var identacion		= '<td>&nbsp;</td><td>&nbsp;</td><td>ᐅ</td>';
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
    	nlapiSetRedirectURL('SUITELET','customscript_fe_sf_he', 'customdeploy_fe_sf_he', false, params_handler_error);
		nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
  	}
}