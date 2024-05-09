function Orden_Compra_PDF(request, response) {
    var Base64 = new MainBase64();
    var data = request.getParameter('data');
    data = Base64.decode(data);
    data = stringToArray(data, 10);
    var recordType = returnBlank(data[0]);
    var recordId = returnBlank(data[1]);
    var host = returnBlank(data[2]);
    var titleForm = 'Orden de Compra';

    try {
        var compaynyInfo = nlapiLoadConfiguration('companyinformation');
        var companyInfoName = returnBlank(compaynyInfo.getFieldValue('legalname'));
        var companyInfoAddress1 = returnBlank(compaynyInfo.getFieldValue('address1'));
        var companyInfoAddress2 = returnBlank(compaynyInfo.getFieldValue('address2'));
        var companyInfoCity = returnBlank(compaynyInfo.getFieldValue('city'));
        var companyInfoState = returnBlank(compaynyInfo.getFieldValue('state'));
        var companyInfoCountry = returnBlank(compaynyInfo.getFieldText('country'));
        var companyInfoZip = returnBlank(compaynyInfo.getFieldValue('zip'));
        var companyInfoPhone = returnBlank(compaynyInfo.getFieldValue('addrphone'));
        var companyInfoRFC = returnBlank(compaynyInfo.getFieldValue('employerid'));
        var companyInfoCurrency = returnBlank(compaynyInfo.getFieldText('basecurrency'));
        //nlapiLogExecution('debug', 'title', companyInfoCurrency);
        var companyInfoLogoId = nlapiEscapeXML(returnBlank(compaynyInfo.getFieldValue('formlogo')));
        var companyInfoLogoObj = new Object();
        var companyInfoLogoURL = '';
        if (companyInfoLogoId != '') {
            companyInfoLogoObj = nlapiLoadFile(companyInfoLogoId);
        } else {
            var filtersFile = new Array();
            filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'IMR_NO_LOGO.png'));
            var searchFile = returnBlank(nlapiSearchRecord('file', null, filtersFile, null));
            var NO_LOGO_ID = searchFile[0].getId();
            companyInfoLogoObj = nlapiLoadFile(NO_LOGO_ID);
        }

        if (nlapiGetContext().getEnvironment() == "SANDBOX") {
            companyInfoLogoURL = '/core/media/media.nl?id=2576941&c=3367613&h=EVQpFOUkyARO0Xup5ue_KhGuik1V9R-xb--eYG7FiF_7YPaV'
        }
        else {
            companyInfoLogoURL = '/core/media/media.nl?id=2576941&c=3367613&h=EVQpFOUkyARO0Xup5ue_KhGuik1V9R-xb--eYG7FiF_7YPaV'
        }
        
        companyInfoLogoURL = stringToArray(companyInfoLogoURL, 38);//Se convierte a un arreglo 
        companyInfoLogoURL = companyInfoLogoURL.join('&amp;'); //Se rereemplaza & por &amp;

        companyInfoLogoURL = "src='" + host + companyInfoLogoURL + "'/";

        var companyAddress = companyInfoAddress1 + ', ' + companyInfoAddress2 + ', ' + companyInfoCity + ', ' + companyInfoState + ', ' + companyInfoCountry + ', ' + companyInfoZip;

        var transaccion = nlapiLoadRecord(recordType, recordId);
        var filtersTransaction = new Array();
        filtersTransaction.push(new nlobjSearchFilter('internalid', null, 'is', recordId));
        var searchTransaction = returnBlank(nlapiSearchRecord('purchaseorder', 'customsearch_orden_compra_data', filtersTransaction, null));
        var Prov_calle = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('address1', 'vendor')));
        var Prov_colonia = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('address2', 'vendor')));
        var Prov_ciudad = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('city', 'vendor')));
        var Prov_estado = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('state', 'vendor')));
        var Prov_pais = nlapiEscapeXML(returnBlank(searchTransaction[0].getText('country', 'vendor')));
        var Prov_cp = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('zip', 'vendor')));
        var Prov_contacto = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('contact', 'vendor')));
        var Prov_telefono = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('phone', 'vendor')));
        //var Comp_direccion            = nlapiEscapeXML(returnBlank(companyAddress));
        var empleado = transaccion.getFieldValue('employee');
        var Comp_contacto = nlapiEscapeXML(returnBlank(transaccion.getFieldText('employee')));
        var Comp_telefono = "";
        try {
            Comp_telefono = nlapiLookupField('employee', empleado, 'phone') || '';
        } catch (e) {
            Comp_telefono = '';
        }
        var no_orden = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('tranid')));
        var vendor_name = nlapiEscapeXML(returnBlank(searchTransaction[0]).getText('entity'))
        var no_cotizacion = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('custbody_cotizacion')));
        var fecha_pedido = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('trandate')));
        var fecha_entrega = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('custbody_fcha_ent_compromiso')));
        // var iva = returnNumber(Math.abs(searchTransaction[0].getValue('taxtotal'))); // Changed from the transaction record value
        var iva = returnNumber(Math.abs(transaccion.getFieldValue('taxtotal')));

        var cond_pago = nlapiEscapeXML(returnBlank(searchTransaction[0].getText('terms', 'vendor')));
        var moneda = nlapiEscapeXML(returnBlank(searchTransaction[0].getText('currency')));
        var exchange_rate = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('exchangerate')));

        //nlapiLogExecution('debug', 'exchange_rate', exchange_rate);
        if (moneda != companyInfoCurrency)
            var total = returnNumber(searchTransaction[0].getValue('fxamount'));
        else if (moneda == companyInfoCurrency)
            var total = returnNumber(searchTransaction[0].getValue('total'));

        var subtotal = total - iva;
        var simbolo = '';
        if (moneda == 'Pesos') {
            simbolo = "$";
        }
        if (moneda == "Euro") {
            simbolo = "€";
        }
        var incoterm = nlapiEscapeXML(returnBlank(searchTransaction[0].getValue('incoterm')));
        var envio = 0;

        var renglon = Prov_calle + ", ";
        if (Prov_calle == '') {
            renglon = Prov_colonia + "<br/>";
            if (Prov_colonia == '') {
                renglon = '<br/>';
            }
        } else {
            renglon += Prov_colonia + "<br/>";
            if (Prov_colonia == '') {
                renglon = Prov_calle;
            }
        }

        var renglon2 = Prov_ciudad + ", ";
        if (Prov_ciudad == '') {
            renglon2 = Prov_estado + "<br/>";
            if (Prov_estado == '') {
                renglon2 = '<br/>';
            }
        } else {
            renglon2 += Prov_estado + "<br/>";
            if (Prov_estado == '') {
                renglon2 = Prov_ciudad;
            }
        }

        var renglon3 = Prov_pais + ", ";
        if (Prov_pais == '') {
            renglon3 = Prov_cp + "<br/>";
            if (Prov_cp == '') {
                renglon3 = '<br/>';
            }
        } else {
            renglon3 += Prov_cp + "<br/>";
            if (Prov_cp == '') {
                renglon3 = Prov_pais;
            }
        }

        nlapiLogExecution('DEBUG', 'Transaction data', JSON.stringify({
            'currency': moneda,
            'exchange_rate': exchange_rate,
            'calculatedSubtotal': subtotal,
            'taxtotal': iva,
            'total': total
        }));
        var numberLines = transaccion.getLineItemCount('expense');//obtiene las lineas de la subtab expense
        var numberLinesItem=transaccion.getLineItemCount('item');
        var Encabezado = '';

        Encabezado += "<p align='center'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "><br/></p>";
        Encabezado += "<p align='center' font-size=\"14pt\"><b>ORDEN DE COMPRA</b></p>";
        

        var Encabezado2 = '';
        Encabezado2 += "<table width='100%'>";
        Encabezado2 += "<tr>";
        Encabezado2 += "<td align='center'><img width=\"70%\" height=\"70%\" " + companyInfoLogoURL + "></td>";
        Encabezado2 += "</tr>";
        Encabezado2 += "</table>";

        var strName = '';
        
        strName += "<table width='100%'>";
        strName += "<tr>";
        strName += "<td colspan='4'><b>PROVEEDOR:   </b>" + vendor_name + "</td>";
        strName += "<td colspan='4'><b>DIRECCION DE ENTREGA:</b></td>";
        strName += "<td colspan='2'>&nbsp;</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4' margin-right='20'><b>Dirección:   </b>" + renglon + renglon2 + renglon3 + "</td>";
        strName += "<td colspan='4' margin-right='15'>" + companyInfoAddress1 + ", " + companyInfoAddress2 + "<br/>" + companyInfoCity + ", " + companyInfoState + "<br/>" + companyInfoCountry + ", " + companyInfoZip + "</td>";
        strName += "<td colspan='2'><b>No DE ORDEN DE COMPRA</b></td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'><b>Contacto:   </b>" + Prov_contacto + "</td>";
        strName += "<td colspan='4'>&nbsp;</td>";
        strName += "<td colspan='2' font-size=\"10pt\"><b>" + no_orden + "</b></td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='10'><b>Teléfono:   </b>" + Prov_telefono + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='10'>&nbsp;</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='8'><b>COMPRADOR</b></td>";
        strName += "<td colspan='2'><b>COTIZACIÓN</b></td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'><b>Contacto   </b>" + Comp_contacto + "</td>";
        strName += "<td colspan='4'>&nbsp;</td>";
        strName += "<td colspan='2'>" + no_cotizacion + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='10'><b>Teléfono   </b>" + Comp_telefono + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='8'>&nbsp;</td>";
        strName += "<td colspan='2'><b>RESUMEN</b></td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='8'>&nbsp;</td>";
        strName += "<td>Subtotal</td>";
        strName += "<td align='right' margin-left='-5'>" + currencyFormat(subtotal, 2, simbolo) + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'><b>FECHA DE PEDIDO</b></td>";
        strName += "<td colspan='4'><b>FECHA DE ENTREGA COMPROMISO</b></td>";
        strName += "<td border-bottom='1'>IVA 16%</td>";
        strName += "<td align='right' border-bottom='1' margin-left='-5'>" + currencyFormat(iva, 2, simbolo) + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'>" + fecha_pedido + "</td>";
        strName += "<td colspan='4'>" + fecha_entrega + "</td>";
        strName += "<td><b>TOTAL</b></td>";
        strName += "<td align='right' margin-left='-5'><b>" + currencyFormat(total, 2, simbolo) + "</b></td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='10'>&nbsp;</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'><b>CONDICIONES DE PAGO</b></td>";
        strName += "<td><b>MONEDA</b></td>";
        strName += "<td><b>INCOTERM</b></td>";
        strName += "<td colspan='4'>&nbsp;</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'>" + cond_pago + "</td>";
        strName += "<td>" + moneda + "</td>";
        strName += "<td>" + incoterm + "</td>";
        strName += "<td colspan='4'>&nbsp;</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='10'>&nbsp;</td>";
        strName += "</tr>";
        
        if(searchTransaction.length>0 && numberLinesItem != 0){  
            strName += "<tr>";
            strName += "<td align='center' colspan='10'><b>Articulos</b></td>";
            strName += "</tr>";
            strName += "<tr>";
            strName += "<td colspan='10'>";
            strName += "<table table-layout='fixed' width='100%' border='1'>";
            strName += "<thead>";
            strName += "<tr>";
            strName += "<td width='50%' border='0.5'><b>Articulo</b></td>";
            strName += "<td width='10%' border='0.5'><b>Unidades</b></td>";
            strName += "<td width='10%' border='0.5'><b>Cantidad</b></td>";
            strName += "<td width='15%' border='0.5'><b>Precio Unit.</b></td>";
            strName += "<td width='15%' border='0.5'><b>Precio Tot.</b></td>";
            strName += "</tr>";
            strName += "</thead>"; 
            for (var x = 1; x < searchTransaction.length; x++) {
                var articulo = nlapiEscapeXML(returnBlank(searchTransaction[x].getText('item')));
                var descripcion = nlapiEscapeXML(returnBlank(searchTransaction[x].getValue('displayname', 'item')));
                var unidades = returnBlank(searchTransaction[x].getValue('unit'));
                var cantidad = returnNumber(searchTransaction[x].getValue('quantity'));
                
                if (cantidad * 1 < 0)
                    cantidad = cantidad * -1
                var precio_uni = returnNumber(searchTransaction[x].getValue('rate')) / exchange_rate;
                var precio_tot = returnNumber(searchTransaction[x].getValue('fxamount'));
                if (precio_tot * 1 < 0)
                    precio_tot = precio_tot * -1
                if(unidades!=''){
                    strName += "<tr>";
                    strName += "<td width='50%' border='0.5'>" + articulo + " " + descripcion + "</td>";
                    strName += "<td width='10%' border='0.5'>" + unidades + "</td>";
                    strName += "<td width='10%' border='0.5'>" + cantidad + "</td>";
                    strName += "<td width='15%' border='0.5'>" + currencyFormat(precio_uni, 2, simbolo) + "</td>";
                    strName += "<td width='15%' border='0.5'>" + currencyFormat(precio_tot, 2, simbolo) + "</td>";
                    strName += "</tr>";
                }
                
            }
            strName += "</table>";
            strName += "</td>";
            strName += "</tr>";  
        }
                
        //Gastos
        
        if (numberLines > 0) {
            strName += "<tr>";
            strName += "<td align='center' colspan='10'><b>Gastos</b></td>";
            strName += "</tr>";
            strName += "<tr>";
            strName += "<td colspan='10'>";
            strName += "<table table-layout='fixed' width='100%' border='1'>";
            strName += "<thead>";
            strName += "<tr>";
            strName += "<td width='50%' border='0.5'><b>Memo</b></td>";
            strName += "<td width='20%' border='0.5'><b>Cuenta</b></td>";
            strName += "<td width='15%' border='0.5'><b>Categoria</b></td>";
            strName += "<td width='15%' border='0.5'><b>Monto</b></td>";
            strName += "</tr>";
            strName += "</thead>";
            for (i = 1; i <= numberLines; i++) {
                var cuenta = transaccion.getLineItemValue('expense', 'account_display', i) 
                var monto = transaccion.getLineItemValue('expense', 'amount', i);
                var categoria = transaccion.getLineItemValue('expense', 'category_display', i);
                //var location = transaccion.getLineItemValue('expense', 'location_display', i);
                var memo = transaccion.getLineItemValue('expense', 'memo', i);
                strName += "<tr>";
                strName += "<td width='50%' border='0.5' align='left'>" + memo + "</td>";
                strName += "<td width='20%' border='0.5' align='left'>" + cuenta + "</td>";
                strName += "<td width='15%' border='0.5' align='left'>" + categoria + "</td>";
                strName += "<td width='15%' border='0.5' align='right'>" + monto + "</td>";
                strName += "</tr>";
                    
            }
            strName += "</table>";
            strName += "</td>";
            strName += "</tr>";
            strName += "<tr>";
            strName += "<td align='right' colspan='10' font-size=\"10pt\">&nbsp;</td>";
            strName += "</tr>";
        }  
        //Fin gastos
        strName += "<tr>";
        strName += "<td align='right' colspan='10'>Subtotal   " + currencyFormat(subtotal, 2, simbolo) + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td align='right' colspan='10'>Envío   " + currencyFormat(envio, 2, simbolo) + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td align='right' colspan='10'>Impuesto   " + currencyFormat(iva, 2, simbolo) + "</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td align='right' colspan='10' font-size=\"10pt\"><b>TOTAL   " + currencyFormat(total, 2, simbolo) + "</b></td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td align='right' colspan='10' font-size=\"10pt\">&nbsp;</td>";
        strName += "</tr>";        
        
        
        strName += "<tr>";
        strName += "<td colspan='10'>'El Proveedor' garantiza el cumplimiento de la entrega del producto o servicio " +
            "en la fecha estipulada con anterioridad en la presente orden de compra, " +
            "cualquier incumplimiento con la entrega que ampara la misma, " +
            "generará al 'Proveedor' por concepto de pena convencional, un 5% (cinco por ciento) " +
            " por día de atraso que transcurra del total que ampara la orden de compra solicitada, " +
            "cantidad que deberá cuantificarse al momento mismo de la entrega " +
            "que realice del producto o servicio al 'comprador' y a su entera satisfacción, " +
            "y será descontada del monto total de la presente orden compra. " +
            "Por lo que 'el Proveedor' manifiesta su absoluta conformidad que para el caso " +
            "de que no entregue en tiempo el servicio o producto solicitado, " +
            "se le descuente del remanente  por cubrir del total de la orden de compra la cantidad " +
            "resultante por día transcurrido y únicamente reciba la cantidad resultante por su servicio o producto.</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td align='right' colspan='10' font-size=\"18pt\">&nbsp;</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'>Solicita:</td>";
        strName += "<td colspan='3'>Inmediato Superior:</td>";
        strName += "<td colspan='3'>Autoriza:</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4' font-size=\"18pt\" border-bottom='1' margin-right='30'>&nbsp;</td>";
        strName += "<td colspan='3' font-size=\"18pt\" border-bottom='1' margin-right='30'>&nbsp;</td>";
        strName += "<td colspan='3' font-size=\"18pt\" border-bottom='1' margin-right='10'>&nbsp;</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'>Nombre:</td>";
        strName += "<td colspan='3'>Nombre:</td>";
        strName += "<td colspan='3'>Nombre:</td>";
        strName += "</tr>";
        strName += "<tr>";
        strName += "<td colspan='4'>Fecha:</td>";
        strName += "<td colspan='3'>Fecha:</td>";
        strName += "<td colspan='3'>Fecha:</td>";
        strName += "</tr>";
        strName += "</table>";

        var thermomix = nlapiLoadFile(401096);
        thermomixURL = thermomix.getURL();
        thermomixURL = stringToArray(thermomixURL, 38);
        thermomixURL = thermomixURL.join('&amp;');
        thermomixURL = "src='" + host + thermomixURL + "'/";

        var Pie = '';
      
        
        Pie += "<p align='center' font-size='8pt'> Vorwerk México S de RL de CV | Vito Alessio Robles 38 Col. Florida, Álvaro Obregón C.P. 01030 CDMX, México. <br/> RFC: VME060622GL2 Tel: 800 200 1121</p>";

        var OpenSansExtraBoldURL = getFileDetails('name', 'OpenSans-ExtraBold.ttf', host, 'url');
        var OpenSansExtraBoldItalicURL = getFileDetails('name', 'OpenSans-ExtraBoldItalic.ttf', host, 'url');
        var OpenSansLightURL = getFileDetails('name', 'OpenSans-Light.ttf', host, 'url');
        var OpenSansLightItalicURL = getFileDetails('name', 'OpenSans-LightItalic.ttf', host, 'url');
        var OpenSansSemiBoldURL = getFileDetails('name', 'OpenSans-Semibold.ttf', host, 'url');
        var OpenSansSemiBoldItalicURL = getFileDetails('name', 'OpenSans-SemiboldItalic.ttf', host, 'url');
        var OpenSansRegularURL = getFileDetails('name', 'OpenSans-Regular.ttf', host, 'url');
        var OpenSansBoldURL = getFileDetails('name', 'OpenSans-Bold.ttf', host, 'url');
        var OpenSansBoldItalicURL = getFileDetails('name', 'OpenSans-BoldItalic.ttf', host, 'url');
        var OpenSansItalicURL = getFileDetails('name', 'OpenSans-Italic.ttf', host, 'url');

        var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
        xml += "<pdfset>";
        xml += "<pdf>";
        xml += "<head>";
        xml += "<link name=\"OpenSansExtraBold\"    type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansExtraBoldURL + "\" src-bold=\"" + OpenSansExtraBoldURL + "\"  src-bolditalic=\"" + OpenSansExtraBoldItalicURL + "\" src-italic=\"" + OpenSansExtraBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansLight\"        type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansLightURL + "\" src-bold=\"" + OpenSansLightURL + "\"  src-bolditalic=\"" + OpenSansLightItalicURL + "\" src-italic=\"" + OpenSansLightItalicURL + "\"/>";
        xml += "<link name=\"OpenSansSemiBold\"     type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansSemiBoldURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansSemiBoldItalicURL + "\" src-italic=\"" + OpenSansSemiBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansRegular\"      type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansRegularURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansBoldItalicURL + "\" src-italic=\"" + OpenSansItalicURL + "\"/>";
        xml += "<style>";
        xml += ".FondoColorOscuro{color:#FFFFFF; background-color:#0070AD;} ";
        xml += ".FondoColorClaro{color:#000000; background-color:#CFE7F5;} ";
        xml += ".FondoBlanco{background-color:#FFFFFF;} ";
        xml += ".Tabla{border: 1 px;}";
        xml += ".Tabla2{border: 0.1 px; corner-radius: 10px;}";
        xml += "</style>";
        xml += "<macrolist>";
        xml += "<macro id=\"myheader\">" + Encabezado + "</macro>";
        xml += "<macro id=\"paginas\">" + Pie + "</macro>";
        xml += "</macrolist>";
        xml += "</head>";
        xml += "<body font-family='OpenSansRegular' font-size='7' size='letter'  header=\"myheader\" header-height=\"140pt\" footer=\"paginas\" footer-height='40pt'>";
        xml += strName;
        xml += "</body>\n";
        xml += "</pdf>";
        //nlapiLogExecution('debug', 'xml', strName);
        /*var fileTerms = nlapiLoadFile('User Documents/Terminos_y_condiciones_2021.pdf');
        var fileContentsValue64 = fileTerms.getValue();
        var linkFile = 'User Documents/Terminos_y_condiciones_2021.pdf';
        var fileContentsValue = nlapiEncrypt(fileContentsValue64, 'base64');
        nlapiLogExecution('debug', 'file_url', fileContentsValue);*/


        /*var pic1 = nlapiLoadFile('User Documents/Terminos y condiciones 2021 (1)-1.jpg');
        var pic1_url = pic1.getURL();
        pic1_url = stringToArray(pic1_url, 38);
        pic1_url = pic1_url.join('&amp;');
        pic1_url = "src='" + host + pic1_url + "'/";*/


        var xml2 = xmlString2();
        xml += "<pdf>";
        xml += "<head>";
        xml += "<link name=\"OpenSansExtraBold\"    type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansExtraBoldURL + "\" src-bold=\"" + OpenSansExtraBoldURL + "\"  src-bolditalic=\"" + OpenSansExtraBoldItalicURL + "\" src-italic=\"" + OpenSansExtraBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansLight\"        type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansLightURL + "\" src-bold=\"" + OpenSansLightURL + "\"  src-bolditalic=\"" + OpenSansLightItalicURL + "\" src-italic=\"" + OpenSansLightItalicURL + "\"/>";
        xml += "<link name=\"OpenSansSemiBold\"     type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansSemiBoldURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansSemiBoldItalicURL + "\" src-italic=\"" + OpenSansSemiBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansRegular\"      type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansRegularURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansBoldItalicURL + "\" src-italic=\"" + OpenSansItalicURL + "\"/>";
        xml += "<style>";
        xml += ".FondoColorOscuro{color:#FFFFFF; background-color:#0070AD;} ";
        xml += ".FondoColorClaro{color:#000000; background-color:#CFE7F5;} ";
        xml += ".FondoBlanco{background-color:#FFFFFF;} ";
        xml += ".Tabla{border: 1 px;}";
        xml += ".Tabla2{border: 0.1 px; corner-radius: 10px;}";
        xml += "</style>";
        xml += "<macrolist>";
        xml += "<macro id=\"myheader1\">" + Encabezado2 + "</macro>";
        xml += "</macrolist>";
        xml += "</head>";
        xml += "<body font-family='OpenSansRegular' font-size='7' header=\"myheader1\" header-height=\"80pt\" footer=\"nlfooter\" footer-height=\"20pt\" padding=\"0.5in 0.5in 0.5in 0.5in\" size=\"Letter\" >\n" +
            "    &nbsp;\n"
        var xmlp1 = xmlStringPage1();
        xml += xmlp1
        xml += "</pdf>";

        xml += "<pdf>";
        xml += "<head>";
        xml += "<link name=\"OpenSansExtraBold\"    type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansExtraBoldURL + "\" src-bold=\"" + OpenSansExtraBoldURL + "\"  src-bolditalic=\"" + OpenSansExtraBoldItalicURL + "\" src-italic=\"" + OpenSansExtraBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansLight\"        type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansLightURL + "\" src-bold=\"" + OpenSansLightURL + "\"  src-bolditalic=\"" + OpenSansLightItalicURL + "\" src-italic=\"" + OpenSansLightItalicURL + "\"/>";
        xml += "<link name=\"OpenSansSemiBold\"     type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansSemiBoldURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansSemiBoldItalicURL + "\" src-italic=\"" + OpenSansSemiBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansRegular\"      type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansRegularURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansBoldItalicURL + "\" src-italic=\"" + OpenSansItalicURL + "\"/>";
        xml += "<style>";
        xml += ".FondoColorOscuro{color:#FFFFFF; background-color:#0070AD;} ";
        xml += ".FondoColorClaro{color:#000000; background-color:#CFE7F5;} ";
        xml += ".FondoBlanco{background-color:#FFFFFF;} ";
        xml += ".Tabla{border: 1 px;}";
        xml += ".Tabla2{border: 0.1 px; corner-radius: 10px;}";
        xml += "</style>";
        xml += "<macrolist>";
        xml += "<macro id=\"myheader2\">" + Encabezado2 + "</macro>";
        xml += "</macrolist>";
        xml += "</head>";
        xml += "<body font-family='OpenSansRegular' font-size='7' header=\"myheader2\" header-height=\"80pt\" footer=\"paginas\" footer-height='80pt' padding=\"0.5in 0.5in 0.5in 0.5in\" size=\"Letter\">\n"
        var xmlp2 = xmlStringPage2();
        xml += xmlp2
        xml += "</pdf>";

        xml += "<pdf>";
        xml += "<head>";
        xml += "<link name=\"OpenSansExtraBold\"    type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansExtraBoldURL + "\" src-bold=\"" + OpenSansExtraBoldURL + "\"  src-bolditalic=\"" + OpenSansExtraBoldItalicURL + "\" src-italic=\"" + OpenSansExtraBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansLight\"        type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansLightURL + "\" src-bold=\"" + OpenSansLightURL + "\"  src-bolditalic=\"" + OpenSansLightItalicURL + "\" src-italic=\"" + OpenSansLightItalicURL + "\"/>";
        xml += "<link name=\"OpenSansSemiBold\"     type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansSemiBoldURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansSemiBoldItalicURL + "\" src-italic=\"" + OpenSansSemiBoldItalicURL + "\"/>";
        xml += "<link name=\"OpenSansRegular\"      type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansRegularURL + "\" src-bold=\"" + OpenSansBoldURL + "\"  src-bolditalic=\"" + OpenSansBoldItalicURL + "\" src-italic=\"" + OpenSansItalicURL + "\"/>";
        xml += "<style>";
        xml += ".FondoColorOscuro{color:#FFFFFF; background-color:#0070AD;} ";
        xml += ".FondoColorClaro{color:#000000; background-color:#CFE7F5;} ";
        xml += ".FondoBlanco{background-color:#FFFFFF;} ";
        xml += ".Tabla{border: 1 px;}";
        xml += ".Tabla2{border: 0.1 px; corner-radius: 10px;}";
        xml += "</style>";
        xml += "<macrolist>";
        xml += "<macro id=\"myheader3\">" + Encabezado2 + "</macro>";
        xml += "</macrolist>";
        xml += "</head>";
        xml += "<body font-family='OpenSansRegular' font-size='7' header=\"myheader3\" header-height=\"80pt\" footer=\"nlfooter\" footer-height=\"20pt\" padding=\"0.5in 0.5in 0.5in 0.5in\" size=\"Letter\">\n";
        var xmlp3 = xmlStringPage3();
        xml += xmlp3
        xml += "</pdf>";
        xml += "</pdfset>";

        var file = nlapiXMLToPDF(xml);
        var fileName = titleForm + ' ' + recordType + ' ' + no_orden + '.pdf';
        response.setContentType('PDF', fileName, 'inline');
        response.write(file.getValue());
    } catch (e) {
        nlapiLogExecution('Error', 'Error', e);
        var customscript = 'customscript_orden_servicio_he';
        var customdeploy = 'customdeploy_orden_servicio_he';
        var HE_Catch_UE = Generic_HE_Catch_UE(e, recordType, recordId, titleForm, request);
        var HE_Params = new Array();
        HE_Params['data'] = HE_Catch_UE;
        nlapiSetRedirectURL('SUITELET', customscript, customdeploy, false, HE_Params);
    }
}

