/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/task'],

function(serverWidget,task) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	if (context.request.method === 'GET') {

            // Section One - Forms - See 'Steps for Creating a Custom Form' in topic 'Sample Custom Form Script'
            var form = serverWidget.createForm({
                title: 'Customer Information'
            });
            form.clientScriptFileId = 1508177;


            var usergroup = form.addFieldGroup({
                id: 'usergroup',
                label: 'User Information'
            });
            usergroup.isSingleColumn = true;


            var select = form.addField({
                id: 'periodo',
                type: serverWidget.FieldType.SELECT,
                label: 'Title',
                container: 'usergroup',
                source: 'customrecord_periods'

            });
            var select = form.addField({
                id: 'borrar',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Borrar estructura',
                container: 'usergroup',
                

            });
            
            form.addSubmitButton({
                label: 'Submit'
            });

           

           

            context.response.writePage(form);
        } 
    	if(context.request.method === 'POST') {
    		var cust_period =context.request.parameters.periodo
    		var borrar = context.request.parameters.borrar
    		log.debug('prueba',cust_period)
    		var mapTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_vw_estruct_presentadora_map',
                params: {
                	custscript_estructu_presentadora:cust_period,
                	custscript_borrar_estructura:borrar
              	  
                }
          }).submit();
    		
      	  log.debug("dispare schedule",":S");

           
        }
    }
    

    return {
        onRequest: onRequest
    };
    
});
