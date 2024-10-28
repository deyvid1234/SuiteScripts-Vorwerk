//hoja salida LISTO
/*/
	var ov = returnBlank(nlapiGetFieldValue('createdfrom'));
	if(ov!='')
	{
		var filters = new nlobjSearchFilter("internalid",null,"is", ov);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('salesrep');
		columns[1] = new nlobjSearchColumn('altname','salesrep');
		columns[2] = new nlobjSearchColumn('isperson','customer');
		columns[3] = new nlobjSearchColumn('entityid','customer');
		columns[4] = new nlobjSearchColumn('companyname','customer');
		columns[5] = new nlobjSearchColumn('tranid');
		var resultsOV = returnBlank(nlapiSearchRecord("salesorder", null, filters, columns));
		if(resultsOV!='')
		{
			var presentadora = resultsOV[0].getValue('altname','salesrep');
			nlapiSetFieldValue('custbody_pres' , presentadora , false , false);
			if(resultsOV[0].getValue('isperson','customer')=='T') { nlapiSetFieldValue('custbody_nombre_cliente',resultsOV[0].getValue("altname","customer")); }
			else { 	nlapiSetFieldValue('custbody_nombre_cliente',resultsOV[0].getValue("companyname","customer")); }
			nlapiSetFieldValue('custbody_numc',resultsOV[0].getValue('tranid'));
		}
	}
/*/
/*function returnBlank(value)
{
	if (value == null)
		return '';
	else
		return value;
}
//helper, convierte las series en un arreglo.
function stringToArray(str,base)
{
     var multiSelectStringArray = str.split(String.fromCharCode(base));
     return multiSelectStringArray;
}*/
function obtenerImagen(value,opc)
{
	switch(value)
	{
		case 'T'  :
		{
			if(opc=='e1'){
				var imagen = nlapiLoadFile(16);
			  var url = imagen.getURL();
			  var urls = url.split('&');
			  var urlAux = '';
			  urlAux = urls.join('&amp;');
				return "<img align=\"center\" width=\"10\" height=\"10\" src=\"" + urlAux + "\" />";
				 //return "<img align=\"center\" width=\"10\" height=\"10\" src=\"https://system.netsuite.com/core/media/media.nl?id=16&amp;c=3367613&amp;h=be317e0fab9109c59149\" />";
			}else return "";
		};break;
		default   : { return ""; };break;
	}
}
function desplegarCadena(cad)
{
	if(cad!='' )
	{
	 	var otros =stringToArray(cad,124);
		var otrosText =stringToArray(otros[0],64);
			otrosText.pop();
		var otrosCant =stringToArray(otros[1],64);
			otrosCant.pop();
		var cad_con = new String();;
		for(var i =0; i<otrosText.length;i++)
		{
			var filters = new nlobjSearchFilter('internalid', null, 'is', otrosText[i], null);
		    var columns = new Array();
		        columns[0]=new nlobjSearchColumn('itemid');
		        columns[1]=new nlobjSearchColumn('displayname');
		    var searchresults = nlapiSearchRecord('item', null, filters, columns );
		    var itemid			= nlapiEscapeXML(searchresults[0].getValue('itemid'));
	            //itemid = stringToArray(itemid,36);
	            //itemid = itemid.join('&amp;');
			    itemid = stringToArray(itemid,34);
			    itemid = itemid.join('&quot;');
			    itemid = stringToArray(itemid,39);
			    itemid = itemid.join('&apos;');
			    itemid = stringToArray(itemid,60);
			    itemid = itemid.join('&lt;');
			    itemid = stringToArray(itemid,62);
			    itemid = itemid.join('&gt;');
	    	var displayname		= nlapiEscapeXML(searchresults[0].getValue('displayname'));
	            //displayname = stringToArray(displayname,36);
	            //displayname = displayname.join('&amp;');
		    	displayname = stringToArray(displayname,34);
		    	displayname = displayname.join('&quot;');
		    	displayname = stringToArray(displayname,39);
		    	displayname = displayname.join('&apos;');
		    	displayname = stringToArray(displayname,60);
		    	displayname = displayname.join('&lt;');
		    	displayname = stringToArray(displayname,62);
		    	displayname = displayname.join('&gt;');
		    cad_con += "<tr><td width=\"20\" height=\"20\">" + obtenerImagen('T','e1') + "</td><td height=\"20\">" + itemid + ' ' + displayname + ' (' + otrosCant[i]  + ")</td></tr>";
		}
		return cad_con;
	}
	else
		return "";
}
//Helper, transforma la fecha en letras.
function fecha_letras(fecha,opc)
{
	if(fecha!='')
	{
	    var l_fecha = fecha.length;
	    var i_fecha = fecha.indexOf('/');
	    var f_fecha = fecha.lastIndexOf('/');
	    var n_dia = fecha.substring(0,i_fecha);
	    var n_mes = fecha.substring((i_fecha+1),f_fecha);
	    var n_year = fecha.substring((f_fecha+1),l_fecha);
	    var l_mes = new String ();
	    var fecha_letras = new String();
	    switch(n_mes)
	    {
	    	case '1': l_mes = 'Enero'; break;
	        case '2': l_mes = 'Febrero'; break;
	        case '3': l_mes = 'Marzo'; break;
	        case '4': l_mes = 'Abril'; break;
	        case '5': l_mes = 'Mayo'; break;
	        case '6': l_mes = 'Junio'; break;
	        case '7': l_mes = 'Julio'; break;
	        case '8': l_mes = 'Agosto'; break;
	        case '9': l_mes = 'Septiembre'; break;
	        case '10': l_mes = 'Octubre'; break;
	        case '11': l_mes = 'Noviembre'; break;
	        case '12': l_mes = 'Diciembre'; break;
		}
	    if(opc==1) { fecha_letras = l_mes + ' '+n_dia + ', ' + n_year; }
	    if(opc==2) { fecha_letras = n_dia + ' de ' + l_mes + ' de ' + n_year; }
		return fecha_letras;
	}
	else
	{
		return "";
	}
}
//Etiqueta de Embarque: Boton
function HojaSalidaButton(type, form, request)
{
	if(type == 'view')
	{
		var hs = nlapiGetRecordId();
		var url = nlapiResolveURL("SUITELET", "customscript4", "customdeploy1", null);
			url = url + "&custparam_hs=" + hs;
		form.addButton("custpage_btnprint", "Imprimir Hoja de Salida", "window.open('"+url+"')");
	}
}
// Etiqueta de Embarque: Generacion de PDF
function HojaSalidaPDF(request, response)
{
	var hs 		= request.getParameter('custparam_hs');
	var hsRec	= nlapiLoadRecord('itemfulfillment',hs);
	var order	= hsRec.getFieldValue('createdfrom');
	var so		= nlapiLoadRecord('salesorder', order);
	var otros  	= returnBlank(hsRec.getFieldValue('custbody_otros'));
	if(otros!='')
	{
	 	otros =stringToArray(otros,124);
		otros =stringToArray(otros[0],64);
		otros.pop();
	}
	otros 	= otros.length;

	 var internalIdimage

	if (nlapiGetContext().getEnvironment() == "SANDBOX") {
		internalIdimage = 2576941 //sandbox
	}
	else {
		internalIdimage = 2576941 //prod
	}

	var imagen = nlapiLoadFile(internalIdimage);
	var url = imagen.getURL();
	var urls = url.split('&');
	var urlAux = '';
	urlAux = urls.join('&amp;'); 
	

	
	var Encabezado = new String();
		
		Encabezado += "<table align='center'>";
		//Encabezado += "<tr><td align='center'><img width=\"50.2mm\" height=\"18.6mm\" src=\"https://system.netsuite.com/core/media/media.nl?id=144011&amp;c=3367613&amp;h=be6d4a25f183718f701c\" /></td></tr>";
		Encabezado += "<tr><td align='center'><img width=\"100%\" height=\"100%\" src=\"" + urlAux + "\" /></td></tr>";
		Encabezado += "</table>";
		Encabezado += "<p font-family=\"Helvetica\" font-size=\"9\"></p>";
		Encabezado += "<table align='center'>";
		Encabezado += "<tr><td align='center' font-size=\"12\"><b>"+"HOJA DE SALIDA"+"</b></td></tr>";
		Encabezado += "</table>";
	var entityText 	= nlapiEscapeXML(returnBlank(hsRec.getFieldText('entity')));
	var numc		= nlapiEscapeXML(returnBlank(hsRec.getFieldValue('custbody_numc')));
	var presText	= nlapiEscapeXML(returnBlank(hsRec.getFieldText('custbody_busqueda_presentadora')));
	var serieLine1	= '';

	var itemcount		= returnNumber(hsRec.getLineItemCount('item'));
	for(var i=1;i<itemcount + 1;i++){
				var tmp_item = hsRec.getLineItemValue('item', 'item', i);
				nlapiLogExecution('debug', 'tmp_item', tmp_item);
				if(tmp_item == 2001 || tmp_item == 2170 || tmp_item == 2490|| tmp_item == 2280 || tmp_item == 2571 || tmp_item == 2671){
					 var subrecord = hsRec.viewLineItemSubrecord('item', 'inventorydetail',i);
					 nlapiLogExecution('debug', 'subrecord', JSON.stringify(subrecord));
					 if(subrecord != null) {
					 	var subitems    = subrecord.getLineItemCount('inventoryassignment');
					 	for(var x = 1; x <= subitems; x++) {
					 		subrecord.selectLineItem('inventoryassignment', x);
					 		serieLine1 = subrecord.getCurrentLineItemText('inventoryassignment', 'issueinventorynumber');
					 		nlapiLogExecution('debug', 'serie', serieLine1);
					 		if(serieLine1){
					 			break;
					 		}
					 		
					 	}
					 }
				}
				
			}
	var datos = new String();
		datos += "<p font-family=\"Helvetica\" font-size=\"9\"></p><p font-family=\"Helvetica\" font-size=\"9\"></p>";
		datos += "<table width ='95%'>";
		datos += "<tr><td height=\"20\" width='10%'><b>Cliente: </b></td><td border-bottom='1'><b>" + entityText + "</b></td></tr>";
		datos += "</table>";
		datos += "<table width ='95%'>";
		datos += "<tr><td height=\"20\" width='10%'><b>No. Pedido: </b></td><td width =\"155\" align=\"center\" border-bottom='1'><b>" + numc + "</b></td><td height=\"20\" width='10%'><b>No. Serie TM: </b></td><td width =\"170\" align=\"center\" border-bottom='1'><b>" + serieLine1+"</b></td></tr>";
		datos += "</table>";
		datos += "<p font-size='9'>&nbsp;</p>";
		datos += "<table width ='95%'>";
		datos += "<tr><td height=\"20\">La Distribuidora Independiente </td>"+"<td width =\"330\" align=\"center\" border-bottom='1'>" + presText + "</td></tr>";
		datos += "</table>";
		datos += "<table width ='95%'>";
		datos += "<tr><td>se compromete y responsabiliza de la entrega en un lapso no mayor a 48 horas del equipo especificado.</td></tr>";
		datos += "</table>";
	var pedido = new String();
		pedido += "<table table-layout='fixed' width='100%'>";
		pedido += "<tr>";
			pedido += "<td width='5%'>"		+ "&nbsp;"	+ "</td>";
			pedido += "<td width='90%'>"	+ "&nbsp;"	+ "</td>";
			pedido += "<td width='5%'>"		+ "&nbsp;"	+ "</td>";
		pedido += "</tr>";
		pedido += "<tr>";
		pedido += "<td colspan='3' align=\"center\" font-size=\"11\"><b>Cliente</b></td>";
		pedido += "</tr>";
		var artped 	= so.getLineItemCount('item');
		var artajus = hsRec.getLineItemCount('custpage_datos_otros');
		for(var i = 1;i<=artped;i++)
		{

			var arped		= nlapiEscapeXML(returnBlank(so.getLineItemText('item','item',i)));
			var cantped		= nlapiEscapeXML(returnBlank(so.getLineItemValue('item','quantity',i)));
			var mostrar		= returnFalse(so.getLineItemValue('item', 'custcol_mostrar_hoja_salida', i));
			if(mostrar == 'T')
			{
				pedido += "<tr>";
					pedido += "<td width='5%'>"		+ obtenerImagen('T','e1')	+ "</td>";
					pedido += "<td width='90%'>"	+ arped						+ "</td>";
					pedido += "<td width='5%'>"		+ cantped					+ "</td>";
				pedido += "</tr>";
			}
		}
		pedido += "<tr>";
			pedido += "<td width='5%'>"		+ "&nbsp;"	+ "</td>";
			pedido += "<td width='90%'>"	+ "&nbsp;"	+ "</td>";
			pedido += "<td width='5%'>"		+ "&nbsp;"	+ "</td>";
		pedido += "</tr>";
		pedido += "<tr>";
		pedido += "<td colspan='3' align=\"center\" font-size=\"11\"><b>Presentadora</b></td>";
		pedido += "</tr>";
		for(var h = 1;h<=artajus;h++)
		{
			var articulo = nlapiEscapeXML(returnBlank(hsRec.getLineItemText('custpage_datos_otros','custpage_articulo',h)));
			var cantidad = Math.abs(nlapiEscapeXML(returnNumber(hsRec.getLineItemValue('custpage_datos_otros','custpage_cantidad',h))));
			pedido += "<tr>";
				pedido += "<td width='3%'>"		+ obtenerImagen('T','e1') 	+ "</td>";
				pedido += "<td width='90%'>"	+ articulo					+ "</td>";
				pedido += "<td width='7%'>"		+ cantidad					+ "</td>";
			pedido += "</tr>";
		}
		pedido += "</table>";

	var compaynyInfo 		= nlapiLoadConfiguration('companyinformation');
	var companyInfoAddress1	= returnBlank(compaynyInfo.getFieldValue('addr1'));
	var companyInfoAddress2	= returnBlank(compaynyInfo.getFieldValue('addr2'));
	var companyInfoCity		= returnBlank(compaynyInfo.getFieldValue('city'));
	var companyInfoState	= returnBlank(compaynyInfo.getFieldValue('state'));
	var companyInfoCountry	= returnBlank(compaynyInfo.getFieldText('country'));
	var companyInfoZip		= returnBlank(compaynyInfo.getFieldValue('zip'));
	var companyInfoPhone	= returnBlank(compaynyInfo.getFieldValue('addrphone'));
	var companyInfoFax		= returnBlank(compaynyInfo.getFieldValue('fax'));

	var imagen = nlapiLoadFile(144012);
	var url = imagen.getURL();
	var urls = url.split('&');
	var urlAux = '';
	urlAux = urls.join('&amp;');

	var pie = new String();
		pie += "<table width ='100%'>";
		pie += "<tr>";
		pie += "<td align=\"center\" border-top='1'><b>Representante de la Compañía</b></td>";
		pie += "<td width=\"100\"> </td>";
		pie += "<td align=\"center\" border-top='1'><b>Distribuidora Independiente</b></td>";
		pie += "</tr>";
		pie += "<tr>";
		pie += "<td align=\"center\" font-size=\"8\">Nombre y firma</td>";
		pie += "<td width=\"100\" 	> </td>";
		pie += "<td align=\"center\" font-size=\"8\">Nombre y firma</td>";
		pie += "</tr>";
		pie += "</table>";
		pie += "<p font-size='9'>&nbsp;</p>";
		pie += "<table width ='100%'>";
		pie += "<tr><td align=\"center\" font-size=\"9\">"+companyInfoCity+", "+companyInfoCountry.toUpperCase()+" A "+ fecha_letras(returnBlank(hsRec.getFieldValue('trandate')),parseInt(2)).toUpperCase() +"</td></tr>";
		pie += "</table>";
		pie += "<p align='center' font-size='8pt' margin-bottom='10pt'> Vorwerk México S de RL de CV | Vito Alessio Robles 38 Col. Florida, Álvaro Obregón C.P. 01030 CDMX, México. RFC: VME060622GL2 <br/> SERVICIO AL CLIENTE: 800 200 1121</p>";
		
		pie += "<table width ='100%'>";
		//pie += "<tr><td align=\"center\"><img width=\"29.0mm\" height=\"5.2mm\" src=\"https://system.netsuite.com/core/media/media.nl?id=144012&amp;c=3367613&amp;h=29d6e1966bbe9981ac85\" /></td></tr>";
		
		pie += "</table>";

	var strName = new String();
		strName += datos;
		strName += pedido;
	var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
		xml += "<pdf>";
			xml += "<head>";
				xml += "<macrolist>";
					xml += "<macro id=\"myheader\">" 	+ Encabezado 	+ "</macro>";
					xml += "<macro id=\"paginas\">"		+ pie 			+ "</macro>";
				xml += "</macrolist>";
			xml += "</head>";
			xml += "<body font='helvetica' font-size='10' size='215.6mm x 279mm' header=\"myheader\" header-height=\"130pt\" footer=\"paginas\" footer-height='120pt'>";
				xml += strName;
			xml += "</body>\n";
		xml += "</pdf>";
	var fileError = nlapiXMLToPDF(xml);
	response.setContentType('PDF', 'Hoja de Salida.pdf', 'inline');
	response.write(fileError.getValue());

}