function xmlString2() {
    var xml = '';
    xml += "<body>";
    xml += "<b>Terminos y Condiciones de las Ordenes de Compra emitidas por Vorwerk Mexico</b><br/>";
    xml += "<b>I. PUNTUALIDAD </b><br/>";
    xml += "La entrega de los artículos, partes o la ejecución de los servicios se efectuará o ejecutará en el tiempo " +
        "especificado en el cuerpo de esta Orden de Compra.<br/><br/>";
    xml += "<b>II. ACEPTACION </b><br/>";
    xml += "Esta Orden de Compra se considera obligatoria una vez aceptada por escrito o por la entrega de los " +
        "artículos pedidos, o por el suministro de los servicios especificados, o por el comienzo de un trabajo o " +
        "por la manufactura de los artículos señalados en la Orden de Compra.<br/>";
    xml += "También se considera obligatoria, si la misma no es rechazada, por parte del proveedor, por escrito " +
        "dentro de los 3 días siguientes a su recepción.<br/><br/>"
    xml += "<b>III. MODIFICACIONES</b><br/>";
    xml += "Cualquier modificación o cambio a esta Orden de Compra debe ser indicado por escrito y firmado por un " +
        "representante autorizado del Comprador. El Comprador solamente estudiará las solicitudes de cambios que haga " +
        "el Proveedor, si éstas se presentan por escrito. El Comprador debe aprobar el cambio por escrito para que " +
        "éste sea válido, dentro de las 48 horas siguientes a la recepción de esta orden de compra.<br/><br/>";
    xml += "<b>IV. RESPONSABILIDAD EN RELACION A EMPAQUES, IDENTIFICACIONES Y ENTREGAS</b><br/>";
    xml += "A menos que se indique lo contrario el Proveedor deberá:<br/>";
    xml += "a) Empacar y marcar el material objeto de esta Orden de Compra, asegurando su entrega, libre de daños " +
        "y desperfectos y de acuerdo con los requerimientos de calidad del producto, acordados, de forma que se " +
        "asegure la integridad del producto y empaque. Es responsabilidad del proveedor utilizar y entregar con " +
        "empaque independiente que garantice la integridad del producto. <br/>";
    xml += "b) Procesar los documentos de embarque, de acuerdo con las indicaciones del Comprador.<br/><br/>";
    xml += "<b>V. EMBARQUES ESPECIALES</b><br/>";
    xml += "Si el Proveedor no cumple con todos los requerimientos de entrega contenidos en esta Orden de Compra, el\n" +
        "Comprador tendrá el derecho de exigir la misma entrega mediante un transporte mas rápido (expeditado) al " +
        "acordado originalmente o embarque aéreo y el Proveedor, deberá correr con los gastos de transportación " +
        "extraordinaria o en su caso reembolsará al Comprador cualquier costo que ocasione dicho transporte, a " +
        "menos que la falta del Proveedor se deba a caso fortuito o de fuerza mayor debidamente acreditado. El " +
        "Comprador está autorizado a deducir de cualquier pago que deba hacer al Proveedor, cualquier costo de los " +
        "mencionados en este párrafo.<br/><br/>";
    xml += "<b>VI. PROGRAMACIÓN DE ENTREGAS ( CUANDO ASI SE ESPECIFIQUE)</b><br/>";
    xml += "Cuando se haya especificado en la Orden de Compra que las entregas se hagan de acuerdo con fechas " +
        "específicas, el Proveedor no deberá fabricar o ensamblar o adquirir más de los materiales necesarios para " +
        "cumplir con estos programas, en el concepto de que, si violara esta indicación, asumirá cualquier " +
        "responsabilidad que de ello se derive.<br/><br/>";
    xml += "<b>VII. INSPECCION</b><br/>";
    xml += "El Comprador tendrá derecho de inspeccionar y aprobar todos los materiales, herramental especial, " +
        "artículos y calidad de trabajo, en todo tiempo y lugar. El Proveedor aportará y mantendrá un sistema de " +
        "inspección adecuado, que cubra los materiales, métodos y fabricación y herramental especial. El Proveedor " +
        "mantendrá a la disposición del Comprador un registro de las inspecciones que se hagan a todo trabajo y " +
        "material, durante cualquier período de tiempo que se especifique en la misma, el comprador notificara al " +
        "Proveedor de la existencia de variación de las características acordadas y podrá rechazar (ver VIII Rechazos). <br/><br/>";


    xml += "<b>VIII. RECHAZOS</b><br/>";
    xml += "En caso de que cualquier artículo o servicio prestado sea defectuoso en su material o calidad de trabajo o" +
        "que de cualquier manera no esté de conformidad con lo establecido en esta Orden de Compra, incluyendo el " +
        "tiempo de entrega, el Comprador tendrá el derecho ya sea de rechazar su entrega, de solicitar la corrección" +
        " necesaria o demandar compensación por la afectación que pudiera derivar de dicho rechazo. En estos casos, " +
        "todos los gastos que la corrección o afectación implique, serán por cuenta exclusiva del Proveedor. La " +
        "corrección será hecha inmediatamente después de que el Comprador la solicite. En caso de que el Proveedor " +
        "no cumpla con lo antes establecido, el Comprador podrá:\n<br/>";
    xml += "a) Reponer o corregir tales materiales o servicios, cargando al Proveedor el costo correspondiente, mismo" +
        "que podrá deducir de cualquier pago que deba hacer el propio Proveedor.<br/>";
    xml += "b) Emitir una cancelación por incumplimiento (ver término XIII \"Cancelación por incumplimiento\").<br/><br/>";
    xml += "<b>IX. GARANTIA</b><br/>";
    xml += "El Proveedor garantiza que los materiales, propiedades o servicios cubiertos por esta Orden de Compra, " +
        "serán suministrados de acuerdo con las especificaciones o muestras proporcionadas por el Comprador y que los " +
        "mismos están manufacturados con buen material y calidad de trabajo y libres de defectos. <br/>";
    xml += "El Proveedor garantiza asimismo que de cualquier artículo suministrado bajo esta Orden de Compra y diseñado" +
        " por el propio Proveedor, reunirá las cualidades necesarias para cumplir adecuadamente el fin al que se le destina.<br/>";
    xml += "El Proveedor específicamente está de acuerdo en defender, indemnizar por la afectación de la falla en su" +
        " totalidad y mantener al Comprador a salvo de cualquier reclamación y toda queja, resultante de violaciones " +
        "a la garantía antes mencionada.<br/><br/>";
    xml += "<b>X. CESION DE DERECHOS POR EL PROVEEDOR</b><br/>";
    xml += "El Proveedor no podrá ceder o delegar la ejecución de las obligaciones contenidas en esta Orden de Compra " +
        "sin el consentimiento escrito del Comprador.<br/><br/>";
    xml += "<b>XI. PROPIEDAD DEL COMPRADOR</b><br/>";
    xml += "A menos que por escrito se acuerde lo contrario, la propiedad de cada diseño o plano, incluyendo todas " +
        "las herramientas, materiales o equipo suministrado al Proveedor, corresponderá siempre al Comprador.<br/>";
    xml += "El Proveedor no usará tales diseños, planos, herramientas, materiales o equipos sino para ejecutar el " +
        "trabajo del Comprador o por autorización escrita del mismo. <br/><br/>";
    xml += "<b>XII. CANCELACION DE LA ORDEN DE COMPRA</b><br/>";
    xml += "El Comprador puede cancelar la ejecución del trabajo materia de esta Orden de Compra total o parcialmente," +
        " notificando por escrito dicha cancelación. El Proveedor suspenderá el trabajo en la fecha y grado " +
        "especificados en el aviso, y avisará inmediatamente al Comprador sobre las cantidades de artículos y de " +
        "los materiales que tenga en existencia.<br/>";
    xml += "El Proveedor cumplirá con las instrucciones del comprador respecto a la protección, transferencia y " +
        "disposición del título y posesión de tales artículos y materiales. A este respecto el Proveedor renuncia " +
        "a lo dispuesto en la parte final del artículo 2635 del Código Civil del Distrito Federal. En este caso el " +
        "Comprador pagará al Proveedor sólo el costo de los artículos en proceso y/o ya producidos.<br/><br/>";
    xml += "<b>XIII. CANCELACION POR INCUMPLIMIENTO</b><br/>";
    xml += "Esta Orden quedará cancelada sin necesidad de previo aviso si el Proveedor:<br/>";
    xml += "1) No entrega los materiales o no ejecuta los servicios en el tiempo especificado.<br/>";
    xml += "2) No cumple con cualquiera de las condiciones contenidas en este documento.<br/><br/>";
    xml += "<b>XIV. CAMBIOS</b><br/>";
    xml += "El Comprador podrá en cualquier tiempo a través de un aviso por escrito hacer cambios, dentro de los " +
        "lineamientos generales de esta Orden, en los siguientes renglones:<br/>";
    xml += "a) Planos, diseños o especificaciones.<br/>";
    xml += "b) Método en el empaque o embarque.<br/>";
    xml += "c) Bienes cuyo uso concede el Comprador al Proveedor para que éste efectúe la Orden de Compra.<br/>";
    xml += "Si cualquier cambio causa un incremento o decremento en el costo o en el tiempo especificado para la " +
        "ejecución de todo o parte del trabajo, un ajuste equitativo será hecho en el precio o en los programas de " +
        "entrega o en ambos.<br/><br/>";
    xml += "<b>XV. USO DEL NOMBRE VORWERK MEXICO</b><br/>";
    xml += "El Proveedor, sin el consentimiento previo por escrito del Comprador, de ninguna manera publicará el " +
        "hecho de que ha suministrado o contratado el suministro de los artículos mencionados en esta Orden de Compra " +
        "ni usará el nombre de Vorwerk México o alguno de sus nombres comerciales (Thermomix,), ni de cualquiera de " +
        "sus subsidiarias, afiliadas o empresa matriz, en la publicidad que haga o en alguna otra publicación. Si " +
        "el material especificado en esta Orden de Compra es de diseño exclusivo del Comprador, o si lleva su marca " +
        "de fábrica y/o de identificación, el Proveedor se abstendrá de disponer del mismo material en cualquier " +
        "forma distinta a la indicada en esta Orden de Compra.<br/><br/>";
    xml += "<b>XVI. PATENTES</b><br/>";
    xml += "El Proveedor garantiza que la venta o el uso de los artículos, mercancías o material cubierto en esta " +
        "Orden de Compra, no invade o contribuye a la invasión de alguna patente o marca, derechos o nombres " +
        "comerciales, ya sea de México o de países extranjeros. <br/>";
    xml += "El Proveedor conviene en sacar en paz y a salvo al Comprador de cualquier reclamación, que pueda ser " +
        "presentada en su contra, o en contra de sus clientes y pagará todos los gastos, daños y perjuicios que se " +
        "ocasionen si tal reclamación ocurre.<br/><br/>";
    xml += "<b>XVII. MARCAS</b><br/>";
    xml += "A menos que se acuerde lo contrario por escrito, si el Proveedor recibe del Comprador instrucciones, el " +
        "propio Proveedor, colocará en las mercancías cubiertas por esta Orden de Compra la marca registrada y/o" +
        " marca de identificación que el Comprador especifique. El Comprador podrá, sin responsabilidad alguna, " +
        "modificar o suprimir cualquier marca que el Proveedor coloque en los artículos, objeto de esta Orden de " +
        "Compra o en los planos u otro documento relacionado con aquellos.<br/><br/>";
    xml += "<b>XVIII. LIMITACIONES DE LA ORDEN</b><br/>";
    xml += "Esta Orden de Compra está sujeta a modificaciones por el Comprador en el caso de incendios, accidentes, " +
        "huelgas, restricciones legales y otras causas fuera del control del Comprador.<br/><br/>";
    xml += "<b>XIX. CONFLICTOS LABORALES.</b><br/>";
    xml += "Cuando el Proveedor tenga conocimiento de que cualquier conflicto real o potencial está retrasando o" +
        " amenaza retrasar el tiempo de ejecución de esta Orden de Compra, dará inmediatamente aviso al Comprador" +
        " incluyendo toda información importante al respecto. En estos casos, el Comprador podrá optar por cancelar " +
        "la presente Orden de Compra, sin responsabilidad para el Comprador.<br/><br/>";
    xml += "<b>XX. OTROS</b><br/>";
    xml += "a) Cualquier pago hecho por Vorwerk México, al Proveedor por partes, materiales o servicios cubiertos " +
        "por esta Orden, no constituirá la aceptación de los mismos, a menos que concuerden con las especificaciones," +
        " términos y condiciones detallados en la propia Orden o en cualquier otra comunicación escrita hecha por " +
        "Vorwerk México, al Proveedor. <br/>";
    xml += "b) Para la interpretación de la presente, se reconoce como aplicable la legislación vigente en la Ciudad " +
        "de México, y además, cualquier litigio que pueda surgir como resultado de esta Orden de Compra será sometido" +
        " a las autoridades competentes, o a los tribunales de la Ciudad de México.<br/>";


    xml += "</body>";
    return xml;
}

