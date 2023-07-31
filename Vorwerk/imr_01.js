/*
************************************
Script desarrollados para IMR
3Ksys - Buenos Aires - Argentina
************************************
*/


//(31/5/2011) Validate Item group
function validate_item_group(type, name) {
    try {

        var item_ori = nlapiGetCurrentLineItemValue('item', 'custcol_item_original');
        var qty_ori = nlapiGetCurrentLineItemValue('item', 'custcol_cantidad_original');
        var articul = nlapiGetCurrentLineItemValue('item', 'item');
        var quant = nlapiGetCurrentLineItemValue('item', 'quantity');
        var noOfItems = 0;
        var itemGroup = true;

        var filters = new Array();

        if (!isEmpty(item_ori)) {
            filters[0] = new nlobjSearchFilter('internalid', null, 'is', item_ori, null); //---search filter---
        }
        else {
            filters[0] = new nlobjSearchFilter('internalid', null, 'is', articul, null); //---search filter---               
        }

        var minQtyAvailable = 0;
        var qtyFound = 0;

        try {

            // Search the save search Imr_Item_Group_Search(customsearch_imr_item_group_search) for the Item groups and its member ietms.
            var results = nlapiSearchRecord('item', 'customsearch_imr_item_group_search', filters, null); //--- searching the record--

            if (results != null) {

                for (var count = 0; count < results.length; count++) {

                    qtyFound = results[count].getValue('quantityavailable', 'memberitem'); // to get the quantity available
                    if (isEmpty(qtyFound)) {
                        qtyFound = 0;
                    }

                    if (count == 0) {
                        minQtyAvailable = qtyFound;
                    }

                    if (parseInt(qtyFound) < parseInt(minQtyAvailable)) {
                        minQtyAvailable = qtyFound;
                    }
                }

            }
            else {
                //alert("No item group found");
                itemGroup = false;
            }

        }
        catch (ex) {
        
        }
        //alert("quant - minQtyAvailable " + quant + " - " + minQtyAvailable);

        if (itemGroup) {

            if (parseInt(quant) > parseInt(minQtyAvailable)) {
                //alert("You can not set the quantity " + quant + " as there is minimum quantity found " + minQtyAvailable);
                alert("El kit de ventas solamente esta disponible para " + minQtyAvailable);

                return false;
            }
            else {

                return true;
            }
        }
        else {
            return true;
        }

    }
    catch (ex) {
        alert("Error in validate_item_group " + ex);
    }
}


// (P1) MULTIPLO - Libs: Multiplo
function get_multiplo(item)
{
	var record		= nlapiLoadRecord('inventoryitem', item );	
	var multiplo 	= 1;
	
	if (record.getFieldValue('custitem_multiplo') != '' && record.getFieldValue('custitem_multiplo') != null)
		multiplo	= record.getFieldValue('custitem_multiplo');
	
	return multiplo;
}

var multiploFromItem = 0;

// (P1) MULTIPLO - Libs: Retorna el multiplo inmediato superior para la cantidad ingresada, tomando como base al item
function get_multiplo_inmediato_superior(item, cantidad)
{
	var multiplo		= 1;
	var multiplo_tmp	= 1;
	var encontre = false;
	var filters = new Array();
	var results = '';

	//alert("My Item - cantidad " + item + " - " + cantidad);

	if (item != null && item != '')
	{
	    try {
		
		    //alert("Going to search Items Muiltiplo");
			filters[0] = new nlobjSearchFilter('internalid', null, 'is', item, null); //---search filter---

			results = nlapiSearchRecord('item', 'customsearch_imr_items_total_search', filters, null); //--- searching the record--
			if (results != null) {

			    multiplo = results[0].getValue('custitem_multiplo');
			    multiplo_tmp = multiplo;
			    multiploFromItem = multiplo;
			    //nlapiLogExecution('DEBUG', 'multiplo - multiplo_tmp', multiplo + " - " + multiplo_tmp);
			    //alert("multiplo - multiplo_tmp" + multiplo + " - " + multiplo_tmp);

			}
		}
		catch(e){
			
			return cantidad;
		}
	}

    //alert("Going to execute while loop");
	while (encontre == false)
	{
		if (parseInt(multiplo_tmp) >= cantidad) {
		    //alert("multiplo_tmp) >= cantidad  = " + multiplo_tmp + " - " + cantidad);
			encontre = true;
		}
		else
		{
		    multiplo_tmp = parseInt(multiplo_tmp) + parseInt(multiplo);
		    //alert("multiplo_tmp" + multiplo_tmp + " - " + multiplo);
		}
	}

	return multiplo_tmp;
}

// (P1) MULTIPLO - Libs: Retorna el multiplo inmediato superior para la cantidad ingresada, tomando como base al item
function get_multiplo_inmediato_superior_old(item, cantidad) {
    var multiplo = 1;
    var multiplo_tmp = 1;
    var encontre = false;

    if (item != null && item != '') {
        try {

            var record = nlapiLoadRecord('inventoryitem', item);
            multiplo = record.getFieldValue('custitem_multiplo');
            multiplo_tmp = record.getFieldValue('custitem_multiplo');
        }
        catch (e) {

            return cantidad;
        }
    }

    while (encontre == false) {
        if (parseInt(multiplo_tmp) >= cantidad) {
            encontre = true;
        }
        else {
            multiplo_tmp = parseInt(multiplo_tmp) + parseInt(multiplo);
        }
    }

    return multiplo_tmp;
}

// (P2) SUSTITUTO - Libs: Retorna el stock para un item
function get_stock(item)
{
	// stock = inventario - BO - cant.pedida
	var stock 	= 0;	
	
	try{
		var record	= nlapiLoadRecord('inventoryitem', item);
	}
	catch(e){
		return 0;
	}
	
	for (var i = 1; i <= record.getLineItemCount( 'locations'); i++)
	{
		var stock_tmp			= 0;
		var quantityavailable 	= record.getLineItemValue('locations', 'quantityavailable', i);
		var quantitybackordered = record.getLineItemValue('locations', 'quantitybackordered', i);
		
		
		if (quantityavailable == null || quantityavailable == '')
			quantityavailable = 0;
		if (quantitybackordered == null || quantitybackordered == '')
			quantitybackordered = 0;
		
		stock_tmp 	= parseFloat(quantityavailable) - parseFloat(quantitybackordered);		
		
		if (parseFloat(stock_tmp) < 0)
			stock_tmp = 0;
			
		stock = parseFloat(stock) + parseFloat(stock_tmp);	
		
		if (parseFloat(stock) < 0)
			stock = 0;
	}

	return stock;
}

// (P2) SUSTITUTO - Libs: Retorna el stock para un item(new version)
function get_stock_modified(item) {
    // stock = inventario - BO - cant.pedida
    var stock = 0;

    var stock_tmp = 0;
    var quantityavailable = 0;
    var quantitybackordered = 0;

    var filters = new Array();
    filters[0] = new nlobjSearchFilter('internalid', null, 'is', item, null); //---search filter---

    try {
        // Search the Item with internal id as filter.
        var results = nlapiSearchRecord('item', 'customsearch_imr_items_total_search', filters, null); //--- searching the record--
        var result = '';
        if (results != null) {

            for (var count = 0; count < results.length; count++) {

                result = results[count];
                
                quantityavailable = result.getValue('locationquantityavailable');
                quantitybackordered = result.getValue('locationquantitybackordered');

                if (quantityavailable == null || quantityavailable == '')
                    quantityavailable = 0;
                if (quantitybackordered == null || quantitybackordered == '')
                    quantitybackordered = 0;

                stock_tmp = parseFloat(quantityavailable) - parseFloat(quantitybackordered);

                if (parseFloat(stock_tmp) < 0)
                    stock_tmp = 0;

                stock = parseFloat(stock) + parseFloat(stock_tmp);

                if (parseFloat(stock) < 0)
                    stock = 0;

            }// for loop
        }
        else {
            stock = 0;
        } 

    }
    catch (e) {
        nlapiLogExecution('DEBUG', 'Error In get_stock_modified()', e);
        return 0;
    }

    return stock;
}

// (P2) SUSTITUTO - Libs: Retorna el sustituto del item
function get_sustituto(item)
{
	if (item != null && item != '')
	{
		var posicion				= 1;
		var sustitutos_encontrados 	= new Array();
		var encontre 				= false;
		var sustituto				= item;

		while (encontre == false)
		{
			sustitutos_encontrados[posicion] 	= sustituto;
			
			try{
				var record			= nlapiLoadRecord('inventoryitem', sustituto );
				var sustituto_tmp 	= sustituto;
				sustituto 			= record.getFieldValue('custitem_sustituto');
			}
			catch(e)
			{
				return item;
			}						

			if (sustituto == null || sustituto == '' || get_stock(sustituto) == 0)
				encontre = true;
				
			if 	(in_array(sustituto, sustitutos_encontrados))
				encontre = true;
			
			posicion = posicion + 1;
		}

		return sustituto_tmp;
	}

	return item;
}

// (P2) SUSTITUTO - Libs: Retorna el sustituto del item, retorna el �ltimo que tiene stock
function get_sustituto_2(item)
{
	if (item != null && item != '')
	{
		var posicion				= 1;
		var sustitutos_encontrados 	= new Array();
		var encontre 				= false;
		var sustituto = item;
		var filters = new Array();
		var results = '';
		var sustituto_tmp = '';
		
		//alert("sustituto - item" + sustituto + " - " + item);

		while (encontre == false)
		{
			sustitutos_encontrados[posicion] 	= sustituto;
			
			try{
//				var record			= nlapiLoadRecord('inventoryitem', sustituto );
//			    var sustituto_tmp 	= sustituto
//				sustituto = record.getFieldValue('custitem_sustituto');

			    sustituto_tmp = sustituto;

			    filters[0] = new nlobjSearchFilter('internalid', null, 'is', sustituto, null); //---search filter---

			    results = nlapiSearchRecord('item', 'customsearch_imr_items_total_search', filters, null); //--- searching the record--   
			    if (results != null) {

			        sustituto = results[0].getValue('custitem_sublinea');
			        //alert("sustituto " + sustituto);			        
			    }

				//alert("sustituto - sustituto_tmp from Item " + sustituto + " - " + sustituto_tmp);
			}
			catch(e)
			{
				return item;
			}						

			if (sustituto == null || sustituto == '')
				encontre = true;
				
			if 	(in_array(sustituto, sustitutos_encontrados)){
			    encontre = true;
			   // alert("encontre = true");	
			}

			posicion = posicion + 1;

			//alert("encontre " + encontre + " - " + posicion);			
		}

		//alert("sustituto_tmp " + sustituto_tmp);
		return sustituto_tmp;
	}

	return item;
}

// (P5) Libs: verifica existencia de sublinea en cliente(Old version)
function imr_sublinea_existe_en_cliente1(entity, item)
{
	var record_customer			= nlapiLoadRecord('customer', entity );
	var sublineas_permitidas = record_customer.getFieldValues('custentity_sublineas_permitidas');

	alert("sublineas_permitidas " + sublineas_permitidas);

	try{
		var record_item		= nlapiLoadRecord('inventoryitem', item );
	}
	catch(e){
		return true;
	}

	var item_sublinea = record_item.getFieldValue('custitem_sublinea');
	alert("item_sublinea " + item_sublinea);
	item_sublinea = item_sublinea.trim();
	item_sublinea = parseInt(item_sublinea);

	if (in_array(item_sublinea, sublineas_permitidas)) {
	    alert("in_array ");
	    return true;
	}
	else {
	    alert("in_array OUT side");
	    return false;
	}
}

// (P5) Libs: verifica existencia de sublinea en cliente(New version)
function imr_sublinea_existe_en_cliente(entity, item) {

    var results = '';
    var filters = new Array();

    //alert("New version " + entity + " - " + item); 

    try {
        filters[0] = new nlobjSearchFilter('internalid', null, 'is', entity, null); //---search filter---

        // Search the Customer with internal id(Entity) as filter.
        results = nlapiSearchRecord('customer', 'customsearch_imr_customers_total_search', filters, null); //--- searching the record--       
        if (results != null) {

            var sublineas_permitidas = results[0].getValue('custentity_sublineas_permitidas');
            //alert("sublineas_permitidas " + sublineas_permitidas);
            //nlapiLogExecution('DEBUG', 'sublineas_permitidas', sublineas_permitidas);       
        }
    }
    catch (ex) {
        return true;
    }
    
    
    try {
        filters[0] = new nlobjSearchFilter('internalid', null, 'is', item, null); //---search filter---

        results = nlapiSearchRecord('item', 'customsearch_imr_items_total_search', filters, null); //--- searching the record--   
        if (results != null) {

            var item_sublinea = results[0].getValue('custitem_sublinea');
            itemIdOfItem = results[0].getValue('itemid');
            //alert("itemIdOfItem - item_sublinea " + itemIdOfItem + " - " + item_sublinea);
            //nlapiLogExecution('DEBUG', 'item_sublinea', item_sublinea);             
            
        }
    }
    catch (e) {
        return true;
    }

    try {

        if (sublineas_permitidas.indexOf(",") > 0) {
            sublineas_permitidas = sublineas_permitidas.split(',');           
            
            for (var count = 0; count < sublineas_permitidas.length; count++) {

                //alert("sublineas_permitidas[count] " + sublineas_permitidas[count]);

                if (sublineas_permitidas[count] == item_sublinea) {
                    //alert("in_array ");
                    return true;
                }
            }
        }
        else {
            if (sublineas_permitidas == item_sublinea) {
                return true;
            }       
        }
    }
    catch (ex) {
        nlapiLogExecution('DEBUG', 'Error in imr_sublinea_existe_en_cliente()', ex);  
    }

    return false;

//    if (in_array(item_sublinea, sublineas_permitidas)) {
//        alert("in_array ");
//        return true;
//    }
//    else {
//        alert("in_array OUT side");
//        return false;
//    }
}

// Libs: retorna una referencia al objeto item inventario
function imr_obtener_producto(item)
{
	try
	{
		var recType = 'inventoryitem';
		var recId 	= item;
		var record	= nlapiLoadRecord(recType, recId );
	}
	catch(e)
	{
		return null;
	}
	
	return record;
}

 //Libs: retorna una referencia al objeto cliente(old version)
function imr_obtener_cliente(entity)
{
	var recType = 'customer';
	var recId 	= entity;
	var record	= nlapiLoadRecord(recType, recId );
	
	return record;
}



var itemIdOfItem = '';
var itemToSet = '';
var originalItemId = '';


// (P2) SUSTITUTO - Changed Field: Funcion principal
function imr_change_field_sustituto_2(type, name, linenum)
{	
	if (type == 'item' && name == 'custcol_item_original')
	{		
		var entity	= nlapiGetFieldValue('entity');
		
		if (entity == null || entity == ''){
		
			alert ('Por favor seleccione un cliente');
			nlapiCancelLineItem('item');
		}
			
		else {
		    
			//var entity_full 	= imr_obtener_cliente(entity);			
		    var entityName	= nlapiGetFieldText('entity');

		    var item_original = nlapiGetCurrentLineItemValue('item', 'custcol_item_original');
		 
		    //OLDER CODE
//			if (get_stock(item_original) == 0){
//			
//				item_sustituto = get_sustituto_2(item_original);			
//			}
//			else
//				item_sustituto = item_original;

            //NEW CODE
//		    if (get_stock_modified(item_original) == 0) {

//		        //alert('get_stock_modified(item_original) = 0');
//		        item_sustituto = get_sustituto_2(item_original); // Have doubts
//		    }
//		    else {
//		        item_sustituto = item_original;
//		        //alert('Else part of get_stock_modified(item_original) = 0');
//		    }


		    //alert('item_original ' + item_original);
		    if (imr_get_info_items(entity, item_original) == false)  // if (imr_sublinea_existe_en_cliente(entity, item_sustituto) == false)
			{
				//var sustituto_full = imr_obtener_producto(item_sustituto);

				//alert ('El art�culo ' + sustituto_full.getFieldValue('itemid') + ' no pertenece a una sublinea de producto permitida para el cliente ' + entityName);

				alert('El art�culo ' + itemIdOfItem + ' no pertenece a una sublinea de producto permitida para el cliente ' + entityName);
				
				nlapiCancelLineItem('item');
				return false;
			}
			
			nlapiSetCurrentLineItemValue('item', 'custcol_imr_tipo_item_generado', 'PADRE', false, true);
			nlapiSetCurrentLineItemValue('item', 'item', itemToSet, false);
			//alert("My script is working");			
			
		}
	}
}


function disable_fields(type, name, linenum) {

    // This is applied to Invoice screen
    var id = nlapiGetRecordId();
    //alert("disable_fields is called");

    if (!isEmpty(id)) { // in edit mode

        //alert(name + " edit mode");
        nlapiDisableLineItemField('item', 'price', true);
        nlapiDisableLineItemField('item', 'rate', true);
        nlapiDisableLineItemField('item', 'taxcode', true);
        nlapiDisableLineItemField('item', 'amount', true);
        nlapiDisableLineItemField('item', 'tax1amt', true);
        nlapiDisableLineItemField('item', 'grossamt', true);
        //alert("disable only");

    }
    else { // in create mode

        //alert(name);
        // For disabling the line items fields
        nlapiDisableLineItemField('item', 'price', true);
        nlapiDisableLineItemField('item', 'rate', true);
        nlapiDisableLineItemField('item', 'taxcode', true);
        nlapiDisableLineItemField('item', 'amount', true);
        nlapiDisableLineItemField('item', 'tax1amt', true);
        nlapiDisableLineItemField('item', 'grossamt', true);
        //alert("disable");
    }
}

function disable_fields_estimates(type, name, linenum) {

    // This is applied to Estimate screen
    var id = nlapiGetRecordId();
    var form = parseFloat(nlapiGetFieldValue('customform'));
  
    if (form == '119') { // form Cotizaci�n
       
        nlapiDisableLineItemField('item', 'custcol13', true);
        nlapiDisableLineItemField('item', 'quantity', true);
        nlapiDisableLineItemField('item', 'amount', true);
        nlapiDisableLineItemField('item', 'description', true);
        nlapiDisableLineItemField('item', 'price', true);       
        nlapiDisableLineItemField('item', 'taxcode', true);
        nlapiDisableLineItemField('item', 'tax1amt', true);
        nlapiDisableLineItemField('item', 'grossamt', true);
        //alert("disable only");

    }

    if (form == '160') { // form Cotizaci�n Servicio       
        
        // For disabling the line items fields              
        nlapiDisableLineItemField('item', 'amount', true);
        nlapiDisableLineItemField('item', 'description', true);
        nlapiDisableLineItemField('item', 'price', true);        
        nlapiDisableLineItemField('item', 'taxcode', true);
        nlapiDisableLineItemField('item', 'tax1amt', true);
        nlapiDisableLineItemField('item', 'grossamt', true);        
    }
}

// For vendor Invoice
function disable_fields_bill(type, name, linenum) {

    // This is applied to Bill screen
    var id = nlapiGetRecordId();
    var form = parseFloat(nlapiGetFieldValue('customform'));

    if (form == '138') { // form Factura de Proveedor AFOSA
       
        nlapiDisableLineItemField('item', 'description', true);
        nlapiDisableLineItemField('item', 'amount', true);
        nlapiDisableLineItemField('item', 'taxcode', true);
        //nlapiDisableLineItemField('item', 'rate', true);
        nlapiDisableLineItemField('item', 'tax1amt', true);
        nlapiDisableLineItemField('item', 'grossamt', true);        

    }
}

// For purchase order
function disable_fields_purchase_order(type, name, linenum) {

    // This is applied to Purchase order screen
    var id = nlapiGetRecordId();
    var form = parseFloat(nlapiGetFieldValue('customform'));

    if (form == '140') { // form Orden de Compra Articulos Afosa

        nlapiDisableLineItemField('item', 'custcol13', true);
        //nlapiDisableLineItemField('item', 'description', true);
        //nlapiDisableLineItemField('item', 'rate', true);
        nlapiDisableLineItemField('item', 'amount', true);
        nlapiDisableLineItemField('item', 'tax1amt', true);
        nlapiDisableLineItemField('item', 'grossamt', true);
        nlapiDisableLineItemField('item', 'taxrate1', true);
        nlapiDisableLineItemField('item', 'taxcode', true);				

    }
}

// For sales order
function disable_fields_sales_order(type, name, linenum) {

    // This is applied to Sales order screen
    var id = nlapiGetRecordId();
    var form = parseFloat(nlapiGetFieldValue('customform'));

    if (form == '124') { // form Orden de venta Afosa

        // For disabling the line items fields
        nlapiDisableLineItemField('item', 'item', true);
        nlapiDisableLineItemField('item', 'quantity', true);
        nlapiDisableLineItemField('item', 'quantityavailable', true);
        nlapiDisableLineItemField('item', 'description', true);
        nlapiDisableLineItemField('item', 'price', true);
        nlapiDisableLineItemField('item', 'rate', true);
        nlapiDisableLineItemField('item', 'taxcode', true);
        nlapiDisableLineItemField('item', 'taxrate1', true);
        nlapiDisableLineItemField('item', 'amount', true);
        nlapiDisableLineItemField('item', 'tax1amt', true);
        nlapiDisableLineItemField('item', 'grossamt', true);
        nlapiDisableLineItemField('item', 'custcol13', true);        
    }
}


