/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/search','N/record','N/runtime','N/redirect','N/url'],
function(serverWidget,search,record,runtime,redirect,url) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    var objManualBonus = {};
   
    function beforeLoad(scriptContext) {
        try{
            var form = scriptContext.form,
                newRec = scriptContext.newRecord,
                recId = newRec.id,
                recType = newRec.type;
            var period = newRec.getValue('custrecord_periodo_comision');
            var objData = {
                'data': {'recordType': recType, 'recordId': recId}
            };
            var type = scriptContext.type;
            if(type == 'view'&& type != 'edit'){
                redirect.toRecord({
                    type : recType,
                    id : recId,
                    isEditMode: true
                });
            }
            form.clientScriptModulePath = 'SuiteScripts/Vorwerk_project/Vorwerk RegisterJDG Client.js';
            form.addButton({
                id : 'custpage_txt',
                label : 'Banamex',
                functionName: 'txt()'
            });
            form.addButton({
                id : 'custpage_layout_HSBC',
                label : 'Layout HSBC',
                functionName: 'layout_HSBC()'
            });
            form.addButton({
                id : 'custpage_nomina',
                label : 'Timbrado de Nomina',
                functionName: 'nomina()'
            });
            form.addButton({
                id : 'custpage_email',
                label : 'Envio de Email',
                functionName: 'emailSend()'
            });
            form.addButton({
                id : 'custpage_policy_create',
                label : 'Crear Poliza',
                functionName: 'policycreate(\"'+period+'\")'
            });
            form.addButton({
                id : 'custpage_pdf',
                label : 'Guardar Reportes',
                functionName: 'massivepdf()'
            });
            form.addTab({
                id : 'custpage_subtab_detail',
                label : 'Detalle'
            });
            
            var sublist = form.addSublist({
                id : 'custpage_sublist_detail',
                type : serverWidget.SublistType.LIST,
                label : 'Detalle',
                tab: 'custpage_subtab_detail'
            });
            var check = sublist.addField({
                id: 'custpage_select_field',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'select'
            });
            var ver = sublist.addField({
                id: 'custpage_ver',
                type: serverWidget.FieldType.URL,
                label: 'Ver'
            });
            ver.linkText = 'Ver';
            var id = sublist.addField({
                id : 'custpage_article_id',
                type : serverWidget.FieldType.TEXT,
                label : 'ID'
            })
            
            var name = sublist.addField({
               id: 'custpage_nombre_emp',
               type: serverWidget.FieldType.SELECT,
               source:'employee',
               label: 'Nombre'
           })
            name.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE });
//            var manual_bond = sublist.addField({
//                id : 'custpage_manual_bond',
//                type : serverWidget.FieldType.FLOAT,
//                label : 'BONO MANUAL'
//            });
            var own_sale = sublist.addField({
                id : 'custpage_own_sale',
                type : serverWidget.FieldType.FLOAT,
                label : 'VENTA PROPIA'
            });
            var bond_own_sale = sublist.addField({
                id : 'custpage_bond_own_sale',
                type : serverWidget.FieldType.FLOAT,
                label : 'BONO VENTA PROPIA'
            });
