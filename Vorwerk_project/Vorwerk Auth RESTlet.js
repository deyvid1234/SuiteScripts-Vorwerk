/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/file', 'N/http','N/format','N/encode','N/email'],

function(record,search,https,file,http,format,encode,email) {
   var date = new Date();
	var formatdate = format.parse({
		value: date,
		type: format.Type.DATE
	});
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
    	try{
    		log.debug("entre",requestParams);
    		
    		return "login was done via server script";
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
//    	var ret = processInformation(requestBody);
//    	return ret;
    	try{
    		var res = {};
    		log.debug("requestBody",requestBody);
    		var req_info= requestBody;
        	switch(req_info.type){
    			case "login":
    				res = getInformationUser(req_info,true)
    			break;
    			case "getItems":
    				res = searchItems()
    			break;
    			case "getSalesRep":
    				res = getSalesRep(req_info)
    			break;
    			//eventos de creacion
    			case "createCustomer":
    				res = createUser(req_info,"customer")
    			break;
    			case "createSalesRep":
    				res  = createUser(req_info,"employee")
    			break;
    			case "createSalesOrder":
    				res  = createSalesOrder(req_info)
    			break;
    			//eventos de modificacion
    			case "updateCustomer":
    				res  = updateUser(req_info,"customer")
    			break;
    			case "updateSalesRep":
    				res  = updateUser(req_info,"employee")
    			break;
    			case "updateSalesOrder":
    				res  = updateSalesOrder(req_info)
    			break;
    			case "getSalesOrderSerialNumber":
    				res = getSalesOrderSerialNumber(req_info);
    			break;
    			case "getOrderRepair":
    				res = getOrderRepair(req_info);
    			break;
    			
    		}
    	}catch(err){
    		log.error("error request",err);
    		return {'error':err};
    	}
    	log.debug("proceso funcional",res);
    	return res;
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
    
    var date_fields = {custentity_fcha_solicitud:true,custbody_fcha_entrega_tm5_cliente:true, custbody_fcha_entrega_tm5_cliente:true}
    
   
 
    /*************Inicio de funciones de lectura************************/
    //funcion para extraer informacion de usuario
  	function getInformationUser(req_info,valid){
		var cust = false,emp = {}, obj_ret = {};
		var valid_rfc= false;
		try{
			var filters = [];
			
			if(valid){
				for(var x in req_info){
					if(x != "type" && x != "rfc"){
						filters.push({
		                    name: x,
		                    operator: 'is',
		                    values: req_info[x]
		                });
					}
					if(x == "rfc"){
						valid_rfc = true;
					}
				}
			}else{
				log.debug('req_info user',req_info);
				filters.push({
                    name: 'email',
                    operator: 'is',
                    values: req_info
                });
			}
			if(valid_rfc){
				filters.push({
                    name: 'custentity_rfc',
                    operator: 'is',
                    values: req_info['rfc']
                });
			}
			soColumns = [
                { name: 'internalid' },
                { name: 'companyname' },
                { name: 'email'},
                { name: 'custentity_rfc'},
                { name: 'custentity_curp'},
                { name: 'isinactive'},
                { name: 'custentity_presentadora_referido'}

            ];

			var busqueda = search.create({
			    type: "customer",
			    columns: soColumns,
			    filters: filters
			});

			var presentadorReferidoAnterior = ''

			var pagedResults = busqueda.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                	if( (r.getValue("custentity_presentadora_referido") || presentadorReferidoAnterior == '') && cust != false ){
                        cust.user_id= r.getValue("internalid");
                        cust.name= r.getValue("companyname");
                        cust.email= r.getValue("email");
                        cust.rfc= r.getValue("custentity_rfc");
                        cust.curp= r.getValue("custentity_curp");
                        cust.inactive= r.getValue("isinactive");
                        presentadorReferidoAnterior = r.getValue("custentity_presentadora_referido");
                    }else if( cust == false){
                        cust = {}
                        cust.user_id= r.getValue("internalid");
                        cust.name= r.getValue("companyname");
                        cust.email= r.getValue("email");
                        cust.rfc= r.getValue("custentity_rfc");
                        cust.curp= r.getValue("custentity_curp");
                        cust.inactive= r.getValue("isinactive"); 

                        presentadorReferidoAnterior = r.getValue("custentity_presentadora_referido");
                    }
    			    return true;
                });
            });
            
			if(valid_rfc){
				filters.pop();
				filters.push({
                    name: 'custentity_ce_rfc',
                    operator: 'is',
                    values: req_info['rfc']
                });
			}
			var busqueda = search.create({
			    type: "employee",
			    columns: ['internalid','altname','email','custentity_ce_rfc','custentity_curp','isinactive'],
			    filters: filters
			});

			var pagedResults = busqueda.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                	emp.user_id= r.getValue("internalid");
    				emp.name= r.getValue("altname");
    				emp.email= r.getValue("email");
    				emp.rfc = r.getValue("custentity_ce_rfc");
    				emp.curp = r.getValue("custentity_curp");
    				emp.inactive = r.getValue("isinactive");
    			    return true;
                	
                	
                });
            });
			if(cust != false){
				if(Object.keys(cust).length){
					obj_ret.customer_information = cust;
				}
			}
			
			if(Object.keys(emp).length){
				obj_ret.sales_rep_information = emp;
			}
			return obj_ret
		}catch(err){
			log.error("error post",err)
			return obj_ret;
		}
  	}
    
    
    
    
  	//funcion para extraer los items 
    function searchItems(){
		try {
			var result = []
			var vendorBills = search.load({
	    		id: 'customsearch_item_location_available'
			});
			
			var pagedResults = vendorBills.runPaged();
			pagedResults.pageRanges.forEach(function (pageRange){
				var currentPage = pagedResults.fetch({index: pageRange.index});
				currentPage.data.forEach(function (r) {
					
					var values = r.getAllValues();
					log.debug('values',values)
					
					var stock = 0
					//Parche solo Septiebre/hasta liberar 100 Ermita -> Regresar a parseInt(values['custitem_disponible_eshop'])||0
					if(parseInt(values['custitem_disponible_eshop']) > 0){
						stock = parseInt(values['custitem_disponible_eshop'])
					}else{
						stock = parseInt(values['locationquantityavailable'])||0
					}

					var obj_aux = {
							internalid: r.getValue('internalid'),
							stock: stock,
							sku: values['itemid'],
							name: values['displayname']
					}
					
					//sandbox 58 //production 53
					result.push(obj_aux);
					
				})
			});
			
			email.send({
        		author: '344096',
				recipients: 'pilar.torres@thermomix.mx',//'pilar.torres@vorwerk.de',
				subject: 'Información de Items',
				body: JSON.stringify(result)
        	});
			
			return result;
		}catch(err){
			return {error:err}
			log.error('error searchItems', err);
		}
		
	}
    
    //funcion para extraer la informacion del representante de ventas
    
    function getSalesRep(req_info){
    	try{
    		var objRecord = record.load({
                type:  'employee',
                id: req_info['id'],
                isDynamic: false
            });
    		var fields = [
							"firstname",
							"lastname" ,
							"mobilephone",
							"email",
							"custentity_curp",
							"custentity_ce_rfc",
							"custentity60",
							"custentity_numcta",
							"custentity_num_serie_tm",
							"custentity_ban_prov"
    		             ]
    		var obj_return ={}
    		for(var x in fields){
    			obj_return[fields[x]]= objRecord.getValue(fields[x]);
    		}
    		var totalLines = objRecord.getLineCount({
                sublistId  : 'addressbook'
            });
    		var address_arr = [];
    		for(var i=0; i < totalLines; i++){
                var internalid = objRecord.getSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'id',
                    line: i
                });
                var id = objRecord.getSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'label',
                    line: i
                });
                var subRecord = objRecord.getSublistSubrecord({
                   sublistId : 'addressbook',
                   fieldId   : 'addressbookaddress',
                   line      : i
                });
                var country = subRecord.getText({
                    fieldId: 'country'
                });
                var addressee = subRecord.getValue({
                    fieldId: 'addressee'
                });
                var addrphone = subRecord.getText({
                    fieldId: 'addrphone'
                });
                var addr1 = subRecord.getValue({
                    fieldId: 'addr1'
                });
                var addr2 = subRecord.getValue({
                    fieldId: 'addr2'
                });
                var city = subRecord.getValue({
                    fieldId: 'city'
                });
                var state = subRecord.getValue({
                    fieldId: 'state'
                });
                var zip = subRecord.getValue({
                    fieldId: 'zip'
                });
                
                address_arr.push({
                	internalid : internalid,
                	id : id,
                	country : country,
                	addressee : addressee,
                	addrphone : addrphone,
                	addr1 : addr1,
                	addr2 : addr2,
                	city : city,
                	state : state,
                	zip : zip
                });
                
    		}
    		
    		obj_return['address']= address_arr;
    		return obj_return;
    		
    		
    	}catch(err){
    		log.error("error get sales rep",err);
    		return {error:"id no encontrado"}
    	}
    	
    }
    
    
    /*************Fin de funciones de lectura************************/
    
  	/***************incio de funciones de creacion**********/
  	//funcion para crear Clientes y Empleados
  	function createUser(req_info,type_user){
	  	try{
	  		var valid_to_create =getInformationUser(req_info.email,false);
	  		log.debug("valid_to_create",valid_to_create);
	  		if(Object.keys(valid_to_create).length >= 1 ){
		  		if("customer_information" in valid_to_create && type_user == "customer"){
		  			return {error:"El correo del cliente ya existe"}
		  		}
		  		if("sales_rep_information" in  valid_to_create && type_user == "employee"){
		  			return {error:"El correo del presentador ya existe"}
		  		}
	  		}

			var obj_user = record.create({
			  type: type_user,
			  isDynamic:true
			});
			var id_image ="", id_image_ide_anv= "", id_img_ide_rev="",id_img_domicilio="", id_img_banco="";
			if(type_user == "employee"){
			  obj_user.setValue('customform',-10);
			  obj_user.setValue('issalesrep',true);
			  log.debug('custentity_fecha_preregistro',formatdate)
			  obj_user.setValue('custentity_fecha_preregistro',formatdate);
			  //imagen de usuario
			  id_image = saveItemImage(req_info["custentity_foto"],30745,req_info["custentity_ce_rfc"]+"_presentador");
			  req_info["custentity_foto"] = id_image;
			  
			  
			  //imagen de identificacion anverso
			  id_image_ide_anv = saveItemImage(req_info["custentity_foto_ine_anverso"],30745,req_info["custentity_ce_rfc"]+"_presentador_identicicacion_anv");
			  req_info["custentity_foto_ine_anverso"] = id_image_ide_anv;
			  
			  
			  //imagen de identificacion reverso
			  id_img_ide_rev = saveItemImage(req_info["custentity_foto_ine_reverso"],30745,req_info["custentity_ce_rfc"]+"_presentador_identicicacion_rev");
			  req_info["custentity_foto_ine_reverso"] = id_img_ide_rev;
			  
			  
			  //imagen comprobante de domicilio 
			  id_img_domicilio = saveItemImage(req_info["custentity_foto_comprobante_dom"],30745,req_info["custentity_ce_rfc"]+"_presentador_domicilio");
			  req_info["custentity_foto_comprobante_dom"] = id_img_domicilio;
			  
			  
			  //imagen comprobante bancario
			  id_img_banco = saveItemImage(req_info["custentity_foto_comprobante_banco"],30745,req_info["custentity_ce_rfc"]+"_presentador_banco");
			  req_info["custentity_foto_comprobante_banco"] = id_img_banco;
			}else{
				
				obj_user.setValue({fieldId:'custentity_rfc',value:req_info["vatregnumber"]});
			}
			
			//seter information main
			for(var x in req_info){
			  	if(x != "address" ){
			  		if(x in date_fields){
			  			var fdate = parseDate(req_info[x]);
			  			obj_user.setValue(x,fdate); 
			  		}else{
			  			obj_user.setValue(x,req_info[x]); 
			  		}
				  	 
			  	}
			}
          	obj_user.setValue({fieldId:'language',value:"es_AR"});
			if('address' in req_info){
				//setter information address
				var address_info_arr = req_info["address"];
				for(var x in address_info_arr){
					var address_info = address_info_arr[x];
					obj_user.selectNewLine({
						sublistId:'addressbook'
					})
					obj_user.setCurrentSublistValue({
						sublistId:'addressbook',
						fieldId:'label',
						value:address_info.id
					})
					if(type_user != "employee"){
						obj_user.setCurrentSublistValue({
							sublistId:'addressbook',
							fieldId:'defaultbilling',
							value:address_info.defaultbilling
						})
						obj_user.setCurrentSublistValue({
							sublistId:'addressbook',
							fieldId:'defaultshipping',
							value:address_info.defaultshipping
						})
					}
					
					var addRec = obj_user.getCurrentSublistSubrecord({
					    sublistId:'addressbook',
					    fieldId:'addressbookaddress'
					})
					addRec.setValue({fieldId:'country',value:address_info.country})
					if(type_user == "employee"){
						addRec.setValue({fieldId:'addressee',value:req_info["firstname"]+" "+req_info["lastname"]})	
					}
					else {
						addRec.setValue({fieldId:'addressee',value:req_info["custentity_razon_social"]})
					}
					addRec.setValue({fieldId:'addrphone',value:address_info.addrphone})
					addRec.setValue({fieldId:'addr1',value:address_info.addr1})
					addRec.setValue({fieldId:'addr2',value:address_info.addr2})
					addRec.setValue({fieldId:'city',value:address_info.city})
					addRec.setValue({fieldId:'state',value:address_info.state})
					addRec.setValue({fieldId:'zip',value:address_info.zip})
					obj_user.commitLine({sublistId:'addressbook'})
				}
			}else{
				return {error:'address is necesary'}
			}
			
			var user_id = obj_user.save();
			return {success:user_id,type:type_user}
	  	}catch(err){
		  	log.error("Error create "+type_user,err)
		 	return {error:err}
	  	}
	  
    }
  	
  	//fincion para crear ODV
    function createSalesOrder(req_info){
    	try{
    		
    		var valid = searchODV(req_info.tranid)
    		if(!valid){
    			return {error:"Sales Order previously created"}
    		}
    		var odv_serial = {};
    		
    		if('serial_number' in req_info ){
    			if(req_info.serial_number != "" && req_info.serial_number != null){
    				odv_serial = searchODVbySerie(req_info.serial_number)
    				log.debug('odv_serial',odv_serial);
    				if('internalid' in odv_serial){
    					req_info['custbody_vw_odv_related_warranty'] = odv_serial.internalid;
    				}
    			}
    			if('extended_warranty_pdf_file' in req_info){
    				if(req_info.extended_warranty_pdf_file != "" && req_info.extended_warranty_pdf_file != null){
    					log.debug("viene con pdf","incicia proceso de transformacion");
    					//sandbox 288816
    					var id_pdf = savePDF(req_info.extended_warranty_pdf_file,326098,req_info.tranid);
    					if(id_pdf){
    						req_info['custbody_vw_pdf_warranty'] = id_pdf;
    					}
    				}
    			}
    		}
    		
    		
    		var discount_aux  = 0, total_amount_aux = 0,shipping_cost = {};
			var obj_sales_order = record.create({
                type : 'salesorder',
                isDynamic: true
			});
//			obj_sales_order.setValue({fieldId: 'orderstatus', value: 'B'});
			obj_sales_order.setValue("customform",105);
			if("discountrate" in req_info){
				if(parseFloat(req_info['discountrate']) > 0){
					for(var x in req_info.items){
						if(req_info.items[x].item_id != "859"){
							var item_to = req_info.items[x];
							total_amount_aux+= (parseFloat(item_to.amount)*parseInt(item_to.quantity));
						}else{
							shipping_cost = req_info.items[x];
						}
						
					}
					discount_aux = (parseFloat(req_info['discountrate'])/1.16)/total_amount_aux;
				
				}
			}
			
			log.debug('Info SAT',req_info['custbody_cfdi_metododepago']);
			var locationValidado 
			for(var x in req_info){
				if(x != "location" && x != "items" && x != "multipago" && x != "discountrate" && x != "discountitem" && x!= 'custbody_estatus_envio' && x != 'custbody46' && x != 'custbody_url_one_aclogistics' && x != 'custbody_url_two_aclogistics'){
					obj_sales_order.setValue(x,req_info[x]) 
				}
				log.debug(x,req_info[x])
				if((x == "location" || x == "Location")&& req_info[x] == 53){//Se asigna Ermita si viene con location Eshop
					locationValidado = 53 // 82 Cambiar a 82 en prod
					log.debug('primer if',locationValidado)
					obj_sales_order.setValue('location',locationValidado)
					obj_sales_order.setValue('custbody_so_eshop',true)
				}
				if(x == "location" || x == "Location"){//Si el location es diferente a Eshop asigna lo que manda tienda en linea
					locationValidado = req_info[x]
					log.debug('segundo if',locationValidado)
					obj_sales_order.setValue('location',locationValidado)
					obj_sales_order.setValue('custbody_so_eshop',true)
				}
			}
			obj_sales_order.setValue('custbody_cfdi_metpago_sat',req_info.custbody_cfdi_metododepago)
			
			var  salesorder_items = req_info.items;
			for(var x in salesorder_items){
				var item_mine = salesorder_items[x];
				var item_tax  = parseFloat(item_mine.amount)/1.16;
				if(item_tax == 0 ){
					item_tax = 0.01
				}
				
				obj_sales_order.selectNewLine({
						sublistId : 'item',
				});
				
				obj_sales_order.setCurrentSublistValue({
			        sublistId: 'item',
			        fieldId: 'item',
			        value: item_mine.item_id
				});
				obj_sales_order.setCurrentSublistValue({
			        sublistId: 'item',
			        fieldId: 'quantity',
			        value: item_mine.quantity
				});
				if (item_mine.item_id == '1441'){
					obj_sales_order.setCurrentSublistValue({
				        sublistId: 'item',
				        fieldId: 'price',
				        value: '-1'
					});	
				}
				obj_sales_order.setCurrentSublistValue({
			        sublistId: 'item',
			        fieldId: 'amount',
			        value: item_tax
				});
				obj_sales_order.setCurrentSublistValue({
			        sublistId: 'item',
			        fieldId: 'rate',
			        value: item_tax.toFixed(2)
				});
				obj_sales_order.setCurrentSublistValue({
			        sublistId: 'item',
			        fieldId: 'location',
			        value: locationValidado
				});
				obj_sales_order.commitLine({
			        sublistId: 'item'
			    });
				
				if(total_amount_aux > 0 && item_mine.item_id != "859"){
					var discount_item = parseFloat(item_mine.amount)*discount_aux*parseInt(item_mine.quantity);
//					log.debug('item_mine.amount',item_mine.amount);
//					log.debug('discount_aux',discount_aux);
					setItemDiscount(obj_sales_order,discount_item);
				}
			}

			var  salesorder_payment = req_info.multipago;
			
			try{
				var id_sales_order = obj_sales_order.save();
				if('internalid' in odv_serial){
					try{
						log.debug('odv_serial'+odv_serial.internalid,'id_sales_order'+id_sales_order);
						record.submitFields({
			                type: 'salesorder',
			                id: odv_serial.internalid,
			                values: {
			                	'custbody_vw_odv_warranty' : id_sales_order
		                	}
			            });
					}catch(err_serires){
						log.error('err_serires',err_serires);
					}
				}
				
				try{
					
					var description = getDescription(id_sales_order);
					var acLogistic =  {
							tracking		:req_info.custbody46,
							tracking_link	:req_info.custbody_url_one_aclogistics,
							guia			:req_info.custbody_url_two_aclogistics,
							status			:req_info.custbody_estatus_envio
					}
					
					
					var id_traking = createTraking(description,id_sales_order,acLogistic)
					log.debug("traking_id",id_traking);
					
				}catch(err_tracking){
					log.error('error create traking',err_tracking)
				}
				
			}catch(err_so){
				log.error("error err_so",err_so);
				return {error_order:err_so};
			}
			
			var id_payment = setPaymentMethod(id_sales_order, salesorder_payment, req_info.entity)
			try{
				var submitFields = record.submitFields({
	                type: record.Type.SALES_ORDER,
	                id: id_sales_order,
	                values: {'orderstatus':'B','custbody_vorwerk_contratos':id_payment.contract,'custbody_total_pagado':id_payment.total_payment}
	            });
	            log.debug('total in set',id_payment.total_payment)
	            log.debug('prueba 1 ',req_info.multipago.custbody_forma_tipo_de_pago)// == 222
	            log.debug('id_payment.contract',id_payment.contract)
				if(id_payment.contract && id_payment.contract != ''){

					var submitFields = record.submitFields({
		                type: record.Type.SALES_ORDER,
		                id: id_sales_order,
		                values: {'custbody_cfdi_formadepago':3}
		            });
				}
			}catch(e){
				log.error("error general","send info");
				return {error_payment:e};
			}
			
			return {success:id_sales_order,id_payment:id_payment} 
    	}catch(err){
    		log.error("error createSalesOrder",err);
    		return {error:err}
    	}
    }

    function setItemDiscount(obj_sales_order,discount_item){
    	try{
    		
    		var price_negative = discount_item*-1;
    		log.debug('price_negative',price_negative);
        	obj_sales_order.selectNewLine({
    				sublistId : 'item',
    		});
    		obj_sales_order.setCurrentSublistValue({
    	        sublistId: 'item',
    	        fieldId: 'item',
    	        value: 1876
    		});
    		obj_sales_order.setCurrentSublistValue({
    	        sublistId: 'item',
    	        fieldId: 'price',
    	        value: -1
    		});
    		obj_sales_order.setCurrentSublistValue({
    	        sublistId: 'item',
    	        fieldId: 'rate',
    	        value: price_negative.toFixed(2)
    		});
    		obj_sales_order.setCurrentSublistValue({
    	        sublistId: 'item',
    	        fieldId: 'amount',
    	        value: price_negative
    		});
    		obj_sales_order.commitLine({
    	        sublistId: 'item'
    	    });
    	}catch(err){
    		log.error("error set Discount",err);
    	}
    	
    	
    }
    
    
    function setPaymentMethod(id_transaction, info_payment,customer){
    	try{
    		if(info_payment.length >0){
    			var id_payment =[];
    			var num_authorization = [];
    			var total_payment = 0
        		for(var x in info_payment){

        			if(info_payment[x].custbody_forma_tipo_de_pago != 222){
	        			var obj_payment = record.create({
		                    type : 'customerpayment',
		                    isDynamic: true
		    			});

		        		obj_payment.setValue('customer',customer);
		        		obj_payment.setValue('custbody_mp_orden_venta_relacionada',id_transaction);
	        			for(var y in info_payment[x]){
	        				if(y == "custbody_forma_tipo_de_pago"){
	        					var tmp_tipo_pago = search.lookupFields({
	                                type: 'customrecord_forma_tipo_de_pago',
	                                id: info_payment[x][y],
	                                columns: ['custrecord_ref_pago_cuenta_bancaria']
	                            });
	        					log.debug('tmp_tipo_pago',tmp_tipo_pago);
	        					var id_account = tmp_tipo_pago.custrecord_ref_pago_cuenta_bancaria[0].value;
	        					obj_payment.setValue('account',id_account);
	        					obj_payment.setValue('custbody_forma_tipo_de_pago',info_payment[x][y]);
	        				}else if(y == "trandate"){
	        					obj_payment.setValue(y,parseDate(info_payment[x][y]))
	        				}else if(y=="ccexpiredate"){
	        					var ccexp = format.parse({value: info_payment[x][y], type: format.Type.CCEXPDATE})
	        					log.debug('-- ccexp'+y,ccexp);
	        					obj_payment.setValue(y,ccexp)
	        				}else{
	        					if (y == 'payment'){
		        					total_payment = total_payment+parseInt(info_payment[x][y])		        				
		        					}
	        					log.debug(y,info_payment[x][y]);
	        					obj_payment.setValue(y,info_payment[x][y])
	        				}
	        			}
	    				id_payment.push(obj_payment.save({ // Guarda el nuevo registro
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        }));
	    			}else{
        				num_authorization.push(info_payment[x].custbody_numero_autorizacion)
        				
        			}
    			
    			}
        		contract = num_authorization.join(',')
    			return {
    				id_payment: id_payment,
    				contract: contract,
    				total_payment:total_payment
    			}
    		}else{
    			return "no existe pago";
    		}
    		

    	}catch(err){
    		
    		log.debug("error set Payment",err);
    		return err.message;
    	}
    		
    }


    function saveItemImage(url, folder,name) {
        try{
        	
        	var credentials = 'thermomix:vorwerk2016';
            credentials = encode.convert({
                string: credentials,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            var headers = {
                "Authorization": "Basic " + credentials
            };
            
        	log.debug("url",url);
        	log.debug("folder",folder);
        	log.debug("name",name);
        	//folder 30745
            var fileTypes = {
                bmp     : 'BMPIMAGE',
                gif     : 'GIFIMAGE',
                ico     : 'ICON',
                jpg     : 'JPGIMAGE',
                jpeg     : 'JPGIMAGE',
                pjpeg   : 'PJPGIMAGE',
                png     : 'PNGIMAGE',
                tiff    : 'TIFFIMAGE'
            };
            if(!url){
                var object_info = new Object();
                return object_info;
            }
            
            if(url.indexOf('https') != -1){
                var data = https.get({
                    url : url,
                    headers: headers,
                }).body;
            }else{
                var data = http.get({
                    url : url,
                    headers: headers,
                }).body;
            }
            var fileType = "jpg";
            
            var my_file = file.create({
                name: name,
                fileType: 'JPGIMAGE',
                contents: data,
                folder: folder
            });
            var object_info = new Object();
            object_info.id = my_file.save();
            object_info.name = name;

            var fileObj = file.load({
                id: object_info.id
            });

            fileObj.isOnline = true;
            fileObj.save();

            log.debug('IMAGEN GUARDADA', object_info)
            return object_info.id;
            
        }catch(err){
            log.error('Error Utils Save Image', {url: url, error: err});
           
            return {};
        }
    }

    /***************fin de funciones de creacion**********/



    /***************incio de funciones de edicion**********/

    function updateUser(req_info,type_user){

    	try{
    		if(req_info["internalid"] != ""){
		    	var obj_user = record.load({
		                        type: type_user,
		                        id: req_info["internalid"],
		                        isDynamic: false
		                    });
		    	var id_image ="", id_image_ide_anv= "", id_img_ide_rev="",id_img_domicilio="",id_img_banco="";
				if(type_user == "employee"){
				  obj_user.setValue('customform',-10);
				  log.debug('custentity_fecha_preregistro',formatdate)
				  obj_user.setValue('custentity_fecha_preregistro',formatdate);
				  if("custentity_foto" in req_info){
				  		id_image = saveItemImage(req_info["custentity_foto"],30745,req_info["custentity_ce_rfc"]+"_presentador");
				  		req_info["custentity_foto"] = id_image;
				  }
				  if("custentity_foto_ine_anverso" in req_info){
					  	id_image_ide_anv = saveItemImage(req_info["custentity_foto_ine_anverso"],30745,req_info["custentity_ce_rfc"]+"_presentador_identicicacion_anv");
				  		req_info["custentity_foto_ine_anverso"] = id_image_ide_anv;
				  }
				  if("custentity_foto_ine_reverso" in req_info){
					  	id_img_ide_rev = saveItemImage(req_info["custentity_foto_ine_reverso"],30745,req_info["custentity_ce_rfc"]+"_presentador_identicicacion_rev");
				  		req_info["custentity_foto_ine_reverso"] = id_img_ide_rev;
				  }
				  if("custentity_foto_comprobante_dom" in req_info){
					  	id_img_domicilio = saveItemImage(req_info["custentity_foto_comprobante_dom"],30745,req_info["custentity_ce_rfc"]+"_presentador_domicilio");
				  		req_info["custentity_foto_comprobante_dom"] = id_img_domicilio;
				  }
					
				  if("custentity_foto_comprobante_banco" in req_info){
					    id_img_banco = saveItemImage(req_info["custentity_foto_comprobante_banco"],30745,req_info["custentity_ce_rfc"]+"_presentador_banco");
				  		req_info["custentity_foto_comprobante_banco"] = id_img_banco;
				  }
					 
				}else{
					
					obj_user.setValue({fieldId:'custentity_rfc',value:req_info["vatregnumber"]});
				}
		    	
				//seter information main
				for(var x in req_info){
				  	if(x != "address" ){
				  		if(x in date_fields){
				  			var fdate = parseDate(req_info[x]);
				  			obj_user.setValue(x,fdate); 
				  		}else{
				  			obj_user.setValue(x,req_info[x]); 
				  		}
					  	 
				  	}
				}
				if('address' in req_info){
					if(req_info['address'].length > 0){// en caso de existir direcciones 
						var num = obj_user.getLineCount({
			            	sublistId  : 'addressbook'
				        });
				        for(var x in req_info['address']){
			        		var valid_to_create = false;
			        		for(var i=0; i < num;i++){//compara las direcciones recibidas 
					        	var internalid = obj_user.getSublistValue({
					                sublistId : 'addressbook',
					                fieldId   : 'label',
					                line      : i
					            });
					        	if('newID' in req_info['address'][x]){
					        		obj_user.setSublistValue({
						                sublistId:'addressbook',
										fieldId:'label',
										value: req_info['address'][x]['newID'],
										line: i
						            });
					        		
					        	}
					        	
					            //log.debug('internalids','tengo :'+internalid+" comparo con "+req_info['address'][x].id);
					           
					            if(internalid == req_info['address'][x].id ){//dirección encontrada
					            	var address_info = req_info['address'][x];
					            	var subrec = obj_user.getSublistSubrecord({
				                        sublistId : 'addressbook',
				                        fieldId   : 'addressbookaddress',
				                        line      : i
				                    }); 
				                    if(type_user != "employee"){
					                    obj_user.setSublistValue({
											sublistId:'addressbook',
											fieldId:'defaultbilling',
											value:address_info.defaultbilling,
											line: i
										})
										obj_user.setSublistValue({
											sublistId:'addressbook',
											fieldId:'defaultshipping',
											value:address_info.defaultshipping,
											line: i
										})
				                    }
									
				                    for(var y in address_info){
				                    	subrec.setValue({fieldId:y,value:address_info[y]})
				                    }
				                    valid_to_create = false;
				                    break;
					            }else{
					            	valid_to_create = true; 
					            }
					        }
					        //log.debug('valid_to_create creare ','status: '+valid_to_create+'   '+internalid +" momento "+req_info['address'][x].id);
				        	if(valid_to_create){//en caso de recibir un id no existente en Netsuite crea una nueva direccion
				        		log.debug("valid to create")
				        		var address_info = req_info['address'][x];
				        		obj_user.insertLine({
					                sublistId: 'addressbook',
					                line: num
					            });
					            obj_user.setSublistValue({
					                sublistId:'addressbook',
									fieldId:'label',
									value:address_info.id,
									line: num
					            });
					            if(type_user != "employee"){
					        		obj_user.setSublistValue({
						                sublistId:'addressbook',
										fieldId:'defaultbilling',
										value:address_info.defaultbilling,
										line: num
						            });
					        		obj_user.setSublistValue({
						                sublistId:'addressbook',
										fieldId:'defaultshipping',
										value:address_info.defaultshipping,
										line: num
						            });
				        		}
				        		var addRec = obj_user.getSublistSubrecord({
								    sublistId:'addressbook',
								    fieldId:'addressbookaddress',
								    line: num
								})
				        		if(type_user == "employee"){
									addRec.setValue({fieldId:'addressee',value:req_info["firstname"]+" "+req_info["lastname"]})
								}else {
									addRec.setValue({fieldId:'addressee',value:req_info["custentity_razon_social"]})
								}
				        		var subrec = obj_user.getSublistSubrecord({
						                sublistId: 'addressbook',
						                fieldId: 'addressbookaddress',
						                line: num
						            });
				        		for(var y in address_info){
			                    	subrec.setValue({fieldId:y,value:address_info[y]})
			                    }
				        	}
				        }
					}
				}
				
		        
				var id_user = obj_user.save({ // Guarda el nuevo registro
				  	enableSourcing: true,
				  	ignoreMandatoryFields: true
				});

			 	return {success:id_user} 
    		}
        }catch(err){
    		log.error("Error updateUser",err);
    		return {error:err}
    	}

    }
    

    function updateSalesOrder(req_info){
    	try{
    		
    		var obj_sales_order= record.load({
                        type: 'salesorder',
                        id: req_info.internalid,
                        isDynamic: false,
                    });
    		for(var x in req_info){
    			if(x in date_fields){
    				var fdate = parseDate(req_info[x]);
    				obj_sales_order.setValue({
                        fieldId: x,
                        value: fdate
                    });
    			}else{
    				obj_sales_order.setValue({
                        fieldId: x,
                        value: req_info[x]
                    });
    			}
    			
    		}
    		var id_sales_order = obj_sales_order.save();
    		return {success:id_sales_order} 
    	}catch(err){
    		log.error("error updateSalesOrder",err);
    		return {error:err}
    	}

    }
    
    
    function parseDate(date_req){
    	try{
    		log.debug('date_req',date_req)
    		var fdate = format.parse({
                value: date_req,
                type: format.Type.DATE
            });
        	return fdate;
    	}catch(err){
    		log.debug("err parse Date",err);
    	}
    	
    }
    
    function searchODV(tranid){
    	try{
    		var valid = true;
    		if(tranid != ""){
                var busqueda = search.create({
                   type: 'salesorder',
                   columns: ['internalid'],
                   filters: [
                       ['tranid','is',tranid],'and',['mainline','is',true],
                   ]
                });
                busqueda.run().each(function(r){
                   valid = r.getValue('internalid');
                   return true;
                });
    		}
    		return valid == true?true:false;
    	}catch(err){
    		return false;
    		log.debug("err searchODV",err);
    	}
    }
    
    function getDescription(idSO){
    	try{
    		var apiKey = "",cont_trak = [], description = [],valid_tm = false, description_txt = "";
    		var objSO = record.load({
				type: record.Type.SALES_ORDER,
                id: idSO,
                isDynamic: false,
            });
    		
    		var itemLines = objSO.getLineCount({
	            sublistId  : 'item'
	        });
    		var description_aux = []
    		for(var i=0; i < itemLines; i++){
    			var itemId = objSO.getSublistValue({
                    sublistId : 'item',
                    fieldId   : 'item',
                    line      : i
                });
    			if(itemId != 1441 && itemId != 859){
	    			//valida si es la primer guia creada
	    			if(cont_trak.length == 0){
	    				if(itemId == 2001 || itemId == 2170 || itemId == 2571){//en caso de ser la primera y tener tm6 toma su decripcion
	    					description.push(objSO.getSublistValue({
	    	                    sublistId : 'item',
	    	                    fieldId   : 'description',
	    	                    line      : i
	    	                }));
	    					valid_tm = true;
	    					break;
	    				}else{//en caso de no encontrar tm6 y ser la primera guia debe tomar todas las descripciones
	    					description_aux.push(objSO.getSublistValue({
	    	                    sublistId : 'item',
	    	                    fieldId   : 'description',
	    	                    line      : i
	    	                }));
	    				}
	    			}else{//en caso de tener más de una guia toma todas las descripciones de los demás items
	    				if(itemId != 2001 && itemId != 2170 && itemId != 2571){
	    					description.push(objSO.getSublistValue({
	    	                    sublistId : 'item',
	    	                    fieldId   : 'description',
	    	                    line      : i
	    	                }));
	    				}
	    			}
    			}
    		}
    		
    		//si encontro tm6 y es la primer guía 
    		if(valid_tm && cont_trak.length == 0){
    			description_txt = description.join(',');
    		}
    		//si no encontro tm6 y es primer guia 
    		if(!valid_tm && cont_trak.length == 0){
    			description_txt = description_aux.join(',');
    		}
    		//si es una guia extra toma todos los items 
    		if(cont_trak.length > 0){
    			description_txt = description.join(',');
    		}
    		
    		return description_txt;
    	}catch(err){
    		log.error("error get Description",err)
    	}
    }
    function createTraking(description_txt,idSalesOrder,acLogistic){
    	try{
    		var obj_traking= record.create({
                type: 'customrecord_guia_envio',
                isDynamic: false,
            });
			
			obj_traking.setValue({
                fieldId: 'custrecord_id_sales_order',
                value: idSalesOrder
            });
			obj_traking.setValue({
                fieldId: 'custrecord_no_guia',
                value: acLogistic.tracking
            });
			obj_traking.setValue({
                fieldId: 'custrecord_url_resp_aclogistics',
                value: acLogistic.tracking_link
            });
			obj_traking.setValue({
                fieldId: 'custrecord_url_pdf_aclogistics',
                value: acLogistic.guia
            });
			obj_traking.setValue({
                fieldId: 'custrecord_estatus_envio',
                value: acLogistic.status
            });
			obj_traking.setValue({
                fieldId: 'custrecord_vw_description',
                value: description_txt
            });
			
			var id_traking = obj_traking.save();
			return id_traking;
    	}catch(err){
    		log.error("error create traking",err)
    	}
    }
    
    function getSalesOrderSerialNumber(req_info){
        try{
            //test 20304223682601124
            var allValues = {};
            var date = new Date();
            var is_valid = false;
            var itemSearch = search.load({
                id: 'customsearch_search_by_seria' // Item Search Service NS
            });

            itemSearch.filters.push(search.createFilter({
                name: 'serialnumber',
                operator: 'is',
                values: req_info['serialnumber']
            }));

            itemSearch.run().each(function(result) {
                info = result.getAllValues();
                log.debug('info',info)
                
                var type=result.getText('type')
                log.debug('type',type)
                if(type == 'Item Fulfillment' ){//Es item fulfillment
                    log.debug('es fufillment')
                                    
                    var fdate_add = format.parse({//fecha de ejecucion con 169 dias adicionales 
                        value: info["formuladate_1"],
                        type: format.Type.DATE
                    }); 
                    log.debug('fdate_add',fdate_add);
                    if(date < fdate_add){
                        is_valid = true;
                    }
                    allValues = {
                            internalid:result.getValue('createdfrom'),
                            ordernumber:info["createdFrom.tranid"],
                            name:info["createdFrom.entity"][0]['text'],
                            trandate:info["trandate"],
                            datetovalid :info["formuladate_1"],
                            valid: is_valid
                    }

                }else{ //Es Sales Order
                    var fdate_add = format.parse({//fecha de ejecucion con 169 dias adicionales 
                        value: result.getValue('formuladate'),
                        type: format.Type.DATE
                    }); 
                    log.debug('fdate_add',fdate_add);
                    if(date < fdate_add){
                        is_valid = true;
                    }
                    allValues = {
                            internalid:result.getValue('internalid'),
                            ordernumber:result.getValue('tranid'),
                            name:result.getText('entity'),
                            trandate:info["fulfillingTransaction.trandate"],
                            datetovalid :result.getValue('formuladate'),
                            valid: is_valid
                    }
                }
                log.debug('allValues',allValues)
                log.debug('info ',info);
                
                
                return true;
                
            });
            return {success:true,data:allValues} ;
            
        }catch(err){
            log.error("Error getSalesOrderSerialNumber",err);
        }
    }
    function searchODVbySerie(num_serie){
    	var allValues = {};
    	try{
    		
    		var itemSearch = search.load({
                id: 'customsearch_search_by_seria' // Item Search Service NS
            });
    		itemSearch.filters.push(search.createFilter({
                name: 'serialnumber',
                operator: 'is',
                values: num_serie
            }));
    		itemSearch.run().each(function(result) {
            	info = result.getAllValues();
            	
                allValues = {
                		internalid:result.getValue('internalid'),
                		ordernumber:result.getValue('tranid')
                }
                
                return true;
                
            });
    		return allValues;
    	}catch(err){
    		log.error('Error searchODVbySerie',err);
    		return allValues
    	}
    }
    
    function savePDF(data, folder,name) {
        try{

            var my_file = file.create({
                name: name+'.pdf',
                fileType: 'PDF',
                contents: data,
                folder: folder
            });
            
            var object_info = new Object();
            object_info.id = my_file.save();
            object_info.name = name;

            var fileObj = file.load({
                id: object_info.id
            });

            fileObj.isOnline = true;
            fileObj.save();

            log.debug('PDF guardado', object_info)
            return object_info.id;
            
        }catch(err){
            log.error('Error savePDF', err);
           
            return false;
        }
    }
    
    function getOrderRepair(req_info){
    	try{
    		var allValues = {};
            var email = "";
            var serialnumber= "";
            var orderID= "";
            var opportunities = search.load({
                id: 'customsearch_order_repair_status' // Item Search Service NS
            });
            if('ordeid' in req_info){
                if(req_info['ordeid'] == ""){
                    return {success:false, error:"El numero de orden es obligatorio"}
                }else{
                    orderID = req_info['ordeid'];
                }
                
            }else{
                 return {success:false, error:"Error al enviar la información"}
            }
            if('email' in req_info){
                if(req_info['email'] != ""){
                    email = req_info['email'];
                }
                
            }
           if('serialnumber' in req_info){
                if(req_info['serialnumber'] != ""){
                    serialnumber = req_info['serialnumber'];
                }
            }
            if(serialnumber == "" && email == ""){
                return {success:false, error:"Es necesario enviar el email o el número de serie"}
            }
            if(email != ""){
                opportunities.filters.push(search.createFilter({
                    name: 'email',
                    join: 'customer',
                    operator: 'is',
                    values: email
                }));
            }
            if(serialnumber != ""){
                opportunities.filters.push(search.createFilter({
                    name: 'custbody_numero_serie',
                    operator: 'is',
                    values: serialnumber
                }));
            }
            if(orderID != ""){
                opportunities.filters.push(search.createFilter({
                    name: 'tranid',
                    operator: 'is',
                    values: orderID
                }));
            }
            log.debug('opportunities.filters',opportunities.filters);
            opportunities.run().each(function(r) {
                info = r.getAllValues();
                var arr_status= [];

                if(r.getValue('custbody_rev')){//revision
                    arr_status.push('revision');
                }
                if(r.getValue('custbody_presup')){//presupuestado
                    arr_status.push('budgeted');
                }
                if(r.getValue('custbody39')){//autorizado
                    arr_status.push('authorized');
                }
                if(r.getValue('custbody39')){//no autorizado
                    arr_status.push('Not authorized');
                }
                if(r.getValue('custbody_repar')){//reparado
                    arr_status.push('repaired');
                }
                if(r.getValue('custbody_entrega')){//entregado
                    arr_status.push('delivered');
                }
                allValues = {
                    date_start: r.getValue('custbody25'),
                    quarantine: r.getValue('custbody_cuarentena'),
                    date_authorized: r.getValue('custbody41'),
                    delivery_date: r.getValue('custbody_entr'),
                    repair_date: r.getValue('custbody_fcha_reparacion'),
                    review_date: r.getValue('custbody_fcha_rev'),
                    shipping_method: {id:r.getValue('custbody_met_envi'),name:r.getText('custbody_met_envi')},
                    guide_number: r.getValue('custbody_num_guia_env'),
                    serial_number: r.getValue('custbody_numero_serie'),
                    url_aclogistic: r.getValue('custbody_url_one_aclogistics'),
                    contact_name: r.getValue('custbodycontacto1'),
                    customer_email: info['customer.email'],
                    customer_name: r.getText('entity'),
                    date: r.getValue('trandate'),
                    order_id: r.getValue('tranid'),
                    status: arr_status
                    
                };
                return true;

            });	
            log.debug('allValues',allValues);
            if(Object.keys(allValues).length > 0){//validamos si existe información de la busqueda
            	allValues.success = true;
            	allValues.error = "";
                return allValues
            }else{
                return {success:false, error:"No se encontró información, verifique los datos ingresados"};
            }
            
    	}catch(err){
    		log.error("Error getOrderRepair",err);
    	}
    }
    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };
    
});
