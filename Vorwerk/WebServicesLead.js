function WebServicesLead(request, response)
{
	var Base64		= new MainBase64();
	var respuesta	= new Object();
	var internalid	= 0;
	try
	{
		var data 		= returnBlank(request.getParameter('data'));
		if(data != '')
		{
			data 			= Base64.decode(data);
			var leadObject 	= JSON.parse(data);
			var valor 		= new Array();
			var campo 		= new Array();
			for(var key in leadObject)
			{
				valor.push(leadObject[key]);
				campo.push(key);			
			}
			var leadRecord = nlapiCreateRecord('lead');
			for(var i=0; i<campo.length; i++)
			{
				leadRecord.setFieldValue(campo[i], valor[i]);
			}
			internalid 			= nlapiSubmitRecord(leadRecord);
			respuesta.code 		= 0;
			respuesta.message	= "Lead was successfully created!, internalid: " + internalid;
			respuesta 			= JSON.stringify(respuesta);
			respuesta			= Base64.encode(respuesta);
			response.write(respuesta);	
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
	  	var role				= returnBlank(context.getRole());
	  	var roleCenter			= returnBlank(context.getRoleCenter());
	  	var roleId				= returnBlank(context.getRoleId());
	  	var scriptId			= returnBlank(context.getScriptId());
	  	var user				= returnBlank(context.getUser());
	  	var author				= 3639;
	  	var recipient			= 3639;
	  	var subject				= '';
	  	var body 				= '';
  			body 			   += '<table>';
  				body 			   += '<tr><td><b>' + 'Company' 			+ '</b></td><td>&nbsp;</td><td>' + company 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record Type' 		+ '</b></td><td>&nbsp;</td><td>' + 'lead'			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record ID' 			+ '</b></td><td>&nbsp;</td><td>' + internalid 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Script ID' 			+ '</b></td><td>&nbsp;</td><td>' + scriptId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Deployment ID' 		+ '</b></td><td>&nbsp;</td><td>' + deploymentId 	+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Log Level' 			+ '</b></td><td>&nbsp;</td><td>' + logLevel 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Environment' 		+ '</b></td><td>&nbsp;</td><td>' + environment 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Execution Context' 	+ '</b></td><td>&nbsp;</td><td>' + executionContext + '</td></tr>';
  				body 			   += '<tr><td><b>' + 'User' 				+ '</b></td><td>&nbsp;</td><td>' + user 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Name' 				+ '</b></td><td>&nbsp;</td><td>' + name 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role' 				+ '</b></td><td>&nbsp;</td><td>' + role 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role Center' 		+ '</b></td><td>&nbsp;</td><td>' + roleCenter		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role ID' 			+ '</b></td><td>&nbsp;</td><td>' + roleId 			+ '</td></tr>';
  			body 			   += '</table>';
	  		body 			   += '<br>';
	  		body 			   += '<br>';
	  	if( e instanceof nlobjError )
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
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
			respuesta.code 				= 10;
			respuesta.message			= "Lead was NOT created!";
			respuesta.error				= new Object();
			respuesta.error.code		= ecode;
			respuesta.error.details		= edetails;
			respuesta.error.id			= eid;
			respuesta.error.intenalid	= einternalid;
			respuesta.error.stactrace	= estacktrace;
			respuesta.error.event		= euserevent;
		}
	    else
	    {
	    	var errorString	 = e.toString();
	    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);   
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
			respuesta.code 				= 20;
			respuesta.message			= "Lead was NOT created!";
			respuesta.error				= new Object();
			respuesta.error.code		= "unexpected error";
			respuesta.error.details		= errorString;
			respuesta.error.id			= "";
			respuesta.error.intenalid	= "";
			respuesta.error.stactrace	= "";
			respuesta.error.event		= "";
        }
		respuesta 			= JSON.stringify(respuesta);
		respuesta			= Base64.encode(respuesta);
		response.write(respuesta);
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
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
//---
function MainBase64()
{
	var Base64 = new Object();
		Base64 =
		{
		    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
		    encode 	: function (input) 
			{
		        var output 	= "";
				var chr1	= "";
				var chr2	= "";
				var chr3 	= "";
				var enc1	= "";
				var enc2	= "";
				var enc3	= "";
				var enc4 	= "";
				var i 		= 0;
		        input 		= Base64._utf8_encode(input);
		        while (i < input.length) 
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
		            }
		            else if (isNaN(chr3)) 
		            {
		                enc4 = 64;
		            }
		            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		        }
		        return output;
		    },
		    decode  : function (input) 
		    {
		        var output 	= "";
				var chr1	= "";
				var chr2	= "";
				var chr3 	= "";
				var enc1	= "";
				var enc2	= "";
				var enc3	= "";
				var enc4 	= "";
				var i 		= 0;
		        input 		= input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		        while (i < input.length) 
		        {
		            enc1 	= this._keyStr.indexOf(input.charAt(i++));
		            enc2 	= this._keyStr.indexOf(input.charAt(i++));
		            enc3 	= this._keyStr.indexOf(input.charAt(i++));
		            enc4 	= this._keyStr.indexOf(input.charAt(i++));
		            chr1 	= (enc1 << 2) | (enc2 >> 4);
		            chr2 	= ((enc2 & 15) << 4) | (enc3 >> 2);
		            chr3 	= ((enc3 & 3) << 6) | enc4;
		            output 	= output + String.fromCharCode(chr1);
		            if (enc3 != 64) 
		            {
		                output = output + String.fromCharCode(chr2);
		            }
		            if (enc4 != 64) 
		            {
		                output = output + String.fromCharCode(chr3);
		            }
		        }
		        output = Base64._utf8_decode(output);
		        return output;
		    },
		    _utf8_encode : function (string) 
		    {
		        string 		= string.replace(/\r\n/g,"\n");
		        var utftext = "";
		        for (var n = 0; n < string.length; n++) 
		        {
		            var c = string.charCodeAt(n);
		            if (c < 128) 
		            {
		                utftext += String.fromCharCode(c);
		            }
		            else if((c > 127) && (c < 2048))
		            {
		                utftext += String.fromCharCode((c >> 6) | 192);
		                utftext += String.fromCharCode((c & 63) | 128);
		            }
		            else 
		            {
		                utftext += String.fromCharCode((c >> 12) | 224);
		                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
		                utftext += String.fromCharCode((c & 63) | 128);
		            }
		        }
		        return utftext;
		    },
		    _utf8_decode : function (utftext) 
		    {
		        var string 	= "";
		        var i 		= 0;
		        var c 		= 0;
		        var c2 		= 0;
		        while ( i < utftext.length ) 
		        {
		            c = utftext.charCodeAt(i);
		            if (c < 128) 
		            {
		                string += String.fromCharCode(c);
		                i++;
		            }
		            else if((c > 191) && (c < 224)) 
		            {
		                c2 		 = utftext.charCodeAt(i+1);
		                string  += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
		                i 		+= 2;
		            }
		            else 
		            {
		                c2 		 = utftext.charCodeAt(i+1);
		                c3 		 = utftext.charCodeAt(i+2);
		                string  += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
		                i 		+= 3;
		            }
		        }
		        return string;
		    }
		};
	return Base64;
}