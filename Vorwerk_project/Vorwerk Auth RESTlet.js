/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/file', 'N/http','N/format','N/encode','N/email','N/runtime','N/config'],

function(record,search,https,file,http,format,encode,email,runtime,config) {
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
            
            return "login was done via server script eShop";
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
//      var ret = processInformation(requestBody);
//      return ret;
        try{
            var res = {};
            log.audit("requestBody",requestBody);
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
                    res  = createSalesOrderv2(req_info)
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
            filters.push({
                name: 'custentity_creado_desde_presentador',
                operator: 'is',
                values: false
            });
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
            
            // Crear filtros separados para employee (sin el campo custentity_creado_desde_presentador que solo existe en customer)
            var filters_employee = [];
            if(valid){
                for(var x in req_info){
                    if(x != "type" && x != "rfc"){
                        filters_employee.push({
                            name: x,
                            operator: 'is',
                            values: req_info[x]
                        });
                    }
                }
            }else{
                filters_employee.push({
                    name: 'email',
                    operator: 'is',
                    values: req_info
                });
            }
            if(valid_rfc){
                filters_employee.push({
                    name: 'custentity_ce_rfc',
                    operator: 'is',
                    values: req_info['rfc']
                });
            }
            var busqueda = search.create({
                type: "employee",
                columns: ['internalid','altname','email','custentity_ce_rfc','custentity_curp','isinactive'],
                filters: filters_employee
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
                    if(parseInt(values['custitem_disponible_eshop'],10) > 0){
                        stock = parseInt(values['custitem_disponible_eshop'],10)
                    }else{
                        stock = parseInt(values['locationquantityavailable'],10)||0
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





                try {
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
                        
                        // Verificar si existe el subrecord de dirección antes de acceder a él
                        var subRecord = null;
                        try {
                            subRecord = objRecord.getSublistSubrecord({
                               sublistId : 'addressbook',
                               fieldId   : 'addressbookaddress',
                               line      : i
                            });
                        } catch (subRecordError) {
                            // Si no se puede obtener el subrecord, continuar con datos básicos
                            log.debug('No se pudo obtener subrecord de dirección para línea ' + i, subRecordError);
                            address_arr.push({
                                internalid : internalid,
                                id : id,
                                country : null,
                                addressee : null,
                                addrphone : null,
                                addr1 : null,
                                addr2 : null,
                                city : null,
                                state : null,
                                zip : null
                            });
                            continue;
                        }
                        
                        // Si el subrecord existe, intentar obtener los datos de dirección
                        var country = null;
                        var addressee = null;
                        var addrphone = null;
                        var addr1 = null;
                        var addr2 = null;
                        var city = null;
                        var state = null;
                        var zip = null;
                        
                        try {
                            country = subRecord.getText({
                                fieldId: 'country'
                            });
                        } catch (e) {
                            log.error('Error obteniendo country para línea ' + i, e);
                        }
                        
                        try {
                            addressee = subRecord.getValue({
                                fieldId: 'addressee'
                            });
                        } catch (e) {
                            log.error('Error obteniendo addressee para línea ' + i, e);
                        }
                        
                        try {
                            addrphone = subRecord.getText({
                                fieldId: 'addrphone'
                            });
                        } catch (e) {
                            log.error('Error obteniendo addrphone para línea ' + i, e);
                        }
                        
                        try {
                            addr1 = subRecord.getValue({
                                fieldId: 'addr1'
                            });
                        } catch (e) {
                            log.error('Error obteniendo addr1 para línea ' + i, e);
                        }
                        
                        try {
                            addr2 = subRecord.getValue({
                                fieldId: 'addr2'
                            });
                        } catch (e) {
                            log.error('Error obteniendo addr2 para línea ' + i, e);
                        }
                        
                        try {
                            city = subRecord.getValue({
                                fieldId: 'city'
                            });
                        } catch (e) {
                            log.error('Error obteniendo city para línea ' + i, e);
                        }
                        
                        try {
                            state = subRecord.getValue({
                                fieldId: 'state'
                            });
                        } catch (e) {
                            log.error('Error obteniendo state para línea ' + i, e);
                        }
                        
                        try {
                            zip = subRecord.getValue({
                                fieldId: 'zip'
                            });
                        } catch (e) {
                            log.error('Error obteniendo zip para línea ' + i, e);
                        }
                        
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
                        
                    } catch (lineError) {
                        // Si hay error en una línea específica, continuar con la siguiente
                        log.error('Error procesando línea de dirección ' + i, lineError);
                        continue;
                    }









                
                
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
              obj_user.setValue('custentity_fecha_preregistro',formatdate);
             
                if(req_info["url_csf"]){
                    
                    obj_user.setValue('custentity_url_csf',req_info["url_csf"]);
                }
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
//          obj_sales_order.setValue({fieldId: 'orderstatus', value: 'B'});
            obj_sales_order.setValue("customform",105);
            
            // Determinar el item de descuento basado en los items recibidos
            
            var items_especiales = [];
            var discont_base;
            var discont_tm7;
            if(runtime.envType == "SANDBOX"){
                // Items que requieren item de descuento 2692 en sandbox
                items_especiales = ["2685", "2686"];
                discont_base = 1876;
                discont_tm7 = 2692;
            }else{//produccion
                items_especiales = ["2839", "2841"];//GETM,KIT DESGASTE TM7
                discont_base = 1876;//descuento G0006
                discont_tm7 = 2840;//descuento G0008
            }
            var discount_item_id = discont_base; // Item de descuento por defecto
            var tiene_item_2686 = false; // Flag para detectar si hay item 2686 (KIT DE DESGASTE TM7)
            
            // Verificar si alguno de los items recibidos está en la lista de items especiales
            for(var x in req_info.items){
                if(items_especiales.indexOf(req_info.items[x].item_id) !== -1){
                    discount_item_id = discont_tm7;
                                        
                        tiene_item_2686 = true;
                        
                    break;
                }
            }
            
            // Calcular descuento solo si NO hay item 2686 (para item 2686 se aplica descuento único al final)
            if("discountrate" in req_info && !tiene_item_2686){
                if(parseFloat(req_info['discountrate']) > 0){
                    for(var x in req_info.items){
                        if(req_info.items[x].item_id != "859"){
                            var item_to = req_info.items[x];
                            total_amount_aux+= (parseFloat(item_to.amount)*parseInt(item_to.quantity,10));
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
                   
                    obj_sales_order.setValue('location',locationValidado)
                    obj_sales_order.setValue('custbody_so_eshop',true)
                }
                if(x == "location" || x == "Location"){//Si el location es diferente a Eshop asigna lo que manda tienda en linea
                    locationValidado = req_info[x]
                  
                    obj_sales_order.setValue('location',locationValidado)
                    obj_sales_order.setValue('custbody_so_eshop',true)
                    if(req_info.custbody46 != ''|| req_info.custbody_estatus_envio != 7){
                        obj_sales_order.setValue('ordertype',1)
                    }
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
                
                
                if(!tiene_item_2686 && total_amount_aux > 0 && item_mine.item_id != "859"){
                    var discount_item = parseFloat(item_mine.amount)*discount_aux*parseInt(item_mine.quantity,10);
                    
                    discount_item = discount_item + 0.01;
                   
                    setItemDiscount(obj_sales_order, discount_item, discount_item_id);
                }
            }
            
            // Si hay item 2686, aplicar un solo descuento al final
            if(tiene_item_2686 && "discountrate" in req_info && parseFloat(req_info['discountrate']) > 0){
                
                var descuento_unico = parseFloat(req_info['discountrate']) - 0.04;
                
                setItemDiscount(obj_sales_order, descuento_unico, discont_tm7, true);
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
                            tracking        :req_info.custbody46,
                            tracking_link   :req_info.custbody_url_one_aclogistics,
                            guia            :req_info.custbody_url_two_aclogistics,
                            status          :req_info.custbody_estatus_envio
                    }
                    var tipoVenta = req_info.custbody_tipo_venta
                    var statusEnvio = req_info.custbody_estatus_envio
                    var id_traking = createTraking(description,id_sales_order,acLogistic,tipoVenta,statusEnvio)
                    log.debug("traking_id",id_traking);
//segunda guia
                    try{
                        var urlOne = req_info.custbody_url_one_aclogistics
                        var urlTwo = req_info.custbody_url_two_aclogistics
                         
                        if(tipoVenta == 2 && statusEnvio != 7 && urlOne && urlTwo){//status de envio 7 es Entrega en sucursal
                            
                            var apiKey = "", description = [], description_txt = "", segundaGuia = false;
                            if(runtime.envType  == "SANDBOX"){
                                apiKey = "c9df5be32d150aaae2c5f3a2cddacb44" //Apikey Logistica 
                            }else{
                                apiKey = "c9df5be32d150aaae2c5f3a2cddacb44"//cde44ce43ffd04403bf3c734e5dbbef6
                            }
                            
                            var objSO = record.load({
                                type: record.Type.SALES_ORDER,
                                id: id_sales_order,
                                isDynamic: false,
                            });
                                                        

                            var itemLines = objSO.getLineCount({
                                sublistId  : 'item'
                            });
                                                        
                            for(var i=0; i < itemLines; i++){
                                var itemId = objSO.getSublistValue({
                                    sublistId : 'item',
                                    fieldId   : 'item',
                                    line      : i
                                });
                                
                                if(itemId != 1441 && itemId != 859 && itemId != 2001 && itemId != 2170 && itemId != 2490 && itemId != 2571 && itemId != 2638 && itemId != 2671 && itemId != 2763){//que no sea kit, bundle, tms, costo por financiamiento 
                                    segundaGuia = true
                                    description.push(objSO.getSublistValue({
                                        sublistId : 'item',
                                        fieldId   : 'description',
                                        line      : i
                                    }));
                                }
                            }   
                            description_txt = description.join(',');
                            
                            var objTracking = search.lookupFields({
                                type: 'customrecord_vk_traking_information',
                                id: 3,
                                columns: ['custrecord_alto_cm','custrecord_ancho_cm','custrecord_largo_cm','name','custrecord_contenido']
                            });
                            log.debug('objTracking',objTracking);
                                                        
                            var objCustomer = record.load({
                                type: record.Type.CUSTOMER,
                                id: objSO.getValue('entity'),
                                isDynamic: false,
                            });
                            //extrae la información del cliente
                            
                            var email_customer = objCustomer.getValue('email');
                            var nameCustomer = objCustomer.getValue('altname');
                            var addrphone = "";
                            var addr1 = "";
                            var addr2 = "";
                            var zip ="";
                            var companyCustomer = objCustomer.getValue('custentity_razon_social');
                            
                            var totalLines = objCustomer.getLineCount({
                                sublistId  : 'addressbook'
                            });
                           
                            for(var i=0; i < totalLines; i++){
                                var defaultshipping = objCustomer.getSublistValue({
                                    sublistId : 'addressbook',
                                    fieldId   : 'defaultshipping',
                                    line      : i
                                });
                                
                                if(defaultshipping == true){
                                    var subRecord = objCustomer.getSublistSubrecord({
                                       sublistId : 'addressbook',
                                       fieldId   : 'addressbookaddress',
                                       line      : i
                                    });
                                   

                                    addrphone = subRecord.getText({
                                        fieldId: 'addrphone'
                                    });
                                    addr1 = subRecord.getValue({
                                        fieldId: 'addr1'
                                    });
                                    addr2 = subRecord.getValue({
                                        fieldId: 'addr2'
                                    });
                                    zip = subRecord.getValue({
                                        fieldId: 'zip'
                                    });
                                    break;
                                }
                                
                            }
                            var random_num = Math.floor(Math.random() * 100);
                            //crea el objeto que se envia a ac logistic
                            var weight = objTracking.name.split(" ")[0];
                            if (itemLines > 1 && segundaGuia == true){
                               var objRequest = {
                                     "api_key": apiKey,
                                     "referencia": objSO.getValue('tranid')+'-'+random_num,
                                     "id_courier": "fedex_eco",
                                     "nombre_remitente": 'VORWERK',
                                     "telefono_remitente": '01 800 200 11 21',
                                     "correo_remitente": 'contacto@thermomixmexico.com.mx',
                                     "direccion_remitente": 'VITO ALESSIO ROBLES 38 COLONIA FLORIDA ÁLVARO OBREGÓN Ciudad de México 01030',
                                     "empresa_remitente": 'VORWERK MEXICO, S. DE R.L. DE C.V.',
                                     "nombre_destinatario": nameCustomer,
                                     "telefono_destinatario": addrphone,
                                     "correo_destinatario": email_customer,
                                     "calle_destinatario": addr1,
                                     "num_exterior_destinatario": "0",
                                     "num_interior_destinatario": "0",
                                     "cp_destinatario": zip,
                                     "colonia_destinatario": addr2,
                                     "empresa_destinatario": companyCustomer,
                                     "alto_cm": objTracking.custrecord_alto_cm,
                                     "ancho_cm": objTracking.custrecord_ancho_cm,
                                     "largo_cm": objTracking.custrecord_largo_cm,
                                     "peso_kg": weight,
                                     "contenido": objTracking.custrecord_contenido,
                                     "valor":objSO.getValue('total'),
                                     "seguro": "false"
                                } 
                            
                            log.audit("Datos a enviar",objRequest);
                            
        
                            var responseService = https.post({
                                url: 'https://www.smartship.mx/api/documentar/',
                                body : JSON.stringify(objRequest),
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            }).body;
                            try{
                                log.audit("responseService",responseService);
                            
                                if(JSON.parse(responseService).mensaje == 'Exitoso'){
                                    log.debug("if true",JSON.parse(responseService).mensaje);
                                }else{
                                    log.debug("if false",JSON.parse(responseService).mensaje);
                                }
                              
                            }catch(e){
                                log.debug("error log",e);
                              
                            }
                            
                            //si la respuesta es correcta crea un nuevo registro de traking
                            if( JSON.parse(responseService).mensaje == 'Exitoso' ){
                                var acLogistic = JSON.parse(responseService)
                                var obj_traking= record.create({
                                    type: 'customrecord_guia_envio',
                                    isDynamic: false,
                                });
                                
                                obj_traking.setValue({
                                    fieldId: 'custrecord_id_sales_order',
                                    value: id_sales_order
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
                                    value: 1
                                });
                                obj_traking.setValue({
                                    fieldId: 'custrecord_id_envio',
                                    value: acLogistic.id_envio
                                });
                                obj_traking.setValue({
                                    fieldId: 'custrecord_vw_description',
                                    value: description_txt
                                });
                                obj_traking.setValue({
                                    fieldId: 'custrecord_peso',
                                    value: weight + ' kg'
                                });
                                var id_trakingDos = obj_traking.save();
                                log.debug('id_trakingDos',id_trakingDos);
                                
                            }else{
                                log.error('Error al generar guia')
                                alert("Error al generar guia "+acLogistic.mensaje);
                            } 
                            }
                            

                        }
                    }catch(e){
                        log.error('error segunda guia',e)
                    }
                    //fin segunda guia
                }catch(err_tracking){
                    log.error('error create traking',err_tracking)
                }
                
            }catch(err_so){
                log.error("error err_so",err_so);
                return {error_order:err_so};
            }
            
            // Extraer fecha del último pago si existe multipago y hay más de 1 pago
            // Si solo hay 1 pago, tomar ese; si hay más de 1, tomar el último
            var fecha_pago = null;
            if(salesorder_payment && salesorder_payment.length > 0){
                var pago_a_usar;
                if(salesorder_payment.length > 1){
                    pago_a_usar = salesorder_payment[salesorder_payment.length - 1];
                    
                }else{                    
                    pago_a_usar = salesorder_payment[0];
                    
                }
                
                // Verificar si tiene transdate o trandate
                if(pago_a_usar.transdate){
                    fecha_pago = parseDate(pago_a_usar.transdate);
                    
                }else if(pago_a_usar.trandate){
                    fecha_pago = parseDate(pago_a_usar.trandate);
                    
                }
            }
            
            var id_payment = setPaymentMethod(id_sales_order, salesorder_payment, req_info.entity)
            try{
                
                var values_to_update = {
                    'orderstatus':'B',
                    'custbody_vorwerk_contratos':id_payment.contract,
                    'custbody_total_pagado':id_payment.total_payment
                };
                
                
                if(fecha_pago){
                    values_to_update['trandate'] = fecha_pago;
                   
                }
                
                var submitFields = record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: id_sales_order,
                    values: values_to_update
                });
                
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

    //funcion para crear ODV v2 - separa items en dos ordenes: una con item TM7 y otra con items GETM7 y KIT DESGASTE
    function createSalesOrderv2(req_info){
        try{
            // Determinar items según el ambiente (sandbox o producción)
            var item_tm7_sandbox = "2680";
            var item_tm7_prod = "2763";
            var item_getm7_sandbox = "2685";
            var item_getm7_prod = "2839";
            var item_kit_sandbox = "2686";
            var item_kit_prod = "2841";
            
            var item_tm7, item_getm7, item_kit;
            if(runtime.envType == "SANDBOX"){
                item_tm7 = item_tm7_sandbox;
                item_getm7 = item_getm7_sandbox;
                item_kit = item_kit_sandbox;
            } else { //produccion
                item_tm7 = item_tm7_prod;
                item_getm7 = item_getm7_prod;
                item_kit = item_kit_prod;
            }
            
            log.debug('createSalesOrderv2', 'Ambiente: ' + runtime.envType + ', Item TM7: ' + item_tm7 + ', Item GETM7: ' + item_getm7 + ', Item KIT: ' + item_kit);
            
            // Separar items en dos grupos
            var items_tm7 = []; // Items para la primera orden (incluye item TM7)
            var items_getm7_kit = []; // Items para la segunda orden (incluye items GETM7 y KIT DESGASTE)
            var otros_items = []; // Otros items que no son TM7, GETM7 o KIT
            
            var tiene_tm7 = false;
            var tiene_getm7 = false;
            var tiene_kit = false;
            
            // Recorrer todos los items del request
            var item_financiamiento = "1441"; // Item costo por financiamiento
            for(var x in req_info.items){
                var item_mine = req_info.items[x];
                var item_id = String(item_mine.item_id);
                
                switch(item_id){
                    case item_tm7:
                        tiene_tm7 = true;
                        items_tm7.push(item_mine);
                        break;
                    case item_getm7:
                        tiene_getm7 = true;
                        items_getm7_kit.push(item_mine);
                        break;
                    case item_kit:
                        tiene_kit = true;
                        items_getm7_kit.push(item_mine);
                        break;
                    case item_financiamiento:
                        // Item costo por financiamiento se agrega a la orden TM7
                        items_tm7.push(item_mine);
                        break;
                    default:
                        // Otros items que se agregarán a ambas órdenes o según se defina
                        otros_items.push(item_mine);
                        break;
                }
            }
            
            // Validar que tenga ambos artículos: TM7 y GETM7
            // Si no tiene ambos, crear orden normal usando createSalesOrder
            if(!tiene_tm7 || !tiene_getm7){
                log.debug('createSalesOrderv2', 'No se tienen ambos items (TM7 y GETM7), creando orden normal');
                return createSalesOrder(req_info);
            }
            
            log.debug('createSalesOrderv2', 'Items TM7: ' + items_tm7.length + ', Items GETM7/KIT: ' + items_getm7_kit.length + ', Otros items: ' + otros_items.length);
            
            // Calcular división del descuento si existe discountrate
            var discountrate_total = 0;
            var discountrate_getm7_kit = 0;
            var discountrate_tm7 = 0;
            var monto_kit_desgaste = 0;
            
            if("discountrate" in req_info && parseFloat(req_info['discountrate']) > 0){
                discountrate_total = parseFloat(req_info['discountrate']);
                
                // Buscar el monto del kit de desgaste en los items
                for(var x in items_getm7_kit){
                    var item_kit_check = items_getm7_kit[x];
                    var item_id_kit_check = String(item_kit_check.item_id);
                    if(item_id_kit_check == item_kit){
                        // Calcular monto total del kit (amount * quantity)
                        monto_kit_desgaste = parseFloat(item_kit_check.amount) * parseInt(item_kit_check.quantity, 10);
                        log.debug('createSalesOrderv2', 'Monto kit de desgaste encontrado: ' + monto_kit_desgaste);
                        break;
                    }
                }
                
                // Si no se encontró en items_getm7_kit, buscar en todos los items del request original
                if(monto_kit_desgaste == 0){
                    for(var x in req_info.items){
                        var item_check = req_info.items[x];
                        var item_id_check = String(item_check.item_id);
                        if(item_id_check == item_kit){
                            monto_kit_desgaste = parseFloat(item_check.amount) * parseInt(item_check.quantity, 10);
                            log.debug('createSalesOrderv2', 'Monto kit de desgaste encontrado en request original: ' + monto_kit_desgaste);
                            break;
                        }
                    }
                }
                
                // Calcular descuento para GETM7/KIT: el mínimo entre el descuento total y el monto del kit menos un centavo
                if(monto_kit_desgaste > 0){
                    var descuento_maximo_getm7 = monto_kit_desgaste;
                    // Aplicar el mínimo entre el descuento total y el máximo permitido para GETM7/KIT
                    discountrate_getm7_kit = Math.min(discountrate_total, descuento_maximo_getm7);
                    // Calcular descuento para TM7: lo que sobra del descuento total
                    discountrate_tm7 = discountrate_total - discountrate_getm7_kit;
                    
                    log.debug('createSalesOrderv2', 'Descuento total: ' + discountrate_total + ', Monto kit: ' + monto_kit_desgaste + ', Descuento máximo GETM7/KIT: ' + descuento_maximo_getm7 + ', Descuento GETM7/KIT aplicado: ' + discountrate_getm7_kit + ', Descuento TM7: ' + discountrate_tm7);
                } else {
                    // Si no hay kit, el descuento total va a TM7
                    discountrate_tm7 = discountrate_total;
                    log.debug('createSalesOrderv2', 'No se encontró kit de desgaste, todo el descuento va a TM7: ' + discountrate_tm7);
                }
            }
            
            var id_orden_tm7 = null;
            var id_orden_getm7_kit = null;
            var res_tm7 = null;
            
            // Crear PRIMERA orden de venta con item TM7
            if(tiene_tm7 && items_tm7.length > 0){
                var req_info_tm7 = JSON.parse(JSON.stringify(req_info)); // Copia profunda del objeto
                req_info_tm7.items = items_tm7.concat(otros_items); // Agregar otros items a la primera orden
                req_info_tm7.tranid = req_info.tranid; // Sin sufijo para la orden TM7
                req_info_tm7.custbody_pedido_tm7_getm7 = true; // Marcar check como verdadero
                
                // Asignar descuento a la orden TM7 (solo si hay descuento disponible)
                if(discountrate_tm7 > 0){
                    req_info_tm7.discountrate = discountrate_tm7;
                    log.debug('createSalesOrderv2', 'Asignando descuento TM7: ' + discountrate_tm7);
                }
                
                log.debug('createSalesOrderv2', 'Creando orden con item TM7 (' + item_tm7 + '), tranid: ' + req_info_tm7.tranid);
                res_tm7 = createSalesOrder(req_info_tm7);
                
                // Obtener el internal id de la orden TM7
                if(res_tm7 && res_tm7.success){
                    id_orden_tm7 = res_tm7.success;
                    log.debug('createSalesOrderv2', 'Orden TM7 creada con ID: ' + id_orden_tm7);
                } else {
                    log.error('createSalesOrderv2', 'Error al crear orden TM7: ' + JSON.stringify(res_tm7));
                    return res_tm7; // Retornar el error en el mismo formato
                }
            }
            
            // Crear SEGUNDA orden de venta con items GETM7 y KIT DESGASTE
            if((tiene_getm7 || tiene_kit) && items_getm7_kit.length > 0){
                var req_info_getm7_kit = JSON.parse(JSON.stringify(req_info)); // Copia profunda del objeto
                req_info_getm7_kit.items = items_getm7_kit; // Solo items GETM7 y KIT DESGASTE
                req_info_getm7_kit.tranid = "NS" + req_info.tranid; // Agregar prefijo NS al tranid
                req_info_getm7_kit.custbody_pedido_tm7_getm7 = true; // Marcar check como verdadero
                
                // Asignar descuento a la orden GETM7/KIT (monto del kit menos un centavo)
                if(discountrate_getm7_kit > 0){
                    req_info_getm7_kit.discountrate = discountrate_getm7_kit;
                    log.debug('createSalesOrderv2', 'Asignando descuento GETM7/KIT: ' + discountrate_getm7_kit);
                }
                
                // Asignar el internal id de la orden TM7 en el campo custbody_odv_tm7_getm7
                if(id_orden_tm7){
                    req_info_getm7_kit.custbody_odv_tm7_getm7 = id_orden_tm7;
                    log.debug('createSalesOrderv2', 'Asignando ID orden TM7 (' + id_orden_tm7 + ') a custbody_odv_tm7_getm7 de orden GETM7/KIT');
                }
                
                log.debug('createSalesOrderv2', 'Creando orden con items GETM7/KIT, tranid: ' + req_info_getm7_kit.tranid);
                var res_getm7_kit = createSalesOrder(req_info_getm7_kit);
                
                // Obtener el internal id de la orden GETM7/KIT
                if(res_getm7_kit && res_getm7_kit.success){
                    id_orden_getm7_kit = res_getm7_kit.success;
                    log.debug('createSalesOrderv2', 'Orden GETM7/KIT creada con ID: ' + id_orden_getm7_kit);
                    
                    // Actualizar la orden TM7 con el internal id de la orden GETM7/KIT
                    if(id_orden_tm7){
                        try{
                            // Usar load y save en lugar de submitFields para evitar disparar scripts de usuario problemáticos
                            var salesOrderRec = record.load({
                                type: 'salesorder',
                                id: id_orden_tm7,
                                isDynamic: false
                            });
                            
                            salesOrderRec.setValue({
                                fieldId: 'custbody_odv_tm7_getm7',
                                value: id_orden_getm7_kit
                            });
                            
                            salesOrderRec.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });
                            
                            log.debug('createSalesOrderv2', 'Orden TM7 actualizada con ID orden GETM7/KIT (' + id_orden_getm7_kit + ') en custbody_odv_tm7_getm7');
                        } catch(err_update){
                            log.error('createSalesOrderv2', 'Error al actualizar orden TM7: ' + JSON.stringify(err_update));
                            // Continuar el proceso aunque falle la actualización del campo
                            log.debug('createSalesOrderv2', 'El proceso continúa a pesar del error en la actualización del campo custbody_odv_tm7_getm7');
                        }
                    }
                } else {
                    log.error('createSalesOrderv2', 'Error al crear orden GETM7/KIT: ' + JSON.stringify(res_getm7_kit));
                    // Continuar y retornar la orden TM7 aunque falle la GETM7/KIT
                }
            }
            
            // Retornar solo la información de la orden TM7 en el mismo formato que createSalesOrder
            return res_tm7;
            
        }catch(err){
            log.error("error createSalesOrderv2",err);
            return {error:err}
        }
    }

    function setItemDiscount(obj_sales_order, discount_item, discount_item_id, es_descuento_unico_2686){
        try{
            // Si no se proporciona discount_item_id, usar el por defecto (1876)
            if(!discount_item_id){
                discount_item_id = 1876;
            }
            
            
            if(es_descuento_unico_2686){
               
                var rate_sin_iva = (discount_item * -1) / 1.16;
                var gross_con_iva = discount_item * -1;
                                
                obj_sales_order.selectNewLine({
                    sublistId : 'item',
                });
                obj_sales_order.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: discount_item_id
                });
                obj_sales_order.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'price',
                    value: -1
                });
                obj_sales_order.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: rate_sin_iva.toFixed(2)
                });
                obj_sales_order.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: gross_con_iva
                });
                obj_sales_order.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'grossamt',
                    value: gross_con_iva
                });
                obj_sales_order.commitLine({
                    sublistId: 'item'
                });
            }else{
                // Lógica original para descuentos normales
                var price_negative = discount_item*-1;
                log.debug('price_negative',price_negative);
                log.debug('discount_item_id usado', discount_item_id);
                obj_sales_order.selectNewLine({
                        sublistId : 'item',
                });
                obj_sales_order.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: discount_item_id
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
            }
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
                                
                                var id_account = tmp_tipo_pago.custrecord_ref_pago_cuenta_bancaria[0].value;
                                obj_payment.setValue('account',id_account);
                                obj_payment.setValue('custbody_forma_tipo_de_pago',info_payment[x][y]);
                            }else if(y == "trandate" || y == "transdate"){
                                // Maneja tanto "trandate" como "transdate" del JSON, pero siempre setea "trandate" en NetSuite
                                var fecha_pago = parseDate(info_payment[x][y]);
                                if(fecha_pago){
                                    obj_payment.setValue('trandate', fecha_pago);
                                    log.debug('Fecha de pago seteada', fecha_pago);
                                }else{
                                    log.error('Error al parsear fecha de pago', info_payment[x][y]);
                                }
                            }else if(y=="ccexpiredate"){
                                var ccexp = format.parse({value: info_payment[x][y], type: format.Type.CCEXPDATE})
                                log.debug('-- ccexp'+y,ccexp);
                                obj_payment.setValue(y,ccexp)
                            }else{
                                if (y == 'payment'){
                                    total_payment = total_payment+parseInt(info_payment[x][y],10)                              
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
                  log.debug('csf',req_info["url_csf"])
                    if(req_info["url_csf"]){
                        log.debug('hay url csf nuevo if update')
                        obj_user.setValue('custentity_url_csf',req_info["url_csf"]);
                    }
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
            if(!date_req || date_req == ""){
                log.debug("date_req vacío o null",date_req);
                return null;
            }
            log.debug('date_req',date_req)
            var fdate = format.parse({
                value: date_req,
                type: format.Type.DATE
            });
            return fdate;
        }catch(err){
            log.error("err parse Date",err);
            return null;
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
    function createTraking(description_txt,idSalesOrder,acLogistic,tipoVenta,statusEnvio){
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


            var objSO = record.load({
                type: record.Type.SALES_ORDER,
                id: idSalesOrder,
                isDynamic: false,
            });
            
            var itemLines = objSO.getLineCount({
                sublistId  : 'item'
            });
            
            for(var i=0; i < itemLines; i++){
                var itemId = objSO.getSublistValue({
                    sublistId : 'item',
                    fieldId   : 'item',
                    line      : i
                });

                if( itemId == 2001 || itemId == 2170 || itemId == 2490 || itemId == 2571 || itemId == 2638 || itemId == 2280 || itemId == 1757 || itemId == 1126 || itemId == 2035 || itemId == 2671 || itemId ==2763){
                    obj_traking.setValue({
                        fieldId: 'custrecord_peso',
                        value: '12.60 kg'
                    });
                    break;
                }else{
                    obj_traking.setValue({
                        fieldId: 'custrecord_peso',
                        value: '1 kg'
                    }); 
                }
            }
                        
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
            itemSearch.filters.push(search.createFilter({
                name: 'item',
                operator: 'noneof',
                values: '2763'
            }));

            itemSearch.run().each(function(result) {
                info = result.getAllValues();
                log.debug('info',info)
                
                var type=result.getText('type')
                log.debug('type',type)
                if(type == 'Item Fulfillment' ){//Es item fulfillment
                                                        
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
                //log.debug('allValues',allValues)
                //log.debug('info ',info);
                
                
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
            //log.debug('allValues',allValues);
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
