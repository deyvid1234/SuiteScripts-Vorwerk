//===================================================================================================================================
// Script File	: VOR_MassiveInvoicing_C.js
// Script Type  : Client Event
// Description 	:
// Author		: Cesar Hernandez - Netsoft
// Date			: 26-03-2018
//===================================================================================================================================

function showRequest(){

	var startdate = nlapiGetFieldValue("custpage_startdate");
	var enddate	  = nlapiGetFieldValue("custpage_enddate");

	var url = nlapiResolveURL('SUITELET', 'customscript_massinvoicing_s', 'customdeploy_massinvoicing_s') +
			'&startDate=' + startdate +  '&endDate=' + enddate;

	window.ischanged = false;
	window.location  = url;
}

function ValidateUI_SaveRecord(){
	console.log('Save Record function');
	var retval = true;
	var count  = 0;

	for (var i = 1; i <= nlapiGetLineItemCount('custpage_transac_list'); i++){
		var marked    = nlapiGetLineItemValue("custpage_transac_list", "custpage_marked", i);
		if(marked == 'T'){
			count++;
		}
	}

	if(count ==0 ){
		console.log('ERROR: Should include at least one transaction.');
		alert('Seleccione al menos una transacción.');
		retval = false;
	}

	return retval;
}
