function beforeSubmit(type)
{
	try
	{
		if(type == 'delete')
		{
		    var salesorder		= returnBlank(nlapiGetFieldValue('custbody_transaccion_realacionada'));
			if(salesorder != '')
			{
				var dataFile	= nlapiLoadFile(266788);
					dataFile	= dataFile.getValue();				
				var dataXML		= nlapiStringToXML(dataFile);
				var dataXMLNode	= nlapiSelectNode(dataXML, '//PagosBorrados');
				var _empleado	= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PagosBorrados/custpage_empleado')));
				var _para		= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PagosBorrados/custpage_para')));
				var _cc			= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PagosBorrados/custpage_cc')));
				var _bcc		= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PagosBorrados/custpage_bcc')));
				var _asunto		= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PagosBorrados/custpage_asunto')));
			    var _mensaje	= decodeBase64(returnBlank(nlapiSelectValue(dataXMLNode, '//PagosBorrados/custpage_mensaje')));
			    var context		= nlapiGetContext();
			    var user		= context.getUser();
			    var userName	= context.getName();
			    var tranid		= nlapiGetFieldValue('tranid');
			    var trandate	= nlapiGetFieldValue('trandate');
			    var url			= nlapiResolveURL('RECORD', 'salesorder', salesorder, false);
			    var urlTag		= '<a href="url">Aquí</a>';
			    	urlTag		= urlTag.replace("url",url);
			    _mensaje		= _mensaje.split('[user]');
			    _mensaje		= _mensaje.join(userName);
			    _mensaje		= _mensaje.split('[tranid]');
			    _mensaje		= _mensaje.join(tranid);
			    _mensaje		= _mensaje.split('[trandate]');
			    _mensaje		= _mensaje.join(trandate);
			    _mensaje		= _mensaje.split('[salesorder]');
			    _mensaje		= _mensaje.join(salesorder);
			    _mensaje		= _mensaje.split('[url]');
			    _mensaje		= _mensaje.join(urlTag);
			    _para			= _para.split('USER');
			    _para			= _para.join(user);
			    if(_cc == '')
			    {
			    	_cc = null;
			    }
			    else
			    {
			    	_cc = stringToArray(_cc,44);	
			    }
			    if(_bcc == '')
			    {
			    	_bcc = null;
			    }
			    else
			    {
			    	_bcc = stringToArray(_bcc,44);
			    }
			    nlapiSendEmail(_empleado, _para, _asunto, _mensaje, _cc, _bcc,null,null);
			}
		}
	}
    catch(e)
    {
    	var context				= nlapiGetContext();
    	var company				= returnBlank(context.getCompany());
    	var deploymentId		= returnBlank(context.getDeploymentId());
    	var environment			= returnBlank(context.getEnvironment());
    	var executionContext	= returnBlank(context.getExecutionContext());
    	var logLevel			= returnBlank(context.getLogLevel());
    	var name				= returnBlank(context.getName());
    	var scriptId			= returnBlank(context.getScriptId());
    	var user				= returnBlank(context.getUser());
    	var body 				= '';
    		body 			   += 'company: ' 			+ company 			+ '<br>';
    		body 			   += 'deploymentId: ' 		+ deploymentId 		+ '<br>';
    		body 			   += 'environment: ' 		+ environment 		+ '<br>';
    		body 			   += 'executionContext: ' 	+ executionContext 	+ '<br>';
    		body 			   += 'logLevel: ' 			+ logLevel 			+ '<br>';
    		body 			   += 'name: ' 				+ name 				+ '<br>';
    		body 			   += 'user: ' 				+ user 				+ '<br>';
    		body 			   += 'scriptId: ' 			+ scriptId 			+ '<br>';
    		body 			   += '<br>';
    		body 			   += '---';
    		body 			   += '<br>';
    		body 			   += '<br>';
        if ( e instanceof nlobjError )
        {
        	var ecode 		 = returnBlank(e.getCode());
        	var edetails 	 = returnBlank(e.getDetails());
        	var eid 		 = returnBlank(e.getId());
        	var einternalid	 = returnBlank(e.getInternalId());
        	var estacktrace	 = returnBlank(e.getStackTrace());
        	if(estacktrace != '')
        	{
        		estacktrace	 = estacktrace.join();
        	}
        	var euserevent 	 = returnBlank(e.getUserEvent());
            nlapiLogExecution( 'ERROR', 'ecode',ecode);
            nlapiLogExecution( 'ERROR', 'edetails',edetails);
            nlapiLogExecution( 'ERROR', 'eid',eid);
            nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
            nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
            nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
        	body += 'ecode: ' 		+ ecode 		+ '<br>';
        	body += 'edetails: ' 	+ edetails		+ '<br>';
        	body += 'eid: ' 		+ eid			+ '<br>';
        	body += 'einternalid: ' + einternalid	+ '<br>';
        	body += 'estacktrace: ' + estacktrace	+ '<br>';
        	body += 'euserevent: ' 	+ euserevent	+ '<br>'; 	
            nlapiSendEmail(3639, 3639, 'e instanceof nlobjError', body, null, null, null, null);
        }
        else
        {
            nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
        	body += 'unexpected error: ' 	+  e.toString()	+ '<br>';
            nlapiSendEmail(3639, 3639, 'unexpected error', body, null, null, null, null);
        }
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
//
function stringToArray(str,base)
{
     var multiSelectStringArray = str.split(String.fromCharCode(base));
     return multiSelectStringArray;
}