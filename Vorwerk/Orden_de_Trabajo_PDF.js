// Evento que redirecciona al Suitlet
function OrdendeTrabajoButton(type, form, request)
{
	if(type == 'view')
	{
		var recordId 	= nlapiGetRecordId();
		var recordType	= nlapiGetRecordType();
		var url = nlapiResolveURL("SUITELET", "customscript_orden_servicio_pdf_pdf", "customdeploy_orden_servicio_pdf_pdf", null);
			url = url + "&custparam_recordType=" + recordType + "&custparam_recordId=" + recordId;			
		form.addButton("custpage_orden_servicio_button", "Imprimir Orden de Servicio", "window.open('"+url+"')");
	}
}
// Generacion de PDF
function OrdendTrabajoButtonPDF(request, response)
{
	var filters	= new Array();
	var recId 	= request.getParameter('custparam_recordId');
	var recType = request.getParameter('custparam_recordType');
	var record 	= nlapiLoadRecord(recType,recId);
	var strName = new String();
	var optNumber	= record.getFieldValue('tranid');
	var fecha 		= NotNull(record.getFieldValue('trandate'));
	var equipo 		= NotNull(record.getFieldValue('custbody_desc_serie'));
	var cteText		= NotNull(record.getFieldText('entity'));
	var serie		= NotNull(record.getFieldValue('custbody_numero_serie'));
	var obser		= NotNull(record.getFieldValue('custbody_obse'));
	var ubicacion	= NotNull(record.getFieldText('location'));
	var garantia	= NotNull(record.getFieldValue('custbody_garantia'));
	if(garantia=='T')
	{
		garantia = "<img align=\"left\" width=\"10\" height=\"10\" src=\"https://system.netsuite.com/core/media/media.nl?id=16&amp;c=3367613&amp;h=be317e0fab9109c59149\" />";
	}
	else { garantia =''; }
	var datos_vorwek = '<p font-family=\"Helvetica\" font-size=\"6\">PASEO DE LAS PALMAS 320 PB-A<br/>LOMAS DE CHAPULTEPEC<br/>DELEGACION MIGUEL HIDALGO<br/>C.P. 11000<br/>MEXICO DF<br/>TEL. 9150-5505 / 01800 200 11210</p>';
	strName += "<table align=\"center\">";
	strName += "<tr>";
	strName += "<td align=\"center\"><img width=\"70.2mm\" height=\"18.6mm\" src=\"https://system.netsuite.com/core/media/media.nl?id=17&amp;c=3367613&amp;h=cb80dbc6de3e6424c2b2\" /></td>";
	strName += "<td width=\"20\">&nbsp;&nbsp;&nbsp;&nbsp;</td>";
	strName += "<td><p font-family=\"Helvetica\" font-size=\"10\"><b>VORWERK MEXICO S. de R.L. de C.V.</b></p>" + datos_vorwek + "</td>";
	strName += "</tr>";
	strName += "</table>";
	strName += "<p font-family=\"Helvetica\" font-size=\"20\"></p>"
	strName += "<table width=\"580\" align=\"center\">";
	strName += "<tr>";
	strName += "<td border='0.5'><b>Fecha</b></td>";
	strName += "<td border='0.5'><b>Cliente</b></td>";
	strName += "<td border='0.5'><b>Equipo</b></td>";
	strName += "<td border='0.5'><b>Serie</b></td>";
	strName += "</tr>";
	strName += "<tr>";
	strName += "<td border='0.5' border-style='dotted-narrow'>"+ fecha +"</td>";
	strName += "<td border='0.5' border-style='dotted-narrow'>"+ cteText +"</td>";
	strName += "<td border='0.5' border-style='dotted-narrow'>"+ equipo +"</td>";
	strName += "<td border='0.5' border-style='dotted-narrow'>"+ serie +"</td>";
	strName += "</tr>";
	strName += "</table>";
	strName += "<p font-family=\"Helvetica\" font-size=\"10\"></p>"
	strName += "<table width=\"580\" align=\"center\">";
	strName += "<tr>";
	strName += "<td border='0.5'><b>Observaciones</b></td>";
	strName += "<td border='0.5'><b>Ubicacion</b></td>";
	strName += "<td border='0.5'><b>Garantia</b></td>";
	strName += "</tr>";
	strName += "<tr>";
	strName += "<td border='0.5' border-style='dotted-narrow'>"+ obser +"</td>";
	strName += "<td border='0.5' border-style='dotted-narrow'>"+ ubicacion +"</td>";
	strName += "<td border='0.5' border-style='dotted-narrow'>"+ garantia +"</td>";
	strName += "</tr>";
	strName += "</table>";
					/*/
	strName += "<table x=\"510\" y=\"-1\">";
	strName += "<tr><td >"+ot+"</td></tr>";
	strName += "<tr><td >"+fr+"</td></tr>";
	strName += "<tr><td >"+fe+"</td></tr>";
	strName += "</table>";
	strName += "<table x=\"67\" y=\"11\"><tr><td>"+cod_cte+"</td></tr></table>";
	strName += "<table x=\"67\" y=\"8\"><tr><td>"+nom_cte+"</td></tr></table>";
	strName += "<table x=\"67\" y=\"12\"><tr><td>"+dir+"</td></tr></table>";
	strName += "<table x=\"67\" y=\"14\"><tr><td>"+city+"</td></tr></table>";
	strName += "<table x=\"67\" y=\"11\"><tr><td>"+sta_zip+"</td></tr></table>";
	strName += "<table x=\"67\" y=\"9\"><tr><td>"+tel+"</td></tr></table>";
	strName += "<table x=\"375\" y=\"-73\"><tr><td>"+or_tipo+"</td></tr></table>";
	strName += "<table x=\"375\" y=\"-76\"><tr><td>"+tc_asig+"</td></tr></table>";
	strName += "<table x=\"375\" y=\"-77\"><tr><td>"+con_pay+"</td></tr></table>";
	strName += "<table x=\"375\" y=\"-78\"><tr><td>"+marca+"</td></tr></table>";
	strName += "<table x=\"375\" y=\"-80\"><tr><td>"+modelo+"</td></tr></table>";
	strName += "<table x=\"375\" y=\"-81\"><tr><td>"+num_ser+"</td></tr></table>";
	strName += "<table x=\"375\" y=\"-83\"><tr><td>"+cas+"</td></tr></table>";
	strName += "<table x=\"-5\" y=\"-70\">";
	strName += "<tr><td>"+codigo+"</td><td width='20px'>"+"</td><td>"+desc_fa+"</td></tr>";
	strName += "</table>";
	strName += "<table x=\"-5\" y=\"-35\">";
	strName += "<tr><td>"+obser+"</td></tr>";
	strName += "</table>";
	strName += "<table x=\"510\" y=\"19\">";
	strName += "<tr><td >"+ot+"</td></tr>";
	strName += "<tr><td >"+fr+"</td></tr>";
	strName += "<tr><td >"+fe+"</td></tr>";
	strName += "</table>";
	/*/
	var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
	xml += "<pdf><head></head><body font-family='Helvetica' font-size='8' size='216mm x 139mm'>";	
	xml += strName;
	xml += "</body>\n</pdf>";
	var file = nlapiXMLToPDF( xml );
	response.setContentType('PDF','Orden de Trabajo.pdf', 'inline');
	response.write( file.getValue() );
}
function NotNull(v)
{
	if(v==null||v =='')
		return ' ';
	else
		return v;
}
function removeInvalid(v)
{
	v_l = v.length;
	var v_valid = new String();
	for(var i=0;i<=v_l;i++)
	{
		v_dec = v.charCodeAt(i) || 00;
		if(v_dec!=5)
        	v_valid += v.charAt(i);
		if(v_dec==5 || v_dec==0.0)
		{
			v_valid += "<br/>";
		}
	}
	return v_valid;
}