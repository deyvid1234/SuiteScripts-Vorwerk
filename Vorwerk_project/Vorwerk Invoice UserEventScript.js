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
    function afterSubmit(scriptContext) {
    	var rec = scriptContext.newRecord;
    	var currentRecord = scriptContext.newRecord;
        try {
            if (scriptContext.type == 'create') {
                for(var x = 0; x < currentRecord.getLineCount({sublistId: 'item'}); x++){
                	var item = currentRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line:x})
                	if( item == 2001 || item == 2170 || item == 2490 || item == 2571 || item == 2638 || item == 2671){// kit 2555, 2170 tm del kit
                		var recordid = parseInt(rec.getValue('id'))
                		var createdfrom = rec.getValue('createdfrom')
                		var salesrep = search.lookupFields({
	                    type: 'salesorder',
	                    id: createdfrom,
	                    columns: ['salesrep','trandate','serialnumbers']
                		});
                		log.debug('salesrep',salesrep)
                		var date_so = salesrep.trandate
                		log.debug('date_so',date_so)
                		date_so = date_so.split('/')
                		salesrep = salesrep.salesrep[0]['value']
                		var customer = parseInt(rec.getValue('entity'));
                		log.debug('customer',customer)
	                    var idUSer = 344096;
	                    var date2 = rec.getText('trandate')
	                    var date = rec.getValue('trandate')
	                    var date_invoice =  date2.split('/')
        				var month_invoice = date_invoice[1];
	                    var dateGara = new Date(date);
	                    dateGara.setDate(dateGara.getDate()+180);
	                    var month_so = date_so[1];
	                    log.debug('Dentro del mes natural', 'month_invoice '+month_invoice+' month_so '+month_so)
	                    fDate = (dateGara.getDate()+'/'+(dateGara.getMonth()+1)+'/'+dateGara.getFullYear())
	                    log.debug('recordid',recordid)
	                     //var recordid = '' 
	                     if(month_invoice == month_so){//Mismo mes natural
							var url = ''
		                     var estatus_envio = ''
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
						               { name: 'custrecord_estatus_envio'},
						           ]
						       });
		                    mySearch.run().each(function(r) {
		                    	internalid = r.getValue('internalid')
		                        url = r.getValue('custrecord_url_resp_aclogistics')
		                        estatus_envio = r.getValue('custrecord_estatus_envio')
		                          });
		                    log.debug('search','internalid '+internalid+' url '+url)

		                    //Area de busqueda de Serial 
		                    var inventorydetail = ''
		                    /*var subrec = rec.getSublistSubrecord({
		                            sublistId: 'item',
		                            fieldId: 'inventorydetail',
		                            line: x
		                        });
		                    log.debug('subrec',subrec)
		                	if(subrec){
		                		
		                		var subitems = subrec.getLineCount({
	                	            sublistId  : 'inventoryassignment'
	                	        });
	                	        log.debug('subitems',subitems)
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
		                	}*/
		                    

		            		//Parche error en Serie por Invoice, Traemos datos de busqueda guardada de SO
		            		if(!inventorydetail || inventorydetail == ''){
		            			var mySearch = search.load({
						            id: 'customsearch2006'
						        });
		            			
		            			mySearch.filters.push(search.createFilter({
				                   name: 'createdfrom',
				                   operator: 'is',
				                   values: createdfrom
				               	}));

		            			mySearch.run().each(function(r){
					                inventorydetail = r.getValue('serialnumbers')
					                log.debug('inventorydetail',inventorydetail)
					                return true;
					            });

					            if(!inventorydetail || inventorydetail == ''){

					            	var mySearch2 = search.load({
							            id: 'customsearch2006'
							        });

					            	mySearch2.filters.push(search.createFilter({
					                   name: 'internalid',
					                   operator: 'is',
					                   values: createdfrom
					               	}));

					               	mySearch2.run().each(function(r){
						                inventorydetail = r.getValue('serialnumbers')
						                log.debug('inventorydetail',inventorydetail)
						                return true;
						            });
					            }
		            		}



		            		log.debug('inventorydetail',inventorydetail)
		                    log.debug('customer',customer)
		            		log.debug(customer,'mailcreatedfrom :'+createdfrom+' salesrep : '+salesrep +' hola: ' + customer + ' hola');
		            		log.debug('idUSer',idUSer)
		            		log.debug('recordid',recordid)
		            		log.debug('estatus_envio',estatus_envio)
		            		if(estatus_envio == 7 ){
		            			var myMergeResult = render.mergeEmail({
			            		    templateId: 272,
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
								log.debug('myMergeResult',myMergeResult)
			            		log.debug('emailBody',' senderId '+senderId+' recipientEmail '+recipientEmail+' emailSubject '+emailSubject);
			            		log.debug('emailBody',emailBody)
			            		emailBody = emailBody.replace(/@numero_serie/g,inventorydetail);
			            		emailBody = emailBody.replace(/@fecha_gara/g,fDate);
			            		
			            		sendemail(senderId,customer,emailSubject,emailBody,recordid,salesrep)
		            		}else{
		            			var myMergeResult = render.mergeEmail({
			            		    templateId: 271,
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
								log.debug('myMergeResult',myMergeResult)
			            		log.debug('emailBody',' senderId '+senderId+' recipientEmail '+recipientEmail+' emailSubject '+emailSubject);
			            		log.debug('emailBody',emailBody)
			            		emailBody = emailBody.replace(/@numero_serie/g,inventorydetail);
			            		emailBody = emailBody.replace(/@fecha_gara/g,fDate);
			            		emailBody = emailBody.replace(/@boton/g,'&iquest;D&oacute;nde est&aacute; mi Thermomix&reg;?');
			            		emailBody = emailBody.replace(/@url_ac/g,url);
			            		
			            		sendemail(senderId,customer,emailSubject,emailBody,recordid,salesrep)
		            		}
	                     }
	                     
	            		
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
    		    author: senderId,//senderId
    		    recipients: recipientEmail,//recipientEmail
    		    subject: emailSubject,
                bcc: ['pilar.torres@thermomix.mx'],//email_bbc 
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
    function beforeLoad(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
