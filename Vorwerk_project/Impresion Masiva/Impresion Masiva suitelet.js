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
    var form;
    form = createForm();
    params = context.request.parameters;
      if(context.request.method == 'POST'){
        context.response.writePage(form);
        
        var custpage_start_date = params.custpage_start_date;
        var f_start_date = form.getField({ id:'custpage_start_date'});
        f_start_date.defaultValue = custpage_start_date;
        
        var custpage_end_date = params.custpage_end_date;
        var f_end_date = form.getField({ id:'custpage_end_date'});
        f_end_date.defaultValue = custpage_end_date;

        var custpage_tipo_venta = params.custpage_tipo_venta;
        var tipo_venta = form.getField({ id:'custpage_tipo_venta'});
        tipo_venta.defaultValue = custpage_tipo_venta;



        createSublist(form,custpage_start_date,custpage_end_date,custpage_tipo_venta);
        context.response.writePage(form)   
      } else{
        
        //createSublist(form,'','');
        context.response.writePage(form);

      }
    }catch(e){
       log.debug('Error onRequest',e) 
    }
    
   }
   
   function createForm (){
     try{
       var form = serverWidget.createForm({
               title: 'Impresion Masiva'
           });
       
       
       

       if(runtime.envType != 'PRODUCTION'){ 
           form.clientScriptFileId = 1529579;
          }else{
              form.clientScriptFileId = 2145408;
          }
      
        //Campos Busqueda 

        form.addFieldGroup({
                  id: 'custpage_filters',
                  label: 'Filtros'
         })
       
        form.addField({
            id: 'custpage_start_date',
            type: serverWidget.FieldType.DATE,
            label: 'Desde',
            container: 'custpage_filters'
        });
        form.addField({
            id: 'custpage_end_date',
            type: serverWidget.FieldType.DATE,
            label: 'Hasta',
            container: 'custpage_filters'
        });
        form.addField({
            id: 'custpage_tipo_venta',
            type: serverWidget.FieldType.SELECT,
            label: 'TIPO DE VENTA',
            container: 'custpage_filters',
            source: 'customlist_tipo_venta'
        });
        


        //Botones
         form.addSubmitButton({
           label: 'Consultar',
           container: 'custpage_filters'
         });
         var btnImp = form.addButton({
             id : 'custpage_imp',
             label : 'Imprimir',
             functionName : 'imp('+true+')'
           });
         var btnCompletado = form.addButton({
             id : 'custpage_completado',
             label : 'Marcar como impreso',
             container: 'custpage_filters',
             functionName : 'completado('+true+')'
           });
         
       return form;
       
     }catch (e){
       log.debug("error create form",e)
     }
   }
 

   
   
   function createSublist(form,custpage_start_date,custpage_end_date,custpage_tipo_venta){
    try{
        //Busqueda guardada
        var serachId = ''
        if(runtime.envType != 'PRODUCTION'){ 
            serachId = 'customsearch1981'
           }else{
            serachId = 'customsearch1981'
           }
        var mySearch = search.load({
            id: serachId
        });
        //Filtros
        if(custpage_start_date && custpage_end_date){
            log.debug('fechas','custpage_start_date '+custpage_start_date+' custpage_end_date '+custpage_end_date)
            var startDate = custpage_start_date
            var endDate = custpage_end_date
             mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   join: 'custrecord_id_sales_order',
                   operator: 'within',
                   values: [startDate,endDate]
               }));
        }
        if( custpage_tipo_venta ){
            log.debug( 'custpage_tipo_venta', custpage_tipo_venta )
            mySearch.filters.push(search.createFilter({
               name: 'custbody_tipo_venta',
               join: 'custrecord_id_sales_order',
               operator: 'anyof',
               values: [custpage_tipo_venta]
            }));
        }
       
      /*mySearch.filters.push(search.createFilter({
            name: 'internalid',
            operator: 'anyof',
            values: ['470002','469903','470202']
        }));*/


         var data = {}
         var numerosGuia =[]
         var pagedResults = mySearch.runPaged();
             pagedResults.pageRanges.forEach(function (pageRange){
         var currentPage = pagedResults.fetch({index: pageRange.index});
             currentPage.data.forEach(function (r) {
             var internalid = r.getValue('internalid')
             var url_pdf_aclogistics = r.getValue('custrecord_url_pdf_aclogistics')
             var id_sales_order = r.getValue('custrecord_id_sales_order')
             var estatus_envio = r.getText('custrecord_estatus_envio')

             var off_imp = r.getValue('custrecord_off_imp')
             var no_guia = r.getValue('custrecord_no_guia')
             var tipo_venta = r.getText({name : 'custbody_tipo_venta',join : 'CUSTRECORD_ID_SALES_ORDER'})
             var trandate = r.getValue({name : 'trandate',join : 'CUSTRECORD_ID_SALES_ORDER'})
             var salesrep = r.getText({name : 'salesrep',join : 'CUSTRECORD_ID_SALES_ORDER'})
             var tranid = r.getValue({name : 'tranid',join : 'CUSTRECORD_ID_SALES_ORDER'})

             //var values = r.getAllValues();
             //log.debug('values',values)
             
             data[internalid] = [{
                 internalid:internalid,
                 url_pdf_aclogistics:url_pdf_aclogistics,
                 id_sales_order:id_sales_order,
                 estatus_envio:estatus_envio,
                 off_imp:off_imp,
                 no_guia:no_guia,
                 tipo_venta:tipo_venta,
                 trandate:trandate,
                 salesrep:salesrep,
                 tranid:tranid
                 }]
             });
             
         });
        log.debug('data',data)
        //Tabla
        var result = form.addSublist({
             id: 'result',
             type: serverWidget.SublistType.LIST,
             label: 'Resultados'
         });
        //Campos Resultado
        var select = result.addField({
            id: 'select_field',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Select'//Permanece
        });
        select.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
        result.addMarkAllButtons();

        var internalid = result.addField({
            id: 'internalid',
            type: serverWidget.FieldType.TEXT,
            label: 'Internal ID'//Permanece
        });
        internalid.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
        
        var guia_envio = result.addField({
            id: 'guia_envio_pdf',
            type: serverWidget.FieldType.URL,
            label: 'URL PDF Guia de envio'//Permanece
        });
        guia_envio.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var id_so = result.addField({
            id: 'id_so',
            type: serverWidget.FieldType.TEXT,
            label: 'ID Sales Order'//Permanece
        });
        id_so.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var estatus_envio = result.addField({
            id: 'estatus_envio',
            type: serverWidget.FieldType.TEXT,
            label: 'Estatus Envio'//Permanece
        });
        estatus_envio.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var off_imp = result.addField({
            id: 'off_imp',
            type: serverWidget.FieldType.TEXT,
            label: 'Guia Impresa'//Permanece
        });
        off_imp.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var no_guia = result.addField({
            id: 'no_guia',
            type: serverWidget.FieldType.TEXT,
            label: 'Numero de Guia'//Permanece
        });
        no_guia.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var tipo_venta = result.addField({
            id: 'tipo_venta',
            type: serverWidget.FieldType.TEXT,
            label: 'Tipo de Venta'//Permanece
        });
        tipo_venta.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var trandate = result.addField({
            id: 'trandate',
            type: serverWidget.FieldType.TEXT,
            label: 'Fecha de Orden'//Permanece
        });
        trandate.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var salesrep = result.addField({
            id: 'salesrep',
            type: serverWidget.FieldType.TEXT,
            label: 'Representante de Venta'//Permanece
        });
        salesrep.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var tranid = result.addField({
            id: 'tranid',
            type: serverWidget.FieldType.TEXT,
            label: '# Orden'//Permanece
        });
        tranid.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

       
        
        
         
        //Llenado de tabla
        var line = 0
        for(i in data){
            var v = {}
            v = data[i][0]['internalid']
            result.setSublistValue({
                id : 'internalid',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['url_pdf_aclogistics']
            result.setSublistValue({
                id : 'guia_envio_pdf',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['id_sales_order']
            result.setSublistValue({
                id : 'id_so',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['estatus_envio']
            result.setSublistValue({
                id : 'estatus_envio',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['off_imp']
            result.setSublistValue({
                id : 'off_imp',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['no_guia']
            result.setSublistValue({
                id : 'no_guia',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['tipo_venta']
            result.setSublistValue({
                id : 'tipo_venta',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['trandate']
            result.setSublistValue({
                id : 'trandate',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['salesrep']
            result.setSublistValue({
                id : 'salesrep',
                line : line,
                value : v?v:'-'
            });

            v = data[i][0]['tranid']
            result.setSublistValue({
                id : 'tranid',
                line : line,
                value : v?v:'-'
            });

           
            line ++
        }
        
    }catch(e){
      log.debug("Error tabla",e)
      log.debug('creditos',runtime.getCurrentScript().getRemainingUsage()); 
    }   
   }

   
    return {
        onRequest: onRequest
    };
    
});