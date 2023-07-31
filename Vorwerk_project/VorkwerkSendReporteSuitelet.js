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
        var period = request.parameters.periodo;
        var internalid = request.parameters.compId;
        var employee = '';
//        	getEmployee(idEmployee);
        log.debug("employee",employee);
        var pdf = getpdf(idEmployee,period,internalid);
        var response=sendEmail(employee,pdf);
    	}else {
            var request = context.request;
            var empleyee = request.parameters.custpage_employee;
        }
    	
    }
    function getEmployee(idEmployee){
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
        		name : r.getValue('firstName')+r.getValue('lastName')
        	}
            return true;
         });
    	return employee;
    	
    }
    function getpdf(idEmployee,period,internalid){
    	log.debug("getpdf","entre");
    	var print_url_base = '';
    	if(runtime.envType != 'PRODUCTION'){ 
    		print_url_base = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=563&deploy=1&compid=3367613_SB1&h=eec41052238dc4ded118';
    	}else{
    		print_url_base = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=563&deploy=1&compid=3367613_SB1&h=eec41052238dc4ded118';
		}
    	var url = print_url_base+'&employee='+idEmployee+'&periodo='+period+'&compId='+internalid;
    	log.debug("getpdf-url",url);
        var headers = {'Content-Type': 'application/json'};
        var response = https.get({
            url: url,
            headers: headers
        }).body;
        
        var my_file = file.create({
            name: 'pdf_test.pdf',
            fileType: file.Type.PDF,
            contents: response,
            folder: 1798
        });
        log.debug("response",response);
        return my_file;
    }
    function sendEmail(employee,file){
    	try{
    		log.debug("email send to",employee);
    		email.send({
        		author: runtime.getCurrentUser().id,
        		recipients: 'mariana.ruiz.es@gmail.com',
        		subject: 'Test',
        		body: 'hola que hace',
        		attachments: [file]
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
