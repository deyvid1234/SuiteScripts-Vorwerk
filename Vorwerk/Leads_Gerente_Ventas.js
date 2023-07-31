function Leads_Gerente_Ventas(request, response)
{
	var Base64		= new MainBase64();
	var titleForm	= 'Leads x Gerente Ventas';
	try
	{
		if (request.getMethod() == "GET")
		{
			var form 						= nlapiCreateForm(titleForm);
				form.addTab('custpage_resultados_tab', 'Resultados');
			var gTransaccion				= form.addFieldGroup( 'gTransaccion', 'Información del Lead');
				gTransaccion.setShowBorder(true);
				gTransaccion.setSingleColumn(true);
			var field_gerente_ventas	 	= form.addField('custpage_gerente_ventas', 'select', 'Gerente de Ventas','employee','gTransaccion');
			var field_fecha_desde 			= form.addField('custpage_fecha_desde', 'date', 'Fecha Desde',null,'gTransaccion');
			var field_fecha_hasta 			= form.addField('custpage_fecha_hasta', 'date', 'Fecha Hasta',null,'gTransaccion');
			var field_leads_ids				= form.addField('custpage_leads_ids', 'multiselect', 'Internal IDS','lead','gTransaccion');
			var sublist 					= form.addSubList('custpage_resultados_sublist', 'list', 'Resultados', 'custpage_resultados_tab');
				sublist.addMarkAllButtons();
				sublist.addField('custpage_num_linea', 'integer', '#');	
				sublist.addField('custpage_sublist_seleccionar', 'checkbox', 'Seleccionar');
				sublist.addField('custpage_sublist_fecha', 'text', 'Fecha'); 
				sublist.addField('custpage_sublist_cliente', 'select', 'Lead','lead').setDisplayType('inline');							
			var help_fecha_desde	= 'Seleccione la fecha de la cual iniciara la búsqueda de <i>Leads</i>.';
			var help_fecha_hasta	= 'Seleccione la fecha en la cual terminara la búsqueda de <i>Leads</i>.';
			field_gerente_ventas.setDisplayType('inline');
			field_gerente_ventas.setDefaultValue(nlapiGetUser());
			field_fecha_desde.setHelpText(help_fecha_desde, true);
			field_fecha_hasta.setHelpText(help_fecha_hasta, true);
			field_leads_ids.setDisplayType('hidden');
			var valuesObj	= new Object();
			var data 		= returnBlank(request.getParameter('data'));
			if(data != '')
			{
				data						= Base64.decode(data);
				data						= JSON.parse(data);
				var value_gerente_ventas	= returnBlank(data.value_gerente_ventas);
				var value_fecha_desde 		= returnBlank(data.value_fecha_desde);
				var value_fecha_hasta 		= returnBlank(data.value_fecha_hasta);;
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('datecreated', null, 'within', value_fecha_desde,value_fecha_hasta));
					filters.push(new nlobjSearchFilter('custentity_gervta', null, 'is', value_gerente_ventas));
				var searchResults		= returnBlank(nlapiSearchRecord('customer', 'customsearch_lead_gerente_ventas', filters, null));
				for(var i=0;i<searchResults.length;i++)
				{
					var _sublist_fecha 			= returnBlank(searchResults[i].getValue('datecreated'));
					var _sublist_customer	 	= returnBlank(searchResults[i].getId());
					var _num_linea 				= new Number(i + 1);
					sublist.setLineItemValue('custpage_num_linea', _num_linea, _num_linea.toString());
					sublist.setLineItemValue('custpage_sublist_seleccionar', _num_linea, 'F');
					sublist.setLineItemValue('custpage_sublist_fecha', _num_linea, _sublist_fecha);
					sublist.setLineItemValue('custpage_sublist_cliente', _num_linea, _sublist_customer);
				}
				valuesObj.custpage_gerente_ventas	= value_gerente_ventas;
				valuesObj.custpage_fecha_desde 		= value_fecha_desde;
				valuesObj.custpage_fecha_hasta 		= value_fecha_hasta;
			}
			form.setFieldValues(valuesObj);
			form.addSubmitButton('Iniciar');
			form.setScript('customscript_leads_gerente_ventas_form_f');
			response.writePage(form);
		}
		else
		{	
			var _gerente_ventas	= request.getParameter('custpage_gerente_ventas');
			var _fecha_desde	= request.getParameter('custpage_fecha_desde');
			var _fecha_hasta	= request.getParameter('custpage_fecha_hasta');	
			var _leads_ids 		= request.getParameterValues('custpage_leads_ids');
			var filters 		= new Array();
				filters.push(new nlobjSearchFilter('internalid', null, 'anyof', _leads_ids));
			var searchResults	= returnBlank(nlapiSearchRecord('customer', 'customsearch_lead_gerente_ventas', filters, null));
			var pagina			= '<pagenumber/> de <totalpages/>';
			var currentURL		= request.getURL();
			var index 			= currentURL.indexOf("/app");
		    var host		  	= currentURL.substring(0, index);
			var filtersCheckbox	= new Array();
				filtersCheckbox.push(new nlobjSearchFilter('name', null, 'is', 'IMR_CHECKBOX.png'));
			var searchCheckbox	= returnBlank(nlapiSearchRecord('file', null, filtersCheckbox, null));
			var CHECKBOX_ID		= searchCheckbox[0].getId();
			var CHECKBOX_FILE	= nlapiLoadFile(CHECKBOX_ID);
			var CHECKBOX_URL	= CHECKBOX_FILE.getURL();
				CHECKBOX_URL	= stringToArray(CHECKBOX_URL,38);
				CHECKBOX_URL 	= CHECKBOX_URL.join('&amp;');
				CHECKBOX_URL 	= "src='" + host + CHECKBOX_URL + "'/";
		    var strName 		= '';
		    for(var i=0;i<searchResults.length;i++)
			{
				var custentity_gervta 			= returnBlank(searchResults[i].getText('custentity_gervta'));
				var salesrep 					= returnBlank(searchResults[i].getText('salesrep'));
				var custentity_lead_prese 		= returnBlank(searchResults[i].getText('custentity_lead_prese'));
				var firstname		 			= returnBlank(searchResults[i].getValue('firstname'));
				var phone 						= returnBlank(searchResults[i].getValue('phone'));
				var email		 				= returnBlank(searchResults[i].getValue('email'));
				var custentity_mot 				= returnBlank(searchResults[i].getText('custentity_mot'));
				var custentity74 				= returnBlank(searchResults[i].getValue('custentity74'));
				var custentity110 				= returnFalse(searchResults[i].getValue('custentity110'));
					custentity110 				= getCheckBox(custentity110, CHECKBOX_URL);
				var custentity111 				= returnBlank(searchResults[i].getValue('custentity111'));
				var custentity113 				= returnFalse(searchResults[i].getValue('custentity113'));
					custentity113 				= getCheckBox(custentity113, CHECKBOX_URL);
				var custentity112 				= returnFalse(searchResults[i].getValue('custentity112'));
					custentity112 				= getCheckBox(custentity112, CHECKBOX_URL);
				var custentity114 				= returnFalse(searchResults[i].getValue('custentity114'));
					custentity114 				= getCheckBox(custentity114, CHECKBOX_URL);
				var custentity115 				= returnFalse(searchResults[i].getValue('custentity115'));
					custentity115 				= getCheckBox(custentity115, CHECKBOX_URL);
				var custentity116 				= returnFalse(searchResults[i].getValue('custentity116'));
					custentity116 				= getCheckBox(custentity116, CHECKBOX_URL);
				var custentity118 				= returnFalse(searchResults[i].getValue('custentity118'));
					custentity118 				= getCheckBox(custentity118, CHECKBOX_URL);
				var custentityserietm_lead		= returnBlank(searchResults[i].getValue('custentityserietm_lead'));
			    strName += "<table width='100%'>";
		    		strName += "<tr>";
		    			strName += "<td border='2' corner-radius='2%' border-color='#0070AD'>";
							strName += "<table width='100%'>";
				    			strName += "<tr>";		    			
				    				strName += "<td width='35%'>";
					    				strName += "<table>";
					    					strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Gerente de Venta:" 	+ "</b></td><td width='81%'>" + custentity_gervta		+ "</td></tr>";
					    					strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "LE:"					+ "</b></td><td width='81%'>" + salesrep				+ "</td></tr>";
					    					strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Presentadora:"		+ "</b></td><td width='81%'>" + custentity_lead_prese	+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
				    				strName += "<td width='25%'>";
					    				strName += "<table>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Nombre:"		+ "</b></td><td width='81%'>" + firstname				+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Telefono:"	+ "</b></td><td width='81%'>" + phone					+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Mail:"		+ "</b></td><td width='81%'>" + email					+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Motivo:"		+ "</b></td><td width='81%'>" + custentity_mot			+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Ciudad:"		+ "</b></td><td width='81%'>" + custentity74			+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
				    				strName += "<td width='20%'>";
					    				strName += "<table>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Venta:"				+ "</b></td><td width='81%'>" + custentity110	+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Fecha de venta:"		+ "</b></td><td width='81%'>" + custentity111	+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Entrega:"				+ "</b></td><td width='81%'>" + custentity113	+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Seguimiento Pventa:"	+ "</b></td><td width='81%'>" + custentity112	+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
				    				strName += "<td width='20%'>";
					    				strName += "<table>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Invitacion CC:"			+ "</b></td><td width='81%'>" + custentity114			+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "2 visita:"				+ "</b></td><td width='81%'>" + custentity115			+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Asistencia CC:"			+ "</b></td><td width='81%'>" + custentity116			+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Propuesta reclutamiento:"	+ "</b></td><td width='81%'>" + custentity118			+ "</td></tr>";
											strName += "<tr><td width='1%'>&nbsp;</td><td width='18%'><b>" + "Serie TM:"				+ "</b></td><td width='81%'>" + custentityserietm_lead	+ "</td></tr>";
										strName += "</table>";
				    				strName += "</td>";
			    				strName += "</tr>";
		    				strName += "</table>";
		    			strName += "</td>";
		    		strName += "</tr>";
				strName += "</table>";
				strName += "<p font-size='3'>&nbsp;</p>";
			}
			var compaynyInfo 		= nlapiLoadConfiguration('companyinformation');
			var companyInfoName 	= returnBlank(compaynyInfo.getFieldValue('companyname'));
			var companyInfoAddress1	= returnBlank(compaynyInfo.getFieldValue('address1'));
			var companyInfoAddress2	= returnBlank(compaynyInfo.getFieldValue('address2'));
			var companyInfoCity		= returnBlank(compaynyInfo.getFieldValue('city'));
			var companyInfoState	= returnBlank(compaynyInfo.getFieldValue('state'));
			var companyInfoCountry	= returnBlank(compaynyInfo.getFieldText('country'));
			var companyInfoZip		= returnBlank(compaynyInfo.getFieldValue('zip'));
			var companyInfoPhone	= returnBlank(compaynyInfo.getFieldValue('phone'));
			var companyInfoFax		= returnBlank(compaynyInfo.getFieldValue('fax'));
			var companyInfoUrl		= returnBlank(compaynyInfo.getFieldValue('url'));
			var companyInfoRFC		= returnBlank(compaynyInfo.getFieldValue('employerid'));
			var companyInfoLogoId	= returnBlank(compaynyInfo.getFieldValue('formlogo'));
			var companyInfoLogoObj	= new Object();
			var companyInfoLogoURL	= '';
			if(companyInfoLogoId != '')
			{
				companyInfoLogoObj	= nlapiLoadFile(companyInfoLogoId);
			}
			else
			{
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
			var Encabezado 	= '';
			    Encabezado += "<table width='100%'>";
				    Encabezado += "<tr>";
				    	Encabezado += "<td width='30%' align='left'><img width=\"100%\" height=\"100%\" " + companyInfoLogoURL + "></td>";
					    Encabezado += "<td width='70%'>";
					        Encabezado +="<table width='100%'>";
					        	Encabezado += "<tr><td align='left' font-size=\"10pt\"><b>" + companyInfoName 		+"</b></td></tr>";
						        Encabezado += "<tr><td align='left' font-size=\"8pt\">" 	+ companyInfoAddress1 	+ ' ' + companyInfoAddress2 + "</td></tr>";
						        Encabezado += "<tr><td align='left' font-size=\"8pt\">"	+ companyInfoCity 		+ ' ' + companyInfoState 	+ ' ' + companyInfoCountry + ' ' + companyInfoZip + "</td></tr>";
						        if(companyInfoPhone != '' || companyInfoFax != '' || companyInfoUrl != '')
						        {
						        	Encabezado += "<tr><td align='left' font-size=\"8pt\">";
						        	if(companyInfoPhone != '')
							        {
						        		Encabezado += 'Tel. ' 	+ companyInfoPhone + ' ';
							        }
							        if(companyInfoFax != '')
							        {
							        	Encabezado += 'Fax ' 	+ companyInfoFax + ' ';
							        }
							        if(companyInfoUrl != '')
							        {
							        	Encabezado += '' 		+ companyInfoUrl; + ' ';
							        }
							        Encabezado += "</td></tr>";
						        }
						        if(companyInfoRFC != '')
						        {
						        	Encabezado += "<tr><td align='left' font-size=\"8pt\">" + 'R.F.C' + ' ' + companyInfoRFC + "</td></tr>";
						        }
						        	Encabezado += "<tr><td align='left' font-size=\"8pt\">" + 'Página' + ' ' + pagina + "</td></tr>";
						        Encabezado += "</table>";
						    Encabezado += "</td>";
					    Encabezado += "</tr>";
			    Encabezado += "</table>";
			var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
				xml += "<pdf>";
					xml += "<head>";
						xml += "<style>";
					        xml += ".FondoColorOscuro{background-color:#0070AD;} ";
					        xml += ".FondoColorClaro{background-color:#CFE7F5;} ";
					        xml += ".FondoBlanco{background-color:#FFFFFF;} ";
				        xml += "</style>";
						xml += "<macrolist>";
							xml += "<macro id=\"myheader\">" + Encabezado 	+"</macro>";
						xml += "</macrolist>";
					xml += "</head>";
					xml += "<body font='helvetica' font-size='8' size='letter-landscape'  header=\"myheader\" header-height=\"100pt\">";
						xml += strName;
					xml += "</body>\n";
				xml += "</pdf>";
			var file 		= nlapiXMLToPDF( xml );
			var fileName	= 'Leads de: ' + _gerente_ventas + ' '+ _fecha_desde + ' - ' + _fecha_hasta + '.pdf';
			response.setContentType('PDF',fileName, 'inline');
			response.write(file.getValue());
		}
	}
	catch(e)
    {
    	var tituloFallo		= new String();
    	var mensajeFallo	= new String();
    	var data			= new Object();
    	var identacion		= '<td>&nbsp;</td><td>&nbsp;</td><td>ᐅ</td>';
        if ( e instanceof nlobjError )
        {
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
            nlapiLogExecution( 'ERROR', 'Unexpected Error',errorString );
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
    	nlapiSetRedirectURL('SUITELET','customscript_fe_sf_he', 'customdeploy_fe_sf_he', false, params_handler_error);
		nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
  	}
}
function getCheckBox(value, CHECKBOX_URL)
{
	if(value == 'T')
	{
		value = "<img width=\"10%\" height=\"10%\" " + CHECKBOX_URL + ">";
	}
	else
	{
		value = '&nbsp;';
	}
	return value;
}