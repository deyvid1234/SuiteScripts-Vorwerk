/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope public
 *
 * @ScriptName
 * @Company NetSoft
 * @Author Christopher Jaffet Amezcua Jimenez
*/

define(['N/search', 'N/record'], function(search, record) {
    var handler = {};

    handler.getInputData = function() {
        /*var assetSearch = search.create({ type: 'customrecord_asset' });
        var pages = assetSearch.runPaged({ pageSize: 1000 });
        var ids = [];

        pages.pageRanges.forEach(function (page){
            var actualPage = pages.fetch({ index: page.index });
            actualPage.data.forEach(function (row){
                ids.push( row.id );
             });
        });*/
        var ids = ['JDG002964',
                'JDG002965',
                'JDG002966',
                'JDG002967',
                'JDG002968',
                'JDG002969',
                'JDG002970',
                'JDG002971',
                'JDG002972',
                'JDG002973',
                'JDG002974',
                'JDG002975',
                'JDG002976',
                'JDG002977',
                'JDG002978',
                'JDG002979',
                'JDG002980',
                'JDG002981',
                'JDG002982',
                'JDG002983',
                'JDG002984',
                'JDG002985',
                'JDG002986',
                'JDG002987',
                'JDG002988',
                'JDG002989',
                'JDG002990',
                'JDG002991',
                'JDG002992',
                'JDG002993',
                'JDG002994',
                'JDG002995',
                'JDG002996',
                'JDG002997',
                'JDG002998',
                'JDG002999',
                'JDG003000',
                'JDG003001',
                'JDG003002',
                'JDG003003',
                'JDG003004',
                'JDG003005',
                'JDG003006',
                'JDG003007',
                'JDG003008',
                'JDG003009',
                'JDG003011',
                'JDG003012',
                'JDG002905',
                'JDG002908',
                'JDG002911',
                'JDG002912',
                'JDG002913',
                'JDG002914',
                'JDG002915',
                'JDG002916',
                'JDG002917',
                'JDG002918',
                'JDG002919',
                'JDG002920',
                'JDG002921',
                'JDG002922',
                'JDG002923',
                'JDG002924',
                'JDG002925',
                'JDG002926',
                'JDG002927',
                'JDG002928',
                'JDG002929',
                'JDG002930',
                'JDG002931',
                'JDG002932',
                'JDG002934',
                'JDG002935',
                'JDG002936',
                'JDG002937',
                'JDG002938',
                'JDG002939',
                'JDG002940',
                'JDG002941',
                'JDG002942',
                'JDG002943',
                'JDG002944',
                'JDG002945',
                'JDG002946',
                'JDG002947',
                'JDG002948',
                'JDG002949',
                'JDG002950',
                'JDG002951',
                'JDG002952',
                'JDG002953',
                'JDG002954',
                'JDG002955',
                'JDG002956',
                'JDG002957',
                'JDG002958',
                'JDG002959',
                'JDG002960',
                'JDG002963'];

        //log.debug('ids', ids);
        return ids;
    };

    handler.map = function(context) {
      try {

        //log.debug('map');
        var recordName = context.value;
        log.debug('recordName', recordName);


        var filters = [ ['idtext', 'is', recordName] ];
        try{
            var idRecord = search.create({
                type   : 'customrecord_comisiones_jdg',
                filters: filters,
            }).run().getRange({ start: 0, end: 1 })[0].id;
        }catch(ex){
            log.debug('Notmade');
            var idRecord = null;
        }
        log.debug('idRecord', idRecord);

        if(idRecord){
            var recordLoaded = record.load({type: 'customrecord_comisiones_jdg', id: idRecord});
            recordLoaded.setValue({fieldId: 'custrecord_jdg_mensaje_respuesta', value: ''});
            recordLoaded.setValue({fieldId: 'custrecord_jdg_codigo_respuesta', value: ''});
            recordLoaded.setValue({fieldId: 'custrecord_jdg_xml_netsuite', value: ''});
            recordLoaded.setValue({fieldId: 'custrecord_jdg_xml_sat', value: ''});
            recordLoaded.setValue({fieldId: 'custrecord_jdg_pdf', value: ''});
            var idRecord = recordLoaded.save({ignoreMandatoryFields: true});
            log.debug('record Saved', idRecord);
        }



      } catch (e) {
        log.debug("ERROR", e.message);
      }
    };

    handler.summarize = function(summary) {
        var type = summary.toString();

        log.debug(type + ' Usage Consumed', summary.usage);
        log.debug(type + ' Number of Queues', summary.concurrency);
        log.debug(type + ' Number of Yields', summary.yields);
    };

    return handler;
});
