function saveRecord(type)
{
	var _empleado_email	= returnBlank(nlapiGetFieldValue('custpage_empleado_email'));
	if(_empleado_email !='')
	{
		var checked = confirm('Esta a punto de guardar la configuración, esto hará que la configuración anterior se pierda, esta acción no se puede deshacer.\n\n¿Desea continuar?');
	    if (checked == true) 
	    {
	        return true;
	    }
	    else 
	    {
	        return false;
	    }
	}
	else
	{
		alert('No permitido, proporcione un valor para \"Correo Electrónico\", verifique.');
		return false;
	}
}
function fieldChanged(type,name,linenum)
{
	if(name == 'custpage_empleado')
	{
		var _empleado			= returnBlank(nlapiGetFieldValue('custpage_empleado'));
		if(_empleado != '')
		{
	        var _empleado_email	= '';
	        var filters			= new Array();
	        	filters[0]		= new nlobjSearchFilter('internalid', null, 'is', _empleado);
	        var columns			= new Array();
	        	columns[0]		= new nlobjSearchColumn('email', null, null);
	        	columns[1]		= new nlobjSearchColumn('firstname', null, null);
	        	columns[2]		= new nlobjSearchColumn('middlename', null, null);
	        	columns[3]		= new nlobjSearchColumn('lastname', null, null);
	        var employeeSearch	= returnBlank(nlapiSearchRecord('employee', null, filters, columns));
	        if(employeeSearch != '')
	        {
	        	_empleado_email 	= returnBlank(employeeSearch[0].getValue('email'));
	        	nlapiSetFieldValue('custpage_empleado_email', _empleado_email, null,null);
	        }
		}
		else
		{
			nlapiSetFieldValue('custpage_empleado_email', '', null,null);
		}
	}
}
//--- Helpers ---
function returnBlank(value)
{	
	if (value == null)
	{
		return '';
	}
	else
	{
		return value;
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