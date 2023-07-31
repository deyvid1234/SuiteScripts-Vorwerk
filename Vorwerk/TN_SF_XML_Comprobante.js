/**
 *
 * @param type
 */

function TN_SF_XML_Comprobante(type) {
  var recordType = nlapiGetRecordType();
  var recordId = nlapiGetRecordId();
  var Base64 = new MainBase64();
  var prefijo = '';
  var search = '';
  var serie = '';
  var join = '';
  try {
    if (type != 'delete') {
      nlapiLogExecution('DEBUG', 'Script Called ', 'recordType: ' + recordType + ' - recordId: ' + recordId);
      switch (recordType) {
        case 'customrecord_comisiones_gtm':
          {
            join = 'custrecord_gtm_empleado';
            serie = 'GTM';
            prefijo = 'gtm';
            search = 'customsearch_gtm_tn_sf_xml_comprobante';
          };
          break;
        case 'customrecord_comisiones_pre':
          {
            join = 'custrecord_pre_empleado';
            serie = 'PRE';
            prefijo = 'pre';
            search = 'customsearch_pre_tn_sf_xml_comprobante';
          };
          break;
        case 'customrecord_comisiones_jdg':
          {
            join = 'custrecord_jdg_empleado';
            serie = 'JDG';
            prefijo = 'jdg';
            search = 'customsearch_jdg_tn_sf_xml_comprobante';
          };
          break;
      }
      var filters = new Array();
      filters.push(new nlobjSearchFilter('internalid', null, 'is', recordId));
      var columna = new nlobjSearchColumn('formulatext');
      var campoFormula = join + ".hiredate";
      columna.setFormula("TRUNC((sysdate-TO_DATE({" + campoFormula + "})) /365,0) || 'Y' ||" +
        "	MOD( " +
        "		TRUNC( " +
        "			months_between(sysdate,TO_DATE({" + campoFormula + "}))" +
        "			,0)" +
        "		,12)||" +
        "	'M'||" +
        "	CASE " +
        "		WHEN extract(day from sysdate)>extract(day from TO_DATE({" + campoFormula + "})) " +
        "			THEN extract(day from sysdate)-extract(day from TO_DATE({" + campoFormula + "})) " +
        "		ELSE extract(day from TO_DATE({" + campoFormula + "}))-extract(day from sysdate) " +
        "	END ||" +
        "	'D'");

      var customsearch_tn_sf_xml_comprobante = returnBlank(nlapiSearchRecord(recordType, search, filters, columna));
      nlapiLogExecution('DEBUG', 'SearchResult', JSON.stringify(customsearch_tn_sf_xml_comprobante[0]));
      if (customsearch_tn_sf_xml_comprobante != '') {
        var _tn_sf_codigo_respuesta = returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo + '_codigo_respuesta'));
        var _tn_sf_mensaje_respuesta = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo + '_mensaje_respuesta'));
        if (_tn_sf_codigo_respuesta != 200) {
          var employeeID = parseInt(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo + '_empleado')) || null;
          var employee = nlapiLoadRecord('employee', employeeID,{ "recordmode":"dynamic"});
          var tipoNominaID = employee.getFieldValue('custentity_c_nom_tiponomina'); //parseInt( customsearch_tn_sf_xml_comprobante[0].getValue('custentity_c_nom_tiponomina', join) ) || null;
          var regimenID = employee.getFieldValue('custentity_c_nom_regimenfiscal'); //parseInt( customsearch_tn_sf_xml_comprobante[0].getValue('custentity_c_nom_regimenfiscal', join) ) || null;
          var tipoRegimenID = employee.getFieldValue('custentity_c_nom_tiporegimen'); //parseInt( customsearch_tn_sf_xml_comprobante[0].getValue('custentity_c_nom_tiporegimen', join) ) || null;
          var tipoContratoID = employee.getFieldValue('custentity_c_nom_tipocontrato'); //parseInt( customsearch_tn_sf_xml_comprobante[0].getValue('custentity_c_nom_tipocontrato', join) ) || null;
          var periodicidadID = employee.getFieldValue('custentity_c_nom_periodicidadpago'); //parseInt( customsearch_tn_sf_xml_comprobante[0].getValue('custentity_c_nom_periodicidadpago', join) ) || null;
          var emailsSendTo = employee.getFieldValue('email') || '';
          nlapiLogExecution('DEBUG', 'IDs: ' + employeeID, tipoNominaID + '/' + regimenID + '/' + tipoRegimenID + '/' + tipoContratoID + '/' + periodicidadID)
          var testRegimen = nlapiLookupField('customrecord_c_regimen_fiscal', regimenID, 'custrecord_c_rf_descripcion');
          var testPeriodicidad = nlapiLookupField('customrecordc_pp_periodicidadpago', periodicidadID, 'custrecord_c_pp_descripcion');
          nlapiLogExecution('DEBUG', 'Fields', testRegimen + '/' + testPeriodicidad);
          var fc = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo + '_fecha_comision'));
          fc = stringToArray(fc, 47);
          var fcY = returnNumber(fc[1]);
          nlapiLogExecution('DEBUG', 'VALOR DE fcY', typeof fcY);
          var fcM = returnNumber(fc[0]);
          fcY = fcY.toFixed(0);
          var fcComplete = '10' + '/' + fcM + '/' + fcY;
          nlapiLogExecution('DEBUG', 'VALOR DE FCCOMPLETe', fcComplete);
          var fcCompleteDate = nlapiStringToDate(fcComplete);
          nlapiLogExecution('DEBUG', 'VALOR DE FCCOMPLETEDATE', fcCompleteDate);

          //Parte integrada con nuevo calendario Inicios y cortes de mes----------------------------------------
          //La selección de las fechas de inicio y final de pago dependerán de la fecha comision.

          var fechaComision = fcCompleteDate; //Valor de la fecha fechaComision
          var meses = [ "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre" ];
          var filtro = [], col = [], busqueda = null;
          var year = fechaComision.getFullYear().toFixed(0);
          var numMes = fechaComision.getMonth().toFixed(0);
          var fechaInicialPago, fechaFinalPago, fechaPago;

          filtro.push( new nlobjSearchFilter( 'custrecord_nso_year', null, 'is', year ) ); //Año actual
          col.push( new nlobjSearchColumn( 'custrecord_nso_' + meses[numMes] + '_inicial', null ) ); //Dia inicial Mes actual
          col.push( new nlobjSearchColumn( 'custrecord_nso_' + meses[numMes] + '_final', null ) ); //Dia final Mes actual
          col.push( new nlobjSearchColumn( 'custrecord_nso_' + meses[numMes] + '_pago', null ) ); //Dia del pago (custrecord_nso_enero_pago) ejemplo
          busqueda = nlapiSearchRecord( 'customrecord_nso_calendar_vorwerk', null, filtro, col );
          if ( !busqueda ) {// Si no se encuentra la fecha de comision dentro del calendario, la mayor parte recae en el año ya que es un dato esencial en la busqueda
            nlapiLogExecution('ERROR','Mensaje','La fecha de comision no se encuentra en el calendario NSO Vorwerk y se cancela la generación del XML, verificar dicho calendario.');
            return;
          }
          fechaInicialPago = busqueda[0].getValue(col[0]); //Fecha Inicial
          fechaFinalPago   = busqueda[0].getValue(col[1]); //Fecha Final
          fechaPago        = busqueda[0].getValue(col[2]); //Fecha De Pago
          fechaPago        = stringDateTimeSF(fechaPago, 1);

          fechaInicialPago = nlapiStringToDate(fechaInicialPago);
          var FechaInicialPagoMS = fechaInicialPago.getTime();
          fechaInicialPago = nlapiDateToString(fechaInicialPago);
          fechaInicialPago = stringDateTimeSF(fechaInicialPago, 1);

          fechaFinalPago = nlapiStringToDate(fechaFinalPago);
          var FechaFinalPagoMS = fechaFinalPago.getTime();
          fechaFinalPago = nlapiDateToString(fechaFinalPago);
          fechaFinalPago = stringDateTimeSF(fechaFinalPago, 1);

          //--------------------------------Nueva parte integrada (ENTIDAD FEDERATIVA)------------------------------------------------
          var ClaveEntFed = '', objSubrecord = null, filtros = [], columns = [], estado = '';
          for ( var i = 1; i <= employee.getLineItemCount('addressbook'); i++ ) {//Buscamos la dirección que este por default de envío
            employee.selectLineItem( 'addressbook', i);
            if ( employee.getLineItemValue( 'addressbook', 'defaultshipping', i ) == 'T' ) {
              objSubrecord = employee.viewLineItemSubrecord( 'addressbook', 'addressbookaddress', i );
              nlapiLogExecution('DEBUG', 'NSO_TIMBRADO_NOMINA_ADDRESS', JSON.stringify( objSubrecord) );
              estado = objSubrecord.getFieldValue( 'dropdownstate' ) || objSubrecord.getFieldValue( 'state' );
              nlapiLogExecution( 'DEBUG', 'NSO_TIMBRADO_NOMINA_DROPDOWNSTATE', objSubrecord.getFieldValue( 'dropdownstate' ) );
              nlapiLogExecution( 'DEBUG', 'NSO_TIMBRADO_NOMINA_STATE', objSubrecord.getFieldValue( 'state' ) );
              break;
            }
          }
          nlapiLogExecution( 'DEBUG', 'NSO_TIMBRADO_NOMINA_STATE_FILTER', estado );
          if ( estado != '' ) {
            filters[0] = new nlobjSearchFilter( 'name', null, 'contains', estado );
            columns[0] = new nlobjSearchColumn( 'name', null );
            var busquedaStateSAT = nlapiSearchRecord( 'customlist_nso_nomencla_estado_sat', 'null', filters, columns );
            if ( busquedaStateSAT ) {
              ClaveEntFed = busquedaStateSAT[0].getValue( 'name' ).split( "-" )[0];
              nlapiLogExecution( 'DEBUG', 'NSO_TIMBRADO_NOMINA_ClaveEntFed', ClaveEntFed );
            } else {
              ClaveEntFed = '';
              nlapiLogExecution( 'ERROR', 'NSO_TIMBRADO_NOMINA_BUSQUEDA_SAT_NULL', 'No se encontró la entidad federativa en la lista de Nomenclatura SAT, verifique el valor del estado del empleado.' );
            }
          }
          //--------------------------------------------------------------------------------------------------------------------
          var FechaFinalPagoAntiguadad = fcCompleteDate;
          var MilliSecondsPerDay = 1000 * 60 * 60 * 24;
          var NumDiasPagados = Math.ceil((FechaFinalPagoMS - FechaInicialPagoMS) / MilliSecondsPerDay);
          var subtotalPre = returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo + '_subtotal'));
          var subtotal = subtotalPre.toFixed(2);
          var retencion = returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo + '_retencion'));
          var totalPre = returnNumber(customsearch_tn_sf_xml_comprobante[0].getValue('custrecord_' + prefijo + '_total'));
          var total = totalPre.toFixed(2);
          var NumCtaPago = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_numcta', join));
          var NumCtaPagoLongitud = NumCtaPago.length;
          var indiceInicial = NumCtaPagoLongitud - 4;
          var indiceFinal = NumCtaPagoLongitud;
          var ultimosDigitos = NumCtaPago.slice(indiceInicial, indiceFinal);
          var tipoDeComprobante = 'egreso';
          var billstate = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('billstate'));
          billstate = getEstadosInfo('NombreCorto', billstate);
          billstate = Base64.decode(billstate);
          billstate = JSON.parse(billstate);
          billstate = billstate.estadoName;
          var companyInfo = nlapiLoadConfiguration('companyinformation');
          var companyInfoName = returnBlank(companyInfo.getFieldValue('legalname'));
          //var companyInfoAddress1									= returnBlank(companyInfo.getFieldValue('address1'));
          //var companyInfoAddress2									= returnBlank(companyInfo.getFieldValue('address2'));
          var companyInfoCity = returnBlank(companyInfo.getFieldValue('city'));
          var companyInfoState = returnBlank(companyInfo.getFieldValue('state'));
          companyInfoState = getEstadosInfo('NombreCorto', companyInfoState);
          companyInfoState = Base64.decode(companyInfoState);
          companyInfoState = JSON.parse(companyInfoState);
          companyInfoState = companyInfoState.estadoName;
          var companyInfoCountry = returnBlank(companyInfo.getFieldText('country'));
          var companyInfoZip = returnBlank(companyInfo.getFieldValue('zip'));
          var companyInfoRFC = returnBlank(companyInfo.getFieldValue('employerid'));
          //var companyInfoRFC										= 'APR0412108C5';
          var companyInfoFax = returnBlank(companyInfo.getFieldValue('fax'));
          var companyInfoPhone = returnBlank(companyInfo.getFieldValue('phone'));
          var version = 3.2;
          var folio = returnBlank(recordId);
          var LugarExpedicion = companyInfoZip; //companyInfoCity + ', ' + companyInfoState + ', ' + companyInfoCountry + ', ' + companyInfoZip +  ', ' + companyInfoFax + ' / ' + companyInfoPhone;
          var NumCtaPago = ultimosDigitos;
          var metodoDePago = 'NA'; //'Transferencia electrónica de fondos';
          var TipoCambio = 1.0;
          var Moneda = 'MXN';
          var fecha = stringDateTimeSF(nlapiDateToString(new Date()));
          var formaDePago = '99' //'En una sola exhibición';
          var sello = '';
          var noCertificado = '20001000000200001436'; //Tmp
          var certificado = '';
          var subTotal = subtotal;
          //var descuento											= 0;
          var Total = total;
          var cantidad = 1;
          var unidad = 'ACT';
          //var noIdentificacion									= returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('entitynumber',join));
          var descripcion = 'Pago de nómina';
          var valorUnitario = subtotal;
          var importe = subtotal;
          var Retencion_impuesto = 'ISR';
          var Retencion_importe = retencion;
          var Receptor_nombre = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('altname', join));
          var Receptor_rfc = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_ce_rfc', join));
          var Version = 1.2;
          var NumEmpleado = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('entitynumber', join));
          var CURP = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('custentity_curp', join));
          var TipoRegimen = "11"; //returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_tiporegimen',join));
          var FechaInicioRelLaboral = returnBlank(customsearch_tn_sf_xml_comprobante[0].getValue('hiredate', join));
          var FechaInicioRelLaboralAntiguedad = nlapiStringToDate(FechaInicioRelLaboral);
          FechaInicioRelLaboral = stringDateTimeSF(FechaInicioRelLaboral, 1);
          var PeriodicidadPago = employee.getFieldText('custentity_c_nom_periodicidadpago'); //returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_periodicidadpago',join)); //'Mensual';
          var antiguedad = antiguadadSAT(FechaInicioRelLaboralAntiguedad, FechaFinalPagoAntiguadad)
          var Percepciones_TotalGravado = subtotal;
          var Percepciones_TotalExento = 0;
          var Percepcion_TipoPercepcion = '046'; //Jalar de catálogo
          var Percepcion_Clave = 'Compensacion';
          var Percepcion_Concepto = 'Ingresos asimilados a salarios'; //'Sueldos, Salarios  Rayas y Jornales'; //'Compensacion';
          var Percepcion_ImporteGravado = subtotal;
          var Percepcion_ImporteExento = 0;
          var Deducciones_TotalImpuestosRetenidos = retencion;
          var Deducciones_TotalExento = 0;
          var Deduccion_TipoDeduccion = '002';
          var Deduccion_Clave = 'ISR';
          var Deduccion_Concepto = 'ISR';
          var Deduccion_ImporteGravado = retencion;
          var Deduccion_ImporteExento = 0;
          var Deducciones_TotalOtrasDeducciones = 0;
          //Add for complement version 1.2
          var TipoContrato = '99'; //returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_tipocontrato',join)); //'01';
          var RegimenFiscal = '601'; // catalogo C_RegimenFiscal manual SAT  nlapiEscapeXML ("Régimen General de Ley Personas Morales");
          var TipoNomina = employee.getFieldText('custentity_c_nom_tiponomina'); //returnBlank(customsearch_tn_sf_xml_comprobante[0].getText('custentity_c_nom_tiponomina',join));
          //var ClaveEntFed = 'JAL';
          var TotalPercepciones = Percepciones_TotalGravado;
          var TotalOtrosPagos = 0;
          var TotalDeduccionesPre = Deducciones_TotalExento + Deducciones_TotalImpuestosRetenidos;
          var TotalDeducciones = TotalDeduccionesPre.toFixed(2);
          var descuento = TotalDeducciones;
          var TotalSeparacionIndemnizacion = 0;
          var TotalJubilacionPensionRetiro = 0;
          var TotalSueldosPre = parseFloat(TotalPercepciones) + TotalSeparacionIndemnizacion + TotalJubilacionPensionRetiro;
          var TotalSueldos = TotalSueldosPre.toFixed(2);
          var tasaISRNum = (parseFloat(descuento) * 100) / parseFloat(importe);
          var tasaISR = tasaISRNum.toFixed(6);

          //___________________________________________________________________________________________________________________________
          //Header
          nlapiLogExecution('DEBUG', 'NSO_BUILD_XML','----Start XML----');
          var columnsSetUp = [];
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_sucursal_testing'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_testing'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_email_send_test'));
          var configrecordTest = nlapiSearchRecord('customrecord_setup_cfdi', null, null, columnsSetUp)[0];

          var columnsSetUp = [];
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_requestor'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_username'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_user'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_entity'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_usuario'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdiparam_testing'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_sucursal_mysuite'));
          columnsSetUp.push(new nlobjSearchColumn('custrecord_cfdi_emailreceipt'));
          var configrecord = nlapiSearchRecord('customrecord_cfdisetup', null, null, columnsSetUp)[0];

          var Testing = configrecordTest.getValue('custrecord_cfdi_testing');
          nlapiLogExecution('DEBUG', 'Testing', Testing);
          if (Testing == 'T') {
            var RFCEmisor = 'AAA010101AAA';
            var RFCReceptor = 'AAAA010101AAA';
            var user = 'integrationtest';
            var sucursal = configrecordTest.getValue('custrecord_cfdi_sucursal_testing');
            var emailsSendTo = configrecordTest.getValue('custrecord_cfdi_email_send_test') || '';
          } else {
            var RFCEmisor = configrecord.getValue('custrecord_cfdi_entity');
            var RFCReceptor = Receptor_rfc;
            var user = configrecord.getValue('custrecord_cfdi_user');
            var sucursal = configrecord.getValue('custrecord_cfdi_sucursal_mysuite');
            var emailsSetup = configrecord.getValue('custrecord_cfdi_emailreceipt') || '';
            //emailsSendTo = emailsSendTo ? emailsSendTo+';'+emailsSetup : emailsSetup;
            emailsSendTo = employee.getFieldValue('email') || '';
            emailsSendTo = emailsSendTo ? emailsSendTo+';facturacion-electronica@mxthermomix.com' : 'facturacion-electronica@mxthermomix.com';
          }

          var toalConLetra = totalConLetra(Total);
          var xml = '';
          xml += '<?xml version=\"1.0\" encoding=\"utf-8\"?>';
          xml += '<fx:FactDocMX ';
          xml += 'xmlns:fx=\"http://www.fact.com.mx/schema/fx\" ';
          xml += 'xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ';
          //xml += 'xsi:schemaLocation=\"http://www.fact.com.mx/schema/fx   http://www.mysuitemex.com/fact/schema/fx_2010_d.xsd\">';
          xml += 'xsi:schemaLocation=\"http://www.fact.com.mx/schema/fx   http://www.mysuitemex.com/fact/schema/fx_2010_f.xsd\">';
              xml += '<fx:Version>7</fx:Version>';
          xml += '<fx:Identificacion>';
          xml += '<fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>';
          xml += '<fx:TipoDeComprobante>RECIBO_DE_NOMINA</fx:TipoDeComprobante>';

          xml += '<fx:RFCEmisor>' + RFCEmisor + '</fx:RFCEmisor>';
          xml += '<fx:RazonSocialEmisor>' + companyInfoName + '</fx:RazonSocialEmisor>';
          xml += '<fx:Usuario>' + user + '</fx:Usuario>';
          xml += '<fx:LugarExpedicion>' + LugarExpedicion + '</fx:LugarExpedicion>';
          xml += '</fx:Identificacion>';

          if(emailsSendTo.length > 1){
              xml += '<fx:Procesamiento>';
              xml += '<fx:Dictionary name="email">';
              xml += '<fx:Entry k="to" v="' + emailsSendTo + '"/>';
              xml += '</fx:Dictionary>';
              xml += '</fx:Procesamiento>';
          }

          xml += '<fx:Emisor>';
          xml += '<fx:RegimenFiscal>';
          xml += '<fx:Regimen>' + RegimenFiscal + '</fx:Regimen>';
          xml += '</fx:RegimenFiscal>';
          xml += '</fx:Emisor>';

          xml += '<fx:Receptor>';
          xml += '<fx:CdgPaisReceptor>' + 'MX' + '</fx:CdgPaisReceptor>';
          xml += '<fx:RFCReceptor>' + RFCReceptor + '</fx:RFCReceptor>';
          xml += '<fx:NombreReceptor>' + Receptor_nombre + '</fx:NombreReceptor>';
          xml += '<fx:UsoCFDI>' + 'P01' + '</fx:UsoCFDI>';
          xml += '</fx:Receptor>';

          xml += '<fx:Conceptos>';
          xml += '<fx:Concepto>';
          xml += '<fx:Cantidad>' + cantidad + '</fx:Cantidad>';
          xml += '<fx:ClaveUnidad>' + 'ACT' + '</fx:ClaveUnidad>';
          xml += '<fx:ClaveProdServ>' + '84111505' + '</fx:ClaveProdServ>';
          //xml += 			'<fx:UnidadDeMedida>' + unidad + '</fx:UnidadDeMedida>';
          xml += '<fx:Descripcion>' + descripcion + '</fx:Descripcion>';
          xml += '<fx:ValorUnitario>' + valorUnitario + '</fx:ValorUnitario>';
          xml += '<fx:Importe>' + importe + '</fx:Importe>';
          xml += '<fx:Descuento>' + TotalDeducciones + '</fx:Descuento>';
          xml += '<fx:ConceptoEx>';
          xml += '<fx:Impuestos>';
          xml += '<fx:Impuesto>';
          xml += '<fx:Contexto>FEDERAL</fx:Contexto>';
          xml += '<fx:Operacion>RETENCION</fx:Operacion>';
          xml += '<fx:Codigo>ISR</fx:Codigo>';
          xml += '<fx:Base>' + importe + '</fx:Base>';
          xml += '<fx:Tasa>' + tasaISR + '</fx:Tasa>';
          xml += '<fx:Monto>' + descuento + '</fx:Monto>';
          xml += '</fx:Impuesto>';
          xml += '</fx:Impuestos>';
          xml += '</fx:ConceptoEx>';
          xml += '</fx:Concepto>';
          xml += '</fx:Conceptos>';

          /*xml += '<fx:ImpuestosSAT>';
          xml += 	' TotalImpuestosRetenidos=\"' + TotalDeducciones + '\"';
          xml += 	' TotalImpuestosRetenidos=\"' + '0.0' + '\">';
          xml += 		'<fx:Retenciones>';
          xml += 			'<fx:Retencion>';
          xml += 				' Impuesto=\"' + TotalDeducciones + '\"';
          xml += 				' Importe=\"' + '0.0' + '\">';
          xml += 			'</fx:Retencion>';
          xml += 		'</fx:Retenciones>';
          xml += '</fx:ImpuestosSAT>';*/

          xml += '<fx:Totales>';
          xml += '<fx:Moneda>' + Moneda + '</fx:Moneda>';
          xml += '<fx:TipoDeCambioVenta>' + '1' + '</fx:TipoDeCambioVenta>';
          xml += '<fx:SubTotalBruto>' + subTotal + '</fx:SubTotalBruto>';
          xml += '<fx:SubTotal>' + subTotal + '</fx:SubTotal>';
          xml += '<fx:Descuento>' + TotalDeducciones + '</fx:Descuento>';
          xml += '<fx:ResumenDeDescuentosYRecargos>';
          xml += '<fx:TotalDescuentos>' + descuento + '</fx:TotalDescuentos>';
          xml += '<fx:TotalRecargos>' + '0.0' + '</fx:TotalRecargos>';
          xml += '</fx:ResumenDeDescuentosYRecargos>';
          xml += '<fx:Impuestos>';
          xml += '<fx:Impuesto>';
          xml += '<fx:Contexto>FEDERAL</fx:Contexto>';
          xml += '<fx:Operacion>RETENCION</fx:Operacion>';
          xml += '<fx:Codigo>ISR</fx:Codigo>';
          xml += '<fx:Base>' + importe + '</fx:Base>';
          xml += '<fx:Tasa>' + tasaISR + '</fx:Tasa>';
          xml += '<fx:Monto>' + descuento + '</fx:Monto>';
          xml += '</fx:Impuesto>';
          xml += '</fx:Impuestos>';
          xml += '<fx:ResumenDeImpuestos>';
          xml += '<fx:TotalTrasladosFederales>' + '0.0' + '</fx:TotalTrasladosFederales>';
          xml += '<fx:TotalIVATrasladado>' + '0.0' + '</fx:TotalIVATrasladado>';
          xml += '<fx:TotalIEPSTrasladado>' + '0.0' + '</fx:TotalIEPSTrasladado>';
          xml += '<fx:TotalRetencionesFederales>' + descuento + '</fx:TotalRetencionesFederales>';
          xml += '<fx:TotalISRRetenido>' + descuento + '</fx:TotalISRRetenido>';
          xml += '<fx:TotalIVARetenido>' + '0.0' + '</fx:TotalIVARetenido>';
          xml += '<fx:TotalIEPSRetenido>' + '0.0' + '</fx:TotalIEPSRetenido>';
          xml += '<fx:TotalTrasladosLocales>' + '0.0' + '</fx:TotalTrasladosLocales>';
          xml += '<fx:TotalRetencionesLocales>' + '0.0' + '</fx:TotalRetencionesLocales>';
          xml += '<fx:TotalImpuestosTrasladados>' + '0.0' + '</fx:TotalImpuestosTrasladados>';
          xml += '<fx:TotalImpuestosRetenidos>' + '0.0' + '</fx:TotalImpuestosRetenidos>';
          xml += '</fx:ResumenDeImpuestos>';
          xml += '<fx:Total>' + Total + '</fx:Total>';
          xml += '<fx:TotalEnLetra>' + toalConLetra + '</fx:TotalEnLetra>';
          xml += '<fx:FormaDePago>' + formaDePago + '</fx:FormaDePago>';
          xml += '</fx:Totales>';

          xml += '<fx:Complementos>';
          xml += '<fx:Nomina12 Version=\"1.2\"';
          xml += ' TipoNomina=\"' + TipoNomina + '\"';
          xml += ' FechaPago=\"' + fechaPago + '\"';
          xml += ' FechaInicialPago=\"' + fechaInicialPago + '\"';
          xml += ' FechaFinalPago=\"' + fechaFinalPago + '\"';
          xml += ' NumDiasPagados=\"' + NumDiasPagados + '\"';
          xml += ' TotalPercepciones=\"' + TotalPercepciones + '\"';
          xml += ' TotalDeducciones=\"' + TotalDeducciones + '\"';
          xml += ' TotalOtrosPagos=\"' + '0.0' + '\">';
          xml += '<fx:Receptor';
          xml += ' Curp=\"' + CURP + '\"';
          xml += ' TipoContrato=\"' + TipoContrato + '\"';
          xml += ' TipoRegimen=\"' + TipoRegimen + '\"';
          xml += ' NumEmpleado=\"' + NumEmpleado + '\"';
          xml += ' PeriodicidadPago=\"' + PeriodicidadPago + '\"';
          xml += ' ClaveEntFed=\"' + ClaveEntFed + '\">';
          xml += '</fx:Receptor>';
          xml += '<fx:Percepciones TotalSueldos=\"' + TotalSueldos + ' \" TotalGravado=\"' + Percepciones_TotalGravado + '\"  TotalExento=\"' + Percepciones_TotalExento + '\" >';
          xml += '<fx:Percepcion TipoPercepcion=\"' + Percepcion_TipoPercepcion + '\"  Clave=\"' + Percepcion_Clave + '\"  Concepto=\"' + Percepcion_Concepto + '\"  ImporteGravado=\"' + Percepcion_ImporteGravado + '\"  ImporteExento=\"' + Percepcion_ImporteExento + '\" ></fx:Percepcion>';
          xml += '</fx:Percepciones>';
          xml += '<fx:Deducciones TotalOtrasDeducciones=\"' + '0.0' + '\"  TotalImpuestosRetenidos=\"' + Deducciones_TotalImpuestosRetenidos + '\" >';
          xml += '<fx:Deduccion TipoDeduccion=\"' + Deduccion_TipoDeduccion + '\"  Clave=\"' + Deduccion_Clave + '\"  Concepto=\"' + Deduccion_Concepto + '\"  Importe=\"' + Deduccion_ImporteGravado + '\" >';
          xml += '</fx:Deduccion>';
          xml += '</fx:Deducciones>';
          xml += '</fx:Nomina12>';
          xml += '</fx:Complementos>';

          xml += '<fx:ComprobanteEx>';
          xml += '<fx:DatosDeNegocio>';
          xml += '<fx:Sucursal>' + sucursal + '</fx:Sucursal>';
          xml += '</fx:DatosDeNegocio>';
          xml += '<fx:TerminosDePago>';
          xml += '<fx:MetodoDePago>' + 'PUE' + '</fx:MetodoDePago>';
          xml += '</fx:TerminosDePago>';
          xml += '</fx:ComprobanteEx>';

          xml += '</fx:FactDocMX>';

          xmlCFDI = xml;
          nlapiLogExecution('DEBUG', 'xml', xml);

          //___________________________________________________________________________________________________________________________
          var file = nlapiCreateFile('cdfiNetsuite_' + recordId + "_" + new Date().getTime(), 'XMLDOC', xml);
          file.setFolder('63573');
          nlapiSubmitFile(file);

          //        			nlapiSendEmail (nlapiGetUser (), 'jonathan.vargas@imr.com.mx', 'xml anexo', xml, null, null, null, file);

          var fields = new Array();
          fields.push('custrecord_' + prefijo + '_xml_comprobante');
          var values = new Array();
          values.push(xmlCFDI);

          nlapiSubmitField(recordType, recordId, fields, values);
          nlapiLogExecution('DEBUG', 'XML MADE', 'Compensacion Lista Para Timbrar');
        } else {
          nlapiLogExecution('ERROR', _tn_sf_codigo_respuesta, _tn_sf_mensaje_respuesta);
        }
      } else {
        var fields = new Array();
        fields.push('custrecord_' + prefijo + '_xml_comprobante');
        var values = new Array();
        values.push('');
        nlapiSubmitField(recordType, recordId, fields, values);
        nlapiLogExecution('ERROR', 'customsearch_tn_sf_xml_comprobante', customsearch_tn_sf_xml_comprobante);
      }
    }
  } catch (e) {
    nlapiLogExecution('ERROR', 'VALOR DEL ERROR', e);
    Generic_HE_Catch_UE(e, nlapiGetRecordType(), nlapiGetRecordId());
  }
}

