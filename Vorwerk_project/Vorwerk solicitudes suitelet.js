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
                     
                            categoria = result.getValue('internalid')
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
                if(proceso == 'getTaxScheduled'){
                    var item = body.item
                    var inventoryitem= record.load({
                        type: 'inventoryitem',
                        id: item,
                        isDynamic: false,
                    });
                    var taxSchedule = inventoryitem.getValue('taxschedule')
                    
                    var taxRec= record.load({
                        type: 'taxschedule',
                        id: parseInt(taxSchedule,10),
                        isDynamic: false,
                    });
                    var sub = taxRec.getSublistValue({//se obtiene el vendor, su moneda y se setea en el campo de moneda del proveedor
                        sublistId: 'nexuses',
                        fieldId: 'purchasetaxcode',
                        line: 0
                    });
                    
                    
                    context.response.write(JSON.stringify(sub));
                }
                if(proceso == 'setPriceItem'){
                    
                    var item = body.articulo
                    var inventoryitem= record.load({
                        type: 'inventoryitem',
                        id: item,
                        isDynamic: false,
                    });
                    var precioNuevo = inventoryitem.setValue('cost',body.precioNuevo)
                    inventoryitem.save()
                                       
                
                }
                if(proceso == 'copyTransform'){
                    var solicitante = body.solicitante
                    var recordid = body.recordid
                    var idCopy = makeCopy(solicitante,recordid)
                    log.debug('idCopy periodos dias',idCopy)

                    var idPO = transformPO(solicitante,idCopy)
                    log.debug('idPO periodos dias',idPO)
                    context.response.write(JSON.stringify(idCopy));
                                       
                
                }

    		}
            
    	}catch(err){
    		log.error("Error request",err);
    	}
    }
    function transformPO(solicitante,idCopy,estimatedtotal){
            try{
                var transformToSO = record.transform({
                    fromType: 'purchaserequisition',
                    fromId: idCopy,
                    toType: 'purchaseorder',
                    isDynamic: true,
                });
                transformToSO.setValue({
                    fieldId: 'employee',
                    value: solicitante  
                });
                /*transformToSO.setValue({
                    fieldId: 'supervisorapproval',
                    value: true
                });*/
                var idPO = transformToSO.save()

                return idPO;
            }catch(e){
                log.error('error al transformar la requisicion a po',e)
            }
        } 
        function makeCopy(solicitante,idRequisition){
            try{
                var requisitionCopy = record.copy({
                    type: 'purchaserequisition',
                    id: idRequisition,
                    isDynamic: true,
                    
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_createdfrom_plantilla',
                    value: true
                });
                requisitionCopy.setValue({
                    fieldId: 'entity',
                    value: solicitante
                });
                requisitionCopy.setValue({
                    fieldId: 'approvalstatus',
                    value: 2
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_dias',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_a_partir',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_repetir_cada',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_solicitud_recurrente_contrato',
                    value: false
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_metodo_repeticion',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_no_repeticiones',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fechas_personalizadas',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_2',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_3',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_4',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_5',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_6',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_7',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_8',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_9',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_10',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_11',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_fecha_personalizada_12',
                    value: ''
                });
                requisitionCopy.setValue({
                    fieldId: 'custbody_total_solicitud_recurrente',
                    value: ''
                });
                var id_copy = requisitionCopy.save();
                log.debug('id_copy',id_copy)
                return id_copy;

            }catch(e){
                log.error('error al hacer la copia de la requisicion',e)
            }
        }
    
    return {
        onRequest: onRequest
    };
    
});
