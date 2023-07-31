/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Sep 2016     IMR
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function Presentadoras_excel_SS(type){
	var Base64		= new MainBase64();
	var recordType	= new String();
	var recordId	= new String();
	var linea		= 0;
	try{
	var context			= nlapiGetContext();
	var destinatario	= context.getSetting('SCRIPT', 'custscript_destinatario');
	var fecha_actual					= new Date();
	var fecha_mes_anterior				= nlapiAddMonths(fecha_actual, -12);
	fecha_actual						= nlapiDateToString(fecha_actual);
	fecha_mes_anterior					= nlapiDateToString(fecha_mes_anterior);
	
	//Ventas en el Periodo 
	var filters_sales_order				= new Array();
	filters_sales_order.push(new nlobjSearchFilter('trandate', null, 'within', fecha_mes_anterior, fecha_actual));
	var search_info_salesorder			= nlapiLoadSearch('transaction', 'customsearch_tm_vendidas');
	var result_info_salesorder			= fullSearch(search_info_salesorder,null);
	
	
	var result_info_presentadoras		= nlapiSearchRecord('employee', 'customsearch_informacion_excel_pres', null, null)||new Array();
	
	var result_calendario				= nlapiSearchRecord('customrecord_calendario_vorwerk', 'customsearch_calendario_vorwerk', null, null)||new Array();
	var calendario_vorwerk				= new Object();
	for(var i=0;i<result_calendario.length;i++){
		var calendario				= result_calendario[i];
		var año						= calendario.getValue('custrecord_year');
		var calendario_obj			= new Object();
		var arrayMeses				= new Array();
		arrayMeses.push(calendario.getValue('custrecord_mes_1'));
		arrayMeses.push(calendario.getValue('custrecord_mes_2'));
		arrayMeses.push(calendario.getValue('custrecord_mes_3'));
		arrayMeses.push(calendario.getValue('custrecord_mes_4'));
		arrayMeses.push(calendario.getValue('custrecord_mes_5'));
		arrayMeses.push(calendario.getValue('custrecord_mes_6'));
		arrayMeses.push(calendario.getValue('custrecord_mes_7'));
		arrayMeses.push(calendario.getValue('custrecord_mes_8'));
		arrayMeses.push(calendario.getValue('custrecord_mes_9'));
		arrayMeses.push(calendario.getValue('custrecord_mes_10'));
		arrayMeses.push(calendario.getValue('custrecord_mes_11'));
		arrayMeses.push(calendario.getValue('custrecord_mes_12'));
		calendario_obj.año			= año;
		calendario_obj.meses		= arrayMeses;
		calendario_vorwerk[año]		= calendario_obj;
	}
	
	var promociones						= new Array();
	var promocionDefault				= new Object();
	var result_promociones				= nlapiSearchRecord('promotioncode', 'customsearch_promociones', null, null)||new Array();
	for( i=0;i<result_promociones.length;i++){
		var promocion					= result_promociones[i];
		var promocionobj				= new Object();
		promocionobj.inicio				= promocion.getValue('startdate')||'';
		promocionobj.fin				= promocion.getValue('enddate')||'';
		promocionobj.nombre				= promocion.getValue('name')||'';
		promocionobj.ventas				= promocion.getValue('custrecord4');
		promocionobj.meses				= promocion.getValue('custrecord5');
		promocionobj.diaobj1			= promocion.getValue('custrecord6');
		promocionobj.diaobj2			= promocion.getValue('custrecord7');
		promocionobj.diaobj3			= promocion.getValue('custrecord8');
		promocionobj.esquema			= promocion.getValue('description');
		promocionobj.promo_default		= promocion.getValue('custrecord_promocion_default')||'F';
		if(promocionobj.inicio != '' && promocionobj.fin != ''){
			promocionobj.inicio		= nlapiStringToDate(promocionobj.inicio);
			promocionobj.fin		= nlapiStringToDate(promocionobj.fin);
			promociones.push(promocionobj);
			
		}
		if(promocionobj.promo_default == 'T'){
			promocionDefault	= promocionobj;
		}
		
	}
	//nlapiLogExecution('DEBUG', 'Inicio', 'Excel');
	var xls = "<?xml version='1.0' encoding='utf-8'?>" +
	"<Workbook xmlns='urn:schemas-microsoft-com:office:spreadsheet' " +
			"xmlns:o='urn:schemas-microsoft-com:office:office' " +
			"xmlns:x='urn:schemas-microsoft-com:office:excel' " +
			"xmlns:ss='urn:schemas-microsoft-com:office:spreadsheet' " +
			"xmlns:html='http://www.w3.org/TR/REC-html40'> " +
			"<Styles>" +
				"<Style ss:ID='header'> " +
					"<Alignment ss:Horizontal='Center'/> " +
					"<Font ss:Size='7' ss:Bold='1'/> " +
					"<Interior ss:Color='#d0d0d0' ss:Pattern='Solid'/> " +
				"</Style>"+
			"</Styles>" +
		"<Worksheet ss:Name='Presentadoras'>" +
		"<Table>" +
			"<Row>" +
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Area Manager</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Oficina</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Gerente</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Líder Equipo</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>IDU</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Presentadora</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Fecha de Alta</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Esquema</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Programa</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Tipo de Ingreso</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Fecha Objetivo 1</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Fecha Objetivo 2</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Fecha Objetivo 3</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Ventas Mes 1</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Ventas Mes 2</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Ventas Mes 3</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Ventas al cierre de ventas del 3er. Mes</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>TM Ganadas</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Fecha TM Ganada</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Ventas Totales</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Fecha de TM pagada</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>TM x Cobrar</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Meses</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Tipo de Garantía</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Telefono</Data></Cell>"+
				"<Cell ss:StyleID='header'><Data ss:Type='String'>Correo</Data></Cell>"+
			"</Row>";

	///result_info_presentadoras.length
	for(var i=0;i<result_info_presentadoras.length;i++){
		var apis			= context.getRemainingUsage();
		var info			= result_info_presentadoras[i];
		var area_manager	= returnXMLFormat(info,'custentity_area_manager');
		var ofinicina		= returnXMLFormat(info,'custentity_oficina');
		var gerente			= returnXMLFormat(info,'custentity_delegada');
		var tipo_ingreso	= returnXMLFormat(info,'custentity_tipo_ingreso');
		var lider_equipo	= returnXMLFormat(info,'supervisor');
		var id				= info.getId();
		var idu				= returnXMLFormat(info,'entityid','V');
		var presentadora	= returnXMLFormat(info,'altname','V');
		var fecha_alta		= returnXMLFormat(info,'hiredate','V');
		var date_alta		= nlapiStringToDate(fecha_alta);
		var promocion_asig	= '';
		if(((i/result_info_presentadoras.length)*100).toFixed(4) == '29.9479'){
			var d=0;
		}
		if(date_alta){
		for(var j =0;j<promociones.length;j++){
			var promocion	= promociones[j];
			if(promocion.inicio.getTime()<=date_alta.getTime() && promocion.fin.getTime()>=date_alta.getTime() && promocion.promo_default!='T'){
				promocion_asig	= promocion;
			}
		}
		
		if(promocion_asig == ''){
			promocion_asig	= promocionDefault;
		}else{
			 var q =0;
		}
		
		var esquema			= returnXMLFormat(info,'custentity_promocion');
		var programa		= promocion_asig.nombre;
		var fecha_obj1		= returnXMLFormat(info,'custentity_fin_objetivo_1','V');
		var fecha_obj2		= returnXMLFormat(info,'custentity_fin_objetivo_2','V');
		var fecha_obj3		= '';
		var ventas_m1		= '';
		var ventas_m2		= '';
		var ventas_m3		= '';
		var ventas_mf3		= '';
		var tm_ganada		= 0;
		var fecha_tm_ganada	= '';
		var ventas_total	= 0;
		var fecha_tm_pag	= '';
		var tm_x_cobrar		= 0;
		var meses			= 3.1;
		var tipo_garantia	= returnXMLFormat(info,'custentity_tipo_garantia');
		var telefono		= returnXMLFormat(info,'phone','V');;
		var correo			= returnXMLFormat(info,'email','V');;
		var periodos		= new Array();
		var ultimafecha		= fecha_alta;
		var cantidad_cierre	= 0;
		var date_obj1		= nlapiStringToDate(fecha_alta);
		var date_obj2		= '';
		var date_obj3		= '';
		var fecha_cierre	= '';
		var rango			= new Object(); 
		date_obj1			= nlapiAddDays(date_obj1, promocion_asig.diaobj1);
		date_obj2			= nlapiAddDays(date_obj1, 1);
		date_obj1			= nlapiDateToString(date_obj1);
		rango.inicio		= fecha_alta;
		rango.fin			= date_obj1
		periodos.push(rango);
		ultimafecha			= date_obj1;
		
		if(promocion_asig.meses>=2){
			rango			= new Object();
			rango.inicio		= nlapiDateToString(date_obj2);
			date_obj2			= nlapiAddDays(nlapiStringToDate(fecha_alta), promocion_asig.diaobj2);
			rango.fin			= nlapiDateToString(date_obj2);
			date_obj3			= nlapiAddDays(date_obj2, 1);
			date_obj2			= nlapiDateToString(date_obj2);
			periodos.push(rango);
			ultimafecha			= date_obj2;
		}
		
		if(promocion_asig.meses>=3){
			rango			= new Object();
			rango.inicio		= nlapiDateToString(date_obj3);
			date_obj3			= nlapiAddDays(nlapiStringToDate(fecha_alta), promocion_asig.diaobj3);
			rango.fin			= nlapiDateToString(date_obj3);
			date_obj3			= nlapiDateToString(date_obj3);
			periodos.push(rango);
			ultimafecha			= date_obj3;
		}
		
		
		try{
			var dateobj2			= nlapiStringToDate(ultimafecha);
			var calendario			= calendario_vorwerk[dateobj2.getFullYear()];
			var dia					= calendario.meses[dateobj2.getMonth()];
			var año					= calendario.año;
			var mes					= dateobj2.getMonth();
			var dia_actual			= dateobj2.getDate();
			if(dia_actual>dia){
				if(mes == 11){
					mes	= 0;
					año++;
					dia		= calendario_vorwerk[año][mes];
				}else{
					mes++;
					dia		= calendario_vorwerk[año][mes];
				}
			calendario				= calendario_vorwerk[año];
			dia						= calendario.meses[mes];
			}
			fecha_cierre = nlapiDateToString(nlapiStringToDate(dia+'/'+(mes+1)+'/'+año, 'DD/MM/YYYY'));
			ultimafecha = nlapiStringToDate(ultimafecha);
			ultimafecha = nlapiAddDays(ultimafecha, 1);
			ultimafecha = nlapiDateToString(ultimafecha);
			periodos.push({inicio:ultimafecha,fin:fecha_cierre});
				
		}catch(error){
			
		}
		var ventas_periodos	= cantidadVentas(periodos,result_info_salesorder,id);
		ventas_m1			= ventas_periodos[0]||'';
		if(ventas_periodos.length>2)
		ventas_m2			= ventas_periodos[1]||'';
		if(ventas_periodos.length>3)
		ventas_m3			= ventas_periodos[2]||'';
		ventas_mf3	 		= ventas_periodos[ventas_periodos.length-1]||'';
		
		ventas_total		= ventas_m1!=''?ventas_m1.ventas_total:0;
		
		//meses				= ((ventas_periodos[ventas_periodos.length-1].fin.getTime()-nlapiStringToDate(fecha_alta).getTime())/(86400000*30)).toFixed(2)
		
		fecha_obj1			= ventas_m1 != '' ?nlapiDateToString(ventas_m1.fin):'';
		fecha_obj2			= ventas_m2 != '' ?nlapiDateToString(ventas_m2.fin):'';
		fecha_obj3			= ventas_m3 != '' ?nlapiDateToString(ventas_m3.fin):'';
		
		
		ventas_m1			= ventas_m1 != '' ?ventas_m1.cantidad:0;
		ventas_m2			= ventas_m2 != '' ?ventas_m2.cantidad:0;
		ventas_m3			= ventas_m3 != '' ?ventas_m3.cantidad:0;
		ventas_mf3			= ventas_mf3 != '' ?ventas_mf3.cantidad:0;
		
		
		if((promocion_asig.ventas<=ventas_total && ventas_m1>=(promocion_asig.ventas/promocion_asig.meses)) || ventas_periodos[0].fecha_ganada){
			tm_ganada			= ventas_periodos[0].ganadas;
			fecha_tm_ganada		= ventas_periodos[0].fecha_ganada;
		}else if(result_info_salesorder.pagos[id]){
			
			var venta_pagada		= result_info_salesorder.pagos[id].listventas[result_info_salesorder.pagos[id].listventas.length-1];
			if(venta_pagada){
				fecha_tm_pag		=	venta_pagada.getValue('trandate')||'';
			}
		}else{
			tm_x_cobrar			= 1;
		}
		
		
		var fecha_calculo	= new Date();
		if(fecha_tm_ganada != ''){
			fecha_calculo	= nlapiStringToDate(fecha_tm_ganada);
		}else if(fecha_tm_pag != ''){
			fecha_calculo	= nlapiStringToDate(fecha_tm_pag);
		}
		
		
		meses				= ((fecha_calculo.getTime()-nlapiStringToDate(fecha_alta).getTime())/(86400000*30)).toFixed(2)
		xls+= "<Row>" +
				"<Cell ><Data ss:Type='String'>"+area_manager+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+ofinicina+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+gerente+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+lider_equipo+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+idu+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+presentadora+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+fecha_alta+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+esquema+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+programa+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+tipo_ingreso+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+fecha_obj1+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+fecha_obj2+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+fecha_obj3+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+ventas_m1+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+ventas_m2+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+ventas_m3+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+ventas_mf3+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+tm_ganada+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+fecha_tm_ganada+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+ventas_total+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+fecha_tm_pag+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+tm_x_cobrar+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+meses+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+tipo_garantia+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+telefono+"</Data></Cell>"+
				"<Cell ><Data ss:Type='String'>"+correo+"</Data></Cell>"+
			"</Row>";
		}
		context.setPercentComplete((i/result_info_presentadoras.length)*100);
	}
	
	xls+="</Table>" +
	"</Worksheet>" +
	"</Workbook>";
	//nlapiLogExecution('DEBUG', 'Final', 'Excel');
	var file_excel_obj		= nlapiCreateFile('Presentadoras '+fecha_actual+'.xls', 'EXCEL', nlapiEncrypt(xls, 'base64'));
	attachments				= new Array();
	attachments.push(file_excel_obj);
	if(destinatario){
			nlapiSendEmail(destinatario, destinatario, 'Excel Presentadoras', 'Excel Presentadoras', null, null, null, attachments);
	}
	}catch(error){
		Generic_HE_Catch_SS(error,recordType,recordId);
	}
}

