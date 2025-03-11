/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https','N/url','N/record','N/runtime','N/currentRecord','N/ui/message','N/log', 'N/search'],

function(https, url,record,runtime,currentRecord,message,log,search) {
    
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
        
        return true;
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
        return true;
    }
    function marcarPagado() {
    try {
        var object_fill = [];
        var record = currentRecord.get();
        var internalid = record.getValue('id');
        var level = record.getValue('custrecord_nivel_jerarquia');
        var comision_id = record.getValue('custrecord_periodo_comision');
        var periodText = record.getText('custrecord_periodo_comision');
        var levelText = record.getText('custrecord_nivel_jerarquia');
        
        var listLineCount = record.getLineCount({
            sublistId: "custpage_sublist_detail"
        });
        
        for (var i = 0; i < listLineCount; i++) {
            var checkPagado = record.getSublistValue({
                sublistId: "custpage_sublist_detail",
                fieldId: "custpage_pagado",
                line: i
            });
            
            if(checkPagado == 'Pagado') {
                var idReg = record.getSublistValue({
                    sublistId: "custpage_sublist_detail",
                    fieldId: "custpage_article_id",
                    line: i
                });
                
                object_fill.push({
                    idReg: idReg,
                    line: i
                });
            }
        }
        
        marcarCheck(object_fill);
        
    } catch(err) {
        console.error("Error en marcarPagado:", err);
    }
}

