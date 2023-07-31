function mostrarDetalleComisiones(type, form, request) {
	var Base64		= new MainBase64();
	var titleForm	= 'Impresi�n de Compensaciones';

	try {
		var recordType		= nlapiGetRecordType();
		var recordId		= nlapiGetRecordId();
		var rec 			= nlapiLoadRecord(recordType,recordId);
		var fc 				= rec.getFieldValue('custrecord_fecha_comision');
//		var fcAux 			= fc.split('/');
		
		var fcAux = nlapiSearchRecord('customrecord_periods', null, ['name', 'is', fc],new nlobjSearchColumn('custrecord_calendario'))[0].getValue('custrecord_calendario');
		nlapiLogExecution('DEBUG', 'fcAux', fcAux);
		
		var ec 				= rec.getFieldValue('custrecord_elegir_comision');
		var pre_filters 	= [];
		var pre_columns 	= [];
		var pre_resultsJDG	= [];
		var pre_resultsPRE 	= [];
		var pre_resultsGTM 	= [];
		var pre_x			= 0;
		var pre_y			= 0;
		var pre_lonJDG		= 0;
		var pre_lonPRE		= 0;
		var pre_lonGTM		= 0;
		var b 				= new Boolean();
		var pre_IDS 		= '';
		var currentURL		= request.getURL();
		var index 			= currentURL.indexOf("/app");
		var host		  	= currentURL.substring(0, index);
		var url 			= nlapiResolveURL("SUITELET", "customscript_imp_rep_com_pdf", "customdeploy_imp_rep_com_pdf", null);
		
		if(ec == 1) {
			pre_filters[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision',null, 'is', fc);
			pre_resultsJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, pre_filters, null));			

			if(pre_resultsJDG != '') {
				pre_lonJDG = pre_resultsJDG.length;
				for(pre_x=0;pre_x<pre_lonJDG;pre_x++)  {
					pre_IDS += pre_resultsJDG[pre_x].getId() + String.fromCharCode(64);
				}
				nlapiSubmitField(recordType,recordId,'custrecord_enlace_detalle_id',pre_IDS);
			}
		} else if(ec == 2) {
			pre_filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
			pre_columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
			pre_resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, pre_filters, pre_columns));
			pre_filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
			pre_resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, pre_filters, null));

			if(pre_resultsPRE != '') {
				pre_lonPRE = pre_resultsPRE.length;
				for(pre_x=0;pre_x<pre_lonPRE;pre_x++) {
					pre_IDS += pre_resultsPRE[pre_x].getId() + String.fromCharCode(64);
				}
				nlapiSubmitField(recordType,recordId,'custrecord_enlace_detalle_id',pre_IDS);
			}
		} else if(ec == 4) {
			pre_filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
			pre_columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
			pre_resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, pre_filters, pre_columns));
			pre_filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
			pre_columns[0] = new nlobjSearchColumn('custrecord_pre_empleado');
			pre_resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, pre_filters, pre_columns));

			if(pre_resultsGTM != '') {
				pre_lonGTM = pre_resultsGTM.length;
				pre_lonPRE = pre_resultsPRE.length;

				for(pre_x=0;pre_x<pre_lonGTM;pre_x++) {
					for(pre_y=0;pre_y<pre_lonPRE;pre_y++) {
						if(pre_resultsPRE[pre_y].getValue('custrecord_pre_empleado') == pre_resultsGTM[pre_x].getValue('custrecord_gtm_empleado')) { 
							b = true; 
							break;
						} else {
							b = false; 
						}
					}

					if(b == false) { 
						pre_IDS += pre_resultsGTM[pre_x].getId() + String.fromCharCode(64); 
					}
				}

				if(pre_IDS != '') {
					nlapiSubmitField(recordType,recordId,'custrecord_enlace_detalle_id',pre_IDS);
				}
			}
		}

//		var recordConfComp = nlapiLoadRecord('customrecord_conf_de_compensaciones', 1);
//		var _cdc_articulos_permitidos 		= returnBlank(recordConfComp.getFieldValues('custrecord_cdc_articulos_permitidos'));
//		var _cdc_ventas_minimas_para_pago 	= returnNumber(recordConfComp.getFieldValue('custrecord_cdc_ventas_minimas_para_pago'));
		/*/
		var _cdc_tipos_de_venta_permitido 	= returnBlank(recordConfComp.getFieldValues('custrecord_cdc_tipos_de_venta_permitido'));
		var _cdc_ventas_minimas_txtm 		= returnNumber(recordConfComp.getFieldValue('custrecord_cdc_ventas_minimas_txtm'));
		var _cdc_ventas_maximas_rec 		= returnNumber(recordConfComp.getFieldValue('custrecord_cdc_ventas_maximas_rec'));
		/*/
		var filtersICF_REP = [new nlobjSearchFilter('custrecord_relacion_equipo_propias_c_c', null, 'is', 1)];
		var _icf_rel_equipo_propias = returnBlank(nlapiSearchRecord('customrecord_relacion_equipo_propias', 'customsearch_icf_rel_equipo_propias', filtersICF_REP, null));
//		var filtersICF_TISR		  	= [new nlobjSearchFilter('custrecord_year','custrecord_tablas_isr_calendario_vowerk', 'equalto', fcAux[1])];
		var filtersICF_TISR		  	= [new nlobjSearchFilter('custrecord_tablas_isr_calendario_vowerk', null, 'is', fcAux)];
		var _icf_tablas_isr			= returnBlank(nlapiSearchRecord('customrecord_tablas_isr', 'customsearch_icf_tablas_isr', filtersICF_TISR, null));		
		var detalleComisionesSublist= form.addSubList('custpage_detalle_comisiones', 'inlineeditor', 'Detalle','custom46');
		detalleComisionesSublist.setDisplayType('normal');

		var filters 		 = [];
		var columns 		 = [];
		var resultsREC 		 = [];
		var resultsGTM 		 = [];
		var ids_rec_com_skip = [];
		var ids_non 	= []; 	
		var colorReclu  = '#000000';
		var color       = '#000000';	
		var x			= 0;
		var y			= 0;
		var i			= 0;
		var l			= 0;
		var	lon			= 0;
		var resultados 	= [];
		var resultadosAux = [];
		var contR  		= 0;
		var cont 		= 0;
		var linea 		= 0;
		var skip  		= 0;
		var ventaGTM 	= 0;
		var ventaReclu 	= 0;
		var pm_Equipo 	= 0;
		var pm_GTM 		= 0;
		var retencion 	= 0;
		var total 		= 0;
		var subtotal 	= 0;
		var ids_rec_com_non_skip 			= '';
		var _numcta 		= '';
		var nomEmp 		= '';
		var searchString = '';
		var searchIndex 	= 0;
		var ventaRecluT 	= '';
		var bonoManualT 	= '';
		var num_emp 		= '';
		var lines 		= 0;
		var lineNumber  	= new Number();
		var _tablas_isr_limite_inferior 	= 0;
		var _tablas_isr_limite_superior 	= 0;
		var _tablas_isr_cuota_fija 			= 0;
		var _tablas_isr_porc_limite_inferi 	= 0;
		var data 		= {};
		var urlSUITELET 	= nlapiResolveURL("SUITELET", "customscript_fe_sf_st_files", "customdeploy_fe_sf_st_files", false);
		var ids = stringToArray(rec.getFieldValue('custrecord_enlace_detalle_id'),64);
		ids.pop();
		
		if(ec == 1) {
			detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			detalleComisionesSublist.addField('custpage_det_comision', 'select', 'Compensaci�n','customrecord_comisiones_jdg');
//			detalleComisionesSublist.addField('custpage_det_conf_com', 'select', 'Conf. CompensaciÃ³n','customrecord_conf_de_compensaciones');
			detalleComisionesSublist.addField('custpage_det_internal_id_empleado', 'text', 'Internal ID Jefa de Grupo').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_numero_empleado', 'text', 'ID Jefa de Grupo').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado_text', 'text', 'Jefa de Grupo').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_numero_cuenta', 'text', 'Cuenta').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado', 'text', 'Jefa de Grupo');
			detalleComisionesSublist.addField('custpage_det_email_empleado', 'text', 'Email Jefa de Grupo').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_bono_manual', 'text', 'Bono Manual');
			detalleComisionesSublist.addField('custpage_det_venta_propia', 'text', 'Venta Propia');
          	detalleComisionesSublist.addField('custpage_det_bono_propia', 'currency', 'Bono Venta Propia');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia', 'text', 'Puesta en Marcha (Propia)');//.setDisplayType('hidden');;
			detalleComisionesSublist.addField('custpage_det_venta_propia_especial', 'text', 'Venta Propia Especial');
			detalleComisionesSublist.addField('custpage_det_venta_equipo', 'text', 'Venta Equipo');
			detalleComisionesSublist.addField('custpage_det_puesta_bono_equipo', 'text', 'Bono Equipo');
			detalleComisionesSublist.addField('custpage_det_reclutamiento', 'text', 'Reclutamiento');
			detalleComisionesSublist.addField('custpage_det_subtotal', 'text', 'Sub-Total');
			detalleComisionesSublist.addField('custpage_det_retencion', 'text', 'Retencion');
			detalleComisionesSublist.addField('custpage_det_total', 'text', 'Total');
			detalleComisionesSublist.addField('custpage_det_cod_respuesta', 'text', 'Codigo de Respuesta');
			detalleComisionesSublist.addField('custpage_det_men_respuesta', 'text', 'Mensaje de Respuesta');
			detalleComisionesSublist.addField('custpage_det_xml_sat', 'url', 'XML - SAT').setLinkText('Ver');
			detalleComisionesSublist.addField('custpage_det_pdf', 'url', 'PDF').setLinkText('Ver');
			detalleComisionesSublist.addField('custpage_det_imprimir', 'url', 'Imprimir').setLinkText('Imprimir');
			detalleComisionesSublist.addField('custpage_det_enviar', 'url', 'Enviar').setLinkText('Enviar');
			detalleComisionesSublist.addField('custpage_det_enviar_aux', 'textarea', 'Data Enviar').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_subtotal_currency', 'currency', 'Sub-Total').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_retencion_currency', 'currency', 'Retencion').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_total_currency', 'currency', 'Total').setDisplayType('hidden');

			filters[0] = new nlobjSearchFilter('custrecord_jdg_fecha_comision','custrecord_jdg_det_comision_jdg_id', 'is', fc);
