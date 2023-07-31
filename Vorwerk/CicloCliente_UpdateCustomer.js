/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Oct 2015     sponce
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function CicloCliente_UpdateCustomer(recType, recId) {
	
	try
	{
		var transaction		= nlapiLoadRecord(recType, recId);
		var createdfrom		= transaction.getFieldText('createdfrom');	
		var tran			= createdfrom.split('#');
		if(tran[0] == 'Orden de venta ' || tran[0] == 'Sales Order ')
		{
			var serie 			= transaction.getLineItemText('item','serialnumbers',1);
				serie			= serie.toString();
			var fecha			= transaction.getFieldValue('trandate');
			var entityId		= '';
			var entity			= '';
			
			if (serie != '') 
			{
				var filters 	= new Array();
				filters.push(new nlobjSearchFilter('serialnumber', null, 'is', serie));
				/*filters.push(new nlobjSearchFilter('custentity_imr_vta', 'entity', 'is', 'F'));
				filters.push(new nlobjSearchFilter('custentity_imr_fventa', 'entity', 'isempty', null));
				filters.push(new nlobjSearchFilter('custentity_imr_serievendida', 'entity', 'isempty', null));
				filters.push(new nlobjSearchFilter('custentity_imr_entregado', 'entity', 'is', 'F'));
				filters.push(new nlobjSearchFilter('custentity_imr_fentrega', 'entity', 'isempty', null));
				filters.push(new nlobjSearchFilter('custentity_imr_contactoent', 'entity', 'isempty', null));
				var columns		= new Array();
				columns.push(new nlobjSearchColumn('custentity_imr_vta', 'entity', null));
				columns.push(new nlobjSearchColumn('custentity_imr_fventa', 'entity', null));
				columns.push(new nlobjSearchColumn('custentity_imr_serievendida', 'entity', null));
				columns.push(new nlobjSearchColumn('custentity_imr_entregado', 'entity', null));
				columns.push(new nlobjSearchColumn('custentity_imr_fentrega', 'entity', null));
				columns.push(new nlobjSearchColumn('custentity_imr_contactoent', 'entity', null));*/
				var resultado 	= returnBlank(nlapiSearchRecord('salesorder', 'customsearch664', filters, null));
				if(resultado != '')
				{
					entityId 		= transaction.getFieldValue('entity');
					entity			= returnBlank(resultado[0].getText('entity'));
					nlapiLogExecution('ERROR', 'Cliente', entityId+' - nombre: '+entity+', fecha: '+fecha+', serie: '+serie);
					nlapiSubmitField('customer', entityId, 'custentity_imr_vta', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_fventa', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_serievendida', serie);
					nlapiSubmitField('customer', entityId, 'custentity_imr_entregado', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_fentrega', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_contactoent', entity);
					nlapiLogExecution('ERROR', 'Guardado');
				}
				else
				{
					//alert('no se encontro el numero de serie: ' + serie);
					nlapiSendEmail(-5, 'sponce@imr.com.mx', 'Falla Ciclo Clientes (Ventas)', 'No se encontró el número de serie en el registro: '+recType+' con id: '+recId);
				}
			}
			else
			{
				//alert('no se encontro el numero de serie: ' + serie);
				nlapiSendEmail(-5, 'sponce@imr.com.mx', 'Falla Ciclo Clientes (Ventas)', 'Número de serie vacío en el registro: '+recType+' con id: '+recId);
			}
		}
	}
	catch(e)
	{
		Generic_HE_Catch_SS(e,recType,recId);
  	}
	
}
