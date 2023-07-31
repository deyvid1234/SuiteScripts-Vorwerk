function Presentadora_PDF(request,response) 
{
	var Base64		= new MainBase64();
	var data 		= request.getParameter('data');
		data	   	= Base64.decode(data);
		data		= stringToArray(data,10);
	var recordType 	= returnBlank(data[0]);
	var recordId 	= returnBlank(data[1]);	
	var host 		= returnBlank(data[2]);
	var titleForm	= 'Reporte Presentadora';

		try
		{
			var record			= nlapiLoadRecord(recordType, recordId);
			var IDU				= returnBlank(record.getFieldValue('entityid'));
			var nombre			= returnBlank(record.getFieldValue('altname'));
			var status			= returnBlank(record.getFieldValue('isinactive'));
				status			= (status == 'F') ? 'Activo':'Inactivo';
			var foto_id			= returnBlank(record.getFieldValue('custentity_foto'));
			var CURP			= returnBlank(record.getFieldValue('custentity_curp'));
			var fecha_nac		= returnBlank(record.getFieldValue('birthdate'));
			var fecha_entrev	= returnBlank(record.getFieldValue('custentity_fent'));
			var RFC				= returnBlank(record.getFieldValue('custentity_ce_rfc'));
			var banco_prov		= returnBlank(record.getFieldText('custentity_ban_prov'));
			var clabe_inter		= returnBlank(record.getFieldValue('custentity_clabe_interbancaria'));
			var fecha_contrat	= returnBlank(record.getFieldValue('hiredate'));
			var delegada		= returnBlank(record.getFieldText('custentity_delegada'));
			var unidad			= returnBlank(record.getFieldValue('custentity_nombre_unidad'));
			var lider_eq		= returnBlank(record.getFieldValue(''));
			var oficina			= returnBlank(record.getFieldText('custentity_oficina'));
			var ubicacion		= returnBlank(record.getFieldText('location'));
			var tipo			= returnBlank(record.getFieldText('employeetype'));
			var promocion		= returnBlank(record.getFieldText('custentity_promocion'));
			var fecha_aplicac	= '';
			var tipo_mov		= '';
			var fecha_termino	= returnBlank(record.getFieldText('releasedate'));;
			fecha_termino		= fecha_termino==''?nlapiDateToString(new Date()):fecha_termino;
			var puesto_ant		= '';
			var fecha_term_ant	= '';
			var movimientos		= '';
			var puesto_nuevo	= '';
			var fecha_actual	= nlapiDateToString(new Date());;
			var filter			= new Array();
				filter.push(nlobjSearchFilter('internalid', null, 'is', recordId));
			var movimiento		= returnBlank(nlapiSearchRecord('employee', 'customsearch_movimientos_empleados', filter, null));
			if(movimiento != '')
			{
				/*fecha_aplicac	= nlapiStringToDate(returnBlank(movimiento[0].getValue('date','systemNotes')));
				fecha_aplicac	= nlapiDateToString(fecha_aplicac, 'date');
				tipo_mov		= 'Promoción';
				fecha_termino	= nlapiDateToString(new Date());
				puesto_ant		= returnBlank(movimiento[0].getValue('oldvalue','systemNotes'));
				fecha_term_ant	= nlapiDateToString(new Date(nlapiStringToDate(fecha_aplicac).getTime() - 24*60*60*1000));*/
				
				var tipo_id			= ""+returnBlank(record.getFieldValue('employeetype'));
				var array_tipos		= new Array();
				
				switch(tipo_id){
					case "3" :
						array_tipos.push("Jefa de Grupo");
					break;
					case "5" :
						array_tipos.push("Jefa de Grupo");
						array_tipos.push("Delegada");
					break;
					case "8" :
						array_tipos.push("Jefa de Grupo");
						array_tipos.push("Delegada");
						array_tipos.push("Area Manager");
					break;
					case "9" :
						array_tipos.push("Jefa de Grupo");
						array_tipos.push("Delegada");
						array_tipos.push("Area Manager");
						array_tipos.push("Regional Manager");
					break;
				}
				
				var count_promo	=	1;
				for(var i=0;i<array_tipos.length;i++){
					var puesto			=	array_tipos[i];
					var posicion		=	-1;
					var fecha_system	=	"";
					for(var j=0;j<movimiento.length;j++){
						var posicion_movimientos	= returnBlank(movimiento[j].getValue('newvalue','systemNotes'));
						if(array_tipos[i]==posicion_movimientos){
							if(fecha_system==""){
								fecha_system	= nlapiStringToDate(returnBlank(movimiento[j].getValue('date','systemNotes')));
								posicion		= j;
							}else{
								var fecha_resp_system	=	nlapiStringToDate(returnBlank(movimiento[j].getValue('date','systemNotes')));
								posicion			=	fecha_resp_system.getTime()<fecha_system.getTime()?posicion:j;
							}
						}
					}
					if(posicion!=-1){
					fecha_aplicac	= nlapiStringToDate(returnBlank(movimiento[posicion].getValue('date','systemNotes')));
					fecha_aplicac	= nlapiDateToString(fecha_aplicac, 'date');
					tipo_mov		= 'Promoción';
					puesto_ant		= returnBlank(movimiento[posicion].getValue('oldvalue','systemNotes'));
					puesto_nuevo	= returnBlank(movimiento[posicion].getValue('newvalue','systemNotes'));
					fecha_term_ant	= nlapiDateToString(new Date(nlapiStringToDate(fecha_aplicac).getTime() - 24*60*60*1000));
					movimientos += "<tr >";
						movimientos += "<td class='Label FondoColorOscuro' align='left'><b>Promoción "+count_promo+": </b></td>";
					movimientos += "</tr>";
					movimientos += "<tr >";
						movimientos += "<td class='Label' align='left'>Fecha&nbsp;de&nbsp;Aplicación</td>";
						movimientos += "<td margin='10' border='1' align='center'>"+fecha_aplicac+"</td>";
						movimientos += "<td class='Label' align='left'><b>Fecha de Término</b></td>";
						movimientos += "<td margin='10' border='1' align='center'>"+fecha_term_ant+"</td>";
					movimientos += "</tr>";
					movimientos += "<tr >";
						movimientos += "<td class='Label' align='left'><b>Tipo de Movimiento</b></td>";
						movimientos += "<td margin='10' border='1' align='center'>"+tipo_mov+"</td>";
						movimientos += "<td class='Label' align='left'>&nbsp;</td>";
						movimientos += "<td margin='10'  align='center'>&nbsp;</td>";
					movimientos += "</tr>";
					movimientos += "<tr >";
						movimientos += "<td class='Label' align='left'><b>Puesto Anterior</b></td>";
						movimientos += "<td margin='10' border='1' align='center'>"+puesto_ant+"</td>";
						movimientos += "<td class='Label' align='left'>Puesto Promocion</td>";
						movimientos += "<td margin='10' border='1'  align='center'>"+puesto_nuevo+"</td>";
					movimientos += "</tr>";
					count_promo++;
					}
		     	}
			}
				
			var edo_civil		= returnBlank(record.getFieldText('custentity_eciv'));
			var num_hijos		= returnBlank(record.getFieldText('custentity61'));
			var telefono		= returnBlank(record.getFieldValue('phone'));
			var correo			= returnBlank(record.getFieldValue('email'));
			var fecha_baja		= returnBlank(record.getFieldValue('custentity59'));
			var baja_vol		= returnBlank(record.getFieldValue('custentity_bvol'));
			var baja_ina		= returnBlank(record.getFieldValue('custentity_bina'));
			var motivo_baja		= '';
			if(baja_vol == 'T')
			{
				motivo_baja		= 'Voluntaria';
			}
			if(baja_ina == 'T')
			{
				motivo_baja		= 'Inactividad';
			}
			//var det_baja		= returnBlank(record.getFieldValue(''));
			
			var vorwerk 		= nlapiLoadFile(142592);
			var vorwerkURL		= vorwerk.getURL();
			vorwerkURL			= stringToArray(vorwerkURL,38);
			vorwerkURL 			= vorwerkURL.join('&amp;');
			vorwerkURL 			= "src='" + host +vorwerkURL + "'/";
			var fotoURL				= '';
			if(foto_id!=''){
			var foto 			= nlapiLoadFile(foto_id);
			fotoURL				= foto.getURL();
			fotoURL				= stringToArray(fotoURL,38);
			fotoURL 			= fotoURL.join('&amp;');
			fotoURL 			= "src='" + host +fotoURL + "'/";
			}
			var Encabezado 	= '';
				Encabezado +="<table width='100%'>";
		        	Encabezado += "<tr>";
		        		Encabezado += "<td><img width=\"100%\" height=\"100%\" " + vorwerkURL + "></td>";
		        	Encabezado += "</tr>";
		    	Encabezado += "</table>";
			    
		    var strName	 = '';
			    strName +="<table width='100%'>";
		        	strName += "<tr>";
		        	if(fotoURL!=''){
		        		strName += "<td colspan='3'>&nbsp;</td>";
		        		strName += "<td rowspan='6'><img width=\"100px\" height=\"100px\" " + fotoURL + "></td>";
		        	}
		        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td colspan='3'>&nbsp;</td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td><b>IDU (#)   </b>"+IDU+"</td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td colspan='3'><b>Nombre del Presentador   </b>"+nombre+"</td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
		        		strName += "<td colspan='3'><b>STATUS DEL PRESENTADOR   </b>"+status+"</td>";
		        	strName += "</tr>";
		        	strName += "<tr>";
	        		strName += "<td colspan='3'><b>Fecha   </b>"+fecha_actual+"</td>";
	        	strName += "</tr>";
		    	strName += "</table>";
		    	strName += "<p font-size=\"2pt\">&nbsp;</p>";
		    	strName += "<table class='FondoColorClaro' width='100%'>";
		    		strName += "<tr>";
		    			strName += "<td class='FondoColorOscuro' colspan='4' align='center'><b>Datos Generales</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    			strName += "<td class='Label' align='left'><b>CURP</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+CURP+"</td>";
		    			strName += "<td class='Label' align='left'><b>RFC</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+RFC+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Fecha de Nacimiento</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_nac+"</td>";
		    			strName += "<td class='Label' align='left'><b>BANCO&nbsp;PROVEEDOR</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+banco_prov+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Fecha de entrevista</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_entrev+"</td>";
		    			strName += "<td class='Label' align='left'><b>Clabe Interbancaria</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+clabe_inter+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    			strName += "<td>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='FondoColorOscuro' colspan='4' align='center'><b>Información del Presentador</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Fecha&nbsp;de&nbsp;Contratación</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_contrat+"</td>";
		    			strName += "<td class='Label' align='left'><b>Lider de Equipo</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+lider_eq+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Delegada</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+delegada+"</td>";
		    			strName += "<td class='Label' align='left'><b>Ubicación</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+ubicacion+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Nombre de Unidad</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+unidad+"</td>";
		    			strName += "<td class='Label' align='left'><b>Oficina</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+oficina+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    			strName += "<td>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='FondoColorOscuro' colspan='4' align='center'><b>Historial en la empresa</b></td>";
		    		strName += "</tr>";
		    		strName += movimientos;
		    		strName += "<tr >";
		    		strName += "<td class='Label FondoColorOscuro' align='left'><b>Promoción "+count_promo+": </b></td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Tipo</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+tipo+"</td>";
		    			strName += "<td class='Label' align='left'><b>Promoción</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+promocion+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
			    		strName += "<td class='Label' align='left'><b>Fecha Actual</b></td>";
			    		strName += "<td margin='10' border='1' align='center'>"+fecha_termino+"</td>";
			    		strName += "<td class='Label' align='left'>&nbsp;</td>";
			    		strName += "<td margin='10'  align='center'>&nbsp;</td>";
					strName += "</tr>";
		    		/*strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Fecha de Aplicación</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_aplicac+"</td>";
		    			strName += "<td class='Label' align='left'><b>Fecha de término y/o Actual</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_termino+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Tipo de Movimiento</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+tipo_mov+"</td>";
		    			strName += "<td class='Label' align='left'><b>Fecha de Término</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_term_ant+"</td>";
		    		strName += "</tr>";
		    		if(puesto_ant != '')
		    		{
			    		strName += "<tr margin='-10'>";
			    			strName += "<td margin='10'><b>Puesto Anterior</b></td>";
			    			strName += "<td margin='10' border='1' align='center' colspan='3'>"+puesto_ant+"</td>";
			    		strName += "</tr>";
		    		}*/
		    		
		    		
		    		/*strName += "<tr margin='-5'>";
		    			strName += "<td colspan='4'><b>Detalle Movimiento</b></td>";
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
		    			strName += "<td class='FondoColorOscuro' colspan='4' align='center'><b>Información Personal del Empleado</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    			strName += "<td class='Label' align='left'><b>Edo. Civil</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+edo_civil+"</td>";
		    			strName += "<td class='Label' align='left'><b>Teléfono</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+telefono+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Número de Hijos</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+num_hijos+"</td>";
		    			strName += "<td class='Label' align='left'><b>Correo Electrónico</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+correo+"</td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    			strName += "<td>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='FondoColorOscuro' colspan='4' align='center'><b>Información de Baja</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Fecha de Baja</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+fecha_baja+"</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			strName += "<td class='Label' align='left'><b>Motivo de Baja</b></td>";
		    			strName += "<td margin='10' border='1' align='center'>"+motivo_baja+"</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    			strName += "<td margin='10'>&nbsp;</td>";
		    		strName += "</tr>";
		    		strName += "<tr margin='-5'>";
		    			/*strName += "<td colspan='4'><b>Detalle de Baja</b></td>";
		    		strName += "</tr>";
		    		strName += "<tr>";
		    		if(det_baja != '')
		    		{
		    			strName += "<td colspan='4' border='1' margin-right='10'>"+det_baja+"</td>";
		    		}
		    		else
		    		{
		    			strName += "<td colspan='4' border='1' margin-right='10' font-size=\"14pt\">&nbsp;</td>";
		    		}*/
		    		strName += "</tr>";
		    	strName += "</table>";
				
			var Pie  = '';
				Pie += "<table width='100%'>";
					Pie += "<tr>";
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
						        xml	+=	".Label{margin-top:15px;text-align:left;font-weight:bold }";
					        xml += "</style>";
							xml += "<macrolist>";
							    xml += "<macro id=\"myheader\">" 	+ Encabezado 	+ "</macro>";
								xml += "<macro id=\"paginas\">"		+ Pie 			+ "</macro>";
							xml += "</macrolist>";
						xml += "</head>";
						xml += "<body font-family='ArialRegular' font-size='10' size='letter'  header=\"myheader\" header-height=\"40pt\" footer=\"paginas\" footer-height='20pt'>";
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