function xmlStringPage1() {
    var xml = '';
    xml +=
        "<table class=\"MsoTableGrid\" style=\"background:#FFFFFF; border-collapse:collapse; border:none\"><tr>\n" +
        "\t<td style=\"width:604px; padding:0cm 7px 0cm 7px; color:#00AC46 \" valign=\"top\"><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"color:00AC46\">Terminos y Condiciones de las Ordenes de Compra emitidas por Vorwerk Mexico</span></b></span></span></span></td>\n" +
        "\t</tr></table>\n" +
        "<br /><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">I. PUNTUALIDAD</span></span></b><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">La entrega de los art&iacute;culos, partes o la ejecuci&oacute;n de los servicios se efectuar&aacute; o ejecutar&aacute; en el tiempo especificado en el cuerpo de esta Orden de Compra.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">II. ACEPTACION</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Esta Orden de Compra se considera obligatoria una vez aceptada por escrito o por la entrega de los art&iacute;culos pedidos, o por el suministro de los servicios especificados, o por el comienzo de un trabajo o por la manufactura de los art&iacute;culos se&ntilde;alados en la Orden de Compra. </span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Tambi&eacute;n se considera obligatoria, si la misma no es rechazada, por parte del proveedor, por escrito dentro de los 3 d&iacute;as siguientes a su recepci&oacute;n.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">III. MODIFICACIONES</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Cualquier modificaci&oacute;n o cambio a esta Orden de Compra debe ser indicado por escrito y firmado por un representante autorizado del Comprador. El Comprador solamente estudiar&aacute; las solicitudes de cambios que haga el Proveedor, si &eacute;stas se presentan por escrito. El Comprador debe aprobar el cambio por escrito para que &eacute;ste sea v&aacute;lido, dentro de las 48 horas siguientes a la recepci&oacute;n de esta orden de compra.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">IV. RESPONSABILIDAD EN RELACION A EMPAQUES, IDENTIFICACIONES Y ENTREGAS</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">A menos que se indique lo contrario el Proveedor deber&aacute;:</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">a) Empacar y marcar el material objeto de esta Orden de Compra, asegurando su entrega, libre de da&ntilde;os y desperfectos y de acuerdo con los requerimientos de calidad del producto, acordados, de forma que se asegure la integridad del producto y empaque. Es responsabilidad del proveedor utilizar y entregar con empaque independiente que garantice la integridad del producto. </span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">b) Procesar los documentos de embarque, de acuerdo con las indicaciones del Comprador.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">V. EMBARQUES ESPECIALES</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Si el Proveedor no cumple con todos los requerimientos de entrega contenidos en esta Orden de Compra, el</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Comprador tendr&aacute; el derecho de exigir la misma entrega mediante un transporte mas r&aacute;pido (expeditado) al acordado originalmente o embarque a&eacute;reo y el Proveedor, deber&aacute; correr con los gastos de transportaci&oacute;n extraordinaria o en su caso reembolsar&aacute; al Comprador cualquier costo que ocasione dicho transporte, a menos que la falta del Proveedor se deba a caso fortuito o de fuerza mayor debidamente acreditado. El Comprador est&aacute; autorizado a deducir de cualquier pago que deba hacer al Proveedor, cualquier costo de los mencionados en este p&aacute;rrafo.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">VI. PROGRAMACI&Oacute;N DE ENTREGAS ( CUANDO ASI SE ESPECIFIQUE)</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Cuando se haya especificado en la Orden de Compra que las entregas se hagan de acuerdo con fechas espec&iacute;ficas, el Proveedor no deber&aacute; fabricar o ensamblar o adquirir m&aacute;s de los materiales necesarios para cumplir con estos programas, en el concepto de que, si violara esta indicaci&oacute;n, asumir&aacute; cualquier responsabilidad que de ello se derive.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">VII. INSPECCION</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Comprador tendr&aacute; derecho de inspeccionar y aprobar todos los materiales, herramental especial, art&iacute;culos y calidad de trabajo, en todo tiempo y lugar. El Proveedor aportar&aacute; y mantendr&aacute; un sistema de inspecci&oacute;n adecuado, que cubra los materiales, m&eacute;todos y fabricaci&oacute;n y herramental especial. El Proveedor mantendr&aacute; a la disposici&oacute;n del Comprador un registro de las inspecciones que se hagan a todo trabajo y material, durante cualquier per&iacute;odo de tiempo que se especifique en la misma, el comprador notificara al Proveedor de la existencia de variaci&oacute;n de las caracter&iacute;sticas acordadas y podr&aacute; rechazar (ver VIII Rechazos). </span></span></span></span></span><br />&nbsp;\n" +
        "</body>";
    return xml
}