//			filters[1]  = new nlobjSearchFilter('item','custrecord_jdg_det_factura', 'anyof', _cdc_articulos_permitidos);

			columns[0]  = new nlobjSearchColumn('custrecord_jdg_nombre_empleado','custrecord_jdg_det_comision_jdg_id').setSort(true);

			resultsJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg_det', 'customsearch_ss_jdg_det', filters, columns));

			filters[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			filters[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',2);
			filters[3] = new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',3);
          	filters[4] = new nlobjSearchFilter('custrecord_conf_principal','custrecord11','is','T');

			columns[0] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
			columns[1] = new nlobjSearchColumn('custrecord_rec_empleado');
			columns[2] = new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
			columns[3] = new nlobjSearchColumn('custrecord_rec_categoria_empleado');
			columns[4]  = new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
			columns[5]  = new nlobjSearchColumn('custentity_numcta','custrecord_rec_reclutadora');

			resultsREC  = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));

			var line = 0;
			var filtersDataJDG			= [];
			var columnsDataJDG			= [];
			var resultsDataJDG			= [];
			var data_imprimir_jdg		= {};
			var data_enviar_jdg			= {};
			var data_enviar_aux_jdg		= {};
			var url_imprimir_jdg		= '';
			var url_enviar_jdg			= '';
			var _id_empleado_jdg		= '';
			var _email_empleado_jdg		= '';
			colorReclu	 				= '#000000';

			filtersDataJDG[0]			= new nlobjSearchFilter('internalid', null, 'anyof', ids);
			filtersDataJDG[1]			= new nlobjSearchFilter('custrecord_jdg_fecha_comision',null, 'is', fc);
			filtersDataJDG[2]			= new nlobjSearchFilter('custrecord_conf_principal','custrecord9', 'is', 'T');
			
			columnsDataJDG[0]			= new nlobjSearchColumn('custrecord_jdg_total_bono_manual');//'custrecord_jdg_bono_manual');
			columnsDataJDG[1]			= new nlobjSearchColumn('custrecord_jdg_no_ventas_equipo');
			columnsDataJDG[2] 			= new nlobjSearchColumn('custrecord_jdg_total_comisiones_equipo');
			columnsDataJDG[3] 			= new nlobjSearchColumn('custrecord_jdg_no_ventas_propio');
			columnsDataJDG[4] 			= new nlobjSearchColumn('custrecord_jdg_total_comisiones_propio');//'custrecord_jdg_compensacion_propio');
			columnsDataJDG[5] 			= new nlobjSearchColumn('custrecord_jdg_entrega_propio');
			columnsDataJDG[6] 			= new nlobjSearchColumn('custrecord_jdg_total_comisiones_propio');
			columnsDataJDG[7] 			= new nlobjSearchColumn('custentity_promocion','custrecord_jdg_empleado');
			columnsDataJDG[8] 			= new nlobjSearchColumn('custentity_numcta','custrecord_jdg_empleado');
			columnsDataJDG[9] 			= new nlobjSearchColumn('custrecord_jdg_empleado');
			columnsDataJDG[10] 			= new nlobjSearchColumn('custrecord_jdg_nombre_empleado');
			columnsDataJDG[11] 			= new nlobjSearchColumn('custrecord_jdg_pagar_compensaciones');
			columnsDataJDG[12] 			= new nlobjSearchColumn('custrecord_jdg_codigo_respuesta');
			columnsDataJDG[13] 			= new nlobjSearchColumn('custrecord_jdg_mensaje_respuesta');
			columnsDataJDG[14] 			= new nlobjSearchColumn('custrecord_jdg_xml_sat');
			columnsDataJDG[15] 			= new nlobjSearchColumn('custrecord_jdg_pdf');
			columnsDataJDG[16] 			= new nlobjSearchColumn('custrecord_jdg_compensacion_especial');
			columnsDataJDG[17] 			= new nlobjSearchColumn('email','custrecord_jdg_empleado');
          	columnsDataJDG[18] 			= new nlobjSearchColumn('custrecord_jdg_bono_propio');
