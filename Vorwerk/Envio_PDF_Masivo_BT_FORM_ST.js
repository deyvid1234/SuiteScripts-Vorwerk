function Envio_PDF_Masivo_BT_FORM_ST(request, response) 
{
	var Base64		= new MainBase64();
	var recordType	= new String();
	var recordId	= new String();
	try
	{
		var data												 	= returnBlank(request.getParameter('data'));
			data													= Base64.decode(data);
			data													= JSON.parse(data);
		var _record_type											= returnBlank(data._record_type);
		var _record_id												= returnBlank(data._record_id);
		var _usuario												= returnBlank(data._usuario);
		var _correo													= returnBlank(data._correo);
		var _host													= returnBlank(data._host);
		var params_sd												= new Array();
			params_sd['custscript_env_pdf_mas_sd_record_type']		= _record_type;
			params_sd['custscript_env_pdf_mas_sd_record_id']		= _record_id;
			params_sd['custscript_env_pdf_mas_sd_usuario']			= _usuario;
			params_sd['custscript_env_pdf_mas_sd_correo']			= _correo;
			params_sd['custscript_env_pdf_mas_sd_host']				= _host;
		var status													= nlapiScheduleScript('customscript_envio_pdf_masivo_sd', 'customdeploy_envio_pdf_masivo_sd', params_sd);
		var type													= new String();
		var title													= new String();
		var descr		 		 									= new String();
		var identacion												= '<td>&nbsp;</td><td>&nbsp;</td><td>ᐅ</td>';
		switch(status)
		{
			case 'QUEUED':
			{
				type	= 'confirmation';
				title	= 'Operación Exitosa';
				descr  += '<table>';
					descr  += '<tr><td></td></tr>';
					descr  += '<tr><td>El proceso ha sido programado correctamente.</td></tr>';
					descr  += '<tr><td>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso</td></tr>';
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
					descr  += '<tr><td>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso</td></tr>';
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
					descr  += '<tr><td>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso</td></tr>';
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
					descr  += '<tr><td>Presione el botón \"Estado\" para consultar el estado de la ejecución del proceso</td></tr>';
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
		var data_st					= new Object();
			data_st.type		 	= type;
			data_st.title			= title;
			data_st.descr		 	= descr;
			data_st					= JSON.stringify(data_st);
			data_st   		 		= Base64.encode(data_st);
        var params					= new Array();
        	params['data']			= data_st;
    	nlapiSetRedirectURL('SUITELET','customscript_envio_pdf_masivo_form_st', 'customdeploy_envio_pdf_masivo_form_st', false, params);
	}
	catch(error)
	{
    	Generic_HE_Catch_SS(error,recordType,recordId);
  	}
}
