/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/file', 'N/format', 'N/runtime'],
    function(search, record, file, format, runtime) {

    const PHOTO_FIELDS = [
        'custentity_foto_ine_anverso',
        'custentity_foto_ine_reverso',
        'custentity_foto_comprobante_dom',
        'custentity_foto_comprobante_banco',
        'custentity_foto'
    ];

    function getInputData() {
        const scriptObj = runtime.getCurrentScript();
        const searchId = scriptObj.getParameter({
            name: 'custscript_searchid'
        });

        if (!searchId) {
            throw new Error('El parámetro custscript_searchid es requerido');
        }

        return search.load({
            id: searchId
        });
    }

    function map(context) {
        try {
            const searchResult = JSON.parse(context.value);
            const employeeId = searchResult.values['GROUP(internalid)'].value;
            
            // Recopilar IDs de archivos a eliminar
            const filesToDelete = [];
            PHOTO_FIELDS.forEach(fieldId => {
                const fieldValue = searchResult.values[`GROUP(${fieldId})`];
                if (fieldValue && fieldValue.value) {  // Verificamos que exista y tenga value
                    filesToDelete.push({
                        fileId: fieldValue.value,  // Usamos .value para obtener el ID del archivo
                        fieldId: fieldId
                    });
                }
            });

            // Log para verificar los IDs de archivos
            log.debug('Files to delete', filesToDelete);

            // Emitir para el reduce
            if (filesToDelete.length > 0) {
                context.write({
                    key: employeeId,
                    value: {
                        employeeId: employeeId,
                        files: filesToDelete,
                        email: searchResult.values['GROUP(email)'],
                        lastModified: searchResult.values['MAX(date.systemNotes)']
                    }
                });
            }

        } catch (e) {
            log.error({
                title: 'Map Error for employee ' + context.key,
                details: e.toString() + '\nResult: ' + JSON.stringify(context.value)
            });
        }
    }

    function reduce(context) {
        try {
            const data = JSON.parse(context.values[0]);
            const filesDeleted = [];
            const filesError = [];

            // Eliminar archivos
            data.files.forEach(fileInfo => {
                try {
                    log.debug('Attempting to delete file', {
                        fileId: fileInfo.fileId
                    });

                    try {
                        // Intentar eliminar el archivo directamente
                        /*file.delete({
                            id: fileInfo.fileId
                        });*/
                        filesDeleted.push(fileInfo.fileId);
                        log.debug('File deleted successfully', fileInfo.fileId);
                    } catch (deleteError) {
                        log.error('Error deleting file', {
                            fileId: fileInfo.fileId,
                            error: deleteError.toString()
                        });
                        filesError.push({
                            fileId: fileInfo.fileId,
                            error: deleteError.toString()
                        });
                    }

                    // Limpiar el campo en el empleado
                    record.submitFields({
                        type: record.Type.EMPLOYEE,
                        id: data.employeeId,
                        values: {
                            [fileInfo.fieldId]: ''
                        }
                    });

                } catch (e) {
                    filesError.push({
                        fileId: fileInfo.fileId,
                        error: e.toString()
                    });
                }
            });

            // Registrar resultados
            log.audit({
                title: 'Files processed for employee ' + data.employeeId,
                details: {
                    employeeEmail: data.email,
                    lastModified: data.lastModified,
                    filesDeleted: filesDeleted,
                    filesError: filesError
                }
            });

        } catch (e) {
            log.error({
                title: 'Reduce Error for employee ' + context.key,
                details: e.toString()
            });
        }
    }

    function summarize(summary) {
        log.audit({
            title: 'Process Summary',
            details: {
                inputStageFailed: summary.inputSummary.error,
                mapErrors: summary.mapSummary.errors,
                reduceErrors: summary.reduceSummary.errors,
                totalRecordsProcessed: summary.reduceSummary.total
            }
        });
    }

    function doesFileExist(fileId) {
        try {
            const fileFields = search.lookupFields({
                type: search.Type.FILE,
                id: fileId,
                columns: ['name']
            });
            return fileFields && fileFields.name;
        } catch (e) {
            return false;
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
