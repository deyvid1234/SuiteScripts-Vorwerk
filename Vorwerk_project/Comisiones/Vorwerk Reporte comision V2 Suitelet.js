/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file'], 
    function(plugin,task, serverWidget, search, runtime,file){
  
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        try{

            log.debug('metohd',context.request.method); 
        
            var form = createForm();
        
            params = context.request.parameters;
            
                if(context.request.method == 'POST'){

                    context.response.writePage(form);
                    //Obtiene los datos ingresados de los campos
                    cust_promo = params.custpage_promo;
                    cust_type = params.custpage_type_;
                    cust_period = params.custpage_date;
                    cust_entrega = params.custpage_entrega;
                    fileSearch1 = params.custpage_search_aux1;
                    fileSearch2 = params.custpage_search_aux2;

                    //Asignacion de valores
                    var custpage_date = form.getField({ id:'custpage_date'});
                    custpage_date.defaultValue = cust_period;
                    var custpage_type_ = form.getField({ id:'custpage_type_'});
                    custpage_type_.defaultValue = cust_type;
                    var custpage_promo = form.getField({ id:'custpage_promo'});
                    custpage_promo.defaultValue = cust_promo;
                    var custpage_entrega = form.getField({ id:'custpage_entrega'});
                    custpage_entrega.defaultValue = cust_entrega;
                      

                    log.debug('Filtros','Tipo : '+cust_type+' Promocion : '+cust_promo+' Periodo : '+cust_period+' Entrega : '+cust_entrega+' fileSearch1 '+ fileSearch1+' fileSearch2 '+fileSearch2)
                    try{
                        sublista(form,cust_type,cust_promo,cust_period,cust_entrega,fileSearch1,fileSearch2);
                        
                        context.response.writePage(form)
                    }catch(e){
                        log.error('error al crear form',e);
                    }
              
                }
                if(context.request.method == 'PUT'){ //
                    try{
                    //recibe la informacion de la tabla para ejecutar el map y enviar los parametros con la informacion
                        var body = JSON.parse(context.request.body);
                        log.debug('params',body);
                        var obj_comission = body.obj;
                        var config = body.obj_conf;
                        var mapTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_vorwerk_commission_map',
                            params: {
                                custscript_data_commision: JSON.stringify(obj_comission),
                                custscript_config_comission: JSON.stringify(config)
                            }
                        }).submit();
                    }catch(err){
                        log.debug("error task ",err);
                    }
                }else{

                    context.response.writePage(form);
                }
          
        }catch(e){
            log.error('error form',e);
        }
         
   

  }
   
    function createForm (){
        try{
           
           var form = serverWidget.createForm({
                title: 'Reporte de Comisiones V2'
            });

            //Grupo para campos
            form.addFieldGroup({
                id: 'custpage_filters',
                label: 'Filtros'
            })
           
            //Campos filtro
            form.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.SELECT,
                label: 'Periodo de Comision',
                source: 'customrecord_periods',
                container: 'custpage_filters'
            });

            form.addField({
                id: 'custpage_promo',
                type: serverWidget.FieldType.SELECT,
                label: 'Promocion',
                source: 'customlist_promocion',
                container: 'custpage_filters'
            });

            var select = form.addField({
                id: 'custpage_type_',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipo',
                container: 'custpage_filters'
            });
            select.addSelectOption({
                value : 1,
                text : 'Presentadora'
            });
            select.addSelectOption({
                value : 3,
                text : 'Lideres de Equipo'
            });

            var entrega = form.addField({
                id: 'custpage_entrega',
                type: serverWidget.FieldType.SELECT,
                label: 'Entrega',
                container: 'custpage_filters'
            });
            entrega.addSelectOption({
                value : 1,
                text : 'Todas pagadas'
            });
            entrega.addSelectOption({
                value : 2,
                text : 'Ninguna pagada'
            });
            entrega.addSelectOption({
                value : 3,
                text : 'Validación fecha de entrega'
            });

            //Terminan los campos filtro

            //Botones
            form.addSubmitButton({
               label: 'Consultar',
               container: 'custpage_filters'
            });
            
            form.addButton({
                id : 'custpage_searchData',
                label : 'Guardar',
                functionName : 'saveData()'
            });
            form.addButton({
                id : 'custpage_create_excel',
                label : 'Crear Excel',
                functionName : 'createExcel()'
            });
             
            return form;
           
        }catch (e){
           log.debug("error create form",e)
        }
    }

   
   function sublista(form,cust_type,cust_promo,cust_period,cust_entrega,fileSearch1,fileSearch2){
    try{
        var object_fill = {};

        var sublist = form.addSublist({
            id: 'sublist',
            type: serverWidget.SublistType.LIST,
            label: 'Resultados'
        });
           
        //Campos compartidos
        var name = sublist.addField({
            id: 'select_field',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'select'
        });
        name.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var name = sublist.addField({
            id: 'nombre',
            type: serverWidget.FieldType.SELECT,
            source:'employee',
            label: 'Nombre'
        });
        name.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});        
           
        var ingreso = sublist.addField({
            id: 'ingreso',
            type: serverWidget.FieldType.TEXT,
            label: 'Compensaciones de Ingreso'
        });
        ingreso.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var deleg = sublist.addField({
            id: 'delegadas',
            type: serverWidget.FieldType.TEXT,
            label: 'Delegadas'
        });
        deleg.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        var reclu = sublist.addField({
            id: 'reclutadora',
            type: serverWidget.FieldType.SELECT,
            source:'employee',
            label: 'Reclutadora'
        });
        reclu.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        var hiredate = sublist.addField({
            id: 'hiredate',
            type: serverWidget.FieldType.DATE,
            label: 'Fecha de Contratacion'
        });
        hiredate.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
        //Terminan campos compartidos
          

        //Campos Trabaja x TM
        if(cust_promo == 1){//Trabaja X TM
            var fecha_reactivacion = sublist.addField({
               id: 'fecha_reactivacion',
               type: serverWidget.FieldType.TEXT,
               label: 'Fecha de Reactivacion'
            });
            fecha_reactivacion.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
        }

        //Campos Compartidos
        var nombre_unidad = sublist.addField({
            id: 'custentity_nombre_unidad',
            type: serverWidget.FieldType.TEXT,
            label: 'Unidad'
        });
        nombre_unidad.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        var odv_jdg = sublist.addField({
            id: 'custentity_odv_jdg',
            type: serverWidget.FieldType.TEXT,
            label: 'Ventas TM ó Ventas CK'
        });
        odv_jdg.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var odv_jdg_id = sublist.addField({
            id: 'custentity_odv_jdg_ids',
            type: serverWidget.FieldType.TEXT,
            label: 'ID ODV'
        });
        odv_jdg_id.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        var tmpagada = sublist.addField({
            id: 'custentity_tmpagada',
            type: serverWidget.FieldType.TEXT,
            label: 'TM Pagadas'
        });
        tmpagada.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        var cookkey = sublist.addField({
            id: 'custentity_cookkey',
            type: serverWidget.FieldType.TEXT,
            label: 'Cook Key'
        });
        cookkey.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        var cookkey_ids = sublist.addField({
            id: 'custentity_cookkey_comision',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Comision Cook Key'
        });
        cookkey_ids.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
        //Fin Campos Compartidos
        
        //Campos Tm Propia - Gris
      if(cust_promo != 1){
        var venta_propia = sublist.addField({
            id: 'custentity_venta_propia',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Venta Propia'
        });
        venta_propia.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var tm_ganadas_num = sublist.addField({
            id: 'custentity_tm_ganadas_num',
            type: serverWidget.FieldType.TEXT,
            label: 'TM Ganadas'
        });
        tm_ganadas_num.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        var suma_ventas_total = sublist.addField({
            id: 'custentity_suma_ventas_total',
            type: serverWidget.FieldType.TEXT,
            label: 'Acumulado de ventas'
        });
        suma_ventas_total.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var venta_num_entrega = sublist.addField({
            id: 'custentity_num_entrega',
            type: serverWidget.FieldType.TEXT,
            label: 'Número de Entregas'
        });
        venta_num_entrega.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var odv_entrega = sublist.addField({
            id: 'custentity_odv_entrega',
            type: serverWidget.FieldType.TEXT,
            label: 'ODV Entrega'
        });
        odv_entrega.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var venta_entrega = sublist.addField({
            id: 'custentity_entrega',
            type: serverWidget.FieldType.TEXT,
            label: 'Entrega'
        });
        venta_entrega.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
             
        var bono_productividad = sublist.addField({
            id: 'custentity_bono_productividad',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Bono de Productividad'
        });
        bono_productividad.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
               
        var bono_emerald = sublist.addField({
            id: 'custentity_bono_emerald',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Bono EMERALD'
        });
        bono_emerald.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
        //El DD
         //Garantia Num
        var garantia_num = sublist.addField({
            id: 'custentity_garantia_num',
            type: serverWidget.FieldType.TEXT,
            label: 'Garantia Num'
        });
        garantia_num.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
        //Garantia Monto
        var garantia_monto = sublist.addField({
            id: 'custentity_garantia_monto',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Garantia Monto'
        });
        garantia_monto.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
        //Garantia ids
        var bono_garantia_ids = sublist.addField({
            id: 'custentity_bono_garantia_ids',
            type: serverWidget.FieldType.TEXT,
            label: 'Garantia ids'
        });
        bono_garantia_ids.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
      }//Fin Campos Tm Propia
           
           //Campos compartidos
        var reclut = sublist.addField({
            id: 'custentity_reclutas',
            type: serverWidget.FieldType.TEXT,
            label: 'Reclutas'
        });
        reclut.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var odv_rec = sublist.addField({
            id: 'custentity_odv_rec',
            type: serverWidget.FieldType.TEXT,
            label: 'ODV de las Reclutas'
        });
        odv_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var tmpagada_rec = sublist.addField({
            id: 'custentity_tmpagada_rec',
            type: serverWidget.FieldType.TEXT,
            label: 'TM Pagadas Rec'
        });
        tmpagada_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           
        var odv_comisionables_rec = sublist.addField({
            id: 'custentity_odv_comisionables_rec',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'ODV comisionables'
        });
        odv_comisionables_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
         
        var bono_rec = sublist.addField({
            id: 'custentity_bono_rec',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Bono Reclutadora'
        });
        bono_rec.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
           //Fin campos compartidos
        
        //Campos Trabaja x TM
      if(cust_promo == 1){
        var ck = sublist.addField({
            id: 'custentity_ck',
            type: serverWidget.FieldType.CURRENCY,
            label: 'CK'
        });
        ck.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
      }
           
           
      //Campos JDG - Lideres de equipo
      if (cust_type == 3) {
        var total_ventas_p = sublist.addField({
            id: 'custentity_total_ventas_p',
            type: serverWidget.FieldType.TEXT,
            label: 'Ventas TM o CK y TM Pagadas'
        });
        total_ventas_p.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
            
        var bono_talento = sublist.addField({
            id : 'custentity_bono_talento',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Bono Talento'
        });
        bono_talento.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            
        var supervi = sublist.addField({
            id : 'custentity_presentadoras',
            type : serverWidget.FieldType.TEXTAREA,
            label : 'Presentadoras Equipo'
        });
        supervi.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            
        var odv_pre = sublist.addField({
            id : 'custentity_odv_pre',
            type : serverWidget.FieldType.TEXT,
            label : 'ODV de las Presentadoras'
        });
        odv_pre.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            
        var tmpagada_pre = sublist.addField({
            id : 'custentity_tmpagada_pre',
            type : serverWidget.FieldType.TEXT,
            label : 'TM Pagadas equipo'
        });
        tmpagada_pre.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            
        var odv_comisionables_pre = sublist.addField({
            id: 'custentity_odv_comisionables_pre',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'ODV comisionables'
        });
        odv_comisionables_pre.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
                   
        var porcentaje = sublist.addField({
            id : 'custentity_porcentaje',
            type : serverWidget.FieldType.TEXT,
            label : '%'
        });
        porcentaje.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
             
        var venta_equipo = sublist.addField({
            id : 'custentity_venta_equipo',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Venta Equipo'
        });
        venta_equipo.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

        //3+2 y 5+2 EQUIPO ESPECIAL - DEBEN PERTENECER AL EQUIPO Y APARTE DEBIERON SER RECLUTADAS POR LA LIDER DE EQUIPO 
        var odv_rec_del_periodo = sublist.addField({
            id : 'custentity_odv_rec_del_periodo',
            type : serverWidget.FieldType.TEXTAREA,
            label : 'Reclutas y ODV del periodo mismo equipo'//2134324:56645653
        });
        odv_rec_del_periodo.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

        var odv_rec_de_le_del_periodo = sublist.addField({
            id : 'custentity_odv_rec_de_le_del_periodo',
            type : serverWidget.FieldType.TEXTAREA,
            label : 'Reclutas y ODV Por recluta del LE del periodo'
        });
        odv_rec_de_le_del_periodo.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

        var rec_con_ventas = sublist.addField({
            id: 'custentity_rec_con_ventas',
            type: serverWidget.FieldType.TEXT,
            label: 'Reclutas con ventas'
        });
        rec_con_ventas.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

        var bono_32 = sublist.addField({
            id : 'custentity_bono_tres_dos',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Bono 3 + 2'
        });
        bono_32.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});

        var bono_52 = sublist.addField({
            id : 'custentity_bono_cinco_dos',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Bono 5 + 2'
        });
        bono_52.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            // Fin Campos 3+2 y 5+2
            
        // Super Comision 
        var odv_pre_supercomision = sublist.addField({
            id : 'custentity_odv_pre_supercomision',
            type : serverWidget.FieldType.TEXTAREA,
            label : 'ODV Por recluta del mes del Equipo SC'
        });
        odv_pre_supercomision.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
           
        var ventas_sc = sublist.addField({
            id: 'custentity_ventas_sc',
            type: serverWidget.FieldType.TEXT,
            label: 'Numero de ventas SC'
        });
        ventas_sc.updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            
        var bono_supercomision = sublist.addField({
            id : 'custentity_bono_sc',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Bono SUPERCOMISIÓN'
        });
        bono_supercomision .updateDisplayType({displayType : serverWidget.FieldDisplayType.READONLY});
            //Fin Campos Super Comision
            
      }
        // Campos Compartidos
          
        var total = sublist.addField({
            id: 'custentity_total',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Total'
        });
        total.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});

        sublist.addMarkAllButtons();
         
       return form;
      
    }catch(e){
      log.debug("error sublista",e)
      log.debug('creditos 2',runtime.getCurrentScript().getRemainingUsage()); 
    }   
   }
   

    return {
        onRequest: onRequest
    };
    
});