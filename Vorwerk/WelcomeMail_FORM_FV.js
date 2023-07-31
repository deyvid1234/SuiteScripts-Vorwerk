function WelcomeMail_FORM_FV_PageInit(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		var url 			= '/app/center/card.nl?sc=-29';
		var searchResults_wmmeu	= returnBlank(nlapiSearchRecord('customrecord_wm_en_uso', 'customsearch_wm_en_uso', null, null));
		if(searchResults_wmmeu != '')
		{
			var _wm_en_uso_en_uso	= returnFalse(searchResults_wmmeu[0].getValue('custrecord_wm_en_uso_en_uso'));
			if(_wm_en_uso_en_uso == 'T')
			{
				alert('En este momento el proceso \"Welcome Mail en Demanda\" se encuentra ejecutándose, por favor espere a que termine.');
				window.onbeforeunload 	= function(e) {return null;};
				window.location.href 	= url;
			}
		}
		else
		{
			var errorMsg     = "Operación Fallida";
				errorMsg 	+= "\n\n" + "ᐅ No Results Found: " + "\"Welcome Mail - En Uso\"";
			    errorMsg 	+= "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
			    errorMsg	+= "\nPuede continuar navegando en NetSuite.";
	    	alert(errorMsg);
			window.onbeforeunload 	= function(e) {return null;};
			window.location.href 	= url;
		}
	}
    catch(error)
    {
    	Generic_HE_Catch_CT(error, recordType, recordId);
    }
}
function WelcomeMail_FORM_FV_SaveRecord()
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		var searchResults_wmmeu	= returnBlank(nlapiSearchRecord('customrecord_wm_en_uso', 'customsearch_wm_en_uso', null, null));
		if(searchResults_wmmeu != '')
		{
			var _wm_en_uso_en_uso	= returnFalse(searchResults_wmmeu[0].getValue('custrecord_wm_en_uso_en_uso'));
			if(_wm_en_uso_en_uso == 'F')
			{
				var value_tran_ids		= new Array();
				var lines				= nlapiGetLineItemCount('custpage_resultados_sublist');
				for(var i=1;i<=lines;i++)
				{
					var value_sublist_seleccionar = returnFalse(nlapiGetLineItemValue('custpage_resultados_sublist', 'custpage_sublist_seleccionar',i));
					var value_sublist_transaction = returnBlank(nlapiGetLineItemValue('custpage_resultados_sublist', 'custpage_sublist_transaction',i));
					if(value_sublist_seleccionar == 'T')
					{
						value_tran_ids.push(value_sublist_transaction);
					}
				}
				var limite	= 90;
				var selects = returnNumber(value_tran_ids.length);
				if(selects > 0)
				{
					if(selects > limite)
					{
						var acorte	= Math.abs(limite - selects);
						alert('Ha seleccionado ' + selects +' transacciones, el límite es de ' + limite + ', por acorte su selección por: ' + (acorte) + '.');
						return false;
					}
					else
					{
						var value_fecha			= nlapiDateToString(new Date(), 'datetimetz');
						nlapiSetFieldValue('custpage_fecha', value_fecha);
						nlapiSetFieldValues('custpage_tran_ids', value_tran_ids);
						return true;
					}
				}
				else
				{
					alert('Debe seleccionar al menos un resultado.');
					return false;
				}
			}
			else
			{
				alert('Ya existe un proceso activo de \"Welcome Mail - En Uso\", espere a que termine para iniciar otro.');
				return false;
			}
		}
		else
		{
			var errorMsg     = "Operación Fallida";
				errorMsg 	+= "\n\n" + "ᐅ No Results Found: " + "\"Welcome Mail - En Uso\"";
			    errorMsg 	+= "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
			    errorMsg	+= "\nPuede continuar navegando en NetSuite.";
	    	alert(errorMsg);
			window.onbeforeunload 	= function(e) {return null;};
			window.location.href 	= url;
		}
	}   
	catch(error)
	{
		Generic_HE_Catch_CT(error, recordType, recordId);
	}
}
function WelcomeMail_FORM_FV_ValidateField(type, name, linenum)
{
   
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(name == 'custpage_fecha_desde')
		{
			var value_fecha_desde 		= returnBlank(nlapiGetFieldValue('custpage_fecha_desde'));
			var value_fecha_hasta 		= returnBlank(nlapiGetFieldValue('custpage_fecha_hasta'));
			if(value_fecha_desde !='' && value_fecha_hasta != '')
			{
				var value_fecha_desde_obj	= nlapiStringToDate(value_fecha_desde);
				var value_fecha_hasta_obj	= nlapiStringToDate(value_fecha_hasta);
				var ms_value_fecha_hasta	= value_fecha_hasta_obj.getTime();
				var ms_value_fecha_desde	= value_fecha_desde_obj.getTime();
				if(ms_value_fecha_desde > ms_value_fecha_hasta)
				{
					alert('\"Fecha Desde\" no puede ser mayor a \"Fecha Hasta\", verifique.');
					nlapiSetFieldValue('custpage_fecha_desde', '', false, false);
					return false;
				}
			}
		}
		if(name == 'custpage_fecha_hasta')
		{
			var value_fecha_desde 		= returnBlank(nlapiGetFieldValue('custpage_fecha_desde'));
			var value_fecha_hasta 		= returnBlank(nlapiGetFieldValue('custpage_fecha_hasta'));
			if(value_fecha_desde !='' && value_fecha_hasta != '')
			{
				var value_fecha_desde_obj	= nlapiStringToDate(value_fecha_desde);
				var value_fecha_hasta_obj	= nlapiStringToDate(value_fecha_hasta);
				var ms_value_fecha_hasta	= value_fecha_hasta_obj.getTime();
				var ms_value_fecha_desde	= value_fecha_desde_obj.getTime();
				if(ms_value_fecha_desde > ms_value_fecha_hasta)
				{
					alert('\"Fecha Hasta\" no puede ser menor a \"Fecha Desde\", verifique.');
					nlapiSetFieldValue('custpage_fecha_hasta', '', false, false);
					return false;
				}
			}
	
		}
		return true;
	}   
	catch(error)
	{
		Generic_HE_Catch_CT(error, recordType, recordId);
	}
}
//---
function Buscar()
{
	try
	{
		var Base64				= new MainBase64();
		var value_entity 		= returnBlank(nlapiGetFieldValue('custpage_entity'));
		var value_salesrep 		= returnBlank(nlapiGetFieldValue('custpage_salesrep'));
		var value_tranid 		= returnBlank(nlapiGetFieldValue('custpage_tranid'));
		var value_fecha_desde 	= returnBlank(nlapiGetFieldValue('custpage_fecha_desde'));
		var value_fecha_hasta 	= returnBlank(nlapiGetFieldValue('custpage_fecha_hasta'));
		if(value_fecha_desde != '' && value_fecha_hasta != '')
		{
			var data							= new Object();
				data.value_entity				= value_entity;
				data.value_salesrep				= value_salesrep;
				data.value_tranid				= value_tranid;
				data.value_fecha_desde			= value_fecha_desde;
				data.value_fecha_hasta			= value_fecha_hasta;
				data							= JSON.stringify(data);
				data   		 					= Base64.encode(data);
			var url 							= nlapiResolveURL("SUITELET", "customscript_welcome_mail_form", "customdeploy_welcome_mail_form", false);
				url 	   		 	  	   	   += "&data=" 	+ data;
			window.onbeforeunload 				= function(e) {return null;};
			window.location.href 				= url;	
		}
		else
		{
			var msg  	 = new String();
				msg 	+= 'A fin de realizar la búsqueda, ingrese valores para: ';
			var fields	 = new Array();
			if(value_fecha_desde == '')
			{
				fields.push('\"Fecha Desde\"');
			}
			if(value_fecha_hasta == '')
			{
				fields.push('\"Fecha Hasta\"');
			}
			alert(msg + fields.join(', '));
		}
	}
    catch(error)
    {
    	Generic_HE_Catch_CT(error, recordType, recordId);
    }
}