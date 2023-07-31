//===================================================================================================================================================================
// Script File	: TN_SF_BT_FORM.js
// Script Type  : User Event
// Description 	: Displays a bUtton to call a massive process in order to bill all transactions listed
// Author		: Unknown
// Date			: 28-12-2017
// Functions	:
//===================================================================================================================================================================


function TN_SF_BT_FORM(type, form, request)
{
	var Base64		= new MainBase64();
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'view')
		{
			var _elegir_comision		= returnNumber(nlapiGetFieldValue('custrecord_elegir_comision'));
			var context					= nlapiGetContext();
			var correo					= context.getEmail();
			var usuario					= context.getUser();
			var recordBaseInfo			= new Object();
			var recordBaseType			= '';
			var recordBaseData			= new Array();
			var colocarBoton			= new Boolean();
			switch(_elegir_comision)
			{
				case 1:
				{
					recordBaseType = 'customrecord_comisiones_jdg';
				};break;
				case 2:
				{
					recordBaseType = 'customrecord_comisiones_pre';
				};break;
				case 4:
				{
					recordBaseType = 'customrecord_comisiones_gtm';
				};break;
			}
			var lines 				= nlapiGetLineItemCount('custpage_detalle_comisiones');
			var contador			= 0;
			for(var i=1;i<=lines;i++)
			{
				var _det_cod_respuesta 	= returnNumber(nlapiGetLineItemValue('custpage_detalle_comisiones', 'custpage_det_cod_respuesta', i));
				var _det_comision 		= returnBlank(nlapiGetLineItemValue('custpage_detalle_comisiones', 'custpage_det_comision', i));
				var _det_subtotal 		= returnNumber(nlapiGetLineItemValue('custpage_detalle_comisiones', 'custpage_det_subtotal_currency', i));
				var _det_retencion 		= returnNumber(nlapiGetLineItemValue('custpage_detalle_comisiones', 'custpage_det_retencion_currency', i));
				var _det_total 			= returnNumber(nlapiGetLineItemValue('custpage_detalle_comisiones', 'custpage_det_total_currency', i));
				nlapiLogExecution('DEBUG', 'At line: ' + i + ' recordId: ' + _det_comision, 'Respuesta: ' + _det_cod_respuesta + ' Total: ' + _det_total)
				if(_det_cod_respuesta!= 200 && _det_total > 0)
				{
					var data 			= new Object();
						data.recordId	= _det_comision;
						data.subtotal	= _det_subtotal.toFixed(2);
						data.retencion	= _det_retencion.toFixed(2);
						data.total		= _det_total.toFixed(2);
					recordBaseData.push(data);
					colocarBoton		= true;
					contador++;
					if(contador>=50)
					{
						break;
					}
				}

			}
			nlapiLogExecution('DEBUG', 'recordBaseData: ' + recordBaseData.length, JSON.stringify(recordBaseData))
			recordBaseInfo.recordBaseType 	= recordBaseType;
			recordBaseInfo.recordBaseData 	= recordBaseData;
			recordBaseInfo					= JSON.stringify(recordBaseInfo);
			recordBaseInfo					= Base64.encode(recordBaseInfo);
			if(colocarBoton == true)
			{
				var data_fe_st					= new Object();
					data_fe_st.recordBaseInfo	= recordBaseInfo;
					data_fe_st.correo			= correo;
					data_fe_st.usuario			= usuario;
					data_fe_st.mainRecordType	= recordType;
					data_fe_st.mainRecordId		= recordId;
					data_fe_st					= JSON.stringify(data_fe_st);
					data_fe_st					= Base64.encode(data_fe_st);
				var url_fe_sf					= nlapiResolveURL("SUITELET", "customscript_tn_sf_bt_form_st", "customdeploy_tn_sf_bt_form_st", false);
					url_fe_sf     	   		   += "&data=" 	 + data_fe_st;
				//nlapiLogExecution('ERROR', 'url_fe_sf', url_fe_sf);
				form.addButton("custpage_timbrado_nomina", "Timbrado de Nomina", "window.location.href='" + url_fe_sf + "'");
			}
		}
	}
	catch(e)
	{
		var companyConfig		= nlapiLoadConfiguration('companyinformation');
		var companyname			= returnBlank(companyConfig.getFieldValue('companyname'));
		var context				= nlapiGetContext();
	  	var company				= returnBlank(context.getCompany());
	  	var deploymentId		= returnBlank(context.getDeploymentId());
	  	var environment			= returnBlank(context.getEnvironment());
	  	var executionContext	= returnBlank(context.getExecutionContext());
	  	var logLevel			= returnBlank(context.getLogLevel());
	  	var name				= returnBlank(context.getName());
	  	var role				= returnBlank(context.getRole());
	  	var roleCenter			= returnBlank(context.getRoleCenter());
	  	var roleId				= returnBlank(context.getRoleId());
	  	var scriptId			= returnBlank(context.getScriptId());
	  	var user				= returnBlank(context.getUser());
	  	var author				= -5;
	  	var recipient			= 'carlos.alvarez@imr.com.mx';
	  	var subject				= '';
	  	var body 				= '';
  			body 			   += '<table>';
  				body 			   += '<tr><td><b>' + 'Company ID' 			+ '</b></td><td>&nbsp;</td><td>' + company 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Company' 			+ '</b></td><td>&nbsp;</td><td>' + companyname		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record Type' 		+ '</b></td><td>&nbsp;</td><td>' + recordType 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record ID' 			+ '</b></td><td>&nbsp;</td><td>' + recordId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Script ID' 			+ '</b></td><td>&nbsp;</td><td>' + scriptId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Deployment ID' 		+ '</b></td><td>&nbsp;</td><td>' + deploymentId 	+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Log Level' 			+ '</b></td><td>&nbsp;</td><td>' + logLevel 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Environment' 		+ '</b></td><td>&nbsp;</td><td>' + environment 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Execution Context' 	+ '</b></td><td>&nbsp;</td><td>' + executionContext + '</td></tr>';
  				body 			   += '<tr><td><b>' + 'User' 				+ '</b></td><td>&nbsp;</td><td>' + user 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Name' 				+ '</b></td><td>&nbsp;</td><td>' + name 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role' 				+ '</b></td><td>&nbsp;</td><td>' + role 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role Center' 		+ '</b></td><td>&nbsp;</td><td>' + roleCenter		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role ID' 			+ '</b></td><td>&nbsp;</td><td>' + roleId 			+ '</td></tr>';
  			body 			   += '</table>';
	  		body 			   += '<br>';
	  		body 			   += '<br>';
	  	if( e instanceof nlobjError )
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
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
		}
	    else
	    {
	    	var errorString	 = e.toString();
	    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
        }
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}
