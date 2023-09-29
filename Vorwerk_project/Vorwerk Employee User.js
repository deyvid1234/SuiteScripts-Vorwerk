/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/http','N/https','N/encode','N/runtime','N/ui/serverWidget'],

function(record,search,http,https,encode,runtime,serverWidget) {
   
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
    		
    		var form = scriptContext.form;//formulario de registro
    		var objUser = runtime.getCurrentUser();//extracion de usuario activo
    		var rec = scriptContext.newRecord;//extraccion de registro userevent
    		var assigned = '';
    		if(scriptContext.type == 'edit'){//validacion de contexto edit 
    			var busqueda = search.create({//creacion de busqueda 
    	              type: 'customrecord_vorwerk_config_permission',//configuracion de permisos 
    	              columns: ['custrecord_vorwerk_assigned'],//extraccion de employee
    	              filters: [
    	                  ['custrecord_vorwerk_register_type','is','salesorder'],//tipo de dato a buscar 
    	              ]
    	          });
    	           busqueda.run().each(function(r){//inicio de busqueda 
    	             assigned = r.getValue('custrecord_vorwerk_assigned');//extraccion de valor
    	              return true;
    	           });
    	           var arr_assigned = assigned.split(',');//transforma una cadena de texto a un arreglo 
    	           
    	           for(var index in arr_assigned){//recorre el arreglo 
    	        	   if(arr_assigned[index] != objUser.id && rec.getValue('custentity_tipo_ingreso') != '' ){//validacion de campos
    	        		   var typeReentry = form.getField({ id:'custentity_tipo_ingreso' });//busca el campo 
    	                   typeReentry.updateDisplayType({//bloquea el campo 
    	                       displayType : serverWidget.FieldDisplayType.INLINE//como se visualiza el campo 
    	                   });
    	                   break;
    	        	   }
    	           }
    		}
           
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
    		var thisRecord = scriptContext.newRecord;
        	var oldrecord = scriptContext.oldRecord;

        	try{
        		//Fuerza de ventas bajo demanda
	    		if(scriptContext.type == 'edit' || scriptContext.type == 'create' || scriptContext.type == 'xedit'){ 

	    			var oldInactive = oldrecord.getValue('isinactive')
	    			var newInactive = thisRecord.getValue('isinactive')   			

	    			//Variables para elegir nuevo Sales Rep si se inactiva
	    			var liderEquipo
	    			var gerenteVentas

	    			var searchData = search.create({
		                type: 'employee',
		                columns: ['custentity59','internalid','entityid','firstname','email','mobilephone','lastname',
		                         'isinactive','employeetype','custentity_oficina','location',
		                         'custentity_delegada','supervisor','custentityregional_manager','custentity_area_manager','custentity_estructura_virtual','birthdate','hiredate','custentity72',
		                         {name : 'custentity_mostrador',join : 'custentity_delegada'},
		                        ],
		                filters: [
		                    ['salesrep','is',true]
		                    ,'and',
		                    ['internalid','is',thisRecord.getValue('id')]
		                    ,'and',
		                    ['employeetype','anyof',[1,3,5,8]]
		                ]
		            });
		    		var search_obj_detailAD = [];
		    		var search_obj_detailLMS = [];
		    		var cumpleFiltros = false
					var pagedResults = searchData.runPaged();
					pagedResults.pageRanges.forEach(function (pageRange){     
						var currentPage = pagedResults.fetch({index: pageRange.index});
						currentPage.data.forEach(function (result) {
							
							liderEquipo = result.getValue('supervisor')
							gerenteVentas = result.getValue('custentity_delegada')

							search_obj_detailAD.push({
								id : result.getValue('internalid'),
								idu : result.getValue('entityid'),
								nombre : result.getValue('firstname'),
								apellido : result.getValue('lastname'),
								correo : result.getValue('email'),
								telefono : result.getValue('mobilephone'),
								inactivo: result.getValue('isinactive'),
								virtual: result.getValue('custentity_estructura_virtual'),
								rol :[{text:result.getText('employeetype'),value:result.getValue('employeetype')}],
								gerencia: result.getText('custentity_gerencia'),
								sucursal:{name:result.getText('custentity_oficina'),value:result.getValue('custentity_oficina')},
								gerente: result.getValue('custentity_delegada'),
								lider:result.getValue('supervisor'),
								area_manager: result.getValue('custentity_area_manager'),
								regional_manager: result.getValue('custentityregional_manager'),
								mostrador:result.getValue({name : 'custentity_mostrador',join : 'custentity_delegada'})
							});

							search_obj_detailLMS.push({
								
								IdInterno : result.getValue('internalid'),
								IDU : result.getValue('entityid'),
								Nombre : result.getValue('firstname'),
								Apellidos : result.getValue('lastname'),
								FachaNacimineto : formatoFecha(result.getValue('birthdate')),
								FechaAlta : formatoFecha(result.getValue('hiredate')),
								FechaBaja: formatoFecha(result.getValue('custentity59')),
								FechaReactivacion : formatoFecha(result.getValue('custentity72')),
								inactivo: result.getValue('isinactive')== true?'1':'0',
								
							});
						});
					});
	                
			    	

			    	

			    	var obj_detail = search_obj_detailAD
			    	obj_detail[0].estructura=[]
			    	if(obj_detail[0].regional_manager != ''){
			        	var regional_manager = getEmployeeData(obj_detail[0].regional_manager,'regional manager')
			        	obj_detail[0].estructura.push(regional_manager)
			    	}
			    	if(obj_detail[0].area_manager != ''){
			        	var area_manager = getEmployeeData(obj_detail[0].area_manager,'area manager')
			        	obj_detail[0].estructura.push(area_manager)
			    	}
			    	if(obj_detail[0].gerente != '' ){
			    		var obj_gerente = getEmployeeData(obj_detail[0].gerente,'gerente')
			    		obj_detail[0].estructura.push(obj_gerente)
			    	}
			    	if(obj_detail[0].lider != ''){
			    		var obj_lider = getEmployeeData(obj_detail[0].lider,'lider')
			    		obj_detail[0].estructura.push(obj_lider)
			    	}
			    	
			    	if(obj_detail[0].mostrador != ''){
			        	var mostrador = getEmployeeData(obj_detail[0].mostrador,'mostrador')
			        	obj_detail[0].estructura.push(mostrador)
			    	}
			    	delete obj_detail[0].regional_manager
			    	delete obj_detail[0].area_manager
			    	delete obj_detail[0].lider
			    	delete obj_detail[0].gerente
			    	delete obj_detail[0].mostrador


			    	if( newInactive != oldInactive ){


			    		//1 Notificacion a LMS y AD de cambio de status inactive
			    		
			    		log.debug('JSON send AD',obj_detail)
			    		
			    		if(runtime.envType != 'PRODUCTION'){ 
		                    urlAD = 'https://dev-apiagenda.mxthermomix.com/users/postUserNetsuite'
		                }else{//prod
		                    urlAD = 'https://apiagenda.mxthermomix.com/users/postUserNetsuite'
		                }
				    	var responseService = https.post({
						    url: urlAD,
							body : JSON.stringify(obj_detail[0]),
							headers: {
				     			"Content-Type": "application/json"
				     		}
				   	    }).body;
				    	var responseService = JSON.parse(responseService)
				    	log.debug('responseService AD',responseService)


				    	try{//ENVIO LMS
				    		log.debug('envir a lms',search_obj_detailLMS)
				    		if(runtime.envType != 'PRODUCTION'){ 
			                    urlLMS = 'http://api-referidos-thrmx.lms-la.com/api/fuerzaVentas'
			                    key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjhhMDJkZDE3LTYzMjAtNGFiMi1iOWFkLWZlZDMzZWRhYzNiNiIsInN1YiI6InZzaWx2YWNAbG1zLmNvbS5teCIsImVtYWlsIjoidnNpbHZhY0BsbXMuY29tLm14IiwidW5pcXVlX25hbWUiOiJ2c2lsdmFjQGxtcy5jb20ubXgiLCJqdGkiOiI4MjEwMDk4MC0zMDNjLTRlMDktYjM1NS0xMGM5N2ViNWU0ZjkiLCJuYmYiOjE2NzgyMjYzNTYsImV4cCI6MTcwOTg0ODc1NiwiaWF0IjoxNjc4MjI2MzU2fQ.CetagLsFKPT9_kj50JrzOemPHUw4FID7uzEs7AYC3WlkiE5S1VJdhURTlTc4XWeX2-An6P5SzQPlCZtvM-WJrQ'
			                }else{//prod
			                    urlLMS = ''
			                }
					    	var responseService = http.put({
							    url: urlLMS,
								body : JSON.stringify(search_obj_detailLMS),
								headers: {
					     			"Content-Type": "application/json",
					     			"Authorization": key
					     		}
					   	    }).body;
					    	var responseService = JSON.parse(responseService)
					    	log.debug('responseService LMS',responseService)
				    	}catch(e){
				    		log.debug('Error envio de datos a LMS',e)
				    	}
						

				    	//2 Flujo de reasignacion de clientes del presentador inactivo
				    	if(newInactive == true){

				    		var newSalesRepF = getNewSalesRep(thisRecord.getValue('id'),liderEquipo,gerenteVentas)//id presentador , lider de equipo, Gerente de ventas
				    		log.debug('newSalesRepF',newSalesRepF)
				    		var newSalesRep = newSalesRepF.id
				    		var newIDUSalesRep = newSalesRepF.idu

				    		
				            var searchCustomers = search.load({
				               id: 'customsearch_clientes_activos'
				            });
				            searchCustomers.filters.push(search.createFilter({
				                   name: 'salesrep',
				                   operator: 'is',
				                   values: thisRecord.getValue('id')
				            }));


				            var pagedResults = searchCustomers.runPaged();
							pagedResults.pageRanges.forEach(function (pageRange){     
								var currentPage = pagedResults.fetch({index: pageRange.index});
								currentPage.data.forEach(function (result) {
									
									var idCustomer = result.getValue('internalid')
									var stage = result.getValue('formulatext')
									log.debug('stage',stage)
									var checkReferidos = result.getValue('custentity_presentadora_referido')
									if(checkReferidos != '' && checkReferidos ){

										idCustomer = record.submitFields({
						                    type   : stage,
						                    id     : idCustomer,
						                    values : {
						                        salesrep           					: newSalesRep,
						                        custentity_presentadora_referido    : newSalesRep,
						                        custentityidu_presentador         	: newIDUSalesRep
						                    },
						                    options: {
						                        enableSourcing          : false,
						                        ignoreMandatoryFields   : true
						                    }
						                });  

					                    log.debug('recCustomer', recCustomer)	





					                    //Avisar a LMS y AD
					                    /*
					                    1. Actualizaer la busqueda de clientes activos con todas las columnas que necesitamos
					                    2.  en la funcion getNewSalesRep añadir los campos del presentador que necesitamos correo,telefono, idu,----
					                    3. 	armar json de LMS y AD 

					                    4. Enviar datos			
										var activo = newRecord.getValue('isinactive')==false?true:false
										
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
					                        urlLMS = ''
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
										*/

					                }
									
									return true;
								});
							});

				    	}

			    	}else{
			    		log.debug('No hay cambios de status inactive')
			    	}
			    	
			    	
			    	

	    		}
        	}catch(e){
        		log.debug('Error actualizar fuerza de ventas',e)
        	}


        	//Flujo envio AMAN - Desconocido 
    		if(scriptContext.type == 'edit'){

        		//log.debug('old',oldrecord.getValue('isinactive'))
        		if(oldrecord.getValue('isinactive') != thisRecord.getValue('isinactive')){
        			sendRequest({
            			'isinactive':thisRecord.getValue('isinactive'),
            			'IDU':thisRecord.getValue('id'),
            			'employeetype':thisRecord.getValue('employeetype')
            		});
        		}
    		}
    		if(scriptContext.type == 'xedit'){
        		
        		//log.debug('old',oldrecord.getValue('isinactive'))
        		if(oldrecord.getValue('isinactive') != thisRecord.getValue('isinactive')){
        			
        			//log.debug('OLD','IDU '+oldrecord.getValue('id')+' TYPE '+oldrecord.getValue('employeetype')+' INACTIVE '+oldrecord.getValue('isinactive'))
        			//log.debug('NEW','IDU '+thisRecord.getValue('id')+' TYPE '+thisRecord.getValue('employeetype')+' INACTIVE '+thisRecord.getValue('isinactive'))
        			sendRequest({
            			'isinactive':thisRecord.getValue('isinactive'),
            			'IDU':oldrecord.getValue('id'),
            			'employeetype':oldrecord.getValue('employeetype')
            		});
        		}
    		}
    		//FIN Flujo envio AMAN - Desconocido 

    	}catch(err){
    		log.error("error after submit",err)
    	}
    	
    	return true
    }
    
    function getNewSalesRep(oldSalesRep, liderEquipo, gerenteVentas){

    	var idSalesRep
    	var iduSalesRep





    	if (liderEquipo != "") {

            var leFields = search.lookupFields({
                type: 'employee',
                id: liderEquipo,
                columns: ["employeetype", "custentity_promocion", "isinactive","entityid"]
            });

            var typele = leFields.employeetype[0].value;
            var promole = leFields.custentity_promocion[0].value;
            var inactivele =leFields.isinactive;
            var iduLE = leFields.entityid.value;


        }
        if( gerenteVentas != '' ) {

            var gvFields = search.lookupFields({
                type: 'employee',
                id: gerenteVentas,
                columns: ["employeetype", "custentity_promocion", "isinactive","entityid"]
            });

            var typeGV = gvFields.employeetype[0].value;
            var promoGV = gvFields.custentity_promocion[0].value;
            var inactiveGV =gvFields.isinactive;
            var iduGV = gvFields.entityid;

        }
            
           
            if(typele == 3 && promole != 3 && inactivele == false){// se asigna del lider de equipo si cumple con = Lider de equipo / No es litigio / es activo
                
                idSalesRep = liderEquipo
                iduSalesRep = iduLE

            } else if (typeGV == 5 && promoGV != 3 && inactiveGV == false) { // se asigna el GV si cumple con = Gerente de Ventas / No es litigio / es activo
               
                idSalesRep = gerenteVentas
                iduSalesRep = iduGV
            } else {// se asigna presentador de toda la fuerza de ventas

                var presentadorNuevo = presentadorAleatorio()
                
                idSalesRep = presentadorNuevo.internalid_p
                iduSalesRep = presentadorNuevo.idu_p
            }
            log.debug('idSalesRep',idSalesRep)
            log.debug('iduSalesRep',iduSalesRep)

    	return {id: idSalesRep, idu: iduSalesRep}
    }

    function presentadorAleatorio(){
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
            
            return totalPresentadoras[aleatorionuem]
        }catch(e){
            log.debug('Error presentadorAleatorio',e)
        }
    }
    
    
    function sendRequest(obj_to_send){
    	try{
    		var url = "";
    		var credentials ="";
    		log.debug("runtime.envType",runtime.envType);
    		var procesURL = [];
			var amanUrl = search.create({
			    type: 'customrecord_aman_url_method',
			    columns: ['custrecord_url_method','custrecord_user_aman','custrecord_password_aman'],
			    filters: [
			        ['custrecord_runtime_aman','is',runtime.envType],
			    ]
			});
			amanUrl.run().each(function(r){
				procesURL.push({
					credentials:r.getValue('custrecord_user_aman')+':'+r.getValue('custrecord_password_aman'),
					url:r.getValue('custrecord_url_method')
				}) 
			    return true;
			});
    		
			for(var x in procesURL){
				try{
					//log.debug("info aman",procesURL[x]);
					credentials = encode.convert({
		                string: procesURL[x].credentials,
		                inputEncoding: encode.Encoding.UTF_8,
		                outputEncoding: encode.Encoding.BASE_64
		            });
		            var headers = {
		                "Authorization": "Basic " + credentials,
		                "User-Agent":"NetSuite/2019.2(SuiteScript)",
		                "Content-Type":"application/json"
		            };
		            var url = procesURL[x].url;
		            if(!url){
		                var object_info = new Object();
		                return object_info;
		            }
		            //log.debug("info to send headers",headers)
		            //log.debug("info to send obj_to_send prev",obj_to_send)
		            if(url.indexOf('https') != -1){
		                var data = https.post({
		                    url : url,
		                    headers: headers,
		                    body: JSON.stringify(obj_to_send)
		                }).body;
		                log.debug('data post https',data);
		            }else{
		                var data = http.post({
		                    url : url,
		                    headers: headers,
		                    body: JSON.stringify(obj_to_send)
		                }).body;
		                //log.debug('data post http',data);
		            }
				}catch(error){
					log.error("error request ",procesURL);
					log.error("error request ",error);
				}
				
	            
			}
			
            
    	}catch(err){
    		log.error("error to sendRequest",err);
    	}
    	
    }
    
    function formatoFecha(fecha){
    	var fdate = ''
    	if(fecha != '' && fecha != null){
    		var auxF = fecha.split('/')

	    	log.debug('auxF',auxF)
	    	var today = new Date();
	        var dd = parseInt(auxF[0]) 
	        var mm = parseInt(auxF[1])
	        var yyyy = auxF[2]
	        
	       
	        log.debug('mm',mm.length )
	        if(mm <  10){
	            log.debug('mm',mm )
	            mm = '0'+mm
	        }
	        if(dd < 10 ){
	             log.debug('dd',dd )
	            dd = '0'+dd
	        }
	        fdate = yyyy + '-' +mm + '-' + dd;
	        log.debug('fdate',fdate)
    	}
    	

    	return fdate;
    }
  	function getEmployeeData(idemp,rol){
    	try{
    			log.debug('1','idemp '+idemp+' rol '+rol)
				var obj_emp = search.lookupFields({
                    type: 'employee',
                    id: idemp,
                    columns: ['entityid','firstname','lastname','email','mobilephone','employeetype','custentity_oficina','custentity_num_am']
                });
				if(rol == "mostrador"){
					obj_emp.employeetype.push({value:"55",text:"mostrador"})
				}else{
					obj_emp.employeetype[0].text = rol
				}
				
				var obj_aux={
					id:idemp,
					idu:obj_emp.entityid,
					nombre:obj_emp.firstname,
					apellido:obj_emp.lastname,
					correo:obj_emp.email,
					telefono:obj_emp.mobilephone,
					rol:obj_emp.employeetype,
					oficina:obj_emp.custentity_oficina,
					noam:obj_emp.custentity_num_am
					
				}
				log.debug('obj_aux',obj_aux)
    		return obj_aux;
    	}catch(err){
    		log.error('getEmployeeData',err)
    	}
    }
    
    
    
    
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
