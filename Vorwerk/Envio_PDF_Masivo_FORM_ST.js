function Envio_PDF_Masivo_FORM_ST(request, response) 
{
	var Base64		= new MainBase64();
	var recordType	= new String();
	var recordId	= new String();
	try
	{
		if(request.getMethod() == "GET")
		{
			var data 	= returnBlank(request.getParameter('data'));
			if(data != '')
			{
				data	 								= Base64.decode(data);
				data									= JSON.parse(data);
				var type								= returnBlank(data.type);
				var title								= returnBlank(data.title);
				var descr								= returnBlank(data.descr);
				var form 								= nlapiCreateForm('Enviar PDF Masivo');
					form.addTab('custpage_resultados_tab', 'Resultados');
				var field_feedback_message 				= form.addField('custpage_feedback_message', 'inlinehtml', 'Confirmation',null,'custpage_resultados_tab');
					field_feedback_message.setDisplayType('normal');
				var FeedbackMessage 					= getFeedbackMessage(type,title,descr);
				var values 								= new Object();
					values.custpage_feedback_message	= FeedbackMessage;
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
				filtersScript.push(new nlobjSearchFilter('scriptid',null, 'is', 'customscript_envio_pdf_masivo_sd'));
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
	catch(error)
	{
    	Generic_HE_Catch_SS(error,recordType,recordId);
  	}
}
