/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

//W
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','N/format/i18n'], 
    function(plugin,task, serverWidget, search, runtime,file,format){
  
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
   function onRequest(context) {
    log.debug('metohd',context.request.method); 
    var form;
    form = createForm();
    params = context.request.parameters;
      if(context.request.method == 'POST'){
        context.response.writePage(form);
        var cust_period = params.custpage_date;
        var custpage_date = form.getField({ id:'custpage_date'});
        custpage_date.defaultValue = cust_period;
        
        var custpage_start_date = params.custpage_start_date;
        var f_start_date = form.getField({ id:'custpage_start_date'});
        f_start_date.defaultValue = custpage_start_date;
        
        var custpage_end_date = params.custpage_end_date;
        var f_end_date = form.getField({ id:'custpage_end_date'});
        f_end_date.defaultValue = custpage_end_date;

        /*var custpage_moneda = params.custpage_moneda;
        var moneda = form.getField({ id:'custpage_moneda'});
        moneda.defaultValue = custpage_moneda;

        var custpage_cambio = params.custpage_cambio;
        var cambio = form.getField({ id:'custpage_cambio'});
        cambio.defaultValue = custpage_cambio;*/


        createSublist(form,cust_period,custpage_start_date,custpage_end_date);
        context.response.writePage(form)   
      }
//      else if(context.request.method == 'PUT'){
//          try{
//            //recibe la informacion de la tabla para ejecutar el map y enviar los parametros con la informacion
//                var body = JSON.parse(context.request.body);
//                var obj_full = body;
//                var mapTask = task.create({
//                    taskType: task.TaskType.MAP_REDUCE,
//                    scriptId: 'customscript_vorwerk_reporte_ea_map',
//                    params: {
//                      custscript_data_ea: JSON.stringify(obj_full)
//                    }
//              }).submit();
//            }catch(err){
//              log.debug("error task ",err);
//            }
//        }
        else{
        context.response.writePage(form);
      }
   }
   
   function createForm (){
     try{
       var form = serverWidget.createForm({
               title: 'MX Daily sales VI'//'Format flat file MX'
           });
       if(runtime.envType != 'PRODUCTION'){ 
        form.clientScriptFileId = 1525922;
       }else{
        form.clientScriptFileId = 1876427;
       }
        form.addFieldGroup({
                  id: 'custpage_filters',
                  label: 'Filtros'
         })
        form.addField({
             id: 'custpage_date',
             type: serverWidget.FieldType.SELECT,
             label: 'Periodo de comision',
             source: 'customrecord_periods',
             container: 'custpage_filters'
         });
//        form.addField({
//            id: 'custpage_estatus_envio',
//            type: serverWidget.FieldType.SELECT,
//            label: 'Estatus de envio',
//            source: 'customlist271',
//            container: 'custpage_filters'
//        });
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
        /*
        var select = form.addField({
            id: 'custpage_moneda',
            type: serverWidget.FieldType.SELECT,
            label: 'Moneda',
            container: 'custpage_filters'
        });
        select.addSelectOption({
             value : 1,
             text : 'MXN'
         });
        select.addSelectOption({
             value : 2,
             text : 'USD'
         });
        select.addSelectOption({
             value : 3,
             text : 'EUR'
         });
        form.addField({
            id: 'custpage_cambio',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Cambio',
            container: 'custpage_filters'
        });
        */
         form.addSubmitButton({
           label: 'Consultar',
           container: 'custpage_filters'
         });
         var btnExcel = form.addButton({
             id : 'custpage_create_excel',
             label : 'Crear Excel',
             functionName : 'createExcel("EXCEL")'
           });

           var btnCSV = form.addButton({
            id : 'custpage_create_CSV',
            label : 'Crear CSV y Enviar',
            functionName : 'createExcel("CSV")'
          });
//         var btnSave = form.addButton({
//             id : 'custpage_searchData',
//             label : 'Guardar',
//             functionName : 'saveData()'
//           });
         
       return form;
       
     }catch (e){
       log.debug("error create form",e)
     }
   }
 

   
   
   function createSublist(form,cust_period,custpage_start_date,custpage_end_date){
    try{
        //Busqueda guardada
        var serachId = ''
        if(runtime.envType != 'PRODUCTION'){ 
            serachId = '000'
           }else{
            serachId = 'customsearch1991'
           }
        var mySearch = search.load({
            id: serachId
        });
        //Filtros
        log.debug('Datos',' cust_period '+cust_period+' custpage_start_date '+custpage_start_date+' custpage_end_date '+custpage_end_date)

        var namePerod
        var startDate
        var endDate
        //BUSQUEDA VENTAS REGULARES 
        if(custpage_start_date && custpage_end_date){
            startDate = custpage_start_date
            endDate = custpage_end_date
             mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: [startDate,endDate]
               }));

          
             var period = search.create({
                type: 'customrecord_periods',
                columns: [
                    { name: 'name'}

                ],
                filters: [
                    {
                        name: 'custrecord_inicio',
                        operator: 'onorbefore',
                        values: startDate
                    },
                    {
                        name: 'custrecord_final',
                        operator: 'onorafter',
                        values: endDate
                    }
                ]
            });
            var objReturn = {};
            period.run().each(function(r){
                namePerod = r.getValue('name')
                return true;
            });

        }else if(cust_period){
            var date = search.lookupFields({
                type: 'customrecord_periods',
                id: cust_period,
                columns: ['custrecord_inicio','custrecord_final','name']
            });
            namePerod = date.name
            startDate = date.custrecord_inicio
            endDate = date.custrecord_final
             mySearch.filters.push(search.createFilter({
                   name: 'trandate',
                   operator: 'within',
                   values: [startDate,endDate]
               }));
        }
        
        var data = {}
            log.debug('mySearch',mySearch)
         var pagedResults = mySearch.runPaged();
             pagedResults.pageRanges.forEach(function (pageRange){
         var currentPage = pagedResults.fetch({index: pageRange.index});
             currentPage.data.forEach(function (r) { 
            
             var values = r.getAllValues();
            //log.debug('values',values)
            var fecha = values['GROUP(trandate)'].replace("/", ".", "gi");
            var suma = values['SUM(netamount)']
            var item = values['GROUP(item)'][0]['text']
            var odvs = values['COUNT(internalid)']
            var otro_f = values['GROUP(custbody_otro_financiamiento)'][0]['value']
            var fcha_cancelacion = values['GROUP(custbody_fcha_cancelacion)'].replace("/", ".", "gi");
            
            var resta = 0
            if(fcha_cancelacion && otro_f){
                //Se Separa busqueda de cancelaciones
            }else{
                data[fecha+'-'+item] = {
                    fecha:fecha,
                    suma:suma,
                    item:item,
                    odvs:odvs,
                    otro_f:otro_f,
                    fcha_cancelacion:fcha_cancelacion
                }           
            }
        return true;     
             });
             
         });
        log.debug('data',data)
        
        //FIN BUSQUEDA VENTAS REGULARES 




        //BUSQUEDA CANCELACIONES
        var serachIdCancelaciones = ''
        if(runtime.envType != 'PRODUCTION'){ 
            serachIdCancelaciones = '000'
           }else{
            serachIdCancelaciones = 'customsearch1991'
           }
        var mySearchCancelaciones = search.load({
            id: serachIdCancelaciones
        });
        

         mySearchCancelaciones.filters.push(search.createFilter({
               name: 'custbody_fcha_cancelacion',
               operator: 'within',
               values: [startDate,endDate]
         }));

      
        var data_cancelacion = {}
         var pagedResults = mySearchCancelaciones.runPaged();
             pagedResults.pageRanges.forEach(function (pageRange){
         var currentPage = pagedResults.fetch({index: pageRange.index});
             currentPage.data.forEach(function (r) { 
            
                var values = r.getAllValues();
                //log.debug('values',values)
                var fecha = values['GROUP(trandate)'].replace("/", ".", "gi");
                var suma = values['SUM(netamount)']
                var item = values['GROUP(item)'][0]['text']
                var odvs = values['COUNT(internalid)']
                var otro_f = values['GROUP(custbody_otro_financiamiento)'][0]['value']
                var fcha_cancelacion = values['GROUP(custbody_fcha_cancelacion)'].replace("/", ".", "gi");
                
                var resta = 0
                if(fcha_cancelacion && otro_f){
                    data_cancelacion[fcha_cancelacion+'-'+item] = {
                        fecha:fecha,
                        suma:suma,
                        item:item,
                        odvs:odvs,
                        otro_f:otro_f,
                        fcha_cancelacion:fcha_cancelacion
                    } 
                }
            return true;     
            });
             
         });

        log.debug('data_cancelacion',data_cancelacion)
        
        // FIN Busqueda CANCELACIONES


        //Tabla
        var result = form.addSublist({
             id: 'result',
             type: serverWidget.SublistType.LIST,
             label: 'Resultados'
         });
       

        var internalid = result.addField({
            id: 'internalid',
            type: serverWidget.FieldType.TEXT,
            label: 'internal id'//Permanece
        });
        internalid.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var country = result.addField({
            id: 'custpage_country',
            type: serverWidget.FieldType.TEXT,
            label: 'COUNTRY'//COUNTRY
        });
        country.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var booking_period = result.addField({
            id: 'custpage_booking_period',
            type: serverWidget.FieldType.TEXT,
            label: 'BOOKING_PERIOD'//BOOKING_PERIOD
        });
        booking_period.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var reference_date = result.addField({
            id: 'custpage_reference_date',
            type: serverWidget.FieldType.TEXT,
            label: 'REFERENCE_DATE'//REFERENCE_DATE
        });
        reference_date.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var product = result.addField({
            id: 'custpage_product',
            type: serverWidget.FieldType.TEXT,
            label: 'PRODUCT'//PRODUCT
        });
        product.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var chanel = result.addField({
            id: 'custpage_chanel',
            type: serverWidget.FieldType.TEXT,
            label: 'CHANNEL'//CHANNEL
        });
        chanel.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var division = result.addField({
            id: 'custpage_division',
            type: serverWidget.FieldType.TEXT,
            label: 'DIVISION'//DIVISION
        });
        division.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var out_UNITS_ORDER_ENTRY = result.addField({
            id: 'custpage_out_uoe',
            type: serverWidget.FieldType.TEXT,
            label: 'out_UNITS_ORDER_ENTRY'//out_UNITS_ORDER_ENTRY
        });
        out_UNITS_ORDER_ENTRY.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var out_UNITS_INVOICED_NET = result.addField({
            id: 'custpage_out_uin',
            type: serverWidget.FieldType.TEXT,
            label: 'out_UNITS_INVOICED_NET'//out_UNITS_INVOICED_NET
        });
        out_UNITS_INVOICED_NET.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var out_NETSALES_MAIN_ORDERS = result.addField({
            id: 'custpage_out_nmo',
            type: serverWidget.FieldType.TEXT,
            label: 'out_NETSALES_MAIN_ORDERS'//out_NETSALES_MAIN_ORDERS
        });
        out_NETSALES_MAIN_ORDERS.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        var out_NETSALES_OTHER_ORDERS = result.addField({
            id: 'custpage_out_noo',
            type: serverWidget.FieldType.TEXT,
            label: 'out_NETSALES_OTHER_ORDERS'//out_NETSALES_OTHER_ORDERS
        });
        out_NETSALES_OTHER_ORDERS.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        
        var out_UNITS_INVOICED_CANC = result.addField({
            id: 'custpage_mont_canc',
            type: serverWidget.FieldType.TEXT,
            label: 'out_UNITS_INVOICED_CANC'//out_UNITS_INVOICED_CANC
        });
        out_UNITS_INVOICED_CANC.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        
         

        //Llenado de tabla
        var numFormatter2 = format.getNumberFormatter({
            groupSeparator: "",
            decimalSeparator: ",",
            precision: 0
        });
        var line = 0 
               
        for(i in data){
            var v = {}
            var isTM = false
           
            if( data[i]['item'] == '60226' || 
                data[i]['item'] == '60964' || 
                data[i]['item'] == '61251' || 
                data[i]['item'] == '61531' || 
                data[i]['item'] == '62221' || 
                data[i]['item'] == '62431' || 
                data[i]['item'] == '62752' ||
                data[i]['item'] == '62959' ||
                data[i]['item'] == '61780' ||
                data[i]['item'] == 'TM6R'  ||
                data[i]['item'] == 'K00190'  ){
                isTM = true
            }
            if(data[i]['item'] == 62431){
                var fechaPivote = data[i]['fecha']// - 1/2/2024
                log.debug('fechaPivote',fechaPivote)

                if(data.hasOwnProperty(fechaPivote+'-'+'K00190')){
                    log.debug('sumar ')

                    data[i]['suma']=parseInt(data[i]['suma'],10)+parseInt(data[fechaPivote+'-'+'K00190']['suma'],10)
                    data[i]['odvs']=parseInt(data[i]['odvs'],10)+parseInt(data[fechaPivote+'-'+'K00190']['odvs'],10)
                    log.debug('data[i]',data[i])
                }
                
                                
            }
            
            if(data[i]['item'] != 'K00190'){
              v = i
            result.setSublistValue({
                id : 'internalid',
                line : line,
                value : v?v:'-'
            });

            v = 'MX'
            result.setSublistValue({
                id : 'custpage_country',
                line : line,
                value : v?v:'-'
            });

            v = data[i]['fecha'].split('.')
            var mes = v[1].length === 1 ? '0' + v[1] : v[1];
            v = v[2] + '-' + mes;
            result.setSublistValue({
                id : 'custpage_booking_period',
                line : line,
                value : v?v:'-'
            });
            
            v = data[i]['fecha']
            result.setSublistValue({
                id : 'custpage_reference_date',
                line : line,
                value : v?v:'-'
            });

            v = data[i]['item']
            //Añadir funcion para retirar acentos
            v = quitarAcentos(v)
            result.setSublistValue({
                id : 'custpage_product',
                line : line,
                value : v?v:'-'
            });

            
            result.setSublistValue({
                id : 'custpage_chanel',
                line : line,
                value : 'Sales Organization TM'
            });
            
            result.setSublistValue({
                id : 'custpage_division',
                line : line,
                value : 'TM'
            });
            
            v = isTM == true?data[i]['odvs']:'0'
            result.setSublistValue({
                id : 'custpage_out_uoe',
                line : line,
                value : v
            });
            
            v = isTM == true?data[i]['odvs']:'0'
            result.setSublistValue({
                id : 'custpage_out_uin',
                line : line,
                value : v
            });
            
            
            v = isTM == false?data[i]['suma']:'0'
            v = redondearNumero(v)
            if(v >=1){
                log.debug('custpage_out_noo',v)
            }
            result.setSublistValue({
                id : 'custpage_out_noo',
                line : line,
                value : v.toString() 
            });
            

            if(data_cancelacion[i]){
                log.debug('Existe cancelacion')
                var fechaCancelacion = data_cancelacion[i]['fecha']
                log.debug('fechaCancelacion', fechaCancelacion)
                var numCacelacionKit = 0
                var montoCancelacionKit = 0
                 v = data_cancelacion[i]['odvs']
                result.setSublistValue({ //unidades canceladas
                id : 'custpage_mont_canc',//out_UNITS_INVOICED_CANC
                line : line,
                value : v?v:'0'
                });

                var resta = data_cancelacion[i]['suma']
                var sumaRegular = data[i]['suma']
                v = numFormatter2.format({number: parseInt(sumaRegular - resta,10)})
                log.debug('v cancelacion',v)

                if(data_cancelacion[i]['item'] == 62431){
                    log.debug('Existe cancelacion item')
                    if(data_cancelacion.hasOwnProperty(fechaCancelacion + '-' + 'K00190')){
                        log.debug('Existe cancelacion kit e item')
                        numCacelacionKit=data_cancelacion[fechaCancelacion + '-' + 'K00190']['odvs']
                        log.debug('numCacelacionKit', numCacelacionKit)
                        montoCancelacionKit= data_cancelacion[fechaCancelacion + '-' + 'K00190']['suma']
                        log.debug('montoCancelacionKit', montoCancelacionKit)
                        v = data_cancelacion[i]['odvs'] + numCacelacionKit
                        log.debug('v item kit', v)
                        result.setSublistValue({ //unidades canceladas
                            id : 'custpage_mont_canc',//out_UNITS_INVOICED_CANC
                            line : line,
                            value : v?v:'0'
                        });

                        var resta = data_cancelacion[i]['suma'] + montoCancelacionKit
                        log.debug('resta item kit', resta)
                        var sumaRegular = data[i]['suma']
                        v = numFormatter2.format({number: parseInt(sumaRegular - resta,10)})
                        log.debug('v cancelacion',v)
                    }
                } 
               
            } else if(data[i]['item'] == 62431 && data_cancelacion.hasOwnProperty(fechaPivote + '-' + 'K00190')){
                log.debug('Existe cancelacion solo kit')

                numCacelacionKit=data_cancelacion[fechaPivote + '-' + 'K00190']['odvs']
                log.debug('numCacelacionKit', numCacelacionKit)
                montoCancelacionKit= data_cancelacion[fechaPivote + '-' + 'K00190']['suma']
                log.debug('montoCancelacionKit', montoCancelacionKit)

                v = numCacelacionKit
                log.debug('v kit', v)
                result.setSublistValue({ //unidades canceladas
                    id : 'custpage_mont_canc',//out_UNITS_INVOICED_CANC
                    line : line,
                    value : v?v:'0'
                });

                var resta = montoCancelacionKit
                log.debug('resta kit', resta)
                var sumaRegular = data[i]['suma']
                v = numFormatter2.format({number: parseInt(sumaRegular - resta,10)})
                log.debug('v cancelacion',v)

            }else{
               

                result.setSublistValue({ //unidades canceladas
                id : 'custpage_mont_canc',//out_UNITS_INVOICED_CANC
                line : line,
                value : '0'
                });

                v = isTM == true?data[i]['suma']:'0'//monto total sin restar
                //log.debug('v 0',v)
                v = v > 1 ? numFormatter2.format({number:parseInt(v,10)}):'0'
            }
            result.setSublistValue({
                id : 'custpage_out_nmo',//out_NETSALES_MAIN_ORDERS
                line : line,
                value : v
            });
            line ++  
            }
            
        }
        
    }catch(e){
      log.debug("Error tabla",e)
      log.debug('creditos',runtime.getCurrentScript().getRemainingUsage()); 
    }   
   }


    function redondearNumero(num) {
      if (num >= 1) {
        return Math.round(num);
      } else {
        return num;
      }
    }
    function quitarAcentos(cadena){
    const acentos = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U'};
    var cadenasplit = cadena.split('')
    var sinAcentos = cadenasplit.map(function(x) {
        if(acentos[x]){
            return acentos[x];
        }else{
            return x;
        }
       
    });
    var joinsinacentos = sinAcentos.join('').toString(); 
    log.debug('joinsinacentos',joinsinacentos)
    return joinsinacentos; 
    }
   
    return {
        onRequest: onRequest
    };
    
});