function antiguadadSAT(desde, hasta) {
  var diferencia = duration(desde, nlapiAddDays(hasta, 1));
  var años = diferencia.años > 0 ? diferencia.años + "Y" : "";
  var meses = diferencia.meses > 0 ? diferencia.meses + "M" : "";
  var dias = diferencia.dias > 0 ? diferencia.dias + "D" : "";
  return "P" + años + meses + dias;
}

function duration(since, until) {

  //if first date is greater that the first, we fix the order
  if (since > until) {
    var temp = since;
    since = until;
    until = temp;
  }

  var years, months, days;

  //Years
  years = (until.getFullYear() - since.getFullYear());
  /*if (until.getMonth() == since.getMonth()){
  	if (since.getDate() < (until.getDate()-1)) {
  		years += 1;
  	}
  	if(since.getDate()==until.getDate()){
  			years+= 1;
  	}
  }*/
  if (since.getMonth() > until.getMonth()) {
    years = (years - 1);
  }
  //Months
  if (since.getDate() > until.getDate()) {
    if (since.getMonth() > (until.getMonth() - 1)) {
      months = 11 - (since.getMonth() - until.getMonth());
      if (since.getMonth() == until.getMonth()) {
        months = 11;
      }
    } else {
      months = until.getMonth() - since.getMonth() - 1;
    }
  } else {
    if (since.getMonth() > until.getMonth()) {
      months = (12 + until.getMonth()) - since.getMonth();
    } else {
      months = until.getMonth() - since.getMonth();
    }
  }
  //Days
  if (since.getDate() > (until.getDate() - 1)) {
    var days_pm = dayssInmonths(until.getMonth(until.getMonth() - 1));
    days = days_pm - since.getDate() + until.getDate();
    if ((since.getMonth() == until.getMonth()) & (since.getDate() == until.getDate())) {
      days = 0;
    }
  } else {
    days = until.getDate() - since.getDate();
  }

  return ({
    "años": years,
    "meses": months,
    "dias": days
  });
}

