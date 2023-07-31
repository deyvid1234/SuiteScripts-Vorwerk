/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Sep 2016     IMR
 *
 */
 try{
   var remitente			= 20003;
   var preferences			= nlapiLoadConfiguration('companypreferences');
   remitente				= preferences.getFieldValue('custscript_remotente_mailing_recluta');
 }catch(error){
   
 }
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function Presentadoras_mailing_SS(type){
	var Base64		= new MainBase64();
	var recordType	= new String();
	var recordId	= new String();
	var linea		= 0;
	try{
	var context			= nlapiGetContext();
	var fecha_actual					= new Date();
	var fecha_actual_date				= new Date();
	var fecha_mes_anterior				= nlapiAddMonths(fecha_actual, -12);
	fecha_actual						= nlapiDateToString(fecha_actual);
	fecha_mes_anterior					= nlapiDateToString(fecha_mes_anterior);
	var result_info_presentadoras		= nlapiSearchRecord('employee', 'customsearch_mailing_ciclo_reclutamiento', null, null)||new Array();
	var presentadoras					= new Array();
	for(presentadora  in result_info_presentadoras){
		presentadoras.push(result_info_presentadoras[presentadora].getId());
	}
	//Ventas en el Periodo 
	var filters_sales_order				= new Array();
	filters_sales_order.push(new nlobjSearchFilter('salesrep', null, 'anyof', presentadoras));
	//filters_sales_order.push(new nlobjSearchFilter('trandate', null, 'within', fecha_mes_anterior, fecha_actual));
	var search_info_salesorder			= nlapiLoadSearch('transaction', 'customsearch_tm_vendidas');
	var result_info_salesorder			= fullSearch(search_info_salesorder,filters_sales_order);
	
	
	
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

	for(var i=0;i<result_info_presentadoras.length;i++){
		var info			= result_info_presentadoras[i];
		var id				= info.getId();
		var idu				= info.getValue('entityid');
		var presentadora	= info.getValue('altname');
		var fecha_alta		= info.getValue('hiredate');
		var promociontipo		= info.getValue('custentity_promocion');
		var date_alta		= nlapiStringToDate(fecha_alta);
		var fase_venta		= 0;
		var promocion_asig	= '';
		var correo			= info.getValue('email');;
		if(date_alta){
		
		var dias_efectivos	= (((fecha_actual_date.getTime()-date_alta.getTime())/(86400000))+"").split(".")[0];
		dias_efectivos		= returnNumber(dias_efectivos);	
			
		for(var j =0;j<promociones.length;j++){
			var promocion	= promociones[j];
			if(promocion.inicio.getTime()<=date_alta.getTime() && promocion.fin.getTime()>=date_alta.getTime() && promocion.promo_default!='T'){
				promocion_asig	= promocion;
			}
		}
		
		if(promocion_asig == ''){
			promocion_asig	= promocionDefault;
		}
		
		//dias transcurridos
		switch(dias_efectivos){
			case 20:
				fase_venta	= 1;
				break;
			case 30:
				fase_venta	= 2;
				break;
			case 50:
				fase_venta	= 3;
				break;
			case 80:
				fase_venta	= 4;
				break;
			default:
				fase_venta	= 0;
		}
		
		var addDays			= 0;
		
		switch(returnNumber(promocion_asig.meses)){
			case 1:
				addDays	= promocion_asig.diaobj1;
				break;
			case 2:
				addDays	= promocion_asig.diaobj2;
				break;
			case 3:
				addDays	= promocion_asig.diaobj3;
				break;
		}
		try{
		//calcular fecha de cierre
		var fecha_termino	= nlapiAddDays(date_alta, addDays);
		var calendario			= calendario_vorwerk[fecha_termino.getFullYear()];
		var dia					= calendario.meses[fecha_termino.getMonth()];
		var año					= calendario.año;
		var mes					= fecha_termino.getMonth();
		var dia_actual			= fecha_termino.getDate();
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
		var fecha_cierre = nlapiStringToDate(dia+'/'+(mes+1)+'/'+año, 'DD/MM/YYYY');
		}catch(error){
			var fecha_cierre = nlapiAddMonths(date_alta, 3);
		}
		//Si es el cierre
		if(nlapiDateToString(fecha_cierre) == nlapiDateToString(fecha_actual_date)){
			fase_venta	= 5;
		}
		
		
		var ventas_periodos	= calcularVentas(date_alta,fecha_actual_date,result_info_salesorder,id);
		var fecha_ganada	= '';
		if(result_info_salesorder.ventas[id] ){
			fecha_ganada = result_info_salesorder.ventas[id].listventas.sort(orderByDate)[0].getValue('trandate');
		}
		
		switch(fase_venta){
		case 1:
			fase1(ventas_periodos, promocion_asig.ventas, info, promociontipo,fecha_ganada);
			break;
		case 2:
			fase2(ventas_periodos, promocion_asig.ventas, info, promociontipo,fecha_ganada);
			break;
		case 3:
			fase3(ventas_periodos, promocion_asig.ventas, info, promociontipo,fecha_ganada);
			break;
		case 4:
			fase4(ventas_periodos, promocion_asig.ventas, info, promociontipo,fecha_ganada);
			break;
		case 5:
			fase5(ventas_periodos, promocion_asig.ventas, info, promociontipo,fecha_ganada);
			break;
		 default :
			 
		}
		
		}
		context.setPercentComplete((i/result_info_presentadoras.length)*100);
	}
	}catch(error){
		Generic_HE_Catch_SS(error,'employee',id);
	}
}

