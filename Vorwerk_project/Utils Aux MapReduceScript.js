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
        var emailstotal = search.load({
            id: 'customsearch2085' 
        });

        var emailsFiltrados = {}
        var emailsFiltradosDuplicados = {}

        var pagedResults = emailstotal.runPaged();
        pagedResults.pageRanges.forEach(function (pageRange){
        var currentPage = pagedResults.fetch({index: pageRange.index});
            currentPage.data.forEach(function (r) {
                var values = r.getAllValues();
                var email = r.getValue('email').toLowerCase();
                var internalid = parseInt(r.getValue('internalid'),10) 
                
                const idMaximoActual = emailsFiltrados[email] || 0;
                

                if (internalid > idMaximoActual) {
                    emailsFiltrados[email] = internalid;
                }

                if(idMaximoActual != 0){
                    emailsFiltradosDuplicados[email] = emailsFiltrados[email]
                }
                
                return true; 
            });

        });

        log.debug('emailsFiltradosDuplicados',emailsFiltradosDuplicados)
        log.debug('emailsFiltrados',emailsFiltrados)
        var keys = Object.keys(emailsFiltradosDuplicados)
        //console.log('keys',keys)


        var emailsTransactions = search.load({
            id: 'customsearch2086' 
        });

        

        var aEliminar = {}
        var pagedResults = emailsTransactions.runPaged();
        pagedResults.pageRanges.forEach(function (pageRange){
        var currentPage = pagedResults.fetch({index: pageRange.index});
            currentPage.data.forEach(function (r) {
                var values = r.getAllValues();
                //log.debug('values',values)
                var internalid = parseInt(r.getValue('internalid'),10) 
                var email = r.getValue('email').toLowerCase();
                //log.debug('emailsFiltradosDuplicados[email]',emailsFiltradosDuplicados[email])
                //log.debug('keys.hasOwnProperty(email)',keys.indexOf(email))
                if(internalid != emailsFiltradosDuplicados[email] &&  keys.indexOf(email) >= 0 ){
                    aEliminar[internalid] = email
                }
                return true; 
            });

        });
         var emailsTransactionsPost2022 = search.load({
            id: 'customsearch2082' 
        });
         var aInactivar = {}
        var pagedResults = emailsTransactions.runPaged();
        pagedResults.pageRanges.forEach(function (pageRange){
        var currentPage = pagedResults.fetch({index: pageRange.index});
            currentPage.data.forEach(function (r) {
                var valuesT = r.getAllValues();
                log.debug('keys',keys)
                var internalidT = parseInt(r.getValue('internalid'),10) 
                var emailT = r.getValue('email').toLowerCase();

        if (keys.indexOf(internalidT)) {
           log.debug("mantener", internalidT) 

            } else {
                 aInactivar[internalidT] = internalidT
            }
            log.debug("aInactivar", aInactivar)
             return true; 
            });

        });
        log.debug('aEliminar',aEliminar)
        email.send({
            author: '344096',
            recipients: 'deyvid8uriel@gmail.com',
            cc: ['deyvid8uriel@gmail.com'/*,'pilar.torres@thermomix.mx'*/],
            subject: 'Customers Duplicados Inactivados',
            body: JSON.stringify(aEliminar)
        }); 
    	return Object.keys(aEliminar);
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
            log.debug('context',context)

            /*record.submitFields({ type: 'customer', id: info,
                values: { isinactive: 'T' }
            });*/
            //context.write(info, eliminados);
           /*
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
            log.debug('tranid',idTransacciones)
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

                
                
            }
            
            return eliminados;
            //1. Extraerr correctamente los datos 
            //2. Hacer un if - Si tiene tranid o tiene presentadora referido - imprimir 'mantener'
            // sino imprimir 'inactivar'
            
*/
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
