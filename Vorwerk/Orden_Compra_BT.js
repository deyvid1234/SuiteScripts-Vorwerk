function Orden_Compra_BT(type, form, request)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'view')
		{
			var titleForm		= 'Imp. Orden de Compra';
			var Base64			= new MainBase64();
			var currentURL		= request.getURL();
			var index 			= currentURL.indexOf("/app");
		    var host  			= currentURL.substring(0, index);		
			var data			= '';
		    	data	   	   += recordType	+ String.fromCharCode(10);
		    	data	   	   += recordId		+ String.fromCharCode(10);
		    	data	  	   += host			+ String.fromCharCode(10);
		    	data	    	= Base64.encode(data);
	    	var url 			= nlapiResolveURL("SUITELET", "customscript_orden_compra_st", "customdeploy_orden_compra_st", false);
				url 	   		+= "&data=" 	+ data;
			form.addButton("custpage_imp_orden_venta", titleForm, "window.open('"+url+"')");
			
		}
	}
	catch(e)
	{
		Generic_HE_Catch_SS(error,recordType,recordId);
	}
}