function calcularVentas(fechaInicio,fechaFin,datos,presentadora){
	var ventas = 0;
	if(datos.ventas[presentadora]){
		datos	= datos.ventas[presentadora].listventas;
	}else{
		datos	= new Array()
	}
	
	for(var i=0;i<datos.length;i++){
		var dato				= datos[i];
		var fecha				= dato.getValue('trandate')||'';
		var id					= dato.getId();
		var tipo_venta			= dato.getValue('custbody_tipo_venta');
		var cantidad_ov			= returnNumber(dato.getValue('quantity'));	
		if(fecha != ''){
			fecha			= nlapiStringToDate(fecha);
			if(fechaInicio.getTime()<=fecha.getTime() && fechaFin.getTime()>=fecha.getTime() && [19,2].indexOf(parseInt(tipo_venta))!=-1){
				ventas	+= cantidad_ov;
			}
		}
	}
	return ventas;
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
		}
	}while(resultSet.length > 0);
	return result_hash;
}




function fase1(ventas,ventas_promocion,entidadinfo,tipo,fecha_ganada){
	var entidad		= entidadinfo.getId();
	if(ventas >= ventas_promocion){
		ganarTM(entidadinfo,tipo,fecha_ganada,20);
	}else if(ventas == 0){
		sendEmail(33,entidad,ventas);
	}else if(ventas == 1){
		sendEmail(34,entidad,ventas);
	}else if(ventas>1){
		sendEmail(35,entidad,ventas);
	}
}

function fase2(ventas,ventas_promocion,entidadinfo,tipo,fecha_ganada){
	var entidad		= entidadinfo.getId();
	if(ventas >= ventas_promocion){
		ganarTM(entidadinfo,tipo,fecha_ganada,30);
	}else if(ventas < 2){
		perderTM(entidadinfo,tipo);
	}
}

function fase3(ventas,ventas_promocion,entidadinfo,tipo,fecha_ganada){
	var entidad		= entidadinfo.getId();
	if(ventas >= ventas_promocion){
		ganarTM(entidadinfo,tipo,fecha_ganada,50);
	}else if(ventas == 2){
		sendEmail(36,entidad,ventas);
	}else if(ventas == 3){
		sendEmail(37,entidad,ventas);
	}else if(ventas>3){
		sendEmail(38,entidad,ventas);
	}
}

function fase4(ventas,ventas_promocion,entidadinfo,tipo,fecha_ganada){
	var entidad		= entidadinfo.getId();
	if(ventas >= ventas_promocion){
		ganarTM(entidadinfo,tipo,fecha_ganada,80);
	}else if(ventas == 4){
		sendEmail(39,entidad,ventas);
	}else if(ventas >4){
		sendEmail(40,entidad,ventas);
	}
}

function fase5(ventas,ventas_promocion,entidadinfo,tipo,fecha_ganada){
	var entidad		= entidadinfo.getId();
	if(ventas >= ventas_promocion){
		ganarTM(entidadinfo,tipo,fecha_ganada,1000);
	}else{
		perderTM(entidadinfo,tipo);
	}
}



