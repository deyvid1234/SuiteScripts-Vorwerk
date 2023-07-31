/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/render', 'N/search', 'N/email', 'N/runtime', './lib'],
/**
 * @param {format} format
 * @param {record} record
 * @param {render} render
 * @param {search} search
 */
function(format, record, render, search, email, runtime, lib) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
	
    function execute(scriptContext) {
		log.debug('INICIO execute', '--------------------------------------------------------');
		search.create({
    		type: 'customrecord_se_email_log',
    		filters: [['isinactive','is', false], 'and', ['custrecord_el_enviado','is', false], 'and',
    			['custrecord_el_fecha_envio','onorbefore', format.format({value: new Date(), type: format.Type.DATE })]],
    		columns: ['custrecord_el_cliente',//- Si aplica para Cliente(1) o Promotora(2)
    			'custrecord_el_promotora',
    			'custrecord_el_email_maestro',
    			'custrecord_el_template',
    			'custrecord_el_transaccion']
    	}).run().each(function(r){
    		log.debug('r',r);
    		var template = r.getValue('custrecord_el_template');
    		var transaction = r.getValue('custrecord_el_transaccion');
    		var entity = r.getValue('custrecord_el_cliente') ? 
    				record.load({type: 'customer', id: r.getValue('custrecord_el_cliente')}) : 
    				record.load({type: 'employee', id: r.getValue('custrecord_el_promotora')});
    		log.debug('template',template);
    		log.debug('transaction',transaction);
    		log.debug('entity',entity);
    		var mergeResult = render.mergeEmail({
        		templateId: template,
        		entity: entity,
        		recipient: entity,
        		transactionId: transaction?Number(transaction):null,
        		customRecord: record.load({type: 'customrecord_se_email_log', id: r.id})
    		});
        	        	
        	log.debug({title: 'Email Subject: ', details: mergeResult.subject});
        	
        	var entityId = r.getValue('custrecord_el_cliente') ? r.getValue('custrecord_el_cliente') : r.getValue('custrecord_el_promotora');
        	
        	try{
        		email.send({
            		author: 82370,
            		recipients: entityId,
//            		bcc: ['gmora@tiamericas.com', 77386],
            		subject: mergeResult.subject,
            		body: mergeResult.body,
//            		attachments: [fileObj],
            		relatedRecords: {
        	    		entityId: entityId,
        	    		customRecord: {recordType: 379, id: r.id}
            		}
        		});
            	
            	var id = record.submitFields({
            		type: 'customrecord_se_email_log',
            		id: r.id,
            		values: {
            			custrecord_el_enviado: 'T'
            		},
            		options: {
            			enableSourcing: false,
            			ignoreMandatoryFields : true
        			}
        		});
            	log.debug({title: 'id: ', details: id});
        	} catch(e){
        		log.error("error para  " + r.id, e);
        	}
        	
    		return true;
    	});
    	log.debug('FIN execute', '--------------------------------------------------------');
    }
	
		
    return {
        execute: execute
    };
    
});
