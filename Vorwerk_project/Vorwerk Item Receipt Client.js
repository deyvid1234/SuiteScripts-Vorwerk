/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/currentRecord', 'N/url', 'N/ui/dialog','N/format', 'N/runtime'],

 function (currentRecord, url, dialog, format,runtime) {
            // Usuario ejecutando
             var userObj = runtime.getCurrentUser();
             var userId = parseInt(userObj.id);
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

         try {
             var thisRecord = scriptContext.currentRecord;
             

             var fieldID = scriptContext.fieldId;
             var fieldValue = thisRecord.getValue(fieldID);
             var date = new Date();             
             var today = format.parse({
                value: date,
                type: format.Type.DATE
            });
             switch (fieldID) {
                 case 'custbody_numero_serie':
                     if (fieldValue) {
                         var valoresAceptados = /^[0-9]+$/;
                         if (!fieldValue.match(valoresAceptados)) {
                             dialog.alert({
                                 title: "Error",
                                 message: "No es numérico"
                             });
                             thisRecord.setValue('custbody_numero_serie', '');
                         }
                     }
                     break;
                 case 'custbody_notifcacion1':
                     if (fieldValue){
                         thisRecord.setValue('custbody_fch_notif1',today );
                     } else{
                        thisRecord.setValue('custbody_fch_notif1','');
                     }

                     break;
                 case 'custbody_notifcacion2':
                     if (fieldValue){
                         thisRecord.setValue('custbody_fch_notif2',today );
                     }else{
                        thisRecord.setValue('custbody_fch_notif1','');
                     }
                     break;
                 case 'custbody_notifcacion3':
                     if (fieldValue){
                         thisRecord.setValue('custbody77',today );
                     }else{
                        thisRecord.setValue('custbody_fch_notif1','');
                     }
                     break;
                 case 'custbody_rev':
                     if (fieldValue){
                         thisRecord.setValue('custbody_fcha_rev',today );
                         thisRecord.setValue('custbody_revisado_por',userObj.name );
                     }else{
                        thisRecord.setValue('custbody_fcha_rev','' );
                        thisRecord.setValue('custbody_revisado_por','' );
                     }
                    break;
                case 'custbody39':
                     if (fieldValue){
                        thisRecord.setValue('custbody41',today );
                        thisRecord.setValue('custbody40',false );
                     }
                    break;
                case 'custbody40':
                     if (fieldValue){
                        thisRecord.setValue('custbody41',today );
                        thisRecord.setValue('custbody39',false );
                     }
                    break;
                case 'custbody_repar':
                     if (fieldValue){
                         thisRecord.setValue('custbody_fcha_reparacion',today );
                     }else{
                        thisRecord.setValue('custbody_fcha_reparacion','' );
                     }
                    break;
                case 'custbody_entrega':
                     if (fieldValue){
                         thisRecord.setValue('custbody_entr',today );
                         thisRecord.setValue('custbody_entre',userObj.name );
                     }else{
                        thisRecord.setValue('custbody_entr','' );
                        thisRecord.setValue('custbody_entre','' );
                     }
                    break;
                 default:
                     break;
             }




             return true;
         } catch (err) {
             log.error("error fieldchanged", err);
         }

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

     function printReceipt(idReceipt) {
         try {

             var thisRecord = currentRecord.get();
             var id = thisRecord.id;

             var sLet = url.resolveScript({
                 scriptId: 'customscript_vorwerk_item_receipt_suit',
                 deploymentId: 'customdeploy_item_receipt_deploy'
             });
             console.log(thisRecord);
             window.open(sLet + "&oppID=" + id + '&emailSend=false', '_blank');
         } catch (err) {
             log.error("error printReceipt", err)
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
         //        validateDelete: validateDelete,
         saveRecord: saveRecord,
         printOppo: printOppo
     };

 });
