//Imprimir Comisiones: Boton
function ImprimirComisionesButtonPDF(type, form, request) {
	if(type == 'view') {
		var Base64				= new MainBase64();
		var recordId			= nlapiGetRecordId();
		var name				= nlapiGetFieldValue('name');
		var _ec					= nlapiGetFieldText('custrecord_elegir_comision');
		var ec					= nlapiGetFieldValue('custrecord_elegir_comision');
		var fc					= nlapiGetFieldValue('custrecord_fecha_comision');
		var ids					= nlapiGetFieldValue('custrecord_enlace_detalle_id');
		var data				= new Object();
			data._name			= name;
			data._ec			= _ec;
			data.ec				= ec;
			data.fc			    = fc;
			data.ids	    	= ids;
			data.id_emp			= '';
			data.name			= '';
			data.email			= '';
			data.mode			= 'imprimir';
			data.rec_id			= recordId;
			data				= JSON.stringify(data);
			data				= Base64.encode(data);
		var url 				= nlapiResolveURL("SUITELET", "customscript_imp_rep_com_pdf", "customdeploy_imp_rep_com_pdf", null);
			url 				= url + "&data=" + data;
		form.addButton("custpage_btn_pdf", "PDF", "window.open('" + url + "')");
	}
}

//Imprimir Comisiones: PDF
function ComisionesPDF(request, response) {
	var Base64		= new MainBase64();
	var titleForm	= 'PDF';

	try {

		var data 					= request.getParameter('data');
			data	  	 			= Base64.decode(data);
			nlapiLogExecution('DEBUG', 'data',JSON.stringify(data));
			data					= JSON.parse(data);
		var _name					= returnBlank(data._name);
		var _ec						= returnBlank(data._ec);
		var ec						= returnNumber(data.ec);
		var fc						= returnBlank(data.fc);
		var ids 					= returnBlank(data.ids);
		var id_emp					= returnBlank(data.id_emp);
		var mode					= returnBlank(data.mode);
		var rec_id					= returnBlank(data.rec_id);
//		var fcAux 					= fc.split('/');
		var fcAux = nlapiSearchRecord('customrecord_periods', null, ['name', 'is', fc],new nlobjSearchColumn('custrecord_calendario'))[0].getValue('custrecord_calendario');
		var name					= new String();
		var email					= new String();
		var filters 				= new Array();
		var columns 				= new Array();
		var resultsREC 				= new Array();
		var resultsJDG 				= new Array();
		var resultsPRE 				= new Array();
		var resultsGTM 				= new Array();
		var resultsREC_CAB 			= new Array();
		var ids_rec_com_skip 		= new Array();
		var ids_non 				= new Array();
		var fields					= new Array();
		var values					= new Object();
		var x						= 0;
		var y						= 0;
		var i						= 0;
		var skip 					= 0;
		var ventaGTM				= 0;
		var ventaReclu				= 0;
		var pm_Equipo				= 0;
		//var pm_Propia				= 0;
		var retencion 				= 0;
		var total					= 0;
		var subtotal				= 0;
		var bono_manual 			= 0;
		var strName 				= new String();
		var ids_rec_com_non_skip 	= '';
		var nomEmp					= '';
		var recluNomUni 			= '';
		var _gtm_bono_manual 		= 0;
		var _gtm_total_comisiones 	= 0;
		var _gtm_puesta_marcha 		= 0;
		var _no_ventas_periodo 		= 0;
		var currentURL				= request.getURL();
		var index 					= currentURL.indexOf("/app");
	    var host		  			= currentURL.substring(0, index);
		var compaynyInfo 			= nlapiLoadConfiguration('companyinformation');
		var companyInfoLogoId		= returnBlank(compaynyInfo.getFieldValue('formlogo'));
		var companyInfoLogoObj		= new Object();
		var companyInfoLogoURL		= '';
		if(companyInfoLogoId != '') {
			companyInfoLogoObj	= nlapiLoadFile(companyInfoLogoId);
		} 	else {
			var filtersFile		= new Array();
				filtersFile.push(new nlobjSearchFilter('name', null, 'is', 'IMR_NO_LOGO.png'));
			var searchFile		= returnBlank(nlapiSearchRecord('file', null, filtersFile, null));
			var NO_LOGO_ID		= searchFile[0].getId();
			companyInfoLogoObj	= nlapiLoadFile(NO_LOGO_ID);
		}
		companyInfoLogoURL	= companyInfoLogoObj.getURL();
		companyInfoLogoURL	= stringToArray(companyInfoLogoURL,38);
		companyInfoLogoURL 	= companyInfoLogoURL.join('&amp;');
		companyInfoLogoURL 	= "src='" + host + companyInfoLogoURL + "'/";

		if(ids != '') {
			ids 	= stringToArray(ids,64);
			ids.pop();
		} else {
			ids 	= '@NONE@';
			ids_non.push('@NONE@');
		}
		nlapiLogExecution('DEBUG', 'data',JSON.stringify(data));

		var supervisor = null;
		if(id_emp != '') {
			fields		= new Array();
			fields.push('email');
			fields.push('entityid');
			fields.push('altname');
			fields.push('custentity_delegada');
			values		= nlapiLookupField('employee', id_emp, fields);
			name		= returnBlank(values.entityid) + ' ' + returnBlank(values.altname);
			email		= returnBlank(values.email);
			supervisor = values.custentity_delegada;
		}

		if(name != '') {
			name = ' ' + name;
		}

		//- Buscar el registro principal dec configuraciones
		var configuracionPrincipal = null;
		var filtersConfS = [['custrecord_conf_principal','is','T'], 'and', ['isinactive','is',false]];

		var srchCONFG = nlapiSearchRecord('customrecord_conf_de_compensaciones', null, filtersConfS);
		if(srchCONFG && srchCONFG.length > 0){
			configuracionPrincipal = {
				id: srchCONFG[0].id
			}
		}

		//-------------------------------------------
		//-- Busca los nombre de las configuracoines
		var configuraciones = {};
		var filtersConfNAme = ['isinactive','is',false];

		var srchCONFG = nlapiSearchRecord('customrecord_conf_de_compensaciones', null, filtersConfNAme, new nlobjSearchColumn('altname'));
		for(var j = 0; j < srchCONFG.length; j++){
		    configuraciones[srchCONFG[j].id] = srchCONFG[j].getValue('altname');
		}
		//-------------------------------------------

		var recordConfComp					= nlapiLoadRecord('customrecord_conf_de_compensaciones', configuracionPrincipal.id);
//		var _cdc_articulos_permitidos 		= returnBlank(recordConfComp.getFieldValues('custrecord_cdc_articulos_permitidos'));
		var _cdc_ventas_minimas_para_pago 	= returnNumber(recordConfComp.getFieldValue('custrecord_cdc_ventas_minimas_para_pago'));
		/*/
		var _cdc_tipos_de_venta_permitido 	= returnBlank(recordConfComp.getFieldValues('custrecord_cdc_tipos_de_venta_permitido'));
		var _cdc_ventas_minimas_txtm 		= returnNumber(recordConfComp.getFieldValue('custrecord_cdc_ventas_minimas_txtm'));
		var _cdc_ventas_maximas_rec 		= returnNumber(recordConfComp.getFieldValue('custrecord_cdc_ventas_maximas_rec'));
		/*/
		var relacionPorcentaje	 			= 0;
		var _relacion_equipo_propias_desde 	= 0;
		var _relacion_equipo_propias_hasta 	= 0;
		var _relacion_equipo_propias_porc 	= 0;
		var filtersICF_REP   				= new Array();
			filtersICF_REP.push(new nlobjSearchFilter('custrecord_relacion_equipo_propias_c_c', null, 'is', 1));
		var _icf_rel_equipo_propias 		= returnBlank(nlapiSearchRecord('customrecord_relacion_equipo_propias', 'customsearch_icf_rel_equipo_propias', filtersICF_REP, null));
//		var filtersICF_TISR		  			= new Array();
//			filtersICF_TISR.push(new nlobjSearchFilter('custrecord_year','custrecord_tablas_isr_calendario_vowerk', 'equalto', fcAux[1]));
		var filtersICF_TISR		  	= [new nlobjSearchFilter('custrecord_tablas_isr_calendario_vowerk', null, 'is', fcAux)];
		var _icf_tablas_isr			 		= returnBlank(nlapiSearchRecord('customrecord_tablas_isr', 'customsearch_icf_tablas_isr', filtersICF_TISR, null));

		if(ec == 1) {
			filters[0] 				= new nlobjSearchFilter('custrecord_jdg_fecha_comision','custrecord_jdg_det_comision_jdg_id', 'is', fc);
//			filters[1] 				= new nlobjSearchFilter('item','custrecord_jdg_det_factura', 'anyof', _cdc_articulos_permitidos);
			filters[1] 				= new nlobjSearchFilter('custrecord_jdg_empleado','custrecord_jdg_det_comision_jdg_id', 'anyof', id_emp);

			columns[0] = new nlobjSearchColumn('custrecord9','custrecord_jdg_det_comision_jdg_id').setSort(true);
			columns[1] 				= new nlobjSearchColumn('custrecord_jdg_nombre_empleado','custrecord_jdg_det_comision_jdg_id').setSort(true);
			columns[2] 				= new nlobjSearchColumn('custrecord_jdg_nombre_unidad','custrecord_jdg_det_comision_jdg_id');
			columns[3] = new nlobjSearchColumn('custrecord_jdg_det_total');
			columns[4] = new nlobjSearchColumn('custrecord_jdg_det_bono');
			columns[5] = new nlobjSearchColumn('custrecord_jdg_det_monto_entrega');
          	columns[6] = new nlobjSearchColumn('custrecord_jdg_det_comision_jdg_id');
			resultsJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg_det', 'customsearch_ss_jdg_det', filters, columns));

			filters[0]				= new nlobjSearchFilter('custrecord_rec_fecha_comision','custrecord_rec_det_comision_rec_id', 'is', fc);
	        filters[1] 				= new nlobjSearchFilter('custrecord_rec_esquema_reclutadora','custrecord_rec_det_comision_rec_id','is',2);
	        filters[2] 				= new nlobjSearchFilter('custrecord_rec_categoria_empleado','custrecord_rec_det_comision_rec_id','is',3);
	        filters[3] 				= new nlobjSearchFilter('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id', 'anyof', id_emp);
//			filters[3] 				= new nlobjSearchFilter('item','custrecord_rec_det_factura', 'anyof', _cdc_articulos_permitidos);

	        columns[0] = new nlobjSearchColumn('custrecord11','custrecord_rec_det_comision_rec_id').setSort(true);
	        columns[1] 				= new nlobjSearchColumn('custrecord_rec_esquema_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[2] 				= new nlobjSearchColumn('custrecord_rec_categoria_empleado','custrecord_rec_det_comision_rec_id');
			columns[3] 				= new nlobjSearchColumn('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[4] 				= new nlobjSearchColumn('custrecord_rec_total_comisiones','custrecord_rec_det_comision_rec_id');
			columns[5]				= new nlobjSearchColumn('custrecord_rec_nombre_unidad_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[6]	= new nlobjSearchColumn('custrecord43');
			resultsREC 				= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec_det', 'customsearch_ss_rec_det', filters, columns));


			filters[0] 				= new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] 				= new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			filters[2] 				= new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'anyof',2);
			filters[3] 				= new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',3);
          	filters[4] = new nlobjSearchFilter('custrecord_conf_principal','custrecord11','is','T');

			columns[0] = new nlobjSearchColumn('custrecord11').setSort(true);
			columns[1] 				= new nlobjSearchColumn('custrecord_rec_total_comisiones');
			columns[2] 				= new nlobjSearchColumn('custrecord_rec_empleado');
			columns[3] 				= new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
			columns[4] 				= new nlobjSearchColumn('custrecord_rec_categoria_empleado');
			columns[5] 				= new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
			columns[6] 				= new nlobjSearchColumn('custentity_numcta','custrecord_rec_reclutadora');
			resultsREC_CAB 			= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));

			var filtersDataJDG		= new Array();
			var columnsDataJDG		= new Array();
			var resultsDataJDG		= new Array();
			var _jdg_has_reclu 		= new Boolean();

			filtersDataJDG[0]		= new nlobjSearchFilter('internalid', null, 'anyof', ids);
			filtersDataJDG[1]		= new nlobjSearchFilter('custrecord_jdg_fecha_comision',null, 'is', fc);

			columnsDataJDG[0] = new nlobjSearchColumn('custrecord9').setSort(true);
			columnsDataJDG[1]		= new nlobjSearchColumn('custrecord_jdg_bono_manual');
			columnsDataJDG[2]		= new nlobjSearchColumn('custrecord_jdg_no_ventas_equipo');
			columnsDataJDG[3] 		= new nlobjSearchColumn('custrecord_jdg_total_comisiones_equipo');
			columnsDataJDG[4] 		= new nlobjSearchColumn('custrecord_jdg_no_ventas_propio');
			columnsDataJDG[5] 		= new nlobjSearchColumn('custrecord_jdg_compensacion_propio');
			columnsDataJDG[6] 		= new nlobjSearchColumn('custrecord_jdg_entrega_propio');
			columnsDataJDG[7] 		= new nlobjSearchColumn('custrecord_jdg_total_comisiones_propio');
			columnsDataJDG[8] 		= new nlobjSearchColumn('custentity_promocion','custrecord_jdg_empleado');
			columnsDataJDG[9] 		= new nlobjSearchColumn('custentity_numcta','custrecord_jdg_empleado');
			columnsDataJDG[10] 		= new nlobjSearchColumn('custrecord_jdg_empleado');
			columnsDataJDG[11] 		= new nlobjSearchColumn('custrecord_jdg_nombre_empleado');
			columnsDataJDG[12] 		= new nlobjSearchColumn('custrecord_jdg_pagar_compensaciones');
			columnsDataJDG[13] 		= new nlobjSearchColumn('custrecord_jdg_nombre_unidad');
			columnsDataJDG[14] 		= new nlobjSearchColumn('custrecord_jdg_compensacion_especial');
			columnsDataJDG[15] 		= new nlobjSearchColumn('custrecord_jdg_bono_propio');
			columnsDataJDG[16] = new nlobjSearchColumn('custrecord_jdg_pagado_a');
			columnsDataJDG[17] = new nlobjSearchColumn('custrecord_jdg_pagado_b');
			resultsDataJDG			= returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersDataJDG, columnsDataJDG));

			for(x=0;x<resultsDataJDG.length;x++) {
				var _jdg_bono_manual 				= totalBonos('customrecord_comisiones_jdg', fc, id_emp);//returnNumber(resultsDataJDG[x].getValue('custrecord_jdg_bono_manual'));
				var _jdg_no_ventas_equipo 			= returnNumber(resultsDataJDG[x].getValue('custrecord_jdg_no_ventas_equipo'));
				var _jdg_total_comisiones_equipo 	= returnNumber(resultsDataJDG[x].getValue('custrecord_jdg_total_comisiones_equipo'));
				var _jdg_no_ventas_propio 			= returnNumber(resultsDataJDG[x].getValue('custrecord_jdg_no_ventas_propio'));
				var _jdg_compensacion_propio 		= returnNumber(resultsDataJDG[x].getValue('custrecord_jdg_compensacion_propio'));
				var _jdg_entrega_propio 			= Number(resultsDataJDG[x].getValue('custrecord_jdg_entrega_propio'));
              	var _jdg_bono_propio 	= Number(resultsDataJDG[x].getValue('custrecord_jdg_bono_propio'));
				var _jdg_total_comisiones_propio 	= returnNumber(resultsDataJDG[x].getValue('custrecord_jdg_total_comisiones_propio')) + _jdg_bono_propio + _jdg_entrega_propio;

				var totalPagadoAnticipadoA = Number(resultsDataJDG[i].getValue('custrecord_jdg_pagado_a'));
				var totalPagadoAnticipadoB = Number(resultsDataJDG[i].getValue('custrecord_jdg_pagado_b'));

				var _jdg_empleado 					= returnBlank(resultsDataJDG[x].getValue('custrecord_jdg_empleado'));
				var _jdg_nombre_empleado 			= returnBlank(resultsDataJDG[x].getValue('custrecord_jdg_nombre_empleado'));
				var _jdg_nombre_unidad 				= returnBlank(resultsDataJDG[x].getValue('custrecord_jdg_nombre_unidad'));
				var _jdg_pagar_compensaciones		= returnFalse(resultsDataJDG[x].getValue('custrecord_jdg_pagar_compensaciones'));
				var _jdg_compensacion_especial		= returnNumber(resultsDataJDG[x].getValue('custrecord_jdg_compensacion_especial'));
				var c 								= 0;
				ventaReclu							= 0;
				_jdg_has_reclu						= new Boolean();
				for(c=0;c<resultsREC_CAB.length;c++) {
					if(resultsREC_CAB[c].getValue('custrecord_rec_reclutadora') == _jdg_empleado) {
						ventaReclu += returnNumber(resultsREC_CAB[c].getValue('custrecord_rec_total_comisiones'));
					}
				}
				var	strNameRec  = "<table width='670px'>";
					strNameRec += "<tr>";
					strNameRec += "<td border='0.5' width='10px'><b>#</b></td>";
					strNameRec += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
					strNameRec += "<td border='0.5' width='0px'><b>VENTA REALIZADA POR</b></td>";
					strNameRec += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
					strNameRec += "<td border='0.5' width='0px'><b>FECHA</b></td>";
					strNameRec += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
//					strNameRec += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
					strNameRec += "<td border='0.5' width='0px'><b>MONTO</b></td>";
					strNameRec += "</tr>";
				var lineaRec 	= 1;
				var ttlRec = 0;

				for(y=0;y<resultsREC.length;y++) {
//					if(resultsREC[y].getValue('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id') == _jdg_empleado) {
						ids_rec_com_skip[skip] = resultsREC[y].getId();
						skip++;
						var venta_de = resultsREC[y].getValue('entityid','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR'));
						var claseCte = resultsREC[y].getValue('isperson','CUSTRECORD_REC_DET_CLIENTE');
						var commisionName = configuraciones[resultsREC[y].getValue('custrecord11','custrecord_rec_det_comision_rec_id')];
						var cliente  = '';
						if(claseCte == 'T') {
							cliente  = nlapiEscapeXML(resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_CLIENTE'));
						} else {
							cliente  = resultsREC[y].getValue('entityid', 'CUSTRECORD_REC_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsREC[y].getValue('companyname','CUSTRECORD_REC_DET_CLIENTE'));
						}
						var fecha    = resultsREC[y].getValue('trandate', 'CUSTRECORD_REC_DET_FACTURA');
						var pedido   = resultsREC[y].getValue('tranid', 'CUSTRECORD_REC_DET_FACTURA');
//						var cantidad = resultsREC[y].getValue('quantity', 'CUSTRECORD_REC_DET_FACTURA');
						var monto = resultsREC[y].getValue('custrecord43');

						strNameRec += "<tr>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + commisionName 	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + venta_de 	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + cliente 	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + fecha 		+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";
//						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + cantidad	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + monto	+ "</td>";
						strNameRec += "</tr>";
						lineaRec++;
						ttlRec += Number(monto);
						_jdg_has_reclu	= true;
//					}
				}

				strNameRec += "<tr>";
				strNameRec += "<td border='0.5' colspan= '6' border-style='none' align='right'><b>Total Reclutamiento</b></td>";
				strNameRec += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',ttlRec)	+ "</b></td>";
				strNameRec += "</tr>";

				strNameRec += "</table>";
				strName += "<table width='100%' align=\"center\" style='table-layout: fixed;'>";
				strName += "<tr>";
				strName += "<td align='center' width='30%' rowspan='4'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td>";
				strName += "<td align='center' width='40%'><p color=\"#14904A\" font-size=\"12\"><b>REPORTE DE COMPENSACIONES</b></p></td>";
				strName += "<td align='center' width='30%' rowspan='4'><img width='80%' height='80%' src='/core/media/media.nl?id=911573&amp;c=3367613&amp;h=ba7b026e2315ffefe9a2'/></td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\"><h4><b>LIDER DE EQUIPO</b></h4></td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\">" + fecha_letras(fc) + "</td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\">"+_jdg_nombre_empleado + "</td>";
				strName += "</tr>";
				strName += "</table>";

				var	strnNamePro  = "<table width='670px'>";
					strnNamePro += "<tr>";
					strnNamePro += "<td border='0.5' width='10px'><b>#</b></td>";
					strnNamePro += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
					strnNamePro += "<td border='0.5' width='100px'><b>VENTA REALIZADA POR EL PRESENTADOR</b></td>";
					strnNamePro += "<td border='0.5' width='150px'><b>CLIENTE</b></td>";
					strnNamePro += "<td border='0.5' width='0px'><b>FECHA</b></td>";
					strnNamePro += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
//					strnNamePro += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
					strnNamePro += "<td border='0.5' width='0px'><b>Venta</b></td>";
					strnNamePro += "<td border='0.5' width='0px'><b>Productividad</b></td>";
					strnNamePro += "<td border='0.5' width='0px'><b>Entrega</b></td>";
					strnNamePro += "</tr>";
				var	strnNameEqu  = "<table width='670px'>";
					strnNameEqu += "<tr>";
					strnNameEqu += "<td border='0.5' width='10px'><b>#</b></td>";
					strnNameEqu += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
					strnNameEqu += "<td border='0.5' width='100px'><b>VENTA REALIZADA POR EL PRESENTADOR</b></td>";
					strnNameEqu += "<td border='0.5' width='150px'><b>CLIENTE</b></td>";
					strnNameEqu += "<td border='0.5' width='0px'><b>FECHA</b></td>";
					strnNameEqu += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
					strnNameEqu += "</tr>";
				var lineaPro = 1;
				var lineaEqu = 1;
              nlapiLogExecution('DEBUG', 'resultsJDG.length', resultsJDG.length);

              var subtotalVentaPro = 0;
              var subtotalBonoPro = 0;
              var subtotalEntregaPro = 0;
              var subtotalVentaEqu = 0;
              var subtotalBonoEqu = 0;
              var subtotalEntregaEqu = 0;

				for(i=0;i<resultsJDG.length;i++) {
//					if(ids[x] == resultsJDG[i].getValue('custrecord_jdg_det_comision_jdg_id')) {
					if(resultsJDG[i].getValue('internalid','CUSTRECORD_JDG_DET_VENTA_REALIZADA_POR') == _jdg_empleado || resultsJDG[i].getValue('custrecord_jdg_empleado','custrecord_jdg_det_comision_jdg_id') == _jdg_empleado){
                  //if(resultsJDG[i].getValue('custrecord_jdg_det_comision_jdg_id') == resultsDataJDG[x].getId()){
						var venta_de = resultsJDG[i].getValue('entityid','CUSTRECORD_JDG_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsJDG[i].getValue('altname','CUSTRECORD_JDG_DET_VENTA_REALIZADA_POR'));
						var claseCte = resultsJDG[i].getValue('isperson','CUSTRECORD_JDG_DET_CLIENTE');
						var cliente = '';
						var fecha 	= resultsJDG[i].getValue('trandate', 'CUSTRECORD_JDG_DET_FACTURA');
						var pedido 	= resultsJDG[i].getValue('tranid', 'CUSTRECORD_JDG_DET_FACTURA');
						var cantidad = resultsJDG[i].getValue('quantity', 'CUSTRECORD_JDG_DET_FACTURA');
						var commisionName = configuraciones[resultsJDG[i].getValue('custrecord9','custrecord_jdg_det_comision_jdg_id')];
						var monto = Number(resultsJDG[i].getValue('custrecord_jdg_det_total'));
						var bono = Number(resultsJDG[i].getValue('custrecord_jdg_det_bono'));
						var entrega = Number(resultsJDG[i].getValue('custrecord_jdg_det_monto_entrega'));

						if(claseCte == 'T') {
							cliente  = resultsJDG[i].getValue('entityid','CUSTRECORD_JDG_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsJDG[i].getValue('altname','CUSTRECORD_JDG_DET_CLIENTE'));
						} else {
							cliente  = resultsJDG[i].getValue('entityid','CUSTRECORD_JDG_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsJDG[i].getValue('companyname','CUSTRECORD_JDG_DET_CLIENTE'));
						}

						if(resultsJDG[i].getValue('custrecord_jdg_empleado','custrecord_jdg_det_comision_jdg_id') == resultsJDG[i].getValue('internalid','CUSTRECORD_JDG_DET_VENTA_REALIZADA_POR')) {
							strnNamePro += "<tr>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow'>" + lineaPro	+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow'>" + commisionName	+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow'>" + pedido	+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',monto)	+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',bono)	+ "</td>";
							strnNamePro += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',entrega)	+ "</td>";
							strnNamePro += "</tr>";
							lineaPro++;

							 subtotalVentaPro += monto;
				             subtotalBonoPro += bono;
				             subtotalEntregaPro += entrega;
						} else {
							strnNameEqu += "<tr>";
							strnNameEqu += "<td border='0.5' border-style='dotted-narrow'>" + lineaEqu	+ "</td>";
							strnNameEqu += "<td border='0.5' border-style='dotted-narrow'>" + commisionName	+ "</td>";
							strnNameEqu += "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
							strnNameEqu += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
							strnNameEqu += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
							strnNameEqu += "<td border='0.5' border-style='dotted-narrow'>" + pedido	+ "</td>";
							strnNameEqu += "</tr>";
							lineaEqu++;

							subtotalVentaEqu += monto;
				            subtotalBonoEqu += bono;
				            subtotalEntregaEqu += entrega;
						}
					}
				}

				strnNamePro += "<tr>";
				strnNamePro += "<td border='0.5' border-style='none'></td>";
				strnNamePro += "<td border='0.5' border-style='none'></td>";
				strnNamePro += "<td border='0.5' border-style='none'></td>";
				strnNamePro += "<td border='0.5' border-style='none' colspan='3' align='right'><b>Subtotal</b></td>";
				strnNamePro += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',subtotalVentaPro)	+ "</b></td>";
				strnNamePro += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',subtotalBonoPro)	+ "</b></td>";
				strnNamePro += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',subtotalEntregaPro)+ "</b></td>";
				strnNamePro += "</tr>";

				strnNameEqu += "<tr>";
				strnNameEqu += "<td border='0.5' border-style='none' colspan='5' align='right'><b>Número de ventas de Equipo</b></td>";
				strnNameEqu += "<td border='0.5' border-style='dotted-narrow' align='right'>" + (lineaEqu -1) + "</td>";
				strnNameEqu += "</tr>";

				var lines				= _icf_rel_equipo_propias.length;
				relacionPorcentaje	 	= 0;
				for(var l=0;l<lines;l++) {
					_relacion_equipo_propias_desde 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_desde'));
					_relacion_equipo_propias_hasta 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_hasta'));
					_relacion_equipo_propias_porc 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_porc'));
					if(_relacion_equipo_propias_desde <= _jdg_no_ventas_propio  && _jdg_no_ventas_propio <= _relacion_equipo_propias_hasta) {
						relacionPorcentaje 			  = returnNumber(_relacion_equipo_propias_porc);
						relacionPorcentaje 			 /= 100;
						_jdg_total_comisiones_equipo *= relacionPorcentaje;
						break;
					}
				}

				strnNameEqu += "<tr>";
				strnNameEqu += "<td border='0.5' border-style='none' align='right' colspan='5'><b>% Pagado</b></td>";
				strnNameEqu += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + (relacionPorcentaje*100) + "%</b></td>";
				strnNameEqu += "</tr>";

				strnNameEqu += "<tr>";
				strnNameEqu += "<td border='0.5' border-style='none' align='right' colspan='5'><b>Total comisión Venta de Equipos</b></td>";
				strnNameEqu += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',subtotalVentaEqu)	+ "</b></td>";
				strnNameEqu += "</tr>";

				strnNameEqu += "<tr>";
				strnNameEqu += "<td border='0.5' border-style='none' align='right' colspan='5'><b>Total Comisión</b></td>";
				strnNameEqu += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',_jdg_total_comisiones_equipo)	+ "</b></td>";
				strnNameEqu += "</tr>";

				strnNameEqu 	   += "</table>";
				strnNamePro 	   += "</table>";
				strName 		   += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS PROPIAS</b></p>";
				strName 		   += strnNamePro;
				strName 		   += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS DEL EQUIPO</b></p>";
				strName 		   += strnNameEqu;
				strName 		   += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>BONO DE RECLUTAMIENTO</b></p>";
				strName 		   += strNameRec;


				subtotal 	= returnNumber(_jdg_total_comisiones_propio) + returnNumber(_jdg_total_comisiones_equipo) + returnNumber(pm_Equipo) + returnNumber(ventaReclu) + returnNumber(_jdg_bono_manual) ;
				if(_jdg_no_ventas_propio < _cdc_ventas_minimas_para_pago) {
					subtotal -= ventaReclu;
					color	  = 'red';
				}

				if(_jdg_pagar_compensaciones == 'F') {
					subtotal = 0;
				}
            	retencion 	= 0.0;
            	total 		= 0.0;
				var lines					= _icf_tablas_isr.length;
				for(var l=0;l<lines;l++) {
					var _tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
					var _tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
					var _tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
					var _tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));
					if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  ) {
						total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
						break;
					}
				}
	        	retencion	= subtotal-total;

	        	//--------------------------------------------------------------------------
	        	//-- Calculo de bonos manual
	        	strName += calcBonos('customrecord_comisiones_jdg', fc, id_emp);
	        	//--------------------------------------------------------------------------

	        	strName    +="<br/><h3>Resumen</h3>";
	        	strName    += "<table width='50%'>";
	        	strName    += "<tr>";
	        	strName    += "<td border='0.5'><b>Concepto</b></td>";
	        	strName    += "<td border='0.5'><b>Importe</b></td>";
	        	strName    += "</tr>";

	        	strName    += "<tr>";
	        	strName    += "<td border='0.5' border-style='dotted-narrow'>Ventas Propias</td>";
	        	strName    += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_jdg_total_comisiones_propio - _jdg_bono_propio - _jdg_entrega_propio) +"</td>";
	        	strName    += "</tr>";

	        	strName    += "<tr>";
	        	strName    += "<td border='0.5' border-style='dotted-narrow'>Bono Productividad</td>";//Bono Productividad
	        	strName    += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_jdg_bono_propio) +"</td>";
	        	strName    += "</tr>";

	        	strName    += "<tr>";
	        	strName    += "<td border='0.5' border-style='dotted-narrow'>Comisión de Entrega</td>";//Comisión de Entrega
	        	strName    += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_jdg_entrega_propio) +"</td>";
	        	strName    += "</tr>";

	        	strName    += "<tr>";
	        	strName    += "<td border='0.5' border-style='dotted-narrow'>Movimientos Manuales</td>";//Bono Manual
	        	strName    += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_jdg_bono_manual) +"</td>";
	        	strName    += "</tr>";

	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Ventas Equipo</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_jdg_total_comisiones_equipo) 		+"</td>";
	        	strName += "</tr>";

				strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Reclutamiento</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',ventaReclu) +"</td>";
	        	strName += "</tr>";

	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL COMISIONES</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$', _jdg_total_comisiones_propio + _jdg_bono_manual + _jdg_total_comisiones_equipo + ventaReclu) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>ISR</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('-$',retencion.toFixed(2)) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL A DEPOSITAR</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$',total.toFixed(2)) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "</table>";

	        	//--- Pago Anticipado
	        	if(totalPagadoAnticipadoA || totalPagadoAnticipadoB){
		        	strName += "<p></p><table width='670px'>";
		        	strName += "<tr>";
		        	strName += "<td border='0.5' align='right'><b>Pago Anticipado A</b></td>";
		        	strName += "<td border='0.5' align='right'><b>Pago Anticipado B</b></td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ totalPagadoAnticipadoA +"</td>";
		        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ totalPagadoAnticipadoB +"</td>";
		        	strName += "</tr>";
		        	strName += "</table>";
	        	}
	        	if(x != resultsDataJDG.length-1) {
	        		strName += "<div style='page-break-after: always;'></div>";
	        	}
			}

			if(ids_rec_com_skip.length != resultsREC.length) {
				if(id_emp == '') {
					strName += "<div style='page-break-after: always;'></div>";
            	}
				ids_rec_com_skip.sort();
				var	lon 			= ids_rec_com_skip.length;
				i 					= 0;
	            var resultados 		= new Array();
				var resultadosAux 	= new Array();
				var contR 			= 0;
				for(var cont=lon-1;cont>0;cont--) {
					if(ids_rec_com_skip[cont] != ids_rec_com_skip[cont-1]) {
						resultados[i]=ids_rec_com_skip[cont];
						i++;
					}
				}
				resultados[i]	= ids_rec_com_skip[0];
				resultados.reverse();
				ids_rec_com_skip = resultados;
				for(x=0;x<resultsREC.length;x++) {
					ids_rec_com_non_skip += resultsREC[x].getId() + String.fromCharCode(64);
				}
				for(i=0; i<ids_rec_com_skip.length;i++)
				{
					ids_rec_com_non_skip = ids_rec_com_non_skip.split((ids_rec_com_skip[i]+'@'));
					ids_rec_com_non_skip = ids_rec_com_non_skip.join('');
				}
				ids_rec_com_non_skip = ids_rec_com_non_skip.split('@');
				ids_rec_com_non_skip.pop();
				if(ids_rec_com_non_skip.length != 0)
				{
					for(y=0;y<ids_rec_com_non_skip.length;y++)
					{
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getId() == ids_rec_com_non_skip[y])
							{
								resultadosAux[contR] = resultsREC[x];
								contR++;
							}
						}
					}
		            var	lon 	= resultadosAux.length;
					i 			= 0;
					resultados 	= new Array();
					for(var cont=lon-1;cont>0;cont--)
					{
						if(resultadosAux[cont].getValue('custrecord_rec_reclutadora', 'CUSTRECORD_REC_DET_COMISION_REC_ID') != resultadosAux[cont-1].getValue('custrecord_rec_reclutadora', 'CUSTRECORD_REC_DET_COMISION_REC_ID'))
						{
							resultados[i] = resultadosAux[cont].getValue('custrecord_rec_reclutadora', 'CUSTRECORD_REC_DET_COMISION_REC_ID');
							i++;
						}
					}
					resultados[i]	= resultadosAux[0].getValue('custrecord_rec_reclutadora', 'CUSTRECORD_REC_DET_COMISION_REC_ID');
					resultados.reverse();
	                if(id_emp != '')
	            	{
	                	resultados	= new Array(id_emp);
	            	}
					for(x=0;x<resultados.length;x++)
					{
						var c = 0;
						ventaReclu = 0;
						for(c=0;c<resultsREC_CAB.length;c++)
						{
							if(resultsREC_CAB[c].getValue('custrecord_rec_reclutadora') == resultados[x])
							{
								ventaReclu += returnNumber(resultsREC_CAB[c].getValue('custrecord_rec_total_comisiones'));
							}
						}
						var lineaRec    = 1;
						var is_found	= new Boolean();
						var	strNameRec  = "<table width='670px'>";
							strNameRec += "<tr>";
							strNameRec += "<td border='0.5' width='10px'><b>#</b></td>";
							strNameRec += "<td border='0.5' width='250px'><b>VENTA REALIZADA POR</b></td>";
							strNameRec += "<td border='0.5' width='250px'><b>CLIENTE</b></td>";
							strNameRec += "<td border='0.5' width='0px'><b>FECHA</b></td>";
							strNameRec += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
//							strNameRec += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
							strNameRec += "<td border='0.5' width='0px'><b>MONTO</b></td>";
							strNameRec += "</tr>";
						nomEmp			= '';
						recluNomUni 	= '';

						var ttlRec = 0;
						for(y=0;y<resultsREC.length;y++)
						{
							if(resultsREC[y].getValue('custrecord_rec_reclutadora', 'CUSTRECORD_REC_DET_COMISION_REC_ID') == resultados[x])
							{
								nomEmp 			= resultsREC[y].getText('custrecord_rec_reclutadora','CUSTRECORD_REC_DET_COMISION_REC_ID');
								recluNomUni 	= returnBlank(resultsREC[y].getText('custrecord_rec_nombre_unidad_reclutadora','CUSTRECORD_REC_DET_COMISION_REC_ID'));
								var venta_de 	= resultsREC[y].getValue('entityid','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR'));
								var claseCte 	= resultsREC[y].getValue('isperson','CUSTRECORD_REC_DET_CLIENTE');
								var cliente  	= '';
								var monto = resultsREC[y].getValue('custrecord43');
								if(claseCte == 'T')
								{
									cliente  = resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_CLIENTE');
								}
								else
								{
									cliente  = resultsREC[y].getValue('entityid', 'CUSTRECORD_REC_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsREC[y].getValue('companyname','CUSTRECORD_REC_DET_CLIENTE'));
								}
								var fecha    = resultsREC[y].getValue('trandate', 'CUSTRECORD_REC_DET_FACTURA');
								var pedido   = resultsREC[y].getValue('tranid', 'CUSTRECORD_REC_DET_FACTURA');
//								var cantidad = resultsREC[y].getValue('quantity', 'CUSTRECORD_REC_DET_FACTURA');
								strNameRec 	+= "<tr>";
								strNameRec 	+= "<td border='0.5' border-style='dotted-narrow'>" + lineaRec	+ "</td>";
								strNameRec 	+= "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
								strNameRec 	+= "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
								strNameRec 	+= "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
								strNameRec 	+= "<td border='0.5' border-style='dotted-narrow'>" + pedido	+ "</td>";
//								strNameRec 	+= "<td border='0.5' border-style='dotted-narrow'>" + cantidad	+ "</td>";
								strNameRec 	+= "<td border='0.5' border-style='dotted-narrow'>" + monto	+ "</td>";
								strNameRec 	+= "</tr>";
								lineaRec++;
								ttlRec += Number(monto);
								is_found	= true;
							}
						}

						strNameRec += "<tr>";
						strNameRec += "<td border='0.5' colspan= 5' border-style='none' align='right'><b>Total Reclutamiento</b></td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',ttlRec)	+ "</b></td>";
						strNameRec += "</tr>";

							strNameRec += "</table>";
						if(is_found == true && _jdg_has_reclu == false) {
							strName += "<table width='100%' align=\"center\" style='table-layout: fixed;'>";
							strName += "<tr>";
							strName += "<td align='center' width='30%' rowspan='4'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td>";
							strName += "<td align='center' width='40%'><p color=\"#14904A\" font-size=\"12\"><b>REPORTE DE COMPENSACIONES</b></p></td>";
							strName += "<td align='center' width='30%' rowspan='4'><img width='80%' height='80%' src='/core/media/media.nl?id=911573&amp;c=3367613&amp;h=ba7b026e2315ffefe9a2'/></td>";
							strName += "</tr>";
							strName += "<tr>";
							strName += "<td align=\"center\"><h4><b>LIDER DE EQUIPO</b></h4></td>";
							strName += "</tr>";
							strName += "<tr>";
							strName += "<td align=\"center\">" + fecha_letras(fc) + "</td>";
							strName += "</tr>";
							strName += "<tr>";
							strName += "<td align=\"center\">"+_jdg_nombre_empleado + "</td>";
							strName += "</tr>";
							strName += "</table>";


							strName    += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS PROPIAS</b></p>";
		                    strName    += "<table width='670px'>";
		                    strName    += "<tr>";
		                    strName    += "<td border='0.5' width='10px'><b>#</b></td>";
		                    strName    += "<td border='0.5' width='250px'><b>VENTA REALIZADA POR</b></td>";
		                    strName    += "<td border='0.5' width='250px'><b>CLIENTE</b></td>";
		                    strName    += "<td border='0.5' width='0px'><b>FECHA</b></td>";
		                    strName    += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
//		                    strName    += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
		                    strName    += "<td border='0.5' width='0px'><b>MONTO</b></td>";
		                    strName    += "</tr>";
		                    strName    += "</table>";
							strName    += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS DEL EQUIPO</b></p>";
							strName    += "<table width='670px'>";
							strName    += "<tr>";
							strName    += "<td border='0.5' width='10px'><b>#</b></td>";
							strName    += "<td border='0.5' width='250px'><b>VENTA REALIZADA POR</b></td>";
							strName    += "<td border='0.5' width='250px'><b>CLIENTE</b></td>";
							strName    += "<td border='0.5' width='0px'><b>FECHA</b></td>";
							strName    += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
//							strName    += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
							strName    += "<td border='0.5' width='0px'><b>MONTO</b></td>";
							strName    += "</tr>";
							strName    += "</table>";
							strName    += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>BONO DE RECLUTAMIENTO</b></p>";
							strName    += strNameRec;
							bono_manual = 0;
							ventaGTM 	= 0;
							pm_GTM   	= 0;
							_jdg_no_ventas_propio 			= 0;
							_jdg_total_comisiones_equipo 	= 0;
							_jdg_total_comisiones_propio 	= 0;
							_jdg_bono_manual 				= 0;
							_jdg_pagar_compensaciones		= 0;
							var lines						= _icf_rel_equipo_propias.length;
							relacionPorcentaje	 		= 0;
							for(var l=0;l<lines;l++) {
								_relacion_equipo_propias_desde 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_desde'));
								_relacion_equipo_propias_hasta 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_hasta'));
								 _relacion_equipo_propias_porc 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_porc'));
								if(_relacion_equipo_propias_desde <= _jdg_no_ventas_propio  && _jdg_no_ventas_propio <= _relacion_equipo_propias_hasta)
								{
									relacionPorcentaje 			  = returnNumber(_relacion_equipo_propias_porc);
									relacionPorcentaje 			 /= 100;
									_jdg_total_comisiones_equipo *= relacionPorcentaje;
									break;
								}
							}
							subtotal 	= returnNumber(_jdg_total_comisiones_propio) + returnNumber(_jdg_total_comisiones_equipo) + returnNumber(pm_Equipo) + returnNumber(ventaReclu) + returnNumber(_jdg_bono_manual);
							if(_jdg_no_ventas_propio < _cdc_ventas_minimas_para_pago) {
								subtotal -= ventaReclu;
								color	  = 'red';
							}
							if(_jdg_pagar_compensaciones == 'F') {
								subtotal = 0;
							}
			            	retencion 	= 0.0;
			            	total 		= 0.0;
							var lines					= _icf_tablas_isr.length;
							for(var l=0;l<lines;l++) {
								var _tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
								var _tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
								var _tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
								var _tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));
								if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  )
								{
									total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
									break;
								}
							}
				        	retencion= subtotal-total;

				        	//--------------------------------------------------------------------------
				        	//-- Calculo de bonos manual
				        	strName += calcBonos('customrecord_comisiones_jdg', fc, id_emp);
				        	//--------------------------------------------------------------------------

				        	strName +="<br/><h3>Resumen</h3>";
				        	strName += "<table width='50%'>";
				        	strName += "<tr>";
				        	strName += "<td border='0.5'><b>Concepto</b></td>";
				        	strName += "<td border='0.5'><b>Importe</b></td>";
				        	strName += "</tr>";
			        		strName += "<tr>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'>Movimientos Manuales</td>";//Bono Manual
				        	strName += "<td border='0.5' border-style='dotted-narrow'>"+ currencyFormat('$',0) +"</td>";
				        	strName += "</tr>";
				        	strName += "<tr>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'>Ventas Propias</td>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'>"+ currencyFormat('$',0) +"</td>";
				        	strName += "</tr>";
				        	strName += "<tr>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'>Ventas Equipo</td>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'>"+ currencyFormat('$',0) +"</td>";
				        	strName += "</tr>";

								strName += "<tr>";
					        	strName += "<td border='0.5' border-style='dotted-narrow'>Reclutamiento</td>";
					        	strName += "<td border='0.5' border-style='dotted-narrow'>"+ currencyFormat('$',ventaReclu) +"</td>";
					        	strName += "</tr>";

				        	strName += "<tr>";
				        	strName += "<td border='0.5' border-style='none'><b>TOTAL COMISIONES</b></td>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'><b>"+ currencyFormat('-$', ventaReclu) +"</b></td>";
				        	strName += "</tr>";
				        	strName += "<td border='0.5' border-style='none'><b>ISR</b></td>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'><b>"+ currencyFormat('-$',retencion.toFixed(2)) +"</b></td>";
				        	strName += "</tr>";
				        	strName += "<tr>";
				        	strName += "<td border='0.5' border-style='none'><b>TOTAL A DEPOSITAR</b></td>";
				        	strName += "<td border='0.5' border-style='dotted-narrow'><b>"+ currencyFormat('$',total.toFixed(2)) +"</b></td>";
				        	strName += "</tr>";
				        	strName += "</table>";
				        	if(x != resultados.length-1)
				        	{
				        		strName += "<div style='page-break-after: always;'></div>";
				        	}
						}
					}
				}
			}
		} else if(ec == 2) {
			filters[0] 		= new nlobjSearchFilter('custrecord_gtm_fecha_comision','custrecord_gtm_det_comision_gtm_id', 'is', fc);

			columns[0] = new nlobjSearchColumn('custrecord12','custrecord_gtm_det_comision_gtm_id').setSort(true);
			columns[1] 		= new nlobjSearchColumn('custrecord_gtm_nombre_empleado','custrecord_gtm_det_comision_gtm_id').setSort(true);
			columns[2] = new nlobjSearchColumn('custrecord40');
			resultsGTM 		= returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm_det', 'customsearch_ss_gtm_det', filters, columns));

			filters[0] 		= new nlobjSearchFilter('custrecord_pre_fecha_comision','custrecord_pre_det_comision_pre_id', 'is', fc);
			filters[1] 		= new nlobjSearchFilter('custrecord_pre_empleado','custrecord_pre_det_comision_pre_id', 'is', id_emp);

			resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre_det', 'customsearch_ss_pre_det', filters));

			filters[0] 		= new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
	        filters[1] 		= new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fc);
	        var c = new nlobjSearchColumn('custrecord_gtm_empleado');
	        resultsGTM_CAB 	= returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, c));

	        filters[0] 		= new nlobjSearchFilter('custrecord_rec_fecha_comision','custrecord_rec_det_comision_rec_id', 'is', fc);
	        filters[1] 		= new nlobjSearchFilter('custrecord_rec_esquema_reclutadora','custrecord_rec_det_comision_rec_id','is',2);
	        filters[2] 		= new nlobjSearchFilter('custrecord_rec_categoria_empleado','custrecord_rec_det_comision_rec_id','is',1);
	        filters[3] 		= new nlobjSearchFilter('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id','is', id_emp);

			columns[0] = new nlobjSearchColumn('custrecord11','custrecord_rec_det_comision_rec_id').setSort(true);
			columns[1] 		= new nlobjSearchColumn('custrecord_rec_esquema_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[2] 		= new nlobjSearchColumn('custrecord_rec_categoria_empleado','custrecord_rec_det_comision_rec_id');
			columns[3] 		= new nlobjSearchColumn('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[4] 		= new nlobjSearchColumn('custrecord_rec_total_comisiones','custrecord_rec_det_comision_rec_id');
			columns[5] 		= new nlobjSearchColumn('custrecord_rec_nombre_unidad_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[6] = new nlobjSearchColumn('custrecord43');
			resultsREC 		= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec_det', 'customsearch_ss_rec_det', filters, columns));

			filters[0] 		= new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] 		= new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			filters[2] 		= new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',2);
			filters[3] 		= new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',1);
			filters[4]  = new nlobjSearchFilter('custrecord_conf_principal','custrecord11', 'is', 'T');
			filters[5]  = new nlobjSearchFilter('custrecord_rec_reclutadora', null, 'is', id_emp);

			resultsREC_CAB 	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, new nlobjSearchColumn('custrecord_rec_total_comisiones')));

			var filtersDataPRE	= new Array();
			var columnsDataPRE	= new Array();
			var resultsDataPRE	= new Array();
			filtersDataPRE[0]	= new nlobjSearchFilter('internalid', null, 'anyof', ids);
			filtersDataPRE[1]	= new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);

			columnsDataPRE[0]	= new nlobjSearchColumn('custrecord_pre_total_bono_manual');
			columnsDataPRE[1]	= new nlobjSearchColumn('custrecord_pre_no_ventas');
			columnsDataPRE[2] 	= new nlobjSearchColumn('custrecord_pre_compensacion');
			columnsDataPRE[3]	= new nlobjSearchColumn('custrecord_pre_entrega');
			columnsDataPRE[4] 	= new nlobjSearchColumn('custrecord_pre_total_compensacion');//custrecord_pre_total_comisiones
			columnsDataPRE[5] 	= new nlobjSearchColumn('custentity_promocion','custrecord_pre_empleado');
			columnsDataPRE[6] 	= new nlobjSearchColumn('custentity_numcta','custrecord_pre_empleado');
			columnsDataPRE[7] 	= new nlobjSearchColumn('custrecord_pre_empleado');
			columnsDataPRE[8] 	= new nlobjSearchColumn('custrecord_pre_nombre_empleado');
			columnsDataPRE[9] 	= new nlobjSearchColumn('custrecord_pre_pagar_compensaciones');
			columnsDataPRE[10] 	= new nlobjSearchColumn('custrecord_pre_nombre_unidad');
			columnsDataPRE[11] 	= new nlobjSearchColumn('custrecord_pre_compensacion_especial');
			columnsDataPRE[12] 	= new nlobjSearchColumn('custrecord_pre_h_bono');
			columnsDataPRE[13] 	= new nlobjSearchColumn('custrecord_pre_pago_a');
			columnsDataPRE[14] 	= new nlobjSearchColumn('custrecord_pre_pago_b');
			resultsDataPRE		= returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filtersDataPRE, columnsDataPRE));
			nlapiLogExecution('DEBUG', 'resultsDataPRE.length',resultsDataPRE.length + ' | ids: ' + ids);

			for(x=0;x<resultsDataPRE.length;x++) {

				var totalPagadoAnticipadoA = Number(resultsDataPRE[i].getValue('custrecord_pre_pago_a'));
				var totalPagadoAnticipadoB = Number(resultsDataPRE[i].getValue('custrecord_pre_pago_b'));

				var _pre_bono_manual			= totalBonos('customrecord_comisiones_pre', fc, id_emp);//Number(resultsDataPRE[x].getValue(columnsDataPRE[0]));
				var _pre_no_ventas		 		= returnNumber(resultsDataPRE[x].getValue('custrecord_pre_no_ventas'));
				var _pre_compensacion			= returnNumber(resultsDataPRE[x].getValue('custrecord_pre_compensacion'));
				var _pre_entrega		 		= returnNumber(resultsDataPRE[x].getValue('custrecord_pre_entrega'));
				var _pre_total_comisiones		= returnNumber(resultsDataPRE[x].getValue('custrecord_pre_total_compensacion'));
				var _pre_empleado 				= returnBlank(resultsDataPRE[x].getValue('custrecord_pre_empleado'));
				var _pre_nombre_empleado 		= returnBlank(resultsDataPRE[x].getValue('custrecord_pre_nombre_empleado'));
				var _pre_pagar_comp		 		= returnFalse(resultsDataPRE[x].getValue('custrecord_pre_pagar_compensaciones'));
				var _pre_nombre_unidad	 		= returnBlank(resultsDataPRE[x].getValue('custrecord_pre_nombre_unidad'));
				var _pre_compensacion_especial	= returnNumber(resultsDataPRE[x].getValue('custrecord_pre_compensacion_especial'));
				var _pre_bonificaciones	= Number(resultsDataPRE[x].getValue('custrecord_pre_h_bono'));
				var c 							= 0;
				ventaReclu						= 0;
				_gtm_bono_manual 				= 0;
				_gtm_total_comisiones 			= 0;
				_gtm_puesta_marcha 				= 0;
				_no_ventas_periodo 				= 0;

				for(c=0;c<resultsREC_CAB.length;c++) {
//					if(resultsREC_CAB[c].getValue('custrecord_rec_reclutadora') == _pre_empleado) {
						ventaReclu += returnNumber(resultsREC_CAB[c].getValue('custrecord_rec_total_comisiones'));
//					}
				}

				var	strNameRec  = "<table width='670px'>";
					strNameRec += "<tr>";
					strNameRec += "<td border='0.5' width='10px'><b>#</b></td>";
					strNameRec += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
	                strNameRec += "<td border='0.5' width='200px'><b>VENTA REALIZADA POR</b></td>";
	                strNameRec += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
	                strNameRec += "<td border='0.5' width='0px'><b>FECHA</b></td>";
	                strNameRec += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
	                strNameRec += "<td border='0.5' width='0px'><b>MONTO</b></td>";
					strNameRec += "</tr>";
				var	strNameGTM  = "<table width='670px'>";
					strNameGTM += "<tr>";
					strNameGTM += "<td border='0.5' width='10px'><b>#</b></td>";
					strNameGTM += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
	                strNameGTM += "<td border='0.5' width='200px'><b>VENTA REALIZADA POR</b></td>";
	                strNameGTM += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
	                strNameGTM += "<td border='0.5' width='0px'><b>FECHA</b></td>";
	                strNameGTM += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
	                strNameGTM += "<td border='0.5' width='0px'><b>MONTO</b></td>";
					strNameGTM += "</tr>";
				var lineaRec 	  = 1;
				var ttlRec = 0;
				for(y=0;y<resultsREC.length;y++) {
//					if(resultsREC[y].getValue('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id') == _pre_empleado) {
						ids_rec_com_skip[skip] = resultsREC[y].getId();
						skip++;
						var venta_de = resultsREC[y].getValue('entityid','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR'));
						var claseCte = resultsREC[y].getValue('isperson','CUSTRECORD_REC_DET_CLIENTE');
						var commName =  configuraciones[resultsREC[y].getValue('custrecord11','custrecord_rec_det_comision_rec_id')];
						var cliente  = '';

						if(claseCte=='T') {
							cliente  = resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_CLIENTE');
						} else {
							cliente  = resultsREC[y].getValue('entityid', 'CUSTRECORD_REC_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsREC[y].getValue('companyname','CUSTRECORD_REC_DET_CLIENTE'));
						}

						var fecha    = resultsREC[y].getValue('trandate', 'CUSTRECORD_REC_DET_FACTURA');
						var pedido   = resultsREC[y].getValue('tranid', 'CUSTRECORD_REC_DET_FACTURA');
						var monto = Number(resultsREC[y].getValue('custrecord43'));

						strNameRec += "<tr>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + commName	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$', monto)+ "</td>";
						strNameRec += "</tr>";
						lineaRec++;
						ttlRec += Number(monto);
//					}
				}

				strNameRec += "<tr>";
				strNameRec += "<td border='0.5' colspan= '6' border-style='none' align='right'><b>Total Reclutamiento</b></td>";
				strNameRec += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',ttlRec)	+ "</b></td>";
				strNameRec += "</tr>";
				strNameRec += "</table>";

				strName += "<table width='100%' align=\"center\" style='table-layout: fixed;'>";
				strName += "<tr>";
				strName += "<td align='center' width='30%' rowspan='4'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td>";
				strName += "<td align='center' width='40%'><p color=\"#14904A\" font-size=\"12\"><b>REPORTE DE COMPENSACIONES</b></p></td>";
				strName += "<td align='center' width='30%' rowspan='4'><img width='80%' height='80%' src='/core/media/media.nl?id=911573&amp;c=3367613&amp;h=ba7b026e2315ffefe9a2'/></td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\"><h4><b>PRESENTADORAS</b></h4></td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\">" + fecha_letras(fc) + "</td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\">"+_pre_nombre_empleado + "</td>";
				strName += "</tr>";
				strName += "</table>";

				strName += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS PROPIAS</b></p>";
				strName += "<table width='670px'>";
				strName += "<tr>";
				strName += "<td border='0.5' width='10px'><b>#</b></td>";
				strName += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
				strName += "<td border='0.5' width='100px'><b>VENTA REALIZADA POR</b></td>";
				strName += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
				strName += "<td border='0.5' width='0px'><b>FECHA</b></td>";
				strName += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
				strName += "<td border='0.5' width='0px'><b>Venta</b></td>";
				strName += "<td border='0.5' width='0px'><b>Productividad</b></td>";
				strName += "<td border='0.5' width='0px'><b>Entrega</b></td>";
				strName += "</tr>";

				var lineaPre =1;
				var subtotalVenta = 0;
				var subtotalProductividad = 0;
				var subtotalEntrega = 0;
				for(i=0;i<resultsPRE.length;i++) {
//					if(resultsDataPRE[x].getId() == resultsPRE[i].getValue('custrecord_pre_det_comision_pre_id')) {
					nlapiLogExecution('DEBUG', '' , resultsPRE[i].getValue('custrecord_pre_det_venta_realizada_por') + ' == ' + _pre_empleado);
					if(resultsPRE[i].getValue('custrecord_pre_det_venta_realizada_por') == _pre_empleado) {
						var venta_de = resultsPRE[i].getValue('entityid','CUSTRECORD_PRE_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsPRE[i].getValue('altname','CUSTRECORD_PRE_DET_VENTA_REALIZADA_POR'));
						var claseCte = resultsPRE[i].getValue('isperson','CUSTRECORD_PRE_DET_CLIENTE');
						var commName = configuraciones[resultsPRE[i].getValue('custrecord10','custrecord_pre_det_comision_pre_id')];
						var cliente  = '';
						if(claseCte=='T') {
							cliente  = resultsPRE[i].getValue('entityid','CUSTRECORD_PRE_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsPRE[i].getValue('altname','CUSTRECORD_PRE_DET_CLIENTE'));
						} else {
							cliente  = resultsPRE[i].getValue('entityid','CUSTRECORD_PRE_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsPRE[i].getValue('companyname','CUSTRECORD_PRE_DET_CLIENTE'));
						}
						var fecha    = resultsPRE[i].getValue('trandate', 'CUSTRECORD_PRE_DET_FACTURA');
						var pedido   = resultsPRE[i].getValue('tranid', 'CUSTRECORD_PRE_DET_FACTURA');
//						var cantidad = resultsPRE[i].getValue('quantity', 'CUSTRECORD_PRE_DET_FACTURA');
						var monto = Number(resultsPRE[i].getValue('custrecord42'));
						var bono = Number(resultsPRE[i].getValue('custrecord_pre_bono'));
						var entrega = Number(resultsPRE[i].getValue('custrecord47'));

						strName += "<tr>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + lineaPre	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + commName	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + pedido	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$', monto)	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$', bono)	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$', entrega)	+ "</td>";
						strName += "</tr>";

						lineaPre++;
						subtotalVenta += monto;
						subtotalProductividad += bono;
						subtotalEntrega += entrega;
					}
				}

				strName += "<tr>";
				strName += "<td border='0.5' border-style='none'></td>";
				strName += "<td border='0.5' border-style='none'></td>";
				strName += "<td border='0.5' border-style='none'></td>";
				strName += "<td border='0.5' border-style='none' colspan='3' align='right'><b>Subtotal</b></td>";
				strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$', subtotalVenta)	+ "</b></td>";
				strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$', subtotalProductividad)	+ "</b></td>";
				strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$', subtotalEntrega)	+ "</b></td>";
				strName += "</tr>";

				strName += "</table>";
				strName += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS DE PROGRAMA GANA TU THERMOMIX</b></p>";
				var totalGTM = 0;
				var lineaGTM =1;
				for(i=0;i<resultsGTM.length;i++){
					if(_pre_empleado == resultsGTM[i].getValue('internalid','CUSTRECORD_GTM_DET_VENTA_REALIZADA_POR')){
						var venta_de 	= resultsGTM[i].getValue('entityid','CUSTRECORD_GTM_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsGTM[i].getValue('altname','CUSTRECORD_GTM_DET_VENTA_REALIZADA_POR'));
						var claseCte 	= resultsGTM[i].getValue('isperson','CUSTRECORD_GTM_DET_CLIENTE');
						var commName = configuraciones[resultsGTM[i].getValue('custrecord12','custrecord_gtm_det_comision_gtm_id')];
						var cliente  	= '';

						if(claseCte=='T') {
							cliente  = resultsGTM[i].getValue('entityid','CUSTRECORD_GTM_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsGTM[i].getValue('altname','CUSTRECORD_GTM_DET_CLIENTE'));
						} else {
							cliente  = resultsGTM[i].getValue('entityid','CUSTRECORD_GTM_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsGTM[i].getValue('companyname','CUSTRECORD_GTM_DET_CLIENTE'));
						}

						var fecha    = resultsGTM[i].getValue('trandate', 'CUSTRECORD_GTM_DET_FACTURA');
						var pedido   = resultsGTM[i].getValue('tranid', 'CUSTRECORD_GTM_DET_FACTURA');
//						var cantidad = resultsGTM[i].getValue('quantity', 'CUSTRECORD_GTM_DET_FACTURA');
						var monto 	= resultsGTM[i].getValue('custrecord40');
						strNameGTM += "<tr>";
						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + lineaGTM	+ "</td>";
						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + commName	+ "</td>";
						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";
//						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + cantidad	+ "</td>";
						strNameGTM += "<td border='0.5' border-style='dotted-narrow'>" + currencyFormat('$',monto)	+ "</td>";
						strNameGTM += "</tr>";
						lineaGTM++;
						totalGTM += Number(monto);
						_gtm_bono_manual 		= returnNumber(resultsGTM[i].getValue('custrecord_gtm_bono_manual','CUSTRECORD_GTM_DET_COMISION_GTM_ID'));
						_gtm_total_comisiones 	= returnNumber(resultsGTM[i].getValue('custrecord_gtm_total_comisiones','CUSTRECORD_GTM_DET_COMISION_GTM_ID'));
						_gtm_puesta_marcha 		= returnNumber(resultsGTM[i].getValue('custrecord_gtm_puesta_marcha','CUSTRECORD_GTM_DET_COMISION_GTM_ID'));
						_no_ventas_periodo 		= returnNumber(resultsGTM[i].getValue('custrecord_gtm_no_ventas_periodo','CUSTRECORD_GTM_DET_COMISION_GTM_ID'));
					}
				}
				strNameGTM 		   += "</table>";
				strName 		   += strNameGTM;
				strName 		   += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>BONO DE RECLUTAMIENTO</b></p>";
				strName 		   += strNameRec;

				/*/
				for(var xx=0;xx<resultsGTM_CAB.length;xx++)
				{
					if(resultsGTM_CAB[xx].getValue('custrecord_gtm_empleado') == _pre_empleado)
					{
						ventaGTM = returnNumber(resultsGTM_CAB[xx].getValue('custrecord_gtm_total_comisiones'));
						pm_GTM  =  returnNumber(resultsGTM_CAB[xx].getValue('custrecord_gtm_puesta_marcha'));
						break;
					}
				}
				/*/
				ventaGTM	= _gtm_total_comisiones;
				subtotal 	= returnNumber(_pre_total_comisiones) + returnNumber(ventaReclu) + returnNumber(ventaGTM) + returnNumber(_pre_bono_manual);
				/*if(_pre_no_ventas < _cdc_ventas_minimas_para_pago) {
					subtotal -= ventaReclu;*/
					color	  = "red";
				/*}*/

				if(_pre_pagar_comp == 'F') {
					subtotal = 0;
				}
            	retencion 	= 0.0;
            	total 		= 0.0;
				var lines					= _icf_tablas_isr.length;
				for(var l=0;l<lines;l++) {
					var _tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
					var _tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
					var _tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
					var _tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));
					if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  ) {
						total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
						break;
					}
				}
	        	retencion= subtotal-total;

	        	//--------------------------------------------------------------------------
	        	//-- Calculo de bonos manual
	        	strName += calcBonos('customrecord_comisiones_pre', fc, id_emp);

	        	strName +="<br/><h3>Resumen</h3>";
	        	strName += "<table width='50%'>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5'><b>Concepto</b></td>";
	        	strName += "<td border='0.5'><b>Importe</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Ventas Propias</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(_pre_compensacion + _pre_entrega)) +"</td>";//_pre_total_comisiones
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Bono de Productividad</td>";//Bono Manual (Ventas Propias)
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_gtm_bono_manual + _pre_bonificaciones) +"</td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Ventas Gánate TM</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_gtm_total_comisiones) +"</td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Movimientos Manuales</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_pre_bono_manual) +"</td>";
	        	strName += "</tr>";

				strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Reclutamiento</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',ventaReclu) +"</td>";
	        	strName += "</tr>";

	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL COMISIONES</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$', (_pre_compensacion + _pre_entrega) + _pre_bono_manual + _pre_bonificaciones +_gtm_total_comisiones + _gtm_bono_manual + ventaReclu) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>ISR</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('-$',retencion.toFixed(2)) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL A DEPOSITAR</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$',total.toFixed(2)) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "</table>";

	        	//--- Pago Anticipado
	        	if(totalPagadoAnticipadoA || totalPagadoAnticipadoB){
	        		strName += "<p></p><table width='670px'>";
		        	strName += "<tr>";
		        	strName += "<td border='0.5' align='right'><b>Pago Anticipado A</b></td>";
		        	strName += "<td border='0.5' align='right'><b>Pago Anticipado B</b></td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ totalPagadoAnticipadoA +"</td>";
		        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ totalPagadoAnticipadoB +"</td>";
		        	strName += "</tr>";
		        	strName += "</table>";
	        	}


	        	if(x != resultsDataPRE.length-1){
	        		strName += "<div style='page-break-after: always;'></div>";
	        	}
			}

		} else if(ec == 4) {
			filters[0] 		= new nlobjSearchFilter('custrecord_gtm_fecha_comision','custrecord_gtm_det_comision_gtm_id', 'is', fc);
//			filters[1] 		= new nlobjSearchFilter('item','custrecord_gtm_det_factura', 'anyof', _cdc_articulos_permitidos);

			columns[0] = new nlobjSearchColumn('custrecord12','custrecord_gtm_det_comision_gtm_id').setSort(true);
			columns[1] 		= new nlobjSearchColumn('custrecord_gtm_nombre_empleado','custrecord_gtm_det_comision_gtm_id').setSort(true);
			columns[2] = new nlobjSearchColumn('custrecord40');
			resultsGTM 		= returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm_det', 'customsearch_ss_gtm_det', filters, columns));

			filters[0] 		= new nlobjSearchFilter('custrecord_rec_fecha_comision','custrecord_rec_det_comision_rec_id', 'is', fc);
//			filters[1] 		= new nlobjSearchFilter('item','custrecord_rec_det_factura', 'anyof', _cdc_articulos_permitidos);
			filters[1] 		= new nlobjSearchFilter('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id','is', id_emp);

			columns[0] = new nlobjSearchColumn('custrecord11','custrecord_rec_det_comision_rec_id').setSort(true);
			columns[1] 		= new nlobjSearchColumn('custrecord_rec_esquema_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[2] 		= new nlobjSearchColumn('custrecord_rec_categoria_empleado','custrecord_rec_det_comision_rec_id');
			columns[3] 		= new nlobjSearchColumn('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[4] 		= new nlobjSearchColumn('custrecord_rec_total_comisiones','custrecord_rec_det_comision_rec_id');
			columns[5]		= new nlobjSearchColumn('custrecord_rec_nombre_unidad_reclutadora','custrecord_rec_det_comision_rec_id');
			columns[6] = new nlobjSearchColumn('custrecord43');
			resultsREC 		= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec_det', 'customsearch_ss_rec_det', filters, columns));

			filters[0] 		= new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] 		= new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
	        filters[2]  = new nlobjSearchFilter('custrecord_rec_reclutadora', null, 'is', id_emp);
	        filters[3]  = new nlobjSearchFilter('custrecord_conf_principal','custrecord11', 'is', 'T');
			resultsREC_CAB 	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters,  new nlobjSearchColumn('custrecord_rec_total_comisiones')));

			var filtersDataGTM	= new Array();
			var columnsDataGTM	= new Array();
			var resultsDataGTM	= new Array();
			filtersDataGTM[0]	= new nlobjSearchFilter('internalid', null, 'anyof', ids);
			filtersDataGTM[1]	= new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);

			columnsDataGTM[0] = new nlobjSearchColumn('custrecord12').setSort(true);
			columnsDataGTM[1]	= new nlobjSearchColumn('custrecord_gtm_bono_manual');
			columnsDataGTM[2]	= new nlobjSearchColumn('custrecord_gtm_rentener_compensaciones');
			columnsDataGTM[3]	= new nlobjSearchColumn('custrecord_gtm_no_ventas_periodo');
			columnsDataGTM[4] 	= new nlobjSearchColumn('custrecord_gtm_total_comisiones');
			columnsDataGTM[5] 	= new nlobjSearchColumn('custrecord_gtm_puesta_marcha');
			columnsDataGTM[6] 	= new nlobjSearchColumn('custentity_promocion','custrecord_gtm_empleado');
			columnsDataGTM[7] 	= new nlobjSearchColumn('custentity_numcta','custrecord_gtm_empleado');
			columnsDataGTM[8] 	= new nlobjSearchColumn('custrecord_gtm_empleado');
			columnsDataGTM[9] 	= new nlobjSearchColumn('custrecord_gtm_nombre_empleado');
			columnsDataGTM[10] 	= new nlobjSearchColumn('custrecord_gtm_pagar_compensaciones');
			columnsDataGTM[11] 	= new nlobjSearchColumn('custrecord_gtm_nombre_unidad');
			resultsDataGTM		= returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filtersDataGTM, columnsDataGTM));

			for( x = 0 ; x < resultsDataGTM.length ;x++) {
				var _gtm_bono_manual		= totalBonos('customrecord_comisiones_gtm', fc, id_emp);;//returnNumber(resultsDataGTM[x].getValue('custrecord_gtm_bono_manual'));
				var _gtm_rentener_comp		= returnFalse(resultsDataGTM[x].getValue('custrecord_gtm_rentener_compensaciones'));
				var _gtm_no_ventas_periodo	= returnNumber(resultsDataGTM[x].getValue('custrecord_gtm_no_ventas_periodo'));
				var _gtm_total_comisiones 	= returnNumber(resultsDataGTM[x].getValue('custrecord_gtm_total_comisiones'));
				var _gtm_puesta_marcha 		= returnNumber(resultsDataGTM[x].getValue('custrecord_gtm_puesta_marcha'));
				var _gtm_empleado 			= returnBlank(resultsDataGTM[x].getValue('custrecord_gtm_empleado'));
				var _gtm_nombre_empleado 	= returnBlank(resultsDataGTM[x].getValue('custrecord_gtm_nombre_empleado'));
				var _gtm_pagar_comp		 	= returnFalse(resultsDataGTM[x].getValue('custrecord_gtm_pagar_compensaciones'));
				var _gtm_nombre_unidad 		= returnBlank(resultsDataGTM[x].getValue('custrecord_gtm_nombre_unidad'));
				var c 						= 0;
				ventaReclu					= 0;
				for(c=0;c<resultsREC_CAB.length;c++) {
//					if(resultsREC_CAB[c].getValue('custrecord_rec_reclutadora') == _gtm_empleado) {
						ventaReclu 		+= returnNumber(resultsREC_CAB[c].getValue('custrecord_rec_total_comisiones'));
						ids_non[skip] 	 = resultsREC_CAB[c].getId();
	                    skip++;
//					}
				}
				var	strNameRec  = "<table width='670px'>";
					strNameRec += "<tr>";
					strNameRec += "<td border='0.5' width='10px'><b>#</b></td>";
	                strNameRec += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
	                strNameRec += "<td border='0.5' width='200px'><b>VENTA REALIZADA POR</b></td>";
	                strNameRec += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
	                strNameRec += "<td border='0.5' width='0px'><b>FECHA</b></td>";
	                strNameRec += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
	                strNameRec += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
	                strNameRec += "<td border='0.5' width='0px'><b>MONTO</b></td>";
					strNameRec += "</tr>";
				var lineaRec 	= 1;
				var ttlRec = 0;
				for(y=0;y<resultsREC.length;y++) {
//					if(resultsREC[y].getValue('custrecord_rec_reclutadora','custrecord_rec_det_comision_rec_id') == _gtm_empleado) {
						//ids_rec_com_skip[skip] = resultsREC[y].getId();
						//skip++;
						var venta_de = resultsREC[y].getValue('entityid','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR'));
						var claseCte = resultsREC[y].getValue('isperson','CUSTRECORD_REC_DET_CLIENTE');
						var commisionName = configuraciones[resultsREC[y].getValue('custrecord11','custrecord_rec_det_comision_rec_id')];
						var cliente  = '';
						if(claseCte == 'T') {
							cliente  = resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_CLIENTE');
						} else {
							cliente  = resultsREC[y].getValue('entityid', 'CUSTRECORD_REC_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsREC[y].getValue('companyname','CUSTRECORD_REC_DET_CLIENTE'));
						}
						var fecha    = resultsREC[y].getValue('trandate', 'CUSTRECORD_REC_DET_FACTURA');
						var pedido   = resultsREC[y].getValue('tranid', 'CUSTRECORD_REC_DET_FACTURA');
						var cantidad = resultsREC[y].getValue('quantity', 'CUSTRECORD_REC_DET_FACTURA');
						var monto = Number(resultsREC[y].getValue('custrecord43'));

						strNameRec += "<tr>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + commisionName	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + cantidad	+ "</td>";
						strNameRec += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',monto)	+ "</td>";
						strNameRec += "</tr>";
						lineaRec++;
						ttlRec += Number(monto);
//					}
				}
				strNameRec += "<tr>";
				strNameRec += "<td border='0.5' colspan= '7' border-style='none' align='right'><b>Total Reclutamiento</b></td>";
				strNameRec += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',ttlRec)	+ "</b></td>";
				strNameRec += "</tr>";
				strNameRec += "</table>";

				strName += "<table width='100%' align=\"center\" style='table-layout: fixed;'>";
				strName += "<tr>";
				strName += "<td align='center' width='30%' rowspan='4'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td>";
				strName += "<td align='center' width='40%'><p color=\"#14904A\" font-size=\"12\"><b>REPORTE DE COMPENSACIONES</b></p></td>";
				strName += "<td align='center' width='30%' rowspan='4'><img width='80%' height='80%' src='/core/media/media.nl?id=911573&amp;c=3367613&amp;h=ba7b026e2315ffefe9a2'/></td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\"><h4><b>GANATE TM</b></h4></td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\">" + fecha_letras(fc) + "</td>";
				strName += "</tr>";
				strName += "<tr>";
				strName += "<td align=\"center\">"+_gtm_nombre_empleado + "</td>";
				strName += "</tr>";
				strName += "</table>";

				strName += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>Gánate TM</b></p>";
				strName += "<table width='670px'>";
				strName += "<tr>";
				strName += "<td border='0.5' width='10px'><b>#</b></td>";
	            strName += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
	            strName += "<td border='0.5' width='200px'><b>VENTA REALIZADA POR</b></td>";
	            strName += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
	            strName += "<td border='0.5' width='0px'><b>FECHA</b></td>";
	            strName += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
	            strName += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
	            strName += "<td border='0.5' width='0px'><b>MONTO</b></td>";
				strName += "</tr>";
				var lineaGTM = 1;
				var totalGTM = 0;
				for(i=0;i<resultsGTM.length;i++) {
					if(_gtm_empleado == resultsGTM[i].getValue('internalid','custrecord_gtm_det_venta_realizada_por')){
//					if(ids[x] == resultsGTM[i].getValue('custrecord_gtm_det_comision_gtm_id')){

						var venta_de = resultsGTM[i].getValue('entityid','CUSTRECORD_GTM_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsGTM[i].getValue('altname','CUSTRECORD_GTM_DET_VENTA_REALIZADA_POR'));
						var claseCte = resultsGTM[i].getValue('isperson','CUSTRECORD_GTM_DET_VENTA_REALIZADA_POR');
						var commisionName = configuraciones[resultsGTM[i].getValue('custrecord12','custrecord_gtm_det_comision_gtm_id')];
						var cliente  = '';
						if(claseCte == 'T') {
							cliente  = resultsGTM[i].getValue('entityid','CUSTRECORD_GTM_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsGTM[i].getValue('altname','CUSTRECORD_GTM_DET_CLIENTE'));
						} else {
							cliente  = resultsGTM[i].getValue('entityid','CUSTRECORD_GTM_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsGTM[i].getValue('companyname','CUSTRECORD_GTM_DET_CLIENTE'));
						}
						var fecha    = resultsGTM[i].getValue('trandate', 'CUSTRECORD_GTM_DET_FACTURA');
						var pedido   = resultsGTM[i].getValue('tranid', 'CUSTRECORD_GTM_DET_FACTURA');
						var cantidad = resultsGTM[i].getValue('quantity', 'CUSTRECORD_GTM_DET_FACTURA');
						var monto = resultsGTM[i].getValue('custrecord40');

						strName += "<tr>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + lineaGTM	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + commisionName	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + venta_de	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + pedido	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + cantidad	+ "</td>";
						strName += "<td border='0.5' border-style='dotted-narrow'>" + monto	+ "</td>";
						strName += "</tr>";
						lineaGTM++;
						totalGTM += Number(monto);
					}
				}
//				strName += "<tr>";
//				strName += "<td border='0.5' border-style='none' colspan='7' align='right'><b>Total Gánate TM</b></td>";
//				strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$', totalGTM) + "</b></td>";
//				strName += "</tr>";
				strName += "</table>";
				strName += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>BONO DE RECLUTAMIENTO</b></p>";
				strName += strNameRec;
				subtotal 		= returnNumber(_gtm_total_comisiones) + returnNumber(ventaReclu) + returnNumber(_gtm_bono_manual) ;

              	/*if(_gtm_no_ventas_periodo < _cdc_ventas_minimas_para_pago) {
					subtotal -= ventaReclu;*/
					color	  = 'red';
				/*}*/

				if(_gtm_rentener_comp == 'T') 	{
					subtotal -= _gtm_total_comisiones;
					color	  = 'red';
				}

				if(_gtm_pagar_comp == 'F') {
					subtotal = 0;
				}
            	retencion 	= 0.0;
            	total 		= 0.0;
				var lines					= _icf_tablas_isr.length;
				for(var l=0;l<lines;l++) {
					var _tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
					var _tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
					var _tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
					var _tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));
					if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  )
					{
						total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
						break;
					}
				}
	        	retencion = subtotal-total;
	        	//--------------------------------------------------------------------------
	        	//-- Calculo de bonos manual
	        	strName += calcBonos('customrecord_comisiones_gtm', fc, id_emp);
	        	//--------------------------------------------------------------------------

	        	strName +="<br/><h3>Resumen</h3>";
	        	strName += "<table width='50%'>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5'><b>Concepto</b></td>";
	        	strName += "<td border='0.5'><b>Importe</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Ventas Gánate TM</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_gtm_total_comisiones) +"</td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='dotted-narrow'>Movimientos Manuales</td>";//Bono Manual
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_gtm_bono_manual) +"</td>";
	        	strName += "</tr>";

	        	strName += "<tr>";
				strName += "<td border='0.5' border-style='dotted-narrow'>Reclutamiento</td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',ventaReclu) +"</td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL DE COMISIONES</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$',_gtm_total_comisiones + _gtm_bono_manual + ventaReclu) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>ISR</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('-$',retencion.toFixed(2)) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "<tr>";
	        	strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL A DEPOSITAR</b></td>";
	        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$',total.toFixed(2)) +"</b></td>";
	        	strName += "</tr>";
	        	strName += "</table>";
	        	if(x != resultsDataGTM.length-1)
	        	{
	        		strName += "<div style='page-break-after: always;'></div>";
	        	}
			}

