/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/https','N/file', 'N/http','N/format','N/encode','N/email','N/runtime'],

function(record,search,https,file,http,format,encode,email,runtime) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
        try{
            var serachId = ''
            if(runtime.envType != 'PRODUCTION'){ 
                serachId = 1985
            }else{
                serachId = 1985
            }
            log.debug('serachId',serachId)
            var mySearch = search.load({
                id: serachId
            });
            
            var tmsName = {
                '2001'  :'TM6 & Varoma 120V UL MX US',
                '2170'  :'TM6 & Varoma 120V UL USA CA MX (24)',
                '2280'  :'TM6 RECERTIFICADA',
                '1757'  :'TM5 & Varoma C-K MX 127V',
                '1126'  :'TM5-4 + VAROMA, MEMORIA DE RECETAS AND COOK BOOK',
                '764'   :'TM31-4C + VAROMA',
                '992'   :'TM31-4C + VAROMA',
                '2490'  :'62752 TM6 & Varoma 120V UL Black Ed'
            }
            var objRequestDOPPLER = {}
            var resultSearch = []
            var pagedResults = mySearch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                //log.debug('r',r)
                var values = r.getAllValues();
                //log.debug('values',values)
                /*var id = r.getValue('internalid')
                var nombre  = r.getValue('altname')
                var email  = r.getValue('email')
                var phone  = r.getValue('mobilephone')
                var item  = r.getValue({name : 'item',join : 'transaction'})
                var salesrep  = r.getText('salesrep')
                var salesRepisinactive  = r.getValue({name : 'isinactive',join : 'salesRep'})
                */
                var nombre  = values['GROUP(altname)']
                var email  = values['GROUP(email)']
                var phone  = values['GROUP(mobilephone)']
                var item  = values['GROUP(transaction.item)'][0]['value']
                var salesrep  = values['GROUP(salesrep)'][0]['text']
                var salesRepisinactive =values['GROUP(salesRep.isinactive)']






                var transactionname  = values['GROUP(transaction.transactionname)']
                var transactionnumber  = values['GROUP(transaction.transactionnumber)']
                
               
                

                var trandate  = values['MAX(transaction.trandate)']
                
                var date
                if( trandate && trandate != ''){
                    var day = trandate.split("/")[0];
                    var month = trandate.split("/")[1];
                    var year = trandate.split("/")[2];
                    date = new Date(year, month - 1, day);
                }else{
                    date = ''
                }
                
                //JSON DOPPLER
                var empJson = {
                   "email": email,
                    "fields": [
                        {
                           "name": "FIRSTNAME",
                           "value": nombre,
                           "type": "string"
                        },
                        {
                          "name": "Nombre_Completo",
                          "value": nombre,
                          "type": "string"
                        },
                        {
                          "name": "Telefono",
                          "value": formatoNumeroTel(phone),
                          "type": "phone"
                        },
                        {
                          "name": "Modelo_Thermomix",
                          "value": tmsName[item]?tmsName[item]:item,
                          "type": "string"
                        },
                        {
                          "name": "Representante_Ventas",
                          "value": salesrep,
                          "type": "string"
                        },
                        {
                          "name": "COUNTRY",
                          "value": 'MX',
                          "type": "country"
                        },
                        {
                          "name": "Tipo",
                          "value": 'Cliente',
                          "type": "string"
                        },
                        {
                          "name": "Fecha_Transaccion",
                          "value": date,
                          "type": "date"
                        },
                        {
                          "name": "No_Thermomix",
                          "value": transactionname,
                          "type": "string"
                        }, 
                        {
                          "name": "Presentador_Status",
                          "value": salesRepisinactive?"Inactivo":"Activo",
                          "type": "string"
                        }, 
                        {
                          "name": "Presentador_Asignado",
                          "value": salesrep,
                          "type": "string"
                        },
                    ] 
                }
                //log.debug('empJson',empJson)
                resultSearch.push(empJson)
                return true; 

                });
            });

            //log.debug('resultSearch',resultSearch)
            objRequestDOPPLER['items'] = resultSearch
            objRequestDOPPLER['fields'] = [
                "FIRSTNAME",
                "Nombre_Completo",
                "Telefono",
                "Modelo_Thermomix",
                "Representante_Ventas",
                "COUNTRY",
                "Tipo",
                "Fecha_Transaccion",
                "No_Thermomix",
                "Presentador_Status",
                "Presentador_Asignado",
            ]
            log.debug('objRequestDOPPLER',objRequestDOPPLER)

            //Envio de json inicial a cuenta de Ezequiel
            /*var idLista = 28608338
            var apiKeyDoppler = '62AE8124B6180E8735AB20BB03933167'
            var responseService = https.post({
                url: 'https://restapi.fromdoppler.com/accounts/ezequiel.olguin%40thermomix.mx/lists/'+idLista+'/subscribers/import?api_key='+apiKeyDoppler,
                body : JSON.stringify(objRequestDOPPLER),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "token "+apiKeyDoppler
                }
            }).body;
            log.debug('responseService Doppler Ezequiel',responseService)*/




            //Envio de json a cuenta de alejandro.vazquez@thermomix.mx
            var idLista = 28693009
            var apiKeyDoppler = 'EA0A57527C97C8F0AECD2BCE447BE126'
            var responseService = https.post({
                url: 'https://restapi.fromdoppler.com/accounts/alejandro.vazquez%40thermomix.mx/lists/'+idLista+'/subscribers/import?api_key='+apiKeyDoppler,
                body : JSON.stringify(objRequestDOPPLER),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "token "+apiKeyDoppler
                }
            }).body;
            log.debug('responseService Doppler alejandro',responseService)




            //Envio de json cuenta de haydee.lara@thermomix.mx
            var idLista = 28693018
            var apiKeyDoppler = '7D626557DEA410BD73546640F99B86AF'
            var responseService = https.post({
                url: 'https://restapi.fromdoppler.com/accounts/haydee.lara%40thermomix.mx/lists/'+idLista+'/subscribers/import?api_key='+apiKeyDoppler,
                body : JSON.stringify(objRequestDOPPLER),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "token "+apiKeyDoppler
                }
            }).body;
            log.debug('responseService Doppler haydee',responseService)

           
        }catch(e){
            log.debug('Error execute',e)
        }
        
    }
    function formatoNumeroTel(numero){
        try{
            var nsplit = numero.split('')
            //log.debug('split[0]',nsplit[0])
            var fnum= "+52 "+nsplit[0]+nsplit[1]+nsplit[2]+" "+nsplit[3]+nsplit[4]+nsplit[5]+" "+nsplit[6]+nsplit[7]+nsplit[8]+nsplit[9]+""
            return fnum
        }catch(e){
            log.debug('Error en formatoNumeroTel',e)
             return ''
        }
    }
    return {
        execute: execute
    };
    
});
