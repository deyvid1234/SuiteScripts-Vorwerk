/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'],
    function(currentRecord, dialog) {

    /**
     * Función para validar el proceso con diálogos
     */
    function validateProcess(currentRec) {
        return dialog.confirm({
            title: 'Advertencia',
            message: 'Este proceso elimina archivos directos de FILE CABINET los cuales no pueden ser recuperados, ¿Seguro que desea continuar?'
        });
    }

    /**
     * Función para validar la búsqueda guardada
     */
    function validateSearch(currentRec) {
        return dialog.confirm({
            title: 'Validación de Búsqueda',
            message: 'El id debe corresponder a una búsqueda guardada activa que sin importar los filtros y resultados debe contener una columna de Internal ID, que es el punto principal de funcionamiento, ¿Seguro que cumple con estos requisitos para continuar?'
        });
    }

    /**
     * Función que se ejecuta cuando cambia un campo
     */
    function fieldChanged(context) {
        var currentRec = context.currentRecord;
        var searchField = currentRec.getField({
            fieldId: 'custpage_searchid'
        });

        if (context.fieldId === 'custpage_process') {
            var process = currentRec.getValue({
                fieldId: 'custpage_process'
            });

            if (process === '1') {
                validateProcess(currentRec).then(function(result) {
                    if (result) {
                        searchField.isDisabled = false;
                        searchField.isMandatory = true;
                    } else {
                        currentRec.setValue({
                            fieldId: 'custpage_process',
                            value: ''
                        });
                    }
                });
            } else {
                searchField.isDisabled = true;
                searchField.isMandatory = false;
                currentRec.setValue({
                    fieldId: 'custpage_searchid',
                    value: ''
                });
            }
        } else if (context.fieldId === 'custpage_searchid') {
            var searchId = currentRec.getValue({
                fieldId: 'custpage_searchid'
            });
            
            if (searchId) {
                validateSearch(currentRec).then(function(result) {
                    if (!result) {
                        currentRec.setValue({
                            fieldId: 'custpage_searchid',
                            value: ''
                        });
                    }
                });
            }
        }
    }

    /**
     * Función que se ejecuta antes de enviar el formulario
     */
    function saveRecord(context) {
        var currentRec = context.currentRecord;
        var process = currentRec.getValue({
            fieldId: 'custpage_process'
        });

        if (process === '1') {
            return validateSearch(currentRec);
        }
        return true;
    }

    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
});