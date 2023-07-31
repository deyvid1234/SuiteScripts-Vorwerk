/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Jul 2016     sponce
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function Vendor_CT_FieldChanged(type, name, linenum)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(name == 'category')
		{
			var category		= nlapiGetFieldValue('category');
			if (category == 2) 
			{
				nlapiSetFieldValue('payablesaccount', 147);
			}
			if (category == 3) 
			{
				nlapiSetFieldValue('payablesaccount', 379);
			}
			if (category == 4) 
			{
				nlapiSetFieldValue('payablesaccount', 114);
			}
		}
	}
    catch(error)
    {
    	Generic_HE_Catch_CT(error, recordType, recordId);
    }
}
