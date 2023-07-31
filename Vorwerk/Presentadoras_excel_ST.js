/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Sep 2016     IMR
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function Presentadoras_excel_ST(request, response){
	var titleForm	= 'Excel de Presentadora';
	var Base64		= new MainBase64();
	var recordType	= new String();
	var recordId	= new String();
	try{
		if(request.getMethod()=='GET'){
			
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
			var searchResults		= returnBlank(nlapiSearchRecord('scheduledscriptinstance', 'customsearch_envios_excel_presentadora', null, null));
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
			var descr					= '<table>';
				descr					+= '<tr><td></td></tr>';
				descr					+= '<tr><td>Para monitorear el progreso de este proceso, haga clic en el botón <i>Actualizar</i> de su navegador.</td></tr>';
				descr					+= '<tr><td>Puede continuar navegando en <b>NetSuite</b>.</td></tr>';
			descr					+= '</table>';
			FeedbackMessage 					= getFeedbackMessage(type,title,descr);
			values 								= new Object();
			values.custpage_feedback_message	= FeedbackMessage;
			form.setFieldValues(values);
			form.addField('custpage_enviar', 'checkbox', 'Enviar').setDisplayType('hidden');
			var script	= "nlapiSetFieldValue('custpage_enviar', 'T'); ";
			script	   += "document.getElementById('submitter').click();"
			form.addButton('custpage_btn_enviar', 'Enviar', script);
			form.addSubmitButton('Actualizar');
			response.writePage(form);
		}else{
			if(request.getParameter('custpage_enviar')=='T'){
				var user							= nlapiGetUser();
				params								= new Array();
				params['custscript_destinatario']	= user;
				nlapiScheduleScript('customscript_excel_presentadoras_ss', 'customdeploy_excel_presentadoras_ss', params);
			}	
			nlapiSetRedirectURL('SUITELET', 'customscript_informacion_excel_pres', 'customdeploy_informacion_excel_pres');	
		}
	}catch(error){
		Generic_HE_Catch_SS(error,recordType,recordId);
	}
}
