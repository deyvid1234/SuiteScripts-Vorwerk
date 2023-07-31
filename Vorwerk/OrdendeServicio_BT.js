/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Mar 2015     sergioponce
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function OrdendeServicioButton(type, form, request)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'view')
		{
			var titleForm		= 'Imp. Orden de Servicio';
			var Base64			= new MainBase64();
			var currentURL		= request.getURL();
			var index 			= currentURL.indexOf("/app");
		    var host  			= currentURL.substring(0, index);		
			var data			= '';
		    	data	   	   += recordType	+ String.fromCharCode(10);
		    	data	   	   += recordId		+ String.fromCharCode(10);
		    	data	  	   += host			+ String.fromCharCode(10);
		    	data	    	= Base64.encode(data);
			var url 			= nlapiResolveURL("SUITELET", "customscript_orden_servicio_pdf", "customdeploy_orden_servicio_pdf", false);
				url 	   	   += "&data=" 	+ data;			
			//form.addButton("custpage_imp_orden_de_servicio", titleForm, "window.open('"+url+"')");
		}
	}
	catch(error)
	{
    	Generic_HE_Catch_SS(error,recordType,recordId);
  	}
}