function returnXMLFormat(result,campo,value){
	var dato	= '';
	if(value != 'V'){
		dato	= result.getText(campo)||'';
	}else{
		dato	= result.getValue(campo)||'';
	}	
	dato		= nlapiEscapeXML(dato);
	return dato;
}

function cantidadVentas(arrayFechaRangos,datos,presentadora){
	var cantidades		= new Array();
	var arrayDatesRangos		= new Array();
	for(var i=0;i<arrayFechaRangos.length;i++){
		try{
			var rango	= arrayFechaRangos[i];
			arrayDatesRangos.push({inicio:nlapiStringToDate(rango.inicio),fin:nlapiStringToDate(rango.fin),cantidad:0,ganadas:0,fecha_ganada:'',ventas_total:0})
		}catch(error){
			//se omite lo que no se puede convertir
		}
	}

	if(arrayDatesRangos.length>0){
		if(datos.ventas[presentadora]){
			datos	= datos.ventas[presentadora].listventas;
		}else{
			datos	= new Array()
		}
		
		for(var i=0;i<datos.length;i++){
			var dato				= datos[i];
			var fecha				= dato.getValue('trandate')||'';
			var id					= dato.getId();
			var cantidad_ov			= returnNumber(dato.getValue('quantity'));
			var representante		= dato.getValue('salesrep')||'';
			var tipo_venta			= dato.getValue('custbody_tipo_venta')||'';
			var presentadora_pago	= dato.getValue('custbody_presentadora_tm_paga')||'';	
			if(fecha != ''){
				fecha			= nlapiStringToDate(fecha);
				for(var j=0;j<arrayDatesRangos.length;j++){
					var rango	= arrayDatesRangos[j];
					if(rango.inicio.getTime()<=fecha.getTime() && rango.fin.getTime()>=fecha.getTime() && [19,2].indexOf(parseInt(tipo_venta))!=-1){
						rango.cantidad	+= cantidad_ov;
					}
				}
				if([19,2,1].indexOf(parseInt(tipo_venta))!=-1){
					arrayDatesRangos[0].ventas_total 		+= cantidad_ov;
				}
				if(1 == parseInt(tipo_venta)){
					arrayDatesRangos[0].ganadas 			+= cantidad_ov;
					arrayDatesRangos[0].fecha_ganada	=  nlapiDateToString(fecha);
				}
			}
		}
	}
	return	arrayDatesRangos;
}


