function MarCoSS_ST_FILES(request,response)
{
	var Base64		= new MainBase64();
	var data 		= returnBlank(request.getParameter('data'));
		data	   	= Base64.decode(data);
		data	   	= JSON.parse(data);
	var recordType	= returnBlank(data.recordType);
	var recordId	= returnBlank(data.recordId);
	var titleForm	= returnBlank(data.titleForm);
	try
	{	
		var record					= nlapiLoadRecord(recordType, recordId);
		var _marcoss_xml_as_text	= returnBlank(record.getFieldValue('custrecord_marcoss_xml_as_text'));
		response.setContentType("XMLDOC", titleForm, 'inline');
		response.write(_marcoss_xml_as_text);
	}   
    catch(error)
    {
    	var customscript		= 'customscript_marcoss_he';
    	var customdeploy		= 'customdeploy_marcoss_he';
    	var HE_Catch_UE 		= Generic_HE_Catch_UE(error,recordType,recordId,titleForm,request);
        var HE_Params			= new Array();
        	HE_Params['data']	= HE_Catch_UE;
		nlapiSetRedirectURL('SUITELET',customscript,customdeploy, false, HE_Params);
    }
}