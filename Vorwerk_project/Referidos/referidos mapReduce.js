/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/https','N/runtime'],

function(search,https,runtime) {
   
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
      try{
        var registrosCatch = search.create({
          type: 'customrecord_catch_recomendaciones'
          columns:[
                    'custrecord_response_reintento',
                    'custrecord_procesado',
                  ],
                filters: [
                    {
                        name: 'custrecord_procesado',
                        operator: 'is',
                        values : false
                    }
                  ]

          })
          var pagedResults = busqueda.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r){
                  info.push({
                    
                    procesado: r.getValue('custrecord_procesado'),
                    responseReintento: r.getValue('custrecord_response_reintento')
                  });
                });



        return registrosCatch;
      }catch(err){
        log.error('getInputData',err)
      }

    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
      try{
        //var registrosCatch = JSON.parse(context.value)
        //log.debug('obj_detail',obj_detail)
        //registrosCatch.estructura=[]

        if(registrosCatch.procesado == false){
            ....



            var regional_manager = getEmployeeData(obj_detail.regional_manager,'regional manager')
            obj_detail.estructura.push(regional_manager)
        }
        if(obj_detail.area_manager != ''){
            var area_manager = getEmployeeData(obj_detail.area_manager,'area manager')
            obj_detail.estructura.push(area_manager)
        }
        if(obj_detail.gerente != '' ){
          var obj_gerente = getEmployeeData(obj_detail.gerente,'gerente')
          obj_detail.estructura.push(obj_gerente)
        }
        if(obj_detail.lider != ''){
          var obj_lider = getEmployeeData(obj_detail.lider,'lider')
          obj_detail.estructura.push(obj_lider)
        }
        
        if(obj_detail.mostrador != ''){
            var mostrador = getEmployeeData(obj_detail.mostrador,'mostrador')
            obj_detail.estructura.push(mostrador)
        }
        delete obj_detail.regional_manager
        delete obj_detail.area_manager
        delete obj_detail.lider
        delete obj_detail.gerente
        delete obj_detail.mostrador
        log.debug('JSON send',obj_detail)
        if(runtime.envType != 'PRODUCTION'){ 
            urlAD = 'https://dev-apiagenda.mxthermomix.com/users/registerUserNetsuite'
        }else{//prod
            urlAD = 'https://apiagenda.mxthermomix.com/users/registerUserNetsuite'
        }
         log.debug('urlAD',urlAD)
        var responseService = https.post({
          url: urlAD,
        body : JSON.stringify(obj_detail),
        headers: {
            "Content-Type": "application/json"
          }
          }).body;
        var responseService = JSON.parse(responseService)
        log.debug('responseService',responseService)
        



      }catch(err){
        log.error('map',err)
      }

    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
      log.debug('context Reduce',context)

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
      log.debug('summary summarize',summary)
    }
   /* function searchPresentadora(){
      try{
        var obj_sub =[]
        var searchData = search.create({
                type: 'employee',
                columns: ['internalid','entityid','firstname','email','mobilephone','lastname',
                         'isinactive','employeetype','custentity_oficina','location',
                         'custentity_delegada','supervisor','custentityregional_manager','custentity_area_manager','custentity_estructura_virtual',
                         {name : 'custentity_mostrador',join : 'custentity_delegada'},
                        ],
                filters: [
                    ['salesrep','is',true],
                    'and',
                    ['employeetype', 'anyof', '5', '3', '1', '8'],
            'AND',
            ['email', 'isnotempty', ''],
            'AND',
            ['custentity_curp', 'isnotempty', ''],
            'AND',
            [
              [
                ['isinactive', 'is', 'T'],
                'AND',
                ['custentity59', 'isnotempty', ''],
              ],
              'OR',
              [
                ['isinactive', 'is', 'F'],
              ],
            ],
                ]
            });
        var obj_detail = [];
      var pagedResults = searchData.runPaged();
      pagedResults.pageRanges.forEach(function (pageRange){     
        var currentPage = pagedResults.fetch({index: pageRange.index});
        currentPage.data.forEach(function (result) {
          obj_detail.push({
            id : result.getValue('internalid'),
            idu : result.getValue('entityid'),
            nombre : result.getValue('firstname'),
            apellido : result.getValue('lastname'),
            correo : result.getValue('email'),
            telefono : result.getValue('mobilephone'),
            inactivo: result.getValue('isinactive'),
            virtual: result.getValue('custentity_estructura_virtual'),
            rol :[{text:result.getText('employeetype'),value:result.getValue('employeetype')}],
            gerencia: result.getText('custentity_gerencia'),
            sucursal:{name:result.getText('custentity_oficina'),value:result.getValue('custentity_oficina')},
            gerente: result.getValue('custentity_delegada'),
            lider:result.getValue('supervisor'),
            area_manager: result.getValue('custentity_area_manager'),
            regional_manager: result.getValue('custentityregional_manager'),
            mostrador:result.getValue({name : 'custentity_mostrador',join : 'custentity_delegada'})
            
            
            
           
          });
          
        });
      });
      
      
      
      
      return obj_detail;
        
      }catch(err){
        log.debug('searchData',err)
        return err;
      }
    }
    
    function getEmployeeData(idemp,rol){
      try{
        
        var obj_emp = search.lookupFields({
                    type: 'employee',
                    id: idemp,
                    columns: ['entityid','firstname','lastname','email','mobilephone','employeetype','custentity_oficina','custentity_num_am']
                });
        if(rol == "mostrador"){
          obj_emp.employeetype.push({value:"55",text:"mostrador"})
        }else{
          obj_emp.employeetype[0].text = rol
        }
        
        var obj_aux={
          id:idemp,
          idu:obj_emp.entityid,
          nombre:obj_emp.firstname,
          apellido:obj_emp.lastname,
          correo:obj_emp.email,
          telefono:obj_emp.mobilephone,
          rol:obj_emp.employeetype,
          oficina:obj_emp.custentity_oficina,
          noam:obj_emp.custentity_num_am
          
        }

        return obj_aux;
      }catch(err){
        log.error('getEmployeeData',err)
      }
    }*/

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
