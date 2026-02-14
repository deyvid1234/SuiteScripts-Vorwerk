/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 * 
 * Script que recibe un XML (CFDI) y lo convierte en una factura en NetSuite
 */
define(['N/record', 'N/search', 'N/xml', 'N/log', 'N/format', 'N/file'],
    function(record, search, xml, log, format, file) {
        
        /**
         * Función principal que procesa el POST request con el XML
         * @param {Object|string} requestBody - El XML como string o objeto con el XML
         * @returns {Object} - Respuesta con el resultado de la creación de la factura
         */
        function doPost(requestBody) {
            try {
                log.debug('doPost', 'Iniciando procesamiento de XML a factura');
                
                // Obtener el XML del request body
                var xmlContent = '';
                if (typeof requestBody === 'string') {
                    xmlContent = requestBody;
                } else if (requestBody.xml) {
                    xmlContent = requestBody.xml;
                } else if (requestBody.xmlContent) {
                    xmlContent = requestBody.xmlContent;
                } else {
                    return {
                        success: false,
                        error: 'No se encontró el XML en el request body. Envíe el XML en el campo "xml" o "xmlContent"'
                    };
                }
                
                // Parsear el XML
                var xmlDocument = xml.Parser.fromString({ text: xmlContent });
                
                // Extraer datos del CFDI
                var datosCFDI = extraerDatosCFDI(xmlDocument);
                
                if (!datosCFDI) {
                    return {
                        success: false,
                        error: 'Error al extraer datos del XML CFDI'
                    };
                }
                
                log.debug('datosCFDI', datosCFDI);
                
                // Crear la factura
                var invoiceId = crearFacturaDesdeXML(datosCFDI, xmlContent);
                
                if (invoiceId) {
                    return {
                        success: true,
                        invoiceId: invoiceId,
                        message: 'Factura creada exitosamente',
                        datos: {
                            folio: datosCFDI.folio,
                            uuid: datosCFDI.uuid,
                            total: datosCFDI.total
                        }
                    };
                } else {
                    return {
                        success: false,
                        error: 'Error al crear la factura'
                    };
                }
                
            } catch (error) {
                log.error('doPost', error);
                return {
                    success: false,
                    error: error.toString()
                };
            }
        }
        
        /**
         * Extrae los datos del CFDI del XML parseado
         * @param {Object} xmlDocument - Documento XML parseado
         * @returns {Object} - Objeto con los datos extraídos del CFDI
         */
        function extraerDatosCFDI(xmlDocument) {
            try {
                // Obtener el elemento Comprobante
                var comprobante = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Comprobante' })[0];
                if (!comprobante) {
                    // Intentar sin namespace
                    comprobante = xmlDocument.getElementsByTagName({ tagName: 'Comprobante' })[0];
                }
                
                if (!comprobante) {
                    log.error('extraerDatosCFDI', 'No se encontró el elemento Comprobante en el XML');
                    return null;
                }
                
                // Extraer atributos del Comprobante
                var fecha = obtenerAtributo(comprobante, 'Fecha');
                var folio = obtenerAtributo(comprobante, 'Folio');
                var serie = obtenerAtributo(comprobante, 'Serie');
                var subtotal = obtenerAtributo(comprobante, 'SubTotal');
                var total = obtenerAtributo(comprobante, 'Total');
                var moneda = obtenerAtributo(comprobante, 'Moneda');
                var tipoDeComprobante = obtenerAtributo(comprobante, 'TipoDeComprobante');
                var metodoPago = obtenerAtributo(comprobante, 'MetodoPago');
                var formaPago = obtenerAtributo(comprobante, 'FormaPago');
                var lugarExpedicion = obtenerAtributo(comprobante, 'LugarExpedicion');
                
                // Obtener Emisor
                var emisor = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Emisor' })[0];
                if (!emisor) {
                    emisor = xmlDocument.getElementsByTagName({ tagName: 'Emisor' })[0];
                }
                
                var emisorRfc = emisor ? obtenerAtributo(emisor, 'Rfc') : '';
                var emisorNombre = emisor ? obtenerAtributo(emisor, 'Nombre') : '';
                
                // Obtener Receptor
                var receptor = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Receptor' })[0];
                if (!receptor) {
                    receptor = xmlDocument.getElementsByTagName({ tagName: 'Receptor' })[0];
                }
                
                var receptorRfc = receptor ? obtenerAtributo(receptor, 'Rfc') : '';
                var receptorNombre = receptor ? obtenerAtributo(receptor, 'Nombre') : '';
                var receptorUsoCFDI = receptor ? obtenerAtributo(receptor, 'UsoCFDI') : '';
                
                // Obtener UUID del Timbre Fiscal
                var timbreFiscal = xmlDocument.getElementsByTagName({ tagName: 'tfd:TimbreFiscalDigital' })[0];
                if (!timbreFiscal) {
                    timbreFiscal = xmlDocument.getElementsByTagName({ tagName: 'TimbreFiscalDigital' })[0];
                }
                
                var uuid = timbreFiscal ? obtenerAtributo(timbreFiscal, 'UUID') : '';
                
                // Obtener Conceptos
                var conceptos = [];
                var conceptosNodes = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Concepto' });
                if (conceptosNodes.length === 0) {
                    conceptosNodes = xmlDocument.getElementsByTagName({ tagName: 'Concepto' });
                }
                
                for (var i = 0; i < conceptosNodes.length; i++) {
                    var concepto = conceptosNodes[i];
                    conceptos.push({
                        cantidad: obtenerAtributo(concepto, 'Cantidad'),
                        unidad: obtenerAtributo(concepto, 'Unidad'),
                        descripcion: obtenerAtributo(concepto, 'Descripcion'),
                        valorUnitario: obtenerAtributo(concepto, 'ValorUnitario'),
                        importe: obtenerAtributo(concepto, 'Importe'),
                        claveProdServ: obtenerAtributo(concepto, 'ClaveProdServ'),
                        noIdentificacion: obtenerAtributo(concepto, 'NoIdentificacion')
                    });
                }
                
                // Obtener Impuestos
                var impuestos = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Impuestos' })[0];
                if (!impuestos) {
                    impuestos = xmlDocument.getElementsByTagName({ tagName: 'Impuestos' })[0];
                }
                
                var totalImpuestosTrasladados = impuestos ? obtenerAtributo(impuestos, 'TotalImpuestosTrasladados') : '0';
                var totalImpuestosRetenidos = impuestos ? obtenerAtributo(impuestos, 'TotalImpuestosRetenidos') : '0';
                
                return {
                    fecha: fecha,
                    folio: folio,
                    serie: serie,
                    subtotal: subtotal,
                    total: total,
                    moneda: moneda,
                    tipoDeComprobante: tipoDeComprobante,
                    metodoPago: metodoPago,
                    formaPago: formaPago,
                    lugarExpedicion: lugarExpedicion,
                    emisor: {
                        rfc: emisorRfc,
                        nombre: emisorNombre
                    },
                    receptor: {
                        rfc: receptorRfc,
                        nombre: receptorNombre,
                        usoCFDI: receptorUsoCFDI
                    },
                    uuid: uuid,
                    conceptos: conceptos,
                    impuestos: {
                        totalTrasladados: totalImpuestosTrasladados,
                        totalRetenidos: totalImpuestosRetenidos
                    }
                };
                
            } catch (error) {
                log.error('extraerDatosCFDI', error);
                return null;
            }
        }
        
        /**
         * Obtiene un atributo de un elemento XML de forma segura
         * @param {Object} elemento - Elemento XML
         * @param {string} nombreAtributo - Nombre del atributo
         * @returns {string} - Valor del atributo o cadena vacía
         */
        function obtenerAtributo(elemento, nombreAtributo) {
            try {
                if (elemento && elemento.getAttribute) {
                    var valor = elemento.getAttribute({ name: nombreAtributo });
                    return valor || '';
                }
                return '';
            } catch (error) {
                log.debug('obtenerAtributo', 'Error al obtener atributo ' + nombreAtributo + ': ' + error);
                return '';
            }
        }
        
        /**
         * Crea una factura en NetSuite basada en los datos del CFDI
         * @param {Object} datosCFDI - Datos extraídos del CFDI
         * @param {string} xmlContent - Contenido XML original para guardarlo
         * @returns {string} - ID de la factura creada o null si hay error
         */
        function crearFacturaDesdeXML(datosCFDI, xmlContent) {
            try {
                log.debug('crearFacturaDesdeXML', 'Iniciando creación de factura');
                
                // Buscar el cliente por RFC
                var clienteId = buscarClientePorRFC(datosCFDI.receptor.rfc);
                if (!clienteId) {
                    log.error('crearFacturaDesdeXML', 'No se encontró cliente con RFC: ' + datosCFDI.receptor.rfc);
                    throw new Error('No se encontró cliente con RFC: ' + datosCFDI.receptor.rfc);
                }
                
                // Crear la factura
                var invoice = record.create({
                    type: record.Type.INVOICE,
                    isDynamic: true
                });
                
                // Configurar campos básicos
                invoice.setValue({
                    fieldId: 'entity',
                    value: clienteId
                });
                
                // Convertir fecha del CFDI a formato NetSuite
                var fechaFactura = convertirFecha(datosCFDI.fecha);
                if (fechaFactura) {
                    invoice.setValue({
                        fieldId: 'trandate',
                        value: fechaFactura
                    });
                }
                
                // Establecer número de factura si existe
                if (datosCFDI.folio) {
                    invoice.setValue({
                        fieldId: 'tranid',
                        value: datosCFDI.serie ? datosCFDI.serie + '-' + datosCFDI.folio : datosCFDI.folio
                    });
                }
                
                // Establecer moneda
                if (datosCFDI.moneda) {
                    invoice.setValue({
                        fieldId: 'currency',
                        value: datosCFDI.moneda
                    });
                }
                
                // Agregar conceptos como items
                if (datosCFDI.conceptos && datosCFDI.conceptos.length > 0) {
                    for (var i = 0; i < datosCFDI.conceptos.length; i++) {
                        var concepto = datosCFDI.conceptos[i];
                        
                        invoice.selectNewLine({
                            sublistId: 'item'
                        });
                        
                        // Buscar item por clave de producto o usar item genérico
                        var itemId = buscarItemPorClave(concepto.claveProdServ) || buscarItemPorDescripcion(concepto.descripcion);
                        
                        if (itemId) {
                            invoice.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: itemId
                            });
                        } else {
                            // Si no se encuentra el item, usar descripción como item no inventariable
                            invoice.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: -1 // Item genérico o ajustar según configuración
                            });
                        }
                        
                        invoice.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: concepto.cantidad || 1
                        });
                        
                        invoice.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: concepto.valorUnitario || concepto.importe
                        });
                        
                        invoice.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            value: concepto.descripcion
                        });
                        
                        invoice.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
                
                // Guardar campos personalizados si existen
                if (datosCFDI.uuid) {
                    try {
                        invoice.setValue({
                            fieldId: 'custbody_uuid',
                            value: datosCFDI.uuid
                        });
                    } catch (e) {
                        log.debug('crearFacturaDesdeXML', 'Campo custbody_uuid no existe o no se pudo establecer');
                    }
                }
                
                if (datosCFDI.folio) {
                    try {
                        invoice.setValue({
                            fieldId: 'custbody_foliosat',
                            value: datosCFDI.folio
                        });
                    } catch (e) {
                        log.debug('crearFacturaDesdeXML', 'Campo custbody_foliosat no existe o no se pudo establecer');
                    }
                }
                
                if (datosCFDI.receptor.usoCFDI) {
                    try {
                        invoice.setValue({
                            fieldId: 'custbody_cfdi_usocfdi',
                            value: datosCFDI.receptor.usoCFDI
                        });
                    } catch (e) {
                        log.debug('crearFacturaDesdeXML', 'Campo custbody_cfdi_usocfdi no existe o no se pudo establecer');
                    }
                }
                
                // Guardar el XML en un archivo y adjuntarlo a la factura
                if (xmlContent) {
                    try {
                        var xmlFile = file.create({
                            name: 'CFDI_' + (datosCFDI.folio || datosCFDI.uuid) + '.xml',
                            fileType: file.Type.XMLDOC,
                            contents: xmlContent
                        });
                        var fileId = xmlFile.save();
                        
                        try {
                            invoice.setValue({
                                fieldId: 'custbody_xml_file',
                                value: fileId
                            });
                        } catch (e) {
                            log.debug('crearFacturaDesdeXML', 'Campo custbody_xml_file no existe o no se pudo establecer');
                        }
                    } catch (e) {
                        log.error('crearFacturaDesdeXML', 'Error al guardar archivo XML: ' + e);
                    }
                }
                
                // Guardar la factura
                var invoiceId = invoice.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: false
                });
                
                log.debug('crearFacturaDesdeXML', 'Factura creada con ID: ' + invoiceId);
                
                return invoiceId;
                
            } catch (error) {
                log.error('crearFacturaDesdeXML', error);
                throw error;
            }
        }
        
        /**
         * Busca un cliente por RFC
         * @param {string} rfc - RFC del cliente
         * @returns {string} - ID del cliente o null si no se encuentra
         */
        function buscarClientePorRFC(rfc) {
            try {
                if (!rfc) {
                    return null;
                }
                
                var customerSearch = search.create({
                    type: search.Type.CUSTOMER,
                    filters: [
                        ['vatregnumber', 'is', rfc]
                    ],
                    columns: ['internalid']
                });
                
                var results = customerSearch.run().getRange({ start: 0, end: 1 });
                
                if (results && results.length > 0) {
                    return results[0].id;
                }
                
                return null;
            } catch (error) {
                log.error('buscarClientePorRFC', error);
                return null;
            }
        }
        
        /**
         * Busca un item por clave de producto
         * @param {string} claveProdServ - Clave de producto/servicio
         * @returns {string} - ID del item o null si no se encuentra
         */
        function buscarItemPorClave(claveProdServ) {
            try {
                if (!claveProdServ) {
                    return null;
                }
                
                // Buscar en campo personalizado si existe
                var itemSearch = search.create({
                    type: search.Type.INVENTORY_ITEM,
                    filters: [
                        ['custitem_clave_prod_serv', 'is', claveProdServ]
                    ],
                    columns: ['internalid']
                });
                
                var results = itemSearch.run().getRange({ start: 0, end: 1 });
                
                if (results && results.length > 0) {
                    return results[0].id;
                }
                
                return null;
            } catch (error) {
                log.debug('buscarItemPorClave', 'Error al buscar item por clave: ' + error);
                return null;
            }
        }
        
        /**
         * Busca un item por descripción
         * @param {string} descripcion - Descripción del item
         * @returns {string} - ID del item o null si no se encuentra
         */
        function buscarItemPorDescripcion(descripcion) {
            try {
                if (!descripcion) {
                    return null;
                }
                
                var itemSearch = search.create({
                    type: search.Type.INVENTORY_ITEM,
                    filters: [
                        ['displayname', 'contains', descripcion]
                    ],
                    columns: ['internalid']
                });
                
                var results = itemSearch.run().getRange({ start: 0, end: 1 });
                
                if (results && results.length > 0) {
                    return results[0].id;
                }
                
                return null;
            } catch (error) {
                log.debug('buscarItemPorDescripcion', 'Error al buscar item por descripción: ' + error);
                return null;
            }
        }
        
        /**
         * Convierte una fecha del formato CFDI (ISO) a formato NetSuite
         * @param {string} fechaISO - Fecha en formato ISO (YYYY-MM-DDTHH:mm:ss)
         * @returns {Date} - Objeto Date de NetSuite
         */
        function convertirFecha(fechaISO) {
            try {
                if (!fechaISO) {
                    return null;
                }
                
                // El formato CFDI es: YYYY-MM-DDTHH:mm:ss
                var fecha = new Date(fechaISO);
                
                if (isNaN(fecha.getTime())) {
                    log.debug('convertirFecha', 'Fecha inválida: ' + fechaISO);
                    return null;
                }
                
                return fecha;
            } catch (error) {
                log.error('convertirFecha', error);
                return null;
            }
        }
        
        return {
            post: doPost
        };
    }
);

