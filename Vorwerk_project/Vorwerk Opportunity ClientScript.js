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
             
             // Variable para guardar los valores anteriores de custcol_aplica_descuento por línea
             var valoresAnteriores = {};
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
         try {
             var thisRecord = scriptContext.currentRecord;
             actualizarEdicionCampoDescuento(thisRecord);
             
             // Deshabilitar visualmente el campo si el tipo de garantía no es 4
             setTimeout(function() {
                 deshabilitarCampoVisualmente();
             }, 500);
         } catch (err) {
             console.error('Error pageInit', err);
         }
     }
     
     /**
      * Deshabilita visualmente el campo custcol_aplica_descuento usando CSS
      */
     function deshabilitarCampoVisualmente() {
         try {
             var fieldId = 'custcol_aplica_descuento';
             actualizarEstadoVisualCampo(false);
         } catch (err) {
             console.log('Error deshabilitarCampoVisualmente: ' + err.message);
         }
     }
     
     /**
      * Actualiza el estado visual del campo (habilitado/deshabilitado)
      * @param {boolean} esEditable - true si el campo debe ser editable, false si debe estar deshabilitado
      */
     function actualizarEstadoVisualCampo(esEditable) {
         try {
             var fieldId = 'custcol_aplica_descuento';
             
             // Buscar todos los checkboxes que puedan ser el campo
             var checkboxes = document.querySelectorAll('input[type="checkbox"]');
             
             for (var i = 0; i < checkboxes.length; i++) {
                 var checkbox = checkboxes[i];
                 var id = checkbox.id || '';
                 var name = checkbox.name || '';
                 var className = checkbox.className || '';
                 var parent = checkbox.parentElement;
                 var parentText = parent ? parent.textContent || '' : '';
                 
                 // Verificar si este checkbox es el campo que buscamos
                 // Buscar por ID, name, o por el texto del label asociado
                 if (id.indexOf(fieldId) !== -1 || name.indexOf(fieldId) !== -1 || 
                     className.indexOf(fieldId) !== -1 || parentText.indexOf('Aplica descuento') !== -1) {
                     
                     if (esEditable) {
                         // Habilitar el campo
                         checkbox.disabled = false;
                         checkbox.style.pointerEvents = 'auto';
                         checkbox.style.opacity = '1';
                         checkbox.style.cursor = 'pointer';
                         checkbox.removeAttribute('readonly');
                     } else {
                         // Deshabilitar el campo
                         checkbox.disabled = true;
                         checkbox.style.pointerEvents = 'none';
                         checkbox.style.opacity = '0.5';
                         checkbox.style.cursor = 'not-allowed';
                         checkbox.setAttribute('readonly', 'readonly');
                         
                         // Prevenir eventos de click
                         checkbox.addEventListener('click', function(e) {
                             e.preventDefault();
                             e.stopPropagation();
                             return false;
                         }, true);
                     }
                 }
             }
         } catch (err) {
             console.log('Error actualizarEstadoVisualCampo: ' + err.message);
         }
     }

     /**
      * Actualiza el estado de edición del campo custcol_aplica_descuento según el tipo de garantía
      * @param {Record} thisRecord - Record actual
      */
     function actualizarEdicionCampoDescuento(thisRecord) {
         try {
             var tipoGarantia = thisRecord.getValue({
                 fieldId: 'custbody_aplicacion_garantia'
             });

             // Si el tipo de garantía es 4 (Garantía parcial), permitir edición
             // De lo contrario, hacer el campo de solo lectura
             var esEditable = (tipoGarantia === '4' || tipoGarantia === 4);

             console.log('Actualizando estado de edición. Tipo garantía: ' + tipoGarantia + ', Es editable: ' + esEditable);

             // Nota: En NetSuite Client Scripts, no podemos deshabilitar campos de sublista visualmente
             // La validación se realizará en validateField para prevenir cambios no permitidos
         } catch (err) {
             console.error('Error actualizarEdicionCampoDescuento', err);
         }
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
                case 'custbody_aplicacion_garantia':
                        // Cuando cambia el tipo de garantía, actualizar el estado de edición del campo custcol_aplica_descuento
                        log.debug('Actualizando estado de edición del campo custcol_aplica_descuento', 'Tipo de garantía: ' + fieldValue);
                     actualizarEdicionCampoDescuento(thisRecord);
                     
                     // Actualizar los valores guardados para todas las líneas
                     try {
                         var lineCount = thisRecord.getLineCount({
                             sublistId: 'item'
                         });
                         
                         for (var i = 0; i < lineCount; i++) {
                             thisRecord.selectLine({
                                 sublistId: 'item',
                                 line: i
                             });
                             
                             var valor = thisRecord.getCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_aplica_descuento'
                             });
                             
                             valoresAnteriores[i] = valor;
                         }
                     } catch (e) {
                         console.log('Error al actualizar valores guardados: ' + e.message);
                     }
                     
                     // Actualizar el estado visual del campo
                     setTimeout(function() {
                         var esEditable = (fieldValue === '4' || fieldValue === 4);
                         actualizarEstadoVisualCampo(esEditable);
                     }, 300);
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
         try {
             // Detectar cambios en la sublista item, específicamente en el campo custcol_aplica_descuento
             if (scriptContext.sublistId === 'item') {
                 var thisRecord = scriptContext.currentRecord;
                 var tipoGarantia = thisRecord.getValue({
                     fieldId: 'custbody_aplicacion_garantia'
                 });

                 // Si el tipo de garantía no es 4, revertir cualquier cambio en custcol_aplica_descuento
                 if (tipoGarantia !== '4' && tipoGarantia !== 4) {
                     // Obtener la línea actual
                     try {
                         var currentLine = thisRecord.getCurrentSublistIndex({
                             sublistId: 'item'
                         });
                         
                         if (currentLine >= 0) {
                             // Obtener el valor actual del campo
                             var valorActual = thisRecord.getCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_aplica_descuento'
                             });
                             
                             // Obtener el valor anterior guardado
                             var valorAnterior = valoresAnteriores[currentLine];
                             
                             console.log('sublistChanged - Línea: ' + currentLine + ', Valor actual: ' + valorActual + ', Valor anterior: ' + valorAnterior);
                             
                             // Si el valor cambió y tenemos un valor anterior guardado, revertirlo silenciosamente
                             if (valorAnterior !== undefined && valorActual !== valorAnterior) {
                                 console.log('sublistChanged - Revertiendo cambio no permitido silenciosamente');
                                 
                                 // Revertir el valor al anterior sin mostrar alerta
                                 thisRecord.setCurrentSublistValue({
                                     sublistId: 'item',
                                     fieldId: 'custcol_aplica_descuento',
                                     value: valorAnterior
                                 });
                                 
                                 console.log('sublistChanged - Valor revertido a: ' + valorAnterior);
                                 
                                 // Deshabilitar el campo visualmente
                                 setTimeout(function() {
                                     actualizarEstadoVisualCampo(false);
                                 }, 100);
                             }
                         }
                     } catch (e) {
                         // No hay línea seleccionada o error al obtener el valor
                         console.log('sublistChanged - Error: ' + e.message);
                     }
                 } else {
                     // Si el tipo de garantía es 4, actualizar el valor guardado para permitir cambios
                     try {
                         var currentLine = thisRecord.getCurrentSublistIndex({
                             sublistId: 'item'
                         });
                         
                         if (currentLine >= 0) {
                             var valorActual = thisRecord.getCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_aplica_descuento'
                             });
                             
                             valoresAnteriores[currentLine] = valorActual;
                             
                             // Habilitar el campo visualmente
                             setTimeout(function() {
                                 actualizarEstadoVisualCampo(true);
                             }, 100);
                         }
                     } catch (e) {
                         // Ignorar error
                     }
                 }
             }
         } catch (err) {
             console.error('Error sublistChanged', err);
         }
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
         try {
             // Cuando se inicializa una nueva línea, verificar el tipo de garantía
             // Guardar el valor actual del campo para poder revertirlo si es necesario
             if (scriptContext.sublistId === 'item') {
                 var thisRecord = scriptContext.currentRecord;
                 var tipoGarantia = thisRecord.getValue({
                     fieldId: 'custbody_aplicacion_garantia'
                 });

                 var esEditable = (tipoGarantia === '4' || tipoGarantia === 4);
                 
                 // Obtener el índice de la línea actual
                 try {
                     var currentLine = thisRecord.getCurrentSublistIndex({
                         sublistId: 'item'
                     });
                     
                     if (currentLine >= 0) {
                         // Guardar el valor actual del campo para esta línea
                         var valorActual = thisRecord.getCurrentSublistValue({
                             sublistId: 'item',
                             fieldId: 'custcol_aplica_descuento'
                         });
                         
                         valoresAnteriores[currentLine] = valorActual;
                         
                         console.log('lineInit: Línea ' + currentLine + ' - Valor guardado: ' + valorActual + ', Es editable: ' + esEditable);
                     }
                 } catch (e) {
                     console.log('lineInit - Error al obtener línea: ' + e.message);
                 }
             }
         } catch (err) {
             console.error('Error lineInit', err);
         }
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
         try {
             // Validar que el campo custcol_aplica_descuento no se pueda editar si el tipo de garantía no es 4
             if (scriptContext.sublistId === 'item' && scriptContext.fieldId === 'custcol_aplica_descuento') {
                 console.log('validateField ejecutado para custcol_aplica_descuento');
                 var thisRecord = scriptContext.currentRecord;
                 var tipoGarantia = thisRecord.getValue({
                     fieldId: 'custbody_aplicacion_garantia'
                 });

                 console.log('validateField - Tipo garantía: ' + tipoGarantia);

                 // Si el tipo de garantía no es 4, no permitir edición
                 if (tipoGarantia !== '4' && tipoGarantia !== 4) {
                     var lineNum = scriptContext.lineNum;
                     console.log('validateField - Preveniendo cambio. Línea: ' + lineNum);
                     
                     if (lineNum !== undefined) {
                         // Obtener el valor actual antes del cambio
                         var valorActual = thisRecord.getSublistValue({
                             sublistId: 'item',
                             fieldId: 'custcol_aplica_descuento',
                             line: lineNum
                         });
                         
                         console.log('validateField - Valor actual: ' + valorActual);
                         
                         // Obtener el nuevo valor que se intenta establecer
                         var nuevoValor = thisRecord.getCurrentSublistValue({
                             sublistId: 'item',
                             fieldId: 'custcol_aplica_descuento'
                         });
                         
                         console.log('validateField - Nuevo valor intentado: ' + nuevoValor);
                         
                         // Si el valor está cambiando, prevenir el cambio
                         if (valorActual !== nuevoValor) {
                             dialog.alert({
                                 title: "Campo no editable",
                                 message: "El campo 'Aplica descuento' no puede ser editado manualmente cuando el tipo de garantía no es 'Garantía parcial' (tipo 4). El valor se establecerá automáticamente al guardar según el tipo de garantía seleccionado."
                             });
                             
                             // Restaurar el valor anterior
                             thisRecord.setCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_aplica_descuento',
                                 value: valorActual
                             });
                             
                             console.log('validateField - Cambio prevenido y valor restaurado');
                             return false; // Prevenir el cambio
                         }
                     }
                 }
             }
             return true;
         } catch (err) {
             console.error('Error validateField', err);
             return true;
         }
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
         try {
             // Validar que el campo custcol_aplica_descuento no se pueda editar si el tipo de garantía no es 4
             if (scriptContext.sublistId === 'item') {
                 console.log('validateLine ejecutado para sublista item');
                 var thisRecord = scriptContext.currentRecord;
                 var tipoGarantia = thisRecord.getValue({
                     fieldId: 'custbody_aplicacion_garantia'
                 });

                 console.log('validateLine - Tipo garantía: ' + tipoGarantia);

                 // Si el tipo de garantía no es 4, verificar que no se haya modificado custcol_aplica_descuento
                 if (tipoGarantia !== '4' && tipoGarantia !== 4) {
                     var lineNum = scriptContext.lineNum;
                     console.log('validateLine - Línea: ' + lineNum);
                     
                     if (lineNum !== undefined) {
                         try {
                             // Obtener el valor actual del campo en la línea
                             var valorActual = thisRecord.getCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_aplica_descuento'
                             });
                             
                             console.log('validateLine - Valor actual del campo: ' + valorActual);
                             
                             // El valor correcto se establecerá en beforeSubmit del UserEvent
                             // Aquí solo validamos que el usuario no haya cambiado manualmente el valor
                             // Si el valor es diferente al esperado, mostramos advertencia pero permitimos
                             // porque beforeSubmit lo corregirá
                             
                             // Nota: No podemos prevenir completamente aquí porque no sabemos el valor anterior
                             // La validación principal está en validateField
                         } catch (e) {
                             console.log('validateLine - Error al obtener valor: ' + e.message);
                         }
                     }
                 }
             }
             return true;
         } catch (err) {
             console.error('Error validateLine', err);
             return true;
         }
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
        try {
            var thisRecord = scriptContext.currentRecord;
            var tipoGarantia = thisRecord.getValue({
                fieldId: 'custbody_aplicacion_garantia'
            });

            // Si el tipo de garantía es 4, validar que al menos un artículo tenga el check marcado
            if (tipoGarantia === '4' || tipoGarantia === 4) {
                var lineCount = thisRecord.getLineCount({
                    sublistId: 'item'
                });

                if (lineCount === 0) {
                    // Si no hay items, permitir guardar (la validación de items se hará en otro lugar)
                    return true;
                }

                var hayAlMenosUnoMarcado = false;

                // Recorrer todas las líneas para verificar si al menos una tiene el check marcado
                for (var i = 0; i < lineCount; i++) {
                    try {
                        thisRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });

                        var aplicaDescuento = thisRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aplica_descuento'
                        });

                        // Verificar si el check está marcado
                        if (aplicaDescuento === true || aplicaDescuento === 'T' || aplicaDescuento === 1 || aplicaDescuento === 'true') {
                            hayAlMenosUnoMarcado = true;
                            break; // Ya encontramos uno, no necesitamos seguir buscando
                        }
                    } catch (e) {
                        console.log('Error al validar línea ' + i + ': ' + e.message);
                        // Continuar con la siguiente línea
                    }
                }

                // Si no hay ningún artículo marcado, mostrar alerta y prevenir el guardado
                if (!hayAlMenosUnoMarcado) {
                    dialog.alert({
                        title: "Validación de Garantía Parcial",
                        message: "El tipo de garantía requiere por lo menos un artículo marcado. Marque un artículo para aplicar el descuento o cambie el tipo de garantía a aplicar."
                    });
                    return false; // Prevenir el guardado
                }
            }

            return true;
        } catch (err) {
            console.error('Error saveRecord', err);
            // En caso de error, permitir guardar para no bloquear al usuario
            return true;
        }
    }

     function printOppo(idOPO) {
         try {

             var thisRecord = currentRecord.get();
             var id = thisRecord.id;

             var sLet = url.resolveScript({
                 scriptId: 'customscript_order_repair_suitelet',
                 deploymentId: 'customdeploy_order_repair_suitelet'
             });
             console.log(thisRecord);
             window.open(sLet + "&oppID=" + id + '&emailSend=false', '_blank');
         } catch (err) {
             log.error("error printOppo", err)
         }
     }
     return {
         pageInit: pageInit,
         fieldChanged: fieldChanged,
         //        postSourcing: postSourcing,
         sublistChanged: sublistChanged,
         lineInit: lineInit,
         validateField: validateField,
         validateLine: validateLine,
         //        validateInsert: validateInsert,
         //        validateDelete: validateDelete,
         saveRecord: saveRecord,
         printOppo: printOppo
     };

 });