//My function
// This function includes code from 3 functions 1. get_stock_modified 2. get_sustituto_2 3. imr_sublinea_existe_en_cliente
// This is used from the function imr_change_field_sustituto_2() only.
function imr_get_info_items(entity, item) {
    
    try {
      
        //nlapiLogExecution('DEBUG', 'imr_get_info_items starts', entity + " - " + item);
        
        var stock = 0;
        var stock_tmp = 0;
        var quantityavailable = 0;
        var quantitybackordered = 0;

        var posicion = 1;
        var sustitutos_encontrados = new Array();
        var encontre = false;
        var sustituto = item;
        var results = '';
        var result = '';
        var sustituto_tmp = '';

        var sublineas_permitidas = '';
        var item_sublinea = '';
        var con = 0;

        var filters = new Array();

        if (item != null && item != '') {

            while (encontre == false) {                

                try {

                    //nlapiLogExecution('DEBUG', 'While loop Strats', posicion);
                    sustitutos_encontrados[posicion] = sustituto;

                    itemToSet = sustituto;

                    //nlapiLogExecution('DEBUG', 'sustituto -  itemToSet', sustituto + " - " + itemToSet);
                    
                    filters[0] = new nlobjSearchFilter('internalid', null, 'is', sustituto, null); //---search filter---
                    
                    // Search the Item with internal id as filter.
                    results = nlapiSearchRecord('item', 'customsearch_imr_items_total_search', filters, null); //--- searching the record--
                    
                    if (results != null) {

                        //nlapiLogExecution('DEBUG', 'Item results found', results.length);

                        sustituto = results[0].getValue('custitem_sustituto');
                        item_sublinea = results[0].getValue('custitem_sublinea');
                        itemIdOfItem = results[0].getValue('itemid');
                        con++;

                        if (con == 1) {
                            originalItemId = itemIdOfItem; // to get the Original item id
                        }

                        //nlapiLogExecution('DEBUG', 'Item fields ', sustituto + " - " + item_sublinea + " - " + itemIdOfItem);

                        // Execute this block only when "while block" executes 1st time means when posicion = 1 before increment.
                        if (posicion < 2) {
                        
                            //nlapiLogExecution('DEBUG', 'posicion less than 2', posicion);

                            for (var count = 0; count < results.length; count++) {
                                result = results[count];

                                quantityavailable = result.getValue('locationquantityavailable');
                                quantitybackordered = result.getValue('locationquantitybackordered');
                               
                                //nlapiLogExecution('DEBUG', 'quantityavailable -  quantitybackordered', quantityavailable + " - " + quantitybackordered);

                                if (quantityavailable == null || quantityavailable == '')
                                    quantityavailable = 0;
                                if (quantitybackordered == null || quantitybackordered == '')
                                    quantitybackordered = 0;

                                stock_tmp = parseFloat(quantityavailable) - parseFloat(quantitybackordered);

                                //nlapiLogExecution('DEBUG', 'stock_tmp', stock_tmp);

                                if (parseFloat(stock_tmp) < 0)
                                    stock_tmp = 0;

                                stock = parseFloat(stock) + parseFloat(stock_tmp);

                                if (parseFloat(stock) < 0)
                                    stock = 0;

                               //nlapiLogExecution('DEBUG', 'stock', stock);                               
                                
                            } // for (var count = 0; count < results.length; count++) {

                        } //  if (posicion < 2) {
//                        else {
//                            //alert("posicion is not less than 2 " + posicion);
//                            nlapiLogExecution('DEBUG', 'posicion is not less than 2 ', posicion);
//                        }
                    }
                    else {
                        stock = 0;
                        //nlapiLogExecution('DEBUG', 'stock assigned to 0', stock);
                    }

                }
                catch (e) {
                    nlapiLogExecution('DEBUG', 'Error In getInfoOfItems() Inner block', e);
                    stock = 0;
                    sustituto_tmp = item;
                }


                if (sustituto == null || sustituto == '') {
                    encontre = true;
                   // nlapiLogExecution('DEBUG', 'sustituto == null', 'encontre assigned to true');
                }

                if (in_array(sustituto, sustitutos_encontrados)) {
                    encontre = true;
                    //nlapiLogExecution('DEBUG', 'sustituto found in array ', 'encontre assigned to true');
                }

                posicion = posicion + 1;

                //nlapiLogExecution('DEBUG', 'encontre - posicion', encontre + " - " + posicion);

                // To execute this block only when "while block" executes 1st time means when posicion = 2.
                if (posicion == 2) {

                    if (stock != 0) {
                        //alert("stock != 0 "  + stock);
                        //nlapiLogExecution('DEBUG', 'stock is not 0', stock + " execute break");
                        break;
                    }
                }              

                //nlapiLogExecution('DEBUG', 'Ending of While loop', '');
            }// while block end
        }        

       
        //nlapiLogExecution('DEBUG', 'Executing customer search', entity);

        try {
            filters[0] = new nlobjSearchFilter('internalid', null, 'is', entity, null); //---search filter---

            // Search the Customer with internal id(Entity) as filter.
            results = nlapiSearchRecord('customer', 'customsearch_imr_customers_total_search', filters, null); //--- searching the record--       
            if (results != null) {

                sublineas_permitidas = results[0].getValue('custentity_sublineas_permitidas');                
               // nlapiLogExecution('DEBUG', 'sublineas_permitidas', sublineas_permitidas);       
            }
        }
        catch (ex) {
            return true;
        }

        try {

            if (sublineas_permitidas.indexOf(",") > 0) {
                sublineas_permitidas = sublineas_permitidas.split(',');

                for (var count = 0; count < sublineas_permitidas.length; count++) {                  

                    if (sublineas_permitidas[count] == item_sublinea) {                       
                       // nlapiLogExecution('DEBUG', 'item_sublinea found inside array', item_sublinea + " - " + sublineas_permitidas[count]);
                        return true;
                    }
                }
            }
            else {
                if (sublineas_permitidas == item_sublinea) {
                    //nlapiLogExecution('DEBUG', 'item_sublinea found inside array', item_sublinea + " - " + sublineas_permitidas);
                    return true;
                }
            }
        }
        catch (ex) {
            nlapiLogExecution('DEBUG', 'Error in sublineas_permitidas', ex);
        }
    
    }
    catch (ex) {
        //alert("Error in getInfoOfItems() " + ex);
        nlapiLogExecution('DEBUG', 'Error in getInfoOfItems()', ex);
    }

    return false;
}



// (P2) SUSTITUTO - Changed Field: Funcion principal(Old version)
function imr_change_field_sustituto1(type, name, linenum)
{	
	if (type == 'item' && name == 'custcol_item_original')
	{		
		var entity  	= nlapiGetFieldValue('entity');
	
		if (entity == null || entity == '') {
		
			alert ('Por favor seleccione un Cliente.');
			nlapiCancelLineItem('item');
			return false;
		}	
		
		var entity_full 		= imr_obtener_cliente(entity);		
		var item_original 		= nlapiGetCurrentLineItemValue('item', 'custcol_item_original');		
		var item_original_full	= imr_obtener_producto(item_original);
		
		// en caso que no sea un item inventariado
		if (item_original_full != null){
		
			var item_sustituto 		= get_sustituto(item_original);
			var item_sustituto_full = imr_obtener_producto(item_sustituto);		
			
			if (imr_sublinea_existe_en_cliente(entity, item_sustituto) == false)
			{
				alert ('El art�culo ' + item_sustituto_full.getFieldValue('itemid') + ' no pertenece a una sublinea de producto permitida para el cliente ' + entity_full.getFieldValue('entityid'));
				
				nlapiSetCurrentLineItemValue('item', 'item', '', false); 
				nlapiSetCurrentLineItemValue('item', 'custcol_item_original', '', false);

				nlapiCancelLineItem('item');				
				return false;
			}
			else 
			{
			    nlapiSetCurrentLineItemValue('item', 'item', item_sustituto, false);			   	
				if (item_original_full.getFieldValue('itemid') != item_sustituto_full.getFieldValue('itemid'))
				    alert('Se sustituyo autom�ticamente el art�culo ' + item_original_full.getFieldValue('itemid') + ' con el art�culo ' + item_sustituto_full.getFieldValue('itemid'));
				
			}

			// deshabilito el campo de item real de NetSuite
			nlapiDisableLineItemField('item', 'item', true);
			// deshabilito el campo de cantidad real de NetSuite
			nlapiDisableLineItemField('item', 'quantity', true);
			
		}
		// en caso que no sea inventariado, entonces dejo el mismo item en ambas columnas
		else{

		    nlapiSetCurrentLineItemValue('item', 'item', item_original, true);		    
		}
	}
}


//My function
// (P2) SUSTITUTO - Changed Field: Funcion principal (New version)
function imr_change_field_sustituto(type, name, linenum) {

    if (type == 'item' && name == 'custcol_item_original') {

        var entity = nlapiGetFieldValue('entity');

        if (entity == null || entity == '') {

            alert('Por favor seleccione un Cliente.');
            nlapiCancelLineItem('item');
            return false;
        }

        //var entity_full = imr_obtener_cliente(entity);
        var entityName = nlapiGetFieldText('entity');

        var item_original = nlapiGetCurrentLineItemValue('item', 'custcol_item_original');

        // var item_original_full = imr_obtener_producto(item_original);

        // en caso que no sea un item inventariado
        if (item_original != null) {

            //var item_sustituto = get_sustituto(item_original);

            //var item_sustituto_full = imr_obtener_producto(item_sustituto);

            if (imr_get_info_items(entity, item_original) == false) {

                alert('El art�culo ' + itemIdOfItem + ' no pertenece a una sublinea de producto permitida para el cliente ' + entityName);

                nlapiSetCurrentLineItemValue('item', 'item', '', false);
                nlapiSetCurrentLineItemValue('item', 'custcol_item_original', '', false);

                nlapiCancelLineItem('item');               
                return false;
            }
            else {
                nlapiSetCurrentLineItemValue('item', 'item', itemToSet, false);  
                              
                if (originalItemId != itemIdOfItem)
                    alert('Se sustituyo autom�ticamente el art�culo ' + originalItemId + ' con el art�culo ' + itemIdOfItem);

                // deshabilito el campo de item real de NetSuite
                nlapiDisableLineItemField('item', 'item', true);
                // deshabilito el campo de cantidad real de NetSuite
                nlapiDisableLineItemField('item', 'quantity', true);         
            }                   
        }
        // en caso que no sea inventariado, entonces dejo el mismo item en ambas columnas
        else {          
            nlapiSetCurrentLineItemValue('item', 'item', item_original, true);
        }
    }
}

// (P2) SUSTITUTO - NUEVA VERSION (old version)
//function get_sustituto_inmediato(item){
//	
//	try{
//		var record = nlapiLoadRecord('inventoryitem', item);
//	}
//	catch(e){
//		return item;
//	}
//	
//	return record.getFieldValue('custitem_sustituto');
//}



//New version
function get_sustituto_inmediato(item) {

    try {

        var filters = new Array();
        var results = '';
        var item_substituto = '';
        
        filters[0] = new nlobjSearchFilter('internalid', null, 'is', item, null); //---search filter---

        results = nlapiSearchRecord('item', 'customsearch_imr_items_total_search', filters, null); //--- searching the record--   
        if (results != null) {

            item_substituto = results[0].getValue('custitem_sustituto');
            //itemIdItem = results[0].getValue('itemid');
            //alert("itemIdItem - item_sublinea " + itemIdItem + " - " + item_substituto);
            //nlapiLogExecution('DEBUG', 'item_sublinea', item_sublinea);             

        }
    }
    catch (e) {
        return item;
    }

    return item_substituto;
}


var sustituto_insertada = '';
var sublinea_insertada = false;
var itemIdItem = '';

// Need Review
// (P2) SUSTITUTO - NUEVA VERSION (New version)
function imr_linea_insertada(type) {

    if (type == 'item') {

        //alert('imr_linea_insertada script runs');

        if (nlapiGetCurrentLineItemValue("item", "custcol_imr_tipo_item_generado") == 'PADRE') {

            //alert('custcol_imr_tipo_item_generado is Padre');

            var entity = nlapiGetFieldValue('entity');

            if (entity == null || entity == '') {

                alert('Por favor seleccione un Cliente.');
                nlapiCancelLineItem('item');
                return false;
            }

            //var entity_full = imr_obtener_cliente(entity);
            var entityName = nlapiGetFieldText('entity');

            // me guardo lo que ingrese, para poder generar de nuevo la linea y sus descendientes en caso de requerir
            var itemOriginal = nlapiGetCurrentLineItemValue('item', 'custcol_item_original');
            var cantidadOriginal = nlapiGetCurrentLineItemValue('item', 'custcol_cantidad_original');
            var itemId = nlapiGetCurrentLineItemValue('item', 'item');
            var cantidad = nlapiGetCurrentLineItemValue('item', 'quantity');

            var sustituto = null;

            var cantLineasIngresadas = 0;

            //var stockQty = get_stock_modified(itemId);

            var stockQty = imr_get_info_insertada(entity, itemId);            
            
            //alert('stockQty = ' + stockQty);

            if (stockQty < parseFloat(cantidad)) {

                //alert('stockQty < cantidad ' + stockQty + " - " + cantidad);
                //sustituto = get_sustituto_inmediato(itemId);

                sustituto = sustituto_insertada;

               // alert('sustituto found ' + sustituto_insertada);

                if (itemId == sustituto)
                    return false;

                if (sustituto != null && sustituto != '') {

                   // if (imr_sublinea_existe_en_cliente(entity, sustituto) == false) {

                    if (sublinea_insertada == false) {
                        //var sustituto_full = imr_obtener_producto(sustituto);
                        //alert('imr_sublinea_existe_en_cliente is found false');

                        alert('El art�culo ' + itemIdItem + ' no pertenece a una sublinea de producto permitida para el cliente ' + entityName);

                        nlapiCancelLineItem('item');
                        return false;
                    }

                    //alert('imr_sublinea_existe_en_cliente is found true');

                    nlapiSetCurrentLineItemValue('item', 'quantity', stockQty, false, true);
                    nlapiCommitLineItem('item');
                }

               var cantidadRestante = parseFloat(cantidad) - stockQty;

                var stockSubQty = 0;

                while (cantidadRestante > 0 && sustituto != null && sustituto != '') {
                
                    stockSubQty = get_stock_modified(sustituto);

                    //alert('stockSubQty ' + stockSubQty);

                    if (stockSubQty > 0) {

                        if (stockSubQty <= cantidadRestante)
                            cantidadAIngresar = stockSubQty;
                        else
                            cantidadAIngresar = cantidadRestante;

                      //  alert('cantidadAIngresar ' + cantidadAIngresar);

                        nlapiSelectNewLineItem("item");
                        nlapiSetCurrentLineItemValue('item', 'item', sustituto, false, true);
                        nlapiSetCurrentLineItemValue('item', 'quantity', cantidadAIngresar, false, true);
                        nlapiSetCurrentLineItemValue('item', 'custcol_imr_tipo_item_generado', 'HIJO', false, true);
                        nlapiCommitLineItem('item');

                        cantLineasIngresadas++;

                        cantidadRestante = cantidadRestante - cantidadAIngresar;

                        //alert('cantidadAIngresar at last' + cantidadAIngresar);
                    }
                    
                          if (sustituto != null && sustituto != '')
                               sustituto = get_sustituto_inmediato(sustituto);
                        
                } // while loop
                
            } //   if (stockQty < parseFloat(cantidad)) {

            if (cantLineasIngresadas > 0)
                alert('Proceso sustituto finalizado. Fueron creadas ' + cantLineasIngresadas + ' l�neas adicionales.');
                
        } // if (nlapiGetCurrentLineItemValue("item", "custcol_imr_tipo_item_generado") == 'PADRE') {
    } // if (type == 'item'){
}


//My function
function imr_get_info_insertada(entity, item) {

    try {

        //nlapiLogExecution('DEBUG', 'imr_get_info_insertada starts', entity + " - " + item);

        var stock = 0;
        var stock_tmp = 0;
        var quantityavailable = 0;
        var quantitybackordered = 0;
      
        var sustitutos_encontrados = new Array();       
        var sustituto = item;
        var results = '';
        var result = '';
       
        var sublineas_permitidas = '';
        var item_sublinea = '';

        var filters = new Array();

        if (item != null && item != '') {

            filters[0] = new nlobjSearchFilter('internalid', null, 'is', sustituto, null); //---search filter---

            // Search the Item with internal id as filter.
            results = nlapiSearchRecord('item', 'customsearch_imr_items_total_search', filters, null); //--- searching the record--

            if (results != null) {

                //nlapiLogExecution('DEBUG', 'Item results found', results.length);

                sustituto_insertada = results[0].getValue('custitem_sustituto');
                item_sublinea = results[0].getValue('custitem_sublinea');
                itemIdItem = results[0].getValue('itemid');

                for (var count = 0; count < results.length; count++) {
                    result = results[count];

                    quantityavailable = result.getValue('locationquantityavailable');
                    quantitybackordered = result.getValue('locationquantitybackordered');

                    //nlapiLogExecution('DEBUG', 'quantityavailable -  quantitybackordered', quantityavailable + " - " + quantitybackordered);

                    if (quantityavailable == null || quantityavailable == '')
                        quantityavailable = 0;
                    if (quantitybackordered == null || quantitybackordered == '')
                        quantitybackordered = 0;

                    stock_tmp = parseFloat(quantityavailable) - parseFloat(quantitybackordered);

                   // nlapiLogExecution('DEBUG', 'stock_tmp', stock_tmp);

                    if (parseFloat(stock_tmp) < 0)
                        stock_tmp = 0;

                    stock = parseFloat(stock) + parseFloat(stock_tmp);

                    if (parseFloat(stock) < 0)
                        stock = 0;

                    //nlapiLogExecution('DEBUG', 'stock', stock);

                } // for (var count = 0; count < results.length; count++) {
            } //  if (results != null) { 

        }  //  if (item != null && item != '') {

       // nlapiLogExecution('DEBUG', 'Executing customer search', entity);

        try {
            filters[0] = new nlobjSearchFilter('internalid', null, 'is', entity, null); //---search filter---

            // Search the Customer with internal id(Entity) as filter.
            results = nlapiSearchRecord('customer', 'customsearch_imr_customers_total_search', filters, null); //--- searching the record--       
            if (results != null) {

                sublineas_permitidas = results[0].getValue('custentity_sublineas_permitidas');
                //nlapiLogExecution('DEBUG', 'sublineas_permitidas', sublineas_permitidas);
            }
        }
        catch (ex) {
            sublinea_insertada = true;
        }

        try {

            if (sublineas_permitidas.indexOf(",") > 0) {
                sublineas_permitidas = sublineas_permitidas.split(',');

                for (var count = 0; count < sublineas_permitidas.length; count++) {

                    if (sublineas_permitidas[count] == item_sublinea) {
                       // nlapiLogExecution('DEBUG', 'item_sublinea found inside array', item_sublinea + " - " + sublineas_permitidas[count]);
                        sublinea_insertada = true;
                    }
                }
            }
            else {
                if (sublineas_permitidas == item_sublinea) {
                   // nlapiLogExecution('DEBUG', 'item_sublinea found inside array', item_sublinea + " - " + sublineas_permitidas);
                    sublinea_insertada = true;
                }
            }
        }
        catch (ex) {
            nlapiLogExecution('DEBUG', 'Error in sublineas_permitidas for insertada', ex);
        }
    }
    catch (ex) {
        nlapiLogExecution('DEBUG', 'Error in imr_get_info_insertada', ex);
    }

    return stock;
}

// Need Review
// (P1) MULTIPLO - Changed Field: Funcion principal (Old version)
function imr_change_field_multiplo_old(type, name, linenum)
{
    if (type == 'item' && name == 'custcol_cantidad_original') {
        var entity = nlapiGetFieldValue('entity');

        if (entity != null && entity != '') {

            var recEntity = nlapiLoadRecord('customer', entity);
            var noRequiereMultiplo = recEntity.getFieldValue('custentity10');

            var item_id = nlapiGetCurrentLineItemValue('item', 'item');
            var cantidad_original = nlapiGetCurrentLineItemValue('item', 'custcol_cantidad_original');

            if (noRequiereMultiplo != null && noRequiereMultiplo == 'F') {

                var multiplo_inmediato_superior = get_multiplo_inmediato_superior(item_id, cantidad_original);

                nlapiSetCurrentLineItemValue('item', 'quantity', multiplo_inmediato_superior, false);

                if (cantidad_original != multiplo_inmediato_superior)
                    alert('Solo se puede vender en m�ltiplos de ' + get_multiplo(item_id));

                // deshabilito el campo de item real de NetSuite
                nlapiDisableLineItemField('item', 'item', true);
                // deshabilito el campo de cantidad real de NetSuite
                nlapiDisableLineItemField('item', 'quantity', true);
            }
            else
                nlapiSetCurrentLineItemValue('item', 'quantity', parseFloat(cantidad_original), false);
        }
    }

    
	
	
}

//(New version)
function imr_change_field_multiplo(type, name, linenum) {

    //alert(type + " - " + name);
    if (type == 'item' && name == 'custcol_cantidad_original') {

        var entity = nlapiGetFieldValue('entity');
        var noRequiereMultiplo = '';

        if (entity != null && entity != '') {           

            var filters = new Array();
            var results = '';

            try {

                //alert('Going to search customer ' + entity);
                filters[0] = new nlobjSearchFilter('internalid', null, 'is', entity, null); //---search filter---

                // Search the Customer with internal id(Entity) as filter.
                results = nlapiSearchRecord('customer', 'customsearch_imr_customers_total_search', filters, null); //--- searching the record--       
                if (results != null) {

                    noRequiereMultiplo = results[0].getValue('custentity10');
                    //alert('noRequiereMultiplo ' + noRequiereMultiplo);
                }
                else {
                    alert('Else part after search customer ' + entity);
                }

                var item_id = nlapiGetCurrentLineItemValue('item', 'item');
                var cantidad_original = nlapiGetCurrentLineItemValue('item', 'custcol_cantidad_original');

               // alert("item_id - cantidad_original " + item_id + " - " + cantidad_original);

                if (noRequiereMultiplo != null && noRequiereMultiplo == 'F') {

                   // alert("Calling  get_multiplo_inmediato_superior()");
                    var multiplo_inmediato_superior = get_multiplo_inmediato_superior(item_id, cantidad_original);

                    //alert("multiplo_inmediato_superior " + multiplo_inmediato_superior);

                    //nlapiLogExecution('DEBUG', 'multiplo_inmediato_superior', multiplo_inmediato_superior);

                    nlapiSetCurrentLineItemValue('item', 'quantity', multiplo_inmediato_superior, false);

                    if (cantidad_original != multiplo_inmediato_superior)
                        alert('Solo se puede vender en m�ltiplos de ' + multiploFromItem);

                    // deshabilito el campo de item real de NetSuite
                    nlapiDisableLineItemField('item', 'item', true);
                    // deshabilito el campo de cantidad real de NetSuite
                    nlapiDisableLineItemField('item', 'quantity', true);

                    nlapiDisableLineItemField('item', 'amount', true);
                }
                else {
                    nlapiSetCurrentLineItemValue('item', 'quantity', parseFloat(cantidad_original), false);
                    //alert("Else part of noRequiereMultiplo null");

                    nlapiDisableLineItemField('item', 'quantity', true);
                    nlapiDisableLineItemField('item', 'amount', true);
                }

            }
            catch (ex) {
                nlapiLogExecution('DEBUG', 'Error in imr_change_field_multiplo_Modified()', ex);
            }
        }
    }    
   
}






// (P3) CANCELACION DE BACKORDER - Funci�n utilizada por el scheduled script
function imr_cerrar_backorder()
{
	var today 			= new Date();
	var id_closed_lost	= 1;
	var searchresults 	= nlapiSearchRecord('transaction', 'customsearch_back_orders_to_close', null, null);
	
	for ( var i = 0; searchresults != null && i < searchresults.length; i++ )
	{
		var searchresult 			= searchresults[i];

		var recId 					= searchresult.getId();		
		var recType 				= searchresult.getRecordType();
		var record					= nlapiLoadRecord(recType, recId );		
		
		var fecha_cierre_sistema 	= record.getFieldValue('custbody_fecha_cierre_sistema');
		
		if (fecha_cierre_sistema == null || fecha_cierre_sistema == '')
		{			
			var lineas_pendiente_facturacion = 0;
			
			// itero sobre las l�neas de la orden de venta
			for (var j = 1; j <= record.getLineItemCount('item'); j++)
			{				
				if (parseInt(record.getLineItemValue('item', 'quantityfulfilled', j)) > parseInt(record.getLineItemValue('item', 'quantitybilled', j)))
					lineas_pendiente_facturacion = lineas_pendiente_facturacion + 1;
			}
			
			if (lineas_pendiente_facturacion == 0)
			{						
				// cierro las lineas
				for (var h = 1; h <= record.getLineItemCount('item'); h++)
				{
					record.setLineItemValue('item', 'isclosed', h, 'T');
				}				
			
				// actualizo los campos				
				record.setFieldValue('custbody_fecha_cierre_sistema', nlapiDateToString(today));
				record.setFieldValue('custbody_motivo_cierre', 'CIERRE BACKORDER');	
				record.setFieldValue('entitystatus', 1);
				record.setFieldValue('status', 'Closed');					
				
				nlapiSubmitRecord(record, true);				
			}			
		}				
	}
}

