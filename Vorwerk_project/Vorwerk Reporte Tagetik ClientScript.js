/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https','N/url','N/record','N/runtime','N/currentRecord','N/ui/message','N/log', 'N/search','N/ui/dialog'],

function(https, url,record,runtime,currentRecord,message,log,search,dialog) {
    
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
    function saveData(){
        try{
        	dialog.alert({
                title: 'Éxito',
                message: 'Almacenamiento de registros en proceso'
            });
            var objet_full = getData(true);//extrae la informacion de la tabla
            var url = ""
            if(runtime.envType != 'PRODUCTION'){ 
                url ='https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1';
            }else{
                url ='https://3367613.app.netsuite.com';
            };
            //envia la información por metodo put a Vorwerk Reporte EA Map 
            var headers = {"Content-Type": "application/json"};
            var obj = objet_full;
            var res = https.put({
                url: url,
                headers: headers,
                body: JSON.stringify(obj)
            }).body;
        }catch(err){
            console.log(err);
            log.error("err client",err);
        }
    }
    function createExcel(typeFile){
    	try{
    		var object_fill= getData(false);
          log.debug('object_fill',object_fill)
        	var url = '';
            if(runtime.envType != 'PRODUCTION'){ 
                url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1238&deploy=1';
            }else{
                url = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1238&deploy=1';
            }
            var head_document = [
                                 'SOURCE',
                                 'COUNTRY',
                                 'BOOKING_PERIOD',
                                 'REFERENCE_DATE',
                                 'PRODUCT',
                                 'CHANNEL',

                                 'AREA_NAME',
                                 'AREA_LAND',
                                 'AREA_PLZ',
                                 'AREA_LOCATION',
                                 'BRANCH_NAME',
                                 'BRANCH_LAND',
                                 'BRANCH_PLZ',
                                 'BRANCH_LOCATION',
                                 'TEAM_NAME',
                                 'TEAM_LAND',
                                 'TEAM_PLZ',
                                 'TEAM_LOCATION',

                                 'DIVISION',
                                 'out_UNITS_ORDER_ENTRY',
                                 'out_UNITS_INVOICED_NET',
                                 'out_UNITS_INVOICED_CANC',
                                 'out_NETSALES_MAIN_ORDERS',
                                 'out_NETSALES_OTHER_ORDERS',
                                 ]
            var headers = {'Content-Type': 'application/json'};

           
            var response = https.post({
                url: url,
                body : JSON.stringify({data:object_fill,head:head_document,type:typeFile}),
                headers: {
                    "Content-Type": "application/json"
                }
            }).body;
           
            var rep = JSON.parse(response);
            if(runtime.envType != 'PRODUCTION'){ 
            	var url = "https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1"
            }else{
            	var url = "https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1"
            }
            var idFile = rep.id;
            
            if(!!idFile){
                
                window.open(url+'&idfile='+idFile);
            }
    	}catch(err){
    		log.error("Error create exel",err)
    	}
    }
    
    function getData(onlycheck){
        try{
            //extrae la informacion de la tabla
            var object_fill = [];
            var record = currentRecord.get();
            var listLineCount = record.getLineCount({
              sublistId: "result"
            });
            
            
            for (var i = 0; i < listLineCount; i++) {
            	var select_field = record.getSublistValue({
                    sublistId: "result",
                    fieldId: "select_field",
                    line: i
               });
            	if(!onlycheck || select_field == true){
            		/*var internalid = record.getSublistValue({
                        sublistId: "result",
                        fieldId: "internalid",
                        line: i
                   });*/
                   var source = 'CSV'
                   var custpage_country = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_country",
                       line: i
                  });
                   var custpage_booking_period = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_booking_period",
                       line: i
                  });
                   var custpage_reference_date = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_reference_date",
                       line: i
                  });
                   var custpage_product = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_product",
                       line: i
                  });
                   var custpage_chanel = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_chanel",
                       line: i
                  });
                   var custpage_division = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_division",
                       line: i
                  });
                   var custpage_out_uoe = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_out_uoe",
                       line: i
                  });
                   var custpage_out_uin = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_out_uin",
                       line: i
                  });
                    var custpage_mont_canc = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_mont_canc",
                       line: i
                  });
                   var custpage_out_nmo = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_out_nmo",
                       line: i
                  });
                   var custpage_out_noo = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "custpage_out_noo",
                       line: i
                  });
                  
                  
                   
                   object_fill.push({

                   	source			:	source,
                   	custpage_country		:	custpage_country,
    	        	custpage_booking_period               : custpage_booking_period,
                    custpage_reference_date               : custpage_reference_date,
                    custpage_product               : custpage_product,
                    custpage_chanel               : custpage_chanel,

                    AREA_NAME : '',
                    AREA_LAND : '',
                    AREA_PLZ : '',
                    AREA_LOCATION : '',
                    BRANCH_NAME : '',
                    BRANCH_LAND : '',
                    BRANCH_PLZ : '',
                    BRANCH_LOCATION : '',
                    TEAM_NAME : '',
                    TEAM_LAND :'',
                    TEAM_PLZ : '',
                    TEAM_LOCATION : '',

                    custpage_division               : custpage_division,
                    custpage_out_uoe               : custpage_out_uoe,
                    custpage_out_uin               : custpage_out_uin,
                    custpage_mont_canc             :custpage_mont_canc,
                    custpage_out_nmo               : custpage_out_nmo,
                    custpage_out_noo               : custpage_out_noo,
                   });
                }
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
        createExcel:createExcel,
        saveData:saveData
    };
    
});
