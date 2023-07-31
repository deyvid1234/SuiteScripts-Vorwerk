function cicloCliente(type, name, linenum) 
{
	try
	{
	if (name == 'custrecord_imr_serie') 
	{
		var serie 	= nlapiGetFieldValue('custrecord_imr_serie');
		//serie	= serie.toString();
		var tipo 	= nlapiGetFieldValue('custrecord_imr_tipociclo');
		var fecha	= nlapiGetFieldValue('custrecord_imr_fecha');
		var id			= '';
		var entityId	= '';
		//var lider		= '';
		var conta		= '';
		var factura 	= '';
		var fechfac 	= '';
		var prese 		= '';
		var geren	 	= '';
		var correo 		= '';
		var dir 		= '';
		var tel		 	= '';

		if (serie != '') 
		{
			var filters = new Array();
			filters.push(new nlobjSearchFilter('serialnumber', null, 'is', serie));
			var resultado = returnBlank(nlapiSearchRecord('salesorder', 'customsearch664', filters, null));
			if (resultado == '') 
			{
				nlapiSetFieldValue('custrecord_imr_serie', '');
			}
			else
			{
				id 				= nlapiEscapeXML(returnBlank(resultado[0].getValue('serialnumber')));
				entityId 		= nlapiEscapeXML(returnBlank(resultado[0].getValue('entityid', 'contactPrimary')));
				factura 		= nlapiEscapeXML(returnBlank(resultado[0].getText('billingtransaction')));
				fechfac 		= nlapiEscapeXML(returnBlank(resultado[0].getValue('trandate','billingTransaction')));
				lider 			= nlapiEscapeXML(returnBlank(resultado[0].getText('supervisor', 'salesRep'))); 
				prese 			= nlapiEscapeXML(returnBlank(resultado[0].getText('salesrep'))); 
				geren 			= nlapiEscapeXML(returnBlank(resultado[0].getText('custentity_gervta')));
				conta 			= nlapiEscapeXML(returnBlank(resultado[0].getText('entityid', 'contactPrimary')));
				if(conta != '') 
				{
					correo 	= nlapiEscapeXML(returnBlank(resultado[0].getValue('email', 'contactPrimary')));
					dir 	= nlapiEscapeXML(returnBlank(resultado[0].getValue('address', 'contactPrimary')));
					tel 	= nlapiEscapeXML(returnBlank(resultado[0].getValue('phone', 'contactPrimary')));
				}
				if (conta == '') 
				{
					conta = nlapiEscapeXML(returnBlank(resultado[0].getText('custbodycontacto1')));
					entityId = nlapiEscapeXML(returnBlank(resultado[0].getValue('custbodycontacto1')));
					if(conta != '') 
					{
						correo = nlapiEscapeXML(returnBlank(resultado[0].getValue('custbodycontacto3')));
						dir = nlapiEscapeXML(returnBlank(resultado[0].getValue('custbodycontacto2')));
						tel = nlapiEscapeXML(returnBlank(resultado[0].getValue('custbodycontacto4')));
					}
					else 
					{
						conta = nlapiEscapeXML(returnBlank(resultado[0].getText('entity')));
						entityId = nlapiEscapeXML(returnBlank(resultado[0].getValue('entity')));
					}
				}
			
				var filters	= new Array();
				conta = getName(conta);
				filters.push(new nlobjSearchFilter('internalid', null, 'is', entityId));
				var columns = new Array();
				columns.push(new nlobjSearchColumn('internalid'));
				columns.push(new nlobjSearchColumn('altname'));
				customer		= returnBlank(nlapiSearchRecord('customer', null, filters, columns));
				entityId		= customer[0].getValue('internalid');
				
				if (tipo == 3) 
				{
					nlapiSubmitField('customer', entityId, 'custentity_imr_spostvta', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_f1seguimiento', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_contacto1s', conta);
				}
				if (tipo == 4) 
				{
					nlapiSubmitField('customer', entityId, 'custentity_imr_asistccocina', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_feclasec', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_contactocc', conta);
				}
				if (tipo == 5) 
				{
					nlapiSubmitField('customer', entityId, 'custentity_imr_svisita', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_f2visita', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_contacto2v', conta);
				}
				if (tipo == 6) 
				{
					nlapiSubmitField('customer', entityId, 'custentity_imr_propreclut', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_fpreclutamiento', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_contactopr', conta);
				}
				if (tipo == 7) 
				{
					nlapiSubmitField('customer', entityId, 'custentity_imr_encuesta', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_fencuestas', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_contactoes', conta);
				}
				if (tipo == 8) 
				{
					nlapiSubmitField('customer', entityId, 'custentity_imr_cteent', 'T');
					nlapiSubmitField('customer', entityId, 'custentity_imr_ctefent', fecha);
					nlapiSubmitField('customer', entityId, 'custentity_imr_ctecent', conta);
				}
				nlapiSetFieldValue('custrecord_imr_identificador', id);
				nlapiSetFieldValue('custrecord_imr_factura', factura);
				nlapiSetFieldValue('custrecord_imr_fechafactura', fechfac);  
				nlapiSetFieldValue('custrecord_imr_telcontacto', tel);
				nlapiSetFieldValue('custrecord_imr_mailcontact', correo);
				nlapiSetFieldValue('custrecord_imr_dircontacto', dir);
				nlapiSetFieldValue('custrecord_imr_contacto', conta);
				nlapiSetFieldValue('custrecord_imr_liderequipo', lider);
				nlapiSetFieldValue('custrecord_imr_presentadora', prese);
				nlapiSetFieldValue('custrecord_imr_gerente', geren);
			}
		}
	}
	}
	catch(e)
	{
		Generic_HE_Catch_CT(e);
	}
}

// ------------------ Validaciones / Elimina duplicados ---------------//

function getName(conta)
{
	var cus = conta.split(' ');
	var cust = '';
	for(var a = 1; a<cus.length; a++)
	{
	cust += cus[a] + ' ';
	}
	cust = cust.substring(0, cust.length-1);
	return cust;
}

/*function returnBlank(cad) {
	return cad == null || cad == undefined ? '' : cad;
}
Array.prototype.deleteDuplicateElements = function(a) {
	return this.filter(function(elm, i, array) {
		return (array.indexOf(elm, i + 1) < 0);
	});
	return this.filter(function(elm, i, array) {
		if (this.indexOf(elm) < 0) {
			this.push(elm);
			return true;
		}
		return false;
	}, []);
};*/