// (P4) - CIERRE DE COTIZACIONES DESPUES DE 3 DIAS
function imr_cerrar_cotizaciones_vencidas()
{
	var today 			= new Date();	
	var today_more_3 	= nlapiAddDays(today, 3);
	var id_closed_lost	= 14;
	
	var searchresults 	= nlapiSearchRecord('transaction', 'customsearch_imr_cierre_cotiz_vencidas', null, null);
	
	for ( var i = 0; searchresults != null && i < searchresults.length; i++ )
	{	
		var searchresult 			= searchresults[i];

		var recId 					= searchresult.getId();
		var recType 				= searchresult.getRecordType();		
		var record					= nlapiLoadRecord(recType, recId );
		
		record.setFieldValue('custbody_fec_cierre_auto_cotiz', nlapiDateToString(today_more_3));
		record.setFieldValue('custbody_fecha_cierre_sistema', nlapiDateToString(today));	
		record.setFieldValue('entitystatus', id_closed_lost);	
		
		nlapiSubmitRecord(record, true);				
	}
}

// Libs: Configuracion de fichero de control
function imr_validar_unica_fila_configuracion()
{
	var id 			= nlapiGetRecordId();
	var registros 	= nlapiSearchRecord('customrecord_fichero_control', null, null, null );
	
	// creando un registro nuevo
	if (id == '' || id == null)
	{
		if (registros.length == 0)
			return true;
		else
		{
			alert ('Solo es posible ingresar una configuracion. Verifique y vuelva a intentar.');
			return false;
		}
	}
	// editando un registro existente
	else
	{
		if (registros.length == 1)
			return true;
		else
		{
			alert ('Solo es posible ingresar una configuracion. Verifique y vuelva a intentar.');
			return false;
		}
	}
}

// (P8) APLICACION DE PAGOS AUTOMATICA - SCHEDULER SCRIPT
function imr_aplicar_pagos_auto()
{
	var today 			= new Date();
	var searchresults 	= nlapiSearchRecord('transaction', 'customsearch_aplicacion_pagos_automatico', null, null);
	
	for ( var i = 0; searchresults != null && i < searchresults.length; i++ )
	{
		searchresult 	= searchresults[i];
		
		var recId 		= searchresult.getId();
		var recType 	= searchresult.getRecordType();		
		var record		= nlapiLoadRecord(recType, recId );
		
		var customer		= record.getFieldValue('customer');
		var payment			= record.getFieldValue('payment'); // importe del pago
		
		var invoice_id_old		= '';
		var invoice_date_old	= '01/01/2099';
		var invoice_line_old	= 0;
		
		for (var j = 1; j <= record.getLineItemCount('apply'); j++)
		{				
			var doc 			= record.getLineItemValue('apply', 'doc', j);	
			var line 			= record.getLineItemValue('apply', 'line', j);
			
			var record_invoice	= nlapiLoadRecord('invoice', doc);			
			var trandate		= record_invoice.getFieldValue('trandate');
			var total 			= record_invoice.getFieldValue('total');
			var amountremaining = record_invoice.getFieldValue('amountremaining');
			
			if (parseFloat(total) == parseFloat(amountremaining) && parseFloat(payment) == parseFloat(total))
			{
				if (nlapiStringToDate(trandate) < nlapiStringToDate(invoice_date_old))
				{
					invoice_date_old 	= trandate;
					invoice_id_old		= doc;
					invoice_line_old	= j;
				}
			}			
		}
		
		if (invoice_id_old != null && invoice_id_old != '')
		{			
			record.setLineItemValue('apply', 'apply', parseInt(invoice_line_old), 'T');			
			record.setLineItemValue('apply', 'amount', parseInt(invoice_line_old), parseFloat(payment));		
			record.setFieldValue('custbody_fecha_aplicacion_auto', nlapiDateToString(today));
			
			nlapiSubmitRecord(record);
		}
	}
		
	// *** agregado el 24/02/2011
	var today 		= new Date();
	
	var searchresults_1 	= nlapiSearchRecord('transaction', 'customsearch_aplicacion_pagos_auto_saldo', null, null);
	
	for ( var j = 0; searchresults_1 != null && j < searchresults_1.length; j++ )
	{		
		
		var searchresult_1 	= searchresults_1[j];
		
		var recId_1 	= searchresult_1.getId();
		var recType_1 	= searchresult_1.getRecordType();		
		var record_1	= nlapiLoadRecord(recType_1, recId_1);
		
		//alert ('Debug: Tomo pago con ID: ' + recId_1);
		
		var customer		= record_1.getFieldValue('customer');
		var payment			= record_1.getFieldValue('payment'); // importe del pago
		var unapplied		= record_1.getFieldValue('unapplied'); // importe no aplicado del pago
		
		var saldoNoAplicado	= unapplied;
		
		// obtengo la lista de apply del pago del cliente
		var numberOfApply 	= record_1.getLineItemCount('apply');

		var k 				= 0;
		var filters			= new Array();
		var columns			= new Array();
		
		columns[0]	= new nlobjSearchColumn("name");
		columns[1]	= new nlobjSearchColumn("total");
		columns[2]	= new nlobjSearchColumn("amountpaid");
		columns[3]	= new nlobjSearchColumn("amountremaining");
		
		filters[0] 	= new nlobjSearchFilter('entity', null, 'is', customer);
		
		var searchresults_2 	= nlapiSearchRecord('transaction', 'customsearch_3k_fc_vencidas_pagos_aut', filters, columns);		
		
		// el importe pendiente del pago, lo voy ingresando en las Facturas vencidas hasta que no tenga mas saldo
		while ( searchresults_2 != null && k < searchresults_2.length && parseFloat(saldoNoAplicado) > 0){		
		
			//alert ('Debug: SALDO NO APLICADO: ' + saldoNoAplicado);
		
			var searchresult_2 	= searchresults_2[k]; // me quedo con la factura del cliente que este vencida hace m�s tiempo
			
			// obtengo la factura y datos sobre la misma
			var invoiceId 			= searchresult_2.getId();			
			var importeFC 			= searchresult_2.getValue('total');
			var importeFCPagado 	= searchresult_2.getValue('amountpaid');
			var importeFCPendiente 	= searchresult_2.getValue('amountremaining');			
			
			//alert ('Debug: Encontre la fc con ID: ' + invoiceId);
			
			if (parseFloat(saldoNoAplicado) > parseFloat(importeFCPendiente)){
			
				//alert ('Debug: Saldo no aplicado: ' + saldoNoAplicado + ' es > importe fc pendiente: ' + importeFCPendiente );
			
				// pago el total de la factura		
				var g_1 = 1; var encontreFC_1 = false;
				while (g_1 <= numberOfApply && encontreFC_1 == false){
				
					var doc 	= record_1.getLineItemValue('apply', 'doc', g_1);	
					var line 	= record_1.getLineItemValue('apply', 'line', g_1);
					
					if ( doc == invoiceId ){
					
						//alert ('Debug: Aplico la fc con ID: ' + doc + ' con monto: ' + importeFCPendiente);
					
						record_1.setLineItemValue('apply', 'apply', g_1, 'T');			
						record_1.setLineItemValue('apply', 'amount', g_1, parseFloat(importeFCPendiente));
						
						saldoNoAplicado = parseFloat(saldoNoAplicado) - parseFloat(importeFCPendiente);
						
						encontreFC_1 = true; 
					}
					
					g_1++;					
				}				
			}
			
			else {
			
				if (parseFloat(saldoNoAplicado) < parseFloat(importeFCPendiente)){
				
					//alert ('Debug: Saldo no aplicado: ' + saldoNoAplicado + ' es < importe fc pendiente: ' + importeFCPendiente );
				
					// pago el total del pago para una parte de la factura
					var g_2 = 1; var encontreFC_2 = false;
					while (g_2 <= numberOfApply && encontreFC_2 == false){
					
						var doc 	= record_1.getLineItemValue('apply', 'doc', g_2);	
						var line 	= record_1.getLineItemValue('apply', 'line', g_2);
						
						if ( doc == invoiceId ){
						
							//alert ('Debug: Aplico la fc con ID: ' + doc + ' con monto: ' + saldoNoAplicado);
						
							record_1.setLineItemValue('apply', 'apply', g_2, 'T');			
							record_1.setLineItemValue('apply', 'amount', g_2, parseFloat(saldoNoAplicado));
							
							saldoNoAplicado = 0;
							
							encontreFC_2 = true;
						}
						
						g_2++;
					}					
				}	
			}			

			k++;
		}
		
		nlapiSubmitRecord(record_1);
		
		// actualizo la fecha de pago automatico con la fecha del sistema
		//record_1.setFieldValue('custbody_fecha_aplicacion_auto', nlapiDateToString(today));
				
	}
	
	//alert ('Debug: Proceso terminado');
}

// *** (P7) - Agregado el 17/11/2011
function yaFueProcesado(arrayCategYRecepActuales, categoria, recepcion){
	
	var i=0;
	while (arrayCategYRecepActuales != null && arrayCategYRecepActuales.length > i){
		
		if (arrayCategYRecepActuales[i]['categoria'] == categoria && arrayCategYRecepActuales[i]['recepcion'] == recepcion)
			return true;
		
		i++;	
	}
	
	return false;
}


// *** (P7) - Agregado el 24/02/2011
function imr_boton_crear_apertura_costos(){

	var recId	= nlapiGetRecordId();
	var entity  = nlapiGetFieldValue('entity');
	
	// Validaci�n Nro. 1 - Chequeo que el proveedor este seleccionado
	if (entity == null || entity == ''){
		alert ('Por favor seleccione un Proveedor para continuar.');
		return false;
	}
	
	// Validaci�n Nro. 2 - Chequeo que el proceso solo sea ejecutado en modo edici�n
	if (recId == null || recId == ''){
		alert ('El proceso solo puede ser ejecutado en modo edici�n. Verifique y vuelva a intentar.');
		return false;
	}	
	
	// Validaci�n Nro. 3 - Chequeo que las categor�as ingresadas en la apertura, se encuentren entre las categor�as incluidas en los art�culos
	var landedCostCategSel = new Array();
	
	for ( var a = 1; a <= nlapiGetLineItemCount('item'); a++)
		landedCostCategSel.push(nlapiGetLineItemValue('item', 'landedcostcategory', a));
	
	var filtersTmp = new Array();
	var columnsTmp = new Array();
	
	filtersTmp[0] = new nlobjSearchFilter('custrecord_3k_factura_prov_asociada', null, 'is', recId);	
	columnsTmp[0] = new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
	
	var searchresultsTmp = nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filtersTmp, columnsTmp );
	
	var i = 0;
	var noEsta = false;
	
	while (searchresultsTmp != null && i < searchresultsTmp.length && noEsta == false){
	
		if (in_array(searchresultsTmp[i].getValue('custrecord_3k_costosdesag_categoria'), landedCostCategSel))
			noEsta = false;
		else
			noEsta = true;
				
		i++;
	}	
	
	if (noEsta == true){
		alert('Se defini� una categor�a en la apertura, que no se encuentra dada de alta en ninguno de los art�culos. Verifique y vuelva a intentar.');
		return false;
	}
	
	// Validaci�n Nro. 4 - Valido que en la apertura de costos desagregados ingresada, no exista una tupla recepci�n categor�a id�ntica en distintas l�neas
	// recorro la estructura auxiliar y me guardo en un arreglo, la tupla categoria-recepcion
	
	var arrayCategYRecepCargadas = new Array();
	
	var filtersTmp_1 = new Array();
	var columnsTmp_1 = new Array();
	
	filtersTmp_1[0] = new nlobjSearchFilter('custrecord_3k_factura_prov_asociada', null, 'is', recId);	
	columnsTmp_1[0] = new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
	columnsTmp_1[1] = new nlobjSearchColumn("custrecord_3k_recepcion_asociada");
	
	var searchresultsTmp_1 = nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filtersTmp_1, columnsTmp_1 );
	
	for ( var i = 0; searchresultsTmp_1 != null && i < searchresultsTmp_1.length ; i++ ){
	
		var categoria = searchresultsTmp_1[i].getValue('custrecord_3k_costosdesag_categoria');
		var recepciones = searchresultsTmp_1[i].getValue('custrecord_3k_recepcion_asociada');
		
		var recepcionesArray = recepciones.split(',');
		
		var j = 0;
		
		while (recepcionesArray != null && recepcionesArray.length > j){
		
			if (yaFueProcesado(arrayCategYRecepCargadas, categoria, recepcionesArray[j])){
			
				alert ('Se ingreso la misma categor�a de costos desagregados y recepci�n en m�ltiples lineas. Verifique y vuelva a intentar.');
				return false;
			}
			else{
				arrayTmp = new Array();
				arrayTmp['categoria'] = categoria;
				arrayTmp['recepcion'] = recepcionesArray[j];
				
				arrayCategYRecepCargadas.push(arrayTmp);
				
			}
			
			j++;
				
		}
	}
	
	// -- fin de las validaciones
	
	if (confirm('El proceso pisara los importes parciales por cada categor�a. El mismo puede demorar unos segundos, desea continuar ?')){
	
		var filters = new Array();
		var columns = new Array();
			
		filters[0] = new nlobjSearchFilter('custrecord_3k_factura_prov_asociada', null, 'is', recId);	
		
		columns[0]	= new nlobjSearchColumn("custrecord_3k_proveedor_asociado");
		columns[1]	= new nlobjSearchColumn("custrecord_3k_recepcion_asociada");
		columns[2]	= new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
		columns[3]	= new nlobjSearchColumn("custrecord_3k_importe_parcial");
		columns[4]	= new nlobjSearchColumn("custrecord_3k_apertura_aplicada");
		columns[5]	= new nlobjSearchColumn("custrecord_3k_factura_prov_asociada");
		columns[6] = new nlobjSearchColumn("custrecord_creado_por_script");
		
		columns[2].setSort(); // ordena por categoria

		var searchresults 	= nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filters, columns );
		
		if (searchresults == null || searchresults.length == 0){
			
			alert ('No hay nada para procesar, verifique y vuelva a intentar.');
			return false;
		}
		
		var i = 0;
		
		while (searchresults != null && i < searchresults.length){
			
			var categoria = searchresults[i].getValue('custrecord_3k_costosdesag_categoria');
			
			// guardo todas las recepciones para la categor�a, ya sea en una l�nea o en m�ltiples l�neas
			
			var categoriaSig = categoria;
			var recepcionesPorCategoria = new Array();
			
			while (searchresults != null && i < searchresults.length && searchresults[i].getValue('custrecord_3k_costosdesag_categoria') == categoria){
			
				var proveedor = searchresults[i].getValue('custrecord_3k_proveedor_asociado');
				var recepcionesAsociadas 	= searchresults[i].getValue('custrecord_3k_recepcion_asociada');
				
				var recepcionesAsociadasArray = recepcionesAsociadas.split(',');
				var j = 0;
				
				while (recepcionesAsociadasArray != null && recepcionesAsociadasArray.length > j){
				         var check = searchresults[i].getValue('custrecord_creado_por_script');
			         if(check == 'T'){
                                   j++;
				   continue;   }
					recepcionesPorCategoria.push({proveedor: proveedor,
												  recepcion: recepcionesAsociadasArray[j]});
					
					j++;
				} // fin del while
				
				var recId_2 		= searchresults[i].getId();
				var recType_2 		= searchresults[i].getRecordType();
				var check = searchresults[i].getValue('custrecord_creado_por_script');
			         if(check == 'T'){
                                   i++;
				   continue;   }
				nlapiDeleteRecord(recType_2, recId_2);
				
				i++;
				
			} // fin del while categoriaSig == categoria
				
			//alert ('Debug: Categoria: ' + categoria);
						
			// logica del proceso
			
			var importeParcial = 0;
			
			for ( var j = 1; j <= nlapiGetLineItemCount('item'); j++){		
				
				var item				= nlapiGetLineItemValue('item', 'item', j);
				var quantity			= nlapiGetLineItemValue('item', 'quantity', j);
				var landedCostCategory	= nlapiGetLineItemValue('item', 'landedcostcategory', j);			
				
				if (categoria == landedCostCategory)
					importeParcial	= importeParcial + parseFloat(nlapiGetLineItemValue('item', 'amount', j));
			}
			
			//alert ('Debug: importeParcial: ' + importeParcial);
			
			// obtengo el importe total de las recepciones
			var recepcionesAsociadasArray = new Array();
			recepcionesAsociadasArray = recepcionesPorCategoria;
			
			var importeTotalRecepciones = 0;
			
			for ( var k_1 = 0; k_1 < recepcionesAsociadasArray.length; k_1++){		
			
				var newRecItemReceipt 	= nlapiLoadRecord('itemreceipt', recepcionesAsociadasArray[k_1]['recepcion']);
				var countItems 			= newRecItemReceipt.getLineItemCount('item');
				var exchangerate		= newRecItemReceipt.getFieldValue('exchangerate');
				
				for ( var g_1 = 1; g_1 <= countItems; g_1++){		
				
					var quantity	= newRecItemReceipt.getLineItemValue('item', 'quantity', g_1);
					var rate		= newRecItemReceipt.getLineItemValue('item', 'rate', g_1);
					
					importeTotalRecepciones = importeTotalRecepciones + (parseFloat(quantity)*parseFloat(rate)*parseFloat(exchangerate));				
				}				
			}
			
			//alert ('Debug: importeTotalRecepciones:' + importeTotalRecepciones);
			
			// seg�n la cantidad de recepciones, creo una linea p/ cada recepcion encontrada aplicando el porcentaje de la misma sobre el importe
			
			var recepcionesAsociadasArray = new Array();
			recepcionesAsociadasArray = recepcionesPorCategoria;
			
			for ( var k_2 = 0; k_2 < recepcionesAsociadasArray.length; k_2++){
				
				// calculo el importe de la recepcion
				var newRecItemReceipt 	= nlapiLoadRecord('itemreceipt', recepcionesAsociadasArray[k_2]['recepcion']);
				var countItems 			= newRecItemReceipt.getLineItemCount('item');
				var exchangerate		= newRecItemReceipt.getFieldValue('exchangerate');
				
				var importeTotalRecepcion = 0;
				
				for ( var g_2 = 1; g_2 <= countItems; g_2++){		
				
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
  newRecord.setFieldValue('custrecord_creado_por_script', 'T');
				newRecord.setFieldValue('custrecord_3k_factura_prov_asociada', recId);
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
		

// (P7) - ASIGNACION DE MULTIPLES GASTOS DE IMPORTACION - Click button ( Recepci�n de Art�culos )
function imr_cargar_costos_desagregados()
{
	var recId	= nlapiGetRecordId();
	
	var monedaRecepArt		= nlapiGetFieldValue('currencyname');
	var tipoCambioRecepArt	= nlapiGetFieldValue('exchangerate');
	
	var i		= 0;
	var filters = new Array();
	var columns = new Array();
		
	filters[0]  = new nlobjSearchFilter('custrecord_3k_recepcion_asociada', null, 'anyof', recId);	
	
	columns[0]	= new nlobjSearchColumn("custrecord_3k_proveedor_asociado");
	columns[1]	= new nlobjSearchColumn("custrecord_3k_recepcion_asociada");
	columns[2]	= new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
	columns[3]	= new nlobjSearchColumn("custrecord_3k_importe_parcial");
	columns[4]	= new nlobjSearchColumn("custrecord_3k_apertura_aplicada");
	columns[5]	= new nlobjSearchColumn("custrecord_3k_factura_prov_asociada");

	var searchresults 	= nlapiSearchRecord('customrecord_apertura_costo_desagregados', 'customsearch_3k_costos_desag_x_categoria', filters, columns );

	if (searchresults == null || searchresults.length == 0)
		alert ('No hay apertura de costos desagregados generada o no se encontraron FC de Proveedor que tengan asociada esta recepci�n. Verifique y vuelva a intentar.');
	
	else {
		
		nlapiSetFieldValue('landedcostmethod', 'VALUE', true, true);
		
		while (	searchresults != null && i < searchresults.length )
		{
			// 1er. corte de control - tomo la categoria para hacer el corte de control
			categoria = searchresults[i].getValue('custrecord_3k_costosdesag_categoria');
					
			importeTotal = 0;
					
			while (	searchresults != null && i < searchresults.length && categoria == searchresults[i].getValue('custrecord_3k_costosdesag_categoria'))
			{
				importeParcial			= searchresults[i].getValue('custrecord_3k_importe_parcial');	   
				proveedorAsignado		= searchresults[i].getValue('custrecord_3k_proveedor_asociado');	   
				aperturaAplicada		= searchresults[i].getValue('custrecord_3k_apertura_aplicada');	   	   
				facturaProveedor		= searchresults[i].getValue('custrecord_3k_factura_prov_asociada');
				
				if (facturaProveedor != null && facturaProveedor != ''){
								
					// me fijo la moneda de la factura de proveedor
					var vendorBill			= nlapiLoadRecord('vendorbill', facturaProveedor);
					var monedaFactProv		= vendorBill.getFieldValue('currencyname');
					var tipoCambioFactProv	= vendorBill.getFieldValue('exchangerate');

					if (monedaRecepArt == monedaFactProv)
						var tipoCambio = 1;
					else
						var tipoCambio = tipoCambioRecepArt;
						
					if (importeParcial == null || importeParcial == '')
						importeParcial = 0;
							
					importeTotal	+= parseFloat(importeParcial/parseFloat(tipoCambio));
				}
				
				i = i + 1;
			}		
			
			if (facturaProveedor != null && facturaProveedor != '' && importeTotal != null && importeTotal != ''){
			
				nlapiSetFieldValue('landedcostsource'+categoria, 'OTHTRAN', true, true);
				nlapiSetFieldValue('landedcostsourcetran'+categoria, facturaProveedor, true, true);
				nlapiSetFieldValue('landedcostamount'+categoria, importeTotal, true, true);						
			}
		}		
			
		alert ('El proceso finalizo correctamente.');
	}
}

// (P7) - ASIGNACION DE MULTIPLES GASTOS DE IMPORTACION - Evento sobre la recepcion de articulos
function imr_grabar_costos_desagregados(type)
{
	if (type != 'delete'){
	
		var recId 		= nlapiGetRecordId();
		var recType		= nlapiGetRecordType();
		var record 		= nlapiLoadRecord(recType, recId);
		
		// 1ero. desaplico todos los costos desagregados de esta recepcion
		var filters_1 = new Array();
			
		filters_1[0] = new nlobjSearchFilter('custrecord_3k_recepcion_asociada', null, 'anyof', recId);		

		var searchresults = nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filters_1, null );

		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];

			var recId_1 		= searchresult.getId();
			var recType_1 		= searchresult.getRecordType();			
			var record_1		= nlapiLoadRecord(recType_1, recId_1 );
			
			record_1.setFieldValue('custrecord_3k_apertura_aplicada', 'F');
			
			nlapiSubmitRecord(record_1, true, true);
		}
		
		// 2do. aplico los costos desagregados definidos en la recepcion de articulos
		var filters_2 = new Array();
		
		filters_2[0] = new nlobjSearchFilter('custrecord_3k_apertura_aplicada', null, 'is', 'F');	
		filters_2[1] = new nlobjSearchFilter('custrecord_3k_recepcion_asociada', null, 'anyof', recId);		

		var searchresults = nlapiSearchRecord('customrecord_apertura_costo_desagregados', null, filters_2, null );

		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];

			var recId_2 		= searchresult.getId();
			var recType_2 		= searchresult.getRecordType();			
			var record_2		= nlapiLoadRecord(recType_2, recId_2 );
			
			var categoriaSel	= record_2.getFieldValue('custrecord_3k_costosdesag_categoria');			
			
			if (record.getFieldValue('landedcostamount'+categoriaSel) != '' && record.getFieldValue('landedcostamount'+categoriaSel) != null
			    && record.getFieldValue('landedcostsource'+categoriaSel) != 'MANUAL')
			
				record_2.setFieldValue('custrecord_3k_apertura_aplicada', 'T');
			
			nlapiSubmitRecord(record_2, true, true);
		}
	}
	
}

