//Elimina elementos duplicados de un arreglo
function deleteDuplicateElementsByID(value)
{
    var lon = value.length;
    var i =0;
    var resultados = new Array();
    for(var cont=lon-1;cont>0;cont--)
    {
        if(value[cont].getId()!=value[cont-1].getId())
         { resultados[i]=value[cont]; i++; }              
    }
    resultados[i]=value[0];
    resultados.reverse();
    return resultados;
}
//Helper, elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
//Helper, return 0 when NaN or nullƒ
function returnZero(value)
{	
	if (value == null || value == NaN)
		return 0;
	else 
		return value;
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
//helper, convierte las series en un arreglo.
function stringToArray(str,base)
{
     var multiSelectStringArray = str.split(String.fromCharCode(base));
     return multiSelectStringArray;
}
function calcularComisiones(type,name)
{
	if(type!='delete')
	{
		var tipoVenta = returnZero(nlapiGetFieldValue('custbody_tipo_venta'));
		if(tipoVenta==2 || tipoVenta==1)//Venta TM o TM Ganada
		{
			var totalAPagar = parseFloat(nlapiGetFieldValue('custbody_total_a_pagar'));
			var total 		= parseFloat(nlapiGetFieldValue('total'));
			var porcentaje  = 0.0;
			if(tipoVenta==2)
			{
				 if(totalAPagar<=0)
				 { porcentaje=1; }
				 else
				 { porcentaje 	= 1 - (parseFloat(totalAPagar)/parseFloat(total)); }
				 //if(porcentaje==0) { porcentaje=1; }
				  
			}
			if(tipoVenta==1){ porcentaje 	= 1  ;}
			if((type!='xedit' && porcentaje>=0.90))
			{
				var salesRep     = returnBlank(nlapiGetFieldValue('salesrep'));
				var salesRepText = returnBlank(nlapiGetFieldText('salesrep'));
				var entity       = returnBlank(nlapiGetFieldValue('entity'));
			    var factFec 	 = nlapiStringToDate(nlapiGetFieldValue('trandate'));
			    //var factFecAUX   = nlapiStringToDate(nlapiGetFieldValue('trandate'));
				var factId 	     = nlapiGetRecordId();
			    var fc = '',fcNonZero = '',serie_tm = new String();
			 	var filtersResCom          = new Array(),columnsResCom = new Array(),resultsResCom = new Array(); 
			 	var filtersResComSup       = new Array(),columnsResComSup = new Array(),resultsResComSup = new Array();
			 	var filtersResComRec       = new Array(),columnsResComRec = new Array(),resultsResComRec = new Array();
			 	var filtersResComSplit     = new Array(),columnsResComSplit = new Array(),resultsResComSplit = new Array(); 
				var cantVenta    = 0,cont=0;	
				var factFecMS    = factFec.getTime();	
				var factFecM     = parseFloat(factFec.getMonth())+1;
				var factFecY     = factFec.getFullYear();
				//var factFecD     = factFec.getDate();
				var filtersFC    = new nlobjSearchFilter('custrecord_year', null, 'equalto', factFecY);
				var columnsFC    = new Array();
					columnsFC[0] = new nlobjSearchColumn('custrecord_mes_1');
					columnsFC[1] = new nlobjSearchColumn('custrecord_mes_2');
					columnsFC[2] = new nlobjSearchColumn('custrecord_mes_3');
					columnsFC[3] = new nlobjSearchColumn('custrecord_mes_4');
					columnsFC[4] = new nlobjSearchColumn('custrecord_mes_5');
					columnsFC[5] = new nlobjSearchColumn('custrecord_mes_6');
					columnsFC[6] = new nlobjSearchColumn('custrecord_mes_7');
					columnsFC[7] = new nlobjSearchColumn('custrecord_mes_8');
					columnsFC[8] = new nlobjSearchColumn('custrecord_mes_9');
					columnsFC[9] = new nlobjSearchColumn('custrecord_mes_10');
					columnsFC[10] = new nlobjSearchColumn('custrecord_mes_11');
					columnsFC[11] = new nlobjSearchColumn('custrecord_mes_12');
					columnsFC[12] = new nlobjSearchColumn('custrecord_year');
				var resultsFechasCorte = returnBlank(nlapiSearchRecord('customrecord_fechas_corte_comisiones', null, filtersFC, columnsFC));
				if(resultsFechasCorte!='')
				{
					var diaActualFechasCorte = resultsFechasCorte[0].getValue(('custrecord_mes_'+factFecM));
					var fechaActualFechasCorte = new Date(factFecY, (factFecM-1), diaActualFechasCorte);
					var mesActualFechasCorte = fechaActualFechasCorte.getMonth()+1;
					var diaSignteFechasCorte = resultsFechasCorte[0].getValue(('custrecord_mes_'+(parseFloat(factFecM)+1)));
					var fechaSignteFechasCorte = new Date(factFecY, (factFecM), diaSignteFechasCorte);
					var mesSignteFechasCorte = fechaSignteFechasCorte.getMonth()+1;
					if(mesActualFechasCorte != mesSignteFechasCorte)
					{
						if(factFecMS<=fechaActualFechasCorte.getTime())
						{
							var mesActualFechasCorte = parseFloat(fechaActualFechasCorte.getMonth())+1;
							if(mesActualFechasCorte<10) { fc = '0'+mesActualFechasCorte+'/'+fechaActualFechasCorte.getFullYear(); }
							else { fc = mesActualFechasCorte+'/'+fechaActualFechasCorte.getFullYear(); }
							fcNonZero = mesActualFechasCorte+'/'+fechaActualFechasCorte.getFullYear();
						}
						else
						{
							if(factFecMS<=fechaSignteFechasCorte.getTime())
							{
								var mesSignteFechasCorte =parseFloat(fechaSignteFechasCorte.getMonth())+1;
								if(mesSignteFechasCorte<10) { fc = '0'+mesSignteFechasCorte+'/'+fechaSignteFechasCorte.getFullYear();}
								else { fc = mesSignteFechasCorte+'/'+fechaSignteFechasCorte.getFullYear(); }
								fcNonZero = mesSignteFechasCorte+'/'+fechaSignteFechasCorte.getFullYear();
							}
						}
					}
					else
					{
						if(factFecMS<=fechaActualFechasCorte.getTime()) 
						{
							fc = '12/' + ( parseFloat(fechaSignteFechasCorte.getFullYear()));
							fcNonZero = '12/' + ( parseFloat(fechaSignteFechasCorte.getFullYear()));	
						}
						else
						{
							var filtersFCSgte = new nlobjSearchFilter('custrecord_year', null, 'equalto', factFecY+1);
							var columnsFCSgte = new Array();
							var resultsFechasCorteSgte = new Array();
							columnsFCSgte[0] = new nlobjSearchColumn('custrecord_mes_1');
							columnsFCSgte[1] = new nlobjSearchColumn('custrecord_mes_2');
							columnsFCSgte[2] = new nlobjSearchColumn('custrecord_mes_3');
							columnsFCSgte[3] = new nlobjSearchColumn('custrecord_mes_4');
							columnsFCSgte[4] = new nlobjSearchColumn('custrecord_mes_5');
							columnsFCSgte[5] = new nlobjSearchColumn('custrecord_mes_6');
							columnsFCSgte[6] = new nlobjSearchColumn('custrecord_mes_7');
							columnsFCSgte[7] = new nlobjSearchColumn('custrecord_mes_8');
							columnsFCSgte[8] = new nlobjSearchColumn('custrecord_mes_9');
							columnsFCSgte[9] = new nlobjSearchColumn('custrecord_mes_10');
							columnsFCSgte[10] = new nlobjSearchColumn('custrecord_mes_11');
							columnsFCSgte[11] = new nlobjSearchColumn('custrecord_mes_12');
							columnsFCSgte[12] = new nlobjSearchColumn('custrecord_year');
							resultsFechasCorteSgte = returnBlank(nlapiSearchRecord('customrecord_fechas_corte_comisiones', null, filtersFCSgte, columnsFCSgte));
							if(resultsFechasCorteSgte!='')
							{
								fc = '01/'+resultsFechasCorteSgte[0].getValue('custrecord_year');
								fcNonZero = '1/'+resultsFechasCorteSgte[0].getValue('custrecord_year');
							}
						}
					}
					for(var i=0;i<nlapiGetLineItemCount('item');i++)
					{
						var item	= nlapiGetLineItemValue('item','item',i+1);
						if(item == 764 ||item == 992)
						{
							cantVenta 	  += parseFloat(nlapiGetLineItemValue('item','quantity',i+1));
				            serie_tm_aux  = returnBlank(nlapiGetLineItemValue('item','serialnumbers',i+1));
				            if(serie_tm_aux=='') { serie_tm  += ('-' + String.fromCharCode(5));  }
				            else { serie_tm  += nlapiGetLineItemValue('item','serialnumbers',i+1); }
						}
					}
				    if(salesRep!='' && cantVenta!=0 && fc!='')
				    {
				    	var series_tm = stringToArray(serie_tm,5);
				    	var filtersEmp = new nlobjSearchFilter('internalid', null, 'is', salesRep);
						var columnsEmp = new Array();
							columnsEmp[0] = new nlobjSearchColumn('custentity_reclutadora');
							columnsEmp[1] = new nlobjSearchColumn('employeetype','custentity_reclutadora');
							columnsEmp[2] = new nlobjSearchColumn('custentity_promocion','custentity_reclutadora');
							columnsEmp[3] = new nlobjSearchColumn('custentity_fecha_inicio_split');
							columnsEmp[4] = new nlobjSearchColumn('custentity_fecha_fin_split');
							columnsEmp[5] = new nlobjSearchColumn('custentity_fin_objetivo_2');
							columnsEmp[6] = new nlobjSearchColumn('hiredate');
							columnsEmp[7] = new nlobjSearchColumn('custentity_cuenta_bancaria');
							columnsEmp[8] = new nlobjSearchColumn('custentity_nombre_unidad','custentity_reclutadora');
							columnsEmp[9] = new nlobjSearchColumn('custentity72');
							columnsEmp[10] = new nlobjSearchColumn('custentity_fin_objetivo_2_reactivacion');
						var resultsEmp 		= returnBlank(nlapiSearchRecord('employee', null, filtersEmp, columnsEmp));
				        var catEmp 			= parseFloat(nlapiGetFieldValue('custbody_jerarquia'));
				        var esquema 		= parseFloat(nlapiGetFieldValue('custbody_esquema'));
				        var esquemaNaN		= isNaN(esquema);
				        var nombreUnidad 	= returnBlank(nlapiGetFieldValue('custbody_nombre_unidad'));
				        var nomUnidadSplit  = returnBlank(nlapiGetFieldValue('custbody_nombre_unidad_split'));
				        var reclu  			= returnBlank(resultsEmp[0].getValue('custentity_reclutadora'));
				        //var recluText 		= returnBlank(resultsEmp[0].getText('custentity_reclutadora'));
				        var recluCatEmp		= returnBlank(resultsEmp[0].getValue('employeetype','custentity_reclutadora'));
				        var recluEsqEmp		= returnBlank(resultsEmp[0].getValue('custentity_promocion','custentity_reclutadora'));
				        var recluNomUniEmp  = returnBlank(resultsEmp[0].getValue('custentity_nombre_unidad','custentity_reclutadora'));
				        var fechaAlta 		= returnBlank(resultsEmp[0].getValue('hiredate'));
				        var fechaReact 		= returnBlank(resultsEmp[0].getValue('custentity72'));
				        if(fechaAlta!='')    { fechaAlta = nlapiStringToDate(fechaAlta); }
				        if(fechaReact!='')    { fechaReact = nlapiStringToDate(fechaReact); }
				        var fechaFinObj2	= returnBlank(resultsEmp[0].getValue('custentity_fin_objetivo_2'));
				        var fechaFinObj2Re	= returnBlank(resultsEmp[0].getValue('custentity_fin_objetivo_2_reactivacion'));
						if(fechaFinObj2!='') { fechaFinObj2 = nlapiStringToDate(fechaFinObj2); }
						if(fechaFinObj2Re!='') { fechaFinObj2Re = nlapiStringToDate(fechaFinObj2Re); }
				        var cuentaBancaria  = returnBlank(resultsEmp[0].getValue('custentity_cuenta_bancaria'));
				        var jdgSplit 		= returnBlank(nlapiGetFieldValue('custbody_jefa_grupo_split'));
				        var jdgSplitText	= returnBlank(nlapiGetFieldText('custbody_jefa_grupo_split'));
				        var supervisor		= returnBlank(nlapiGetFieldValue('custbody_jefa_grupo'));
				        var supervisorText 	= returnBlank(nlapiGetFieldText('custbody_jefa_grupo'));
				        var fis				= returnBlank((resultsEmp[0].getValue('custentity_fecha_inicio_split')));
				        if(fis!='') { fis = nlapiStringToDate(fis); }
				        var ffs				= returnBlank(resultsEmp[0].getValue('custentity_fecha_fin_split'));
				        if(ffs!='') { ffs = nlapiStringToDate(ffs); }
				        var aplicadaGTM		= returnBlank(nlapiGetFieldValue('custbody_comision_aplicada_gtm'));
				        var aplicadaJDG		= returnBlank(nlapiGetFieldValue('custbody_comision_aplicada_jdg'));
				        var aplicadaPRE		= returnBlank(nlapiGetFieldValue('custbody_comision_aplicada_pre'));
				        var aplicadaREC		= returnBlank(nlapiGetFieldValue('custbody_comision_aplicada_rec'));
				        var aplicadaJDG_Split = returnBlank(nlapiGetFieldValue('custbody_comision_aplicada_jdg_split'));
				        var aplicadaJDG_Super = returnBlank(nlapiGetFieldValue('custbody_comision_aplicada_jdg_super'));
				        var gtmId = 0, jdgId = 0, preId = 0, recId = 0, jdgIdSplit = 0, jdgIdSup = 0;  
				        if(esquema==1 && tipoVenta==2)
				        {
				        	if(aplicadaGTM=='')
				        	{
				        		if(fechaFinObj2!='')
							    {
				        			if(factFecMS<=fechaFinObj2.getTime())
				        			{
						    	        var fileGanateTM = nlapiLoadFile(278);
								        var ReglasGanateTM = fileGanateTM.getValue();	
									        ReglasGanateTM = ReglasGanateTM.split(String.fromCharCode(10));  
									        ReglasGanateTM.pop();
										var ventasTotalesGTM = 0;
										var importeAcumulado = 0;
										var cantVentaPeriodo = 0;
						        		if(fechaAlta!='')
										{ 
											var fechaAltaMS 	= parseFloat(fechaAlta.getTime());
											var fc_complete = fechaAlta.getDate()+ '/' +fcNonZero;
												fc_complete = nlapiStringToDate(fc_complete);
											var fc_completeMS	= parseFloat(fc_complete.getTime());
											while(fc_completeMS>=fechaAltaMS)
											{
												var fcAux = (parseFloat(fc_complete.getMonth()) + 1) + '/' + fc_complete.getFullYear();
													fcAux = fcAux.split('/');
												if(parseFloat(fcAux[0])<10) { fcAux[0] = '0'+fcAux[0];}
												fcAux = fcAux.join('/');
												var	filtersResComAux = new Array();
													filtersResComAux[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'is', salesRep);
										        	filtersResComAux[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fcAux);
												var columnsResComAux = new Array();
													columnsResComAux[0] = new nlobjSearchColumn('custrecord_gtm_no_ventas_totales');
													columnsResComAux[1] = new nlobjSearchColumn('custrecord_gtm_no_ventas_periodo');
													columnsResComAux[2] = new nlobjSearchColumn('custrecord_gtm_total_comisiones');
												var resultsResComAux = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filtersResComAux, columnsResComAux));
												if(resultsResComAux!='')
												{
													cantVentaPeriodo = parseFloat(resultsResComAux[0].getValue('custrecord_gtm_no_ventas_periodo'));
													ventasTotalesGTM = parseFloat(resultsResComAux[0].getValue('custrecord_gtm_no_ventas_totales'));
													if(ventasTotalesGTM==5)
													{
														nlapiSubmitField('employee',salesRep,'custentity_promocion',2);
														var filtersResComRec_GTM	= new Array();
															filtersResComRec_GTM[0] = new nlobjSearchFilter('custrecord_rec_reclutadora', null, 'is', salesRep);
															filtersResComRec_GTM[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc);
															filtersResComRec_GTM[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora', null, 'is', 1);
														var columnsResComRec_GTM	= new Array();
															columnsResComRec_GTM[0] = new nlobjSearchColumn('custrecord_rec_reclutadora');
															columnsResComRec_GTM[1] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
															columnsResComRec_GTM[2] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
														var resultsResComRec_GTM	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComRec_GTM, columnsResComRec_GTM));
														if(resultsResComRec_GTM != '')
														{
															var resultsResComRec_GTM_IDS = new Array();
															for(var i=0;i<resultsResComRec_GTM.length;i++)
															{
																resultsResComRec_GTM_IDS[i] = resultsResComRec_GTM[i].getId();
																nlapiSubmitField('customrecord_comisiones_rec', resultsResComRec_GTM_IDS[i], 'custrecord_rec_esquema_reclutadora', 2);
															}
														}	
													}
													importeAcumulado = (parseFloat(resultsResComAux[0].getValue('custrecord_gtm_total_comisiones')));
													break;
												}
												fc_complete = nlapiAddMonths(fc_complete,(-1));
												fc_completeMS	= parseFloat(fc_complete.getTime());
											}
										} 
							        	filtersResCom[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'is', salesRep);
							        	filtersResCom[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fc);
										columnsResCom[0] = new nlobjSearchColumn('custrecord_gtm_no_ventas_totales');
										columnsResCom[1] = new nlobjSearchColumn('custrecord_gtm_no_ventas_periodo');
										columnsResCom[2] = new nlobjSearchColumn('custrecord_gtm_fecha_comision');
										resultsResCom = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filtersResCom, columnsResCom));
								        if(resultsResCom=='')
								        {
								        	if(ventasTotalesGTM<6)
								        	{
									        	var ReglaVentaGanateTM = ReglasGanateTM[cantVenta+ventasTotalesGTM].split(String.fromCharCode(44));   
									        	var newRecComisionesGTM = nlapiCreateRecord('customrecord_comisiones_gtm');
									                newRecComisionesGTM.setFieldValue('custrecord_gtm_empleado',salesRep);
									                newRecComisionesGTM.setFieldValue('custrecord_gtm_nombre_empleado',salesRepText);
									                newRecComisionesGTM.setFieldValue('custrecord_gtm_cuenta_bancaria',cuentaBancaria);
									                newRecComisionesGTM.setFieldValue('custrecord_gtm_nombre_unidad',nombreUnidad);
									                newRecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_totales',cantVenta+ventasTotalesGTM);
												    newRecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_periodo',cantVenta);
												    newRecComisionesGTM.setFieldValue('custrecord_gtm_puesta_marcha',parseFloat(ReglaVentaGanateTM[2]));
												    newRecComisionesGTM.setFieldValue('custrecord_gtm_total_comisiones',(parseFloat(ReglaVentaGanateTM[1])));
												    newRecComisionesGTM.setFieldValue('custrecord_gtm_fecha_comision',fc);
												    newRecComisionesGTM.setFieldValue('custrecord_gtm_bono_manual',0.0);
												var newRecComisionesGTMId = nlapiSubmitRecord(newRecComisionesGTM);
												gtmId= newRecComisionesGTMId;
												for(cont=0;cont<cantVenta;cont++)
												{
										        	var newRecComisionesDetGTM = nlapiCreateRecord('customrecord_comisiones_gtm_det');
											        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_empleado_id',salesRep);
											        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_comision_gtm_id',newRecComisionesGTMId);
											        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_factura',factId);
											        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_serie_tm',series_tm[cont]);
											        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_venta_realizada_por',salesRep);
											        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_cliente',entity);
										        	nlapiSubmitRecord(newRecComisionesDetGTM);
										        }
												if(ventasTotalesGTM==5)
												{
													nlapiSubmitField('employee',salesRep,'custentity_promocion',2);
													var filtersResComRec_GTM	= new Array();
														filtersResComRec_GTM[0] = new nlobjSearchFilter('custrecord_rec_reclutadora', null, 'is', salesRep);
														filtersResComRec_GTM[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc);
														filtersResComRec_GTM[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora', null, 'is', 1);
													var columnsResComRec_GTM	= new Array();
														columnsResComRec_GTM[0] = new nlobjSearchColumn('custrecord_rec_reclutadora');
														columnsResComRec_GTM[1] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
														columnsResComRec_GTM[2] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
													var resultsResComRec_GTM	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComRec_GTM, columnsResComRec_GTM));
													if(resultsResComRec_GTM != '')
													{
														var resultsResComRec_GTM_IDS = new Array();
														for(var i=0;i<resultsResComRec_GTM.length;i++)
														{
															resultsResComRec_GTM_IDS[i] = resultsResComRec_GTM[i].getId();
															nlapiSubmitField('customrecord_comisiones_rec', resultsResComRec_GTM_IDS[i], 'custrecord_rec_esquema_reclutadora', 2);
														}
													}						
												}
											}
								        }
								        else
							       		{
								        	if(ventasTotalesGTM<6)
								        	{
									        	var ReglaVentaGanateTM = ReglasGanateTM[parseFloat(ventasTotalesGTM)+(cantVenta)].split(String.fromCharCode(44));
								        		var RecComisionesGTM = nlapiLoadRecord('customrecord_comisiones_gtm',resultsResCom[0].getId());
								        			RecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_totales',parseFloat(ventasTotalesGTM)+parseFloat(cantVenta));
								        			RecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_periodo',parseFloat(cantVenta)+parseFloat(cantVentaPeriodo));
								        			RecComisionesGTM.setFieldValue('custrecord_gtm_puesta_marcha',parseFloat(ReglaVentaGanateTM[2]));
								        			RecComisionesGTM.setFieldValue('custrecord_gtm_total_comisiones',(parseFloat(ReglaVentaGanateTM[1])) + parseFloat(importeAcumulado));
										        var RecComisionesGTMId = nlapiSubmitRecord(RecComisionesGTM);	
										        gtmId = RecComisionesGTMId;
												for(cont=0;cont<cantVenta;cont++)
												{
										        	var RecComisionesDetGTM = nlapiCreateRecord('customrecord_comisiones_gtm_det');
											        	RecComisionesDetGTM.setFieldValue('custrecord_gtm_det_empleado_id',salesRep);
											        	RecComisionesDetGTM.setFieldValue('custrecord_gtm_det_comision_gtm_id',RecComisionesGTMId);
											        	RecComisionesDetGTM.setFieldValue('custrecord_gtm_det_factura',factId);
											        	RecComisionesDetGTM.setFieldValue('custrecord_gtm_det_serie_tm',series_tm[cont]);
											        	RecComisionesDetGTM.setFieldValue('custrecord_gtm_det_venta_realizada_por',salesRep);
											        	RecComisionesDetGTM.setFieldValue('custrecord_gtm_det_cliente',entity);
										        	nlapiSubmitRecord(RecComisionesDetGTM);
												}
												if(ventasTotalesGTM==5)
												{
													nlapiSubmitField('employee',salesRep,'custentity_promocion',2);
													var filtersResComRec_GTM	= new Array();
														filtersResComRec_GTM[0] = new nlobjSearchFilter('custrecord_rec_reclutadora', null, 'is', salesRep);
														filtersResComRec_GTM[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc);
														filtersResComRec_GTM[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora', null, 'is', 1);
													var columnsResComRec_GTM	= new Array();
														columnsResComRec_GTM[0] = new nlobjSearchColumn('custrecord_rec_reclutadora');
														columnsResComRec_GTM[1] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
														columnsResComRec_GTM[2] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
													var resultsResComRec_GTM	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComRec_GTM, columnsResComRec_GTM));
													if(resultsResComRec_GTM != '')
													{
														var resultsResComRec_GTM_IDS = new Array();
														for(var i=0;i<resultsResComRec_GTM.length;i++)
														{
															resultsResComRec_GTM_IDS[i] = resultsResComRec_GTM[i].getId();
															nlapiSubmitField('customrecord_comisiones_rec', resultsResComRec_GTM_IDS[i], 'custrecord_rec_esquema_reclutadora', 2);
														}
													}	
												}
											}
										}
						            	if(gtmId!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_gtm',('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_gtm', gtmId, false))); }
									}
								}
					        }
					    };
				        if(esquema==2)
				        {
					        switch(catEmp)
					        {
					        	case 3: //Jefa de Grupo
					        	{
					        		if(aplicadaJDG==''&& (tipoVenta==2 || tipoVenta==1))
					        		{
					        		    var file_fidelidad_propio = new Object();
                                        var ReglasFidelidadPropio = '';
					        		    var indexArchivos        = 0;
                                        var fechaCambioComp      = '23/'+fcNonZero;
                                            fechaCambioComp      = nlapiStringToDate(fechaCambioComp);
                                        var fechaCambioCompMS    = fechaCambioComp.getTime();
                                        //1335164400000 = 23/4/2012
                                        if(fechaCambioCompMS <= 1335164400000)
                                        {
                                            indexArchivos = 1;
                                        }
                                        if(fechaCambioCompMS >= 1335164400001)
                                        {
                                            indexArchivos = 2;
                                        }
                                        switch(indexArchivos)
                                        {
                                            case 1:
                                            {
                                                file_fidelidad_propio = nlapiLoadFile(138921);
                                                ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                                                ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                                                ReglasFidelidadPropio.pop();   
                                            };break;
                                            case 2:
                                            {
                                                file_fidelidad_propio = nlapiLoadFile(277);
                                                ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                                                ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                                                ReglasFidelidadPropio.pop(); 
                                            };break;
                                            default:
                                            {
                                                
                                            };break;
                                        }
							        	filtersResCom[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', salesRep);
							        	filtersResCom[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc);
										columnsResCom[0] = new nlobjSearchColumn('custrecord_jdg_no_ventas_propio');
										columnsResCom[1] = new nlobjSearchColumn('custrecord_jdg_fecha_comision');
										resultsResCom = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResCom, columnsResCom));
								        if(resultsResCom=='')
								        {
								        	var ReglaVentaFidelidadPropio = ReglasFidelidadPropio[cantVenta].split(String.fromCharCode(44));   
								        	var newRecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');
								                newRecComisionesJdG.setFieldValue('custrecord_jdg_empleado',salesRep);
								                newRecComisionesJdG.setFieldValue('custrecord_jdg_nombre_empleado',salesRepText);
								                newRecComisionesJdG.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
								                newRecComisionesJdG.setFieldValue('custrecord_jdg_nombre_unidad',nombreUnidad);
											    newRecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',ReglaVentaFidelidadPropio[0]);
											    newRecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',ReglaVentaFidelidadPropio[5]);
											    newRecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',0);
					    					    newRecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',0);
											    newRecComisionesJdG.setFieldValue('custrecord_jdg_fecha_comision',fc);
											    newRecComisionesJdG.setFieldValue('custrecord_jdg_bono_manual',0.0);
											var newRecComisionesJdGId = nlapiSubmitRecord(newRecComisionesJdG);
											jdgId = newRecComisionesJdGId;
											for(cont=0;cont<cantVenta;cont++)
											{
									        	var newRecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
									        		newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',salesRep);
										        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',newRecComisionesJdGId);
										        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',factId);
										        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',series_tm[cont]);
										        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
										        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
									        	nlapiSubmitRecord(newRecComisionesDetJdG);	
											}
								        }
								        else
								        {
								        	//nlapiLogExecution('DEBUG','cantVenta',cantVenta);
								        	//nlapiLogExecution('DEBUG',"parseFloat(resultsResCom[0].getValue('custrecord_jdg_no_ventas_propio')",parseFloat(resultsResCom[0].getValue('custrecord_jdg_no_ventas_propio')));
								        	var ReglaVentaFidelidadPropio = ReglasFidelidadPropio[parseFloat(resultsResCom[0].getValue('custrecord_jdg_no_ventas_propio'))+(cantVenta)].split(String.fromCharCode(44));   
							        		var RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResCom[0].getId());
									            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',ReglaVentaFidelidadPropio[0]);
									            RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',ReglaVentaFidelidadPropio[5]);
									        var RecComisionesJdGId = nlapiSubmitRecord(RecComisionesJdG);
									        jdgId = RecComisionesJdGId;
											for(cont=0;cont<cantVenta;cont++)
											{
												var RecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
									        		RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',salesRep);
										        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',RecComisionesJdGId);
										        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',factId);
										        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',series_tm[cont]);
										        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
										        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
									        	nlapiSubmitRecord(RecComisionesDetJdG);
											}
								        }
						            	//if(jdgId!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_jdg',('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg', jdgId, false))); }
						            	if(jdgId!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_jdg',('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg', jdgId, false))); }
							    	}
						        };break;
					        	case 1: //Presentadora
					        	{
					        		if(aplicadaPRE=='' && tipoVenta==2)
					        		{
								        var file_fidelidad_propio = new Object();
                                        var ReglasFidelidadPropio = '';
                                        var indexArchivos        = 0;
                                        var fechaCambioComp      = '23/'+fcNonZero;
                                            fechaCambioComp      = nlapiStringToDate(fechaCambioComp);
                                        var fechaCambioCompMS    = fechaCambioComp.getTime();
                                        //1335164400000 = 23/4/2012
                                        if(fechaCambioCompMS <= 1335164400000)
                                        {
                                            indexArchivos = 1;
                                        }
                                        if(fechaCambioCompMS >= 1335164400001)
                                        {
                                            indexArchivos = 2;
                                        }
                                        switch(indexArchivos)
                                        {
                                            case 1:
                                            {
                                                file_fidelidad_propio = nlapiLoadFile(138921);
                                                ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                                                ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                                                ReglasFidelidadPropio.pop();   
                                            };break;
                                            case 2:
                                            {
                                                file_fidelidad_propio = nlapiLoadFile(277);
                                                ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                                                ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                                                ReglasFidelidadPropio.pop(); 
                                            };break;
                                            default:
                                            {
                                                
                                            };break;
                                        }
						            	filtersResCom[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', salesRep);
						            	filtersResCom[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc);
						     			columnsResCom[0] = new nlobjSearchColumn('custrecord_pre_no_ventas');
						     			columnsResCom[1] = new nlobjSearchColumn('custrecord_pre_fecha_comision');
						     			resultsResCom = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filtersResCom, columnsResCom));
						     	        if(resultsResCom=='')
						     	        {
						     	        	var ReglaVentaFidelidadPropio = ReglasFidelidadPropio[cantVenta].split(String.fromCharCode(44));   
						     	        	var newRecComisionesPre = nlapiCreateRecord('customrecord_comisiones_pre');
						     	                newRecComisionesPre.setFieldValue('custrecord_pre_empleado',salesRep);
						     	                newRecComisionesPre.setFieldValue('custrecord_pre_nombre_empleado',salesRepText);
						     	                newRecComisionesPre.setFieldValue('custrecord_pre_cuenta_bancaria',cuentaBancaria);
						     	                newRecComisionesPre.setFieldValue('custrecord_pre_nombre_unidad',nombreUnidad);
						     				    newRecComisionesPre.setFieldValue('custrecord_pre_no_ventas',ReglaVentaFidelidadPropio[0]);
						     				    newRecComisionesPre.setFieldValue('custrecord_pre_total_comisiones',ReglaVentaFidelidadPropio[5]);
						     				    newRecComisionesPre.setFieldValue('custrecord_pre_fecha_comision',fc);
						     				    newRecComisionesPre.setFieldValue('custrecord_pre_bono_manual',0.0);
						     				var newRecComisionesPreId = nlapiSubmitRecord(newRecComisionesPre);
						     				preId = newRecComisionesPreId;
											for(cont=0;cont<cantVenta;cont++)
											{
												var newRecComisionesDetPre = nlapiCreateRecord('customrecord_comisiones_pre_det');
						     		        		newRecComisionesDetPre.setFieldValue('custrecord_pre_det_comision_pre_id',newRecComisionesPreId);
						     		        		newRecComisionesDetPre.setFieldValue('custrecord_pre_det_empleado_id',salesRep);
						     		        		newRecComisionesDetPre.setFieldValue('custrecord_pre_det_factura',factId);
										        	newRecComisionesDetPre.setFieldValue('custrecord_pre_det_serie_tm',series_tm[cont]);
							     		        	newRecComisionesDetPre.setFieldValue('custrecord_pre_det_venta_realizada_por',salesRep);
							     		        	newRecComisionesDetPre.setFieldValue('custrecord_pre_det_cliente',entity);
						     		        	nlapiSubmitRecord(newRecComisionesDetPre);
											}
						     	        }
						     	        else
						     	        {
						    	        	var ReglaVentaFidelidadPropio = ReglasFidelidadPropio[parseFloat(resultsResCom[0].getValue('custrecord_pre_no_ventas'))+(cantVenta)].split(String.fromCharCode(44));   
						            		var RecComisionesPre = nlapiLoadRecord('customrecord_comisiones_pre',resultsResCom[0].getId());
						     	        		RecComisionesPre.setFieldValue('custrecord_pre_no_ventas',ReglaVentaFidelidadPropio[0]);
						     	        		RecComisionesPre.setFieldValue('custrecord_pre_total_comisiones',ReglaVentaFidelidadPropio[5]);
						    		        var RecComisionesPreId = nlapiSubmitRecord(RecComisionesPre);	
						    		        preId = RecComisionesPreId;
											for(cont=0;cont<cantVenta;cont++)
											{
							    	        	var RecComisionesDetPre = nlapiCreateRecord('customrecord_comisiones_pre_det');
							     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_comision_pre_id',RecComisionesPreId);
							     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_empleado_id',salesRep);
							     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_factura',factId);
							     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_serie_tm',series_tm[cont]);
							     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_venta_realizada_por',salesRep);
							     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_cliente',entity);
						    		        	nlapiSubmitRecord(RecComisionesDetPre);
											}
						     	        }
						            	//if(preId!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_pre',('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_pre', preId, false))); }
						            	if(preId!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_pre',('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_pre', preId, false))); }
						           }
					            };break;
					        }
						};
						if(supervisor!='' && aplicadaJDG_Super=='' && esquemaNaN==false)
						{
						    var filtersSupervisor = new nlobjSearchFilter('internalid', null, 'is', supervisor);
                            var columnsSupervisor = new Array();
                                columnsSupervisor[0] = new nlobjSearchColumn('custentity_fecha_inicio_split');
                                columnsSupervisor[1] = new nlobjSearchColumn('custentity_fecha_fin_split');
                                columnsSupervisor[2] = new nlobjSearchColumn('custentity_jefa_grupo_split');
                                columnsSupervisor[3] = new nlobjSearchColumn('hiredate');
                            var resultsSupervisor = returnBlank(nlapiSearchRecord('employee', null, filtersSupervisor, columnsSupervisor)); 
                            var fisSupervisorMS = returnBlank(resultsSupervisor[0].getValue('custentity_fecha_inicio_split'));
                            var ffsSupervisorMS = returnBlank(resultsSupervisor[0].getValue('custentity_fecha_fin_split'));
							var file_fidelidad_equipo = new Object();
						    var ReglasFidelidadEquipo = new String();
						    var fechaAltaMS       = 0;
                            var difMS             = 0;
                            var indexEquipo       = 0;
                            if(fechaAlta != '' )
                            {
                                fechaAltaMS     = fechaAlta.getTime();
                                difMS           = factFecMS - fechaAltaMS;
                                // 15768000000 = 6 Meses
                                if(difMS <= 15768000000)
                                {
                                    indexEquipo = 1;
                                }
                                // 15768000001 = 6.00000000038051750381 Meses
                                if(difMS >= 15768000001)
                                {
                                    indexEquipo = 2;
                                }
                            }
                            var indexArchivos        = 0;
                            var fechaCambioComp      = '23/'+fcNonZero;
                                fechaCambioComp      = nlapiStringToDate(fechaCambioComp);
                            var fechaCambioCompMS    = fechaCambioComp.getTime();
                            //1335164400000 = 23/4/2012
                            if(fechaCambioCompMS <= 1335164400000)
                            {
                                indexArchivos = 1;
                            }
                            if(fechaCambioCompMS >= 1335164400001)
                            {
                                indexArchivos = 2;
                            }
                            switch(indexArchivos)
                            {
                                case 1:
                                {
                                    if(fisSupervisorMS!='' && ffsSupervisorMS!='')
                                    { 
                                        fisSupervisorMS = nlapiStringToDate(fisSupervisorMS);
                                        fisSupervisorMS = fisSupervisorMS.getTime();
                                        ffsSupervisorMS = nlapiStringToDate(ffsSupervisorMS);
                                        ffsSupervisorMS = ffsSupervisorMS.getTime(); 
                                        file_fidelidad_equipo = nlapiLoadFile(138920);
                                        ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();   
                                        ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                        ReglasFidelidadEquipo.pop();
                                    }
                                    else
                                    {
                                        ffsSupervisorMS       = 0;
                                        fisSupervisorMS       = 0;
                                        file_fidelidad_equipo = nlapiLoadFile(138919);
                                        ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();   
                                        ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                        ReglasFidelidadEquipo.pop();    
                                    }   
                                };break;
                                case 2:
                                {
                                    if(fisSupervisorMS!='' && ffsSupervisorMS!='')
                                    { 
                                        fisSupervisorMS = nlapiStringToDate(fisSupervisorMS);
                                        fisSupervisorMS = fisSupervisorMS.getTime();
                                        ffsSupervisorMS = nlapiStringToDate(ffsSupervisorMS);
                                        ffsSupervisorMS = ffsSupervisorMS.getTime(); 
                                        file_fidelidad_equipo = nlapiLoadFile(276);
                                        ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();   
                                        ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                        ReglasFidelidadEquipo.pop();
                                    }
                                    else
                                    {
                                        ffsSupervisorMS       = 0;
                                        fisSupervisorMS       = 0;
                                        file_fidelidad_equipo = nlapiLoadFile(276);
                                        ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();   
                                        ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                        ReglasFidelidadEquipo.pop();    
                                    }
                                };break;
                                default:
                                {
                                    
                                };break;
                            }
                            //var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));
							var ventasDobles =1;
							if(fechaAltaMS >= fisSupervisorMS && fechaAltaMS <= ffsSupervisorMS && resultsSupervisor[0].getValue('custentity_jefa_grupo_split') == supervisor)
							{
								ventasDobles = 2;
							}
					        for(var contVentasDobles =0;contVentasDobles<ventasDobles;contVentasDobles++)
							{ 
					        	filtersResComSup[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', supervisor);
					        	filtersResComSup[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc);
								columnsResComSup[0] = new nlobjSearchColumn('custrecord_jdg_no_ventas_equipo');
								columnsResComSup[1] = new nlobjSearchColumn('custrecord_jdg_fecha_comision');
								columnsResComSup[2] = new nlobjSearchColumn('custrecord_jdg_total_comisiones_equipo');
								resultsResComSup = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResComSup, columnsResComSup));
								if(resultsResComSup=='')
						        {
						            var no_ventas_equipo            = 0;
                                    var jdg_total_comisiones_equipo = 0;
                                    switch(indexArchivos)
                                    {
                                        case 1:
                                        {
                                            var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[cantVenta].split(String.fromCharCode(44));
                                            no_ventas_equipo            = ReglaVentaFidelidadEquipo[0];
                                            jdg_total_comisiones_equipo = ReglaVentaFidelidadEquipo[3];
                                        };break;
                                        case 2:
                                        {
                                        	/*/
                                            var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));
                                            no_ventas_equipo = parseFloat(0);
                                            no_ventas_equipo++;
                                            jdg_total_comisiones_equipo = parseFloat(0);
                                            jdg_total_comisiones_equipo += parseFloat(ReglaVentaFidelidadEquipo[3]);
                                            /*/
                                        	no_ventas_equipo = 1;
                                            if(no_ventas_equipo >= 1 && no_ventas_equipo <= 6)
                                            {
                                            	jdg_total_comisiones_equipo = 0;
                                            }
                                            if(no_ventas_equipo >= 7 && no_ventas_equipo <= 14)
                                            {
                                            	jdg_total_comisiones_equipo = 8000;
                                            }
                                            if(no_ventas_equipo >= 15 && no_ventas_equipo <= 20)
                                            {
                                            	jdg_total_comisiones_equipo = 18000;
                                            }
                                            if(no_ventas_equipo >= 21 && no_ventas_equipo <= 24)
                                            {
                                            	jdg_total_comisiones_equipo = 23000;
                                            }
                                            if(no_ventas_equipo >= 25 && no_ventas_equipo <= 30)
                                            {
                                            	jdg_total_comisiones_equipo = 28000;
                                            }
                                        };break;
                                        default:
                                        {
                                            
                                        };break;
                                    }
						        	var newRecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');
						        		newRecComisionesJdG.setFieldValue('custrecord_jdg_empleado',supervisor);
						        		newRecComisionesJdG.setFieldValue('custrecord_jdg_nombre_empleado',supervisorText);
						        		newRecComisionesJdG.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
						        		newRecComisionesJdG.setFieldValue('custrecord_jdg_nombre_unidad',nombreUnidad);
						        		newRecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',0);
									    newRecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',0);
									    newRecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',no_ventas_equipo);
                                        newRecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',jdg_total_comisiones_equipo);
									    newRecComisionesJdG.setFieldValue('custrecord_jdg_fecha_comision',fc);
									    newRecComisionesJdG.setFieldValue('custrecord_jdg_bono_manual',0.0);
									var newRecComisionesJdGId = nlapiSubmitRecord(newRecComisionesJdG);
									jdgIdSup = newRecComisionesJdGId;
									for(cont=0;cont<cantVenta;cont++)
									{
				    		        	var newRecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
				    		        		newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',supervisor);
				    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',newRecComisionesJdGId);
				    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',factId);
				    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',series_tm[cont]);
				    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
				    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
							        	nlapiSubmitRecord(newRecComisionesDetJdG);
									}
						        }
						        else
						        {
						            var no_ventas_equipo            = 0;
                                    var jdg_total_comisiones_equipo = 0;
						            switch(indexArchivos)
                                    {
                                        case 1:
                                        {
                                            var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[parseFloat(resultsResComSup[0].getValue('custrecord_jdg_no_ventas_equipo'))+(cantVenta)].split(String.fromCharCode(44));
                                            no_ventas_equipo            = ReglaVentaFidelidadEquipo[0];
                                            jdg_total_comisiones_equipo = ReglaVentaFidelidadEquipo[3];
                                        };break;
                                        case 2:
                                        {
                                        	/*/
                                            var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));
                                            no_ventas_equipo = parseFloat(resultsResComSup[0].getValue('custrecord_jdg_no_ventas_equipo'));
                                            no_ventas_equipo++;
                                            jdg_total_comisiones_equipo = parseFloat(resultsResComSup[0].getValue('custrecord_jdg_total_comisiones_equipo'));
                                            jdg_total_comisiones_equipo += parseFloat(ReglaVentaFidelidadEquipo[3]);
                                            /*/
                                            
                                        	no_ventas_equipo = parseFloat(resultsResComSup[0].getValue('custrecord_jdg_no_ventas_equipo'));
                                            no_ventas_equipo++;
                                            if(no_ventas_equipo >= 1 && no_ventas_equipo <= 6)
                                            {
                                            	jdg_total_comisiones_equipo = 0;
                                            }
                                            if(no_ventas_equipo >= 7 && no_ventas_equipo <= 14)
                                            {
                                            	jdg_total_comisiones_equipo = 8000;
                                            }
                                            if(no_ventas_equipo >= 15 && no_ventas_equipo <= 20)
                                            {
                                            	jdg_total_comisiones_equipo = 18000;
                                            }
                                            if(no_ventas_equipo >= 21 && no_ventas_equipo <= 24)
                                            {
                                            	jdg_total_comisiones_equipo = 23000;
                                            }
                                            if(no_ventas_equipo >= 25 && no_ventas_equipo <= 30)
                                            {
                                            	jdg_total_comisiones_equipo = 28000;
                                            }
                                        };break;
                                        default:
                                        {
                                            
                                        };break;
                                    }
					        		var RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResComSup[0].getId());
							            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',no_ventas_equipo);
							            RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',jdg_total_comisiones_equipo);
							        var RecComisionesJdGId = nlapiSubmitRecord(RecComisionesJdG);
							        jdgIdSup = RecComisionesJdGId;	
									for(cont=0;cont<cantVenta;cont++)
									{
				    		        	var RecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
				    		        		RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',supervisor);
				    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',RecComisionesJdGId);
				    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',factId);
				    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',series_tm[cont]);
				    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
				    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
				    			        nlapiSubmitRecord(RecComisionesDetJdG);
									}
						        }
							}
					       	//if(jdgIdSup!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_jdg_super',('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg', jdgIdSup, false))); }
							if(jdgIdSup!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_jdg_super',('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg', jdgIdSup, false))); }
						}
					  	if(jdgSplit!='' && aplicadaJDG_Split=='' && esquemaNaN==false)
				       	{
				       		if(ffs!='' && fis!='')
				       		{
								var fisMS 		= fis.getTime();
								var ffsMS 		= ffs.getTime();
								if(factFecMS >= fisMS && factFecMS <= ffsMS)
								{
				    		        filtersResComSplit[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', jdgSplit);
				    	        	filtersResComSplit[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc);
				    				columnsResComSplit[0] = new nlobjSearchColumn('custrecord_jdg_no_ventas_equipo');
				    				columnsResComSplit[1] = new nlobjSearchColumn('custrecord_jdg_fecha_comision');
				    				columnsResComSplit[2] = new nlobjSearchColumn('custrecord_jdg_total_comisiones_equipo');
				    				resultsResComSplit    = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResComSplit, columnsResComSplit));
    	                            var no_ventas_equipo            = 0;
                                    var jdg_total_comisiones_equipo = 0;
    	                            var fechaAltaMS       = 0;
                                    var difMS             = 0;
                                    var indexEquipo       = 0;
                                    ReglasFidelidadEquipo = '';
                                    if(fechaAlta != '' )
                                    {
                                        fechaAltaMS     = fechaAlta.getTime();
                                        difMS           = factFecMS - fechaAltaMS;
                                        // 15768000000 = 6 Meses
                                        if(difMS <= 15768000000)
                                        {
                                            indexEquipo = 1;
                                        }
                                        // 15768000001 = 6.00000000038051750381 Meses
                                        if(difMS >= 15768000001)
                                        {
                                            indexEquipo = 2;
                                        }
                                    }
                                    var indexArchivos        = 0;
                                    var fechaCambioComp      = '23/'+fcNonZero;
                                        fechaCambioComp      = nlapiStringToDate(fechaCambioComp);
                                    var fechaCambioCompMS    = fechaCambioComp.getTime();
                                    //1335164400000 = 23/4/2012
                                    if(fechaCambioCompMS <= 1335164400000)
                                    {
                                        indexArchivos = 1;
                                    }
                                    if(fechaCambioCompMS >= 1335164400001)
                                    {
                                        indexArchivos = 2;
                                    }
                                    switch(indexArchivos)
                                    {
                                        case 1:
                                        {
                                            file_fidelidad_equipo = nlapiLoadFile(138919);
                                            ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();   
                                            ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                            ReglasFidelidadEquipo.pop();    
                                        };break;
                                        case 2:
                                        {
                                            file_fidelidad_equipo = nlapiLoadFile(276);
                                            ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();   
                                            ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                            ReglasFidelidadEquipo.pop();    
                                        };break;
                                        default:
                                        {
                                            
                                        };break;
                                    }
				    				if(resultsResComSplit=='')
				    		        {
				    		            no_ventas_equipo            = 0;
                                        jdg_total_comisiones_equipo = 0;
                                        switch(indexArchivos)
                                        {
                                            case 1:
                                            {
                                                var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[cantVenta].split(String.fromCharCode(44));
                                                no_ventas_equipo            = ReglaVentaFidelidadEquipo[0];
                                                jdg_total_comisiones_equipo = ReglaVentaFidelidadEquipo[3];
                                            };break;
                                            case 2:
                                            {
                                            	/*/
                                                var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));
                                                no_ventas_equipo = parseFloat(0);
                                                no_ventas_equipo++;
                                                jdg_total_comisiones_equipo = parseFloat(0);
                                                jdg_total_comisiones_equipo += parseFloat(ReglaVentaFidelidadEquipo[3]);
                                                /*/
                                            	
                                            	no_ventas_equipo = 0;
                                                no_ventas_equipo++;
                                                if(no_ventas_equipo >= 1 && no_ventas_equipo <= 6)
                                                {
                                                	jdg_total_comisiones_equipo = 0;
                                                }
                                                if(no_ventas_equipo >= 7 && no_ventas_equipo <= 14)
                                                {
                                                	jdg_total_comisiones_equipo = 8000;
                                                }
                                                if(no_ventas_equipo >= 15 && no_ventas_equipo <= 20)
                                                {
                                                	jdg_total_comisiones_equipo = 18000;
                                                }
                                                if(no_ventas_equipo >= 21 && no_ventas_equipo <= 24)
                                                {
                                                	jdg_total_comisiones_equipo = 23000;
                                                }
                                                if(no_ventas_equipo >= 25 && no_ventas_equipo <= 30)
                                                {
                                                	jdg_total_comisiones_equipo = 28000;
                                                }
                                                
                                            };break;
                                            default:
                                            {
                                                
                                            };break;
                                        }
				    		        	var newRecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');
				    		        		newRecComisionesJdG.setFieldValue('custrecord_jdg_empleado',jdgSplit);
				    		        		newRecComisionesJdG.setFieldValue('custrecord_jdg_nombre_empleado',jdgSplitText);
				    		        		newRecComisionesJdG.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
				    		        		newRecComisionesJdG.setFieldValue('custrecord_jdg_nombre_unidad',nomUnidadSplit);
				    		        		newRecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',0);
				    					    newRecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',0);
				    					    newRecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',no_ventas_equipo);
				    					    newRecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',jdg_total_comisiones_equipo);
				    					    newRecComisionesJdG.setFieldValue('custrecord_jdg_fecha_comision',fc);
				    					    newRecComisionesJdG.setFieldValue('custrecord_jdg_bono_manual',0.0);
				    					var newRecComisionesJdGId = nlapiSubmitRecord(newRecComisionesJdG);
				    					jdgIdSplit = newRecComisionesJdGId;
				    					for(cont=0;cont<cantVenta;cont++)
				    					{
					    		        	var newRecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
					    		        		newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',jdgSplit);
					    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',newRecComisionesJdGId);
					    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',factId);
					    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',series_tm[cont]);
					    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
					    			        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
				    			        	nlapiSubmitRecord(newRecComisionesDetJdG);
				    					}
				    		        }
				    		        else
				    		        {
				    		            var no_ventas_equipo            = 0;
                                        var jdg_total_comisiones_equipo = 0;
                                        switch(indexArchivos)
                                        {
                                            case 1:
                                            {
                                                var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[parseFloat(resultsResComSplit[0].getValue('custrecord_jdg_no_ventas_equipo'))+(cantVenta)].split(String.fromCharCode(44));
                                                no_ventas_equipo            = ReglaVentaFidelidadEquipo[0];
                                                jdg_total_comisiones_equipo = ReglaVentaFidelidadEquipo[3];
                                            };break;
                                            case 2:
                                            {
                                            	/*/
                                                var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));
                                                no_ventas_equipo = parseFloat(resultsResComSplit[0].getValue('custrecord_jdg_no_ventas_equipo'));
                                                no_ventas_equipo++;
                                                jdg_total_comisiones_equipo = parseFloat(resultsResComSplit[0].getValue('custrecord_jdg_total_comisiones_equipo'));
                                                jdg_total_comisiones_equipo += parseFloat(ReglaVentaFidelidadEquipo[3]);
                                                /*/
                                                no_ventas_equipo = parseFloat(resultsResComSplit[0].getValue('custrecord_jdg_no_ventas_equipo'));
                                                no_ventas_equipo++;
                                                if(no_ventas_equipo >= 1 && no_ventas_equipo <= 6)
                                                {
                                                	jdg_total_comisiones_equipo = 0;
                                                }
                                                if(no_ventas_equipo >= 7 && no_ventas_equipo <= 14)
                                                {
                                                	jdg_total_comisiones_equipo = 8000;
                                                }
                                                if(no_ventas_equipo >= 15 && no_ventas_equipo <= 20)
                                                {
                                                	jdg_total_comisiones_equipo = 18000;
                                                }
                                                if(no_ventas_equipo >= 21 && no_ventas_equipo <= 24)
                                                {
                                                	jdg_total_comisiones_equipo = 23000;
                                                }
                                                if(no_ventas_equipo >= 25 && no_ventas_equipo <= 30)
                                                {
                                                	jdg_total_comisiones_equipo = 28000;
                                                }
                                            };break;
                                            default:
                                            {
                                                
                                            };break;
                                        }
				    	        		var RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResComSplit[0].getId());
				    			            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',no_ventas_equipo);
				    			            RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',jdg_total_comisiones_equipo);
				    			        var RecComisionesJdGId = nlapiSubmitRecord(RecComisionesJdG);
				    			        jdgIdSplit = RecComisionesJdGId;	
				    					for(cont=0;cont<cantVenta;cont++)
				    					{
					    		        	var RecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
					    		        		RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',jdgSplit);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',RecComisionesJdGId);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',factId);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',series_tm[cont]);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
					    			        nlapiSubmitRecord(RecComisionesDetJdG);
				    					}
				    		        }
						        }
						       //if(jdgIdSplit!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_jdg_split',('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg', jdgIdSplit, false))); }
								if(jdgIdSplit!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_jdg_split',('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg', jdgIdSplit, false))); }
							}
						}
						if(reclu!='' && aplicadaREC=='' && esquemaNaN==false)
				        {
					        if(fechaReact != '')    
					        { 
					        	fechaAlta 		= fechaReact;
				        	}
					        if(fechaFinObj2Re != '')    
					        { 
					        	fechaFinObj2	= fechaFinObj2Re;
				        	}
			        		if(fechaFinObj2!='')
						    {
			        			if(factFecMS<=fechaFinObj2.getTime())
			        			{
							        var fileReclutamiento = nlapiLoadFile(279);
							        var ReglasReclutamiento = fileReclutamiento.getValue();	
								        ReglasReclutamiento = ReglasReclutamiento.split(String.fromCharCode(10));  
								        ReglasReclutamiento.pop(); 
									var ventasTotalesREC = 0;
									var importeAcumulado = 0;
									var cantVentaPeriodo = 0;
					        		if(fechaAlta!='')
									{ 
										var fechaAltaMS 	= parseFloat(fechaAlta.getTime());
										var fc_complete = fechaAlta.getDate()+ '/' +fcNonZero;
											fc_complete = nlapiStringToDate(fc_complete);	
										var fc_completeMS	= parseFloat(fc_complete.getTime());
										while(fc_completeMS>=fechaAltaMS)
										{
											var fcAux = (parseFloat(fc_complete.getMonth()) + 1) + '/' + fc_complete.getFullYear();
												fcAux = fcAux.split('/');
											if(parseFloat(fcAux[0])<10) { fcAux[0] = '0'+fcAux[0];}
											fcAux = fcAux.join('/');
											var	filtersResComAux = new Array();
												filtersResComAux[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep);
									        	filtersResComAux[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fcAux);
											var columnsResComAux = new Array();
												columnsResComAux[0] = new nlobjSearchColumn('custrecord_rec_no_ventas_totales');
												columnsResComAux[1] = new nlobjSearchColumn('custrecord_rec_no_ventas_periodo');
												columnsResComAux[2] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
											var resultsResComAux = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComAux, columnsResComAux));
											if(resultsResComAux!='')
											{
												cantVentaPeriodo = parseFloat(resultsResComAux[0].getValue('custrecord_rec_no_ventas_periodo'));
												ventasTotalesREC = parseFloat(resultsResComAux[0].getValue('custrecord_rec_no_ventas_totales'));
												importeAcumulado = (parseFloat(resultsResComAux[0].getValue('custrecord_rec_total_comisiones')));
												break;
											}
											fc_complete = nlapiAddMonths(fc_complete,(-1));
											fc_completeMS	= parseFloat(fc_complete.getTime());
										}
									}
					                filtersResComRec[0]=  new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep);
					                filtersResComRec[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc);
									columnsResComRec[0] = new nlobjSearchColumn('custrecord_rec_no_ventas_totales');
									columnsResComRec[1] = new nlobjSearchColumn('custrecord_rec_no_ventas_periodo');
									columnsResComRec[2] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
									resultsResComRec = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComRec, columnsResComRec));
									if(resultsResComRec=='')
							        {
							        	if(ventasTotalesREC<6)
							        	{
								        	var ReglasVentaReclutamiento = ReglasReclutamiento[cantVenta+ventasTotalesREC].split(String.fromCharCode(44));   
								        	var newRecComisionesRec = nlapiCreateRecord('customrecord_comisiones_rec');
								                newRecComisionesRec.setFieldValue('custrecord_rec_empleado',salesRep);
								                newRecComisionesRec.setFieldValue('custrecord_rec_nombre_empleado',salesRepText);
								                newRecComisionesRec.setFieldValue('custrecord_rec_reclutadora',reclu);
								                newRecComisionesRec.setFieldValue('custrecord_rec_categoria_empleado',recluCatEmp);
								                newRecComisionesRec.setFieldValue('custrecord_rec_esquema_reclutadora',recluEsqEmp);
								                newRecComisionesRec.setFieldValue('custrecord_rec_cuenta_bancaria',cuentaBancaria);
								                newRecComisionesRec.setFieldValue('custrecord_rec_nombre_unidad',nombreUnidad);
								                newRecComisionesRec.setFieldValue('custrecord_rec_nombre_unidad_reclutadora',recluNomUniEmp);
								                newRecComisionesRec.setFieldValue('custrecord_rec_no_ventas_totales',cantVenta+ventasTotalesREC);
											    newRecComisionesRec.setFieldValue('custrecord_rec_no_ventas_periodo',cantVenta);
											    newRecComisionesRec.setFieldValue('custrecord_rec_total_comisiones',ReglasVentaReclutamiento[1]);
											    newRecComisionesRec.setFieldValue('custrecord_rec_fecha_comision',fc);
											    newRecComisionesRec.setFieldValue('custrecord_rec_bono_manual',0.0);
											var newRecComisionesRecId = nlapiSubmitRecord(newRecComisionesRec);
											recId = newRecComisionesRecId;
											for(cont=0;cont<cantVenta;cont++)
											{
									        	var newRecComisionesDetRec = nlapiCreateRecord('customrecord_comisiones_rec_det');
									        		newRecComisionesDetRec.setFieldValue('custrecord_rec_det_empleado_id',reclu);
										        	newRecComisionesDetRec.setFieldValue('custrecord_rec_det_comision_rec_id',newRecComisionesRecId);
										        	newRecComisionesDetRec.setFieldValue('custrecord_rec_det_factura',factId);
										        	newRecComisionesDetRec.setFieldValue('custrecord_rec_det_serie_tm',series_tm[cont]);
										        	newRecComisionesDetRec.setFieldValue('custrecord_rec_det_venta_realizada_por',salesRep);
										        	newRecComisionesDetRec.setFieldValue('custrecord_rec_det_cliente',entity);
									        	nlapiSubmitRecord(newRecComisionesDetRec);
											}
										}
							        }
							        else
							        {
							        	if(ventasTotalesREC<6)
							        	{
							            	var ReglasVentaReclutamiento = ReglasReclutamiento[parseFloat(ventasTotalesREC)+(cantVenta)].split(String.fromCharCode(44));   
							        		var RecComisionesRec = nlapiLoadRecord('customrecord_comisiones_rec',resultsResComRec[0].getId());
							        			RecComisionesRec.setFieldValue('custrecord_rec_no_ventas_totales',parseFloat(ventasTotalesREC)+parseFloat(cantVenta));
							        			RecComisionesRec.setFieldValue('custrecord_rec_no_ventas_periodo',parseFloat(cantVenta)+parseFloat(cantVentaPeriodo));
							        			RecComisionesRec.setFieldValue('custrecord_rec_total_comisiones',(parseFloat(ReglasVentaReclutamiento[1]) + parseFloat(importeAcumulado)));
									        var RecComisionesRecId = nlapiSubmitRecord(RecComisionesRec);	
									        recId = RecComisionesRecId;
											for(cont=0;cont<cantVenta;cont++)
											{
									        	var RecComisionesDetRec = nlapiCreateRecord('customrecord_comisiones_rec_det');
										        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_empleado_id',reclu);
										        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_comision_rec_id',RecComisionesRecId);
										        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_factura',factId);
										        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_serie_tm',series_tm[cont]);
										        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_venta_realizada_por',salesRep);
										        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_cliente',entity);
									        	nlapiSubmitRecord(RecComisionesDetRec);
								       		}
								       	}
									}
									if(recId!=0) { nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_comision_aplicada_rec',('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_rec', recId, false))); }
						        }
							}
						}
				    }
				}
			}
	    }
	}
}
function mostrarDetalleComisiones(type, form)
{
	var recType    = nlapiGetRecordType();
	var recId      = nlapiGetRecordId();
	var roleId     = parseFloat(nlapiGetRole());
	var userId     = nlapiGetUser();
	if(type=='view' || type == 'edit')
	{
	    var filters = new Array(), columns = new Array(),searchResults= new Array(),resultados = new Array();
	    var i=0;
		//var lon = 0, cont=0;
		var detalleComisionesSublist = new Object();
		if(recType=='customrecord_comisiones_jdg')
		{
			detalleComisionesSublist = form.addSubList('custpage_detalle_comisiones', 'inlineeditor', 'Detalle Comisiones','custom28');
		    var jdg = nlapiGetFieldValue('custrecord_jdg_empleado');
		    detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			if(roleId==3) { detalleComisionesSublist.addField('custpage_det_url_edit', 'url', 'Editar').setLinkText('Editar'); }
			detalleComisionesSublist.addField('custpage_det_factura', 'select', 'Orden de Venta','transaction');
			detalleComisionesSublist.addField('custpage_det_serie_tm', 'text', 'Serie TM');
			detalleComisionesSublist.addField('custpage_det_venta_realizada_por', 'text', 'Venta Realizada por');
			detalleComisionesSublist.addField('custpage_det_cliente', 'text', 'Cliente','customer');
			columns[0] = new nlobjSearchColumn('internalid');;
			columns[1] = new nlobjSearchColumn('custrecord_jdg_det_factura');
			columns[2] = new nlobjSearchColumn('custrecord_jdg_det_venta_realizada_por');
			columns[3] = new nlobjSearchColumn('custrecord_jdg_det_cliente');
			columns[4] = new nlobjSearchColumn('custrecord_jdg_det_serie_tm');
			filters[0] = new nlobjSearchFilter('custrecord_jdg_det_comision_jdg_id', null, 'is', recId);
			filters[1] = new nlobjSearchFilter('custrecord_jdg_det_empleado_id', null, 'is', jdg);
			searchResults = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg_det', null, filters, columns));
			if(searchResults!='')
			{
			    resultados = deleteDuplicateElementsByID(searchResults);
				for (i = 0;i<resultados.length ; i++ )
				{
				    var cteString = new String(resultados[i].getText('custrecord_jdg_det_cliente'));
				    var vrpString = new String(resultados[i].getText('custrecord_jdg_det_venta_realizada_por'));
				    var vrp = new String(resultados[i].getValue('custrecord_jdg_det_venta_realizada_por'));
                    var lineNumber = new Number(i + 1);
                        lineNumber.toString();
                    detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
					if(roleId==3) { detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg_det', resultados[i].getValue('internalid'), true))); }
					//detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_jdg_det', resultados[i].getValue('internalid'), true)));
					detalleComisionesSublist.setLineItemValue('custpage_det_factura', i+1, resultados[i].getValue('custrecord_jdg_det_factura'));
					detalleComisionesSublist.setLineItemValue('custpage_det_serie_tm', i+1, resultados[i].getValue('custrecord_jdg_det_serie_tm'));
					if(vrp == jdg)
                    {
                        detalleComisionesSublist.setLineItemValue('custpage_det_venta_realizada_por', i+1, vrpString.fontcolor('#336600'));
                    }
                    else
                    {
                        detalleComisionesSublist.setLineItemValue('custpage_det_venta_realizada_por', i+1, vrpString);
                    }
					detalleComisionesSublist.setLineItemValue('custpage_det_cliente', i+1, cteString);
				}
			}
		}
		if(recType=='customrecord_comisiones_pre')
		{
			detalleComisionesSublist = form.addSubList('custpage_detalle_comisiones', 'inlineeditor', 'Detalle Comisiones','custom29');
		    var pre = nlapiGetFieldValue('custrecord_pre_empleado');
		    detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			if(roleId==3) { detalleComisionesSublist.addField('custpage_det_url_edit', 'url', 'Editar').setLinkText('Editar'); }
			detalleComisionesSublist.addField('custpage_det_factura', 'select', 'Orden de Venta','transaction');
			detalleComisionesSublist.addField('custpage_det_serie_tm', 'text', 'Serie TM');
			detalleComisionesSublist.addField('custpage_det_venta_realizada_por', 'text', 'Venta Realizada por');
			detalleComisionesSublist.addField('custpage_det_cliente', 'text', 'Cliente');	
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('custrecord_pre_det_factura');
			columns[2] = new nlobjSearchColumn('custrecord_pre_det_venta_realizada_por');
			columns[3] = new nlobjSearchColumn('custrecord_pre_det_cliente');
			columns[4] = new nlobjSearchColumn('custrecord_pre_det_serie_tm');
			filters[0] = new nlobjSearchFilter('custrecord_pre_det_comision_pre_id', null, 'is', recId);
			filters[1] = new nlobjSearchFilter('custrecord_pre_det_empleado_id', null, 'is', pre);
			searchResults = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre_det', null, filters, columns));
			if(searchResults!='')
			{
			    resultados = deleteDuplicateElementsByID(searchResults);
				for (i = 0;i<resultados.length ; i++ )
				{;
				    var cteString = new String(resultados[i].getText('custrecord_pre_det_cliente'));
                    var vrpString = new String(resultados[i].getText('custrecord_pre_det_venta_realizada_por'));
                    var lineNumber = new Number(i + 1);
                        lineNumber.toString();
                    detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
					if(roleId==3) { detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_pre_det', resultados[i].getValue('internalid'), true))); }
					//detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_pre_det', resultados[i].getValue('internalid'), true)));
					detalleComisionesSublist.setLineItemValue('custpage_det_factura', i+1, resultados[i].getValue('custrecord_pre_det_factura'));
					detalleComisionesSublist.setLineItemValue('custpage_det_serie_tm', i+1, resultados[i].getValue('custrecord_pre_det_serie_tm'));
					detalleComisionesSublist.setLineItemValue('custpage_det_venta_realizada_por', i+1, vrpString);
					detalleComisionesSublist.setLineItemValue('custpage_det_cliente', i+1, cteString);
				}
			}
		}
		if(recType=='customrecord_comisiones_rec')
		{
			detalleComisionesSublist = form.addSubList('custpage_detalle_comisiones', 'inlineeditor', 'Detalle Comisiones','custom30');
		    var rec = nlapiGetFieldValue('custrecord_rec_reclutadora');
		    detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			if(roleId==3) { detalleComisionesSublist.addField('custpage_det_url_edit', 'url', 'Editar').setLinkText('Editar'); }
			detalleComisionesSublist.addField('custpage_det_factura', 'select', 'Orden de Venta','transaction');
			detalleComisionesSublist.addField('custpage_det_serie_tm', 'text', 'Serie TM');
			detalleComisionesSublist.addField('custpage_det_venta_realizada_por', 'text', 'Venta Realizada por');
			detalleComisionesSublist.addField('custpage_det_cliente', 'text', 'Cliente');	
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('custrecord_rec_det_factura');
			columns[2] = new nlobjSearchColumn('custrecord_rec_det_venta_realizada_por');
			columns[3] = new nlobjSearchColumn('custrecord_rec_det_cliente');
			columns[4] = new nlobjSearchColumn('custrecord_rec_det_serie_tm');
			filters[0] = new nlobjSearchFilter('custrecord_rec_det_comision_rec_id', null, 'is', recId);
			filters[1] = new nlobjSearchFilter('custrecord_rec_det_empleado_id', null, 'is', rec);		
			searchResults = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec_det', null, filters, columns));
			if(searchResults!='')
			{
				resultados = deleteDuplicateElementsByID(searchResults);
				for (i = 0;i<resultados.length ; i++ )
				{
				    var cteString = new String(resultados[i].getText('custrecord_rec_det_cliente'));
                    var vrpString = new String(resultados[i].getText('custrecord_rec_det_venta_realizada_por'));
                    var lineNumber = new Number(i + 1);
                        lineNumber.toString();
                    detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
					if(roleId==3) { detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_rec_det', resultados[i].getValue('internalid'), true))); }
					//detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_rec_det', resultados[i].getValue('internalid'), true)));
					detalleComisionesSublist.setLineItemValue('custpage_det_factura', i+1, resultados[i].getValue('custrecord_rec_det_factura'));
					detalleComisionesSublist.setLineItemValue('custpage_det_serie_tm', i+1, resultados[i].getValue('custrecord_rec_det_serie_tm'));
					detalleComisionesSublist.setLineItemValue('custpage_det_venta_realizada_por', i+1, vrpString);
					detalleComisionesSublist.setLineItemValue('custpage_det_cliente', i+1, cteString);
				}
			}
		}
		if(recType=='customrecord_comisiones_gtm')
		{
			detalleComisionesSublist = form.addSubList('custpage_detalle_comisiones', 'inlineeditor', 'Detalle Comisiones','custom31');
		    var gtm = nlapiGetFieldValue('custrecord_gtm_empleado');
		    detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			if(roleId==3) { detalleComisionesSublist.addField('custpage_det_url_edit', 'url', 'Editar').setLinkText('Editar'); }
			detalleComisionesSublist.addField('custpage_det_factura', 'select', 'Orden de Venta','transaction');
			detalleComisionesSublist.addField('custpage_det_serie_tm', 'text', 'Serie TM');
			detalleComisionesSublist.addField('custpage_det_venta_realizada_por', 'text', 'Venta Realizada por');
			detalleComisionesSublist.addField('custpage_det_cliente', 'text', 'Cliente','customer');
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('custrecord_gtm_det_factura');
			columns[2] = new nlobjSearchColumn('custrecord_gtm_det_venta_realizada_por');
			columns[3] = new nlobjSearchColumn('custrecord_gtm_det_cliente');
			columns[4] = new nlobjSearchColumn('custrecord_gtm_det_serie_tm');
			filters[0] = new nlobjSearchFilter('custrecord_gtm_det_comision_gtm_id', null, 'is', recId);
			filters[1] = new nlobjSearchFilter('custrecord_gtm_det_empleado_id', null, 'is', gtm);			
			searchResults = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm_det', null, filters, columns));
			if(searchResults!='')
			{
				resultados = deleteDuplicateElementsByID(searchResults);
				for(i = 0;i<resultados.length ; i++ )
				{
				    var cteString = new String(resultados[i].getText('custrecord_gtm_det_cliente'));
                    var vrpString = new String(resultados[i].getText('custrecord_gtm_det_venta_realizada_por'));
                    var lineNumber = new Number(i + 1);
                        lineNumber.toString();
                    detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
					if(roleId==3) { detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://system.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_gtm_det', resultados[i].getValue('internalid'), true))); }
					//detalleComisionesSublist.setLineItemValue('custpage_det_url_edit', i+1, ('https://debugger.netsuite.com' + nlapiResolveURL('RECORD','customrecord_comisiones_gtm_det', resultados[i].getValue('internalid'), true)));
					detalleComisionesSublist.setLineItemValue('custpage_det_factura', i+1, resultados[i].getValue('custrecord_gtm_det_factura'));
					detalleComisionesSublist.setLineItemValue('custpage_det_serie_tm', i+1, resultados[i].getValue('custrecord_gtm_det_serie_tm'));
					detalleComisionesSublist.setLineItemValue('custpage_det_venta_realizada_por', i+1, vrpString);
					detalleComisionesSublist.setLineItemValue('custpage_det_cliente', i+1, cteString);
				}
			}
		}
	}
	if(type=='edit')
	{
	  	if(roleId!=3)
	  	{
		  	if(recType=='customrecord_comisiones_jdg')
			{
			  	nlapiSetRedirectURL('RECORD', recType, recId, false, null);
			}
			if(recType=='customrecord_comisiones_pre')
			{
			  	nlapiSetRedirectURL('RECORD', recType, recId, false, null);
			}
			if(recType=='customrecord_comisiones_gtm')
			{
			  	nlapiSetRedirectURL('RECORD', recType, recId, false, null);
			}
			if(recType=='customrecord_comisiones_rec')
			{
			  	nlapiSetRedirectURL('RECORD', recType, recId, false, null);
			}
		}
	}
	if(type=='copy' || type=='create' )
	{
	  	if(recType=='customrecord_comisiones_jdg' || recType=='customrecord_comisiones_rec' || recType=='customrecord_comisiones_pre' || recType=='customrecord_comisiones_jdg')
		{
		  	nlapiSetRedirectURL('RECORD', 'employee', userId, false, null);
		}	
	}
}
function alertaCompensaciones(type)
{
	if(type == 'delete')
	{
		var tranRec 		= nlapiLoadRecord('salesorder',nlapiGetRecordId());
        var com_jdg         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg'));
        var com_pre         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_pre'));
        var com_gtm         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_gtm'));
        var com_rec         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_rec'));
        var com_jdg_split   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_split'));
        var com_jdg_super   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_super'));
		var pedido_num      = returnBlank(nlapiGetFieldValue('tranid'));
		var tab = '&nbsp;&nbsp;&nbsp;&nbsp;';
		var hoy = new Date();
		var context = nlapiGetContext();
		var asunto 	= 'El pedido: ' + pedido_num  + ' con compensaciones ha sido borrado';
		var msg    	= 'El usuario <b>'+ context.getName() + '</b> borro el pedido <b>' + pedido_num  + '</b> con fecha de borrado <b>' + nlapiDateToString(hoy) +'</b>.';
			msg 	+= '<br><br>Aquí las compensaciones afectadas:<br>';
		if(com_jdg!='')
		{
			msg += tab + '>. <a href='+com_jdg+'><b>Jefa de Grupo</b></a><br>';
		}
		if(com_pre!='')
		{
			msg += tab + '>. <a href='+com_pre+'><b>Presentadora</b></a><br>';
		}
		if(com_gtm!='')
		{
			msg += tab + '>. <a href='+com_gtm+'><b>G&aacute;nate TM</b></a><br>';
		}
		if(com_rec!='')
		{
			msg += tab + '>. <a href='+com_rec+'><b>Reclutamiento</b></a><br>';
		}
		if(com_jdg_split!='')
		{
			msg += tab + '>. <a href='+com_jdg_split+'><b>Jefa de Grupo Split</b></a><br>';
		}
		if(com_jdg_super!='')
		{
			msg += tab + '>. <a href='+com_jdg_super+'><b>Jefa de Grupo Supervisor</b></a><br>';
		}
    	if(com_jdg!='' || com_pre!='' || com_gtm!='' || com_rec!='' || com_jdg_split!='' || com_jdg_super!='')
    	{
    	    var author         = nlapiGetUser();
    	    var recipient      = 'Mariadelosangeles.islas@vorwerk.de';'carlos.alvarez@imr.com.mx'; 
	        var subject        = asunto;
    	    var body           = msg;
    	    var cc             = 'luis.liceaga@vorwerk.de'; /*/ null; /*/
    	    var bcc            = null;
    	    var records        = null;
    	    var attachments    = null;
    	    nlapiSendEmail(author, recipient, subject, body, cc, bcc, records,attachments);
    	}
    }
}
function recalculoManual(type,form)
{
    if(nlapiGetRole()==3)
    {
        if(type=='delete')
        {
            var recType = nlapiGetRecordType();
            var recId = nlapiGetRecordId();
            if(recType=='customrecord_comisiones_jdg_det')
            {
                var recJDGDET       = nlapiLoadRecord('customrecord_comisiones_jdg_det',recId);
                var recJDG          = nlapiLoadRecord('customrecord_comisiones_jdg',recJDGDET.getFieldValue('custrecord_jdg_det_comision_jdg_id'));
                var tranID          = returnBlank(recJDGDET.getFieldValue('custrecord_jdg_det_factura'));
                var factFecMS		= 0;
                if(tranID != '')
                {
                    var tranRec	    = nlapiLoadRecord('salesorder',tranID);
                    factFecMS       = tranRec.getFieldValue('trandate');
                    factFecMS       = nlapiStringToDate(factFecMS);
                    factFecMS       = factFecMS.getTime();
                    var com_jdg     = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg'));
                    if(com_jdg!='')
                    {
                        var com_jdg_s       = com_jdg.search(recJDGDET.getFieldValue('custrecord_jdg_det_comision_jdg_id'));
                        if(com_jdg_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg','');
                        }
                    }
                    var com_pre         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_pre'));
                    if(com_pre!='')
                    {
                        var com_pre_s       = com_pre.search(recJDGDET.getFieldValue('custrecord_jdg_det_comision_jdg_id'));
                        if(com_pre_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_pre','');
                        }
                    }
                    var com_gtm         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_gtm'));
                    if(com_gtm!='')
                    {
                        var com_gtm_s       = com_gtm.search(recJDGDET.getFieldValue('custrecord_jdg_det_comision_jdg_id'));
                        if(com_gtm_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_gtm','');
                        }
                    }
                    var com_rec         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_rec'));
                    if(com_rec!='')
                    {
                        var com_rec_s       = com_rec.search(recJDGDET.getFieldValue('custrecord_jdg_det_comision_jdg_id'));
                        if(com_rec_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_rec','');
                        }
                    }           
                    var com_jdg_split   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_split'));
                    if(com_jdg_split!='')
                    {
                        var com_jdg_split_s         = com_jdg_split.search(recJDGDET.getFieldValue('custrecord_jdg_det_comision_jdg_id'));
                        if(com_jdg_split_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_split','');
                        }
                    }
                    var com_jdg_super   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_super'));
                    if(com_jdg_super!='')
                    {
                        var com_jdg_super_s         = com_jdg_super.search(recJDGDET.getFieldValue('custrecord_jdg_det_comision_jdg_id'));
                        if(com_jdg_super_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_super','');
                        }
                    }
                    nlapiSubmitRecord(tranRec); 
                }
                var emp        = recJDGDET.getFieldValue('custrecord_jdg_det_venta_realizada_por');
                var filtersEmp = new nlobjSearchFilter('internalid', null, 'is', emp);
                var columnsEmp = new Array();
                    columnsEmp[0] = new nlobjSearchColumn('hiredate');
                var resultsEmp      = returnBlank(nlapiSearchRecord('employee', null, filtersEmp, columnsEmp));
                var fechaAlta       = returnBlank(resultsEmp[0].getValue('hiredate'));
                if(fechaAlta!='')    { fechaAlta = nlapiStringToDate(fechaAlta); }
                var fechaAltaMS       = 0;
                var difMS             = 0;
                var indexEquipo       = 0;
                if(fechaAlta != '' )
                {
                    fechaAltaMS     = fechaAlta.getTime();
                    difMS           = factFecMS - fechaAltaMS;
                    // 15768000000 = 6 Meses
                    if(difMS <= 15768000000)
                    {
                        indexEquipo = 1;
                    }
                    // 15768000001 = 6.00000000038051750381 Meses
                    if(difMS >= 15768000001)
                    {
                        indexEquipo = 2;
                    }
                }
                var fc      	        = recJDG.getFieldValue('custrecord_jdg_fecha_comision');
                var fcArray 			= fc.split('/');
                if(fcArray[0]<10)
                {
                	fcArray[0] = fcArray[0].replace('0','');
                }
                fc 						= fcArray.join('/');
                var indexArchivos 		= 0;
    			var fcNonZero			= quitarCeroMes(fc);
                var fechaCambioComp		= '23/'+fcNonZero;
                    fechaCambioComp     = nlapiStringToDate(fechaCambioComp);
                var fechaCambioCompMS 	= fechaCambioComp.getTime();
                //1335164400000 = 23/4/2012
                if(fechaCambioCompMS <= 1335164400000)
                {
                    indexArchivos = 1;
                }
                if(fechaCambioCompMS >= 1335164400001)
                {
                    indexArchivos = 2;
                }
                switch(indexArchivos)
                {
                    case 1:
                    {
                        file_fidelidad_propio = nlapiLoadFile(138921);
                        ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                        ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                        ReglasFidelidadPropio.pop();   
                    };break;
                    case 2:
                    {
                        file_fidelidad_propio = nlapiLoadFile(277);
                        ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                        ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                        ReglasFidelidadPropio.pop(); 
                    };break;
                    default:
                    {
                        
                    };break;
                }
                if(recJDGDET.getFieldValue('custrecord_jdg_det_venta_realizada_por')== recJDGDET.getFieldValue('custrecord_jdg_det_empleado_id'))
                {
                    var cantVenta = recJDG.getFieldValue('custrecord_jdg_no_ventas_propio');
                        cantVenta--;
                    if(cantVenta<=0) { cantVenta=0; }
                    var ReglaVentaFidelidadPropio = ReglasFidelidadPropio[cantVenta].split(String.fromCharCode(44));  
                    recJDG.setFieldValue('custrecord_jdg_no_ventas_propio',ReglaVentaFidelidadPropio[0]);
                    recJDG.setFieldValue('custrecord_jdg_total_comisiones_propio',ReglaVentaFidelidadPropio[5]);
                    nlapiSubmitRecord(recJDG);
                    //var recJDG_ID = nlapiSubmitRecord(recJDG);  
                }
                else
                {
                    var cantVenta = recJDG.getFieldValue('custrecord_jdg_no_ventas_equipo');
                        cantVenta--;
                    if(cantVenta<=0) { cantVenta=0; }
                    var ventaEquipo = 0;
                    var totalEquipo = recJDG.getFieldValue('custrecord_jdg_total_comisiones_equipo');;
                    var supervisor = recJDGDET.getFieldValue('custrecord_jdg_det_empleado_id');
                    var file_fidelidad_equipo = new Object();
                    var ReglasFidelidadEquipo = new String();
                    var ReglaVentaFidelidadEquipo = new String();
                    var filtersSupervisor = new nlobjSearchFilter('internalid', null, 'is', supervisor);
                    var columnsSupervisor = new Array();
                        columnsSupervisor[0] = new nlobjSearchColumn('custentity_fecha_inicio_split');
                        columnsSupervisor[1] = new nlobjSearchColumn('custentity_fecha_fin_split');
                        columnsSupervisor[2] = new nlobjSearchColumn('custentity_jefa_grupo_split');
                    var resultsSupervisor = returnBlank(nlapiSearchRecord('employee', null, filtersSupervisor, columnsSupervisor)); 
                    var fisSupervisorMS = returnBlank(resultsSupervisor[0].getValue('custentity_fecha_inicio_split'));
                    var ffsSupervisorMS = returnBlank(resultsSupervisor[0].getValue('custentity_fecha_fin_split'));
                    if(fisSupervisorMS!='' && ffsSupervisorMS!='')
                    { 
                        fisSupervisorMS = nlapiStringToDate(fisSupervisorMS);
                        fisSupervisorMS = fisSupervisorMS.getTime();
                        ffsSupervisorMS = nlapiStringToDate(ffsSupervisorMS);
                        ffsSupervisorMS = ffsSupervisorMS.getTime();
                        if(factFecMS >= fisSupervisorMS && factFecMS <= ffsSupervisorMS)
                        {
                            switch(indexArchivos)
                            {
                                case 1:
                                {
                                    file_fidelidad_equipo = nlapiLoadFile(138920);
                                    ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();
                                    ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                    ReglasFidelidadEquipo.pop();   
                                    ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[cantVenta].split(String.fromCharCode(44));
                                    ventaEquipo = ReglaVentaFidelidadEquipo[0];
                                    totalEquipo = ReglaVentaFidelidadEquipo[3];
                                };break;
                                case 2:
                                {
                                	/*/
                                    file_fidelidad_equipo = nlapiLoadFile(276);
                                    ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();
                                    ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                    ReglasFidelidadEquipo.pop(); 
                                    ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));  
                                    ventaEquipo = cantVenta;
                                    totalEquipo = totalEquipo - ReglaVentaFidelidadEquipo[3];
                                    /*/
                                	
                                	ventaEquipo = cantVenta;
                                    totalEquipo = 0;
                                    if(ventaEquipo >= 1 && ventaEquipo <= 6)
                                    {
                                    	totalEquipo = 0;
                                    }
                                    if(ventaEquipo >= 7 && ventaEquipo <= 14)
                                    {
                                    	totalEquipo = 8000;
                                    }
                                    if(ventaEquipo >= 15 && ventaEquipo <= 20)
                                    {
                                    	totalEquipo = 18000;
                                    }
                                    if(ventaEquipo >= 21 && ventaEquipo <= 24)
                                    {
                                    	totalEquipo = 23000;
                                    }
                                    if(ventaEquipo >= 25 && ventaEquipo <= 30)
                                    {
                                    	totalEquipo = 28000;
                                    }
                                    
                                };break;
                                default:
                                {
                                    
                                };break;
                            }
                        }
                        else
                        {
                            switch(indexArchivos)
                            {
                                case 1:
                                {
                                    file_fidelidad_equipo = nlapiLoadFile(138919);
                                    ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();
                                    ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                    ReglasFidelidadEquipo.pop();
                                    ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[cantVenta].split(String.fromCharCode(44));
                                    ventaEquipo = ReglaVentaFidelidadEquipo[0];
                                    totalEquipo = ReglaVentaFidelidadEquipo[3]; 
                                };break;
                                case 2:
                                {
                                	/*/
                                    file_fidelidad_equipo = nlapiLoadFile(276);
                                    ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();
                                    ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                    ReglasFidelidadEquipo.pop();
                                    ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));  
                                    ventaEquipo = cantVenta;
                                    totalEquipo = totalEquipo - ReglaVentaFidelidadEquipo[3];
                                    /*/

                                    ventaEquipo = cantVenta;
                                    totalEquipo = 0;
                                    if(ventaEquipo >= 1 && ventaEquipo <= 6)
                                    {
                                    	totalEquipo = 0;
                                    }
                                    if(ventaEquipo >= 7 && ventaEquipo <= 14)
                                    {
                                    	totalEquipo = 8000;
                                    }
                                    if(ventaEquipo >= 15 && ventaEquipo <= 20)
                                    {
                                    	totalEquipo = 18000;
                                    }
                                    if(ventaEquipo >= 21 && ventaEquipo <= 24)
                                    {
                                    	totalEquipo = 23000;
                                    }
                                    if(ventaEquipo >= 25 && ventaEquipo <= 30)
                                    {
                                    	totalEquipo = 28000;
                                    }
                                    
                                };break;
                                default:
                                {
                                    
                                };break;
                            }
                        }
                    }
                    else
                    {
                        switch(indexArchivos)
                        {
                            case 1:
                            {
                                file_fidelidad_equipo = nlapiLoadFile(138919);
                                ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();
                                ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                ReglasFidelidadEquipo.pop();
                                ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[cantVenta].split(String.fromCharCode(44));
                                ventaEquipo = ReglaVentaFidelidadEquipo[0];
                                totalEquipo = ReglaVentaFidelidadEquipo[3];   
                            };break;
                            case 2:
                            {
                            	/*/
                                file_fidelidad_equipo = nlapiLoadFile(276);
                                ReglasFidelidadEquipo = file_fidelidad_equipo.getValue();
                                ReglasFidelidadEquipo = ReglasFidelidadEquipo.split(String.fromCharCode(10));  
                                ReglasFidelidadEquipo.pop();
                                ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[indexEquipo].split(String.fromCharCode(44));  
                                ventaEquipo = cantVenta;
                                totalEquipo = totalEquipo - ReglaVentaFidelidadEquipo[3];
                                /*/
                            	
                                ventaEquipo = cantVenta;
                                totalEquipo = 0;
                                if(ventaEquipo >= 1 && ventaEquipo <= 6)
                                {
                                	totalEquipo = 0;
                                }
                                if(ventaEquipo >= 7 && ventaEquipo <= 14)
                                {
                                	totalEquipo = 8000;
                                }
                                if(ventaEquipo >= 15 && ventaEquipo <= 20)
                                {
                                	totalEquipo = 18000;
                                }
                                if(ventaEquipo >= 21 && ventaEquipo <= 24)
                                {
                                	totalEquipo = 23000;
                                }
                                if(ventaEquipo >= 25 && ventaEquipo <= 30)
                                {
                                	totalEquipo = 28000;
                                }
                                
                            };break;
                            default:
                            {
                                
                            };break;
                        }
                    }
                    //var ReglaVentaFidelidadEquipo = ReglasFidelidadEquipo[cantVenta].split(String.fromCharCode(44));   
                    recJDG.setFieldValue('custrecord_jdg_no_ventas_equipo',ventaEquipo);
                    recJDG.setFieldValue('custrecord_jdg_total_comisiones_equipo',totalEquipo);
                    //var recJDG_ID = nlapiSubmitRecord(recJDG);
                    nlapiSubmitRecord(recJDG);
                }
            }
            if(recType=='customrecord_comisiones_pre_det')
            {
                var recPREDET       = nlapiLoadRecord('customrecord_comisiones_pre_det',recId);
                var recPRE          = nlapiLoadRecord('customrecord_comisiones_pre',recPREDET.getFieldValue('custrecord_pre_det_comision_pre_id'));
                var tranID          = returnBlank(recPREDET.getFieldValue('custrecord_pre_det_factura'));
                if(tranID != '')
                {
                    var tranRec         = nlapiLoadRecord('salesorder',tranID);
                    var com_jdg         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg'));
                    if(com_jdg!='')
                    {
                        var com_jdg_s       = com_jdg.search(recPREDET.getFieldValue('custrecord_pre_det_comision_pre_id'));
                        if(com_jdg_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg','');
                        }
                    }
                    var com_pre         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_pre'));
                    if(com_pre!='')
                    {
                        var com_pre_s       = com_pre.search(recPREDET.getFieldValue('custrecord_pre_det_comision_pre_id'));
                        if(com_pre_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_pre','');
                        }
                    }
                    var com_gtm         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_gtm'));
                    if(com_gtm!='')
                    {
                        var com_gtm_s       = com_gtm.search(recPREDET.getFieldValue('custrecord_pre_det_comision_pre_id'));
                        if(com_gtm_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_gtm','');
                        }
                    }
                    var com_rec         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_rec'));
                    if(com_rec!='')
                    {
                        var com_rec_s       = com_rec.search(recPREDET.getFieldValue('custrecord_pre_det_comision_pre_id'));
                        if(com_rec_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_rec','');
                        }
                    }           
                    var com_jdg_split   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_split'));
                    if(com_jdg_split!='')
                    {
                        var com_jdg_split_s         = com_jdg_split.search(recPREDET.getFieldValue('custrecord_pre_det_comision_pre_id'));
                        if(com_jdg_split_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_split','');
                        }
                    }
                    var com_jdg_super   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_super'));
                    if(com_jdg_super!='')
                    {
                        var com_jdg_super_s         = com_jdg_super.search(recPREDET.getFieldValue('custrecord_pre_det_comision_pre_id'));
                        if(com_jdg_super_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_super','');
                        }
                    }
                    nlapiSubmitRecord(tranRec);
                }
                var fc                   	= recPRE.getFieldValue('custrecord_pre_fecha_comision');
                var fcArray 				= fc.split('/');
                if(fcArray[0]<10)
                {
                	fcArray[0] = fcArray[0].replace('0','');
                }
                fc 							= fcArray.join('/');
                var file_fidelidad_propio 	= new Object();
                var ReglasFidelidadPropio 	= '';
                var indexArchivos         	= 0;
                var fcNonZero				= quitarCeroMes(fc);
                var fechaCambioComp       	= '23/'+fcNonZero;
                    fechaCambioComp       	= nlapiStringToDate(fechaCambioComp);
                var fechaCambioCompMS     	= fechaCambioComp.getTime();
                //1335164400000 = 23/4/2012
                if(fechaCambioCompMS <= 1335164400000)
                {
                    indexArchivos = 1;
                }
                if(fechaCambioCompMS >= 1335164400001)
                {
                    indexArchivos = 2;
                }
                switch(indexArchivos)
                {
                    case 1:
                    {
                        file_fidelidad_propio = nlapiLoadFile(138921);
                        ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                        ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                        ReglasFidelidadPropio.pop();   
                    };break;
                    case 2:
                    {
                        file_fidelidad_propio = nlapiLoadFile(277);
                        ReglasFidelidadPropio = file_fidelidad_propio.getValue();
                        ReglasFidelidadPropio = ReglasFidelidadPropio.split(String.fromCharCode(10));  
                        ReglasFidelidadPropio.pop(); 
                    };break;
                    default:
                    {
                        
                    };break;
                }
                var cantVenta = recPRE.getFieldValue('custrecord_pre_no_ventas');
                    cantVenta--;
                if(cantVenta<=0) { cantVenta=0; }
                var ReglaVentaFidelidadPropio = ReglasFidelidadPropio[cantVenta].split(String.fromCharCode(44));  
                recPRE.setFieldValue('custrecord_pre_no_ventas',ReglaVentaFidelidadPropio[0]);      
                recPRE.setFieldValue('custrecord_pre_total_comisiones',ReglaVentaFidelidadPropio[5]);
                //var recPRE_ID = nlapiSubmitRecord(recPRE);
                nlapiSubmitRecord(recPRE);
            }
            if(recType=='customrecord_comisiones_rec_det')
            {
                var recRECDET       = nlapiLoadRecord('customrecord_comisiones_rec_det',recId);
                var recREC          = nlapiLoadRecord('customrecord_comisiones_rec',recRECDET.getFieldValue('custrecord_rec_det_comision_rec_id'));
                var tranID          = returnBlank(recRECDET.getFieldValue('custrecord_rec_det_factura'));
                if(tranID != '')
                {
                    var tranRec         = nlapiLoadRecord('salesorder',tranID);
                    var com_jdg         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg'));
                    if(com_jdg!='')
                    {
                        var com_jdg_s       = com_jdg.search(recRECDET.getFieldValue('custrecord_rec_det_comision_rec_id'));
                        if(com_jdg_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg','');
                        }
                    }
                    var com_pre         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_pre'));
                    if(com_pre!='')
                    {
                        var com_pre_s       = com_pre.search(recRECDET.getFieldValue('custrecord_rec_det_comision_rec_id'));
                        if(com_pre_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_pre','');
                        }
                    }
                    var com_gtm         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_gtm'));
                    if(com_gtm!='')
                    {
                        var com_gtm_s       = com_gtm.search(recRECDET.getFieldValue('custrecord_rec_det_comision_rec_id'));
                        if(com_gtm_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_gtm','');
                        }
                    }
                    var com_rec         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_rec'));
                    if(com_rec!='')
                    {
                        var com_rec_s       = com_rec.search(recRECDET.getFieldValue('custrecord_rec_det_comision_rec_id'));
                        if(com_rec_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_rec','');
                        }
                    }           
                    var com_jdg_split   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_split'));
                    if(com_jdg_split!='')
                    {
                        var com_jdg_split_s         = com_jdg_split.search(recRECDET.getFieldValue('custrecord_rec_det_comision_rec_id'));
                        if(com_jdg_split_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_split','');
                        }
                    }
                    var com_jdg_super   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_super'));
                    if(com_jdg_super!='')
                    {
                        var com_jdg_super_s         = com_jdg_super.search(recRECDET.getFieldValue('custrecord_rec_det_comision_rec_id'));
                        if(com_jdg_super_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_super','');
                        }
                    }
                    nlapiSubmitRecord(tranRec); 
                }
                var cantVentaTot = recREC.getFieldValue('custrecord_rec_no_ventas_totales');
                    cantVentaTot--;
                if(cantVentaTot<=0) { cantVentaTot=0; }
                var cantVenta = recREC.getFieldValue('custrecord_rec_no_ventas_periodo');
                    cantVenta--;
                if(cantVenta<=0) { cantVenta=0; }   
                var fileReclutamiento = nlapiLoadFile(279);
                var ReglasReclutamiento = fileReclutamiento.getValue(); 
                    ReglasReclutamiento = ReglasReclutamiento.split(String.fromCharCode(10));  
                    ReglasReclutamiento.pop(); 
                var ReglasVentaReclutamiento = ReglasReclutamiento[cantVenta].split(String.fromCharCode(44));     
                recREC.setFieldValue('custrecord_rec_no_ventas_totales',cantVentaTot);          
                recREC.setFieldValue('custrecord_rec_no_ventas_periodo',ReglasVentaReclutamiento[0]);   
                recREC.setFieldValue('custrecord_rec_total_comisiones',ReglasVentaReclutamiento[2]);
                //var recREC_ID = nlapiSubmitRecord(recREC);
                nlapiSubmitRecord(recREC);
            }
            if(recType=='customrecord_comisiones_gtm_det')
            {
                var recGTMDET       = nlapiLoadRecord('customrecord_comisiones_gtm_det',recId);
                var recGTM          = nlapiLoadRecord('customrecord_comisiones_gtm',recGTMDET.getFieldValue('custrecord_gtm_det_comision_gtm_id'));
                var tranID          = returnBlank(recGTMDET.getFieldValue('custrecord_gtm_det_factura'));
                if(tranID != '')
                {
                    var tranRec         = nlapiLoadRecord('salesorder',tranID);
                    var com_jdg         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg'));
                    if(com_jdg!='')
                    {
                        var com_jdg_s       = com_jdg.search(recGTMDET.getFieldValue('custrecord_gtm_det_comision_gtm_id'));
                        if(com_jdg_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg','');
                        }
                    }
                    var com_pre         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_pre'));
                    if(com_pre!='')
                    {
                        var com_pre_s       = com_pre.search(recGTMDET.getFieldValue('custrecord_gtm_det_comision_gtm_id'));
                        if(com_pre_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_pre','');
                        }
                    }
                    var com_gtm         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_gtm'));
                    if(com_gtm!='')
                    {
                        var com_gtm_s       = com_gtm.search(recGTMDET.getFieldValue('custrecord_gtm_det_comision_gtm_id'));
                        if(com_gtm_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_gtm','');
                        }
                    }
                    var com_rec         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_rec'));
                    if(com_rec!='')
                    {
                        var com_rec_s       = com_rec.search(recGTMDET.getFieldValue('custrecord_gtm_det_comision_gtm_id'));
                        if(com_rec_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_rec','');
                        }
                    }           
                    var com_jdg_split   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_split'));
                    if(com_jdg_split!='')
                    {
                        var com_jdg_split_s         = com_jdg_split.search(recGTMDET.getFieldValue('custrecord_gtm_det_comision_gtm_id'));
                        if(com_jdg_split_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_split','');
                        }
                    }
                    var com_jdg_super   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_super'));
                    if(com_jdg_super!='')
                    {
                        var com_jdg_super_s         = com_jdg_super.search(recGTMDET.getFieldValue('custrecord_gtm_det_comision_gtm_id'));
                        if(com_jdg_super_s!=-1)
                        {
                            tranRec.setFieldValue('custbody_comision_aplicada_jdg_super','');
                        }
                    }
                    nlapiSubmitRecord(tranRec);
                }
                var fileGanateTM = nlapiLoadFile(278);
                var ReglasGanateTM = fileGanateTM.getValue();   
                    ReglasGanateTM = ReglasGanateTM.split(String.fromCharCode(10));  
                    ReglasGanateTM.pop(); 
                var cantVentaTot = recGTM.getFieldValue('custrecord_gtm_no_ventas_totales');
                var ReglaVentaGanateTMTot = ReglasGanateTM[cantVentaTot].split(String.fromCharCode(44));
                var totalPeriodoActual =    parseFloat(ReglaVentaGanateTMTot[1]) + parseFloat(ReglaVentaGanateTMTot[2]);
                    cantVentaTot--;
                if(cantVentaTot<=0) { cantVentaTot=0; }     
                var cantVenta = recGTM.getFieldValue('custrecord_gtm_no_ventas_periodo');
                    cantVenta--;
                if(cantVenta<=0) { cantVenta=0; }       
                var ReglaVentaGanateTM = ReglasGanateTM[cantVenta].split(String.fromCharCode(44)); 
                var totalPeriodoAnterior =  parseFloat(ReglaVentaGanateTM[1]) + parseFloat(ReglaVentaGanateTM[2]);
                recGTM.setFieldValue('custrecord_gtm_no_ventas_totales',cantVentaTot);
                recGTM.setFieldValue('custrecord_gtm_no_ventas_periodo',ReglaVentaGanateTM[0]);
                recGTM.setFieldValue('custrecord_gtm_total_comisiones',parseFloat(totalPeriodoActual) - parseFloat(totalPeriodoAnterior));          
                //var recGTM_ID = nlapiSubmitRecord(recGTM);
                nlapiSubmitRecord(recGTM);
            }
        }
    }
}