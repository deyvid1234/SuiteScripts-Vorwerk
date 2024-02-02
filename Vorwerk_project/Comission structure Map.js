/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/plugin','N/task','N/ui/serverWidget','N/search','N/runtime','N/file','N/email'], 
    function(plugin,task, serverWidget, search, runtime,file,email){
   
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
    	 var response = [];
    	 var scriptObj = runtime.getCurrentScript();
    	 var fileSearch1 = scriptObj.getParameter({name: 'custscriptid_file_one'});//informacion de la tabla
         var fileSearch2 = scriptObj.getParameter({name: 'custscript_id_file_two'});
         var cust_period = scriptObj.getParameter({name: 'custscript_cust_period'});
         var cust_type = scriptObj.getParameter({name: 'custscript_cust_type'});
         var cust_promo = scriptObj.getParameter({name: 'custscript_cust_promo'});
    	 try{
    	      Utils = plugin.loadImplementation({
    	            type: 'customscript_vorwer_commission_custplug'
    	        });
    	        log.debug('default impl result = ' + Utils.doTheMagic(10, 20));
    	    }catch(err){
    	      log.error("error plugin",err);
    	    }
    	    var information_jdg = busquedaPrincipal(fileSearch1)
    	    var structure_info = information_jdg.structure;
            log.debug('structure_info',structure_info)
            var nameFile1 = Utils.getFileId("search_aux_1"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
            if(nameFile1 == false){
	    	    var items_promo = Utils.matchEmpCompItems(structure_info);
	    	    var infoODVPromo_tm_ganada = Utils.searchSO(items_promo,cust_period,3,false,false);
	    	    response.push({info:infoODVPromo_tm_ganada,name:"search_aux_1"+cust_type+"_"+cust_period+"_"+cust_promo});
	    	    log.debug('infoODVPromo_tm_ganada',infoODVPromo_tm_ganada);
            }
            var nameFile2 = Utils.getFileId("search_aux_2"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
            if(nameFile2 == false){
	    	    var infoODVPromo = Utils.searchSO(items_promo,cust_period,false,false,false,cust_type,cust_promo);
	    	    log.debug('infoODVPromo',infoODVPromo);
	    	    response.push({info:infoODVPromo,name:"search_aux_2"+cust_type+"_"+cust_period+"_"+cust_promo});
	            log.debug('infoODVPromo',infoODVPromo)
            }
            var nameFile3 = Utils.getFileId("search_aux_3"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
            var info_data = information_jdg.data;
            var information_rec =  searchReclutas(info_data)
            var i_rec_data = information_rec.data;
            log.debug('i_rec_data',i_rec_data)
            var structure_info_rec = information_rec.reclutas_promo;
            if(nameFile3 == false){
	            log.debug('structure_info rec',structure_info_rec)
	            var reactivacion = information_rec.reactivacion;
	            var items_promo_rec = Utils.matchEmpCompItems(structure_info_rec);
	            log.debug('items_promo rec',items_promo_rec);
	            var infoODVPromo_rec = Utils.searchSO(items_promo_rec,cust_period,false,false,false);
	            log.debug('infoODVPromo rec',infoODVPromo_rec);
	            response.push({info:infoODVPromo_rec,name:"search_aux_3"+cust_type+"_"+cust_period+"_"+cust_promo});
            }
            var nameFile4 = Utils.getFileId("search_aux_4"+cust_type+"_"+cust_period+"_"+cust_promo+".json");
            if(nameFile4 == false){
            	var items_promo_rec = Utils.matchEmpCompItems(structure_info_rec);
 	            var infoODVPromo_rec_historico = Utils.searchSO(items_promo_rec,cust_period,false,true,false);
 	            log.debug('infoODVPromo rec',infoODVPromo_rec_historico);
	            response.push({info:infoODVPromo_rec_historico,name:"search_aux_4"+cust_type+"_"+cust_period+"_"+cust_promo});
            }
            
            
            
    	  return response;  
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	var folder = 222525;
    	var comissionInfo = JSON.parse(context.value);
    	log.debug("map create files",comissionInfo);
    	
        if(runtime.envType != 'PRODUCTION'){ 
                  folder = 213369;//cambiar para sandbox
              }else{
                folder = 222525;
              }
        log.debug('runtime '+folder,runtime.envType);
        
    	var jsonFile = file.create({
            name : comissionInfo.name+'.json',
            fileType : 'JSON',
            contents : JSON.stringify(comissionInfo.info),
            folder: folder
        });
        
        intFileId = jsonFile.save();
        
        
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	log.debug("sumary",summary);
    	try{
    		email.send({
        		author: '344096',
    			recipients: ['eomar_ol@hotmail.com','daniel.delgado@mxthermomix.com','pilar.torres@vorwerk.de'],
    			subject: 'Información comisiones generado',
    			body: 'Proceso de guardado terminado ya puede generar el reporte'
    		}); 
        }
    	
        catch(e){
            log.error('reduce',e);
        }
    }
    
    
    function busquedaPrincipal(fileSearch1){
        try{
          log.debug("entre busqueda principal","start"+fileSearch1);
           var fileObj = file.load({
             id: fileSearch1
         });
         var info = fileObj.getContents();
         var structure = JSON.parse(info);
             log.debug('structure',structure.data);
              return structure;
        }catch(e){
          log.debug("error busqueda",e)
        }
            
   }
    
    function searchReclutas(info_data){
        try {
          //extrae todas las reclutas en una busqueda
          var reclutas_promo = {}
          var reactivacion = {}
          log.debug('keys searchReclutas',Object.keys(info_data));
          var idJDG = Object.keys(info_data);
          var data = {}
          var busqueda = search.create({
                type: 'employee',
                filters: [{ name: 'custentity_reclutadora', operator: 'anyof', values: idJDG},{name: 'isinactive', operator: 'is', values: false},{name: 'hiredate', operator: 'AFTER', values: '1/1/2019'}],
                columns: ['internalid','custentity_reclutadora','custentity123','custentity72']
            });
         var pagedResults = busqueda.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (result) {
                     
                        if(result.getValue('custentity_reclutadora') in data){//valida si existe la reclutadora en el objeto
                          data[result.getValue('custentity_reclutadora')].push(result.getValue('internalid'));
                        }else{//en caso de no existir crea una clave con el id del recluta y almacena al recluta encontrado
                          data[result.getValue('custentity_reclutadora')]= [result.getValue('internalid')];
                        }
                         reclutas_promo[result.getValue('internalid')]=result.getValue('custentity123').split(",");
                         if(result.getValue('custentity72') != ''){
                           reactivacion[result.getValue('internalid')]=result.getValue('custentity72');
                         }else{
                           reactivacion[result.getValue('internalid')]=false;
                         }
                         
                         //data[result.getValue('internalid')]=result;//almacena las jdg por id [1234]={name:id,type,date...etc}
           
                    });
                      
              });
              log.debug('structure rec',reclutas_promo);    
              log.debug('data rec',data);  
          return {data:data, reclutas_promo:reclutas_promo,reactivacion:reactivacion};
        }catch(e){
          log.debug("Error busqueda de reclutas", e)
        }
        
       
      }
    
    return {
        getInputData: getInputData,
        map: map,
//        reduce: reduce,
        summarize: summarize
    };
    
});
