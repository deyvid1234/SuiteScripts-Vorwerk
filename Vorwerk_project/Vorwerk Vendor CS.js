/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/ui/dialog', 'N/url'],
    function(currentRecord, record, dialog, url) {

        // Campos que activan comprobante de domicilio
        var camposDomicilio = [
            'country', 'addressee', 'addr1', 'addr2', 'city', 'dropdownstate', 'zip'
        ];
        // Campos que activan comprobante bancario
        var camposBanco = [
            'custentity_tipo_cuenta', 'custentity_numcta', 'custentity_ban_prov', 'custentity_clave_banco_txt', 'custentity7', 'custentity9'
        ];
        var valoresOriginales = {};

        function pageInit(scriptContext) {
            var rec = currentRecord.get();
            valoresOriginales = {};
            // Guardar valor original de defaultaddress
            valoresOriginales['defaultaddress'] = rec.getValue({ fieldId: 'defaultaddress' });
            // Guardar valores originales de campos bancarios
            camposBanco.forEach(function(fieldId) {
                valoresOriginales[fieldId] = rec.getValue({ fieldId: fieldId });
            });
        }

        function saveRecord(context) {
            var rec = currentRecord.get();
            var domicilioEditado = false;
            var bancoEditado = false;

            // Verificar si se editó la dirección principal
            var originalAddress = valoresOriginales['defaultaddress'];
            var actualAddress = rec.getValue({ fieldId: 'defaultaddress' });
            if (originalAddress != actualAddress) {
                domicilioEditado = true;
            }

            // Verificar si se editó algún campo de banco
            camposBanco.forEach(function(fieldId) {
                var original = valoresOriginales[fieldId];
                var actual = rec.getValue({ fieldId: fieldId });
                if (original != actual) {
                    bancoEditado = true;
                }
            });

            if (domicilioEditado) {
                var comprobDom = rec.getValue({ fieldId: 'custentity_comprob_dom_prov' });
                if (!comprobDom) {
                    dialog.alert({
                        title: 'Campo obligatorio',
                        message: 'Debes adjuntar la Constancia de situación fiscal antes de guardar porque editaste datos de domicilio del proveedor.'
                    });
                    return false;
                }
            }
            if (bancoEditado) {
                var comprobBanco = rec.getValue({ fieldId: 'custentity_comprob_banco_prov' });
                if (!comprobBanco) {
                    dialog.alert({
                        title: 'Campo obligatorio',
                        message: 'Debes adjuntar el Comprobante bancario antes de guardar porque editaste datos bancarios del proveedor.'
                    });
                    return false;
                }
            }
            return true;
        }

        function approveVendor() {
            var rec = currentRecord.get();
            try {
                record.submitFields({
                    type: rec.type,
                    id: rec.id,
                    values: {
                        'custentity_status_prov': 1 // 1 = Aprobado
                    }
                });
                dialog.alert({
                    title: 'Éxito',
                    message: 'Proveedor Aprobado'
                }).then(function() {
                    window.location.reload();
                });
            } catch (e) {
                console.error('Error approving vendor', e);
                dialog.alert({
                    title: 'Error',
                    message: 'Error al aprobar proveedor: ' + e.message
                });
            }
        }

        return {
            pageInit: pageInit,
            approveVendor: approveVendor,
            saveRecord: saveRecord
        };
    }); 