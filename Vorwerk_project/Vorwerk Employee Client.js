/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog','N/http','N/https','N/search'],

function(record,dialog,http,https,search) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	
    	return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	try{
    		var thisRecord = scriptContext.currentRecord;
    		
    		if(scriptContext.fieldId=='custentity72'){
	    		var	entry = thisRecord.getValue('custentity72');
	    		thisRecord.setValue('hiredate',entry);
    		}
    		
    		if(scriptContext.fieldId=='supervisor'){
    			debugger;
	    		var	entry = thisRecord.getValue('supervisor');
	    		
	    		var gerencia = search.lookupFields({
	                type: 'employee',
	                id: entry,
	                columns: 'custentity_gerencia'
	                	
	            });
	    		thisRecord.setValue('custentity_gerencia',gerencia.custentity_gerencia[0].value);
    		}
    		if(scriptContext.fieldId =='custentity123'){
                var promosion = thisRecord.getValue('custentity_promocion');
                var hiredate = thisRecord.getValue('hiredate');
                var configuracion = thisRecord.getValue('custentity123');
                var reacondicionamiento = false
                 for (i = 0; i <= configuracion.length ; i++){
                    if(configuracion[i] == 11){
                        reacondicionamiento = true
                    }
                 }
                var objetivo1 = new Date(hiredate);
                objetivo1.setMonth(objetivo1.getMonth() + 1);
                thisRecord.setValue('custentity_fin_objetivo_1', objetivo1)
                if(promosion == 1 && reacondicionamiento){
                    var objetivo2 = new Date(hiredate);
                    objetivo2.setMonth(objetivo2.getMonth() + 2);
                    thisRecord.setValue('custentity_fin_objetivo_2', objetivo2)
                }else{
                    var objetivo2 = new Date(hiredate);
                    objetivo2.setMonth(objetivo2.getMonth() + 3);
                    thisRecord.setValue('custentity_fin_objetivo_2', objetivo2)
                }
            }
    		
    		return true;
    	}catch(err){
    		log.error("error inactive",err);
    	}
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	try{
    		var thisRecord = scriptContext.currentRecord;
    		var updateReentry;
    		var	dateReentry = thisRecord.getValue('custentity72');
    		var typeReentry = thisRecord.getValue('custentity_vorwerk_reentry');
    		if(dateReentry != '' && typeReentry == ''){
    			alert('Debe de seleccionar tipo de reingreso')
    			return false;
    		}else{
    			console.log('reentry',thisRecord.getValue('custentity_vorwerk_reentry'));
                if(thisRecord.getValue('custentity_tipo_ingreso') != thisRecord.getValue('custentity_vorwerk_reentry') && thisRecord.getValue('custentity_vorwerk_reentry') != ""){
                    thisRecord.setValue('custentity_tipo_ingreso', thisRecord.getValue('custentity_vorwerk_reentry'))
                }

            }
    	}catch(err){
    		log.error('errorsaverecord',err);
    	}
    	return true;
    }

   
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
