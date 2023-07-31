function TN_SF_XML_Comprobante_FV_PageInit(type)
{
	try
	{
		var recordType	= nlapiGetRecordType();
		var recordId	= nlapiGetRecordId();
		switch(recordType)
		{
			case 'customrecord_comisiones_gtm':
			{
				prefijo = 'gtm';
			};break;
			case 'customrecord_comisiones_pre':
			{
				prefijo = 'pre';
			};break;
			case 'customrecord_comisiones_jdg':
			{
				prefijo = 'jdg';
			};break;
		}
		if(type == 'edit' || type == 'create')
		{
			var role	= nlapiGetRole();
			if(type == 'edit')
			{
				var _fe_codigo_respuesta	= returnNumber(nlapiGetFieldValue('custrecord_' + prefijo + '_codigo_respuesta'));
				if(_fe_codigo_respuesta == 200 && role != 3)
				{
					alert('No permitido: esta Compensación esta timbrada.');
					var url 				= nlapiResolveURL('RECORD', recordType, recordId, 'VIEW');
					window.onbeforeunload 	= function(e) {return null;};
					window.location.href 	= url;
				}
			}
			if(role == 3)
			{
				nlapiDisableField('custrecord_' + prefijo + '_codigo_respuesta', false);
				nlapiDisableField('custrecord_' + prefijo + '_mensaje_respuesta', false);
				nlapiDisableField('custrecord_' + prefijo + '_xml_netsuite', false);
				nlapiDisableField('custrecord_' + prefijo + '_xml_sat', false);
				nlapiDisableField('custrecord_' + prefijo + '_pdf', false);
				nlapiDisableField('custrecord_' + prefijo + '_xml_comprobante', false);
				nlapiDisableField('custrecord_' + prefijo + '_json_datos_extra', false);
				nlapiDisableField('custrecord_' + prefijo + '_subtotal', false);
				nlapiDisableField('custrecord_' + prefijo + '_retencion', false);
				nlapiDisableField('custrecord_' + prefijo + '_total', false);
			}
			else
			{
				nlapiDisableField('custrecord_' + prefijo + '_codigo_respuesta', true);
				nlapiDisableField('custrecord_' + prefijo + '_mensaje_respuesta', true);
				nlapiDisableField('custrecord_' + prefijo + '_xml_netsuite', true);
				nlapiDisableField('custrecord_' + prefijo + '_xml_sat', true);
				nlapiDisableField('custrecord_' + prefijo + '_pdf', true);
				nlapiDisableField('custrecord_' + prefijo + '_xml_comprobante', true);
				nlapiDisableField('custrecord_' + prefijo + '_xml_datos_extra', true);
				nlapiDisableField('custrecord_' + prefijo + '_subtotal', true);
				nlapiDisableField('custrecord_' + prefijo + '_retencion', true);
				nlapiDisableField('custrecord_' + prefijo + '_total', true);
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