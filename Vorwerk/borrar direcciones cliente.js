function borrarDireciones()
{
	var c = nlapiGetContext();
	var rU = 0;
	var testRec = nlapiLoadRecord('customrecord_imprimir_comosiones',17);
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'noneof', '@NONE@');
	filters[1] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', testRec.getFieldValue('custrecord_test'));
	var columns = new nlobjSearchColumn('internalid').setSort();    
	resultsCTE = nlapiSearchRecord('customer', null, filters, columns);
	for(i=0; i < resultsCTE.length; i++)
	{
		var cteRec = nlapiLoadRecord('customer',resultsCTE[i].getValue('internalid'));
		var lineas = cteRec.getLineItemCount('addressbook');
		for(j=lineas; j >=1; j--)
		{
			cteRec.removeLineItem('addressbook',j);
			//lineas = cteRec.getLineItemCount('addressbook');
		}
		var cteRecID = nlapiSubmitRecord(cteRec);
		rU=c.getRemainingUsage();
		if(rU<=13) { testRec.setFieldValue('custrecord_test',cteRecID);nlapiSubmitRecord(testRec); }
		rU=c.getRemainingUsage();
		nlapiLogExecution('DEBUG','cteRec ID', (cteRecID + ' '+ rU));
	}
}
