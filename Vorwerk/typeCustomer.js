function TypeCustomer_PageInit(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'create')
		{
			nlapiSetFieldValue('vatregnumber', 'XAXX010101000', true, true);
		}
	}
	catch(error)
	{
		Generic_HE_Catch_CT(error, recordType, recordId);
	}
}
function TypeCustomer_FieldChanged(type, name, linenum)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(name == 'companyname')
		{
			var id				= returnBlank(getParameterFromURL('id'));
			if(id == '')
			{
				var companyname 	= returnBlank(nlapiGetFieldValue('companyname'));
				nlapiSetFieldValue('custentity_razon_social',companyname,true,true);
			}
		}
		if(name == 'firstname' || name == 'middlename' || name == 'lastname')
		{
			var id				= returnBlank(getParameterFromURL('id'));
			if(id == '')
			{
				var firstname 	= returnBlank(nlapiGetFieldValue('firstname'));
				var middlename 	= returnBlank(nlapiGetFieldValue('middlename'));
				var lastname 	= returnBlank(nlapiGetFieldValue('lastname'));
				var _name		= new Array();
				if(firstname != '')
				{
					_name.push(firstname);
				}
				if(middlename != '')
				{
					_name.push(middlename);
				}
				if(lastname != '')
				{
					_name.push(lastname);
				}
				_name 		= _name.join(' ');
				nlapiSetFieldValue('custentity_razon_social',_name,true,true);
			}
		}
		if(name == 'email')
		{
			var email = returnBlank(nlapiGetFieldValue('email'));
			nlapiSetFieldValue('custentity_fe_sf_se_destinatario', email);
		}
		if(name == 'vatregnumber')
		{
			var vatregnumber		= returnBlank(nlapiGetFieldValue('vatregnumber'));
				vatregnumber		= vatregnumber.toUpperCase();
			nlapiSetFieldValue('vatregnumber',vatregnumber,false,false);
		}
	}
	catch(error)
	{
		Generic_HE_Catch_CT(error, recordType, recordId);
	}
}