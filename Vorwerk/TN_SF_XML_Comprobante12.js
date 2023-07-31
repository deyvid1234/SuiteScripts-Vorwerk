function TN_SF_XML_Comprobante(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	var Base64		= new MainBase64();
	var prefijo		= '';
	var search		= '';
	var serie		= '';
	var join 		= '';
	try
	{
		if(type != 'delete')
		{
			switch(recordType)
			{
				case 'customrecord_comisiones_gtm':
				{
					join	= 'custrecord_gtm_empleado';
					serie 	= 'GTM';
					prefijo = 'gtm';
					search	= 'customsearch_gtm_tn_sf_xml_comprobante';
				};break;
				case 'customrecord_comisiones_pre':
				{
					join	= 'custrecord_pre_empleado';
					serie 	= 'PRE';
					prefijo = 'pre';
					search	= 'customsearch_pre_tn_sf_xml_comprobante';
				};break;
				case 'customrecord_comisiones_jdg':
				{
					join	= 'custrecord_jdg_empleado';
					serie 	= 'JDG';
					prefijo = 'jdg';
					search	= 'customsearch_jdg_tn_sf_xml_comprobante';
				};break;
			}
			var filters									= new Array();
				filters.push(new nlobjSearchFilter('internalid',null,'is',recordId));
			var customsearch_tn_sf_xml_comprobante		= returnBlank(nlapiSearchRecord(recordType, search, filters, null));
			if(customsearch_tn_sf_xml_comprobante != '')
			{
				var _tn_sf_codigo_respuesta		= returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo +  '_codigo_respuesta'));
				var _tn_sf_mensaje_respuesta	= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo +  '_mensaje_respuesta'));
				if(_tn_sf_codigo_respuesta != 200)
				{		
					var fc													= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo +  '_fecha_comision'));
						fc													= stringToArray(fc, 47);
					var fcY													= returnNumber(fc[1]);
					var fcYA												= new Number();
					var fcM													= returnNumber(fc[0]);
					var fcMA												= new Number();
					var fcD					 								= new Number();
					var fcDA				 								= new Number();
					var filtersFC   										= new Array();
						filtersFC.push(new nlobjSearchFilter('custrecord_year', null, 'equalto', fcY));
					var resultsFechasCorte 									= returnBlank(nlapiSearchRecord('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFC, null));
						fcD					 								= resultsFechasCorte[0].getValue(('custrecord_mes_' + fcM));
					if(fcMA == 0)
					{
						fcYA				 								= fcY -1;
						fcMA												= 12;
						filtersFC   										= new Array();
						filtersFC.push(new nlobjSearchFilter('custrecord_year', null, 'equalto', fcYA));
						resultsFechasCorte 									= returnBlank(nlapiSearchRecord('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFC, null));
						fcDA				 								= resultsFechasCorte[0].getValue(('custrecord_mes_' + fcMA));
					}
					else
					{
						fcYA				 								= fcY;
						fcMA												= fcM - 1;
						fcDA				 								= resultsFechasCorte[0].getValue(('custrecord_mes_' + fcMA));
					}
					/*/
					var filtersFC   										= new Array();
						filtersFC.push(new nlobjSearchFilter('custrecord_year', null, 'equalto', fcY));
					var resultsFechasCorte 									= returnBlank(nlapiSearchRecord('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFC, null));
					var fcD					 								= resultsFechasCorte[0].getValue(('custrecord_mes_' + fcM));
					var fcDA				 								= resultsFechasCorte[0].getValue(('custrecord_mes_' + fcMA));
					/*/
					var fcComplete											= fcD 	+ '/' + fcM 	+ '/' + fcY;
					var fcCompleteA											= fcDA 	+ '/' + fcMA	+ '/' + fcYA;
					var fcCompleteDate										= nlapiStringToDate(fcComplete);
					var fcCompleteDateA										= nlapiStringToDate(fcCompleteA);
					/*/
					var FechaPago											= nlapiAddDays(fcCompleteDate,4);
						FechaPago											= nlapiDateToString(FechaPago);
						FechaPago											= stringDateTimeSF(FechaPago,1);
					/*/
					var FechaPago											= nlapiAddDays(fcCompleteDate,4);
						FechaPago											= nlapiDateToString(new Date());
						FechaPago											= stringDateTimeSF(FechaPago,1);
        			var FechaInicialPago									= fcCompleteDateA;
        				FechaInicialPago									= nlapiAddDays(FechaInicialPago,1);
        			var FechaInicialPagoMS									= FechaInicialPago.getTime();
        				FechaInicialPago									= nlapiDateToString(FechaInicialPago);
        				FechaInicialPago									= stringDateTimeSF(FechaInicialPago,1);
        			var FechaFinalPago										= fcCompleteDate;
        			var FechaFinalPagoMS									= FechaFinalPago.getTime();
        				FechaFinalPago										= nlapiDateToString(FechaFinalPago);
        				FechaFinalPago										= stringDateTimeSF(FechaFinalPago,1);
        			var MilliSecondsPerDay									= 1000 * 60 * 60 * 24;
        			var NumDiasPagados										= Math.ceil((FechaFinalPagoMS - FechaInicialPagoMS) / MilliSecondsPerDay);
					var subtotal											= returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo +  '_subtotal'));
					var retencion											= returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo +  '_retencion'));
					var total												= returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo +  '_total'));
					var NumCtaPago											= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_numcta',join));
	                var NumCtaPagoLongitud									= NumCtaPago.length;
	                var indiceInicial										= NumCtaPagoLongitud - 4 ;
	                var indiceFinal											= NumCtaPagoLongitud;
	                var ultimosDigitos										= NumCtaPago.slice(indiceInicial,indiceFinal);
					var tipoDeComprobante 									= 'egreso';
					var billstate											= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('billstate'));
						billstate											= getEstadosInfo('NombreCorto',billstate);
						billstate											= Base64.decode(billstate);
						billstate											= JSON.parse(billstate);
						billstate											= billstate.estadoName;
					var companyInfo 										= nlapiLoadConfiguration('companyinformation');
					var companyInfoName 									= returnBlank(companyInfo.getFieldValue('legalname'));
					//var companyInfoAddress1									= returnBlank(companyInfo.getFieldValue('address1'));
					//var companyInfoAddress2									= returnBlank(companyInfo.getFieldValue('address2'));
					var companyInfoCity										= returnBlank(companyInfo.getFieldValue('city'));
					var companyInfoState									= returnBlank(companyInfo.getFieldValue('state'));
						companyInfoState									= getEstadosInfo('NombreCorto',companyInfoState);
						companyInfoState									= Base64.decode(companyInfoState);
						companyInfoState									= JSON.parse(companyInfoState);
						companyInfoState									= companyInfoState.estadoName;
					var companyInfoCountry									= returnBlank(companyInfo.getFieldText('country'));
					var companyInfoZip										= returnBlank(companyInfo.getFieldValue('zip'));
					var companyInfoRFC										= returnBlank(companyInfo.getFieldValue('employerid'));
					//var companyInfoRFC										= 'APR0412108C5';
					var companyInfoFax										= returnBlank(companyInfo.getFieldValue('fax'));
					var companyInfoPhone									= returnBlank(companyInfo.getFieldValue('phone'));
        			var version												= 3.2;
	        		var folio 												= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('name'));
	        		var LugarExpedicion 									= companyInfoZip; //companyInfoCity + ', ' + companyInfoState + ', ' + companyInfoCountry + ', ' + companyInfoZip +  ', ' + companyInfoFax + ' / ' + companyInfoPhone;
	        		var NumCtaPago											= ultimosDigitos;
	        		var metodoDePago 										= 'NA'; //'Transferencia electrónica de fondos';
	        		var TipoCambio 											= 1.0;
	        		var Moneda 												= 'MXN';
	        		var fecha 												= stringDateTimeSF(nlapiDateToString(new Date()));
	        		var formaDePago 										= 'En una sola exhibición';
	        		var sello 												= '';
	        		var noCertificado 										= '';
	        		var certificado 										= '';
	        		var subTotal 											= subtotal;
	        		var descuento											= 0;
	        		var Total 												= total;
	        		var cantidad 											= 1;
	        		var unidad 												= 'Servicio';
	        		//var noIdentificacion									= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('entitynumber',join));
	        		var descripcion 										= 'Compensación Mensual';
	        		var valorUnitario 										= subtotal;
	        		var importe 											= subtotal;
        			var Retencion_impuesto 									= 'ISR';
        			var Retencion_importe 									= retencion;
        			var Receptor_nombre										= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('altname',join));
        			var Receptor_rfc										= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_ce_rfc',join));
        			var Version												= 1.2;
        			var NumEmpleado											= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('entitynumber',join));
        			var CURP												= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_curp',join));
        			var TipoRegimen											= '02';
        			var FechaInicioRelLaboral								= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('hiredate',join));
        				FechaInicioRelLaboral								= stringDateTimeSF(FechaInicioRelLaboral,1);
        			var PeriodicidadPago									= returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_periodicidadpago',join)); //'Mensual';
        			var Percepciones_TotalGravado 							= subtotal;
        			var Percepciones_TotalExento 							= 0;
        			var Percepcion_TipoPercepcion 							= '001'; //Jalar de catálogo
        			var Percepcion_Clave 									= 'Compensacion';
        			var Percepcion_Concepto 								= 'Sueldos, Salarios  Rayas y Jornales'; //'Compensacion';
        			var Percepcion_ImporteGravado 							= subtotal;
        			var Percepcion_ImporteExento			 				= 0;
        			var Deducciones_TotalGravado 							= retencion;
        			var Deducciones_TotalExento 							= 0;
        			var Deduccion_TipoDeduccion 							= '002';
        			var Deduccion_Clave 									= 'ISR';
        			var Deduccion_Concepto 									= 'ISR';
        			var Deduccion_ImporteGravado 							= retencion;
        			var Deduccion_ImporteExento			 					= 0;
        			//Add for complement version 1.2
        			var TipoContrato                                        = returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_tipocontrato',join)); //'01';
        			var RegimenFiscal                                       = returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_regimenfiscal',join)); //'601';
        			var TipoNomina                                          = returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_tiponomina',join));
        			var ClaveEntFed                                         = 'JAL';
        			var xml													= new String();
        				xml												   += '<comprobante ';
		        			xml												   += 'version="' 			+ version 				+ '" ';
		        			xml												   += 'serie="' 			+ serie 				+ '" ';
		        			xml												   += 'folio="' 			+ folio					+ '" ';
		        			xml												   += 'tipoDeComprobante="' + tipoDeComprobante 	+ '" ';
		        			xml												   += 'LugarExpedicion="' 	+ LugarExpedicion 		+ '" ';
		        			xml												   += 'metodoDePago="' 		+ metodoDePago 			+ '" ';
		        		  //xml												   += 'NumCtaPago="' 		+ NumCtaPago 			+ '" ';
		        			xml												   += 'TipoCambio="' 		+ TipoCambio 			+ '" ';
		        			xml												   += 'Moneda="' 			+ Moneda 				+ '" ';
		        			xml												   += 'fecha="' 			+ fecha 				+ '" ';
		        			xml												   += 'formaDePago="' 		+ formaDePago 			+ '" ';
		        			xml												   += 'sello="' 			+ sello			 		+ '" ';
		        			xml												   += 'noCertificado="' 	+ noCertificado 		+ '" ';
		        			xml												   += 'certificado="' 		+ certificado 			+ '" ';
		        			xml												   += 'subTotal="' 			+ subTotal 				+ '" ';
		        			xml												   += 'descuento="' 		+ descuento 			+ '" ';
		        			xml												   += 'total="' 			+ Total 				+ '" ';
		        			xml												   += 'xmlns="' 			+ ''	 				+ '"';
	        			xml												   += '>';
		        			xml												   += '<Emisor ';
		        				xml												   += 'nombre="' 		+ companyInfoName 				+ '" ';
			        			xml												   += 'rfc="' 			+ companyInfoRFC 				+ '" ';
			        			xml												   += 'xmlns="'			+ 'http://www.sat.gob.mx/cfd/3' + '"';
		        			xml												   += '>';
		        				xml												   += '<RegimenFiscal ';
			        				xml												   += 'Regimen="' 		+ RegimenFiscal	+ '"';
		        				xml												   += '>';
		        				xml												   += '</RegimenFiscal>';
	        				xml												   += '</Emisor>';
		        			xml												   += '<Receptor ';
		        				xml												   += 'nombre="' 		+ Receptor_nombre 				+ '" ';
			        			xml												   += 'rfc="' 			+ Receptor_rfc	 				+ '" ';
			        			xml												   += 'xmlns="'			+ 'http://www.sat.gob.mx/cfd/3' + '"';
		        			xml												   += '>';
		        			xml												   += '</Receptor>';
	        				xml												   += '<Conceptos ';
	        					xml												   += 'xmlns="'			+ 'http://www.sat.gob.mx/cfd/3' + '"';
	        				xml												   += '>';
		        				xml												   += '<Concepto ';
			        				xml												   += 'cantidad="' 			+ cantidad 			+ '" ';
			        				xml												   += 'descripcion="' 		+ descripcion 		+ '" ';
			        				xml												   += 'importe="' 			+ importe		 	+ '"';
			        				xml												   += 'unidad="' 			+ unidad 			+ '" ';
			        				//xml												   += 'noIdentificacion="' 	+ noIdentificacion 	+ '" ';
			        				xml												   += 'valorUnitario="' 	+ valorUnitario 	+ '" ';
		        				xml												   += '>';
		        				xml												   += '</Concepto>';
	        				xml												   += '</Conceptos>';
	        				xml												   += '<Impuestos ';
	        					xml												   += 'xmlns="'			+ 'http://www.sat.gob.mx/cfd/3' + '"';
	        				xml												   += '>';
		        				xml												   += '<Retenciones> ';
		        					xml												   += '<Retencion ';
				        				xml												   += 'impuesto="' 	+ Retencion_impuesto 	+ '" ';
				        				xml												   += 'importe="' 	+ Retencion_importe 	+ '"';
			        				xml												   += '>';
			        				xml												   += '</Retencion> ';
		        				xml												   += '</Retenciones>';
	        				xml												   += '</Impuestos>';
	        				xml												   += '<Complemento ';
	        					xml												   += 'xmlns="'			+ 'http://www.sat.gob.mx/cfd/3' + '"';
	        				xml												   += '>';
		        				xml												   += '<nomina12:Nomina ';
		        					xml												   += 'xmlns:nomina12="'			+ 'http://www.sat.gob.mx/nomina12' 	+ '" ';
			        				xml												   += 'Version="' 				+ Version 							+ '" ';
			        				//xml												   += 'NumEmpleado="' 			+ NumEmpleado 						+ '" ';
			        				//xml												   += 'CURP="' 					+ CURP 								+ '" ';
			        				//xml												   += 'TipoRegimen="'			+ TipoRegimen						+ '" ';
			        				xml												   += 'FechaPago="' 			+ FechaPago 						+ '" ';
			        				xml												   += 'FechaInicialPago="' 		+ FechaInicialPago 					+ '" ';
			        				xml												   += 'FechaFinalPago="' 		+ FechaFinalPago 					+ '" ';
			        				xml												   += 'NumDiasPagados="' 		+ NumDiasPagados 					+ '" ';
			        				xml												   += 'TipoNomina="' 		    + TipoNomina    					+ '" '; 
			        				//xml												   += 'FechaInicioRelLaboral="' + FechaInicioRelLaboral	 			+ '" ';
			        				//xml												   += 'PeriodicidadPago="' 		+ PeriodicidadPago 					+ '"';
		        				xml												   += '>';
		        					xml												   += '<nomina12:Receptor ';                                                            // Add Receptor
		        						xml												   += 'ClaveEntFed="' 			+ ClaveEntFed 						+ '" ';
		        						xml												   += 'Curp="' 					+ CURP 								+ '" ';
		        						xml												   += 'FechaInicioRelLaboral="' + FechaInicioRelLaboral	 			+ '" ';
		        						xml												   += 'NumEmpleado="' 			+ NumEmpleado 						+ '" ';
		        						xml												   += 'PeriodicidadPago="' 		+ PeriodicidadPago 					+ '" ';
		        						xml												   += 'TipoContrato="' 			+ TipoContrato 						+ '" ';
		        						xml												   += 'TipoRegimen="'			+ TipoRegimen						+ '" ';
		        					xml												   += '>';                                                                              // End Receptor
			        				xml												   += '<nomina12:Percepciones ';
				        				xml												   += 'TotalGravado="' 			+ Percepciones_TotalGravado 		+ '" ';
				        				xml												   += 'TotalExento="' 			+ Percepciones_TotalExento 			+ '"';
			        				xml												   += '>';
				        				xml												   += '<nomina12:Percepcion ';
					        				xml												   += 'TipoPercepcion="' 	+ Percepcion_TipoPercepcion	+ '" ';
					        				xml												   += 'Clave="' 			+ Percepcion_Clave 			+ '" ';
					        				xml												   += 'Concepto="' 			+ Percepcion_Concepto 		+ '" ';
					        				xml												   += 'ImporteGravado="' 	+ Percepcion_ImporteGravado	+ '" ';
					        				xml												   += 'ImporteExento="' 	+ Percepcion_ImporteExento 	+ '"';
				        				xml												   += '>';
				        				xml												   += '</nomina12:Percepcion>';
			        				xml												   += '</nomina12:Percepciones>';
			        				xml												   += '<nomina12:Deducciones ';
				        				xml												   += 'TotalImpuestosRetenidos="' 	+ Deducciones_TotalGravado 		+ '" ';
				        				xml												   += 'TotalOtrasDeducciones="' 	+ Deducciones_TotalExento 		+ '"';
			        				xml												   += '>';
				        				xml												   += '<nomina12:Deduccion ';
					        				xml												   += 'Clave="' 			+ Deduccion_Clave 			+ '" ';
					        				xml												   += 'Concepto="' 			+ Deduccion_Concepto 		+ '" ';
					        				xml												   += 'Importe="'       	+ Deduccion_ImporteGravado	+ '" ';
					        				xml												   += 'TipoDeduccion="' 	+ Deduccion_TipoDeduccion	+ '" ';
					        				//xml												   += 'ImporteExento="' 	+ Deduccion_ImporteExento 	+ '"';
				        				xml												   += '>';
				        				xml												   += '</nomina12:Deduccion>';
			        				xml												   += '</nomina12:Deducciones>';
		        				xml												   += '</nomina12:Nomina>';
	        				xml												   += '</Complemento>';
        				xml												   += '</comprobante>';
	        		var fields											= new Array();
	        			fields.push('custrecord_' + prefijo + '_xml_comprobante');
	        		var values 											= new Array();
	        			values.push(xml);
	        		nlapiSubmitField(recordType, recordId, fields, values);
	        		nlapiLogExecution('ERROR', 'xml', 'xml');
				}
				else
				{
					nlapiLogExecution('ERROR', _tn_sf_codigo_respuesta, _tn_sf_mensaje_respuesta);
				}
			}
			else
			{
        		var fields						= new Array();
	    			fields.push('custrecord_' + prefijo + '_xml_comprobante');
	    		var values 						= new Array();
	    			values.push('');
	    		nlapiSubmitField(recordType, recordId, fields, values);
				nlapiLogExecution('ERROR', 'customsearch_tn_sf_xml_comprobante', customsearch_tn_sf_xml_comprobante);
			}
		}
	}
	catch(e)
	{
		var companyConfig		= nlapiLoadConfiguration('companyinformation');
		var companyname			= returnBlank(companyConfig.getFieldValue('companyname'));
		var context				= nlapiGetContext();		
	  	var company				= returnBlank(context.getCompany());
	  	var deploymentId		= returnBlank(context.getDeploymentId());
	  	var environment			= returnBlank(context.getEnvironment());
	  	var executionContext	= returnBlank(context.getExecutionContext());
	  	var logLevel			= returnBlank(context.getLogLevel());
	  	var name				= returnBlank(context.getName());
	  	var role				= returnBlank(context.getRole());
	  	var roleCenter			= returnBlank(context.getRoleCenter());
	  	var roleId				= returnBlank(context.getRoleId());
	  	var scriptId			= returnBlank(context.getScriptId());
	  	var user				= returnBlank(context.getUser());
	  	var author				= -5;
	  	var recipient			= 'carlos.alvarez@imr.com.mx';
	  	var subject				= '';
	  	var body 				= '';
  			body 			   += '<table>';
  				body 			   += '<tr><td><b>' + 'Company ID' 			+ '</b></td><td>&nbsp;</td><td>' + company 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Company' 			+ '</b></td><td>&nbsp;</td><td>' + companyname		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record Type' 		+ '</b></td><td>&nbsp;</td><td>' + recordType 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record ID' 			+ '</b></td><td>&nbsp;</td><td>' + recordId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Script ID' 			+ '</b></td><td>&nbsp;</td><td>' + scriptId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Deployment ID' 		+ '</b></td><td>&nbsp;</td><td>' + deploymentId 	+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Log Level' 			+ '</b></td><td>&nbsp;</td><td>' + logLevel 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Environment' 		+ '</b></td><td>&nbsp;</td><td>' + environment 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Execution Context' 	+ '</b></td><td>&nbsp;</td><td>' + executionContext + '</td></tr>';
  				body 			   += '<tr><td><b>' + 'User' 				+ '</b></td><td>&nbsp;</td><td>' + user 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Name' 				+ '</b></td><td>&nbsp;</td><td>' + name 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role' 				+ '</b></td><td>&nbsp;</td><td>' + role 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role Center' 		+ '</b></td><td>&nbsp;</td><td>' + roleCenter		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role ID' 			+ '</b></td><td>&nbsp;</td><td>' + roleId 			+ '</td></tr>';
  			body 			   += '</table>';
	  		body 			   += '<br>';
	  		body 			   += '<br>';
	  	if( e instanceof nlobjError )
	  	{
	  		var ecode 		 = returnBlank(e.getCode());
			var edetails 	 = returnBlank(e.getDetails());
			var eid 		 = returnBlank(e.getId());
			var einternalid	 = returnBlank(e.getInternalId());
			var estacktrace	 = returnBlank(e.getStackTrace());
			if(estacktrace != '')
			{
				estacktrace	 = estacktrace.join();
			}
			var euserevent 	 = returnBlank(e.getUserEvent());
			nlapiLogExecution( 'ERROR', 'ecode',ecode);
			nlapiLogExecution( 'ERROR', 'edetails',edetails);
			nlapiLogExecution( 'ERROR', 'eid',eid);
			nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
			nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
			nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
		}
	    else
	    {
	    	var errorString	 = e.toString();
	    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);   
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
        }
		var fields	= new Array();
			fields.push('custrecord_' + prefijo + '_xml_comprobante');
			fields.push('custrecord_' + prefijo + '_xml_datos_extra');
		var values 	= new Array();
			values.push('');
			values.push('');
		nlapiSubmitField(recordType, recordId, fields, values);
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}