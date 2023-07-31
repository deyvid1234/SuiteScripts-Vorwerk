function typeInvoice_PageInit(type,linenum)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	if(type == 'edit' || type == 'create')
	{
		var role	= nlapiGetRole();
		if(role != 3)
		{
			var codigoRetorno = returnBlank(nlapiGetFieldValue('custbody_codigo_retorno'));
			if(codigoRetorno=='0')
			{
				var transactionType = '';
				if(recordType == 'invoice')
				{
					transactionType = 'Factura';
				}
				if(recordType == 'creditmemo')
				{
					transactionType = 'Nota de crédito';
				}
				alert('No permitido: esta ' + transactionType + ' esta timbrada.');
				var url 				= nlapiResolveURL('RECORD', recordType, recordId, 'VIEW');
				window.onbeforeunload 	= function(e) {return null;};
				window.location.href 	= url;
			}
		}
	}
	if(type == 'copy')
	{
		nlapiSetFieldValue('custbody_codigo_retorno','');
		nlapiSetFieldValue('custbody_mensaje_retorno','');
		nlapiSetFieldValue('custbody_pdf_file','');
		nlapiSetFieldValue('custbody_xml_cfdipro_file','');
		nlapiSetFieldValue('custbody_xml_file','');
	}
	var ov = returnBlank(nlapiGetFieldValue('createdfrom'));
	if(ov!='')
	{
		var filters = new nlobjSearchFilter("internalid",null,"is", ov);
		var columns = new nlobjSearchColumn('tranid');	
		var resultsOV = returnBlank(nlapiSearchRecord("salesorder", null, filters, columns)); 
		if(resultsOV!='')
		{
			nlapiSetFieldValue('custbody_numc',resultsOV[0].getValue('tranid'));
		}
	}
}
function afterSubmit(type)
{
	try
	{
		if(type!='delete')
		{
			var TranId	 		= nlapiGetRecordId();
			var TranType 		= nlapiGetRecordType();
			var factura  		= nlapiLoadRecord(TranType, TranId);
			var codigoRetorno 	= returnBlank(factura.getFieldValue('custbody_codigo_retorno'));
			var cte 			= factura.getFieldValue("entity");
			var cteText			= factura.getFieldText('entity');
			if(cte!=12979)
			{
				var salesRep 	= returnBlank(factura.getFieldText('salesrep'));
				var filters 	= new Object();
				//var columns 	= new Object();
				if(codigoRetorno!='0')
				{
					var addressID = returnBlank(factura.getFieldValue('custbody_id_direccion_cliente'));
					if(addressID == '')
					{
						nlapiSubmitField(TranType,TranId,'custbody_id_direccion_cliente',factura.getFieldValue('billaddresslist'));
						factura  	= nlapiLoadRecord(TranType, TranId);
						addressID 	= factura.getFieldValue('custbody_id_direccion_cliente');
					}
					var emailPresentadora 	= returnBlank(factura.getFieldValue('custbody_email_presentadora'));
					var emailJefaGrupo 		= returnBlank(factura.getFieldValue('custbody_email_jefa_grupo'));
					var emailLuis			= 'luis.liceaga@vorwerk.de';
					var emailCC 			= '';
					if(emailPresentadora!='') 
					{
						emailCC += emailPresentadora +',';
					};
					if(emailJefaGrupo!='')
					{
						emailCC += emailJefaGrupo +',';
					};	
					emailCC +=emailLuis+',';
					var RefNo 						= factura.getFieldValue('tranid');
					var RefNoAux					= RefNo;
						RefNoAux					= RefNoAux.toUpperCase();
					var letraSucursalUni			= RefNo.charCodeAt(0);
					var letraSucursalCha			= String.fromCharCode(letraSucursalUni);
					var filterLugarExpDir			= new nlobjSearchFilter('custrecord_letra_serie', null, 'is', letraSucursalCha);
					var columnsLugarExpDir			= new Array();
		            	columnsLugarExpDir[0] 		= new nlobjSearchColumn('custrecord_direccion');
		            var lugarExpDir					= '';
		            var searchresultsLugarExpDir 	= returnBlank(nlapiSearchRecord('customrecord_sucursales_direcciones', null, filterLugarExpDir, columnsLugarExpDir ));
		            if(searchresultsLugarExpDir!='')
		            {
		            	lugarExpDir 			= returnBlank(searchresultsLugarExpDir[0].getValue('custrecord_direccion'));
		            }
		            else
		            {            	
		            	lugarExpDir 			= '';
		            }
		            //RefNo 	= RefNo.replace('A','A-');
		        	//RefNo 	= RefNo.replace('B','B-');
		        	RefNo 	= RefNo.replace(letraSucursalCha,(letraSucursalCha + '-'));
					var lugarExpedicion		= lugarExpDir;
					var tipoDoc				= new String();
					var baseSerialsCorte 	= ''; 
					if(TranType=='invoice')
					{ 
						tipoDoc 			= 'FCT';
						baseSerialsCorte 	= 5; 
					}
					if(TranType=='creditmemo')
					{ 
						tipoDoc 			= 'NCR';
						baseSerialsCorte 	= 10; 
					}
					//if(TranType=='notadecargo') { tipoDoc = 'NCG'; }
					filters 		= new nlobjSearchFilter("internalid",null,"is", cte);
					var resultsDIR 	= (nlapiSearchRecord("customer", "customsearch_ss_det_dir_cte", filters, null));
					var nombre_cte 	= '';
					var direccion 	= '';
					for(var i=0;i<resultsDIR.length;i++)
					{
						if(resultsDIR[i].getValue("addressinternalid")==addressID)
					  	{
							direccion = returnBlank(resultsDIR[i]);
						   	if(direccion!='')
						   	{
								if(direccion.getValue('isperson')=='T') { nombre_cte = returnBlank(direccion.getValue("altname")); }
							 	else  { nombre_cte 	= returnBlank(direccion.getValue("companyname")); }
						  	 	break;
						  	}
					  	}
					}
					if(direccion!='')
					{
						var lineas 			= factura.getLineItemCount('item');
						var cantidad 		= new Array(),precioUnitario = new Array(), importeArticulo = new Array(),tasaImpuesto = new Array(),impuestoArticulo = new Array(),importeTotal = new Array();
						var subTotal 		= 0.0, impuestoTotal = 0.0, importeDescuento =0.0;
						var discountRate 	= returnBlank(factura.getFieldValue('discountrate'));
						for(var i=1;i<=lineas;i++)
						{
					        tasaImpuesto[i-1] = returnBlank(factura.getLineItemValue('item','taxrate1',i));
					        if(tasaImpuesto[i-1]=='') { tasaImpuesto[i-1] =1; }
					        else 
					        { 
								var s = tasaImpuesto[i-1].search('%');
								if(s !=-1)
								{
									tasaImpuesto[i-1]  	= tasaImpuesto[i-1].replace('%','');
									tasaImpuesto[i-1]  	= Math.abs(tasaImpuesto[i-1]);
									tasaImpuesto[i-1] 	/= 100;
									tasaImpuesto[i-1]  	= tasaImpuesto[i-1].toFixed(4);
								}
					        }
					       	cantidad[i-1] 			= parseFloat(getVal(factura.getLineItemValue('item','quantity',i)));//
					        precioUnitario[i-1] 	= parseFloat(getVal(factura.getLineItemValue('item','rate',i)));//
					        importeArticulo[i-1] 	= parseFloat(cantidad[i-1]) * parseFloat(precioUnitario[i-1]); //
					       	impuestoArticulo[i-1] 	= parseFloat(importeArticulo[i-1]) * parseFloat(tasaImpuesto[i-1]); //
					        importeTotal[i-1] 		= parseFloat(importeArticulo[i-1]) + parseFloat(impuestoArticulo[i-1]);
							subTotal 				+= parseFloat(importeArticulo[i-1]);
							impuestoTotal 			+= parseFloat(impuestoArticulo[i-1]);
						}
						if(discountRate!='')
						{
							var s = discountRate.search('%');
							if(s !=-1)
							{
								discountRate  	= discountRate.replace('%','');
								discountRate  	= Math.abs(discountRate);
								discountRate  	= 100 - discountRate;
								discountRate 	/= 100;
							}
							else
							{
								if(discountRate==0) { discountRate =1; }
								else
								{
									discountRate  	= Math.abs(discountRate);
									discountRate 	/= subTotal;
									discountRate  	= 1 - discountRate;
								}
							}
						}
						else
						{
							discountRate = 1;
						}
						var partidas = "<Partidas>";	
						for(var i=1;i<=lineas;i++)
						{
							partidas 			+= "<Partida>";
							partidas 			+= "<cantidad>"+nlapiEscapeXML((cantidad[i-1]).toFixed(5))+"</cantidad>";
							partidas 			+= "<unidad>"+nlapiEscapeXML(returnNotEmpty(returnBlank(factura.getLineItemValue('item','units_display',i)),2))+"</unidad>";
							partidas 			+= "<descripcion>"+nlapiEscapeXML(returnNotEmpty(returnBlank(factura.getLineItemValue('item','description',i)),1))+"</descripcion>";
							//partidas 			+= "<numSerie>"+nlapiEscapeXML(returnBlank(factura.getLineItemValue('item','serialnumbers',i)))+"</numSerie>";
							partidas 			+= "<precioUnitario>"+nlapiEscapeXML((precioUnitario[i-1]).toFixed(5))+"</precioUnitario>";
							partidas 			+= "<importeArticulo>"+nlapiEscapeXML((importeArticulo[i-1]).toFixed(5))+"</importeArticulo>";
							partidas 			+= "<tasaImpuesto>"+nlapiEscapeXML(returnBlank(factura.getLineItemValue('item','taxrate1',i)))+"</tasaImpuesto>";
							partidas 			+= "<importeImpuesto>"+nlapiEscapeXML((impuestoArticulo[i-1] * discountRate).toFixed(5))+"</importeImpuesto>";
							partidas 			+= "<importeTotal>"+nlapiEscapeXML((parseFloat(importeArticulo[i-1]) + parseFloat((impuestoArticulo[i-1] * discountRate))))+"</importeTotal>";
							var serials 		= returnBlank(factura.getLineItemValue('item','serialnumbers',i));
							var datosPedimento 	= '';
	                        if(serials != '')
	                        {
	                            var dataSerials       = stringToArray(serials,baseSerialsCorte);
	                                //nlapiLogExecution("DEBUG", "dataSerials", dataSerials);
	                            var parameters  		= '&dataSerials=' + dataSerials;
	                            //var urlCapture  		= 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=207&deploy=1&compid=3367613&h=d925d55f969d2cf183d8' + parameters;
															var urlCapture  		= nlapiResolveURL('SUITELET', 'customscript_datos_pedimento', 'customdeploy_datos_pedimento', true) + parameters;
	                            var response    		= nlapiRequestURL(urlCapture, null, null);
	                            datosPedimento     	= response.getBody();  
	                            //nlapiLogExecution("DEBUG", "response", response);
	                            //nlapiLogExecution("DEBUG", "getBody", datosPedimento);
	                            factura.setLineItemValue('item','custcol_datos_pedimento',i,datosPedimento);
	                        }
	                        if(datosPedimento != '')
                        	{
                            	datosPedimento 	= stringToArray(datosPedimento,10);
	                            partidas		+= "<importaciones>";
	                            for(var d=0;d<datosPedimento.length;d++)
	                            {
	                                var subdatosPedimento 	= datosPedimento[d];
	                                	subdatosPedimento 	= subdatosPedimento.split(' - ');
                                	partidas	+= "<importacion>";
	                                partidas	+= "<serie>" 		+ returnBlank(subdatosPedimento[0]) + "</serie>";
	                                partidas	+= "<noPedimento>" 	+ returnBlank(subdatosPedimento[1]) + "</noPedimento>";
	                                partidas	+= "<fecha>" 		+ returnBlank(subdatosPedimento[2]) + "</fecha>";
	                                partidas	+= "<aduana>" 		+ returnBlank(subdatosPedimento[3]) + "</aduana>";
	                                partidas	+= "</importacion>";
	                            }
	                            partidas+= "</importaciones>";
                        	}
                            else
                        	{
	                            partidas	+= "<importaciones>";
	                            partidas	+= "<importacion>";
	                            partidas	+= "<serie></serie>";
	                            partidas	+= "<noPedimento></noPedimento>";
	                            partidas	+= "<fecha></fecha>";
	                            partidas	+= "<aduana></aduana>";
	                            partidas	+= "</importacion>";
	                            partidas	+= "</importaciones>";
                        	}
							partidas += "</Partida>";	
						}
						partidas 			+= "</Partidas>";
						impuestoTotal 		= impuestoTotal * discountRate;
						importeDescuento 	= subTotal - (subTotal * discountRate);
						total 				= parseFloat(subTotal) - parseFloat(importeDescuento) + parseFloat(impuestoTotal); 
						var CFD 			= "<CFD>";
							CFD 			+= "<subTotal>"+nlapiEscapeXML(subTotal.toFixed(5))+"</subTotal>";
							CFD 			+= "<tasaDescuento>"+nlapiEscapeXML(returnBlank(factura.getFieldText('discountitem')))+"</tasaDescuento>";
							CFD 			+= "<importeDescuento>"+nlapiEscapeXML(importeDescuento.toFixed(5))+"</importeDescuento>";
							CFD 			+= "<impuestoTotal>"+nlapiEscapeXML(impuestoTotal.toFixed(5))+"</impuestoTotal>";
							CFD 			+= "<total>"+nlapiEscapeXML(total.toFixed(5))+"</total>";
							CFD 			+= "<tipoMoneda>"+nlapiEscapeXML(returnBlank(factura.getFieldValue('currencyname')))+"</tipoMoneda>";
							CFD 			+= "<metodoDePago>"+nlapiEscapeXML(returnBlank(factura.getFieldValue('custbody_fe_metodo_de_pago')))+"</metodoDePago>";
			                CFD 			+= "<NumCtaPago>"+nlapiEscapeXML(returnBlank(factura.getFieldValue('custbody_fe_num_cuenta')))+"</NumCtaPago>";
			                CFD 			+= "<LugarExpedicion>"+nlapiEscapeXML(lugarExpedicion)+"</LugarExpedicion>";
			                CFD 			+= "<presentadora>" + salesRep + "</presentadora>";
							CFD 			+= "<rfc>"+nlapiEscapeXML('VME060622GL2')+"</rfc>";
							CFD 			+= "<tipoDoc>"+ tipoDoc +"</tipoDoc>";
							CFD 			+= "<folioDoc>"+ RefNo +"</folioDoc>";
							CFD 			+= "<numPedido>"+ +nlapiEscapeXML(returnBlank(factura.getFieldValue('custbody_numc'))) +"</numPedido>";
							CFD 			+= "<Receptor>";
							CFD 			+= "<rfc>"+nlapiEscapeXML(returnBlank(factura.getFieldValue('vatregnum')))+"</rfc>";
							CFD 			+= "<nombre>"+nlapiEscapeXML(nombre_cte)+"</nombre>";
							CFD 			+= "<emailFrom>"+nlapiEscapeXML('facturacion@vorwerk-thermomix.mx')+"</emailFrom>";
							//CFD 			+= "<emailFrom>"+nlapiEscapeXML('')+"</emailFrom>";	
							CFD 			+= "<emailTo>"+nlapiEscapeXML(returnBlank(factura.getFieldValue('custbody_email_cliente')))+"</emailTo>";
							CFD 			+= "<emailToCC>"+nlapiEscapeXML(emailCC)+"</emailToCC>";
							CFD 			+= "<DomicilioFiscal>";
							CFD 			+= "<dir>"+nlapiEscapeXML(direccion.getValue("address1"))+"</dir>";
							CFD 			+= "<col>"+nlapiEscapeXML(direccion.getValue("address2"))+"</col>";
							CFD 			+= "<cd>"+nlapiEscapeXML(direccion.getValue("city"))+"</cd>";
							CFD 			+= "<cp>"+nlapiEscapeXML(direccion.getValue("zipcode"))+"</cp>";
							CFD 			+= "<edo>"+nlapiEscapeXML(direccion.getValue("state"))+"</edo>";
							CFD 			+= "<pais>"+nlapiEscapeXML(direccion.getValue("country"))+"</pais>";
							CFD 			+= "</DomicilioFiscal></Receptor>";
							CFD 			+= partidas + "</CFD>";	
						var xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
						xml += CFD;
						factura.setFieldValue('custbody_data_xml_as_text',xml);
						//factura.setFieldValue('salesrep',salesRep);
						nlapiSubmitRecord(factura);
					}
					else
					{
						nlapiLogExecution('DEBUG','ID Dirección No Encontrado',addressID);
					}
				}
				else
				{
					nlapiLogExecution('DEBUG','Código de Retorno', codigoRetorno);
				}
			}
			else
			{
				nlapiLogExecution('DEBUG','Cliente Inválido', cte + ' - ' + cteText);
			}
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}