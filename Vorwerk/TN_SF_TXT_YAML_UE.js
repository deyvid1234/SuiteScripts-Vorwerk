/** 
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 May 2017     jonathanvargas
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord compensaciones
 * 
 * @param {String}
 *            type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm}
 *            form Current form
 * @param {nlobjRequest}
 *            request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord compensaciones
 * 
 * @param {String}
 *            type Operation types: create, edit, delete, xedit approve, reject,
 *            cancel (SO, ER, Time Bill, PO & RMA only) pack, ship (IF)
 *            markcomplete (Call, Task) reassign (Case) editforecast (Opp,
 *            Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord compensaciones
 * 
 * @param {String}
 *            type Operation types: create, edit, delete, xedit, approve,
 *            cancel, reject (SO, ER, Time Bill, PO & RMA only) pack, ship (IF
 *            only) dropship, specialorder, orderitems (PO only) paybills
 *            (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type) {
	
	var recordType = nlapiGetRecordType ();
	var recordId = nlapiGetRecordId ();
	var Base64 = new MainBase64 ();
	var prefijo = '';
	var search = '';
	var serie = '';
	var join = '';
	if(type != 'delete') {
		switch(recordType) {
			case 'customrecord_comisiones_gtm': {
				join = 'custrecord_gtm_empleado';
				serie = 'GTM';
				prefijo = 'gtm';
				search = 'customsearch_gtm_tn_sf_xml_comprobante';
			}
				break;
			case 'customrecord_comisiones_pre': {
				join = 'custrecord_pre_empleado';
				serie = 'PRE';
				prefijo = 'pre';
				search = 'customsearch_pre_tn_sf_xml_comprobante';
			}
				break;
			case 'customrecord_comisiones_jdg': {
				join = 'custrecord_jdg_empleado';
				serie = 'JDG';
				prefijo = 'jdg';
				search = 'customsearch_jdg_tn_sf_xml_comprobante';
			}
				break;
		}
		var filters = new Array ();
		filters.push (new nlobjSearchFilter ('internalid', null, 'is', recordId));
		var customsearch_tn_sf_xml_comprobante = returnBlank (nlapiSearchRecord (recordType, search, filters, new nlobjSearchColumn ('email', join)));
		if(customsearch_tn_sf_xml_comprobante != '') {
			var _tn_sf_codigo_respuesta = returnNumber (customsearch_tn_sf_xml_comprobante[0].getValue ('custrecord_' + prefijo + '_codigo_respuesta'));
			var _tn_sf_mensaje_respuesta = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('custrecord_' + prefijo + '_mensaje_respuesta'));
			if(_tn_sf_codigo_respuesta != 200) {
				var fc = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('custrecord_' + prefijo + '_fecha_comision'));
				fc = stringToArray (fc, 47);
				var fcY = returnNumber (fc[1]);
				var fcYA = new Number ();
				var fcM = returnNumber (fc[0]);
				var fcMA = new Number ();
				var fcD = new Number ();
				var fcDA = new Number ();
				var filtersFC = new Array ();
				filtersFC.push (new nlobjSearchFilter ('custrecord_year', null, 'equalto', fcY));
				var resultsFechasCorte = returnBlank (nlapiSearchRecord ('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFC, null));
				fcD = resultsFechasCorte[0].getValue (('custrecord_mes_' + fcM));
				if(fcMA == 0) {
					fcYA = fcY - 1;
					fcMA = 12;
					filtersFC = new Array ();
					filtersFC.push (new nlobjSearchFilter ('custrecord_year', null, 'equalto', fcYA));
					resultsFechasCorte = returnBlank (nlapiSearchRecord ('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFC, null));
					fcDA = resultsFechasCorte[0].getValue (('custrecord_mes_' + fcMA));
				}
				else {
					fcYA = fcY;
					fcMA = fcM - 1;
					fcDA = resultsFechasCorte[0].getValue (('custrecord_mes_' + fcMA));
				}
				var fcComplete = fcD + '/' + fcM + '/' + fcY;
				var fcCompleteA = fcDA + '/' + fcMA + '/' + fcYA;
				var fcCompleteDate = nlapiStringToDate (fcComplete);
				var fcCompleteDateA = nlapiStringToDate (fcCompleteA);
				var FechaPago = nlapiAddDays (fcCompleteDate, 4);
					FechaPago = nlapiDateToString (new Date ());
					FechaPago = stringDateTimeSF (FechaPago, 1);
				var FechaInicialPago = fcCompleteDateA;
				FechaInicialPago = nlapiAddDays (FechaInicialPago, 1);
				var FechaInicialPagoMS = FechaInicialPago.getTime ();
				FechaInicialPago = nlapiDateToString (FechaInicialPago);
				FechaInicialPago = stringDateTimeSF (FechaInicialPago, 1);
				var FechaFinalPago = fcCompleteDate;
				var FechaFinalPagoMS = FechaFinalPago.getTime ();
				FechaFinalPago = nlapiDateToString (FechaFinalPago);
				FechaFinalPago = stringDateTimeSF (FechaFinalPago, 1);
				var MilliSecondsPerDay = 1000 * 60 * 60 * 24;
				var NumDiasPagados = Math.ceil ((FechaFinalPagoMS - FechaInicialPagoMS) / MilliSecondsPerDay);
				var subtotal = returnNumber (customsearch_tn_sf_xml_comprobante[0].getValue ('custrecord_' + prefijo + '_subtotal'));
				var retencion = returnNumber (customsearch_tn_sf_xml_comprobante[0].getValue ('custrecord_' + prefijo + '_retencion'));
				var total = returnNumber (customsearch_tn_sf_xml_comprobante[0].getValue ('custrecord_' + prefijo + '_total'));
				var NumCtaPago = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('custentity_numcta', join));
				var NumCtaPagoLongitud = NumCtaPago.length;
				var indiceInicial = NumCtaPagoLongitud - 4;
				var indiceFinal = NumCtaPagoLongitud;
				var ultimosDigitos = NumCtaPago.slice (indiceInicial, indiceFinal);
				var tipoDeComprobante = 'egreso';
				var billstate = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('billstate'));
				billstate = getEstadosInfo ('NombreCorto', billstate);
				billstate = Base64.decode (billstate);
				billstate = JSON.parse (billstate);
				billstate = billstate.estadoName;
				var companyInfo = nlapiLoadConfiguration ('companyinformation');
				var companyInfoName = returnBlank (companyInfo.getFieldValue ('legalname'));
				// var companyInfoAddress1 =
				// returnBlank(companyInfo.getFieldValue('address1'));
				// var companyInfoAddress2 =
				// returnBlank(companyInfo.getFieldValue('address2'));
				var companyInfoCity = returnBlank (companyInfo.getFieldValue ('city'));
				var companyInfoState = returnBlank (companyInfo.getFieldValue ('state'));
				companyInfoState = getEstadosInfo ('NombreCorto', companyInfoState);
				companyInfoState = Base64.decode (companyInfoState);
				companyInfoState = JSON.parse (companyInfoState);
				companyInfoState = companyInfoState.estadoName;
				var companyInfoCountry = returnBlank (companyInfo.getFieldText ('country'));
				var companyInfoZip = returnBlank (companyInfo.getFieldValue ('zip'));
				var companyInfoRFC = returnBlank (companyInfo.getFieldValue ('employerid'));
				// var companyInfoRFC = 'APR0412108C5';
				var companyInfoFax = returnBlank (companyInfo.getFieldValue ('fax'));
				var companyInfoPhone = returnBlank (companyInfo.getFieldValue ('phone'));
				var version = 3.2;
				var folio = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('name'));
				var LugarExpedicion = companyInfoZip; // companyInfoCity
				var NumCtaPago = ultimosDigitos;
				var metodoDePago = 'NA'; // 'Transferencia
				var TipoCambio = 1.0;
				var Moneda = 'MXN';
				var fecha = stringDateTimeSF (nlapiDateToString (new Date ()));
				var formaDePago = 'En una sola exhibición';
				var sello = '';
				var noCertificado = '20001000000200001436'; // Tmp
				var certificado = '';
				var subTotal = subtotal;
				var Total = total;
				var cantidad = 1;
				var unidad = 'ACT';
				var descripcion = 'Pago de nómina';
				var valorUnitario = subtotal;
				var importe = subtotal;
				var Retencion_impuesto = 'ISR';
				var Retencion_importe = retencion;
				var Receptor_nombre = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('altname', join));
				var Receptor_rfc = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('custentity_ce_rfc', join));
				var Receptor_email = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('email', join));
				var Version = 1.2;
				var NumEmpleado = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('entitynumber', join));
				var CURP = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('custentity_curp', join));
				var TipoRegimen = '99'; // '02';
				var FechaInicioRelLaboral = returnBlank (customsearch_tn_sf_xml_comprobante[0].getValue ('hiredate', join));
					FechaInicioRelLaboral = stringDateTimeSF (FechaInicioRelLaboral, 1);
				var PeriodicidadPago = returnBlank (customsearch_tn_sf_xml_comprobante[0].getText ('custentity_c_nom_periodicidadpago', join)); // 'Mensual';
				var Percepciones_TotalGravado = subtotal;
				var Percepciones_TotalExento = 0;
				var Percepcion_TipoPercepcion = '001'; // Jalar
				var Percepcion_Clave = 'Compensacion';
				var Percepcion_Concepto = 'Sueldos, Salarios  Rayas y Jornales'; // 'Compensacion';
				var Percepcion_ImporteGravado = subtotal;
				var Percepcion_ImporteExento = 0;
				var Deducciones_TotalGravado = retencion;
				var Deducciones_TotalExento = 0;
				var Deduccion_TipoDeduccion = '002';
				var Deduccion_Clave = 'ISR';
				var Deduccion_Concepto = 'ISR';
				var Deduccion_ImporteGravado = retencion;
				var Deduccion_ImporteExento = 0;
				// Add for complement version 1.2
				var TipoContrato = '99'; // returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_tipocontrato',join));
				// //'01';
				var RegimenFiscal = customsearch_tn_sf_xml_comprobante[0].getText ('custentity_c_nom_regimenfiscal', join)||601; // '601';
				var TipoNomina =  customsearch_tn_sf_xml_comprobante[0].getText ('custentity_c_nom_tiponomina', join)||'egreso';
				var ClaveEntFed = 'JAL';
				var TotalPercepciones = Percepciones_TotalGravado;
				var TotalOtrosPagos = 0;
				var TotalDeducciones = Deducciones_TotalExento + Deducciones_TotalGravado;
				var descuento = TotalDeducciones;
				var TotalSeparacionIndemnizacion = 0;
				var TotalJubilacionPensionRetiro = 0;
				var TotalSueldos = TotalPercepciones + TotalSeparacionIndemnizacion + TotalJubilacionPensionRetiro;
				var nombreCfdi = prefijo+nlapiGetRecordId ();
				var registroPatronal ='';
				var NumSeguridadSocial ='';
				var Departamento ='';
				var Puesto = '';
				var CuentaBancaria ='';
				var RiesgoPuesto ='';
				var Banco ='';
				var antiguedad = 0;
				var tipoJornada = '';
				
		var comprobante = ""+
			"TipoDeComprobante  : \""+TipoNomina+"\" \n"+
			"LugarExpedicion    : \""+LugarExpedicion+"\" \n"+
			"nombreCfdi         : \""+nombreCfdi+"\" \n"+                                                   
			"Emisor:\n"+
			"  Regimen      : \""+RegimenFiscal+"\" \n"+ 
			"  Rfc          : \""+companyInfoRFC+"\" \n"+ 
			"  Nombre       : \""+companyInfoName+"\" \n"+                                     
			"Receptor:\n"+ 
			"  Rfc          : \""+Receptor_rfc+"\" \n"+ 
			"  Nombre       : \""+Receptor_nombre+"\" \n"+     
			"  Email        : \""+Receptor_email+"\" \n"+            
			"Conceptos:\n"+
			"  - Unidad            : \""+unidad+"\" \n"+ 
			"    Descripcion       : \""+descripcion+"\" \n"+ 
			"    Cantidad          : \""+cantidad+"\" \n"+ 
			"    ValorUnitario     : \""+valorUnitario+"\" \n"+    
			"    Importe           : \""+importe+"\" \n"+ 
			"SubTotal          : \""+subtotal+"\" \n"+ 
			"FormaDePago       : \""+formaDePago+"\" \n"+ 
			"MetodoDePago      : \""+metodoDePago+"\" \n"+ 
			"Moneda            : \""+Moneda+"\" \n"+ 
			"Total           : \""+total+"\" \n"+   
			"Descuento       : \""+descuento+"\" \n" +
			"Nomina:\n" +
			"  -\n" +
			"    TipoNomina             : \"O\" \n" + // O =  ordinaria || E = extraordinaria 
			"    FechaPago              : \""+FechaPago+"\" \n" +
			"    FechaInicialPago       : \""+FechaInicialPago+"\" \n" +
			"    FechaFinalPago         : \""+FechaFinalPago+"\" \n" +
			"    NumDiasPagados         : \""+NumDiasPagados+"\" \n" +
			"    TotalPercepciones      : \""+TotalPercepciones+"\" \n" +
			"    TotalDeducciones       : \""+TotalDeducciones+"\" \n" +
			"    NEmisor: \n" +
			"      RegistroPatronal       : \""+registroPatronal+"\" \n" +
			"      RfcPatronOrigen        : \""+companyInfoRFC+"\" \n" +
			"    NReceptor:\n" +
			"      NumEmpleado            : \""+NumEmpleado+"\" \n" +
			"      Curp                   : \""+CURP+"\" \n" +
			"      TipoContrato           : \""+TipoContrato+"\" \n" +
			"      TipoRegimen            : \""+TipoRegimen+"\" \n" +
			"      NumSeguridadSocial     : \""+NumSeguridadSocial+"\" \n" +
			"      Departamento           : \""+Departamento+"\" \n" +
			"      Puesto                 : \""+Puesto+"\" \n" +
			"      RiesgoPuesto           : \""+RiesgoPuesto+"\" \n" +
			"      CuentaBancaria         : \""+CuentaBancaria+"\" \n" +
			"      Banco                  : \""+Banco+"\" \n" +
			"      FechaInicioRelLaboral  : \""+FechaInicioRelLaboral+"\" \n" +
			"      Antigüedad             : \""+antiguedad+"\" \n" +
			"      TipoJornada            : \""+tipoJornada+"\" \n" +
			"      PeriodicidadPago       : \""+PeriodicidadPago+"\" \n" +
			"      SalarioBaseCotApor     : \""+0+"\" \n" +
			"      SalarioDiarioIntegrado : \""+0+"\" \n" +
			"      ClaveEntFed            : \""+ClaveEntFed+"\" \n" +
			"    Percepciones:\n" +
			"      TotalSueldos                 : \""+TotalSueldos+"\" \n" +
			"      TotalSeparacionIndemnizacion : \""+TotalSeparacionIndemnizacion+"\" \n" +
			"      TotalGravado                 : \""+Percepciones_TotalGravado+"\" \n" +
			"      TotalExento                  : \""+Percepciones_TotalExento+"\" \n" +
			"      Percepcion :\n" +
			"        - TipoPercepcion : \""+Percepcion_TipoPercepcion+"\" \n" +
			"          Clave          : \""+Percepcion_Clave+"\" \n" +
			"          Concepto       : \""+Percepcion_Concepto+"\" \n" +
			"          ImporteGravado : \""+Percepcion_ImporteGravado+"\" \n" +
			"          ImporteExento  : \""+Percepcion_ImporteExento+"\" \n" +
			"    Deducciones :\n" +
			"      TotalOtrasDeducciones     : \""+Deducciones_TotalGravado+"\" \n" +
			"      TotalImpuestosRetenidos   :  \""+Deducciones_TotalExento+"\" \n" +
			"      Deduccion :\n" +
			"        - TipoDeduccion  : \""+Deduccion_TipoDeduccion+"\" \n" +
			"          Clave          : \""+Deduccion_Clave+"\" \n" +
			"          Concepto       : \""+Deduccion_Concepto+"\" \n" +
			"          Importe        : \""+Deduccion_ImporteExento+"\" \n" +
			"...";
				var file = nlapiCreateFile ('CFCU' +new Date ().getTime () + ".txt", 'PLAINTEXT', comprobante);
				file.setFolder (62697) // nomina TXT
				var idFile = nlapiSubmitFile (file);
				var oldFile = nlapiGetFieldValue ('custrecord_txt_yaml'+prefijo) || '';
				if(oldFile != '') {
					nlapiDeleteFile (oldFile);
				}
				nlapiSubmitField (nlapiGetRecordType (), nlapiGetRecordId (), 'custrecord_txt_yaml'+prefijo, idFile);
			}
		}
	}
}
