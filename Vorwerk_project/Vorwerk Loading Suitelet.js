/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/message','N/task','N/ui/serverWidget','N/search','N/runtime'],

function(message,task, serverWidget, search, runtime) {
   
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
    		context.response.write("hola");
    	}
    	if(context.request.method == 'PUT'){
    		
    		try{

    			  //recibe la informacion de la tabla para ejecutar el map y enviar los parametros con la informacion
                  var body = JSON.parse(context.request.body);
                  log.debug('params',body);
                  if(body.type_req == "email"){
                	  var mapTask = task.create({
                          taskType: task.TaskType.MAP_REDUCE,
                          scriptId: 'customscript_vorwerk_email_massive_map',
                          params: {
                        	  custscript_register_info: JSON.stringify(body.obj),
                          }
                    }).submit(); 
                  }
                  if(body.type_req == "payrollProcess"){
                      log.debug('im on','ok');
                    var mapTask = task.create({
                          taskType: task.TaskType.MAP_REDUCE,
                          scriptId: 'customscript_vw_payroll_map',
                          params: {
                            custscript_vw_register_info: JSON.stringify(body.obj),
                          }
                    }).submit();
                  }
                  if(body.type_req == "massivepdf"){
                      log.debug('massivepdf');
                    var mapTask = task.create({
                          taskType: task.TaskType.MAP_REDUCE,
                          scriptId: 'customscript_vorwerk_pdf_mapreducescript',
                          params: {
                            custscript_register_info_pdf: JSON.stringify(body.obj),
                          }
                    }).submit();
                  }
                  
              }catch(err){
                log.debug("error task email loading",err);
              }
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
