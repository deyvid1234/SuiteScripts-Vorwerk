/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 May 2015     sergioponce
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function Mail_Cocina_SS(type) {
	
	var recordType	= new String();
	var recordId	= new String();
	
	try
	{
		var day   	= new Date();
		var today 	= day.getDate();
		var month	= day.getMonth() + 1;
		var year	= day.getFullYear();
		var no_days = HowManyDaysInMonth(month, year);
		
		if(today == no_days)
		{
			var author						= new String();
			var recipient					= new String();
			var subject						= new String();
			var body						= new String();
			var searchRecipient				= nlapiSearchRecord('customer', 'customsearch779');
			if(searchRecipient != '')
			{
				var template				= nlapiLoadRecord('emailtemplate', 21);
				
				for(var a = 0; a<searchRecipient.length; a++)
				{
					var email					= searchRecipient[a].getValue('email');
					if(email != '')
					{
						author					= 13483;
						recipient				= searchRecipient[a].getValue('internalid');
						nlapiLogExecution('ERROR', 'MAIL asistencia', recipient);
						subject					= template.getFieldValue('subject');
						body					= template.getFieldValue('content');
						
						var objRenderer = nlapiCreateTemplateRenderer();
						objRenderer.setTemplate(body);
						objRenderer.addRecord('customer',nlapiLoadRecord('customer',recipient));
						var finalEmailText = objRenderer.renderToString();
						nlapiSendEmail(author, recipient, subject, finalEmailText);
					}
				}
			}
			var searchRecipientNO				= nlapiSearchRecord('customer', 'customsearch780');
			if(searchRecipientNO != '')
			{
		
				var template				= nlapiLoadRecord('emailtemplate', 23);
				
				for(var a = 0; a<searchRecipient.length; a++)
				{
					var email					= searchRecipientNO[a].getValue('email');
					if(email != '')
					{
						author					= 13483;
						recipient				= searchRecipientNO[a].getValue('internalid');
						nlapiLogExecution('ERROR', 'MAIL no asistencia', recipient);
						subject					= template.getFieldValue('subject');
						body					= template.getFieldValue('content');
						
						var objRenderer = nlapiCreateTemplateRenderer();
						objRenderer.setTemplate(body);
						objRenderer.addRecord('customer',nlapiLoadRecord('customer',recipient));
						var finalEmailText = objRenderer.renderToString();
						nlapiSendEmail(author, recipient, subject, finalEmailText);
					}
				}
			}
		}
	}
	catch(error)
	{
		Generic_HE_Catch_SS(error,recordType,recordId);
	}
}

function HowManyDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}
