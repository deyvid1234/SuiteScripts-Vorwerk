/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Jan 2015     sergioponce
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord recordType
 * 
 * @param {String}
 *            type Operation types: create, edit, delete, xedit, approve,
 *            cancel, reject (SO, ER, Time Bill, PO & RMA only) pack, ship (IF
 *            only) dropship, specialorder, orderitems (PO only) paybills
 *            (vendor payments)
 * @returns {Void}
 */
function cicloClienteVentas(type) {
	
	var recordType = nlapiGetRecordType ();
	var recordId = nlapiGetRecordId ();
	
	try {
		if(type == 'create' || type == 'edit') {
			var createdfrom = nlapiGetFieldText ('createdfrom');
			var createdfromid = nlapiGetFieldValue ('createdfrom');
			var tran = createdfrom.split ('#')||[];
			var transactionType  = tran[0].toLowerCase();
			if(transactionType.indexOf('orden de venta') > -1 || transactionType.indexOf('sales order') > -1) {
				var serie = nlapiGetLineItemText ('item', 'serialnumbers', 1);
				serie = serie.toString ();
				var fecha = nlapiGetFieldValue ('trandate');
				var entityId = '';
				var entity = '';
				
				if(serie != '') {
					var salesorderRec = nlapiLoadRecord ('salesorder', createdfromid);
					entityId = salesorderRec.getFieldValue ('entity');
					entity = salesorderRec.getFieldText ('entity');
					var fechaVenta = salesorderRec.getFieldValue ('trandate');
					nlapiSubmitField ('customer', entityId, [ 'custentity_imr_vta',
					        'custentity_imr_fventa',
					        'custentity_imr_serievendida',
					        'custentity_imr_entregado',
					        'custentity_imr_fentrega',
					        'custentity_imr_contactoent' ], [ 'T',
					        fechaVenta,
					        serie,
					        'T',
					        fecha,
					        entity ]);
					nlapiLogExecution ('error', 'Se actualizo '+entity+' fechaVenta:'+fechaVenta+' serie:'+serie);
				}
				
//				if (serie != '') 
//				{
//					var filters 	= new Array();
//					filters.push(new nlobjSearchFilter('serialnumber', null, 'is', serie));
//					filters.push(new nlobjSearchFilter('internalid', null, 'is', createdfromid));
//			
//					var resultado 	= returnBlank(nlapiSearchRecord('salesorder', 'customsearch664', filters, null));
//					if(resultado != '')
//					{
//						entityId 		= nlapiGetFieldValue('entity');
//						entity			= returnBlank(resultado[0].getText('entity'));
////						cambiada a trandete por solicitud de pilar
//						var fechaVenta			= returnBlank(resultado[0].getValue('trandate'));
//						entity			= returnBlank(resultado[0].getText('entity'));
//						
//						nlapiSubmitField ('customer', entityId, 
//											[ 'custentity_imr_vta', 'custentity_imr_fventa', 'custentity_imr_serievendida',  'custentity_imr_entregado', 'custentity_imr_fentrega', 'custentity_imr_contactoent' ], 
//											[ 'T', fechaVenta, serie, 'T', fecha, entity ]);
//						nlapiSubmitField('customer', entityId, 'custentity_imr_fventa', fecha);
//						nlapiSubmitField('customer', entityId, 'custentity_imr_serievendida', serie);
//						nlapiSubmitField('customer', entityId, 'custentity_imr_entregado', 'T');
//						nlapiSubmitField('customer', entityId, 'custentity_imr_fentrega', fecha);
//						nlapiSubmitField('customer', entityId, 'custentity_imr_contactoent', entity);
//					else
//					{
//						//alert('no se encontro el numero de serie: ' + serie);
//						//nlapiSendEmail(-5, 'sponce@imr.com.mx', 'Falla Ciclo Clientes (Ventas)', 'No se encontró el número de serie en el registro: '+recordType+' con id: '+recordId);
//					}
//				}
//				else
//				{
//					//alert('no se encontro el numero de serie: ' + serie);
//					//nlapiSendEmail(-5, 'sponce@imr.com.mx', 'Falla Ciclo Clientes (Ventas)', 'Número de serie vacío en el registro: '+recordType+' con id: '+recordId);
//				}
			}
		}
	}
	catch(e) {
		Generic_HE_Catch_SS (e, recordType, recordId);
	}
}
