/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/http','N/https','N/encode','N/runtime','N/ui/serverWidget', 'N/error'],

function(record,search,http,https,encode,runtime,serverWidget,error) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
        try{
            
          
           
        }catch(err){
            log.error('errorbeforeload',err);
        }
        
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
       

            var newRec = scriptContext.newRecord;
            var oldRec = scriptContext.oldRecord;
            var contextType = scriptContext.type;

           
            if (contextType == 'create' && runtime.executionContext == 'USERINTERFACE') { 
                var email = newRec.getValue('email');
                //log.debug('email',email)

                var mySearch = search.load({
                id: 'customsearch_customer_search_email'
                });

                mySearch.filters.push(search.createFilter({
                   name: 'email',
                   operator: 'is',
                   values: email
                }));
                var searchEmail = false
                mySearch.run().each(function(r) {
                    searchEmail = r.getValue('email')
                    //log.debug('searchEmail',searchEmail)    
                });

                if(searchEmail){
                    var err = error.create({
                        name: '<b>ERROR CORREO DUPLICADO</b>',
                        message: 'NO ES POSIBLE GUARDAR EL REGISTRO, YA EXISTE UN USUARIO CON EL MISMO EMAIL.'
                    });
                    
                    throw err.name + ' : ' + err.message;
                }else{
                    //log.debug('puedes guardar el registro')
                }
            }
        

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        try{
            var newRecord = scriptContext.newRecord;
            var oldrecord = scriptContext.oldRecord;
            log.debug('scriptContext.type',scriptContext.type)

            if(scriptContext.type == 'edit' && runtime.executionContext == 'USERINTERFACE' ){ 
                var newSalesRep = newRecord.getValue('salesrep')
                var newPreRef = newRecord.getValue('custentity_presentadora_referido')
                var newIDUPreRef = newRecord.getValue('custentityidu_presentador')

                var oldSalesRep = oldrecord.getValue('salesrep')
                var oldPreRef = oldrecord.getValue('custentity_presentadora_referido')
                var oldIDUPreRef = oldrecord.getValue('custentityidu_presentador')

                log.debug('newSalesRep', newSalesRep)
                log.debug('newPreRef', newPreRef)
                log.debug('oldSalesRep', oldSalesRep)
                log.debug('oldPreRef', oldPreRef)
                
                if(  newPreRef != oldPreRef || newIDUPreRef != oldIDUPreRef ){

                    //Ectrar todos los valores que se van a utiliar usando newRecord.getValue('') y asignarlo a las variables que ya se utilizan o crear nuevas
                    var nombre = newRecord.getValue('altname')
                    var correo = newRecord.getValue('email')
                    var telefono = newRecord.getValue('mobilephone')
                    var activo = newRecord.getValue('isinactive')==false?true:false

                    var referidoSearch = search.lookupFields({
                        type: 'customer',
                        id: newRecord.getValue('custentity_id_cliente_referido'),
                        columns: ["altname", "email", "mobilephone"]
                    });
                    log.debug('referidoSearch',referidoSearch)

                    var employeeSearch = search.lookupFields({
                        type: 'employee',
                        id: newRecord.getValue('custentity_presentadora_referido'),
                        columns: ["firstname", "email", "mobilephone","entityid"]
                    });
                    log.debug('employeeSearch',employeeSearch)

                    var nombreQuienRecomienda = referidoSearch.altname
                    var correoQuienRecomienda = referidoSearch.email
                    var correoPresentador = employeeSearch.email
                    var iduPresentador = employeeSearch.entityid
                    var telefonoRecomendador = referidoSearch.mobilephone
                    var id = newRecord.getValue('id')
                    var salesRep = newRecord.getValue('salesrep') 
                    var iduSalesRep = employeeSearch.entityid

                    if(newRecord.getValue('custentity_id_cliente_referido')){ //Envio Agenda Digital
                        
                        try{
                            //var nameFormat = req_info.nombre+" "+req_info.apellidos // cambiar por variables
                            nameFormat = quitarAcentos(nombre)//Traer funcion quitar acentos
                            
                            var objAD = {
                                'nombre': nombre,
                                'correo': correo,
                                'telefono': telefono,
                                'activo': activo,
                                'nombreQuienRecomienda': quitarAcentos(nombreQuienRecomienda),
                                'correoQuienRecomienda': correoQuienRecomienda,
                                'PresentadorAsignadoCorreo': correoPresentador,
                                'PresentadorAsignadoIDU': iduPresentador,
                                'telefonoQuienRecomienda':telefonoRecomendador,//Espera de LMS
                                'NetSuiteID':id
                            }

                            log.debug('objAD',objAD)
                            log.debug('objAD stringfy',JSON.stringify(objAD))
                            var urlAD
                            if(runtime.envType != 'PRODUCTION'){ 
                                urlAD = 'https://dev-apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                            }else{
                                urlAD = 'https://apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                            }
                            if(nombreQuienRecomienda && correoQuienRecomienda){
                                var responseService = https.post({
                                url: urlAD,
                                body : objAD,//JSON.stringify(
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                    "User-Agent": "NetSuite/2019.2(SuiteScript)",
                                }
                            }).body;
                            log.debug('responseService AD',responseService)
                            }
                       

                        }catch(e){
                        log.debug('Error Agenda digital Referidos restlet',e)
                       }
                    }

                    //Envio LMS 
                    //rellenar con variables
                    var objLMS ={

                      "idCliente": id,

                      "salesrep": salesRep ,

                      "idUsalesRep": iduSalesRep

                    }

                    log.debug('envir a lms',objLMS)
                    if(runtime.envType != 'PRODUCTION'){ 
                        urlLMS = 'http://api-referidos-thrmx.lms-la.com/api/Cliente/actualizar-presentador'
                        key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjhhMDJkZDE3LTYzMjAtNGFiMi1iOWFkLWZlZDMzZWRhYzNiNiIsInN1YiI6InZzaWx2YWNAbG1zLmNvbS5teCIsImVtYWlsIjoidnNpbHZhY0BsbXMuY29tLm14IiwidW5pcXVlX25hbWUiOiJ2c2lsdmFjQGxtcy5jb20ubXgiLCJqdGkiOiI4MjEwMDk4MC0zMDNjLTRlMDktYjM1NS0xMGM5N2ViNWU0ZjkiLCJuYmYiOjE2NzgyMjYzNTYsImV4cCI6MTcwOTg0ODc1NiwiaWF0IjoxNjc4MjI2MzU2fQ.CetagLsFKPT9_kj50JrzOemPHUw4FID7uzEs7AYC3WlkiE5S1VJdhURTlTc4XWeX2-An6P5SzQPlCZtvM-WJrQ'
                    }else{//prod
                        urlLMS = 'http://recomiendayganathermomix.mx:9095/api/Cliente/actualizar-presentador'
                        key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjIyMWFmN2U5LTJjMDAtNDYzZC1hYzliLThkZDA2MzhmYzYzMSIsInN1YiI6InRocm14Lm5ldHN1aXRlLmFwaUBsbXMtbGEuY29tIiwiZW1haWwiOiJ0aHJteC5uZXRzdWl0ZS5hcGlAbG1zLWxhLmNvbSIsInVuaXF1ZV9uYW1lIjoidGhybXgubmV0c3VpdGUuYXBpQGxtcy1sYS5jb20iLCJqdGkiOiIzZjc3NzM1NS0zNmI1LTRlYWQtODg2NC0yMzI2MWZlM2VjZjEiLCJuYmYiOjE2OTkzNzIwMDYsImV4cCI6MTczMDk5NDQwNiwiaWF0IjoxNjk5MzcyMDA2fQ.Urf90o2LXL3ZVsepiEDLi5E06AMQHP_ro2FWqEehoDHv1s8fXEoGn7zdU75Q8cZyCYeRT-xEgdr-5koTFHIiuA'
                    }
                    var responseService = http.put({
                        url: urlLMS,
                        body : JSON.stringify(objLMS),
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": key
                        }
                    }).body;
                    var responseService = JSON.parse(responseService)
                    log.debug('responseService LMS',responseService)

                }
            }
  

        }catch(err){
            log.error("error after submit",err)
        }
        
        return true
    }
    
 function quitarAcentos(cadena){
    const acentos = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ñ':'N','ñ':'n'};
    var cadenasplit = cadena.split('')
    var sinAcentos = cadenasplit.map(function(x) {
        if(acentos[x]){
            return acentos[x];
        }else{
            return x;
        }
       
    });
    var joinsinacentos = sinAcentos.join('').toString(); 
    log.debug('joinsinacentos',joinsinacentos)
    return joinsinacentos; 
    }
    
    
    
    
    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
