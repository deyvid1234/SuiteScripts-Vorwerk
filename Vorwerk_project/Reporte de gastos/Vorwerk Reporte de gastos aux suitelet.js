/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/email', 'N/url', 'N/log', 'N/format', 'N/file'],
    function(serverWidget, record, search, email, url, log, format, file) {
        
        function onRequest(context) {
            if (context.request.method === 'GET') {
                // Crear el formulario
                var form = serverWidget.createForm({
                    title: 'Reporte de Gastos',
                    hideNavBar: false
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
    
                // Configurar el script de cliente
                // ID del script de cliente: 3312604 (Vorwerk Reporte de gastos client.js)
                form.clientScriptFileId = 3312604;
    
                context.response.writePage(form);
            } else {
                log.debug('Iniciando procesamiento del formulario', {
                    method: context.request.method,
                    parameters: context.request.parameters,
                    files: context.request.files ? Object.keys(context.request.files) : []
                });

                var params = context.request.parameters;
                var files = context.request.files;
    
                try {
                    log.debug('Validando código de seguridad', {
                        email: params.custpage_employee_email,
                        codigo: params.custpage_validation_code
                    });

                    // Validar el código de seguridad
                    var employeeSearch = search.create({
                        type: search.Type.EMPLOYEE,
                        filters: [
                            ['email', 'is', params.custpage_employee_email],
                            'AND',
                            ['isinactive', 'is', 'F']
                        ],
                        columns: ['internalid', 'custentity_expense_validation_code', 'custentity_expense_code_date']
                    });
    
                    var employeeResult = employeeSearch.run().getRange({start: 0, end: 1})[0];
                    log.debug('Resultado de búsqueda de empleado', employeeResult);
                    
                    if (!employeeResult) {
                        log.error('Empleado no encontrado', params.custpage_employee_email);
                        throw new Error('No se encontró un empleado activo con el correo electrónico proporcionado. Por favor, verifique su correo electrónico.');
                    }
    
                    var validationCode = employeeResult.getValue('custentity_expense_validation_code');
                    var codeDate = employeeResult.getValue('custentity_expense_code_date');
                    
                    if (!codeDate) {
                        log.error('Fecha de código no encontrada', {
                            employeeId: employeeResult.id,
                            email: params.custpage_employee_email
                        });
                        throw new Error('El código de validación ha expirado. Por favor, genere un nuevo código.');
                    }

                    var today = new Date();
                    today.setHours(0,0,0,0);
                    
                    // Convertir la fecha del código a objeto Date
                    var codeDateObj = format.parse({
                        value: codeDate,
                        type: format.Type.DATE
                    });
                    codeDateObj.setHours(0,0,0,0);
    
                    log.debug('Validando código y fecha', {
                        codigoRecibido: params.custpage_validation_code,
                        codigoAlmacenado: validationCode,
                        fechaCodigo: codeDateObj,
                        fechaHoy: today
                    });

                    if (validationCode !== params.custpage_validation_code) {
                        log.error('Código inválido', {
                            codigoRecibido: params.custpage_validation_code,
                            codigoAlmacenado: validationCode
                        });
                        throw new Error('El código de validación ingresado no es correcto. Por favor, verifique el código o genere uno nuevo.');
                    }

                    if (codeDateObj.getTime() !== today.getTime()) {
                        log.error('Código expirado', {
                            fechaCodigo: codeDateObj,
                            fechaHoy: today
                        });
                        throw new Error('El código de validación ha expirado. Por favor, genere un nuevo código.');
                    }

                    // Convertir la fecha del gasto a objeto Date
                    var expenseDate = null;
                    try {
                        expenseDate = format.parse({
                            value: params.custpage_expense_date,
                            type: format.Type.DATE
                        });
                        log.debug('Fecha de gasto convertida correctamente', expenseDate);
                    } catch (dateError) {
                        log.error('Error al convertir la fecha de gasto', {
                            valorOriginal: params.custpage_expense_date,
                            error: dateError.message
                        });
                        throw new Error('La fecha del gasto no es válida. Usa el formato correcto (D/M/YYYY).');
                    }
    
                    log.debug('Creando registro de gasto');
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
                        value: expenseDate
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
                        log.debug('Procesando archivo adjunto', {
                            nombre: files.custpage_expense_receipt.name,
                            tipo: files.custpage_expense_receipt.type
                        });

                        try {
                            var fileObj = file.create({
                                name: files.custpage_expense_receipt.name,
                                fileType: file.Type.PDF,
                                contents: files.custpage_expense_receipt.getContents()
                            });
                            
                            expenseRecord.setValue({
                                fieldId: 'custrecord_expense_receipt',
                                value: fileObj.id
                            });
                            log.debug('Archivo adjunto procesado exitosamente', fileObj.id);
                        } catch (fileError) {
                            log.error('Error al procesar el archivo adjunto', {
                                error: fileError.message,
                                stack: fileError.stack,
                                fileName: files.custpage_expense_receipt.name
                            });
                            // Continuamos con el proceso aunque falle el archivo
                            log.debug('Continuando con el proceso sin el archivo adjunto');
                        }
                    }
    
                    // Guardar el registro
                    var expenseRecordId = expenseRecord.save();
                    log.debug('Registro de gasto creado', expenseRecordId);
    
                    // Enviar confirmación por email
                    var emailOptions = {
                        author: 14803,
                        recipients: params.custpage_employee_email,
                        subject: 'Confirmación de Reporte de Gastos',
                        body: 'Su reporte de gastos ha sido recibido y está pendiente de aprobación.'
                    };
                    log.debug('Enviando email de confirmación', emailOptions);
                    
                    var emailSent = email.send(emailOptions);
                    log.debug('Email enviado', emailSent);
    
                    // Mostrar pantalla de confirmación bonita
                    var confirmForm = serverWidget.createForm({
                        title: '¡Reporte de Gastos Enviado!'
                    });

                    // Obtener la URL del script
                    var scriptUrl = url.resolveScript({
                        scriptId: context.request.parameters.script,
                        deploymentId: context.request.parameters.deploy,
                        returnExternalUrl: false
                    });

                    confirmForm.addField({
                        id: 'custpage_message',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Mensaje'
                    }).defaultValue = '<div style="text-align:center;padding:2em;">'
                        + '<h2 style="color:#27ae60;">¡Tu reporte de gastos ha sido enviado exitosamente!</h2>'
                        + '<p>Recibirás un correo de confirmación y tu reporte está pendiente de aprobación.</p>'
                        + '<br><button onclick="window.location.href=\'' + scriptUrl + '\'" style="background:#27ae60;color:#fff;padding:0.7em 2em;border:none;border-radius:5px;font-size:1.1em;cursor:pointer;">Registrar otro gasto</button>'
                        + '</div>';
                    context.response.writePage(confirmForm);
                    return;
                } catch (e) {
                    log.error('Error al procesar el reporte', {
                        error: e.message,
                        stack: e.stack,
                        params: params
                    });
                    context.response.write('Error: ' + e.message);
                }
            }
        }
    
        return {
            onRequest: onRequest
        };
    });
    