function marcarCheck(object_fill) {
    try {
        if (!object_fill || object_fill.length === 0) {
            console.log('No hay registros seleccionados para marcar');
            return;
        }
        
        var record = currentRecord.get();
        
        object_fill.forEach(function(obj) {
            record.selectLine({
                sublistId: 'custpage_sublist_detail',
                line: obj.line
            });
            
            record.setCurrentSublistValue({
                sublistId: 'custpage_sublist_detail',
                fieldId: 'custpage_select_field',
                value: true
            });
            
            record.commitLine({
                sublistId: 'custpage_sublist_detail'
            });
        });
        
    } catch(e) {
        console.error('Error en marcarCheck:', e);
    }
}
    function getSelectedData(){
        try{
            //extrae la informacion de la tabla
            var object_fill = [];
            var record = currentRecord.get();
            var level = record.getValue('custrecord_nivel_jerarquia');
            var comision_id = record.getValue('custrecord_periodo_comision');
            var periodText = record.getText('custrecord_periodo_comision');
            var levelText = record.getText('custrecord_nivel_jerarquia');
            console.log('record',record);
            var listLineCount = record.getLineCount({
              sublistId: "custpage_sublist_detail"
            });
            
            
            for (var i = 0; i < listLineCount; i++) {
                var check = record.getSublistValue({
                     sublistId: "custpage_sublist_detail",
                     fieldId: "custpage_select_field",
                     line: i
                });
                
                if(check == true){
                    var idReg = record.getSublistValue({
                        sublistId: "custpage_sublist_detail",
                        fieldId: "custpage_article_id",
                        line: i
                    });
                   var totalReg = record.getSublistValue({
                       sublistId: "custpage_sublist_detail",
                       fieldId: "custpage_total",
                       line: i
                    })
                    object_fill.push({idReg:idReg,level:level,comision_id:comision_id,totalReg:totalReg,periodText:periodText,levelText:levelText});
                    
                
                }
                
                
           }
            
            return object_fill;
        }catch(err){
            log.error("Error getSelectedData",err)
        }
    }
    function getSelectedDataNom(){
        try{
            //extrae la informacion de la tabla
            var object_fill = [];
            var record = currentRecord.get();
            var level = record.getValue('custrecord_nivel_jerarquia');
            var comision_id = record.getValue('custrecord_periodo_comision');
            var periodText = record.getText('custrecord_periodo_comision');
            var levelText = record.getText('custrecord_nivel_jerarquia');
            console.log('record',record);
            var listLineCount = record.getLineCount({
              sublistId: "custpage_sublist_detail"
            });
            
            
            for (var i = 0; i < listLineCount; i++) {
                var check = record.getSublistValue({
                     sublistId: "custpage_sublist_detail",
                     fieldId: "custpage_select_field",
                     line: i
                });
                var checkPagado = record.getSublistValue({
                     sublistId: "custpage_sublist_detail",
                     fieldId: "custpage_pagado",
                     line: i
                });
              log.debug('checkPagado',checkPagado)
                if(checkPagado != 'Pagado'){
                    if (confirm('Uno o más registros no estan pagados, ¿Desea Continuar?')) {
                        if(check == true){
                            var idReg = record.getSublistValue({
                                sublistId: "custpage_sublist_detail",
                                fieldId: "custpage_article_id",
                                line: i
                           });
                           var totalReg = record.getSublistValue({
                               sublistId: "custpage_sublist_detail",
                               fieldId: "custpage_total",
                               line: i
                          })
                            object_fill.push({idReg:idReg,level:level,comision_id:comision_id,totalReg:totalReg,periodText:periodText,levelText:levelText});
                            
                        
                        }
                    } else {
                        return false;
                    }
                }else{
                    if(check == true){
                        var idReg = record.getSublistValue({
                            sublistId: "custpage_sublist_detail",
                            fieldId: "custpage_article_id",
                            line: i
                        });
                       var totalReg = record.getSublistValue({
                           sublistId: "custpage_sublist_detail",
                           fieldId: "custpage_total",
                           line: i
                        })
                        object_fill.push({idReg:idReg,level:level,comision_id:comision_id,totalReg:totalReg,periodText:periodText,levelText:levelText});
                        
                    
                    }
                }
                
           }
            
            return object_fill;
        }catch(err){
            log.error("Error getSelectedData",err)
        }
    }
    
    function txt(){
        try{
              
            var obj = getSelectedData();
            var thisRecord = currentRecord.get();
            var url_aux = "",  arr_aux = [];
            console.log('obj',obj.length);
            if(obj.length < 1){
                alert('Seleccione al menos un registro que contenga como total una cantidad mayor a 0')
            }else{
                for(var x in obj){
                    arr_aux.push(obj[x].idReg)
                }
                var objIds = {recordType: thisRecord.type,recordId:thisRecord.id,ids:arr_aux.join()}
                if(runtime.envType != 'PRODUCTION'){ 
                    url_aux = 'https://3367613-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=3367613_SB1&h=28b3c54f72ae6b777dc9'
                }else{
                    url_aux ='https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=3367613&h=458a9dc3b85d84c7c480';
                }; 
                var headers = {"Content-Type": "application/json"};
                var res = https.post({
                    url: url_aux,
                    headers: headers,
                    body: JSON.stringify(objIds)
                }).body;
                
                
                var rep = JSON.parse(res);
                console.log('response',res);
                log.debug("response",rep.id);
                
                var idFile = rep.id;
                
                if(!!idFile){
                    
                    window.open(url_aux+'&idfile='+idFile);
                }
               
                log.debug("response",response);
                
                
            }
        }catch(err){
            log.error("txt error",err)
        }
        
 
    }
    function layout_HSBC(){
        try{
              
            var obj = getSelectedData();
            var thisRecord = currentRecord.get();
            var url_aux = "",  arr_aux = [];
            console.log('obj',obj.length);
            if(obj.length < 1){
                alert('Seleccione al menos un registro que contenga como total una cantidad mayor a 0')
            }else{
                for(var x in obj){
                    arr_aux.push(obj[x].idReg)
                }
                var objIds = {recordType: thisRecord.type,recordId:thisRecord.id,ids:arr_aux.join()}
                if(runtime.envType != 'PRODUCTION'){ 
                    console.log('URL SANDBOX');
                    url_aux = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1632&deploy=1'
                }else{
                    console.log('URL PRODUCTION');
                    url_aux ='https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1234&deploy=1';
                }; 
                var headers = {"Content-Type": "application/json"};
                console.log('001');
                var res = https.post({
                    url: url_aux,
                    headers: headers,
                    body: JSON.stringify(objIds)
                }).body;
                
                console.log('002',res);
                var rep = JSON.parse(res);
                console.log('response',res);
                console.log('response',rep);
                log.debug("response",rep.id);
                
                var idfile = rep.id;
                console.log('idFile1',idfile);
                try{
                    if(idfile.includes('-')){
                    idfile = idfile.split('-')
                    log.debug('archivos','idfile[0]'+idfile[0]+' idfile[1] '+idfile[1])
                    window.open(url_aux+'&idfile='+idfile[0]);
                    window.open(url_aux+'&idfile='+idfile[1]);
                }
                }catch(e){
                    if(!!idfile){
                    window.open(url_aux+'&idfile='+idfile);
                    }
                }
                log.debug("response",response);
            }
        }catch(err){
            console.log('layout_HSBC error',err);
            log.error("layout_HSBC error",err)
        }
    }
    function nomina(){
        try{
            var url_aux = ""
            if(runtime.envType != 'PRODUCTION'){ 
                url_aux = "https://3367613-sb1.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&datefrom=3%2F9%2F2020&dateto=3%2F9%2F2020&scripttype=568&primarykey=&jobstatefilterselect=&sortcol=dateCreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=XC8MEeA9RWlvYvXprkCo2j_ZOjHBgMRvpFEMUFaSSZZ59cK-6H3TYHyQdaFe8Ku-20spfhfzq2XnKEYS_hAn73PyT8bzHDA6iNmbtu3oXQjK8l81ygn_XqmK0hJv2OvytuG351pzcgLs-hhkI9gKU-lk5Cy6y5UXcvvTRb_1Cfs%3D&datemodi=WITHIN&date=TODAY&showall=F"
            }else{
                url_aux ='https://3367613.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?whence=';
            };   
            var myMsg = message.create({
                title: "Timbrado de nomina",
                message: "Para ver el progreso del timbrado de click al siguiente enlace: <a href='"+url_aux+"'>Ver Progreso<a>",
                type: message.Type.CONFIRMATION
            });
            myMsg.show({
                duration: 5000
            });
            var obj = getSelectedDataNom();
            if(obj != false){
                var url_aux = (runtime.envType != 'PRODUCTION') ? 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1' : 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1';
                //envia la información por metodo put al map vorwerk commission map
                var headers = {"Content-Type": "application/json"};
                var res = https.put({
                    url: url_aux,
                    headers: headers,
                    body: JSON.stringify({obj:obj,type_req:"payrollProcess"})
                }).body;
                log.debug('fin nomina')
            }
            
        }
        catch(e){
          
            log.error('There is an error in nomina process',e);
        }
    }
    function cfdiReporteSend(){
        try{
            var url_aux = ""
            if(runtime.envType != 'PRODUCTION'){ 
                url_aux = "https://3367613-sb1.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&datefrom=3%2F9%2F2020&dateto=3%2F9%2F2020&scripttype=1506&primarykey=&jobstatefilterselect=&sortcol=dateCreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=XC8MEeA9RWlvYvXprkCo2j_ZOjHBgMRvpFEMUFaSSZZ59cK-6H3TYHyQdaFe8Ku-20spfhfzq2XnKEYS_hAn73PyT8bzHDA6iNmbtu3oXQjK8l81ygn_XqmK0hJv2OvytuG351pzcgLs-hhkI9gKU-lk5Cy6y5UXcvvTRb_1Cfs%3D&datemodi=WITHIN&date=TODAY&showall=F"
            }else{
                url_aux ='https://3367613.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?whence=';
            };  
            var myMsg = message.create({
                title: "Envio de email ",
                message: "Para ver el progreso del envio de los Registros de compensacion y CFDI de click al siguiente enlace: <a href='"+url_aux+"'>Ver Progreso<a>",
                type: message.Type.CONFIRMATION
            });
            myMsg.show({
                duration: 5000
            });
            var obj = getSelectedData();
            var url_aux = (runtime.envType != 'PRODUCTION') ? 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1' : 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1';
            //envia la información por metodo put al map vorwerk commission map
            var headers = {"Content-Type": "application/json"};
            var res = https.put({
                url: url_aux,
                headers: headers,
                body: JSON.stringify({obj:obj,type_req:"emailXML-PDF-R"})
            }).body;
            log.debug('entramos boton nuevo')
        }catch(e){
            log.debug('error envio de tres',e)
        }
    }
    function emailSend(){
        try{
            var url_aux = ""
            if(runtime.envType != 'PRODUCTION'){ 
                url_aux = "https://3367613-sb1.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&datefrom=3%2F9%2F2020&dateto=3%2F9%2F2020&scripttype=568&primarykey=&jobstatefilterselect=&sortcol=dateCreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=XC8MEeA9RWlvYvXprkCo2j_ZOjHBgMRvpFEMUFaSSZZ59cK-6H3TYHyQdaFe8Ku-20spfhfzq2XnKEYS_hAn73PyT8bzHDA6iNmbtu3oXQjK8l81ygn_XqmK0hJv2OvytuG351pzcgLs-hhkI9gKU-lk5Cy6y5UXcvvTRb_1Cfs%3D&datemodi=WITHIN&date=TODAY&showall=F"
            }else{
                url_aux ='https://3367613.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?whence=';
            };
            
            var myMsg = message.create({
                title: "Envio de email",
                message: "Para ver el progreso del envio de email de click al siguiente enlace: <a href='"+url_aux+"'>Ver Progreso<a>",
                type: message.Type.CONFIRMATION
            });
            myMsg.show({
                duration: 5000
            });
            var url_aux = ""
            if(runtime.envType != 'PRODUCTION'){ 
                url_aux ='https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1';
            }else{
                url_aux ='https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1';
            };
            //envia la información por metodo put al map vorwerk commission map
            var headers = {"Content-Type": "application/json"};
            var obj = getSelectedData();
            var res = https.put({
                url: url_aux,
                headers: headers,
                body: JSON.stringify({obj:obj,type_req:"email"})
            }).body;
        }catch(err){
            log.error("Error emailSend",err);
        }
           
//        console.log('res',res);
    }
    function massivepdf(period){
        try{
            var url_aux = ""
            if(runtime.envType != 'PRODUCTION'){ 
                url_aux = "https://3367613-sb1.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&datefrom=7%2F10%2F2021&dateto=7%2F10%2F2021&scripttype=1624&primarykey=&jobstatefilterselect=&sortcol=dateCreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=EgE7RsuFDWpViHlMYIFqNTCiHrxdWIYE-Uwk6yveiO37ES9qPkYyS46dFFIgiJ91va3YyRfY27jsQYA74-Npd1-nTsZHTQRKdb0qLpYIffqRRwGavOMQZaTf9AeJBPVa5EF-T49wFzEvpgQrekY3opmKVTqpqrSnFVBEId-Xeb8%3D&datemodi=WITHIN&date=TODAY&showall=F"
            }else{
                url_aux ='https://3367613.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&datefrom=12%2F10%2F2021&dateto=12%2F10%2F2021&scripttype=1233&primarykey=&jobstatefilterselect=&sortcol=dateCreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=WDGriuZuloIKSBQzqoyfyIh4tjbLBDW8itSPorYqYaz3qbX2kFD0v8yH5rp9fdzcA6yN2rgo0RXlm2m2JyAED9O2XRQl_i1JLS2Eo7ion20lOAd7LGakGVCeupOmlMpuyX-2wOUuSR5JaboUkPimkPwRJYFpRJQwSuj0M-nqLTY%3D&datemodi=WITHIN&date=TODAY&showall=F';
            };
            var myMsg = message.create({
                title: "Envio de email",
                message: "Para ver el progreso de guardado de click al siguiente enlace: <a href='"+url_aux+"'>Ver Progreso<a>",
                type: message.Type.CONFIRMATION
            });
            myMsg.show({
                duration: 5000
            });
            var url_aux = ""
            if(runtime.envType != 'PRODUCTION'){ 
                url_aux ='https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1';
            }else{
                url_aux ='https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=569&deploy=1';
            };
            var headers = {"Content-Type": "application/json"};
            var obj = getSelectedData();
            var res = https.put({
                url: url_aux,
                headers: headers,
                body: JSON.stringify({obj:obj,type_req:"massivepdf"})
            }).body;
        }catch(err){
            log.error("Error massivepdf",err);
        }
    }
    
    function policycreate(period){
        
        var sumjdg_subt= 0;
        var sumjdg_ret= 0;
        var sumjdg_total= 0;
        
        var sumpre_subt= 0;
        var sumpre_ret= 0;
        var sumpre_total= 0;
        
        var sumgtm_subt= 0;
        var sumgtm_ret= 0;
        var sumgtm_total= 0;
            try{
                var periodos = {};
                var busqueda = search.create({
                    type: 'customrecord_registro_compensaciones',
                    columns: ['custrecord_periodo_comision','internalid','custrecord_nivel_jerarquia'],
                    filters: [
                        ['custrecord_periodo_comision','anyof',period]
                    ]
                });
                busqueda.run().each(function(r){
                    periodos[r.getValue('custrecord_nivel_jerarquia')]={
                        idperiodo:r.getValue('internalid')
                    }
                         return true
                });
            }catch(err){
                log.debug('erroridperiodo',err);
            }
            try{
            var busqueda = search.create({
                type: 'customrecord_vw_conf_poliza',
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }
                ],
                columns: 
                    ['custrecord_vw_encabezado_poliza','custrecord_vw_account']
                
            });
            console.log(":)")
            var headers ={};
            busqueda.run().each(function(r){
                
                headers[r.getText('custrecord_vw_encabezado_poliza')]={
                    
                    account:r.getValue('custrecord_vw_account'),
                    
                    
                }
             
                         
                 
                return true;
            });
            console.log(":)")
            log.debug('headers',headers);
            log.debug('periodo',periodos);
            for (var x in headers){
                console.log(x,headers[x])
            }
            
            
        }catch(err){
            log.error("error policycreate",err);
            console.log("err",err)
        }
        try{
            
            var busqueda = search.create({
                type: 'customrecord_compensaciones_jdg',
                filters: [
                    {
                        name: 'custrecord_sub__registro_compensaciones',
                        operator: 'is',
                        values: periodos["3"].idperiodo
                    }
                ],
                columns: 
                    ['custrecord_c_jdg_subtotal','custrecord_c_jdg_retencion','custrecord_c_jdg_total']
                
            });
            console.log(":)")
            var compesationjdg =[];
            busqueda.run().each(function(r){
                
                compesationjdg.push({
                    subtotal:r.getValue('custrecord_c_jdg_subtotal')||0,
                    retencion:r.getValue('custrecord_c_jdg_retencion')||0,
                    total:r.getValue('custrecord_c_jdg_total')||0
                })
             
                         
                 
                return true;
            });
            
            
            for(var x in compesationjdg){
                sumjdg_subt+=parseFloat(compesationjdg[x].subtotal);
                sumjdg_ret+=parseFloat(compesationjdg[x].retencion);
                sumjdg_total+=parseFloat(compesationjdg[x].total);
                console.log('sumjdg_subt',sumjdg_subt);
            }
            
            console.log("sumjdg_subt"+sumjdg_subt)
            console.log("sumjdg_ret"+sumjdg_ret)
            console.log("sumjdg_total"+sumjdg_total)
            log.debug('compesationjdg',compesationjdg);
        }catch(err){
            log.error("error compesationjdg",err);
            console.log("error",err)
            
            
            
        }
        try{
            
            var busqueda = search.create({
                type: 'customrecord_comisiones_presentadora',
                filters: [
                    {
                        name: 'custrecord_sub_registro_compensaciones_p',
                        operator: 'is',
                        values: periodos["1"].idperiodo
                    }
                ],
                columns: 
                    ['custrecord_c_pre_subtotal','custrecord_c_pre_retencion','custrecord_c_pre_total']
                
            });
            console.log(":)")
            var compesationpre =[];
            busqueda.run().each(function(r){
                
                compesationpre.push({
                    subtotal:r.getValue('custrecord_c_pre_subtotal')||0,
                    retencion:r.getValue('custrecord_c_pre_retencion')||0,
                    total:r.getValue('custrecord_c_pre_total')||0
                })
             
                         
                 
                return true;
            });
           
            for(var x in compesationpre){
                sumpre_subt+=parseFloat(compesationpre[x].subtotal);
                sumpre_ret+=parseFloat(compesationpre[x].retencion);
                sumpre_total+=parseFloat(compesationpre[x].total);    
            }
            
            console.log(":)")
            log.debug('compesationpre',compesationpre);
        }catch(err){
            log.error("error compesationpre",err);
            console.log("error",err)
        }
        try{
            
            var busqueda = search.create({
                type: 'customrecord_compensaciones_gtm',
                filters: [
                    {
                        name: 'custrecord_sub_registro_compensaciones_g',
                        operator: 'is',
                        values: periodos["2"].idperiodo
                    }
                ],
                columns: 
                    ['custrecord_c_gtm_subtotal','custrecord_c_gtm_retencion','custrecord_c_gtm_total']
                
            });
            console.log(":)")
            var compesationgtm =[];
            busqueda.run().each(function(r){
                
                compesationgtm.push({
                    subtotal:r.getValue('custrecord_c_gtm_subtotal')||0,
                    retencion:r.getValue('custrecord_c_gtm_retencion')||0,
                    total:r.getValue('custrecord_c_gtm_total')||0
                    
                })
             
                return true;
                
            });
 
            for(var x in compesationgtm){
                sumgtm_subt+=parseFloat(compesationgtm[x].subtotal);
                sumgtm_ret+=parseFloat(compesationgtm[x].retencion);
                sumgtm_total+=parseFloat(compesationgtm[x].total);
            }
            
            console.log(":)")
            log.debug('compesationgtm',compesationgtm);
        }catch(err){
            log.error("error compesationgtm",err);
            console.log("error",err)
        }
        
        try{
            var sumpre_tm = sumpre_subt + sumgtm_subt;
            var sumRete = sumgtm_ret + sumpre_ret + sumjdg_ret;
            var pagoTotal =  sumgtm_total + sumpre_total + sumjdg_total
            var jeRec = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            console.log('headers',headers);
            console.log('headers["Subtotal LE"].account',headers["Subtotal LE"].account);
            // Debit Subtotal LE
            jeRec.selectNewLine({
                sublistId: 'line'
            });
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                value: headers["Subtotal LE"].account
            }); // Accounts Payable
            log.debug('1','1');
            log.debug('sumjdg_subt',sumjdg_subt);
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
                value: sumjdg_subt
            });
            
            jeRec.commitLine({
                sublistId: 'line'
            });
            // Debit Sub Pre - TTM
            jeRec.selectNewLine({
                sublistId: 'line'
            });
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                value: headers["Subt Pre - TTM"].account
            }); // Accounts Payable
            log.debug('2','2');
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
                value: sumpre_tm
            });
            log.debug('sumpre_tm',sumpre_tm);
            jeRec.commitLine({
                sublistId: 'line'
            });
            
            // Credit sum Ret_isr
            jeRec.selectNewLine({
                sublistId: 'line'
            });
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                value: headers["Suma de la RET. ISR"].account
            }); // Accounts Receivable
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                value: sumRete
            });
            log.debug('sumRete',sumRete);
            jeRec.commitLine({
                sublistId: 'line'
            });
            
            // Credit Total 
            jeRec.selectNewLine({
                sublistId: 'line'
            });
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                value: headers["Total Pagado"].account
            }); // Accounts Receivable
            jeRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                value: pagoTotal
            });
            log.debug('pagoTotal',pagoTotal);
            jeRec.commitLine({
                sublistId: 'line'
            });
            var idRec =jeRec.save();
            
        }catch(err){
            log.debug('error subtotales ',err);
            alert("Hubo un error en el registro  "+err.message);
        }
        try{
            var url_aux = ""
                if(runtime.envType != 'PRODUCTION'){ 
                    url_aux = "https://3367613-sb1.app.netsuite.com/app/accounting/transactions/journal.nl?id="+idRec;
                }else{
                    url_aux ='https://3367613.app.netsuite.com/app/accounting/transactions/journal.nl?id='+idRec;
                };   
                var myMsg = message.create({
                    title: "Creacion de Poliza",
                    message: "Para ver el registro creado de click al siguiente enlace: <a href='"+url_aux+"'>Ver Progreso<a>",
                    type: message.Type.CONFIRMATION
                });
                myMsg.show({
                    duration: 5000
                });
        }catch(err){
            log.debug("errorMensajepoliza",err)
        }
        

    }
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        marcarCheck: marcarCheck,
        marcarPagado: marcarPagado,
        saveRecord: saveRecord,
        txt: txt,
        nomina:nomina,
        cfdiReporteSend:cfdiReporteSend,
        emailSend:emailSend,
        policycreate:policycreate,
        massivepdf:massivepdf,
        layout_HSBC:layout_HSBC
    };
    
});
