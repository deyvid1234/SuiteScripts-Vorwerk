/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file','N/search','N/plugin','N/runtime','N/task'],

function(file,search,plugin,runtime,task) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
      if (context.request.method == 'POST') {
        try{
          var folder = 222525;
          log.debug('runtime '+folder,runtime.envType);
          try{
              Utils = plugin.loadImplementation({
                    type: 'customscript_vorwer_commission_custplug'
                });
                log.debug('default impl result = ' + Utils.doTheMagic(10, 20));
            }catch(err){
              log.error("error plugin",err);
            }
          var request = context.request;
              var body = JSON.parse(context.request.body);
              var cust_type = body.type;
              var cust_promo = body.promo;
              var cust_period = body.period;
              log.debug('body',body);
              var firsthName = 'structure_'+cust_period+'_'+cust_promo+'_'+cust_type+'.json';
              var secondName = 'search_'+cust_period+'_'+cust_promo+'_'+cust_type+'.json';
              var intFileId = "",intFileId2 = "";
              var idFile1 = getFileId(firsthName);
              var information_jdg = {};
              log.debug('firsthName',firsthName);
              if(!idFile1){
                information_jdg = busquedaPrincipal(cust_type,cust_promo,cust_period)
                  
                  
                  
                  var jsonFile = file.create({
                        name : 'structure_'+cust_period+'_'+cust_promo+'_'+cust_type+'.json',
                        fileType : 'JSON',
                        contents : JSON.stringify(information_jdg),
                        folder: folder
                    });
                  
                    intFileId = jsonFile.save();
              }else{
                log.debug("ya existe estructura",idFile1);
                intFileId = idFile1;
                information_jdg = busquedaPrincipal(cust_type,cust_promo,cust_period)
                log.debug("buscare estructura 2",":)");
              }
              log.debug('secondName',secondName);
              var idFile2 = getFileId(secondName);
              if(!idFile2){
            	  	
	            	  var mapTask = task.create({
		                  taskType: task.TaskType.SCHEDULED_SCRIPT,
		                  scriptId: 'customscript_vorwerk_aux_comission_sched',
		                  params: {
		                	  custscript_cust_period_s:cust_period,
		                	  custscript_cust_type_s:cust_type,
		                	  custscript_cust_promo_s:cust_promo,
		                	  custscript_secondname: secondName
		                	  
		                  }
		            }).submit();
	            	  log.debug("dispare schedule",":S");
              }else{
                intFileId2 = idFile2
                log.debug("ya existe busqueda ",idFile2);
                
              }
              try{
            	  if(idFile2 && idFile1){
            		  var mapTask = task.create({
    	                  taskType: task.TaskType.MAP_REDUCE,
    	                  scriptId: 'customscript_comission_structure_map',
    	                  params: {
    	                	  custscriptid_file_one: intFileId,
    	                	  custscript_id_file_two: intFileId,
    	                	  custscript_cust_period:cust_period,
    	                	  custscript_cust_type:cust_type,
    	                	  custscript_cust_promo:cust_promo
    	                	  
    	                  }
    	            }).submit();
            	  }else{
            		  context.response.write(JSON.stringify({error:"Debe esperar a que las estructuras se actualicen"})); 
            	  }
              }catch(err_mp){
            	  log.error('error structur map',err_mp);
              }
	              
                context.response.write(JSON.stringify({idFile1:intFileId,idFile2:intFileId2}));
        }catch(err){
          log.error("err post",err);
        }
        
      }else{
        try{
          //read file
          var id = getFileId('structure1111.json');
          if(!id){
            log.debug("no existo :(");
            context.response.write(":(");
          }else{
            context.response.write(id);
          }
            
        }catch(err){
          log.error("error load file",err);
        }
        
      }
    }
    
    
    function getFileId(filename){
      
      try{
        var id = false;
        var fileSearchObj = search.create({
          type: "file",
          filters: [
            ["name", "is", filename]
          ],
          columns: [
            search.createColumn({
              name: "name",
              sort: search.Sort.ASC
            }),
            "folder",
            "url",
            "filetype",
            "internalid"
          ]
        });

        var searchResult = fileSearchObj.run().getRange(0, 100);
        for (var i = 0; i < searchResult.length; i++) {
          id =  searchResult[i].getValue('internalid');
        }

        return id;
      }catch(err){
        log.debug("err get file",err);
        return false;
      }
      

    }
    

    function busquedaPrincipal(cust_type,cust_promo,idPeriod){
        try{
          var info_data= {};
          var jdg_promo= {};
          var arr_aux = {}
          var nombramiento = {}
          var tipo_ingreso = {}
          
         
      var monthlyPeriod = search.create({
          type: 'customrecord_periods',
          columns: [
              { name: 'internalid'},
              { name: 'custrecord_inicio'},
              { name: 'custrecord_final'},
          ],
          filters: [
              {
                  name: 'internalid',
                  operator: 'anyof',
                  values: idPeriod
              }
          ]
      });
      var objReturn = {};
      monthlyPeriod.run().each(function(r){
          objReturn.internalid = r.getValue('internalid'),
          objReturn.startDate = r.getValue('custrecord_inicio').split('/'),
          objReturn.endDate = r.getValue('custrecord_final').split('/');
          return true;
      });
          var start = new Date(objReturn.startDate[2],objReturn.startDate[1]-1,objReturn.startDate[0]);
          var end = new Date(objReturn.endDate[2],objReturn.endDate[1]-1,objReturn.endDate[0])
          var busqueda = search.create({
              type: 'employee',
                filters: [
                           {
                   name: 'isinactive',
                   operator: 'is',
                   values: false
                },
                {
                    name: 'employeetype',
                    operator: 'is',
                    values: cust_type
                },
                {
                    name: 'custentity_promocion',
                    operator: 'is',
                    values: cust_promo
                },
                {
                    name: 'salesrep',
                    operator: 'is',
                    values: true
                },
                {
                    name: 'custentity123',
                    operator: 'anyof',
                    values: [1,2,3,4,5,6,7,8]
                },
                {
                  name: 'internalid',
                  operator: 'anyof',
                  values: [21613,77906,197346]
               },
                
              ],
              columns: [
                  { name: 'altname' },
                  { name: 'employeetype' },
                  { name: 'internalid' },
                  { name: 'custentity_promocion' },
                  { name: 'custentity123' },
                  { name: 'custentity_delegada' },
                  { name: 'custentity_reclutadora' },
                  { name: 'hiredate' },
                  { name: 'custentity_nombre_unidad'},
                  { name: 'isinactive' },
                  { name: 'issalesrep'},
                  { name: 'entityid'},
                  { name: 'custentity_nombramiento'},
                  { name: 'custentity_fecha_nombramiento'},
                  { name: 'custentity_nombramiento_le'},
                  { name: 'custentity72'},
                  { name: 'custentity_estructura_virtual'},
                  { name: 'custentity_tipo_ingreso'}
                  
              ]
          });
      
          var pagedResults = busqueda.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (result) {
             
                    var obj = new Object();
                    obj.altname = result.getValue('internalid')
                    obj.employeetype = result.getValue('employeetype');
                    obj.internalid = result.getValue('internalid');
                    obj.custentity_promocion = result.getValue('custentity_promocion');
                    obj.custentity123 = result.getText('custentity123');
                    obj.custentity_delegada = result.getText('custentity_delegada');
                    obj.custentity_reclutadora = result.getValue('custentity_reclutadora');
                    obj.hiredate = result.getValue('hiredate');
                    obj.custentity_nombre_unidad = result.getValue('custentity_nombre_unidad');
                    obj.isinactive = result.getValue('isinactive');
                    obj.issalesrep = result.getValue('issalesrep');
                    obj.entityid = result.getValue('entityid');
                    obj.nombramiento = result.getValue('custentity_nombramiento');
                    obj.fecha_nombramiento = result.getValue('custentity_fecha_nombramiento').split("/");
                    obj.nombramiento_le = result.getValue('custentity_nombramiento_le');
                    obj.fecha_reactivacion = result.getValue('custentity72');
                    obj.e_virtual = result.getValue('custentity_estructura_virtual');
                    obj.tipo_ingreso = result.getValue('custentity_tipo_ingreso');
                    // log.debug("inactive",obj.isinactive)
                    //log.debug("rep",obj.issalesrep)
                    jdg_promo[result.getValue('internalid')]=result.getValue('custentity123').split(",");
                    info_data[result.getValue('internalid')]=obj;//almacena las jdg por id [1234]={name:id,type,date...etc}}
              
                    var fecha = new Date(obj.fecha_nombramiento[2],obj.fecha_nombramiento[1]-1,obj.fecha_nombramiento[0]);
                  
                    if(obj.nombramiento_le == 2 && fecha <= end && fecha >= start){
                      if (nombramiento.hasOwnProperty(obj.nombramiento)){
                            nombramiento[obj.nombramiento].push([{nuevo_le:obj.altname},{fecha:obj.fecha_nombramiento,nombramiento_le:obj.nombramiento_le}])
                        }else{
                            nombramiento[obj.nombramiento]= [{nuevo_le:obj.altname,fecha:obj.fecha_nombramiento,nombramiento_le:obj.nombramiento_le}]

                        } 
                    }
                    if(obj.tipo_ingreso != 11 && obj.tipo_ingreso != 10 && obj.tipo_ingreso != ''){
                     tipo_ingreso[result.getValue('internalid')]= result.getValue('custentity123').split(",");   
                    }
                    arr_aux[result.getValue('entityid')]=true;
                  return true;
               });

            });
              return {data:info_data,structure:jdg_promo,nombramiento:nombramiento,tipo_ingreso:tipo_ingreso};
        }catch(e){
          log.debug("error busqueda",e)
          console.log("error busqueda principal",e);
        }
            
      }
    return {
        onRequest: onRequest,
        busquedaPrincipal:busquedaPrincipal
    };
    
});
