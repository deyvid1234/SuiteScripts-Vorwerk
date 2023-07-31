/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Feb 2017     IMR
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function updateEmpleado(recType, recId) {
	
	try {
		var recCustomer = nlapiLoadRecord(recType, recId);
		//recCustomer.setFieldValue('custentity_c_nom_regimenfiscal', '1');
		//recCustomer.setFieldValue('custentity_c_nom_periodicidadpago', '5');
		//recCustomer.setFieldValue('custentity_c_nom_tipocontrato', '1');
		//recCustomer.setFieldValue('custentity_c_nom_tiporegimen', '1');
		recCustomer.setFieldValue('custentity_c_nom_tiponomina', '1');
		nlapiSubmitRecord(recCustomer);
	} catch (e) {
		
	}
	
}
