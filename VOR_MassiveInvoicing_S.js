//===================================================================================================================================
// Script File	: VOR_MassiveInvoicing_S.js
// Script Type  : Suitelet
// Description 	: Displays fields to use as filters to show a list of sales orders
// Author		: Cesar Hernandez - Netsoft
// Date			: 26-03-2018
//===================================================================================================================================

function UIMainFunction(request, response){
	if (request.getMethod() == "GET"){
		var form = nlShowRequestForm(request, response);
		nlDisplayRequest(request, response, form);
	}

	if (request.getMethod() == "POST"){
		var user_id      = parseInt(nlapiGetUser());
		var massProcesId = createMasiveProces(request, response);

		var objParams = { custscript_mipsc_recprocid: massProcesId,
						  custscript_mipsc_userid: user_id };
		nlapiLogExecution('DEBUG', 'objParams', objParams);

		var wstatus = nlapiScheduleScript('customscript_massinvoicing_sc', null, objParams);
		nlapiLogExecution('DEBUG', 'script scheduled', 'Script status: ' + wstatus);

		nlapiSetRedirectURL("RECORD", "customrecord_nso_massinvoicing_process", massProcesId);
	}
}

function createMasiveProces(request, response){
	var startdDate = request.getParameter("custpage_startdate");
	var endDate  = request.getParameter("custpage_enddate");
	var record = nlapiCreateRecord('customrecord_nso_massinvoicing_process', {recordmode: 'dynamic'});
	record.setFieldValue('custrecord_mip_start_date', startdDate);
	record.setFieldValue('custrecord_mip_end_date', endDate);
	record.setFieldValue('custrecord_mip_process_status', 1);
	record.setFieldValue('custrecord_mip_triger_schedule', 'T');

	for(var i = 1; i <= request.getLineItemCount('custpage_transac_list'); i++){
		var marked     = request.getLineItemValue("custpage_transac_list", "custpage_marked", i);
		var salesOrdId = request.getLineItemValue("custpage_transac_list", "custpage_salesorder", i);
		var creatDate  = request.getLineItemValue("custpage_transac_list", "custpage_datecreated", i);
		var ammtDifFld = request.getLineItemValue("custpage_transac_list", "custpage_ammt_dif", i);
        var entity 	   = request.getLineItemValue("custpage_transac_list", "custpage_employee", i);

		nlapiLogExecution("DEBUG", i + ' marked: ' + marked, 'salesOrdId: ' + salesOrdId + ' - entity:' + entity);

		if(marked == 'T'){
			record.selectNewLineItem('recmachcustrecord_mipd_mass_process');
			record.setCurrentLineItemValue('recmachcustrecord_mipd_mass_process', 'custrecord_mipd_salesorder', salesOrdId);
            if( parseInt(entity) ){
				nlapiLogExecution('DEBUG', 'entity: ' + entity, typeof entity);
				record.setCurrentLineItemValue('recmachcustrecord_mipd_mass_process', 'custrecord_mipd_seller', entity);
			}
			record.commitLineItem('recmachcustrecord_mipd_mass_process');
		}
	}

	var idrequestlow = nlapiSubmitRecord(record, true);

	return idrequestlow;
}



function nlShowRequestForm(request, response){

	var startDate = request.getParameter("startDate");
	var endDate   = request.getParameter("endDate");

	//--> Add Buttons
	var form = nlapiCreateForm( 'Proceso Masivo de Facturación' );

	var startdDateFld = form.addField('custpage_startdate','date', 'Desde la Fecha');
	var endDateFld 	  = form.addField('custpage_enddate','date', 'Hasta la Fecha');

	startdDateFld.setDefaultValue(startDate);
	endDateFld.setDefaultValue(endDate);
	startdDateFld.setMandatory(true);
	endDateFld.setMandatory(true);

	//----> Add sublist
	var sublist 	= form.addSubList('custpage_transac_list','list', 'Ordenes de venta' );
	var checkFld 	= sublist.addField('custpage_marked','checkbox', 'Seleccionar');
	var SalesOrdfld = sublist.addField('custpage_salesorder','select', 'Orden De venta', 'transaction');
	var tranDate    = sublist.addField('custpage_datecreated','date', 'Fecha' );
	var ammountDif 	= sublist.addField('custpage_ammt_dif','text', 'Diferencia' );
    var entityFld   = sublist.addField('custpage_employee','text', 'Vendedor');
    var entityName   = sublist.addField('custpage_employee_name','text', 'Creada por');

	sublist.addMarkAllButtons();
	SalesOrdfld.setDisplayType("inline");
	tranDate.setDisplayType("inline");
	ammountDif.setDisplayType("inline");
    entityFld.setDisplayType("hidden");
    entityName.setDisplayType("inline");

	//--> Add Buttons
	form.setScript('customscript_massinvoicing_c');
	form.addSubmitButton( 'Facturar Pedidos' );
	form.addButton('custpage_btnsearch', 'Filtrar', "showRequest();");

	//--> Write Page
	response.writePage( form );

	return form;
}