//			if(ids_non.length != 0) {
//				if(id_emp == '') {
//					strName += "<div style='page-break-after: always;'></div>";
//            	}
//	            filters[0] 		= new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
//	            filters[1] 		= new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
//	            filters[2] 		= new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',1);
//	            filters[3] 		= new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',1);
//	            filters[4] 		= new nlobjSearchFilter('internalid',null,'noneof',ids_non);
//	            if(id_emp != '') {
//	                filters[5] 		= new nlobjSearchFilter('custrecord_rec_reclutadora',null,'anyof',id_emp);
//            	}
//	            var columnsRecCab = [];
//	            columnsRecCab[0] 		= new nlobjSearchColumn('custrecord_rec_total_comisiones');
//	            columnsRecCab[1] 		= new nlobjSearchColumn('custrecord_rec_empleado');
//	            columnsRecCab[2] 		= new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
//	            columnsRecCab[3] 		= new nlobjSearchColumn('custrecord_rec_categoria_empleado');
//	            columnsRecCab[4] 		= new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
//	            resultsREC_CAB 	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columnsRecCab));
//	            if(resultsREC_CAB != '') {
//	                var ids_rec_reclutadora = new Array();
//	                for(y=0;y<resultsREC_CAB.length;y++) {
//	                    ids_rec_reclutadora[y] = resultsREC_CAB[y].getValue('custrecord_rec_reclutadora');
//	                }
//	                ids_rec_reclutadora = deleteDuplicateElements(ids_rec_reclutadora);
//
//	                for(var z=0;z<ids_rec_reclutadora.length;z++) {
//	                    var strNameRec  = "<table width='670px'>";
//	                        strNameRec += "<tr>";
//	                        strNameRec += "<td border='0.5' width='10px'><b>#</b></td>";
//	                        strNameRec += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
//	                        strNameRec += "<td border='0.5' width='200px'><b>VENTA REALIZADA POR</b></td>";
//	                        strNameRec += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
//	                        strNameRec += "<td border='0.5' width='0px'><b>FECHA</b></td>";
//	                        strNameRec += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
//	                        strNameRec += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
//	                        strNameRec += "<td border='0.5' width='0px'><b>MONTO</b></td>";
//	                        strNameRec += "</tr>";
//	                    var lineaRec 	= 1;
//	                    nomEmp			= '';
//	                    recluNomUni 	= '';
//	                    var c 			= 0;
//	                    ventaReclu		= 0;
//	                    for(c=0;c<resultsREC_CAB.length;c++) {
//	                        if(resultsREC_CAB[c].getValue('custrecord_rec_reclutadora') == ids_rec_reclutadora[z])  {
//	                            ventaReclu += returnNumber(resultsREC_CAB[c].getValue('custrecord_rec_total_comisiones'));
//	                            nomEmp = resultsREC_CAB[c].getText('custrecord_rec_reclutadora');
//	                        }
//	                    }
//
//	                    var ttlRec = 0;
//	                    for(y=0;y<resultsREC.length;y++) {
//	                        if(resultsREC[y].getValue('custrecord_rec_reclutadora', 'CUSTRECORD_REC_DET_COMISION_REC_ID') == ids_rec_reclutadora[z]) {
//	                            nomEmp 		 = resultsREC[y].getText('custrecord_rec_reclutadora','CUSTRECORD_REC_DET_COMISION_REC_ID');
//	                            recluNomUni  = returnBlank(resultsREC[y].getValue('custrecord_rec_nombre_unidad_reclutadora','CUSTRECORD_REC_DET_COMISION_REC_ID'));
//	                            var venta_de = resultsREC[y].getValue('entityid','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR') + ' ' + nlapiEscapeXML(resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_VENTA_REALIZADA_POR'));
//	                            var claseCte = resultsREC[y].getValue('isperson','CUSTRECORD_REC_DET_CLIENTE');
//	                            var commisionName = configuraciones[resultsREC[y].getValue('custrecord11','custrecord_rec_det_comision_rec_id')];
//
//	                            var cliente  = '';
//	                            if(claseCte == 'T') {
//	                                cliente  = resultsREC[y].getValue('altname','CUSTRECORD_REC_DET_CLIENTE');
//	                            } else  {
//	                                cliente  = resultsREC[y].getValue('entityid', 'CUSTRECORD_REC_DET_CLIENTE') +' '+ nlapiEscapeXML(resultsREC[y].getValue('companyname','CUSTRECORD_REC_DET_CLIENTE'));
//	                            }
//	                            var fecha    = resultsREC[y].getValue('trandate', 'CUSTRECORD_REC_DET_FACTURA');
//	                            var pedido   = resultsREC[y].getValue('tranid', 'CUSTRECORD_REC_DET_FACTURA');
//	                            var cantidad = resultsREC[y].getValue('quantity', 'CUSTRECORD_REC_DET_FACTURA');
//	                            var monto = resultsREC[y].getValue('custrecord43');
//
//	                            strNameRec += "<tr>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec	+ "</td>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + commisionName 	+ "</td>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + venta_de 	+ "</td>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + cliente 	+ "</td>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + fecha		+ "</td>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + cantidad	+ "</td>";
//	                            strNameRec += "<td border='0.5' border-style='dotted-narrow'>" + monto	+ "</td>";
//	                            strNameRec += "</tr>";
//	                            lineaRec++;
//	                            ttlRec += Number(monto);
//	                        }
//	                    }
//	                    strNameRec += "<tr>";
//	    				strNameRec += "<td border='0.5' colspan= '7' border-style='none' align='right'><b>Total Reclutamiento</b></td>";
//	    				strNameRec += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',ttlRec)	+ "</b></td>";
//	    				strNameRec += "</tr>";
//	                    strNameRec += "</table>";
//
//	                    strName += "<table width='100%' align=\"center\" style='table-layout: fixed;'>";
//	    				strName += "<tr>";
//	    				strName += "<td align='center' width='30%' rowspan='4'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td>";
//	    				strName += "<td align='center' width='40%'><p color=\"#14904A\" font-size=\"12\"><b>REPORTE DE COMPENSACIONES</b></p></td>";
//	    				strName += "<td align='center' width='30%' rowspan='4'><img width='80%' height='80%' src='/core/media/media.nl?id=911573&amp;c=3367613&amp;h=ba7b026e2315ffefe9a2'/></td>";
//	    				strName += "</tr>";
//	    				strName += "<tr>";
//	    				strName += "<td align=\"center\"><h4><b>GANATE TM</b></h4></td>";
//	    				strName += "</tr>";
//	    				strName += "<tr>";
//	    				strName += "<td align=\"center\">" + fecha_letras(fc) + "</td>";
//	    				strName += "</tr>";
//	    				strName += "<tr>";
//	    				strName += "<td align=\"center\">"+nomEmp + "</td>";
//	    				strName += "</tr>";
//	    				strName += "</table>";
//
//	                    strName += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\">GÃ¡nate TM</p>";
//	                    strName += "<table width='670px'>";
//	                    strName += "<tr>";
//	                    strName += "<td border='0.5' width='10px'><b>#</b></td>";
//	                    strName += "<td border='0.5' width='250px'><b>VENTA REALIZADA POR</b></td>";
//	                    strName += "<td border='0.5' width='250px'><b>CLIENTE</b></td>";
//	                    strName += "<td border='0.5' width='0px'><b>FECHA</b></td>";
//	                    strName += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
//	                    strName += "<td border='0.5' width='0px'><b>CANTIDAD</b></td>";
//	                    strName += "<td border='0.5' width='0px'><b>MONTO</b></td>";
//	                    strName += "</tr>";
//	                    strName += "</table>";
//	                    strName += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>BONO DE RECLUTAMIENTO</b></p>";
//	                    strName += strNameRec;
//	                    bono_manual = 0;
//	                    ventaGTM 	= 0;
//	                    pm_GTM   				= 0;
//	                    _gtm_total_comisiones 	= 0;
//	                    _gtm_bono_manual	 	= 0;
//	                    _gtm_no_ventas_periodo 	= 0;
//	                    _gtm_rentener_comp 		= 0;
//	                    _gtm_pagar_comp 		= 0;
//	                    _gtm_puesta_marcha		= 0;
//	                    subtotal 				= returnNumber(ventaGTM) + returnNumber(ventaReclu) + returnNumber(bono_manual);
//	    				subtotal 				= returnNumber(_gtm_total_comisiones) + returnNumber(ventaReclu) + returnNumber(_gtm_bono_manual);
//	    				/*if(_gtm_no_ventas_periodo < _cdc_ventas_minimas_para_pago) {
//	    					subtotal -= ventaReclu;*/
//	    					color	  = 'red';
//	    				/*}*/
//	    				if(_gtm_rentener_comp == 'T') {
//	    					subtotal -= _gtm_total_comisiones;
//	    					color	  = 'red';
//	    				}
//
//	    				if(_gtm_pagar_comp == 'F') {
//	    					subtotal = 0;
//	    				}
//	                	retencion 	= 0.0;
//	                	total 		= 0.0;
//	    				var lines					= _icf_tablas_isr.length;
//	    				for(var l=0;l<lines;l++)
//	    				{
//	    					var _tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
//	    					var _tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
//	    					var _tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
//	    					var _tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));
//	    					if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  )
//	    					{
//	    						total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
//	    						break;
//	    					}
//	    				}
//	                    retencion = subtotal-total;
//	                    strName +="<br/><h3>Resumen</h3>";
//	                    strName += "<table width='50%'>";
//	                    strName += "<tr>";
//	                    strName += "<td border='0.5'><b>Concepto</b></td>";
//	                    strName += "<td border='0.5'><b>Importe</b></td>";
//	                    strName += "</tr>";
//
//	                    strName += "<tr>";
//	                    strName += "<td border='0.5' border-style='dotted-narrow'>Ventas Gánate TM</td>";
//	                    strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_gtm_total_comisiones) +"</td>";
//	                    strName += "</tr>";
//	                    strName += "<tr>";
//	                    strName += "<td border='0.5' border-style='dotted-narrow'>Movimientos Manuales</td>";//Bono Manual
//	                    strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_gtm_bono_manual) +"</td>";
//	                    strName += "</tr>";
//						strName += "<tr>";
//			        	strName += "<td border='0.5' border-style='dotted-narrow'><b>BONO DE RECLUTAMIENTO</b></td>";
//			        	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',ventaReclu) +"</td>";
//			        	strName += "</tr>";
//
//			        	strName += "<tr>";
//	                    strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL COMISIONES</b></td>";
//	                    strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$', _gtm_total_comisiones + _gtm_bono_manual + ventaReclu) +"</b></td>";
//	                    strName += "</tr>";
//	                    strName += "<tr>";
//	                    strName += "<td border='0.5' border-style='none' align='right'><b>ISR</b></td>";
//	                    strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('-$',retencion.toFixed(2)) +"</b></td>";
//	                    strName += "</tr>";
//	                    strName += "<tr>";
//	                    strName += "<td border='0.5' border-style='none' align='right'><b>TOTAL A DEPOSITAR</b></td>";
//	                    strName += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$',total.toFixed(2)) +"</b></td>";
//	                    strName += "</tr>";
//	                    strName += "</table>";
//	                    if(z != ids_rec_reclutadora.length-1) {
//	                    	strName += "<div style='page-break-after: always;'></div>";
//	                    }
//	                }
//	            }
//	        }
		} else {
			strName += 'No conciderado...' ;
		}
		nlapiLogExecution('DEBUG', 'strName',strName);
		xml  = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
		xml += "<pdf>";
			xml += "<head>";
				xml += "<macrolist>";
					xml += "<macro id=\"paginas\">";
						xml += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"right\">Página <pagenumber/> de <totalpages/></p>";
					xml += "</macro>";
				xml += "</macrolist>";
			xml += "</head>";
			xml += "<body font='helvetica' font-size='6' footer=\"paginas\" footer-height='2'>";
				xml += strName;
			xml += "</body>\n";
		xml += "</pdf>";
		var file 		= nlapiXMLToPDF( xml );
		var file_name	= _name + ' ' + _ec + ' ' + fc + name + '.pdf';
		var file_value	= file.getValue();

		if(mode == 'imprimir') {
			response.setContentType('PDF',file_name, 'inline');
			response.write(file_value);
		} else {
			var new_file				= nlapiCreateFile(file_name, 'PDF', file_value);
			var cc	= ['facturacion-electronica@mxthermomix.com'];

			//-- Copia a Jefa de Grup;
			if(supervisor){
				var emailsup = nlapiLookupField('employee', supervisor, 'email');
				emailsup?cc.push(emailsup):null;
			}


			var records		 			= new Array();
				records['recordtype'] 	= 'customrecord_imprimir_comosiones';
				records['record'] 		= rec_id;
			var attachments				= new Array();
				attachments.push(new_file);
//			nlapiSendEmail(9638, email, 'Envio: ' + file_name , 'Envio: ' + file_name, cc, null, records,attachments);
			nlapiSendEmail(82370, email, 'Envio: ' + file_name , 'Envio: ' + file_name, cc, null, records,attachments);
			var code 	 = "<script type='text/javascript'>";
				code	+= "window.opener.location.reload();";
			    code	+= "window.close();";
			    code	+= "</script>";
			response.write(code);
		}
	} catch(e) {
    	var tituloFallo		= new String();
    	var mensajeFallo	= new String();
    	var data			= new Object();
    	var identacion		= '<td>&nbsp;</td><td>&nbsp;</td><td>Ã¡ï¿½â€¦</td>';

    	if ( e instanceof nlobjError )  {
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
            nlapiLogExecution( 'ERROR', 'Unexpected Error',JSON.stringify(e) );
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
    	nlapiSetRedirectURL('SUITELET','customscript_imp_rep_com_form_he', 'customdeploy_imp_rep_com_form_he', false, params_handler_error);
    	nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
  	}
}
//--- Helpers ---
//Elimina Valores Duplicados de un Arreglo
function deleteDuplicateElements(array)
{
    var lon = array.length;
    var i =0;
    var resultados = new Array();
    for(var cont=lon-1;cont>0;cont--)
    {
        if(array[cont] != array[cont-1])
         { resultados[i]=array[cont]; i++; }
    }
    resultados[i]=array[0];
    resultados.reverse();
    return resultados;
}
//AÃƒÂ±ade un valor de un arreglo
function pushArrayValue(array,value)
{
    var l = array.length;
    var a = new Array();
    for(var i=0;i<l;i++)
    {
        a[i] = array[i];
    }
    a.push(value);
    return a;
}
//Elimina un valor de un arreglo
function popArrayValue(array,value)
{
    var l = array.length;
    var a = new Array();
    var c =0;
    for(var i=0;i<l;i++)
    {
        if(value != array[i])
        {
            a[c] = array[i];
            c++;
        }
    }
    return a;
}
//Helper, transforma la fecha en letras.
function fecha_letras(fecha)
{
	if(fecha != '' && fecha != null)
	{
	    fecha = fecha.split('/');
	    var n_mes = fecha[0];
	    var n_ano = fecha[1];
	    var l_mes = new String ();
	    var fecha_letras = new String();
	    switch(n_mes)
	    {
	    	case '01': l_mes = 'ENERO'; break;
	        case '02': l_mes = 'FEBRERO'; break;
	        case '03': l_mes = 'MARZO'; break;
	        case '04': l_mes = 'ABRIL'; break;
	        case '05': l_mes = 'MAYO'; break;
	        case '06': l_mes = 'JUNIO'; break;
	        case '07': l_mes = 'JULIO'; break;
	        case '08': l_mes = 'AGOSTO'; break;
	        case '09': l_mes = 'SEPTIEMBRE'; break;
	        case '10': l_mes = 'OCTUBRE'; break;
	        case '11': l_mes = 'NOVIEMBRE'; break;
	        case '12': l_mes = 'DICIEMBRE'; break;
		}
	    fecha_letras = l_mes + ' ' + n_ano;
		return fecha_letras;
	}
	else { return ''; }
}
//helper, convierte las series en un arreglo.
function stringToArray(str,base)
{
     var multiSelectStringArray = str.split(String.fromCharCode(base));
     return multiSelectStringArray;
}
//Helper, elimina los valores nulos.
function returnBlank(value)
{
	if (value == null || value == undefined)
		return '';
	else
		return value;
}
//---
function returnNumber(value)
{
	var parsedValue = parseFloat(value);
	var NEN = isNaN(parsedValue);
	if (NEN == true)
	{
		return 0;
	}
	else
	{
		return parseFloat(value);
	}
}
//Quita el cero del mes
function quitarCeroMes(value)
{
	var fcNonZero = value.split('/');
	if(fcNonZero[0]<10)
	{
		fcNonZero[0] = fcNonZero[0].replace('0','');
	}
	fcNonZero = fcNonZero.join('/');
	return fcNonZero;
}
//---
function currencyFormat(signo,v)
{
	var amt 	= v;
		amt 	= amt.toString();
		amt 	= amt.split('.');
	var amtl 	= amt[0].length;
	var amtt 	= '';
    var n 		= 0;
	for(var a=amtl-1;a>=0; a--)
	{
		if(n==3)
		{
			amtt = amtt + ',' + amt[0].charAt(a); n=1;
		}
		else
		{
			amtt = amtt + amt[0].charAt(a) ; n++;
		}
	}
	var amttt = '';
	for(var a=0;a<=amtt.length;a++)
	{
	    amttt += amtt.charAt(amtt.length-a);
	}
	if(returnBlank(amt[1]) == '')
	{
		return v = signo + amttt + '.00';
	}
	else
	{
		return v = signo + amttt + '.' +amt[1];
	}
}
//---
function encodeBase64(input)
{
	if(input != '')
	{
		var b64array 	= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var base64 		= "";
		var chr1		= "";
		var chr2		= "";
		var chr3 		= "";
		var enc1		= "";
		var enc2		= "";
		var enc3		= "";
		var enc4 		= "";
		var i 			= 0;
		do
		{
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2))
			{
				enc3 = enc4 = 64;
			}else if (isNaN(chr3))
			{
				enc4 = 64;
			}
			base64  = base64  +
			b64array.charAt(enc1) +
			b64array.charAt(enc2) +
			b64array.charAt(enc3) +
			b64array.charAt(enc4);
			chr1 = chr2 = chr3 = "";
			enc1 = enc2 = enc3 = enc4 = "";
		}while (i < input.length);
		return base64;
	}
	else
	{
		return '';
	}
}
//---
function decodeBase64(input) {
	if(input != '') {
		var b64array 	= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var output 		= "";
		var chr1		= "";
		var chr2		= "";
		var chr3 		= "";
		var enc1		= "";
		var enc2		= "";
		var enc3		= "";
		var enc4 		= "";
		var i 			= 0;
		/*/
		var base64test = /[^A-Za-z0-9\+\/\=]/g;
		if (base64test.exec(input))
		{
			$("#message").html("There were invalid base64 characters in the input text.\n" +
			   "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
			   "Expect errors in decoding.");
		} else
		{
			$("#message").html("");
		}
		/*/
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		do  {
			enc1 = b64array.indexOf(input.charAt(i++));
			enc2 = b64array.indexOf(input.charAt(i++));
			enc3 = b64array.indexOf(input.charAt(i++));
			enc4 = b64array.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64)
			{
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64)
			{
				output = output + String.fromCharCode(chr3);
			}
			chr1		= "";
			chr2		= "";
			chr3 		= "";
			enc1		= "";
			enc2		= "";
			enc3		= "";
			enc4 		= "";
		} while (i < input.length);
		return output;
	} else {
		return '';
	}
}

