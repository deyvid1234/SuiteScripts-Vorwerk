//*** (P7) - Agregado el 24/02/2011
function Calc_Costo_X_Categoria()
{

	var recId	= nlapiGetRecordId();
	var entity  = nlapiGetFieldValue('entity');
	
	// Validaci�n Nro. 1 - Chequeo que el proveedor este seleccionado
	if (entity == null || entity == '')
	{
		alert ('Por favor seleccione un Proveedor para continuar.');
		return false;
	}
	
	// Validaci�n Nro. 2 - Chequeo que el proceso solo sea ejecutado en modo edici�n
	if (recId == null || recId == '')
	{
		alert ('El proceso solo puede ser ejecutado en modo edición. Verifique y vuelva a intentar.');
		return false;
	}	
	
	// Validaci�n Nro. 3 - Chequeo que las categor�as ingresadas en la apertura, se encuentren entre las categor�as incluidas en los art�culos
	var landedCostCategSel = new Array();
	
	for ( var a = 1; a <= nlapiGetLineItemCount('item'); a++)
	{
		landedCostCategSel.push(nlapiGetLineItemValue('item', 'landedcostcategory', a));
	}
	
	var filtersTmp = new Array();
		filtersTmp[0] = new nlobjSearchFilter('custrecord_3k_factura_prov_asociada', null, 'is', recId);
	var columnsTmp = new Array();
		columnsTmp[0] = new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
	
	var searchresultsTmp = nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filtersTmp, columnsTmp );
	
	var i = 0;
	var noEsta = false;
	
	while (searchresultsTmp != null && i < searchresultsTmp.length && noEsta == false)
	{
		if (in_array(searchresultsTmp[i].getValue('custrecord_3k_costosdesag_categoria'), landedCostCategSel))
		{
			noEsta = false;
		}
		else
		{
			noEsta = true;
		}		
		i++;
	}	
	if (noEsta == true)
	{
		alert('Se definió una categoría en la apertura, que no se encuentra dada de alta en ninguno de los artículos. Verifique y vuelva a intentar.');
		return false;
	}
	
	// Validaci�n Nro. 4 - Valido que en la apertura de costos desagregados ingresada, no exista una tupla recepci�n categor�a id�ntica en distintas l�neas
	// recorro la estructura auxiliar y me guardo en un arreglo, la tupla categoria-recepcion
	
	var arrayCategYRecepCargadas = new Array();
	
	var filtersTmp_1 = new Array();
		filtersTmp_1[0] = new nlobjSearchFilter('custrecord_3k_factura_prov_asociada', null, 'is', recId);
	var columnsTmp_1 = new Array();
		columnsTmp_1[0] = new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
		columnsTmp_1[1] = new nlobjSearchColumn("custrecord_3k_recepcion_asociada");
	var searchresultsTmp_1 = nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filtersTmp_1, columnsTmp_1 );
	for ( var i = 0; searchresultsTmp_1 != null && i < searchresultsTmp_1.length ; i++ )
	{
	
		var categoria = searchresultsTmp_1[i].getValue('custrecord_3k_costosdesag_categoria');
		var recepciones = searchresultsTmp_1[i].getValue('custrecord_3k_recepcion_asociada');
		
		var recepcionesArray = recepciones.split(',');
		
		var j = 0;
		
		while (recepcionesArray != null && recepcionesArray.length > j)
		{
			if (yaFueProcesado(arrayCategYRecepCargadas, categoria, recepcionesArray[j]))
			{
		
				alert ('Se ingreso la misma categoría de costos desagregados y recepción en múltiples lineas. Verifique y vuelva a intentar.');
				return false;
			}
			else
			{
				arrayTmp = new Array();
				arrayTmp['categoria'] = categoria;
				arrayTmp['recepcion'] = recepcionesArray[j];
				arrayCategYRecepCargadas.push(arrayTmp);
				
			}
			j++;
		}
	}
	
	// -- fin de las validaciones
	
	if (confirm('El proceso pisara los importes parciales por cada categoría. El mismo puede demorar unos segundos, desea continuar ?'))
	{
		var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_3k_factura_prov_asociada', null, 'is', recId);
		var columns = new Array();
			columns[0]	= new nlobjSearchColumn("custrecord_3k_proveedor_asociado");
			columns[1]	= new nlobjSearchColumn("custrecord_3k_recepcion_asociada");
			columns[2]	= new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
			columns[3]	= new nlobjSearchColumn("custrecord_3k_importe_parcial");
			columns[4]	= new nlobjSearchColumn("custrecord_3k_apertura_aplicada");
			columns[5]	= new nlobjSearchColumn("custrecord_3k_factura_prov_asociada");
                        columns[6] = new nlobjSearchColumn("custrecord_creado_por_script");
			
			columns[2].setSort(); // ordena por categoria

		var searchresults 	= nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filters, columns );
		
		if (searchresults == null || searchresults.length == 0)
		{
			
			alert ('No hay nada para procesar, verifique y vuelva a intentar.');
			return false;
		}
		
		var i = 0;
		
		while (searchresults != null && i < searchresults.length)
		{
			
			var categoria = searchresults[i].getValue('custrecord_3k_costosdesag_categoria');
			
			// guardo todas las recepciones para la categor�a, ya sea en una l�nea o en m�ltiples l�neas
			
			var categoriaSig = categoria;
			var recepcionesPorCategoria = new Array();
			
			while (searchresults != null && i < searchresults.length && searchresults[i].getValue('custrecord_3k_costosdesag_categoria') == categoria)
			{
			
				var proveedor = searchresults[i].getValue('custrecord_3k_proveedor_asociado');
				var recepcionesAsociadas 	= searchresults[i].getValue('custrecord_3k_recepcion_asociada');
				
				var recepcionesAsociadasArray = recepcionesAsociadas.split(',');
				var j = 0;
				
				while (recepcionesAsociadasArray != null && recepcionesAsociadasArray.length > j)
				{
				
					recepcionesPorCategoria.push({proveedor: proveedor, recepcion: recepcionesAsociadasArray[j]});
					j++;
				} // fin del while
				
				var recId_2 		= searchresults[i].getId();
				var recType_2 		= searchresults[i].getRecordType();
                                var check = searchresults[i].getValue('custrecord_creado_por_script');
			        if(check == 'T')
				            continue;
				nlapiDeleteRecord(recType_2, recId_2);
				i++;
				alert('nlapiDeleteRecord ' + i );
			} // fin del while categoriaSig == categoria
			//alert ('Debug: Categoria: ' + categoria);
			// logica del proceso
			
			alert('recepcionesPorCategoria ' + recepcionesPorCategoria );
			
			var importeParcial = 0;
			
			for ( var j = 1; j <= nlapiGetLineItemCount('item'); j++)
			{		
				var item				= nlapiGetLineItemValue('item', 'item', j);
				var quantity			= nlapiGetLineItemValue('item', 'quantity', j);
				var landedCostCategory	= nlapiGetLineItemValue('item', 'landedcostcategory', j);			
				if (categoria == landedCostCategory)
				{
					importeParcial	= importeParcial + parseFloat(nlapiGetLineItemValue('item', 'amount', j));
				}
			}
			
			//alert ('Debug: importeParcial: ' + importeParcial);
			
			// obtengo el importe total de las recepciones
			var recepcionesAsociadasArray = new Array();
			recepcionesAsociadasArray = recepcionesPorCategoria;
			var importeTotalRecepciones = 0;
			
			for ( var k_1 = 0; k_1 < recepcionesAsociadasArray.length; k_1++)
			{		
				alert(k_1 + ' recepcionesAsociadasArray[k_1] ' + recepcionesAsociadasArray[k_1] );
				var newRecItemReceipt 	= nlapiLoadRecord('itemreceipt', recepcionesAsociadasArray[k_1]['recepcion']);
				var countItems 			= newRecItemReceipt.getLineItemCount('item');
				var exchangerate		= newRecItemReceipt.getFieldValue('exchangerate');
				for ( var g_1 = 1; g_1 <= countItems; g_1++)
				{		
				
					var quantity	= newRecItemReceipt.getLineItemValue('item', 'quantity', g_1);
					var rate		= newRecItemReceipt.getLineItemValue('item', 'rate', g_1);
					importeTotalRecepciones = importeTotalRecepciones + (parseFloat(quantity)*parseFloat(rate)*parseFloat(exchangerate));				
				}				
			}
			
			//alert ('Debug: importeTotalRecepciones:' + importeTotalRecepciones);
			
			// seg�n la cantidad de recepciones, creo una linea p/ cada recepcion encontrada aplicando el porcentaje de la misma sobre el importe
			
			var recepcionesAsociadasArray = new Array();
			recepcionesAsociadasArray = recepcionesPorCategoria;
			for ( var k_2 = 0; k_2 < recepcionesAsociadasArray.length; k_2++)
			{
				alert(k_2 + ' recepcionesAsociadasArray[k_2] ' + recepcionesAsociadasArray[k_2] );
				// calculo el importe de la recepcion
				var newRecItemReceipt 	= nlapiLoadRecord('itemreceipt', recepcionesAsociadasArray[k_2]['recepcion']);
				var countItems 			= newRecItemReceipt.getLineItemCount('item');
				var exchangerate		= newRecItemReceipt.getFieldValue('exchangerate');
				
				var importeTotalRecepcion = 0;
				
				for ( var g_2 = 1; g_2 <= countItems; g_2++)
				{		
					var quantity	= newRecItemReceipt.getLineItemValue('item', 'quantity', g_2);
					var rate		= newRecItemReceipt.getLineItemValue('item', 'rate', g_2);
					
					importeTotalRecepcion = importeTotalRecepcion + (parseFloat(quantity)*parseFloat(rate)*parseFloat(exchangerate));				
				}	
				
				//alert ('Debug: importeTotalRecepcion:' + importeTotalRecepcion);
				
				var porcentaje	= importeTotalRecepcion / importeTotalRecepciones;
			
				var newRecord = nlapiCreateRecord('customrecord_apertura_costo_desagregados');	
					newRecord.setFieldValue('custrecord_3k_proveedor_asociado', recepcionesAsociadasArray[k_2]['proveedor']);
					newRecord.setFieldValue('custrecord_3k_recepcion_asociada', recepcionesAsociadasArray[k_2]['recepcion']);
					newRecord.setFieldValue('custrecord_3k_costosdesag_categoria', categoria);
					newRecord.setFieldValue('custrecord_3k_importe_parcial', importeParcial*porcentaje);
					newRecord.setFieldValue('custrecord_3k_apertura_aplicada', 'F');
					newRecord.setFieldValue('custrecord_3k_factura_prov_asociada', recId);
                                        newRecord.setFieldValue('custrecord_creado_por_script', 'T');
				nlapiSubmitRecord(newRecord);		
			}		
			
			// -- fin de logica del proceso
			
		} // fin del while
			
		
	} // fin del if confirm	
			
	alert ('El proceso finalizo correctamente.');
	
	var v_url				= nlapiResolveURL('RECORD', 'vendorbill', recId, true);
	window.location.href 	= v_url;	
	
	return true;	
	
}	