// (P17) - COPIAR SELECCION DE DESCUENTOS - Field Changed - copia de dto. desde el cliente a la transacci�n: Cotiz. - ov - fc - fc. de caja - nc
function imr_copia_dto_cliente_a_transaccion(type, name, linenum)
{
	if (name == 'entity')
	{
		var recordType	= 'customer';
		var recordId	= nlapiGetFieldValue('entity');
		
		if (recordId != null && recordId != ''){
		
			var record		= nlapiLoadRecord(recordType, recordId);
			
			var descuento	= record.getFieldValue('custentity_descuento');
			
			if (descuento != null && descuento != '')
				nlapiSetFieldValue('discountitem', descuento);
		}
	}
}

// Click button - Script en transacci�n "Factura de Proveedor"
function imr_verificar_cantidad_recibida()
{	
	if ( nlapiGetFieldValue('custbody3k_aplica_cantidad_recibida') == 'T' && nlapiGetFieldValue('custbody3k_tipo_factura_proveedor') == 'T' ){
	
		alert ('Ya fue aplicada la cantidad recibida. Verifique.');
		return false;
	}
	
	if ( nlapiGetFieldValue('custbody3k_aplica_cantidad_recibida') == 'T' && nlapiGetFieldValue('custbody3k_tipo_factura_proveedor') == 'F' ){
	
		var lines					= nlapiGetLineItemCount('item');
		var lineas_cant_a_facturar 	= 0;
		
		for ( var i = 1; i<= lines; i++ ){
		
			if (nlapiGetLineItemValue('item', 'custcol_cant_a_facturar', i) != ''){
			
				lineas_cant_a_facturar = lineas_cant_a_facturar + 1;
			}	
		}
		
		if (lineas_cant_a_facturar == 0){
		
			alert ('No hay cantidades informadas. Verifique.');
			return false;
		}
	}
	return true;
}

// (P18) - Cambio de cantidad en Factura
function imr_aplicar_cantidad_recibida(type)
{
	nlapiLogExecution('DEBUG', 'tipo', 'type = ' + type);	
	
	if (type == 'create' || type == 'edit')
	{
		var vendorBillId 		= nlapiGetRecordId();
		var vendorBillType		= nlapiGetRecordType();
		var recordVendorBill 	= nlapiLoadRecord(vendorBillType, vendorBillId);
		
		var purchaseOrderSource	= '';
					
		if (recordVendorBill.getLineItemCount('purchaseorders') == 1)
			purchaseOrderSource = recordVendorBill.getLineItemValue('purchaseorders', 'id', 1);
			
		nlapiLogExecution('DEBUG', 'purchaseOrderSource', 'purchaseorders = ' + purchaseOrderSource);	
		
		if (purchaseOrderSource != '' && purchaseOrderSource != null)		
		{				
			// si el vendor bill aplica cantidad recibica
			if (recordVendorBill.getFieldValue('custbody3k_aplica_cantidad_recibida') == 'T')
			{
				// si nunca fue aplicada la cantidad recibida en este vendor bill
				if (recordVendorBill.getFieldValue('custbody3k_tipo_factura_proveedor') == 'F')
				{			
					var lineas_cant_a_facturar 	= 0;
					var lines_1 				= recordVendorBill.getLineItemCount('item');
					
					// traspaso la columna cantidad a facturar a la columna cantidad
					for ( var i = 1; i<= lines_1; i++ )
					{		
						cantidad_a_facturar = recordVendorBill.getLineItemValue('item', 'custcol_cant_a_facturar', i);	
						
						if (cantidad_a_facturar == '' || cantidad_a_facturar == null)
						{			
							recordVendorBill.setLineItemValue('item', 'quantity', i, 0);
						}
						else
						{		
							lineas_cant_a_facturar = lineas_cant_a_facturar + 1;
							recordVendorBill.setLineItemValue('item', 'quantity', i, cantidad_a_facturar);
						}	
					}
					
					recordVendorBill.setFieldValue('custbody3k_tipo_factura_proveedor', 'T'); // le cambio el estado al tilde para indicar que las cantidades ya fueron recibidas
					
					nlapiSubmitRecord(recordVendorBill, true);
					
					if (lineas_cant_a_facturar != 0)
					{											
						var purchaseOrderType		= 'purchaseorder';
						var recordPurchaseOrder		= nlapiLoadRecord(purchaseOrderType, purchaseOrderSource);
							
						var lines_2 = recordPurchaseOrder.getLineItemCount('item');
							
						for ( var j = 1; j<= lines_2; j++ )
						{
							recordPurchaseOrder.setLineItemValue('item', 'custcol_cant_a_facturar', j, '');
						}	
							
						nlapiSubmitRecord(recordPurchaseOrder, true);						
					}
				}
			}
		}
	}
}

//Need review
// (P15) - CONTEO CICLICO: Generacion del conte ciclico(Old Version 1)
function imr_generar_conteo_ciclico1(){

	var recId 		= nlapiGetRecordId();
	var recType		= nlapiGetRecordType();
	var record = nlapiLoadRecord(recType, recId);

	var context = nlapiGetContext();

	nlapiLogExecution('DEBUG', 'recId', recId + " - " + context.getRemainingUsage());

	
	// elimino el detalle generado, en caso de existir	
	var filters	= new Array();			
	filters[0] 	= new nlobjSearchFilter('custrecord_3k_ccid_relacion_cabecera', null, 'is', recId);		
		
	var searchresults 	= nlapiSearchRecord('customrecord_3k_conteo_ciclico_detalle', 'customsearch_3k_conteo_ciclico_cabecera', filters, null );
	
	for ( var k = 0; searchresults != null && k < searchresults.length ; k++ ) {
			
		var searchresult 	= searchresults[k];

		var recId_1 	= searchresult.getId();
		var recType_1	= searchresult.getRecordType();
			
		nlapiDeleteRecord(recType_1, recId_1);
	}
	
	// fin de eliminaci�n del detalle generado

	var cant_detalle	= 0;
	var today 			= new Date();				
	var cant_max_items 	= record.getFieldValue('custrecord_3k_ccic_cant_max_articulos');
	var sel_articulos	= record.getFieldValues('custrecord_3k_ccic_articulos');
	var sel_ubicaciones	= record.getFieldValues('custrecord_3k_ccic_location');
	
	var filters_1 		= new Array();
	var columns_1 		= new Array();
	
	filters_1[0] 	= new nlobjSearchFilter('internalid', null, 'anyof', sel_articulos); // ver si esta dentro de los articulos incluidos
	columns_1[0]	= new nlobjSearchColumn("internalid");

	var searchresults_1 = nlapiSearchRecord('inventoryitem', null, filters_1, columns_1);

	
	// obtengo la cantidad m�xima de items encontrados
	if (searchresults_1.length <= cant_max_items)
		var cant_max = searchresults_1.length;
	else
	    var cant_max = cant_max_items.length;
	
	for ( var i = 0; searchresults_1 != null && i < cant_max ; i++ )
	{
		var internalId			= searchresults_1[i].getValue('internalid');
		var recordInventoryItem = nlapiLoadRecord('inventoryitem', internalId);

		nlapiLogExecution('DEBUG', 'internalId ' + i, internalId + " - " + context.getRemainingUsage());

			
		for (var j = 1; j <= recordInventoryItem.getLineItemCount( 'locations'); j++)
		{
			var binnumber			= recordInventoryItem.getLineItemValue('binnumber', 'binnumber', 1);				
			
			var location 			= recordInventoryItem.getLineItemValue('locations', 'location', j);
			var quantityavailable 	= recordInventoryItem.getLineItemValue('locations', 'quantityavailable', j);
			var quantitybackordered = recordInventoryItem.getLineItemValue('locations', 'quantitybackordered', j);
				
			if (quantityavailable == null || quantityavailable == '')
				quantityavailable = 0;
			if (quantitybackordered == null || quantitybackordered == '')
				quantitybackordered = 0;
			
			if ( (parseFloat(quantityavailable) - parseFloat(quantitybackordered) > 0) && (in_array(location, sel_ubicaciones)) )
			{				
				var recordDetalle = nlapiCreateRecord('customrecord_3k_conteo_ciclico_detalle');
				
				recordDetalle.setFieldValue('custrecord_3k_ccid_articulo', internalId);
				recordDetalle.setFieldValue('custrecord_3k_ccid_ubicacion', location);
				recordDetalle.setFieldValue('custrecord_3k_ccid_bin', binnumber);
				recordDetalle.setFieldValue('custrecord_3k_ccid_cantidad_original', parseFloat(quantityavailable));				
				recordDetalle.setFieldValue('custrecord_3k_ccid_usuario_conteo', record.getFieldValue('custrecord_3k_ccic_usuario'));
				recordDetalle.setFieldValue('custrecord_3k_ccid_fechayhora', nlapiDateToString(today));
				recordDetalle.setFieldValue('custrecord_3k_ccid_relacion_cabecera', recId);
					
				nlapiSubmitRecord(recordDetalle, true);

				cant_detalle = cant_detalle + 1;

				nlapiLogExecution('DEBUG', 'context inside', context.getRemainingUsage());
					
				// actualizo la fecha de conteo ciclico en el item
				var recordItem	= nlapiLoadRecord('inventoryitem', internalId);
				recordItem.setFieldValue('custitem_3k_fec_conteo_ciclico', nlapiDateToString(today));

				nlapiSubmitRecord(recordItem, true);

				nlapiLogExecution('DEBUG', 'item submit', context.getRemainingUsage());					
			}				
		}				
	}
	
	if (cant_detalle == 0)
		alert ('No se pudieron generar registros de detalle, verifique los �tems/ubicaciones seleccionados y el stock disponible en el sistema.');
	else
		alert ('Se han generado ' + cant_detalle + ' registros de detalle.');
	
	var v_url				= nlapiResolveURL('RECORD', 'customrecord_3k_conteo_ciclico_cabecera', recId, true);
	window.location.href 	= v_url;
	
	return true;
}


function ascii_value(c) {
    // restrict input to a single character
    c = c.charAt(0);

    // loop through all possible ASCII values
    var i;
    for (i = 0; i < 256; ++i) {
        // convert i into a 2-digit hex string
        var h = i.toString(16);
        if (h.length == 1)
            h = "0" + h;

        // insert a % character into the string
        h = "%" + h;

        // determine the character represented by the escape code
        h = unescape(h);

        // if the characters match, we've found the ASCII value
        if (h == c)
            break;
    }
    return i;
}

// Taking 2.2 min and processing around 122 items.
// (P15) - CONTEO CICLICO: Generacion del conte ciclico(New version 1)
function imr_generar_conteo_ciclico() {

    var recId = nlapiGetRecordId();
    var recType = nlapiGetRecordType();
    var recordCreated = false;
   
    var context = nlapiGetContext();

    //nlapiLogExecution('DEBUG', 'recId', recId + " - " + context.getRemainingUsage());

    // elimino el detalle generado, en caso de existir	
    var filters = new Array();
    filters[0] = new nlobjSearchFilter('custrecord_3k_ccid_relacion_cabecera', null, 'is', recId);

    var searchresults = nlapiSearchRecord('customrecord_3k_conteo_ciclico_detalle', 'customsearch_3k_conteo_ciclico_cabecera', filters, null);
    var searchresult = '';
    var recId_1 = '';
    var recType_1 = '';

    if (searchresults != null) {

        for (var k = 0; searchresults != null && k < searchresults.length; k++) {

            searchresult = searchresults[k];
            recId_1 = searchresult.getId();
            recType_1 = searchresult.getRecordType();
            nlapiDeleteRecord(recType_1, recId_1);
        }
    }

    // fin de eliminaci�n del detalle generado

    var cant_detalle = 0;
    var today = new Date();
    var cant_max_items = nlapiGetFieldValue('custrecord_3k_ccic_cant_max_articulos');
    var sel_articulos = nlapiGetFieldValue('custrecord_3k_ccic_articulos');
    var sel_ubicaciones = nlapiGetFieldValue('custrecord_3k_ccic_location');
    var ccis_usuario = nlapiGetFieldValue('custrecord_3k_ccic_usuario');

    //alert(sel_articulos);

    try {
        sel_articulos = sel_articulos.replace(//g, ',');

        //alert(sel_articulos);

        sel_articulos = sel_articulos.split(',');
    }
    catch (ex) {
        nlapiLogExecution('DEBUG', 'Error in split', ex);
    }

    var filters_1 = new Array();
    var columns_1 = new Array();

    filters_1[0] = new nlobjSearchFilter('internalid', null, 'anyof', sel_articulos); // ver si esta dentro de los articulos incluidos
    columns_1[0] = new nlobjSearchColumn("internalid");

    var searchresults_1 = nlapiSearchRecord('inventoryitem', null, filters_1, columns_1);

    // obtengo la cantidad m�xima de items encontrados
    if (searchresults_1.length <= cant_max_items) {
        var cant_max = searchresults_1.length;
    }
    else {
        var cant_max = cant_max_items.length;
    }

    var internalId = '';
    var recordInventoryItem = '';
    var binnumber = '';
    var location = '';
    var quantityavailable = '';
    var quantitybackordered = '';
    var recordDetalle = '';

    //nlapiLogExecution('DEBUG', 'cant_max', cant_max + " - " + context.getRemainingUsage());

    for (var i = 0; searchresults_1 != null && i < cant_max; i++) {

        recordCreated = false;
        internalId = searchresults_1[i].getValue('internalid');
        recordInventoryItem = nlapiLoadRecord('inventoryitem', internalId);

        //nlapiLogExecution('DEBUG', 'internalId ' + i, internalId + " - " + context.getRemainingUsage());

        for (var j = 1; j <= recordInventoryItem.getLineItemCount('locations'); j++) {

            binnumber = recordInventoryItem.getLineItemValue('binnumber', 'binnumber', 1);
            location = recordInventoryItem.getLineItemValue('locations', 'location', j);
            quantityavailable = recordInventoryItem.getLineItemValue('locations', 'quantityavailable', j);
            quantitybackordered = recordInventoryItem.getLineItemValue('locations', 'quantitybackordered', j);

            if (quantityavailable == null || quantityavailable == '')
                quantityavailable = 0;
            if (quantitybackordered == null || quantitybackordered == '')
                quantitybackordered = 0;

            // alert("binnumber " + binnumber + " - " + location + " - " + quantityavailable + " - " + quantitybackordered);          

            if ((parseFloat(quantityavailable) - parseFloat(quantitybackordered) > 0) && (in_array(location, sel_ubicaciones))) {

                recordDetalle = nlapiCreateRecord('customrecord_3k_conteo_ciclico_detalle');

                recordDetalle.setFieldValue('custrecord_3k_ccid_articulo', internalId);
                recordDetalle.setFieldValue('custrecord_3k_ccid_ubicacion', location);
                recordDetalle.setFieldValue('custrecord_3k_ccid_bin', binnumber);
                recordDetalle.setFieldValue('custrecord_3k_ccid_cantidad_original', parseFloat(quantityavailable));
                recordDetalle.setFieldValue('custrecord_3k_ccid_usuario_conteo', ccis_usuario);
                recordDetalle.setFieldValue('custrecord_3k_ccid_fechayhora', nlapiDateToString(today));
                recordDetalle.setFieldValue('custrecord_3k_ccid_relacion_cabecera', recId);

                nlapiSubmitRecord(recordDetalle, true);

                cant_detalle = cant_detalle + 1;

                recordCreated = true;

                //nlapiLogExecution('DEBUG', 'Submit custom record', context.getRemainingUsage());
               
                nlapiSubmitField('inventoryitem', internalId, 'custitem_3k_fec_conteo_ciclico', nlapiDateToString(today));
                
                //nlapiLogExecution('DEBUG', 'Submit item record', context.getRemainingUsage());
            }
        } // for loop

    } // for loop

    if (cant_detalle == 0)
        alert('No se pudieron generar registros de detalle, verifique los �tems/ubicaciones seleccionados y el stock disponible en el sistema.');
    else
        alert('Se han generado ' + cant_detalle + ' registros de detalle.');

    var v_url = nlapiResolveURL('RECORD', 'customrecord_3k_conteo_ciclico_cabecera', recId, true);
    window.location.href = v_url;

    return true;
}

// Taking 1 min and processing around 90 items.
// (P15) - CONTEO CICLICO: Generacion del conte ciclico(New version 2)
function imr_generar_conteo_ciclico2() {

    var recId = nlapiGetRecordId();
    var recType = nlapiGetRecordType();
    var recordCreated = false;

    var context = nlapiGetContext();

    //nlapiLogExecution('DEBUG', 'recId', recId + " - " + context.getRemainingUsage());
   
    // elimino el detalle generado, en caso de existir	
    var filters = new Array();
    filters[0] = new nlobjSearchFilter('custrecord_3k_ccid_relacion_cabecera', null, 'is', recId);

    var searchresults = nlapiSearchRecord('customrecord_3k_conteo_ciclico_detalle', 'customsearch_3k_conteo_ciclico_cabecera', filters, null);
    var searchresult = '';
    var recId_1 = '';
    var recType_1 = '';

    if (searchresults != null) {    
        
        for (var k = 0; searchresults != null && k < searchresults.length; k++) {

            searchresult = searchresults[k];
            recId_1 = searchresult.getId();
            recType_1 = searchresult.getRecordType();
            nlapiDeleteRecord(recType_1, recId_1);
        }        
    }    
    
    // fin de eliminaci�n del detalle generado

    var cant_detalle = 0;
    var today = new Date();
    var cant_max_items = nlapiGetFieldValue('custrecord_3k_ccic_cant_max_articulos');
    var sel_articulos = nlapiGetFieldValue('custrecord_3k_ccic_articulos');
    var sel_ubicaciones = nlapiGetFieldValue('custrecord_3k_ccic_location');
    var ccis_usuario = nlapiGetFieldValue('custrecord_3k_ccic_usuario');

    //alert(sel_articulos);

    try {
        //nlapiLogExecution('DEBUG', 'sel_articulos', sel_articulos);
        sel_articulos = sel_articulos.replace(//g, ',');

        sel_articulos = sel_articulos.split(',');
        //nlapiLogExecution('DEBUG', 'sel_articulos 1', sel_articulos);
    }
    catch (ex) {
        nlapiLogExecution('DEBUG', 'Error in split', ex);

    }   

    var filters_1 = new Array();
    var columns_1 = new Array();

    filters_1[0] = new nlobjSearchFilter('internalid', null, 'anyof', sel_articulos); // ver si esta dentro de los articulos incluidos
    columns_1[0] = new nlobjSearchColumn("internalid");

    var searchresults_1 = nlapiSearchRecord('inventoryitem', null, filters_1, columns_1);
    //nlapiLogExecution('DEBUG', 'searchresults_1', searchresults_1.length);

    // obtengo la cantidad m�xima de items encontrados
    if (searchresults_1.length <= cant_max_items) {
        var cant_max = searchresults_1.length;
    }
    else {
        var cant_max = cant_max_items.length;
    }
    
    var internalId = '';
    var recordInventoryItem = '';
    var binnumber = '';
    var location = '';
    var quantityavailable = '';
    var quantitybackordered = '';
    var recordDetalle = '';

    var filters_2 = new Array();

    var searchresults_2 = '';

    //nlapiLogExecution('DEBUG', 'cant_max', cant_max + " - " + context.getRemainingUsage());

    for (var i = 0; searchresults_1 != null && i < cant_max; i++) {

        recordCreated = false;
        internalId = searchresults_1[i].getValue('internalid');

        //nlapiLogExecution('DEBUG', 'internalId ' + i, internalId + " - " + context.getRemainingUsage());

        filters_2[0] = new nlobjSearchFilter('internalid', null, 'is', internalId);

        searchresults_2 = nlapiSearchRecord('item', 'customsearch_imr_conteo_ciclico_item', filters_2, null);
        //nlapiLogExecution('DEBUG', 'searchresults_2', searchresults_2.length + " - " + context.getRemainingUsage());

        for (var count = 0; searchresults_2 != null && count < searchresults_2.length; count++) { // loop equals to as may as locations in items

            binnumber = searchresults_2[count].getValue('internalid', 'binNumber');
            location = searchresults_2[count].getValue('inventorylocation');
            quantityavailable = searchresults_2[count].getValue('locationquantityavailable');
            quantitybackordered = searchresults_2[count].getValue('locationquantitybackordered');

            if (quantityavailable == null || quantityavailable == '')
                quantityavailable = 0;
            if (quantitybackordered == null || quantitybackordered == '')
                quantitybackordered = 0;


            if ((parseFloat(quantityavailable) - parseFloat(quantitybackordered) > 0) && (in_array(location, sel_ubicaciones))) {

                recordDetalle = nlapiCreateRecord('customrecord_3k_conteo_ciclico_detalle');

                recordDetalle.setFieldValue('custrecord_3k_ccid_articulo', internalId);
                recordDetalle.setFieldValue('custrecord_3k_ccid_ubicacion', location);
                recordDetalle.setFieldValue('custrecord_3k_ccid_bin', binnumber);
                recordDetalle.setFieldValue('custrecord_3k_ccid_cantidad_original', parseFloat(quantityavailable));
                recordDetalle.setFieldValue('custrecord_3k_ccid_usuario_conteo', ccis_usuario);
                recordDetalle.setFieldValue('custrecord_3k_ccid_fechayhora', nlapiDateToString(today));
                recordDetalle.setFieldValue('custrecord_3k_ccid_relacion_cabecera', recId);

                nlapiSubmitRecord(recordDetalle, true);
                //nlapiLogExecution('DEBUG', 'Custom record', 'created' + " - " + context.getRemainingUsage());

                cant_detalle = cant_detalle + 1;

                recordCreated = true;

            }
            else {
                //nlapiLogExecution('DEBUG', 'else part', location);
            }

        }

        if (recordCreated) {

            nlapiSubmitField('inventoryitem', internalId, 'custitem_3k_fec_conteo_ciclico', nlapiDateToString(today));
            //nlapiLogExecution('DEBUG', 'Item submitted', context.getRemainingUsage());
        }

        if (context.getRemainingUsage() < 20) {
            nlapiLogExecution('DEBUG', 'Context last', context.getRemainingUsage());
            break;
        }

    } // for loop

    if (cant_detalle == 0)
        alert('No se pudieron generar registros de detalle, verifique los �tems/ubicaciones seleccionados y el stock disponible en el sistema.');
    else
        alert('Se han generado ' + cant_detalle + ' registros de detalle.');

    var v_url = nlapiResolveURL('RECORD', 'customrecord_3k_conteo_ciclico_cabecera', recId, true);
    window.location.href = v_url;

    return true;
}

// (P15) - CONTEO CICLICO: Eliminacion
function imr_eliminar_conteo_ciclico(){

	var cant_detalle	= 0;
	
	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();
	var record	= nlapiLoadRecord(recType, recId);
	
	var filters	= new Array();			
	filters[0] 	= new nlobjSearchFilter('custrecord_3k_ccid_relacion_cabecera', null, 'is', recId);		
		
	var searchresults 	= nlapiSearchRecord('customrecord_3k_conteo_ciclico_detalle', 'customsearch_3k_conteo_ciclico_cabecera', filters, null );
	
	if (searchresults == null || searchresults.length == 0)
		
		alert ('No se encontraron registros detalle a eliminar. Verifique y vuelva a intentar.');
		
	else {
	
		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];

			var recId_2 		= searchresult.getId();
			var recType_2 		= searchresult.getRecordType();
			
			nlapiDeleteRecord(recType_2, recId_2);
			
			cant_detalle = cant_detalle + 1;
		}
	}
	
	if (cant_detalle > 0)
		alert ('Se han eliminado ' + cant_detalle + ' registros de detalle.');
		
	var v_url				= nlapiResolveURL('RECORD', 'customrecord_3k_conteo_ciclico_cabecera', recId, true);
	window.location.href 	= v_url;
	
	return true;
}

