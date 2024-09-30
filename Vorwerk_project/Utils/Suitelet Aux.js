 /**
  * @NApiVersion 2.x
  * @NScriptType Suitelet
  * @NModuleScope SameAccount
  * @author Carl, Zeng
  * @description This's a sample SuiteLet script(SuiteScript 2.0) to export data
  *              to Excel file and directly download it in browser
  */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','N/encode','N/https','N/email','N/record'], 
function(plugin,task, serverWidget, search, runtime,file,encode,https,email,record){
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
        
             
        

        //Obtiene los datos ingresados de los campos
        var cust_promo = paramsurl.promo;
        var cust_type = paramsurl.tipo;
        var cust_period_inicio = paramsurl.periodoI;
        var cust_period_fin = paramsurl.periodoF;
        var cust_presentadora = paramsurl.pre;
        log.debug('cust_presentadora',cust_presentadora)
        
        var form = infoPresentadraPrincipal(cust_type,cust_promo,cust_presentadora,cust_period_inicio,cust_period_fin);
        scriptContext.response.writePage(form);  
        var busquedaPresentadora = searchDataPresentadoras(cust_presentadora)
        var allPresentadorData = busquedaPresentadora.allPresentadorData
        var arregloEquipo = busquedaPresentadora.empGrupos
        var arregloReclutas = busquedaPresentadora.empReclutas
        var nombramientos = busquedaPresentadora.nombramiento
        
        log.debug('busquedaPresentadora',busquedaPresentadora)
        log.debug('arregloEquipo',arregloEquipo)
        log.debug('arregloReclutas',arregloReclutas)
        log.debug('nombramientos',nombramientos)
        if(JSON.stringify(busquedaPresentadora.empGrupos).length > 2 ){
            log.debug('hay equipo')
            var sublistEq = sublistEquipo(form)
            var tablasEquipo = ventasEquipo(sublistEq,arregloEquipo,cust_period_inicio,cust_period_fin,cust_presentadora,allPresentadorData)
        }
        if(JSON.stringify(busquedaPresentadora.empReclutas).length > 2){
            log.debug('hay reclutas')
            var sublistRec = sublistRec(form)
            var tablasReclutas = ventasReclutas(sublistRec,arregloReclutas,cust_period_inicio,cust_period_fin,cust_presentadora,allPresentadorData)
        }
        if (JSON.stringify(nombramientos).length > 2){//como
            log.debug('hay nombramientos')
            var sublistNombramientos = sublistNombramientos(form)
            var tablasReclutas = ventasEquipoNLE(nombramientos[cust_presentadora],sublistNombramientos,cust_period_inicio,cust_period_fin,cust_presentadora,allPresentadorData)

        }
        
                
            
            scriptContext.response.writePage(form); 
            
      }catch(err){
        log.error("Error onRequest",err)
      }
      
    
    
    function infoPresentadraPrincipal(){
    try{
        var form = serverWidget.createForm({
          title: 'Detalle Presentadoras'
        });
        form.addFieldGroup({
            id: 'custpage_data_pre',
            label: 'Informacion Presentadora'
        })
        var a = form.addField({
            id: 'custpage_periodo_inicio',
            type: serverWidget.FieldType.TEXT,
            label: 'Inicio Periodo de Comision',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var b =form.addField({
            id: 'custpage_periodo_fin',
            type: serverWidget.FieldType.TEXT,
            label: 'Fin Periodo de Comision',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

        var c =form.addField({
            id: 'custpage_promo',
            type: serverWidget.FieldType.TEXT,
            label: 'Promocion',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var d =form.addField({
            id: 'custpage_presentadora',
            type: serverWidget.FieldType.TEXT,
            label: 'Presentadora',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var e =form.addField({
            id: 'custpage_hiredate',
            type: serverWidget.FieldType.TEXT,
            label: 'Fecha de contratación',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var m =form.addField({
            id: 'custpage_obj1',
            type: serverWidget.FieldType.TEXT,
            label: 'Objetivo 1',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var f =form.addField({
            id: 'custpage_obj2',
            type: serverWidget.FieldType.TEXT,
            label: 'Objetivo 2',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var g =form.addField({
            id: 'custpage_react',
            type: serverWidget.FieldType.TEXT,
            label: 'Fecha reactivación',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var h =form.addField({
            id: 'custpage_obj1react',
            type: serverWidget.FieldType.TEXT,
            label: 'Objetivo 1 Reactivación',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var i =form.addField({
            id: 'custpage_obj2react',
            type: serverWidget.FieldType.TEXT,
            label: 'Objetivo 2 Reactivación',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var j =form.addField({
            id: 'custpage_conf',
            type: serverWidget.FieldType.TEXT,
            label: 'Configuracion de ingreso',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var k =form.addField({
            id: 'custpage_confrec',
            type: serverWidget.FieldType.TEXT,
            label: 'Configuración de Reclutamiento',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
              
        var l =form.addField({
            id: 'custpage_type',
            type: serverWidget.FieldType.TEXT,
            label: 'Tipo',
            container: 'custpage_data_pre'
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        


        //ventas propias
        var registroPresentadora = record.load({
                type: 'employee',
                id: cust_presentadora,
                isDynamic: false
            });
            var nombre = registroPresentadora.getValue('firstname')
            var tipo = registroPresentadora.getText('employeetype')
            var promo = registroPresentadora.getText('custentity_promocion')
            var hiredate = registroPresentadora.getValue('hiredate')
            var obj1 = registroPresentadora.getValue('custentity_fin_objetivo_1')
            var obj2 = registroPresentadora.getValue('custentity_fin_objetivo_2')
            var reactivacion = registroPresentadora.getValue('custentity72')
            var obj1React = registroPresentadora.getValue('custentity_fin_objetivo_1_reactivacion')
            var obj2React = registroPresentadora.getValue('custentity_fin_objetivo_2_reactivacion')
            var config = registroPresentadora.getText('custentity123')
            var confReclutamiento = registroPresentadora.getValue('custentity_conf_rec')
            var entity = registroPresentadora.getValue('entityid')
            
            a.defaultValue = cust_period_inicio
            b.defaultValue = cust_period_fin
            d.defaultValue = entity + ' ' + nombre
            l.defaultValue = tipo
            c.defaultValue = promo
            e.defaultValue = hiredate
            m.defaultValue = obj1
            f.defaultValue = obj2
            g.defaultValue = reactivacion
            h.defaultValue = obj1React
            i.defaultValue = obj2React
            j.defaultValue = config
            k.defaultValue = confReclutamiento

           
            
            //BUSCA VENTAS PROPIAS Y ASIGNA VALORES EN LA TABLA DE VENTA PROPIA
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
                   values: [cust_period_inicio, cust_period_fin]
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
                id: 'custpage_com_st',
                label: 'Commission Status',
                type: serverWidget.FieldType.TEXT
            });
            resultSublist.addField({
                id: 'custpage_reclutadora_odv',
                label: 'Reclutadora ODV',
                type: serverWidget.FieldType.TEXT
            });
            

            var i = 0;
            pagedData.pageRanges.forEach(function (pageRange) {
                var myPage = pagedData.fetch({
                    index: pageRange.index
                });
                myPage.data.forEach(function (result) {
                    var data = result.getAllValues()
                    log.debug('data',data)
                    var v
                    
                    v = result.getValue({name: 'trandate'})
                    resultSublist.setSublistValue({
                        id: 'custpage_fecha',
                        value: v!=''?v:"-",
                        line: i
                    });
                    v = result.getValue({name: 'tranid'})
                    resultSublist.setSublistValue({
                        id: 'custpage_pedido',
                        value:v!=''?v:"-" ,
                        line: i
                    });
                    v = result.getText({name: 'salesrep'})
                    resultSublist.setSublistValue({
                        id: 'custpage_pre',
                        value:v!=''?v:"-" ,
                        line: i
                    });
                    v = result.getText({name: 'custbody_tipo_venta'})
                    resultSublist.setSublistValue({
                        id: 'custpage_tipo_venta',
                        value: v!=''?v:"-",
                        line: i
                    });
                    var v = result.getText({name: 'custbody_vw_comission_status'})
                    
                    resultSublist.setSublistValue({
                        id: 'custpage_com_st',
                        value: v!=''?v:"-",
                        line: i
                    });
                    
                    
                    var v = result.getValue({name: 'custbody_vw_recruiter'})
                    
                    resultSublist.setSublistValue({
                        id: 'custpage_reclutadora_odv',
                        value:v!=''?v:"-" ,
                        line: i
                    });
                    
                    
            
                    i++;
                    
                });
            });

            resultSublist.label = 'Ventas Propias (' + resultSublist.lineCount + ')';   
            
            
        return form;
            
           
        }catch (e){
           log.debug("error create form",e)
        }
    }
    function ventasReclutas(sublistRec,arregloReclutas,cust_period_inicio,cust_period_fin,cust_presentadora,allPresentadorData){
      try{
        var sublistRecS = sublistRec.s
        log.debug('sublistRecS',sublistRecS)
        var sublistRecVentas = sublistRec.sv
        log.debug('sublistRecVentas',sublistRecVentas)
        var idReclutas= []
        var line_rec = 0
        var v
        for (i in arregloReclutas[cust_presentadora]){
            //log.debug('i',dataPresentadora.empReclutas[cust_presentadora][i])
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].internalid
            idReclutas.push(parseInt(v))
            sublistRecS.setSublistValue({
                id : 'nombre_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].internalid
            sublistRecS.setSublistValue({
                id : 'id_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].promocion
            sublistRecS.setSublistValue({
                id : 'promocion_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].hiredate
            sublistRecS.setSublistValue({
                id : 'hiredate_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].objetivo_1
            sublistRecS.setSublistValue({
                id : 'objetivo_1_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].objetivo_2
            sublistRecS.setSublistValue({
                id : 'objetivo_2_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].fechaReactivacion
            
            sublistRecS.setSublistValue({
                id : 'fechareactivacion_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].obj_1_reactivacion
            sublistRecS.setSublistValue({
                id : 'obj_1_reactivacion_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].obj_2_reactivacion
            sublistRecS.setSublistValue({
                id : 'obj_2_reactivacion_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].emp_conf
            
            sublistRecS.setSublistValue({
                id : 'emp_conf_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            
            v = allPresentadorData[arregloReclutas[cust_presentadora][i]].conf_reclutamiento
            
            sublistRecS.setSublistValue({
                id : 'conf_reclutamiento_rec',
                line : line_rec,
                value : v!=''?v:"-"
            });
            

            line_rec ++
        }
          
        var mySearch = search.load({
                id : 'customsearch_ventas_pre_detalle'
            });
            
            log.debug('Reclutas',idReclutas)
            
            mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: [cust_period_inicio, cust_period_fin]
            }));
            
            mySearch.filters.push(search.createFilter({
                name: 'salesrep',
                operator: 'anyof',
                values: idReclutas
            }));
                

            // Run the paged search
            try {
                

            var e = 0;
            
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (result) {
                    var data = result.getAllValues()
                    log.debug('data ventas reclutas',data)
                    var v
                    try {
                        
                        v = result.getValue({
                                name: 'trandate'
                            })
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rfecha',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getValue({
                                name: 'tranid'
                            })
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rpedido',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getValue({
                                name: 'internalid'
                            })
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rint_id',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getText({
                                name: 'salesrep'
                            })
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rpre',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v =  result.getText({
                            name: 'custbody_tipo_venta'
                        })
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rtipo_venta',
                            value:v!=''?v:"-",
                            line: e
                        });
                        var v = result.getText({
                                name: 'custbody_vw_recruiter'
                            })
                        
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rreclutadora_odv',
                            value: v!=''?v:"-",
                            line: e
                        });
                        v = result.getText({
                                name: 'custbody_vw_comission_status'
                            })
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rcom_status',
                            value:v!=''?v:"-" ,
                            line: e
                        }); 
                        v = result.getText({
                                name: 'custbody_tipo_venta'
                            })
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rtipo_venta',
                            value:v!=''?v:"-" ,
                            line: e
                        }); 
                        v = data['salesRep.hiredate']
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_ralta',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = data['salesRep.custentity_promocion'][0].text
                        sublistRecVentas.setSublistValue({
                            id: 'custpage_rpromocion',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                    }catch(e){
                        log.error('error set value buqueda reclutasventas',e)
                    }
                    
                    e++;
                    
                });
            });
                
            } catch (error) {
                log.error('Search error r', error.message);
            }
  
      }catch(e){
        log.debug('error tablas',e)
      }

    }
    function ventasEquipo(sublistEq,arregloEquipo,cust_period_inicio,cust_period_fin,cust_presentadora,allPresentadorData){
        var sublistEqS = sublistEq.s
        log.debug('sublistEqS',sublistEqS)
        var sublistEqVentas = sublistEq.sv
        log.debug('sublistEqVentas',sublistEqVentas)
        var idEquipo= []
        var line = 0
        var v
        for (i in arregloEquipo[cust_presentadora]){

            
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].internalid
            idEquipo.push(parseInt(v))
            sublistEqS.setSublistValue({
                id : 'nombre',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].internalid
            sublistEqS.setSublistValue({
                id : 'id',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].promocion
            sublistEqS.setSublistValue({
                id : 'promocion',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].hiredate
            sublistEqS.setSublistValue({
                id : 'hiredate',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].objetivo_1
            sublistEqS.setSublistValue({
                id : 'objetivo_1',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].objetivo_2
            sublistEqS.setSublistValue({
                id : 'objetivo_2',
                line : line,
                value : v!=''?v:"-"
            });

            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].fechaReactivacion
            
            sublistEqS.setSublistValue({
                id : 'fecha_reactivacion',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].obj_1_reactivacion
            sublistEqS.setSublistValue({
                id : 'obj_1_reactivacion',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].obj_2_reactivacion
            sublistEqS.setSublistValue({
                id : 'obj_2_reactivacion',
                line : line,
                value : v!=''?v:"-"
            });
            
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].emp_conf
            
            sublistEqS.setSublistValue({
                id : 'emp_conf',
                line : line,
                value : v!=''?v:"-"
            });
                        
            v = allPresentadorData[arregloEquipo[cust_presentadora][i]].conf_reclutamiento
            
            sublistEqS.setSublistValue({
                id : 'conf_reclutamiento',
                line : line,
                value : v!=''?v:"-"
            });
            
                
            line ++
        }
        
        var mySearch = search.load({
                id : 'customsearch_ventas_pre_detalle'
            });
            
            log.debug('integrantes equipo',idEquipo)
            
            mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: [cust_period_inicio, cust_period_fin]
            }));
            
            mySearch.filters.push(search.createFilter({
                name: 'salesrep',
                operator: 'anyof',
                values: idEquipo
            }));
                

            // Run the paged search
        try {
                

            var e = 0;
            
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (result) {
                    var data = result.getAllValues()
                    log.debug('data ventas equipo',data)
                    var hiredate = data['salesRep.hiredate']
                    log.debug('hiredate',hiredate)
                    var v
                    try {
                        v =result.getValue({
                                name: 'trandate'
                            })
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_efecha',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getValue({
                                name: 'tranid'
                            })
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_epedido',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getValue({
                                name: 'internalid'
                            })
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_eint_id',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getText({
                                name: 'salesrep'
                            })
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_epre',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getText({
                                name: 'custbody_tipo_venta'
                            })
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_etipo_venta',
                            value: v!=''?v:"-",
                            line: e
                        });
                        var v = result.getText({
                                name: 'custbody_vw_recruiter'
                            })
                        
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_ereclutadora_odv',
                            value: v!=''?v:"-",
                            line: e
                        });
                        
                        v = result.getText({name: 'custbody_vw_comission_status'})
                        
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_ecom_status',
                            value: v!=''?v:"-",
                            line: e
                        });
                    
                        v = result.getText({
                                name: 'custbody_tipo_venta'
                            })
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_etipo_venta',
                            value: v!=''?v:"-",
                            line: e
                        }); 
                        v = hiredate
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_ealta',
                            value: v!=''?v:"-",
                            line: e
                        });
                        v = data['salesRep.custentity_promocion'][0].text
                        sublistEqVentas.setSublistValue({
                            id: 'custpage_epromocion',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                       
                    }catch(e){
                        log.error('error seteo en busqueda',e)
                    }
                     e++;
                    
                });
            });
                
            } catch (error) {
                log.error('Search error', error.message);
            }
    }
    function ventasEquipoNLE(nombramientos,sublistNombramientos,cust_period_inicio,cust_period_fin,cust_presentadora,allPresentadorData){
        var integrantes = []
        for (n in nombramientos){
            log.debug('nombramientos[n]',nombramientos[n])
            var busquedaEquipoNLE = searchDataPresentadoras(nombramientos[n])
            var equipoNLE = busquedaEquipoNLE.empGrupos[nombramientos[n]]
            for(x in equipoNLE){
                integrantes.push(equipoNLE[x])
            }
        }
        log.debug('integrantes',integrantes)
        var sublistNombramientosS = sublistNombramientos.s
        log.debug('sublistNombramientosS',sublistNombramientosS)
        var sublistNombramientosVentas = sublistNombramientos.sv
        log.debug('sublistNombramientosVentas',sublistNombramientosVentas)
        
        var line = 0
        var v
        for (i in nombramientos){

            v = allPresentadorData[nombramientos[i]].internalid
            sublistNombramientosS.setSublistValue({
                id : 'nombre_nle',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[nombramientos[i]].internalid
            sublistNombramientosS.setSublistValue({
                id : 'id_nle',
                line : line,
                value : v!=''?v:"-"
            });
            v = allPresentadorData[nombramientos[i]].fechaNombramiento
            sublistNombramientosS.setSublistValue({
                id : 'fecha_nombramiento',
                line : line,
                value : v!=''?v:"-"
            });
            v = integrantes//pendiente
            sublistNombramientosS.setSublistValue({
                id : 'equipo_nle',
                line : line,
                value : v!=''?v:"-"
            });
            
            line ++
        }
        
        var mySearch = search.load({
                id : 'customsearch_ventas_pre_detalle'
            });
            
            log.debug('integrantes',integrantes)
            
            mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: [cust_period_inicio, cust_period_fin]
            }));
            
            mySearch.filters.push(search.createFilter({
                name: 'salesrep',
                operator: 'anyof',
                values: integrantes
            }));
                

            // Run the paged search
            try {
                

            var e = 0;
            
            var pagedResults = mySearch.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (result) {
                    var data = result.getAllValues()
                    log.debug('data ventas equipo nle',data)
                    var v 
                    try{
                        v = data['salesRep.supervisor'][0].text
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_lider_nle',
                            value: v!=''?v:"-",
                            line: e
                        });
                        v = result.getValue({
                                name: 'trandate'
                            })
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_fecha_nle',
                            value:v!=''?v:"-",
                            line: e
                        });
                        v = result.getValue({
                                name: 'tranid'
                            })
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_pedido_nle',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getValue({
                                name: 'internalid'
                            })
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_int_id_nle',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = result.getText({
                                name: 'salesrep'
                            })
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_pre_nle',
                            value: v!=''?v:"-",
                            line: e
                        });
                        v= result.getText({
                                name: 'custbody_tipo_venta'
                            })
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_tipo_venta_nle',
                            value: v!=''?v:"-",
                            line: e
                        });
                        var v = result.getText({
                                name: 'custbody_vw_recruiter'
                            })
                        
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_reclutadora_odv_nle',
                            value:v!=''?v:"-",
                            line: e
                        });
                        v = result.getText({
                                name: 'custbody_vw_comission_status'
                            })
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_com_status_nle',
                            value:v!=''?v:"-" ,
                            line: e
                        }); 
                        v = result.getText({
                                name: 'custbody_tipo_venta'
                            })
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_tipo_venta_nle',
                            value: v!=''?v:"-",
                            line: e
                        }); 
                        v = data['salesRep.hiredate']
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_alta_nle',
                            value:v!=''?v:"-" ,
                            line: e
                        });
                        v = data['salesRep.custentity_promocion'][0].text
                        sublistNombramientosVentas.setSublistValue({
                            id: 'custpage_promocion_nle',
                            value: v!=''?v:"-",
                            line: e
                        });
                    }catch(e){
                        log.error('error set NLEbusqueda',e)
                    }
                    
                    e++;
                    
                });
            });
                
            } catch (error) {
                log.error('Search error', error.message);
            }
    }
    function sublistNombramientos(form){
       
            var tab = form.addTab({
                id : 'inf_nombramientos',
                label : 'Informacion NLE'
            });
            var thidField
            var fieldSublistVentas
            
            //insertar sublista y campos de integrantes 
            var sublist = form.addSublist({
                id: 'custpage_equipo_nle',
                type: serverWidget.SublistType.STATICLIST,
                label: 'NLE',
                tab: 'inf_nombramientos'
            });            

            thidField = sublist.addField({
                id: 'nombre_nle',
                type: serverWidget.FieldType.SELECT,
                source:'employee',
                label: 'Nombre'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});        
                        
            thidField = sublist.addField({
                id: 'id_nle',
                type: serverWidget.FieldType.TEXT,
                label: 'Internal ID'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

            thidField = sublist.addField({
                id: 'fecha_nombramiento',
                type: serverWidget.FieldType.TEXT,
                label: 'Fecha de Nombramiento'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            thidField = sublist.addField({
                id: 'equipo_nle',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Integrantes del equipo'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            

            //insertar sublista y campos de ventas
            var sublistventas_nle = form.addSublist({
                id: 'custpage_equipo_ventas_nle',
                type: serverWidget.SublistType.STATICLIST,
                label: 'Ventas del equipo',
                tab: 'inf_nombramientos'
            });  
            sublistventas_nle.addField({
                id: 'custpage_lider_nle',
                label: 'NLE',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_fecha_nle',
                label: 'Fecha',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_pedido_nle',
                label: 'Pedido',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_int_id_nle',
                label: 'Internal ID',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_pre_nle',
                label: 'Presentadora',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_tipo_venta_nle',
                label: 'Tipo De Venta',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_com_status_nle',
                label: 'Commission status',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_reclutadora_odv_nle',
                label: 'Reclutadora ODV',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_alta_nle',
                label: 'Alta Presentadora',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventas_nle.addField({
                id: 'custpage_promocion_nle',
                label: 'Promocion',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            return {s:sublist,sv:sublistventas_nle}
    }
    
    function sublistEquipo(form){
       
            var tab = form.addTab({
                id : 'inf_equipo',
                label : 'Informacion equipo'
            });
            var thidField
            var fieldSublistVentas
            
            //insertar sublista y campos de integrantes 
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

            //insertar sublista y campos de ventas
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
                id: 'custpage_eint_id',
                label: 'Internal ID',
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
                id: 'custpage_ecom_status',
                label: 'Commission status',
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

            var sublistventasRec = form.addSublist({
                id: 'custpage_reclutas_ventas',
                type: serverWidget.SublistType.STATICLIST,
                label: 'Ventas de Reclutas',
                tab: 'inf_reclutas'
            });  
            sublistventasRec.addField({
                id: 'custpage_rfecha',
                label: 'Fecha',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_rpedido',
                label: 'Pedido',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_rint_id',
                label: 'Internal ID',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_rpre',
                label: 'Presentadora',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_rtipo_venta',
                label: 'Tipo De Venta',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_rcom_status',
                label: 'Commission Status',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_rreclutadora_odv',
                label: 'Reclutadora ODV',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_ralta',
                label: 'Alta Presentadora',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            sublistventasRec.addField({
                id: 'custpage_rpromocion',
                label: 'Promocion',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            
            return {s:sublist,sv:sublistventasRec}
    }
    function searchDataPresentadoras(cust_presentadora){ 
        try{
           
            const employeeSearchFilters = [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custentity_estructura_virtual', 'is', 'F'],
                'AND',
               [ ['supervisor', 'is', cust_presentadora],
                'OR',
                ['custentity_reclutadora', 'is', cust_presentadora],
                'OR',
                ['custentity_nombramiento', 'is', cust_presentadora]],
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
                    objEMP.promocion = r.getText('custentity_promocion')
                    objEMP.employeetype = r.getValue('employeetype')
                    objEMP.emp_reclutadora = r.getValue('custentity_reclutadora')
                    objEMP.hiredate = r.getValue('hiredate')
                    objEMP.objetivo_1 = r.getValue('custentity_fin_objetivo_1')
                    objEMP.objetivo_2 = r.getValue('custentity_fin_objetivo_2')
                    objEMP.fechaReactivacion = r.getValue('custentity72')
                    objEMP.obj_1_reactivacion = r.getValue('custentity_fin_objetivo_1_reactivacion')
                    objEMP.obj_2_reactivacion = r.getValue('custentity_fin_objetivo_2_reactivacion')
                    objEMP.emp_conf = r.getText('custentity123')
                    objEMP.conf_reclutamiento = r.getText('custentity_conf_rec')
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

                    if(objEMP.nombramientoPor != '' && objEMP.tipoNombramento == 4){
                        
                        if(nombradsPor.hasOwnProperty(objEMP.nombramientoPor)){
                            nombradsPor[objEMP.nombramientoPor].push(objEMP.internalid)
                        }else{
                            nombradsPor[objEMP.nombramientoPor] = [objEMP.internalid]
                        }
                            
                    }

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
            
            return {allPresentadorData:allPresentadorData,empGrupos:empGrupos,empReclutas:empReclutas,equipoYRecluta:equipoYRecluta,nombramiento:nombradsPor}
        }catch(e){
            log.error('Error en searchDataPresentadoras',e)
        }
    }   
      }
      

        return {
            onRequest : onRequest
        };

});