/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/file', 'N/http','N/format','N/encode','N/email','N/runtime','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

function(record,search,https,file,http,format,encode,email,runtime,Utils) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
        try{
            log.debug("entre doGet REFERIDOS",requestParams);
            
            return "login was done via server script Restlet Saved Search";
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
        try {
            var res = {};
            log.debug("requestBody", requestBody);
            var req_info = requestBody;
            
            // Validación de parámetros requeridos
            if (!req_info || !req_info.type) {
                return {
                    success: false,
                    error: 'Se requiere el parámetro "type"'
                };
            }

            switch(req_info.type) {
                case "search_Sales_Orders":
                    res = getSavedSearchResults(req_info);
                    break;
                default:
                    res = {
                        success: false,
                        error: 'Tipo de búsqueda no válido'
                    };
            }
            
            return res;
        } catch(err) {
            log.error("error request", err);
            return {
                success: false,
                error: err.message || 'Error interno del servidor'
            };
        }
    }

    function getCurrentVorwerkPeriod() {
        try {
            var today = new Date();
            log.debug("today", today);
            var todaySplit = Utils.dateToString(today).split('/')
            log.debug("todaySplit", todaySplit);
            var start = (todaySplit[0]+'/'+todaySplit[1]+'/'+todaySplit[2])

            log.debug('start',start)
            // Búsqueda del período actual
            var periodSearch = search.create({
                type: 'customrecord_periods',
                filters: [
                    ['custrecord_inicio', 'onorafter', start],
                    'AND',
                    ['custrecord_final', 'onorbefore', start]
                ],
                columns: [
                    'custrecord_inicio',
                    'custrecord_final'
                ]
            });

            var searchResult = periodSearch.run().getRange({ start: 0, end: 1 });
            
            if (!searchResult || searchResult.length === 0) {
                
                log.error('No se encontró un período Vorwerk válido para la fecha actual');
                startDate = '30/03/2024';
                endDate = '26/02/2024';
            }else{
                log.debug('Período Vorwerk encontrado', searchResult);
                startDate = searchResult[0].getValue('custrecord_inicio');
                endDate = searchResult[0].getValue('custrecord_final');
            }

            return {
                startDate: startDate,
                endDate: endDate
            };
        } catch (e) {
            log.error('Error en getCurrentVorwerkPeriod', e);
            throw e;
        }
    }

    function getSavedSearchResults(req_info) {
        try {
            log.debug("entre getSavedSearchResults", req_info);
            if (!req_info || !req_info.ssid || req_info.ssid !== "1843") {
                throw new Error('Búsqueda no válida o no autorizada');
            }

            // Obtener período actual
            var currentPeriod = getCurrentVorwerkPeriod();
            log.debug('Período Vorwerk actual', currentPeriod);

            // Definir filtros
            var filters = [
                [
                    [
                        ['type', 'anyof', 'SalesOrd'],
                        'AND',
                        ['custbody_tipo_venta', 'anyof', '1', '2', '19'],
                        'AND',
                        ['item', 'anyof', '2280', '2001', '2170', '2490', '2571', '2638'],
                        'AND',
                        ['trandate', 'within', currentPeriod.startDate, currentPeriod.endDate],
                    ],
                    'OR',
                    [
                        ['custbody_fcha_cancelacion', 'within', currentPeriod.startDate, currentPeriod.endDate],
                        'AND',
                        ['item', 'anyof', '2280', '2001', '2170', '2490', '2571'],
                        'AND',
                        ['type', 'anyof', 'SalesOrd'],
                        'AND',
                        ['custbody_tipo_venta', 'anyof', '1', '19', '2'],
                    ],
                ]
            ];

            // Crear columnas
            var columns = [
                search.createColumn({ name: 'trandate', sort: search.Sort.ASC }),
                search.createColumn({ name: 'tranid' }),
                search.createColumn({ name: 'item' }),
                search.createColumn({ name: 'entityid', join: 'salesrep' }),
                search.createColumn({ name: 'altname', join: 'salesrep' }),
                search.createColumn({ name: 'email', join: 'salesrep' }),
                search.createColumn({ name: 'custbody_tipo_venta' }),
                search.createColumn({ name: 'quantity' }),
                search.createColumn({ name: 'custbody_fcha_cancelacion' }),
                search.createColumn({ name: 'custbody_otro_financiamiento' })
            ];

            // Crear búsqueda
            var searchObj = search.create({
                type: 'salesorder',
                filters: filters,
                columns: columns
            });

            var results = [];
            var pagedData = searchObj.runPaged({ pageSize: 1000 });
            
            // Procesar resultados paginados
            for (var i = 0; i < pagedData.pageRanges.length; i++) {
                var page = pagedData.fetch({ index: i });
                page.data.forEach(function(result) {
                    var resultObj = {
                        $attributes: {
                            "xsi:type": "tranSales:TransactionSearchRow"
                        },
                        basic: {
                            item: [{
                                searchValue: {
                                    $attributes: {
                                        internalId: result.getValue({ name: 'item' })
                                    }
                                }
                            }],
                            quantity: [{
                                searchValue: result.getValue({ name: 'quantity' })
                            }],
                            tranDate: [{
                                searchValue: result.getValue({ name: 'trandate' })
                            }],
                            tranId: [{
                                searchValue: result.getValue({ name: 'tranid' }),
                                customLabel: "Pedido"
                            }],
                            customFieldList: {
                                customField: []
                            }
                        },
                        salesRepJoin: {
                            altName: [{
                                searchValue: result.getValue({ name: 'altname', join: 'salesrep' }),
                                customLabel: "Presentador"
                            }],
                            email: [{
                                searchValue: result.getValue({ name: 'email', join: 'salesrep' })
                            }],
                            entityId: [{
                                searchValue: result.getValue({ name: 'entityid', join: 'salesrep' }),
                                customLabel: "IDU"
                            }]
                        }
                    };

                    // Agregar campos personalizados
                    var customFields = resultObj.basic.customFieldList.customField;

                    // Tipo de venta
                    var tipoVenta = result.getValue({ name: 'custbody_tipo_venta' });
                    if (tipoVenta) {
                        customFields.push({
                            $attributes: {
                                internalId: "883",
                                scriptId: "custbody_tipo_venta",
                                "xsi:type": "platformCore:SearchColumnSelectCustomField"
                            },
                            searchValue: {
                                $attributes: {
                                    internalId: tipoVenta,
                                    typeId: "3"
                                }
                            },
                            customLabel: "Concepto"
                        });
                    }

                    // Otro financiamiento
                    var otroFinanciamiento = result.getValue({ name: 'custbody_otro_financiamiento' });
                    if (otroFinanciamiento) {
                        customFields.push({
                            $attributes: {
                                internalId: "2424",
                                scriptId: "custbody_otro_financiamiento",
                                "xsi:type": "platformCore:SearchColumnSelectCustomField"
                            },
                            searchValue: {
                                $attributes: {
                                    internalId: otroFinanciamiento,
                                    typeId: "311"
                                }
                            }
                        });
                    }

                    // Fecha de cancelación
                    var fechaCancelacion = result.getValue({ name: 'custbody_fcha_cancelacion' });
                    if (fechaCancelacion) {
                        customFields.push({
                            $attributes: {
                                internalId: "3137",
                                scriptId: "custbody_fcha_cancelacion",
                                "xsi:type": "platformCore:SearchColumnDateCustomField"
                            },
                            searchValue: fechaCancelacion
                        });
                    }

                    results.push(resultObj);
                });
            }

            return {
                ok: true,
                statusCode: 200,
                data: {
                    id: generateUUID(),
                    ssid: req_info.ssid,
                    status: "completed",
                    message: "",
                    results: results,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            };

        } catch(e) {
            log.error('Error en getSavedSearchResults', e);
            throw e;
        }
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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

    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };
    
});
    