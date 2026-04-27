/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email','N/record','N/render', 'N/file','N/search', 'N/https', 'N/runtime','N/format','./Vorwerk Dictionary Script.js','./Vorwerk Send Reporte Suitelet.js','./Utils/awsS3SigV4_v2.js'],

    function(email,record,render, file, search, https, runtime,format,Dictionary,EmailLib,S3) {
        var config_fields = Dictionary.getDictionayFields();
    
        function safeNamePart(v){
            return String(v || '')
                .trim()
                .replace(/[^\w\-]+/g,'_')
                .replace(/^_+/,'')
                .replace(/_+$/,'')
                .substring(0, 60);
        }
        function pad2(n){
            n = parseInt(n,10);
            if(isNaN(n)) return '00';
            return (n < 10 ? '0' : '') + String(n);
        }
        function parsePeriodText(periodText){
            // esperado: "MM/YYYY" (por ejemplo "04/2026")
            try{
                var t = String(periodText || '').trim();
                var m = /(\d{1,2})\s*\/\s*(\d{4})/.exec(t);
                if(m){
                    return { month: parseInt(m[1],10), year: parseInt(m[2],10) };
                }
            }catch(e){}
            return null;
        }
    
        /** Decodificación Base64 manual (respaldo si no hay fromBase64). */
        function base64ToBinaryString(b64) {
            var clean = String(b64).replace(/\s/g, '');
            while (clean.length % 4 !== 0) clean += '=';
            if (typeof atob === 'function') {
                return atob(clean);
            }
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var tbl = {};
            for (var t = 0; t < 64; t++) tbl[chars.charAt(t)] = t;
            var out = '';
            var buf = 0;
            var bits = 0;
            for (var i = 0; i < clean.length; i++) {
                var c = clean.charAt(i);
                if (c === '=') break;
                var v = tbl[c];
                if (v === undefined) continue;
                buf = (buf << 6) | v;
                bits += 6;
                if (bits >= 8) {
                    bits -= 8;
                    out += String.fromCharCode((buf >>> bits) & 0xff);
                }
            }
            return out;
        }
    
        /**
         * `file.getContents()` devuelve Base64 para PDF. El `https.put` con string UTF-8 corrompe el binario (páginas en blanco).
         * SuiteScript 2.1: Uint8Array en el body envía bytes crudos (véase ayuda N/https binario).
         */
        function pdfUint8FromFileContents(contentsB64) {
            var clean = String(contentsB64 || '').replace(/\s/g, '');
            if (!clean.length) return null;
            try {
                var bin = base64ToBinaryString(clean);
                var u8 = new Uint8Array(bin.length);
                for (var i = 0; i < bin.length; i++) {
                    u8[i] = bin.charCodeAt(i) & 0xff;
                }
                return u8;
            } catch (e1) {
                log.error('pdfUint8FromFileContents', e1);
                return null;
            }
        }

    // Para el flujo "Imprimir" (PDF binario en el body HTTP).
    function pdfUint8FromHttpBody(body) {
        if (body === null || body === undefined) return null;
        var s = String(body).replace(/^\uFEFF/, '');
        // Si ya viene binario (%PDF...) lo convertimos directo a bytes.
        if (s.length >= 4 && s.substring(0, 4) === '%PDF') {
            var u8 = new Uint8Array(s.length);
            for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i) & 0xff;
            return u8;
        }
        // Si por alguna razón vino Base64, reutilizamos el mismo decoder.
        return pdfUint8FromFileContents(s);
    }
       
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
                    columns: ['firstName','lastName','entityid']
                });
                var print_url_base = '';
                if(runtime.envType != 'PRODUCTION'){ 
                    print_url_base = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1408&deploy=1&compid=3367613_SB1&ns-at=AAEJ7tMQ47oZy3qaVJ6UweMCUUN77CxHoN8ETeA5PLMH1Tsv0s4';
                }else{
                    print_url_base = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1408&deploy=1&compid=3367613&ns-at=AAEJ7tMQyq7jwkS4stiuYtzuLkRmJPspJNtkQcWSrkNFaJUOmXM';
                }
                var mrScriptObj = runtime.getCurrentScript();
                var awsOnly = mrScriptObj.getParameter({ name: 'custscript_vw_aws_only' });
                var shouldSendEmail = !(awsOnly === true || awsOnly === 'T' || awsOnly === 'true');
                // Preferimos el proceso embebido en cada registro (lo setea el Loader).
                var forcedProcess = registeInfo && registeInfo.notifyProcess ? String(registeInfo.notifyProcess) : '';
                if (!forcedProcess) {
                    // Fallback (si existiera en deployment)
                    forcedProcess = mrScriptObj.getParameter({ name: 'custscript_vw_notify_process' });
                    forcedProcess = forcedProcess ? String(forcedProcess) : '';
                }
                var process = forcedProcess ? forcedProcess : (shouldSendEmail ? 'add' : 'update');

                var headers = {'Content-Type': 'application/json'};
                var objReport = null;
                var files = [];

                // Temporal: awsResend usa el PDF "en vivo" (mismo flujo que Imprimir)
                // y el Process debe ser "add".
                var useLivePdfForAws = (!shouldSendEmail && process === 'add');

                // Para "remove" no generamos/cargamos PDF, solo notificamos.
                if (process !== 'remove' && !useLivePdfForAws) {
                    // Flujo original: `massive=true` guarda en FileCabinet y regresa el internal id del archivo PDF.
                    var url = print_url_base+'&employee='+idemp[config_fields.empleado[type_rec]][0]['value']+'&periodo='+period+'&comp='+idReg+'&level='+type_rec+'&massive=true';
                    var response = https.get({
                        url: url,
                        headers: headers
                    }).body;
                    log.debug('response',response)
                    objReport = file.load({
                        id: response
                    });
                    files = [objReport];
                }
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
                // Envío de email solo cuando NO sea reenvío AWS-only
                if (process !== 'remove' && shouldSendEmail) {
                    EmailLib.sendEmail(email_emp,files,registeInfo.idReg,type_to_add);
                } else if (process !== 'remove') {
                    log.debug('AWS-only: se omite envío de email', { idReg: registeInfo.idReg, level: registeInfo.level });
                }
    
                // Subida a S3 SOLO cuando process != remove.
                // En remove: NO se envía nada a AWS, solo se notifica al endpoint con Process=remove.
                try{
                    var scriptObj = runtime.getCurrentScript();
                    // En este Map/Reduce los parámetros NO llevan sufijo "2".
                    // (El sufijo "2" solo aplica al Suitelet de validación en tu cuenta.)
                    var s3Enabled = scriptObj.getParameter({ name: 'custscript_vw_s3_enabled' });
                    if (s3Enabled === true || s3Enabled === 'T' || s3Enabled === 'true') {
                        var bucket = scriptObj.getParameter({ name: 'custscript_vw_s3_bucket' });
                        var region = scriptObj.getParameter({ name: 'custscript_vw_s3_region' }) || 'us-east-2';
                        var accessKeyId = scriptObj.getParameter({ name: 'custscript_vw_s3_access_key' });
                        var secretAccessKey = scriptObj.getParameter({ name: 'custscript_vw_s3_secret_key' });
                        // IDU: preferimos employee.entityid; fallback a "getText" del campo empleado (tomando antes del primer espacio)
                        var empIdVal = '';
                        try{
                            empIdVal = employee && employee.entityid ? String(employee.entityid).trim() : '';
                        }catch(e){}
                        if(!empIdVal){
                            try{
                                var empText = objRecord.getText(config_fields.emleado[type_rec]) || '';
                                empText = String(empText).trim();
                                empIdVal = empText ? empText.split(' ')[0] : '';
                            }catch(e2){}
                        }
                        if(!empIdVal){
                            // último recurso: internal id del empleado
                            empIdVal = idemp && idemp[config_fields.empleado[type_rec]] && idemp[config_fields.empleado[type_rec]][0] ? String(idemp[config_fields.empleado[type_rec]][0]['value']) : '';
                        }
    
                        // Nombre requerido por receptor:
                        // Reporte_{ID_REPORTE}_{IDU}_{NOMBRES}_{APELLIDOS}_{AÑO}_{MES}_.pdf
                        var p = parsePeriodText(periodText) || { month: null, year: null };
                        var year = p.year || (new Date()).getFullYear();
                        var month = p.month || ((new Date()).getMonth() + 1);
    
                        var firstName = employee && employee.firstName ? employee.firstName : '';
                        var lastName = employee && employee.lastName ? employee.lastName : '';
                        var objectKey =
                            'Reporte' + '_' +
                            String(idReg) + '_' +
                            safeNamePart(empIdVal) + '_' +
                            safeNamePart(firstName) + '_' +
                            safeNamePart(lastName) + '_' +
                            String(year) + '_' +
                            pad2(month) + '_' +
                            '.pdf';
    
                        if (process !== 'remove') {
                            var pdfU8 = null;
                            if (useLivePdfForAws) {
                                // Flujo "Imprimir" (PDF al momento) pero usando URL EXTERNA (extforms).
                                // La URL interna app.netsuite.com requiere sesión y desde MR puede regresar login/HTML.
                                var urlPrintNow = print_url_base
                                    + '&employee=' + idemp[config_fields.empleado[type_rec]][0]['value']
                                    + '&periodo=' + period
                                    + '&comp=' + idReg
                                    + '&level=' + type_rec;
                                var pdfBodyNow = https.get({ url: urlPrintNow, headers: headers }).body;
                                pdfU8 = pdfUint8FromHttpBody(pdfBodyNow);
                                log.debug('AWS resend (live PDF) url', urlPrintNow);
                            } else {
                                // Mismo PDF que el email: File Cabinet (`massive=true` → file id → load).
                                pdfU8 = pdfUint8FromFileContents(objReport.getContents());
                            }
                            if (!pdfU8 || pdfU8.length < 5 || pdfU8[0] !== 0x25 || pdfU8[1] !== 0x50 || pdfU8[2] !== 0x44 || pdfU8[3] !== 0x46) {
                                log.error('S3 PDF inválido (cabecera distinta de %PDF)', {
                                    len: pdfU8 ? pdfU8.length : 0,
                                    head: (useLivePdfForAws && pdfBodyNow) ? String(pdfBodyNow).substring(0, 200) : ''
                                });
                            } else {
                                var s3Resp = S3.putObject({
                                    bucket: bucket,
                                    region: region,
                                    accessKeyId: accessKeyId,
                                    secretAccessKey: secretAccessKey,
                                    objectKey: objectKey,
                                    contentType: 'application/pdf',
                                    bodyUint8Array: pdfU8
                                });
                                try {
                                    var sc = s3Resp && s3Resp.code;
                                    if (sc && sc !== 200 && sc !== 204) {
                                        log.error('S3 putObject respuesta inesperada', {
                                            code: sc,
                                            body: s3Resp.body ? String(s3Resp.body).substring(0, 800) : ''
                                        });
                                    }
                                } catch (checkErr) { /* ignore */ }
                            }
                        } else {
                            log.debug('Remove: se omite upload a S3', { idReg: idReg, objectKey: objectKey });
                        }
    
                        // (Opcional) Notificación JSON a endpoint externo (endpoint por definir).
                        // Se omite si no hay endpoint configurado.
                        try{
                            var notifyEnabled = scriptObj.getParameter({ name: 'custscript_vw_s3_notify_enable' });
                            var endpoint = scriptObj.getParameter({ name: 'custscript_vw_s3_notify_endpoint' });
                        log.debug('S3 notify config', {
                            notifyEnabled: notifyEnabled,
                            endpoint: endpoint,
                            envType: String(runtime.envType || '')
                        });
                            if ((notifyEnabled === true || notifyEnabled === 'T' || notifyEnabled === 'true') && endpoint) {
                                
                                var token = scriptObj.getParameter({ name: 'custscript_vw_s3_notify_token' });
                                var filePathUri = 's3://' + bucket + '/' + objectKey;
                                var payload = (process === 'remove')
                                    ? {
                                        Process: 'remove',
                                        InternalID: String(idReg),
                                        FilePath: filePathUri
                                      }
                                    : {
                                        Process: process,
                                        IDU: String(empIdVal),
                                        Year: String(year),
                                        Month: String(month),
                                        InternalID: String(idReg),
                                        FilePath: filePathUri
                                      };
                                log.debug('S3 notify payload (preview)', payload);
                                var reqHeaders = { 'Content-Type': 'application/json' };
                                if (token) reqHeaders.Authorization = token;
                                var notifyRes = https.post({ 
                                    url: endpoint,
                                    headers: reqHeaders,
                                    body: JSON.stringify(payload)
                                });
                                try{
                                    log.debug('S3 notify response', {
                                        code: notifyRes && notifyRes.code,
                                        body: notifyRes && notifyRes.body ? String(notifyRes.body).substring(0, 4000) : ''
                                    });
                                }catch(respLogErr){}
                            } else {
                                // Vista previa del JSON aunque todavía no se envíe
                                
                                var filePathUriPrev = 's3://' + bucket + '/' + objectKey;
                                var payloadPreview = (process === 'remove')
                                    ? {
                                        Process: 'remove',
                                        InternalID: String(idReg),
                                        FilePath: filePathUriPrev
                                      }
                                    : {
                                        Process: process,
                                        IDU: String(empIdVal),
                                        Year: String(year),
                                        Month: String(month),
                                        InternalID: String(idReg),
                                        FilePath: filePathUriPrev
                                      };
                                log.debug('S3 notify payload (preview, not sent)', payloadPreview);
                            }
                        }catch(notifyErr){
                            log.error('Error notificación JSON S3', notifyErr);
                        }
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
    