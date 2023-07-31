function clientPageInit(type)
{
	var rol	= nlapiGetRole();
	if(type == 'edit' || type == 'create' || type == 'copy')
	{
		if(rol == 3 || rol == 1018)// Administrator || Customer Service Administrator.
		{
			nlapiDisableField('trandate', false);
		}
		else
		{
			nlapiDisableField('trandate', true);
		}
	}
	if(type == 'edit' || type == 'copy')
	{
		if(rol == 3 || rol == 1018)// Administrator || Customer Service Administrator.
		{
			nlapiDisableField('custbody_tipo_venta', false);
		}
		else
		{
			nlapiDisableField('custbody_tipo_venta', true);
		}
	}
   
}
