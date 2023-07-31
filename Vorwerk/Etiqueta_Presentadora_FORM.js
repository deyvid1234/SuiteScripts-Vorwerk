function Etiqueta_Presentadora_FORM(request, response)
{
	var titleForm	= 'Etiqueta de Presentadora';
	var Base64		= new MainBase64();
	var empleado			= null;
	var host				= null;
	var recordType			= null;
	var recordId			= null;
	var datos			 	= returnBlank(request.getParameter('data'));
	if(datos != '')
	{
		datos				= Base64.decode(datos);
		datos				= JSON.parse(datos);
		empleado			= returnBlank(datos.empleado);
		/*var data			= returnBlank(datos.host);
		nlapiLogExecution('ERROR', 'data', data);
			data		   	= Base64.decode(data);
			data			= stringToArray(data,10);*/
		host				= returnBlank(datos.host);
		recordType			= returnBlank(datos.type);
		recordId			= empleado;
	}
	/*var data 		= request.getParameter('data');
		data	   	= Base64.decode(data);
		data		= stringToArray(data,10);	
	var host 		= returnBlank(data[0]);*/
	try
	{
		if(request.getMethod() == "GET")
		{
			//var Base64				= new MainBase64();
			
			
			var help_empleado		= 'Seleccione la presentadora de la cual obtener la etiqueta.';
			var help_cantidad		= 'Ingrese la cantidad de copias que desea obtener.';
			var form 				= nlapiCreateForm(titleForm);
				form.addTab('custpage_detalles_tab', 'Detalles');
			var gPrimaria			= form.addFieldGroup( 'gPrimaria', 'Información de Primaaria');
				gPrimaria.setShowBorder(true);
			var field_empleado		= form.addField('custpage_empleado', 'select', 'Presentadora','employee','gPrimaria');
				field_empleado.setDefaultValue(empleado);
				field_empleado.setMandatory(true);
				field_empleado.setHelpText(help_empleado, true);
			var field_cantidad		= form.addField('custpage_cantidad', 'integer', 'Cantidad',null,'gPrimaria');
				field_cantidad.setMandatory(true);
				field_cantidad.setDefaultValue(1);
				field_cantidad.setHelpText(help_cantidad, true);
			var field_host			= form.addField('custpage_host', 'url', 'Host', null, 'gPrimaria');
				field_host.setDisplayType('hidden');
			form.addSubmitButton('Imprimir');
			form.addResetButton('Restablecer');
			form.setScript('customscript_etiqueta_presentadora_fv');
			response.writePage(form);
		}
		else
		{
			var custpage_empleado		= returnBlank(request.getParameter('custpage_empleado'));
			var custpage_cantidad 		= returnNumber(request.getParameter('custpage_cantidad'));
			var custpage_host			= returnBlank(request.getParameter('custpage_host'));
			var filters					= new Array();
				filters.push(new nlobjSearchFilter('internalid',null,'is',custpage_empleado));
			var columns					= new Array();
				columns.push(new nlobjSearchColumn('mobilephone'));
				columns.push(new nlobjSearchColumn('email'));
				columns.push(new nlobjSearchColumn('entityid'));
				columns.push(new nlobjSearchColumn('altname'));
			var results_empleado		= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
			var phone					= returnBlank(results_empleado[0].getValue('mobilephone'));
			var email					= returnBlank(results_empleado[0].getValue('email'));
			var entityid				= returnBlank(results_empleado[0].getValue('entityid'));
			var altname					= returnBlank(results_empleado[0].getValue('altname'));
			var strName					= '';
			for(var i=1;i<=custpage_cantidad;i++)
			{
				for(var j=1;j<=10;j++)
				{
					strName 	+= "<table table-layout='fixed' width='100%' height='26mm'>";
						strName 	+= "<tr>";
							strName 	+= "<td width='49%'>";
								strName 	+= "<table table-layout='fixed' width='100%'>";
									strName 	+= "<tr>";
										strName 	+= "<td colspan='2' align='center'>";
											strName 	+= "<barcode bar-width='1' codetype='code-128' showtext='true' value=\"" + entityid + "\"/>";
										strName		+= "</td>";
									strName		+= "</tr>";
									strName		+= "<tr>";
										strName 	+= "<td colspan='2' align='center'>"; 
											strName 	+= altname;
										strName 	+= "</td>";
									strName		+= "</tr>";
									strName		+= "<tr>";
										strName 	+= "<td>" + 'Phone: ' + phone 	+ "</td>";
										strName 	+= "<td>" + email 				+ "</td>";
									strName		+= "</tr>";
								strName 	+= "</table>";
							strName 	+= "</td>";
							strName 	+= "<td width='2%'>";
								strName 	+= "";
							strName 	+= "</td>";
							strName 	+= "<td width='49%'>";
								strName 	+= "<table table-layout='fixed' width='100%'>";
									strName 	+= "<tr>";
										strName 	+= "<td colspan='2' align='center'>";
											strName 	+= "<barcode bar-width='1' codetype='code-128' showtext='true' value=\"" + entityid + "\"/>";
										strName		+= "</td>";
									strName		+= "</tr>";
									strName		+= "<tr>";
										strName 	+= "<td colspan='2' align='center'>"; 
											strName 	+= altname;
										strName 	+= "</td>";
									strName		+= "</tr>";
									strName		+= "<tr>";
										strName 	+= "<td>" + 'Phone: ' + phone 	+ "</td>";
										strName 	+= "<td>" + email 				+ "</td>";
									strName		+= "</tr>";
								strName 	+= "</table>";
							strName 	+= "</td>";
						strName 	+= "</tr>";
						/*/
						strName 	+= "<tr height='2mm'>";
							strName 	+= "<td>" + "" + "</td>";
							strName 	+= "<td>" + "" + "</td>";
							strName 	+= "<td>" + "" + "</td>";
						strName 	+= "</tr>";
						/*/
					strName 	+= "</table>";
				}
				strName += "<div style='page-break-after: always;'></div>";
			}
			
			var ArialRegularURL				= getFileDetails('name','ArialRegular.ttf',custpage_host,'url');
			var ArialBoldURL				= getFileDetails('name','Arial-Bold.ttf',custpage_host,'url');
			var ArialBoldItalicURL			= getFileDetails('name','Arial-BoldItalic.ttf',custpage_host,'url');
			var ArialItalicURL				= getFileDetails('name','Arial-Italic.ttf',custpage_host,'url');
			
			var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
				xml += "<pdf>";
				xml += "<head>";
				xml += "<link name=\"ArialRegular\" 		type=\"font\" subtype=\"TrueType\" src=\"" + ArialRegularURL	 	+ "\" src-bold=\"" + ArialBoldURL 			+ "\"  src-bolditalic=\"" + ArialBoldItalicURL 			+ "\" src-italic=\"" + ArialItalicURL 				+ "\"/>";
				xml += "</head>";
					xml += "<body margin-top='-10pt' margin-bottom='-10pt' margin-left='-25pt' margin-right='-25pt' font-family='ArialRegular' font-size='8' size='letter'>";
						xml += strName;
					xml += "</body>\n";
				xml += "</pdf>";
			var filePDF = nlapiXMLToPDF(xml);
			response.setContentType('PDF', entityid + ' ' + altname + '.pdf', 'inline');
			response.write(filePDF.getValue());
		}
	}
    catch(error)
    {
    	var customscript		= 'customscript_etiquetas_presentadora_he';
    	var customdeploy		= 'customdeploy_etiquetas_presentadora_he';
    	var HE_Catch_UE 		= Generic_HE_Catch_UE(error, recordType, recordId, titleForm, request);
        var HE_Params			= new Array();
        	HE_Params['data']	= HE_Catch_UE;
		nlapiSetRedirectURL('SUITELET',customscript,customdeploy, false, HE_Params);
    }
}