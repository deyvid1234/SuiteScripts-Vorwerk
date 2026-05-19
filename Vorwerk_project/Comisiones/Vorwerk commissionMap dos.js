/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email','N/record', 'N/file','N/search', 'N/https', 'N/runtime','N/format','./Vorwerk Dictionary Script.js'],

function(email,record, file, search, https, runtime,format,Dictionary) {
	var config_fields = Dictionary.getDictionayFields();

    function asText(v) {
        if (v === null || v === undefined) {
            return '';
        }
        if (typeof v === 'string') {
            return v;
        }
        try {
            return JSON.stringify(v);
        } catch (e) {
            return String(v);
        }
    }

    function safeSetValue(rec, fieldId, value) {
        if (!fieldId) {
            return;
        }
        try {
            rec.setValue({ fieldId: fieldId, value: value });
        } catch (e) {
            log.debug('safeSetValue: no se pudo setear campo', fieldId + ' | ' + String(e));
        }
    }

    function asNumber(v) {
        if (v === null || v === undefined || v === '') {
            return 0;
        }
        var n = Number(v);
        return isNaN(n) ? 0 : n;
    }

    function pickFirstNumber() {
        var i;
        for (i = 0; i < arguments.length; i++) {
            var n = asNumber(arguments[i]);
            if (n) {
                return n;
            }
        }
        return 0;
    }

    function pickFirstText() {
        var i;
        for (i = 0; i < arguments.length; i++) {
            var v = arguments[i];
            if (v !== null && v !== undefined && String(v) !== '') {
                return v;
            }
        }
        return '';
    }

    /** Cache en memoria del proceso: evita repetir la búsqueda de periodos en cada fila del map. */
    var periodosOrdenadosCache = null;

    function parseInicioPeriodo(val) {
        if (!val) {
            return null;
        }
        if (val instanceof Date) {
            return val;
        }
        var s = String(val).trim();
        var parts = s.split('/');
        if (parts.length === 3) {
            var d = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10) - 1;
            var y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                return new Date(y, m, d);
            }
        }
        try {
            return format.parse({ value: s, type: format.Type.DATE });
        } catch (e1) {
            return null;
        }
    }

    function getPeriodosComercialesOrdenados() {
        if (periodosOrdenadosCache) {
            return periodosOrdenadosCache;
        }
        var sorted = [];
        var periodSearch = search.create({
            type: 'customrecord_periods',
            columns: ['custrecord_inicio', 'internalid']
        });
        var searchResult = periodSearch.run().getRange({ start: 0, end: 1000 });
        var i;
        for (i = 0; i < searchResult.length; i++) {
            var r = searchResult[i];
            var pid = r.id;
            var ini = parseInicioPeriodo(r.getValue('custrecord_inicio'));
            sorted.push({
                id: String(pid),
                inicio: ini || new Date(0)
            });
        }
        sorted.sort(function (a, b) {
            return a.inicio - b.inicio;
        });
        periodosOrdenadosCache = sorted;
        return sorted;
    }

    /**
     * Marca Calificación JTL ($4,000, bono_jtl_nombramiento) como pagada en la JTL calificada.
     * No aplica al bono LE del líder nombrador (bono_le_nombramiento_jtl): ese bono puede repetirse por otros nombrados.
     */
    function actualizarPeriodoPagoJtlCalificacion(empId, periodoId) {
        if (!empId || !periodoId) {
            return;
        }
        try {
            record.submitFields({
                type: 'employee',
                id: empId,
                values: { custentity_periodo_pago_jtl: periodoId }
            });
            log.debug('employee custentity_periodo_pago_jtl actualizado (Calificación JTL)', {
                empleado: String(empId),
                periodo: String(periodoId)
            });
        } catch (e) {
            log.error('Error actualizando custentity_periodo_pago_jtl', {
                empleado: String(empId),
                periodo: String(periodoId),
                error: String(e)
            });
        }
    }

    /** Siguiente periodo comercial después de periodIdActual (orden por custrecord_inicio). */
    function siguientePeriodoComercialId(periodIdActual) {
        var sorted = getPeriodosComercialesOrdenados();
        var idx;
        var target = String(periodIdActual);
        for (idx = 0; idx < sorted.length; idx++) {
            if (sorted[idx].id === target) {
                if (idx + 1 < sorted.length) {
                    return sorted[idx + 1].id;
                }
                return null;
            }
        }
        return null;
    }

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
        var comissionInfo = scriptObj.getParameter({name: 'custscript_data_com'});//informacion de la tabla
        //var salesRepInfo = scriptObj.getParameter({name: 'custscriptid_salesrep'});
        var config = scriptObj.getParameter({name: 'custscript_config_com'});//informacion de configuracion en headers
  
        
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
            var config = JSON.parse(scriptObj.getParameter({name: 'custscript_config_com'}));//se extrae solo la configcuracion para la creacion del registro principal
            
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
                    value: comissionInfo.ventas_propias_num
                });
                registerEmp.setValue({
                    fieldId: config_fields.productividad[config.type],
                    value: comissionInfo.bono_productividad
                });
                registerEmp.setValue({
                    fieldId: config_fields.total[config.type],
                    value: comissionInfo.total
                });
               
                registerEmp.setValue({
                    fieldId: config_fields.totalReporte[config.type],
                    value: comissionInfo.total
                });
                /*registerEmp.setValue({
                    fieldId: config_fields.retencion[config.type],
                    value: comissionInfo.retencion
                });*/
                registerEmp.setValue({
                    fieldId: config_fields.rec[config.type],
                    value: comissionInfo.odv_de_reclutas
                });
                registerEmp.setValue({
                    fieldId: config_fields.equipo[config.type],
                    value: comissionInfo.odv_equipo
                });
                registerEmp.setValue({
                    fieldId: config_fields.b_rec[config.type],
                    value: comissionInfo.bono_reclutadora
                });
                registerEmp.setValue({
                    fieldId: config_fields.odv_entrega[config.type],
                    value: comissionInfo.ventas_propias_ids    
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_odv_nle',// prod custrecord_odv_nle
                    value: comissionInfo.nle    
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_nuevo_recluta_monto',
                    value: comissionInfo.montoNR    
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_detalle_nuevo_recluta',
                    value: comissionInfo.dataNR    
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_no_nuevorecluta',
                    value: comissionInfo.noNR    
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_monto_actividad',
                    value: comissionInfo.montoActividad    
                });
                registerEmp.setValue({
                    fieldId: 'custrecord_detalle_actividad',
                    value: comissionInfo.dataActividad    
                });
                registerEmp.setValue({
                    fieldId: 'custrecordno_pre_activos',
                    value: comissionInfo.noActividad    
                });

                // Nuevos bonos (registro compensación): monto + detalle, formato similar al resto (texto para detalle)
                // Pool Talent
                registerEmp.setValue({
                    fieldId: config_fields.monto_pool_talent[config.type],
                    value: asNumber(comissionInfo.bono_pool_talent)
                });
                registerEmp.setValue({
                    fieldId: config_fields.detalle_pool_talent[config.type],
                    value: asText(comissionInfo.bono_pool_talent_det)
                });

                // Calificación JTL (antes nombramiento JTL)
                registerEmp.setValue({
                    fieldId: config_fields.monto_calificacion_jtl[config.type],
                    value: pickFirstNumber(comissionInfo.bono_jtl_nombramiento, comissionInfo.bono_le_nombramiento_jtl)
                });
                registerEmp.setValue({
                    fieldId: config_fields.detalle_calificacion_jtl[config.type],
                    value: asText(pickFirstText(comissionInfo.bono_jtl_nombramiento_det, comissionInfo.bono_le_nombramiento_jtl_det))
                });

                // Maestría JTL
                registerEmp.setValue({
                    fieldId: config_fields.monto_maestria[config.type],
                    value: pickFirstNumber(comissionInfo.bono_jtl_maestria, comissionInfo.bono_le_maestria)
                });
                registerEmp.setValue({
                    fieldId: config_fields.detalle_maestria[config.type],
                    value: asText(pickFirstText(comissionInfo.bono_jtl_maestria_det, comissionInfo.bono_le_maestria_det))
                });

                // 3+2 líder (monto + detalle JSON unificado periodo; fallback a columnas legacy)
                safeSetValue(registerEmp, config_fields.monto_tres_dos[config.type], comissionInfo.bono_tres_dos || 0);
                var detalleTresDosVal = pickFirstText(comissionInfo.detalle_tres_dos);
                if (!detalleTresDosVal) {
                    detalleTresDosVal = asText(comissionInfo.odv_rec_del_periodo || comissionInfo.rec_con_ventas || '');
                }
                safeSetValue(registerEmp, config_fields.detalle_tres_dos[config.type], detalleTresDosVal);

                // 2+1 JTL (presentadoras): monto + detalle
                safeSetValue(registerEmp, config_fields.monto_dos_uno[config.type], comissionInfo.bono_jtl_2mas1 || 0);
                safeSetValue(registerEmp, config_fields.detalle_dos_uno[config.type], asText(comissionInfo.bono_jtl_2mas1_det));
                //bono Joya
                registerEmp.setValue({
                    fieldId: config_fields.bp1[config.type],
                    value: 176   
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
                /*registerEmp.setValue({
                    fieldId: config_fields.tres_dos[config.type],
                    value: comissionInfo.odv_rec_del_periodo    
                });*/
                registerEmp.setValue({
                    fieldId: config_fields.bp4[config.type],
                    value: 189  // recorri x+2nle
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp4_monto[config.type],
                    value: comissionInfo.tresdos_nle  
                });
                /*registerEmp.setValue({
                    fieldId: 'custrecord_reclutas_ventas',
                    value: comissionInfo.rec_con_ventas  
                });*/
                //rec_period_LE
                /*registerEmp.setValue({
                    fieldId: config_fields.rec_period_LE[config.type],
                    value: comissionInfo.rec_period_le    
                }); */
                registerEmp.setValue({
                    fieldId: config_fields.bp5[config.type],
                    value: 190  //  recorri 5+2 nle
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp5_monto[config.type],
                    value: comissionInfo.cincodos_nle    
                });

                // Bonos permanentes 6-9: usar para nuevos bonos (solo se imprimirán si el monto > 0 en PDF)
                // bp6: Presentadora = 2+1 (318). Líder = 3+2 (301).
                if (parseInt(config.type, 10) === 1) {
                    safeSetValue(registerEmp, config_fields.bp6[config.type], 318);
                    safeSetValue(registerEmp, config_fields.bp6_monto[config.type], asNumber(comissionInfo.bono_jtl_2mas1));
                } else if (parseInt(config.type, 10) === 3) {
                    safeSetValue(registerEmp, config_fields.bp6[config.type], 301);
                    safeSetValue(registerEmp, config_fields.bp6_monto[config.type], asNumber(comissionInfo.bono_tres_dos));
                }

                // bp7: Pool Talent (301)
                if (parseInt(config.type, 10) === 1 || parseInt(config.type, 10) === 3) {
                    safeSetValue(registerEmp, config_fields.bp7[config.type], 301);
                    safeSetValue(registerEmp, config_fields.bp7_monto[config.type], asNumber(comissionInfo.bono_pool_talent));
                }

                // bp8: Calificación JTL (líderes 308 / presentadoras 309)
                if (parseInt(config.type, 10) === 1) {
                    safeSetValue(registerEmp, config_fields.bp8[config.type], 309);
                    safeSetValue(
                        registerEmp,
                        config_fields.bp8_monto[config.type],
                        pickFirstNumber(comissionInfo.bono_jtl_nombramiento, comissionInfo.bono_le_nombramiento_jtl)
                    );
                } else if (parseInt(config.type, 10) === 3) {
                    safeSetValue(registerEmp, config_fields.bp8[config.type], 308);
                    safeSetValue(
                        registerEmp,
                        config_fields.bp8_monto[config.type],
                        pickFirstNumber(comissionInfo.bono_jtl_nombramiento, comissionInfo.bono_le_nombramiento_jtl)
                    );
                }

                // bp9: Maestría (líderes 313 / presentadoras 319)
                if (parseInt(config.type, 10) === 1) {
                    safeSetValue(registerEmp, config_fields.bp9[config.type], 319);
                    safeSetValue(
                        registerEmp,
                        config_fields.bp9_monto[config.type],
                        pickFirstNumber(comissionInfo.bono_jtl_maestria, comissionInfo.bono_le_maestria)
                    );
                } else if (parseInt(config.type, 10) === 3) {
                    safeSetValue(registerEmp, config_fields.bp9[config.type], 313);
                    safeSetValue(
                        registerEmp,
                        config_fields.bp9_monto[config.type],
                        pickFirstNumber(comissionInfo.bono_jtl_maestria, comissionInfo.bono_le_maestria)
                    );
                }
                //sc
                /*registerEmp.setValue({
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
                });*/

                /*registerEmp.setValue({
                    fieldId: config_fields.bp7[config.type],
                    value:  188    Equipo NLE
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp7_monto[config.type],
                    value: comissionInfo.bono_nle  
                });*/

                /*registerEmp.setValue({
                    fieldId: config_fields.bp7[config.type],
                    value: 189  //  3+2 NLE
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp7_monto[config.type],
                    value: comissionInfo.tresdos_nle  
                });

                registerEmp.setValue({
                    fieldId: config_fields.bp8[config.type],
                    value: 190  //  5+2 NLE
                });
                registerEmp.setValue({
                    fieldId: config_fields.bp8_monto[config.type],
                    value: comissionInfo.cincodos_nle  
                });*/
                //campos para tmsb
                registerEmp.setValue({
                    fieldId: config_fields.ventaPropia_tmsb[config.type],
                    value: comissionInfo.ventaPropia_monto_tmsb    
                });
                registerEmp.setValue({
                    fieldId: config_fields.productividad_tmsb[config.type],
                    value: comissionInfo.productividad_monto_tmsb    
                });
                registerEmp.setValue({
                    fieldId: config_fields.odv_tmsb[config.type],
                    value: comissionInfo.productividad_tmsb    
                });
                registerEmp.setValue({
                    fieldId: config_fields.ordenes_extaordinarias[config.type],
                    value: comissionInfo.ordenes_extaordinarias    
                });
                registerEmp.setValue({
                    fieldId: config_fields.monto_ventapropia_extra[config.type],
                    value: comissionInfo.monto_ventapropia_extra    
                });
                registerEmp.setValue({
                    fieldId: config_fields.monto_prod_extra[config.type],
                    value: comissionInfo.monto_prod_extra    
                });
                registerEmp.setValue({
                    fieldId: field_id[type_to_add][1],
                    value: idrg
                });

                //log.debug('odv_de_reclutas',comissionInfo.odv_de_reclutas)
               // log.debug('odv_equipo',comissionInfo.odv_equipo)
                var recEmp = registerEmp.save({ // Guarda el nuevo registro
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                idComEmp = recEmp;
                log.debug("registro de empleado creado",recEmp);
                if(comissionInfo.ventaPropia_monto_tmsb > 0){
                    record.submitFields({
                        type: 'employee',
                        id: comissionInfo.idEmp,
                        values: {'custentity_estatus_tm_sinbarreras': '1'}
                    });
                    log.debug("registro de empleado actualizado a compensacion tmsb pagadas",comissionInfo.idEmp);
                }
                if(comissionInfo.monto_ventapropia_extra > 0){
                   
                    
                    // Extraer ID del campo custrecord_ordenes_extaordinarias_le y actualizar customrecord_gana_tm
                    try {
                        if(comissionInfo.ordenes_extaordinarias) {
                            var ordenesString = comissionInfo.ordenes_extaordinarias.toString();
                            log.debug("ordenes_extaordinarias string", ordenesString);
                            
                            // Buscar el pattern "id: X" usando regex
                            var idMatch = ordenesString.match(/id:\s*(\d+)/);
                            
                            if(idMatch && idMatch[1]) {
                                var ganaTmId = idMatch[1];
                                log.debug("ID extraído para customrecord_gana_tm", ganaTmId);
                                
                                record.submitFields({
                                    type: 'customrecord_gana_tm',
                                    id: ganaTmId,
                                    values: {'custrecord_status_program': '8','custrecord_periodo_comp_pagada':config.period}
                                });
                                log.debug("registro customrecord_gana_tm actualizado a status 8", ganaTmId);
                            } else {
                                log.debug("No se pudo extraer el ID del string ordenes_extaordinarias", ordenesString);
                            }
                        }
                    } catch(errorGanaTm) {
                        log.error("Error actualizando customrecord_gana_tm", errorGanaTm);
                    }
                }
                var montoMaestriaMap = pickFirstNumber(comissionInfo.bono_jtl_maestria, comissionInfo.bono_le_maestria);
                if (montoMaestriaMap > 0) {
                    var siguientePeriodoMaestria = siguientePeriodoComercialId(config.period);
                    var valoresMaestriaEmp = {
                        custentity_maestria_ultimo_pago_periodo: config.period
                    };
                    if (siguientePeriodoMaestria) {
                        valoresMaestriaEmp.custentity_inicio_maestria = siguientePeriodoMaestria;
                    } else {
                        log.debug('siguientePeriodoMaestria no encontrado tras periodo', config.period);
                    }
                    record.submitFields({
                        type: 'employee',
                        id: comissionInfo.idEmp,
                        values: valoresMaestriaEmp
                    });
                    log.debug(
                        'empleado actualizado maestría (último pago / inicio siguiente)',
                        comissionInfo.idEmp +
                            ' ultimoPagoPeriodo=' +
                            config.period +
                            ' inicioMaestria=' +
                            (siguientePeriodoMaestria || '')
                    );
                }

                if (asNumber(comissionInfo.bono_jtl_nombramiento) > 0) {
                    actualizarPeriodoPagoJtlCalificacion(comissionInfo.idEmp, config.period);
                }

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
