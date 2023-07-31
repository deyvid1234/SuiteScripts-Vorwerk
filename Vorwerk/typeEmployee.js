//Helper, elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
function pageInit(type,name,form)
{
	var split = nlapiGetFieldValue('custentity_split');
	if(split=='T')
	{
		nlapiDisableField('custentity_fecha_inicio_split',false);
		nlapiDisableField('custentity_fecha_fin_split',false);
		nlapiDisableField('custentity_jefa_grupo_split',false);
	}
	else 
	{
		nlapiDisableField('custentity_fecha_fin_split',true);
		nlapiDisableField('custentity_fecha_inicio_split',true);
		nlapiDisableField('custentity_jefa_grupo_split',true);
		nlapiSetFieldValue('custentity_fecha_inicio_split','');
		nlapiSetFieldValue('custentity_fecha_fin_split','');
		nlapiSetFieldValue('custentity_jefa_grupo_split','');
		
	}
	if(nlapiGetFieldValue('employeetype')==3)
	{
		//nlapiDisableField('supervisor',true);
	}
	else
	{
		//nlapiDisableField('supervisor',false);
		//nlapiSetFieldValue('supervisor','');
		if(split=='T')
		{
			nlapiDisableField('custentity_split',false);
			//nlapiSetFieldValue('custentity_split','F');
			nlapiDisableField('custentity_fecha_inicio_split',false);
			//nlapiSetFieldValue('custentity_fecha_inicio_split','');
			nlapiDisableField('custentity_fecha_fin_split',false);
			//nlapiSetFieldValue('custentity_fecha_fin_split','');
			nlapiDisableField('custentity_jefa_grupo_split',false);
			//nlapiSetFieldValue('custentity_jefa_grupo_split','');
		}
	}
	//if(nlapiGetFieldValue('customform')!=74 && nlapiGetFieldValue('customform')!=-10){ nlapiSetFieldValue('customform',74); }
}
function fieldChange(type,name)
{
	if(name=='supervisor')
	{
		var supervisor = returnBlank(nlapiGetFieldValue('supervisor')); 
		if(supervisor!='')
		{
			var filters 	= new Array();
				filters[0] 	= new nlobjSearchFilter('custrecord_jefa_grupo',null,'is',nlapiGetFieldValue('supervisor'));
				filters[1] 	= new nlobjSearchFilter('isinactive',null,'is','F');
			var columns 	= new Array();
				columns[0] 	= new nlobjSearchColumn('custrecord_delegacion');
				columns[1] 	= new nlobjSearchColumn('custrecord_sucursal');
				columns[2] 	= new nlobjSearchColumn('custrecord_delegada');
				columns[3]	= new nlobjSearchColumn('name').setSort(true);
			var ru = returnBlank(nlapiSearchRecord('customrecord_registro_unidades',null,filters,columns));
			if(ru!='')
			{
				nlapiSetFieldValue('custentity_delegacion',ru[0].getValue('custrecord_delegacion'));
				nlapiSetFieldValue('location',ru[0].getValue('custrecord_sucursal'));
				nlapiSetFieldValue('custentity_delegada',ru[0].getValue('custrecord_delegada'));
				nlapiSetFieldValue('custentity_nombre_unidad',ru[0].getValue('name'));
			}
			else
			{
				nlapiSetFieldValue('custentity_delegacion','');
				nlapiSetFieldValue('location','');
				nlapiSetFieldValue('custentity_delegada','');
				nlapiSetFieldValue('custentity_nombre_unidad','');
				
			}
		}
		else
			{
				nlapiSetFieldValue('custentity_delegacion','');
				nlapiSetFieldValue('location','');
				nlapiSetFieldValue('custentity_delegada','');
				nlapiSetFieldValue('custentity_nombre_unidad','');
				
			}
	}
	if(name=='custentity_fecha_inicio_split')
	{
		var fis = returnBlank(nlapiGetFieldValue('custentity_fecha_inicio_split'));
		if(fis!='')
		{
			fis = nlapiStringToDate(fis);
			var ffs = nlapiAddMonths(fis,6);
				ffs = nlapiDateToString(ffs);
			nlapiSetFieldValue('custentity_fecha_fin_split',ffs);
		}
		else { nlapiSetFieldValue('custentity_fecha_fin_split','');}
		
	}
	if(name=='custentity72')
	{
		if(returnBlank(nlapiGetFieldValue('custentity72')!=''))
		{
			var ReactivacionFecha = nlapiStringToDate(nlapiGetFieldValue('custentity72'));
			nlapiSetFieldValue('custentity_fin_objetivo_1_reactivacion',nlapiDateToString(nlapiAddMonths(ReactivacionFecha, 1)));
			nlapiSetFieldValue('custentity_fin_objetivo_2_reactivacion',nlapiDateToString(nlapiAddMonths(ReactivacionFecha, 3)));
		}
		else
		{
			nlapiSetFieldValue('custentity_fin_objetivo_1_reactivacion','');
			nlapiSetFieldValue('custentity_fin_objetivo_2_reactivacion','');
		}
	}
	if(name=='custentity_split') 
	{
		var split = nlapiGetFieldValue('custentity_split');
		if(split=='T')
		{
			nlapiDisableField('custentity_fecha_inicio_split',false);
			nlapiDisableField('custentity_fecha_fin_split',false);
			nlapiDisableField('custentity_jefa_grupo_split',false);
		}
		else 
		{
			nlapiDisableField('custentity_fecha_fin_split',true);
			nlapiDisableField('custentity_fecha_inicio_split',true);
			nlapiDisableField('custentity_jefa_grupo_split',true);
			nlapiSetFieldValue('custentity_fecha_inicio_split','');
			nlapiSetFieldValue('custentity_jefa_grupo_split','');
			nlapiSetFieldValue('custentity_fecha_fin_split','');
		}
	}
	if(name=='employeetype')
	{
		if(nlapiGetFieldValue('employeetype')==3)
		{
			//nlapiDisableField('supervisor',true);
			nlapiSetFieldValue('supervisor','');
			//nlapiDisableField('custentity_split',true);
			//nlapiSetFieldValue('custentity_split','F');
			//nlapiDisableField('custentity_fecha_inicio_split',true);
			//nlapiSetFieldValue('custentity_fecha_inicio_split','');
			//nlapiDisableField('custentity_fecha_fin_split',true);
			//nlapiSetFieldValue('custentity_fecha_fin_split','');
			//nlapiDisableField('custentity_jefa_grupo_split',true);
			//nlapiSetFieldValue('custentity_jefa_grupo_split','');
		}
		else
		{
			//nlapiDisableField('supervisor',false);
			//nlapiSetFieldValue('supervisor','');
			nlapiDisableField('custentity_split',false);
			nlapiSetFieldValue('custentity_split','F');
			nlapiDisableField('custentity_fecha_inicio_split',true);
			nlapiSetFieldValue('custentity_fecha_inicio_split','');
			//nlapiDisableField('custentity_fecha_fin_split',false);
			//nlapiSetFieldValue('custentity_fecha_fin_split','');
			nlapiDisableField('custentity_jefa_grupo_split',true);
			nlapiSetFieldValue('custentity_jefa_grupo_split','');
		}		
	}
}
function saveRecord(type,name)
{
	/*/
	var cuentaBancaria = returnBlank(nlapiGetFieldValue('custentity_cuenta_bancaria'));
	var cuentaBancariaLon = cuentaBancaria.length;
	for(var i=0;(i<(cuentaBancariaLon-5) && cuentaBancaria!='' && cuentaBancariaLon>5);i++)
	{
	  cuentaBancaria = cuentaBancaria.replace(cuentaBancaria[i],'*');
	}
	nlapiSetFieldValue('custentity_cuenta_bancaria',cuentaBancaria);
	/*/
	var split = nlapiGetFieldValue('custentity_split');
	if(split=='T')
	{
		var fis = returnBlank(nlapiGetFieldValue('custentity_fecha_inicio_split'));
		var jdgSplit = returnBlank(nlapiGetFieldValue('custentity_jefa_grupo_split'));
		var supervisor = returnBlank(nlapiGetFieldValue('supervisor'));
		if(nlapiGetFieldValue('employeetype')==3) 
		{	
			if(fis!='')
			{
				return true;
			} 
			if(fis=='' && jdgSplit!='')
			{
				alert('El campo: \"Fecha Inicio Split\" es obigatorio');
				return false;
			} 
		}
		else 
		{	
			if(fis !='' && jdgSplit !='' && supervisor!='') 
			{
				 return true;
			}
			if(fis!='' && jdgSplit!='' && supervisor=='')
			{
				alert('El campo: \"Jefa de Grupo\" es obigatorio');
				return false;
			}
			if(fis!='' && jdgSplit=='' && supervisor!='')
			{
				alert('El campo: \"Jefa de Grupo Split\" es obigatorio');
				return false;
			}
			if(fis!='' && jdgSplit=='' && supervisor=='')
			{
				alert('Los campos: \"Jefa de Grupo Split\" y \"Jefa de Grupo\" son obigatorios');
				return false;
			}
			if(fis=='' && jdgSplit=='' && supervisor=='')
			{
				alert('Los campos: \"Fecha Inicio Split\", \"Jefa de Grupo Split\" y \"Jefa de Grupo\" son obigatorios');
				return false;
			}
			if(fis=='' && jdgSplit!='' && supervisor!='')
			{
				alert('El campo: \"Fecha Inicio Split\" es obigatorio');
				return false;
			}
			if(fis=='' && jdgSplit=='' && supervisor!='')
			{
				alert('Los campos: \"Jefa de Grupo Split\" y \"Fecha Inicio Split\" son obigatorios');
				return false;
			}
			if(fis=='' && jdgSplit!='' && supervisor=='')
			{
				alert('Los campos: \"Jefa de Grupo\" y \"Fecha Inicio Split\" son obigatorios');
				return false;
			}
			if(fis!='' && jdgSplit!='' && supervisor=='')
			{
				alert('El campo \"Jefa de Grupo Split\" es obigatorio');
				return false;
			}
		}
	}
	else 
	{
		return true;
	}
}
