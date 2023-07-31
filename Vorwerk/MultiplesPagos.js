//User Event Scripts
//Script ID: customscript_tab_multiples_pagos
function multiplesPagosCreate(type, form)
{
    try
    {
    	var recType = nlapiGetRecordType();
    	var formID  = parseFloat(nlapiGetFieldValue('customform'));
    	if(recType=='salesorder' || (recType=='invoice' && formID==190) )
    	{
    		form.addTab('custpage_multiples_pagos', 'Multiples Pagos');
    		var datosPagosSublist = form.addSubList('custpage_datos_pagos', 'inlineeditor', 'Multiples Pagos','custpage_multiples_pagos');
    			datosPagosSublist.setDisplayType('normal');
    			datosPagosSublist.addField('custpage_ref_pago', 'select', 'Forma/Tipo de Pago','customlist_ref_pago');
    			datosPagosSublist.addField('custpage_fecha_pago', 'date', 'Fecha del Pago');	
    			datosPagosSublist.addField('custpage_nom_tarjeta', 'select', 'Nombre Tarjeta', 'customlist_nombre_tarjeta');
    			datosPagosSublist.addField('custpage_num_tarjeta', 'integer', 'No. Tarjeta');
    			datosPagosSublist.addField('custpage_fecha_vencimiento', 'text', 'Fecha Vencimiento');
    			datosPagosSublist.addField('custpage_num_autorizacion', 'text', 'No. Autorizacion/Referencia');
    			datosPagosSublist.addField('custpage_cantidad', 'currency', 'Cantidad');
    	}
    }
    catch(e)
    {
        if ( e instanceof nlobjError )
        {
                nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
        }
        else
        {
            nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
        }        
    }
}
function multiplesPagosEdit(type, form)
{
	var recType = nlapiGetRecordType();
	var formID  = parseFloat(nlapiGetFieldValue('customform'));
	var recId 	= nlapiGetRecordId();
	if(recType=='salesorder' || (recType=='invoice' && formID==190 && nlapiGetFieldValue('custbody_codigo_retorno'))!='0' )
	{
		form.addTab('custpage_multiples_pagos', 'Multiples Pagos');
		var datosPagosSublist = form.addSubList('custpage_datos_pagos', 'inlineeditor', 'Multiples Pagos','custpage_multiples_pagos');
			datosPagosSublist.setDisplayType('normal');	
			datosPagosSublist.addField('custpage_pago_id', 'select', 'Pago','transaction');
			datosPagosSublist.addField('custpage_ref_pago', 'select', 'Forma/Tipo de Pago','customlist_ref_pago');
			datosPagosSublist.addField('custpage_fecha_pago', 'date', 'Fecha del Pago');	
			datosPagosSublist.addField('custpage_nom_tarjeta', 'select', 'Nombre Tarjeta', 'customlist_nombre_tarjeta');
			datosPagosSublist.addField('custpage_num_tarjeta', 'text', 'No. Tarjeta');
			datosPagosSublist.addField('custpage_fecha_vencimiento', 'text', 'Fecha Vencimiento');
			datosPagosSublist.addField('custpage_num_autorizacion', 'text', 'No. Autorizacion/Referencia');
			datosPagosSublist.addField('custpage_cantidad', 'currency', 'Cantidad');
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('custbody_cantidad_pago');
			columns[1] = new nlobjSearchColumn('custbody_autorizacion_referencia');
			columns[2] = new nlobjSearchColumn('custbody_nombre_tarjeta_id');
			columns[3] = new nlobjSearchColumn('custbody_num_tarjeta');
			columns[4] = new nlobjSearchColumn('custbody_fec_vencimiento_tarjeta');
			columns[5] = new nlobjSearchColumn('custbody_ref_pago_id');
			columns[6] = new nlobjSearchColumn('trandate');
		var filters = new nlobjSearchFilter('custbody_transaccion_realacionada', null, 'is', recId); 				
		var searchResults = nlapiSearchRecord('customerpayment', null, filters, columns);
		try
		{
			var lon =searchResults.length;
			var resultados = new Array();
			var i=0;
			for(var cont=lon-1;cont>0;cont--)
			{
				if(searchResults[cont].getId()!=searchResults[cont-1].getId())
				 { resultados[i]=searchResults[cont]; i++; }	             
			}
			resultados[i]=searchResults[0];
			resultados.reverse();	
			for ( var i = 0 ;i<resultados.length ; i++ )
			{
				datosPagosSublist.setLineItemValue('custpage_pago_id', i+1, resultados[i].getId());
				datosPagosSublist.setLineItemValue('custpage_fecha_pago', i+1, resultados[i].getValue('trandate'));
				datosPagosSublist.setLineItemValue('custpage_cantidad', i+1, resultados[i].getValue('custbody_cantidad_pago'));
				datosPagosSublist.setLineItemValue('custpage_num_autorizacion', i+1, resultados[i].getValue('custbody_autorizacion_referencia'));
				datosPagosSublist.setLineItemValue('custpage_nom_tarjeta', i+1, resultados[i].getValue('custbody_nombre_tarjeta_id'));
				datosPagosSublist.setLineItemValue('custpage_num_tarjeta', i+1, resultados[i].getValue('custbody_num_tarjeta'));
				datosPagosSublist.setLineItemValue('custpage_fecha_vencimiento', i+1, resultados[i].getValue('custbody_fec_vencimiento_tarjeta'));
				datosPagosSublist.setLineItemValue('custpage_ref_pago', i+1, resultados[i].getValue('custbody_ref_pago_id'));
			}
		}
		catch(e)
		{
			if ( e instanceof nlobjError )
			{
					nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
			}
			else
			{
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
				//nlapiDeleteRecord(recType,recId);
			}
		}
	}
}
function multiplesPagosView(type, form)
{
	var recType = nlapiGetRecordType();
	var recId	= nlapiGetRecordId();
	var rec 	= nlapiLoadRecord(recType,recId);
	var formID  = parseFloat(rec.getFieldValue('customform'));
	if(recType=='salesorder' || (recType=='invoice' && formID==190) )
	{
		var url 	= nlapiResolveURL("SUITELET", "customscript_imprimir_recibo_pago", "customdeploy_imprimir_recibo_pago", null);
			url 	= url + "&custparam_recID=" + recId + "&custparam_recType=" + recType;			
		form.addButton("custpage_btnprint", "Imprimir Recibo de Pago", "window.open('"+url+"')");
		form.addTab('custpage_multiples_pagos', 'Multiples Pagos');
		var total 	= parseFloat(nlapiGetFieldValue('total'));
		var tPagado	= 0.0;
		var datosPagosSublist = form.addSubList('custpage_datos_pagos', 'inlineeditor', 'Multiples Pagos','custpage_multiples_pagos');
			datosPagosSublist.setDisplayType('normal');
			datosPagosSublist.addField('custpage_pago_id', 'select', 'Pago','transaction');
			datosPagosSublist.addField('custpage_ref_pago', 'text', 'Forma/Tipo de Pago','customlist_ref_pago');
			datosPagosSublist.addField('custpage_nom_tarjeta', 'text', 'Nombre Tarjeta', 'customlist_nombre_tarjeta');
			datosPagosSublist.addField('custpage_num_tarjeta', 'text', 'No. Tarjeta');
			datosPagosSublist.addField('custpage_fecha_vencimiento', 'text', 'Fecha Vencimiento');
			datosPagosSublist.addField('custpage_num_autorizacion', 'text', 'No. Autorización/Referencia');
			datosPagosSublist.addField('custpage_cantidad', 'currency', 'Cantidad');
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('custbody_cantidad_pago');
			columns[1] = new nlobjSearchColumn('custbody_autorizacion_referencia');
			columns[2] = new nlobjSearchColumn('custbody_nombre_tarjeta_id');
			columns[3] = new nlobjSearchColumn('custbody_num_tarjeta');
			columns[4] = new nlobjSearchColumn('custbody_fec_vencimiento_tarjeta');
			columns[5] = new nlobjSearchColumn('custbody_ref_pago_id');
		var filters = new nlobjSearchFilter('custbody_transaccion_realacionada', null, 'is', recId); 				
		var searchResults = nlapiSearchRecord('customerpayment', null, filters, columns);
		try
		{
			var lon =searchResults.length;
			var resultados = new Array();
			var i=0;
			for(var cont=lon-1;cont>0;cont--)
			{
				if(searchResults[cont].getId()!=searchResults[cont-1].getId())
				 { resultados[i]=searchResults[cont]; i++; }	             
			}
			resultados[i]=searchResults[0];
			resultados.reverse();	
			for ( var i = 0 ;i<resultados.length ; i++ )
			{
				
				datosPagosSublist.setLineItemValue('custpage_pago_id', i+1, resultados[i].getId());
				datosPagosSublist.setLineItemValue('custpage_cantidad', i+1, resultados[i].getValue('custbody_cantidad_pago'));
				datosPagosSublist.setLineItemValue('custpage_num_autorizacion', i+1, resultados[i].getValue('custbody_autorizacion_referencia'));
				datosPagosSublist.setLineItemValue('custpage_nom_tarjeta', i+1, resultados[i].getText('custbody_nombre_tarjeta_id'));
				datosPagosSublist.setLineItemValue('custpage_num_tarjeta', i+1, resultados[i].getValue('custbody_num_tarjeta'));
				datosPagosSublist.setLineItemValue('custpage_fecha_vencimiento', i+1, resultados[i].getValue('custbody_fec_vencimiento_tarjeta'));
				datosPagosSublist.setLineItemValue('custpage_ref_pago', i+1, resultados[i].getText('custbody_ref_pago_id'));
				tPagado += parseFloat(resultados[i].getValue('custbody_cantidad_pago'));
				
			}
			var fields = new Array ('custbody_total_pagado','custbody_total_a_pagar');
			var values = new Array (tPagado,(total-tPagado));
			for( var c = 0 ; c<2; c++)
			{
				//nlapiSubmitField(recType , recId , fields[c] , values[c] , false);
			}
		}
		catch(e)
		{
			var fields = new Array ('custbody_total_pagado','custbody_total_a_pagar');
			var values = new Array (tPagado,(total-tPagado));
			for( var c = 0 ; c<2; c++)
			{
				//nlapiSubmitField(recType , recId , fields[c] , values[c] , false);
			}
			if ( e instanceof nlobjError )
				nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
			else
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
		}
	}
}
function aceptarPagos(type,form,name)
{
	if(type!='delete')
	{
	    try
	    {
	        var recId			= nlapiGetRecordId();
			var recType 		= nlapiGetRecordType();
			var cte				= nlapiGetFieldValue('entity');
			var cambio			= nlapiGetFieldValue('exchangerate');
			var lineas 			= nlapiGetLineItemCount('custpage_datos_pagos');
			var total 			= parseFloat(nlapiGetFieldValue('total'));
			var customerPayment = new Object();
			var tPagado			= 0.0;		
			for(var i=1;i<=lineas;i++)
			{
				var ref_P_id 	= returnBlank(nlapiGetLineItemValue('custpage_datos_pagos','custpage_ref_pago',i));
				if(ref_P_id!='')
				{
					var pagoID 		= returnBlank(nlapiGetLineItemValue('custpage_datos_pagos','custpage_pago_id',i));
					var fec_P 		= returnBlank(nlapiGetLineItemValue('custpage_datos_pagos','custpage_fecha_pago',i));
					var cant  		= parseFloat(nlapiGetLineItemValue('custpage_datos_pagos','custpage_cantidad',i));
						tPagado	   += parseFloat(nlapiGetLineItemValue('custpage_datos_pagos','custpage_cantidad',i));
					var num_A 		= returnBlank(nlapiGetLineItemValue('custpage_datos_pagos','custpage_num_autorizacion',i));
					var nom_T 		= returnBlank(nlapiGetLineItemText('custpage_datos_pagos','custpage_nom_tarjeta',i));
					var nom_T_id 	= returnBlank(nlapiGetLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',i));
					var fec_V 		= returnBlank(nlapiGetLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento',i));
					var ref_P 		= returnBlank(nlapiGetLineItemText('custpage_datos_pagos','custpage_ref_pago',i));
					var num_T 		= returnBlank(nlapiGetLineItemValue('custpage_datos_pagos','custpage_num_tarjeta',i));
					var num_T2 		= new String();
					var cuenta 		= 141;
					if(num_T!='' && nom_T=='AMERICAN EXPRESS')
					{
						num_T2 = num_T.toString();
						num_T  = num_T.toString();
						num_T  = '************' + num_T.slice(12,15);
						//cuenta = 139;
					}
					if(num_T!='' && nom_T!='AMERICAN EXPRESS')
					{
						num_T2 = num_T.toString();
						num_T  = num_T.toString();
						num_T  = '************' + num_T.slice(12,16);
					}
					if(ref_P_id==1 ||ref_P_id==2 ||ref_P_id==3 ||ref_P_id==4 ||ref_P_id==5 ||ref_P_id==6)
					{
						//American Express - BBVA 152343630
						cuenta = 139;
					};
					if(ref_P_id==10 ||ref_P_id==11 ||ref_P_id==12 ||ref_P_id==13 ||ref_P_id==14 ||ref_P_id==15 ||ref_P_id==16 ||ref_P_id==17) 
					{
						//Banamex - Banamex 1976034976
						cuenta = 138;
					};
					if(ref_P_id==18 ||ref_P_id==19 ||ref_P_id==20 ||ref_P_id==21 ||ref_P_id==22 ||ref_P_id==23 ||ref_P_id==24 ||ref_P_id==25) 
					{
						//BBVA - BBVA 152343630
						cuenta = 139;
					};
					if(ref_P_id==26 ||ref_P_id==27 ||ref_P_id==28 ||ref_P_id==29 ||ref_P_id==30 ||ref_P_id==31 ||ref_P_id==32 ||ref_P_id==33) 
					{
						//Banorte - HSBC 37669694
						cuenta = 141;
					};
					if(ref_P_id==44 ||ref_P_id==45 ||ref_P_id==46 ||ref_P_id==47 ||ref_P_id==48 ||ref_P_id==49 ||ref_P_id==50 ||ref_P_id==51) 
					{
						//HSBC - HSBC 37669694
						cuenta = 141;
					};
					if(ref_P_id==41) 
					{
						//Efectivo para Deposito BBVA - BBVA 152343630
						cuenta = 139;
					};
					if(ref_P_id==79) 
					{
						//Efectivo para Deposito Banamex - Banamex 1976034976
						cuenta = 138;
					}
					if(ref_P_id==60 ||ref_P_id==61 ||ref_P_id==62 ||ref_P_id==63 ||ref_P_id==64 ||ref_P_id==65 ||ref_P_id==66 ||ref_P_id==67) 
					{
						//Santander - HSBC 37669694
						cuenta = 141;
					};
					if(ref_P_id==68 ||ref_P_id==69 ||ref_P_id==70 ||ref_P_id==71 ||ref_P_id==72 ||ref_P_id==73 ||ref_P_id==74 ||ref_P_id==75) 
					{
						//Scotiabank - HSBC 37669694
						cuenta = 141;
					};
					if(pagoID == '') { customerPayment = nlapiCreateRecord('customerpayment');	}
					else { customerPayment = nlapiLoadRecord('customerpayment',pagoID);	}
					customerPayment.setFieldValue('custbody_aplicacion_automatica','T');
					customerPayment.setFieldValue('trandate',fec_P);
					customerPayment.setFieldValue('payment',cant);
					customerPayment.setFieldValue('custbody_cantidad_pago',cant);
					customerPayment.setFieldValue('custbody_autorizacion_referencia',num_A);
					customerPayment.setFieldValue('custbody_nombre_tarjeta_id',nom_T_id);
					customerPayment.setFieldValue('ccname',nom_T);
					customerPayment.setFieldValue('ccnumber',num_T2);
					customerPayment.setFieldValue('custbody_num_tarjeta',num_T);
					customerPayment.setFieldValue('ccexpiredate',fec_V);
					customerPayment.setFieldValue('custbody_fec_vencimiento_tarjeta',fec_V);
					customerPayment.setFieldValue('custbody_ref_pago_id',ref_P_id);
					customerPayment.setFieldValue('memo',ref_P);
					customerPayment.setFieldValue('custbody_transaccion_realacionada',recId);
					customerPayment.setFieldValue('customer',cte);
					customerPayment.setFieldValue('exchangerate',cambio);
					customerPayment.setFieldValue('undepfunds','F');
					customerPayment.setFieldValue('account',cuenta);
					var IDPAGO = nlapiSubmitRecord(customerPayment);
				}
			}
			var fields = new Array ('custbody_total_pagado','custbody_total_a_pagar');
			var values = new Array (tPagado,(total-tPagado));
			for( var c = 0 ; c<2; c++)
			{
				nlapiSubmitField(recType , recId , fields[c] , values[c] , false);
			}
		}
		catch(e)
		{
			if ( e instanceof nlobjError )
				nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
			else
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
		}
	}
}
//Suitelets Scripts
function reciboPagoPDF(request, response)
{
	var filters = new nlobjSearchFilter('internalid',null,'is',request.getParameter('custparam_recID'));
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('altname','customer');
		columns[1] = new nlobjSearchColumn('email','customer');
		columns[2] = new nlobjSearchColumn('phone','customer');
		columns[3] = new nlobjSearchColumn('billaddress','customer');
		columns[4] = new nlobjSearchColumn('tranid');
	var datosCte 	= nlapiSearchRecord(request.getParameter('custparam_recType'),null,filters,columns);
	var nombre  	= datosCte[0].getValue('altname','customer');
	var telefono 	= datosCte[0].getValue('phone','customer');
	var email 		= datosCte[0].getValue('email','customer')
	var direccion 	= datosCte[0].getValue('billaddress','customer');
		direccion 	= direccion.split(String.fromCharCode(10));
		direccion 	= direccion.join('<br/>');
	var pedido 		= datosCte[0].getValue('tranid');
	var datos_vorwek = '<p font-family=\"Helvetica\" font-size=\"6\">PASEO DE LAS PALMAS 320 PB-A<br/>LOMAS DE CHAPULTEPEC<br/>DELEGACION MIGUEL HIDALGO<br/>C.P. 11000<br/>MEXICO DF<br/>TEL. 9150-5505 / 01800 200 11210</p>';
	var strName = new String();
		strName += '';
		strName += "<table align=\"center\"><tr>";
		strName += "<td align=\"center\"><img width=\"70.2mm\" height=\"18.6mm\" src=\"https://system.netsuite.com/core/media/media.nl?id=17&amp;c=3367613&amp;h=cb80dbc6de3e6424c2b2\" /></td>";
		strName += "<td width=\"20\">&nbsp;&nbsp;&nbsp;&nbsp;</td>";
		strName += "<td><b>VORWERK MEXICO S. de R.L. de C.V.</b>" + datos_vorwek + "</td>";
		strName += "</tr></table>";
		strName += "<table align=\"center\">";
		strName += "<tr><td align=\"center\" color=\"#15994E\" font-size=\"12\"><b>"+"RECIBO DE PAGO, PEDIDO: "+ pedido+"</b></td></tr>";
		strName += "</table>";
		strName += "<p font-family=\"Helvetica\" font-size=\"2\"></p>";
		strName += "<table align=\"left\">"
		strName += "<tr><td align=\"left\" color=\"#15994E\" font-size=\"10\"><b><i>"+"Datos Cliente</i></b></td></tr>";
		strName += "<tr><td align=\"right\">Nombre:</td><td>"+ nombre+"</td></tr>";
		strName += "<tr><td align=\"right\">Dirección:</td><td>"+direccion+"</td></tr>";
		strName += "<tr><td align=\"right\">Teléfono:</td><td>"+ telefono+"</td></tr>";
		strName += "<tr><td align=\"right\">E-mail:</td><td>"+ email + "</td></tr>";
		strName += "</table>";
		strName += "<p font-family=\"Helvetica\" font-size=\"2\"></p>";
		strName += "<table align=\"left\">"
		strName += "<tr><td align=\"left\" color=\"#15994E\" font-size=\"10\"><b><i>"+"Formas de Pago</i></b></td></tr>";
		strName += "</table>";
		strName += "<table width =\"540\">";
		strName += "<tr>"
		strName += "<td font-size=\"8\" border='0.5'>Fecha</td>";
		strName += "<td font-size=\"8\" border='0.5'>Forma/Tipo de Pago</td>";
		strName += "<td font-size=\"8\" border='0.5'>Nombre Tarjeta</td>";
		strName += "<td font-size=\"8\" border='0.5'>No. Tarjeta</td>";
		strName += "<td font-size=\"8\" border='0.5'>Fecha Vencimiento</td>";
		strName += "<td font-size=\"8\" border='0.5'>No. Autorización/Referencia</td>";
		strName += "<td font-size=\"8\" border='0.5'>Cantidad</td>";
		strName += "</tr>"
	columns[0] = new nlobjSearchColumn('custbody_cantidad_pago');
	columns[1] = new nlobjSearchColumn('custbody_autorizacion_referencia');
	columns[2] = new nlobjSearchColumn('custbody_nombre_tarjeta_id');
	columns[3] = new nlobjSearchColumn('custbody_num_tarjeta');
	columns[4] = new nlobjSearchColumn('custbody_fec_vencimiento_tarjeta');
	columns[5] = new nlobjSearchColumn('custbody_ref_pago_id');
	columns[6] = new nlobjSearchColumn('trandate');
	filters = new nlobjSearchFilter('custbody_transaccion_realacionada', null, 'is', request.getParameter('custparam_recID')); 				
	var searchResults = nlapiSearchRecord('customerpayment', null, filters, columns);
	try
	{
		var lon =searchResults.length;
		var resultados = new Array();
		var i=0;
		var strNamePagos = new String();
		for(var cont=lon-1;cont>0;cont--)
		{
			if(searchResults[cont].getId()!=searchResults[cont-1].getId())
			 { resultados[i]=searchResults[cont]; i++; }	             
		}
		resultados[i]=searchResults[0];
		resultados.reverse();
		for ( var i = 0 ;i<resultados.length ; i++ )
		{
			strName += "<tr>"
			strName += "<td font-size=\"8\" border='0.5' border-style='dotted-narrow'>"+resultados[i].getValue('trandate')+"</td>";
			strName += "<td font-size=\"8\" border='0.5' border-style='dotted-narrow'>"+resultados[i].getText('custbody_ref_pago_id')+"</td>";
			strName += "<td font-size=\"8\" border='0.5' border-style='dotted-narrow'>"+resultados[i].getText('custbody_nombre_tarjeta_id')+"</td>";
			strName += "<td font-size=\"8\" border='0.5' border-style='dotted-narrow'>"+resultados[i].getValue('custbody_num_tarjeta')+"</td>";
			strName += "<td font-size=\"8\" border='0.5' border-style='dotted-narrow'>"+resultados[i].getValue('custbody_fec_vencimiento_tarjeta')+"</td>";
			strName += "<td font-size=\"8\" border='0.5' border-style='dotted-narrow'>"+resultados[i].getValue('custbody_autorizacion_referencia')+"</td>";
			strName += "<td font-size=\"8\" border='0.5' border-style='dotted-narrow'>"+resultados[i].getValue('custbody_cantidad_pago')+"</td>";
			strName += "</tr>"
			tPagado += parseFloat(resultados[i].getValue('custbody_cantidad_pago'));
		}
		strName += "</table>";	
	}
	catch(e)
	{
		strName += "</table>";	
	}
	xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n" + "<pdf><head></head><body font='helvetica' font-size='10'>" + strName + "</body>\n</pdf>";
	file = nlapiXMLToPDF(xml);
	response.setContentType('PDF','Recibo de Pagos.pdf', 'inline');
	response.write( file.getValue() );
}
//Clientt Scripts
//Script ID: customscript_validar_datos_pago
function saveRecord()
{
	if(returnBlank(nlapiGetFieldValue('custbody_id_direccion_cliente')==''))
	{
		if(nlapiGetFieldValue('entity')==7176)
		{
			nlapiSetFieldValue('billaddresslist',19730);
			nlapiSetFieldValue('custbody_id_direccion_cliente',19730);
			return true;
		}
		else
		{
			if(returnBlank(nlapiGetFieldValue('billaddresslist'))!='')
			{
				nlapiSetFieldValue('custbody_id_direccion_cliente',nlapiGetFieldValue('billaddresslist'));
				nlapiSetFieldValue('billaddresslist',nlapiGetFieldValue('billaddresslist'));
				return true;
			}
			else
			{
				alert('Seleccione una direccion de facturación.')
				return false;
			}	
		}
	}
	else
	{
		var recordId = returnBlank(nlapiGetRecordId());
		if(recordId!='')
		{
			var total = nlapiGetFieldValue('total');
			var totalOri = nlapiGetFieldValue('custbody_total_original');
			if(total!=totalOri)
			{
				var b = confirm('El importe original de la transacción ha cambiado, ¿esta seguro de continuar?');
				if(b==true)	
				{ 
					nlapiSetFieldValue('custbody_total_original',total);	
					return true; 
				}
				else { return false;}
			}
			else { return true; }
		}
		else 
		{ 
			nlapiSetFieldValue('custbody_total_original',nlapiGetFieldValue('total'));
			return true; 
		}
	}
}
function recalc(type,name)
{
	try
	{
		if(type=='custpage_datos_pagos')
		{
			var total 	= parseFloat(nlapiGetFieldValue('total'));
			var tPagado	= parseFloat(nlapiGetFieldValue('custbody_total_pagado'));
			var lineas 	= nlapiGetLineItemCount('custpage_datos_pagos');
			var cant	= 0;
			for ( var i = 1 ; i<=lineas ; i++)
			{
				var cant_aux = parseFloat(nlapiGetLineItemValue('custpage_datos_pagos','custpage_cantidad',i));
				if(isNaN(cant_aux)==true) { cant_aux = 0.0; cant += cant_aux;}
				else { cant += cant_aux; }
			}
			nlapiSetFieldValue('custbody_total_pagado' , (cant) , false , false);
			nlapiSetFieldValue('custbody_total_a_pagar' , (total-cant) , false , false);
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
function lineInit(type,linenum)
{
	try
	{
		nlapiDisableLineItemField('custpage_datos_pagos','custpage_pago_id',true);
		var ref_pago = parseFloat(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_ref_pago'));
		if(ref_pago == 1 || ref_pago == 2 || ref_pago == 3 || ref_pago == 4 || ref_pago == 5 || ref_pago == 6)
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',1);
		}
		if(ref_pago == 10 || ref_pago == 12 || ref_pago == 13 || ref_pago == 14 || ref_pago == 15 || ref_pago == 16) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',3);
		}
		if(ref_pago == 18 || ref_pago == 20 || ref_pago == 21 || ref_pago == 22 || ref_pago == 23 || ref_pago == 24) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',2);
		}
		if(ref_pago == 26 || ref_pago == 28 || ref_pago == 29 || ref_pago == 30 || ref_pago == 31 || ref_pago == 32) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',4);
		}
		if(ref_pago == 44 || ref_pago == 46 || ref_pago == 47 || ref_pago == 48 || ref_pago == 49 || ref_pago == 50) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',7);
		}
		if(ref_pago == 60 || ref_pago == 62 || ref_pago == 63 || ref_pago == 64 || ref_pago == 65 || ref_pago == 66) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',5);
		}
		if(ref_pago == 68 || ref_pago == 70 || ref_pago == 71 || ref_pago == 72 || ref_pago == 73 || ref_pago == 74) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',5);
		}
		if(ref_pago == 1 || ref_pago == 2 || ref_pago == 3 || ref_pago == 4 || ref_pago == 5 || ref_pago == 6 || ref_pago == 10 || ref_pago == 12 || ref_pago == 13 || ref_pago == 14 || ref_pago == 15 || ref_pago == 16 || ref_pago == 18 || ref_pago == 20 || ref_pago == 21 || ref_pago == 22 || ref_pago == 23 || ref_pago == 24 ||ref_pago == 26 || ref_pago == 28 || ref_pago == 29 || ref_pago == 30 || ref_pago == 31 || ref_pago == 32 || ref_pago == 44 || ref_pago == 46 || ref_pago == 47 || ref_pago == 48 || ref_pago == 49 || ref_pago == 50 || ref_pago == 60 || ref_pago == 62 || ref_pago == 63 || ref_pago == 64 || ref_pago == 65 || ref_pago == 66 || ref_pago == 68 || ref_pago == 70 || ref_pago == 71 || ref_pago == 72 || ref_pago == 73 || ref_pago == 74)
		{
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_tarjeta',false);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_fecha_vencimiento',false);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_autorizacion',false);
		}
		else
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta','');
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta','');
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento','');
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_tarjeta',true);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_fecha_vencimiento',true);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_nom_tarjeta',true);
		}
		if(nlapiGetRecordType()=='invoice')
		{
			var codigoRetorno = returnBlank(nlapiGetFieldValue('custbody_codigo_retorno'));
			if(codigoRetorno=='0')
			{
				var f = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
				var lineFields = f.getAllLineItemFields(type);
				for(var i=0;i<lineFields.length;i++)
				{
					nlapiDisableLineItemField(type, lineFields[i], true)
				}
			}
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
function pageInit(type,linenum)
{
	try
	{
		var roleID = parseFloat(nlapiGetContext().getRole());
		if(roleID!=3 && type=='edit') 
		{
			nlapiDisableField('entity',true);
			nlapiDisableField('custbody_busqueda_presentadora',true);
			nlapiDisableField('salesrep',true);
		}
		nlapiSetFieldValue('custbody_total_original',nlapiGetFieldValue('total'));
		nlapiDisableLineItemField('custpage_datos_pagos','custpage_pago_id',true);
		var ref_pago = parseFloat(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_ref_pago'));
		if(ref_pago == 1 || ref_pago == 2 || ref_pago == 3 || ref_pago == 4 || ref_pago == 5 || ref_pago == 6 || ref_pago == 7)
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',1);
		}
		if(ref_pago == 10 || ref_pago == 12 || ref_pago == 13 || ref_pago == 14 || ref_pago == 15 || ref_pago == 16) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',3);
		}
		if(ref_pago == 18 || ref_pago == 20 || ref_pago == 21 || ref_pago == 22 || ref_pago == 23 || ref_pago == 24) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',2);
		}
		if(ref_pago == 26 || ref_pago == 28 || ref_pago == 29 || ref_pago == 30 || ref_pago == 31 || ref_pago == 32) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',4);
		}
		if(ref_pago == 44 || ref_pago == 46 || ref_pago == 47 || ref_pago == 48 || ref_pago == 49 || ref_pago == 50) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',7);
		}
		if(ref_pago == 60 || ref_pago == 62 || ref_pago == 63 || ref_pago == 64 || ref_pago == 65 || ref_pago == 66) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',5);
		}
		if(ref_pago == 68 || ref_pago == 70 || ref_pago == 71 || ref_pago == 72 || ref_pago == 73 || ref_pago == 74) 
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',5);
		}
		if(ref_pago == 1 || ref_pago == 2 || ref_pago == 3 || ref_pago == 4 || ref_pago == 5 || ref_pago == 6 || ref_pago == 7 || ref_pago == 10 || ref_pago == 12 || ref_pago == 13 || ref_pago == 14 || ref_pago == 15 || ref_pago == 16 || ref_pago == 18 || ref_pago == 20 || ref_pago == 21 || ref_pago == 22 || ref_pago == 23 || ref_pago == 24 ||ref_pago == 26 || ref_pago == 28 || ref_pago == 29 || ref_pago == 30 || ref_pago == 31 || ref_pago == 32 || ref_pago == 44 || ref_pago == 46 || ref_pago == 47 || ref_pago == 48 || ref_pago == 49 || ref_pago == 50 || ref_pago == 60 || ref_pago == 62 || ref_pago == 63 || ref_pago == 64 || ref_pago == 65 || ref_pago == 66 || ref_pago == 68 || ref_pago == 70 || ref_pago == 71 || ref_pago == 72 || ref_pago == 73 || ref_pago == 74)
		{
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_tarjeta',false);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_fecha_vencimiento',false);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_autorizacion',false);
		}
		else
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta','');
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta','');
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento','');
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_tarjeta',true);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_fecha_vencimiento',true);
			nlapiDisableLineItemField('custpage_datos_pagos','custpage_nom_tarjeta',true);
		}
		if(nlapiGetRecordType()=='invoice')
		{
			var codigoRetorno = returnBlank(nlapiGetFieldValue('custbody_codigo_retorno'));
			if(codigoRetorno=='0')
			{
				var f = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
				var bodyFields = f.getAllFields();
				var lineFields = new Array();
				for(var i=0;i<bodyFields.length;i++)
				{
					nlapiDisableField(bodyFields[i], true);
				}
				nlapiDisableField('shipcarrier', true);
				lineFields = f.getAllLineItemFields('expcost');
				for(var i=0;i<returnZeroLength(f.getAllLineItemFields('expcost'));i++)
				{
					nlapiDisableLineItemField('expcost', lineFields[i], true)
				}
				lineFields = f.getAllLineItemFields('time');
				for(var i=0;i<returnZeroLength(f.getAllLineItemFields('time'));i++)
				{
					nlapiDisableLineItemField('time', lineFields[i], true)
				}
				lineFields = f.getAllLineItemFields('recmachcustrecord_3k_factura_prov_asociada');
				for(var i=0;i<returnZeroLength(f.getAllLineItemFields('recmachcustrecord_3k_factura_prov_asociada'));i++)
				{
					nlapiDisableLineItemField('recmachcustrecord_3k_factura_prov_asociada', lineFields[i], true)
				}
				lineFields = f.getAllLineItemFields('promocodecurrency');
				for(var i=0;i<returnZeroLength(f.getAllLineItemFields('promocodecurrency'));i++)
				{
					nlapiDisableLineItemField('promocodecurrency', lineFields[i], true)
				}
				lineFields = f.getAllLineItemFields('links');
				for(var i=0;i<returnZeroLength(f.getAllLineItemFields('links'));i++)
				{
					nlapiDisableLineItemField('links', lineFields[i], true)
				}
				lineFields = f.getAllLineItemFields('itemcost');
				for(var i=0;i<returnZeroLength(f.getAllLineItemFields('itemcost'));i++)
				{
					nlapiDisableLineItemField('itemcost', lineFields[i], true)
				}
				lineFields = f.getAllLineItemFields('item');
				for(var i=0;i<returnZeroLength(f.getAllLineItemFields('item'));i++)
				{
					nlapiDisableLineItemField('item', lineFields[i], true)
				}
			}
			var ov = returnBlank(nlapiGetFieldValue('createdfrom'));
			if(ov!='')
			{
				var filters = new nlobjSearchFilter("internalid",null,"is", ov);
				var columns = new nlobjSearchColumn('tranid');	
				var resultsOV = returnBlank(nlapiSearchRecord("salesorder", null, filters, columns)); 
				if(resultsOV!='')
				{
					nlapiSetFieldValue('custbody_numc',resultsOV[0].getValue('tranid'));
				}
			}
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
function fieldChange(type,name,linenum)
{
	try
	{
		if(name=='billaddresslist' || name =='billaddress') 
		{	
			nlapiSetFieldValue('custbody_id_direccion_cliente',nlapiGetFieldValue('billaddresslist')); 
		} 
		if(name=='salesrep')
		{
			if(returnBlank(nlapiGetFieldValue('salesrep')!=''))
			{
				var filters  = new nlobjSearchFilter('internalid',null,'is',nlapiGetFieldValue('salesrep'));
				var columns  = new Array();
					columns[0] = new nlobjSearchColumn('supervisor');
					columns[1] = new nlobjSearchColumn('custentity_jefa_grupo_split');
					columns[2] = new nlobjSearchColumn('custentity_delegada');
					columns[3] = new nlobjSearchColumn('location');
					columns[4] = new nlobjSearchColumn('custentity_delegacion');
					columns[5] = new nlobjSearchColumn('custentity_nombre_unidad');
					columns[6] = new nlobjSearchColumn('employeetype');
					columns[7] = new nlobjSearchColumn('custentity_promocion');
					columns[8] = new nlobjSearchColumn('custentity_nombre_unidad','custentity_jefa_grupo_split');
					columns[9] = new nlobjSearchColumn('custentity_delegacion','custentity_jefa_grupo_split');
				var employee = returnBlank(nlapiSearchRecord('employee',null,filters,columns));
				if(employee!='')
				{
					nlapiSetFieldValue('custbody_jefa_grupo',employee[0].getValue('supervisor'));
					nlapiSetFieldValue('custbody_jefa_grupo_split',employee[0].getValue('custentity_jefa_grupo_split'));
					nlapiSetFieldValue('custbody_delegada',employee[0].getValue('custentity_delegada'));
					nlapiSetFieldValue('custbody_sucursal',employee[0].getValue('location'));
					nlapiSetFieldValue('custbody_delegacion',employee[0].getValue('custentity_delegacion'));
					nlapiSetFieldValue('custbody_nombre_unidad',employee[0].getValue('custentity_nombre_unidad'));
					nlapiSetFieldValue('custbody_nombre_unidad_split',employee[0].getValue('custentity_nombre_unidad','custentity_jefa_grupo_split'));
					nlapiSetFieldValue('custbody_delegacion_split',employee[0].getValue('custentity_delegacion','custentity_jefa_grupo_split'));
					nlapiSetFieldValue('custbody_jerarquia',employee[0].getValue('employeetype'));
					nlapiSetFieldValue('custbody_esquema',employee[0].getValue('custentity_promocion'));
				}
				filters = new nlobjSearchFilter('internalid',null,'is',nlapiGetFieldValue('salesrep'));
				columns = new nlobjSearchColumn('supervisor');
				var resultsJDG = (nlapiSearchRecord("employee", null, filters, columns));
				if(resultsJDG!='')
				{
		
					var jefaGrupo = returnBlank(resultsJDG[0].getValue('supervisor'));
					if(jefaGrupo!='')
					{				
						filters = new nlobjSearchFilter('internalid',null,'is',resultsJDG[0].getValue('supervisor'));
						columns = new nlobjSearchColumn('email');
						var resultsJDG_Email = (nlapiSearchRecord("employee", null, filters, columns));
						if(resultsJDG_Email!='')
						{ 
							nlapiSetFieldValue('custbody_email_jefa_grupo',resultsJDG_Email[0].getValue('email'));
						}
					}
				}
			}
			else
			{
				nlapiSetFieldValue('custbody_email_jefa_grupo','');
				nlapiSetFieldValue('custbody_jefa_grupo','');
				nlapiSetFieldValue('custbody_jefa_grupo_split','');
				nlapiSetFieldValue('custbody_delegada','');
				nlapiSetFieldValue('custbody_sucursal','');
				nlapiSetFieldValue('custbody_delegacion','');
				nlapiSetFieldValue('custbody_nombre_unidad','');
				nlapiSetFieldValue('custbody_nombre_unidad_split','');
                nlapiSetFieldValue('custbody_delegacion_split','');
				nlapiSetFieldValue('custbody_jerarquia','');
				nlapiSetFieldValue('custbody_esquema','');
			}
		}
		if(name=='custpage_ref_pago')
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_pago',nlapiGetFieldValue('trandate'));
			var ref_pago = returnBlank(parseFloat(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_ref_pago')));
			if(ref_pago == 1  || ref_pago == 2 || ref_pago == 3 || ref_pago == 4 || ref_pago == 5 || ref_pago == 6 || ref_pago == 7)
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',1);
			}
			if(ref_pago == 10 || ref_pago == 12 || ref_pago == 13 || ref_pago == 14 || ref_pago == 15 || ref_pago == 16) 
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',3);
			}
			if(ref_pago == 18 || ref_pago == 20 || ref_pago == 21 || ref_pago == 22 || ref_pago == 23 || ref_pago == 24) 
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',2);
			}
			if(ref_pago == 26 || ref_pago == 28 || ref_pago == 29 || ref_pago == 30 || ref_pago == 31 || ref_pago == 32) 
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',4);
			}
			if(ref_pago == 44 || ref_pago == 46 || ref_pago == 47 || ref_pago == 48 || ref_pago == 49 || ref_pago == 50) 
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',7);
			}
			if(ref_pago == 60 || ref_pago == 62 || ref_pago == 63 || ref_pago == 64 || ref_pago == 65 || ref_pago == 66) 
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',5);
			}
			if(ref_pago == 68 || ref_pago == 70 || ref_pago == 71 || ref_pago == 72 || ref_pago == 73 || ref_pago == 74) 
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta',5);
			}
			if(ref_pago ==1 || ref_pago == 2 || ref_pago == 3 || ref_pago == 4 || ref_pago == 5 || ref_pago == 6 || ref_pago == 7 || ref_pago == 10 || ref_pago == 12 || ref_pago == 13 || ref_pago == 14 || ref_pago == 15 || ref_pago == 16 || ref_pago == 18 || ref_pago == 20 || ref_pago == 21 || ref_pago == 22 || ref_pago == 23 || ref_pago == 24 ||ref_pago == 26 || ref_pago == 28 || ref_pago == 29 || ref_pago == 30 || ref_pago == 31 || ref_pago == 32 || ref_pago == 44 || ref_pago == 46 || ref_pago == 47 || ref_pago == 48 || ref_pago == 49 || ref_pago == 50 || ref_pago == 60 || ref_pago == 62 || ref_pago == 63 || ref_pago == 64 || ref_pago == 65 || ref_pago == 66 || ref_pago == 68 || ref_pago == 70 || ref_pago == 71 || ref_pago == 72 || ref_pago == 73 || ref_pago == 74)
			{
				nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_tarjeta',false);
				nlapiDisableLineItemField('custpage_datos_pagos','custpage_fecha_vencimiento',false);
				nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_autorizacion',false);
			}
			else
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_nom_tarjeta','');
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta','');
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento','');
				nlapiDisableLineItemField('custpage_datos_pagos','custpage_num_tarjeta',true);
				nlapiDisableLineItemField('custpage_datos_pagos','custpage_fecha_vencimiento',true);
				nlapiDisableLineItemField('custpage_datos_pagos','custpage_nom_tarjeta',true);
			}
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
function validateDelete(type,name)
{
	try
	{
		if(type=='custpage_datos_pagos')
		{
			var pagoId 	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_pago_id'));
			if(pagoId=='')
			{
				var tPagar 	= parseFloat(nlapiGetFieldValue('custbody_total_a_pagar'));
				var tPagado	= parseFloat(nlapiGetFieldValue('custbody_total_pagado'));
				var cant 	= parseFloat(nlapiGetCurrentLineItemValue('custpage_datos_pagos' , 'custpage_cantidad'));
				if(isNaN(cant)==true) { cant=0.0;	}
				nlapiSetFieldValue('custbody_total_pagado' , (tPagado-cant) , false , false);
				nlapiSetFieldValue('custbody_total_a_pagar' , (tPagar+cant) , false , false);
				return true;
			}
			else
			{
				alert('No permitido: este pago ya ha sido registrado.')
				return false;
			}
		}
		else
		{
		 	return true;	
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
function validateLine(type)
{
	try
	{
		if(type=='custpage_datos_pagos')
		{
			try
			{
				var fecP 	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_pago'));
				var nomT  	= returnBlank(nlapiGetCurrentLineItemText('custpage_datos_pagos','custpage_nom_tarjeta'));
				var cant  	= parseFloat(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_cantidad'));
				var fecV    = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento'));
				var numT 	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta'));
				var numA 	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_autorizacion'));
				var ref_pago = returnZero(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_ref_pago'));
				if(ref_pago == 0) 
				{ 
					nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_cantidad',0.0);
					return true; 
				}
				if(ref_pago == 1 || ref_pago == 2 || ref_pago == 3 || ref_pago == 4 || ref_pago == 5 || ref_pago == 6)
				{
					if(numT!='')
					{
						if( (fecP!='') && (cant>0) && (numA !='') && (numT.length==15) && (fecV.length==7) &&( (fecV.charCodeAt(0)>=48 && fecV.charCodeAt(0)<=57) && (fecV.charCodeAt(1)>=48 && fecV.charCodeAt(1)<=57) && (fecV.charCodeAt(2)==47) && (fecV.charCodeAt(3)>=48 && fecV.charCodeAt(3)<=57) && (fecV.charCodeAt(4)>=48 && fecV.charCodeAt(4)<=57) && (fecV.charCodeAt(5)>=48 && fecV.charCodeAt(5)<=57) &&  (fecV.charCodeAt(6)>=48 && fecV.charCodeAt(6)<=57) && (fecV.substr(0,2)<13)) )  
						{
							return true;
						}
						else { return false; }
					}
					else { return false; }
				}
				if(ref_pago == 10 || ref_pago == 12 || ref_pago == 13 || ref_pago == 14 || ref_pago == 15 || ref_pago == 16 || ref_pago == 18 || ref_pago == 20 || ref_pago == 21 || ref_pago == 22 || ref_pago == 23 || ref_pago == 24 || ref_pago == 26 || ref_pago == 28 || ref_pago == 29 || ref_pago == 30 || ref_pago == 31 || ref_pago == 32 || ref_pago == 44 || ref_pago == 46 || ref_pago == 47 || ref_pago == 48 || ref_pago == 49 || ref_pago == 50 ||ref_pago == 60 || ref_pago == 62 || ref_pago == 63 || ref_pago == 64 || ref_pago == 65 || ref_pago == 66 ||ref_pago == 68 || ref_pago == 70 || ref_pago == 71 || ref_pago == 72 || ref_pago == 73 || ref_pago == 74) 
				{
					if(numT!='')
					{
						if( (fecP!='') && (cant>0) && (numA !='') && (numT.length==16) && (fecV.length==7) &&( (fecV.charCodeAt(0)>=48 && fecV.charCodeAt(0)<=57) && (fecV.charCodeAt(1)>=48 && fecV.charCodeAt(1)<=57) && (fecV.charCodeAt(2)==47) && (fecV.charCodeAt(3)>=48 && fecV.charCodeAt(3)<=57) && (fecV.charCodeAt(4)>=48 && fecV.charCodeAt(4)<=57) && (fecV.charCodeAt(5)>=48 && fecV.charCodeAt(5)<=57) &&  (fecV.charCodeAt(6)>=48 && fecV.charCodeAt(6)<=57) && (fecV.substr(0,2)<13)) )  
						{
							return true;
						}
						else { return false; }
					}
					else { return false; }
				}
				if(ref_pago != 1 || ref_pago != 2 || ref_pago != 3 || ref_pago != 4 || ref_pago != 5 || ref_pago != 6 || ref_pago != 10 || ref_pago != 12 || ref_pago != 13 || ref_pago != 14 || ref_pago != 15 || ref_pago != 16 || ref_pago != 18 || ref_pago != 20 || ref_pago != 21 || ref_pago != 22 || ref_pago != 23 || ref_pago != 24 || ref_pago != 26 || ref_pago != 28 || ref_pago != 29 || ref_pago != 30 || ref_pago != 31 || ref_pago != 32 || ref_pago != 44 || ref_pago != 46 || ref_pago != 47 || ref_pago != 48 || ref_pago != 49 || ref_pago != 50 ||ref_pago != 60 || ref_pago != 62 || ref_pago != 63 || ref_pago != 64 || ref_pago != 65 || ref_pago != 66 ||ref_pago != 68 || ref_pago != 70 || ref_pago != 71 || ref_pago != 72 || ref_pago != 73 || ref_pago != 74)
				{
					if(cant>0 && numA!='' && fecP!='') { return true; }
					else { return false; }
				}
			}
			catch(e)
			{
				if ( e instanceof nlobjError )
					nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
				else
					nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
			}
		}
		else { return true; }
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
//User Event Scripts 
//Script ID: customscript_customer_payment_user_event
function copiarValores(type)
{	
	try
	{
		var context = nlapiGetContext();
		var exeContext = context.getExecutionContext();
		if(exeContext!='scheduled' && type!='delete')
		{
			if(returnBlank(nlapiGetFieldValue('custbody_transaccion_realacionada')!='')&& type!='delete')
			{
				var num_T = nlapiGetFieldValue('ccnumber');
					//num_T  = num_T.toString();
				var nom_T = nlapiGetFieldText('custbody_nombre_tarjeta_id');
				var ref_P = nlapiGetFieldText('custbody_ref_pago_id');
				if(num_T!='' && nom_T=='AMERICAN EXPRESS')
				{
					num_T  = num_T.toString();
					num_T  = '************' + num_T.slice(12,15);
				}
				if(num_T!='' && nom_T!='AMERICAN EXPRESS')
				{
					num_T  = num_T.toString();
					num_T  = '************' + num_T.slice(12,16);
				}		
				nlapiSetFieldValue('custbody_num_tarjeta',num_T);
				nlapiSetFieldValue('ccname',nom_T);
				nlapiSetFieldValue('memo',ref_P);
				nlapiSetFieldValue('custbody_fec_vencimiento_tarjeta',returnBlank(nlapiGetFieldValue('ccexpiredate')));
			}
		}
	}
	catch(e)
	{
		if ( e instanceof nlobjError )
			nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
		else
			nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
	}
}
//Helpers
//Helper, return 0 when NaN or null
function returnZeroLength(value)
{	
	if (value == null || value == NaN)
		return 0;
	else 
		return value.length;
}
//Helper, return '' when NaN or null
function returnBlank(value)
{	
	if (value == null || value == NaN)
		return '';
	else 
		return value;
}
//Helper, return 0 when NaN or null or ''
function returnZero(value)
{	
	if (value == null || value == NaN || value == '')
		return 0;
	else 
		return value;
}