// (P15) - CONTEO CICLICO: Boton de impresion
function imr_boton_impresion_conteo_cabecera(type, form) {	
	
	if (type == 'view')
	{
		form.setScript('customscript_imr_enlace_to_pdf');
		form.addButton('custpage_imprimir_conteo', 'Imprimir conteo ciclico', "imr_imprimir_conteo_ciclico()");		
	}	
}

// (P15) - CONTEO CILICO: Evento que redirecciona al Suitlet
function imr_imprimir_conteo_ciclico(){

	var recId	= nlapiGetRecordId();
	
	if (recId != '')
	{
		var new_url = nlapiResolveURL('SUITELET', 'customscript_imr_conteo_ciclico', 'customdeploy1');	 
		window.open (new_url + "&custparam_conteo=" + recId);
	}
}

// (P15) - CONTEO CICLICO: Generacion de PDF
function imr_pdf_conteo_ciclico(request, response) {	

	var filters	= new Array();	
	var columns	= new Array();	
	
	filters[0] 	= new nlobjSearchFilter('custrecord_3k_ccid_relacion_cabecera', null, 'is', request.getParameter('custparam_conteo'));	
	columns[0]	= new nlobjSearchColumn("custrecord_3k_ccid_ubicacion");
	columns[1]	= new nlobjSearchColumn("custrecord_3k_ccid_bin");
	columns[2]	= new nlobjSearchColumn("custrecord_3k_ccid_articulo");
	columns[3]	= new nlobjSearchColumn("custrecord_3k_ccid_cantidad_original");
	columns[4]	= new nlobjSearchColumn("custrecord_3k_ccid_cantidad_contada");
	columns[5]	= new nlobjSearchColumn("custrecord_3k_ccid_usuario_conteo");
	columns[6]	= new nlobjSearchColumn("custrecord_3k_ccid_fechayhora");
	columns[7]	= new nlobjSearchColumn("custrecord_3k_ccid_relacion_cabecera");
	
	// recorro la b�squeda guardada la cual viene ordenada por: Location - Bin - Item
	var searchresults 	= nlapiSearchRecord('customrecord_3k_conteo_ciclico_detalle', 'customsearch_3k_conteo_ciclico_cabecera', filters, columns );	
	
	var strName = '';
	var i 		= 0;
	var pagina	= 1;

  var imagen = nlapiLoadFile(18);
  var url = imagen.getURL();
  var urls = url.split('&');
  var urlAux = '';
  urlAux = urls.join('&amp;');
	
	while (searchresults != null && i < searchresults.length) {
	
		if (i > 0)
			strName += "<div style='page-break-after: always;'></div>";
			
		// Corte de control
		// 1ero. Location - 2do. Bin - 3ero. Item
		locationAnt 	= searchresults[i].getValue('custrecord_3k_ccid_ubicacion');		
		
		// defino cabecera
		strName += "<table><tr>";
		//strName += "<td width='560px'><img src='https://system.netsuite.com/core/media/media.nl?id=18&amp;c=1202293&amp;h=3fb7137895aec6b0380e' /></td>";
    strName += "<td width='560px'><img src='" + urlAux + "' /></td>";
		strName += "<td valign='middle'>P�gina Nro. " + pagina + "</td>";
		strName += "</tr></table>";
		strName += "<ul>";
		strName += "<li>Numerador: " + searchresults[i].getText('custrecord_3k_ccid_relacion_cabecera') + "</li>";
		strName += "<li>Location: " + searchresults[i].getText('custrecord_3k_ccid_ubicacion') + "</li>"; 
		strName += "<li>Fecha: " + searchresults[i].getValue('custrecord_3k_ccid_fechayhora') + "</li>"; 
		strName += "<li>Usuario: " + searchresults[i].getText('custrecord_3k_ccid_usuario_conteo') + "</li>"; 
		strName += "</ul>";
			
		strName += "<table>";
			
		strName += "<tr>";			
		strName += "<td width='50px'>LINEA</td>";
		strName += "<td width='100px'>BIN</td>";
		strName += "<td width='200px'>ITEM</td>";
		strName += "<td width='50px'>CANTIDAD CONTADA</td>";
		strName += "</tr>";			
		
		while ( (searchresults != null && i < searchresults.length) && locationAnt == searchresults[i].getValue('custrecord_3k_ccid_ubicacion') ){				
					
			strName += "<tr>";
			strName += "<td>" + (i+1) + "</td>";
			strName += "<td>" + searchresults[i].getValue('custrecord_3k_ccid_bin') + "</td>";
			strName += "<td>" + searchresults[i].getText('custrecord_3k_ccid_articulo') + "</td>";
			strName += "<td>" + searchresults[i].getValue('custrecord_3k_ccid_cantidad_contada') + "</td>";
			
			strName += "</tr>";			
		
			i = i + 1;
		}		
		
		strName += "</table>";
		
		pagina	= pagina + 1;		
	}
	
	var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
	xml += "<pdf><head></head><body font-size='11'>";	
	xml += strName;
	xml += "</body>\n</pdf>";
	
	var file = nlapiXMLToPDF( xml );
	
	response.setContentType('PDF','Conteo ciclico.pdf', 'inline');
	
	response.write( file.getValue() ); 		
}

// (P15) - CONTEO CICLICO: Filtro de sublineas sobre articulos
function imr_filtrar_articulos_por_sublineas(type, name) {	

	if (name == 'custrecord_3k_sublinea_filtro'){
	
		itemId 					= new Array();
		var cantidadOcurrencias = 0;
		var sublineas			= nlapiGetFieldValue('custrecord_3k_sublinea_filtro');
		
		var filters	= new Array();		
		var columns	= new Array();		
						
		columns[0]	= new nlobjSearchColumn("internalid");
									
		filters[0] 	= new nlobjSearchFilter('custitem_sublinea', null, 'is', sublineas);
		//filters[1] 	= new nlobjSearchFilter('custitem_sublinea', null, 'anyof', sublineas_permitidas);		
										
		var searchresults 	= nlapiSearchRecord('inventoryitem', null, filters, columns );
		cantidadOcurrencias	= searchresults.length;	
									
		for ( var j = 0; searchresults != null && j < searchresults.length ; j++ ){								
			
			itemId[j] = searchresults[j].getValue('internalid');
		}	
		
		if (confirm ('El filtro encontro ' + cantidadOcurrencias + ' ocurrencias. Desea continuar ?'))

			nlapiSetFieldValues('custrecord_3k_ccic_articulos', itemId);			
	}
}

// (P14) - INVENTARIO FISICO
function imr_generar_inventario_fisico(){

	var recId 		= nlapiGetRecordId();
	var recType		= nlapiGetRecordType();
	var record	 	= nlapiLoadRecord(recType, recId);
	
	// elimino el detalle generado, en caso de existir
	var filters_2	= new Array();			
	filters_2[0] 	= new nlobjSearchFilter('custrecord_3k_cfd_relacion_cabecera', null, 'is', recId);		
		
	var searchresults_2 	= nlapiSearchRecord('customrecord_3k_conteo_fisico_detalle', null, filters_2, null );
	
	for ( var k = 0; searchresults_2 != null && k < searchresults_2.length ; k++ ) {
			
		var searchresult_2 	= searchresults_2[k];

		var recId_2 		= searchresult_2.getId();
		var recType_2 		= searchresult_2.getRecordType();
			
		nlapiDeleteRecord(recType_2, recId_2);
	}	
	// fin de eliminaci�n del detalle generado

	var cant_detalle	= 0;
	var today 			= new Date();				
	var sel_articulos	= record.getFieldValues('custrecord_3k_cfis_articulos');
	var sel_ubicaciones	= record.getFieldValues('custrecord_3k_cfis_location');
	
	var filters 		= new Array();
	var columns 		= new Array();
	
	filters[0] 	= new nlobjSearchFilter('internalid', null, 'anyof', sel_articulos); // ver si esta dentro de los articulos incluidos
	columns[0]	= new nlobjSearchColumn("internalid");

	var searchresults = nlapiSearchRecord('inventoryitem', null, filters, columns );

	for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
	{
		var internalId			= searchresults[i].getValue('internalid');	
		var recordInventoryItem	= nlapiLoadRecord('inventoryitem', internalId);
			
		for (var j = 1; j <= recordInventoryItem.getLineItemCount( 'locations'); j++)
		{
			var binnumber			= recordInventoryItem.getLineItemValue('binnumber', 'binnumber', 1);				
			
			var location 			= recordInventoryItem.getLineItemValue('locations', 'location', j);
			var quantityavailable 	= recordInventoryItem.getLineItemValue('locations', 'quantityavailable', j);
			var quantitybackordered = recordInventoryItem.getLineItemValue('locations', 'quantitybackordered', j);
				
			if (quantityavailable == null || quantityavailable == '')
				quantityavailable = 0;
			if (quantitybackordered == null || quantitybackordered == '')
				quantitybackordered = 0;
			
			if ( (parseFloat(quantityavailable) - parseFloat(quantitybackordered) > 0) && (in_array(location, sel_ubicaciones)) )
			{				
				var recordDetalle = nlapiCreateRecord('customrecord_3k_conteo_fisico_detalle');
				
				recordDetalle.setFieldValue('custrecord_3k_cfd_articulo', internalId);
				recordDetalle.setFieldValue('custrecord_3k_cfd_ubicacion', location);
				recordDetalle.setFieldValue('custrecord_3k_cfd_bin', binnumber);
				recordDetalle.setFieldValue('custrecord_3k_cfd_cantidad_original', parseFloat(quantityavailable));								
				recordDetalle.setFieldValue('custrecord_3k_cfd_relacion_cabecera', recId);
					
				nlapiSubmitRecord(recordDetalle, true);
				
				cant_detalle = cant_detalle + 1;					
			}				
		}				
	}
	
	if (cant_detalle == 0)
		alert ('No se pudieron generar registros de detalle, verifique los �tems/ubicaciones seleccionados y el stock disponible en el sistema.');
	else
		alert ('Se han generado ' + cant_detalle + ' registros de detalle.');
	
	var v_url				= nlapiResolveURL('RECORD', 'customrecord_3k_conteo_fisico_cabecera', recId, true);
	window.location.href 	= v_url;
	
	return true;
}

// (P14) - INVENTARIO FISICO: Eliminacion de inventario fisico
function imr_eliminar_inventario_fisico(){

	var cant_detalle	= 0;
	
	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();
	var record	= nlapiLoadRecord(recType, recId);
	
	var filters	= new Array();			
	filters[0] 	= new nlobjSearchFilter('custrecord_3k_cfd_relacion_cabecera', null, 'is', recId);		
		
	//var searchresults 	= nlapiSearchRecord('customrecord_3k_conteo_fisico_detalle', 'customsearch_3k_conteo_ciclico_cabecera', filters, null );
	var searchresults 	= nlapiSearchRecord('customrecord_3k_conteo_fisico_detalle', null, filters, null );
	
	if (searchresults == null || searchresults.length == 0)
		
		alert ('No se encontraron registros detalle a eliminar. Verifique y vuelva a intentar.');
		
	else {
	
		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];

			var recId_2 		= searchresult.getId();
			var recType_2 		= searchresult.getRecordType();
			
			nlapiDeleteRecord(recType_2, recId_2);
			
			cant_detalle = cant_detalle + 1;
		}
	}
	
	if (cant_detalle > 0)
		alert ('Se han eliminado ' + cant_detalle + ' registros de detalle.');
		
	var v_url				= nlapiResolveURL('RECORD', 'customrecord_3k_conteo_fisico_cabecera', recId, true);
	window.location.href 	= v_url;
	
	return true;
}

// (P14) - Inventario fisico
function imr_boton_impresion_inv_fisico_cabecera(type, form) {	
	
	if (type == 'view')
	{
		form.setScript('customscript_imr_enlace_to_pdf');
		form.addButton('custpage_imprimir_inv_fisico', 'Imprimir inventario fisico', "imr_imprimir_inv_fisico()");		
	}	
}

// (P14) - INVENTARIO FISICO
function imr_imprimir_inv_fisico(){

	var recId	= nlapiGetRecordId();
	
	if (recId != '')
	{
		var new_url = nlapiResolveURL('SUITELET', 'customscript_imr_inv_fisico', 'customdeploy_imr_suitelet_pdf_inv_fisico');	 
		window.open (new_url + "&custparam_inv_fisico=" + recId);
	}
}

// (P14) - INVENTARIO FISICO: Generacion de PDF
function imr_pdf_inventario_fisico(request, response) {	

	var strName = '';
	
	var filters	= new Array();	
	var columns	= new Array();	
	
	filters[0] 	= new nlobjSearchFilter('custrecord_3k_cfd_relacion_cabecera', null, 'is', request.getParameter('custparam_inv_fisico'));	
	
	columns[0]	= new nlobjSearchColumn("custrecord_3k_cfd_ubicacion");
	columns[1]	= new nlobjSearchColumn("custrecord_3k_cfd_bin");
	columns[2]	= new nlobjSearchColumn("custrecord_3k_cfd_articulo");
	columns[3]	= new nlobjSearchColumn("custrecord_3k_cfd_cantidad_original");
	columns[4]	= new nlobjSearchColumn("custrecord_3k_cfd_relacion_cabecera");	
	
	// recorro la b�squeda guardada la cual viene ordenada por: Location - Bin - Item
	var searchresults 	= nlapiSearchRecord('customrecord_3k_conteo_fisico_detalle', null, null, columns );
	
	for ( var i = 0; searchresults != null && i < searchresults.length ; i++ ) {
		strName += '<p>NRO. ETIQUETA: ' + (i+1) + '</p>';
		strName += '<p>LOCATION/BIN: ' + searchresults[i].getText('custrecord_3k_cfd_ubicacion') + ' / ' + searchresults[i].getText('custrecord_3k_cfd_bin') + '</p>';
		strName += '<p>ITEM: ' + searchresults[i].getText('custrecord_3k_cfd_articulo') + '</p>';
		strName += '<p>CANTIDAD CONTADA: __________________</p>';
		strName += '<p>Usuario Conteo: __________________</p>';
		strName += '<p>Fecha Conteo: __________________</p>';
		strName += "<barcode codetype=\"code128\" showtext=\"true\" value=\"123456789\"/>";		
	}
	
	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>\n<body font-size=\"10\">\n" + strName + "\n</body>\n</pdf>";
	var file = nlapiXMLToPDF( xml );
	response.setContentType('PDF','helloworld.pdf', 'inline');
	response.write( file.getValue() );
}

// (P10) - REQUISICIONES DE COMPRA: Boton Generar detalle Cotizacion de Proveedores
function imr_generar_detalle_cotizacion_prov(){

	var recId			= nlapiGetRecordId();
	var recType			= nlapiGetRecordType();
	var recCotizProv	= nlapiLoadRecord(recType, recId);	
	
	// verifico que no hayan l�neas de detalle cargadas
	var filters			= new Array();	
	filters[0] 			= new nlobjSearchFilter('custrecord_cot_det_pertenece_a', null, 'is', recId);	
	
	var searchresults 	= nlapiSearchRecord('customrecord_cot_proveedor_detalle', null, filters, null );
	if (searchresults != null && searchresults.length > 0){
	
		alert ('Ya se encuentran l�neas de detalle cargadas. Verifique y vuelva a intenntar.');
		return false;
	}
	/* fin de la verificacion */
	
	var ocAsociada 	= nlapiGetFieldValue('custrecord_cot_cab_pertenece_a');
	if (ocAsociada == null || ocAsociada == '')
		alert ('No es posible generar el detalle a�n. Verifique y vuelva a intentar');
	else {
		var recordOc	= nlapiLoadRecord('purchaseorder', ocAsociada);
		
		var cant_detalle 			= 0;
		var importe_total_cotizado 	= 0;
		
		for (var i = 1; i <= recordOc.getLineItemCount('item'); i++){
				
			// leo detalle de la OC
			var item		= recordOc.getLineItemValue('item', 'item', i);				
			var quantity	= recordOc.getLineItemValue('item', 'quantity', i);	
			var rate		= recordOc.getLineItemValue('item', 'rate', i);			
			
			// inserto el detalle de la OC en la estructura detalle para la cotizacion de proveedor
			var detalleCotizProv = nlapiCreateRecord('customrecord_cot_proveedor_detalle');
			detalleCotizProv.setFieldValue('custrecord_cot_det_pertenece_a', recId);
			detalleCotizProv.setFieldValue('custrecord_cot_det_item', item);
			detalleCotizProv.setFieldValue('custrecord_cot_det_cantidad', quantity);
			detalleCotizProv.setFieldValue('custrecord_cot_det_precio_unitario', rate);
			
			nlapiSubmitRecord(detalleCotizProv, true);
			
			cant_detalle 			= cant_detalle + 1;
			importe_total_cotizado	= importe_total_cotizado + parseFloat(quantity)*parseFloat(rate);
		}
		
		if (cant_detalle == 0)
			alert ('No se pudieron generar registros de detalle, verifique los datos ingresados.');
		else{
		
			recCotizProv.setFieldValue('custrecord_cot_cab_importe_total', importe_total_cotizado);
			nlapiSubmitRecord(recCotizProv, true);
		
			alert ('Se han generado ' + cant_detalle + ' registros de detalle.');
		}
		
		var v_url				= nlapiResolveURL('RECORD', 'customrecord_oc_cot_prov_cabecera', recId, true);
		window.location.href 	= v_url;
		
		return true;
	}	
}

// (P10) - Libs: defino la funci�n para que al generar la Cotizaci�n desde la OC, se quede en la Cotizacion generada y no me vuelva a la OC
function imr_redireccionar_cotizacion(type){

	if (type == 'create' || type == 'edit'){
	
		var cotizacionProveedorId = 	nlapiGetRecordId();
		nlapiSetRedirectURL('RECORD', 'customrecord_oc_cot_prov_cabecera', cotizacionProveedorId, true);
	}
}

// (P10) - Libs - funci�n que verifica si ya hay otra cotizacion asociada a la misma OC
function validar_cotiz_asociada_unica(oc){

	var filters	= new Array();			
	filters[0] 	= new nlobjSearchFilter('custrecord_cot_cab_pertenece_a', null, 'is', oc);		
	filters[1] 	= new nlobjSearchFilter('custrecord_cot_cab_etapa', null, 'is', 3); // en estado Aprobado
					
	var searchresults	= nlapiSearchRecord('customrecord_oc_cot_prov_cabecera', null, filters, null );
	
	if (searchresults == null || searchresults.length == 0 || searchresults.length == 1) // ya que no hay que considerarse a si mismo
		return 0;
	else
		return searchresults.length;
}


