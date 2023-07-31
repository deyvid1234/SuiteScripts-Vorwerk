function cambiarUbicacionDetalle(type,name,linenum)
{
	if(name=='location')
	{
		var ubicacion = returnBlank(nlapiGetFieldValue('location'));
		var lineas = parseFloat(nlapiGetLineItemCount('item'));
		if(lineas!=0 && ubicacion!='')
		{
			for(var i=1;i<=lineas;i++)
			{
				nlapiSelectLineItem('item',i);
				nlapiSetCurrentLineItemValue('item','location',ubicacion,true,false);
			}
		}
	}
}
//Helper
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
