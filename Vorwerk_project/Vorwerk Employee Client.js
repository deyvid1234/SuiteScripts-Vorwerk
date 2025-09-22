/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog','N/http','N/https','N/search','N/runtime','N/log'],

function(record,dialog,http,https,search,runtime,log) {
    
    // Variable global para almacenar el valor inicial de custentity_nombre_programa
    var initialProgramValue = '';
    
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
    	try {
    		var thisRecord = scriptContext.currentRecord;
    		// Guardar el valor inicial del programa para comparar en fieldChanged
    		initialProgramValue = thisRecord.getValue('custentity_nombre_programa') || '';
    	} catch(err) {
    		log.error("error pageInit", err);
    	}
    	
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
    		
    		// Funcionalidad complementaria GUTM - Limpiar campos relacionados cuando cambia custentity_nombre_programa
    		/*if(scriptContext.fieldId == 'custentity_nombre_programa'){
    			// Validación de usuario - Solo el usuario 4562429 puede ejecutar esta funcionalidad
    			var objUser = runtime.getCurrentUser();
    			var currentUserId = objUser.id;
    			
    			if(currentUserId == '4562429') {
    				var currentProgramValue = thisRecord.getValue('custentity_nombre_programa') || '';
    				
    				// Solo limpiar campos si el valor anterior NO estaba vacío (cambio de valor a valor, no de vacío a valor)
    				if(initialProgramValue !== '' && initialProgramValue !== currentProgramValue) {
    					// Array de campos que se deben limpiar cuando cambie el programa
    					var fieldsToReset = [
    						'custentity_fcha_inicio_eptm7',
    						'custentity_fcha_fin_eptm7',
    						'custentity_estatus_eptm7',
    						'custentity_so_ganotm7',
    						'custentity_fechatm7_ganada',
    						'custentity_ovs_ep7',
    						'custentity_num_ventas_gutm',
                            'custentity124'
    					];
    					
    					// Limpiar cada campo
    					for(var i = 0; i < fieldsToReset.length; i++){
    						thisRecord.setValue(fieldsToReset[i], '');
    					}
    				}
    				
    				// Actualizar el valor inicial para futuras comparaciones
    				initialProgramValue = currentProgramValue;
    			}
    		}*/
    		
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
        if(scriptContext.fieldId == 'isinactive') {
            var isInactive = scriptContext.currentRecord.getValue('isinactive');
            // Se ejecuta cuando se intenta desmarcar el campo (cambiar de true a false)
            if(!isInactive) {
                var urlCsf = scriptContext.currentRecord.getValue('custentity_url_csf');
                var autorizadoFinanzas = scriptContext.currentRecord.getValue('custentity_autorizado_finanzas');
                
                if(!urlCsf || !autorizadoFinanzas) {
                    dialog.alert({
                        title: 'Error de Validación',
                        message: 'El presentador no tiene CSF y/o no ha sido validada, no puede darse de alta'
                    });
                    return false; // Revierte el checkbox a marcado (true)
                }
            }
        }
        return true;
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
        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
