/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/record', 'N/search'], function(dialog, record, search) {

    // Bandera para evitar bucle infinito
    let isClearingField = false;

    // Lista de campos de vendor que queremos validar
    const vendorFields = ['entity', 'vendor', 'povendor', 'vendorname'];

    function saveRecord(context) {
        // Permite el guardado, el User Event hará la validación real
        return true;
    }

    function pageInit(context) {
    }

    function fieldChanged(context) {
        try {
            // Si estamos limpiando un campo, no procesar
            if (isClearingField) {
                return;
            }

            const currentRecord = context.currentRecord;
            const fieldId = context.fieldId;
            const sublistId = context.sublistId;
            const line = context.line;

            // Solo procesar si el campo es un campo de vendor
            if (!vendorFields.includes(fieldId)) {
                return;
            }

            // Validar campo entity (vendor principal)
            if (fieldId === 'entity' || fieldId === 'vendor') {
                const vendorId = currentRecord.getValue({ fieldId: fieldId });
                if (vendorId) {
                    validateVendorStatus(vendorId, fieldId, currentRecord);
                }
            }

            // Validar campos de vendor en líneas de transacción
            if (sublistId && (fieldId === 'povendor' || fieldId === 'vendorname')) {
                if (fieldId === 'povendor') {
                    // Para povendor (ID)
                    try {
                        const vendorId = currentRecord.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'povendor'
                        });
                        if (vendorId) {
                            validateVendorStatusInLine(vendorId, sublistId, 'povendor', currentRecord, line);
                        }
                    } catch (e) {
                        console.log('Error obteniendo povendor:', e);
                    }
                } else if (fieldId === 'vendorname') {
                    // Para vendorname (texto) - usar getCurrentSublistValue
                    try {
                        const vendorName = currentRecord.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'vendorname'
                        });
                        if (vendorName) {
                            validateVendorByName(vendorName, sublistId, 'vendorname', currentRecord, line);
                        }
                    } catch (e) {
                        console.log('Error obteniendo vendorname:', e);
                        // Intentar con getSublistText como alternativa
                        try {
                            const vendorNameText = currentRecord.getSublistText({
                                sublistId: sublistId,
                                fieldId: 'vendorname',
                                line: line
                            });
                            if (vendorNameText) {
                                validateVendorByName(vendorNameText, sublistId, 'vendorname', currentRecord, line);
                            }
                        } catch (e2) {
                            console.log('Error obteniendo vendorname con getSublistText:', e2);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error en fieldChanged:', error);
        }
    }

    function validateVendorStatus(vendorId, fieldId, currentRecord) {
        try {
            // Obtener el registro del vendor
            const vendorRecord = record.load({
                type: record.Type.VENDOR,
                id: vendorId
            });

            const estatusProv = vendorRecord.getValue({ fieldId: 'custentity_status_prov' });
            
            if (estatusProv === '2') {
                dialog.alert({
                    title: 'Proveedor no disponible',
                    message: 'El proveedor seleccionado tiene estatus Proveedor pendiente de aprobación y no puede ser utilizado en transacciones. Por favor, contacta a CxP.'
                });

                // Activar bandera para evitar bucle
                isClearingField = true;
                
                // Limpiar el campo vendor
                currentRecord.setValue({ fieldId: fieldId, value: '' });
                
                // Si hay un campo de nombre del vendor, también limpiarlo
                const vendorNameField = getVendorNameField(fieldId);
                if (vendorNameField) {
                    currentRecord.setValue({ fieldId: vendorNameField, value: '' });
                }
                
                // Desactivar bandera después de limpiar
                setTimeout(() => {
                    isClearingField = false;
                }, 100);
            }
        } catch (error) {
            console.error('Error validando estatus del vendor:', error);
            isClearingField = false;
        }
    }

    function validateVendorStatusInLine(vendorId, sublistId, vendorFieldId, currentRecord, line) {
        try {
            // Obtener el registro del vendor
            const vendorRecord = record.load({
                type: record.Type.VENDOR,
                id: vendorId
            });

            const estatusProv = vendorRecord.getValue({ fieldId: 'custentity_status_prov' });
            
            if (estatusProv === '2') {
                dialog.alert({
                    title: 'Proveedor no disponible',
                    message: 'El proveedor seleccionado en la línea ' + (line + 1) + ' tiene estatus Proveedor pendiente de aprobación y no puede ser utilizado en transacciones. Por favor, contacta a CxP.'
                });

                // Activar bandera para evitar bucle
                isClearingField = true;

                // Limpiar el campo vendor en la línea usando setCurrentSublistValue
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: vendorFieldId,
                    value: ''
                });
                
                // Desactivar bandera después de limpiar
                setTimeout(() => {
                    isClearingField = false;
                }, 100);
            }
        } catch (error) {
            console.error('Error validando estatus del vendor en línea:', error);
            isClearingField = false;
        }
    }

    function validateVendorByName(vendorName, sublistId, vendorFieldId, currentRecord, line) {
        try {
            // Buscar el vendor por nombre usando search
            const vendorSearch = search.create({
                type: search.Type.VENDOR,
                filters: [
                    ['entityid', 'is', vendorName]
                ],
                columns: [
                    'internalid',
                    'custentity_status_prov'
                ]
            });
            
            const vendorSearchResult = vendorSearch.run().getRange({ start: 0, end: 1 });
            
            if (vendorSearchResult.length > 0) {
                const vendorId = vendorSearchResult[0].id;
                const estatusProv = vendorSearchResult[0].getValue({ name: 'custentity_status_prov' });
                
                if (estatusProv === '2') {
                    dialog.alert({
                        title: 'Proveedor no disponible',
                        message: 'El proveedor "' + vendorName + '" en la línea ' + (line + 1) + ' tiene estatus Proveedor pendiente de aprobación y no puede ser utilizado en transacciones. Por favor, contacta a CxP.'
                    });

                    // Activar bandera para evitar bucle
                    isClearingField = true;

                    // Limpiar el campo vendor en la línea usando setCurrentSublistValue
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: vendorFieldId,
                        value: ''
                    });
                    
                    // Desactivar bandera después de limpiar
                    setTimeout(() => {
                        isClearingField = false;
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error validando vendor por nombre:', error);
            isClearingField = false;
        }
    }

    function getVendorNameField(vendorFieldId) {
        // Mapeo de campos de vendor a campos de nombre
        const nameFieldsMap = {
            'entity': 'entityid',
            'vendor': 'vendorid'
        };

        return nameFieldsMap[vendorFieldId] || null;
    }

    return {
        saveRecord: saveRecord,
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});