// (P10) - REQUISICIONES DE COMPRA - Boton Generar OC
function imr_generar_oc_asociada(){
	
	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();
	var record	= nlapiLoadRecord(recType, recId);
	
	if (nlapiGetFieldText('custrecord_cot_cab_etapa') == 'Aprobada'){
	
		var ocAsociada 	= nlapiGetFieldValue('custrecord_cot_cab_pertenece_a');		
		
		// valido que no haya otra cotizaci�n asociada a la misma OC que tenga la etapa aprobada
		if (validar_cotiz_asociada_unica(ocAsociada) == 0) {
		
			if (nlapiGetFieldValue('custrecord_cot_cab_oc_generada') == null || nlapiGetFieldValue('custrecord_cot_cab_oc_generada') == ''){
		
				// cargo la OC para la OC asociada
				//var recordOcAsociada	= nlapiLoadRecord('purchaseorder', ocAsociada);		

				// genero la nueva OC
				var newOc	= nlapiCreateRecord('purchaseorder');				
				
				// detalle de la OC		
				var columns	= new Array();			
				var filters	= new Array();			
				columns[0]	= new nlobjSearchColumn("custrecord_cot_det_item");
				columns[1]	= new nlobjSearchColumn("custrecord_cot_det_cantidad");
				columns[2]	= new nlobjSearchColumn("custrecord_cot_det_precio_unitario");
				filters[0] 	= new nlobjSearchFilter('custrecord_cot_det_pertenece_a', null, 'is', recId);		
				filters[1] 	= new nlobjSearchFilter('custrecord_cot_det_estado', null, 'is', 2); // Estado = Aprobado		
					
				var searchresults_1 	= nlapiSearchRecord('customrecord_cot_proveedor_detalle', null, filters, columns );
				
				for ( var i = 0; searchresults_1 != null && i < searchresults_1.length ; i++ ){				
					newOc.setLineItemValue('item', 'item', i+1, searchresults_1[i].getValue('custrecord_cot_det_item'));
					newOc.setLineItemValue('item', 'quantity', i+1, searchresults_1[i].getValue('custrecord_cot_det_cantidad'));
					newOc.setLineItemValue('item', 'rate', i+1, searchresults_1[i].getValue('custrecord_cot_det_precio_unitario'));
				}
				
				// si tiene lineas cargadas la cotizacion en estado APROBADA
				if (searchresults_1 != null && searchresults_1.length > 0){					
					
					// cabecera de la OC
					newOc.setFieldValue('createdFrom', ocAsociada + '/' + recId);
					newOc.setFieldValue('entity', nlapiGetFieldValue('custrecord_cot_cab_proveedor'));
					newOc.setFieldValue('custbody_fecha_prometida', nlapiGetFieldValue('custrecord_cot_cab_fecha_disponibilidad'));
					newOc.setFieldValue('memo', nlapiGetFieldValue('custrecord_cot_cab_condicion_comercial'));
					
					var id = nlapiSubmitRecord(newOc, true);
					
					record.setFieldValue('custrecord_cot_cab_oc_generada', id);
					nlapiSubmitRecord(record, true);
				}
				
				else
					alert ('La cotizaci�n de Proveedor no tiene cargada l�neas detalle en estado Aprobada. Verifique y vuelva a intentar.');				
				
				var v_url				= nlapiResolveURL('RECORD', 'customrecord_oc_cot_prov_cabecera', recId);
				window.location.href 	= v_url;
				
				return true;
			}
			else
				alert ('Ya fue generada una Orden de compra desde esta cotizaci�n. Verifique y vuelva a intentar.');
		}
		else
			alert ('Existe otra cotizaci�n Aprobada asociada a la misma OC. Verifique y vuelva a intentar.');
	}	
	else
		alert ('Es necesario que la Etapa se encuentre Aprobada para poder realizar esta acci�n. Verifique y vuelva a intentar.');
}

// (P20) (P22) - Ajustes grupo de art�culos - evento del cliente: save
function imr_save_grupo_articulo(){
	
	if ( (nlapiGetFieldValue('custitem_3k_item_ajuste_precio') == null || nlapiGetFieldValue('custitem_3k_item_ajuste_precio') == '') && (nlapiGetFieldValue('custitem_3k_item_ajuste_ventas') == null || nlapiGetFieldValue('custitem_3k_item_ajuste_ventas') == '') )
		
		return true;
	
	else{
		
		var articulo_compra_ajuste_precio 	= nlapiGetFieldValue('custitem_3k_item_ajuste_precio');
		var articulo_venta_ajuste_precio 	= nlapiGetFieldValue('custitem_3k_item_ajuste_ventas');
		var ocurrencias_compra	= 0;
		var ocurrencias_venta	= 0;
			
		for ( var i = 1; i <= nlapiGetLineItemCount('member'); i++)
		{
			if (nlapiGetLineItemValue('member', 'item', i) == articulo_compra_ajuste_precio)
				ocurrencias_compra += 1;
			if (nlapiGetLineItemValue('member', 'item', i) == articulo_venta_ajuste_precio)
				ocurrencias_venta += 1;	
		}
			
		if (ocurrencias_compra == 0){
			alert ('El articulo de ajuste de precio para compras no se encuentra actualmente ingresado como miembro. Verifique y vuelva a intentar.');
			return false;
		}
		if (ocurrencias_venta == 0){
			alert ('El articulo de ajuste de precio para ventas no se encuentra actualmente ingresado como miembro. Verifique y vuelva a intentar.');
			return false;
		}
		
		return true;
	}
}

// (P20) - AJUSTES GRUPO DE ARTICULOS: Boton Calcular Tasa Grupo (COMPRAS)
function imr_verificar_item_grupo(){
	
	var i 												= 1;
	var cant_items_grupo_encontrados 					= 0;	
	var cant_items_grupo_encontrados_con_item_ajuste 	= 0;	
	var item_ajuste_cantidad							= 0;
	var nuevo_precio_unitario							= 0;
	
	var pos_item_ajuste; var itemGrupo; var itemGrupoItemAjuste; var importe_total_item_grupo;
	
	while (i <= nlapiGetLineItemCount('item')){
		
		// encontramos un grupo
		if (nlapiGetLineItemValue('item', 'itemtype', i) == 'Group'){
		
			cant_items_grupo_encontrados++;
			
			// datos del item grupo: precio | item de ajuste
			itemGrupo				= nlapiGetLineItemValue('item', 'item', i);
			cantItemGrupo			= nlapiGetLineItemValue('item', 'quantity', i);
						
			precioUnitarioItemGrupo	= nlapiGetLineItemValue('item', 'custcol_3k_precio_unitario_grupo', i);
			precioTotalItemGrupo	= parseFloat(precioUnitarioItemGrupo) * parseFloat(cantItemGrupo);
			
			recItemGrupo			= nlapiLoadRecord('itemgroup', itemGrupo);
			itemGrupoItemAjuste		= recItemGrupo.getFieldValue('custitem_3k_item_ajuste_precio');
			
			if (precioUnitarioItemGrupo == null || precioUnitarioItemGrupo == '')
				precioUnitarioItemGrupo = 0;
				
			nlapiSetLineItemValue('item', 'custcol_3k_precio_unitario_grupo', i, precioUnitarioItemGrupo);
			nlapiSetLineItemValue('item', 'custcol_3k_item_ajuste_revisado', i, 'T');
			
			if (itemGrupoItemAjuste != null && itemGrupoItemAjuste != '')
				cant_items_grupo_encontrados_con_item_ajuste++;
			
			importe_total_item_grupo 	= 0;
			pos_item_ajuste				= null;			
			
			while (nlapiGetLineItemValue('item', 'itemtype', i) != 'EndGroup' && (i <= nlapiGetLineItemCount('item'))){
			
				i++;
				item = nlapiGetLineItemValue('item', 'item', i);
				
				// le pongo el valor blanco a las columnas componentes del item grupo
				nlapiSetLineItemValue('item', 'custcol_3k_precio_unitario_grupo', i, '');
				
				if (itemGrupoItemAjuste == item)
					pos_item_ajuste = i;				
				
				// en caso que sea EndGroup o el item de ajuste, no lo tomo para los calculos
				if (item != 0 && itemGrupoItemAjuste != item){
				
					if (nlapiGetLineItemValue('item', 'amount', i) != null && nlapiGetLineItemValue('item', 'amount', i) != '')
						importe_total_item_grupo += parseFloat(nlapiGetLineItemValue('item', 'amount', i));
				}
			}
			
			if (pos_item_ajuste != null && pos_item_ajuste != ''){
			
				item_ajuste_cantidad	= nlapiGetLineItemValue('item', 'quantity', pos_item_ajuste);				
				
				nuevo_precio_unitario 	= (parseFloat(precioTotalItemGrupo) - parseFloat(importe_total_item_grupo)) / parseFloat(item_ajuste_cantidad);
				
				nlapiSelectLineItem('item', pos_item_ajuste);
				nlapiSetCurrentLineItemValue('item', 'rate', nuevo_precio_unitario);
				nlapiCommitLineItem('item', pos_item_ajuste);
				// fin del algoritmo para el cambio del precio del item de ajuste
			}			
		}
		
		i++;
	}
	
	if (cant_items_grupo_encontrados == 0)
		alert ('No se encontro ning�n item grupo cargado. Verifique y vuelva a intentar.');
	else if (cant_items_grupo_encontrados_con_item_ajuste == 0)
		alert ('Todos los items grupo ingresados, no cuentan con item de ajuste en su parametrizaci�n. Verifique y vuelva a intentar.');
	else alert ('El proceso se realizo exitosamente.');
}

// (P20) (P22) - Ajustes grupo de Articulos: Cambio el procesado a false en caso de que el usuario cambio el precio a un item grupo
function imr_cambiar_revisado_item_grupo(type, name, linenum){
	
	if (type == 'item' && name == 'custcol_3k_precio_unitario_grupo'){
	
		nlapiSetCurrentLineItemValue('item', 'custcol_3k_item_ajuste_revisado', 'F', false);
	}	
}

// (P20) - AJUSTE GRUPO DE ARTICULOS: Field Changed: Setear precio de item grupo en compras
function imr_setear_precio_item_grupo_compras(type, name, linenum){

	if (type == 'item' && name == 'item'){
	
		var item = nlapiGetCurrentLineItemValue('item', 'item');
		
		try{
		
			var itemGrupoItemAjuste	= nlapiLoadRecord('itemgroup', item);
			var precio_item_grupo	= itemGrupoItemAjuste.getFieldValue('custitemcosto_compra_item_grupo');
			nlapiSetCurrentLineItemValue('item', 'custcol_3k_precio_unitario_grupo', precio_item_grupo, false);
		}
		catch(e){
			
			nlapiSetCurrentLineItemValue('item', 'custcol_3k_precio_unitario_grupo', '', false);			
		}		
	}	
}

// (P22) - MANEJO DE LOTE Y PRECIO VENTA: Field Changed: Setear precio de item grupo en ventas
function imr_setear_precio_item_grupo_ventas(type, name, linenum){

	if (type == 'item' && name == 'item'){
	
		var item = nlapiGetCurrentLineItemValue('item', 'item');
		
		try{		
			var itemGrupoItemAjuste	= nlapiLoadRecord('itemgroup', item);
			
			var precio_item_grupo		= itemGrupoItemAjuste.getFieldValue('custitem_3k_item_grupo_prec_venta');
			var precioTotalItemGrupo	= itemGrupoItemAjuste.getFieldValue('custitem_3k_item_grupo_prec_venta');
			
			// en caso de tener seleccionado un cliente, obtengo su descuento general
			var entity			= nlapiGetFieldValue('entity');
			if (entity != null && entity != ''){
			
				var recCustomer	 	= nlapiLoadRecord('customer', entity);
				var descuentoId		= recCustomer.getFieldValue('pricelevel');
				
				if (descuentoId != null & descuentoId != ''){
				
					var recPriceLevel		= nlapiLoadRecord('pricelevel', descuentoId);
					descuento_gral_cliente	= recPriceLevel.getFieldValue('discountpct');		
					descuento_gral_cliente 	= descuento_gral_cliente.substr(0, descuento_gral_cliente.length-1);	
				}
			}
			
			// en caso de tener descuento
			if (descuento_gral_cliente != null && descuento_gral_cliente != '' && descuento_gral_cliente != 0){
				
				descuentoTotalItemGrupo	= (precio_item_grupo * descuento_gral_cliente) / 100;
				precioTotalItemGrupo	= precio_item_grupo + descuentoTotalItemGrupo;
			}			
			
			nlapiSetCurrentLineItemValue('item', 'custcol_3k_precio_unitario_grupo', precioTotalItemGrupo, false);
		}
		catch(e){
			
			nlapiSetCurrentLineItemValue('item', 'custcol_3k_precio_unitario_grupo', '', false);			
		}		
	}
	
}

// (P20) (P22) - Validar Save (Script Cliente)
function imr_validar_item_grupo_en_trans(){
	
	var i = 1;
	
	while (i <= nlapiGetLineItemCount('item')){
		
		// encontramos un grupo
		if (nlapiGetLineItemValue('item', 'itemtype', i) == 'Group'){
			
			if (nlapiGetLineItemValue('item', 'custcol_3k_item_ajuste_revisado', i) == 'F' || nlapiGetLineItemValue('item', 'custcol_3k_item_ajuste_revisado', i) == ''){
			
				alert ('Algunos items grupos no fueron procesados. Por favor Calcule la Tasa Grupo nuevamente.');
				return false;
			}
		}
		
		i++;
		
	}
	
	return true;
}

// (P22) - MANEJO DE LOTE Y PRECIO VENTA EN ITEMS GRUPO (VENTAS)
function imr_tasa_grupo_ventas(){

	var i 												= 1;
	var cant_items_grupo_encontrados 					= 0;	
	var cant_items_grupo_encontrados_con_item_ajuste 	= 0;	
	var item_ajuste_cantidad							= 0;
	var nuevo_precio_unitario							= 0;
	var descuento_gral_cliente;
	
	var pos_item_ajuste; var itemGrupo; var itemGrupoItemAjuste; var importe_total_item_grupo;
	
	while (i <= nlapiGetLineItemCount('item')){
		
		// encontramos un grupo
		if (nlapiGetLineItemValue('item', 'itemtype', i) == 'Group'){
		
			var descuentoTotalItemGrupo = 0;
			cant_items_grupo_encontrados++;			
			
			// datos del item grupo: precio | item de ajuste
			itemGrupo				= nlapiGetLineItemValue('item', 'item', i);
			cantItemGrupo			= nlapiGetLineItemValue('item', 'quantity', i);
						
			precioUnitarioItemGrupo	= nlapiGetLineItemValue('item', 'custcol_3k_precio_unitario_grupo', i);
			precioTotalItemGrupo	= parseFloat(precioUnitarioItemGrupo) * parseFloat(cantItemGrupo);
			
			recItemGrupo			= nlapiLoadRecord('itemgroup', itemGrupo);
			itemGrupoItemAjuste		= recItemGrupo.getFieldValue('custitem_3k_item_ajuste_ventas');
			itemGrupoImpuestoVenta	= recItemGrupo.getFieldValue('custitem_impuesto_venta');
			
			if (precioUnitarioItemGrupo == null || precioUnitarioItemGrupo == '')
				precioUnitarioItemGrupo = 0;
			
			nlapiSetLineItemValue('item', 'custcol_3k_precio_unitario_grupo', i, precioUnitarioItemGrupo);
			nlapiSetLineItemValue('item', 'custcol_3k_item_ajuste_revisado', i, 'T');			
			
			if (itemGrupoItemAjuste != null && itemGrupoItemAjuste != '')
				cant_items_grupo_encontrados_con_item_ajuste++;
			
			var indices_miembro_grupo	= [];
			importe_total_item_grupo 	= 0;
			pos_item_ajuste				= null;
			
			while (nlapiGetLineItemValue('item', 'itemtype', i) != 'EndGroup' && (i <= nlapiGetLineItemCount('item'))){
			
				i++;
				item = nlapiGetLineItemValue('item', 'item', i);
				
				// le pongo el valor blanco a las columnas componentes del item grupo
				nlapiSetLineItemValue('item', 'custcol_3k_precio_unitario_grupo', i, '');
				
				if (itemGrupoItemAjuste == item)
					pos_item_ajuste = i;
				
				// en caso que sea EndGroup o el item de ajuste, no lo tomo para los calculos
				if (item != 0 && itemGrupoItemAjuste != item){
				
					if (nlapiGetLineItemValue('item', 'amount', i) != null && nlapiGetLineItemValue('item', 'amount', i) != '')
						importe_total_item_grupo += parseFloat(nlapiGetLineItemValue('item', 'amount', i));
				}
				
				// si es un miembro de grupo, agrego la posicion al arreglo de posiciones de los miembros
				if (item != 0 && (nlapiGetLineItemValue('item', 'taxcode', i) != itemGrupoImpuestoVenta))
					indices_miembro_grupo.push(i);					
				
			}						
			
			// seteo el item ajuste
			if (pos_item_ajuste != null && pos_item_ajuste != ''){			
		
				item_ajuste_cantidad	= nlapiGetLineItemValue('item', 'quantity', pos_item_ajuste);				
				
				nuevo_precio_unitario 	= (parseFloat(precioTotalItemGrupo) - parseFloat(importe_total_item_grupo)) / parseFloat(item_ajuste_cantidad);
				
				nlapiSelectLineItem('item', pos_item_ajuste);
				nlapiSetCurrentLineItemValue('item', 'rate', nuevo_precio_unitario);
				nlapiCommitLineItem('item', pos_item_ajuste);
				// fin del algoritmo para el cambio del precio del item de ajuste
			}

			// seteo los impuestos a todos los miembros del grupo
			if (itemGrupoImpuestoVenta != null && itemGrupoImpuestoVenta != '' && indices_miembro_grupo.toString() != ''){
				
				for (var k = 0; k <= indices_miembro_grupo.length; k++){
					
					nlapiSelectLineItem('item', indices_miembro_grupo[k]);
					nlapiSetCurrentLineItemValue('item', 'taxcode', parseInt(itemGrupoImpuestoVenta));
					nlapiCommitLineItem('item', indices_miembro_grupo[k]);					
				}			
			}
		}
		
		i++;
	}
	
	if (cant_items_grupo_encontrados == 0)
		alert ('No se encontro ning�n item grupo cargado. Verifique y vuelva a intentar.');
	else if (cant_items_grupo_encontrados_con_item_ajuste == 0)
		alert ('Todos los items grupo ingresados, no cuentan con item de ajuste en su parametrizaci�n. Verifique y vuelva a intentar.');
	else alert ('El proceso se realizo exitosamente.');
}

// (P24) - USO DE AGRUPADORES EN PROMOCION: Boton Cargar Articulos
function imr_promocion_agregar_articulos(){
	
	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();
	
	var lineas_permitidas 		= nlapiGetFieldValue('custrecord_3k_filtro_linea_articulo');
	var sublineas_permitidas 	= nlapiGetFieldValue('custrecord_3k_sublinea_articulo');
	
	if (lineas_permitidas == null || lineas_permitidas == '' || sublineas_permitidas == null || sublineas_permitidas == '')
				
		alert ('Debe seleccionar los filtros correspondientes a l�nea/subl�nea de art�culos.');
	
	else{
		// No se creo la cabecera, proceso en el cliente
		if (recId == null || recId == ''){
			
			if (confirm('Atencion: Como el registro es nuevo y todav�a no ha sido guardado, el proceso puede demorarse un tiempo prolongado dependiendo de la cantidad de items a cargar. Lo ideal ser�a que primero guarde el registro y posteriormente actualice los art�culos masivamente." Confirma la ejecuci�n del proceso?')){

				// elimino los items que tiene cargado actualmente
				for (var i = 1; i <= nlapiGetLineItemCount('items'); i++){
						
					nlapiRemoveLineItem('items','1');
				}
					
				// ingreso los nuevos items, teniendo en cuenta la seleccion de linea y sublinea que este definida en el filtro		
				var cant_item_ingresados	= 0;
					
				var filters	= new Array();		
				var columns	= new Array();		
						
				columns[0]	= new nlobjSearchColumn("internalid");
									
				filters[0] 	= new nlobjSearchFilter('custitem_linea', null, 'anyof', lineas_permitidas);
				filters[1] 	= new nlobjSearchFilter('custitem_sublinea', null, 'anyof', sublineas_permitidas);
										
				var searchresults 	= nlapiSearchRecord('inventoryitem', null, filters, columns );
									
				for ( var j = 0; searchresults != null && j < searchresults.length ; j++ ){	
							
					cant_item_ingresados++;
						
					nlapiSelectNewLineItem('items');
					nlapiSetCurrentLineItemValue('items', 'item', searchresults[j].getValue('internalid'));
					nlapiCommitLineItem('items');
				}
					
				nlapiSetFieldValue('custrecord_3k_total_items_promocion', cant_item_ingresados);
									
				alert ('Se generaron ' + cant_item_ingresados + ' items exitosamente.');
			}
		}
		
		// la cabecera esta creada, proceso en el servidor
		else{
		
			var record	= nlapiLoadRecord(recType, recId);	
			
			// elimino los items que tiene cargado actualmente
			for (var i = 1; i <= nlapiGetLineItemCount('items'); i++){
						
				record.removeLineItem('items','1');
			}
					
			// ingreso los nuevos items, teniendo en cuenta la seleccion de linea y sublinea que este definida en el filtro		
			var cant_item_ingresados	= 0;
					
			var filters	= new Array();		
			var columns	= new Array();		
						
			columns[0]	= new nlobjSearchColumn("internalid");
									
			filters[0] 	= new nlobjSearchFilter('custitem_linea', null, 'anyof', lineas_permitidas);
			filters[1] 	= new nlobjSearchFilter('custitem_sublinea', null, 'anyof', sublineas_permitidas);
										
			var searchresults 	= nlapiSearchRecord('inventoryitem', null, filters, columns );
									
			for ( var j = 0; searchresults != null && j < searchresults.length ; j++ ){	
							
				cant_item_ingresados++;
				record.setLineItemValue('items', 'item', j+1, searchresults[j].getValue('internalid'));
			}
					
			record.setFieldValue('custrecord_3k_total_items_promocion', cant_item_ingresados);			
									
			alert ('Se generaron ' + cant_item_ingresados + ' items exitosamente.');		
			
			nlapiSubmitRecord(record, true);
						
			var v_url				= nlapiResolveURL('RECORD', 'promotioncode', recId, true);
			window.location.href 	= v_url;
						
			return true;				
		}
	}
}

// (P21) - RESERVA DE STOCK: Agregar suitelet al tab Stock reservado
function imrStockReservadoBeforeLoadTab(type, form){

	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();

	var currentContext 	= nlapiGetContext(); 
	var currentUserID 	= currentContext.getUser();	
	
	if (recId != '' && recId != null){	
	
		if( (currentContext.getExecutionContext() == 'userinterface') && (type == 'edit' | type == 'create' | type == 'view')){
		
			var SampleTab = form.addTab('custpage_sample_tab', 'Stock reservado');		
			
			var signatureRequestSublist = form.addSubList('custpage_sig_req_sublist', 'list', 'Document Signature Requests','custpage_sample_tab');
			signatureRequestSublist.setDisplayType('normal');		
			
			signatureRequestSublist.addField('custpage_req_articulo', 'text', 'Articulo');
			signatureRequestSublist.addField('custpage_req_ubicacion', 'text', 'Ubicacion');	
			signatureRequestSublist.addField('custpage_req_deposito', 'text', 'Deposito');
			signatureRequestSublist.addField('custpage_req_lote', 'text', 'Lote');
			signatureRequestSublist.addField('custpage_req_cantidad_reservada', 'text', 'Cantidad reservada');
			
			var columns = new Array();		
			columns[0] = new nlobjSearchColumn('custrecord_3k_stock_det_articulo');
			columns[1] = new nlobjSearchColumn('custrecord_3k_stock_det_location');
			columns[2] = new nlobjSearchColumn('custrecord_3k_stock_det_deposito');
			columns[3] = new nlobjSearchColumn('custrecord_3k_stock_det_lote');
			columns[4] = new nlobjSearchColumn('custrecord_3k_stock_det_cantidad');
			
			var filters = new Array();		

			filters[0] 	= new nlobjSearchFilter('custrecord_3k_stock_det_ov', null, 'is', recId); 				
			
			var searchResults = nlapiSearchRecord('customrecord_3k_stock_det', null, filters, columns);	
			
			for ( var i = 0; searchResults != null && i < searchResults.length ; i++ )
			{
				
				signatureRequestSublist.setLineItemValue('custpage_req_articulo', i+1, searchResults[i].getText('custrecord_3k_stock_det_articulo'));
				signatureRequestSublist.setLineItemValue('custpage_req_ubicacion', i+1, searchResults[i].getText('custrecord_3k_stock_det_location'));
				signatureRequestSublist.setLineItemValue('custpage_req_deposito', i+1, searchResults[i].getText('custrecord_3k_stock_det_deposito'));
				signatureRequestSublist.setLineItemValue('custpage_req_lote', i+1, searchResults[i].getText('custrecord_3k_stock_det_lote'));
				signatureRequestSublist.setLineItemValue('custpage_req_cantidad_reservada', i+1, searchResults[i].getValue('custrecord_3k_stock_det_cantidad'));		
			}		
		}
	}
}