function totalBonos (recordName, fc, id_emp){
	var type = recordName ? recordName: 'customrecord_comisiones_jdg';
	var emplFieldName = 'custrecord_jdg_empleado';
	var compsFieldName = 'custrecord9';
	var fechaFieldName = 'custrecord_jdg_fecha_comision';
	var bonoFieldsName = ['custrecord_jdg_bono_manual','custrecord62','custrecord63','custrecord64','custrecord65', 'custrecord100', 'custrecord101', 'custrecord102', 'custrecord103', 'custrecord104'];

	switch(type){
		case 'customrecord_comisiones_pre': //Presetadora
	    	emplFieldName = 'custrecord_pre_empleado';
			fechaFieldName = 'custrecord_pre_fecha_comision';
			compsFieldName = 'custrecord10';
			bonoFieldsName = ['custrecord_pre_bono_manual','custrecord49','custrecord50','custrecord51','custrecord52', 'custrecord110', 'custrecord111', 'custrecord112', 'custrecord113', 'custrecord114'];
			break;
		case 'customrecord_comisiones_rec': //Reclutadora
	    	emplFieldName = 'custrecord_rec_empleado';
			fechaFieldName = 'custrecord_rec_fecha_comision';
			compsFieldName = 'custrecord11';
			bonoFieldsName = ['custrecord_rec_bono_manual','custrecord76','custrecord77','custrecord78','custrecord79', 'custrecord120', 'custrecord121', 'custrecord122', 'custrecord123', 'custrecord124'];
			break;
		case 'customrecord_comisiones_gtm':
	    	emplFieldName = 'custrecord_gtm_empleado';
			fechaFieldName = 'custrecord_gtm_fecha_comision';
			compsFieldName = 'custrecord12';
	    	bonoFieldsName = ['custrecord_gtm_bono_manual','custrecord58','custrecord59','custrecord60','custrecord61', 'custrecord85', 'custrecord86', 'custrecord87', 'custrecord88', 'custrecord89'];
			break;
	}

	var colsBonos = [new nlobjSearchColumn(bonoFieldsName[0], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[1], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[2], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[3], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[4], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[5], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[6], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[7], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[8], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[9], null, 'sum')];

	var filterBonos = [new nlobjSearchFilter(fechaFieldName, null, 'is', fc), new nlobjSearchFilter('custrecord_conf_principal', compsFieldName, 'is', 'F'),
		new nlobjSearchFilter(emplFieldName, null, 'is', id_emp)];
	var srchBonos = nlapiSearchRecord(type,  null, filterBonos, colsBonos);

	var bono1 = Number(srchBonos[0].getValue(colsBonos[0]));
	var bono2 = Number(srchBonos[0].getValue(colsBonos[1]));
	var bono3 = Number(srchBonos[0].getValue(colsBonos[2]));
	var bono4 = Number(srchBonos[0].getValue(colsBonos[3]));
	var bono5 = Number(srchBonos[0].getValue(colsBonos[4]));
	var bono6 = Number(srchBonos[0].getValue(colsBonos[5]));
	var bono7 = Number(srchBonos[0].getValue(colsBonos[6]));
	var bono8 = Number(srchBonos[0].getValue(colsBonos[7]));
	var bono9 = Number(srchBonos[0].getValue(colsBonos[8]));
	var bono10= Number(srchBonos[0].getValue(colsBonos[9]));

	return (bono1 + bono2 + bono3 + bono4 + bono5 + bono6 + bono7 + bono8 + bono9 + bono10);
}

