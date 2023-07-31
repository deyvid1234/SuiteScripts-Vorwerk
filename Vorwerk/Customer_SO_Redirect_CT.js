function Customer_SO_Redirect_CT_PageInit(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'create' || type == 'copy')
		{
			var preloadov			= returnFalse(getParameterFromURL('preloadov'));
			if(preloadov == 'T')
			{
				nlapiSelectNewLineItem('item');
				nlapiSetCurrentLineItemValue('item', 'item', 1126, true, true);
				nlapiSetCurrentLineItemValue('item', 'quantity', 1, true, true);
				nlapiCommitLineItem('item');
			}
		}
	}
    catch(error)
    {
    	Generic_HE_Catch_CT(error, recordType, recordId);
    }
}
