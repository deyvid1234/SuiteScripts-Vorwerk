/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/search','N/runtime','N/format','N/record'],

function(serverWidget, search, runtime,format,record) {
   
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
            var body = JSON.parse(context.request.body);
    		var proceso = body.proceso
                log.debug('proceso1',proceso)
    		if(context.request.method == 'POST'){
                
                if(proceso == 'getCategoria'){
                    var cuenta = body.cuenta
                    var categoria = ''
                    log.debug('cuenta',cuenta)
                    var busqueda = search.load({
                        id: 'customsearch2243'
    
                    }); 
                    busqueda.filters.push(search.createFilter({
                            name: 'account',
                            operator: 'anyof',
                            values:  cuenta
                        })
                    );
                    var pagedResults = busqueda.runPaged();
                    pagedResults.pageRanges.forEach(function (pageRange){
                        var currentPage = pagedResults.fetch({index: pageRange.index});
                        currentPage.data.forEach(function (result) {
                     
                            categoria = result.getValue('name')
                            log.debug('categoria',categoria)
                            return true; 
                         
                        });
                          
                    });

                    context.response.write(JSON.stringify(categoria));
                } 
                if(proceso == 'getCurrency'){
                    var vendor = body.vendor

                    var vendorRec= record.load({
                        type: 'vendor',
                        id: vendor,
                        isDynamic: false,
                    });
                    var currencyVendor = vendorRec.getValue('currency')
                    context.response.write(JSON.stringify(currencyVendor));
                }
                if(proceso == 'getRateTax'){
                    var idTax = body.idTax

                    var taxRec= record.load({
                        type: 'salestaxitem',
                        id: idTax,
                        isDynamic: false,
                    });
                    var rateTax = taxRec.getValue('rate')
                    
                    context.response.write(JSON.stringify(rateTax));
                }
                


    		}
            
    	}catch(err){
    		log.error("Error request",err);
    	}
    }
    
    
    return {
        onRequest: onRequest
    };
    
});
