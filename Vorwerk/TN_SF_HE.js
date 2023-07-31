function TN_SF_HE(request, response)
{
	var Base64		= new MainBase64();
	try
	{
		if (request.getMethod() == "GET")
		{
			var data					= request.getParameter('data');
				data	   				= Base64.decode(data);
				data					= JSON.parse(data);
			var titleForm				= returnBlank(data.titleForm);
			var exito					= returnFalse(data.exito);
			var tituloFallo				= returnBlank(data.tituloFallo);
			var mensajeFallo			= returnBlank(data.mensajeFallo);
			var ShowAlertBox			= GetShowAlertBoxMessage(exito,'','',tituloFallo,mensajeFallo);
			var form 					= nlapiCreateForm(titleForm);      
			var field_html 				= form.addField('custpage_html', 'inlinehtml', 'Confirmation');
				field_html.setLayoutType('outsideabove','startrow');
			var values 					= new Object();
				values.custpage_html 	= ShowAlertBox;
			form.setFieldValues(values);
			response.writePage(form);
		}
		else
		{
			
		}
	}
    catch(e)
    {
		if ( e instanceof nlobjError )
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
        }
        else
        {
            nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
        }
    }
}