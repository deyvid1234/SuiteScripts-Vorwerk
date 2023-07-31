//Elimina Valores Duplicados de un Arreglo
function deleteDuplicateElements(array)
{
    var lon = array.length;
    var i =0;
    var resultados = new Array();
    for(var cont=lon-1;cont>0;cont--)
    {
        if(array[cont]!=array[cont-1])
         { resultados[i]=array[cont]; i++; }              
    }
    resultados[i]=array[0];
    resultados.reverse();
    return resultados;
}
//Añade un valor de un arreglo
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
//helper, convierte las series en un arreglo.
function stringToArray(str,base)
{
     var multiSelectStringArray = str.split(String.fromCharCode(base));
     return multiSelectStringArray;
}
//Helper, elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
//Retorna un valo numerico 
function getVal(v)
{
    return parseFloat(v) || 0.0;
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
function saveRecord()
{
	var help   = 'Sí "Jefa de Grupo" aparece en color rojo esta cantidad' + String.fromCharCode(10) + 'no se tomará en cuenta para el cálculo de "Total"';
	var fec_V = nlapiGetFieldValue('custrecord_fecha_comision');
	var fc = nlapiGetFieldValue('custrecord_fecha_comision');
	var ec = nlapiGetFieldValue('custrecord_elegir_comision');
	var filters = new Array(), columns = new Array(),resultsJDG= new Array(),resultsPRE = new Array(), resultsGTM = new Array();
    var x=0,y=0, lonJDG=0, lonPRE=0, lonGTM=0;
    var b = new Boolean();
	var IDS = new String();
	if((fec_V.length==7) && (fec_V.charCodeAt(0)>=48 && fec_V.charCodeAt(0)<=57) && (fec_V.charCodeAt(1)>=48 && fec_V.charCodeAt(1)<=57) && (fec_V.charCodeAt(2)==47) && (fec_V.charCodeAt(3)>=48 && fec_V.charCodeAt(3)<=57) && (fec_V.charCodeAt(4)>=48 && fec_V.charCodeAt(4)<=57) && (fec_V.charCodeAt(5)>=48 && fec_V.charCodeAt(5)<=57) &&  (fec_V.charCodeAt(6)>=48 && fec_V.charCodeAt(6)<=57)) 
	{
		if(ec==1)
		{
			filters[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision',null, 'is', fc);
			resultsJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filters, null));			
			if(resultsJDG!='')
			{
			    lonJDG =resultsJDG.length;
                for(x=0;x<lonJDG;x++)
                {
                	IDS += resultsJDG[x].getId()+String.fromCharCode(64);
                }
                nlapiSetFieldValue('custrecord_enlace_detalle_id',IDS);
                nlapiSetFieldValue('custrecord_help',help);
                return true;
			}
			else
			{ 
				alert('Sin resultados, revise criterios');
				return false; 
			}
		}
		if(ec==2)
		{
            filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
            filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
            columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
            resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, columns));
            filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
            filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
            resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filters, null));
            if(resultsPRE!='')
            {
                lonPRE =resultsPRE.length;
                for(x=0;x<lonPRE;x++)
                {
                    IDS += resultsPRE[x].getId()+String.fromCharCode(64);
                }
                /*/
                var IDS =stringToArray(IDS,64);
                    IDS.pop();
                var ids_empleado_gtm_com_skip = new Array();
                for(g=0;g<resultsGTM.length;g++)
                {
                    ids_empleado_gtm_com_skip[g] = resultsGTM[g].getValue('custrecord_gtm_empleado');
                }
                for(var r = 0;r<IDS.length;r++)
                {
                    for(var g = 0;g<ids_empleado_gtm_com_skip.length;g++)
                    {
                        IDS = popArrayValue(IDS,ids_empleado_gtm_com_skip[g]);
                    }
                }
                IDS = IDS.join('@');
                /*/
                nlapiSetFieldValue('custrecord_enlace_detalle_id',IDS);
                return true;
            }
			else
			{ 
				alert('Sin resultados, revise criterios');
				return false; 
			}
		}
		if(ec==4)
		{
			filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
			columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
			resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, columns));
			filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
			columns[0] = new nlobjSearchColumn('custrecord_pre_empleado');
			resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filters, columns));
			var IDS = '';
			if(resultsGTM!='')
			{
			    lonGTM =resultsGTM.length;
			    lonPRE =resultsPRE.length;
                for(x=0;x<lonGTM;x++)
                {
			    	for(y=0;y<lonPRE;y++)
		            {
		            	if(resultsPRE[y].getValue('custrecord_pre_empleado')==resultsGTM[x].getValue('custrecord_gtm_empleado'))
		            	{ b = true; break;}
		            	else
		            	{ b = false; }
		            }
		            if(b==false) { IDS += resultsGTM[x].getId()+String.fromCharCode(64); }
                }
                if(IDS!='')
                {
	                nlapiSetFieldValue('custrecord_enlace_detalle_id',IDS);
	                return true;
	            }
	            else
	            {
	            	alert('Ha existido un cambio de esquema en las presentadoras, cambie el campo \"Elegir Comision\" a \"Presentadora\" para ver resultados agrupados.');
	            	return false;
	            }
			}
			else
			{ 
				alert('Sin resultados, revise criterios');
				return false; 
			}
		}
	}
	else 
	{ 
		alert('Formato invalido para \"Periodo Comision\", debe ser MM/AAAA.');
		return false; 
	}
}
function mostrarDetalleComisiones(type, form)
{
	if(type=='view')
	{
		var fc = nlapiGetFieldValue('custrecord_fecha_comision');
		var ec = nlapiGetFieldValue('custrecord_elegir_comision');
		var pre_filters = new Array(), pre_columns = new Array(),pre_resultsJDG= new Array(),pre_resultsPRE = new Array(), pre_resultsGTM = new Array();
	   	var pre_x=0,pre_y=0, pre_lonJDG=0, pre_lonPRE=0, pre_lonGTM=0;
    	var b = new Boolean();
		var pre_IDS = new String();
		if(ec==1)
		{
			pre_filters[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision',null, 'is', fc);
			pre_resultsJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, pre_filters, null));			
			if(pre_resultsJDG!='')
			{
			    pre_lonJDG =pre_resultsJDG.length;
                for(pre_x=0;pre_x<pre_lonJDG;pre_x++)
                {
                	pre_IDS += pre_resultsJDG[pre_x].getId()+String.fromCharCode(64);
                }
                nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custrecord_enlace_detalle_id',pre_IDS);
			}
		}
		if(ec==2)
		{
		    pre_filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
            pre_filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
            pre_columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
            pre_resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, pre_filters, pre_columns));
			pre_filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
			pre_resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, pre_filters, null));
			if(pre_resultsPRE!='')
			{
			    pre_lonPRE =pre_resultsPRE.length;
                for(pre_x=0;pre_x<pre_lonPRE;pre_x++)
                {
                	pre_IDS += pre_resultsPRE[pre_x].getId()+String.fromCharCode(64);
                }
                /*/
                var pre_IDS =stringToArray(pre_IDS,64);
                    pre_IDS.pop();
                var ids_empleado_gtm_com_skip = new Array();
                for(g=0;g<pre_resultsGTM.length;g++)
                {
                    ids_empleado_gtm_com_skip[g] = pre_resultsGTM[g].getValue('custrecord_gtm_empleado');
                }
                for(var r = 0;r<pre_IDS.length;r++)
                {
                    for(var g = 0;g<ids_empleado_gtm_com_skip.length;g++)
                    {
                        pre_IDS = popArrayValue(pre_IDS,ids_empleado_gtm_com_skip[g]);
                    }
                }
                pre_IDS = pre_IDS.join('@');
                /*/
                nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custrecord_enlace_detalle_id',pre_IDS);
			}
		}
		if(ec==4)
		{
			pre_filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
			pre_columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
			pre_resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, pre_filters, pre_columns));
			pre_filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
			pre_filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
			pre_columns[0] = new nlobjSearchColumn('custrecord_pre_empleado');
			pre_resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, pre_filters, pre_columns));
			if(pre_resultsGTM!='')
			{
			    pre_lonGTM =pre_resultsGTM.length;
			    pre_lonPRE =pre_resultsPRE.length;
                for(pre_x=0;pre_x<pre_lonGTM;pre_x++)
                {
			    	for(pre_y=0;pre_y<pre_lonPRE;pre_y++)
		            {
		            	if(pre_resultsPRE[pre_y].getValue('custrecord_pre_empleado')==pre_resultsGTM[pre_x].getValue('custrecord_gtm_empleado'))
		            	{ b = true; break;}
		            	else
		            	{ b = false; }
		            }
		            if(b==false) { pre_IDS += pre_resultsGTM[pre_x].getId()+String.fromCharCode(64); }
                }
                if(pre_IDS!='')
                {
	                nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custrecord_enlace_detalle_id',pre_IDS);
	            }
			}
		}
		/*/
		var help = 'Si el nombre de la Jefa de Grupo aparece en color rojo,' + String.fromCharCode(10) + 'esta cantidad no se toma en cuenta para el calculo de \"Total\"';
		fileVentaEquipo = new Object()
		ReglaGanateTM = new Array()
		ventas_gtm = 0
		resultsPRE = new Array()
		fileGanateTM = new Object()
		/*/
		form.addTab('custpage_tab_comisiones', 'Compensaciones');
		var detalleComisionesSublist = form.addSubList('custpage_detalle_comisiones', 'inlineeditor', 'Detalle Compensaciones','custpage_tab_comisiones');
			detalleComisionesSublist.setDisplayType('normal');
		var fileVentaPropio = new Object(),fileVentaEquipoNonSplit = new Object(),fileVentaEquipoSplit = new Object(), impRec = new Object();
		var filters = new Array(), columns = new Array(),resultsREC = new Array(), resultsJDG = new Array(),  resultsGTM = new Array();
		var ReglasVentaPropio = new Array(),ReglasVentaEquipo = new Array(),ReglaVentaPropio = new Array(),ReglaVentaEquipo = new Array(),ids_rec_com_skip = new Array() , ids_non = new Array(); 					
		var x=0,y=0,i=0, linea = 0,ventaPropia= 0, skip =0, ventaEquipo=0, ventaGTM= 0 ,ventaReclu= 0,pm_Equipo=0, pm_Propia=0,pm_GTM=0, retencion =0, total=0, subtotal=0, ventas_propio = 0, ventas_equipo = 0, ventasMin = 2;
		var ids_rec_com_non_skip = '';
		//nomEmp='';
		var rec = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());	
		var ids =stringToArray(rec.getFieldValue('custrecord_enlace_detalle_id'),64);
			ids.pop();
		if(ec==1)
		{
			detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			detalleComisionesSublist.addField('custpage_det_comision', 'select', 'Número','customrecord_comisiones_jdg');
			detalleComisionesSublist.addField('custpage_det_numero_empleado', 'text', 'ID Jefa de Grupo').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado', 'text', 'Jefa de Grupo');
			detalleComisionesSublist.addField('custpage_det_bono_manual', 'currency', 'Bono Manual');
			detalleComisionesSublist.addField('custpage_det_venta_propia', 'currency', 'Venta Propia');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia', 'currency', 'Puesta en Marcha (Propia)');
			detalleComisionesSublist.addField('custpage_det_venta_equipo', 'currency', '* Venta Equipo');
			detalleComisionesSublist.addField('custpage_det_puesta_bono_equipo', 'currency', '* Bono Equipo');
			detalleComisionesSublist.addField('custpage_det_reclutamiento', 'currency', 'Reclutamiento');
			detalleComisionesSublist.addField('custpage_det_subtotal', 'currency', 'Sub-Total');
			detalleComisionesSublist.addField('custpage_det_retencion', 'currency', 'Retencion');
			detalleComisionesSublist.addField('custpage_det_total', 'currency', 'Total');
			filters[0] = new nlobjSearchFilter('custrecord_jdg_fecha_comision','custrecord_jdg_det_comision_jdg_id', 'is', fc);
			columns[0] = new nlobjSearchColumn('custrecord_jdg_nombre_empleado','custrecord_jdg_det_comision_jdg_id').setSort(true);
			resultsJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg_det', 'customsearch_ss_jdg_det', filters, columns));
			filters[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			filters[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',2);
			filters[3] = new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',3);
			columns[0] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
			columns[1] = new nlobjSearchColumn('custrecord_rec_empleado');
			columns[2] = new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
			columns[3] = new nlobjSearchColumn('custrecord_rec_categoria_empleado');
			columns[4] = new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
			resultsREC = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));
			var fcNonZero			 = quitarCeroMes(fc);
			var color                = '#000000';
			var indexArchivos        = 0;
			var fechaCambioComp      = '23/'+fcNonZero;
			    fechaCambioComp      = nlapiStringToDate(fechaCambioComp);
			var fechaCambioCompMS    = fechaCambioComp.getTime();
			//1335164400000 = 23/4/2012
			if(fechaCambioCompMS <= 1335164400000)
			{
			    indexArchivos = 1;
			    ventasMin     = 2;
			}
			if(fechaCambioCompMS >= 1335164400001)
			{
			    indexArchivos = 2;
			    ventasMin     = 3;
			}
			switch(indexArchivos)
			{
			    case 1:
			    {
			        fileVentaPropio = nlapiLoadFile(138921);
                    ReglasVentaPropio = fileVentaPropio.getValue(); 
                    ReglasVentaPropio = ReglasVentaPropio.split(String.fromCharCode(10));  
                    ReglasVentaPropio.pop();
                    fileVentaEquipoNonSplit = nlapiLoadFile(138919);
                    fileVentaEquipoSplit = nlapiLoadFile(138920);   
			    };break;
			    case 2:
			    {
			        fileVentaPropio = nlapiLoadFile(277);
                    ReglasVentaPropio = fileVentaPropio.getValue(); 
                    ReglasVentaPropio = ReglasVentaPropio.split(String.fromCharCode(10));  
                    ReglasVentaPropio.pop();
                    fileVentaEquipoNonSplit = nlapiLoadFile(276);
                    fileVentaEquipoSplit = nlapiLoadFile(276);   
			        
			    };break;
			    default:
			    {
			        
			    };break;
			}
			var fcAux = fc.split('/');
			var filtersFC = new nlobjSearchFilter('custrecord_year', null, 'equalto', fcAux[1]);
			var columnsFC = new Array();
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
			var line = 0;
			for(i=0;i<ids.length;i++)
			{
				for(var iAux=0;iAux<resultsJDG.length;iAux++)
				{
					if(ids[i]==resultsJDG[iAux].getValue('custrecord_jdg_det_comision_jdg_id'))
					{
						var fisSupervisorMS = returnBlank(resultsJDG[iAux].getValue('custentity_fecha_inicio_split', 'CUSTRECORD_JDG_DET_EMPLEADO_ID'));
						var ffsSupervisorMS = returnBlank(resultsJDG[iAux].getValue('custentity_fecha_fin_split','CUSTRECORD_JDG_DET_EMPLEADO_ID'));
						if(fisSupervisorMS!='' && ffsSupervisorMS!='')
						{ 
							fisSupervisorMS = nlapiStringToDate(fisSupervisorMS);
							fisSupervisorMS = fisSupervisorMS.getTime();
							ffsSupervisorMS = nlapiStringToDate(ffsSupervisorMS);
							ffsSupervisorMS = ffsSupervisorMS.getTime();
							if(parseFloat(fc[0])<10)
							{
							  fcMes = fcAux[0].replace('0','');
							}
							else
							{
							  fcMes = fcAux[0];
							}
							var diaFC = resultsFechasCorte[0].getValue(('custrecord_mes_'+fcMes));
							var fcNonZero			 = quitarCeroMes(fc);
							fcAux = diaFC+'/'+fcNonZero;
							var factFecMS = nlapiStringToDate(fcAux);
								factFecMS.getTime();
							if(factFecMS >= fisSupervisorMS && factFecMS <= ffsSupervisorMS)
							{
								ReglasVentaEquipo = fileVentaEquipoSplit.getValue();	
								ReglasVentaEquipo = ReglasVentaEquipo.split(String.fromCharCode(10));  
								ReglasVentaEquipo.pop();
							}
							else
							{
								ReglasVentaEquipo = fileVentaEquipoNonSplit.getValue();	
								ReglasVentaEquipo = ReglasVentaEquipo.split(String.fromCharCode(10));  
								ReglasVentaEquipo.pop();
							}
						}
						else
						{
							ReglasVentaEquipo = fileVentaEquipoNonSplit.getValue();	
							ReglasVentaEquipo = ReglasVentaEquipo.split(String.fromCharCode(10));  
							ReglasVentaEquipo.pop();
						}
						impRec = nlapiLoadRecord('customrecord_comisiones_jdg',ids[i]);
						bono_manual = impRec.getFieldValue('custrecord_jdg_bono_manual');
						ventas_propio = impRec.getFieldValue('custrecord_jdg_no_ventas_propio');
						ventas_equipo = impRec.getFieldValue('custrecord_jdg_no_ventas_equipo');
						ReglaVentaPropio = ReglasVentaPropio[ventas_propio].split(String.fromCharCode(44));
						ventaPropia = ReglaVentaPropio[5];
						pm_Propia   = ReglaVentaPropio[2];	
						ventaReclu =0;		
						switch(indexArchivos)
                        {
                            case 1:
                            {
                                ReglaVentaEquipo = ReglasVentaEquipo[ventas_equipo].split(String.fromCharCode(44));
                                ventaEquipo = ReglaVentaEquipo[1];
                                pm_Equipo   = ReglaVentaEquipo[2];
                            };break;
                            case 2:
                            {
                                ventaEquipo = getVal(impRec.getFieldValue('custrecord_jdg_total_comisiones_equipo'));
                                pm_Equipo   = getVal(0);
                                
                            };break;
                            default:
                            {
                                
                            };break;
                        }
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getValue('custrecord_rec_reclutadora')==impRec.getFieldValue('custrecord_jdg_empleado'))
							{
								ventaReclu += parseFloat(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
								ids_rec_com_skip[skip] = resultsREC[x].getId();
								skip++;
							}
						}
						if(parseFloat(ventas_propio)>=ventasMin)
						{ 
						    color    = '#000000';
						    subtotal = parseFloat(ventaPropia) + parseFloat(ventaEquipo) + parseFloat(pm_Equipo) + parseFloat(ventaReclu) + parseFloat(bono_manual); 
					    }
		            	else
		            	{ 
		            	    color    = '#FF0000';
		            	    subtotal = parseFloat(ventaPropia) + parseFloat(ventaReclu) + parseFloat(bono_manual); 
		            	}
		            	retencion = 0.0;
		            	total = 0.0;           	
		            	if(subtotal>=0.01     && subtotal<=496.07  ) { total = (subtotal - 0      ) - (subtotal - 0.01    )*(1.92/100); }
		            	if(subtotal>=496.08   && subtotal<=4210.41 ) { total = (subtotal - 9.52   ) - (subtotal - 496.08  )*(6.40/100); }
		            	if(subtotal>=4210.42  && subtotal<=7399.42 ) { total = (subtotal - 247.23 ) - (subtotal - 4210.42 )*(10.88/100); }
		            	if(subtotal>=7399.43  && subtotal<=8601.50 ) { total = (subtotal - 594.24 ) - (subtotal - 7399.43 )*(16.00/100); }
		            	if(subtotal>=8601.51  && subtotal<=10298.35) { total = (subtotal - 786.55 ) - (subtotal - 8601.51 )*(17.92/100); }
		            	if(subtotal>=10298.36 && subtotal<=20770.29) { total = (subtotal - 1090.62) - (subtotal - 10298.36)*(21.36/100); }
		            	if(subtotal>=20770.30 && subtotal<=32736.83) { total = (subtotal - 3327.43) - (subtotal - 20770.30)*(23.52/100); }
		            	if(subtotal>=32736.83                      ) { total = (subtotal - 6141.95) - (subtotal - 32736.83)*(30.00/100); }
		            	retencion= subtotal-total;
		            	var custpage_det_nombre_empleado = new String(impRec.getFieldValue('custrecord_jdg_nombre_empleado'));
		            	var num_emp						 = stringToArray(custpage_det_nombre_empleado, 32);
		            	var lineNumber = new Number(line + 1);
		            	    lineNumber.toString();
		    			detalleComisionesSublist.setLineItemValue('custpage_det_linea', line+1, lineNumber);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_comision', line+1, ids[i]);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', line+1, num_emp[0]);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', line+1, custpage_det_nombre_empleado.fontcolor(color));
		    			detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', line+1,bono_manual);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', line+1,(ventaPropia - pm_Propia));
		    			detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', line+1, pm_Propia);
	    			    detalleComisionesSublist.setLineItemValue('custpage_det_venta_equipo', line+1,ventaEquipo); 
		    			detalleComisionesSublist.setLineItemValue('custpage_det_puesta_bono_equipo', line+1, pm_Equipo);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', line+1, ventaReclu);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', line+1, subtotal);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_retencion', line+1, retencion);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_total', line+1, total);
		    			line++;
		    			break;
		    		}
				}
			}
			if(ids_rec_com_skip.length!=resultsREC.length)
			{
				linea = detalleComisionesSublist.getLineItemCount()+1;
				ids_rec_com_skip.sort();
				var	lon =ids_rec_com_skip.length;
				i =0;
                var resultados = new Array();
				var resultadosAux = new Array();
				var contR = 0;
				for(var cont=lon-1;cont>0;cont--)
				{
					if(ids_rec_com_skip[cont]!=ids_rec_com_skip[cont-1])
					 { resultados[i]=ids_rec_com_skip[cont]; i++; }	             
				}
				resultados[i]=ids_rec_com_skip[0];
				resultados.reverse();
				ids_rec_com_skip = resultados;
				for(x=0;x<resultsREC.length;x++)
				{
					ids_rec_com_non_skip += resultsREC[x].getId()+String.fromCharCode(64);
				}
				for(i=0; i<ids_rec_com_skip.length;i++)
				{
					ids_rec_com_non_skip = ids_rec_com_non_skip.split((ids_rec_com_skip[i]+'@'));
					ids_rec_com_non_skip = ids_rec_com_non_skip.join('');
				}
				ids_rec_com_non_skip = ids_rec_com_non_skip.split('@');
				ids_rec_com_non_skip.pop();
				if(ids_rec_com_non_skip.length!=0)
				{
					for(y=0;y<ids_rec_com_non_skip.length;y++)
					{
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getId()==ids_rec_com_non_skip[y])
							{
								resultadosAux[contR] = resultsREC[x];
								contR++;
							}
						}
					}
		            lon =resultadosAux.length;
					i =0;
					resultados = new Array();
					for(var cont=lon-1;cont>0;cont--)
					{
						if(resultadosAux[cont].getValue('custrecord_rec_reclutadora')!=resultadosAux[cont-1].getValue('custrecord_rec_reclutadora'))
						 { resultados[i]=resultadosAux[cont].getValue('custrecord_rec_reclutadora'); i++; }	             
					}
					resultados[i]=resultadosAux[0].getValue('custrecord_rec_reclutadora');
					resultados.reverse();
					for(y=0;y<resultados.length;y++)
					{
						ventaReclu =0;
						var nomEmp = new String();
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getValue('custrecord_rec_reclutadora')==resultados[y])
							{
								ventaReclu += parseFloat(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
								nomEmp = resultsREC[x].getText('custrecord_rec_reclutadora');
							}
						}
						subtotal = parseFloat(ventaReclu);
		            	retencion = 0.0;
		            	total = 0.0;           	
		            	if(subtotal>=0.01     && subtotal<=496.07  ) { total = (subtotal - 0      ) - (subtotal - 0.01    )*(1.92/100); }
		            	if(subtotal>=496.08   && subtotal<=4210.41 ) { total = (subtotal - 9.52   ) - (subtotal - 496.08  )*(6.40/100); }
		            	if(subtotal>=4210.42  && subtotal<=7399.42 ) { total = (subtotal - 247.23 ) - (subtotal - 4210.42 )*(10.88/100); }
		            	if(subtotal>=7399.43  && subtotal<=8601.50 ) { total = (subtotal - 594.24 ) - (subtotal - 7399.43 )*(16.00/100); }
		            	if(subtotal>=8601.51  && subtotal<=10298.35) { total = (subtotal - 786.55 ) - (subtotal - 8601.51 )*(17.92/100); }
		            	if(subtotal>=10298.36 && subtotal<=20770.29) { total = (subtotal - 1090.62) - (subtotal - 10298.36)*(21.36/100); }
		            	if(subtotal>=20770.30 && subtotal<=32736.83) { total = (subtotal - 3327.43) - (subtotal - 20770.30)*(23.52/100); }
		            	if(subtotal>=32736.83                      ) { total = (subtotal - 6141.95) - (subtotal - 32736.83)*(30.00/100); }
		            	retencion      = subtotal-total;
		            	var num_emp						 = stringToArray(nomEmp, 32);
                        var lineNumber = new Number(linea);
                            lineNumber.toString();
                        detalleComisionesSublist.setLineItemValue('custpage_det_linea', linea, lineNumber);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_comision', linea, '');
		    			detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', linea, num_emp[0]);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', linea, nomEmp);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', linea,0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', linea,0 );
		    			detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', linea,0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_equipo', linea, 0);
						detalleComisionesSublist.setLineItemValue('custpage_det_puesta_bono_equipo',linea, 0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', linea, ventaReclu);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', linea, subtotal);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_retencion', linea, retencion);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_total',linea, total);
	    				linea++;;
	    			}
	    		}
			}
		}
		if(ec==2)
		{
		    detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			detalleComisionesSublist.addField('custpage_det_comision', 'select', 'Número','customrecord_comisiones_pre');
			detalleComisionesSublist.addField('custpage_det_numero_empleado', 'text', 'ID Presentadora').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado', 'text', 'Presentadora');
			detalleComisionesSublist.addField('custpage_det_bono_manual', 'currency', 'Bono Manual');
			detalleComisionesSublist.addField('custpage_det_venta_propia', 'currency', 'Venta Propia');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia', 'currency', 'Puesta en Marcha');
			detalleComisionesSublist.addField('custpage_det_venta_gtm', 'currency', 'Venta Propia GTM');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia_gtm', 'currency', 'Puesta en Marcha GTM' );
			detalleComisionesSublist.addField('custpage_det_reclutamiento', 'currency', 'Reclutamiento');
			detalleComisionesSublist.addField('custpage_det_subtotal', 'currency', 'Sub-Total');
			detalleComisionesSublist.addField('custpage_det_retencion', 'currency', 'Retencion');
			detalleComisionesSublist.addField('custpage_det_total', 'currency', 'Total');
			filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fc);
			columns[0] = new nlobjSearchColumn('custrecord_gtm_puesta_marcha');
			columns[1] = new nlobjSearchColumn('custrecord_gtm_total_comisiones');
			columns[2] = new nlobjSearchColumn('custrecord_gtm_empleado');
			resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, columns));
			filters[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			filters[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',2);
			filters[3] = new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',1);
			columns[0] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
			columns[1] = new nlobjSearchColumn('custrecord_rec_empleado');
			columns[2] = new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
			columns[3] = new nlobjSearchColumn('custrecord_rec_categoria_empleado');
			columns[4] = new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
			resultsREC = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));
			//var color                = '#000000';
			var fcNonZero			 = quitarCeroMes(fc);
            var indexArchivos        = 0;
            var fechaCambioComp      = '23/'+fcNonZero;
                fechaCambioComp      = nlapiStringToDate(fechaCambioComp);
            var fechaCambioCompMS    = fechaCambioComp.getTime();
            //1335164400000 = 23/4/2012
            if(fechaCambioCompMS <= 1335164400000)
            {
                indexArchivos = 1;
                ventasMin     = 2;
            }
            if(fechaCambioCompMS >= 1335164400001)
            {
                indexArchivos = 2;
                ventasMin     = 3;
            }
            switch(indexArchivos)
            {
                case 1:
                {
                    fileVentaPropio = nlapiLoadFile(138921);
                    ReglasVentaPropio = fileVentaPropio.getValue(); 
                    ReglasVentaPropio = ReglasVentaPropio.split(String.fromCharCode(10));  
                    ReglasVentaPropio.pop();
                };break;
                case 2:
                {
                    fileVentaPropio = nlapiLoadFile(277);
                    ReglasVentaPropio = fileVentaPropio.getValue(); 
                    ReglasVentaPropio = ReglasVentaPropio.split(String.fromCharCode(10));  
                    ReglasVentaPropio.pop();
                };break;
                default:
                {
                    
                };break;
            }
			for(i=0;i<ids.length;i++)
			{
				
				impRec = nlapiLoadRecord('customrecord_comisiones_pre',ids[i]);
				bono_manual = impRec.getFieldValue('custrecord_pre_bono_manual');
				ventas_propio = impRec.getFieldValue('custrecord_pre_no_ventas');
				ReglaVentaPropio = ReglasVentaPropio[ventas_propio].split(String.fromCharCode(44)); 
				ventaPropia = parseFloat(ReglaVentaPropio[5]);
				pm_Propia   = parseFloat(ReglaVentaPropio[2]);
				ventaReclu =0;
				ventaGTM =0;
				pm_GTM =0;
				for(x=0;x<resultsREC.length;x++)
				{
					if(resultsREC[x].getValue('custrecord_rec_reclutadora')==impRec.getFieldValue('custrecord_pre_empleado'))
					{
						ventaReclu += parseFloat(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
						ids_rec_com_skip[skip] = resultsREC[x].getId();
						skip++;
					}
				}
				for(x=0;x<resultsGTM.length;x++)
				{
					if(resultsGTM[x].getValue('custrecord_gtm_empleado')==impRec.getFieldValue('custrecord_pre_empleado'))
					{
						ventaGTM = parseFloat(resultsGTM[x].getValue('custrecord_gtm_total_comisiones'));
						pm_GTM  =  parseFloat(resultsGTM[x].getValue('custrecord_gtm_puesta_marcha'));
						break;
					}
				}
				subtotal = parseFloat(ventaPropia) + parseFloat(ventaReclu) + parseFloat(ventaGTM) + parseFloat(bono_manual);
            	retencion = 0.0;
            	total = 0.0;           	
            	if(subtotal>=0.01     && subtotal<=496.07  ) { total = (subtotal - 0      ) - (subtotal - 0.01    )*(1.92/100); }
            	if(subtotal>=496.08   && subtotal<=4210.41 ) { total = (subtotal - 9.52   ) - (subtotal - 496.08  )*(6.40/100); }
            	if(subtotal>=4210.42  && subtotal<=7399.42 ) { total = (subtotal - 247.23 ) - (subtotal - 4210.42 )*(10.88/100); }
            	if(subtotal>=7399.43  && subtotal<=8601.50 ) { total = (subtotal - 594.24 ) - (subtotal - 7399.43 )*(16.00/100); }
            	if(subtotal>=8601.51  && subtotal<=10298.35) { total = (subtotal - 786.55 ) - (subtotal - 8601.51 )*(17.92/100); }
            	if(subtotal>=10298.36 && subtotal<=20770.29) { total = (subtotal - 1090.62) - (subtotal - 10298.36)*(21.36/100); }
            	if(subtotal>=20770.30 && subtotal<=32736.83) { total = (subtotal - 3327.43) - (subtotal - 20770.30)*(23.52/100); }
            	if(subtotal>=32736.83                      ) { total = (subtotal - 6141.95) - (subtotal - 32736.83)*(30.00/100); }
            	retencion= subtotal-total;
            	var nomEmp						= impRec.getFieldValue('custrecord_pre_nombre_empleado');
            	var num_emp						= stringToArray(nomEmp, 32);
            	var lineNumber = new Number(i +1);
                    lineNumber.toString();
                detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
    			detalleComisionesSublist.setLineItemValue('custpage_det_comision', i+1, ids[i]);
    			detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', i+1, num_emp[0]);
    			detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', i+1, nomEmp);
    			detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', i+1,bono_manual);
    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', i+1,ventaPropia - pm_Propia);
    			detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', i+1, pm_Propia);
    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_gtm', i+1, ventaGTM);
				detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia_gtm', i+1, pm_GTM);
    			detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', i+1, ventaReclu);
    			detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', i+1, subtotal);
    			detalleComisionesSublist.setLineItemValue('custpage_det_retencion', i+1, retencion);
    			detalleComisionesSublist.setLineItemValue('custpage_det_total', i+1, total);
			}
			if(ids_rec_com_skip.length!=resultsREC.length)
			{
				linea = detalleComisionesSublist.getLineItemCount()+1;
				for(x=0;x<resultsREC.length;x++)
				{
					ids_rec_com_non_skip += resultsREC[x].getId()+String.fromCharCode(64);
				}
				for(i=0; i<ids_rec_com_skip.length;i++)
				{
					ids_rec_com_non_skip = ids_rec_com_non_skip.split((ids_rec_com_skip[i]+'@'));
					ids_rec_com_non_skip = ids_rec_com_non_skip.join('');
				}
				ids_rec_com_non_skip = ids_rec_com_non_skip.split('@');
				ids_rec_com_non_skip.pop();				
				if(ids_rec_com_non_skip.length!=0)
				{
					var resultados = new Array();
					var resultadosAux = new Array();
					var contR = 0;
					for(y=0;y<ids_rec_com_non_skip.length;y++)
					{
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getId()==ids_rec_com_non_skip[y])
							{
								resultadosAux[contR] = resultsREC[x];
								contR++;
							}
						}
					}
		            var	lon =resultadosAux.length;
					i =0;
					resultados = new Array();
					for(var cont=lon-1;cont>0;cont--)
					{
						if(resultadosAux[cont].getValue('custrecord_rec_reclutadora')!=resultadosAux[cont-1].getValue('custrecord_rec_reclutadora'))
						 { resultados[i]=resultadosAux[cont].getValue('custrecord_rec_reclutadora'); i++; }	             
					}
					resultados[i]=resultadosAux[0].getValue('custrecord_rec_reclutadora');
					resultados.reverse();
					var ids_empleado_gtm_com_skip = new Array();
                    for(var g=0;g<resultsGTM.length;g++)
                    {
                        ids_empleado_gtm_com_skip[g] = resultsGTM[g].getValue('custrecord_gtm_empleado');
                    }
                    for(var r = 0;r<resultados.length;r++)
                    {
                        for(var g = 0;g<ids_empleado_gtm_com_skip.length;g++)
                        {
                            resultados = popArrayValue(resultados,ids_empleado_gtm_com_skip[g]);
                        }
                    }
					for(y=0;y<resultados.length;y++)
					{
						ventaReclu =0;
						nomEmp ='';
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getValue('custrecord_rec_reclutadora')==resultados[y])
							{
								ventaReclu += parseFloat(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
								nomEmp = resultsREC[x].getText('custrecord_rec_reclutadora');
							}
						}
						subtotal = parseFloat(ventaReclu);
		            	retencion = 0.0;
		            	total = 0.0;           	
		            	if(subtotal>=0.01     && subtotal<=496.07  ) { total = (subtotal - 0      ) - (subtotal - 0.01    )*(1.92/100); }
		            	if(subtotal>=496.08   && subtotal<=4210.41 ) { total = (subtotal - 9.52   ) - (subtotal - 496.08  )*(6.40/100); }
		            	if(subtotal>=4210.42  && subtotal<=7399.42 ) { total = (subtotal - 247.23 ) - (subtotal - 4210.42 )*(10.88/100); }
		            	if(subtotal>=7399.43  && subtotal<=8601.50 ) { total = (subtotal - 594.24 ) - (subtotal - 7399.43 )*(16.00/100); }
		            	if(subtotal>=8601.51  && subtotal<=10298.35) { total = (subtotal - 786.55 ) - (subtotal - 8601.51 )*(17.92/100); }
		            	if(subtotal>=10298.36 && subtotal<=20770.29) { total = (subtotal - 1090.62) - (subtotal - 10298.36)*(21.36/100); }
		            	if(subtotal>=20770.30 && subtotal<=32736.83) { total = (subtotal - 3327.43) - (subtotal - 20770.30)*(23.52/100); }
		            	if(subtotal>=32736.83                      ) { total = (subtotal - 6141.95) - (subtotal - 32736.83)*(30.00/100); }
		            	retencion= subtotal-total;
		            	var num_emp						= stringToArray(nomEmp, 32);
		            	var lineNumber = new Number(linea);
                            lineNumber.toString();
                        detalleComisionesSublist.setLineItemValue('custpage_det_linea', linea, lineNumber);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_comision', linea, '');
		    			detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', linea, num_emp[0]);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', linea, nomEmp);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', linea,0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', linea,0 );
		    			detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', linea,0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_gtm', linea, 0);
						detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia_gtm',linea, 0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', linea, ventaReclu);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', linea, subtotal);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_retencion', linea, retencion);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_total',linea, total);
	    				linea++;
	    			}
	    		}
			}
		}
		if(ec==4)
		{
	        detalleComisionesSublist.addField('custpage_det_linea', 'integer', '#');
			detalleComisionesSublist.addField('custpage_det_comision', 'select', 'Número','customrecord_comisiones_gtm');
			detalleComisionesSublist.addField('custpage_det_numero_empleado', 'text', 'ID Empleado').setDisplayType('hidden');
			detalleComisionesSublist.addField('custpage_det_nombre_empleado', 'text', 'Nombre Empleado');
			detalleComisionesSublist.addField('custpage_det_bono_manual', 'currency', 'Bono Manual');
			detalleComisionesSublist.addField('custpage_det_venta_propia', 'currency', 'Venta Propia');
			detalleComisionesSublist.addField('custpage_det_puesta_marcha_propia', 'currency', 'Puesta en Marcha');
			detalleComisionesSublist.addField('custpage_det_reclutamiento', 'currency', 'Reclutamiento');
			detalleComisionesSublist.addField('custpage_det_subtotal', 'currency', 'Sub-Total');
			detalleComisionesSublist.addField('custpage_det_retencion', 'currency', 'Retencion');
			detalleComisionesSublist.addField('custpage_det_total', 'currency', 'Total');
			filters[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
			columns[0] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
			columns[1] = new nlobjSearchColumn('custrecord_rec_empleado');
			columns[2] = new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
			columns[3] = new nlobjSearchColumn('custrecord_rec_categoria_empleado');
			columns[4] = new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
			resultsREC = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));
	        for(i=0;i<ids.length;i++)
			{
			    
				impRec = nlapiLoadRecord('customrecord_comisiones_gtm',ids[i]);
				bono_manual = impRec.getFieldValue('custrecord_gtm_bono_manual');
				ventas_gtm = impRec.getFieldValue('custrecord_gtm_no_ventas_periodo');
				ventaGTM = impRec.getFieldValue('custrecord_gtm_total_comisiones');
				pm_GTM   = impRec.getFieldValue('custrecord_gtm_puesta_marcha');	
				ventaReclu =0;
				for(x=0;x<resultsREC.length;x++)
				{
					if(resultsREC[x].getValue('custrecord_rec_reclutadora')==impRec.getFieldValue('custrecord_gtm_empleado'))
					{
						ventaReclu += parseFloat(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
						ids_non[skip] = resultsREC[x].getId();
						skip++;
					}
				}		
				subtotal = parseFloat(ventaGTM) + parseFloat(ventaReclu) + parseFloat(bono_manual);
            	retencion = 0.0;
            	total = 0.0;           	
            	if(subtotal>=0.01     && subtotal<=496.07  ) { total = (subtotal - 0      ) - (subtotal - 0.01    )*(1.92/100); }
            	if(subtotal>=496.08   && subtotal<=4210.41 ) { total = (subtotal - 9.52   ) - (subtotal - 496.08  )*(6.40/100); }
            	if(subtotal>=4210.42  && subtotal<=7399.42 ) { total = (subtotal - 247.23 ) - (subtotal - 4210.42 )*(10.88/100); }
            	if(subtotal>=7399.43  && subtotal<=8601.50 ) { total = (subtotal - 594.24 ) - (subtotal - 7399.43 )*(16.00/100); }
            	if(subtotal>=8601.51  && subtotal<=10298.35) { total = (subtotal - 786.55 ) - (subtotal - 8601.51 )*(17.92/100); }
            	if(subtotal>=10298.36 && subtotal<=20770.29) { total = (subtotal - 1090.62) - (subtotal - 10298.36)*(21.36/100); }
            	if(subtotal>=20770.30 && subtotal<=32736.83) { total = (subtotal - 3327.43) - (subtotal - 20770.30)*(23.52/100); }
            	if(subtotal>=32736.83                      ) { total = (subtotal - 6141.95) - (subtotal - 32736.83)*(30.00/100); }
            	retencion= subtotal-total;
            	var nomEmp						= impRec.getFieldValue('custrecord_gtm_nombre_empleado');
            	var num_emp						= stringToArray(nomEmp, 32);
                var lineNumber = new Number(i +1);
                    lineNumber.toString();
                detalleComisionesSublist.setLineItemValue('custpage_det_linea', i+1, lineNumber);
    			detalleComisionesSublist.setLineItemValue('custpage_det_comision', i+1, ids[i]);
    			detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', i+1,num_emp[0] );
    			detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', i+1,nomEmp );
    			detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', i+1,bono_manual);
    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', i+1,ventaGTM );
    			detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', i+1, pm_GTM);
    			detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', i+1, ventaReclu);
    			detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', i+1, subtotal);
    			detalleComisionesSublist.setLineItemValue('custpage_det_retencion', i+1, retencion);
    			detalleComisionesSublist.setLineItemValue('custpage_det_total', i+1, total);
			}
			if(ids_non.length!=0)
            {
                linea = detalleComisionesSublist.getLineItemCount()+1;
                filters[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'noneof', '@NONE@');
                filters[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision',null, 'is', fc);
                filters[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora',null,'is',1);
                filters[3] = new nlobjSearchFilter('custrecord_rec_categoria_empleado',null,'is',1);
                filters[4] = new nlobjSearchFilter('internalid',null,'noneof',ids_non);
                columns[0] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
                columns[1] = new nlobjSearchColumn('custrecord_rec_empleado');
                columns[2] = new nlobjSearchColumn('custrecord_rec_reclutadora').setSort(true);
                columns[3] = new nlobjSearchColumn('custrecord_rec_categoria_empleado');
                columns[4] = new nlobjSearchColumn('custrecord_rec_esquema_reclutadora');
                resultsREC = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns));
                if(resultsREC != '')
                {
                    var ids_rec_reclutadora = new Array();
                    for(y=0;y<resultsREC.length;y++)
                    {
                        ids_rec_reclutadora[y] = resultsREC[y].getValue('custrecord_rec_reclutadora');
                    }
                    ids_rec_reclutadora = deleteDuplicateElements(ids_rec_reclutadora);
                    for(y=0;y<ids_rec_reclutadora.length;y++)
                    {
                        ventaReclu =0;
                        nomEmp ='';
                        for(x=0;x<resultsREC.length;x++)
                        {
                            if(resultsREC[x].getValue('custrecord_rec_reclutadora')==ids_rec_reclutadora[y])
                            {
                                ventaReclu += parseFloat(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
                                nomEmp = resultsREC[x].getText('custrecord_rec_reclutadora');
                            }
                        }
                        subtotal = parseFloat(ventaReclu);
                        retencion = 0.0;
                        total = 0.0;            
                        if(subtotal>=0.01     && subtotal<=496.07  ) { total = (subtotal - 0      ) - (subtotal - 0.01    )*(1.92/100); }
                        if(subtotal>=496.08   && subtotal<=4210.41 ) { total = (subtotal - 9.52   ) - (subtotal - 496.08  )*(6.40/100); }
                        if(subtotal>=4210.42  && subtotal<=7399.42 ) { total = (subtotal - 247.23 ) - (subtotal - 4210.42 )*(10.88/100); }
                        if(subtotal>=7399.43  && subtotal<=8601.50 ) { total = (subtotal - 594.24 ) - (subtotal - 7399.43 )*(16.00/100); }
                        if(subtotal>=8601.51  && subtotal<=10298.35) { total = (subtotal - 786.55 ) - (subtotal - 8601.51 )*(17.92/100); }
                        if(subtotal>=10298.36 && subtotal<=20770.29) { total = (subtotal - 1090.62) - (subtotal - 10298.36)*(21.36/100); }
                        if(subtotal>=20770.30 && subtotal<=32736.83) { total = (subtotal - 3327.43) - (subtotal - 20770.30)*(23.52/100); }
                        if(subtotal>=32736.83                      ) { total = (subtotal - 6141.95) - (subtotal - 32736.83)*(30.00/100); }
                        retencion= subtotal-total;
		            	var num_emp						= stringToArray(nomEmp, 32);
                        var lineNumber = new Number(linea);
                            lineNumber.toString();
                        detalleComisionesSublist.setLineItemValue('custpage_det_linea', linea, lineNumber);
                        detalleComisionesSublist.setLineItemValue('custpage_det_comision', linea, '');
                        detalleComisionesSublist.setLineItemValue('custpage_det_numero_empleado', linea, num_emp[0]);
                        detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', linea, nomEmp);
                        detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', linea,0);
                        detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', linea,0 );
                        detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', linea,0);
                        detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', linea, ventaReclu);
                        detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', linea, subtotal);
                        detalleComisionesSublist.setLineItemValue('custpage_det_retencion', linea, retencion);
                        detalleComisionesSublist.setLineItemValue('custpage_det_total',linea, total);
                        linea++;
                    }
                }
			}
			/*/
			if(ids_rec_com_skip.length!=resultsREC.length)
			{
				linea = detalleComisionesSublist.getLineItemCount()+1;
				for(x=0;x<resultsREC.length;x++)
				{
					ids_rec_com_non_skip += resultsREC[x].getId()+String.fromCharCode(64);
				}
				for(i=0; i<ids_rec_com_skip.length;i++)
				{
					ids_rec_com_non_skip = ids_rec_com_non_skip.split((ids_rec_com_skip[i]+'@'));
					ids_rec_com_non_skip = ids_rec_com_non_skip.join('');
				}
				ids_rec_com_non_skip = ids_rec_com_non_skip.split('@');
				ids_rec_com_non_skip.pop();
				if(ids_rec_com_non_skip.length!=0)
				{
					var resultados = new Array();
					var resultadosAux = new Array();
					var contR = 0;
					for(y=0;y<ids_rec_com_non_skip.length;y++)
					{
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getId()==ids_rec_com_non_skip[y])
							{
								resultadosAux[contR] = resultsREC[x];
								contR++;
							}
						}
					}
		            var	lon =resultadosAux.length;
					i =0;
					resultados = new Array();
					for(var cont=lon-1;cont>0;cont--)
					{
						if(resultadosAux[cont].getValue('custrecord_rec_reclutadora')!=resultadosAux[cont-1].getValue('custrecord_rec_reclutadora'))
						 { resultados[i]=resultadosAux[cont].getValue('custrecord_rec_reclutadora'); i++; }	             
					}
					resultados[i]=resultadosAux[0].getValue('custrecord_rec_reclutadora');
					resultados.reverse();
					for(y=0;y<resultados.length;y++)
					{
						ventaReclu =0;
						nomEmp ='';
						for(x=0;x<resultsREC.length;x++)
						{
							if(resultsREC[x].getValue('custrecord_rec_reclutadora')==resultados[y])
							{
								ventaReclu += parseFloat(resultsREC[x].getValue('custrecord_rec_total_comisiones'));
								nomEmp = resultsREC[x].getText('custrecord_rec_reclutadora');
							}
						}
						subtotal = parseFloat(ventaReclu);
		            	retencion = 0.0;
		            	total = 0.0;           	
		            	if(subtotal>=0.01     && subtotal<=496.07  ) { total = (subtotal - 0      ) - (subtotal - 0.01    )*(1.92/100); }
		            	if(subtotal>=496.08   && subtotal<=4210.41 ) { total = (subtotal - 9.52   ) - (subtotal - 496.08  )*(6.40/100); }
		            	if(subtotal>=4210.42  && subtotal<=7399.42 ) { total = (subtotal - 247.23 ) - (subtotal - 4210.42 )*(10.88/100); }
		            	if(subtotal>=7399.43  && subtotal<=8601.50 ) { total = (subtotal - 594.24 ) - (subtotal - 7399.43 )*(16.00/100); }
		            	if(subtotal>=8601.51  && subtotal<=10298.35) { total = (subtotal - 786.55 ) - (subtotal - 8601.51 )*(17.92/100); }
		            	if(subtotal>=10298.36 && subtotal<=20770.29) { total = (subtotal - 1090.62) - (subtotal - 10298.36)*(21.36/100); }
		            	if(subtotal>=20770.30 && subtotal<=32736.83) { total = (subtotal - 3327.43) - (subtotal - 20770.30)*(23.52/100); }
		            	if(subtotal>=32736.83                      ) { total = (subtotal - 6141.95) - (subtotal - 32736.83)*(30.00/100); }
		            	retencion= subtotal-total;
                        var lineNumber = new Number(linea);
                            lineNumber.toString();
                        detalleComisionesSublist.setLineItemValue('custpage_det_linea', linea, lineNumber);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_comision', linea, '');
		    			detalleComisionesSublist.setLineItemValue('custpage_det_nombre_empleado', linea, nomEmp);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_bono_manual', linea,0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_venta_propia', linea,0 );
		    			detalleComisionesSublist.setLineItemValue('custpage_det_puesta_marcha_propia', linea,0);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_reclutamiento', linea, ventaReclu);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_subtotal', linea, subtotal);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_retencion', linea, retencion);
		    			detalleComisionesSublist.setLineItemValue('custpage_det_total',linea, total);
	    				linea++;
	    			}
	    		}
			}
			/*/
		}
	}
	//var context = nlapiGetContext();
	//nlapiLogExecution('DEBUG', 'Remaining usage', context.getRemainingUsage());
}