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
                serachId = 1980
            }else{
                serachId = 1959
            }
            var mySearch = search.load({
                id: serachId
            });
            log.debug('Pre busqueda')
            var objRequest = []
             var objRequestDOPPLER = {}
             var resultSearch = []
            var pagedResults = mySearch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
            var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
                log.debug('r',r)
                var id = r.getValue('internalid')
                var custentity_fin_objetivo_1  = r.getValue('custentity_fin_objetivo_1')
                var custentity_fin_objetivo_2  = r.getValue('custentity_fin_objetivo_2')
                var custentity72  = r.getValue('custentity72')//Reactivacion
                var custentity_fin_objetivo_1_reactivacion  = r.getValue('custentity_fin_objetivo_1_reactivacion')
                var custentity_fin_objetivo_2_reactivacion =  r.getValue('custentity_fin_objetivo_2_reactivacion')
                var employeetype  = r.getText('employeetype')
                var birthdate =  r.getValue('birthdate')
                var entityid  = r.getValue('entityid')
                var firstname  = r.getValue('firstname')
                var lastname  = r.getValue('lastname')
                var email =  r.getValue('email')  
                var hiredate  = r.getValue('hiredate')
                var custentity59  = r.getValue('custentity59')//baja
                var telefono  = r.getValue('phone')
                var supervisor  = r.getText('supervisor')
                var curp  = r.getValue('custentity_curp')
                var gerencia  = r.getText('custentity_gerencia')
                var delegada  = r.getText('custentity_delegada')
                var area_manager  = r.getText('custentity_area_manager')
                var regional_manager  = r.getText('custentityregional_manager')
                var isinactive  = r.getValue('isinactive')
                var mobilephone  = r.getValue('mobilephone')
                var oficina  = r.getText('custentity_oficina')
                log.debug('pre obj R LMS')
                objRequest.push({
                "IdInterno": id,
                "IDU": entityid,
                "Nombre": firstname,
                "Apellidos": lastname,
                "FechaNacimiento": birthdate,
                "FechaAlta": hiredate,
                "FechaBaja": custentity59,
                "FechaReactivacion": custentity72,
                })


                log.debug('pre obj R DOPPLER')
                //JSON DOPPLER
                var empJson = {
                   "email": email,
                    "fields": [
                        {
                          "name": "FIRSTNAME",
                          "value": firstname,
                          "type": "string"
                        },
                        {
                          "name": "Nombre_Completo",
                          "value": firstname+" "+lastname,
                          "type": "string"
                        },
                        /*{
                          "name": "Apellido_Primero",
                          "value": lastname,
                          "type": "string"
                        },*/
                        {
                          "name": "LASTNAME",
                          "value": lastname,
                          "type": "string"
                        },
                        /*{
                          "name": "Celular",
                          "value": formatoNumeroTel(telefono),
                          "type": "phone"
                        },*/
                        {
                          "name": "Telefono",
                          "value": formatoNumeroTel(mobilephone),
                          "type": "phone"
                        },
                        {
                          "name": "Sucursal",
                          "value": oficina,
                          "type": "string"
                        },
                        {
                          "name": "IDUtxt",
                          "value": entityid,
                          "type": "string"
                        },
                        {
                          "name": "IDU",
                          "value": entityid,
                          "type": "number"
                        },
                        /*{
                          "name": "Rango",
                          "value": employeetype,
                          "type": "string"
                        },*/
                        {
                          "name": "Status",
                          "value": isinactive?"Inactivo":"Activo",
                          "type": "string"
                        },
                        /*{
                          "name": "IsInactive",
                          "value": isinactive,
                          "type": "string"
                        },*/
                        {
                          "name": "Fecha_Cumpleaños",
                          "value": fechaCurp(curp),//birthdate es dd/mm/aaa
                          "type": "date"
                        },
                        {
                          "name": "BIRTHDAY",
                          "value": fechaCurp(curp),
                          "type": "date"
                        },
                        {
                          "name": "COUNTRY",
                          "value": 'MX',
                          "type": "country"
                        },
                        {
                          "name": "GENDER",
                          "value": sexoCurp(curp),
                          "type": "gender"
                        },
                        {
                          "name": "Fecha_Alta",
                          "value": hiredate,
                          "type": "string"
                        },
                        {
                          "name": "Presentador",
                          "value": firstname+" "+lastname,
                          "type": "string"
                        },
                        /*{
                          "name": "LE",
                          "value": supervisor,
                          "type": "string"
                        },*/
                        {
                          "name": "Lider_Equipo",
                          "value": supervisor,
                          "type": "string"
                        } ,
                        {
                          "name": "Gerente",
                          "value": delegada,
                          "type": "string"
                        },
                        {
                          "name": "Area_Manager",
                          "value": area_manager,
                          "type": "string"
                        },
                        {
                          "name": "Regional_Manager",
                          "value": regional_manager,
                          "type": "string"
                        },
                        {
                          "name": "Tipo",
                          "value": employeetype,
                          "type": "string"
                        },
                        {
                          "name": "CURP",
                          "value": curp,
                          "type": "string"
                        },
                        /*{
                          "name": "Genero",
                          "value": sexoCurp(curp) == "F"? 'Femenino':'Masculino',
                          "type": "string"
                        },*/
                    ] 
                }
                log.debug('empJson',empJson)
                resultSearch.push(empJson)
                return true; 

                });
            });
            log.debug('post busqueda',resultSearch)
            //log.debug('resultSearch',resultSearch)
            objRequestDOPPLER['items'] = resultSearch
            log.debug('post items doppler')
            objRequestDOPPLER['fields'] = [
                "FIRSTNAME",
                "Nombre_Completo",
                //"Apellido_Primero",
                "LASTNAME",
                //"Celular",
                "Telefono",
                "Sucursal",
                "IDUtxt",
                "IDU",
                //"Rango",
                "Status",
                //"IsInactive",
                "Fecha_Cumpleaños",
                "BIRTHDAY",
                "COUNTRY",
                "GENDER",
                "Fecha_Alta",
                "Presentador",
                //"LE",
                "Lider_Equipo",
                "Gerente",
                "Area_Manager",
                "Regional_Manager",
                "Tipo",
                "CURP",
                //"Genero",
            ]
            log.debug('objRequestDOPPLER',objRequestDOPPLER)
            var idLista = 28607733
            var apiKeyDoppler = '62AE8124B6180E8735AB20BB03933167'
            var responseService = https.post({
                url: 'https://restapi.fromdoppler.com/accounts/ezequiel.olguin%40thermomix.mx/lists/'+idLista+'/subscribers/import?api_key='+apiKeyDoppler,
                body : JSON.stringify(objRequestDOPPLER),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "token "+apiKeyDoppler
                }
            }).body;
            log.debug('responseService Doppler',responseService)




            var responseService = http.post({
                url: 'http://api-referidos-thrmx.lms-la.com/api/venta',
                body : JSON.stringify(objRequest),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6ImIyZmI2OTE5LWM0MjItNDg4YS04Y2NlLWQyZWVjYjE5ZTkwNyIsInN1YiI6ImpjcmV5ZXNAbG1zLWxhLmNvbSIsImVtYWlsIjoiamNyZXllc0BsbXMtbGEuY29tIiwianRpIjoiZTUzZTczZDYtYTk0Yy00Mzk4LTlhNjEtNzU5MDVlZTBlYzlmIiwibmJmIjoxNjU0ODE3ODU5LCJleHAiOjE2ODYzNTM4NTksImlhdCI6MTY1NDgxNzg1OX0.DcN1kY4for7XdwkzdgNa8pzbLyVao9M3yrW-0xpobvvBz2ycBrKBDaVmquB2Ms8226b6ZBm9ktUfE4-Hf9W6ww"
                }
            }).body;
            log.debug('responseService LMS',responseService)




           
        }catch(e){
            log.debug('Error execute',e)
        }
        
    }
    function formatoNumeroTel(numero){
        try{
            if(numero.length == 10){
            var nsplit = numero.split('')
            var fnum= "+52 "+nsplit[0]+nsplit[1]+nsplit[2]+" "+nsplit[3]+nsplit[4]+nsplit[5]+" "+nsplit[6]+nsplit[7]+nsplit[8]+nsplit[9]+""
            return fnum
        }else if(numero.length > 10){
            numero = numero.substring(numero.length - 10)
            var nsplit = numero.split('')
            var fnum= "+52 "+nsplit[0]+nsplit[1]+nsplit[2]+" "+nsplit[3]+nsplit[4]+nsplit[5]+" "+nsplit[6]+nsplit[7]+nsplit[8]+nsplit[9]+""
            return fnum
        }else{
            return ''
        }
        }catch(e){
            log.debug('Error formatoNumeroTel',e)
            return ''
        }
        
        
    }
    function fechaCurp(curp){
        try{
            if(curp && curp != null && curp != ''){
                var cSplit = curp.split('')
                log.debug(cSplit[4],isNaN(cSplit[4]))
                if(  isNaN(cSplit[4])  || isNaN(cSplit[5])  || isNaN(cSplit[6])  || isNaN(cSplit[7])  || isNaN(cSplit[8])   || isNaN(cSplit[9])   ){//Not-a-Number
                    return ''
                }else{
                    var anoCurp = cSplit[4]+cSplit[5]
                if(anoCurp < 33){//valido para 2032
                    anoCurp = "20"+anoCurp
                }else{
                    anoCurp = "19"+anoCurp
                }
                //var fDate = anoCurp+"-"+cSplit[6]+cSplit[7]+"-"+cSplit[8]+cSplit[9]
                if(anoCurp > 1000){
                    log.debug('new date',anoCurp+' - '+cSplit[6]+''+cSplit[7]+' - '+cSplit[8]+''+cSplit[9])
                    var fDate = new Date(anoCurp,cSplit[6]+cSplit[7],cSplit[8]+cSplit[9])
                    return fDate
                }else{
                    return ''
                }
                
                }
            }else{
                return ''
            }
            
        }catch(e){
            log.debug('Error formatoNumeroTel',e)
            return ''
        }
        
    }
    function sexoCurp(curp){
        try{
            if(curp && curp != null && curp != ''){
                var cSplit = curp.split('')
                var sCurp = cSplit[10]
                if(sCurp == 'M'){//Mujer
                   sCurp = "F"//Femenino
                }else if(sCurp == 'H'){//Hombre
                   sCurp = "M"//Masculino
                }else{
                    sCurp = ""
                }
                return sCurp
            }else{
                return ''
            }
            
        }catch(e){
            log.debug('Error formatoNumeroTel',e)
            return ''
        }
        
    }
    return {
        execute: execute
    };
    
});
