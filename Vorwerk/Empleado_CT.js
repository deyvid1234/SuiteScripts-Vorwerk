/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 May 2016     sponce
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
function Empleado_CT_FieldChanged(type, name, linenum)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(name == 'supervisor')
		{
			var supervisor		= nlapiGetFieldValue('supervisor');
			var entity			= new String();
			var oficina			= new String();
			var ubicacion		= new String();
			var area_manager	= new String();
			if(supervisor != '')
			{
				entity			= nlapiLoadRecord(recordType, supervisor);
				oficina			= entity.getFieldValue('custentity_oficina');
				ubicacion		= entity.getFieldValue('location');
				area_manager	= entity.getFieldValue('custentity_area_manager');
			}
			nlapiSetFieldValue('custentity_oficina', oficina);
			nlapiSetFieldValue('location', ubicacion);
			nlapiSetFieldValue('custentity_area_manager', area_manager);
		}
	}
    catch(error)
    {
    	Generic_HE_Catch_CT(error, recordType, recordId);
    }
}