//			columnsDataJDG[18] = new nlobjSearchColumn('custrecord9');
//			columnsDataJDG[19] = new nlobjSearchColumn('custrecord_cdc_ventas_minimas_para_pago','custrecord9');

			resultsDataJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersDataJDG, columnsDataJDG));

			for(i=0;i<resultsDataJDG.length;i++){
				
//				nlapiLogExecution('DEBUG', i, ids[i] + ' - ' + resultsDataJDG[i].getId());
				
				//--Busca el id correspondinente al arreglo
				var iId = 0;
				for(; iId < ids.length; iId++) {
					if(ids[iId] == resultsDataJDG[i].getId()){
						break;
					}
				}
//				nlapiLogExecution('DEBUG', i, ids[iId] + ' - ' + resultsDataJDG[i].getId());
				
//				var cdc	= resultsDataJDG[i].getValue(columnsDataJDG[18]);
				var _cdc_ventas_minimas_para_pago 	= 1;//returnNumber(resultsDataJDG[i].getValue(columnsDataJDG[19]));
				var _jdg_bono_manual 				= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_total_bono_manual'));//'custrecord_jdg_bono_manual'));
				//var _jdg_no_ventas_equipo 		= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_no_ventas_equipo'));
				var _jdg_total_comisiones_equipo 	= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_total_comisiones_equipo'));
				var _jdg_no_ventas_propio 			= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_no_ventas_propio'));
              	var _jdg_bono_propio = Number(resultsDataJDG[i].getValue('custrecord_jdg_bono_propio'));
				var _jdg_compensacion_propio 		= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_total_comisiones_propio'));//'custrecord_jdg_compensacion_propio'));
				var _jdg_entrega_propio 			= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_entrega_propio'));
				var _jdg_total_comisiones_propio 	= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_total_comisiones_propio'));
				var _jdg_empleado  = returnBlank(resultsDataJDG[i].getValue('custrecord_jdg_empleado'));
				var _jdg_nombre_empleado 			= returnBlank(resultsDataJDG[i].getValue('custrecord_jdg_nombre_empleado'));
				var _jdg_pagar_compensaciones		= returnFalse(resultsDataJDG[i].getValue('custrecord_jdg_pagar_compensaciones'));
				_numcta  		= returnBlank(resultsDataJDG[i].getValue('custentity_numcta','custrecord_jdg_empleado'));
				var _jdg_codigo_respuesta			= returnBlank(resultsDataJDG[i].getValue('custrecord_jdg_codigo_respuesta'));
				var _jdg_mensaje_respuesta			= returnBlank(resultsDataJDG[i].getValue('custrecord_jdg_mensaje_respuesta'));
				var _jdg_xml_sat = returnBlank(resultsDataJDG[i].getValue('custrecord_jdg_xml_sat'));
				var _jdg_pdf 	= returnBlank(resultsDataJDG[i].getValue('custrecord_jdg_pdf'));
				var _jdg_compensacion_especial		= returnNumber(resultsDataJDG[i].getValue('custrecord_jdg_compensacion_especial'));
				var _jdg_email_empleado				= returnBlank(resultsDataJDG[i].getValue('email','custrecord_jdg_empleado'));
				var _jdg_xml_sat_url				= '';
				var _jdg_pdf_url = '';

				if(_jdg_xml_sat != '') {
					data			= {};
					data.fileID     = _jdg_xml_sat;
					data.titleForm	= "XML - SAT";
					data			= JSON.stringify(data);
					data	    	= Base64.encode(data);
					_jdg_xml_sat_url	= host + urlSUITELET 	+ "&data=" 	+ data;
				}

				if(_jdg_pdf != '') {
					data			= {};
					data.fileID     = _jdg_pdf;
					data.titleForm	= "PDF";
					data			= JSON.stringify(data);
					data	    	= Base64.encode(data);
					_jdg_pdf_url		= host + urlSUITELET 	+ "&data=" 	+ data;
				}

				searchString = '<?xml ';
				searchIndex 	= _jdg_mensaje_respuesta.search(searchString);

				if(searchIndex != -1) {
					searchIndex = searchIndex - 2;
					_jdg_mensaje_respuesta   = _jdg_mensaje_respuesta.substring(0,searchIndex);
					_jdg_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				if(_jdg_mensaje_respuesta >= 4000) {
					_jdg_mensaje_respuesta 	= _jdg_mensaje_respuesta.substring(0,3987);
					_jdg_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				ventaReclu = 0;		

				for(x=0;x<resultsREC.length;x++) {
					if(resultsREC[x].getValue('custrecord_rec_reclutadora') == _jdg_empleado) {
						ventaReclu 				+= returnNumber(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
						ids_rec_com_skip[skip] 	 = resultsREC[x].getId();
						skip++;
					}
				}

				lines = _icf_rel_equipo_propias.length;
				var relacionPorcentaje	 	= 0;
				for(l =0;l<lines;l++) {
					var _relacion_equipo_propias_desde 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_desde'));
					var _relacion_equipo_propias_hasta 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_hasta'));
					var _relacion_equipo_propias_porc 	= returnNumber(_icf_rel_equipo_propias[l].getValue('custrecord_relacion_equipo_propias_porc'));

					if(_relacion_equipo_propias_desde <= _jdg_no_ventas_propio  && _jdg_no_ventas_propio <= _relacion_equipo_propias_hasta) {
						relacionPorcentaje 			  = returnNumber(_relacion_equipo_propias_porc);
						relacionPorcentaje 			 /= 100;
						_jdg_total_comisiones_equipo *= relacionPorcentaje;
						break;
					}
				}
				subtotal 	= returnNumber(_jdg_total_comisiones_propio) + returnNumber(_jdg_total_comisiones_equipo) + returnNumber(pm_Equipo) + returnNumber(ventaReclu) + returnNumber(_jdg_bono_manual) + _jdg_bono_propio + _jdg_entrega_propio;

				if(_jdg_no_ventas_propio < _cdc_ventas_minimas_para_pago) {
					subtotal -= ventaReclu;
					colorReclu	  = 'red';
				} else {
					colorReclu	 = '#000000';
				}

				if(_jdg_pagar_compensaciones == 'F') {
					subtotal = 0;
				}

				retencion 	= 0.0;
				total 		= 0.0;        
				lines		= _icf_tablas_isr.length;

				for(l =0;l<lines;l++) {
					_tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
					_tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
					_tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
					_tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));

					if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  ) {
						total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
						break;
					}
				}
				ventaRecluT	= currencyFormat(ventaReclu,2);
				ventaRecluT	= ventaRecluT.toString();
				ventaRecluT = ventaRecluT.fontcolor(colorReclu);
				bonoManualT	= currencyFormat(_jdg_bono_manual,2);
				bonoManualT	= bonoManualT.toString();
				//bonoManualT = bonoManualT.fontcolor(color);
				retencion	= subtotal - total;
				subtotal	= returnNumber(subtotal);
				retencion	= returnNumber(retencion);
				total		= returnNumber(total);
				num_emp 	 	= stringToArray(_jdg_nombre_empleado, 32);
				lineNumber  	= new Number(line + 1);
				lineNumber.toString();

				if(_jdg_mensaje_respuesta.length >= 300) {
					_jdg_mensaje_respuesta 	= _jdg_mensaje_respuesta.substring(0,285);
					_jdg_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				data_imprimir_jdg = {};
				data_imprimir_jdg.ec				= ec;
				data_imprimir_jdg.fc				= fc;
				data_imprimir_jdg.ids	    		= ids[iId] + "@";
				data_imprimir_jdg.mode				= 'imprimir';
				data_imprimir_jdg.id_emp	  		= _jdg_empleado;
				data_imprimir_jdg.name				= _jdg_nombre_empleado;
				data_imprimir_jdg = JSON.stringify(data_imprimir_jdg);
				data_imprimir_jdg = Base64.encode(data_imprimir_jdg);

				url_imprimir_jdg = url + "&data=" + data_imprimir_jdg;

				data_enviar_jdg 	= {};
				data_enviar_jdg.ec = ec;
				data_enviar_jdg.fc				    = fc;
				data_enviar_jdg.ids	    			= ids[iId] + "@";
				data_enviar_jdg.mode				= 'enviar';
				data_enviar_jdg.id_emp				= _jdg_empleado;
				data_enviar_jdg.rec_id				= recordId;
				data_enviar_jdg 	= JSON.stringify(data_enviar_jdg);
				data_enviar_jdg 	= Base64.encode(data_enviar_jdg);

				url_enviar_jdg 	= (_jdg_email_empleado != '') ? (url + "&data=" + data_enviar_jdg):'';

				data_enviar_aux_jdg = {};
				data_enviar_aux_jdg.ec				= ec;
				data_enviar_aux_jdg.fc				= fc;
				data_enviar_aux_jdg.ids	    		= ids[iId] + "@";
				data_enviar_aux_jdg.mode			= 'enviar';
				data_enviar_aux_jdg.id_emp			= _jdg_empleado;
				data_enviar_aux_jdg.rec_id			= recordId;
				data_enviar_aux_jdg = JSON.stringify(data_enviar_aux_jdg);
				data_enviar_aux_jdg = Base64.encode(data_enviar_aux_jdg);
				data_enviar_aux_jdg = (_jdg_email_empleado != '') ? data_enviar_aux_jdg:'';

				detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
				detalleComisionesSublist.setLineItemValue('custpage_det_comision', i+1, ids[iId]);
//				detalleComisionesSublist.setLineItemValue('custpage_det_conf_com', i+1, cdc);
				detalleComisionesSublist.setLineItemValue('custpage_det_internal_id_empleado', i+1,_jdg_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', i+1, num_emp[0]);
				detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado_text', i+1,_jdg_nombre_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_numero_cuenta', i+1,_numcta);
				detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', i+1, _jdg_nombre_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_email_empleado', i+1,_jdg_email_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', i+1,bonoManualT);
				detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', i+1,currencyFormat(_jdg_compensacion_propio,2));
                detalleComisionesSublist.setLineItemValue('custpage_det_bono_propia', i+1, _jdg_bono_propio);
				detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', i+1, currencyFormat(_jdg_entrega_propio,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia_especial', i+1, currencyFormat(_jdg_compensacion_especial,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_venta_equipo', i+1,currencyFormat(_jdg_total_comisiones_equipo,2)); 
				detalleComisionesSublist.setLineItemValue('custpage_det_puesta_bono_equipo', i+1, currencyFormat(pm_Equipo,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', i+1, ventaRecluT);
				detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', i+1, currencyFormat(subtotal,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_retencion', i+1, currencyFormat(retencion,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_total', i+1, currencyFormat(total,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_cod_respuesta', i+1, _jdg_codigo_respuesta);
				detalleComisionesSublist.setLineItemValue('custpage_det_men_respuesta', i+1, _jdg_mensaje_respuesta);
				detalleComisionesSublist.setLineItemValue('custpage_det_xml_sat', i+1, _jdg_xml_sat_url);
				detalleComisionesSublist.setLineItemValue('custpage_det_pdf', i+1, _jdg_pdf_url);
				detalleComisionesSublist.setLineItemValue('custpage_det_subtotal_currency', i+1, subtotal);
				detalleComisionesSublist.setLineItemValue('custpage_det_retencion_currency', i+1, retencion);
				detalleComisionesSublist.setLineItemValue('custpage_det_total_currency', i+1, total);
				detalleComisionesSublist.setLineItemValue('custpage_det_imprimir', i+1, url_imprimir_jdg);
				detalleComisionesSublist.setLineItemValue('custpage_det_enviar', i+1, url_enviar_jdg);
				detalleComisionesSublist.setLineItemValue('custpage_det_enviar_aux', i+1, data_enviar_aux_jdg);
				line++;
			}

			if(ids_rec_com_skip.length != resultsREC.length) {nlapiLogExecution('DEBUG', 'linea', linea);
				linea 			= detalleComisionesSublist.getLineItemCount()+1;
                
                if(linea <= 0){
					linea = 1;
				}
                                                              
				nlapiLogExecution('DEBUG', 'linea', linea);
				ids_rec_com_skip.sort();
				lon				= ids_rec_com_skip.length;
				i 				= 0;
				resultados 		= [];
				resultadosAux 	= [];
				contR 			= 0;

				for(cont=lon-1;cont>0;cont--){
					if(ids_rec_com_skip[cont] != ids_rec_com_skip[cont-1]){ 
						resultados[i] = ids_rec_com_skip[cont]; 
						i++; 
					}	             
				}

				resultados[i]		= ids_rec_com_skip[0];
				resultados.reverse();
				ids_rec_com_skip 	= resultados;

				for(x=0;x<resultsREC.length;x++) {
					ids_rec_com_non_skip += resultsREC[x].getId()+String.fromCharCode(64);
				}

				for(i=0; i<ids_rec_com_skip.length;i++) {
					ids_rec_com_non_skip = ids_rec_com_non_skip.split((ids_rec_com_skip[i]+'@'));
					ids_rec_com_non_skip = ids_rec_com_non_skip.join('');
				}

				ids_rec_com_non_skip = ids_rec_com_non_skip.split('@');
				ids_rec_com_non_skip.pop();

				if(ids_rec_com_non_skip.length != 0) {
					for(y=0;y<ids_rec_com_non_skip.length;y++) {
						for(x=0;x<resultsREC.length;x++) {
							if(resultsREC[x].getId() == ids_rec_com_non_skip[y]) {
								resultadosAux[contR] = resultsREC[x];
								contR++;
							}
						}
					}

					lon = resultadosAux.length;
					i 	= 0;
					resultados 	= [];

					for(cont=lon-1;cont>0;cont--) {
						if(resultadosAux[cont].getValue('custrecord_rec_reclutadora') != resultadosAux[cont-1].getValue('custrecord_rec_reclutadora')) { 
							resultados[i]=resultadosAux[cont].getValue('custrecord_rec_reclutadora'); 
							i++; 
						}	             
					}

					resultados[i] = resultadosAux[0].getValue('custrecord_rec_reclutadora');
					resultados.reverse();

					for(y=0;y<resultados.length;y++) {
						_jdg_no_ventas_propio 	= 0;
						ventaReclu 				= 0;
						nomEmp  = '';
						_numcta = '';
						for(x=0;x<resultsREC.length;x++) {
							if(resultsREC[x].getValue('custrecord_rec_reclutadora') == resultados[y]) {
								ventaReclu 		  += returnNumber(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
								nomEmp 				= resultsREC[x].getText('custrecord_rec_reclutadora');
								_id_empleado_jdg  	= resultsREC[x].getValue('custrecord_rec_reclutadora');
								_numcta				= resultsREC[x].getValue('custentity_numcta','custrecord_rec_reclutadora');
								_email_empleado_jdg	= resultsREC[x].getValue('email','custrecord_rec_reclutadora');
							}
						}

						subtotal 	= returnNumber(ventaReclu);

						if(_jdg_no_ventas_propio < _cdc_ventas_minimas_para_pago) {
							subtotal -= ventaReclu;
							color	  = 'red';
						}

						retencion 	= 0.0;
						total 		= 0.0;           	
						lines = _icf_tablas_isr.length;

						for(l =0;l<lines;l++) {
							_tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
							_tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
							_tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
							_tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));

							if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior){
								total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
								break;
							}
						}

						ventaRecluT 		= currencyFormat(ventaReclu,2);
						ventaRecluT 		= ventaRecluT.toString();
						ventaRecluT 		= ventaRecluT.fontcolor(color);

						retencion 		= subtotal - total;
						subtotal 		= returnNumber(subtotal);
						retencion 		= returnNumber(retencion);
						total 			= returnNumber(total);
						num_emp 			= stringToArray(nomEmp, 32);
						lineNumber  		= new Number(linea);
						lineNumber.toString();

						data_imprimir_jdg = {};
						data_imprimir_jdg.ec				= ec;
						data_imprimir_jdg.fc				= fc;
						data_imprimir_jdg.id_emp	  		= _id_empleado_jdg;
						data_imprimir_jdg.mode				= 'imprimir';
						data_imprimir_jdg.name				= nomEmp;
						data_imprimir_jdg = JSON.stringify(data_imprimir_jdg);
						data_imprimir_jdg = Base64.encode(data_imprimir_jdg);

						url_imprimir_jdg = url + "&data=" + data_imprimir_jdg;

						data_enviar_jdg 	= {};
						data_enviar_jdg.ec = ec;
						data_enviar_jdg.fc				    = fc;
						data_enviar_jdg.id_emp				= _id_empleado_jdg;
						data_enviar_jdg.mode				= 'enviar';
						data_enviar_jdg.rec_id				= recordId;
						data_enviar_jdg 	= JSON.stringify(data_enviar_jdg);
						data_enviar_jdg 	= Base64.encode(data_enviar_jdg);

						url_enviar_jdg 	= (_email_empleado_jdg != '') ? (url + "&data=" + data_enviar_jdg):'';

						data_enviar_aux_jdg = {};
						data_enviar_aux_jdg.ec				= ec;
						data_enviar_aux_jdg.fc				= fc;
						data_enviar_aux_jdg.id_emp			= _id_empleado_jdg;
						data_enviar_aux_jdg.mode			= 'enviar';
						data_enviar_aux_jdg.rec_id			= recordId;
						data_enviar_aux_jdg = JSON.stringify(data_enviar_aux_jdg);
						data_enviar_aux_jdg = Base64.encode(data_enviar_aux_jdg);
						data_enviar_aux_jdg = (_email_empleado_jdg != '') ? data_enviar_aux_jdg:'';
						nlapiLogExecution('DEBUG', 'lineNumber', lineNumber);
						detalleComisionesSublist.setLineItemValue('custpage_det_linea', linea, lineNumber);
						detalleComisionesSublist.setLineItemValue('custpage_det_comision', linea, '');
						detalleComisionesSublist.setLineItemValue('custpage_det_internal_id_empleado', linea,_id_empleado_jdg);
						detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', linea, num_emp[0]);
						detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado_text', linea,nomEmp);
						detalleComisionesSublist.setLineItemValue('custpage_det_numero_cuenta', linea,_numcta);
						detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', linea, nomEmp);
						detalleComisionesSublist.setLineItemValue('custpage_det_email_empleado', linea,_email_empleado_jdg);
						detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', linea,0);
						detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', linea,_jdg_no_ventas_propio );
						detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', linea,0);
						detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia_especial', linea, 0);
						detalleComisionesSublist.setLineItemValue('custpage_det_venta_equipo', linea, 0);
						detalleComisionesSublist.setLineItemValue('custpage_det_puesta_bono_equipo',linea, 0);
						detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', linea, ventaRecluT);
						detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', linea, currencyFormat(subtotal,2));
						detalleComisionesSublist.setLineItemValue('custpage_det_retencion', linea, currencyFormat(retencion,2));
						detalleComisionesSublist.setLineItemValue('custpage_det_total',linea, currencyFormat(total,2));
						detalleComisionesSublist.setLineItemValue('custpage_det_imprimir', linea, url_imprimir_jdg);
						detalleComisionesSublist.setLineItemValue('custpage_det_enviar', linea, url_enviar_jdg);
						detalleComisionesSublist.setLineItemValue('custpage_det_enviar_aux', linea, data_enviar_aux_jdg);
						linea++;;
					}
				}
			}
		} else if(ec == 2) {
			detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			//detalleComisionesSublist.addField('custpage_det_comision', 'select', 'Compensación','customrecord_comisiones_pre');
          	detalleComisionesSublist.addField('custpage_det_comision_txt', 'text', 'Compensaci�n');
          	detalleComisionesSublist.addField('custpage_det_comision', 'select', 'Compensaci�n','customrecord_comisiones_pre').setDisplayType('hidden');
//			detalleComisionesSublist.addField('custpage_det_conf_com', 'select', 'Conf. CompensaciÃ³n','customrecord_conf_de_compensaciones');
			detalleComisionesSublist.addField('custpage_det_internal_id_empleado', 'text', 'Internal ID Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_numero_empleado', 'text', 'ID Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado_text', 'text', 'Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_numero_cuenta', 'text', 'Cuenta').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado', 'text', 'Presentadora');
			detalleComisionesSublist.addField('custpage_det_email_empleado', 'text', 'Email Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_bono_manual', 'text', 'Bono Manual');
			detalleComisionesSublist.addField('custpage_det_venta_propia', 'text', 'Venta Propia');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia', 'text', 'Puesta en Marcha').setDisplayType('hidden');;
			detalleComisionesSublist.addField('custpage_det_venta_propia_especial', 'text', 'Venta Propia Especial');
			detalleComisionesSublist.addField('custpage_det_venta_gtm', 'text', 'Venta Propia GTM');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia_gtm', 'text', 'Puesta en Marcha GTM' );
			detalleComisionesSublist.addField('custpage_det_reclutamiento', 'text', 'Reclutamiento');
			detalleComisionesSublist.addField('custpage_det_subtotal', 'text', 'Sub-Total');
			detalleComisionesSublist.addField('custpage_det_retencion', 'text', 'Retencion');
			detalleComisionesSublist.addField('custpage_det_total', 'text', 'Total');
			detalleComisionesSublist.addField('custpage_det_cod_respuesta', 'text', 'Codigo de Respuesta');
			detalleComisionesSublist.addField('custpage_det_men_respuesta', 'text', 'Mensaje de Respuesta');
			detalleComisionesSublist.addField('custpage_det_xml_sat', 'url', 'XML - SAT').setLinkText('Ver');
			detalleComisionesSublist.addField('custpage_det_pdf', 'url', 'PDF').setLinkText('Ver');
			detalleComisionesSublist.addField('custpage_det_imprimir', 'url', 'Imprimir').setLinkText('Imprimir');
			detalleComisionesSublist.addField('custpage_det_enviar', 'url', 'Enviar').setLinkText('Enviar');
			detalleComisionesSublist.addField('custpage_det_enviar_aux', 'textarea', 'Data Enviar').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_subtotal_currency', 'currency', 'Sub-Total').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_retencion_currency', 'currency', 'Retencion').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_total_currency', 'currency', 'Total').setDisplayType('hidden');

			filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fc);
			filters[2] = new nlobjSearchFilter('custrecord_conf_principal', 'custrecord12', 'is', 'T');

			columns[0] = new nlobjSearchColumn('custrecord_gtm_puesta_marcha');
			columns[1] = new nlobjSearchColumn('custrecord_gtm_total_comisiones');
			columns[2] = new nlobjSearchColumn('custrecord_gtm_empleado');
			resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, columns));

			filters[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			filters[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',2);
			filters[3] = new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',1);
			filters[4]  = new nlobjSearchFilter('custrecord_conf_principal','custrecord11', 'is', 'T');
          
			columns[0] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
			columns[1] = new nlobjSearchColumn('custrecord_rec_empleado');
			columns[2] = new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
			columns[3] = new nlobjSearchColumn('custrecord_rec_categoria_empleado');
			columns[4] = new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
			columns[5] 	= new nlobjSearchColumn('custentity_numcta','custrecord_rec_reclutadora');
			columns[6] 	= new nlobjSearchColumn('email','custrecord_rec_reclutadora');
			columns[7] = new nlobjSearchColumn('name');

			resultsREC = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));

			var filtersDataPRE			= [];
			var columnsDataPRE			= [];
			var resultsDataPRE			= [];
			var data_imprimir_pre		= {};
			var data_enviar_pre			= {};
			var data_enviar_aux_pre		= {};
			var url_imprimir_pre		= '';
			var url_enviar_pre			= '';
			var _id_empleado_pre		= '';
			var _email_empleado_pre		= '';
			colorReclu         			= '#000000';

			filtersDataPRE[0]			= new nlobjSearchFilter('internalid', null, 'anyof', ids);
			filtersDataPRE[1]			= new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
			filtersDataPRE[2]			= new nlobjSearchFilter('custrecord_conf_principal','custrecord10', 'is', 'T');
			
			columnsDataPRE[0]			= new nlobjSearchColumn('custrecord_pre_total_bono_manual');//'custrecord_pre_bono_manual');
			columnsDataPRE[1]			= new nlobjSearchColumn('custrecord_pre_no_ventas');
			columnsDataPRE[2] 			= new nlobjSearchColumn('custrecord_pre_total_compensacion');
			columnsDataPRE[3]			= new nlobjSearchColumn('custrecord_pre_entrega');
			columnsDataPRE[4] 			= new nlobjSearchColumn('custrecord_pre_total_comisiones');
			columnsDataPRE[5] 			= new nlobjSearchColumn('custentity_promocion','custrecord_pre_empleado');
			columnsDataPRE[6]	 		= new nlobjSearchColumn('custentity_numcta','custrecord_pre_empleado');
			columnsDataPRE[7]	 		= new nlobjSearchColumn('custrecord_pre_empleado');
			columnsDataPRE[8] 			= new nlobjSearchColumn('custrecord_pre_nombre_empleado');
			columnsDataPRE[9] 			= new nlobjSearchColumn('custrecord_pre_pagar_compensaciones');
			columnsDataPRE[10] 			= new nlobjSearchColumn('custrecord_pre_codigo_respuesta');
			columnsDataPRE[11] 			= new nlobjSearchColumn('custrecord_pre_mensaje_respuesta');
			columnsDataPRE[12] 			= new nlobjSearchColumn('custrecord_pre_xml_sat');
			columnsDataPRE[13] 			= new nlobjSearchColumn('custrecord_pre_pdf');
			columnsDataPRE[14] 			= new nlobjSearchColumn('custrecord_pre_compensacion_especial');
			columnsDataPRE[15] 			= new nlobjSearchColumn('email','custrecord_pre_empleado');
          	columnsDataPRE[16] 			= new nlobjSearchColumn('name');
