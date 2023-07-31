function Envio_PDF_Masivo_SD(type) 
{
	var Base64		= new MainBase64();
	var recordType	= new String();
	var recordId	= new String();
	try
	{
		var context									= nlapiGetContext();
		var custscript_env_pdf_mas_sd_record_type 	= returnBlank(context.getSetting('SCRIPT', 'custscript_env_pdf_mas_sd_record_type'));
		var custscript_env_pdf_mas_sd_record_id		= returnBlank(context.getSetting('SCRIPT', 'custscript_env_pdf_mas_sd_record_id'));
		var custscript_env_pdf_mas_sd_usuario		= returnBlank(context.getSetting('SCRIPT', 'custscript_env_pdf_mas_sd_usuario'));
		var custscript_env_pdf_mas_sd_correo		= returnBlank(context.getSetting('SCRIPT', 'custscript_env_pdf_mas_sd_correo'));
		var custscript_env_pdf_mas_sd_host			= returnBlank(context.getSetting('SCRIPT', 'custscript_env_pdf_mas_sd_host'));
		/*/
		nlapiLogExecution('ERROR', 'custscript_env_pdf_mas_sd_record_type', custscript_env_pdf_mas_sd_record_type);
		nlapiLogExecution('ERROR', 'custscript_env_pdf_mas_sd_record_id', custscript_env_pdf_mas_sd_record_id);
		nlapiLogExecution('ERROR', 'custscript_env_pdf_mas_sd_usuario', custscript_env_pdf_mas_sd_usuario);
		nlapiLogExecution('ERROR', 'custscript_env_pdf_mas_sd_correo', custscript_env_pdf_mas_sd_correo);
		nlapiLogExecution('ERROR', 'custscript_env_pdf_mas_sd_host', custscript_env_pdf_mas_sd_host);
		/*/
		context.setPercentComplete(1);
		var record									= nlapiLoadRecord(custscript_env_pdf_mas_sd_record_type, custscript_env_pdf_mas_sd_record_id,{recordmode:'dynamic'});
		var custrecord_data_urls					= record.getFieldValue('custrecord_data_urls');
			custrecord_data_urls					= Base64.decode(custrecord_data_urls);
			custrecord_data_urls					= JSON.parse(custrecord_data_urls);
		var urls									= returnBlank(custrecord_data_urls.urls);
		var lines									= urls.length;
		var porcentaje_iteracion					= (1 * 99)/lines;
		var url_suitelet			 				= nlapiResolveURL("SUITELET", "customscript_imp_rep_com_pdf", "customdeploy_imp_rep_com_pdf", true) + "&data=";
		context.setPercentComplete(2);
		for(var i=0;i<lines;i++)
		{
			var url		= url_suitelet + urls[i];
			try
			{
				nlapiRequestURL(url,null, null, null);
			}
			catch(error)
			{
				nlapiLogExecution('ERROR','url',url);
			}
			var porcentaje	= (porcentaje_iteracion * (i+1));
			context.setPercentComplete(porcentaje.toFixed(2));
		}
		context.setPercentComplete(99);
		var url_record			= custscript_env_pdf_mas_sd_host + nlapiResolveURL("RECORD", custscript_env_pdf_mas_sd_record_type, custscript_env_pdf_mas_sd_record_id, 'VIEW');
		var body				= '';
			body			   += '<html>';
				body			   += '<head>';
					body		       += '<body>';
						body		       += '<font face="tahoma" size="2">El <b>Enviar PDF Masivo</b> ha terminado, haga click <a href='+ url_record + '>aquí</a> para ver los resultados.</font>';
						body			   += '<br><br>';
						body			   += '<font face="tahoma" size="2">Nota: requiere acceso a <b>NetSuite</b>.</font>';
					body			   += '</body>';
				body			   += '</head>';
			body			   += '</html>';
		var subject					= 'Enviar PDF Masivo: Terminado';
		var records		 			= new Array();
			records['recordtype'] 	= custscript_env_pdf_mas_sd_record_type;
			records['record'] 		= custscript_env_pdf_mas_sd_record_id;
		nlapiSendEmail(custscript_env_pdf_mas_sd_usuario, custscript_env_pdf_mas_sd_correo, subject, body, null, null, records, null);
		context.setPercentComplete(100);	
	}
	catch(error)
	{
    	Generic_HE_Catch_SS(error,recordType,recordId);
  	}
}