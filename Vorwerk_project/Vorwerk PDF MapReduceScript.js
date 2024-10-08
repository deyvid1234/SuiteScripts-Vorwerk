/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email','N/record','N/render', 'N/file','N/search', 'N/https', 'N/runtime','N/format','./Vorwerk Dictionary Script.js','./Vorwerk Send Reporte Suitelet.js'],

function(email,record,render, file, search, https, runtime,format,Dictionary,EmailLib) {
    var config_fields = Dictionary.getDictionayFields();
   
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
        var scriptObj = runtime.getCurrentScript();
        var comissionInfo = scriptObj.getParameter({name: 'custscript_register_info_pdf'});
        return JSON.parse(comissionInfo);
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
            var type_rec= parseInt(registeInfo.level,10);
            var idReg= parseInt(registeInfo.idReg,10);
            var period = parseInt(registeInfo.comision_id,10);
            var periodText = registeInfo.periodText;
            var levelText = registeInfo.levelText;
            var folder;
            if(runtime.envType != 'PRODUCTION'){ 
                folder = 377148
            }else{
                folder = 377148
            }
            //log.debug('text',periodText+'  '+levelText)
            //log.debug('info','type_rec :'+type_rec+' idReg :'+idReg+' period :'+period)
            var idemp = search.lookupFields({
                type: config_fields.customrecord[type_rec],
                id: idReg,
                columns: [config_fields.empleado[type_rec]]
            });
            var employee = search.lookupFields({
                type: 'employee',
                id: idemp[config_fields.empleado[type_rec]][0]['value'],
                columns: ['firstName','lastName']
            });
            var print_url_base = '';
            if(runtime.envType != 'PRODUCTION'){ 
                print_url_base = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1408&deploy=1&compid=3367613&h=d48ce6f5d7c69a79c66c';
            }else{
                print_url_base = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1408&deploy=1&compid=3367613&h=d48ce6f5d7c69a79c66c';
            }
            var url = print_url_base+'&employee='+idemp[config_fields.empleado[type_rec]][0]['value']+'&periodo='+period+'&comp='+idReg+'&level='+type_rec+'&massive=true-pdf';
            log.debug('url',url)
            var headers = {'Content-Type': 'application/json'};
            var response = https.get({
                url: url,
                headers: headers
            }).body;
            var name = idemp[config_fields.empleado[type_rec]][0]['text']
            var folderName = levelText+' '+periodText
            var fileid = ''
            var searchType = 'folder';
            var searchColumns = [];
            var searchFilters = [];
            searchColumns.push(search.createColumn({ name: 'name' }));
            searchColumns.push(search.createColumn({ name: 'internalid' }));
            searchFilters.push(['name', 'is', folderName ]);
            searchFilters.push('and');
            searchFilters.push(['parent', 'anyof', folder]);

            var result = search.create({
                type: searchType,
                columns: searchColumns,
                filters: searchFilters
            }).run().getRange(0, 1);

            if (result.length == 0) {
                var objRecord = record.create({
                    type: record.Type.FOLDER,
                    isDynamic: true
                });

                objRecord.setValue({
                    fieldId: 'name',
                    value: folderName
                });
                objRecord.setValue({
                    fieldId: 'parent',
                    value: folder
                });
                
                var folderId = objRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }else {
            var folderId = result[0].getValue('internalid');
            }
            var my_file = file.create({
                name: name+'.pdf',
                fileType: file.Type.PDF,
                contents: response,
                folder: folderId
            });
            fileid = my_file.save();
            log.debug('my_file',my_file)
        }catch(err){
            log.error("Error map",err);
        }
        
        
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
        log.debug('context summary',summary);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
