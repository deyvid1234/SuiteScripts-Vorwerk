/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/format'],

function(record,search,format) {
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
        try{
            log.debug("entre",requestParams);
            return "Consulta Garantía Extendida TM7";
        }catch(err){
            log.error("error to get",err);
        }
    }

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPut(requestBody) {

    }

    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {
        try{
            var res = {};
            log.debug("requestBody",requestBody);
            var req_info = requestBody;
            
            if(req_info.type == "getSalesOrderSerialNumberTM7"){
                res = getSalesOrderSerialNumberTM7(req_info);
            } else {
                res = getSalesOrderSerialNumberTM7(req_info); // Por defecto ejecuta la función si no viene type
            }
            
            log.debug("proceso funcional",res);
            return res;
        }catch(err){
            log.error("error request",err);
            return {'error':err};
        }
    }

    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {

    }
    
    /**
     * Función para consultar información de garantía extendida TM7 por número de serie
     * Duplica la funcionalidad de getSalesOrderSerialNumber
     * 
     * @param {Object} req_info - Objeto con el parámetro serialnumber
     * @returns {Object} Objeto con success:true y data con la información de la orden
     */
    function getSalesOrderSerialNumberTM7(req_info){
        try{
            //test 20304223682601124
            var allValues = {};
            var date = new Date();
            var is_valid = false;
            var itemSearch = search.load({
                id: 'customsearch_search_by_seria' // Item Search Service NS
            });

            itemSearch.filters.push(search.createFilter({
                name: 'serialnumber',
                operator: 'is',
                values: req_info['serialnumber']
            }));

            itemSearch.run().each(function(result) {
                info = result.getAllValues();
                log.debug('info',info)
                
                var type=result.getText('type')
                log.debug('type',type)
                if(type == 'Item Fulfillment' ){//Es item fulfillment
                    log.debug('es fufillment')
                                    
                    var fdate_add = format.parse({//fecha de ejecucion con 169 dias adicionales 
                        value: info["formuladate_1"],
                        type: format.Type.DATE
                    }); 
                    log.debug('fdate_add',fdate_add);
                    if(date < fdate_add){
                        is_valid = true;
                    }
                    allValues = {
                            internalid:result.getValue('createdfrom'),
                            ordernumber:info["createdFrom.tranid"],
                            name:info["createdFrom.entity"][0]['text'],
                            trandate:info["trandate"],
                            datetovalid :info["formuladate_1"],
                            valid: is_valid
                    }

                }else{ //Es Sales Order
                    var fdate_add = format.parse({//fecha de ejecucion con 169 dias adicionales 
                        value: result.getValue('formuladate'),
                        type: format.Type.DATE
                    }); 
                    log.debug('fdate_add',fdate_add);
                    if(date < fdate_add){
                        is_valid = true;
                    }
                    allValues = {
                            internalid:result.getValue('internalid'),
                            ordernumber:result.getValue('tranid'),
                            name:result.getText('entity'),
                            trandate:info["fulfillingTransaction.trandate"],
                            datetovalid :result.getValue('formuladate'),
                            valid: is_valid
                    }
                }
                log.debug('allValues',allValues)
                log.debug('info ',info);
                
                
                return true;
                
            });
            return {success:true,data:allValues} ;
            
        }catch(err){
            log.error("Error getSalesOrderSerialNumberTM7",err);
            return {success:false, error:err};
        }
    }
    
    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };
    
});

