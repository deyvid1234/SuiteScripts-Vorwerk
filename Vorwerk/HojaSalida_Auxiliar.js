//Helper, Elimina Valores Nulos.
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
function saveRecord()
{
	if(nlapiGetFieldValue('custbody_garantia')=='T') 
	{
		 if(returnBlank(nlapiGetFieldValue('custbody_garantia_producto'))=='')
		 {
		 	alert('Debe seleccionar el tipo de Uso del producto.');
		 	return false;
		 } 
		 else { return true; }
	}
	else { return true; }
}
function fieldChange(type,name,linenum)
{
	if(name=='custbody_garantia')
	{
		if(nlapiGetFieldValue('custbody_garantia')=='T') 
		{ 
			nlapiDisableField('custbody_garantia_producto',false); 
		}
		else
		{
			nlapiSetFieldValue('custbody_garantia_producto','');
			nlapiDisableField('custbody_garantia_producto',true); 
		}
	}
}
function pageInit (type,name) 
{
	if(type=='create' || type=='copy')
	{
		nlapiSetFieldValue("custbody_garantia",'T');
		nlapiSetFieldValue("custbody_tm31",'T');
		nlapiSetFieldValue("custbody_varoma",'T');
		nlapiSetFieldValue("custbody_lbasico",'T');
		nlapiSetFieldValue("custbody_manual",'T');
	}
	if(nlapiGetFieldValue('custbody_garantia')=='T') { nlapiDisableField('custbody_garantia_producto',false); }
	else { nlapiDisableField('custbody_garantia_producto',true); }
	var ov = returnBlank(nlapiGetFieldValue('createdfrom'));
	if(ov!='')
	{
		var filters = new nlobjSearchFilter("internalid",null,"is", ov);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('salesrep');
		columns[1] = new nlobjSearchColumn('altname','salesrep');
		columns[2] = new nlobjSearchColumn('isperson','customer');
		columns[3] = new nlobjSearchColumn('entityid','customer');
		columns[4] = new nlobjSearchColumn('companyname','customer');
		columns[5] = new nlobjSearchColumn('tranid');	
		var resultsOV = returnBlank(nlapiSearchRecord("salesorder", null, filters, columns)); 
		if(resultsOV!='')
		{
			var presentadora = resultsOV[0].getValue('salesrep');  
			nlapiSetFieldValue('custbody_busqueda_presentadora' , presentadora , false , false);
			nlapiSetFieldValue('custbody_numc',resultsOV[0].getValue('tranid'));
		}
	}	
}