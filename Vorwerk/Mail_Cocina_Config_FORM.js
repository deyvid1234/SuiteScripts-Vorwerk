/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 May 2015     sergioponce
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function Mail_Cocina_Config_FORM(request, response){

	var Base64		= new MainBase64();
	var titleForm	= 'Mail Clase Cocina';
	var recordType 	= '';
	var recordId 	= '';
	
	try
	{
		var mode				= Base64.decode(returnBlank(request.getParameter('mode')));
		var disableDisplayType	= '';
		var fieldDisplayType	= '';
		var submitButtonName	= '';
		var createButtonCancel	= new Boolean();
		switch(mode)
		{
			case 'edit':
			{
				disableDisplayType	= 'disabled';
				fieldDisplayType	= 'normal';
				plantillaDisplay	= 'normal';
				submitButtonName	= 'Guardar';
				createButtonCancel	= true;
			};break;
			default:
			{
				disableDisplayType	= 'inline';
				fieldDisplayType	= 'inline';
				plantillaDisplay	= 'disabled';
				submitButtonName	= 'Editar';
				createButtonCancel	= false;
			};break;
		}
		if(request.getMethod() == "GET")
		{
			var asistencia				= nlapiLoadRecord('emailtemplate', 21);
			var inasistencia			= nlapiLoadRecord('emailtemplate', 23);
			/*var filtersFile			= new Array();
				filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'Mail_Cocina_Config.json'));
			var columnsFile			= new Array();
				columnsFile.push(new nlobjSearchColumn('folder'));
			var searchFile			= returnBlank(nlapiSearchRecord('file', null, filtersFile, columnsFile));
			var idFile				= searchFile[0].getId();
			var dataFile			= nlapiLoadFile(idFile);
				dataFile			= returnBlank(dataFile.getValue());
			var esBase64Coded		= isBase64Coded(dataFile);	
			if(esBase64Coded == true)
			{
				dataFile			= Base64.decode(dataFile);
			}
			var WM_SE							= JSON.parse(dataFile);
			var value_activar					= Base64.decode(returnBlank(WM_SE.custpage_activar));
			var value_activar_no				= Base64.decode(returnBlank(WM_SE.custpage_activar_no));
			var value_author					= Base64.decode(returnBlank(WM_SE.custpage_author));
			var value_cc						= Base64.decode(returnBlank(WM_SE.custpage_cc));
			var value_bcc						= Base64.decode(returnBlank(WM_SE.custpage_bcc));*/
			var value_plantilla_asistencia		= returnBlank(asistencia.getFieldValue('content'));
			var value_plantilla_inasistencia	= returnBlank(inasistencia.getFieldValue('content'));
			/*var value_plantilla_asistencia		= Base64.decode(returnBlank(WM_SE.custpage_plantilla_asistencia));
			var value_plantilla_inasistencia	= Base64.decode(returnBlank(WM_SE.custpage_plantilla_inasistencia));*/
			//var value_dias_despues				= Base64.decode(returnBlank(WM_SE.custpage_dias_despues));
			var form 							= nlapiCreateForm(titleForm);
			var data 							= returnBlank(request.getParameter('data'));
			var ShowAlertBox					= '';
			if(data != '')
			{
					data	   			= Base64.decode(data);
					data				= stringToArray(data,10);
				var exito 				= returnFalse(data[0]);	
				var mensajeExito		= '<b>Cambios guardados satisfactoriamente</b>';
				ShowAlertBox			= GetShowAlertBoxMessage(exito,mensajeExito,'','','');
				var field_confirmation 	= form.addField('custpage_confirmation', 'inlinehtml', 'Confirmation');
					field_confirmation.setLayoutType('outsideabove','startrow');
			}
			var group_conf_primaria	= form.addFieldGroup( 'group_conf_mail_asistencia', 'Mail de Asistencia');
				group_conf_primaria.setShowBorder(true);
				group_conf_primaria.setSingleColumn(true);
			var group_conf_correo_electronico 	= form.addFieldGroup( 'group_conf_mail_no_asistencia', 'Mail de no Asistencia');
				group_conf_correo_electronico.setShowBorder(true);
				group_conf_correo_electronico.setSingleColumn(true);
			/*var help_activar					= 'Active la casilla si desea editar la plantilla del correo electrónico <i>Clase de cocina, gracias por asistir</i>.';
			var help_activar_no					= 'Active la casilla si desea editar la plantilla del correo electrónico <i>Sentimos no haber contado con su asistencia</i>.';
			var help_author						= 'Ingrese el empleado el cual sera el remitente del correo electrónico <i>Mail Clase Cocina</i>.';
				help_author   				   += '<br><br>Para ver la lista de empleados, vaya a <i>Listas > Empleados > Empleados</i>';
			var help_author_email  			    = 'Esta es la dirección de correo electrónico del empleado que será el remitente del correo electrónico <i>Welcome Mail</i>.';
				help_author_email  			   += '<br><br>El campo se llama <i>Correo electrónico</i> id: <i>email</i>';
			var help_cc							= 'Ingrese las dirrecciones de correo electrónico (separadas por punto y coma ";") a las cuales se enviará copia del correo electrónico <i>Mail Clase Cocina</i>.';
			var help_bcc						= 'Ingrese las dirrecciones de correo electrónico (separadas por punto y coma ";") a las cuales se enviará copia oculta del correo electrónico <i>Mail Clase Cocina</i>.';*/
			//var help_dias_despues				= 'Ingrese el número de días que deberan pasar para que se envíe desea que se envíe el correo electrónico <i>Welcome Mail</i>.';
			var field_mode						= form.addField('custpage_mode','text', 'Mode', null,'group_conf_primaria');
				field_mode.setDisplayType('hidden');
        	/*var field_activar					= form.addField('custpage_activar','checkbox', 'Activar', null,'group_conf_mail_asistencia');
        		field_activar.setDisplayType(fieldDisplayType);
        		field_activar.setHelpText(help_activar, true);
        		var field_activar_no			= form.addField('custpage_activar_no','checkbox', 'Activar', null,'group_conf_mail_no_asistencia');
        		field_activar_no.setDisplayType(fieldDisplayType);
        		field_activar_no.setHelpText(help_activar_no, true);
    		var field_author					= form.addField('custpage_author','select', 'Empleado', 'employee','group_conf_primaria');
        		field_author.setDisplayType(fieldDisplayType);
        		field_author.setHelpText(help_author, true);
        		field_author.setMandatory(true);
        	var field_author_email				= form.addField('custpage_author_email','text', 'Remitente', null,'group_conf_correo_electronico');
        		field_author_email.setDisplayType(disableDisplayType);
        		field_author_email.setHelpText(help_author_email, true);
        		field_author_email.setMandatory(true);
    		var field_cc						= form.addField('custpage_cc','text', 'CC', null,'group_conf_correo_electronico');
    			field_cc.setDisplayType(fieldDisplayType);
    			field_cc.setHelpText(help_cc, true);
    		var field_bcc						= form.addField('custpage_bcc','text', 'BCC', null,'group_conf_correo_electronico');
    			field_bcc.setDisplayType(fieldDisplayType);
    			field_bcc.setHelpText(help_bcc, true);*/
    		var field_plantilla_asistencia		= form.addField('custpage_plantilla_asistencia','richtext', 'Plantilla Asistencia', null,'group_conf_mail_asistencia');
    			field_plantilla_asistencia.setDisplayType(plantillaDisplay);
    			field_plantilla_asistencia.setHelpText('Modifique la plantilla de correo electrónico', true);
    			field_plantilla_asistencia.setMandatory(true);
    		var field_plantilla_inasistencia	= form.addField('custpage_plantilla_inasistencia','richtext', 'Plantilla no Asistencia', null,'group_conf_mail_no_asistencia');
    			field_plantilla_inasistencia.setDisplayType(plantillaDisplay);
    			field_plantilla_inasistencia.setHelpText('Modifique la plantilla de correo electrónico', true);
    			field_plantilla_inasistencia.setMandatory(true);
			/*var field_dias_despues				= form.addField('custpage_dias_despues','integer', 'Días Después', null,'group_conf_correo_electronico');
				field_dias_despues.setDisplayType(fieldDisplayType);
				field_dias_despues.setHelpText(help_dias_despues, true);
				field_dias_despues.setMandatory(true);*/
	        /*var value_email_author				= '';
	        var filters							= new Array();
	        	filters.push(new nlobjSearchFilter('internalid', null, 'is', value_author));
	        var columns							= new Array();
	        	columns.push(new nlobjSearchColumn('email', null, null));
	        	columns.push(new nlobjSearchColumn('firstname', null, null));
	        	columns.push(new nlobjSearchColumn('middlename', null, null));
	        	columns.push(new nlobjSearchColumn('lastname', null, null));
	        var employeeSearch					= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
	        if(employeeSearch != '')
	        {
	        	value_email_author 	= returnBlank(employeeSearch[0].getValue('email'));
	        }*/
			var values 									= new Object();
				values.custpage_mode					= mode;
				/*values.custpage_activar					= value_activar;
				values.custpage_activar_no				= value_activar_no;*/
				/*values.custpage_author					= value_author;
				values.custpage_author_email			= value_email_author;
				values.custpage_cc 						= value_cc;
				values.custpage_bcc						= value_bcc;*/
				values.custpage_plantilla_asistencia	= value_plantilla_asistencia;
				values.custpage_plantilla_inasistencia	= value_plantilla_inasistencia;
				//values.custpage_dias_despues			= value_dias_despues;
				values.custpage_confirmation			= ShowAlertBox;
			form.setFieldValues(values);
			if(createButtonCancel == true)
			{
				var urlSUITELET				= nlapiResolveURL("SUITELET", "customscript_mail_cocina_config_form", "customdeploy_mail_cocina_config_form", false);
				var	url 					= urlSUITELET;
				form.addButton('custpage_cancel_button', 'Cancelar', "window.location.href='"+url+"'");
				form.setScript('customscript_mail_cocina_ss');
			}
			form.addSubmitButton(submitButtonName);
	        response.writePage(form);
		}
		else
		{
			var params_edit			= '';	
			var custpage_mode		= returnBlank(request.getParameter('custpage_mode'));
			switch(custpage_mode)
			{
				case 'edit':
				{
					nlapiSubmitField('emailtemplate', 21, 'content', request.getParameter('custpage_plantilla_asistencia'));
					nlapiSubmitField('emailtemplate', 23, 'content', request.getParameter('custpage_plantilla_inasistencia'));
					
					var data								= '';
				    	data	   	  			  		   += 'T'		+ String.fromCharCode(10);
				    	data	    						= Base64.encode(data);
			    	params_edit								= new Array();
		            params_edit['data']						= data;
					/*var WM_SE 								= new Object();
						WM_SE.custpage_activar				= Base64.encode(returnBlank(request.getParameter('custpage_activar')));
						WM_SE.custpage_activar_no			= Base64.encode(returnBlank(request.getParameter('custpage_activar_no')));
		        		WM_SE.custpage_author				= Base64.encode(returnBlank(request.getParameter('custpage_author')));
		        		WM_SE.custpage_cc					= Base64.encode(returnBlank(request.getParameter('custpage_cc')));
		        		WM_SE.custpage_bcc					= Base64.encode(returnBlank(request.getParameter('custpage_bcc')));
		        		WM_SE.custpage_asunto				= Base64.encode(returnBlank(request.getParameter('custpage_asunto')));
		        		WM_SE.custpage_plantilla_asistencia	= Base64.encode(returnBlank(request.getParameter('custpage_plantilla_asistencia')));
		        		WM_SE.custpage_plantilla_inasistencia	= Base64.encode(returnBlank(request.getParameter('custpage_plantilla_inasistencia')));
		        		WM_SE.custpage_dias_despues			= Base64.encode(returnBlank(request.getParameter('custpage_dias_despues')));
					var WM_SE_as_text						= JSON.stringify(WM_SE);
			    	var dataFile							= nlapiCreateFile('Mail_Cocina_Config.json', 'PLAINTEXT', WM_SE_as_text);
			    		dataFile.setFolder(11);
			    	var dataFileID							= nlapiSubmitFile(dataFile);
			    	nlapiLogExecution('ERROR', 'dataFileID', dataFileID);*/
				};break;
				default:
				{
		            params_edit			= new Array();
	            	params_edit['mode']	= Base64.encode('edit');
				};break;
			}
			nlapiSetRedirectURL('SUITELET','customscript_mail_cocina_config_form', 'customdeploy_mail_cocina_config_form', false, params_edit);
			nlapiLogExecution('ERROR', "redireccionado edit", "redireccionado edit");
		}
	}
    catch(e)
    {
    	var tituloFallo		= new String();
    	var mensajeFallo	= new String();
    	var data			= new String();
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
    	data	  += titleForm		+ String.fromCharCode(10);
    	data	  += 'F'			+ String.fromCharCode(10);
    	data	  += tituloFallo	+ String.fromCharCode(10);
    	data	  += mensajeFallo	+ String.fromCharCode(10);
    	data	   = Base64.encode(data);
        var params_handler_error				= new Array();
	    	params_handler_error['data']		= data;
    	nlapiSetRedirectURL('SUITELET','customscript_welcome_mail_config_he', 'customdeploy_welcome_mail_config_he', false, params_handler_error);
		nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
    }
}