function dayssInmonths(date) {
  date = new Date(date);
  return 32 - new Date(date.getFullYear(), date.getMonth(), 32).getDate();
}

function totalConLetra(n) {

  var o = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  var u = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  var d = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  var c = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  var n = parseFloat(n).toFixed(2); /*se limita a dos decimales*/
  var p = n.toString().substring(n.toString().indexOf(".") + 1); /*decimales*/
  var m = n.toString().substring(0, n.toString().indexOf(".")); /*número sin decimales*/
  var m = parseFloat(m).toString().split("").reverse();
  var t = "";

  /*Se analiza cada 3 dígitos*/
  for (var i = 0; i < m.length; i += 3) {
    var x = t;
    /*formamos un número de 2 dígitos*/
    var b = m[i + 1] != undefined ? parseFloat(m[i + 1].toString() + m[i].toString()) : parseFloat(m[i].toString());
    /*analizamos el 3 dígito*/
    t = m[i + 2] != undefined ? (c[m[i + 2]] + " ") : "";
    t += b < 10 ? u[b] : (b < 30 ? o[b - 10] : (d[m[i + 1]] + (m[i] == '0' ? "" : (" y " + u[m[i]]))));
    t = t == "ciento cero" ? "cien" : t;
    if (2 < i && i < 6)
      t = t == "uno" ? "mil " : (t.replace("uno", "un") + " mil ");
    if (5 < i && i < 9)
      t = t == "uno" ? "un millón " : (t.replace("uno", "un") + " millones ");
    t += x;
  }

  /*correcciones*/
  t = t.replace("  ", " ");
  t = t.replace(" cero", "");
  t = t.replace(/[a-zA-Z]*(uno|UNO)$/, "un");
  t += " pesos " + p + "/100 M.N.";

  return t.charAt(0).toUpperCase() + t.slice(1);

}
