function saveRecord()
{
	try
	{
		var value_leads_ids		= new Array();
		var lines				= nlapiGetLineItemCount('custpage_resultados_sublist');
		for(var i=1;i<=lines;i++)
		{
			var value_sublist_seleccionar 	= returnFalse(nlapiGetLineItemValue('custpage_resultados_sublist', 'custpage_sublist_seleccionar',i));
			var value_sublist_cliente 		= nlapiGetLineItemValue('custpage_resultados_sublist', 'custpage_sublist_cliente',i);
			if(value_sublist_seleccionar == 'T')
			{
				value_leads_ids.push(value_sublist_cliente);
			}
		}
		if(value_leads_ids.length >0)
		{
			var selects = returnNumber(value_leads_ids.length);
			if(selects < 100)
			{
				nlapiSetFieldValues('custpage_leads_ids', value_leads_ids);
				return true;
			}
			else
			{
				var acorte	= Math.abs(99 - selects);
				alert('Ha seleccionado ' + selects +' leads, el límite es de 99, por acorte su selección por: ' + (acorte) + '.');
				return false;
			}
		}
		else
		{
			alert('Debe seleccionar al menos un resultado.');
			return false;
		}
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function validateField(type,name,linenum)
{
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
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function Buscar()
{
	try
	{
		var Base64					= new MainBase64();
		var value_gerente_ventas 	= returnBlank(nlapiGetFieldValue('custpage_gerente_ventas'));
		var value_fecha_desde 		= returnBlank(nlapiGetFieldValue('custpage_fecha_desde'));
		var value_fecha_hasta		= returnBlank(nlapiGetFieldValue('custpage_fecha_hasta'));
		if(value_gerente_ventas != '')
		{
			var data						= new Object();
				data.value_gerente_ventas	= value_gerente_ventas;
				data.value_fecha_desde		= value_fecha_desde;
				data.value_fecha_hasta		= value_fecha_hasta;
				data						= JSON.stringify(data);
				data	    				= Base64.encode(data);
			var url 						= nlapiResolveURL("SUITELET", "customscript_leads_gerente_ventas_form", "customdeploy_leads_gerente_ventas_form", false);
				url 	   		  	       += "&data=" 	+ data;
			window.onbeforeunload 			= function(e) {return null;};
			window.location.href 			= url;	
		}
		else
		{
			var msg  	 = new String();
				msg 	+= 'A fin de realizar la búsqueda, ingrese valores para: ';
			var fields	 = new Array();
			if(value_gerente_ventas == '')
			{
				fields.push('\"Gerente de Ventas \"');
			}
			alert(msg + fields.join(', '));
		}
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}