//			columnsDataPRE[16] = new nlobjSearchColumn('custrecord10');
//			columnsDataPRE[17] = new nlobjSearchColumn('custrecord_cdc_ventas_minimas_para_pago','custrecord10');
			
			resultsDataPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filtersDataPRE, columnsDataPRE));
			
			for(i=0;i<resultsDataPRE.length;i++) {
//				nlapiLogExecution('DEBUG', i, ids[i] + ' - ' + resultsDataPRE[i].getId());
				
				//--Busca el id correspondinente al arreglo
				var iId = 0;
				for(; iId < ids.length; iId++) {
					if(ids[iId] == resultsDataPRE[i].getId()){
						break;
					}
				}
//				nlapiLogExecution('DEBUG', i, ids[iId] + ' - ' + resultsDataPRE[i].getId());
				
//				var cdc	= resultsDataPRE[i].getValue(columnsDataPRE[16]);
				var _cdc_ventas_minimas_para_pago = 1;//returnNumber(resultsDataPRE[i].getValue(columnsDataPRE[17]));
				var _pre_bono_manual			= returnNumber(resultsDataPRE[i].getValue('custrecord_pre_total_bono_manual'));//'custrecord_pre_bono_manual'));
				var _pre_no_ventas		 		= returnNumber(resultsDataPRE[i].getValue('custrecord_pre_no_ventas'));
				var _pre_compensacion			= returnNumber(resultsDataPRE[i].getValue('custrecord_pre_total_compensacion'));//'custrecord_pre_compensacion'));
				var _pre_entrega		 		= returnNumber(resultsDataPRE[i].getValue('custrecord_pre_entrega'));
				var _pre_total_comisiones		= returnNumber(resultsDataPRE[i].getValue('custrecord_pre_total_comisiones'));
				var _pre_empleado 				= returnBlank(resultsDataPRE[i].getValue('custrecord_pre_empleado'));
				var _pre_nombre_empleado 		= returnBlank(resultsDataPRE[i].getValue('custrecord_pre_nombre_empleado'));
				var _pre_pagar_comp		 		= returnFalse(resultsDataPRE[i].getValue('custrecord_pre_pagar_compensaciones'));
				_numcta 		= returnBlank(resultsDataPRE[i].getValue('custentity_numcta','custrecord_pre_empleado'));
				var _pre_codigo_respuesta		= returnBlank(resultsDataPRE[i].getValue('custrecord_pre_codigo_respuesta'));
				var _pre_mensaje_respuesta		= returnBlank(resultsDataPRE[i].getValue('custrecord_pre_mensaje_respuesta'));
				var _pre_xml_sat				= returnBlank(resultsDataPRE[i].getValue('custrecord_pre_xml_sat'));
				var _pre_pdf = returnBlank(resultsDataPRE[i].getValue('custrecord_pre_pdf'));
				var _pre_compensacion_especial	= returnNumber(resultsDataPRE[i].getValue('custrecord_pre_compensacion_especial'));
				var _pre_email_empleado			= returnBlank(resultsDataPRE[i].getValue('email','custrecord_pre_empleado'));
				var _pre_xml_sat_url			= '';
				var _pre_pdf_url				= '';

				if(_pre_xml_sat != '') {
					data			= {};
					data.fileID     = _pre_xml_sat;
					data.titleForm	= "XML - SAT";
					data			= JSON.stringify(data);
					data	    	= Base64.encode(data);
					_pre_xml_sat_url	= host + urlSUITELET 	+ "&data=" 	+ data;
				}

				if(_pre_pdf != '') {
					data			= {};
					data.fileID     = _pre_pdf;
					data.titleForm	= "PDF";
					data			= JSON.stringify(data);
					data	    	= Base64.encode(data);
					_pre_pdf_url		= host + urlSUITELET 	+ "&data=" 	+ data;
				}

				searchString = '<?xml ';
				searchIndex 	= _pre_mensaje_respuesta.search(searchString);

				if(searchIndex != -1) {
					searchIndex = searchIndex - 2;
					_pre_mensaje_respuesta   = _pre_mensaje_respuesta.substring(0,searchIndex);
					_pre_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				if(_pre_mensaje_respuesta >= 4000) {
					_pre_mensaje_respuesta 	= _pre_mensaje_respuesta.substring(0,3987);
					_pre_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				ventaReclu  = 0;
				ventaGTM  = 0;
				pm_GTM  	= 0;

				for(x=0;x<resultsREC.length;x++) {
					if(resultsREC[x].getValue('custrecord_rec_reclutadora') == _pre_empleado) {
						ventaReclu += returnNumber(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
						ids_rec_com_skip[skip] = resultsREC[x].getId();
						skip++;
					}
				}

				for(x=0;x<resultsGTM.length;x++) {
					if(resultsGTM[x].getValue('custrecord_gtm_empleado') == _pre_empleado) {
						ventaGTM = returnNumber(resultsGTM[x].getValue('custrecord_gtm_total_comisiones'));
						pm_GTM  =  returnNumber(resultsGTM[x].getValue('custrecord_gtm_puesta_marcha'));
						break;
					}
				}
//				subtotal 	= returnNumber(_pre_total_comisiones) + returnNumber(ventaReclu) + returnNumber(ventaGTM) + returnNumber(_pre_bono_manual);
				subtotal 	= Number(_pre_compensacion) + Number(ventaReclu) + Number(ventaGTM) + Number(_pre_bono_manual);
				
				if(_pre_no_ventas < _cdc_ventas_minimas_para_pago) {
					subtotal	   -= ventaReclu;
					colorReclu      = '#red';	
				} else {
					colorReclu	 = '#000000';
				}

				if(_pre_pagar_comp == 'F') {
					subtotal = 0;
				}

				retencion 	= 0.0;
				total 		= 0.0;           	
				lines = _icf_tablas_isr.length;

				for(l =0;l<lines;l++) {
					_tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
					_tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
					_tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
					_tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));

					if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  ) {
						total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
						break;
					}
				}
				
				ventaRecluT	= currencyFormat(ventaReclu,2);
				ventaRecluT	= ventaRecluT.toString();
				ventaRecluT = ventaRecluT.fontcolor(colorReclu);
				bonoManualT	= currencyFormat(_pre_bono_manual,2);
				bonoManualT	= bonoManualT.toString();
				//bonoManualT = bonoManualT.fontcolor(color);
				retencion		= subtotal-total;
				subtotal		= returnNumber(subtotal);
				retencion		= returnNumber(retencion);
				total			= returnNumber(total);
				num_emp			= stringToArray(_pre_nombre_empleado, 32);
				lineNumber 		= new Number(i +1);
				lineNumber.toString();

				if(_pre_mensaje_respuesta.length >= 300) {
					_pre_mensaje_respuesta 	= _pre_mensaje_respuesta.substring(0,285);
					_pre_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				data_imprimir_pre = {};
				data_imprimir_pre.ec				= ec;
				data_imprimir_pre.fc				= fc;
				data_imprimir_pre.ids	    		= ids[iId] + "@";
				data_imprimir_pre.mode				= 'imprimir';
				data_imprimir_pre.id_emp	  		= _pre_empleado;
				data_imprimir_pre.name				= _pre_nombre_empleado;
				data_imprimir_pre = JSON.stringify(data_imprimir_pre);
				data_imprimir_pre = Base64.encode(data_imprimir_pre);
				url_imprimir_pre = url + "&data=" + data_imprimir_pre;

				data_enviar_pre 	= {};
				data_enviar_pre.ec = ec;
				data_enviar_pre.fc				    = fc;
				data_enviar_pre.ids	    			= ids[iId] + "@";
				data_enviar_pre.mode				= 'enviar';
				data_enviar_pre.id_emp				= _pre_empleado;
				data_enviar_pre.rec_id				= recordId;
				data_enviar_pre 	= JSON.stringify(data_enviar_pre);
				data_enviar_pre 	= Base64.encode(data_enviar_pre);
				url_enviar_pre 	= (_pre_email_empleado != '') ? (url + "&data=" + data_enviar_pre):'';

				data_enviar_aux_pre = {};
				data_enviar_aux_pre.ec				= ec;
				data_enviar_aux_pre.fc				= fc;
				data_enviar_aux_pre.ids	    		= ids[iId] + "@";
				data_enviar_aux_pre.mode			= 'enviar';
				data_enviar_aux_pre.id_emp			= _pre_empleado;
				data_enviar_aux_pre.rec_id			= recordId;
				data_enviar_aux_pre = JSON.stringify(data_enviar_aux_pre);
				data_enviar_aux_pre = Base64.encode(data_enviar_aux_pre);
				data_enviar_aux_pre = (_pre_email_empleado != '') ? data_enviar_aux_pre:'';

              	var _pre_name = resultsDataPRE[i].getValue('name');
				var linkToRecord = '<a href="' + nlapiResolveURL('RECORD', 'customrecord_comisiones_pre', ids[iId]) + '">' + _pre_name + '</a>';

				detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
				detalleComisionesSublist.setLineItemValue('custpage_det_comision_txt', i+1, linkToRecord);
				detalleComisionesSublist.setLineItemValue('custpage_det_comision', i+1, resultsDataPRE[i].getId());
//				detalleComisionesSublist.setLineItemValue('custpage_det_conf_com', i+1, cdc);
				detalleComisionesSublist.setLineItemValue('custpage_det_internal_id_empleado', i+1,_pre_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', i+1, num_emp[0]);
				detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado_text', i+1,_pre_nombre_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_numero_cuenta', i+1,_numcta);
				detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', i+1, _pre_nombre_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_email_empleado', i+1,_pre_email_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', i+1,bonoManualT);
				detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', i+1,currencyFormat(_pre_compensacion,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', i+1, currencyFormat(_pre_entrega,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia_especial', i+1, currencyFormat(_pre_compensacion_especial,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_venta_gtm', i+1, ventaGTM);
				detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia_gtm', i+1, pm_GTM);
				detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', i+1, ventaRecluT);
				detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', i+1, currencyFormat(subtotal,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_retencion', i+1, currencyFormat(retencion,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_total', i+1, currencyFormat(total,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_cod_respuesta', i+1, _pre_codigo_respuesta);
				detalleComisionesSublist.setLineItemValue('custpage_det_men_respuesta', i+1, _pre_mensaje_respuesta);
				detalleComisionesSublist.setLineItemValue('custpage_det_xml_sat', i+1, _pre_xml_sat_url);
				detalleComisionesSublist.setLineItemValue('custpage_det_pdf', i+1, _pre_pdf_url);
				detalleComisionesSublist.setLineItemValue('custpage_det_subtotal_currency', i+1, subtotal);
				detalleComisionesSublist.setLineItemValue('custpage_det_retencion_currency', i+1, retencion);
				detalleComisionesSublist.setLineItemValue('custpage_det_total_currency', i+1, total);
				detalleComisionesSublist.setLineItemValue('custpage_det_imprimir', i+1, url_imprimir_pre);
				detalleComisionesSublist.setLineItemValue('custpage_det_enviar', i+1, url_enviar_pre);
				detalleComisionesSublist.setLineItemValue('custpage_det_enviar_aux', i+1, data_enviar_aux_pre);
			}
			
			if(ids_rec_com_skip.length != resultsREC.length) {
				linea = detalleComisionesSublist.getLineItemCount() + 1 ;//| 1;
				
				if(linea <= 0){
					linea = 1;
				}
				
				for(x=0;x<resultsREC.length;x++) {
					ids_rec_com_non_skip += resultsREC[x].getId()+String.fromCharCode(64);
				}

				for(i=0; i<ids_rec_com_skip.length;i++) {
					ids_rec_com_non_skip = ids_rec_com_non_skip.split((ids_rec_com_skip[i]+'@'));
					ids_rec_com_non_skip = ids_rec_com_non_skip.join('');
				}

				ids_rec_com_non_skip = ids_rec_com_non_skip.split('@');
				ids_rec_com_non_skip.pop();				

				if(ids_rec_com_non_skip.length != 0) {
					resultados 		= [];
					resultadosAux 	= [];
					contR 			= 0;
					for(y=0;y<ids_rec_com_non_skip.length;y++) {
						for(x=0;x<resultsREC.length;x++) {
							if(resultsREC[x].getId() == ids_rec_com_non_skip[y]) {
								resultadosAux[contR] = resultsREC[x];
								contR++;
							}
						}
					}

					lon = resultadosAux.length;
					i 	= 0;
					resultados 	= [];

					for(cont=lon-1;cont>0;cont--) {
						if(resultadosAux[cont].getValue('custrecord_rec_reclutadora') != resultadosAux[cont-1].getValue('custrecord_rec_reclutadora')) { 
							resultados[i]=resultadosAux[cont].getValue('custrecord_rec_reclutadora'); 
							i++; 
						}	             
					}
					resultados[i] = resultadosAux[0].getValue('custrecord_rec_reclutadora');
					resultados.reverse();

					var ids_empleado_gtm_com_skip = [];
					for(var g=0;g<resultsGTM.length;g++) {
						ids_empleado_gtm_com_skip[g] = resultsGTM[g].getValue('custrecord_gtm_empleado');
					}

					for(var r = 0;r<resultados.length;r++)  {
						for(var h = 0;h<ids_empleado_gtm_com_skip.length;h++) {
							resultados = popArrayValue(resultados,ids_empleado_gtm_com_skip[h]);
						}
					}

					for(y=0;y<resultados.length;y++) {
                      	var _rec_name = '';
                      	var _rec_id = 0;
						_pre_no_ventas 		= 0;
						ventaReclu 			= 0;
						nomEmp 				= '';
						_numcta				= '';
						for(x=0;x<resultsREC.length;x++) {
							if(resultsREC[x].getValue('custrecord_rec_reclutadora') == resultados[y]) {
								ventaReclu 				   += returnNumber(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
								nomEmp  	= resultsREC[x].getText('custrecord_rec_reclutadora');
								_numcta 	= resultsREC[x].getValue('custentity_numcta','custrecord_rec_reclutadora');
								_id_empleado_pre			= resultsREC[x].getValue('custrecord_rec_reclutadora');
								_email_empleado_pre			= resultsREC[x].getValue('email','custrecord_rec_reclutadora');
                              	_rec_name = resultsREC[x].getValue('name');
                              	_rec_id =  resultsREC[x].getId();
							}
						}
						subtotal 	= returnNumber(ventaReclu);

						/*if(_pre_no_ventas < _cdc_ventas_minimas_para_pago) {
							subtotal -= ventaReclu;*/
							color	  = "red";
						/*}*/

						retencion 	= 0.0;
						total 		= 0.0;           	
						lines = _icf_tablas_isr.length;

						for(l =0;l<lines;l++) {
							_tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
							_tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
							_tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
							_tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));

							if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  ) {
								total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
								break;
							}
						}

						ventaRecluT 		= currencyFormat(ventaReclu,2);
						ventaRecluT 		= ventaRecluT.toString();
						ventaRecluT				 			= ventaRecluT.fontcolor(color);
						retencion 		= subtotal-total;
						subtotal 		= returnNumber(subtotal);
						retencion 		= returnNumber(retencion);
						total 			= returnNumber(total);
						num_emp 			= stringToArray(nomEmp, 32);
						lineNumber  		= new Number(linea);
						lineNumber.toString();

						data_imprimir_pre = {};
						data_imprimir_pre.ec				= ec;
						data_imprimir_pre.fc				= fc;
						data_imprimir_pre.id_emp	  		= _id_empleado_pre;
						data_imprimir_pre.mode				= 'imprimir';
						data_imprimir_pre.name				= nomEmp;
						data_imprimir_pre = JSON.stringify(data_imprimir_pre);
						data_imprimir_pre = Base64.encode(data_imprimir_pre);
						url_imprimir_pre = url + "&data=" + data_imprimir_pre;

						data_enviar_pre 	= {};
						data_enviar_pre.ec = ec;
						data_enviar_pre.fc				    = fc;
						data_enviar_pre.id_emp				= _id_empleado_pre;
						data_enviar_pre.mode				= 'enviar';
						data_enviar_pre.rec_id				= recordId;
						data_enviar_pre 	= JSON.stringify(data_enviar_pre);
						data_enviar_pre 	= Base64.encode(data_enviar_pre);
						url_enviar_pre 	= (_email_empleado_pre != '') ? (url + "&data=" + data_enviar_pre):'';

						data_enviar_aux_pre = {};
						data_enviar_aux_pre.ec				= ec;
						data_enviar_aux_pre.fc				= fc;
						data_enviar_aux_pre.id_emp			= _id_empleado_pre;
						data_enviar_aux_pre.mode			= 'enviar';
						data_enviar_aux_pre.rec_id			= recordId;
						data_enviar_aux_pre = JSON.stringify(data_enviar_aux_pre);
						data_enviar_aux_pre = Base64.encode(data_enviar_aux_pre);
						data_enviar_aux_pre = (_email_empleado_pre != '') ? data_enviar_aux_pre:'';
                      
						var linkToRecord = '<a href="' + nlapiResolveURL('RECORD', 'customrecord_comisiones_rec', _rec_id) + '">' + _rec_name + '</a>';
						if( total > 0 ){
                          detalleComisionesSublist.setLineItemValue('custpage_det_linea', linea, lineNumber);
                          detalleComisionesSublist.setLineItemValue('custpage_det_comision_txt', linea, linkToRecord);
                          detalleComisionesSublist.setLineItemValue('custpage_det_comision', linea, '');
                          detalleComisionesSublist.setLineItemValue('custpage_det_internal_id_empleado', linea,_id_empleado_pre);
                          detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', linea, num_emp[0]);
                          detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado_text', linea,nomEmp);
                          detalleComisionesSublist.setLineItemValue('custpage_det_numero_cuenta', linea, _numcta);
                          detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', linea, nomEmp);
                          detalleComisionesSublist.setLineItemValue('custpage_det_email_empleado', linea,_email_empleado_pre);
                          detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', linea,0);
                          detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', linea, _pre_no_ventas);
                          detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', linea,0);
                          detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia_especial', linea, 0);
                          detalleComisionesSublist.setLineItemValue('custpage_det_venta_gtm', linea, 0);
                          detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia_gtm',linea, 0);
                          detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', linea, ventaRecluT);
                          detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', linea, currencyFormat(subtotal,2));
                          detalleComisionesSublist.setLineItemValue('custpage_det_retencion', linea, currencyFormat(retencion,2));
                          detalleComisionesSublist.setLineItemValue('custpage_det_total',linea, currencyFormat(total,2));
                          detalleComisionesSublist.setLineItemValue('custpage_det_imprimir', linea, url_imprimir_pre);
                          detalleComisionesSublist.setLineItemValue('custpage_det_enviar', linea, url_enviar_pre);
                          detalleComisionesSublist.setLineItemValue('custpage_det_enviar_aux', linea, data_enviar_aux_pre);
                          linea++;
                        }
					}
				}
			}
		} else if(ec == 4) {
			detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			detalleComisionesSublist.addField('custpage_det_comision', 'select', 'CompensaciÃ³n','customrecord_comisiones_gtm');
//			detalleComisionesSublist.addField('custpage_det_conf_com', 'select', 'Conf. CompensaciÃ³n','customrecord_conf_de_compensaciones');
			detalleComisionesSublist.addField('custpage_det_internal_id_empleado', 'text', 'Internal ID Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_numero_empleado', 'text', 'ID Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado_text', 'text', 'Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_numero_cuenta', 'text', 'Cuenta').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado', 'text', 'Presentadora');
			detalleComisionesSublist.addField('custpage_det_email_empleado', 'text', 'Email Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_bono_manual', 'text', 'Bono Manual');
			detalleComisionesSublist.addField('custpage_det_venta_propia', 'text', 'Venta Propia');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia', 'text', 'Puesta en Marcha');
			detalleComisionesSublist.addField('custpage_det_reclutamiento', 'text', 'Reclutamiento');
			detalleComisionesSublist.addField('custpage_det_subtotal', 'text', 'Sub-Total');
			detalleComisionesSublist.addField('custpage_det_retencion', 'text', 'Retencion');
			detalleComisionesSublist.addField('custpage_det_total', 'text', 'Total');
			detalleComisionesSublist.addField('custpage_det_cod_respuesta', 'text', 'Codigo de Respuesta');
			detalleComisionesSublist.addField('custpage_det_men_respuesta', 'text', 'Mensaje de Respuesta');
			detalleComisionesSublist.addField('custpage_det_xml_sat', 'url', 'XML - SAT').setLinkText('Ver');
			detalleComisionesSublist.addField('custpage_det_pdf', 'url', 'PDF').setLinkText('Ver');
			detalleComisionesSublist.addField('custpage_det_imprimir', 'url', 'Imprimir').setLinkText('Imprimir');
			detalleComisionesSublist.addField('custpage_det_enviar', 'url', 'Enviar').setLinkText('Enviar');
			detalleComisionesSublist.addField('custpage_det_enviar_aux', 'textarea', 'Data Enviar').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_subtotal_currency', 'currency', 'Sub-Total').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_retencion_currency', 'currency', 'Retencion').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_total_currency', 'currency', 'Total').setDisplayType('hidden');

			filters[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			filters[2]  = new nlobjSearchFilter('custrecord_conf_principal','custrecord11', 'is', 'T');
			
			columns[0] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
			columns[1] = new nlobjSearchColumn('custrecord_rec_empleado');
			columns[2]  = new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
			columns[3]  = new nlobjSearchColumn('custrecord_rec_categoria_empleado');
			columns[4]  = new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');

			resultsREC  = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));

			colorReclu          		= '#000000';

			var colorVentaPropio 	 	= '#000000';
			var filtersDataGTM			= [];
			var columnsDataGTM			= [];
			var resultsDataGTM			= [];
			var data_imprimir_gtm		= {};
			var data_enviar_gtm			= {};
			var data_enviar_aux_gtm		= {};
			var url_imprimir_gtm		= '';
			var url_enviar_gtm			= '';
			var _id_empleado_gtm		= '';
			var _email_empleado_gtm		= '';

			filtersDataGTM[0]			= new nlobjSearchFilter('internalid', null, 'anyof', ids);
			filtersDataGTM[1]			= new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
			filtersDataGTM[2]			= new nlobjSearchFilter('custrecord_conf_principal','custrecord12', 'is', 'T');
			
			columnsDataGTM[0]			= new nlobjSearchColumn('custrecord_gtm_bono_manual');
			columnsDataGTM[1]			= new nlobjSearchColumn('custrecord_gtm_rentener_compensaciones');
			columnsDataGTM[2]			= new nlobjSearchColumn('custrecord_gtm_no_ventas_periodo');
			columnsDataGTM[3] 			= new nlobjSearchColumn('custrecord_gtm_total_comisiones');
			columnsDataGTM[4] 			= new nlobjSearchColumn('custrecord_gtm_puesta_marcha');
			columnsDataGTM[5] 			= new nlobjSearchColumn('custentity_promocion','custrecord_gtm_empleado');
			columnsDataGTM[6] 			= new nlobjSearchColumn('custentity_numcta','custrecord_gtm_empleado');
			columnsDataGTM[7] 			= new nlobjSearchColumn('custrecord_gtm_empleado');
			columnsDataGTM[8] 			= new nlobjSearchColumn('custrecord_gtm_nombre_empleado');
			columnsDataGTM[9] 			= new nlobjSearchColumn('custrecord_gtm_pagar_compensaciones');
			columnsDataGTM[10] 			= new nlobjSearchColumn('custrecord_gtm_codigo_respuesta');
			columnsDataGTM[11] 			= new nlobjSearchColumn('custrecord_gtm_mensaje_respuesta');
			columnsDataGTM[12] 			= new nlobjSearchColumn('custrecord_gtm_xml_sat');
			columnsDataGTM[13] 			= new nlobjSearchColumn('custrecord_gtm_pdf');
			columnsDataGTM[14] 			= new nlobjSearchColumn('email','custrecord_gtm_empleado');
