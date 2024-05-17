/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/https','N/currentRecord','N/runtime','N/file','N/search','N/ui/message'],

function(record,https,currentRecord,runtime,file,search,message) {
    
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
        try{
            
            console.log(scriptContext);
            var record = scriptContext.currentRecord
            var period = record.getValue('custpage_date');  
            console.log('period',period);
            var promo = record.getValue('custpage_promo');  
            console.log('promo',promo);
            var type = record.getValue('custpage_type_');  
            if(record =="" || promo =="" || type ==""){
                alert("Debe ingresar valores");
                return false;
            }
            var myMsg = message.create({
                title: "Reporte de comisiones",
                message: "Por favor, espere mientras se ejecuta la estructura inicial",
                type: message.Type.CONFIRMATION
            });
            myMsg.show({
                duration: 10000
            });
            try{
                if(runtime.envType != 'PRODUCTION'){ 
                    url = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=578&deploy=1';//cambiar para sandbox
                }else{
                    url = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=578&deploy=1';
                }
                var headers = {'Content-Type': 'application/json'};
                var response = https.post({
                    url: url,
                    body : JSON.stringify({period:period,promo:promo,type:type}),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).body;
                
                var rep = JSON.parse(response);
                record.setValue('custpage_search_aux1',rep.idFile1);
                record.setValue('custpage_search_aux2',rep.idFile2);
                return true;
            }catch(e){
                console.log('error file',e);
                alert("Memoria de Netsuite tiene problemas para generar estructura 1");
                return false;
            }
        }catch(err){
            console.log(err);
            alert("Memoria de Netsuite tiene problemas");
        }
        
    }
    
    
    function getData(){
        try{
            
            //extrae la informacion de la tabla
            var object_fill = [];
            var obj_conf = {};
            var record = currentRecord.get();
            var id_concat ="";
            console.log('record',record);
            var listLineCount = record.getLineCount({
              sublistId: "sublist"
            });
            var period = record.getValue('custpage_date');  
            console.log('period',period);
            var promo = record.getValue('custpage_promo');  
            console.log('promo',promo);
            var type = record.getValue('custpage_type_');  
            console.log('type',type);
            if(promo == 1){
                type = 2;
            }
            
            obj_conf['period']= period;
            obj_conf['promo']= promo;
            obj_conf['type']= type;
    
            for (var i = 0; i < listLineCount; i++) {
                var check = record.getSublistValue({
                     sublistId: "sublist",
                     fieldId: "select_field",
                     line: i
                });
                if(check == true){
                    var num_garantia = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_garantia_num",
                        line: i
                    });
                    var monto_garantia = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_garantia_monto",
                        line: i
                    });
                    var ids_garantia = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_garantia_ids",
                        line: i
                    });
                    var num_ck = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_cookkey",
                        line: i
                    });
                    var total_ck = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_cookkey_comision",
                        line: i
                    });
                    var idEmp = record.getSublistValue({
                         sublistId: "sublist",
                         fieldId: "nombre",
                         line: i
                    });
                    
                    var nameEmp = record.getSublistText({
                        sublistId: "sublist",
                        fieldId: "nombre",
                        line: i
                   });
                    
                    var ingreso = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "ingreso",
                        line: i
                   });
                    var nombre_unidad = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_nombre_unidad",
                        line: i
                   });
                    var ventas_propias_num = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_jdg",
                        line: i
                    });
                   var ventas_propias_ids = record.getSublistValue({
                       sublistId: "sublist",
                       fieldId: "custentity_odv_jdg_ids",
                       line: i
                    });
                    var ventas_propias_total = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_venta_propia",
                        line: i
                    });
                    var ventas_present_num = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_pre",
                        line: i
                    });
                    var ventas_present_total = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_venta_equipo",
                        line: i
                    });
                    var entrega = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_entrega",
                        line: i
                    });
                    var bono_productividad = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_productividad",
                        line: i
                    });
                    var bono_emerald = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_emerald",
                        line: i
                    });
                    var bono_talento = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_talento",
                        line: i
                    });
                    var bono_reclutadora = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_rec",
                        line: i
                    });
                    var subtotal = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_subtotal",
                        line: i
                    });
                    var total = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_total",
                        line: i
                    });
                    var ajuste = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_ajuste",
                        line: i
                    });
                    var retencion = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_retencion",
                        line: i
                    });
                    var num_entrega = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_num_entrega",
                        line: i
                    });
                    var odv_rec_id = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_comisionables_rec",
                        line: i
                    });
                    var odv_pre_id = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_comisionables_pre",
                        line: i
                    });
                    
                    
                    var tm_pagada = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_tmpagada",
                        line: i
                    });
                    var total_venta_propia = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_total_ventas_p",
                        line: i
                    });
                    var tm_pagadas_equipo = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_tmpagada_pre",
                        line: i
                    });
                    var porcentaje = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_porcentaje",
                        line: i
                    });
                    var odv_de_recliutas = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_rec",
                        line: i
                    });
                    var tm_pagadas_rec = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_tmpagada_rec",
                        line: i
                    });
                    var tm_ganadas = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_tm_ganadas_num",
                        line: i
                    });
                    var acumulado_de_ventas = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_suma_ventas_total",
                        line: i
                    });
                    var odv_entrega = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_entrega",
                        line: i
                    });
                    //3 + 2 y 5 + 2 
                    var odv_rec_del_periodo = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_rec_del_periodo",
                        line: i
                    });
                    var rec_period_le = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_rec_de_le_del_periodo",
                        line: i
                    });
                    var rec_con_ventas = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_rec_con_ventas",
                        line: i
                    });
                    var bono_tres_dos = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_tres_dos",
                        line: i
                    });
                    var bono_cinco_dos = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_cinco_dos",
                        line: i
                    });

                    var odv_pre_supercomision = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_odv_pre_supercomision",
                        line: i
                    });
                    var ventas_sc = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_ventas_sc",
                        line: i
                    });
                    var bono_sc = record.getSublistValue({
                        sublistId: "sublist",
                        fieldId: "custentity_bono_sc",
                        line: i
                    });
                    //crea el objeto para enviar al script map
                    object_fill.push({
                            idEmp                 :idEmp,
                            nameEmp               :nameEmp,
                            ingreso               :ingreso,
                            nombre_unidad         :nombre_unidad,
                            ventas_propias_num    :ventas_propias_num,
                            ventas_propias_ids    :ventas_propias_ids,
                            ventas_propias_total  :ventas_propias_total,
                            ventas_present_num    :ventas_present_num,
                            ventas_present_total  :ventas_present_total,
                            entrega               :entrega,
                            bono_productividad    :bono_productividad,
                            bono_emerald          :bono_emerald,
                            bono_talento          :bono_talento,
                            bono_reclutadora      :bono_reclutadora,
                            retencion             :retencion,
                            ajuste                :ajuste,
                            subtotal              :subtotal,
                            num_entrega           :num_entrega,
                            odv_rec_id            :odv_rec_id,
                            odv_entrega           :odv_entrega,
                            odv_pre_id            :odv_pre_id,
                            total                 :total,
                            tm_pagada             :tm_pagada,
                            total_venta_propia    :total_venta_propia,
                            tm_pagadas_equipo     :tm_pagadas_equipo,
                            porcentaje            :porcentaje,
                            odv_de_reclutas       :odv_de_recliutas,
                            tm_pagadas_rec        :tm_pagadas_rec,
                            tm_ganadas            :tm_ganadas,
                            acumulado_de_ventas   :acumulado_de_ventas,
                            num_ck                :num_ck,
                            total_ck              :total_ck,
                            num_garantia          :num_garantia,
                            monto_garantia        :monto_garantia,
                            ids_garantia          :ids_garantia,
                            odv_rec_del_periodo   :odv_rec_del_periodo,
                            rec_con_ventas        :rec_con_ventas,
                            bono_tres_dos         :bono_tres_dos,
                            rec_period_le         :rec_period_le,
                            bono_cinco_dos        :bono_cinco_dos,
                            odv_pre_supercomision :odv_pre_supercomision,
                            ventas_sc             :ventas_sc,
                            bono_sc               :bono_sc
                    })  
                }
            }
            console.log('object_fill',object_fill);
            return {obj:object_fill,obj_conf:obj_conf};
        }catch(err){
            console.log(err);
        }
        
    }
    function saveData(){
        try{
            alert("Almacenamiento de registros en proceso");
            var objet_full = getData();//extrae la informacion de la tabla
            var url = ""
            if(runtime.envType != 'PRODUCTION'){ //Reporte de comision Suitelet.js
                url ='https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=565&deploy=1';
            }else{
                url ='https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=565&deploy=1';
            };
            //envia la información por metodo put al map vorwerk commission map
            var headers = {"Content-Type": "application/json"};
            var obj = objet_full;
            var res = https.put({
                url: url,
                headers: headers,
                body: JSON.stringify(obj)
            }).body;
            
            console.log('res',res);
        }catch(err){
            console.log(err);
            log.error("err client",err);
        }
    }
    
    function createExcel(){
        try{
                var objet_full = getData();
                var url = '';
                if(runtime.envType != 'PRODUCTION'){ 
                    url = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1406&deploy=1';
                }else{
                    url = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1406&deploy=1';
                }
                log.debug("getexcel",url);
                log.debug('objet_full',objet_full);
                var headers = {'Content-Type': 'application/json'};
                var response = https.post({
                    url: url,
                    body : JSON.stringify(objet_full),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).body;
                var rep = JSON.parse(response);
                console.log('response',response);
                log.debug("response",rep.id);
                
                var idFile = rep.id;
                
                if(!!idFile){
                    
                    window.open(url+'&idfile='+idFile);
                }
               
                log.debug("response",response);
                return true;
            
        }catch(err){
            log.error("error create Excel",err)
        }
    }
    
    
    return {
        pageInit: pageInit,
//        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        //saveRecord: saveRecord,
        //saveData:saveData,
        createExcel: createExcel
    };
    
});
