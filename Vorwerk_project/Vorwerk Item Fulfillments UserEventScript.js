/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/config','N/record','N/render','N/runtime','N/email','N/search','N/format'],

function(runtime,config,record,render,runtime,email,search,format) {
   
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
    	var rec = scriptContext.newRecord;
    	var currentRecord = scriptContext.newRecord;
        try {
            if (scriptContext.type == 'create') {
                for(var x = 0; x < currentRecord.getLineCount({sublistId: 'item'}); x++){
                	var item = currentRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line:x})
                	if( item == 2001 || item == 2170 ){
                		var recordid = rec.getValue('internalid')
                		var createdfrom = rec.getValue('createdfrom')
                		var salesrep = search.lookupFields({
	                    type: 'salesorder',
	                    id: createdfrom,
	                    columns: ['salesrep']
                		});
                		salesrep = salesrep.salesrep[0]['value']
                		var customer = parseInt(rec.getValue('entity'));
	                    idUSer = 344096;
	                    var date = rec.getValue('trandate')
	                    var dateGara = new Date(date);
	                    dateGara.setDate(dateGara.getDate()+180);
	                    fDate = (dateGara.getDate()+'/'+(dateGara.getMonth()+1)+'/'+dateGara.getFullYear())
	                    log.debug('fDate',fDate)
	                     var recordid = '' 
	                     var url = ''
	                     var mySearch = search.create({
					           type:"customrecord_guia_envio",
					           filters: [
					                     {
					                         name: 'custrecord_id_sales_order',
					                         operator: 'is',
					                         values: createdfrom
					                     }
					                 ],
					           columns: [
					               { name: 'internalid', sort: search.Sort.DESC },
					               { name: 'custrecord_url_resp_aclogistics'},
					               { name: 'custrecord_no_guia'},
					           ]
					       });
	                    mySearch.run().each(function(r) {
	                    	internalid = r.getValue('internalid')
	                        url = r.getValue('custrecord_url_resp_aclogistics')
	                          });
	                    log.debug('search','internalid '+internalid+' url '+url)
	                    var subrec = rec.getSublistSubrecord({
	                            sublistId: 'item',
	                            fieldId: 'inventorydetail',
	                            line: x
	                        });
	                	if(subrec){
	                		var inventorydetail
	                		var subitems = subrec.getLineCount({
                	            sublistId  : 'inventoryassignment'
                	        });
                			if(subitems > 0){
                				for(var x = 0; x < subitems; x++) {
                    				var serial = subrec.getSublistValue({
                    				    sublistId: 'inventoryassignment',
                    				    fieldId: 'issueinventorynumber_display',
                    				    line: x
                    				});
                    				inventorydetail = serial
                    			}
                			}
	                	}
	                    log.debug('inventorydetail',inventorydetail)
	            		log.debug("process",'mail createdfrom:'+createdfrom+' salesrep: '+salesrep+' customer: '+customer);
	            		var myMergeResult = render.mergeEmail({
		            		    templateId: 270,
		            		    entity: {
		            		        	type: 'employee',
		            		        	id: idUSer
		        		        },
		            		    recipient: {
		            		        	type: 'customer',
		            		        	id: customer
		        		        },
		            		    transactionId: recordid
	            		    });
	            		var senderId = idUSer;
	            		var recipientEmail = customer
	            		var emailSubject = myMergeResult.subject; 
	            		var emailBody = myMergeResult.body 
	            		log.debug('emailBody',' senderId '+senderId+' recipientEmail '+recipientEmail+' emailSubject '+emailSubject);
	            		
	            		emailBody = emailBody.replace(/@numero_serie/g,inventorydetail);
	            		emailBody = emailBody.replace(/@ubicacion_tm/g,url);
	            		emailBody = emailBody.replace(/@fecha_gara/g,fDate);
	            		sendemail(senderId,customer,emailSubject,emailBody,recordid,salesrep)
                	}
                }
            }
        } catch (e) {
            log.debug("error", e)
        }
    }
    function sendemail(senderId,recipientEmail,emailSubject,emailBody,recordid,email_bbc){
    	try{
    		log.debug('senderId',senderId);
    		log.debug('recipientEmail',recipientEmail);
    		log.debug('emailBody',emailBody);
    		log.debug('recordid',recordid);
    		log.debug('email_bbc',email_bbc);
    		email.send({
    		    author: senderId,
    		    recipients: recipientEmail,
    		    subject: emailSubject,
                cc: [email_bbc],
    		    body: emailBody,
    		    relatedRecords: {
                	transactionId: recordid
                }
    		});
    	}catch(err){
    		log.error("error email send",err)
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

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});