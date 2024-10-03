/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/file', 'N/http','N/format','N/encode','N/email','N/runtime','N/format/i18n'],

function(record,search,https,file,http,format,encode,email,runtime,format) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
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
         
        var fechaTermino = new Date();
        var fechaInicio = new Date();
       
        fechaInicio.setDate(fechaInicio.getDate() - 14);

        
        var anho = fechaTermino.getFullYear();
        var mes = fechaTermino.getMonth() + 1; // Los meses en JavaScript se representan del 0 al 11, por lo que sumamos 1
        var dia = fechaTermino.getDate();
        fechaTermino = (dia < 10 ? "0" + dia : dia) + "/" + (mes < 10 ? "0" + mes : mes) + "/" + anho ;
        

        var anhoI = fechaInicio.getFullYear();
        var mesI = fechaInicio.getMonth() + 1; 
        var diaI = fechaInicio.getDate();
        
        fechaInicio = (diaI < 10 ? "0" + diaI : diaI) + "/" + (mesI < 10 ? "0" + mesI : mesI) + "/" + anhoI ;

        log.debug("La fecha de inicio es: " + fechaInicio);
        log.debug("La fecha de termino es: " + fechaTermino);

            //Validar primero con un rango de fechas pequeño pero que traiga resultados y modificar las fechas de abajo
            var custpage_start_date = fechaInicio
            var custpage_end_date = fechaTermino
            log.debug('Datos',' custpage_start_date '+custpage_start_date+' custpage_end_date '+custpage_end_date)

          
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

            }
            
            var data = {}
               // log.debug('mySearch',mySearch)
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


            //Llenado de tabla - ficticio 
            var numFormatter2 = format.getNumberFormatter({
                groupSeparator: "",
                decimalSeparator: ",",
                precision: 0
            });
            var line = 0
            var object_fill = [];
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
                    data[i]['item'] == 'TM6R'  ||
                    data[i]['item'] == 'K00190' ){
                    isTM = true
                }
                if(data[i]['item'] == 62431){
                    var fechaPivote = data[i]['fecha']// - 1/2/2024
                    log.debug('fechaPivote',fechaPivote)

                    if(data.hasOwnProperty(fechaPivote+'-'+'K00190')){
                        log.debug('sumar ')

                        data[i]['suma']=parseInt(data[i]['suma'])+parseInt(data[fechaPivote+'-'+'K00190']['suma'])
                        data[i]['odvs']=parseInt(data[i]['odvs'])+parseInt(data[fechaPivote+'-'+'K00190']['odvs'])
                        log.debug('data[i]',data[i])
                    }
                        
                }
                if(data[i]['item'] != 'K00190'){
                       v = 'MX'
                    var custpage_country = v
                    

                    v = data[i]['fecha'].split('.')
                    var mes = v[1].length === 1 ? '0' + v[1] : v[1];

                    v = v[2] + '-' + mes;
                    var custpage_booking_period = v
                    

                    v = data[i]['fecha']
                    var custpage_reference_date = v
                    

                     v = data[i]['item']
                    
                    v = quitarAcentos(v)
                    var custpage_product = v
                   

                    var custpage_chanel = 'Sales Organization TM'
                                   
                        
                    var custpage_division = 'TM'
                    

                    v = isTM == true?data[i]['odvs']:'0'
                    var custpage_out_uoe = v
                                    

                    v = isTM == true?data[i]['odvs']:'0'
                    var custpage_out_uin = v
                   

                    v = isTM == false?data[i]['suma']:'0'
                    v = redondearNumero(v)
                    if(v >=1){
                        log.debug('custpage_out_noo',v)
                    }
                    var custpage_out_noo = v
                    


                    if(data_cancelacion[i]){
                        log.debug('Existe cancelacion')
                        var fechaCancelacion = data_cancelacion[i]['fecha']
                        var numCacelacionKit = 0
                        var montoCancelacionKit = 0

                        v = data_cancelacion[i]['odvs']
                        var custpage_mont_canc = v
                        

                        var resta = data_cancelacion[i]['suma']
                        var sumaRegular = data[i]['suma']
                        v = numFormatter2.format({number: parseInt(sumaRegular - resta)})
                        log.debug('v cancelacion',v)
                        if(data_cancelacion[i]['item'] == 62431){
                            if(data_cancelacion.hasOwnProperty(fechaCancelacion + '-' + 'K00190')){
                            
                                numCacelacionKit=data_cancelacion[fechaCancelacion + '-' + 'K00190']['odvs']
                                
                                montoCancelacionKit= data_cancelacion[fechaCancelacion + '-' + 'K00190']['suma']
                                
                                v = data_cancelacion[i]['odvs'] + numCacelacionKit
                                var custpage_mont_canc = v
                                var resta = data_cancelacion[i]['suma'] + montoCancelacionKit
                                log.debug('resta item kit', resta)
                                var sumaRegular = data[i]['suma']
                                v = numFormatter2.format({number: parseInt(sumaRegular - resta)})
                                log.debug('v cancelacion',v)
                            }
                        }
                    }else if(data[i]['item'] == 62431 && data_cancelacion.hasOwnProperty(fechaPivote + '-' + 'K00190')){
                        log.debug('Existe cancelacion solo kit')

                        numCacelacionKit=data_cancelacion[fechaPivote + '-' + 'K00190']['odvs']
                        log.debug('numCacelacionKit', numCacelacionKit)
                        montoCancelacionKit= data_cancelacion[fechaPivote + '-' + 'K00190']['suma']
                        log.debug('montoCancelacionKit', montoCancelacionKit)

                        v = numCacelacionKit
                        var custpage_mont_canc = v
                        log.debug('v kit', v)

                        var resta = montoCancelacionKit
                        log.debug('resta kit', resta)
                        var sumaRegular = data[i]['suma']
                        v = numFormatter2.format({number: parseInt(sumaRegular - resta)})
                        log.debug('v cancelacion',v)

                    }else{
                           
                            var custpage_mont_canc = '0'
                            

                            v = isTM == true?data[i]['suma']:'0'//monto total sin restar
                            //log.debug('v 0',v)
                            v = v > 1 ? numFormatter2.format({number:parseInt(v)}):'0'
                    }
                    var custpage_out_nmo = v

                    
                    
                    
                    object_fill.push({
                        source          :   'CSV',
                        custpage_country        :   custpage_country,//OK
                        custpage_booking_period               : custpage_booking_period,//OK
                        custpage_reference_date               : custpage_reference_date,//ok
                        custpage_product               : custpage_product,//ok
                        custpage_chanel               : custpage_chanel,//ok

                        AREA_NAME : '',
                        AREA_LAND : '',
                        AREA_PLZ : '',
                        AREA_LOCATION : '',
                        BRANCH_NAME : '',
                        BRANCH_LAND : '',
                        BRANCH_PLZ : '',
                        BRANCH_LOCATION : '',
                        TEAM_NAME : '',
                        TEAM_LAND :'',
                        TEAM_PLZ : '',
                        TEAM_LOCATION : '',

                        custpage_division               : custpage_division,//ok
                        custpage_out_uoe               : custpage_out_uoe,//ok
                        custpage_out_uin               : custpage_out_uin,//ok
                        custpage_mont_canc             :custpage_mont_canc,//ok
                        custpage_out_nmo               : custpage_out_nmo,//ok
                        custpage_out_noo               : custpage_out_noo,//ok
                    })
                


                    //Aqui debe de terminar el objectfil 

                    

                    line ++ 
                }
               
            }// fin for 

            log.debug('object_fill',object_fill)
            //Llamado a create excel 

            
            var url = '';
            if(runtime.envType != 'PRODUCTION'){ 
                url = '';//añadir url si se trabaja en sandbox, debe ser url externa
            }else{
                url = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1238&deploy=1&compid=3367613&ns-at=AAEJ7tMQWqForgbZ0YHYNMCSFTQd9PvpYnfXl3GxNqlFWpTPqS4';
            }
            var head_document = [//Titulos excel
                                 'SOURCE',
                                 'COUNTRY',
                                 'BOOKING_PERIOD',
                                 'REFERENCE_DATE',
                                 'PRODUCT',
                                 'CHANNEL',

                                 'AREA_NAME',
                                 'AREA_LAND',
                                 'AREA_PLZ',
                                 'AREA_LOCATION',
                                 'BRANCH_NAME',
                                 'BRANCH_LAND',
                                 'BRANCH_PLZ',
                                 'BRANCH_LOCATION',
                                 'TEAM_NAME',
                                 'TEAM_LAND',
                                 'TEAM_PLZ',
                                 'TEAM_LOCATION',

                                 'DIVISION',
                                 'out_UNITS_ORDER_ENTRY',
                                 'out_UNITS_INVOICED_NET',
                                 'out_UNITS_INVOICED_CANC',
                                 'out_NETSALES_MAIN_ORDERS',
                                 'out_NETSALES_OTHER_ORDERS',
                                 ]
            var headers = {'Content-Type': 'application/json'};

           var typeFile = 'CSV'
           
              
           //Modificar los correos ANTES de hacer pruebas 
            var response = https.post({
                url: url,
                body : JSON.stringify({data:object_fill,head:head_document,type:typeFile}),
                headers: {
                    "Content-Type": "application/json"
                }
            }).body;
           
            var rep = JSON.parse(response);
            log.debug('rep',rep)//response
            var idFile = rep.id;
            log.debug('idFile',idFile)

            ///fin llamado create excel 
            
        }catch(e){
          log.debug("Error Execute",e)
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
        execute: execute
    };
    
});
