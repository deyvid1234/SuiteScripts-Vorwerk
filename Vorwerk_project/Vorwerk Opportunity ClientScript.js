/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog','N/format', 'N/runtime', 'N/record', 'N/https'],

    function (currentRecord, url, dialog, format, runtime, record, https) {
               // Usuario ejecutando
                var userObj = runtime.getCurrentUser();
                var userId = parseInt(userObj.id);
                
                // Variable para guardar los valores anteriores de custcol_aplica_descuento por línea
                var valoresAnteriores = {};

                /** Opción "Cooking Studio" en custbody83 (recolección) */
                var COOKING_STUDIO_RECOLECCION_ID = '2';
                var FIELD_RECOLECCION_TIPO = 'custbody83';
                var FIELD_UBICACION_RECOLECCION = 'custbody_ubicacion_recoleccion';

        /**
         * Habilita custbody_ubicacion_recoleccion solo si la recolección es Cooking Studio (internal id 2).
         * En cualquier otro caso el campo queda deshabilitado y se limpia el valor.
         */
        function actualizarCampoUbicacionRecoleccion(thisRecord) {
            try {
                var pickup = thisRecord.getValue({ fieldId: FIELD_RECOLECCION_TIPO });
                var esCookingStudio = String(pickup) === COOKING_STUDIO_RECOLECCION_ID;

                var locField = thisRecord.getField({ fieldId: FIELD_UBICACION_RECOLECCION });
                if (locField) {
                    locField.isDisabled = !esCookingStudio;
                }

                if (!esCookingStudio) {
                    try {
                        thisRecord.setValue({
                            fieldId: FIELD_UBICACION_RECOLECCION,
                            value: '',
                            ignoreFieldChange: true
                        });
                    } catch (clearErr) {
                        console.log('actualizarCampoUbicacionRecoleccion clear', clearErr.message);
                    }
                }
            } catch (err) {
                console.log('actualizarCampoUbicacionRecoleccion', err.message);
            }
        }

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
                actualizarCampoUbicacionRecoleccion(thisRecord);
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
                    case FIELD_RECOLECCION_TIPO:
                        actualizarCampoUbicacionRecoleccion(thisRecord);
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
   
        /**
         * Crea el registro customrecord_guia_envio para una Oportunidad (mismo esquema que Sales Order,
         * pero la transacción origen es la oportunidad y custrecord_id_sales_order queda sin valor).
         */
        function createGuiaEnvioRegistroOportunidad(acLogistic, idOpportunity, descriptionTxt, pesoTxt) {
            var obj_traking = record.create({
                type: 'customrecord_guia_envio',
                isDynamic: false
            });
            obj_traking.setValue({
                fieldId: 'custrecord_transaccion_origen',
                value: idOpportunity
            });
            obj_traking.setValue({
                fieldId: 'custrecord_no_guia',
                value: acLogistic.tracking
            });
            obj_traking.setValue({
                fieldId: 'custrecord_url_resp_aclogistics',
                value: acLogistic.tracking_link
            });
            obj_traking.setValue({
                fieldId: 'custrecord_url_pdf_aclogistics',
                value: acLogistic.guia
            });
            obj_traking.setValue({
                fieldId: 'custrecord_estatus_envio',
                value: 1
            });
            obj_traking.setValue({
                fieldId: 'custrecord_id_envio',
                value: acLogistic.id_envio
            });
            obj_traking.setValue({
                fieldId: 'custrecord_vw_description',
                value: descriptionTxt
            });
            if (pesoTxt) {
                obj_traking.setValue({
                    fieldId: 'custrecord_peso',
                    value: pesoTxt
                });
            }
            return obj_traking.save();
        }

        function buildDescriptionFromOpp(oppRecord) {
            var parts = [];
            var n = oppRecord.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < n; i++) {
                var desc = oppRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'description',
                    line: i
                });
                if (desc) {
                    parts.push(desc);
                }
            }
            return parts.join(',');
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

        function requestTrakingOpp() {
            try {
                var thisRecord = currentRecord.get();
                if (!thisRecord || !thisRecord.id) {
                    dialog.alert({
                        title: 'Error',
                        message: 'No se pudo obtener el ID de la oportunidad.'
                    });
                    return;
                }

                // NOTA: Token/API Key pendiente (se definirá después).
                // Por ahora solo construimos e imprimimos el JSON para validación.
                var apiKeyPendiente = 'da568344e5000cf7c620fe7c21720b93';

                // Datos Opportunity
                var opp = record.load({
                    type: record.Type.OPPORTUNITY,
                    id: thisRecord.id,
                    isDynamic: false
                });

                var pickupOption = opp.getValue('custbody83'); // Campo de recolección
                var customerId = opp.getValue('entity');

                if (!customerId) {
                    dialog.alert({
                        title: 'Error',
                        message: 'La oportunidad no tiene cliente (entity) asignado.'
                    });
                    return;
                }

                var objCustomer = record.load({
                    type: record.Type.CUSTOMER,
                    id: customerId,
                    isDynamic: false
                });

                var email_customer = objCustomer.getValue('email') || '';
                var companyCustomer = objCustomer.getValue('custentity_razon_social') || '';

                var nameCustomer = '';
                var addrphone = '';
                var addr1 = '';
                var addr2 = '';
                var zip = '';

                var pickupStr = String(pickupOption === null || pickupOption === undefined ? '' : pickupOption);

                // Para guías de RECOLECCIÓN:
                // - Remitente = donde está el equipo (cliente o cooking studio)
                // - Destinatario = ubicación destino final (Location internalid 40)
                var DESTINO_FINAL_LOCATION_ID = 40;
                var remitente = {
                    nombre: '',
                    telefono: '',
                    correo: '',
                    direccion: '',
                    empresa: ''
                };
                var destinatario = {
                    nombre: '',
                    telefono: '',
                    correo: '',
                    calle: '',
                    colonia: '',
                    cp: '',
                    empresa: ''
                };

                if (pickupStr === '1') {
                    // Domicilio del cliente: dirección default shipping
                    var totalLines = objCustomer.getLineCount({ sublistId: 'addressbook' });
                    for (var i = 0; i < totalLines; i++) {
                        var defaultshipping = objCustomer.getSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'defaultshipping',
                            line: i
                        });

                        if (defaultshipping === true) {
                            var subRecord = objCustomer.getSublistSubrecord({
                                sublistId: 'addressbook',
                                fieldId: 'addressbookaddress',
                                line: i
                            });

                            if (subRecord) {
                                nameCustomer = subRecord.getValue({ fieldId: 'addressee' }) || '';
                                addrphone = subRecord.getText({ fieldId: 'addrphone' }) || '';
                                addr1 = subRecord.getValue({ fieldId: 'addr1' }) || '';
                                addr2 = subRecord.getValue({ fieldId: 'addr2' }) || '';
                                zip = subRecord.getValue({ fieldId: 'zip' }) || '';
                            }
                            break;
                        }
                    }
                    // Remitente = cliente
                    remitente.nombre = nameCustomer;
                    remitente.telefono = addrphone;
                    remitente.correo = email_customer;
                    remitente.direccion = (addr1 || '') + (addr2 ? (' ' + addr2) : '') + (zip ? (' ' + zip) : '');
                    remitente.empresa = companyCustomer || nameCustomer;
                } else if (pickupStr === COOKING_STUDIO_RECOLECCION_ID) {
                    // Cooking Studio: dirección según ubicación seleccionada
                    var idUbicacion = opp.getValue({ fieldId: FIELD_UBICACION_RECOLECCION });
                    if (!idUbicacion) {
                        dialog.alert({
                            title: 'Error',
                            message: 'Seleccione la ubicación de recolección (Cooking Studio).'
                        });
                        return;
                    }
                    var locRec = record.load({
                        type: record.Type.LOCATION,
                        id: idUbicacion,
                        isDynamic: false
                    });
                    nameCustomer = locRec.getValue('name') || '';
                    companyCustomer = locRec.getValue('name') || companyCustomer;
                    try {
                        var mainAddr = locRec.getSubrecord({ fieldId: 'mainaddress' });
                        if (mainAddr) {
                            addr1 = mainAddr.getValue({ fieldId: 'addr1' }) || '';
                            addr2 = mainAddr.getValue({ fieldId: 'addr2' }) || '';
                            zip = mainAddr.getValue({ fieldId: 'zip' }) || '';
                            addrphone = mainAddr.getText({ fieldId: 'addrphone' }) || mainAddr.getValue({ fieldId: 'addrphone' }) || '';
                        }
                    } catch (addrErr) {
                        console.log('mainaddress location', addrErr.message);
                    }
                    if (!addr1) {
                        addr1 = locRec.getValue('mainaddress_text') || '';
                    }
                    // Remitente = ubicación seleccionada (Cooking Studio)
                    remitente.nombre = nameCustomer;
                    remitente.telefono = addrphone;
                    remitente.correo = ''; // Normalmente no existe en Location estándar
                    remitente.direccion = (addr1 || '') + (addr2 ? (' ' + addr2) : '') + (zip ? (' ' + zip) : '');
                    remitente.empresa = companyCustomer || nameCustomer;
                } else {
                    dialog.alert({
                        title: 'Error',
                        message: 'Seleccione dónde se recolecta el equipo (Domicilio del cliente o Cooking Studio).'
                    });
                    return;
                }

                if (!addr1 || !zip) {
                    dialog.alert({
                        title: 'Error',
                        message: 'No se pudo armar la dirección de la guía (calle o CP faltante). Revise la dirección del cliente o de la ubicación.'
                    });
                    return;
                }

                // Destinatario = ubicación destino final (Location internalid 40)
                var locDestinoFinal = record.load({
                    type: record.Type.LOCATION,
                    id: DESTINO_FINAL_LOCATION_ID,
                    isDynamic: false
                });
                destinatario.nombre = locDestinoFinal.getValue('name') || '';
                destinatario.empresa = destinatario.nombre || 'Vorwerk';
                try {
                    var mainAddrDestino = locDestinoFinal.getSubrecord({ fieldId: 'mainaddress' });
                    if (mainAddrDestino) {
                        destinatario.calle = mainAddrDestino.getValue({ fieldId: 'addr1' }) || '';
                        destinatario.colonia = mainAddrDestino.getValue({ fieldId: 'addr2' }) || '';
                        destinatario.cp = mainAddrDestino.getValue({ fieldId: 'zip' }) || '';
                        destinatario.telefono = mainAddrDestino.getText({ fieldId: 'addrphone' }) || mainAddrDestino.getValue({ fieldId: 'addrphone' }) || '';
                    }
                } catch (destAddrErr) {
                    console.log('mainaddress destino final', destAddrErr.message);
                }
                if (!destinatario.calle) {
                    destinatario.calle = locDestinoFinal.getValue('mainaddress_text') || '';
                }
                // Correo destinatario: si no hay campo estándar, mantener vacío o usar un correo fijo de logística.
                destinatario.correo = '';

                var random_num = Math.floor(Math.random() * 100);
                var referencia = (opp.getValue('tranid') || ('OPP-' + thisRecord.id)) + '-' + random_num;
                var description_txt = buildDescriptionFromOpp(opp);
                var txtKilos = '12 kg';

                // Dimensión/peso fijo: 12 KG (requerimiento)
                // Alto/Ancho/Largo quedan como placeholders mientras se define el estándar final.
                var objRequest = {
                    api_key: apiKeyPendiente,
                    referencia: referencia,
                    id_courier: 'fedex_eco',
                    nombre_remitente: remitente.nombre,
                    telefono_remitente: remitente.telefono,
                    correo_remitente: remitente.correo,
                    direccion_remitente: remitente.direccion,
                    empresa_remitente: remitente.empresa,
                    nombre_destinatario: destinatario.nombre,
                    telefono_destinatario: destinatario.telefono,
                    correo_destinatario: destinatario.correo,
                    calle_destinatario: destinatario.calle,
                    num_exterior_destinatario: '0',
                    num_interior_destinatario: '0',
                    cp_destinatario: destinatario.cp,
                    colonia_destinatario: destinatario.colonia,
                    empresa_destinatario: destinatario.empresa,
                    alto_cm: 1,
                    ancho_cm: 1,
                    largo_cm: 1,
                    peso_kg: '12',
                    contenido: 'Equipo (recolección)',
                    valor: opp.getValue('projectedtotal') || opp.getValue('total') || 0,
                    seguro: 'false'
                };

                console.log('Endpoint SmartShip: https://www.smartship.mx/api/documentar/');
                console.log('Payload guía Oportunidad', JSON.stringify(objRequest));
                try {
                    dialog.alert({
                        title: 'Payload guía (pruebas)',
                        message:
                            'Endpoint: https://www.smartship.mx/api/documentar/\n\n' +
                            JSON.stringify(objRequest, null, 2)
                    });
                } catch (alertErr) {
                    console.log('No se pudo mostrar payload en alerta', alertErr && alertErr.message ? alertErr.message : alertErr);
                }

                if (!apiKeyPendiente) {
                    dialog.alert({
                        title: 'Modo validación',
                        message: 'El JSON se imprimió en consola. Sin API key no se envía a SmartShip ni se crea el registro de guía (el registro se crea solo tras respuesta Exitoso).'
                    });
                    return;
                }

                var responseService = https.post({
                    url: 'https://www.smartship.mx/api/documentar/',
                    body: JSON.stringify(objRequest),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).body;

                var acLogistic;
                try {
                    acLogistic = JSON.parse(responseService);
                } catch (parseErr) {
                    console.error('Respuesta SmartShip no JSON', responseService, parseErr);
                    dialog.alert({
                        title: 'Error',
                        message: 'Respuesta inválida del servicio de guías. Revisa la consola.'
                    });
                    return;
                }

                if (acLogistic.mensaje === 'Exitoso') {
                    createGuiaEnvioRegistroOportunidad(acLogistic, thisRecord.id, description_txt, txtKilos);
                    dialog.alert({
                        title: 'Éxito',
                        message: 'Guía generada correctamente'
                    });
                    window.location.reload();
                } else {
                    dialog.alert({
                        title: 'Error',
                        message: 'Error al generar guía: ' + (acLogistic.mensaje || responseService)
                    });
                }
            } catch (err) {
                console.error('Error requestTrakingOpp', err);
                try {
                    dialog.alert({
                        title: 'Error',
                        message: 'Ocurrió un error al generar el JSON de la guía. Revisa el log/console.'
                    });
                } catch (e) {}
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
            printOppo: printOppo,
            requestTrakingOpp: requestTrakingOpp
        };
   
    });
   