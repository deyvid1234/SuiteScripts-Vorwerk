/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/runtime'],
    function(serverWidget, search, task, runtime) {

    /**
     * Crea y configura el formulario
     */
    function createForm() {
        const form = serverWidget.createForm({
            title: 'Procesamiento Masivo'
        });

        // Agregar el script del cliente usando su ID
        form.clientScriptFileId = 3209218;
        
        // Campo de selección de proceso usando la lista existente
        const processField = form.addField({
            id: 'custpage_process',
            type: serverWidget.FieldType.SELECT,
            label: 'Seleccionar Proceso',
            source: 'customlist_massiveprocessui_list'
        });
        processField.isMandatory = true;

        // Campo para ID de búsqueda guardada (visible pero deshabilitado)
        const searchField = form.addField({
            id: 'custpage_searchid',
            type: serverWidget.FieldType.TEXT,
            label: 'ID de Búsqueda Guardada'
        });
        searchField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        // Botón de procesar
        form.addSubmitButton({
            label: 'Procesar'
        });

        return form;
    }

    /**
     * Ejecuta el proceso seleccionado
     */
    function executeProcess(process, params) {
        if (process === '1') { // ID 1 de customlist_massiveprocessui_list
            return executeDeleteFiles(params);
        }
        throw new Error('Proceso no válido');
    }

    /**
     * Ejecuta el proceso de eliminación de archivos
     */
    function executeDeleteFiles(params) {
        try {
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_elimina_archivos_inactivos',
                deploymentId: 'customdeploy_elimina_archivos_inactivos',
                params: {
                    custscript_searchid: params.searchId
                }
            });
            
            return mrTask.submit();
        } catch (e) {
            if (e.name === 'NO_DEPLOYMENTS_AVAILABLE') {
                throw new Error('El proceso está ocupado en este momento. Por favor, intente más tarde o contacte al administrador para verificar el estado de los procesos en ejecución.');
            }
            throw e;
        }
    }

    /**
     * Función principal del Suitelet
     */
    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                const form = createForm();
                context.response.writePage(form);
            } else {
                const process = context.request.parameters.custpage_process;
                const searchId = context.request.parameters.custpage_searchid;
                
                try {
                    const taskId = executeProcess(process, {
                        searchId: searchId
                    });

                    const form = serverWidget.createForm({
                        title: 'Proceso Iniciado'
                    });
                    
                    const messageField = form.addField({
                        id: 'custpage_message',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Mensaje'
                    });

                    // URL del centro de procesos según el ambiente
                    const baseUrl = runtime.envType === 'PRODUCTION' 
                        ? 'https://3367613.app.netsuite.com' 
                        : 'https://3367613-sb1.app.netsuite.com';
                    
                    const processUrl = `${baseUrl}/app/common/scripting/mapreducescriptstatus.nl?datemodi=WITHIN&date=TODAY&showall=F`;
                    
                    messageField.defaultValue = `
                        <p>El proceso se ha iniciado correctamente.</p>
                        <p>Script: Eliminar Fotos Employees Inactivos</p>
                        <p>Deploy: CUSTOMDEPLOY_ELIMINA_ARCHIVOS_INACTIVOS</p>
                        <p>ID del proceso: ${taskId}</p>
                        <p>Para ver el progreso del proceso haga click aquí: <a href='${processUrl}' target="_blank">Ver Progreso</a></p>
                    `;

                    context.response.writePage(form);
                } catch (e) {
                    const errorForm = serverWidget.createForm({
                        title: 'Error al Iniciar Proceso'
                    });
                    
                    const errorField = errorForm.addField({
                        id: 'custpage_error',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Error'
                    });
                    
                    errorField.defaultValue = `
                        <p style="color: red;">Error: ${e.message}</p>
                        <p>Script: Eliminar Fotos Employees Inactivos</p>
                        <p>Deploy: CUSTOMDEPLOY_ELIMINA_ARCHIVOS_INACTIVOS</p>
                        <p>Por favor, intente nuevamente más tarde.</p>
                    `;

                    context.response.writePage(errorForm);
                }
            }
        } catch (e) {
            log.error('Error en MasiveProcessUI', e);
            throw e;
        }
    }

    return {
        onRequest: onRequest
    };
});
