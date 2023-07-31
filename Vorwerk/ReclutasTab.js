function ReclutasTabBeforeLoad(type, form, request)
{
	try
    {
    	if(type == 'create' || type == 'edit' || type == 'view')
    	{
    		var sublistDisplayType 	= 'staticlist'; 
    		var fieldDisplayType	= 'inline';
    		var recId				= nlapiGetRecordId();
    		var searchResults		= '';
    		var columns 			= new Array();
    		var filters 			= new Array();
			var host				= request.getURL();
			var index 				= host.indexOf("/app");
		    	host  				= host.substring(0, index);
    		var datosPagosSublist	= form.addSubList('custpage_reclutas_datos', sublistDisplayType, 'Reclutas','custom4');
    			datosPagosSublist.setDisplayType('normal');
	    	var _num_linea			= datosPagosSublist.addField('custpage_num_linea', 'integer', '#');
	    	var _url				= datosPagosSublist.addField('custpage_employee_url', 'url', 'Ver');
	    	var _employee			= datosPagosSublist.addField('custpage_employee', 'select', 'Empleado','employee');
	    	var _esquema			= datosPagosSublist.addField('custpage_esquema', 'select', 'Esquema','customlist_promocion');
	    	var _jerarquia			= datosPagosSublist.addField('custpage_jerarquia', 'select', 'Jerarquia','employeetype');
	    	var _fecha_alta			= datosPagosSublist.addField('custpage_fecha_alta', 'date', 'Fecha de Alta');	 
	    	_url.setLinkText('Ver');
	    	_num_linea.setDisplayType(fieldDisplayType);
	    	_employee.setDisplayType(fieldDisplayType);
	    	_esquema.setDisplayType(fieldDisplayType);
	    	_jerarquia.setDisplayType(fieldDisplayType);
	    	_fecha_alta.setDisplayType(fieldDisplayType);
			columns[0] 				= new nlobjSearchColumn('custentity_promocion');
			columns[1] 				= new nlobjSearchColumn('employeetype');
			columns[2] 				= new nlobjSearchColumn('hiredate');
			filters[0] 				= new nlobjSearchFilter('custentity_reclutadora', null, 'is', recId);
			searchResults 			= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
			if(searchResults != '')
			{
				for ( var i = 0 ;i<searchResults.length ; i++ )
				{
				    var lineNumber 		= new Number(i + 1);
				    var employee_id		= searchResults[i].getId();
				    var employee_url	= host + nlapiResolveURL('RECORD', 'employee', employee_id, 'VIEW');
	                datosPagosSublist.setLineItemValue('custpage_num_linea', i+1, lineNumber.toString());
	                datosPagosSublist.setLineItemValue('custpage_employee_url', i+1, employee_url);
					datosPagosSublist.setLineItemValue('custpage_employee', i+1, employee_id);
					datosPagosSublist.setLineItemValue('custpage_esquema', i+1, searchResults[i].getValue('custentity_promocion'));
					datosPagosSublist.setLineItemValue('custpage_jerarquia', i+1, searchResults[i].getValue('employeetype'));
					datosPagosSublist.setLineItemValue('custpage_fecha_alta', i+1, searchResults[i].getValue('hiredate'));
				}
			}
			else
			{
				nlapiLogExecution( 'ERROR', 'searchResults',searchResults);
			}		
    	}
    }
    catch(e)
    {
        if ( e instanceof nlobjError )
        {
        	var ecode 		 = returnBlank(e.getCode());
        	var edetails 	 = returnBlank(e.getDetails());
        	var eid 		 = returnBlank(e.getId());
        	var einternalid	 = returnBlank(e.getInternalId());
        	var estacktrace	 = returnBlank(e.getStackTrace());
        	if(estacktrace != '')
        	{
        		estacktrace = estacktrace.join();
        	}
        	var euserevent 	 = returnBlank(e.getUserEvent());
            nlapiLogExecution( 'ERROR', 'ecode',ecode);
            nlapiLogExecution( 'ERROR', 'edetails',edetails);
            nlapiLogExecution( 'ERROR', 'eid',eid);
            nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
            nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
        }
        else
        {
            nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
        }
    }
 
}
function returnBlank(value)
{	
	if (value == null || value == undefined)
	{
		return '';
	}
	else
	{
		return value;
	}
}