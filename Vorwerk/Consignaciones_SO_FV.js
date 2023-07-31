function Compensaciones_SO_FV_SaveRecord()
{
	try
	{
		var salesrep 		= returnBlank(nlapiGetFieldValue('salesrep'));
		var salesrepText 	= returnBlank(nlapiGetFieldText('salesrep'));
		var tranid	 		= returnBlank(nlapiGetFieldValue('tranid'));
		var equipos_auth	= returnNumber(nlapiLookupField('employee', salesrep, 'custentity119'));
		var recordId		= returnBlank(nlapiGetRecordId());
		if(salesrep != '')
		{
			var _tipo_venta = returnNumber(nlapiGetFieldValue('custbody_tipo_venta'));
			switch(_tipo_venta)
			{
				case 11://Consignación
				{
					var filters 			= new Array();
						filters.push(new nlobjSearchFilter('salesrep', null, 'is', salesrep));
					if(recordId != '' )
					{
						filters.push(new nlobjSearchFilter('internalid', null, 'noneof', recordId));
					}
					var searchResults		= returnBlank(nlapiSearchRecord('salesorder', 'customsearch633_2', filters, null));
					if(searchResults != '')
					{
						var cantidad	= searchResults.length;
						var msg			= "El representante " + salesrepText + " tiene " + cantidad + " artículo consignado, sin número de serie. Por favor rectifique consignacion " + tranid + " antes de continuar.";
						alert(msg);
						return false;
					}
					else
					{
						var cantidadActual	 	= 0;
						var cantidadTotal   	= cantidadActual + 1;
						var filters 			= new Array();
							filters.push(new nlobjSearchFilter('salesrep', null, 'is', salesrep));
						if(recordId != '' )
						{
							filters.push(new nlobjSearchFilter('internalid', null, 'noneof', recordId));
						}
						var searchResults		= returnBlank(nlapiSearchRecord('salesorder', 'customsearch633', filters, null));
						if(searchResults != '')
						{
							cantidadActual	 = searchResults.length;
							cantidadTotal    = cantidadActual + 1;
						}
						var restante	= equipos_auth - cantidadTotal;
						if(restante >= 0)
						{
							return true;
						}
						else
						{
							var msg			= "El representante " + salesrepText + " ya no puede disponer de más artículos a consignación, actualmente tiene " + cantidadActual + " artículos en consignación, seleccione Aceptar para solicitar Autorización.";
							/*/
							nlapiSetFieldValue('custbody73', 1);
							alert(msg);
							return true;
							/*/
							var con			= confirm(msg);
							if(con == true)
							{
								nlapiSetFieldValue('custbody73', 1);
								return true;	
							}
							else
							{
								nlapiSetFieldValue('custbody73', 2);
								return false;
							}
						}	
					}
				};break;
				case 2://Ventas TM
				{
					var tieneSeries 	= new Boolean();
					var lines 			= nlapiGetLineItemCount('item');
					for(var i=1; i<= lines;i++)
					{
						series_tm	= returnBlank(nlapiGetLineItemValue('item','isserialitem',i));
						if(series_tm != '')
						{
							tieneSeries = true;
							break;
						}
					}
					if(tieneSeries == true)
					{
						var cantidadActual	 	= 0;
						var filters 			= new Array();
							filters.push(new nlobjSearchFilter('salesrep', null, 'is', salesrep));
						if(recordId != '' )
						{
							filters.push(new nlobjSearchFilter('internalid', null, 'noneof', recordId));
						}
						var searchResults		= returnBlank(nlapiSearchRecord('salesorder', 'customsearch633', filters, null));
						if(searchResults != '')
						{
							cantidadActual	 = searchResults.length;
						}
						if(cantidadActual >0)
						{
							var msg			= "El representante " + salesrepText + " actualmente tiene " + cantidadActual + " articulos en consignación, seleccione Aceptar para solicitar Autorización sin facturar las consignaciones abiertas.";							
							var con			= confirm(msg);
							if(con == true)
							{
								nlapiSetFieldValue('custbody73', 1);
								return true;	
							}
							else
							{
								nlapiSetFieldValue('custbody73', 2);
								return false;
							}
						}
						else
						{
							return true;
						}
					}
					else
					{
						return true;
					}
				};break;
				default:
				{
					return true;
				};break;
			}
		}
		else
		{
			return true;
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