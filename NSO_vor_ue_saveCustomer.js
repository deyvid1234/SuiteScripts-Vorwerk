/**
 * @NApiVersion     2.0
 * @NScriptType     UserEventScript
 * @ScriptName      VOR | UE | Save Customer
 * @NModuleScope    Public
 * @Company         Netsoft
 * @Author          Oscar Ortega
 * @Description     When somebody creates a customer this script fills the necessary fields to access to Customer Centre and notifies to the customer for email
 * ScriptFile:      NSO_vor_ue_saveCustomer.js
 * Dependencies:    'N/runtime', 'N/email', 'N/config'
 * idScript:        customscript_nso_vor_ue_savecustomer
 * idDeploy:        customdeploy_nso_vor_ue_savecustomer
 */


define( ['N/email', 'N/config', 'N/search', 'N/runtime'],
function ( email, config, search, runtime ) {
     
    function beforeSubmit( context ) {

        if ( context.type == context.UserEventType.CREATE ) {
            
            var newRecord = context.newRecord;
       
            var password  = getActualPassword(); 
     
            /*Fields Filled*/
            newRecord.setValue({ fieldId: 'giveaccess',   value: true     });
            newRecord.setValue({ fieldId: 'accessrole',   value: 1060     });
            newRecord.setValue({ fieldId: 'fillpassword', value: true     });
            newRecord.setValue({ fieldId: 'password',     value: password });
            newRecord.setValue({ fieldId: 'password2',    value: password });
            newRecord.setValue({ fieldId: 'language',     value: "es_AR" });
    
            log.debug("password",password)
            
     
            var customerEmail = newRecord.getValue({ fieldId: 'email' });
    
            log.debug("customerEmail",customerEmail)
             
            if( customerEmail ){
     
                var url = getURL();
     
                var RECIPIENT = customerEmail;
                var AUTHOR    = runtime.getCurrentUser().id;
    
                var HEADER    = "Portal de Cliente Thermomix México (Acceso)";
                var BODY      = "Estimado Cliente,\n\n"+
                                "Te informamos que se te otorgo acceso a nuestro Portal de Clientes Thermomix México, "+ 
                                "en él podrás generar tu factura electrónica, en caso de así requerirlo.\n\n"+
                                "Recibirás un correo electrónico con la información necesaria para este efecto.\n\n"+
                                "Te compartimos los datos de acceso:\n\n"+
                                "Link de acceso: www.facturacionthermomix.com \n\n"+
                                "Correo electrónico: "+customerEmail+"\n\n"+
                                "Contraseña: "+password+"\n\n"+
                                "Te sugerimos cambiar tu contraseña al momento de ingresar al portal.\n\n"+
                                "Si requieres ayuda de nuestros Ejecutivos de Servicio a Clientes, los puedes contactar al teléfono 800 200 1121.\n\n"+
                                "Atte:"+"\n\n"+
                                "Thermomix México"+"\n\n"
    
                email.send({
                    author:      AUTHOR,
                    recipients:  RECIPIENT,
                    subject:     HEADER,
                    body:        BODY,
                });
            }


        }

        else if ( context.type == context.UserEventType.EDIT ) { 
    
            var oldRecord = context.oldRecord;
            var newRecord = context.newRecord;

            var newAccess = newRecord.getValue({ fieldId: "giveaccess" });
            var oldAccess = oldRecord.getValue({ fieldId: "giveaccess" });

            newRecord.setValue({ fieldId: 'language',     value: "es_AR" });

            if( newAccess ) {
	
                var oldEmail = oldRecord.getValue({ fieldId: "email" });
                var newEmail = newRecord.getValue({ fieldId: "email" });
log.debug("newEmail", newEmail)
                if ( (oldEmail != newEmail) || oldAccess == false) {

                    var password  = getActualPassword(); 
     
                    /*Fields Filled*/
                    newRecord.setValue({ fieldId: 'giveaccess',   value: true     });
                    newRecord.setValue({ fieldId: 'accessrole',   value: 1060     });
                    newRecord.setValue({ fieldId: 'fillpassword', value: true     });
                    newRecord.setValue({ fieldId: 'password',     value: password });
                    newRecord.setValue({ fieldId: 'password2',    value: password });                         
                    if( newEmail ){
             
                        var url = getURL();
             
                        var RECIPIENT = newEmail;
                        var AUTHOR    = runtime.getCurrentUser().id;
            
                        var HEADER    = "Portal de Cliente Thermomix México (Acceso)";
                        var BODY      = "Estimado Cliente,\n\n"+
                                          "Te informamos que se te otorgo acceso a nuestro Portal de Clientes Thermomix México, "+ 
                                          "en él podrás generar tu factura electrónica, en caso de así requerirlo.\n\n"+
                                          "Recibirás un correo electrónico con la información necesaria para este efecto.\n\n"+
                                          "Te compartimos los datos de acceso:\n\n"+
                                          "Link de acceso: www.facturacionthermomix.com \n\n"+
                                          "Correo electrónico: "+newEmail+"\n\n"+
                                          "Contraseña: "+password+"\n\n"+
                                          "Te sugerimos cambiarr tu contraseña al momento de ingresar al portal.\n\n"+
                                          "Si requieres ayuda de nuestros Ejecutivos de Servicio a Clientes, los puedes contactar al teléfono 800 200 1121.\n\n"+
                                          "Atte:"+"\n\n"+
                                          "Thermomix México"+"\n\n"
            
                        email.send({
                            author:      AUTHOR,
                            recipients:  RECIPIENT,
                            subject:     HEADER,
                            body:        BODY,
                        });
                    }
                }
            }
        }

    }
 
    function getURL() {
         
        var URLRecord   = config.load({
                            type: config.Type.COMPANY_INFORMATION
                        });
         
        var customerCentre = URLRecord.getValue({ fieldId: "customersurl" });
 
        return customerCentre;
    }

    function getActualPassword() {

        var filters  = [                                                                                               
            ['isinactive', 'is', 'F']
        ];

        var password =  search.create({                                                                                     
                            type    : 'customrecord_nso_vor_customer_password',
                            filters : filters,
                            columns : [ 
                                search.createColumn({ name: 'custrecord_nso_vor_password', sort: search.Sort.DESC })             
                            ]
                        }).run().getRange({ start: 0, end: 1})[0];

        return password.getValue({ name: "custrecord_nso_vor_password" });

    }
     
     return {
         beforeSubmit : beforeSubmit
     };
 });