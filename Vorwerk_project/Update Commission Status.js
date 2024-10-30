/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/format','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],

function(search,record,format,Utils) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	var presentadorasSearch = search.load({
            id: 'customsearchemp_search_commissionstatus' //employees
        });
    	
    	return presentadorasSearch;
    	
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		var registeInfo = JSON.parse(context.value);
        	var salesrep = registeInfo.values["internalid"].value;
        	log.debug('salesrep',salesrep)
        	var recordid = null	
     	    try{
                log.debug('salesrep',salesrep)
                var presentador = record.load({//Cargar registro del sales rep
                    type: 'employee',
                    id: salesrep,
                    isDynamic: false
                });
                var configuracion = presentador.getValue('custentity123')
                var promocion = presentador.getValue('custentity_promocion')
                log.debug('configuracion',configuracion)
                var fechaObj2
                var hiredate 
                var reactivacion = presentador.getValue('custentity72')
                if(reactivacion != ''){
                    fechaObj2 = presentador.getValue('custentity_fin_objetivo_2_reactivacion')
                    hiredate = reactivacion
                    
                } else{    
                    fechaObj2 = presentador.getValue('custentity_fin_objetivo_2')
                    hiredate = presentador.getValue('hiredate')

                }
                log.debug('hiredate1',hiredate)
                hiredate = Utils.dateToString(hiredate)
                log.debug('hiredate2',hiredate)
                log.debug('fechaObj21',fechaObj2)
                //fechaObj2 = Utils.dateToString(fechaObj2)
                //log.debug('fechaObj22',fechaObj2)
                fechaObj2.setDate(fechaObj2.getDate() + 2);
                log.debug('fechaObj23',fechaObj2)


                var busqueda = search.load({
                    id: 'customsearch_emp_promo_control'
                });
                busqueda.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: 'is',
                    values: salesrep
                }));

                var date_transform_tm_propia = new Date();
                date_transform_tm_propia.setDate(date_transform_tm_propia.getDate() + 3); //Suma un dia para nunca cumplir la validacion en caso de que el EMP aun no sea TM propia
                
                busqueda.run().each(function(r){
                    var todo = r.getAllValues();

                    
                    aux_date_tm_propia = todo["GROUP(custentityaux_date_tm_propia)"]
                    log.debug('aux_date_tm_propia',aux_date_tm_propia)
                    
                    if(aux_date_tm_propia){
                        date_transform_tm_propia = Utils.stringToDate(aux_date_tm_propia)
                    }else{
                        date_transform_tm_propia = todo["MAX(systemNotes.date)"]//Fecha en formato 4/10/2024 9:15 AM 
                        date_transform_tm_propia = Utils.stringToDate(date_transform_tm_propia.split(' ')[0])
                        log.debug('date_transform_tm_propia',date_transform_tm_propia)
                    }
                    return true;
                });






                var limit = 6
                for (i = 0; i < configuracion.length ; i++){
                    //log.debug('configuracion[i].value',configuracion[i])
                    if(configuracion[i] == 11 || configuracion[i] == 12 || configuracion[i] == 13 || configuracion[i] == 14){//TM6R o TM4U
                        limit = 4
                    }
                }
                var cont = 1
                var contVentas = 0
                var arregloPrimerasVentas= []
                var soSearch = search.load({
                    id: 'customsearch_so_commission_status' //busqueda de so 
                });
                soSearch.filters.push(search.createFilter({
                       name: 'salesrep',
                       operator: 'is',
                       values: salesrep
                }));
                soSearch.filters.push(search.createFilter({
                       name: 'trandate',
                       operator: 'onorafter',
                       values: hiredate
                }));
                
                soSearch.run().each(function(r){//validar
                    contVentas ++
                    var internalId = r.getValue('internalid')
                    arregloPrimerasVentas.push(internalId)
                    log.debug('internalId',internalId)
                    var tipoVenta = r.getValue('custbody_tipo_venta')
                    var fechaSO = r.getValue('trandate')
                    fechaSO = Utils.stringToDate(fechaSO)
                    log.debug('fechaSO',fechaSO)
                    log.debug('contVentas',contVentas)
                    log.debug('arregloPrimerasVentas',arregloPrimerasVentas)

                    if (contVentas >= 10){
                        if(arregloPrimerasVentas.hasOwnProperty(recordid)){
                            log.debug('esta en el arreglo, ya paso por el for')
                        }else{
                            log.debug('vamos a actualizar el com status de ',recordid)
                            var submitFields = record.submitFields({
                                type: record.Type.SALES_ORDER,
                                id: recordid,
                                values: {'custbody_vw_comission_status':''}
                            });
                        }

                        return false
                    }
                    if((tipoVenta == '2'|| tipoVenta == '19') && fechaSO <= fechaObj2 && cont <= limit && fechaSO <= date_transform_tm_propia ){
                        //log.debug('internalId',internalId)
                        log.debug('set com status no comisionable')
                        var submitFields = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: internalId,
                            values: {'custbody_vw_comission_status':'2'}
                        });
                        cont ++
            
                    }else if (cont > limit|| fechaSO > fechaObj2 || promocion ==2){
                        log.debug('si comisiona break')
                        var submitFields = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: internalId,
                            values: {'custbody_vw_comission_status':''}
                        });
                        
                    }else {
                        log.debug('else')
                        var submitFields = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: internalId,
                            values: {'custbody_vw_comission_status':'2'}
                        });
                        
                    }
                    
                   
                    return true
                    
                });
                

            }catch (e){
                log.debug('error funcion comision status',e)
            }   
     	       
	       
    	}catch(err){
    		log.error("err map",err);
    	}
    	

    	
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	log.debug("reduce",context);
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	log.debug("summary",summary);
    }

    return {
        getInputData: getInputData,
        map: map,
//        reduce: reduce,
        summarize: summarize
    };
    
});

