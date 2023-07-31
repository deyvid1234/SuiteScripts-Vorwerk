function Customer_SO_Redirect_UE_AfterSubmit(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		nlapiLogExecution('ERROR', 'type', type);
		if(type == 'create')
		{
			var params				= new Array();
				params['preloadov']	= 'T';
				params['entity']	= recordId;
			nlapiSetRedirectURL('TASKLINK','EDIT_TRAN_SALESORD', null, null, params);
		}
	}
	catch(error)
	{
    	Generic_HE_Catch_SS(error,recordType,recordId);
  	}
}
