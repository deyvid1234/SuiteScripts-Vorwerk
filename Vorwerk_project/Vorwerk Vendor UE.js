/**
user
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/url','N/https','N/email','N/search', 'N/log', 'N/record'],

    function(runtime,url,https,email,search,log,recordModule) {
       
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
                if (scriptContext.type !== scriptContext.UserEventType.VIEW && scriptContext.type !== scriptContext.UserEventType.EDIT) {
                    return;
                }
        
                var form = scriptContext.form;
                var record = scriptContext.newRecord;
                var currentUser = runtime.getCurrentUser();
        
                var vendorStatus = record.getValue('custentity_status_prov');
        
                if (vendorStatus == 2) { // 2 = 'Pendiente de Aprobacion'
                    var isApprover = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: currentUser.id,
                        columns: ['custentity_aprobador_proveedores']
                    }).custentity_aprobador_proveedores;
        
                    if (isApprover) {
                        form.clientScriptModulePath = './Vorwerk Vendor CS.js';
        
                        form.addButton({
                            id: 'custpage_approve_button',
                            label: 'Aprobar',
                            functionName: 'approveVendor'
                        });
        
                    }
                }
                
            }catch(err){
                log.error('Error beforeLoad',err);
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
            try{
                var listaEmail = []
                var aprobadorSearch = search.create({
                    type: search.Type.EMPLOYEE,
                    filters: [
                        ['custentity_aprobador_proveedores', 'is', true]
                    ],
                    columns: ['email']
                });
                var pagedResults = aprobadorSearch.runPaged();
                pagedResults.pageRanges.forEach(function (pageRange){
                    var currentPage = pagedResults.fetch({index: pageRange.index});
                    currentPage.data.forEach(function (r) {
                       var emailAddr = r.getValue('email')
                       log.debug('email',emailAddr)
                       listaEmail.push(emailAddr)
                    });
                          
                });
                log.debug('listaEmail',listaEmail)
                var record = scriptContext.newRecord;
                var oldRecord = scriptContext.oldRecord;
                var type = scriptContext.type
                var rec = record.getValue('id')
                var logoUrl = 'https://3367613.app.netsuite.com/core/media/media.nl?id=142592&c=3367613&h=Kf3ZX3KIRSgbOA_MYAW2Cr9n4gZ0Ae--DjrfM6N2isf8kA5g';
                var recordUrl = url.resolveRecord({
                    recordType: 'vendor',
                    recordId: rec,
                    isEditMode: false
                });

                if(type == 'create'){
                    recordModule.submitFields({
                        type: 'vendor',
                        id: rec,
                        values: {
                            'custentity_status_prov':2,
                            'custentity_aprobadores': runtime.getCurrentUser().id
                        }
                    });
                    listaEmail.forEach(function(recipientEmail) {
                        email.send({
                            author: runtime.getCurrentUser().id,
                            recipients: recipientEmail,
                            cc: ['desarrollo.netsuite@thermomix.mx'],
                            subject: 'Proveedor pendiente de aprobación',
                            body: '<img src="' + logoUrl + '" alt="Vorwerk Logo"><br><br>Usted tiene un nuevo proveedor para aprobar.<br><br>Haga clic <a href="' + recordUrl + '">aquí</a> para revisar el registro.'
                        });
                        log.debug('email enviado a ',recipientEmail )
                    });
                }
                if(type == 'edit'){
                    var countryOld = oldRecord.getValue('country'),
                        addresseeOld = oldRecord.getValue('addressee'),
                        addr1Old = oldRecord.getValue('addr1'),
                        addr2Old = oldRecord.getValue('addr2'),
                        cityOld = oldRecord.getValue('city'),
                        stateOld = oldRecord.getValue('dropdownstate'),
                        zipOld = oldRecord.getValue('zip'),
                        tipoCuentaOld = oldRecord.getValue('custentity_tipo_cuenta'),
                        numCtaOld = oldRecord.getValue('custentity_numcta'),
                        bancoOld = oldRecord.getValue('custentity_ban_prov'),
                        claveBancoOld = oldRecord.getValue('custentity_clave_banco_txt'),
                        custentity7Old = oldRecord.getValue('custentity7'),
                        custentity9Old = oldRecord.getValue('custentity9');

                    var countryNew = record.getValue('country'),
                        addresseeNew = record.getValue('addressee'),
                        addr1New = record.getValue('addr1'),
                        addr2New = record.getValue('addr2'),
                        cityNew = record.getValue('city'),
                        stateNew = record.getValue('dropdownstate'),
                        zipNew = record.getValue('zip'),
                        tipoCuentaNew = record.getValue('custentity_tipo_cuenta'),
                        numCtaNew = record.getValue('custentity_numcta'),
                        bancoNew = record.getValue('custentity_ban_prov'),
                        claveBancoNew = record.getValue('custentity_clave_banco_txt'),
                        custentity7New = record.getValue('custentity7'),
                        custentity9New = record.getValue('custentity9');

                    var billAddressOld = oldRecord.getValue('defaultaddress');
                    var billAddressNew = record.getValue('defaultaddress');

                    var bankDetailsChanged = (tipoCuentaOld != tipoCuentaNew || numCtaOld != numCtaNew || bancoOld != bancoNew || claveBancoOld != claveBancoNew);
                    var addressChanged = (billAddressOld != billAddressNew);
                    var customFieldsChanged = (custentity7Old != custentity7New || custentity9Old != custentity9New);

                    if (bankDetailsChanged || addressChanged || customFieldsChanged){
                        recordModule.submitFields({
                            type: 'vendor',
                            id: rec,
                            values: {
                                'custentity_status_prov':2,
                                'custentity_aprobadores': runtime.getCurrentUser().id
                            }
                        });
                        listaEmail.forEach(function(recipientEmail) {
                            email.send({
                                author: runtime.getCurrentUser().id,
                                recipients: recipientEmail,
                                cc: ['desarrollo.netsuite@thermomix.mx'],
                                subject: 'Proveedor pendiente de aprobación',
                                body: '<img src="' + logoUrl + '" alt="Vorwerk Logo"><br><br>Un proveedor ha sido modificado y requiere su aprobación.<br><br>Haga clic <a href="' + recordUrl + '">aquí</a> para revisar el registro.'
                            });
                            log.debug('email enviado a ',recipientEmail )
                        });
                    }
                }
                log.debug('aftersubmit')
                
                if (oldRecord) {
                    var statusOld = oldRecord.getValue('custentity_status_prov')
                    log.debug('statusOld',statusOld)
                    var statusNew = record.getValue('custentity_status_prov')
                    log.debug('statusNew',statusNew)
                    if(statusOld != statusNew){
                        var creatorId = record.getValue('custentity_aprobadores'); // Asumiendo que este campo guarda el creador
                        if (!creatorId) {
                            creatorId = runtime.getCurrentUser().id; // Fallback al usuario actual
                        }
                        var creatorEmail = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: creatorId,
                            columns: ['email']
                        }).email;
    
                        if(statusNew == 1){ // Aprobado
                            email.send({
                                author: runtime.getCurrentUser().id,
                                recipients: creatorEmail,
                                cc: ['desarrollo.netsuite@thermomix.mx'],
                                subject: 'Proveedor Aprobado',
                                body: '<img src="' + logoUrl + '" alt="Vorwerk Logo"><br><br>Su solicitud de proveedor ha sido aprobada.'
                            });
                        }
                        
                    }
                }
            }catch(err){
                log.error("error after submit",err);
            }
        }
    
      
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };
        
    });
    