//            var pre_own_sale = sublist.addField({
//                id : 'custpage_pre_own_sale',
//                type : serverWidget.FieldType.FLOAT,
//                label : 'PUESTA EN MARCHA (PROPIA)'
//            });
//            var bond_own_sale = sublist.addField({
//                id : 'custpage_special_own_sale',
//                type : serverWidget.FieldType.FLOAT,
//                label : 'VENTA PROPIA ESPECIAL'
//            });
            var team_sale = sublist.addField({
                id : 'custpage_team_sale',
                type : serverWidget.FieldType.FLOAT,
                label : 'VENTA EQUIPO'
            });
            var bond_team_sale = sublist.addField({
                id : 'custpage_bond_team_sale',
                type : serverWidget.FieldType.FLOAT,
                label : 'BONO EQUIPO'
            });
            
            var recruitment = sublist.addField({
                id : 'custpage_recruitment',
                type : serverWidget.FieldType.FLOAT,
                label : 'RECLUTAMIENTO'
            });
            
            var sub_total = sublist.addField({
                id : 'custpage_sub_total',
                type : serverWidget.FieldType.FLOAT,
                label : 'SUB-TOTAL'
            });
            
            var retention = sublist.addField({
                id : 'custpage_retentione',
                type : serverWidget.FieldType.FLOAT,
                label : 'RETENCION'
            });
            
            var  total= sublist.addField({
                id : 'custpage_total',
                type : serverWidget.FieldType.FLOAT,
                label : 'TOTAL'
            });
            var estatus_timbrado = sublist.addField({
                id : 'custpage_estatus_timbrado',
                type : serverWidget.FieldType.TEXT,
                label : 'ESTATUS TIMBRADO'
            });
            
            var response_code = sublist.addField({
                id : 'custpage_response_code',
                type : serverWidget.FieldType.TEXT,
                label : 'CODIGO DE RESPUESTA'
            });
            
            var message_response = sublist.addField({
                id : 'custpage_message_response',
                type : serverWidget.FieldType.TEXT,
                label : 'MENSAJE DE RESPUESTA'
            });
            
            var xml_sat = sublist.addField({
                id : 'custpage_xml_sat',
                type : serverWidget.FieldType.URL,
                label : 'XML - SAT'
            });
            xml_sat.linkText = 'xml';
            
            var pdf = sublist.addField({
                id : 'custpage_pdf',
                type : serverWidget.FieldType.URL,
                label : 'PDF'
            });
            pdf.linkText = 'PDF';
            var print = sublist.addField({
                id : 'custpage_print',
                type : serverWidget.FieldType.URL,
                label : 'IMPRIMIR'
            });
            print.linkText = 'IMPRIMIR';
            var send = sublist.addField({
                id : 'custpage_send',
                type : serverWidget.FieldType.URL,
                label : 'ENVIAR'
            });

            send.linkText = 'ENVIAR';
            
            sublist.addMarkAllButtons();
           
            check.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
            
            var level = newRec.getValue('custrecord_nivel_jerarquia');
            log.debug('level',level);
            var inffo;
            objManualBonus[level] = {
                1: {isValue: false, bonoName: 'Bono Manual 1'},
                2: {isValue: false, bonoName: 'Bono Manual 2'},
                3: {isValue: false, bonoName: 'Bono Manual 3'},
                4: {isValue: false, bonoName: 'Bono Manual 4'},
                5: {isValue: false, bonoName: 'Bono Manual 5'},
                6: {isValue: false, bonoName: 'Bono Manual 6'},
                7: {isValue: false, bonoName: 'Bono Manual 7'},
                8: {isValue: false, bonoName: 'Bono Manual 8'},
                9: {isValue: false, bonoName: 'Bono Manual 9'},
                10: {isValue: false, bonoName: 'Bono Manual 10'}
            };

            if(level == 3){
                info = getValuesSublist(recId,period,level)
            }
            if(level == 1){
                info = getValuesSublistpre(recId,period,level)
            }
            if(level == 2){
                info = getValuesSublistgtm(recId,period,level)
            }
            log.debug('info',info.length);

            log.debug('objManualBonus',objManualBonus[level]);

            for(nBono in objManualBonus[level]){
                sublist.addField({
                    id : 'custpage_bono_manual'+nBono,
                    type : serverWidget.FieldType.TEXT,
                    label : objManualBonus[level][nBono]['bonoName']
                });
            }

            //prueba para restringir si no hay valores
            /*if(objManualBonus[level]['1']['isValue']){
                var bonoManual1 = sublist.addField({
                    id : 'custpage_bono_manual1',
                    type : serverWidget.FieldType.FLOAT,
                    label : objManualBonus[level]['1']['bonoName']
                });
            }*/
            //<!--Bonos manuales
            /*var bonoManual1 = sublist.addField({
                id : 'custpage_bono_manual1',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM1'
            });
            var bonoManual2 = sublist.addField({
                id : 'custpage_bono_manual2',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM2'
            });
            var bonoManual3 = sublist.addField({
                id : 'custpage_bono_manual3',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM3'
            });
            var bonoManual4 = sublist.addField({
                id : 'custpage_bono_manual4',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM4'
            });
            var bonoManual5 = sublist.addField({
                id : 'custpage_bono_manual5',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM5'
            });
            var bonoManual6 = sublist.addField({
                id : 'custpage_bono_manual6',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM6'
            });
            var bonoManual7 = sublist.addField({
                id : 'custpage_bono_manual7',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM7'
            });
            var bonoManual8 = sublist.addField({
                id : 'custpage_bono_manual8',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM8'
            });
            var bonoManual9 = sublist.addField({
                id : 'custpage_bono_manual9',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM9'
            });
            var bonoManual10 = sublist.addField({
                id : 'custpage_bono_manual10',
                type : serverWidget.FieldType.FLOAT,
                label : 'BM10'
            });*/
            //Bonos manuales-->
            
            for(var x = 0; x< info.length; x++ ){
                try{
                    sublist.setSublistValue({
                        id:'custpage_ver',
                        line:x,
                        value: info[x].ver
                    });
                    
                    sublist.setSublistValue({
                        id:'custpage_article_id',
                        line:x,
                        value: info[x].id
                    });
//                  id.linkText = info[x].id;
                    
                    sublist.setSublistValue({
                        id:'custpage_nombre_emp',
                        line:x,
                        value: info[x].emp_name
                    });
//                    sublist.setSublistValue({
//                        id:'custpage_manual_bond',
//                        line:x,
//                        value:info[x].manual_bond
//                    });
                    sublist.setSublistValue({
                        id:'custpage_own_sale',
                        line:x,
                        value:info[x].own_sale
                    });
                    sublist.setSublistValue({
                        id:'custpage_bond_own_sale',
                        line:x,
                        value:info[x].bond_own_sale
                    });
                    sublist.setSublistValue({
                        id:'custpage_team_sale',
                        line:x,
                        value:info[x].team_sale
                    });
                    sublist.setSublistValue({
                        id:'custpage_bond_team_sale',
                        line:x,
                        value:info[x].bond_team_sale
                    });
                    sublist.setSublistValue({
                        id:'custpage_recruitment',
                        line:x,
                        value:info[x].recruitment
                    });
                    sublist.setSublistValue({
                        id:'custpage_sub_total',
                        line:x,
                        value:info[x].subtotal
                    });
                    sublist.setSublistValue({
                        id:'custpage_retentione',
                        line:x,
                        value:info[x].retentione
                    });
                    sublist.setSublistValue({
                        id:'custpage_total',
                        line:x,
                        value:info[x].total
                    });
                    sublist.setSublistValue({
                        id:'custpage_estatus_timbrado',
                        line:x,
                        value:info[x].estatusTimbrado
                    });
                    if(info[x].response_code != ""){
                        sublist.setSublistValue({
                            id:'custpage_response_code',
                            line:x,
                            value:info[x].response_code
                        });
                    }
                    if(info[x].message_response != ""){
                        sublist.setSublistValue({
                            id:'custpage_message_response',
                            line:x,
                            value:info[x].message_response
                        });
                    }
                    if(info[x].xml_sat != ""){
                        sublist.setSublistValue({
                            id:'custpage_xml_sat',
                            line:x,
                            value:info[x].xml_sat
                        });
                    }
                    if(info[x].pdf != ""){
                        sublist.setSublistValue({
                            id:'custpage_pdf',
                            line:x,
                            value:info[x].pdf               
                        });
                    }
                    if(info[x].print != ""){
                        sublist.setSublistValue({
                            id:'custpage_print',
                            line:x,
                            value:info[x].print
                        });
                    }
                    sublist.setSublistValue({
                        id:'custpage_send',
                        line:x,
                        value:info[x].send
                    });

                    //<!--Bonos manuales
                    sublist.setSublistValue({
                        id:'custpage_bono_manual1',
                        line:x,
                        value:info[x].bono_manual1
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual2',
                        line:x,
                        value:info[x].bono_manual2
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual3',
                        line:x,
                        value:info[x].bono_manual3
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual4',
                        line:x,
                        value:info[x].bono_manual4
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual5',
                        line:x,
                        value:info[x].bono_manual5
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual6',
                        line:x,
                        value:info[x].bono_manual6
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual7',
                        line:x,
                        value:info[x].bono_manual7
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual8',
                        line:x,
                        value:info[x].bono_manual8
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual9',
                        line:x,
                        value:info[x].bono_manual9
                    });
                    sublist.setSublistValue({
                        id:'custpage_bono_manual10',
                        line:x,
                        value:info[x].bono_manual10
                    });
                    //-->Bonos manuales
                    
                }catch(errlist){
                    log.error('err list',errlist);
                }
                
            }
        }catch(err){
             
            log.error('beforeLoad',err)
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

    }

    function createSublist(form){
        
        
    }
    
    function getValuesSublist(idComp,period,level){//3
                                    
        try{ 
        	if(runtime.envType != 'PRODUCTION'){
                var record_url_base = 'https://3367613-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=397&id=';
                var print_url_base = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=570&deploy=1&employee=';
                var send_url_base = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=573&deploy=1&employee=';
                var url_file ='https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1';
                
        	}else{
        		var record_url_base = 'https://3367613.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=397&id=';
        		var print_url_base = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=570&deploy=1&employee=';
                var send_url_base = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=573&deploy=1&employee=';
                var url_file ='https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1';
                
        	}
            
            var obj_detail = [];
            var busqueda = search.create({
                type: 'customrecord_compensaciones_jdg',
                columns: [
                          'internalid',
                          'custrecord_c_jdg_empleado',
                          'custrecord_c_jdg_total_bono_manual',
                          'custrecord_c_jdg_monto_venta_propio',
                          'custrecord_c_jdg_monto_bono_propio',
                          'custrecord_c_jdg_monto_venta_equipo',
                          'custrecord_c_jdg_monto_bono_equipo',
                          'custrecord_c_jdg_bono_rec',
                          'custrecord_c_jdg_subtotal',
                          'custrecord_c_jdg_retencion',
                          'custrecord_c_jdg_total',
                          'custrecord_estatus_timbrado',
                          'custrecord_c_jdg_codigo_respuesta',
                          'custrecord_c_jdg_mensaje_respuesta',
                          'custrecord_c_jdg_xml_sat',
                          'custrecord_c_jdg_pdg',
                          //<!--Bonos manuales
                          'custrecord_c_jdg_bono1',
                          'custrecord_c_jdg_bono2',
                          'custrecord_c_jdg_bono3',
                          'custrecord_c_jdg_bono4',
                          'custrecord_c_jdg_bono5',
                          'custrecord_c_jdg_bono6',
                          'custrecord_c_jdg_bono7',
                          'custrecord_c_jdg_bono8',
                          'custrecord_c_jdg_bono9',
                          'custrecord_c_jdg_bono10',
                          'custrecord_c_jdg_bono_manual1',
                          'custrecord_c_jdg_bono_manual2',
                          'custrecord_c_jdg_bono_manual3',
                          'custrecord_c_jdg_bono_manual4',
                          'custrecord_c_jdg_bono_manual5',
                          'custrecord_c_jdg_bono_manual6',
                          'custrecord_c_jdg_bono_manual7',
                          'custrecord_c_jdg_bono_manual8',
                          'custrecord_c_jdg_bono_manual9',
                          'custrecord_c_jdg_bono_manual10'
                          //Bonos manuales-->
                          ],
                filters: [
                    ['custrecord_sub__registro_compensaciones','anyof',idComp],
                ]
            });
             busqueda.run().each(function(r){
                 /*objManualBonus[3][1]['bonoName'] = (r.getText('custrecord_c_jdg_bono1')) ? r.getText('custrecord_c_jdg_bono1') : objManualBonus[3][1]['bonoName'];
                 objManualBonus[3][2]['bonoName'] = (r.getText('custrecord_c_jdg_bono2')) ? r.getText('custrecord_c_jdg_bono2') : objManualBonus[3][2]['bonoName'];
                 objManualBonus[3][3]['bonoName'] = (r.getText('custrecord_c_jdg_bono3')) ? r.getText('custrecord_c_jdg_bono3') : objManualBonus[3][3]['bonoName'];
                 objManualBonus[3][4]['bonoName'] = (r.getText('custrecord_c_jdg_bono4')) ? r.getText('custrecord_c_jdg_bono4') : objManualBonus[3][4]['bonoName'];
                 objManualBonus[3][5]['bonoName'] = (r.getText('custrecord_c_jdg_bono5')) ? r.getText('custrecord_c_jdg_bono5') : objManualBonus[3][5]['bonoName'];
                 objManualBonus[3][6]['bonoName'] = (r.getText('custrecord_c_jdg_bono6')) ? r.getText('custrecord_c_jdg_bono6') : objManualBonus[3][6]['bonoName'];
                 objManualBonus[3][7]['bonoName'] = (r.getText('custrecord_c_jdg_bono7')) ? r.getText('custrecord_c_jdg_bono7') : objManualBonus[3][7]['bonoName'];
                 objManualBonus[3][8]['bonoName'] = (r.getText('custrecord_c_jdg_bono8')) ? r.getText('custrecord_c_jdg_bono8') : objManualBonus[3][8]['bonoName'];
                 objManualBonus[3][9]['bonoName'] = (r.getText('custrecord_c_jdg_bono9')) ? r.getText('custrecord_c_jdg_bono9') : objManualBonus[3][9]['bonoName'];
                 objManualBonus[3][10]['bonoName'] = (r.getText('custrecord_c_jdg_bono10')) ? r.getText('custrecord_c_jdg_bono10') : objManualBonus[3][10]['bonoName'];*/
                var bonoName1 = (r.getValue('custrecord_c_jdg_bono1')) ? r.getText('custrecord_c_jdg_bono1') : 'N/A',
                    bonoName2 = (r.getValue('custrecord_c_jdg_bono2')) ? r.getText('custrecord_c_jdg_bono2') : 'N/A',
                    bonoName3 = (r.getValue('custrecord_c_jdg_bono3')) ? r.getText('custrecord_c_jdg_bono3') : 'N/A',
                    bonoName4 = (r.getValue('custrecord_c_jdg_bono4')) ? r.getText('custrecord_c_jdg_bono4') : 'N/A',
                    bonoName5 = (r.getValue('custrecord_c_jdg_bono5')) ? r.getText('custrecord_c_jdg_bono5') : 'N/A',
                    bonoName6 = (r.getValue('custrecord_c_jdg_bono6')) ? r.getText('custrecord_c_jdg_bono6') : 'N/A',
                    bonoName7 = (r.getValue('custrecord_c_jdg_bono7')) ? r.getText('custrecord_c_jdg_bono7') : 'N/A',
                    bonoName8 = (r.getValue('custrecord_c_jdg_bono8')) ? r.getText('custrecord_c_jdg_bono8') : 'N/A',
                    bonoName9 = (r.getValue('custrecord_c_jdg_bono9')) ? r.getText('custrecord_c_jdg_bono9') : 'N/A',
                    bonoName10 = (r.getValue('custrecord_c_jdg_bono10')) ? r.getText('custrecord_c_jdg_bono10') : 'N/A';
                 obj_detail.push({
                     id: r.getValue('internalid'),
                     emp_name: r.getValue('custrecord_c_jdg_empleado'),
//                     manual_bond : !r.getValue('custrecord_c_jdg_total_bono_manual')?0:r.getValue('custrecord_c_jdg_total_bono_manual'),
                     own_sale : !r.getValue('custrecord_c_jdg_monto_venta_propio')?0:r.getValue('custrecord_c_jdg_monto_venta_propio'),
                     bond_own_sale : !r.getValue('custrecord_c_jdg_monto_bono_propio')?0:r.getValue('custrecord_c_jdg_monto_bono_propio'),
                     team_sale : !r.getValue('custrecord_c_jdg_monto_venta_equipo')?0:r.getValue('custrecord_c_jdg_monto_venta_equipo'),
                     bond_team_sale : !r.getValue('custrecord_c_jdg_monto_bono_equipo')?0:r.getValue('custrecord_c_jdg_monto_bono_equipo'),
                     recruitment : !r.getValue('custrecord_c_jdg_bono_rec')?0:r.getValue('custrecord_c_jdg_bono_rec'),
                     subtotal : !r.getValue('custrecord_c_jdg_subtotal')?0:r.getValue('custrecord_c_jdg_subtotal'),
                     retentione : !r.getValue('custrecord_c_jdg_retencion')?0:r.getValue('custrecord_c_jdg_retencion'),
                     total:!r.getValue('custrecord_c_jdg_total')?0:r.getValue('custrecord_c_jdg_total'),
                     estatusTimbrado:!r.getValue('custrecord_estatus_timbrado')?0:r.getValue('custrecord_estatus_timbrado'),
                     response_code : !r.getValue('custrecord_c_jdg_codigo_respuesta')?"":r.getValue('custrecord_c_jdg_codigo_respuesta'),    
                     message_response : r.getValue('custrecord_c_jdg_mensaje_respuesta'),   
                     xml_sat : url_file+'&idfile='+r.getValue('custrecord_c_jdg_xml_sat'),        
                     pdf : url_file+'&idfile='+r.getValue('custrecord_c_jdg_pdg'),
                     print : print_url_base+r.getValue('custrecord_c_jdg_empleado')+'&periodo='+period+'&comp='+r.getValue('internalid')+'&level='+level,
                     send : send_url_base+r.getValue('custrecord_c_jdg_empleado')+'&period='+period+'&comp='+r.getValue('internalid'),
                     ver : record_url_base+r.getValue('internalid'),
                     //<!--Bonos manuales
                     bono_manual1: (r.getValue('custrecord_c_jdg_bono_manual1')) ? bonoName1+' - '+ r.getValue('custrecord_c_jdg_bono_manual1') : bonoName1+' - '+ 0,
                     bono_manual2: (r.getValue('custrecord_c_jdg_bono_manual2')) ? bonoName2+' - '+ r.getValue('custrecord_c_jdg_bono_manual2') : bonoName2+' - '+ 0,
                     bono_manual3: (r.getValue('custrecord_c_jdg_bono_manual3')) ? bonoName3+' - '+ r.getValue('custrecord_c_jdg_bono_manual3') : bonoName3+' - '+ 0,
                     bono_manual4: (r.getValue('custrecord_c_jdg_bono_manual4')) ? bonoName4+' - '+ r.getValue('custrecord_c_jdg_bono_manual4') : bonoName4+' - '+ 0,
                     bono_manual5: (r.getValue('custrecord_c_jdg_bono_manual5')) ? bonoName5+' - '+ r.getValue('custrecord_c_jdg_bono_manual5') : bonoName5+' - '+ 0,
                     bono_manual6: (r.getValue('custrecord_c_jdg_bono_manual6')) ? bonoName6+' - '+ r.getValue('custrecord_c_jdg_bono_manual6') : bonoName6+' - '+ 0,
                     bono_manual7: (r.getValue('custrecord_c_jdg_bono_manual7')) ? bonoName7+' - '+ r.getValue('custrecord_c_jdg_bono_manual7') : bonoName7+' - '+ 0,
                     bono_manual8: (r.getValue('custrecord_c_jdg_bono_manual8')) ? bonoName8+' - '+ r.getValue('custrecord_c_jdg_bono_manual8') : bonoName8+' - '+ 0,
                     bono_manual9: (r.getValue('custrecord_c_jdg_bono_manual9')) ? bonoName9+' - '+ r.getValue('custrecord_c_jdg_bono_manual9') : bonoName9+' - '+ 0,
                     bono_manual10: (r.getValue('custrecord_c_jdg_bono_manual10')) ? bonoName10+' - '+ r.getValue('custrecord_c_jdg_bono_manual10') : bonoName10+' - '+ 0
                     //Bonos manuales-->
                 });
                return true;
             });
             
             return obj_detail;
        }catch(err){
            log.error("error getValuesSublist",err)
        }
        
    }
    function getValuesSublistpre(idComp,period,level){//1
        try{
        	if(runtime.envType != 'PRODUCTION'){
	            var record_url_base = 'https://3367613-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=394&id=';
	            var print_url_base = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=570&deploy=1&employee=';
	            var send_url_base = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=573&deploy=1&employee=';
	            var url_file ='https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1';
        	}else{
        		var record_url_base = 'https://3367613.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=394&id=';
        		var print_url_base = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=570&deploy=1&employee=';
	            var send_url_base = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=573&deploy=1&employee=';
	            var url_file ='https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1';
        	}
            var obj_detail = [];
            var busqueda = search.create({
                type: 'customrecord_comisiones_presentadora',
                columns: [
                          'internalid',
                          'custrecord_c_pre_empleado',
                          'custrecord_c_pre_total_bono_manual',
                          'custrecord_c_pre_monto_venta',
                          'custrecord_c_pre_monto_bono',
                          'custrecord_c_pre_bono_rec',
                          'custrecord_c_pre_subtotal',
                          'custrecord_c_pre_retencion',
                          'custrecord_c_pre_total',
                          'custrecord_estatus_timbrado_pre',
                          'custrecord_c_pre_codigo_respuesta',
                          'custrecord_c_pre_mensaje_respuesta',
                          'custrecord_c_pre_xml_sat',
                          'custrecord_c_pre_pdf',
                          //<!--Bono manual
                          'custrecord_c_pre_bono_uno',//este que?
                          'custrecord_c_pre_bono2',
                          'custrecord_c_pre_bono3',
                          'custrecord_c_pre_bono4',
                          'custrecord_c_pre_bono5',
                          'custrecord_c_pre_bono6',
                          'custrecord_c_pre_bono7',
                          'custrecord_c_pre_bono8',
                          'custrecord_c_pre_bono9',
                          'custrecord_c_pre_bono10',
                          'custrecord_c_pre_bono_manual1',
                          'custrecord_c_pre_bono_manual2',
                          'custrecord_c_pre_bono_manual3',
                          'custrecord_c_pre_bono_manual4',
                          'custrecord_c_pre_bono_manual5',
                          'custrecord_c_pre_bono_manual6',
                          'custrecord_c_pre_bono_manual7',
                          'custrecord_c_pre_bono_manual8',
                          'custrecord_c_pre_bono_manual9',
                          'custrecord_c_pre_bono_manual10'
                          //Bono manual-->
                          ],
                filters: [
                    ['custrecord_sub_registro_compensaciones_p','anyof',idComp],
                ]
            });
             busqueda.run().each(function(r){
                 /*objManualBonus[1][1]['bonoName'] = (r.getText('custrecord_c_pre_bono_uno')) ? r.getText('custrecord_c_pre_bono_uno') : objManualBonus[1][1]['bonoName'];
                 objManualBonus[1][2]['bonoName'] = (r.getText('custrecord_c_pre_bono2')) ? r.getText('custrecord_c_pre_bono2') : objManualBonus[1][2]['bonoName'];
                 objManualBonus[1][3]['bonoName'] = (r.getText('custrecord_c_pre_bono3')) ? r.getText('custrecord_c_pre_bono3') : objManualBonus[1][3]['bonoName'];
                 objManualBonus[1][4]['bonoName'] = (r.getText('custrecord_c_pre_bono4')) ? r.getText('custrecord_c_pre_bono4') : objManualBonus[1][4]['bonoName'];
                 objManualBonus[1][5]['bonoName'] = (r.getText('custrecord_c_pre_bono5')) ? r.getText('custrecord_c_pre_bono5') : objManualBonus[1][5]['bonoName'];
                 objManualBonus[1][6]['bonoName'] = (r.getText('custrecord_c_pre_bono6')) ? r.getText('custrecord_c_pre_bono6') : objManualBonus[1][6]['bonoName'];
                 objManualBonus[1][7]['bonoName'] = (r.getText('custrecord_c_pre_bono7')) ? r.getText('custrecord_c_pre_bono7') : objManualBonus[1][7]['bonoName'];
                 objManualBonus[1][8]['bonoName'] = (r.getText('custrecord_c_pre_bono8')) ? r.getText('custrecord_c_pre_bono8') : objManualBonus[1][8]['bonoName'];
                 objManualBonus[1][9]['bonoName'] = (r.getText('custrecord_c_pre_bono9')) ? r.getText('custrecord_c_pre_bono9') : objManualBonus[1][9]['bonoName'];
                 objManualBonus[1][10]['bonoName'] = (r.getText('custrecord_c_pre_bono10')) ? r.getText('custrecord_c_pre_bono10') : objManualBonus[1][10]['bonoName'];*/
                 var bonoName1 = (r.getValue('custrecord_c_pre_bono_uno')) ? r.getText('custrecord_c_pre_bono_uno') : 'N/A',
                     bonoName2 = (r.getValue('custrecord_c_pre_bono2')) ? r.getText('custrecord_c_pre_bono2') : 'N/A',
                     bonoName3 = (r.getValue('custrecord_c_pre_bono3')) ? r.getText('custrecord_c_pre_bono3') : 'N/A',
                     bonoName4 = (r.getValue('custrecord_c_pre_bono4')) ? r.getText('custrecord_c_pre_bono4') : 'N/A',
                     bonoName5 = (r.getValue('custrecord_c_pre_bono5')) ? r.getText('custrecord_c_pre_bono5') : 'N/A',
                     bonoName6 = (r.getValue('custrecord_c_pre_bono6')) ? r.getText('custrecord_c_pre_bono6') : 'N/A',
                     bonoName7 = (r.getValue('custrecord_c_pre_bono7')) ? r.getText('custrecord_c_pre_bono7') : 'N/A',
                     bonoName8 = (r.getValue('custrecord_c_pre_bono8')) ? r.getText('custrecord_c_pre_bono8') : 'N/A',
                     bonoName9 = (r.getValue('custrecord_c_pre_bono9')) ? r.getText('custrecord_c_pre_bono9') : 'N/A',
                     bonoName10 = (r.getValue('custrecord_c_pre_bono10')) ? r.getText('custrecord_c_pre_bono10') : 'N/A';
                 obj_detail.push({
                     id: r.getValue('internalid'),
                     emp_name: r.getValue('custrecord_c_pre_empleado'),
//                     manual_bond : !r.getValue('custrecord_c_pre_total_bono_manual')?0:r.getValue('custrecord_c_pre_total_bono_manual'),
                     own_sale : !r.getValue('custrecord_c_pre_monto_venta')?0:r.getValue('custrecord_c_pre_monto_venta'),
                     bond_own_sale : !r.getValue('custrecord_c_pre_monto_bono')?0:r.getValue('custrecord_c_pre_monto_bono'),
                     team_sale :0,
                     bond_team_sale :0,
                     recruitment : !r.getValue('custrecord_c_pre_bono_rec')?0:r.getValue('custrecord_c_pre_bono_rec'),
                     subtotal : !r.getValue('custrecord_c_pre_subtotal')?0:r.getValue('custrecord_c_pre_subtotal'),
                     retentione : !r.getValue('custrecord_c_pre_retencion')?0:r.getValue('custrecord_c_pre_retencion'),
                     total:!r.getValue('custrecord_c_pre_total')?0:r.getValue('custrecord_c_pre_total'),
                     estatusTimbrado:!r.getValue('custrecord_estatus_timbrado_pre')?0:r.getValue('custrecord_estatus_timbrado_pre'),
                     response_code : !r.getValue('custrecord_c_pre_codigo_respuesta')?"":r.getValue('custrecord_c_pre_codigo_respuesta'),    
                     message_response : r.getValue('custrecord_c_pre_mensaje_respuesta'),   
                     xml_sat : url_file+'&idfile='+r.getValue('custrecord_c_pre_xml_sat'),        
                     pdf : url_file+'&idfile='+r.getValue('custrecord_c_pre_pdf'),
                     print : print_url_base+r.getValue('custrecord_c_pre_empleado')+'&periodo='+period+'&comp='+r.getValue('internalid')+'&level='+level,
                     send : send_url_base+r.getValue('custrecord_c_pre_empleado')+'&period='+period+'&comp='+r.getValue('internalid'),
                     ver : record_url_base+r.getValue('internalid'),
                     //<!--Bonos manuales
                     bono_manual1: (r.getValue('custrecord_c_pre_bono_manual1')) ? bonoName1+' - '+ r.getValue('custrecord_c_pre_bono_manual1') : bonoName1+' - '+ 0,
                     bono_manual2: (r.getValue('custrecord_c_pre_bono_manual2')) ? bonoName2+' - '+ r.getValue('custrecord_c_pre_bono_manual2') : bonoName2+' - '+ 0,
                     bono_manual3: (r.getValue('custrecord_c_pre_bono_manual3')) ? bonoName3+' - '+ r.getValue('custrecord_c_pre_bono_manual3') : bonoName3+' - '+ 0,
                     bono_manual4: (r.getValue('custrecord_c_pre_bono_manual4')) ? bonoName4+' - '+ r.getValue('custrecord_c_pre_bono_manual4') : bonoName4+' - '+ 0,
                     bono_manual5: (r.getValue('custrecord_c_pre_bono_manual5')) ? bonoName5+' - '+ r.getValue('custrecord_c_pre_bono_manual5') : bonoName5+' - '+ 0,
                     bono_manual6: (r.getValue('custrecord_c_pre_bono_manual6')) ? bonoName6+' - '+ r.getValue('custrecord_c_pre_bono_manual6') : bonoName6+' - '+ 0,
                     bono_manual7: (r.getValue('custrecord_c_pre_bono_manual7')) ? bonoName7+' - '+ r.getValue('custrecord_c_pre_bono_manual7') : bonoName7+' - '+ 0,
                     bono_manual8: (r.getValue('custrecord_c_pre_bono_manual8')) ? bonoName8+' - '+ r.getValue('custrecord_c_pre_bono_manual8') : bonoName8+' - '+ 0,
                     bono_manual9: (r.getValue('custrecord_c_pre_bono_manual9')) ? bonoName9+' - '+ r.getValue('custrecord_c_pre_bono_manual9') : bonoName9+' - '+ 0,
                     bono_manual10: (r.getValue('custrecord_c_pre_bono_manual10')) ? bonoName10+' - '+ r.getValue('custrecord_c_pre_bono_manual10') : bonoName10+' - '+ 0
                     //Bonos manuales-->
                 });
                return true;
             });
             return obj_detail;
        }catch(err){
            log.error("error getValuesSublist",err)
        }
        
    }
    
    function getValuesSublistgtm(idComp,period,level){//2

        try{
        	if(runtime.envType != 'PRODUCTION'){
	            var record_url_base = 'https://3367613-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=398&id=';
	            var print_url_base = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=570&deploy=1&employee=';
	            var send_url_base = 'https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=573&deploy=1&employee=';
	            var url_file ='https://3367613-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1';
        	}else{
        		var record_url_base = 'https://3367613.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=398&id=';
        		var print_url_base = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=570&deploy=1&employee=';
                var send_url_base = 'https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=573&deploy=1&employee=';
                var url_file ='https://3367613.app.netsuite.com/app/site/hosting/scriptlet.nl?script=571&deploy=1';
        	}
            var obj_detail = [];
            var busqueda = search.create({
                type: 'customrecord_compensaciones_gtm',
                columns: [
                          'internalid',
                          'custrecord_c_gtm_empleado',
                          'custrecord_c_gtm_monto_venta',
                          'custrecord_c_gtm_monto_bono',
                          'custrecord_c_gtm_subtotal',
                          'custrecord_c_gtm_retencion',
                          'custrecord_c_gtm_total',
                          'custrecord_estatus_timbrado_gtm',
                          'custrecord_c_gtm_codigo_respuesta',
                          'custrecord_c_gtm_mensaje_respuesta',
                          'custrecord_c_gtm_xml_sa',
                          'custrecord_c_gtm_pdf',
                          //<!--Bono manual
                          'custrecord_c_gtm_bono1',
                          'custrecord_c_gtm_bono2',
                          'custrecord_c_gtm_bono3',
                          'custrecord_c_gtm_bono4',
                          'custrecord_c_gtm_bono5',
                          'custrecord_c_gtm_bono6',
                          'custrecord_c_gtm_bono7',
                          'custrecord_c_gtm_bono8',
                          'custrecord_c_gtm_bono9',
                          'custrecord_c_gtm_bono10',
                          'custrecord_c_gtm_bono_manual1',
                          'custrecord_c_gtm_bono_manual2',
                          'custrecord_c_gtm_bono_manual3',
                          'custrecord_c_gtm_bono_manual4',
                          'custrecord_c_gtm_bono_manual5',
                          'custrecord_c_gtm_bono_manual6',
                          'custrecord_c_gtm_bono_manual7',
                          'custrecord_c_gtm_bono_manual8',
                          'custrecord_c_gtm_bono_manual9',
                          'custrecord_c_gtm_bono_manual10'
                          //Bono manual-->
                          ],
                filters: [
                    ['custrecord_sub_registro_compensaciones_g','anyof',idComp],
                ]
            });
             busqueda.run().each(function(r){
                 
                /*if(r.getText('custrecord_c_gtm_bono1')){objManualBonus[2][1]['bonoName'] = r.getText('custrecord_c_gtm_bono1')}
                if(r.getText('custrecord_c_gtm_bono2')){objManualBonus[2][2]['bonoName'] = r.getText('custrecord_c_gtm_bono2')}
                if(r.getText('custrecord_c_gtm_bono3')){objManualBonus[2][3]['bonoName'] = r.getText('custrecord_c_gtm_bono3')}
                if(r.getText('custrecord_c_gtm_bono4')){objManualBonus[2][4]['bonoName'] = r.getText('custrecord_c_gtm_bono4')}
                if(r.getText('custrecord_c_gtm_bono5')){objManualBonus[2][5]['bonoName'] = r.getText('custrecord_c_gtm_bono5')}
                if(r.getText('custrecord_c_gtm_bono6')){objManualBonus[2][6]['bonoName'] = r.getText('custrecord_c_gtm_bono6')}
                if(r.getText('custrecord_c_gtm_bono7')){objManualBonus[2][7]['bonoName'] = r.getText('custrecord_c_gtm_bono7')}
                if(r.getText('custrecord_c_gtm_bono8')){objManualBonus[2][8]['bonoName'] = r.getText('custrecord_c_gtm_bono8')}
                if(r.getText('custrecord_c_gtm_bono9')){objManualBonus[2][9]['bonoName'] = r.getText('custrecord_c_gtm_bono9')}
                if(r.getText('custrecord_c_gtm_bono10')){objManualBonus[2][10]['bonoName'] = r.getText('custrecord_c_gtm_bono10')}*/
                
                 /*objManualBonus[2][1]['bonoName'] = (r.getText('custrecord_c_gtm_bono1')) ? r.getText('custrecord_c_gtm_bono1') : objManualBonus[2][1]['bonoName1'];
                 objManualBonus[2][2]['bonoName'] = (r.getText('custrecord_c_gtm_bono2')) ? r.getText('custrecord_c_gtm_bono2') : objManualBonus[2][2]['bonoName2'];
                 objManualBonus[2][3]['bonoName'] = (r.getText('custrecord_c_gtm_bono3')) ? r.getText('custrecord_c_gtm_bono3') : objManualBonus[2][3]['bonoName3'];
                 objManualBonus[2][4]['bonoName'] = (r.getText('custrecord_c_gtm_bono4')) ? r.getText('custrecord_c_gtm_bono4') : objManualBonus[2][4]['bonoName4'];
                 objManualBonus[2][5]['bonoName'] = (r.getText('custrecord_c_gtm_bono5')) ? r.getText('custrecord_c_gtm_bono5') : objManualBonus[2][5]['bonoName5'];
                 objManualBonus[2][6]['bonoName'] = (r.getText('custrecord_c_gtm_bono6')) ? r.getText('custrecord_c_gtm_bono6') : objManualBonus[2][6]['bonoName6'];
                 objManualBonus[2][7]['bonoName'] = (r.getText('custrecord_c_gtm_bono7')) ? r.getText('custrecord_c_gtm_bono7') : objManualBonus[2][7]['bonoName7'];
                 objManualBonus[2][8]['bonoName'] = (r.getText('custrecord_c_gtm_bono8')) ? r.getText('custrecord_c_gtm_bono8') : objManualBonus[2][8]['bonoName8'];
                 objManualBonus[2][9]['bonoName'] = (r.getText('custrecord_c_gtm_bono9')) ? r.getText('custrecord_c_gtm_bono9') : objManualBonus[2][9]['bonoName9'];
                 objManualBonus[2][10]['bonoName'] = (r.getText('custrecord_c_gtm_bono10')) ? r.getText('custrecord_c_gtm_bono10') : objManualBonus[2][10]['bonoName10'];*/

                 var bonoName1 = (r.getValue('custrecord_c_gtm_bono1')) ? r.getText('custrecord_c_gtm_bono1') : 'N/A',
                     bonoName2 = (r.getValue('custrecord_c_gtm_bono2')) ? r.getText('custrecord_c_gtm_bono2') : 'N/A',
                     bonoName3 = (r.getValue('custrecord_c_gtm_bono3')) ? r.getText('custrecord_c_gtm_bono3') : 'N/A',
                     bonoName4 = (r.getValue('custrecord_c_gtm_bono4')) ? r.getText('custrecord_c_gtm_bono4') : 'N/A',
                     bonoName5 = (r.getValue('custrecord_c_gtm_bono5')) ? r.getText('custrecord_c_gtm_bono5') : 'N/A',
                     bonoName6 = (r.getValue('custrecord_c_gtm_bono6')) ? r.getText('custrecord_c_gtm_bono6') : 'N/A',
                     bonoName7 = (r.getValue('custrecord_c_gtm_bono7')) ? r.getText('custrecord_c_gtm_bono7') : 'N/A',
                     bonoName8 = (r.getValue('custrecord_c_gtm_bono8')) ? r.getText('custrecord_c_gtm_bono8') : 'N/A',
                     bonoName9 = (r.getValue('custrecord_c_gtm_bono9')) ? r.getText('custrecord_c_gtm_bono9') : 'N/A',
                     bonoName10 = (r.getValue('custrecord_c_gtm_bono10')) ? r.getText('custrecord_c_gtm_bono10') : 'N/A';
                 
                 obj_detail.push({
                     id: r.getValue('internalid'),
                     emp_name: r.getValue('custrecord_c_gtm_empleado'),
//                     manual_bond :0,
                     own_sale : !r.getValue('custrecord_c_gtm_monto_venta')?0:r.getValue('custrecord_c_gtm_monto_venta'),
                     bond_own_sale :0,
                     team_sale :0,
                     bond_team_sale :0,
                     recruitment : !r.getValue('custrecord_c_gtm_monto_bono')?0:r.getValue('custrecord_c_gtm_monto_bono'),
                     subtotal : !r.getValue('custrecord_c_gtm_subtotal')?0:r.getValue('custrecord_c_gtm_subtotal'),
                     retentione : !r.getValue('custrecord_c_gtm_retencion')?0:r.getValue('custrecord_c_gtm_retencion'),
                     total:!r.getValue('custrecord_c_gtm_total')?0:r.getValue('custrecord_c_gtm_total'),
                     estatusTimbrado:!r.getValue('custrecord_estatus_timbrado_gtm')?0:r.getValue('custrecord_estatus_timbrado_gtm'),
                     response_code : !r.getValue('custrecord_c_gtm_codigo_respuesta')?"":r.getValue('custrecord_c_gtm_codigo_respuesta'),    
                     message_response : r.getValue('custrecord_c_gtm_mensaje_respuesta'),   
                     xml_sat :url_file+'&idfile='+ r.getValue('custrecord_c_gtm_xml_sa'),        
                     pdf : url_file+'&idfile='+ r.getValue('custrecord_c_gtm_pdf'),
                     print : print_url_base+r.getValue('custrecord_c_gtm_empleado')+'&periodo='+period+'&comp='+r.getValue('internalid')+'&level='+level,
                     send : send_url_base+r.getValue('custrecord_c_gtm_empleado')+'&period='+period+'&comp='+r.getValue('internalid'),
                     ver : record_url_base+r.getValue('internalid'),
                     //<!--Bonos manuales
                     bono_manual1: (r.getValue('custrecord_c_gtm_bono_manual1')) ? bonoName1+' - '+ r.getValue('custrecord_c_gtm_bono_manual1') : bonoName1+' - '+0,
                     bono_manual2: (r.getValue('custrecord_c_gtm_bono_manual2')) ? bonoName2+' - '+ r.getValue('custrecord_c_gtm_bono_manual2') : bonoName2+' - '+0,
                     bono_manual3: (r.getValue('custrecord_c_gtm_bono_manual3')) ? bonoName3+' - '+ r.getValue('custrecord_c_gtm_bono_manual3') : bonoName3+' - '+0,
                     bono_manual4: (r.getValue('custrecord_c_gtm_bono_manual4')) ? bonoName4+' - '+ r.getValue('custrecord_c_gtm_bono_manual4') : bonoName4+' - '+0,
                     bono_manual5: (r.getValue('custrecord_c_gtm_bono_manual5')) ? bonoName5+' - '+ r.getValue('custrecord_c_gtm_bono_manual5') : bonoName5+' - '+0,
                     bono_manual6: (r.getValue('custrecord_c_gtm_bono_manual6')) ? bonoName6+' - '+ r.getValue('custrecord_c_gtm_bono_manual6') : bonoName6+' - '+0,
                     bono_manual7: (r.getValue('custrecord_c_gtm_bono_manual7')) ? bonoName7+' - '+ r.getValue('custrecord_c_gtm_bono_manual7') : bonoName7+' - '+0,
                     bono_manual8: (r.getValue('custrecord_c_gtm_bono_manual8')) ? bonoName8+' - '+ r.getValue('custrecord_c_gtm_bono_manual8') : bonoName8+' - '+0,
                     bono_manual9: (r.getValue('custrecord_c_gtm_bono_manual9')) ? bonoName9+' - '+ r.getValue('custrecord_c_gtm_bono_manual9') : bonoName9+' - '+0,
                     bono_manual10: (r.getValue('custrecord_c_gtm_bono_manual10')) ? bonoName10+' - '+ r.getValue('custrecord_c_gtm_bono_manual10') : bonoName10+' - '+0
                     //Bonos manuales-->
                 });
                return true;
             });
             
             return obj_detail;
        }catch(err){
            log.error("error getValuesSublist",err)
        }
    }
    function getURL(idEmpl){
        try{
             log.debug("url",idEmpl);
            var scheme = 'https://';
            var host = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });
             var output = url.resolveRecord({
                    recordType: 'customrecord_compensaciones_gtm',
                    recordId: idEmpl,
                    isEditMode: false
                });
             log.debug("url",output);
             return scheme+host+output;
        }catch(err){
            log.error("error getValuesSublist",err)
        }
    }
    
    
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
