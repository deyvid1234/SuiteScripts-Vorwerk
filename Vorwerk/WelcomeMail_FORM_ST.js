function WelcomeMail_FORM_ST(request, response)
{
	var Base64		= new MainBase64();
	var titleForm	= 'Welcome Mail en Demanda';
	var recordType	= new String();
	var recordId	= new String();
	try
	{
		if(request.getMethod() == "GET")
		{
			var context						= nlapiGetContext();
			var deploymentId				= returnBlank(context.getDeploymentId());
			var type						= new String();
			var title						= new String();
			var descr						= new String();
			var FeedbackMessage 			= new String();
			var form 						= new Object();
			var sublist 					= new Object();
			var field_feedback_message		= new Object();
			var values 						= new Object();
			switch(deploymentId)
			{
				case 'customdeploy_welcome_mail_form_st_pre':
				{
					titleForm					= 'Pre Estado: ' + titleForm;
					var data 	= returnBlank(request.getParameter('data'));
					if(data != '')
					{
						data	 							= Base64.decode(data);
						data								= JSON.parse(data);
						type								= returnBlank(data.type);
						title								= returnBlank(data.title);
						descr								= returnBlank(data.descr);
						form 								= nlapiCreateForm(titleForm);
						form.addTab('custpage_resultados_tab', 'Resultados');
						field_feedback_message 				= form.addField('custpage_feedback_message', 'inlinehtml', 'Confirmation',null,'custpage_resultados_tab');
						field_feedback_message.setDisplayType('normal');
						FeedbackMessage 					= getFeedbackMessage(type,title,descr);
						values 								= new Object();
						values.custpage_feedback_message	= FeedbackMessage;
						form.setFieldValues(values);
						response.writePage(form);
					}
					
				};break;
				case 'customdeploy_welcome_mail_form_st':
				{
					titleForm					= 'Estado: ' + titleForm;
					form 						= nlapiCreateForm(titleForm);
					form.addTab('custpage_resultados_tab', 'Resultados');
					field_feedback_message 		= form.addField('custpage_feedback_message', 'inlinehtml', 'Confirmation',null,'custpage_resultados_tab');
					field_feedback_message.setDisplayType('normal');
					sublist 					= form.addSubList('custpage_resultados_sublist', 'staticlist', 'Resultados', 'custpage_resultados_tab');
					sublist.addField('custpage_num_linea', 'integer', '#');
					sublist.addField('custpage_sublist_fecha_creacion', 'text', 'Fecha de Creación');
					sublist.addField('custpage_sublist_fecha_inicio', 'text', 'Fecha de Inicio'); 
					sublist.addField('custpage_sublist_fecha_finalizacion', 'text', 'Fecha de finalización');
					sublist.addField('custpage_sublist_cola', 'text', 'Cola');
					sublist.addField('custpage_sublist_turno', 'text', 'Turno');
					sublist.addField('custpage_sublist_estado', 'text', 'Estado');
					sublist.addField('custpage_sublist_porcentaje', 'text', 'Porcentaje');
					var searchResults		= returnBlank(nlapiSearchRecord('scheduledscriptinstance', 'customsearch_welcomemail_form_st', null, null));
					for(var i=0;i<searchResults.length;i++)
					{
						var _num_linea 					= new Number(i + 1);
							_num_linea					= _num_linea.toString();
						var _sublist_fecha_creacion 	= returnBlank(searchResults[i].getValue('datecreated'));
						var _sublist_fecha_inicio 		= returnBlank(searchResults[i].getValue('startdate'));
						var _sublist_fecha_finalizacion	= returnBlank(searchResults[i].getValue('enddate'));
						var _sublist_cola				= returnBlank(searchResults[i].getValue('queue'));
						var _sublist_turno 				= returnBlank(searchResults[i].getValue('queueposition'));
						var _sublist_estado 			= returnBlank(searchResults[i].getValue('status'));
						var _sublist_porcentaje 		= returnBlank(searchResults[i].getValue('percentcomplete'));
						sublist.setLineItemValue('custpage_num_linea', _num_linea, _num_linea);
						sublist.setLineItemValue('custpage_sublist_fecha_creacion', _num_linea, _sublist_fecha_creacion);
						sublist.setLineItemValue('custpage_sublist_fecha_inicio', _num_linea, _sublist_fecha_inicio);
						sublist.setLineItemValue('custpage_sublist_fecha_finalizacion', _num_linea, _sublist_fecha_finalizacion);
						sublist.setLineItemValue('custpage_sublist_cola', _num_linea, _sublist_cola);
						sublist.setLineItemValue('custpage_sublist_turno', _num_linea, _sublist_turno);
						sublist.setLineItemValue('custpage_sublist_estado', _num_linea, _sublist_estado);
						sublist.setLineItemValue('custpage_sublist_porcentaje', _num_linea, _sublist_porcentaje);
					}
					type					= 'info';
					title					= 'Aviso';
					descr					+= '<table>';
						descr					+= '<tr><td></td></tr>';
						descr					+= '<tr><td>Para monitorear el progreso de este proceso, haga clic en el botón <i>Actualizar</i> de su navegador.</td></tr>';
						descr					+= '<tr><td>Puede continuar navegando en <b>NetSuite</b>.</td></tr>';
					descr					+= '</table>';
					FeedbackMessage 					= getFeedbackMessage(type,title,descr);
					values 								= new Object();
					values.custpage_feedback_message	= FeedbackMessage;
					form.setFieldValues(values);
					response.writePage(form);
				}
				default:
				{
					
				};break;
			}
		}
	}
    catch(error)
    {
    	var customscript		= 'customscript_ce_he';
    	var customdeploy		= 'customdeploy_ce_he';
    	var HE_Catch_UE 		= Generic_HE_Catch_UE(error,recordType,recordId,titleForm,request);
        var HE_Params			= new Array();
        	HE_Params['data']	= HE_Catch_UE;
		nlapiSetRedirectURL('SUITELET',customscript,customdeploy, false, HE_Params);
    }
}