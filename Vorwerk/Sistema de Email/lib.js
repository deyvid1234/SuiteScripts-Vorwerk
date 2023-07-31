define(['N/format', 'N/record','N/search'],

function(format, record, search) {
	
	function obtenerPromotora(promotora, transaccion, tipoVenta){
		log.debug('obtenerPromotoraparam', 'promotora: ' + promotora + ' | transaccion: ' + transaccion + ' | tipoVenta: ' + tipoVenta);
		var _PROMOTORA_EMAIL = null;
		search.create({
    		type: 'customrecord_se_promotoras_email',
    		filters: ['custrecord_pe_promotora','is', promotora]
    	}).run().each(function(r){
    		_PROMOTORA_EMAIL= record.load({type: 'customrecord_se_promotoras_email', id: r.id});
    	});
		
		if(!_PROMOTORA_EMAIL){
			_PROMOTORA_EMAIL = record.create({type: 'customrecord_se_promotoras_email'});
			_PROMOTORA_EMAIL.setValue('custrecord_pe_promotora', promotora);
			_PROMOTORA_EMAIL.setValue('custrecord_pe_tipoventa', tipoVenta);
		}
		    			
		if(transaccion){
			_PROMOTORA_EMAIL.setValue('custrecord_pe_transaccion', transaccion);
		}
		
		
		//-Carga ventas en periodo natural
		var date = new Date();
		var vnt = 0;
		var columns = [{name: 'internalid', summary: 'count'}, {name: 'formulatext', formula: "to_char({trandate},'mm')", summary: 'group'}];
		search.create({
			type: 'salesorder',  
			filters: [['mainline','is',true], 'and', ['custbody79','noneof','@NONE@'], 'and',
				['salesrep','is',promotora], 'and', ['custbody_tipo_venta','is',tipoVenta], 'and', 
				['trandate','onorafter', format.format({value: getFirstDateOfYear(date), type: format.Type.DATE })], 'and',
				['trandate','onorbefore', format.format({value: getLastDateOfYear(date), type: format.Type.DATE })]],
			columns: columns
	    }).run().each(function(r){
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vn' + Number(r.getValue(columns[1])), r.getValue(columns[0]));
	    	vnt += Number(r.getValue(columns[0]));
			return true;
	    });
		_PROMOTORA_EMAIL.setValue('custrecord_pe_vnt', vnt);
		
		//--------------------------------------------------
		//-- Venta del periodo VW
		var columns = [];		
		var currYear = date.getFullYear();
		
		//-- PARA BUSCAR LOS PERIODOS DEL CALENDARIO VW
		var firstPeriod = null;
		var lastPeriod = null;
		search.create({
			type: 'customrecord_periods',  
			filters: [['isinactive','is',false], 'and', ['custrecord_calendario.custrecord_year','equalto', currYear]],
			columns: ['custrecord_inicio', 'custrecord_final']
	    }).run().each(function(r){ 
	    	var inicio = r.getValue('custrecord_inicio');
	    	var final =  r.getValue('custrecord_final');
	    	
	    	firstPeriod = (firstPeriod?firstPeriod:inicio);
	    	lastPeriod = final;
	    	
			columns.push({name: 'formulanumeric', formula: "CASE WHEN {trandate} >= '" + inicio + "' AND {trandate} <= " + final + " THEN {internalid} END", summary: 'count'});
			return true;
	    });
		
		//---
		//-Carga ventas en periodo VW 
//		var columns = [{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.ENE.inicio+"/12/"+ lastYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.ENE.fin+"/1/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.FEB.inicio+"/1/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.FEB.fin+"/2/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.MAR.inicio+"/2/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.MAR.fin+"/3/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.ABR.inicio+"/3/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.ABR.fin+"/4/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.MAY.inicio+"/4/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.MAY.fin+"/5/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.JUN.inicio+"/5/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.JUN.fin+"/6/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.JUL.inicio+"/6/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.JUL.fin+"/7/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.AGO.inicio+"/7/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.AGO.fin+"/8/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.SEP.inicio+"/8/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.SEP.fin+"/9/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.OCT.inicio+"/9/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.OCT.fin+"/10/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.NOV.inicio+"/10/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.NOV.fin+"/11/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'},
//			{name: 'formulanumeric', formula: "CASE WHEN {trandate} >= TO_DATE('"+_PERIODOS.DIC.inicio+"/11/"+ currYear +"','DD/MM/YYYY') AND {trandate} <= TO_DATE('"+_PERIODOS.DIC.fin+"/12/"+ currYear +"','DD/MM/YYYY') THEN {internalid} END", summary: 'count'}]; 
	    
		var filters = [['mainline','is',true], 'and', ['custbody79','noneof','@NONE@'], 'and',
            ['salesrep','is',promotora], 'and', ['custbody_tipo_venta','is',tipoVenta], 'and', 
            ['trandate','onorafter', firstPeriod], 'and',
            ['trandate','onorbefore', lastPeriod]];
		
	    var vmt = 0;
	    search.create({
	        type: 'salesorder',  
	        filters: filters,
	        columns: columns
	    }).run().each(function(r){
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 1, r.getValue(columns[0]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 2, r.getValue(columns[1]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 3, r.getValue(columns[2]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 4, r.getValue(columns[3]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 5, r.getValue(columns[4]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 6, r.getValue(columns[5]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 7, r.getValue(columns[6]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 8, r.getValue(columns[7]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 9, r.getValue(columns[8]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 10, r.getValue(columns[9]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 11, r.getValue(columns[10]));
	    	_PROMOTORA_EMAIL.setValue('custrecord_pe_vm' + 12, r.getValue(columns[11]));
	    	vmt = Number(r.getValue(columns[0])) + Number(r.getValue(columns[1])) + Number(r.getValue(columns[2])) + Number(r.getValue(columns[3])) + Number(r.getValue(columns[4])) + 
	    			Number(r.getValue(columns[5])) + Number(r.getValue(columns[6])) + Number(r.getValue(columns[7])) + Number(r.getValue(columns[8])) + Number(r.getValue(columns[9])) + 
	    					Number(r.getValue(columns[10])) + Number(r.getValue(columns[11])) ;
	    	return true;
	    });
	    _PROMOTORA_EMAIL.setValue('custrecord_pe_vmt', vmt);
	    return _PROMOTORA_EMAIL;		    
	}
	
	function getFirstDateOfYear(d){
   	 	return new Date(d.getFullYear(), 0,1);
	}
   
	function getLastDateOfYear(d){
		return new Date(d.getFullYear(), 11,31);
	}
	
	function getDaysInMonth(d){
   	 var a = [[31,28,31,30,31,30,31,31,30,31,30,31],[31,29,31,30,31,30,31,31,30,31,30,31]];
   	var b = d.getMonth();
   	return b==1 && isLeapYear(d)?29:a[isLeapYear(d)?1:0][b];
   }
   
   function isLeapYear(d){
   	var a = d.getFullYear();
   	return !!((a&3)==0&&(a%100||(a%400==0&&a)));
   }
      
   function addMonths(b,a){
   	return addmonths(new Date(b.getTime()),parseInt(a));
   }
   
   function addmonths(d, mtoadd) {
   	if (mtoadd != 0) {
   		var year = d.getFullYear();
   		var dom = d.getDate();
   		var month = d.getMonth() + mtoadd;
   		if (month < 0) {
   			month += 1;
   			year = year + Math.ceil(month / 12) - 1;
   			d.setFullYear(year);
   			month = 11 + (month % 12);
   		} else if (month > 11) {
   			year = year + Math.floor(month / 12);
   			d.setFullYear(year);
   			month %= 12;

   			// JS rounds leap days up (2/29/2016 + 1 yr = 3/1/2017),
   			// whereas Java rounds them down (2/29/2016 + 1 yr = 2/28/2017).
   			// Make JS behave like Java to be consistent with server side.
   			if(dom === 29)
   				d.setDate(dom); //This only works because we're setting the month later
   		}
   		
   		var eom = getDaysInMonth(d);
   		if (dom > eom)
   			d.setDate(eom);

   		d.setMonth(month);
   	}
   	return d;
   }
   
   function createEmailLog(promotora, cliente, idRegla, template, transaccion, fechaBase, serial){
	   log.debug('createEmailLog','promotora: ' + promotora + ' | cliente: ' + cliente + ' | idRegla: ' + idRegla + 
			   ' | template: ' + template + ' | transaccion: ' + transaccion + ' | fechaBase: ' + fechaBase + ' | serial: ' + serial);
	   try{
		   var emailLog = record.create({type: 'customrecord_se_email_log'});
		   if(promotora){
			   emailLog.setValue('custrecord_el_promotora', promotora);
		   }
		   
		   if(cliente){
			   emailLog.setValue('custrecord_el_cliente', cliente);
		   }
			
		   emailLog.setValue('custrecord_el_email_maestro', idRegla);
		   emailLog.setValue('custrecord_el_template', template);
		   
		   if(transaccion){
			   emailLog.setValue('custrecord_el_transaccion', transaccion);
		   }
		   
		   emailLog.setValue('custrecord_el_fecha_envio', fechaBase);//format.format({value: fechaBase, type: format.Type.DATE}));
		   
		   if(serial){
			   emailLog.setValue('custrecord_el_serial', serial);
		   }
		   
		   
		   return emailLog.save();
	   } catch(e){
		   log.debug('error',e);
	   }
	   
	   return null;
   }
	
   var _BASE = {
			aplicado_a: {
				CLIENTE: 1,
				TMP: 2,
				GTM: 3
			},
			fecha_base: {
				promotora: {
					FECHA_DE_ALTA: 1, 
					FECHA_OBJ1: 2,
					FECHA_OBJ2: 3,	
					FECHA_CONVERSION: 4,
					FECHA_BAJA: 8
				},
				FECHA_DE_TRANSACCION: 5,
				cliente: {
					FECHA_CURSO: 6, 
				}
			}
	}
	
	var _CONDICION= {
			IGUAL: 3,
			MAYOR_O_IGUAL: 5,
			MAYOR_QUE: 4,
			MENOR_O_IGUAL: 2,
			MENOR_QUE: 1
	}
   
   function sendEmail(baseEnvio, valorEnvio){
	   log.debug('sendEmail','baseEnvio: ' + baseEnvio + ' | valorEnvio: ' + valorEnvio);
	   require(["N/task"], function(task){
		   if(baseEnvio == 1 && valorEnvio == 0){//Dias
		   		var sendEmail = task.create({
		       		taskType: task.TaskType.SCHEDULED_SCRIPT,
		       		scriptId: 'customscript_se_send',
		       		deploymentId: 'customdeploy_se_send'
		       	});
		       	var sendEmailId = sendEmail.submit();
		       	log.debug('sendEmailId',sendEmailId);
			}
	   });
	   
   }
   
	return {
		obtenerPromotora: obtenerPromotora,
		addMonths: addMonths,
		createEmailLog: createEmailLog,
		_BASE: _BASE,
		_CONDICION: _CONDICION,
		sendEmail: sendEmail
	}
});