//			columnsDataGTM[15] = new nlobjSearchColumn('custrecord12');
//			columnsDataGTM[16] = new nlobjSearchColumn('custrecord_cdc_ventas_minimas_para_pago','custrecord12');
			
			resultsDataGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filtersDataGTM, columnsDataGTM));

			for(i=0;i<resultsDataGTM.length;i++) { 
				
				//--Busca el id correspondinente al arreglo
				var iId = 0;
				for(; iId < ids.length; iId++) {
					if(ids[iId] == resultsDataGTM[i].getId()){
						break;
					}
				}
//				nlapiLogExecution('DEBUG', i, ids[iId] + ' - ' + resultsDataGTM[i].getId());
				
//				var cdc	= resultsDataJDG[i].getValue(columnsDataJDG[15]);
				var _cdc_ventas_minimas_para_pago 	= 1;//returnNumber(resultsDataJDG[i].getValue(columnsDataJDG[16]));
				var _gtm_bono_manual		= returnNumber(resultsDataGTM[i].getValue('custrecord_gtm_bono_manual'));
				var _gtm_rentener_comp		= returnFalse(resultsDataGTM[i].getValue('custrecord_gtm_rentener_compensaciones'));
				var _gtm_no_ventas_periodo	= returnNumber(resultsDataGTM[i].getValue('custrecord_gtm_no_ventas_periodo'));
				var _gtm_total_comisiones 	= returnNumber(resultsDataGTM[i].getValue('custrecord_gtm_total_comisiones'));
				var _gtm_puesta_marcha 		= returnNumber(resultsDataGTM[i].getValue('custrecord_gtm_puesta_marcha'));
				var _gtm_empleado 			= returnBlank(resultsDataGTM[i].getValue('custrecord_gtm_empleado'));
				var _gtm_nombre_empleado 	= returnBlank(resultsDataGTM[i].getValue('custrecord_gtm_nombre_empleado'));
				var _gtm_pagar_comp		 	= returnFalse(resultsDataGTM[i].getValue('custrecord_gtm_pagar_compensaciones'));;
				_numcta 	= returnBlank(resultsDataGTM[i].getValue('custentity_numcta','custrecord_gtm_empleado'));
				var _gtm_codigo_respuesta	= returnBlank(resultsDataGTM[i].getValue('custrecord_gtm_codigo_respuesta'));
				var _gtm_mensaje_respuesta	= returnBlank(resultsDataGTM[i].getValue('custrecord_gtm_mensaje_respuesta'));
				var _gtm_xml_sat			= returnBlank(resultsDataGTM[i].getValue('custrecord_gtm_xml_sat'));
				var _gtm_pdf				= returnBlank(resultsDataGTM[i].getValue('custrecord_gtm_pdf'));
				var _gtm_email_empleado		= returnBlank(resultsDataGTM[i].getValue('email','custrecord_gtm_empleado'));
				var _gtm_xml_sat_url		= '';
				var _gtm_pdf_url			= '';

				if(_gtm_xml_sat != '') {
					data			= {};
					data.fileID     = _gtm_xml_sat;
					data.titleForm	= "XML - SAT";
					data			= JSON.stringify(data);
					data	    	= Base64.encode(data);
					_gtm_xml_sat_url	= host + urlSUITELET 	+ "&data=" 	+ data;
				}

				if(_gtm_pdf != '') 	{
					data			= {};
					data.fileID     = _gtm_pdf;
					data.titleForm	= "PDF";
					data			= JSON.stringify(data);
					data	    	= Base64.encode(data);
					_gtm_pdf_url		= host + urlSUITELET 	+ "&data=" 	+ data;
				}
				searchString = '<?xml ';
				searchIndex 	= _gtm_mensaje_respuesta.search(searchString);

				if(searchIndex != -1) {
					searchIndex = searchIndex - 2;
					_gtm_mensaje_respuesta   = _gtm_mensaje_respuesta.substring(0,searchIndex);
					_gtm_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				if(_gtm_mensaje_respuesta >= 4000) {
					_gtm_mensaje_respuesta 	= _gtm_mensaje_respuesta.substring(0,3987);
					_gtm_mensaje_respuesta  += ' ... mÃ¡s ...';
				}
				ventaReclu  				= 0;

				for(x=0;x<resultsREC.length;x++) {
					if(resultsREC[x].getValue('custrecord_rec_reclutadora') == _gtm_empleado)	{
						ventaReclu 		+= returnNumber(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
						ids_non[skip] 	 = resultsREC[x].getId();
						skip++;
					}
				}
				subtotal 	= returnNumber(_gtm_total_comisiones) + returnNumber(ventaReclu) + returnNumber(_gtm_bono_manual);

				if(_gtm_no_ventas_periodo < _cdc_ventas_minimas_para_pago) {
					subtotal	 -= ventaReclu;
					colorReclu 	  = 'red';
				} else {
					colorReclu	 = '#000000';
				}

				if(_gtm_rentener_comp == 'T') {
					subtotal 			-= _gtm_total_comisiones;
					colorVentaPropio	 = 'red';
				} else {
					colorVentaPropio	 = '#000000';
				}

				if(_gtm_pagar_comp == 'F') {
					subtotal = 0;
				}
				retencion 	= 0.0;
				total 		= 0.0;           	           	
				lines = _icf_tablas_isr.length;

				for(l =0;l<lines;l++) {
					_tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
					_tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
					_tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
					_tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));

					if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  ) {
						total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
						break;
					}
				}
				ventaRecluT	= currencyFormat(ventaReclu,2);
				ventaRecluT	= ventaRecluT.toString();
				ventaRecluT = ventaRecluT.fontcolor(colorReclu);
				var ventaPropiT	= currencyFormat(_gtm_total_comisiones,2);
				ventaPropiT	= ventaPropiT.toString();
				ventaPropiT = ventaPropiT.fontcolor(colorVentaPropio);
				bonoManualT	= currencyFormat(_gtm_bono_manual,2);
				bonoManualT	= bonoManualT.toString();
				//bonoManualT = bonoManualT.fontcolor(color);
				retencion		= subtotal - total;
				subtotal		= returnNumber(subtotal);
				retencion		= returnNumber(retencion);
				total			= returnNumber(total);
				num_emp			= stringToArray(_gtm_nombre_empleado, 32);
				lineNumber 		= new Number(i +1);
				lineNumber.toString();

				if(_gtm_mensaje_respuesta.length >= 300){
					_gtm_mensaje_respuesta 	= _gtm_mensaje_respuesta.substring(0,285);
					_gtm_mensaje_respuesta  += ' ... mÃ¡s ...';
				}

				data_imprimir_gtm = {};
				data_imprimir_gtm.ec				= ec;
				data_imprimir_gtm.fc		   		= fc;
				data_imprimir_gtm.ids	    		= ids[iId] + "@";
				data_imprimir_gtm.mode				= 'imprimir';
				data_imprimir_gtm.id_emp			= _gtm_empleado;
				data_imprimir_gtm = JSON.stringify(data_imprimir_gtm);
				data_imprimir_gtm = Base64.encode(data_imprimir_gtm);
				url_imprimir_gtm = url + "&data=" + data_imprimir_gtm;
				data_enviar_gtm 	= {};
				data_enviar_gtm.ec = ec;
				data_enviar_gtm.fc			   		= fc;
				data_enviar_gtm.ids	    			= ids[iId] + "@";
				data_enviar_gtm.mode				= 'enviar';
				data_enviar_gtm.id_emp				= _gtm_empleado;
				data_enviar_gtm.rec_id				= recordId;
				data_enviar_gtm 	= JSON.stringify(data_enviar_gtm);
				data_enviar_gtm 	= Base64.encode(data_enviar_gtm);
				url_enviar_gtm 	= (_gtm_email_empleado != '') ? (url + "&data=" + data_enviar_gtm):'';
				data_enviar_aux_gtm = {};
				data_enviar_aux_gtm.ec				= ec;
				data_enviar_aux_gtm.fc			   	= fc;
				data_enviar_aux_gtm.ids	    		= ids[iId] + "@";
				data_enviar_aux_gtm.mode			= 'enviar';
				data_enviar_aux_gtm.id_emp			= _gtm_empleado;
				data_enviar_aux_gtm.rec_id			= recordId;
				data_enviar_aux_gtm = JSON.stringify(data_enviar_aux_gtm);
				data_enviar_aux_gtm = Base64.encode(data_enviar_aux_gtm);
				data_enviar_aux_gtm = (_gtm_email_empleado != '') ? data_enviar_gtm:'';
				detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
				detalleComisionesSublist.setLineItemValue('custpage_det_comision', i+1, ids[iId]);
