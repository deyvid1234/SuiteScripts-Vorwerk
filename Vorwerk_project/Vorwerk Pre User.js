/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','./Vorwerk Utils.js','./Vorwerk Dictionary Script.js'],

function(record,search,Utils,Dictionary) {
   var config_fields = Dictionary.getDictionayFields();
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
        try{
            var thisRecord = scriptContext.newRecord;
            var oldrecord = scriptContext.oldRecord;
            var xmlSatOld= oldrecord.getValue('custrecord_c_pre_xml_sat') 
            var xmlSatNew= oldrecord.getValue('custrecord_c_pre_xml_sat')  
            if(xmlSatNew!= ''){
                var xmlSat = file.load({
                  id: xmlSatNew
                });
                
                var xmls = xmlSat.getContents();
                var xmlDocument = xml.Parser.fromString({
                            text : xmls
                        });              
               
                var elementTFD = xmlDocument.getElementsByTagNameNS({
                    namespaceURI : '*',
                    localName : 'TimbreFiscalDigital'
                })[0];
                
                var uuid = elementTFD.getAttribute("UUID");
                log.debug('UUID', uuid);
                var elementComprobante = xmlDocument.getElementsByTagNameNS({
                    namespaceURI : '*',
                    localName : 'Comprobante'
                })[0];
                 
                var folio = elementComprobante.getAttribute("Folio");
                log.debug('folio', folio);

                thisRecord.setValue('custrecord_folio_sat_pre',folio)
                thisRecord.setValue('custrecord_folio_fiscal_pre',uuid)

                
            }     
        }catch(err){
                    log.error("error folio",err);
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
    function afterSubmit(scriptContext) {
        try{
            var rec = scriptContext.newRecord;
            var rec_type = rec.type;
            var subtotal = rec.getValue('custrecord_total_reporte_pre');
            var total = 0; 
            var retencion = 0;
            var sumBonos = Utils.getBonos(1,rec);
            
                subtotal= subtotal+sumBonos;
                var rec_related = rec.getValue('custrecord_sub_registro_compensaciones_p');
                var tmp_period = search.lookupFields({
                    type: 'customrecord_registro_compensaciones',
                    id: rec_related,
                    columns: 'custrecord_periodo_comision'
                });
                
                var period = tmp_period.custrecord_periodo_comision[0].value;
                var listISR = Utils.getISRData(period);//se extrae la lista de isr 
                var isr = listISR.isrList;
                for(var x in isr){
                    if(subtotal > parseFloat(isr[x].inferiorLimit)  && subtotal <= parseFloat(isr[x].topLimit)){//se valida que el subtotal se mayor al limite inferior y menor que el limite superior
                        
                        var ret_aux = subtotal -parseFloat(isr[x].inferiorLimit)//subtotal menos limite inferior
                        var porcentaje = parseFloat(isr[x].percentOverIL)/100;//se obtiene el porcentaje de cuota
                        var base = ret_aux*porcentaje //se extrae la base de isr
                        retencion = base+parseFloat(isr[x].quota);//se obtiene la retencion
                        break;
                    }
                }
                total = subtotal-retencion;
                try{
                    var rec_jdg = record.load({
                        type: rec_type,
                        id: rec.id,
                        isDynamic: true
                    });
                    rec_jdg.setValue('custrecord_c_pre_retencion',retencion);
                    rec_jdg.setValue('custrecord_c_pre_total',total);
                    rec_jdg.setValue('custrecord_c_pre_subtotal',subtotal);
                    rec_jdg.save({enableSourcing: false, ignoreMandatoryFields: true });
                }catch(err_set){
                    log.error("error set retencion",err_set);
                }
                
                
                log.debug('listISR',listISR);
                
            
            
        }catch(err){
            log.error('Error afterSubmit',err);
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
