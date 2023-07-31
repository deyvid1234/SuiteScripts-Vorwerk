/*
- File name: nso_vorw_salesorder_massupdate_s.js
- Name: NSO VW | SalesOrder MassUpdate S
- Description: Displays a window to select apropiate filters in order to update sales order records
- Author: Cesar Hernandez
- Language: Javascript
- July/26/2017
*/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

 define(['N/record', 'N/ui/serverWidget', 'N/runtime', 'N/search', 'N/redirect', 'N/format', 'N/task'],
     function (record, uiserver, runtime, search, redirect, format, task){

     var STATUS_QUEUED     = 1;
     var STATUS_PROCESSING = 2;
     var STATUS_FINISHED   = 3;

     function onRequest(context){

         if(context.request.method == 'GET'){
             var form = uiserver.createForm({ title: 'Actuaización Masiva de Vendedora en Ordenes de Venta' }),
                 divData = form.addFieldGroup({ id:'parameters', label: 'Parametros' });

             var fldText       = form.addField({ id: 'custpage_indication', type: uiserver.FieldType.TEXT, label: ' ', container:'parameters' }),
                 fldRecordType = form.addField({ id: 'custpage_recordtype', type: uiserver.FieldType.SELECT, label: 'Tipo de Compensación', container:'parameters' }),
                 fldAfterDate  = form.addField({ id: 'custpage_startdate',   type: uiserver.FieldType.DATE,   label: 'Desde la Fecha', container:'parameters' }),
                 fldBeforeDate = form.addField({ id: 'custpage_enddate',     type: uiserver.FieldType.DATE,   label: 'Hasta la Fecha', container:'parameters' });

             fldText.updateDisplayType({ displayType : uiserver.FieldDisplayType.INLINE });
             fldText.updateLayoutType({ layoutType : uiserver.FieldLayoutType.OUTSIDE });
             fldText.defaultValue = '<br>' + 'Ingrese el rango de Fechas de Venta y la jerarquia';

             fldRecordType.isMandatory = true;
             fldAfterDate.isMandatory = true;
             fldBeforeDate.isMandatory = true;

             fldRecordType.addSelectOption({value: 'customrecord_comisiones_gtm', text: 'Gánate TM' });
             fldRecordType.addSelectOption({value: 'customrecord_comisiones_jdg', text: 'Jefa de Grupo' });
             fldRecordType.addSelectOption({value: 'customrecord_comisiones_pre', text: 'Presentadora' });

             form.addSubmitButton({ label: 'Actualizar Ordenes' });

             context.response.writePage(form);
         }
         else if ( context.request.method == 'POST' ) {

             try{
                 log.debug('POST Parameters', JSON.stringify(context.request.parameters));
                 var recordTypeReq = context.request.parameters.custpage_recordtype,
                     startdate  = context.request.parameters.custpage_startdate,
                     enddate    = context.request.parameters.custpage_enddate;
                 var recordTypeReqText = context.request.parameters.inpt_custpage_recordtype;

                 startdateReq = format.parse({value: startdate, type: format.Type.DATE});
                 enddateReq = format.parse({value: enddate, type: format.Type.DATE});
                 var startDay = startdateReq.getDate();
                 var startMonth = startdateReq.getMonth();
                 var startYear = startdateReq.getFullYear();
                 log.debug('startdateReq', 'startDay: ' + startDay + ' - startMonth: ' + startMonth + ' - startYear: ' + startYear);
                 var endDay = enddateReq.getDate();
                 var endMonth = enddateReq.getMonth();
                 var endYear = enddateReq.getFullYear();
                 log.debug('enddateReq', 'endDay: ' + endDay + ' - endMonth: ' + endMonth + ' - endYear: ' + endYear);

                 //---> Create Record to Process
                 var recMassiveProcess = record.create({ type:'customrecord_nso_vorw_so_massupdate' });

                 recMassiveProcess.setValue({ fieldId: 'custrecord_mu_recordtype', value: recordTypeReqText });
                 recMassiveProcess.setValue({ fieldId: 'custrecord_mu_udates', value: 0 });
                 recMassiveProcess.setValue({ fieldId: 'custrecord_mu_startdate', value: startdateReq });
                 recMassiveProcess.setValue({ fieldId: 'custrecord_mu_enddate', value: enddateReq });
                 recMassiveProcess.setValue({ fieldId: 'custrecord_mu_status', value: 'EN PROCESO' });

                 var idRecMassive = recMassiveProcess.save();

                 //Creating Map Reduce TaskType
                 objParams = {
                               custscript_nso_vorw_mu_recordtype: recordTypeReq,
                               custscript_nso_vorw_mu_massiveid: idRecMassive,
                               custscript_nso_vorw_mu_startdate: startdate,
                               custscript_nso_vorw_mu_enddate: enddate
                             };

                 var taskMassiveProcess = task.create({ taskType: task.TaskType.MAP_REDUCE }),
                     idScriptMapReduce  = 'customscript_nso_vorw_so_massupdate_m',
                     idDeplyMapReduce   = 'customdeploy_nso_vorw_so_massupdate_m',
                     idTaskMassiveProcess;

                 taskMassiveProcess.scriptId = idScriptMapReduce;
                 taskMassiveProcess.params   = objParams;
                 idTaskMassiveProcess        = taskMassiveProcess.submit();

                 redirect.toRecord({
                   id: idRecMassive,
                   type: 'customrecord_nso_vorw_so_massupdate'
                 });

             }
             catch(ex){
                 log.debug('Error en la creacion del proceso masivo:', ex.message);
             }
         }
     }

     return{
         onRequest:onRequest
     }
 });
