/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email','N/record','N/render', 'N/file','N/search', 'N/https', 'N/runtime','N/format','./Vorwerk Dictionary Script.js','./Vorwerk Send Reporte Suitelet.js'],

function(email,record,render, file, search, https, runtime,format,Dictionary,EmailLib) {
    var config_fields = Dictionary.getDictionayFields();
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        var scriptObj = runtime.getCurrentScript();
        var comissionInfo = scriptObj.getParameter({name: 'custscript_reg_information'});//informacion de la tabla
        log.debug('comissionInfo',comissionInfo);
        return JSON.parse(comissionInfo);
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        try{
            log.debug('context map',context);
            var registeInfo = JSON.parse(context.value);
            log.debug('registeInfo',registeInfo);
            var type_rec= parseInt(registeInfo.level);
            switch(type_rec){
                case 1://presentadora
                    type_to_add = "customrecord_comisiones_presentadora";
                    replace_string = 'pre';
                    campoRegistro = 'custrecord_registro_pdf_pre';
                break;
                case 2:
                    type_to_add = "customrecord_compensaciones_gtm";
                    replace_string = 'gtm';
                    campoRegistro = 'custrecord_registro_pdf_gtm';
                break;
                case 3://JDG
                    type_to_add = "customrecord_compensaciones_jdg";
                    replace_string = 'jdg';
                    campoRegistro = 'custrecord_registro_pdf';
                break;
            }
            var objRecord = record.load({
                type: type_to_add,
                id: registeInfo.idReg,
                isDynamic: false,
            });
            log.debug('config_fields',config_fields);
            var idEmp = objRecord.getValue(config_fields.emleado[type_rec]);
            var xml = objRecord.getValue(config_fields.xml[type_rec]);
            var pdf = objRecord.getValue(config_fields.pdf[type_rec]);
            var registroCompPdf = objRecord.getValue(campoRegistro);
            var email_emp = EmailLib.getEmployee(idEmp);
            var pdfObj = file.load({
                id: pdf
            });
            var xmlObj = file.load({
                id: xml
            });
            var registroCompPdfObj = file.load({
                id: registroCompPdf
            });
            var files = [pdfObj,xmlObj,registroCompPdfObj]
            EmailLib.sendEmailCfdi(email_emp,files,registeInfo.idReg,type_to_add);
        }catch(err){
            log.error("Error map",err);
        }
        
        
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.debug('context summary',summary);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