function calcBonos (recordName, fc, id_emp){
	var type = recordName ? recordName: 'customrecord_comisiones_jdg';
	var emplFieldName = 'custrecord_jdg_empleado';
	var compsFieldName = 'custrecord9';
	var fechaFieldName = 'custrecord_jdg_fecha_comision';
	var bonoFieldsName = ['custrecord_jdg_bono_manual','custrecord62','custrecord63','custrecord64','custrecord65', 'custrecord100', 'custrecord101', 'custrecord102', 'custrecord103', 'custrecord104'];
	var bonoFieldsLabel = ['custrecord66','custrecord67','custrecord68','custrecord69','custrecord70', 'custrecord95', 'custrecord96', 'custrecord97', 'custrecord98', 'custrecord99'];

	switch(type){
		case 'customrecord_comisiones_pre': //Presetadora
	    	emplFieldName = 'custrecord_pre_empleado';
			fechaFieldName = 'custrecord_pre_fecha_comision';
			compsFieldName = 'custrecord10';
			bonoFieldsName = ['custrecord_pre_bono_manual','custrecord49','custrecord50','custrecord51','custrecord52', 'custrecord110', 'custrecord111', 'custrecord112', 'custrecord113', 'custrecord114'];
			bonoFieldsLabel = ['custrecord48','custrecord53','custrecord54','custrecord55','custrecord56', 'custrecord105', 'custrecord106', 'custrecord107', 'custrecord108', 'custrecord109'];
			break;
		case 'customrecord_comisiones_rec': //Reclutadora
	    	emplFieldName = 'custrecord_rec_empleado';
			fechaFieldName = 'custrecord_rec_fecha_comision';
			compsFieldName = 'custrecord11';
			bonoFieldsName = ['custrecord_rec_bono_manual','custrecord76','custrecord77','custrecord78','custrecord79', 'custrecord120', 'custrecord121', 'custrecord122', 'custrecord123', 'custrecord124'];
			bonoFieldsLabel = ['custrecord80','custrecord81','custrecord82','custrecord83','custrecord84', 'custrecord115', 'custrecord116', 'custrecord117', 'custrecord118', 'custrecord119'];
			break;
		case 'customrecord_comisiones_gtm':
	    	emplFieldName = 'custrecord_gtm_empleado';
			fechaFieldName = 'custrecord_gtm_fecha_comision';
			compsFieldName = 'custrecord12';
	    	bonoFieldsName = ['custrecord_gtm_bono_manual','custrecord58','custrecord59','custrecord60','custrecord61', 'custrecord85', 'custrecord86', 'custrecord87', 'custrecord88', 'custrecord89'];
	    	bonoFieldsLabel = ['custrecord71','custrecord72','custrecord73','custrecord74','custrecord75', 'custrecord90', 'custrecord91', 'custrecord92', 'custrecord93', 'custrecord94'];
			break;
	}

	var colsBonos = [new nlobjSearchColumn(bonoFieldsName[0], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[1], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[2], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[3], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[4], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[5], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[6], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[7], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[8], null, 'sum'),
		new nlobjSearchColumn(bonoFieldsName[9], null, 'sum')];

	var filterBonos = [new nlobjSearchFilter(fechaFieldName, null, 'is', fc), new nlobjSearchFilter('custrecord_conf_principal', compsFieldName, 'is', 'F'),
		new nlobjSearchFilter(emplFieldName, null, 'is', id_emp)];
	var srchBonos = nlapiSearchRecord(type,  null, filterBonos, colsBonos);


	//-- Obtiene etiquetas de bonos del acumulador principal
	var filtersForLabel = [new nlobjSearchFilter(fechaFieldName, null, 'is', fc), new nlobjSearchFilter('custrecord_conf_principal', compsFieldName, 'is', 'T'),
		new nlobjSearchFilter(emplFieldName, null, 'is', id_emp)];

	var colsLabelBonos = [new nlobjSearchColumn(bonoFieldsLabel[0]),
		new nlobjSearchColumn(bonoFieldsLabel[1]),
		new nlobjSearchColumn(bonoFieldsLabel[2]),
		new nlobjSearchColumn(bonoFieldsLabel[3]),
		new nlobjSearchColumn(bonoFieldsLabel[4]),
		new nlobjSearchColumn(bonoFieldsLabel[5]),
		new nlobjSearchColumn(bonoFieldsLabel[6]),
		new nlobjSearchColumn(bonoFieldsLabel[7]),
		new nlobjSearchColumn(bonoFieldsLabel[8]),
		new nlobjSearchColumn(bonoFieldsLabel[9])];
	var srchAcumuladorBonos = nlapiSearchRecord(type,  null, filtersForLabel, colsLabelBonos);
	var acumulador = srchAcumuladorBonos ? srchAcumuladorBonos[0]: null;

	var bono1 = {valor: Number(srchBonos[0].getValue(colsBonos[0])), label: acumulador? acumulador.getText(bonoFieldsLabel[0]) || 'Bono 1' : 'Bono 1'};
	var bono2 = {valor: Number(srchBonos[0].getValue(colsBonos[1])), label: acumulador? acumulador.getText(bonoFieldsLabel[1]) || 'Bono 2' : 'Bono 2'};
	var bono3 = {valor: Number(srchBonos[0].getValue(colsBonos[2])), label: acumulador? acumulador.getText(bonoFieldsLabel[2]) || 'Bono 3' : 'Bono 3'};
	var bono4 = {valor: Number(srchBonos[0].getValue(colsBonos[3])), label: acumulador? acumulador.getText(bonoFieldsLabel[3]) || 'Bono 4' : 'Bono 4'};
	var bono5 = {valor: Number(srchBonos[0].getValue(colsBonos[4])), label: acumulador? acumulador.getText(bonoFieldsLabel[4]) || 'Bono 5' : 'Bono 5'};
	var bono6 = {valor: Number(srchBonos[0].getValue(colsBonos[5])), label: acumulador? acumulador.getText(bonoFieldsLabel[5]) || 'Bono 6' : 'Bono 6'};
	var bono7 = {valor: Number(srchBonos[0].getValue(colsBonos[6])), label: acumulador? acumulador.getText(bonoFieldsLabel[6]) || 'Bono 7' : 'Bono 7'};
	var bono8 = {valor: Number(srchBonos[0].getValue(colsBonos[7])), label: acumulador? acumulador.getText(bonoFieldsLabel[7]) || 'Bono 8' : 'Bono 8'};
	var bono9 = {valor: Number(srchBonos[0].getValue(colsBonos[8])), label: acumulador? acumulador.getText(bonoFieldsLabel[8]) || 'Bono 9' : 'Bono 9'};
	var bono10= {valor: Number(srchBonos[0].getValue(colsBonos[9])), label: acumulador? acumulador.getText(bonoFieldsLabel[9]) || 'Bono 10' : 'Bono 10'};

	var _BONOS = {
		bono1: bono1,
		bono2: bono2,
		bono3: bono3,
		bono4: bono4,
		bono5: bono5,
		bono6: bono6,
		bono7: bono7,
		bono8: bono8,
		bono9: bono9,
		bono10: bono10,
		bonoTotal: bono1.valor + bono2.valor + bono3.valor + bono4.valor + bono5.valor + bono6.valor + bono7.valor + bono8.valor + bono9.valor + bono10.valor ,
	};

	var  strName ="<br/><h3 align='center'>Movimientos Manuales</h3>";
	strName += "<table width='670px'>";
	strName += "<tr>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono1.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono2.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono3.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono4.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono5.label) + "</b></td>";
	strName += "</tr>";
	strName += "<tr>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$', _BONOS.bono1.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono2.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono3.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono4.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono5.valor) + "</td>";
	strName += "</tr>";
	strName += "</table>";

	strName +="<br/>";
	strName += "<table width='670px'>";
	strName += "<tr>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono6.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono7.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono8.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono9.label) + "</b></td>";
	strName += "<td border='0.5'><b>" + nlapiEscapeXML(_BONOS.bono10.label) + "</b></td>";
	strName += "<td border='0.5'><b>Total <br/>Movimientos manuales</b></td>";
	strName += "</tr>";
	strName += "<tr>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono6.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono7.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono8.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono9.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',_BONOS.bono10.valor) + "</td>";
	strName += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',_BONOS.bonoTotal) +"</td>";
	strName += "</tr>";
	strName += "</table>";

	return strName;
}
