//Elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null)
		return "";
	else 
		return value;
}
//forza el retorno de un valor numerico.
function getVal(v)
{
	return parseFloat(v) || 0.0;
}
//retorna la cantidad en formato de 16 enteros y 2 decimales. 
function getNumber_16_2( v )
{
	v = v.toFixed(2);
    var	p = v.split('.');
    var ceros ='0000000000000000';
    var l = p[0].length;
    var n = ceros.slice(0,(ceros.length-l));
    n = n.concat(p[0],p[1]);
    return n;
}
function getAccount_20( v )
{
    var ceros20 ='00000000000000000000';
	var f = ceros20.length - v.length;
    var n = ceros20.slice(0,(f));
		n = n.concat(v);
    return n;
}
function getRef_40( v ,opc,nat_arc)
{
	var n = '';
	if(returnBlank(v)!='')
	{
		if(opc==1)
		{
			v = v.toUpperCase();
			v = v.split(String.fromCharCode(32));
			v = v.join('');
			v = v.split(String.fromCharCode(164));
			v = v.join('');
			v = v.split(String.fromCharCode(165));
			v = v.join('');
			for(var i=65;i<=90;i++)
			{
				v = v.split(String.fromCharCode(i));
				v = v.join('');
			}
		    var ceros = ''; //'0000000000';
		    switch(nat_arc)
		    {
		    	case '05':
		    	case '06':
		    	{
		    		ceros = '0000000000';
		    	};break;
		    	case '12':
		    	{
		    		ceros = '0000000';
		    	};break;
		    	default:
		    	{
		    		ceros = '0000000000';
		    	};break;
		    }
		    var l = v.length;
		    n = ceros.slice(0,(ceros.length-l));
			n = n.concat(v);
			var l2 	= n.length;
			for(var i=l2;i<40;i++)
			{
				n += ' ';
			}
		    return n;
		}
		if(opc==2)
		{
			v = v.toUpperCase();
			v = v.split(String.fromCharCode(32));
			v = v.join('');
			v = v.split(String.fromCharCode(164));
			v = v.join('');
			v = v.split(String.fromCharCode(165));
			v = v.join('');
			for(var i=65;i<=90;i++)
			{
				v = v.split(String.fromCharCode(i));
				v = v.join('');
			}
		    var inst ='PAGO FACTURA '+v;
		    var l = 40 - inst.length;
		    for(var i=0;i<l;i++)
		    {
		    	inst+=' ';
		    }
				return inst;
		}
	}
	else
	{
		n = '                              0000000000';
	    return n;
	}
}
function getNumAbo_6( v )
{
    var ceros6 ='000000';
    var f = ceros6.length - parseFloat(v.toString().length);
    var n = ceros6.slice(0,f);
        n = n.concat(v);
    return n;
}
function getRef7( v )
{
	v = v.toUpperCase();
	v = v.split(String.fromCharCode(32));
	v = v.join('');
	v = v.split(String.fromCharCode(164));
	v = v.join('');
	v = v.split(String.fromCharCode(165));
	v = v.join('');
	for(var i=65;i<=90;i++)
	{
		v = v.split(String.fromCharCode(i));
		v = v.join('');
	}
    var ceros7 ='0000000';
    var f = ceros7.length - parseFloat(v.toString().length);
    var n = ceros7.slice(0,f);
        n = n.concat(v);
    return n;
}
function getNameBen( rec )
{
	if(rec.getFieldValue('isperson')=='T') 
	{
		var firstName = rec.getFieldValue('firstname');
		var lastName  = rec.getFieldValue('lastname');
		var lastNameAux = lastName.split(' ');
		lastName = lastNameAux[0]+'/';
		lastNameAux.reverse();
		lastNameAux.pop();
		lastNameAux.reverse();
		lastNameAux = lastNameAux.join(' ');
		lastName +=lastNameAux;
		var beneficiario = firstName +','+lastName;
		beneficiario = beneficiario.slice(0,55);
		var beneficiarioAux ='';
		if(beneficiario.length<55)
		{
			for(var i=beneficiario.length;i<55;i++) { beneficiario += String.fromCharCode(32); }
		}
		for(var i=0;i<beneficiario.length;i++)
		{
			if(beneficiario.charCodeAt(i)==44 || beneficiario.charCodeAt(i)==47 || (beneficiario.charCodeAt(i)>=65 && beneficiario.charCodeAt(i)<=90) || (beneficiario.charCodeAt(i)>=97 && beneficiario.charCodeAt(i)<=122))
			{ beneficiarioAux += beneficiario.charAt(i); }
			else
			{ beneficiarioAux += String.fromCharCode(32); }
		}
		return beneficiarioAux;
	}
	else
	{
		var companyname = ',' + rec.getFieldValue('companyname');
			companyname = companyname.slice(0,54) + '/';
		var companynameAux ='';
		if(companyname.length<55)
		{
		  	for(var i=companyname.length;i<55;i++)
			companyname += String.fromCharCode(32);
		}
		for(var i=0;i<companyname.length;i++)
		{
			if(companyname.charCodeAt(i)==44 || companyname.charCodeAt(i)==47 || (companyname.charCodeAt(i)>=65 && companyname.charCodeAt(i)<=90) || (companyname.charCodeAt(i)>=97 && companyname.charCodeAt(i)<=122))
			{ companynameAux += companyname.charAt(i); }
			else
			{ companynameAux += String.fromCharCode(32); }
		}
		return companynameAux;
	}
}
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
//función que agrega el boton al formulario.
function ButtonGenerarArchivo(type, form)
{
	if (type == "view")
	{   
		form.setScript("customscript_imr_archivo_pagos_txt"); //enlace a la script que contiene este archivo.
		form.addButton("custpage_create_fe_button", "Generar Archivo de Pagos", "GenerarArchivo()");
	}
}
//Evento que redirecciona al Suitlet
function GenerarArchivo()
{
	var TranId = nlapiGetRecordId();
	var TranType = nlapiGetRecordType();		
	var urlSuitelet = nlapiResolveURL("SUITELET", "customscript_imr_archivo_pagos_txt", "customdeploy_imr_archivo_pagos_txt");
	window.open(urlSuitelet +"&custparam_TranType=" + TranType+"&custparam_TranId=" + TranId);
	
}
//Funcion que genera el TXT
function GenerarArchivoTXT(request, response)
{	
	try
	{	
		var TranId	 	    = request.getParameter("custparam_TranId");
		var TranType 	    = request.getParameter("custparam_TranType");
		var vendorPayment 	= nlapiLoadRecord(TranType, TranId);
		var entityRec		= nlapiLoadRecord('vendor',vendorPayment.getFieldValue('entity'));
		var fc 				= vendorPayment.getFieldValue('trandate');
		var consecutivo		= vendorPayment.getFieldValue('custbody_consecutivo_archivo');
		if(consecutivo.length==1) { consecutivo = '000'+consecutivo;}
		if(consecutivo.length==2) { consecutivo = '00'+consecutivo;}
		if(consecutivo.length==3) { consecutivo = '0'+consecutivo;}
		var sucursalCte		= returnBlank(vendorPayment.getFieldValue('custentity13'));
		if(sucursalCte.length==1) { sucursalCte = '000'+sucursalCte;}
		if(sucursalCte.length==2) { sucursalCte = '00'+sucursalCte;}
		if(sucursalCte.length==3) { sucursalCte = '0'+sucursalCte;}
		var cuentaID 		= vendorPayment.getFieldValue('account');
		var RefNo 			= vendorPayment.getFieldValue('tranid'); 
		var nat_arc			= returnBlank(vendorPayment.getFieldText('custbody_naturaleza_archivo'));
		if(nat_arc != '')
		{
			nat_arc = nat_arc.split(' = ');
			nat_arc	= nat_arc[0];
		}
		else
		{
			nat_arc	= '00';
		}
		var importe 		= getNumber_16_2(parseFloat(vendorPayment.getFieldValue('total')));
		//var claveBancoAux	= parseFloat(entityRec.getFieldValue('custentity_ban_prov'));
		var claveBanco		= getVal(entityRec.getFieldValue('custentity_clave_banco_txt'));
		/*/
		if(claveBancoAux==1) { claveBanco = '0103'; }
		if(claveBancoAux==2) { claveBanco = '0000'; }
		if(claveBancoAux==3) { claveBanco = '0127'; }
		if(claveBancoAux==4) { claveBanco = '0021'; }
		if(claveBancoAux==5) { claveBanco = '0000'; }
		if(claveBancoAux==6) { claveBanco = '0012'; }
		if(claveBancoAux==7) { claveBanco = '0032'; }
		if(claveBancoAux==8) { claveBanco = '0106'; }
		if(claveBancoAux==9) { claveBanco = '0044'; }
		if(claveBancoAux==10) { claveBanco = '0014'; }
		if(claveBancoAux==11) { claveBanco = '0126'; }
		if(claveBancoAux==12) { claveBanco = '0000'; }
		if(claveBancoAux==14) { claveBanco = '0072'; }
		/*/
		var tipoCuentaAux = parseFloat(entityRec.getFieldValue('custentity_tipo_cuenta'));
		var tipoCuenta ='';
		var numCuenta ='';
		if(tipoCuentaAux == 5) 
		{ 
			numCuenta = getAccount_20((entityRec.getFieldValue('custentity13') + entityRec.getFieldValue('custentity_numcta')));
			tipoCuenta ='01';
		}
		if(tipoCuentaAux == 4) 
		{ 
			numCuenta = getAccount_20(entityRec.getFieldValue('custentity_numcta'));
			tipoCuenta ='15';
		}
		if(tipoCuentaAux == 3) 
		{ 
			numCuenta = getAccount_20(entityRec.getFieldValue('custentity_numcta'));
			tipoCuenta ='04'; 
		}
		if(tipoCuentaAux == 2) 
		{ 
			numCuenta = getAccount_20(entityRec.getFieldValue('custentity_numcta'));
			tipoCuenta ='03'; 
		}
		if(tipoCuentaAux == 1) 
		{ 
			numCuenta = getAccount_20(entityRec.getFieldValue('custentity_numcta'));
			tipoCuenta ='01'; 
		}
		var beneficiario 	= getNameBen(entityRec);
		var f = nlapiStringToDate(fc);
		var a  = f.getFullYear();
			a  = a.toString();
		    a  = a.slice(2,4);
		var m  = parseFloat(f.getMonth())+parseFloat(1);
		var d  = f.getDate();
		if(m<10) m= "0"+m;
		if(d<10) d= "0"+d;
		var fecha = d+'/'+m+'/'+a;
		    fecha = fecha.split('/');
		    fecha = fecha.join('');
		var sucursal = '';
		var cuenta   = '';
		if(cuentaID==137) 
		{
			sucursal = '0870';
			cuenta   = '00000000000000587305';
		}
		if(cuentaID==138)
		{
			sucursal='0197';
			cuenta   = '00000000000006034976';
		}
		var r1 = "1" + "000082282802" + fecha + consecutivo + "VORWERK MEXICO S DE RL DE CV        " +  "TEST                " + nat_arc  + "                                        " + "C" + "0" + "0"; 
		var r2 = "2" + "1" + "001" + importe + "01" + sucursal + cuenta + "                    ";
		var r3 = new String("");
		var lineas = vendorPayment.getLineItemCount('apply');
		var lineasAplicadas = 0;
		for(var cont=1 ; cont<=lineas;cont++)
		{
			if(vendorPayment.getLineItemValue('apply','apply',cont)=='T')
			{
				r3 += "3" + "0" + "001" + getNumber_16_2(parseFloat(vendorPayment.getLineItemValue('apply','amount',cont))) + tipoCuenta + numCuenta + getRef_40(vendorPayment.getLineItemValue('apply','refnum',cont),1,nat_arc) + beneficiario + getRef_40(vendorPayment.getLineItemValue('apply','refnum',cont),2,nat_arc) + "                        " + claveBanco + getRef7(vendorPayment.getLineItemValue('apply','refnum',cont)) + "00";
				/*/if(cont!=lineas) 
				 { 
				 	r3 += '\n\r'; lineasAplicadas++;
				 }
				/*/
				if(cont!=lineas || lineas == 1) 
				{
					r3 += String.fromCharCode(13) + String.fromCharCode(10); lineasAplicadas++;
				}
			}
		}
		if(lineasAplicadas!=0)
		{
			var r4 				= "4" + "001" + getNumAbo_6(lineasAplicadas) + importe + getNumAbo_6(lineasAplicadas) + importe;
			var fileContents 	= r1 + String.fromCharCode(13) + String.fromCharCode(10) + r2 + String.fromCharCode(13) + String.fromCharCode(10) + r3 + r4 + String.fromCharCode(13) + String.fromCharCode(10);
			var fileName 		= fecha+consecutivo+".txt";
			var file 			= nlapiCreateFile(fileName, "PLAINTEXT", fileContents);
			var fileValue		= file.getValue();
			nlapiLogExecution('ERROR', 'archivo generado' , 'archivo generado' );
			response.setContentType('PLAINTEXT', fileName, 'attachment');
			response.write(fileValue);
		}
	}
    catch(e)
    {
		var titleImpPoliza	= 'Generación de Archivo para Pagos de Banamex';
		var htmlError	 = "<html><body>";
    		htmlError	+= "<br>Ha ocurrido un error, la " + titleImpPoliza + " no se realizo debido a la siguiente raz&oacute;n:";  
				var imagen = nlapiLoadFile(221616);
				var url = imagen.getURL();
				var urls = url.split('&');
				var urlAux = '';
				urlAux = urls.join('&amp;');
				
        if ( e instanceof nlobjError )
        {
        	htmlError 		+= "<br><br>" + 'system error ' + '<br>' + e.getCode() + '<br>' + e.getDetails();
    		htmlError 		+= "<br><br>Consulte a Soporte T&eacute;cnico y mueste este mensaje.";
    		//htmlError 		+= "<br><br><a href=\"https://system.netsuite.com/core/media/media.nl?id=221616&amp;c=3367613&amp;h=23ee9c927673a76ad4d1&amp;_xt=.pdf\">Descargar <i>Layout C</i></a>";
				htmlError 		+= "<br><br><a href=\"" + urlAux + "\">Descargar <i>Layout C</i></a>";
    		htmlError 		+= "<br><br>Puede continuar navegando en NetSuite";
    		htmlError		 = encodeBase64(htmlError);
        	var ecode 		 = returnBlank(e.getCode());
        	var edetails 	 = returnBlank(e.getDetails());
        	var eid 		 = returnBlank(e.getId());
        	var einternalid	 = returnBlank(e.getInternalId());
        	var estacktrace	 = returnBlank(e.getStackTrace());
        	if(estacktrace != '')
        	{
        		estacktrace = estacktrace.join();
        	}
        	var euserevent 	 = returnBlank(e.getUserEvent());
            nlapiLogExecution( 'ERROR', 'ecode',ecode);
            nlapiLogExecution( 'ERROR', 'edetails',edetails);
            nlapiLogExecution( 'ERROR', 'eid',eid);
            nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
            nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
            var params_handler_error			= new Array();
            	params_handler_error['html']	= htmlError;
			nlapiSetRedirectURL('SUITELET','customscript_imr_archivo_pagos_txt_he', 'customdeploy_imr_archivo_pagos_txt_he', false, params_handler_error);
			nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
        }
        else
        {
    		htmlError += "<br><br>" + 'unexpected error ' + '<br>' + e.toString();
    		htmlError += "<br><br>Consulte a Soporte T&eacute;cnico y mueste este mensaje.";
    		//htmlError += "<br><br><a href=\"https://system.netsuite.com/core/media/media.nl?id=221616&amp;c=3367613&amp;h=23ee9c927673a76ad4d1&amp;_xt=.pdf\">Descargar <i>Layout C</i></a>";
				htmlError += "<br><br><a href=\"" + urlAux + "\">Descargar <i>Layout C</i></a>";
    		htmlError += "<br><br>Puede continuar navegando en NetSuite";
    		htmlError  = encodeBase64(htmlError);
            nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
            var params_handler_error			= new Array();
        		params_handler_error['html']	= htmlError;
    			nlapiSetRedirectURL('SUITELET','customscript_imr_archivo_pagos_txt_he', 'customdeploy_imr_archivo_pagos_txt_he', false, params_handler_error);
			nlapiLogExecution('ERROR', "redireccionado", "redireccionado");
        }
    }  
}
function validarDatosBancoProveedor()
{
	var tipoCuenta = parseFloat(nlapiGetFieldValue('custentity_tipo_cuenta'));
	if(tipoCuenta==1)
	{
		if(nlapiGetFieldValue('custentity_numcta').length!=18)
		{
			alert('El numero de digitos para \"Numero de Cuenta\" deben de ser 18.');
			return false;
		}
		else { return true; }
	}
	if(tipoCuenta==2)
	{
		if(nlapiGetFieldValue('custentity_numcta').length!=16)
		{
			alert('El numero de digitos para \"Numero de Cuenta\" deben de ser 16.');
			return false;
		}
		else { return true; }
	}
	if(tipoCuenta==5)
	{
		if(nlapiGetFieldValue('custentity13').length!=4 && nlapiGetFieldValue('custentity_numcta').length!=7)
		{
			alert('El numero de digitos para \"Surcursal\" deben de ser 4.\nEl numero de digitos para \"Numero de Cuenta\" deben de ser 7.');
			return false;
		}
		if(nlapiGetFieldValue('custentity13').length==4 && nlapiGetFieldValue('custentity_numcta').length!=7)
		{
			alert('El numero de digitos para \"Numero de Cuenta\" deben de ser 7.');
			return false;
		}
		if(nlapiGetFieldValue('custentity13').length!=4 && nlapiGetFieldValue('custentity_numcta').length==7)
		{
			alert('El numero de digitos para \"Surcursal\" deben de ser 4.');
			return false;
		}
		if(nlapiGetFieldValue('custentity13').length==4 && nlapiGetFieldValue('custentity_numcta').length==7)
		{
			return true;
		}
	}
	if(tipoCuenta!=5 || tipoCuenta!=2 || tipoCuenta!=1)
	{
		return true;
	}
}
function bloquearSucursalFielChange(type,name)
{
	if(name=='custentity_tipo_cuenta' && nlapiGetFieldValue('custentity_tipo_cuenta')==5)
	{
		nlapiDisableField('custentity13',false);
	}
	if(name=='custentity_tipo_cuenta' && nlapiGetFieldValue('custentity_tipo_cuenta')!=5)
	{
		nlapiDisableField('custentity13',true);
	}
}
function bloquearSucursalPageInit(type,name)
{
	if(nlapiGetFieldValue('custentity_tipo_cuenta')==5)
	{
		nlapiDisableField('custentity13',false);
	}
	if(nlapiGetFieldValue('custentity_tipo_cuenta')!=5)
	{
		nlapiDisableField('custentity13',true);
	}
}
