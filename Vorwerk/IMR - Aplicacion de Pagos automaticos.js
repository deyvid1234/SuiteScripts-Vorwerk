/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 Sep 2016     jonathanvargas
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function aplicacionPagosPeriodoCerrado(type) {
	var recordType	= '';
	var recordId	= '';

	var searchPay = nlapiSearchRecord ('transaction', 'customsearch_pagos_mp_sin_facturas')||[];
	var invoiceID = new Array ();
	
	// extraemos todos los IDsd e factuas para validar si tienen salido
	for(var i = 0; i < searchPay.length; i++) {
		invoiceID.push (searchPay[i].getValue ('billingtransaction', 'CUSTBODY_MP_ORDEN_VENTA_RELACIONADA', 'GROUP'));
	}
	var searchInvoice = nlapiSearchRecord ('transaction', null, [ new nlobjSearchFilter ('recordtype', null, 'is', 'invoice'),
														        new nlobjSearchFilter ('mainline', null, 'is', 'T'),
														        new nlobjSearchFilter ('amountremaining', null, 'greaterthan', 0),
														        new nlobjSearchFilter ('internalid', null, 'is', invoiceID) ], [ new nlobjSearchColumn ('tranid'),
														        new nlobjSearchColumn ('amount'),
														        new nlobjSearchColumn ('amountremaining') ])||[];
	
	// recorremos todos los pagos
	for(var i = 0; i < searchPay.length; i++) {
		var payId = searchPay[i].getValue ('internalid', null, 'group');
		var payInvoiceId = searchPay[i].getValue ('billingtransaction', 'CUSTBODY_MP_ORDEN_VENTA_RELACIONADA', 'GROUP');
		var hasInvoice = isInvoice (payInvoiceId, searchInvoice);
		nlapiLogExecution ('DEBUG', 'analisamos pay:'+payId+' invoice:'+payInvoiceId);
		//validamos si tiene una factura con saldo, sino brincamos al siguiente pago
		if(hasInvoice) {
			var invoiceApply= false;
			var payApply= false;
			var payRec =nlapiTransformRecord ('invoice', payInvoiceId, 'customerpayment', {recordmode: 'dynamic'})
			var amount = payRec.getFieldValue ('payment');
			
			payRec.setFieldValue ('trandate',nlapiDateToString (new Date()));
			
			//payRec.setFieldValue ('payment',0);
			// buscamos el pago para saldarlo y tomar el total
			var payCount = payRec.getLineItemCount ('credit');
			for(var payLine = 1; payLine <= payCount; payLine++) {
				var payDoc = payRec.getLineItemValue ('credit', 'doc', payLine);
				var due = payRec.getLineItemValue ('credit', 'due', payLine);
				var apply = payRec.getLineItemValue ('credit', 'apply', payLine);
				if(payDoc == payId && apply =='F') {
					amount = due;
					payRec.selectLineItem ('credit', payLine);
					payRec.setCurrentLineItemValue ('credit', 'apply', 'T');
					payRec.setCurrentLineItemValue ('credit', 'amount', amount);
					payRec.commitLineItem ('credit');
					payApply = true;
				}
				else{
					payRec.selectLineItem ('credit', payLine);
					payRec.setCurrentLineItemValue ('credit', 'apply', 'F');
					payRec.setCurrentLineItemValue ('credit', 'amount', 0);
					payRec.commitLineItem ('credit');
				}
			//	nlapiLogExecution ('DEBUG', 'line pay:'+payLine+' of:'+payCount);
			}
			
			// buscamos la aplicacion del pago
			var applyCount = payRec.getLineItemCount ('apply');
			for( var applyLine = 1; applyLine <= applyCount; applyLine++) {
				var payDoc = payRec.getLineItemValue ('apply', 'doc', applyLine);
				var apply = payRec.getLineItemValue ('apply', 'apply', applyLine);
				// aplicamos
				if(payDoc == payInvoiceId) {
					payRec.selectLineItem ('apply', applyLine);
					payRec.setCurrentLineItemValue ('apply', 'apply', 'T');
					payRec.setCurrentLineItemValue ('apply', 'amount', amount);
					payRec.commitLineItem ('apply');
					invoiceApply = true;
					nlapiLogExecution ('DEBUG','aplicamos el monto');
				}
				else{
					payRec.selectLineItem('apply', applyLine);
					payRec.setCurrentLineItemValue('apply', 'apply', 'F');
					payRec.setCurrentLineItemValue('apply', 'amount', 0);
					payRec.commitLineItem('apply');
				}
			//	nlapiLogExecution ('DEBUG', 'line apply:'+applyLine+' of:'+applyCount);
			}
			try{
				if(invoiceApply && payApply){
					var validaAmount = payRec.getFieldValue ('payment');
					if(validaAmount ==  0){
						var id = nlapiSubmitRecord (payRec);
						nlapiLogExecution ('DEBUG','aplicamos pago:'+payId+' amount:'+amount+' invoice:'+payInvoiceId);
						if( id != 0 ){
							nlapiDeleteRecord ('customerpayment', id);
							nlapiLogExecution ('DEBUG','delete pay pago:'+id);
						}					
					}
				}
			}catch(error){
				
				Generic_HE_Catch_SS(error,'customerpayment',payId);
			}
		}// has invoice
		else{
			nlapiLogExecution ('DEBUG','sin coincidencias pago:'+payId+' invoice:'+payInvoiceId);
		}
		nlapiGetContext ().setPercentComplete (100/searchPay.length*i);
	}// for
	
	nlapiSendEmail (44278, 'Pilar.Torres@vorwerk.de', 'Ejecucion de aplicacion de pagos', 'La ejecucion de pagos se ha completado exitosamente ',
					null, 'jonathan.vargas@imr.com.mx');
}

