/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record'],

function(search,record) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

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
    function beforeSubmit(scriptContext) {

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
    function afterSubmit(scriptContext) {
    	try{
    		var rec = scriptContext.newRecord;
    		var objRecord = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: false,
            });
    		
    		var amount = rec.getValue('custrecord_amount_paymnet');
            var so = rec.getValue('custrecord_sales_order_id');
            var date = rec.getValue('custrecord_aplication_date');
            var memo = rec.getValue('custrecord_memo_payment');
            var location = rec.getValue('custrecord_kv_location_payment');
            var digital_credit = rec.getValue('custrecord_vw_digital_credit');
            log.debug('DC','digital_credit '+digital_credit);
            var objSO = search.lookupFields({
                type: 'salesorder',
                id: so,
                columns: 'entity'
            });
            log.debug('objSO',objSO);
            var entity = objSO.entity[0].value;
            var idPay = createpayment(entity,so,amount,date,memo,location,digital_credit)
            log.debug('idPay',idPay);
            var idUpPAy = createApplay(idPay);
            log.debug('idUpPAy',idUpPAy);
        	if(idPay != idUpPAy){
        		objRecord.setValue('custrecord_message_response',"Ocurrio un Error: creacion de pago"+idPay+" ----  apply pago"+idUpPAy);
        	}
            
            objRecord.save();
    	}catch(err){
    		log.error("errorafter ",err)
    	}
    }

    function createpayment(entity,idSO,amount,date,memo,location,digital_credit){
        try{
        	log.debug('idSO '+idSO,memo+"-"+location+' digital_credit '+digital_credit);
            var obj_payment = record.create({
                            type : 'customerpayment',
                            isDynamic: true
                        });

            obj_payment.setValue('customer',entity);
            obj_payment.setValue('custbody_mp_orden_venta_relacionada',idSO);
            obj_payment.setValue('account',365);
            obj_payment.setValue('custbody_forma_tipo_de_pago',208);
            obj_payment.setValue('trandate',date)
            obj_payment.setValue('payment',amount);
            obj_payment.setValue('custbody_cfdi_metpago_sat',4);
            obj_payment.setValue('memo',memo);
            obj_payment.setValue('location',location);
            obj_payment.setValue('custbody_digital_credit',digital_credit);
            
            var idPaymnet = obj_payment.save();
            return idPaymnet;

        }catch(err){
            log.error("error createpayment",err)
            return err.message;
        }
    }
    
    function createApplay(idPay){
    	try{

        	var rec = record.load({
                type:  'customerpayment',
                id: idPay,
                isDynamic: false
            });
        	var num = rec.getLineCount({
                sublistId: 'apply'
            });
        	log.debug("num",num);
        	
        	if(num > 0){
                for(var e = 0; e < num; e++){
                	 var apply = rec.getSublistValue({
                         sublistId: 'apply',
                         fieldId: 'apply',
                         line: e
                     });
                	 var amount = rec.getSublistValue({
                         sublistId: 'apply',
                         fieldId: 'due',
                         line: e
                     })
                      var importeOriginal = rec.getSublistValue({
                         sublistId: 'apply',
                         fieldId: 'total',
                         line: e
                     })
                     log.debug('amount',amount+' importeOriginal '+importeOriginal);
                	 if(importeOriginal > 28000){
                		 log.debug('to set true apply',apply);
						rec.setSublistValue({
							sublistId : 'apply',
							fieldId : 'apply',
							line : e,
							value : true
						});
                	 }else{
                		 log.debug('to set false apply',apply);
                		 rec.setSublistValue({
 							sublistId : 'apply',
 							fieldId : 'apply',
 							line : e,
 							value : false
 						});
                	 }
                }
                
        	}
        	var id = rec.save();
        	return id;
    	}catch(err){
    		log.error("error createApplay",err );
    		return err.message;
    	}
    	
    }


    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
