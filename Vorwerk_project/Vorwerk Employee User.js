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


	    			var searchData = search.create({
		                type: 'employee',
		                columns: ['custentity59','internalid','entityid','firstname','email','mobilephone','lastname',
		                         'isinactive','employeetype','custentity_oficina','location',
		                         'custentity_delegada','supervisor','custentityregional_manager','custentity_area_manager','custentity_estructura_virtual',
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
		    		var search_obj_detail = [];
		    		var cumpleFiltros = false
					var pagedResults = searchData.runPaged();
					pagedResults.pageRanges.forEach(function (pageRange){     
						var currentPage = pagedResults.fetch({index: pageRange.index});
						currentPage.data.forEach(function (result) {
							search_obj_detail.push({
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

							if( (result.getValue('isinactive') == true && result.getValue('custentity59') !='') ||  result.getValue('isinactive') == false){
								cumpleFiltros = true
							}
							
						});
					});
	                
			    	log.debug('search_obj_detail',search_obj_detail)

			    	var obj_detail = search_obj_detail
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

			    	if(cumpleFiltros){
			    		log.debug('JSON send',obj_detail)
			    		if(runtime.envType != 'PRODUCTION'){ 
		                    urlAD = 'https://dev-apiagenda.mxthermomix.com/users/postUserNetsuite'
		                }else{//prod
		                    urlAD = 'https://apiagenda.mxthermomix.com/users/postUserNetsuite'
		                }
		                log.debug('urlAD',urlAD)
				    	var responseService = https.post({
						    url: urlAD,
							body : JSON.stringify(obj_detail[0]),
							headers: {
				     			"Content-Type": "application/json"
				     		}
				   	    }).body;
				    	var responseService = JSON.parse(responseService)
				    	log.debug('responseService',responseService)
			    	}else{
			    		log.debug('No cumple con los filtros para enviar a BND')
			    	}
			    	
			    	try{//ENVIO LMS

			    	}catch(e){

			    	}
			    	

	    		}
        	}catch(e){
        		log.debug('Error envio de datos a BND',e)
        	}
    		if(scriptContext.type == 'edit'){

        		log.debug('old',oldrecord.getValue('isinactive'))
        		if(oldrecord.getValue('isinactive') != thisRecord.getValue('isinactive')){
        			sendRequest({
            			'isinactive':thisRecord.getValue('isinactive'),
            			'IDU':thisRecord.getValue('id'),
            			'employeetype':thisRecord.getValue('employeetype')
            		});
        		}
    		}
    		if(scriptContext.type == 'xedit'){
        		
        		log.debug('old',oldrecord.getValue('isinactive'))
        		if(oldrecord.getValue('isinactive') != thisRecord.getValue('isinactive')){
        			
        			log.debug('OLD','IDU '+oldrecord.getValue('id')+' TYPE '+oldrecord.getValue('employeetype')+' INACTIVE '+oldrecord.getValue('isinactive'))
        			log.debug('NEW','IDU '+thisRecord.getValue('id')+' TYPE '+thisRecord.getValue('employeetype')+' INACTIVE '+thisRecord.getValue('isinactive'))
        			sendRequest({
            			'isinactive':thisRecord.getValue('isinactive'),
            			'IDU':oldrecord.getValue('id'),
            			'employeetype':oldrecord.getValue('employeetype')
            		});
        		}
    		}


    	}catch(err){
    		log.error("error after submit",err)
    	}
    	
    	return true
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
					log.debug("info aman",procesURL[x]);
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
		            log.debug("info to send headers",headers)
		            log.debug("info to send obj_to_send prev",obj_to_send)
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
		                log.debug('data post http',data);
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
