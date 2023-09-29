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

           
            if (contextType == 'create') { 
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

            if(scriptContext.type == 'edit' ){ 
                var newSalesRep = newRecord.getValue('salesrep')
                var newPreRef = newRecord.getValue('custentity_presentadora_referido')
                var newIDUPreRef = newRecord.getValue('custentityidu_presentador')

                var oldSalesRep = oldrecord.getValue('salesrep')
                var oldPreRef = oldrecord.getValue('custentity_presentadora_referido')
                var oldIDUPreRef = oldrecord.getValue('custentityidu_presentador')

                if( newSalesRep != oldSalesRep || newPreRef != oldPreRef || newIDUPreRef != oldIDUPreRef ){

                    //Ectrar todos los valores que se van a utiliar usando newRecord.getValue('') y asignarlo a las variables que ya se utilizan o crear nuevas
                    var nombreQuienRecomienda = ''
                    var correoQuienRecomienda = ''
                    if(req_info.idRecomendador){ //Envio Agenda Digital
                        
                        try{
                            var nameFormat = req_info.nombre+" "+req_info.apellidos // cambiar por variables
                            nameFormat = quitarAcentos(nameFormat)//Traer funcion quitar acentos
                            var objAD = {
                                'nombre': nameFormat,
                                'correo': req_info.email,
                                'telefono': req_info.telefono,
                                'activo': true,
                                'nombreQuienRecomienda': quitarAcentos(nombreQuienRecomienda),
                                'correoQuienRecomienda': correoQuienRecomienda,
                                'PresentadorAsignadoCorreo': email_p,
                                'PresentadorAsignadoIDU': idu_p,
                                'telefonoQuienRecomienda':objRecomendador.mobilephone,//Espera de LMS
                                'NetSuiteID':id_cliente
                            }

                            log.debug('objAD',objAD)
                            log.debug('objAD stringfy',JSON.stringify(objAD))
                            var urlAD
                            if(runtime.envType != 'PRODUCTION'){ 
                                urlAD = 'https://dev-apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                            }else{
                                urlAD = 'https://apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                            }
                            /*if(nombreQuienRecomienda && correoQuienRecomienda){
                                var responseService = https.post({
                                url: urlAD,
                                body : objAD,//JSON.stringify(
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                    "User-Agent": "NetSuite/2019.2(SuiteScript)",
                                }
                            }).body;
                            log.debug('responseService AD',responseService)
                            }*/
                       

                        }catch(e){
                        log.debug('Error Agenda digital Referidos restlet',e)
                       }
                    }

                    //Envio LMS 
                    //rellenar con variables
                    var objLMS ={

                      "idCliente": ,

                      "salesrep": ,

                      "idUsalesRep": 

                    }

                    log.debug('envir a lms',search_obj_detailLMS)
                    if(runtime.envType != 'PRODUCTION'){ 
                        urlLMS = 'http://api-referidos-thrmx.lms-la.com/api/Cliente/actualizar-presentador'
                        key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjhhMDJkZDE3LTYzMjAtNGFiMi1iOWFkLWZlZDMzZWRhYzNiNiIsInN1YiI6InZzaWx2YWNAbG1zLmNvbS5teCIsImVtYWlsIjoidnNpbHZhY0BsbXMuY29tLm14IiwidW5pcXVlX25hbWUiOiJ2c2lsdmFjQGxtcy5jb20ubXgiLCJqdGkiOiI4MjEwMDk4MC0zMDNjLTRlMDktYjM1NS0xMGM5N2ViNWU0ZjkiLCJuYmYiOjE2NzgyMjYzNTYsImV4cCI6MTcwOTg0ODc1NiwiaWF0IjoxNjc4MjI2MzU2fQ.CetagLsFKPT9_kj50JrzOemPHUw4FID7uzEs7AYC3WlkiE5S1VJdhURTlTc4XWeX2-An6P5SzQPlCZtvM-WJrQ'
                    }else{//prod
                        urlLMS = ''
                    }
                    /*var responseService = http.put({
                        url: urlLMS,
                        body : JSON.stringify(objLMS),
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": key
                        }
                    }).body;
                    var responseService = JSON.parse(responseService)
                    log.debug('responseService LMS',responseService)*/

                }
            }
  

        }catch(err){
            log.error("error after submit",err)
        }
        
        return true
    }
    

    
    
    
    
    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    };
    
});
