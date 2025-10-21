/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/http','N/https','N/encode','N/runtime','N/ui/serverWidget','N/format'],

	function(record,search,http,https,encode,runtime,serverWidget,format) {
	   
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
			/*if(scriptContext.type == 'create' || scriptContext.type == 'edit'){
				updateBirthday(scriptContext)
			}*/
			if(scriptContext.type == 'edit'){
				gutm(scriptContext)
			}
			try{
				
				var thisRecord = scriptContext.newRecord;
				var oldrecord = scriptContext.oldRecord;
				var internalid = thisRecord.getValue('id')   
				try{
					//Asignar la fecha de entrega de CSF cuando se marca el check de entregó CSF
					if(scriptContext.type == 'edit' || scriptContext.type == 'xedit'){
						var entregoCSFNew = thisRecord.getValue('custentity_entrego_csf') 
						var entregoCSFOld = oldrecord.getValue('custentity_entrego_csf') 
						if(entregoCSFNew != entregoCSFOld && entregoCSFNew == true){
							var busqueda = search.load({
								id: 'customsearch_entrego_csf'
							});
							busqueda.filters.push(search.createFilter({
								name: 'internalid',
								operator: 'is',
								values: internalid
							}));
							busqueda.run().each(function(r){
								var todo = r.getAllValues();
								log.debug('resultados busqueda csf',todo)
								var fechaEntrega = todo["MAX(systemNotes.date)"].split(' ')
								log.debug('fechaEntrega',fechaEntrega[0])
	
								var submitFields = record.submitFields({
									type: 'employee',
									id: internalid,
									values: {'custentity_fecha_entrega_csf':fechaEntrega[0]}
								});
								
								return true;
							});
						}
						
					}
				}catch(e){
					log.error('error set fecha de entreg csf',e)
				}
				try{
					//Fuerza de ventas bajo demanda
					if(scriptContext.type == 'edit' || scriptContext.type == 'xedit'){ 
	
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
								['employeetype','anyof',[1,3,5,8,9]]
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
							var area_manager = getEmployeeData(obj_detail[0].area_manager,'AM / BDM')
							obj_detail[0].estructura.push(area_manager)
						}
						if(obj_detail[0].gerente != '' ){
							var obj_gerente = getEmployeeData(obj_detail[0].gerente,'GV/SrTL')
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
	
	
						
	
	
							//1 Notificacion a LMS y AD de cambio de status inactive
							
							log.debug('JSON send AD estatus de inactivo',obj_detail)
							
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
							log.debug('responseService AD del estatus inactivo',responseService)
	
	
							try{//ENVIO LMS
								log.debug('envío a lms del estatus de inactivo',search_obj_detailLMS)
								if(runtime.envType != 'PRODUCTION'){ 
									urlLMS = 'https://api-referidos-thrmx.lms-la.com/api/fuerzaVentas'
									key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjhhMDJkZDE3LTYzMjAtNGFiMi1iOWFkLWZlZDMzZWRhYzNiNiIsInN1YiI6InZzaWx2YWNAbG1zLmNvbS5teCIsImVtYWlsIjoidnNpbHZhY0BsbXMuY29tLm14IiwidW5pcXVlX25hbWUiOiJ2c2lsdmFjQGxtcy5jb20ubXgiLCJqdGkiOiI4MjEwMDk4MC0zMDNjLTRlMDktYjM1NS0xMGM5N2ViNWU0ZjkiLCJuYmYiOjE2NzgyMjYzNTYsImV4cCI6MTcwOTg0ODc1NiwiaWF0IjoxNjc4MjI2MzU2fQ.CetagLsFKPT9_kj50JrzOemPHUw4FID7uzEs7AYC3WlkiE5S1VJdhURTlTc4XWeX2-An6P5SzQPlCZtvM-WJrQ'
								}else{//prod
									urlLMS = 'https://api.recomiendayganathermomix.mx/api/fuerzaVentas'
									key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjIyMWFmN2U5LTJjMDAtNDYzZC1hYzliLThkZDA2MzhmYzYzMSIsInN1YiI6InRocm14Lm5ldHN1aXRlLmFwaUBsbXMtbGEuY29tIiwiZW1haWwiOiJ0aHJteC5uZXRzdWl0ZS5hcGlAbG1zLWxhLmNvbSIsInVuaXF1ZV9uYW1lIjoidGhybXgubmV0c3VpdGUuYXBpQGxtcy1sYS5jb20iLCJqdGkiOiJkMDdkZmJhNy04MjA1LTRkZjYtODdlMS0xZDE2YmUyYTAwOTMiLCJuYmYiOjE3MzYyMTMwNzAsImV4cCI6MTc2Nzc0OTA3MCwiaWF0IjoxNzM2MjEzMDcwfQ.4lCT7MyZ1OPFQhO6opfc1lEUyz-nyDpmE7_ZNVdwbvIIanlzuWIoD5XzjTnojLFO6EThVieiOiPUl7EhqrhkNg'
								}
								var responseService = https.put({
									url: urlLMS,
									body : JSON.stringify(search_obj_detailLMS),
									headers: {
										 "Content-Type": "application/json",
										 "Authorization": key
									 }
								   }).body;
								var responseService = JSON.parse(responseService)
								log.debug('responseService LMS del estatus inactivo',responseService)
							}catch(e){
								log.debug('Error envio de datos a LMS',e)
							}
							
	
							//2 Flujo de reasignacion de clientes del presentador inactivo
							if(newInactive == true){
	
								var newSalesRepF = getNewSalesRep(thisRecord.getValue('id'),liderEquipo,gerenteVentas)//id presentador , lider de equipo, Gerente de ventas
								
								var newSalesRep = newSalesRepF.id
								var newIDUSalesRep = newSalesRepF.idu
								var correoPresentador = newSalesRepF.email
								
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
										var busquedaCustomer = result.getAllValues()
	
										//Datos del cliente a actualizar presentador
	
										var idCust = result.getValue('internalid')
										var stage = result.getValue('formulatext')
	
										var nombre = result.getValue('altname')
										var correo = result.getValue('email')
										var telefono = result.getValue('mobilephone')
										var activo = result.getValue('isinactive')==false?true:false
										var checkReferidos = result.getValue('custentity_presentadora_referido')
	
										//Datos del Recomendador del cliente 
	
										var nombreQuienRecomienda = result.getValue({name : 'altname',join : 'custentity_id_cliente_referido'})!=''?result.getValue({name : 'altname',join : 'custentity_id_cliente_referido'}):false
										var correoQuienRecomienda = result.getValue({name : 'email',join : 'custentity_id_cliente_referido'})!=''?result.getValue({name : 'email',join : 'custentity_id_cliente_referido'}):false
										var telefonoQuienRecomienda = result.getValue({name : 'mobilephone',join : 'custentity_id_cliente_referido'})
	
									
										
										
										if(checkReferidos != '' && checkReferidos ){
											
											idCustomer = record.submitFields({
												type   : 'customer',
												id     : idCust,
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
											  
	
											if (idCustomer){
	
	
												try{
	
													//var nameFormat = req_info.nombre+" "+req_info.apellidos // cambiar por variables
													nameFormat = quitarAcentos(nombre)//Traer funcion quitar acentos
													
													
	
													
	
													var urlAD
													if(runtime.envType != 'PRODUCTION'){ 
														urlAD = 'https://dev-apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
													}else{
														urlAD = 'https://apiagenda.mxthermomix.com/users/registerUserExternoNetsuite'
													}
	
													if(nombreQuienRecomienda && correoQuienRecomienda){
														var objAD = {
															'nombre': nameFormat,
															'correo': correo,
															'telefono': telefono?telefono:'',
															'activo': activo,
															'nombreQuienRecomienda': quitarAcentos(nombreQuienRecomienda),
															'correoQuienRecomienda': correoQuienRecomienda,
															'PresentadorAsignadoCorreo': correoPresentador,
															'PresentadorAsignadoIDU': newIDUSalesRep,
															'telefonoQuienRecomienda':telefonoQuienRecomienda?telefonoQuienRecomienda:'',//Espera de LMS
															'NetSuiteID':idCust,
															'Semilla': false
														}
														log.debug('objAD actualizar customer '+idCust,objAD)
														var responseService = https.post({
														url: urlAD,
														body : objAD,//JSON.stringify(
														headers: {
															"Content-Type": "application/x-www-form-urlencoded",
															"User-Agent": "NetSuite/2019.2(SuiteScript)",
														}
													}).body;
													log.debug('responseService AD actualizar customer '+idCust,responseService)
													}else{
														var objAD = {
															'nombre': nameFormat,
															'correo': correo,
															'telefono': telefono?telefono:'',
															'activo': activo,
															'nombreQuienRecomienda': '',
															'correoQuienRecomienda': '',
															'PresentadorAsignadoCorreo': correoPresentador,
															'PresentadorAsignadoIDU': newIDUSalesRep,
															'telefonoQuienRecomienda':'',//Espera de LMS
															'NetSuiteID':idCust,
															'Semilla': true
														}
														log.debug('objAD actualizar customer '+idCust,objAD)
														var responseService = https.post({
														url: urlAD,
														body : objAD,//JSON.stringify(
														headers: {
															"Content-Type": "application/x-www-form-urlencoded",
															"User-Agent": "NetSuite/2019.2(SuiteScript)",
														}
														}).body;
													log.debug('responseService AD actualizar customer '+idCust,responseService)
													}
											   
	
												}catch(e){
													log.debug('Error Agenda digital Referidos restlet',e)
												   }
												   var objLMS ={
	
												  "idCliente": idCust,
	
												  "salesrep": newSalesRep ,
	
												  "idUsalesRep": newIDUSalesRep
	
												}
	
												log.debug('envío a lms actualizar customer '+idCust,objLMS)
												if(runtime.envType != 'PRODUCTION'){ 
													urlLMS = 'https://api-referidos-thrmx.lms-la.com/api/Cliente/actualizar-presentador'
													key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjhhMDJkZDE3LTYzMjAtNGFiMi1iOWFkLWZlZDMzZWRhYzNiNiIsInN1YiI6InZzaWx2YWNAbG1zLmNvbS5teCIsImVtYWlsIjoidnNpbHZhY0BsbXMuY29tLm14IiwidW5pcXVlX25hbWUiOiJ2c2lsdmFjQGxtcy5jb20ubXgiLCJqdGkiOiI4MjEwMDk4MC0zMDNjLTRlMDktYjM1NS0xMGM5N2ViNWU0ZjkiLCJuYmYiOjE2NzgyMjYzNTYsImV4cCI6MTcwOTg0ODc1NiwiaWF0IjoxNjc4MjI2MzU2fQ.CetagLsFKPT9_kj50JrzOemPHUw4FID7uzEs7AYC3WlkiE5S1VJdhURTlTc4XWeX2-An6P5SzQPlCZtvM-WJrQ'
												}else{//prod
													urlLMS = 'https://api.recomiendayganathermomix.mx/api/Cliente/actualizar-presentador'
													key = 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjIyMWFmN2U5LTJjMDAtNDYzZC1hYzliLThkZDA2MzhmYzYzMSIsInN1YiI6InRocm14Lm5ldHN1aXRlLmFwaUBsbXMtbGEuY29tIiwiZW1haWwiOiJ0aHJteC5uZXRzdWl0ZS5hcGlAbG1zLWxhLmNvbSIsInVuaXF1ZV9uYW1lIjoidGhybXgubmV0c3VpdGUuYXBpQGxtcy1sYS5jb20iLCJqdGkiOiJkMDdkZmJhNy04MjA1LTRkZjYtODdlMS0xZDE2YmUyYTAwOTMiLCJuYmYiOjE3MzYyMTMwNzAsImV4cCI6MTc2Nzc0OTA3MCwiaWF0IjoxNzM2MjEzMDcwfQ.4lCT7MyZ1OPFQhO6opfc1lEUyz-nyDpmE7_ZNVdwbvIIanlzuWIoD5XzjTnojLFO6EThVieiOiPUl7EhqrhkNg'
												}
												var responseService = https.put({
													url: urlLMS,
													body : JSON.stringify(objLMS),
													headers: {
														"Content-Type": "application/json",
														"Authorization": key
													}
												}).body;
												var responseService = JSON.parse(responseService)
												log.debug('responseService LMS actualizar customer ' +idCust,responseService)
											}
	
										}
										
										return true;
									});
								});
	
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
			var correoPresentador
	
	
	
	
	
			if (liderEquipo != "") {
	
				var leFields = search.lookupFields({
					type: 'employee',
					id: liderEquipo,
					columns: ["employeetype", "custentity_promocion", "isinactive","entityid","firstname", "email", "mobilephone"]
				});
	
				var typele = leFields.employeetype[0].value;
				var promole = leFields.custentity_promocion[0].value;
				var inactivele =leFields.isinactive;
				var iduLE = leFields.entityid;
				var nombreLE= leFields.firstname;
				var emailLE = leFields.email;
				var telefonoLE = leFields.mobilephone;
	
	
			}
			if( gerenteVentas != '' ) {
	
				var gvFields = search.lookupFields({
					type: 'employee',
					id: gerenteVentas,
					columns: ["employeetype", "custentity_promocion", "isinactive","entityid","firstname", "email", "mobilephone"]
				});
	
				var typeGV = gvFields.employeetype[0].value;
				var promoGV = gvFields.custentity_promocion[0].value;
				var inactiveGV =gvFields.isinactive;
				var iduGV = gvFields.entityid;
				var nombreGV= gvFields.firstname;
				var emailGV = gvFields.email;
				var telefonoGV = gvFields.mobilephone;
	
	
			}
				
			   
				if(typele == 3 && promole != 3 && inactivele == false){// se asigna del lider de equipo si cumple con = Lider de equipo / No es litigio / es activo
					
					idSalesRep = liderEquipo
					iduSalesRep = iduLE
					correoPresentador = emailLE
	
				} else if (typeGV == 5 && promoGV != 3 && inactiveGV == false) { // se asigna el GV si cumple con = Gerente de Ventas / No es litigio / es activo
				   
					idSalesRep = gerenteVentas
					iduSalesRep = iduGV
					correoPresentador = emailGV
				} else {// se asigna presentador de toda la fuerza de ventas
	
					var presentadorNuevo = presentadorAleatorio()
					
					idSalesRep = presentadorNuevo.internalid_p
					iduSalesRep = presentadorNuevo.idu_p
				}
				log.debug('idSalesRep nuevo asignado',idSalesRep)
				log.debug('iduSalesRep nuevo asignado',iduSalesRep)
	
			return {id: idSalesRep, idu: iduSalesRep, email: correoPresentador }
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
				//log.debug("runtime.envType",runtime.envType);
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
				log.debug('fecha',fecha)
				var auxF = fecha.split('/')
				//log.debug('parseInt(auxF[0]) ',auxF[0] )
				//log.debug('parseInt(auxF[1]) ',auxF[1] )
				//log.debug('parseInt(auxF[2]) ',auxF[2] )
				//log.debug('auxF',auxF)
				var today = new Date();
				var dd = auxF[0]
				var mm = auxF[1]
				var yyyy = auxF[2]
				
			   
			   
				if(mm.length <  2){
					log.debug('mm',mm )
					mm = '0'+mm
				}
				if(dd.length < 2 ){
					 log.debug('dd',dd )
					dd = '0'+dd
				}
				fdate = yyyy + '-' +mm + '-' + dd;
				log.debug('fdate',fdate)
			}
			
	
			return fdate;
		}
		 function quitarAcentos(cadena){
			 if(cadena){
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
			 }else{
				 return false
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
		function extractBirthdayFromCurpOrRfc(curp, rfc) {
			try {
				var dateString = '';
				
				// Intentar extraer del CURP primero (posiciones 4-9: AAMMDD)
				if (curp && curp.length >= 10) {
					var curpYear = curp.substring(4, 6);
					var curpMonth = curp.substring(6, 8);
					var curpDay = curp.substring(8, 10);
					
					// Validar que sean numeros
					if (!isNaN(curpYear) && !isNaN(curpMonth) && !isNaN(curpDay)) {
						// Determinar el siglo (si es menor a 50, es 20xx, si es mayor o igual a 50, es 19xx)
						var fullYear = parseInt(curpYear) < 50 ? '20' + curpYear : '19' + curpYear;
						// Formato D/M/YYYY (sin ceros a la izquierda)
						dateString = parseInt(curpDay, 10) + '/' + parseInt(curpMonth, 10) + '/' + fullYear;
						
						log.debug('Fecha extraida del CURP', {
							curp: curp,
							curpYear: curpYear,
							curpMonth: curpMonth,
							curpDay: curpDay,
							fullYear: fullYear,
							dateString: dateString
						});
					} else {
						log.debug('CURP contiene caracteres no numericos en posiciones de fecha', {
							curp: curp,
							curpYear: curpYear,
							curpMonth: curpMonth,
							curpDay: curpDay
						});
					}
				}
				
				// Si no se pudo extraer del CURP, intentar con RFC (posiciones 4-9: AAMMDD)
				if (!dateString && rfc && rfc.length >= 10) {
					var rfcYear = rfc.substring(4, 6);
					var rfcMonth = rfc.substring(6, 8);
					var rfcDay = rfc.substring(8, 10);
					
					// Validar que sean numeros
					if (!isNaN(rfcYear) && !isNaN(rfcMonth) && !isNaN(rfcDay)) {
						// Determinar el siglo (si es menor a 50, es 20xx, si es mayor o igual a 50, es 19xx)
						var fullYear = parseInt(rfcYear) < 50 ? '20' + rfcYear : '19' + rfcYear;
						// Formato D/M/YYYY (sin ceros a la izquierda)
						dateString = parseInt(rfcDay, 10) + '/' + parseInt(rfcMonth, 10) + '/' + fullYear;
						
						log.debug('Fecha extraida del RFC', {
							rfc: rfc,
							rfcYear: rfcYear,
							rfcMonth: rfcMonth,
							rfcDay: rfcDay,
							fullYear: fullYear,
							dateString: dateString
						});
					} else {
						log.debug('RFC contiene caracteres no numericos en posiciones de fecha', {
							rfc: rfc,
							rfcYear: rfcYear,
							rfcMonth: rfcMonth,
							rfcDay: rfcDay
						});
					}
				}
				
				// Validar que se obtuvo una fecha
				if (dateString) {
					// Validar que el mes esté entre 1-12 y el día entre 1-31
					var parts = dateString.split('/');
					var day = parseInt(parts[0], 10);
					var month = parseInt(parts[1], 10);
					var year = parseInt(parts[2], 10);
					
					log.debug('Validando fecha extraida', {
						dateString: dateString,
						parts: parts,
						day: day,
						month: month,
						year: year,
						isDayValid: !isNaN(day),
						isMonthValid: !isNaN(month),
						isYearValid: !isNaN(year)
					});
					
					if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
						month >= 1 && month <= 12 && day >= 1 && day <= 31) {
						log.debug('Fecha de cumpleanos valida extraida', {
							dateString: dateString,
							day: day,
							month: month,
							year: year
						});
						return dateString;
					} else {
						log.debug('Fecha extraida con mes/dia invalido', {
							dateString: dateString,
							day: day,
							month: month,
							year: year,
							isDayValid: !isNaN(day),
							isMonthValid: !isNaN(month),
							isYearValid: !isNaN(year)
						});
						// Reset dateString para que no se considere como extraida exitosamente
						dateString = '';
					}
				}
				
				// Solo mostrar este log si no se pudo extraer ninguna fecha
				if (!dateString) {
					log.debug('No se pudo extraer fecha de cumpleanos', {
						curp: curp,
						rfc: rfc
					});
				}
				
				return null;
				
			} catch (error) {
				log.error('Error extrayendo fecha de cumpleanos', {
					curp: curp,
					rfc: rfc,
					error: error
				});
				return null;
			}
		}
		function updateEmployeeBirthdayField(employeeId, birthdayDateString, hiredate) {
			try {
				log.debug('Actualizando campo de cumpleanos', {
					employeeId: employeeId,
					birthdayDateString: birthdayDateString,
					hiredate: hiredate
				});
				
				// Convertir el string de fecha a objeto Date usando N/format
				var birthdayDate = format.parse({
					value: birthdayDateString,
					type: format.Type.DATE
				});
				
				log.debug('Fecha convertida', {
					originalString: birthdayDateString,
					convertedDate: birthdayDate
				});
				
				// Extraer el mes de la fecha de cumpleaños
				var birthMonth = birthdayDate.getMonth() + 1; // getMonth() retorna 0-11, sumamos 1 para obtener 1-12
				
				log.debug('Mes de cumpleaños extraído', {
					birthMonth: birthMonth
				});
				
				// Preparar los valores a actualizar
				var updateValues = {
					'custentity_cumpleanios_dev': birthdayDate,
					'custentity_mes_cumpleanios': parseInt(birthMonth)
				};
				
				// Si hay fecha de contratación, extraer el mes y agregarlo a los valores
				if (hiredate) {
					var hireDateObj = format.parse({
						value: hiredate,
						type: format.Type.DATE
					});
					
					var hireMonth = hireDateObj.getMonth() + 1; // getMonth() retorna 0-11, sumamos 1 para obtener 1-12
					
					log.debug('Mes de contratación extraído', {
						hiredate: hiredate,
						hireDateObj: hireDateObj,
						hireMonth: hireMonth
					});
					
					updateValues['custentitymes_hiredate'] = parseInt(hireMonth);
				}
				
				// Actualizar los campos usando submitFields
				var recordId = record.submitFields({
					type: record.Type.EMPLOYEE,
					id: employeeId,
					values: updateValues
				});
				
				log.debug('Campos de cumpleanos y contratación actualizados exitosamente', {
					employeeId: employeeId,
					newBirthdayValue: birthdayDate,
					newMonthValue: birthMonth,
					newHireMonthValue: hiredate ? updateValues['custentitymes_hiredate'] : 'No disponible',
					recordId: recordId
				});
				
			} catch (error) {
				log.error('Error actualizando campos de cumpleanos y contratación', {
					employeeId: employeeId,
					birthdayDateString: birthdayDateString,
					hiredate: hiredate,
					error: error
				});
			}
		}
		function updateBirthday(scriptContext){
			try{
				log.debug('updateBirthday')
				var rec = scriptContext.newRecord;
				var emp = rec.getValue('id')
				var typeEvent = runtime.executionContext;
				
					
					var employee = search.lookupFields({
						type: 'employee',
						id: emp,
						columns: ['custentity_cumpleanios_dev','custentity_mes_cumpleanios','custentitymes_hiredate','custentity_curp','custentity_ce_rfc','hiredate']
					});
					log.debug('employee',employee)
					var birthday = employee.custentity_cumpleanios_dev
					var birthdayMonth = employee.custentity_mes_cumpleanios
					var meshiredate = employee.custentitymes_hiredate
					var curp = employee.custentity_curp
					var rfc = employee.custentity_ce_rfc
					var hiredate = employee.hiredate
					log.debug('birthday',birthday)
					log.debug('birthdayMonth',birthdayMonth)
					log.debug('meshiredate',meshiredate)
					if(birthday == '' || birthdayMonth == '' || meshiredate == ''){
						var birthdayDateString = extractBirthdayFromCurpOrRfc(curp, rfc);
						if (birthdayDateString) {
							updateEmployeeBirthdayField(emp, birthdayDateString, hiredate);
						}
					}else{
						log.debug('hay cumpleaños o contratacion')
					}
				
					
			}catch(e){
				log.error('error updateBirthday',e)
			}
		}
		/**
		 * Función para concatenar órdenes de manera inteligente
		 * @param {String} ordenesExistentes - Órdenes ya existentes en el campo
		 * @param {String} nuevasOrdenes - Nuevas órdenes a agregar
		 * @returns {String} - Órdenes concatenadas correctamente
		 */
		function concatenarOrdenes(ordenesExistentes, nuevasOrdenes) {
			try {
				// Convertir a string y limpiar espacios
				var existentes = (ordenesExistentes || '').toString().trim();
				var nuevas = (nuevasOrdenes || '').toString().trim();
				
				// Si no hay órdenes nuevas, devolver las existentes
				if (!nuevas) {
					return existentes;
				}
				
				// Si no hay órdenes existentes, devolver las nuevas
				if (!existentes) {
					return nuevas;
				}
				
				// Dividir por comas y limpiar espacios
				var ordenesArray = existentes.split(',').map(function(orden) {
					return orden.trim();
				}).filter(function(orden) {
					return orden !== ''; // Filtrar elementos vacíos
				});
				
				var nuevasArray = nuevas.split(',').map(function(orden) {
					return orden.trim();
				}).filter(function(orden) {
					return orden !== ''; // Filtrar elementos vacíos
				});
				
				// Agregar las nuevas órdenes evitando duplicados
				for (var i = 0; i < nuevasArray.length; i++) {
					var nuevaOrden = nuevasArray[i];
					if (ordenesArray.indexOf(nuevaOrden) === -1) {
						ordenesArray.push(nuevaOrden);
					}
				}
				
				// Unir con comas
				var resultado = ordenesArray.join(',');
				
				log.debug('concatenarOrdenes - Resultado', {
					ordenesExistentes: existentes,
					nuevasOrdenes: nuevas,
					resultado: resultado
				});
				
				return resultado;
				
			} catch (error) {
				log.error('Error en concatenarOrdenes', {
					ordenesExistentes: ordenesExistentes,
					nuevasOrdenes: nuevasOrdenes,
					error: error
				});
				// En caso de error, intentar concatenación simple
				return (ordenesExistentes || '') + ',' + (nuevasOrdenes || '');
			}
		}
	
		function gutm(scriptContext){
			try{
				// Validación inicial de usuario
				var objUser = runtime.getCurrentUser();
				var currentUserId = objUser.id;
				
				log.debug('gutm - Usuario actual', currentUserId);
				
				
					
					var newRecord = scriptContext.newRecord;
					var oldRecord = scriptContext.oldRecord;
					var employeeId = newRecord.getValue('id');
					var nombrePrograma = newRecord.getValue('custentity_nombre_programa');
					var nombreProgramaOld = oldRecord.getValue('custentity_nombre_programa');
					var ordenesGutm = newRecord.getValue('custentity_ovs_ep7');
					var ordenesAExcluir = newRecord.getValue('custentity_ordenes_a_excluir');
					var inactive = newRecord.getValue('isinactive');
					var eptm7 = newRecord.getValue('custentity_checkbox_eptm7');
					log.debug('gutm - inactive', inactive);
					// Obtener el valor del campo custentity124
					var ganaTmRecordId = newRecord.getValue('custentity124');
					
					log.debug('gutm - Valor actual custentity124', ganaTmRecordId);
					
					// Crear nuevo registro si custentity124 está vacío O si cambió el nombre del programa
					if((!ganaTmRecordId || ganaTmRecordId === '' || nombrePrograma != nombreProgramaOld) && eptm7 === true) {
						// Crear nuevo registro customrecord_gana_tm
						
						// Validar si el employee está inactivo y activarlo temporalmente
						var wasInactive = false;
						if(inactive === true) {
							wasInactive = true;
							log.debug('gutm - Employee inactivo, activando temporalmente', employeeId);
							record.submitFields({
								type: record.Type.EMPLOYEE,
								id: employeeId,
								values: {
									isinactive: false
								}
							});
						}
						
						var newGanaTmRecord = record.create({
							type: 'customrecord_gana_tm',
							isDynamic: false,
						});
						
						// Establecer los campos del nuevo registro con los valores del employee
						newGanaTmRecord.setValue('custrecord_presentador_id', employeeId);
						newGanaTmRecord.setValue('custrecord_start_date', newRecord.getValue('custentity_fcha_inicio_eptm7'));
						newGanaTmRecord.setValue('custrecord_end_date', newRecord.getValue('custentity_fcha_fin_eptm7'));
						newGanaTmRecord.setValue('custrecord_status_program', newRecord.getValue('custentity_estatus_eptm7'));
						newGanaTmRecord.setValue('custrecord_id_so_gaadora', newRecord.getValue('custentity_so_ganotm7'));
						newGanaTmRecord.setValue('custrecord_fecha_tm_ganadora', newRecord.getValue('custentity_fechatm7_ganada'));
						newGanaTmRecord.setValue('custrecord_list_ids_odv', newRecord.getValue('custentity_ovs_ep7'));
						newGanaTmRecord.setValue('custrecord_numero_ventas', newRecord.getValue('custentity_num_ventas_gutm'));
						newGanaTmRecord.setValue('custrecord_nombre_programa', newRecord.getValue('custentity_nombre_programa'));
						
						var newRecordId = newGanaTmRecord.save({enableSourcing: false,ignoreMandatoryFields: true});;
						
						log.debug('gutm - Nuevo registro creado con ID', newRecordId);
						
						// Si el employee estaba inactivo, volver a inactivarlo
						if(wasInactive === true) {
							log.debug('gutm - Volviendo a inactivar employee', employeeId);
							record.submitFields({
								type: record.Type.EMPLOYEE,
								id: employeeId,
								values: {
									isinactive: true
								}
							});
						}
						
						// Concatenar órdenes de manera inteligente
						var nuevasOrdenesAExcluir = concatenarOrdenes(ordenesAExcluir, ordenesGutm);
						
						// Actualizar el campo custentity124 del employee con el ID del nuevo registro
						record.submitFields({
							type: record.Type.EMPLOYEE,
							id: employeeId,
							values: {
								'custentity124': newRecordId,
								'custentity_ordenes_a_excluir': nuevasOrdenesAExcluir
							}
						});
						
						log.debug('gutm - Campo custentity124 actualizado con nuevo ID y órdenes concatenadas', {
							newRecordId: newRecordId,
							ordenesAnteriores: ordenesAExcluir,
							ordenesGutm: ordenesGutm,
							nuevasOrdenesAExcluir: nuevasOrdenesAExcluir
						});
						
					} else {
						// Verificar si algún campo ha cambiado
						var fieldsToCheck = [
							'custentity_fcha_inicio_eptm7',
							'custentity_fcha_fin_eptm7', 
							'custentity_estatus_eptm7',
							'custentity_so_ganotm7',
							'custentity_fechatm7_ganada',
							'custentity_ovs_ep7',
							'custentity_num_ventas_gutm'
						];
						
						var hasChanges = false;
						var changedFields = [];
						
						for(var i = 0; i < fieldsToCheck.length; i++) {
							var fieldName = fieldsToCheck[i];
							var oldValue = oldRecord.getValue(fieldName);
							var newValue = newRecord.getValue(fieldName);
							
							if(oldValue != newValue) {
								hasChanges = true;
								changedFields.push({
									field: fieldName,
									oldValue: oldValue,
									newValue: newValue
								});
							}
						}
						
						log.debug('gutm - Campos que han cambiado', changedFields);
						
						if(hasChanges) {
							// Actualizar el registro existente
							log.debug('gutm - Actualizando registro existente', ganaTmRecordId);
							
							var updateValues = {};
							updateValues['custrecord_start_date'] = newRecord.getValue('custentity_fcha_inicio_eptm7');
							updateValues['custrecord_end_date'] = newRecord.getValue('custentity_fcha_fin_eptm7');
							updateValues['custrecord_status_program'] = newRecord.getValue('custentity_estatus_eptm7');
							updateValues['custrecord_id_so_gaadora'] = newRecord.getValue('custentity_so_ganotm7');
							updateValues['custrecord_fecha_tm_ganadora'] = newRecord.getValue('custentity_fechatm7_ganada');
							updateValues['custrecord_list_ids_odv'] = newRecord.getValue('custentity_ovs_ep7');
							updateValues['custrecord_numero_ventas'] = newRecord.getValue('custentity_num_ventas_gutm');
							
							record.submitFields({
								type: 'customrecord_gana_tm',
								id: ganaTmRecordId,
								values: updateValues
							});
							
							log.debug('gutm - Registro actualizado exitosamente', ganaTmRecordId);
							
						} else {
							log.debug('gutm - No hay cambios en los campos monitoreados');
						}
					}
					
				
				
			}catch(e){
				log.error('error gutm',e)
			}
		}
		
		
		
		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
		
	});
	