function aplicacionPagosPeriodoAbierto(type) {
	var searchPay = nlapiSearchRecord ('transaction', 'customsearch_pagos_mp_sin_facturas');
	var invoiceID = new Array ();
	
	// extraemos todos los IDsd e factuas para validar si tienen salido
	for(var i = 0; i < searchPay.length; i++) {
		invoiceID.push (searchPay[i].getValue ('billingtransaction', 'CUSTBODY_MP_ORDEN_VENTA_RELACIONADA', 'GROUP'));
	}
	var searchInvoice = nlapiSearchRecord ('transaction', null, [ new nlobjSearchFilter ('recordtype', null, 'is', 'invoice'),
														        new nlobjSearchFilter ('mainline', null, 'is', 'T'),
														        new nlobjSearchFilter ('amountremaining', null, 'greaterthan', 0),
														        new nlobjSearchFilter ('internalid', null, 'is', invoiceID) ], [ new nlobjSearchColumn ('tranid'),
														        new nlobjSearchColumn ('amount'),
														        new nlobjSearchColumn ('amountremaining') ]);
	
	// recorremos todos los pagos
	for(var i = 0; i < searchPay.length; i++) {
		var payId = searchPay[i].getValue ('internalid', null, 'group');
		var payInvoiceId = searchPay[i].getValue ('billingtransaction', 'CUSTBODY_MP_ORDEN_VENTA_RELACIONADA', 'GROUP');
		var hasInvoice = isInvoice (payInvoiceId, searchInvoice);
		
		//validamos si tiene una factura con saldo, sino brincamos al siguiente pago
		if(hasInvoice) {
			var invoiceApply= false;
			var payRec = nlapiLoadRecord ('customerpayment', payId,{recordmode: 'dynamic'});
			
			var amount = payRec.getFieldValue ('payment');
			var applyCount = payRec.getLineItemCount ('apply');
			payRec.setFieldValue ('autoapply', 'F');
			// buscamos la aplicacion del pago
			for(var payLine = 1; payLine <= applyCount; payLine++) {
				var payDoc = payRec.getLineItemValue ('apply', 'doc', payLine);
				var due = payRec.getLineItemValue ('apply', 'due', payLine);
				var apply = payRec.getLineItemValue ('apply', 'apply', payLine);
				// aplicamos
				if(payDoc == payInvoiceId  && amount == due && apply =='F') {
					payRec.selectLineItem ('apply', payLine);
					payRec.setCurrentLineItemValue ('apply', 'apply', 'T');
					payRec.setCurrentLineItemValue ('apply', 'amount', amount);
					payRec.commitLineItem ('apply');
					invoiceApply = true;
					nlapiLogExecution ('DEBUG','aplicamos el monto');
					break;
				}
			}
			if(invoiceApply){
				var validaAmount = payRec.getFieldValue ('payment');
				if(validaAmount ==  amount){
					nlapiSubmitRecord (payRec);
					nlapiLogExecution ('DEBUG','aplicamos pago:'+payId+' amount:'+amount+' invoice:'+payInvoiceId);
				}
			}
		}
	}
}

function isInvoice(key, search) {
	for(var i = 0; i < search.length; i++) {
		var idInvoice = search[i].getId ();
		if(idInvoice == key) {
			return true;
		}
	}
	return false;
}