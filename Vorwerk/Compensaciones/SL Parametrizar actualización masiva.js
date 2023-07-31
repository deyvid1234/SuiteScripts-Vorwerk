/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/serverWidget', 'N/runtime', 'N/redirect', 'N/task'], 
		
function (record, sw, runtime, redirect, task){

     function onRequest(context){

         if(context.request.method == 'GET'){
             var form = sw.createForm({ title: 'Actuaización Masiva de Registro Acumulados de Compensación' });

             var fTipoComp = form.addField({ id: 'custpage_recordtype', type: sw.FieldType.SELECT, label: 'Tipo de Compensación'});
             var fPeriodo  = form.addField({ id: 'custpage_period0',   type: sw.FieldType.TEXT,   label: 'Periodo'});

             fTipoComp.isMandatory = true;
             fPeriodo.isMandatory = true;

             fTipoComp.addSelectOption({value: 'customrecord_comisiones_gtm', text: 'Gánate TM' });
             fTipoComp.addSelectOption({value: 'customrecord_comisiones_jdg', text: 'Jefa de Grupo' });
             fTipoComp.addSelectOption({value: 'customrecord_comisiones_pre', text: 'Presentadora' });
             fTipoComp.addSelectOption({value: 'customrecord_comisiones_rec', text: 'Reclutadora' });

             form.addSubmitButton({ label: 'Actualizar' });
             context.response.writePage(form);
         } else if ( context.request.method == 'POST' ) {
             var recordType = context.request.parameters.custpage_recordtype;
             var periodo  = context.request.parameters.custpage_period0;

             task.create({ 
            	 taskType: task.TaskType.MAP_REDUCE,
            	 scriptId: 'customscript_actualizar_acumuladores',
                 deploymentId: 'customdeploy_actualizar_acumuladores',
                 params: {
            		 custscript_tipo: recordType,
            		 custscript_periodo: periodo
                 }
             }).submit();

             redirect.toTaskLink({id: 'LIST_MAPREDUCESCRIPTSTATUS'});
         }
     }

     return{
         onRequest:onRequest
     }
 });