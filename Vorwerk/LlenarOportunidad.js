//Helper, elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
function LlenarOportunidad(type,name)
{
	if(name=='custbody_numero_serie')
	{
		var serie 		= nlapiGetFieldValue('custbody_numero_serie');
		if(serie!='')
		{
			var opFecha		= nlapiStringToDate(nlapiGetFieldValue('trandate'));
			var filters 	= new nlobjSearchFilter('serialnumbers', 'transaction', 'is', serie);
			var columns 	= new Array();
				columns.push(new nlobjSearchColumn('description'));
				columns.push(new nlobjSearchColumn('entity','transaction'));
				columns.push(new nlobjSearchColumn('salesrep','transaction'));
				columns.push(new nlobjSearchColumn('location','transaction'));
			var resultsTran = returnBlank(nlapiSearchRecord('item', null, filters, columns ));
			if(resultsTran!='')
			{
				var tranFecha = nlapiStringToDate(resultsTran[0].getValue('trandate','transaction'));
				var mstra = tranFecha.getTime();
				var msopp = opFecha.getTime();
				var msdif = msopp-mstra;
				nlapiSetFieldValue('entity',resultsTran[0].getValue('entity','transaction'));
				nlapiSetFieldValue('custbody_busqueda_presentadora',resultsTran[0].getValue('salesrep','transaction'));
				nlapiSetFieldValue('location',resultsTran[0].getValue('location','transaction'));
				nlapiSetFieldValue('custbody_desc_serie',resultsTran[0].getValue('description'));
				//63072000000 milisegundos en dos a?os
				if(msdif<=63072000000) { nlapiSetFieldValue('custbody_garantia','T'); }
				else { nlapiSetFieldValue('custbody_garantia','F'); }
			}
		}
		else
		{
				nlapiSetFieldValue('entity','');
				nlapiSetFieldValue('salesrep','');
				nlapiSetFieldValue('location','');
				nlapiSetFieldValue('custbody_desc_serie','');
				nlapiSetFieldValue('custbody_garantia','F');
		}
	}
}
function saveRecord()
{
	//nlapiSetFieldValue('salesrep',nlapiGetFieldValue('custbody_presentadora'));
	return true;
}
