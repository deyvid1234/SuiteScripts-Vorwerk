/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/email', 'N/url'],
function(serverWidget, record, search, email, url) {
    
    function onRequest(context) {
        if (context.request.method === 'GET') {
            // Crear el formulario
            var form = serverWidget.createForm({
                title: 'Reporte de Gastos'
            });

            // Agregar campos del formulario
            form.addField({
                id: 'custpage_employee_email',
                type: serverWidget.FieldType.EMAIL,
                label: 'Correo Electrónico',
                isMandatory: true
            });

            form.addField({
                id: 'custpage_expense_date',
                type: serverWidget.FieldType.DATE,
                label: 'Fecha del Gasto',
                isMandatory: true
            });

            form.addField({
                id: 'custpage_expense_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Monto',
                isMandatory: true
            });

            form.addField({
                id: 'custpage_expense_category',
                type: serverWidget.FieldType.SELECT,
                label: 'Categoría',
                source: 'expensecategory',
                isMandatory: true
            });

            form.addField({
                id: 'custpage_expense_receipt',
                type: serverWidget.FieldType.FILE,
                label: 'Comprobante',
                isMandatory: true
            });

            form.addField({
                id: 'custpage_expense_description',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Descripción',
                isMandatory: true
            });

            form.addField({
                id: 'custpage_validation_code',
                type: serverWidget.FieldType.TEXT,
                label: 'Código de Validación',
                isMandatory: true
            });

            // Agregar botones
            form.addButton({
                id: 'custpage_generate_code',
                label: 'Generar Código',
                functionName: 'generateCode()'
            });

            form.addSubmitButton({
                label: 'Enviar Reporte'
            });

            // Agregar el script del cliente
            form.clientScriptFileId = 'customscript_expense_form_client';

            context.response.writePage(form);
        } else {
            // Procesar el formulario enviado
            var params = context.request.parameters;
            var files = context.request.files;

            try {
                // Validar el código de seguridad
                var employeeSearch = search.create({
                    type: search.Type.EMPLOYEE,
                    filters: [
                        ['email', 'is', params.custpage_employee_email],
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid', 'custentity_expense_validation_code', 'custentity_expense_code_date']
                });

                var employeeResult = employeeSearch.run().getRange({start: 0, end: 1})[0];
                
                if (!employeeResult) {
                    throw new Error('Empleado no encontrado o inactivo');
                }

                var validationCode = employeeResult.getValue('custentity_expense_validation_code');
                var codeDate = employeeResult.getValue('custentity_expense_code_date');
                var today = new Date();
                today.setHours(0,0,0,0);
                var codeDateObj = new Date(codeDate);
                codeDateObj.setHours(0,0,0,0);

                if (validationCode !== params.custpage_validation_code || 
                    codeDateObj.getTime() !== today.getTime()) {
                    throw new Error('Código de validación inválido o expirado');
                }

                // Crear el registro personalizado de gasto
                var expenseRecord = record.create({
                    type: 'customrecord_expense_report'
                });

                expenseRecord.setValue({
                    fieldId: 'custrecord_expense_employee',
                    value: employeeResult.id
                });

                expenseRecord.setValue({
                    fieldId: 'custrecord_expense_date',
                    value: params.custpage_expense_date
                });

                expenseRecord.setValue({
                    fieldId: 'custrecord_expense_amount',
                    value: params.custpage_expense_amount
                });

                expenseRecord.setValue({
                    fieldId: 'custrecord_expense_category',
                    value: params.custpage_expense_category
                });

                expenseRecord.setValue({
                    fieldId: 'custrecord_expense_description',
                    value: params.custpage_expense_description
                });

                // Adjuntar comprobante
                if (files.custpage_expense_receipt) {
                    var fileObj = file.create({
                        name: files.custpage_expense_receipt.name,
                        fileType: file.Type.PDF,
                        contents: files.custpage_expense_receipt.getContents()
                    });
                    
                    expenseRecord.setValue({
                        fieldId: 'custrecord_expense_receipt',
                        value: fileObj.id
                    });
                }

                // Guardar el registro
                var expenseRecordId = expenseRecord.save();

                // Enviar confirmación por email
                email.send({
                    author: -5,
                    recipients: params.custpage_employee_email,
                    subject: 'Confirmación de Reporte de Gastos',
                    body: 'Su reporte de gastos ha sido recibido y está pendiente de aprobación.'
                });

                context.response.write('Reporte de gastos enviado exitosamente');

            } catch (e) {
                context.response.write('Error al procesar el reporte: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