function ganarTM(entidadinfo,tipo,fecha_ganada,rango){
	var entidad		= entidadinfo.getId();
	if(tipo == 1){
		if(rango<90){
			sendEmail(41,entidad);
		}
		else{
			sendEmail(43,entidad);
		}
		var ov_id		= findSalesOrder(entidad);
		if(ov_id){	
			try{
			var orden_venta	= nlapiLoadRecord('salesorder', ov_id, {recordmode: 'dynamic'})
			orden_venta.setFieldValue('custbody_tipo_venta', 1);
			orden_venta.setFieldValue('trandate', fecha_ganada);
			var cout_item	= orden_venta.getLineItemCount('item');
			for(var i = 1; i<= cout_item; i++){
				var item = orden_venta.getLineItemValue('item', 'item', 1);
				if(item == 1126){
					orden_venta.selectLineItem('item', i);
					orden_venta.setCurrentLineItemValue('item', 'price', 7);
					orden_venta.commitLineItem('item');
				}
			}
			var orden_venta_id	= nlapiSubmitRecord(orden_venta);
			nlapiSendEmail(remitente, 16630, 'orden de venta creada Cambio de status', 'La orden de venta con el ID '+ov_id+' fue  modificada'
					, null);
			}catch(error){
				Generic_HE_Catch_SS(error,'employee',entidad);
			}
		
	}else{
		nlapiSendEmail(remitente, 16630, 'No se encontro orden de Venta', 'No se encontro orden de venta para cambiar el status a Ganada TM con la presentadora '+entidad
				, null);
	}
	}else{
		if(rango<90){
			sendEmail(42,entidad);
		}else{
			sendEmail(44,entidad);
		}
	}
	nlapiSubmitField('employee', entidad, 'custentity_ciclo_reclutamiento', 'F');
}

function perderTM(entidadinfo,tipo){
	var entidad		= entidadinfo.getId();
	var reclutadora	= entidadinfo.getValue('custentity_reclutadora')
	var ov_id		= findSalesOrder(entidad);
	if(ov_id){
		try{
					var update_fields	= new Array();
					update_fields.push('custbody_tipo_venta');
					var update_data		= new Array();
					update_data.psuh(25);
					nlapiSubmitField('salesorder', ov_id, update_fields, update_data, true);
					nlapiSendEmail(remitente, 16630, 'orden de venta cambio el status a TM Pagada', 'La orden de ventra con el ID '+orden_venta_id+' se modifico el status a TM Pagada'
							, null);
			}catch(error){
				Generic_HE_Catch_SS(error,'employee',entidad);
			}
	}else{
		nlapiSendEmail(remitente, 16630, 'No se encontro orden de Venta', 'No se encontro orden de venta para cambiar el status a Por cobrar con la presentadora '+entidad
				, null);
	}

	nlapiSubmitField('employee', entidad, 'custentity_ciclo_reclutamiento', 'F');
}

function orderByDate(data1,data2){
	var fecha1				= data1.getValue('trandate')||'';
	var fecha2				= data2.getValue('trandate')||'';
	if(fecha1 == ''){
		return -1;
	}else if(fecha2 == ''){
		return 1;
	}
	fecha1					= nlapiStringToDate(fecha1);
	fecha2					= nlapiStringToDate(fecha2);
	
	return fecha1.getTime()<fecha2.getTime()?-1:fecha1.getTime()>fecha2.getTime()?-1:0;
}

function findSalesOrder(presentadora){
	var filters_sales_oreder	= [new nlobjSearchFilter('salesrep', null, 'is', presentadora)];
	var result_ov				= nlapiSearchRecord('transaction', 'customsearch_buscar_ov_presentadora', filters_sales_oreder,null);
	return result_ov?result_ov[0].getValue('internalid'):null;
}


function sendEmail(plantilla,entidad,ventas){
	ventas	= ventas||0;
	var emailMerge	= nlapiCreateEmailMerger(plantilla);
	emailMerge.setEntity("employee", entidad);
	var merger		= emailMerge.merge();
	var body		= merger.getBody();
	var subject		= merger.getSubject();
	body			= body.replace('custplantilla_ventas', ventas+"");
	nlapiSendEmail((remitente||20003), entidad, subject, body,null);
}
