/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Dec 2015     sponce
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function Etiqueta_Presentadora_SaveRecord()
{
	var recordType	= new String();
	var recordId	= new String();
	try
	{
		var currentURL		= returnBlank(window.location.href);
		var index 			= currentURL.indexOf("/app");
	    var value_host  	= currentURL.substring(0, index);
		nlapiSetFieldValue('custpage_host', value_host);
		return true;
	}
    catch(error)
    {
    	Generic_HE_Catch_CT(error, recordType, recordId);
    }
}