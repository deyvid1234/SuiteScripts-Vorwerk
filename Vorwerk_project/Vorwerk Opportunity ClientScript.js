/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog','N/format', 'N/runtime', 'N/record'],

    function (currentRecord, url, dialog, format, runtime, record) {
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
            } catch (err) {
                console.error('Error pageInit', err);
            }
        }
        
       /**
        * Actualiza el estado de habilitación del campo custcol_aplica_descuento usando la API de NetSuite
        * @param {Record} thisRecord - Record actual
        * @param {number} lineNum - Número de línea (opcional, si no se proporciona actualiza todas las líneas)
        * @param {boolean} esEditable - true si el campo debe ser editable, false si debe estar deshabilitado
        */
       function actualizarEstadoCampoDescuento(thisRecord, lineNum, esEditable) {
           try {
               var fieldId = 'custcol_aplica_descuento';
               
               if (lineNum !== undefined && lineNum !== null) {
                   // Actualizar una línea específica
                   try {
                       var checkboxField = thisRecord.getSublistField({
                           sublistId: 'item',
                           fieldId: fieldId,
                           line: lineNum
                       });
                       checkboxField.isDisabled = !esEditable;
                       console.log('actualizarEstadoCampoDescuento - Línea ' + lineNum + ' - Campo ' + (esEditable ? 'HABILITADO' : 'DESHABILITADO'));
                   } catch (e) {
                       console.log('Error al actualizar línea ' + lineNum + ': ' + e.message);
                   }
               } else {
                   // Actualizar todas las líneas
                   try {
                       var lineCount = thisRecord.getLineCount({
                           sublistId: 'item'
                       });
                       
                       console.log('actualizarEstadoCampoDescuento - Actualizando todas las líneas (' + lineCount + '). Es editable: ' + esEditable);
                       
                       for (var i = 0; i < lineCount; i++) {
                           try {
                               var checkboxField = thisRecord.getSublistField({
                                   sublistId: 'item',
                                   fieldId: fieldId,
                                   line: i
                               });
                               checkboxField.isDisabled = !esEditable;
                               console.log('actualizarEstadoCampoDescuento - Línea ' + i + ' - Campo ' + (esEditable ? 'HABILITADO' : 'DESHABILITADO'));
                           } catch (e) {
                               console.log('Error al actualizar línea ' + i + ': ' + e.message);
                           }
                       }
                   } catch (e) {
                       console.log('Error al obtener lineCount: ' + e.message);
                   }
               }
           } catch (err) {
               console.log('Error actualizarEstadoCampoDescuento: ' + err.message);
           }
       }
   
       /**
        * Carga la configuración de descuento y obtiene el valor de custrecord_descuentos_a_aplicar
        * @param {string|number} tipoGarantia - ID del tipo de garantía
        * @returns {string|null} - Valor de custrecord_descuentos_a_aplicar o null si hay error
        */
       function obtenerDescuentosAAplicar(tipoGarantia) {
           try {
               if (!tipoGarantia || tipoGarantia === '') {
                   console.log('obtenerDescuentosAAplicar', 'No hay tipo de garantía definido');
                   return null;
               }
   
               // Cargar el registro de configuración usando el tipo de garantía como ID
               var configRecord = record.load({
                   type: 'customrecord_conf_descuento',
                   id: tipoGarantia,
                   isDynamic: false
               });
   
               // Obtener el campo custrecord_descuentos_a_aplicar
               var descuentosAAplicar = configRecord.getValue({
                   fieldId: 'custrecord_descuentos_a_aplicar'
               });
   
               console.log('obtenerDescuentosAAplicar', 'Descuentos a aplicar: ' + descuentosAAplicar);
   
               return descuentosAAplicar ? String(descuentosAAplicar) : null;
   
           } catch (err) {
               console.error('Error obtenerDescuentosAAplicar', err);
               return null;
           }
       }
   
       /**
        * Actualiza el estado de edición del campo custcol_aplica_descuento según custrecord_descuentos_a_aplicar
        * @param {Record} thisRecord - Record actual
        */
       function actualizarEdicionCampoDescuento(thisRecord) {
           try {
               var tipoGarantia = thisRecord.getValue({
                   fieldId: 'custbody_aplicacion_garantia'
               });

               // Si no hay tipo de garantía, el campo permanece bloqueado (ya está bloqueado por defecto en NetSuite)
               if (!tipoGarantia || tipoGarantia === '') {
                   console.log('actualizarEdicionCampoDescuento - Sin tipo de garantía, campo permanece bloqueado');
                   return;
               }

               // Obtener el valor de custrecord_descuentos_a_aplicar de la configuración
               var descuentosAAplicar = obtenerDescuentosAAplicar(tipoGarantia);

               // Solo desbloquear si descuentosAAplicar es 5 (Elección manual)
               // Si no es 5, el campo permanece bloqueado (ya está bloqueado por defecto en NetSuite)
               var esEditable = (descuentosAAplicar === '5');

               console.log('actualizarEdicionCampoDescuento - Tipo garantía: ' + tipoGarantia + ', Descuentos a aplicar: ' + descuentosAAplicar + ', Desbloquear: ' + esEditable);

               // Solo actualizar si necesitamos desbloquear (esEditable = true)
               if (esEditable) {
                   // Actualizar el estado del campo para todas las líneas
                   actualizarEstadoCampoDescuento(thisRecord, null, true);
                   
                   // También intentar actualizar la línea actual si está disponible
                   try {
                       var currentLine = thisRecord.getCurrentSublistIndex({
                           sublistId: 'item'
                       });
                       if (currentLine >= 0) {
                           console.log('actualizarEdicionCampoDescuento - También desbloqueando línea actual: ' + currentLine);
                           actualizarEstadoCampoDescuento(thisRecord, currentLine, true);
                       }
                   } catch (e) {
                       // No hay línea actual, continuar
                   }
               }
           } catch (err) {
               console.error('Error actualizarEdicionCampoDescuento', err);
               // En caso de error, el campo permanece bloqueado (ya está bloqueado por defecto)
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
                           console.log('Actualizando estado de edición del campo custcol_aplica_descuento. Tipo de garantía: ' + fieldValue);
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

                    // Si no hay tipo de garantía, el campo permanece bloqueado (ya está bloqueado por defecto)
                    if (!tipoGarantia || tipoGarantia === '') {
                        return;
                    }

                    // Obtener el valor de custrecord_descuentos_a_aplicar
                    var descuentosAAplicar = obtenerDescuentosAAplicar(tipoGarantia);
                    
                    console.log('sublistChanged - Tipo garantía: ' + tipoGarantia + ', Descuentos a aplicar: ' + descuentosAAplicar);

                    // Si custrecord_descuentos_a_aplicar no es 5, revertir cualquier cambio en custcol_aplica_descuento
                    if (descuentosAAplicar !== '5') {
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
                                
                                // Si el valor cambió y tenemos un valor anterior guardado, revertirlo silenciosamente
                                if (valorAnterior !== undefined && valorActual !== valorAnterior) {
                                    console.log('sublistChanged - Revertiendo cambio no permitido silenciosamente');
                                    
                                    // Revertir el valor al anterior sin mostrar alerta
                                    thisRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_aplica_descuento',
                                        value: valorAnterior
                                    });
                                }
                                // El campo permanece bloqueado (ya está bloqueado por defecto)
                            }
                        } catch (e) {
                            // No hay línea seleccionada o error al obtener el valor
                            console.log('sublistChanged - Error: ' + e.message);
                        }
                    } else {
                        // Si custrecord_descuentos_a_aplicar es 5, desbloquear el campo
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
                                
                                // Desbloquear el campo
                                console.log('sublistChanged - DESBLOQUEANDO campo en línea ' + currentLine + ' (descuentosAAplicar = 5)');
                                actualizarEstadoCampoDescuento(thisRecord, currentLine, true);
                            }
                        } catch (e) {
                            console.log('sublistChanged - Error al desbloquear campo: ' + e.message);
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

                    // Si no hay tipo de garantía, el campo permanece bloqueado (ya está bloqueado por defecto)
                    if (!tipoGarantia || tipoGarantia === '') {
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
                                // El campo permanece bloqueado (ya está bloqueado por defecto)
                            }
                        } catch (e) {
                            console.log('lineInit - Error al obtener línea sin garantía: ' + e.message);
                        }
                        return; // Salir temprano si no hay tipo de garantía
                    }

                    // Obtener el valor de custrecord_descuentos_a_aplicar
                    var descuentosAAplicar = obtenerDescuentosAAplicar(tipoGarantia);
                    var esEditable = (descuentosAAplicar === '5');
                    
                    console.log('lineInit - Tipo garantía: ' + tipoGarantia + ', Descuentos a aplicar: ' + descuentosAAplicar + ', Desbloquear: ' + esEditable);
                    
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
                            
                            // Solo desbloquear si descuentosAAplicar es 5
                            if (esEditable) {
                                console.log('lineInit - DESBLOQUEANDO campo en línea ' + currentLine);
                                actualizarEstadoCampoDescuento(thisRecord, currentLine, true);
                            }
                            // Si no es editable, el campo permanece bloqueado (ya está bloqueado por defecto)
                            
                            console.log('lineInit: Línea ' + currentLine + ' - Valor guardado: ' + valorActual);
                        }
                    } catch (e) {
                        console.log('lineInit - Error al obtener línea: ' + e.message);
                    }
                }
            } catch (err) {
                console.error('Error lineInit', err);
                // En caso de error, el campo permanece bloqueado (ya está bloqueado por defecto)
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
                // Validar que el campo custcol_aplica_descuento no se pueda editar si custrecord_descuentos_a_aplicar no es 5
                if (scriptContext.sublistId === 'item' && scriptContext.fieldId === 'custcol_aplica_descuento') {
                    console.log('validateField ejecutado para custcol_aplica_descuento');
                    var thisRecord = scriptContext.currentRecord;
                    var tipoGarantia = thisRecord.getValue({
                        fieldId: 'custbody_aplicacion_garantia'
                    });

                    // Si no hay tipo de garantía, prevenir el cambio (el campo está bloqueado por defecto)
                    if (!tipoGarantia || tipoGarantia === '') {
                        var lineNum = scriptContext.lineNum;
                        console.log('validateField - Sin tipo de garantía. Preveniendo cambio. Línea: ' + lineNum);
                        
                        if (lineNum !== undefined) {
                            // Obtener el valor actual antes del cambio
                            var valorActual = thisRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_aplica_descuento',
                                line: lineNum
                            });
                            
                            // Obtener el nuevo valor que se intenta establecer
                            var nuevoValor = thisRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_aplica_descuento'
                            });
                            
                            // Si el valor está cambiando, prevenir el cambio
                            if (valorActual !== nuevoValor) {
                                dialog.alert({
                                    title: "Campo no editable",
                                    message: "El campo 'Aplica descuento' no puede ser editado. Debe seleccionar primero el tipo de garantía en el campo 'Aplicación de Garantía'."
                                });
                                
                                // Restaurar el valor anterior
                                thisRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_aplica_descuento',
                                    value: valorActual
                                });
                                
                                return false; // Prevenir el cambio
                            }
                        }
                        return false; // Prevenir cualquier cambio si no hay tipo de garantía
                    }

                    // Obtener el valor de custrecord_descuentos_a_aplicar
                    var descuentosAAplicar = obtenerDescuentosAAplicar(tipoGarantia);

                    console.log('validateField - Tipo garantía: ' + tipoGarantia + ', Descuentos a aplicar: ' + descuentosAAplicar);

                    // Si custrecord_descuentos_a_aplicar no es 5, no permitir edición (el campo está bloqueado por defecto)
                    if (descuentosAAplicar !== '5') {
                        var lineNum = scriptContext.lineNum;
                        console.log('validateField - Preveniendo cambio. Línea: ' + lineNum);
                        
                        if (lineNum !== undefined) {
                            // Obtener el valor actual antes del cambio
                            var valorActual = thisRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_aplica_descuento',
                                line: lineNum
                            });
                            
                            // Obtener el nuevo valor que se intenta establecer
                            var nuevoValor = thisRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_aplica_descuento'
                            });
                            
                            // Si el valor está cambiando, prevenir el cambio
                            if (valorActual !== nuevoValor) {
                                dialog.alert({
                                    title: "Campo no editable",
                                    message: "El campo 'Aplica descuento' no puede ser editado manualmente. El valor se establecerá automáticamente al guardar según la configuración de descuento seleccionada."
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
                    // Si descuentosAAplicar es 5, permitir el cambio (el campo está desbloqueado)
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
                // Validar que el campo custcol_aplica_descuento no se pueda editar si custrecord_descuentos_a_aplicar no es 5
                if (scriptContext.sublistId === 'item') {
                    console.log('validateLine ejecutado para sublista item');
                    var thisRecord = scriptContext.currentRecord;
                    var tipoGarantia = thisRecord.getValue({
                        fieldId: 'custbody_aplicacion_garantia'
                    });
   
                    // Obtener el valor de custrecord_descuentos_a_aplicar
                    var descuentosAAplicar = obtenerDescuentosAAplicar(tipoGarantia);
   
                    console.log('validateLine - Tipo garantía: ' + tipoGarantia + ', Descuentos a aplicar: ' + descuentosAAplicar);
   
                    // Si custrecord_descuentos_a_aplicar no es 5, verificar que no se haya modificado custcol_aplica_descuento
                    if (descuentosAAplicar !== '5') {
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
   
               // Obtener el valor de custrecord_descuentos_a_aplicar
               var descuentosAAplicar = obtenerDescuentosAAplicar(tipoGarantia);
   
               // Si custrecord_descuentos_a_aplicar es 5, validar que al menos un artículo tenga el check marcado
               if (descuentosAAplicar === '5') {
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
                           title: "Validación de Elección Manual",
                           message: "La configuración de descuento requiere por lo menos un artículo marcado. Marque un artículo para aplicar el descuento o cambie la configuración de descuento."
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
   