function nlDisplayRequest(request, response, form){

	var startDate = request.getParameter("startDate");
	var endDate   = request.getParameter("endDate");
    /*
	//_____________________________________________________________________________________________________________
	//Searching for setup record
	var setUpRecordSearch = nlapiSearchRecord('customrecord_massinvoicing_proc_setup');
	if(!setUpRecordSearch){
		nlapiLogExecution('DEBUG', 'NO Massive Invoicing Set Up Record');
		return;
	}
	var setUpRecord = nlapiLoadRecord('customrecord_massinvoicing_proc_setup', setUpRecordSearch[0].getId());
	//_____________________________________________________________________________________________________________

	var tolerance = parseFloat(setUpRecord.getFieldValue('custrecord_mips_tolerance')) || 0.0;*/
    var tolerance = 100;
	if(startDate && endDate){
		var linenum       = 0;
		var searchresult  = searchSalesOrders(startDate, endDate);
        var entities      = getSalesOrderCreators(searchresult);
		var sublist       = form.getSubList("custpage_transac_list");

		for(var i = 0 ; searchresult && i < searchresult.length; i++){
			var salesOrdId    = searchresult[i].getId();
			var tranDate      = searchresult[i].getValue('trandate');
			var ammountDif    = parseFloat(searchresult[i].getValue('custbody_total_a_pagar')) || 0.0;
			var ammountDifAbs = Math.abs(ammountDif);
            var creator;
            var creatorId;
            if(entities[salesOrdId]){
                creator = entities[salesOrdId].name || '';
                creatorId = entities[salesOrdId].entityId || '';
            }
			if(ammountDifAbs <= tolerance){
				linenum += 1;
				nlapiInsertLineItem('custpage_transac_list', linenum );
				sublist.setLineItemValue('custpage_salesorder', linenum, salesOrdId);
				sublist.setLineItemValue('custpage_datecreated', linenum, tranDate);
				sublist.setLineItemValue('custpage_ammt_dif',   linenum, ammountDif);
                sublist.setLineItemValue('custpage_employee',   linenum, creatorId);
                sublist.setLineItemValue('custpage_employee_name',   linenum, creator);
			}
		}
	}
}

function getSalesOrderCreators(search, startDate, endDate){
    var salesOrders = (search || []).map(function (current) {
        return current.getId();
    });
    var filters = [
        //new nlobjSearchFilter('type', 'systemNotes', 'is', 'T'),
        new nlobjSearchFilter('mainline', null, 'is', 'T'),
        new nlobjSearchFilter('type', null, 'anyof', 'SalesOrd'),
        new nlobjSearchFilter('status', null, 'anyof', 'SalesOrd:F')];
    var columns = [];
    columns.push(new nlobjSearchColumn('name', 'systemNotes'));
    var salesEntities = (nlapiSearchRecord('transaction', null, filters, columns) || []).reduce(function (newDict, current) {
        newDict[current.getId()] = {};
        newDict[current.getId()]['entityId'] = current.getValue('name', 'systemNotes');
        newDict[current.getId()]['name'] = current.getText('name', 'systemNotes');
        return newDict;
    }, {});
    nlapiLogExecution('debug','ENTITIES',JSON.stringify(salesEntities));
    return salesEntities;
}


function searchSalesOrders(startDate, endDate){

	var filters = [['mainline', 'is', 'T'], 'AND', ["type", "anyof", "SalesOrd"], 'AND', ["status", "anyof", "SalesOrd:F"], 'AND', ["trandate", "within", [startDate, endDate]]];
	//if(startDate){ filters.push('AND', ["trandate", "", startDate]); }
	//if(endDate)	 { filters.push('AND', ["trandate", "", endDate]); }
	var columns = [];
	columns.push(new nlobjSearchColumn('custbody_total_a_pagar'));
	columns.push(new nlobjSearchColumn('trandate'));

	var searchresults = [];
	var mySearch        = nlapiCreateSearch('transaction', filters, columns);
	var searchresults_p = mySearch.runSearch();

	for (var k = 0; k < 5; ++k) {
		var temp = searchresults_p.getResults(k * 1000, (k + 1) * 1000);
		if(!temp || !temp.length){ break; }

		searchresults = searchresults.concat(temp);
	}
	nlapiLogExecution('DEBUG', 'Search Ended', searchresults.length);

	return searchresults;
}