function xmlStringPage2() {
    var xml = '';
    xml +=
        "    <span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">VIII. RECHAZOS</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">En caso de que cualquier art&iacute;culo o servicio prestado sea defectuoso en su material o calidad de trabajo o</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">que de cualquier manera no est&eacute; de conformidad con lo establecido en esta Orden de Compra, incluyendo el tiempo de entrega, el Comprador tendr&aacute; el derecho ya sea de rechazar su entrega, de solicitar la correcci&oacute;n necesaria o demandar compensaci&oacute;n por la afectaci&oacute;n que pudiera derivar de dicho rechazo. En estos casos, todos los gastos que la correcci&oacute;n o afectaci&oacute;n implique, ser&aacute;n por cuenta exclusiva del Proveedor. La correcci&oacute;n ser&aacute; hecha inmediatamente despu&eacute;s de que el Comprador la solicite. En caso de que el Proveedor no cumpla con lo antes establecido, el Comprador podr&aacute;:</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">a) Reponer o corregir tales materiales o servicios, cargando al Proveedor el costo correspondiente, mismo</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">que podr&aacute; deducir de cualquier pago que deba hacer el propio Proveedor.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">b) Emitir una cancelaci&oacute;n por incumplimiento (ver t&eacute;rmino XIII &quot;Cancelaci&oacute;n por incumplimiento&quot;).</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">IX. GARANTIA</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor garantiza que los materiales, propiedades o servicios cubiertos por esta Orden de Compra, ser&aacute;n suministrados de acuerdo con las especificaciones o muestras proporcionadas por el Comprador y que los mismos est&aacute;n manufacturados con buen material y calidad de trabajo y libres de defectos. </span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor garantiza asimismo que de cualquier art&iacute;culo suministrado bajo esta Orden de Compra y dise&ntilde;ado por el propio Proveedor, reunir&aacute; las cualidades necesarias para cumplir adecuadamente el fin al que se le destina.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor espec&iacute;ficamente est&aacute; de acuerdo en defender, indemnizar por la afectaci&oacute;n de la falla en su totalidad y mantener al Comprador a salvo de cualquier reclamaci&oacute;n y toda queja, resultante de violaciones a la garant&iacute;a antes mencionada.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">X. CESION DE DERECHOS POR EL PROVEEDOR</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor no podr&aacute; ceder o delegar la ejecuci&oacute;n de las obligaciones contenidas en esta Orden de Compra sin el consentimiento escrito del Comprador.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XI. PROPIEDAD DEL COMPRADOR</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">A menos que por escrito se acuerde lo contrario, la propiedad de cada dise&ntilde;o o plano, incluyendo todas las herramientas, materiales o equipo suministrado al Proveedor, corresponder&aacute; siempre al Comprador.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor no usar&aacute; tales dise&ntilde;os, planos, herramientas, materiales o equipos sino para ejecutar el trabajo del Comprador o por autorizaci&oacute;n escrita del mismo. </span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XII. CANCELACION DE LA ORDEN DE COMPRA</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Comprador puede cancelar la ejecuci&oacute;n del trabajo materia de esta Orden de Compra total o parcialmente, notificando por escrito dicha cancelaci&oacute;n. El Proveedor suspender&aacute; el trabajo en la fecha y grado especificados en el aviso, y avisar&aacute; inmediatamente al Comprador sobre las cantidades de art&iacute;culos y de los materiales que tenga en existencia.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor cumplir&aacute; con las instrucciones del comprador respecto a la protecci&oacute;n, transferencia y disposici&oacute;n del t&iacute;tulo y posesi&oacute;n de tales art&iacute;culos y materiales. A este respecto el Proveedor renuncia a lo dispuesto en la parte final del art&iacute;culo 2635 del C&oacute;digo Civil del Distrito Federal. En este caso el Comprador pagar&aacute; al Proveedor s&oacute;lo el costo de los art&iacute;culos en proceso y/o ya producidos.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XIII. CANCELACION POR INCUMPLIMIENTO</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Esta Orden quedar&aacute; cancelada sin necesidad de previo aviso si el Proveedor:</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">1) No entrega los materiales o no ejecuta los servicios en el tiempo especificado.</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">2) No cumple con cualquiera de las condiciones contenidas en este documento.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XIV. CAMBIOS</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Comprador podr&aacute; en cualquier tiempo a trav&eacute;s de un aviso por escrito hacer cambios, dentro de los lineamientos generales de esta Orden, en los siguientes renglones:</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">a) Planos, dise&ntilde;os o especificaciones.</span></span></span></span></span><br />&nbsp;\n" +
        "</body>";
    return xml
}

