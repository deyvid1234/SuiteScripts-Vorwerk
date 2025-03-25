/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/ui/serverWidget', 'N/file', 'N/xml', 'N/search'], 
    function(serverWidget, file, xml, search) {
    
    /**
     * Obtiene todos los archivos XML de una carpeta
     * @param {string} folderId - ID de la carpeta
     * @returns {Array} - Array de objetos File
     */
    function obtenerArchivosXML(folderId) {
        const archivos = [];
        
        log.debug({
            title: 'Buscando en carpeta',
            details: {
                folderId: folderId
            }
        });

        try {
            // Primero verificamos que la carpeta existe
            const folderSearch = search.create({
                type: 'folder',
                filters: [
                    ['internalid', 'is', folderId]
                ]
            });

            const folderResult = folderSearch.run().getRange({ start: 0, end: 1 });
            
            if (!folderResult || folderResult.length === 0) {
                log.error({
                    title: 'Carpeta no encontrada',
                    details: `No se encontró la carpeta con ID: ${folderId}`
                });
                return archivos;
            }

            // Buscar archivos
            const fileSearch = search.create({
                type: 'file',
                filters: [
                    ['folder', 'anyof', folderId]
                ],
                columns: ['name', 'filetype', 'created']
            });

            // Log de la búsqueda
            log.debug({
                title: 'Búsqueda creada',
                details: {
                    type: fileSearch.type,
                    filters: fileSearch.filters,
                    columns: fileSearch.columns
                }
            });

            let resultCount = 0;
            fileSearch.run().each(function(result) {
                resultCount++;
                const fileType = result.getValue('filetype');
                
                log.debug({
                    title: 'Archivo encontrado',
                    details: {
                        id: result.id,
                        nombre: result.getValue('name'),
                        tipo: fileType
                    }
                });

                // Incluir archivos XML y XMLDOC
                if (fileType && (fileType.toUpperCase() === 'XML' || fileType.toUpperCase() === 'XMLDOC')) {
                    archivos.push({
                        id: result.id,
                        nombre: result.getValue('name')
                    });
                }
                
                return true;
            });

            log.debug({
                title: 'Resumen de búsqueda',
                details: {
                    totalArchivos: resultCount,
                    archivosXML: archivos.length,
                    tiposAceptados: ['XML', 'XMLDOC']
                }
            });

        } catch (e) {
            log.error({
                title: 'Error al buscar archivos',
                details: {
                    error: e,
                    message: e.message,
                    stack: e.stack
                }
            });
        }

        return archivos;
    }

    /**
     * Procesa un archivo XML y extrae sus datos
     * @param {string} fileId - ID del archivo
     * @returns {Object} - Datos extraídos
     */
    function procesarArchivoXML(fileId) {
        try {
            const xmlFile = file.load({ id: fileId });
            const xmlContent = xmlFile.getContents();
            const xmlDocument = xml.Parser.fromString({ text: xmlContent });

            const comprobante = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Comprobante' })[0];
            const emisor = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Emisor' })[0];
            const receptor = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Receptor' })[0];

            const fecha = obtenerAtributoSeguro(comprobante, 'Fecha');

            return {
                fecha: fecha ? formatearFecha(fecha) : ' ',
                folio: obtenerAtributoSeguro(comprobante, 'Folio') || ' ',
                emisorRfc: obtenerAtributoSeguro(emisor, 'Rfc') || ' ',
                emisorNombre: obtenerAtributoSeguro(emisor, 'Nombre') || ' ',
                receptorRfc: obtenerAtributoSeguro(receptor, 'Rfc') || ' ',
                total: obtenerAtributoSeguro(comprobante, 'Total') || '0.00'
            };
        } catch (e) {
            log.error({
                title: 'Error al procesar archivo XML',
                details: {
                    fileId: fileId,
                    error: e
                }
            });
            return null;
        }
    }

    /**
     * Función principal del Suitelet
     * @param {Object} context 
     */
    function onRequest(context) {
        if (context.request.method === 'GET') {
            const form = crearFormulario();
            context.response.writePage(form);
        }
    }

    /**
     * Formatea una fecha ISO a formato de NetSuite (MM/DD/YYYY)
     * @param {string} isoDate - Fecha en formato ISO
     * @returns {string} - Fecha en formato MM/DD/YYYY
     */
    function formatearFecha(isoDate) {
        const fecha = new Date(isoDate);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        const año = fecha.getFullYear();
        return `${mes}/${dia}/${año}`;
    }

    /**
     * Obtiene un valor seguro del atributo XML
     * @param {Object} elemento - Elemento XML
     * @param {string} atributo - Nombre del atributo
     * @returns {string} - Valor del atributo o cadena vacía
     */
    function obtenerAtributoSeguro(elemento, atributo) {
        if (!elemento) {
            log.debug({
                title: 'Elemento XML nulo',
                details: { atributo: atributo }
            });
            return '';
        }
        
        try {
            const valor = elemento.getAttribute({
                name: atributo
            });

            log.debug({
                title: `Atributo extraído: ${atributo}`,
                details: {
                    valor: valor,
                    tipo: typeof valor
                }
            });

            return valor || '';
        } catch (e) {
            log.error({
                title: 'Error al obtener atributo',
                details: {
                    elemento: elemento,
                    atributo: atributo,
                    error: e
                }
            });
            return '';
        }
    }

    /**
     * Crea el formulario principal
     * @returns {serverWidget.Form}
     */
    function crearFormulario() {
        const form = serverWidget.createForm({
            title: 'Traductor de CFDI'
        });

        // Crear la sublist para mostrar los datos
        const sublist = form.addSublist({
            id: 'custpage_cfdi_data',
            type: serverWidget.SublistType.LIST,
            label: 'Datos del CFDI'
        });

        // Agregar columnas a la sublist
        sublist.addField({
            id: 'custpage_fecha',
            type: serverWidget.FieldType.DATE,
            label: 'Fecha'
        });

        sublist.addField({
            id: 'custpage_folio',
            type: serverWidget.FieldType.TEXT,
            label: 'Folio'
        });

        sublist.addField({
            id: 'custpage_emisor_rfc',
            type: serverWidget.FieldType.TEXT,
            label: 'RFC Emisor'
        });

        sublist.addField({
            id: 'custpage_emisor_nombre',
            type: serverWidget.FieldType.TEXT,
            label: 'Nombre Emisor'
        });

        sublist.addField({
            id: 'custpage_receptor_rfc',
            type: serverWidget.FieldType.TEXT,
            label: 'RFC Receptor'
        });

        sublist.addField({
            id: 'custpage_total',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Total'
        });

        try {
            // ID de la carpeta que contiene los XML
            const FOLDER_ID = '469827'; // Asegúrate de que este es el ID correcto

            log.debug({
                title: 'Iniciando procesamiento',
                details: `Buscando archivos XML en carpeta ${FOLDER_ID}`
            });

            const archivosXML = obtenerArchivosXML(FOLDER_ID);
            
            if (archivosXML.length === 0) {
                form.addField({
                    id: 'custpage_warning',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                }).defaultValue = '<p style="color: orange">No se encontraron archivos XML en la carpeta especificada.</p>';
                return form;
            }

            archivosXML.forEach((archivo, index) => {
                const datos = procesarArchivoXML(archivo.id);
                if (datos) {
                    sublist.setSublistValue({
                        id: 'custpage_fecha',
                        line: index,
                        value: datos.fecha
                    });

                    sublist.setSublistValue({
                        id: 'custpage_folio',
                        line: index,
                        value: datos.folio
                    });

                    sublist.setSublistValue({
                        id: 'custpage_emisor_rfc',
                        line: index,
                        value: datos.emisorRfc
                    });

                    sublist.setSublistValue({
                        id: 'custpage_emisor_nombre',
                        line: index,
                        value: datos.emisorNombre
                    });

                    sublist.setSublistValue({
                        id: 'custpage_receptor_rfc',
                        line: index,
                        value: datos.receptorRfc
                    });

                    sublist.setSublistValue({
                        id: 'custpage_total',
                        line: index,
                        value: datos.total
                    });
                }
            });

        } catch (e) {
            log.error({
                title: 'Error al procesar archivos',
                details: e
            });
            form.addField({
                id: 'custpage_error',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            }).defaultValue = `<p style="color: red">Error al procesar los archivos: ${e.message}</p>`;
        }

        return form;
    }

    return {onRequest};
});
