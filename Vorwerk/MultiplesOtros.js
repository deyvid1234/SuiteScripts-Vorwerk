function multiplesOtros(type, form)
{
	if(type=='view' || type=='edit' || type=='create' || type=='copy')
	{
		form.addTab('custpage_multiples_otros', 'Otros');
		var datosOtrosSublist = form.addSubList('custpage_datos_otros', 'inlineeditor', 'Otros','custpage_multiples_otros');
			datosOtrosSublist.setDisplayType('normal');	
			datosOtrosSublist.addField('custpage_num_linea', 'integer', '#').setDisplayType('disabled');
			datosOtrosSublist.addField('custpage_articulo', 'select', 'Articulo','item').setMandatory(true);
			datosOtrosSublist.addField('custpage_cantidad', 'integer', 'Cantidad').setMandatory(true);
		var ai = returnBlank(nlapiGetFieldValue('custbody_ajuste_inventario'));
		if(ai!='')
		{
			var aiRec 	= nlapiLoadRecord('inventoryadjustment',ai);
			var lines	= aiRec.getLineItemCount('inventory');
			for(var i=1;i<=lines;i++)
			{
				var _num_linea				= new Number(i);
				var _articulo				= aiRec.getLineItemValue('inventory','item',i);
				var _cantidad				= new Number(Math.abs(aiRec.getLineItemValue('inventory','adjustqtyby',i)));
				datosOtrosSublist.setLineItemValue('custpage_num_linea', i, _num_linea);
				datosOtrosSublist.setLineItemValue('custpage_articulo', i, _articulo);
				datosOtrosSublist.setLineItemValue('custpage_cantidad', i, _cantidad);
			}
		}
	}	
}
function aceptarOtros(type,form,name)
{
	if(type != 'delete')
	{
		var recId 		  		= nlapiGetRecordId();
		var libroRegalo   		= returnBlank(nlapiGetFieldValue('custbody_reganfit'));
		var lineas 		  		= nlapiGetLineItemCount('custpage_datos_otros');
		var ubicacion	  		= returnBlank(nlapiGetLineItemValue('item', 'location', 1));
		var _ajuste_inventario	= returnBlank(nlapiGetFieldValue('custbody_ajuste_inventario'));
		var i 			  		= 0;
		var xfer_id 	  		= 0;
		var fields 		 		= new Array('custbody_ajuste_inventario','custbody_otros');
		var values 		  		= new Array();
		var otros	 	 		= '';
		var otrosText 	  		= '';
		var otrosCant 	  		= '';
		var art					= 0;
	    var xfer 				= new Object();
	    if(_ajuste_inventario == '')
	    {
	    	xfer	= nlapiCreateRecord('inventoryadjustment');
	    }
	    else
	    {
	    	xfer 		= nlapiLoadRecord('inventoryadjustment', _ajuste_inventario);
	    	var lines	= xfer.getLineItemCount('inventory');
	    	for(var c=lines;c>=1;c--)
	    	{
	    		xfer.removeLineItem('inventory', c);
	    	}
	    }
		    xfer.setFieldValue('account', 243); // 6100-006-002
		    xfer.setFieldValue('trandate', nlapiGetFieldValue('trandate'));
		    xfer.setFieldValue('custbody_ejecucion_pedido_articulo',recId);
		for(i=1;i<=lineas;i++)
		{
			var item			= returnBlank(nlapiGetLineItemValue('custpage_datos_otros','custpage_articulo',i));
        	var cantAjuste 		= parseFloat(nlapiGetLineItemValue('custpage_datos_otros','custpage_cantidad',i)) * (-1);
    		var filters 	 	= new Array();
    			filters.push(new nlobjSearchFilter('internalid', null, 'is', item));
    		var columns 	  	= new Array();
				columns.push(new nlobjSearchColumn('averagecost'));
				columns.push(new nlobjSearchColumn('averagecost','memberitem'));
				columns.push(new nlobjSearchColumn('memberitem')); 
				columns.push(new nlobjSearchColumn('memberquantity')); 
			var searchresults 	= returnBlank(nlapiSearchRecord('item', null, filters, columns ));
			var item_type		= searchresults[0].getRecordType();
			if(item_type =='inventoryitem')
	        {
	        	art++;
	        	xfer.selectNewLineItem('inventory');
		        xfer.setCurrentLineItemValue('inventory', 'item',  searchresults[0].getId());
		        xfer.setCurrentLineItemValue('inventory', 'location',  ubicacion);
		        xfer.setCurrentLineItemValue('inventory', 'adjustqtyby',  cantAjuste);
				xfer.setCurrentLineItemValue('inventory', 'unitcost',  searchresults[0].getValue('averagecost'));
				xfer.setCurrentLineItemValue('inventory', 'invtdiffvalue',  searchresults[0].getValue('averagecost'));
				xfer.setCurrentLineItemValue('inventory', 'avgunitcost',  searchresults[0].getValue('averagecost'));
				xfer.commitLineItem('inventory');
				otrosCant+= parseFloat(nlapiGetLineItemValue('custpage_datos_otros','custpage_cantidad',i))+String.fromCharCode(64);
				otrosText+= searchresults[0].getId()+String.fromCharCode(64);
			}
			if(item_type =='kititem')
			{
				for(var k=0;k<searchresults.length;k++)
				{
					art++;
		        	xfer.selectNewLineItem('inventory');
			        xfer.setCurrentLineItemValue('inventory', 'item',  searchresults[k].getValue('memberitem'));
			        xfer.setCurrentLineItemValue('inventory', 'location',  ubicacion);
			        xfer.setCurrentLineItemValue('inventory', 'adjustqtyby',  (cantAjuste * searchresults[k].getValue('memberquantity')));
					xfer.setCurrentLineItemValue('inventory', 'unitcost',  searchresults[k].getValue('averagecost','memberitem'));
					xfer.setCurrentLineItemValue('inventory', 'invtdiffvalue',  searchresults[k].getValue('averagecost','memberitem'));
					xfer.setCurrentLineItemValue('inventory', 'avgunitcost',  searchresults[k].getValue('averagecost','memberitem'));
					xfer.commitLineItem('inventory');
					otrosCant+= parseFloat(nlapiGetLineItemValue('custpage_datos_otros','custpage_cantidad',i))+String.fromCharCode(64);
					otrosText+= searchresults[0].getId()+String.fromCharCode(64);
				}
			}
			//otros=otrosText + String.fromCharCode(124) + otrosCant;
		}
		if(libroRegalo!='')
		{
			var item				= libroRegalo;
    		var filters 	 		= new Array();
				filters.push(new nlobjSearchFilter('internalid', null, 'is', item));
			var columns 	  		= new Array();
				columns.push(new nlobjSearchColumn('averagecost'));
				columns.push(new nlobjSearchColumn('averagecost','memberitem'));
				columns.push(new nlobjSearchColumn('memberitem')); 
				columns.push(new nlobjSearchColumn('memberquantity')); 
			var searchresults 	= returnBlank(nlapiSearchRecord('item', null, filters, columns ));
			item_type		= searchresults[0].getRecordType();
			if(item_type =='inventoryitem')
	        {
				xfer.selectNewLineItem('inventory');
				xfer.setCurrentLineItemValue('inventory', 'item',  searchresults[0].getId());
				xfer.setCurrentLineItemValue('inventory', 'location',  ubicacion);
				xfer.setCurrentLineItemValue('inventory', 'adjustqtyby',  -1);
				xfer.setCurrentLineItemValue('inventory', 'unitcost',  searchresults[0].getValue('averagecost'));
				xfer.setCurrentLineItemValue('inventory', 'invtdiffvalue',  searchresults[0].getValue('averagecost'));
				xfer.setCurrentLineItemValue('inventory', 'avgunitcost',  searchresults[0].getValue('averagecost'));
				xfer.commitLineItem('inventory');
				otrosCant+= parseFloat(1)+String.fromCharCode(64);
				otrosText+= searchresults[0].getId()+String.fromCharCode(64); 
				
			}
			if(item_type =='kititem')
			{
				for(var k=0;k<searchresults.length;k++)
				{
					art++;
		        	xfer.selectNewLineItem('inventory');
			        xfer.setCurrentLineItemValue('inventory', 'item',  searchresults[k].getValue('memberitem'));
			        xfer.setCurrentLineItemValue('inventory', 'location',  ubicacion);
			        xfer.setCurrentLineItemValue('inventory', 'adjustqtyby',  (-1 * searchresults[k].getValue('memberquantity')));
					xfer.setCurrentLineItemValue('inventory', 'unitcost',  searchresults[k].getValue('averagecost','memberitem'));
					xfer.setCurrentLineItemValue('inventory', 'invtdiffvalue',  searchresults[k].getValue('averagecost','memberitem'));
					xfer.setCurrentLineItemValue('inventory', 'avgunitcost',  searchresults[k].getValue('averagecost','memberitem'));
					xfer.commitLineItem('inventory');
					otrosCant+= parseFloat(1)+String.fromCharCode(64);
					otrosText+= searchresults[0].getId()+String.fromCharCode(64);
				}
			}
		}
		if( libroRegalo !='' || art>0)
		{
			otros 		= otrosText + '|'+ otrosCant;
			xfer_id 	= nlapiSubmitRecord(xfer, true);
			values[0] 	=  xfer_id;
			values[1] 	=  otros;
			nlapiSubmitField('itemfulfillment' , recId , fields , values , false);
		}
	}
}
function validateLine(type)
{
	if(type=='custpage_datos_otros')
	{
		var cant 	= parseFloat(nlapiGetCurrentLineItemValue('custpage_datos_otros','custpage_cantidad'));
		var item  	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_otros','custpage_articulo'));
		if((cant>0) && (item !=''))  
		{
			return true;
		}
		else { return false; }
	}
	else { return true; }
}
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}