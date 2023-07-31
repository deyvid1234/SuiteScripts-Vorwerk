/**
 * @NApiVersion     2.0
 * @NScriptType     ClientScript
 * @ScriptName      VOR | CS | Customer Script
 * @NModuleScope    Public
 * @Company         Netsoft
 * @Author          Oscar Ortega
 * @Description     Script that put all the functions into the Suitelet.
 * @Date            01/12/2021
 * ScriptFile:      NSO_vor_cs_screenScript.js
 * Dependencies:    'N/runtime', 'N/email', 'N/config'
 * idScript:        customscript_nso_vor_cs_customer
 * idDeploy:        customdeploy_nso_vor_cs_customer
 */

 define(['N/runtime', 'N/currentRecord', 'N/ui/message', 'N/search', 'N/url', 'N/https', 'N/format', 'N/ui/dialog'], 
 function(runtime, currentRecord, message, search, url, https, format, dialog) {
 
    function pageInit( context ) {
        debugger;
    }
 
    function fieldChanged( context ) {
         
        var interface = currentRecord.get();
        var fieldName = context.fieldId;
 
        if ( fieldName == 'email' || fieldName == 'giveaccess' ) {
 
            var access = interface.getValue({ fieldId: 'giveaccess' });

            if( access ) {

                interface.setValue({ fieldId: 'fillpassword', value: true        });
                interface.setValue({ fieldId: 'password',     value: '123456789' });
                interface.setValue({ fieldId: 'password2',    value: '123456789' });

            }   
        }
    }
 
     return {
         pageInit            : pageInit,
         fieldChanged        : fieldChanged
     }
 });
 
 
 