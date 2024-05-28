/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/log','N/email','N/record','N/file','N/https','N/search','N/runtime','N/file'],

function(log,email,record,file,https,search,runtime,file) {
   
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
        var request = context.request;
        log.debug("LogUser",request);
        var idEmployee = request.parameters.employee;
        log.debug("LogUser",idEmployee);
        var period = request.parameters.period;
        var internalid = request.parameters.comp;
        var employee = getEmployee(idEmployee);
        log.debug("employee",employee);
        var pdf = getpdf(idEmployee,period,internalid,employee);
        var response=sendEmail(employee,pdf);
        }else {
            window.open('','_self').close();
        }
        
    }
    function getEmployee(idEmployee){
        try{
            var employee = '';
            var busqueda = search.create({
                type: 'employee',
                columns: ['email','firstName','lastName'],
                filters: [{
                    name: 'internalid',
                    operator: 'anyof',
                    values: idEmployee
                }]
            })
             busqueda.run().each(function(r){
                employee ={
                    email : r.getValue('email'),    
                    name : r.getValue('firstName')+' '+r.getValue('lastName')
                }
                return true;
             });
            return employee;
        }catch(err){
            log.error("Error getEmployee",err)
        }
        
    }
    function getpdf(idEmployee,period,internalid,employee,type_rec){
        try{
            log.debug("getpdf","entre");
            var print_url_base = '';
            if(runtime.envType != 'PRODUCTION'){ 
                print_url_base = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1&compid=3367613_SB1&h=1c36c032d85c608d8db4';
            }else{
                print_url_base = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1408&deploy=1&compid=3367613&h=d48ce6f5d7c69a79c66c';
            }
            var url = print_url_base+'&employee='+idEmployee+'&periodo='+period+'&comp='+internalid+'&level='+type_rec;;
            log.debug("getpdf-url",url);
            var headers = {'Content-Type': 'application/json'};
            var response = https.get({
                url: url,
                headers: headers
            }).body;
            
            var my_file = file.create({
                name: employee.name+'.pdf',
                fileType: file.Type.PDF,
                contents: response,
                folder: 1798
            });
            log.debug("response",response);
            return my_file;
        }catch(err){
            log.error("Err getpdf",err);
        }
        
    }
    function sendEmail(employee,file,recordId,recordTypeId){
        try{
            log.debug("email send to",employee);
            email.send({
                author: runtime.getCurrentUser().id,
                recipients: employee.email,
                subject: 'Reporte de Compensación',
                body: 'Peporte de Compensación : '+employee.name,
                attachments: file,
                relatedRecords: {
                     customRecord:{
                           id:recordId,
                           recordType: recordTypeId //an integer value
                      }
               }
            });
        }catch(err){
            log.error("error send email",err);
        }
        
    }
    return {
        onRequest: onRequest,
        getpdf:getpdf,
        sendEmail:sendEmail,
        getEmployee:getEmployee
    };
    
});
