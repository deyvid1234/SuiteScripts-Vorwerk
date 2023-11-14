/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/https','N/format','N/url','N/email'],

function(record, search,https,format,url,email) {
   
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
    	//extrae informacion de las odv
        var busquedaDuplicados = search.load({
            id: 'customsearch2085' 
        });
        var mySearchFilter = search.createFilter({
    name: 'entity',
    summary: search.Summary.GROUP
});


    	return busquedaDuplicados;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		var info = JSON.parse(context.value);
            log.debug('info',info)

           
            var type = info.recordType
            var email = info.values.email
            var id = info.id
            var presentadoraReferio = info.values.custentity_presentadora_referido
            var idTransacciones = info.values["tranid.transaction"]
            var typeTransacciones = info.values["type.transaction"].text
            var fechaTransaccion = info.values["trandate.transaction"]
            var fechaCreacion = info.values["datecreated.transaction"]
            var statusTransaccion = info.values["statusref.transaction"].text
            log.debug('typeTransacciones',typeTransacciones)
            log.debug('fechaTransaccion',fechaTransaccion)
            log.debug('fechaCreacion',fechaCreacion)
            log.debug('statusTransaccion',statusTransaccion)


            /*log.debug('recordType',type)
            log.debug('email',email)
            log.debug('id',id)
            log.debug('preentadora referido',presentadoraReferio)
            log.debug('tranid',idTransacciones)*/
            var eliminados= []

            if (idTransacciones!= "" || presentadoraReferio != ""){

                //log.debug("Mantener", id)
                //log.debug('id',id)
                //log.debug('preentadora referido',presentadoraReferio)
                //log.debug('tranid',idTransacciones)

            } else{
                //log.debug("Inactivar")
                eliminados.push({
                    deleteType: type,
                    deleteEmail: email,
                    deleteId: id
                });
                //log.debug('eliminados',eliminados)

                context.write(id, eliminados);
                
            }
            
            return eliminados;
            //1. Extraerr correctamente los datos 
            //2. Hacer un if - Si tiene tranid o tiene presentadora referido - imprimir 'mantener'
            // sino imprimir 'inactivar'
            

    	}catch(err){
    		log.error("err set",err);
    	}
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        context.write(context.key, context.values);
        return true;
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        var procesados = [];
        summary.output.iterator().each(function (key, saved) {
            procesados.push(JSON.parse(saved));
            return true;
        });
      log.debug('Registros Procesados', procesados);
    	
    }
    
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
