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

 define(['N/ui/serverWidget', 'N/runtime', 'N/redirect','N/task'],  function (uiserver, runtime, redirect, task){

     function onRequest(context){

         if(context.request.method == 'GET'){
             var form = uiserver.createForm({ title: 'Actualización de Compensaciones en Ordenes de Venta' });
             form.addField({ id: 'custpage_periodo', type: uiserver.FieldType.SELECT, label: 'Periodo', source: 'customrecord_periods'}).isMandatory = true;
             form.addSubmitButton({ label: 'Actualizar Compensaciones' });
             context.response.writePage(form);
         } else if ( context.request.method == 'POST' ) {

             var periodo = context.request.parameters.custpage_periodo;

             task.create({ 
            	 taskType: task.TaskType.SCHEDULED_SCRIPT,
            	 scriptId: 'customscript_ss_actualiza_compensaciones',
                 deploymentId: 'customdeploy_ss_actualiza_compensaciones',
                 params: {
                	 custscript_ss_periodo: periodo
                 }
             }).submit();

             redirect.toTaskLink({id: 'ADMI_IMPORTCSV_LOG'});
         }
     }

     return{
         onRequest:onRequest
     }
 });