// (P21) - RESERVA DE STOCK: Funcion auxiliar que retorna el stock disponible para un item en una ubicacion en especial
function stock_disponible (item, ubicacion) {

	recordItem	= nlapiLoadRecord ('inventoryitem', item);
      
    var i = 1;
    while (i <= recordItem.getLineItemCount( 'locations')){
        
		var location 		 	= recordItem.getLineItemValue('locations', 'location', i);
		var quantityavailable 	= recordItem.getLineItemValue('locations', 'quantityavailable', i);
		var quantitybackordered = recordItem.getLineItemValue('locations', 'quantitybackordered', i); 
  
		if (quantityavailable == null || quantityavailable == '')
			quantityavailable = 0;
		if (quantitybackordered == null || quantitybackordered == '')
			quantitybackordered = 0; 
                   
        if (location == ubicacion){
                      
            if ( (parseFloat(quantityavailable) - parseFloat(quantitybackordered) > 0) )
                return parseFloat(quantityavailable) - parseFloat(quantitybackordered);
        } 
        
		i++;
                    
    }
	
	return 0.00;
}

// (P21) - RESERVA DE STOCK: Libs: Funcion auxiliar para saber si tiene o no ya generada una reserva de stock
function tiene_reserva_stock(recId){
	
	var filters	= new Array();			
	filters[0] 	= new nlobjSearchFilter('custrecord_3k_stock_det_ov', null, 'is', recId);		
						
	var searchresults	= nlapiSearchRecord('customrecord_3k_stock_det', null, filters, null );
	
	if (searchresults == null || searchresults.length == 0)
		return false;
	else 
		return true;
}

// (P21) - RESERVA DE STOCK: Boton 'Reservar stock'
function imr_reserva_stock_boton(){
	
	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();
	var record	= nlapiLoadRecord(recType, recId);
	
	var itemReservados 	= 0;
	var itemEncontrados = 0;
	var quantity		= 0;
	var stockReservado	= 0;
	
	var item;
	
	var ubicacion	= nlapiGetFieldValue('location');
	
	if (tiene_reserva_stock(recId))
		alert ('Ya fue generada la reserva de stock para esta Orden. Verifique y vuelva a intentar.');
	else
		if (ubicacion == null || ubicacion == '')
			alert ('Por favor seleccione una ubicaci�n desde la cabecera de la Orden de Venta.');
		else{
		
			if (confirm('El proceso de reserva de stock puede demorar unos segundos, desea continuar ?')){
						
				var i	= 1;
				// recorremos los items de la ov
				while (i <= nlapiGetLineItemCount('item')){
							
					if (nlapiGetLineItemValue('item', 'itemtype', i) == 'InvtPart'){
					
						itemEncontrados++;
						
						item			= nlapiGetLineItemValue('item', 'item', i);
						quantity		= nlapiGetLineItemValue('item', 'quantity', i);					
						
						// me voy guardando el stock que falta reservar
						stockReservado	= quantity;
						
						recordItem		= nlapiLoadRecord ('inventoryitem', item);				
						
						// si hay stock disponible					
						if (stock_disponible(item, ubicacion) > 0){
						
							var j = 1;
							
							while (j <= recordItem.getLineItemCount('binnumber') && parseFloat(stockReservado) > 0){											
								
								binnumber 		= recordItem.getLineItemValue('binnumber', 'binnumber', j);
								onHand 			= recordItem.getLineItemValue('binnumber', 'onhand', j);	
								binLocation		= recordItem.getLineItemValue('binnumber', 'location', j);	
								onHandAvailable	= recordItem.getLineItemValue('binnumber', 'onhandavail', j);	
								preferredBin	= recordItem.getLineItemValue('binnumber', 'preferredbin', j);	
								
								// *** obtengo el stock reservado para el item y bin y que tenga una ov relacionada
								var stockReservadoTotal	= 0;
								
								var filters = new Array();		
								var columns = new Array();		

								filters[0] 	= new nlobjSearchFilter('custrecord_3k_stock_det_articulo', null, 'is', item); 		
								filters[1] 	= new nlobjSearchFilter('custrecord_3k_stock_det_deposito', null, 'is', binnumber);							
								columns[0]	= new nlobjSearchColumn("custrecord_3k_stock_det_cantidad");

								var searchResults = nlapiSearchRecord('customrecord_3k_stock_det', null, filters, columns);	
				
								for ( var k = 0; searchResults != null && k < searchResults.length ; k++ )
								{
									
									stockReservadoTotal	= stockReservadoTotal + parseFloat(searchResults[k].getValue('custrecord_3k_stock_det_cantidad'));								
								}						
								
								// *** fin del metodo para ver el stock que hay en reserva
								
								if (parseFloat(stockReservado) >= parseFloat(onHand))
									stockAReservar = parseFloat(onHand);
								else
									stockAReservar = parseFloat(stockReservado);						
								
								if (parseFloat(onHand) > 0 && parseFloat(stockReservado) > 0 && parseFloat(onHand)-stockReservadoTotal > 0 ){								
									
									var recordNew	= nlapiCreateRecord('customrecord_3k_stock_det');
									
									recordNew.setFieldValue('custrecord_3k_stock_det_ov', recId);
									recordNew.setFieldValue('custrecord_3k_stock_det_articulo', item);
									recordNew.setFieldValue('custrecord_3k_stock_det_location', ubicacion);
									recordNew.setFieldValue('custrecord_3k_stock_det_deposito', binnumber);
									//recordNew.setFieldValue('custrecord_3k_stock_det_lote', yyy);
									recordNew.setFieldValue('custrecord_3k_stock_det_cantidad', stockAReservar);
									
									nlapiSubmitRecord(recordNew, false, true);
									itemReservados++;								

									stockReservado = parseFloat(stockReservado) - parseFloat(stockAReservar);							
								}
								
								j++;
							}					
						}						
					}
				
				i++;
				
				}
				
				if (itemReservados > 0){
					
					if (itemEncontrados == itemReservados){
					
						alert ('Se realizo la reserva de ' + itemReservados + ' items de forma exitosa.');
					}
					
					else{
		
						alert ('Se realizo la reserva de ' + itemReservados + ' items de forma exitosa. No se pudo realizar la reserva de algunos items.');	
					}
					
					var v_url				= nlapiResolveURL('RECORD', 'salesorder', recId, true);
					window.location.href 	= v_url;
										
					return true;
				}
				
				else 
					alert ('No fue posible generar la reserva de stock. Verifique y vuelva a intentar.');
				
			}		
		}
}

// (P21) - RESERVA DE STOCK:  Boton 'liberar stock'
function imr_liberar_stock_boton(){
	
	var itemEliminados = 0;
	
	var recId	= nlapiGetRecordId();
	
	// elimino registro asociado, de estructura auxiliar de cheques
	var filters	= new Array();			
	filters[0] 	= new nlobjSearchFilter('custrecord_3k_stock_det_ov', null, 'is', recId);		
						
	var searchresults	= nlapiSearchRecord('customrecord_3k_stock_det', null, filters, null );
		
	for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
	{
		var searchresult 	= searchresults[i];
		var recId_2 		= searchresult.getId();
		var recType_2 		= searchresult.getRecordType();
			
		nlapiDeleteRecord(recType_2, recId_2);	
		itemEliminados++;
	}
	
	if (itemEliminados > 0){
	
			alert ('La reserva de stock fue liberada, fueron eliminados ' + itemEliminados + ' items de forma exitosa.');
			
			var v_url				= nlapiResolveURL('RECORD', 'salesorder', recId, true);
			window.location.href 	= v_url;
							
			return true;
	}
	else
		alert ('No es posible liberar el stock, debido a que la orden no posee stock reservado asociado. Verifique y vuelva a intentar.');
}

// (P21) - RESERVA DE STOCK: boton 'Cargar stock reservado' (Envio)
function imr_cargar_stock_reservado(){
	
	var ov			= nlapiGetFieldValue('createdfrom');
	var stringTmp	= '';
	var itemCargado	= 0;
	var quantity	= 0;
	
	var item;
	
	var i = 1;
	// recorremos los items de la ov
	while (i <= nlapiGetLineItemCount('item')){
						
		if (nlapiGetLineItemValue('item', 'itemtype', i) == 'InvtPart'){
		
			stringTmp	= '';
			item 		= nlapiGetLineItemValue('item', 'item', i);
			quantity	= nlapiGetLineItemValue('item', 'quantity', i);
			
			// busco la data para ese item
			// traigo los valores de la estructura. Traigo: ubicaci�n / deposito / lote y cantidad que tiene reservada
			var filters	= new Array();			
			var columns	= new Array();
			
			filters[0] 	= new nlobjSearchFilter('custrecord_3k_stock_det_ov', null, 'is', ov);	
			filters[1] 	= new nlobjSearchFilter('custrecord_3k_stock_det_articulo', null, 'is', item);
			
			columns[0]	= new nlobjSearchColumn("custrecord_3k_stock_det_articulo");
			columns[1]	= new nlobjSearchColumn("custrecord_3k_stock_det_location");
			columns[2]	= new nlobjSearchColumn("custrecord_3k_stock_det_deposito");
			columns[3]	= new nlobjSearchColumn("custrecord_3k_stock_det_lote");
			columns[4]	= new nlobjSearchColumn("custrecord_3k_stock_det_cantidad");
								
			var searchresults	= nlapiSearchRecord('customrecord_3k_stock_det', null, filters, columns );
			
			// En caso de ser una cantidad exacta, no lleva la cantidad entre parentesis, sino solamente el BIN
			if (searchresults != null && searchresults.length == 1)
				var cantidadExacta = true;
			else
				var cantidadExacta = false;			
				
			for ( var j = 0; searchresults != null && j < searchresults.length ; j++ )
			{
				var articulo		= searchresults[j].getValue('custrecord_3k_stock_det_articulo');
				var ubicacion		= searchresults[j].getValue('custrecord_3k_stock_det_location');
				var deposito		= searchresults[j].getValue('custrecord_3k_stock_det_deposito');
				var depositoText	= searchresults[j].getText('custrecord_3k_stock_det_deposito');
				var lote			= searchresults[j].getValue('custrecord_3k_stock_det_lote');
				var cantidad		= searchresults[j].getValue('custrecord_3k_stock_det_cantidad');
				
				if (cantidadExacta == true)
					stringTmp	+= depositoText + '\n';
				else
					stringTmp	+= depositoText + '(' + cantidad + ')\n';
				
				//alert ('Articulo:' + articulo + ' - Ubicacion:' + ubicacion + ' - Deposito:' + depositoText + ' - Lote:' + lote + ' - Cantidad:' + cantidad);
			}	
			
			// le saco el ultimo salto de linea
			stringTmp	= stringTmp.substr( 0, (stringTmp.length)-1);
			
			if (stringTmp != null && stringTmp != ''){
	
				nlapiSelectLineItem('item', i);
				nlapiSetCurrentLineItemValue('item', 'binnumbers', stringTmp, true, true);
				nlapiCommitLineItem('item', i);
				itemCargado++;
			}
			
		}
		
		i++;
	
	}
	if (itemCargado == 0)
		alert ('La orden de venta asociada no tiene stock reservado en el sistema. Verifique y vuelva a intentar.');
}

// (P21) - RESERVA DE STOCK: Limpiar el stock reservado para la OV en caso que este sea eliminada (after submit) (Sales Order)
function imr_borrar_stock_reservado_en_ov(type){
	
	if (type == 'delete' || type == 'cancel'){
	
		var recId	= nlapiGetRecordId();
		
		// elimino registro asociado, de estructura auxiliar de cheques
		var filters	= new Array();			
		filters[0] 	= new nlobjSearchFilter('custrecord_3k_stock_det_ov', null, 'is', recId);		
							
		var searchresults	= nlapiSearchRecord('customrecord_3k_stock_det', null, filters, null );
			
		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];
			var recId_2 		= searchresult.getId();
			var recType_2 		= searchresult.getRecordType();
				
			nlapiDeleteRecord(recType_2, recId_2);
		}
	}
}

// (P21) - RESERVA DE STOCK: Limpiar el stock reservado para la OV una vez que se realizo el envio (Item fulfillment)
function imr_borrar_stock_reservado(type){

	if (type != 'delete'){
	
		var recId	= nlapiGetRecordId();
		var recType	= nlapiGetRecordType();
		var record	= nlapiLoadRecord(recType, recId);
		
		var createdFrom	= record.getFieldValue('createdfrom');
		
		// elimino registro asociado, de estructura auxiliar de cheques
		var filters	= new Array();			
		filters[0] 	= new nlobjSearchFilter('custrecord_3k_stock_det_ov', null, 'is', createdFrom);		
							
		var searchresults	= nlapiSearchRecord('customrecord_3k_stock_det', null, filters, null );
			
		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];
			var recId_2 		= searchresult.getId();
			var recType_2 		= searchresult.getRecordType();
				
			nlapiDeleteRecord(recType_2, recId_2);
		}
		
	}
}

// (P23) - TRASPASO DE RECIBOS DE ORDENES DE COMPRA
function imr_traspasar_recibos_oc(){

	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();
	var record	= nlapiLoadRecord(recType, recId);

	var cantItemTransferidos	= 0;
	var depositoDestinoValue	= nlapiGetFieldValue('custbody_3k_deposito_destino');
	var depositoDestinoText		= nlapiGetFieldText('custbody_3k_deposito_destino');
	
	if (depositoDestinoValue == null || depositoDestinoValue == '')
		alert ('Por favor seleccione un deposito destino.');
	
	else{
	
		var tranid	= record.getFieldValue('tranid');
	
		// obtengo el location del deposito de destino
		var filters 		= new Array();
		var columns 		= new Array();
			
		filters[0] 	= new nlobjSearchFilter('binnumber', null, 'is', depositoDestinoText); // ver si esta dentro de los articulos incluidos
		columns[0]	= new nlobjSearchColumn("location");

		var searchresults = nlapiSearchRecord('bin', null, filters, columns );

		for ( var f = 0; searchresults != null && f < searchresults.length ; f++ )
		{					
			locationDestinoId	= searchresults[f].getValue('location');
		}
		// fin del algoritmo de obtencion de ID de BIN	
	
		// recorro los items de la recepcion
		for ( var i = 1; i <= nlapiGetLineItemCount('item'); i++){
			
			item				= nlapiGetLineItemValue('item', 'item', i);
			quantity			= nlapiGetLineItemValue('item', 'quantity', i); // cantidad recepcionada
			depositoOrigen		= nlapiGetLineItemValue('item', 'binnumbers', i); // deposito origen
			depositoTransferido	= nlapiGetLineItemValue('item', 'custcol_3k_deposito_transferido', i); // deposito origen
			
			if ( (depositoOrigen != null && depositoOrigen != '') && (parseInt(quantity)>0) && (depositoOrigen != depositoDestinoText) && (depositoTransferido == null || depositoTransferido == '') ){
			
				// obtengo el ID/location del deposito de origen
				var filters 		= new Array();
				var columns 		= new Array();
				
				filters[0] 	= new nlobjSearchFilter('binnumber', null, 'is', depositoOrigen); // ver si esta dentro de los articulos incluidos
				columns[0]	= new nlobjSearchColumn("internalid");
				columns[1]	= new nlobjSearchColumn("location");

				var searchresults = nlapiSearchRecord('bin', null, filters, columns );

				for ( var q = 0; searchresults != null && q < searchresults.length ; q++ )
				{
					binIdOrigen			= searchresults[q].getValue('internalid');					
					locationOrigenId	= searchresults[q].getValue('location');
				}
				// fin del algoritmo de obtencion de ID de BIN	
				
				recordItem	= nlapiLoadRecord ('inventoryitem', item);			
				
				var j = 1; sePuedeTransferir = false;
				
				while (j <= recordItem.getLineItemCount('binnumber') && sePuedeTransferir == false){				
					
					if (recordItem.getLineItemValue('binnumber', 'binnumber', j) == binIdOrigen){				
						
						cantidadEnDepositoOrigen	= recordItem.getLineItemValue('binnumber', 'onhand', j);
						if (parseInt(cantidadEnDepositoOrigen) >= parseInt(quantity)){						
							
							sePuedeTransferir = true;
						}
					}
					
					j++;
				}
				
				// si se puede transferir
				if (sePuedeTransferir == true){
				
					// creo un transferencia de inventario
					var xfer = nlapiCreateRecord("inventoryadjustment");

					xfer.setFieldValue("account", 459); // 459 = Account 2020000 RECEPCIONES POR FACTURAR  
					xfer.setFieldValue("memo", "Bin Transfer - Item Receipt: #" + tranid);

					// add qty to destination
					xfer.setLineItemValue("inventory", "item", 1, item);
					xfer.setLineItemValue("inventory", "location", 1, locationDestinoId);
					xfer.setLineItemValue("inventory", "binnumbers", 1, depositoDestinoText);
					xfer.setLineItemValue("inventory", "adjustqtyby", 1, quantity);

					// deduct qty from origin
					xfer.setLineItemValue("inventory", "item", 2, item);
					xfer.setLineItemValue("inventory", "location", 2, locationOrigenId);
					xfer.setLineItemValue("inventory", "binnumbers", 2, depositoOrigen);
					xfer.setLineItemValue("inventory", "adjustqtyby", 2, -quantity);			
					
					try{
						nlapiSubmitRecord(xfer, true);
						cantItemTransferidos++;
						record.setLineItemValue('item', 'custcol_3k_deposito_transferido', i, depositoDestinoText+'('+quantity+')');
					}
					catch(e){
					}				
				}
			}			
		}
	}
	
	if (cantItemTransferidos > 0){
		
		// guardo los cambios realizados en item receipt
		nlapiSubmitRecord(record, true, true);
		
		alert ('Fueron transferidos ' + cantItemTransferidos + ' l�neas de la recepci�n al deposito ' + depositoDestinoText);
		
		var v_url				= nlapiResolveURL('RECORD', 'itemreceipt', recId, true);
		window.location.href 	= v_url;
						
		return true;	
	}
	else
		alert ('No quedan l�neas pendientes de transferir.');
}

// (P19) - ABONO FACTURA DE PROVEEDOR: after submit (CHEQUE)
function generar_cheque_anticipo(type){
	
	if (type == 'create'){
	
		var recId	= nlapiGetRecordId();
		var recType	= nlapiGetRecordType();
		var record	= nlapiLoadRecord(recType, recId);
		
		/*
		try{
			var entity = record.getFieldValue('entity');
			// en caso que sea proveedor
		
		}
		catch(e){
		}
		*/
		
		var es_cheque_anticipo = record.getFieldValue('custbody_3k_cheque_anticipo');
		
		if (es_cheque_anticipo == 'T'){
		
			var name = record.getFieldValue('tranid') + ' / ' + record.getFieldValue('usertotal');
			
			var recordChequeAnticipo = nlapiCreateRecord('customrecord_3k_cheques_anticipos');
			recordChequeAnticipo.setFieldValue('name', name);
			recordChequeAnticipo.setFieldValue('custrecord_3k_cheque_id_chq_origen', recId);
			recordChequeAnticipo.setFieldValue('custrecord_3k_cheque_importe', record.getFieldValue('usertotal'));
			recordChequeAnticipo.setFieldValue('custrecord_3k_cheque_fecha', record.getFieldValue('trandate'));
			recordChequeAnticipo.setFieldValue('custrecord_3k_cheque_proveedor', record.getFieldValue('entity'));
			
			id = nlapiSubmitRecord(recordChequeAnticipo);
			
			record.setFieldValue('custbody_3k_cheque_link_chq_interno', id);
			nlapiSubmitRecord(record);
		}
		
	}
	
	if (type == 'delete'){
		
		var recId	= nlapiGetRecordId();
		var recType	= nlapiGetRecordType();	
		
		// elimino registro asociado, de estructura auxiliar de cheques
		var filters	= new Array();
		filters[0] 	= new nlobjSearchFilter('custrecord_3k_cheque_id_chq_origen', null, 'anyof', '@NONE@'); 		
						
		var searchresults	= nlapiSearchRecord('customrecord_3k_cheques_anticipos', null, filters, null );
		
		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];			

			var recId_2 		= searchresult.getId();
			var recType_2 		= searchresult.getRecordType();	
			
			nlapiDeleteRecord(recType_2, recId_2);			
		}
		
	}
	
	if (type == 'cancel'){
		
		var recId	= nlapiGetRecordId();
		var recType	= nlapiGetRecordType();
		
		// dejo inactivados en la estructura los cheques para evitar su utilizacion a futuro
		var filters	= new Array();			
		filters[0] 	= new nlobjSearchFilter('custrecord_3k_cheque_id_chq_origen', null, 'is', recId);		
						
		var searchresults	= nlapiSearchRecord('customrecord_3k_cheques_anticipos', null, filters, null );
		
		for ( var i = 0; searchresults != null && i < searchresults.length ; i++ )
		{
			var searchresult 	= searchresults[i];

			var recId_2 		= searchresult.getId();
			var recType_2 		= searchresult.getRecordType();
			
			record = nlapiLoadRecord(recType_2, recId_2);	
			record.setFieldValue('isinactive', 'T');
			nlapiSubmitRecord(record);
		}
		
	}
}

