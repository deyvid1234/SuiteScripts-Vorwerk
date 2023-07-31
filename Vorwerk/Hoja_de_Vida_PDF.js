function Hoja_de_Vida_PDF(request,response) 
{
	var Base64		= new MainBase64();
	var data 		= request.getParameter('data');
		data	   	= Base64.decode(data);
		data		= stringToArray(data,10);
	var recordType 	= returnBlank(data[0]);
	var recordId 	= returnBlank(data[1]);	
	var host 		= returnBlank(data[2]);
	var titleForm	= 'Hoja de Vida';
	
		try
		{
			var record			= nlapiLoadRecord(recordType, recordId);
			var no_empleado		= returnBlank(record.getFieldValue('custrecord_num_empleado'));
			var nombre			= nlapiEscapeXML(returnBlank(record.getFieldValue('custrecord_nombre')));
			var apellidos		= nlapiEscapeXML(returnBlank(record.getFieldValue('custrecord_apellidos')));
			var status			= '';
			var foto_id			= returnBlank(record.getFieldValue('custrecord_foto'));
			var fecha_contrat	= nlapiEscapeXML(returnBlank(record.getFieldValue('custrecord_fecha_contratacion')));
			var jefe_directo	= nlapiEscapeXML(returnBlank(record.getFieldText('custrecord_jefe_directo')));
			var desc_puestos	=(returnBlank(record.getFieldTexts('custrecord1')));
			var puestos			= desc_puestos.length;
			var aux_desc_puestos='';
			for(var i=0;i<desc_puestos.length;i++){
				aux_desc_puestos	+=	'<li>'+nlapiEscapeXML(desc_puestos[i])+'</li>'
			}
			if(aux_desc_puestos!=''){
				aux_desc_puestos	=	'<ul>'+aux_desc_puestos+'</ul>'
			}
				desc_puestos		= aux_desc_puestos;
			var antiguedad			= '';
			var fecha_contratacion	= record.getFieldValue('custrecord_fecha_contratacion');
			   if(fecha_contratacion!=''){
				antiguedad			= duration(nlapiStringToDate(fecha_contratacion), new Date());
				antiguedad			= antiguedad.años+' años '+antiguedad.meses+' meses '+antiguedad.dias+' días';
			   }	
			var departamento	= nlapiEscapeXML(returnBlank(record.getFieldText('custrecord_departamento_empleado')));
			var clasif_puesto	= nlapiEscapeXML(returnBlank(record.getFieldText('custrecord_clasificacion_puesto')));
			var puesto_actual	= nlapiEscapeXML(returnBlank(record.getFieldText('custrecord_puesto_actual')));
			var empresa			= nlapiEscapeXML(returnBlank(record.getFieldText('custrecord_empresa')));
			var fecha_aplicac	= returnBlank(record.getFieldValue('custrecord_fecha_de_aplicacion'));
			var fecha_mov		= '';
			var fecha_termino	= '';
			var fecha_term_ant	= '';
			var fecha_consulta	= new Date();
				fecha_consulta	= nlapiDateToString(fecha_consulta);
			if(fecha_aplicac != '')
			{
				fecha_mov		= nlapiStringToDate(fecha_aplicac);
				fecha_termino	= nlapiDateToString(new Date());
				fecha_term_ant	= new Date(fecha_mov.getTime() - 24*60*60*1000);
			}
			var tipo_mov		= nlapiEscapeXML(returnBlank(record.getFieldText('custrecord_tipo_movimiento')));
			var detalle_mov		= nlapiEscapeXML(returnBlank(record.getFieldValue('custrecord_detalle_movimiento')));
			var puesto_anter	= nlapiEscapeXML(returnBlank(record.getFieldText('custrecord_puesto_anterior')));
			var fecha_baja		= returnBlank(record.getFieldValue('custrecord_fecha_baja'));
			var entrev_salida	= returnBlank(record.getFieldValue('custrecordentrevista_salida'));
			var fecha_e_salida	= returnBlank(record.getFieldValue('custrecord_fcha_entrevista_sal'));
			var motivo_baja		= nlapiEscapeXML(returnBlank(record.getFieldValue('custrecord_motivo_baja')));
			var det_baja		= returnBlank(record.getFieldValue('custrecord_detalle_baja'));
				status			= (fecha_baja == '') ? 'ACTIVO':'INACTIVO';
				
			/* Comienza las promociones */

			var promociones		= new Array();
			for(var i=1; i<=5;i++){
				var promocion				= new Object();
				promocion.puesto			= returnBlank(record.getFieldText('custrecord_'+i+'_puesto'));
				promocion.empresa			= returnBlank(record.getFieldText('custrecord_'+i+'_empresa'));
				promocion.tipo				= returnBlank(record.getFieldText('custrecord_'+i+'_tipo_movimiento'));
				promocion.fecha				= returnBlank(record.getFieldValue('custrecord_'+i+'_fecha_de_aplicacion'));
				promocion.detalle			= returnBlank(record.getFieldValue('custrecord_'+i+'_detalle_movimiento'));
				promocion.puesto_anterior	= returnBlank(record.getFieldText('custrecord_'+i+'_puesto_ant'));
				promocion.numero	= i;
				addpuesto(promocion,promociones);
			}
			
			//calcular fecha termino
			var count_promociones=promociones.length-1;
			for(var i=0;i<count_promociones;i++){
				var promocion				=	promociones[i];
				var promocion_sig			=	promociones[i+1];
				var fecha_termino_promo		=	promocion_sig.fecha;
				if(fecha_termino_promo!=''){
					fecha_termino_promo				= nlapiStringToDate(fecha_termino_promo);
					fecha_termino_promo				= new Date(fecha_termino_promo.getTime() - 24*60*60*1000);
					fecha_termino_promo				= nlapiDateToString(fecha_termino_promo);
					promocion.fecha_termino 	= fecha_termino_promo;		 
				}else{
					promocion.fecha_termino		= '';
				}
			}
			
			var fecha_termino_rh	=	nlapiGetFieldValue('custrecord_fecha_baja')||'';
			var fecha_termino_last		=	fecha_termino_rh?fecha_termino_rh:nlapiDateToString(new Date());
			if(fecha_termino_last != '' && count_promociones>-1){
				promociones[count_promociones].fecha_termino	= fecha_termino_last;
				
			}
			// fin de fecha termino
				
			/* Fin de las Promociones*/
			var vorwerk 		= nlapiLoadFile(142592);
			var vorwerkURL		= vorwerk.getURL();
			vorwerkURL			= stringToArray(vorwerkURL,38);
			vorwerkURL 			= vorwerkURL.join('&amp;');
			vorwerkURL 			= "src='" + host +vorwerkURL + "'/";
			
			if(foto_id != '')
			{
				var foto 			= nlapiLoadFile(foto_id);
				var fotoURL			= foto.getURL();
				fotoURL				= stringToArray(fotoURL,38);
				fotoURL 			= fotoURL.join('&amp;');
				fotoURL 			= "src='" + host +fotoURL + "'/";
			}
			
			var thermomix 		= nlapiLoadFile(401096);
			var thermomixURL	= thermomix.getURL();
			thermomixURL		= stringToArray(thermomixURL,38);
			thermomixURL 		= thermomixURL.join('&amp;');
			thermomixURL 		= "src='" + host +thermomixURL + "'/";
			
			var check 			= nlapiLoadFile(505663);
			var checkURL		= check.getURL();
			checkURL			= stringToArray(checkURL,38);
			checkURL 			= checkURL.join('&amp;');
			checkURL 			= "src='" + host +checkURL + "'/";
			
			var uncheck 		= nlapiLoadFile(505664);
			var uncheckURL		= uncheck.getURL();
			uncheckURL			= stringToArray(uncheckURL,38);
			uncheckURL 			= uncheckURL.join('&amp;');
			uncheckURL 			= "src='" + host +uncheckURL + "'/";
			
			var Encabezado 	= '';
				Encabezado += "<table width='100%'>";
					Encabezado += "<tr>";
						Encabezado += "<td><img width=\"100%\" height=\"100%\" " + vorwerkURL + "></td>";
					Encabezado += "</tr>";
				Encabezado += "</table>";
			    
		    var strName	 = '';
			    strName +="<table width='100%'>";
		        	strName += "<tr>";
	        			strName += "<td colspan='6' font-size=\"16pt\" align='center'><b>HOJA DE VIDA LABORAL</b></td>";
	        		strName += "</tr>";
	        		strName += "<tr>";
		        		strName += "<td colspan='5' font-size=\"14pt\">&nbsp;</td>";
		        	strName += "</tr>";
		        	strName += "<tr margin='-5'>";
		        		strName += "<td colspan='5'>&nbsp;</td>";
		        		if(foto_id != '')
		        		{
		        			strName += "<td rowspan='6' align='right'><img width=\"100px\" height=\"100px\" " + fotoURL + "></td>";
		        		}
		        		strName += "<td colspan='2'>&nbsp;</td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td><b>No de Empleado:</b></td><td colspan='4'>"+no_empleado+"</td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td><b>Nombre del empleado:</b></td><td colspan='4'>"+nombre+" "+apellidos+"</td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td><b>Status:</b></td><td colspan='4'>"+status+"</td>";
		        	strName += "</tr>";
		        strName += "<tr>";
		        	strName += "<td><b>Fecha:</b></td><td colspan='4'>"+fecha_consulta+"</td>";
	        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td colspan='5'>&nbsp;</td>";
		        	strName += "</tr>";
		    	strName += "</table>";
		    	strName += "<p font-size=\"6pt\">&nbsp;</p>";
		    	strName += "<table class='FondoColorClaro' width='100%'>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='FondoColorOscuro' colspan='5' align='center'><b>INFORMACIÓN DEL EMPLEADO</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Fecha de Contratación</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_contrat+"</td>";
		    			strName += "<td class='Label' align='left' colspan='2'><b>Antigüedad en la empresa</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+antiguedad+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Jefe Directo</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+jefe_directo+"</td>";
		    			strName += "<td class='Label' align='left' colspan='2'><b>Departamento</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+departamento+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Puestos&nbsp;que&nbsp;le&nbsp;reportan</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+puestos+"</td>";
		    			strName += "<td class='Label' align='left' colspan='2'><b>Clasif. De Puesto</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+clasif_puesto+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    		if(desc_puestos != '')
		    		{
		    			strName += "<td colspan='5' border='1' margin-right='10' margin-left='10'>"+desc_puestos+"</td>";
		    		}
		    		else
		    		{
		    			strName += "<td colspan='5' border='1' margin-right='10' margin-left='10' font-size=\"14pt\">&nbsp;</td>";
		    		}
		    		strName += "</tr>";
		    		strName += "<tr>";
		    			strName += "<td>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='FondoColorOscuro' colspan='5' align='center'><b>HISTORIAL EN LA EMPRESA</b></td>";
		    		strName += "</tr>";
		    		if(promociones.length==0){
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Puesto Actual</b></td>";
		    			strName += "<td margin='10' colspan='3' border='1' align='center'>"+puesto_actual+"</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Empresa</b></td>";
		    			strName += "<td margin='10' colspan='3' border='1' align='center'>"+empresa+"</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Fecha de Aplicación</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_aplicac+"</td>";
		    			strName += "<td class='Label' align='left' colspan='2'><b>Fecha Actual</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+(fecha_baja==''?fecha_consulta:fecha_baja)+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Tipo de Movimiento</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+tipo_mov+"</td>";
		    			strName += "<td margin='10' colspan='2'>&nbsp;</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td colspan='5' margin-left='10' margin-top='10'><b>Detalle de Movimiento</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    		if(detalle_mov != '')
		    		{
		    			strName += "<td colspan='5' border='1' margin-right='10' margin-left='10'>"+detalle_mov+"</td>";
		    		}
		    		else
		    		{
		    			strName += "<td colspan='5' border='1' margin-right='10' margin-left='10' font-size=\"14pt\">&nbsp;</td>";
		    		}
		    		
		    		strName += "</tr>";
		    		}
		    		/*if(tipo_mov != '')
		    		{
			    		strName += "<tr margin='-10'>";
			    			strName += "<td class='Label' align='left'><b>Puesto Anterior</b></td>";
			    			strName += "<td margin='10' colspan='3' border='1' align='center'>"+puesto_anter+"</td>";
			    			strName += "<td margin='10'>&nbsp;</td>";
			    		strName += "</tr>";
			    		strName += "<tr margin='-10'>";
			    			strName += "<td class='Label' align='left'><b>Fecha de Aplicación</b></td>";
			    			strName += "<td margin='10' border='1' align='center'>"+fecha_aplicac+"</td>";
			    			strName += "<td class='Label' align='left' colspan='2'><b>Fecha de Término y/o Actual</b></td>";
			    			strName += "<td margin='10' border='1' align='center'>"+nlapiDateToString(fecha_term_ant)+"</td>";
			    		strName += "</tr>";
		    		}*/
		    		for(var i=promociones.length-1;i>=0;i--){
		    			var promocion	=	promociones[i];
		    			strName += "<tr>";
		    			strName += "<td>&nbsp;</td>";
		    			strName += "</tr>";
		    			if((promociones.length-1)!=i){
		    			strName += "<tr margin='-15'>";
		    				strName += "<td class='FondoColorOscuro' align='left'><b>Promoción</b></td>";
		    			strName += "</tr>";
		    			}
		    			strName += "<tr margin='-10'>";
			    			strName += "<td class='Label' align='left'><b>Puesto&nbsp;Anterior</b></td>";
			    			strName += "<td margin='10' border='1' align='center'>"+promocion.puesto_anterior+"</td>";
			    			strName += "<td class='Label' align='left' colspan='2'><b>Puesto&nbsp;promocion</b></td>";
			    			strName += "<td margin='10' border='1' align='center'>"+promocion.puesto+"</td>";
		    			strName += "</tr>";
		    			
		    			strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Fecha&nbsp;de&nbsp;Aplicacion</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+promocion.fecha+"</td>";
		    			strName += "<td class='Label' align='left' colspan='2'><b>Fecha&nbsp;Termino</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+promocion.fecha_termino+"</td>";
	    			strName += "</tr>";
	    			
	    			strName += "<tr margin='-10'>";
	    			strName += "<td class='Label' align='left'><b>Tipo de Movimiento</b></td>";
	    			strName += "<td margin='10' border='1' align='center'>"+promocion.tipo+"</td>";
	    			strName += "<td class='Label' align='left' colspan='2'><b>Empresa</b></td>";
	    			strName += "<td margin='10' border='1' align='center'>"+promocion.empresa+"</td>";
	    			strName += "</tr>";
	    			
	    			strName += "<tr margin='-10'>";
	    			strName += "<td colspan='5' margin-left='10' margin-top='10'><b>Detalle de Movimiento</b></td>";
	    			strName += "</tr>";
	    			
	    			strName += "<tr>";
	    			strName += "<td colspan='5' border='1' margin-right='10' margin-left='10'>"+(promocion.detalle==''?'&nbsp;':promocion.detalle)+"</td>";
	    			strName += "</tr>";	
		    		}
		    		
		    		/*strName += "<tr margin='-5'>";
		    			strName += "<td margin='10'><b>Tipo de Movimiento</b></td>";
		    			strName += "<td margin='10' border='1'>"+tipo_mov+"</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td colspan='4'><b>Detalle de Movimiento</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    		if(detalle_mov != '')
		    		{
		    			strName += "<td colspan='4' border='1' margin-right='10'>"+detalle_mov+"</td>";
		    		}
		    		else
		    		{
		    			strName += "<td colspan='4' border='1' margin-right='10' font-size=\"14pt\">&nbsp;</td>";
		    		}
		    		strName += "</tr>";*/
		    		strName += "<tr>";
		    			strName += "<td>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='FondoColorOscuro' colspan='5' align='center'><b>INFORMACIÓN DE BAJA</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Fecha de Baja</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+(fecha_baja)+"</td>";
		    			if(entrev_salida == 'F')
		    				strName += "<td margin='10' align='right'><img width=\"5%\" height=\"5%\" " + uncheckURL + "></td>";
		    			else
		    				strName += "<td margin='10' align='right'><img width=\"5%\" height=\"5%\" " + checkURL + "></td>";
		    			strName += "<td class='Label' align='left'><b>Entrevista de Salida</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_e_salida+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    			strName += "<td class='Label' align='left'><b>Motivo de Baja</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+motivo_baja+"</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-10'>";
		    		strName += "<td colspan='5' margin-left='10' margin-top='10'><b>Detalle de Baja</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    		if(det_baja != '')
		    		{
		    			strName += "<td colspan='5' border='1' margin-right='10' margin-left='10'>"+det_baja+"</td>";
		    		}
		    		else
		    		{
		    			strName += "<td colspan='5' border='1' margin-right='10' margin-left='10' font-size=\"14pt\">&nbsp;</td>";
		    		}
		    		strName += "</tr>";
		    	strName += "</table>";
				
			var Pie  = '';
				Pie += "<table width='100%'>";
					Pie += "<tr>";
						Pie += "<td rowspan='6' align='left'><img width=\"60%\" height=\"60%\" " + thermomixURL + "></td>";
					Pie += "</tr>";
				Pie += "</table>";
				
			var ArialRegularURL				= getFileDetails('name','ArialRegular.ttf',host,'url');
			var ArialBoldURL				= getFileDetails('name','Arial-Bold.ttf',host,'url');
			var ArialBoldItalicURL			= getFileDetails('name','Arial-BoldItalic.ttf',host,'url');
			var ArialItalicURL				= getFileDetails('name','Arial-Italic.ttf',host,'url');
				
				var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
					xml += "<pdf>";
						xml += "<head>";
						xml += "<link name=\"ArialRegular\" 		type=\"font\" subtype=\"TrueType\" src=\"" + ArialRegularURL	 	+ "\" src-bold=\"" + ArialBoldURL 			+ "\"  src-bolditalic=\"" + ArialBoldItalicURL 			+ "\" src-italic=\"" + ArialItalicURL 				+ "\"/>";
							xml += "<style>";
								xml += ".FondoColorOscuro{color:#000000; background-color:#bfbfbf;} ";
						        xml += ".FondoColorClaro{color:#000000; background-color:#f2f2f2;} ";
						        xml += ".FondoBlanco{background-color:#FFFFFF;} ";
						        xml += ".Tabla{border: 1 px;}";
						        xml += ".Tabla2{border: 0.1 px; corner-radius: 10px;}";
						        xml	+=	".Label{margin-top:15px;margin-left:12px}";
						        //xml += "body{font-family: ArialRegular; font-size: 12pt;}";
					        xml += "</style>";
							xml += "<macrolist>";
							    xml += "<macro id=\"myheader\">" 	+ Encabezado 	+ "</macro>";
								xml += "<macro id=\"paginas\">"		+ Pie 			+ "</macro>";
							xml += "</macrolist>";
						xml += "</head>";
						xml += "<body font-family='ArialRegular' font-size='10' size='letter' header=\"myheader\" header-height=\"40pt\" footer=\"paginas\" footer-height='30pt'>";
							xml += strName;
						xml += "</body>\n";
					xml += "</pdf>";
				var file 		= nlapiXMLToPDF( xml );
				var fileName	= titleForm + ' ' + recordType + ' ' + recordId +'.pdf';
				response.setContentType('PDF',fileName, 'inline');
				response.write(file.getValue());
	}
		catch(e)
	    {
			var customscript		= 'customscript_orden_servicio_he';
	    	var customdeploy		= 'customdeploy_orden_servicio_he';
	    	var HE_Catch_UE 		= Generic_HE_Catch_UE(e,recordType,recordId,titleForm,request);
	        var HE_Params			= new Array();
	        	HE_Params['data']	= HE_Catch_UE;
			nlapiSetRedirectURL('SUITELET',customscript,customdeploy, false, HE_Params);
	  	}
}


