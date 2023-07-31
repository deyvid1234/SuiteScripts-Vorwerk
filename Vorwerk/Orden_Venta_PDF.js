function Orden_Venta_PDF(request,response)
{
    var Base64      = new MainBase64();
    var data        = request.getParameter('data');
    data        = Base64.decode(data);
    data        = JSON.parse(data);
    var recordType  = returnBlank(data.recordType);
    var recordId    = returnBlank(data.recordId);
    var host        = returnBlank(data.host);
    var titleForm   = 'Orden de Venta';

    try
    {
        var salesorder      = returnBlank(nlapiLoadRecord(recordType, recordId));
        var entity          = nlapiEscapeXML(returnBlank(salesorder.getFieldValue('entity')));
        var customer        = returnBlank(nlapiLoadRecord('customer', entity));
        var trandate        = nlapiEscapeXML(returnBlank(salesorder.getFieldValue('trandate')));
        var tranid          = nlapiEscapeXML(returnBlank(salesorder.getFieldValue('tranid')));
        var vatregnum       = nlapiEscapeXML(returnBlank(salesorder.getFieldValue('vatregnum')));
        var location        = nlapiEscapeXML(returnBlank(salesorder.getFieldText('location')));
        var pagina          = '<pagenumber/> de <totalpages/>';
        var name            = nlapiEscapeXML(returnBlank(customer.getFieldValue('altname')));
        var salesrep        = nlapiEscapeXML(returnBlank(salesorder.getFieldText('salesrep')));
        var salesrep_aux    = nlapiEscapeXML(returnBlank(salesorder.getFieldText('salesrep')));
        var itemcount       = returnNumber(salesorder.getLineItemCount('item'));
        var pagocount       = returnNumber(salesorder.getLineItemCount('custpage_datos_pagos'));
        var subtotal        = returnNumber(salesorder.getFieldValue('subtotal'));
        var taxtotal        = returnNumber(salesorder.getFieldValue('taxtotal'));
        var total           = returnNumber(salesorder.getFieldValue('total'));
        var pagado          = returnNumber(salesorder.getFieldValue('custbody_total_pagado'));
        var pagar           = returnNumber(salesorder.getFieldValue('custbody_total_a_pagar'));
        var sku         = '';
        var serie           = '';
        var quantity        = 0;
        var description     = '';
        var amount          = 0;
        var taxrate         = '';
        var gross           = 0;

        var compaynyInfo        = nlapiLoadConfiguration('companyinformation');
        var companyInfoName     = returnBlank(compaynyInfo.getFieldValue('legalname'));
        var companyInfoAddress1 = returnBlank(compaynyInfo.getFieldValue('address1'));
        var companyInfoAddress2 = returnBlank(compaynyInfo.getFieldValue('address2'));
        var companyInfoCity     = returnBlank(compaynyInfo.getFieldValue('city'));
        var companyInfoState    = returnBlank(compaynyInfo.getFieldValue('state'));
        var companyInfoCountry  = returnBlank(compaynyInfo.getFieldText('country'));
        var companyInfoZip      = returnBlank(compaynyInfo.getFieldValue('zip'));
        var companyInfoLogoId   = nlapiEscapeXML(returnBlank(compaynyInfo.getFieldValue('formlogo')));
        var companyInfoLogoObj  = new Object();
        var companyInfoLogoURL  = '';
        if(companyInfoLogoId != '')
        {
            companyInfoLogoObj  = nlapiLoadFile(companyInfoLogoId);
        }
        else
        {
            var filtersFile     = new Array();
            filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'IMR_NO_LOGO.png'));
            var searchFile      = returnBlank(nlapiSearchRecord('file', null, filtersFile, null));
            var NO_LOGO_ID      = searchFile[0].getId();
            companyInfoLogoObj  = nlapiLoadFile(NO_LOGO_ID);
        }
        companyInfoLogoURL  = companyInfoLogoObj.getURL();
        companyInfoLogoURL  = stringToArray(companyInfoLogoURL,38);
        companyInfoLogoURL  = companyInfoLogoURL.join('&amp;');
        companyInfoLogoURL  = "src='" + host + companyInfoLogoURL + "'/";

        serie = "";
        for(var i=1;i<itemcount + 1;i++){


            var tmp_item = salesorder.getLineItemValue('item', 'item', i);
            nlapiLogExecution('debug', 'tmp_item', tmp_item);
            
            var subrecord = salesorder.viewLineItemSubrecord('item', 'inventorydetail',i);
            nlapiLogExecution('debug', 'subrecord', JSON.stringify(subrecord));
            if(subrecord != null) {
                var subitems    = subrecord.getLineItemCount('inventoryassignment');
                for(var x = 1; x <= subitems; x++) {
                    subrecord.selectLineItem('inventoryassignment', x);
                    serie = subrecord.getCurrentLineItemText('inventoryassignment', 'issueinventorynumber');
                    nlapiLogExecution('debug', 'serie', serie);
                    if(serie){
                        break;
                    }

                }
            }
            //Ajuste para tomar cualquier ITEM que tenga Numero de serie y no limitarlo a validacion por id de TMS
           /* 
            var tmp_item = salesorder.getLineItemValue('item', 'item', i);
            nlapiLogExecution('debug', 'tmp_item', tmp_item);
            if(tmp_item == 2001 || tmp_item == 2170 || tmp_item == 2490){
                var subrecord = salesorder.viewLineItemSubrecord('item', 'inventorydetail',i);
                nlapiLogExecution('debug', 'subrecord', JSON.stringify(subrecord));
                if(subrecord != null) {
                    var subitems    = subrecord.getLineItemCount('inventoryassignment');
                    for(var x = 1; x <= subitems; x++) {
                        subrecord.selectLineItem('inventoryassignment', x);
                        serie = subrecord.getCurrentLineItemText('inventoryassignment', 'issueinventorynumber');
                        nlapiLogExecution('debug', 'serie', serie);
                        if(serie){
                            break;
                        }

                    }
                }
            }*/


        }
        if(serie == '')
        {
            serie   = 'N/A';
        }
        if(salesrep == '')
        {
            salesrep = 'N/A';
        }
        else
        {
            salesrep = stringToArray(salesrep, 32);
            salesrep = salesrep[0];
        }
        var Encabezado  = '';
        Encabezado += "<table width='100%'>";
        Encabezado += "<tr>";
        Encabezado += "<td width='50%'>";
        Encabezado +="<table width='100%'>";
        Encabezado += "<tr><td colspan='3' align='left'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td><td></td></tr>";
        Encabezado += "<tr><td>&nbsp;</td></tr>";
        Encabezado += "</table>";
        Encabezado += "</td>";
        Encabezado += "</tr>";
        Encabezado += "</table>";
        Encabezado += "<table table-layout='fixed' width='100%'>";
        Encabezado += "<thead>";
        Encabezado += "<tr>";
        Encabezado += "<td width='50%'>";
        Encabezado +="<table width='100%'>";
        Encabezado += "<tr><td font-size=\"14pt\"><b>" + companyInfoName + "</b></td></tr>";
        Encabezado += "<tr><td font-size=\"9pt\">" + companyInfoAddress1 + "</td></tr>";
        Encabezado += "<tr><td font-size=\"9pt\">COLONIA " + companyInfoAddress2 + "</td></tr>";
        Encabezado += "<tr><td font-size=\"9pt\">" + companyInfoCity +" "+ companyInfoState +" "+ companyInfoZip + "</td></tr>";
        Encabezado += "<tr><td font-size=\"9pt\">" + companyInfoCountry.toUpperCase() + "</td></tr>";
        Encabezado += "</table>";
        Encabezado += "</td>";
        Encabezado += "<td width='50%' align='left'>";
        Encabezado += "<table width='100%'>";
        Encabezado += "<tr>";
        Encabezado += "<td>&nbsp;</td><td width='50%' align='left'><b>Fecha</b></td><td align='left'>" + trandate + "</td></tr>";
        Encabezado += "<tr><td font-size=\"6pt\"></td><td align='left'></td></tr>";
        Encabezado += "<tr><td>&nbsp;</td><td width='50%' align='left' font-size=\"9pt\"><b>N.° de pedido:</b></td><td align='left'>" + tranid + "</td></tr>";
        Encabezado += "<tr><td>&nbsp;</td><td width='50%' align='left' font-size=\"9pt\"><b>ID Interno:</b></td><td align='left'>" + recordId + "</td></tr>";
        //Encabezado += "<tr><td>&nbsp;</td><td width='50%' align='left' font-size=\"9pt\"><b>F.E. En Línea:</b></td><td align='left'>" + "http://goo.gl/DH6fJG" + "</td></tr>";
        Encabezado += "<tr><td font-size=\"6pt\"></td><td align='left'></td></tr>";
        Encabezado += "<tr><td>&nbsp;</td><td width='50%' align='left' font-size=\"9pt\"><b>Cliente</b></td><td align='left'>" + name + "</td></tr>";
        Encabezado += "<tr><td>&nbsp;</td><td width='50%' align='left' font-size=\"9pt\"><b>ID fiscal</b></td><td align='left'>" + vatregnum + "</td></tr>";
        Encabezado += "<tr><td>&nbsp;</td><td width='50%' align='left' font-size=\"9pt\"><b>Ubicación</b></td><td align='left'>" + location + "</td></tr>";
        Encabezado += "<tr><td>&nbsp;</td><td width='50%' align='left' font-size=\"9pt\"><b>Página</b></td><td align='left'>" + pagina + "</td></tr>";
        Encabezado += "</table>";
        Encabezado += "</td>";
        Encabezado += "</tr>";
        Encabezado += "</thead>";
        Encabezado += "</table>";
        //strName += "<p font-size='4'>&nbsp;</p>";

        var strName = '';
        strName += "<table width='100%'>";
        strName += "<tr>";
        strName += "<td width='58%'><table width='100%'>";
        strName += "<tr>";
        strName += "<td>&nbsp;</td></tr>";
        strName += "<tr><td font-size=\"9pt\"><b>Representante de ventas   </b></td></tr>";
        strName += "<tr><td font-size=\"9pt\">" + salesrep_aux + "</td></tr>";
        strName += "<tr><td><barcode codetype='code128' value='"+salesrep+"' showtext='false'/></td>";
        strName += "</tr>";
        strName += "</table></td>";
        strName += "<td width='42%'><table width='100%'>";
        strName += "<tr>";
        strName += "<td>&nbsp;</td></tr>";
        strName += "<tr><td font-size=\"9pt\"><b>No. de Serie:   </b></td></tr>";
        strName += "<tr><td font-size=\"9pt\">" + serie + "</td></tr>";
        strName += "<tr><td><barcode codetype='code128' value='"+serie+"' showtext='false'/></td>";
        strName += "</tr>";
        strName += "</table></td>";
        strName += "</tr>";
        strName += "</table>";
        strName += "<p font-size='10'>&nbsp;</p>";

        strName += "<table table-layout='fixed' width='100%' corner-radius='1%'>";
        strName += "<thead>";
        strName += "<tr class='FondoColorOscuro' color=\"#FFFFFF\">";
        strName += "<td width='15%' align='center' font-size=\"9pt\"><b>SKU</b></td>";
        strName += "<td width='30%' align='center' font-size=\"9pt\"><b>Artículo</b></td>";
        strName += "<td width='8%' align='center' font-size=\"9pt\"><b>Cant.</b></td>";
        strName += "<td width='14%' align='center' font-size=\"9pt\"><b>Serie</b></td>";
        strName += "<td width='8%' align='center' font-size=\"9pt\"><b>Tasa</b></td>";
        strName += "<td width='8%' align='center' font-size=\"9pt\"><b>P.U.</b></td>";
        strName += "<td width='8%' align='center' font-size=\"9pt\"><b>Importe</b></td>";
        strName += "</tr>";
        strName += "</thead>";

        for(var i=1;i<itemcount + 1;i++)
        {
            var idItemSearch=salesorder.getLineItemValue('item', 'item', i)*1;
            var itemSearch = nlapiSearchRecord("item",null,
                [
                    ["internalid","is",idItemSearch]
                ],
                [
                    new nlobjSearchColumn("itemid").setSort(false),
                    /*new nlobjSearchColumn("displayname"),
                    new nlobjSearchColumn("salesdescription"),
                    new nlobjSearchColumn("type"),
                    new nlobjSearchColumn("internalid")*/
                ]
            );
            var skuDelItem= itemSearch[0].getValue("itemid")
            //nlapiLogExecution('debug', 'itemSearch', );
            //nlapiLogExecution('debug', 'idItemSearch', idItemSearch );
           // var itemData=nlapiLoadRecord('inventoryitem', idItemSearch);
           // nlapiLogExecution('debug', 'itemData itemid', itemData );
            sku = nlapiEscapeXML(returnBlank(skuDelItem));
            description = nlapiEscapeXML(returnBlank(salesorder.getLineItemValue('item', 'description', i)));
            quantity    = nlapiEscapeXML(returnNumber(salesorder.getLineItemValue('item', 'quantity', i)));
            serie       = nlapiEscapeXML(returnBlank(salesorder.getLineItemValue('item', 'serialnumbers', i)));
            taxrate     = returnNumber(salesorder.getLineItemValue('item', 'taxrate1', i));
            amount      = returnNumber(salesorder.getLineItemValue('item', 'amount', i));
            gross       = returnNumber(salesorder.getLineItemValue('item', 'grossamt', i));

            if(i % 2 == 0)
            {
                trClass = 'FondoColorClaro';
            }
            else
            {
                trClass = 'FondoBlanco';
            }
//hipo leave this beautiful body please                     
            strName     += "<tr class='"+ trClass + "'>";
            strName     += "<td align='left' font-size=\"9pt\">"                + sku   + "</td>";
            strName     += "<td align='left' font-size=\"9pt\">"                + description   + "</td>";
            strName     += "<td align='center' font-size=\"9pt\">"              + quantity      + "</td>";
            strName     += "<td align='center' font-size=\"9pt\">"              + serie         + "</td>";
            strName     += "<td align='right' font-size=\"9pt\">$"              + currencyFormat(taxrate,1)     + "%</td>";
            strName     += "<td align='right' font-size=\"9pt\">$"          + currencyFormat(amount,2)      + "</td>";
            strName     += "<td align='right' font-size=\"9pt\">$"          + currencyFormat(gross,2)           + "</td>";
            strName         += "</tr>";
        }
        strName += "</table>";
        strName += "<p font-size='4'>&nbsp;</p>";

        strName += "<table width='100%'>";
        strName += "<tr>";
        strName += "<td width='76%'>&nbsp;</td>";
        strName += "<td width='24%' align='right'>";
        strName += "<table width='100%'>";
        strName += "<tr><td width='50%' align='right' font-size=\"9pt\"><b>Subtotal</b></td><td width='50%' align='right' font-size=\"9pt\">$" + currencyFormat(subtotal,2) + "</td></tr>";
        strName += "<tr><td width='50%' align='right' font-size=\"9pt\"><b>Impuesto</b></td><td width='50%' align='right' font-size=\"9pt\">$" + currencyFormat(taxtotal,2) + "</td></tr>";
        strName += "<tr><td width='50%' align='right' font-size=\"9pt\"><b>Total</b></td><td width='50%' align='right' font-size=\"9pt\">$" + currencyFormat(total,2) + "</td></tr>";
        strName += "</table>";
        strName +="</td>";
        strName += "</tr>";
        strName += "</table>";
        strName += "<p font-size='15'>&nbsp;</p>";

        if(pagocount > 0)
        {
            strName += "<table width='30%'>";
            strName += "<tr><td font-size=\"9pt\"><b>RECIBO DE PAGO</b></td></tr>";
            strName += "<tr><td font-size=\"6pt\"></td><td align='left'></td></tr>";
            strName += "<tr><td width='10%' font-size=\"9pt\"><b>Total Pagado:</b></td><td>$" + currencyFormat(pagado,2) + "</td></tr>";
            strName += "<tr><td width='10%' font-size=\"9pt\"><b>Total a Pagar:</b></td><td>$" + currencyFormat(pagar,2) + "</td></tr>";
            strName += "</table>";
            strName += "<p font-size='6'>&nbsp;</p>";

            strName += "<table table-layout='fixed' width='100%' corner-radius='1%'>";
            strName += "<thead>";
            strName += "<tr class='FondoColorOscuro' color=\"#FFFFFF\">";
            strName += "<td width='1%' align='left' font-size=\"8pt\"><b>#</b></td>";
            strName += "<td width='5%' align='left' font-size=\"8pt\"><b>Pago</b></td>";
            strName += "<td width='18%' align='left' font-size=\"8pt\"><b>Forma/Tipo de Pago</b></td>";
            strName += "<td width='10%' align='left' font-size=\"8pt\"><b>Fecha del pago</b></td>";
            strName += "<td width='14%' align='left' font-size=\"8pt\"><b>Num. De la Tarjeta</b></td>";
            strName += "<td width='7%' align='left' font-size=\"8pt\"><b>Fecha de<br/>Vencimiento</b></td>";
            strName += "<td width='7%' align='left' font-size=\"8pt\"><b>Num. de<br/>Autorización</b></td>";
            strName += "<td width='9%' align='center' font-size=\"8pt\"><b>Importe</b></td>";
            strName += "</tr>";
            strName += "</thead>";

            for(var i=1;i<pagocount + 1;i++)
            {
                numero      = nlapiEscapeXML(returnBlank(salesorder.getLineItemValue('custpage_datos_pagos', 'custpage_num_linea', i)));
                pago        = nlapiEscapeXML(returnBlank(salesorder.getLineItemText('custpage_datos_pagos', 'custpage_pago_id', i)));
                tipo        = nlapiEscapeXML(returnBlank(salesorder.getLineItemText('custpage_datos_pagos', 'custpage_forma_tipo_de_pago', i)));
                fecha       = nlapiEscapeXML(returnBlank(salesorder.getLineItemValue('custpage_datos_pagos', 'custpage_fecha_pago', i)));
                tarjeta     = nlapiEscapeXML(returnBlank(salesorder.getLineItemValue('custpage_datos_pagos', 'custpage_num_tarjeta', i)));
                vence       = nlapiEscapeXML(returnBlank(salesorder.getLineItemValue('custpage_datos_pagos', 'custpage_fecha_vencimiento', i)));
                autoriza    = nlapiEscapeXML(returnBlank(salesorder.getLineItemValue('custpage_datos_pagos', 'custpage_num_autorizacion', i)));
                importe     = returnNumber(salesorder.getLineItemValue('custpage_datos_pagos', 'custpage_importe', i));
                if(i % 2 == 0)
                {
                    trClass = 'FondoColorClaro';
                }
                else
                {
                    trClass = 'FondoBlanco';
                }
                pago    = stringToArray(pago, 35);
                pago    = pago[1];
                //hipo leave this beautiful body please
                strName     += "<tr class='"+ trClass + "'>";
                strName     += "<td align='left' font-size=\"8pt\">"            + numero        + "</td>";
                strName     += "<td align='left' font-size=\"8pt\">"            + pago          + "</td>";
                strName     += "<td align='left' font-size=\"8pt\">"            + tipo          + "</td>";
                strName     += "<td align='center' font-size=\"8pt\">"          + fecha         + "</td>";
                strName     += "<td align='left' font-size=\"8pt\">"            + tarjeta       + "</td>";
                strName     += "<td align='left' font-size=\"8pt\">"            + vence         + "</td>";
                strName     += "<td align='center' font-size=\"8pt\">"          + autoriza      + "</td>";
                strName     += "<td align='center' font-size=\"8pt\">$"         + currencyFormat(importe,2)         + "</td>";
                strName         += "</tr>";
            }
            strName += "</table>";
        }

        var Pie = '';

        Pie +='<table>';
        Pie += '<tr width="100%">';
        Pie += '<td width="100%" align="center">';
        Pie += "<table class='Tabla2' width='100%' align='center' padding='1' margin='1'>";
        Pie += "<tr><td width='300px' height='110px' font-size=\"60pt\">&nbsp;</td></tr>";
        Pie += "</table>";
        Pie += "<table width='40%' align='center'>";
        Pie += "<tr><td font-size=\"7pt\" align='center'>Sello</td></tr>";
        Pie += "</table>";
        Pie += '</td>';
        Pie += '<td>';
       /* Pie += "<table  align='left'>";
        Pie += "<tr><td width='300px' height='115px' class='AvisoFac'><u><b>IMPORTANTE</b></u> Si requiere CFDi (Factura Electrónica) "+
            " cuenta con 10 días para solicitarla, siempre que se encuentre dentro del mes de compra. "+
            "Si la compra la realizó  dentro de los últimos 5 días del mes, deberá solicitar su CFDi (Factura Electrónica) a más tardar "+
            "el último día hábil del mes de compra. No se realizarán Facturas en meses posteriores a la compra.</td></tr>";
        Pie += '</table>';*/
        Pie += '</td>';
        Pie += '</tr>';
        Pie +='</table>';

        var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
        xml += "<pdf>";
        xml += "<head>";
        xml += "<style>";
        xml += ".AvisoFac{border: 1px solid red; font-size:10px;corner-radius: 10px;} ";
        xml += ".FondoColorOscuro{color:#FFFFFF; background-color:#0070AD;} ";
        xml += ".FondoColorClaro{color:#000000; background-color:#CFE7F5;} ";
        xml += ".FondoBlanco{background-color:#FFFFFF;} ";
        xml += ".Tabla{border: 1 px;}";
        xml += ".Tabla2{border: 0.1 px; corner-radius: 10px;}";
        xml += "</style>";
        xml += "<macrolist>";
        xml += "<macro id=\"myheader\">"    + Encabezado    + "</macro>";
        xml += "<macro id=\"paginas\">"     + Pie           + "</macro>";
        xml += "</macrolist>";
        xml += "</head>";
        xml += "<body font='helvetica' font-size='8' size='letter'  header=\"myheader\" header-height=\"190pt\" footer=\"paginas\" footer-height='80pt'>";
        xml += strName;
        xml += "</body>\n";
        xml += "</pdf>";
        var file        = nlapiXMLToPDF( xml );
        var fileName    = titleForm + ' ' + recordType + ' ' + tranid +'.pdf';
        response.setContentType('PDF',fileName, 'inline');
        response.write(file.getValue());
    }
    catch(e)
    {
        var tituloFallo     = new String();
        var mensajeFallo    = new String();
        var data            = new Object();
        var identacion      = '<td>&nbsp;</td><td>&nbsp;</td><td>á�…</td>';
        if ( e instanceof nlobjError )
        {
            var ecode        = returnBlank(e.getCode());
            var edetails     = returnBlank(e.getDetails());
            var eid          = returnBlank(e.getId());
            var einternalid  = returnBlank(e.getInternalId());
            var estacktrace  = returnBlank(e.getStackTrace());
            estacktrace  = estacktrace.join();
            var euserevent   = returnBlank(e.getUserEvent());
            tituloFallo     += "<b>Ha ocurrido un error, debido a las siguientes razones:</b>";
            mensajeFallo    += "<p>&nbsp;</p>";
            mensajeFallo    += '<table class=\"text\">';
            mensajeFallo    += "<tr>" + identacion + "<td>" + '<b>Error Code: </b>'         + "</td><td>" + ecode       +"</td></tr>";
            mensajeFallo    += "<tr>" + identacion + "<td>" + '<b>Error Details: </b>'      + "</td><td>" + edetails    +"</td></tr>";
            mensajeFallo    += "<tr>" + identacion + "<td>" + '<b>Error ID: </b>'           + "</td><td>" + eid         +"</td></tr>";
            mensajeFallo    += "<tr>" + identacion + "<td>" + '<b>Error Internal ID: </b>'  + "</td><td>" + einternalid +"</td></tr>";
            mensajeFallo    += "<tr>" + identacion + "<td>" + '<b>Error Stacktrace: </b>'   + "</td><td>" + estacktrace +"</td></tr>";
            mensajeFallo    += "<tr>" + identacion + "<td>" + '<b>Error User Event: </b>'   + "</td><td>" + euserevent  +"</td></tr>";
            mensajeFallo    += '</table>';
            nlapiLogExecution( 'ERROR', 'Error Code',ecode);
            nlapiLogExecution( 'ERROR', 'Error Detail',edetails);
            nlapiLogExecution( 'ERROR', 'Error ID',eid);
            nlapiLogExecution( 'ERROR', 'Error Internal ID',einternalid);
            nlapiLogExecution( 'ERROR', 'Error Stacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'Error User Event',euserevent);
        }
        else
        {
            var errorString     = e.toString();
            tituloFallo         = '<b>Ha ocurrido un error, debido a la siguiente raz&oacute;n:</b>';
            mensajeFallo        += "<p>&nbsp;</p>";
            mensajeFallo        += '<table class=\"text\">';
            mensajeFallo        += "<tr>" + identacion + "<td>" + '<b>Unexpected Error: </b>' + "</td><td>" + errorString +"</td></tr>";
            mensajeFallo        += '</table>';
            nlapiLogExecution( 'ERROR', 'Unexpected Error',errorString );
        }
        mensajeFallo += "<br>Consulte a Soporte T&eacute;cnico y mueste este mensaje.";
        mensajeFallo += "<br><br>Puede continuar navegando en <b>NetSuite</b>";
        data.titleForm                      = titleForm;
        data.exito                          = 'F';
        data.tituloFallo                    = tituloFallo;
        data.mensajeFallo                   = mensajeFallo;
        data                                = JSON.stringify(data);
        data                                = Base64.encode(data);
        var params_handler_error            = new Array();
        params_handler_error['data']    = data;
        nlapiSetRedirectURL('SUITELET','customscript_orden_venta_pdf_he', 'customdeploy_orden_venta_pdf_he', false, params_handler_error);
        nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
    }
}