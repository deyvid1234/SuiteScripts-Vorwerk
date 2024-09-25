 /**
  * @NApiVersion 2.x
  * @NScriptType Suitelet
  * @NModuleScope SameAccount
  * @author Carl, Zeng
  * @description This's a sample SuiteLet script(SuiteScript 2.0) to export data
  *              to Excel file and directly download it in browser
  */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','N/encode','N/https','N/email'], 
function(plugin,task, serverWidget, search, runtime,file,encode,https,email){
    function onRequest(scriptContext) {
      try{/*
        log.debug('scriptContext',scriptContext.request.method)
        var mesAgo = '07'
        log.debug('mesAgo',mesAgo)
        mesAgo = parseInt(mesAgo)
        log.debug('mesAgo parse',mesAgo)
            
        var mesSep = '08'
        log.debug('mesSep',mesSep)
        var mesSep = parseInt(mesSep,10)
        log.debug('mesSep parse',mesSep)*/
        
        var request = scriptContext.request;
        var response = scriptContext.response;
        var paramsurl = scriptContext.request.parameters;
        
        log.debug('params',paramsurl)
        var form = createForm();
             
        scriptContext.response.writePage(form);

        //Obtiene los datos ingresados de los campos
        var cust_promo = paramsurl.promo;
        var cust_type = paramsurl.tipo;
        var cust_period_inicio = paramsurl.periodoI;
        var cust_period_fin = paramsurl.periodoF;
        var cust_presentadora = paramsurl.pre;
        log.debug('cust_presentadora',cust_presentadora)
        var custpage_periodo = form.getField({ id:'custpage_periodo'});
        custpage_periodo.defaultValue = cust_period_inicio;
        var custpage_type = form.getField({ id:'custpage_type'});
        custpage_type.defaultValue = cust_type;
        var custpage_promo = form.getField({ id:'custpage_promo'});
        custpage_promo.defaultValue = cust_promo;
        var custpage_presentadora = form.getField({ id:'custpage_presentadora'});
        custpage_presentadora.defaultValue = cust_presentadora;
        
        scriptContext.response.writePage(form);  

        
        tablas(form,cust_type,cust_promo,cust_period_inicio,cust_presentadora);
                
            
            scriptContext.response.writePage(form); 
            
      }catch(err){
        log.error("Error onRequest",err)
      }
      
    
    
    function createForm(){
      try{
        var form = serverWidget.createForm({
          title: 'Detalle Presentadoras'
        });
          form.addFieldGroup({
                id: 'custpage_data_pre',
                label: 'Informacion Presentadora'
            })
          form.addField({
                id: 'custpage_periodo',
                type: serverWidget.FieldType.TEXT,
                label: 'Periodo de Comision',
                container: 'custpage_data_pre'
            });

            form.addField({
                id: 'custpage_promo',
                type: serverWidget.FieldType.SELECT,
                label: 'Promocion',
                source: 'customlist_promocion',
                container: 'custpage_data_pre'
            });
            form.addField({
                id: 'custpage_presentadora',
                type: serverWidget.FieldType.SELECT,
                label: 'Presentadora',
                source: 'employee',
                container: 'custpage_data_pre'
            });
              
            var select = form.addField({
                id: 'custpage_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipo',
                container: 'custpage_data_pre'
            });
            select.addSelectOption({
                value : 1,
                text : 'Presentadora'
            });
            select.addSelectOption({
                value : 3,
                text : 'Lideres de Equipo'
            });
            
            
        return form;
            
           
        }catch (e){
           log.debug("error create form",e)
        }
    }
    function tablas(form,cust_type,cust_promo,cust_period,cust_presentadora){
      try{
        
          var dataPresentadora = searchDataPresentadoras(cust_presentadora)  
          
             
          var line = 0
          var idEquipo= []
          var sublistEq = sublistEquipo(form,cust_type,cust_promo)
          log.debug('sublistEq',sublistEq)
          var sublistEqS = sublistEq.s
          log.debug('sublistEqS',sublistEqS)
          var sublistEqVentas = sublistEq.sv
          log.debug('sublistEqVentas',sublistEqVentas)
          var sublistaRec = sublistRec(form,cust_type,cust_promo)
          pruebatabs(form,cust_type,cust_promo,cust_presentadora)
        
          
        for (i in dataPresentadora.empGrupos[cust_presentadora]){

            
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].internalid
            idEquipo.push(parseInt(v))
            sublistEqS.setSublistValue({
                id : 'nombre',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].internalid
            sublistEqS.setSublistValue({
                id : 'id',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].promocion
            sublistEqS.setSublistValue({
                id : 'promocion',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].hiredate
            sublistEqS.setSublistValue({
                id : 'hiredate',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].objetivo_1
            sublistEqS.setSublistValue({
                id : 'objetivo_1',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].objetivo_2
            sublistEqS.setSublistValue({
                id : 'objetivo_2',
                line : line,
                value : v!=null?v:''
            });

            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].fechaReactivacion
            if(v != ''){
                sublistEqS.setSublistValue({
                id : 'fecha_reactivacion',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].obj_1_reactivacion
            sublistEqS.setSublistValue({
                id : 'obj_1_reactivacion',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].obj_2_reactivacion
            sublistEqS.setSublistValue({
                id : 'obj_2_reactivacion',
                line : line,
                value : v!=null?v:''
            });
            }
            
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].emp_conf
            sublistEqS.setSublistValue({
                id : 'emp_conf',
                line : line,
                value : v!=null?v:''
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empGrupos[cust_presentadora][i]].conf_reclutamiento
            
            if(v != ''){
                sublistEqS.setSublistValue({
                    id : 'conf_reclutamiento',
                    line : line,
                    value : v
                });
            }
            
            
            
            
            line ++
        }
        ventasEquipo(sublistEq,idEquipo)
          var line_rec = 0
          for (i in dataPresentadora.empReclutas[cust_presentadora]){

            //log.debug('i',dataPresentadora.empReclutas[cust_presentadora][i])
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].internalid
            //log.debug('v',v)
            sublistaRec.setSublistValue({
                id : 'nombre_rec',
                line : line_rec,
                value : v
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].internalid
            sublistaRec.setSublistValue({
                id : 'id_rec',
                line : line_rec,
                value : v
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].promocion
            sublistaRec.setSublistValue({
                id : 'promocion_rec',
                line : line_rec,
                value : v
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].hiredate
            sublistaRec.setSublistValue({
                id : 'hiredate_rec',
                line : line_rec,
                value : v
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].objetivo_1
            sublistaRec.setSublistValue({
                id : 'objetivo_1_rec',
                line : line_rec,
                value : v
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].objetivo_2
            sublistaRec.setSublistValue({
                id : 'objetivo_2_rec',
                line : line_rec,
                value : v
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].fechaReactivacion
            if(v != ''){
                sublistaRec.setSublistValue({
                    id : 'fechareactivacion_rec',
                    line : line_rec,
                    value : v
                });
                var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].obj_1_reactivacion
                sublistaRec.setSublistValue({
                    id : 'obj_1_reactivacion_rec',
                    line : line_rec,
                    value : v
                });
                var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].obj_2_reactivacion
                sublistaRec.setSublistValue({
                    id : 'obj_2_reactivacion_rec',
                    line : line_rec,
                    value : v
                });
            }
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].emp_conf
            sublistaRec.setSublistValue({
                id : 'emp_conf_rec',
                line : line_rec,
                value : v
            });
            var v = dataPresentadora.allPresentadorData[dataPresentadora.empReclutas[cust_presentadora][i]].conf_reclutamiento
            if(v != ''){
                sublistaRec.setSublistValue({
                id : 'conf_reclutamiento_rec',
                line : line_rec,
                value : v
            });
            }

            line_rec ++
          }
          
      
  
      }catch(e){
        log.debug('error tablas',e)
      }

    }
    function ventasEquipo(sublistEq,idEquipo){
        var sublistEqVentas = sublistEq.sv
        var mySearch = search.load({
                id : 'customsearch_ventas_pre_detalle'
            });
            
            log.debug('sin tabla integrantes equipo',idEquipo)
            
            mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: ['1/1/2023', '30/7/2024']
            }));
            try {
                mySearch.filters.push(search.createFilter({
                    name: 'salesrep',
                    operator: 'anyof',
                    values: idEquipo
                }));
            } catch (error) {
                log.error('Error adding salesrep filter', error);
            }
    

            // Run the paged search
            try {
                

                var e = 0;
            log.debug('inicia busqueda')
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (result) {
                    var data = result.getAllValues()
                    log.debug('data ventas equipo',data)
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_efecha',
                            value: result.getValue({
                                name: 'trandate'
                            }),
                            line: e
                        });
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_epedido',
                            value: result.getValue({
                                name: 'tranid'
                            }),
                            line: e
                        });
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_epre',
                            value: result.getText({
                                name: 'entity'
                            }),
                            line: e
                        });
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_etipo_venta',
                            value: result.getValue({
                                name: 'custbody_tipo_venta'
                            }),
                            line: e
                        });
                        var reclutadora = result.getValue({
                                name: 'custbody_vw_recruiter'
                            })
                        if(reclutadora != ''){
                            sublistEqVentas.setSublistValue({
                                id: 'custpage_ereclutadora_odv',
                                value: reclutadora,
                                line: e
                            });
                        }
                        
                        /*resultSublist.setSublistValue({
                            id: 'custpage_alta',
                            value: result.getValue({
                                name: ({ name: 'hiredate', join: 'salesrep' });
                            }),
                            line: i
                        });
                        resultSublist.setSublistValue({
                            id: 'custpage_promocion',
                            value: result.getValue({
                                name: ({ name: 'custentity_promocion', join: 'salesrep' });
                            }),
                            line: i
                        });*/
                        e++;
                    
                });
            });
                
            } catch (error) {
                log.error('Search error', error.message);
            }
    }
    function pruebatabs(form,cust_type,cust_promo,cust_presentadora){
        try {
           

            var resultSublist = form.addSublist({
                id: 'sublistid',
                type: serverWidget.SublistType.STATICLIST,
                label: 'Ventas Propias'
            });

            var mySearch = search.load({
                id : 'customsearch_ventas_pre_detalle'
            });
            mySearch.filters.push(search.createFilter({
                   name: 'salesrep',
                   operator: 'anyof',
                   values: cust_presentadora
            }));
            mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: ['1/1/2024', '30/7/2024']
            }));

            // Run the paged search
            var pagedData = mySearch.runPaged({
                pageSize: 25
            });

            
            resultSublist.addField({
                id: 'custpage_fecha',
                label: 'Fecha',
                type: serverWidget.FieldType.TEXT
            });
            resultSublist.addField({
                id: 'custpage_pedido',
                label: 'Pedido',
                type: serverWidget.FieldType.TEXT
            });
            resultSublist.addField({
                id: 'custpage_pre',
                label: 'Presentadora',
                type: serverWidget.FieldType.TEXT
            });
            resultSublist.addField({
                id: 'custpage_tipo_venta',
                label: 'Tipo De Venta',
                type: serverWidget.FieldType.TEXT
            });
            resultSublist.addField({
                id: 'custpage_reclutadora_odv',
                label: 'Reclutadora ODV',
                type: serverWidget.FieldType.TEXT
            });
            resultSublist.addField({
                id: 'custpage_alta',
                label: 'Alta Presentadora',
                type: serverWidget.FieldType.TEXT
            });
            resultSublist.addField({
                id: 'custpage_promocion',
                label: 'Promocion',
                type: serverWidget.FieldType.TEXT
            });

            var i = 0;
            pagedData.pageRanges.forEach(function (pageRange) {
                var myPage = pagedData.fetch({
                    index: pageRange.index
                });
                myPage.data.forEach(function (result) {
                    var data = result.getAllValues()
                    //log.debug('data',data)
                        resultSublist.setSublistValue({
                            id: 'custpage_fecha',
                            value: result.getValue({
                            name: 'trandate'
                            }),
                            line: i
                        });
                        resultSublist.setSublistValue({
                            id: 'custpage_pedido',
                            value: result.getValue({
                                name: 'tranid'
                            }),
                            line: i
                        });
                        resultSublist.setSublistValue({
                            id: 'custpage_pre',
                            value: result.getText({
                                name: 'entity'
                            }),
                            line: i
                        });
                        resultSublist.setSublistValue({
                            id: 'custpage_tipo_venta',
                            value: result.getValue({
                                name: 'custbody_tipo_venta'
                            }),
                            line: i
                        });
                        var reclutadora = result.getValue({
                                name: 'custbody_vw_recruiter'
                            })
                        if(reclutadora != ''){
                            resultSublist.setSublistValue({
                            id: 'custpage_reclutadora_odv',
                            value: reclutadora,
                            line: i
                        });
                        }
                        
                        /*resultSublist.setSublistValue({
                            id: 'custpage_alta',
                            value: result.getValue({
                                name: ({ name: 'hiredate', join: 'salesrep' });
                            }),
                            line: i
                        });
                        resultSublist.setSublistValue({
                            id: 'custpage_promocion',
                            value: result.getValue({
                                name: ({ name: 'custentity_promocion', join: 'salesrep' });
                            }),
                            line: i
                        });*/
                        i++;
                    
                });
            });

            resultSublist.label = 'Ventas Propias (' + resultSublist.lineCount + ')';
            
        
            
            return resultSublist;
        }catch(e){
            log.debug('error tabs',e)
        }
        
    }
    function sublistEquipo(form,cust_type,cust_promo){
       
            var tab = form.addTab({
                id : 'inf_equipo',
                label : 'Informacion equipo'
            });
            var thidField
            var fieldSublistVentas
                
            var sublist = form.addSublist({
                id: 'custpage_equipo',
                type: serverWidget.SublistType.STATICLIST,
                label: 'Integrantes del Equipo',
                tab: 'inf_equipo'
            });            

            thidField = sublist.addField({
                id: 'nombre',
                type: serverWidget.FieldType.SELECT,
                source:'employee',
                label: 'Nombre'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});        
                        
            thidField = sublist.addField({
                id: 'id',
                type: serverWidget.FieldType.TEXT,
                label: 'Internal ID'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            thidField = sublist.addField({
                id: 'promocion',
                type: serverWidget.FieldType.TEXT,
                label: 'Promocion'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'hiredate',
                type: serverWidget.FieldType.TEXT,
                label: 'Fecha Contratación'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'objetivo_1',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo 1'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'objetivo_2',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo 2'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'fecha_reactivacion',
                type: serverWidget.FieldType.TEXT,
                label: 'Fecha Reactivación'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'obj_1_reactivacion',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo Reactivación 1'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'obj_2_reactivacion',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo Reactivación 2'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'emp_conf',
                type: serverWidget.FieldType.TEXT,
                label: 'Configuración'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'conf_reclutamiento',
                type: serverWidget.FieldType.TEXT,
                label: 'Configuración de reclutamiento'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});


            var sublistventas = form.addSublist({
                id: 'custpage_equipo_ventas',
                type: serverWidget.SublistType.STATICLIST,
                label: 'Ventas del equipo',
                tab: 'inf_equipo'
            });  
            sublistventas.addField({
                id: 'custpage_efecha',
                label: 'Fecha',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas.addField({
                id: 'custpage_epedido',
                label: 'Pedido',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas.addField({
                id: 'custpage_epre',
                label: 'Presentadora',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas.addField({
                id: 'custpage_etipo_venta',
                label: 'Tipo De Venta',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas.addField({
                id: 'custpage_ereclutadora_odv',
                label: 'Reclutadora ODV',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas.addField({
                id: 'custpage_ealta',
                label: 'Alta Presentadora',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas.addField({
                id: 'custpage_epromocion',
                label: 'Promocion',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            
            return {s:sublist,sv:sublistventas}
    }
    function sublistRec(form,cust_type,cust_promo){
      
            var tab2 = form.addTab({
                id : 'inf_reclutas',
                label : 'Informacion de Reclutas'
            });
            /*form.insertTab({
                tab: tab2,
                nexttab:'inf_equipo'
            });*/
            var sublist = form.addSublist({
                id: 'custpage_reclutas',
                type: serverWidget.SublistType.STATICLIST,
                label: 'Reclutas',
                tab: 'inf_reclutas'
            });            

            thidField = sublist.addField({
                id: 'nombre_rec',
                type: serverWidget.FieldType.SELECT,
                source:'employee',
                label: 'Nombre'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});        
            
            thidField = sublist.addField({
                id: 'id_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Internal ID'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'promocion_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Promocion'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'hiredate_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Fecha Contratación'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'objetivo_1_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo 1'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'objetivo_2_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo 2'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'fechareactivacion_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Fecha Reactivación'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'obj_1_reactivacion_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo Reactivación 1'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'obj_2_reactivacion_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Objetivo Reactivación 2'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'emp_conf_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Configuración'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'conf_reclutamiento_rec',
                type: serverWidget.FieldType.TEXT,
                label: 'Configuración de reclutamiento'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            return sublist;
    }
    function searchDataPresentadoras(cust_presentadora){ 
        try{
           
            const employeeSearchFilters = [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custentity_estructura_virtual', 'is', 'F'],
                'AND',
                ['salesrep', 'is', cust_presentadora],
                'OR',
                ['custentity_reclutadora', 'is', cust_presentadora],
                'AND',
                ['employeetype', 'anyof', '3', '1', '8', '5', '9'],//tipos 3 Lider de equipo, 1 presentadora, 8 area manager, 5 gerente de ventas, 9 sales director
            ];

            const empSearchentityid = search.createColumn({ name: 'entityid'});
            const empSearchfirstname = search.createColumn({ name: 'firstname'});
            const empSearchsupervisor = search.createColumn({ name: 'supervisor'});
            const empSearchcustentity_promocion = search.createColumn({ name: 'custentity_promocion'});
            const empSearchemployeetype = search.createColumn({ name: 'employeetype'});
            const empSearchcustentity_reclutadora = search.createColumn({ name: 'custentity_reclutadora'});
            const empSearchhiredate = search.createColumn({ name: 'hiredate'});
            const empSearchcustentity_fin_objetivo_1 = search.createColumn({ name: 'custentity_fin_objetivo_1'});
            const empSearchcustentity_fin_objetivo_2 = search.createColumn({ name: 'custentity_fin_objetivo_2'});
            const empSearchcustentity72 = search.createColumn({ name: 'custentity72'});
            const empSearchcustentity_fin_objetivo_1_reactivacion = search.createColumn({ name: 'custentity_fin_objetivo_1_reactivacion'});
            const empSearchcustentity_fin_objetivo_2_reactivacion = search.createColumn({ name: 'custentity_fin_objetivo_2_reactivacion'});
            const empSearchcustentity123 = search.createColumn({ name: 'custentity123'});
            const empSearchcustentity_conf_rec = search.createColumn({ name: 'custentity_conf_rec'});
            const empSearchissalesrep = search.createColumn({ name: 'issalesrep'});
            const empSearchinternalid = search.createColumn({ name: 'internalid'});
            const empSearchdelegada = search.createColumn({ name: 'custentity_delegada'});
            const empSearchunidad = search.createColumn({ name: 'custentity_nombre_unidad'});
            //const employeeSearchReclutadoraInternalId = search.createColumn({ name: 'internalid', join: 'custentity_reclutadora' });
            const empSearchtiponombramiento = search.createColumn({ name: 'custentity_nombramiento_le'});
            const empSearchnombradopor = search.createColumn({ name: 'custentity_nombramiento'});
            const empSearchfechanombramiento = search.createColumn({ name: 'custentity_fecha_nombramiento'});
            const empSearchPeriodoPagoNLE = search.createColumn({ name: 'custentityperiodo_nle_pago'});

            const mySearch = search.create({
                type: 'employee',
                filters: employeeSearchFilters,
                columns: [
                    empSearchentityid,
                    empSearchfirstname,
                    empSearchsupervisor,
                    empSearchcustentity_promocion,
                    empSearchemployeetype,
                    empSearchcustentity_reclutadora,
                    empSearchhiredate,
                    empSearchcustentity_fin_objetivo_1,
                    empSearchcustentity_fin_objetivo_2,
                    empSearchcustentity72,
                    empSearchcustentity_fin_objetivo_1_reactivacion,
                    empSearchcustentity_fin_objetivo_2_reactivacion,
                    empSearchcustentity123,
                    empSearchcustentity_conf_rec,
                    empSearchissalesrep,
                    empSearchinternalid,
                    empSearchdelegada,
                    empSearchunidad,
                    //employeeSearchReclutadoraInternalId,
                    empSearchtiponombramiento,
                    empSearchnombradopor,
                    empSearchfechanombramiento,
                    empSearchPeriodoPagoNLE,


                ],
            });
            
            var allPresentadorData = {} //Todos los datos de todos los presentadores activos arreglo[presentadora] = {obj1:20/01/2024, conf: CC01...}
            var empGrupos = {} //Arreglo de lideres de equipo y sus integrantes arreglo[liderGrupo] = [integrante1,integrante2...]
            var empReclutas = {}//Arreglo de presentadores y sus reclutados arreglo[Reclutadora] = [reclutada1,reclutada2...]
            var nombradsPor={}//arreglo de presentadoras

            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                   
                    var objEMP = new Object();
                    objEMP.entityid = r.getValue('entityid')
                    objEMP.firstname = r.getValue('firstname')
                    objEMP.supervisor = r.getValue('supervisor')
                    objEMP.promocion = r.getValue('custentity_promocion')
                    objEMP.employeetype = r.getValue('employeetype')
                    objEMP.emp_reclutadora = r.getValue('custentity_reclutadora')
                    objEMP.hiredate = r.getValue('hiredate')
                    objEMP.objetivo_1 = r.getValue('custentity_fin_objetivo_1')
                    objEMP.objetivo_2 = r.getValue('custentity_fin_objetivo_2')
                    objEMP.fechaReactivacion = r.getValue('custentity72')
                    objEMP.obj_1_reactivacion = r.getValue('custentity_fin_objetivo_1_reactivacion')
                    objEMP.obj_2_reactivacion = r.getValue('custentity_fin_objetivo_2_reactivacion')
                    objEMP.emp_conf = r.getValue('custentity123')
                    objEMP.conf_reclutamiento = r.getValue('custentity_conf_rec')
                    objEMP.issalesrep = r.getValue('issalesrep')
                    objEMP.internalid = r.getValue('internalid')
                    objEMP.delegada = r.getText('custentity_delegada')
                    objEMP.unidad = r.getValue('custentity_nombre_unidad')
                    //objEMP.reclutadoraID = r.getValue({ name: 'internalid', join: 'custentity_reclutadora' })
                    objEMP.tipoNombramento = r.getValue('custentity_nombramiento_le')
                    objEMP.nombramientoPor = r.getValue('custentity_nombramiento')
                    objEMP.fechaNombramiento = r.getValue('custentity_fecha_nombramiento')
                    objEMP.periodoPagoNLE = r.getValue('custentityperiodo_nle_pago')

                    allPresentadorData[objEMP.internalid] = objEMP

                    if(empGrupos.hasOwnProperty(objEMP.supervisor)){
                        empGrupos[objEMP.supervisor].push(objEMP.internalid)
                    }else{
                        empGrupos[objEMP.supervisor] = [objEMP.internalid]  
                    }

                    if(empReclutas.hasOwnProperty(objEMP.emp_reclutadora)){
                        empReclutas[objEMP.emp_reclutadora].push(objEMP.internalid)
                    }else{
                        empReclutas[objEMP.emp_reclutadora] = [objEMP.internalid]  
                    }

                   /* if(objEMP.nombramientoPor != '' && objEMP.tipoNombramento == 4){
                        var periodo=namePeriodo.split('/')
                        var mesPeriodo = parseInt(periodo[0])
                        var yearPeriodo=parseInt(periodo[1])

                        var mesMinimo=mesPeriodo-3    
                        var fechaNombramiento=objEMP.fechaNombramiento.split('/')
                        var mesNombramiento=parseInt(fechaNombramiento[1])
                        var yearNom=parseInt(fechaNombramiento[2])
                        log.debug('periodo',periodo)
                            log.debug('mesNombramiento',mesNombramiento)
                            log.debug('mesMinimo',mesMinimo)
                            log.debug('mesPeriodo',mesPeriodo)
                            log.debug('yearNom',yearNom)
                            log.debug('yearPeriodo',yearPeriodo)
                        if(mesNombramiento>mesMinimo && mesNombramiento <= mesPeriodo && yearNom ==yearPeriodo && mesNombramiento >= 5){

                            if(nombradsPor.hasOwnProperty(objEMP.nombramientoPor)){
                                nombradsPor[objEMP.nombramientoPor].push(objEMP.internalid)
                            }else{
                                nombradsPor[objEMP.nombramientoPor] = [objEMP.internalid]
                            }
                          
                        }
                    }*/

                });
                      
            });

            var equipoYRecluta = {}

            for(i in empReclutas){//Se recorren los presentadores 
               
               if(empGrupos.hasOwnProperty(i)){
                 //log.debug('empReclutas[i]',empReclutas[i])
                 //log.debug('i',i)
                 //log.debug('empGrupos[i]',empGrupos[i])
                    //Existe el presentador en la lista de grupos
                    for(j in empReclutas[i]){//Se recorren los reclutas del presentador
                        
                        if(empGrupos[i].indexOf(empReclutas[i][j]) !== -1){                          
                            //llenar el arreglo equipoYRecluta
                            
                            if(equipoYRecluta.hasOwnProperty(i)){
                                equipoYRecluta[i].push(empReclutas[i][j])
                            }else{
                                equipoYRecluta[i] = [empReclutas[i][j]]  
                            }

                        }
                    }
               }
            }
            
            return {allPresentadorData:allPresentadorData,empGrupos:empGrupos,empReclutas:empReclutas,equipoYRecluta:equipoYRecluta}
        }catch(e){
            log.error('Error en searchDataPresentadoras',e)
        }
    }   
      }
      

        return {
            onRequest : onRequest
        };

});