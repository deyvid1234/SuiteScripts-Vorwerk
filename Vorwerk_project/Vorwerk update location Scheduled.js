/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/https','N/format','N/url','N/email'],


function(record, search,https,format,url,email) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var cont = 0;
    	try {
			var result = [];
			 var date_f =  format.parse({
				 value: new Date('05/01/2020'),
				 type: format.Type.DATE
			 });
			 var date_set =  format.format({
				 value: date_f,
				 type: format.Type.DATE
			 });
			
			var busqueda = search.create({
				type : 'salesorder',
				columns : [ 'internalid', 'trandate' ],
				filters : [ {
					name : 'datecreated',
					operator : 'after',
					values : date_set
				}, {
					name : 'custbody_tipo_venta',
					operator : 'anyof',
					values : [ '18' ]
				},{
					name : 'mainline',
					operator : 'is',
					values : true
				},{
					name : 'location',
					operator : 'anyof',
					values : 53
				},{
					name: "status",
					operator : 'anyof',
					values : 'SalesOrd:B'
				},{
					name: "custbody_update_location",
					operator : 'is',
					values : false
				}]
			});
			var pagedResults = busqueda.runPaged();
			pagedResults.pageRanges.forEach(function(pageRange) {
				var currentPage = pagedResults.fetch({
					index : pageRange.index
				});
				currentPage.data.forEach(function(r) {
					result.push(r.getValue('internalid'));

				});
			});
			log.debug('result', result)
			log.debug('Total de registros encontrados', result.length)
			//cambiar el x del for por result.length
			for ( var x in result) {
				
				var objRecord = record.load({
					type : record.Type.SALES_ORDER,
					id : result[x],
					isDynamic : false,
				});
				var numLines = objRecord.getLineCount({
					sublistId : 'item'
				});
				var valid_sumit= false;
				for (var i = 0; i < numLines; i++) {
					
					var idLocation = objRecord.getSublistValue({
						sublistId : 'item',
						fieldId : 'location',
						line : i
					});
					//if(idLocation != 53)
					{
						objRecord.setSublistValue({
							sublistId : 'item',
							fieldId : 'location',
							line : i,
							value : 53
						});
						valid_sumit = true;
					}
					
				}
				objRecord.setValue({
                    fieldId: 'custbody_update_location',
                    value: true
                });
				if(valid_sumit == true){
					var recordId = objRecord.save({
						enableSourcing : true,
						ignoreMandatoryFields : true
					});
				}
				
				cont++;
			}

   	}catch(e){
   		log.debug("Error"+cont,e);
   	}
    	  
    }

    return {
        execute: execute
    };
    
});
