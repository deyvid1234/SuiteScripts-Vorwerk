function pageInit(type)
{
    if(type=='create' || type =='copy')
    {
        if(nlapiGetRecordType()=='creditmemo')
        {
            nlapiSetFieldValue('custbody_codigo_retorno','');
            nlapiSetFieldValue('custbody_mensaje_retorno','');
            nlapiSetFieldValue('custbody_pdf_file','');
            nlapiSetFieldValue('custbody_xml_cfdipro_file','');
            nlapiSetFieldValue('custbody_xml_file','');
        }
    }
}
function fieldChange(type,name,linenum)
{
	
	try
	{
		if(name=='billaddresslist' || name =='billaddress') 
		{	
			nlapiSetFieldValue('custbody_id_direccion_cliente',nlapiGetFieldValue('billaddresslist')); 
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
function saveRecord(type,name)
{
	//alert(nlapiEscapeXML(returnBlank(nlapiGetFieldValue('tranid'))))
	//alert(nlapiEscapeXML(returnBlank(nlapiGetFieldValue('createdfrom'))));
	if(returnBlank(nlapiGetFieldValue('custbody_id_direccion_cliente')==''))
	{
		if(nlapiGetFieldValue('entity')==7176)
		{
			nlapiSetFieldValue('billaddresslist',19730);
			nlapiSetFieldValue('custbody_id_direccion_cliente',19730);
			return true;
		}
		else
		{
			if(returnBlank(nlapiGetFieldValue('billaddresslist'))!='')
			{
				nlapiSetFieldValue('custbody_id_direccion_cliente',nlapiGetFieldValue('billaddresslist'));
				nlapiSetFieldValue('billaddresslist',nlapiGetFieldValue('billaddresslist'));
				return true;
			}
			else
			{
				alert('Seleccione una direccion de facturación.')
				return false;
			}	
		}
	}
	else
	{
		return true;
	}
}
//Helper, elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}