/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Sep 2016     IMR
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
// Generacion de PDF
function OrdendeServicioPDF(request, response)
{
	var Base64		= new MainBase64();
	var data 		= request.getParameter('data');
		data	   	= Base64.decode(data);
		data		= stringToArray(data,10);
	var recordType 	= returnBlank(data[0]);	
	var recordId 	= returnBlank(data[1]);	
	var host 		= returnBlank(data[2]);
	var titleForm	= 'Orden de Servicio';
	try
	{
		var record 		= nlapiLoadRecord(recordType,recordId);
		var num			= returnBlank(record.getFieldValue('tranid'));
		var fecha		= returnBlank(record.getFieldValue('trandate'));
		var cliente		= returnBlank(record.getFieldValue('entity'));
		var customer	= nlapiLoadRecord('customer', cliente);
		var nombre 		= returnBlank(customer.getFieldValue('altname'));
		var tel 		= returnBlank(customer.getFieldValue('phone'));
		var movil		= returnBlank(customer.getFieldValue('mobilephone'));
		var mail		= returnBlank(customer.getFieldValue('email'));
		var calle		= returnBlank(customer.getFieldValue('billaddr1'));
		var colonia		= returnBlank(customer.getFieldValue('billaddr2'));
		var ciudad		= returnBlank(customer.getFieldValue('billcity'));
		var estado		= returnBlank(customer.getFieldValue('billstate'));
		var cp			= returnBlank(customer.getFieldValue('billzip'));
		var pais		= returnBlank(customer.getFieldValue('billcountry'));
		var direccion	= calle+', '+colonia+', '+ciudad+', '+estado+', '+cp+', '+pais;
		//var direccion	= returnBlank(record.getFieldValue('custbodycontacto2'));
		var modelo		= returnBlank(record.getFieldValue('custbody43'));
		var garantia	= returnBlank(record.getFieldValue('custbody_garantia'));
		var serie		= returnBlank(record.getFieldValue('custbody_numero_serie'));
		var obser		= returnBlank(record.getFieldValue('custbody_obse'));
		var nota_obs	= '**En caso de Garant&iacute;a el cliente deber&aacute; presentar Factura de compra';
		var v_golpeado	= returnBlank(record.getFieldValue('custbody61'));
		var v_desgasta	= returnBlank(record.getFieldValue('custbody62'));
		var v_rayado	= returnBlank(record.getFieldValue('custbody63'));
		var a_golpeado	= returnBlank(record.getFieldValue('custbody64'));
		var a_desgasta	= returnBlank(record.getFieldValue('custbody65'));
		var a_rayado	= returnBlank(record.getFieldValue('custbody66'));
		var e_golpeado	= returnBlank(record.getFieldValue('custbody67'));
		var e_desgasta	= returnBlank(record.getFieldValue('custbody68'));
		var e_rayado	= returnBlank(record.getFieldValue('custbody69'));
		var p_golpeado	= returnBlank(record.getFieldValue('custbody70'));
		var p_desgasta	= returnBlank(record.getFieldValue('custbody71'));
		var p_rayado	= returnBlank(record.getFieldValue('custbody72'));
		var otros		= returnBlank(record.getFieldValue('custbody75'));
		var condicion	= nlapiEscapeXML(returnBlank(record.getFieldValue('custbody_imr_condordserv')));
			condicion	= condicion.split('\r\n\r\n');
		var condordserv = '';
		for(var i=0;i<condicion.length;i++)
		{
				condordserv += condicion[i] + '<br/><br/>';
		}
		
		var checkfield = nlapiLoadFile(401207);
		checkfieldURL	= checkfield.getURL();
		checkfieldURL	= stringToArray(checkfieldURL,38);
		checkfieldURL 	= checkfieldURL.join('&amp;');
		checkfieldURL 	= "src='" + host + checkfieldURL + "'/";

		var companyInfoLogoObj	= new Object();
		var companyInfoLogoURL	= '';
		companyInfoLogoObj	= nlapiLoadFile(401096);
		companyInfoLogoURL	= companyInfoLogoObj.getURL();
		companyInfoLogoURL	= stringToArray(companyInfoLogoURL,38);
		companyInfoLogoURL 	= companyInfoLogoURL.join('&amp;');
		companyInfoLogoURL 	= "src='" + host + companyInfoLogoURL + "'/";
	
		var Encabezado = '';
			Encabezado += "<table width='100%'>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='8'><img width=\"85%\" height=\"75%\" "+ companyInfoLogoURL +"></td>"; //LOGO
					Encabezado += "<td colspan='8'>&nbsp;&nbsp;&nbsp;&nbsp;</td>";
					Encabezado += "<td colspan='2' align='center' vertical-align='middle' border-left='1' border-top='1' border-bottom='1'>" + "N&uacute;m" + "</td>";
					Encabezado += "<td colspan='8' align='center' vertical-align='middle' border='1' font-size=\"12pt\">" + num + "</td>"; //NUMERO ORDEN DE SERVICIO
				Encabezado += "</tr>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='16'>&nbsp;&nbsp;&nbsp;&nbsp;</td>";
					Encabezado += "<td colspan='2' align='center' vertical-align='middle' border-left='1' border-top='1' border-bottom='1'>" + "Fecha" + "</td>";
					Encabezado += "<td colspan='8' align='center' vertical-align='middle' border='1' font-size=\"12pt\">" + fecha + "</td>"; //FECHA ORDEN DE SERVICIO
				Encabezado += "</tr>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='26' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
				Encabezado += "</tr>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='26' align='center' font-size=\"10pt\"><b>ORDEN DE SERVICIO T&Eacute;CNICO</b></td>"; //TITULO
				Encabezado += "</tr>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='26' align='center' font-size=\"6pt\">" + "Vorwerk M�xico, S. de R.L. de C.V." + "</td>"; //INFORMACION DE LA EMPRESA
				Encabezado += "</tr>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='26' align='center' font-size=\"6pt\">" + "Cracovia 33, Colonia San Angel, Delegaci�n Alvaro Obreg�n" + "</td>";
				Encabezado += "</tr>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='26' align='center' font-size=\"6pt\">" + "M�xico, CDMX 01000 Phone 5616 - 5560" + "</td>";
				Encabezado += "</tr>";
				Encabezado += "<tr>";
					Encabezado += "<td colspan='26' align='center' font-size=\"8pt\">" + "http://thermomix.vorwerk.mx" + "</td>";
				Encabezado += "</tr>";
			Encabezado += "</table>";
		
		var strName = ''; //CUERPO
			strName += "<table width='100%'>";
				strName += "<tr>";
					strName += "<td colspan='52'><b><u>" + "DATOS DEL CLIENTE" + "</u></b></td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='9'>" + "Nombre / Raz&oacute;n Social" + "</td>";
					strName += "<td colspan='43' border='1'>" + nombre + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='9'>" + "Tel&eacute;fono" + "</td>";
					strName += "<td colspan='19' border='1'>" + tel + "</td>";
					strName += "<td colspan='5' align='right'>" + "M&oacute;vil" + "</td>";
					strName += "<td colspan='19' border='1'>" + movil + "</td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td colspan='52' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
			strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='9'>" + "E-mail" + "</td>";
					strName += "<td colspan='24' border='1'>" + mail + "</td>";
					strName += "<td colspan='19'>" + "&nbsp;" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				//SIGUIENTE SECCION
				strName += "<tr>";
					strName += "<td colspan='52'><b><u>" + "DOMICILIO" + "</u></b></td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='9'>" + "Direcci&oacute;n" + "</td>";
					strName += "<td colspan='43' border='1'>" + direccion + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='9'>" + "MODELO" + "</td>";
					strName += "<td colspan='19' border='1'>" + modelo + "</td>";
					strName += "<td colspan='9' align='right'>" + "Garant&iacute;a" + "</td>";
					strName += "<td colspan='2'>" + "S&iacute;" + "</td>";
					if(garantia == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
						strName += "<td colspan='9' align='right'>" + "No" + "</td>";
						strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
						strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
						strName += "<td colspan='9' align='right'>" + "No" + "</td>";
						strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='4%' height='4%' "+ checkfieldURL +"></td>";//CHECK
						strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
					}
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='9'>" + "NUMERO DE SERIE" + "</td>";
					strName += "<td colspan='19' border='1'>" + serie + "</td>";
					strName += "<td colspan='24'>" + "&nbsp;" + "</td>";
				strName += "</tr>";
			strName += "</table>";
			
			strName += "<p font-size='2'>&nbsp;</p>";//ESPACIO ENTRE TABLAS
			
			//SIGUIENTE SECCION - NUEVA TABLA
			strName += "<table width='100%' border='1'>";
				strName += "<tr>";
					strName += "<td colspan='52'><b><u>" + "FALLAS REPORTADAS POR EL CLIENTE" + "</u></b></td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52'><b><u>" + obser + "</u></b></td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' align='center' font-size=\"6pt\"><b><u>" + nota_obs + "</u></b></td>";
				strName += "</tr>";
			strName += "</table>";
			
			strName += "<p font-size='2'>&nbsp;</p>";//ESPACIO ENTRE TABLAS
			
			//SIGUIENTE SECCION - NUEVA TABLA			
			strName += "<table width='100%'>";
				strName += "<tr>";
					strName += "<td colspan='52'><b><u>" + "OBSERVACIONES (INSPECCI&Oacute;N VISUAL)" + "</u></b></td>";
				strName += "</tr>";
				//PRIMERA LINEA DE CHECKS
				strName += "<tr>";
					strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
					if(v_golpeado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Vaso Golpeado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(a_desgasta == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Asa y pie de Vaso Desgastado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(e_rayado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Exterior Rayado" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"2pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				//SEGUNDA LINEA DE CHECKS
				strName += "<tr>";
					strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
					if(v_desgasta == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Vaso Desgastado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(a_rayado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Asa y pie de Vaso Rayado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(p_golpeado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Ventana Panel Golpeado" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"2pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				//TERCERA LINEA DE CHECKS
				strName += "<tr>";
					strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
					if(v_rayado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Vaso Rayado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(e_golpeado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Exterior Golpeado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(p_desgasta == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Ventana Panel Desgastado" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"2pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				//CUARTA LINEA DE CHECKS
				strName += "<tr>";
					strName += "<td colspan='1'>" + "&nbsp;" + "</td>";
					if(a_golpeado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Asa y pie de Vaso Golpeado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(e_desgasta == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Exterior Desgastado" + "</td>";
					strName += "<td colspan='6'>" + "&nbsp;" + "</td>";
					if(p_rayado == 'T')
					{
						strName += "<td colspan='1' align='center' vertical-align='middle' border='1' padding-top='-5' padding-bottom='-5'><img width='3%' height='3%' "+ checkfieldURL +"></td>";//CHECK
					}
					else
					{
						strName += "<td colspan='1' border='1' padding-top='-5' padding-bottom='-5'>" + "&nbsp;" + "</td>";
					}
					strName += "<td colspan='12' align='right'>" + "Ventana Panel Rayado" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='52' font-size=\"4pt\"></td>";//ESPACIO ENTRE LINEAS
				strName += "</tr>";
				//OTROS
				strName += "<tr>";
					strName += "<td colspan='52'>" + "Otros:" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					if(otros != '')
					{
						strName += "<td colspan='52' border='1'>" + otros + "</td>";
					}
					else
					{
						strName += "<td colspan='52' border='1' font-size=\"8pt\">" + "&nbsp;" + "</td>";
					}
				strName += "</tr>";
			strName += "</table>";
			
			strName += "<p font-size='4'>&nbsp;</p>";//ESPACIO ENTRE TABLAS
			
			
			condordserv	= '<tr><td>La firma de éste documento implica la aceptación de todas y cada una de las siguientes condiciones:</td></tr>'+

				'<tr><td>1) El C. '+nombre+' autoriza a Vorwerk México, S. de R. L. de C.V. a realizar todas las pruebas y diagnósticos '+
				'técnicos necesarios que determinen la falla o avería en el equipo Thermomix TM5 con número de serie '+serie+'.</td></tr>'+

				'<tr><td>2) Manifiesto mi absoluta conformidad en cubrir por el costo de $350.00 (TRESCIENTOS CINCUENTA PESOS 00/100 M. N.) más el impuesto al valor '+
				'agregado (I.V.A.) para que Vorwerk México S. de R.L. de C.V. realice todas las pruebas, testeo y diagnósticos al equipo señalado en el punto anterior '+
				', mismos que servirán para determinar la falla o avería, cantidad que en ningún caso será reembolsable, ni se tomara a cuenta en el costo de la reparación'+
				'que se requiera de mi equipo.</td></tr>'+

				'<tr><td>3) Vorwerk México S. de R.L. de C.V. se compromete a notificar al cliente el diagnóstico realizado al equipo Thermomix TM5 que se deje para valoración '+
				'y/o reparación, dentro del plazo de 5 días hábiles contados a partir de que se reciba el equipo.</td></tr>'+

				'<tr><td>4) En caso de no cubrir la cantidad correspondiente del costo de la reparación y sin que el cliente haya recogido el equipo que se dejó para diagnóstico '+
				' y valoración sin la aceptación del costo que pudiera generar la reparación del equipo, se cobrarán $50.00 (CINCUENTA PESOS 00/100 M. N.) diarios por concepto de almacenaje.</td></tr>'+

				'<tr><td>5) Si el cliente no recoge su equipo en un lapso de treinta días contados a partir de la negativa a la aceptación de la reparación y su costo, el equipo '+
				'Thermomix TM5 con número de serie '+serie+' será destruido sin que exista ninguna responsabilidad para Vorwerk México, S. de R.L. de C.V.</td></tr>'+

				'<tr><td>6) Toda reparación efectuada por los técnicos autorizados de Vorwerk México, S. de R.L. de C.V., contarán con un año de garantía contados a partir de la '+
				'entrega del equipo al cliente, quien a su vez firmará con su nombre y firma la recepción del mismo previa exhibición del pago por el monto total por la reparación de su equipo.</td></tr>'+

				'<tr><td>7) Para que le sea entregado el equipo que se dejó en reparación al cliente, será necesario sin excepción alguna la presentación de éste documento. En caso '+
				'de pérdida o extravío del mismo deberá solicitar por escrito a Vorwerk México, S. de R.L. de C.V., la reposición del documento acreditando con copia simple de identificación '+
				'oficial vigente su personalidad.</td></tr>'+

				'<tr><td>8) Autorizo a Vorwerk México, S. de R.L. de C.V. a realizar la reparación de mi equipo Thermomix, siempre y cuando el costo de la reparación presupuestada no '+
				'rebase de la cantidad de $1,800.00 (UN MIL OCHOCIENTOS PESOS 00/100 M.N.).</td></tr>'+

				'<tr><td>9) En caso de que el costo de la reparación exceda la cantidad de $1,800.00 (UN MIL OCHOCIENTOS PESOS 00/100 M.N.) Vorwerk México, S. de R.L. de C.V. se obliga a notificarme '+
				'por escrito el costo total de la reparación, para lo cual me obligo a pagar en su totalidad al momento en que se me notifique por escrito que el equipo esta reparado y listo para su entrega.</td></tr>'+

				'<tr><td>10) En caso de requerir que el equipo sea entregado en mi domicilio, acepto cubrir el costo total de envío, para lo cual se </td></tr>'+
				'<tr><td>deberá acreditar haber cubierto previamente el 100% (cien por ciento) del costo total por la reparación.</td></tr>'+
				'<tr><td>- REQUIERO ENTREGA A DOMICILIO   (    ) SI         (    ) NO</td></tr>'+
				'<tr><td>DOMICILIO:</td></tr>'+
				'<tr><td>'+direccion+'</td></tr>';
			
			var condordserv2 = '<tr><td>Para el caso de que la entrega sea dentro de la demarcación de la Ciudad de México, el costo será de $350.00 (TRESCIENTOS CINCUENTA PESOS 00/100 M.N.)'+
								'mismo que me obligo a pagar de manera anticipada al momento en que me sea notificado por escrito el costo total de la reparación y haya dado mi aprobación.</td></tr>'+
					
								'<tr><td>Para el caso de que la entrega sea dentro en el interior de la República, el costo será de $550.00 (QUINIENTOS CINCUENTA PESOS 00/100 M. N.) mismo que me'+
								'obligo a pagar de manera anticipada al momento en que me sea notificado por escrito el costo total de la reparación y haya dado mi aprobación.</td></tr>'+
					
								'<tr><td>11) Tanto Vorwerk México, S. de R.L. de C.V. como el Cliente, aceptan todas y cada una de las condiciones, derechos y obligaciones establecidas en la '+
								'presente Orden de Servicio, para lo cual si el presente documento no contiene la firma del cliente y el sello de la empresa, no tendrá validez alguna.</td></tr>'+
					
								'<tr><td>12) Para la interpretación y cumplimiento del presente documento ambas partes convienen y se sujetan a la jurisdicción de la Ciudad de México, así como'+
								'a los Tribunales competentes en ella, renunciando en todo momento a cualquier jurisdicción o fuero que corresponda en razón de su domicilio presente o '+
								'futuro.</td></tr>'+
					
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td>13) Domicilio del cliente:</td></tr>'+
								'<tr><td>'+direccion+'</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td>Telefono: '+tel+'</td></tr>'+
								'<tr><td>Email: '+mail+'</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td>NOTIFICAR VIA: _________________________________</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td align="center">CLIENTE:</td></tr>'+
								'<tr><td>Nombre: <u>'+nombre+'</u></td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td align="center">Firma: __________________________________</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td>Fecha: ___________________________________</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td>&nbsp;</td></tr>'+
								'<tr><td align="center">SELLO DE LA EMPRESA</td></tr>'+
								'<tr><td rowpan="10" style="border: 0.1 px; corner-radius: 10px;" font-size="80pt" border="1">&nbsp;</td></tr>';
			

			
			

			//SIGUIENTE SECCION - NUEVA TABLA
			strName += "<table width='100%' page-break-inside='avoid' class='condiciones'>";
					strName +=  '<tr>' ;
						strName +=  '<td width="100px"><table class="condiciones">'+condordserv+'</table></td>' ;
						strName +=  '<td width="50%"><table class="condiciones">'+condordserv2+'</table></td>' ;
					strName +=  '</tr>' ;
			strName += "</table>";

			/*strName += "<p font-size='4'>&nbsp;</p>";//ESPACIO ENTRE TABLAS
			
			strName += "<table width='100%'>";
				strName += "<tr>";
					strName += "<td colspan='28' font-size=\"8pt\">" + "&nbsp;" + "</td>";
					strName += "<td colspan='24' font-size=\"8pt\" border-left='1' border-right='1' border-top='1'>" + "&nbsp;" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='28' font-size=\"8pt\">" + "&nbsp;" + "</td>";
					strName += "<td colspan='24' font-size=\"8pt\" border-left='1' border-right='1'>" + "&nbsp;" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='28' font-size=\"8pt\">" + "&nbsp;" + "</td>";
					strName += "<td colspan='24' font-size=\"8pt\" border-left='1' border-right='1'>" + "&nbsp;" + "</td>";
				strName += "</tr>";
				strName += "<tr>";
					strName += "<td colspan='20' align='center' border-top='0.25'><p align='center' font-size=\"8pt\">Nombre y Firma de Cliente</p></td>";//FIRMA
					strName += "<td colspan='8'>" + "&nbsp;" + "</td>";
					strName += "<td colspan='24' align='center' border-left='1' border-right='1' border-bottom='1' font-size=\"7pt\">" + "Fecha___/_____/____y Sello de la Empresa" + "</td>";//FECHA Y SELLO
				strName += "</tr>";
			strName += "</table>";*/
			
		
		var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
			xml += "<pdf>";
				xml += "<head>";
					xml += "<macrolist>";
					    xml += "<macro id=\"myheader\">" 	+ Encabezado 	+ "</macro>";
					xml += "</macrolist>";
					xml += "<style>"
						xml += ".condiciones tr td{ font-size: 8pt}";
					xml += "</style>"
				xml += "</head>";
				xml += "<body font='helvetica' font-size='8' size='letter'  header=\"myheader\" header-height=\"120pt\">";
					xml += strName;
				xml += "</body>\n";
			xml += "</pdf>";
		var file 		= nlapiXMLToPDF( xml );
		var fileName	= titleForm + ' ' + recordType + ' ' + recordId +'.pdf';
		response.setContentType('PDF',fileName, 'inline');
		response.write(file.getValue());
	}
	catch(e)
	{
		var customscript		= 'customscript_orden_servicio_he';
    	var customdeploy		= 'customdeploy_orden_servicio_he';
    	var HE_Catch_UE 		= Generic_HE_Catch_UE(e,recordType,recordId,titleForm,request);
        var HE_Params			= new Array();
        	HE_Params['data']	= HE_Catch_UE;
		nlapiSetRedirectURL('SUITELET',customscript,customdeploy, false, HE_Params);
	}
}