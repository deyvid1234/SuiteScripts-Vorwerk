/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Apr 2016     sponce
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function Ciclo_Clientes_Update(recType, recId) 
{
	try
		{
			var record			= nlapiLoadRecord(recType, recId);			
			var tipo 			= record.getFieldValue('custrecord_imr_tipociclo');
			var fecha			= record.getFieldValue('custrecord_imr_fecha');
			var serie 			= record.getFieldValue('custrecord_imr_serie');

			var filters = new Array();
			filters.push(new nlobjSearchFilter('serialnumber', null, 'is', serie));
			var resultado = returnBlank(nlapiSearchRecord('salesorder', 'customsearch664', filters, null));
			if (resultado != '') 
			{
				conta 			= nlapiEscapeXML(returnBlank(resultado[0].getText('entityid', 'contactPrimary')));
				
				if (conta == '') 
				{
					conta = nlapiEscapeXML(returnBlank(resultado[0].getText('custbodycontacto1')));
					entityId = nlapiEscapeXML(returnBlank(resultado[0].getValue('custbodycontacto1')));
					if(conta == '') 
					{
						conta = nlapiEscapeXML(returnBlank(resultado[0].getText('entity')));
						entityId = nlapiEscapeXML(returnBlank(resultado[0].getValue('entity')));
					}
				}
				
				conta = getName(conta);

				if (tipo == 8) 
				{
					var filters	= new Array();
					filters.push(new nlobjSearchFilter('altname', null, 'is', conta));
					var columns = new Array();
					columns.push(new nlobjSearchColumn('internalid'));
					columns.push(new nlobjSearchColumn('altname'));
					columns.push(new nlobjSearchColumn('custentity_imr_cteent'));
					var customer			= returnBlank(nlapiSearchRecord('customer', null, filters, columns));
					var entityId			= customer[0].getValue('internalid');
					var entity_name			= customer[0].getValue('altname');
					var entrega_tm			= returnBlank(customer[0].getValue('custentity_imr_cteent'));

					if(entrega_tm == 'F')
					{
						var rscnt 				= 1000;
						var nextStartIndex	 	= 0;
						var nextEndIndex 		= 1000;
						var customer_name 		= '';
						
						var column = new Array();
						column.push(new nlobjSearchColumn('internalid'));
						column.push(new nlobjSearchColumn('altname'));
						column.push(new nlobjSearchColumn('custentity_imr_cteent'));
	
						var newSearch = nlapiCreateSearch('customer', null, column);
						var searchResultSet = newSearch.runSearch();
	
						while (rscnt == 1000) 
						{
						   var rs = searchResultSet.getResults(nextStartIndex, nextEndIndex);
	
						   for (var i=0; i < rs.length; i++) 
						   {
						        // go through each nlobjSearchResult object
							   customer_name	= rs[i].getValue('altname');
							   if(entity_name == customer_name)
							   {
									nlapiSubmitField('customer', entityId, 'custentity_imr_cteent', 'T');
									nlapiSubmitField('customer', entityId, 'custentity_imr_ctefent', fecha);
									nlapiSubmitField('customer', entityId, 'custentity_imr_ctecent', conta);
							   }
						   }
	
						   rscnt 				= rs.length;
						   nextStartIndex		= nextEndIndex;
						   nextEndIndex 		= nextEndIndex + 1000;
						}
					}
				}
			}
		}
		catch(error)
		{
			Generic_HE_Catch_SS(error,recType,recId);
		}
	}

	// ------------------ Validaciones / Elimina duplicados ---------------//

	function getName(conta)
	{
		var cus = conta.split(' ');
		var cust = '';
		for(var a = 1; a<cus.length; a++)
		{
		cust += cus[a] + ' ';
		}
		cust = cust.substring(0, cust.length-1);
		return cust;
	}
