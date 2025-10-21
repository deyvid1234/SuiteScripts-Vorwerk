/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log'],
    function(record, search, runtime, log) {

        /**
         * Obtiene los datos de entrada para el proceso Map/Reduce
         * @return {Object} búsqueda guardada o array de objetos
         */
        function getInputData() {
            try {
                // Cargar la búsqueda guardada de facturas
                var invoiceSearch = search.load({
                    id: 'customsearch2425'
                });

                return invoiceSearch;
            } catch (e) {
                log.error({
                    title: 'Error en getInputData',
                    details: e.toString()
                });
            }
        }

        /**
         * Procesa cada registro de factura
         * @param {Object} context
         */
        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);
                var invoiceId = searchResult.id;

                log.audit({
                    title: 'Procesando Invoice',
                    details: 'Invoice ID: ' + invoiceId
                });

                // Cargar el registro de la factura
                var invoiceRecord = record.load({
                    type: record.Type.INVOICE,
                    id: invoiceId,
                    isDynamic: false
                });

                // Obtener el valor del campo custbody_uuid
                var custbodyUuid = invoiceRecord.getValue({
                    fieldId: 'custbody_uuid'
                });

                // Obtener el valor del campo custbody37
                var custbody37 = invoiceRecord.getValue({
                    fieldId: 'custbody37'
                });

                // Verificar si la invoice ya fue procesada (custbody82)
                var custbody82 = invoiceRecord.getValue({
                    fieldId: 'custbody_anticipo_aplicado'
                });

                log.debug({
                    title: 'Campos obtenidos',
                    details: 'custbody_uuid: ' + custbodyUuid + ' | custbody37: ' + custbody37 + ' | custbody82: ' + custbody82
                });

                // Si custbody82 es true, la invoice ya fue procesada
                if (custbody82 === true) {
                    log.audit({
                        title: 'Invoice ya procesada',
                        details: 'Invoice ID: ' + invoiceId + ' ya fue procesada anteriormente (custbody82 = true)'
                    });
                    return; // Pasar al siguiente resultado
                }

                // Buscar sales order con tranid igual a custbody37
                var salesOrderSearch = search.create({
                    type: search.Type.SALES_ORDER,
                    filters: [
                        ['tranid', 'is', custbody37],
                        'AND',
                        ['mainline', 'is', true]
                    ],
                    columns: [
                        'internalid',
                        'status'
                    ]
                });

                var salesOrderResults = salesOrderSearch.run().getRange({
                    start: 0,
                    end: 1
                });

                // Verificar si existe la sales order y su status
                if (salesOrderResults.length === 0) {
                    log.audit({
                        title: 'Sales Order no encontrada',
                        details: 'No se encontró sales order con tranid: ' + custbody37 + ' para invoice: ' + invoiceId
                    });
                    return; // Pasar al siguiente resultado
                }

                var salesOrderStatus = salesOrderResults[0].getValue({
                    name: 'status'
                });

                log.debug({
                    title: 'Sales Order encontrada',
                    details: 'Sales Order ID: ' + salesOrderResults[0].id + ' | Status: ' + salesOrderStatus
                });

                // Verificar que el status sea 'Pending Billing'
                if (salesOrderStatus !== 'pendingBilling') {
                    log.audit({
                        title: 'Sales Order no está en Pending Billing',
                        details: 'Sales Order tranid: ' + custbody37 + ' tiene status: ' + salesOrderStatus + ' (se requiere Pending Billing)'
                    });
                    return; // Pasar al siguiente resultado
                }

                log.audit({
                    title: 'Condición cumplida',
                    details: 'Sales Order tranid: ' + custbody37 + ' está en Pending Billing, procediendo con credit memo'
                });

                // Transformar la factura a credit memo
                var creditMemo = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: invoiceId,
                    toType: record.Type.CREDIT_MEMO,
                    isDynamic: false
                });

                // Recorrer las líneas del credit memo para identificar items a cambiar
                var lineCount = creditMemo.getLineCount({
                    sublistId: 'item'
                });

                // Array para guardar las líneas que necesitan cambio
                var linesToChange = [];

                for (var i = 0; i < lineCount; i++) {
                    var currentItem = creditMemo.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    // Si el item es 2803, guardamos los datos de esta línea
                    if (currentItem == 2803) {
                        log.debug({
                            title: 'Línea encontrada',
                            details: 'Línea ' + i + ' - Item 2803 será cambiado a 2824'
                        });

                        // Obtener todos los valores actuales de la línea
                        var lineData = {
                            lineNumber: i,
                            quantity: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            }),
                            units: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'units',
                                line: i
                            }),
                            location: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: i
                            }),
                            
                            rate: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            }),
                            amount: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            }),
                            taxCode: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                line: i
                            }),
                            priceLevel: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                line: i
                            })
                        };

                        linesToChange.push(lineData);
                    }
                }

                // Remover las líneas en orden inverso para no afectar los índices
                for (var j = linesToChange.length - 1; j >= 0; j--) {
                    var lineToRemove = linesToChange[j].lineNumber;
                    
                    log.debug({
                        title: 'Removiendo línea',
                        details: 'Línea ' + lineToRemove
                    });

                    creditMemo.removeLine({
                        sublistId: 'item',
                        line: lineToRemove
                    });
                }

                // Agregar las nuevas líneas con el item 2402 al final
                for (var k = 0; k < linesToChange.length; k++) {
                    var lineData = linesToChange[k];
                    
                    // Obtener el nuevo índice (al final de las líneas existentes)
                    var newLineIndex = creditMemo.getLineCount({
                        sublistId: 'item'
                    });

                    log.debug({
                        title: 'Agregando nueva línea',
                        details: 'Índice: ' + newLineIndex + ' - Item 2402'
                    });

                    // Insertar una nueva línea
                    creditMemo.insertLine({
                        sublistId: 'item',
                        line: newLineIndex
                    });

                    // Establecer el nuevo item
                    creditMemo.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: newLineIndex,
                        value: 2824
                    });

                    // Establecer todos los valores
                    if (lineData.quantity) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: newLineIndex,
                            value: lineData.quantity
                        });
                    }

                    if (lineData.location) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: newLineIndex,
                            value: lineData.location
                        });
                    }

                    if (lineData.description) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: newLineIndex,
                            value: 'APLICACIÖN DE ANTICIPO'
                        });
                    }

                    if (lineData.rate) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: newLineIndex,
                            value: lineData.rate
                        });
                    }

                    if (lineData.taxCode) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: newLineIndex,
                            value: lineData.taxCode
                        });
                    }

                    if (lineData.priceLevel) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            line: newLineIndex,
                            value: lineData.priceLevel
                        });
                    }

                    if (lineData.amount) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: newLineIndex,
                            value: lineData.amount
                        });
                    }

                    if (lineData.units) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            line: newLineIndex,
                            value: lineData.units
                        });
                    }
                }
                creditMemo.setValue({
                    fieldId: 'otherrefnum',
                    value: salesOrderResults[0].id
                });
                creditMemo.setValue({
                    fieldId: 'memo',
                    value: 'NC - FACTURA (DEL ANTICIPO)'
                });
                // Establecer los campos CFDI en el credit memo
                creditMemo.setValue({
                    fieldId: 'custbody_cfdi_metpago_sat',
                    value: 918
                });

                creditMemo.setValue({
                    fieldId: 'custbody_cfdi_formadepago',
                    value: 1
                });

                creditMemo.setValue({
                    fieldId: 'custbody_uso_cfdi',
                    value: 2
                });

                creditMemo.setValue({
                    fieldId: 'custbody_cfdi_tipode_relacion',
                    value: 7
                });

                log.debug({
                    title: 'Campos CFDI establecidos',
                    details: 'custbody_cfdi_metpago_sat: 917, custbody_cfdi_formadepago: 1, custbody_uso_cfdi: 2, custbody_cfdi_tipode_relacion: 7'
                });

                // Guardar el credit memo
                var creditMemoId = creditMemo.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.audit({
                    title: 'Credit Memo creado',
                    details: 'Invoice ID: ' + invoiceId + ' | Credit Memo ID: ' + creditMemoId + ' | UUID: ' + custbodyUuid
                });

                // Marcar custbody82 como true para indicar que la invoice ya fue procesada
                if(creditMemoId){
                    try {
                        record.submitFields({
                            type: record.Type.INVOICE,
                            id: invoiceId,
                            values: {
                                custbody82: true
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
    
                        log.audit({
                            title: 'Invoice marcada como procesada',
                            details: 'Invoice ID: ' + invoiceId + ' - custbody82 marcado como true'
                        });
                    } catch (e) {
                        log.error({
                            title: 'Error al marcar invoice como procesada',
                            details: 'Invoice ID: ' + invoiceId + ' | Error: ' + e.toString()
                        });
                    }
    
                }
                
                // Crear el registro de relación CFDI
                var cfdiRelacionRecord = record.create({
                    type: 'customrecord_cfdis_relacion',
                    isDynamic: false
                });

                // Establecer los campos del registro
                cfdiRelacionRecord.setValue({
                    fieldId: 'custrecord_cfdi_tabla_padre',
                    value: creditMemoId
                });

                cfdiRelacionRecord.setValue({
                    fieldId: 'custrecord_cfdi_rel_tran',
                    value: invoiceId
                });

                if (custbodyUuid) {
                    cfdiRelacionRecord.setValue({
                        fieldId: 'custrecord_cfdi_rel_uuid',
                        value: custbodyUuid
                    });
                }

                // Guardar el registro de relación
                var cfdiRelacionId = cfdiRelacionRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                log.audit({
                    title: 'Registro CFDI Relación creado',
                    details: 'CFDI Relación ID: ' + cfdiRelacionId + ' | Credit Memo ID: ' + creditMemoId + ' | Invoice ID: ' + invoiceId + ' | UUID: ' + custbodyUuid
                });

                // Enviar los datos al reduce
                context.write({
                    key: invoiceId,
                    value: {
                        creditMemoId: creditMemoId,
                        custbodyUuid: custbodyUuid,
                        cfdiRelacionId: cfdiRelacionId
                    }
                });

            } catch (e) {
                log.error({
                    title: 'Error en map',
                    details: 'Error procesando invoice: ' + context.value + ' | Error: ' + e.toString()
                });
            }
        }

        /**
         * Consolida los resultados
         * @param {Object} context
         */
        function reduce(context) {
            try {
                var invoiceId = context.key;
                var values = context.values;

                log.audit({
                    title: 'Reduce - Resumen',
                    details: 'Invoice ID: ' + invoiceId + ' | Valores: ' + JSON.stringify(values)
                });

            } catch (e) {
                log.error({
                    title: 'Error en reduce',
                    details: e.toString()
                });
            }
        }

        /**
         * Resume final del proceso
         * @param {Object} summary
         */
        function summarize(summary) {
            log.audit({
                title: 'Resumen del proceso',
                details: 'Total de registros procesados: ' + summary.inputSummary.count
            });

            // Registrar errores si los hay
            summary.mapSummary.errors.iterator().each(function(key, error) {
                log.error({
                    title: 'Error en Map',
                    details: 'Key: ' + key + ' | Error: ' + error
                });
                return true;
            });

            summary.reduceSummary.errors.iterator().each(function(key, error) {
                log.error({
                    title: 'Error en Reduce',
                    details: 'Key: ' + key + ' | Error: ' + error
                });
                return true;
            });

            log.audit({
                title: 'Proceso completado',
                details: 'Script finalizado exitosamente'
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });

