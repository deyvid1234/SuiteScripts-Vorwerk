function WelcomeMail_FORM(request, response)
{
	var Base64		= new MainBase64();
	var titleForm	= 'Welcome Mail en Demanda';
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(request.getMethod() == "GET")
		{
			var context							= nlapiGetContext();
			var currentURL						= request.getURL();
			var index 							= currentURL.indexOf("/app");
			var data 							= returnBlank(request.getParameter('data'));
			var value_entity 					= new String();
			var value_salesrep 					= new String();
			var value_tranid 					= new String();
			var value_fecha_desde 				= new String();
			var value_fecha_hasta 				= new String();
			if(data != '')
			{
				data	   						= Base64.decode(data);
				data							= JSON.parse(data);
				value_entity 					= returnNumber(data.value_entity);
				value_salesrep 					= returnBlank(data.value_salesrep);
				value_tranid 					= returnBlank(data.value_tranid);
				value_fecha_desde 				= returnBlank(data.value_fecha_desde);
				value_fecha_hasta 				= returnBlank(data.value_fecha_hasta);
			}
			var value_usuario					= context.getUser();
			var value_correo					= context.getEmail();
			var value_fecha						= nlapiDateToString(new Date(), 'datetimetz');
		    var value_host						= currentURL.substring(0, index);
		    
		    var help_entity						= 'Indica el cliente sobre el cual se realizará el <i>Welcome Mail en Demanda</i>';
		    var help_salesrep					= 'Indica el representante de ventas sobre el cual se realizará el <i>Welcome Mail en Demanda</i>';
		    var help_tranid						= 'Indica el número de pedido sobre el cual se realizará el <i>Welcome Mail en Demanda</i>';
		    var help_fecha_desde				= 'Indica la fecha desde la cual se realizará el <i>Welcome Mail en Demanda</i>';
		    var help_fecha_hasta				= 'Indica la fecha hasta la cual se realizará el <i>Welcome Mail en Demanda</i>';
		    var help_tipo_envio					= 'Indica el tipo de envio sobre el cual se realizará el <i>Welcome Mail en Demanda</i>';
				help_tipo_envio  	   	 	   += '<ul>';
					help_tipo_envio   		       += '<li>Pruebas: El <i>Welcome Mail en Demanda</i> será enviado a la dirección de correo electronico del empleado (' + value_correo + ').</li>';
					help_tipo_envio   			   += '<li>Producción: El <i>Welcome Mail en Demanda</i> será enviado a la dirección de correo electronico del cliente.</li>';
				help_tipo_envio  	   	       += '</ul>';
			var form 							= nlapiCreateForm(titleForm);
				form.addSubmitButton('Enviar');
				form.addResetButton('Restablecer');
				form.setScript('customscript_welcome_mail_form_fv');
				form.addTab('custpage_detalles_tab', 'Detalles');
			var gTransaccion					= form.addFieldGroup( 'gTransaccion', 'Información de Transacción');
				gTransaccion.setShowBorder(true);
			var field_entity	 				= form.addField('custpage_entity', 'select', 'Cliente','customer','gTransaccion');
				field_entity.setMandatory(false);
				field_entity.setDefaultValue(value_entity);
				field_entity.setHelpText(help_entity, false);
			var field_salesrep	 				= form.addField('custpage_salesrep', 'select', 'Representante de Ventas','employee','gTransaccion');
				field_salesrep.setMandatory(false);
				field_salesrep.setDefaultValue(value_salesrep);
				field_salesrep.setHelpText(help_salesrep, false);
			var field_tranid	 				= form.addField('custpage_tranid', 'text', 'N.º de Pedido',null,'gTransaccion');
				field_tranid.setMandatory(false);
				field_tranid.setDefaultValue(value_tranid);
				field_tranid.setHelpText(help_tranid, false);
			var field_fecha_desde 				= form.addField('custpage_fecha_desde', 'date', 'Fecha Desde',null,'gTransaccion');
				field_fecha_desde.setMandatory(true);
				field_fecha_desde.setDefaultValue(value_fecha_desde);
				field_fecha_desde.setHelpText(help_fecha_desde, false);
			var field_fecha_hasta 				= form.addField('custpage_fecha_hasta', 'date', 'Fecha Hasta',null,'gTransaccion');
				field_fecha_hasta.setMandatory(true);
				field_fecha_hasta.setDefaultValue(value_fecha_hasta);
				field_fecha_hasta.setHelpText(help_fecha_hasta, false);
			var field_tipo_envio_label			= form.addField('custpage_tipo_envio_label','label','Tipo de Envio',null,'gTransaccion');
				field_tipo_envio_label.setLayoutType('startrow');
				field_tipo_envio_label.setHelpText(help_tipo_envio, false);
			var field_tipo_envio_a				= form.addField('custpage_tipo_envio', 'radio','Pruebas', 'A','gTransaccion');
				field_tipo_envio_a.setLayoutType('midrow');
			var field_tipo_envio_b				= form.addField('custpage_tipo_envio', 'radio','Producción','B','gTransaccion');
				field_tipo_envio_b.setLayoutType('midrow');
				field_tipo_envio_b.setDefaultValue('B');
			var field_tran_ids 					= form.addField('custpage_tran_ids', 'multiselect', 'Internal IDS','salesorder','gTransaccion');
				field_tran_ids.setDisplayType('hidden');
			var field_usuario					= form.addField('custpage_usuario', 'select', 'User','employee','gTransaccion');
				field_usuario.setDisplayType('hidden');
				field_usuario.setDefaultValue(value_usuario);
			var field_correo					= form.addField('custpage_correo', 'email', 'Correo',null,'gTransaccion');
				field_correo.setDisplayType('hidden');
				field_correo.setDefaultValue(value_correo);
			var field_fecha						= form.addField('custpage_fecha', 'datetimetz', 'Fecha',null,'gTransaccion');
				field_fecha.setDisplayType('hidden');
				field_fecha.setDefaultValue(value_fecha);
			var field_host						= form.addField('custpage_host', 'url', 'Host',null,'gTransaccion');
				field_host.setDisplayType('hidden');
				field_host.setDefaultValue(value_host);
			var sublist 						= form.addSubList('custpage_resultados_sublist', 'list', 'Resultados', 'custpage_detalles_tab');
				sublist.addMarkAllButtons();
				sublist.addField('custpage_num_linea', 'integer', '#');
				sublist.addField('custpage_sublist_seleccionar', 'checkbox', 'Seleccionar');
				sublist.addField('custpage_sublist_trandate', 'date', 'Fecha'); 
				sublist.addField('custpage_sublist_transaction', 'select', 'Orden de Venta','salesorder').setDisplayType('inline');
				sublist.addField('custpage_sublist_entity', 'select', 'Cliente','customer').setDisplayType('inline');
				sublist.addField('custpage_sublist_salesrep', 'select', 'Representante de Ventas','employee').setDisplayType('inline');
			if(data != '')
			{
				var filters							= new Array();
					filters.push(new nlobjSearchFilter('trandate', null, 'within', value_fecha_desde, value_fecha_hasta));
					if(value_entity != '')
					{
						filters.push(new nlobjSearchFilter('entity', null, 'anyof', value_entity));	
					}
					if(value_salesrep != '')
					{
						filters.push(new nlobjSearchFilter('salesrep', null, 'anyof', value_salesrep));	
					}
					if(value_tranid != '')
					{
						filters.push(new nlobjSearchFilter('tranid', null, 'is', value_tranid));	
					}
				var searchResults 					= returnBlank(nlapiSearchRecord('salesorder', 'customsearch_welcome_mail', filters, null));
				for(var i=0;i<searchResults.length;i++)
				{
					var lineNumber 				= new Number(i + 1);
					var seleccionar				= 'F';
					var trandate 				= returnBlank(searchResults[i].getValue('trandate'));
					var transaction				= returnBlank(searchResults[i].getId());
					var entity 					= returnBlank(searchResults[i].getValue('entity'));
					var salesrep 				= returnBlank(searchResults[i].getValue('salesrep'));
					sublist.setLineItemValue('custpage_num_linea', i+1, lineNumber.toString());
					sublist.setLineItemValue('custpage_sublist_seleccionar', i+1, seleccionar);
					sublist.setLineItemValue('custpage_sublist_trandate', i+1, trandate);
					sublist.setLineItemValue('custpage_sublist_transaction', i+1, transaction);
					sublist.setLineItemValue('custpage_sublist_entity', i+1, entity);
					sublist.setLineItemValue('custpage_sublist_salesrep', i+1, salesrep);
				}
			}
			response.writePage(form);
		}
		else
		{
			var searchResults_wmmeu	= returnBlank(nlapiSearchRecord('customrecord_wm_en_uso', 'customsearch_wm_en_uso', null, null));
			if(searchResults_wmmeu != '')
			{
				var type														= new String();
				var title														= new String();
				var descr		 		 										= new String();
				var identacion													= '<td>&nbsp;</td><td>&nbsp;</td><td>ᐅ</td>'; 
		    	var url_welcome_mail_form_st 									= nlapiResolveURL('SUITELET','customscript_welcome_mail_form_st', 'customdeploy_welcome_mail_form_st', false);
		    	var custpage_tipo_envio											= returnBlank(request.getParameter('custpage_tipo_envio'));
				var custpage_usuario 											= returnBlank(request.getParameter('custpage_usuario'));
				var custpage_correo												= returnBlank(request.getParameter('custpage_correo'));
				var custpage_fecha 												= returnBlank(request.getParameter('custpage_fecha'));
				var custpage_host												= returnBlank(request.getParameter('custpage_host'));
				var custpage_tran_ids 											= returnBlank(request.getParameterValues('custpage_tran_ids'));
					custpage_tran_ids											= custpage_tran_ids.join();
				var params_sd													= new Array();
					params_sd['custscript_wm_sd_tipo_envio']					= custpage_tipo_envio;
					params_sd['custscript_wm_sd_usuario']						= custpage_usuario;
					params_sd['custscript_wm_sd_email']							= custpage_correo;
					params_sd['custscript_wm_sd_fecha']							= custpage_fecha;
					params_sd['custscript_wm_sd_host']							= custpage_host;
					params_sd['custscript_wm_sd_tran_ids']						= custpage_tran_ids;
				var status														= returnBlank(nlapiScheduleScript('customscript_welcome_mail_sd', 'customdeploy_welcome_mail_sd_ns', params_sd));
				switch(status)
				{
					case 'QUEUED':
					{
						type	= 'confirmation';
						title	= 'Operación Exitosa';
						descr  += '<table>';
							descr  += '<tr><td></td></tr>';
							descr  += '<tr><td>El proceso ha sido programado correctamente.</td></tr>';
							descr  += '<tr><td>Haga click <a href="' + url_welcome_mail_form_st + '" title="Al finalizar el proceso, sera enviada una notificación a su correo electrónico">aquí</a> para consultar el estado de la ejecución del proceso.</td></tr>';
							descr  += '<tr><td>Puede continuar navegando en <b>NetSuite</b>.</td></tr>';
						descr  += '</table>';
					};break;
					case 'INQUEUE':
					{							
						type	= 'alert';
						title	= 'Operación Restringida';
						descr  += '<table>';
							descr  += '<tr><td></td></tr>';
							descr  += '<tr><td>El proceso ya se encuentra programado y en espera de ser ejecutado, intente de nuevo más tarde.</td></tr>';
							descr  += '<tr><td>Haga click <a href="' + url_welcome_mail_form_st + '" title="Al finalizar el proceso, sera enviada una notificación a su correo electrónico">aquí</a> para consultar el estado de la ejecución del proceso.</td></tr>';
							descr  += '<tr><td>Puede continuar navegando en <b>NetSuite</b>.</td></tr>';
						descr  += '</table>';
					};break;
					case 'INPROGRESS':
					{
						type	= 'alert';
						title	= 'Operación en Progreso';
						descr  += '<table>';
							descr  += '<tr><td></td></tr>';
							descr  += '<tr><td>El proceso se encuentra ejecutándose, intente de nuevo más tarde.</td></tr>';
							descr  += '<tr><td>Haga click <a href="' + url_welcome_mail_form_st + '" title="Al finalizar el proceso, sera enviada una notificación a su correo electrónico">aquí</a> para consultar el estado de la ejecución del proceso.</td></tr>';
							descr  += '<tr><td>Puede continuar navegando en <b>NetSuite</b>.</td></tr>';
						descr  += '</table>';
					};break;
					case 'SCHEDULED':
					{
						type	= 'info';
						title	= 'Operación en Espera';
						descr  += '<table>';
							descr  += '<tr><td></td></tr>';
							descr  += '<tr><td>El proceso ha sido programado correctamente y en espera de ser ejecutado.</td></tr>';
							descr  += '<tr><td>Haga click <a href="' + url_welcome_mail_form_st + '" title="Al finalizar el proceso, sera enviada una notificación a su correo electrónico">aquí</a> para consultar el estado de la ejecución del proceso.</td></tr>';
							descr  += '<tr><td>Puede continuar navegando en <b>NetSuite</b>.</td></tr>';
						descr  += '</table>';
					};break;
					default:
					{
						type	= 'error';
						title	= 'Operación Fallida';
						descr  += '<table>';
							descr  += "<tr>" + identacion + "<td>" + '<b>Unidentified Status: </b>' + "</td><td>" + "<i>" + status + "</i>"	+"</td></tr>";
						descr  += '</table>';
						descr  += '<table>';
							descr  += '<tr><td></td></tr>';
							descr  += '<tr><td></td></tr>';
							descr  += '<tr><td>Consulte a Soporte T&eacute;cnico y mueste este mensaje.</td></tr>';
							descr  += '<tr><td>Puede continuar navegando en <b>NetSuite</b>.</td></tr>';
						descr  += '</table>';
					};break;
				}
				var ID						= searchResults_wmmeu[0].getId();
				var fields_wmeu				= new Array();
					fields_wmeu.push('custrecord_wm_en_uso_en_uso');
				var values_wmeu				= new Array();
					values_wmeu.push('T');
				nlapiSubmitField('customrecord_wm_en_uso', ID, fields_wmeu, values_wmeu);
				var data_st					= new Object();
					data_st.type		 	= type;
					data_st.title			= title;
					data_st.descr		 	= descr;
					data_st					= JSON.stringify(data_st);
					data_st   		 		= Base64.encode(data_st);
		        var params					= new Array();
		        	params['data']			= data_st;
		    	nlapiSetRedirectURL('SUITELET','customscript_welcome_mail_form_st', 'customdeploy_welcome_mail_form_st_pre', false, params);
			}
		}
	}
    catch(error)
    {
    	var customscript		= 'customscript_welcome_mail_config_he';
    	var customdeploy		= 'customdeploy_welcome_mail_config_he';
    	var HE_Catch_UE 		= Generic_HE_Catch_UE(error,recordType,recordId,titleForm,request,false);
        var HE_Params			= new Array();
        	HE_Params['data']	= HE_Catch_UE;
		nlapiSetRedirectURL('SUITELET',customscript,customdeploy, false, HE_Params);
    }
}
