/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email','N/record','N/render', 'N/file','N/search', 'N/https', 'N/runtime','N/format','./Vorwerk Dictionary Script.js','./Vorwerk Send Reporte Suitelet.js','./Utils/awsS3SigV4_v2.js'],

function(email,record,render, file, search, https, runtime,format,Dictionary,EmailLib,S3) {
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
        var comissionInfo = scriptObj.getParameter({name: 'custscript_register_info'});//informacion de la tabla
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
            var type_rec= parseInt(registeInfo.level,10);
            switch(type_rec){
                case 1://presentadora
                    type_to_add = "customrecord_comisiones_presentadora";
                    replace_string = 'pre';
                break;
                case 2:
                    type_to_add = "customrecord_compensaciones_gtm";
                    replace_string = 'gtm';
                break;
                case 3://JDG
                    type_to_add = "customrecord_compensaciones_jdg";
                    replace_string = 'jdg';
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
            var email_emp = EmailLib.getEmployee(idEmp);
            //var objReport = EmailLib.getpdf(idEmp,registeInfo.comision_id,objRecord.id,email_emp)
//Parche
            var registeInfo = JSON.parse(context.value);
            var type_rec= parseInt(registeInfo.level,10);
            var idReg= parseInt(registeInfo.idReg,10);
            var period = parseInt(registeInfo.comision_id,10);
            var periodText = registeInfo.periodText;
            var levelText = registeInfo.levelText;
           
            //log.debug('text',periodText+'  '+levelText)
            //log.debug('info','type_rec :'+type_rec+' idReg :'+idReg+' period :'+period)
            var idemp = search.lookupFields({
                type: config_fields.customrecord[type_rec],
                id: idReg,
                columns: [config_fields.empleado[type_rec]]
            });
            var employee = search.lookupFields({
                type: 'employee',
                id: idemp[config_fields.empleado[type_rec]][0]['value'],
                columns: ['firstName','lastName']
            });
            var print_url_base = '';
            if(runtime.envType != 'PRODUCTION'){ 
                print_url_base = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1408&deploy=1&compid=3367613_SB1&ns-at=AAEJ7tMQ47oZy3qaVJ6UweMCUUN77CxHoN8ETeA5PLMH1Tsv0s4';
            }else{
                print_url_base = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1408&deploy=1&compid=3367613&ns-at=AAEJ7tMQyq7jwkS4stiuYtzuLkRmJPspJNtkQcWSrkNFaJUOmXM';
            }
            var url = print_url_base+'&employee='+idemp[config_fields.empleado[type_rec]][0]['value']+'&periodo='+period+'&comp='+idReg+'&level='+type_rec+'&massive=true';
            var headers = {'Content-Type': 'application/json'};
            var response = https.get({
                url: url,
                headers: headers
            }).body;
            log.debug('response',response)
            var objReport = file.load({
                id: response
            });
            /*var my_file = file.create({
                name: email_emp.name+'.pdf',
                fileType: file.Type.PDF,
                contents: response,
                folder: 1798
            });
            var objReport = my_file*/
//Fin parche
//            var pdfObj = file.load({
//                id: pdf
//            });
//            var xmlObj = file.load({
//                id: xml
//            });
            var files = [objReport]
            EmailLib.sendEmail(email_emp,files,registeInfo.idReg,type_to_add);

            // Subida a S3 SOLO en el envío inicial (este Map/Reduce).
            // No se envía CFDI aquí; únicamente el PDF del reporte de compensaciones.
            try{
                var scriptObj = runtime.getCurrentScript();
                // En este Map/Reduce los parámetros NO llevan sufijo "2".
                // (El sufijo "2" solo aplica al Suitelet de validación en tu cuenta.)
                var s3Enabled = scriptObj.getParameter({ name: 'custscript_vw_s3_enabled' });
                if (s3Enabled === true || s3Enabled === 'T' || s3Enabled === 'true') {
                    var bucket = scriptObj.getParameter({ name: 'custscript_vw_s3_bucket' });
                    var region = scriptObj.getParameter({ name: 'custscript_vw_s3_region' });
                    var accessKeyId = scriptObj.getParameter({ name: 'custscript_vw_s3_access_key' });
                    var secretAccessKey = scriptObj.getParameter({ name: 'custscript_vw_s3_secret_key' });
                    var prefix = scriptObj.getParameter({ name: 'custscript_vw_s3_prefix' }) || 'compensaciones';

                    var safePeriod = (periodText || String(period || '')).replace(/[^\w\-./]/g,'_');
                    var safeLevel = (levelText || String(type_rec || '')).replace(/[^\w\-./]/g,'_');
                    var empIdVal = idemp && idemp[config_fields.empleado[type_rec]] && idemp[config_fields.empleado[type_rec]][0] ? idemp[config_fields.empleado[type_rec]][0]['value'] : '';

                    var objectKey = [
                        prefix,
                        safePeriod,
                        safeLevel,
                        'emp_' + empIdVal,
                        'reg_' + idReg + '.pdf'
                    ].join('/');

                    S3.putObject({
                        bucket: bucket,
                        region: region,
                        accessKeyId: accessKeyId,
                        secretAccessKey: secretAccessKey,
                        objectKey: objectKey,
                        contentType: 'application/pdf',
                        body: objReport.getContents()
                    });
                }
            }catch(s3Err){
                log.error('Error upload S3 compensaciones', s3Err);
            }
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
