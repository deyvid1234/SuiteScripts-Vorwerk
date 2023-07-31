function FE_SF_BT_PDF(request, response)
{
	var Base64		= new MainBase64();
	var titleForm	= 'Pre CFDi';
	try
	{
		if (request.getMethod() == "GET")
		{
			var companypreferences									= nlapiLoadConfiguration('companypreferences');		
			var custscript_fe_sf_gen_pre_usar_um_sat				= companypreferences.getFieldValue('custscript_fe_sf_gen_pre_usar_um_sat');
			var key													= new String();
			var value												= new String();
			var c													= 0;
			var object_fe_unidades_medida							= new Object();
			if(custscript_fe_sf_gen_pre_usar_um_sat == 'T')
			{
				var filters_fe_unidades_medida							= new Array();
					filters_fe_unidades_medida.push(new nlobjSearchFilter('formulatext', null, 'isnotempty').setFormula('{custrecord_fe_unidades_medida_um_netsuite}'));
					filters_fe_unidades_medida.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
				var columns_fe_unidades_medida							= new Array();
					columns_fe_unidades_medida.push(new nlobjSearchColumn('name'));
					columns_fe_unidades_medida.push(new nlobjSearchColumn('altname'));
					columns_fe_unidades_medida.push(new nlobjSearchColumn('custrecord_fe_unidades_medida_leyenda_impresa'));
					columns_fe_unidades_medida.push(new nlobjSearchColumn('custrecord_fe_unidades_medida_um_netsuite'));
				var results_fe_unidades_medida							= returnBlank(nlapiSearchRecord('customrecord_fe_unidades_medida', null, filters_fe_unidades_medida, columns_fe_unidades_medida));
				for(c=0;c<results_fe_unidades_medida.length;c++)
				{
					key							= returnBlank(results_fe_unidades_medida[c].getValue('name'));
					value						= returnBlank(results_fe_unidades_medida[c].getValue('custrecord_fe_unidades_medida_leyenda_impresa'));
					object_fe_unidades_medida[key] 	= key + ' ' + value;
				}
			}
			var object_fe_metodos_pago							= new Object();
			var filters_fe_metodos_pago							= new Array();
				filters_fe_metodos_pago.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
			var columns_fe_metodos_pago							= new Array();
				columns_fe_metodos_pago.push(new nlobjSearchColumn('name'));
				columns_fe_metodos_pago.push(new nlobjSearchColumn('altname'));
				columns_fe_metodos_pago.push(new nlobjSearchColumn('custrecord_fe_metodos_pago_leyenda_impresa'));
			var results_fe_metodos_pago							= returnBlank(nlapiSearchRecord('customrecord_fe_metodos_pago', null, filters_fe_metodos_pago, columns_fe_metodos_pago));
			for(c=0;c<results_fe_metodos_pago.length;c++)
			{
				key							= returnBlank(results_fe_metodos_pago[c].getValue('name'));
				value						= returnBlank(results_fe_metodos_pago[c].getValue('custrecord_fe_metodos_pago_leyenda_impresa'));
				object_fe_metodos_pago[key] = key + ' ' + value;
			}
			var data		 		= returnBlank(request.getParameter('data'));
				data				= Base64.decode(data);
				data				= JSON.parse(data);
			var recordType			= data.recordType;
			var recordId			= data.recordId;
			var transactionRec		= nlapiLoadRecord(recordType, recordId);
			var Comprobante			= returnBlank(transactionRec.getFieldValue('custbody_fe_sf_json_comprobante'));
			var DatosExtra			= returnBlank(transactionRec.getFieldValue('custbody_fe_sf_json_datos_extra'));
			var tranid				= returnBlank(transactionRec.getFieldValue('tranid'));
			if(Comprobante != '' && DatosExtra != '')
			{
				Comprobante							= JSON.parse(Comprobante);
				DatosExtra							= JSON.parse(DatosExtra);
				var pedido							= returnBlank(DatosExtra[0].Valor);
				//var emisorTelFax					= returnBlank(DatosExtra[1].Valor);
				var presentadora					= returnBlank(DatosExtra[2].Valor);
				var terminos						= returnBlank(DatosExtra[3].Valor);
				var montoIVA16						= returnBlank(DatosExtra[4].Valor);
				var strName							= '';
				var footer_height					= '70pt';
				var pagina							= '<pagenumber/> de <totalpages/>';
				var Emisor							= returnBlank(Comprobante.Emisor);
				var Receptor						= returnBlank(Comprobante.Receptor);
				var tipoDeComprobante				= returnBlank(Comprobante.tipoDeComprobante);
				var folio							= returnBlank(Comprobante.folio);
				var serie							= returnBlank(Comprobante.serie);
				var cfecha							= returnBlank(Comprobante.fecha);
				var RegimenFiscal					= returnBlank(Comprobante.Emisor.RegimenFiscal);
				var LugarExpedicion					= returnBlank(Comprobante.LugarExpedicion);
				var Moneda							= returnBlank(Comprobante.Moneda);
				var TipoCambio						= returnBlank(Comprobante.TipoCambio);
				var subTotal						= '$' + currencyFormat(returnNumber(Comprobante.subTotal),2);
				var descuento						= '$' + currencyFormat(returnNumber(Comprobante.descuento),2);
				var impuesto						= '$' + montoIVA16;
				var total							= '$' + currencyFormat(returnNumber(Comprobante.total),2);
				var NumCtaPago						= returnBlank(Comprobante.NumCtaPago);
				var metodoDePago_aux				= nlapiEscapeXML(returnBlank(Comprobante.metodoDePago));
					metodoDePago_aux				= metodoDePago_aux.split(', ');
				var metodoDePago					= new Array();
				var formaDePago						= returnBlank(Comprobante.formaDePago);
				var Conceptos						= returnBlank(Comprobante.Conceptos);
				var Regimen							= new Array();
				var IA								= "";//"<b>IA&nbsp;</b>";
				var PA								= "";//"<b>PA&nbsp;</b>";
				var leyendaTipoDeComprobante		= '';
				var imgConfirmacion					= GetImageAlertBoxMessage('T');
				var rfc								= returnBlank(Receptor.rfc);
				var nombre							= returnBlank(Receptor.nombre);
				var domicilio						= '';
					domicilio 					   += nlapiEscapeXML(returnBlank(Receptor.Domicilio.calle))			+ '<br/>';
					domicilio 					   += nlapiEscapeXML(returnBlank(Receptor.Domicilio.colonia))		+ '<br/>';
					domicilio 					   += nlapiEscapeXML(returnBlank(Receptor.Domicilio.municipio))		+ '<br/>';
					domicilio 					   += nlapiEscapeXML(returnBlank(Receptor.Domicilio.estado))		+ '<br/>';
					domicilio 					   += nlapiEscapeXML(returnBlank(Receptor.Domicilio.pais))			+ '<br/>';
					domicilio 					   += nlapiEscapeXML(returnBlank(Receptor.Domicilio.codigoPostal))	+ '<br/>';
				if(tipoDeComprobante == 'ingreso')
				{
					leyendaTipoDeComprobante = '<b>Factura</b>';	
				}
				if(tipoDeComprobante == 'egreso')
				{
					leyendaTipoDeComprobante = '<b>Nota de Crédito</b>';
				}
				for(var mp=0;mp<metodoDePago_aux.length;mp++)
				{
					metodoDePago.push(object_fe_metodos_pago[metodoDePago_aux[mp]]);
				}
				for(var i=0;i<RegimenFiscal.length;i++)
				{
					Regimen.push(RegimenFiscal[i].Regimen);
				}
				Regimen.join('<br/>');
				strName += "<table width='100%'>";
		    		strName += "<tr>";
		    			strName += "<td border='2' corner-radius='2%' border-color='#0070AD'>";
							strName += "<table width='100%'>";
				    			strName += "<tr>";		    			
				    				strName += "<td width='50%'>";
					    				strName += "<table>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Cliente:"		+ "</b></td><td width='81%'>" + nlapiEscapeXML(nombre)		+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "RFC:"			+ "</b></td><td width='81%'>" + nlapiEscapeXML(rfc)			+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
				    				strName += "<td width='50%'>";
					    				strName += "<table>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Dirección:" 	+ "</b></td><td width='81%'>" + domicilio	+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
			    				strName += "</tr>";
		    				strName += "</table>";
		    			strName += "</td>";
		    		strName += "</tr>";
				strName += "</table>";
				strName += "<p font-size='3'>&nbsp;</p>";
				strName += "<table width='100%'>";
		    		strName += "<tr>";
		    			strName += "<td border='2' corner-radius='2%' border-color='#0070AD'>";
							strName += "<table width='100%'>";
				    			strName += "<tr>";		    			
				    				strName += "<td width='50%'>";
					    				strName += "<table>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Régimen:"				+ "</b></td><td width='81%'>" + nlapiEscapeXML(Regimen)			+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Lugar de Expedición:"	+ "</b></td><td width='81%'>" + nlapiEscapeXML(LugarExpedicion)	+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Moneda:" 				+ "</b></td><td width='81%'>" + nlapiEscapeXML(Moneda)			+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Tipo de Cambio:" 		+ "</b></td><td width='81%'>" + nlapiEscapeXML(TipoCambio)		+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
				    				strName += "<td width='50%'>";
					    				strName += "<table>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Número de Cuenta:"	+ "</b></td><td width='81%'>" + nlapiEscapeXML(NumCtaPago)		+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Método de Pago:"		+ "</b></td><td width='81%'>" + nlapiEscapeXML(metodoDePago)	+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Forma de Pago:" 		+ "</b></td><td width='81%'>" + nlapiEscapeXML(formaDePago)		+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
			    				strName += "</tr>";
		    				strName += "</table>";
		    			strName += "</td>";
		    		strName += "</tr>";
				strName += "</table>";
				strName += "<p font-size='3'>&nbsp;</p>";
				strName += "<table width='100%'>";
		    		strName += "<tr>";
		    			strName += "<td border='2' corner-radius='2%' border-color='#0070AD'>";
							strName += "<table width='100%'>";
				    			strName += "<tr>";		    			
					    			strName += "<td width='50%'>";
					    				strName += "<table>";
					    					strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Pedido:" 			+ "</b></td><td width='81%'>" + pedido			+ "</td></tr>";
					    					strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Presentadora:"	+ "</b></td><td width='81%'>" + presentadora	+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Términos:"		+ "</b></td><td width='81%'>" + terminos		+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "" 				+ "</b></td><td width='81%'>" + ''				+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
				    				strName += "<td width='50%'>";
					    				strName += "<table>";
											strName += "<tr><td colspan='3' rowspan='2'  font-size='16pt' align='center' valign='middle'><br/>DOCUMENTO FISCAL NO VÁLIDO</td></tr>";
					    				strName += "</table>";
				    				strName += "</td>";
			    				strName += "</tr>";
		    				strName += "</table>";
		    			strName += "</td>";
		    		strName += "</tr>";
				strName += "</table>";				
				strName += "<p font-size='3'>&nbsp;</p>";
		    	strName += "<table width='100%' corner-radius='1%'>";
					strName += "<thead>";
						strName += "<tr class='FondoColorOscuro' color=\"#FFFFFF\">";
							strName += "<td width='3%'><b>"					+ "&nbsp;&nbsp;#" 			+ "</b></td>";
							strName += "<td width='21%'><b>" 				+ "Nº. de Identificación" 	+ "</b></td>";
							strName += "<td width='8%'><b>" 				+ "Cantidad" 				+ "</b></td>";
							strName += "<td width='8%'><b>" 				+ "Unidad" 					+ "</b></td>";
							strName += "<td width='30%'><b>" 				+ "Descripción" 			+ "</b></td>";
							strName += "<td width='15%' align='right'><b>" 	+ "Valor Unitario" 			+ "</b></td>";
							strName += "<td width='15%' align='right'><b>" 	+ "Importe" 				+ "&nbsp;&nbsp;</b></td>";
						strName += "</tr>";			
					strName += "</thead>";
					for(var i=0;i<Conceptos.length;i++)
					{
						var line	 					= new Number(i + 1);
						var Concepto					= Conceptos[i];
						var InformacionAduanera			= returnBlank(Concepto.InformacionAduanera);
						var Parte						= returnBlank(Concepto.Parte);
						var noIdentificacion			= returnBlank(Concepto.noIdentificacion);
						var cantidad					= returnBlank(Concepto.cantidad);
						var unidad				= '';
						if(custscript_fe_sf_gen_pre_usar_um_sat == 'T')
						{
							unidad			= returnBlank(object_fe_unidades_medida[Concepto.unidad]);
							unidad			= (unidad == '') ? Concepto.unidad:unidad;
						}
						else
						{
							unidad			= returnBlank(Concepto.unidad);	
						}
						var descripcion					= returnBlank(Concepto.descripcion);
						var valorUnitario				= '$' + currencyFormat(returnNumber(Concepto.valorUnitario),2);
						var importe						= '$' + currencyFormat(returnNumber(Concepto.importe),2);
						var trClass 					= '';
						if(line % 2 == 0)
						{
							trClass = 'FondoColorClaro';
						}
						else
						{
							trClass = 'FondoBlanco';
						}
						strName    += "<tr class='"+ trClass + "'>";
							strName 	+= "<td>&nbsp;&nbsp;" 	+ line				+ "</td>";
							strName 	+= "<td>" 				+ nlapiEscapeXML(noIdentificacion)	+ "</td>";
							strName 	+= "<td>" 				+ nlapiEscapeXML(cantidad)			+ "</td>";
							strName 	+= "<td>" 				+ nlapiEscapeXML(unidad)			+ "</td>";
							strName 	+= "<td>" 				+ nlapiEscapeXML(descripcion)		+ "</td>";
							strName 	+= "<td align='right'>" + nlapiEscapeXML(valorUnitario)		+ "&nbsp;&nbsp;</td>";
							strName 	+= "<td align='right'>" + nlapiEscapeXML(importe)			+ "&nbsp;&nbsp;</td>";
						strName 	+= "</tr>";
						for(var j=0;j<InformacionAduanera.length;j++)
						{	
		        			var numero			= returnBlank(InformacionAduanera[j].numero);
		        			var fecha			= returnBlank(InformacionAduanera[j].fecha);
		        			var aduana			= returnBlank(InformacionAduanera[j].aduana);
		        			strName			   += "<tr class='"+ trClass + "'>";
	        					strName 		   += "<td>" 				+ "&nbsp;"					+ "</td>";
		        				strName 	       += "<td>" + IA			+ nlapiEscapeXML(numero)	+ "</td>";
			        			strName 		   += "<td>" 				+ nlapiEscapeXML(fecha)		+ "</td>";
			        			strName 		   += "<td>" 				+ "&nbsp;"					+ "</td>";
			        			strName 		   += "<td>" 				+ nlapiEscapeXML(aduana)	+ "</td>";
		        			strName		       += "</tr>";
						}
						for(var j=0;j<Parte.length;j++)
						{
		        			var cantidad			= returnBlank(Parte[j].cantidad);
		        			var parte_unidad				= '';
							if(custscript_fe_sf_gen_pre_usar_um_sat == 'T')
							{
								parte_unidad				= returnBlank(object_fe_unidades_medida[Parte[j].unidad]);
								parte_unidad				= (parte_unidad == '') ? Parte[j].unidad:parte_unidad;
							}
							else
							{
								parte_unidad				= returnBlank(Parte[j].unidad);
							}
		        			var noIdentificacion	= returnBlank(Parte[j].noIdentificacion);
		        			var descripcion			= returnBlank(Parte[j].descripcion);
		        			var InformacionAduanera	= returnBlank(Parte[j].InformacionAduanera);
		        			strName			   	   += "<tr class='"+ trClass + "'>";
	        					strName 		   	   += "<td>" 				+ "&nbsp;"							+ "</td>";
		        				strName 	       	   += "<td>" + PA			+ nlapiEscapeXML(noIdentificacion)	+ "</td>";
			        			strName 		   	   += "<td>" 				+ nlapiEscapeXML(cantidad)			+ "</td>";
			        			strName 		   	   += "<td>" 				+ nlapiEscapeXML(unidad)			+ "</td>";
			        			strName 	       	   += "<td>" 				+ nlapiEscapeXML(descripcion)		+ "</td>";
		        			strName		       	   += "</tr>";
		        			for(var k=0;k<InformacionAduanera.length;k++)
							{
			        			var numero			= returnBlank(InformacionAduanera[k].numero);
			        			var fecha			= returnBlank(InformacionAduanera[k].fecha);
			        			var aduana			= returnBlank(InformacionAduanera[k].aduana);
			        			strName			   += "<tr class='"+ trClass + "'>";
		        					strName 		   += "<td>" 				+ "&nbsp;"					+ "</td>";
			        				strName 	       += "<td>" + IA			+ nlapiEscapeXML(numero)	+ "</td>";
				        			strName 		   += "<td>" 				+ nlapiEscapeXML(fecha)		+ "</td>";
				        			strName 		   += "<td>" 				+ "&nbsp;"					+ "</td>";
				        			strName 		   += "<td>" 				+ nlapiEscapeXML(aduana)	+ "</td>";
			        			strName		       += "</tr>";
							}
						}
					}
				strName += "</table>";
				strName += "<p font-size='6'>&nbsp;</p>";
				strName += "<table width='100%'>";
				    strName += "<tr>";
				    	strName += "<td width='10%' align='left'>" + "&nbsp;" + "</td>";
					    strName += "<td width='65%'>";
					        strName +="&nbsp;";
					    strName += "</td>";
					    strName += "<td width='25%'>";
					    	strName +="<table width='100%'>";
					    		strName += "<tr>";
					    			strName += "<td border='2' corner-radius='8%' border-color='#0070AD'>";
						    		    strName += "<table width='100%' corner-radius='0%'>";
											strName += "<tr><td width='49%' align='right'><b>" + "Subtotal:"	+ "</b></td><td align='right' width='50%'>" + nlapiEscapeXML(subTotal)	+ "</td><td width='1%'>&nbsp;</td></tr>";
											strName += "<tr><td width='49%' align='right'><b>" + "Descuento:"	+ "</b></td><td align='right' width='50%'>" + nlapiEscapeXML(descuento)	+ "</td><td width='1%'>&nbsp;</td></tr>";
											strName += "<tr><td width='49%' align='right'><b>" + "Impuesto:" 	+ "</b></td><td align='right' width='50%'>" + nlapiEscapeXML(impuesto)	+ "</td><td width='1%'>&nbsp;</td></tr>";
											strName += "<tr><td width='49%' align='right'><b>" + "Total:" 		+ "</b></td><td align='right' width='50%'>" + nlapiEscapeXML(total)		+ "</td><td width='1%'>&nbsp;</td></tr>";
										strName += "</table>";
					    			strName += "</td>";
					    		strName += "</tr>";
					        strName += "</table>";
					    strName += "</td>";
				    strName += "</tr>";
			    strName += "</table>";
				var currentURL			= request.getURL();
				var index 				= currentURL.indexOf("/app");
			    var host		  		= currentURL.substring(0, index);
				var compaynyInfo 		= nlapiLoadConfiguration('companyinformation');
				var companyInfoLogoId	= returnBlank(compaynyInfo.getFieldValue('formlogo'));
				var companyInfoLogoObj	= new Object();
				var companyInfoLogoURL	= '';
				if(companyInfoLogoId != '')
				{
					companyInfoLogoObj	= nlapiLoadFile(companyInfoLogoId);
				}
				else
				{
					var filtersFile		= new Array();
						filtersFile.push(new nlobjSearchFilter('name', null, 'is', '35507_NO_LOGO.png'));
					var searchFile		= returnBlank(nlapiSearchRecord('file', null, filtersFile, null));
					var NO_LOGO_ID		= searchFile[0].getId();
					companyInfoLogoObj	= nlapiLoadFile(NO_LOGO_ID);
				}
				companyInfoLogoURL	= companyInfoLogoObj.getURL();
				companyInfoLogoURL	= stringToArray(companyInfoLogoURL,38);
				companyInfoLogoURL 	= companyInfoLogoURL.join('&amp;');
				companyInfoLogoURL 	= "src='" + host + companyInfoLogoURL + "'/";
				
				membrete	= nlapiLoadFile(520698);
				membrete	= membrete.getURL();		
				membrete	= stringToArray(membrete,38);
				membrete 	= membrete.join('&amp;');
				membrete 	= membrete;
				
				var Encabezado 	= '';
				    Encabezado += "<table width='100%'>";
					    Encabezado += "<tr>";
					    	Encabezado += "<td width='40%' align='left'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td>";
						    Encabezado += "<td width='40%'>";
						        Encabezado +="<table width='100%'>";
						        	Encabezado += "<tr><td align='left' font-size=\"10pt\"><b>" + nlapiEscapeXML(Emisor.nombre) 						+ "</b></td></tr>";
							        Encabezado += "<tr><td align='left' font-size=\"8pt\">" 	+ nlapiEscapeXML(Emisor.DomicilioFiscal.calle) 			+ "</td></tr>";
							        Encabezado += "<tr><td align='left' font-size=\"8pt\">" 	+ nlapiEscapeXML(Emisor.DomicilioFiscal.colonia) 		+ "</td></tr>";
							        Encabezado += "<tr><td align='left' font-size=\"8pt\">"		+ nlapiEscapeXML(Emisor.DomicilioFiscal.municipio)	 	+ "</td></tr>";
							        Encabezado += "<tr><td align='left' font-size=\"8pt\">"		+ nlapiEscapeXML(Emisor.DomicilioFiscal.estado) 		+ "</td></tr>";
							        Encabezado += "<tr><td align='left' font-size=\"8pt\">"		+ nlapiEscapeXML(Emisor.DomicilioFiscal.pais) 			+ "</td></tr>";
							        Encabezado += "<tr><td align='left' font-size=\"8pt\">"		+ nlapiEscapeXML(Emisor.DomicilioFiscal.codigoPostal) 	+ "</td></tr>";
						        	Encabezado += "<tr><td align='left' font-size=\"8pt\">" 	+ nlapiEscapeXML(Emisor.rfc)							+ "</td></tr>";
						        Encabezado += "</table>";
						    Encabezado += "</td>";
						    Encabezado += "<td width='20%'>";
						        Encabezado +="<table width='100%'>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoColorOscuro' corner-radius='5%'>" 	+ leyendaTipoDeComprobante	+ "</td></tr>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoBlanco' corner-radius='5%'>" 		+ nlapiEscapeXML(folio) 	+ "</td></tr>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoColorOscuro' corner-radius='5%'>" 	+ '<b>Serie</b>'	 		+ "</td></tr>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoBlanco' corner-radius='5%'>" 		+ nlapiEscapeXML(serie) 	+ "</td></tr>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoColorOscuro' corner-radius='5%'>"	+ '<b>Fecha</b>'			+ "</td></tr>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoBlanco' corner-radius='5%'>"		+ nlapiEscapeXML(cfecha)	+ "</td></tr>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoColorOscuro' corner-radius='5%'>"	+ '<b>Página</b>'			+ "</td></tr>";
							        Encabezado += "<tr><td align='center' font-size=\"8pt\" class='FondoBlanco' corner-radius='5%'>"		+ pagina					+ "</td></tr>";
						        Encabezado += "</table>";
						    Encabezado += "</td>";
					    Encabezado += "</tr>";
				    Encabezado += "</table>";
			    var Pie  = "";
				    Pie += "<table width='100%'>";
				    Pie += "<tr>";
				    	Pie += "<td width='10%' align='left'>" + imgConfirmacion + "</td>";
					    Pie += "<td width='50%'>";
					        Pie +="<table width='100%'>";
					        	Pie += "<tr><td><b>AVISO IMPORTANTE</b></td></tr>";
					        	Pie += "<tr><td>";
					        		Pie += "<ol marker-type='upper-roman' marker-prefix='(' marker-suffix=')'>";
					        			Pie += "<li>ESTE DOCUMENTO CONTIENE INFORMACION VALIDADA</li>";
				        				Pie += "<li>ESTE DOCUMENTO ES UNA PRE-IMPRESON DE UN CFDI</li>";
					        			Pie += "<li>ESTE DOCUMENTO NO TIENE VALIDEZ FISCAL</li>";
					        		Pie += "</ol>";
				        		Pie += "</td></tr>";
					        Pie += "</table>";
					    Pie += "</td>";
					    Pie += "<td width='5%' align='left'>" + "&nbsp;" + "</td>";
					    Pie += "<td width='35%'>";
					    	Pie +="<table width='100%'>";
					    		Pie += "<tr>";
					    			Pie += "<td border='2' corner-radius='8%' border-color='#0070AD'>";
						    		    Pie += "<table width='100%' corner-radius='0%'>";
											Pie += "<tr><td>" + "&nbsp;" + "</td></tr>";
											Pie += "<tr><td>" + "&nbsp;" + "</td></tr>";
											Pie += "<tr><td>" + "&nbsp;" + "</td></tr>";
											Pie += "<tr><td>" + "&nbsp;" + "</td></tr>";
										Pie += "</table>";
					    			Pie += "</td>";
					    		Pie += "</tr>";
					        Pie += "</table>";
					    Pie += "</td>";
				    Pie += "</tr>";
				    Pie += "<tr>";
				    	Pie += "<td width='10%'>" 					+ "&nbsp;" 					+ "</td>";
				    	Pie += "<td width='50%'>" 					+ "&nbsp;" 					+ "</td>";
					    Pie += "<td width='5%'>" 					+ "&nbsp;" 					+ "</td>";
					    Pie += "<td width='35%' align='center'>" 	+ "<b>Nombre y Firma</b>" 	+ "</td>";
				    Pie += "</tr>";
			    Pie += "</table>";
			    var OpenSansExtraBoldURL		= getFileDetails('name','OpenSans-ExtraBold.ttf',host,'url');
				var OpenSansExtraBoldItalicURL	= getFileDetails('name','OpenSans-ExtraBoldItalic.ttf',host,'url');
				var OpenSansLightURL			= getFileDetails('name','OpenSans-Light.ttf',host,'url');
				var OpenSansLightItalicURL		= getFileDetails('name','OpenSans-LightItalic.ttf',host,'url');
				var OpenSansSemiBoldURL			= getFileDetails('name','OpenSans-Semibold.ttf',host,'url');
				var OpenSansSemiBoldItalicURL	= getFileDetails('name','OpenSans-SemiboldItalic.ttf',host,'url');
				var OpenSansRegularURL			= getFileDetails('name','OpenSans-Regular.ttf',host,'url');
				var OpenSansBoldURL				= getFileDetails('name','OpenSans-Bold.ttf',host,'url');
				var OpenSansBoldItalicURL		= getFileDetails('name','OpenSans-BoldItalic.ttf',host,'url');
				var OpenSansItalicURL			= getFileDetails('name','OpenSans-Italic.ttf',host,'url');
				var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
					xml += "<pdf>";
						xml += "<head>";
							xml += "<link name=\"OpenSansExtraBold\" 	type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansExtraBoldURL 	+ "\" src-bold=\"" + OpenSansExtraBoldURL 	+ "\"  src-bolditalic=\"" + OpenSansExtraBoldItalicURL 	+ "\" src-italic=\"" + OpenSansExtraBoldItalicURL 	+ "\"/>";
							xml += "<link name=\"OpenSansLight\" 		type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansLightURL 		+ "\" src-bold=\"" + OpenSansLightURL 		+ "\"  src-bolditalic=\"" + OpenSansLightItalicURL 		+ "\" src-italic=\"" + OpenSansLightItalicURL 		+ "\"/>";
							xml += "<link name=\"OpenSansSemiBold\" 	type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansSemiBoldURL 	+ "\" src-bold=\"" + OpenSansBoldURL 		+ "\"  src-bolditalic=\"" + OpenSansSemiBoldItalicURL 	+ "\" src-italic=\"" + OpenSansSemiBoldItalicURL 	+ "\"/>";
							xml += "<link name=\"OpenSansRegular\" 		type=\"font\" subtype=\"TrueType\" src=\"" + OpenSansRegularURL 	+ "\" src-bold=\"" + OpenSansBoldURL 		+ "\"  src-bolditalic=\"" + OpenSansBoldItalicURL 		+ "\" src-italic=\"" + OpenSansItalicURL 			+ "\"/>";
							xml += "<style>";
						        xml += ".FondoColorOscuro{color:#FFFFFF; background-color:#0070AD; font:OpenSansSemiBold;} ";
						        xml += ".FondoColorClaro{color:#000000; background-color:#CFE7F5; font:OpenSansLight;} ";
						        xml += ".FondoBlanco{background-color:#FFFFFF; font:OpenSansLight;} ";
						        xml	+= ".membrete { background-image: url('"+membrete+"')}"
					        xml += "</style>";
					        xml += "<macrolist>";
						    	xml += "<macro id=\"myheader\">" 	+ Encabezado 	+ "</macro>";
						    	xml += "<macro id=\"myfooter\">" 	+ Pie		 	+ "</macro>";
						    xml += "</macrolist>";
						xml += "</head>";
						xml += "<body font-family='OpenSansRegular' font-size='7'  header=\"myheader\" header-height=\"105pt\" footer=\"myfooter\" footer-height='" + footer_height + "'>";
							xml += strName;
						xml += "</body>\n";
					xml += "</pdf>";
				var file 		= nlapiXMLToPDF( xml );
				var fileName	= titleForm + ' ' + recordType + ' ' + tranid +  '.pdf';
				response.setContentType('PDF',fileName, 'inline');
				response.write(file.getValue());
			}
		}
		else
		{
			
		}
	}
    catch(e)
    {
    	var tituloFallo		= new String();
    	var mensajeFallo	= new String();
    	var data			= new Object();
    	var identacion		= '<td>&nbsp;</td><td>&nbsp;</td><td>ᐅ</td>';
        if ( e instanceof nlobjError )
        {
        	var ecode 		 = returnBlank(e.getCode());
        	var edetails 	 = returnBlank(e.getDetails());
        	var eid 		 = returnBlank(e.getId());
        	var einternalid	 = returnBlank(e.getInternalId());
        	var estacktrace	 = returnBlank(e.getStackTrace());
        		estacktrace	 = estacktrace.join();
        	var euserevent 	 = returnBlank(e.getUserEvent());
        	tituloFallo		+= "<b>Ha ocurrido un error, debido a las siguientes razones:</b>";
        	mensajeFallo 	+= "<p>&nbsp;</p>";
        	mensajeFallo 	+= '<table class=\"text\">';
	    		mensajeFallo	+= "<tr>" + identacion + "<td>" + '<b>Error Code: </b>' 		+ "</td><td>" + ecode		+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error Details: </b>' 		+ "</td><td>" + edetails	+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error ID: </b>'			+ "</td><td>" + eid			+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error Internal ID: </b>'	+ "</td><td>" + einternalid	+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error Stacktrace: </b>'	+ "</td><td>" + estacktrace	+"</td></tr>";
	    		mensajeFallo 	+= "<tr>" + identacion + "<td>" + '<b>Error User Event: </b>' 	+ "</td><td>" + euserevent 	+"</td></tr>";
        	mensajeFallo 	+= '</table>';
            nlapiLogExecution( 'ERROR', 'Error Code',ecode);
            nlapiLogExecution( 'ERROR', 'Error Detail',edetails);
            nlapiLogExecution( 'ERROR', 'Error ID',eid);
            nlapiLogExecution( 'ERROR', 'Error Internal ID',einternalid);
            nlapiLogExecution( 'ERROR', 'Error Stacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'Error User Event',euserevent);
        }
        else
        {
        	var errorString	 	= e.toString();
        	tituloFallo			= '<b>Ha ocurrido un error, debido a la siguiente raz&oacute;n:</b>';
        	mensajeFallo 		+= "<p>&nbsp;</p>";
        	mensajeFallo 		+= '<table class=\"text\">';
        		mensajeFallo 		+= "<tr>" + identacion + "<td>" + '<b>Unexpected Error: </b>' + "</td><td>" + errorString +"</td></tr>";
        	mensajeFallo 		+= '</table>';
            nlapiLogExecution( 'ERROR', 'Unexpected Error',errorString );
        }
		mensajeFallo += "<br>Consulte a Soporte T&eacute;cnico y mueste este mensaje.";
		mensajeFallo += "<br><br>Puede continuar navegando en <b>NetSuite</b>";
		data.titleForm 						= titleForm;
		data.exito		 					= 'F';
		data.tituloFallo					= tituloFallo;
		data.mensajeFallo 					= mensajeFallo;
		data								= JSON.stringify(data);
		data   		 						= Base64.encode(data);
        var params_handler_error			= new Array();
	    	params_handler_error['data']	= data;
    	nlapiSetRedirectURL('SUITELET','customscript_fe_sf_he', 'customdeploy_fe_sf_he', false, params_handler_error);
		nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
    }
}