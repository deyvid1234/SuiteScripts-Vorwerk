/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 *@Autor Leopoldo Santiago Rodriguez
 *@Company Netsoft
 *@NModuleScope Public
 *@Name NSO | UE | VOR | DIGITAL CREDIT
 *@Description: Script encargado de cerrar el registro a cualquiera que no sea administrador
 * scriptName: nso_ue_vor_setup_digital.js
 * idScript: customscript_nso_ue_vor_digital_credit
 * idDeploy: customdeploy_nso_ue_vor_digital_credit
 * Fecha: 26/08/2022
 */

define(['N/error', 'N/record', 'N/search', 'N/runtime', 'N/format'], function(error, record, search, runtime, format) {

    let handler = {}, language = '';
    const ID_ADMIN = 3;
    const ERRORES = {
        ERROR_RECORD: {
            name: 'ERROR_RECORD',
            message: {
                en: 'THIS SETUP CANNOT BE CREATED BECAUSE ONE HAS ALREADY BEEN CREATED, VALIDATE IT.',
                es: 'NO SE PUEDE CREAR ESTA CONFIGURACION DEBIDO DEBE SER UNICA, VALIDADO.'
            }
        }
    };

    let searchRecord = (newRecord, context) => {
        var arrayFilters = [["isinactive","is","F"]];
        if (context.type != 'create' && context.type != 'copy') {
            arrayFilters.push('AND');
            arrayFilters.push(["internalid","noneof",newRecord.id]);
        }
        var buscaSetup = search.create({
            type: "customrecord_nso_vor_setup_digital",
            filters:
                [
                    arrayFilters
                ]
        });
        var resultados = buscaSetup.run().getRange({ start : 0, end :1 });
        return resultados.length > 0;
    };

    handler.beforeLoad = (context) => {
        try{
            if (context.type == 'view' || context.type == 'create' || context.type == 'copy' || context.type == 'edit') {
                var role = runtime.getCurrentUser().role;
                if(role != ID_ADMIN){
                    throw error.create({ name: 'INVALID_ROL', message: 'ESTE REGISTRO SOLO ES VISIBLE PARA EL ADMINISTRADOR.' });
                }
            }
        }catch (e) {
            log.error('ERROR_AFTER_SUBMIT', JSON.stringify(e));
            var errorText = 'ERROR CODE: ' + e.name + '\nDESCRIPTION: ' + e.message;
            throw errorText;
        }
    };

    handler.beforeSubmit = (context) => {
        try {
            if (context.type == 'edit' || context.type == 'create' || context.type == 'copy') {
                var newRecord = context.newRecord;
                language      = runtime.getCurrentUser().getPreference({ name: 'LANGUAGE' }).split('_')[0];
                if(searchRecord(newRecord, context)){
                    throw error.create({ name: ERRORES.ERROR_RECORD.name, message: ERRORES.ERROR_RECORD.message[language]});
                }
            }
        }catch (e) {
            log.error('NSO_ERROR_BEFORE_SUBMIT', JSON.stringify(e));
            var errorText = 'ERROR CODE: ' + e.name + '\nDESCRIPTION: ' + e.message;
            throw errorText;
        }
    };

    return handler;

});
