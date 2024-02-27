/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['N/record', 'N/search','N/runtime','N/format'],

function(record, search, runtime, format) {
   
    return {
        doTheMagic: function(operand1, operand2) {
            return operand1 + operand2;
        },
      //Realiza búsqueda de ordenes de venta
        searchSO: function(objEmp,idPeriod,tm_pagada,historico,h_ingreso){ //recibir nuevo parametro de id de periodo 
            log.debug('Alex -> ',idPeriod);
            var objSOResult = {};
            var objSOCookey = {}
            var objPeriod = this.getObjPeriod(idPeriod);//mandar el id del periodo
            log.debug('This is objPeriod',objPeriod);
            var searchFilters = this.getSearchFiltersSO(objEmp,objPeriod,tm_pagada,historico,h_ingreso);
            var searchSalesOrder = search.create({
                type: search.Type.SALES_ORDER,
                filters: searchFilters,
                columns: [
                    { name: 'internalid' },
                    { name: 'salesrep' },
                    { name: 'custbody_tipo_venta'},
                    { name: 'recordtype'},
                    { name: 'trandate'},
                    { name: 'custbody_fcha_entrega_tm5_cliente'},
                    { name: 'custbody_vw_recruiter'},
                    { name: 'item'}
                    
                ]
            });
            var pagedResults = searchSalesOrder.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                    var thisInternalId = r.getValue('internalid'),
                        salesrep = r.getValue('salesrep'),
                        custbody_tipo_venta = r.getValue('custbody_tipo_venta');
                        entrega = r.getValue('custbody_fcha_entrega_tm5_cliente');
                        reclutadora = r.getValue('custbody_vw_recruiter');
                        trandate = r.getValue('trandate').split("/");
                        item = r.getValue('item');
                        
                    if(r.getValue('item') != 1749 && r.getValue('item') != 2040 ){
                        if(objSOResult.hasOwnProperty(salesrep)){
                            if(!objSOResult[salesrep].hasOwnProperty(thisInternalId)){
                                objSOResult[salesrep][thisInternalId] = [{type:custbody_tipo_venta},{entrega:entrega,reclutadora:reclutadora,id:thisInternalId,trandate:trandate}]
                            }
                        }
                        else{
                                objSOResult[salesrep] = {};
                                objSOResult[salesrep][thisInternalId] = [{type:custbody_tipo_venta},{entrega:entrega,reclutadora:reclutadora,id:thisInternalId,trandate:trandate}]
                        }
                    }   
                       

                  //  log.debug('trandate',r.getValue('trandate'));
                   
                    
                    return true;
                });
            });

            log.debug('Total sales rep', Object.keys(objSOResult).length);

            return objSOResult;
        },
        
        //Genera los filtros con filterExpression
        getSearchFiltersSO: function(objData,objPeriod,tm_pagada,historico,h_ingreso){
            var startDate = objPeriod['startDate'],
                endDate = objPeriod['endDate'];
                id_period = parseInt(objPeriod['internalid']);
            var arrFilters = [];
            for(idEmp in objData){
                if(objData[idEmp][0] != null){
                    var arrEmp = [], 
                    arrItemsFilter = [],
                    arrThisEmpFilter = ['salesrep', search.Operator.IS, idEmp],
                    arrItems = objData[idEmp],
                    totalItems = arrItems.length;
                
                    arrEmp.push(arrThisEmpFilter);
                    arrEmp.push('and');
                    
                    for(var i=0; i < totalItems; i++){
                        var arrThisItemFilter = ['item.internalid', 'is', arrItems[i]];
                        arrItemsFilter.push(arrThisItemFilter);
                        if(i < totalItems-1){
                            arrItemsFilter.push('or')
                        }
                    }
    
                    arrEmp.push(arrItemsFilter);
                    
                    arrFilters.push(arrEmp);
                    arrFilters.push('or');
                }
                
            }
            
            arrFilters.pop();
            //var arrReturn = [['recordtype', 'is', 'salesorder'],'and',['trandate', 'within', [startDate, endDate]],'and',arrFilters];
            var tipo_venta = 2;
            if(tm_pagada){
                tipo_venta = 19;
            }
            if(tm_pagada == 3){
                tipo_venta = 1;
            }
            if (historico){
                if(h_ingreso == true){
                    tipo_venta = [2,19]
                    var H_start = this.getObjPeriod(id_period-5);
                    var H_end = this.getObjPeriod(id_period-1);
                    var start = H_start['startDate']
                    var end = H_end['endDate']
                    log.debug('h_ingreso','start periodo actual: '+startDate+' H strat: '+start+' H End : '+end)
                    var arrReturn = [['recordtype', 'is', 'salesorder'],'and',['custbody_tipo_venta','anyof',tipo_venta],'and',['trandate','within', [start, end]],'and',['custbody_vw_recruiter','ISNOTEMPTY',true],'and',arrFilters];

                }else{
                    var H_start = this.getObjPeriod(4);
                    var H_end = this.getObjPeriod(id_period-1);
                    var start = H_start['startDate']
                    var end = H_end['endDate']
                    log.debug('historico','start date: '+startDate+' H strat: '+start+' H End : '+end)
                    var arrReturn = [['recordtype', 'is', 'salesorder'],'and',['custbody_tipo_venta','is',tipo_venta],'and',['trandate','within', [start, end]],'and',['custbody_vw_recruiter','ISNOTEMPTY',true],'and',arrFilters];

                }
                
            }else if(tm_pagada == 3){
                var arrReturn = [['recordtype', 'is', 'salesorder'],'and',['custbody_tipo_venta','is',tipo_venta],'and',['custbody_vw_comission_status','NONEOF',2],'and',['trandate', 'within', [startDate, endDate]],'and',arrFilters];

            }else {
                var arrReturn = [['recordtype', 'is', 'salesorder'],'and',['custbody_tipo_venta','is',tipo_venta],'and',['trandate', 'within', [startDate, endDate]],'and',arrFilters];

            }
            log.debug('Arr return Vorwerk commission CustomPlugin.js',arrReturn);
            return arrReturn;
        },

        //Hace match de empleados y sus items de compensacion, recibe un obj, idEmp -> arrIdsCompensaciones
        matchEmpCompItems: function(objData){
            var objEmpMatched = {};
            var objItemsCompensation = this.getItemsCompensation();//tomar solo las compensaciones de la funcion anterior y mandarlas como filtro
            
            for(idEmp in objData){
                var arrItems = [];
                var thisArrComp = objData[idEmp],
                    arrCompLength = thisArrComp.length;

                for(var i=0; i < arrCompLength; i++){
                    var arrThisItems = objItemsCompensation[thisArrComp[i]];
                    arrItems = arrItems.concat(arrThisItems);
                }
                objEmpMatched[idEmp] = arrItems;
            }
            return objEmpMatched;
        },
        //Búsqueda general de compensaciones y sus items
        getItemsCompensation: function(objData){
            var searchItemsComp = search.create({
                type: 'customrecord_conf_de_compensaciones',
                columns: [
                    { name: 'internalid' },
                    { name: 'custrecord_cdc_articulos_permitidos' }
                ]
            });
            var objItemsComp = {};
            searchItemsComp.run().each(function(r){
                var thisInternalId = r.getValue('internalid'),
                    thisItems = r.getValue('custrecord_cdc_articulos_permitidos');
                objItemsComp[thisInternalId] = thisItems.split(',');
                return true;
            });
            return objItemsComp;
        },

        getISRData: function(period){
            var objPeriod = this.getObjPeriod(period);
            var parentCalendar = objPeriod['parentCalendar'];
            var isrList = this.getISRList(parentCalendar);
            return {
                objPeriod: objPeriod,
                isrList: isrList
            };
        },

        getObjPeriod: function(idPeriod){
            var currentDate = new Date(),
                currentYear = currentDate.getFullYear();
            var fDate = format.format({value:currentDate,type:format.Type.DATE});
            var monthlyPeriod = search.create({
                type: 'customrecord_periods',
                columns: [
                    { name: 'internalid'},
                    { name: 'custrecord_inicio'},
                    { name: 'custrecord_final'},
                    { name: 'custrecord_cerrado'},
                    { name: 'custrecord_calendario'},

                ],
                filters: [
                    {
                        name: 'internalid',
                        operator: 'anyof',
                        values: idPeriod
                    }
                    /*{
                        name: 'custrecord_inicio',
                        operator: 'onorafter',
                        values: fDate
                    },
                    {
                        name: 'custrecord_final',
                        operator: 'onorbefore',
                        values: fDate
                    }*/
                ]
            });
            var objReturn = {};
            monthlyPeriod.run().each(function(r){
                objReturn['internalid'] = r.getValue('internalid'),
                objReturn['startDate'] = r.getValue('custrecord_inicio'),
                objReturn['endDate'] = r.getValue('custrecord_final'),
                objReturn['isClosed'] = r.getValue('custrecord_cerrado'),
                objReturn['parentCalendar'] = r.getValue('custrecord_calendario');
                return true;
            });
            return objReturn;
        },

        getISRList: function(parentCalendar){
            var isrSearch = search.create({
                type: 'customrecord_tablas_isr',
                columns: [
                    { name: 'internalid'},
                    { name: 'custrecord_tablas_isr_limite_inferior'},
                    { name: 'custrecord_tablas_isr_limite_superior'},
                    { name: 'custrecord_tablas_isr_cuota_fija'},
                    { name: 'custrecord_tablas_isr_porc_limite_inferi'}
                ],
                filters: [
                    {
                        name: 'custrecord_tablas_isr_calendario_vowerk',
                        operator: 'is',
                        values: parentCalendar
                    }
                ]
            });
            var objReturn = {};
            isrSearch.run().each(function(r){
                var internalid = r.getValue('internalid');
                objReturn[internalid] = {
                    'inferiorLimit': r.getValue('custrecord_tablas_isr_limite_inferior'),
                    'topLimit': r.getValue('custrecord_tablas_isr_limite_superior'),
                    'quota': r.getValue('custrecord_tablas_isr_cuota_fija'),
                    'percentOverIL': r.getValue('custrecord_tablas_isr_porc_limite_inferi')
                };
                return true;
            });
            return objReturn;
        },

        getObjCompConfigDetails: function(){
            var objCompensationConfig = this.getCompensationConfig();
            log.debug('objCompensationConfig',objCompensationConfig)
            var objWithVentasPresentadora = this.getEsquemaVentasPresentadora(objCompensationConfig);
            var objWithVentasJefaPropias = this.getEsquemaVentasJefaPropias(objWithVentasPresentadora);
            var objWithVentasJefaGrupo = this.getEsquemaVentasJefaGrupo(objWithVentasJefaPropias);
            var objWithVentasTrabajaXTM = this.getEsquemaVentasTrabajaXTM(objWithVentasJefaGrupo);
            var objWithVentasReclutamiento = this.getEsquemaVentasReclutamiento(objWithVentasTrabajaXTM);
            return objWithVentasReclutamiento
        },

        getCompensationConfig: function(){
            var confCompensation = search.create({
                type: 'customrecord_conf_de_compensaciones',
                columns: [{ name: 'internalid'}],
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }
                ]
            });
            var objReturn = {};
            confCompensation.run().each(function(r){
                objReturn[r.getValue('internalid')] = {
                    'esquemaVentasPresentadora' : {},
                    'esquemaVentasJefaGrupo' : {
                        'propias': {},
                        'grupo':{}
                    },
                    'esquemaVentasTrabajaXTM' : {},
                    'esquemaVentasReclutamiento' : {}
                };
                return true;
            });
            return objReturn;
        },

        getEsquemaVentasPresentadora: function(objCompensationConfig){
            var esqVentPres = search.create({
                type: 'customrecord_esq_ventas_pre',
                columns: [
                    { name: 'internalid'},
                    { name: 'custrecord_esq_ventas_pre_no_ventas'},
                    { name: 'custrecord_esq_ventas_pre_compensacion'},
                    { name: 'custrecord_esq_ventas_pre_entrega'},
                    { name: 'custrecord_esq_ventas_pre_bono'},
                    { name: 'custrecord_esq_ventas_pre_conf_comp'}
                ],
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }
                ]
            });
            
            esqVentPres.run().each(function(r){
                var thisParent = r.getValue('custrecord_esq_ventas_pre_conf_comp'),
                    internalid = r.getValue('internalid'),
                    numeroVentas = r.getValue('custrecord_esq_ventas_pre_no_ventas');
                objCompensationConfig[thisParent]['esquemaVentasPresentadora'][numeroVentas] = {
                    'compensacion': r.getValue('custrecord_esq_ventas_pre_compensacion'),
                    'entrega': r.getValue('custrecord_esq_ventas_pre_entrega'),
                    'bonoProductividad': r.getValue('custrecord_esq_ventas_pre_bono'),
                    'internalid': internalid
                }
                return true;
            });
            return objCompensationConfig;
        },
        getEsquemaVentasJefaPropias: function(objCompensationConfig){
            var esqVentJefaProp = search.create({
                type: 'customrecord_relacion_equipo_propias',
                columns: [
                    { name: 'internalid'},
                    { name: 'custrecord_relacion_equipo_propias_desde'},
                    { name: 'custrecord_relacion_equipo_propias_hasta'},
                    { name: 'custrecord_relacion_equipo_propias_porc'},
                    { name: 'custrecord_relacion_equipo_propias_c_c'}
                ],
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }
                ]
            });
            
            esqVentJefaProp.run().each(function(r){
                var internalid = r.getValue('internalid'),
                    thisParent = r.getValue('custrecord_relacion_equipo_propias_c_c');
//                log.debug('internalid',internalid);
//                log.debug('thisParent',thisParent);
                objCompensationConfig[thisParent]['esquemaVentasJefaGrupo']['propias'][internalid] = {
                    'desde': r.getValue('custrecord_relacion_equipo_propias_desde'),
                    'hasta': r.getValue('custrecord_relacion_equipo_propias_hasta'),
                    'porcentaje': r.getValue('custrecord_relacion_equipo_propias_porc')
                };
                
                return true;
            });
            return objCompensationConfig;
        },
        getEsquemaVentasJefaGrupo: function(objCompensationConfig){
            var esqVentJefaGrupo = search.create({
                type: 'customrecord_esq_ventas_jdg',
                columns: [
                    { name: 'internalid'},
                    { name: 'custrecord_esq_ventas_jdg_no_ventas_de'},
                    { name: 'custrecord_esq_ventas_jdg_no_ventas_a'},
                    { name: 'custrecord_esq_ventas_jdg_compensacion'},
                    { name: 'custrecord_esq_ventas_jdg_conf_comp'}
                ],
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }
                ]
            });
            
            esqVentJefaGrupo.run().each(function(r){
                var internalid = r.getValue('internalid'),
                    thisParent = r.getValue('custrecord_esq_ventas_jdg_conf_comp');
                objCompensationConfig[thisParent]['esquemaVentasJefaGrupo']['grupo'][internalid] = {
                    'desde': r.getValue('custrecord_esq_ventas_jdg_no_ventas_de'),
                    'hasta': r.getValue('custrecord_esq_ventas_jdg_no_ventas_a'),
                    'compensacion': r.getValue('custrecord_esq_ventas_jdg_compensacion')
                }
                return true;
            });
            return objCompensationConfig;
        },
        getEsquemaVentasTrabajaXTM: function(objCompensationConfig){//validar los campos ya que no tiene rango de ventas
            var esqVentTrabajaXTM = search.create({
                type: 'customrecord_esq_ventas_txtm',
                columns: [
                    { name: 'internalid'},
                    { name: 'custrecord_esq_ventas_txtm_no_venta'},
                    { name: 'custrecord_esq_ventas_txtm_compensacion'},
                    { name: 'custrecord_esq_ventas_txtm_retener'},
                    { name: 'custrecord_esq_ventas_txtm_conf_comp'}
                ],
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }
                ]
            });
            
            esqVentTrabajaXTM.run().each(function(r){
                var internalid = r.getValue('internalid'),
                    thisParent = r.getValue('custrecord_esq_ventas_txtm_conf_comp'),
                    numeroVentas = r.getValue('custrecord_esq_ventas_txtm_no_venta')
                objCompensationConfig[thisParent]['esquemaVentasTrabajaXTM'][numeroVentas] = {
                    'compensacion': r.getValue('custrecord_esq_ventas_txtm_compensacion'),
                    'retener': r.getValue('custrecord_esq_ventas_txtm_retener'),
                    'internalid' : internalid
                }
                return true;
            });
            return objCompensationConfig;
        },
        getEsquemaVentasReclutamiento: function(objCompensationConfig){
            var esqVentRec = search.create({
                type: 'customrecord_esq_ventas_rec',
                columns: [
                    { name: 'internalid'},
                    { name: 'custrecord_esq_ventas_rec_no_venta'},
                    { name: 'custrecord_esq_ventas_rec_compensacion'},
                    { name: 'custrecord_esq_ventas_rec_conf_comp'},
                ],
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }
                ]
            });
            
            esqVentRec.run().each(function(r){
                var internalid = r.getValue('internalid'),
                    thisParent = r.getValue('custrecord_esq_ventas_rec_conf_comp'),
                    numeroVentas = r.getValue('custrecord_esq_ventas_rec_no_venta');
                objCompensationConfig[thisParent]['esquemaVentasReclutamiento'][numeroVentas] = {
                    'compensacion': r.getValue('custrecord_esq_ventas_rec_compensacion'),
                    'internalid': internalid
                }
                return true;
            });
            return objCompensationConfig;
        },

        getBonos: function(id_emp,rec){
            log.debug(config_fields.bono_m_1[id_emp],rec.getValue(config_fields.bono_m_1[id_emp]));
            var bono_m_1 = rec.getValue(config_fields.bono_m_1[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_1[id_emp]));
            var bono_m_2 = rec.getValue(config_fields.bono_m_2[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_2[id_emp]));
            var bono_m_3 = rec.getValue(config_fields.bono_m_3[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_3[id_emp]));
            var bono_m_4 = rec.getValue(config_fields.bono_m_4[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_4[id_emp]));
            var bono_m_5 = rec.getValue(config_fields.bono_m_5[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_5[id_emp]));
            var bono_m_6 = rec.getValue(config_fields.bono_m_6[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_6[id_emp]));
            var bono_m_7 = rec.getValue(config_fields.bono_m_7[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_7[id_emp]));
            var bono_m_8 = rec.getValue(config_fields.bono_m_8[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_8[id_emp]));
            var bono_m_9 = rec.getValue(config_fields.bono_m_9[id_emp])  ==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_9[id_emp]));
            var bono_m_10 = rec.getValue(config_fields.bono_m_10[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bono_m_10[id_emp]));
           
            var bono_p_1 = rec.getValue(config_fields.bp1_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp1_monto[id_emp]));
            var bono_p_2 = rec.getValue(config_fields.bp2_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp2_monto[id_emp]));
            var bono_p_3 = rec.getValue(config_fields.bp3_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp3_monto[id_emp]));
            var bono_p_4 = rec.getValue(config_fields.bp4_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp4_monto[id_emp]));
            var bono_p_5 = rec.getValue(config_fields.bp5_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp5_monto[id_emp]));
            var bono_p_6 = rec.getValue(config_fields.bp6_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp6_monto[id_emp]));
            var bono_p_7 = rec.getValue(config_fields.bp7_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp7_monto[id_emp]));
            var bono_p_8 = rec.getValue(config_fields.bp8_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp8_monto[id_emp]));
            var bono_p_9 = rec.getValue(config_fields.bp9_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp9_monto[id_emp]));
            var bono_p_10 = rec.getValue(config_fields.bp10_monto[id_emp])==    ""?0:parseFloat(rec.getValue(config_fields.bp10_monto[id_emp]));
           
            return bono_m_1+bono_m_2+bono_m_3+bono_m_4+bono_m_5+bono_m_6+bono_m_7+bono_m_8+bono_m_9+bono_m_10+bono_p_1+bono_p_2+bono_p_3+bono_p_4+bono_p_5+bono_p_6+bono_p_7+bono_p_8+bono_p_9+bono_p_10;
        },
        
        getFileId: function (filename){
            try{
                  var id = false;
                  var fileSearchObj = search.create({
                    type: "file",
                    filters: [
                      ["name", "is", filename]
                    ],
                    columns: [
                      search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC
                      }),
                      "folder",
                      "url",
                      "filetype",
                      "internalid"
                    ]
                  });
    
                  var searchResult = fileSearchObj.run().getRange(0, 100);
                  for (var i = 0; i < searchResult.length; i++) {
                    id =  searchResult[i].getValue('internalid');
                  }
    
                  return id;
            }catch(err){
              log.debug("err get file",err);
              return false;
            }

      }
    };
    
});
