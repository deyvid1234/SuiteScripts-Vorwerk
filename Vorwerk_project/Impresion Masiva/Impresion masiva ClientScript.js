/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https','N/url','N/record','N/runtime','N/currentRecord','N/ui/message','N/log', 'N/search','N/ui/dialog', 'N/format', 'N/ui/dialog'],

function(https, url,record,runtime,currentRecord,message,log,search,dialog,format, dialog) {
    
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
    function completado(onlycheck){
        try{
            var thisrecord = currentRecord.get();
            var listLineCount = thisrecord.getLineCount({
              sublistId: "result"
            });
            
            for (var i = 0; i < listLineCount; i++) {
                var select_field = thisrecord.getSublistValue({
                    sublistId: "result",
                    fieldId: "select_field",
                    line: i
               });
                if(!onlycheck || select_field == true){
                    var internalid = thisrecord.getSublistValue({
                        sublistId: "result",
                        fieldId: "internalid",
                        line: i
                   });
                   
                   var guia_envio_pdf = thisrecord.getSublistValue({
                       sublistId: "result",
                       fieldId: "guia_envio_pdf",
                       line: i
                  });
                   var id_so = thisrecord.getSublistValue({
                       sublistId: "result",
                       fieldId: "id_so",
                       line: i
                  });
                   var estatus_envio = thisrecord.getSublistValue({
                       sublistId: "result",
                       fieldId: "estatus_envio",
                       line: i
                  });
                  log.debug('internalid',internalid)
                  var resultado = record.submitFields({
                     type: 'customrecord_guia_envio',
                     id: internalid,
                     values: {custrecord_off_imp: true}
                   }); 
                  log.debug('resultado',resultado)
                  
                } 
            }
            dialog.alert({
                title: 'Éxito',
                message: 'Almacenamiento de registros en realizado'
            });
           
            
        }catch(e){
            log.debug('Error imp_guias',e)
        }
    }

    function imp(onlycheck){
        try{
            var record = currentRecord.get();
            var listLineCount = record.getLineCount({
              sublistId: "result"
            });
            
            var Base64          = new MainBase64();
            var host            = 'https://3367613.app.netsuite.com/';    
            var guiasURL = []
            var idSalesorder = []
            for (var i = 0; i < listLineCount; i++) {
                var select_field = record.getSublistValue({
                    sublistId: "result",
                    fieldId: "select_field",
                    line: i
               });
                if(!onlycheck || select_field == true){
                    var internalid = record.getSublistValue({
                        sublistId: "result",
                        fieldId: "internalid",
                        line: i
                   });
                   
                   var guia_envio_pdf = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "guia_envio_pdf",
                       line: i
                  });
                   var id_so = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "id_so",
                       line: i
                  });
                   var estatus_envio = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "estatus_envio",
                       line: i
                  });
                   
                  //window.open(guia_envio_pdf)

                  guiasURL.push(guia_envio_pdf)
                  idSalesorder.push(id_so)
                } 
            }

            //PDF SO
            var data = new Object();
            data.recordType = 'salesorder';
            data.recordId   = idSalesorder;
            data.host       = host;
            data            = JSON.stringify(data);
            data            = Base64.encode(data);
            var url             = nlapiResolveURL("SUITELET", "customscript_sales_order_pdf_masivo", "customdeploysales_order_pdf_masivo", false);
            url             += "&data="     + data;
            window.open(url)

            //PDF GUIAS

            var data = new Object();
            data.recordType = 'salesorder';
            data.recordId   = guiasURL;
            data.host       = host;
            data            = JSON.stringify(data);
            data            = Base64.encode(data);
            var url             = nlapiResolveURL("SUITELET", "customscriptguias_envio_pdf_masivo", "customdeployguias_envio_pdf_masivo", false);
            url             += "&data="     + data;
            window.open(url)
            
        }catch(e){
            log.debug('Error imp_guias',e)
        }
    }


    function xmltoPDF_pdfSet(guiasURL, response){

      var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
      xml += "<pdfset>";
      
      // PDF Page 1
      xml += "<pdf>";
      xml += "<body>";
      xml += " This is Page 1";
      xml += "</body>";
      xml += "</pdf>";
      
      // PDF Page 2
      xml += "<pdf>";
      xml += "<body>";
      xml += "This is Page 2";
      xml += "</body>";
      xml += "</pdf>";

      // PDF Page 3 (PDF from File cabinet)
      // --Get the URL of the PDF file 
      // --Escape characters for XML  
      var pdf_fileURL = nlapiEscapeXML('https://www.thinkme.mx/envios/couriers/tookan/guias/1676427.pdf'); 

      xml += "<pdf src='"+ pdf_fileURL +"'/>";
      xml += "</pdfset>";

      var filePDF = nlapiXMLToPDF(xml);
      response.setContentType('PDF', 'pdfset.pdf', 'inline');
      response.write(filePDF.getValue());

     }




    function MainBase64()
{
    var Base64 = new Object();
        Base64 =
        {
            _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            encode  : function (input) 
            {
                var output  = "";
                var chr1    = "";
                var chr2    = "";
                var chr3    = "";
                var enc1    = "";
                var enc2    = "";
                var enc3    = "";
                var enc4    = "";
                var i       = 0;
                input       = Base64._utf8_encode(input);
                while (i < input.length) 
                {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;
                    if (isNaN(chr2)) 
                    {
                        enc3 = enc4 = 64;
                    }
                    else if (isNaN(chr3)) 
                    {
                        enc4 = 64;
                    }
                    output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
                }
                return output;
            },
            decode  : function (input) 
            {
                var output  = "";
                var chr1    = "";
                var chr2    = "";
                var chr3    = "";
                var enc1    = "";
                var enc2    = "";
                var enc3    = "";
                var enc4    = "";
                var i       = 0;
                input       = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                while (i < input.length) 
                {
                    enc1    = this._keyStr.indexOf(input.charAt(i++));
                    enc2    = this._keyStr.indexOf(input.charAt(i++));
                    enc3    = this._keyStr.indexOf(input.charAt(i++));
                    enc4    = this._keyStr.indexOf(input.charAt(i++));
                    chr1    = (enc1 << 2) | (enc2 >> 4);
                    chr2    = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3    = ((enc3 & 3) << 6) | enc4;
                    output  = output + String.fromCharCode(chr1);
                    if (enc3 != 64) 
                    {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) 
                    {
                        output = output + String.fromCharCode(chr3);
                    }
                }
                output = Base64._utf8_decode(output);
                return output;
            },
            _utf8_encode : function (string) 
            {
                string      = string.replace(/\r\n/g,"\n");
                var utftext = "";
                for (var n = 0; n < string.length; n++) 
                {
                    var c = string.charCodeAt(n);
                    if (c < 128) 
                    {
                        utftext += String.fromCharCode(c);
                    }
                    else if((c > 127) && (c < 2048))
                    {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else 
                    {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }
                return utftext;
            },
            _utf8_decode : function (utftext) 
            {
                var string  = "";
                var i       = 0;
                var c       = 0;
                var c2      = 0;
                while ( i < utftext.length ) 
                {
                    c = utftext.charCodeAt(i);
                    if (c < 128) 
                    {
                        string += String.fromCharCode(c);
                        i++;
                    }
                    else if((c > 191) && (c < 224)) 
                    {
                        c2       = utftext.charCodeAt(i+1);
                        string  += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i       += 2;
                    }
                    else 
                    {
                        c2       = utftext.charCodeAt(i+1);
                        c3       = utftext.charCodeAt(i+2);
                        string  += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i       += 3;
                    }
                }
                return string;
            }
        };
    return Base64;
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
                    var internalid = record.getSublistValue({
                        sublistId: "result",
                        fieldId: "internalid",
                        line: i
                   });
                   
                   var guia_envio_pdf = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "guia_envio_pdf",
                       line: i
                  });
                   var id_so = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "id_so",
                       line: i
                  });
                   var estatus_envio = record.getSublistValue({
                       sublistId: "result",
                       fieldId: "estatus_envio",
                       line: i
                  });
                   
                   
                   object_fill.push({
                     internalid     :   internalid,
                     guia_envio_pdf :   guia_envio_pdf,
                     id_so          :   id_so,
                     estatus_envio  :   estatus_envio
                   });
                }
           }
            return object_fill;
        }catch(err){
            log.error("Error getSelectedData",err)
        }
    }

    return {
        //pageInit: pageInit,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        saveRecord: saveRecord,
        imp:imp,
        getData:getData,
        xmltoPDF_pdfSet : xmltoPDF_pdfSet,
        completado:completado
    };
    
});
