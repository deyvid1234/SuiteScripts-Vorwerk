/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/https','N/url','N/record','N/runtime','N/currentRecord','N/ui/message','N/log', 'N/search','N/ui/dialog', 'N/format', 'N/ui/dialog','N/redirect'],

function(https, url,record,runtime,currentRecord,message,log,search,dialog,format, dialog,redirect) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
        try{
            if (scriptContext.type == 'create' || true) {
                recSubsidiary = scriptContext.newRecord.getValue({
                    fieldId: 'subsidiary'
                });
                var recNew = scriptContext.newRecord,
                    recOld = scriptContext.oldRecord,
                    userObj = runtime.getCurrentUser();
                var id_sales_order = recNew.getValue({
                    fieldId: 'custrecord_id_sales_order'
                });
                if(id_sales_order)
                {
                    /*var Base64          = new MainBase64();
                    var host            = 'https://3367613-sb1.app.netsuite.com/';
                    var data = new Object();
                    data.recordType = 'salesorder';
                    data.recordId   = [1591260];
                    data.host       = host;
                    data            = JSON.stringify(data);
                    data            = Base64.encode(data);
                    //var urls             = nlapiResolveURL("SUITELET", "customscriptguias_envio_pdf_masivo", "customdeployguias_envio_pdf_masivo", false);
                    //urls            += "&data="     + data;
                    var urls = url.resolveRecord({
                        recordType: 'SUITELET',
                        recordId: 'customscriptguias_envio_pdf_masivo' ,
                        isEditMode: false
                      });
                    urls            += "&data="     + data;
                    window.open('https://www.google.com/')
                    */


                    log.debug('pre prueba',prueba)
                    var prueba = redirect.toSuitelet({
                        scriptId: 'customscriptcreate_pdf_guia_envio' ,
                        deploymentId: 'customdeploycreate_pdf_guia_envio',
                        parameters: {
                            'recordId':'1273'
                        }
                    });
                    log.debug('prueba',prueba)
                }
            }
            
        }catch(e){
            log.debug('Error afterSubmit',e)
        }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        
        
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
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
