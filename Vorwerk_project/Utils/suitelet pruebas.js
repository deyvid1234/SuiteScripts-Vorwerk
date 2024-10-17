 /**
  * @NApiVersion 2.x
  * @NScriptType Suitelet
  * @NModuleScope SameAccount
  * @author Carl, Zeng
  * @description This's a sample SuiteLet script(SuiteScript 2.0) to export data
  *              to Excel file and directly download it in browser
  */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','N/encode','N/https','N/email','N/record'], 
function(plugin,task, serverWidget, search, runtime,file,encode,https,email,record){
    function onRequest(scriptContext) {
        try{
            log.debug('scriptContext',scriptContext.request.method)
            var cadena = 'Sandra  Juarez Mendez';
            log.debug('cadena',cadena.length)
            var cadenaSinDoblesEspacios = cadena.replace(/\s+/g, ' ');

            log.debug('cadenaSinDoblesEspacios',cadenaSinDoblesEspacios.length); 
            var cadena2 = 'Sandra Maria  Juarez Mendez';
             log.debug('cadena2',cadena2.length)
            var cadenaSinDoblesEspacios2 = cadena2.replace(/\s+/g, ' ');

            log.debug('cadenaSinDoblesEspacios2',cadenaSinDoblesEspacios2.length); 
            
            
        }catch(err){
            log.error("Error onRequest",err)
        }

             
    }
      

        return {
            onRequest : onRequest
        };

});