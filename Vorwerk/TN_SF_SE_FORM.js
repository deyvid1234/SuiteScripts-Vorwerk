function TN_SF_SE_FORM(request, response)
{
	var Base64		= new MainBase64();
	var titleForm	= 'Configuración: Timbrado de Nominas';
	try
	{
		var mode				= Base64.decode(returnBlank(request.getParameter('mode')));
		var disableDisplayType	= '';
		var fieldDisplayType	= '';
		var fieldHTMLType		= '';
		var submitButtonName	= '';
		var createButtonCancel	= new Boolean();
		switch(mode)
		{
			case 'edit':
			{
				disableDisplayType	= 'disabled';
				fieldDisplayType	= 'normal';
				fieldHTMLType		= 'richtext';
				submitButtonName	= 'Guardar';
				createButtonCancel	= true;
			};break;
			default:
			{
				disableDisplayType	= 'inline';
				fieldDisplayType	= 'inline';
				fieldHTMLType		= 'richtext';
				submitButtonName	= 'Editar';
				createButtonCancel	= false;
			};break;
		}
		if(request.getMethod() == "GET")
		{			
			var filtersFile							= new Array();
				filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'TN_SF_SE.json'));
			var columnsFile							= new Array();
				columnsFile.push(new nlobjSearchColumn('folder'));
			var searchFile							= returnBlank(nlapiSearchRecord('file', null, filtersFile, columnsFile));
			var TN_SF_SE_ID							= searchFile[0].getId();
			var dataFile							= nlapiLoadFile(TN_SF_SE_ID);
				dataFile							= returnBlank(dataFile.getValue());
			var esBase64Coded						= isBase64Coded(dataFile);	
			if(esBase64Coded == true)
			{
				dataFile							= Base64.decode(dataFile);
			}
			var TN_SF_SE							= JSON.parse(dataFile);
			var value_user_pruebas					= Base64.decode(returnBlank(TN_SF_SE.custpage_user_pruebas));
			var value_password_pruebas				= Base64.decode(returnBlank(TN_SF_SE.custpage_password_pruebas));
			var value_url_timbrado_pruebas			= Base64.decode(returnBlank(TN_SF_SE.custpage_url_timbrado_pruebas));
			var value_url_cancelacion_pruebas		= Base64.decode(returnBlank(TN_SF_SE.custpage_url_cancelacion_pruebas));
			var value_user_produccion				= Base64.decode(returnBlank(TN_SF_SE.custpage_user_produccion));
			var value_password_produccion			= Base64.decode(returnBlank(TN_SF_SE.custpage_password_produccion));
			var value_url_timbrado_produccion		= Base64.decode(returnBlank(TN_SF_SE.custpage_url_timbrado_produccion));
			var value_url_cancelacion_produccion	= Base64.decode(returnBlank(TN_SF_SE.custpage_url_cancelacion_produccion));
			var value_ambiente_seleccion			= Base64.decode(returnBlank(TN_SF_SE.custpage_ambiente_seleccion));
			var value_ce_timbrado_activar			= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_timbrado_activar));
			var value_ce_timbrado_author			= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_timbrado_author));
			var value_ce_timbrado_cc				= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_timbrado_cc));
			var value_ce_timbrado_bcc				= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_timbrado_bcc));
			var value_ce_timbrado_asunto			= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_timbrado_asunto));
			var value_ce_timbrado_mensaje			= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_timbrado_mensaje));
			var value_ce_cancelacion_activar		= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_cancelacion_activar));
			var value_ce_cancelacion_author			= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_cancelacion_author));
			var value_ce_cancelacion_cc				= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_cancelacion_cc));
			var value_ce_cancelacion_bcc			= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_cancelacion_bcc));
			var value_ce_cancelacion_asunto			= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_cancelacion_asunto));
			var value_ce_cancelacion_mensaje		= Base64.decode(returnBlank(TN_SF_SE.custpage_ce_cancelacion_mensaje));
			var form 								= nlapiCreateForm(titleForm);
				form.addTab('custpage_ambiente', 'Ambiente');
				form.addTab('custpage_correo_electronico', 'Correo Electrónico');
			var data 								= returnBlank(request.getParameter('data'));
			var ShowAlertBox						= '';
			if(data != '')
			{
					data	   			= Base64.decode(data);
					data				= JSON.parse(data);
				var exito 				= returnFalse(data.exito);	
				var mensajeExito		= '<b>Cambios guardados satisfactoriamente</b>';
				ShowAlertBox			= GetShowAlertBoxMessage(exito,mensajeExito,'','','');
				var field_confirmation 	= form.addField('custpage_confirmation', 'inlinehtml', 'Confirmation');
					field_confirmation.setLayoutType('outsideabove','startrow');
			}
			var group_credenciales_ambiente_pruebas		= form.addFieldGroup( 'group_credenciales_ambiente_pruebas', 'Pruebas','custpage_ambiente');
				group_credenciales_ambiente_pruebas.setShowBorder(true);
				group_credenciales_ambiente_pruebas.setSingleColumn(true);
			var group_credenciales_ambiente_produccion	= form.addFieldGroup( 'group_credenciales_ambiente_produccion', 'Producción','custpage_ambiente');
				group_credenciales_ambiente_produccion.setShowBorder(true);
				group_credenciales_ambiente_produccion.setSingleColumn(true);
			var group_ce_timbrado						= form.addFieldGroup( 'group_ce_timbrado', 'Timbrado','custpage_correo_electronico');
				group_ce_timbrado.setShowBorder(true);
				group_ce_timbrado.setSingleColumn(true);
			var group_ce_cancelación 					= form.addFieldGroup( 'group_ce_cancelacion', 'Cancelación','custpage_correo_electronico');
				group_ce_cancelación.setShowBorder(true);
				group_ce_cancelación.setSingleColumn(true);
			var help_user			    		= 'Dato proporcionado por el proveedor de timbrado de nominas.<br>Si existen dudas, contacte a su proveedor.';
			var help_password		    		= 'Dato proporcionado por el proveedor de timbrado de nominas.<br>Si existen dudas, contacte a su proveedor.';
			var help_url			    		= 'Dato proporcionado por el proveedor de timbrado de nominas.<br>Si existen dudas, contacte a su proveedor.';
			var help_ambiente					= 'Active la casilla si desea que <b>NetSuite</b> utilice este ambiente para generar el timbrado de nominas.';
			var help_ce_timbrado_activar		= 'Active la casilla si desea que <b>NetSuite</b> envíe un correo electrónico a sus clientes cuando se realice el proceso de <i>Timbrado</i> del <i>Timbrado de Nominas</i>.';
				help_ce_timbrado_activar   	   += '<br><br><b>NOTA:</b>Este envío es completamente independiente del que pueda proporcionar el proveedor de Timbrado de Nominas, consulte a su proveedor, de lo contrario habrá habra redundancia de correos electronicos y/o molestias por parte de cliente.';
			var help_ce_timbrado_author			= 'Ingrese el empleado el cual sera el remitente del correo electrónico que se enviará al realizar el proceso de <i>Timbrado</i> del <i>Timbrado de Nominas</i>.';
				help_ce_timbrado_author   	   += '<br><br>Para ver la lista de empleados, vaya a <i>Listas > Empleados > Empleados</i>';
			var help_ce_timbrado_author_email   = 'Esta es la dirección de correo electrónico del empleado que será el remitente del correo electrónico que enviará al realizar el proceso de <i>Timbrado</i> del <i>Timbrado de Nominas</i>.';
				help_ce_timbrado_author_email  += '<br><br>El campo se llama <i>Correo electrónico</i> id: <i>email</i>';
			var help_ce_timbrado_cc				= 'Ingrese las dirrecciones de correo electrónico (separadas por punto y coma ";") a las cuales se enviará copia del correo electrónico al realizar el proceso de <i>Timbrado</i> del <i>Timbrado de Nominas</i>.';
			var help_ce_timbrado_bcc			= 'Ingrese las dirrecciones de correo electrónico (separadas por punto y coma ";") a las cuales se enviará copia oculta del correo electrónico al realizar el proceso de <i>Timbrado</i> del <i>Timbrado de Nominas</i>.';
			var help_ce_timbrado_asunto			= 'Ingrese el asunto de correo electrónico que se enviará al momento de realizar el proceso de <i>Timbrado</i> del <i>Timbrado de Nominas</i>.';
				help_ce_timbrado_asunto   	   += '<br><br>Etiquetas permitidas:<br>';
				help_ce_timbrado_asunto        += '<table cellborder=\"1\" class=\"text\">';
					help_ce_timbrado_asunto	   	   += '<tr><td>'+ '<b>Etiqueta</b>'		+'</td><td>&nbsp;</td><td>' + '<b>Campo</b>'					+ '</td></tr>';
					help_ce_timbrado_asunto    	   += '<tr><td>'+ '[numero]' 			+'</td><td>&nbsp;</td><td>' + 'Número' 							+ '</td></tr>';
					help_ce_timbrado_asunto        += '<tr><td>'+ '[fecha]' 			+'</td><td>&nbsp;</td><td>' + 'Fecha' 							+ '</td></tr>';
					help_ce_timbrado_asunto        += '<tr><td>'+ '[presentadora]'		+'</td><td>&nbsp;</td><td>' + 'Presentadora' 					+ '</td></tr>';
					help_ce_timbrado_asunto    	   += '<tr><td>'+ '[companyname]' 		+'</td><td>&nbsp;</td><td>' + 'Nombre de la empresa' 			+ '</td></tr>';
					help_ce_timbrado_asunto    	   += '<tr><td>'+ '[legalname]' 		+'</td><td>&nbsp;</td><td>' + 'Nombre Legal' 					+ '</td></tr>';
				help_ce_timbrado_asunto   	   += '</table>';	
			var help_ce_timbrado_mensaje		= 'Ingrese el mensaje de correo electrónico que se enviará al momento de realizar el proceso de <i>Timbrado</i> del <i>Timbrado de Nominas</i>.';
				help_ce_timbrado_mensaje   	   += '<br><br>Etiquetas permitidas:<br>';
				help_ce_timbrado_mensaje       += '<table cellborder=\"1\" class=\"text\">';
					help_ce_timbrado_mensaje	   += '<tr><td>'+ '<b>Etiqueta</b>'		+'</td><td>&nbsp;</td><td>' + '<b>Campo</b>'					+ '</td></tr>';
					help_ce_timbrado_mensaje       += '<tr><td>'+ '[numero]' 			+'</td><td>&nbsp;</td><td>' + 'Número' 							+ '</td></tr>';
					help_ce_timbrado_mensaje       += '<tr><td>'+ '[fecha]' 			+'</td><td>&nbsp;</td><td>' + 'Fecha' 							+ '</td></tr>';
					help_ce_timbrado_mensaje       += '<tr><td>'+ '[presentadora]'		+'</td><td>&nbsp;</td><td>' + 'Presentadora' 					+ '</td></tr>';
					help_ce_timbrado_mensaje       += '<tr><td>'+ '[companyname]' 		+'</td><td>&nbsp;</td><td>' + 'Nombre de la empresa' 			+ '</td></tr>';
					help_ce_timbrado_mensaje       += '<tr><td>'+ '[legalname]' 		+'</td><td>&nbsp;</td><td>' + 'Nombre Legal' 					+ '</td></tr>';
				help_ce_timbrado_mensaje   	   += '</table>';
			var help_ce_cancelacion_activar		   = 'Active la casilla si desea que <b>NetSuite</b> envíe un correo electrónico a sus clientes cuando se realice el proceso de <i>Cancelación</i> del <i>Timbrado de Nominas</i>.';
				help_ce_cancelacion_activar   	  += '<br><br><b>NOTA:</b>Este envío es completamente independiente del que pueda proporcionar el proveedor de Timbrado de Nominas, consulte a su proveedor, de lo contrario habrá habra redundancia de correos electronicos y/o molestias por parte de cliente.';
			var help_ce_cancelacion_author	       = 'Ingrese el empleado el cual sera el remitente del correo electrónico que se enviará al realizar el proceso de <i>Cancelación</i> del <i>Timbrado de Nominasnica</i>.';
				help_ce_cancelacion_author        += '<br><br>Para ver la lista de empleados, vaya a <i>Listas > Empleados > Empleados</i>';
			var help_ce_cancelacion_author_email   = 'Esta es la dirección de correo electrónico del empleado que será el remitente del correo electrónico que enviará al realizar el proceso de <i>Cancelación</i> del <i>Timbrado de Nominas</i>.';
				help_ce_cancelacion_author_email  += '<br><br>El campo se llama <i>Correo electrónico</i> id: <i>email</i>';
			var help_ce_cancelacion_cc			   = 'Ingrese las dirrecciones de correo electrónico (separadas por punto y coma ";") a las cuales se enviará copia del correo electrónico al realizar el proceso de <i>Cancelación</i> del <i>Timbrado de Nominas</i>.';
			var help_ce_cancelacion_bcc			   = 'Ingrese las dirrecciones de correo electrónico (separadas por punto y coma ";") a las cuales se enviará copia oculta del correo electrónico al realizar el proceso de <i>Cancelación</i> del <i>Timbrado de Nominas</i>.';
			var help_ce_cancelacion_asunto		   = 'Ingrese el asunto de correo electrónico que se enviará al momento de realizar el proceso de <i>Cancelación</i> del <i>Timbrado de Nominas</i>.';
				help_ce_cancelacion_asunto   	  += '<br><br>Etiquetas permitidas:<br>';
				help_ce_cancelacion_asunto        += '<table cellborder=\"1\" class=\"text\">';
					help_ce_cancelacion_asunto	  	  += '<tr><td>'+ '<b>Etiqueta</b>'		+'</td><td>&nbsp;</td><td>' + '<b>Campo</b>'					+ '</td></tr>';
					help_ce_cancelacion_asunto    	  += '<tr><td>'+ '[numero]' 			+'</td><td>&nbsp;</td><td>' + 'Número' 							+ '</td></tr>';
					help_ce_cancelacion_asunto        += '<tr><td>'+ '[fecha]' 				+'</td><td>&nbsp;</td><td>' + 'Fecha' 							+ '</td></tr>';
					help_ce_cancelacion_asunto        += '<tr><td>'+ '[presentadora]'		+'</td><td>&nbsp;</td><td>' + 'Presentadora' 					+ '</td></tr>';
					help_ce_cancelacion_asunto    	  += '<tr><td>'+ '[companyname]' 		+'</td><td>&nbsp;</td><td>' + 'Nombre de la empresa' 			+ '</td></tr>';
					help_ce_cancelacion_asunto    	  += '<tr><td>'+ '[legalname]' 			+'</td><td>&nbsp;</td><td>' + 'Nombre Legal' 					+ '</td></tr>';
				help_ce_cancelacion_asunto   	  += '</table>';	
			var help_ce_cancelacion_mensaje		   = 'Ingrese el mensaje de correo electrónico que se enviará al momento de realizar el proceso de <i>Cancelación</i> del <i>Timbrado de Nominas</i>.';
				help_ce_cancelacion_mensaje   	  += '<br><br>Etiquetas permitidas:<br>';
				help_ce_cancelacion_mensaje       += '<table cellborder=\"1\" class=\"text\">';
					help_ce_cancelacion_mensaje	   	  += '<tr><td>'+ '<b>Etiqueta</b>'		+'</td><td>&nbsp;</td><td>' + '<b>Campo</b>'					+ '</td></tr>';
					help_ce_cancelacion_mensaje    	  += '<tr><td>'+ '[numero]' 			+'</td><td>&nbsp;</td><td>' + 'Número' 							+ '</td></tr>';
					help_ce_cancelacion_mensaje       += '<tr><td>'+ '[fecha]' 				+'</td><td>&nbsp;</td><td>' + 'Fecha' 							+ '</td></tr>';
					help_ce_cancelacion_mensaje       += '<tr><td>'+ '[presentadora]'		+'</td><td>&nbsp;</td><td>' + 'Presentadora' 					+ '</td></tr>';
					help_ce_cancelacion_mensaje    	  += '<tr><td>'+ '[companyname]' 		+'</td><td>&nbsp;</td><td>' + 'Nombre de la empresa' 			+ '</td></tr>';
					help_ce_cancelacion_mensaje    	  += '<tr><td>'+ '[legalname]' 			+'</td><td>&nbsp;</td><td>' + 'Nombre Legal' 					+ '</td></tr>';
				help_ce_cancelacion_mensaje   	   += '</table>';
			var field_mode							= form.addField('custpage_mode','text', 'Mode', null,null);
				field_mode.setDisplayType('hidden');
    		var field_user_pruebas					= form.addField('custpage_user_pruebas','text', 'Usuario', null,'group_credenciales_ambiente_pruebas');
    			field_user_pruebas.setDisplayType(fieldDisplayType);
    			field_user_pruebas.setHelpText(help_user, true);
    			field_user_pruebas.setMandatory(true);
    		var field_password_pruebas				= form.addField('custpage_password_pruebas','password', 'Contraseña', null,'group_credenciales_ambiente_pruebas');
    			field_password_pruebas.setDisplayType(fieldDisplayType);
    			field_password_pruebas.setHelpText(help_password, true);
    			field_password_pruebas.setMandatory(true);
    		var field_url_timbrado_pruebas			= form.addField('custpage_url_timbrado_pruebas','url', 'URL de Timbrado', null,'group_credenciales_ambiente_pruebas');
    			field_url_timbrado_pruebas.setDisplayType(fieldDisplayType);
    			field_url_timbrado_pruebas.setHelpText(help_url, true);
    			field_url_timbrado_pruebas.setMandatory(true);    		
    		var field_url_cancelacion_pruebas		= form.addField('custpage_url_cancelacion_pruebas','url', 'URL de Cancelación', null,'group_credenciales_ambiente_pruebas');
    			field_url_cancelacion_pruebas.setDisplayType(fieldDisplayType);
    			field_url_cancelacion_pruebas.setHelpText(help_url, true);
    			field_url_cancelacion_pruebas.setMandatory(true);
			var field_ambiente_seleccion			= form.addField('custpage_ambiente_seleccion', 'radio','Activar','A','group_credenciales_ambiente_pruebas');
				field_ambiente_seleccion.setDisplayType(fieldDisplayType);
				field_ambiente_seleccion.setHelpText(help_ambiente, true);
    		var field_user_produccion				= form.addField('custpage_user_produccion','text', 'Usuario', null,'group_credenciales_ambiente_produccion');
    			field_user_produccion.setDisplayType(fieldDisplayType);
    			field_user_produccion.setHelpText(help_user, true);
    			field_user_produccion.setMandatory(true);
    		var field_password_produccion			= form.addField('custpage_password_produccion','password', 'Contraseña', null,'group_credenciales_ambiente_produccion');
    			field_password_produccion.setDisplayType(fieldDisplayType);
    			field_password_produccion.setHelpText(help_password, true);
    			field_password_produccion.setMandatory(true);
    		var field_url_timbrado_produccion		= form.addField('custpage_url_timbrado_produccion','url', 'URL de Timbrado', null,'group_credenciales_ambiente_produccion');
    			field_url_timbrado_produccion.setDisplayType(fieldDisplayType);
    			field_url_timbrado_produccion.setHelpText(help_url, true);
    			field_url_timbrado_produccion.setMandatory(true);    		
    		var field_url_cancelacion_produccion	= form.addField('custpage_url_cancelacion_produccion','url', 'URL de Cancelación', null,'group_credenciales_ambiente_produccion');
    			field_url_cancelacion_produccion.setDisplayType(fieldDisplayType);
    			field_url_cancelacion_produccion.setHelpText(help_url, true);
    			field_url_cancelacion_produccion.setMandatory(true);
			var field_ambiente_seleccion			= form.addField('custpage_ambiente_seleccion', 'radio','Activar','B','group_credenciales_ambiente_produccion');
				field_ambiente_seleccion.setDisplayType(fieldDisplayType);
				field_ambiente_seleccion.setHelpText(help_ambiente, true);
    		var field_ce_timbrado_activar			= form.addField('custpage_ce_timbrado_activar','checkbox', 'Activar', null,'group_ce_timbrado');
        		field_ce_timbrado_activar.setDisplayType(fieldDisplayType);
        		field_ce_timbrado_activar.setHelpText(help_ce_timbrado_activar, true);
    		var field_ce_timbrado_author			= form.addField('custpage_ce_timbrado_author','select', 'Empleado', 'employee','group_ce_timbrado');
        		field_ce_timbrado_author.setDisplayType(fieldDisplayType);
        		field_ce_timbrado_author.setHelpText(help_ce_timbrado_author, true);
        		field_ce_timbrado_author.setMandatory(true);
        	var field_ce_timbrado_author_email		= form.addField('custpage_ce_timbrado_author_email','text', 'Remitente', null,'group_ce_timbrado');
        		field_ce_timbrado_author_email.setDisplayType(disableDisplayType);
        		field_ce_timbrado_author_email.setHelpText(help_ce_timbrado_author_email, true);
        		field_ce_timbrado_author_email.setMandatory(true);
    		var field_ce_timbrado_cc				= form.addField('custpage_ce_timbrado_cc','text', 'CC', null,'group_ce_timbrado');
    			field_ce_timbrado_cc.setDisplayType(fieldDisplayType);
    			field_ce_timbrado_cc.setHelpText(help_ce_timbrado_cc, true);
    		var field_ce_timbrado_bcc				= form.addField('custpage_ce_timbrado_bcc','text', 'BCC', null,'group_ce_timbrado');
    			field_ce_timbrado_bcc.setDisplayType(fieldDisplayType);
    			field_ce_timbrado_bcc.setHelpText(help_ce_timbrado_bcc, true);
    		var field_ce_timbrado_asunto			= form.addField('custpage_ce_timbrado_asunto','text', 'Asunto', null,'group_ce_timbrado');
    			field_ce_timbrado_asunto.setDisplayType(fieldDisplayType);
    			field_ce_timbrado_asunto.setHelpText(help_ce_timbrado_asunto, true);
    			field_ce_timbrado_asunto.setMandatory(true);
    		var field_ce_timbrado_mensaje			= form.addField('custpage_ce_timbrado_mensaje',fieldHTMLType, 'Mensaje', null,'group_ce_timbrado');
    			field_ce_timbrado_mensaje.setDisplayType(fieldDisplayType);
    			field_ce_timbrado_mensaje.setHelpText(help_ce_timbrado_mensaje, true);
    			field_ce_timbrado_mensaje.setMandatory(true);
        	var field_ce_cancelacion_activar		= form.addField('custpage_ce_cancelacion_activar','checkbox', 'Activar', null,'group_ce_cancelacion');
        		field_ce_cancelacion_activar.setDisplayType(fieldDisplayType);
        		field_ce_cancelacion_activar.setHelpText(help_ce_cancelacion_activar, true);
    		var field_ce_cancelacion_author			= form.addField('custpage_ce_cancelacion_author','select', 'Empleado', 'employee','group_ce_cancelacion');
        		field_ce_cancelacion_author.setDisplayType(fieldDisplayType);
        		field_ce_cancelacion_author.setHelpText(help_ce_cancelacion_author, true);
        		field_ce_cancelacion_author.setMandatory(true);
        	var field_ce_cancelacion_author_email	= form.addField('custpage_ce_cancelacion_author_email','text', 'Remitente', null,'group_ce_cancelacion');
        		field_ce_cancelacion_author_email.setDisplayType(disableDisplayType);
        		field_ce_cancelacion_author_email.setHelpText(help_ce_cancelacion_author_email, true);
        		field_ce_cancelacion_author_email.setMandatory(true);
    		var field_ce_cancelacion_cc				= form.addField('custpage_ce_cancelacion_cc','text', 'CC', null,'group_ce_cancelacion');
    			field_ce_cancelacion_cc.setDisplayType(fieldDisplayType);
    			field_ce_cancelacion_cc.setHelpText(help_ce_cancelacion_cc, true);
    		var field_ce_cancelacion_bcc			= form.addField('custpage_ce_cancelacion_bcc','text', 'BCC', null,'group_ce_cancelacion');
    			field_ce_cancelacion_bcc.setDisplayType(fieldDisplayType);
    			field_ce_cancelacion_bcc.setHelpText(help_ce_cancelacion_bcc, true);
    		var field_ce_cancelacion_asunto			= form.addField('custpage_ce_cancelacion_asunto','text', 'Asunto', null,'group_ce_cancelacion');
    			field_ce_cancelacion_asunto.setDisplayType(fieldDisplayType);
    			field_ce_cancelacion_asunto.setHelpText(help_ce_cancelacion_asunto, true);
    			field_ce_cancelacion_asunto.setMandatory(true);
    		var field_ce_cancelacion_mensaje		= form.addField('custpage_ce_cancelacion_mensaje',fieldHTMLType, 'Mensaje', null,'group_ce_cancelacion');
    			field_ce_cancelacion_mensaje.setDisplayType(fieldDisplayType);
    			field_ce_cancelacion_mensaje.setHelpText(help_ce_cancelacion_mensaje, true);
    			field_ce_cancelacion_mensaje.setMandatory(true);
	        var value_ce_timbrado_email_author		= '';
	        var value_ce_cancelacion_email_author	= '';
	        if(value_ce_timbrado_author != '')
	        {
		        var filters								= new Array();
		        	filters.push(new nlobjSearchFilter('internalid', null, 'is', value_ce_timbrado_author));
		        var columns								= new Array();
		        	columns.push(new nlobjSearchColumn('email', null, null));
		        var timbradoEmployeeSearch				= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
		        if(timbradoEmployeeSearch != '')
		        {
		        	value_ce_timbrado_email_author 		= returnBlank(timbradoEmployeeSearch[0].getValue('email'));
		        }
	        }
	        if(value_ce_cancelacion_author != '')
	        {
		        var filters								= new Array();
		        	filters.push(new nlobjSearchFilter('internalid', null, 'is', value_ce_cancelacion_author));
		        var columns								= new Array();
		        	columns.push(new nlobjSearchColumn('email', null, null));
		        var cancelacionEmployeeSearch			= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
		        if(cancelacionEmployeeSearch != '')
		        {
		        	value_ce_cancelacion_email_author 	= returnBlank(cancelacionEmployeeSearch[0].getValue('email'));
		        }
	        }
			var values 										= new Object();
				values.custpage_mode						= mode;
				values.custpage_confirmation				= ShowAlertBox;
				values.custpage_user_pruebas				= value_user_pruebas;
				values.custpage_url_timbrado_pruebas		= value_url_timbrado_pruebas;
				values.custpage_url_cancelacion_pruebas		= value_url_cancelacion_pruebas;
				values.custpage_user_produccion				= value_user_produccion;
				values.custpage_url_timbrado_produccion		= value_url_timbrado_produccion;
				values.custpage_url_cancelacion_produccion	= value_url_cancelacion_produccion;
				values.custpage_ambiente_seleccion			= value_ambiente_seleccion;
				values.custpage_ce_timbrado_activar			= value_ce_timbrado_activar;
				values.custpage_ce_timbrado_author			= value_ce_timbrado_author;
				values.custpage_ce_timbrado_author_email	= value_ce_timbrado_email_author;
				values.custpage_ce_timbrado_cc 				= value_ce_timbrado_cc;
				values.custpage_ce_timbrado_bcc				= value_ce_timbrado_bcc;
				values.custpage_ce_timbrado_asunto			= value_ce_timbrado_asunto;
				values.custpage_ce_timbrado_mensaje			= value_ce_timbrado_mensaje;
				values.custpage_ce_cancelacion_activar		= value_ce_cancelacion_activar;
				values.custpage_ce_cancelacion_author		= value_ce_cancelacion_author;
				values.custpage_ce_cancelacion_author_email	= value_ce_cancelacion_email_author;
				values.custpage_ce_cancelacion_cc 			= value_ce_cancelacion_cc;
				values.custpage_ce_cancelacion_bcc			= value_ce_cancelacion_bcc;
				values.custpage_ce_cancelacion_asunto		= value_ce_cancelacion_asunto;
				values.custpage_ce_cancelacion_mensaje		= value_ce_cancelacion_mensaje;
				switch(mode)
				{
					case 'edit':
					{
						values.custpage_password_pruebas	= value_password_pruebas;
						values.custpage_password_produccion	= value_password_produccion;
					};break;
					default:
					{
						var pass_pruebas 	= '';
						var pass_produccion = '';
						for(var i=0;i<value_password_pruebas.length;i++)
						{
							pass_pruebas += "*"; 
						}
						for(var i=0;i<value_password_produccion.length;i++)
						{
							pass_produccion += "*"; 
						}
						values.custpage_password_pruebas	= pass_pruebas;
						values.custpage_password_produccion	= pass_produccion;
					};break;
				}
			form.setFieldValues(values);
			if(createButtonCancel == true)
			{
				var urlSUITELET				= nlapiResolveURL("SUITELET", "customscript_tn_sf_se_form", "customdeploy_tn_sf_se_form", false);
				var	url 					= urlSUITELET;
				form.addButton('custpage_cancel_button', 'Cancelar', "window.location.href='"+url+"'");
				form.setScript('customscript_tn_sf_se_form_fv');
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
					var data											= new Object();
				    	data.exito 	  						   		    = 'T';
				    	data	    									= JSON.stringify(data);
				    	data	    									= Base64.encode(data);
			    	params_edit											= new Array();
		            params_edit['data']									= data;
					var TN_SF_SE 										= new Object();
						TN_SF_SE.custpage_user_pruebas					= Base64.encode(returnBlank(request.getParameter('custpage_user_pruebas')));
						TN_SF_SE.custpage_password_pruebas				= Base64.encode(returnBlank(request.getParameter('custpage_password_pruebas')));
						TN_SF_SE.custpage_url_timbrado_pruebas			= Base64.encode(returnBlank(request.getParameter('custpage_url_timbrado_pruebas')));
						TN_SF_SE.custpage_url_cancelacion_pruebas		= Base64.encode(returnBlank(request.getParameter('custpage_url_cancelacion_pruebas')));
						TN_SF_SE.custpage_user_produccion				= Base64.encode(returnBlank(request.getParameter('custpage_user_produccion')));
						TN_SF_SE.custpage_password_produccion			= Base64.encode(returnBlank(request.getParameter('custpage_password_produccion')));
						TN_SF_SE.custpage_url_timbrado_produccion		= Base64.encode(returnBlank(request.getParameter('custpage_url_timbrado_produccion')));
						TN_SF_SE.custpage_url_cancelacion_produccion	= Base64.encode(returnBlank(request.getParameter('custpage_url_cancelacion_produccion')));
						TN_SF_SE.custpage_ambiente_seleccion			= Base64.encode(returnBlank(request.getParameter('custpage_ambiente_seleccion')));
						TN_SF_SE.custpage_ce_timbrado_activar			= Base64.encode(returnFalse(request.getParameter('custpage_ce_timbrado_activar')));
		        		TN_SF_SE.custpage_ce_timbrado_author			= Base64.encode(returnBlank(request.getParameter('custpage_ce_timbrado_author')));
		        		TN_SF_SE.custpage_ce_timbrado_cc				= Base64.encode(returnBlank(request.getParameter('custpage_ce_timbrado_cc')));
		        		TN_SF_SE.custpage_ce_timbrado_bcc				= Base64.encode(returnBlank(request.getParameter('custpage_ce_timbrado_bcc')));
		        		TN_SF_SE.custpage_ce_timbrado_asunto			= Base64.encode(returnBlank(request.getParameter('custpage_ce_timbrado_asunto')));
		        		TN_SF_SE.custpage_ce_timbrado_mensaje			= Base64.encode(returnBlank(request.getParameter('custpage_ce_timbrado_mensaje')));
						TN_SF_SE.custpage_ce_cancelacion_activar		= Base64.encode(returnFalse(request.getParameter('custpage_ce_cancelacion_activar')));
		        		TN_SF_SE.custpage_ce_cancelacion_author			= Base64.encode(returnBlank(request.getParameter('custpage_ce_cancelacion_author')));
		        		TN_SF_SE.custpage_ce_cancelacion_cc				= Base64.encode(returnBlank(request.getParameter('custpage_ce_cancelacion_cc')));
		        		TN_SF_SE.custpage_ce_cancelacion_bcc			= Base64.encode(returnBlank(request.getParameter('custpage_ce_cancelacion_bcc')));
		        		TN_SF_SE.custpage_ce_cancelacion_asunto			= Base64.encode(returnBlank(request.getParameter('custpage_ce_cancelacion_asunto')));
		        		TN_SF_SE.custpage_ce_cancelacion_mensaje		= Base64.encode(returnBlank(request.getParameter('custpage_ce_cancelacion_mensaje')));
		        		TN_SF_SE.custpage_tel_activar					= Base64.encode(returnBlank(request.getParameter('custpage_tel_activar')));
		        		TN_SF_SE.custpage_tel_titulo_offline			= Base64.encode(returnBlank(request.getParameter('custpage_tel_titulo_offline')));
		        		TN_SF_SE.custpage_tel_mensaje_offline			= Base64.encode(returnBlank(request.getParameter('custpage_tel_mensaje_offline')));
					var TN_SF_SE_as_text								= JSON.stringify(TN_SF_SE);
					var filtersFile										= new Array();
						filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'TN_SF_SE.json'));
					var columnsFile										= new Array();
						columnsFile.push(new nlobjSearchColumn('folder'));
					var searchFile										= returnBlank(nlapiSearchRecord('file', null, filtersFile, columnsFile));
					var TN_SF_SE_FOLDER									= searchFile[0].getValue('folder'); 
			    	var dataFile										= nlapiCreateFile('TN_SF_SE.json', 'PLAINTEXT', TN_SF_SE_as_text);
			    		dataFile.setFolder(TN_SF_SE_FOLDER);
			    	var dataFileID										= nlapiSubmitFile(dataFile);
			    	nlapiLogExecution('ERROR', 'dataFileID', dataFileID);
				};break;
				default:
				{
		            params_edit			= new Array();
	            	params_edit['mode']	= Base64.encode('edit');
				};break;
			}
			nlapiSetRedirectURL('SUITELET','customscript_tn_sf_se_form', 'customdeploy_tn_sf_se_form', false, params_edit);
			nlapiLogExecution('ERROR', "redireccionado edit", "redireccionado edit");
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
    	nlapiSetRedirectURL('SUITELET','customscript_tn_sf_he', 'customdeploy_tn_sf_he', false, params_handler_error);
    	nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
  	}
}