/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search", "./lib"],

function(record, search, lib) {
	
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {
    }
    

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(context) {
    	
    	var newRecord = context.newRecord;
    	var oldRecord = context.oldRecord;
    	
    	if(newRecord.type == 'employee'){
    		/**
    		 * Por excepci�n de estas reglas se crear� un corrida independiente de creaci�n de correos por baja de promotora que enviara un
    		 * email a los clientes avisando que ya no tienen promotora o que se cambio la misma.
    		 * */
    		var inactive = newRecord.getValue('isinactive');
    		var inactiveOld = oldRecord? oldRecord.getValue('isinactive') : false;
    		

			search.create({
        		type: 'customrecord_se_reglas_email',
        		filters: [['isinactive','is', false], 'and',['custrecord_re_base','is', lib._BASE.aplicado_a.CLIENTE]],
        		columns: ['custrecord_re_base',//- Si aplica para Cliente(1) o Promotora(2)
        			'custrecord_re_fecha_base',
        			'custrecord_re_base_envio',
        			'custrecord_re_valor_envio',
        			'custrecord_re_template']
        	}).run().each(function(regla){     
        		
            	//- Calculo de fecha de envio
    			var valorEnvio = regla.getValue('custrecord_re_valor_envio');
    			var baseEnvio = regla.getValue('custrecord_re_base_envio');
    			var fechaBase = regla.getValue('custrecord_re_fecha_base');
    			var template = regla.getValue('custrecord_re_template');
    			var fechaBaseObj = null;
    			log.debug('*inactive', ' inactiveOld: ' + inactiveOld + ' inactive: ' + inactive);
    			try{
    				if((fechaBase == lib._BASE.fecha_base.promotora.FECHA_DE_ALTA && (inactiveOld && !inactive)) || 
        					(fechaBase == lib._BASE.fecha_base.promotora.FECHA_BAJA && (!inactiveOld && inactive))){
        				if(fechaBase == lib._BASE.fecha_base.promotora.FECHA_DE_ALTA){
            				fechaBaseObj = newRecord.getValue('hiredate');
            			} else if(fechaBase == lib._BASE.fecha_base.promotora.FECHA_BAJA){
            				fechaBaseObj = newRecord.getValue('custentity59');
            			} 
        				
        				if(fechaBaseObj){
        					if(baseEnvio == 1){//Dias
                				fechaBaseObj = new Date(fechaBaseObj.getTime() + (1000*60*60*24*valorEnvio));
                			} else if(baseEnvio == 2){//Mes
                				lib.addMonths(fechaBaseObj, valorEnvio)
                			}
                			
                			//-----------------------------------
                			
                			search.create({
                		        type: 'customer',  
                		        filters: [['isinactive','is',false], 'and',['salesrep','is', newRecord.id]]
                		    }).run().each(function(r){
                		    	var emailLogId = lib.createEmailLog(null, r.id, regla.id, template, null, fechaBaseObj);
                    			log.debug('inactive emailLogId',emailLogId);
                    			lib.sendEmail(baseEnvio, valorEnvio);
                		        return true;
                		    });
        				}            			
        			}
    			} catch(e){
    				log.debug('e',e);
    			}
    			
    			
        		return true;
        	});
			
    	} else {
    		//-- Se debe de considerar que en el maestro de clientes hay una fecha de alta de curso de cocina que cuando se agrega debe de ser
    		// grabada en el regitro de clientes.
        	var fechaCocinaAnterior = oldRecord ? oldRecord.getValue('custentity_imr_feclasec') : null;
        	var fechaCocinaNueva = newRecord.getValue('custentity_imr_feclasec');
        	log.debug('inactive',' fechaCocinaNueva: ' + fechaCocinaNueva +  ' | fechaCocinaNueva: ' + fechaCocinaNueva);
        	
        	search.create({
        		type: 'customrecord_se_reglas_email',
        		filters: 	[['isinactive','is', false], 'and',
        					['custrecord_re_base','is', lib._BASE.aplicado_a.CLIENTE], 'and',
        					['custrecord_re_fecha_base','is', lib._BASE.fecha_base.cliente.FECHA_CURSO]],
        		columns: ['custrecord_re_base',//- Si aplica para Cliente(1) o Promotora(2)
        			'custrecord_re_base_envio',
        			'custrecord_re_valor_envio',
        			'custrecord_re_template']
        	}).run().each(function(regla){     
        		
            	//- Calculo de fecha de envio
    			var valorEnvio = regla.getValue('custrecord_re_valor_envio');
    			var baseEnvio = regla.getValue('custrecord_re_base_envio');
    			var template = regla.getValue('custrecord_re_template');
    			var fechaBaseObj = fechaCocinaNueva;
    			
    			if((!fechaCocinaAnterior && fechaCocinaNueva) ||  (fechaCocinaAnterior && fechaCocinaNueva && fechaCocinaAnterior.getTime() != fechaCocinaNueva.getTime())){
        			if(baseEnvio == 1){//Dias
        				fechaBaseObj = new Date(fechaBaseObj.getTime() + (1000*60*60*24*valorEnvio));
        			} else if(baseEnvio == 2){//Mes
        				lib.addMonths(fechaBaseObj, valorEnvio)
        			}
        			
        			//-----------------------------------
        			var emailLogId = lib.createEmailLog(null, newRecord.id, regla.id, template, null, fechaBaseObj);
    		    	log.debug('fechaCocina emailLogId',emailLogId);
    		    	lib.sendEmail(baseEnvio, valorEnvio);
    			}
    			
        		return true;
        	});
    	}   	
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(context) {    	
    }
    
    return {
//        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
//        afterSubmit: afterSubmit
    };
    
});
