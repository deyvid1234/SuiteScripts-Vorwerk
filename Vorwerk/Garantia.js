function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
//Helper, transforma la fecha en letras.
function fecha_letras(f)
{
	var f = nlapiStringToDate(f);
    var n_dia = f.getDate();
    var n_mes = f.getMonth();
    var n_year = f.getFullYear();
    var fecha_letras = new String();
    var l_mes = '';
    switch(n_mes)
    {
    	case 0: l_mes = 'Enero'; break;
        case 1: l_mes = 'Febrero'; break;
        case 2: l_mes = 'Marzo'; break;
        case 3: l_mes = 'Abril'; break;
        case 4: l_mes = 'Mayo'; break;
        case 5: l_mes = 'Junio'; break;
        case 6: l_mes = 'Julio'; break;
        case 7: l_mes = 'Agosto'; break;
        case 8: l_mes = 'Septiembre'; break;
        case 9: l_mes = 'Octubre'; break;
        case 10: l_mes = 'Noviembre'; break;
        case 11: l_mes = 'Diciembre'; break;
	}
    fecha_letras = n_dia + ' de '+l_mes + ' de ' + n_year;
	return fecha_letras;
}
//Etiqueta de Embarque: Boton
function ImprimirGarantiaButton(type, form, request)
{
	if(type == 'view')
	{
		var serie  = '';
		var fecha  = nlapiGetFieldValue('trandate');
		var pedido = nlapiGetFieldValue('custbody_numc'); 
		var meses  = nlapiGetFieldValue('custbody_garantia_producto');
		var garan  = nlapiGetFieldValue('custbody_garantia');
		for(var i=1;i<=nlapiGetLineItemCount('item');i++)
		{
			if(nlapiGetLineItemValue('item','itemreceive',i)=='T')
			{
				var item	= nlapiGetLineItemValue('item','item',i);
				if(item == 764 ||item == 992)
				{
					serie = nlapiGetLineItemValue('item','serialnumbers',i);
					break;
				}
			}
		}
		if(serie!='' && garan =='T')
		{
			var hs = nlapiGetRecordId();
			var url = nlapiResolveURL("SUITELET", "customscript_imprimir_garantia_pdf", "customdeploy_imprimir_garantia_pdf", null);
				url = url + "&custparam_s=" + serie +"&custparam_p=" + pedido +"&custparam_f=" + fecha + "&custparam_m=" + meses;			
			form.addButton("custpage_btnprint", "Imprimir Garantía", "window.open('"+url+"')");
		}
	}
}
// Etiqueta de Embarque: Generacion de PDF
function ImprimirGarantiaPDF(request, response) 
{
	var f 	= fecha_letras(request.getParameter('custparam_f'));
	var s 	= request.getParameter('custparam_s');
	var p 	= request.getParameter('custparam_p');
	var m 	= request.getParameter('custparam_m');
	if(m==1) { m = '24 meses';}
	if(m==2) { m = '6 meses';}
	var logos = new String();
		logos += "<table x=\"450\" y=\"5\">";
		logos += "<tr><td align=\"left\" font-size=\"10\"><b>"+f+"</b></td></tr>";
		logos += "</table>";
		logos += "<table align=\"center\">";
		logos += "<tr><td align=\"center\"><img width=\"50.2mm\" height=\"18.6mm\" src=\"https://system.netsuite.com/core/media/media.nl?id=144011&amp;c=3367613&amp;h=be6d4a25f183718f701c\" /></td></tr>";
		logos += "</table>";
		logos += "<p font-family=\"Helvetica\" font-size=\"9\"></p>";
		logos += "<table align=\"center\">";
		logos += "<tr><td align=\"center\" color=\"#15994E\" font-size=\"12\"><b>"+"PÓLIZA DE GARANTÍA POR "+m.toUpperCase()+"</b></td></tr>";
		logos += "</table>";
	var datos = new String();
		datos += "<p font-family=\"Helvetica\" font-size=\"9\"></p><p font-family=\"Helvetica\" font-size=\"9\"></p>";
		datos += "<table width =\"540\">";
		datos += "<tr>";
		datos += "<td height=\"20\">Vorwerk México, S. de R.L. de C.V., garantiza por <b color=\"#15994E\">"+m.toUpperCase() +"</b> el producto denominado \"Thermomix\" TM 31-4C amparando las piezas y componentes del producto incluyendo la mano de obra contra cualquier defecto de fabrica, así como reemplazar cualquiera pieza o componente sin costo adicional para el consumidor, siempre y cuanto se determine por medio de un dictámen que no resposabilidad del usuario.";
		datos += "</td>";
		datos += "</tr>";
		datos += "</table>";
		datos += "<p font-family=\"Helvetica\" font-size=\"9\"></p>";
		datos += "<table width =\"540\">";
		datos += "<tr>";
		datos += "<td height=\"20\"><i><b>Excepciones</b></i>";
		datos += "</td>";
		datos += "</tr>";
		datos += "<tr>";
		datos += "<td height=\"20\">A. Cuando el equipo no hubiese sido operado debidamente de acuerdo con el manual de instrucciones, recetario oficial (incluído en la compra de la \"Thermomix\") y/o libros que edite la empresa.";
		datos += "</td>";
		datos += "</tr>";
		datos += "<tr>";
		datos += "<td height=\"20\">B. Cuando el producto hubiese sido alterado o reparado por personas no autorizadas por el importador o comercializador responsable.";
		datos += "</td>";
		datos += "</tr>";
		datos += "<tr>";
		datos += "<td height=\"20\">C. Cuando el producto haya sido utilizado fuera del territorio nacional.";
		datos += "</td>";
		datos += "</tr>";
		datos += "<tr>";
		datos += "<td height=\"20\">D. Cuando el producto haya sufrido una descarga eléctrica y/o variaciones de voltaje.";
		datos += "</td>";
		datos += "</tr>";
		datos += "<tr>";
		datos += "<td height=\"20\">E. Cuando en el equipo exista una anomalía cuyo origen no sea imputable a un defecto de fabricación.";
		datos += "</td>";
		datos += "</tr>";
		datos += "</table>";
		datos += "<p font-family=\"Helvetica\" font-size=\"9\"></p>";
		datos += "<table width =\"540\">";
		datos += "<tr>";
		datos += "<td height=\"20\"><i><b>Procedimiento para hacer efectiva la garantía</b></i>";
		datos += "</td>";
		datos += "</tr>";
		datos += "<tr>";
		datos += "<td height=\"20\">Le rogamos conserve este certificado durante los <b color=\"#15994E\">"+ m.toUpperCase()+"</b> de garantía por ser imprescindilbe su presentación en los centros de servicio técnicos autorizados, junto con el pedido, para solicitar la reparacion de la \"Thermomix\".";
		datos += "</td>";
		datos += "</tr>";
		datos += "</table>";
		datos += "<p font-family=\"Helvetica\" font-size=\"9\"></p><p font-family=\"Helvetica\" font-size=\"9\"></p>";
	var pie = new String();
		pie += "<table align=\"left\">";
		pie += "<tr>";
		pie += "<td align=\"left\" font-size=\"9\">Producto <b>Thermomix y Varoma</b>";
		pie += "</td>";
		pie += "</tr>";
		pie += "</table>";
		pie += "<table align=\"left\">";
		pie += "<tr>";
		pie += "<td align=\"right\" font-size=\"7\">No. serie</td>";
		pie += "<td align=\"right\" font-size=\"12\"><b>"+ s +"</b></td>";
		pie += "<td align=\"right\" font-size=\"7\">No. pedido</td>";
		pie += "<td align=\"right\" font-size=\"12\"><b>"+ p +"</b></td>";
		pie += "</tr>";
		pie += "</table>";
		pie += "<p font-family=\"Helvetica\" font-size=\"9\"></p>";
		pie += "<shape width=\"100\" height=\"100\" color=\"#15994E\">";
		pie += "<shapepath>";
		pie += "<moveto x=\"0\" y=\"0\"/>";
		pie += "<lineto x=\"400\" y=\"0\"/>";
		pie += "<moveto x=\"0\" y=\"150\"/>";
		pie += "<lineto x=\"400\" y=\"150\"/>";
		pie += "<moveto x=\"0\" y=\"0\"/>";
		pie += "<lineto x=\"0\" y=\"150\"/>";
		pie += "<moveto x=\"400\" y=\"0\"/>";
		pie += "<lineto x=\"400\" y=\"150\"/>";
		pie += "</shapepath>";
		pie += "</shape>";
		pie += "<p x=\"0\" y=\"45\" font-family=\"Helvetica\" font-size=\"7\">Sello de la empresa</p>";
		pie += "<table y=\"70\" align=\"right\" width =\"540\">";
		pie += "<tr>";
		pie += "<td align=\"center\"><b>Vorwerk México S. de R.L de C.V<br/>Atención a Clientes<br/>www.thermomix.com.mx<br/>01 800 200 1121</b>";
		pie += "</td>";
		pie += "<td align=\"left\"><img width=\"29.0mm\" height=\"5.2mm\" src=\"https://system.netsuite.com/core/media/media.nl?id=144012&amp;c=3367613&amp;h=29d6e1966bbe9981ac85\" />";
		pie += "</td>";
		pie += "</tr>";
		pie += "</table>";
	var strName = new String();
		strName += logos;
		strName += datos;
		strName += pie;
	var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
	xml += "<pdf><head></head><body font='helvetica' font-size='10' size='215.6mm x 279mm'>";	
	xml += strName;
	xml += "</body>\n</pdf>";
	var fileError = nlapiXMLToPDF(xml);
	response.setContentType('PDF', 'Garantía.pdf', 'inline');
	response.write(fileError.getValue());
	
}