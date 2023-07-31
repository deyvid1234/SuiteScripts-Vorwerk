function pageInit(type)
{
	try
	{
		if(type == 'create')
		{
			var custpage_ce_timbrado_activar	= returnFalse(nlapiGetFieldValue('custpage_ce_timbrado_activar'));
			if(custpage_ce_timbrado_activar == 'T')
			{
				nlapiDisableField('custpage_ce_timbrado_author', false);
				nlapiDisableField('custpage_ce_timbrado_cc', false);
				nlapiDisableField('custpage_ce_timbrado_bcc', false);
				nlapiDisableField('custpage_ce_timbrado_asunto', false);
				nlapiDisableField('custpage_ce_timbrado_mensaje', false);
			}
			else
			{
				nlapiDisableField('custpage_ce_timbrado_author', true);
				nlapiDisableField('custpage_ce_timbrado_cc', true);
				nlapiDisableField('custpage_ce_timbrado_bcc', true);
				nlapiDisableField('custpage_ce_timbrado_asunto', true);
				nlapiDisableField('custpage_ce_timbrado_mensaje', true);
			}
			var custpage_ce_cancelacion_activar	= returnFalse(nlapiGetFieldValue('custpage_ce_cancelacion_activar'));
			if(custpage_ce_cancelacion_activar == 'T')
			{
				nlapiDisableField('custpage_ce_cancelacion_author', false);
				nlapiDisableField('custpage_ce_cancelacion_cc', false);
				nlapiDisableField('custpage_ce_cancelacion_bcc', false);
				nlapiDisableField('custpage_ce_cancelacion_asunto', false);
				nlapiDisableField('custpage_ce_cancelacion_mensaje', false);
			}
			else
			{
				nlapiDisableField('custpage_ce_cancelacion_author', true);
				nlapiDisableField('custpage_ce_cancelacion_cc', true);
				nlapiDisableField('custpage_ce_cancelacion_bcc', true);
				nlapiDisableField('custpage_ce_cancelacion_asunto', true);
				nlapiDisableField('custpage_ce_cancelacion_mensaje', true);
			}
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
function saveRecord()
{
	try
	{
		var custpage_ambiente_seleccion	= returnBlank(nlapiGetFieldValue('custpage_ambiente_seleccion'));
		if(custpage_ambiente_seleccion != '')
		{
			return true;
		}
		else
		{
			alert('Seleccione un \"Ambiente\" para que NetSuite lo utilice para generar el \"Timbrado de Nominas\".');
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
		if(name == 'custpage_ambiente_seleccion')
		{
			var custpage_ambiente_seleccion	= returnBlank(nlapiGetFieldValue('custpage_ambiente_seleccion'));
			if(custpage_ambiente_seleccion == 'B')
			{
				var checked = confirm('Esta a punto de cambiar al \"Ambiente de Producción\", tenga en cuenta que todos sus timbrados o cancelaciones tendrán validez antes el SAT.\n\n¿Desea continuar?');
		        if (checked == true) 
		        {
		        	return true;
		        }
		        else
		        {
		        	nlapiSetFieldValue('custpage_ambiente_seleccion','A');
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
function fieldChanged(type,name,linenum)
{
	try
	{
		if(name == 'custpage_ce_timbrado_activar')
		{
			var custpage_ce_timbrado_activar	= returnFalse(nlapiGetFieldValue('custpage_ce_timbrado_activar'));
			if(custpage_ce_timbrado_activar == 'T')
			{
				nlapiDisableField('custpage_ce_timbrado_author', false);
				nlapiDisableField('custpage_ce_timbrado_cc', false);
				nlapiDisableField('custpage_ce_timbrado_bcc', false);
				nlapiDisableField('custpage_ce_timbrado_asunto', false);
				nlapiDisableField('custpage_ce_timbrado_mensaje', false);
			}
			else
			{
				nlapiDisableField('custpage_ce_timbrado_author', true);
				nlapiDisableField('custpage_ce_timbrado_cc', true);
				nlapiDisableField('custpage_ce_timbrado_bcc', true);
				nlapiDisableField('custpage_ce_timbrado_asunto', true);
				nlapiDisableField('custpage_ce_timbrado_mensaje', true);
			}
		}
		if(name == 'custpage_ce_cancelacion_activar')
		{
			var custpage_ce_cancelacion_activar	= returnFalse(nlapiGetFieldValue('custpage_ce_cancelacion_activar'));
			if(custpage_ce_cancelacion_activar == 'T')
			{
				nlapiDisableField('custpage_ce_cancelacion_author', false);
				nlapiDisableField('custpage_ce_cancelacion_cc', false);
				nlapiDisableField('custpage_ce_cancelacion_bcc', false);
				nlapiDisableField('custpage_ce_cancelacion_asunto', false);
				nlapiDisableField('custpage_ce_cancelacion_mensaje', false);
			}
			else
			{
				nlapiDisableField('custpage_ce_cancelacion_author', true);
				nlapiDisableField('custpage_ce_cancelacion_cc', true);
				nlapiDisableField('custpage_ce_cancelacion_bcc', true);
				nlapiDisableField('custpage_ce_cancelacion_asunto', true);
				nlapiDisableField('custpage_ce_cancelacion_mensaje', true);
			}
		}
		if(name == 'custpage_ce_timbrado_author')
		{
			var custpage_ce_timbrado_author			= returnBlank(nlapiGetFieldValue('custpage_ce_timbrado_author'));
			if(custpage_ce_timbrado_author != '')
			{
		        var filters			= new Array();
		        	filters.push(new nlobjSearchFilter('internalid', null, 'is', custpage_ce_timbrado_author));
		        var columns			= new Array();
		        	columns.push(new nlobjSearchColumn('email', null, null));
		        var employeeSearch	= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
		        if(employeeSearch != '')
		        {
		        	var custpage_ce_timbrado_author_email 	= returnBlank(employeeSearch[0].getValue('email'));
		        	nlapiSetFieldValue('custpage_ce_timbrado_author_email', custpage_ce_timbrado_author_email);
		        }
			}
			else
			{
				nlapiSetFieldValue('custpage_ce_timbrado_author_email', '');
			}
		}
		if(name == 'custpage_ce_cancelacion_author')
		{
			var custpage_ce_cancelacion_author			= returnBlank(nlapiGetFieldValue('custpage_ce_cancelacion_author'));
			if(custpage_ce_cancelacion_author != '')
			{
		        var filters			= new Array();
		        	filters.push(new nlobjSearchFilter('internalid', null, 'is', custpage_ce_cancelacion_author));
		        var columns			= new Array();
		        	columns.push(new nlobjSearchColumn('email', null, null));
		        var employeeSearch	= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
		        if(employeeSearch != '')
		        {
		        	var custpage_ce_cancelacion_author_email 	= returnBlank(employeeSearch[0].getValue('email'));
		        	nlapiSetFieldValue('custpage_ce_cancelacion_author_email', custpage_ce_cancelacion_author_email);
		        }
			}
			else
			{
				nlapiSetFieldValue('custpage_ce_cancelacion_author_email', '');
			}
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