function fullSearch(search,filters){
	var result_array	= new Array();
	var result_hash		= new Object();
	result_hash.ventas	= new Object();
	result_hash.pagos	= new Object();
	if(filters)
	search.addFilters(filters);
	var searchResults 					= search.runSearch();
	var resultIndex 					= 0; 
	var resultStep 						= 1000;
	var resultSet						= new Object();
	do 
	{
	    resultSet 						= returnBlank(searchResults.getResults(resultIndex, resultIndex + resultStep));
	    resultIndex 					= resultIndex + resultStep;
	    for(i=0;i<resultSet.length;i++)
		{
	    	var presentadora		= resultSet[i].getValue('salesrep');
	    	var presentador_pago	= resultSet[i].getValue('custbody_presentadora_tm_paga');
	    	if(presentadora){
	    		result_hash.ventas[presentadora]				= result_hash.ventas[presentadora]||new Object();
	    		result_hash.ventas[presentadora].listventas		= result_hash.ventas[presentadora].listventas||new Array();
	    		result_hash.ventas[presentadora].listventas.push(resultSet[i]);
	    	}
	    	
	    	if(presentador_pago){
	    		result_hash.pagos[presentador_pago]				= result_hash.pagos[presentador_pago]||new Object();
	    		result_hash.pagos[presentador_pago].listventas	= result_hash.pagos[presentador_pago].listventas||new Array();
	    		result_hash.pagos[presentador_pago].listventas.push(resultSet[i]);
	    	}
		}
	}while(resultSet.length > 0);
	return result_hash;
}
