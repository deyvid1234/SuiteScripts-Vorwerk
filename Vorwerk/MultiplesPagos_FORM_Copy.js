function MultiplesPagos_PageInit(type)
{
	try
	{
		if(type == 'copy')
		{
			nlapiSetFieldValue('custbody_fe_metodo_de_pago', '', false,false);
			nlapiSetFieldValue('custbody_fe_num_cuenta', '', false,false);
		}
		nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_forma_tipo_de_pago', false);
		nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_pago', true);
		nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_tarjeta', true);
		nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_vencimiento', true);
		nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_autorizacion', true);
		nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_importe', true);
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_SaveRecord()
{
	try
	{
		/*/
		var returnedData = clientProcesarPagos();
		if(returnedData[0]==true)
		{
			var _fe_metodo_de_pago 	= returnedData[3];
			var _fe_num_cuenta	 	= returnedData[4];
			nlapiSetFieldValue('custbody_fe_metodo_de_pago', _fe_metodo_de_pago, false,false);
			nlapiSetFieldValue('custbody_fe_num_cuenta', _fe_num_cuenta, false,false);
            return true;
        }
        else
        {
            return false;
        }
        /*/
		return true;
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_ValidateField(type, name, linenum)
{
	try
	{
		if(name == 'custpage_fecha_pago')
		{
			var _fecha_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_pago'));
			if(_fecha_pago != '')
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_pago','T',false,false);
				return true;
			}
			else
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_pago','F',false,false);
				return false;
			}
		}
		/*if(name == 'custpage_importe')
		{
			var _cantidad = returnNumber(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_importe'));
			if(_cantidad > 0)
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_importe','T',false,false);
				return true;
			}
			else
			{
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_importe','F',false,false);
				return false;
			}
		}*/
		/*if(name == 'custpage_num_tarjeta')
		{
			var mensaje				= '';
			var _forma_tipo_de_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
			if(_forma_tipo_de_pago != '')
			{
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('internalid',null,'is',_forma_tipo_de_pago));
				var searchFormaTipoDePago	= returnBlank(nlapiSearchRecord('customrecord_forma_tipo_de_pago', 'customsearch_forma_tipo_de_pago', filters, null));
				if(searchFormaTipoDePago != '')
				{
					//var _banco				= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_banco'));
					//var _cuenta_bancaria	= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_cuenta_bancaria'));
					var _val_long_tarjeta	= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_long_tarjeta'));
					var _long_tarjeta		= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_tarjeta'));
					//var _val_fec_venc		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_fec_venc'));
					//var _val_num_aut		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_num_aut'));
					//var _long_autorizacion	= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_autorizacion'));
					if(_val_long_tarjeta == 'T')
					{
						var _num_tarjeta			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta'));
						if(_num_tarjeta != '')
						{
							var _num_tarjetaL			= _num_tarjeta.length;
							var charNonNumbers			= new Array();
							var charNumbers				= new Array();
							var diplayNonNumbersAlert	= new Boolean();
							for(var i=0;i<_num_tarjetaL;i++)
							{
								var unicode	= returnNumber(_num_tarjeta.charCodeAt(i));
								var char	= returnBlank(_num_tarjeta.charAt(i));
								if(unicode >= 48 && unicode <= 57)
								{
									charNumbers.push(char);
								}
								else
								{
									if(unicode != 42)
									{
										charNonNumbers.push(char);
										diplayNonNumbersAlert = true;
									}
								}
							}
							if(diplayNonNumbersAlert == false)
							{
								var digiFalt		= _long_tarjeta - _num_tarjetaL;
								var sufijoDigiFalt	= '';
								if(digiFalt <0)
								{
									sufijoDigiFalt	= 'sobra(n)';	
								}
								else
								{
									sufijoDigiFalt	= 'falta(n)';
								}
		                        if(_num_tarjetaL != _long_tarjeta)
		                        {
		                           mensaje         = 'Ha capturado ' + _num_tarjetaL + ' digitos, ' + sufijoDigiFalt + ' ' + Math.abs(digiFalt) + ' ,verfique.';
		                           alert(mensaje);
		                           nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
		                           return false;
		                        }
		                        else
		                        {
		                        	nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','T',false,false);
		                        	return true;
		                        }
							}
							else
							{
								mensaje         = 'Ha capturado los siguientes caracteres no válidos: ' + charNonNumbers + ' ,verfique.';
								alert(mensaje);
								nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
								return false;
							}
						}
						else
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
							return true;
						}
					}
					else
					{
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
						return true;
					}
				}
			}
		}*/
		if(name == 'custpage_fecha_vencimiento')
		{
			var mensaje				= '';
			var _forma_tipo_de_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
			if(_forma_tipo_de_pago != '')
			{
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('internalid',null,'is',_forma_tipo_de_pago));
				var searchFormaTipoDePago	= returnBlank(nlapiSearchRecord('customrecord_forma_tipo_de_pago', 'customsearch_forma_tipo_de_pago', filters, null));
				if(searchFormaTipoDePago != '')
				{
					//var _banco				= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_banco'));
					//var _cuenta_bancaria	= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_cuenta_bancaria'));
					//var _val_long_tarjeta	= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_long_tarjeta'));
					//var _long_tarjeta		= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_tarjeta'));
					var _val_fec_venc		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_fec_venc'));
					//var _val_num_aut		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_num_aut'));
					//var _long_autorizacion	= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_autorizacion'));
					if(_val_fec_venc == 'T')
					{
						var _fecha_vencimiento			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento'));
						if(_fecha_vencimiento != '')
						{
							var MM 		= returnNumber(_fecha_vencimiento.substring(0,2));
							var SEP		= returnBlank(_fecha_vencimiento.substring(2,3));
							var AAAA 	= returnNumber(_fecha_vencimiento.substring(3,7));
							var MMb		= new Boolean(MM >= 1 && MM <= 12);
							var SEPb	= new Boolean(SEP == '/');
							var AAAAb	= new Boolean(AAAA >=1990 && AAAA <=9999);
							if((MMb == true) && (SEPb == true) && (AAAAb == true))
							{
								nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','T',false,false);
								return true;
							}
							else
							{
								mensaje		= 'Formato inválido, recuerde que el formato es MM/AAAA\n';
								if(MMb == false)
								{
									mensaje	+= '\nEl mes ' + MM + ' no existe.'; 
								}
								if(SEPb == false)
								{
									mensaje	+= '\nEl separador es \"/\"'; 
								}
								if(AAAAb == false)
								{
									mensaje	+= '\n¿De verdad la terjeta vence en ' + AAAA + '?'; 
								}
								alert(mensaje);
								nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','F',false,false);
								return false;
							}
						}
						else
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','F',false,false);
							return true;
						}
					}
					else
					{
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','F',false,false);
						return true;
					}
				}
			}
		}
		/*if(name == 'custpage_num_autorizacion')
		{
			var mensaje				= '';
			var _forma_tipo_de_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
			if(_forma_tipo_de_pago != '')
			{
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('internalid',null,'is',_forma_tipo_de_pago));
				var searchFormaTipoDePago	= returnBlank(nlapiSearchRecord('customrecord_forma_tipo_de_pago', 'customsearch_forma_tipo_de_pago', filters, null));
				if(searchFormaTipoDePago != '')
				{
					//var _banco				= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_banco'));
					//var _cuenta_bancaria	= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_cuenta_bancaria'));
					//var _val_long_tarjeta	= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_long_tarjeta'));
					//var _long_tarjeta		= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_tarjeta'));
					//var _val_fec_venc		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_fec_venc'));
					var _val_num_aut		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_num_aut'));
					var _long_autorizacion	= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_autorizacion'));
					if(_val_num_aut == 'T')
					{
						var _num_autorizacion			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_autorizacion'));
						if(_num_autorizacion != '')
						{
							var filters 			= new Array();
								filters.push(new nlobjSearchFilter('custbody_numero_autorizacion', null, 'is', _num_autorizacion));
								filters.push(new nlobjSearchFilter('trandate', null, 'onorafter', 'daysago30')); 
							var searchResults 		= returnBlank(nlapiSearchRecord('customerpayment', 'customsearch_multiples_pagos_form', filters, null));
							if(searchResults.length > 0)
							{
								mensaje         = 'El \"Num. de Autorizacion\" capturado ' + _num_autorizacion + ' ya ha sido utilizado anteriormente, verfique.';
								alert(mensaje);
								return false;
							}
							else
							{
								var _num_autorizacionL		= _num_autorizacion.length;
								if(_num_autorizacionL == _long_autorizacion)
								{
									nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','T',false,false);
									return true;
								}
								else
								{
									var digiFalt		= _long_autorizacion - _num_autorizacionL;
									var sufijoDigiFalt	= '';
									if(digiFalt <0)
									{
										sufijoDigiFalt	= 'sobra(n)';	
									}
									else
									{
										sufijoDigiFalt	= 'falta(n)';
									}
									mensaje         = 'Ha capturado ' + _num_autorizacionL + ' caracteres, ' + sufijoDigiFalt + ' ' + Math.abs(digiFalt) + ' ,verfique.';
									alert(mensaje);
									nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','F',false,false);
									return false; //Changed false to true
								}
							}
						}
						else
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','F',false,false);
							return true;
						}
					}
					else
					{
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','F',false,false);
						return true;
					}
				}
			}
		}*/
		return true;
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_FieldChanged(type, name, linenum)
{
	try
	{
		if(name == 'custpage_forma_tipo_de_pago')
		{
			var _forma_tipo_de_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
			if(_forma_tipo_de_pago != '')
			{
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('internalid',null,'is',_forma_tipo_de_pago));
				var searchFormaTipoDePago	= returnBlank(nlapiSearchRecord('customrecord_forma_tipo_de_pago', 'customsearch_forma_tipo_de_pago', filters, null));
				if(searchFormaTipoDePago != '')
				{
					var _fecha_pago 		= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_fecha_pago'));
					var _num_tarjeta 		= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_num_tarjeta'));
					var _fecha_vencimiento 	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_fecha_vencimiento'));
					var _num_autorizacion 	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_num_autorizacion'));
					var _importe 			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_importe'));					
					//var _banco			= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_banco'));
					var _cuenta_bancaria	= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_cuenta_bancaria'));
					var _metodo_pago		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_metodo_pago'));
					var _metodo_pago_text	= returnFalse(searchFormaTipoDePago[0].getText('custrecord_ref_pago_metodo_pago'));
					var _num_cuenta			= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_num_cuenta'));
					var _val_long_tarjeta	= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_long_tarjeta'));
					//var _long_tarjeta		= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_tarjeta'));
					var _val_fec_venc		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_fec_venc'));
					var _val_num_aut		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_num_aut'));
					nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_forma_tipo_de_pago','T',false,false);
					nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_cuenta',_cuenta_bancaria,false,false);
					nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago_metodo_pago',_metodo_pago,false,false);
					nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago_metodo_pago_text',_metodo_pago_text,false,false);
					nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago_num_cuenta',_num_cuenta,false,false);
					nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_pago', false);
					if(_fecha_pago == '')
					{
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_pago','F',false,false);
					}
					nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_importe', false);
					if(_importe == '')
					{
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_importe','F',false,false);
					}
					if(_val_long_tarjeta == 'T')
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_tarjeta', false);
						if(_num_tarjeta == '')
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
						}
					}
					else
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_tarjeta', true);
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta','',false,false);
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','T',false,false);
					}
					if(_val_fec_venc == 'T')
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_vencimiento', false);
						if(_fecha_vencimiento == '')
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','F',false,false);
						}
					}
					else
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_vencimiento', true);
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento','',false,false);
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','T',false,false);
					}
					if(_val_num_aut == 'T')
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_autorizacion', false);
						if(_num_autorizacion == '')
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','F',false,false);
						}
					}
					else
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_autorizacion', true);
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_num_autorizacion','',false,false);
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','T',false,false);
					}
				}
			}
			else
			{
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_forma_tipo_de_pago', false);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_pago', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_tarjeta', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_vencimiento', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_autorizacion', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_importe', true);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_val_ok_forma_tipo_de_pago','F',false,false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_forma_tipo_de_pago', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_cuenta','',false,false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_forma_tipo_de_pago_metodo_pago','',false,false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_forma_tipo_de_pago_metodo_pago_text','',false,false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_forma_tipo_de_pago_num_cuenta','',false,false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_fecha_pago', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_num_tarjeta', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_fecha_vencimiento', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_num_autorizacion', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_importe', '', false, false);
			}
		}
		if(name == 'custpage_num_autorizacion')
		{
			var mensaje				= '';
			var _forma_tipo_de_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
			if(_forma_tipo_de_pago != '')
			{
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('internalid',null,'is',_forma_tipo_de_pago));
				var searchFormaTipoDePago	= returnBlank(nlapiSearchRecord('customrecord_forma_tipo_de_pago', 'customsearch_forma_tipo_de_pago', filters, null));
				if(searchFormaTipoDePago != '')
				{
					//var _banco				= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_banco'));
					//var _cuenta_bancaria	= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_cuenta_bancaria'));
					//var _val_long_tarjeta	= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_long_tarjeta'));
					//var _long_tarjeta		= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_tarjeta'));
					//var _val_fec_venc		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_fec_venc'));
					var _val_num_aut		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_num_aut'));
					var _long_autorizacion	= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_autorizacion'));
					if(_val_num_aut == 'T')
					{
						var _num_autorizacion			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_autorizacion'));
						if(_num_autorizacion != '')
						{
							var filters 			= new Array();
								filters.push(new nlobjSearchFilter('custbody_numero_autorizacion', null, 'is', _num_autorizacion));
								filters.push(new nlobjSearchFilter('trandate', null, 'onorafter', 'daysago30')); 
							var searchResults 		= returnBlank(nlapiSearchRecord('customerpayment', 'customsearch_multiples_pagos_form', filters, null));
							if(searchResults.length > 0)
							{
								mensaje         = 'El \"Num. de Autorizacion\" capturado ' + _num_autorizacion + ' ya ha sido utilizado anteriormente, verfique.';
								alert(mensaje);
								return false;
							}
							else
							{
								var _num_autorizacionL		= _num_autorizacion.length;
								if(_num_autorizacionL == _long_autorizacion)
								{
									nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','T',false,false);
									return true;
								}
								else
								{
									var digiFalt		= _long_autorizacion - _num_autorizacionL;
									var sufijoDigiFalt	= '';
									if(digiFalt <0)
									{
										sufijoDigiFalt	= 'sobra(n)';	
									}
									else
									{
										sufijoDigiFalt	= 'falta(n)';
									}
									mensaje         = 'Ha capturado ' + _num_autorizacionL + ' caracteres, ' + sufijoDigiFalt + ' ' + Math.abs(digiFalt) + ' ,verfique.';
									alert(mensaje);
									nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','T',true,false);
									return true; //Changed false to true
								}
							}
						}
						else
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','F',false,false);
							return true;
						}
					}
					else
					{
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','F',false,false);
						return true;
					}
				}
			}
		}
		if(name == 'custpage_num_tarjeta')
		{
			var mensaje				= '';
			var _forma_tipo_de_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
			if(_forma_tipo_de_pago != '')
			{
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('internalid',null,'is',_forma_tipo_de_pago));
				var searchFormaTipoDePago	= returnBlank(nlapiSearchRecord('customrecord_forma_tipo_de_pago', 'customsearch_forma_tipo_de_pago', filters, null));
				if(searchFormaTipoDePago != '')
				{
					//var _banco				= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_banco'));
					//var _cuenta_bancaria	= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_cuenta_bancaria'));
					var _val_long_tarjeta	= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_long_tarjeta'));
					var _long_tarjeta		= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_tarjeta'));
					//var _val_fec_venc		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_fec_venc'));
					//var _val_num_aut		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_num_aut'));
					//var _long_autorizacion	= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_autorizacion'));
					if(_val_long_tarjeta == 'T')
					{
						var _num_tarjeta			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta'));
						if(_num_tarjeta != '')
						{
							var _num_tarjetaL			= _num_tarjeta.length;
							var charNonNumbers			= new Array();
							var charNumbers				= new Array();
							var diplayNonNumbersAlert	= new Boolean();
							for(var i=0;i<_num_tarjetaL;i++)
							{
								var unicode	= returnNumber(_num_tarjeta.charCodeAt(i));
								var char	= returnBlank(_num_tarjeta.charAt(i));
								if(unicode >= 48 && unicode <= 57)
								{
									charNumbers.push(char);
								}
								else
								{
									if(unicode != 42)
									{
										charNonNumbers.push(char);
										diplayNonNumbersAlert = true;
									}
								}
							}
							if(diplayNonNumbersAlert == false)
							{
								var digiFalt		= _long_tarjeta - _num_tarjetaL;
								var sufijoDigiFalt	= '';
								if(digiFalt <0)
								{
									sufijoDigiFalt	= 'sobra(n)';	
								}
								else
								{
									sufijoDigiFalt	= 'falta(n)';
								}
		                        if(_num_tarjetaL != _long_tarjeta)
		                        {
		                           mensaje         = 'Ha capturado ' + _num_tarjetaL + ' digitos, ' + sufijoDigiFalt + ' ' + Math.abs(digiFalt) + ' ,verfique.';
		                           alert(mensaje);
		                           nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
		                           return false;
		                        }
		                        else
		                        {
		                        	nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','T',false,false);
		                        	return true;
		                        }
							}
							else
							{
								mensaje         = 'Ha capturado los siguientes caracteres no válidos: ' + charNonNumbers + ' ,verfique.';
								alert(mensaje);
								nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
								return false;
							}
						}
						else
						{
							nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
							return true;
						}
					}
					else
					{
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
						return true;
					}
				}
			}
		}
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_LineInit(type) 
{
	try
	{
		if(type == 'custpage_datos_pagos')
		{
			var _forma_tipo_de_pago = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
			if(_forma_tipo_de_pago != '')
			{
				var filters 				= new Array();
					filters.push(new nlobjSearchFilter('internalid',null,'is',_forma_tipo_de_pago));
				var searchFormaTipoDePago	= returnBlank(nlapiSearchRecord('customrecord_forma_tipo_de_pago', 'customsearch_forma_tipo_de_pago', filters, null));
				if(searchFormaTipoDePago != '')
				{
					//var _banco				= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_banco'));
					//var _cuenta_bancaria	= returnBlank(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_cuenta_bancaria'));
					var _val_long_tarjeta	= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_long_tarjeta'));
					//var _long_tarjeta		= returnNumber(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_long_tarjeta'));
					var _val_fec_venc		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_fec_venc'));
					var _val_num_aut		= returnFalse(searchFormaTipoDePago[0].getValue('custrecord_ref_pago_val_num_aut'));
					nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_forma_tipo_de_pago','T',false,false);
					nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_pago', false);
					//nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_pago','F',false,false);
					nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_importe', false);
					//nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_importe','F',false,false);
					if(_val_long_tarjeta == 'T')
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_tarjeta', false);
						//nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','F',false,false);
					}
					else
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_tarjeta', true);
						//nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_tarjeta','T',false,false);
					}
					if(_val_fec_venc == 'T')
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_vencimiento', false);
						//nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','F',false,false);
					}
					else
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_vencimiento', true);
						nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_fecha_vencimiento','T',false,false);
					}
					if(_val_num_aut == 'T')
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_autorizacion', false);
						//nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','F',false,false);
					}
					else
					{
						nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_autorizacion', true);
						//nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_num_autorizacion','T',false,false);
					}
				}
			}
			else
			{
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_forma_tipo_de_pago', false);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_pago', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_tarjeta', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_fecha_vencimiento', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_num_autorizacion', true);
				nlapiDisableLineItemField('custpage_datos_pagos', 'custpage_importe', true);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_forma_tipo_de_pago','F',false,false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_forma_tipo_de_pago', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_fecha_pago', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_num_tarjeta', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_fecha_vencimiento', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_num_autorizacion', '', false, false);
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_importe', '', false, false);
			}
		}
        else
        {
            return true;    
        }
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_ValidateLine(type)
{
	try
	{
		if(type == 'custpage_datos_pagos')
		{
			var mensaje						= new String();
			var mensajeFields				= new Array();
			var _val_ok_forma_tipo_de_pago	= returnFalse(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_val_ok_forma_tipo_de_pago'));
			var _val_ok_fecha_pago			= returnFalse(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_val_ok_fecha_pago'));
			var _val_ok_num_tarjeta			= returnFalse(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_val_ok_num_tarjeta'));
			var _val_ok_fecha_vencimiento	= returnFalse(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_val_ok_fecha_vencimiento'));
			var _val_ok_num_autorizacion	= returnFalse(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_val_ok_num_autorizacion'));
			var _val_ok_importe				= returnFalse(nlapiGetCurrentLineItemValue('custpage_datos_pagos', 'custpage_val_ok_importe'));
			if((_val_ok_forma_tipo_de_pago == 'T') && (_val_ok_fecha_pago == 'T') && (_val_ok_num_tarjeta == 'T') && (_val_ok_fecha_vencimiento == 'T') && (_val_ok_num_autorizacion == 'T') && (_val_ok_importe == 'T'))
			{
				var _num_linea	= nlapiGetCurrentLineItemIndex('custpage_datos_pagos');
				nlapiSetCurrentLineItemValue('custpage_datos_pagos', 'custpage_num_linea', _num_linea, false,false);
				return true;
			}
			else
			{
				mensaje	+= 'Introduzca valores para:\n\n';
				if(_val_ok_forma_tipo_de_pago == 'F')
				{
					mensajeFields.push('\"Forma/Tipo de Pago\"');
				}
				if(_val_ok_fecha_pago == 'F')
				{
					mensajeFields.push('\"Fecha del Pago\"');
				}
				if(_val_ok_num_tarjeta == 'F')
				{
					mensajeFields.push('\"Num. de la Tarjeta\"');
				}
				if(_val_ok_fecha_vencimiento == 'F')
				{
					mensajeFields.push('\"Fecha de Vencimiento\"');
				}
				if(_val_ok_num_autorizacion == 'F')
				{
					mensajeFields.push('\"Num. de Autorización\"');
				}
				if(_val_ok_importe == 'F')
				{
					mensajeFields.push('\"Importe\"');
				}
				mensaje	+= mensajeFields.join(String.fromCharCode(10));
				alert(mensaje);
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
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_ValidateInsert(type)
{
	try
	{
        if(type=='custpage_datos_pagos')
        {
            alert('No permitido: Agregar hasta el final de la lista.');
            return false;
        }
        else
        {
            return true;    
        }
        //Valida Importe
        var _cantidad = returnNumber(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_importe'));
		if(_cantidad > 0)
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_importe','T',false,false);
			return true;
		}
		else
		{
			nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_val_ok_importe','F',false,false);
			return false;
		}
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_ValidateDelete(type)
{
	try
	{
		if(type=='custpage_datos_pagos')
		{
			var _pago_id 	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_pago_id'));
			if(_pago_id=='')
			{
				var total			= returnNumber(nlapiGetFieldValue('total'));
				var lines			= nlapiGetLineItemCount('custpage_datos_pagos');
				var _total_pagado	= 0;
				for(var i=1;i<=lines;i++)
				{
					var _importe 		= returnNumber(nlapiGetLineItemValue('custpage_datos_pagos' , 'custpage_importe',i));
					_total_pagado	   += _importe; 
				}
				var _total_a_pagar 	= total - _total_pagado;
				nlapiSetFieldValue('custbody_total_pagado' ,  _total_pagado, false , false);
				nlapiSetFieldValue('custbody_total_a_pagar' , _total_a_pagar , false , false);
				return true;
			}
			else
			{
				alert('No permitido: este pago ya ha sido registrado.');
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
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
function MultiplesPagos_Recalc(type)
{
	try
	{
		if(type == 'custpage_datos_pagos')
		{
			var total			= returnNumber(nlapiGetFieldValue('total'));
			var lines			= nlapiGetLineItemCount('custpage_datos_pagos');
			var _total_pagado	= 0;
			for(var i=1;i<=lines;i++)
			{
				var _importe 		= returnNumber(nlapiGetLineItemValue('custpage_datos_pagos' , 'custpage_importe',i));
				_total_pagado	   += _importe; 
			}
			var _total_a_pagar 	= total - _total_pagado;
			nlapiSetFieldValue('custbody_total_pagado' ,  _total_pagado, false , false);
			nlapiSetFieldValue('custbody_total_a_pagar' , _total_a_pagar , false , false);
		}
	}
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
    	alert(megerror);
    }
}
// --- Helpers ---
//---
function clientProcesarPagos()
{
    var returnedData = new Array();
    var i			 = 1;
    var _metodo_pago = new Array(); 
    var _num_cuenta	 = new Array(); 
    try
    {
        var recordId           	= nlapiGetRecordId();
        var entity             	= nlapiGetFieldValue('entity');
        var lineas          	= nlapiGetLineItemCount('custpage_datos_pagos');
        var customerPayment 	= new Object();
        for(i=1;i<=lineas;i++)
        {
            nlapiSelectLineItem('custpage_datos_pagos', i);
            var _forma_tipo_de_pago    = returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago'));
            if(_forma_tipo_de_pago != '')
            {
            	var _pago_id      							= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_pago_id'));
                var _cuenta     							= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_cuenta'));
                var _forma_tipo_de_pago_metodo_pago			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago_metodo_pago'));
                var _forma_tipo_de_pago_metodo_pago_text	= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago_metodo_pago_text'));
                var _forma_tipo_de_pago_num_cuenta			= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_forma_tipo_de_pago_num_cuenta'));
                var _fecha_pago     						= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_pago'));
                var _num_tarjeta     						= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_tarjeta'));
                var _fecha_vencimiento  					= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_fecha_vencimiento'));
                var _num_autorizacion 						= returnBlank(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_num_autorizacion'));
                var _importe     							= returnNumber(nlapiGetCurrentLineItemValue('custpage_datos_pagos','custpage_importe'));
                var _num_tarjetaLongitud					= _num_tarjeta.length;
                var indiceInicial							= _num_tarjetaLongitud - 4 ;
                var indiceFinal								= _num_tarjetaLongitud;
                var ultimosDigitos							= _num_tarjeta.slice(indiceInicial,indiceFinal);
                var asteriscos								= '';
                for(var c=1;c<=indiceInicial;c++)
                {
                	asteriscos += '*';
                }
                var _num_tarjetaEncrypted			= asteriscos + ultimosDigitos;
                if(_forma_tipo_de_pago_num_cuenta == 'XXXX')
                {
                	_forma_tipo_de_pago_num_cuenta	= ultimosDigitos;
                }
                if(_pago_id == '')
                { 
                	customerPayment = nlapiCreateRecord('customerpayment');  
                }
                else
                { 
                	customerPayment = nlapiLoadRecord('customerpayment',_pago_id);
                }
                customerPayment.setFieldValue('customer',entity);
                customerPayment.setFieldValue('undepfunds','F');
                customerPayment.setFieldValue('account',_cuenta);
                customerPayment.setFieldValue('autoapply','F');
                customerPayment.setFieldValue('payment',_importe);
                customerPayment.setFieldValue('trandate',_fecha_pago);
                customerPayment.setFieldValue('custbody_aplicacion_automatica','T');
              	customerPayment.setFieldValue('custbody_numero_autorizacion',_num_autorizacion);
              	customerPayment.setFieldValue('custbody_forma_tipo_de_pago',_forma_tipo_de_pago);
              	customerPayment.setFieldValue('custbody_num_cuenta',_forma_tipo_de_pago_num_cuenta);
              	customerPayment.setFieldValue('custbody_metodo_de_pago',_forma_tipo_de_pago_metodo_pago);
              	customerPayment.setFieldValue('custbody_mp_orden_venta_relacionada',recordId);
                if(_forma_tipo_de_pago_metodo_pago == 4)
                {
                    customerPayment.setFieldValue('creditcardprocessor',2);
                    customerPayment.setFieldValue('ccexpiredate',_fecha_vencimiento);
                    customerPayment.setFieldValue('ccnumber',_num_tarjetaEncrypted);
                }
                var IDPAGO 	= nlapiSubmitRecord(customerPayment);
                _metodo_pago.push(_forma_tipo_de_pago_metodo_pago_text); 
                _num_cuenta.push(_forma_tipo_de_pago_num_cuenta); 
                nlapiSetCurrentLineItemValue('custpage_datos_pagos','custpage_pago_id',IDPAGO,false,false);
                nlapiCommitLineItem('custpage_datos_pagos');
            }
        }        
        returnedData.push(true);
        returnedData.push('Registros de Pagos Realizado con éxito');
        returnedData.push(i);
        returnedData.push(_metodo_pago.join());
        returnedData.push(_num_cuenta.join());
        return returnedData;
    }
    catch(e)
    {
    	var megerror	= "Ha ocurrido un error, debido a las siguientes razones:";
        if ( e instanceof nlobjError )
        {
        	var ecode 			= returnBlank(e.getCode());
        	var edetails 		= returnBlank(e.getDetails());
        	var eid 			= returnBlank(e.getId());
        	megerror 			+= "\n\n" + "Error Code: " 		+ ecode;
        	megerror 			+= "\n\n" + "Error Details: " 	+ edetails;
        	megerror 			+= "\n\n" + "Error ID: "		+ eid;
        }
        else
        {
        	var errorString	 = e.toString();
        	megerror 		+= "\n\n" + "Unexpected Error: " + errorString;
        }
        megerror += "\n\nConsulte a Soporte Técnico y mueste este mensaje.";
        megerror += "\n\nPuede continuar navegando en NetSuite";
        returnedData.push(false);
        returnedData.push('Verifique la información en la línea ' + i + ' de la pestaña \"Múltiples Pagos\"\n\n' + (megerror));
        returnedData.push(i);
        returnedData.push(_metodo_pago.join());
        returnedData.push(_num_cuenta.join());
        alert(returnedData[1]);
        return returnedData;
    }
}