//Utils v2
define(['N/record', 'N/search','N/runtime','N/format','N/query','N/currency'],

function(record, search, runtime, format, query,currency) {
    
    function getLog(scriptName){
        log.debug('llamado correcto de utils',scriptName)
    }
     function currencyConvert(monedaOrigen,monedaSalida){
       
        var origen = ''
        var salida = ''
            switch(monedaOrigen){
                case '1':
                    origen = 'MXN'
                    break;
                case '2': 
                    origen = 'USD'
                    break;
                case '3': 
                    origen = 'CAD'
                    break;
                case '4': 
                    origen = 'EUR'
                    break;
                case '5': 
                    origen = 'GBP'
                    break;
                case '6': 
                    origen = 'CZK'
                    break;
                case '7': 
                    origen = 'CNY'
                    break;
                
            }
            switch(monedaSalida){
                case '1':
                    salida = 'MXN'
                    break;
                case '2': 
                    salida = 'USD'
                    break;
                case '3': 
                    salida = 'CAD'
                    break;
                case '4': 
                    salida = 'EUR'
                    break;
                case '5': 
                    salida = 'GBP'
                    break;
                case '6': 
                    salida = 'CZK'
                    break;
                case '7': 
                    salida = 'CNY'
                    break;
                
            }
           
            var rate = currency.exchangeRate({
                source: origen,
                target: salida,
                //date: new Date('7/28/2015')
            });
        

        return rate
    }
    function getConf(configuracion){
        var x=configuracion.split(',')
        var conf
        for(n in x){
            switch(x[n]){
                case '1':
                    conf = 1
                    break;
                case '5': 
                    conf = 5
                    break;
                case '6': 
                    conf = 6
                    break;
                case '7': 
                    conf = 7
                    break;
                case '8': 
                    conf = 8
                    break;
                case '11': 
                    conf = 11
                    break;
                case '12': 
                    conf = 12
                    break;
                case '13': 
                    conf = 13
                    break;
            }
        }
        return conf
    }
    function getObjPeriod(idPeriod){
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
        }
    //Inicia bbusqueda de configuraciones
    function getObjCompConfigDetails(){
        var objCompensationConfig = this.getCompensationConfig();
        log.debug('objCompensationConfig',objCompensationConfig)
        var objWithVentasPresentadora = this.getEsquemaVentasPresentadora(objCompensationConfig);
        var objWithVentasJefaPropias = this.getEsquemaVentasJefaPropias(objWithVentasPresentadora);
        var objWithVentasJefaGrupo = this.getEsquemaVentasJefaGrupo(objWithVentasJefaPropias);
        var objWithVentasTrabajaXTM = this.getEsquemaVentasTrabajaXTM(objWithVentasJefaGrupo);
        var objWithVentasReclutamiento = this.getEsquemaVentasReclutamiento(objWithVentasTrabajaXTM);

        return objWithVentasReclutamiento
    }
    
    function getCompensationConfig(){
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
    }

    function getEsquemaVentasPresentadora(objCompensationConfig){
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
    }
    function getEsquemaVentasJefaPropias(objCompensationConfig){
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
//               log.debug('internalid',internalid);
//               log.debug('thisParent',thisParent);
            objCompensationConfig[thisParent]['esquemaVentasJefaGrupo']['propias'][internalid] = {
                'desde': r.getValue('custrecord_relacion_equipo_propias_desde'),
                'hasta': r.getValue('custrecord_relacion_equipo_propias_hasta'),
                'porcentaje': r.getValue('custrecord_relacion_equipo_propias_porc')
            };
            
            return true;
        });
        return objCompensationConfig;
    }
    function getEsquemaVentasJefaGrupo(objCompensationConfig){
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
    }
    function getEsquemaVentasTrabajaXTM(objCompensationConfig){//validar los campos ya que no tiene rango de ventas
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
    }
    function getEsquemaVentasReclutamiento(objCompensationConfig){
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
    }
    //fin busqueda de compensaciones

    //Inicio dateToString
    // Recive un new date y devuelve un texto con formato dd/mm/yyyy
    function dateToString(fecha){//Se espera "2023-09-30T07:00:00.000Z"
        // Verificar si la entrada es un objeto Date
        if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
            log.error('La fecha proporcionada no es válida.');
            return null; 
        }

        // Obtener los componentes de la fecha
        const dia = fecha.getDate().toString();
        const mes = (fecha.getMonth() + 1).toString(); // Se suma 1 porque los meses van de 0 a 11
        const ano = fecha.getFullYear();

        // Construir la cadena en formato dd/mm/yyyy
        const fechaFormateada = dia+'/'+mes+'/'+ano;

        return fechaFormateada;
    }
    //Fin dateToString 

    //inicia stringToDate: recibe una cadena de fecha tipo string y la devuelve tipo date
    function stringToDate(fechaString) {
        // Verificar si la cadena de fecha es nula o indefinida
        fechaString = fechaString.toString();
        if (!fechaString) {
            log.error('La cadena de fecha proporcionada es nula o indefinida.');
            return null; 
        }

        // Detectar el formato de la cadena de fecha
        var partesFecha;
        if (fechaString.indexOf('/') || fechaString.indexOf('-')) {
            partesFecha = fechaString.split(/\/|-/); // Utilizar una expresión regular para admitir ambos separadores
        } else {
            log.error('Formato de fecha no compatible. Use dd/mm/yyyy o yyyy/mm/dd.');
            return null;
        }
        // Verificar si el formato es yyyy/mm/dd o dd/mm/yyyy
        var ano, mes, dia;
        if (partesFecha[0].length === 4) {
            ano = partesFecha[0];
            mes = partesFecha[1];
            dia = partesFecha[2];
        } else {
            ano = partesFecha[2];
            mes = partesFecha[1];
            dia = partesFecha[0];
        }

        // Convertir a formato de fecha yyyy/mm/dd
        var fecha = new Date(ano+'/'+mes+'/'+dia);

        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            log.error('La fecha proporcionada no es válida.');
            return null;
        }

        // Clonar la fecha para evitar modificar la fecha original
        const nuevaFecha = new Date(fecha);


        return nuevaFecha;
    }
    //fin stringToDate

    //Inicia restarMeses: recibe una fecha de tipo string y la cantidad de meses que se desea restar a dicha fecha devuelve la fecha(tipo date) con la rsta correspniente
    function restarMeses(fechaString, cantidadMeses) {
        
        const nuevaFecha = stringToDate(fechaString)
        
        // Restar la cantidad de meses
        nuevaFecha.setMonth(nuevaFecha.getMonth() - cantidadMeses);

        return nuevaFecha;
    }
    function sumarMeses(fechaString, cantidadMeses) {
        
        const nuevaFecha = stringToDate(fechaString)
        
        // Restar la cantidad de meses
        nuevaFecha.setMonth(nuevaFecha.getMonth() + cantidadMeses);

        return nuevaFecha;
    }

    return {
        getLog: getLog,
        currencyConvert:currencyConvert,
        getConf:getConf,
        dateToString:dateToString,
        stringToDate:stringToDate,
        restarMeses:restarMeses,
        sumarMeses:sumarMeses,
        getObjCompConfigDetails:getObjCompConfigDetails,
        getCompensationConfig:getCompensationConfig,
        getEsquemaVentasPresentadora:getEsquemaVentasPresentadora,
        getEsquemaVentasJefaPropias: getEsquemaVentasJefaPropias,
        getEsquemaVentasJefaGrupo: getEsquemaVentasJefaGrupo,
        getEsquemaVentasTrabajaXTM:getEsquemaVentasTrabajaXTM, 
        getEsquemaVentasReclutamiento:getEsquemaVentasReclutamiento,
    };
});