// P19 - ABONO FACTURA DE PROVEEDOR: Credito de Proveedor - After Submit
function imr_credito_proveedor_after_submit(type){

	// elimino todas las asociaciones que tenga este credito de proveedor
	if (type == 'edit' || type == 'delete'){ 
	
		var recId	= nlapiGetRecordId();
	
		var filters = new Array();		
		filters[0] 	= new nlobjSearchFilter('custrecord_3k_credito_aplicacion_cheque', null, 'is', recId); 		
		
		var searchResults = nlapiSearchRecord('customrecord_3k_cheques_anticipos', null, filters, null);	
		
		for ( var i = 0; searchResults != null && i < searchResults.length ; i++ ){
		
			var searchResult 	= searchResults[i];

			var recId_2 		= searchResult.getId();
			var recType_2 		= searchResult.getRecordType();
				
			record = nlapiLoadRecord(recType_2, recId_2);	
			record.setFieldValue('custrecord_3k_credito_aplicacion_cheque', '');
			nlapiSubmitRecord(record);
		}
	}
	
	if (type == 'create' || type == 'edit'){
		
		var recId	= nlapiGetRecordId();
		var recType	= nlapiGetRecordType();
		var record	= nlapiLoadRecord(recType, recId);

		var chequesAnticipadosCount	= record.getLineItemCount('expense');
		
		for (var i = 1; i <= chequesAnticipadosCount; i++){
		
			if (record.getLineItemValue('expense', 'custcol_link_a_cheque', i) != '' && record.getLineItemValue('expense', 'custcol_link_a_cheque', i) != null){				
				
				var recordTmp = nlapiLoadRecord('customrecord_3k_cheques_anticipos', record.getLineItemValue('expense', 'custcol_link_a_est_cheque', i));
				recordTmp.setFieldValue('custrecord_3k_credito_aplicacion_cheque', recId);
				nlapiSubmitRecord(recordTmp, true);
			}
		}
	}	
}

// (P19) - ABONO FACTURA DE PROVEEDOR: Agrega suitelet al tab cheques anticipos (CREDITO PROVEEDOR)
function beforeLoadTab(type, form){

	var newRecord 		= nlapiGetNewRecord();

	var currentContext 	= nlapiGetContext(); 
	var currentUserID 	= currentContext.getUser();
	var entity			= nlapiGetFieldValue('entity');	
	
	if( (currentContext.getExecutionContext() == 'userinterface') && (type == 'edit' | type == 'create')){
	
		var SampleTab = form.addTab('custpage_sample_tab', 'Cheques anticipos');		
		
		var signatureRequestSublist = form.addSubList('custpage_sig_req_sublist', 'list', 'Cheques anticipos','custpage_sample_tab');
		signatureRequestSublist.setDisplayType('normal');
		
		signatureRequestSublist.addField('custpage_req_id_est_cheque', 'text', 'idEstructuraCheque').setDisplayType('hidden');
		signatureRequestSublist.addField('custpage_req_id_cheque', 'text', 'idCheque').setDisplayType('hidden');
		signatureRequestSublist.addField('custpage_req_seleccionar', 'checkbox', 'Seleccionar');				
		signatureRequestSublist.addField('custpage_req_beneficiario', 'text', 'Beneficiario');
		signatureRequestSublist.addField('custpage_req_cheque_nro', 'text', 'Cheque #');
		signatureRequestSublist.addField('custpage_req_importe', 'currency', 'Importe');
		signatureRequestSublist.addField('custpage_req_fecha', 'date', 'Fecha del cheque');			
		
		var columns = new Array();		
		columns[0] = new nlobjSearchColumn('custrecord_3k_cheque_id_chq_origen');
		columns[1] = new nlobjSearchColumn('custrecord_3k_cheque_importe');
		columns[2] = new nlobjSearchColumn('custrecord_3k_cheque_fecha');
		columns[3] = new nlobjSearchColumn('custrecord_3k_cheque_proveedor');
		columns[4] = new nlobjSearchColumn('custrecord_3k_cheque_id_chq_origen');
		
		var filters = new Array();		
		
		if (type == 'create'){
			
			filters[0] 	= new nlobjSearchFilter('custrecord_3k_credito_aplicacion_cheque', null, 'anyof', '@NONE@'); 
		}
		else{
			
			filters[0] 	= new nlobjSearchFilter('custrecord_3k_cheque_proveedor', null, 'is', entity); 			
		}
			
		var searchResults = nlapiSearchRecord('customrecord_3k_cheques_anticipos', null, filters, columns);	
		
		for ( var i = 0; searchResults != null && i < searchResults.length ; i++ )
		{
			
			signatureRequestSublist.setLineItemValue('custpage_req_id_est_cheque', i+1, searchResults[i].getId());
			signatureRequestSublist.setLineItemValue('custpage_req_id_cheque', i+1, searchResults[i].getValue('custrecord_3k_cheque_id_chq_origen'));
			signatureRequestSublist.setLineItemValue('custpage_req_importe', i+1, searchResults[i].getValue('custrecord_3k_cheque_importe'));
			signatureRequestSublist.setLineItemValue('custpage_req_beneficiario', i+1, searchResults[i].getText('custrecord_3k_cheque_proveedor'));
			signatureRequestSublist.setLineItemValue('custpage_req_cheque_nro', i+1, searchResults[i].getText('custrecord_3k_cheque_id_chq_origen'));
			signatureRequestSublist.setLineItemValue('custpage_req_fecha', i+1, searchResults[i].getValue('custrecord_3k_cheque_fecha'));
			
			// verifico si esta seleccionado
			var j = 1; var existe = false;
			
			while (j <= newRecord.getLineItemCount('expense') && existe == false){				
				
				if (newRecord.getLineItemValue('expense', 'custcol_link_a_cheque', j) == searchResults[i].getValue('custrecord_3k_cheque_id_chq_origen'))
					existe = true;	
					
				j++;			
			}
			
			if (existe == true)
				signatureRequestSublist.setLineItemValue('custpage_req_seleccionar', i+1, 'T');
			else
				signatureRequestSublist.setLineItemValue('custpage_req_seleccionar', i+1, 'F');
		}				
		
	}
}

// (P19) - ABONO FACTURA DE PROVEEDOR: tomar el click de los cheques que voy seleccionando
function imr_field_changed_sel_cheque(type, name, linenum){
		
	if (type == 'custpage_sig_req_sublist' && name == 'custpage_req_seleccionar'){				
		
		nlapiSelectLineItem('custpage_sig_req_sublist', linenum);
		
		var chequeSeleccionado	= nlapiGetCurrentLineItemValue('custpage_sig_req_sublist', 'custpage_req_seleccionar');
		var chequeId			= nlapiGetCurrentLineItemValue('custpage_sig_req_sublist', 'custpage_req_id_cheque');
		var chequeEstId			= nlapiGetCurrentLineItemValue('custpage_sig_req_sublist', 'custpage_req_id_est_cheque');
		
		var recCheque			= nlapiLoadRecord('check', chequeId);	
		
		if (chequeSeleccionado == 'T') {	
			
			// obtengo la apertura del cheque
			
			for ( var k = 1; k <= recCheque.getLineItemCount('expense'); k++){				
				
				var chequeAccount	= recCheque.getLineItemValue('expense', 'account', k);
				var chequeAmount	= recCheque.getLineItemValue('expense', 'amount', k);
				var chequeTaxCode	= recCheque.getLineItemValue('expense', 'taxcode', k);
				
				var expenseCount = nlapiGetLineItemCount('expense');
		
				nlapiSelectLineItem('expense', expenseCount+1);
				nlapiSetCurrentLineItemValue('expense', 'account', chequeAccount ,true, true);
				nlapiSetCurrentLineItemValue('expense', 'amount', chequeAmount ,true, true);
				nlapiSetCurrentLineItemValue('expense', 'taxcode', chequeTaxCode ,true, true);		
				nlapiSetCurrentLineItemValue('expense', 'custcol_link_a_cheque', chequeId ,true, true);		
				nlapiSetCurrentLineItemValue('expense', 'custcol_link_a_est_cheque', chequeEstId ,true, true);		
				nlapiCommitLineItem('expense');			
			}
			
			alert ('El cheque de anticipo se agrego como gasto exitosamente.');			
		}
			
		else {
			
			alert ('El cheque de anticipo fue eliminado de los gastos exitosamente.');		

			for ( var i = 1; i <= nlapiGetLineItemCount('expense'); i++){
			
				var accountTMP 	= nlapiGetLineItemValue('expense', 'account', i);
				var amountTMP 	= nlapiGetLineItemValue('expense', 'amount', i);
				
				if (chequeAccount == accountTMP && chequeAmount == amountTMP){				
					
					nlapiSelectLineItem('expense', i);
					nlapiSetCurrentLineItemValue('expense', 'account', '' ,true, true);
					nlapiSetCurrentLineItemValue('expense', 'amount', '' ,true, true);
					nlapiSetCurrentLineItemValue('expense', 'taxcode', '' ,true, true);	
									
					nlapiRemoveLineItem('expense', parseInt(i));					
				}
			}
		}
		
	}	
}

// IMPRESION DE LISTA DE SURTIMIENTO: Evento que redirecciona al Suitlet
function imr_imprimir_lista_surtimiento(){

	var recId	= nlapiGetRecordId();
	
	if (recId != ''){
	
		var new_url = nlapiResolveURL('SUITELET', 'customscript_imr_lista_surtimiento', 'customdeploy1');	 
		window.open (new_url + "&custparam_ov=" + recId);
	}
}

function returnBlank(value){
	
	if (value == null)
		return '';
	else 
		return value;
}

// LISTA DE SURTIMIENTO: Generacion de PDF
function imr_pdf_lista_surtimiento(request, response) {	

	// obtengo los datos necesarios para la impresion
	var ov				= request.getParameter('custparam_ov');
	var recSalesOrder	= nlapiLoadRecord('salesorder', ov);
	
	var entity			= recSalesOrder.getFieldValue('entity');
	var facturaA		= recSalesOrder.getFieldValue('billaddress');
	var enviarA			= recSalesOrder.getFieldValue('shipaddress');

	var recEntity		= nlapiLoadRecord('customer', entity);
	
	var clasif_cliente	= recEntity.getFieldText('custentity4');
	var pack			= recEntity.getFieldValue('custentity5');
	var ocurre			= recEntity.getFieldValue('custentity6');
	
	var date 			= new Date();
	var today 			= nlapiDateToString( new Date(), 'datetime' );
	
	var cuadrado = " <shape width=\"170\" height=\"30\" border=\"1\">"+
					"<shapepath>"+ 
					"<moveto x=\"0%\" y=\"0%\"/>"+
					"<lineto x=\"0%\" y=\"100%\"/>"+
					"<moveto x=\"100%\" y=\"100%\"/>"+
					"<lineto x=\"0%\" y=\"100%\"/>"+
					"<moveto x=\"100%\" y=\"100%\"/>"+
					"<lineto x=\"100%\" y=\"0%\"/>"+
					"<moveto x=\"0%\" y=\"0%\"/>"+
					"<lineto x=\"100%\" y=\"0%\"/>"+				 
					"</shapepath>"+
					"</shape>";

	var strName = "<table width=\"100%\" border=\"0\" cellpadding=\"0\" class=\"tabla\">";
		strName += "<tr height=\"25px\"><td align=\"center\" class=\"textreg\">LOCALIZACION</td><td align=\"center\" class=\"textreg\">COD. ARTICULO</td><td align=\"center\" class=\"textreg\">CANTIDAD</td><td align=\"center\" class=\"textreg\">DESCRIPCION</td></tr>";
	
	var columns = new Array();		
	var filters = new Array();		
	
	columns[0] = new nlobjSearchColumn('custrecord_3k_stock_det_articulo');
	columns[1] = new nlobjSearchColumn('custrecord_3k_stock_det_location');
	columns[2] = new nlobjSearchColumn('custrecord_3k_stock_det_deposito');
	columns[3] = new nlobjSearchColumn('custrecord_3k_stock_det_lote');
	columns[4] = new nlobjSearchColumn('custrecord_3k_stock_det_cantidad');			
	filters[0] = new nlobjSearchFilter('custrecord_3k_stock_det_ov', null, 'is', request.getParameter('custparam_ov')); 				
		
	var searchResults = nlapiSearchRecord('customrecord_3k_stock_det', null, filters, columns);	
  var imagen = nlapiLoadFile(18);
  var url = imagen.getURL();
  var urls = url.split('&');
  var urlAux = '';
  urlAux = urls.join('&amp;');
			
	for ( var i = 0; searchResults != null && i < searchResults.length ; i++ ){
	
		var item = searchResults[i].getValue('custrecord_3k_stock_det_articulo');
		try { 
		
			var recItem 	= nlapiLoadRecord('inventoryitem', item);
			var itemNombre	= recItem.getFieldValue('purchasedescription'); 
		}
		catch (e){ itemNombre = 'Sin nombre';}		
		strName 	   += "<tr height=\"20px\"><td>"+searchResults[i].getText('custrecord_3k_stock_det_location')+"-"+searchResults[i].getText('custrecord_3k_stock_det_deposito')+"-"+returnBlank(searchResults[i].getText('custrecord_3k_stock_det_lote'))+"</td><td align=\"right\">"+item+"</td><td align=\"right\">"+searchResults[i].getValue('custrecord_3k_stock_det_cantidad')+"</td><td>&nbsp;&nbsp;" + itemNombre + "</td></tr>";
	}	
	
	strName += "</table>";
		
    var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>\n";
	    xml += "<head>\n<style>"+
				".textreg{background-color: #0B0B61; color: white} " + 
				".tabla{height: 600px;} " + 
				".caja{width:300px; height:80px; background-color: red; border: thin solid black; border: 1}"+
				" </style></head>\n";
		xml += "<body size=\"A4\" font-size=\"12\">\n";
		xml += "<table width=\"100%\"><tr>"+
			   //"<td width=\"70%\"><img src=\"https://system.netsuite.com/core/media/media.nl?id=18&amp;c=1202293&amp;h=3fb7137895aec6b0380e\" /><p>"+"Clasificaci�n Cliente: "+returnBlank(clasif_cliente)+"<br/>"+"Paqueteria: "+returnBlank(pack)+"<br/>"+"Tipo envio: "+returnBlank(ocurre)+"</p></td>"+
         "<td width=\"70%\"><img src=\"" + urlAux + "\" /><p>"+"Clasificaci�n Cliente: "+returnBlank(clasif_cliente)+"<br/>"+"Paqueteria: "+returnBlank(pack)+"<br/>"+"Tipo envio: "+returnBlank(ocurre)+"</p></td>"+
			   "<td><span style=\"background-color: #0B0B61; color: white;\">LISTA DE SURTIMIENTO</span><br/>Fecha:"+returnBlank(today)+"<br/>Cod. Cliente: "+returnBlank(entity)+"<br/>PAGINA <pagenumber /></td>"+
			   "</tr></table>";
		xml += "<table width=\"100%\" border=\"1\"><tr class=\"textreg\">"+
		       "<td>FACTURAR PARA</td><td>ENVIAR PARA</td></tr>";
		xml += "<tr><td font-size=\"10pt\">"+facturaA+"</td>";
		xml += "<td font-size=\"10pt\">"+enviarA+"</td></tr>";		
		xml += "</table>";
		xml += strName;		
		xml += "<table><tr><td>"+cuadrado+"</td><td>"+cuadrado+"</td><td>"+cuadrado+"</td></tr>";
		xml += "<tr><td align=\"center\">Inspeccionado</td><td align=\"center\">Validado</td><td align=\"center\">Factura</td></tr></table>";		
		xml += "</body>\n</pdf>";

    // run the BFO library to convert the xml document to a PDF 
    var file = nlapiXMLToPDF(xml);

    // set content type, file name, and content-disposition (inline means display in browser)
    response.setContentType('PDF', 'lista_surtimiento.pdf', 'inline');

    // write response to the client
    response.write(file.getValue());
}


// Transferencia de inventario - OnChange sobre el listbox 'Ubicacion destino'
function ubicacionDestinoChange(type, name){

	if (name == 'custbody45'){
	
		var ubicacionDestino	= nlapiGetFieldValue('custbody45');
		var itemCount			= nlapiGetLineItemCount('item');
		var countRegistrosAct	= 0;
		
		if (ubicacionDestino != null && ubicacionDestino != ''){
		
			for ( var i = 1; i <= itemCount; i++){
				
				nlapiSelectLineItem('item', i);
				
				item				= nlapiGetLineItemValue('item', 'item', i);
				
				try{
					var recItem	= nlapiLoadRecord('serializedinventoryitem', item);
				}
				catch(e){var recItem	= nlapiLoadRecord('inventoryitem', item);}
				
				// en caso que use Bins ( Depositos )
				if (recItem.getFieldValue('usebins') == 'T'){
					
					// obtengo el Bin preferido para el item / ubicaci�n seleccionados
					itemCount_2 = recItem.getLineItemCount('binnumber');
					
					for ( var j = 1; j <= itemCount_2; j++){
						
						if (recItem.getLineItemValue('binnumber', 'location', j) == ubicacionDestino
							&& recItem.getLineItemValue('binnumber', 'preferredbin', j) == 'T'){
						
							depositoTMP = recItem.getLineItemValue('binnumber', 'binnumber', j);
							if (depositoTMP != null && depositoTMP != ''){
							
								nlapiSetCurrentLineItemValue('item', 'custcol15', depositoTMP ,true, true);
								countRegistrosAct++;
							}
						}
					}				
					
					nlapiSetCurrentLineItemValue('item', 'custcol14', ubicacionDestino ,true, true);				
				}
			}
			
			alert ('Se actualizo exitosamente la Ubicaci�n Destino de ' + countRegistrosAct + ' registros.');
		}
	}
}


function imr_transferencia_inventario(){

	var recId	= nlapiGetRecordId();
	var recType	= nlapiGetRecordType();
	var record	= nlapiLoadRecord(recType, recId);

	var cantItemTransferidos	= 0;
	
	var ubicacionDestino = nlapiGetFieldValue('custbody45');
	
	if (ubicacionDestino == null || ubicacionDestino == '')
		alert ('Por favor seleccione una ubicaci�n destino para continuar.');
	
	else{
	
		if (confirm('Esta a punto de realizar una transferencia de inventario, la cual puede demorar unos segundos. Desea continuar ?')){
		
			var indiceTmp = 0;
			
			// creo un ajuste de inventario
			var xfer = nlapiCreateRecord("inventoryadjustment");			
						
			// recorro los items de la recepcion
			for ( var i = 1; i <= nlapiGetLineItemCount('item'); i++){
				
				item				= nlapiGetLineItemValue('item', 'item', i);
				quantity			= nlapiGetLineItemValue('item', 'quantity', i); // cantidad recepcionada
				rate				= nlapiGetLineItemValue('item', 'rate', i); // costo unitario
				itemSeleccionado	= nlapiGetLineItemValue('item', 'itemreceive', i); // item seleccionado para recibir
				
				ubicacionOrigen		= nlapiGetLineItemValue('item', 'location', i); // ubicacion origen
				depositoOrigen		= nlapiGetLineItemValue('item', 'binnumbers', i); // deposito origen
				
				ubicacionDestino  	= nlapiGetLineItemValue('item', 'custcol14', i); // ubicacion destino
				depositoDestino		= nlapiGetLineItemValue('item', 'custcol15', i); // deposito destino
				depositoDestinoText	= nlapiGetLineItemText('item', 'custcol15', i); // deposito destino (Texto)
				
				if ( (depositoOrigen != null && depositoOrigen != '') && (depositoDestino != null && depositoDestino != '') 
					&& (ubicacionOrigen != null && ubicacionOrigen != '') && (ubicacionDestino != null && ubicacionDestino != '')
					&& (parseInt(quantity)>0) && (depositoOrigen != depositoDestinoText) && (itemSeleccionado == 'T') ){
				
					// obtengo el ID/location del deposito de origen
					var filters 		= new Array();
					var columns 		= new Array();
					
					filters[0] 	= new nlobjSearchFilter('binnumber', null, 'is', depositoOrigen); // ver si esta dentro de los articulos incluidos
					columns[0]	= new nlobjSearchColumn('internalid');
					columns[1]	= new nlobjSearchColumn('location');

					var searchresults = nlapiSearchRecord('bin', null, filters, columns );

					for ( var q = 0; searchresults != null && q < searchresults.length ; q++ )
					{
						binIdOrigen			= searchresults[q].getValue('internalid');					
						locationOrigenId	= searchresults[q].getValue('location');
					}
					// fin del algoritmo de obtencion de ID de BIN	
					
					recordItem			= nlapiLoadRecord ('inventoryitem', item);
					var precioPromedio	= recordItem.getFieldValue('averagecost');
					
					var j = 1; sePuedeTransferir = false;
					
					while (j <= recordItem.getLineItemCount('binnumber') && sePuedeTransferir == false){				
						
						if (recordItem.getLineItemValue('binnumber', 'binnumber', j) == binIdOrigen){				
							
							cantidadEnDepositoOrigen	= recordItem.getLineItemValue('binnumber', 'onhand', j);
							if (parseInt(cantidadEnDepositoOrigen) >= parseInt(quantity)){						
								
								sePuedeTransferir = true;
							}
						}
						
						j++;
					}
					
					// si se puede transferir
					if (sePuedeTransferir == true){					

						indiceTmp++;
						
						// add qty to destination
						xfer.setLineItemValue("inventory", "item", indiceTmp, item);
						xfer.setLineItemValue("inventory", "unitcost", indiceTmp, parseFloat(rate));
						xfer.setLineItemValue("inventory", "location", indiceTmp, ubicacionDestino);
						xfer.setLineItemValue("inventory", "binnumbers", indiceTmp, depositoDestinoText);
						xfer.setLineItemValue("inventory", "adjustqtyby", indiceTmp, quantity);

						indiceTmp++;	
							
						// deduct qty from origin
						xfer.setLineItemValue("inventory", "item", indiceTmp, item);
						xfer.setLineItemValue("inventory", "unitcost", indiceTmp, parseFloat(rate));
						xfer.setLineItemValue("inventory", "location", indiceTmp, locationOrigenId);
						xfer.setLineItemValue("inventory", "binnumbers", indiceTmp, depositoOrigen);
						xfer.setLineItemValue("inventory", "adjustqtyby", indiceTmp, -quantity);			
						
						cantItemTransferidos++;			
					}
				}			
			}
			// grabo el ajuste de inventario
			xfer.setFieldValue("account", 1515); // 1515 = Cuenta 6080111 Transferencias de Inventario
			xfer.setFieldValue("custbody7", 31); // 31 = Razon de Ajustes - 31 Transferencias
			try{
				nlapiSubmitRecord(xfer, true);
			   }
			catch(e) {}
		}
	}
	
	if (cantItemTransferidos > 0){
		
		alert ('Fueron transferidos ' + cantItemTransferidos + ' l�neas de la recepci�n.');
		
		var v_url				= nlapiResolveURL('RECORD', 'itemreceipt', recId, true);
		window.location.href 	= v_url;
						
		return true;	
	}
	else
		alert ('No quedan l�neas pendientes de transferir.');
}


// Helper functions
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
}

function ifStringEmpty(stSource, stDestination) {
    if (isEmpty(stSource)) {
        return stDestination;
    }

    return stSource;
}

function isEmpty(stValue) {
    if (isNullOrUndefined(stValue)) {
        return true;
    }

    if (stValue.length == 0) {
        return true;
    }

    return false;
}

function isArrayEmpty(array) {
    if (isNullOrUndefined(array)) {
        return true;
    }

    if (array.length <= 0) {
        return true;
    }

    return false;
}

function isNullOrUndefined(value) {
    if (value === null) {
        return true;
    }

    if (value === undefined) {
        return true;
    }

    if (isNaN(value)) {
        return true;
    }
    

    return false;
}
