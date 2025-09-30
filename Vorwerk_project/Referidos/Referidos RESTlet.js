   /**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/file', 'N/http','N/format','N/encode','N/email','N/runtime'],

function(record,search,https,file,http,format,encode,email,runtime) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
        try{
            log.debug("entre doGet REFERIDOS",requestParams);
            
            return "login was done via server script REFERIDOS";
        }catch(err){
            log.error("error to get",err);
        }
    }

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPut(requestBody) {

    }


    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {
        try{
            var res = {};
            log.debug("requestBody",requestBody);
            var req_info= requestBody;
            switch(req_info.type){
                case "AltaClienteInteresado":
                    res = getInClienteInteresado(req_info)
                break;
                case "BuscaPresentadorCliente":
                    res = getInBuscarPresentador(req_info)
                break;
                case "ProspectoExperiencia":
                    res = getInProspectoExperiencia(req_info)
                break;
                case "ActualizaSalesRep":
                    res = getActualizaSalesRep(req_info)
                break;
                case "FuerzaVentas":
                    res = getFuerzaVentas(req_info)
                break;
            }
        }catch(err){
            log.error("error request",err);
            log.debug('error request',err)
            return {'error':err};
        }
        log.debug("proceso funcional",res);
        return res;

    }
    function getActualizaSalesRep(req_info){
        try{
            /*
            {

                "IdCliente": 1234,

                "salesrepActual": 123,

                "IDUsalesRepActual": 234,

                "salesrepNuevo": 3434, - si 'Sales Rep Solicitud'

                "IDUsalesRepNuevo": 3455,

                "Evaluacion": {

                    "0": "si", _evaluacion0

                    "1": "si",

                    "2": "no",

                    "3": "si",
 
                    "4": "no",

                    "5": "si",

                    "6": "si",

                    "7": "no"

                },

                "MotivoCambio": 1, - si - crear lista - crear el campo de tipo lista 

                "EsPresentadorAleatorio": 0,- Si - check

                "FechaInicio": "2023-09-01", - si

                "FechaFin": "2023-09-08",- si

                "EstatusSolicitud": 3 - Lista 

            }
            1   vacía
            2   Iniciada
            3   En proceso
            4   Cerrada
            5   Cancelada
            6   Completada
            7   Inviable

            */
            //Variables para Response 
            var salesrepNuevoResponse = req_info.salesrepNuevo
            var idusalesRepNuevoResponse = req_info.IDUsalesRepNuevo
            var salesrepActual = req_info.salesrepActual
            var IDUsalesRepActual = req_info.IDUsalesRepActual
            var Folio =  req_info.CambioFolio
            var obj_ret = {}
            var error = false
            

            var objAD = {}

            if(req_info.IdCliente){
               var mySearch = search.load({
                   id: 'customsearch_clientes_activos'
                });

                mySearch.filters.push(search.createFilter({
                       name: 'internalid',
                       operator: 'is',
                       values: req_info.IdCliente
                }));

                var obj_client = false
                var idpresentadora_referido
                var id_cliente_referido
                var stage
                var id_cliente
                var pagedResults = mySearch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                        var values = r.getAllValues();
                        obj_client = values
                        idpresentadora_referido = r.getValue('custentity_presentadora_referido')
                        id_cliente_referido = r.getValue('custentity_id_cliente_referido')!=''?false:true
                        stage = r.getValue('formulatext')
                        id_cliente = r.getValue('internalid')

                        salesrepActual = r.getValue('salesrep')
                        IDUsalesRepActual = r.getText('salesrep').split(' ')[0]
                        
                        
                        return true; 
                    });

                });
            }else{
                log.debug('El cliente no existe o no esta activo')
            }


            if(req_info.IdCliente != null && req_info.IdCliente != '' && obj_client){

                var v

                var cliente_record = record.load({
                    type: stage,
                    id: req_info.IdCliente,
                    isDynamic: false,
                });
                cliente_record.setValue({
                    fieldId: 'custentity_folio',
                    value: Folio
                });
                
                cliente_record.setValue({
                    fieldId: 'custentity_salesrep_nuevo',
                    value: req_info.salesrepNuevo
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_0',
                    value: req_info.Evaluacion[0]
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_1',
                    value: req_info.Evaluacion[1]
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_2',
                    value: req_info.Evaluacion[2]
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_3',
                    value: req_info.Evaluacion[3]
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_4',
                    value: req_info.Evaluacion[4]
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_5',
                    value: req_info.Evaluacion[5]
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_6',
                    value: req_info.Evaluacion[6]
                });
                cliente_record.setValue({
                    fieldId: 'custentity_evaluacion_7',
                    value: req_info.Evaluacion[7]
                });
                
                v = parseInt(req_info.MotivoCambio)
                
                cliente_record.setValue({
                    fieldId: 'custentity_motivo_cambio',
                    value: v
                });
                cliente_record.setValue({
                    fieldId: 'custentity_fecha_inicio',
                    value: req_info.FechaInicio
                });
                cliente_record.setValue({
                    fieldId: 'custentity_fecha_fin',
                    value: req_info.FechaFin
                });
                

                v = parseInt(req_info.EsPresentadorAleatorio)==1?true:false
                
                cliente_record.setValue({
                    fieldId: 'custentity_pre_aleatorio',
                    value: v 
                });


                var statusSolicitud = parseInt(req_info.EstatusSolicitud)
                if(statusSolicitud == 6){//Proceso finalizado - actualizar sales Rep

                    if(req_info.EsPresentadorAleatorio == 1){ //Nos piden Sales Rep Aleatorio 
  
                        var empFields = search.lookupFields({
                            type: 'employee',
                            id: salesrepActual,
                            columns: ["custentity_delegada", "supervisor"]
                        });

                        
                        if (empFields.supervisor != "") {
                        var liderEquipo = empFields.supervisor[0].value;
                        var liderEquipoName = empFields.supervisor[0].text;
                        var liderEquipoIDU = liderEquipoName.split(' ')[0]

                        log.debug('liderEquipo', liderEquipo)
                        log.debug('liderEquipoName', liderEquipoName)
                        log.debug('liderEquipoIDU',liderEquipoIDU)

                        var leFields = search.lookupFields({
                            type: 'employee',
                            id: liderEquipo,
                            columns: ["employeetype", "custentity_promocion", "isinactive"]
                        });

                            var typele = leFields.employeetype[0].value;
                            log.debug('typele', typele)

                            var promole = leFields.custentity_promocion[0].value;
                            log.debug('promole', promole)

                            var inactivele =leFields.isinactive;
                            log.debug('inactivele', inactivele)


                        }
                        if (empFields.custentity_delegada != ""){
                            var  gerenteVentas= empFields.custentity_delegada[0].value;
                            var gerenteVentasName= empFields.custentity_delegada[0].text;
                            var gerenteVentasIDU = gerenteVentasName.split(' ')[0]

                            log.debug('gerenteVentas', gerenteVentas)
                            log.debug('gerenteVentasName', gerenteVentasName)
                            log.debug('gerenteVentasIDU', gerenteVentasIDU)

                            var gvFields = search.lookupFields({
                                type: 'employee',
                                id: gerenteVentas,
                                columns: ["employeetype", "custentity_promocion", "isinactive"]
                            });

                            var typeGV = gvFields.employeetype[0].value;
                            log.debug('typeGV', typeGV)

                            var promoGV = gvFields.custentity_promocion[0].value;
                            log.debug('promoGV', promoGV)

                            var inactiveGV =gvFields.isinactive;
                            log.debug('inactiveGV', inactiveGV)

                        }
                        
                       
                        if(typele == 3 && promole != 3 && inactivele == false){// se asigna del lider de equipo si cumple con = Lider de equipo / No es litigio / es activo
                            
                            salesrepNuevoResponse = liderEquipo
                            idusalesRepNuevoResponse = liderEquipoIDU
                            log.debug('nuevo le',salesrepNuevoResponse)
                            log.debug('nuevo le',idusalesRepNuevoResponse)
                        } else if (typeGV == 5 && promoGV != 3 && inactiveGV == false) { // se asigna el GV si cumple con = Gerente de Ventas / No es litigio / es activo
                           
                            salesrepNuevoResponse = gerenteVentas
                            idusalesRepNuevoResponse = gerenteVentasIDU
                            log.debug('nuevo gv',salesrepNuevoResponse)
                            log.debug('nuevo gv',idusalesRepNuevoResponse)
                        } else {// se asigna presentador de toda la fuerza de ventas

                            var presentadorNuevo = presentadorAleatorioCambio(req_info,salesrepActual)//Se debe asignar uno diferente al actual
                            

                            salesrepNuevoResponse = presentadorNuevo.internalid_p
                            idusalesRepNuevoResponse = presentadorNuevo.idu_p
                        }

                        cliente_record.setValue({
                            fieldId: 'salesrep',
                            value: salesrepNuevoResponse
                        });
                        cliente_record.setValue({
                            fieldId: 'custentity_presentadora_referido',
                            value: salesrepNuevoResponse
                        });
                        cliente_record.setValue({
                            fieldId: 'custentityidu_presentador',
                            value: idusalesRepNuevoResponse
                        });

                    }else if(req_info.EsPresentadorAleatorio == 0){ //Nos mandan el Sales Rep a asignar
                        /*var objAux = {
                            "idPresentador":req_info.salesrepNuevo
                        }
                        var presentadorNuevo = presentadorRecomendador(objAux,false) //Busqueda del Presentador a asignar
                        */
                         var inactiveSRFields = search.lookupFields({
                            type: 'employee',
                            id: req_info.salesrepNuevo,
                            columns: ["isinactive"]
                        });

                         var inactiveSRN = inactiveSRFields.isinactive
                             if (inactiveSRN == false) {//si el sales rep que nos enviaron esta activo se asigna

                                cliente_record.setValue({
                                fieldId: 'salesrep',
                                value: req_info.salesrepNuevo
                                });
                                cliente_record.setValue({
                                    fieldId: 'custentity_presentadora_referido',
                                    value: req_info.salesrepNuevo
                                });
                                cliente_record.setValue({
                                    fieldId: 'custentityidu_presentador',
                                    value: req_info.IDUsalesRepActual
                                });

                                salesrepNuevoResponse = req_info.salesrepNuevo
                                idusalesRepNuevoResponse = req_info.IDUsalesRepNuevo

                             } else{// si el sales rep qe nos enviaron esta inactivo se lanza el erro 409 y se da el resppnse a lms con el erro al igual que a 
                                
                                obj_ret.StatusCode = 409
                                obj_ret.mensaje = 'El presentado elegido no esta disponible'
                                log.debug('El presentado elegido no esta disponible')

                                cliente_record.setValue({
                                    fieldId: 'custentity_salesrep_nuevo',
                                    value: ''
                                });


                                statusSolicitud = 7 

                                objAD.EstatusSolicitud          =   statusSolicitud 
                                objAD.Error                     =   409
                                objAD.Mensaje                   =   'El presentado elegido no esta disponible'
                                
                               
                             }
                            
                        
                    }else{
                        error = true
                        obj_ret.StatusCode = 400
                        obj_ret.mensaje = 'Campo EsPresentadorAleatorio no defindo'

                        log.debug('Campo EsPresentadorAleatorio no defindo')

                    }
               

                } //Solicitud en proceso - Solo actualizar datos (NO actualizar Sales rep)

                if(error == false){

                    cliente_record.setValue({
                        fieldId: 'custentity_estatus_solicitud',
                        value: statusSolicitud
                    });

                    var id_cliente = cliente_record.save({ 
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                     
                     //Data a Agenda Digital
                    
                    objAD.CambioFolio               =   Folio
                    objAD.IdCliente                 =   req_info.IdCliente
                    objAD.salesrepActual            =   salesrepActual
                    objAD.IDUsalesRepActual         =   IDUsalesRepActual
                    objAD.salesrepNuevo             =   salesrepNuevoResponse
                    objAD.IDUsalesRepNuevo          =   idusalesRepNuevoResponse
                    objAD.EvaluacionR0                =   req_info.Evaluacion[0]==''?'NA':req_info.Evaluacion[0]
                    objAD.EvaluacionR1                =   req_info.Evaluacion[1]==''?'NA':req_info.Evaluacion[1]
                    objAD.EvaluacionR2                =   req_info.Evaluacion[2]==''?'NA':req_info.Evaluacion[2]
                    objAD.EvaluacionR3                =   req_info.Evaluacion[3]==''?'NA':req_info.Evaluacion[3]
                    objAD.EvaluacionR4                =   req_info.Evaluacion[4]==''?'NA':req_info.Evaluacion[4]
                    objAD.EvaluacionR5                =   req_info.Evaluacion[5]==''?'NA':req_info.Evaluacion[5]
                    objAD.EvaluacionR6                =   req_info.Evaluacion[6]==''?'NA':req_info.Evaluacion[6]
                    objAD.EvaluacionR7                =   req_info.Evaluacion[7]==''?'NA':req_info.Evaluacion[7]
                    objAD.MotivoCambio              =   req_info.MotivoCambio
                    objAD.EsPresentadorAleatorio    =   req_info.EsPresentadorAleatorio
                    objAD.FechaInicio               =   req_info.FechaInicio
                    objAD.FechaFin                  =   req_info.FechaFin
                    objAD.EstatusSolicitud          =   statusSolicitud 
                    objAD.Semilla                   =   id_cliente_referido
                    
                    log.debug('objAD enviado en el cambio de presentador'+id_cliente,objAD)
                    var urlAD

                    if(runtime.envType != 'PRODUCTION'){ 
                        urlAD = 'https://dev-apiagenda.mxthermomix.com/users/CambioPresentador'
                    }else{
                        urlAD = 'https://apiagenda.mxthermomix.com/users/CambioPresentador'
                    }
                    try{

                        var responseService = https.post({
                            url: urlAD,
                            body : objAD,
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                "User-Agent": "NetSuite/2019.2(SuiteScript)",
                            }
                        }).body;
                        log.debug('responseService AD Cambio presentador',responseService)
                        var responseAD = JSON.parse(responseService)
                        var success = responseAD.success

                        //log.debug('sucessAD', success)
                        
                        if (success != true){
                             log.debug('error Agenda')

                            var catch_record = record.create({
                                type: 'customrecord_catch_recomendaciones',
                                isDynamic: false,
                            });
                             var objHeaders = {}
                             objHeaders.ContentType = "application/x-www-form-urlencoded"
                             objHeaders.UserAgent   = "NetSuite/2019.2(SuiteScript)"

                            catch_record.setValue({
                            fieldId: 'custrecord_json_enviado',
                            value: JSON.stringify(objAD)
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_url',
                            value: urlAD
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_headers',
                            value: JSON.stringify(objHeaders)
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_type_pet',
                            value: 'https'
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_tokens',
                            value: ""
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_response',
                            value: responseService
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_response_reintento',
                            value: ""
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_procesado',
                            value: false
                            });

                            var id_catch = catch_record.save({ 
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug('id_catch',id_catch)
                        }
                    }catch(e){
                        log.debug('Error objAD',e)
                        var objHeaders = {}
                             objHeaders.ContentType = "application/x-www-form-urlencoded"
                             objHeaders.UserAgent   = "NetSuite/2019.2(SuiteScript)"

                            catch_record.setValue({
                            fieldId: 'custrecord_json_enviado',
                            value: JSON.stringify(objAD)
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_url',
                            value: urlAD
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_headers',
                            value: JSON.stringify(objHeaders)
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_type_pet',
                            value: 'https'
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_tokens',
                            value: ""
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_response',
                            value: responseService
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_response_reintento',
                            value: ""
                            });
                            catch_record.setValue({
                            fieldId: 'custrecord_procesado',
                            value: false
                            });

                            var id_catch = catch_record.save({ 
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug('id_catch',id_catch)   

                    }   
                    
                }
                

            }else{
                obj_ret.StatusCode = 424
                obj_ret.mensaje = 'No existe el Cliente o está inactivo'
            }
           

            log.debug('objAD Cambio presentador',objAD)

            //Response LMS
            obj_ret.CambioFolio = Folio
            obj_ret.IdCliente = id_cliente
            obj_ret.salesrepActual = salesrepActual
            obj_ret.IDUsalesRepActual = IDUsalesRepActual
            obj_ret.salesrepNuevo = salesrepNuevoResponse
            obj_ret.IDUsalesRepNuevo = idusalesRepNuevoResponse
            obj_ret.MotivoCambio = req_info.MotivoCambio
            obj_ret.EstatusSolicitud = statusSolicitud

            log.debug('obj_ret LMS'+id_cliente, obj_ret)
            return obj_ret
        }catch(e){
            return e
            log.debug('Error getActualizaSalesRep',e)
        }
    }
    function getInProspectoExperiencia(req_info){
        try{
            var cust = {},emp = {}, obj_ret = {};
            log.debug('req_info getInProspectoExperiencia',req_info)
            if(req_info.id){
               var mySearch = search.load({
               id: 'customsearch_clientes_activos'
            });

            mySearch.filters.push(search.createFilter({
                   name: 'internalid',
                   operator: 'is',
                   values: req_info.id
            }));

            var obj_client = false
            var idpresentadora_referido
            var stage
            var id_cliente
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                    var values = r.getAllValues();
                    obj_client = values
                    idpresentadora_referido = r.getValue('custentity_presentadora_referido')
                    stage = r.getValue('formulatext')
                    id_cliente = r.getValue('internalid')
                    log.debug('id_cliente', id_cliente)
                    log.debug('idpresentadora_referido', idpresentadora_referido)
                    //log.debug('stage', stage)
                    log.debug('valuesSEARCH', values)
                    return true; 
                });

            });

            if(!obj_client){//Si no existe el cliente lo crea 
                obj_ret.StatusCode = 424
                obj_ret.mensaje = 'No existe el prospecto'
            }else if(!idpresentadora_referido){ //Si existe pero no tiene id idpresentadora_referido
                obj_ret.StatusCode = 424
                obj_ret.mensaje = 'Prospecto sin ID de PRESENTADOR REFERIDO'
            }else{

                var prospecto = record.load({
                type: stage,
                id: id_cliente,
                isDynamic: false,
                });
                prospecto.setValue('custentity_experiencia',true);
                prospecto.save();
                obj_ret.StatusCode = 200
                obj_ret.mensaje = 'Prospecto actualizado'

                //Envio datos LMS

                if(runtime.envType != 'PRODUCTION'){ 
                    urlLMS = 'https://api-referidos-thrmx.lms-la.com/api/cliente/agregar-presentacion'
                }else{
                    urlLMS = 'https://api.recomiendayganathermomix.mx/api/cliente/agregar-presentacion'
                }
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1; //January is 0!
                var yyyy = today.getFullYear();
                
               
                //log.debug('mm',mm.length )
                if(mm <  10){
                    //log.debug('mm',mm )
                    mm = '0'+mm
                }
                if(dd < 10 ){
                     //log.debug('dd',dd )
                    dd = '0'+dd
                }
                var fdate = yyyy + '-' +mm + '-' + dd;

                var objRequest = {
                    "IdCliente": req_info.id,
                    "salesrep": idpresentadora_referido,
                    "fechaPresentacion":fdate
                }
                log.debug('objRequest LMS Experiencia',objRequest)
                var responseService = https.post({
                    url: urlLMS,
                    body : JSON.stringify(objRequest),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjIyMWFmN2U5LTJjMDAtNDYzZC1hYzliLThkZDA2MzhmYzYzMSIsInN1YiI6InRocm14Lm5ldHN1aXRlLmFwaUBsbXMtbGEuY29tIiwiZW1haWwiOiJ0aHJteC5uZXRzdWl0ZS5hcGlAbG1zLWxhLmNvbSIsInVuaXF1ZV9uYW1lIjoidGhybXgubmV0c3VpdGUuYXBpQGxtcy1sYS5jb20iLCJqdGkiOiJkMDdkZmJhNy04MjA1LTRkZjYtODdlMS0xZDE2YmUyYTAwOTMiLCJuYmYiOjE3MzYyMTMwNzAsImV4cCI6MTc2Nzc0OTA3MCwiaWF0IjoxNzM2MjEzMDcwfQ.4lCT7MyZ1OPFQhO6opfc1lEUyz-nyDpmE7_ZNVdwbvIIanlzuWIoD5XzjTnojLFO6EThVieiOiPUl7EhqrhkNg"
                    }
                }).body;
                log.debug('responseService LMS Experiencia',responseService)

            }
           
            return obj_ret
            }
        }catch(e){
            log.debug('Error getInProspectoExperiencia',e)
        }
    }
    function getInClienteInteresado(req_info){
        var cust = {},emp = {}, obj_ret = {};
        try{

            log.debug('req_info',req_info)
            
            //Variables para crear/actualizar cliente
            var idRecomendador = req_info.idRecomendador
            log.debug('idRecomendador',idRecomendador)
            var presentadorRecomendacion

            //Busqueda de cliente solicitado
            var mySearch = search.load({
            id: 'customsearch_clientes_activos'
            });

            mySearch.filters.push(search.createFilter({
               name: 'email',
               operator: 'is',
               values: req_info.email
            }));

            var obj_client = false
            var idClienteReferido = false
            var stage
            var id_cliente
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                
                    var values = r.getAllValues();
                    obj_client = values
                    idClienteReferido = r.getValue('custentity_id_cliente_referido')
                    stage = r.getValue('formulatext')//Customer o Lead
                    id_cliente = r.getValue('internalid')
                    log.debug('id_cliente', id_cliente)
                    log.debug('idClienteReferido', idClienteReferido)
                    //log.debug('stage', stage)
                    log.debug('valuesSEARCH', values)
                    return true; 

                });

            });


            
            if(!obj_client){//Si no existe el cliente es un prospecto 

               if(!idRecomendador){ //Si no tiene RECOMENDADOR es registro inicial
                log.debug('Prospecto SIN Recomendador')
                var idPresentador = req_info.idPresentador
                if(!idPresentador || idPresentador == ''){ //Cliente nuevo sin recomendador pero mandan un presentador para asignar
                    presentadorRecomendacion = presentadorAleatorio(req_info)
                }else{
                    presentadorRecomendacion = presentadorRecomendador(req_info,false) // Como la funciona da prioridad si viene con idPresentador nos funciona para asignarlo sin necesidad de tener un recomendador
                }
                log.debug('presentadorRecomendacion',presentadorRecomendacion)
               }else{ //Si tiene RECOMENDADOR pero no es cliente es un prospecto RECOMENDADO y se asigna el Presentador del RECOMENDADOR
                log.debug('Prospecto CON Recomendador')
                
                presentadorRecomendacion = presentadorRecomendador(req_info,idRecomendador)
                log.debug('presentadorRecomendacion',presentadorRecomendacion)
               }

               var respuestaProceso = crearCliente(req_info,presentadorRecomendacion)
                
            }else if(!idRecomendador){ //Si existe el cliente pero no tiene RECOMENDADOR es registro inicial
              
              log.debug('Cliente SIN Recomendador')
              //Validar que contenga presentador el cliente ERROR
              presentadorRecomendacion = presentadorRecomendador(req_info,id_cliente) // Se asigna su propio presentador por lo que para este caso el usuario es su propio RECOMENDADOR
              var respuestaProceso = actualizarCliente(req_info,stage,presentadorRecomendacion,id_cliente)
            
            }else{// Es cliente y viene con recomendador 
                //Buscar tipo de cliente recomendador
                log.debug('Cliente CON Recomendador')
                presentadorRecomendacion = presentadorRecomendador(req_info,idRecomendador)
                var respuestaProceso = actualizarCliente(req_info,stage,presentadorRecomendacion,id_cliente)
            
            }
                if(!respuestaProceso.err){
                    obj_ret.StatusCode = 200
                    obj_ret.IdCliente = respuestaProceso.respuesta
                    obj_ret.idPresentadora = respuestaProceso.idPresentadora
                    obj_ret.iduPresentadora = respuestaProceso.iduPresentadora
                    obj_ret.idRecomendador = respuestaProceso.idRecomendador
                    obj_ret.presentador = respuestaProceso.presentador
                    obj_ret.namePresentadora = respuestaProceso.namePresentadora
                    obj_ret.emailPresentadora = respuestaProceso.emailPresentadora
                    //obj_ret.clienteTM = respuestaProceso.clienteTM
                    obj_ret.mensaje = ''
                }else{
                    obj_ret.StatusCode = 400
                    obj_ret.IdCliente = respuestaProceso.id_cliente
                    obj_ret.idPresentadora = respuestaProceso.idPresentadora
                    obj_ret.iduPresentadora = respuestaProceso.iduPresentadora
                    obj_ret.idRecomendador = respuestaProceso.idRecomendador
                    obj_ret.presentador = respuestaProceso.presentador
                    obj_ret.namePresentadora = respuestaProceso.namePresentadora
                    obj_ret.emailPresentadora = respuestaProceso.emailPresentadora
                    //obj_ret.clienteTM = respuestaProceso.clienteTM
                    obj_ret.mensaje = respuestaProceso.respuesta
                    
                }

            return 'Servicio inactivo desde 30/09/2025'
        }catch(err){
            log.error("error post",err)
            return obj_ret;
        }
    }
    function crearCliente(req_info,presentadorRecomendacion){
        try{
            log.debug('presentadorRecomendacion',presentadorRecomendacion)
            
            var internalid_p    =   presentadorRecomendacion['internalid_p']
            var idu_p           =   presentadorRecomendacion['idu_p']
            var email_p         =   presentadorRecomendacion['email_p']
            var unidad_p        =   presentadorRecomendacion['unidad_p']
            var altname        =   presentadorRecomendacion['altname']
            


                        //Validar si el cliente es presentador

           var idSearch
           var urlAD
                if(runtime.envType != 'PRODUCTION'){ 
                    idSearch = 'customsearch1996';
                    urlAD = 'https://dev-apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                }else{
                    idSearch = 'customsearch1996';
                    urlAD = 'https://apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                }
                
           var mySearch = search.load({
            id: idSearch
            });

            mySearch.filters.push(search.createFilter({
               name: 'email',
               operator: 'is',
               values: req_info.email
            }));

            var presentador = false
            
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                
                    var values = r.getAllValues();
                    log.debug('Es PRESENTADOR',values)
                    presentador = true
                    return true; 

                });

            });
            if(presentador == false){
                var cliente_record = record.create({
                    type: 'lead',
                    isDynamic: false,
                });
                
                cliente_record.setValue({
                    fieldId: 'firstname',
                    value: req_info.nombre
                });
                cliente_record.setValue({
                    fieldId: 'lastname',
                    value: req_info.apellidos
                });
                cliente_record.setValue({
                    fieldId: 'mobilephone',
                    value: req_info.telefono
                });
                cliente_record.setValue({
                    fieldId: 'email',
                    value: req_info.email
                });
                cliente_record.setValue({
                    fieldId: 'custentity_id_cliente_referido',
                    value: req_info.idRecomendador
                });
                cliente_record.setValue({
                    fieldId: 'custentity_presentadora_referido',
                    value: internalid_p
                });
                cliente_record.setValue({
                    fieldId: 'custentityidu_presentador',
                    value: idu_p
                });
                cliente_record.setValue({
                    fieldId: 'salesrep',
                    value: internalid_p
                });

                var id_cliente = cliente_record.save({ 
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('id_cliente',id_cliente)


            


            //Datos usuario que recomienda 
            var nombreQuienRecomienda = ''
            var correoQuienRecomienda = ''
            if(req_info.idRecomendador){ // Posible cambio Para enviar semilla 
                //log.debug('objRecomendador 1')   
                var objRecomendador = search.lookupFields({
                    type: 'customer',
                    id: req_info.idRecomendador,
                    columns: [
                    'altname',
                    'email',
                    'mobilephone'
                    ]
                });
                //log.debug('objRecomendador 2',objRecomendador)   
                //log.debug('objRecomendador.name.value',objRecomendador.altname)
                //log.debug('objRecomendador.name.value',objRecomendador.email)
                //log.debug('objRecomendador.mobilephone',objRecomendador.mobilephone)

                nombreQuienRecomienda = objRecomendador.altname
                correoQuienRecomienda = objRecomendador.email
                
            }
               try{
                    var nameFormat = req_info.nombre+" "+req_info.apellidos
                    nameFormat = quitarAcentos(nameFormat)

                  
                    if(nombreQuienRecomienda && correoQuienRecomienda){

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
                        'NetSuiteID': id_cliente,
                        'Semilla': false

                    }

                    log.debug('objAD',objAD)
                    log.debug('objAD stringfy',JSON.stringify(objAD))
                    
                        /*var responseService = https.post({
                        url: urlAD,
                        body : objAD,//JSON.stringify(
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "User-Agent": "NetSuite/2019.2(SuiteScript)",
                        }
                    }).body;
                    log.debug('responseService AD',responseService)*/
                    }else{

                        var objAD = {
                        'nombre': nameFormat,
                        'correo': req_info.email,
                        'telefono': req_info.telefono,
                        'activo': true,
                        'nombreQuienRecomienda': '',
                        'correoQuienRecomienda': '',
                        'PresentadorAsignadoCorreo': email_p,
                        'PresentadorAsignadoIDU': idu_p,
                        'telefonoQuienRecomienda':'',//Espera de LMS
                        'NetSuiteID':id_cliente,
                        'Semilla': true

                        }

                        log.debug('objAD',objAD)
                        log.debug('objAD stringfy',JSON.stringify(objAD))
                        
                            /*var responseService = https.post({
                            url: urlAD,
                            body : objAD,//JSON.stringify(
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                "User-Agent": "NetSuite/2019.2(SuiteScript)",
                            }
                        }).body;
                        log.debug('responseService AD',responseService)*/

                    }

                    
                   
                   }catch(e){
                    log.debug('Error Agenda digital Referidos restlet',e)
                   }
                   return 'Servicio inactivo desde 30/09/2025'/*{
                        respuesta:id_cliente, 
                        err:false,
                        idPresentadora:internalid_p,
                        iduPresentadora:idu_p,
                        idRecomendador:req_info.idRecomendador,
                        presentador:false,
                        namePresentadora:altname,
                        emailPresentadora:email_p,
                        clienteTM:false
                    };*/
            }else{
                var id_cliente = null
                return 'Servicio inactivo desde 30/09/2025'/*{
                    respuesta:'El correo ya se encuentra registrado como PRESENTADOR', 
                    err:true,
                    idPresentadora:internalid_p,
                    iduPresentadora:idu_p,
                    idRecomendador:req_info.idRecomendador,
                    presentador:true,
                    namePresentadora:altname,
                    emailPresentadora:email_p,
                    clienteTM:false,
                    id_cliente:id_cliente
                };*/
            }
            
            
        }catch(err){
            log.error("error crearCliente",err)
            return {respuesta:err, err:true};
        }
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
    //log.debug('joinsinacentos',joinsinacentos)
    return joinsinacentos; 
    }
    function actualizarCliente(req_info,stage,presentadorRecomendacion,id_cliente){
        try{
            log.debug('actualizarCliente')
            log.debug('presentadorRecomendacion',presentadorRecomendacion)

            var internalid_p    =   presentadorRecomendacion['internalid_p']
            var idu_p           =   presentadorRecomendacion['idu_p']
            var email_p         =   presentadorRecomendacion['email_p']
            var unidad_p        =   presentadorRecomendacion['unidad_p']
            var altname        =   presentadorRecomendacion['altname']

            //Validar si el cliente es presentador
            var idSearch
           var urlAD
                if(runtime.envType != 'PRODUCTION'){ 
                    idSearch = 'customsearch1996';
                    urlAD = 'https://dev-apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                    idSearchClienteTM = 'customsearch_tm_cliente';
                }else{
                    idSearch = 'customsearch1996';
                    urlAD = 'https://apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
                    idSearchClienteTM = 'customsearch_tm_cliente';
                }
                
           var mySearch = search.load({
            id: idSearch
            });

            mySearch.filters.push(search.createFilter({
               name: 'email',
               operator: 'is',
               values: req_info.email
            }));

            var presentador = false
            
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                
                    var values = r.getAllValues();
                    log.debug('Es PRESENTADOR',values)
                    presentador = true
                    return true; 

                });

            });
            if(presentador == false){
                

                var cliente_record = record.load({
                    type: stage,
                    id: id_cliente,
                    isDynamic: false,
                });
                cliente_record.setValue({
                    fieldId: 'firstname',
                    value: req_info.nombre
                });
                cliente_record.setValue({
                    fieldId: 'lastname',
                    value: req_info.apellidos
                });
                cliente_record.setValue({
                    fieldId: 'mobilephone',
                    value: req_info.telefono
                });
                cliente_record.setValue({
                    fieldId: 'email',
                    value: req_info.email
                });
                cliente_record.setValue({
                    fieldId: 'custentity_id_cliente_referido',
                    value: req_info.idRecomendador
                });
                cliente_record.setValue({
                    fieldId: 'custentity_presentadora_referido',
                    value: internalid_p
                });
                cliente_record.setValue({
                    fieldId: 'custentityidu_presentador',
                    value: idu_p
                });
                cliente_record.setValue({
                    fieldId: 'salesrep',
                    value: internalid_p
                });

                var id_cliente = cliente_record.save({ 
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('id_cliente',id_cliente)

            }



            //Datos usuario que recomienda 
            var nombreQuienRecomienda = ''
            var correoQuienRecomienda = ''
            var telefonoQuienRecomienda = ''
            if(req_info.idRecomendador){
                log.debug('objRecomendador 1')   
                var objRecomendador = search.lookupFields({
                    type: 'customer',
                    id: req_info.idRecomendador,
                    columns: [
                    'altname',
                    'email',
                    'mobilephone'
                    ]
                });
                nombreQuienRecomienda = objRecomendador.altname
                correoQuienRecomienda = objRecomendador.email
                telefonoQuienRecomienda = objRecomendador.mobilephone
            }
                

                
                try{
                    
                    if(nombreQuienRecomienda && correoQuienRecomienda){

                        var nameFormat = req_info.nombre+" "+req_info.apellidos
                        nameFormat = quitarAcentos(nameFormat)
                        var objAD = {
                            'nombre': nameFormat,
                            'correo': req_info.email,
                            'telefono': req_info.telefono,
                            'activo': true,
                            'nombreQuienRecomienda': quitarAcentos(nombreQuienRecomienda),
                            'correoQuienRecomienda': correoQuienRecomienda,
                            'PresentadorAsignadoCorreo': email_p,
                            'PresentadorAsignadoIDU': idu_p,
                            'telefonoQuienRecomienda':telefonoQuienRecomienda,//Espera de LMS
                            'NetSuiteID':id_cliente,
                            'Semilla': false
                        }

                        log.debug('objAD',objAD)
                        log.debug('objAD stringfy',JSON.stringify(objAD))

                        /*var responseService = https.post({
                        url: urlAD,
                        body : objAD,//JSON.stringify(
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "User-Agent": "NetSuite/2019.2(SuiteScript)",
                        }
                        }).body;
                        log.debug('responseService AD',responseService)*/

                    }else{

                        var nameFormat = req_info.nombre+" "+req_info.apellidos
                        nameFormat = quitarAcentos(nameFormat)
                        var objAD = {
                            'nombre': nameFormat,
                            'correo': req_info.email,
                            'telefono': req_info.telefono,
                            'activo': true,
                            'nombreQuienRecomienda': '',
                            'correoQuienRecomienda': '',
                            'PresentadorAsignadoCorreo': email_p,
                            'PresentadorAsignadoIDU': idu_p,
                            'telefonoQuienRecomienda':'',
                            'NetSuiteID':id_cliente,
                            'Semilla': true
                        }

                        log.debug('objAD',objAD)
                        log.debug('objAD stringfy',JSON.stringify(objAD))

                        /*var responseService = https.post({
                        url: urlAD,
                        body : objAD,//JSON.stringify(
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "User-Agent": "NetSuite/2019.2(SuiteScript)",
                        }
                        }).body;
                        log.debug('responseService AD',responseService)*/
                    }
               

                }catch(e){
                log.debug('Error Agenda digital Referidos restlet',e)
               }

            
            //Busqueda valida si el cliente tiene una TM 
        

            var mySearch = search.load({
                id: idSearchClienteTM
            });

            mySearch.filters.push(search.createFilter({
               name: 'entity',
               operator: 'is',
               values: id_cliente
            }));

            var clienteTM = false
           
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                
                    var values = r.getAllValues();
                    clienteTM = true
                    return true; 

                });

            });

        return 'Servicio inactivo desde 30/09/2025'/*{
            respuesta:id_cliente, 
            err:false,
            idPresentadora:internalid_p,
            iduPresentadora:idu_p,
            idRecomendador:req_info.idRecomendador,
            presentador:presentador,
            namePresentadora:altname,
            emailPresentadora:email_p,
            clienteTM:clienteTM
        };
        */
            
        }catch(err){
            log.error("error actualizarCliente",err)
            return {respuesta:err, err:true};
        }
    }

    function presentadorAleatorioCambio(req_info,salesrepActual){
        try{


            log.debug('Buscar presentador aleatorio de la lista completa de presentadores activos Elegibles a presentadora Referido')
            //1 buscar la busqueda customsearch1994 y quitar el filtro de Elegibles a presentadora Referido
            // 2 añadir los filtros de type = lider de equipo, presentador o Gerente de Ventas y verificar que sea activo
            // custentity_promocion no es en litigio 
            var mySearch = search.load({
                id: 'customsearch1994'
            });

            mySearch.filters.push(search.createFilter({
               name: 'internalid',
               operator: 'noneof',
               values: salesrepActual
            }));

            var totalPresentadoras = []
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                   
                    totalPresentadoras.push({
                        'internalid_p'    :   r.getValue('internalid'),
                        'idu_p'           :   r.getValue('entityid'),
                        'email_p'         :   r.getValue('email'),
                        'unidad_p'        :   r.getValue('custentity_nombre_unidad'),
                        'altname'        :   r.getValue('altname'),
                    })
                    return true; 

                });

            });
            
            var aleatorionuem = (Math.floor(Math.random() * totalPresentadoras.length))
            
            return 'Servicio inactivo desde 30/09/2025'//totalPresentadoras[aleatorionuem]
        }catch(e){
            log.debug('Error presentadorAleatorio',e)
        }
    }


    function presentadorAleatorio(req_info){
        try{


            log.debug('Buscar presentador aleatorio de la lista completa de presentadores activos Elegibles a presentadora Referido')
            //1 buscar la busqueda customsearch1994 y quitar el filtro de Elegibles a presentadora Referido
            // 2 añadir los filtros de type = lider de equipo, presentador o Gerente de Ventas y verificar que sea activo
            // custentity_promocion no es en litigio 
            var mySearch = search.load({
                id: 'customsearch1994'
            });

            

            var totalPresentadoras = []
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                   
                    totalPresentadoras.push({
                        'internalid_p'    :   r.getValue('internalid'),
                        'idu_p'           :   r.getValue('entityid'),
                        'email_p'         :   r.getValue('email'),
                        'unidad_p'        :   r.getValue('custentity_nombre_unidad'),
                        'altname'        :   r.getValue('altname'),
                    })
                    return true; 

                });

            });
            
            var aleatorionuem = (Math.floor(Math.random() * totalPresentadoras.length))
            
            return 'Servicio inactivo desde 30/09/2025'//totalPresentadoras[aleatorionuem]
        }catch(e){
            log.debug('Error presentadorAleatorio',e)
        }
    }

    function presentadorRecomendador(req_info,idRecomendador){
        try{
            log.debug('Buscar presentador del recomendador')
            var idPresentador_LE = false
            if(!req_info.idPresentador){// NO tiene id presentador, Se da prioridad al 'presentador recomendador' del json
                
                //correr busqueda de clientes o leads para extraer su presentador

                var mySearch = search.load({
                id: 'customsearch_clientes_activos'
                });

                mySearch.filters.push(search.createFilter({
                   name: 'internalid',
                   operator: 'is',
                   values: idRecomendador
                }));

                var pagedResults = mySearch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                    
                        var presentadora_referido = r.getValue('custentity_presentadora_referido')
                        var salesrep = r.getValue('salesrep')
                        if(presentadora_referido && presentadora_referido != ''){
                            idPresentador_LE = presentadora_referido
                        }else if( salesrep && salesrep != ''){
                            idPresentador_LE = salesrep
                        }
                       
                        return true; 
                    });

                });
            }else{// 'presentador recomendador' será el del json
                idPresentador_LE = req_info.idPresentador
            }

            if(idPresentador_LE){//Existe presnetador del recomendador o del cliente en caso de no tener recomendado
                //busqueda de presentador para validar si es activo 
                var objPresentadora = search.lookupFields({
                    type: 'employee',
                    id: idPresentador_LE,
                    columns: [
                    'entityid',
                    'issalesrep',
                    'isinactive',
                    'custentity_nombre_unidad',
                    'email',
                    'altname',
                    ]
                });
                log.debug('objPresentadora',objPresentadora)   

                if(!objPresentadora.isinactive){ //Presentadora Activa
                    log.debug('presentadora activa')
                    var arrPresentadora = ({
                        'internalid_p'    :   idPresentador_LE,
                        'idu_p'           :   objPresentadora.entityid,
                        'email_p'         :   objPresentadora.email,
                        'unidad_p'        :   objPresentadora.custentity_nombre_unidad,
                        'altname'        :   objPresentadora.altname,
                    })
                    log.debug('arrPresentadora',arrPresentadora)
                    return arrPresentadora
                }else{ //Buscar presentador aleatorio de la misma unidad 
                    var mySearch = search.load({
                        id: 'customsearch1994'
                    });
                    log.debug('Unidad presentadora inactiva',objPresentadora.custentity_nombre_unidad)
                    mySearch.filters.push(search.createFilter({
                        name: 'custentity_nombre_unidad',
                        operator: 'is',
                        values: objPresentadora.custentity_nombre_unidad
                    }));
                    var totalPresentadoras = []
                    var pagedResults = mySearch.runPaged();
                    pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                        currentPage.data.forEach(function (r) {
                            var values = r.getAllValues();
                            totalPresentadoras.push({
                                'internalid_p'    :   r.getValue('internalid'),
                                'idu_p'           :   r.getValue('entityid'),
                                'email_p'         :   r.getValue('email'),
                                'unidad_p'        :   r.getValue('custentity_nombre_unidad'),
                                'altname'        :   r.getValue('altname'),
                            })
                            return true; 

                        });

                    });
                    
                    var aleatorionuem = (Math.floor(Math.random() * totalPresentadoras.length))
                    
                    return //'Servicio inactivo desde 30/09/2025'totalPresentadoras[aleatorionuem]
                }
            }else{//El Recomendador o cliente no tiene Presentador recomendador ni Sales Rep 
                return 'Servicio inactivo desde 30/09/2025'//presentadorAleatorio(req_info)
            }
            
        }catch(e){
            log.debug('Error presentadorRecomendador',e)
        }
    }

        function getInBuscarPresentador(req_info){
            var cust = {},emp = {}, obj_ret = {};
            var valid_rfc= false;
            try{
                log.debug('req_info',req_info.email)
                
                var mySearch = search.load({
                id: 'customsearch_clientes_activos'
                });

                mySearch.filters.push(search.createFilter({
                       name: 'custentity_id_cliente_referido',
                       operator: 'is',
                       values: req_info.IdCliente
                }));

                var obj_client = false
                var pagedResults = mySearch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                    
                        var values = r.getAllValues();
                        obj_client = values
                        log.debug('valuesSEARCH', values)
                        return true; 

                    });

                });

                if(obj_client){
                    if(obj_client["CUSTENTITY_PRESENTADORA_REFERIDO.entityid"] != "" && obj_client["CUSTENTITY_PRESENTADORA_REFERIDO.entityid"]){
                        obj_ret.StatusCode = 200
                        obj_ret.IdInterno = obj_client["CUSTENTITY_PRESENTADORA_REFERIDO.internalid"][0].value
                        obj_ret.IDU = obj_client["CUSTENTITY_PRESENTADORA_REFERIDO.entityid"]
                        obj_ret.mensaje = ''
                    }else{
                        obj_ret.StatusCode = 200
                        obj_ret.mensaje = 'Cliente no tiene Presentador'
                    }
                    
                    
                }else{
                    obj_ret.StatusCode = 200
                    obj_ret.mensaje = 'Cliente No existe'
                }
               
                return 'Servicio inactivo desde 30/09/2025'//obj_ret
            }catch(err){
                log.error("error getInBuscarPresentador",err)
                return 'Servicio inactivo desde 30/09/2025'//obj_ret;
            }
        }
    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {

    }

    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };
    
});
