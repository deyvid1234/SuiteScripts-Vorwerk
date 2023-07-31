/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(record, runtime) {
    
    /**
     * Definition of Mass Update trigger point.
     *
     * @param {Object} params
     * @param {string} params.type - Record type of the record being processed by the mass update
     * @param {number} params.id - ID of the record being processed by the mass update
     *
     * @since 2016.1
     */
    function each(params) {
    	var compensacion = runtime.getCurrentScript().getParameter({name: 'custscript_nueva_comp'});
    log.debug('compensacion', compensacion);
    	var employee = record.load({
    		id: params.id,
    		type: params.type
    	});
    	employee.setValue('custentity123', [compensacion]);
    	employee.save({enableSourcing: false, ignoreMandatoryFields: true});
    }

    return {
        each: each
    };
    
});