/*OLD 


//log.debug('registeInfo',registeInfo)
            var idPre = registeInfo.values["GROUP(internalid)"].value;
            //log.debug('idPre',idPre)
            var configuracion = registeInfo.values["GROUP(custentity123)"]
            var fechaTMPropia =registeInfo.values["MAX(date.systemNotes)"].split(' ')
            fechaTMPropia = Utils.stringToDate(fechaTMPropia[0])
            //log.debug('fechaTMPropia',fechaTMPropia)
            var limit = 6
            //log.debug('configuracion',configuracion)
            for (i = 0; i < configuracion.length ; i++){
                    //log.debug('configuracion[i].value',configuracion[i])
                    if(configuracion[i] == 11 || configuracion[i] == 12 || configuracion[i] == 13 || configuracion[i] == 14){//TM6R o TM4U
                        limit = 4
                    }
                 }
            //log.debug('limit',limit)
            var presentadorasSearch = search.load({
                id: 'customsearchso_search_commisionstatus' //employees
            });
            presentadorasSearch.filters.push(search.createFilter({
                   name: 'salesrep',
                   operator: 'is',
                   values: idPre
            }));
            
            var cont = 0
            
            presentadorasSearch.run().each(function(r){
                var internalId = r.getValue('internalid')
                var tipoVenta = r.getValue('custbody_tipo_venta')
                var fechaSO = r.getValue('trandate')
                fechaSO = Utils.stringToDate(fechaSO)
                //log.debug('fechaSO',fechaSO)
                if(fechaSO > fechaTMPropia){
                    //log.debug('internalId',internalId)
                    log.debug('set com status comisionable',internalId)
                    var submitFields = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: internalId,
                            values: {'custbody_vw_comission_status':''}
                        });
                }else{
                    if(tipoVenta == '2' && cont < limit){
                        //log.debug('internalId',internalId)
                        log.debug('set com status no comisionable',internalId)
                        var submitFields = record.submitFields({
                                type: record.Type.SALES_ORDER,
                                id: internalId,
                                values: {'custbody_vw_comission_status':'2'}
                            });
                        cont ++
            
                    }else if (cont >= limit){
                        log.debug('si comisiona break',internalId)
                        var submitFields = record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: internalId,
                            values: {'custbody_vw_comission_status':''}
                        });
                        
                    }
                }
               
                return true
                
            });



            */