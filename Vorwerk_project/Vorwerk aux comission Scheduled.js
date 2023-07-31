/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/file','N/search','N/plugin','N/runtime','./Vorwerk Comission aux Suitelet.js'],

function(file,search,plugin,runtime,Aux) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var Utils = {};
    	var folder = 222525;
    	 try{
             Utils = plugin.loadImplementation({
                   type: 'customscript_vorwer_commission_custplug'
               });
               log.debug('default impl result = ' + Utils.doTheMagic(10, 20));
           }catch(err){
             log.error("error plugin",err);
           }
    	try{
    		var scriptObj = runtime.getCurrentScript();
            var cust_period = scriptObj.getParameter({name: 'custscript_cust_period_s'});//informacion de la tabla
            var cust_type = scriptObj.getParameter({name: 'custscript_cust_type_s'});//informacion de la tabla
            var cust_promo = scriptObj.getParameter({name: 'custscript_cust_promo_s'});//informacion de la tabla
            var secondname = scriptObj.getParameter({name: 'custscript_secondname'});//informacion de la tabla
    		
    		information_jdg = Aux.busquedaPrincipal(cust_type,cust_promo,cust_period)
    		
    		var info_data = information_jdg.data;
            var nombramiento =information_jdg.nombramiento;
            var structure_tipo_ingreso = information_jdg.tipo_ingreso; //presentadoras dif a TM 6 pagada
            log.debug('info_data',info_data)
            var structure_info = information_jdg.structure;
            log.debug('structure_info',structure_info)
            var items_promo = Utils.matchEmpCompItems(structure_info);
            log.debug('items_promo',items_promo);
            
            if(cust_type == 1 && cust_promo == 2){
              log.debug('presentadoras dif TM 6 pagadas',Object.keys(structure_tipo_ingreso).length)
              log.debug('Presentadoras TM 6 pagada',Object.keys(structure_info).length)
              if(Object.keys(structure_tipo_ingreso).length >0){
                var items_promo_tipo_ingreso = Utils.matchEmpCompItems(structure_tipo_ingreso);
                    log.debug('items_promo_tipo_ingreso',items_promo_tipo_ingreso);
                    log.debug('items_promo_tipo_ingreso keys',Object.keys(items_promo_tipo_ingreso));
                    log.debug('items_promo_tipo_ingreso keys',Object.keys(items_promo_tipo_ingreso).length);
                    var infoODVPromo_historico_pre = Utils.searchSO(items_promo_tipo_ingreso,cust_period,false,true,true);
                    log.debug('infoODVPromo_historico_pre',infoODVPromo_historico_pre);
              }
              
            }
            var jsonFile2 = file.create({
                name : 'search_'+cust_period+'_'+cust_promo+'_'+cust_type+'.json',
                fileType : 'JSON',
                contents : JSON.stringify(infoODVPromo_historico_pre),
                folder: folder
            });
          
            intFileId2 = jsonFile2.save();
    	}catch(err){
    		log.error("error schedule",err);
    	}
    	
    }

    return {
        execute: execute
    };
    
});
