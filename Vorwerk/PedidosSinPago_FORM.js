function PedidosSinPago_FORM(request, response)
{
	var titleForm			= 'Pedidos Sin Pago';
	try
	{
		var mode				= returnBlank(request.getParameter('mode'));
			mode				= decodeBase64(mode);
		var htmlFieldType		= '';
		var fieldDisplayType	= '';
		var submitButtonName	= '';
		var createButtonCancel	= new Boolean();
		var setClientScript		= new Boolean();
		switch(mode)
		{
			case 'edit':
			{
				htmlFieldType		= 'longtext';
				fieldDisplayType	= 'normal';
				sublistDisplayType  = 'inlineeditor';
				submitButtonName	= 'Guardar';
				createButtonCancel	= true;
				setClientScript		= true;
			};break;
			default:
			{
				htmlFieldType		= 'inlinehtml';
				fieldDisplayType	= 'inline';
				sublistDisplayType  = 'staticlist';
				submitButtonName	= 'Editar';
				createButtonCancel	= false;
				setClientScript		= false;
			};break;
		}		
		if (request.getMethod() == "GET")
		{
			var form 								= nlapiCreateForm(titleForm);
			var groupEnvio 							= form.addFieldGroup( 'groupEnvio', 'Envio');
				groupEnvio.setShowBorder(true);
	        var groupMensaje 						= form.addFieldGroup( 'groupMensaje', 'Mensaje');
	        	groupMensaje.setShowBorder(true);
			var help_empleado						= 'Ingrese el empleado el cual sera el remitente del correo electrónico de <i>' + titleForm + '</i>.';
				help_empleado   				   += '<br><br>Para ver la lista de empleados, vaya a <i>Listas > Empleados > Empleados</i>';
			var help_empleado_email					= 'Este es el correo electrónico del empleado que sera el remitente de <i>' + titleForm + '</i>.';
				help_empleado_email	 			   += '<br><br>El campo se llama <i>Correo Electronico</i> id: <i>email</i>';
			var help_para							= 'El destinatario de <i>' + titleForm + '</i> siempre sera el usuario que ha creado o modificado la Orden de Venta';
			var help_cc								= 'Estos son los correo electrónicos a quienes se les enviara una copia de <i>' + titleForm + '</i>.';
				help_cc	 			   			   += '<br><br>Separe los valores por medio de comas: ejemplo3@micorreo.com,ejemplo4@micorreo.com';
			var help_bcc							= 'Estos son los correo electrónicos a quienes se les enviara una copia oculta de <i>' + titleForm + '</i>.';
				help_bcc	 			   		   += '<br><br>Separe los valores por medio de comas: ejemplo5@micorreo.com,ejemplo6@micorreo.com';
			var help_asunto							= 'Este es el asunto con el que se enviara el correo electrónico de <i>' + titleForm + '</i>.';
			var help_mensaje						= 'Este es el contenido del correo electrónico de <i>' + titleForm + '</i>.que será enviado cada que se registre un pedido sin múltiples pagos';
				help_mensaje	 			 	   += '<br><br>Estas son las etiquetas IMR que puede utilizar:<br>';
				help_mensaje	 			 	   += '<br>[user] ==  Usuario';
				help_mensaje	 			 	   += '<br>[tranid] ==  Orden de Venta';
				help_mensaje	 			 	   += '<br>[trandate] ==  Fecha';
				help_mensaje	 			 	   += '<br>[url] ==  Enlace del registro';
	    	var _empleado							= form.addField('custpage_empleado','select', 'Empleado', 'employee','groupEnvio');
	    		_empleado.setDisplayType(fieldDisplayType);
	    		_empleado.setHelpText(help_empleado, true);
	    		_empleado.setMandatory(true);
	    	var _empleado_email						= form.addField('custpage_empleado_email','text', 'Correo Electrónico', null,'groupEnvio');
	    		_empleado_email.setDisplayType('inline');
	    		_empleado_email.setHelpText(help_empleado_email, true);
	    		_empleado_email.setMandatory(true);
			var _para								=	form.addField('custpage_para','text', 'Para', null,'groupEnvio');
				_para.setDisplayType('inline');
				_para.setHelpText(help_para, true);
			var _cc									=	form.addField('custpage_cc','text', 'CC', null,'groupEnvio');
				_cc.setDisplayType(fieldDisplayType);
				_cc.setHelpText(help_cc, true);
			var _bcc								=	form.addField('custpage_bcc','text', 'BCC', null,'groupEnvio');
				_bcc.setDisplayType(fieldDisplayType);
				_bcc.setHelpText(help_bcc, true);
			var _asunto								=	form.addField('custpage_asunto','text', 'Ausnto', null,'groupEnvio');
				_asunto.setDisplayType(fieldDisplayType);
				_asunto.setHelpText(help_asunto, true);
				_asunto.setMandatory(true);
			var _mode								=	form.addField('custpage_mode','text', 'Modo', null,'groupEnvio');
				_mode.setDisplayType('hidden');
			var _aux								=	form.addField('custpage_aux','inlinehtml', 'Aux', null,'groupEnvio');
				_aux.setBreakType('startcol');
			var _mensaje							=	form.addField('custpage_mensaje',htmlFieldType, 'Mensaje', null,'groupMensaje');
				_mensaje.setDisplayType(fieldDisplayType);
				_mensaje.setHelpText(help_mensaje, true);
				_mensaje.setMandatory(true);
			if(createButtonCancel == true)
			{
				var urlSUITELET				= nlapiResolveURL("SUITELET", "customscript_pedidos_sin_pago_form", "customdeploy_pedidos_sin_pago_form", false);
				var	url 					= urlSUITELET;
				form.addButton('custpage_cancel_button', 'Cancelar', "window.location.href='"+url+"'");
			}
			var dataFile							= nlapiLoadFile(266385);
				dataFile							= dataFile.getValue();				
			var dataXML								= nlapiStringToXML(dataFile);
			var dataXMLNode							= nlapiSelectNode(dataXML, '//PedidosSinPago');
			var _empleado							= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PedidosSinPago/custpage_empleado')));
			var _para								= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PedidosSinPago/custpage_para')));
			var _cc									= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PedidosSinPago/custpage_cc')));
			var _bcc								= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PedidosSinPago/custpage_bcc')));
			var _asunto								= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PedidosSinPago/custpage_asunto')));
		    var _mensaje							= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PedidosSinPago/custpage_mensaje')));
	        var _empleado_email						= '';
	        var filters								= new Array();
	        	filters[0]							= new nlobjSearchFilter('internalid', null, 'is', _empleado);
	        var columns								= new Array();
	        	columns[0]							= new nlobjSearchColumn('email', null, null);
	        	columns[1]							= new nlobjSearchColumn('firstname', null, null);
	        	columns[2]							= new nlobjSearchColumn('middlename', null, null);
	        	columns[3]							= new nlobjSearchColumn('lastname', null, null);
	        var employeeSearch						= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
	        if(employeeSearch != '')
	        {
	        	_empleado_email 	= returnBlank(employeeSearch[0].getValue('email'));
	        }
			var values 								= new Object();
				values.custpage_empleado			= _empleado;	
				values.custpage_empleado_email		= _empleado_email;
				values.custpage_para				= _para;
				values.custpage_cc 					= _cc;
				values.custpage_bcc			 		= _bcc;
				values.custpage_asunto				= _asunto;
				values.custpage_mode				= mode;
				values.custpage_mensaje				= _mensaje;
			form.setFieldValues(values); 
			form.addSubmitButton(submitButtonName);
			if(setClientScript == true)
			{
				form.setScript('customscript_pedidos_sin_pago_form_fv');
			}
	        response.writePage(form);
		}
		else
		{
			var params_edit			= '';	
			var mode				= returnBlank(request.getParameter('custpage_mode'));
			switch(mode)
			{
				case 'edit':
				{
		            params_edit		= null;
					var _empleado	= returnBlank(request.getParameter('custpage_empleado'));
					var _para		= returnBlank(request.getParameter('custpage_para'));
					var _cc			= returnBlank(request.getParameter('custpage_cc'));
					var _bcc		= returnBlank(request.getParameter('custpage_bcc'));
					var _asunto		= returnBlank(request.getParameter('custpage_asunto'));
					var _mensaje	= returnBlank(request.getParameter('custpage_mensaje'));
					nlapiLogExecution('ERROR', '_empleado', _empleado);
					nlapiLogExecution('ERROR', '_para', _para);
					nlapiLogExecution('ERROR', '_cc', _cc);
					nlapiLogExecution('ERROR', '_bcc', _bcc);
					nlapiLogExecution('ERROR', '_asunto', _asunto);
					nlapiLogExecution('ERROR', '_mensaje', _mensaje);
					var xml 				= "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
		        		xml 			   += "<PedidosSinPago>";
		        			xml					+= "<custpage_empleado>"	+ encodeBase64(_empleado)  	+ "</custpage_empleado>";
		        			xml					+= "<custpage_para>"		+ encodeBase64(_para)  		+ "</custpage_para>";
		        			xml					+= "<custpage_cc>" 			+ encodeBase64(_cc)  		+ "</custpage_cc>";
		        			xml					+= "<custpage_bcc>" 		+ encodeBase64(_bcc)  		+ "</custpage_bcc>";
		        			xml					+= "<custpage_asunto>" 		+ encodeBase64(_asunto)  	+ "</custpage_asunto>";
		        			xml					+= "<custpage_mensaje>" 	+ encodeBase64(_mensaje)  	+ "</custpage_mensaje>";
		        		xml 				+= "</PedidosSinPago>";
			    	var xmlDocument  				= nlapiStringToXML(xml);
			    	var xmlString					= nlapiXMLToString(xmlDocument);
			    	var dataFile					= nlapiCreateFile('PedidosSinPago_FORM_CONFIG.xml', 'XMLDOC', xmlString);
			    		dataFile.setFolder(11);
			    	var dataFileID					= nlapiSubmitFile(dataFile);
			    	nlapiLogExecution('ERROR', 'dataFileID', dataFileID);
				};break;
				default:
				{
		            params_edit		= new Array();
	            	params_edit['mode']	= encodeBase64('edit');
				};break;
			}
			nlapiSetRedirectURL('SUITELET','customscript_pedidos_sin_pago_form', 'customdeploy_pedidos_sin_pago_form', false, params_edit);
			nlapiLogExecution('ERROR', "redireccionado edit", "redireccionado edit");
		}
	}
	catch(e)
    {
    	var htmlError	 	= new String();
        if ( e instanceof nlobjError )
        {

        	htmlError		+= "<br>Ha ocurrido un error, debido a las siguientes razones:";
        	var ecode 		 = returnBlank(e.getCode());
        	var edetails 	 = returnBlank(e.getDetails());
        	var eid 		 = returnBlank(e.getId());
        	var einternalid	 = returnBlank(e.getInternalId());
        	var estacktrace	 = returnBlank(e.getStackTrace());
        		estacktrace	 = estacktrace.join();
        	var euserevent 	 = returnBlank(e.getUserEvent());
        	htmlError 		+= '<blockquote>';
        	htmlError 		+= "<br><br>" + '<b>Error Code: </b>' 			+ ecode			;
        	htmlError 		+= "<br><br>" + '<b>Error Details: </b>' 		+ edetails		;
        	htmlError 		+= "<br><br>" + '<b>Error ID: </b>'				+ eid			;
        	htmlError 		+= "<br><br>" + '<b>Error Internal ID: </b>'	+ einternalid	;
        	htmlError 		+= "<br><br>" + '<b>Error Stacktrace: </b>'		+ estacktrace	;
        	htmlError 		+= "<br><br>" + '<b>Error User Event: </b>' 	+ euserevent 	;
        	htmlError 		+= '</blockquote>';
            nlapiLogExecution( 'ERROR', 'Error Code',ecode);
            nlapiLogExecution( 'ERROR', 'Error Detail',edetails);
            nlapiLogExecution( 'ERROR', 'Error ID',eid);
            nlapiLogExecution( 'ERROR', 'Error Internal ID',einternalid);
            nlapiLogExecution( 'ERROR', 'Error Stacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'Error User Event',euserevent);
        }
        else
        {
        	htmlError		+= "<br>Ha ocurrido un error, debido a la siguiente raz&oacute;n:";
        	var errorString	 = e.toString();
        	htmlError 		+= '<blockquote>';
        	htmlError 		+= "<br><br>" + '<b>Unexpected Error: </b>' + errorString;
        	htmlError 		+= '</blockquote>';
            nlapiLogExecution( 'ERROR', 'Unexpected Error',errorString );
        }
		htmlError += "<br><br>Consulte a Soporte T&eacute;cnico y mueste este mensaje.";
		htmlError += "<br><br>Puede continuar navegando en <b>NetSuite</b>";
        htmlError  = encodeBase64(htmlError);
        titleForm  = encodeBase64(titleForm);
        var params_handler_error				= new Array();
	    	params_handler_error['html']		= htmlError;
	    	params_handler_error['titleForm']	= titleForm;
		nlapiSetRedirectURL('SUITELET','customscript_pedidos_sin_pago_he', 'customdeploy_pedidos_sin_pago_he', false, params_handler_error);
		nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
    }
}
//--- Helpers ---
function encodeBase64(input)
{
	if(input != '')
	{
		var b64array 	= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var base64 		= "";
		var chr1		= "";
		var chr2		= "";
		var chr3 		= "";
		var enc1		= "";
		var enc2		= "";
		var enc3		= "";
		var enc4 		= "";
		var i 			= 0;
		do 
		{
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) 
			{
				enc3 = enc4 = 64;
			}else if (isNaN(chr3)) 
			{
				enc4 = 64;
			}
			base64  = base64  +
			b64array.charAt(enc1) +
			b64array.charAt(enc2) +
			b64array.charAt(enc3) +
			b64array.charAt(enc4);
			chr1 = chr2 = chr3 = "";
			enc1 = enc2 = enc3 = enc4 = "";
		}while (i < input.length);
		return base64;
	}
	else
	{
		return '';
	}
}
//---
function decodeBase64(input)
{
	if(input != '')
	{
		var b64array 	= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var output 		= "";
		var chr1		= "";
		var chr2		= "";
		var chr3 		= "";
		var enc1		= "";
		var enc2		= "";
		var enc3		= "";
		var enc4 		= "";
		var i 			= 0;
		/*/
		var base64test = /[^A-Za-z0-9\+\/\=]/g;
		if (base64test.exec(input)) 
		{
			$("#message").html("There were invalid base64 characters in the input text.\n" +
			   "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
			   "Expect errors in decoding.");
		} else 
		{
			$("#message").html("");
		}
		/*/
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		do 
		{
			enc1 = b64array.indexOf(input.charAt(i++));
			enc2 = b64array.indexOf(input.charAt(i++));
			enc3 = b64array.indexOf(input.charAt(i++));
			enc4 = b64array.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64) 
			{
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) 
			{
				output = output + String.fromCharCode(chr3);
			}
			chr1		= "";
			chr2		= "";
			chr3 		= "";
			enc1		= "";
			enc2		= "";
			enc3		= "";
			enc4 		= "";
		} while (i < input.length);
		return output;
	}
	else
	{
		return '';
	}
}
//---
function returnBlank(value)
{	
	if (value == null || value == undefined)
	{
		return '';
	}
	else
	{
		return value;
	}
}