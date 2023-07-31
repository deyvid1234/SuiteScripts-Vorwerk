function Envio_PDF_Masivo_BT(type) 
{
	var Base64		= new MainBase64();
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'view')
		{
			var titleForm				= 'Enviar PDF Masivo';
			var context					= nlapiGetContext();
			var _correo					= context.getEmail();
			var _usuario				= context.getUser();
			var currentURL				= request.getURL();
			var index 					= currentURL.indexOf("/app");
		    var host  					= currentURL.substring(0, index);
			var data					= new Object();
				data._record_type		= recordType;
				data._record_id			= recordId;
				data._usuario			= _usuario;
				data._correo			= _correo;
				data._host				= host;
				data					= JSON.stringify(data);
				data					= Base64.encode(data);
            var url 					= nlapiResolveURL('SUITELET', 'customscript_envio_pdf_masivo_bt_form_st', 'customdeploy_envio_pdf_masivo_bt_form_st');
            	url    		   		   += "&data=" + data;
			form.addButton("custpage_enviar_pdf_masivo", titleForm, "window.location.href='" + url + "'");
			var lines					= nlapiGetLineItemCount('custpage_detalle_comisiones');
			var urls					= new Array();
			for(var i=1;i<=lines;i++)
			{
				var custpage_det_enviar_aux	= nlapiGetLineItemValue('custpage_detalle_comisiones', 'custpage_det_enviar_aux', i);
				if(custpage_det_enviar_aux != '')
				{
					urls.push(custpage_det_enviar_aux);
				}
			}
			var data_urls				= new Object();
				data_urls.urls			= urls;
				data_urls				= JSON.stringify(data_urls);
				data_urls				= Base64.encode(data_urls);
			nlapiSubmitField(recordType, recordId, 'custrecord_data_urls', data_urls);
		}
	}
	catch(error)
	{
    	Generic_HE_Catch_SS(error,recordType,recordId);
  	}
}