function duration(since, until) {

	//if first date is greater that the first, we fix the order
	if (since > until) {
		var temp = since;
		since = until;
		until = temp;
	}

	var years,months,days;
	
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
	if(since.getMonth() > until.getMonth()){
			years = (years - 1);
	}
	//Months
	if(since.getDate() > until.getDate()){
		if(since.getMonth() > (until.getMonth()-1)){
			months = 11 - (since.getMonth() - until.getMonth());
			if (since.getMonth() == until.getMonth()){
				months = 11;
			}
		}else{
			months = until.getMonth() - since.getMonth() - 1;
		}
	}else{
		if(since.getMonth() > until.getMonth()){
			months = 12 - (until.getMonth() - since.getMonth());
		}else{
			months = until.getMonth() - since.getMonth();
		}
	}
	//Days
	if(since.getDate() > (until.getDate()-1)){
		var days_pm = dayssInmonths(until.getMonth(until.getMonth()-1));
		days =  days_pm - since.getDate() + until.getDate();
		if((since.getMonth() == until.getMonth()) & (since.getDate()==until.getDate())){			
			days = 0;
		}
	}else{
		days = until.getDate() - since.getDate();
	}
	
	return ({"años":years,"meses":months,"dias":days});
}

function dayssInmonths(date){
	date = new Date(date);
	return 32 - new Date(date.getFullYear(), date.getMonth(), 32).getDate();
}

function addpuesto(puesto,promociones){
	var objpuesto	= new Object();
	var strpuesto	= returnBlank(puesto.puesto);
	if(strpuesto != ''){
		promociones.push(puesto);
		/*var count_promociones	=	promociones.length;
		if(promociones.length>2){
			promociones[count_promociones-1].puesto_anterior = promociones[count_promociones-2].puesto;
		}else{
			promociones[count_promociones-1].puesto_anterior =	'&nbsp;';
		}*/
	}
	
}
