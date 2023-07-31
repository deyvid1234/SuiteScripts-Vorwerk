/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/search','N/runtime','N/format'],

function(serverWidget, search, runtime,format) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	try{
    		log.debug('metohd',context.request.method); 
    		var form = createForm()
    		params = context.request.parameters
    		if(context.request.method == 'POST'){
    			date_start = params.custpage_date_init;
	            date_end = params.custpage_date_end;
    			var data = getDataGE(date_start,date_end)
    			createSublist(form,data)
    			context.response.writePage(form)
    		}else{
    			context.response.writePage(form)
    		}
    	}catch(err){
    		log.error("Error request",err);
    	}
    }
    
    function createForm(){
    	try{
    		var form = serverWidget.createForm({
                title: 'Reporte de ventas GE'
            });
    		form.clientScriptFileId = 1747839;
	   		form.addFieldGroup({
	                id: 'custpage_filters',
	                label: 'Filtros'
	   		})
   		    var searchFile1 = form.addField({
	             id: 'custpage_date_init',
	             type: serverWidget.FieldType.DATE,
	             label: 'Desde',
	             container: 'custpage_filters'
	         });
	   		var searchFile1 = form.addField({
	             id: 'custpage_date_end',
	             type: serverWidget.FieldType.DATE,
	             label: 'Hasta',
	             container: 'custpage_filters'
	         });
	   		form.addFieldGroup({
	            id: 'custpage_results',
	            label: 'Resultados'
	          })
	   		form.addSubmitButton('Consultar');
	   		return form;
    	}catch(err){
    		log.error("error create form",err);
    	}
    }
    function createSublist(form,data){
    	try{
    		 var object_fill = {};
             var sublist = form.addSublist({
                  id: 'sublist',
                  type: serverWidget.SublistType.LIST,
                  label: 'Resultados'
              });
             var orderGE = sublist.addField({
		    	 id: 'order_ge',
		    	 type: serverWidget.FieldType.TEXT,
		    	 label: 'Pedido GE'
		     });
	         var date_buy_ge = sublist.addField({
	             id: 'date_buy_ge',
	             type: serverWidget.FieldType.TEXT,
	             label: 'Fecha de compra de la GE'
	         });
			 var serial_number = sublist.addField({
			     id: 'serial_number',
			     type: serverWidget.FieldType.TEXT,
			     label: 'Número de serie'
			 });  
			 var orderGE = sublist.addField({
		    	 id: 'order_tm',
		    	 type: serverWidget.FieldType.TEXT,
		    	 label: 'Pedido de TM'
		     });
		     var date_ececution = sublist.addField({
		    	 id: 'date_ececution',
		    	 type: serverWidget.FieldType.TEXT,
		    	 label: 'Fecha de ejecución de TM'
		     });
		     var customer = sublist.addField({
		    	 id: 'customer',
		    	 type: serverWidget.FieldType.TEXT,
		    	 label: 'Cliente'
		     });
		     var orderGE = sublist.addField({
		    	 id: 'item',
		    	 type: serverWidget.FieldType.TEXT,
		    	 label: 'Item'
		     });

		     sublist.addButton({
					id: 'create_excel', 
					label: 'Excel',
					functionName: "createExcel()"
			  });
		     fillList(sublist,data)
    	}catch(err){
    		log.error("error create sublist",err);
    	}
    }
    
    function fillList(sublist,data){
    	try{
    		 for(var x = 0; x < data.length; x++){
    			try{
    				sublist.setSublistValue({
                        id : 'date_buy_ge',
                        line : x,
                        value : data[x]["trandate"]
                    }); 
        			sublist.setSublistValue({
                        id : 'serial_number',
                        line : x,
                        value : data[x]["CUSTBODY_VW_ODV_RELATED_WARRANTY.serialnumbers"]
                    }); 
        			sublist.setSublistValue({
                        id : 'date_ececution',
                        line : x,
                        value : data[x]["real_date"]
                    }); 
        			
        			sublist.setSublistValue({
                        id : 'customer',
                        line : x,
                        value : data[x]["entity"][0].text
                    }); 
        			sublist.setSublistValue({
                        id : 'order_ge',
                        line : x,
                        value : data[x]["tranid"]
                    }); 
        			sublist.setSublistValue({
                        id : 'order_tm',
                        line : x,
                        value : data[x]["CUSTBODY_VW_ODV_RELATED_WARRANTY.tranid"]
                    }); 
        			sublist.setSublistValue({
                        id : 'item',
                        line : x,
                        value : data[x]["item.salesdescription"]
                    });
    				
    			}catch(e){
    				log.error("error for fill",e)
    			}
    			
	        }
		     
    		
    	}catch(err){
    		log.error("Error fill",err);
    	}
    }
    function getDataGE(date_start,date_end){
    	try{
    		
    		
    		var salesorderSearchObj = search.load({
                id: 'customsearch_vk_rep_garantia_extendida_2'
            });
    		if(date_start != "" && date_end != ""){
    			var fdate_start = format.format({
                    value: date_start ,
                    type: format.Type.DATE
                });
    		    var fdate_end = format.format({
                    value: date_end,
                    type: format.Type.DATE
    			});
    		    log.debug('fdate_start_format',fdate_start);
    		    log.debug('fdate_end',fdate_end)
    		    salesorderSearchObj.filters.push(search.createFilter({
		                name: 'trandate',
		                operator: 'within',
	                    values:  [fdate_start, fdate_end]
		            })
		        );
    		}
    		
    			
			var pagedResults = salesorderSearchObj.runPaged();
			var obj = [];
			var obj_tm = [];
			pagedResults.pageRanges.forEach(function (pageRange){
				var currentPage = pagedResults.fetch({index: pageRange.index});
				currentPage.data.forEach(function (result) {
					obj.push(result.getAllValues());
					obj_tm.push(result.getValue('custbody_vw_odv_related_warranty'));
				});
			});
			var tm6_data = getInfoTM6(obj_tm)
			for(var x in obj){
				if(obj[x]["custbody_vw_odv_related_warranty"].length > 0){
					if( tm6_data[obj[x]["custbody_vw_odv_related_warranty"][0].value]){
						obj[x].real_date = tm6_data[obj[x]["custbody_vw_odv_related_warranty"][0].value];
					}
				}
			}
			return obj;
    	}catch(err){
    		log.error("Error getDataGE",err);
    	}
    }
    
    function getInfoTM6(data){
    	try{
    		var salesorderSearchObj = search.create({
    			   type: "itemfulfillment",
    			   filters:
    			   [ 
    			      ["createdfrom","anyof",data]
    			   ],
    			   columns:
    			   [
    			      search.createColumn({name: "internalid"}),
    			      search.createColumn({name: "trandate"}),
    			      search.createColumn({name: "createdfrom"})
    			   ]
    			});
    		var obj = {}
			var pagedResults = salesorderSearchObj.runPaged();
			pagedResults.pageRanges.forEach(function (pageRange){
				var currentPage = pagedResults.fetch({index: pageRange.index});
				currentPage.data.forEach(function (result) {
					obj[result.getValue('createdfrom')] = result.getValue('trandate')
				});
			});
			return obj;
    	}catch(err){
    		log.error("Error getInfoTM6",err);
    	}
    }
    return {
        onRequest: onRequest
    };
    
});
