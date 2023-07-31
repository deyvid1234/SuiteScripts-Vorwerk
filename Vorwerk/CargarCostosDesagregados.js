// (P7) - ASIGNACION DE MULTIPLES GASTOS DE IMPORTACION - Click button ( Recepción de Artículos )
function CargarCostosDesagregados()
{
    var recId   = nlapiGetRecordId();
    var monedaRecepArt      = nlapiGetFieldValue('currencyname');
    var tipoCambioRecepArt  = nlapiGetFieldValue('exchangerate');
    var i       = 0;
    var filters = new Array();
    var columns = new Array();
    filters[0]  = new nlobjSearchFilter('custrecord_3k_recepcion_asociada', null, 'anyof', recId);  
    columns[0]  = new nlobjSearchColumn("custrecord_3k_proveedor_asociado");
    columns[1]  = new nlobjSearchColumn("custrecord_3k_recepcion_asociada");
    columns[2]  = new nlobjSearchColumn("custrecord_3k_costosdesag_categoria");
    columns[3]  = new nlobjSearchColumn("custrecord_3k_importe_parcial");
    columns[4]  = new nlobjSearchColumn("custrecord_3k_apertura_aplicada");
    columns[5]  = new nlobjSearchColumn("custrecord_3k_factura_prov_asociada");
    columns[6]  = new nlobjSearchColumn("currency","custrecord_3k_factura_prov_asociada");
    columns[7]  = new nlobjSearchColumn("exchangerate","custrecord_3k_factura_prov_asociada");
    var searchresults   = nlapiSearchRecord('customrecord_apertura_costo_desagregados', 'customsearch_3k_costos_desag_x_categoria', filters, columns );
    if (searchresults == null || searchresults.length == 0)
    {
        alert ('No hay apertura de costos desagregados generada o no se encontraron FC de Proveedor que tengan asociada esta recepción. Verifique y vuelva a intentar.');
    }
    else 
    {
        var lon =searchresults.length;
        var resultados = new Array();
        var ii=0;
        for(var cont=lon-1;cont>0;cont--)
        {
            if(searchresults[cont].getId()!=searchresults[cont-1].getId())
             { resultados[ii]=searchresults[cont]; ii++; }                 
        }
        resultados[ii]=searchresults[0];
        resultados.reverse();
        var searchresults = resultados;
        nlapiSetFieldValue('landedcostmethod', 'VALUE', true, true);
        while ( searchresults != null && i < searchresults.length )
        {
            // 1er. corte de control - tomo la categoria para hacer el corte de control
            categoria = searchresults[i].getValue('custrecord_3k_costosdesag_categoria');
            importeTotal = 0;
            while ( searchresults != null && i < searchresults.length && categoria == searchresults[i].getValue('custrecord_3k_costosdesag_categoria'))
            {
                var importeParcial          = searchresults[i].getValue('custrecord_3k_importe_parcial');      
                var proveedorAsignado       = searchresults[i].getValue('custrecord_3k_proveedor_asociado');       
                var aperturaAplicada        = searchresults[i].getValue('custrecord_3k_apertura_aplicada');        
                var facturaProveedor        = searchresults[i].getValue('custrecord_3k_factura_prov_asociada');
                var monedaFactProv          = searchresults[i].getText("currency","custrecord_3k_factura_prov_asociada");
                var tipoCambioFactProv      = searchresults[i].getValue("exchangerate","custrecord_3k_factura_prov_asociada");
                var tipoCambio              = 0;
                if (facturaProveedor != null && facturaProveedor != '')
                {
                    // me fijo la moneda de la factura de proveedor
                    //var vendorBill          = nlapiLoadRecord('vendorbill', facturaProveedor);
                    //var monedaFactProv      = vendorBill.getFieldValue('currencyname');
                    //var tipoCambioFactProv  = vendorBill.getFieldValue('exchangerate');
                    //alert('importeParcial '+  importeParcial + '\n' + 'monedaRecepArt ' + monedaRecepArt + '\n' + 'monedaFactProv ' + monedaFactProv + '\n' + 'tipoCambio ' + tipoCambio + '\n' + 'tipoCambioRecepArt ' + tipoCambioRecepArt);
                    if (monedaRecepArt == monedaFactProv)
                    {
                        tipoCambio = 1;
                        importeTotal    += parseFloat(getVal(importeParcial) * parseFloat(tipoCambio));
                    }
                    else
                    {
                        if(monedaFactProv == 'Pesos' && monedaRecepArt != 'Pesos' )
                        {
                            tipoCambio = tipoCambioRecepArt;
                            importeTotal    += parseFloat(getVal(importeParcial) / parseFloat(tipoCambio));
                        }
                        if(monedaFactProv != 'Pesos' && monedaRecepArt == 'Pesos' )
                        {
                            tipoCambio = tipoCambioFactProv;
                            importeTotal    += parseFloat(getVal(importeParcial) * parseFloat(tipoCambio));
                        }
                        if(monedaFactProv != 'Pesos' && monedaRecepArt != 'Pesos' )
                        {
                            importeTotal += parseFloat( (getVal(importeParcial) * parseFloat(tipoCambioFactProv)) / tipoCambioRecepArt );
                        }
                    }
                }
                i = i + 1;
            }       
            if (facturaProveedor != null && facturaProveedor != '' && importeTotal != null && importeTotal != '')
            {
                nlapiSetFieldValue('landedcostsource'+categoria, 'OTHTRAN', true, true);
                nlapiSetFieldValue('landedcostsourcetran'+categoria, facturaProveedor, true, true);
                nlapiSetFieldValue('landedcostamount'+categoria, importeTotal, true, true);                     
            }
        }       
        alert ('El proceso finalizo correctamente.');
    }
}
function getVal(v)
{
    return parseFloat(v) || 0.0;
}
