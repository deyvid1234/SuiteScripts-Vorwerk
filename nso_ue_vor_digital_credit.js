/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Autor Leopoldo Santiago
 * @Company Netsoft
 * @NModuleScope Public
 * @Name NSO | UE | VOR | EMPLOYEE JSON
 * @Description Genera archivo JSON del registro del empleado y mandarlo hacia Digital Credit.
 * ScriptName: nso_ue_vor_digital_credit.js
 * idScript: customscript_nso_ue_vor_employee_json
 * idDeploy: customdeploy_nso_ue_vor_employee_json
 * Fecha: 25/08/2022
 */
/*Token digital credit*/
define(["N/record", "N/search", "N/error", "N/format", "N/runtime", "N/https", "N/file", "N/url"], function (record, search, error, format, runtime, https, file, url) {

    let handler = {}, executionScript = null, AMBIENTE = null;
    const headerObj = {
        "Content-Type": "application/x-www-form-urlencoded",
    };
    const ERRORES = {
        ERROR_ENDPOINT: {
            name: "ERROR_ENDPOINT",
            message: {
                en: "THE SETUP RECORD FOR DIGITAL CREDIT HAS NOT BEEN FOUND, VALIDATE THE RECORD Setup Digital Credit.",
                es: "NO SE HA ENCONTRADO EL REGISTRO DE CONFIGURACION PARA DIGITAL CREDIT, VALIDA EL REGISTRO Setup Digital Credit.",
            },
        },
        ERROR_TOKEN: {
            name: "ERROR_TOKEN",
            message: {
                en: "THE SALESFORCE SERVER IS HAVING CONNECTION PROBLEMS SO THE EXCHANGE TYPE CANNOT BE SENT, VALIDATE THE ACCESS KEYS AND ENDPOINT TOKEN.",
                es: "EL SERVIDOR DE SALESFORCE ESTA RESPONDIENDO CON CODIGOS NO EXITOSOS, VALIDE LAS CLAVES DE ACCESO Y EL ENDPOINT TOKEN.",
            },
        },
        ERROR_SALESFORCE: {
            name: "ERROR_SALESFORCE",
            message: {
                en: "THE SALESFORCE SERVER IS HAVING CONNECTION PROBLEMS SO THE EXCHANGE TYPE CANNOT BE SENT, VALIDATE IT WITH SYSTEM ADMINISTRATOR.",
                es: "EL SERVIDOR DE SALESFORCE ESTA RESPONDIENDO CON CODIGOS NO EXITOSOS, VALIDELO CON EL ADMINISTRADOR DEL SISTEMA.",
            },
        },
        ERROR: {
            name: "ERROR",
            message: {
                en: "ERROR.",
                es: "ERROR.",
            },
        },
    };

    let contactID = (idCustomer) => {
        let resultObj = "custentity_nso_bay_code_sf";
        let searchObj = search.create({
            type: "contact",
            filters: [["company", "anyof", idCustomer], "AND", ["category", "is", "1"], "AND", ["isinactive", "is", "F"]],
            columns: [search.createColumn(resultObj)],
        });
        resultObj = searchObj.runPaged().count ? searchObj.run().getRange({ start: 0, end: 1 })[0].getValue(resultObj) : "";
        return resultObj;
    };

    let buildEmployee = (employee, status) => {
        let dataEmployee = {};
        let dataFields   = search.lookupFields({ type: 'employee', id: runtime.getCurrentUser().id, columns: ['entityid'] });
        if(employee.getValue('isinactive')){
            dataEmployee = {
                company   : '404',
                userId    : employee.getValue('entityid'),
                userAlter : dataFields.entityid
            };
        }
        else{
            let apellidos = String(employee.getValue('lastname')).split(' ');
            dataEmployee  = {
                name           : employee.getValue('firstname'),
                lastName       : apellidos.length > 0 ? apellidos[0] : '',
                secondLastName : apellidos.length > 1 ? apellidos[1] : '',
                company        : "404",
                email          : employee.getValue('email'),
                numberphone    : employee.getValue('mobilephone'),
                languageId     : "M",
                userId         : employee.getValue('entityid'),
                userReg        : dataFields.entityid,
                option         : status,
                commerceId     : parseInt(employee.getText('custentity_commerceid_dc') || 0)
            };
        }
        return dataEmployee;
    };

    let getEndpoint = () => {
        var setupDigital = {};
        var endpointSearchObj = search.create({
            type: "customrecord_nso_vor_setup_digital",
            filters:
                [
                    ["isinactive","is","F"]
                ],
            columns:
                [
                    search.createColumn({name: "custrecord_nso_vor_url_sandbox_baja", label: " ENDPOINT SANDBOX BAJAS"}),
                    search.createColumn({name: "custrecord_nso_vor_url_produccion_baja", label: "ENDPOINT PRODUCCIÓN BAJAS"}),
                    search.createColumn({name: "custrecord_nso_vor_url_produccion", label: "ENDPOINT PRODUCCIÓN CREAR/MODIFICAR"}),
                    search.createColumn({name: "custrecord_nso_vor_url_sandbox", label: "Endpoint Sandbox Crear/Modificar"}),
                    search.createColumn({name: "custrecord_nso_vor_token_produccion", label: "Token Produccion"}),
                    search.createColumn({name: "custrecord_nso_vor_token_sandbox", label: "Token Sandbox"}),
                    search.createColumn({name: "custrecord_nso_vor_type_employee", label: "Tipo Empleado"})
                ]
        });
        let resultants = endpointSearchObj.run().getRange({ start: 0, end: 1 });
        if (resultants.length > 0) {
            setupDigital.urlAltaSandbox    = resultants[0].getValue("custrecord_nso_vor_url_sandbox");
            setupDigital.urlBajaSandbox    = resultants[0].getValue("custrecord_nso_vor_url_sandbox_baja");
            setupDigital.tokenSandbox      = resultants[0].getValue("custrecord_nso_vor_token_sandbox");
            setupDigital.urlAltaProduccion = resultants[0].getValue("custrecord_nso_vor_url_produccion");
            setupDigital.urlBajaProduccion = resultants[0].getValue("custrecord_nso_vor_url_produccion_baja");
            setupDigital.tokenProduccion   = resultants[0].getValue("custrecord_nso_vor_token_produccion");
            setupDigital.tipoEmployee      = resultants[0].getValue("custrecord_nso_vor_type_employee").split(',')
        }
        return setupDigital;
    };

    let updatedRecord = (typeRecord, idRecord, dataFields) => {
        for (let j = 0; j < 5; j++) {
            try {
                let id = record.submitFields({
                    type: typeRecord,
                    id: idRecord,
                    values: dataFields,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    },
                });
                return id;
            } catch (e) {
                log.error("ERROR_PARTIDA_UPDATED", e);
                if (e.name && e.name != "RCRD_HAS_BEEN_CHANGED") {
                    //Si el error es otra cosa que no sea el record ha cambiado se cancela el proceso
                    throw e;
                }
            }
        }
    };

    handler.beforeLoad = (context) => {
        let { type, newRecord, form } = context;
        try {
            if(type == 'create' || type == 'copy'){
                newRecord.setValue({ fieldId: 'custentity_nso_vor_code_digital', value: '' });
                newRecord.setValue({ fieldId: 'custentity_nso_vor_message_digital', value: '' });
            }
        }catch (e) {
            log.error('ERROR_BEFORE_LOAD', e);
        }
    };

    handler.beforeSubmit = (context) => {
        let { type, newRecord, oldRecord } = context;
        let fields = {};
        log.debug('type', type);
        executionScript = runtime.executionContext;
        log.debug('executionScript', executionScript);
        try{
            if(type == "edit"){
                let isInactive    = newRecord.getValue('isinactive');
                let isInactiveOld = oldRecord.getValue('isinactive');
                let dateBaja      = newRecord.getValue('custentity59');
                let dateBajaOld   = oldRecord.getValue('custentity59');
                if((isInactive != isInactiveOld && !isInactive) && (dateBaja != dateBajaOld && !dateBaja)){
                    newRecord.setValue({ fieldId: 'custentity_nso_vor_reactivacion', value: true });
                    log.debug('MESSAGE_BEFORE', 'REACTIVACION CLIENTE');
                }
            }
        }catch (e) {
            log.error('ERROR_BEFORE_SUBMIT', e);
            throw e;
        }
    };

    handler.afterSubmit = (context) => {
        let { type, newRecord, oldRecord } = context;
        let fields = {};
        log.debug('type', type);
        executionScript = runtime.executionContext;
        log.debug('executionScript', executionScript);
        //AMBIENTE = runtime.getCurrentScript().getParameter({ name: "custscript_nso_bay_enviroment_developefa" }); //<- HACIA QUE AMBIENTE DE SF ENVIA LA PETICIONES
        AMBIENTE = runtime.envType == 'PRODUCTION' ? 1 : 2;//1-> PRODUCCION SF , 2-> SANDBOX SF
        try {
            if (type == "create" || type == "edit" || (type == 'xedit' && executionScript == 'USEREVENT')) {
                let setupDigital = getEndpoint(); // Claves del cliente
                if (!Object.keys(setupDigital).length) {
                    throw error.create({name: ERRORES.ERROR_ENDPOINT.name, message: ERRORES.ERROR_ENDPOINT.message["es"] });
                }
                let employee = record.load({ type: newRecord.type, id: newRecord.id, isDynamic: true }); // Con consulta o lookupFields
                let tipoEmployee = employee.getValue('employeetype');
                let isSalesRep   = employee.getValue('issalesrep');
                let isInactive   = employee.getValue('isinactive');
                let dateBaja     = employee.getValue('custentity59');
                if (!isSalesRep) { return; }
                if (!setupDigital.tipoEmployee.includes(tipoEmployee)) { return; }
                if(isInactive && !dateBaja){ return; }
                //--------------------------------------- Obtener Data Employee ----------------------------------------
                let createCheck   = employee.getValue('custentity_nso_vor_check_digital');
                let reactivaCheck = employee.getValue('custentity_nso_vor_reactivacion');
                let dataEmployee  = buildEmployee(employee, type == 'create' || ((type == 'xedit' || type == 'edit') && !createCheck) ? 1 : reactivaCheck ? 3 : 2);
                log.debug("dataEmployee", dataEmployee);
                //------------------------------------- ENVIAR JSON A Digital Credit -----------------------------------
                let token = null, urlServer = null;
                /*token     = runtime.envType == 'PRODUCTION' ? setupDigital.tokenProduccion : setupDigital.tokenSandbox;*/
                token = "aa" 
                if(employee.getValue('isinactive')){
                    urlServer = runtime.envType == 'PRODUCTION' ? setupDigital.urlBajaProduccion : setupDigital.urlBajaSandbox;
                }
                else{
                    urlServer = runtime.envType == 'PRODUCTION' ? setupDigital.urlAltaProduccion : setupDigital.urlAltaSandbox;
                }
                let headerEmployee = { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + token,Header1: '090d0fc16045ece86947664c91db3d2a8b6f588c', Header2:'af70fbfef1504f69a2153aafa201142dd22ddc64'};
                //log.audit('DATA_ENDPOINT', {urlServer, token});
                log.debug('urlServer',urlServer)
                log.debug('header',headerEmployee)
                log.debug('Json body',JSON.stringify(dataEmployee))
                let customResponse = https.post({ url: urlServer, body: JSON.stringify(dataEmployee), headers: headerEmployee });
                log.debug(`DIGITAL_CREDIT_RESPONSE_FOR_EMPLOYEE: ${employee.id}`, JSON.stringify(customResponse));
                let bodyResponse   = JSON.parse(customResponse.body);
                if (customResponse.code != 200) {
                    let err = { code: customResponse.code, error: bodyResponse };
                    fields.custentity_nso_vor_message_digital = JSON.stringify(err);
                    fields.custentity_nso_vor_code_digital    = 'NOK';
                    updatedRecord(newRecord.type, newRecord.id, fields);
                    return;
                }
                if (bodyResponse.code != 200) {
                    let err = { code: bodyResponse.code, error: bodyResponse };
                    fields.custentity_nso_vor_code_digital    = 'NOK';
                    fields.custentity_nso_vor_message_digital = JSON.stringify(err);
                }
                else {
                    if(!employee.getValue('isinactive')){
                        fields.custentity_nso_vor_message_digital = "LA INFORMACIÓN DE ESTE EMPLEADO HA SIDO ENVIADO A DIGITAL CREDIT DE MANERA EXITOSA.";
                        fields.custentity_nso_vor_code_digital    = bodyResponse.result.userId;
                    }
                    else{
                        fields.custentity_nso_vor_message_digital = "EL EMPLEADO HA SIDO DADO DE BAJA EN DIGITAL CREDIT DE MANERA EXITOSA.";
                    }
                    fields.custentity_nso_vor_check_digital = true;
                    fields.custentity_nso_vor_reactivacion  = false;
                }
                updatedRecord(newRecord.type, newRecord.id, fields);
            }
        } catch (e) {
            log.error("ERROR_AFTER_SUBMIT", e);
            fields.custentity_nso_vor_code_digital    = 'NOK';
            fields.custentity_nso_vor_message_digital = JSON.stringify(e);
            updatedRecord(newRecord.type, newRecord.id, fields);
        }
    };

    return handler;

});