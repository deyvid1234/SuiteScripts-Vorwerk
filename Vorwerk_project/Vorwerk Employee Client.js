/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog','N/http','N/https','N/search','N/runtime','N/log','N/currentRecord','N/url'],

    function(record,dialog,http,https,search,runtime,log,currentRecord,url) {

        // IDs del Suitelet "Vorwerk Crear Cliente desde Presentador Suitelet" (reemplazar por los IDs reales tras crear y desplegar el Suitelet en NetSuite)
        var CREAR_CLIENTE_SUITELET_SCRIPT_ID = 'customscript_crear_cliente_pre';
        var CREAR_CLIENTE_SUITELET_DEPLOY_ID = 'customdeploy1';

        // Variable global para almacenar el valor inicial de custentity_nombre_programa
        var initialProgramValue = '';
        
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
                // Guardar el valor inicial del programa para comparar en fieldChanged
                initialProgramValue = thisRecord.getValue('custentity_nombre_programa') || '';
                
                // Hacer la función disponible en el scope global
                if(typeof window !== 'undefined') {
                    window.crearClienteDesdeEmployee = crearClienteDesdeEmployee;
                }
            } catch(err) {
                log.error("error pageInit", err);
            }
            
            return true;
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
            try{
                var thisRecord = scriptContext.currentRecord;
                
                if(scriptContext.fieldId=='custentity72'){
                    var	entry = thisRecord.getValue('custentity72');
                    thisRecord.setValue('hiredate',entry);
                }
                
                if(scriptContext.fieldId=='supervisor'){
                    debugger;
                    var	entry = thisRecord.getValue('supervisor');
                    
                    var gerencia = search.lookupFields({
                        type: 'employee',
                        id: entry,
                        columns: 'custentity_gerencia'
                            
                    });
                    thisRecord.setValue('custentity_gerencia',gerencia.custentity_gerencia[0].value);
                }
                if(scriptContext.fieldId =='custentity123'){
                    var promosion = thisRecord.getValue('custentity_promocion');
                    var hiredate = thisRecord.getValue('hiredate');
                    var configuracion = thisRecord.getValue('custentity123');
                    var reacondicionamiento = false
                     for (i = 0; i <= configuracion.length ; i++){
                        if(configuracion[i] == 11){
                            reacondicionamiento = true
                        }
                     }
                    var objetivo1 = new Date(hiredate);
                    objetivo1.setMonth(objetivo1.getMonth() + 1);
                    thisRecord.setValue('custentity_fin_objetivo_1', objetivo1)
                    if(promosion == 1 && reacondicionamiento){
                        var objetivo2 = new Date(hiredate);
                        objetivo2.setMonth(objetivo2.getMonth() + 2);
                        thisRecord.setValue('custentity_fin_objetivo_2', objetivo2)
                    }else{
                        var objetivo2 = new Date(hiredate);
                        objetivo2.setMonth(objetivo2.getMonth() + 3);
                        thisRecord.setValue('custentity_fin_objetivo_2', objetivo2)
                    }
                }
                
                // Funcionalidad complementaria GUTM - Limpiar campos relacionados cuando cambia custentity_nombre_programa
                if(scriptContext.fieldId == 'custentity_nombre_programa'){
                    // Validación de usuario - Solo el usuario 4562429 puede ejecutar esta funcionalidad
                    var objUser = runtime.getCurrentUser();
                    var currentUserId = objUser.id;
                    
                    
                        var currentProgramValue = thisRecord.getValue('custentity_nombre_programa') || '';
                        
                        // Solo limpiar campos si el valor anterior NO estaba vacío (cambio de valor a valor, no de vacío a valor)
                        if(initialProgramValue !== '' && initialProgramValue !== currentProgramValue) {
                            // Array de campos que se deben limpiar cuando cambie el programa
                            var fieldsToReset = [
                                'custentity_fcha_inicio_eptm7',
                                'custentity_fcha_fin_eptm7',
                                'custentity_estatus_eptm7',
                                'custentity_so_ganotm7',
                                'custentity_fechatm7_ganada',
                                'custentity_num_ventas_gutm',
                                'custentity124'
                            ];
                            
                            // Limpiar cada campo
                            for(var i = 0; i < fieldsToReset.length; i++){
                                thisRecord.setValue(fieldsToReset[i], '');
                            }
                        }
                        
                        // Actualizar el valor inicial para futuras comparaciones
                        initialProgramValue = currentProgramValue;
                    
                }
                
                return true;
            }catch(err){
                log.error("error inactive",err);
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
            if(scriptContext.fieldId == 'isinactive') {
                var isInactive = scriptContext.currentRecord.getValue('isinactive');
                // Se ejecuta cuando se intenta desmarcar el campo (cambiar de true a false)
                if(!isInactive) {
                    var urlCsf = scriptContext.currentRecord.getValue('custentity_url_csf');
                    var autorizadoFinanzas = scriptContext.currentRecord.getValue('custentity_autorizado_finanzas');
                    
                    if(!urlCsf || !autorizadoFinanzas) {
                        dialog.alert({
                            title: 'Error de Validación',
                            message: 'El presentador no tiene CSF y/o no ha sido validada, no puede darse de alta'
                        });
                        return false; // Revierte el checkbox a marcado (true)
                    }
                }
            }
            return true;
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
            try{
                var thisRecord = scriptContext.currentRecord;
                var updateReentry;
                var	dateReentry = thisRecord.getValue('custentity72');
                var typeReentry = thisRecord.getValue('custentity_vorwerk_reentry');
                if(dateReentry != '' && typeReentry == ''){
                    alert('Debe de seleccionar tipo de reingreso')
                    return false;
                }else{
                    console.log('reentry',thisRecord.getValue('custentity_vorwerk_reentry'));
                    if(thisRecord.getValue('custentity_tipo_ingreso') != thisRecord.getValue('custentity_vorwerk_reentry') && thisRecord.getValue('custentity_vorwerk_reentry') != ""){
                        thisRecord.setValue('custentity_tipo_ingreso', thisRecord.getValue('custentity_vorwerk_reentry'))
                    }
    
                }
            }catch(err){
                log.error('errorsaverecord',err);
            }
            return true;
        }
    
        /**
         * Función para crear un cliente desde el registro de employee
         * El cliente se crea con prefijo IDU- seguido del entityid del employee
         * El nombre del cliente será el nombre del presentador
         */
        function crearClienteDesdeEmployee() {
            try {
                var thisRecord = currentRecord.get();
                
                // Obtener el ID del empleado
                var employeeId = thisRecord.id;
                
                if(!employeeId) {
                    dialog.alert({
                        title: 'Error',
                        message: 'No se pudo obtener el ID del empleado.'
                    });
                    return;
                }
                
                // Cargar el registro completo usando record.load para obtener todos los campos
                var employeeRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: employeeId,
                    isDynamic: false
                });
                
                // Validar si el employee ya tiene un cliente relacionado
                var clienteRelacionado = employeeRecord.getValue('custentity_cliente_relacionado');
                
                log.debug('crearClienteDesdeEmployee - Validando cliente relacionado', {
                    employeeId: employeeId,
                    clienteRelacionado: clienteRelacionado
                });
                
                if(clienteRelacionado && clienteRelacionado !== '' && clienteRelacionado !== null) {
                    // Obtener información del cliente relacionado para mostrar en el mensaje
                    var clienteInfo = '';
                    try {
                        var clienteData = search.lookupFields({
                            type: 'customer',
                            id: clienteRelacionado,
                            columns: ['entityid', 'companyname', 'altname']
                        });
                        
                        var clienteEntityId = clienteData.entityid || '';
                        var clienteNombre = clienteData.altname || clienteData.companyname || '';
                        
                        clienteInfo = '\n\nCliente relacionado actual:\n';
                        clienteInfo += 'IDU: ' + clienteEntityId + '\n';
                        clienteInfo += 'Nombre: ' + clienteNombre;
                    } catch(infoErr) {
                        log.debug('crearClienteDesdeEmployee - Error al obtener info del cliente', infoErr);
                    }
                    
                    dialog.alert({
                        title: 'Cliente Ya Existe',
                        message: 'Este presentador ya cuenta con un cliente relacionado. No se puede crear otro cliente.' + clienteInfo
                    });
                    return;
                }
                
                // Obtener datos del employee desde el registro cargado
                var entityId = employeeRecord.getValue('entityid');
                var altName = employeeRecord.getValue('altname');
                var firstName = employeeRecord.getValue('firstname');
                var lastName = employeeRecord.getValue('lastname');
                var email = employeeRecord.getValue('email');
                var phone = employeeRecord.getValue('phone');
                var mobilephone = employeeRecord.getValue('mobilephone');
                var addr1 = '', city = '', state = '', zip = '', country = '';
                try {
                    var addrLineCount = employeeRecord.getLineCount({ sublistId: 'addressbook' });
                    if (addrLineCount > 0) {
                        var addrSubrec = employeeRecord.getSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress',
                            line: 0
                        });
                        addr1 = addrSubrec.getValue({ fieldId: 'addr1' }) || '';
                        city = addrSubrec.getValue({ fieldId: 'city' }) || '';
                        state = addrSubrec.getValue({ fieldId: 'state' }) || '';
                        zip = addrSubrec.getValue({ fieldId: 'zip' }) || '';
                        country = addrSubrec.getValue({ fieldId: 'country' }) || '';
                    }
                } catch(addrReadErr) {
                    log.debug('crearClienteDesdeEmployee - No se pudo leer addressbook del employee', addrReadErr);
                }
                
                // Log para depuración (incluye dirección leída)
                log.debug('crearClienteDesdeEmployee - Datos obtenidos', {
                    employeeId: employeeId,
                    entityId: entityId,
                    altName: altName,
                    firstName: firstName,
                    lastName: lastName, 
                    email: email,
                    phone: phone,
                    mobilephone: mobilephone,
                    addr1: addr1,
                    city: city,
                    state: state,
                    zip: zip,
                    country: country,
                    addressbookLineCount: (function(){ try { return employeeRecord.getLineCount({ sublistId: 'addressbook' }); } catch(e) { return 0; } })()
                });
                
                // Validar que exista entityid
                if(!entityId || entityId === '' || entityId === null || entityId === undefined || String(entityId).trim() === '') {
                    log.error('crearClienteDesdeEmployee - entityid no encontrado', {
                        employeeId: employeeId,
                        entityId: entityId,
                        entityIdType: typeof entityId
                    });
                    
                    dialog.alert({
                        title: 'Error',
                        message: 'El empleado no tiene IDU (entityid) asignado. No se puede crear el cliente.\n\nEmployee ID: ' + employeeId
                    });
                    return;
                }
                
                // Determinar el nombre del cliente
                var nombreCliente = '';
                if(altName && altName !== '') {
                    nombreCliente = altName;
                } else if(firstName || lastName) {
                    nombreCliente = (firstName || '') + ' ' + (lastName || '');
                    nombreCliente = nombreCliente.trim();
                } else {
                    log.error('crearClienteDesdeEmployee - No hay nombre del cliente', {
                        altName: altName,
                        firstName: firstName,
                        lastName: lastName
                    });
                    dialog.alert({
                        title: 'Error',
                        message: 'El empleado no tiene nombre asignado. No se puede crear el cliente.'
                    });
                    return;
                }
                
                // Crear el entityid del cliente con prefijo IDU-
                var clienteEntityId = 'IDU-' + entityId;
                
                log.debug('crearClienteDesdeEmployee - Preparando confirmación', {
                    clienteEntityId: clienteEntityId,
                    nombreCliente: nombreCliente
                });
                
                // Usar window.confirm que es síncrono y funciona de manera confiable
                // Luego usar dialog.alert para mantener el estilo de NetSuite
                var mensajeConfirmacion = '¿Desea crear el cliente con los siguientes datos?\n\n' +
                                         'IDU: ' + clienteEntityId + '\n' +
                                         'Nombre: ' + nombreCliente;
                
                log.debug('crearClienteDesdeEmployee - Mostrando confirmación');
                
                // Usar window.confirm que es síncrono y confiable
                var confirmResult = window.confirm(mensajeConfirmacion);
                
                log.debug('crearClienteDesdeEmployee - Resultado del confirm', {
                    result: confirmResult,
                    clienteEntityId: clienteEntityId,
                    nombreCliente: nombreCliente
                });
                
                if(confirmResult) {
                    log.debug('crearClienteDesdeEmployee - Usuario confirmó, llamando a Suitelet en segundo plano');
                    try {
                        var suiteletUrl = url.resolveScript({
                            scriptId: CREAR_CLIENTE_SUITELET_SCRIPT_ID,
                            deploymentId: CREAR_CLIENTE_SUITELET_DEPLOY_ID
                        });
                        var sep = (suiteletUrl.indexOf('?') >= 0) ? '&' : '?';
                        var callUrl = suiteletUrl + sep + 'employeeid=' + encodeURIComponent(employeeId) + '&format=json';
                        var response = https.get({ url: callUrl });
                        var body = response.body;
                        var data;
                        try {
                            data = JSON.parse(body);
                        } catch(parseErr) {
                            log.error('crearClienteDesdeEmployee - Error al parsear respuesta del Suitelet', parseErr);
                            dialog.alert({
                                title: 'Error',
                                message: 'No se pudo interpretar la respuesta del servidor. Código: ' + (response.message || '') + '. Revisar logs.'
                            });
                            return;
                        }
                        if(data.success) {
                            dialog.alert({
                                title: 'Cliente Creado',
                                message: data.message
                            });
                        } else {
                            dialog.alert({
                                title: 'Error',
                                message: data.message || 'No se pudo crear el cliente.'
                            });
                        }
                    } catch(urlErr) {
                        log.error('crearClienteDesdeEmployee - Error al llamar al Suitelet', urlErr);
                        dialog.alert({
                            title: 'Error',
                            message: 'No se pudo crear el cliente. Verifique que el Suitelet esté desplegado (Script ID: ' + CREAR_CLIENTE_SUITELET_SCRIPT_ID + ', Deploy ID: ' + CREAR_CLIENTE_SUITELET_DEPLOY_ID + '). Detalle: ' + (urlErr.message || urlErr.toString())
                        });
                    }
                } else {
                    log.debug('crearClienteDesdeEmployee - Usuario canceló la creación');
                }
                
            } catch(err) {
                log.error('Error en crearClienteDesdeEmployee', err);
                dialog.alert({
                    title: 'Error',
                    message: 'Ocurrió un error al intentar crear el cliente: ' + err.message
                });
            }
        }
        
        /**
         * Función auxiliar para crear el registro de customer
         * @param {string} employeeId - ID interno del employee
         * @param {string} clienteEntityId - Entity ID del cliente (IDU-XXXXX)
         * @param {string} nombreCliente - Nombre del cliente
         * @param {string} firstName - Primer nombre del cliente
         * @param {string} lastName - Apellido del cliente
         * @param {Object} datosContacto - Objeto con email, phone, mobilephone, addr1, city, state, zip, country del presentador
         */
        function crearCliente(employeeId, clienteEntityId, nombreCliente, firstName, lastName, datosContacto) {
            try {
                datosContacto = datosContacto || {};
                log.debug('crearCliente - Iniciando creación', {
                    employeeId: employeeId,
                    clienteEntityId: clienteEntityId,
                    nombreCliente: nombreCliente,
                    firstName: firstName,
                    lastName: lastName,
                    datosContacto: datosContacto
                });
                
                // Crear el registro de customer (isDynamic: true para poder agregar línea en addressbook)
                log.debug('crearCliente - Creando registro de customer');
                var newCustomer = record.create({
                    type: record.Type.CUSTOMER,
                    isDynamic: true
                });
                log.debug('crearCliente - Registro creado');
                
                // Establecer los campos del cliente
                log.debug('crearCliente - Estableciendo campos');
                
                // Campos básicos (NO establecer entityid aquí, se asignará después de guardar)
                newCustomer.setValue({
                    fieldId: 'companyname',
                    value: nombreCliente
                });
                log.debug('crearCliente - companyname establecido', nombreCliente);
                
                newCustomer.setValue({
                    fieldId: 'altname',
                    value: nombreCliente
                });
                log.debug('crearCliente - altname establecido', nombreCliente);
                
                // Campos obligatorios
                if(firstName && firstName !== '') {
                    newCustomer.setValue({
                        fieldId: 'firstname',
                        value: firstName
                    });
                    log.debug('crearCliente - firstname establecido', firstName);
                }
                
                if(lastName && lastName !== '') {
                    newCustomer.setValue({
                        fieldId: 'lastname',
                        value: lastName
                    });
                    log.debug('crearCliente - lastname establecido', lastName);
                }
                
                // Sales Rep (usar el employeeId como sales rep)
                if(employeeId) {
                    newCustomer.setValue({
                        fieldId: 'salesrep',
                        value: employeeId
                    });
                    log.debug('crearCliente - salesrep establecido', employeeId);
                }
                
                // Correo y teléfono: presentador tiene el número en phone; en el cliente se asigna a mobilephone
                if(datosContacto.email && datosContacto.email !== '') {
                    newCustomer.setValue({ fieldId: 'email', value: datosContacto.email });
                    log.debug('crearCliente - email establecido', datosContacto.email);
                }
                var telefonoCliente = (datosContacto.phone && datosContacto.phone !== '') ? datosContacto.phone : (datosContacto.mobilephone || '');
                if(telefonoCliente !== '') {
                    newCustomer.setValue({ fieldId: 'mobilephone', value: telefonoCliente });
                    log.debug('crearCliente - mobilephone establecido (desde presentador.phone)', telefonoCliente);
                }
                
                // Dirección del presentador: en Customer la dirección va en el subrecord addressbookaddress del sublist addressbook
                var tieneDireccion = (datosContacto.addr1 && datosContacto.addr1 !== '') ||
                                    (datosContacto.city && datosContacto.city !== '') ||
                                    (datosContacto.zip && datosContacto.zip !== '');
                log.debug('crearCliente - Dirección a copiar', {
                    tieneDireccion: tieneDireccion,
                    addr1: datosContacto.addr1,
                    city: datosContacto.city,
                    state: datosContacto.state,
                    zip: datosContacto.zip,
                    country: datosContacto.country
                });
                if(tieneDireccion) {
                    try {
                        newCustomer.selectNewLine({ sublistId: 'addressbook' });
                        newCustomer.setSublistValue({ sublistId: 'addressbook', fieldId: 'label', value: 'Principal' });
                        newCustomer.setSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
                        newCustomer.setSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
                        var addressSubrec = newCustomer.getCurrentSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress'
                        });
                        if(addressSubrec) {
                            if(datosContacto.country && datosContacto.country !== '') {
                                addressSubrec.setValue({ fieldId: 'country', value: datosContacto.country });
                            }
                            if(datosContacto.addr1 && datosContacto.addr1 !== '') {
                                addressSubrec.setValue({ fieldId: 'addr1', value: datosContacto.addr1 });
                            }
                            if(datosContacto.city && datosContacto.city !== '') {
                                addressSubrec.setValue({ fieldId: 'city', value: datosContacto.city });
                            }
                            if(datosContacto.state && datosContacto.state !== '') {
                                addressSubrec.setValue({ fieldId: 'state', value: datosContacto.state });
                            }
                            if(datosContacto.zip && datosContacto.zip !== '') {
                                addressSubrec.setValue({ fieldId: 'zip', value: datosContacto.zip });
                            }
                            log.debug('crearCliente - Valores establecidos en subrecord addressbookaddress');
                        } else {
                            log.debug('crearCliente - getCurrentSublistSubrecord addressbookaddress retornó null');
                        }
                        newCustomer.commitLine({ sublistId: 'addressbook' });
                        log.debug('crearCliente - dirección establecida en addressbook (subrecord addressbookaddress)');
                    } catch(addrErr) {
                        log.error('crearCliente - Error al establecer addressbook', addrErr.toString());
                        log.error('crearCliente - Error stack', addrErr.stack);
                    }
                }
                
                // Marcar checkbox custentity_creado_desde_presentador
                newCustomer.setValue({
                    fieldId: 'custentity_creado_desde_presentador',
                    value: true
                });
                log.debug('crearCliente - custentity_creado_desde_presentador marcado');
                // Razón social (altname del presentador), régimen fiscal 11, destinatario CFDI (email del presentador)
                if (nombreCliente && nombreCliente !== '') newCustomer.setValue({ fieldId: 'custentity_razon_social', value: nombreCliente });
                newCustomer.setValue({ fieldId: 'custentity_regimenfiscal_ce', value: 11 });
                if (datosContacto.email && datosContacto.email !== '') newCustomer.setValue({ fieldId: 'custentity_fe_sf_se_destinatario', value: datosContacto.email });
                
                // Guardar el registro ignorando campos obligatorios
                log.debug('crearCliente - Guardando registro (ignorando campos obligatorios)');
                var customerId = newCustomer.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('crearCliente - Registro guardado con ID', customerId);
                
                // PASO 1: Actualizar el entityid del cliente después de guardar (el sistema asigna uno por defecto)
                try {
                    log.debug('crearCliente - PASO 1: Iniciando actualización del entityid', {
                        customerId: customerId,
                        clienteEntityId: clienteEntityId
                    });
                    
                    // Intentar método 1: Cargar con isDynamic: true
                    try {
                        log.debug('crearCliente - PASO 1: Método 1 - Cargando registro con isDynamic: true');
                        var customerRecord = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerId,
                            isDynamic: true
                        });
                        
                        // Obtener entityid actual antes de actualizar
                        var entityIdActual = customerRecord.getValue('entityid');
                        log.debug('crearCliente - PASO 1: entityid actual antes de actualizar', entityIdActual);
                        
                        // Actualizar el entityid
                        customerRecord.setValue({
                            fieldId: 'entityid',
                            value: clienteEntityId
                        });
                        
                        log.debug('crearCliente - PASO 1: entityid establecido, guardando registro');
                        // Guardar el registro con el nuevo entityid
                        customerRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: false
                        });
                        
                        log.debug('crearCliente - PASO 1: Registro guardado con nuevo entityid');
                        
                    } catch(method1Err) {
                        log.error('crearCliente - PASO 1: Método 1 falló', {
                            error: method1Err.message,
                            errorName: method1Err.name
                        });
                        
                        // Intentar método 2: Cargar con isDynamic: false
                        try {
                            log.debug('crearCliente - PASO 1: Método 2 - Intentando con isDynamic: false');
                            var customerRecord2 = record.load({
                                type: record.Type.CUSTOMER,
                                id: customerId,
                                isDynamic: false
                            });
                            
                            customerRecord2.setValue({
                                fieldId: 'entityid',
                                value: clienteEntityId
                            });
                            
                            customerRecord2.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: false
                            });
                            
                            log.debug('crearCliente - PASO 1: Método 2 exitoso');
                        } catch(method2Err) {
                            log.error('crearCliente - PASO 1: Método 2 también falló', {
                                error: method2Err.message,
                                errorName: method2Err.name
                            });
                            throw method2Err;
                        }
                    }
                    
                    // Verificar que se actualizó correctamente
                    log.debug('crearCliente - PASO 1: Verificando actualización');
                    var customerRecordVerificado = record.load({
                        type: record.Type.CUSTOMER,
                        id: customerId,
                        isDynamic: false
                    });
                    var entityIdVerificado = customerRecordVerificado.getValue('entityid');
                    log.debug('crearCliente - PASO 1: entityid verificado', {
                        esperado: clienteEntityId,
                        obtenido: entityIdVerificado,
                        coincide: (entityIdVerificado == clienteEntityId)
                    });
                    
                    if(entityIdVerificado != clienteEntityId) {
                        log.error('crearCliente - PASO 1: El entityid NO se actualizó correctamente', {
                            esperado: clienteEntityId,
                            obtenido: entityIdVerificado
                        });
                    }
                    
                } catch(entityIdErr) {
                    log.error('crearCliente - PASO 1: Error al actualizar entityid', {
                        error: entityIdErr,
                        errorMessage: entityIdErr.message,
                        errorName: entityIdErr.name,
                        errorStack: entityIdErr.stack,
                        customerId: customerId,
                        clienteEntityId: clienteEntityId
                    });
                    // Continuar aunque falle, para actualizar el employee
                }
                
                // PASO 2: Actualizar el employee con el ID del cliente creado (siempre se ejecuta)
                log.debug('crearCliente - PASO 2: Actualizando employee con cliente relacionado', {
                    employeeId: employeeId,
                    customerId: customerId
                });
                
                try {
                        
                        var employeeRecord = record.load({
                            type: record.Type.EMPLOYEE,
                            id: employeeId,
                            isDynamic: true
                        });
                        
                        // Verificar valor actual antes de actualizar
                        var valorAnterior = employeeRecord.getValue('custentity_cliente_relacionado');
                        log.debug('crearCliente - PASO 2: Valor anterior del campo', {
                            campo: 'custentity_cliente_relacionado',
                            valorAnterior: valorAnterior
                        });
                        
                        employeeRecord.setValue({
                            fieldId: 'custentity_cliente_relacionado',
                            value: customerId
                        });
                        
                        log.debug('crearCliente - PASO 2: Campo establecido, guardando registro');
                        var employeeSaveResult = employeeRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: false
                        });
                        
                        log.debug('crearCliente - PASO 2: Registro guardado', {
                            employeeSaveResult: employeeSaveResult
                        });
                        
                        // Verificar que se guardó correctamente
                        var employeeRecordVerificado = record.load({
                            type: record.Type.EMPLOYEE,
                            id: employeeId,
                            isDynamic: false
                        });
                        var valorVerificado = employeeRecordVerificado.getValue('custentity_cliente_relacionado');
                        log.debug('crearCliente - PASO 2: Valor verificado después de guardar', {
                            esperado: customerId,
                            obtenido: valorVerificado,
                            coincide: (valorVerificado == customerId)
                        });
                        
                        if(valorVerificado == customerId) {
                            log.debug('crearCliente - PASO 2: Employee actualizado exitosamente');
                        } else {
                            log.error('crearCliente - PASO 2: Employee NO se actualizó correctamente', {
                                esperado: customerId,
                                obtenido: valorVerificado
                            });
                        }
                } catch(updateErr) {
                    log.error('crearCliente - PASO 2: Error al actualizar employee', {
                        error: updateErr,
                        errorMessage: updateErr.message,
                        errorStack: updateErr.stack,
                        errorName: updateErr.name,
                        employeeId: employeeId,
                        customerId: customerId
                    });
                    // No lanzar el error, solo loguearlo, ya que el cliente ya se creó
                }
                
                // Mostrar mensaje de éxito
                dialog.alert({
                    title: 'Cliente Creado',
                    message: 'El cliente se ha creado exitosamente.\n\n' +
                             'ID del Cliente: ' + customerId + '\n' +
                             'IDU: ' + clienteEntityId + '\n' +
                             'Nombre: ' + nombreCliente
                });
                
                log.debug('Cliente creado exitosamente', {
                    customerId: customerId,
                    clienteEntityId: clienteEntityId,
                    nombreCliente: nombreCliente,
                    employeeId: employeeId
                });
                
            } catch(err) {
                log.error('Error al crear cliente', {
                    error: err,
                    employeeId: employeeId,
                    clienteEntityId: clienteEntityId,
                    nombreCliente: nombreCliente
                });
                
                var errorMessage = 'Ocurrió un error al crear el cliente.';
                if(err.message) {
                    errorMessage += '\n\nDetalle: ' + err.message;
                }
                
                dialog.alert({
                    title: 'Error al Crear Cliente',
                    message: errorMessage
                });
            }
        }
    
       
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
    //        postSourcing: postSourcing,
    //        sublistChanged: sublistChanged,
    //        lineInit: lineInit,
            validateField: validateField,
    //        validateLine: validateLine,
    //        validateInsert: validateInsert,
    //        validateDelete: validateDelete,
            saveRecord: saveRecord,
            crearClienteDesdeEmployee: crearClienteDesdeEmployee
        };
        
    });
    