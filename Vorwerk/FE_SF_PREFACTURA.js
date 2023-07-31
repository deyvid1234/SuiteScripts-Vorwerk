/** customscript_fe_sf_st_vorwerk
 * 
 * @param type
 * @param form
 * @param request
 */
function FE_SF_BT(type, form, request)
{
	var Base64		= new MainBase64();
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'view')
		{	
			var NetSuite						= new MainNetSuite();
			var isOneWorld						= NetSuite.isOneWorld;
			var subsidiaries					= NetSuite.subsidiaries;
			var subsidiary						= new String();
			if(isOneWorld == true)
			{
				subsidiary	= returnBlank(nlapiGetFieldValue('subsidiary'));
			}
			else
			{
				subsidiary	= subsidiaries[0];
			}
			var filters_fe_sf_config			= new Array();
				filters_fe_sf_config.push(new nlobjSearchFilter('internalid',null,'is',subsidiary));
			
			var titleForm_fe_sf_st					= 'Factura Electrónica';
			var data_fe_sf_st						= new Object();
			data_fe_sf_st.recordType			= recordType;
			data_fe_sf_st.recordId				= recordId;
			data_fe_sf_st.titleForm				= titleForm_fe_sf_st;
			
			var _fe_sf_xml_sat_id 						= returnBlank(nlapiGetFieldValue('custbody_fe_sf_xml_sat'));
			/*/
			data_fe_sf_st._fe_sf_masiva_id		= new String();
			data_fe_sf_st._enviar_email_fe_el	= 'F';
			/*/
			data_fe_sf_st						= JSON.stringify(data_fe_sf_st);
			data_fe_sf_st						= Base64.encode(data_fe_sf_st);
			var data					= new Object();
				data.recordType			= recordType;
				data.recordId			= recordId;
				data.subsidiary			= subsidiary;
				data.titleForm			= 'cfdi-pdf';
				data.mode				= 'cfdi-pdf';
				data.preview			= 'T';
				data.fileIdXML			= _fe_sf_xml_sat_id;
				data					= JSON.stringify(data);
				data					= Base64.encode(data);
			var url_fe_sf_bt_pdf					= nlapiResolveURL("SUITELET", 'customscript_fe_sf_st_vorwerk', 'customdeploy_fe_sf_st_vorwerk', false);
				url_fe_sf_bt_pdf     	  	       += "&data=" 	 + data;
				form.addButton("custpage_fe_sf_bt_pdf_test", "TEST: CFDI - PDF", "window.open('" + url_fe_sf_bt_pdf + "')");
		}
	}
	catch(error)
	{
    	Generic_HE_Catch_SS(error,recordType,recordId);
  	}
}