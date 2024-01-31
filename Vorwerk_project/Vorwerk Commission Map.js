/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email','N/record', 'N/file','N/search', 'N/https', 'N/runtime','N/format','./Vorwerk Dictionary Script.js'],

function(email,record, file, search, https, runtime,format,Dictionary) {
	var config_fields = Dictionary.getDictionayFields();
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
	var field_id = {
    		customrecord_comisiones_presentadora:	['custrecord_c_pre_empleado','custrecord_sub_registro_compensaciones_p','custrecord_sub_compensaciones_pre'], 	
    		customrecord_compensaciones_jdg: 		['custrecord_c_jdg_empleado','custrecord_sub__registro_compensaciones','custrecord_sub__compensaciones_jdg'],
			customrecord_compensaciones_gtm: 		['custrecord_c_gtm_empleado','custrecord_sub_registro_compensaciones_g','custrecord_sub_compensaciones_tm']
	}
   
    
    function getInputData() {
        log.debug('se llamo getInputData :)');
        //recibe la inforamcion desde la tarea y la extrae por parametros
        var scriptObj = runtime.getCurrentScript();
        var comissionInfo = scriptObj.getParameter({name: 'custscript_data_commision'});//informacion de la tabla
        var salesRepInfo = scriptObj.getParameter({name: 'custscriptid_salesrep'});
        var config = scriptObj.getParameter({name: 'custscript_config_comission'});//informacion de configuracion en headers
  
        
        return JSON.parse(comissionInfo);
    }
    
    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        try {
            //recorre la informacion de la tabla 
            var comissionInfo = JSON.parse(context.value);
            var scriptObj = runtime.getCurrentScript();
            var config = JSON.parse(scriptObj.getParameter({name: 'custscript_config_comission'}));//se extrae solo la configcuracion para la creacion del registro principal
            
            log.debug('comissionInfo map',comissionInfo);
            
            var idrg = validToCreateRegisterComission(config.type,config.period)//valida si ya existe el registro de comision
            log.debug('idrg valid',idrg);
            var type_to_add= 0; //tipo de registro a crear por empleado
            
            //proceso para crear o agregar información al periodo de comision 
            if(!idrg){
                try{
                    log.debug("creacion de registro en proceso","start");
                    var registerCom = record.create({ // Crea objeto del registro
                        type: 'customrecord_registro_compensaciones',
                        isDynamic: true
                    });
                    registerCom.setValue({
                        fieldId: 'custrecord_periodo_comision',
                        value: config.period
                    });
                    registerCom.setValue({
                        fieldId: 'custrecord_nivel_jerarquia',
                        value: config.type
                    });
                    var recCom = registerCom.save({ // Guarda el nuevo registro
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    idrg = recCom;
                    log.debug("registro de compensaciones creado",recCom);
                }catch(errRC){
                    log.error("Error al crear registro comission",errRC);
                }
                
            }else{
                log.debug("el registro de compensacion ya existe",idrg);
            }
            var regex= regex = /jdg/gi;
            var replace_string = "";
            //valida el tipo de registro a crear
            switch(parseInt(config.type)){
                case 1://presentadora
                    type_to_add = "customrecord_comisiones_presentadora";
                    replace_string = 'pre';
                break;
                case 2:
                    type_to_add = "customrecord_compensaciones_gtm";
                    replace_string = 'gtm';
                break;
                case 3://JDG
                    type_to_add = "customrecord_compensaciones_jdg";
                    replace_string = 'jdg';
                break;
            }
            log.debug('type_to_add',type_to_add);
            log.debug('replace_string',replace_string);
            //proceso para crear o agregar comisiones por presentador
            var idComEmp = validToCreateRegisterEmployee(type_to_add,comissionInfo.idEmp,idrg);//valida si existe el registro del presentador
            var type_func = idComEmp!=0?'load':'create';
            
            try{
                log.debug("creacion de registro por employee","start "+type_func);
                
                
                
                var registerEmp = record[type_func]({ // Crea objeto del employee por comision
                    type: type_to_add,
                    id: idComEmp,
                    isDynamic: true
                });
                registerEmp.setValue({
                    fieldId: config_fields.emleado[config.type],
                    value: comissionInfo.idEmp
                });
                registerEmp.setValue({
                    fieldId: config_fields.nom_unidad[config.type],
                    value: comissionInfo.nombre_unidad
                });
                registerEmp.setValue({
                    fieldId: config_fields.no_v_propio[config.type],
                    value: comissionInfo.ventas_propias_num
                });
                registerEmp.setValue({
                    fieldId: config_fields.monto_v_propio[config.type],
                    value: comissionInfo.ventas_propias_total
                });
                registerEmp.setValue({
                    fieldId: config_fields.venta_propia[config.type],
                    value: comissionInfo.ventas_propias_total
                });
                registerEmp.setValue({
                    fieldId: config_fields.entrega_monto[config.type],
                    value: comissionInfo.entrega
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_c_jdg_ventas_equipo',
                    value: comissionInfo.ventas_present_num
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_c_jdg_total_comisiones_equipo',
                    value: comissionInfo.ventas_present_total
                });
                registerEmp.setValue({
                    fieldId: config_fields.entregas[config.type],
                    value: comissionInfo.num_entrega
                });
                registerEmp.setValue({
                    fieldId: config_fields.productividad[config.type],
                    value: comissionInfo.bono_productividad
                });
                registerEmp.setValue({
                    fieldId: config_fields.total[config.type],
                    value: comissionInfo.total
                });
               
//                    registerEmp.setValue({
//                        fieldId: 'custrecord_c_jdg_idcom',
//                        value: comissionInfo.ingreso
//                    });
                registerEmp.setValue({
                    fieldId: config_fields.retencion[config.type],
                    value: comissionInfo.retencion
                });
                registerEmp.setValue({
                    fieldId: config_fields.rec[config.type],
                    value: comissionInfo.odv_rec_id
                });
                registerEmp.setValue({
                    fieldId: config_fields.equipo[config.type],
                    value: comissionInfo.odv_pre_id
                });
                registerEmp.setValue({
                    fieldId: config_fields.b_rec[config.type],
                    value: comissionInfo.bono_reclutadora
                });
                registerEmp.setValue({
                    fieldId: config_fields.odv_entrega[config.type],
                    value: comissionInfo.odv_entrega    
                });
                //Emerald
                registerEmp.setValue({
                    fieldId: config_fields.bp1[config.type],
                    value: 34   
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp1_monto[config.type],
                    value: comissionInfo.bono_emerald   
                });
                //Entrega
                registerEmp.setValue({
                    fieldId: config_fields.bp2[config.type],
                    value: 18   
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp2_monto[config.type],
                    value: comissionInfo.entrega    
                });
                //CK
                registerEmp.setValue({
                    fieldId: config_fields.bp3[config.type],
                    value: 82  
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp3_monto[config.type],
                    value: comissionInfo.total_ck    
                });
                //Garantia
                registerEmp.setValue({
                    fieldId: config_fields.garantia[config.type],
                    value: comissionInfo.monto_garantia 
                });
                registerEmp.setValue({
                    fieldId: config_fields.ids_garantia[config.type],
                    value: comissionInfo.ids_garantia    
                }); 	
                
                //3+2
                registerEmp.setValue({
                    fieldId: config_fields.tres_dos[config.type],
                    value: comissionInfo.odv_rec_del_periodo    
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp4[config.type],
                    value: 142  // BONO ADICIONAL 3+2
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp4_monto[config.type],
                    value: comissionInfo.bono_tres_dos  
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_reclutas_ventas',
                    value: comissionInfo.rec_con_ventas  
                });
                //rec_period_LE
                registerEmp.setValue({
                    fieldId: config_fields.rec_period_LE[config.type],
                    value: comissionInfo.rec_period_le    
                }); 
                registerEmp.setValue({
                    fieldId: config_fields.bp5[config.type],
                    value: 143  //  BONO ADICIONAL 5+2
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp5_monto[config.type],
                    value: comissionInfo.bono_cinco_dos  
                });
                //sc
                registerEmp.setValue({
                    fieldId: config_fields.sc[config.type],
                    value: comissionInfo.odv_pre_supercomision    
                }); 
                registerEmp.setValue({
                    fieldId: config_fields.bp6[config.type],
                    value: 144  //  SUPERCOMISIÓN
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp6_monto[config.type],
                    value: comissionInfo.bono_sc  
                });


                registerEmp.setValue({
                    fieldId: field_id[type_to_add][1],
                    value: idrg
                });

                log.debug('comissionInfo',comissionInfo.odv_entrega)
                var recEmp = registerEmp.save({ // Guarda el nuevo registro
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                idComEmp = recEmp;
                log.debug("registro de empleado creado",recEmp);
            }catch(errRE){
                log.error('error al crear registro por empleado',errRE)
            }

            
            //proceso para crear y remplazar odv del detalle
            var arrIdODV = comissionInfo.ventas_propias_ids.split(',');
            log.debug('arrIdODV',arrIdODV);
            if(arrIdODV.length > 0 ){
                log.debug("inicia proceso de creacion de odv de detalle",arrIdODV);
                deleteODVDetails(config.period,comissionInfo.idEmp);//elimina todas las odv del detalle 
                for(var x in arrIdODV){
                    try{
                        var registerDetail = record.create({ // Crea objeto del detalle de odv por employee
                            type: 'customrecord_vorwerk_detail_comission',
                            isDynamic: true
                        });
                        registerDetail.setValue({
                            fieldId: 'custrecord_vorwertk_transaction',
                            value: arrIdODV[x]
                        });
                        registerDetail.setValue({
                            fieldId: field_id[type_to_add][2],//selecciona el tipo de registro a relacionar de la configuracion
                            value: idComEmp
                        });
                        registerDetail.setValue({
                            fieldId: 'custrecord_vorwerk_employee_id',
                            value: comissionInfo.idEmp
                        });
                        registerDetail.setValue({
                            fieldId: 'custrecord_vorwerk_period',
                            value: config.period
                        });
                        var recDet = registerDetail.save({ // Guarda el nuevo registro
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        
                        log.debug("registro de detalle creado",recDet);
                    }catch(errRD){
                        log.error("error al crear registro de detalle",errRD)
                    }
                }
            }
            
            
        }
        catch(e){
            log.error('error in map function', e);
        }
    }
    
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        log.debug('reduce',context); 
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        try{
        	try{
        		email.send({
            		author: '344096',
        			recipients: 'pilar.torres@vorwerk.de',
        			subject: 'Información de Items',
        			body: 'Proceso de guardado terminado'
        		}); 
            }
        	
            catch(e){
                log.error('reduce',e);
            }
            log.debug('summarize',summary); 
        }
        catch(e){
            log.error('There is an error while submitting so info',e);
        }
        
        
    }
    
    
    function validToCreateRegisterComission(typeP,period){
        try{
            //busca si existe el registro de comision por periodo y tipo 
            var idValid = 0;
            var busqueda = search.create({
                type: 'customrecord_registro_compensaciones',
                columns: ['internalid'],
                filters: [
                    ['custrecord_periodo_comision','anyof',period],'and',['custrecord_nivel_jerarquia','anyof',typeP]
                ]
            });
             busqueda.run().each(function(r){
                 idValid = r.getValue('internalid');
                return true;
             });
             return idValid;
        }catch(err){
            log.error('error search register comission',err)
        }
        
    }
    function validToCreateRegisterEmployee(typeP,idEmp,regCom){
        try{
            
            log.debug('info to search emp register',typeP+' '+idEmp+' '+regCom);
            
            fields = field_id[typeP]
            
            log.debug('fields',fields);
            //busca si existe el registro por employee
            var idValid = 0;
            var busqueda = search.create({
                type: typeP,
                columns: ['internalid'],
                filters: [
                    [fields[0],'anyof',idEmp],'and',[fields[1],'anyof',regCom]
                ]
            });
             busqueda.run().each(function(r){
                 idValid = r.getValue('internalid');
                return true;
             });
             log.debug('resultado del registro de presentador idValid',idValid);
             return idValid;
        }catch(err){
            log.error('error search register comission',err)
        }
        
    }
    
    
    function deleteODVDetails(period,idEmp){
        try{
            //busca las odv por periodo y employee
            log.debug('info to search detail',period+' '+idEmp);
            
            var idDelete = [];
            var busqueda = search.create({
                type: 'customrecord_vorwerk_detail_comission',
                columns: ['internalid'],
                filters: [
                    ['custrecord_vorwerk_period','anyof',period],'and',['custrecord_vorwerk_employee_id','anyof',idEmp]
                ]
            });
             busqueda.run().each(function(r){
                 idDelete.push(r.getValue('internalid'));
                return true;
             });
             //elimina las odv del detalle por employee
             for(var x in idDelete){
                 try{
                     record.delete({
                         type: 'customrecord_vorwerk_detail_comission',
                         id: idDelete[x]
                     });
                 }catch(errDelete){
                     log.error("Error borrando registros de detalle")
                 }
             }
             
        }catch(err){
            log.error('error search odvs delete',err)
        }
        
        
        
        
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