function xmlStringPage3() {
    var xml = '';
    xml +=
        "    <span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">b) M&eacute;todo en el empaque o embarque.</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">c) Bienes cuyo uso concede el Comprador al Proveedor para que &eacute;ste efect&uacute;e la Orden de Compra.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Si cualquier cambio causa un incremento o decremento en el costo o en el tiempo especificado para la ejecuci&oacute;n de todo o parte del trabajo, un ajuste equitativo ser&aacute; hecho en el precio o en los programas de entrega o en ambos.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XV. USO DEL NOMBRE VORWERK MEXICO</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor, sin el consentimiento previo por escrito del Comprador, de ninguna manera publicar&aacute; el hecho de que ha suministrado o contratado el suministro de los art&iacute;culos mencionados en esta Orden de Compra ni usar&aacute; el nombre de Vorwerk M&eacute;xico o alguno de sus nombres comerciales (Thermomix,), ni de cualquiera de sus subsidiarias, afiliadas o empresa matriz, en la publicidad que haga o en alguna otra publicaci&oacute;n. Si el material especificado en esta Orden de Compra es de dise&ntilde;o exclusivo del Comprador, o si lleva su marca de f&aacute;brica y/o de identificaci&oacute;n, el Proveedor se abstendr&aacute; de disponer del mismo material en cualquier forma distinta a la indicada en esta Orden de Compra.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XVI. PATENTES</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor garantiza que la venta o el uso de los art&iacute;culos, mercanc&iacute;as o material cubierto en esta Orden de Compra, no invade o contribuye a la invasi&oacute;n de alguna patente o marca, derechos o nombres comerciales, ya sea de M&eacute;xico o de pa&iacute;ses extranjeros. </span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">El Proveedor conviene en sacar en paz y a salvo al Comprador de cualquier reclamaci&oacute;n, que pueda ser presentada en su contra, o en contra de sus clientes y pagar&aacute; todos los gastos, da&ntilde;os y perjuicios que se ocasionen si tal reclamaci&oacute;n ocurre.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XVII. MARCAS</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">A menos que se acuerde lo contrario por escrito, si el Proveedor recibe del Comprador instrucciones, el propio Proveedor, colocar&aacute; en las mercanc&iacute;as cubiertas por esta Orden de Compra la marca registrada y/o marca de identificaci&oacute;n que el Comprador especifique. El Comprador podr&aacute;, sin responsabilidad alguna, modificar o suprimir cualquier marca que el Proveedor coloque en los art&iacute;culos, objeto de esta Orden de Compra o en los planos u otro documento relacionado con aquellos.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XVIII. LIMITACIONES DE LA ORDEN</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Esta Orden de Compra est&aacute; sujeta a modificaciones por el Comprador en el caso de incendios, accidentes, huelgas, restricciones legales y otras causas fuera del control del Comprador.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XIX. CONFLICTOS LABORALES</span></span></b><span style=\"font-size:10.0pt\">.</span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">Cuando el Proveedor tenga conocimiento de que cualquier conflicto real o potencial est&aacute; retrasando o amenaza retrasar el tiempo de ejecuci&oacute;n de esta Orden de Compra, dar&aacute; inmediatamente aviso al Comprador incluyendo toda informaci&oacute;n importante al respecto. En estos casos, el Comprador podr&aacute; optar por cancelar la presente Orden de Compra, sin responsabilidad para el Comprador.</span></span></span></span></span><br /><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><b><span style=\"font-size:10.0pt\"><span style=\"color:#00AC46\">XX. OTROS</span></span></b></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">a) Cualquier pago hecho por Vorwerk M&eacute;xico, al Proveedor por partes, materiales o servicios cubiertos por esta Orden, no constituir&aacute; la aceptaci&oacute;n de los mismos, a menos que concuerden con las especificaciones, t&eacute;rminos y condiciones detallados en la propia Orden o en cualquier otra comunicaci&oacute;n escrita hecha por Vorwerk M&eacute;xico, al Proveedor. </span></span></span></span></span><br /><span style=\"font-size:11pt\"><span style=\"line-height:normal\"><span style=\"text-autospace:none\"><span style=\"font-family:Calibri,sans-serif\"><span style=\"font-size:10.0pt\">b) Para la interpretaci&oacute;n de la presente, se reconoce como aplicable la legislaci&oacute;n vigente en la Ciudad de M&eacute;xico, y adem&aacute;s, cualquier litigio que pueda surgir como resultado de esta Orden de Compra ser&aacute; sometido a las autoridades competentes, o a los tribunales de la Ciudad de M&eacute;xico.</span></span></span></span></span><br />&nbsp;\n" +
        "</body>"
    return xml
}
