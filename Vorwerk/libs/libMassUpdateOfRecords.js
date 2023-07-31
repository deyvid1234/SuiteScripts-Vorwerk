function Mass_Update_of_Records(recordType, recordID)
{
    try
    {
        var ov = nlapiLoadRecord(recordType,recordID);
        nlapiSubmitRecord(ov);
    }
    catch(e)
    {
		if ( e instanceof nlobjError )
        {
        	var ecode 		 = returnBlank(e.getCode());
        	var edetails 	 = returnBlank(e.getDetails());
        	var eid 		 = returnBlank(e.getId());
        	var einternalid	 = returnBlank(e.getInternalId());
        	var estacktrace	 = returnBlank(e.getStackTrace());
        	if(estacktrace != '')
        	{
        		estacktrace	 = estacktrace.join();
        	}
        	var euserevent 	 = returnBlank(e.getUserEvent());
            nlapiLogExecution( 'ERROR', 'ecode',ecode);
            nlapiLogExecution( 'ERROR', 'edetails',edetails);
            nlapiLogExecution( 'ERROR', 'eid',eid);
            nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
            nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
        }
        else
        {
            nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
        }
    }
}
//Helper, elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null || value == undefined)
		return '';
	else 
		return value;
}