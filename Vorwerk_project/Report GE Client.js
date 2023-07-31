/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https','N/url','N/record','N/runtime','N/currentRecord','N/ui/message','N/log', 'N/search'],

function(https, url,record,runtime,currentRecord,message,log,searc) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	return true;
    }
    
    function createExcel(){
    	try{
    		var object_fill= getData();
    		log.debug('object_fill',object_fill);
        	var url = '';
            if(runtime.envType != 'PRODUCTION'){ 
                url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1226&deploy=1';
            }else{
                url = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1226&deploy=1';
            }
            log.debug('url',url);
            var head_document = ['Pedido GE',
                                 'Fecha de compra de la GE',
                                 'Número de serie',
                                 'Pedido de TM',
                            	 'Fecha de ejecución de TM',
                                 'Cliente',
                                 'Item']
            var headers = {'Content-Type': 'application/json'};
            var response = https.post({
                url: url,
                body : JSON.stringify({data:object_fill,head:head_document}),
                headers: {
                    "Content-Type": "application/json"
                }
            }).body;
            log.debug('response',response);
            var rep = JSON.parse(response);
            log.debug('response',response);
            log.debug("response",rep.id);
            var url = "https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1"
            var idFile = rep.id;
            
            if(!!idFile){
                
                window.open(url+'&idfile='+idFile);
            }
    	}catch(err){
    		log.error("Error create exel",err)
    	}
    }
    
    function getData(){
        try{
            //extrae la informacion de la tabla
            var object_fill = [];
            var record = currentRecord.get();
            var listLineCount = record.getLineCount({
              sublistId: "sublist"
            });
            
            
            for (var i = 0; i < listLineCount; i++) {
                var date_buy_ge = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "date_buy_ge",
                     line: i
                });
                var serial_number = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "serial_number",
                     line: i
                });
                var date_ececution = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "date_ececution",
                     line: i
                });
                var customer = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "customer",
                     line: i
                });
                var order_ge = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "order_ge",
                     line: i
                });
                var order_tm = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "order_tm",
                     line: i
                });
                var item = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "item",
                     line: i
                });
                
                object_fill.push({
                    order_ge        : order_ge,
                    date_buy_ge     : date_buy_ge,
                    serial_number   : serial_number,
                    order_tm        : order_tm,
                    date_ececution  : date_ececution,
                    customer        : customer,
                    item            : item

                });
                    
                
                
           }
            
            return object_fill;
        }catch(err){
            log.error("Error getSelectedData",err)
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord,
        createExcel:createExcel
    };
    
});
