/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','./Vorwerk Utils.js','./Vorwerk Dictionary Script.js','N/file','N/xml'],

function(record,search,Utils,Dictionary,file,xml) {
   
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
            var xmlSatOld= oldrecord.getValue('custrecord_c_jdg_xml_sat') 
            log.debug('xmlSatOld',xmlSatOld)
            var xmlSatNew= oldrecord.getValue('custrecord_c_jdg_xml_sat')  
            log.debug('xmlSatNew',xmlSatNew)
            if(xmlSatNew!= ''){
                var xmlSat = file.load({
                  id: xmlSatNew
                });
                log.debug('xmlSat',xmlSat)
                var xmls = xmlSat.getContents();
                log.debug('xmls',xmls)
                var xmlDocument = xml.Parser.fromString({
                            text : xmls
                        });
                log.debug('xmlDocument',xmlDocument)
                var bookNode = xml.XPath.select({
                    node : xmlDocument,
                    xpath : 'Timbrado de Nominas/JDG/xml_JDGD004331.xml'
                });
                log.debug('bookNode',bookNode)

                
                
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
            log.debug("start afeter submit","start");
            
            var rec = scriptContext.newRecord;
            var rec_type = rec.type;
            var subtotal = rec.getValue('custrecord_total_reporte_jdg');
            var total = 0; 
            var retencion = 0;
            var sumBonos = Utils.getBonos(3,rec);
            log.debug('sumBonos',sumBonos);
            
            
                log.debug('subtotal',subtotal);
                subtotal= subtotal+sumBonos;
                var rec_related = rec.getValue('custrecord_sub__registro_compensaciones');
                log.debug('rec_related',rec_related);
                var tmp_period = search.lookupFields({
                    type: 'customrecord_registro_compensaciones',
                    id: rec_related,
                    columns: 'custrecord_periodo_comision'
                });
                log.debug('tmp_period',tmp_period);
                var period = tmp_period.custrecord_periodo_comision[0].value;
                var listISR = Utils.getISRData(period);//se extrae la lista de isr 
                var isr = listISR.isrList;
                log.debug('isr',isr);
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
                    rec_jdg.setValue('custrecord_c_jdg_retencion',retencion);
                    rec_jdg.setValue('custrecord_c_jdg_total',total);
                    rec_jdg.setValue('custrecord_c_jdg_subtotal',subtotal);
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