//				detalleComisionesSublist.setLineItemValue('custpage_det_conf_com', i+1, cdc);
				detalleComisionesSublist.setLineItemValue('custpage_det_internal_id_empleado', i+1,_gtm_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', i+1,num_emp[0] );
				detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado_text', i+1,_gtm_nombre_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_numero_cuenta', i+1,_numcta);
				detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', i+1,_gtm_nombre_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_email_empleado', i+1,_gtm_email_empleado);
				detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', i+1,bonoManualT);
				detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', i+1,ventaPropiT );
				detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', i+1, _gtm_puesta_marcha);
				detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', i+1, ventaRecluT);
				detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', i+1, currencyFormat(subtotal,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_retencion', i+1, currencyFormat(retencion,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_total', i+1, currencyFormat(total,2));
				detalleComisionesSublist.setLineItemValue('custpage_det_cod_respuesta', i+1, _gtm_codigo_respuesta);
				detalleComisionesSublist.setLineItemValue('custpage_det_men_respuesta', i+1, _gtm_mensaje_respuesta);
				detalleComisionesSublist.setLineItemValue('custpage_det_xml_sat', i+1, _gtm_xml_sat_url);
				detalleComisionesSublist.setLineItemValue('custpage_det_pdf', i+1, _gtm_pdf_url);
				detalleComisionesSublist.setLineItemValue('custpage_det_imprimir', i+1, url_imprimir_gtm);
				detalleComisionesSublist.setLineItemValue('custpage_det_enviar', i+1, url_enviar_gtm);
				detalleComisionesSublist.setLineItemValue('custpage_det_enviar_aux', i+1, data_enviar_aux_gtm);
				detalleComisionesSublist.setLineItemValue('custpage_det_subtotal_currency', i+1, subtotal);
				detalleComisionesSublist.setLineItemValue('custpage_det_retencion_currency', i+1, retencion);
				detalleComisionesSublist.setLineItemValue('custpage_det_total_currency', i+1, total);
			}

			if(ids_non.length != 0) {
				linea 		= detalleComisionesSublist.getLineItemCount()+1;
				filters[0] 	= new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
				filters[1] 	= new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
				filters[2] 	= new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',1);
				filters[3] 	= new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',1);
				filters[4] 	= new nlobjSearchFilter('internalid',null,'noneof',ids_non);
              	filters[5]  = new nlobjSearchFilter('custrecord_conf_principal','custrecord11', 'is', 'T');
              
				columns[0] 	= new nlobjSearchColumn('custrecord_rec_total_comisiones');
				columns[1] 	= new nlobjSearchColumn('custrecord_rec_empleado');
				columns[2] 	= new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
				columns[3] 	= new nlobjSearchColumn('custrecord_rec_categoria_empleado');
				columns[4] 	= new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
				columns[5] 	= new nlobjSearchColumn('custentity_numcta','custrecord_rec_reclutadora');
				columns[6] 	= new nlobjSearchColumn('email','custrecord_rec_reclutadora');
				resultsREC 	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));

				if(resultsREC != '')   {
					var ids_rec_reclutadora = [];
					for(y=0;y<resultsREC.length;y++) {
						ids_rec_reclutadora[y] = resultsREC[y].getValue('custrecord_rec_reclutadora');
					}
					ids_rec_reclutadora = deleteDuplicateElements(ids_rec_reclutadora);

					for(y=0;y<ids_rec_reclutadora.length;y++)  {
						_gtm_no_ventas_periodo 		= 0;
						ventaReclu  = 0;
						nomEmp  	= '';
						_numcta 	= '';
						for(x=0;x<resultsREC.length;x++)  {
							if(resultsREC[x].getValue('custrecord_rec_reclutadora') == ids_rec_reclutadora[y]) {
								ventaReclu 				   += returnNumber(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
								nomEmp  	= resultsREC[x].getText('custrecord_rec_reclutadora');
								_id_empleado_gtm				= resultsREC[x].getValue('custrecord_rec_reclutadora');
								_numcta 	= resultsREC[x].getValue('custentity_numcta','custrecord_rec_reclutadora');
								_email_empleado_gtm			= resultsREC[x].getValue('email','custrecord_rec_reclutadora');
							}
						}
						subtotal 	= returnNumber(ventaReclu);

						if(_gtm_no_ventas_periodo < _cdc_ventas_minimas_para_pago){
							subtotal -= ventaReclu;
							color	  = 'red';
						}
						retencion 	= 0.0;
						total 		= 0.0;                     	
						lines = _icf_tablas_isr.length;

						for(l =0;l<lines;l++){
							_tablas_isr_limite_inferior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_inferior'));
							_tablas_isr_limite_superior 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_limite_superior'));
							_tablas_isr_cuota_fija 			= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_cuota_fija'));
							_tablas_isr_porc_limite_inferi 	= returnNumber(_icf_tablas_isr[l].getValue('custrecord_tablas_isr_porc_limite_inferi'));

							if(subtotal >= _tablas_isr_limite_inferior   && subtotal <= _tablas_isr_limite_superior  ) {
								total = (subtotal - _tablas_isr_cuota_fija) - (subtotal - _tablas_isr_limite_inferior) * (_tablas_isr_porc_limite_inferi/100);
								break;
							}
						}
						ventaRecluT 		= currencyFormat(ventaReclu,2);
						ventaRecluT 		= ventaRecluT.toString();
						ventaRecluT  	= ventaRecluT.fontcolor(color);
						retencion 		= subtotal - total;
						subtotal 		= returnNumber(subtotal);
						retencion 		= returnNumber(retencion);
						total 			= returnNumber(total);
						num_emp 			= stringToArray(nomEmp, 32);
						lineNumber  		= new Number(linea);
						lineNumber.toString();
						data_imprimir_gtm = {};
						data_imprimir_gtm.ec				= ec;
						data_imprimir_gtm.fc				= fc;
						data_imprimir_gtm.id_emp	  		= _id_empleado_gtm;
						data_imprimir_gtm.mode				= 'imprimir';
						data_imprimir_gtm.name				= nomEmp;
						data_imprimir_gtm = JSON.stringify(data_imprimir_gtm);
						data_imprimir_gtm = Base64.encode(data_imprimir_gtm);
						url_imprimir_gtm = url + "&data=" + data_imprimir_gtm;
						data_enviar_gtm 	= {};
						data_enviar_gtm.ec = ec;
						data_enviar_gtm.fc				    = fc;
						data_enviar_gtm.id_emp				= _id_empleado_gtm;
						data_enviar_gtm.mode				= 'enviar';
						data_enviar_gtm.rec_id				= recordId;
						data_enviar_gtm 	= JSON.stringify(data_enviar_gtm);
						data_enviar_gtm 	= Base64.encode(data_enviar_gtm);
						url_enviar_gtm 	= (_email_empleado_gtm != '') ? (url + "&data=" + data_enviar_gtm):'';
						data_enviar_aux_gtm = {};
						data_enviar_aux_gtm.ec				= ec;
						data_enviar_aux_gtm.fc				= fc;
						data_enviar_aux_gtm.id_emp			= _id_empleado_gtm;
						data_enviar_aux_gtm.mode			= 'enviar';
						data_enviar_aux_gtm.rec_id			= recordId;
						data_enviar_aux_gtm = JSON.stringify(data_enviar_aux_gtm);
						data_enviar_aux_gtm = Base64.encode(data_enviar_aux_gtm);
						data_enviar_aux_gtm = (_email_empleado_gtm != '') ? data_enviar_aux_gtm:'';
						detalleComisionesSublist.setLineItemValue('custpage_det_linea', linea, lineNumber);
						detalleComisionesSublist.setLineItemValue('custpage_det_comision', linea, '');
						detalleComisionesSublist.setLineItemValue('custpage_det_internal_id_empleado', linea,_id_empleado_gtm);
						detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', linea, num_emp[0]);
						detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado_text', linea,nomEmp);
						detalleComisionesSublist.setLineItemValue('custpage_det_numero_cuenta', linea,_numcta);
						detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', linea, nomEmp);
						detalleComisionesSublist.setLineItemValue('custpage_det_email_empleado', linea,_email_empleado_gtm);
						detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', linea,0);
						detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', linea, _gtm_no_ventas_periodo );
						detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', linea,0);
						detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', linea, ventaRecluT);
						detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', linea, currencyFormat(subtotal,2));
						detalleComisionesSublist.setLineItemValue('custpage_det_retencion', linea, currencyFormat(retencion,2));
						detalleComisionesSublist.setLineItemValue('custpage_det_total',linea, currencyFormat(total,2));
						detalleComisionesSublist.setLineItemValue('custpage_det_imprimir', linea, url_imprimir_gtm);
						detalleComisionesSublist.setLineItemValue('custpage_det_enviar', linea, url_enviar_gtm);
						detalleComisionesSublist.setLineItemValue('custpage_det_enviar_aux', linea, data_enviar_aux_gtm);
						linea++;
					}
				}
			}
		}
	} catch(e) {
		var tituloFallo		= '';
		var mensajeFallo	= '';
		var dataFallo		= {};
		var identacion		= '<td>&nbsp;</td><td>&nbsp;</td><td>á�…</td>';

		if ( e instanceof nlobjError ) {
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
		} else {
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
		dataFallo.titleForm  = titleForm;
		dataFallo.exito		  = 'F';
		dataFallo.tituloFallo = tituloFallo;
		dataFallo.mensajeFallo  = mensajeFallo;
		dataFallo 			= JSON.stringify(dataFallo);
		dataFallo   		  = Base64.encode(dataFallo);
		var params_handler_error			= [];
		params_handler_error['data']	= dataFallo;
		nlapiSetRedirectURL('SUITELET','customscript_imp_rep_com_form_he', 'customdeploy_imp_rep_com_form_he', false, params_handler_error);
		nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
	}
}

function popArrayValue(array,value) {
	var l = array.length;
	var a = [];
	var c =0;

	for(var i=0;i<l;i++) {
		if(value != array[i]) {
			a[c] = array[i];
			c++;
		}
	}
	return a;
}
